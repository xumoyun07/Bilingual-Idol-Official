import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as audit from "../audit";
import * as db from "../db";
import { getDb, inMemoryStore } from "../db";
import { promotions } from "../../drizzle/schema";
import { marketingProcedure, publicProcedure, router } from "../_core/trpc";

/**
 * Промо-акции (MK3): CRUD — зона marketing (contentManagerProcedure),
 * публичное чтение — только активные, не истёкшие, не исчерпанные промо.
 * promoCode уникален; placesUsed/usedCount нельзя изменить через CRUD —
 * только системно при реальном применении кода (incrementPromotionUsedCount).
 */

const promotionInput = z.object({
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
});

function activePromos(list: Array<Record<string, any>>) {
  const now = new Date();
  return list.filter(p =>
    Boolean(p.isActive) &&
    (!p.startsAt || new Date(p.startsAt) <= now) &&
    (!p.expiresAt || new Date(p.expiresAt) >= now) &&
    (p.maxUses === null || p.maxUses === undefined || p.usedCount < p.maxUses),
  );
}

async function writeAudit(ctx: { user: { id: number; role: string }; req: unknown }, action: "promotion.create" | "promotion.update" | "promotion.delete", description: string, metadata: Record<string, unknown>) {
  try {
    await audit.writeAuditEvent({
      actor: { id: ctx.user.id, role: ctx.user.role as never },
      request: ctx.req as never,
      action,
      targetType: "user",
      targetId: String(ctx.user.id),
      targetRole: ctx.user.role as never,
      description,
      metadata,
    });
  } catch {
    audit.reportAuditFailure("promotions");
  }
}

async function assertCodeFree(code: string, exceptId?: number) {
  const existing = await db.getPromotionByCode(code);
  if (existing && (exceptId === undefined || Number(existing.id) !== exceptId)) {
    throw new TRPCError({ code: "CONFLICT", message: "A promotion with this code already exists." });
  }
}

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

      if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
        return { valid: false, message: "This promotion code has reached its maximum usage limit" };
      }

      const now = new Date();
      if (promo.startsAt && new Date(promo.startsAt) > now) {
        return { valid: false, message: "This promotion campaign has not started yet" };
      }

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

  /** Полный список, включая истёкшие и неактивные (история для marketing). */
  list: marketingProcedure.query(async () => {
    return db.listPromotions();
  }),

  /** Публичный список: только активные, не истёкшие, не исчерпанные. */
  publicList: publicProcedure.query(async () => {
    const list = await db.listPromotions();
    return activePromos(list as Array<Record<string, any>>);
  }),

  /** Каноническое имя из MK3 — то же самое публичное чтение. */
  publicActive: publicProcedure.query(async () => {
    const list = await db.listPromotions();
    return activePromos(list as Array<Record<string, any>>);
  }),

  create: marketingProcedure
    .input(promotionInput)
    .mutation(async ({ ctx, input }) => {
      await assertCodeFree(input.code);
      const created = await db.createPromotion({
        ...input,
        maxUses: input.maxUses ?? null,
        startsAt: input.startsAt ?? null,
        expiresAt: input.expiresAt ?? null,
      });
      await writeAudit(ctx as never, "promotion.create", "Created a promotion.", { code: input.code, discountType: input.discountType, discountValue: input.discountValue });
      // usedCount входит в ответ всегда (0 у новой записи); CRUD его не меняет.
      return { ...created, usedCount: Number((created as { usedCount?: number }).usedCount ?? 0) };
    }),

  /** Обновление; usedCount через CRUD изменить нельзя — только системно. */
  update: marketingProcedure
    .input(promotionInput.extend({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await assertCodeFree(input.code, input.id);
      const { id, ...fields } = input;
      const database = await getDb();
      if (!database) {
        const store = (inMemoryStore as unknown as { promotions?: Array<Record<string, any>> }).promotions ?? [];
        const target = store.find(p => Number(p.id) === id);
        if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Promotion not found." });
        Object.assign(target, { ...fields, maxUses: fields.maxUses ?? null, startsAt: fields.startsAt ?? null, expiresAt: fields.expiresAt ?? null, updatedAt: new Date() });
        (inMemoryStore as unknown as { promotions?: Array<Record<string, any>> }).promotions = store;
        await writeAudit(ctx as never, "promotion.update", "Updated a promotion.", { id, code: input.code });
        return target;
      }
      await database.update(promotions).set({
        ...fields,
        maxUses: fields.maxUses ?? null,
        startsAt: fields.startsAt ?? null,
        expiresAt: fields.expiresAt ?? null,
        updatedAt: new Date(),
      }).where(eq(promotions.id, id));
      const rows = await database.select().from(promotions).where(eq(promotions.id, id)).limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Promotion not found." });
      await writeAudit(ctx as never, "promotion.update", "Updated a promotion.", { id, code: input.code });
      return { ...rows[0], usedCount: Number((rows[0] as { usedCount?: number }).usedCount ?? 0) };
    }),

  delete: marketingProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.deletePromotion(input.id);
      await writeAudit(ctx as never, "promotion.delete", "Deleted a promotion.", { id: input.id });
      return result;
    }),
});
