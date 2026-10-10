import { beforeEach, describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { inMemoryStore } from "./db";

/**
 * MK3: промо-акции. Публично видны только активные, не истёкшие, не исчерпанные;
 * promoCode уникален; usedCount через CRUD изменить нельзя; CRUD — зона marketing.
 */

const FOUNDER = { id: 1, email: "f@example.test", role: "founder" };
const MARKETING = { id: 2, email: "m@example.test", role: "marketing" };
const TEACHER = { id: 3, email: "t@example.test", role: "teacher" };

const NOW = new Date("2026-06-01T00:00:00.000Z");

function seed() {
  inMemoryStore.users = [FOUNDER, MARKETING, TEACHER].map(row => ({
    id: row.id, openId: `seed:${row.id}`, name: `Seed ${row.role}`, email: row.email,
    passwordHash: null, role: row.role, isActive: true, loginMethod: "test",
    createdAt: new Date("2026-01-01T00:00:00.000Z"), updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    lastSignedIn: new Date("2026-01-01T00:00:00.000Z"), sessionVersion: 1, isOtp: false,
    otpCreatedAt: null, failedAttempts: 0,
  })) as never;

  (inMemoryStore as unknown as { promotions?: Array<Record<string, any>> }).promotions = [
    { id: 1, code: "WELCOME10", title: "Welcome 10", description: "Ten percent off", discountType: "percentage", discountValue: 10, scope: "all", maxUses: null, usedCount: 0, startsAt: null, expiresAt: null, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 2, code: "OLD2025", title: "Old campaign", description: "Expired", discountType: "fixed", discountValue: 100, scope: "all", maxUses: null, usedCount: 0, startsAt: null, expiresAt: new Date("2025-01-01T00:00:00.000Z"), isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 3, code: "HIDDEN", title: "Inactive", description: "Inactive", discountType: "fixed", discountValue: 50, scope: "all", maxUses: null, usedCount: 0, startsAt: null, expiresAt: null, isActive: false, createdAt: NOW, updatedAt: NOW },
    { id: 4, code: "EXHAUSTED", title: "Full", description: "Full", discountType: "fixed", discountValue: 50, scope: "all", maxUses: 5, usedCount: 5, startsAt: null, expiresAt: null, isActive: true, createdAt: NOW, updatedAt: NOW },
  ];
}

function caller(role: string | null) {
  const row = role ? inMemoryStore.users.find(u => u.role === role) : undefined;
  return appRouter.createCaller({
    user: (row ?? null) as TrpcContext["user"],
    req: { headers: {}, protocol: "http", ip: "127.0.0.1", socket: {} } as TrpcContext["req"],
    res: { cookie: () => {}, clearCookie: () => {} } as TrpcContext["res"],
  });
}

const validInput = () => ({
  code: "SUMMER25",
  title: "Summer 2025",
  description: "Summer discount",
  discountType: "percentage" as const,
  discountValue: 25,
  scope: "all",
  maxUses: null as number | null,
  startsAt: null as Date | null,
  expiresAt: null as Date | null,
  isActive: true,
});

beforeEach(seed);

describe("publicActive / publicList", () => {
  it("публично видны только активные, не истёкшие, не исчерпанные", async () => {
    const rows = await caller(null).promotions.publicActive();
    expect(rows.map(r => r.code)).toEqual(["WELCOME10"]);
  });

  it("list отдаёт историю целиком", async () => {
    const rows = await caller("marketing").promotions.list();
    expect(rows.map(r => r.code).sort()).toEqual(["EXHAUSTED", "HIDDEN", "OLD2025", "WELCOME10"]);
  });

  it("validate: истёкший код невалиден, активный валиден", async () => {
    const old = await caller(null).promotions.validate({ code: "OLD2025" });
    expect(old.valid).toBe(false);
    const ok = await caller(null).promotions.validate({ code: "WELCOME10" });
    expect(ok.valid).toBe(true);
  });
});

describe("create", () => {
  it("marketing создаёт промо", async () => {
    const created = await caller("marketing").promotions.create(validInput());
    expect(created.id).toBeGreaterThan(0);
    expect(created.usedCount).toBe(0);
  });

  it("повторный promoCode отклоняется", async () => {
    await expect(caller("marketing").promotions.create({ ...validInput(), code: "WELCOME10" })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("teacher не может создавать", async () => {
    await expect(caller("teacher").promotions.create(validInput())).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("update", () => {
  it("marketing обновляет промо", async () => {
    const updated = await caller("marketing").promotions.update({ ...validInput(), code: "WELCOME15", id: 1, title: "Welcome 15" });
    expect(updated.title).toBe("Welcome 15");
    expect(updated.code).toBe("WELCOME15");
  });

  it("нельзя занять чужой код", async () => {
    await expect(caller("marketing").promotions.update({ ...validInput(), code: "EXHAUSTED", id: 1 })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("несуществующее промо — NOT_FOUND", async () => {
    await expect(caller("marketing").promotions.update({ ...validInput(), id: 999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("usedCount нельзя изменить через CRUD", async () => {
    await caller("marketing").promotions.update({ ...validInput(), code: "EXHAUSTED", id: 4 });
    const rows = await caller("marketing").promotions.list();
    expect(rows.find(r => r.id === 4)?.usedCount).toBe(5);
  });
});
