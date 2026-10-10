import { beforeEach, describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { inMemoryStore } from "./db";
import { resolveRecommendedProgram } from "./db";

/**
 * G9: рекомендация placement-теста привязана к реальной программе.
 */

beforeEach(() => {
  (inMemoryStore as unknown as { programs?: Array<Record<string, any>> }).programs = [
    { id: 31, slug: "ge-a1", title: "General English", language: "English", category: "English Programs", ageGroup: "Adult", level: "Beginner (A1)", duration: "1 month", schedule: "Flexible", fees: "RM 2,950", description: "d", isActive: true },
    { id: 32, slug: "ge-b1", title: "General English", language: "English", category: "English Programs", ageGroup: "Adult", level: "Intermediate (B1)", duration: "3 months", schedule: "Flexible", fees: "RM 7,900", description: "d", isActive: true },
    { id: 33, slug: "fr-a1", title: "French", language: "French", category: "World Languages", ageGroup: "Adult", level: "Beginner (A1)", duration: "1 month", schedule: "Flexible", fees: "RM 3,800", description: "d", isActive: true },
    { id: 34, slug: "hidden", title: "Hidden", language: "English", category: "X", ageGroup: "Adult", level: "Beginner (A1)", duration: "1", schedule: "x", fees: "x", description: "d", isActive: false },
  ];
  (inMemoryStore as unknown as { placementTests?: Array<Record<string, any>> }).placementTests = [
    { id: 7, title: "Entry Test", language: "English", isActive: true, questionsJson: JSON.stringify([{ id: "q1", answer: "a" }, { id: "q2", answer: "b" }]) },
  ];
});

function guestCaller() {
  return appRouter.createCaller({
    user: null,
    req: { headers: {}, protocol: "http", ip: "127.0.0.1", socket: {} } as TrpcContext["req"],
    res: { cookie: () => {}, clearCookie: () => {} } as TrpcContext["res"],
  });
}

describe("resolveRecommendedProgram", () => {
  it("выбирает программу по CEFR-уровню и языку", async () => {
    expect(await resolveRecommendedProgram("B1", "English")).toBe(32);
    expect(await resolveRecommendedProgram("A1", "French")).toBe(33);
  });

  it("не выбирает неактивные программы", async () => {
    expect(await resolveRecommendedProgram("A1", "English")).toBe(31);
  });
});

describe("placementTests.submitAttempt", () => {
  it("возвращает recommendedProgramId реальной программы", async () => {
    const result = await guestCaller().placementTests.submitAttempt({
      testId: 7,
      answers: { q1: "a", q2: "a" },
    });
    expect(result.score).toBe(1);
    // 1 правильный ответ из 2 -> ratio 0.5 -> B1 по порогам сервиса (>0.4).
    expect(result.cefrLevel).toBe("B1");
    expect(typeof result.recommendedProgramId).toBe("number");
    expect(result.recommendedProgramId).toBeGreaterThan(0);
    expect(result.recommendedCourse).toBeDefined();
  });
});