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

await check("learning hub exposes core learning journeys through keyboard navigation", async () => {
  await page.goto(`${baseUrl}/learning`, { waitUntil: "domcontentloaded" });
  const learningTab = (name) => page.locator('nav[aria-label="Learning areas"] button').filter({ hasText: name }).first();
  await learningTab("Materials").waitFor();
  await learningTab("Materials").focus();
  await page.keyboard.press("Enter");
  if (!await page.getByRole("heading", { name: /practice that stays close/i }).isVisible()) throw new Error("Materials state did not activate from keyboard control");
  await learningTab("Payments").focus();
  await page.keyboard.press("Enter");
  if (!await page.getByRole("heading", { name: /service details, without guessing/i }).isVisible()) throw new Error("Payments state did not activate from keyboard control");
  await learningTab("Teacher").focus();
  await page.keyboard.press("Enter");
  const teacherSupport = page.getByText("Ask your teacher a learning question", { exact: true });
  await teacherSupport.waitFor();
  if (!await teacherSupport.isVisible()) throw new Error("Teacher support request flow is not visible from keyboard navigation");
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

await check("unauthenticated access to Founder editor redirects to sign in", async () => {
  await page.goto(`${baseUrl}/admin/announcements/edit`, { waitUntil: "networkidle" });
  await page.waitForURL("**/admin/login", { timeout: 10000 });
  if (!await page.getByRole("heading", { name: /welcome back/i }).isVisible()) throw new Error("Founder sign-in form is not visible after protected-route redirect");
});

await check("unauthenticated access to Founder learning data redirects to sign in", async () => {
  await page.goto(`${baseUrl}/admin/learning-data`, { waitUntil: "networkidle" });
  await page.waitForURL("**/admin/login", { timeout: 10000 });
  if (!await page.getByRole("heading", { name: /welcome back/i }).isVisible()) throw new Error("Founder sign-in form is not visible after learning-data redirect");
});

await browser.close();
console.log(JSON.stringify({ baseUrl, checks }, null, 2));
if (checks.some(check => check.status === "failed")) process.exitCode = 1;
