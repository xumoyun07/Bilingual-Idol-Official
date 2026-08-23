import type { Request } from "express";
import { and, asc, desc, eq, gte, inArray, isNull, like, lte, ne, or, sql } from "drizzle-orm";
import { auditLogArchives, auditLogs, type User } from "../drizzle/schema";
import { getDb } from "./db";

export const auditActions = [
  "audit.view", "audit.search", "audit.export_csv", "audit.export_pdf", "audit.archive", "audit.restore",
  "user.create", "user.update", "user.delete",
  "user_group.create", "user_group.update", "user_group.delete",
  "user_field.create", "user_field.update", "user_field.delete", "user_field.reorder", "user_field.system_update",
] as const;
export type AuditAction = (typeof auditActions)[number];

export const auditTargetTypes = ["audit_log", "user", "user_group", "user_field", "user_form"] as const;
export type AuditTargetType = (typeof auditTargetTypes)[number];
export type AuditSource = "active" | "archive";
export type AuditScope = { role: "founder" | "super_admin"; userId: number };

export type AuditFilters = {
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  actorRole?: string;
  action?: string;
  targetType?: string;
  isSuccess?: boolean;
};

export type AuditListInput = AuditFilters & { source?: AuditSource; page?: number; pageSize?: number };
export type AuditEventInput = {
  actor: Pick<User, "id" | "role">;
  request?: Pick<Request, "headers" | "ip" | "socket">;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId?: string | number | null;
  targetRole?: User["role"] | null;
  description: string;
  isSuccess?: boolean;
  metadata?: unknown;
};

const sensitiveKey = /(password|secret|token|cookie|authorization|hash|profile.?values?|raw.?body|credential)/i;
const maxMetadataLength = 4_000;

