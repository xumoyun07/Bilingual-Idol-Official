export const FOUNDER_EMAIL = "lektor0780@gmail.com";

export function shouldGrantFounderRole(input: { email?: string | null; openId: string; ownerOpenId?: string | null }) {
  if (input.ownerOpenId && input.openId === input.ownerOpenId) return true;
  return input.email?.trim().toLowerCase() === FOUNDER_EMAIL;
}
