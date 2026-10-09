import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { founderProcedure, router } from "../_core/trpc";
import * as audit from "../audit";
import * as students from "../students";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";

const nullableText = (max: number) => z.string().trim().max(max).optional().nullable();
const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable();
const profileInput = z.object({
  name: z.string().trim().min(2).max(160), email: z.string().trim().email().max(320).optional().nullable(), isActive: z.boolean(),
  guardianName: nullableText(160), guardianPhone: nullableText(64), contactEmail: z.string().trim().email().max(320).optional().nullable(), dateOfBirth: dateText,
  address: nullableText(4000), notes: nullableText(4000), attendedSessions: z.number().int().min(0).max(100000), totalSessions: z.number().int().min(0).max(100000),
  currentLevel: nullableText(120), courseName: nullableText(180), courseCode: nullableText(80), courseStartDate: dateText, courseEndDate: dateText,
});
const documentInput = z.object({ studentId: z.number().int().positive(), fileName: z.string().trim().min(1).max(255), mimeType: z.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"]), contentBase64: z.string().min(4).max(7_000_000) });

function studentError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "The student profile action could not be completed." });
}

async function record(ctx: { user: Pick<User, "id" | "role">; req: Request }, action: audit.AuditAction, studentId: number | undefined, description: string, isSuccess = true) {
  try { await audit.writeAuditEvent({ actor: ctx.user, request: ctx.req, action, targetType: "student_profile", targetId: studentId, targetRole: "student", description, isSuccess, metadata: { module: "students_profile" } }); } catch (error) { console.error("[audit] Could not persist Students Profile event", error); }
}

export const studentsRouter = router({
  list: founderProcedure.input(z.object({ query: z.string().trim().max(160).optional(), level: z.string().trim().max(120).optional(), course: z.string().trim().max(180).optional(), isActive: z.boolean().optional(), sortBy: z.enum(["newest", "name", "level"]).default("newest"), page: z.number().int().min(0).default(0), pageSize: z.number().int().min(1).max(50).default(10) })).query(({ input }) => students.listStudentProfiles(input)),
  byId: founderProcedure.input(z.object({ studentId: z.number().int().positive() })).query(async ({ input }) => {
    const profile = await students.getStudentProfile(input.studentId);
    if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Student profile not found." });
    return profile;
  }),
  create: founderProcedure.input(profileInput).mutation(async ({ ctx, input }) => {
    try { const profile = await students.createStudentProfile(input, ctx.user.id); if (!profile) throw new Error("Student profile was not returned."); await record(ctx, "student_profile.create", profile.userId, "Created a student profile."); return profile; } catch (error) { await record(ctx, "student_profile.create", undefined, "Student profile creation failed.", false); return studentError(error); }
  }),
  update: founderProcedure.input(profileInput.extend({ studentId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try { const { studentId, ...profileInput } = input; const profile = await students.updateStudentProfile(studentId, profileInput, ctx.user.id); if (!profile) throw new Error("Student profile was not returned."); await record(ctx, "student_profile.update", studentId, "Updated a student profile."); return profile; } catch (error) { await record(ctx, "student_profile.update", input.studentId, "Student profile update failed.", false); return studentError(error); }
  }),
  remove: founderProcedure.input(z.object({ studentId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try { const result = await students.deleteStudentProfile(input.studentId, ctx.user.id); await record(ctx, "student_profile.delete", input.studentId, "Deleted a student profile."); return result; } catch (error) { await record(ctx, "student_profile.delete", input.studentId, "Student profile deletion failed.", false); return studentError(error); }
  }),
  uploadDocument: founderProcedure.input(documentInput).mutation(async ({ ctx, input }) => {
    try { const document = await students.uploadStudentDocument(input, ctx.user.id); await record(ctx, "student_document.upload", input.studentId, "Uploaded a student document."); return document; } catch (error) { await record(ctx, "student_document.upload", input.studentId, "Student document upload failed.", false); return studentError(error); }
  }),
  removeDocument: founderProcedure.input(z.object({ studentId: z.number().int().positive(), documentId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try { const result = await students.deleteStudentDocument(input.studentId, input.documentId, ctx.user.id); await record(ctx, "student_document.delete", input.studentId, "Removed a student document."); return result; } catch (error) { await record(ctx, "student_document.delete", input.studentId, "Student document removal failed.", false); return studentError(error); }
  }),
});
