import { expect, test } from "@playwright/test";
import { createTestAccounts, type TestAccounts } from "../server/testing/accounts";

/**
 * Оболочка дашборда: проверки (a)-(e) и сохранение языка при редиректе.
 *
 * Учётную запись студента выдаёт общий helper server/testing/accounts.ts:
 * пароль генерируется в рантайме и нигде не печатается и не хранится.
 * Требуются запущенный сервер, TEST_FIXTURES=1 и TEST_FOUNDER_PASSWORD.
 */

const SHELL_GAP = 16;
const TOL = 1.5;

/** Мобильный брейкпоинт проекта — 768px (hooks/use-mobile.tsx). */
const MOBILE_BREAKPOINT = 768;

let accounts: TestAccounts;

test.beforeAll(async () => {
  accounts = await createTestAccounts({ mode: "http", roles: ["student"] });
});

test.afterAll(async () => {
  await accounts?.cleanup();
});

async function loginAsStudent(page: import("@playwright/test").Page) {
  const student = accounts.get("student");
  await page.goto("/login", { waitUntil: "load" });
  await page.evaluate(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch { /* noop */ }
  });
  await page.fill("#sign-in-email", student.email);
  await page.fill("#sign-in-password", student.password);
  await Promise.all([
    page.waitForNavigation({ timeout: 30_000 }).catch(() => undefined),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(3000);
}

async function openDashboard(page: import("@playwright/test").Page, lang: "ms" | "ar") {
  await page.goto("/dashboard", { waitUntil: "load" });
  await page.waitForTimeout(1000);
  await page.evaluate((l) => {
    try { localStorage.setItem("bilc_language", l); } catch { /* noop */ }
    document.cookie = `bilc_language=${l}; path=/`;
  }, lang);
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(2500);
  // Промо-окно может перекрывать замеры
  for (const sel of ['button:has-text("Maybe Later")', 'button:has-text("Mungkin Nanti")', 'button:has-text("ربما لاحقاً")']) {
    const btn = page.locator(sel).first();
    if ((await btn.count()) > 0 && (await btn.isVisible())) {
      await btn.click().catch(() => undefined);
      await page.waitForTimeout(500);
      break;
    }
  }
}

function shellMetrics() {
  const rect = (el: Element | null) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), width: Math.round(b.width), height: Math.round(b.height) };
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
  return {
    isRTL,
    vw,
    vh,
    sidebar: sb,
    topbar: tb,
    card: cd,
    sidebarTopGap: sb ? sb.top : null,
    sidebarBottomGap: sb ? vh - sb.bottom : null,
    sidebarStartGap: sb ? (isRTL ? vw - sb.right : sb.left) : null,
    topbarTop: tb ? tb.top : null,
    sidebarVsCardIntersect: Boolean(sb && cd && sb.left < cd.right && sb.right > cd.left && sb.top < cd.bottom && sb.bottom > cd.top),
    desktopTopbarCount: document.querySelectorAll("header.bilc-floating-header").length,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
  };
}

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "1024", width: 1024, height: 768 },
  { name: "390", width: 390, height: 844 },
];

for (const lang of ["ms", "ar"] as const) {
  for (const vp of VIEWPORTS) {
    test(`оболочка дашборда: ${lang} @ ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginAsStudent(page);
      await openDashboard(page, lang);

      const m = await page.evaluate(shellMetrics);

      // (e) На мобильном десктопного топбара нет в DOM вовсе
      if (vp.width < MOBILE_BREAKPOINT) {
        expect(m.desktopTopbarCount, "десктопный топбар не должен рендериться на мобильном").toBe(0);
        expect(m.horizontalOverflow, "не должно быть горизонтального переполнения").toBe(false);
        return;
      }

      // Сайдбар виден на 1024 и 1440
      expect(m.sidebar, "сайдбар должен присутствовать").not.toBeNull();
      expect(m.topbar, "топбар должен присутствовать").not.toBeNull();

      // (a) верхний зазор сайдбара = нижний = верхний зазор топбара = --shell-gap
      expect(Math.abs(m.sidebarTopGap! - SHELL_GAP), `верхний зазор сайдбара ${m.sidebarTopGap}`).toBeLessThanOrEqual(TOL);
      expect(Math.abs(m.sidebarBottomGap! - SHELL_GAP), `нижний зазор сайдбара ${m.sidebarBottomGap}`).toBeLessThanOrEqual(TOL);
      expect(Math.abs(m.topbarTop! - SHELL_GAP), `верхний зазор топбара ${m.topbarTop}`).toBeLessThanOrEqual(TOL);

      // (b) зазор до ближайшего края окна одинаков в LTR и RTL
      expect(Math.abs(m.sidebarStartGap! - SHELL_GAP), `зазор сайдбара до края ${m.sidebarStartGap} (rtl=${m.isRTL})`).toBeLessThanOrEqual(TOL);

      // (c) края топбара совпадают с краями карточки
      expect(Math.abs(m.topbar!.left - m.card!.left), `левый край: топбар ${m.topbar!.left} vs карточка ${m.card!.left}`).toBeLessThanOrEqual(1);
      expect(Math.abs(m.topbar!.right - m.card!.right), `правый край: топбар ${m.topbar!.right} vs карточка ${m.card!.right}`).toBeLessThanOrEqual(1);

      // (d) на планшете сайдбар не пересекает карточку
      if (vp.width === 1024) {
        expect(m.sidebarVsCardIntersect, "сайдбар не должен пересекать карточку на 1024").toBe(false);
      }
    });
  }
}

for (const lang of ["ar", "ms"] as const) {
  test(`язык сохраняется при редиректе на запрещённый маршрут (${lang})`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAsStudent(page);
    await openDashboard(page, lang);
    expect(await page.evaluate(() => document.documentElement.lang)).toBe(lang);

    // Запрещённый для студента маршрут — уводит обратно на /dashboard
    await page.goto("/teacher", { waitUntil: "load" });
    await page.waitForTimeout(2500);

    expect(page.url()).toContain("/dashboard");
    expect(await page.evaluate(() => document.documentElement.lang), `язык после редиректа (${lang})`).toBe(lang);
  });
}
