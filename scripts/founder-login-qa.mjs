import { chromium } from "@playwright/test";

let password = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", chunk => { password += chunk; });
process.stdin.on("end", async () => {
  const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  try {
    await page.goto("http://localhost:3000/admin/login", { waitUntil: "networkidle" });
    await page.getByLabel("E-mail").fill("not-founder@example.com");
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("incorrect-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByRole("alert", { name: "" }).waitFor({ state: "visible", timeout: 10000 });
    await page.getByLabel("E-mail").fill("lektor0780@gmail.com");
    await page.getByRole("textbox", { name: "Password", exact: true }).fill(password.trimEnd());
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("**/admin", { timeout: 10000 });
    await page.getByRole("heading", { name: "Founder dashboard" }).waitFor({ state: "visible", timeout: 10000 });
    console.log(JSON.stringify({ founderLogin: "passed" }));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
});
