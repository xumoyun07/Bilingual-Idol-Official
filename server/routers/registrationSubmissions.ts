import { z } from "zod";
import * as db from "../db";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";

export const registrationSubmissionsRouter = router({
  // CRM Registration Submissions (Form 2)
  getRegistrationFields: publicProcedure.query(async () => {
    const { fields, sections } = await db.getUserFormSchema(false);
    return {
      fields: fields.filter(f => f.collectionStage === "atRegistration"),
      sections,
    };
  }),

  submit: publicProcedure
    .input(z.object({
      programInterest: z.string().trim().min(2, "Select a course interest"),
      applicantCategory: z.string().trim().min(1, "Select applicant category"),
      fullName: z.string().trim().min(2, "Enter your full name"),
      email: z.string().trim().email("Enter a valid email address"),
      phone: z.string().trim().min(7, "Enter a valid phone number"),
      fieldValues: z.array(z.object({
        fieldId: z.number().int().positive(),
        value: z.string().trim(),
      })),
      utmSource: z.string().optional(),
      utmMedium: z.string().optional(),
      utmCampaign: z.string().optional(),
      utmTerm: z.string().optional(),
      utmContent: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { fieldValues, ...submissionData } = input;
      return db.createRegistrationSubmission({
        ...submissionData,
        assignedToUserId: null,
        utmSource: input.utmSource ?? null,
        utmMedium: input.utmMedium ?? null,
        utmCampaign: input.utmCampaign ?? null,
        utmTerm: input.utmTerm ?? null,
        utmContent: input.utmContent ?? null,
      }, fieldValues);
    }),

  list: adminProcedure.query(async () => {
    return db.listRegistrationSubmissions();
  }),

  updateStatus: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["new", "routed", "accountCreated", "rejected"]),
      assignedToUserId: z.number().int().positive().optional(),
    }))
    .mutation(async ({ input }) => {
      return db.updateRegistrationSubmissionStatus(input.id, input.status, input.assignedToUserId);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      return db.deleteRegistrationSubmission(input.id);
    }),

  // Application Tracker (Section 4.5)
  listApplications: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return [];
    // Regular students see their own applications
    if (ctx.user.role === "student" || ctx.user.role === "user") {
      return db.listApplications(ctx.user.id);
    }
    // Admins and Founders can see all
    return db.listApplications();
  }),

  createApplication: adminProcedure
    .input(z.object({
      userId: z.number().int().positive(),
      status: z.enum(["submitted", "documentsReceived", "underReview", "offerIssued", "paymentCompleted", "visaProcess", "registrationCompleted"]).optional(),
    }))
    .mutation(async ({ input }) => {
      return db.createApplication(input.userId, input.status);
    }),

  updateApplicationStatus: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["submitted", "documentsReceived", "underReview", "offerIssued", "paymentCompleted", "visaProcess", "registrationCompleted"]),
    }))
    .mutation(async ({ input }) => {
      return db.updateApplicationStatus(input.id, input.status);
    }),

  deleteApplication: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      return db.deleteApplication(input.id);
    }),
});
