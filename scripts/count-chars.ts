import { translations } from "../client/src/lib/translations.js";
import { inMemoryStore } from "../server/db.js";

// Helper to count characters recursively in a nested object
function countChars(obj: any): number {
  let count = 0;
  if (typeof obj === "string") {
    return obj.length;
  } else if (typeof obj === "object" && obj !== null) {
    for (const key of Object.keys(obj)) {
      count += countChars(obj[key]);
    }
  }
  return count;
}

function run() {
  console.log("=== Character Count Audit ===");

  // 1. UI translation keys (English dictionary)
  const englishDict = translations.en;
  const uiCharCount = countChars(englishDict);
  console.log(`UI Translation Dictionary (EN): ${uiCharCount} characters`);

  // 2. Seed data
  let seedCharCount = 0;

  // Programs: count title, duration, schedule, fees, description
  inMemoryStore.programs.forEach(p => {
    seedCharCount += (p.title || "").length;
    seedCharCount += (p.duration || "").length;
    seedCharCount += (p.schedule || "").length;
    seedCharCount += (p.fees || "").length;
    seedCharCount += (p.description || "").length;
  });

  // Announcements: count title, excerpt, body, imageAltText
  inMemoryStore.announcements.forEach(a => {
    seedCharCount += (a.title || "").length;
    seedCharCount += (a.excerpt || "").length;
    seedCharCount += (a.body || "").length;
    seedCharCount += (a.imageAltText || "").length;
  });

  // Promotions: count title, description
  inMemoryStore.promotions.forEach(p => {
    seedCharCount += (p.title || "").length;
    seedCharCount += (p.description || "").length;
  });

  // Placement Tests: count title, questionsJson (parsed question texts/options)
  inMemoryStore.placementTests.forEach(pt => {
    seedCharCount += (pt.title || "").length;
    try {
      const qs = JSON.parse(pt.questionsJson || "[]");
      qs.forEach((q: any) => {
        seedCharCount += (q.text || "").length;
        if (Array.isArray(q.options)) {
          q.options.forEach((o: any) => {
            seedCharCount += (o || "").length;
          });
        }
      });
    } catch (e) {
      // ignore
    }
  });

  console.log(`Database Seed Data Translatable Content: ${seedCharCount} characters`);
  console.log(`Total content to translate (including markup): ${uiCharCount + seedCharCount} characters`);
}

run();
