import { and, asc, desc, eq, gte, like, lte, ne, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { randomUUID } from "node:crypto";
import { Announcement, announcements, InsertUser, Program, programs, PublicMedia, publicMedia, siteSettings, Submission, submissions, TeamProfile, teamProfiles, Testimonial, testimonials, User, userFormFields, userFormSections, userProfileValues, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { shouldGrantFounderRole } from "./founderIdentity";
import { createUserPasswordHash } from "./userAuth";
import { normaliseOptions, parseFieldOptions, type RuntimeUserField, type UserFieldType, validateProfileValues } from "./userFieldSchema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

function requireDatabase(db: Awaited<ReturnType<typeof getDb>>): NonNullable<Awaited<ReturnType<typeof getDb>>> {
  if (!db) {
    throw new Error("Database is currently offline. Please configure DATABASE_URL.");
  }
  return db;
}

// In-Memory Data Store Fallbacks (active when DATABASE_URL is unconfigured or offline)
const inMemoryStore = {
  users: [
    {
      id: 1,
      openId: "founder:nurlanguageschool@gmail.com",
      name: "Founder",
      email: "nurlanguageschool@gmail.com",
      passwordHash: createUserPasswordHash("Founder2026!"),
      role: "founder" as const,
      isActive: true,
      loginMethod: "email_password",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
      lastSignedIn: new Date("2026-01-01"),
    },
    {
      id: 2,
      openId: "founder:lektor0780@gmail.com",
      name: "Founder",
      email: "lektor0780@gmail.com",
      passwordHash: createUserPasswordHash("Founder2026!"),
      role: "founder" as const,
      isActive: true,
      loginMethod: "email_password",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
      lastSignedIn: new Date("2026-01-01"),
    },
  ] as User[],
  submissions: [] as Submission[],
  programs: [
    { id: 1, slug: "general-english", title: "General English", language: "English", category: "English", ageGroup: "Teens & adults", level: "Beginner to advanced", duration: "Designed around your learning plan", schedule: "Confirmed with the centre after consultation", fees: "Fee guidance available on enquiry", description: "Build everyday confidence across speaking, listening, reading, and writing through practical, interactive learning.", isActive: true, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 2, slug: "kids-english", title: "Kids English", language: "English", category: "Kids", ageGroup: "Children", level: "Foundation to developing", duration: "Designed around your child's learning plan", schedule: "Confirmed with the centre after consultation", fees: "Fee guidance available on enquiry", description: "A playful, supportive foundation for young learners to grow their English through communication and guided practice.", isActive: true, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 3, slug: "speaking-conversation", title: "Speaking & Conversation", language: "English", category: "English", ageGroup: "Teens & adults", level: "Elementary to advanced", duration: "Designed around your learning plan", schedule: "Confirmed with the centre after consultation", fees: "Fee guidance available on enquiry", description: "A speaking-first programme for learners who want their words to feel natural, clear, and ready for daily life.", isActive: true, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 4, slug: "ielts-preparation", title: "IELTS Preparation", language: "English", category: "Professional", ageGroup: "Teens & adults", level: "Intermediate and above", duration: "Designed around your exam goals", schedule: "Confirmed with the centre after consultation", fees: "Fee guidance available on enquiry", description: "Focused preparation for learners planning to demonstrate their English proficiency for study, work, or migration.", isActive: true, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 5, slug: "bahasa-melayu", title: "Bahasa Melayu", language: "Bahasa Melayu", category: "World Languages", ageGroup: "Teens & adults", level: "Beginner to advanced", duration: "Designed around your learning plan", schedule: "Confirmed with the centre after consultation", fees: "Fee guidance available on enquiry", description: "Connect more confidently with life in Malaysia through structured Bahasa Melayu language learning.", isActive: true, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 6, slug: "mandarin", title: "Mandarin", language: "Mandarin", category: "World Languages", ageGroup: "Children, teens & adults", level: "Beginner to advanced", duration: "Designed around your learning plan", schedule: "Confirmed with the centre after consultation", fees: "Fee guidance available on enquiry", description: "A clear pathway into Mandarin that supports communication, listening skills, and purposeful progression.", isActive: true, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 7, slug: "arabic", title: "Arabic", language: "Arabic", category: "World Languages", ageGroup: "Teens & adults", level: "Beginner to advanced", duration: "Designed around your learning plan", schedule: "Confirmed with the centre after consultation", fees: "Fee guidance available on enquiry", description: "Learn Arabic through guided practice that supports meaningful communication and steady progress.", isActive: true, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 8, slug: "japanese", title: "Japanese", language: "Japanese", category: "World Languages", ageGroup: "Teens & adults", level: "Beginner to developing", duration: "Designed around your learning plan", schedule: "Confirmed with the centre after consultation", fees: "Fee guidance available on enquiry", description: "Start your Japanese language journey with an approachable, well-paced programme built around your needs.", isActive: true, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 9, slug: "korean", title: "Korean", language: "Korean", category: "World Languages", ageGroup: "Teens & adults", level: "Beginner to developing", duration: "Designed around your learning plan", schedule: "Confirmed with the centre after consultation", fees: "Fee guidance available on enquiry", description: "Learn Korean in a supportive environment that makes new vocabulary and expressions feel achievable.", isActive: true, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 10, slug: "business-english", title: "Business English", language: "English", category: "Professional", ageGroup: "Professionals", level: "Intermediate to advanced", duration: "Designed around workplace needs", schedule: "Confirmed with the centre after consultation", fees: "Fee guidance available on enquiry", description: "Refine professional communication for meetings, presentations, correspondence, and international workplace settings.", isActive: true, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
  ] as Program[],
  announcements: [
    { id: 1, slug: "welcome-to-bilingual-idol-2026", title: "Welcome to Bilingual Idol Language Centre 2026", excerpt: "New intake dates and language pathways are now open for the 2026 academic term.", body: "We are pleased to announce our updated schedule of language courses across English, Mandarin, Bahasa Melayu, Arabic, Japanese, and Korean. Contact our advisors to arrange your initial placement assessment in our modern classroom facilities.", category: "announcement" as const, isPublished: true, publishedAt: new Date("2026-01-15"), imageUrl: "/media/hero_poster.webp", imageStorageKey: "hero_poster", imageAltText: "Bilingual Idol Language Centre classroom and study space.", createdAt: new Date("2026-01-15"), updatedAt: new Date("2026-01-15") },
    { id: 2, slug: "ielts-intensive-intake", title: "IELTS Intensive Preparation Intake Open", excerpt: "Targeted 4-week, 8-week, and 12-week preparation tracks for international exam candidates.", body: "Our certified instructors provide structured test strategies and mock evaluation sessions to help learners achieve their required bands for university admission and global careers.", category: "event" as const, isPublished: true, publishedAt: new Date("2026-02-01"), imageUrl: "/media/prog_ielts.webp", imageStorageKey: "prog_ielts", imageAltText: "Students preparing for IELTS exam with structured coursework and study materials.", createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
    { id: 3, slug: "kids-and-teens-communication-workshops", title: "Kids & Teens Interactive Communication Workshops", excerpt: "Active weekend and weekday afternoon language sessions for children and teenagers.", body: "Designed to build natural speaking habits and vocabulary through guided discussions, interactive group projects, and supportive teacher coaching.", category: "announcement" as const, isPublished: true, publishedAt: new Date("2026-02-10"), imageUrl: "/media/prog_kids_english.webp", imageStorageKey: "prog_kids_english", imageAltText: "Interactive language and communication activities for young learners.", createdAt: new Date("2026-02-10"), updatedAt: new Date("2026-02-10") },
    { id: 4, slug: "conversational-fluency-sessions", title: "Conversational Fluency & Speaking Circles", excerpt: "Practical language practice for everyday conversations, workplace communication, and travel.", body: "Small group conversation tables led by experienced instructors to help you overcome language hesitation and speak with natural fluency.", category: "event" as const, isPublished: true, publishedAt: new Date("2026-02-18"), imageUrl: "/media/prog_speaking.webp", imageStorageKey: "prog_speaking", imageAltText: "Small group conversation and speaking practice in the language centre.", createdAt: new Date("2026-02-18"), updatedAt: new Date("2026-02-18") },
  ] as Announcement[],
  testimonials: [
    { id: 1, authorName: "Sarah L.", relation: "Parent of Kids English Student", quote: "The teachers at Bilingual Idol are exceptionally patient and encouraging. My daughter's vocabulary and speaking confidence blossomed in just a few months.", rating: 5, approved: true, consentConfirmed: true, createdAt: new Date("2026-01-10") },
    { id: 2, authorName: "Kenji T.", relation: "General English Student", quote: "Practical lessons with real everyday conversations helped me adjust quickly to working and communicating in Malaysia.", rating: 5, approved: true, consentConfirmed: true, createdAt: new Date("2026-01-20") },
    { id: 3, authorName: "Ahmad R.", relation: "IELTS Candidate", quote: "Structured exam strategies and dedicated feedback enabled me to achieve Band 7.5 on my first attempt!", rating: 5, approved: true, consentConfirmed: true, createdAt: new Date("2026-02-05") },
  ] as Testimonial[],
  teamProfiles: [
    { id: 1, name: "Dr. Elena Vance", role: "Academic Director & Founder", languages: "English, Mandarin, Bahasa Melayu", bio: "Over 15 years of international linguistics and language education experience dedicated to student-centred communication mastery.", isPublished: true, sortOrder: 1, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 2, name: "Marcus Chen", role: "Senior IELTS & English Lead", languages: "English, Mandarin", bio: "Certified IELTS examiner and educator passionate about helping learners unlock university and global career pathways.", isPublished: true, sortOrder: 2, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 3, name: "Nur Aisyah", role: "World Languages Instructor", languages: "Bahasa Melayu, Arabic, English", bio: "Specialises in conversational fluency and immersive, interactive classroom dynamics for young learners and adults.", isPublished: true, sortOrder: 3, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
  ] as TeamProfile[],
  publicMedia: [
    { id: 1, slot: "home_hero_video", label: "Home Hero Video", kind: "video" as const, altText: "Language centre classroom in action with active student engagement.", mimeType: "video/mp4", fileSize: 536870, storageKey: "home_hero_video", publicUrl: "/media/hero_video.mp4", isPublished: true, createdByUserId: 1, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 2, slot: "home_hero_poster", label: "Home Hero Poster", kind: "image" as const, altText: "Bright and modern language classroom at Bilingual Idol Language Centre.", mimeType: "image/webp", fileSize: 315874, storageKey: "home_hero_poster", publicUrl: "/media/hero_poster.webp", isPublished: true, createdByUserId: 1, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 3, slot: "home_task_programmes", label: "Home Task Programmes", kind: "image" as const, altText: "Classroom table with language study materials and coursework.", mimeType: "image/webp", fileSize: 266726, storageKey: "home_task_programmes", publicUrl: "/media/task_programmes.webp", isPublished: true, createdByUserId: 1, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 4, slot: "home_task_contact", label: "Home Task Contact", kind: "image" as const, altText: "Consultation and student advisory area at Bilingual Idol.", mimeType: "image/webp", fileSize: 293390, storageKey: "home_task_contact", publicUrl: "/media/task_contact.webp", isPublished: true, createdByUserId: 1, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 5, slot: "home_task_account", label: "Home Task Account", kind: "image" as const, altText: "Learner studying and preparing coursework.", mimeType: "image/webp", fileSize: 305966, storageKey: "home_task_account", publicUrl: "/media/task_account.webp", isPublished: true, createdByUserId: 1, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 6, slot: "programmes_listing", label: "Programmes Listing Hero", kind: "image" as const, altText: "Students taking part in an engaging language session.", mimeType: "image/webp", fileSize: 283728, storageKey: "programmes_listing", publicUrl: "/media/prog_general_english.webp", isPublished: true, createdByUserId: 1, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 7, slot: "programme_detail", label: "Programme Detail Header", kind: "image" as const, altText: "Small group conversation and guided practice in class.", mimeType: "image/webp", fileSize: 367748, storageKey: "programme_detail", publicUrl: "/media/prog_speaking.webp", isPublished: true, createdByUserId: 1, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 8, slot: "about_hero", label: "About Hero", kind: "image" as const, altText: "Contemporary classroom facilities at Bilingual Idol Language Centre.", mimeType: "image/webp", fileSize: 307538, storageKey: "about_hero", publicUrl: "/media/about_hero.webp", isPublished: true, createdByUserId: 1, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 9, slot: "about_method", label: "About Method", kind: "image" as const, altText: "Language-learning materials arranged for guided practice.", mimeType: "image/webp", fileSize: 199944, storageKey: "about_method", publicUrl: "/media/about_method.webp", isPublished: true, createdByUserId: 1, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 10, slot: "about_classroom", label: "About Classroom", kind: "image" as const, altText: "A bright, organised contemporary language classroom.", mimeType: "image/webp", fileSize: 307278, storageKey: "about_classroom", publicUrl: "/media/about_classroom.webp", isPublished: true, createdByUserId: 1, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 11, slot: "about_community", label: "About Community", kind: "image" as const, altText: "Learners collaborating around a table during a language activity.", mimeType: "image/webp", fileSize: 255964, storageKey: "about_community", publicUrl: "/media/about_community.webp", isPublished: true, createdByUserId: 1, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
    { id: 12, slot: "about_cta", label: "About CTA", kind: "image" as const, altText: "A welcoming consultation corner prepared for a conversation about learning.", mimeType: "image/webp", fileSize: 301962, storageKey: "about_cta", publicUrl: "/media/about_cta.webp", isPublished: true, createdByUserId: 1, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") },
  ] as PublicMedia[],
  siteSettings: {} as Record<string, string>,
  nextId: 100,
};

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (db) {
    const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
    const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
    for (const field of ["name", "email", "loginMethod"] as const) if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
    if (shouldGrantFounderRole({ email: user.email, openId: user.openId, ownerOpenId: ENV.ownerOpenId })) { values.role = "founder"; updateSet.role = "founder"; } else if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
    return;
  }

  const existing = inMemoryStore.users.find(u => u.openId === user.openId || (user.email && u.email?.toLowerCase() === user.email.toLowerCase()));
  const now = new Date();
  const isFounder = shouldGrantFounderRole({ email: user.email, openId: user.openId, ownerOpenId: ENV.ownerOpenId });
  const role = isFounder ? "founder" : (user.role ?? existing?.role ?? "student");

  if (existing) {
    if (user.name !== undefined) existing.name = user.name;
    if (user.email !== undefined) existing.email = user.email;
    if (user.loginMethod !== undefined) existing.loginMethod = user.loginMethod;
    if (user.passwordHash !== undefined) existing.passwordHash = user.passwordHash;
    existing.role = role;
    existing.lastSignedIn = user.lastSignedIn ?? now;
    existing.updatedAt = now;
  } else {
    inMemoryStore.users.push({
      id: inMemoryStore.nextId++,
      openId: user.openId,
      name: user.name ?? "User",
      email: user.email ?? null,
      passwordHash: user.passwordHash ?? null,
      role,
      isActive: user.isActive ?? true,
      loginMethod: user.loginMethod ?? "email_password",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: user.lastSignedIn ?? now,
    });
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (db) {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result[0];
  }
  return inMemoryStore.users.find(u => u.openId === openId);
}

export async function getUserByEmail(email: string) {
  const normalised = email.trim().toLowerCase();
  const db = await getDb();
  if (db) {
    const result = await db.select().from(users).where(eq(users.email, normalised)).limit(1);
    return result[0];
  }
  return inMemoryStore.users.find(u => u.email?.trim().toLowerCase() === normalised);
}

export async function recordUserSignIn(openId: string) {
  const db = await getDb();
  if (db) {
    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.openId, openId));
  } else {
    const existing = inMemoryStore.users.find(u => u.openId === openId);
    if (existing) existing.lastSignedIn = new Date();
  }
}

export const founderManagedRoles = ["student", "teacher", "marketing", "admin", "super_admin"] as const;
export type FounderManagedRole = (typeof founderManagedRoles)[number];
export const superAdminManagedRoles = ["student", "teacher", "marketing", "admin"] as const;
export type SuperAdminManagedRole = (typeof superAdminManagedRoles)[number];
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
  const database = await getDb();
  const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 1), 100);
  const page = Math.max(filters.page ?? 0, 0);

  if (database) {
    const conditions = [];
    const query = filters.query?.trim();
    if (query) {
      const pattern = `%${query}%`;
      conditions.push(or(like(users.name, pattern), like(users.email, pattern), like(users.openId, pattern), like(users.loginMethod, pattern)));
    }
    conditions.push(ne(users.role, "founder"));
    if (filters.role) conditions.push(eq(users.role, filters.role));
    if (filters.isActive !== undefined) conditions.push(eq(users.isActive, filters.isActive));
    if (filters.createdFrom) conditions.push(gte(users.createdAt, new Date(`${filters.createdFrom}T00:00:00.000Z`)));
    if (filters.createdTo) conditions.push(lte(users.createdAt, new Date(`${filters.createdTo}T23:59:59.999Z`)));
    const whereClause = conditions.length ? and(...conditions) : undefined;
    const [rows, countRows] = await Promise.all([
      database.select().from(users).where(whereClause).orderBy(desc(users.createdAt)).limit(pageSize).offset(page * pageSize),
      database.select({ count: sql<number>`count(*)` }).from(users).where(whereClause),
    ]);
    return { rows: rows.map(safeManagedUser), total: Number(countRows[0]?.count ?? 0), page, pageSize };
  }

  const filtered = inMemoryStore.users.filter(u => u.role !== "founder");
  return { rows: filtered.slice(page * pageSize, (page + 1) * pageSize).map(safeManagedUser), total: filtered.length, page, pageSize };
}

export async function getManagedUser(id: number) {
  const database = await getDb();
  if (database) {
    const row = (await database.select().from(users).where(eq(users.id, id)).limit(1))[0];
    return row && row.role !== "founder" ? safeManagedUser(row) : undefined;
  }
  const user = inMemoryStore.users.find(u => u.id === id && u.role !== "founder");
  return user ? safeManagedUser(user) : undefined;
}

export async function listSuperAdminManagedUsers(filters: ManagedUserFilters = {}) {
  const database = await getDb();
  const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 1), 100);
  const page = Math.max(filters.page ?? 0, 0);

  if (database) {
    const conditions = [ne(users.role, "founder"), ne(users.role, "super_admin")];
    const query = filters.query?.trim();
    if (query) {
      const pattern = `%${query}%`;
      const searchCondition = or(like(users.name, pattern), like(users.email, pattern), like(users.openId, pattern), like(users.loginMethod, pattern));
      if (searchCondition) conditions.push(searchCondition);
    }
    if (filters.role && superAdminManagedRoles.includes(filters.role as SuperAdminManagedRole)) conditions.push(eq(users.role, filters.role));
    if (filters.isActive !== undefined) conditions.push(eq(users.isActive, filters.isActive));
    if (filters.createdFrom) conditions.push(gte(users.createdAt, new Date(`${filters.createdFrom}T00:00:00.000Z`)));
    if (filters.createdTo) conditions.push(lte(users.createdAt, new Date(`${filters.createdTo}T23:59:59.999Z`)));
    const whereClause = and(...conditions);
    const [rows, countRows] = await Promise.all([
      database.select().from(users).where(whereClause).orderBy(desc(users.createdAt)).limit(pageSize).offset(page * pageSize),
      database.select({ count: sql<number>`count(*)` }).from(users).where(whereClause),
    ]);
    return { rows: rows.map(safeManagedUser), total: Number(countRows[0]?.count ?? 0), page, pageSize };
  }

  const filtered = inMemoryStore.users.filter(u => u.role !== "founder" && u.role !== "super_admin");
  return { rows: filtered.slice(page * pageSize, (page + 1) * pageSize).map(safeManagedUser), total: filtered.length, page, pageSize };
}

