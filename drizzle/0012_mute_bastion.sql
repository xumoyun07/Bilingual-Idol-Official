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
--> statement-breakpoint
CREATE INDEX `publicMedia_public_idx` ON `publicMedia` (`isPublished`,`kind`);--> statement-breakpoint
CREATE INDEX `publicMedia_creator_idx` ON `publicMedia` (`createdByUserId`,`updatedAt`);