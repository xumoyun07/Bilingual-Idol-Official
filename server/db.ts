import { and, asc, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { randomUUID } from "node:crypto";
import { Announcement, announcements, InsertUser, Program, programs, siteSettings, Submission, submissions, TeamProfile, teamProfiles, testimonials, User, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { shouldGrantFounderRole } from "./founderIdentity";
import { createUserPasswordHash } from "./userAuth";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

function requireDatabase(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) throw new Error("Database is currently unavailable. Please try again shortly.");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb(); if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  if (shouldGrantFounderRole({ email: user.email, openId: user.openId, ownerOpenId: ENV.ownerOpenId })) { values.role = "founder"; updateSet.role = "founder"; } else if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
  return result[0];
}

export async function recordUserSignIn(openId: string) {
  const db = requireDatabase(await getDb());
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.openId, openId));
}

export const founderManagedRoles = ["student", "teacher", "marketing", "admin", "super_admin"] as const;
export type FounderManagedRole = (typeof founderManagedRoles)[number];
export type ManagedUser = Omit<User, "passwordHash">;
export type ManagedUserFilters = {
  query?: string;
  role?: User["role"];
  isActive?: boolean;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  pageSize?: number;
};

function safeManagedUser(row: User): ManagedUser {
  const { passwordHash: _passwordHash, ...safe } = row;
  return safe;
}

function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function listManagedUsers(filters: ManagedUserFilters = {}) {
  const database = requireDatabase(await getDb());
  const conditions = [];
  const query = filters.query?.trim();
  if (query) {
    const pattern = `%${query}%`;
    conditions.push(or(like(users.name, pattern), like(users.email, pattern), like(users.openId, pattern), like(users.loginMethod, pattern)));
  }
  if (filters.role) conditions.push(eq(users.role, filters.role));
  if (filters.isActive !== undefined) conditions.push(eq(users.isActive, filters.isActive));
  if (filters.createdFrom) conditions.push(gte(users.createdAt, new Date(`${filters.createdFrom}T00:00:00.000Z`)));
  if (filters.createdTo) conditions.push(lte(users.createdAt, new Date(`${filters.createdTo}T23:59:59.999Z`)));
  const whereClause = conditions.length ? and(...conditions) : undefined;
  const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 1), 100);
  const page = Math.max(filters.page ?? 0, 0);
  const [rows, countRows] = await Promise.all([
    database.select().from(users).where(whereClause).orderBy(desc(users.createdAt)).limit(pageSize).offset(page * pageSize),
    database.select({ count: sql<number>`count(*)` }).from(users).where(whereClause),
  ]);
  return { rows: rows.map(safeManagedUser), total: Number(countRows[0]?.count ?? 0), page, pageSize };
}

export async function getManagedUser(id: number) {
  const database = requireDatabase(await getDb());
  const row = (await database.select().from(users).where(eq(users.id, id)).limit(1))[0];
  return row ? safeManagedUser(row) : undefined;
}

export async function createManagedUser(input: { name: string; email: string; password: string; role: FounderManagedRole; isActive: boolean }) {
  const database = requireDatabase(await getDb());
  const email = normaliseEmail(input.email);
  if (await getUserByEmail(email)) throw new Error("An account with this e-mail already exists.");
  const result = await database.insert(users).values({
    openId: `issued:${randomUUID()}`,
    name: input.name.trim(),
    email,
    passwordHash: createUserPasswordHash(input.password),
    isActive: input.isActive,
    loginMethod: "issued_by_founder",
    role: input.role,
    lastSignedIn: new Date(),
  });
  const created = await getManagedUser(Number(result[0].insertId));
  if (!created) throw new Error("The account could not be created.");
  return created;
}

export async function updateManagedUser(id: number, input: { name: string; email: string; password?: string; role: FounderManagedRole; isActive: boolean }) {
  const database = requireDatabase(await getDb());
  const existing = await getManagedUser(id);
  if (!existing) throw new Error("Account not found.");
  if (existing.role === "founder") throw new Error("Founder accounts cannot be changed in Users.");
  const email = normaliseEmail(input.email);
  const matchingEmail = await getUserByEmail(email);
  if (matchingEmail && matchingEmail.id !== id) throw new Error("An account with this e-mail already exists.");
  const values: Partial<InsertUser> = { name: input.name.trim(), email, role: input.role, isActive: input.isActive };
  if (input.password) values.passwordHash = createUserPasswordHash(input.password);
  await database.update(users).set(values).where(eq(users.id, id));
  const updated = await getManagedUser(id);
  if (!updated) throw new Error("The account could not be updated.");
  return updated;
}

export async function deleteManagedUser(id: number) {
  const database = requireDatabase(await getDb());
  const existing = await getManagedUser(id);
  if (!existing) throw new Error("Account not found.");
  if (existing.role === "founder") throw new Error("Founder accounts cannot be deleted in Users.");
  await database.delete(users).where(eq(users.id, id));
  return { success: true } as const;
}

export type SubmissionInput = { type: "enrollment" | "inquiry"; studentName: string; studentAge: number; parentName: string; parentEmail: string; parentPhone: string; programInterest: string; preferredSchedule: string; message?: string; source?: string; };

