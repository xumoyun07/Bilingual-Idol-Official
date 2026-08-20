import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createAnnouncement: vi.fn(),
  updateAnnouncement: vi.fn(),
  updateAnnouncementPublishState: vi.fn(),
  deleteAnnouncement: vi.fn(),
}));

vi.mock("./db", () => ({
  createAnnouncement: dbMocks.createAnnouncement,
  updateAnnouncement: dbMocks.updateAnnouncement,
  updateAnnouncementPublishState: dbMocks.updateAnnouncementPublishState,
  deleteAnnouncement: dbMocks.deleteAnnouncement,
}));

import { contentRouter } from "./routers/content";

function contextFor(role: "user" | "founder"): TrpcContext {
  return {
    user: { id: 1, openId: "role-test", name: "Role Test", email: "role@example.com", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const announcement = { slug: "founder-update", title: "Founder update", excerpt: "A verified centre update for the public news page.", body: "This full announcement body is intentionally detailed enough for schema validation.", category: "announcement" as const, isPublished: false, publishedAt: null };

beforeEach(() => {
  vi.clearAllMocks();
  dbMocks.createAnnouncement.mockResolvedValue({ id: 5 });
  dbMocks.updateAnnouncement.mockResolvedValue({ success: true });
  dbMocks.updateAnnouncementPublishState.mockResolvedValue({ success: true });
  dbMocks.deleteAnnouncement.mockResolvedValue({ success: true });
});

describe("Founder announcement management", () => {
  it("rejects a non-Founder before any announcement mutation is run", async () => {
    const caller = contentRouter.createCaller(contextFor("user"));

    await expect(caller.createAnnouncement(announcement)).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    expect(dbMocks.createAnnouncement).not.toHaveBeenCalled();
  });

  it("allows Founder create, edit, publish-state and delete procedures", async () => {
    const caller = contentRouter.createCaller(contextFor("founder"));

    await expect(caller.createAnnouncement(announcement)).resolves.toEqual({ id: 5 });
    await expect(caller.updateAnnouncement({ id: 5, data: { ...announcement, title: "Edited by Founder" } })).resolves.toEqual({ success: true });
    await expect(caller.setAnnouncementPublishState({ id: 5, isPublished: true })).resolves.toEqual({ success: true });
    await expect(caller.deleteAnnouncement({ id: 5 })).resolves.toEqual({ success: true });

    expect(dbMocks.createAnnouncement).toHaveBeenCalledTimes(1);
    expect(dbMocks.updateAnnouncement).toHaveBeenCalledTimes(1);
    expect(dbMocks.updateAnnouncementPublishState).toHaveBeenCalledWith(5, true);
    expect(dbMocks.deleteAnnouncement).toHaveBeenCalledWith(5);
  });
});
