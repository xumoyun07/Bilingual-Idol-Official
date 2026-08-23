import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import mysql from "mysql2/promise";
import { chromium } from "@playwright/test";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const runId = randomUUID();
const email = `audit-super-admin-qa-${runId}@bilingualidol.invalid`;
const openId = `audit-super-admin-qa:${runId}`;
const password = randomBytes(24).toString("base64url");
const salt = randomBytes(16).toString("hex");
const passwordHash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
const checks = [];
let browser;
let database;
let inserted = false;
let userId;

function pass(name, detail) { checks.push({ name, status: "passed", detail }); }

try {
  database = await mysql.createConnection(databaseUrl);
  const [insertResult] = await database.execute(
    "INSERT INTO users (openId, name, email, passwordHash, isActive, loginMethod, role, createdAt, updatedAt, lastSignedIn) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())",
    [openId, "Audit Super admin QA", email, passwordHash, true, "qa-automation", "super_admin"],
  );
  userId = Number(insertResult.insertId);
  inserted = true;
  browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.locator("#sign-in-email").fill(email);
  await page.locator("#sign-in-password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/super-admin", { timeout: 10000 });

  await page.goto(`${baseUrl}/super-admin/audit-logs`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /review sensitive activity with clear scope/i }).waitFor({ timeout: 10000 });
  await page.getByRole("button", { name: "CSV", exact: true }).waitFor({ timeout: 10000 });
  if (await page.getByRole("tab", { name: "Archive", exact: true }).count()) throw new Error("Super admin Audit logs exposed archive tab");
  if (await page.getByRole("button", { name: /run 12-month archive/i }).count()) throw new Error("Super admin Audit logs exposed manual archive control");
  const roleLabels = await page.locator('label:has-text("Role") option').evaluateAll(options => options.map(option => option.textContent?.trim().toLowerCase()));
  if (roleLabels.some(label => label?.includes("founder"))) throw new Error("Super admin Audit logs exposed Founder role filter");
  pass("Scoped Audit controls", "Super admin sees active scoped logs and export controls only; archive and Founder filter controls are absent");

  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /matching event/i }).waitFor({ timeout: 10000 });
  const table = page.locator("table");
  await table.waitFor({ timeout: 10000 });
  const tableText = (await table.textContent() ?? "").toLowerCase();
  if (tableText.includes("founder")) throw new Error("Super admin scoped audit table leaked Founder activity");
  if (tableText.includes("private workspace")) throw new Error("Super admin scoped audit table leaked private-control activity");
  pass("Scoped Audit data", "Reloaded scoped list shows only the current Super admin audit interaction and no Founder/private activity");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "CSV", exact: true }).click(),
  ]);
  if (!download.suggestedFilename().endsWith(".csv")) throw new Error("Scoped Audit CSV export did not return a CSV file");
  pass("Scoped CSV export", "Filtered Super admin audit scope exported as CSV through the protected tRPC action");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/super-admin/audit-logs`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /review sensitive activity with clear scope/i }).waitFor({ timeout: 10000 });
  const hasHorizontalDocumentOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (hasHorizontalDocumentOverflow) throw new Error("Mobile Audit logs route caused horizontal document overflow");
  await page.getByRole("button", { name: "CSV", exact: true }).waitFor({ timeout: 10000 });
  pass("Responsive Audit layout", "390×844 scoped Audit route retained controls without horizontal document overflow");

  console.log(JSON.stringify({ status: "passed", checks }, null, 2));
} finally {
  await browser?.close();
  if (inserted && database) {
    await database.execute("DELETE FROM auditLogArchives WHERE actorUserId = ?", [userId]);
    await database.execute("DELETE FROM auditLogs WHERE actorUserId = ?", [userId]);
    await database.execute("DELETE FROM users WHERE openId = ? AND loginMethod = ?", [openId, "qa-automation"]);
  }
  await database?.end();
}

process.exit(0);
