import { settlePaymentAndPrice } from "./services/studentPrices";
import { Request, Response } from "express";
import * as db from "./db";
import { getPaymentProvider, isBillplzConfigured, normalizePayload } from "./paymentProvider";
import { EmailProvider } from "./email";
import { notifyOwner } from "./_core/notification";
import { payments, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env";

export async function handleBillplzCallback(req: Request, res: Response) {
  console.log("[Payment Webhook] Received callback from Billplz:", JSON.stringify(req.body));

  try {
    const flatPayload = normalizePayload(req.body);
    
    const signatureKey = process.env.BILLPLZ_SIGNATURE_KEY;
    if (!signatureKey) {
      console.error("[Payment Webhook] Refusing webhook: BILLPLZ_SIGNATURE_KEY is not configured.");
      return res.status(400).send("Signature key not configured on server.");
    }

    const receivedSig = flatPayload.x_signature || flatPayload["billplz[x_signature]"] || req.body.x_signature;
    if (!receivedSig) {
      console.error("[Payment Webhook] Refusing webhook: missing x_signature.");
      return res.status(400).send("Missing x_signature.");
    }

    const provider = getPaymentProvider();
    const isValidSig = provider.verifyCallback(req.body);
    if (!isValidSig) {
      console.error("[Payment Webhook] Refusing webhook: invalid signature.");
      return res.status(400).send("Invalid signature.");
    }

    const billplzId = flatPayload["billplz[id]"] || req.body.id || req.body.bill_id;
    const isPaidStr = flatPayload["billplz[paid]"] || req.body.paid;
    const amountStr = flatPayload["billplz[amount]"] || req.body.amount;

    if (!billplzId) {
      console.error("[Payment Webhook] Refusing webhook: missing billplz ID in callback.");
      return res.status(400).send("Missing billplz ID.");
    }

    // Значение приходит из query/body как строка (или массив строк) — приводим тип,
    // вместо сравнения с boolean, которое не имеет пересечения типов.
    const isPaidRaw = Array.isArray(isPaidStr) ? isPaidStr[0] : isPaidStr;
    const isPaidValue = String(isPaidRaw ?? "");
    const isPaid = isPaidValue === "true" || isPaidValue === "1";
    const amountCents = Math.round(Number(amountStr));

    const database = await db.getDb();
    let payRecord: any;
    if (database) {
      const results = await database.select().from(payments).where(eq(payments.transactionReference, billplzId)).limit(1);
      payRecord = results[0];
    } else {
      payRecord = db.inMemoryStore.payments.find(p => p.transactionReference === billplzId);
    }

    if (!payRecord) {
      console.error(`[Payment Webhook] Rejected webhook: no payment record found for billplzId: ${billplzId}`);
      return res.status(400).send("Unknown invoice/bill ID.");
    }

    if (payRecord.status !== "pending") {
      console.log(`[Payment Webhook] Idempotent callback safe: payment record ${payRecord.id} is already ${payRecord.status}.`);
      return res.status(200).send("OK (Idempotent)");
    }

    if (amountCents !== Number(payRecord.amountMinor ?? payRecord.amount)) {
      console.error(`[Payment Webhook] Rejected webhook: amount mismatch. Expected ${payRecord.amountMinor ?? payRecord.amount} minor units, received ${amountCents}.`);
      return res.status(400).send("Amount mismatch.");
    }

    const finalStatus = isPaid ? "completed" : "failed";
    // Платёж и связанная цена переводятся в новое состояние ОДНОЙ транзакцией.
    const settlement = await settlePaymentAndPrice(payRecord.id, finalStatus, billplzId, "fpx_bank_transfer");
    if (!settlement.changed) {
      console.log("[Payment Webhook] Idempotent callback safe: payment " + payRecord.id + " (" + settlement.reason + ").");
      return res.status(200).send("OK (Idempotent)");
    }

    console.log(`[Payment Webhook] Payment ${payRecord.id} updated to status ${finalStatus}.`);

    if (finalStatus === "completed") {
      const apps = await db.listApplications(payRecord.userId);
      const activeApp = apps.find(a => a.status === "submitted" || a.status === "offerIssued" || a.status === "underReview");
      if (activeApp) {
        await db.updateApplicationStatus(activeApp.id, "paymentCompleted");
        console.log(`[Payment Webhook] Active application ${activeApp.id} for user ${payRecord.userId} transitioned to paymentCompleted.`);
      }

      const user = database 
        ? (await database.select().from(users).where(eq(users.id, payRecord.userId)).limit(1))[0]
        : db.inMemoryStore.users.find(u => u.id === payRecord.userId);

      if (user && user.email) {
        try {
          await EmailProvider.sendEmail({
            to: user.email,
            subject: "Tuition Fee Payment Confirmed - Bilingual Idol Language Centre",
            body: `Hello ${user.name},\n\n` +
                  `We are pleased to inform you that your tuition fee payment of RM ${(payRecord.amount / 100).toFixed(2)} has been successfully received.\n\n` +
                  `Your receipt number is ${payRecord.receiptNumber}.\n` +
                  `Your enrollment status has been fully activated in our academic system.\n\n` +
                  `Thank you for choosing Bilingual Idol Language Centre.\n\n` +
                  `Best Regards,\n` +
                  `Bilingual Idol Admissions Team`
          });
          console.log(`[Payment Webhook] Tuition payment notification email sent to ${user.email}.`);
        } catch (emailError) {
          console.error("[Payment Webhook] Failed to send payment confirmation email:", emailError);
        }
      }

      try {
        await notifyOwner({
          title: `Tuition Payment Confirmed: BILC-REC-${payRecord.id}`,
          content: `Student ${user?.name || "User #" + payRecord.userId} paid RM ${(payRecord.amount / 100).toFixed(2)} via Billplz.\nReceipt: ${payRecord.receiptNumber}\nTransaction ID: ${billplzId}`
        });
      } catch (notifyError) {
        console.warn("[Payment Webhook] Failed to send developer notification:", notifyError);
      }
    }

    return res.status(200).send("OK");
  } catch (err: any) {
    console.error("[Payment Webhook] Error processing callback:", err);
    return res.status(500).send("Internal server error.");
  }
}

export async function handleBillplzRedirect(req: Request, res: Response) {
  console.log("[Payment Redirect] Received redirect params:", JSON.stringify(req.query));

  const flatPayload = normalizePayload(req.query);
  const isPaidStr = flatPayload["billplz[paid]"] || req.query.paid;
  const isPaidRaw = Array.isArray(isPaidStr) ? isPaidStr[0] : isPaidStr;
  const isPaidValue = String(isPaidRaw ?? "");
  const isPaid = isPaidValue === "true" || isPaidValue === "1";

  const provider = getPaymentProvider();
  const isValidSig = provider.verifyCallback(req.query);

  if (!isValidSig) {
    console.warn("[Payment Redirect] Warning: Redirect query signature is invalid or empty.");
    if (ENV.isProduction) {
      return res.redirect("/dashboard?payment=signature_invalid");
    }
  }

  if (isPaid) {
    return res.redirect("/dashboard?payment=success");
  } else {
    return res.redirect("/dashboard?payment=failed");
  }
}
