import { scryptSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { dashboardPathForRole, verifyUserPasswordHash } from "./userAuth";

describe("universal user credentials", () => {
  const password = "valid-user-password";
  const salt = "test-account-salt";
  const hash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;

  it("accepts only the matching password for a valid scrypt user hash", () => {
    expect(verifyUserPasswordHash(password, hash)).toBe(true);
    expect(verifyUserPasswordHash("wrong-password", hash)).toBe(false);
  });

  it("rejects missing, malformed, and non-scrypt credential values", () => {
    expect(verifyUserPasswordHash(password, null)).toBe(false);
    expect(verifyUserPasswordHash(password, "bcrypt:invalid")).toBe(false);
    expect(verifyUserPasswordHash(password, "scrypt:salt:not-a-hex-digest")).toBe(false);
  });

  it("routes only the private control account to its console and all other roles to private dashboards", () => {
    expect(dashboardPathForRole("founder")).toBe("/admin");
    expect(dashboardPathForRole("admin")).toBe("/dashboard");
    expect(dashboardPathForRole("super_admin")).toBe("/dashboard");
    expect(dashboardPathForRole("student")).toBe("/dashboard");
    expect(dashboardPathForRole("user")).toBe("/dashboard");
  });
});
