import { afterEach, describe, expect, it, vi } from "vitest";
import { sdk } from "./_core/sdk";
import * as teacher from "./teacher";
import { handleTeacherClassSessionDetails, handleTeacherClassSessions, parseTeacherScheduleFilter } from "./teacherPortal";

function response() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { status, json };
}

const teacherUser = { id: 41, role: "teacher" } as never;
const session = { id: 12, title: "English speaking", courseName: "English Level 2", scheduledFor: "2026-09-01", startsAt: "10:00", endsAt: "11:00", room: "Room A", status: "scheduled", studentId: 81, studentName: "Ari Student", studentEmail: "ari@example.test" };

afterEach(() => vi.restoreAllMocks());

describe("Teacher T1 portal endpoints", () => {
  it("normalizes today, week and custom date filters without trusting client-provided teacher IDs", () => {
    const now = new Date("2026-09-01T14:00:00.000Z");
    expect(parseTeacherScheduleFilter({ range: "today" } as never, now)).toEqual({ preset: "today", filter: { from: new Date("2026-09-01T00:00:00.000Z"), to: new Date("2026-09-01T00:00:00.000Z") } });
    expect(parseTeacherScheduleFilter({ range: "week" } as never, now)).toEqual({ preset: "week", filter: { from: new Date("2026-09-01T00:00:00.000Z"), to: new Date("2026-09-07T00:00:00.000Z") } });
    expect(parseTeacherScheduleFilter({ range: "custom", from: "2026-10-02", to: "2026-10-05" } as never, now)).toEqual({ preset: "custom", filter: { from: new Date("2026-10-02T00:00:00.000Z"), to: new Date("2026-10-05T00:00:00.000Z") } });
  });

  it("rejects malformed or reversed custom ranges", () => {
    expect(() => parseTeacherScheduleFilter({ range: "custom", from: "2026-10-08", to: "2026-10-05" } as never)).toThrow("custom range requires valid from and to dates");
    expect(() => parseTeacherScheduleFilter({ range: "other" } as never)).toThrow("range must be today, week or custom");
  });

  it("rejects unauthenticated and non-teacher portal callers", async () => {
    vi.spyOn(sdk, "authenticateRequest").mockRejectedValue(new Error("no session"));
    const unauthenticated = response();
    await handleTeacherClassSessions({ query: {}, originalUrl: "/portal/teacher/class-sessions" } as never, unauthenticated as never);
    expect(unauthenticated.status).toHaveBeenCalledWith(401);
    vi.spyOn(sdk, "authenticateRequest").mockResolvedValue({ id: 7, role: "student" } as never);
    const nonTeacher = response();
    await handleTeacherClassSessions({ query: {}, originalUrl: "/portal/teacher/class-sessions" } as never, nonTeacher as never);
    expect(nonTeacher.status).toHaveBeenCalledWith(403);
  });

  it("queries the own-teacher schedule only, with normalized date bounds", async () => {
    vi.spyOn(sdk, "authenticateRequest").mockResolvedValue(teacherUser);
    const list = vi.spyOn(teacher, "listTeacherSchedule").mockResolvedValue([session] as never);
    const res = response();
    await handleTeacherClassSessions({ query: { range: "custom", from: "2026-09-10", to: "2026-09-12" }, originalUrl: "/portal/teacher/class-sessions" } as never, res as never);
    expect(list).toHaveBeenCalledWith(41, { from: new Date("2026-09-10T00:00:00.000Z"), to: new Date("2026-09-12T00:00:00.000Z") });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ sessions: [session], filter: { preset: "custom", from: "2026-09-10", to: "2026-09-12" } }));
  });

  it("conceals another teacher's class-session id as not found", async () => {
    vi.spyOn(sdk, "authenticateRequest").mockResolvedValue(teacherUser);
    const details = vi.spyOn(teacher, "getTeacherSessionDetails").mockRejectedValue(new teacher.TeacherSessionAccessError());
    const res = response();
    await handleTeacherClassSessionDetails({ params: { id: "999" }, query: {}, originalUrl: "/portal/teacher/class-sessions/999" } as never, res as never);
    expect(details).toHaveBeenCalledWith(41, 999);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Class session not found." });
  });
});


describe("Teacher T2 attendance endpoints", () => {
  it("returns current attendance only through the teacher-owned session query", async () => {
    vi.spyOn(sdk, "authenticateRequest").mockResolvedValue(teacherUser);
    const attendance = vi.spyOn(teacher, "getTeacherAttendance").mockResolvedValue({ session, students: [{ id: 81, name: "Ari Student", email: "ari@example.test", status: "present", method: "manual", note: null, markedAt: new Date("2026-09-01T10:00:00.000Z") }] } as never);
    const res = response();
    await (await import("./teacherPortal")).handleTeacherAttendance({ params: { id: "12" }, originalUrl: "/portal/teacher/class-sessions/12/attendance" } as never, res as never);
    expect(attendance).toHaveBeenCalledWith(41, 12);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ session, students: expect.any(Array) }));
  });

  it("returns 403 and never writes when the student is not assigned to the owned session", async () => {
    vi.spyOn(sdk, "authenticateRequest").mockResolvedValue(teacherUser);
    const save = vi.spyOn(teacher, "saveTeacherAttendance").mockRejectedValue(new teacher.TeacherSessionAccessError());
    const res = response();
    await (await import("./teacherPortal")).handleTeacherAttendanceUpdate({ params: { id: "12" }, body: { studentId: 999, status: "present", method: "manual" }, originalUrl: "/portal/teacher/class-sessions/12/attendance" } as never, res as never);
    expect(save).toHaveBeenCalledWith({ teacherId: 41, classSessionId: 12, studentId: 999, status: "present", method: "manual", note: undefined });
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("updates an existing attendance mark through the explicit upsert path", async () => {
    vi.spyOn(sdk, "authenticateRequest").mockResolvedValue(teacherUser);
    const save = vi.spyOn(teacher, "saveTeacherAttendance").mockResolvedValue({ session, attendance: null, grades: [], students: [] } as never);
    const res = response();
    await (await import("./teacherPortal")).handleTeacherAttendanceUpdate({ params: { id: "12" }, body: { studentId: 81, status: "late", method: "manual", note: "Arrived late" }, originalUrl: "/portal/teacher/class-sessions/12/attendance" } as never, res as never);
    expect(save).toHaveBeenCalledWith({ teacherId: 41, classSessionId: 12, studentId: 81, status: "late", method: "manual", note: "Arrived late" });
    expect(res.json).toHaveBeenCalled();
  });
});
