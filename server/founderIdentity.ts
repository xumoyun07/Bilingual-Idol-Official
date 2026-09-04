export const FOUNDER_EMAIL = "lektor0780@gmail.com";
export const ADDITIONAL_FOUNDER_EMAILS = [
  "nurlanguageschool@gmail.com",
  "founder@bilingualidol.com",
] as const;

export function isFounderEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return normalized === FOUNDER_EMAIL || ADDITIONAL_FOUNDER_EMAILS.includes(normalized as any);
}

export function shouldGrantFounderRole(input: { email?: string | null; openId: string; ownerOpenId?: string | null }) {
  if (input.ownerOpenId && input.openId === input.ownerOpenId) return true;
  if (input.openId && input.openId.startsWith("founder:")) return true;
  return isFounderEmail(input.email);
}

