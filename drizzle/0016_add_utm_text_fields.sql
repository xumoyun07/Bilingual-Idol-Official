ALTER TABLE `submissions` MODIFY COLUMN `utmSource` text;
ALTER TABLE `submissions` MODIFY COLUMN `utmMedium` text;
ALTER TABLE `submissions` MODIFY COLUMN `utmCampaign` text;

ALTER TABLE `registrationSubmissions` MODIFY COLUMN `utmSource` text;
ALTER TABLE `registrationSubmissions` MODIFY COLUMN `utmMedium` text;
ALTER TABLE `registrationSubmissions` MODIFY COLUMN `utmCampaign` text;
