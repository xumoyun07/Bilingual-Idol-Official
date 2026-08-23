import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { router, superAdminProcedure } from "../_core/trpc";

const managedRole = z.enum(["student", "teacher", "marketing", "admin"]);
const profileValues = z.record(z.string().max(80), z.string().max(4000)).default({});
const createInput = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  email: z.string().trim().email().max(320).optional(),
  password: z.string().min(10).max(256).optional(),
  role: managedRole.optional(),
  isActive: z.boolean().optional(),
  profileValues,
});
const updateInput = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  password: z.string().min(10).max(256).optional().or(z.literal("")),
  role: managedRole,
  isActive: z.boolean(),
});

function userError(error: unknown): never {
  const message = error instanceof Error ? error.message : "The account action could not be completed.";
  throw new TRPCError({ code: "BAD_REQUEST", message });
}

export const superAdminUsersRouter = router({
  list: superAdminProcedure.input(z.object({
    query: z.string().trim().max(160).optional(),
    role: z.enum(["user", "student", "teacher", "marketing", "admin"]).optional(),
    isActive: z.boolean().optional(),
    createdFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    createdTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    page: z.number().int().min(0).default(0),
    pageSize: z.number().int().min(1).max(100).default(25),
  })).query(({ input }) => db.listSuperAdminManagedUsers(input)),
  byId: superAdminProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
    const account = await db.getSuperAdminManagedUser(input.id);
    if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
    return account;
  }),
  formSchema: superAdminProcedure.query(() => db.getUserFormSchema(false)),
  create: superAdminProcedure.input(createInput).mutation(async ({ input }) => {
    try { return await db.createSuperAdminManagedUser(input); } catch (error) { return userError(error); }
  }),
  update: superAdminProcedure.input(updateInput).mutation(async ({ input }) => {
    try {
      const { id, password, ...profile } = input;
      return await db.updateSuperAdminManagedUser(id, { ...profile, password: password || undefined });
    } catch (error) { return userError(error); }
  }),
  remove: superAdminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    try { return await db.deleteSuperAdminManagedUser(input.id); } catch (error) { return userError(error); }
  }),
});
