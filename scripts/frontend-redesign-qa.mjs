import { chromium } from "@playwright/test";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const checks = [];
const failures = [];
const pass = (name, detail) => checks.push({ name, status: "passed", detail });

async function check(condition, name, detail) {
  if (!condition) throw new Error(`${name}: ${detail}`);
  pass(name, detail);
}

try {
  for (const [width, height] of [[1440, 900], [768, 1024], [390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    for (const route of ["/", "/programs", "/about", "/news", "/contact", "/enroll", "/login"]) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
      const layout = await page.evaluate(() => ({ viewport: innerWidth, scroll: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
      await check(Math.max(layout.scroll, layout.body) - layout.viewport <= 1, `${width}px ${route}`, "No horizontal overflow");
    }
    await page.close();
  }
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktop.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await desktop.getByRole("link", { name: /view programmes/i }).click();
  await desktop.waitForURL("**/programs");
  await check(true, "Programme discovery", "Home task link reaches the programme finder");
  await desktop.close();
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await mobile.getByRole("button", { name: "Open navigation", exact: true }).click();
  await mobile.getByRole("navigation", { name: "Mobile navigation" }).waitFor();
  await mobile.getByRole("link", { name: "Contact", exact: true }).last().click();
  await mobile.waitForURL("**/contact");
  await check(true, "Mobile navigation", "Mobile menu opens and reaches a practical contact route");
  await mobile.close();
} catch (error) {
  failures.push(String(error));
}

await browser.close();
console.log(JSON.stringify({ status: failures.length ? "failed" : "passed", checks, failures }, null, 2));
if (failures.length) process.exitCode = 1;
