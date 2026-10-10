/** Item 3: мобильная шапка и первый блок контента. Свежая запись на контекст. */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { chromium } from "playwright";
import { eq } from "drizzle-orm";
import { createManagedUser, deleteManagedUser, getDb } from "../server/db";
import { users } from "../drizzle/schema";

const BASE = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const STEP = 20000;
const started = Date.now();
function log(m: string) { console.log("[" + (Math.round((Date.now() - started) / 100) / 10) + "s] " + m); }
const kill = setTimeout(function () { log("ЖЁСТКИЙ ПРЕДЕЛ — выход"); process.exit(3); }, 180000);
kill.unref();
const VPS = [{ n: "412", w: 412, h: 915 }, { n: "390", w: 390, h: 844 }, { n: "360", w: 360, h: 800 }];
const LANGS = ["en", "ar"];

const PROBE = [
  "(function(){",
  "var b = function(el){ if(!el) return null; var r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, h: r.height }; };",
  "var rr = function(v){ return (v === null || v === undefined) ? null : Math.round(v*100)/100; };",
  "var hdr = document.querySelector('header.bilc-floating-header');",
  "var col = document.querySelector('.bilc-content-column');",
  "var first = col ? col.querySelector('main, [data-page]') : null;",
  "if (!first && col) first = col.lastElementChild;",
  "var hb = b(hdr); var fb = b(first);",
  "return { scrollY: window.scrollY, dir: document.documentElement.dir,",
  "  hdrBottom: hb ? rr(hb.bottom) : null, hdrTop: hb ? rr(hb.top) : null, hdrH: hb ? rr(hb.h) : null,",
  "  firstTop: fb ? rr(fb.top) : null, firstTag: first ? first.tagName.toLowerCase() : null,",
  "  colPadTop: col ? getComputedStyle(col).paddingBlockStart || getComputedStyle(col).paddingTop : null,",
  "  scrollPadTop: getComputedStyle(document.documentElement).scrollPaddingTop,",
  "  gap: getComputedStyle(document.documentElement).getPropertyValue('--shell-gap'),",
  "  hdrVar: getComputedStyle(document.documentElement).getPropertyValue('--shell-header-h') };",
  "})()",
].join("\n");

