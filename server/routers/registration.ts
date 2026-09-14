import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";

export const registrationSubmitInput = z.object({
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
});

export const registrationRouter = router({
  submit: publicProcedure
    .input(registrationSubmitInput)
    .mutation(async ({ input }) => {
      // Fetch all fields to perform validation against the database state
      const { fields } = await db.getUserFormSchema(true);
      const registrationFieldIds = new Set(
        fields.filter(f => f.collectionStage === "atRegistration").map(f => f.id)
      );

      // Validate that all transmitted dynamic field IDs strictly belong to the 'atRegistration' stage
      for (const val of input.fieldValues) {
        if (!registrationFieldIds.has(val.fieldId)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Field ID ${val.fieldId} does not belong to the registration collection stage.`,
          });
        }
      }

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

  formSchema: publicProcedure.query(async () => {
    // Only return active fields and active sections for the frontend form builder
    const { fields, sections } = await db.getUserFormSchema(false);
    return {
      fields: fields.filter(f => f.collectionStage === "atRegistration"),
      sections,
    };
  }),

  onboardingSchema: protectedProcedure.query(async ({ ctx }) => {
    // Strict security check: only current users with 'student' role are allowed to fetch onboarding fields
    if (ctx.user.role !== "student") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This resource is restricted to students.",
      });
    }

    // Fetch active dynamic fields with 'atFirstLogin' collection stage
    const { fields, sections } = await db.getUserFormSchema(false);
    const onboardingFields = fields.filter(f => f.collectionStage === "atFirstLogin");

    // Fetch values already filled out by this specific student from userProfileValues table
    const filledValues = await db.getUserProfileValues(ctx.user.id);
    const filledFieldIds = new Set(filledValues.map(v => v.fieldId));

    // Return only active fields that this student has not yet answered
    const unfilledFields = onboardingFields.filter(f => !filledFieldIds.has(f.id));

    return {
      fields: unfilledFields,
      sections,
    };
  }),
});
