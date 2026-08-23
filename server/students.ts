import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { studentDocuments, studentProfileHistory, studentProfiles, users } from "../drizzle/schema";
import { getDb } from "./db";
import { storageGet, storagePut } from "./storage";

const supportedDocuments = new Map([
  ["application/pdf", "pdf"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
]);
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

export type StudentProfileInput = {
  name: string;
  email?: string | null;
  isActive: boolean;
  guardianName?: string | null;
  guardianPhone?: string | null;
  contactEmail?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  notes?: string | null;
  attendedSessions: number;
  totalSessions: number;
  currentLevel?: string | null;
  courseName?: string | null;
  courseCode?: string | null;
  courseStartDate?: string | null;
  courseEndDate?: string | null;
};

export type StudentListFilters = { query?: string; level?: string; course?: string; isActive?: boolean; sortBy?: "newest" | "name" | "level"; page?: number; pageSize?: number };

function requireDatabase(database: Awaited<ReturnType<typeof getDb>>) {
  if (!database) throw new Error("Student profiles are currently unavailable. Please try again shortly.");
  return database;
}

function normaliseOptional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normaliseDate(value?: string | null) {
  const normalised = normaliseOptional(value);
  return normalised ? new Date(`${normalised}T00:00:00.000Z`) : null;
}

function profileValues(input: StudentProfileInput) {
  if (input.attendedSessions > input.totalSessions) throw new Error("Attended sessions cannot exceed total sessions.");
  const start = normaliseOptional(input.courseStartDate);
  const end = normaliseOptional(input.courseEndDate);
  if (start && end && start > end) throw new Error("Course end date cannot be earlier than its start date.");
  return {
    guardianName: normaliseOptional(input.guardianName), guardianPhone: normaliseOptional(input.guardianPhone), contactEmail: normaliseOptional(input.contactEmail),
    dateOfBirth: normaliseDate(input.dateOfBirth), address: normaliseOptional(input.address), notes: normaliseOptional(input.notes),
    attendedSessions: input.attendedSessions, totalSessions: input.totalSessions, currentLevel: normaliseOptional(input.currentLevel),
    courseName: normaliseOptional(input.courseName), courseCode: normaliseOptional(input.courseCode), courseStartDate: normaliseDate(start), courseEndDate: normaliseDate(end),
  };
}

function safeHistoryChanges(before: Record<string, unknown> | null, after: Record<string, unknown>) {
  if (!before) return Object.keys(after).filter(key => after[key] !== null && after[key] !== "");
  return Object.keys(after).filter(key => String(before[key] ?? "") !== String(after[key] ?? ""));
}

async function writeHistory(database: any, studentId: number, actorUserId: number, eventType: string, changedFields: string[]) {
  await database.insert(studentProfileHistory).values({ studentId, actorUserId, eventType, changesJson: changedFields.length ? JSON.stringify({ changedFields }) : null });
}

function studentBaseWhere(studentId: number) { return and(eq(users.id, studentId), eq(users.role, "student")); }

export async function listStudentProfiles(filters: StudentListFilters = {}) {
  const database = requireDatabase(await getDb());
  const conditions = [eq(users.role, "student")];
  const query = filters.query?.trim();
  if (query) {
    const pattern = `%${query}%`;
    conditions.push(or(like(users.name, pattern), like(users.email, pattern), like(studentProfiles.currentLevel, pattern), like(studentProfiles.courseName, pattern), like(studentProfiles.courseCode, pattern))!);
  }
  if (filters.level) conditions.push(eq(studentProfiles.currentLevel, filters.level));
  if (filters.course) conditions.push(eq(studentProfiles.courseName, filters.course));
  if (filters.isActive !== undefined) conditions.push(eq(users.isActive, filters.isActive));
  const whereClause = and(...conditions);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 10, 1), 50);
  const page = Math.max(filters.page ?? 0, 0);
  const order = filters.sortBy === "name" ? asc(users.name) : filters.sortBy === "level" ? asc(studentProfiles.currentLevel) : desc(users.createdAt);
  const [rows, totals] = await Promise.all([
    database.select({ id: users.id, name: users.name, email: users.email, isActive: users.isActive, createdAt: users.createdAt, currentLevel: studentProfiles.currentLevel, courseName: studentProfiles.courseName, attendedSessions: studentProfiles.attendedSessions, totalSessions: studentProfiles.totalSessions }).from(users).leftJoin(studentProfiles, eq(studentProfiles.userId, users.id)).where(whereClause).orderBy(order, desc(users.id)).limit(pageSize).offset(page * pageSize),
    database.select({ count: sql<number>`count(*)` }).from(users).leftJoin(studentProfiles, eq(studentProfiles.userId, users.id)).where(whereClause),
  ]);
  return { rows, total: Number(totals[0]?.count ?? 0), page, pageSize };
}

