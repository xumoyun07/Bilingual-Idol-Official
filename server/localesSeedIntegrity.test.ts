/**
 * Целостность файлов локалей относительно источника истины.
 *
 * Постоянное доказательство того, что перевод контента не затронул
 * структуру тестов и не утащил в файлы локалей правильные ответы.
 *
 * Проверяет:
 *   - одинаковый набор ключей в en / ms / ar;
 *   - корректность каждой записи (value / sourceHash / reviewed);
 *   - совпадение sourceHash у перевода с хэшем английского оригинала;
 *   - структуру placement-тестов: те же id вопросов и то же число вариантов,
 *     что и в inMemoryStore;
 *   - отсутствие ключей answer/level в секции тестов (правильные ответы
 *     в локали не попадают);
 *   - что все seed-поля, кроме белого списка, действительно переведены.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { inMemoryStore } from "./db.js";
import { isNeverTranslatedSection } from "./services/i18nSections.js";

const LOCALES_DIR = path.resolve("client/src/locales");
const LANGS = ["en", "ms", "ar"] as const;

const sourceHash = (text: string) =>
  crypto.createHash("md5").update(text, "utf8").digest("hex").slice(0, 8);

type Entry = { value: string; sourceHash: string; reviewed: boolean };

function readLocale(lang: string): { ui: Record<string, Entry>; seed: Record<string, any> } {
  return JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${lang}.json`), "utf-8"));
}

/** Плоская карта путь -> запись, включая вложенные объекты. */
function flattenEntries(node: any, prefix = ""): Record<string, Entry> {
  const out: Record<string, Entry> = {};
  for (const [key, value] of Object.entries(node ?? {})) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && "value" in (value as any) && "sourceHash" in (value as any)) {
      out[full] = value as Entry;
    } else if (value && typeof value === "object") {
      Object.assign(out, flattenEntries(value, full));
    }
  }
  return out;
}

/** Ищет ключи по имени на любой глубине — для проверки утечки answer/level. */
function collectKeyNames(node: any, found: string[] = []): string[] {
  for (const [key, value] of Object.entries(node ?? {})) {
    found.push(key);
    if (value && typeof value === "object") collectKeyNames(value, found);
  }
  return found;
}

const en = readLocale("en");
const ms = readLocale("ms");
const ar = readLocale("ar");

describe("Локали: структура и записи", () => {
  it("во всех трёх файлах есть секции ui и seed", () => {
    for (const lang of LANGS) {
      const data = readLocale(lang);
      expect(Object.keys(data), lang).toContain("ui");
      expect(Object.keys(data), lang).toContain("seed");
    }
  });

  it("наборы ключей ui и seed совпадают между en, ms и ar (кроме непереводимых секций)", () => {
    const keysOf = (data: any) => [
      ...Object.keys(flattenEntries(data.ui)).map((k) => `ui.${k}`),
      ...Object.keys(flattenEntries(data.seed))
        .map((k) => `seed.${k}`)
        // Секции из SEED_SECTIONS_NEVER_TRANSLATED существуют только в en,
        // поэтому из сравнения их исключаем — их отсутствие в ms/ar ожидаемо.
        .filter((k) => !isNeverTranslatedSection(k.split(".")[1] ?? "")),
    ].sort();

    const enKeys = keysOf(en);
    expect(keysOf(ms)).toEqual(enKeys);
    expect(keysOf(ar)).toEqual(enKeys);
  });

  it("каждая запись имеет корректные value, sourceHash и reviewed", () => {
    for (const lang of LANGS) {
      const data = readLocale(lang);
      const all = { ...flattenEntries(data.ui), ...flattenEntries(data.seed) };
      expect(Object.keys(all).length).toBeGreaterThan(0);
      for (const [key, entry] of Object.entries(all)) {
        expect(typeof entry.value, `${lang} ${key}`).toBe("string");
        expect(entry.sourceHash, `${lang} ${key}`).toMatch(/^[0-9a-f]{8}$/);
        expect(typeof entry.reviewed, `${lang} ${key}`).toBe("boolean");
      }
    }
  });

  it("sourceHash перевода совпадает с хэшем английского оригинала", () => {
    const enEntries = { ...flattenEntries(en.ui), ...flattenEntries(en.seed) };
    for (const lang of ["ms", "ar"]) {
      const data = readLocale(lang);
      const translated = { ...flattenEntries(data.ui), ...flattenEntries(data.seed) };
      for (const [key, entry] of Object.entries(translated)) {
        const source = enEntries[key];
        expect(source, `${lang} ${key} отсутствует в en`).toBeDefined();
        expect(entry.sourceHash, `${lang} ${key}`).toBe(source.sourceHash);
        expect(entry.sourceHash, `${lang} ${key}`).toBe(sourceHash(source.value));
      }
    }
  });
});

