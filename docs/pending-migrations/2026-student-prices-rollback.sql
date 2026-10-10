-- ============================================================================
-- STAGE 3B · Часть B: ОТКАТ миграции 2026-student-prices.sql
--
-- Порядок обратный прямому: сначала индексы, потом колонки, потом таблица.
-- Откат УДАЛЯЕТ согласованные цены — сначала убедитесь, что они никому не нужны.
-- ============================================================================

-- 1. payments: снять индексы и новые колонки.
DROP INDEX `payments_price_idx` ON `payments`;
DROP INDEX `payments_idempotency_unique` ON `payments`;
ALTER TABLE `payments` DROP COLUMN `idempotencyKey`;
ALTER TABLE `payments` DROP COLUMN `amountMinor`;
ALTER TABLE `payments` DROP COLUMN `priceId`;

-- 2. studentPrices: снять уникальный индекс, генерируемую колонку и таблицу.
DROP INDEX `studentPrices_active_unique` ON `studentPrices`;
ALTER TABLE `studentPrices` DROP COLUMN `active_slot`;
DROP TABLE `studentPrices`;

-- 3. Контроль после отката: объектов быть не должно.
SELECT COUNT(*) AS studentPrices_left FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'studentPrices';
SELECT COUNT(*) AS new_payment_columns_left FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments'
    AND COLUMN_NAME IN ('priceId','amountMinor','idempotencyKey');
