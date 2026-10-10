// ВАЖНО: dotenv/config обязан идти ПЕРВОЙ строкой.
// server/services/azureTranslator.ts вычисляет hasKey и region на этапе
// загрузки модуля (строки 16-17), поэтому .env должен быть прочитан раньше,
// чем этот модуль будет импортирован. Без него ping видел пустой ключ
// и возвращал статус "skipped" с кодом возврата 0.
import "dotenv/config";

import { translateBatch, getTranslatorUsage, BRANDS } from "./azureTranslator";
import { evaluatePingResults, evaluateScriptStartup } from "./i18nEnvGuard";

async function ping() {
  // Некорректный I18N_SIMULATE — ошибка окружения, продолжать нельзя.
  const startup = evaluateScriptStartup();
  if (!startup.ok) {
    for (const message of startup.messages) console.error(`[i18n:ping] ${message}`);
    process.exit(startup.exitCode);
  }

  console.log("=== I18N PING TEST ===");
  console.log("Brands configured for protection:", BRANDS);

  const testPhrase = "Welcome to the Bilingual Idol platform, {studentName}! Our office is at Pavilion Embassy. For questions, contact us via WhatsApp.";
  console.log(`Original Text: "${testPhrase}"\n`);

  console.log("Translating...");
  const start = Date.now();
  const results = await translateBatch([testPhrase], ["ms", "ar"]);
  const duration = Date.now() - start;

  const msResult = results.translations[testPhrase]["ms"];
  const arResult = results.translations[testPhrase]["ar"];

  console.log(`\nTranslation finished in ${duration}ms:`);
  console.log("Malay (ms) Status:", msResult.status, "| Text:", JSON.stringify(msResult.text));
  console.log("Arabic (ar) Status:", arResult.status, "| Text:", JSON.stringify(arResult.text));

  const usage = await getTranslatorUsage();
  console.log(`\nMonthly Quota Used: ${usage} characters`);

  // Ping считается успешным только если ОБА языка вернули реальный перевод.
  // Иначе скрипт молча завершался с кодом 0, и по нему нельзя было
  // отличить рабочую связь с Azure от полностью нерабочей.
  const verdict = evaluatePingResults([
    { lang: "ms", status: msResult.status },
    { lang: "ar", status: arResult.status },
  ]);
  if (!verdict.ok) {
    for (const message of verdict.messages) console.error(`\n[i18n:ping] ${message}`);
    process.exit(verdict.exitCode);
  }

  console.log("\n[i18n:ping] OK: оба языка вернули реальный перевод.");
}

ping().catch(error => {
  console.error("i18n:ping failed:", error);
  process.exit(1);
});
