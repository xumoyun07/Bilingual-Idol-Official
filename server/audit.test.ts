import { afterEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import * as audit from "./audit";
import { appRouter } from "./routers";

function context(role: "founder" | "super_admin" | "admin" | "student" | null): TrpcContext {
  return {
    user: role ? {
      id: role === "founder" ? 1 : role === "super_admin" ? 2 : 3,
      openId: `${role}:test`, name: role, email: `${role}@example.test`, passwordHash: null, isActive: true, loginMethod: "test", role,
      createdAt: new Date("2026-01-01T00:00:00.000Z"), updatedAt: new Date("2026-01-01T00:00:00.000Z"), lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
    } : null,
    req: { protocol: "https", headers: { "user-agent": "Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0" }, ip: "203.0.113.11", socket: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const activeRow = {
  id: 41, actorUserId: 2, actorRole: "super_admin", action: "user.update", targetType: "user", targetId: "12", targetRole: "student",
  description: "Updated a scoped managed user account.", isSuccess: true, ipAddress: "203.0.113.11", browser: "Google Chrome", operatingSystem: "Linux", userAgent: "Mozilla/5.0", metadataJson: null, createdAt: new Date("2026-02-01T00:00:00.000Z"),
};

afterEach(() => vi.restoreAllMocks());

describe("Audit logs security and contract", () => {
  it("removes credential-shaped metadata recursively and keeps values bounded", () => {
    const metadata = audit.sanitiseAuditMetadata({ password: "do-not-store", token: "abc", nested: { authorization: "Bearer x", safe: "visible" }, profileValues: { personal: "private" } });
    expect(metadata).toContain('"password":"[redacted]"');
    expect(metadata).toContain('"token":"[redacted]"');
    expect(metadata).toContain('"authorization":"[redacted]"');
    expect(metadata).toContain('"profileValues":"[redacted]"');
    expect(metadata).toContain('"safe":"visible"');
  });

  it("parses an audit client envelope without persisting the raw request object", () => {
    const client = audit.parseAuditClientContext(context("founder").req);
    expect(client).toMatchObject({ ipAddress: "203.0.113.11", browser: "Google Chrome", operatingSystem: "Linux" });
    expect(client.userAgent).toContain("Chrome");
  });

  it("rejects every unauthorised role from the shared Audit module", async () => {
    for (const role of [null, "admin", "student"] as const) {
      await expect(appRouter.createCaller(context(role)).audit.list({})).rejects.toMatchObject({ code: role ? "FORBIDDEN" : "FORBIDDEN" });
    }
  });

  it("passes an exact Super admin scope into audit list and records the interaction without sensitive filter values", async () => {
    const list = vi.spyOn(audit, "listAuditLogs").mockResolvedValue({ rows: [activeRow], total: 1, page: 0, pageSize: 25, source: "active" });
    const write = vi.spyOn(audit, "writeAuditEvent").mockResolvedValue(1);
    const result = await appRouter.createCaller(context("super_admin")).audit.list({ query: "203.0", actorRole: "student", page: 0, pageSize: 25 });
    expect(result.rows).toEqual([expect.objectContaining({ id: 41 })]);
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ query: "203.0", actorRole: "student" }), { role: "super_admin", userId: 2 });
    expect(write).toHaveBeenCalledWith(expect.objectContaining({ action: "audit.view", metadata: expect.objectContaining({ filtered: expect.any(Array) }) }));
  });

  it("exports only rows returned by the server-scoped data source and applies CSV formula hardening", async () => {
    const rows = [{ ...activeRow, description: "=not-a-formula" }];
    const exportRows = vi.spyOn(audit, "getAuditExportRows").mockResolvedValue(rows as never);
    vi.spyOn(audit, "writeAuditEvent").mockResolvedValue(1);
    const result = await appRouter.createCaller(context("super_admin")).audit.exportCsv({ source: "active", action: "user.update" });
    expect(exportRows).toHaveBeenCalledWith(expect.objectContaining({ action: "user.update", source: "active" }), { role: "super_admin", userId: 2 });
    expect(result.data).toContain("'=not-a-formula");
    expect(result.filename).toMatch(/^audit-logs-active-/);
  });

  it("keeps archive and restore lifecycle Founder-only while recording successful lifecycle actions", async () => {
    await expect(appRouter.createCaller(context("super_admin")).audit.archive()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context("super_admin")).audit.restore({ archiveIds: [9] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    vi.spyOn(audit, "archiveExpiredAuditLogs").mockResolvedValue({ archived: 2, cutoff: new Date("2025-02-01T00:00:00.000Z") });
    vi.spyOn(audit, "restoreAuditLogArchives").mockResolvedValue({ restored: 1 });
    const write = vi.spyOn(audit, "writeAuditEvent").mockResolvedValue(1);
    const founder = appRouter.createCaller(context("founder"));
    await expect(founder.audit.archive()).resolves.toMatchObject({ archived: 2 });
    await expect(founder.audit.restore({ archiveIds: [9] })).resolves.toMatchObject({ restored: 1 });
    expect(write).toHaveBeenCalledWith(expect.objectContaining({ action: "audit.archive" }));
    expect(write).toHaveBeenCalledWith(expect.objectContaining({ action: "audit.restore" }));
  });
});
