/**
 * Диагностика оболочки дашборда (items 1 и 2): цепочка предков топбара с геометрией
 * и выравниванием + список всех прокручиваемых элементов.
 *
 * Сессия: временная учётная запись создаётся ШТАТНЫМ кодом приложения
 * (db.createManagedUser) с паролем, сгенерированным в памяти, вход выполняется
 * через обычную форму /login, а в finally запись удаляется через deleteManagedUser.
 * Пароль не печатается и нигде не сохраняется. TEST_FOUNDER_PASSWORD не нужен.
 *
 * Запуск: npx tsx e2e/diag-shell.ts
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { chromium } from "playwright";
import { eq } from "drizzle-orm";
import { createManagedUser, deleteManagedUser, getDb } from "../server/db";
import { users } from "../drizzle/schema";

const BASE = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const EMAIL = "shell-diag-temp@example.test";
const VIEWPORTS = [
  { n: "1440", w: 1440, h: 900 },
  { n: "1024", w: 1024, h: 768 },
  { n: "390", w: 390, h: 844 },
];
const LANGS = ["en", "ar"];

// Тело выполняется в браузере: только ES5-совместимый JS, без типов TypeScript.
const PROBE = [
  "(function(){",
  "var d = function(el){",
  "  var cs = getComputedStyle(el); var b = el.getBoundingClientRect(); var pseudo = [];",
  "  var pairs = [['::before', getComputedStyle(el,'::before')], ['::after', getComputedStyle(el,'::after')]];",
  "  for (var i=0;i<pairs.length;i++){ var ps = pairs[i][1]; var h = (ps.content && ps.content !== 'none') ? ps.height : '0px';",
  "    if (h !== '0px' && h !== 'auto') pseudo.push(pairs[i][0] + ' h=' + h); }",
  "  return { tag: el.tagName.toLowerCase(), cls: (typeof el.className === 'string' ? el.className.trim().split(/\\s+/).slice(0,3).join('.') : ''),",
  "    top: Math.round(b.top*100)/100, h: Math.round(b.height*100)/100, disp: cs.display, pos: cs.position,",
  "    ai: cs.alignItems, ac: cs.alignContent, jc: cs.justifyContent, pc: cs.placeContent, fd: cs.flexDirection,",
  "    pt: cs.paddingTop, pb: cs.paddingBottom, mt: cs.marginTop, mb: cs.marginBottom, rg: cs.rowGap,",
  "    tr: (cs.transform === 'none' ? '-' : 'SET'), topProp: cs.top, minH: cs.minHeight, hProp: cs.height, pseudo: pseudo.join(',') };",
  "};",
  "var start = document.querySelector('header.bilc-floating-header');",
  "var rows = [];",
  "if (start) rows.push(Object.assign({ role: 'TOP' }, d(start)));",
  "if (start) { var p = start.previousElementSibling, j = 0; while (p && j < 4) { rows.push(Object.assign({ role: 'prev'+j }, d(p))); p = p.previousElementSibling; j++; } }",
  "var el = start ? start.parentElement : null, k = 0;",
  "while (el && k < 9) { rows.push(Object.assign({ role: 'anc'+k }, d(el))); el = el.parentElement; k++; }",
  "var sb = document.querySelector('.bilc-floating-sidebar');",
  "var r = sb ? sb.getBoundingClientRect() : null;",
  "var scrollables = [];",
  "document.querySelectorAll('*').forEach(function(e){ var cs = getComputedStyle(e); var oy = cs.overflowY;",
  "  if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && e.scrollHeight > e.clientHeight + 1)",
  "    scrollables.push({ sel: e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/)[0] : ''), by: e.scrollHeight - e.clientHeight, oy: oy }); });",
  "var de = document.scrollingElement;",
  "if (de && de.scrollHeight > de.clientHeight + 1) scrollables.push({ sel: 'document.scrollingElement', by: de.scrollHeight - de.clientHeight, oy: 'page' });",
  "return { rows: rows, sbTop: r ? Math.round(r.top*100)/100 : null, sbBottom: r ? Math.round(r.bottom*100)/100 : null,",
  "  vh: window.innerHeight, dir: document.documentElement.dir, scrollables: scrollables,",
  "  docScrollBehavior: getComputedStyle(document.documentElement).scrollBehavior };",
  "})()",
].join("\n");

process.env.DATABASE_URL = (process.env.DATABASE_URL ?? "").replace(/@db:/, "@127.0.0.1:3307:");
const db = await getDb();
if (!db) { console.log("НЕТ соединения с БД"); process.exit(1); }
const founder = (await db.select().from(users).where(eq(users.role, "founder")).limit(1))[0];
if (!founder) { console.log("Основатель не найден"); process.exit(1); }

const password = "Diag-" + randomBytes(12).toString("base64url") + "!7";
let createdId: number | null = null;
const browser = await chromium.launch();

try {
  const created = (await createManagedUser(
    { email: EMAIL, name: "Shell Diag", role: "admin", password } as never,
    { id: founder.id, role: "founder" } as never,
  )) as { user?: { id: number }; id?: number };
  createdId = created.user?.id ?? created.id ?? null;
  console.log("Временная учётная запись создана (пароль не печатается).\n");

  for (const lang of LANGS) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
      const page = await context.newPage();
      await page.goto(`${BASE}/login`, { waitUntil: "load", timeout: 60000 });
      await page.fill("#sign-in-email", EMAIL);
      await page.fill("#sign-in-password", password);
      await Promise.all([page.waitForNavigation({ timeout: 30000 }).catch(() => undefined), page.click('button[type="submit"]')]);
      await page.waitForTimeout(2500);
      await page.evaluate(l => { try { localStorage.setItem("bilc_language", l); } catch { /* noop */ } document.cookie = `bilc_language=${l}; path=/`; }, lang);
      await page.goto(`${BASE}/dashboard`, { waitUntil: "load", timeout: 60000 });
      await page.waitForTimeout(3000);

      const res = (await page.evaluate(PROBE)) as {
        rows: Array<Record<string, unknown>>;
        sbTop: number | null; sbBottom: number | null; vh: number; dir: string;
        scrollables: Array<{ sel: string; by: number; oy: string }>;
        docScrollBehavior: string;
      };
      console.log(`\n==== lang=${lang} ${vp.n}x${vp.h} dir=${res.dir} url=${page.url()} scrollBehavior=${res.docScrollBehavior} ====`);
      console.log(`  сайдбар top=${res.sbTop} bottom=${res.sbBottom} зазор снизу=${res.sbBottom !== null ? Math.round((res.vh - res.sbBottom) * 100) / 100 : "?"}`);
      for (const row of res.rows) {
        console.log(
          `  ${String(row.role).padEnd(5)} ${(String(row.tag) + "." + String(row.cls).slice(0, 22)).padEnd(28)}` +
          ` top=${String(row.top).padStart(7)} h=${String(row.h).padStart(7)} ${row.disp}/${row.pos} fd=${row.fd}` +
          ` ai=${row.ai} jc=${row.jc} pt=${row.pt} mt=${row.mt} mb=${row.mb} rg=${row.rg} minH=${row.minH} hProp=${row.hProp} tr=${row.tr} topProp=${row.topProp} ${row.pseudo}`,
        );
      }
      console.log(`  ПРОКРУЧИВАЕМЫЕ: ${JSON.stringify(res.scrollables)}`);
      await context.close();
    }
  }
} catch (error) {
  console.log("ОШИБКА: " + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
} finally {
  await browser.close();
  if (createdId) {
    try { console.log("\nОчистка: " + JSON.stringify(await deleteManagedUser(createdId, { id: founder.id, role: "founder" } as never))); }
    catch { console.log("\nОчистка не удалась — проверьте временную запись " + EMAIL); }
  }
}