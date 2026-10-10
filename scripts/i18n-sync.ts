/**
 * i18n-sync — миграция локалей и синхронизация переводов через Azure Translator.
 *
 * Режимы:
 *   tsx scripts/i18n-sync.ts --migrate    — перестроить client/src/locales/{en,ms,ar}.json
 *                                           в формат { ui: {...}, seed: {...} }. Azure не вызывается.
 *   tsx scripts/i18n-sync.ts --dry-run    — только посчитать очередь и расход квоты. Ничего не пишет.
 *   tsx scripts/i18n-sync.ts              — боевой прогон: очередь -> Azure -> запись успешных переводов.
 *
 * Ключ Azure не логируется ни в одном режиме.
 */
import "dotenv/config"; // AZURE_TRANSLATOR_* читаются из .env до импорта переводчика
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { translations } from "../client/src/lib/translations.js";
import { inMemoryStore } from "../server/db.js";
import { marketingStore } from "../server/marketing.js";
import {
  getTranslatorUsage,
  protectContent,
  translateBatch,
  validateTranslation,
} from "../server/services/azureTranslator.js";
import { evaluateRealRunPreconditions, evaluateScriptStartup } from "../server/services/i18nEnvGuard.js";
import { isNeverTranslatedSection } from "../server/services/i18nSections.js";

// ============================================================================
// Конфигурация
// ============================================================================
const LOCALES_DIR = path.resolve("client/src/locales");
const SOURCE_LANG = "en";
const TARGET_LANGS = ["ms", "ar"] as const;
type TargetLang = (typeof TARGET_LANGS)[number];
const ALL_LANGS = ["en", "ms", "ar"] as const;
type Lang = (typeof ALL_LANGS)[number];

/**
 * Секции seed, которые НИКОГДА не переводятся и не попадают в очередь Azure.
 * Список и обоснование — в server/services/i18nSections.ts (там же объяснено,
 * почему seed.tests исключён: перевод делает грамматический тест нерешаемым).
 */

/** Месячный лимит — та же логика, что в server/services/azureTranslator.ts */
const MONTHLY_LIMIT = process.env.TRANSLATOR_MONTHLY_LIMIT
  ? parseInt(process.env.TRANSLATOR_MONTHLY_LIMIT, 10) || 1800000
  : 1800000;

/**
 * Белый список: бренды, платформы, аббревиатуры и имена собственные.
 * Такие строки НЕ уходят в Azure и сразу помечаются reviewed=true.
 */
const WHITELIST_TERMS = [
  // бренды проекта
  "Bilingual Idol", "BILC", "Pavilion Embassy",
  // сертификации и ведомства
  "IELTS", "MOHE", "KPT", "CEFR",
  // платформы
  "WhatsApp", "Facebook", "Instagram", "TikTok", "YouTube", "LinkedIn", "Google",
  // интерфейсные техслова из ТЗ
  "Media", "Menu",
  // имена собственные, которые в малайском пишутся так же:
  // "Bahasa Melayu" — уже малайский, "Mandarin" — идентичное заимствование.
  // Azure возвращал их без изменений, то есть платить за них не нужно.
  "Bahasa Melayu", "Mandarin",
  // имена собственные
  "Kuala Lumpur", "Malaysia", "Malay",
  // уровни CEFR
  "A1", "A2", "B1", "B2", "C1", "C2",
];

// ============================================================================
// Типы
// ============================================================================
interface LocaleEntry {
  value: string;
  sourceHash: string;
  reviewed: boolean;
}
type EntryTree = { [key: string]: LocaleEntry | EntryTree };

interface SeedField {
  /** Путь внутри секции seed, например ["programs", "general-english", "title"] */
  path: string[];
  /** Группа для отчётности: programs | news | promo | tests | faq | cms | settings */
  group: string;
  /** Английский исходник */
  en: string;
}

// ============================================================================
// Базовые утилиты
// ============================================================================
function flattenDictionary(obj: any, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flattenDictionary(value, full));
    } else {
      out[full] = String(value);
    }
  }
  return out;
}

