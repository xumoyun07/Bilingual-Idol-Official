/**
 * Личный кабинет студента (S4): собственные опубликованные оценки и собственные
 * документы. Только просмотр/скачивание: загрузка и удаление — зона founder/admin
 * (students router), неопубликованные оценки (isPublished=false) сюда не попадают.
 * Параметров нет — только ctx.user.id, поэтому чужие строки прочитать невозможно.
 */

import { and, desc, eq } from "drizzle-orm";
import { grades, studentDocuments } from "../../drizzle/schema";
import { getDb, inMemoryStore } from "../db";
import { router, studentProcedure } from "../_core/trpc";

async function publishedGradesFor(studentId: number) {
  const database = await getDb();
  if (!database) {
    const store = (inMemoryStore as unknown as { grades?: Array<Record<string, unknown>> }).grades ?? [];
    return store
      .filter(g => Number(g.studentId) === studentId && Boolean(g.isPublished))
      .sort((a, b) => Number(b.id) - Number(a.id));
  }
  return database
    .select()
    .from(grades)
    .where(and(eq(grades.studentId, studentId), eq(grades.isPublished, true)))
    .orderBy(desc(grades.createdAt));
}

async function documentsFor(studentId: number) {
  const database = await getDb();
  if (!database) {
    const store = (inMemoryStore as unknown as { studentDocuments?: Array<Record<string, unknown>> }).studentDocuments ?? [];
    return store
      .filter(d => Number(d.studentId) === studentId)
      .sort((a, b) => Number(b.id) - Number(a.id));
  }
  return database
    .select()
    .from(studentDocuments)
    .where(eq(studentDocuments.studentId, studentId))
    .orderBy(desc(studentDocuments.createdAt));
}

export const studentCabinetRouter = router({
  /** Опубликованные оценки текущего студента (Progress "78%", предстоящие экзамены). */
  grades: studentProcedure.query(async ({ ctx }) => publishedGradesFor(ctx.user.id)),

  /** Документы личного дела (Offer Letter, Certificate, Invoice) — только чтение. */
  documents: studentProcedure.query(async ({ ctx }) => documentsFor(ctx.user.id)),
});
