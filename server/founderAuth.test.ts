import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { isFounderAuthConfigured, verifyFounderCredentials } from "./founderAuth";

const context: TrpcContext = { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };

describe("Founder password configuration", () => {
  it("exposes an enabled Founder sign-in status through the lightweight auth endpoint", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.auth.founderAuthStatus()).resolves.toEqual({ configured: true });
    expect(isFounderAuthConfigured()).toBe(true);
  });

  it("does not accept credentials with a non-Founder e-mail", () => {
    expect(verifyFounderCredentials("someone@example.com", "not-the-founder-password")).toBe(false);
  });
});