/** md5 от английской строки, первые 8 символов */
export function sourceHash(text: string): string {
  return crypto.createHash("md5").update(text, "utf8").digest("hex").slice(0, 8);
}

/** true, если строка целиком состоит из элементов белого списка, цифр и пунктуации */
export function isWhitelisted(text: string): boolean {
  let rest = text;
  const terms = [...WHITELIST_TERMS].sort((a, b) => b.length - a.length);
  for (const term of terms) {
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    rest = rest.replace(re, " ");
  }
  rest = rest.replace(/[\s\d\p{P}\p{S}]/gu, "");
  return rest.length === 0;
}

/** Ключи, значения которых никогда не переводятся (адреса, ссылки, идентификаторы) */
const NON_TRANSLATABLE_KEY_RE =
  /address|\.url$|\.link$|\.href$|whatsapp_?number|slug|promo_code|emailPlaceholder|phonePlaceholder/i;

/**
 * true, если строка САМА ЯВЛЯЕТСЯ идентификатором (email / URL / телефон),
 * а не предложением, которое такой идентификатор содержит.
 * Предложения с email внутри переводить можно — protectContent() обернёт email в notranslate.
 */
export function isIdentifierOnly(text: string): boolean {
  const stripped = text
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]{2,}/g, " ") // email
    .replace(/(https?:\/\/|www\.)\S+/gi, " ") // URL
    .replace(/\+?\d[\d\s()\-.]{6,}/g, " ") // телефон
    .replace(/[\s\d\p{P}\p{S}]/gu, "");
  return stripped.length === 0;
}

/**
 * Итоговое решение «не переводить»: белый список, ключ-исключение или содержимое-идентификатор.
 * Такие элементы помечаются reviewed=true и не попадают в очередь Azure.
 */
export function shouldSkipTranslation(keyPath: string, enText: string): boolean {
  if (isWhitelisted(enText)) return true;
  if (NON_TRANSLATABLE_KEY_RE.test(keyPath)) return true;
  if (isIdentifierOnly(enText)) return true;
  return false;
}

function isEntry(value: unknown): value is LocaleEntry {
  return (
    !!value &&
    typeof value === "object" &&
    "value" in (value as any) &&
    "sourceHash" in (value as any)
  );
}

/** Читает локали в ЛЮБОМ формате (старый плоский или новый) и возвращает плоская карту путь -> entry */
function loadExisting(lang: Lang): Record<string, LocaleEntry> {
  const file = path.join(LOCALES_DIR, `${lang}.json`);
  const out: Record<string, LocaleEntry> = {};
  if (!fs.existsSync(file)) return out;
  let raw: any;
  try {
    raw = JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    console.warn(`[i18n] Не удалось разобрать ${lang}.json — считаю пустым.`);
    return out;
  }

  const isNewFormat = raw && typeof raw === "object" && ("ui" in raw || "seed" in raw);
  const walk = (node: any, prefix: string) => {
    if (isEntry(node)) {
      out[prefix] = {
        value: String((node as LocaleEntry).value ?? ""),
        sourceHash: String((node as LocaleEntry).sourceHash ?? ""),
        reviewed: Boolean((node as LocaleEntry).reviewed),
      };
      return;
    }
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) walk(v, prefix ? `${prefix}.${k}` : k);
      return;
    }
    // старое: плоская строка
    out[prefix] = { value: String(node ?? ""), sourceHash: "", reviewed: false };
  };

  if (isNewFormat) {
    for (const section of ["ui", "seed"]) {
      if (raw[section]) walk(raw[section], section);
    }
  } else {
    for (const [k, v] of Object.entries(raw)) walk(v, k);
  }
  return out;
}

function setPath(tree: EntryTree, parts: string[], entry: LocaleEntry) {
  let node: any = tree;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!node[key] || typeof node[key] !== "object" || isEntry(node[key])) node[key] = {};
    node = node[key];
  }
  node[parts[parts.length - 1]] = entry;
}

