/**
 * Общий поставщик тестовых учётных записей.
 *
 * Один модуль для vitest, tsx-скриптов и Playwright.
 *
 * Жёсткие правила:
 *  - модуль отказывается работать, если `NODE_ENV !== "test"` и `TEST_FIXTURES !== "1"`;
 *  - пароли генерируются в рантайме (randomBytes) и никогда не попадают
 *    ни на диск, ни в логи, ни в сообщения об ошибках;
 *  - учётные записи создаются только реальными путями приложения:
 *    `auth.login` основателя → `users.create` → первый `auth.login` по временному
 *    паролю → `auth.completeOnboarding` с постоянным паролем;
 *  - в режиме "memory" в `process.env` кладётся хеш СЛУЧАЙНОГО пароля основателя,
 *    посчитанный тем же алгоритмом scrypt, что и в продакшене. Литералов секретов
 *    в этом файле нет;
 *  - учётные записи создаются по нику, а не по адресу электронной почты: так
 *    `createManagedUser` не вызывает `EmailProvider.sendOtpEmail`, который печатает
 *    временный пароль в stdout.
 *
 * Два режима:
 *  - `memory` — приложение вызывается внутрипроцессно через tRPC-caller.
 *    Так работают vitest и tsx-скрипты.
 *  - `http` — приложение уже запущено, вызовы идут по HTTP на `baseUrl`.
 *    Так работает Playwright. Пароль основателя задаётся серверу снаружи,
 *    поэтому helper читает его из `TEST_FOUNDER_PASSWORD` и без него отказывается
 *    работать: придумать пароль за уже запущенный сервер невозможно.
 */

import { randomBytes, scryptSync } from "node:crypto";
import type { User } from "../../drizzle/schema";
import { FOUNDER_EMAIL } from "../founderIdentity";

export type TestRole = "founder" | "super_admin" | "admin" | "marketing" | "teacher" | "student";

/** Роли, которые реально создаются через API. Основатель — единственный, кто существует всегда. */
export const MANAGED_TEST_ROLES = ["super_admin", "admin", "marketing", "teacher", "student"] as const;
export type ManagedTestRole = (typeof MANAGED_TEST_ROLES)[number];

export type TestAccount = {
  readonly role: TestRole;
  readonly email: string;
  readonly password: string;
  readonly userId: number | null;
};

export type TestSession = {
  readonly account: TestAccount;
  readonly token: string;
  readonly user: User;
};

export type TestAccountsMode = "memory" | "http";

export type CreateTestAccountsOptions = {
  mode?: TestAccountsMode;
  /** Только для режима "http". */
  baseUrl?: string;
  /** По умолчанию — все роли из MANAGED_TEST_ROLES. */
  roles?: readonly ManagedTestRole[];
};

export type TestAccounts = {
  readonly mode: TestAccountsMode;
  readonly founder: TestAccount;
  /** Учётная запись по роли. Для роли founder вернёт сессию основателя. */
  get(role: TestRole): TestAccount;
  /** Основатель + все созданные управляемые роли. */
  all(): readonly TestAccount[];
  /** Дополнительная учётная запись той же роли (для проверок коллизий и списков). */
  createExtra(role: ManagedTestRole, label?: string): Promise<TestAccount>;
  /** Реальный вход по учётным данным, выданным helper'ом. */
  login(role: TestRole): Promise<TestSession>;
  /** Вход по произвольной учётной записи helper'а. */
  loginAs(account: TestAccount): Promise<TestSession>;
  /** Удаляет все созданные управляемые учётные записи и восстанавливает окружение. */
  cleanup(): Promise<void>;
};

const DEFAULT_BASE_URL = "http://127.0.0.1:3000";

/* ------------------------------------------------------------------ */
/* Предохранители и генерация секретов                                 */
/* ------------------------------------------------------------------ */

export function fixturesAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === "test" || env.TEST_FIXTURES === "1";
}

export function assertFixturesAllowed(env: NodeJS.ProcessEnv = process.env): void {
  if (!fixturesAllowed(env)) {
    throw new Error(
      "createTestAccounts() is disabled outside tests: set NODE_ENV=test (vitest) or TEST_FIXTURES=1 (Playwright dev run).",
    );
  }
}

function randomPassword(): string {
  // 32 символа base64url: без кавычек и без "$", длиннее любого минимума в схемах.
  return randomBytes(24).toString("base64url");
}

function randomLabel(): string {
  return randomBytes(4).toString("hex");
}

