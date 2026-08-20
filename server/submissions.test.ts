import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";
import { submissionsRouter, submissionInput } from "./routers/submissions";
import { founderProcedure, router } from "./_core/trpc";

function contextFor(role: "user" | "founder"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("submission input validation", () => {
  it("accepts a complete enrollment request", () => {
    const result = submissionInput.parse({
      type: "enrollment",
      studentName: "Amina Rahman",
      studentAge: 11,
      parentName: "Nur Rahman",
      parentEmail: "nur@example.com",
      parentPhone: "+60367310449",
      programInterest: "Kids English",
      preferredSchedule: "Weekends",
      message: "Looking for a supportive class.",
    });

    expect(result.studentAge).toBe(11);
    expect(result.type).toBe("enrollment");
  });

  it("rejects incomplete or unsafe lead data", () => {
    const result = submissionInput.safeParse({
      type: "enrollment",
      studentName: "A",
      studentAge: 1,
      parentName: "",
      parentEmail: "not-an-email",
      parentPhone: "",
      programInterest: "",
      preferredSchedule: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("submission admin access", () => {
  it("prevents a signed-in non-founder from listing submissions", async () => {
    const caller = submissionsRouter.createCaller(contextFor("user"));

    await expect(caller.list()).rejects.toMatchObject<Partial<TRPCError>>({
      code: "FORBIDDEN",
    });
  });
});

describe("Founder access", () => {
  const founderOnlyRouter = router({
    verify: founderProcedure.query(() => ({ access: "founder" as const })),
  });

  it("allows the Founder role through founder-only procedures", async () => {
    const caller = founderOnlyRouter.createCaller(contextFor("founder"));

    await expect(caller.verify()).resolves.toEqual({ access: "founder" });
  });

  it("rejects an ordinary user from founder-only procedures", async () => {
    const caller = founderOnlyRouter.createCaller(contextFor("user"));

    await expect(caller.verify()).rejects.toMatchObject<Partial<TRPCError>>({
      code: "FORBIDDEN",
    });
  });
});
