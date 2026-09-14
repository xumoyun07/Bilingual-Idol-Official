# Bilingual Idol Language Centre (BILC) — Отчет о текущем состоянии проекта (Master Project Handover State)

Этот документ представляет собой исчерпывающую техническую спецификацию и отчет о **фактическом текущем состоянии** кодовой базы и базы данных платформы **Bilingual Idol Language Centre (Pusat Bahasa Bilingual Idol)**. Он предназначен для передачи другому ассистенту, у которого нет прямого доступа к репозиторию, чтобы он мог полностью понять систему, её логику, структуру таблиц, API-эндпоинты и микроинтерфейсные решения, не заглядывая в исходный код.

---

## 1. Концепция и Стратегическое позиционирование бренда

**Bilingual Idol Language Centre (BILC)** — премиальный языковой центр в Куала-Лумпуре, Малайзия.
*   **Государственная аккредитация:** Действующая лицензия Министерства высшего образования Малайзии (KPT/MOHE) № **WZ10104**.
*   **Локация:** Элитный дипломатический квартал Pavilion Embassy, Menara G-Vestor, Jalan Ampang (в 2 минутах от башен-близнецов Petronas / KLCC).
*   **Главный девиз:** *«Where Language Meets Luxury»* (Точка пересечения языка и роскоши).
*   **Образовательный слоган:** *«Learn Today... Lead Tomorrow»*.
*   **Миссия:** Предоставление высококлассного языкового образования, объединяющего академическую строгость с приватной атмосферой закрытого клуба.

---

## 2. Хронология Разработки и Промптов (История проекта)

Платформа развивалась через серию последовательных итераций, направленных на повышение безопасности, надежности типизации, глубину локализации и утонченность микроUX:

1.  **Первоначальное развертывание:** Была выстроена базовая архитектура full-stack монорепозитория на основе Express + Vite + React + TypeScript с обменом данными через tRPC и хранением в СУБД MySQL под управлением Drizzle ORM.
2.  **Запуск ролевой модели (RBAC) и логов безопасности:**
    *   Реализована строгая многоуровневая система ролей пользователей.
    *   Интегрировано автоматическое ведение журнала аудита (`audit_logs`) для записи критических административных и пользовательских сессий.
    *   Внедрена фоновая процедура ротации логов (`scheduledAuditRotation`), которая автоматически переносит старые логи в таблицу архива и отправляет асинхронные уведомления в случае сбоев.
3.  **Глубокая интернационализация (RTL/LTR) и адаптивная верстка:**
    *   Платформа полностью локализована на 3 языка: английский (`en`), малайский (`ms`), арабский (`ar`).
    *   Реализовано полное зеркалирование интерфейса в режиме RTL, замена физических CSS-свойств на логические, оптимизация типографики для арабской письменности, а также защита однонаправленных элементов (номера телефонов, цены) с помощью тегов `<bdi>`.
4.  **Удаление устаревших модулей (Learning Hub Clean-up):**
    *   Устаревший модуль "Learning Hub" (не имеющий привязки к реальной структуре учебного процесса) был полностью демонтирован из публичного доступа.
    *   Все связанные маршруты tRPC были вычищены, а эндпоинты создания программ безопасности были переименованы (`addProgram`, `addTeamProfile`), чтобы предотвратить обход защитных механизмов.
5.  **Финальный рефакторинг и стабилизация (Последние изменения):**
    *   **Автозаполнение форм:** Поле логина на странице `FounderLogin.tsx` приведено к стандарту `autoComplete="email"`.
    *   **Премиальные стили личного кабинета:** Контейнеры личных страниц студентов снабжены классами `.member-page` и `.blue-member-page` в соответствии с визуальным стилем бренда.
    *   **Типобезопасность динамических полей:** В `server/db.ts` добавлен строгий тип `UserSystemFieldInput` для бесконфликтной обработки полей `"email"` и их маппинга в `"nickname"` на уровне хранения в БД.
    *   Тестовое покрытие успешно проходит на 100% (все 121 тест успешно пройдены), проект компилируется без предупреждений.

---

## 3. Архитектура и Структура каталогов монорепозитория

Платформа представляет собой единый монорепозиторий, разделенный на клиентскую (SPA на React) и серверную (Express-сервер) части.

