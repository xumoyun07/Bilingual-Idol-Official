import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const WHITELIST = [
  "Bilingual Idol",
  "BILC",
  "Pavilion Embassy",
  "IELTS",
  "MOHE",
  "WhatsApp",
  "Merdeka Special Discount",
  "MERDEKA2026",
  "WELCOME50",
  "RM",
  "OTP"
];
// Адреса электронной почты отдельно перечислять не нужно: строки с "@"
// пропускаются правилом ниже. Сид-учётки из server/db.ts отсюда удалены.

function isWhitelisted(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  // Numbers, phone numbers, and symbols are fine
  if (/^[0-9+ \-().,:&%]+$/.test(t)) return true;
  // Emails
  if (/@/.test(t)) return true;
  // Explicit whitelist match
  if (WHITELIST.some(w => t.toLowerCase().includes(w.toLowerCase()))) return true;
  return false;
}

async function run() {
  console.log("[Playwright Audit] Starting Latin text scan for MS and AR locales...");

  const browser = await chromium.launch();
  
  const pages = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Programs", path: "/programs" },
    { name: "Program Detail", path: "/programs/general-english" },
    { name: "News", path: "/news" },
    { name: "Contact", path: "/contact" },
    { name: "Enroll", path: "/enroll" },
    { name: "Login", path: "/login" },
    { name: "404", path: "/non-existent" }
  ];

  const locales = ["ms", "ar"];
  const viewports = [
    { name: "Desktop", width: 1440, height: 900 },
    { name: "Mobile", width: 390, height: 844 }
  ];

  const results: any[] = [];

  for (const locale of locales) {
    for (const vp of viewports) {
      console.log(`\n=== Scanning Locale: [${locale.toUpperCase()}] | Viewport: [${vp.name}] ===`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height }
      });

      // Clear localStorage and set language before navigation
      await context.addInitScript(`window.localStorage.clear(); window.localStorage.setItem("bilc_language", "${locale}");`);

      const page = await context.newPage();

      for (const p of pages) {
        console.log(`Scanning page: ${p.name} (${p.path})`);
        await page.goto(`http://localhost:3000${p.path}`);
        await page.waitForTimeout(1000); // Wait for translation loading and queries

        // Trigger optional modal/error states
        if (p.name === "Enroll") {
          // Submit form to trigger validation errors
          const submitBtn = page.locator('button[type="submit"]').first();
          if (await submitBtn.isVisible()) {
            await submitBtn.click();
            await page.waitForTimeout(500);
            console.log("-> Clicked enroll submit to trigger validation errors");
          }
        } else if (p.name === "Login") {
          // Submit form to trigger validation errors
          const submitBtn = page.locator('button[type="submit"]').first();
          if (await submitBtn.isVisible()) {
            await submitBtn.click();
            await page.waitForTimeout(500);
            console.log("-> Clicked login submit to trigger validation errors");
          }
        }

        // Handle auto-open promo popup or open it
        const closeBtnSelector = 'button[aria-label*="Close"], button[aria-label*="Тutup"], button[aria-label*="إغلاق"], button[aria-label*="Maybe Later"]';
        const closeBtn = page.locator(closeBtnSelector).first();
        if (await closeBtn.isVisible()) {
          console.log("-> Promo modal is visible on page. Extracting content...");
        }

        // Extract all visible text nodes containing Latin characters via IIFE string
        const textNodes = await page.evaluate(`(() => {
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: (node) => {
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;
                const style = window.getComputedStyle(parent);
                if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
                  return NodeFilter.FILTER_REJECT;
                }
                const text = node.textContent?.trim() || "";
                // Match any letters of the alphabet [A-Za-z]
                if (/[A-Za-z]/.test(text)) {
                  return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_REJECT;
              }
            }
          );

          const texts = [];
          let node;
          while ((node = walker.nextNode())) {
            texts.push({
              text: node.textContent?.trim() || "",
              tagName: node.parentElement?.tagName || "",
              className: node.parentElement?.className || "",
              id: node.parentElement?.id || ""
            });
          }
          return texts;
        })()`) as any[];

        // Filter and collect results
        for (const item of textNodes) {
          if (!isWhitelisted(item.text)) {
            results.push({
              locale,
              viewport: vp.name,
              page: p.name,
              path: p.path,
              tag: item.tagName,
              class: item.className,
              text: item.text
            });
          }
        }
      }
      await context.close();
    }
  }

  await browser.close();

  // Deduplicate and group results by page/component
  const uniqueResults = results.reduce((acc: any[], current) => {
    const x = acc.find(item => item.text === current.text && item.page === current.page && item.locale === current.locale);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);

  fs.writeFileSync("audit_latin_scan.json", JSON.stringify(uniqueResults, null, 2), "utf-8");
  console.log(`\n[Playwright Audit] Scan complete! Found ${uniqueResults.length} unique untranslated Latin texts.`);
  console.log("Grouped summary written to audit_latin_scan.json");
}

run().catch(console.error);
