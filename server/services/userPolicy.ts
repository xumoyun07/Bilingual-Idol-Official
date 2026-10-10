/**
 * Единая политика учётных записей.
 *
 * Правила (единственный источник истины для всего сервера):
 *  1. Основатель ровно один. Его нельзя создать ни одним путём, кроме сида из
 *     окружения, нельзя назначить сменой роли (даже самому основателю), нельзя
 *     понизить, заблокировать, деактивировать или удалить.
 *  2. E-mail основателя меняется только через переменную окружения FOUNDER_EMAIL,
 *     а не через процедуры управления пользователями. Любая попытка задать чужой
 *     учётной записи адрес основателя отклоняется с обезличенным сообщением.
 *  3. E-mail уникален без учёта регистра и с обрезкой пробелов на каждом пути
 *     создания и обновления.
 *  4. Инвариант старта: ровно одна учётная запись с ролью founder и её адрес
 *     равен FOUNDER_EMAIL. Если инвариант нарушен — управление пользователями
 *     полностью заблокировано (fail closed), в лог уходит запись без значений.
 *  5. Каждая отклонённая попытка пишется в журнал аудита: актор, действие и
 *     целевая роль. Никаких секретов, адресов и значений полей.
 *
 * Модуль намеренно не импортирует ./db и ./audit на верхнем уровне: оба
 * загружаются лениво внутри вызовов, чтобы не создавать цикл импортов.
 */

import type { Request } from "express";
import { FOUNDER_EMAIL, normalizeEmail } from "../founderIdentity";

export const FOUNDER_ROLE = "founder";

/** Обезличенное сообщение для всех нарушений, связанных с основателем. */
export const GENERIC_FOUNDER_MESSAGE = "This account action is not available.";
/** Сообщение о дубликате адреса. */
export const DUPLICATE_EMAIL_MESSAGE = "An account with this email or nickname already exists.";
/** Сообщение о сломанном инварианте. */
export const INVARIANT_MESSAGE = "User management is temporarily unavailable. Please contact the platform owner.";

export type UserPolicyViolation =
  | "founder_is_unique"
  | "founder_email_reserved"
  | "founder_immutable"
  | "founder_email_immutable"
  | "role_change_to_founder"
  | "duplicate_email"
  | "startup_invariant";

export type PolicyUserRow = { id: number; email: string | null; role: string };
export type PolicyActor = { id: number; role: string } | null | undefined;

export type PolicyRequestContext = {
  /** Имя процедуры или функции — попадает в аудит как «действие». */
  path: string;
  actor?: PolicyActor;
  request?: Pick<Request, "headers" | "ip" | "socket">;
};

export type PolicyDecision = { allowed: true } | { allowed: false; violation: UserPolicyViolation; message: string };

const ALLOWED: PolicyDecision = { allowed: true };

export class UserPolicyError extends Error {
  readonly violation: UserPolicyViolation;
  constructor(violation: UserPolicyViolation, message: string) {
    super(message);
    this.name = "UserPolicyError";
    this.violation = violation;
  }
}

function deny(violation: UserPolicyViolation, message: string): PolicyDecision {
  return { allowed: false, violation, message };
}

/** Нормализация адреса для сравнения: trim + нижний регистр. */
export function policyEmail(email: string | null | undefined): string {
  return normalizeEmail(email);
}

/** Является ли учётная запись основателем по роли или по адресу. */
export function isFounderAccount(row: Pick<PolicyUserRow, "email" | "role"> | null | undefined): boolean {
  if (!row) return false;
  return row.role === FOUNDER_ROLE || policyEmail(row.email) === FOUNDER_EMAIL;
}

/* ------------------------------------------------------------------ */
/* Чистые решения — их проверяют юнит-тесты                            */
/* ------------------------------------------------------------------ */

