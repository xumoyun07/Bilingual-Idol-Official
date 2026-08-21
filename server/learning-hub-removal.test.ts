import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const project = process.cwd();
const read = (path: string) => readFileSync(resolve(project, path), "utf8");

describe("Learning Hub removal", () => {
  it("removes the active Learning Hub route and public navigation link", () => {
    const app = read("client/src/App.tsx");
    const layout = read("client/src/components/PublicLayout.tsx");
    expect(app).not.toContain('path="/learning"');
    expect(app).not.toContain("LearningHub");
    expect(layout).not.toContain('href: "/learning"');
  });

  it("removes learning API procedures while preserving archive-only schema notes", () => {
    const router = read("server/routers/content.ts");
    const db = read("server/db.ts");
    const schema = read("drizzle/schema.ts");
    expect(router).not.toContain("publicLearningItems");
    expect(router).not.toContain("createLearningSupportRequest");
    expect(router).not.toContain("learningItems:");
    expect(db).not.toContain("listLearningItems");
    expect(db).not.toContain("learningSupportRequests");
    expect(schema).toContain("Legacy archive only");
    expect(schema).toContain("no routes, tRPC procedures, UI, or app types");
  });
});
