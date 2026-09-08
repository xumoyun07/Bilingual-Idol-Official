import { describe, expect, it } from "vitest";
import { storagePut, storageGet, getLocalStoragePath } from "./storage";
import fs from "fs";

describe("Storage Fallback to Local Filesystem", () => {
  it("successfully stores data locally without BUILT_IN_FORGE credentials", async () => {
    const testContent = "Hello from test storage file";
    const buffer = Buffer.from(testContent, "utf-8");

    const result = await storagePut("test/file.txt", buffer, "text/plain");

    expect(result.key).toContain("test/file");
    expect(result.url).toBe(`/manus-storage/${result.key}`);

    const localPath = getLocalStoragePath(result.key);
    expect(fs.existsSync(localPath)).toBe(true);

    const contentOnDisk = await fs.promises.readFile(localPath, "utf-8");
    expect(contentOnDisk).toBe(testContent);

    // Clean up test file
    await fs.promises.unlink(localPath).catch(() => {});
  });

  it("handles storageGet correctly", async () => {
    const res = await storageGet("news/123/banner.png");
    expect(res.key).toBe("news/123/banner.png");
    expect(res.url).toBe("/manus-storage/news/123/banner.png");
  });
});
