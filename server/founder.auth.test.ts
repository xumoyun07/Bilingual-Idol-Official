import { randomBytes, scryptSync } from "node:crypto";
import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import { FOUNDER_EMAIL, isFounderEmail, shouldGrantFounderRole } from "./founderIdentity";
import { verifyFounderCredentials } from "./founderAuth";
import { sdk } from "./_core/sdk";

/**
 * Вход основателя. Пароль генерируется в рантайме, хеш — тоже:
 * в файле нет ни одного секрета.
 */

const ORIGINAL_HASH = process.env.FOUNDER_PASSWORD_HASH;

function makeHash(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

describe("Founder Authentication & Access", () => {
  const password = randomBytes(18).toString("base64url");

  beforeEach(() => {
    process.env.FOUNDER_PASSWORD_HASH = makeHash(password);
  });

  afterEach(() => {
    if (ORIGINAL_HASH === undefined) delete process.env.FOUNDER_PASSWORD_HASH;
    else process.env.FOUNDER_PASSWORD_HASH = ORIGINAL_HASH;
  });

  it("recognizes founder email and credentials", () => {
    expect(isFounderEmail(FOUNDER_EMAIL)).toBe(true);
    expect(isFounderEmail(` ${FOUNDER_EMAIL.toUpperCase()} `)).toBe(true);
    expect(isFounderEmail("tryingreal761@gmail.com")).toBe(false);
    expect(isFounderEmail("other@example.com")).toBe(false);
    // Прежний адрес основателем больше не считается
    expect(isFounderEmail("lektor@gmail.com")).toBe(false);

    expect(verifyFounderCredentials(FOUNDER_EMAIL, password)).toBe(true);
    expect(verifyFounderCredentials("tryingreal761@gmail.com", password)).toBe(false);
    expect(verifyFounderCredentials(FOUNDER_EMAIL, randomBytes(18).toString("base64url"))).toBe(false);
  });

  it("grants founder role accurately", () => {
    expect(shouldGrantFounderRole({ email: FOUNDER_EMAIL, openId: `founder:${FOUNDER_EMAIL}` })).toBe(true);
    expect(shouldGrantFounderRole({ email: "tryingreal761@gmail.com", openId: "founder:tryingreal761@gmail.com" })).toBe(false);
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
      email: FOUNDER_EMAIL,
      password,
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
    expect(me?.email).toBe(FOUNDER_EMAIL);
  });
});