export async function getStudentProfile(studentId: number) {
  const database = requireDatabase(await getDb());
  const profile = (await database.select({ userId: users.id, name: users.name, email: users.email, isActive: users.isActive, createdAt: users.createdAt, updatedAt: users.updatedAt, guardianName: studentProfiles.guardianName, guardianPhone: studentProfiles.guardianPhone, contactEmail: studentProfiles.contactEmail, dateOfBirth: studentProfiles.dateOfBirth, address: studentProfiles.address, notes: studentProfiles.notes, attendedSessions: studentProfiles.attendedSessions, totalSessions: studentProfiles.totalSessions, currentLevel: studentProfiles.currentLevel, courseName: studentProfiles.courseName, courseCode: studentProfiles.courseCode, courseStartDate: studentProfiles.courseStartDate, courseEndDate: studentProfiles.courseEndDate }).from(users).leftJoin(studentProfiles, eq(studentProfiles.userId, users.id)).where(studentBaseWhere(studentId)).limit(1))[0];
  if (!profile) return undefined;
  const [documents, history] = await Promise.all([
    database.select().from(studentDocuments).where(eq(studentDocuments.studentId, studentId)).orderBy(desc(studentDocuments.createdAt)),
    database.select({ id: studentProfileHistory.id, eventType: studentProfileHistory.eventType, changesJson: studentProfileHistory.changesJson, createdAt: studentProfileHistory.createdAt, actorName: users.name }).from(studentProfileHistory).leftJoin(users, eq(users.id, studentProfileHistory.actorUserId)).where(eq(studentProfileHistory.studentId, studentId)).orderBy(desc(studentProfileHistory.createdAt)).limit(100),
  ]);
  const documentsWithUrls = await Promise.all(documents.map(async document => ({ ...document, url: (await storageGet(document.storageKey)).url })));
  return { ...profile, documents: documentsWithUrls, history };
}

export async function createStudentProfile(input: StudentProfileInput, actorUserId: number) {
  const database = requireDatabase(await getDb());
  const email = normaliseOptional(input.email)?.toLowerCase() ?? null;
  if (email && (await database.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1))[0]) throw new Error("A user with this e-mail already exists.");
  const values = profileValues(input);
  let studentId = 0;
  await database.transaction(async tx => {
    const inserted = await tx.insert(users).values({ openId: `student-profile:${randomUUID()}`, name: input.name.trim(), email, isActive: input.isActive, loginMethod: "student-profile", role: "student", lastSignedIn: new Date() });
    studentId = Number(inserted[0].insertId);
    await tx.insert(studentProfiles).values({ userId: studentId, ...values });
    await writeHistory(tx, studentId, actorUserId, "student.created", ["student profile"]);
  });
  return getStudentProfile(studentId);
}