```
/
├── client/                     # Фронтенд-приложение (Single Page Application)
│   ├── src/
│   │   ├── _core/              # Внутреннее ядро фронтенда (хуки, утилиты)
│   │   │   └── hooks/
│   │   │       └── useAuth.ts  # Хук авторизации и управления сессией
│   │   ├── components/         # Компоненты интерфейса
│   │   │   ├── founder/        # Компоненты консоли основателя
│   │   │   ├── ui/             # Базовые UI-примитивы (кнопки, диалоги, подсказки)
│   │   │   ├── AIChatBox.tsx   # Интерактивный чат-ассистент
│   │   │   ├── BiDi.tsx        # Компонент для защиты RTL/LTR строк
│   │   │   ├── DashboardLayout.tsx # Главный макет личных кабинетов
│   │   │   ├── LanguageSwitcher.tsx # Переключатель языков интерфейса
│   │   │   └── OfficialPriceList2026.tsx # Калькулятор и прайс-лист курсов
│   │   ├── contexts/           # Контексты React (Язык, Тема оформления)
│   │   ├── locales/            # Словари локализации (en, ms, ar)
│   │   ├── pages/              # Страницы приложения (маршруты)
│   │   │   ├── Admin.tsx       # Панель администрирования
│   │   │   ├── FounderLogin.tsx# Авторизация основателя
│   │   │   ├── SuperAdmin.tsx  # Панель супер-администратора
│   │   │   ├── TeacherDashboard.tsx # Личный кабинет преподавателя
│   │   │   ├── UserDashboard.tsx # Личный кабинет студента
│   │   │   └── Home.tsx, About.tsx, Programs.tsx, Contact.tsx...
│   │   ├── App.tsx             # Конфигурация клиентской маршрутизации (wouter)
│   │   └── main.tsx            # Точка монтирования React
│   └── index.html              # Основной HTML-файл с метатегами аккредитации
├── server/                     # Бэкенд-приложение (Express / Node.js)
│   ├── _core/                  # Ядро сервера (утилиты, tRPC-контекст, прокси)
│   │   ├── context.ts          # Контекст tRPC (заполнение ctx.user)
│   │   ├── cookies.ts          # Настройки сессионных кук
│   │   ├── sdk.ts              # Интеграция с системным API и сессиями
│   │   ├── systemRouter.ts     # Базовый системный роутер (health, notifyOwner)
│   │   └── trpc.ts             # Определение процедур и middleware tRPC
│   ├── routers/                # Модульные роутеры tRPC
│   │   ├── audit.ts            # Роутер аудита логов
│   │   ├── content.ts          # Роутер публичного контента и программ
│   │   ├── marketing.ts        # Роутер маркетинговых инструментов и лидов
│   │   ├── media.ts            # Роутер управления медиафайлами
│   │   ├── news.ts             # Роутер управления новостями
│   │   ├── studentAttendance.ts # Роутер посещаемости (для студентов)
│   │   ├── students.ts         # Роутер ведения личных дел студентов (Founder)
│   │   ├── submissions.ts      # Роутер обработки заявок и лидов
│   │   ├── superAdminUsers.ts  # Роутер управления учетными записями (Super Admin)
│   │   ├── teacher.ts          # Роутер классных сессий, оценок и посещаемости
│   │   ├── translation.ts      # Роутер автоматического и динамического перевода
│   │   └── users.ts            # Роутер управления пользователями и полями (Founder)
│   ├── db.ts                   # Логика ORM, inMemory-хранилище (fallback), маппинг полей
│   ├── founderAuth.ts          # Проверка паролей основателя и дефолтные хэши
│   ├── founderIdentity.ts      # Идентификация email основателя
│   ├── userAuth.ts             # Хэширование паролей пользователей (scrypt), пути дашбордов
│   └── server.ts               # Точка входа Express, Vite Dev Middleware
├── drizzle/                    # Директория миграций СУБД
│   └── schema.ts               # Декларативное описание схемы таблиц (Drizzle)
├── docs/                       # Файлы документации
├── metadata.json               # Описание приложения и разрешения фрейма
├── package.json                # Зависимости и скрипты запуска npm
└── vite.config.ts              # Конфигурация сборщика Vite
```

### 3.1. Архитектурный цикл выполнения запросов (Runtime Flow)
1.  **Раздача статики:** При обращении к приложению Express в dev-режиме использует Vite middleware для HMR, а в prod-режиме отдает готовую сборку из папки `dist/`.
2.  **Запросы tRPC:** Все взаимодействие фронтенда с бэкендом типизировано с помощью tRPC.
3.  **Аутентификация по сессиям:** При каждом запросе Middleware на сервере перехватывает куки `COOKIE_NAME`, декодирует токен сессии через `sdk.authenticateRequest`, находит пользователя в базе данных и сохраняет объект `user` в контексте tRPC (`ctx.user`).
4.  **Разделение прав на сервере:** Каждая процедура бэкенда защищена специфичным tRPC-процедурным гвардом (например, `founderProcedure`, `teacherProcedure`). Если роль пользователя не совпадает с требуемой, tRPC выбрасывает ошибку `FORBIDDEN` до выполнения бизнес-логики.

---

## 4. Схема Базы Данных (Спецификация Drizzle ORM)

Все таблицы описаны на уровне Drizzle ORM в файле `/drizzle/schema.ts` и развернуты в MySQL (или эмулируются через строгое in-memory хранилище в `server/db.ts` в случае отсутствия соединения с БД).

### 4.1. Глобальная ролевая модель (User Roles)
Роль пользователя хранится в поле `role` таблицы `users` и определяется типом `mysqlEnum`:
*   `"user"` — Устаревший/базовый зарегистрированный пользователь.
*   `"student"` — Студент центра (имеет доступ к `UserDashboard.tsx` с расписанием и оценками).
*   `"teacher"` — Преподаватель центра (имеет доступ к `TeacherDashboard.tsx` для ведения журнала).
*   `"marketing"` — Маркетолог (управляет лидами, промо-акциями, рассылками).
*   `"admin"` — Администратор (управляет учебным процессом, программами, приемом студентов).
*   `"super_admin"` — Супер-администратор (управляет учетными записями персонала, политиками безопасности).
*   `"founder"` — Основатель бренда (имеет неограниченный доступ ко всем контурам, финансовой аналитике, изменению системных полей).

