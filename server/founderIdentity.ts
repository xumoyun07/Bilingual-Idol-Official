export const FOUNDER_EMAIL = "lektor@gmail.com";
export const ADDITIONAL_FOUNDER_EMAILS = [
  "tryingreal761@gmail.com",
  "founder@bilingualidol.com",
] as const;

export function isFounderEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (normalized === FOUNDER_EMAIL) return true;
  return ADDITIONAL_FOUNDER_EMAILS.some((additional) => additional.toLowerCase() === normalized);
}

export function shouldGrantFounderRole(input: { email?: string | null; openId: string; ownerOpenId?: string | null }) {
  if (input.ownerOpenId && input.openId === input.ownerOpenId) return true;
  if (input.openId && (input.openId.startsWith("founder:") || input.openId === `founder:${FOUNDER_EMAIL}`)) return true;
  return isFounderEmail(input.email);
}


