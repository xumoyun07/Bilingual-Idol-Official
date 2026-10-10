import { beforeEach, describe, expect, it } from "vitest";
import { fillTemplate, scanExpiringPromotions } from "./services/notifications";
import { inMemoryStore } from "./db";

/**
 * G10: шаблонные уведомления — подстановка переменных и скан истекающих промо.
 */

const NOW = new Date("2026-06-01T00:00:00.000Z");

beforeEach(() => {
  (inMemoryStore as unknown as { promotions?: Array<Record<string, any>> }).promotions = [
    { id: 1, code: "SOON", title: "Soon", description: "d", discountType: "percentage", discountValue: 10, scope: "all", maxUses: null, usedCount: 0, startsAt: null, expiresAt: new Date("2026-06-03T00:00:00.000Z"), isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 2, code: "LATER", title: "Later", description: "d", discountType: "fixed", discountValue: 100, scope: "all", maxUses: null, usedCount: 0, startsAt: null, expiresAt: new Date("2026-09-01T00:00:00.000Z"), isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 3, code: "GONE", title: "Gone", description: "d", discountType: "fixed", discountValue: 50, scope: "all", maxUses: null, usedCount: 0, startsAt: null, expiresAt: new Date("2026-05-30T00:00:00.000Z"), isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 4, code: "OFF", title: "Off", description: "d", discountType: "fixed", discountValue: 50, scope: "all", maxUses: null, usedCount: 0, startsAt: null, expiresAt: new Date("2026-06-03T00:00:00.000Z"), isActive: false, createdAt: NOW, updatedAt: NOW },
  ];
  (inMemoryStore as unknown as { messageTemplates?: Array<Record<string, any>> }).messageTemplates = [
    { id: 1, name: "enquiry_received", channel: "email", subject: "Enquiry {{reasonType}}", body: "Hello {{name}}, thanks.", variables: null, createdAt: NOW },
  ];
});

describe("fillTemplate", () => {
  it("подставляет переменные и оставляет неизвестные пустыми", () => {
    expect(fillTemplate("Hello {{name}} ({{missing}})", { name: "Ana" })).toBe("Hello Ana ()");
  });
});

describe("scanExpiringPromotions", () => {
  it("возвращает только активные промо, истекающие в окне", async () => {
    const codes = await scanExpiringPromotions(7);
    expect(codes).toEqual(["SOON"]);
  });
});