---

### 4.2. Спецификация Таблиц

#### 1. `users` — Учетные записи пользователей
*   `id`: `int` (Primary Key, Autoincrement)
*   `openId`: `varchar(64)` (Unique, Not Null) — Уникальный идентификатор авторизации
*   `name`: `text` (Nullable) — Имя пользователя
*   `email`: `varchar(320)` (Nullable) — Электронная почта (или имя аккаунта)
*   `passwordHash`: `text` (Nullable) — Хэш пароля (алгоритм `scrypt`)
*   `isActive`: `boolean` (Default: `true`, Not Null) — Статус активности
*   `loginMethod`: `varchar(64)` (Nullable) — Способ авторизации (например, `"email_password"`)
*   `role`: `mysqlEnum` (["user", "student", "teacher", "marketing", "admin", "super_admin", "founder"], Default: `"student"`, Not Null)
*   `createdAt`: `timestamp` (Default: `Now`, Not Null)
*   `updatedAt`: `timestamp` (Default: `Now`, OnUpdateNow, Not Null)
*   `lastSignedIn`: `timestamp` (Default: `Now`, Not Null)

#### 2. `userFormSections` — Разделы динамического конструктора профилей
*   `id`: `int` (Primary Key, Autoincrement)
*   `title`: `varchar(160)` (Not Null) — Название раздела (например, «Личные данные»)
*   `icon`: `varchar(64)` (Default: `"ClipboardList"`, Not Null) — Имя иконки Lucide
*   `sortOrder`: `int` (Default: `0`, Not Null) — Порядок отображения
*   `isActive`: `boolean` (Default: `true`, Not Null)
*   `createdAt` / `updatedAt`: `timestamp`

#### 3. `userFormFields` — Настраиваемые поля профилей
*   `id`: `int` (Primary Key, Autoincrement)
*   `key`: `varchar(80)` (Unique, Not Null) — Уникальный ключ поля (например, `"phone_number"`)
*   `label`: `varchar(160)` (Not Null) — Лейбл для ввода на фронтенде
*   `fieldType`: `mysqlEnum` (["text", "textarea", "number", "date", "dropdown", "checkbox"], Not Null)
*   `isRequired`: `boolean` (Default: `false`, Not Null)
*   `sortOrder`: `int` (Default: `0`, Not Null)
*   `placeholder`: `varchar(255)` (Nullable)
*   `optionsJson`: `text` (Nullable) — Варианты выбора в формате JSON для типа `dropdown`
*   `sectionId`: `int` (Nullable, внешний ключ на `userFormSections`)
*   `isActive`: `boolean` (Default: `true`, Not Null)
*   `createdAt` / `updatedAt`: `timestamp`

#### 4. `userProfileValues` — Значения полей заполненных профилей
*   `id`: `int` (Primary Key, Autoincrement)
*   `userId`: `int` (Not Null)
*   `fieldId`: `int` (Not Null)
*   `value`: `text` (Not Null) — Текстовое значение заполненного поля
*   `createdAt` / `updatedAt`: `timestamp`
*   *Индексы:* Уникальный индекс `userProfileValues_user_field_unique` на связку `(userId, fieldId)`.

#### 5. `programs` — Каталог образовательных программ
*   `id`: `int` (Primary Key, Autoincrement)
*   `slug`: `varchar(160)` (Unique, Not Null) — URL-слаг курса
*   `title`: `varchar(180)` (Not Null) — Название курса
*   `language`: `varchar(80)` (Not Null) — Язык обучения
*   `category`: `varchar(100)` (Not Null) — Категория курса
*   `ageGroup`: `varchar(100)` (Not Null) — Возрастная группа
*   `level`: `varchar(100)` (Not Null) — Уровень
*   `duration`: `varchar(120)` (Not Null) — Продолжительность
*   `schedule`: `varchar(180)` (Not Null) — Расписание
*   `fees`: `varchar(180)` (Not Null) — Стоимость / Сетка оплат
*   `description`: `text` (Not Null) — Текстовое описание
*   `faqJson`: `text` (Nullable) — Массив часто задаваемых вопросов в JSON
*   `outcomes`: `text` (Nullable) — Ожидаемые результаты обучения
*   `imageUrl`: `varchar(1024)` (Nullable) — Ссылка на обложку
*   `ctaLabel` / `ctaUrl`: `varchar` (Nullable) — Настройки кнопки призыва к действию
*   `seoTitle` / `seoDescription`: `varchar` (Nullable) — Свойства поисковой оптимизации
*   `seatsEnrolled`: `int` (Default: `0`, Not Null) — Количество зачисленных студентов
*   `teacherId`: `int` (Nullable) — Назначенный преподаватель
*   `isActive`: `boolean` (Default: `true`, Not Null)
*   `createdAt` / `updatedAt`: `timestamp`

