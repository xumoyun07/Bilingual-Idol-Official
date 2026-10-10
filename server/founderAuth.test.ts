import { randomBytes, scryptSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isFounderAuthConfigured, verifyFounderCredentials } from "./founderAuth";
import { FOUNDER_EMAIL } from "./founderIdentity";

/**
 * Конфигурация входа основателя.
 * Пароль и хеш генерируются в рантайме — в файле секретов нет.
 */

const ORIGINAL_HASH = process.env.FOUNDER_PASSWORD_HASH;

function makeHash(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

describe("Founder password configuration", () => {
  const password = randomBytes(18).toString("base64url");

  beforeEach(() => {
    process.env.FOUNDER_PASSWORD_HASH = makeHash(password);
  });

  afterEach(() => {
    if (ORIGINAL_HASH === undefined) delete process.env.FOUNDER_PASSWORD_HASH;
    else process.env.FOUNDER_PASSWORD_HASH = ORIGINAL_HASH;
  });

  it("configuration is enabled only when the env hash is present", () => {
    expect(isFounderAuthConfigured()).toBe(true);
    delete process.env.FOUNDER_PASSWORD_HASH;
    expect(isFounderAuthConfigured()).toBe(false);
  });

  it("does not accept credentials with a non-Founder e-mail", () => {
    expect(verifyFounderCredentials("someone@example.com", password)).toBe(false);
  });

  it("accepts valid founder credentials irrespective of case or outer whitespace", () => {
    expect(verifyFounderCredentials(FOUNDER_EMAIL, password)).toBe(true);
    expect(verifyFounderCredentials(`  ${FOUNDER_EMAIL.toUpperCase()}  `, password)).toBe(true);
    expect(verifyFounderCredentials(FOUNDER_EMAIL, randomBytes(18).toString("base64url"))).toBe(false);
  });

  it("fails closed when the env hash is missing", () => {
    delete process.env.FOUNDER_PASSWORD_HASH;
    expect(verifyFounderCredentials(FOUNDER_EMAIL, password)).toBe(false);
  });
});
