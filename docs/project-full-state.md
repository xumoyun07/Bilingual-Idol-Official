# Полный технический аудит проекта Bilingual Idol Language Centre (BILC)

Данный документ фиксирует **фактическое текущее состояние** кодовой базы и архитектуры платформы Bilingual Idol Language Centre (BILC). Он составлен на основе прямого статического анализа файлов исходного кода, структуры БД Drizzle, tRPC роутеров и клиентских компонентов. Документ служит исчерпывающим техническим руководством для продолжения разработки и интеграции.

---

## 1. Ролевая модель

Поле `role` в таблице `users` определяет уровень привилегий аккаунта в системе.

### Точное определение в схеме БД
Буквальный тип и список значений поля `role` в Drizzle ORM (`drizzle/schema.ts`):
```typescript
role: mysqlEnum("role", [
  "user",
  "student",
  "teacher",
  "marketing",
  "admin",
  "super_admin",
  "founder"
]).default("student").notNull()
```

### Спецификация ролей и полномочий
1. **`founder` (Основатель)**:
   - Абсолютный суперпользователь системы.
   - Единственная роль, имеющая доступ к системным настройкам портала (`siteSettings`), полному просмотру журнала аудита (включая действия супер-администратора) и **полному управлению Dynamic Profile Builder** (создание секций, полей, реордеринг и изменение базовых полей).
   - Может управлять любыми пользователями в системе, включая `super_admin` и `admin`.
2. **`super_admin` (Супер-администратор)**:
   - Технический администратор второго уровня.
   - Обладает доступом к просмотру системного журнала безопасности (`auditLogs`) с ограничением: записи, действия или описания, содержащие упоминание роли `founder`, для него фильтруются (скрываются) на уровне БД.
   - Может управлять учетными записями пользователей (создание, редактирование, удаление), но строго в ограниченных рамках: ему разрешено управлять ролями `student`, `teacher`, `marketing` и `admin`. Он **не может** просматривать, изменять или удалять учетные записи `super_admin` или `founder`.
   - Не имеет доступа к редактированию структуры Dynamic Profile Builder (только к просмотру схемы полей при создании пользователей).
3. **`admin` (Администратор / Менеджер портала)**:
   - Роль, управляющая повседневной академической и операционной деятельностью (обработка заявок на обучение, управление курсами, ведение студентов).
   - В документах используется двойное написание `"admin/super_admin"` из-за того, что они разделяют общие доменные процедуры (например, управление студенческими документами, редактирование программ обучения). Однако технически в кодовой базе это **две разные роли** с разной степенью контроля (у `super_admin` шире права по ведению учетных записей администраторов, а `admin` сфокусирован на контенте и CRM-заявках).
4. **`marketing` (Маркетолог / Контент-менеджер)**:
   - Специализированная роль для ведения рекламных акций и управления контентом.
   - Имеет доступ к управлению справочником активных промокодов (`promotions`), настройкам CTA-элементов на главной странице, отслеживанию рекламных пикселей, рассылкам в WhatsApp и ведению лидов/заявок.
5. **`teacher` (Преподаватель)**:
   - Роль с доступом только к преподавательскому кабинету.
   - Просмотр расписания своих занятий, заполнение посещаемости (attendance) студентов, выставление и публикация академических оценок (grades).
6. **`student` (Студент / Ученик)**:
   - Роль для зачисленных учащихся.
   - Доступ к просмотру своей посещаемости, оценок, расписания занятий и загрузке необходимых документов (паспорт, виза).
7. **`user` (Зарегистрированный пользователь)**:
   - Начальная роль по умолчанию для пользователей, которые зарегистрировались, но еще не прошли процедуру зачисления или не получили статус студента/преподавателя. Используется для прохождения первого этапа сбора профильных данных (onboarding).

### Реализация процедур авторизации (tRPC Middleware)
Физическая проверка ролей реализована в файле `server/_core/trpc.ts`. Вот точные сигнатуры и логика ограничений из кода:

