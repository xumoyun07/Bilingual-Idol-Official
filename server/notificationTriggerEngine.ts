import { EventEmitter } from "node:events";
import { 
  getMessageTemplateByName, 
  createNotificationLog, 
  listPromotions 
} from "./db";

// Singleton event bus for decoupling business logic from notifications
export class NotificationEventBus extends EventEmitter {}
export const notificationEventBus = new NotificationEventBus();

/**
 * Replaces double-curly-brace placeholders (e.g. {{variable}}) with values from the context object.
 */
export function resolveTemplate(template: string, context: Record<string, any>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    return key in context ? String(context[key]) : match;
  });
}

/**
 * Core processor for compile and dispatch
 */
async function processNotificationTrigger(
  eventName: string,
  recipient: string,
  context: Record<string, any>
) {
  try {
    const template = await getMessageTemplateByName(eventName);
    if (!template) {
      console.warn(`[TriggerEngine] Message template for event "${eventName}" not found.`);
      await createNotificationLog({
        triggerEvent: eventName,
        recipient,
        templateId: null,
        resolvedContent: `Error: Template not found for event "${eventName}". Context: ${JSON.stringify(context)}`,
        status: "failed",
        errorMessage: "Template not found"
      });
      return;
    }

    const resolvedBody = resolveTemplate(template.body, context);
    const resolvedSubject = template.subject ? resolveTemplate(template.subject, context) : undefined;
    const resolvedContent = resolvedSubject ? `Subject: ${resolvedSubject}\n\n${resolvedBody}` : resolvedBody;

    // Send the notification (Simulator logging as per Master Spec guidelines)
    console.log(`\n================================================================`);
    console.log(`[TRIGGER: ${eventName.toUpperCase()}] Dispatching via ${template.channel.toUpperCase()}`);
    console.log(`Recipient: ${recipient}`);
    if (resolvedSubject) console.log(`Subject: ${resolvedSubject}`);
    console.log(`----------------------------------------------------------------`);
    console.log(resolvedBody);
    console.log(`================================================================\n`);

    // Log the event execution with status 'sent'
    await createNotificationLog({
      triggerEvent: eventName,
      recipient,
      templateId: template.id,
      resolvedContent,
      status: "sent",
      errorMessage: null
    });

  } catch (error: any) {
    console.error(`[TriggerEngine] Error processing notification trigger "${eventName}":`, error);
    try {
      await createNotificationLog({
        triggerEvent: eventName,
        recipient,
        templateId: null,
        resolvedContent: `Error during processing. Context: ${JSON.stringify(context)}`,
        status: "failed",
        errorMessage: error?.message || "Unknown error"
      });
    } catch (innerError) {
      console.error("[TriggerEngine] Double fault writing notification log:", innerError);
    }
  }
}

// ==========================================
// REGISTER SYSTEM EVENT LISTENERS
// ==========================================

// 1. Enquiry Received Trigger
notificationEventBus.on("enquiry received", async (payload: {
  studentName: string;
  email: string;
  courseInterest: string;
}) => {
  await processNotificationTrigger("enquiry received", payload.email, {
    studentName: payload.studentName,
    courseInterest: payload.courseInterest,
  });
});

// 2. Booking / Registration Confirmed Trigger
notificationEventBus.on("booking/registration confirmed", async (payload: {
  studentName: string;
  email: string;
  programName: string;
  registrationId: number | string;
}) => {
  await processNotificationTrigger("booking/registration confirmed", payload.email, {
    studentName: payload.studentName,
    programName: payload.programName,
    registrationId: payload.registrationId,
  });
});

// 3. Payment Received Trigger
notificationEventBus.on("payment received", async (payload: {
  email: string;
  amount: string;
  transactionId: string;
  paymentMethod: string;
  invoiceUrl: string;
}) => {
  await processNotificationTrigger("payment received", payload.email, {
    amount: payload.amount,
    transactionId: payload.transactionId,
    paymentMethod: payload.paymentMethod,
    invoiceUrl: payload.invoiceUrl,
  });
});


/**
 * Cron Job Trigger: Checks for expiring promotions and triggers notifications
 * Suitable for cloud-scheduling pulls to avoid background process freezing
 */
export async function triggerExpiringPromotionsJob(): Promise<{ checked: number; triggered: number }> {
  console.log("[TriggerEngine] Running periodic check-expiring-promotions job...");
  const promos = await listPromotions();
  const now = new Date();
  let triggered = 0;

  for (const promo of promos) {
    if (!promo.isActive) continue;
    const endDate = new Date(promo.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // If expiration is imminent (between 1 and 7 days left)
    if (diffDays > 0 && diffDays <= 7) {
      // Simulate broadcasting to target segments or an admin summary recipient
      const adminRecipient = "marketing-alerts@bilc.my";
      const resolvedTargetDate = endDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

      await processNotificationTrigger("promo expiring", adminRecipient, {
        promoCode: promo.code,
        discountValue: promo.discountType === "percentage" ? `${promo.discountValue}%` : `$${promo.discountValue}`,
        endDate: resolvedTargetDate,
        daysRemaining: diffDays,
      });

      triggered++;
    }
  }

  console.log(`[TriggerEngine] Expiring promotions check finished. Processed: ${promos.length}, Triggered Notifications: ${triggered}`);
  return { checked: promos.length, triggered };
}