export async function createSubmission(input: SubmissionInput) {
  const db = requireDatabase(await getDb());
  const result = await db.insert(submissions).values({ ...input, message: input.message?.trim() || null, source: input.source?.trim() || "website" });
  return { id: Number(result[0].insertId) };
}
export async function listSubmissions() { const db = requireDatabase(await getDb()); return db.select().from(submissions).orderBy(desc(submissions.createdAt)); }
export async function updateSubmissionStatus(id: number, status: "new" | "contacted" | "interested" | "enrolled" | "closed") { const db = requireDatabase(await getDb()); await db.update(submissions).set({ status }).where(eq(submissions.id, id)); return { success: true }; }

export async function listPublicPrograms() { const db = requireDatabase(await getDb()); return db.select().from(programs).where(eq(programs.isActive, true)).orderBy(asc(programs.title)); }
export async function getPublicProgram(slug: string) { const db = requireDatabase(await getDb()); const result = await db.select().from(programs).where(eq(programs.slug, slug)).limit(1); return result[0]; }
export async function listPrograms() { const db = requireDatabase(await getDb()); return db.select().from(programs).orderBy(asc(programs.title)); }
export async function createProgram(input: Omit<Program, "id" | "createdAt" | "updatedAt">) { const db = requireDatabase(await getDb()); const result = await db.insert(programs).values(input); return { id: Number(result[0].insertId) }; }
export async function updateProgram(id: number, input: Omit<Program, "id" | "createdAt" | "updatedAt">) { const db = requireDatabase(await getDb()); await db.update(programs).set(input).where(eq(programs.id, id)); return { success: true }; }
export async function deleteProgram(id: number) { const db = requireDatabase(await getDb()); await db.delete(programs).where(eq(programs.id, id)); return { success: true }; }
export async function listPublicTestimonials() { const db = requireDatabase(await getDb()); return db.select().from(testimonials).where(eq(testimonials.approved, true)).orderBy(desc(testimonials.createdAt)); }
export async function listTestimonials() { const db = requireDatabase(await getDb()); return db.select().from(testimonials).orderBy(desc(testimonials.createdAt)); }
export async function createTestimonial(input: { authorName: string; relation: string; quote: string; rating: number; approved: boolean; consentConfirmed: boolean }) { const db = requireDatabase(await getDb()); const result = await db.insert(testimonials).values(input); return { id: Number(result[0].insertId) }; }
export async function updateTestimonial(id: number, input: { authorName: string; relation: string; quote: string; rating: number; approved: boolean; consentConfirmed: boolean }) { const db = requireDatabase(await getDb()); await db.update(testimonials).set(input).where(eq(testimonials.id, id)); return { success: true }; }
export async function deleteTestimonial(id: number) { const db = requireDatabase(await getDb()); await db.delete(testimonials).where(eq(testimonials.id, id)); return { success: true }; }
export async function listPublicTeamProfiles() { const db = requireDatabase(await getDb()); return db.select().from(teamProfiles).where(eq(teamProfiles.isPublished, true)).orderBy(asc(teamProfiles.sortOrder), asc(teamProfiles.name)); }
export async function listTeamProfiles() { const db = requireDatabase(await getDb()); return db.select().from(teamProfiles).orderBy(asc(teamProfiles.sortOrder), asc(teamProfiles.name)); }
export async function createTeamProfile(input: Omit<TeamProfile, "id" | "createdAt" | "updatedAt">) { const db = requireDatabase(await getDb()); const result = await db.insert(teamProfiles).values(input); return { id: Number(result[0].insertId) }; }
export async function updateTeamProfile(id: number, input: Omit<TeamProfile, "id" | "createdAt" | "updatedAt">) { const db = requireDatabase(await getDb()); await db.update(teamProfiles).set(input).where(eq(teamProfiles.id, id)); return { success: true }; }
export async function deleteTeamProfile(id: number) { const db = requireDatabase(await getDb()); await db.delete(teamProfiles).where(eq(teamProfiles.id, id)); return { success: true }; }
export async function listSiteSettings() { const db = requireDatabase(await getDb()); const rows = await db.select().from(siteSettings); return Object.fromEntries(rows.map(row => [row.key, row.value])); }
export async function updateSiteSettings(values: Record<string, string>) { const db = requireDatabase(await getDb()); for (const [key, value] of Object.entries(values)) await db.insert(siteSettings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } }); return { success: true }; }

export async function listPublicAnnouncements() { const db = requireDatabase(await getDb()); return db.select().from(announcements).where(eq(announcements.isPublished, true)).orderBy(desc(announcements.publishedAt), desc(announcements.createdAt)); }
export async function listAnnouncements() { const db = requireDatabase(await getDb()); return db.select().from(announcements).orderBy(desc(announcements.createdAt)); }
export async function createAnnouncement(input: Pick<Announcement, "slug" | "title" | "excerpt" | "body" | "category" | "isPublished" | "publishedAt">) { const db = requireDatabase(await getDb()); const result = await db.insert(announcements).values(input); return { id: Number(result[0].insertId) }; }
export async function updateAnnouncement(id: number, input: Pick<Announcement, "slug" | "title" | "excerpt" | "body" | "category" | "isPublished" | "publishedAt">) { const db = requireDatabase(await getDb()); await db.update(announcements).set(input).where(eq(announcements.id, id)); return { success: true }; }
export async function updateAnnouncementPublishState(id: number, isPublished: boolean) { const db = requireDatabase(await getDb()); await db.update(announcements).set({ isPublished, publishedAt: isPublished ? new Date() : null }).where(eq(announcements.id, id)); return { success: true }; }
export async function deleteAnnouncement(id: number) { const db = requireDatabase(await getDb()); await db.delete(announcements).where(eq(announcements.id, id)); return { success: true }; }
