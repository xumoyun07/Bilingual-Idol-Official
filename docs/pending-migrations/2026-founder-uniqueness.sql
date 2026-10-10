-- ============================================================================
-- B5 · Миграция: единственный основатель + уникальный e-mail без учёта регистра
--
-- СТАТУС: НЕ ПРИМЕНЕНА. Это только текст для ревью (фаза A, запись в БД запрещена).
-- Применять только в фазе B, после проверки схемы реальной БД и проверенной
-- резервной копии.
--
-- Целевые СУБД: MySQL 8.0+ / 8.4 (в проекте — MySQL 8.4).
-- Таблица `users` сегодня имеет только `PRIMARY KEY(id)` и `UNIQUE(openId)`.
-- Ни одного FOREIGN KEY в схеме нет (0 ограничений).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ШАГ 0. Обязательные проверки ДО применения. Любая непустая выборка = СТОП.
-- ---------------------------------------------------------------------------

-- 0.1 Сколько учётных записей с ролью founder. Ожидается ровно 1.
SELECT COUNT(*) AS founder_count FROM `users` WHERE `role` = 'founder';

-- 0.2 Совпадает ли адрес основателя с FOUNDER_EMAIL (значение подставить из env).
SELECT `id`, `email`, `role` FROM `users` WHERE `role` = 'founder';

-- 0.3 Дубликаты e-mail без учёта регистра и с обрезкой пробелов. Ожидается пусто.
SELECT LOWER(TRIM(`email`)) AS normalised_email, COUNT(*) AS rows_count
FROM `users`
WHERE `email` IS NOT NULL AND TRIM(`email`) <> ''
GROUP BY normalised_email
HAVING COUNT(*) > 1;

-- 0.4 Уже существующий уникальный индекс по email (если есть — шаг 2 не нужен).
SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users';

-- 0.5 Проверенная резервная копия ПЕРЕД любыми изменениями:
--     mysqldump --single-transaction --routines --triggers <db> > users-backup.sql

-- ---------------------------------------------------------------------------
-- ШАГ 1. Ровно один основатель.
-- ---------------------------------------------------------------------------
-- Генерируемая колонка даёт 1 только строкам с ролью founder и NULL всем
-- остальным. UNIQUE-индекс в MySQL допускает сколько угодно NULL, поэтому
-- вторая строка с ролью founder становится невозможной на уровне схемы.
-- ---------------------------------------------------------------------------
ALTER TABLE `users`
  ADD COLUMN `founder_slot` TINYINT
    GENERATED ALWAYS AS (IF(`role` = 'founder', 1, NULL)) VIRTUAL;

CREATE UNIQUE INDEX `users_founder_slot_unique` ON `users` (`founder_slot`);

-- ---------------------------------------------------------------------------
-- ШАГ 2. Уникальность e-mail без учёта регистра и без пустых значений.
-- ---------------------------------------------------------------------------
-- NULLIF(...,'') превращает пустую строку в NULL, чтобы несколько учётных
-- записей без адреса не конфликтовали друг с другом.
-- ---------------------------------------------------------------------------
ALTER TABLE `users`
  ADD COLUMN `email_normalised` VARCHAR(320)
    GENERATED ALWAYS AS (NULLIF(LOWER(TRIM(`email`)), '')) VIRTUAL;

CREATE UNIQUE INDEX `users_email_normalised_unique` ON `users` (`email_normalised`);

-- ---------------------------------------------------------------------------
-- ШАГ 3. Контроль после применения.
-- ---------------------------------------------------------------------------
SELECT COUNT(*) AS founder_count FROM `users` WHERE `role` = 'founder';
SELECT COUNT(*) AS founder_slots FROM `users` WHERE `founder_slot` = 1;
SHOW INDEX FROM `users` WHERE Key_name IN ('users_founder_slot_unique', 'users_email_normalised_unique');
