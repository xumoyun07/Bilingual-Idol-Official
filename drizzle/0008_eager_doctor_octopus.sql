CREATE TABLE `userFormFields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(80) NOT NULL,
	`label` varchar(160) NOT NULL,
	`fieldType` enum('text','textarea','number','date','dropdown','checkbox') NOT NULL,
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
--> statement-breakpoint
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
--> statement-breakpoint
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
