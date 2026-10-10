import { scryptSync, timingSafeEqual } from "node:crypto";
import { FOUNDER_EMAIL } from "./founderIdentity";

/**
 * Аутентификация основателя.
 *
 * Единственный источник истины — переменная окружения FOUNDER_PASSWORD_HASH
 * формата "scrypt:<salt>:<hex-дайджест>". Никаких паролей, хешей по умолчанию
 * и «принятых» строк в коде нет и быть не должно.
 *
 * Если переменная не задана или повреждена — проверка всегда возвращает false
 * (fail closed). Никакого резервного аккаунта не создаётся.
 */

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

/**
 * Пишет в лог факт отсутствия/повреждения хеша. Значения переменных
 * окружения не печатаются — только имена и булевы признаки.
 */
export function assertFounderAuthConfigured() {
  if (hashParts()) return true;
  const present = Boolean(process.env.FOUNDER_PASSWORD_HASH);
  console.error(
    "[founderAuth] FOUNDER_PASSWORD_HASH отсутствует или имеет неверный формат — вход основателя заблокирован. " +
      `Переменная задана: ${present}. Ожидается формат scrypt:<salt>:<64-байтовый hex>.`
  );
  return false;
}

export function verifyFounderCredentials(email: string, password: string) {
  const normalizedEmail = (email ?? "").trim().toLowerCase();
  // Единственная личность основателя — точное совпадение с FOUNDER_EMAIL.
  if (normalizedEmail !== FOUNDER_EMAIL) return false;
  if (typeof password !== "string" || password.length === 0) return false;

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
