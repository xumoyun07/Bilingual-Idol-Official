import { z } from "zod";
import * as db from "../db";
import { adminProcedure, publicProcedure, studentProcedure, marketingProcedure, router } from "../_core/trpc";
import { notifyEnquiryReceived } from "../services/notifications";

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
  list: marketingProcedure.query(() => db.listSubmissions()),
  /**
   * F25/F26: старая параллельная схема регистрации (type='enrollment' со
   * studentName/studentAge/parentName/...) больше не принимает НОВЫЕ записи:
   * все регистрации идут через Form 2 (registrationSubmissions). Исторические
   * строки type='enrollment' остаются в БД и в отчётах. Лёгкие обращения —
   * через createInquiry ниже.
   */
  create: publicProcedure.input(submissionInput).mutation(({ input }) => {
    if (input.type === "enrollment") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Programme registration now goes through the unified registration form." });
    }
    return db.createSubmission(input);
  }),
  updateStatus: marketingProcedure
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
      programId: z.number().int().positive().nullable().optional(),
      programInterest: z.string().trim().optional().default(""),
      message: z.string().trim().max(1500).optional(),
      reasonType: z.enum(["general", "consultation", "campusTour"]),
      sourcePage: z.string().trim().max(255).optional().default(""),
    }).refine(data => data.email.length > 0 || data.phone.length > 0, {
      message: "Please provide at least an email or phone number.",
      path: ["email"],
    }))
    .mutation(async ({ input }) => {
      const programs = await db.listPrograms();
      const matched = input.programId ? programs.find(p => p.id === input.programId) : null;
      const programInterestText = matched ? matched.title : input.programInterest || "General Inquiry";

      const created = await db.createSubmission({
        type: "inquiry",
        studentName: input.name,
        studentAge: 18, // Default fallback age
        parentName: input.name,
        parentEmail: input.email || "no-email@bilc.my",
        parentPhone: input.phone || "no-phone",
        programId: input.programId || null,
        programInterest: programInterestText,
        preferredSchedule: "Any",
        message: input.message || "",
        source: input.sourcePage || "website",
        reasonType: input.reasonType,
      });
      // G10: подтверждение обращения; уведомление не блокирует запрос.
      void notifyEnquiryReceived({ name: input.name, email: input.email, phone: input.phone, reasonType: input.reasonType, message: input.message }).catch(function () { /* noop */ });
      return created;
    }),

  // Form 2 Schema & Submission
  getRegistrationSchema: publicProcedure.query(() => db.getRegistrationFormSchema()),
  createRegistration: publicProcedure
    .input(z.object({
      programId: z.number().int().positive(),
      programInterest: z.string().trim().optional().default(""),
      applicantCategory: z.string().min(1, "Please select an applicant category."),
      fullName: z.string().trim().min(2, "Name must be at least 2 characters."),
      email: z.string().trim().email("Please enter a valid email address."),
      phone: z.string().trim().min(7, "Please enter a valid phone number."),
      values: z.record(z.string(), z.string()).default({}),
      utmSource: z.string().trim().max(100).optional().nullable(),
      utmMedium: z.string().trim().max(100).optional().nullable(),
      utmCampaign: z.string().trim().max(100).optional().nullable(),
      utmTerm: z.string().trim().max(100).optional().nullable(),
      utmContent: z.string().trim().max(100).optional().nullable(),
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

      const programs = await db.listPrograms();
      const matched = programs.find(p => p.id === input.programId);
      const programInterestText = matched ? matched.title : input.programInterest || "Unknown Program";

      const submissionInput = {
        programId: input.programId,
        programInterest: programInterestText,
        applicantCategory: input.applicantCategory,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        assignedToUserId: null,
        utmSource: input.utmSource || null,
        utmMedium: input.utmMedium || null,
        utmCampaign: input.utmCampaign || null,
        utmTerm: input.utmTerm || null,
        utmContent: input.utmContent || null,
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

