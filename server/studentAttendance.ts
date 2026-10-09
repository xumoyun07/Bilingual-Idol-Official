import { and, eq, lte, ne, sql } from "drizzle-orm";
import { attendanceRecords, classSessions } from "../drizzle/schema";
import { getDb } from "./db";

export async function getStudentAttendanceSummary(studentId: number) {
  const database = await getDb();
  if (!database) {
    return { attendedSessions: 0, totalSessions: 0, percentage: 0 };
  }
  const [result] = await database.select({
    totalSessions: sql<number>`count(distinct ${classSessions.id})`,
    attendedSessions: sql<number>`coalesce(sum(case when ${attendanceRecords.status} in ('present', 'late') then 1 else 0 end), 0)`,
  }).from(classSessions)
    .leftJoin(attendanceRecords, and(eq(attendanceRecords.classSessionId, classSessions.id), eq(attendanceRecords.studentId, studentId)))
    .where(and(eq(classSessions.studentId, studentId), ne(classSessions.status, "cancelled"), lte(classSessions.scheduledFor, new Date())));
  const totalSessions = Number(result?.totalSessions ?? 0);
  const attendedSessions = Number(result?.attendedSessions ?? 0);
  return { attendedSessions, totalSessions, percentage: totalSessions ? Math.round((attendedSessions / totalSessions) * 100) : 0 };
}

export type StudentAttendanceSummary = Awaited<ReturnType<typeof getStudentAttendanceSummary>>;