// ============================================================================
// Сбор seed-текстов из inMemoryStore (источник истины для EN)
// ============================================================================
const TRANSLATABLE_PROGRAM_FIELDS = [
  "title",
  "description",
  "ageGroup",
  "level",
  "duration",
  "schedule",
  "fees",
  "outcomes",
] as const;

function collectSeedFields(): SeedField[] {
  const fields: SeedField[] = [];
  const push = (group: string, p: string[], raw: unknown) => {
    if (typeof raw !== "string") return;
    const text = raw.trim();
    if (!text) return;
    fields.push({ group, path: p, en: text });
  };

  // ---- программы ----
  for (const p of (inMemoryStore as any).programs ?? []) {
    for (const f of TRANSLATABLE_PROGRAM_FIELDS) {
      push("programs", ["programs", p.slug, f], (p as any)[f]);
    }
    // faqJson — массив {question, answer}
    if (typeof (p as any).faqJson === "string") {
      try {
        const faq = JSON.parse((p as any).faqJson);
        if (Array.isArray(faq)) {
          faq.forEach((item: any, i: number) => {
            push("programs", ["programs", p.slug, "faq", String(i), "question"], item?.question);
            push("programs", ["programs", p.slug, "faq", String(i), "answer"], item?.answer);
          });
        }
      } catch {}
    }
  }

  // ---- новости / объявления ----
  for (const a of (inMemoryStore as any).announcements ?? []) {
    for (const f of ["title", "excerpt", "body", "imageAltText"] as const) {
      push("news", ["news", a.slug, f], (a as any)[f]);
    }
  }

  // ---- промо (текст, не код) ----
  for (const promo of (inMemoryStore as any).promotions ?? []) {
    for (const f of ["title", "description"] as const) {
      push("promo", ["promo", promo.code, f], (promo as any)[f]);
    }
  }

  // ---- тесты: только text и options, структура и правильный ответ не меняются ----
  for (const test of (inMemoryStore as any).placementTests ?? []) {
    push("tests", ["tests", String(test.id), "title"], test.title);
    if (typeof test.questionsJson === "string") {
      try {
        const questions = JSON.parse(test.questionsJson);
        if (Array.isArray(questions)) {
          for (const q of questions) {
            push("tests", ["tests", String(test.id), "questions", String(q.id), "text"], q.text);
            if (Array.isArray(q.options)) {
              q.options.forEach((opt: unknown, i: number) => {
                push("tests", ["tests", String(test.id), "questions", String(q.id), "options", String(i)], opt);
              });
            }
          }
        }
      } catch {}
    }
  }

  // ---- FAQ чат-бота ----
  for (const faq of (marketingStore as any).chatbotFaqEntries ?? []) {
    push("faq", ["faq", String(faq.id), "question"], faq.question);
    push("faq", ["faq", String(faq.id), "answer"], faq.answerText);
  }

  // ---- CMS-блоки ----
  for (const block of (marketingStore as any).contentBlocks ?? []) {
    push("cms", ["cms", String(block.id), "title"], block.title);
    push("cms", ["cms", String(block.id), "body"], block.body);
  }

  // ---- настройки сайта с публичным текстом ----
  const settings = { ...(marketingStore as any).systemSettings, ...(inMemoryStore as any).siteSettings };
  const PUBLIC_TEXT_SETTINGS = [
    "promo_title",
    "promo_text",
    "promo_cta_text",
    "promo_discount",
    "centre_name",
    "brand_tagline",
    "operating_hours",
    "operatingHours",
    "cta.apply_now.text",
    "cta.placement_test.text",
    "cta.book_visit.text",
    "cta.consultation.text",
  ];
  // Дефолты промо из server/db.ts:listSiteSettings()
  const promoDefaults: Record<string, string> = {
    promo_title: "Special Promotional Offer",
    promo_text:
      "Get exclusive access to all bilingual academic language programmes with a limited-time intake discount! Apply now and claim your student starter package.",
    promo_cta_text: "View Programmes",
    promo_discount: "15% OFF",
  };
  for (const key of PUBLIC_TEXT_SETTINGS) {
    push("settings", ["settings", key], settings[key] ?? promoDefaults[key]);
  }

  return fields;
}

