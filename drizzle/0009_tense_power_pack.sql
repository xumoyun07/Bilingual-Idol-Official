CREATE TABLE `auditLogArchives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`originalLogId` int NOT NULL,
	`actorUserId` int,
	`actorRole` varchar(32),
	`action` varchar(100) NOT NULL,
	`targetType` varchar(100) NOT NULL,
	`targetId` varchar(160),
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
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int,
	`actorRole` varchar(32),
	`action` varchar(100) NOT NULL,
	`targetType` varchar(100) NOT NULL,
	`targetId` varchar(160),
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
--> statement-breakpoint
CREATE INDEX `auditLogArchives_archivedAt_idx` ON `auditLogArchives` (`archivedAt`);--> statement-breakpoint
CREATE INDEX `auditLogArchives_createdAt_idx` ON `auditLogArchives` (`createdAt`);--> statement-breakpoint
CREATE INDEX `auditLogArchives_actor_idx` ON `auditLogArchives` (`actorUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `auditLogArchives_action_idx` ON `auditLogArchives` (`action`,`createdAt`);--> statement-breakpoint
CREATE INDEX `auditLogs_createdAt_idx` ON `auditLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `auditLogs_actor_idx` ON `auditLogs` (`actorUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `auditLogs_actorRole_idx` ON `auditLogs` (`actorRole`,`createdAt`);--> statement-breakpoint
CREATE INDEX `auditLogs_action_idx` ON `auditLogs` (`action`,`createdAt`);--> statement-breakpoint
CREATE INDEX `auditLogs_target_idx` ON `auditLogs` (`targetType`,`targetId`);--> statement-breakpoint
CREATE INDEX `auditLogs_success_idx` ON `auditLogs` (`isSuccess`,`createdAt`);--> statement-breakpoint
CREATE INDEX `auditLogs_ip_idx` ON `auditLogs` (`ipAddress`,`createdAt`);