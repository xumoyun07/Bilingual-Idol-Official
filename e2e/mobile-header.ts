/** Item 3: мобильная шапка. Свежая запись на контекст; удаление проверяется запросом. */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { chromium } from "playwright";
import { eq, like } from "drizzle-orm";
import { createManagedUser, deleteManagedUser, getDb } from "../server/db";
import { users } from "../drizzle/schema";

const BASE = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const STEP = 20000;
const started = Date.now();
function log(m: string) { console.log("[" + (Math.round((Date.now() - started) / 100) / 10) + "s] " + m); }
const kill = setTimeout(function () { log("ЖЁСТКИЙ ПРЕДЕЛ — выход"); process.exit(3); }, 170000);
kill.unref();
const VPS = [{ n: "412", w: 412, h: 915 }, { n: "390", w: 390, h: 844 }, { n: "360", w: 360, h: 800 }];

const PROBE = [
  "(function(){",
  "var vis = function(el){ if(!el) return false; var r = el.getBoundingClientRect(); return r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };",
  "var hdrs = Array.prototype.slice.call(document.querySelectorAll('header')).filter(vis);",
  "var hdr = hdrs.length ? hdrs[0] : null;",
  "var col = document.querySelector('.bilc-content-column');",
  "var first = mainBlock();",
  "function mainBlock(){ if(!col) return null; var kids = Array.prototype.slice.call(col.children);",
  "  for (var i=0;i<kids.length;i++){ var r = kids[i].getBoundingClientRect(); if (r.height > 20 && kids[i].tagName.toLowerCase() !== 'header') return kids[i]; } return null; }",
  "var rr = function(v){ return (v === null || v === undefined) ? null : Math.round(v*100)/100; };",
  "var hb = hdr ? hdr.getBoundingClientRect() : null; var fb = first ? first.getBoundingClientRect() : null;",
  "var gapRaw = getComputedStyle(document.documentElement).getPropertyValue('--shell-gap');",
  "return { scrollY: window.scrollY, dir: document.documentElement.dir, headerCount: hdrs.length,",
  "  headerBottom: hb ? rr(hb.bottom) : null, headerTop: hb ? rr(hb.top) : null, headerH: hb ? rr(hb.height) : null,",
  "  headerPos: hdr ? getComputedStyle(hdr).position : null, headerCls: hdr ? String(hdr.className).slice(0,50) : null,",
  "  firstTop: fb ? rr(fb.top) : null, firstTag: first ? first.tagName.toLowerCase() : null,",
  "  colPadTop: col ? getComputedStyle(col).paddingBlockStart : null, scrollPadTop: getComputedStyle(document.documentElement).scrollPaddingTop,",
  "  gapVar: gapRaw, headerVar: getComputedStyle(document.documentElement).getPropertyValue('--shell-header-h'), url: location.pathname + location.search };",
  "})()",
].join("\n");

const SHEET = [
  "(function(){",
  "var dlg = document.querySelector('[role=\"dialog\"]');",
  "if (!dlg) return { found: false };",
  "var rr = function(v){ return Math.round(v*100)/100; };",
  "var head = dlg.querySelector('header') || dlg.firstElementChild;",
  "var kids = Array.prototype.slice.call(dlg.children);",
  "var first = null;",
  "for (var i=0;i<kids.length;i++){ if (kids[i] !== head && kids[i].getBoundingClientRect().height > 40) { first = kids[i]; break; } }",
  "return { found: true, role: dlg.getAttribute('role'),",
  "  sheetTop: rr(dlg.getBoundingClientRect().top), sheetBottom: rr(dlg.getBoundingClientRect().bottom),",
  "  headBottom: head ? rr(head.getBoundingClientRect().bottom) : null,",
  "  firstTop: first ? rr(first.getBoundingClientRect().top) : null, firstCls: first ? String(first.className).slice(0,60) : null,",
  "  navLinks: Array.prototype.slice.call(dlg.querySelectorAll('a[href]')).slice(0,6).map(function(a){ return a.getAttribute('href'); }) };",
  "})()",
].join("\n");

