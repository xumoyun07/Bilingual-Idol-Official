import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import mysql from "mysql2/promise";
import { chromium } from "@playwright/test";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const runId = randomUUID();
const email = `workspace-ui-qa-${runId}@bilingualidol.invalid`;
const openId = `workspace-ui-qa:${runId}`;
const password = randomBytes(24).toString("base64url");
const salt = randomBytes(16).toString("hex");
const passwordHash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
const checks = [];
let browser;
let database;
let inserted = false;

function pass(name, detail) { checks.push({ name, status: "passed", detail }); }

async function noOverflow(page, name) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (overflow) throw new Error(`${name} has horizontal overflow`);
}

try {
  database = await mysql.createConnection(databaseUrl);
  await database.execute(
    "INSERT INTO users (openId, name, email, passwordHash, isActive, loginMethod, role, createdAt, updatedAt, lastSignedIn) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())",
    [openId, "Workspace UI QA", email, passwordHash, true, "qa-automation", "super_admin"],
  );
  inserted = true;
  browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Sign in to your account." }).waitFor({ timeout: 10000 });
  const loginNavigation = await page.evaluate(() => performance.getEntriesByType("navigation")[0]?.toJSON());
  const loginDomContentLoadedMs = Math.round(Number(loginNavigation?.domContentLoadedEventEnd ?? 0));
  if (!loginDomContentLoadedMs || loginDomContentLoadedMs > 3000) throw new Error(`Local sign-in DOM content load took ${loginDomContentLoadedMs} ms`);
  pass("Local sign-in load smoke check", `DOM content loaded in ${loginDomContentLoadedMs} ms in the local QA environment`);
  await page.locator("#sign-in-email").fill(email);
  await page.locator("#sign-in-password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/super-admin", { timeout: 10000 });
  await page.getByRole("heading", { name: "Manage issued accounts." }).waitFor({ timeout: 10000 });
  await noOverflow(page, "Desktop operations dashboard");
  pass("Universal sign-in and role redirect", "An issued super-admin account signed in through the redesigned form and reached its scoped workspace");

  const desktopSidebar = page.locator('[data-sidebar="sidebar"]').first();
  const overview = desktopSidebar.getByRole("button", { name: "Overview", exact: true });
  const overviewStyle = await overview.evaluate(element => ({ background: getComputedStyle(element).backgroundColor, icon: getComputedStyle(element.querySelector("svg")).color }));
  if (overviewStyle.background !== "rgb(23, 63, 173)" || overviewStyle.icon !== "rgb(255, 255, 255)") throw new Error("Desktop active navigation lacks the approved blue-theme treatment");
  pass("Desktop persistent navigation", "The fixed workspace rail marks the active route with colour and icon treatment");

  await page.goto(`${baseUrl}/super-admin/users`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /People, managed within your scope/i }).waitFor({ timeout: 10000 });
  await noOverflow(page, "Desktop users directory");
  const modules = page.locator('nav[aria-label="User type modules"]');
  if (await modules.getByRole("button", { name: "Type Super admins", exact: true }).count()) throw new Error("Scoped users dashboard exposed peer super-admin category");
  if (await page.getByRole("button", { name: "Configure create form", exact: true }).count()) throw new Error("Scoped users dashboard exposed configuration controls");
  pass("Scoped directory and access boundary", "The redesigned Users surface retained scoped categories and excluded restricted controls");

  await page.goto(`${baseUrl}/super-admin/audit-logs`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /Review sensitive activity with clear scope/i }).waitFor({ timeout: 10000 });
  await noOverflow(page, "Desktop audit logs");
  pass("Audit workspace continuity", "Audit logs retained their protected route and responsive data surface");

  await page.goto(`${baseUrl}/admin/users`, { waitUntil: "networkidle" });
  await page.waitForURL("**/super-admin", { timeout: 10000 });
  pass("Protected route isolation", "Scoped account did not gain access to another protected workspace");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/super-admin/users`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /People, managed within your scope/i }).waitFor({ timeout: 10000 });
  await noOverflow(page, "Mobile users directory");
  const trigger = page.getByRole("button", { name: "Toggle Sidebar", exact: true });
  await trigger.click();
  const mobileSidebar = page.locator('[data-sidebar="sidebar"][data-mobile="true"]');
  await mobileSidebar.getByRole("button", { name: "Users", exact: true }).waitFor({ timeout: 10000 });
  const mobileStyle = await mobileSidebar.getByRole("button", { name: "Users", exact: true }).evaluate(element => ({ background: getComputedStyle(element).backgroundColor, text: getComputedStyle(element).color, icon: getComputedStyle(element.querySelector("svg")).color }));
  if (mobileStyle.background !== "rgb(23, 63, 173)" || mobileStyle.text !== "rgb(255, 255, 255)" || mobileStyle.icon !== "rgb(255, 255, 255)") throw new Error(`Mobile active navigation lacks the approved blue-theme contrast treatment: ${JSON.stringify(mobileStyle)}`);
  pass("Mobile drawer and responsive layout", "The navigation trigger opened an opaque drawer with readable active state and no horizontal overflow");

  console.log(JSON.stringify({ status: "passed", checks }, null, 2));
} finally {
  await browser?.close();
  if (inserted && database) await database.execute("DELETE FROM users WHERE openId = ? AND loginMethod = ?", [openId, "qa-automation"]);
  await database?.end();
}

process.exit(0);
