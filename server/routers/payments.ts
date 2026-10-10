import { z } from "zod";
import * as db from "../db";
import { adminProcedure, publicProcedure, router, studentProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { isBillplzConfigured, getPaymentProvider } from "../paymentProvider";
import { ENV } from "../_core/env";
import * as audit from "../audit";

export const paymentsRouter = router({
  create: publicProcedure
    .input(z.object({
      userId: z.number().int().positive().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Authenticate user
      if (!ctx.user) {
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: "You must be signed in to make a payment." 
        });
      }

      const targetUserId = input.userId ?? ctx.user.id;

      // Students can only pay for their own enrollment
      if (ctx.user.role === "student" && targetUserId !== ctx.user.id) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "You are only authorized to make payments for your own account." 
        });
      }

      // 2. Check if payment gateway is configured / enabled
      const configured = isBillplzConfigured();
      const isDev = !configured && !ENV.isProduction;
      
      if (!configured && !isDev) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: ctx.user.language === "ms"
            ? "Pilihan bayaran dalam talian tidak aktif buat masa ini. Sila hubungi pentadbiran di info@bilc.my."
            : ctx.user.language === "ar"
            ? "خيار الدفع الإلكتروني غير متاح حالياً. يرجى التواصل مع الإدارة عبر info@bilc.my."
            : "The online payment gateway is currently disabled. Please contact our administrative office at info@bilc.my."
        });
      }

      // 3. Prevent repayment (повторная оплата невозможна)
      const paymentsList = await db.listPayments(targetUserId);
      const hasCompleted = paymentsList.some(p => p.status === "completed");
      if (hasCompleted) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: ctx.user.language === "ms"
            ? "Pembayaran tuition anda telah disahkan sepenuhnya. Tiada bayaran ulangan diperlukan."
            : ctx.user.language === "ar"
            ? "لقد تم تأكيد دفع الرسوم الدراسية الخاصة بك بالكامل. لا حاجة لإعادة الدفع."
            : "Your tuition payment is already completed and confirmed. Repayment is not possible."
        });
      }

      // 4. Fetch the active enrollment to determine the amount
      const enrollments = await db.getEnrollmentsByUserId(targetUserId);
      const activeEnrollment = enrollments.find(e => e.status === "active");
      if (!activeEnrollment) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: ctx.user.language === "ms"
            ? "Tiada rekod pendaftaran aktif ditemui untuk akaun anda."
            : ctx.user.language === "ar"
            ? "لم يتم العثور على أي ملف تسجيل نشط لحسابك."
            : "No active enrollment record was found for your account."
        });
      }

      // 5. Calculate amount on the server (agreedPrice + registrationFee + placementTestFee + visaFee)
      const calculatedAmount = activeEnrollment.agreedPrice +
                               activeEnrollment.registrationFee +
                               activeEnrollment.placementTestFee +
                               activeEnrollment.visaFee;

      if (calculatedAmount <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The calculated tuition fee amount is invalid or zero."
        });
      }

      // 6. Generate receipt number
      const receiptNumber = "BILC-" + Math.floor(100000 + Math.random() * 900000);

      // 7. Initialize transaction with payment provider
      const provider = getPaymentProvider();
      let providerBillId = "";
      let paymentUrl = "";

      try {
        const hostname = ctx.req?.headers?.host || "localhost:3000";
        const protocol = ctx.req?.secure ? "https" : "http";
        const callbackUrl = process.env.BILLPLZ_CALLBACK_URL || `${protocol}://${hostname}/api/payments/callback`;
        const redirectUrl = process.env.BILLPLZ_REDIRECT_URL || `${protocol}://${hostname}/api/payments/redirect`;

        const bill = await provider.createBill({
          name: ctx.user.name,
          email: ctx.user.email || "student@bilc.my",
          amount: calculatedAmount,
          description: `Bilingual Idol Tuition Fees - Enrollment #${activeEnrollment.id}`,
          callbackUrl,
          redirectUrl,
        });

        providerBillId = bill.id;
        paymentUrl = bill.url;
      } catch (err: any) {
        console.error("[Payment] Billplz bill creation failed:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to initialize bill with payment provider: ${err.message}`
        });
      }

      // 8. Create payment transaction record in database only on success!
      const payRecord = await db.createPayment({
        userId: targetUserId,
        amount: calculatedAmount,
        currency: "MYR",
        provider: configured ? "billplz" : "dev_stub",
        paymentMethod: "fpx_bank_transfer",
        metadataJson: JSON.stringify({ activeEnrollmentId: activeEnrollment.id, providerBillId }),
        receiptNumber,
        transactionReference: providerBillId,
      });

      return {
        id: payRecord.id,
        amount: calculatedAmount,
        receiptNumber,
        url: paymentUrl,
      };
    }),

  list: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return [];
    if (ctx.user.role === "student" || ctx.user.role === "user") {
      return db.listPayments(ctx.user.id);
    }
    return db.listPayments();
  }),

  /**
   * Свои платежи. Параметров нет — только ctx.user.id, поэтому чужое не читается.
   * Отдаются только безопасные поля: без metadataJson, utm-меток и служебных заметок.
   */
  mine: studentProcedure.query(async ({ ctx }) => {
    const rows = await db.listPayments(ctx.user.id);
    return rows.map(row => {
      const extra = row as { priceId?: number | null; amountMinor?: number | null };
      return {
        id: row.id,
        priceId: extra.priceId ?? null,
        amount: row.amount,
        amountMinor: extra.amountMinor ?? null,
        currency: row.currency,
        status: row.status,
        receiptNumber: row.receiptNumber,
        createdAt: row.createdAt,
      };
    });
  }),
  // Returns the connection state of the payment gateway (without exposing keys)
  getGatewayStatus: publicProcedure.query(async () => {
    const isConfigured = isBillplzConfigured();
    const isDevStub = !isConfigured && !ENV.isProduction;
    return {
      isConfigured,
      isDevStub,
      isEnabled: isConfigured || isDevStub,
      provider: isConfigured ? "billplz" : (isDevStub ? "dev_stub" : "none"),
    };
  }),

  updateStatus: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["pending", "completed", "failed", "refunded"]),
      transactionReference: z.string().optional(),
      paymentMethod: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Fetch payment record
      const list = await db.listPayments();
      const currentPay = list.find(p => p.id === input.id);
      if (!currentPay) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Payment record not found." });
      }

      // 1. Prepare metadata note
      const metadata = currentPay.metadataJson ? JSON.parse(currentPay.metadataJson) : {};
      if (input.notes) {
        metadata.adminNote = input.notes;
        metadata.markedByUserId = ctx.user.id;
      }
      const metadataJson = JSON.stringify(metadata);

      // 2. Perform DB update
      await db.updatePaymentStatus(input.id, input.status, input.transactionReference, input.paymentMethod);
      
      const database = await db.getDb();
      if (database) {
        const { payments } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await database.update(payments).set({ metadataJson }).where(eq(payments.id, input.id));
      } else {
        const localPay = db.inMemoryStore.payments.find(p => p.id === input.id);
        if (localPay) {
          localPay.metadataJson = metadataJson;
        }
      }

      // 3. If marked as completed, transition corresponding application to paymentCompleted
      if (input.status === "completed" && currentPay.userId) {
        const apps = await db.listApplications(currentPay.userId);
        const activeApp = apps.find(a => a.status === "submitted" || a.status === "offerIssued" || a.status === "underReview");
        if (activeApp) {
          await db.updateApplicationStatus(activeApp.id, "paymentCompleted");
        }
      }

      // 4. Log audit trail
      await audit.writeAuditEvent({
        actor: { id: ctx.user.id, role: ctx.user.role },
        action: "user.update",
        targetType: "user",
        targetId: currentPay.userId,
        description: `Admin manually marked payment #${input.id} as ${input.status}. Admin note: ${input.notes || "none"}`,
        metadata: { paymentId: input.id, notes: input.notes, status: input.status },
      });

      return { success: true };
    }),
});
