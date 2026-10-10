-- G9: привязка рекомендации placement-теста к реальной программе.
-- Аддитивно и идемпотентно (guarded): повторный запуск ничего не меняет.
SET @ddl := IF((SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'placementTestAttempts' AND COLUMN_NAME = 'recommendedProgramId') = 0,
  'ALTER TABLE `placementTestAttempts` ADD COLUMN `recommendedProgramId` int NULL', 'DO 0');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

SET @ddl := IF((SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'placementTestAttempts' AND INDEX_NAME = 'placementTestAttempts_reco_idx') = 0,
  'CREATE INDEX `placementTestAttempts_reco_idx` ON `placementTestAttempts` (`recommendedProgramId`)', 'DO 0');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

SELECT COUNT(*) AS attempts_total FROM `placementTestAttempts`;