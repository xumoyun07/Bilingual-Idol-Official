import { z } from "zod";
import * as db from "../db";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import * as audit from "../audit";

export const paymentsRouter = router({
  create: publicProcedure
    .input(z.object({
      userId: z.number().int().positive().optional().nullable(),
      amount: z.number().int().positive("Amount must be positive"), // in cents/cents-equivalent (MYR)
      currency: z.string().default("MYR"),
      provider: z.string().default("toyyibpay"),
      paymentMethod: z.string().optional(),
      metadataJson: z.string().optional(),
      utmSource: z.string().optional(),
      utmMedium: z.string().optional(),
      utmCampaign: z.string().optional(),
      utmTerm: z.string().optional(),
      utmContent: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const receiptNumber = "BILC-" + Math.floor(100000 + Math.random() * 900000);
      return db.createPayment({
        userId: input.userId ?? null,
        amount: input.amount,
        currency: input.currency,
        provider: input.provider,
        paymentMethod: input.paymentMethod ?? null,
        metadataJson: input.metadataJson ?? null,
        receiptNumber,
        transactionReference: "TXN-" + Math.floor(100000000 + Math.random() * 900000000),
        utmSource: input.utmSource ?? null,
        utmMedium: input.utmMedium ?? null,
        utmCampaign: input.utmCampaign ?? null,
        utmTerm: input.utmTerm ?? null,
        utmContent: input.utmContent ?? null,
      });
    }),

  list: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return [];
    if (ctx.user.role === "student" || ctx.user.role === "user") {
      return db.listPayments(ctx.user.id);
    }
    return db.listPayments();
  }),

  updateStatus: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["pending", "completed", "failed", "refunded"]),
      transactionReference: z.string().optional(),
      paymentMethod: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return db.updatePaymentStatus(input.id, input.status, input.transactionReference, input.paymentMethod);
    }),

  simulateToyyibpayWebhook: publicProcedure
    .input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["completed", "failed"]),
      paymentMethod: z.string().default("fpx_bank_transfer"),
    }))
    .mutation(async ({ input }) => {
      const transactionReference = "TOYYIB-" + Math.floor(100000000 + Math.random() * 900000000);
      await db.updatePaymentStatus(input.id, input.status, transactionReference, input.paymentMethod);
      
      // If payment completed and associated with a user, also create/update their student profile/application status!
      if (input.status === "completed") {
        const paymentsList = await db.listPayments();
        const foundPayment = paymentsList.find(p => p.id === input.id);
        if (foundPayment && foundPayment.userId) {
          // If there is an active application under review or offerIssued, transition it!
          const apps = await db.listApplications(foundPayment.userId);
          const activeApp = apps.find(a => a.status === "submitted" || a.status === "offerIssued" || a.status === "underReview");
          if (activeApp) {
            await db.updateApplicationStatus(activeApp.id, "paymentCompleted");
            
            // Log this status change audit event!
            try {
              await audit.writeAuditEvent({
                actor: { id: foundPayment.userId, role: "student" },
                action: "user.update" as any,
                targetType: "application" as any,
                targetId: activeApp.id,
                description: `Payment simulation auto-transitioned application status from "${activeApp.status}" to "paymentCompleted" via webhook.`,
                metadata: {
                  fromStatus: activeApp.status,
                  toStatus: "paymentCompleted",
                  paymentId: foundPayment.id,
                  transactionReference,
                },
              });
            } catch (err) {
              console.error("Failed to write audit event for webhook transition:", err);
            }
          }
        }
      }
      return { success: true, transactionReference };
    }),
});
