import { afterEach, describe, expect, it } from "vitest";
import { inMemoryStore } from "../db";
import {
  MANAGED_TEST_ROLES,
  assertFixturesAllowed,
  createTestAccounts,
  describeAccount,
  fixturesAllowed,
  type TestAccounts,
} from "./accounts";

/**
 * Короткая самопроверка общего поставщика тестовых учётных записей.
 * Пароли здесь генерируются в рантайме и не сравниваются с литералами.
 */

let active: TestAccounts | null = null;

afterEach(async () => {
  if (active) {
    await active.cleanup();
    active = null;
  }
});

async function withEnv<T>(patch: Record<string, string | undefined>, body: () => Promise<T> | T): Promise<T> {
  const saved = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(patch)) {
    saved.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return await body();
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

describe("Общий поставщик тестовых учётных записей", () => {
  it("разрешён только в тестовом режиме", async () => {
    expect(fixturesAllowed({ NODE_ENV: "test" } as NodeJS.ProcessEnv)).toBe(true);
    expect(fixturesAllowed({ TEST_FIXTURES: "1" } as NodeJS.ProcessEnv)).toBe(true);
    expect(fixturesAllowed({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toBe(false);
    expect(fixturesAllowed({ NODE_ENV: "development" } as NodeJS.ProcessEnv)).toBe(false);
    expect(() => assertFixturesAllowed({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toThrow(/disabled outside tests/);

    await withEnv({ NODE_ENV: "production", TEST_FIXTURES: undefined }, async () => {
      await expect(createTestAccounts()).rejects.toThrow(/disabled outside tests/);
    });

    await withEnv({ NODE_ENV: "production", TEST_FIXTURES: "1" }, async () => {
      expect(fixturesAllowed()).toBe(true);
    });
  });

  it("создаёт основателя и по учётной записи на роль реальными путями и убирает их за собой", async () => {
    active = await createTestAccounts();
    const accounts = active;

    expect(accounts.mode).toBe("memory");
    expect(accounts.founder.role).toBe("founder");
    expect(accounts.founder.email).toBe("lektor@bilc.my");

    const managed = accounts.all().filter(account => account.role !== "founder");
    expect(managed.map(account => account.role).sort()).toEqual([...MANAGED_TEST_ROLES].sort());

    // Все пароли случайны, длинны и уникальны — включая пароль основателя.
    const passwords = accounts.all().map(account => account.password);
    expect(new Set(passwords).size).toBe(passwords.length);
    for (const password of passwords) {
      expect(typeof password).toBe("string");
      expect(password.length).toBeGreaterThanOrEqual(16);
    }

    // Учётные записи действительно в хранилище, и онбординг уже пройден.
    for (const account of managed) {
      const row = inMemoryStore.users.find(user => user.email === account.email);
      expect(row, `учётная запись ${account.email} должна быть в хранилище`).toBeDefined();
      expect(row?.role).toBe(account.role);
      expect(row?.isOtp).toBe(false);
      expect(row?.isActive).toBe(true);
      expect(row?.id).toBe(account.userId);
    }

    // Безопасное описание не содержит пароля.
    for (const account of accounts.all()) {
      const safe = describeAccount(account);
      expect(safe.role).toBe(account.role);
      expect(safe.email).toBe(account.email);
      expect(JSON.stringify(safe)).not.toContain(account.password);
    }

    // Реальный вход работает для выданных учётных данных.
    const session = await accounts.login("teacher");
    expect(session.user.role).toBe("teacher");
    expect(typeof session.token).toBe("string");

    const ids = managed.map(account => account.userId);
    await accounts.cleanup();
    active = null;

    for (const id of ids) {
      expect(inMemoryStore.users.some(user => user.id === id)).toBe(false);
    }
    // Основатель остаётся: это единственная учётная запись, которая живёт всегда.
    expect(inMemoryStore.users.some(user => user.id === accounts.founder.userId)).toBe(true);
  }, 60_000);

  it("умеет выдавать дополнительные учётные записи по требованию", async () => {
    active = await createTestAccounts({ roles: ["student"] });
    const accounts = active;

    const first = accounts.get("student");
    const second = await accounts.createExtra("student");

    expect(second.email).not.toBe(first.email);
    expect(second.password).not.toBe(first.password);
    expect(second.role).toBe("student");
    expect(accounts.all()).toHaveLength(3); // основатель + 2 студента
  }, 60_000);
});
