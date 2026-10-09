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
