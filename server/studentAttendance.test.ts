import { afterEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import * as attendance from "./studentAttendance";

type TestRole = "student" | "teacher" | "admin" | "founder" | null;

function context(role: TestRole): TrpcContext {
  return {
    user: role ? {
      id: role === "student" ? 81 : 41,
      openId: `${role}:test`, name: role, email: `${role}@example.test`, passwordHash: null,
      isActive: true, loginMethod: "test", role: role as never,
      createdAt: new Date("2026-01-01T00:00:00.000Z"), updatedAt: new Date("2026-01-01T00:00:00.000Z"), lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
    } : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

afterEach(() => vi.restoreAllMocks());

describe("Student T2 attendance summary", () => {
  it("allows only the student role to read the summary", async () => {
    for (const role of [null, "teacher", "admin", "founder"] as const) {
      await expect(appRouter.createCaller(context(role)).studentAttendance.summary()).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });

  it("forwards the authenticated student id and returns the live percentage", async () => {
    const summary = vi.spyOn(attendance, "getStudentAttendanceSummary").mockResolvedValue({ attendedSessions: 11, totalSessions: 12, percentage: 92 });
    await expect(appRouter.createCaller(context("student")).studentAttendance.summary()).resolves.toEqual({ attendedSessions: 11, totalSessions: 12, percentage: 92 });
    expect(summary).toHaveBeenCalledWith(81);
  });

  it("supports an honest empty state without fabricating a percentage", async () => {
    vi.spyOn(attendance, "getStudentAttendanceSummary").mockResolvedValue({ attendedSessions: 0, totalSessions: 0, percentage: 0 });
    await expect(appRouter.createCaller(context("student")).studentAttendance.summary()).resolves.toEqual({ attendedSessions: 0, totalSessions: 0, percentage: 0 });
  });
});