async function withTimeout<T>(label: string, p: Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const guard = new Promise<never>(function (_res, rej) { timer = setTimeout(function () { rej(new Error("ТАЙМАУТ: " + label)); }, STEP); });
  try { return await Promise.race([p, guard]); } finally { if (timer) clearTimeout(timer); }
}

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/@db:/, "@127.0.0.1:3307:");
const db = await getDb();
const founder = (await db!.select().from(users).where(eq(users.role, "founder")).limit(1))[0];
const browser = await chromium.launch();
const created: number[] = [];
try {
  for (const lang of LANGS) {
    for (const vp of VPS) {
      const tag = lang + "@" + vp.n;
      const email = "mh-" + lang + "-" + vp.n + "-" + randomBytes(4).toString("hex") + "@example.test";
      const password = "Diag-" + randomBytes(12).toString("base64url") + "!7";
      const made = (await withTimeout(tag + " create", createManagedUser(
        { email: email, name: "MH " + tag, role: "admin", password: password } as never,
        { id: founder.id, role: "founder" } as never) as never)) as { user?: { id: number } };
      if (made.user) created.push(made.user.id);
      const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      page.setDefaultTimeout(STEP);
      page.setDefaultNavigationTimeout(STEP);
      await withTimeout(tag + " login", page.goto(BASE + "/login", { waitUntil: "domcontentloaded" }));
      await page.fill("#sign-in-email", email);
      await page.fill("#sign-in-password", password);
      await withTimeout(tag + " submit", page.click('button[type="submit"]'));
      await page.waitForTimeout(2500);
      await page.evaluate(function (l) { try { localStorage.setItem("bilc_language", l); } catch (e) { /* noop */ } document.cookie = "bilc_language=" + l + "; path=/"; }, lang);
      await withTimeout(tag + " dash", page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded" }));
      await page.waitForTimeout(3000);
      await page.evaluate(function () { window.scrollTo(0, 0); });
      await page.waitForTimeout(300);

      const r = (await page.evaluate(PROBE)) as Record<string, unknown>;
      const gap = 16;
      const need = typeof r.hdrBottom === "number" ? Math.round((r.hdrBottom + gap) * 100) / 100 : null;
      const ok = typeof r.firstTop === "number" && need !== null && r.firstTop >= need;
      log(tag + " ПЕРВЫЙ БЛОК: header bottom=" + r.hdrBottom + " + gap=" + gap + " => нужно >=" + need + "; фактически первый блок top=" + r.firstTop + " [" + (ok ? "PASS" : "FAIL") + "]");
      log(tag + "   colPadTop=" + r.colPadTop + " scrollPadTop=" + r.scrollPadTop + " --shell-gap=" + String(r.gap).trim() + " --shell-header-h=" + String(r.hdrVar).trim() + " hdrTop=" + r.hdrTop + " hdrH=" + r.hdrH + " dir=" + r.dir + " scrollY=" + r.scrollY);

      // Смена модуля через select, если он есть в мобильной раскладке.
      const select = page.locator("select").first();
      if ((await select.count()) > 0) {
        const options = await select.locator("option").allTextContents().catch(function () { return []; });
        if (options.length > 1) {
          await select.selectOption({ index: 1 }).catch(function () { /* noop */ });
          await page.waitForTimeout(2500);
          await page.evaluate(function () { window.scrollTo(0, 0); });
          await page.waitForTimeout(400);
          const r2 = (await page.evaluate(PROBE)) as Record<string, unknown>;
          const need2 = typeof r2.hdrBottom === "number" ? r2.hdrBottom + gap : null;
          log(tag + " ПОСЛЕ СМЕНЫ МОДУЛЯ: нужно >=" + need2 + "; первый блок top=" + r2.firstTop + " [" + (typeof r2.firstTop === "number" && need2 !== null && r2.firstTop >= need2 ? "PASS" : "FAIL") + "] url=" + page.url());
        } else { log(tag + " select найден, но опций " + options.length + " — пропуск"); }
      } else { log(tag + " select в мобильной раскладке НЕ НАЙДЕН"); }

      // Смена маршрута.
      await withTimeout(tag + " route", page.goto(BASE + "/dashboard/users", { waitUntil: "domcontentloaded" }));
      await page.waitForTimeout(3000);
      await page.evaluate(function () { window.scrollTo(0, 0); });
      await page.waitForTimeout(400);
      const r3 = (await page.evaluate(PROBE)) as Record<string, unknown>;
      const need3 = typeof r3.hdrBottom === "number" ? r3.hdrBottom + gap : null;
      log(tag + " ПОСЛЕ СМЕНЫ МАРШРУТА: нужно >=" + need3 + "; первый блок top=" + r3.firstTop + " [" + (typeof r3.firstTop === "number" && need3 !== null && r3.firstTop >= need3 ? "PASS" : "FAIL") + "] url=" + page.url());

      // Открытая шторка: карточка профиля ниже шапки шторки с тем же зазором.
      const trigger = page.locator('header button, [data-sidebar="trigger"]').first();
      if ((await trigger.count()) > 0) {
        await trigger.click().catch(function () { /* noop */ });
        await page.waitForTimeout(2000);
        const sheet = await page.evaluate(function () {
          var dlg = document.querySelector('[role="dialog"], [data-state="open"][data-mobile="true"], .bilc-mobile-sheet');
          if (!dlg) return null;
          var b = function (el) { var r = el.getBoundingClientRect(); return { top: Math.round(r.top * 100) / 100, bottom: Math.round(r.bottom * 100) / 100, h: Math.round(r.height * 100) / 100 }; };
          var head = dlg.querySelector('header') || dlg.firstElementChild;
          var kids = Array.prototype.slice.call(dlg.children);
          var firstBlock = null;
          for (var i = 0; i < kids.length; i++) { if (kids[i] !== head && kids[i].getBoundingClientRect().height > 20) { firstBlock = kids[i]; break; } }
          return { sheet: b(dlg), headBottom: head ? b(head).bottom : null, firstTop: firstBlock ? b(firstBlock).top : null, firstCls: firstBlock ? String(firstBlock.className).slice(0, 60) : null };
        });
        log(tag + " ШТОРКА: " + JSON.stringify(sheet));
        if (sheet && typeof sheet.headBottom === "number" && typeof sheet.firstTop === "number") {
          const needS = Math.round((sheet.headBottom + gap) * 100) / 100;
          log(tag + " ШТОРКА проверка: нужно >=" + needS + "; первый блок top=" + sheet.firstTop + " [" + (sheet.firstTop >= needS ? "PASS" : "FAIL") + "]");
        }
      } else { log(tag + " триггер шторки НЕ НАЙДЕН"); }
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
  log("очистка: удалено " + removed + " из " + created.length);
  process.exit(process.exitCode ? 1 : 0);
}