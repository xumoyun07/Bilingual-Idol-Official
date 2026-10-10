/**
 * Личность основателя. Ровно один адрес — FOUNDER_EMAIL.
 * Дополнительных «основательских» адресов нет: сравнение всегда
 * идёт с нормализованным (trim + lowercase) значением.
 */
export const FOUNDER_EMAIL = "lektor@bilc.my";

export function normalizeEmail(email?: string | null): string {
  return (email ?? "").trim().toLowerCase();
}

export function isFounderEmail(email?: string | null): boolean {
  if (!email) return false;
  return normalizeEmail(email) === FOUNDER_EMAIL;
}

export function shouldGrantFounderRole(input: { email?: string | null; openId: string; ownerOpenId?: string | null }) {
  if (input.ownerOpenId && input.openId === input.ownerOpenId) return true;
  if (input.openId === `founder:${FOUNDER_EMAIL}`) return true;
  return isFounderEmail(input.email);
}
