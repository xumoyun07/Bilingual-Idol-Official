import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const email = process.env.FOUNDER_QA_EMAIL;
const password = process.env.FOUNDER_QA_PASSWORD;
if (!email || !password) throw new Error("FOUNDER_QA_EMAIL and FOUNDER_QA_PASSWORD are required for this private QA run.");

const outputDir = "/home/ubuntu/founder-compass-screens";
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const routes = ["/admin", "/admin/operations", "/admin/learning-data", "/admin/announcements/edit"];

await page.goto(`${baseUrl}/admin/login`, { waitUntil: "networkidle" });
await page.locator("#founder-email").fill(email);
await page.locator("#founder-password").fill(password);
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL("**/admin", { timeout: 10000 });

for (const route of routes) {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${outputDir}/${route.replaceAll("/", "_").slice(1)}-desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${outputDir}/${route.replaceAll("/", "_").slice(1)}-mobile.png`, fullPage: true });
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${outputDir}/${route.replaceAll("/", "_").slice(1)}-tablet.png`, fullPage: true });
}
await browser.close();
console.log(JSON.stringify({ routeCount: routes.length, outputDir }, null, 2));
