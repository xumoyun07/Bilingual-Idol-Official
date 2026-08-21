import { chromium } from "@playwright/test";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const viewports = [
  [360, 640], [390, 844], [412, 915], [768, 1024], [1024, 1366], [1366, 768], [1920, 1080], [3840, 2160],
];
const routes = ["/", "/programs", "/about", "/news", "/contact", "/enroll", "/login"];
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const failures = [];
const checks = [];

for (const [width, height] of viewports) {
  const page = await browser.newPage({ viewport: { width, height } });
  for (const route of routes) {
    try {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
      const audit = await page.evaluate(() => ({
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        visibleButtons: [...document.querySelectorAll(".compass-btn-primary, .compass-btn-secondary")]
          .filter(element => { const rect = element.getBoundingClientRect(); return rect.width > 0 && rect.height > 0; })
          .map(element => { const rect = element.getBoundingClientRect(); return { width: rect.width, height: rect.height, label: element.textContent?.trim() ?? "" }; }),
      }));
      const overflow = Math.max(audit.documentWidth, audit.bodyWidth) - audit.viewportWidth;
      const undersized = audit.visibleButtons.filter(button => button.height < 47.5);
      const result = { viewport: `${width}×${height}`, route, overflow, undersized };
      checks.push(result);
      if (overflow > 1 || undersized.length) failures.push(result);
    } catch (error) {
      failures.push({ viewport: `${width}×${height}`, route, error: String(error) });
    }
  }
  await page.close();
}

await browser.close();
console.log(JSON.stringify({ baseUrl, checks, failures }, null, 2));
if (failures.length) process.exitCode = 1;
