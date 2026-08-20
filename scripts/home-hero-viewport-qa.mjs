import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const cases = [{ name: "desktop", width: 1280, height: 720 }, { name: "mobile", width: 390, height: 844 }];
const results = [];

for (const testCase of cases) {
  const page = await browser.newPage({ viewport: { width: testCase.width, height: testCase.height } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  const measurement = await page.evaluate(() => {
    const header = document.querySelector(".compass-public-header");
    const hero = document.querySelector(".compass-home-hero");
    const primaryCta = hero?.querySelector('a[href="/enroll"]');
    const languageRow = document.querySelector(".compass-home-hero .border-t");
    const rect = element => element ? element.getBoundingClientRect() : null;
    return { viewportHeight: window.innerHeight, documentHeight: document.documentElement.scrollHeight, header: rect(header), hero: rect(hero), primaryCta: rect(primaryCta), languageRow: rect(languageRow) };
  });
  const withinHero = measurement.primaryCta.bottom <= measurement.hero.bottom + 1 && measurement.languageRow.bottom <= measurement.hero.bottom + 1;
  const initialScreen = Math.abs((measurement.header.height + measurement.hero.height) - measurement.viewportHeight) <= 1;
  if (!withinHero || !initialScreen) throw new Error(`${testCase.name} hero viewport check failed: ${JSON.stringify(measurement)}`);
  results.push({ ...testCase, status: "passed", ...measurement });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
