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
  await page.getByRole("heading", { name: /people, organised by responsibility/i }).waitFor({ timeout: 10000 });
  pass("Founder opens role-separated Users console", "Founder session reached /admin/users");

  const modules = page.locator('nav[aria-label="User type modules"]');
  for (const role of ["Students", "Teachers", "Marketing", "Admins", "Super admins", "Founders"]) {
    await modules.getByRole("button", { name: `Type ${role}`, exact: true }).click();
    await page.getByRole("heading", { name: new RegExp(`${role} directory`, "i") }).waitFor({ timeout: 10000 });
  }
  await modules.getByRole("button", { name: "Type Students", exact: true }).click();
  pass("Role mini-navigation", "All six user type modules opened their own directory surface");

  await page.getByRole("button", { name: "New user" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("heading", { name: "Create user" }).waitFor({ timeout: 10000 });
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden", timeout: 10000 });
  pass("Modal keyboard lifecycle", "Create modal closed with Escape and did not create data");
  await page.getByRole("button", { name: "New user" }).click();
  await dialog.getByRole("heading", { name: "Create user" }).waitFor({ timeout: 10000 });
  await dialog.getByRole("textbox", { name: "Full name" }).fill(qaName);
  await dialog.getByRole("textbox", { name: "E-mail" }).fill(qaEmail);
  await dialog.getByLabel("User type").selectOption("student");
  await dialog.getByRole("textbox", { name: "Initial password" }).fill("temporary-qa-password");
  await page.waitForTimeout(100);
  await dialog.getByTestId("users-modal-form").evaluate(form => form.requestSubmit());
  await dialog.getByRole("heading", { name: "Edit user" }).waitFor({ timeout: 10000 });
  await page.getByText(qaName, { exact: true }).first().waitFor({ timeout: 10000 });
  pass("Modal create user", "Student account was created through the focused create modal");

  await dialog.getByRole("textbox", { name: "Full name" }).fill("Users QA Marketing");
  await dialog.getByLabel("User type").selectOption("marketing");
  await dialog.getByLabel("Account active").uncheck();
  await page.waitForTimeout(100);
  await dialog.getByTestId("users-modal-form").evaluate(form => form.requestSubmit());
  await page.getByText("Users QA Marketing", { exact: true }).first().waitFor({ timeout: 10000 });
  await page.getByText("Paused", { exact: true }).first().waitFor({ timeout: 10000 });
  pass("Modal edit role and active status", "Temporary account moved to Marketing and was paused");

  const inactivePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await inactivePage.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await inactivePage.locator("#founder-email").fill(qaEmail);
  await inactivePage.locator("#founder-password").fill("temporary-qa-password");
  await inactivePage.getByRole("button", { name: "Sign in" }).click();
  await inactivePage.getByText("Invalid e-mail or password.", { exact: true }).waitFor({ timeout: 10000 });
  await inactivePage.close();
  pass("Deactivation blocks sign-in", "Paused account was rejected by universal password login");

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await modules.getByRole("button", { name: "Type Marketing", exact: true }).click();
  await page.getByPlaceholder(/Search marketing/i).fill("Marketing");
  await page.getByText("1 account in this type", { exact: true }).waitFor({ timeout: 10000 });
  pass("Role-specific local search", "Marketing module returned the edited account only");

  await page.getByLabel("Status").selectOption("inactive");
  await page.getByLabel("From").fill("2000-01-01");
  await page.getByText("1 account in this type", { exact: true }).waitFor({ timeout: 10000 });
  pass("Role-specific filters", "Marketing status and registration-date filters retained the QA account");

  await page.getByText("Users QA Marketing", { exact: true }).click();
  await dialog.getByRole("heading", { name: "Edit user" }).waitFor({ timeout: 10000 });
  await dialog.getByRole("button", { name: "Delete account" }).click({ force: true });
  const confirmation = page.getByRole("alertdialog");
  await confirmation.getByRole("heading", { name: "Delete this account?" }).waitFor({ timeout: 10000 });
  pass("Modal delete safeguard", "Destructive action required a separate confirmation dialog");
  await confirmation.getByRole("button", { name: "Delete account" }).click({ force: true });
  await page.getByText("No marketing yet", { exact: true }).waitFor({ timeout: 10000 });
  const [[row]] = await database.execute("SELECT COUNT(*) AS count FROM users WHERE email = ?", [qaEmail]);
  if (Number(row.count) !== 0) throw new Error("Deleted account remains in the database");
  pass("Modal delete account", "Confirmed deletion removed the temporary account from the database");
  await page.close();
} finally {
  if (database) await database.execute("DELETE FROM users WHERE email = ?", [qaEmail]);
  await database?.end();
  await browser?.close();
}

console.log(JSON.stringify({ status: "passed", checks, cleanupVerified: true }, null, 2));
process.exit(0);
