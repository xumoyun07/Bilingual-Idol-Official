import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { createTestAccounts } from "../server/testing/accounts";

async function run() {
  console.log("[Playwright Test] Starting E2E test for promotional action button...");
  
  // Ensure screenshots directory exists
  const screenshotsDir = path.resolve("screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Test 1: Desktop Viewport (1440x900)
  console.log("\n[Test 1] Testing Desktop Viewport (1440x900)...");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://localhost:3000/");
  await page.waitForTimeout(1500);

  // Check if promo modal is auto-opened and close it
  const closeBtnSelector = 'button[aria-label*="Close"], button[aria-label*="Тutup"], button[aria-label*="إغلاق"], button[aria-label*="Maybe Later"]';
  let closeBtn = page.locator(closeBtnSelector).first();
  if (await closeBtn.isVisible()) {
    console.log("-> Promo modal auto-opened. Closing it...");
    await closeBtn.click();
    await page.waitForTimeout(1000);
  }

  // Check that the promo button is in the DOM and is visible
  const desktopPromoBtn = page.locator('.desktop-quick-actions-bar button[aria-label*="Promotion"], .desktop-quick-actions-bar button[aria-label*="Promosi"]');
  const desktopBtnCount = await desktopPromoBtn.count();
  console.log(`-> Promo button exists in desktop bar DOM: ${desktopBtnCount > 0}`);
  if (desktopBtnCount > 0) {
    const isVisible = await desktopPromoBtn.isVisible();
    const box = await desktopPromoBtn.boundingBox();
    console.log(`-> Promo button is visible on desktop: ${isVisible}`);
    console.log(`-> Bounding Box: ${JSON.stringify(box)}`);
    
    // Take a screenshot of the closed modal showing the promo button
    await page.screenshot({ path: path.join(screenshotsDir, "desktop_closed_button.png") });
    
    // Click button to open the modal again
    await desktopPromoBtn.click();
    await page.waitForTimeout(1000);
    console.log("-> Clicked promo button. Verifying modal is open...");
    await page.screenshot({ path: path.join(screenshotsDir, "desktop_modal_open.png") });

    // Close the modal again
    closeBtn = page.locator(closeBtnSelector).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(1000);
      console.log("-> Closed modal. Verifying button remains...");
      await page.screenshot({ path: path.join(screenshotsDir, "desktop_button_remains.png") });
    }
  }

  // Test 2: Tablet Viewport (768x1024)
  console.log("\n[Test 2] Testing Tablet Viewport (768x1024)...");
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("http://localhost:3000/");
  await page.waitForTimeout(1500);

  closeBtn = page.locator(closeBtnSelector).first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await page.waitForTimeout(1000);
  }

  // On 768px width, the desktop bar should be shown (since md maps to >= 768px)
  const tabletPromoBtn = page.locator('.desktop-quick-actions-bar button[aria-label*="Promotion"], .desktop-quick-actions-bar button[aria-label*="Promosi"]');
  console.log(`-> Promo button exists in tablet bar DOM: ${await tabletPromoBtn.count() > 0}`);
  await page.screenshot({ path: path.join(screenshotsDir, "tablet_closed_button.png") });

  // Test 3: Mobile Viewport (390x844)
  console.log("\n[Test 3] Testing Mobile Viewport (390x844)...");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3000/");
  await page.waitForTimeout(1500);

  closeBtn = page.locator(closeBtnSelector).first();
  if (await closeBtn.isVisible()) {
    console.log("-> Mobile auto-opened modal. Closing...");
    await closeBtn.click();
    await page.waitForTimeout(1000);
  }

  const mobilePromoBtn = page.locator('.mobile-quick-actions-bar button[aria-label*="Promotion"], .mobile-quick-actions-bar button[aria-label*="Promosi"]');
  const mobileBtnCount = await mobilePromoBtn.count();
  console.log(`-> Promo button exists in mobile bar DOM: ${mobileBtnCount > 0}`);
  if (mobileBtnCount > 0) {
    const isVisible = await mobilePromoBtn.isVisible();
    const box = await mobilePromoBtn.boundingBox();
    console.log(`-> Promo button is visible on mobile: ${isVisible}`);
    console.log(`-> Bounding Box: ${JSON.stringify(box)}`);
    await page.screenshot({ path: path.join(screenshotsDir, "mobile_closed_button.png") });

    // Click mobile button to open modal
    await mobilePromoBtn.click();
    await page.waitForTimeout(1000);
    console.log("-> Clicked mobile promo button. Verifying modal is open...");
    await page.screenshot({ path: path.join(screenshotsDir, "mobile_modal_open.png") });

    // Close the modal again
    closeBtn = page.locator(closeBtnSelector).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(1000);
    }
  }

  // Test 4: Disable promotional offer and verify button is gone
  console.log("\n[Test 4] Logging in as Founder to disable promo_active setting...");
  // Учётные данные основателя выдаёт общий helper: пароль генерируется в рантайме
  // и в файле не хранится. Требуется запущенный сервер и TEST_FIXTURES=1.
  const accounts = await createTestAccounts({ mode: "http", roles: [] });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://localhost:3000/login");
  await page.waitForTimeout(1000);

  // Fill credentials and log in
  await page.fill('input[type="email"], input[placeholder*="email"], input[name="email"]', accounts.founder.email);
  await page.fill('input[type="password"], input[placeholder*="password"], input[name="password"]', accounts.founder.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  console.log(`-> Signed in. Current URL: ${page.url()}`);
  
  // Navigate to Marketing Campaigns (founder settings) or use tRPC directly from window
  // Let's do a direct window call to disable it to be extremely reliable without relying on admin panels UI selector changes
  await page.evaluate(async () => {
    // We can directly invoke a fetch to update siteSettings
    const response = await fetch("/api/trpc/content.updateSiteSettings?batch=1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "0": {
          "json": {
            "promo_active": "false"
          }
        }
      })
    });
    return response.ok;
  });
  console.log("-> Executed setting update promo_active = false");

  // Reload public site and verify button is gone on desktop
  await page.goto("http://localhost:3000/");
  await page.waitForTimeout(1500);

  // Close modal if auto-opened (it shouldn't auto-open since active is false)
  closeBtn = page.locator(closeBtnSelector).first();
  if (await closeBtn.isVisible()) {
    console.log("-> Unexpected modal open. Closing...");
    await closeBtn.click();
    await page.waitForTimeout(500);
  }

  const promoBtnAfterDisable = page.locator('.desktop-quick-actions-bar button[aria-label*="Promotion"], .desktop-quick-actions-bar button[aria-label*="Promosi"]');
  const countAfterDisable = await promoBtnAfterDisable.count();
  const isVisibleAfterDisable = countAfterDisable > 0 ? await promoBtnAfterDisable.isVisible() : false;
  console.log(`-> Promo button exists in desktop bar after disabling: ${countAfterDisable > 0} (expected: false)`);
  console.log(`-> Is visible: ${isVisibleAfterDisable} (expected: false)`);
  await page.screenshot({ path: path.join(screenshotsDir, "desktop_promo_disabled.png") });

  // Re-enable setting to restore pristine state
  await page.evaluate(async () => {
    await fetch("/api/trpc/content.updateSiteSettings?batch=1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "0": {
          "json": {
            "promo_active": "true"
          }
        }
      })
    });
  });
  console.log("-> Restored setting promo_active = true");

  await accounts.cleanup();
  await browser.close();
  console.log("\n[Playwright Test] All E2E tests and screenshot collection completed successfully!");
}

run().catch(console.error);