/** Тот же алгоритм, что и в server/userAuth.ts. */
function makePasswordHash(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

/** Безопасное описание учётной записи: без пароля. Годится для логов и отчётов. */
export function describeAccount(account: TestAccount): {
  role: TestRole;
  email: string;
  userId: number | null;
  passwordLength: number;
} {
  return {
    role: account.role,
    email: account.email,
    userId: account.userId,
    passwordLength: account.password.length,
  };
}

/* ------------------------------------------------------------------ */
/* Внутренний контракт провайдера                                      */
/* ------------------------------------------------------------------ */

type Provisioner = {
  readonly founder: TestAccount;
  create(role: ManagedTestRole, label: string): Promise<TestAccount>;
  remove(account: TestAccount): Promise<void>;
  openSession(account: TestAccount): Promise<TestSession>;
  dispose(): Promise<void>;
};

async function buildAccounts(
  mode: TestAccountsMode,
  provisioner: Provisioner,
  requestedRoles: readonly ManagedTestRole[],
): Promise<TestAccounts> {
  const created: TestAccount[] = [];
  for (const role of Array.from(new Set(requestedRoles))) {
    created.push(await provisioner.create(role, randomLabel()));
  }

  const byRole = new Map<TestRole, TestAccount>([["founder", provisioner.founder]]);
  for (const account of created) byRole.set(account.role, account);

  let cleanedUp = false;

  const get = (role: TestRole): TestAccount => {
    const found = byRole.get(role);
    if (!found) throw new Error(`Тестовая учётная запись для роли "${role}" не создавалась.`);
    return found;
  };

  return {
    mode,
    founder: provisioner.founder,
    get,
    all: () => [provisioner.founder, ...created],
    createExtra: async (role, label) => {
      const account = await provisioner.create(role, label ?? randomLabel());
      created.push(account);
      byRole.set(role, account);
      return account;
    },
    login: role => provisioner.openSession(get(role)),
    loginAs: account => provisioner.openSession(account),
    cleanup: async () => {
      if (cleanedUp) return;
      cleanedUp = true;
      for (const account of [...created].reverse()) {
        try {
          await provisioner.remove(account);
        } catch (error) {
          // Уборка не должна маскировать исходную ошибку теста.
          console.warn(`[testing/accounts] не удалось удалить тестовую учётную запись ${account.email}:`, error);
        }
      }
      await provisioner.dispose();
    },
  };
}

/* ------------------------------------------------------------------ */
/* Режим "memory": внутрипроцессный tRPC                               */
/* ------------------------------------------------------------------ */

async function memoryProvisioner(): Promise<Provisioner> {
  const [{ appRouter }, { sdk }] = await Promise.all([import("../routers"), import("../_core/sdk")]);

  const previousHash = process.env.FOUNDER_PASSWORD_HASH;
  const founderPassword = randomPassword();
  process.env.FOUNDER_PASSWORD_HASH = makePasswordHash(founderPassword);

  const req = { headers: {}, protocol: "http" } as never;
  const res = { cookie: () => {}, clearCookie: () => {} } as never;
  const callerFor = (user: User | null) => appRouter.createCaller({ user, req, res });

  const publicCaller = callerFor(null);
  const founderLogin = await publicCaller.auth.login({ email: FOUNDER_EMAIL, password: founderPassword });
  const founderUser = (await sdk.authenticateRequest({
    headers: { authorization: `Bearer ${founderLogin.token}` },
  })) as User;
  const founderCaller = callerFor(founderUser);

  async function openSession(account: TestAccount): Promise<TestSession> {
    const login = await publicCaller.auth.login({ email: account.email, password: account.password });
    if (!login.success) throw new Error(`Тестовый вход не удался для ${account.email}.`);
    const user = (await sdk.authenticateRequest({
      headers: { authorization: `Bearer ${login.token}` },
    })) as User;
    return { account, token: login.token, user };
  }

  return {
    founder: { role: "founder", email: FOUNDER_EMAIL, password: founderPassword, userId: founderUser.id ?? null },
    async create(role, label) {
      const nickname = `t${label}${role}`;
      const created = await founderCaller.users.create({
        name: `Test ${role} ${label}`,
        nickname,
        role,
        isActive: true,
        password: randomPassword(),
      });

      const email = created.generatedEmail;
      // Первый вход по выданному паролю: сессия ограничена онбордингом.
      const firstLogin = await publicCaller.auth.login({ email, password: created.tempPassword });
      if (!firstLogin.isRestricted) throw new Error(`Учётная запись ${email} не помечена как временная (OTP).`);

      // Постоянный пароль задаётся штатным онбордингом — после него сессия полная.
      const restrictedUser = (await sdk.authenticateRequest({
        headers: { authorization: `Bearer ${firstLogin.token}` },
      })) as User;
      const permanent = randomPassword();
      await callerFor(restrictedUser).auth.completeOnboarding({ password: permanent, profileValues: {} });

      return { role, email, password: permanent, userId: created.id };
    },
    async remove(account) {
      if (account.userId === null) return;
      await founderCaller.users.remove({ id: account.userId });
    },
    openSession,
    async dispose() {
      if (previousHash === undefined) delete process.env.FOUNDER_PASSWORD_HASH;
      else process.env.FOUNDER_PASSWORD_HASH = previousHash;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Режим "http": приложение уже запущено                                */
/* ------------------------------------------------------------------ */

type HttpEntry = { result?: { data?: { json?: unknown } }; error?: { json?: { message?: string; code?: number } } };

async function httpCall<T>(baseUrl: string, path: string, input: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}/api/trpc/${path}?batch=1`, {
    method: "POST",
    headers,
    body: JSON.stringify({ "0": { json: input } }),
  });
  const payload = (await response.json()) as HttpEntry[] | HttpEntry;
  const entry = Array.isArray(payload) ? payload[0] : payload;
  if (entry?.error) {
    // В сообщение попадают только код и текст: входные данные (пароли) не печатаем.
    throw new Error(
      `tRPC ${path} failed (code ${entry.error.json?.code ?? "?"}): ${entry.error.json?.message ?? "unknown"}`,
    );
  }
  return entry?.result?.data?.json as T;
}

async function httpProvisioner(baseUrl: string): Promise<Provisioner> {
  const founderPassword = process.env.TEST_FOUNDER_PASSWORD;
  if (!founderPassword) {
    throw new Error(
      "Режим http требует TEST_FOUNDER_PASSWORD: пароль основателя задаётся серверу снаружи и не может быть придуман helper'ом.",
    );
  }

  const founderLogin = await httpCall<{ token: string }>(baseUrl, "auth.login", {
    email: FOUNDER_EMAIL,
    password: founderPassword,
  });
  const founderToken = founderLogin.token;
  const founderUser = await httpCall<User>(baseUrl, "auth.me", null, founderToken);
  if (!founderUser || founderUser.role !== "founder") {
    throw new Error("Режим http: вход основателя не дал роль founder.");
  }

  async function openSession(account: TestAccount): Promise<TestSession> {
    const login = await httpCall<{ token: string }>(baseUrl, "auth.login", {
      email: account.email,
      password: account.password,
    });
    const user = await httpCall<User>(baseUrl, "auth.me", null, login.token);
    return { account, token: login.token, user };
  }

  return {
    founder: { role: "founder", email: FOUNDER_EMAIL, password: founderPassword, userId: founderUser.id ?? null },
    async create(role, label) {
      const nickname = `t${label}${role}`;
      const created = await httpCall<{ id: number; generatedEmail: string; tempPassword: string }>(
        baseUrl,
        "users.create",
        { name: `Test ${role} ${label}`, nickname, role, isActive: true, password: randomPassword() },
        founderToken,
      );
      const firstLogin = await httpCall<{ token: string; isRestricted: boolean }>(baseUrl, "auth.login", {
        email: created.generatedEmail,
        password: created.tempPassword,
      });
      if (!firstLogin.isRestricted) {
        throw new Error(`Учётная запись ${created.generatedEmail} не помечена как временная (OTP).`);
      }
      const permanent = randomPassword();
      await httpCall(baseUrl, "auth.completeOnboarding", { password: permanent, profileValues: {} }, firstLogin.token);
      return { role, email: created.generatedEmail, password: permanent, userId: created.id };
    },
    async remove(account) {
      if (account.userId === null) return;
      await httpCall(baseUrl, "users.remove", { id: account.userId }, founderToken);
    },
    openSession,
    async dispose() {
      /* Сервер живёт дольше helper'а: восстанавливать нечего. */
    },
  };
}

/* ------------------------------------------------------------------ */
/* Точка входа                                                         */
/* ------------------------------------------------------------------ */

/**
 * Создаёт основателя и по учётной записи на каждую управляемую роль.
 * Обязательно вызывать `cleanup()` (например, в `afterEach`).
 */
export async function createTestAccounts(options: CreateTestAccountsOptions = {}): Promise<TestAccounts> {
  assertFixturesAllowed();
  const mode: TestAccountsMode = options.mode ?? "memory";
  const baseUrl = options.baseUrl ?? process.env.TEST_BASE_URL ?? process.env.DSH_BASE_URL ?? DEFAULT_BASE_URL;
  const roles = options.roles ?? MANAGED_TEST_ROLES;
  const provisioner = mode === "http" ? await httpProvisioner(baseUrl) : await memoryProvisioner();
  return buildAccounts(mode, provisioner, roles);
}
