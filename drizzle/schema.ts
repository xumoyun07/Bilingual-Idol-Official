import { boolean, date, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

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
  imageUrl: varchar("imageUrl", { length: 1024 }),
  imageStorageKey: varchar("imageStorageKey", { length: 512 }),
  imageAltText: varchar("imageAltText", { length: 255 }),
  isPublished: boolean("isPublished").default(false).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  publicPageIndex: index("announcements_public_page_idx").on(table.isPublished, table.publishedAt, table.createdAt),
}));

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

export const publicMedia = mysqlTable("publicMedia", {
  id: int("id").autoincrement().primaryKey(),
  slot: varchar("slot", { length: 80 }).notNull().unique(),
  label: varchar("label", { length: 160 }).notNull(),
  kind: mysqlEnum("kind", ["image", "video"]).notNull(),
  altText: varchar("altText", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  fileSize: int("fileSize").notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  publicUrl: varchar("publicUrl", { length: 1024 }).notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  publicIndex: index("publicMedia_public_idx").on(table.isPublished, table.kind),
  creatorIndex: index("publicMedia_creator_idx").on(table.createdByUserId, table.updatedAt),
}));

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  actorUserId: int("actorUserId"),
  actorRole: varchar("actorRole", { length: 32 }),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("targetType", { length: 100 }).notNull(),
  targetId: varchar("targetId", { length: 160 }),
  targetRole: varchar("targetRole", { length: 32 }),
  description: varchar("description", { length: 500 }).notNull(),
  isSuccess: boolean("isSuccess").default(true).notNull(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  browser: varchar("browser", { length: 160 }),
  operatingSystem: varchar("operatingSystem", { length: 160 }),
  userAgent: varchar("userAgent", { length: 512 }),
  metadataJson: text("metadataJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  createdAtIndex: index("auditLogs_createdAt_idx").on(table.createdAt),
  actorIndex: index("auditLogs_actor_idx").on(table.actorUserId, table.createdAt),
  actorRoleIndex: index("auditLogs_actorRole_idx").on(table.actorRole, table.createdAt),
  actionIndex: index("auditLogs_action_idx").on(table.action, table.createdAt),
  targetIndex: index("auditLogs_target_idx").on(table.targetType, table.targetId),
  targetRoleIndex: index("auditLogs_targetRole_idx").on(table.targetRole, table.createdAt),
  successIndex: index("auditLogs_success_idx").on(table.isSuccess, table.createdAt),
  ipIndex: index("auditLogs_ip_idx").on(table.ipAddress, table.createdAt),
}));

export const auditLogArchives = mysqlTable("auditLogArchives", {
  id: int("id").autoincrement().primaryKey(),
  originalLogId: int("originalLogId").notNull().unique(),
  actorUserId: int("actorUserId"),
  actorRole: varchar("actorRole", { length: 32 }),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("targetType", { length: 100 }).notNull(),
  targetId: varchar("targetId", { length: 160 }),
  targetRole: varchar("targetRole", { length: 32 }),
  description: varchar("description", { length: 500 }).notNull(),
  isSuccess: boolean("isSuccess").default(true).notNull(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  browser: varchar("browser", { length: 160 }),
  operatingSystem: varchar("operatingSystem", { length: 160 }),
  userAgent: varchar("userAgent", { length: 512 }),
  metadataJson: text("metadataJson"),
  createdAt: timestamp("createdAt").notNull(),
  archivedAt: timestamp("archivedAt").defaultNow().notNull(),
  archivedByUserId: int("archivedByUserId"),
}, table => ({
  archivedAtIndex: index("auditLogArchives_archivedAt_idx").on(table.archivedAt),
  createdAtIndex: index("auditLogArchives_createdAt_idx").on(table.createdAt),
  actorIndex: index("auditLogArchives_actor_idx").on(table.actorUserId, table.createdAt),
  actionIndex: index("auditLogArchives_action_idx").on(table.action, table.createdAt),
  targetRoleIndex: index("auditLogArchives_targetRole_idx").on(table.targetRole, table.createdAt),
}));

export const studentProfiles = mysqlTable("studentProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  guardianName: varchar("guardianName", { length: 160 }),
  guardianPhone: varchar("guardianPhone", { length: 64 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  dateOfBirth: date("dateOfBirth"),
  address: text("address"),
  notes: text("notes"),
  attendedSessions: int("attendedSessions").default(0).notNull(),
  totalSessions: int("totalSessions").default(0).notNull(),
  currentLevel: varchar("currentLevel", { length: 120 }),
  courseName: varchar("courseName", { length: 180 }),
  courseCode: varchar("courseCode", { length: 80 }),
  courseStartDate: date("courseStartDate"),
  courseEndDate: date("courseEndDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  studentUserUnique: uniqueIndex("studentProfiles_user_unique").on(table.userId),
  levelIndex: index("studentProfiles_level_idx").on(table.currentLevel),
  courseIndex: index("studentProfiles_course_idx").on(table.courseName),
}));

export const studentDocuments = mysqlTable("studentDocuments", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  fileSize: int("fileSize").notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  uploadedByUserId: int("uploadedByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  studentIndex: index("studentDocuments_student_idx").on(table.studentId, table.createdAt),
  uploaderIndex: index("studentDocuments_uploader_idx").on(table.uploadedByUserId, table.createdAt),
}));

export const studentProfileHistory = mysqlTable("studentProfileHistory", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  actorUserId: int("actorUserId").notNull(),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  changesJson: text("changesJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  studentHistoryIndex: index("studentProfileHistory_student_idx").on(table.studentId, table.createdAt),
  actorHistoryIndex: index("studentProfileHistory_actor_idx").on(table.actorUserId, table.createdAt),
}));

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

