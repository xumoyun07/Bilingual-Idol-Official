import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: text("passwordHash"),
  isActive: boolean("isActive").default(true).notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "student", "teacher", "marketing", "admin", "super_admin", "founder"]).default("student").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const userFormSections = mysqlTable("userFormSections", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  icon: varchar("icon", { length: 64 }).default("ClipboardList").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const userFormFields = mysqlTable("userFormFields", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 80 }).notNull().unique(),
  label: varchar("label", { length: 160 }).notNull(),
  fieldType: mysqlEnum("fieldType", ["text", "textarea", "number", "date", "dropdown", "checkbox"]).notNull(),
  isRequired: boolean("isRequired").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  placeholder: varchar("placeholder", { length: 255 }),
  optionsJson: text("optionsJson"),
  sectionId: int("sectionId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const userProfileValues = mysqlTable("userProfileValues", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fieldId: int("fieldId").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  userFieldUnique: uniqueIndex("userProfileValues_user_field_unique").on(table.userId, table.fieldId),
}));

export const programs = mysqlTable("programs", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  title: varchar("title", { length: 180 }).notNull(),
  language: varchar("language", { length: 80 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  ageGroup: varchar("ageGroup", { length: 100 }).notNull(),
  level: varchar("level", { length: 100 }).notNull(),
  duration: varchar("duration", { length: 120 }).notNull(),
  schedule: varchar("schedule", { length: 180 }).notNull(),
  fees: varchar("fees", { length: 180 }).notNull(),
  description: text("description").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const submissions = mysqlTable("submissions", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["enrollment", "inquiry"]).notNull(),
  studentName: varchar("studentName", { length: 160 }).notNull(),
  studentAge: int("studentAge").notNull(),
  parentName: varchar("parentName", { length: 160 }).notNull(),
  parentEmail: varchar("parentEmail", { length: 320 }).notNull(),
  parentPhone: varchar("parentPhone", { length: 64 }).notNull(),
  programInterest: varchar("programInterest", { length: 180 }).notNull(),
  preferredSchedule: varchar("preferredSchedule", { length: 180 }).notNull(),
  message: text("message"),
  source: varchar("source", { length: 100 }).default("website").notNull(),
  status: mysqlEnum("status", ["new", "contacted", "interested", "enrolled", "closed"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  title: varchar("title", { length: 220 }).notNull(),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(),
  category: mysqlEnum("category", ["announcement", "event", "holiday"]).default("announcement").notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const testimonials = mysqlTable("testimonials", {
  id: int("id").autoincrement().primaryKey(),
  authorName: varchar("authorName", { length: 160 }).notNull(),
  relation: varchar("relation", { length: 100 }).notNull(),
  quote: text("quote").notNull(),
  rating: int("rating").notNull(),
  approved: boolean("approved").default(false).notNull(),
  consentConfirmed: boolean("consentConfirmed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const teamProfiles = mysqlTable("teamProfiles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  role: varchar("role", { length: 160 }).notNull(),
  languages: varchar("languages", { length: 320 }).notNull(),
  bio: text("bio").notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const siteSettings = mysqlTable("siteSettings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Legacy archive only. These tables are intentionally retained by the user's
 * safe-removal decision and have no routes, tRPC procedures, UI, or app types.
 */
export const archivedLearningItems = mysqlTable("learningItems", {
  id: int("id").autoincrement().primaryKey(),
  kind: mysqlEnum("kind", ["schedule", "material", "teacher", "payment", "report"]).notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  description: text("description").notNull(),
  actionUrl: varchar("actionUrl", { length: 2048 }),
  isPublished: boolean("isPublished").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const archivedLearningSupportRequests = mysqlTable("learningSupportRequests", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["teacher", "payment", "report"]).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "reviewed", "resolved"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserFormSection = typeof userFormSections.$inferSelect;
export type UserFormField = typeof userFormFields.$inferSelect;
export type UserProfileValue = typeof userProfileValues.$inferSelect;
export type Program = typeof programs.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type TeamProfile = typeof teamProfiles.$inferSelect;
