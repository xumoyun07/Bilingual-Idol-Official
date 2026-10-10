import { z } from "zod";
import * as db from "../db";
import { adminProcedure, studentProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

export const enrollmentsRouter = router({
  // 1. List all enrollments (Admin, Super Admin, Founder)
  list: adminProcedure.query(async () => {
    return db.listEnrollments();
  }),

  // 2. Fetch all enrollments for a specific student (Admin, Super Admin, Founder)
  byUserId: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return db.getEnrollmentsByUserId(input.userId);
    }),

  // 3. Fetch active and past enrollments for currently logged-in student (Student self-only)
  myEnrollments: studentProcedure.query(async ({ ctx }) => {
    return db.getEnrollmentsByUserId(ctx.user.id);
  }),

  // 4. Create client account + first active enrollment in a single transaction (Admin)
  createClientAccountAndEnrollment: adminProcedure
    .input(z.object({
      name: z.string().trim().min(2, "Name must be at least 2 characters.").max(160),
      email: z.string().trim().email("Please enter a valid email address.").max(320),
      phone: z.string().trim().min(5, "Please enter a valid phone number.").max(64),
      programId: z.number().int().positive(),
      agreedPrice: z.number().int().min(0),
      registrationFee: z.number().int().min(0).default(0),
      placementTestFee: z.number().int().min(0).default(0),
      visaFee: z.number().int().min(0).default(0),
      source: z.enum(["registration_form", "enquiry_form", "direct_call", "whatsapp"]),
      submissionId: z.number().int().positive().nullable().optional(),
      registrationSubmissionId: z.number().int().positive().nullable().optional(),
      notes: z.string().trim().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await db.createClientAccountAndEnrollment({
          ...input,
          approvedByUserId: ctx.user.id,
        }, ctx.user);
        return result;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Could not create client account and enrollment.";
        throw new TRPCError({ code: "BAD_REQUEST", message: msg });
      }
    }),

  // 5. Create a new active enrollment for an EXISTING student (Admin)
  // When a previous program is completed, the admin can enroll them in a new program on the same account.
  createEnrollmentForExistingStudent: adminProcedure
    .input(z.object({
      userId: z.number().int().positive(),
      programId: z.number().int().positive(),
      agreedPrice: z.number().int().min(0),
      registrationFee: z.number().int().min(0).default(0),
      placementTestFee: z.number().int().min(0).default(0),
      visaFee: z.number().int().min(0).default(0),
      source: z.enum(["registration_form", "enquiry_form", "direct_call", "whatsapp"]),
      notes: z.string().trim().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await db.createEnrollment({
          ...input,
          notes: input.notes ?? null,
          approvedByUserId: ctx.user.id,
          submissionId: null,
          registrationSubmissionId: null,
        });
        return result;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Could not create enrollment.";
        throw new TRPCError({ code: "BAD_REQUEST", message: msg });
      }
    }),

  // 6. Close an active enrollment (Set status to completed or cancelled) (Admin)
  closeEnrollment: adminProcedure
    .input(z.object({
      enrollmentId: z.number().int().positive(),
      status: z.enum(["completed", "cancelled"]),
    }))
    .mutation(async ({ input }) => {
      try {
        return await db.closeEnrollment(input.enrollmentId, input.status);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Could not close enrollment.";
        throw new TRPCError({ code: "BAD_REQUEST", message: msg });
      }
    }),
});
