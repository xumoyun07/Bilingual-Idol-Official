import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { users as usersTable, userProfileValues as userProfileValuesTable } from "../drizzle/schema";
import * as audit from "./audit";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { FOUNDER_OPEN_ID, isFounderAuthConfigured, verifyFounderCredentials } from "./founderAuth";
import { FOUNDER_EMAIL } from "./founderIdentity";
import { enforceUpdateUser } from "./services/userPolicy";
import { contentRouter } from "./routers/content";
import { submissionsRouter } from "./routers/submissions";
import { superAdminUsersRouter } from "./routers/superAdminUsers";
import { auditRouter } from "./routers/audit";
import { studentsRouter } from "./routers/students";
import { usersRouter } from "./routers/users";
import { pricesRouter } from "./routers/prices";
import { applicationsRouter } from "./routers/applications";
import { studentCabinetRouter } from "./routers/studentCabinet";
import { mediaRouter } from "./routers/media";
import { newsRouter } from "./routers/news";
import { teacherRouter } from "./routers/teacher";
import { studentAttendanceRouter } from "./routers/studentAttendance";
import { marketingRouter } from "./routers/marketing";
import { translationRouter } from "./routers/translation";
import { registrationSubmissionsRouter } from "./routers/registrationSubmissions";
import { registrationRouter } from "./routers/registration";
import { placementTestsRouter } from "./routers/placementTests";
import { promotionsRouter } from "./routers/promotions";
import { paymentsRouter } from "./routers/payments";
import { enrollmentsRouter } from "./routers/enrollments";
import { createUserPasswordHash, dashboardPathForRole, verifyUserPasswordHash } from "./userAuth";
import { isFounderEmail } from "./founderIdentity";
import { resolveLoginIdentifier } from "../shared/nickname";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure.input(z.object({
      email: z.string().trim().min(1, "Enter your nickname@bilc.my address, nickname, or login.").max(320),
      password: z.string().min(1).max(256),
      rememberMe: z.boolean().optional().default(false)
    })).mutation(async ({ ctx, input }) => {
      const raw = input.email.trim().toLowerCase();
      const resolvedEmail = resolveLoginIdentifier(raw);

      // Handle Founder Login explicitly
      if (isFounderEmail(raw) || isFounderEmail(resolvedEmail)) {
        const founderEmail = isFounderEmail(raw) ? raw : resolvedEmail;
        if (verifyFounderCredentials(founderEmail, input.password)) {
          const openId = `founder:${founderEmail}`;
          // upsertUser применяет политику: роль founder выдаётся только точному FOUNDER_EMAIL.
          await db.upsertUser({ openId, name: "Founder", email: founderEmail, passwordHash: createUserPasswordHash(input.password), loginMethod: "email_password", role: "founder", lastSignedIn: new Date() });
          const token = await sdk.createSessionToken(openId, { expiresInMs: ONE_YEAR_MS, name: "Founder" });
          ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
          return { success: true, redirectTo: "/founder", role: "founder", token } as const;
        }
        const existing = await db.getUserByEmail(founderEmail);
        if (existing?.isActive && verifyUserPasswordHash(input.password, existing.passwordHash)) {
          await db.recordUserSignIn(existing.openId);
          const token = await sdk.createSessionToken(existing.openId, { expiresInMs: ONE_YEAR_MS, name: existing.name ?? "Founder" });
          ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
          return { success: true, redirectTo: "/founder", role: "founder", token } as const;
        }
      }

      // 1. Retrieve User Row
      let user = await db.getUserByEmail(resolvedEmail);
      if (!user && raw !== resolvedEmail) {
        user = await db.getUserByEmail(raw);
      }

      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid login or password." });
      }

      if (!user.isActive) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "This account has been deactivated." });
      }

      // 2. Brute-Force lockout check (5 sequential failures lock account for 15 minutes)
      const lockTime = 15 * 60 * 1000;
      if (user.failedAttempts >= 5) {
        const timePassed = Date.now() - user.updatedAt.getTime();
        if (timePassed < lockTime) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "This account is temporarily locked due to 5 consecutive failed login attempts. Please try again in 15 minutes."
          });
        }
      }

      // 3. Verify Password Hash using scrypt
      const isPasswordCorrect = verifyUserPasswordHash(input.password, user.passwordHash);

      if (!isPasswordCorrect) {
        // Increment failed attempts sequentially in DB
        await db.incrementFailedAttempts(user.id);
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid login or password." });
      }

      // 4. Handle Successful Login
      if (user.isOtp) {
        // Check temporary OTP 7-day expiration limit
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        const otpCreatedAtTime = user.otpCreatedAt ? user.otpCreatedAt.getTime() : user.createdAt.getTime();
        if (Date.now() - otpCreatedAtTime > sevenDays) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "This temporary password has expired (7-day validity exceeded). Please contact support to request a password reset."
          });
        }

        // ATOMIC BURN: OTP used once successfully is immediately deactivated/burned in the DB/inMemoryStore
        await db.burnOtp(user.id);

        // Generate restricted onboarding token with maximum 24 hours validity
        const restrictedTokenLifespan = 24 * 60 * 60 * 1000;
        const token = await sdk.createSessionToken(user.openId, {
          expiresInMs: restrictedTokenLifespan,
          name: user.name ?? undefined,
          sessionVersion: user.sessionVersion,
          isRestricted: true,
        });

        // Restricted cookies lifespan policy
        if (input.rememberMe) {
          // If "Remember Me" is checked: Set with 24 hours maxAge
          ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: restrictedTokenLifespan });
        } else {
          // If "Remember Me" is unchecked: Set as a session cookie (no maxAge), deleted when browser is closed
          ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req) });
        }

        return {
          success: true,
          redirectTo: "/first-login", // Direct student directly to onboarding/Stage B complete page
          role: user.role,
          token,
          isRestricted: true
        };
      }

      // Standard Unrestricted Login (1 year validity)
      await db.resetFailedAttempts(user.id);
      const token = await sdk.createSessionToken(user.openId, {
        expiresInMs: ONE_YEAR_MS,
        name: user.name ?? undefined,
        sessionVersion: user.sessionVersion,
      });

      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return {
        success: true,
        redirectTo: dashboardPathForRole(user.role),
        role: user.role,
        token,
        isRestricted: false
      };
    }),

    completeOnboarding: publicProcedure.input(z.object({
      password: z.string().min(10, "Use at least 10 characters for the permanent password.").max(256),
      profileValues: z.record(z.string(), z.string()).optional().default({}),
    })).mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be signed in to complete onboarding." });
      }
      if (!(ctx.user as any).isRestricted) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Onboarding can only be completed from a restricted OTP session." });
      }

      const userId = ctx.user.id;
      const database = await db.getDb();
      const newHash = createUserPasswordHash(input.password);

      // Политика учётных записей: онбординг не меняет роль и адрес, но проходит
      // через ту же проверку, что и любое обновление пользователя.
      await enforceUpdateUser(
        { path: "auth.completeOnboarding", actor: { id: ctx.user.id, role: ctx.user.role } },
        { targetId: userId, nextRole: ctx.user.role, nextEmail: ctx.user.email },
      );

      // Validate Stage B (atFirstLogin) dynamic profile fields
      const { fields } = await db.getUserFormSchema(false);
      const stageBFields = fields.filter(f => f.collectionStage === "atFirstLogin");
      const validatedValues = db.validateProfileValues(stageBFields, input.profileValues);
      
      const profileRows = Object.entries(validatedValues).map(([fieldId, value]) => ({
        userId,
        fieldId: Number(fieldId),
        value,
      }));

      // Increment session version to instantly revoke all other active/stale restricted sessions
      const newSessionVersion = (ctx.user.sessionVersion || 1) + 1;

      if (database) {
        await database.transaction(async tx => {
          await tx.update(usersTable).set({
            passwordHash: newHash,
            isOtp: false,
            otpCreatedAt: null,
            failedAttempts: 0,
            sessionVersion: newSessionVersion,
            loginMethod: "completed_onboarding",
            updatedAt: new Date(),
          }).where(eq(usersTable.id, userId));

          if (profileRows.length) {
            for (const row of profileRows) {
              await tx.insert(userProfileValuesTable).values({
                userId,
                fieldId: row.fieldId,
                value: row.value,
              }).onDuplicateKeyUpdate({
                set: { value: row.value, updatedAt: new Date() }
              });
            }
          }
        });
      } else {
        // Fallback for inMemoryStore
        const user = db.inMemoryStore.users.find(u => u.id === userId);
        if (user) {
          user.passwordHash = newHash;
          user.isOtp = false;
          user.otpCreatedAt = null;
          user.failedAttempts = 0;
          user.sessionVersion = newSessionVersion;
          user.loginMethod = "completed_onboarding";
          user.updatedAt = new Date();
        }

        db.inMemoryStore.userProfileValues = db.inMemoryStore.userProfileValues || [];
        for (const row of profileRows) {
          const existingIdx = db.inMemoryStore.userProfileValues.findIndex(p => p.userId === userId && p.fieldId === row.fieldId);
          if (existingIdx !== -1) {
            db.inMemoryStore.userProfileValues[existingIdx].value = row.value;
          } else {
            db.inMemoryStore.userProfileValues.push({
              userId,
              fieldId: row.fieldId,
              value: row.value,
            } as any);
          }
        }
      }

      // Record Audit Log (containing NO plain text passwords)
      try {
        await audit.writeAuditEvent({
          action: "user.complete_onboarding",
          targetType: "user",
          targetId: String(userId),
          targetRole: ctx.user.role,
          description: `Completed onboarding profile registration (Stage B) and set permanent password.`,
          actor: ctx.user,
          request: ctx.req,
        });
      } catch {
        // Сбой аудита не должен раскрывать содержимое события и не должен
        // проглатываться молча — пишем факт без значений.
        audit.reportAuditFailure("auth.completeOnboarding");
      }

      // Generate standard unrestricted session token
      const token = await sdk.createSessionToken(ctx.user.openId, {
        expiresInMs: ONE_YEAR_MS,
        name: ctx.user.name || undefined,
        sessionVersion: newSessionVersion,
      });

      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });

      return {
        success: true,
        redirectTo: dashboardPathForRole(ctx.user.role),
        role: ctx.user.role,
        token,
      };
    }),

    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  content: contentRouter,
  submissions: submissionsRouter,
  superAdminUsers: superAdminUsersRouter,
  audit: auditRouter,
  students: studentsRouter,
  users: usersRouter,
  prices: pricesRouter,
  applications: applicationsRouter,
  studentCabinet: studentCabinetRouter,
  media: mediaRouter,
  news: newsRouter,
  teacher: teacherRouter,
  studentAttendance: studentAttendanceRouter,
  marketing: marketingRouter,
  translation: translationRouter,
  registrationSubmissions: registrationSubmissionsRouter,
  registration: registrationRouter,
  placementTests: placementTestsRouter,
  promotions: promotionsRouter,
  payments: paymentsRouter,
  enrollments: enrollmentsRouter,
});

export type AppRouter = typeof appRouter;
