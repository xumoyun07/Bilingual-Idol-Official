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
const qaSectionTitle = `QA profile ${runId.slice(0, 8)}`;
const qaFieldLabel = `QA learning level ${runId.slice(0, 8)}`;
const qaFieldTwoLabel = `QA learning preference ${runId.slice(0, 8)}`;
const qaFieldValue = "Advanced";
const checks = [];
let browser;
let database;
let qaUserId;
let qaFieldId;
let qaFieldTwoId;
let qaFieldKey;
let qaFieldTwoKey;
let qaSectionId;
function pass(name, detail) { checks.push({ name, status: "passed", detail }); }

try {
  database = await mysql.createConnection(databaseUrl);
  browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.locator("#sign-in-email").fill(founderEmail);
  await page.locator("#sign-in-password").fill(founderPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin", { timeout: 10000 });
  await page.goto(`${baseUrl}/admin/users`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /people, organised by responsibility/i }).waitFor({ timeout: 10000 });
  pass("Private account opens role-separated Users console", "Private control session reached /admin/users");

  const modules = page.locator('nav[aria-label="User type modules"]');
  for (const role of ["Students", "Teachers", "Marketing", "Admins", "Super admins"]) {
    await modules.getByRole("button", { name: `Type ${role}`, exact: true }).click();
    await page.getByRole("heading", { name: new RegExp(`${role} directory`, "i") }).waitFor({ timeout: 10000 });
  }
  await modules.getByRole("button", { name: "Type Students", exact: true }).click();
  pass("Role mini-navigation", "All five visible user type modules opened their own directory surface");

  await page.getByRole("button", { name: "Configure create form" }).click();
  const builder = page.getByRole("dialog");
  await builder.getByRole("heading", { name: "Field Builder" }).waitFor({ timeout: 10000 });
  await builder.locator("#section-title").fill(qaSectionTitle);
  await builder.getByRole("button", { name: "Add group" }).click();
  await builder.locator("span").filter({ hasText: qaSectionTitle }).first().waitFor({ timeout: 10000 });
  await builder.getByRole("textbox", { name: "Label", exact: true }).fill(qaFieldLabel);
  await builder.locator('select:has(option[value="dropdown"])').selectOption("dropdown");
  await builder.getByRole("textbox", { name: /options/i }).fill("Beginner\nAdvanced");
  await builder.locator("select").last().selectOption({ label: qaSectionTitle });
  await builder.getByLabel("Required field").check();
  await builder.getByRole("button", { name: "Create field" }).click();
  await builder.locator("p").filter({ hasText: qaFieldLabel }).first().waitFor({ timeout: 10000 });
  const [[sectionRow]] = await database.execute("SELECT id FROM userFormSections WHERE title = ?", [qaSectionTitle]);
  const [[fieldRow]] = await database.execute("SELECT id, `key` FROM userFormFields WHERE label = ?", [qaFieldLabel]);
  qaSectionId = Number(sectionRow.id);
  qaFieldId = Number(fieldRow.id);
  qaFieldKey = String(fieldRow.key);
  if (!qaSectionId || !qaFieldId) throw new Error("Field Builder metadata was not persisted");
  await builder.getByRole("textbox", { name: "Label", exact: true }).fill(qaFieldTwoLabel);
  await builder.locator("select").last().selectOption({ label: qaSectionTitle });
  await builder.getByRole("button", { name: "Create field" }).click();
  await builder.locator("p").filter({ hasText: qaFieldTwoLabel }).first().waitFor({ timeout: 10000 });
  const [[fieldTwoRow]] = await database.execute("SELECT id, `key` FROM userFormFields WHERE label = ?", [qaFieldTwoLabel]);
  qaFieldTwoId = Number(fieldTwoRow.id);
  qaFieldTwoKey = String(fieldTwoRow.key);
  if (!qaFieldTwoId) throw new Error("Second Field Builder metadata field was not persisted");
  pass("Field Builder schema configuration", "Temporary group and two editable fields were created through the modal builder");
  const fieldTwoCard = builder.locator('[draggable="true"]').filter({ hasText: qaFieldTwoLabel });
  const fieldOneCard = builder.locator('[draggable="true"]').filter({ hasText: qaFieldLabel });
  await fieldTwoCard.dragTo(fieldOneCard);
  let dragOrderPersisted = false;
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const [orderedFieldRows] = await database.execute("SELECT label FROM userFormFields WHERE id IN (?, ?) ORDER BY sortOrder ASC", [qaFieldId, qaFieldTwoId]);
    if (orderedFieldRows.map(row => row.label).join("|") === `${qaFieldTwoLabel}|${qaFieldLabel}`) { dragOrderPersisted = true; break; }
    await page.waitForTimeout(200);
  }
  if (!dragOrderPersisted) throw new Error("Drag-and-drop field order was not persisted");
  pass("Field Builder drag-and-drop ordering", "Dragging a profile field saved its new sortOrder on the server");
  await builder.getByRole("button", { name: "Done" }).click();
  await builder.waitFor({ state: "hidden", timeout: 10000 });

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
  const runtimeKeys = await dialog.locator("[data-profile-field-key]").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-profile-field-key")));
  if (runtimeKeys.findIndex(key => key === qaFieldTwoKey) > runtimeKeys.findIndex(key => key === qaFieldKey)) throw new Error("Create form did not use persisted dynamic field order");
  const runtimeFields = dialog.locator("[data-profile-field-key]");
  for (let index = 0; index < await runtimeFields.count(); index += 1) {
    const field = runtimeFields.nth(index);
    if (await field.getAttribute("data-profile-field-key") === qaFieldKey) continue;
    const select = field.locator("select");
    const textarea = field.locator("textarea");
    const checkbox = field.locator('input[type="checkbox"]');
    const input = field.locator("input").first();
    if (await select.count()) { if (await select.locator("option").count() > 1) await select.selectOption({ index: 1 }); }
    else if (await checkbox.count()) await checkbox.check();
    else if (await textarea.count()) await textarea.fill("Temporary QA value");
    else if (await input.count()) { const type = await input.getAttribute("type"); await input.fill(type === "date" ? "2026-01-02" : type === "number" ? "1" : "Temporary QA value"); }
  }
  await dialog.getByLabel(qaFieldLabel).selectOption(qaFieldValue);
  await page.waitForTimeout(100);
  await dialog.getByTestId("users-modal-form").evaluate(form => form.requestSubmit());
  await dialog.getByRole("heading", { name: "Edit user" }).waitFor({ timeout: 10000 });
  await page.getByText(qaName, { exact: true }).first().waitFor({ timeout: 10000 });
  const [[userRow]] = await database.execute("SELECT id FROM users WHERE email = ?", [qaEmail]);
  qaUserId = Number(userRow.id);
  const memberPage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await memberPage.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await memberPage.locator("#sign-in-email").fill(qaEmail);
  await memberPage.locator("#sign-in-password").fill("temporary-qa-password");
  await memberPage.getByRole("button", { name: "Sign in" }).click();
  await memberPage.waitForURL("**/dashboard", { timeout: 10000 });
  await memberPage.goto(`${baseUrl}/admin/users`, { waitUntil: "networkidle" });
  await memberPage.waitForURL("**/dashboard", { timeout: 10000 });
  if (await memberPage.getByText("Founder", { exact: true }).count()) throw new Error("Non-Founder private dashboard disclosed Founder identity");
  await memberPage.close();
  pass("Private console isolation", "A regular account was redirected from /admin/users to its dashboard without Founder disclosure");
  const [[profileRow]] = await database.execute("SELECT value FROM userProfileValues WHERE userId = ? AND fieldId = ?", [qaUserId, qaFieldId]);
  if (profileRow.value !== qaFieldValue) throw new Error("Dynamic profile value was not persisted with the created account");
  pass("Modal create user", "Student account was created through the focused create modal");
  pass("EAV profile persistence", "Required dropdown value was server-validated and stored against the temporary user");

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
  await inactivePage.locator("#sign-in-email").fill(qaEmail);
  await inactivePage.locator("#sign-in-password").fill("temporary-qa-password");
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

  const [[profileCount]] = await database.execute("SELECT COUNT(*) AS count FROM userProfileValues WHERE userId = ?", [qaUserId]);
  if (Number(profileCount.count) !== 0) throw new Error("Deleted account retained dynamic profile values");
  pass("Dynamic profile cleanup", "Account deletion removed its EAV profile values in the same managed workflow");

  await page.getByRole("button", { name: "Configure create form" }).click();
  await builder.getByRole("heading", { name: "Field Builder" }).waitFor({ timeout: 10000 });
  await builder.getByRole("button", { name: `Delete ${qaFieldTwoLabel}` }).click();
  const fieldTwoConfirmation = page.getByRole("alertdialog");
  await fieldTwoConfirmation.getByRole("button", { name: "Delete field" }).click({ force: true });
  await builder.getByRole("button", { name: `Delete ${qaFieldTwoLabel}` }).waitFor({ state: "detached", timeout: 10000 });
  await builder.getByRole("button", { name: `Delete ${qaFieldLabel}` }).click();
  const fieldConfirmation = page.getByRole("alertdialog");
  await fieldConfirmation.getByRole("button", { name: "Delete field" }).click({ force: true });
  await builder.getByRole("button", { name: `Delete ${qaFieldLabel}` }).waitFor({ state: "detached", timeout: 10000 });
  await builder.getByRole("button", { name: `Remove ${qaSectionTitle}` }).click();
  const sectionConfirmation = page.getByRole("alertdialog");
  await sectionConfirmation.getByRole("button", { name: "Remove section" }).click({ force: true });
  await builder.getByRole("button", { name: `Remove ${qaSectionTitle}` }).waitFor({ state: "detached", timeout: 10000 });
  const [[fieldCount]] = await database.execute("SELECT COUNT(*) AS count FROM userFormFields WHERE id IN (?, ?)", [qaFieldId, qaFieldTwoId]);
  const [[sectionCount]] = await database.execute("SELECT COUNT(*) AS count FROM userFormSections WHERE id = ?", [qaSectionId]);
  if (Number(fieldCount.count) !== 0 || Number(sectionCount.count) !== 0) throw new Error("Temporary Field Builder metadata cleanup was incomplete");
  pass("Self-cleaning Field Builder QA", "Temporary field and section were removed after EAV workflow verification");
  await page.close();
} finally {
  if (database) {
    if (qaUserId) await database.execute("DELETE FROM userProfileValues WHERE userId = ?", [qaUserId]);
    if (qaFieldId) await database.execute("DELETE FROM userProfileValues WHERE fieldId = ?", [qaFieldId]);
    if (qaFieldTwoId) await database.execute("DELETE FROM userProfileValues WHERE fieldId = ?", [qaFieldTwoId]);
    await database.execute("DELETE FROM users WHERE email = ?", [qaEmail]);
    if (qaFieldId) await database.execute("DELETE FROM userFormFields WHERE id = ?", [qaFieldId]);
    if (qaFieldTwoId) await database.execute("DELETE FROM userFormFields WHERE id = ?", [qaFieldTwoId]);
    if (qaSectionId) await database.execute("DELETE FROM userFormSections WHERE id = ?", [qaSectionId]);
    await database.execute("DELETE FROM userFormFields WHERE label = ?", [qaFieldLabel]);
    await database.execute("DELETE FROM userFormFields WHERE label = ?", [qaFieldTwoLabel]);
    await database.execute("DELETE FROM userFormSections WHERE title = ?", [qaSectionTitle]);
  }
  await database?.end();
  await browser?.close();
}

console.log(JSON.stringify({ status: "passed", checks, cleanupVerified: true }, null, 2));
process.exit(0);
