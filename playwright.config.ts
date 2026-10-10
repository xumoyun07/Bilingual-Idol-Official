import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright для проверок оболочки дашборда.
 * Сервер разработки уже поднят на 127.0.0.1:3000 — конфиг его переиспользует.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.DSH_BASE_URL || "http://127.0.0.1:3000",
    trace: "off",
    screenshot: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