```typescript
/** Проверка авторизации (наличие сессии пользователя) */
const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication is required." });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
export const protectedProcedure = t.procedure.use(requireUser);

/** Доступ только для студентов */
export const studentProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "student") {
      throw new TRPCError({ code: "FORBIDDEN", message: "This resource is unavailable." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

/** Доступ только для преподавателей */
export const teacherProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "teacher") {
      throw new TRPCError({ code: "FORBIDDEN", message: "This resource is unavailable." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

/** Доступ для административной команды (Admin, Super Admin, Founder) */
export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || !['admin', 'super_admin', 'founder'].includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "This resource is restricted." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

/** Доступ для контент-менеджеров и маркетологов */
export const contentManagerProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || !['admin', 'marketing', 'super_admin', 'founder'].includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "This resource is restricted to content managers." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);
export const marketingProcedure = contentManagerProcedure;

/** Доступ только для Founder */
export const founderProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== 'founder') {
      throw new TRPCError({ code: "FORBIDDEN", message: "This resource is unavailable." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

/** Доступ только для Super Admin */
export const superAdminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "super_admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "This resource is unavailable." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

/** Просмотр журнала аудита (только Founder и Super Admin) */
export const auditProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || !["founder", "super_admin"].includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "This resource is unavailable." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);
```

### Иерархия ролей
Строгой линейной иерархии (где любая вышестоящая роль включает 100% прав нижестоящей) нет — доступ разбит по плоскостям ответственности. Однако роли `founder` и `super_admin` являются доминирующими в технической плоскости администрирования пользователей, а `admin` и `marketing` доминируют в плоскости ведения учебного процесса и контента.

---

## 2. Схема базы данных

Проект использует **Drizzle ORM** с базой данных **MySQL** (описания таблиц используют `mysqlTable` и типы из пакета `drizzle-orm/mysql-core`). В коде предусмотрен двухрежимный драйвер: при отсутствии переменной среды `DATABASE_URL` бэкенд бесшовно переключается на встроенный реактивный объект-хранилище `inMemoryStore` (особенно полезно для бесперебойного прохождения CI/CD и демонстрации функционала во фреймах).

### Список таблиц и их назначение

| Имя таблицы в БД | Связанная TS-переменная схемы | Назначение / Содержимое |
| :--- | :--- | :--- |
| `users` | `users` | Учетные записи всех пользователей (email, passwordHash, роль, флаг активности). |
| `userFormSections` | `userFormSections` | Секции (группы) кастомных полей профиля в Dynamic Profile Builder. |
| `userFormFields` | `userFormFields` | Конфигурация кастомных полей профиля в Dynamic Profile Builder (тип поля, обязательность, валидация). |
| `userProfileValues` | `userProfileValues` | Значения кастомных полей профиля, заполненные конкретными пользователями. |
| `programs` | `programs` | Учебные курсы и программы (описания, расписание, стоимость, SEO-теги). |
| `submissions` | `submissions` | Заявки от посетителей сайта (формы обратной связи, заказ звонка, запись на кампус-тур). |
| `announcements` | `announcements` | Школьные объявления, новости, праздничные даты. |
| `testimonials` | `testimonials` | Отзывы студентов и родителей (с полями модерации `approved` и подтверждения согласия). |
| `teamProfiles` | `teamProfiles` | Профили преподавателей и администрации для вывода на странице "About". |
| `siteSettings` | `siteSettings` | Глобальные настройки сайта (пары ключ-значение), включая конфигурацию системных полей. |
| `publicMedia` | `publicMedia` | Соответствие медиа-ассетов конкретным слотам баннеров на сайте. |
| `auditLogs` | `auditLogs` | Действующий (активный) журнал аудита безопасности. |
| `auditLogArchives` | `auditLogArchives` | Архив журнала аудита для записей старше 12 месяцев. |
| `studentProfiles` | `studentProfiles` | Дополнительные академические данные студентов. |
| `studentDocuments` | `studentDocuments` | Студенческие документы (сканы паспортов, визовые файлы). |
| `studentProfileHistory` | `studentProfileHistory` | Лог изменений профилей студентов. |
| `classSessions` | `classSessions` | Академическое расписание уроков и занятий. |
| `attendanceRecords` | `attendanceRecords` | Журнал посещаемости занятий студентами (статусы: `present`, `absent`, `late`, `excused`). |
| `grades` | `grades` | Оценки студентов за тесты, экзамены или домашние задания. |
| `contentBlocks` | `contentBlocks` | Настраиваемые блоки разметки на посадочных страницах. |
| `events` | `events` | События центра (дни открытых дверей, даты новых наборов). |
| `blogPosts` | `blogPosts` | Публикации в блоге центра. |
| `galleryMedia` | `galleryMedia` | Галерея фотографий учебного корпуса Pavilion Embassy. |
| `contentPages` | `contentPages` | Дополнительные статические/динамические веб-страницы. |
| `whatsappEntryPoints` | `whatsappEntryPoints` | Конфигурация консьерж-виджетов WhatsApp с разбивкой по темам. |
| `chatbotFaqEntries` | `chatbotFaqEntries` | База знаний для умного автоответчика. |
| `socialLinks` | `socialLinks` | Настройки ссылок на социальные сети центра. |
| `translations` | `translations` | Словарь кэшированных переводов для автоматического переводчика. |
| `mediaAssets` | `mediaAssets` | Загруженные файлы в библиотеке медиафайлов. |
| `audienceSegments` | `audienceSegments` | Рекламные и маркетинговые сегменты лидов. |
| `leadSources` | `leadSources` | Источники трафика для заявок. |
| `messageTemplates` | `messageTemplates` | Шаблоны маркетинговых рассылок. |
| `registrationSubmissions` | `registrationSubmissions`| Заявки на зачисление (enrollment) через форму регистрации. |
| `registrationSubmissionValues`| `registrationSubmissionValues` | Ответы на кастомные вопросы формы регистрации. |
| `applications` | `applications` | Статусы рассмотрения заявок на зачисление. |
| `placementTests` | `placementTests` | Определения онлайн-тестов на определение уровня владения языком. |
| `placementTestAttempts` | `placementTestAttempts`| Результаты прохождения тестов пользователями (баллы, определенный уровень). |
| `promotions` | `promotions` | Справочник скидок и рекламных предложений (промокоды, лимиты использований). |
| `payments` | `payments` | Записи о транзакциях и оплате обучения. |

