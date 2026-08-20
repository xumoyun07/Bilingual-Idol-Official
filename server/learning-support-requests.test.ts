import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({ createLearningSupportRequest: vi.fn(), updateLearningSupportRequestStatus: vi.fn() }));
vi.mock("./db", () => ({ createLearningSupportRequest: dbMocks.createLearningSupportRequest, updateLearningSupportRequestStatus: dbMocks.updateLearningSupportRequestStatus }));
import { contentRouter } from "./routers/content";

function contextFor(role: "user" | "founder" | null): TrpcContext {
  const user = role ? { id: 1, openId: "support-role-test", name: "Role Test", email: "role@example.com", loginMethod: "local", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } : null;
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const request = { type: "teacher" as const, contactEmail: "family@example.com", message: "Could we receive guidance on preparation for the next language session?" };

beforeEach(() => { vi.clearAllMocks(); dbMocks.createLearningSupportRequest.mockResolvedValue({ id: 13 }); dbMocks.updateLearningSupportRequestStatus.mockResolvedValue({ success: true }); });

describe("Learning support requests", () => {
  it("allows a validated public teacher, payment, or report request without a student account", async () => {
    const caller = contentRouter.createCaller(contextFor(null));
    await expect(caller.createLearningSupportRequest(request)).resolves.toEqual({ id: 13 });
    expect(dbMocks.createLearningSupportRequest).toHaveBeenCalledWith(request);
  });

  it("allows only Founder to update a support request status", async () => {
    await expect(contentRouter.createCaller(contextFor("user")).updateLearningSupportRequestStatus({ id: 13, status: "reviewed" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(contentRouter.createCaller(contextFor("founder")).updateLearningSupportRequestStatus({ id: 13, status: "resolved" })).resolves.toEqual({ success: true });
    expect(dbMocks.updateLearningSupportRequestStatus).toHaveBeenCalledWith(13, "resolved");
  });
});