/**
 * Scheduled lesson instances. These rows are created and assigned by admin
 * workflows; Teacher T0 may only read rows whose teacherId is their own user id.
 */
export const classSessions = mysqlTable("classSessions", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  courseName: varchar("courseName", { length: 180 }).notNull(),
  teacherId: int("teacherId").notNull(),
  studentId: int("studentId").notNull(),
  scheduledFor: date("scheduledFor").notNull(),
  startsAt: varchar("startsAt", { length: 8 }).notNull(),
  endsAt: varchar("endsAt", { length: 8 }).notNull(),
  room: varchar("room", { length: 120 }),
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled"]).default("scheduled").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  teacherScheduleIndex: index("classSessions_teacher_schedule_idx").on(table.teacherId, table.scheduledFor),
  studentScheduleIndex: index("classSessions_student_schedule_idx").on(table.studentId, table.scheduledFor),
}));

/** One attendance state per student for each scheduled lesson instance. */
export const attendanceRecords = mysqlTable("attendanceRecords", {
  id: int("id").autoincrement().primaryKey(),
  classSessionId: int("classSessionId").notNull(),
  studentId: int("studentId").notNull(),
  status: mysqlEnum("status", ["present", "absent", "late", "excused"]).default("present").notNull(),
  method: mysqlEnum("method", ["manual", "qr"]).default("manual").notNull(),
  note: text("note"),
  markedByTeacherId: int("markedByTeacherId").notNull(),
  markedAt: timestamp("markedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  sessionStudentUnique: uniqueIndex("attendanceRecords_session_student_unique").on(table.classSessionId, table.studentId),
  sessionIndex: index("attendanceRecords_session_idx").on(table.classSessionId),
  studentIndex: index("attendanceRecords_student_idx").on(table.studentId, table.markedAt),
}));

/** Teacher-entered assessment result for a student in an assigned lesson instance. */
export const grades = mysqlTable("grades", {
  id: int("id").autoincrement().primaryKey(),
  classSessionId: int("classSessionId").notNull(),
  studentId: int("studentId").notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  score: int("score").notNull(),
  maxScore: int("maxScore").notNull(),
  feedback: text("feedback"),
  isPublished: boolean("isPublished").default(false).notNull(),
  publishedAt: timestamp("publishedAt"),
  gradedByTeacherId: int("gradedByTeacherId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  sessionStudentTitleUnique: uniqueIndex("grades_session_student_title_unique").on(table.classSessionId, table.studentId, table.title),
  sessionIndex: index("grades_session_idx").on(table.classSessionId),
  studentPublishedIndex: index("grades_student_published_idx").on(table.studentId, table.isPublished, table.publishedAt),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserFormSection = typeof userFormSections.$inferSelect;
export type UserFormField = typeof userFormFields.$inferSelect;
export type UserProfileValue = typeof userProfileValues.$inferSelect;
export type Program = typeof programs.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type TeamProfile = typeof teamProfiles.$inferSelect;
export type PublicMedia = typeof publicMedia.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type AuditLogArchive = typeof auditLogArchives.$inferSelect;
export type StudentProfile = typeof studentProfiles.$inferSelect;
export type StudentDocument = typeof studentDocuments.$inferSelect;
export type StudentProfileHistory = typeof studentProfileHistory.$inferSelect;
export type ClassSession = typeof classSessions.$inferSelect;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type Grade = typeof grades.$inferSelect;
