-- =============================================================================
--  BILC - дополнительные индексы под реальные запросы приложения
--
--  01-schema.sql уже создаёт 31 индекс и 15 UNIQUE-ограничений из drizzle/schema.ts.
--  Здесь только те, которых там нет, но которые нужны путям из server/db.ts.
--  Дубликатов нет: каждый индекс обоснован конкретной функцией ниже.
--
--  MySQL 8 не поддерживает CREATE INDEX IF NOT EXISTS (это MariaDB),
--  поэтому скрипт рассчитан на однократный запуск при инициализации volume.
-- =============================================================================

-- getUserByEmail() — вход по e-mail. openId уникален, email — нет.
CREATE INDEX `users_email_idx` ON `users` (`email`);

-- listManagedUsers() — фильтр по роли и активности в админке.
CREATE INDEX `users_role_active_idx` ON `users` (`role`, `isActive`);

-- listSubmissions() — список лидов с фильтром по статусу и сортировкой по дате.
CREATE INDEX `submissions_status_created_idx` ON `submissions` (`status`, `createdAt`);
CREATE INDEX `submissions_created_idx` ON `submissions` (`createdAt`);

-- listRegistrationSubmissions() — очередь регистрационных заявок.
CREATE INDEX `registrationSubmissions_status_created_idx` ON `registrationSubmissions` (`status`, `createdAt`);

-- listPayments(userId) и сверка статуса по пользователю.
CREATE INDEX `payments_user_status_idx` ON `payments` (`userId`, `status`);
-- paymentsWebhook.ts ищет платёж по billplzId/transactionReference (идемпотентность вебхука).
CREATE INDEX `payments_transactionReference_idx` ON `payments` (`transactionReference`);

-- listPublicPrograms() — публичный каталог: только активные, сортировка по slug.
CREATE INDEX `programs_active_slug_idx` ON `programs` (`isActive`, `slug`);

-- listPlacementTestAttempts(userId) — история попыток студента.
CREATE INDEX `placementTestAttempts_user_created_idx` ON `placementTestAttempts` (`userId`, `createdAt`);

-- listApplications(userId) — трекер заявок студента.
CREATE INDEX `applications_user_status_idx` ON `applications` (`userId`, `status`);

-- Публичный список блога: только опубликованные, сортировка по дате.
CREATE INDEX `blogPosts_status_published_idx` ON `blogPosts` (`status`, `publishedAt`);

-- Список зачислений с фильтром по статусу (админка, отчёты).
CREATE INDEX `enrollments_status_created_idx` ON `enrollments` (`status`, `createdAt`);

-- Ротация аудита старше 12 месяцев: выборка по дате без фильтра актора.
CREATE INDEX `auditLogs_createdAt_action_idx` ON `auditLogs` (`createdAt`, `action`);

-- getPublicProgram(slug) — публичная страница курса помимо UNIQUE(slug).
CREATE INDEX `programs_public_lookup_idx` ON `programs` (`slug`, `isActive`);
