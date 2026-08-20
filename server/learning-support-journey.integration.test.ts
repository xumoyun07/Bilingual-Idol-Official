import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

type StoredRequest = { id: number; type: "teacher" | "payment" | "report"; contactEmail: string; message: string; status: "new" | "reviewed" | "resolved"; createdAt: Date; updatedAt: Date };
const state = vi.hoisted(() => ({ requests: [] as StoredRequest[] }));
const dbMocks = vi.hoisted(() => ({
  createLearningSupportRequest: vi.fn(async (input: Pick<StoredRequest, "type" | "contactEmail" | "message">) => { const now = new Date(); const request: StoredRequest = { id: state.requests.length + 1, ...input, status: "new", createdAt: now, updatedAt: now }; state.requests.push(request); return { id: request.id }; }),
  listLearningSupportRequests: vi.fn(async () => [...state.requests].reverse()),
  updateLearningSupportRequestStatus: vi.fn(async (id: number, status: StoredRequest["status"]) => { const request = state.requests.find(item => item.id === id); if (!request) throw new Error("Not found"); request.status = status; request.updatedAt = new Date(); return { success: true }; }),
}));
vi.mock("./db", () => ({ createLearningSupportRequest: dbMocks.createLearningSupportRequest, listLearningSupportRequests: dbMocks.listLearningSupportRequests, updateLearningSupportRequestStatus: dbMocks.updateLearningSupportRequestStatus }));
import { contentRouter } from "./routers/content";

function contextFor(role: "founder" | null): TrpcContext { const user = role ? { id: 1, openId: "journey-founder", name: "Founder", email: "founder@example.com", loginMethod: "local", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } : null; return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }

beforeEach(() => { state.requests.length = 0; vi.clearAllMocks(); });

describe("Learning support request role-aware journey", () => {
  it("moves a public teacher request through Founder inbox review to resolution", async () => {
    const publicCaller = contentRouter.createCaller(contextFor(null));
    const founderCaller = contentRouter.createCaller(contextFor("founder"));

    await expect(publicCaller.createLearningSupportRequest({ type: "teacher", contactEmail: "family@example.com", message: "Could we receive guidance before the next conversation session?" })).resolves.toEqual({ id: 1 });
    await expect(founderCaller.learningSupportRequests()).resolves.toMatchObject([{ id: 1, type: "teacher", status: "new", contactEmail: "family@example.com" }]);
    await expect(founderCaller.updateLearningSupportRequestStatus({ id: 1, status: "reviewed" })).resolves.toEqual({ success: true });
    await expect(founderCaller.updateLearningSupportRequestStatus({ id: 1, status: "resolved" })).resolves.toEqual({ success: true });
    await expect(founderCaller.learningSupportRequests()).resolves.toMatchObject([{ id: 1, status: "resolved" }]);
  });
});
