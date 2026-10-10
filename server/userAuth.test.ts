import { randomBytes, scryptSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { dashboardPathForRole, verifyUserPasswordHash } from "./userAuth";

/** Пароль генерируется в рантайме: в файле нет литералов секретов. */
function runtimePassword(): string {
  return randomBytes(18).toString("base64url");
}

describe("universal user credentials", () => {
  const password = runtimePassword();
  const wrongPassword = runtimePassword();
  const salt = "test-account-salt";
  const hash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;

  it("accepts only the matching password for a valid scrypt user hash", () => {
    expect(verifyUserPasswordHash(password, hash)).toBe(true);
    expect(verifyUserPasswordHash(wrongPassword, hash)).toBe(false);
  });

  it("rejects missing, malformed, and non-scrypt credential values", () => {
    expect(verifyUserPasswordHash(password, null)).toBe(false);
    expect(verifyUserPasswordHash(password, "bcrypt:invalid")).toBe(false);
    expect(verifyUserPasswordHash(password, "scrypt:salt:not-a-hex-digest")).toBe(false);
  });

  it("routes every supported role through the universal login to its permitted dashboard", () => {
    expect(dashboardPathForRole("founder")).toBe("/admin");
    expect(dashboardPathForRole("super_admin")).toBe("/super-admin");
    expect(dashboardPathForRole("admin")).toBe("/dashboard");
    expect(dashboardPathForRole("marketing")).toBe("/dashboard");
    expect(dashboardPathForRole("teacher")).toBe("/teacher");
    expect(dashboardPathForRole("student")).toBe("/dashboard");
    expect(dashboardPathForRole("user")).toBe("/dashboard");
  });
});
