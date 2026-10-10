import { randomBytes } from "node:crypto";
import { describe, expect, it, vi, afterEach } from "vitest";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";
import { appRouter } from "./routers";

/** Пароль для входа в схему генерируется в рантайме: литералов секретов нет. */
const anyPassword = () => randomBytes(18).toString("base64url");

vi.mock("./audit", async importOriginal => {
  const actual = await importOriginal<typeof import("./audit")>();
  return { ...actual, writeAuditEvent: vi.fn().mockResolvedValue(1) };
});

function context(role: "founder" | "super_admin" | "admin" | null): TrpcContext {
  return {
    user: role ? { id: 9, openId: `${role}:test`, name: role, email: `${role}@example.test`, passwordHash: null, isActive: true, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const account = { id: 42, openId: "issued:test", name: "Ari Student", email: "ari@example.test", isActive: true, loginMethod: "issued", role: "student" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

afterEach(() => vi.restoreAllMocks());

describe("Super admin Users router", () => {
  it("allows authorized administrative roles to access user management", async () => {
    await expect(appRouter.createCaller(context(null)).superAdminUsers.list({})).rejects.toBeDefined();
    const list = vi.spyOn(db, "listSuperAdminManagedUsers").mockResolvedValue({ rows: [account], total: 1, page: 0, pageSize: 25 });
    const result = await appRouter.createCaller(context("super_admin")).superAdminUsers.list({ role: "student" });
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ role: "student" }));
    expect(result.rows).toEqual([account]);
  });

  it("rejects peer Super admin creation and delegates permitted account creation", async () => {
    const create = vi.spyOn(db, "createSuperAdminManagedUser").mockResolvedValue(account);
    const caller = appRouter.createCaller(context("super_admin"));
    await expect(caller.superAdminUsers.create({ name: "Ari Student", email: "ari@example.test", password: anyPassword(), role: "student", isActive: true })).resolves.toEqual(account);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ role: "student" }), expect.objectContaining({ role: "super_admin" }));
    await expect(caller.superAdminUsers.create({ name: "Peer", email: "peer@example.test", password: anyPassword(), role: "super_admin" as never, isActive: true })).rejects.toBeDefined();
  });

  it("does not expose a Field Builder mutation surface", () => {
    const procedures = appRouter._def.procedures as Record<string, unknown>;
    expect(procedures["superAdminUsers.formSchema"]).toBeDefined();
    expect(procedures["superAdminUsers.updateSystemFields"]).toBeUndefined();
    expect(procedures["superAdminUsers.createField"]).toBeUndefined();
  });
});
