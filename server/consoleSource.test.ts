import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * C4, исходник-уровень: в оболочке и консоли не осталось дефолта
 * role = "founder", legacy-правила admin-на-founder и чтения роли из URL.
 */

const ROOT = path.resolve(__dirname, "..");
function readSource(rel: string) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");
}

describe("console: исходник не содержит запрещённых паттернов", () => {
  it("DashboardLayout не имеет дефолта role = \"founder\"", () => {
    const src = readSource("client/src/components/DashboardLayout.tsx");
    expect(src).not.toContain('role = "founder"');
  });

  it("DashboardLayout не содержит legacy admin-на-founder правила", () => {
    const src = readSource("client/src/components/DashboardLayout.tsx");
    expect(src).not.toContain('role === "founder" && user.role === "admin"');
  });

  it("redirect-эффект построен на resolveRedirect", () => {
    const src = readSource("client/src/components/DashboardLayout.tsx");
    expect(src).toContain("resolveRedirect(user.role, window.location.pathname)");
  });

  it("useFounderNav игнорирует ?role= из URL", () => {
    const src = readSource("client/src/components/founder/useFounderNav.ts");
    expect(src).toContain('const roleParam = null as PlatformUserType | null;');
    expect(src).not.toContain('searchParams.get("role")');
  });

  it("Admin.tsx больше не рендерит FounderConsole для admin", () => {
    const src = readSource("client/src/pages/Admin.tsx");
    expect(src).not.toContain("FounderConsole");
  });
});