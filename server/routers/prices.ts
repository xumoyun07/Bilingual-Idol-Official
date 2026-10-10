/**
 * Процедуры согласованных цен.
 *
 * Доступ:
 *   set / change / cancel / complete / historyByStudent — только founder, super_admin, admin
 *     (adminProcedure допускает ровно эти три роли);
 *   mine — только student, всегда по своему ctx.user.id: параметра studentId нет,
 *     поэтому прочитать чужое через этот путь невозможно.
 *
 * Каждое изменение пишет запись аудита: актор, студент, программа, старая и новая
 * суммы. Никаких секретов и никаких внутренних заметок в описании.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as audit from "../audit";
import { adminProcedure, router, studentProcedure } from "../_core/trpc";
import * as store from "../services/studentPrices";
import { NO_PRICE_STATE, PriceError, PriceStatus, toStudentVisiblePrice } from "../services/studentPrices";

const amountMinor = z.number().int().positive().max(1_000_000_000);
const reason = z.string().trim().min(3).max(255);
const staffNote = z.string().trim().max(2000).optional().nullable();

function priceError(error: unknown): never {
  if (error instanceof PriceError) {
    throw new TRPCError({ code: error.code, message: error.message });
  }
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: error instanceof Error ? error.message : "The price action could not be completed.",
  });
}

type AuditContext = { user: { id: number; role: string }; req: unknown };

async function record(
  ctx: AuditContext,
  event: {
    action: "price.set" | "price.change" | "price.cancel" | "price.complete";
    studentId: number;
    programId: number | null;
    description: string;
    metadata: Record<string, unknown>;
  },
) {
  try {
    await audit.writeAuditEvent({
      actor: { id: ctx.user.id, role: ctx.user.role as never },
      request: ctx.req as never,
      action: event.action,
      targetType: "user",
      targetId: event.studentId,
      targetRole: "student",
      description: event.description,
      metadata: event.metadata,
    });
  } catch {
    audit.reportAuditFailure("prices");
  }
}

const statusSchema = z.enum(["active", "paid", "completed", "cancelled", "superseded"]);

export const pricesRouter = router({
  set: adminProcedure
    .input(z.object({ studentId: z.number().int().positive(), programId: z.number().int().positive(), amountMinor, staffNote }))
    .mutation(async ({ ctx, input }) => {
      try {
        const created = await store.setPrice(input, ctx.user);
        await record(ctx as AuditContext, {
          action: "price.set",
          studentId: input.studentId,
          programId: input.programId,
          description: "Agreed an individual price for a student.",
          metadata: { programId: input.programId, newAmountMinor: created.amountMinor, status: created.status },
        });
        return created;
      } catch (error) {
        return priceError(error);
      }
    }),

  change: adminProcedure
    .input(z.object({ studentId: z.number().int().positive(), programId: z.number().int().positive(), amountMinor, reason, staffNote }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await store.changePrice(input, ctx.user);
        await record(ctx as AuditContext, {
          action: "price.change",
          studentId: input.studentId,
          programId: input.programId,
          description: "Replaced an agreed price with a new one; the previous price was superseded.",
          metadata: {
            programId: input.programId,
            oldPriceId: result.superseded.id,
            newPriceId: result.created.id,
            oldAmountMinor: result.superseded.amountMinor,
            newAmountMinor: result.created.amountMinor,
            reason: input.reason,
          },
        });
        return result;
      } catch (error) {
        return priceError(error);
      }
    }),

  cancel: adminProcedure
    .input(z.object({ priceId: z.number().int().positive(), reason }))
    .mutation(async ({ ctx, input }) => {
      try {
        const updated = await store.cancelPrice(input, ctx.user);
        await record(ctx as AuditContext, {
          action: "price.cancel",
          studentId: updated.studentId,
          programId: updated.programId,
          description: "Cancelled an agreed price.",
          metadata: { priceId: updated.id, amountMinor: updated.amountMinor, reason: input.reason },
        });
        return updated;
      } catch (error) {
        return priceError(error);
      }
    }),

  complete: adminProcedure
    .input(z.object({ priceId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const updated = await store.completePrice(input, ctx.user);
        await record(ctx as AuditContext, {
          action: "price.complete",
          studentId: updated.studentId,
          programId: updated.programId,
          description: "Marked an agreed price as completed; the student can be given a new price for the next course.",
          metadata: { priceId: updated.id, amountMinor: updated.amountMinor, status: updated.status },
        });
        return updated;
      } catch (error) {
        return priceError(error);
      }
    }),

  /** Вся история цен студента вместе с платежами. Только для персонала: staffNote здесь есть. */
  historyByStudent: adminProcedure
    .input(z.object({ studentId: z.number().int().positive() }))
    .query(async ({ input }) => store.historyWithPayments(input.studentId)),

  /**
   * Свои цены. Параметров нет — только ctx.user.id, поэтому чужое не читается.
   * Если цены нет, возвращается явное состояние not_set: ни цены по умолчанию,
   * ни прайс-листа.
   */
  mine: studentProcedure.query(async ({ ctx }) => {
    const rows = await store.listPricesByStudent(ctx.user.id);
    if (rows.length === 0) {
      return { state: NO_PRICE_STATE as typeof NO_PRICE_STATE, prices: [] as ReturnType<typeof toStudentVisiblePrice>[] };
    }
    return { state: "set" as const, prices: rows.map(toStudentVisiblePrice) };
  }),

  /** Служебная схема статусов для клиента. */
  statuses: adminProcedure.query(() => statusSchema.options as readonly PriceStatus[]),
});
