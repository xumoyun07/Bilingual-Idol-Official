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
const deadline = setTimeout(function () { console.log(t0() + " ЖЁСТКИЙ ПРЕДЕЛ — выход"); process.exit(3); }, RUN_MS);
deadline.unref();

const ALL = [{ n: "1440", w: 1440, h: 900 }, { n: "412", w: 412, h: 915 }, { n: "390", w: 390, h: 844 }, { n: "360", w: 360, h: 800 }];
const VIEWPORTS = ONLY ? ALL.filter(function (v) { return v.n === ONLY; }) : ALL;
const LANGS = (process.env.LANGS || "en,ar").split(",");

const PROBE = [
  "(function(){",
  "var box = function(el){ if(!el) return null; var b = el.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, h: b.height }; };",
  "var rr = function(v){ return (v === null || v === undefined) ? null : Math.round(v*100)/100; };",
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
  "var sbb = sb ? box(sb) : null; var tbb = tb ? box(tb) : null;",
  "return { tbTop: tbb ? rr(tbb.top) : null, tbBottom: tbb ? rr(tbb.bottom) : null,",
  "  tbTopRaw: tbb ? tbb.top : null, sbTopRaw: sbb ? sbb.top : null, sbBottomRaw: sbb ? sbb.bottom : null,",
  "  sbTop: sbb ? rr(sbb.top) : null, sbBottomGap: sbb ? rr(window.innerHeight - sbb.bottom) : null,",
  "  colTop: col ? rr(box(col).top) : null, insetH: inset ? rr(box(inset).h) : null, mainH: main ? rr(box(main).h) : null,",
  "  firstBlockTop: first ? rr(box(first).top) : null,",
  "  scrollY: window.scrollY, remPx: getComputedStyle(document.documentElement).fontSize,",
  "  htmlClientH: document.documentElement.clientHeight, innerH: window.innerHeight,",
  "  scrollables: scrollables, docScroll: docScroll, dir: document.documentElement.dir,",
  "  htmlScroll: document.documentElement.scrollHeight - document.documentElement.clientHeight,",
  "  bodyScroll: document.body.scrollHeight - document.body.clientHeight,",
  "  bodyOvY: getComputedStyle(document.body).overflowY, bodyH: getComputedStyle(document.body).height, bodyMinH: getComputedStyle(document.body).minHeight,",
  "  sbOvY: sb ? getComputedStyle(sb).overflowY : null, sbH: sb ? getComputedStyle(sb).height : null,",
  "  docScrollBehavior: getComputedStyle(document.documentElement).scrollBehavior, scrollPadTop: getComputedStyle(document.documentElement).scrollPaddingTop,",
  "  mainPadTop: main ? getComputedStyle(main).paddingTop : null, colPadTop: col ? getComputedStyle(col).paddingTop : null,",
  "  mainMinH: main ? getComputedStyle(main).minHeight : null, colMinH: col ? getComputedStyle(col).minHeight : null };",
  "})()",
].join("\n");

async function withTimeout<T>(label: string, promise: Promise<T>, ms?: number): Promise<T> {
  const limit = ms || STEP_MS;
  let timer: NodeJS.Timeout | undefined;
  const guard = new Promise<never>(function (_resolve, reject) {
    timer = setTimeout(function () { reject(new Error("ТАЙМАУТ " + limit + "ms: " + label)); }, limit);
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
      const email = "shell-" + lang + "-" + vp.n + "-" + randomBytes(4).toString("hex") + "@example.test";
      const password = "Diag-" + randomBytes(12).toString("base64url") + "!7";
      log(tag + ": создаю запись…");
      const made = (await withTimeout(tag + " create", createManagedUser(
        { email: email, name: "Diag " + tag, role: "admin", password: password } as never,
        { id: founder.id, role: "founder" } as never,
      ) as never)) as { user?: { id: number }; id?: number };
      const id = made.user ? made.user.id : made.id;
      if (id) created.push(id);

      const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
      const page = await context.newPage();
      page.setDefaultTimeout(STEP_MS);
      page.setDefaultNavigationTimeout(STEP_MS);
      await withTimeout(tag + " login page", page.goto(BASE + "/login", { waitUntil: "domcontentloaded" }));
      await withTimeout(tag + " email", page.fill("#sign-in-email", email));
      await withTimeout(tag + " pass", page.fill("#sign-in-password", password));
      await withTimeout(tag + " submit", page.click('button[type="submit"]'));
      await page.waitForTimeout(2500);
      await page.evaluate(function (l) { try { localStorage.setItem("bilc_language", l); } catch (e) { /* noop */ } document.cookie = "bilc_language=" + l + "; path=/"; }, lang);
      await withTimeout(tag + " dashboard", page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded" }));
      await page.waitForTimeout(3000);
      const r = (await withTimeout(tag + " probe", page.evaluate(PROBE) as never)) as Record<string, unknown>;
      rows.push("---- " + tag + " dir=" + r.dir + " vh=" + r.innerH + " " + page.url());
      rows.push("  ТОЧНО: sbTopRaw=" + r.sbTopRaw + " tbTopRaw=" + r.tbTopRaw + " sbBottomRaw=" + r.sbBottomRaw + " scrollY=" + r.scrollY + " rem=" + r.remPx + " htmlClientH=" + r.htmlClientH + " innerH=" + r.innerH);
      rows.push("  ОКРУГЛ: сайдбар top=" + r.sbTop + " зазор снизу=" + r.sbBottomGap + " топбар top=" + r.tbTop + " bottom=" + r.tbBottom + " высота сайдбара=" + r.sbH);
      rows.push("  первый блок top=" + r.firstBlockTop + " content-column top=" + r.colTop + " colPadTop=" + r.colPadTop + " mainPadTop=" + r.mainPadTop + " scrollPaddingTop=" + r.scrollPadTop);
      rows.push("  insetH=" + r.insetH + " mainH=" + r.mainH + " mainMinH=" + r.mainMinH + " colMinH=" + r.colMinH + " sbOverflowY=" + r.sbOvY);
      rows.push("  html.scroll=" + r.htmlScroll + " body.scroll=" + r.bodyScroll + " body.overflowY=" + r.bodyOvY + " body.minH=" + r.bodyMinH);
      rows.push("  ПРОКРУЧИВАЕМЫЕ=" + JSON.stringify(r.scrollables) + " documentScroller=" + r.docScroll + " scrollBehavior=" + r.docScrollBehavior);
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