/**
 * Проверка оболочки дашборда: item 1 (зазоры топбара/сайдбара) и item 2 (один скроллер).
 * На КАЖДЫЙ контекст создаётся своя временная учётная запись (первый вход расходует
 * одноразовый пароль), все записи удаляются в finally. Пароли не печатаются.
 * Запуск: npx tsx e2e/diag-shell.ts
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { chromium } from "playwright";
import { eq } from "drizzle-orm";
import { createManagedUser, deleteManagedUser, getDb } from "../server/db";
import { users } from "../drizzle/schema";
import { COOKIE_NAME } from "../shared/const";

const BASE = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const SHELL_GAP = 16;
const VIEWPORTS = [
  { n: "1440", w: 1440, h: 900 },
  { n: "1024", w: 1024, h: 768 },
  { n: "390", w: 390, h: 844 },
];
const LANGS = ["en", "ar"];
const LOGINS = new Map<string, { email: string; password: string }>();

const PROBE = [
  "(function(){",
  "var d = function(el){ var cs = getComputedStyle(el); var b = el.getBoundingClientRect();",
  "  return { tag: el.tagName.toLowerCase(), cls: (typeof el.className === 'string' ? el.className.trim().split(/\\s+/).slice(0,2).join('.') : ''),",
  "    top: Math.round(b.top*100)/100, h: Math.round(b.height*100)/100, pos: cs.position, disp: cs.display,",
  "    ai: cs.alignItems, jc: cs.justifyContent, alignSelf: cs.alignSelf, hProp: cs.height, minH: cs.minHeight, ovY: cs.overflowY }; };",
  "var tb = document.querySelector('header.bilc-floating-header');",
  "var sb = document.querySelector('.bilc-floating-sidebar');",
  "var col = document.querySelector('.bilc-content-column');",
  "var inset = document.querySelector('.minimal-dashboard-inset');",
  "var wrapper = inset ? inset.parentElement : null;",
  "var scrollables = [];",
  "document.querySelectorAll('*').forEach(function(e){ var cs = getComputedStyle(e); var oy = cs.overflowY;",
  "  if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && e.scrollHeight > e.clientHeight + 1)",
  "    scrollables.push({ sel: e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/)[0] : ''), by: e.scrollHeight - e.clientHeight }); });",
  "var de = document.scrollingElement;",
  "if (de && de.scrollHeight > de.clientHeight + 1) scrollables.push({ sel: 'DOCUMENT', by: de.scrollHeight - de.clientHeight });",
  "var r = sb ? sb.getBoundingClientRect() : null; var t = tb ? tb.getBoundingClientRect() : null;",
  "return { tbTop: t ? Math.round(t.top*100)/100 : null, tbH: t ? Math.round(t.height*100)/100 : null,",
  "  sbTop: r ? Math.round(r.top*100)/100 : null, sbBottomGap: r ? Math.round((window.innerHeight - r.bottom)*100)/100 : null,",
  "  colTop: col ? Math.round(col.getBoundingClientRect().top*100)/100 : null,",
  "  insetTop: inset ? Math.round(inset.getBoundingClientRect().top*100)/100 : null,",
  "  wrapperCls: wrapper ? String(wrapper.className).slice(0, 60) : null,",
  "  wrapperPb: wrapper ? getComputedStyle(wrapper).paddingBottom : null,",
  "  wrapperH: wrapper ? Math.round(wrapper.getBoundingClientRect().height*100)/100 : null,",
  "  vh: window.innerHeight, dir: document.documentElement.dir, scrollables: scrollables,",
  "  htmlScroll: document.documentElement.scrollHeight - document.documentElement.clientHeight,",
  "  bodyScroll: document.body.scrollHeight - document.body.clientHeight,",
  "  bodyOvY: getComputedStyle(document.body).overflowY, bodyH: getComputedStyle(document.body).height,",
  "  bodyMinH: getComputedStyle(document.body).minHeight, docScrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,",
  "  tb: d(tb || document.body), sb: d(sb || document.body), inset: d(inset || document.body) };",
  "})()",
].join("\n");

process.env.DATABASE_URL = (process.env.DATABASE_URL ?? "").replace(/@db:/, "@127.0.0.1:3307:");
const db = await getDb();
if (!db) { console.log("НЕТ соединения с БД"); process.exit(1); }
const founder = (await db.select().from(users).where(eq(users.role, "founder")).limit(1))[0];
const browser = await chromium.launch();
const created: number[] = [];
const results: Array<{ name: string; pass: boolean; detail: string }> = [];

try {
  for (const lang of LANGS) {
    for (const vp of VIEWPORTS) {
      const email = `shell-diag-${lang}-${vp.n}-${randomBytes(4).toString("hex")}@example.test`;
      const password = "Diag-" + randomBytes(12).toString("base64url") + "!7";
      const made = (await createManagedUser(
        { email, name: `Diag ${lang} ${vp.n}`, role: "admin", password } as never,
        { id: founder.id, role: "founder" } as never,
      )) as { user?: { id: number }; id?: number };
      const id = made.user?.id ?? made.id ?? null;
      if (id) created.push(id);
      LOGINS.set(`${lang}-${vp.n}`, { email, password });

      const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
      const page = await context.newPage();
      await page.goto(`${BASE}/login`, { waitUntil: "load", timeout: 60000 });
      await page.fill("#sign-in-email", email);
      await page.fill("#sign-in-password", password);
      await Promise.all([page.waitForNavigation({ timeout: 30000 }).catch(() => undefined), page.click('button[type="submit"]')]);
      await page.waitForTimeout(2500);
      await page.evaluate(l => { try { localStorage.setItem("bilc_language", l); } catch { /* noop */ } document.cookie = `bilc_language=${l}; path=/`; }, lang);
      await page.goto(`${BASE}/dashboard`, { waitUntil: "load", timeout: 60000 });
      await page.waitForTimeout(3000);

      const r = (await page.evaluate(PROBE)) as any;
      const tag = `${lang}@${vp.n}`;
      console.log(`\n==== ${tag} dir=${r.dir} url=${page.url()} vh=${r.vh} ====`);
      console.log(`  обёртка inset: cls=${r.wrapperCls} pb=${r.wrapperPb} h=${r.wrapperH} | inset top=${r.insetTop} alignSelf=${r.inset.alignSelf} hProp=${r.inset.hProp} minH=${r.inset.minH}`);
      console.log(`  топбар top=${r.tbTop} h=${r.tbH} pos=${r.tb.pos} | сайдбар top=${r.sbTop} зазор снизу=${r.sbBottomGap} | content-column top=${r.colTop}`);
      console.log(`  прокручиваемые: ${JSON.stringify(r.scrollables)}`);
      console.log(`  html.scroll=${r.htmlScroll} body.scroll=${r.bodyScroll} body.overflowY=${r.bodyOvY} body.height=${r.bodyH} body.minHeight=${r.bodyMinH} scrollBehavior=${r.docScrollBehavior}`);

      if (vp.w >= 1024) {
        results.push({ name: `${tag} item1 топбар top = ${SHELL_GAP}`, pass: r.tbTop !== null && Math.abs(r.tbTop - SHELL_GAP) <= 1.5, detail: `получено ${r.tbTop}` });
        results.push({ name: `${tag} item1 топбар top = сайдбар top`, pass: r.tbTop !== null && r.sbTop !== null && Math.abs(r.tbTop - r.sbTop) <= 1.5, detail: `топбар ${r.tbTop} сайдбар ${r.sbTop}` });
        results.push({ name: `${tag} item1 зазор снизу сайдбара = ${SHELL_GAP}`, pass: r.sbBottomGap !== null && Math.abs(r.sbBottomGap - SHELL_GAP) <= 1.5, detail: `получено ${r.sbBottomGap}` });
      }
      await context.close();
    }
  }
} catch (error) {
  console.log("ОШИБКА: " + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
} finally {
  await browser.close();
  let removed = 0;
  for (const id of created) {
    try { await deleteManagedUser(id, { id: founder.id, role: "founder" } as never); removed += 1; } catch { /* noop */ }
  }
  console.log(`\nОчистка: удалено временных записей ${removed} из ${created.length}`);
  console.log("\n=== ИТОГ ===");
  for (const res of results) console.log(`  ${res.pass ? "PASS" : "FAIL"}  ${res.name.padEnd(46)} ${res.detail}`);
  const failed = results.filter(res => !res.pass).length;
  console.log(`  итого: ${results.length - failed} PASS, ${failed} FAIL`);
}