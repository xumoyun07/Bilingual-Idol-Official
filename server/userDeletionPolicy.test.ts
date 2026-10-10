import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { countUserDependencies, deleteManagedUser, inMemoryStore } from "./db";
import * as students from "./students";
import { FOUNDER_EMAIL } from "./founderIdentity";
import { DEACTIVATION_MESSAGE, decideDeletion, DEPENDENT_COLUMNS, UserPolicyError } from "./services/userPolicy";

/**
 * Политика удаления:
 *   без зависимых строк — жёсткое удаление;
 *   с любыми зависимостями — отказ от удаления и деактивация (каскадов нет);
 *   основатель — отказ всегда.
 * Плюс: удаление профиля студента не оставляет половинчатых строк.
 */

const ACTOR = { id: 1, role: "founder" };

type SeedRow = { id: number; email: string; role: string; isActive?: boolean };

function seedUsers(rows: SeedRow[]) {
  inMemoryStore.users = rows.map(row => ({
    id: row.id,
    openId: `seed:${row.id}`,
    name: `Seed ${row.role}`,
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
  inMemoryStore.studentProfiles = [];
  inMemoryStore.userProfileValues = [];
  inMemoryStore.enrollments = [];
  inMemoryStore.placementTestAttempts = [];
  inMemoryStore.applications = [];
}

const FOUNDER = { id: 1, email: FOUNDER_EMAIL, role: "founder" };
const STUDENT = { id: 2, email: "student@example.test", role: "student" };

beforeEach(() => seedUsers([FOUNDER, STUDENT]));
afterEach(() => seedUsers([]));

describe("decideDeletion (юнит)", () => {
  it("без зависимостей — жёсткое удаление", () => {
    expect(decideDeletion({ dependents: { perTable: {}, total: 0 } })).toEqual({ action: "hard_delete" });
  });

  it("с зависимостями — деактивация с ясным сообщением и разбивкой", () => {
    const decision = decideDeletion({ dependents: { perTable: { "enrollments.userId": 2 }, total: 2 } });
    expect(decision.action).toBe("deactivate");
    if (decision.action === "deactivate") {
      expect(decision.total).toBe(2);
      expect(decision.perTable).toEqual({ "enrollments.userId": 2 });
      expect(decision.message).toBe(DEACTIVATION_MESSAGE);
    }
  });
});

describe("countUserDependencies", () => {
  it("без связанных строк возвращает ноль", async () => {
    await expect(countUserDependencies(STUDENT.id)).resolves.toEqual({ perTable: {}, total: 0 });
  });

  it("считает строки по таблицам и колонкам", async () => {
    inMemoryStore.enrollments = [{ id: 1, userId: STUDENT.id }] as never;
    inMemoryStore.userProfileValues = [{ userId: STUDENT.id, fieldId: 1, value: "x" }] as never;
    const counts = await countUserDependencies(STUDENT.id);
    expect(counts.perTable["enrollments.userId"]).toBe(1);
    expect(counts.perTable["userProfileValues.userId"]).toBe(1);
    expect(counts.total).toBe(2);
  });

  it("умеет исключать собственные строки профиля", async () => {
    inMemoryStore.studentProfiles = [{ userId: STUDENT.id }] as never;
    const withOwn = await countUserDependencies(STUDENT.id);
    expect(withOwn.perTable["studentProfiles.userId"]).toBe(1);
    const without = await countUserDependencies(STUDENT.id, ["studentProfiles.userId"]);
    expect(without.perTable["studentProfiles.userId"]).toBeUndefined();
    expect(without.total).toBe(0);
  });
});

describe("deleteManagedUser: жёсткое удаление против деактивации", () => {
  it("без зависимостей удаляет запись навсегда", async () => {
    const result = await deleteManagedUser(STUDENT.id, ACTOR);
    expect(result).toMatchObject({ success: true, mode: "deleted", userId: STUDENT.id });
    expect(inMemoryStore.users.some(user => user.id === STUDENT.id)).toBe(false);
  });

  it("с зависимостями отказывает в удалении и деактивирует", async () => {
    inMemoryStore.enrollments = [{ id: 1, userId: STUDENT.id }] as never;
    const result = await deleteManagedUser(STUDENT.id, ACTOR);
    expect(result.success).toBe(true);
    expect(result.mode).toBe("deactivated");
    expect(result.dependentTotal).toBe(1);
    expect(result.dependents).toEqual({ "enrollments.userId": 1 });
    expect(result.message).toBe(DEACTIVATION_MESSAGE);

    const row = inMemoryStore.users.find(user => user.id === STUDENT.id);
    expect(row, "запись должна остаться").toBeDefined();
    expect(row?.isActive).toBe(false);
    expect(inMemoryStore.enrollments.length, "связанные данные не тронуты").toBe(1);
  });

  it("основателя не удаляет никогда, даже без зависимостей", async () => {
    const error = await deleteManagedUser(FOUNDER.id, ACTOR).catch(e => e);
    expect(error).toBeInstanceOf(UserPolicyError);
    expect((error as UserPolicyError).violation).toBe("founder_immutable");
    const row = inMemoryStore.users.find(user => user.id === FOUNDER.id);
    expect(row?.isActive).toBe(true);
  });

  it("зависимости считаются по всем таблицам, а не по первой", async () => {
    inMemoryStore.enrollments = [{ id: 1, userId: STUDENT.id }] as never;
    inMemoryStore.applications = [{ id: 2, userId: STUDENT.id }] as never;
    const result = await deleteManagedUser(STUDENT.id, ACTOR);
    expect(result.dependentTotal).toBe(2);
    expect(Object.keys(result.dependents ?? {}).sort()).toEqual(["applications.userId", "enrollments.userId"]);
  });

  it("согласованная цена студента входит в список зависимостей", () => {
    const keys = DEPENDENT_COLUMNS.map(column => `${column.table}.${column.column}`);
    expect(keys).toContain("studentPrices.studentId");
    expect(keys).toContain("studentPrices.agreedBy");
    expect(keys).toContain("studentPrices.supersededById");
    expect(keys).toContain("payments.priceId");
    expect(keys).toContain("payments.userId");
  });

  it("студент с согласованной ценой деактивируется, а не удаляется", async () => {
    inMemoryStore.studentPrices = [{ id: 1, studentId: STUDENT.id, programId: 1, amountMinor: 100 }] as never;
    const result = await deleteManagedUser(STUDENT.id, ACTOR);
    expect(result.mode).toBe("deactivated");
    expect(result.dependents).toEqual({ "studentPrices.studentId": 1 });
    const row = inMemoryStore.users.find(user => user.id === STUDENT.id);
    expect(row?.isActive).toBe(false);
    expect(inMemoryStore.studentPrices.length, "цена не удалена").toBe(1);
    inMemoryStore.studentPrices = [];
  });
});

describe("deleteStudentProfile: всё или ничего", () => {
  const profile = {
    name: "Ari Student", email: "ari@example.test", isActive: true, guardianName: null, guardianPhone: null,
    contactEmail: null, dateOfBirth: null, address: null, notes: null, attendedSessions: 0, totalSessions: 0,
    currentLevel: null, courseName: null, courseCode: null, courseStartDate: null, courseEndDate: null,
  };

  it("без зависимостей удаляет и профиль, и учётную запись", async () => {
    const created = await students.createStudentProfile(profile, ACTOR);
    seedUsers([FOUNDER, { id: created.userId, email: "ari@example.test", role: "student" }]);

    const result = await students.deleteStudentProfile(created.userId, ACTOR);
    expect(result).toMatchObject({ mode: "deleted", userId: created.userId });
    expect(await students.getStudentProfile(created.userId)).toBeUndefined();
    expect(inMemoryStore.users.some(user => user.id === created.userId)).toBe(false);
  });

  it("с зависимостями деактивирует и НИЧЕГО не удаляет", async () => {
    const created = await students.createStudentProfile(profile, ACTOR);
    seedUsers([FOUNDER, { id: created.userId, email: "ari@example.test", role: "student" }]);
    inMemoryStore.enrollments = [{ id: 1, userId: created.userId }] as never;

    const result = await students.deleteStudentProfile(created.userId, ACTOR);
    expect(result).toMatchObject({ mode: "deactivated", userId: created.userId, dependentTotal: 1 });
    expect(result.message).toBe(DEACTIVATION_MESSAGE);
    expect(await students.getStudentProfile(created.userId), "профиль остаётся").toBeDefined();
    const row = inMemoryStore.users.find(user => user.id === created.userId);
    expect(row?.isActive).toBe(false);
  });

  it("основателя не удаляет через профиль студента", async () => {
    await expect(students.deleteStudentProfile(FOUNDER.id, ACTOR)).rejects.toBeDefined();
    expect(inMemoryStore.users.some(user => user.id === FOUNDER.id)).toBe(true);
  });

  it("в БД-ветке четыре удаления идут в одной транзакции (структурная проверка)", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "server", "students.ts"), "utf8");
    const start = source.indexOf("export async function deleteStudentProfile");
    const next = source.indexOf("\nexport async function ", start + 1);
    const block = source.slice(start, next < 0 ? source.length : next);

    expect(block).toContain("await database.transaction(");
    for (const table of ["studentDocuments", "studentProfileHistory", "studentProfiles", "users"]) {
      expect(block, `удаление из ${table} должно быть внутри транзакции`).toContain(`tx.delete(${table})`);
    }
    // Ни одного удаления вне транзакции: все вызовы идут через tx.
    expect(block).not.toMatch(/await database\.delete\(/);
    expect(block).toContain('target.role !== "student"');
  });
});
