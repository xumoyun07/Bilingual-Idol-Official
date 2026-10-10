import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { inMemoryAuditLogs } from "./audit";
import { inMemoryStore } from "./db";
import { FOUNDER_EMAIL } from "./founderIdentity";
import { DUPLICATE_EMAIL_MESSAGE, GENERIC_FOUNDER_MESSAGE, INVARIANT_MESSAGE } from "./services/userPolicy";

/**
 * Интеграционные проверки политики: по одному вызову на каждый путь из A1.
 * Все пароли генерируются в рантайме, адрес основателя берётся из FOUNDER_EMAIL.
 */

type Role = "founder" | "super_admin" | "admin" | "marketing" | "teacher" | "student";

const ORIGINAL_HASH = process.env.FOUNDER_PASSWORD_HASH;
const runtimePassword = () => `T-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}-pass`;

type SeedRow = { id: number; email: string | null; role: Role; isActive?: boolean };

function setStore(rows: SeedRow[]) {
  inMemoryStore.users = rows.map(row => ({
    id: row.id,
    openId: `seed:${row.id}`,
    name: `Seed ${row.role} ${row.id}`,
    email: row.email,
    passwordHash: null,
    role: row.role,
    isActive: row.isActive ?? true,
    loginMethod: "test",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
    sessionVersion: 1,
    isOtp: false,
    otpCreatedAt: null,
    failedAttempts: 0,
  })) as never;
  inMemoryStore.userProfileValues = [];
  inMemoryStore.studentProfiles = [];
  inMemoryAuditLogs.length = 0;
}

const FOUNDER_ROW: SeedRow = { id: 1, email: FOUNDER_EMAIL, role: "founder" };
const STUDENT_ROW: SeedRow = { id: 2, email: "student@example.test", role: "student" };
const SUPER_ADMIN_ROW: SeedRow = { id: 3, email: "super@example.test", role: "super_admin" };
const ADMIN_ROW: SeedRow = { id: 4, email: "admin@example.test", role: "admin" };

/**
 * Контекст вызова строится независимо от состояния хранилища: тесты «fail closed»
 * намеренно оставляют хранилище без основателя, но вызывающий актор существовать
 * не перестаёт.
 */
function callerFor(id: number, role: Role, extra: Record<string, unknown> = {}) {
  const row = inMemoryStore.users.find(user => user.id === id);
  const base = row ?? {
    id,
    openId: `ctx:${id}`,
    name: `Ctx ${role}`,
    email: `${role}@ctx.test`,
    passwordHash: null,
    role,
    isActive: true,
    loginMethod: "test",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
    sessionVersion: 1,
    isOtp: false,
    otpCreatedAt: null,
    failedAttempts: 0,
  };
  return appRouter.createCaller({
    user: { ...base, ...extra } as TrpcContext["user"],
    req: { headers: {}, protocol: "http", ip: "127.0.0.1", socket: {} } as TrpcContext["req"],
    res: { cookie: () => {}, clearCookie: () => {} } as TrpcContext["res"],
  });
}

const founder = () => callerFor(FOUNDER_ROW.id, "founder");
const superAdmin = () => callerFor(SUPER_ADMIN_ROW.id, "super_admin");
const admin = () => callerFor(ADMIN_ROW.id, "admin");

beforeEach(() => {
  setStore([FOUNDER_ROW, STUDENT_ROW, SUPER_ADMIN_ROW, ADMIN_ROW]);
  delete process.env.FOUNDER_PASSWORD_HASH;
});

afterEach(() => {
  if (ORIGINAL_HASH === undefined) delete process.env.FOUNDER_PASSWORD_HASH;
  else process.env.FOUNDER_PASSWORD_HASH = ORIGINAL_HASH;
  setStore([]);
});

