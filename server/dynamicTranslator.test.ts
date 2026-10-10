import { describe, expect, it } from "vitest";
import { DYNAMIC_LEXICON, translateDynamic } from "@/lib/dynamicTranslator";

/**
 * Пункт 3: пословный разбор предложений удалён.
 *
 * Раньше фраза разбивалась, и каждый известный словарю фрагмент подменялся
 * отдельно. Из-за этого в одном предложении смешивались языки:
 *   «Your المؤسس command console is نشط and ready»
 *   «Security & تدقيق»
 *
 * Разрешены только два исхода: точное совпадение ВСЕЙ строки со словарём
 * либо исходная строка без единого изменения.
 */
describe("dynamicTranslator: пословная подстановка запрещена", () => {
  const LEXICON_KEY = Object.keys(DYNAMIC_LEXICON).find((k) => k.length >= 4 && k.includes(" ")) ||
    Object.keys(DYNAMIC_LEXICON)[0];

  it("словарь не пуст и содержит проверяемый ключ", () => {
    expect(Object.keys(DYNAMIC_LEXICON).length).toBeGreaterThan(0);
    expect(LEXICON_KEY).toBeTruthy();
  });

  it("неизвестная многословная фраза возвращается без изменений", () => {
    const phrase = "Your founder command console is active and ready";
    expect(translateDynamic(phrase, "ar")).toBe(phrase);
    expect(translateDynamic(phrase, "ms")).toBe(phrase);
  });

  it("фраза с известным словом словаря НЕ переводится частично", () => {
    const known = DYNAMIC_LEXICON[LEXICON_KEY];
    const phrase = `Intro text ${LEXICON_KEY} outro text`;

    const arabic = translateDynamic(phrase, "ar");
    const malay = translateDynamic(phrase, "ms");

    // Строка обязана вернуться ровно такой, какой пришла
    expect(arabic).toBe(phrase);
    expect(malay).toBe(phrase);

    // И не содержать перевода фрагмента ни на одном языке
    expect(arabic).not.toContain(known.ar);
    expect(malay).not.toContain(known.ms);
  });

  it("смешанное предложение не превращается в «рваный» текст", () => {
    const mixed = "Security & audit console";
    const result = translateDynamic(mixed, "ar");
    // Либо целиком переведено, либо целиком без изменений — но не наполовину.
    const unchanged = result === mixed;
    const fullyTranslated = result === DYNAMIC_LEXICON[mixed.toLowerCase()]?.ar;
    expect(unchanged || fullyTranslated).toBe(true);
  });

  it("точное совпадение всей строки по-прежнему переводится", () => {
    const known = DYNAMIC_LEXICON[LEXICON_KEY];
    expect(translateDynamic(LEXICON_KEY, "ar")).toBe(known.ar);
    expect(translateDynamic(LEXICON_KEY, "ms")).toBe(known.ms);
  });

  it("английский возвращается как есть", () => {
    const phrase = "Any untranslated sentence";
    expect(translateDynamic(phrase, "en")).toBe(phrase);
  });
});
