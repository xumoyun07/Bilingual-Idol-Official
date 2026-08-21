import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { founderProcedure, router } from "../_core/trpc";

const managedRole = z.enum(["student", "teacher", "marketing", "admin", "super_admin"]);
const profileInput = z.object({
  name: z.string().trim().min(2, "Enter a name with at least 2 characters.").max(160),
  email: z.string().trim().email("Enter a valid e-mail address.").max(320),
  role: managedRole,
  isActive: z.boolean(),
});
const passwordInput = z.string().min(10, "Use at least 10 characters for the password.").max(256);

function userError(error: unknown): never {
  const message = error instanceof Error ? error.message : "The account action could not be completed.";
  throw new TRPCError({ code: "BAD_REQUEST", message });
}

export const usersRouter = router({
  list: founderProcedure.input(z.object({
    query: z.string().trim().max(160).optional(),
    role: z.enum(["user", "student", "teacher", "marketing", "admin", "super_admin", "founder"]).optional(),
    isActive: z.boolean().optional(),
    createdFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    createdTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    page: z.number().int().min(0).default(0),
    pageSize: z.number().int().min(1).max(100).default(25),
  })).query(({ input }) => db.listManagedUsers(input)),
  byId: founderProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
    const account = await db.getManagedUser(input.id);
    if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
    return account;
  }),
  create: founderProcedure.input(profileInput.extend({ password: passwordInput })).mutation(async ({ input }) => {
    try { return await db.createManagedUser(input); } catch (error) { return userError(error); }
  }),
  update: founderProcedure.input(profileInput.extend({ id: z.number().int().positive(), password: passwordInput.optional().or(z.literal("")) })).mutation(async ({ input }) => {
    try {
      const { id, password, ...profile } = input;
      return await db.updateManagedUser(id, { ...profile, password: password || undefined });
    } catch (error) { return userError(error); }
  }),
  remove: founderProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    try { return await db.deleteManagedUser(input.id); } catch (error) { return userError(error); }
  }),
});
