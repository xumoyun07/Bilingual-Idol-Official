import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { auditRotationSchedulePath, handleScheduledAuditRotation } from "../scheduledAuditRotation";
import { handleTeacherAttendance, handleTeacherAttendanceUpdate, handleTeacherClassSessionDetails, handleTeacherClassSessions, teacherAttendancePath, teacherClassSessionsPath } from "../teacherPortal";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  app.post(auditRotationSchedulePath, handleScheduledAuditRotation);
  app.get(teacherClassSessionsPath, handleTeacherClassSessions);
  app.get(`${teacherClassSessionsPath}/:id`, handleTeacherClassSessionDetails);
  app.get(teacherAttendancePath, handleTeacherAttendance);
  app.post(teacherAttendancePath, handleTeacherAttendanceUpdate);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path }) {
        if (error.code === "INTERNAL_SERVER_ERROR") {
          console.error(`[tRPC Error on ${path}]:`, error);
        }
      },
    })
  );

  // Return JSON 404 for any unhandled API or portal routes rather than HTML SPA fallback
  app.all(["/api", "/api/*", "/portal/*", "/storage/*"], (_req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 3000;

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);
