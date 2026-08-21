import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { chromium } from "@playwright/test";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const evidenceDir = process.env.QA_EVIDENCE_DIR ?? "/home/ubuntu/webdev-static-assets/bilingual-idol-responsive-evidence";
const accountId = randomUUID();
const email = `qa-responsive-${accountId}@bilingualidol.invalid`;
const openId = `qa-responsive-${accountId}`;
const password = randomBytes(24).toString("base64url");
const salt = randomBytes(16).toString("hex");
const passwordHash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
const viewports = [[360, 640], [390, 844], [412, 915], [768, 1024], [1024, 1366], [1366, 768], [1920, 1080], [3840, 2160]];
const checks = [];
const orientationChecks = [];
let browser;
let connection;
let inserted = false;
let result;

try {
  await mkdir(evidenceDir, { recursive: true });
  connection = await mysql.createConnection(databaseUrl);
  await connection.execute(
    "INSERT INTO users (openId, name, email, passwordHash, isActive, loginMethod, role, createdAt, updatedAt, lastSignedIn) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())",
    [openId, "Responsive QA User", email, passwordHash, true, "qa-automation", "user"],
  );
  inserted = true;

  browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.locator("#sign-in-email").fill(email);
  await page.locator("#sign-in-password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard", { timeout: 10000 });
  await page.getByRole("heading", { name: "Welcome back, Responsive QA User." }).waitFor({ timeout: 10000 });

  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Welcome back, Responsive QA User." }).waitFor({ timeout: 10000 });
    const audit = await page.evaluate(() => {
      const interactive = [...document.querySelectorAll("a[href], button")]
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return { label: element.textContent?.trim() ?? "", width: rect.width, height: rect.height };
        });
      return {
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        viewportWidth: window.innerWidth,
        interactive,
      };
    });
    const overflow = Math.max(audit.documentWidth, audit.bodyWidth) - audit.viewportWidth;
    const undersized = audit.interactive.filter((target) => target.height < 47.5);
    const result = { viewport: `${width}×${height}`, overflow, undersized };
    checks.push(result);
    if (overflow > 1 || undersized.length) throw new Error(`Dashboard responsive QA failed at ${result.viewport}: ${JSON.stringify(result)}`);
    if (width === 390 || width === 1366) await page.screenshot({ path: path.join(evidenceDir, `user-dashboard-${width}x${height}.png`), fullPage: true });
  }

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Welcome back, Responsive QA User." }).waitFor({ timeout: 10000 });
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(150);
  const orientation = await page.evaluate(() => {
    const card = document.querySelector(".compass-card")?.getBoundingClientRect();
    return {
      from: "768×1024",
      to: `${window.innerWidth}×${window.innerHeight}`,
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
      cardInsideViewport: Boolean(card && card.left >= 0 && card.right <= window.innerWidth && card.top >= 0),
    };
  });
  orientationChecks.push(orientation);
  if (orientation.overflow > 1 || !orientation.cardInsideViewport) throw new Error(`Dashboard orientation QA failed: ${JSON.stringify(orientation)}`);

  await page.goto(`${baseUrl}/admin`, { waitUntil: "networkidle" });
  await page.waitForURL("**/dashboard", { timeout: 10000 });
  await page.getByRole("heading", { name: "Welcome back, Responsive QA User." }).waitFor({ timeout: 10000 });
  const denialUrl = new URL(page.url()).pathname;
  if (denialUrl !== "/dashboard") throw new Error(`Expected private /admin redirect to dashboard, received ${denialUrl}`);
  if (await page.getByText("Founder", { exact: true }).count()) throw new Error("Non-Founder dashboard disclosed Founder identity");

  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Welcome back, Responsive QA User." }).waitFor({ timeout: 10000 });
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("**/login", { timeout: 10000 });
  await page.close();
  result = { status: "passed", dashboardChecks: checks, orientationChecks, adminDeniedAt: denialUrl };
} finally {
  await browser?.close();
  if (inserted && connection) {
    await connection.execute("DELETE FROM users WHERE openId = ? AND loginMethod = ?", [openId, "qa-automation"]);
  }
  await connection?.end();
}

if (result) console.log(JSON.stringify({ ...result, cleanupVerified: true }, null, 2));
process.exit(0);
