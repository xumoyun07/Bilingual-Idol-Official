import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

type StoredItem = { id: number; kind: "schedule" | "material" | "teacher" | "payment" | "report"; title: string; description: string; actionUrl: string | null; isPublished: boolean; sortOrder: number; createdAt: Date; updatedAt: Date };
const state = vi.hoisted(() => ({ items: [] as StoredItem[] }));
const dbMocks = vi.hoisted(() => ({
  createLearningItem: vi.fn(async (input: Omit<StoredItem, "id" | "createdAt" | "updatedAt">) => { const now = new Date(); const item: StoredItem = { id: state.items.length + 1, ...input, createdAt: now, updatedAt: now }; state.items.push(item); return { id: item.id }; }),
  updateLearningItem: vi.fn(async (id: number, input: Omit<StoredItem, "id" | "createdAt" | "updatedAt">) => { const item = state.items.find(candidate => candidate.id === id); if (!item) throw new Error("Not found"); Object.assign(item, input, { updatedAt: new Date() }); return { success: true }; }),
  listLearningItems: vi.fn(async () => [...state.items]),
  listPublicLearningItems: vi.fn(async () => state.items.filter(item => item.isPublished)),
}));
vi.mock("./db", () => ({ createLearningItem: dbMocks.createLearningItem, updateLearningItem: dbMocks.updateLearningItem, listLearningItems: dbMocks.listLearningItems, listPublicLearningItems: dbMocks.listPublicLearningItems }));
import { contentRouter } from "./routers/content";

function founderContext(): TrpcContext { return { user: { id: 1, openId: "lifecycle-founder", name: "Founder", email: "founder@example.com", loginMethod: "local", role: "founder", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }
const draft = { kind: "material" as const, title: "Conversation preparation guide", description: "A confirmed preparation resource for the next conversation learning session.", actionUrl: null, isPublished: false, sortOrder: 0 };

beforeEach(() => { state.items.length = 0; vi.clearAllMocks(); });

describe("Founder learning item lifecycle", () => {
  it("keeps a draft out of the public hub until Founder publishes it", async () => {
    const founder = contentRouter.createCaller(founderContext()); const publicCaller = contentRouter.createCaller({ ...founderContext(), user: null });
    await expect(founder.createLearningItem(draft)).resolves.toEqual({ id: 1 });
    await expect(founder.learningItems()).resolves.toMatchObject([{ id: 1, isPublished: false, title: draft.title }]);
    await expect(publicCaller.publicLearningItems()).resolves.toEqual([]);
    await expect(founder.updateLearningItem({ id: 1, data: { ...draft, isPublished: true, title: "Published conversation preparation guide" } })).resolves.toEqual({ success: true });
    await expect(publicCaller.publicLearningItems()).resolves.toMatchObject([{ id: 1, isPublished: true, title: "Published conversation preparation guide" }]);
  });
});
