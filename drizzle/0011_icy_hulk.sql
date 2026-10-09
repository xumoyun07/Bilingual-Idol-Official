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
--> statement-breakpoint
CREATE TABLE `studentProfileHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`changesJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studentProfileHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE INDEX `studentDocuments_student_idx` ON `studentDocuments` (`studentId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `studentDocuments_uploader_idx` ON `studentDocuments` (`uploadedByUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `studentProfileHistory_student_idx` ON `studentProfileHistory` (`studentId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `studentProfileHistory_actor_idx` ON `studentProfileHistory` (`actorUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `studentProfiles_level_idx` ON `studentProfiles` (`currentLevel`);--> statement-breakpoint
CREATE INDEX `studentProfiles_course_idx` ON `studentProfiles` (`courseName`);