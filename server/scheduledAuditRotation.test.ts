import { afterEach, describe, expect, it, vi } from "vitest";
import * as audit from "./audit";
import { sdk } from "./_core/sdk";
import { handleScheduledAuditRotation } from "./scheduledAuditRotation";

function response() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { status, json };
}

afterEach(() => vi.restoreAllMocks());

describe("scheduled Audit rotation", () => {
  it("rejects requests that are not platform Heartbeat callers", async () => {
    vi.spyOn(sdk, "authenticateRequest").mockResolvedValue({ id: 1, isCron: false } as never);
    const res = response();
    await handleScheduledAuditRotation({ originalUrl: "/api/scheduled/audit-log-rotation" } as never, res as never);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "cron-only" });
  });

  it("runs the idempotent twelve-month archive for an authenticated Heartbeat task", async () => {
    vi.spyOn(sdk, "authenticateRequest").mockResolvedValue({ id: -1, role: "user", isCron: true, taskUid: "cron_audit_rotation" } as never);
    const archive = vi.spyOn(audit, "archiveExpiredAuditLogs").mockResolvedValue({ archived: 3, cutoff: new Date("2025-08-23T00:00:00.000Z") });
    const write = vi.spyOn(audit, "writeAuditEvent").mockResolvedValue(1);
    const res = response();
    await handleScheduledAuditRotation({ originalUrl: "/api/scheduled/audit-log-rotation", headers: {}, socket: {} } as never, res as never);
    expect(archive).toHaveBeenCalledWith(-1);
    expect(write).toHaveBeenCalledWith(expect.objectContaining({ action: "audit.archive", targetRole: "founder" }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, archived: 3 }));
  });

  it("returns a JSON 500 response that supports platform investigation on failures", async () => {
    vi.spyOn(sdk, "authenticateRequest").mockRejectedValue(new Error("rotation unavailable"));
    const res = response();
    await handleScheduledAuditRotation({ originalUrl: "/api/scheduled/audit-log-rotation" } as never, res as never);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "rotation unavailable", context: { url: "/api/scheduled/audit-log-rotation" } }));
  });
});
