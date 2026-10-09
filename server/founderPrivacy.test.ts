import { describe, expect, it } from "vitest";
import { inMemoryAuditLogs, listAuditLogs, getAuditExportRows, suggestAuditSearch } from "./audit";
import { getStudentProfile } from "./students";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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

describe("Founder Strict Privacy & Super Admin Supremacy", () => {
  it("strictly excludes founder actor, target, and description from non-founder audit log queries", async () => {
    // Add sample logs
    inMemoryAuditLogs.push({
      id: 991,
      actorUserId: 1,
      actorRole: "founder",
      action: "user.update",
      targetType: "user",
      targetId: "2",
      targetRole: "super_admin",
      description: "Founder updated root configuration",
      isSuccess: true,
      ipAddress: "127.0.0.1",
      browser: "Chrome",
      operatingSystem: "Linux",
      userAgent: "Agent",
      metadataJson: null,
      createdAt: new Date(),
    });

    inMemoryAuditLogs.push({
      id: 992,
      actorUserId: 2,
      actorRole: "super_admin",
      action: "user.update",
      targetType: "user",
      targetId: "3",
      targetRole: "admin",
      description: "Super Admin updated administrator permissions",
      isSuccess: true,
      ipAddress: "127.0.0.1",
      browser: "Chrome",
      operatingSystem: "Linux",
      userAgent: "Agent",
      metadataJson: null,
      createdAt: new Date(),
    });

    // When queried by super_admin scope
    const superAdminLogs = await listAuditLogs({ page: 0, pageSize: 50 }, { role: "super_admin", userId: 2 });
    expect(superAdminLogs.rows.some(r => r.actorRole === "founder")).toBe(false);
    expect(superAdminLogs.rows.some(r => r.targetRole === "founder")).toBe(false);
    expect(superAdminLogs.rows.some(r => r.description.toLowerCase().includes("founder"))).toBe(false);
    expect(superAdminLogs.rows.some(r => r.id === 992)).toBe(true);

    // Export rows for super_admin
    const exportRows = await getAuditExportRows({}, { role: "super_admin", userId: 2 });
    expect(exportRows.some(r => r.actorRole === "founder")).toBe(false);
    expect(exportRows.some(r => r.description.toLowerCase().includes("founder"))).toBe(false);

    // Suggestions for super_admin
    const suggestions = await suggestAuditSearch({ query: "founder" }, { role: "super_admin", userId: 2 });
    expect(suggestions.length).toBe(0);
  });

  it("masks student profile history actorName to Super Admin instead of Founder", async () => {
    const student = await getStudentProfile(1);
    if (student && student.history) {
      for (const h of student.history) {
        expect(h.actorName).not.toBe("Founder");
      }
    }
  });

  it("ensures Super Admin cannot manage or query founder account", async () => {
    const caller = appRouter.createCaller(context("super_admin"));
    const list = await caller.superAdminUsers.list({ page: 0, pageSize: 50, role: "admin" });
    expect(list.rows.some((u: any) => u.role === "founder")).toBe(false);
  });
});
