/**
 * Отображение «сырое enum-значение из БД» → ключ локали.
 *
 * Зачем: поля `category` и `language` в таблице programs — технические
 * (по ним идёт фильтрация и сравнение), поэтому в i18n-sync они исключены
 * из перевода. Но в интерфейсе они видны пользователю, и на ms/ar
 * выводились как есть: «ENGLISH PROGRAM», «برنامج ENGLISH».
 *
 * Правило: логика и фильтры продолжают работать с СЫРЫМ значением,
 * а на экран отдаётся перевод через t(). Неизвестное значение
 * возвращается как есть — интерфейс не ломается при добавлении категории.
 */

/** Программные категории. */
const CATEGORY_KEYS: Record<string, string> = {
  english: "category.english",
  kids: "category.kids",
  professional: "category.professional",
  "world languages": "category.worldLanguages",
  worldlanguages: "category.worldLanguages",
};

/** Языки программ. */
const LANGUAGE_KEYS: Record<string, string> = {
  english: "languageName.english",
  "bahasa melayu": "languageName.bahasaMelayu",
  bahasamelayu: "languageName.bahasaMelayu",
  mandarin: "languageName.mandarin",
  arabic: "languageName.arabic",
  japanese: "languageName.japanese",
  korean: "languageName.korean",
};

/** Категории новостей (значения enum в БД — в нижнем регистре). */
const NEWS_CATEGORY_KEYS: Record<string, string> = {
  announcement: "newsCategory.announcement",
  event: "newsCategory.event",
  holiday: "newsCategory.holiday",
};

function normalize(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function resolve(
  table: Record<string, string>,
  raw: string | null | undefined,
  translate: (key: string, fallback: string) => string
): string {
  if (!raw) return "";
  const key = table[normalize(raw)];
  // Неизвестное значение (новая категория в БД) — показываем как есть.
  return key ? translate(key, raw) : raw;
}

export type EnumTranslator = (key: string, fallback: string) => string;

export function categoryLabel(raw: string | null | undefined, translate: EnumTranslator): string {
  return resolve(CATEGORY_KEYS, raw, translate);
}

export function languageLabel(raw: string | null | undefined, translate: EnumTranslator): string {
  return resolve(LANGUAGE_KEYS, raw, translate);
}

export function newsCategoryLabel(raw: string | null | undefined, translate: EnumTranslator): string {
  return resolve(NEWS_CATEGORY_KEYS, raw, translate);
}

/** Роли пользователей: сырое значение → ключ локали. */
const ROLE_KEYS: Record<string, string> = {
  student: "role.student",
  teacher: "role.teacher",
  marketing: "role.marketing",
  admin: "role.admin",
  super_admin: "role.superAdmin",
  superadmin: "role.superAdmin",
  founder: "role.founder",
  user: "role.user",
};

export function roleLabel(raw: string | null | undefined, translate: EnumTranslator): string {
  return resolve(ROLE_KEYS, raw, translate);
}

/** Полный список ключей — используется в проверках и в ревью-таблице. */
export const ENUM_LABEL_KEYS: string[] = [
  ...Object.values(CATEGORY_KEYS),
  ...Object.values(LANGUAGE_KEYS),
  ...Object.values(NEWS_CATEGORY_KEYS),
  ...Object.values(ROLE_KEYS),
];
