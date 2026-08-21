import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({ listPublicAnnouncements: vi.fn() }));
vi.mock("./db", () => ({ listPublicAnnouncements: dbMocks.listPublicAnnouncements }));

import { contentRouter } from "./routers/content";

beforeEach(() => {
  vi.clearAllMocks();
  dbMocks.listPublicAnnouncements.mockResolvedValue([{ id: 5, slug: "centre-update", title: "Verified update" }]);
});

describe("Content router after Founder console reduction", () => {
  it("keeps the public announcement read contract", async () => {
    const caller = contentRouter.createCaller({ user: null, req: { protocol: "https", headers: {} } as never, res: {} as never });
    await expect(caller.publicAnnouncements()).resolves.toEqual([{ id: 5, slug: "centre-update", title: "Verified update" }]);
    expect(dbMocks.listPublicAnnouncements).toHaveBeenCalledTimes(1);
  });

  it("does not expose legacy Founder content mutation procedures", () => {
    const procedures = contentRouter._def.procedures as Record<string, unknown>;
    expect(procedures.createAnnouncement).toBeUndefined();
    expect(procedures.updateAnnouncement).toBeUndefined();
    expect(procedures.deleteAnnouncement).toBeUndefined();
    expect(procedures.createProgram).toBeUndefined();
    expect(procedures.createTeamProfile).toBeUndefined();
  });
});
