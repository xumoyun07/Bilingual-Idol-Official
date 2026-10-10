import "dotenv/config";
import { randomBytes } from "node:crypto";
import { chromium } from "playwright";
import { eq } from "drizzle-orm";
import { createManagedUser, deleteManagedUser, getDb } from "../server/db";
import { users } from "../drizzle/schema";

const BASE = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const STEP_MS = 20000;
const RUN_MS = 180000;
const ONLY = process.env.ONLY || "";
const started = Date.now();
function t0() { return "[" + (Math.round((Date.now() - started) / 100) / 10) + "s]"; }
function log(m: string) { console.log(t0() + " " + m); }
const deadline = setTimeout(function () { console.log(t0() + " ЖЁСТКИЙ ПРЕДЕЛ 3 МИНУТЫ — аварийный выход"); process.exit(3); }, RUN_MS);
deadline.unref();

const ALL = [{ n: "1440", w: 1440, h: 900 }, { n: "390", w: 390, h: 844 }];
const VIEWPORTS = ONLY ? ALL.filter(function (v) { return v.n === ONLY; }) : ALL;
const LANGS = (process.env.LANGS || "en,ar").split(",");

const PROBE = [
  "(function(){",
  "var box = function(el){ if(!el) return null; var b = el.getBoundingClientRect();",
  "  return { top: Math.round(b.top*100)/100, bottom: Math.round(b.bottom*100)/100, h: Math.round(b.height*100)/100 }; };",
  "var tb = document.querySelector('header.bilc-floating-header');",
  "var sb = document.querySelector('.bilc-floating-sidebar');",
  "var main = document.querySelector('main');",
  "var col = document.querySelector('.bilc-content-column');",
  "var inset = document.querySelector('.minimal-dashboard-inset');",
  "var scrollables = [];",
  "document.querySelectorAll('*').forEach(function(e){ var cs = getComputedStyle(e); var oy = cs.overflowY;",
  "  if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && e.scrollHeight > e.clientHeight + 1)",
  "    scrollables.push(e.tagName.toLowerCase() + ':+' + (e.scrollHeight - e.clientHeight)); });",
  "var de = document.scrollingElement; var docScroll = !!(de && de.scrollHeight > de.clientHeight + 1);",
  "var first = main ? main.firstElementChild : null;",
  "return { tbTop: tb ? box(tb).top : null, tbBottom: tb ? box(tb).bottom : null, sbTop: sb ? box(sb).top : null,",
  "  sbBottomGap: sb ? Math.round((window.innerHeight - box(sb).bottom)*100)/100 : null,",
  "  colTop: col ? box(col).top : null, insetH: inset ? box(inset).h : null, mainH: main ? box(main).h : null,",
  "  firstBlockTop: first ? box(first).top : null,",
  "  scrollables: scrollables, docScroll: docScroll, vh: window.innerHeight, dir: document.documentElement.dir,",
  "  htmlScroll: document.documentElement.scrollHeight - document.documentElement.clientHeight,",
  "  bodyScroll: document.body.scrollHeight - document.body.clientHeight,",
  "  bodyOvY: getComputedStyle(document.body).overflowY, bodyH: getComputedStyle(document.body).height, bodyMinH: getComputedStyle(document.body).minHeight,",
  "  sbOvY: sb ? getComputedStyle(sb).overflowY : null, sbH: sb ? getComputedStyle(sb).height : null,",
  "  docScrollBehavior: getComputedStyle(document.documentElement).scrollBehavior, scrollPadTop: getComputedStyle(document.documentElement).scrollPaddingTop,",
  "  mainPadTop: main ? getComputedStyle(main).paddingTop : null, colPadTop: col ? getComputedStyle(col).paddingTop : null,",
  "  mainMinH: main ? getComputedStyle(main).minHeight : null, colMinH: col ? getComputedStyle(col).minHeight : null,",
  "  headerVar: getComputedStyle(document.documentElement).getPropertyValue('--shell-header-h') };",
  "})()",
].join("\n");

async function withTimeout<T>(label: string, promise: Promise<T>, ms?: number): Promise<T> {
  const limit = ms || STEP_MS;
  let timer: NodeJS.Timeout | undefined;
  const guard = new Promise<never>(function (_resolve, reject) {
    timer = setTimeout(function () { reject(new Error("ТАЙМАУТ " + limit + "ms на шаге: " + label)); }, limit);
  });
  try { return await Promise.race([promise, guard]); } finally { if (timer) clearTimeout(timer); }
}

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/@db:/, "@127.0.0.1:3307:");
log("подключение к БД…");
const db = await getDb();
if (!db) { log("НЕТ соединения с БД"); process.exit(1); }
const founder = (await db.select().from(users).where(eq(users.role, "founder")).limit(1))[0];
log("основатель найден: " + Boolean(founder));

