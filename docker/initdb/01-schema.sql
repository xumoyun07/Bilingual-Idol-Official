-- =============================================================================
--  BILC - полная схема БД (42 таблицы)
--  Источник истины: drizzle/schema.ts. Регенерация:
--    npx drizzle-kit generate --config=drizzle-docker.config.ts
--
--  Выполняется автоматически при ПЕРВОЙ инициализации контейнера
--  (docker-entrypoint-initdb.d). На существующем volume не перезапускается.
-- =============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';
CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(180) NOT NULL,
	`title` varchar(220) NOT NULL,
	`excerpt` text NOT NULL,
	`body` text NOT NULL,
	`category` enum('announcement','event','holiday') NOT NULL DEFAULT 'announcement',
	`imageUrl` varchar(1024),
	`imageStorageKey` varchar(512),
	`imageAltText` varchar(255),
	`isPublished` boolean NOT NULL DEFAULT false,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`),
	CONSTRAINT `announcements_slug_unique` UNIQUE(`slug`)
);


CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('submitted','documentsReceived','underReview','offerIssued','paymentCompleted','visaProcess','registrationCompleted') NOT NULL DEFAULT 'submitted',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);


CREATE TABLE `learningItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` enum('schedule','material','teacher','payment','report') NOT NULL,
	`title` varchar(220) NOT NULL,
	`description` text NOT NULL,
	`actionUrl` varchar(2048),
	`isPublished` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learningItems_id` PRIMARY KEY(`id`)
);


CREATE TABLE `learningSupportRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('teacher','payment','report') NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`message` text NOT NULL,
	`status` enum('new','reviewed','resolved') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learningSupportRequests_id` PRIMARY KEY(`id`)
);


CREATE TABLE `attendanceRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classSessionId` int NOT NULL,
	`studentId` int NOT NULL,
	`status` enum('present','absent','late','excused') NOT NULL DEFAULT 'present',
	`method` enum('manual','qr') NOT NULL DEFAULT 'manual',
	`note` text,
	`markedByTeacherId` int NOT NULL,
	`markedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendanceRecords_id` PRIMARY KEY(`id`),
	CONSTRAINT `attendanceRecords_session_student_unique` UNIQUE(`classSessionId`,`studentId`)
);


CREATE TABLE `audienceSegments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`filterCriteria` text NOT NULL,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audienceSegments_id` PRIMARY KEY(`id`)
);


CREATE TABLE `auditLogArchives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`originalLogId` int NOT NULL,
	`actorUserId` int,
	`actorRole` varchar(32),
	`action` varchar(100) NOT NULL,
	`targetType` varchar(100) NOT NULL,
	`targetId` varchar(160),
	`targetRole` varchar(32),
	`description` varchar(500) NOT NULL,
	`isSuccess` boolean NOT NULL DEFAULT true,
	`ipAddress` varchar(64),
	`browser` varchar(160),
	`operatingSystem` varchar(160),
	`userAgent` varchar(512),
	`metadataJson` text,
	`createdAt` timestamp NOT NULL,
	`archivedAt` timestamp NOT NULL DEFAULT (now()),
	`archivedByUserId` int,
	CONSTRAINT `auditLogArchives_id` PRIMARY KEY(`id`),
	CONSTRAINT `auditLogArchives_originalLogId_unique` UNIQUE(`originalLogId`)
);


CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int,
	`actorRole` varchar(32),
	`action` varchar(100) NOT NULL,
	`targetType` varchar(100) NOT NULL,
	`targetId` varchar(160),
	`targetRole` varchar(32),
	`description` varchar(500) NOT NULL,
	`isSuccess` boolean NOT NULL DEFAULT true,
	`ipAddress` varchar(64),
	`browser` varchar(160),
	`operatingSystem` varchar(160),
	`userAgent` varchar(512),
	`metadataJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);


CREATE TABLE `blogPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(180) NOT NULL,
	`title` varchar(255) NOT NULL,
	`excerpt` text,
	`body` text NOT NULL,
	`category` varchar(100) NOT NULL DEFAULT 'general',
	`status` enum('draft','published') NOT NULL DEFAULT 'published',
	`imageUrl` varchar(1024),
	`seoTitle` varchar(255),
	`seoDescription` varchar(500),
	`authorId` int,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blogPosts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blogPosts_slug_unique` UNIQUE(`slug`)
);


