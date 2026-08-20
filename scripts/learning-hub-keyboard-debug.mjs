import { chromium } from "@playwright/test";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto("http://localhost:3000/learning", { waitUntil: "domcontentloaded" });
const learningTab = (name) => page.locator('nav[aria-label="Learning areas"] button').filter({ hasText: name }).first();
const states = [];
for (const name of ["Materials", "Payments", "Teacher"]) {
  await learningTab(name).focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
  states.push({ name, body: (await page.locator("body").innerText()).slice(0, 1400) });
}
console.log(JSON.stringify({ url: page.url(), buttons: await page.getByRole("button").allTextContents(), states }, null, 2));
await browser.close();
