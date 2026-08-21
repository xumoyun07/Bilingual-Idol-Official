import { TRPCError } from "@trpc/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";
import { appRouter } from "./routers";

function context(role: "founder" | "admin" | "student" | null): TrpcContext {
  return {
    user: role ? {
      id: role === "founder" ? 1 : 2,
      openId: `${role}:test`,
      name: role,
      email: `${role}@example.test`,
      passwordHash: null,
      isActive: true,
      loginMethod: "test",
      role,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
    } : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const account = {
  id: 42,
  openId: "issued:test",
  name: "Ari Student",
  email: "ari@example.test",
  isActive: true,
  loginMethod: "issued_by_founder",
  role: "student" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
};

afterEach(() => vi.restoreAllMocks());

describe("Users router", () => {
  it("rejects unauthenticated and non-Founder directory access", async () => {
    await expect(appRouter.createCaller(context(null)).users.list({})).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context("admin")).users.list({})).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("passes search and filter parameters to the Founder-managed directory", async () => {
    const list = vi.spyOn(db, "listManagedUsers").mockResolvedValue({ rows: [account], total: 1, page: 0, pageSize: 25 });
    const result = await appRouter.createCaller(context("founder")).users.list({ query: "ari", role: "student", isActive: true, createdFrom: "2026-01-01", page: 0, pageSize: 25 });
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ query: "ari", role: "student", isActive: true, createdFrom: "2026-01-01" }));
    expect(result.rows).toEqual([account]);
  });

  it("allows Founder to create only issued, non-Founder roles", async () => {
    const create = vi.spyOn(db, "createManagedUser").mockResolvedValue(account);
    const caller = appRouter.createCaller(context("founder"));
    await expect(caller.users.create({ name: "Ari Student", email: "ari@example.test", password: "sufficient-password", role: "student", isActive: true })).resolves.toEqual(account);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ role: "student" }));
    await expect(caller.users.create({ name: "Invalid Founder", email: "founder@example.test", password: "sufficient-password", role: "founder" as never, isActive: true })).rejects.toBeInstanceOf(TRPCError);
  });

  it("keeps Field Builder schema and metadata actions Founder-only", async () => {
    await expect(appRouter.createCaller(context("admin")).users.formSchema()).rejects.toMatchObject({ code: "FORBIDDEN" });
    const createField = vi.spyOn(db, "createUserFormField").mockResolvedValue({ id: 7, key: "preferred_language_test", label: "Preferred language", fieldType: "dropdown", isRequired: true, placeholder: null, options: ["English"], sectionId: null, sortOrder: 1, isActive: true });
    const caller = appRouter.createCaller(context("founder"));
    await caller.users.createField({ label: "Preferred language", fieldType: "dropdown", isRequired: true, sortOrder: 1, options: ["English"], sectionId: null, isActive: true });
    expect(createField).toHaveBeenCalledWith(expect.objectContaining({ fieldType: "dropdown", options: ["English"], sectionId: null }));
    await expect(caller.users.createField({ label: "Unsafe", fieldType: "email" as never, isRequired: false, sortOrder: 2, isActive: true })).rejects.toBeInstanceOf(TRPCError);
  });

  it("allows only Founder to persist a complete dynamic field order", async () => {
    await expect(appRouter.createCaller(context("admin")).users.reorderFields({ fieldIds: [7, 3] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const reorder = vi.spyOn(db, "reorderUserFormFields").mockResolvedValue({ sections: [], fields: [] });
    await appRouter.createCaller(context("founder")).users.reorderFields({ fieldIds: [7, 3] });
    expect(reorder).toHaveBeenCalledWith([7, 3]);
    await expect(appRouter.createCaller(context("founder")).users.reorderFields({ fieldIds: [7, 7] })).rejects.toBeInstanceOf(TRPCError);
  });

  it("converts protected Founder-target mutation errors into safe client errors", async () => {
    vi.spyOn(db, "updateManagedUser").mockRejectedValue(new Error("Founder accounts cannot be changed in Users."));
    const caller = appRouter.createCaller(context("founder"));
    await expect(caller.users.update({ id: 1, name: "Founder", email: "founder@example.test", password: "", role: "admin", isActive: true })).rejects.toMatchObject({ code: "BAD_REQUEST", message: "Founder accounts cannot be changed in Users." });
  });
});
