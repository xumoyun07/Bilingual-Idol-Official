import { chromium } from "@playwright/test";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
for (const viewport of [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  await page.goto(`${baseUrl}/contact`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".contact-hero-header");
  await page.waitForSelector(".simple-map");
  await page.waitForSelector(".simple-form-card");
  await page.waitForSelector(".contact-hero-media");
  const result = await page.evaluate(() => {
    const rect = selector => document.querySelector(selector)?.getBoundingClientRect() ?? null;
    const heroMedia = document.querySelector(".contact-hero-media img");
    return {
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      header: rect(".contact-hero-header"),
      media: rect(".contact-hero-media"),
      contacts: document.querySelectorAll(".simple-contact-item").length,
      map: rect(".simple-map"),
      form: rect(".simple-form-card"),
      mediaSrc: heroMedia?.getAttribute("src") ?? null,
      formFields: document.querySelectorAll(".simple-form-card input, .simple-form-card select, .simple-form-card textarea").length,
    };
  });
  if (!result.header || !result.media || !result.map || !result.form) throw new Error(`${viewport.name}: required Contact surfaces are missing`);
  if (result.contacts !== 4) throw new Error(`${viewport.name}: expected four contact methods`);
  if (!result.mediaSrc?.includes("/manus-storage/")) throw new Error(`${viewport.name}: right-side Contact photo is not storage-backed`);
  if (result.formFields < 7) throw new Error(`${viewport.name}: enquiry form fields are incomplete`);
  if (Math.max(result.documentWidth, result.bodyWidth) - result.viewport > 1) throw new Error(`${viewport.name}: horizontal overflow detected`);
  if (viewport.name === "desktop" && (result.header.width < 1214 || result.header.width > 1217)) throw new Error(`${viewport.name}: header width ${result.header.width}px is outside the 1216px target`);
  if (viewport.name === "mobile" && result.header.width > viewport.width + 1) throw new Error(`${viewport.name}: header exceeds viewport width`);
  console.log(JSON.stringify({ viewport: viewport.name, status: "passed", result }));
  await page.close();
}
await browser.close();
