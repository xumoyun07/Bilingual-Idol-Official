import fs from "fs";
import path from "path";
import { translations } from "../client/src/lib/translations.js";

// Helper to flatten nested translation dictionary into dot-separated keys
function flattenDictionary(obj: any, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenDictionary(value, fullKey));
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}

interface LocaleEntry {
  value: string;
  __TODO__?: boolean;
}

type LocaleFileContent = Record<string, string | LocaleEntry>;

function syncLocale(lang: "ms" | "ar", enDict: Record<string, string>, targetDict: Record<string, string>) {
  const localesDir = path.resolve("client/src/locales");
  if (!fs.existsSync(localesDir)) {
    fs.mkdirSync(localesDir, { recursive: true });
  }

  const filePath = path.join(localesDir, `${lang}.json`);
  let existing: LocaleFileContent = {};

  if (fs.existsSync(filePath)) {
    try {
      existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (err) {
      console.warn(`[i18n:sync] Failed to parse existing ${lang}.json, regenerating fresh.`);
      existing = {};
    }
  }

  const result: LocaleFileContent = {};

  let added = 0;
  let updated = 0;
  let skipped = 0;
  let todoCount = 0;

  for (const [key, enVal] of Object.entries(enDict)) {
    const tsVal = targetDict[key] ?? "";
    const isUntranslated = !tsVal || tsVal === enVal;

    if (existing[key] !== undefined) {
      const existingEntry = existing[key];
      const existingVal = typeof existingEntry === "string" ? existingEntry : existingEntry.value;
      const hadTodo = typeof existingEntry === "object" && existingEntry.__TODO__;

      // If existing had TODO, but translations.ts now has a real translation
      if (hadTodo && !isUntranslated) {
        result[key] = tsVal;
        updated++;
      } else if (hadTodo && isUntranslated) {
        // Keep existing TODO entry
        result[key] = { value: existingVal || tsVal || enVal, __TODO__: true };
        skipped++;
        todoCount++;
      } else {
        // Already translated manually or previously, preserve it without overwriting
        result[key] = existingEntry;
        skipped++;
      }
    } else {
      // New key not present in existing JSON
      if (isUntranslated) {
        result[key] = {
          value: tsVal || enVal,
          __TODO__: true,
        };
        todoCount++;
      } else {
        result[key] = tsVal;
      }
      added++;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(result, null, 2) + "\n", "utf-8");

  console.log(`[i18n:sync] ${lang}.json: добавлено: ${added}, обновлено: ${updated}, пропущено: ${skipped}, помечено как __TODO__: ${todoCount}`);
  return { added, updated, skipped, todoCount, totalKeys: Object.keys(result).length };
}

function run() {
  console.log("=== i18n:sync — Синхронизация статических переводов ===");
  console.log("Режим: локальная синхронизация без обращения к Azure API (квота не расходуется).\n");

  const enDict = flattenDictionary(translations.en);
  const msDict = flattenDictionary(translations.ms);
  const arDict = flattenDictionary(translations.ar);

  const totalEnKeys = Object.keys(enDict).length;
  console.log(`Ключей в словаре translations.ts (EN): ${totalEnKeys}`);

  const msStats = syncLocale("ms", enDict, msDict);
  const arStats = syncLocale("ar", enDict, arDict);

  console.log(`\nИтог:`);
  console.log(`- ms.json: всего ключей: ${msStats.totalKeys}`);
  console.log(`- ar.json: всего ключей: ${arStats.totalKeys}`);
  console.log("\nСинхронизация завершена успешно.");
}

run();
