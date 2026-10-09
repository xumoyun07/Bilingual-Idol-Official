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