// ============================================================================
// Построение файлов локалей
// ============================================================================
interface BuildResult {
  files: Record<Lang, EntryTree>;
  /** Пути, требующие перевода: lang -> массив путей */
  queue: Record<TargetLang, { path: string[]; section: "ui" | "seed"; en: string; oldValue: string }[]>;
  stats: {
    uiKeys: number;
    seedFields: number;
    whitelisted: number;
    alreadyTranslated: number;
    chars: Record<Lang, number>;
  };
}

function build(): BuildResult {
  const enDict = flattenDictionary(translations.en);
  const langDicts: Record<TargetLang, Record<string, string>> = {
    ms: flattenDictionary(translations.ms),
    ar: flattenDictionary(translations.ar),
  };

  const existing: Record<Lang, Record<string, LocaleEntry>> = {
    en: loadExisting("en"),
    ms: loadExisting("ms"),
    ar: loadExisting("ar"),
  };

  const seedFields = collectSeedFields();

  const files: Record<Lang, EntryTree> = { en: {}, ms: {}, ar: {} };
  const queue: BuildResult["queue"] = { ms: [], ar: [] };
  const chars: Record<Lang, number> = { en: 0, ms: 0, ar: 0 };
  let whitelistedCount = 0;
  let alreadyTranslated = 0;

  // ---------- секция ui ----------
  for (const [key, enText] of Object.entries(enDict)) {
    const hash = sourceHash(enText);
    const white = shouldSkipTranslation(key, enText);
    if (white) whitelistedCount++;

    // EN — источник, всегда reviewed=true
    setPath(files.en, ["ui", key], { value: enText, sourceHash: hash, reviewed: true });
    chars.en += enText.length;

    for (const lang of TARGET_LANGS) {
      // Приоритет: уже сохранённое значение в файле локали -> словарь translations.ts -> EN
      const prev = existing[lang][`ui.${key}`];
      const fromDict = langDicts[lang][key];
      let value = "";
      if (prev?.value) value = prev.value;
      else if (fromDict) value = fromDict;
      if (!value) value = enText;

      const translated = value !== enText;
      if (translated) alreadyTranslated++;

      setPath(files[lang], ["ui", key], { value, sourceHash: hash, reviewed: white });

      const needsTranslation = !white && !translated;
      if (needsTranslation) {
        queue[lang].push({ path: ["ui", key], section: "ui", en: enText, oldValue: value });
        chars[lang] += enText.length;
      }
    }
  }

  // ---------- секция seed ----------
  for (const field of seedFields) {
    const hash = sourceHash(field.en);
    const white = shouldSkipTranslation(field.path.join("."), field.en);
    if (white) whitelistedCount++;

    setPath(files.en, ["seed", ...field.path], { value: field.en, sourceHash: hash, reviewed: true });
    chars.en += field.en.length;

    // Секции из SEED_SECTIONS_NEVER_TRANSLATED существуют только в en:
    // в целевых языках записей не создаём, в очередь не ставим,
    // в оценке символов не учитываем.
    if (isNeverTranslatedSection(field.path[0])) continue;

    for (const lang of TARGET_LANGS) {
      const prev = existing[lang][`seed.${field.path.join(".")}`];
      let value = prev?.value ?? "";
      if (!value) value = field.en;

      const translated = value !== field.en;
      if (translated) alreadyTranslated++;

      setPath(files[lang], ["seed", ...field.path], {
        value,
        sourceHash: hash,
        reviewed: white || (prev?.reviewed ?? false),
      });

      const needsTranslation = !white && !translated && !(prev?.reviewed ?? false);
      if (needsTranslation) {
        queue[lang].push({ path: ["seed", ...field.path], section: "seed", en: field.en, oldValue: value });
        chars[lang] += field.en.length;
      }
    }
  }

  return {
    files,
    queue,
    stats: {
      uiKeys: Object.keys(enDict).length,
      seedFields: seedFields.length,
      whitelisted: whitelistedCount,
      alreadyTranslated,
      chars,
    },
  };
}

