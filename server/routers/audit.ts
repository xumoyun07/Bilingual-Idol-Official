import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { auditProcedure, founderProcedure, router } from "../_core/trpc";
import {
  archiveExpiredAuditLogs, createAuditCsv, createAuditPdf, getAuditExportRows, listAuditLogs, restoreAuditLogArchives,
  suggestAuditSearch, writeAuditEvent, type AuditFilters, type AuditScope,
} from "../audit";

const sourceInput = z.enum(["active", "archive"]);
const filtersInput = z.object({
  query: z.string().trim().max(160).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  actorRole: z.enum(["user", "student", "teacher", "marketing", "admin", "super_admin", "founder"]).optional(),
  action: z.string().trim().min(1).max(100).optional(),
  targetType: z.string().trim().min(1).max(100).optional(),
  isSuccess: z.boolean().optional(),
  source: sourceInput.default("active"),
});
const listInput = filtersInput.extend({ page: z.number().int().min(0).default(0), pageSize: z.number().int().min(1).max(100).default(25) });

function scopeFor(user: { id: number; role: string }): AuditScope {
  if (user.role === "founder" || user.role === "super_admin") return { role: user.role, userId: user.id };
  throw new TRPCError({ code: "FORBIDDEN", message: "This resource is unavailable." });
}

function auditError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "The audit operation could not be completed." });
}

async function recordInteraction(args: Parameters<typeof writeAuditEvent>[0]) {
  try { await writeAuditEvent(args); } catch (error) { console.error("[audit] Could not persist audit interaction", error); }
}

export const auditRouter = router({
  list: auditProcedure.input(listInput).query(async ({ ctx, input }) => {
    try {
      const result = await listAuditLogs(input, scopeFor(ctx.user));
      await recordInteraction({ actor: ctx.user, request: ctx.req, action: "audit.view", targetType: "audit_log", description: "Viewed filtered audit log records.", metadata: { source: input.source, page: input.page, pageSize: input.pageSize, filtered: Object.keys(input).filter(key => !["page", "pageSize", "source"].includes(key)) } });
      return result;
    } catch (error) { return auditError(error); }
  }),
  suggestions: auditProcedure.input(filtersInput.extend({ query: z.string().trim().min(1).max(160) })).query(async ({ ctx, input }) => {
    try {
      const suggestions = await suggestAuditSearch(input, scopeFor(ctx.user));
      await recordInteraction({ actor: ctx.user, request: ctx.req, action: "audit.search", targetType: "audit_log", description: "Searched audit log suggestions.", metadata: { source: input.source, queryLength: input.query.length } });
      return suggestions;
    } catch (error) { return auditError(error); }
  }),
  exportCsv: auditProcedure.input(filtersInput).mutation(async ({ ctx, input }) => {
    try {
      const rows = await getAuditExportRows(input, scopeFor(ctx.user));
      await recordInteraction({ actor: ctx.user, request: ctx.req, action: "audit.export_csv", targetType: "audit_log", description: "Exported filtered audit log records as CSV.", metadata: { source: input.source, rows: rows.length } });
      return { filename: `audit-logs-${input.source}-${new Date().toISOString().slice(0, 10)}.csv`, mimeType: "text/csv;charset=utf-8", data: createAuditCsv(rows) };
    } catch (error) { return auditError(error); }
  }),
  exportPdf: auditProcedure.input(filtersInput).mutation(async ({ ctx, input }) => {
    try {
      const rows = await getAuditExportRows(input, scopeFor(ctx.user));
      await recordInteraction({ actor: ctx.user, request: ctx.req, action: "audit.export_pdf", targetType: "audit_log", description: "Exported filtered audit log records as PDF.", metadata: { source: input.source, rows: rows.length } });
      return { filename: `audit-logs-${input.source}-${new Date().toISOString().slice(0, 10)}.pdf`, mimeType: "application/pdf", dataBase64: createAuditPdf(rows) };
    } catch (error) { return auditError(error); }
  }),
  archive: founderProcedure.mutation(async ({ ctx }) => {
    try {
      const result = await archiveExpiredAuditLogs(ctx.user.id);
      await recordInteraction({ actor: ctx.user, request: ctx.req, action: "audit.archive", targetType: "audit_log", description: `Archived ${result.archived} audit log record(s) older than 12 months.`, metadata: { archived: result.archived, cutoffUtc: result.cutoff.toISOString() } });
      return result;
    } catch (error) { return auditError(error); }
  }),
  restore: founderProcedure.input(z.object({ archiveIds: z.array(z.number().int().positive()).min(1).max(100).refine(ids => new Set(ids).size === ids.length, "Each archive record may be restored once.") })).mutation(async ({ ctx, input }) => {
    try {
      const result = await restoreAuditLogArchives(input.archiveIds);
      await recordInteraction({ actor: ctx.user, request: ctx.req, action: "audit.restore", targetType: "audit_log", description: `Restored ${result.restored} archived audit log record(s).`, metadata: { restored: result.restored, archiveIds: input.archiveIds } });
      return result;
    } catch (error) { return auditError(error); }
  }),
});
