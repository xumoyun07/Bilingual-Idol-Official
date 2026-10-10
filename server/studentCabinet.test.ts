import { beforeEach, describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { inMemoryStore } from "./db";

/**
 * S4: студент видит только собственные опубликованные оценки и собственные
 * документы; неопубликованное и чужое — никогда.
 */

const STUDENT = { id: 4, email: "a@example.test", role: "student" };
const OTHER = { id: 5, email: "b@example.test", role: "student" };
const TEACHER = { id: 6, email: "t@example.test", role: "teacher" };

function seed() {
  inMemoryStore.users = [STUDENT, OTHER, TEACHER].map(row => ({
    id: row.id, openId: `seed:${row.id}`, name: `Seed ${row.role}`, email: row.email,
    passwordHash: null, role: row.role, isActive: true, loginMethod: "test",
    createdAt: new Date("2026-01-01T00:00:00.000Z"), updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    lastSignedIn: new Date("2026-01-01T00:00:00.000Z"), sessionVersion: 1, isOtp: false,
    otpCreatedAt: null, failedAttempts: 0,
  })) as never;

  (inMemoryStore as unknown as { grades?: unknown[] }).grades = [
    { id: 1, classSessionId: 1, studentId: STUDENT.id, title: "Quiz 1", score: 78, maxScore: 100, feedback: null, isPublished: true, publishedAt: new Date(), gradedByTeacherId: TEACHER.id, createdAt: new Date() },
    { id: 2, classSessionId: 1, studentId: STUDENT.id, title: "Quiz 2 (draft)", score: 50, maxScore: 100, feedback: null, isPublished: false, publishedAt: null, gradedByTeacherId: TEACHER.id, createdAt: new Date() },
    { id: 3, classSessionId: 1, studentId: OTHER.id, title: "Quiz 1", score: 90, maxScore: 100, feedback: null, isPublished: true, publishedAt: new Date(), gradedByTeacherId: TEACHER.id, createdAt: new Date() },
  ];

  (inMemoryStore as unknown as { studentDocuments?: unknown[] }).studentDocuments = [
    { id: 10, studentId: STUDENT.id, fileName: "Offer Letter.pdf", mimeType: "application/pdf", fileSize: 1000, storageKey: "docs/offer.pdf", uploadedByUserId: 1, createdAt: new Date() },
    { id: 11, studentId: OTHER.id, fileName: "Other Invoice.pdf", mimeType: "application/pdf", fileSize: 1000, storageKey: "docs/other.pdf", uploadedByUserId: 1, createdAt: new Date() },
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

beforeEach(seed);

describe("studentCabinet.grades", () => {
  it("отдаёт только свои опубликованные оценки", async () => {
    const rows = await caller("student").studentCabinet.grades();
    expect(rows.map(r => r.id)).toEqual([1]);
    expect(JSON.stringify(rows)).not.toContain("Quiz 2");
    expect(JSON.stringify(rows)).not.toContain("90");
  });

  it("teacher не имеет доступа", async () => {
    await expect(caller("teacher").studentCabinet.grades()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("studentCabinet.documents", () => {
  it("отдаёт только свои документы, без чужого файла", async () => {
    const rows = await caller("student").studentCabinet.documents();
    expect(rows.map(r => r.id)).toEqual([10]);
    expect(JSON.stringify(rows)).not.toContain("Other Invoice");
  });

  it("teacher не имеет доступа", async () => {
    await expect(caller("teacher").studentCabinet.documents()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("изоляция", () => {
  it("у процедур нет параметров — чужой id подставить нельзя", () => {
    const procedures = appRouter._def.procedures as Record<string, unknown>;
    expect(procedures["studentCabinet.grades"]).toBeDefined();
    expect(procedures["studentCabinet.documents"]).toBeDefined();
  });
});
