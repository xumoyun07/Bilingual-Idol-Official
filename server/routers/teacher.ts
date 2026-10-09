import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { teacherProcedure, router } from "../_core/trpc";
import * as teacher from "../teacher";

const classSessionInput = z.object({ classSessionId: z.number().int().positive() });
const scheduleFilterInput = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).refine(input => !input.from || !input.to || input.from <= input.to, { message: "The start date must not be after the end date.", path: ["to"] });

function asUtcDate(value: string | undefined) {
  return value ? new Date(`${value}T00:00:00.000Z`) : undefined;
}

function teacherError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  if (error instanceof teacher.TeacherSessionAccessError) throw new TRPCError({ code: "FORBIDDEN", message: "This class is not assigned to your account." });
  throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "The teacher action could not be completed." });
}

export const teacherRouter = router({
  schedule: teacherProcedure.input(scheduleFilterInput.optional()).query(async ({ ctx, input }) => {
    try { return await teacher.listTeacherSchedule(ctx.user.id, { from: asUtcDate(input?.from), to: asUtcDate(input?.to) }); } catch (error) { return teacherError(error); }
  }),
  sessionDetails: teacherProcedure.input(classSessionInput).query(async ({ ctx, input }) => {
    try { return await teacher.getTeacherSessionDetails(ctx.user.id, input.classSessionId); } catch (error) { return teacherError(error); }
  }),
  attendance: teacherProcedure.input(classSessionInput).query(async ({ ctx, input }) => {
    try { return await teacher.getTeacherAttendance(ctx.user.id, input.classSessionId); } catch (error) { return teacherError(error); }
  }),
  saveAttendance: teacherProcedure.input(classSessionInput.extend({ studentId: z.number().int().positive(), status: z.enum(["present", "absent", "late", "excused"]), method: z.enum(["manual", "qr"]).default("manual"), note: z.string().trim().max(2000).optional().nullable() })).mutation(async ({ ctx, input }) => {
    try { return await teacher.saveTeacherAttendance({ teacherId: ctx.user.id, ...input }); } catch (error) { return teacherError(error); }
  }),
  upsertGrade: teacherProcedure.input(classSessionInput.extend({ title: z.string().trim().min(1).max(160), score: z.number().int().min(0).max(100000), maxScore: z.number().int().min(1).max(100000), feedback: z.string().trim().max(4000).optional().nullable(), isPublished: z.boolean() }).refine(input => input.score <= input.maxScore, { message: "Score cannot exceed the maximum score.", path: ["score"] })).mutation(async ({ ctx, input }) => {
    try { return await teacher.upsertTeacherGrade({ teacherId: ctx.user.id, ...input }); } catch (error) { return teacherError(error); }
  }),
  publishGrade: teacherProcedure.input(classSessionInput.extend({ gradeId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try { return await teacher.publishTeacherGrade({ teacherId: ctx.user.id, ...input }); } catch (error) { return teacherError(error); }
  }),
});
