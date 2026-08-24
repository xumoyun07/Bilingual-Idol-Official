import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "client/src");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("minimal frontend rewrite", () => {
  it("uses a shared practical public shell with accessible desktop and mobile navigation", () => {
    const layout = read("components/PublicLayout.tsx");
    expect(layout).toContain('href="#main-content"');
    expect(layout).toContain('aria-label={open ? "Close navigation" : "Open navigation"}');
    expect(layout).toContain('aria-label="Mobile navigation"');
    expect(layout).toContain("Programmes");
    expect(layout).toContain("Make an enquiry");
  });

  it("keeps public journeys task-first and removes media-led decoration from rewritten routes", () => {
    const home = read("pages/Home.tsx");
    const programmes = read("pages/Programs.tsx");
    const contact = read("pages/Contact.tsx");
    expect(home).toContain("What do you need today?");
    expect(home).not.toContain("manus-storage");
    expect(programmes).toContain("Search by language, level or learner group");
    expect(contact).toContain("Get in touch with the centre.");
  });

  it("uses clear touch-target, responsive and restrained workspace foundations", () => {
    const css = read("index.css");
    const dashboard = read("components/DashboardLayout.tsx");
    expect(css).toContain(".simple-public-shell");
    expect(css).toContain("min-height: 3rem");
    expect(css).toContain("@media (max-width: 900px)");
    expect(dashboard).toContain("minimal-sidebar");
    expect(dashboard).toContain("minimal-dashboard-header");
    expect(dashboard).toContain("Sign out");
  });
});
