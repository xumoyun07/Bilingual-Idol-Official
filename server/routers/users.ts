import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { founderProcedure, router } from "../_core/trpc";

const managedRole = z.enum(["student", "teacher", "marketing", "admin", "super_admin"]);
const dynamicFieldType = z.enum(["text", "textarea", "number", "date", "dropdown", "checkbox"]);
const profileValues = z.record(z.string().max(80), z.string().max(4000)).default({});
const sectionInput = z.object({ title: z.string().trim().min(2).max(160), icon: z.string().trim().max(64).optional(), sortOrder: z.number().int().min(0).max(10000), isActive: z.boolean() });
const fieldInput = z.object({ label: z.string().trim().min(2).max(160), fieldType: dynamicFieldType, isRequired: z.boolean(), sortOrder: z.number().int().min(0).max(10000), placeholder: z.string().trim().max(255).optional(), options: z.array(z.string().trim().min(1).max(100)).max(30).optional().default([]), sectionId: z.number().int().positive().nullable().optional(), isActive: z.boolean() });
const profileInput = z.object({
  name: z.string().trim().min(2, "Enter a name with at least 2 characters.").max(160),
  email: z.string().trim().email("Enter a valid e-mail address.").max(320),
  role: managedRole,
  isActive: z.boolean(),
});
const passwordInput = z.string().min(10, "Use at least 10 characters for the password.").max(256);
const systemFieldInput = z.object({ id: z.enum(["name", "email", "role", "password", "isActive"]), label: z.string().trim().min(2).max(160), isRequired: z.boolean(), isActive: z.boolean(), sortOrder: z.number().int().min(0).max(100), sectionId: z.number().int().positive().nullable().default(null) });
const createProfileInput = z.object({ name: z.string().trim().min(2, "Enter a name with at least 2 characters.").max(160).optional(), email: z.string().trim().email("Enter a valid e-mail address.").max(320).optional(), role: managedRole.optional(), isActive: z.boolean().optional() });

function userError(error: unknown): never {
  const message = error instanceof Error ? error.message : "The account action could not be completed.";
  throw new TRPCError({ code: "BAD_REQUEST", message });
}

export const usersRouter = router({
  list: founderProcedure.input(z.object({
    query: z.string().trim().max(160).optional(),
    role: z.enum(["user", "student", "teacher", "marketing", "admin", "super_admin"]).optional(),
    isActive: z.boolean().optional(),
    createdFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    createdTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    page: z.number().int().min(0).default(0),
    pageSize: z.number().int().min(1).max(100).default(25),
  })).query(({ input }) => db.listManagedUsers(input)),
  byId: founderProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
    const account = await db.getManagedUser(input.id);
    if (!account || account.role === "founder") throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
    return account;
  }),
  formSchema: founderProcedure.query(() => db.getUserFormSchema(true)),
  updateSystemFields: founderProcedure.input(z.object({ fields: z.array(systemFieldInput).length(5) })).mutation(async ({ input }) => {
    try { return await db.updateUserSystemFields(input.fields); } catch (error) { return userError(error); }
  }),
  createSection: founderProcedure.input(sectionInput).mutation(async ({ input }) => {
    try { return await db.createUserFormSection(input); } catch (error) { return userError(error); }
  }),
  updateSection: founderProcedure.input(sectionInput.extend({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    try { const { id, ...section } = input; return await db.updateUserFormSection(id, section); } catch (error) { return userError(error); }
  }),
  removeSection: founderProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    try { return await db.deleteUserFormSection(input.id); } catch (error) { return userError(error); }
  }),
  createField: founderProcedure.input(fieldInput).mutation(async ({ input }) => {
    try { return await db.createUserFormField(input); } catch (error) { return userError(error); }
  }),
  updateField: founderProcedure.input(fieldInput.extend({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    try { const { id, ...field } = input; return await db.updateUserFormField(id, field); } catch (error) { return userError(error); }
  }),
  removeField: founderProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    try { return await db.deleteUserFormField(input.id); } catch (error) { return userError(error); }
  }),
  reorderFields: founderProcedure.input(z.object({ fieldIds: z.array(z.number().int().positive()).min(1).max(200).refine(ids => new Set(ids).size === ids.length, "Each field can appear only once.") })).mutation(async ({ input }) => {
    try { return await db.reorderUserFormFields(input.fieldIds); } catch (error) { return userError(error); }
  }),
  create: founderProcedure.input(createProfileInput.extend({ password: passwordInput.optional(), profileValues })).mutation(async ({ input }) => {
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
