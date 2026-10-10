-- ============================================================================
-- B5 · ОТКАТ миграции 2026-founder-uniqueness.sql
--
-- СТАТУС: НЕ ПРИМЕНЯЛСЯ. Текст для ревью.
-- Порядок обратный прямому: сначала индексы, потом колонки.
-- ============================================================================

-- ШАГ 1. Снять уникальность e-mail.
DROP INDEX `users_email_normalised_unique` ON `users`;
ALTER TABLE `users` DROP COLUMN `email_normalised`;

-- ШАГ 2. Снять ограничение «один основатель».
DROP INDEX `users_founder_slot_unique` ON `users`;
ALTER TABLE `users` DROP COLUMN `founder_slot`;

-- ШАГ 3. Контроль после отката: колонок и индексов быть не должно.
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
  AND COLUMN_NAME IN ('founder_slot', 'email_normalised');

SELECT INDEX_NAME
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
  AND INDEX_NAME IN ('users_founder_slot_unique', 'users_email_normalised_unique');

-- Замечание: данные не теряются — обе колонки генерируемые и не хранят
-- независимого значения. Откат безопасен в любой момент, кроме окна, когда
-- в таблице успела появиться вторая строка с ролью founder (её тогда
-- придётся разбирать вручную: откат сам её не удалит).
