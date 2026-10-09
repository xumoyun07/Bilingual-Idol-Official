import { translateBatch, getTranslatorUsage, BRANDS } from "./azureTranslator";

async function ping() {
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
}

ping().catch(error => {
  console.error("i18n:ping failed:", error);
  process.exit(1);
});
