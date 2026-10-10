import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { Language, TranslationDictionary, translations } from "@/lib/translations";
import {
  getLocaleForLanguage,
  translateAmPm,
  formatTimeSlot,
  format24hTo12h,
  formatLocalizedDateTime,
  formatLocalizedDate,
} from "@/lib/timeLocalization";
import {
  translateDynamic,
  batchTranslateDynamic,
  translateDynamicObject,
  initDynamicTranslationStorage,
  registerDynamicTranslation,
} from "@/lib/dynamicTranslator";
// Словари интерфейса. Источник — client/src/locales/*.json, которые
// генерируются из lib/translations.ts скриптом `i18n:sync --migrate`
// и наполняются переводами Azure. Здесь только чтение.
import enLocale from "@/locales/en.json";
import msLocale from "@/locales/ms.json";
import arLocale from "@/locales/ar.json";

type LocaleEntry = { value: string; sourceHash: string; reviewed: boolean };
type LocaleUi = Record<string, LocaleEntry>;

/** Плоские ключи вида "nav.home" — ровно как в файлах локалей. */
const LOCALE_UI: Record<Language, LocaleUi> = {
  en: (enLocale as unknown as { ui: LocaleUi }).ui,
  ms: (msLocale as unknown as { ui: LocaleUi }).ui,
  ar: (arLocale as unknown as { ui: LocaleUi }).ui,
};

/** Секция seed: переводы контента из БД по slug/id и полю. */
type LocaleSeed = Record<string, any>;
const LOCALE_SEED: Record<Language, LocaleSeed> = {
  en: (enLocale as unknown as { seed: LocaleSeed }).seed,
  ms: (msLocale as unknown as { seed: LocaleSeed }).seed,
  ar: (arLocale as unknown as { seed: LocaleSeed }).seed,
};

const IS_DEV = (() => {
  try {
    return Boolean(import.meta.env?.DEV);
  } catch {
    return false;
  }
})();

/**
 * Перевод контента из БД: seed.<section>.<slug|id>.<field>.
 * Возвращает undefined, если перевода нет — вызывающий код оставляет английский.
 */
