import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import superjson from "superjson";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

function getCurrentBrowserHash(): string | null {
  try {
    const metaPath = path.resolve(
      import.meta.dirname,
      "../../node_modules/.vite/deps/_metadata.json"
    );
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      return meta.browserHash || null;
    }
  } catch {}
  return null;
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  // Intercept requests to Vite deps to prevent stale browser caches and 504 Outdated Dep errors
  app.use((req, res, next) => {
    const currentHash = getCurrentBrowserHash();
    if (currentHash && typeof req.url === "string" && (req.url.includes("/.vite/deps/") || req.url.includes("react-dom") || req.url.includes("@trpc"))) {
      const vMatch = req.url.match(/[?&]v=([^&]+)/);
      if (vMatch && vMatch[1] !== currentHash) {
        req.url = req.url.replace(/[?&]v=[^&]+/, (match) =>
          match.startsWith("?") ? `?v=${currentHash}` : `&v=${currentHash}`
        );
      }
    }

    // In dev mode, prevent Vite from sending immutable / long-lived cache headers
    const originalSetHeader = res.setHeader.bind(res);
    res.setHeader = function (name: string, value: any) {
      if (typeof name === "string" && name.toLowerCase() === "cache-control") {
        return originalSetHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
      }
      return originalSetHeader(name, value);
    };

    next();
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    if (url.startsWith("/api") || url.startsWith("/portal") || url.startsWith("/storage")) {
      if (url.startsWith("/api/trpc")) {
        return res.status(404).json({
          error: superjson.serialize({
            message: "API endpoint not found (404)",
            code: -32604,
            data: { code: "NOT_FOUND", httpStatus: 404 },
          }),
        });
      }
      return res.status(404).json({ error: "Endpoint not found" });
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({
        "Content-Type": "text/html",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
        "Clear-Site-Data": '"cache"',
      }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (req, res) => {
    if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/portal") || req.originalUrl.startsWith("/storage")) {
      if (req.originalUrl.startsWith("/api/trpc")) {
        return res.status(404).json({
          error: superjson.serialize({
            message: "API endpoint not found (404)",
            code: -32604,
            data: { code: "NOT_FOUND", httpStatus: 404 },
          }),
        });
      }
      return res.status(404).json({ error: "Endpoint not found" });
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
