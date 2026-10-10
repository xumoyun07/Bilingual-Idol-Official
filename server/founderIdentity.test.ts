import { describe, expect, it } from "vitest";
import { FOUNDER_EMAIL, isFounderEmail, shouldGrantFounderRole } from "./founderIdentity";

describe("Founder identity assignment", () => {
  it("grants Founder only for the configured e-mail, irrespective of case or outer whitespace", () => {
    expect(FOUNDER_EMAIL).toBe("lektor@bilc.my");
    expect(shouldGrantFounderRole({ email: " LEKTOR@BILC.MY ", openId: "other", ownerOpenId: "owner" })).toBe(true);
    expect(isFounderEmail(`  ${FOUNDER_EMAIL.toUpperCase()}  `)).toBe(true);
  });

  it("does not grant Founder to another e-mail", () => {
    expect(shouldGrantFounderRole({ email: "lektor0780@bilc.my", openId: "other", ownerOpenId: "owner" })).toBe(false);
    expect(shouldGrantFounderRole({ email: "staff@example.com", openId: "other", ownerOpenId: "owner" })).toBe(false);
    // Прежние «дополнительные» адреса основателем больше не считаются.
    expect(isFounderEmail("lektor@gmail.com")).toBe(false);
    expect(isFounderEmail("lektorinvideo@gmail.com")).toBe(false);
  });

  it("retains the platform owner as Founder even if its e-mail has not yet been provided by OAuth", () => {
    expect(shouldGrantFounderRole({ email: null, openId: "owner", ownerOpenId: "owner" })).toBe(true);
  });
});
