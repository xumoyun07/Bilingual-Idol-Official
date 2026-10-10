/**
 * Секции seed, которые НИКОГДА не переводятся и не попадают в очередь Azure.
 *
 * Вынесено в отдельный модуль, чтобы это правило можно было проверить
 * юнит-тестом, не запуская scripts/i18n-sync.ts (он выполняет main() при импорте).
 *
 * --- Почему seed.tests исключён ---
 *
 * Placement-тест измеряет АНГЛИЙСКУЮ грамматику. Его неверные варианты
 * неверны именно из-за английского словоизменения:
 *   go / goes / going, have / has / had, will cancel / would cancel / cancelled,
 *   in / on / at, I has / I have / I having.
 *
 * После первого боевого прогона перевода 5 из 10 вопросов стали нерешаемыми —
 * варианты совпали:
 *   EN  [0] I has a dog.               [1] I have a dog.                [2] I having a dog.
 *   MS  [0] Saya ada seekor anjing.    [1] Saya ada seekor anjing.     [2] Saya ada anjing.
 *   AR  [0] لدي كلب.                    [1] لدي كلب.                     [2] أنا أمتلك كلبا.
 * Вопрос 4 (have / has / had) в малайском потерял различие между всеми тремя вариантами.
 *
 * Поэтому тест остаётся английским на всех языках. Переводится только
 * обрамление — заголовок, кнопки, инструкции — через t()-строки.
 *
 * В en.json секция сохраняется как источник истины; в ms/ar не создаётся вовсе,
 * поэтому её поля физически не могут попасть в очередь на перевод.
 */
export const SEED_SECTIONS_NEVER_TRANSLATED: readonly string[] = ["tests"];

export function isNeverTranslatedSection(section: string): boolean {
  return SEED_SECTIONS_NEVER_TRANSLATED.includes(section);
}

/** Все секции seed, которые обрабатываются вообще (для проверки структуры файлов). */
export const SEED_SECTIONS: readonly string[] = [
  "programs",
  "news",
  "promo",
  "tests",
  "faq",
  "cms",
  "settings",
];
