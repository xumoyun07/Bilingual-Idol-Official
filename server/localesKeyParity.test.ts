import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { translations } from "@/lib/translations";

/**
 * Паритет ключей: словарь-источник `client/src/lib/translations.ts`
 * и сгенерированные файлы `client/src/locales/*.json` должны совпадать
 * по набору ключей. Проверка перенесена сюда из временного скрипта
 * dsh-key-parity.ts, чтобы расхождение ловилось штатным прогоном тестов.
 */

type FlatDictionary = Record<string, string>;

function flatten(node: unknown, prefix = "", acc: FlatDictionary = {}): FlatDictionary {
  if (!node || typeof node !== "object") return acc;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) flatten(value, full, acc);
    else acc[full] = String(value);
  }
  return acc;
}

const LOCALES_DIR = path.join(process.cwd(), "client", "src", "locales");

function readLocaleFile(lang: string): Record<string, unknown> {
  const raw = fs.readFileSync(path.join(LOCALES_DIR, `${lang}.json`), "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}

const DICTIONARIES: Record<string, FlatDictionary> = {
  en: flatten(translations.en),
  ms: flatten(translations.ms),
  ar: flatten(translations.ar),
};

describe("паритет ключей translations.ts и locales/*.json", () => {
  it("файлы локалей существуют и читаются", () => {
    for (const lang of ["en", "ms", "ar"]) {
      const file = readLocaleFile(lang);
      expect(file).toHaveProperty("ui");
      expect(Object.keys(file.ui as object).length).toBeGreaterThan(0);
    }
  });

  it("словарь-источник не пуст", () => {
    expect(Object.keys(DICTIONARIES.en).length).toBeGreaterThan(0);
    expect(Object.keys(DICTIONARIES.ms).length).toBe(Object.keys(DICTIONARIES.en).length);
    expect(Object.keys(DICTIONARIES.ar).length).toBe(Object.keys(DICTIONARIES.en).length);
  });

  for (const lang of ["en", "ms", "ar"]) {
    it(`${lang}.json содержит ровно те же ключи, что и словарь`, () => {
      const file = readLocaleFile(lang);
      const fileKeys = new Set(Object.keys(file.ui as Record<string, unknown>));
      const dictKeys = new Set(Object.keys(DICTIONARIES[lang]));

      const missingInFile = [...dictKeys].filter((k) => !fileKeys.has(k)).sort();
      const extraInFile = [...fileKeys].filter((k) => !dictKeys.has(k)).sort();

      expect(missingInFile, `объявлены в translations.ts, но отсутствуют в ${lang}.json`).toEqual([]);
      expect(extraInFile, `есть в ${lang}.json, но нет в словаре`).toEqual([]);
    });
  }

  it("у каждого языка есть перевод каждого ключа en-словаря", () => {
    for (const lang of ["ms", "ar"]) {
      const missing = Object.keys(DICTIONARIES.en).filter((k) => !(k in DICTIONARIES[lang])).sort();
      expect(missing, `нет в словаре ${lang}`).toEqual([]);
    }
  });

  it("ключи promo.* присутствуют во всех трёх файлах (регрессия прошлой стадии)", () => {
    for (const lang of ["en", "ms", "ar"]) {
      const file = readLocaleFile(lang);
      const promoKeys = Object.keys(file.ui as Record<string, unknown>).filter((k) => k.startsWith("promo."));
      expect(promoKeys.length, `promo.* в ${lang}.json`).toBeGreaterThan(0);
    }
  });
});
