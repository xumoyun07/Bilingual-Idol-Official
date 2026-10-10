/**
 * S3: e2e доказательство ролевой консоли.
 *
 * Фикстуры admin, marketing, teacher, student создаются через штатный код
 * приложения (createManagedUser) — пароль основателя не нужен; founder покрыт
 * юнит-тестами (server/console.test.ts). На каждый контекст своя запись,
 * все записи удаляются в finally, остаток проверяется запросом к БД (должен быть 0).
 *
 * Проверки: не-founder роль не видит "Founder"; admin не видит "User Accounts" и
 * "Audit & Security"; admin на /founder перенаправляется на /admin; в ms/ar ни одна
 * видимая подпись не остаётся английской (кроме бренда); скриншоты с печатью путей.
 * Любое несоответствие — exit 1.
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import { chromium, type Page } from "playwright";
import { eq } from "drizzle-orm";
import { createManagedUser, deleteManagedUser, getDb } from "../server/db";
import { users } from "../drizzle/schema";

const BASE = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const STEP = 20000;
const RUN_MS = 900000;
const ROLES = [
  { role: "admin", route: "/admin" },
  { role: "marketing", route: "/marketing" },
  { role: "teacher", route: "/teacher" },
  { role: "student", route: "/dashboard" },
] as const;
const VIEWPORTS = [
  { n: "1440", w: 1440, h: 900 },
  { n: "390", w: 390, h: 844 },
];
const LANGS = ["en", "ms", "ar"];
const started = Date.now();
let failures = 0;
function log(m: string) { console.log("[" + (Math.round((Date.now() - started) / 100) / 10) + "s] " + m); }
const kill = setTimeout(function () { log("ЖЁСТКИЙ ПРЕДЕЛ — выход"); process.exit(3); }, RUN_MS);
kill.unref();

async function evalJson<T>(page: Page, expr: string, label: string): Promise<T> {
  const raw: unknown = await page.evaluate(expr);
  if (typeof raw === "string") {
    try { return JSON.parse(raw) as T; } catch (error) { throw new Error(label + ": результат не JSON — " + (error instanceof Error ? error.message : String(error))); }
  }
  return raw as T;
}

const PROBE = [
  "(function(){",
  "var vis = function(el){ return !!(el && el.getBoundingClientRect().height > 0); };",
  "var header = document.querySelector('header.bilc-floating-header');",
  "var title = header ? header.querySelector('h1') : null;",
  "var sidebar = document.querySelector('.bilc-floating-sidebar');",
  "var panel = document.querySelector('[data-testid=mobile-shell-panel]');",
  "var container = vis(sidebar) ? sidebar : panel;",
  "var labels = [];",
  "if (container) {",
  "  var els = container.querySelectorAll('button, a, span, strong, h1, h2, h3, small');",
  "  for (var i=0;i<els.length;i++){ var tx=(els[i].textContent||'').replace(/\\s+/g,' ').trim(); if(tx.length>1 && tx.length<60) labels.push(tx); }",
  "}",
  "return JSON.stringify({ url: location.href, lang: document.documentElement.lang, dir: document.documentElement.dir,",
  "  headerTitle: title ? (title.textContent||'').replace(/\\s+/g,' ').trim() : null,",
  "  labels: labels, mobileHeader: !!document.querySelector('[data-testid=mobile-shell-trigger]') });",
  "})()",
].join("\n");

async function shot(page: Page, name: string) {
  const dir = "e2e/screenshots";
  fs.mkdirSync(dir, { recursive: true });
  const file = dir + "/" + name + ".png";
  await page.screenshot({ path: file });
  log("    скриншот: " + file + " (" + fs.statSync(file).size + " байт)");
}

const ENGLISH_MARKERS = ["Administrator Console", "Marketing Console", "Teacher Console", "Student Portal", "Founder Dashboard", "Verified Founder Session", "Active Module:", "User Accounts", "Audit & Security", "Platform & Governance"];

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/@db:/, "@127.0.0.1:3307:");
const db = await getDb();
if (!db) { log("НЕТ соединения с БД"); process.exit(1); }
const founder = (await db.select().from(users).where(eq(users.role, "founder")).limit(1))[0];
const created: number[] = [];
const browser = await chromium.launch();

try {
  for (const spec of ROLES) {
    for (const lang of LANGS) {
      for (const vp of VIEWPORTS) {
        const tag = spec.role + "@" + vp.n + "@" + lang;
        log("=== " + tag + " ===");
        const email = "console-" + spec.role + "-" + vp.n + "-" + randomBytes(4).toString("hex") + "@example.test";
        const password = "Diag-" + randomBytes(12).toString("base64url") + "!7";
        const made = (await createManagedUser(
          { email, name: "Diag " + spec.role, role: spec.role } as never,
          { id: founder.id, role: "founder" } as never,
        )) as unknown as { id?: number };
        if (made.id !== undefined) created.push(made.id);

        const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: vp.w < 768, hasTouch: vp.w < 768 });
        const page = await context.newPage();
        page.setDefaultTimeout(STEP);
        page.setDefaultNavigationTimeout(STEP);
        try {
          await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
          await page.fill("#sign-in-email", email);
          await page.fill("#sign-in-password", password);
          await page.click('button[type="submit"]');
          await page.waitForTimeout(2500);
          await page.evaluate("(function(l){try{localStorage.setItem('bilc_language',l);}catch(e){}document.cookie='bilc_language='+l+'; path=/';})(" + JSON.stringify(lang) + ")");
          await page.goto(BASE + spec.route, { waitUntil: "domcontentloaded" });
          await page.waitForTimeout(3500);

          const probe = await evalJson<any>(page, PROBE, tag + " probe");
          log("  url=" + probe.url + " lang=" + probe.lang + " dir=" + probe.dir);
          log("  заголовок: " + JSON.stringify(probe.headerTitle));
          log("  подписи оболочки: " + JSON.stringify(probe.labels.slice(0, 18)));

          const joined = (probe.labels.join(" ") + " " + (probe.headerTitle ?? "")).toLowerCase();
          if (spec.role !== "founder" && joined.indexOf("founder") >= 0) {
            log("  FAIL: роль " + spec.role + " видит слово Founder"); failures += 1;
          }
          if (spec.role === "admin" && (joined.indexOf("user accounts") >= 0 || joined.indexOf("audit") >= 0)) {
            log("  FAIL: admin видит User Accounts или Audit & Security"); failures += 1;
          }
          if (lang !== "en") {
            const english = ENGLISH_MARKERS.filter(m => joined.indexOf(m.toLowerCase()) >= 0);
            if (english.length) { log("  FAIL: английские подписи в " + lang + ": " + english.join(", ")); failures += 1; }
          }

          await shot(page, "console-" + tag);

          if (spec.role === "admin") {
            await page.goto(BASE + "/founder", { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(3000);
            const redirected = await evalJson<any>(page, "(function(){return JSON.stringify({url:location.href});})()", tag + " redirect");
            log("  /founder -> " + redirected.url);
            if (redirected.url.indexOf("/admin") < 0) { log("  FAIL: admin не перенаправлен с /founder на /admin"); failures += 1; }
          }
        } catch (error) {
          log("  ОШИБКА: " + (error instanceof Error ? error.message : String(error)));
          failures += 1;
        }
        await context.close();
      }
    }
  }
} catch (error) {
  log("ОСТАНОВ: " + (error instanceof Error ? error.message : String(error)));
  failures += 1;
} finally {
  await browser.close();
  let removed = 0;
  for (const id of created) { try { await deleteManagedUser(id, { id: founder.id, role: "founder" } as never); removed += 1; } catch { /* noop */ } }
  const all = await db.select().from(users);
  const left = all.filter(function (u) { return typeof u.email === "string" && u.email.indexOf("console-") === 0; });
  log("удалено: " + removed + " из " + created.length);
  log("ОСТАЛОСЬ временных записей в БД (запрос через модуль db приложения): " + left.length + " — должно быть 0");
  if (left.length > 0) failures += 1;
  log("провалов: " + failures);
  process.exit(failures > 0 ? 1 : 0);
}
