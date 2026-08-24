import { chromium } from "@playwright/test";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const checks = [];
const failures = [];

function pass(name, detail) {
  checks.push({ name, status: "passed", detail });
}

async function assert(condition, name, detail) {
  if (!condition) throw new Error(`${name}: ${detail}`);
  pass(name, detail);
}

try {
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    for (const route of ["/", "/programs", "/contact", "/enroll", "/login"]) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
      const layout = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
      await assert(Math.max(layout.document, layout.body) - layout.viewport <= 1, `${width}px ${route} layout`, "No horizontal overflow");
    }
    await page.close();
  }

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const route of ["/", "/programs", "/contact"]) {
    await desktop.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    const media = await desktop.locator("img[src*='bilingual-idol-']").evaluateAll(images => images.map(image => ({ complete: image.complete, naturalWidth: image.naturalWidth, src: image.currentSrc, loading: image.loading })));
    const criticalMedia = media.filter(image => image.loading !== "lazy");
    await assert(criticalMedia.length > 0 && criticalMedia.every(image => image.complete && image.naturalWidth > 0 && image.src.includes("/manus-storage/")), `${route} media`, `Critical storage-backed images load successfully: ${JSON.stringify(criticalMedia)}`);
  }
  await desktop.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await desktop.getByRole("link", { name: /start a learning enquiry/i }).click();
  await desktop.waitForURL("**/enroll");
  await assert(true, "Primary public CTA", "Home learning enquiry action reaches enrollment form");
  await desktop.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  const menu = mobile.getByRole("button", { name: "Open navigation", exact: true });
  await menu.click();
  await mobile.getByRole("navigation", { name: "Mobile navigation" }).waitFor();
  await mobile.getByRole("link", { name: "Programmes", exact: true }).last().click();
  await mobile.waitForURL("**/programs");
  await assert(true, "Mobile public navigation", "Menu opens accessibly and navigates to Programmes");
  await mobile.close();
} catch (error) {
  failures.push(String(error));
}

await browser.close();
console.log(JSON.stringify({ status: failures.length ? "failed" : "passed", checks, failures }, null, 2));
if (failures.length) process.exitCode = 1;