export async function getSuperAdminManagedUser(id: number) {
  const database = await getDb();
  if (database) {
    const row = (await database.select().from(users).where(and(eq(users.id, id), ne(users.role, "founder"), ne(users.role, "super_admin"))).limit(1))[0];
    return row ? safeManagedUser(row) : undefined;
  }
  const user = inMemoryStore.users.find(u => u.id === id && u.role !== "founder" && u.role !== "super_admin");
  return user ? safeManagedUser(user) : undefined;
}

type UserProfileValuesInput = Record<string, string>;
export const userSystemFieldIds = ["name", "email", "role", "password", "isActive"] as const;
export type UserSystemFieldId = (typeof userSystemFieldIds)[number];
export type RuntimeUserSystemField = { id: UserSystemFieldId; label: string; inputType: "text" | "email" | "role" | "password" | "checkbox"; isRequired: boolean; isActive: boolean; sortOrder: number; sectionId: number | null };
const systemFieldSettingsKey = "user_create_system_fields_v1";
const defaultSystemFields: RuntimeUserSystemField[] = [
  { id: "name", label: "Full name", inputType: "text", isRequired: true, isActive: true, sortOrder: 0, sectionId: null },
  { id: "email", label: "E-mail", inputType: "email", isRequired: true, isActive: true, sortOrder: 1, sectionId: null },
  { id: "role", label: "User type", inputType: "role", isRequired: true, isActive: true, sortOrder: 2, sectionId: null },
  { id: "password", label: "Initial password", inputType: "password", isRequired: true, isActive: true, sortOrder: 3, sectionId: null },
  { id: "isActive", label: "Account active", inputType: "checkbox", isRequired: false, isActive: true, sortOrder: 4, sectionId: null },
];

