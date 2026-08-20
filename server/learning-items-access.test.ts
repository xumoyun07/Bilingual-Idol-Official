import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({ createLearningItem: vi.fn(), updateLearningItem: vi.fn(), deleteLearningItem: vi.fn() }));
vi.mock("./db", () => ({ createLearningItem: dbMocks.createLearningItem, updateLearningItem: dbMocks.updateLearningItem, deleteLearningItem: dbMocks.deleteLearningItem }));
import { contentRouter } from "./routers/content";

function contextFor(role: "user" | "founder"): TrpcContext {
  return { user: { id: 1, openId: "learning-role-test", name: "Role Test", email: "role@example.com", loginMethod: "local", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const item = { kind: "schedule" as const, title: "Confirmed English conversation session", description: "A verified session detail for learners who are enrolled in the relevant programme.", actionUrl: null, isPublished: false, sortOrder: 0 };

beforeEach(() => { vi.clearAllMocks(); dbMocks.createLearningItem.mockResolvedValue({ id: 8 }); dbMocks.updateLearningItem.mockResolvedValue({ success: true }); dbMocks.deleteLearningItem.mockResolvedValue({ success: true }); });

describe("Founder learning item management", () => {
  it("rejects a non-Founder before any learning item mutation is run", async () => {
    const caller = contentRouter.createCaller(contextFor("user"));
    await expect(caller.createLearningItem(item)).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    expect(dbMocks.createLearningItem).not.toHaveBeenCalled();
  });

  it("allows Founder create, edit and delete procedures", async () => {
    const caller = contentRouter.createCaller(contextFor("founder"));
    await expect(caller.createLearningItem(item)).resolves.toEqual({ id: 8 });
    await expect(caller.updateLearningItem({ id: 8, data: { ...item, title: "Updated schedule" } })).resolves.toEqual({ success: true });
    await expect(caller.deleteLearningItem({ id: 8 })).resolves.toEqual({ success: true });
    expect(dbMocks.createLearningItem).toHaveBeenCalledWith(item);
    expect(dbMocks.updateLearningItem).toHaveBeenCalledWith(8, { ...item, title: "Updated schedule" });
    expect(dbMocks.deleteLearningItem).toHaveBeenCalledWith(8);
  });
});
