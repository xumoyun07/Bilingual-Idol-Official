import { chromium } from "@playwright/test";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const email = process.env.FOUNDER_QA_EMAIL;
const password = process.env.FOUNDER_QA_PASSWORD;
if (!email || !password) throw new Error("FOUNDER_QA_EMAIL and FOUNDER_QA_PASSWORD are required");

const viewports = [[390, 844], [768, 1024], [1024, 1366], [1366, 768], [1920, 1080]];
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const checks = [];
const failures = [];

for (const [width, height] of viewports) {
  const page = await browser.newPage({ viewport: { width, height } });
  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
    await page.locator("#founder-email").fill(email);
    await page.locator("#founder-password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/admin", { timeout: 10000 });
    await page.waitForSelector(".dashboard-fixed-header", { timeout: 10000 });
    const before = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      headerTop: document.querySelector(".dashboard-fixed-header")?.getBoundingClientRect().top ?? null,
      sidebarTop: document.querySelector('[data-slot="sidebar-container"]')?.getBoundingClientRect().top ?? null,
    }));
    await page.evaluate(() => window.scrollTo(0, 700));
    await page.waitForTimeout(150);
    const after = await page.evaluate(() => ({
      headerTop: document.querySelector(".dashboard-fixed-header")?.getBoundingClientRect().top ?? null,
      sidebarTop: document.querySelector('[data-slot="sidebar-container"]')?.getBoundingClientRect().top ?? null,
      scrollY: window.scrollY,
    }));
    const overflow = before.documentWidth - before.viewportWidth;
    const desktop = width >= 1024;
    const fixedOk = desktop ? before.sidebarTop === 0 && after.sidebarTop === 0 && before.headerTop === 0 && after.headerTop === 0 : before.headerTop === 0 && after.headerTop === 0;
    const result = { viewport: `${width}×${height}`, overflow, fixedOk, before, after };
    checks.push(result);
    if (overflow > 1 || !fixedOk) failures.push(result);
  } catch (error) {
    failures.push({ viewport: `${width}×${height}`, error: String(error) });
  }
  await page.close();
}

await browser.close();
console.log(JSON.stringify({ baseUrl, checks, failures }, null, 2));
if (failures.length) process.exitCode = 1;