export function decideCreateUser(input: {
  role?: string | null;
  email?: string | null;
  duplicate?: PolicyUserRow | null;
}): PolicyDecision {
  if (input.role === FOUNDER_ROLE) {
    return deny("founder_is_unique", GENERIC_FOUNDER_MESSAGE);
  }
  if (input.email && policyEmail(input.email) === FOUNDER_EMAIL) {
    return deny("founder_email_reserved", GENERIC_FOUNDER_MESSAGE);
  }
  if (input.duplicate) {
    return deny("duplicate_email", DUPLICATE_EMAIL_MESSAGE);
  }
  return ALLOWED;
}

export function decideUpdateUser(input: {
  target: PolicyUserRow;
  nextRole?: string | null;
  nextEmail?: string | null;
  nextIsActive?: boolean;
  duplicate?: PolicyUserRow | null;
}): PolicyDecision {
  const { target, nextRole, nextEmail, nextIsActive, duplicate } = input;
  const normalisedNextEmail = nextEmail === undefined || nextEmail === null ? null : policyEmail(nextEmail);
  const currentEmail = policyEmail(target.email);

  if (isFounderAccount(target)) {
    if (nextRole !== undefined && nextRole !== FOUNDER_ROLE) {
      return deny("founder_immutable", GENERIC_FOUNDER_MESSAGE);
    }
    if (nextIsActive === false) {
      return deny("founder_immutable", GENERIC_FOUNDER_MESSAGE);
    }
    if (normalisedNextEmail !== null && normalisedNextEmail !== FOUNDER_EMAIL) {
      return deny("founder_email_immutable", GENERIC_FOUNDER_MESSAGE);
    }
    return ALLOWED;
  }

  if (nextRole === FOUNDER_ROLE) {
    return deny("role_change_to_founder", GENERIC_FOUNDER_MESSAGE);
  }
  if (normalisedNextEmail !== null && normalisedNextEmail === FOUNDER_EMAIL) {
    return deny("founder_email_reserved", GENERIC_FOUNDER_MESSAGE);
  }
  if (duplicate && duplicate.id !== target.id) {
    return deny("duplicate_email", DUPLICATE_EMAIL_MESSAGE);
  }
  if (currentEmail === FOUNDER_EMAIL) {
    return deny("founder_immutable", GENERIC_FOUNDER_MESSAGE);
  }
  return ALLOWED;
}

export function decideDeleteUser(input: { target: PolicyUserRow }): PolicyDecision {
  if (isFounderAccount(input.target)) {
    return deny("founder_immutable", GENERIC_FOUNDER_MESSAGE);
  }
  return ALLOWED;
}

/** Сброс пароля и выпуск временного OTP: на учётной записи основателя запрещён. */
export function decidePasswordReset(input: { target: PolicyUserRow }): PolicyDecision {
  if (isFounderAccount(input.target)) {
    return deny("founder_immutable", GENERIC_FOUNDER_MESSAGE);
  }
  return ALLOWED;
}

/* ------------------------------------------------------------------ */
/* Политика удаления: без зависимостей — жёсткое, с зависимостями — отказ */
/* ------------------------------------------------------------------ */

/**
 * Таблицы и колонки, ссылающиеся на пользователя. Внешних ключей в схеме нет
 * (0 ограничений), поэтому зависимости считаем кодом. Список — из инвентаризации
 * A2 и покрывает все реальные ссылки на users.id.
 */
