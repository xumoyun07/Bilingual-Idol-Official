import React from "react";
import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import ErrorBoundary from "./components/ErrorBoundary";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  if (window.location.pathname !== "/login") window.location.href = "/login";
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        // Preview auto-login fallback: when the browser blocks iframe cookies
        // (Safari ITP / private browsing / WebView), the runtime mirrors the
        // session into sessionStorage so we can forward it as a Bearer token.
        // The regular OAuth cookie flow keeps working and takes priority server-side.
        try {
          const raw = sessionStorage.getItem("manus-cookie") || localStorage.getItem("manus-cookie");
          if (raw) {
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair ? pair.trim().slice(prefix.length) : (raw.startsWith(prefix) ? raw.slice(prefix.length) : raw);
            if (token && token.length > 5) {
              return { Authorization: `Bearer ${token}` };
            }
          }
          const directToken = sessionStorage.getItem("manus-session-token") || localStorage.getItem("manus-session-token");
          if (directToken) {
            return { Authorization: `Bearer ${directToken}` };
          }
        } catch {
          // storage unavailable
        }
        return {};
      },
      async fetch(input, init) {
        try {
          const res = await globalThis.fetch(input, {
            ...(init ?? {}),
            credentials: "include",
          });
          const contentType = res.headers.get("content-type") || "";

          // If the response is not JSON (e.g. HTML 502/503 from container cold starts, or plain 404/500 text)
          if (!contentType.includes("application/json")) {
            const text = await res.text().catch(() => "");
            const snippet = text.slice(0, 120).replace(/\s+/g, " ").trim();
            const message = res.status >= 500
              ? `Server temporarily unavailable (${res.status} ${res.statusText || ""}).`
              : res.status === 404
              ? `API endpoint not found (404).`
              : `Server returned non-JSON response (${res.status}): ${snippet}`;

            const serializedError = superjson.serialize({
              message,
              code: -32603,
              data: { code: "INTERNAL_SERVER_ERROR", httpStatus: res.status >= 400 ? res.status : 500 },
            });

            return new Response(JSON.stringify({ error: serializedError }), {
              status: res.status >= 400 ? res.status : 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          // If JSON, ensure it matches tRPC expected shape so superjson deserialization never throws TransformResultError
          try {
            const cloned = res.clone();
            const json = await cloned.json();
            const items = Array.isArray(json) ? json : [json];
            const isValidTRPC = items.length > 0 && items.every(item => {
              if (!item || typeof item !== "object") return false;
              if ("result" in item && item.result && typeof item.result === "object") return true;
              if ("error" in item && item.error) {
                if (typeof item.error === "object" && ("json" in item.error || typeof item.error.code === "number")) {
                  return true;
                }
              }
              return false;
            });

            if (!isValidTRPC) {
              const errMsg = (typeof json === "object" && json && "error" in json && typeof json.error === "string")
                ? json.error
                : (typeof json === "object" && json && "message" in json && typeof json.message === "string")
                ? json.message
                : `Server returned invalid API response (${res.status})`;

              const serializedError = superjson.serialize({
                message: errMsg,
                code: res.status === 404 ? -32604 : res.status === 401 ? -32001 : res.status === 403 ? -32003 : -32603,
                data: {
                  code: res.status === 404 ? "NOT_FOUND" : res.status === 401 ? "UNAUTHORIZED" : res.status === 403 ? "FORBIDDEN" : "INTERNAL_SERVER_ERROR",
                  httpStatus: res.status >= 400 ? res.status : 500,
                },
              });

              return new Response(JSON.stringify({ error: serializedError }), {
                status: res.status >= 400 ? res.status : 500,
                headers: { "Content-Type": "application/json" },
              });
            }
          } catch {
            const serializedError = superjson.serialize({
              message: `Failed to parse response from server (${res.status})`,
              code: -32603,
              data: { code: "INTERNAL_SERVER_ERROR", httpStatus: res.status >= 400 ? res.status : 500 },
            });
            return new Response(JSON.stringify({ error: serializedError }), {
              status: res.status >= 400 ? res.status : 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          return res;
        } catch (networkError) {
          const message = networkError instanceof Error ? networkError.message : "Network connection failed";
          const serializedError = superjson.serialize({
            message,
            code: -32603,
            data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 503 },
          });
          return new Response(JSON.stringify({ error: serializedError }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    }),
  ],
});

function MainApp() {
  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<MainApp />);
}
