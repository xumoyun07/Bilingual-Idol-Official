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
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".simple-home-intro--floating");
  const audit = await page.evaluate(() => {
    const floating = document.querySelector(".simple-home-intro--floating");
    const header = document.querySelector(".simple-public-header");
    const homeLink = document.querySelector('[aria-label="Primary navigation"] a[href="/"]');
    const rect = element => element ? element.getBoundingClientRect() : null;
    const floatingStyle = floating ? getComputedStyle(floating) : null;
    const headerStyle = header ? getComputedStyle(header) : null;
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      floating: rect(floating),
      floatingTransform: floatingStyle?.transform ?? null,
      floatingAnimation: floatingStyle?.animationName ?? null,
      floatingPerspective: floatingStyle?.perspective ?? null,
      headerPosition: headerStyle?.position ?? null,
      headerZIndex: headerStyle?.zIndex ?? null,
      homeActive: homeLink?.getAttribute("aria-current") ?? null,
    };
  });
  const overflow = Math.max(audit.documentWidth, audit.bodyWidth) - audit.viewportWidth;
  if (!audit.floating || audit.floating.width <= 0 || audit.floating.height <= 0) throw new Error(`${viewport.name}: Hero floating object is not visible`);
  if (overflow > 1) throw new Error(`${viewport.name}: horizontal overflow ${overflow}px`);
  if (audit.headerPosition !== "sticky" || audit.headerZIndex !== "1000") throw new Error(`${viewport.name}: sticky header layer is incorrect`);
  if (audit.homeActive !== "page") throw new Error(`${viewport.name}: Home link is not active on /`);
  results.push({ viewport: viewport.name, status: "passed", overflow, audit });
  await page.close();
}

await browser.close();
console.log(JSON.stringify({ status: "passed", results }, null, 2));
