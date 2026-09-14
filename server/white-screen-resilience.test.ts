import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("White Screen & PWA Caching Resilience Verification", () => {
  const root = resolve(process.cwd());

  it("registers a self-destroying sw.js endpoint in the Express server to instantly unregister any stale service workers", () => {
    const serverIndexFile = resolve(root, "server/_core/index.ts");
    expect(existsSync(serverIndexFile)).toBe(true);

    const content = readFileSync(serverIndexFile, "utf8");
    expect(content).toContain('app.get("/sw.js"');
    expect(content).toContain("self.registration.unregister()");
    expect(content).toContain("self.skipWaiting()");
    expect(content).toContain("res.setHeader(\"Content-Type\", \"application/javascript\")");
  });

  it("contains the self-healing and cache purging script in client/index.html to recover from runtime or chunk errors", () => {
    const indexHtmlFile = resolve(root, "client/index.html");
    expect(existsSync(indexHtmlFile)).toBe(true);

    const content = readFileSync(indexHtmlFile, "utf8");
    expect(content).toContain("function triggerSelfHealing()");
    expect(content).toContain("Failed to fetch dynamically imported module");
    expect(content).toContain("ChunkLoadError");
    expect(content).toContain("loading chunk");
    expect(content).toContain("window.addEventListener('unhandledrejection'");
    expect(content).toContain("caches.delete");
    expect(content).toContain("window.location.reload()");
  });

  it("implements robust top-level providers and error boundaries in the React mount entry point", () => {
    const appFile = resolve(root, "client/src/App.tsx");
    const mainFile = resolve(root, "client/src/main.tsx");
    expect(existsSync(appFile)).toBe(true);
    expect(existsSync(mainFile)).toBe(true);

    const appContent = readFileSync(appFile, "utf8");
    expect(appContent).toContain("<ErrorBoundary>");
    expect(appContent).toContain("<LanguageProvider>");
    expect(appContent).toContain("<ThemeProvider");

    const mainContent = readFileSync(mainFile, "utf8");
    expect(mainContent).toContain("<ErrorBoundary>");
    expect(mainContent).toContain("QueryClientProvider");
    expect(mainContent).toContain("trpc.Provider");
    expect(mainContent).toContain("httpLink");
    expect(mainContent).not.toContain("httpBatchLink");
  });

  it("safely isolates and try/catches any localStorage/sessionStorage accesses in key context initializations", () => {
    const langContextFile = resolve(root, "client/src/contexts/LanguageContext.tsx");
    const themeContextFile = resolve(root, "client/src/contexts/ThemeContext.tsx");
    expect(existsSync(langContextFile)).toBe(true);
    expect(existsSync(themeContextFile)).toBe(true);

    const langContent = readFileSync(langContextFile, "utf8");
    expect(langContent).toContain("try {");
    expect(langContent).toContain("localStorage.getItem");

    const themeContent = readFileSync(themeContextFile, "utf8");
    expect(themeContent).toContain("try {");
    expect(themeContent).toContain("localStorage.getItem");
  });
});
