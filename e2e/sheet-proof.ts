/**
 * Item 4 proof: бургер-шторка и языковой блок.
 *
 * Все пробы — СТРОКИ, возвращающие JSON.stringify(...). Читаются ОДНИМ помощником
 * evalJson: если результат строка — парсим, если уже объект — берём как есть.
 * Поэтому JSON.parse к результату page.evaluate больше нигде не применяется.
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
const PANEL_SELECTOR = "[data-testid=mobile-shell-panel]";
// Для admin-фикстуры оболочку рендерит /admin (Admin.tsx:88 -> DashboardLayout).
// /dashboard у admin-сессии даёт DashboardLayoutSkeleton и жёсткий редирект
// window.location.replace("/admin") (DashboardLayout.tsx:97-98), где триггера нет.
const ROLE = process.env.SHEET_ROLE === "student" ? "student" : "admin";
const ROUTE = ROLE === "student" ? "/dashboard" : "/admin";
const started = Date.now();
function log(m: string) { console.log("[" + (Math.round((Date.now() - started) / 100) / 10) + "s] " + m); }
const kill = setTimeout(function () { log("ЖЁСТКИЙ ПРЕДЕЛ — выход"); process.exit(3); }, 180000);
kill.unref();
let failures = 0;

async function evalJson<T>(page: Page, expr: string, label: string): Promise<T> {
  const raw: unknown = await page.evaluate(expr);
  if (typeof raw === "string") {
    try { return JSON.parse(raw) as T; }
    catch (error) { throw new Error(label + ": результат не является JSON — " + (error instanceof Error ? error.message : String(error))); }
  }
  return raw as T;
}

async function step<T>(name: string, fn: () => Promise<T>): Promise<T> {
  log("ШАГ: " + name);
  try { return await fn(); }
  catch (error) {
    const err = error as Error;
    log("  ОШИБКА на шаге: " + name);
    log("  сообщение: " + (err && err.message ? err.message : String(error)));
    const stack = (err && err.stack ? err.stack : "").split("\n").slice(0, 3);
    for (const line of stack) log("  " + line.trim());
    throw error;
  }
}

const FIXED_DUMP = [
  "(function(){",
  "var out=[];",
  "document.querySelectorAll('*').forEach(function(e){",
  "  if (getComputedStyle(e).position === 'fixed') {",
  "    var r=e.getBoundingClientRect();",
  "    out.push(e.tagName.toLowerCase() + ' cls=' + String(e.className).slice(0,50) + ' top=' + Math.round(r.top) + ' h=' + Math.round(r.height) + ' text=\"' + (e.textContent||'').replace(/\\s+/g,' ').trim().slice(0,40) + '\"');",
  "  }",
  "});",
  "return JSON.stringify(out);",
  "})()",
].join("\n");

async function dumpFixed(page: Page) {
  try {
    const list = await evalJson<string[]>(page, FIXED_DUMP, "дамп fixed-элементов");
    log("  fixed-элементы на странице (" + list.length + "):");
    for (const line of list) log("    " + line);
  } catch (error) {
    log("  дамп fixed-элементов не удался: " + (error instanceof Error ? error.message : String(error)));
  }
}

const DIAG = [
  "(function(){",
  "var btns=Array.prototype.slice.call(document.querySelectorAll('button')).map(function(b){return (b.getAttribute('aria-label')||'(no aria-label)')+' | testid='+(b.getAttribute('data-testid')||'-')+' | text='+(b.textContent||'').replace(/\\s+/g,' ').trim().slice(0,30);});",
  "return JSON.stringify({url:location.href,title:document.title,bodyStart:(document.body.innerText||'').replace(/\\s+/g,' ').trim().slice(0,300),buttons:btns});",
  "})()",
].join("\n");

async function dumpPage(page: Page) {
  try {
    const d = await evalJson<{ url: string; title: string; bodyStart: string; buttons: string[] }>(page, DIAG, "диагностика страницы");
    log("  ИТОГОВЫЙ URL: " + d.url);
    log("  document.title: " + d.title);
    log("  первые 300 символов текста: " + d.bodyStart);
    log("  кнопки (" + d.buttons.length + "):");
    for (const b of d.buttons) log("    " + b);
  } catch (error) {
    log("  диагностика страницы не удалась: " + (error instanceof Error ? error.message : String(error)));
  }
}
async function openPanel(page: Page, tag: string): Promise<boolean> {
  const trigger = page.locator("[data-testid=mobile-shell-trigger]").first();
  try {
    await page.waitForSelector("[data-testid=mobile-shell-trigger]", { timeout: 5000 });
    log("  триггер найден: " + (await trigger.count()));
  } catch {
    log("  ТРИГГЕР НЕ НАЙДЕН за 5000ms (роль=" + ROLE + ", маршрут=" + ROUTE + ")");
    failures += 1;
    await dumpPage(page);
    return false;
  }
  await trigger.click();
  try {
    await page.waitForSelector(PANEL_SELECTOR, { timeout: 3000 });
    log("  панель появилась");
    return true;
  } catch {
    log("  ПАНЕЛЬ НЕ ПОЯВИЛАСЬ за 3000ms (" + tag + ")");
    failures += 1;
    await dumpFixed(page);
    return false;
  }
}

async function shot(page: Page, name: string) {
  const dir = "e2e/screenshots";
  fs.mkdirSync(dir, { recursive: true });
  const file = dir + "/" + name + ".png";
  await page.screenshot({ path: file });
  log("  скриншот сохранён: " + file + " (" + fs.statSync(file).size + " байт)");
}

const MEASURE = [
  "(function(){",
  "var panel=document.querySelector('[data-testid=mobile-shell-panel]');",
  "if(!panel) return JSON.stringify({found:false});",
  "var rr=function(el){var r=el.getBoundingClientRect();return{top:Math.round(r.top*100)/100,bottom:Math.round(r.bottom*100)/100,left:Math.round(r.left*100)/100,right:Math.round(r.right*100)/100,h:Math.round(r.height*100)/100};};",
  "var signOut=document.querySelector('[data-testid=sheet-sign-out]');",
  "var profile=document.querySelector('[data-testid=sheet-profile-card]');",
  "var langBlock=document.querySelector('[data-testid=sheet-language-block]');",
  "var opts=Array.prototype.slice.call(document.querySelectorAll('[data-testid^=\"language-option-\"]'));",
  "var pb=rr(panel); var sb=signOut?rr(signOut):null; var pr=profile?rr(profile):null;",
  "var lb=langBlock?rr(langBlock):null;",
  "var headerEl=panel.querySelector('header');",
  "var sheetHeaderBottom=headerEl?rr(headerEl).bottom:pb.top;",
  "var direction=document.documentElement.dir==='rtl'?'RTL':'LTR';",
  "return JSON.stringify({",
  "  found:true, dir:direction, htmlLang:document.documentElement.lang,",
  "  panel:pb, signOut:sb, profile:pr, languageBlock:lb,",
  "  hasHeaderEl:!!headerEl, sheetHeaderBottom:sheetHeaderBottom,",
  "  profileGap:(pr!==null)?Math.round((pr.top-sheetHeaderBottom)*100)/100:null,",
  "  shellGap:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--shell-gap'))||16,",
  "  scrollTop:panel.scrollTop, scrollHeight:panel.scrollHeight, clientHeight:panel.clientHeight,",
  "  signOutLabel:signOut?(signOut.textContent||'').replace(/\\s+/g,' ').trim():null,",
  "  order:Array.prototype.slice.call(panel.children).filter(function(c){return c.getBoundingClientRect().height>8;}).map(function(c){return{tag:c.tagName.toLowerCase(),cls:String(c.className).slice(0,42),top:Math.round(c.getBoundingClientRect().top),text:(c.textContent||'').replace(/\\s+/g,' ').trim().slice(0,58)};}),",
  "  options:opts.map(function(b){var r=rr(b);return{id:b.getAttribute('data-testid'),text:(b.textContent||'').replace(/\\s+/g,' ').trim(),pressed:b.getAttribute('aria-pressed'),h:r.h,top:r.top,bottom:r.bottom,clipTop:r.top<pb.top-0.5,clipBottom:r.bottom>pb.bottom+0.5,overlapsSignOut:sb?!(r.bottom<=sb.top||r.top>=sb.bottom||r.right<=sb.left||r.left>=sb.right):null};})",
  "});",
  "})()",
].join("\n");

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/@db:/, "@127.0.0.1:3307:");
const db = await getDb();
if (!db) { log("НЕТ соединения с БД"); process.exit(1); }
const founder = (await db.select().from(users).where(eq(users.role, "founder")).limit(1))[0];
const browser = await chromium.launch();
const created: number[] = [];
try {
  for (const lang of ["en", "ms", "ar"]) {
    const email = "sheet-" + lang + "-" + randomBytes(4).toString("hex") + "@example.test";
    const password = "Diag-" + randomBytes(12).toString("base64url") + "!7";
    await step(lang + ": создать временную учётную запись", async () => {
      const made = (await createManagedUser(
        { email, name: "Sheet " + lang, role: ROLE, password } as never,
        { id: founder.id, role: "founder" } as never,
      )) as unknown as { id?: number };
      if (made.id !== undefined) created.push(made.id);
      log("  id создан: " + (made.id !== undefined));
    });

    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    page.setDefaultTimeout(STEP);
    page.setDefaultNavigationTimeout(STEP);

    console.log("\n########## " + lang + " @390 ##########");
    await step(lang + ": вход", async () => {
      await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
      await page.fill("#sign-in-email", email);
      await page.fill("#sign-in-password", password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2500);
    });
    await step(lang + ": выставить язык " + lang + " и открыть " + ROUTE, async () => {
      await page.evaluate("(function(l){try{localStorage.setItem('bilc_language',l);}catch(e){}document.cookie='bilc_language='+l+'; path=/';})(" + JSON.stringify(lang) + ")");
      await page.goto(BASE + ROUTE, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(3000);
    });

    const opened = await step(lang + ": открыть шторку через mobile-shell-trigger", async () => openPanel(page, lang));
    if (!opened) { await context.close(); continue; }

    const m = await step(lang + ": измерить панель", async () => evalJson<any>(page, MEASURE, lang + " MEASURE"));
    await step(lang + ": порядок секций, опции, зазор профиля", async () => {
      log("  ПОРЯДОК СЕКЦИЙ (сверху вниз), dir=" + m.dir + ":");
      for (const k of m.order) log("    top=" + String(k.top).padStart(5) + " " + k.tag + "." + k.cls + " | " + k.text);
      log("  ОПЦИИ ЯЗЫКА:");
      for (const o of m.options) {
        log("    " + o.id + " \"" + o.text + "\" h=" + o.h + " pressed=" + o.pressed + " clipTop=" + o.clipTop + " clipBottom=" + o.clipBottom + " overlapsSignOut=" + o.overlapsSignOut);
        if (o.h < 44) { log("      FAIL: высота меньше 44px"); failures += 1; }
        if (o.clipTop || o.clipBottom) { log("      FAIL: опция обрезана панелью"); failures += 1; }
        if (o.overlapsSignOut) { log("      FAIL: опция пересекает Sign out"); failures += 1; }
      }
      log("  Sign out: top=" + (m.signOut ? m.signOut.top : null) + " подпись=\"" + m.signOutLabel + "\"");
      log("  КАРТОЧКА ПРОФИЛЯ [" + m.dir + "]: top=" + (m.profile ? m.profile.top : null) + " ; низ шапки шторки=" + m.sheetHeaderBottom +
        (m.hasHeaderEl ? "" : " (элемента <header> в шторке нет — взят верхний край панели)") +
        " ; зазор=" + m.profileGap + " ; --shell-gap=" + m.shellGap + " => " + (m.profileGap !== null && m.profileGap >= m.shellGap ? "PASS" : "FAIL"));
      if (!(m.profileGap !== null && m.profileGap >= m.shellGap)) failures += 1;
      if (m.options.length !== 3) { log("  FAIL: опций " + m.options.length + ", ожидалось 3"); failures += 1; }
    });

    await step(lang + ": скриншот шторки сверху", async () => shot(page, "sheet-" + lang + "-top"));

    await step(lang + ": клик по каждому языку", async () => {
      for (const code of ["en", "ms", "ar"]) {
        const btn = page.locator("[data-testid=language-option-" + code + "]").first();
        if ((await btn.count()) === 0) { log("  " + code + ": кнопка не найдена"); failures += 1; continue; }
        await btn.click();
        await page.waitForTimeout(1200);
        const st = await evalJson<{ lang: string; dir: string; open: boolean }>(
          page,
          "(function(){return JSON.stringify({lang:document.documentElement.lang,dir:document.documentElement.dir,open:!!document.querySelector('[data-testid=mobile-shell-panel]')});})()",
          code + " state",
        );
        const lbl = await evalJson<any>(page, MEASURE, code + " MEASURE after click");
        log("  клик " + code + ": html lang=" + st.lang + " dir=" + st.dir + " шторка открыта=" + st.open + " подпись выхода=\"" + lbl.signOutLabel + "\"");
        if (!st.open) { log("    FAIL: шторка закрылась после выбора языка"); failures += 1; }
      }
    });

    await step(lang + ": прокрутить шторку вниз и снять скриншот", async () => {
      await page.evaluate("(function(){var p=document.querySelector('[data-testid=mobile-shell-panel]');if(p)p.scrollTop=p.scrollHeight;})()");
      await page.waitForTimeout(900);
      await shot(page, "sheet-" + lang + "-bottom");
    });
    await context.close();
  }
} catch (error) {
  const err = error as Error;
  log("ОСТАНОВ: " + (err && err.message ? err.message : String(error)));
  process.exitCode = 1;
} finally {
  await browser.close();
  let removed = 0;
  for (const id of created) { try { await deleteManagedUser(id, { id: founder.id, role: "founder" } as never); removed += 1; } catch { /* noop */ } }
  const all = await db.select().from(users);
  const left = all.filter(function (u) { return typeof u.email === "string" && (u.email.indexOf("sheet-") === 0 || u.email.indexOf("mh-") === 0 || u.email.indexOf("shell-") === 0 || u.email.indexOf("probe-") === 0); });
  log("удалено: " + removed + " из " + created.length);
  log("ОСТАЛОСЬ временных записей в БД (запрос через модуль db приложения): " + left.length + " — должно быть 0");
  log("провалов проверок: " + failures);
  process.exit(process.exitCode || failures > 0 ? 1 : 0);
}