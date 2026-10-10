-- ============================================================================
-- STAGE 3B · Часть B: согласованные цены студентов
--
-- БЕЗОПАСНО К ПОВТОРНОМУ ЗАПУСКУ. MySQL не умеет ADD COLUMN/CREATE INDEX
-- IF NOT EXISTS, поэтому каждая операция обёрнута в проверку
-- information_schema через prepared statement. Повторный запуск ничего не меняет.
--
-- Только аддитивно: ни одной DROP, ни сужения типов, ни правки существующих колонок.
-- Применяется вручную как root внутри контейнера bilc-db ПОСЛЕ проверенного дампа.
-- Внешних ключей в проекте нет (0 ограничений) — целостность держится кодом.
-- ============================================================================

-- 1. Таблица согласованных цен: одна строка = одна цена для (студент, программа).
CREATE TABLE IF NOT EXISTS `studentPrices` (
  `id` int AUTO_INCREMENT NOT NULL,
  `studentId` int NOT NULL,
  `programId` int NOT NULL,
  `amountMinor` int NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'MYR',
  `status` enum('active','paid','completed','cancelled','superseded') NOT NULL DEFAULT 'active',
  `agreedBy` int NOT NULL,
  `agreedAt` timestamp NOT NULL DEFAULT (now()),
  `staffNote` text,
  `supersededById` int,
  `supersededReason` varchar(255),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `studentPrices_id` PRIMARY KEY (`id`)
);

-- 2. Индексы studentPrices (по одному guarded-блоку на индекс).
SET @ddl := IF((SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'studentPrices' AND INDEX_NAME = 'studentPrices_student_idx') = 0,
  'CREATE INDEX `studentPrices_student_idx` ON `studentPrices` (`studentId`)', 'DO 0');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

SET @ddl := IF((SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'studentPrices' AND INDEX_NAME = 'studentPrices_program_idx') = 0,
  'CREATE INDEX `studentPrices_program_idx` ON `studentPrices` (`programId`)', 'DO 0');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

SET @ddl := IF((SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'studentPrices' AND INDEX_NAME = 'studentPrices_status_idx') = 0,
  'CREATE INDEX `studentPrices_status_idx` ON `studentPrices` (`status`)', 'DO 0');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

-- 3. Генерируемая колонка: 1 только для 'active', NULL для всех остальных.
--    UNIQUE в MySQL допускает сколько угодно NULL, поэтому любое число
--    исторических записей разрешено, а вторая 'active' для той же пары — нет.
SET @ddl := IF((SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'studentPrices' AND COLUMN_NAME = 'active_slot') = 0,
  'ALTER TABLE `studentPrices` ADD COLUMN `active_slot` TINYINT GENERATED ALWAYS AS (IF(`status` = ''active'', 1, NULL)) VIRTUAL',
  'DO 0');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

SET @ddl := IF((SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'studentPrices' AND INDEX_NAME = 'studentPrices_active_unique') = 0,
  'CREATE UNIQUE INDEX `studentPrices_active_unique` ON `studentPrices` (`studentId`, `programId`, `active_slot`)', 'DO 0');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

-- 4. payments: только новые nullable-колонки. Существующие не трогаем и не
--    бэкфиллим; payments.amount (сен) сохраняет прежний смысл для legacy-строк.
SET @ddl := IF((SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'priceId') = 0,
  'ALTER TABLE `payments` ADD COLUMN `priceId` int', 'DO 0');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

SET @ddl := IF((SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'amountMinor') = 0,
  'ALTER TABLE `payments` ADD COLUMN `amountMinor` int', 'DO 0');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

SET @ddl := IF((SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'idempotencyKey') = 0,
  'ALTER TABLE `payments` ADD COLUMN `idempotencyKey` varchar(128)', 'DO 0');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

SET @ddl := IF((SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND INDEX_NAME = 'payments_idempotency_unique') = 0,
  'CREATE UNIQUE INDEX `payments_idempotency_unique` ON `payments` (`idempotencyKey`)', 'DO 0');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

SET @ddl := IF((SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND INDEX_NAME = 'payments_price_idx') = 0,
  'CREATE INDEX `payments_price_idx` ON `payments` (`priceId`)', 'DO 0');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

-- 5. Контроль после применения.
SELECT COUNT(*) AS studentPrices_rows FROM `studentPrices`;
SELECT COUNT(*) AS tables_total FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE();
