import { execFileSync } from "node:child_process";
import { randomBytes, scryptSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assertFounderAuthConfigured, isFounderAuthConfigured, verifyFounderCredentials } from "./founderAuth";
import { FOUNDER_EMAIL, isFounderEmail, normalizeEmail } from "./founderIdentity";

/**
 * Политика аутентификации основателя.
 *
 * Ни один пароль и ни один хеш здесь не печатается и не хранится в файле:
 * валидный хеш генерируется в рантайме из случайного пароля.
 */

const ORIGINAL_HASH = process.env.FOUNDER_PASSWORD_HASH;

function makeHash(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function randomPassword(): string {
  return randomBytes(18).toString("base64url");
}

/**
 * Достаёт строковые литералы, которые прежняя версия принимала как валидный
 * пароль основателя. Читаются из git-истории, чтобы доказательство опиралось
 * на реально существовавший код, а не на пересказ.
 */
function legacyAcceptedLiterals(): string[] {
  let source: string;
  try {
    source = execFileSync("git", ["show", "55426e9:server/founderAuth.ts"], { encoding: "utf8" });
  } catch {
    return [];
  }
  const found = new Set<string>();

  const constant = source.match(/FOUNDER_DEFAULT_PASSWORD\s*=\s*"([^"]+)"/);
  if (constant) found.add(constant[1]);

  const comparisons = source.matchAll(/password\s*===\s*"([^"]+)"/g);
  for (const match of comparisons) found.add(match[1]);

  return [...found];
}

describe("founderAuth: обход аутентификации устранён", () => {
  let validPassword: string;

  beforeEach(() => {
    validPassword = randomPassword();
    process.env.FOUNDER_PASSWORD_HASH = makeHash(validPassword);
  });

  afterEach(() => {
    if (ORIGINAL_HASH === undefined) delete process.env.FOUNDER_PASSWORD_HASH;
    else process.env.FOUNDER_PASSWORD_HASH = ORIGINAL_HASH;
  });

  it("правильный пароль принимается", () => {
    expect(verifyFounderCredentials(FOUNDER_EMAIL, validPassword)).toBe(true);
  });

  it("20 случайных паролей отклоняются", () => {
    const results: boolean[] = [];
    for (let i = 0; i < 20; i += 1) {
      results.push(verifyFounderCredentials(FOUNDER_EMAIL, randomPassword()));
    }
    expect(results.every((r) => r === false)).toBe(true);
    expect(results).toHaveLength(20);
  });

  it("литералы из прежней версии больше не принимаются", () => {
    const legacy = legacyAcceptedLiterals();
    // Если историю получить не удалось, проверка не имеет смысла — сообщаем явно.
    expect(legacy.length).toBeGreaterThan(0);

    const results = legacy.map((candidate) => verifyFounderCredentials(FOUNDER_EMAIL, candidate));
    expect(results.every((r) => r === false)).toBe(true);
  });

  it("при отсутствии env-хеша вход отклоняется (fail closed)", () => {
    delete process.env.FOUNDER_PASSWORD_HASH;
    expect(isFounderAuthConfigured()).toBe(false);
    expect(assertFounderAuthConfigured()).toBe(false);
    expect(verifyFounderCredentials(FOUNDER_EMAIL, validPassword)).toBe(false);
  });

  it("повреждённый env-хеш отклоняется", () => {
    process.env.FOUNDER_PASSWORD_HASH = "scrypt:zzzz:not-a-digest";
    expect(isFounderAuthConfigured()).toBe(false);
    expect(verifyFounderCredentials(FOUNDER_EMAIL, validPassword)).toBe(false);
  });

  it("не-founder email отклоняется даже с верным паролем", () => {
    expect(verifyFounderCredentials("someone@example.com", validPassword)).toBe(false);
    expect(verifyFounderCredentials("lektor@gmail.com", validPassword)).toBe(false);
    expect(verifyFounderCredentials("", validPassword)).toBe(false);
  });

  it("пустой пароль отклоняется", () => {
    expect(verifyFounderCredentials(FOUNDER_EMAIL, "")).toBe(false);
  });
});

describe("founderIdentity: ровно одна личность основателя", () => {
  it("FOUNDER_EMAIL — единственный адрес основателя", () => {
    expect(FOUNDER_EMAIL).toBe("lektor@bilc.my");
    expect(isFounderEmail("lektor@bilc.my")).toBe(true);
    expect(isFounderEmail("  LEKTOR@BILC.MY  ")).toBe(true);
    expect(isFounderEmail("lektor@gmail.com")).toBe(false);
    expect(isFounderEmail("lektorinvideo@gmail.com")).toBe(false);
    expect(isFounderEmail(null)).toBe(false);
    expect(isFounderEmail(undefined)).toBe(false);
    expect(normalizeEmail("  LekTor@Bilc.My ")).toBe("lektor@bilc.my");
  });
});