export const DEPENDENT_COLUMNS: ReadonlyArray<{ table: string; column: string }> = [
  { table: "studentProfiles", column: "userId" },
  { table: "studentDocuments", column: "studentId" },
  { table: "studentDocuments", column: "uploadedByUserId" },
  { table: "studentProfileHistory", column: "studentId" },
  { table: "studentProfileHistory", column: "actorUserId" },
  { table: "enrollments", column: "userId" },
  { table: "enrollments", column: "approvedByUserId" },
  { table: "payments", column: "userId" },
  { table: "placementTestAttempts", column: "userId" },
  { table: "classSessions", column: "studentId" },
  { table: "classSessions", column: "teacherId" },
  { table: "attendanceRecords", column: "studentId" },
  { table: "attendanceRecords", column: "markedByTeacherId" },
  { table: "grades", column: "studentId" },
  { table: "grades", column: "gradedByTeacherId" },
  { table: "applications", column: "userId" },
  { table: "userProfileValues", column: "userId" },
  { table: "auditLogs", column: "actorUserId" },
  { table: "auditLogArchives", column: "actorUserId" },
  { table: "auditLogArchives", column: "archivedByUserId" },
  { table: "programs", column: "teacherId" },
  { table: "publicMedia", column: "createdByUserId" },
  { table: "registrationSubmissions", column: "assignedToUserId" },
  { table: "mediaAssets", column: "uploadedByUserId" },
  { table: "audienceSegments", column: "createdByUserId" },
  { table: "events", column: "createdByUserId" },
  { table: "blogPosts", column: "authorId" },
  // Согласованные цены и связь платежа с ценой: финансовую историю не удаляем,
  // поэтому пользователь с ними деактивируется, а не удаляется жёстко.
  { table: "studentPrices", column: "studentId" },
  { table: "studentPrices", column: "agreedBy" },
  { table: "studentPrices", column: "supersededById" },
  { table: "payments", column: "priceId" },
];

/** Строки, которые принадлежат самому профилю студента и удаляются вместе с ним. */
export const STUDENT_PROFILE_OWN_COLUMNS = ["studentProfiles.userId", "studentDocuments.studentId", "studentProfileHistory.studentId"];

export type DependencyCounts = { perTable: Record<string, number>; total: number };

export const DEACTIVATION_MESSAGE =
  "This account has dependent records and cannot be hard-deleted. It has been deactivated instead.";

export type DeletionDecision =
  | { action: "hard_delete" }
  | { action: "deactivate"; total: number; perTable: Record<string, number>; message: string };

/**
 * Без зависимых строк — жёсткое удаление. С любыми зависимостями — отказ от
 * удаления и деактивация (каскадов нет: связанные данные не трогаем).
 */
export function decideDeletion(input: { dependents: DependencyCounts }): DeletionDecision {
  if (input.dependents.total === 0) return { action: "hard_delete" };
  return {
    action: "deactivate",
    total: input.dependents.total,
    perTable: input.dependents.perTable,
    message: DEACTIVATION_MESSAGE,
  };
}

/**
 * Разрешено ли формировать личность основателя при входе или OAuth-апсерте.
 * Роль founder выдаётся только точному адресу FOUNDER_EMAIL или его openId.
 */
export function decideFounderIdentity(input: { email?: string | null; openId?: string | null }): PolicyDecision {
  const looksLikeFounder =
    input.openId === `founder:${FOUNDER_EMAIL}` ||
    (input.openId ?? "").startsWith("founder:") ||
    (input.email ? policyEmail(input.email) === FOUNDER_EMAIL : false);
  if (!looksLikeFounder) return ALLOWED;
  const emailMatches = policyEmail(input.email) === FOUNDER_EMAIL;
  const openIdMatches = input.openId === `founder:${FOUNDER_EMAIL}`;
  if (!emailMatches && !openIdMatches) {
    return deny("founder_email_reserved", GENERIC_FOUNDER_MESSAGE);
  }
  return ALLOWED;
}

/** Сид из окружения — единственный путь, которому позволено создать основателя. */
export function decideSeedFounder(input: { email?: string | null; role?: string | null }): PolicyDecision {
  if (input.role !== FOUNDER_ROLE) return deny("founder_is_unique", GENERIC_FOUNDER_MESSAGE);
  if (policyEmail(input.email) !== FOUNDER_EMAIL) return deny("founder_email_reserved", GENERIC_FOUNDER_MESSAGE);
  return ALLOWED;
}

/* ------------------------------------------------------------------ */
/* Загрузка данных (ленивые импорты, чтобы не ломать граф модулей)      */
/* ------------------------------------------------------------------ */