/** Гарантирует наличие всех секций seed, включая пустые (faq, cms) */
function ensureSeedSections(files: Record<Lang, EntryTree>) {
  for (const lang of ALL_LANGS) {
    if (!files[lang].seed || isEntry(files[lang].seed)) files[lang].seed = {};
    const seed = files[lang].seed as EntryTree;
    for (const section of ["programs", "news", "promo", "tests", "faq", "cms", "settings"]) {
      // Непереводимые секции создаются только в языке-источнике:
      // в ms/ar секции tests быть не должно вовсе.
      if (lang !== SOURCE_LANG && isNeverTranslatedSection(section)) {
        delete seed[section];
        continue;
      }
      if (!seed[section] || isEntry(seed[section])) seed[section] = {};
    }
  }
}

function writeLocales(files: Record<Lang, EntryTree>) {
  if (!fs.existsSync(LOCALES_DIR)) fs.mkdirSync(LOCALES_DIR, { recursive: true });
  for (const lang of ALL_LANGS) {
    const file = path.join(LOCALES_DIR, `${lang}.json`);
    fs.writeFileSync(file, JSON.stringify(files[lang], null, 2) + "\n", "utf-8");
  }
}

// ============================================================================
// Отчётность
// ============================================================================
function printSeedTable(fields: SeedField[]) {
  const groups = new Map<string, { fields: number; chars: number; names: Set<string> }>();
  for (const f of fields) {
    const g = groups.get(f.group) ?? { fields: 0, chars: 0, names: new Set<string>() };
    g.fields++;
    g.chars += f.en.length;
    g.names.add(f.path[1] ?? "-");
    groups.set(f.group, g);
  }
  console.log("\n=== Таблица «сущность → поля → символов» (источник: inMemoryStore, EN) ===");
  console.log(
    "сущность".padEnd(12) + "записей".padStart(9) + "полей".padStart(8) + "символов".padStart(11)
  );
  console.log("-".repeat(40));
  let totalF = 0;
  let totalC = 0;
  for (const [group, g] of [...groups.entries()].sort()) {
    console.log(
      group.padEnd(12) + String(g.names.size).padStart(9) + String(g.fields).padStart(8) + String(g.chars).padStart(11)
    );
    totalF += g.fields;
    totalC += g.chars;
  }
  console.log("-".repeat(40));
  console.log("ИТОГО".padEnd(12) + "".padStart(9) + String(totalF).padStart(8) + String(totalC).padStart(11));
}

interface QueueEstimate {
  /** Уникальные английские строки — ровно то, что уйдёт в translateBatch */
  uniqueTexts: string[];
  /** Сколько записей в очереди (ms + ar), включая повторы одного и того же текста */
  queueItems: number;
  /** Сырые символы УНИКАЛЬНЫХ строк × число языков — база для сравнения */
  rawUniqueTotal: number;
  /** Тарифицируемый объём Azure: защищённые символы × число языков */
  billedTotal: number;
}

/**
 * Точная оценка расхода.
 *
 * Два независимых фактора, которые важно не смешивать:
 *  1) дедупликация — одинаковая английская строка (например,
 *     "Fee guidance available on enquiry" у 10 программ) оплачивается ОДИН раз,
 *     поэтому 254 записи очереди превращаются в 92 уникальные строки;
 *  2) разметка — protectContent() оборачивает бренды, e-mail, URL и
 *     {placeholders} в <span class="notranslate">, и Azure считает эти
 *     символы тоже, поэтому счёт растёт относительно сырого текста.
 *
 * Сравнивать нужно именно уникальные сырые символы с тарифицируемыми,
 * иначе получается бессмысленная отрицательная «наценка».
 */
