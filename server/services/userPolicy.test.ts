import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { inMemoryStore } from "../db";
import { FOUNDER_EMAIL } from "../founderIdentity";
import {
  DUPLICATE_EMAIL_MESSAGE,
  GENERIC_FOUNDER_MESSAGE,
  INVARIANT_MESSAGE,
  UserPolicyError,
  assertUserManagementEnabled,
  decideCreateUser,
  decideDeleteUser,
  decideFounderIdentity,
  decidePasswordReset,
  decideSeedFounder,
  decideUpdateUser,
  enforceCreateUser,
  enforceDeleteUser,
  enforceUpdateUser,
  inspectFounderInvariant,
  isFounderAccount,
  policyEmail,
  type PolicyUserRow,
} from "./userPolicy";

/**
 * Юнит-тесты политики учётных записей. Секретов в файле нет: адрес основателя
 * берётся из FOUNDER_EMAIL, пароли не используются вообще.
 */

const FOUNDER: PolicyUserRow = { id: 1, email: FOUNDER_EMAIL, role: "founder" };
const STUDENT: PolicyUserRow = { id: 2, email: "student@example.test", role: "student" };
const TEACHER: PolicyUserRow = { id: 3, email: "teacher@example.test", role: "teacher" };

const ORIGINAL_HASH = process.env.FOUNDER_PASSWORD_HASH;

function setStore(rows: Array<{ id: number; email: string | null; role: string }>) {
  inMemoryStore.users = rows.map(row => ({
    id: row.id,
    openId: `test:${row.id}`,
    name: `User ${row.id}`,
    email: row.email,
    passwordHash: null,
    role: row.role,
    isActive: true,
    loginMethod: "test",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    lastSignedIn: new Date("2026-01-01"),
    sessionVersion: 1,
    isOtp: false,
    otpCreatedAt: null,
    failedAttempts: 0,
  })) as never;
}

beforeEach(() => {
  setStore([FOUNDER]);
  delete process.env.FOUNDER_PASSWORD_HASH;
});

afterEach(() => {
  if (ORIGINAL_HASH === undefined) delete process.env.FOUNDER_PASSWORD_HASH;
  else process.env.FOUNDER_PASSWORD_HASH = ORIGINAL_HASH;
  setStore([]);
});

describe("userPolicy: нормализация и распознавание основателя", () => {
  it("1. приводит адрес к нижнему регистру и обрезает пробелы", () => {
    expect(policyEmail("  LEKTOR@BILC.MY ")).toBe(FOUNDER_EMAIL);
    expect(policyEmail(null)).toBe("");
    expect(policyEmail(undefined)).toBe("");
  });

  it("2. распознаёт основателя и по роли, и по адресу", () => {
    expect(isFounderAccount(FOUNDER)).toBe(true);
    expect(isFounderAccount({ id: 9, email: FOUNDER_EMAIL, role: "student" })).toBe(true);
    expect(isFounderAccount({ id: 9, email: "  LEKTOR@BILC.MY ", role: "admin" })).toBe(true);
    expect(isFounderAccount(STUDENT)).toBe(false);
    expect(isFounderAccount(null)).toBe(false);
  });
});

describe("userPolicy: создание учётной записи", () => {
  it("3. запрещает создание роли founder", () => {
    const decision = decideCreateUser({ role: "founder", email: "someone@example.test" });
    expect(decision).toEqual({ allowed: false, violation: "founder_is_unique", message: GENERIC_FOUNDER_MESSAGE });
  });

  it("4. запрещает любой адрес основателя", () => {
    for (const email of [FOUNDER_EMAIL, FOUNDER_EMAIL.toUpperCase(), `  ${FOUNDER_EMAIL}  `]) {
      expect(decideCreateUser({ role: "student", email })).toMatchObject({ allowed: false, violation: "founder_email_reserved" });
    }
  });

  it("5. запрещает дубликат адреса без учёта регистра", () => {
    expect(decideCreateUser({ role: "student", email: "Student@Example.Test", duplicate: STUDENT })).toEqual({
      allowed: false,
      violation: "duplicate_email",
      message: DUPLICATE_EMAIL_MESSAGE,
    });
  });

  it("6. разрешает обычную новую учётную запись", () => {
    expect(decideCreateUser({ role: "teacher", email: "new@example.test", duplicate: null })).toEqual({ allowed: true });
  });
});

