import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { generateUniqueUserLogin, getUserByEmail, inMemoryStore, resetUserPasswordAndSession, transliterate } from "./db";
import { createUserPasswordHash } from "./userAuth";
import { appRouter } from "./routers";
import { FOUNDER_EMAIL } from "./founderIdentity";
import { createTestAccounts, type TestAccounts } from "./testing/accounts";

/**
 * Пароли в этом файле генерируются в рантайме: литералов секретов нет.
 * Учётные записи для сквозных проверок входа выдаёт общий helper
 * server/testing/accounts.ts.
 */

function runtimePassword(): string {
  return randomBytes(18).toString("base64url");
}

function anonymousCaller() {
  return appRouter.createCaller({
    user: null,
    req: { headers: {}, protocol: "http" } as any,
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as any,
  });
}

type CraftedUser = {
  id: number;
  email: string;
  password: string;
  role?: "student" | "teacher";
  isOtp?: boolean;
  otpCreatedAt?: Date | null;
  createdAt?: Date;
};

function pushUser(user: CraftedUser) {
  const createdAt = user.createdAt ?? new Date();
  inMemoryStore.users.push({
    id: user.id,
    openId: `issued:crafted-${user.id}`,
    name: `Crafted ${user.id}`,
    email: user.email,
    passwordHash: createUserPasswordHash(user.password),
    role: user.role ?? "student",
    isActive: true,
    createdAt,
    updatedAt: createdAt,
    lastSignedIn: createdAt,
    failedAttempts: 0,
    sessionVersion: 1,
    isOtp: user.isOtp ?? false,
    otpCreatedAt: user.otpCreatedAt ?? null,
  } as any);
}

describe("BILC Secure Auth Workflows", () => {
  beforeEach(() => {
    // Пустое хранилище: каждый тест создаёт ровно те учётные записи, которые ему нужны.
    inMemoryStore.users = [];
    inMemoryStore.studentProfiles = [];
    inMemoryStore.enrollments = [];
    // Инвариант политики: ровно одна учётная запись founder, как в продакшене.
    // Без неё управление пользователями закрыто (fail closed).
    inMemoryStore.users.push({
      id: 1,
      openId: `founder:${FOUNDER_EMAIL}`,
      name: "Founder",
      email: FOUNDER_EMAIL,
      passwordHash: null,
      role: "founder",
      isActive: true,
      loginMethod: "email_password",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
      lastSignedIn: new Date("2026-01-01"),
      sessionVersion: 1,
      isOtp: false,
      otpCreatedAt: null,
      failedAttempts: 0,
    } as any);
  });

  describe("1. Login Generation & Transliteration", () => {
    it("correctly transliterates Cyrillic names and filters non-alphanumeric chars", () => {
      expect(transliterate("Иван Сидоров")).toBe("Ivan Sidorov");
      expect(transliterate("Али")).toBe("Ali");
    });

    it("generates correct format nameMMYYYY@bilc.my based on creation date", async () => {
      const creationDate = new Date("2026-10-04T12:00:00.000Z"); // Oct 2026
      const email = await generateUniqueUserLogin("Алексей Петров", creationDate);
      expect(email).toBe("alekseypetrov102026@bilc.my");
    });

    it("resolves uniqueness collision using sequential suffixes", async () => {
      const creationDate = new Date("2026-10-04T12:00:00.000Z");
      pushUser({ id: 10, email: "alekseypetrov102026@bilc.my", password: runtimePassword(), createdAt: creationDate });

      // Generate for same name and date, should get suffix _1
      const email2 = await generateUniqueUserLogin("Алексей Петров", creationDate);
      expect(email2).toBe("alekseypetrov102026_1@bilc.my");
    });
  });

  describe("2. OTP Atomic Burn & deactivation", () => {
    it("locks account after 5 incorrect password attempts", async () => {
      const userEmail = "alex102026@bilc.my";
      const otp = runtimePassword();
      pushUser({ id: 20, email: userEmail, password: otp, isOtp: true, otpCreatedAt: new Date() });

      const caller = anonymousCaller();

      // 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await expect(caller.auth.login({ email: userEmail, password: runtimePassword() })).rejects.toThrow();
      }

      // 6th attempt with correct password should be locked
      await expect(caller.auth.login({ email: userEmail, password: otp })).rejects.toThrow(
        "This account is temporarily locked",
      );
    });

    it("atomically burns OTP upon successful login", async () => {
      const userEmail = "alex102026@bilc.my";
      const otp = runtimePassword();
      pushUser({ id: 20, email: userEmail, password: otp, isOtp: true, otpCreatedAt: new Date() });

      const caller = anonymousCaller();

      // First login with OTP is successful
      const response = await caller.auth.login({ email: userEmail, password: otp });
      expect(response.success).toBe(true);
      expect(response.isRestricted).toBe(true);

      // Verify OTP is burned in database/inMemoryStore
      const updatedUser = await getUserByEmail(userEmail);
      expect(updatedUser?.isOtp).toBe(false);
      expect(updatedUser?.passwordHash).toBeNull();

      // Second attempt to login with the same OTP fails
      await expect(caller.auth.login({ email: userEmail, password: otp })).rejects.toThrow("Invalid login or password.");
    });
  });

  describe("3. Expiration limits", () => {
    it("rejects OTP if older than 7 days", async () => {
      const userEmail = "expired102026@bilc.my";
      const otp = runtimePassword();
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      pushUser({ id: 30, email: userEmail, password: otp, isOtp: true, otpCreatedAt: eightDaysAgo, createdAt: eightDaysAgo });

      await expect(anonymousCaller().auth.login({ email: userEmail, password: otp })).rejects.toThrow(
        "This temporary password has expired",
      );
    });
  });

  describe("4. Administrative Password Reset", () => {
    it("increments sessionVersion to invalidate other active sessions and flags as OTP", async () => {
      const studentId = 40;
      pushUser({ id: studentId, email: "student40@bilc.my", password: runtimePassword() });

      // Perform admin password reset
      const newHash = createUserPasswordHash(runtimePassword());
      await resetUserPasswordAndSession(studentId, newHash);

      const updatedUser = inMemoryStore.users.find(u => u.id === studentId);
      expect(updatedUser?.sessionVersion).toBe(2);
      expect(updatedUser?.isOtp).toBe(true);
      expect(updatedUser?.failedAttempts).toBe(0);
    });
  });

  describe("5. Accounts issued through the real API", () => {
    let accounts: TestAccounts | null = null;

    afterEach(async () => {
      if (accounts) {
        await accounts.cleanup();
        accounts = null;
      }
    });

    it("signs in every managed role with credentials generated at runtime", async () => {
      accounts = await createTestAccounts();

      for (const role of ["super_admin", "admin", "marketing", "teacher", "student"] as const) {
        const session = await accounts.login(role);
        expect(session.user.role, `роль сессии для ${role}`).toBe(role);
        expect(session.user.email).toBe(accounts.get(role).email);
        expect(session.user.isActive).toBe(true);
      }

      const founderSession = await accounts.login("founder");
      expect(founderSession.user.role).toBe("founder");
      expect(founderSession.user.email).toBe("lektor@bilc.my");
    }, 60_000);
  });
});
