import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function createUserPasswordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyUserPasswordHash(password: string, value: string | null | undefined) {
  if (!value || password.length < 1) return false;
  const [algorithm, salt, digest] = value.split(":");
  if (algorithm !== "scrypt" || !salt || !/^[0-9a-f]{128}$/i.test(digest ?? "")) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(digest, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function dashboardPathForRole(role: string) {
  return ["admin", "super_admin", "founder"].includes(role) ? "/admin" : "/dashboard";
}
