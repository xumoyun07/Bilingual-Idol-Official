import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import superjson from "superjson";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { auditRotationSchedulePath, handleScheduledAuditRotation } from "../scheduledAuditRotation";
import { handleTeacherAttendance, handleTeacherAttendanceUpdate, handleTeacherClassSessionDetails, handleTeacherClassSessions, teacherAttendancePath, teacherClassSessionsPath } from "../teacherPortal";
import { marketingPortalRouter } from "../portal/marketingPortal";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleBillplzCallback, handleBillplzRedirect } from "../paymentsWebhook";

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
  // Billplz routes
  app.post("/api/payments/callback", handleBillplzCallback);
  app.get("/api/payments/redirect", handleBillplzRedirect);

  if (process.env.NODE_ENV !== "production") {
    app.get("/payment/simulated-gateway", (req, res) => {
      const { billId, amount } = req.query;
      const amountMYR = (Number(amount) / 100).toFixed(2);
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>BILC Simulated Payment Gateway</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body class="bg-gray-50 flex items-center justify-center min-h-screen">
          <div class="bg-white p-8 rounded-xl shadow-md max-w-md w-full border border-gray-200">
            <h2 class="text-2xl font-black text-indigo-900 text-center mb-6">BILC Dev Payment Gateway</h2>
            <div class="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
              <div class="flex justify-between mb-2 text-sm text-gray-600">
                <span>Bill/Invoice ID:</span>
                <span class="font-bold text-gray-800">${billId}</span>
              </div>
              <div class="flex justify-between text-sm text-gray-600">
                <span>Total Amount:</span>
                <span class="font-bold text-gray-800">RM ${amountMYR}</span>
              </div>
            </div>
            <p class="text-xs text-gray-500 mb-6 text-center">This is a simulated sandbox environment. Clicking the button will trigger a secure signature-verified callback to complete your tuition enrollment.</p>
            <div class="flex flex-col gap-3">
              <button onclick="pay(true)" class="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow">Complete Successful Payment</button>
              <button onclick="pay(false)" class="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow">Simulate Payment Failure</button>
            </div>
          </div>
          <script>
            function pay(success) {
              const url = "/api/payments/callback";
              const body = new URLSearchParams();
              body.append("id", "${billId}");
              body.append("paid", success ? "true" : "false");
              body.append("amount", "${amount}");
              body.append("x_signature", "mock_signature_for_development");
              
              fetch(url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded"
                },
                body: body.toString()
              })
              .then(res => {
                if (res.ok) {
                  window.location.href = "/api/payments/redirect?paid=" + (success ? "true" : "false") + "&id=${billId}&x_signature=mock_signature_for_development";
                } else {
                  alert("Simulated callback failed on backend.");
                }
              })
              .catch(err => {
                alert("Error contacting simulated webhook: " + err.message);
              });
            }
          </script>
        </body>
        </html>
      `);
    });
  }
  // Marketing Portal and content endpoints
  app.use(marketingPortalRouter);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      allowMethodOverride: true,
      responseMeta(opts) {
        const hasErrors = opts.errors && opts.errors.length > 0;
        if (hasErrors) {
          return {
            status: 200,
          };
        }
        return {};
      },
      onError({ error, path }) {
        if (error.code === "INTERNAL_SERVER_ERROR") {
          console.error(`[tRPC Error on ${path}]:`, error);
        }
      },
    })
  );

  // Health-check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: Date.now(),
    });
  });

  // Return JSON 404 for any unhandled API or portal routes rather than HTML SPA fallback
  app.all(["/api", "/api/*", "/portal/*", "/storage/*"], (req, res) => {
    if (req.originalUrl.startsWith("/api/trpc")) {
      return res.status(404).json({
        error: superjson.serialize({
          message: "API endpoint not found (404)",
          code: -32604,
          data: { code: "NOT_FOUND", httpStatus: 404 },
        }),
      });
    }
    res.status(404).json({ error: "Endpoint not found" });
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Seed default users and run submissions to programId mapping migration if database is connected
  try {
    const { seedDatabaseDefaultUsers, migrateExistingSubmissionsToProgramId } = await import("../db");
    await seedDatabaseDefaultUsers();
    await migrateExistingSubmissionsToProgramId();
  } catch (error) {
    console.error("[Startup] Failed to seed default users or run programId mapping migration:", error);
  }

  const port = 3000;

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);
