import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "client/src");
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), "utf8");

describe("public accessibility structure", () => {
  it("provides a skip link and stable semantic content target", () => {
    const layout = read("components/PublicLayout.tsx");
    expect(layout).toContain('href="#main-content"');
    expect(layout).toContain('id="main-content"');
  });

  it("defines keyboard focus and reduced-motion behaviour", () => {
    const css = read("index.css");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("connects form validation feedback to accessible control state", () => {
    const form = read("components/LeadForm.tsx");
    expect(form).toContain("aria-invalid");
    expect(form).toContain("aria-describedby");
    expect(form).toContain('role="alert"');
  });

  it("uses button-based, labelled navigation controls in the Founder sidebar", () => {
    const dashboard = read("components/DashboardLayout.tsx");
    expect(dashboard).toContain("<SidebarMenuButton");
    expect(dashboard).toContain("tooltip={item.label}");
    expect(dashboard).toContain("onClick={() => setLocation(item.path)}");
  });

  it("exposes loading, success, and error feedback across Founder learning management routes", () => {
    for (const relativePath of ["pages/FounderLearningData.tsx", "pages/FounderOperations.tsx"]) {
      const page = read(relativePath);
      expect(page).toContain("skeleton-shimmer");
      expect(page).toContain('role="status"');
      expect(page).toContain('role="alert"');
    }
  });
});