const browser = await chromium.launch();
const created: number[] = [];
const rows: string[] = [];
try {
  for (const lang of LANGS) {
    for (const vp of VIEWPORTS) {
      const tag = lang + "@" + vp.n;
      log(tag + ": создаю временную запись…");
      const email = "shell-" + lang + "-" + vp.n + "-" + randomBytes(4).toString("hex") + "@example.test";
      const password = "Diag-" + randomBytes(12).toString("base64url") + "!7";
      const made = (await withTimeout(tag + " createManagedUser", createManagedUser(
        { email: email, name: "Diag " + tag, role: "admin", password: password } as never,
        { id: founder.id, role: "founder" } as never,
      ) as never)) as { user?: { id: number }; id?: number };
      const id = made.user ? made.user.id : made.id;
      if (id) created.push(id);
      log(tag + ": запись " + (id ? "создана" : "НЕ создана"));

      const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
      const page = await context.newPage();
      page.setDefaultTimeout(STEP_MS);
      page.setDefaultNavigationTimeout(STEP_MS);
      log(tag + ": открываю /login");
      await withTimeout(tag + " goto login", page.goto(BASE + "/login", { waitUntil: "domcontentloaded" }));
      await withTimeout(tag + " fill email", page.fill("#sign-in-email", email));
      await withTimeout(tag + " fill password", page.fill("#sign-in-password", password));
      log(tag + ": отправляю форму");
      await withTimeout(tag + " submit", page.click('button[type="submit"]'));
      await page.waitForTimeout(2500);
      log(tag + ": язык " + lang + ", url после входа = " + page.url());
      await page.evaluate(function (l) { try { localStorage.setItem("bilc_language", l); } catch (e) { /* noop */ } document.cookie = "bilc_language=" + l + "; path=/"; }, lang);
      await withTimeout(tag + " goto /dashboard", page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded" }));
      await page.waitForTimeout(3000);
      log(tag + ": измеряю (url=" + page.url() + ")");
      const r = (await withTimeout(tag + " probe", page.evaluate(PROBE) as never)) as Record<string, unknown>;
      rows.push("---- " + tag + " dir=" + r.dir + " vh=" + r.vh + " " + page.url());
      rows.push("  сайдбар top=" + r.sbTop + "  зазор снизу=" + r.sbBottomGap + "  высота=" + r.sbH + " overflowY=" + r.sbOvY);
      rows.push("  топбар top=" + r.tbTop + " bottom=" + r.tbBottom + "  content-column top=" + r.colTop + "  первый блок top=" + r.firstBlockTop);
      rows.push("  insetH=" + r.insetH + " mainH=" + r.mainH + " mainMinH=" + r.mainMinH + " colMinH=" + r.colMinH + " mainPadTop=" + r.mainPadTop + " colPadTop=" + r.colPadTop);
      rows.push("  --shell-header-h=" + String(r.headerVar).trim() + "  scrollPaddingTop=" + r.scrollPadTop + "  scrollBehavior=" + r.docScrollBehavior);
      rows.push("  html.scroll=" + r.htmlScroll + " body.scroll=" + r.bodyScroll + " body.overflowY=" + r.bodyOvY + " body.height=" + r.bodyH + " body.minHeight=" + r.bodyMinH);
      rows.push("  ПРОКРУЧИВАЕМЫЕ=" + JSON.stringify(r.scrollables) + "  documentScroller=" + r.docScroll);
      if (process.env.SHOT) {
        await page.evaluate(function () {
          var tall = document.createElement("div");
          tall.id = "shell-diag-tall";
          tall.style.height = "2600px";
          tall.style.background = "repeating-linear-gradient(180deg,#eef2ff 0 40px,#ffffff 40px 80px)";
          if (document.body) document.body.appendChild(tall);
        });
        await page.waitForTimeout(700);
        var fs = await import("node:fs");
        if (!fs.existsSync("e2e/screenshots")) fs.mkdirSync("e2e/screenshots", { recursive: true });
        await page.screenshot({ path: "e2e/screenshots/item2-" + tag + ".png" });
        log(tag + ": скриншот сохранён");
      }
      await context.close();
      log(tag + ": готово");
    }
  }
} catch (error) {
  log("ОШИБКА: " + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
} finally {
  await browser.close();
  let removed = 0;
  for (const id of created) { try { await deleteManagedUser(id, { id: founder.id, role: "founder" } as never); removed += 1; } catch (e) { /* noop */ } }
  log("очистка: удалено " + removed + " из " + created.length);
  console.log("\n================ РЕЗУЛЬТАТ ================");
  for (const line of rows) console.log(line);
  console.log("\nвремя " + Math.round((Date.now() - started) / 1000) + "s");
  process.exit(process.exitCode ? 1 : 0);
}