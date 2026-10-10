/**
 * Интеграционные тесты контейнерной БД (пункт 7).
 *
 * Требуют поднятого контейнера и DATABASE_URL, например:
 *   docker compose up -d db
 *   $env:DATABASE_URL="mysql://bilc_app:<пароль>@127.0.0.1:3307/bilingual_idol"
 *   npx vitest run server/db.docker.integration.test.ts
 *
 * Без DATABASE_URL весь блок пропускается, поэтому обычный `pnpm test`
 * продолжает работать в in-memory режиме.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { programs } from "../drizzle/schema.js";
import * as dbApi from "./db.js";
import { getDb } from "./db.js";

const hasDb = Boolean(process.env.DATABASE_URL);
const suite = hasDb ? describe : describe.skip;

const PROBE_SLUG = "vitest-integration-probe";

suite("Контейнерная БД: подключение, целостность, запросы", () => {
  let db: NonNullable<Awaited<ReturnType<typeof getDb>>>;

  beforeAll(async () => {
    const handle = await getDb();
    if (!handle) throw new Error("DATABASE_URL задан, но getDb() вернул null");
    db = handle;
    // Убираем возможные остатки предыдущего прогона
    await db.delete(programs).where(eq(programs.slug, PROBE_SLUG));
  });

  // Изоляция тестов: probe-строка не должна переживать отдельный тест,
  // иначе UNIQUE(slug) срабатывает раньше проверяемого сценария.
  beforeEach(async () => {
    if (db) await db.delete(programs).where(eq(programs.slug, PROBE_SLUG));
  });

  afterAll(async () => {
    if (db) await db.delete(programs).where(eq(programs.slug, PROBE_SLUG));
  });

  it("1. Соединение с БД установлено и это MySQL 8", async () => {
    const res: any = await db.execute(sql`SELECT VERSION() AS v`);
    const rows = res[0] ?? res;
    const version = String(rows[0].v);
    expect(version).toMatch(/^8\./);
  });

  it("2. Схема инициализирована: 42 таблицы", async () => {
    const res: any = await db.execute(
      sql`SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE()`
    );
    const rows = res[0] ?? res;
    expect(Number(rows[0].c)).toBe(42);
  });

  it("3. Роль приложения НЕ имеет прав на изменение схемы (least privilege)", async () => {
    // CREATE TABLE должен быть отклонён: у bilc_app только DML.
    await expect(
      db.execute(sql`CREATE TABLE _privilege_probe (id int)`)
    ).rejects.toThrow();
  });

  it("4. Запись/чтение/обновление/удаление (CRUD)", async () => {
    await db.insert(programs).values({
      slug: PROBE_SLUG,
      title: "Integration Probe",
      language: "English",
      category: "English",
      ageGroup: "Adults",
      level: "Any",
      duration: "1 week",
      schedule: "TBD",
      fees: "Free",
      description: "Строка, созданная интеграционным тестом.",
    });

    const [read] = await db.select().from(programs).where(eq(programs.slug, PROBE_SLUG));
    expect(read?.title).toBe("Integration Probe");

    await db.update(programs).set({ title: "Integration Probe v2" }).where(eq(programs.slug, PROBE_SLUG));
    const [updated] = await db.select().from(programs).where(eq(programs.slug, PROBE_SLUG));
    expect(updated?.title).toBe("Integration Probe v2");

    await db.delete(programs).where(eq(programs.slug, PROBE_SLUG));
    const after = await db.select().from(programs).where(eq(programs.slug, PROBE_SLUG));
    expect(after).toHaveLength(0);
  });

  it("5. UNIQUE-ограничение не даёт создать дубль slug", async () => {
    const row = {
      slug: PROBE_SLUG,
      title: "Dup",
      language: "English",
      category: "English",
      ageGroup: "Adults",
      level: "Any",
      duration: "1 week",
      schedule: "TBD",
      fees: "Free",
      description: "dup",
    };
    await db.insert(programs).values(row);
    await expect(db.insert(programs).values(row)).rejects.toThrow();
  });

  it("6. ACID: откат транзакции при ошибке (Atomicity)", async () => {
    await expect(
      db.transaction(async (tx) => {
        await tx.insert(programs).values({
          slug: PROBE_SLUG,
          title: "Rollback Probe",
          language: "English",
          category: "English",
          ageGroup: "Adults",
          level: "Any",
          duration: "1 week",
          schedule: "TBD",
          fees: "Free",
          description: "не должна сохраниться",
        });
        throw new Error("намеренный откат");
      })
    ).rejects.toThrow("намеренный откат");

    const leftover = await db.select().from(programs).where(eq(programs.slug, PROBE_SLUG));
    expect(leftover).toHaveLength(0);
  });

  it("7. Приложение работает через пул соединений, а не одиночный коннект", async () => {
    // 25 параллельных запросов — при исчерпании пула были бы ошибки.
    const results = await Promise.all(
      Array.from({ length: 25 }, () =>
        db.execute(sql`SELECT 1 AS ok`).then((r: any) => (r[0] ?? r)[0].ok)
      )
    );
    expect(results.every((v) => Number(v) === 1)).toBe(true);
  });

  it("8. Ссылочная целостность: записей-сирот нет", async () => {
    // FOREIGN KEY в схеме отсутствуют (0 ограничений), поэтому проверяем явно.
    const res: any = await db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM enrollments e LEFT JOIN users u ON u.id = e.userId WHERE u.id IS NULL) AS e_users,
        (SELECT COUNT(*) FROM userProfileValues v LEFT JOIN users u ON u.id = v.userId WHERE u.id IS NULL) AS v_users,
        (SELECT COUNT(*) FROM studentProfiles sp LEFT JOIN users u ON u.id = sp.userId WHERE u.id IS NULL) AS sp_users
    `);
    const rows = res[0] ?? res;
    expect(Number(rows[0].e_users)).toBe(0);
    expect(Number(rows[0].v_users)).toBe(0);
    expect(Number(rows[0].sp_users)).toBe(0);
  });

  it("9. Реальные функции приложения читают данные из MySQL", async () => {
    const list = await dbApi.listPublicPrograms();
    expect(Array.isArray(list)).toBe(true);

    const settings = await dbApi.listSiteSettings();
    expect(settings.promo_title).toBe("Special Promotional Offer");
  });

  it("10. Путь записи приложения: createProgram -> updateProgram -> deleteProgram", async () => {
    await dbApi.createProgram({
      slug: PROBE_SLUG,
      title: "App Path Probe",
      language: "English",
      category: "English",
      ageGroup: "Adults",
      level: "Any",
      duration: "1 week",
      schedule: "TBD",
      fees: "Free",
      description: "Проверка реального пути записи приложения.",
    } as any);

    const created = await dbApi.getPublicProgram(PROBE_SLUG);
    expect(created?.title).toBe("App Path Probe");

    await dbApi.updateProgram(created!.id, {
      slug: PROBE_SLUG,
      title: "App Path Probe v2",
      language: "English",
      category: "English",
      ageGroup: "Adults",
      level: "Any",
      duration: "1 week",
      schedule: "TBD",
      fees: "Free",
      description: "Обновлено.",
    } as any);
    expect((await dbApi.getPublicProgram(PROBE_SLUG))?.title).toBe("App Path Probe v2");

    await dbApi.deleteProgram(created!.id);
    expect(await dbApi.getPublicProgram(PROBE_SLUG)).toBeFalsy();
  });

  it("11. updateSiteSettings использует ON DUPLICATE KEY UPDATE (MySQL-специфичный путь)", async () => {
    // Этот путь есть в server/db.ts:1116 и в azureTranslator.ts:187.
    // Проверяем, что он действительно работает на реальном MySQL.
    await dbApi.updateSiteSettings({ promo_cta_text: "View Programmes" });
    const after = await dbApi.listSiteSettings();
    expect(after.promo_cta_text).toBe("View Programmes");
  });
});
