import { describe, expect, it } from "vitest";
import { shouldGrantFounderRole } from "./founderIdentity";

describe("Founder identity assignment", () => {
  it("grants Founder only for the configured OAuth e-mail, irrespective of case or outer whitespace", () => {
    expect(shouldGrantFounderRole({ email: " LEKTOR@GMAIL.COM ", openId: "other", ownerOpenId: "owner" })).toBe(true);
  });

  it("does not grant Founder to another e-mail", () => {
    expect(shouldGrantFounderRole({ email: "lektor0780@gmail.com", openId: "other", ownerOpenId: "owner" })).toBe(false);
    expect(shouldGrantFounderRole({ email: "staff@example.com", openId: "other", ownerOpenId: "owner" })).toBe(false);
  });

  it("retains the platform owner as Founder even if its e-mail has not yet been provided by OAuth", () => {
    expect(shouldGrantFounderRole({ email: null, openId: "owner", ownerOpenId: "owner" })).toBe(true);
  });
});
