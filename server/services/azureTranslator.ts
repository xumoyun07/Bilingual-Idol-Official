import { eq } from "drizzle-orm";
import { getDb, inMemoryStore } from "../db";
import { siteSettings } from "../../drizzle/schema";
import fs from "fs";
import path from "path";

export const BRANDS = ["Bilingual Idol", "BILC", "Pavilion Embassy", "IELTS", "MOHE", "WhatsApp"];
const USAGE_FILE = path.resolve(".translator_usage.json");

// Quota monthly limit customizable via environment variable, defaulting to 1800000
const MONTHLY_LIMIT = process.env.TRANSLATOR_MONTHLY_LIMIT 
  ? parseInt(process.env.TRANSLATOR_MONTHLY_LIMIT, 10) || 1800000 
  : 1800000;

// Log key presence and region on server start, strictly hiding the key itself
const hasKey = !!process.env.AZURE_TRANSLATOR_KEY;
const region = process.env.AZURE_TRANSLATOR_REGION || "global";
console.log(`[AzureTranslator] Azure Translator: ${hasKey ? "ключ задан" : "ключ не задан"}, регион: ${region}`);

export interface TranslationResultItem {
  status: "ok" | "failed" | "skipped";
  text?: string;
}

export interface TranslateBatchResult {
  translations: Record<string, Record<string, TranslationResultItem>>;
}

/**
 * Reads translator usage from a local JSON backup file when database is unconfigured
 */
function getLocalFileUsage(key: string): number {
  try {
    if (fs.existsSync(USAGE_FILE)) {
      const data = JSON.parse(fs.readFileSync(USAGE_FILE, "utf-8"));
      return data[key] || 0;
    }
  } catch (e) {
    // Ignore gracefully
  }
  return 0;
}

/**
 * Writes translator usage to a local JSON backup file when database is unconfigured
 */
function setLocalFileUsage(key: string, value: number) {
  try {
    let data: Record<string, number> = {};
    if (fs.existsSync(USAGE_FILE)) {
      data = JSON.parse(fs.readFileSync(USAGE_FILE, "utf-8"));
    }
    data[key] = value;
    fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    // Ignore gracefully
  }
}

/**
 * Decodes HTML Entities to normal characters (like &amp; to &)
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/**
 * Protects placeholders, brands, emails, and URLs in a single-pass regex,
 * preventing nested wrappers and protecting brands within links or emails.
 */
export function protectContent(text: string): string {
  const emailPattern = `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}`;
  const urlPattern = `(?:https?:\\/\\/|www\\.)[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/\\/=]*)`;
  const placeholderPattern = `\\{[A-Za-z0-9_]+\\}`;
  const brandPattern = `\\b(?:Bilingual Idol|BILC|Pavilion Embassy|IELTS|MOHE|WhatsApp)\\b`;

  const unifiedRegex = new RegExp(`(${emailPattern}|${urlPattern}|${placeholderPattern}|${brandPattern})`, "g");
  return text.replace(unifiedRegex, '<span class="notranslate">$1</span>');
}

/**
 * Strips `<span class="notranslate">...</span>` wrappers injected during translation
 * Runs in a loop to cleanly unwrap any nested protections
 */
export function unprotectContent(text: string): string {
  let current = text;
  let previous = "";
  while (current !== previous) {
    previous = current;
    current = current.replace(/<span class="notranslate">(.*?)<\/span>/g, "$1");
  }
  return current;
}

/**
 * Cleans extra spaces before punctuation (including Arabic comma, semicolon, and question mark)
 * Horizontally collapses extra spaces without modifying line breaks or carriage returns.
 */
export function cleanExtraSpaces(text: string): string {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]+([,\.!?:،؛؟])/g, "$1")
    .trim();
}

/**
 * Extracts placeholders for validation
 */
export function extractPlaceholders(text: string): string[] {
  const matches = text.match(/\{[A-Za-z0-9_]+\}/g);
  return matches ? [...matches].sort() : [];
}

/**
 * Extracts HTML tags (except injected protection wrapper) for validation
 */
export function extractHtmlTags(text: string): string[] {
  const matches = text.match(/<[^>]+>/g);
  if (!matches) return [];
  return [...matches]
    .filter(tag => !tag.includes('class="notranslate"') && !tag.includes('</span>'))
    .sort();
}

/**
 * Validates that placeholders and original HTML tags match in the translated output
 */
export function validateTranslation(original: string, translated: string): boolean {
  const origPlaceholders = extractPlaceholders(original);
  const transPlaceholders = extractPlaceholders(translated);

  if (JSON.stringify(origPlaceholders) !== JSON.stringify(transPlaceholders)) {
    console.error(`[AzureTranslator] Placeholder mismatch! Original: ${JSON.stringify(origPlaceholders)}, Translated: ${JSON.stringify(transPlaceholders)}`);
    return false;
  }

  const origTags = extractHtmlTags(original);
  const transTags = extractHtmlTags(translated);
  if (JSON.stringify(origTags) !== JSON.stringify(transTags)) {
    console.error(`[AzureTranslator] HTML tags mismatch! Original: ${JSON.stringify(origTags)}, Translated: ${JSON.stringify(transTags)}`);
    return false;
  }

  return true;
}

