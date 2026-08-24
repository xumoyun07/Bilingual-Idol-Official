import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import mysql from "mysql2/promise";
import { chromium } from "@playwright/test";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const runId = randomUUID();
const email = `media-qa-${runId}@bilingualidol.invalid`;
const openId = `media-qa:${runId}`;
const password = randomBytes(24).toString("base64url");
const salt = randomBytes(16).toString("hex");
const passwordHash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
const checks = [];
let browser; let database; let inserted = false;

function pass(name, detail) { checks.push({ name, status: "passed", detail }); }
async function noOverflow(page, name) { if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error(`${name} has horizontal overflow`); }

try {
  database = await mysql.createConnection(process.env.DATABASE_URL);
  await database.execute("INSERT INTO users (openId, name, email, passwordHash, isActive, loginMethod, role, createdAt, updatedAt, lastSignedIn) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())", [openId, "Media QA", email, passwordHash, true, "qa-automation", "founder"]);
  inserted = true;
  browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.locator("#sign-in-email").fill(email); await page.locator("#sign-in-password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click(); await page.waitForURL("**/admin", { timeout: 10000 });
  await page.goto(`${baseUrl}/admin/media`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Demonstration media" }).waitFor({ timeout: 10000 });
  await noOverflow(page, "Desktop media manager");
  const sidebar = page.locator('[data-sidebar="sidebar"]').first();
  const mediaButton = sidebar.getByRole("button", { name: "Media", exact: true });
  if (await mediaButton.getAttribute("data-active") !== "true") throw new Error("Media route was not marked active in founder navigation");
  const images = page.locator(".media-record-preview img");
  if (await images.count() < 1 || !(await images.first().evaluate(image => image.complete && image.naturalWidth > 0))) throw new Error("Published public media preview did not load");
  pass("Founder media manager", "A self-cleaning authorised account reached the founder-only public media inventory with loaded asset preview and active navigation");
  await page.goto(`${baseUrl}/super-admin`, { waitUntil: "networkidle" }); await page.waitForURL("**/admin", { timeout: 10000 });
  pass("Workspace boundary", "The media-management account did not gain access to another protected workspace");
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto(`${baseUrl}/admin/media`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Demonstration media" }).waitFor({ timeout: 10000 }); await noOverflow(page, "Mobile media manager");
  await page.getByRole("button", { name: "Toggle Sidebar", exact: true }).click();
  await page.locator('[data-sidebar="sidebar"][data-mobile="true"]').getByRole("button", { name: "Media", exact: true }).waitFor({ timeout: 10000 });
  pass("Mobile media manager", "The responsive manager had no horizontal overflow and kept its accessible navigation trigger");
  console.log(JSON.stringify({ status: "passed", checks }, null, 2));
} finally {
  await browser?.close();
  if (inserted && database) await database.execute("DELETE FROM users WHERE openId = ? AND loginMethod = ?", [openId, "qa-automation"]);
  await database?.end();
}

process.exit(0);
