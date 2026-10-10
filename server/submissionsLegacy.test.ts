import { beforeEach, describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { inMemoryStore } from "./db";

/**
 * F25/F26: новые записи type='enrollment' через submissions.create запрещены —
 * все регистрации идут через Form 2. Лёгкие обращения (createInquiry) работают.
 */

beforeEach(() => {
  (inMemoryStore as unknown as { submissions?: unknown[] }).submissions = [];
});

function caller() {
  return appRouter.createCaller({
    user: null,
    req: { headers: {}, protocol: "http", ip: "127.0.0.1", socket: {} } as TrpcContext["req"],
    res: { cookie: () => {}, clearCookie: () => {} } as TrpcContext["res"],
  });
}

describe("submissions.create: наследие отклоняется", () => {
  it("enrollment больше не принимается", async () => {
    await expect(caller().submissions.create({
      type: "enrollment",
      studentName: "Kid",
      studentAge: 10,
      parentName: "Parent",
      parentEmail: "p@example.test",
      parentPhone: "+60111111111",
      programInterest: "General English",
      preferredSchedule: "Morning",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("inquiry по-прежнему проходит", async () => {
    const result = await caller().submissions.createInquiry({
      name: "Visitor",
      email: "v@example.test",
      phone: "",
      message: "Hello",
      reasonType: "general",
    });
    expect(result).toBeDefined();
  });
});
