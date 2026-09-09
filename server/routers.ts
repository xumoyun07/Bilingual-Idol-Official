import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { FOUNDER_OPEN_ID, isFounderAuthConfigured, verifyFounderCredentials } from "./founderAuth";
import { FOUNDER_EMAIL } from "./founderIdentity";
import { contentRouter } from "./routers/content";
import { submissionsRouter } from "./routers/submissions";
import { superAdminUsersRouter } from "./routers/superAdminUsers";
import { auditRouter } from "./routers/audit";
import { studentsRouter } from "./routers/students";
import { usersRouter } from "./routers/users";
import { mediaRouter } from "./routers/media";
import { newsRouter } from "./routers/news";
import { teacherRouter } from "./routers/teacher";
import { studentAttendanceRouter } from "./routers/studentAttendance";
import { marketingRouter } from "./routers/marketing";
import { translationRouter } from "./routers/translation";
import { createUserPasswordHash, dashboardPathForRole, verifyUserPasswordHash } from "./userAuth";
import { isFounderEmail } from "./founderIdentity";
import { resolveLoginIdentifier } from "../shared/nickname";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure.input(z.object({ email: z.string().trim().min(1, "Enter your nickname@bilc.my address or nickname.").max(320), password: z.string().min(1).max(256) })).mutation(async ({ ctx, input }) => {
      const raw = input.email.trim().toLowerCase();
      const resolvedEmail = resolveLoginIdentifier(raw);

      if (isFounderEmail(raw) || isFounderEmail(resolvedEmail)) {
        const founderEmail = isFounderEmail(raw) ? raw : resolvedEmail;
        if (verifyFounderCredentials(founderEmail, input.password)) {
          const openId = `founder:${founderEmail}`;
          await db.upsertUser({ openId, name: "Founder", email: founderEmail, passwordHash: createUserPasswordHash(input.password), loginMethod: "email_password", role: "founder", lastSignedIn: new Date() });
          const token = await sdk.createSessionToken(openId, { expiresInMs: ONE_YEAR_MS, name: "Founder" });
          ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
          return { success: true, redirectTo: "/admin", role: "founder", token } as const;
        }
        const existing = await db.getUserByEmail(founderEmail);
        if (existing?.isActive && verifyUserPasswordHash(input.password, existing.passwordHash)) {
          await db.recordUserSignIn(existing.openId);
          const token = await sdk.createSessionToken(existing.openId, { expiresInMs: ONE_YEAR_MS, name: existing.name ?? "Founder" });
          ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
          return { success: true, redirectTo: "/admin", role: "founder", token } as const;
        }
      }

      let user = await db.getUserByEmail(resolvedEmail);
      if (!user && raw !== resolvedEmail) {
        user = await db.getUserByEmail(raw);
      }

      if (!user?.isActive || !verifyUserPasswordHash(input.password, user.passwordHash)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid nickname@bilc.my login or password." });
      }

      await db.recordUserSignIn(user.openId);
      const token = await sdk.createSessionToken(user.openId, { expiresInMs: ONE_YEAR_MS, name: user.name ?? user.email ?? resolvedEmail });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return { success: true, redirectTo: dashboardPathForRole(user.role), role: user.role, token } as const;
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
  media: mediaRouter,
  news: newsRouter,
  teacher: teacherRouter,
  studentAttendance: studentAttendanceRouter,
  marketing: marketingRouter,
  translation: translationRouter,
});

export type AppRouter = typeof appRouter;
