import { asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { Announcement, announcements, InsertUser, Program, programs, siteSettings, submissions, TeamProfile, teamProfiles, testimonials, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { shouldGrantFounderRole } from "./founderIdentity";

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
