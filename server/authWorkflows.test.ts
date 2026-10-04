import { describe, expect, it, beforeEach } from "vitest";
import { generateUniqueUserLogin, transliterate, inMemoryStore, getUserByEmail, resetUserPasswordAndSession } from "./db";
import { verifyUserPasswordHash, createUserPasswordHash } from "./userAuth";
import { appRouter } from "./routers";
import { createSessionToken, authenticateRequest } from "./_core/sdk";

describe("BILC Secure Auth Workflows", () => {
  beforeEach(() => {
    // Reset in-memory users list to standard fallback
    inMemoryStore.users = [
      {
        id: 1,
        openId: "founder:lektor@gmail.com",
        name: "Founder",
        email: "lektor@gmail.com",
        passwordHash: createUserPasswordHash("Lektor$07$xumoyun"),
        role: "founder" as const,
        isActive: true,
        loginMethod: "email_password",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
        lastSignedIn: new Date("2026-01-01"),
        failedAttempts: 0,
        sessionVersion: 1,
        isOtp: false,
      },
      {
        id: 2,
        openId: "issued:superadmin",
        name: "Super Admin",
        email: "superadmin@bilc.my",
        passwordHash: createUserPasswordHash("lektor07xumoyun"),
        role: "super_admin" as const,
        isActive: true,
        loginMethod: "issued_by_founder",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
        lastSignedIn: new Date("2026-01-01"),
        failedAttempts: 0,
        sessionVersion: 1,
        isOtp: false,
      },
    ] as any[];
    inMemoryStore.studentProfiles = [];
    inMemoryStore.enrollments = [];
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
      // Add first user directly
      inMemoryStore.users.push({
        id: 10,
        openId: "issued:alex_1",
        name: "Aleksey Petrov",
        email: "alekseypetrov102026@bilc.my",
        passwordHash: createUserPasswordHash("some-password"),
        role: "student",
        isActive: true,
        createdAt: creationDate,
        updatedAt: creationDate,
        lastSignedIn: creationDate,
        failedAttempts: 0,
        sessionVersion: 1,
        isOtp: false,
      } as any);

      // Generate for same name and date, should get suffix _1
      const email2 = await generateUniqueUserLogin("Алексей Петров", creationDate);
      expect(email2).toBe("alekseypetrov102026_1@bilc.my");
    });
  });

  describe("2. OTP Atomic Burn & deactivation", () => {
    it("locks account after 5 incorrect password attempts", async () => {
      // Create user with OTP password
      const userEmail = "alex102026@bilc.my";
      const otp = "tempOTP123";
      inMemoryStore.users.push({
        id: 20,
        openId: "issued:alex_otp",
        name: "Alex",
        email: userEmail,
        passwordHash: createUserPasswordHash(otp),
        role: "student",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        failedAttempts: 0,
        sessionVersion: 1,
        isOtp: true,
        otpCreatedAt: new Date(),
      } as any);

      const caller = appRouter.createCaller({
        user: null,
        req: { headers: {}, protocol: "http" } as any,
        res: {
          cookie: () => {},
          clearCookie: () => {},
        } as any,
      });

      // 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await expect(caller.auth.login({ email: userEmail, password: "wrong-password" }))
          .rejects.toThrow();
      }

      // 6th attempt with correct password should be locked
      await expect(caller.auth.login({ email: userEmail, password: otp }))
        .rejects.toThrow("This account is temporarily locked");
    });

    it("atomically burns OTP upon successful login", async () => {
      const userEmail = "alex102026@bilc.my";
      const otp = "tempOTP123";
      inMemoryStore.users.push({
        id: 20,
        openId: "issued:alex_otp",
        name: "Alex",
        email: userEmail,
        passwordHash: createUserPasswordHash(otp),
        role: "student",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        failedAttempts: 0,
        sessionVersion: 1,
        isOtp: true,
        otpCreatedAt: new Date(),
      } as any);

      const caller = appRouter.createCaller({
        user: null,
        req: { headers: {}, protocol: "http" } as any,
        res: {
          cookie: () => {},
          clearCookie: () => {},
        } as any,
      });

      // First login with OTP is successful
      const response = await caller.auth.login({ email: userEmail, password: otp });
      expect(response.success).toBe(true);
      expect(response.isRestricted).toBe(true);

      // Verify OTP is burned in database/inMemoryStore
      const updatedUser = await getUserByEmail(userEmail);
      expect(updatedUser?.isOtp).toBe(false);
      expect(updatedUser?.passwordHash).toBeNull();

      // Second attempt to login with the same OTP fails
      await expect(caller.auth.login({ email: userEmail, password: otp }))
        .rejects.toThrow("Invalid login or password.");
    });
  });

  describe("3. Expiration limits", () => {
    it("rejects OTP if older than 7 days", async () => {
      const userEmail = "expired102026@bilc.my";
      const otp = "tempOTP123";
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      inMemoryStore.users.push({
        id: 30,
        openId: "issued:expired",
        name: "Expired User",
        email: userEmail,
        passwordHash: createUserPasswordHash(otp),
        role: "student",
        isActive: true,
        createdAt: eightDaysAgo,
        updatedAt: eightDaysAgo,
        lastSignedIn: eightDaysAgo,
        failedAttempts: 0,
        sessionVersion: 1,
        isOtp: true,
        otpCreatedAt: eightDaysAgo,
      } as any);

      const caller = appRouter.createCaller({
        user: null,
        req: { headers: {}, protocol: "http" } as any,
        res: {
          cookie: () => {},
          clearCookie: () => {},
        } as any,
      });

      await expect(caller.auth.login({ email: userEmail, password: otp }))
        .rejects.toThrow("This temporary password has expired");
    });
  });

  describe("4. Administrative Password Reset", () => {
    it("increments sessionVersion to invalidate other active sessions and flags as OTP", async () => {
      const studentId = 40;
      inMemoryStore.users.push({
        id: studentId,
        openId: "issued:student40",
        name: "Student 40",
        email: "student40@bilc.my",
        passwordHash: createUserPasswordHash("permanent123"),
        role: "student",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        failedAttempts: 0,
        sessionVersion: 1,
        isOtp: false,
      } as any);

      // Perform admin password reset
      const newHash = createUserPasswordHash("newTempOTP");
      await resetUserPasswordAndSession(studentId, newHash);

      const updatedUser = inMemoryStore.users.find(u => u.id === studentId);
      expect(updatedUser?.sessionVersion).toBe(2);
      expect(updatedUser?.isOtp).toBe(true);
      expect(updatedUser?.failedAttempts).toBe(0);
    });
  });
});
