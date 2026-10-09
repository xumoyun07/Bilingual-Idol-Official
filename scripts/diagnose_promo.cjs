const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = {};

  for (const vp of [{ width: 1440, height: 900, name: '1440x900' }, { width: 390, height: 844, name: '390x844' }]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Find and close modal
    const closeBtn = page.locator('button[aria-label*="Close"], button[aria-label*="إغلاق"], button:has-text("Maybe Later")').first();
    const modalWasOpen = await closeBtn.isVisible();
    if (modalWasOpen) {
      await closeBtn.click();
      await page.waitForTimeout(600);
    }

    if (!fs.existsSync('screenshots')) {
      fs.mkdirSync('screenshots', { recursive: true });
    }
    const ssPath = 'screenshots/diag_' + vp.name + '.png';
    await page.screenshot({ path: ssPath, fullPage: false });

    // Desktop bar
    const desktopBar = await page.$('.desktop-quick-actions-bar');
    let desktopData = null;
    if (desktopBar) {
      const computed = await page.evaluate(el => {
        const s = window.getComputedStyle(el);
        return { display: s.display, visibility: s.visibility, opacity: s.opacity, position: s.position, zIndex: s.zIndex };
      }, desktopBar);
      const rect = await desktopBar.boundingBox();
      const children = await desktopBar.$$(':scope > div > div');
      const childrenData = [];
      for (const ch of children) {
        const cComputed = await page.evaluate(el => {
          const s = window.getComputedStyle(el);
          return { display: s.display, visibility: s.visibility, opacity: s.opacity, position: s.position, zIndex: s.zIndex };
        }, ch);
        const cRect = await ch.boundingBox();
        const html = await ch.evaluate(el => el.outerHTML);
        const isGift = html.includes('Gift') || html.includes('15% OFF') || html.includes('lucide-gift') || html.includes('Promotions');
        const isPhone = html.includes('tel:');
        const isWa = html.includes('bilc-wa');
        childrenData.push({
          type: isGift ? 'gift/promo' : isPhone ? 'phone' : isWa ? 'whatsapp' : 'other',
          computed: cComputed,
          rect: cRect,
          htmlPreview: html.slice(0, 150)
        });
      }
      desktopData = { isVisible: await desktopBar.isVisible(), computed, rect, children: childrenData };
    }

    // Mobile bar
    const mobileBar = await page.$('.mobile-quick-actions-bar');
    let mobileData = null;
    if (mobileBar) {
      const computed = await page.evaluate(el => {
        const s = window.getComputedStyle(el);
        return { display: s.display, visibility: s.visibility, opacity: s.opacity, position: s.position, zIndex: s.zIndex };
      }, mobileBar);
      const rect = await mobileBar.boundingBox();
      const children = await mobileBar.$$(':scope > div');
      const childrenData = [];
      for (const ch of children) {
        const cComputed = await page.evaluate(el => {
          const s = window.getComputedStyle(el);
          return { display: s.display, visibility: s.visibility, opacity: s.opacity, position: s.position, zIndex: s.zIndex };
        }, ch);
        const cRect = await ch.boundingBox();
        const html = await ch.evaluate(el => el.outerHTML);
        const isGift = html.includes('Gift') || html.includes('15% OFF') || html.includes('lucide-gift') || html.includes('Promotions');
        const isPhone = html.includes('tel:');
        const isWa = html.includes('bilc-wa');
        const isScroll = html.includes('Scroll') || html.includes('scroll-top');
        childrenData.push({
          type: isGift ? 'gift/promo' : isPhone ? 'phone' : isWa ? 'whatsapp' : isScroll ? 'scroll_top' : 'other',
          computed: cComputed,
          rect: cRect,
          htmlPreview: html.slice(0, 150)
        });
      }
      mobileData = { isVisible: await mobileBar.isVisible(), computed, rect, children: childrenData };
    }

    results[vp.name] = { modalWasOpen, desktopData, mobileData, ssPath };
    await page.close();
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})();
