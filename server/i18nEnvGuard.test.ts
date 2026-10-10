/**
 * Юнит-тесты проверок окружения переводчика.
 *
 * Покрывают требование: боевой запуск без ключа и без симуляции должен
 * завершаться с кодом 1 и понятным сообщением, а не «успешно» со статусом skipped.
 *
 * Отдельно проверяется, что значение I18N_SIMULATE никогда не попадает
 * в тексты сообщений (в эту переменную однажды был записан ключ Azure).
 */
import { describe, expect, it } from "vitest";
import {
  evaluatePingResults,
  evaluateRealRunPreconditions,
  evaluateScriptStartup,
  hasAzureKey,
  i18nSimulateFormatError,
  isSimulationEnabled,
  I18N_SIMULATE_ALLOWED_VALUES,
} from "./services/i18nEnvGuard.js";

/** Значение-имитация секрета: 84 символа, как реальный ключ Azure. */
const SECRET_LIKE_VALUE = "A".repeat(84);

const env = (vars: Record<string, string | undefined>): NodeJS.ProcessEnv =>
  vars as unknown as NodeJS.ProcessEnv;

describe("i18nEnvGuard: наличие ключа", () => {
  it("hasAzureKey: отсутствие, пустая строка и пробелы — это отсутствие ключа", () => {
    expect(hasAzureKey(env({}))).toBe(false);
    expect(hasAzureKey(env({ AZURE_TRANSLATOR_KEY: "" }))).toBe(false);
    expect(hasAzureKey(env({ AZURE_TRANSLATOR_KEY: "   " }))).toBe(false);
  });

  it("hasAzureKey: непустое значение распознаётся", () => {
    expect(hasAzureKey(env({ AZURE_TRANSLATOR_KEY: "x" }))).toBe(true);
  });
});

describe("i18nEnvGuard: I18N_SIMULATE", () => {
  it("симуляция включается только значениями true и 1", () => {
    expect(isSimulationEnabled(env({ I18N_SIMULATE: "true" }))).toBe(true);
    expect(isSimulationEnabled(env({ I18N_SIMULATE: "1" }))).toBe(true);
    expect(isSimulationEnabled(env({ I18N_SIMULATE: "false" }))).toBe(false);
    expect(isSimulationEnabled(env({ I18N_SIMULATE: "0" }))).toBe(false);
    // Ключ, вставленный в переменную по ошибке, симуляцию НЕ включает.
    expect(isSimulationEnabled(env({ I18N_SIMULATE: SECRET_LIKE_VALUE }))).toBe(false);
  });

  it("формат считается корректным для отсутствия, пустой строки и допустимых значений", () => {
    expect(i18nSimulateFormatError(env({}))).toBeNull();
    expect(i18nSimulateFormatError(env({ I18N_SIMULATE: "" }))).toBeNull();
    expect(i18nSimulateFormatError(env({ I18N_SIMULATE: "  " }))).toBeNull();
    for (const value of I18N_SIMULATE_ALLOWED_VALUES) {
      expect(i18nSimulateFormatError(env({ I18N_SIMULATE: value }))).toBeNull();
    }
    // Регистр не важен, пробелы обрезаются.
    expect(i18nSimulateFormatError(env({ I18N_SIMULATE: "TRUE" }))).toBeNull();
    expect(i18nSimulateFormatError(env({ I18N_SIMULATE: "  1  " }))).toBeNull();
    expect(i18nSimulateFormatError(env({ I18N_SIMULATE: "False" }))).toBeNull();
  });

  it("любое другое непустое значение — ошибка формата", () => {
    expect(i18nSimulateFormatError(env({ I18N_SIMULATE: SECRET_LIKE_VALUE }))).toBe(
      "I18N_SIMULATE имеет неожиданное значение"
    );
    expect(i18nSimulateFormatError(env({ I18N_SIMULATE: "yes" }))).not.toBeNull();
  });

  it("evaluateScriptStartup падает с кодом 1 при некорректном I18N_SIMULATE", () => {
    const result = evaluateScriptStartup(env({ I18N_SIMULATE: SECRET_LIKE_VALUE }));
    expect(result.ok).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(result.messages[0]).toBe("I18N_SIMULATE имеет неожиданное значение");
  });

  it("значение I18N_SIMULATE не попадает в сообщения", () => {
    const result = evaluateScriptStartup(env({ I18N_SIMULATE: SECRET_LIKE_VALUE }));
    const joined = result.messages.join(" ");
    expect(joined).not.toContain(SECRET_LIKE_VALUE);
    expect(joined).not.toContain("AAAA");
  });
});

describe("i18nEnvGuard: условия боевого запуска", () => {
  it("без ключа и без симуляции — код возврата 1 и понятное сообщение", () => {
    const result = evaluateRealRunPreconditions(env({}));
    expect(result.ok).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(result.messages.join(" ")).toContain("AZURE_TRANSLATOR_KEY не задан");
    // Сообщение должно объяснять последствие, а не только констатировать факт.
    expect(result.messages.join(" ")).toContain("skipped");
  });

  it("пустой ключ без симуляции — тоже код возврата 1", () => {
    const result = evaluateRealRunPreconditions(env({ AZURE_TRANSLATOR_KEY: "" }));
    expect(result.ok).toBe(false);
    expect(result.exitCode).toBe(1);
  });

  it("ключ есть — запуск разрешён", () => {
    const result = evaluateRealRunPreconditions(env({ AZURE_TRANSLATOR_KEY: "present" }));
    expect(result.ok).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.messages).toHaveLength(0);
  });

  it("симуляция включена без ключа — запуск разрешён", () => {
    expect(evaluateRealRunPreconditions(env({ I18N_SIMULATE: "true" })).ok).toBe(true);
    expect(evaluateRealRunPreconditions(env({ I18N_SIMULATE: "1" })).ok).toBe(true);
  });

  it("симуляция явно выключена без ключа — запуск запрещён", () => {
    expect(evaluateRealRunPreconditions(env({ I18N_SIMULATE: "false" })).ok).toBe(false);
    expect(evaluateRealRunPreconditions(env({ I18N_SIMULATE: "0" })).ok).toBe(false);
  });

  it("некорректный I18N_SIMULATE перекрывает даже наличие ключа", () => {
    const result = evaluateRealRunPreconditions(
      env({ AZURE_TRANSLATOR_KEY: "present", I18N_SIMULATE: SECRET_LIKE_VALUE })
    );
    expect(result.ok).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(result.messages[0]).toBe("I18N_SIMULATE имеет неожиданное значение");
  });
});

describe("i18nEnvGuard: результаты ping", () => {
  it("оба языка ok — успех", () => {
    const result = evaluatePingResults([
      { lang: "ms", status: "ok" },
      { lang: "ar", status: "ok" },
    ]);
    expect(result.ok).toBe(true);
    expect(result.exitCode).toBe(0);
  });

  it("статус skipped хотя бы у одного языка — код возврата 1 с указанием языка", () => {
    const result = evaluatePingResults([
      { lang: "ms", status: "skipped" },
      { lang: "ar", status: "ok" },
    ]);
    expect(result.ok).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(result.messages.join(" ")).toContain("ms");
    expect(result.messages.join(" ")).toContain("skipped");
  });

  it("оба языка не ok — в сообщении перечислены оба", () => {
    const result = evaluatePingResults([
      { lang: "ms", status: "skipped" },
      { lang: "ar", status: "error" },
    ]);
    const joined = result.messages.join(" ");
    expect(result.ok).toBe(false);
    expect(joined).toContain("ms");
    expect(joined).toContain("ar");
  });
});
