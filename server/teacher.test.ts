import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import * as teacher from "./teacher";

type TestRole = "teacher" | "student" | "marketing" | "admin" | "super_admin" | "founder" | "staff" | null;

function context(role: TestRole): TrpcContext {
  return {
    user: role ? {
      id: role === "teacher" ? 41 : 7,
      openId: `${role}:test`,
      name: role,
      email: `${role}@example.test`,
      passwordHash: null,
      isActive: true,
      loginMethod: "test",
      role: role as never,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
    } : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const schedule = [{ id: 12, title: "English speaking", courseName: "English Level 2", scheduledFor: "2026-09-01", startsAt: "10:00", endsAt: "11:00", room: "Room A", status: "scheduled" as const, studentId: 81, studentName: "Ari Student", studentEmail: "ari@example.test" }];
const details = { session: { ...schedule[0], teacherId: 41 }, attendance: null, grades: [] };

afterEach(() => vi.restoreAllMocks());

describe("Teacher T0 router", () => {
  it("denies schedule access to unauthenticated and every non-teacher role", async () => {
    for (const role of [null, "student", "staff", "marketing", "admin", "super_admin", "founder"] as const) {
      await expect(appRouter.createCaller(context(role)).teacher.schedule()).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });

  it("keeps teacher users out of admin and super-admin endpoint families", async () => {
    const caller = appRouter.createCaller(context("teacher"));
    await expect(caller.users.list({})).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.superAdminUsers.list({})).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("retains teacherId inside the server-side class ownership query", () => {
    const source = readFileSync(new URL("./teacher.ts", import.meta.url), "utf8");
    expect(source).toContain("const conditions = [eq(classSessions.teacherId, teacherId)]");
    expect(source).toContain("where(and(eq(classSessions.id, classSessionId), eq(classSessions.teacherId, teacherId)))");
  });

  it("lists only the current teacher schedule through the server ownership layer", async () => {
    const list = vi.spyOn(teacher, "listTeacherSchedule").mockResolvedValue(schedule);
    await expect(appRouter.createCaller(context("teacher")).teacher.schedule()).resolves.toEqual(schedule);
    expect(list).toHaveBeenCalledWith(41, { from: undefined, to: undefined });
  });

  it("passes validated schedule date bounds to the server ownership layer", async () => {
    const list = vi.spyOn(teacher, "listTeacherSchedule").mockResolvedValue(schedule);
    await appRouter.createCaller(context("teacher")).teacher.schedule({ from: "2026-09-02", to: "2026-09-04" });
    expect(list).toHaveBeenCalledWith(41, { from: new Date("2026-09-02T00:00:00.000Z"), to: new Date("2026-09-04T00:00:00.000Z") });
  });

  it("returns forbidden when a teacher submits a classSessionId not owned by them", async () => {
    vi.spyOn(teacher, "getTeacherSessionDetails").mockRejectedValue(new teacher.TeacherSessionAccessError());
    vi.spyOn(teacher, "saveTeacherAttendance").mockRejectedValue(new teacher.TeacherSessionAccessError());
    vi.spyOn(teacher, "upsertTeacherGrade").mockRejectedValue(new teacher.TeacherSessionAccessError());
    vi.spyOn(teacher, "publishTeacherGrade").mockRejectedValue(new teacher.TeacherSessionAccessError());
    const caller = appRouter.createCaller(context("teacher"));
    await expect(caller.teacher.sessionDetails({ classSessionId: 999 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.teacher.saveAttendance({ classSessionId: 999, studentId: 81, status: "present", method: "manual", note: null })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.teacher.upsertGrade({ classSessionId: 999, title: "Lesson result", score: 9, maxScore: 10, feedback: null, isPublished: false })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.teacher.publishGrade({ classSessionId: 999, gradeId: 4 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("passes the authenticated teacher id to attendance, grade entry and publication calls", async () => {
    const attendance = vi.spyOn(teacher, "saveTeacherAttendance").mockResolvedValue(details);
    const grade = vi.spyOn(teacher, "upsertTeacherGrade").mockResolvedValue(details);
    const publish = vi.spyOn(teacher, "publishTeacherGrade").mockResolvedValue(details);
    const caller = appRouter.createCaller(context("teacher"));
    await caller.teacher.saveAttendance({ classSessionId: 12, studentId: 81, status: "late", method: "manual", note: "Arrived after the warm-up." });
    await caller.teacher.upsertGrade({ classSessionId: 12, title: "Speaking", score: 8, maxScore: 10, feedback: "Good clarity.", isPublished: false });
    await caller.teacher.publishGrade({ classSessionId: 12, gradeId: 2 });
    expect(attendance).toHaveBeenCalledWith(expect.objectContaining({ teacherId: 41, classSessionId: 12, status: "late" }));
    expect(grade).toHaveBeenCalledWith(expect.objectContaining({ teacherId: 41, classSessionId: 12, score: 8, maxScore: 10, isPublished: false }));
    expect(publish).toHaveBeenCalledWith({ teacherId: 41, classSessionId: 12, gradeId: 2 });
  });

  it("rejects a grade where the score exceeds its maximum", async () => {
    await expect(appRouter.createCaller(context("teacher")).teacher.upsertGrade({ classSessionId: 12, title: "Listening", score: 11, maxScore: 10, feedback: null, isPublished: false })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
