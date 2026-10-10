/**
 * G10: движок автоматических уведомлений поверх messageTemplates.
 *
 * Шаблоны: enquiry_received, payment_received, promo_expiring (channel=email).
 * Если шаблона нет — используется встроенный текст; письма никогда не блокируют
 * основной поток и не содержат секретов (email.ts пишет в лог только to/subject/template).
 */

import { eq } from "drizzle-orm";
import { messageTemplates } from "../../drizzle/schema";
import { getDb, inMemoryStore, listPromotions } from "../db";
import { EmailProvider } from "../email";
import { FOUNDER_EMAIL } from "../founderIdentity";

export const NOTIFICATION_TEMPLATE_KEYS = ["enquiry_received", "payment_received", "promo_expiring"] as const;

/** Подстановка {{variable}} в шаблон. Чистая функция. */
export function fillTemplate(body: string, variables: Record<string, string>): string {
  return body.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, function (_whole, key) {
    return Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : "";
  });
}

async function findTemplate(name: string) {
  const database = await getDb();
  if (!database) {
    const store = (inMemoryStore as unknown as { messageTemplates?: Array<Record<string, any>> }).messageTemplates ?? [];
    return store.find(t => t.name === name && t.channel === "email") ?? null;
  }
  const rows = await database.select().from(messageTemplates).where(eq(messageTemplates.name, name));
  return rows.find(t => t.channel === "email") ?? null;
}

export type NotificationOptions = {
  templateKey: string;
  to: string;
  variables: Record<string, string>;
  fallbackSubject: string;
  fallbackBody: string;
};

export async function notifyByTemplate(options: NotificationOptions): Promise<void> {
  const template = await findTemplate(options.templateKey);
  const subject = template && template.subject
    ? fillTemplate(template.subject, options.variables)
    : fillTemplate(options.fallbackSubject, options.variables);
  const body = template ? fillTemplate(template.body, options.variables) : fillTemplate(options.fallbackBody, options.variables);
  try {
    await EmailProvider.sendEmail({ to: options.to, subject, template: "notification_" + options.templateKey, body });
  } catch (error) {
    console.error("[notifications] failed for " + options.templateKey + ": " + (error instanceof Error ? error.message : "unknown"));
  }
}

/** Обращение через Форму 1: подтверждение заявителю (или центру, если email нет). */
export function notifyEnquiryReceived(input: { name: string; email?: string; phone?: string; reasonType: string; message?: string }): Promise<void> {
  const to = input.email && input.email.includes("@") ? input.email : FOUNDER_EMAIL;
  return notifyByTemplate({
    templateKey: "enquiry_received",
    to,
    variables: {
      name: input.name,
      email: input.email ?? "",
      phone: input.phone ?? "",
      reasonType: input.reasonType,
      message: input.message ?? "",
    },
    fallbackSubject: "We received your enquiry - Bilingual Idol Language Centre",
    fallbackBody: "Hello {{name}},\n\nThank you for contacting Bilingual Idol Language Centre. Our team will get back to you shortly.\n\nBest Regards,\nBilingual Idol Team",
  });
}

/** Подтверждение оплаты студенту. */
export function notifyPaymentReceived(options: { to: string; name: string; amountMinor: number; receiptNumber: string | null }): Promise<void> {
  const amount = (options.amountMinor / 100).toFixed(2);
  return notifyByTemplate({
    templateKey: "payment_received",
    to: options.to,
    variables: { name: options.name, amount, receiptNumber: options.receiptNumber ?? "" },
    fallbackSubject: "Tuition Fee Payment Confirmed - Bilingual Idol Language Centre",
    fallbackBody: "Hello {{name}},\n\nWe are pleased to inform you that your tuition fee payment of RM {{amount}} has been successfully received.\nYour receipt number is {{receiptNumber}}.\nYour enrollment status has been fully activated in our academic system.\n\nThank you for choosing Bilingual Idol Language Centre.\n\nBest Regards,\nBilingual Idol Admissions Team",
  });
}

/** Скан промо, истекающих в ближайшие N дней; возвращает их коды (не секреты). */
export async function scanExpiringPromotions(days = 7): Promise<string[]> {
  const now = new Date();
  const limit = new Date(now.getTime() + days * 24 * 3600 * 1000);
  const list = await listPromotions();
  const expiring = (list as Array<Record<string, any>>).filter(p =>
    Boolean(p.isActive) && p.expiresAt && new Date(p.expiresAt) > now && new Date(p.expiresAt) <= limit,
  );
  for (const promo of expiring) {
    await notifyByTemplate({
      templateKey: "promo_expiring",
      to: FOUNDER_EMAIL,
      variables: {
        code: String(promo.code),
        title: String(promo.title ?? promo.code),
        date: new Date(promo.expiresAt).toISOString().slice(0, 10),
      },
      fallbackSubject: "Promotion expiring soon: {{code}}",
      fallbackBody: "The promotion {{title}} ({{code}}) expires on {{date}}.",
    });
  }
  return expiring.map(p => String(p.code));
}