async function withTimeout<T>(label: string, p: Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const guard = new Promise<never>(function (_r, rej) { timer = setTimeout(function () { rej(new Error("ТАЙМАУТ: " + label)); }, STEP); });
  try { return await Promise.race([p, guard]); } finally { if (timer) clearTimeout(timer); }
}

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/@db:/, "@127.0.0.1:3307:");
const db = await getDb();
const founder = (await db!.select().from(users).where(eq(users.role, "founder")).limit(1))[0];
const browser = await chromium.launch();
const created: number[] = [];
const GAP = 16;
try {
  for (const lang of ["en", "ar"]) {
    for (const vp of VPS) {
      const tag = lang + "@" + vp.n;
      const email = "mh-" + lang + "-" + vp.n + "-" + randomBytes(4).toString("hex") + "@example.test";
      const password = "Diag-" + randomBytes(12).toString("base64url") + "!7";
      const made = (await withTimeout(tag + " create", createManagedUser(
        { email: email, name: "MH " + tag, role: "admin", password: password } as never,
        { id: founder.id, role: "founder" } as never) as never)) as { id?: number };
      if (made.id !== undefined) created.push(made.id);
      const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      page.setDefaultTimeout(STEP);
      page.setDefaultNavigationTimeout(STEP);
      await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
      await page.fill("#sign-in-email", email);
      await page.fill("#sign-in-password", password);
      await withTimeout(tag + " submit", page.click('button[type="submit"]'));
      await page.waitForTimeout(2500);
      await page.evaluate(function (l) { try { localStorage.setItem("bilc_language", l); } catch (e) { /* noop */ } document.cookie = "bilc_language=" + l + "; path=/"; }, lang);
      await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(3000);
      await page.evaluate(function () { window.scrollTo(0, 0); });
      await page.waitForTimeout(300);

      const r = (await page.evaluate(PROBE)) as Record<string, any>;
      const need = r.headerBottom === null ? null : Math.round((r.headerBottom + GAP) * 100) / 100;
      const pass = need !== null && r.firstTop !== null && r.firstTop >= need;
      log(tag + " ШАПКА: header top=" + r.headerTop + " bottom=" + r.headerBottom + " h=" + r.headerH + " pos=" + r.headerPos + " cls=" + r.headerCls);
      log(tag + "       первый блок top=" + r.firstTop + " (" + r.firstTag + ")  нужно >=" + need + "  ЗАЗОР=" + (r.firstTop !== null && r.headerBottom !== null ? Math.round((r.firstTop - r.headerBottom) * 100) / 100 : null) + "  [" + (pass ? "PASS" : "FAIL") + "]");
      log(tag + "       colPadTop=" + r.colPadTop + " scrollPadTop=" + r.scrollPadTop + " --shell-header-h=" + String(r.headerVar).trim() + " --shell-gap=" + String(r.gapVar).trim() + " dir=" + r.dir + " url=" + r.url);

      const sel = page.locator("select").first();
      if ((await sel.count()) > 0) {
        await sel.selectOption({ index: 1 }).catch(function () { /* noop */ });
        await page.waitForTimeout(2500);
        await page.evaluate(function () { window.scrollTo(0, 0); });
        await page.waitForTimeout(400);
        const r2 = (await page.evaluate(PROBE)) as Record<string, any>;
        const need2 = r2.headerBottom === null ? null : r2.headerBottom + GAP;
        log(tag + " ПОСЛЕ SELECT: первый блок top=" + r2.firstTop + " нужно >=" + need2 + " [" + (need2 !== null && r2.firstTop !== null && r2.firstTop >= need2 ? "PASS" : "FAIL") + "] url=" + r2.url);
      } else { log(tag + " ПОСЛЕ SELECT: select не найден"); }

      const urlBefore = page.url();
      const trigger = page.locator("header button[aria-label=""Toggle menu""], header button").first();
      let opened = false;
      if ((await trigger.count()) > 0) { await trigger.click().catch(function () { /* noop */ }); await page.waitForTimeout(2000); opened = true; }
      log(tag + " триггер шторки: " + (opened ? "нажат" : "НЕ НАЙДЕН") + " url до=" + urlBefore);
      const sheet = (await page.evaluate(SHEET)) as Record<string, any>;
      log(tag + " ШТОРКА: " + JSON.stringify(sheet));
      if (sheet.found && typeof sheet.headBottom === "number" && typeof sheet.firstTop === "number") {
        const needS = Math.round((sheet.headBottom + GAP) * 100) / 100;
        log(tag + " ШТОРКА зазор=" + (Math.round((sheet.firstTop - sheet.headBottom) * 100) / 100) + " нужно >=" + needS + " [" + (sheet.firstTop >= needS ? "PASS" : "FAIL") + "]");
      }
      if (sheet.found && Array.isArray(sheet.navLinks) && sheet.navLinks.length) {
        const link = page.locator('[role="dialog"] a[href]').first();
        await link.click().catch(function () { /* noop */ });
        await page.waitForTimeout(2500);
        await page.evaluate(function () { window.scrollTo(0, 0); });
        await page.waitForTimeout(400);
        const r3 = (await page.evaluate(PROBE)) as Record<string, any>;
        const need3 = r3.headerBottom === null ? null : r3.headerBottom + GAP;
        log(tag + " ПОСЛЕ ПЕРЕХОДА: url до=" + urlBefore + " после=" + r3.url + " первый блок top=" + r3.firstTop + " нужно >=" + need3 + " [" + (need3 !== null && r3.firstTop !== null && r3.firstTop >= need3 ? "PASS" : "FAIL") + "]");
      }
      await context.close();
    }
  }
} catch (error) {
  log("ОШИБКА: " + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
} finally {
  await browser.close();
  let removed = 0;
  for (const id of created) { try { await deleteManagedUser(id, { id: founder.id, role: "founder" } as never); removed += 1; } catch (e) { /* noop */ } }
  const left = await db!.select().from(users).where(like(users.email, "mh-%@example.test"));
  log("удалено вызовами: " + removed + " из " + created.length + "; ОСТАЛОСЬ В БД mh-%: " + left.length);
  process.exit(process.exitCode ? 1 : 0);
}