function computeQueueEstimate(result: BuildResult): QueueEstimate {
  const unique = new Set<string>();
  let queueItems = 0;
  for (const lang of TARGET_LANGS) {
    for (const item of result.queue[lang]) {
      unique.add(item.en);
      queueItems++;
    }
  }

  const uniqueTexts = [...unique];
  const langCount = TARGET_LANGS.length;
  const rawPerLang = uniqueTexts.reduce((sum, text) => sum + text.length, 0);
  const billedPerLang = uniqueTexts.reduce((sum, text) => sum + protectContent(text).length, 0);

  return {
    uniqueTexts,
    queueItems,
    rawUniqueTotal: rawPerLang * langCount,
    billedTotal: billedPerLang * langCount,
  };
}

async function printQueueReport(result: BuildResult): Promise<QueueEstimate> {
  const usageBefore = await getTranslatorUsage();
  const remaining = Math.max(0, MONTHLY_LIMIT - usageBefore);

  console.log("\n=== ОЧЕРЕДЬ ПЕРЕВОДА ===");
  const perLang: Record<string, { count: number; chars: number; bySection: Record<string, number> }> = {};
  let totalChars = 0;
  let totalItems = 0;
  for (const lang of TARGET_LANGS) {
    const items = result.queue[lang];
    const chars = items.reduce((s, i) => s + i.en.length, 0);
    const bySection: Record<string, number> = {};
    for (const i of items) {
      const g = i.section === "ui" ? "ui" : i.path[1];
      bySection[g] = (bySection[g] ?? 0) + 1;
    }
    perLang[lang] = { count: items.length, chars, bySection };
    totalChars += chars;
    totalItems += items.length;
    console.log(
      `  ${lang}: элементов ${String(items.length).padStart(5)}  символов ${String(chars).padStart(8)}  ` +
        `(${Object.entries(bySection).map(([k, v]) => `${k}=${v}`).join(", ") || "нет"})`
    );
  }

  // UI-строки в очереди показываем построчно — их мало и их полезно проверить глазами
  for (const lang of TARGET_LANGS) {
    const ui = result.queue[lang].filter((i) => i.section === "ui");
    if (ui.length) {
      console.log(`\n  UI-строки в очереди (${lang}), ${ui.length} шт.:`);
      for (const item of ui) {
        console.log(`    ${item.path[1]}  (${item.en.length} симв.)  "${item.en}"`);
      }
    }
  }

  const estimate = computeQueueEstimate(result);

  console.log(`\n  Записей в очереди (ms + ar): ${estimate.queueItems}`);
  console.log(
    `  Уникальных английских строк: ${estimate.uniqueTexts.length}` +
      ` (одинаковый текст оплачивается один раз — экономия ${estimate.queueItems - estimate.uniqueTexts.length} вызовов)`
  );
  console.log(`  Сырых символов (уникальные × языки): ${estimate.rawUniqueTotal}`);
  console.log(`  Тарифицируется Azure (с разметкой notranslate): ${estimate.billedTotal}`);
  console.log(`    наценка разметки: +${estimate.billedTotal - estimate.rawUniqueTotal}`);
  console.log(`\n  Квота: лимит ${MONTHLY_LIMIT}, израсходовано ${usageBefore}, остаток ${remaining}`);
  console.log(
    `  Покрытие: ${estimate.billedTotal <= remaining ? "✅ в пределах остатка" : "❌ ПРЕВЫШАЕТ остаток квоты"}`
  );
  console.log(
    `  После прогона останется примерно: ${remaining - estimate.billedTotal} (${(
      ((remaining - estimate.billedTotal) / MONTHLY_LIMIT) * 100
    ).toFixed(1)}% лимита)`
  );

  return estimate;
}

/** Ждёт подтверждения в stdin. Отсутствие ввода (EOF) = отказ. */
function askConfirmation(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      // Ввод подан конвейером — читаем одну строку
    }
    process.stdout.write(question);

    const finish = (value: boolean) => {
      process.stdin.off("data", onData);
      process.stdin.off("end", onEnd);
      process.stdin.pause();
      resolve(value);
    };
    const onData = (chunk: Buffer) => {
      const answer = chunk.toString().trim().toLowerCase();
      finish(answer === "y" || answer === "yes" || answer === "д");
    };
    const onEnd = () => finish(false);

    process.stdin.resume();
    process.stdin.on("data", onData);
    process.stdin.on("end", onEnd);
  });
}

