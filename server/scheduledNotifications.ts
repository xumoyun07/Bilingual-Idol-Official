/**
 * G10: планировщик уведомлений — HTTP-эндпоинт по образцу scheduledAuditRotation,
 * вызывается внешним cron. Сканирует промо, истекающие в ближайшие 7 дней.
 */

import type { Request, Response } from "express";
import { scanExpiringPromotions } from "./services/notifications";

export const notificationsSchedulePath = "/api/scheduled/notifications";

export async function handleScheduledNotifications(_req: Request, res: Response) {
  try {
    const codes = await scanExpiringPromotions(7);
    res.json({ scanned: true, expiring: codes.length });
  } catch (error) {
    console.error("[scheduled notifications] scan failed:", error instanceof Error ? error.message : "unknown");
    res.status(500).json({ error: "notification scan failed" });
  }
}