function truncate(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, Math.max(0, limit - 1))}…` : value;
}

function sanitiseValue(value: unknown, depth = 0): unknown {
  if (value === null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return truncate(value.replace(/[\u0000-\u001f]/g, " "), 240);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return depth >= 2 ? "[truncated]" : value.slice(0, 20).map(item => sanitiseValue(item, depth + 1));
  if (typeof value !== "object" || depth >= 2) return "[truncated]";
  const safe: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 30)) {
    safe[key] = sensitiveKey.test(key) ? "[redacted]" : sanitiseValue(item, depth + 1);
  }
  return safe;
}

/** Removes credential-shaped metadata and constrains its retained size before persistence. */
export function sanitiseAuditMetadata(metadata: unknown): string | null {
  if (metadata === undefined || metadata === null) return null;
  const serialised = JSON.stringify(sanitiseValue(metadata));
  return truncate(serialised, maxMetadataLength);
}

export function parseAuditClientContext(request?: Pick<Request, "headers" | "ip" | "socket">) {
  const forwarded = request?.headers?.["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  const ipAddress = truncate((forwardedIp || request?.ip || request?.socket?.remoteAddress || "").trim(), 64) || null;
  const rawUserAgent = request?.headers?.["user-agent"];
  const userAgent = truncate(Array.isArray(rawUserAgent) ? rawUserAgent[0] ?? "" : rawUserAgent ?? "", 512) || null;
  const ua = userAgent ?? "";
  const browser = /Edg\//.test(ua) ? "Microsoft Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Google Chrome" : /Safari\//.test(ua) ? "Safari" : "Unknown";
  const operatingSystem = /Windows NT/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Unknown";
  return { ipAddress, userAgent, browser, operatingSystem };
}

export async function writeAuditEvent(input: AuditEventInput) {
  const database = await getDb();
  if (!database) return null;
  const client = parseAuditClientContext(input.request);
  const result = await database.insert(auditLogs).values({
    actorUserId: input.actor.id,
    actorRole: input.actor.role,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId === undefined || input.targetId === null ? null : truncate(String(input.targetId), 160),
    targetRole: input.targetRole ?? null,
    description: truncate(input.description, 500),
    isSuccess: input.isSuccess ?? true,
    ...client,
    metadataJson: sanitiseAuditMetadata(input.metadata),
  });
  return Number(result[0].insertId);
}

function dateStart(date?: string) { return date ? new Date(`${date}T00:00:00.000Z`) : undefined; }
function dateEnd(date?: string) { return date ? new Date(`${date}T23:59:59.999Z`) : undefined; }

function scopeConditions(table: typeof auditLogs | typeof auditLogArchives, scope: AuditScope) {
  if (scope.role === "founder") return [];
  return [
    or(isNull(table.actorRole), ne(table.actorRole, "founder")),
    or(isNull(table.targetRole), and(ne(table.targetRole, "founder"), ne(table.targetRole, "super_admin"))),
    or(isNull(table.actorRole), ne(table.actorRole, "super_admin"), eq(table.actorUserId, scope.userId)),
  ];
}

function filterConditions(table: typeof auditLogs | typeof auditLogArchives, filters: AuditFilters, scope: AuditScope) {
  const conditions = [...scopeConditions(table, scope)];
  const query = filters.query?.trim();
  if (query) {
    const pattern = `%${query.slice(0, 160)}%`;
    conditions.push(or(
      like(table.action, pattern), like(table.targetType, pattern), like(table.targetId, pattern), like(table.description, pattern),
      like(table.ipAddress, pattern), like(table.browser, pattern), like(table.operatingSystem, pattern), sql`${table.actorUserId} LIKE ${pattern}`,
    ));
  }
  if (filters.actorRole) conditions.push(eq(table.actorRole, filters.actorRole));
  if (filters.action) conditions.push(eq(table.action, filters.action));
  if (filters.targetType) conditions.push(eq(table.targetType, filters.targetType));
  if (filters.isSuccess !== undefined) conditions.push(eq(table.isSuccess, filters.isSuccess));
  const from = dateStart(filters.dateFrom); if (from) conditions.push(gte(table.createdAt, from));
  const to = dateEnd(filters.dateTo); if (to) conditions.push(lte(table.createdAt, to));
  return conditions;
}

function withSource<T extends { id: number; createdAt: Date }>(rows: T[], source: AuditSource) {
  return rows.map(row => ({ ...row, source }));
}

export async function listAuditLogs(input: AuditListInput, scope: AuditScope) {
  const database = await getDb(); if (!database) throw new Error("Database is currently unavailable. Please try again shortly.");
  const source = input.source ?? "active";
  const table = source === "archive" ? auditLogArchives : auditLogs;
  const whereClause = and(...filterConditions(table, input, scope));
  const pageSize = Math.min(Math.max(input.pageSize ?? 25, 1), 100);
  const page = Math.max(input.page ?? 0, 0);
  const [rows, countRows] = await Promise.all([
    database.select().from(table).where(whereClause).orderBy(desc(table.createdAt), desc(table.id)).limit(pageSize).offset(page * pageSize),
    database.select({ count: sql<number>`count(*)` }).from(table).where(whereClause),
  ]);
  return { rows: withSource(rows, source), total: Number(countRows[0]?.count ?? 0), page, pageSize, source };
}

export async function suggestAuditSearch(input: AuditFilters & { source?: AuditSource; query: string }, scope: AuditScope) {
  const result = await listAuditLogs({ ...input, page: 0, pageSize: 10 }, scope);
  const seen = new Set<string>();
  return result.rows.flatMap(row => {
    const candidates = [`#${row.id}`, row.action, row.targetType, row.targetId ?? "", row.ipAddress ?? "", row.description];
    return candidates.filter(value => Boolean(value) && !seen.has(value) && (seen.add(value), true)).map(value => truncate(value, 120));
  }).slice(0, 10);
}

export async function getAuditExportRows(filters: AuditFilters & { source?: AuditSource }, scope: AuditScope) {
  const database = await getDb(); if (!database) throw new Error("Database is currently unavailable. Please try again shortly.");
  const source = filters.source ?? "active";
  const table = source === "archive" ? auditLogArchives : auditLogs;
  return withSource(await database.select().from(table).where(and(...filterConditions(table, filters, scope))).orderBy(desc(table.createdAt), desc(table.id)).limit(5_000), source);
}

