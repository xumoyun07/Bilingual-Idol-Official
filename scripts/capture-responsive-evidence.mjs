import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const outputDir = path.resolve(process.env.QA_EVIDENCE_DIR ?? "/home/ubuntu/webdev-static-assets/bilingual-idol-responsive-evidence");
const email = process.env.FOUNDER_QA_EMAIL;
const password = process.env.FOUNDER_QA_PASSWORD;
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });

async function capture({ name, route, width, height, authenticated = false }) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (authenticated) {
    if (!email || !password) throw new Error("FOUNDER_QA_EMAIL and FOUNDER_QA_PASSWORD are required for Founder captures");
    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
    await page.locator("#founder-email").fill(email);
    await page.locator("#founder-password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/admin", { timeout: 10000 });
    await page.waitForSelector(".dashboard-fixed-header", { timeout: 10000 });
    if (route !== "/admin") {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
      await page.waitForSelector(".dashboard-fixed-header", { timeout: 10000 });
    }
  } else {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  }
  await page.screenshot({ path: path.join(outputDir, name), fullPage: true });
  await page.close();
}

await capture({ name: "home-mobile-360x640.png", route: "/", width: 360, height: 640 });
await capture({ name: "programmes-tablet-768x1024.png", route: "/programs", width: 768, height: 1024 });
await capture({ name: "login-desktop-1366x768.png", route: "/login", width: 1366, height: 768 });
await capture({ name: "home-wide-1920x1080.png", route: "/", width: 1920, height: 1080 });
await capture({ name: "home-ultrawide-3840x2160.png", route: "/", width: 3840, height: 2160 });
await capture({ name: "founder-mobile-390x844.png", route: "/admin", width: 390, height: 844, authenticated: true });
await capture({ name: "founder-desktop-1366x768.png", route: "/admin", width: 1366, height: 768, authenticated: true });

await browser.close();
console.log(JSON.stringify({ outputDir }, null, 2));
