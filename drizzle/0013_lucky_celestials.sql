ALTER TABLE `announcements` ADD `imageUrl` varchar(1024);--> statement-breakpoint
ALTER TABLE `announcements` ADD `imageStorageKey` varchar(512);--> statement-breakpoint
ALTER TABLE `announcements` ADD `imageAltText` varchar(255);--> statement-breakpoint
CREATE INDEX `announcements_public_page_idx` ON `announcements` (`isPublished`,`publishedAt`,`createdAt`);