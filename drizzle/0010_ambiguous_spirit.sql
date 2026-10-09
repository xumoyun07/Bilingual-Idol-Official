ALTER TABLE `auditLogArchives` ADD `targetRole` varchar(32);--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `targetRole` varchar(32);--> statement-breakpoint
ALTER TABLE `auditLogArchives` ADD `targetRole` varchar(32);--> statement-breakpoint
CREATE INDEX `auditLogArchives_targetRole_idx` ON `auditLogArchives` (`targetRole`,`createdAt`);--> statement-breakpoint
CREATE INDEX `auditLogs_targetRole_idx` ON `auditLogs` (`targetRole`,`createdAt`);