// ============================================================================
// Точки входа
// ============================================================================
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const migrate = args.includes("--migrate");

  // Проверка конфигурации выполняется ДО любой работы, во всех режимах:
  // некорректный I18N_SIMULATE — ошибка окружения, а не повод продолжать.
  const startup = evaluateScriptStartup();
  if (!startup.ok) {
    for (const message of startup.messages) console.error(`[i18n-sync] ${message}`);
    process.exit(startup.exitCode);
  }

  console.log("=== i18n-sync ===");
  const result = build();
  ensureSeedSections(result.files);
  const seedFields = collectSeedFields();

  console.log(`\nКлючей UI (из translations.ts): ${result.stats.uiKeys}`);
  console.log(`Полей seed (из inMemoryStore): ${result.stats.seedFields}`);
  console.log(`Белый список (не уходят в Azure, reviewed=true): ${result.stats.whitelisted}`);
  console.log(`Уже переведено и актуально: ${result.stats.alreadyTranslated}`);

  if (migrate) {
    writeLocales(result.files);
    console.log(`\n[--migrate] Записаны файлы: ${ALL_LANGS.map((l) => `${l}.json`).join(", ")} в ${LOCALES_DIR}`);
    return;
  }

  if (dryRun) {
    printSeedTable(seedFields);
    await printQueueReport(result);
    console.log("\n[dry-run] Файлы не изменены, Azure не вызывался, квота не расходовалась.");
    return;
  }

  // Боевой режим. Без ключа и без симуляции translateBatch() вернул бы
  // статус "skipped" для всех строк — то есть скрипт «успешно» завершился бы,
  // не сделав ни одного перевода. Поэтому продолжаем только при явных
  // признаках работоспособного окружения, иначе падаем с кодом 1.
  const preconditions = evaluateRealRunPreconditions();
  if (!preconditions.ok) {
    for (const message of preconditions.messages) console.error(`[i18n-sync] ${message}`);
    process.exit(preconditions.exitCode);
  }

  printSeedTable(seedFields);
  const estimate = await printQueueReport(result);

  if (estimate.uniqueTexts.length === 0) {
    console.log("\n[боевой режим] Очередь пуста — переводить нечего.");
    return;
  }

  const remaining = Math.max(0, MONTHLY_LIMIT - (await getTranslatorUsage()));
  if (estimate.billedTotal > remaining) {
    console.error(
      `[i18n-sync] Оценка ${estimate.billedTotal} символов превышает остаток квоты ${remaining}. Прогон отменён.`
    );
    process.exit(1);
  }

  const confirmed = await askConfirmation(
    `\n[i18n-sync] Отправить ${estimate.uniqueTexts.length} строк в Azure на ${TARGET_LANGS.length} языка(ов)?\n` +
      `            Тарифицируется примерно ${estimate.billedTotal} символов (с разметкой).\n` +
      `            Подтвердить [y/N]: `
  );
  if (!confirmed) {
    console.log("\n[i18n-sync] Отменено. Файлы не изменены, квота не расходовалась.");
    return;
  }

  const outcome = await runRealSync(result, estimate);
  printSyncStats(outcome);
}

// ============================================================================
// Боевой прогон
// ============================================================================
interface SyncOutcome {
  usageBefore: number;
  usageAfter: number;
  translated: number;
  reviewedSkipped: number;
  failedByTranslator: number;
  rejectedByLocalValidation: number;
  notAttempted: number;
  charsWritten: Record<string, number>;
  problemPaths: string[];
}

