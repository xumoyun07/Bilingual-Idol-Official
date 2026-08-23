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
const marker = `pagination-qa-${runId}`;

function pass(name, detail) { checks.push({ name, status: "passed", detail }); }

try {
  database = await mysql.createConnection(databaseUrl);
  const [insertResult] = await database.execute(
    "INSERT INTO users (openId, name, email, passwordHash, isActive, loginMethod, role, createdAt, updatedAt, lastSignedIn) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())",
    [openId, "Audit Super admin QA", email, passwordHash, true, "qa-automation", "super_admin"],
  );
  userId = Number(insertResult.insertId);
  inserted = true;
  const paginationRows = [
    ["solo", 1],
    ...Array.from({ length: 10 }, (_, index) => ["exact", index + 1]),
    ...Array.from({ length: 11 }, (_, index) => ["many", index + 1]),
  ];
  for (const [bucket, sequence] of paginationRows) {
    await database.execute(
      "INSERT INTO auditLogs (actorUserId, actorRole, action, targetType, targetId, targetRole, description, isSuccess, ipAddress, browser, operatingSystem, userAgent, metadataJson, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
      [userId, "super_admin", "audit.pagination_qa", "audit_log", `${bucket}-${sequence}`, null, `${marker}-${bucket}-${sequence}`, true, "127.0.0.1", "QA Browser", "Linux", "pagination-qa", "{}"],
    );
  }
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
  const cards = page.getByTestId("audit-log-card");
  await cards.first().waitFor({ timeout: 10000 });
  const cardsText = (await cards.allTextContents()).join(" ").toLowerCase();
  if (cardsText.includes("founder")) throw new Error("Super admin scoped audit cards leaked Founder activity");
  if (cardsText.includes("private workspace")) throw new Error("Super admin scoped audit cards leaked private-control activity");
  const hasDesktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (hasDesktopOverflow) throw new Error("Desktop Audit logs route caused horizontal document overflow");
  pass("Scoped Audit data", "Reloaded scoped list uses complete responsive event cards with no Founder/private activity or horizontal overflow");

  if (await cards.count() !== 10) throw new Error(`Expected exactly 10 Audit records on the first page, received ${await cards.count()}`);
  await page.getByText(/Page 1 of [3-9]/, { exact: false }).waitFor({ timeout: 10000 });
  if (!await page.getByRole("button", { name: "Previous", exact: true }).isDisabled()) throw new Error("Previous was enabled on the first Audit page");
  if (await page.getByRole("button", { name: "Next", exact: true }).isDisabled()) throw new Error("Next was disabled despite more than 10 Audit records");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByText(/Page 2 of [3-9]/, { exact: false }).waitFor({ timeout: 10000 });
  if (await cards.count() !== 10) throw new Error(`Expected exactly 10 Audit records on page two, received ${await cards.count()}`);
  if (await page.getByRole("button", { name: "Previous", exact: true }).isDisabled()) throw new Error("Previous remained disabled on page two");
  await page.getByRole("button", { name: "Page 2, current page", exact: true }).waitFor({ timeout: 10000 });
  pass("Ten-record paginated list", "More than 10 matching records render as pages of exactly 10 cards with current page indicator and boundary-aware navigation");

  const search = page.getByPlaceholder("Search ID, description, IP, browser, action or object");
  await search.fill(`${marker}-solo-1`);
  await page.getByText("Page 1 of 1", { exact: true }).waitFor({ timeout: 10000 });
  if (await cards.count() !== 1) throw new Error("Filtered under-ten Audit list did not return exactly one record");
  if (!await page.getByRole("button", { name: "Previous", exact: true }).isDisabled() || !await page.getByRole("button", { name: "Next", exact: true }).isDisabled()) throw new Error("Boundary controls were enabled for a single filtered page");
  pass("Filtered under-ten reset", "Changing the query from page two reset Audit pagination to page one and disabled both boundaries for a one-record result");

  await search.fill(`${marker}-exact`);
  await page.getByText("Page 1 of 1", { exact: true }).waitFor({ timeout: 10000 });
  if (await cards.count() !== 10) throw new Error(`Exactly-ten filtered Audit list returned ${await cards.count()} records instead of 10`);
  if (!await page.getByRole("button", { name: "Previous", exact: true }).isDisabled() || !await page.getByRole("button", { name: "Next", exact: true }).isDisabled()) throw new Error("Boundary controls were enabled for an exactly-ten single page");
  pass("Exactly-ten filtered page", "A 10-record filtered result remained on one page with both navigation boundaries disabled");

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
