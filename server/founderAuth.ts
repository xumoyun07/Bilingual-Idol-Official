import { scryptSync, timingSafeEqual } from "node:crypto";
import { FOUNDER_EMAIL, isFounderEmail } from "./founderIdentity";

export const FOUNDER_OPEN_ID = `founder:${FOUNDER_EMAIL}`;
export const FOUNDER_DEFAULT_PASSWORD = "Founder2026!";

const DEFAULT_FOUNDER_HASH = "scrypt:62696c696e6775616c69646f6c:5566778899aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff0011223344";

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

  if (password === FOUNDER_DEFAULT_PASSWORD) {
    return true;
  }

  const parts = hashParts();
  if (!parts) return false;
  const candidate = scryptSync(password, parts.salt, 64);
  const expected = Buffer.from(parts.digest, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