describe("A1 · users.* (founderProcedure)", () => {
  it("users.create отклоняет адрес основателя в любом регистре и с пробелами", async () => {
    for (const email of [FOUNDER_EMAIL, FOUNDER_EMAIL.toUpperCase(), `  ${FOUNDER_EMAIL}  `]) {
      await expect(
        founder().users.create({ name: "Impostor", email, role: "student", isActive: true, password: runtimePassword() }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST", message: GENERIC_FOUNDER_MESSAGE });
    }
    expect(inMemoryStore.users.filter(user => user.role === "founder")).toHaveLength(1);
  });

  it("users.create отклоняет дубликат адреса без учёта регистра", async () => {
    await expect(
      founder().users.create({ name: "Clone", email: "STUDENT@EXAMPLE.TEST", role: "student", isActive: true, password: runtimePassword() }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", message: DUPLICATE_EMAIL_MESSAGE });
  });

  it("users.update отклоняет изменение, деактивацию и переименование основателя", async () => {
    for (const input of [
      { name: "Renamed", email: FOUNDER_EMAIL, role: "admin" as const, isActive: true },
      { name: "Renamed", email: FOUNDER_EMAIL, role: "founder" as const, isActive: false },
      { name: "Renamed", email: "moved@example.test", role: "founder" as const, isActive: true },
    ]) {
      await expect(founder().users.update({ id: FOUNDER_ROW.id, ...input })).rejects.toBeDefined();
    }
    const founderRow = inMemoryStore.users.find(user => user.id === FOUNDER_ROW.id)!;
    expect(founderRow.email).toBe(FOUNDER_EMAIL);
    expect(founderRow.role).toBe("founder");
    expect(founderRow.isActive).toBe(true);
  });

  it("users.update отклоняет выдачу чужой записи адреса основателя", async () => {
    await expect(
      founder().users.update({ id: STUDENT_ROW.id, name: "Student", email: FOUNDER_EMAIL, role: "student", isActive: true }),
    ).rejects.toMatchObject({ message: GENERIC_FOUNDER_MESSAGE });
  });

  it("users.remove отклоняет удаление основателя", async () => {
    await expect(founder().users.remove({ id: FOUNDER_ROW.id })).rejects.toBeDefined();
    expect(inMemoryStore.users.some(user => user.id === FOUNDER_ROW.id)).toBe(true);
  });

  it("admin не имеет доступа к users.* (admin не управляет пользователями)", async () => {
    await expect(admin().users.list({})).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(admin().users.remove({ id: STUDENT_ROW.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(admin().users.create({ name: "X", email: "x@example.test", role: "student", isActive: true, password: runtimePassword() })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("A1 · superAdminUsers.* (adminProcedure)", () => {
  it("create отклоняет адрес основателя", async () => {
    await expect(
      superAdmin().superAdminUsers.create({ name: "Impostor", email: FOUNDER_EMAIL, role: "student", isActive: true, password: runtimePassword() }),
    ).rejects.toMatchObject({ message: GENERIC_FOUNDER_MESSAGE });
  });

  it("byId / update / remove не видят основателя и супер-админа", async () => {
    await expect(superAdmin().superAdminUsers.byId({ id: FOUNDER_ROW.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(superAdmin().superAdminUsers.byId({ id: SUPER_ADMIN_ROW.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      superAdmin().superAdminUsers.update({ id: FOUNDER_ROW.id, name: "Renamed", email: FOUNDER_EMAIL, role: "student", isActive: false }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(superAdmin().superAdminUsers.remove({ id: FOUNDER_ROW.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(inMemoryStore.users.some(user => user.id === FOUNDER_ROW.id)).toBe(true);
  });

  it("list не показывает основателя и супер-админов", async () => {
    const result = await superAdmin().superAdminUsers.list({});
    const roles = result.rows.map(row => row.role);
    expect(roles).not.toContain("founder");
    expect(roles).not.toContain("super_admin");
  });

  it("resetPassword отклоняет сброс пароля основателя", async () => {
    await expect(superAdmin().superAdminUsers.resetPassword({ id: FOUNDER_ROW.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("admin не может управлять админами и супер-админами", async () => {
    await expect(admin().superAdminUsers.list({ role: "admin" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      admin().superAdminUsers.create({ name: "Peer", email: "peer@example.test", role: "admin", isActive: true, password: runtimePassword() }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("A1 · students.* (founderProcedure)", () => {
  const profile = (email: string | null) => ({
    name: "Ari Student", email, isActive: true, guardianName: null, guardianPhone: null, contactEmail: null,
    dateOfBirth: null, address: null, notes: null, attendedSessions: 0, totalSessions: 0,
    currentLevel: null, courseName: null, courseCode: null, courseStartDate: null, courseEndDate: null,
  });

  it("create отклоняет адрес основателя", async () => {
    await expect(founder().students.create(profile(FOUNDER_EMAIL))).rejects.toMatchObject({ message: GENERIC_FOUNDER_MESSAGE });
  });

  it("update отклоняет перенос адреса основателя на профиль студента", async () => {
    const created = await founder().students.create(profile("ari@example.test"));
    // В режиме без БД профиль студента и строка users живут в разных коллекциях,
    // поэтому зеркалим строку users так же, как это делает MySQL-ветка.
    setStore([FOUNDER_ROW, STUDENT_ROW, SUPER_ADMIN_ROW, ADMIN_ROW, { id: created.userId, email: "ari@example.test", role: "student" }]);
    await expect(founder().students.update({ studentId: created.userId, ...profile(FOUNDER_EMAIL) })).rejects.toMatchObject({
      message: GENERIC_FOUNDER_MESSAGE,
    });
  });

  it("remove отклоняет удаление основателя через профиль студента", async () => {
    await expect(founder().students.remove({ studentId: FOUNDER_ROW.id })).rejects.toBeDefined();
    expect(inMemoryStore.users.some(user => user.id === FOUNDER_ROW.id)).toBe(true);
  });
});

describe("A1 · registration и OTP/онбординг", () => {
  it("registration.submit не принимает роль и не создаёт пользователей", async () => {
    const before = inMemoryStore.users.length;
    await expect(
      appRouter.createCaller({ user: null, req: { headers: {}, protocol: "http" } as never, res: {} as never }).registration.submit({
        programId: 999_999,
        applicantCategory: "adult",
        fullName: "Test Applicant",
        email: "applicant@example.test",
        phone: "+60123456789",
        fieldValues: [],
      }),
    ).rejects.toBeDefined();
    expect(inMemoryStore.users.length).toBe(before);
  });

  it("auth.completeOnboarding проходит через политику (fail closed без основателя)", async () => {
    setStore([{ id: 5, email: "student@example.test", role: "student" }]);
    const caller = callerFor(5, "student", { isRestricted: true });
    await expect(caller.auth.completeOnboarding({ password: runtimePassword() })).rejects.toBeDefined();
  });
});

describe("A1 · enrollments.createClientAccountAndEnrollment (adminProcedure)", () => {
  it("не создаёт аккаунт, когда инвариант основателя нарушен", async () => {
    setStore([SUPER_ADMIN_ROW]);
    await expect(
      superAdmin().enrollments.createClientAccountAndEnrollment({
        name: "New Client", email: "client@example.test", phone: "+60123456789", programId: 1,
        agreedPrice: 100, source: "direct_call",
      }),
    ).rejects.toBeDefined();
  });

  it("создаёт только роль student, когда инвариант соблюдён", async () => {
    const result = await superAdmin().enrollments.createClientAccountAndEnrollment({
      name: "New Client", email: "client@example.test", phone: "+60123456789", programId: 1,
      agreedPrice: 100, source: "direct_call",
    });
    const created = inMemoryStore.users.find(user => user.id === result.userId);
    expect(created?.role).toBe("student");
  });
});

describe("B2 · аудит отклонённых попыток", () => {
  it("пишет actor, action, targetRole и код нарушения — без адресов и значений", async () => {
    setStore([FOUNDER_ROW, STUDENT_ROW]);
    const attemptedEmail = FOUNDER_EMAIL;
    await founder()
      .users.create({ name: "Impostor", email: attemptedEmail, role: "student", isActive: true, password: runtimePassword() })
      .catch(() => undefined);

    const entry = inMemoryAuditLogs.find(log => log.action === "user.policy_rejected");
    expect(entry).toBeDefined();
    expect(entry.actorUserId).toBe(FOUNDER_ROW.id);
    expect(entry.actorRole).toBe("founder");
    expect(entry.targetRole).toBe("student");
    expect(entry.isSuccess).toBe(false);
    expect(entry.description).toContain("founder_email_reserved");
    // Значения цели в записи отсутствуют.
    expect(JSON.stringify(entry)).not.toContain(attemptedEmail);
    expect(JSON.stringify(entry)).not.toContain("Impostor");
  });

  it("при нарушенном инварианте тоже пишет запись аудита", async () => {
    setStore([]);
    await founder()
      .users.create({ name: "Anyone", email: "anyone@example.test", role: "student", isActive: true, password: runtimePassword() })
      .catch(() => undefined);
    const entry = inMemoryAuditLogs.find(log => log.action === "user.policy_rejected");
    expect(entry).toBeDefined();
    expect(entry.description).toContain("startup_invariant");
  });
});

describe("B2 · fail closed: при нарушенном инварианте мутации закрыты", () => {
  beforeEach(() => {
    setStore([STUDENT_ROW]);
  });

  it("сообщение обезличено", async () => {
    await expect(founder().users.remove({ id: STUDENT_ROW.id })).rejects.toMatchObject({ message: INVARIANT_MESSAGE });
  });

  it("users.create закрыт", async () => {
    await expect(
      founder().users.create({ name: "New", email: "new@example.test", role: "student", isActive: true, password: runtimePassword() }),
    ).rejects.toMatchObject({ message: INVARIANT_MESSAGE });
  });

  it("superAdminUsers.remove закрыт", async () => {
    await expect(superAdmin().superAdminUsers.remove({ id: STUDENT_ROW.id })).rejects.toMatchObject({ message: INVARIANT_MESSAGE });
  });

  it("students.create закрыт", async () => {
    await expect(
      founder().students.create({
        name: "Ari", email: "ari@example.test", isActive: true, guardianName: null, guardianPhone: null, contactEmail: null,
        dateOfBirth: null, address: null, notes: null, attendedSessions: 0, totalSessions: 0,
        currentLevel: null, courseName: null, courseCode: null, courseStartDate: null, courseEndDate: null,
      }),
    ).rejects.toMatchObject({ message: INVARIANT_MESSAGE });
  });
});
