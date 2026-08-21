import { chromium } from "@playwright/test";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open navigation" }).click();
  const menu = page.getByRole("navigation", { name: "Mobile navigation" });
  await menu.waitFor({ state: "visible", timeout: 10000 });
  const snapshot = await menu.evaluate(element => {
    const link = element.querySelector('a[href="/"]');
    const login = element.querySelector('a[href="/login"]');
    const enroll = element.querySelector('a[href="/enroll"]');
    const style = (node) => node ? getComputedStyle(node) : null;
    return {
      background: style(element)?.backgroundColor,
      linkColor: style(link)?.color,
      loginBackground: style(login)?.backgroundColor,
      loginColor: style(login)?.color,
      enrollBackground: style(enroll)?.backgroundColor,
      enrollColor: style(enroll)?.color,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
  if (snapshot.background !== "rgb(16, 37, 62)") throw new Error(`Expected ink mobile menu background; received ${snapshot.background}`);
  if (snapshot.linkColor !== "rgb(255, 255, 255)") throw new Error(`Expected white mobile navigation text; received ${snapshot.linkColor}`);
  if (snapshot.loginBackground !== "rgb(255, 255, 255)" || snapshot.loginColor !== "rgb(16, 37, 62)") throw new Error("Login CTA does not retain readable light-button contrast");
  if (snapshot.enrollBackground !== "rgb(239, 121, 91)" || snapshot.enrollColor !== "rgb(16, 37, 62)") throw new Error("Enroll CTA does not retain readable apricot-button contrast");
  if (snapshot.horizontalOverflow) throw new Error("Mobile menu introduces horizontal overflow");
  await page.screenshot({ path: "/home/ubuntu/bilingual-idol-platform/mobile-menu-visual-qa.png", fullPage: false });
  console.log(JSON.stringify({ status: "passed", snapshot }, null, 2));
} finally {
  await browser.close();
}
