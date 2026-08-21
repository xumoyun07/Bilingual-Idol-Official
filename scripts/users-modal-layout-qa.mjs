import { chromium } from "@playwright/test";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const email = process.env.FOUNDER_QA_EMAIL;
const password = process.env.FOUNDER_QA_PASSWORD;
if (!email || !password) throw new Error("FOUNDER_QA_EMAIL and FOUNDER_QA_PASSWORD are required");

const viewports = [[360, 640], [390, 844], [768, 1024], [1024, 768]];
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const checks = [];
const failures = [];

for (const [width, height] of viewports) {
  const page = await browser.newPage({ viewport: { width, height } });
  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
    await page.locator("#founder-email").fill(email);
    await page.locator("#founder-password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/admin", { timeout: 10000 });
    await page.goto(`${baseUrl}/admin/users`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "New user" }).click();
    await page.getByRole("dialog").waitFor({ timeout: 10000 });
    const result = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]')?.getBoundingClientRect();
      const controls = [...document.querySelectorAll('[role="dialog"] button, [role="dialog"] input, [role="dialog"] select')]
        .filter(element => { const rect = element.getBoundingClientRect(); return rect.width > 0 && rect.height > 0; })
        .map(element => {
          const target = element instanceof HTMLInputElement && element.type === "checkbox" ? element.closest("label") ?? element : element;
          const rect = target.getBoundingClientRect();
          return { label: element.getAttribute("aria-label") ?? target.textContent?.trim() ?? element.tagName, height: rect.height };
        });
      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
        dialogInsideViewport: Boolean(dialog && dialog.left >= 0 && dialog.right <= window.innerWidth && dialog.top >= 0 && dialog.bottom <= window.innerHeight),
        undersized: controls.filter(control => control.height < 47.5),
      };
    });
    const check = { viewport: `${width}×${height}`, ...result };
    checks.push(check);
    if (result.overflow > 1 || !result.dialogInsideViewport || result.undersized.length) failures.push(check);
  } catch (error) {
    failures.push({ viewport: `${width}×${height}`, error: String(error) });
  }
  await page.close();
}

await browser.close();
console.log(JSON.stringify({ checks, failures }, null, 2));
if (failures.length) process.exitCode = 1;
