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
    expect(layout).toContain('{ label: "Home", href: "/" }');
    expect(layout).toContain('{ label: "News", href: "/news" }');
    expect(layout).toContain("Make an enquiry");
    expect(layout).toContain("simple-public-header--refined");
  });

  it("keeps public journeys task-first and avoids hard-coded storage media in rewritten routes", () => {
    const home = read("pages/Home.tsx");
    const programmes = read("pages/Programs.tsx");
    const contact = read("pages/Contact.tsx");
    expect(home).toContain("Choose a clear next step.");
    expect(home).toContain("simple-home-intro--refined");
    expect(home).toContain("simple-home-intro--desktop-geometry");
    expect(home).toContain("simple-home-intro--mobile-480");
    expect(home).toContain("simple-home-intro--desktop-580");
    expect(home).toContain("simple-home-intro-content--desktop-offset");
    expect(home).toContain("simple-home-intro-content--desktop-geometry");
    expect(home).toContain("simple-home-start-panel");
    expect(home).toContain("simple-contact-strip simple-contact-strip--refined simple-contact-strip--geometry");
    expect(home).not.toContain("simple-contact-strip simple-contact-strip--refined simple-contact-strip--geometry\" style={{backgroundColor");
    expect(home).toContain("simple-home-panel");
    expect(home).not.toContain("manus-storage");
    expect(programmes).toContain("Search by language, level or learner group");
    expect(programmes).toContain("simple-route-header--programmes");
    expect(programmes).toContain("simple-route-header-media");
    expect(programmes).not.toContain("style={{");
    expect(contact).toContain("Get in touch with the centre.");
  });

  it("uses the documented royal-blue public theme and source-confirmed programme guidance", () => {
    const css = read("index.css");
    const programmes = read("pages/Programs.tsx");
    const home = read("pages/Home.tsx");
    const guide = read("lib/siteData.ts");
    expect(css).toContain("2026 minimal blue public theme");
    expect(css).toContain("--bilc-blue: #173fad");
    expect(css).toContain(".simple-programme-guide");
    expect(programmes).toContain("OFFICIAL_PROGRAMME_GUIDE");
    expect(programmes).toContain("2026 fee guide");
    expect(home).toContain("Language options");
    expect(guide).toContain("IELTS Preparation");
    expect(guide).toContain("RM 3,500–RM 9,900");
  });

  it("uses clear touch-target, responsive and restrained workspace foundations", () => {
    const css = read("index.css");
    const dashboard = read("components/DashboardLayout.tsx");
    expect(css).toContain(".simple-public-shell");
    expect(css).toContain("height: calc(100svh - 4.5rem)");
    expect(css).toContain(".simple-home-intro-offset");
    expect(css).toContain("min-height: 3rem");
    expect(css).toContain("@media (max-width: 900px)");
    expect(dashboard).toContain("minimal-sidebar");
    expect(dashboard).toContain("minimal-dashboard-header");
    expect(dashboard).toContain("Sign out");
  });

  it("provides a scoped dynamic grid and non-essential motion fallback across all app surfaces", () => {
    const css = read("index.css");
    expect(css).toContain("Dynamic blue grid and motion layer");
    expect(css).toContain(".simple-public-shell, .auth-page, .member-page");
    expect(css).toContain(".workspace-surface::before");
    expect(css).toContain("background-attachment: fixed");
    expect(css).toContain("animation: bilc-grid-drift");
    expect(css).toContain("Dynamic grid visibility correction");
    expect(css).toContain("background-color: #f8faff");
    expect(css).toContain("Responsive normalization of visual-editor refinements");
    expect(css).toContain("Approved desktop geometry, translated into an adaptive layout");
    expect(css).toContain("width: 1321px");
    expect(css).toContain("Mobile-only Hero height and desktop Home spacing");
    expect(css).toContain("height: 580px");
    expect(css).toContain("Public action spacing from visual editor");
    expect(css).toContain("gap: 25px");
    expect(css).toContain("Desktop Hero size and content position from visual editor");
    expect(css).toContain(".simple-public-header--refined { position: sticky; top: 1rem; z-index: 1000;");
    expect(css).toContain("top: .75rem; width: calc(100% - 2rem);");
    expect(css).toContain(".simple-home-programmes-panel .simple-programme-list, .simple-home-programmes-panel .simple-empty-state { background: #f0f6ff; }");
    expect(css).toContain(".simple-route-header--programmes");
    expect(css).toContain("width: min(100%, 25rem)");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr) minmax(0, 25rem)");
    expect(css).toContain(".simple-home-start-panel, .simple-home-programmes-panel { border: 1px solid var(--bilc-line); }");
    expect(css).toContain("padding-top: 155px");
    expect(css).toContain("transform: translateY(-87px)");
    expect(css).toContain("width: 723px");
    expect(css).toContain("height: 675px");
    expect(css).toContain("@keyframes bilc-page-reveal");
    expect(css).toContain("@keyframes bilc-item-reveal");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important");
  });

  it("keeps the Hero free of the removed 3D floating effect", () => {
    const home = read("pages/Home.tsx");
    const css = read("index.css");
    expect(home).not.toContain("simple-home-intro--floating");
    expect(home).not.toContain("simple-home-intro-content--floating");
    expect(css).not.toContain(".simple-home-intro--floating {");
    expect(css).not.toContain("@keyframes bilc-hero-float");
  });

  it("keeps universal sign-in semantics while using the practical auth surface", () => {
    const login = read("pages/FounderLogin.tsx");
    const css = read("index.css");
    expect(login).toContain("trpc.auth.login.useMutation");
    expect(login).toContain('autoComplete="email"');
    expect(login).toContain('autoComplete="current-password"');
    expect(login).toContain('role="alert"');
    expect(login).toContain("auth-page");
    expect(login).toContain("blue-auth-page");
    expect(css).toContain(".auth-page");
    expect(css).toContain(".auth-submit");
  });

  it("uses shared task-first visual foundations across member and protected dashboards", () => {
    const personal = read("pages/UserDashboard.tsx");
    const admin = read("pages/Admin.tsx");
    const superAdmin = read("pages/SuperAdmin.tsx");
    const audit = read("pages/AuditLogs.tsx");
    const students = read("pages/StudentsProfile.tsx");
    const css = read("index.css");
    expect(personal).toContain("member-page");
    expect(personal).toContain("blue-member-page");
    expect(personal).toContain('redirectPath: "/login"');
    expect(admin).toContain("workspace-page founder-command");
    expect(superAdmin).toContain("workspace-page founder-command");
    expect(audit).toContain("workspace-page founder-command");
    expect(students).toContain("workspace-page founder-command");
    expect(css).toContain(".workspace-page");
    expect(css).toContain("content: none");
    expect(css).toContain("Full-project minimal blue system");
    expect(css).toContain(".blue-workspace");
    const dashboard = read("components/DashboardLayout.tsx");
    expect(dashboard).toContain('className="blue-workspace"');
  });

  it("loads public media by published slot while keeping management restricted to the founder workspace", () => {
    const home = read("pages/Home.tsx");
    const programmes = read("pages/Programs.tsx");
    const detail = read("pages/ProgramDetail.tsx");
    const mediaPage = read("pages/MediaLibrary.tsx");
    const router = read("../../server/routers/media.ts");
    const app = read("App.tsx");
    expect(home).toContain("trpc.media.publicList.useQuery");
    expect(home).toContain('data-hero-video="true"');
    expect(home).toContain('loading="lazy"');
    expect(programmes).toContain('slot === "programmes_listing"');
    expect(detail).toContain('slot === "programme_detail"');
    expect(router).toContain("publicList: publicProcedure");
    expect(router).toContain("upload: founderProcedure");
    expect(router).toContain("update: founderProcedure");
    expect(router).toContain("remove: founderProcedure");
    expect(mediaPage).toContain("DashboardLayout role=\"founder\"");
    expect(app).toContain('path="/admin/media"');
  });

  it("provides a public six-post News grid with accessible modal details and founder-only publishing UI", () => {
    const news = read("pages/News.tsx");
    const manager = read("pages/NewsManager.tsx");
    const router = read("../../server/routers/news.ts");
    const database = read("../../server/db.ts");
    const dashboard = read("components/DashboardLayout.tsx");
    const css = read("index.css");
    expect(news).toContain("trpc.news.publicPage.useQuery");
    expect(news).toContain('aria-haspopup="dialog"');
    expect(news).toContain("news-pagination");
    expect(news).toContain('aria-current={index === page ? "page" : undefined}');
    expect(database).toContain("const pageSize = 6");
    expect(router).toContain("list: founderProcedure");
    expect(router).toContain("create: founderProcedure");
    expect(manager).toContain("trpc.news.create.useMutation");
    expect(manager).toContain("Publish centre updates.");
    expect(dashboard).toContain('label: "News", path: "/admin/news"');
    expect(css).toContain(".news-grid");
    expect(css).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
  });
});
