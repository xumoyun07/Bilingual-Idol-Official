import fs from "fs";
import path from "path";
import { beforeEach, describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { inMemoryStore } from "./db";
import { FOUNDER_EMAIL } from "./founderIdentity";
import { registrationSubmitInput } from "./routers/registration";

/**
 * Матрица «процедура × роль».
 *
 * Ожидаемые наборы ролей ВЫВОДЯТСЯ из server/_core/trpc.ts (источник истины),
 * а затем проверяются поведением на реальных процедурах. Документированные
 * правила не изменяются: тест только сообщает о расхождениях.
 */

const TRPC_SOURCE = fs.readFileSync(path.join(process.cwd(), "server", "_core", "trpc.ts"), "utf8");

const DOCUMENTED_GUARDS: Record<string, string[] | null> = {
  protectedProcedure: null,
  studentProcedure: ["student"],
  teacherProcedure: ["teacher"],
  adminProcedure: ["admin", "super_admin", "founder"],
  contentManagerProcedure: ["admin", "marketing", "super_admin", "founder"],
  founderProcedure: ["founder"],
  superAdminProcedure: ["super_admin"],
  auditProcedure: ["founder", "super_admin"],
};

/** Тело объявления `const name = ...` (включая `export const name = ...`). */
function blockFor(name: string): string | undefined {
  const start = TRPC_SOURCE.indexOf(`const ${name} =`);
  if (start < 0) return undefined;
  const candidates = [TRPC_SOURCE.indexOf("\nexport const ", start + 1), TRPC_SOURCE.indexOf("\nconst ", start + 1)].filter(index => index > start);
  const end = candidates.length ? Math.min(...candidates) : TRPC_SOURCE.length;
  return TRPC_SOURCE.slice(start, end);
}

/** Набор ролей, который требует тело: массив, одно значение, или null (только аутентификация). */
function rolesInBlock(block: string): string[] | null | undefined {
  const single = block.match(/ctx\.user\.role\s*!==\s*['"](\w+)['"]/);
  if (single) return [single[1]];

  const list = block.match(/\[([^\]]*?)\]\.includes\(ctx\.user\.role\)/);
  if (list) return Array.from(list[1].matchAll(/['"](\w+)['"]/g)).map(match => match[1]);

  if (/if \(!ctx\.user\)/.test(block)) return null;

  return undefined;
}

/** Вытаскивает набор ролей из гварда в trpc.ts, разворачивая псевдонимы и middleware. */
function guardRolesFromSource(name: string): string[] | null | undefined {
  const block = blockFor(name);
  if (block === undefined) return undefined;

  const alias = block.match(/const \w+ = (\w+);/);
  if (alias) return guardRolesFromSource(alias[1]);

  const direct = rolesInBlock(block);
  if (direct !== undefined) return direct;

  // protectedProcedure = t.procedure.use(requireUser) — тело middleware лежит отдельно
  const viaMiddleware = block.match(/t\.procedure\.use\((\w+)\)/);
  if (viaMiddleware) {
    const middlewareBlock = blockFor(viaMiddleware[1]);
    if (middlewareBlock !== undefined) return rolesInBlock(middlewareBlock);
  }

  return undefined;
}

type Role = "founder" | "super_admin" | "admin" | "marketing" | "teacher" | "student";

const ALL_ROLES: Role[] = ["founder", "super_admin", "admin", "marketing", "teacher", "student"];

const SEED = [
  { id: 1, email: FOUNDER_EMAIL, role: "founder" as Role },
  { id: 2, email: "student@example.test", role: "student" as Role },
  { id: 3, email: "super@example.test", role: "super_admin" as Role },
  { id: 4, email: "admin@example.test", role: "admin" as Role },
  { id: 5, email: "marketing@example.test", role: "marketing" as Role },
  { id: 6, email: "teacher@example.test", role: "teacher" as Role },
];

function seedStore() {
  inMemoryStore.users = SEED.map(row => ({
    id: row.id,
    openId: `seed:${row.id}`,
    name: `Seed ${row.role}`,
    email: row.email,
    passwordHash: null,
    role: row.role,
    isActive: true,
    loginMethod: "test",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
    sessionVersion: 1,
    isOtp: false,
    otpCreatedAt: null,
    failedAttempts: 0,
  })) as never;
  inMemoryStore.studentProfiles = [];
  inMemoryStore.enrollments = [];
}

function caller(role: Role | null) {
  const row = role ? inMemoryStore.users.find(user => user.role === role) : null;
  return appRouter.createCaller({
    user: (row ?? null) as TrpcContext["user"],
    req: { headers: {}, protocol: "http", ip: "127.0.0.1", socket: {} } as TrpcContext["req"],
    res: { cookie: () => {}, clearCookie: () => {} } as TrpcContext["res"],
  });
}

/** Процедуры только для чтения — матрицу проверяем на них, побочных эффектов нет. */
const MATRIX = [
  { path: "users.list", guard: "founderProcedure", call: (role: Role | null) => caller(role).users.list({}) },
  { path: "students.list", guard: "founderProcedure", call: (role: Role | null) => caller(role).students.list({}) },
  { path: "superAdminUsers.list", guard: "adminProcedure", call: (role: Role | null) => caller(role).superAdminUsers.list({}) },
  { path: "audit.list", guard: "auditProcedure", call: (role: Role | null) => caller(role).audit.list({}) },
  { path: "studentAttendance.summary", guard: "studentProcedure", call: (role: Role | null) => caller(role).studentAttendance.summary() },
  { path: "teacher.schedule", guard: "teacherProcedure", call: (role: Role | null) => caller(role).teacher.schedule() },
] as const;

beforeEach(seedStore);

describe("B3 · гварды в server/_core/trpc.ts совпадают с документированными правилами", () => {
  it("каждый гвард объявлен и содержит ожидаемый набор ролей", () => {
    for (const [name, expected] of Object.entries(DOCUMENTED_GUARDS)) {
      const actual = guardRolesFromSource(name);
      expect(actual, `гвард ${name} должен существовать в trpc.ts`).not.toBeUndefined();
      expect(actual, `набор ролей гварда ${name}`).toEqual(expected);
    }
  });

  it("marketingProcedure — псевдоним contentManagerProcedure", () => {
    expect(guardRolesFromSource("marketingProcedure")).toEqual(DOCUMENTED_GUARDS.contentManagerProcedure);
  });
});

describe("B3 · матрица процедура × роль", () => {
  for (const entry of MATRIX) {
    const allowed = DOCUMENTED_GUARDS[entry.guard];

    it(`${entry.path} (${entry.guard}): разрешены только [${(allowed ?? ALL_ROLES).join(", ")}]`, async () => {
      for (const role of [null, ...ALL_ROLES]) {
        const shouldAllow = allowed === null ? role !== null : allowed.includes(role as string);
        const outcome = await entry
          .call(role)
          .then(() => "allowed" as const)
          .catch((error: { code?: string }) => (error?.code === "FORBIDDEN" ? ("forbidden" as const) : ("other" as const)));

        if (shouldAllow) {
          expect(outcome, `${entry.path} при роли ${role} должен быть разрешён`).not.toBe("forbidden");
        } else {
          expect(outcome, `${entry.path} при роли ${role} должен быть запрещён`).toBe("forbidden");
        }
      }
    });
  }
});

describe("B3 · документированные правила по пользователям", () => {
  it("founder-only процедуры отклоняют всех остальных", async () => {
    for (const path of ["users.list", "students.list"] as const) {
      for (const role of ["super_admin", "admin", "marketing", "teacher", "student"] as const) {
        await expect((caller(role) as never as Record<string, Record<string, (i: unknown) => Promise<unknown>>>)[path.split(".")[0]][path.split(".")[1]]({})).rejects.toMatchObject({ code: "FORBIDDEN" });
      }
    }
  });

  it("super_admin видит только student/teacher/marketing/admin", async () => {
    const result = await caller("super_admin").superAdminUsers.list({});
    const roles = Array.from(new Set(result.rows.map(row => row.role)));
    for (const role of roles) expect(["student", "teacher", "marketing", "admin"]).toContain(role);
  });

  it("super_admin не может создать супер-админа", async () => {
    await expect(
      caller("super_admin").superAdminUsers.create({
        name: "Peer Admin",
        email: "peer@example.test",
        password: "placeholder-not-a-credential",
        role: "super_admin" as never,
        isActive: true,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("admin не управляет пользователями", async () => {
    await expect(caller("admin").users.list({})).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller("admin").users.remove({ id: 2 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("B3 · регистрация", () => {
  it("входной схеме регистрации роль не передаётся вообще", () => {
    const keys = Object.keys(registrationSubmitInput.shape);
    expect(keys).not.toContain("role");
    expect(keys).not.toContain("isActive");
    expect(keys).not.toContain("password");
  });

  it("createRegistrationSubmission не создаёт строк в users (только заявку)", () => {
    const dbSource = fs.readFileSync(path.join(process.cwd(), "server", "db.ts"), "utf8");
    const start = dbSource.indexOf("export async function createRegistrationSubmission");
    const next = dbSource.indexOf("\nexport async function ", start + 1);
    const block = dbSource.slice(start, next < 0 ? dbSource.length : next);
    expect(block).not.toContain("insert(users)");
  });
});
