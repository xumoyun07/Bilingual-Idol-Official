import { afterEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";
import { appRouter } from "./routers";

vi.mock("./audit", async importOriginal => {
  const actual = await importOriginal<typeof import("./audit")>();
  return { ...actual, writeAuditEvent: vi.fn().mockResolvedValue(1) };
});
vi.mock("./storage", () => ({ storagePut: vi.fn().mockResolvedValue({ key: "news/centre-update/card.jpg", url: "/manus-storage/news/centre-update/card.jpg" }) }));

function context(role: "founder" | "super_admin" | "admin" | null): TrpcContext {
  return { user: role ? { id: 9, openId: `${role}:test`, name: role, email: `${role}@example.test`, passwordHash: null, isActive: true, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } : null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const page = { rows: [{ id: 12, slug: "centre-update", title: "Verified update", excerpt: "A confirmed centre update.", body: "Full confirmed centre update content.", category: "announcement" as const, imageUrl: null, imageAltText: null, publishedAt: new Date("2026-08-24T00:00:00.000Z") }], total: 7, page: 0, pageSize: 6, totalPages: 2 };
const record = { ...page.rows[0], imageStorageKey: null, isPublished: true, createdAt: new Date(), updatedAt: new Date() };

afterEach(() => vi.restoreAllMocks());

describe("News router", () => {
  it("returns a public page through the server-enforced six-post contract", async () => {
    const list = vi.spyOn(db, "listPublicAnnouncementsPage").mockResolvedValue(page);
    await expect(appRouter.createCaller(context(null)).news.publicPage({ page: 0 })).resolves.toEqual(page);
    expect(list).toHaveBeenCalledWith({ page: 0 });
  });

  it("denies News management to unauthenticated and non-founder callers", async () => {
    for (const role of [null, "admin", "super_admin"] as const) {
      const caller = appRouter.createCaller(context(role));
      await expect(caller.news.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.news.remove({ id: 12 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });

  it("permits a founder to create a real post without inventing a card image", async () => {
    const create = vi.spyOn(db, "createAnnouncement").mockResolvedValue(record);
    const caller = appRouter.createCaller(context("founder"));
    await expect(caller.news.create({ slug: "centre-update", title: "Verified update", excerpt: "A confirmed centre update.", body: "Full confirmed centre update content.", category: "announcement", isPublished: true, clearImage: false })).resolves.toEqual(record);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ slug: "centre-update", imageUrl: null, isPublished: true }));
  });

  it("rejects malformed News image data before publishing", async () => {
    const caller = appRouter.createCaller(context("founder"));
    await expect(caller.news.create({ slug: "centre-update", title: "Verified update", excerpt: "A confirmed centre update.", body: "Full confirmed centre update content.", category: "announcement", isPublished: false, clearImage: false, image: { mimeType: "image/jpeg", fileName: "card.jpg", altText: "Centre card image", contentBase64: "not-valid-base64" } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
