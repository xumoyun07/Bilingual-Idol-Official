import { beforeEach, describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { inMemoryStore } from "./db";
import { FOUNDER_EMAIL } from "./founderIdentity";

/**
 * Изоляция студентов: procedures студента не имеют параметров и берут только
 * ctx.user.id, поэтому чужую строку нельзя прочитать даже зная её id.
 */

const FOUNDER = { id: 1, email: FOUNDER_EMAIL, role: "founder" };
const STUDENT_A = { id: 2, email: "a@example.test", role: "student" };
const STUDENT_B = { id: 3, email: "b@example.test", role: "student" };

function seed(rows: Array<{ id: number; email: string; role: string }>) {
  inMemoryStore.users = rows.map(row => ({
    id: row.id, openId: `seed:${row.id}`, name: `Seed ${row.role}`, email: row.email,
    passwordHash: null, role: row.role, isActive: true, loginMethod: "test",
    createdAt: new Date("2026-01-01T00:00:00.000Z"), updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    lastSignedIn: new Date("2026-01-01T00:00:00.000Z"), sessionVersion: 1, isOtp: false,
    otpCreatedAt: null, failedAttempts: 0,
  })) as never;
  (inMemoryStore as unknown as { payments?: unknown[] }).payments = [
    { id: 11, userId: STUDENT_A.id, amount: 100, amountMinor: 100000, currency: "MYR", status: "pending", priceId: 101, provider: "dev_stub", metadataJson: null, utmSource: null, utmMedium: null, utmCampaign: null, utmTerm: null, utmContent: null, transactionReference: null, paymentMethod: null, receiptNumber: "R-A", createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
    { id: 12, userId: STUDENT_B.id, amount: 200, amountMinor: 200000, currency: "MYR", status: "pending", priceId: 102, provider: "dev_stub", metadataJson: null, utmSource: null, utmMedium: null, utmCampaign: null, utmTerm: null, utmContent: null, transactionReference: null, paymentMethod: null, receiptNumber: "R-B", createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  ];
  (inMemoryStore as unknown as { studentPrices?: unknown[] }).studentPrices = [
    { id: 101, studentId: STUDENT_A.id, programId: 1, amountMinor: 100000, currency: "MYR", status: "active", agreedBy: FOUNDER.id, agreedAt: new Date("2026-02-01"), staffNote: "A internal note", supersededById: null, supersededReason: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
    { id: 102, studentId: STUDENT_B.id, programId: 1, amountMinor: 200000, currency: "MYR", status: "active", agreedBy: FOUNDER.id, agreedAt: new Date("2026-02-01"), staffNote: "B internal note", supersededById: null, supersededReason: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  ];
}

function caller(user: { id: number; email: string; role: string } | null, extra: Record<string, unknown> = {}) {
  const row = user ? inMemoryStore.users.find(u => u.id === user.id) : undefined;
  return appRouter.createCaller({
    user: (row ? { ...row, ...extra } : null) as TrpcContext["user"],
    req: { headers: {}, protocol: "http", ip: "127.0.0.1", socket: {} } as TrpcContext["req"],
    res: { cookie: () => {}, clearCookie: () => {} } as TrpcContext["res"],
  });
}

beforeEach(() => seed([FOUNDER, STUDENT_A, STUDENT_B]));

describe("A · prices.mine", () => {
  it("отдаёт только свои цены", async () => {
    const result = await caller(STUDENT_A).prices.mine();
    expect(result.state).toBe("set");
    expect(result.prices.map(p => p.id)).toEqual([101]);
  });

  it("никогда не отдаёт staffNote", async () => {
    const result = await caller(STUDENT_A).prices.mine();
    expect(JSON.stringify(result)).not.toContain("internal note");
    expect(Object.keys(result.prices[0])).not.toContain("staffNote");
    expect(Object.keys(result.prices[0]).sort()).toEqual(["agreedAt", "amountMinor", "currency", "id", "programId", "status"]);
  });

  it("возвращает явное not_set, когда цены нет", async () => {
    (inMemoryStore as unknown as { studentPrices?: unknown[] }).studentPrices = [];
    const result = await caller(STUDENT_A).prices.mine();
    expect(result).toEqual({ state: "not_set", prices: [] });
  });
});

describe("A · payments.mine", () => {
  it("отдаёт только свои платежи и не отдаёт служебные поля", async () => {
    const rows = await caller(STUDENT_A).payments.mine();
    expect(rows.map(r => r.id)).toEqual([11]);
    expect(JSON.stringify(rows)).not.toContain("R-B");
    expect(Object.keys(rows[0])).not.toContain("metadataJson");
    expect(Object.keys(rows[0])).not.toContain("utmSource");
  });
});

describe("A · изоляция и отсутствие by-id путей у студента", () => {
  it("у студента нет процедур чтения чужой строки по id", () => {
    const procedures = appRouter._def.procedures as Record<string, unknown>;
    expect(procedures["prices.byId"]).toBeUndefined();
    expect(procedures["payments.byId"]).toBeUndefined();
    expect(procedures["prices.historyByStudent"]).toBeDefined();
  });

  it("staff-история закрыта для студента", async () => {
    await expect(caller(STUDENT_A).prices.historyByStudent({ studentId: STUDENT_B.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("студент не может вызвать staff-процедуры цен", async () => {
    for (const call of [
      () => caller(STUDENT_A).prices.set({ studentId: STUDENT_A.id, programId: 1, amountMinor: 1000 }),
      () => caller(STUDENT_A).prices.change({ studentId: STUDENT_A.id, programId: 1, amountMinor: 1000, reason: "probe" }),
      () => caller(STUDENT_A).prices.cancel({ priceId: 101, reason: "probe" }),
      () => caller(STUDENT_A).prices.complete({ priceId: 101 }),
    ]) {
      await expect(call()).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });
});
describe("C · payments.list: доступ и изоляция", () => {
  const ROLES = [
    { id: 1, email: "f@example.test", role: "founder" },
    { id: 4, email: "sa@example.test", role: "super_admin" },
    { id: 5, email: "ad@example.test", role: "admin" },
    { id: 6, email: "te@example.test", role: "teacher" },
    { id: 7, email: "mk@example.test", role: "marketing" },
    { id: 8, email: "us@example.test", role: "user" },
  ];

  beforeEach(() => seed([FOUNDER, STUDENT_A, STUDENT_B, ...ROLES]));

  it("студент видит только свои платежи", async () => {
    const rows = await caller(STUDENT_A).payments.list();
    expect(rows.map(r => r.id)).toEqual([11]);
  });

  it("founder, super_admin и admin видят все платежи", async () => {
    for (const role of ["founder", "super_admin", "admin"]) {
      const user = ROLES.find(r => r.role === role)!;
      const rows = await caller(user).payments.list();
      expect(rows.map(r => r.id).sort((a, b) => a - b), `роль ${role}`).toEqual([11, 12]);
    }
  });

  it("teacher, marketing и user получают FORBIDDEN", async () => {
    for (const role of ["teacher", "marketing", "user"]) {
      const user = ROLES.find(r => r.role === role)!;
      await expect(caller(user).payments.list(), `роль ${role}`).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });

  it("без входа процедура больше не публичная", async () => {
    await expect(caller(null).payments.list()).rejects.toBeDefined();
  });

  it("enrollments-процедуры с legacy-колонками закрыты для teacher/marketing/user", async () => {
    for (const role of ["teacher", "marketing", "user"]) {
      const user = ROLES.find(r => r.role === role)!;
      await expect(caller(user).enrollments.list(), `enrollments.list как ${role}`).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller(user).enrollments.byUserId({ userId: STUDENT_B.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });

  it("студент читает только свои зачисления", async () => {
    (inMemoryStore as unknown as { enrollments?: unknown[] }).enrollments = [
      { id: 1, userId: STUDENT_A.id, programId: 1, agreedPrice: 100, registrationFee: 0, placementTestFee: 0, visaFee: 0, status: "active", approvedByUserId: 1, approvedAt: new Date(), source: "whatsapp", createdAt: new Date(), updatedAt: new Date() },
      { id: 2, userId: STUDENT_B.id, programId: 1, agreedPrice: 200, registrationFee: 0, placementTestFee: 0, visaFee: 0, status: "active", approvedByUserId: 1, approvedAt: new Date(), source: "whatsapp", createdAt: new Date(), updatedAt: new Date() },
    ];
    const rows = await caller(STUDENT_A).enrollments.myEnrollments();
    expect(rows.map(r => r.id)).toEqual([1]);
  });
});