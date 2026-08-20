import { chromium } from "@playwright/test";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto("http://localhost:3000/admin/login", { waitUntil: "networkidle" });
await page.locator("#founder-email").fill(process.env.FOUNDER_QA_EMAIL);
await page.locator("#founder-password").fill(process.env.FOUNDER_QA_PASSWORD);
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL("**/admin", { timeout: 10000 });
await page.goto("http://localhost:3000/admin/operations", { waitUntil: "networkidle" });
const before = await page.evaluate(() => {
  const element = document.querySelector('[data-slot="sidebar-container"]');
  const inspect = (node) => node ? ({ tag: node.tagName, cls: node.className, position: getComputedStyle(node).position, transform: getComputedStyle(node).transform, top: node.getBoundingClientRect().top }) : null;
  const ancestors = [];
  let node = element?.parentElement;
  while (node) { const style = getComputedStyle(node); ancestors.push({ tag: node.tagName, cls: node.className, transform: style.transform, filter: style.filter, perspective: style.perspective, contain: style.contain, willChange: style.willChange }); node = node.parentElement; }
  return { url: window.location.href, element: inspect(element), parent: inspect(element?.parentElement), grandparent: inspect(element?.parentElement?.parentElement), ancestors };
});
await page.evaluate(() => window.scrollTo(0, 900));
await page.waitForTimeout(150);
const after = await page.evaluate(() => ({ scrollY: window.scrollY, top: document.querySelector('[data-slot="sidebar-container"]')?.getBoundingClientRect().top, position: getComputedStyle(document.querySelector('[data-slot="sidebar-container"]')).position }));
console.log(JSON.stringify({ before, after }, null, 2));
await browser.close();
