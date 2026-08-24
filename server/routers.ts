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
import { dashboardPathForRole, verifyUserPasswordHash } from "./userAuth";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure.input(z.object({ email: z.string().email().max(320), password: z.string().min(1).max(256) })).mutation(async ({ ctx, input }) => {
      const email = input.email.trim().toLowerCase();
      if (isFounderAuthConfigured() && verifyFounderCredentials(email, input.password)) {
        await db.upsertUser({ openId: FOUNDER_OPEN_ID, name: "Founder", email: FOUNDER_EMAIL, loginMethod: "email_password", role: "founder", lastSignedIn: new Date() });
        const token = await sdk.createSessionToken(FOUNDER_OPEN_ID, { expiresInMs: ONE_YEAR_MS, name: "Founder" });
        ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
        return { success: true, redirectTo: "/admin", role: "founder" } as const;
      }
      const user = await db.getUserByEmail(email);
      if (!user?.isActive || !verifyUserPasswordHash(input.password, user.passwordHash)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid e-mail or password." });
      await db.recordUserSignIn(user.openId);
      const token = await sdk.createSessionToken(user.openId, { expiresInMs: ONE_YEAR_MS, name: user.name ?? email });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return { success: true, redirectTo: dashboardPathForRole(user.role), role: user.role } as const;
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
});

export type AppRouter = typeof appRouter;
