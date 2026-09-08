import type { Express } from "express";
import fs from "fs";
import { ENV } from "./env";
import { getLocalStoragePath, LOCAL_STORAGE_DIR } from "../storage";

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    // 1. Check if the file exists in local storage
    const localPath = getLocalStoragePath(key);
    if (localPath.startsWith(LOCAL_STORAGE_DIR) && fs.existsSync(localPath)) {
      res.set("Cache-Control", "public, max-age=86400");
      res.sendFile(localPath);
      return;
    }

    // 2. If Forge is configured, try Forge presigned S3 redirect
    if (ENV.forgeApiUrl && ENV.forgeApiKey) {
      try {
        const forgeUrl = new URL(
          "v1/storage/presign/get",
          ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
        );
        forgeUrl.searchParams.set("path", key);

        const forgeResp = await fetch(forgeUrl, {
          headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
        });

        if (forgeResp.ok) {
          const { url } = (await forgeResp.json()) as { url: string };
          if (url) {
            res.set("Cache-Control", "no-store");
            res.redirect(307, url);
            return;
          }
        }
      } catch (err) {
        console.error("[StorageProxy] forge error:", err);
      }
    }

    res.status(404).send("File not found");
  });
}
