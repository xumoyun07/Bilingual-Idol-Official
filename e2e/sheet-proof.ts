import "dotenv/config";
import { randomBytes } from "node:crypto";
import { chromium } from "playwright";
import { eq } from "drizzle-orm";
import { createManagedUser, deleteManagedUser, getDb } from "./server/db";
import { users } from "./drizzle/schema";
import fs from "node:fs";

const BASE = "http://127.0.0.1:3000";
process.env.DATABASE_URL = (process.env.DATABASE_URL ?? "").replace(/@db:/, "@127.0.0.1:3307:");
const db = await getDb();
const founder = (await db!.select().from(users).where(eq(users.role, "founder")).limit(1))[0];

const FIND_SHEET = [
  "(function(){",
  "var SIGNS = ['sign out','log keluar','تسجيل الخروج','keluar'];",
  "var btns = Array.prototype.slice.call(document.querySelectorAll('button'));",
  "var target = null;",
  "for (var i=0;i<btns.length;i++){ var t=(btns[i].textContent||'').toLowerCase();",
  "  for (var j=0;j<SIGNS.length;j++){ if (t.indexOf(SIGNS[j])>=0){ target=btns[i]; break; } } if (target) break; }",
  "if (!target) return { found: false };",
  "var node = target;",
  "while (node.parentElement && !(getComputedStyle(node).position === 'fixed' && node.getBoundingClientRect().height > 250)) node = node.parentElement;",
  "return { found: true, panel: true };",
  "})()",
].join("\n");

const MEASURE = [
  "(function(){",
  "var rr=function(el){var r=el.getBoundingClientRect();return{top:Math.round(r.top*100)/100,bottom:Math.round(r.bottom*100)/100,left:Math.round(r.left*100)/100,right:Math.round(r.right*100)/100,h:Math.round(r.height*100)/100};};",
  "var SIGNS=['sign out','log keluar','تسجيل الخروج','keluar'];",
  "var btns=Array.prototype.slice.call(document.querySelectorAll('button'));",
  "var signOut=null;",
  "for(var i=0;i<btns.length;i++){var t=(btns[i].textContent||'').toLowerCase();for(var j=0;j<SIGNS.length;j++){if(t.indexOf(SIGNS[j])>=0){signOut=btns[i];break;}}if(signOut)break;}",
  "if(!signOut) return { found:false };",
  "var panel=signOut;",
  "while(panel.parentElement && !(getComputedStyle(panel).position==='fixed' && panel.getBoundingClientRect().height>250)) panel=panel.parentElement;",
  "var pb=rr(panel); var sb=rr(signOut);",
  "var opts=Array.prototype.slice.call(panel.querySelectorAll('[role=\"group\"] button'));",
  "var optData=opts.map(function(b){var r=rr(b);return{text:(b.textContent||'').replace(/\\s+/g,' ').trim(),pressed:b.getAttribute('aria-pressed'),top:r.top,bottom:r.bottom,h:r.h,clipTop:r.top<pb.top-0.5,clipBottom:r.bottom>pb.bottom+0.5,overlapsSignOut:!(r.bottom<=sb.top||r.top>=sb.bottom||r.right<=sb.left||r.left>=sb.right)};});",
  "var kids=Array.prototype.slice.call(panel.children).filter(function(c){return c.getBoundingClientRect().height>8;}).map(function(c){return{tag:c.tagName.toLowerCase(),cls:String(c.className).slice(0,42),top:Math.round(c.getBoundingClientRect().top),text:(c.textContent||'').replace(/\\s+/g,' ').trim().slice(0,58)};});",
  "return { found:true, panel:pb, scrollTop:panel.scrollTop, scrollHeight:panel.scrollHeight, clientHeight:panel.clientHeight,",
  "  signOut:sb, options:optData, order:kids, htmlLang:document.documentElement.lang, htmlDir:document.documentElement.dir,",
  "  signOutLabel:(signOut.textContent||'').replace(/\\s+/g,' ').trim(), navLabel:(function(){var b=panel.querySelector('[role=\"group\"]');var first=panel.querySelector('button');return first?(first.textContent||'').replace(/\\s+/g,' ').trim().slice(0,40):null;})() };",
  "})()",
].join("\n");

