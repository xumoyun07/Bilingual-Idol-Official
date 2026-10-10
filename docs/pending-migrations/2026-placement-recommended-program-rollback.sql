-- Откат G9-миграции (обратный порядок).
DROP INDEX `placementTestAttempts_reco_idx` ON `placementTestAttempts`;
ALTER TABLE `placementTestAttempts` DROP COLUMN `recommendedProgramId`;