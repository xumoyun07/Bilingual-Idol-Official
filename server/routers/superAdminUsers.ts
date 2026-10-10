import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { users as usersTable } from "../../drizzle/schema";
import * as db from "../db";
import { router, adminProcedure } from "../_core/trpc";
import * as audit from "../audit";
import { EmailProvider } from "../email";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";

const recentResets = new Map<number, number>();


const managedRole = z.enum(["student", "teacher", "marketing", "admin"]);
const profileValues = z.record(z.string().max(80), z.string().max(4000)).default({});
const createInput = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  nickname: z.string().trim().min(3).max(30).optional(),
  email: z.string().trim().max(320).optional(),
  password: z.string().min(10).max(256).optional(),
  role: managedRole.optional(),
  isActive: z.boolean().optional(),
  profileValues,
});
const updateInput = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(2).max(160),
  nickname: z.string().trim().min(3).max(30).optional(),
  email: z.string().trim().max(320).optional(),
  password: z.string().min(10).max(256).optional().or(z.literal("")),
  role: managedRole,
  isActive: z.boolean(),
});

function userError(error: unknown): never {
  const message = error instanceof Error ? error.message : "The account action could not be completed.";
  throw new TRPCError({ code: "BAD_REQUEST", message });
}

type AuditContext = { user: Pick<User, "id" | "role">; req: Request };
async function recordSuperAdminAudit(ctx: AuditContext, event: Omit<audit.AuditEventInput, "actor" | "request">) {
  try { await audit.writeAuditEvent({ ...event, actor: ctx.user, request: ctx.req }); } catch { audit.reportAuditFailure("superAdminUsers"); }
}

