import { spawn, ChildProcess } from "child_process";
import http from "http";

const PORT = 3000;
const HEALTH_URL = `http://localhost:${PORT}/api/health`;
const POLL_INTERVAL_MS = 5000; // Poll every 5 seconds
const RESTART_COOLDOWN_MS = 10000; // Wait 10 seconds before polling after a restart
const TIMEOUT_MS = 3000; // 3 seconds timeout for health check
const MAX_CONSECUTIVE_FAILURES = 3; // Restart after 3 consecutive failures

let childProcess: ChildProcess | null = null;
let consecutiveFailures = 0;
let isRestarting = false;
let checkInterval: NodeJS.Timeout | null = null;

function startDevServer(): ChildProcess {
  console.log(`[Monitor] Starting development server...`);
  
  // Spawn the tsx watch server process
  const child = spawn("npx", ["tsx", "watch", "server/_core/index.ts"], {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "development",
    },
    shell: true,
  });

  child.on("exit", (code, signal) => {
    if (!isRestarting) {
      console.log(`[Monitor] Dev server exited with code ${code} and signal ${signal}`);
      if (code !== 0 && code !== null) {
        console.log(`[Monitor] Server crashed. Restarting in 5 seconds...`);
        setTimeout(() => {
          if (!isRestarting) {
            childProcess = startDevServer();
          }
        }, 5000);
      } else {
        // Normal exit (e.g. Ctrl+C)
        process.exit(code ?? 0);
      }
    }
  });

  return child;
}

function checkHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(HEALTH_URL);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname,
        method: "GET",
        timeout: TIMEOUT_MS,
      };

      const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (res.statusCode === 200) {
            try {
              const parsed = JSON.parse(data);
              if (parsed.status === "ok") {
                resolve(true);
                return;
              }
            } catch (e) {
              // JSON parse failed
            }
          }
          resolve(false);
        });
      });

      req.on("error", () => {
        resolve(false);
      });

      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    } catch (e) {
      resolve(false);
    }
  });
}

async function restartServer() {
  if (isRestarting) return;
  isRestarting = true;
  console.warn(`[Monitor] 🚨 Server freeze or HMR lockup detected! Initiating server restart...`);

  if (childProcess) {
    console.log(`[Monitor] Killing current server process...`);
    // Attempt graceful shutdown first, then force kill
    childProcess.kill("SIGTERM");
    
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    try {
      // Check if it's still running and force kill if necessary
      if (childProcess.exitCode === null) {
        console.log(`[Monitor] Server did not exit in 2 seconds. Force killing...`);
        childProcess.kill("SIGKILL");
      }
    } catch (e) {
      // Ignore
    }
  }

  consecutiveFailures = 0;
  
  // Wait a short bit before starting a new one
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  childProcess = startDevServer();
  isRestarting = false;
  
  // Provide cooldown period for startup
  console.log(`[Monitor] Server restarted. Cooling down for ${RESTART_COOLDOWN_MS / 1000}s...`);
  pauseMonitoring(RESTART_COOLDOWN_MS);
}

function pauseMonitoring(durationMs: number) {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
  setTimeout(() => {
    startMonitoring();
  }, durationMs);
}

function startMonitoring() {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  checkInterval = setInterval(async () => {
    if (isRestarting) return;

    const isHealthy = await checkHealth();
    if (isHealthy) {
      if (consecutiveFailures > 0) {
        console.log(`[Monitor] Server recovered and is healthy.`);
      }
      consecutiveFailures = 0;
    } else {
      consecutiveFailures++;
      console.warn(`[Monitor] Health check failed. Consecutive failures: ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}`);
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        await restartServer();
      }
    }
  }, POLL_INTERVAL_MS);
}

// Handle termination signals to cleanly exit the child process
function setupSignalHandlers() {
  const handleSignal = (signal: string) => {
    console.log(`[Monitor] Received ${signal}. Terminating dev server...`);
    if (childProcess) {
      try {
        childProcess.kill(signal);
      } catch (e) {}
    }
    process.exit(0);
  };

  process.on("SIGINT", () => handleSignal("SIGINT"));
  process.on("SIGTERM", () => handleSignal("SIGTERM"));
}

// Main execution
setupSignalHandlers();
childProcess = startDevServer();
// Start monitoring with an initial cooldown to let the server start up
pauseMonitoring(15000);