type FounderRow = { id: number; email: string | null; role: string };

async function loadFounderRows(): Promise<FounderRow[]> {
  const dbModule = await import("../db");
  const database = await dbModule.getDb();
  if (!database) {
    return dbModule.inMemoryStore.users
      .filter(user => user.role === FOUNDER_ROLE)
      .map(user => ({ id: user.id, email: user.email ?? null, role: user.role }));
  }
  const { users } = await import("../../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  return database
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.role, FOUNDER_ROLE));
}

async function loadUserById(id: number): Promise<PolicyUserRow | null> {
  const dbModule = await import("../db");
  const database = await dbModule.getDb();
  if (!database) {
    const found = dbModule.inMemoryStore.users.find(user => user.id === id);
    return found ? { id: found.id, email: found.email ?? null, role: found.role } : null;
  }
  const { users } = await import("../../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const rows = await database
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return rows[0] ?? null;
}

async function loadUserByEmail(email: string): Promise<PolicyUserRow | null> {
  const dbModule = await import("../db");
  const database = await dbModule.getDb();
  const normalised = policyEmail(email);
  if (!database) {
    const found = dbModule.inMemoryStore.users.find(user => policyEmail(user.email) === normalised);
    return found ? { id: found.id, email: found.email ?? null, role: found.role } : null;
  }
  const { users } = await import("../../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const rows = await database
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.email, normalised))
    .limit(1);
  return rows[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* Инвариант старта                                                    */
/* ------------------------------------------------------------------ */

export type FounderInvariantReport = {
  ok: boolean;
  founderCount: number;
  emailMatches: boolean;
  problems: string[];
};

let lastInvariantLogAt = 0;
const INVARIANT_LOG_INTERVAL_MS = 10_000;

/** Проверяет инвариант, не бросая исключение. Значения в лог не попадают. */
export async function inspectFounderInvariant(): Promise<FounderInvariantReport> {
  const founders = await loadFounderRows();
  const emailMatches = founders.length === 1 && policyEmail(founders[0]?.email) === FOUNDER_EMAIL;
  const problems: string[] = [];
  if (founders.length !== 1) problems.push(`founder_count=${founders.length}`);
  if (founders.length >= 1 && !emailMatches) problems.push("founder_email_mismatch");
  const ok = problems.length === 0;
  if (!ok) {
    const now = Date.now();
    if (now - lastInvariantLogAt > INVARIANT_LOG_INTERVAL_MS) {
      lastInvariantLogAt = now;
      console.error(
        `[userPolicy] Инвариант основателя нарушен (${problems.join(", ")}). ` +
          "Управление пользователями заблокировано. Ожидается ровно одна учётная запись с ролью founder и адресом из FOUNDER_EMAIL.",
      );
    }
  }
  return { ok, founderCount: founders.length, emailMatches, problems };
}

/**
 * Fail closed: если инвариант нарушен, ни одна мутация учётных записей не проходит.
 * Проверка выполняется при каждой мутации — кэш намеренно не используется.
 */
export async function assertUserManagementEnabled(ctx?: PolicyRequestContext): Promise<void> {
  const report = await inspectFounderInvariant();
  if (report.ok) return;
  await auditRejection(ctx, "startup_invariant", null);
  throw new UserPolicyError("startup_invariant", INVARIANT_MESSAGE);
}

/* ------------------------------------------------------------------ */
/* Аудит отклонённых попыток                                           */
/* ------------------------------------------------------------------ */

async function auditRejection(
  ctx: PolicyRequestContext | undefined,
  violation: UserPolicyViolation,
  targetRole: string | null,
): Promise<void> {
  try {
    const audit = await import("../audit");
    const { users } = await import("../../drizzle/schema");
    const role = targetRole as (typeof users.$inferSelect)["role"] | null;
    await audit.writeAuditEvent({
      actor: ctx?.actor ? { id: ctx.actor.id, role: ctx.actor.role as never } : { id: 0, role: "user" as never },
      request: ctx?.request,
      action: "user.policy_rejected",
      targetType: "user",
      targetRole: role,
      description: `Rejected user management attempt (${violation}).`,
      isSuccess: false,
      metadata: { violation, path: ctx?.path ?? "unknown" },
    });
  } catch {
    // Сбой аудита не должен превращаться в утечку: пишем только факт.
    console.error("[userPolicy] Не удалось записать событие аудита об отклонённой попытке. Отказ всё равно применён.");
  }
}

function rejection(targetRole: string | null) {
  return (decision: Extract<PolicyDecision, { allowed: false }>) => ({
    violation: decision.violation,
    targetRole,
    message: decision.message,
  });
}

async function applyDecision(
  ctx: PolicyRequestContext | undefined,
  decision: PolicyDecision,
  targetRole: string | null,
): Promise<void> {
  if (decision.allowed) return;
  const info = rejection(targetRole)(decision);
  await auditRejection(ctx, info.violation, info.targetRole);
  throw new UserPolicyError(info.violation, info.message);
}

/* ------------------------------------------------------------------ */
/* Точки принуждения — вызываются из каждого пути изменения пользователя */
/* ------------------------------------------------------------------ */

export async function enforceCreateUser(
  ctx: PolicyRequestContext,
  input: { role?: string | null; email?: string | null },
): Promise<void> {
  await assertUserManagementEnabled(ctx);
  const duplicate = input.email ? await loadUserByEmail(input.email) : null;
  const decision = decideCreateUser({ role: input.role, email: input.email, duplicate });
  await applyDecision(ctx, decision, input.role ?? null);
}

export async function enforceUpdateUser(
  ctx: PolicyRequestContext,
  input: { targetId: number; nextRole?: string | null; nextEmail?: string | null; nextIsActive?: boolean },
): Promise<void> {
  await assertUserManagementEnabled(ctx);
  const target = await loadUserById(input.targetId);
  if (!target) return; // несуществующая цель — за это отвечает вызывающий код
  let duplicate: PolicyUserRow | null = null;
  if (input.nextEmail !== undefined && input.nextEmail !== null && policyEmail(input.nextEmail) !== policyEmail(target.email)) {
    duplicate = await loadUserByEmail(input.nextEmail);
  }
  const decision = decideUpdateUser({
    target,
    nextRole: input.nextRole,
    nextEmail: input.nextEmail,
    nextIsActive: input.nextIsActive,
    duplicate,
  });
  await applyDecision(ctx, decision, input.nextRole ?? target.role);
}

export async function enforceDeleteUser(ctx: PolicyRequestContext, input: { targetId: number }): Promise<void> {
  await assertUserManagementEnabled(ctx);
  const target = await loadUserById(input.targetId);
  if (!target) return;
  const decision = decideDeleteUser({ target });
  await applyDecision(ctx, decision, target.role);
}

export async function enforcePasswordReset(ctx: PolicyRequestContext, input: { targetId: number }): Promise<void> {
  await assertUserManagementEnabled(ctx);
  const target = await loadUserById(input.targetId);
  if (!target) return;
  const decision = decidePasswordReset({ target });
  await applyDecision(ctx, decision, target.role);
}

/**
 * Проверка личности основателя на входе и при OAuth-апсерте.
 * Отклонение здесь — попытка выдать роль founder чужому адресу.
 */
export async function enforceFounderIdentity(
  ctx: PolicyRequestContext,
  input: { email?: string | null; openId?: string | null },
): Promise<void> {
  const decision = decideFounderIdentity(input);
  await applyDecision(ctx, decision, FOUNDER_ROLE);
}

/**
 * Единственный разрешённый путь создания основателя: идемпотентный сид из env.
 * Вызывается синхронно, до любых записей.
 */
export function enforceSeedFounder(input: { email?: string | null; role?: string | null }): void {
  const decision = decideSeedFounder(input);
  if (!decision.allowed) throw new UserPolicyError(decision.violation, decision.message);
}