export function lookupSeedTranslation(
  language: Language,
  path: string[],
  fallbackValue: string
): string {
  const read = (tree: LocaleSeed): string | undefined => {
    let node: any = tree;
    for (const part of path) {
      if (!node || typeof node !== "object" || !(part in node)) return undefined;
      node = node[part];
    }
    return node && typeof node === "object" && typeof node.value === "string" ? node.value : undefined;
  };

  const translated = read(LOCALE_SEED[language]);
  if (translated) return translated;

  const english = read(LOCALE_SEED.en);
  if (english) return english;

  // Секция tests намеренно отсутствует в ms/ar — тест остаётся английским.
  return fallbackValue;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: "ltr" | "rtl";
  isRTL: boolean;
  dict: TranslationDictionary;
  t: (keyPath: string, params?: Record<string, string | number>, fallback?: string) => string;
  /** Перевод контента из БД: seed.<section>.<slug|id>.<field> с фоллбеком на английский */
  seedText: (path: string[], fallbackValue: string) => string;
  td: (text: string | null | undefined, fallback?: string) => string;
  translateDynamic: (text: string | null | undefined, fallback?: string) => string;
  batchTranslate: (texts: string[]) => string[];
  translateObject: <T extends Record<string, any>>(obj: T) => T;
  registerTerms: (term: string, translations: Partial<Record<Language, string>>) => void;
  isDynamicActive: boolean;
  locale: string;
  translateAmPm: (text: string) => string;
  formatTimeSlot: (slot: string) => string;
  formatTime: (value: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
  format24hTime: (timeStr: string) => string;
  formatDate: (value: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "bilc_language";
const COOKIE_NAME = "bilc_language";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function isValidLanguage(val: any): val is Language {
  return val === "en" || val === "ms" || val === "ar";
}

function detectInitialLanguage(): Language {
  if (typeof window === "undefined") return "en";
  try {
    // 0. Check URL query parameter (?lang=en | ?lang=ms | ?lang=ar)
    if (window.location && window.location.search) {
      const urlParams = new URLSearchParams(window.location.search);
      const queryLang = urlParams.get("lang");
      if (isValidLanguage(queryLang)) {
        return queryLang;
      }
    }

    // 1. Check localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isValidLanguage(saved)) {
      return saved;
    }

    // 2. Check Cookie
    const cookieVal = getCookie(COOKIE_NAME);
    if (isValidLanguage(cookieVal)) {
      return cookieVal;
    }

    // 3. Check browser / OS preferred languages
    const navLangs = navigator.languages ? [...navigator.languages] : [navigator.language || ""];
    for (const lang of navLangs) {
      const lower = (lang || "").toLowerCase();
      if (lower.startsWith("ar")) return "ar";
      if (lower.startsWith("ms") || lower.startsWith("id")) return "ms";
      if (lower.startsWith("en")) return "en";
    }
  } catch (e) {
    console.warn("Could not access language storage or navigator settings", e);
  }
  return "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);

  useEffect(() => {
    initDynamicTranslationStorage(language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      setCookie(COOKIE_NAME, lang);
      if (typeof window !== "undefined" && window.location) {
        const url = new URL(window.location.href);
        url.searchParams.set("lang", lang);
        window.history.replaceState(null, "", url.toString());
      }
      window.dispatchEvent(new CustomEvent("bilc_languagechange", { detail: lang }));
    } catch (e) {
      console.warn("Could not save language to storage", e);
    }
  };

  // Synchronize across tabs or custom languagechange events
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && isValidLanguage(e.newValue)) {
        setLanguageState(e.newValue);
      }
    };
    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<Language>;
      if (customEvent.detail && isValidLanguage(customEvent.detail)) {
        setLanguageState(customEvent.detail);
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("bilc_languagechange", handleCustomChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("bilc_languagechange", handleCustomChange);
    };
  }, []);

  const isRTL = language === "ar";
  const dir: "ltr" | "rtl" = isRTL ? "rtl" : "ltr";
  const dict = translations[language] || translations.en;

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    if (isRTL) {
      document.documentElement.classList.add("rtl");
      document.body.classList.add("rtl");
      document.documentElement.classList.add("is-rtl");
      document.body.classList.add("is-rtl");
      document.documentElement.classList.remove("ltr");
      document.body.classList.remove("ltr");
    } else {
      document.documentElement.classList.remove("rtl");
      document.body.classList.remove("rtl");
      document.documentElement.classList.remove("is-rtl");
      document.body.classList.remove("is-rtl");
      document.documentElement.classList.add("ltr");
      document.body.classList.add("ltr");
    }

    // Update OpenGraph and locale meta tags dynamically
    const localeCode = language === "ar" ? "ar_AE" : language === "ms" ? "ms_MY" : "en_GB";
    let ogLocale = document.querySelector('meta[property="og:locale"]');
    if (!ogLocale) {
      ogLocale = document.createElement("meta");
      ogLocale.setAttribute("property", "og:locale");
      document.head.appendChild(ogLocale);
    }
    ogLocale.setAttribute("content", localeCode);
  }, [language, dir, isRTL]);

  const t = useCallback(
    (keyPath: string, params?: Record<string, string | number>, fallback?: string): string => {
      if (!keyPath) return fallback || "";

      // 1. Перевод запрошенного языка
      let result = LOCALE_UI[language]?.[keyPath]?.value;

      // 2. Фоллбек на английский
      if (!result) {
        const englishValue = LOCALE_UI.en[keyPath]?.value;
        if (englishValue) {
          result = englishValue;
          if (IS_DEV) {
            console.warn(`[i18n] нет перевода "${keyPath}" для языка "${language}" — показан английский`);
          }
        }
      }

      // 3. Фоллбек на сам ключ
      if (!result) {
        if (IS_DEV) {
          console.warn(`[i18n] ключ "${keyPath}" отсутствует в en.json (язык: ${language}) — показан сам ключ`);
        }
        return fallback ?? keyPath;
      }

      if (params) {
        for (const [name, value] of Object.entries(params)) {
          result = result.replace(new RegExp(`\\{${name}\\}`, "g"), String(value));
        }
      }
      return result;
    },
    [language]
  );

  // Перевод контента из БД (программы, новости, промо) по slug/id и полю.
  // Никаких регулярных выражений: либо есть готовая запись в seed, либо английский.
  const seedText = useCallback(
    (path: string[], fallbackValue: string): string => lookupSeedTranslation(language, path, fallbackValue),
    [language]
  );

  const td = useCallback(
    (text: string | null | undefined, fallback?: string): string => {
      return translateDynamic(text, language, fallback);
    },
    [language]
  );

  const batchTranslateFn = useCallback(
    (texts: string[]): string[] => {
      return batchTranslateDynamic(texts, language);
    },
    [language]
  );

  const translateObjectFn = useCallback(
    <T extends Record<string, any>>(obj: T): T => {
      return translateDynamicObject(obj, language);
    },
    [language]
  );

  const registerTermsFn = useCallback(
    (term: string, customTranslations: Partial<Record<Language, string>>) => {
      registerDynamicTranslation(term, customTranslations);
    },
    []
  );

  const locale = getLocaleForLanguage(language);

  const translateAmPmFn = useCallback(
    (text: string) => translateAmPm(text, language),
    [language]
  );

  const formatTimeSlotFn = useCallback(
    (slot: string) => formatTimeSlot(slot, language),
    [language]
  );

  const formatTimeFn = useCallback(
    (value: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions) =>
      formatLocalizedDateTime(value, language, options),
    [language]
  );

  const format24hTimeFn = useCallback(
    (timeStr: string) => format24hTo12h(timeStr, language),
    [language]
  );

  const formatDateFn = useCallback(
    (value: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions) =>
      formatLocalizedDate(value, language, options),
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      dir,
      isRTL,
      dict,
      t,
      seedText,
      td,
      translateDynamic: td,
      batchTranslate: batchTranslateFn,
      translateObject: translateObjectFn,
      registerTerms: registerTermsFn,
      isDynamicActive: true,
      locale,
      translateAmPm: translateAmPmFn,
      formatTimeSlot: formatTimeSlotFn,
      formatTime: formatTimeFn,
      format24hTime: format24hTimeFn,
      formatDate: formatDateFn,
    }),
    [
      language,
      dir,
      isRTL,
      dict,
      t,
      seedText,
      td,
      batchTranslateFn,
      translateObjectFn,
      registerTermsFn,
      locale,
      translateAmPmFn,
      formatTimeSlotFn,
      formatTimeFn,
      format24hTimeFn,
      formatDateFn,
    ],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
