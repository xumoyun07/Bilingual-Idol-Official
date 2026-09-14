import { z } from "zod";
import * as db from "../db";
import { adminProcedure, publicProcedure, studentProcedure, router } from "../_core/trpc";

export const submissionInput = z.object({
  type: z.enum(["enrollment", "inquiry"]),
  studentName: z.string().trim().min(2, "Enter the student's full name.").max(160),
  studentAge: z.number().int().min(3, "Enter an age of 3 or above.").max(100, "Enter a valid age."),
  parentName: z.string().trim().min(2, "Enter the parent or guardian's name.").max(160),
  parentEmail: z.string().trim().email("Enter a valid email address.").max(320),
  parentPhone: z.string().trim().min(7, "Enter a valid phone number.").max(64),
  programInterest: z.string().trim().min(2, "Choose a programme.").max(180),
  preferredSchedule: z.string().trim().min(2, "Choose a preferred schedule.").max(180),
  message: z.string().trim().max(1500).optional(),
  source: z.string().trim().max(100).optional(),
});

export const createInquiryInput = z.object({
  studentName: z.string().trim().min(2, "Enter the student's full name.").max(160),
  studentAge: z.number().int().min(3, "Enter an age of 3 or above.").max(100, "Enter a valid age."),
  parentName: z.string().trim().min(2, "Enter the parent or guardian's name.").max(160),
  parentEmail: z.string().trim().email("Enter a valid email address.").max(320),
  parentPhone: z.string().trim().min(7, "Enter a valid phone number.").max(64),
  programInterest: z.string().trim().min(2, "Choose a programme.").max(180),
  preferredSchedule: z.string().trim().min(2, "Choose a preferred schedule.").max(180),
  message: z.string().trim().max(1500).optional(),
  source: z.string().trim().max(100).optional(),
  reasonType: z.enum(["general", "consultation", "campusTour"]).optional().default("general"),
  utmSource: z.string().trim().max(100).optional(),
  utmMedium: z.string().trim().max(100).optional(),
  utmCampaign: z.string().trim().max(100).optional(),
  utmTerm: z.string().trim().max(100).optional(),
  utmContent: z.string().trim().max(100).optional(),
});

export const submissionsRouter = router({
  list: adminProcedure.query(() => db.listSubmissions()),
  create: publicProcedure.input(submissionInput).mutation(({ input }) => db.createSubmission(input)),
  updateStatus: adminProcedure
    .input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "contacted", "interested", "enrolled", "closed"]) }))
    .mutation(({ input }) => db.updateSubmissionStatus(input.id, input.status)),
  delete: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input }) => db.deleteSubmission(input.id)),

  // Form 1: Inquiry Submission (from General Contact / LeadForm)
  createInquiry: publicProcedure
    .input(z.object({
      name: z.string().trim().min(2, "Name is too short.").max(160),
      email: z.string().trim().max(320).optional().default(""),
      phone: z.string().trim().max(64).optional().default(""),
      message: z.string().trim().max(1500).optional(),
      reasonType: z.enum(["general", "consultation", "campusTour"]),
      sourcePage: z.string().trim().max(255).optional().default(""),
    }).refine(data => data.email.length > 0 || data.phone.length > 0, {
      message: "Please provide at least an email or phone number.",
      path: ["email"],
    }))
    .mutation(({ input }) => db.createSubmission({
      type: "inquiry",
      studentName: input.name,
      studentAge: 18, // Default fallback age
      parentName: input.name,
      parentEmail: input.email || "no-email@bilc.my",
      parentPhone: input.phone || "no-phone",
      programInterest: "General Inquiry",
      preferredSchedule: "Any",
      message: input.message || "",
      source: input.sourcePage || "website",
      reasonType: input.reasonType,
    })),

  // Form 2 Schema & Submission
  getRegistrationSchema: publicProcedure.query(() => db.getRegistrationFormSchema()),
  createRegistration: publicProcedure
    .input(z.object({
      programInterest: z.string().trim().min(1, "Please select a program."),
      applicantCategory: z.enum(["child", "adult", "international"]),
      fullName: z.string().trim().min(2, "Name must be at least 2 characters."),
      email: z.string().trim().email("Please enter a valid email address."),
      phone: z.string().trim().min(7, "Please enter a valid phone number."),
      values: z.record(z.string(), z.string()).default({}),
    }))
    .mutation(async ({ input }) => {
      const { fields } = await db.getUserFormSchema(false);
      const registrationFields = fields.filter(f => f.collectionStage === "atRegistration");
      
      const fieldValues: Array<{ fieldId: number; value: string }> = [];
      for (const field of registrationFields) {
        const val = input.values[field.key];
        if (val !== undefined) {
          fieldValues.push({
            fieldId: field.id,
            value: val,
          });
        }
      }

      const submissionInput = {
        programInterest: input.programInterest,
        applicantCategory: input.applicantCategory,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        assignedToUserId: null,
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        utmTerm: null,
        utmContent: null,
      };

      return db.createRegistrationSubmission(submissionInput, fieldValues);
    }),

  // CRM & Admin controls for Registration Submissions
  listRegistrations: adminProcedure
    .input(z.object({ assignedToUserId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const all = await db.listRegistrationSubmissions();
      if (input?.assignedToUserId !== undefined) {
        return all.filter(s => s.assignedToUserId === input.assignedToUserId);
      }
      return all;
    }),
  getRegistration: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(({ input }) => db.getRegistrationSubmission(input.id)),
  updateRegistrationStatus: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["new", "routed", "accountCreated", "rejected"]),
      assignedToUserId: z.number().nullable().optional(),
    }))
    .mutation(({ input }) => db.updateRegistrationSubmissionStatus(input.id, input.status, input.assignedToUserId)),

  // Stage B: Onboarding (Completed by student upon first login)
  getOnboardingSchema: studentProcedure.query(({ ctx }) => db.getStudentOnboardingSchema(ctx.user.id)),
  submitOnboarding: studentProcedure
    .input(z.record(z.string(), z.string()))
    .mutation(({ ctx, input }) => db.saveUserProfileValues(ctx.user.id, input)),
});