describe("Локали: placement-тесты не изменили структуру", () => {
  const sourceTests = (inMemoryStore as any).placementTests ?? [];

  it("источник содержит хотя бы один тест", () => {
    expect(sourceTests.length).toBeGreaterThan(0);
  });

  it("id вопросов и число вариантов совпадают с inMemoryStore (источник — en)", () => {
    for (const test of sourceTests) {
      const questions = JSON.parse(test.questionsJson);
      const localised = en.seed.tests[String(test.id)];
      expect(localised, `en тест ${test.id} отсутствует`).toBeDefined();

      const localisedIds = Object.keys(localised.questions).sort();
      const sourceIds = questions.map((q: any) => String(q.id)).sort();
      expect(localisedIds, `en тест ${test.id}: набор id вопросов`).toEqual(sourceIds);

      for (const question of questions) {
        const localisedQuestion = localised.questions[String(question.id)];
        expect(
          Object.keys(localisedQuestion.options).length,
          `en тест ${test.id} вопрос ${question.id}: число вариантов`
        ).toBe(question.options.length);
      }
    }
  });

  it("правильные ответы и уровни НЕ попали в файлы локалей", () => {
    for (const lang of LANGS) {
      const keyNames = collectKeyNames(readLocale(lang).seed.tests);
      expect(keyNames, `${lang}: обнаружен ключ answer`).not.toContain("answer");
      expect(keyNames, `${lang}: обнаружен ключ level`).not.toContain("level");
    }
  });

  it("текст вопросов и вариантов в en совпадает с источником", () => {
    for (const test of sourceTests) {
      const questions = JSON.parse(test.questionsJson);
      const enTest = en.seed.tests[String(test.id)];
      for (const question of questions) {
        expect(enTest.questions[String(question.id)].text.value).toBe(question.text);
        question.options.forEach((option: string, index: number) => {
          expect(enTest.questions[String(question.id)].options[String(index)].value).toBe(option);
        });
      }
    }
  });

  it("seed.tests отсутствует в ms/ar либо совпадает с en слово в слово", () => {
    // Тест измеряет английскую грамматику, поэтому в целевых языках его быть
    // не должно. Если секция когда-нибудь появится, она обязана быть побайтово
    // равна английской — тогда фоллбек и вывод останутся английскими.
    for (const lang of ["ms", "ar"]) {
      const tests = readLocale(lang).seed.tests;
      if (tests === undefined) continue; // ожидаемый случай
      expect(tests, `${lang}: seed.tests должен отсутствовать или совпадать с en`).toEqual(en.seed.tests);
    }
  });

  it("ни одно поле теста не может попасть в очередь i18n-sync", () => {
    // Механизм исключения: секция входит в SEED_SECTIONS_NEVER_TRANSLATED,
    // поэтому в ms/ar для неё не создаётся ни одной записи, а очередь
    // строится именно из ОТСУТСТВУЮЩИХ переводов.
    expect(isNeverTranslatedSection("tests")).toBe(true);
    for (const section of ["programs", "news", "promo", "settings", "faq", "cms"]) {
      expect(isNeverTranslatedSection(section), `секция ${section} не должна быть исключена`).toBe(false);
    }

    const enSeedPaths = Object.keys(flattenEntries(en.seed));
    const enTestPaths = enSeedPaths.filter((key) => key === "tests" || key.startsWith("tests."));
    expect(enTestPaths.length, "en должен содержать секцию tests как источник").toBeGreaterThan(0);

    for (const lang of ["ms", "ar"]) {
      const localised = flattenEntries(readLocale(lang).seed);
      const present = enTestPaths.filter((key) => localised[key] !== undefined);
      expect(present, `${lang}: тестовые поля присутствуют и могут уйти в очередь`).toHaveLength(0);
    }
  });
});

describe("Локали: переводы действительно выполнены", () => {
  it("все seed-поля переведены, кроме помеченных reviewed=true", () => {
    const enSeed = flattenEntries(en.seed);
    for (const lang of ["ms", "ar"]) {
      const localised = flattenEntries(readLocale(lang).seed);
      const untranslated: string[] = [];
      for (const [key, source] of Object.entries(enSeed)) {
        const entry = localised[key];
        if (!entry) continue;
        if (entry.reviewed) continue; // белый список: переводить не требуется
        if (entry.value === source.value) untranslated.push(key);
      }
      expect(untranslated, `${lang}: не переведены`).toHaveLength(0);
    }
  });
});