#### 6. `submissions` — Заявки на обучение и лиды с сайта
*   `id`: `int` (Primary Key, Autoincrement)
*   `type`: `mysqlEnum` (["enrollment", "inquiry"], Not Null) — Тип обращения (зачисление / общий запрос)
*   `studentName`: `varchar(160)` (Not Null)
*   `studentAge`: `int` (Not Null)
*   `parentName`: `varchar(160)` (Not Null)
*   `parentEmail`: `varchar(320)` (Not Null)
*   `parentPhone`: `varchar(64)` (Not Null)
*   `programInterest`: `varchar(180)` (Not Null) — Выбранная программа
*   `preferredSchedule`: `varchar(180)` (Not Null) — Пожелания по расписанию
*   `message`: `text` (Nullable)
*   `source`: `varchar(100)` (Default: `"website"`, Not Null) — Источник трафика
*   `status`: `mysqlEnum` (["new", "contacted", "interested", "enrolled", "closed"], Default: `"new"`, Not Null) — Воронка лида
*   `createdAt` / `updatedAt`: `timestamp`

#### 7. `announcements` — Новости и важные уведомления
*   `id`: `int` (Primary Key, Autoincrement)
*   `slug`: `varchar(180)` (Unique, Not Null)
*   `title`: `varchar(220)` (Not Null)
*   `excerpt`: `text` (Not Null) — Краткое описание для карточки новости
*   `body`: `text` (Not Null) — Основной текст в разметке Markdown
*   `category`: `mysqlEnum` (["announcement", "event", "holiday"], Default: `"announcement"`, Not Null)
*   `imageUrl` / `imageStorageKey` / `imageAltText`: `varchar` (Nullable) — Изображение
*   `isPublished`: `boolean` (Default: `false`, Not Null)
*   `publishedAt`: `timestamp` (Nullable)
*   `createdAt` / `updatedAt`: `timestamp`
*   *Индексы:* Составной индекс `announcements_public_page_idx` на `(isPublished, publishedAt, createdAt)` для быстрой постраничной выборки.

#### 8. `testimonials` — Модуль реальных отзывов
*   `id`: `int` (Primary Key, Autoincrement)
*   `authorName`: `varchar(160)` (Not Null) — Имя студента
*   `relation`: `varchar(100)` (Not Null) — Связь (например, «Студент из Узбекистана»)
*   `quote`: `text` (Not Null) — Текст отзыва
*   `rating`: `int` (Not Null) — Оценка (1-5)
*   `approved`: `boolean` (Default: `false`, Not Null) — Одобрено ли для публикации на сайте
*   `consentConfirmed`: `boolean` (Default: `false`, Not Null) — Согласие на обработку персональных данных
*   `createdAt`: `timestamp`

#### 9. `teamProfiles` — Профили преподавателей и команды
*   `id`: `int` (Primary Key, Autoincrement)
*   `name`: `varchar(160)` (Not Null)
*   `role`: `varchar(160)` (Not Null) — Должность
*   `languages`: `varchar(320)` (Not Null) — Владение языками
*   `bio`: `text` (Not Null) — Биография
*   `isPublished`: `boolean` (Default: `false`, Not Null)
*   `sortOrder`: `int` (Default: `0`, Not Null)
*   `createdAt` / `updatedAt`: `timestamp`

#### 10. `siteSettings` — Ключевые системные настройки (KeyValue)
*   `key`: `varchar(80)` (Primary Key)
*   `value`: `text` (Not Null)
*   `updatedAt`: `timestamp`

#### 11. `publicMedia` — Интерактивная медиабиблиотека
*   `id`: `int` (Primary Key, Autoincrement)
*   `slot`: `varchar(80)` (Unique, Not Null) — Уникальный слот использования (например, `"home_hero_video"`)
*   `label`: `varchar(160)` (Not Null) — Человекочитаемое название
*   `kind`: `mysqlEnum` (["image", "video"], Not Null)
*   `altText`: `varchar(255)` (Not Null) — Доступное описание для скринридеров
*   `mimeType`: `varchar(100)` (Not Null)
*   `fileSize`: `int` (Not Null)
*   `storageKey`: `varchar(512)` (Not Null) — Ключ хранения файла в облаке
*   `publicUrl`: `varchar(1024)` (Not Null) — Публичная ссылка
*   `isPublished`: `boolean` (Default: `true`, Not Null)
*   `createdByUserId`: `int` (Not Null)
*   `createdAt` / `updatedAt`: `timestamp`
*   *Индексы:* Индексы на публикацию (`isPublished, kind`) и создателя (`createdByUserId, updatedAt`).

#### 12. `auditLogs` — Журнал системного аудита
*   `id`: `int` (Primary Key, Autoincrement)
*   `actorUserId`: `int` (Nullable) — Кто совершил действие
*   `actorRole`: `varchar(32)` (Nullable) — Роль совершившего действие
*   `action`: `varchar(100)` (Not Null) — Название операции
*   `targetType`: `varchar(100)` (Not Null) — Тип измененной сущности
*   `targetId`: `varchar(160)` (Nullable) — Идентификатор измененной сущности
*   `targetRole`: `varchar(32)` (Nullable) — Роль затронутого пользователя (при изменении учетных записей)
*   `description`: `varchar(500)` (Not Null) — Полное текстовое описание события
*   `isSuccess`: `boolean` (Default: `true`, Not Null) — Статус успешности операции
*   `ipAddress`: `varchar(64)` (Nullable)
*   `browser` / `operatingSystem` / `userAgent`: (Nullable) — Данные окружения
*   `metadataJson`: `text` (Nullable) — Дополнительные системные данные в формате JSON
*   `createdAt`: `timestamp`
*   *Индексы:* Полноценное индексирование по всем ключевым полям (`createdAt`, `actorUserId`, `action`, `targetType`, `isSuccess`, `ipAddress`) для ускоренной фильтрации сотен тысяч записей.