CREATE TABLE `chatbotFaqEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`question` varchar(300) NOT NULL,
	`answerText` text NOT NULL,
	`keywords` text,
	`relatedCourseId` int,
	`active` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatbotFaqEntries_id` PRIMARY KEY(`id`)
);


CREATE TABLE `classSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`courseName` varchar(180) NOT NULL,
	`teacherId` int NOT NULL,
	`studentId` int NOT NULL,
	`scheduledFor` date NOT NULL,
	`startsAt` varchar(8) NOT NULL,
	`endsAt` varchar(8) NOT NULL,
	`room` varchar(120),
	`status` enum('scheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `classSessions_id` PRIMARY KEY(`id`)
);


CREATE TABLE `contentBlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageSlug` varchar(160) NOT NULL,
	`sectionKey` varchar(100) NOT NULL,
	`blockType` varchar(64) NOT NULL,
	`title` varchar(255),
	`content` text,
	`configJson` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentBlocks_id` PRIMARY KEY(`id`)
);


CREATE TABLE `contentPages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(180) NOT NULL,
	`title` varchar(255) NOT NULL,
	`pageType` enum('site','landingPage') NOT NULL DEFAULT 'landingPage',
	`contentJson` text,
	`seoTitle` varchar(255),
	`seoDescription` varchar(500),
	`isPublished` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentPages_id` PRIMARY KEY(`id`),
	CONSTRAINT `contentPages_slug_unique` UNIQUE(`slug`)
);


CREATE TABLE `enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`programId` int NOT NULL,
	`agreedPrice` int NOT NULL,
	`registrationFee` int NOT NULL DEFAULT 0,
	`placementTestFee` int NOT NULL DEFAULT 0,
	`visaFee` int NOT NULL DEFAULT 0,
	`approvedByUserId` int NOT NULL,
	`approvedAt` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	`status` enum('active','completed','cancelled') NOT NULL DEFAULT 'active',
	`completedAt` timestamp,
	`source` enum('registration_form','enquiry_form','direct_call','whatsapp') NOT NULL,
	`submissionId` int,
	`registrationSubmissionId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`)
);


CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`description` text NOT NULL,
	`eventDate` timestamp,
	`location` varchar(255),
	`imageUrl` varchar(1024),
	`isPublished` boolean NOT NULL DEFAULT true,
	`publishedAt` timestamp,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`),
	CONSTRAINT `events_slug_unique` UNIQUE(`slug`)
);


CREATE TABLE `galleryMedia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`url` varchar(1024) NOT NULL,
	`altText` varchar(255),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `galleryMedia_id` PRIMARY KEY(`id`)
);


CREATE TABLE `grades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classSessionId` int NOT NULL,
	`studentId` int NOT NULL,
	`title` varchar(160) NOT NULL,
	`score` int NOT NULL,
	`maxScore` int NOT NULL,
	`feedback` text,
	`isPublished` boolean NOT NULL DEFAULT false,
	`publishedAt` timestamp,
	`gradedByTeacherId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `grades_id` PRIMARY KEY(`id`),
	CONSTRAINT `grades_session_student_title_unique` UNIQUE(`classSessionId`,`studentId`,`title`)
);


CREATE TABLE `leadSources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(64) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `leadSources_id` PRIMARY KEY(`id`),
	CONSTRAINT `leadSources_code_unique` UNIQUE(`code`)
);


CREATE TABLE `mediaAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('banner','logo','creative','other') NOT NULL,
	`url` varchar(1024) NOT NULL,
	`tags` text,
	`uploadedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mediaAssets_id` PRIMARY KEY(`id`)
);


CREATE TABLE `messageTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`channel` enum('email','sms','whatsapp') NOT NULL,
	`subject` varchar(255),
	`body` text NOT NULL,
	`variables` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messageTemplates_id` PRIMARY KEY(`id`)
);


CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'MYR',
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`provider` varchar(64) NOT NULL DEFAULT 'toyyibpay',
	`transactionReference` varchar(255),
	`paymentMethod` varchar(64),
	`receiptNumber` varchar(120),
	`utmSource` varchar(100),
	`utmMedium` varchar(100),
	`utmCampaign` varchar(100),
	`utmTerm` varchar(100),
	`utmContent` varchar(100),
	`metadataJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);


CREATE TABLE `placementTestAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`guestName` varchar(160),
	`guestEmail` varchar(320),
	`guestPhone` varchar(64),
	`testId` int NOT NULL,
	`answersJson` text NOT NULL,
	`score` int NOT NULL,
	`maxScore` int NOT NULL,
	`cefrLevel` varchar(16) NOT NULL,
	`recommendedCourse` varchar(180) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `placementTestAttempts_id` PRIMARY KEY(`id`)
);


CREATE TABLE `placementTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(160) NOT NULL,
	`language` varchar(80) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`questionsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `placementTests_id` PRIMARY KEY(`id`)
);


CREATE TABLE `programs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`title` varchar(180) NOT NULL,
	`language` varchar(80) NOT NULL,
	`category` varchar(100) NOT NULL,
	`ageGroup` varchar(100) NOT NULL,
	`level` varchar(100) NOT NULL,
	`duration` varchar(120) NOT NULL,
	`schedule` varchar(180) NOT NULL,
	`fees` varchar(180) NOT NULL,
	`description` text NOT NULL,
	`faqJson` text,
	`outcomes` text,
	`imageUrl` varchar(1024),
	`ctaLabel` varchar(100),
	`ctaUrl` varchar(512),
	`seoTitle` varchar(255),
	`seoDescription` varchar(500),
	`seatsEnrolled` int NOT NULL DEFAULT 0,
	`teacherId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `programs_id` PRIMARY KEY(`id`),
	CONSTRAINT `programs_slug_unique` UNIQUE(`slug`)
);


CREATE TABLE `promotions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`title` varchar(255),
	`description` text,
	`discountType` enum('percentage','fixed') NOT NULL,
	`discountValue` int NOT NULL,
	`scope` varchar(80) NOT NULL DEFAULT 'all',
	`maxUses` int,
	`usedCount` int NOT NULL DEFAULT 0,
	`startsAt` timestamp,
	`expiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promotions_id` PRIMARY KEY(`id`),
	CONSTRAINT `promotions_code_unique` UNIQUE(`code`)
);


CREATE TABLE `publicMedia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slot` varchar(80) NOT NULL,
	`label` varchar(160) NOT NULL,
	`kind` enum('image','video') NOT NULL,
	`altText` varchar(255) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`fileSize` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`publicUrl` varchar(1024) NOT NULL,
	`isPublished` boolean NOT NULL DEFAULT true,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `publicMedia_id` PRIMARY KEY(`id`),
	CONSTRAINT `publicMedia_slot_unique` UNIQUE(`slot`)
);


CREATE TABLE `registrationSubmissionValues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` int NOT NULL,
	`fieldId` int NOT NULL,
	`value` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `registrationSubmissionValues_id` PRIMARY KEY(`id`)
);


CREATE TABLE `registrationSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`programId` int,
	`programInterest` varchar(180) NOT NULL,
	`applicantCategory` varchar(80) NOT NULL,
	`fullName` varchar(160) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(64) NOT NULL,
	`status` enum('new','routed','accountCreated','rejected','contacted','meeting_scheduled','agreed') NOT NULL DEFAULT 'new',
	`assignedToUserId` int,
	`utmSource` varchar(100),
	`utmMedium` varchar(100),
	`utmCampaign` varchar(100),
	`utmTerm` varchar(100),
	`utmContent` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `registrationSubmissions_id` PRIMARY KEY(`id`)
);


