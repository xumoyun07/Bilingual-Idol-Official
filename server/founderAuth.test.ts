import { describe, expect, it } from "vitest";
import { isFounderAuthConfigured, verifyFounderCredentials } from "./founderAuth";

describe("Founder password configuration", () => {
  it("keeps the enabled private sign-in configuration internal", () => {
    expect(isFounderAuthConfigured()).toBe(true);
  });

  it("does not accept credentials with a non-Founder e-mail", () => {
    expect(verifyFounderCredentials("someone@example.com", "not-the-founder-password")).toBe(false);
  });
});