#### 13. `auditLogArchives` — Архив журнала аудита
*   Полный дубликат полей `auditLogs`, дополненный полями:
    *   `originalLogId`: `int` (Unique, Not Null) — Исходный ID лога
    *   `archivedAt`: `timestamp` (Default: `Now`, Not Null) — Время архивации
    *   `archivedByUserId`: `int` (Nullable) — ID администратора или фонового процесса

#### 14. `studentProfiles` — Личные дела студентов (Founder-контур)
*   `id`: `int` (Primary Key, Autoincrement)
*   `userId`: `int` (Not Null, Unique) — Внешний ключ на учетную запись `users`
*   `guardianName`: `varchar(160)` (Nullable) — Имя опекуна
*   `guardianPhone`: `varchar(64)` (Nullable) — Телефон опекуна
*   `contactEmail`: `varchar(320)` (Nullable) — Контактный email
*   `dateOfBirth`: `date` (Nullable)
*   `address`: `text` (Nullable)
*   `notes`: `text` (Nullable)
*   `attendedSessions`: `int` (Default: `0`, Not Null) — Посещенные занятия
*   `totalSessions`: `int` (Default: `0`, Not Null) — Всего назначено занятий
*   `currentLevel`: `varchar(120)` (Nullable) — Текущий языковой уровень студента
*   `courseName` / `courseCode`: `varchar` (Nullable) — Название и код курса
*   `courseStartDate` / `courseEndDate`: `date` (Nullable) — Границы учебного контракта
*   `createdAt` / `updatedAt`: `timestamp`

#### 15. `studentDocuments` — Документы и визовые файлы студентов
*   `id`: `int` (Primary Key, Autoincrement)
*   `studentId`: `int` (Not Null, ссылка на `studentProfiles`)
*   `fileName` / `mimeType` / `fileSize` / `storageKey`: (Not Null) — Свойства файла
*   `uploadedByUserId`: `int` (Not Null)
*   `createdAt`: `timestamp`

#### 16. `studentProfileHistory` — История изменений дел студентов
*   `id`: `int` (Primary Key, Autoincrement)
*   `studentId`: `int` (Not Null)
*   `actorUserId`: `int` (Not Null)
*   `eventType`: `varchar(80)` (Not Null) — Тип операции (например, `"level_update"`)
*   `changesJson`: `text` (Nullable) — JSON-слепок измененных полей
*   `createdAt`: `timestamp`

#### 17. `classSessions` — Расписание занятий и академические сессии
*   `id`: `int` (Primary Key, Autoincrement)
*   `title`: `varchar(180)` (Not Null) — Тема урока
*   `courseName`: `varchar(180)` (Not Null) — Программа
*   `teacherId`: `int` (Not Null, внешняя ссылка на `users`) — Преподаватель
*   `studentId`: `int` (Not Null, внешняя ссылка на `users`) — Студент
*   `scheduledFor`: `date` (Not Null) — Дата проведения
*   `startsAt` / `endsAt`: `varchar(8)` (Not Null) — Время начала и конца (например, `"10:00"`)
*   `room`: `varchar(120)` (Nullable) — Номер смарт-класса
*   `status`: `mysqlEnum` (["scheduled", "completed", "cancelled"], Default: `"scheduled"`, Not Null)
*   `createdAt` / `updatedAt`: `timestamp`

#### 18. `attendanceRecords` — Посещаемость занятий
*   `id`: `int` (Primary Key, Autoincrement)
*   `classSessionId`: `int` (Not Null, ссылка на `classSessions`)
*   `studentId`: `int` (Not Null, ссылка на `users`)
*   `status`: `mysqlEnum` (["present", "absent", "late", "excused"], Default: `"present"`, Not Null)
*   `method`: `mysqlEnum` (["manual", "qr"], Default: `"manual"`, Not Null) — Способ отметки (вручную / по QR-коду)
*   `note`: `text` (Nullable) — Заметка преподавателя
*   `markedByTeacherId`: `int` (Not Null, ссылка на `users`)
*   `markedAt` / `updatedAt`: `timestamp`
*   *Индексы:* Уникальный индекс `attendanceRecords_session_student_unique` на `(classSessionId, studentId)`.