describe("userPolicy: изменение учётной записи", () => {
  it("7. запрещает понижение основателя", () => {
    expect(decideUpdateUser({ target: FOUNDER, nextRole: "admin" })).toMatchObject({ allowed: false, violation: "founder_immutable" });
  });

  it("8. запрещает смену адреса основателя", () => {
    expect(decideUpdateUser({ target: FOUNDER, nextEmail: "other@example.test" })).toMatchObject({ allowed: false, violation: "founder_email_immutable" });
  });

  it("9. запрещает деактивацию и блокировку основателя", () => {
    expect(decideUpdateUser({ target: FOUNDER, nextIsActive: false })).toMatchObject({ allowed: false, violation: "founder_immutable" });
  });

  it("10. запрещает назначение роли founder сменой роли", () => {
    expect(decideUpdateUser({ target: STUDENT, nextRole: "founder" })).toMatchObject({ allowed: false, violation: "role_change_to_founder" });
  });

  it("11. запрещает выдать чужой учётной записи адрес основателя", () => {
    expect(decideUpdateUser({ target: STUDENT, nextEmail: ` ${FOUNDER_EMAIL.toUpperCase()} ` })).toMatchObject({
      allowed: false,
      violation: "founder_email_reserved",
    });
  });

  it("12. запрещает дубликат адреса при обновлении", () => {
    expect(decideUpdateUser({ target: TEACHER, nextEmail: STUDENT.email, duplicate: STUDENT })).toMatchObject({
      allowed: false,
      violation: "duplicate_email",
    });
  });

  it("13. разрешает обычное обновление, включая свой же адрес", () => {
    expect(decideUpdateUser({ target: TEACHER, nextRole: "teacher", nextEmail: TEACHER.email, nextIsActive: true })).toEqual({ allowed: true });
    expect(decideUpdateUser({ target: TEACHER, nextRole: "marketing", nextEmail: "new@example.test", duplicate: null })).toEqual({ allowed: true });
  });

  it("14. считает основателем строку по адресу, даже если роль уже испорчена", () => {
    expect(decideUpdateUser({ target: { id: 5, email: FOUNDER_EMAIL, role: "student" }, nextRole: "admin" })).toMatchObject({
      allowed: false,
      violation: "founder_immutable",
    });
  });
});

describe("userPolicy: удаление и сброс пароля", () => {
  it("15. запрещает удаление основателя", () => {
    expect(decideDeleteUser({ target: FOUNDER })).toMatchObject({ allowed: false, violation: "founder_immutable" });
    expect(decideDeleteUser({ target: { id: 5, email: FOUNDER_EMAIL, role: "student" } })).toMatchObject({ allowed: false, violation: "founder_immutable" });
  });

  it("16. разрешает удаление обычной учётной записи", () => {
    expect(decideDeleteUser({ target: STUDENT })).toEqual({ allowed: true });
  });

  it("17. запрещает сброс пароля основателя и разрешает для остальных", () => {
    expect(decidePasswordReset({ target: FOUNDER })).toMatchObject({ allowed: false, violation: "founder_immutable" });
    expect(decidePasswordReset({ target: STUDENT })).toEqual({ allowed: true });
  });
});

