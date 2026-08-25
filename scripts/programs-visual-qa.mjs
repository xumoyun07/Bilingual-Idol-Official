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
  await page.goto(`${baseUrl}/programs`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".simple-route-header--programmes");
  await page.waitForFunction(() => {
    const image = document.querySelector(".simple-route-header-media img");
    return Boolean(image && image.getBoundingClientRect().width > 0);
  }, { timeout: 10000 });
  const audit = await page.evaluate(() => {
    const route = document.querySelector(".simple-route-page");
    const header = document.querySelector(".simple-route-header--programmes");
    const copy = document.querySelector(".simple-route-header-copy");
    const media = document.querySelector(".simple-route-header-media");
    const image = document.querySelector(".simple-route-header-media img");
    const programmesLink = document.querySelector('[aria-label="Primary navigation"] a[href="/programs"]');
    const rect = element => element ? element.getBoundingClientRect() : null;
    const imageStyle = image ? getComputedStyle(image) : null;
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      route: rect(route),
      header: rect(header),
      copy: rect(copy),
      media: rect(media),
      image: rect(image),
      imageWidth: rect(image)?.width ?? 0,
      imageObjectFit: imageStyle?.objectFit ?? null,
      programmesActive: programmesLink?.getAttribute("aria-current") ?? null,
    };
  });
  const overflow = Math.max(audit.documentWidth, audit.bodyWidth) - audit.viewportWidth;
  if (!audit.header || !audit.copy || !audit.media || !audit.image) throw new Error(`${viewport.name}: Programs header/media is missing`);
  if (audit.media.width <= 0 || audit.image.width <= 0) throw new Error(`${viewport.name}: Programs image is not visible`);
  if (audit.imageWidth > 401) throw new Error(`${viewport.name}: image width ${audit.imageWidth}px exceeds 400px cap`);
  if (viewport.name === "desktop" && Math.abs((audit.header?.width ?? 0) - 1216) > 1) throw new Error(`${viewport.name}: header width ${audit.header?.width}px does not match 1216px target`);
  if (viewport.name === "desktop" && Math.abs((audit.header?.height ?? 0) - 500) > 1) throw new Error(`${viewport.name}: header height ${audit.header?.height}px does not match 500px target`);
  if (audit.imageObjectFit !== "cover") throw new Error(`${viewport.name}: image object-fit is not cover`);
  if (viewport.name === "desktop" && audit.copy.right > audit.media.left + 1) throw new Error(`${viewport.name}: copy overlaps right-side image`);
  if (overflow > 1) throw new Error(`${viewport.name}: horizontal overflow ${overflow}px`);
  if (audit.programmesActive !== "page") throw new Error(`${viewport.name}: Programmes link is not active`);
  results.push({ viewport: viewport.name, status: "passed", overflow, audit });
  await page.close();
}

await browser.close();
console.log(JSON.stringify({ status: "passed", results }, null, 2));
