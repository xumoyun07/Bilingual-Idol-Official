// Storage helpers: Supports Forge Server presigned S3 storage if configured,
// and falls back gracefully to local persistent filesystem storage.

import fs from "fs";
import path from "path";
import { ENV } from "./_core/env";

export const LOCAL_STORAGE_DIR = path.resolve(process.cwd(), ".uploads");

export function hasForgeConfig(): boolean {
  return Boolean(ENV.forgeApiUrl && ENV.forgeApiKey);
}

function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;

  if (!forgeUrl || !forgeKey) {
    return null;
  }

  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}

export function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

export function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export function getLocalStoragePath(key: string): string {
  const normalized = path.normalize(key).replace(/^(\.\.[\/\\])+/, "");
  return path.resolve(LOCAL_STORAGE_DIR, normalized);
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const forge = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));

  if (forge) {
    try {
      // 1. Get presigned PUT URL from Forge
      const presignUrl = new URL("v1/storage/presign/put", forge.forgeUrl + "/");
      presignUrl.searchParams.set("path", key);

      const presignResp = await fetch(presignUrl, {
        headers: { Authorization: `Bearer ${forge.forgeKey}` },
      });

      if (presignResp.ok) {
        const { url: s3Url } = (await presignResp.json()) as { url: string };
        if (s3Url) {
          // 2. PUT file directly to S3
          const blob =
            typeof data === "string"
              ? new Blob([data], { type: contentType })
              : new Blob([data as any], { type: contentType });

          const uploadResp = await fetch(s3Url, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: blob,
          });

          if (uploadResp.ok) {
            return { key, url: `/manus-storage/${key}` };
          }
        }
      }
    } catch (forgeErr) {
      console.warn("[storage] Forge upload failed, falling back to local filesystem storage:", forgeErr);
    }
  }

  // Local filesystem storage fallback
  const filePath = getLocalStoragePath(key);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

  const buffer = Buffer.isBuffer(data)
    ? data
    : data instanceof Uint8Array
      ? Buffer.from(data.buffer, data.byteOffset, data.byteLength)
      : Buffer.from(data, "utf8");

  await fs.promises.writeFile(filePath, buffer);

  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const forge = getForgeConfig();
  const key = normalizeKey(relKey);

  if (forge) {
    try {
      const getUrl = new URL("v1/storage/presign/get", forge.forgeUrl + "/");
      getUrl.searchParams.set("path", key);

      const resp = await fetch(getUrl, {
        headers: { Authorization: `Bearer ${forge.forgeKey}` },
      });

      if (resp.ok) {
        const { url } = (await resp.json()) as { url: string };
        if (url) return url;
      }
    } catch (e) {
      console.warn("[storage] Forge signed URL failed, falling back:", e);
    }
  }

  return `/manus-storage/${key}`;
}
