import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import mysql from "mysql2/promise";
import { chromium } from "@playwright/test";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const runId = randomUUID();
const email = `super-admin-qa-${runId}@bilingualidol.invalid`;
const openId = `super-admin-qa:${runId}`;
const password = randomBytes(24).toString("base64url");
const salt = randomBytes(16).toString("hex");
const passwordHash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
const checks = [];
let browser;
let database;
let inserted = false;

function pass(name, detail) { checks.push({ name, status: "passed", detail }); }

try {
  database = await mysql.createConnection(databaseUrl);
  await database.execute(
    "INSERT INTO users (openId, name, email, passwordHash, isActive, loginMethod, role, createdAt, updatedAt, lastSignedIn) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())",
    [openId, "Super admin QA", email, passwordHash, true, "qa-automation", "super_admin"],
  );
  inserted = true;
  browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  async function assertActiveSidebarItem(activeLabel, inactiveLabels) {
    const sidebar = page.locator(".compass-rail");
    const active = sidebar.getByRole("button", { name: activeLabel, exact: true });
    const activeStyle = await active.evaluate(element => ({ background: getComputedStyle(element).backgroundColor, icon: getComputedStyle(element.querySelector("svg")).color }));
    if (activeStyle.background !== "rgb(16, 37, 62)" || activeStyle.icon !== "rgb(243, 181, 159)") throw new Error(`${activeLabel} did not receive the active background and icon colour`);
    for (const label of inactiveLabels) {
      const style = await sidebar.getByRole("button", { name: label, exact: true }).evaluate(element => ({ background: getComputedStyle(element).backgroundColor, icon: getComputedStyle(element.querySelector("svg")).color }));
      if (style.background === "rgb(16, 37, 62)" || style.icon === "rgb(243, 181, 159)") throw new Error(`${label} incorrectly retained active sidebar styling`);
    }
  }
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.locator("#sign-in-email").fill(email);
  await page.locator("#sign-in-password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/super-admin", { timeout: 10000 });
  await page.getByRole("heading", { name: /manage access with clear boundaries/i }).waitFor({ timeout: 10000 });
  if (await page.getByRole("button", { name: "Toggle navigation", exact: true }).count()) throw new Error("Desktop sidebar still renders a collapse control");
  pass("Super admin post-login routing", "Universal sign-in opened the separate Super admin dashboard");
  pass("Desktop fixed sidebar", "Desktop workspace has no collapse control");

  await page.goto(`${baseUrl}/super-admin/users`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /people, managed within your scope/i }).waitFor({ timeout: 10000 });
  await assertActiveSidebarItem("Users", ["Dashboard", "Audit logs"]);
  pass("Most-specific sidebar state", "Users alone has active background and apricot icon; Dashboard and Audit logs are inactive");
  const modules = page.locator('nav[aria-label="User type modules"]');
  for (const role of ["Students", "Teachers", "Marketing", "Admins"]) await modules.getByRole("button", { name: `Type ${role}`, exact: true }).waitFor({ timeout: 10000 });
  if (await modules.getByRole("button", { name: "Type Super admins", exact: true }).count()) throw new Error("Super admin module exposed peer Super admins");
  if (await page.getByRole("button", { name: "Configure create form", exact: true }).count()) throw new Error("Super admin module exposed Field Builder");
  pass("Scoped Users navigation", "Only Students, Teachers, Marketing and Admins are visible; no Field Builder action is rendered");

  await page.getByRole("button", { name: "New user" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("heading", { name: "Create user" }).waitFor({ timeout: 10000 });
  const roleValues = await dialog.getByLabel("User type").locator("option").evaluateAll(options => options.map(option => option.getAttribute("value")));
  if (roleValues.includes("super_admin")) throw new Error("Super admin create form exposed peer Super admin role");
  await page.keyboard.press("Escape");
  pass("Scoped create form", "Create form excludes Super admin role and provides no Field Builder entry point");

  await page.goto(`${baseUrl}/super-admin/audit-logs`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /audit logs/i }).waitFor({ timeout: 10000 });
  await assertActiveSidebarItem("Audit logs", ["Dashboard", "Users"]);
  pass("Audit sidebar state", "Audit logs alone has active background and apricot icon after route navigation");

  await page.goto(`${baseUrl}/admin/users`, { waitUntil: "networkidle" });
  await page.waitForURL("**/super-admin", { timeout: 10000 });
  pass("Private console isolation", "Super admin is redirected away from private control routes to its own dashboard");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/super-admin/users`, { waitUntil: "networkidle" });
  const mobileTrigger = page.getByRole("button", { name: "Toggle Sidebar", exact: true });
  await mobileTrigger.waitFor({ timeout: 10000 });
  await mobileTrigger.click();
  await page.getByRole("button", { name: "Users", exact: true }).last().waitFor({ timeout: 10000 });
  const mobileSidebar = page.locator('[data-sidebar="sidebar"][data-mobile="true"]');
  const sidebarBackground = await mobileSidebar.evaluate(element => getComputedStyle(element).backgroundColor);
  if (sidebarBackground !== "rgb(16, 37, 62)") throw new Error(`Mobile sidebar background must be opaque navy, received ${sidebarBackground}`);
  const activeMobileItem = mobileSidebar.getByRole("button", { name: "Users", exact: true });
  const activeMobileStyle = await activeMobileItem.evaluate(element => ({ background: getComputedStyle(element).backgroundColor, text: getComputedStyle(element).color }));
  if (activeMobileStyle.background !== "rgb(239, 121, 91)" || activeMobileStyle.text !== "rgb(16, 37, 62)") throw new Error("Mobile active navigation lacks the contrast treatment");
  pass("Mobile navigation control", "Mobile header retains an accessible Sidebar trigger and opens the workspace navigation");
  pass("Mobile opaque sidebar", "Drawer uses opaque navy background with a high-contrast apricot active navigation item");
  await page.close();
  console.log(JSON.stringify({ status: "passed", checks }, null, 2));
} finally {
  await browser?.close();
  if (inserted && database) await database.execute("DELETE FROM users WHERE openId = ? AND loginMethod = ?", [openId, "qa-automation"]);
  await database?.end();
}

process.exit(0);
