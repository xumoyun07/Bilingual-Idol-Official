import { randomBytes, scryptSync } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FOUNDER_EMAIL } from "./founderIdentity";

/**
 * Сид учётных записей: основатель и только он.
 * Хеш приходит из окружения; пароли и хеши в файле не хранятся.
 */

const ORIGINAL_HASH = process.env.FOUNDER_PASSWORD_HASH;

/** Прежние «сервисные» учётные записи с общим паролем. Больше не создаются. */
const REMOVED_SHARED_PASSWORD_ACCOUNTS = [
  "superadmin@bilc.my",
  "admin@bilc.my",
  "marketing@bilc.my",
  "teacher@bilc.my",
  "student@bilc.my",
];

function makeHash(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function withFounderHash(hash: string | undefined) {
  if (hash === undefined) delete process.env.FOUNDER_PASSWORD_HASH;
  else process.env.FOUNDER_PASSWORD_HASH = hash;
}

async function freshDb() {
  vi.resetModules();
  return import("./db");
}

afterEach(() => {
  withFounderHash(ORIGINAL_HASH);
  vi.resetModules();
});

describe("Сид учётных записей", () => {
  it("с корректным хешем создаёт ровно одну учётную запись — основателя", async () => {
    const hash = makeHash(randomBytes(18).toString("base64url"));
    withFounderHash(hash);
    const db = await freshDb();

    expect(db.inMemoryStore.users).toHaveLength(1);
    const [founder] = db.inMemoryStore.users;
    expect(founder.role).toBe("founder");
    expect(founder.email).toBe(FOUNDER_EMAIL);
    expect(founder.openId).toBe(`founder:${FOUNDER_EMAIL}`);
    expect(founder.isActive).toBe(true);
    // Хеш взят из окружения как есть: литералов пароля в коде нет.
    expect(founder.passwordHash).toBe(hash);

    // Повторный сид идемпотентен: ни дублей, ни новых записей.
    await db.seedDatabaseDefaultUsers();
    await db.seedDatabaseDefaultUsers();
    expect(db.inMemoryStore.users).toHaveLength(1);
    expect(db.inMemoryStore.users[0].email).toBe(FOUNDER_EMAIL);
  });

  it("без хеша не создаёт ни одной учётной записи", async () => {
    withFounderHash(undefined);
    const db = await freshDb();

    expect(db.inMemoryStore.users).toHaveLength(0);
    await db.seedDatabaseDefaultUsers();
    expect(db.inMemoryStore.users).toHaveLength(0);
  });

  it("со сломанным хешем тоже не создаёт учётных записей", async () => {
    withFounderHash("not-a-scrypt-hash");
    const db = await freshDb();

    expect(db.inMemoryStore.users).toHaveLength(0);
    await db.seedDatabaseDefaultUsers();
    expect(db.inMemoryStore.users).toHaveLength(0);
  });

  it("больше не создаёт учётные записи с общим паролем", async () => {
    withFounderHash(makeHash(randomBytes(18).toString("base64url")));
    const db = await freshDb();
    await db.seedDatabaseDefaultUsers();

    const emails = db.inMemoryStore.users.map(user => user.email);
    expect(emails).toEqual([FOUNDER_EMAIL]);
    for (const removed of REMOVED_SHARED_PASSWORD_ACCOUNTS) {
      expect(emails, `учётная запись ${removed} не должна создаваться`).not.toContain(removed);
    }
  });
});
