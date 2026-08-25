import { and, asc, desc, eq } from "drizzle-orm";
import { attendanceRecords, classSessions, grades, users } from "../drizzle/schema";
import { getDb } from "./db";

function requireDatabase(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) throw new Error("Database is currently unavailable. Please try again shortly.");
  return db;
}

export class TeacherSessionAccessError extends Error {
  constructor() {
    super("The selected class is not assigned to this teacher.");
  }
}

export async function listTeacherSchedule(teacherId: number) {
  const database = requireDatabase(await getDb());
  return database.select({
    id: classSessions.id,
    title: classSessions.title,
    courseName: classSessions.courseName,
    scheduledFor: classSessions.scheduledFor,
    startsAt: classSessions.startsAt,
    endsAt: classSessions.endsAt,
    room: classSessions.room,
    status: classSessions.status,
    studentId: classSessions.studentId,
    studentName: users.name,
    studentEmail: users.email,
  }).from(classSessions)
    .innerJoin(users, eq(users.id, classSessions.studentId))
    .where(eq(classSessions.teacherId, teacherId))
    .orderBy(asc(classSessions.scheduledFor), asc(classSessions.startsAt), asc(classSessions.id));
}

async function getOwnedSession(teacherId: number, classSessionId: number) {
  const database = requireDatabase(await getDb());
  const session = (await database.select({
    id: classSessions.id,
    title: classSessions.title,
    courseName: classSessions.courseName,
    teacherId: classSessions.teacherId,
    studentId: classSessions.studentId,
    scheduledFor: classSessions.scheduledFor,
    startsAt: classSessions.startsAt,
    endsAt: classSessions.endsAt,
    room: classSessions.room,
    status: classSessions.status,
    studentName: users.name,
    studentEmail: users.email,
  }).from(classSessions)
    .innerJoin(users, eq(users.id, classSessions.studentId))
    .where(and(eq(classSessions.id, classSessionId), eq(classSessions.teacherId, teacherId)))
    .limit(1))[0];
  if (!session) throw new TeacherSessionAccessError();
  return { database, session };
}

export async function getTeacherSessionDetails(teacherId: number, classSessionId: number) {
  const { database, session } = await getOwnedSession(teacherId, classSessionId);
  const [attendance] = await database.select().from(attendanceRecords)
    .where(and(eq(attendanceRecords.classSessionId, session.id), eq(attendanceRecords.studentId, session.studentId)))
    .limit(1);
  const sessionGrades = await database.select().from(grades)
    .where(and(eq(grades.classSessionId, session.id), eq(grades.studentId, session.studentId)))
    .orderBy(desc(grades.createdAt), desc(grades.id));
  return { session, attendance: attendance ?? null, grades: sessionGrades };
}

export async function saveTeacherAttendance(input: { teacherId: number; classSessionId: number; status: "present" | "absent" | "late" | "excused"; note?: string | null }) {
  const { database, session } = await getOwnedSession(input.teacherId, input.classSessionId);
  const note = input.note?.trim() || null;
  await database.insert(attendanceRecords).values({
    classSessionId: session.id,
    studentId: session.studentId,
    status: input.status,
    note,
    markedByTeacherId: input.teacherId,
    markedAt: new Date(),
  }).onDuplicateKeyUpdate({ set: { status: input.status, note, markedByTeacherId: input.teacherId, markedAt: new Date() } });
  return getTeacherSessionDetails(input.teacherId, session.id);
}

export async function upsertTeacherGrade(input: { teacherId: number; classSessionId: number; title: string; score: number; maxScore: number; feedback?: string | null; isPublished: boolean }) {
  const { database, session } = await getOwnedSession(input.teacherId, input.classSessionId);
  const title = input.title.trim();
  const feedback = input.feedback?.trim() || null;
  const publishedAt = input.isPublished ? new Date() : null;
  await database.insert(grades).values({
    classSessionId: session.id,
    studentId: session.studentId,
    title,
    score: input.score,
    maxScore: input.maxScore,
    feedback,
    isPublished: input.isPublished,
    publishedAt,
    gradedByTeacherId: input.teacherId,
  }).onDuplicateKeyUpdate({ set: { score: input.score, maxScore: input.maxScore, feedback, isPublished: input.isPublished, publishedAt, gradedByTeacherId: input.teacherId } });
  return getTeacherSessionDetails(input.teacherId, session.id);
}

export async function publishTeacherGrade(input: { teacherId: number; classSessionId: number; gradeId: number }) {
  const { database, session } = await getOwnedSession(input.teacherId, input.classSessionId);
  const updated = await database.update(grades).set({ isPublished: true, publishedAt: new Date(), gradedByTeacherId: input.teacherId })
    .where(and(eq(grades.id, input.gradeId), eq(grades.classSessionId, session.id), eq(grades.studentId, session.studentId)));
  if (!Number(updated[0].affectedRows ?? 0)) throw new Error("Grade not found for the selected class.");
  return getTeacherSessionDetails(input.teacherId, session.id);
}
