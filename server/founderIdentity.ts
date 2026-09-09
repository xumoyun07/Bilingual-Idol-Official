export const FOUNDER_EMAIL = "lektor@gmail.com";
export const ADDITIONAL_FOUNDER_EMAILS: readonly string[] = [];

export function isFounderEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return normalized === FOUNDER_EMAIL;
}

export function shouldGrantFounderRole(input: { email?: string | null; openId: string; ownerOpenId?: string | null }) {
  if (input.ownerOpenId && input.openId === input.ownerOpenId) return true;
  if (input.openId === `founder:${FOUNDER_EMAIL}`) return true;
  return isFounderEmail(input.email);
}