---

## 3. Маршруты и роутеры Backend (tRPC)

tRPC-роутеры находятся в `server/routers/` и регистрируются в главном роутере `server/routers.ts`.

### Полный реестр процедур и уровней доступа

| Роутер (файл в `server/routers/`) | Имя процедуры | Тип | Доступ | Описание |
| :--- | :--- | :--- | :--- | :--- |
| **`auth`** | `me` | `query` | `publicProcedure` | Возвращает объект текущего авторизованного пользователя. |
| | `login` | `mutation` | `publicProcedure` | Авторизация по email/nickname и паролю. Устанавливает куку `session_token`. |
| | `logout` | `mutation` | `publicProcedure` | Очищает сессионные куки. |
| **`content`** | `publicAnnouncements` | `query` | `publicProcedure` | Список опубликованных объявлений. |
| | `publicPrograms` | `query` | `publicProcedure` | Список активных учебных программ. |
| | `publicProgram` | `query` | `publicProcedure` | Получение программы по ее `slug`. |
| | `publicTestimonials` | `query` | `publicProcedure` | Список промодерированных отзывов. |
| | `publicTeamProfiles` | `query` | `publicProcedure` | Список профилей преподавателей. |
| | `siteSettings` | `query` | `publicProcedure` | Получение публичных настроек сайта. |
| | `listPrograms` | `query` | `adminProcedure` | Полный список программ (для админ-панели). |
| | `addProgram` | `mutation` | `adminProcedure` | Добавление новой программы. |
| | `updateProgram` | `mutation` | `adminProcedure` | Обновление программы. |
| | `deleteProgram` | `mutation` | `adminProcedure` | Удаление программы. |
| | `listTestimonials` | `query` | `adminProcedure` | Список всех отзывов для модерации. |
| | `createTestimonial` | `mutation` | `adminProcedure` | Создание отзыва. |
| | `updateTestimonial` | `mutation` | `adminProcedure` | Изменение и модерация отзыва. |
| | `deleteTestimonial` | `mutation` | `adminProcedure` | Удаление отзыва. |
| | `listTeamProfiles` | `query` | `adminProcedure` | Список всех профилей сотрудников. |
| | `addTeamProfile` | `mutation` | `adminProcedure` | Добавление сотрудника. |
| | `updateTeamProfile` | `mutation` | `adminProcedure` | Изменение профиля сотрудника. |
| | `deleteTeamProfile` | `mutation` | `adminProcedure` | Удаление сотрудника. |
| | `updateSiteSettings` | `mutation` | `founderProcedure` | Обновление глобальных настроек сайта. |
| | `updateMarketingPromo` | `mutation` | `contentManagerProcedure`| Обновление данных глобального промо-баннера. |
| **`promotions`** | `validate` | `mutation` | `publicProcedure` | Проверка и расчет скидки по промокоду. |
| | `list` | `query` | `marketingProcedure` | Список всех промо-акций в справочнике. |
| | `publicList` | `query` | `publicProcedure` | Список публичных активных промо-акций для главной. |
| | `create` | `mutation` | `marketingProcedure` | Добавление новой промо-акции/скидки. |
| | `delete` | `mutation` | `marketingProcedure` | Удаление промо-акции. |
| **`payments`** | `create` | `mutation` | `publicProcedure` | Инициализация платежа (генерация квитанции). |
| | `list` | `query` | `publicProcedure` | Студенты видят свои платежи, администраторы — все. |
| | `updateStatus` | `mutation` | `adminProcedure` | Ручное изменение статуса платежа администратором. |
| | `simulateToyyibpayWebhook` | `mutation` | `publicProcedure` | Имитация вебхука от ToyyibPay для зачисления платежей. |
| **`audit`** | `list` | `query` | `auditProcedure` | Постраничный список логов аудита с фильтрами. |
| | `suggestions` | `query` | `auditProcedure` | Автодополнение поисковых запросов в журнале. |
| | `exportCsv` | `mutation` | `auditProcedure` | Экспорт отфильтрованных логов аудита в формате CSV. |
| | `exportPdf` | `mutation` | `auditProcedure` | Экспорт отфильтрованных логов аудита в формате PDF (Base64). |
| | `archive` | `mutation` | `founderProcedure` | Архивация логов старше 12 месяцев. |
| | `restore` | `mutation` | `founderProcedure` | Восстановление логов из архива в активную таблицу. |
| **`students`** | `list` | `query` | `founderProcedure` | Постраничный список профилей студентов. |
| | `byId` | `query` | `founderProcedure` | Профиль студента по его ID. |
| | `create` | `mutation` | `founderProcedure` | Зачисление студента и создание аккаунта. |
| | `update` | `mutation` | `founderProcedure` | Обновление личной карточки студента. |
| | `remove` | `mutation` | `founderProcedure` | Удаление студенческой карточки. |
| | `uploadDocument` | `mutation` | `founderProcedure` | Загрузка студенческого документа. |
| | `removeDocument` | `mutation` | `founderProcedure` | Удаление студенческого документа. |
| **`superAdminUsers`** | `list` | `query` | `superAdminProcedure` | Список учетных записей, находящихся в ведении Super Admin. |
| | `byId` | `query` | `superAdminProcedure` | Получение пользователя по ID. |
| | `formSchema` | `query` | `superAdminProcedure` | Получение полей конструктора форм (без скрытых секций). |
| | `create` | `mutation` | `superAdminProcedure` | Создание scoped-пользователя (student/teacher/marketing/admin). |
| | `update` | `mutation` | `superAdminProcedure` | Обновление scoped-пользователя. |
| | `remove` | `mutation` | `superAdminProcedure` | Удаление scoped-пользователя. |
| **`users`** | `list` | `query` | `founderProcedure` | Полный список всех пользователей системы (включая админов). |
| | `formSchema` | `query` | `founderProcedure` | Получение полной схемы конструктора профилей. |
| | `updateSystemFields` | `mutation` | `founderProcedure` | Изменение настроек системных полей. |
| | `createSection` | `mutation` | `founderProcedure` | Добавление секции кастомных полей. |
| | `updateSection` | `mutation` | `founderProcedure` | Изменение секции кастомных полей. |
| | `removeSection` | `mutation` | `founderProcedure` | Удаление секции кастомных полей. |
| | `createField` | `mutation` | `founderProcedure` | Добавление кастомного поля. |
| | `updateField` | `mutation` | `founderProcedure` | Изменение кастомного поля. |
| | `removeField` | `mutation` | `founderProcedure` | Удаление кастомного поля. |
| | `reorderFields` | `mutation` | `founderProcedure` | Изменение порядка сортировки полей. |

