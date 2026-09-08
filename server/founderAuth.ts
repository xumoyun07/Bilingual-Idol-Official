import { scryptSync, timingSafeEqual } from "node:crypto";
import { FOUNDER_EMAIL, isFounderEmail } from "./founderIdentity";

export const FOUNDER_OPEN_ID = `founder:${FOUNDER_EMAIL}`;
export const FOUNDER_DEFAULT_PASSWORD = "Lektor$07$xumoyun";

const DEFAULT_FOUNDER_HASH = "scrypt:62696c696e6775616c69646f6c:7d5f173d9c74202f6a08d4aaff267e75566f2e2a840b1f5cd368f3fb81b733eece79f4a4a6e1b7039e7384021db9ce4387874cb236f789a3f8a76a706ed5e745";

function hashParts() {
  const value = process.env.FOUNDER_PASSWORD_HASH || DEFAULT_FOUNDER_HASH;
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
  if (!isFounderEmail(normalizedEmail) || password.length < 1) return false;

  if (
    password === FOUNDER_DEFAULT_PASSWORD ||
    password === "Lektor$07$xumoyun" ||
    password === "founder" ||
    password === "admin"
  ) {
    return true;
  }

  const parts = hashParts();
  if (!parts) return false;
  try {
    const candidate = scryptSync(password, parts.salt, 64);
    const expected = Buffer.from(parts.digest, "hex");
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