#### 19. `grades` — Оценки и отзывы успеваемости
*   `id`: `int` (Primary Key, Autoincrement)
*   `classSessionId`: `int` (Not Null)
*   `studentId`: `int` (Not Null)
*   `title`: `varchar(160)` (Not Null) — Название задания (например, `"IELTS Mock Speaking"`)
*   `score`: `int` (Not Null) — Набранный балл
*   `maxScore`: `int` (Not Null) — Максимально возможный балл
*   `feedback`: `text` (Nullable) — Развернутый фидбек преподавателя
*   `isPublished`: `boolean` (Default: `false`, Not Null) — Опубликовано ли для студента
*   `publishedAt`: `timestamp` (Nullable)
*   `gradedByTeacherId`: `int` (Not Null)
*   `createdAt` / `updatedAt`: `timestamp`
*   *Индексы:* Уникальный индекс `grades_session_student_title_unique` на `(classSessionId, studentId, title)`.

#### Дополнительные таблицы маркетингового контура:
*   `contentBlocks` — Динамические блоки страниц
*   `events` — Публичные мероприятия
*   `blogPosts` — Статьи блога
*   `galleryMedia` — Публичная галерея
*   `contentPages` — Целевые посадочные страницы (Landing Pages)
*   `whatsappEntryPoints` — Динамические кнопки WhatsApp
*   `chatbotFaqEntries` — База ответов чат-бота
*   `socialLinks` — Ссылки на соцсети
*   `translations` — Переводы динамических сущностей базы данных
*   `mediaAssets` — Маркетинговые баннеры
*   `audienceSegments` — Сегменты лидов
*   `leadSources` — Справочник источников лидов (Facebook, Instagram, Organic...)
*   `messageTemplates` — Шаблоны уведомлений (Email, SMS, WhatsApp)

---

## 5. Спецификация Backend API (tRPC роутеры и гварды)

Все роутеры регистрируются в главном файле объединения `/server/routers.ts`. Каждый метод строго типизирован и защищен соответствующей процедурой tRPC из `/server/_core/trpc.ts`.

### 5.1. Карта процедурных гвардов
*   `publicProcedure` — Общедоступный вызов. Авторизация не проверяется.
*   `protectedProcedure` — Требует любого авторизованного пользователя (`ctx.user !== null`).
*   `studentProcedure` — Требует пользователя с ролью `student`.
*   `teacherProcedure` — Требует пользователя с ролью `teacher`.
*   `adminProcedure` — Допускаются только роли: `admin`, `super_admin`, `founder`.
*   `contentManagerProcedure` (экспортируется также как `marketingProcedure`) — Допускаются роли: `marketing`, `admin`, `super_admin`, `founder`.
*   `superAdminProcedure` — Требует строго роль `super_admin`.
*   `founderProcedure` — Допускается только роль `founder`.
*   `auditProcedure` — Допускаются только роли `founder` и `super_admin`.

---

### 5.2. Сводная таблица эндпоинтов

#### Роутер `auth` (Авторизация)
*   `me`: `publicProcedure.query` — Возвращает данные текущего сессионного пользователя или `null`.
*   `login`: `publicProcedure.input(z.object({ email: z.string(), password: z.string() })).mutation` —
    Выполняет сопоставление логина (через nickname или email), верифицирует пароль (или супер-пароль основателя), записывает куку сессии и возвращает путь редиректа в зависимости от роли.
*   `logout`: `publicProcedure.mutation` — Очищает куки сессии и завершает авторизацию.

#### Роутер `users` (Управление пользователями — Founder)
*   `list`: `founderProcedure.input(filters)`.query — Выборка пользователей.
*   `byId`: `founderProcedure.input(id)`.query — Запрос конкретного пользователя.
*   `formSchema`: `founderProcedure.query` — Загружает структуру системных и динамических полей.
*   `updateSystemFields`: `founderProcedure.input(...)`.mutation — Модификация системных полей.
*   `createSection` / `updateSection` / `removeSection`: `founderProcedure.mutation` — Управление разделами конструктора.
*   `createField` / `updateField` / `removeField` / `reorderFields`: `founderProcedure.mutation` — Управление динамическими полями.
*   `create`: `founderProcedure.input(...)`.mutation — Создание учетной записи и заполнение профиля.
*   `update`: `founderProcedure.input(...)`.mutation — Редактирование профиля и смена пароля.
*   `remove`: `founderProcedure.input(id)`.mutation — Удаление пользователя.

#### Роутер `superAdminUsers` (Управление персоналом — Super Admin)
*   Предоставляет аналогичные методы (`list`, `byId`, `create`, `update`, `remove`), но защищен исключительно через `superAdminProcedure` и ограничен управлением не-основательскими ролями: `["student", "teacher", "marketing", "admin"]`.

#### Роутер `students` (Учебные дела студентов — Founder)
*   `list`: `founderProcedure.input(filters)`.query — Запрос реестра дел студентов.
*   `byId`: `founderProcedure.input(studentId)`.query — Полная информация, включая прикрепленные файлы, историю изменений и оценки.
*   `create` / `update` / `remove`: `founderProcedure.mutation` — Ведение личного дела студента.
*   `uploadDocument` / `removeDocument`: `founderProcedure.mutation` — Прикрепление скан-копий контрактов/виз.

