const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const vp of [{ width: 375, height: 667, path: '/programs' }, { width: 1440, height: 900, path: '/programs' }, { width: 1440, height: 900, path: '/' }]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto('http://localhost:3000' + vp.path, { waitUntil: 'networkidle' });
    const closeBtn = page.locator('button[aria-label*="Close"], button[aria-label*="إغلاق"], button:has-text("Maybe Later")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(600);
    }
    const desktopBar = await page.$('.desktop-quick-actions-bar');
    const mobileBar = await page.$('.mobile-quick-actions-bar');
    console.log(`\n=== VP ${vp.width}x${vp.height} on ${vp.path} ===`);
    if (desktopBar && await desktopBar.isVisible()) {
      const children = await desktopBar.$$(':scope > div > div');
      console.log('Desktop dock visible, children count:', children.length);
      for (let i = 0; i < children.length; i++) {
        const html = await children[i].evaluate(el => el.outerHTML);
        const isGift = html.includes('Gift') || html.includes('15% OFF');
        console.log(`  Desktop Child ${i}: ${isGift ? 'PROMO GIFT' : 'OTHER'}`);
      }
    }
    if (mobileBar && await mobileBar.isVisible()) {
      const children = await mobileBar.$$(':scope > div');
      console.log('Mobile dock visible, children count:', children.length);
      for (let i = 0; i < children.length; i++) {
        const html = await children[i].evaluate(el => el.outerHTML);
        const isGift = html.includes('Gift') || html.includes('15% OFF');
        console.log(`  Mobile Child ${i}: ${isGift ? 'PROMO GIFT' : 'OTHER'}`);
      }
    }
    await page.close();
  }
  await browser.close();
})();

