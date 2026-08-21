import { chromium } from "@playwright/test";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({
  headless: true,
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const checks = [];

async function check(name, action) {
  try {
    await action();
    checks.push({ name, status: "passed" });
  } catch (error) {
    checks.push({ name, status: "failed", detail: error instanceof Error ? error.message : String(error) });
  }
}

await check("skip link receives keyboard focus and targets main content", async () => {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.focus("body");
  await page.keyboard.press("Tab");
  const focusedHref = await page.evaluate(() => document.activeElement?.getAttribute("href"));
  if (focusedHref !== "#main-content") throw new Error(`Expected skip link focus; found ${focusedHref ?? "no href"}`);
  await page.keyboard.press("Enter");
  const focusedId = await page.evaluate(() => document.activeElement?.id);
  if (focusedId !== "main-content") throw new Error(`Expected main content focus; found ${focusedId ?? "no id"}`);
});

await check("keyboard activates programme discovery navigation", async () => {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.locator('a[href="/programs"]').first().focus();
  await page.keyboard.press("Enter");
  await page.waitForURL("**/programs");
  if (!await page.getByRole("heading", { name: /find a learning route with the details you need/i }).isVisible()) throw new Error("Programmes heading is not visible after keyboard navigation");
});

await check("programme filters remain keyboard reachable", async () => {
  await page.goto(`${baseUrl}/programs`, { waitUntil: "networkidle" });
  const search = page.getByRole("textbox", { name: "Search programmes" });
  await search.focus();
  await page.keyboard.type("english");
  if (await search.inputValue() !== "english") throw new Error("Search field did not receive keyboard input");
  await page.getByRole("button", { name: "Kids" }).focus();
  await page.keyboard.press("Enter");
});

await check("removed Learning Hub route resolves to an accessible not-found state", async () => {
  await page.goto(`${baseUrl}/learning`, { waitUntil: "networkidle" });
  if (!await page.getByRole("heading", { name: /this route is not on the map/i }).isVisible()) throw new Error("Removed learning route did not resolve to the not-found state");
});

await check("universal sign-in fields are keyboard reachable", async () => {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  const email = page.getByRole("textbox", { name: "E-mail" });
  await email.focus();
  await page.keyboard.type("member@example.com");
  if (await email.inputValue() !== "member@example.com") throw new Error("Universal e-mail field did not receive keyboard input");
  await page.getByRole("textbox", { name: "Password" }).focus();
});

await check("enrollment form exposes keyboard validation feedback", async () => {
  await page.goto(`${baseUrl}/enroll`, { waitUntil: "networkidle" });
  const form = page.locator("form").last();
  await form.getByRole("button", { name: /send enrollment request/i }).focus();
  await page.keyboard.press("Enter");
  const invalidControls = await page.locator('[aria-invalid="true"]').count();
  const alerts = await page.locator('[role="alert"]').count();
  if (invalidControls < 1 || alerts < 1) throw new Error("Expected invalid controls and alert feedback after keyboard submission");
});

await check("unauthenticated access to Founder editor redirects to universal sign in", async () => {
  await page.goto(`${baseUrl}/admin/announcements/edit`, { waitUntil: "networkidle" });
  await page.waitForURL("**/login", { timeout: 10000 });
  if (!await page.getByRole("heading", { name: /welcome back/i }).isVisible()) throw new Error("Universal sign-in form is not visible after protected-route redirect");
});

await check("unauthenticated access to a personal dashboard redirects to universal sign in", async () => {
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
  await page.waitForURL("**/login", { timeout: 10000 });
  if (!await page.getByRole("heading", { name: /welcome back/i }).isVisible()) throw new Error("Universal sign-in form is not visible after dashboard redirect");
});

await browser.close();
console.log(JSON.stringify({ baseUrl, checks }, null, 2));
if (checks.some(check => check.status === "failed")) process.exitCode = 1;