/**
 * Gets translator monthly usage char count
 */
export async function getTranslatorUsage(): Promise<number> {
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const key = `translator_usage_${currentMonth}`;
  const db = await getDb();
  if (db) {
    const row = (await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1))[0];
    return row ? parseInt(row.value, 10) || 0 : 0;
  }
  return getLocalFileUsage(key) || parseInt(inMemoryStore.siteSettings[key] || "0", 10) || 0;
}

/**
 * Increments translator monthly usage char count
 */
export async function incrementTranslatorUsage(chars: number): Promise<number> {
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const key = `translator_usage_${currentMonth}`;
  const current = await getTranslatorUsage();
  const nextValue = current + chars;
  const db = await getDb();
  if (db) {
    await db.insert(siteSettings).values({ key, value: String(nextValue) }).onDuplicateKeyUpdate({ set: { value: String(nextValue) } });
  } else {
    setLocalFileUsage(key, nextValue);
    inMemoryStore.siteSettings[key] = String(nextValue);
  }
  return nextValue;
}

/**
 * Checks if a translation will exceed the monthly quota limit
 */
export async function canTranslate(charsToAdd: number): Promise<boolean> {
  const current = await getTranslatorUsage();
  if (current + charsToAdd > MONTHLY_LIMIT) {
    console.warn(`[AzureTranslator] Monthly quota exceeded or about to be exceeded. Current: ${current}, Requested: ${charsToAdd}, Limit: ${MONTHLY_LIMIT}`);
    return false;
  }
  return true;
}

/**
 * Chunk helper to split arrays into Azure compliant sub-batches
 * Source: Microsoft Azure AI Translator V3.0 limits documentation. Max count: 100, max total characters: 10,000.
 */
function chunkTexts(texts: string[], maxCount = 100, maxChars = 10000): string[][] {
  const chunks: string[][] = [];
  let currentChunk: string[] = [];
  let currentChars = 0;

  for (const text of texts) {
    if (!text) continue; // Skip empty texts

    if (text.length > maxChars) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentChars = 0;
      }
      chunks.push([text]);
      continue;
    }

    if (currentChunk.length >= maxCount || currentChars + text.length > maxChars) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentChars = 0;
    }
    currentChunk.push(text);
    currentChars += text.length;
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  return chunks;
}

/**
 * Fetch with retry helper implementing exponential backoff for 429 and 5xx errors
 */