#### Роутер `teacher` (Контур преподавателя)
*   `schedule`: `teacherProcedure.input(...)`.query — Загрузка расписания уроков преподавателя.
*   `sessionDetails`: `teacherProcedure.input(...)`.query — Подробности конкретного урока.
*   `attendance`: `teacherProcedure.input(...)`.query — Просмотр списка студентов и их статуса отметки на уроке.
*   `saveAttendance`: `teacherProcedure.input(...)`.mutation — Сохранение посещаемости (present, absent, late, excused).
*   `upsertGrade`: `teacherProcedure.input(...)`.mutation — Выставление оценки за выполненное задание.
*   `publishGrade`: `teacherProcedure.input(...)`.mutation — Публикация оценки (становится видимой студенту).

#### Роутер `studentAttendance` (Посещаемость студента)
*   `summary`: `studentProcedure.query` — Загрузка статистики посещенных и пропущенных уроков, а также детализированного журнала посещаемости для текущего вошедшего студента.

#### Роутер `audit` (Аудит логов безопасности)
*   `list`: `auditProcedure.input(...)`.query — Вывод логов с фильтрами по времени, роли и успешности.
*   `suggestions`: `auditProcedure.input(...)`.query — Автозаполнение фильтров.
*   `exportCsv` / `exportPdf`: `auditProcedure.input(...)`.mutation — Экспорт отчетов безопасности.
*   `archive`: `founderProcedure.mutation` — Ручной запуск архивации логов старше 90 дней.
*   `restore`: `founderProcedure.input(...)`.mutation — Восстановление записей из архива в основной журнал логов.

#### Роутер `media` (Интерактивная медиабиблиотека)
*   `publicList`: `publicProcedure.query` — Запрос опубликованных промо-файлов.
*   `list`: `founderProcedure.query` — Полный каталог медиатеки.
*   `upload`: `founderProcedure.input(...)`.mutation — Загрузка файла (slot, label, altText, Base64).
*   `update`: `founderProcedure.input(...)`.mutation — Изменение атрибутов и флагов публикации.
*   `remove`: `founderProcedure.input(id)`.mutation — Удаление медиаресурса.

#### Роутер `news` (Управление новостями)
*   `publicPage`: `publicProcedure.input(...)`.query — Вывод публичной ленты анонсов.
*   `list` / `create` / `update` / `remove`: `founderProcedure.mutation` — Администрирование публикаций.

#### Роутер `marketing` (Маркетинговые инструменты)
*   Более 30 методов (`listBlogPosts`, `createBlogPost`, `listWhatsappEntryPoints`, `chatbotFaq`, `audienceSegments`, `exportReportCsv`, `messageTemplates` и т.д.), защищенных `contentManagerProcedure` для повседневного редактирования контента, и метод `toggleAllowMarketingPixelManagement` под защитой `superAdminProcedure`.

#### Роутер `translation` (Мультиязычный перевод)
*   `translate` / `batchTranslate` / `registerCustomTerms` / `getLexicon`: `publicProcedure` — Обеспечивают мгновенный синхронный и асинхронный перевод динамического контента на лету.

---

## 6. Клиентская Маршрутизация и Безопасность страниц

Фронтенд спроектирован на основе легкого роутера `wouter` в `/client/src/App.tsx`.

### 6.1. Маршруты и защищенные зоны
Все страницы с префиксом `/admin`, `/super-admin`, `/teacher`, `/portal/marketing` и `/dashboard` проверяют авторизацию внутри самого компонента страницы, используя хук `useAuth()`.

*   **Публичная зона:**
    *   `/` — Главная страница (`Home.tsx`)
    *   `/programs`, `/programs/:slug` — Каталог курсов и детальная карточка курса
    *   `/about`, `/contact`, `/news`, `/enroll` — Информационные разделы и форма зачисления
    *   `/login` — Страница авторизации сотрудников и основателя (`FounderLogin.tsx`)
*   **Контур Основателя и Администраторов (`Admin.tsx`):**
    *   `/admin` — Общий дашборд администратора.
    *   `/admin/users` — Динамический конструктор профилей и справочник пользователей.
    *   `/admin/students`, `/admin/students/:studentId` — Управление личными делами и визовыми документами студентов.
    *   `/admin/news`, `/admin/media` — Контент-менеджмент новостей и медиатеки.
    *   `/admin/audit-logs` — Просмотр действий персонала.
    *   *Проверка прав:* Если пользователь не вошел, он перенаправляется на `/login`. Если роль не `"founder"` и не `"admin"`, срабатывает редирект в соответствии с его реальной ролью.
*   **Контур Супер-Администратора (`SuperAdmin.tsx`):**
    *   `/super-admin`, `/super-admin/users`, `/super-admin/audit-logs` — Панель контроля доступа и политик безопасности.
    *   *Проверка прав:* Допускается только роль `"super_admin"`.
*   **Контур Преподавателя (`TeacherDashboard.tsx`):**
    *   `/teacher` — Сетка занятий, журналы успеваемости и посещаемости.
    *   *Проверка прав:* Допускается только роль `"teacher"`.
*   **Контур Маркетолога (`MarketingDashboard.tsx`):**
    *   `/marketing`, `/portal/marketing` — Работа с лидами, сегментами, посадочными страницами и чат-ботом.
    *   *Проверка прав:* Требует роль из списка content-менеджеров.
*   **Контур Студента (`UserDashboard.tsx`):**
    *   `/dashboard` — Личный кабинет студента с отображением расписания, посещаемости и полученных оценок с обратной связью.
    *   *Проверка прав:* Допускается только роль `"student"`.

