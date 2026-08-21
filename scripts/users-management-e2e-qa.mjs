import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import { chromium } from "@playwright/test";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const founderEmail = process.env.FOUNDER_QA_EMAIL;
const founderPassword = process.env.FOUNDER_QA_PASSWORD;
const databaseUrl = process.env.DATABASE_URL;
if (!founderEmail || !founderPassword || !databaseUrl) throw new Error("FOUNDER_QA_EMAIL, FOUNDER_QA_PASSWORD and DATABASE_URL are required");

const runId = randomUUID();
const qaEmail = `users-qa-${runId}@bilingualidol.invalid`;
const qaName = "Users QA Temporary";
const checks = [];
let browser;
let database;

function pass(name, detail) { checks.push({ name, status: "passed", detail }); }

try {
  database = await mysql.createConnection(databaseUrl);
  browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.locator("#founder-email").fill(founderEmail);
  await page.locator("#founder-password").fill(founderPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin", { timeout: 10000 });
  await page.goto(`${baseUrl}/admin/users`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /one clear view of every account/i }).waitFor({ timeout: 10000 });
  pass("Founder opens two-module Users console", "Founder session reached /admin/users");

  await page.getByRole("textbox", { name: "Full name" }).fill(qaName);
  await page.getByRole("textbox", { name: "E-mail" }).fill(qaEmail);
  await page.getByLabel("Role").last().selectOption("student");
  await page.getByRole("textbox", { name: "Initial password" }).fill("temporary-qa-password");
  await page.waitForTimeout(100);
  await page.locator("form").filter({ hasText: "Create user" }).evaluate(form => form.requestSubmit());
  await page.getByText(qaName, { exact: true }).first().waitFor({ timeout: 10000 });
  await page.getByTestId("users-editor-form").getByRole("button", { name: "Save changes" }).waitFor({ timeout: 10000 });
  pass("Create issued user", "Student account was created through Founder UI");

  await page.getByRole("textbox", { name: "Full name" }).fill("Users QA Marketing");
  await page.getByLabel("Role").last().selectOption("marketing");
  await page.getByLabel("Account active").uncheck();
  await page.waitForTimeout(100);
  await page.getByTestId("users-editor-form").evaluate(form => form.requestSubmit());
  await page.getByText("Users QA Marketing", { exact: true }).first().waitFor({ timeout: 10000 });
  await page.getByText("Paused", { exact: true }).first().waitFor({ timeout: 10000 });
  pass("Edit role and active status", "Temporary account changed to marketing and paused");

  const inactivePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await inactivePage.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await inactivePage.locator("#founder-email").fill(qaEmail);
  await inactivePage.locator("#founder-password").fill("temporary-qa-password");
  await inactivePage.getByRole("button", { name: "Sign in" }).click();
  await inactivePage.getByText("Invalid e-mail or password.", { exact: true }).waitFor({ timeout: 10000 });
  await inactivePage.close();
  pass("Deactivation blocks sign-in", "Paused account was rejected by universal password login");

  await page.getByPlaceholder("Search name, e-mail, ID or sign-in method").fill("Marketing");
  await page.getByText("1 account found", { exact: true }).waitFor({ timeout: 10000 });
  pass("Search directory", "Search returned the edited QA account only");

  await page.getByLabel("Role").first().selectOption("marketing");
  await page.getByLabel("Status").selectOption("inactive");
  await page.getByLabel("From").fill("2000-01-01");
  await page.getByText("1 account found", { exact: true }).waitFor({ timeout: 10000 });
  pass("Filter by role, status and registration date", "Marketing + inactive + date-from filter retained the QA account");

  await page.getByRole("button", { name: "Delete account" }).click({ force: true });
  const dialog = page.getByRole("alertdialog");
  await dialog.getByRole("heading", { name: "Delete this account?" }).waitFor({ timeout: 10000 });
  pass("Delete safeguard", "Confirmation dialog appeared before deletion");
  await dialog.getByRole("button", { name: "Delete account" }).click({ force: true });
  await page.getByText("No matching accounts", { exact: true }).waitFor({ timeout: 10000 });
  const [[row]] = await database.execute("SELECT COUNT(*) AS count FROM users WHERE email = ?", [qaEmail]);
  if (Number(row.count) !== 0) throw new Error("Deleted account remains in the database");
  pass("Delete account", "Confirmed deletion removed the temporary account from the database");
  await page.close();
} finally {
  if (database) await database.execute("DELETE FROM users WHERE email = ?", [qaEmail]);
  await database?.end();
  await browser?.close();
}

console.log(JSON.stringify({ status: "passed", checks, cleanupVerified: true }, null, 2));
process.exit(0);
