import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { founderProcedure, router } from "../_core/trpc";
import * as audit from "../audit";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";

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

type AuditContext = { user: Pick<User, "id" | "role">; req: Request };
async function recordUserAudit(ctx: AuditContext, event: Omit<audit.AuditEventInput, "actor" | "request">) {
  try { await audit.writeAuditEvent({ ...event, actor: ctx.user, request: ctx.req }); } catch (error) { console.error("[audit] Could not persist Users event", error); }
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
  updateSystemFields: founderProcedure.input(z.object({ fields: z.array(systemFieldInput).length(5) })).mutation(async ({ ctx, input }) => {
    try { const result = await db.updateUserSystemFields(input.fields); await recordUserAudit(ctx, { action: "user_field.system_update", targetType: "user_form", description: "Updated configured user form fields.", metadata: { fields: input.fields.length } }); return result; } catch (error) { await recordUserAudit(ctx, { action: "user_field.system_update", targetType: "user_form", description: "User form field update failed.", isSuccess: false, metadata: { reason: "operation_failed" } }); return userError(error); }
  }),
  createSection: founderProcedure.input(sectionInput).mutation(async ({ ctx, input }) => {
    try { const result = await db.createUserFormSection(input); await recordUserAudit(ctx, { action: "user_group.create", targetType: "user_group", targetId: result.id, description: "Created a user field group.", metadata: { active: result.isActive } }); return result; } catch (error) { await recordUserAudit(ctx, { action: "user_group.create", targetType: "user_group", description: "User field group creation failed.", isSuccess: false, metadata: { reason: "operation_failed" } }); return userError(error); }
  }),
  updateSection: founderProcedure.input(sectionInput.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try { const { id, ...section } = input; const result = await db.updateUserFormSection(id, section); await recordUserAudit(ctx, { action: "user_group.update", targetType: "user_group", targetId: id, description: "Updated a user field group.", metadata: { active: result.isActive } }); return result; } catch (error) { await recordUserAudit(ctx, { action: "user_group.update", targetType: "user_group", targetId: input.id, description: "User field group update failed.", isSuccess: false, metadata: { reason: "operation_failed" } }); return userError(error); }
  }),
  removeSection: founderProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try { const result = await db.deleteUserFormSection(input.id); await recordUserAudit(ctx, { action: "user_group.delete", targetType: "user_group", targetId: input.id, description: "Deleted a user field group." }); return result; } catch (error) { await recordUserAudit(ctx, { action: "user_group.delete", targetType: "user_group", targetId: input.id, description: "User field group deletion failed.", isSuccess: false, metadata: { reason: "operation_failed" } }); return userError(error); }
  }),
  createField: founderProcedure.input(fieldInput).mutation(async ({ ctx, input }) => {
    try { const result = await db.createUserFormField(input); await recordUserAudit(ctx, { action: "user_field.create", targetType: "user_field", targetId: result.id, description: "Created a user form field.", metadata: { fieldType: result.fieldType, active: result.isActive } }); return result; } catch (error) { await recordUserAudit(ctx, { action: "user_field.create", targetType: "user_field", description: "User form field creation failed.", isSuccess: false, metadata: { reason: "operation_failed" } }); return userError(error); }
  }),
  updateField: founderProcedure.input(fieldInput.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try { const { id, ...field } = input; const result = await db.updateUserFormField(id, field); await recordUserAudit(ctx, { action: "user_field.update", targetType: "user_field", targetId: id, description: "Updated a user form field.", metadata: { fieldType: result.fieldType, active: result.isActive } }); return result; } catch (error) { await recordUserAudit(ctx, { action: "user_field.update", targetType: "user_field", targetId: input.id, description: "User form field update failed.", isSuccess: false, metadata: { reason: "operation_failed" } }); return userError(error); }
  }),
  removeField: founderProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try { const result = await db.deleteUserFormField(input.id); await recordUserAudit(ctx, { action: "user_field.delete", targetType: "user_field", targetId: input.id, description: "Deleted a user form field." }); return result; } catch (error) { await recordUserAudit(ctx, { action: "user_field.delete", targetType: "user_field", targetId: input.id, description: "User form field deletion failed.", isSuccess: false, metadata: { reason: "operation_failed" } }); return userError(error); }
  }),
  reorderFields: founderProcedure.input(z.object({ fieldIds: z.array(z.number().int().positive()).min(1).max(200).refine(ids => new Set(ids).size === ids.length, "Each field can appear only once.") })).mutation(async ({ ctx, input }) => {
    try { const result = await db.reorderUserFormFields(input.fieldIds); await recordUserAudit(ctx, { action: "user_field.reorder", targetType: "user_form", description: "Reordered user form fields.", metadata: { fieldCount: input.fieldIds.length } }); return result; } catch (error) { await recordUserAudit(ctx, { action: "user_field.reorder", targetType: "user_form", description: "User form field reorder failed.", isSuccess: false, metadata: { reason: "operation_failed" } }); return userError(error); }
  }),
  create: founderProcedure.input(createProfileInput.extend({ password: passwordInput.optional(), profileValues })).mutation(async ({ ctx, input }) => {
    try { const result = await db.createManagedUser(input); await recordUserAudit(ctx, { action: "user.create", targetType: "user", targetId: result.id, targetRole: result.role, description: "Created a managed user account.", metadata: { role: result.role, active: result.isActive } }); return result; } catch (error) { await recordUserAudit(ctx, { action: "user.create", targetType: "user", targetRole: input.role ?? null, description: "Managed user creation failed.", isSuccess: false, metadata: { reason: "operation_failed" } }); return userError(error); }
  }),
  update: founderProcedure.input(profileInput.extend({ id: z.number().int().positive(), password: passwordInput.optional().or(z.literal("")) })).mutation(async ({ ctx, input }) => {
    try {
      const { id, password, ...profile } = input;
      const result = await db.updateManagedUser(id, { ...profile, password: password || undefined });
      await recordUserAudit(ctx, { action: "user.update", targetType: "user", targetId: id, targetRole: result.role, description: "Updated a managed user account.", metadata: { role: result.role, active: result.isActive } });
      return result;
    } catch (error) { await recordUserAudit(ctx, { action: "user.update", targetType: "user", targetId: input.id, targetRole: input.role, description: "Managed user update failed.", isSuccess: false, metadata: { reason: "operation_failed" } }); return userError(error); }
  }),
  remove: founderProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try { const result = await db.deleteManagedUser(input.id); await recordUserAudit(ctx, { action: "user.delete", targetType: "user", targetId: input.id, description: "Deleted a managed user account." }); return result; } catch (error) { await recordUserAudit(ctx, { action: "user.delete", targetType: "user", targetId: input.id, description: "Managed user deletion failed.", isSuccess: false, metadata: { reason: "operation_failed" } }); return userError(error); }
  }),
});
