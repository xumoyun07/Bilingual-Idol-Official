export const BILC_DOMAIN = "bilc.my";
export const NICKNAME_MIN_LENGTH = 3;
export const NICKNAME_MAX_LENGTH = 30;

// Allowed characters: Latin letters, numbers, dots, underscores, hyphens
export const NICKNAME_REGEX = /^[a-zA-Z0-9._-]+$/;

export type NicknameValidationResult = {
  valid: boolean;
  error?: string;
  normalised: string;
};

export function validateNickname(nickname: unknown): NicknameValidationResult {
  if (typeof nickname !== "string") {
    return { valid: false, error: "Nickname must be a string.", normalised: "" };
  }

  const trimmed = nickname.trim();

  if (!trimmed) {
    return { valid: false, error: "Nickname is required.", normalised: "" };
  }

  if (trimmed.length < NICKNAME_MIN_LENGTH) {
    return {
      valid: false,
      error: `Nickname must be at least ${NICKNAME_MIN_LENGTH} characters long.`,
      normalised: "",
    };
  }

  if (trimmed.length > NICKNAME_MAX_LENGTH) {
    return {
      valid: false,
      error: `Nickname cannot exceed ${NICKNAME_MAX_LENGTH} characters.`,
      normalised: "",
    };
  }

  if (!NICKNAME_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: "Nickname may only contain letters, numbers, dots, underscores, and hyphens.",
      normalised: "",
    };
  }

  if (!/[a-zA-Z0-9]/.test(trimmed)) {
    return {
      valid: false,
      error: "Nickname must contain at least one letter or number.",
      normalised: "",
    };
  }

  return {
    valid: true,
    normalised: trimmed.toLowerCase(),
  };
}

/**
 * Generates the official BILC login email from a nickname:
 * e.g. "alex" -> "alex@bilc.my"
 */
export function generateBilcEmail(nickname: string): string {
  const { normalised } = validateNickname(nickname);
  const base = normalised || nickname.trim().toLowerCase();
  return `${base}@${BILC_DOMAIN}`;
}

/**
 * Resolves a login identifier: if it doesn't contain an '@', treats it as a nickname and appends @bilc.my
 */
export function resolveLoginIdentifier(identifier: string): string {
  const trimmed = identifier.trim().toLowerCase();
  if (!trimmed.includes("@")) {
    return `${trimmed}@${BILC_DOMAIN}`;
  }
  return trimmed;
}