function normaliseSystemFields(raw: unknown): RuntimeUserSystemField[] {
  const candidate = Array.isArray(raw) ? raw : [];
  const configured = new Map(candidate.filter((field): field is Partial<RuntimeUserSystemField> & { id: UserSystemFieldId } => Boolean(field && typeof field === "object" && userSystemFieldIds.includes((field as { id?: string }).id as UserSystemFieldId))).map(field => [field.id, field]));
  return defaultSystemFields.map(defaultField => {
    const field = configured.get(defaultField.id);
    return {
      ...defaultField,
      label: typeof field?.label === "string" && field.label.trim().length >= 2 ? field.label.trim().slice(0, 160) : defaultField.label,
      isRequired: typeof field?.isRequired === "boolean" ? field.isRequired : defaultField.isRequired,
      isActive: typeof field?.isActive === "boolean" ? field.isActive : defaultField.isActive,
      sortOrder: typeof field?.sortOrder === "number" && Number.isInteger(field.sortOrder) && field.sortOrder >= 0 ? field.sortOrder : defaultField.sortOrder,
      sectionId: typeof field?.sectionId === "number" && Number.isInteger(field.sectionId) && field.sectionId > 0 ? field.sectionId : null,
    };
  }).sort((a, b) => a.sortOrder - b.sortOrder || userSystemFieldIds.indexOf(a.id) - userSystemFieldIds.indexOf(b.id));
}

