import { Language } from "./translations";

export const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  en: "en-GB",
  ms: "ms-MY",
  ar: "ar-EG",
  ru: "ru-RU",
};

/**
 * Returns standard BCP 47 locale code for the application's active language
 */
export function getLocaleForLanguage(lang: Language): string {
  return LOCALE_BY_LANGUAGE[lang] || "en-GB";
}

/**
 * Translates AM/PM markers in any time or schedule string into the target language.
 *
 * For Malay (ms):
 * - Morning (AM): PG (Pagi)
 * - Noon (12:xx PM): TGH (Tengah hari)
 * - Afternoon (1:xx PM - 6:59 PM): PTG (Petang)
 * - Evening/Night (7:xx PM+): MLM (Malam)
 *
 * For Arabic (ar):
 * - AM: ص (صباحاً)
 * - PM: م (مساءً)
 *
 * For English (en):
 * - AM / PM
 */
export function translateAmPm(text: string, lang: Language): string {
  if (!text) return "";
  if (lang === "en") return text;

  // 1. Match specific time patterns like "10:00 AM", "11:30 PM", "9 AM"
  let result = text.replace(
    /(\b\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)\b/g,
    (match, hourStr, minStr, marker) => {
      const hour = parseInt(hourStr, 10);
      const isPm = marker.toUpperCase() === "PM";
      const minutes = minStr !== undefined ? `:${minStr}` : "";

      if (lang === "ms") {
        let msMarker = "PG";
        if (isPm) {
          if (hour === 12) {
            msMarker = "TGH"; // Tengah hari
          } else if (hour >= 1 && hour < 7) {
            msMarker = "PTG"; // Petang
          } else {
            msMarker = "MLM"; // Malam
          }
        } else {
          if (hour === 12) {
            msMarker = "MLM"; // 12 AM midnight
          } else {
            msMarker = "PG"; // Pagi
          }
        }
        return `${hourStr}${minutes} ${msMarker}`;
      }

      if (lang === "ar") {
        const arMarker = isPm ? "م" : "ص";
        return `${hourStr}${minutes} ${arMarker}`;
      }

      return match;
    }
  );

  // 2. Fallback match for any standalone AM/PM tokens
  if (lang === "ms") {
    result = result
      .replace(/\bAM\b/g, "PG")
      .replace(/\bam\b/g, "pg")
      .replace(/\bPM\b/g, "PTG")
      .replace(/\bpm\b/g, "ptg");
  } else if (lang === "ar") {
    result = result
      .replace(/\b(AM|am)\b/g, "ص")
      .replace(/\b(PM|pm)\b/g, "م");
  }

  return result;
}

/**
 * Translates time slots like "10:00 AM – 11:00 AM" into the active language
 */
export function formatTimeSlot(slot: string, lang: Language): string {
  return translateAmPm(slot, lang);
}

/**
 * Formats a 24-hour time string ("10:00:00" or "14:30") to a localized 12-hour time string
 */
export function format24hTo12h(timeStr: string, lang: Language): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return translateAmPm(timeStr, lang);

  const hours24 = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (Number.isNaN(hours24)) return translateAmPm(timeStr, lang);

  const isPm = hours24 >= 12;
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const formattedHour = String(hours12).padStart(2, "0");

  let marker = isPm ? "PM" : "AM";
  if (lang === "ms") {
    if (isPm) {
      if (hours24 === 12) marker = "TGH";
      else if (hours24 >= 13 && hours24 < 19) marker = "PTG";
      else marker = "MLM";
    } else {
      if (hours24 === 0) marker = "MLM";
      else marker = "PG";
    }
  } else if (lang === "ar") {
    marker = isPm ? "م" : "ص";
  }

  return `${formattedHour}:${minutes} ${marker}`;
}

/**
 * Formats a Date object or timestamp into localized date & time string
 */
export function formatLocalizedDateTime(
  value: Date | string | number | null | undefined,
  lang: Language,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) return "";
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);

  const locale = getLocaleForLanguage(lang);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: lang === "ar" ? "long" : "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(options || {}),
  };

  // Rule: Arabic typography strictly bans abbreviated days and months
  if (lang === "ar") {
    if (defaultOptions.month === "short") defaultOptions.month = "long";
    if (defaultOptions.weekday === "short") defaultOptions.weekday = "long";
  }

  const formatted = new Intl.DateTimeFormat(locale, defaultOptions).format(date);
  return translateAmPm(formatted, lang);
}

/**
 * Formats a Date object into localized date string
 */
export function formatLocalizedDate(
  value: Date | string | number | null | undefined,
  lang: Language,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) return "";
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);

  const locale = getLocaleForLanguage(lang);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: lang === "ar" ? "long" : "short",
    day: "numeric",
    ...(options || {}),
  };

  // Rule: Arabic typography strictly bans abbreviated days and months
  if (lang === "ar") {
    if (defaultOptions.month === "short") defaultOptions.month = "long";
    if (defaultOptions.weekday === "short") defaultOptions.weekday = "long";
  }

  return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
}
