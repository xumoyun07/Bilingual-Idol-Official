// Исполняемая проверка оболочки дашборда. Запуск:
//   TEST_FIXTURES=1 TEST_FOUNDER_PASSWORD=<пароль основателя> npx tsx e2e/run-shell-checks.ts
// Печатает таблицу PASS/FAIL по критериям (a)-(e) и код возврата 1 при провале.
//
// Учётные записи выдаёт общий helper server/testing/accounts.ts в режиме http:
// пароли генерируются в рантайме и нигде не хранятся. Пароль основателя helper
// не придумывает — он берётся из TEST_FOUNDER_PASSWORD, потому что хеш задаётся
// уже запущенному серверу снаружи.
import { chromium } from "playwright";
import { createTestAccounts } from "../server/testing/accounts";

const BASE = process.env.TEST_BASE_URL || process.env.DSH_BASE_URL || "http://127.0.0.1:3000";
const SHELL_GAP = 16;
const TOL = 1.5;
const MOBILE_BREAKPOINT = 768;

type ShellMetrics = {
  isRTL: boolean;
  vw: number;
  sbVisible: boolean;
  tbVisible: boolean;
  sidebarTopGap: number | null;
  sidebarBottomGap: number | null;
  sidebarStartGap: number | null;
  topbarTop: number | null;
  tbLeft: number | null;
  tbRight: number | null;
  cdLeft: number | null;
  cdRight: number | null;
  intersect: boolean;
  topbarCount: number;
  overflow: boolean;
};

async function login(page: import("playwright").Page, email: string, password: string) {
  await page.goto(`${BASE}/login`, { waitUntil: "load", timeout: 60000 });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* noop */
    }
  });
  await page.waitForTimeout(1200);
  await page.fill("#sign-in-email", email);
  await page.fill("#sign-in-password", password);
  await Promise.all([
    page.waitForNavigation({ timeout: 30000 }).catch(() => undefined),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(3500);
}

async function openDashboard(page: import("playwright").Page, lang: string) {
  await page.goto(`${BASE}/dashboard`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.evaluate(
    l => {
      try {
        localStorage.setItem("bilc_language", l);
      } catch {
        /* noop */
      }
      document.cookie = `bilc_language=${l}; path=/`;
    },
    lang,
  );
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(2800);
  for (const sel of ['button:has-text("Maybe Later")', 'button:has-text("Mungkin Nanti")', 'button:has-text("ربما لاحقاً")']) {
    const el = page.locator(sel).first();
    if ((await el.count()) > 0 && (await el.isVisible())) {
      await el.click().catch(() => undefined);
      await page.waitForTimeout(500);
      break;
    }
  }
}

function shellMetrics(): ShellMetrics {
  const rect = (el: Element | null) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right) };
  };
  const sidebar = document.querySelector(".bilc-floating-sidebar");
  const topbar = document.querySelector("header.bilc-floating-header");
  const main = document.querySelector("main.bilc-dashboard-main");
  const card = document.querySelector("[data-page]") || (main ? main.firstElementChild : null);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isRTL = document.documentElement.dir === "rtl";
  const sb = rect(sidebar);
  const tb = rect(topbar);
  const cd = rect(card);
  const visible = (el: Element | null) => Boolean(el && el.getBoundingClientRect().width > 0);
  return {
    isRTL,
    vw,
    sbVisible: visible(sidebar),
    tbVisible: visible(topbar),
    sidebarTopGap: sb && visible(sidebar) ? sb.top : null,
    sidebarBottomGap: sb && visible(sidebar) ? vh - sb.bottom : null,
    sidebarStartGap: sb && visible(sidebar) ? (isRTL ? vw - sb.right : sb.left) : null,
    topbarTop: tb && visible(topbar) ? tb.top : null,
    tbLeft: tb ? tb.left : null,
    tbRight: tb ? tb.right : null,
    cdLeft: cd ? cd.left : null,
    cdRight: cd ? cd.right : null,
    intersect: Boolean(
      sb && cd && visible(sidebar) && sb.left < cd.right && sb.right > cd.left && sb.top < cd.bottom && sb.bottom > cd.top,
    ),
    topbarCount: document.querySelectorAll("header.bilc-floating-header").length,
    overflow: document.documentElement.scrollWidth > window.innerWidth,
  };
}