const browser = await chromium.launch();
const created: number[] = [];
try {
  for (const lang of ["en", "ms", "ar"]) {
    const email = "sheet-" + lang + "-" + randomBytes(4).toString("hex") + "@example.test";
    const password = "Diag-" + randomBytes(12).toString("base64url") + "!7";
    const made: any = await createManagedUser({ email, name: "Sheet " + lang, role: "admin", password } as any, { id: founder.id, role: "founder" } as any);
    if (made.id !== undefined) created.push(made.id);

    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(20000);
    await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
    await page.fill("#sign-in-email", email);
    await page.fill("#sign-in-password", password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2500);
    await page.evaluate("(function(l){try{localStorage.setItem('bilc_language',l);}catch(e){}document.cookie='bilc_language='+l+'; path=/';})('" + lang + "')");
    await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    console.log("\n########## " + lang + " @390 ##########");
    const trigger = page.locator('header button[aria-label="Toggle menu"]');
    console.log("шаг 1: триггер найден: " + (await trigger.count()));
    if ((await trigger.count()) === 0) { console.log("ОСТАНОВ: триггер header button[aria-label=\"Toggle menu\"] не найден"); await context.close(); continue; }
    await trigger.first().click();
    await page.waitForTimeout(2500);
    const found = JSON.parse(await page.evaluate(FIND_SHEET));
    console.log("шаг 2: шторка найдена: " + JSON.stringify(found));
    if (!found.found) { console.log("ОСТАНОВ: панель шторки не найдена (нет кнопки выхода с position:fixed предком)"); await context.close(); continue; }

    const m = JSON.parse(await page.evaluate(MEASURE));
    console.log("шаг 3: ПОРЯДОК СЕКЦИЙ (сверху вниз):");
    for (const k of m.order) console.log("   top=" + String(k.top).padStart(5) + " " + k.tag + "." + k.cls + " | " + k.text);
    console.log("шаг 4: опции языка:");
    for (const o of m.options) console.log("   \"" + o.text + "\" top=" + o.top + " bottom=" + o.bottom + " h=" + o.h + " pressed=" + o.pressed + " clipTop=" + o.clipTop + " clipBottom=" + o.clipBottom + " overlapsSignOut=" + o.overlapsSignOut);
    console.log("   Sign out: top=" + m.signOut.top + " bottom=" + m.signOut.bottom + " подпись=\"" + m.signOutLabel + "\"");
    console.log("   панель: top=" + m.panel.top + " bottom=" + m.panel.bottom + " scrollTop=" + m.scrollTop + " scrollHeight=" + m.scrollHeight + " clientHeight=" + m.clientHeight);

    fs.mkdirSync("e2e/screenshots", { recursive: true });
    await page.screenshot({ path: "e2e/screenshots/sheet-" + lang + "-top.png" });

    console.log("шаг 5: клики по языкам:");
    const names = ["English", "Bahasa Melayu", "العربية"];
    for (const name of names) {
      const btn = page.locator('[role="group"] button', { hasText: name }).first();
      if ((await btn.count()) === 0) { console.log("   \"" + name + "\": кнопка не найдена"); continue; }
      await btn.click();
      await page.waitForTimeout(1200);
      const st = JSON.parse(await page.evaluate("(function(){return JSON.stringify({lang:document.documentElement.lang,dir:document.documentElement.dir,url:location.href});})()"));
      const label = JSON.parse(await page.evaluate(MEASURE));
      console.log("   клик \"" + name + "\": html lang=" + st.lang + " dir=" + st.dir + " | подпись выхода=\"" + label.signOutLabel + "\" | шторка открыта=" + label.found);
    }
    const after = JSON.parse(await page.evaluate(MEASURE));
    await page.evaluate("(function(){var SIGNS=['sign out','log keluar','تسجيل الخروج','keluar'];var btns=Array.prototype.slice.call(document.querySelectorAll('button'));var s=null;for(var i=0;i<btns.length;i++){var t=(btns[i].textContent||'').toLowerCase();for(var j=0;j<SIGNS.length;j++){if(t.indexOf(SIGNS[j])>=0){s=btns[i];break;}}if(s)break;}var p=s;while(p.parentElement&&!(getComputedStyle(p).position==='fixed'&&p.getBoundingClientRect().height>250))p=p.parentElement;p.scrollTop=p.scrollHeight;})()");
    await page.waitForTimeout(900);
    await page.screenshot({ path: "e2e/screenshots/sheet-" + lang + "-bottom.png" });
    console.log("шаг 6: финальный html lang=" + after.htmlLang + " dir=" + after.htmlDir + "; скриншоты сохранены (top, bottom)");
    await context.close();
  }
} catch (error) {
  console.log("ОШИБКА: " + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
} finally {
  await browser.close();
  let removed = 0;
  for (const id of created) { try { await deleteManagedUser(id, { id: founder.id, role: "founder" } as any); removed += 1; } catch (e) { /* noop */ } }
  const all = await db!.select().from(users);
  const left = all.filter(function (u) { return typeof u.email === "string" && (u.email.indexOf("sheet-") === 0 || u.email.indexOf("mh-") === 0 || u.email.indexOf("shell-") === 0 || u.email.indexOf("probe-") === 0); });
  console.log("\nудалено: " + removed + " из " + created.length + "; ОСТАЛОСЬ временных записей в БД: " + left.length);
  process.exit(process.exitCode ? 1 : 0);
}