---

## 4. Страницы и маршруты Frontend

Маршрутизация на клиенте построена на базе библиотеки **wouter** (`client/src/App.tsx`).

### Таблица маршрутов и ролей

| URL | Компонент страницы | Уровень доступа | Описание |
| :--- | :--- | :--- | :--- |
| `/` | `Home` | `public` | Главная страница языкового центра. |
| `/programs` | `Programs` | `public` | Каталог учебных программ и курсов. |
| `/programs/:slug`| `ProgramDetail` | `public` | Детальная карточка программы (описание, FAQ, результаты). |
| `/about` | `About` | `public` | Страница "О нас" (миссия, преподавательский состав). |
| `/news` | `News` | `public` | Раздел новостей, событий и объявлений. |
| `/contact` | `Contact` | `public` | Контакты, интерактивная карта кампуса, отправка запросов. |
| `/enroll` | `Enroll` | `public` | Интерактивная многошаговая форма онлайн-зачисления. |
| `/login` | `FounderLogin` | `public` | Универсальная защищенная страница входа в систему. |
| `/dashboard` | `UserDashboard` | `protected` | Личный кабинет пользователя (заполнение анкеты онбординга). |
| `/teacher` | `TeacherDashboard` | `teacher` | Кабинет преподавателя (посещаемость, ведомости успеваемости). |
| `/marketing` | `MarketingDashboard` | `marketing` / `admin` | Панель маркетолога (лиды, WhatsApp, промокоды, CTA, пиксели). |
| `/admin` | `Admin` | `admin` / `founder` | Панель академического директора (студенты, медиа, новости). |
| `/super-admin` | `SuperAdmin` | `super_admin` | Панель системного администратора (управление персоналом). |