CREATE TABLE `siteSettings` (
	`key` varchar(80) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteSettings_key` PRIMARY KEY(`key`)
);


CREATE TABLE `socialLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` enum('instagram','tiktok','facebook','telegram','other') NOT NULL,
	`url` varchar(512) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`order` int NOT NULL DEFAULT 0,
	CONSTRAINT `socialLinks_id` PRIMARY KEY(`id`)
);


CREATE TABLE `studentDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`fileSize` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`uploadedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studentDocuments_id` PRIMARY KEY(`id`)
);


CREATE TABLE `studentProfileHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`changesJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studentProfileHistory_id` PRIMARY KEY(`id`)
);


CREATE TABLE `studentProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`guardianName` varchar(160),
	`guardianPhone` varchar(64),
	`contactEmail` varchar(320),
	`dateOfBirth` date,
	`address` text,
	`notes` text,
	`attendedSessions` int NOT NULL DEFAULT 0,
	`totalSessions` int NOT NULL DEFAULT 0,
	`currentLevel` varchar(120),
	`courseName` varchar(180),
	`courseCode` varchar(80),
	`courseStartDate` date,
	`courseEndDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studentProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `studentProfiles_user_unique` UNIQUE(`userId`)
);


CREATE TABLE `submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('enrollment','inquiry') NOT NULL,
	`reasonType` enum('general','consultation','campusTour') NOT NULL DEFAULT 'general',
	`studentName` varchar(160) NOT NULL,
	`studentAge` int NOT NULL,
	`parentName` varchar(160) NOT NULL,
	`parentEmail` varchar(320) NOT NULL,
	`parentPhone` varchar(64) NOT NULL,
	`programId` int,
	`programInterest` varchar(180) NOT NULL,
	`preferredSchedule` varchar(180) NOT NULL,
	`message` text,
	`source` varchar(100) NOT NULL DEFAULT 'website',
	`status` enum('new','contacted','meeting_scheduled','agreed','account_created','rejected','interested','enrolled','closed') NOT NULL DEFAULT 'new',
	`utmSource` varchar(100),
	`utmMedium` varchar(100),
	`utmCampaign` varchar(100),
	`utmTerm` varchar(100),
	`utmContent` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
);


CREATE TABLE `teamProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`role` varchar(160) NOT NULL,
	`languages` varchar(320) NOT NULL,
	`bio` text NOT NULL,
	`isPublished` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teamProfiles_id` PRIMARY KEY(`id`)
);


CREATE TABLE `testimonials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorName` varchar(160) NOT NULL,
	`relation` varchar(100) NOT NULL,
	`quote` text NOT NULL,
	`rating` int NOT NULL,
	`approved` boolean NOT NULL DEFAULT false,
	`consentConfirmed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`)
);


CREATE TABLE `translations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` varchar(160) NOT NULL,
	`languageCode` varchar(16) NOT NULL,
	`fieldKey` varchar(80) NOT NULL,
	`translatedValue` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `translations_id` PRIMARY KEY(`id`),
	CONSTRAINT `translations_unique_idx` UNIQUE(`entityType`,`entityId`,`languageCode`,`fieldKey`)
);


CREATE TABLE `userFormFields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(80) NOT NULL,
	`label` varchar(160) NOT NULL,
	`fieldType` enum('text','textarea','number','date','dropdown','checkbox','file') NOT NULL,
	`collectionStage` enum('atRegistration','atFirstLogin') NOT NULL DEFAULT 'atFirstLogin',
	`isRequired` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`placeholder` varchar(255),
	`optionsJson` text,
	`sectionId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userFormFields_id` PRIMARY KEY(`id`),
	CONSTRAINT `userFormFields_key_unique` UNIQUE(`key`)
);


CREATE TABLE `userFormSections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(160) NOT NULL,
	`icon` varchar(64) NOT NULL DEFAULT 'ClipboardList',
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userFormSections_id` PRIMARY KEY(`id`)
);


CREATE TABLE `userProfileValues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fieldId` int NOT NULL,
	`value` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProfileValues_id` PRIMARY KEY(`id`),
	CONSTRAINT `userProfileValues_user_field_unique` UNIQUE(`userId`,`fieldId`)
);


CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`passwordHash` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`loginMethod` varchar(64),
	`role` enum('user','student','teacher','marketing','admin','super_admin','founder') NOT NULL DEFAULT 'student',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	`sessionVersion` int NOT NULL DEFAULT 1,
	`isOtp` boolean NOT NULL DEFAULT false,
	`otpCreatedAt` timestamp,
	`failedAttempts` int NOT NULL DEFAULT 0,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);


CREATE TABLE `whatsappEntryPoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`label` varchar(160) NOT NULL,
	`whatsappNumber` varchar(64) NOT NULL,
	`prefilledMessage` text,
	`order` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `whatsappEntryPoints_id` PRIMARY KEY(`id`)
);


CREATE INDEX `announcements_public_page_idx` ON `announcements` (`isPublished`,`publishedAt`,`createdAt`);

CREATE INDEX `attendanceRecords_session_idx` ON `attendanceRecords` (`classSessionId`);

CREATE INDEX `attendanceRecords_student_idx` ON `attendanceRecords` (`studentId`,`markedAt`);

CREATE INDEX `auditLogArchives_archivedAt_idx` ON `auditLogArchives` (`archivedAt`);

CREATE INDEX `auditLogArchives_createdAt_idx` ON `auditLogArchives` (`createdAt`);

CREATE INDEX `auditLogArchives_actor_idx` ON `auditLogArchives` (`actorUserId`,`createdAt`);

CREATE INDEX `auditLogArchives_action_idx` ON `auditLogArchives` (`action`,`createdAt`);

CREATE INDEX `auditLogArchives_targetRole_idx` ON `auditLogArchives` (`targetRole`,`createdAt`);

CREATE INDEX `auditLogs_createdAt_idx` ON `auditLogs` (`createdAt`);

CREATE INDEX `auditLogs_actor_idx` ON `auditLogs` (`actorUserId`,`createdAt`);

CREATE INDEX `auditLogs_actorRole_idx` ON `auditLogs` (`actorRole`,`createdAt`);

CREATE INDEX `auditLogs_action_idx` ON `auditLogs` (`action`,`createdAt`);

CREATE INDEX `auditLogs_target_idx` ON `auditLogs` (`targetType`,`targetId`);

CREATE INDEX `auditLogs_targetRole_idx` ON `auditLogs` (`targetRole`,`createdAt`);

CREATE INDEX `auditLogs_success_idx` ON `auditLogs` (`isSuccess`,`createdAt`);

CREATE INDEX `auditLogs_ip_idx` ON `auditLogs` (`ipAddress`,`createdAt`);

CREATE INDEX `classSessions_teacher_schedule_idx` ON `classSessions` (`teacherId`,`scheduledFor`);

CREATE INDEX `classSessions_student_schedule_idx` ON `classSessions` (`studentId`,`scheduledFor`);

CREATE INDEX `contentBlocks_pageSlug_idx` ON `contentBlocks` (`pageSlug`);

CREATE INDEX `enrollments_user_idx` ON `enrollments` (`userId`);

CREATE INDEX `enrollments_program_idx` ON `enrollments` (`programId`);

CREATE INDEX `grades_session_idx` ON `grades` (`classSessionId`);

CREATE INDEX `grades_student_published_idx` ON `grades` (`studentId`,`isPublished`,`publishedAt`);

CREATE INDEX `publicMedia_public_idx` ON `publicMedia` (`isPublished`,`kind`);

CREATE INDEX `publicMedia_creator_idx` ON `publicMedia` (`createdByUserId`,`updatedAt`);

CREATE INDEX `studentDocuments_student_idx` ON `studentDocuments` (`studentId`,`createdAt`);

CREATE INDEX `studentDocuments_uploader_idx` ON `studentDocuments` (`uploadedByUserId`,`createdAt`);

CREATE INDEX `studentProfileHistory_student_idx` ON `studentProfileHistory` (`studentId`,`createdAt`);

CREATE INDEX `studentProfileHistory_actor_idx` ON `studentProfileHistory` (`actorUserId`,`createdAt`);

CREATE INDEX `studentProfiles_level_idx` ON `studentProfiles` (`currentLevel`);

CREATE INDEX `studentProfiles_course_idx` ON `studentProfiles` (`courseName`);