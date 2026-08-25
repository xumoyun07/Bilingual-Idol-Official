import { chromium } from "@playwright/test";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const captures = [];

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  await page.goto(`${baseUrl}/news`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".news-card-trigger, .simple-empty-state", { timeout: 10000 });
  const card = page.locator(".news-card-trigger").first();
  if (!(await card.count())) {
    captures.push({ viewport: viewport.name, status: "skipped", reason: "No published card is available" });
    await page.close();
    continue;
  }
  await card.click();
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: "visible" });
  const close = dialog.locator('[data-slot="dialog-close"]');
  if (!(await close.count())) throw new Error(`${viewport.name}: close affordance missing`);
  const file = `/home/ubuntu/news-modal-${viewport.name}.png`;
  await page.screenshot({ path: file, fullPage: false });
  captures.push({ viewport: viewport.name, status: "captured", file });
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  await page.close();
}

await browser.close();
console.log(JSON.stringify({ status: "passed", captures }, null, 2));
