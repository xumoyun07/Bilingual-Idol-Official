import { afterEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./students", () => ({
  listStudentProfiles: vi.fn(), getStudentProfile: vi.fn(), createStudentProfile: vi.fn(), updateStudentProfile: vi.fn(), deleteStudentProfile: vi.fn(), uploadStudentDocument: vi.fn(), deleteStudentDocument: vi.fn(),
}));
vi.mock("./audit", async importOriginal => {
  const actual = await importOriginal<typeof import("./audit")>();
  return { ...actual, writeAuditEvent: vi.fn().mockResolvedValue(1) };
});

import * as students from "./students";
import { appRouter } from "./routers";

function context(role: "founder" | "super_admin" | "student" | null): TrpcContext {
  return { user: role ? { id: 77, openId: `${role}:test`, name: role, email: `${role}@example.test`, passwordHash: null, isActive: true, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } : null, req: { headers: {}, ip: "127.0.0.1", socket: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const student = { userId: 12, name: "Ari Student", email: "ari@example.test", isActive: true, guardianName: null, guardianPhone: null, contactEmail: null, dateOfBirth: null, address: null, notes: null, attendedSessions: 4, totalSessions: 5, currentLevel: "A2", courseName: "English", courseCode: "ENG-A2", courseStartDate: null, courseEndDate: null, createdAt: new Date(), updatedAt: new Date(), documents: [], history: [] };
const input = { name: "Ari Student", email: "ari@example.test", isActive: true, guardianName: null, guardianPhone: null, contactEmail: null, dateOfBirth: null, address: null, notes: null, attendedSessions: 4, totalSessions: 5, currentLevel: "A2", courseName: "English", courseCode: "ENG-A2", courseStartDate: null, courseEndDate: null };

afterEach(() => vi.restoreAllMocks());

describe("Students Profile router", () => {
  it("denies every non-Founder role", async () => {
    for (const role of [null, "super_admin", "student"] as const) await expect(appRouter.createCaller(context(role)).students.list({})).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("forwards search, filters, sort and pagination only through the Founder procedure", async () => {
    vi.mocked(students.listStudentProfiles).mockResolvedValue({ rows: [], total: 0, page: 1, pageSize: 10 });
    await expect(appRouter.createCaller(context("founder")).students.list({ query: "ari", level: "A2", course: "English", isActive: true, sortBy: "level", page: 1, pageSize: 10 })).resolves.toMatchObject({ page: 1, pageSize: 10 });
    expect(students.listStudentProfiles).toHaveBeenCalledWith(expect.objectContaining({ query: "ari", level: "A2", course: "English", isActive: true, sortBy: "level", page: 1, pageSize: 10 }));
  });

  it("creates, updates and deletes a profile under the authenticated Founder actor", async () => {
    vi.mocked(students.createStudentProfile).mockResolvedValue(student as never);
    vi.mocked(students.updateStudentProfile).mockResolvedValue(student as never);
    vi.mocked(students.deleteStudentProfile).mockResolvedValue({ success: true });
    const caller = appRouter.createCaller(context("founder"));
    await expect(caller.students.create(input)).resolves.toMatchObject({ userId: 12 });
    await expect(caller.students.update({ studentId: 12, ...input, currentLevel: "B1" })).resolves.toMatchObject({ userId: 12 });
    await expect(caller.students.remove({ studentId: 12 })).resolves.toEqual({ success: true });
    expect(students.createStudentProfile).toHaveBeenCalledWith(expect.objectContaining({ name: "Ari Student" }), 77);
    expect(students.updateStudentProfile).toHaveBeenCalledWith(12, expect.objectContaining({ currentLevel: "B1" }), 77);
    expect(students.deleteStudentProfile).toHaveBeenCalledWith(12, 77);
  });

  it("accepts only the supported document MIME contract and uses Founder identity", async () => {
    vi.mocked(students.uploadStudentDocument).mockResolvedValue({ id: 9, studentId: 12, fileName: "profile.pdf", mimeType: "application/pdf", fileSize: 32, storageKey: "students/12/profile.pdf", uploadedByUserId: 77, createdAt: new Date() } as never);
    const caller = appRouter.createCaller(context("founder"));
    await expect(caller.students.uploadDocument({ studentId: 12, fileName: "profile.pdf", mimeType: "application/pdf", contentBase64: "dGVzdA==" })).resolves.toMatchObject({ id: 9 });
    await expect(caller.students.uploadDocument({ studentId: 12, fileName: "unsafe.exe", mimeType: "application/octet-stream" as never, contentBase64: "dGVzdA==" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(students.uploadStudentDocument).toHaveBeenCalledWith(expect.objectContaining({ studentId: 12, mimeType: "application/pdf" }), 77);
  });
});