### Механизм защиты маршрутов на фронтенде
Защита клиентских путей выполняется внутри самих страниц при помощи кастомного хука авторизации `useAuth()` (`client/src/_core/hooks/useAuth.ts`).

Пример реализации ролевого гарда в `Admin.tsx` и `SuperAdmin.tsx`:
```typescript
const { user, loading } = useAuth();

useEffect(() => {
  if (loading) return;
  if (!user) {
    window.location.replace("/login");
  } else if (user.role !== "founder" && user.role !== "admin") {
    // Редирект в зависимости от роли при несовпадении прав
    window.location.replace(user.role === "super_admin" ? "/super-admin" : "/dashboard");
  }
}, [loading, user]);
```

### Ключевые переиспользуемые интерфейсные модули
1. `DashboardLayout.tsx`: Универсальная боковая панель навигации, адаптирующаяся под роли и поддерживающая темную/светлую тему, локализацию интерфейса и адаптивное меню на мобильных.
2. `DynamicUserProfileFields.tsx`: Рендерер полей профиля. Получает с бэкенда схему полей и автоматически отрисовывает нужные типы инпутов (`text`, `dropdown`, `checkbox`, `file` и др.) с проверкой валидации.
3. `UserFieldBuilder.tsx`: Визуальный интерфейс конструктора форм для роли `founder`, позволяющий перетаскивать, отключать и добавлять новые поля анкеты.

---

## 5. Контент и бизнес-данные

### Учебные программы и тарифная сетка 2026
Все 10 основных учебных программ BILC полностью перенесены в структурированный вид в базу данных (включая переводы и поля метаданных):
- **General English** (slug: `general-english`): Общий английский для подростков и взрослых.
- **Kids English** (slug: `kids-english`): Игровой английский для детей.
- **Speaking & Conversation** (slug: `speaking-conversation`): Разговорный курс.
- **IELTS Preparation** (slug: `ielts-preparation`): Академическая подготовка к экзаменам.
- **Bahasa Melayu** (slug: `bahasa-melayu`): Программа государственного языка Малайзии.
- **Mandarin**, **Arabic**, **Japanese**, **Korean**: Программы мировых языков (рубрика "World Languages").
- **Business English** (slug: `business-english`): Деловой английский для корпоративных клиентов.

