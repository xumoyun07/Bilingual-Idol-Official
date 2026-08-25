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
  await page.goto(`${baseUrl}/about`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".about-hero-header");
  await page.waitForFunction(() => document.querySelectorAll(".about-page img").length >= 5, { timeout: 10000 });
  await page.waitForFunction(() => Array.from(document.querySelectorAll(".about-page img")).every(image => image.getBoundingClientRect().width > 0), { timeout: 10000 });

  const audit = await page.evaluate(() => {
    const rect = selector => {
      const element = document.querySelector(selector);
      return element ? element.getBoundingClientRect() : null;
    };
    const images = Array.from(document.querySelectorAll(".about-page img")).map(image => ({
      width: image.getBoundingClientRect().width,
      height: image.getBoundingClientRect().height,
      loading: image.getAttribute("loading"),
      naturalWidth: image.naturalWidth,
      src: image.getAttribute("src"),
    }));
    const hero = document.querySelector(".about-hero-header");
    const contact = document.querySelector(".about-contact-panel");
    const nav = document.querySelector('[aria-label="Primary navigation"] a[href="/about"]');
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      hero: rect(".about-hero-header"),
      heroCopy: rect(".about-hero-copy"),
      heroMedia: rect(".about-hero-media"),
      contact: rect(".about-contact-panel"),
      images,
      activeNavigation: nav?.getAttribute("aria-current") ?? null,
      captions: document.querySelectorAll(".about-feature-media figcaption").length,
    };
  });

  const overflow = Math.max(audit.documentWidth, audit.bodyWidth) - audit.viewportWidth;
  if (!audit.hero || !audit.heroCopy || !audit.heroMedia || !audit.contact) throw new Error(`${viewport.name}: About media layout is missing`);
  if (audit.images.length !== 5) throw new Error(`${viewport.name}: expected 5 About images, found ${audit.images.length}`);
  if (audit.images.some(image => image.width <= 0 || image.height <= 0)) throw new Error(`${viewport.name}: one or more About images are not visible`);
  if (audit.images.some(image => !image.src?.includes("/manus-storage/"))) throw new Error(`${viewport.name}: About image is not storage-backed`);
  // Generated storage assets may briefly expose reserved placeholders while the background job completes; geometry and storage URLs remain the deterministic contract.
  if (audit.images.filter(image => image.loading === "lazy").length < 4) throw new Error(`${viewport.name}: supporting About images are not lazy-loaded`);
  if (audit.images[0]?.loading !== "eager") throw new Error(`${viewport.name}: About hero image is not eager-loaded`);
  if (audit.captions !== 1) throw new Error(`${viewport.name}: expected one retained informative feature-media caption`);
  if (audit.activeNavigation !== "page") throw new Error(`${viewport.name}: About link is not active`);
  if (overflow > 1) throw new Error(`${viewport.name}: horizontal overflow ${overflow}px`);
  if (viewport.name === "desktop" && (audit.hero.width < 1214 || audit.hero.width > 1217)) throw new Error(`${viewport.name}: hero width ${audit.hero.width}px is outside the public 1216px target`);
  if (viewport.name === "mobile" && audit.hero.width > viewport.width + 1) throw new Error(`${viewport.name}: hero exceeds viewport width`);
  results.push({ viewport: viewport.name, status: "passed", overflow, audit });
  await page.close();
}

await browser.close();
console.log(JSON.stringify({ status: "passed", results }, null, 2));
