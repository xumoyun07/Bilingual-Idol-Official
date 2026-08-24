import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "client/src");
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), "utf8");

describe("frontend redesign", () => {
  it("uses project-storage media with descriptive alternative text on redesigned public routes", () => {
    const home = read("pages/Home.tsx");
    const programmes = read("pages/Programs.tsx");
    const contact = read("pages/Contact.tsx");

    expect(home).toContain('/manus-storage/bilingual-idol-hero-reference_4aa89f37.jpg');
    expect(home).toContain('alt="Learners and a teacher collaborating during a language activity"');
    expect(programmes).toContain('/manus-storage/bilingual-idol-programme-vignette_4d9bc18a.jpg');
    expect(contact).toContain('/manus-storage/bilingual-idol-contact-vignette_1b87f154.jpg');
  });

  it("keeps visual media performance-aware and preserves responsive public controls", () => {
    const home = read("pages/Home.tsx");
    const layout = read("components/PublicLayout.tsx");
    const css = read("index.css");

    expect(home).toContain('fetchPriority="high"');
    expect(home).toContain('loading="lazy"');
    expect(layout).toContain('aria-expanded={open}');
    expect(layout).toContain('aria-label={open ? "Close navigation" : "Open navigation"}');
    expect(css).toContain('@media (max-width: 639px)');
    expect(css).toContain('prefers-reduced-motion: no-preference');
  });

  it("applies a consistent, touch-friendly shared visual language across public and personal surfaces", () => {
    const css = read("index.css");
    const dashboard = read("pages/UserDashboard.tsx");

    expect(css).toContain('.atlas-button-primary, .atlas-button-secondary');
    expect(css).toContain('min-height: 3rem');
    expect(css).toContain('.atlas-dashboard-surface');
    expect(dashboard).toContain('atlas-dashboard-surface');
    expect(dashboard).toContain('min-h-12');
  });
});