*Что осталось статическим текстом*: Специфические сезонные "Летние лагеря" (Summer Camps) и "Индивидуальные уроки" (Private Lessons) описаны в интерфейсе и табах тарифной сетки на главной странице в виде локализованных текстовых блоков, но не имеют выделенных записей в таблице `programs` БД, так как их ценообразование и расписание строго индивидуальны и строятся на базе прямых консультаций Admissions Office.

### Отзывы (Testimonials)
Отзывы полностью переведены на базу данных (таблица `testimonials`). Для обеспечения безопасности и защиты персональных данных отзывы выводятся на главной странице только при наличии флагов:
- `approved = true` (прошел модерацию маркетологом/администратором).
- `consentConfirmed = true` (подтверждено согласие автора на публикацию).

### Поддержка медиафайлов
Медиатека поддерживает загрузку изображений и документов (PDF, PNG, JPG, JPEG). Загрузка файлов выполняется на бэкенде. Для картинок в статьях и аватарок поддерживается ограничение размера до 10 МБ. В базе данных хранится `imageUrl` / `imageStorageKey` для корректной раздачи ассетов.

---

## 6. Локализация (i18n)

### Поддерживаемые языки
Платформа на 100% поддерживает три языка с мгновенным переключением без перезагрузки страницы:
- **`en`** (English) — язык по умолчанию (LTR).
- **`ms`** (Bahasa Melayu) — малайский язык (LTR).
- **`ar`** (العربية) — арабский язык (с полной поддержкой **RTL** направления текста на уровне разметки, стилей Tailwind и разворота интерфейса).

### Хранение переводов
Переводы хранятся статически в файле `/client/src/lib/translations.ts` в виде типизированного словаря `TranslationDictionary` для высокой скорости работы. 

Для динамического контента (программы, новости) локализация поддерживается за счет хранения мультиязычных описаний или автоматического переключения полей, запрашиваемых через tRPC (таблица `translations` кэширует переводы, запрашиваемые у встроенных переводчиков при необходимости).

---

## 7. Динамический конструктор профилей (Dynamic Profile Builder)

Dynamic Profile Builder позволяет изменять структуру собираемых данных пользователей "на лету" без внесения изменений в код или миграций базы данных.

### Структура `RuntimeUserSystemField`
Описывает базовые поля учетной записи, которые всегда необходимы системе:
```typescript
export type RuntimeUserSystemField = {
  id: "name" | "nickname" | "role" | "password" | "isActive";
  label: string;
  inputType: "text" | "role" | "password" | "checkbox";
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
  sectionId: number | null;
};
```
*Миграция*: В системе реализована автомиграция устаревшего системного идентификатора поля `email` в современный `nickname` для соответствия уникальным именам входа BILC (например, `user@bilc.my`).

### Конфигурация кастомных полей
Для кастомных полей поддерживаются следующие типы (`fieldType`):
- `text` — однострочный текст.
- `textarea` — многострочный текст.
- `number` — числовые данные.
- `date` — дата (календарь).
- `dropdown` — выпадающий список (опции хранятся в `optionsJson`).
- `checkbox` — логический флаг (да/нет).
- `file` — загрузка документов.

Каждое кастомное поле может быть привязано к этапу сбора данных (`collectionStage`):
- `atRegistration` — заполняется при подаче заявки гостем.
- `atFirstLogin` — запрашивается при первом входе пользователя в систему.

---

## 8. Платежи

В системе реализована интеграция с популярным малайзийским платежным шлюзом **ToyyibPay** (FPX Bank Transfer / карточные переводы).

### Статусы транзакций
Платежи сохраняются в таблице `payments` со следующими статусами:
- `pending` — платеж ожидает оплаты пользователем.
- `completed` — оплата успешно проведена шлюзом.
- `failed` — транзакция отклонена или произошел сбой.
- `refunded` — средства возвращены студенту администратором.

### Интеграция с учебным процессом
При вызове вебхука шлюза (`simulateToyyibpayWebhook`), в случае статуса `completed` бэкенд находит связанного по `userId` пользователя, проверяет наличие активных учебных заявок (`applications`) в статусе рассмотрения (`submitted`, `underReview`, `offerIssued`) и автоматически переводит их в статус **`paymentCompleted`** (Оплата зачисления подтверждена).

