import { z } from "zod";
import * as db from "../db";
import { adminProcedure, publicProcedure, router, studentProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { isBillplzConfigured, getPaymentProvider } from "../paymentProvider";
import * as priceStore from "../services/studentPrices";
import { ENV } from "../_core/env";
import * as audit from "../audit";

type PaymentLanguage = "en" | "ms" | "ar";

/** Реальный источник языка: cookie bilc_language, затем Accept-Language. */
function requestLanguage(req: { headers?: Record<string, unknown> } | undefined): PaymentLanguage {
  const cookie = String(req?.headers?.cookie ?? "");
  const cookieMatch = cookie.match(/bilc_language=(en|ms|ar)/);
  if (cookieMatch) return cookieMatch[1] as PaymentLanguage;
  const accept = String(req?.headers?.["accept-language"] ?? "").toLowerCase();
  if (accept.startsWith("ms")) return "ms";
  if (accept.startsWith("ar")) return "ar";
  return "en";
}

const PAYMENT_MESSAGES: Record<PaymentLanguage, Record<string, string>> = {
  en: {
    notActive: "This price is not active and cannot be paid.",
    alreadyPaid: "This price has already been paid in full.",
    pending: "A payment for this price is already in progress.",
    noEmail: "Your account has no email address. Please ask the centre staff to add one before paying.",
    gatewayOff: "The online payment gateway is currently disabled. Please contact our administrative office at info@bilc.my.",
    providerFailed: "Failed to initialize the payment with the provider. Please try again later.",
  },
  ms: {
    notActive: "Harga ini tidak aktif dan tidak boleh dibayar.",
    alreadyPaid: "Harga ini sudah dibayar sepenuhnya.",
    pending: "Pembayaran untuk harga ini sedang diproses.",
    noEmail: "Akaun anda tiada alamat e-mel. Sila minta staf pusat menambahnya sebelum membayar.",
    gatewayOff: "Pilihan bayaran dalam talian tidak aktif buat masa ini. Sila hubungi pentadbiran di info@bilc.my.",
    providerFailed: "Gagal memulakan pembayaran dengan penyedia. Sila cuba sebentar lagi.",
  },
  ar: {
    notActive: "هذا السعر غير نشط ولا يمكن دفعه.",
    alreadyPaid: "تم دفع هذا السعر بالكامل مسبقاً.",
    pending: "هناك عملية دفع لهذا السعر قيد المعالجة.",
    noEmail: "لا يوجد بريد إلكتروني في حسابك. يرجى مطالبة موظفي المركز بإضافته قبل الدفع.",
    gatewayOff: "خيار الدفع الإلكتروني غير متاح حالياً. يرجى التواصل مع الإدارة عبر info@bilc.my.",
    providerFailed: "تعذّر بدء عملية الدفع لدى المزوّد. يرجى المحاولة لاحقاً.",
  },
};
export const paymentsRouter = router({
  create: studentProcedure
    .input(z.object({
      priceId: z.number().int().positive(),
      idempotencyKey: z.string().trim().min(8).max(128),
    }))
    .mutation(async ({ ctx, input }) => {
      const message = PAYMENT_MESSAGES[requestLanguage(ctx.req)];

      // 1. Загружаем цену. Изоляция: чужая цена неотличима от несуществующей.
      const price = await priceStore.getPriceById(input.priceId);
      if (!price || price.studentId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Price not found." });
      }
      if (price.status !== "active") {
        throw new TRPCError({ code: "CONFLICT", message: message.notActive });
      }

      // 2. Идемпотентность: тот же ключ — тот же платёж, новой оплаты не создаём.
      const ownPayments = (await priceStore.listPaymentsByStudent(ctx.user.id)) as Array<Record<string, any>>;
      const sameKey = ownPayments.find(payment => payment.idempotencyKey === input.idempotencyKey);
      if (sameKey) {
        return {
          id: Number(sameKey.id),
          amountMinor: Number(sameKey.amountMinor ?? sameKey.amount),
          currency: String(sameKey.currency),
          receiptNumber: sameKey.receiptNumber ?? null,
          url: null as string | null,
          idempotent: true,
        };
      }

      // 3. Повторная оплата по той же цене запрещена (завершённая или ожидающая).
      const forPrice = ownPayments.filter(payment => Number(payment.priceId) === price.id);
      if (forPrice.some(payment => String(payment.status) === "completed")) {
        throw new TRPCError({ code: "CONFLICT", message: message.alreadyPaid });
      }
      if (forPrice.some(payment => String(payment.status) === "pending")) {
        throw new TRPCError({ code: "CONFLICT", message: message.pending });
      }

      // 4. Адрес обязателен: заглушки student@bilc.my больше нет.
      const email = (ctx.user.email ?? "").trim();
      if (!email.includes("@")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: message.noEmail });
      }

      const configured = isBillplzConfigured();
      const isDev = !configured && !ENV.isProduction;
      if (!configured && !isDev) {
        throw new TRPCError({ code: "BAD_REQUEST", message: message.gatewayOff });
      }

      // 5. Сумма берётся ТОЛЬКО из цены на сервере; клиентская сумма игнорируется.
      const amountMinor = price.amountMinor;
      const currency = price.currency;
      const receiptNumber = "BILC-" + Date.now().toString(36).toUpperCase();

      const provider = getPaymentProvider();
      let providerBillId = "";
      let paymentUrl = "";
      try {
        const hostname = (ctx.req?.headers?.host as string | undefined) || "localhost:3000";
        const protocol = ctx.req?.secure ? "https" : "http";
        const callbackUrl = process.env.BILLPLZ_CALLBACK_URL || `${protocol}://${hostname}/api/payments/callback`;
        const redirectUrl = process.env.BILLPLZ_REDIRECT_URL || `${protocol}://${hostname}/api/payments/redirect`;
        const bill = await provider.createBill({
          name: ctx.user.name ?? "",
          email,
          amount: amountMinor,
          description: `Bilingual Idol Tuition Fees - Price #${price.id}`,
          callbackUrl,
          redirectUrl,
        });
        providerBillId = bill.id;
        paymentUrl = bill.url;
      } catch (error) {
        console.error("[Payment] Bill creation failed:", error instanceof Error ? error.message : "unknown");
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: message.providerFailed });
      }

      const record = await db.createPayment({
        userId: ctx.user.id,
        amount: amountMinor,
        amountMinor,
        currency,
        priceId: price.id,
        idempotencyKey: input.idempotencyKey,
        provider: configured ? "billplz" : "dev_stub",
        paymentMethod: "fpx_bank_transfer",
        metadataJson: JSON.stringify({ priceId: price.id }),
        receiptNumber,
        transactionReference: providerBillId,
      } as never);

      try {
        await audit.writeAuditEvent({
          actor: { id: ctx.user.id, role: ctx.user.role as never },
          request: ctx.req as never,
          action: "payment.create",
          targetType: "user",
          targetId: String(ctx.user.id),
          targetRole: "student",
          description: "Student started a checkout for an agreed price.",
          metadata: { priceId: price.id, amountMinor, currency, provider: configured ? "billplz" : "dev_stub" },
        });
      } catch {
        audit.reportAuditFailure("payments.create");
      }

      return { id: record.id, amountMinor, currency, receiptNumber, url: paymentUrl as string | null, idempotent: false };
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
