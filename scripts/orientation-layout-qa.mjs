import { chromium } from "@playwright/test";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const routes = ["/", "/programs", "/about", "/news", "/contact", "/enroll", "/login"];
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 360, height: 640 } });
const checks = [];
const failures = [];

for (const route of routes) {
  try {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    await page.setViewportSize({ width: 640, height: 360 });
    await page.waitForTimeout(150);
    const result = await page.evaluate(() => ({
      route: window.location.pathname,
      viewport: `${window.innerWidth}×${window.innerHeight}`,
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
      openNav: document.querySelector('[aria-expanded="true"]') !== null,
    }));
    checks.push(result);
    if (result.overflow > 1 || result.openNav) failures.push(result);
  } catch (error) {
    failures.push({ route, error: String(error) });
  }
}

await page.close();
await browser.close();
console.log(JSON.stringify({ baseUrl, checks, failures }, null, 2));
if (failures.length) process.exitCode = 1;
