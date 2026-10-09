import type { Request, Response } from "express";
import { archiveExpiredAuditLogs, writeAuditEvent } from "./audit";
import { sdk } from "./_core/sdk";

export const auditRotationSchedulePath = "/api/scheduled/audit-log-rotation";

/** Platform Heartbeat-only handler. Archive copy + delete is idempotent through originalLogId uniqueness. */
export async function handleScheduledAuditRotation(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const result = await archiveExpiredAuditLogs(user.id);
    try {
      await writeAuditEvent({
        actor: user,
        request: req,
        action: "audit.archive",
        targetType: "audit_log",
        targetRole: "founder",
        description: `Scheduled rotation archived ${result.archived} audit log record(s) older than 12 months.`,
        metadata: { archived: result.archived, cutoffUtc: result.cutoff.toISOString(), taskUid: user.taskUid },
      });
    } catch (writeError) { console.error("[audit] Could not persist scheduled rotation event", writeError); }
    return res.json({ ok: true, archived: result.archived, cutoffUtc: result.cutoff.toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown scheduled audit rotation failure";
    console.error("[audit] Scheduled rotation failed", error);
    return res.status(500).json({ error: message, context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
  }
}
