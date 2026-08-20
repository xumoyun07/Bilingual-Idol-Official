import { scryptSync, timingSafeEqual } from "node:crypto";
import { FOUNDER_EMAIL } from "./founderIdentity";

export const FOUNDER_OPEN_ID = `founder:${FOUNDER_EMAIL}`;

function hashParts() {
  const value = process.env.FOUNDER_PASSWORD_HASH;
  if (!value) return null;
  const [algorithm, salt, digest] = value.split(":");
  if (algorithm !== "scrypt" || !salt || !/^[0-9a-f]{128}$/i.test(digest ?? "")) return null;
  return { salt, digest };
}

export function isFounderAuthConfigured() {
  return Boolean(hashParts());
}

export function verifyFounderCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const parts = hashParts();
  if (normalizedEmail !== FOUNDER_EMAIL || !parts || password.length < 1) return false;
  const candidate = scryptSync(password, parts.salt, 64);
  const expected = Buffer.from(parts.digest, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}
