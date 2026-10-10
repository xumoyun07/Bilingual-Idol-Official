/**
 * Форматирование денег.
 *
 * Деньги в проекте хранятся ЦЕЛЫМИ в минорных единицах (сен для MYR), поэтому
 * единственное место, где появляются десятичные дроби — этот помощник.
 * Валюта берётся из одного общего источника (shared/const.ts), локаль — из
 * языка интерфейса: en → en-MY, ms → ms-MY, ar → ar-MY (арабские цифры не
 * форсируем: ar-MY в ICU использует латинские цифры, что для Малайзии корректно).
 */

import { DEFAULT_CURRENCY } from "./const";

export type MoneyLanguage = "en" | "ms" | "ar";

const LOCALES: Record<MoneyLanguage, string> = {
  en: "en-MY",
  ms: "ms-MY",
  ar: "ar-MY",
};

export function minorUnitDivisor(currency: string = DEFAULT_CURRENCY): number {
  // Все поддерживаемые валюты проекта — с двумя знаками после запятой.
  void currency;
  return 100;
}

/** Приводит строку языка к поддерживаемому значению; неизвестное — английский. */
export function normaliseMoneyLanguage(lang: string | null | undefined): MoneyLanguage {
  const value = (lang ?? "").trim().toLowerCase();
  if (value.startsWith("ms")) return "ms";
  if (value.startsWith("ar")) return "ar";
  return "en";
}

/**
 * formatMoney(295000) → "RM 2,950.00" (en) / "RM 2,950.00" (ms) / "2,950.00 ر.م." (ar)
 * Никогда не бросает: при любой ошибке Intl возвращает безопасную резервную строку.
 */
export function formatMoney(
  amountMinor: number,
  currency: string = DEFAULT_CURRENCY,
  lang: string | null | undefined = "en",
): string {
  const code = (currency || DEFAULT_CURRENCY).trim().toUpperCase();
  const value = Number.isFinite(amountMinor) ? amountMinor / minorUnitDivisor(code) : 0;
  const locale = LOCALES[normaliseMoneyLanguage(lang)];
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currencyDisplay: "narrowSymbol",
    }).format(value);
  } catch {
    return `${code} ${value.toFixed(2)}`;
  }
}