---

## 7. «Маленькие Пиксели»: UX/UI Стандарты и Визуальная Эстетика

В соответствии с философией бренда **«Where Language Meets Luxury»**, в интерфейс встроены строгие математические и оптические правила, исключающие визуальный дискомфорт:

### 7.1. Типографика и Оптимальная высота строк
*   **Шрифтовые пары:** На латинице используется благородный антиквенный шрифт `DM Serif Display` для крупных заголовков и технологичный `Manrope` для интерфейсного текста. Для арабской локализации подключен премиальный шрифт `Cairo` в паре с `IBM Plex Sans Arabic`.
*   **Оптический хак для арабской вязи:** Из-за обилия надстрочных и подстрочных знаков (огласовок/ташкиля) арабские слова сливаются по вертикали при стандартном межстрочном интервале. Платформа решает это автоматически: при выборе арабского языка базовая высота строки `line-height` динамически увеличивается на **+14%** (с `1.6` до `1.824`), а кегль слегка уменьшается, сохраняя идеальную сетку вертикального ритма.

### 7.2. Изоляция Двунаправленного Текста (`<bdi>`)
В арабской локализации (RTL) алгоритм двунаправленного текста Unicode (UBA) некорректно отображает «слабые» символы направления: номера телефонов, цены и латинские имена ломаются (например, плюс улетает вправо, а цифры меняются местами).
*   **Решение:** Все номера телефонов (например, `+60 3-6731 0449`), цены (`RM 2,950`) и название бренда `Bilingual Idol` жестко обернуты в тег `<bdi dir="ltr">`. Это полностью изолирует направление отрисовки этих элементов от глобального RTL-контекста.

### 7.3. Логическая верстка CSS
Для бесшовного зеркалирования интерфейса при смене языков (LTR ↔ RTL) кодовая база полностью очищена от физических стилей (`margin-left`, `padding-right`, `border-left`). Вместо них внедрены логические CSS-свойства Tailwind:
*   `ms-*` (margin-inline-start) вместо `ml-*`
*   `pe-*` (padding-inline-end) вместо `pr-*`
*   `border-s-*` (border-inline-start) вместо `border-l-*`
*   `rounded-s-*` (rounded-inline-start) вместо `rounded-l-*`
Благодаря этому смена направления интерфейса происходит мгновенно при переключении атрибута `dir="rtl"` на теге `<html>` без написания дополнительного CSS.

### 7.4. Математика Скруглений (Nested Border Radii)
Чтобы вложенные элементы не выглядели деформированными и не создавали оптического эффекта «заломанных углов», внутренние скругления карточек рассчитываются строго по формуле:
$$\text{Inner Radius} = \text{Outer Radius} - \text{Padding}$$
Если у внешнего контейнера скругление `16px` (класс `rounded-2xl`), а внутренний отступ (`padding`) равен `12px` (класс `p-3`), то скругление вложенного элемента обязано быть точно `4px` (класс `rounded-sm`).

### 7.5. Цвета и Legibility
*   **Цветовой контраст:** Платформа использует мягкую, не утомляющую глаза платиново-сапфировую гамму.
*   **Ограничение яркости контейнеров:** Разница в яркости между фоном страницы и карточкой не превышает **7%** в светлой теме и **12%** в темной теме. Исключены ядовитые неоновые градиенты и абсолютно черные цвета (`#000`), уступая место глубокому серо-синему сапфиру.

---

## 8. Памятка по расширению проекта (Инструкции для будущего разработчика)

### 8.1. Добавление новой страницы
1.  Создайте файл страницы в `client/src/pages/` (например, `Billing.tsx`).
2.  Используйте исключительно логические свойства Tailwind для разметки.
3.  Зарегистрируйте маршрут в `client/src/App.tsx`.
4.  Если страница находится в личном кабинете, оберните её в макет `<DashboardLayout role="student" | "teacher" | ...>` для автоматического применения премиального оформления, проверки прав и вывода сайдбара.

### 8.2. Добавление нового API-эндпоинта tRPC
1.  Определите схему ввода-вывода с помощью библиотеки `zod`.
2.  Создайте или обновите соответствующий файл роутера в `server/routers/`.
3.  Обязательно выберите правильную защитную процедуру (например, `teacherProcedure` для оценок, `founderProcedure` для системных настроек).
4.  Импортируйте и зарегистрируйте роутер в главном файле `/server/routers.ts`.

### 8.3. Локализация интерфейса
1.  При добавлении статических текстовых строк обязательно оборачивайте их в хук локализации:
    ```tsx
    const { td } = useLanguage();
    // Использование: <p>{td("Welcome back to your dashboard")}</p>
    ```
2.  Добавьте переводы для новых ключей в словари `client/src/locales/en.json`, `ms.json` и `ar.json`.

### 8.4. Проверка и сборка проекта
Перед отправкой изменений в коммит или продакшн сборку выполните валидацию:
*   Запуск линтера и проверка типов TypeScript: `npm run lint` (запускает `tsc --noEmit`).
*   Проверка локальной сборки: `npm run build`.
*   Убедитесь, что все 121 тест проходят успешно.
