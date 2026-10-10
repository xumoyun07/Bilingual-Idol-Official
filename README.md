# Bilingual Idol Language Centre — платформа языкового центра

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![tRPC](https://img.shields.io/badge/tRPC-11-2596BE?style=flat-square)](https://trpc.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.4-4479A1?style=flat-square&logo=mysql)](https://www.mysql.com/)
[![Drizzle](https://img.shields.io/badge/Drizzle_ORM-0.44-C5F74F?style=flat-square)](https://orm.drizzle.team/)
[![Docker](https://img.shields.io/badge/Docker_Compose-3-2496ED?style=flat-square&logo=docker)](https://docs.docker.com/compose/)
[![License](https://img.shields.io/badge/License-Proprietary-gray?style=flat-square)](#)

> Платформа языкового центра **Bilingual Idol Language Centre** (Kuala Lumpur, лицензия KPT/MOHE WZ10104): публичный сайт с мультиязычным контентом и административный портал управления учебным процессом.

---

## 📑 Содержание

- [О проекте](#-о-проекте)
- [Стек технологий](#-стек-технологий)
- [Основные функции](#-основные-функции)
- [Архитектура и структура кода](#-архитектура-и-структура-кода)
- [Потоки данных (Data Flows)](#-потоки-данных-data-flows)
- [Установка и запуск](#-установка-и-запуск)
- [База данных в Docker](#-база-данных-в-docker)
- [Конфигурация окружения (.env)](#-конфигурация-окружения-env)
- [Учётные записи](#-учётные-записи)
- [Команды](#-команды)
- [Тестирование](#-тестирование)
- [Известные проблемы](#-известные-проблемы)

---

## 🎯 О проекте

Центр ведёт очное обучение (General English, IELTS, Summer Camps, Executive English, мировые языки) и нуждался в единой платформе, закрывающей полный цикл: от публичного каталога курсов и приёма заявок до зачисления студента, учёта посещаемости, оценок и платежей.

Ключевые инженерные решения:

- **Двухрежимный слой данных.** `server/db.ts` работает либо с MySQL через Drizzle, либо со встроенным in-memory хранилищем, если `DATABASE_URL` не задан. Это позволяет поднимать проект и прогонять тесты без БД, но требует дублировать логику в каждой функции.
- **Типобезопасный API end-to-end.** tRPC 11 + superjson: клиент вызывает процедуры как обычные функции, типы выводятся из схемы БД без кодогенерации.
- **Динамический конструктор форм.** Поля анкеты студента хранятся в БД (`userFormFields` / `userFormSections`), а не в коде — новые поля добавляются из админки без миграций.
- **Мультиязычность en / ms / ar** с полным RTL: словари интерфейса в `client/src/locales/`, контент из БД — в секции `seed`, перевод контента через Azure Translator.
- **Ролевая модель из 7 ролей** с 10 серверными гардами, журналом аудита и мгновенным отзывом сессий через `sessionVersion`.

---

## 🛠 Стек технологий

### Backend
- **Язык:** TypeScript 5.9 (strict, ESM, `moduleResolution: bundler`)
- **Сервер:** Express 4 + tRPC 11, единый процесс, порт 3000
- **ORM / БД:** Drizzle ORM 0.44 + `mysql2`, MySQL 8.4
- **Аутентификация:** JWT HS256 (`jose`), cookie `app_session_id`, scrypt-хеши паролей
- **Сборка сервера:** esbuild (`--packages=external`, ESM)

### Frontend
- **UI:** React 19, wouter (роутинг), TanStack Query 5, Radix UI (27 пакетов)
- **Сборка:** Vite 7
- **Стили:** Tailwind CSS 4 (`@tailwindcss/vite`)
- **Формы и валидация:** react-hook-form + Zod 4
- **PWA:** vite-plugin-pwa 1.3 + Workbox

### Инфраструктура
- **Контейнеризация:** Docker Compose, MySQL 8.4, выделенная bridge-сеть, именованный volume
- **Тесты:** Vitest 2.1 (166 тестов), Playwright 1.64 (браузерные проверки)
- **Внешние сервисы:** Billplz (платежи, HMAC-SHA256), Azure Translator (i18n), S3/Forge (медиа, с fallback на локальную ФС)

---

## 🌟 Основные функции

### 1. Публичный сайт и каталог курсов
Главная, программы, детальные страницы курсов, новости, контакты, прайс-лист 2026. Витрина формируется из БД (`programs`, `announcements`, `testimonials`, `teamProfiles`, `publicMedia`), есть интерактивный подбор курса и промо-модал.

### 2. Регистрация и приём заявок
Формы записи и enquiry с UTM-метками; заявки попадают в `submissions` / `registrationSubmissions`. Для каждой заявки строится трекер из 7 статусов (`applications`), заявка превращается в зачисление (`enrollments`).

### 3. Административный портал и роли
Консоль основателя (Overview, User Accounts, Audit & Security), управление пользователями и динамическими полями анкеты, медиатека с проверкой MIME-сигнатур, новости, программы, отзывы. Семь ролей: `user`, `student`, `teacher`, `marketing`, `admin`, `super_admin`, `founder`.

### 4. Учебный процесс
Расписание (`classSessions`), посещаемость с методом отметки manual/qr (`attendanceRecords`), оценки с публикацией (`grades`), профили и документы студентов (`studentProfiles`, `studentDocuments`), placement-тесты с расчётом уровня CEFR.

### 5. Платежи, аудит и мультиязычность
Онлайн-оплата через Billplz с проверкой HMAC-подписи и идемпотентностью вебхука; журнал аудита с маскированием чувствительных полей и автоархивацией старше 12 месяцев; перевод контента en/ms/ar через Azure Translator с защитой брендов и плейсхолдеров.

---

## 📂 Архитектура и структура кода

Слои: **HTTP-граница → tRPC-роутеры → слой доступа к данным → БД**.

```text
Bilingual-Idol-Official/
├── client/                          # Фронтенд (SPA)
│   ├── public/                      # Статика и медиа (копируется в dist)
│   └── src/
│       ├── components/              # Компоненты; ui/ — 44 Radix-примитива
│       ├── contexts/                # LanguageContext (en/ms/ar, RTL), ThemeContext
│       ├── hooks/                   # Переиспользуемые хуки
│       ├── lib/                     # tRPC-клиент, словари, dynamicTranslator
│       ├── locales/                 # en.json, ms.json, ar.json (ui + seed)
│       └── pages/                   # 18 страниц
├── server/                          # Бэкенд
│   ├── _core/                       # Express, tRPC, JWT, cookie, Vite-middleware
│   ├── routers/                     # 20 под-роутеров tRPC
│   ├── services/                    # azureTranslator и пр.
│   ├── portal/                      # HTTP-роуты маркетинг-портала
│   ├── db.ts                        # Слой доступа к данным (MySQL + in-memory)
│   └── paymentsWebhook.ts           # Вебхук Billplz
├── shared/                          # Код, общий для клиента и сервера
├── drizzle/                         # schema.ts (42 таблицы) + миграции
├── docker/
│   ├── initdb/                      # Автоинициализация БД при первом старте
│   │   ├── 01-schema.sql            # Полный DDL (генерируется из schema.ts)
│   │   ├── 02-indexes.sql           # Индексы под реальные запросы
│   │   └── 03-roles.sh              # Роли БД с минимальными правами
│   └── scripts/                     # backup / restore / verify / persistence
├── scripts/                         # dev-супервизор, i18n-sync
├── docker-compose.yml               # БД + приложение
├── Dockerfile                       # Multi-stage сборка приложения
└── package.json
```

**Поток запроса:** браузер → `POST /api/trpc` (superjson) → `createContext` читает JWT из `Authorization: Bearer` или cookie → гард проверяет роль → процедура вызывает `server/db.ts` → Drizzle/MySQL.

---

## 🔄 Потоки данных (Data Flows)

### Сценарий 1: Регистрация студента и зачисление

```text
1. Посетитель заполняет форму на /enroll
2. trpc.submissions.createInquiry            (publicProcedure)
3. createContext -> пользователь не аутентифицирован -> ctx.user = null
4. db.createSubmission() -> INSERT INTO submissions (status='new', UTM-метки)
5. Админ видит заявку в консоли
6. db.createClientAccountAndEnrollment():
     INSERT INTO users            (role='student', случайный пароль)
     INSERT INTO studentProfiles  (guardian*, DOB, contactEmail)
     INSERT INTO enrollments      (суммы в центах: agreedPrice, registrationFee...)
     UPDATE applications SET status='documentsReceived'
7. Студент получает OTP и завершает онбординг
8. Оплата: trpc.payments.create -> Billplz -> вебхук POST /api/payments/callback
     проверка HMAC-SHA256 подписи x_signature
     сверка суммы с enrollments (защита от подмены)
     идемпотентность по transactionReference
     UPDATE payments SET status='completed'; applications -> 'paymentCompleted'
```

### Сценарий 2: Мультиязычный контент (перевод из админки)

```text
1. Админ создаёт/меняет курс через trpc.content.addProgram
2. Ответ сохраняется немедленно — перевод не блокирует запрос
3. Фоном: scripts/i18n-sync.ts строит очередь
     ключи, где reviewed=false и sourceHash (md5 EN, 8 символов) не совпал
     reviewed=true и совпавший хэш не трогаются — квота не тратится
4. Перед отправкой: объём в символах x число языков, остаток квоты, ожидание 'y'
5. translateBatch(texts, ['ms','ar']) в server/services/azureTranslator.ts
     protectContent(): бренды, e-mail, URL и {placeholders} -> <span class="notranslate">
     validateTranslation(): число плейсхолдеров и HTML-тегов совпадает с оригиналом
6. В client/src/locales/{ms,ar}.json пишутся ТОЛЬКО успешные и провалидированные
7. Клиент: LanguageContext.t() -> ui-секция -> фоллбек на en -> ключ
   Контент из БД: seed.<сущность>.<slug>.<поле> -> фоллбек на английский
```

---

## 🚀 Установка и запуск

### Предварительные требования

| Компонент | Версия | Примечание |
|---|---|---|
| Node.js | `^20.19.0 \|\| >=22.12.0` | требование Vite 7; локально проверено на 24.21.0 |
| pnpm | 11.x | в репозитории `pnpm-lock.yaml` |
| Docker + Compose | 29.x / v5.x | только для контейнерной БД |

### Пошаговая инструкция

```bash
# 1. Зависимости.
#    Флаг --trust-lockfile обязателен: pnpm 11 по умолчанию отклоняет lockfile
#    из-за политики minimumReleaseAge (33 пакета свежее суток).
pnpm install --trust-lockfile

# 2. Переменные окружения
cp .env.example .env          # для запуска без БД достаточно этого

# 3. Пароль основателя — без него войти нельзя
pnpm founder:hash             # вставьте напечатанную строку в .env как FOUNDER_PASSWORD_HASH

# 4. Режим разработки (супервизор + hot reload)
pnpm dev
```

Приложение: **http://127.0.0.1:3000** — без `DATABASE_URL` работает на in-memory хранилище (данные не переживают перезапуск).

### Запуск с контейнерной БД

```bash
cp .env.docker.example .env   # и заменить все CHANGE_ME на свои значения
docker compose up -d db       # только БД
pnpm dev                      # приложение на хосте, БД в контейнере
```

Строка подключения для локального запуска:

```bash
DATABASE_URL=mysql://bilc_app:<APP_DB_PASSWORD>@127.0.0.1:3307/bilingual_idol
```

### Запуск всего стека в контейнерах

```bash
docker compose up -d --build
```

---

## 🐳 База данных в Docker

### Состав

| Файл | Назначение |
|---|---|
| `docker-compose.yml` | Сервисы `db` (MySQL 8.4) и `app`, bridge-сеть `bilc-net`, volume `bilc-db-data` |
| `docker/initdb/01-schema.sql` | 42 таблицы, 31 индекс. Генерируется из `drizzle/schema.ts` |
| `docker/initdb/02-indexes.sql` | 15 дополнительных индексов под реальные запросы |
| `docker/initdb/03-roles.sh` | Роли БД с минимальными правами |
| `docker/scripts/backup.sh` | Дамп через `mysqldump --single-transaction` |
| `docker/scripts/restore.sh` | Восстановление из дампа с проверкой контрольной суммы |
| `docker/scripts/verify.sh` | Проверка схемы, прав и ссылочной целостности |
| `docker/scripts/test-persistence.sh` / `.ps1` | E2E-проверка выживания данных при пересоздании контейнера |

### Изоляция и безопасность

- БД публикуется **только на loopback** `127.0.0.1:3307` — недоступна из внешней сети. Порт 3307 вместо 3306 не конфликтует с локальным MySQL.
- Приложение и БД связаны выделенной bridge-сетью `bilc-net`; внутри неё БД доступна по имени сервиса `db:3306`.
- Данные лежат в именованном volume `bilc-db-data`, а не в слое контейнера.
- Роли БД:

| Роль | Права | Назначение |
|---|---|---|
| `bilc_app` | `SELECT, INSERT, UPDATE, DELETE` | приложение. **Без DDL** — успешная SQL-инъекция не сможет изменить схему |
| `bilc_readonly` | `SELECT` | аналитика, проверка бэкапов |
| `bilc_backup` | `SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER` | `mysqldump` |
| `root` | все | только инициализация и администрирование |

`MYSQL_USER` в compose намеренно не задан: официальный образ MySQL выдаёт такому пользователю `ALL PRIVILEGES`, что нарушает принцип наименьших привилегий.

### Healthcheck

```yaml
healthcheck:
  test: ["CMD-SHELL", "mysqladmin ping -h 127.0.0.1 -uroot -p\"$$MYSQL_ROOT_PASSWORD\" --silent"]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 60s
```

`start_period` добавлен потому, что первая инициализация создаёт 42 таблицы и 46 индексов — дольше, чем 3 × 10 с. Сервис `app` стартует только после `condition: service_healthy`.

### Управление

```bash
# Запуск / остановка (данные сохраняются)
docker compose up -d db
docker compose down

# Статус и логи
docker compose ps
docker compose logs -f db

# Проверка схемы, прав и целостности
sh docker/scripts/verify.sh

# ПОЛНЫЙ СБРОС: удаляет контейнер И все данные, init-скрипты выполнятся заново
docker compose down -v
docker compose up -d db
```

### Резервное копирование

```bash
sh docker/scripts/backup.sh                 # -> ./backups/bilc-<UTC-метка>.sql + .sha256
sh docker/scripts/restore.sh backups/bilc-20261009T120000Z.sql
```

Дамп снимается ролью `bilc_backup` с `--single-transaction`: консистентный снимок InnoDB без блокировки таблиц. **Дампы нужно копировать за пределы хоста** — volume защищает от перезапуска, но не от потери диска.

### Проверка персистентности

```bash
sh docker/scripts/test-persistence.sh          # POSIX
.\docker\scripts\test-persistence.ps1          # Windows
```

Скрипт записывает маркер, полностью пересоздаёт контейнер (`down` + `up`), проверяет, что маркер на месте, и удаляет его.

### Диагностика типовых проблем

| Симптом | Причина | Решение |
|---|---|---|
| `Can't connect to MySQL server on '127.0.0.1:3307'` | контейнер не запущен или ещё инициализируется | `docker compose ps`, дождаться `(healthy)` |
| `Access denied for user 'bilc_app'@'localhost'` | подключение через сокет даёт хост `localhost`, не покрытый `'%'` | подключаться по TCP: `-h 127.0.0.1` |
| `Table 'bilingual_idol.programs' doesn't exist` | init-скрипты не выполнялись — volume уже существовал | `docker compose down -v && docker compose up -d db` |
| `Table already exists` при старте | init-скрипты выполняются только на **пустом** volume | это нормально; для переинициализации нужен `down -v` |
| `Ports are not available: 3307` | порт занят другим процессом | изменить `DB_HOST_PORT` в `.env` |
| `permission denied` при командах `docker` | Docker Desktop не запущен | запустить Docker Desktop, дождаться Engine running |
| Изменения в `01-schema.sql` не применяются | init-скрипты выполняются один раз | `docker compose down -v` для чистого старта |

### Регенерация схемы

`01-schema.sql` — производный артефакт. Единственный источник истины — `drizzle/schema.ts`:

```bash
npx drizzle-kit generate --config=drizzle-docker.config.ts
# результат в docker/initdb/_generated/ — перенести в 01-schema.sql,
# убрав маркеры "--> statement-breakpoint" (MySQL не считает их комментарием)
```

---

## 🔐 Конфигурация окружения (.env)

Все значения передаются только через переменные окружения; в коде ничего не захардкожено. Шаблоны: `.env.example` (без Docker) и `.env.docker.example` (с Docker).

| Переменная | Обязательна | Назначение |
|---|---|---|
| `DATABASE_URL` | нет | MySQL. Пусто → in-memory режим |
| `JWT_SECRET` | **да, в production** | подпись сессий. Без него `server/_core/sdk.ts:5` берёт публично известный fallback |
| `FOUNDER_PASSWORD_HASH` | **да, иначе вход основателя заблокирован** | scrypt-хеш пароля основателя. Создать: `pnpm founder:hash`, вставить строку в `.env`. Сам пароль нигде не хранится |
| `DB_NAME` / `DB_HOST_PORT` | для Docker | имя БД и порт на хосте |
| `MYSQL_ROOT_PASSWORD` | для Docker | root-пароль контейнера |
| `APP_DB_USER` / `APP_DB_PASSWORD` | для Docker | учётка приложения (DML) |
| `READONLY_DB_USER` / `READONLY_DB_PASSWORD` | для Docker | учётка только для чтения |
| `BACKUP_DB_USER` / `BACKUP_DB_PASSWORD` | для Docker | учётка для дампов |
| `BILLPLZ_ENABLED`, `BILLPLZ_API_KEY`, `BILLPLZ_COLLECTION_ID`, `BILLPLZ_SIGNATURE_KEY` | для платежей | шлюз Billplz |
| `AZURE_TRANSLATOR_KEY`, `_REGION`, `_ENDPOINT` | для i18n | перевод контента |
| `TRANSLATOR_MONTHLY_LIMIT` | нет | лимит символов/мес, по умолчанию 1 800 000 |
| `BUILT_IN_FORGE_API_URL` / `_KEY` | нет | хранилище медиа (есть fallback на локальную ФС) |

---

## 👤 Учётные записи

В коде и в сиде нет ни одной учётной записи с паролем. Единственная учётная запись, которая существует всегда, — **основатель**; её хеш берётся только из `FOUNDER_PASSWORD_HASH`.

### Как задать пароль основателя

```bash
pnpm founder:hash
```

Команда дважды запрашивает пароль (ввод скрыт) и печатает готовую строку. Положите её в `.env`:

```dotenv
FOUNDER_PASSWORD_HASH='scrypt:<соль>:<дайджест>'
```

Кавычки обязательны. Значение больше нигде не хранится — ни в репозитории, ни в логах, ни в выводе скриптов.

Если переменная не задана или повреждена — вход основателя заблокирован (fail closed), учётная запись не создаётся ни в MySQL, ни в `inMemoryStore`, и при старте пишется сообщение без значений.

### Остальные роли

Учётные записи заводят **сотрудники**, а не сами студенты. Публичная форма регистрации (`registration.submit`) `users` не создаёт вообще — она пишет только заявку `registrationSubmissions`. Аккаунт появляется позже, когда сотрудник согласовал цену и создал его через API:

- основатель — `users.create`, любая роль из `super_admin`, `admin`, `marketing`, `teacher`, `student`;
- супер-админ — `superAdminUsers.create`, только `student`, `teacher`, `marketing`, `admin`;
- **admin — только студенческие аккаунты**, и только через `enrollments.createClientAccountAndEnrollment` (роль жёстко зашита как `student`). Админ не может завести teacher, marketing, admin или super_admin: `users.*` закрыт `founderProcedure`, а `superAdminUsers.*` не принимает роль `admin` от админа.

Пароль выдаётся один раз в ответе создающей процедуры и больше нигде не хранится. Сид-учётные записи с общим паролем удалены из кода.

### Тестовые учётные записи

Их выдаёт `server/testing/accounts.ts`:

- генерирует пароли в рантайме (`randomBytes`), ничего не пишет на диск и в логи;
- создаёт учётные записи реальными путями API (`auth.login` основателя → `users.create` → первый вход по временному паролю → `auth.completeOnboarding`);
- удаляет их за собой в `cleanup()`;
- отказывается работать вне тестового режима: нужен `NODE_ENV=test` (vitest) или явный `TEST_FIXTURES=1` (dev-прогоны Playwright).

Режим `http` (для Playwright против уже запущенного сервера) дополнительно требует `TEST_FOUNDER_PASSWORD`: пароль основателя задаётся серверу снаружи, и helper не может его придумать.

> ⚠️ **Прежние пароли остаются в истории git.** Даже после удаления из рабочего дерева они доступны через `git log`/`git show`. Требования: репозиторий **обязан быть приватным**; перед любой публикацией — переписать историю (`git filter-repo`) либо считать все прежние пароли скомпрометированными и не использовать их нигде.

---

## 🧰 Команды

| Команда | Действие |
|---|---|
| `pnpm dev` | режим разработки с супервизором и hot reload |
| `pnpm build` | production-сборка: клиент (`vite build`) + сервер (`esbuild`) |
| `pnpm start` | запуск собранного сервера (нужен `NODE_ENV=production`) |
| `pnpm check` | проверка типов (`tsc --noEmit`) — **сейчас падает, см. «Известные проблемы»** |
| `pnpm test` | прогон тестов: 212 passed + 11 skipped |
| `pnpm founder:hash` | сгенерировать scrypt-хеш пароля основателя для `.env` |
| `pnpm e2e:shell` | регрессия оболочки дашборда. Нужен запущенный сервер, `TEST_FIXTURES=1` и `TEST_FOUNDER_PASSWORD` |
| `pnpm db:push` | `drizzle-kit generate && drizzle-kit migrate` |
| `pnpm i18n:sync -- --migrate` | перестроить файлы локалей из `translations.ts` |
| `pnpm i18n:sync -- --dry-run` | посчитать очередь перевода и расход квоты |
| `pnpm i18n:ping` | проверка связи с Azure Translator |
| `pnpm format` | Prettier |

> ⚠️ Скрипты `dev:server` и `start` используют POSIX-префикс `NODE_ENV=...` и **не работают в cmd.exe/PowerShell**. На Windows задавайте переменную отдельно: `$env:NODE_ENV="production"; node dist/index.js`.

---

## ✅ Тестирование

```bash
pnpm test                                              # 212 passed + 11 skipped, in-memory, ~13 с
pnpm vitest run server/db.docker.integration.test.ts   # 11 тестов против контейнерной БД
```

Интеграционные тесты требуют `DATABASE_URL`; без него они пропускаются (`describe.skip`), поэтому обычный `pnpm test` не зависит от Docker.

**Что покрывают интеграционные тесты:**

1. соединение с MySQL 8;
2. схема инициализирована — 42 таблицы;
3. роль приложения **не имеет** прав на изменение схемы (`CREATE TABLE` отклоняется);
4. CRUD-цикл на реальной таблице;
5. UNIQUE-ограничение не даёт создать дубль;
6. ACID: откат транзакции при ошибке;
7. пул соединений выдерживает 25 параллельных запросов;
8. ссылочная целостность — записей-сирот нет;
9. реальные функции приложения читают данные из MySQL;
10. путь записи `createProgram → updateProgram → deleteProgram`;
11. `updateSiteSettings` (MySQL-специфичный `ON DUPLICATE KEY UPDATE`).

---

## ⚠️ Известные проблемы

| Проблема | Где |
|---|---|
| ~~Бэкдор: пароли `founder` и `admin` дают доступ основателя~~ **исправлено**: вход только по `FOUNDER_PASSWORD_HASH`, fail closed | `server/founderAuth.ts` |
| ~~Пароли сервисных аккаунтов захардкожены~~ **исправлено**: сид-учётные записи удалены, остался только основатель | `server/db.ts` |
| ~~Сломанный онбординг (`db.validateProfileValues`, `eq`, `db.users`, `db.userProfileValues`, `audit`)~~ **исправлено**: реэкспорт помощников, импорт `eq` и таблиц, импорт `audit` | `server/db.ts`, `server/routers.ts` |
| ~~`studentProfiles` не импортирован в `server/db.ts`~~ **исправлено**: импортирован из схемы, добавлен в `inMemoryStore` | `server/db.ts` |
| ~~Сброс пароля через `Math.random()`~~ **исправлено**: `db.generateTemporaryPassword()` (`randomBytes`, 24 символа) | `server/routers/superAdminUsers.ts` |
| ~~`resetPassword` обращался к несуществующим `db.users` / `eq`~~ **исправлено** | `server/routers/superAdminUsers.ts` |
| ~~Фиктивный студент `student@bilc.my` (`userId: 6`, посещаемость 18/20)~~ **исправлено**: in-memory список студентов пуст | `server/students.ts` |
| ~~Email-заглушка печатала тело письма и временный пароль в stdout~~ **исправлено**: в лог идут только получатель, тема и имя шаблона | `server/email.ts` |
| Fallback-секрет JWT публично известен | `server/_core/sdk.ts:5` |
| Схема не проходит `tsc --noEmit` (14 ошибок: 8 — pricing, 1 — webhook, 1 — enrollments, 4 — UI) | `server/routers/payments.ts`, `client/src/**` |
| **Нет ни одного FOREIGN KEY** (0 ограничений) — при удалении пользователя остаются сироты в `studentProfiles`, `studentDocuments`, `studentProfileHistory`, `enrollments`, `payments`, `placementTestAttempts`, `attendanceRecords`, `grades`, `classSessions`, `auditLogs` | `drizzle/schema.ts` |
| Удаление пользователя через Users/Super-admin чистит только `userProfileValues` и `users` | `server/db.ts` (`deleteManagedUser`) |
| Жёсткое удаление разрешено только без зависимых строк; иначе учётная запись деактивируется | `server/services/userPolicy.ts`, `server/db.ts` |
| Дизайн-миграция «один основатель + уникальный e-mail» подготовлена, но **не применена** | `docs/pending-migrations/` |
| `ctx.user.language` не существует в типе `User`: ошибки платежей всегда на английском | `server/routers/payments.ts:40,42,54,56,68,70` |
| Платёжный e-mail падает на заглушку `student@bilc.my`, если у пользователя нет адреса | `server/routers/payments.ts:105` |
| Подписи ролей в двух местах захардкожены по-английски и не разделены по ключам `role.*` | `client/src/pages/Admin.tsx:55`, `client/src/components/ConfigurableCreateUserModal.tsx:13` |
| Сравнение `query === true` недостижимо (мёртвая ветка, не падает) | `server/paymentsWebhook.ts:129` |
| Миграции неполные: 12 файлов из 16, покрывают 21 из 42 таблиц | `drizzle/` |
| Regex-«санитайзер» HTML вместо настоящего | `server/marketing.ts:39-45` |
| Rate limiting на публичных эндпоинтах отсутствует | — |

---

## 📄 Лицензия

Proprietary. Все права принадлежат Bilingual Idol Language Centre.
