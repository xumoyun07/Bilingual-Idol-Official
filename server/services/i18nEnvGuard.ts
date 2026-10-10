/**
 * Проверки окружения переводчика, общие для скриптов, запускаемых через tsx.
 *
 * ПРАВИЛО БЕЗОПАСНОСТИ: значения переменных окружения здесь никогда не
 * логируются и не возвращаются. Наружу отдаются только факт наличия,
 * длина и булевы результаты.
 *
 * Зачем: в I18N_SIMULATE однажды оказался ключ Azure (84 символа) вместо
 * флага. Функционально это не включало симуляцию, но секрет дублировался
 * в переменной, которая секретом не является. Теперь такой конфиг
 * останавливает скрипт с кодом 1.
 */

export const I18N_SIMULATE_ALLOWED_VALUES = ["true", "1", "false", "0"] as const;

export interface ScriptPreconditions {
  /** Можно ли продолжать запуск */
  ok: boolean;
  /** Код возврата процесса при ok = false */
  exitCode: 0 | 1;
  /** Готовые сообщения для stderr. Значения переменных в них не попадают. */
  messages: string[];
}

/** Задан ли ключ Azure. Значение не читается и не возвращается. */
export function hasAzureKey(env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env.AZURE_TRANSLATOR_KEY;
  return typeof raw === "string" && raw.trim().length > 0;
}

/**
 * Включена ли симуляция.
 * Явно: только "true" или "1" (та же логика, что в azureTranslator.ts:307).
 * Любое другое непустое значение симуляцию НЕ включает.
 */
export function isSimulationEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env.I18N_SIMULATE;
  return raw === "true" || raw === "1";
}

/**
 * Проверяет формат I18N_SIMULATE.
 *
 * Допустимо: переменная отсутствует, пустая строка, true / 1 / false / 0
 * (регистр не важен). Всё остальное — ошибка конфигурации: скорее всего
 * в переменную записан другой секрет.
 *
 * @returns текст ошибки или null, если формат корректен.
 */
export function i18nSimulateFormatError(env: NodeJS.ProcessEnv = process.env): string | null {
  const raw = env.I18N_SIMULATE;
  if (raw === undefined) return null;

  const trimmed = raw.trim();
  if (trimmed === "") return null;

  const normalized = trimmed.toLowerCase();
  if ((I18N_SIMULATE_ALLOWED_VALUES as readonly string[]).includes(normalized)) return null;

  return "I18N_SIMULATE имеет неожиданное значение";
}

/** Подсказки, сопровождающие ошибку формата I18N_SIMULATE. Значение не раскрывается. */
export const I18N_SIMULATE_HINT_MESSAGES = [
  "Допустимы только: true, 1, false, 0. Само значение не выводится намеренно.",
  "Похоже, в переменную записан другой секрет — очистите I18N_SIMULATE в .env и перезапустите.",
];

/**
 * Проверка, выполняемая ЛЮБЫМ режимом скрипта (включая --migrate и --dry-run):
 * некорректный I18N_SIMULATE — это ошибка конфигурации, а не повод продолжать.
 */
export function evaluateScriptStartup(env: NodeJS.ProcessEnv = process.env): ScriptPreconditions {
  const simulateError = i18nSimulateFormatError(env);
  if (!simulateError) return { ok: true, exitCode: 0, messages: [] };
  return { ok: false, exitCode: 1, messages: [simulateError, ...I18N_SIMULATE_HINT_MESSAGES] };
}

/**
 * Условия боевого запуска: нужен либо ключ Azure, либо явно включённая симуляция.
 * Без этого переводчик молча вернёт статус "skipped" для всех строк,
 * поэтому запуск должен падать, а не «успешно» завершаться.
 */
export function evaluateRealRunPreconditions(env: NodeJS.ProcessEnv = process.env): ScriptPreconditions {
  const startup = evaluateScriptStartup(env);
  if (!startup.ok) return startup;

  if (!hasAzureKey(env) && !isSimulationEnabled(env)) {
    return {
      ok: false,
      exitCode: 1,
      messages: [
        "AZURE_TRANSLATOR_KEY не задан, а симуляция (I18N_SIMULATE) не включена.",
        'Переводчик вернул бы статус "skipped" для всех строк, поэтому боевой прогон отменён.',
        "Задайте AZURE_TRANSLATOR_KEY в .env либо выставьте I18N_SIMULATE=true для проверки без обращения к Azure.",
      ],
    };
  }

  return { ok: true, exitCode: 0, messages: [] };
}

/**
 * Оценка результатов ping по языкам.
 * Ping считается неуспешным, если хотя бы один язык вернул статус не "ok".
 */
export function evaluatePingResults(
  results: Array<{ lang: string; status: string }>
): ScriptPreconditions {
  const failed = results.filter((item) => item.status !== "ok");
  if (failed.length === 0) return { ok: true, exitCode: 0, messages: [] };

  return {
    ok: false,
    exitCode: 1,
    messages: [
      `i18n:ping не получил реальный перевод для: ${failed.map((f) => `${f.lang} (статус: ${f.status})`).join(", ")}.`,
      "Проверьте ключ, регион AZURE_TRANSLATOR_REGION и доступность api.cognitive.microsofttranslator.com.",
    ],
  };
}
