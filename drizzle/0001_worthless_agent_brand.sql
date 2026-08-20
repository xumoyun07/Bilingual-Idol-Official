CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(180) NOT NULL,
	`title` varchar(220) NOT NULL,
	`excerpt` text NOT NULL,
	`body` text NOT NULL,
	`category` enum('announcement','event','holiday') NOT NULL DEFAULT 'announcement',
	`isPublished` boolean NOT NULL DEFAULT false,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`),
	CONSTRAINT `announcements_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
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
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `programs_id` PRIMARY KEY(`id`),
	CONSTRAINT `programs_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('enrollment','inquiry') NOT NULL,
	`studentName` varchar(160) NOT NULL,
	`studentAge` int NOT NULL,
	`parentName` varchar(160) NOT NULL,
	`parentEmail` varchar(320) NOT NULL,
	`parentPhone` varchar(64) NOT NULL,
	`programInterest` varchar(180) NOT NULL,
	`preferredSchedule` varchar(180) NOT NULL,
	`message` text,
	`source` varchar(100) NOT NULL DEFAULT 'website',
	`status` enum('new','contacted','interested','enrolled','closed') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
