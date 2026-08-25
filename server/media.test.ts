import { describe, expect, it, vi, afterEach } from "vitest";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";
import { appRouter } from "./routers";

vi.mock("./audit", async importOriginal => {
  const actual = await importOriginal<typeof import("./audit")>();
  return { ...actual, writeAuditEvent: vi.fn().mockResolvedValue(1) };
});

vi.mock("./storage", () => ({ storagePut: vi.fn().mockResolvedValue({ key: "public-media/demo.jpg", url: "/manus-storage/public-media/demo.jpg" }) }));

function context(role: "founder" | "super_admin" | "admin" | null): TrpcContext {
  return {
    user: role ? { id: 9, openId: `${role}:test`, name: role, email: `${role}@example.test`, passwordHash: null, isActive: true, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const publicRecord = { slot: "home_hero_poster", kind: "image" as const, altText: "A calm classroom.", publicUrl: "/manus-storage/hero.webp", mimeType: "image/webp", fileSize: 1234 };
const managedRecord = { id: 15, ...publicRecord, label: "Home hero poster", storageKey: "hero.webp", isPublished: true, createdByUserId: 9, createdAt: new Date(), updatedAt: new Date() };

afterEach(() => vi.clearAllMocks());

describe("public media router", () => {
  it("allows public visitors to read only published media metadata", async () => {
    const list = vi.spyOn(db, "listPublicMedia").mockResolvedValue([publicRecord]);
    await expect(appRouter.createCaller(context(null)).media.publicList()).resolves.toEqual([publicRecord]);
    expect(list).toHaveBeenCalledOnce();
  });

  it("denies every management operation to unauthenticated, admin and super-admin callers", async () => {
    for (const role of [null, "admin", "super_admin"] as const) {
      const caller = appRouter.createCaller(context(role));
      await expect(caller.media.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.media.remove({ id: 15 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });

  it("permits a founder to list and upload a validated image record", async () => {
    const list = vi.spyOn(db, "listManagedPublicMedia").mockResolvedValue([managedRecord]);
    const save = vi.spyOn(db, "upsertPublicMedia").mockResolvedValue(managedRecord);
    const caller = appRouter.createCaller(context("founder"));
    await expect(caller.media.list()).resolves.toEqual([managedRecord]);
    expect(list).toHaveBeenCalledOnce();
    const contentBase64 = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]).toString("base64");
    await expect(caller.media.upload({ slot: "home_hero_poster", label: "Home hero poster", kind: "image", altText: "A calm classroom.", mimeType: "image/jpeg", fileName: "hero.jpg", contentBase64, isPublished: true })).resolves.toEqual(managedRecord);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ slot: "home_hero_poster", createdByUserId: 9, mimeType: "image/jpeg" }));
  });

  it("rejects mismatched media types before storage is reached", async () => {
    const caller = appRouter.createCaller(context("founder"));
    const contentBase64 = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]).toString("base64");
    await expect(caller.media.upload({ slot: "home_hero_video", label: "Hero video", kind: "video", altText: "Decorative video.", mimeType: "image/jpeg", fileName: "hero.jpg", contentBase64, isPublished: true })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
