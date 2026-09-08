import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import { isFounderEmail, shouldGrantFounderRole } from "./founderIdentity";
import { verifyFounderCredentials } from "./founderAuth";
import { sdk } from "./_core/sdk";

describe("Founder Authentication & Access", () => {
  it("recognizes founder email and credentials", () => {
    expect(isFounderEmail("lektor@gmail.com")).toBe(true);
    expect(isFounderEmail("LEKTOR@GMAIL.COM ")).toBe(true);
    expect(isFounderEmail("tryingreal761@gmail.com")).toBe(true);
    expect(isFounderEmail("other@example.com")).toBe(false);

    expect(verifyFounderCredentials("lektor@gmail.com", "Lektor$07$xumoyun")).toBe(true);
    expect(verifyFounderCredentials("tryingreal761@gmail.com", "Lektor$07$xumoyun")).toBe(true);
    expect(verifyFounderCredentials("lektor@gmail.com", "wrongpassword")).toBe(false);
  });

  it("grants founder role accurately", () => {
    expect(shouldGrantFounderRole({ email: "lektor@gmail.com", openId: "founder:lektor@gmail.com" })).toBe(true);
    expect(shouldGrantFounderRole({ email: "tryingreal761@gmail.com", openId: "founder:tryingreal761@gmail.com" })).toBe(true);
    expect(shouldGrantFounderRole({ email: "student@example.com", openId: "student:123" })).toBe(false);
  });

  it("allows logging in via auth.login with founder credentials and returns token and admin redirect", async () => {
    const cookiesSet: Record<string, string> = {};
    const fakeRes = {
      cookie: (name: string, val: string) => {
        cookiesSet[name] = val;
      },
      clearCookie: () => {},
    };

    const caller = appRouter.createCaller({
      user: null,
      req: { headers: {} } as any,
      res: fakeRes as any,
    });

    const result = await caller.auth.login({
      email: "lektor@gmail.com",
      password: "Lektor$07$xumoyun",
    });

    expect(result.success).toBe(true);
    expect(result.role).toBe("founder");
    expect(result.redirectTo).toBe("/admin");
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe("string");

    const authCaller = appRouter.createCaller({
      user: await sdk.authenticateRequest({
        headers: { authorization: `Bearer ${result.token}` },
      } as any),
      req: { headers: { authorization: `Bearer ${result.token}` } } as any,
      res: fakeRes as any,
    });

    const me = await authCaller.auth.me();
    expect(me).toBeDefined();
    expect(me?.role).toBe("founder");
    expect(me?.email).toBe("lektor@gmail.com");
  });
});
