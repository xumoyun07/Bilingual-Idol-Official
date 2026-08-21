import { chromium } from "@playwright/test";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const email = process.env.FOUNDER_QA_EMAIL;
const password = process.env.FOUNDER_QA_PASSWORD;
if (!email || !password) throw new Error("FOUNDER_QA_EMAIL and FOUNDER_QA_PASSWORD are required");

const viewports = [
  [360, 640], [390, 844], [412, 915], [768, 1024], [1024, 1366], [1366, 768], [1920, 1080], [3840, 2160],
];
const routes = ["/admin", "/admin/users"];
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const checks = [];
const orientationChecks = [];
const failures = [];

for (const [width, height] of viewports) {
  const page = await browser.newPage({ viewport: { width, height } });
  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
    await page.locator("#founder-email").fill(email);
    await page.locator("#founder-password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/admin", { timeout: 10000 });
    for (const route of routes) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
      await page.waitForSelector(".dashboard-fixed-header", { timeout: 10000 });
      const before = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        headerTop: document.querySelector(".dashboard-fixed-header")?.getBoundingClientRect().top ?? null,
        sidebarTop: document.querySelector('[data-slot="sidebar-container"]')?.getBoundingClientRect().top ?? null,
        interactive: [...document.querySelectorAll("button, a[href]")]
          .filter((element) => { const rect = element.getBoundingClientRect(); return rect.width > 0 && rect.height > 0; })
          .map((element) => { const rect = element.getBoundingClientRect(); return { label: element.textContent?.trim() ?? element.getAttribute("aria-label") ?? "", width: rect.width, height: rect.height }; }),
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
      const undersized = before.interactive.filter((target) => target.height < 47.5);
      const result = { viewport: `${width}×${height}`, route, overflow, fixedOk, undersized, before: { ...before, interactive: undefined }, after };
      checks.push(result);
      if (overflow > 1 || !fixedOk || undersized.length) failures.push(result);
    }
  } catch (error) {
    failures.push({ viewport: `${width}×${height}`, error: String(error) });
  }
  await page.close();
}

const orientationPage = await browser.newPage({ viewport: { width: 768, height: 1024 } });
try {
  await orientationPage.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await orientationPage.locator("#founder-email").fill(email);
  await orientationPage.locator("#founder-password").fill(password);
  await orientationPage.getByRole("button", { name: "Sign in" }).click();
  await orientationPage.waitForURL("**/admin", { timeout: 10000 });
  for (const route of routes) {
    await orientationPage.setViewportSize({ width: 768, height: 1024 });
    await orientationPage.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    await orientationPage.waitForSelector(".dashboard-fixed-header", { timeout: 10000 });
    await orientationPage.setViewportSize({ width: 1024, height: 768 });
    await orientationPage.waitForTimeout(150);
    const result = await orientationPage.evaluate(() => {
      const surface = document.querySelector(".founder-command")?.getBoundingClientRect();
      return {
        route: window.location.pathname,
        from: "768×1024",
        to: `${window.innerWidth}×${window.innerHeight}`,
        overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
        headerTop: document.querySelector(".dashboard-fixed-header")?.getBoundingClientRect().top ?? null,
        sidebarTop: document.querySelector('[data-slot="sidebar-container"]')?.getBoundingClientRect().top ?? null,
        surfaceInsideViewport: Boolean(surface && surface.left >= 0 && surface.right <= window.innerWidth),
      };
    });
    orientationChecks.push(result);
    if (result.overflow > 1 || result.headerTop !== 0 || result.sidebarTop !== 0 || !result.surfaceInsideViewport) failures.push({ orientation: result });
  }
} catch (error) {
  failures.push({ orientationError: String(error) });
}
await orientationPage.close();

await browser.close();
console.log(JSON.stringify({ baseUrl, checks, orientationChecks, failures }, null, 2));
if (failures.length) process.exitCode = 1;