/** Считает записи с reviewed=true — они не отправлялись и не менялись. */
function countReviewedEntries(files: Record<Lang, EntryTree>): number {
  let total = 0;
  const walk = (node: any) => {
    for (const value of Object.values(node ?? {})) {
      if (isEntry(value)) {
        if ((value as LocaleEntry).reviewed) total++;
      } else if (value && typeof value === "object") {
        walk(value);
      }
    }
  };
  for (const lang of ALL_LANGS) {
    walk(files[lang].ui);
    walk(files[lang].seed);
  }
  return total;
}

async function runRealSync(result: BuildResult, estimate: QueueEstimate): Promise<SyncOutcome> {
  const usageBefore = await getTranslatorUsage();

  console.log(`\n[i18n-sync] Отправляю ${estimate.uniqueTexts.length} строк в Azure...`);
  const batch = await translateBatch(estimate.uniqueTexts, [...TARGET_LANGS]);

  const outcome: SyncOutcome = {
    usageBefore,
    usageAfter: usageBefore,
    translated: 0,
    reviewedSkipped: countReviewedEntries(result.files),
    failedByTranslator: 0,
    rejectedByLocalValidation: 0,
    notAttempted: 0,
    charsWritten: { en: 0, ms: 0, ar: 0 },
    problemPaths: [],
  };

  for (const lang of TARGET_LANGS) {
    for (const item of result.queue[lang]) {
      const label = `${lang} ${item.path.join(".")}`;
      const translation = batch.translations[item.en]?.[lang];

      if (!translation || translation.status === "skipped") {
        outcome.notAttempted++;
        outcome.problemPaths.push(`${label} — не отправлено (статус skipped)`);
        continue;
      }
      if (translation.status !== "ok" || !translation.text) {
        outcome.failedByTranslator++;
        outcome.problemPaths.push(`${label} — ошибка перевода или отказ валидации (статус ${translation.status})`);
        continue;
      }
      // Повторная проверка перед записью: пишем только провалидированный результат.
      if (!validateTranslation(item.en, translation.text)) {
        outcome.rejectedByLocalValidation++;
        outcome.problemPaths.push(`${label} — не прошло validateTranslation повторно`);
        continue;
      }

      setPath(result.files[lang], item.path, {
        value: translation.text,
        sourceHash: sourceHash(item.en),
        reviewed: false,
      });
      outcome.translated++;
      outcome.charsWritten[lang] += translation.text.length;
    }
  }

  writeLocales(result.files);
  outcome.usageAfter = await getTranslatorUsage();
  return outcome;
}

function printSyncStats(outcome: SyncOutcome) {
  const spent = outcome.usageAfter - outcome.usageBefore;
  console.log("\n=== СТАТИСТИКА БОЕВОГО ПРОГОНА ===");
  console.log(`  Переведено и записано        : ${outcome.translated}`);
  console.log(`  Пропущено (reviewed=true)    : ${outcome.reviewedSkipped}`);
  console.log(`  Отклонено локальной валидацией: ${outcome.rejectedByLocalValidation}`);
  console.log(`  Ошибки перевода / отказ валидации в переводчике: ${outcome.failedByTranslator}`);
  console.log(`  Не отправлено (skipped)      : ${outcome.notAttempted}`);
  console.log(`  Записано символов по языкам  : ms=${outcome.charsWritten.ms}, ar=${outcome.charsWritten.ar}`);
  console.log(`\n  Счётчик квоты ДО             : ${outcome.usageBefore}`);
  console.log(`  Счётчик квоты ПОСЛЕ          : ${outcome.usageAfter}`);
  console.log(`  Фактически потрачено         : ${spent}`);

  if (outcome.problemPaths.length) {
    console.log(`\n  Проблемные поля (${outcome.problemPaths.length}):`);
    for (const path of outcome.problemPaths.slice(0, 50)) console.log(`    ${path}`);
    if (outcome.problemPaths.length > 50) {
      console.log(`    ... и ещё ${outcome.problemPaths.length - 50}`);
    }
  } else {
    console.log("\n  Проблемных полей нет.");
  }
}

main().catch((err) => {
  console.error("[i18n-sync] Ошибка:", err);
  process.exit(1);
});
