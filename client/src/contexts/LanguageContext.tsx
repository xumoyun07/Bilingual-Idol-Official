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

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: "ltr" | "rtl";
  isRTL: boolean;
  dict: TranslationDictionary;
  t: (keyPath: string, params?: Record<string, string | number>, fallback?: string) => string;
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
      document.documentElement.classList.remove("ltr");
      document.body.classList.remove("ltr");
    } else {
      document.documentElement.classList.remove("rtl");
      document.body.classList.remove("rtl");
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

      // 1. If keyPath doesn't contain dot, it might be a direct dynamic string
      if (!keyPath.includes(".") && !keyPath.includes("/")) {
        const dynamicRes = translateDynamic(keyPath, language, fallback);
        if (dynamicRes !== keyPath) {
          return dynamicRes;
        }
      }

      const parts = keyPath.split(".");
      let current: any = dict;
      for (const part of parts) {
        if (current && typeof current === "object" && part in current) {
          current = current[part];
        } else {
          // Fallback to English dict if missing in current language
          let fallbackCurrent: any = translations.en;
          for (const fbPart of parts) {
            if (fallbackCurrent && typeof fallbackCurrent === "object" && fbPart in fallbackCurrent) {
              fallbackCurrent = fallbackCurrent[fbPart];
            } else {
              fallbackCurrent = undefined;
              break;
            }
          }
          current = fallbackCurrent;
          break;
        }
      }

      // If resolved from static dictionary
      if (typeof current === "string") {
        let result = current;
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            result = result.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
          }
        }
        return result;
      }

      // If fallback provided, try dynamic translation of fallback string
      if (fallback) {
        return translateDynamic(fallback, language, fallback);
      }

      // Format last part of key and pass through dynamic translator
      const lastPart = parts[parts.length - 1] || keyPath;
      const formatted = lastPart
        .replace(/([A-Z])/g, " $1")
        .replace(/[._-]/g, " ")
        .trim();
      const humanReadable = formatted ? (formatted.charAt(0).toUpperCase() + formatted.slice(1)) : keyPath;
      return translateDynamic(humanReadable, language, humanReadable);
    },
    [dict, language]
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