const results: { name: string; pass: boolean; detail: string }[] = [];
const add = (name: string, pass: boolean, detail: string) => results.push({ name, pass, detail });

const accounts = await createTestAccounts({ mode: "http", roles: ["student"], baseUrl: BASE });
const student = accounts.get("student");

const browser = await chromium.launch();

try {
  for (const lang of ["ms", "ar"]) {
    for (const vp of [
      { n: "1440", w: 1440, h: 900 },
      { n: "1024", w: 1024, h: 768 },
      { n: "390", w: 390, h: 844 },
    ]) {
      const ctx = await browser.newContext({
        viewport: { width: vp.w, height: vp.h },
        isMobile: vp.w < MOBILE_BREAKPOINT,
        hasTouch: vp.w < MOBILE_BREAKPOINT,
      });
      const page = await ctx.newPage();
      await login(page, student.email, student.password);
      await openDashboard(page, lang);
      const m = await page.evaluate(shellMetrics);

      if (vp.w < MOBILE_BREAKPOINT) {
        add(`${lang}@${vp.n} (e) топбара нет в DOM`, m.topbarCount === 0, `topbarCount=${m.topbarCount}`);
        add(`${lang}@${vp.n} (e) нет переполнения`, m.overflow === false, `overflow=${m.overflow}`);
        await ctx.close();
        continue;
      }

      add(
        `${lang}@${vp.n} (a) верхний зазор сайдбара = ${SHELL_GAP}`,
        m.sidebarTopGap !== null && Math.abs(m.sidebarTopGap - SHELL_GAP) <= TOL,
        `получено ${m.sidebarTopGap}`,
      );
      add(
        `${lang}@${vp.n} (a) нижний зазор сайдбара = ${SHELL_GAP}`,
        m.sidebarBottomGap !== null && Math.abs(m.sidebarBottomGap - SHELL_GAP) <= TOL,
        `получено ${m.sidebarBottomGap}`,
      );
      add(
        `${lang}@${vp.n} (a) верхний зазор топбара = ${SHELL_GAP}`,
        m.topbarTop !== null && Math.abs(m.topbarTop - SHELL_GAP) <= TOL,
        `получено ${m.topbarTop}`,
      );
      add(
        `${lang}@${vp.n} (b) зазор сайдбара до края = ${SHELL_GAP}`,
        m.sidebarStartGap !== null && Math.abs(m.sidebarStartGap - SHELL_GAP) <= TOL,
        `получено ${m.sidebarStartGap} (rtl=${m.isRTL})`,
      );
      add(
        `${lang}@${vp.n} (c) левый край топбара = край карточки`,
        Math.abs((m.tbLeft ?? NaN) - (m.cdLeft ?? NaN)) <= 1,
        `топбар ${m.tbLeft} vs карточка ${m.cdLeft}`,
      );
      add(
        `${lang}@${vp.n} (c) правый край топбара = край карточки`,
        Math.abs((m.tbRight ?? NaN) - (m.cdRight ?? NaN)) <= 1,
        `топбар ${m.tbRight} vs карточка ${m.cdRight}`,
      );
      if (vp.w === 1024) {
        add(`${lang}@${vp.n} (d) сайдбар не пересекает карточку`, m.intersect === false, `пересечение=${m.intersect}`);
      }

      await ctx.close();
    }
  }

  // Сохранение языка при редиректе
  for (const lang of ["ar", "ms"]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await login(page, student.email, student.password);
    await openDashboard(page, lang);
    const before = await page.evaluate(() => document.documentElement.lang);
    await page.goto(`${BASE}/teacher`, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(2500);
    const after = await page.evaluate(() => ({ lang: document.documentElement.lang, path: location.pathname }));
    add(`редирект ${lang}: lang сохраняется`, before === lang && after.lang === lang, `до=${before} после=${after.lang} путь=${after.path}`);
    await ctx.close();
  }
} finally {
  await browser.close();
  await accounts.cleanup();
}

const failed = results.filter(r => !r.pass);
console.log("\n=== РЕГРЕССИОННЫЕ ПРОВЕРКИ ОБОЛОЧКИ ===");
for (const r of results) console.log(`  ${r.pass ? "PASS" : "FAIL"}  ${r.name.padEnd(52)} ${r.detail}`);
console.log(`\nитого: ${results.length - failed.length} PASS, ${failed.length} FAIL`);

if (failed.length) process.exit(1);