export async function updateStudentProfile(studentId: number, input: StudentProfileInput, actorUserId: number) {
  const database = requireDatabase(await getDb());
  const existing = await getStudentProfile(studentId);
  if (!existing) throw new Error("Student profile not found.");
  const email = normaliseOptional(input.email)?.toLowerCase() ?? null;
  if (email) {
    const duplicate = (await database.select({ id: users.id }).from(users).where(and(eq(users.email, email), sql`${users.id} <> ${studentId}`)).limit(1))[0];
    if (duplicate) throw new Error("A user with this e-mail already exists.");
  }
  const values = profileValues(input);
  const before = { ...existing };
  const after = { name: input.name.trim(), email, isActive: input.isActive, ...values };
  await database.transaction(async tx => {
    await tx.update(users).set({ name: after.name, email: after.email, isActive: after.isActive }).where(studentBaseWhere(studentId));
    await tx.insert(studentProfiles).values({ userId: studentId, ...values }).onDuplicateKeyUpdate({ set: values });
    await writeHistory(tx, studentId, actorUserId, "student.updated", safeHistoryChanges(before, after));
  });
  return getStudentProfile(studentId);
}

export async function deleteStudentProfile(studentId: number, actorUserId: number) {
  const database = requireDatabase(await getDb());
  const existing = await getStudentProfile(studentId);
  if (!existing) throw new Error("Student profile not found.");
  await database.transaction(async tx => {
    await tx.delete(studentDocuments).where(eq(studentDocuments.studentId, studentId));
    await tx.delete(studentProfileHistory).where(eq(studentProfileHistory.studentId, studentId));
    await tx.delete(studentProfiles).where(eq(studentProfiles.userId, studentId));
    await tx.delete(users).where(studentBaseWhere(studentId));
  });
  return { success: true } as const;
}

function fileExtension(mimeType: string) { return supportedDocuments.get(mimeType); }

function hasExpectedFileSignature(bytes: Buffer, mimeType: string) {
  if (mimeType === "application/pdf") return bytes.subarray(0, 5).toString("ascii") === "%PDF-";
  if (mimeType === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return bytes.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
}

export async function uploadStudentDocument(input: { studentId: number; fileName: string; mimeType: string; contentBase64: string }, actorUserId: number) {
  const database = requireDatabase(await getDb());
  if (!(await getStudentProfile(input.studentId))) throw new Error("Student profile not found.");
  const extension = fileExtension(input.mimeType);
  if (!extension) throw new Error("Only PDF, DOCX, JPG and PNG documents are supported.");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(input.contentBase64) || input.contentBase64.length % 4 !== 0) throw new Error("Document payload is invalid.");
  const bytes = Buffer.from(input.contentBase64, "base64");
  if (!bytes.length || bytes.length > MAX_DOCUMENT_BYTES) throw new Error("Document size must be between 1 byte and 5 MB.");
  if (!hasExpectedFileSignature(bytes, input.mimeType)) throw new Error("Document content does not match the selected file type.");
  const baseName = input.fileName.replace(/[^a-zA-Z0-9._ -]/g, "_").replace(/\.+/g, ".").slice(0, 180) || `student-document.${extension}`;
  const { key } = await storagePut(`students/${input.studentId}/${baseName}`, bytes, input.mimeType);
  const inserted = await database.insert(studentDocuments).values({ studentId: input.studentId, fileName: baseName, mimeType: input.mimeType, fileSize: bytes.length, storageKey: key, uploadedByUserId: actorUserId });
  await writeHistory(database, input.studentId, actorUserId, "document.uploaded", ["document"]);
  return (await database.select().from(studentDocuments).where(eq(studentDocuments.id, Number(inserted[0].insertId))).limit(1))[0];
}

export async function deleteStudentDocument(studentId: number, documentId: number, actorUserId: number) {
  const database = requireDatabase(await getDb());
  const document = (await database.select().from(studentDocuments).where(and(eq(studentDocuments.id, documentId), eq(studentDocuments.studentId, studentId))).limit(1))[0];
  if (!document) throw new Error("Student document not found.");
  await database.transaction(async tx => { await tx.delete(studentDocuments).where(eq(studentDocuments.id, documentId)); await writeHistory(tx, studentId, actorUserId, "document.removed", ["document"]); });
  return { success: true } as const;
}
