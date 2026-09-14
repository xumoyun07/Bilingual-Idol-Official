import { z } from "zod";
import * as db from "../db";
import { marketingProcedure, publicProcedure, router } from "../_core/trpc";

export const promotionsRouter = router({
  validate: publicProcedure
    .input(z.object({
      code: z.string().trim().toUpperCase().min(1, "Enter a promotion code"),
    }))
    .mutation(async ({ input }) => {
      const promo = await db.getPromotionByCode(input.code);
      if (!promo) {
        return { valid: false, message: "Promotion code not found" };
      }

      if (!promo.isActive) {
        return { valid: false, message: "This promotion code is inactive" };
      }

      // Check max uses limit
      if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
        return { valid: false, message: "This promotion code has reached its maximum usage limit" };
      }

      const now = new Date();
      // Verify startsAt range
      if (promo.startsAt && new Date(promo.startsAt) > now) {
        return { valid: false, message: "This promotion campaign has not started yet" };
      }

      // Verify expiresAt range
      if (promo.expiresAt && new Date(promo.expiresAt) < now) {
        return { valid: false, message: "This promotion code has expired" };
      }

      return {
        valid: true,
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        scope: promo.scope,
      };
    }),

  list: marketingProcedure.query(async () => {
    return db.listPromotions();
  }),

  publicList: publicProcedure.query(async () => {
    const list = await db.listPromotions();
    const now = new Date();
    return list.filter(p => 
      p.isActive && 
      (!p.startsAt || new Date(p.startsAt) <= now) && 
      (!p.expiresAt || new Date(p.expiresAt) >= now) &&
      (p.maxUses === null || p.usedCount < p.maxUses)
    );
  }),

  create: marketingProcedure
    .input(z.object({
      code: z.string().trim().toUpperCase().min(1, "Code is required"),
      title: z.string().trim().min(1, "Title is required"),
      description: z.string().trim().min(1, "Description is required"),
      discountType: z.enum(["percentage", "fixed"]),
      discountValue: z.number().int().positive("Value must be positive"),
      scope: z.string().default("all"),
      maxUses: z.number().int().positive().nullable().optional(),
      startsAt: z.date().nullable().optional(),
      expiresAt: z.date().nullable().optional(),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      return db.createPromotion({
        ...input,
        maxUses: input.maxUses ?? null,
        startsAt: input.startsAt ?? null,
        expiresAt: input.expiresAt ?? null,
      });
    }),

  delete: marketingProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      return db.deletePromotion(input.id);
    }),
});
