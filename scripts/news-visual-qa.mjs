import { chromium } from "@playwright/test";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const results = [];

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  await page.goto(`${baseUrl}/news`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".simple-route-header--news");
  await page.waitForFunction(() => document.querySelector(".news-card-trigger, .simple-empty-state") !== null, { timeout: 10000 });
  const audit = await page.evaluate(() => {
    const route = document.querySelector(".simple-route-page");
    const header = document.querySelector(".simple-route-header--news");
    const feed = document.querySelector(".news-feed");
    const activeLink = document.querySelector('[aria-label="Primary navigation"] a[href="/news"]');
    const headerStyle = header ? getComputedStyle(header) : null;
    const rect = element => element ? element.getBoundingClientRect() : null;
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      route: rect(route),
      header: rect(header),
      feed: rect(feed),
      background: headerStyle?.backgroundColor ?? null,
      borderRadius: headerStyle?.borderRadius ?? null,
      paddingTop: headerStyle?.paddingTop ?? null,
      paddingLeft: headerStyle?.paddingLeft ?? null,
      inlineStyleCount: document.querySelectorAll(".news-page [style]").length,
      active: activeLink?.getAttribute("aria-current") ?? null,
    };
  });
  const overflow = Math.max(audit.documentWidth, audit.bodyWidth) - audit.viewportWidth;
  if (!audit.header || !audit.feed) throw new Error(`${viewport.name}: News header/feed is missing`);
  if (audit.background !== "rgb(255, 255, 255)") throw new Error(`${viewport.name}: News header background ${audit.background} is not white`);
  if (audit.borderRadius !== "16px") throw new Error(`${viewport.name}: News header radius ${audit.borderRadius} does not match 16px`);
  if (audit.paddingTop !== "40px" && viewport.name === "desktop") throw new Error(`${viewport.name}: News header top padding ${audit.paddingTop} does not match 40px`);
  if (audit.paddingLeft !== "20px" && viewport.name === "desktop") throw new Error(`${viewport.name}: News header side padding ${audit.paddingLeft} does not match 20px`);
  if (viewport.name === "desktop" && Math.abs(audit.header.width - 1216) > 1) throw new Error(`${viewport.name}: News header width ${audit.header.width}px does not match 1216px target`);
  if (viewport.name === "mobile" && audit.header.width > audit.route.width + 1) throw new Error(`${viewport.name}: News header exceeds route width`);
  if (audit.inlineStyleCount !== 0) throw new Error(`${viewport.name}: News route contains ${audit.inlineStyleCount} generated inline style attribute(s)`);
  if (audit.active !== "page") throw new Error(`${viewport.name}: News link is not active`);

  const firstCard = page.locator(".news-card-trigger").first();
  const hasCard = await firstCard.count();
  if (hasCard) {
    await firstCard.click();
    const dialog = page.locator('[role="dialog"]');
    await dialog.waitFor({ state: "visible" });
    if (!(await dialog.locator('[data-slot="dialog-close"]').count())) throw new Error(`${viewport.name}: News dialog close affordance is missing`);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
  }
  results.push({ viewport: viewport.name, status: "passed", overflow, audit, cardModal: Boolean(hasCard) });
  await page.close();
}

await browser.close();
console.log(JSON.stringify({ status: "passed", results }, null, 2));