export async function getUserSystemFields() {
  const database = await getDb();
  if (!database) return defaultSystemFields;
  const setting = (await database.select().from(siteSettings).where(eq(siteSettings.key, systemFieldSettingsKey)).limit(1))[0];
  if (!setting) return defaultSystemFields;
  try { return normaliseSystemFields(JSON.parse(setting.value)); } catch { return defaultSystemFields; }
}

export async function updateUserSystemFields(fields: Array<Omit<RuntimeUserSystemField, "inputType">>) {
  const database = await getDb();
  const ids = fields.map(field => field.id);
  if (fields.length !== userSystemFieldIds.length || new Set(ids).size !== userSystemFieldIds.length || userSystemFieldIds.some(id => !ids.includes(id))) throw new Error("The system field configuration must include each base field exactly once.");
  const normalised = normaliseSystemFields(fields);
  if (database) {
    await database.insert(siteSettings).values({ key: systemFieldSettingsKey, value: JSON.stringify(normalised) }).onDuplicateKeyUpdate({ set: { value: JSON.stringify(normalised) } });
  } else {
    inMemoryStore.siteSettings[systemFieldSettingsKey] = JSON.stringify(normalised);
  }
  return normalised;
}

function toRuntimeField(field: typeof userFormFields.$inferSelect): RuntimeUserField {
  return { id: field.id, key: field.key, label: field.label, fieldType: field.fieldType, isRequired: field.isRequired, placeholder: field.placeholder, options: parseFieldOptions(field.optionsJson), sectionId: field.sectionId, sortOrder: field.sortOrder, isActive: field.isActive };
}

