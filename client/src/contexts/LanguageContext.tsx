import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { Language, TranslationDictionary, translations } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: "ltr" | "rtl";
  isRTL: boolean;
  dict: TranslationDictionary;
  t: (keyPath: string, params?: Record<string, string | number>, fallback?: string) => string;
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

function detectInitialLanguage(): Language {
  if (typeof window === "undefined") return "en";
  try {
    // 1. Check localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "ms" || saved === "ar") {
      return saved as Language;
    }

    // 2. Check Cookie
    const cookieVal = getCookie(COOKIE_NAME);
    if (cookieVal === "en" || cookieVal === "ms" || cookieVal === "ar") {
      return cookieVal as Language;
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

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      setCookie(COOKIE_NAME, lang);
    } catch (e) {
      console.warn("Could not save language to storage", e);
    }
  };

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

  const t = (keyPath: string, params?: Record<string, string | number>, fallback?: string): string => {
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
        current = fallbackCurrent ?? fallback ?? keyPath;
        break;
      }
    }

    if (typeof current !== "string") {
      return fallback ?? keyPath;
    }

    let result = current;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return result;
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      dir,
      isRTL,
      dict,
      t,
    }),
    [language, dir, isRTL, dict],
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

