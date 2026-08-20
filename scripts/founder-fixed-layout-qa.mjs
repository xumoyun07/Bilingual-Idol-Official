import { chromium } from "@playwright/test";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const email = process.env.FOUNDER_QA_EMAIL;
const password = process.env.FOUNDER_QA_PASSWORD;
if (!email || !password) throw new Error("FOUNDER_QA_EMAIL and FOUNDER_QA_PASSWORD are required.");

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(`${baseUrl}/admin/login`, { waitUntil: "networkidle" });
await page.locator("#founder-email").fill(email);
await page.locator("#founder-password").fill(password);
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL("**/admin", { timeout: 10000 });
await page.goto(`${baseUrl}/admin/operations`, { waitUntil: "networkidle" });
const before = await page.evaluate(() => ({ sidebarTop: document.querySelector('[data-slot="sidebar-container"]')?.getBoundingClientRect().top, headerTop: document.querySelector('.dashboard-fixed-header')?.getBoundingClientRect().top }));
await page.evaluate(() => window.scrollTo(0, 900));
await page.waitForTimeout(150);
const after = await page.evaluate(() => ({ scrollY: window.scrollY, sidebarTop: document.querySelector('[data-slot="sidebar-container"]')?.getBoundingClientRect().top, headerTop: document.querySelector('.dashboard-fixed-header')?.getBoundingClientRect().top }));
await browser.close();
if (after.scrollY < 100 || before.sidebarTop !== 0 || after.sidebarTop !== 0 || before.headerTop !== 0 || after.headerTop !== 0) throw new Error(`Founder fixed layout check failed: ${JSON.stringify({ before, after })}`);
console.log(JSON.stringify({ status: "passed", before, after }, null, 2));
