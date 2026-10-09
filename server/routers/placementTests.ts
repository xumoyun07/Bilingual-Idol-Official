import { z } from "zod";
import * as db from "../db";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";

export const placementTestsRouter = router({
  list: publicProcedure.query(async () => {
    return db.listPlacementTests();
  }),

  get: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const test = await db.getPlacementTest(input.id);
      if (!test) throw new Error("Test not found");
      return test;
    }),

  submitAttempt: publicProcedure
    .input(z.object({
      testId: z.number().int().positive(),
      answers: z.record(z.string(), z.string()), // Question ID to selected option
      guestName: z.string().trim().optional(),
      guestEmail: z.string().trim().email("Enter a valid email").optional(),
      guestPhone: z.string().trim().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const test = await db.getPlacementTest(input.testId);
      if (!test) throw new Error("Placement test not found");

      const questions = JSON.parse(test.questionsJson);
      let score = 0;
      const maxScore = questions.length;

      // Calculate score based on answers matching question solution key
      questions.forEach((q: any) => {
        const selected = input.answers[q.id];
        if (selected && selected === q.answer) {
          score++;
        }
      });

      // Compute CEFR Level based on scoring ratio
      const ratio = score / maxScore;
      let cefrLevel = "A1";
      let recommendedCourse = "General English (Beginner - A1)";

      if (ratio > 0.8) {
        cefrLevel = "C1";
        recommendedCourse = "Business English or Speaking & Conversation (Advanced - C1)";
      } else if (ratio > 0.6) {
        cefrLevel = "B2";
        recommendedCourse = "Speaking & Conversation or IELTS Prep (Upper-Intermediate - B2)";
      } else if (ratio > 0.4) {
        cefrLevel = "B1";
        recommendedCourse = "General English or Speaking & Conversation (Intermediate - B1)";
      } else if (ratio > 0.2) {
        cefrLevel = "A2";
        recommendedCourse = "General English (Elementary - A2)";
      }

      // Prepend language specific detail to recommendation
      const lang = test.language;
      if (lang !== "English") {
        recommendedCourse = `${lang} Programme (${cefrLevel} Level)`;
      }

      const attemptData = {
        userId: ctx.user ? ctx.user.id : null,
        guestName: input.guestName || null,
        guestEmail: input.guestEmail || null,
        guestPhone: input.guestPhone || null,
        testId: input.testId,
        answersJson: JSON.stringify(input.answers),
        score,
        maxScore,
        cefrLevel,
        recommendedCourse,
      };

      const result = await db.createPlacementTestAttempt(attemptData);
      return {
        id: result.id,
        score,
        maxScore,
        cefrLevel,
        recommendedCourse,
      };
    }),

  listAttempts: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return [];
    if (ctx.user.role === "student" || ctx.user.role === "user") {
      return db.listPlacementTestAttempts(ctx.user.id);
    }
    return db.listPlacementTestAttempts();
  }),

  createTest: adminProcedure
    .input(z.object({
      title: z.string().trim().min(2, "Test title is required"),
      language: z.string().trim().min(2, "Language is required"),
      isActive: z.boolean().default(true),
      questionsJson: z.string(),
    }))
    .mutation(async ({ input }) => {
      return db.createPlacementTest(input);
    }),

  deleteTest: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      return db.deletePlacementTest(input.id);
    }),
});