export const superAdminUsersRouter = router({
  list: adminProcedure.input(z.object({
    query: z.string().trim().max(160).optional(),
    role: z.enum(["user", "student", "teacher", "marketing", "admin"]).optional(),
    isActive: z.boolean().optional(),
    createdFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    createdTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    page: z.number().int().min(0).default(0),
    pageSize: z.number().int().min(1).max(100).default(25),
  })).query(async ({ ctx, input }) => {
    const isActorAdmin = ctx.user.role === "admin";
    if (isActorAdmin) {
      if (input.role && !["student", "teacher", "marketing"].includes(input.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admins are only permitted to manage student, teacher, or marketing accounts.",
        });
      }
    }
    const result = await db.listSuperAdminManagedUsers(input);
    if (isActorAdmin) {
      result.rows = result.rows.filter(r => ["student", "teacher", "marketing"].includes(r.role));
      result.total = result.rows.length;
    }
    return result;
  }),

  byId: adminProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const account = await db.getSuperAdminManagedUser(input.id);
    if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
    if (ctx.user.role === "admin" && !["student", "teacher", "marketing"].includes(account.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admins are only permitted to manage student, teacher, or marketing accounts.",
      });
    }
    return account;
  }),

  formSchema: adminProcedure.query(() => db.getUserFormSchema(false)),

  create: adminProcedure.input(createInput).mutation(async ({ ctx, input }) => {
    if (ctx.user.role === "admin") {
      if (input.role && !["student", "teacher", "marketing"].includes(input.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admins are only permitted to manage student, teacher, or marketing accounts.",
        });
      }
    }
    try {
      const result = await db.createSuperAdminManagedUser(input, ctx.user);
      await recordSuperAdminAudit(ctx, { action: "user.create", targetType: "user", targetId: result.id, targetRole: result.role, description: "Created a scoped managed user account.", metadata: { role: result.role, active: result.isActive } });
      return result;
    } catch (error) {
      await recordSuperAdminAudit(ctx, { action: "user.create", targetType: "user", targetRole: input.role ?? null, description: "Scoped managed user creation failed.", isSuccess: false, metadata: { reason: "operation_failed" } });
      return userError(error);
    }
  }),

  update: adminProcedure.input(updateInput).mutation(async ({ ctx, input }) => {
    const account = await db.getSuperAdminManagedUser(input.id);
    if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
    if (ctx.user.role === "admin") {
      if (!["student", "teacher", "marketing"].includes(account.role) || !["student", "teacher", "marketing"].includes(input.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admins are only permitted to manage student, teacher, or marketing accounts.",
        });
      }
    }
    try {
      const { id, password, ...profile } = input;
      const result = await db.updateSuperAdminManagedUser(id, { ...profile, password: password || undefined }, ctx.user);
      await recordSuperAdminAudit(ctx, { action: "user.update", targetType: "user", targetId: id, targetRole: result.role, description: "Updated a scoped managed user account.", metadata: { role: result.role, active: result.isActive } });
      return result;
    } catch (error) {
      await recordSuperAdminAudit(ctx, { action: "user.update", targetType: "user", targetId: input.id, targetRole: input.role, description: "Scoped managed user update failed.", isSuccess: false, metadata: { reason: "operation_failed" } });
      return userError(error);
    }
  }),

  remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const account = await db.getSuperAdminManagedUser(input.id);
    if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
    if (ctx.user.role === "admin" && !["student", "teacher", "marketing"].includes(account.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admins are only permitted to manage student, teacher, or marketing accounts.",
      });
    }
    try {
      const result = await db.deleteSuperAdminManagedUser(input.id, ctx.user);
      await recordSuperAdminAudit(ctx, { action: "user.delete", targetType: "user", targetId: input.id, description: "Deleted a scoped managed user account." });
      return result;
    } catch (error) {
      await recordSuperAdminAudit(ctx, { action: "user.delete", targetType: "user", targetId: input.id, description: "Scoped managed user deletion failed.", isSuccess: false, metadata: { reason: "operation_failed" } });
      return userError(error);
    }
  }),

  resetPassword: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    // 1. Fetch the real user row (email/passwordHash/role) directly from the schema table.
    const database = await db.getDb();
    let accountRow: typeof usersTable.$inferSelect | undefined;
    if (database) {
      accountRow = (await database.select().from(usersTable).where(eq(usersTable.id, input.id)).limit(1))[0];
    } else {
      accountRow = db.inMemoryStore.users.find(u => u.id === input.id) as typeof usersTable.$inferSelect | undefined;
    }
    
    if (!accountRow) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
    }

    if (accountRow.role === "founder") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Cannot reset the founder account." });
    }

    // 2. Enforce Role-Based Access Control (RBAC)
    if (ctx.user.role === "admin") {
      if (!["student", "teacher", "marketing"].includes(accountRow.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admins are only permitted to reset student, teacher, or marketing accounts.",
        });
      }
    }

    // 3. Prevent double-click or DoS via 30-second reset frequency rate limit per target
    const now = Date.now();
    const lastReset = recentResets.get(input.id);
    if (lastReset && now - lastReset < 30000) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Please wait 30 seconds before resetting this user's password again.",
      });
    }
    recentResets.set(input.id, now);

    // 4. Generate cryptographically strong temporary password OTP (>= 16 characters)
    const tempPassword = db.generateTemporaryPassword();
    const passwordHash = db.createUserPasswordHash(tempPassword);

    // 5. Atomic Update: passwordHash, sets isOtp = true, reset failedAttempts, increment sessionVersion
    //    Policy: resetting the founder account's password is forbidden.
    await db.resetUserPasswordAndSession(input.id, passwordHash, ctx.user);

    // 6. Record Audit Log (containing NO plain text passwords or hashes)
    await recordSuperAdminAudit(ctx, {
      action: "user.password_reset",
      targetType: "user",
      targetId: String(input.id),
      targetRole: accountRow.role,
      description: `Issued password reset and invalidated active sessions for account: ${accountRow.name || accountRow.email}.`,
      metadata: { targetUserId: input.id }
    });

    // 7. Deliver credentials to the user's communication email address
    const contactEmail = await db.getContactEmailForUser(input.id, accountRow.role, accountRow.email);
    if (contactEmail && contactEmail.includes("@")) {
      try {
        await EmailProvider.sendOtpEmail(contactEmail, accountRow.email ?? "", tempPassword, "en");
      } catch (err) {
        console.error("[Email] Failed to dispatch password reset email:", err);
      }
    }

    return { success: true, tempPassword };
  }),
});
