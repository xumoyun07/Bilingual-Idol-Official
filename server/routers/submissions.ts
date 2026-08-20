import { z } from "zod";
import * as db from "../db";
import { founderProcedure, publicProcedure, router } from "../_core/trpc";

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

export const submissionsRouter = router({
  create: publicProcedure.input(submissionInput).mutation(({ input }) => db.createSubmission(input)),
  list: founderProcedure.query(() => db.listSubmissions()),
  updateStatus: founderProcedure
    .input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "contacted", "interested", "enrolled", "closed"]) }))
    .mutation(({ input }) => db.updateSubmissionStatus(input.id, input.status)),
});