describe("userPolicy: личность основателя и сид", () => {
  it("18. роль founder выдаётся только точному адресу или его openId", () => {
    expect(decideFounderIdentity({ email: FOUNDER_EMAIL, openId: `founder:${FOUNDER_EMAIL}` })).toEqual({ allowed: true });
    expect(decideFounderIdentity({ email: FOUNDER_EMAIL.toUpperCase(), openId: `founder:${FOUNDER_EMAIL}` })).toEqual({ allowed: true });
    expect(decideFounderIdentity({ email: "attacker@example.test", openId: `founder:${FOUNDER_EMAIL}` })).toEqual({ allowed: true });
    expect(decideFounderIdentity({ email: "attacker@example.test", openId: "founder:attacker@example.test" })).toMatchObject({
      allowed: false,
      violation: "founder_email_reserved",
    });
    expect(decideFounderIdentity({ email: "plain@example.test", openId: "issued:abc" })).toEqual({ allowed: true });
  });

  it("19. сид разрешён только для FOUNDER_EMAIL и роли founder", () => {
    expect(decideSeedFounder({ email: FOUNDER_EMAIL, role: "founder" })).toEqual({ allowed: true });
    expect(decideSeedFounder({ email: FOUNDER_EMAIL, role: "admin" })).toMatchObject({ allowed: false, violation: "founder_is_unique" });
    expect(decideSeedFounder({ email: "other@example.test", role: "founder" })).toMatchObject({ allowed: false, violation: "founder_email_reserved" });
  });
});

describe("userPolicy: инвариант старта и fail closed", () => {
  it("20. инвариант соблюдён ровно при одной верной записи founder", async () => {
    setStore([FOUNDER]);
    await expect(inspectFounderInvariant()).resolves.toMatchObject({ ok: true, founderCount: 1, emailMatches: true });

    setStore([]);
    await expect(inspectFounderInvariant()).resolves.toMatchObject({ ok: false, founderCount: 0 });

    setStore([FOUNDER, { id: 7, email: "second@example.test", role: "founder" }]);
    await expect(inspectFounderInvariant()).resolves.toMatchObject({ ok: false, founderCount: 2 });

    setStore([{ id: 7, email: "wrong@example.test", role: "founder" }]);
    const report = await inspectFounderInvariant();
    expect(report.ok).toBe(false);
    expect(report.emailMatches).toBe(false);
  });

  it("21. при нарушенном инварианте мутации отклоняются с обезличенным сообщением", async () => {
    setStore([]);
    await expect(assertUserManagementEnabled({ path: "test" })).rejects.toThrow(INVARIANT_MESSAGE);
    await expect(enforceCreateUser({ path: "users.create" }, { role: "student", email: "new@example.test" })).rejects.toThrow(INVARIANT_MESSAGE);
    await expect(enforceUpdateUser({ path: "users.update" }, { targetId: 2, nextRole: "student" })).rejects.toThrow(INVARIANT_MESSAGE);
    await expect(enforceDeleteUser({ path: "users.remove" }, { targetId: 2 })).rejects.toThrow(INVARIANT_MESSAGE);
  });

  it("22. при соблюдённом инварианте обычные мутации проходят", async () => {
    setStore([FOUNDER, STUDENT]);
    await expect(assertUserManagementEnabled({ path: "test" })).resolves.toBeUndefined();
    await expect(enforceCreateUser({ path: "users.create" }, { role: "student", email: "one@example.test" })).resolves.toBeUndefined();
    await expect(enforceUpdateUser({ path: "users.update" }, { targetId: STUDENT.id, nextRole: "teacher", nextEmail: STUDENT.email })).resolves.toBeUndefined();
    await expect(enforceDeleteUser({ path: "users.remove" }, { targetId: STUDENT.id })).resolves.toBeUndefined();
  });

  it("23. бросает UserPolicyError с кодом нарушения", async () => {
    setStore([FOUNDER, STUDENT]);
    const error = await enforceDeleteUser({ path: "users.remove" }, { targetId: FOUNDER.id }).catch(e => e);
    expect(error).toBeInstanceOf(UserPolicyError);
    expect((error as UserPolicyError).violation).toBe("founder_immutable");
    expect((error as UserPolicyError).message).toBe(GENERIC_FOUNDER_MESSAGE);
  });

  it("24. создание основателя отклоняется и на уровне запрета", async () => {
    setStore([FOUNDER]);
    const error = await enforceCreateUser({ path: "users.create" }, { role: "founder", email: "x@example.test" }).catch(e => e);
    expect((error as UserPolicyError).violation).toBe("founder_is_unique");
  });
});