---

## 9. Аудит и безопасность

### Журнал событий (Audit Logs)
Таблица `auditLogs` хранит полную историю значимых событий в системе безопасности центра. Каждая запись содержит:
- Идентификатор инициатора (`actorUserId`) и его роль (`actorRole`).
- Детали сетевого окружения (`ipAddress`, `userAgent`, `browser`, `operatingSystem`).
- Название действия (`action`, например, `user.create`, `student_document.upload`).
- Сущность-цель (`targetType`, `targetId`, `targetRole`).
- Флаг успешности (`isSuccess`).
- Поле `metadataJson` — расширенные контекстные данные действия.

### Безопасность метаданных и паролей
1. **Маскирование логов**: При сохранении `metadataJson` перед записью в БД данные прогоняются через санитайзер, который находит и полностью вырезает (`[redacted]`) любые чувствительные ключи по регулярному выражению:
   ```typescript
   const sensitiveKey = /(password|secret|token|cookie|authorization|hash|profile.?values?|raw.?body|credential)/i;
   ```
2. **Безопасность паролей**: Пароли пользователей никогда не хранятся в открытом виде. Хеширование выполняется с использованием криптостойкого алгоритма **scrypt** (`node:crypto`) со случайной 16-байтовой солью:
   ```typescript
   export function createUserPasswordHash(password: string) {
     const salt = randomBytes(16).toString("hex");
     return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
   }
   ```
   Проверка хеша защищена от атак по времени благодаря использованию `crypto.timingSafeEqual()`.

### Периодическая ротация и архивация логов (`scheduledAuditRotation`)
В бэкенд встроена функция автоматической архивации логов безопасности:
- Выполняется транзакционно через метод `archiveExpiredAuditLogs()`.
- Записи старше **12 месяцев** автоматически вырезаются из таблицы `auditLogs` и переносятся в архивную таблицу `auditLogArchives`.
- Записи архива сохраняют ссылку на ID пользователя-инициатора ротации (`archivedByUserId`).
- Из интерфейса панели Founders доступна операция восстановления (`restore`) архивных записей обратно в активный лог.

---

## 10. Инфраструктура и деплой

### Хостинг и Среда выполнения
- **Хостинг**: Платформа развернута в контейнеризованной среде **Google Cloud Run** в регионе `asia-east1`.
- **База данных**: Управляемый инстанс MySQL. Соединение конфигурируется через переменную `DATABASE_URL`. При локальной разработке или в песочнице бэкенд автоматически переходит на стабильную инкрементальную in-memory имитацию СУБД.

### Поддержка PWA / Offline режима
Платформа полностью соответствует спецификациям Progressive Web Apps:
- Настроен файл манифеста `./client/public/manifest.webmanifest` с иконками, цветами темы (`#10253E`) и типом отображения `standalone`.
- Подключен собственный сервис-воркер (`sw.js`), кэширующий ключевые статические ассеты, шрифты и основные страницы портала для бесперебойного отображения заглушки "Offline Indicator" при обрыве интернет-соединения.

---

## 11. Известные ограничения и технический долг

1. **Токены во фреймах**: Из-за ограничений безопасности браузеров в отношении сторонних файлов cookie (Safari ITP / Chrome Sandbox) при работе в iframe AI Studio, бэкенд дублирует валидацию сессий через `Authorization: Bearer <token>` заголовки, а фронтенд зеркалирует куку в `sessionStorage` и `localStorage` под ключами `manus-cookie` и `manus-session-token`. При переносе на مستقل-домен куки будут работать стандартным образом.
2. **Сезонные программы**: Такие курсы, как "Summer Camp" (Летний лагерь) и "Private Lessons", не имеют карточек в БД `programs`. Это сделано намеренно для упрощения контент-менеджмента, но при необходимости масштабирования сетки тарифов их можно добавить в справочник.
3. **Webhook ToyyibPay**: Симуляция вебхука полностью покрывает бизнес-логику зачисления. Для перевода в продакшн-режим ToyyibPay потребуется заменить симуляционный эндпоинт на реальный парсер секретной подписи ToyyibPay Signature Key.