function escapeCsv(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function createAuditCsv(rows: Awaited<ReturnType<typeof getAuditExportRows>>) {
  const headers = ["Source", "Event UTC", "Actor user ID", "Actor role", "Action", "Target type", "Target ID", "Target role", "Success", "IP address", "Browser", "Operating system", "Description"];
  const lines = rows.map(row => [row.source, row.createdAt.toISOString(), row.actorUserId, row.actorRole, row.action, row.targetType, row.targetId, row.targetRole, row.isSuccess ? "success" : "failed", row.ipAddress, row.browser, row.operatingSystem, row.description].map(escapeCsv).join(","));
  return [headers.map(escapeCsv).join(","), ...lines].join("\r\n");
}

function pdfText(value: unknown, limit: number) {
  return truncate(String(value ?? "").normalize("NFKD").replace(/[^\x20-\x7E]/g, "?").replace(/[\\()]/g, "\\$&"), limit);
}

/** Minimal server-side PDF serializer; it carries only the filtered, RBAC-scoped export rows. */
export function createAuditPdf(rows: Awaited<ReturnType<typeof getAuditExportRows>>) {
  const lines = ["Bilingual Idol Learning Centre — Audit logs export", "UTC | actor | role | action | target | IP | browser / OS", ...rows.map(row => pdfText(`${row.createdAt.toISOString()} | ${row.actorUserId ?? "—"} | ${row.actorRole ?? "—"} | ${row.action} | ${row.targetType}:${row.targetId ?? "—"} | ${row.ipAddress ?? "—"} | ${row.browser ?? "—"} / ${row.operatingSystem ?? "—"}`, 150))];
  const perPage = 66;
  const pages = Array.from({ length: Math.max(1, Math.ceil(lines.length / perPage)) }, (_, index) => lines.slice(index * perPage, (index + 1) * perPage));
  const objects: string[] = ["<< /Type /Catalog /Pages 2 0 R >>", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>"];
  const pageRefs: string[] = [];
  pages.forEach((pageLines, index) => {
    const pageObject = 4 + index * 2;
    const contentObject = pageObject + 1;
    pageRefs.push(`${pageObject} 0 R`);
    const stream = `BT\n/F1 7.5 Tf\n36 806 Td\n${pageLines.map((line, lineIndex) => `${lineIndex ? "0 -11 Td\n" : ""}(${pdfText(line, 170)}) Tj`).join("\n")}\nET`;
    objects[pageObject - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObject} 0 R >>`;
    objects[contentObject - 1] = `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`;
  });
  objects[1] = `<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pages.length} >>`;
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets[index + 1] = Buffer.byteLength(pdf, "utf8"); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${objects.map((_, index) => `${String(offsets[index + 1]).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "utf8").toString("base64");
}

export async function archiveExpiredAuditLogs(archivedByUserId: number, now = new Date()) {
  const database = await getDb(); if (!database) throw new Error("Database is currently unavailable. Please try again shortly.");
  const cutoff = new Date(now); cutoff.setUTCMonth(cutoff.getUTCMonth() - 12);
  return database.transaction(async tx => {
    const candidates = await tx.select().from(auditLogs).where(lte(auditLogs.createdAt, cutoff)).orderBy(asc(auditLogs.id)).limit(1_000);
    if (!candidates.length) return { archived: 0, cutoff };
    await Promise.all(candidates.map(row => tx.insert(auditLogArchives).values({
      originalLogId: row.id, actorUserId: row.actorUserId, actorRole: row.actorRole, action: row.action, targetType: row.targetType,
      targetId: row.targetId, targetRole: row.targetRole, description: row.description, isSuccess: row.isSuccess, ipAddress: row.ipAddress,
      browser: row.browser, operatingSystem: row.operatingSystem, userAgent: row.userAgent, metadataJson: row.metadataJson, createdAt: row.createdAt, archivedByUserId,
    }).onDuplicateKeyUpdate({ set: { archivedAt: now, archivedByUserId } })));
    await tx.delete(auditLogs).where(inArray(auditLogs.id, candidates.map(row => row.id)));
    return { archived: candidates.length, cutoff };
  });
}

export async function restoreAuditLogArchives(archiveIds: number[]) {
  const database = await getDb(); if (!database) throw new Error("Database is currently unavailable. Please try again shortly.");
  return database.transaction(async tx => {
    const archives = await tx.select().from(auditLogArchives).where(inArray(auditLogArchives.id, archiveIds));
    if (!archives.length) return { restored: 0 };
    await tx.insert(auditLogs).values(archives.map(row => ({
      actorUserId: row.actorUserId, actorRole: row.actorRole, action: row.action, targetType: row.targetType, targetId: row.targetId,
      targetRole: row.targetRole, description: row.description, isSuccess: row.isSuccess, ipAddress: row.ipAddress, browser: row.browser,
      operatingSystem: row.operatingSystem, userAgent: row.userAgent, metadataJson: row.metadataJson, createdAt: row.createdAt,
    })));
    await tx.delete(auditLogArchives).where(inArray(auditLogArchives.id, archives.map(row => row.id)));
    return { restored: archives.length };
  });
}