async function fetchWithRetry(url: string, options: any, retries = 3, delay = 1000): Promise<any> {
  try {
    const res = await fetch(url, options);
    
    // Non-retry status code check (400, 401, 403, 404, etc.)
    if (res.status >= 400 && res.status < 500 && res.status !== 429) {
      const errText = await res.text();
      
      // Specifically catch Out of call volume quota (403) and log understandably
      if (res.status === 403 && errText.toLowerCase().includes("quota")) {
        console.error(`[AzureTranslator] Azure Translator Quota Exhausted! Please upgrade your F0 subscription tier.`);
      }
      throw new Error(`Azure API error: ${res.status} ${res.statusText} - ${errText}`);
    }

    if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
      if (retries > 0) {
        console.warn(`[AzureTranslator] Response status ${res.status}, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Azure API error: ${res.status} ${res.statusText} - ${errText}`);
    }
    return await res.json();
  } catch (error) {
    const msg = (error as any).message || "";
    // Only retry on 429, 5xx, or actual network errors
    const isNetworkError = error instanceof TypeError || msg.includes("fetch") || msg.includes("Network");
    const isRetryableStatus = msg.includes("429") || msg.includes("500") || msg.includes("502") || msg.includes("503") || msg.includes("504");

    if (retries > 0 && (isNetworkError || isRetryableStatus)) {
      console.warn(`[AzureTranslator] Retryable error: ${msg}, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Simulates translations for development/testing when no key is set
 */
function simulateTranslation(text: string, lang: string): string {
  const protectedText = protectContent(text);
  const unwrapped = unprotectContent(protectedText);
  if (lang === "ms") {
    return `${unwrapped} [ms]`;
  }
  if (lang === "ar") {
    return `${unwrapped} [ar]`;
  }
  return unwrapped;
}

/**
 * Translates a batch of texts to target languages (typically 'ms' and 'ar')
 * Returns a TranslateBatchResult containing the mapping of translations and their status
 */
export async function translateBatch(
  texts: string[],
  targetLangs: string[]
): Promise<TranslateBatchResult> {
  const translations: Record<string, Record<string, TranslationResultItem>> = {};
  for (const t of texts) {
    translations[t] = {};
    for (const lang of targetLangs) {
      translations[t][lang] = { status: "skipped" };
    }
  }

  // Check if batch is empty
  if (texts.length === 0 || targetLangs.length === 0) {
    return { translations };
  }

  const key = process.env.AZURE_TRANSLATOR_KEY;
  const simulate = process.env.I18N_SIMULATE === "true" || process.env.I18N_SIMULATE === "1";

  // If no key and simulate is not set, gracefully fallback and return status: skipped without database/local writes
  if (!key && !simulate) {
    console.info(`[AzureTranslator] Translator inactive (no key & simulation disabled). Falling back to original texts.`);
    return { translations };
  }

  // Protect texts to calculate the actual protected payload character length (Azure Translator counts tag characters in quota)
  const protectedTexts = texts.map(t => protectContent(t));
  const totalProtectedChars = protectedTexts.reduce((sum, text) => sum + text.length, 0);
  const totalQuotaCost = totalProtectedChars * targetLangs.length;

  // Check quota allowance
  if (!(await canTranslate(totalQuotaCost))) {
    console.warn(`[AzureTranslator] Skipping translation request to stay within monthly quota limit.`);
    return { translations };
  }

  // If no credentials but simulation is enabled, enter simulation mode
  if (!key) {
    console.info(`[AzureTranslator] Environment key unconfigured. Simulating translations for ${texts.length} items.`);
    for (const t of texts) {
      for (const lang of targetLangs) {
        translations[t][lang] = {
          status: "ok",
          text: simulateTranslation(t, lang)
        };
      }
    }
    // Only increment monthly usage quota for successful simulated batch
    await incrementTranslatorUsage(totalQuotaCost);
    return { translations };
  }

  const region = process.env.AZURE_TRANSLATOR_REGION;
  const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT || "https://api.cognitive.microsofttranslator.com";

  const textChunks = chunkTexts(protectedTexts);
  let charsSucceeded = 0;

  for (const chunk of textChunks) {
    // Construct Azure API URL
    const url = new URL("/translate", endpoint);
    url.searchParams.set("api-version", "3.0");
    url.searchParams.set("textType", "html");
    for (const lang of targetLangs) {
      url.searchParams.append("to", lang);
    }

    const headers: Record<string, string> = {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/json",
    };
    if (region) {
      headers["Ocp-Apim-Subscription-Region"] = region;
    }

    try {
      const responseData = await fetchWithRetry(url.toString(), {
        method: "POST",
        headers,
        body: JSON.stringify(chunk.map(text => ({ Text: text }))),
      });

      // Optional debug logging of response info
      if (process.env.DEBUG_TRANSLATOR === "1") {
        const totalChars = chunk.reduce((sum, text) => sum + text.length, 0);
        console.log(`[AzureTranslator] DEBUG: Received raw response. Status: OK, Char Count: ${totalChars}, Elements: ${chunk.length}`);
      }

      // Map back to translations
      for (let i = 0; i < chunk.length; i++) {
        const originalText = texts[texts.indexOf(unprotectContent(chunk[i]))];
        if (!originalText) continue;

        const translationsList = responseData[i]?.translations || [];
        let itemSucceeded = false;

        for (const tr of translationsList) {
          const rawTranslation = tr.text || "";
          const targetLang = tr.to;

          // Strip tags, decode HTML entities, clean horizontal spaces, and validate
          const unwrappedTranslation = unprotectContent(rawTranslation);
          const decodedTranslation = decodeHtmlEntities(unwrappedTranslation);
          const cleanTranslation = cleanExtraSpaces(decodedTranslation);
          
          if (validateTranslation(originalText, cleanTranslation)) {
            translations[originalText][targetLang] = {
              status: "ok",
              text: cleanTranslation
            };
            itemSucceeded = true;
          } else {
            console.warn(`[AzureTranslator] Fallback to EN for text "${originalText}" due to validation failure.`);
            translations[originalText][targetLang] = { status: "failed" };
          }
        }
        if (itemSucceeded) {
          charsSucceeded += chunk[i].length; // Azure Translator bills based on protected text length!
        }
      }
    } catch (error) {
      console.error(`[AzureTranslator] Request batch failed:`, error);
      // Fallback failed items
      for (const pt of chunk) {
        const originalText = unprotectContent(pt);
        for (const lang of targetLangs) {
          translations[originalText][lang] = { status: "failed" };
        }
      }
    }
  }

  // Quota grows strictly and only for successfully translated batch characters
  if (charsSucceeded > 0) {
    const succeededQuotaCost = charsSucceeded * targetLangs.length;
    await incrementTranslatorUsage(succeededQuotaCost);
  }

  return { translations };
}
