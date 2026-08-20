import { chromium } from "@playwright/test";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const email = process.env.FOUNDER_QA_EMAIL;
const password = process.env.FOUNDER_QA_PASSWORD;
if (!email || !password) throw new Error("FOUNDER_QA_EMAIL and FOUNDER_QA_PASSWORD are required for this private QA run.");

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const checks = [];
const titleBase = `Temporary QA item ${Date.now()}`;
let activeTitle = titleBase;
let needsCleanup = false;

async function check(name, action) {
  try { await action(); checks.push({ name, status: "passed" }); }
  catch (error) { checks.push({ name, status: "failed", detail: error instanceof Error ? error.message : String(error) }); throw error; }
}

async function fillLearningItem(title) {
  await page.getByLabel("Learning area").selectOption("schedule");
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Description").fill("Temporary private QA record used only to exercise interface feedback and removed immediately.");
  await page.getByLabel("Display order").fill("999");
}

async function deleteItem(title) {
  const deleteButton = page.getByRole("button", { name: `Delete ${title}` });
  if (!await deleteButton.count()) return false;
  page.once("dialog", dialog => dialog.accept());
  await deleteButton.click();
  await page.getByRole("status").filter({ hasText: /removed/i }).waitFor({ timeout: 10000 });
  await deleteButton.waitFor({ state: "detached", timeout: 10000 });
  return true;
}

try {
  await check("Founder signs in through the password-only flow", async () => {
    await page.goto(`${baseUrl}/admin/login`, { waitUntil: "networkidle" });
    await page.locator("#founder-email").fill(email);
    await page.locator("#founder-password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/admin", { timeout: 10000 });
  });

  await check("Founder operations shows create success feedback", async () => {
    await page.goto(`${baseUrl}/admin/operations`, { waitUntil: "networkidle" });
    await fillLearningItem(activeTitle);
    await page.getByRole("button", { name: "Add item" }).click();
    await page.getByRole("status").filter({ hasText: /created/i }).waitFor({ timeout: 10000 });
    needsCleanup = true;
  });

  await check("Founder operations shows update success feedback", async () => {
    await page.getByRole("button", { name: `Edit ${activeTitle}` }).click();
    activeTitle = `${titleBase} updated`;
    await page.getByLabel("Title").fill(activeTitle);
    await page.getByRole("button", { name: "Update item" }).click();
    await page.getByRole("status").filter({ hasText: /updated/i }).waitFor({ timeout: 10000 });
  });

  await check("Founder operations shows delete success feedback", async () => {
    await deleteItem(activeTitle);
    needsCleanup = false;
  });

  await check("Founder operations displays a query error state without changing data", async () => {
    await page.route("**/api/trpc/**", route => route.request().url().includes("content.learningItems") ? route.abort() : route.continue());
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByText("Unable to load learning items.").waitFor({ timeout: 10000 });
    await page.unroute("**/api/trpc/**");
  });

  await check("Founder operations displays a mutation error without creating data", async () => {
    await page.goto(`${baseUrl}/admin/operations`, { waitUntil: "networkidle" });
    await page.route("**/api/trpc/**", route => route.request().url().includes("content.createLearningItem") ? route.abort() : route.continue());
    await fillLearningItem(`${titleBase} failed request`);
    await page.getByRole("button", { name: "Add item" }).click();
    await page.getByRole("alert").filter({ hasText: /could not be created/i }).waitFor({ timeout: 10000 });
    await page.unroute("**/api/trpc/**");
  });
} finally {
  await page.unroute("**/api/trpc/**");
  if (needsCleanup) {
    try { await page.goto(`${baseUrl}/admin/operations`, { waitUntil: "networkidle" }); await deleteItem(activeTitle); }
    catch (error) { checks.push({ name: "temporary private QA cleanup", status: "failed", detail: error instanceof Error ? error.message : String(error) }); }
  }
  await browser.close();
}

console.log(JSON.stringify({ baseUrl, checks, temporaryDataPersisted: needsCleanup }, null, 2));
if (checks.some(check => check.status === "failed")) process.exitCode = 1;
