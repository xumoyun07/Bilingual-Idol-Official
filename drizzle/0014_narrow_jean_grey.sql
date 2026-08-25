CREATE TABLE `attendanceRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classSessionId` int NOT NULL,
	`studentId` int NOT NULL,
	`status` enum('present','absent','late','excused') NOT NULL DEFAULT 'present',
	`note` text,
	`markedByTeacherId` int NOT NULL,
	`markedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendanceRecords_id` PRIMARY KEY(`id`),
	CONSTRAINT `attendanceRecords_session_student_unique` UNIQUE(`classSessionId`,`studentId`)
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE INDEX `attendanceRecords_session_idx` ON `attendanceRecords` (`classSessionId`);--> statement-breakpoint
CREATE INDEX `attendanceRecords_student_idx` ON `attendanceRecords` (`studentId`,`markedAt`);--> statement-breakpoint
CREATE INDEX `classSessions_teacher_schedule_idx` ON `classSessions` (`teacherId`,`scheduledFor`);--> statement-breakpoint
CREATE INDEX `classSessions_student_schedule_idx` ON `classSessions` (`studentId`,`scheduledFor`);--> statement-breakpoint
CREATE INDEX `grades_session_idx` ON `grades` (`classSessionId`);--> statement-breakpoint
CREATE INDEX `grades_student_published_idx` ON `grades` (`studentId`,`isPublished`,`publishedAt`);