export async function getUserFormSchema(includeInactive = false) {
  const database = await getDb();
  if (!database) {
    const systemFields = await getUserSystemFields();
    return { sections: [], fields: [], systemFields: includeInactive ? systemFields : systemFields.filter(field => field.isActive) };
  }
  const [sections, fields, systemFields] = await Promise.all([
    database.select().from(userFormSections).where(includeInactive ? undefined : eq(userFormSections.isActive, true)).orderBy(asc(userFormSections.sortOrder), asc(userFormSections.id)),
    database.select().from(userFormFields).where(includeInactive ? undefined : eq(userFormFields.isActive, true)).orderBy(asc(userFormFields.sortOrder), asc(userFormFields.id)),
    getUserSystemFields(),
  ]);
  return { sections, fields: fields.map(toRuntimeField), systemFields: includeInactive ? systemFields : systemFields.filter(field => field.isActive) };
}

function safeFieldKey(label: string) {
  const stem = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 55) || "custom_field";
  return `${stem}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export async function createUserFormSection(input: { title: string; icon?: string; sortOrder: number; isActive: boolean }) {
  const database = requireDatabase(await getDb());
  const result = await database.insert(userFormSections).values({ title: input.title.trim(), icon: input.icon?.trim() || "ClipboardList", sortOrder: input.sortOrder, isActive: input.isActive });
  return (await database.select().from(userFormSections).where(eq(userFormSections.id, Number(result[0].insertId))).limit(1))[0];
}

export async function updateUserFormSection(id: number, input: { title: string; icon?: string; sortOrder: number; isActive: boolean }) {
  const database = requireDatabase(await getDb());
  await database.update(userFormSections).set({ title: input.title.trim(), icon: input.icon?.trim() || "ClipboardList", sortOrder: input.sortOrder, isActive: input.isActive }).where(eq(userFormSections.id, id));
  return (await database.select().from(userFormSections).where(eq(userFormSections.id, id)).limit(1))[0];
}

export async function deleteUserFormSection(id: number) {
  const database = requireDatabase(await getDb());
  await database.transaction(async tx => {
    await tx.update(userFormFields).set({ sectionId: null }).where(eq(userFormFields.sectionId, id));
    await tx.delete(userFormSections).where(eq(userFormSections.id, id));
  });
  return { success: true } as const;
}

type FormFieldInput = { label: string; fieldType: UserFieldType; isRequired: boolean; sortOrder: number; placeholder?: string; options?: string[]; sectionId?: number | null; isActive: boolean };

export async function createUserFormField(input: FormFieldInput) {
  const database = requireDatabase(await getDb());
  const options = normaliseOptions(input.fieldType, input.options);
  const result = await database.insert(userFormFields).values({ key: safeFieldKey(input.label), label: input.label.trim(), fieldType: input.fieldType, isRequired: input.isRequired, sortOrder: input.sortOrder, placeholder: input.placeholder?.trim() || null, optionsJson: options.length ? JSON.stringify(options) : null, sectionId: input.sectionId ?? null, isActive: input.isActive });
  const field = (await database.select().from(userFormFields).where(eq(userFormFields.id, Number(result[0].insertId))).limit(1))[0];
  return toRuntimeField(field);
}

export async function updateUserFormField(id: number, input: FormFieldInput) {
  const database = requireDatabase(await getDb());
  const options = normaliseOptions(input.fieldType, input.options);
  await database.update(userFormFields).set({ label: input.label.trim(), fieldType: input.fieldType, isRequired: input.isRequired, sortOrder: input.sortOrder, placeholder: input.placeholder?.trim() || null, optionsJson: options.length ? JSON.stringify(options) : null, sectionId: input.sectionId ?? null, isActive: input.isActive }).where(eq(userFormFields.id, id));
  const field = (await database.select().from(userFormFields).where(eq(userFormFields.id, id)).limit(1))[0];
  if (!field) throw new Error("Field not found.");
  return toRuntimeField(field);
}

export async function deleteUserFormField(id: number) {
  const database = requireDatabase(await getDb());
  await database.transaction(async tx => {
    await tx.delete(userProfileValues).where(eq(userProfileValues.fieldId, id));
    await tx.delete(userFormFields).where(eq(userFormFields.id, id));
  });
  return { success: true } as const;
}

export async function reorderUserFormFields(fieldIds: number[]) {
  const database = requireDatabase(await getDb());
  const existing = await database.select({ id: userFormFields.id }).from(userFormFields);
  const existingIds = existing.map(field => field.id).sort((a, b) => a - b);
  const submittedIds = [...fieldIds].sort((a, b) => a - b);
  if (existingIds.length !== submittedIds.length || existingIds.some((id, index) => id !== submittedIds[index])) throw new Error("The submitted field order must include every configured field exactly once.");
  await database.transaction(async tx => {
    for (let index = 0; index < fieldIds.length; index += 1) await tx.update(userFormFields).set({ sortOrder: index }).where(eq(userFormFields.id, fieldIds[index]));
  });
  return getUserFormSchema(true);
}

async function validatedProfileRows(values: UserProfileValuesInput) {
  const { fields } = await getUserFormSchema(false);
  return Object.entries(validateProfileValues(fields, values)).map(([fieldId, value]) => ({ fieldId: Number(fieldId), value }));
}

export async function createManagedUser(input: { name?: string; email?: string; password?: string; role?: FounderManagedRole; isActive?: boolean; profileValues?: UserProfileValuesInput }) {
  const database = requireDatabase(await getDb());
  const systemFields = await getUserSystemFields();
  const supplied: Record<UserSystemFieldId, unknown> = { name: input.name, email: input.email, role: input.role, password: input.password, isActive: input.isActive };
  for (const field of systemFields) if (field.isActive && field.isRequired && (supplied[field.id] === undefined || supplied[field.id] === "")) throw new Error(`${field.label} is required by the current create form.`);
  const suppliedEmail = input.email ? normaliseEmail(input.email) : undefined;
  if (suppliedEmail && await getUserByEmail(suppliedEmail)) throw new Error("An account with this e-mail already exists.");
  const email = suppliedEmail ?? `issued-${randomUUID()}@pending.bilingualidol.invalid`;
  const credentialsIssued = Boolean(input.email && input.password);
  const password = input.password ?? randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
  const profileRows = await validatedProfileRows(input.profileValues ?? {});
  const result = await database.transaction(async tx => {
    const created = await tx.insert(users).values({
      openId: `issued:${randomUUID()}`,
      name: input.name?.trim() || "Unnamed account",
      email,
      passwordHash: createUserPasswordHash(password),
      isActive: input.isActive ?? credentialsIssued,
      loginMethod: credentialsIssued ? "issued_by_founder" : "issued_by_founder_draft",
      role: input.role ?? "student",
      lastSignedIn: new Date(),
    });
    const userId = Number(created[0].insertId);
    if (profileRows.length) await tx.insert(userProfileValues).values(profileRows.map(row => ({ userId, fieldId: row.fieldId, value: row.value })));
    return created;
  });
  const created = await getManagedUser(Number(result[0].insertId));
  if (!created) throw new Error("The account could not be created.");
  return created;
}

export async function createSuperAdminManagedUser(input: { name?: string; email?: string; password?: string; role?: SuperAdminManagedRole; isActive?: boolean; profileValues?: UserProfileValuesInput }) {
  if (input.role && !superAdminManagedRoles.includes(input.role)) throw new Error("This user type is unavailable.");
  return createManagedUser(input);
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

export async function updateSuperAdminManagedUser(id: number, input: { name: string; email: string; password?: string; role: SuperAdminManagedRole; isActive: boolean }) {
  if (!superAdminManagedRoles.includes(input.role)) throw new Error("This user type is unavailable.");
  if (!await getSuperAdminManagedUser(id)) throw new Error("Account not found.");
  return updateManagedUser(id, input);
}

export async function deleteManagedUser(id: number) {
  const database = requireDatabase(await getDb());
  const existing = await getManagedUser(id);
  if (!existing) throw new Error("Account not found.");
  if (existing.role === "founder") throw new Error("Founder accounts cannot be deleted in Users.");
  await database.transaction(async tx => {
    await tx.delete(userProfileValues).where(eq(userProfileValues.userId, id));
    await tx.delete(users).where(eq(users.id, id));
  });
  return { success: true } as const;
}

export async function deleteSuperAdminManagedUser(id: number) {
  if (!await getSuperAdminManagedUser(id)) throw new Error("Account not found.");
  return deleteManagedUser(id);
}

export type SubmissionInput = { type: "enrollment" | "inquiry"; studentName: string; studentAge: number; parentName: string; parentEmail: string; parentPhone: string; programInterest: string; preferredSchedule: string; message?: string; source?: string; };

export async function createSubmission(input: SubmissionInput) {
  const db = await getDb();
  if (db) {
    const result = await db.insert(submissions).values({ ...input, message: input.message?.trim() || null, source: input.source?.trim() || "website" });
    return { id: Number(result[0].insertId) };
  }
  const id = ++inMemoryStore.nextId;
  const newSubmission: Submission = {
    id,
    ...input,
    message: input.message?.trim() || null,
    source: input.source?.trim() || "website",
    status: "new",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  inMemoryStore.submissions.unshift(newSubmission);
  return { id };
}

export async function listSubmissions() {
  const db = await getDb();
  if (db) {
    return db.select().from(submissions).orderBy(desc(submissions.createdAt));
  }
  return inMemoryStore.submissions;
}

export async function updateSubmissionStatus(id: number, status: "new" | "contacted" | "interested" | "enrolled" | "closed") {
  const db = await getDb();
  if (db) {
    await db.update(submissions).set({ status }).where(eq(submissions.id, id));
    return { success: true };
  }
  const sub = inMemoryStore.submissions.find(s => s.id === id);
  if (sub) sub.status = status;
  return { success: true };
}

export async function listPublicPrograms() {
  const db = await getDb();
  if (db) {
    const rows = await db.select().from(programs).where(eq(programs.isActive, true)).orderBy(asc(programs.title));
    if (rows.length) return rows;
  }
  return inMemoryStore.programs.filter(p => p.isActive);
}

export async function getPublicProgram(slug: string) {
  const db = await getDb();
  if (db) {
    const result = await db.select().from(programs).where(eq(programs.slug, slug)).limit(1);
    if (result[0]) return result[0];
  }
  return inMemoryStore.programs.find(p => p.slug === slug);
}

export async function listPrograms() {
  const db = await getDb();
  if (db) {
    const rows = await db.select().from(programs).orderBy(asc(programs.title));
    if (rows.length) return rows;
  }
  return inMemoryStore.programs;
}

export async function createProgram(input: Omit<Program, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (db) {
    const result = await db.insert(programs).values(input);
    return { id: Number(result[0].insertId) };
  }
  const id = ++inMemoryStore.nextId;
  const program: Program = { id, ...input, createdAt: new Date(), updatedAt: new Date() };
  inMemoryStore.programs.push(program);
  return { id };
}

export async function updateProgram(id: number, input: Omit<Program, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (db) {
    await db.update(programs).set(input).where(eq(programs.id, id));
    return { success: true };
  }
  const index = inMemoryStore.programs.findIndex(p => p.id === id);
  if (index !== -1) inMemoryStore.programs[index] = { ...inMemoryStore.programs[index], ...input, updatedAt: new Date() };
  return { success: true };
}

export async function deleteProgram(id: number) {
  const db = await getDb();
  if (db) {
    await db.delete(programs).where(eq(programs.id, id));
    return { success: true };
  }
  inMemoryStore.programs = inMemoryStore.programs.filter(p => p.id !== id);
  return { success: true };
}

export async function listPublicTestimonials() {
  const db = await getDb();
  if (db) {
    const rows = await db.select().from(testimonials).where(eq(testimonials.approved, true)).orderBy(desc(testimonials.createdAt));
    if (rows.length) return rows;
  }
  return inMemoryStore.testimonials.filter(t => t.approved);
}

export async function listTestimonials() {
  const db = await getDb();
  if (db) {
    const rows = await db.select().from(testimonials).orderBy(desc(testimonials.createdAt));
    if (rows.length) return rows;
  }
  return inMemoryStore.testimonials;
}

export async function createTestimonial(input: { authorName: string; relation: string; quote: string; rating: number; approved: boolean; consentConfirmed: boolean }) {
  const db = await getDb();
  if (db) {
    const result = await db.insert(testimonials).values(input);
    return { id: Number(result[0].insertId) };
  }
  const id = ++inMemoryStore.nextId;
  const test: Testimonial = { id, ...input, createdAt: new Date() };
  inMemoryStore.testimonials.unshift(test);
  return { id };
}

export async function updateTestimonial(id: number, input: { authorName: string; relation: string; quote: string; rating: number; approved: boolean; consentConfirmed: boolean }) {
  const db = await getDb();
  if (db) {
    await db.update(testimonials).set(input).where(eq(testimonials.id, id));
    return { success: true };
  }
  const index = inMemoryStore.testimonials.findIndex(t => t.id === id);
  if (index !== -1) inMemoryStore.testimonials[index] = { ...inMemoryStore.testimonials[index], ...input };
  return { success: true };
}

export async function deleteTestimonial(id: number) {
  const db = await getDb();
  if (db) {
    await db.delete(testimonials).where(eq(testimonials.id, id));
    return { success: true };
  }
  inMemoryStore.testimonials = inMemoryStore.testimonials.filter(t => t.id !== id);
  return { success: true };
}

export async function listPublicTeamProfiles() {
  const db = await getDb();
  if (db) {
    const rows = await db.select().from(teamProfiles).where(eq(teamProfiles.isPublished, true)).orderBy(asc(teamProfiles.sortOrder), asc(teamProfiles.name));
    if (rows.length) return rows;
  }
  return inMemoryStore.teamProfiles.filter(t => t.isPublished);
}

export async function listTeamProfiles() {
  const db = await getDb();
  if (db) {
    const rows = await db.select().from(teamProfiles).orderBy(asc(teamProfiles.sortOrder), asc(teamProfiles.name));
    if (rows.length) return rows;
  }
  return inMemoryStore.teamProfiles;
}

export async function createTeamProfile(input: Omit<TeamProfile, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (db) {
    const result = await db.insert(teamProfiles).values(input);
    return { id: Number(result[0].insertId) };
  }
  const id = ++inMemoryStore.nextId;
  const profile: TeamProfile = { id, ...input, createdAt: new Date(), updatedAt: new Date() };
  inMemoryStore.teamProfiles.push(profile);
  return { id };
}

export async function updateTeamProfile(id: number, input: Omit<TeamProfile, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (db) {
    await db.update(teamProfiles).set(input).where(eq(teamProfiles.id, id));
    return { success: true };
  }
  const index = inMemoryStore.teamProfiles.findIndex(t => t.id === id);
  if (index !== -1) inMemoryStore.teamProfiles[index] = { ...inMemoryStore.teamProfiles[index], ...input, updatedAt: new Date() };
  return { success: true };
}

export async function deleteTeamProfile(id: number) {
  const db = await getDb();
  if (db) {
    await db.delete(teamProfiles).where(eq(teamProfiles.id, id));
    return { success: true };
  }
  inMemoryStore.teamProfiles = inMemoryStore.teamProfiles.filter(t => t.id !== id);
  return { success: true };
}

export async function listSiteSettings() {
  const db = await getDb();
  if (db) {
    const rows = await db.select().from(siteSettings);
    return Object.fromEntries(rows.map(row => [row.key, row.value]));
  }
  return inMemoryStore.siteSettings;
}

export async function updateSiteSettings(values: Record<string, string>) {
  const db = await getDb();
  if (db) {
    for (const [key, value] of Object.entries(values)) await db.insert(siteSettings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
    return { success: true };
  }
  Object.assign(inMemoryStore.siteSettings, values);
  return { success: true };
}

export async function listPublicMedia() {
  const database = await getDb();
  if (database) {
    const rows = await database.select({ slot: publicMedia.slot, kind: publicMedia.kind, altText: publicMedia.altText, publicUrl: publicMedia.publicUrl, mimeType: publicMedia.mimeType, fileSize: publicMedia.fileSize }).from(publicMedia).where(eq(publicMedia.isPublished, true)).orderBy(asc(publicMedia.slot));
    if (rows.length) return rows;
  }
  return inMemoryStore.publicMedia.filter(m => m.isPublished).map(({ slot, kind, altText, publicUrl, mimeType, fileSize }) => ({ slot, kind, altText, publicUrl, mimeType, fileSize }));
}

export async function listManagedPublicMedia() {
  const database = await getDb();
  if (database) {
    const rows = await database.select().from(publicMedia).orderBy(asc(publicMedia.slot));
    if (rows.length) return rows;
  }
  return inMemoryStore.publicMedia;
}

export async function getManagedPublicMedia(id: number) {
  const database = await getDb();
  if (database) {
    const row = (await database.select().from(publicMedia).where(eq(publicMedia.id, id)).limit(1))[0];
    if (row) return row;
  }
  return inMemoryStore.publicMedia.find(m => m.id === id);
}

export async function upsertPublicMedia(input: Omit<PublicMedia, "id" | "createdAt" | "updatedAt">) {
  const database = await getDb();
  if (database) {
    await database.insert(publicMedia).values(input).onDuplicateKeyUpdate({ set: { label: input.label, kind: input.kind, altText: input.altText, mimeType: input.mimeType, fileSize: input.fileSize, storageKey: input.storageKey, publicUrl: input.publicUrl, isPublished: input.isPublished, createdByUserId: input.createdByUserId } });
    return (await database.select().from(publicMedia).where(eq(publicMedia.slot, input.slot)).limit(1))[0];
  }
  const existingIndex = inMemoryStore.publicMedia.findIndex(m => m.slot === input.slot);
  const now = new Date();
  if (existingIndex !== -1) {
    const updated: PublicMedia = { ...inMemoryStore.publicMedia[existingIndex], ...input, updatedAt: now };
    inMemoryStore.publicMedia[existingIndex] = updated;
    return updated;
  }
  const newMedia: PublicMedia = { id: ++inMemoryStore.nextId, ...input, createdAt: now, updatedAt: now };
  inMemoryStore.publicMedia.push(newMedia);
  return newMedia;
}

export async function updatePublicMedia(id: number, input: Pick<PublicMedia, "label" | "altText" | "isPublished">) {
  const database = await getDb();
  if (database) {
    await database.update(publicMedia).set(input).where(eq(publicMedia.id, id));
    return getManagedPublicMedia(id);
  }
  const item = inMemoryStore.publicMedia.find(m => m.id === id);
  if (item) Object.assign(item, input);
  return item;
}

export async function deletePublicMedia(id: number) {
  const database = await getDb();
  if (database) {
    await database.delete(publicMedia).where(eq(publicMedia.id, id));
    return { success: true } as const;
  }
  inMemoryStore.publicMedia = inMemoryStore.publicMedia.filter(m => m.id !== id);
  return { success: true } as const;
}

export type NewsPostInput = Pick<Announcement, "slug" | "title" | "excerpt" | "body" | "category" | "isPublished" | "publishedAt" | "imageUrl" | "imageStorageKey" | "imageAltText">;

export async function listPublicAnnouncements() {
  const db = await getDb();
  if (db) {
    const rows = await db.select().from(announcements).where(eq(announcements.isPublished, true)).orderBy(desc(announcements.publishedAt), desc(announcements.createdAt));
    if (rows.length) return rows;
  }
  return inMemoryStore.announcements.filter(a => a.isPublished);
}

export async function listPublicAnnouncementsPage(input: { page?: number } = {}) {
  const db = await getDb();
  const pageSize = 6;
  const page = Math.max(input.page ?? 0, 0);
  if (db) {
    const where = eq(announcements.isPublished, true);
    const [rows, countRows] = await Promise.all([
      db.select().from(announcements).where(where).orderBy(desc(announcements.publishedAt), desc(announcements.createdAt)).limit(pageSize).offset(page * pageSize),
      db.select({ count: sql<number>`count(*)` }).from(announcements).where(where),
    ]);
    const total = Number(countRows[0]?.count ?? 0);
    if (total > 0 || rows.length > 0) {
      return { rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }
  }
  const published = inMemoryStore.announcements.filter(a => a.isPublished);
  const total = published.length;
  const rows = published.slice(page * pageSize, (page + 1) * pageSize);
  return { rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function listAnnouncements() {
  const db = await getDb();
  if (db) {
    const rows = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
    if (rows.length) return rows;
  }
  return inMemoryStore.announcements;
}

export async function getAnnouncement(id: number) {
  const db = await getDb();
  if (db) {
    const row = (await db.select().from(announcements).where(eq(announcements.id, id)).limit(1))[0];
    if (row) return row;
  }
  return inMemoryStore.announcements.find(a => a.id === id);
}

export async function createAnnouncement(input: NewsPostInput) {
  const db = await getDb();
  if (db) {
    const result = await db.insert(announcements).values(input);
    return getAnnouncement(Number(result[0].insertId));
  }
  const id = ++inMemoryStore.nextId;
  const announcement: Announcement = { id, ...input, createdAt: new Date(), updatedAt: new Date() };
  inMemoryStore.announcements.unshift(announcement);
  return announcement;
}

export async function updateAnnouncement(id: number, input: NewsPostInput) {
  const db = await getDb();
  if (db) {
    await db.update(announcements).set(input).where(eq(announcements.id, id));
    return getAnnouncement(id);
  }
  const index = inMemoryStore.announcements.findIndex(a => a.id === id);
  if (index !== -1) inMemoryStore.announcements[index] = { ...inMemoryStore.announcements[index], ...input, updatedAt: new Date() };
  return inMemoryStore.announcements[index];
}

export async function updateAnnouncementPublishState(id: number, isPublished: boolean) {
  const db = await getDb();
  if (db) {
    await db.update(announcements).set({ isPublished, publishedAt: isPublished ? new Date() : null }).where(eq(announcements.id, id));
    return { success: true };
  }
  const announcement = inMemoryStore.announcements.find(a => a.id === id);
  if (announcement) {
    announcement.isPublished = isPublished;
    announcement.publishedAt = isPublished ? new Date() : null;
  }
  return { success: true };
}

export async function deleteAnnouncement(id: number) {
  const db = await getDb();
  if (db) {
    await db.delete(announcements).where(eq(announcements.id, id));
    return { success: true };
  }
  inMemoryStore.announcements = inMemoryStore.announcements.filter(a => a.id !== id);
  return { success: true };
}
