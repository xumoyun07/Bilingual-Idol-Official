/**
 * reset-users — привести таблицу users к чистому состоянию: остаётся только основатель.
 *
 * ЧТО ДЕЛАЕТ
 *   Удаляет все учётные записи, кроме строк с role='founder', вместе с зависимыми
 *   строками (внешних ключей в схеме нет — 0 ограничений, поэтому целостность
 *   обеспечивается только кодом). Содержимое, которое лишь ССЫЛАЕТСЯ на удаляемого
 *   пользователя как на автора (программы, медиа, заявки, маркетинговые материалы),
 *   не удаляется: ссылка обнуляется, чтобы не потерять контент.
 *
 *   АУДИТ НЕ УДАЛЯЕТСЯ НИКОГДА. Строки auditLogs и auditLogArchives сохраняются:
 *   у них обнуляется ссылка на пользователя (actorUserId / archivedByUserId), но
 *   сами записи остаются, вместе с actorRole, действием, целью и временем. Это
 *   проверяется страховкой в коде ниже, а не только настройкой.
 *
 * БЕЗОПАСНОСТЬ
 *   - по умолчанию это ТОЛЬКО dry-run: ни одной записи;
 *   - реальная запись требует одновременно --confirm, --include-related и точной фразы;
 *   - если найдены зависимые строки, а --include-related не указан — скрипт
 *     останавливается и печатает счётчики по каждой таблице;
 *   - перед записью создаётся JSON-копия удаляемых строк (БЕЗ passwordHash) в backups/,
 *     затем она читается обратно и счётчики сверяются;
 *   - вся запись идёт одной транзакцией; внутри транзакции проверяется, что после
 *     удаления в users остались только основатели.
 *
 * ЗАПУСК
 *   npx tsx scripts/reset-users.ts                          # dry-run
 *   npx tsx scripts/reset-users.ts --include-related        # dry-run вместе с зависимыми
 *   npx tsx scripts/reset-users.ts --confirm --include-related --phrase "keep only founder"
 *
 * Ничего не печатает из персональных данных: только счётчики и имена таблиц.
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { getDb } from "../server/db";

const CONFIRM_PHRASE = "keep only founder";
const BACKUPS_DIR = path.join(process.cwd(), "backups");

type RelatedRule = {
  table: string;
  column: string;
  /** delete — строка принадлежит пользователю; null — строка лишь ссылается на него. */
  mode: "delete" | "null";
};

/**
 * Порядок важен: сначала потомки, затем родители. Внешних ключей нет, поэтому
 * СУБД ничего не проверит — порядок задаём сами.
 */
const RELATED_RULES: RelatedRule[] = [
  { table: "studentDocuments", column: "studentId", mode: "delete" },
  { table: "studentDocuments", column: "uploadedByUserId", mode: "delete" },
  { table: "studentProfileHistory", column: "studentId", mode: "delete" },
  { table: "studentProfileHistory", column: "actorUserId", mode: "delete" },
  { table: "studentProfiles", column: "userId", mode: "delete" },
  { table: "attendanceRecords", column: "studentId", mode: "delete" },
  { table: "attendanceRecords", column: "markedByTeacherId", mode: "delete" },
  { table: "grades", column: "studentId", mode: "delete" },
  { table: "grades", column: "gradedByTeacherId", mode: "delete" },
  { table: "classSessions", column: "studentId", mode: "delete" },
  { table: "classSessions", column: "teacherId", mode: "delete" },
  { table: "enrollments", column: "userId", mode: "delete" },
  { table: "enrollments", column: "approvedByUserId", mode: "delete" },
  { table: "payments", column: "userId", mode: "delete" },
  // Согласованные цены студента. Их наличие ОСТАНАВЛИВАЕТ скрипт без
  // --include-related; финансовые строки уходят только при осознанном полном сбросе.
  { table: "studentPrices", column: "studentId", mode: "delete" },
  { table: "studentPrices", column: "agreedBy", mode: "null" },
  { table: "studentPrices", column: "supersededById", mode: "null" },
  { table: "placementTestAttempts", column: "userId", mode: "delete" },
  { table: "applications", column: "userId", mode: "delete" },
  { table: "userProfileValues", column: "userId", mode: "delete" },
  // Аудит сохраняется всегда: обнуляем только ссылку на пользователя.
  { table: "auditLogs", column: "actorUserId", mode: "null" },
  { table: "auditLogArchives", column: "actorUserId", mode: "null" },
  { table: "auditLogArchives", column: "archivedByUserId", mode: "null" },
  // Контент не удаляем — только снимаем ссылку на автора.
  { table: "programs", column: "teacherId", mode: "null" },
  { table: "publicMedia", column: "createdByUserId", mode: "null" },
  { table: "registrationSubmissions", column: "assignedToUserId", mode: "null" },
  { table: "mediaAssets", column: "uploadedByUserId", mode: "null" },
  { table: "audienceSegments", column: "createdByUserId", mode: "null" },
  { table: "events", column: "createdByUserId", mode: "null" },
  { table: "blogPosts", column: "authorId", mode: "null" },
];

/**
 * Страховка: аудит-след не удаляется ни при каких обстоятельствах.
 * Если кто-то поменяет режим на "delete" — скрипт откажется стартовать.
 */
const AUDIT_TABLES = new Set(["auditLogs", "auditLogArchives"]);
for (const rule of RELATED_RULES) {
  if (AUDIT_TABLES.has(rule.table) && rule.mode !== "null") {
    throw new Error(
      `Недопустимое правило: ${rule.table}.${rule.column} имеет mode="${rule.mode}". ` +
        "Строки аудита обязаны сохраняться с обнулённой ссылкой (mode=\"null\").",
    );
  }
}

const args = process.argv.slice(2);
const has = (flag: string) => args.includes(flag);
const valueOf = (flag: string) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

if (has("--help") || has("-h")) {
  console.log(`reset-users — оставить только основателя.

  --include-related   включить удаление зависимых строк (обязателен для --confirm)
  --confirm           включить реальную запись (по умолчанию только dry-run)
  --phrase "<текст>"  обязательная фраза подтверждения: "${CONFIRM_PHRASE}"
  --help              этот текст`);
  process.exit(0);
}

const db = await getDb();
if (!db) {
  console.error("Нет подключения к БД (DATABASE_URL не задан или соединение не удалось).");
  process.exit(1);
}

async function rows<T = Record<string, unknown>>(query: ReturnType<typeof sql>): Promise<T[]> {
  const result = (await db!.execute(query)) as unknown;
  let list: unknown = result;
  if (Array.isArray(result)) list = Array.isArray(result[0]) ? result[0] : result;
  else list = (result as { rows?: unknown[] }).rows ?? [];
  return list as T[];
}

async function tableExists(name: string) {
  const found = await rows<{ n: number }>(
    sql`SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${name}`,
  );
  return Number(found[0]?.n ?? 0) > 0;
}

async function columnExists(table: string, column: string) {
  const found = await rows<{ n: number }>(
    sql`SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${table} AND COLUMN_NAME = ${column}`,
  );
  return Number(found[0]?.n ?? 0) > 0;
}

/** Список id через запятую. ids получены из нашей же выборки и приведены к целым. */
function idList(ids: number[]) {
  return sql.raw(ids.map(id => String(Math.trunc(id))).join(","));
}

/* ------------------------------------------------------------------ */
/* 1. Что есть сейчас                                                  */
/* ------------------------------------------------------------------ */

const founderRows = await rows<{ id: number }>(sql`SELECT id FROM users WHERE role = 'founder'`);
const founderIds = founderRows.map(row => Number(row.id));
const allIds = (await rows<{ id: number }>(sql`SELECT id FROM users`)).map(row => Number(row.id));
const targetIds = allIds.filter(id => !founderIds.includes(id));

console.log("=== СОСТОЯНИЕ ===");
console.log(`users всего              : ${allIds.length}`);
console.log(`  основателей (оставляем): ${founderIds.length}`);
console.log(`  к удалению             : ${targetIds.length}`);

if (targetIds.length === 0) {
  console.log("\nНечего удалять: кроме основателя учётных записей нет.");
  process.exit(0);
}

/* ------------------------------------------------------------------ */
/* 2. Зависимые строки                                                 */
/* ------------------------------------------------------------------ */

type RelatedState = { rule: RelatedRule; count: number; exists: boolean };
const related: RelatedState[] = [];

for (const rule of RELATED_RULES) {
  if (!(await tableExists(rule.table)) || !(await columnExists(rule.table, rule.column))) {
    related.push({ rule, count: 0, exists: false });
    continue;
  }
  const found = await rows<{ n: number }>(
    sql`SELECT COUNT(*) AS n FROM \`${sql.raw(rule.table)}\`
        WHERE \`${sql.raw(rule.column)}\` IN (${idList(targetIds)})`,
  );
  related.push({ rule, count: Number(found[0]?.n ?? 0), exists: true });
}

const present = related.filter(item => item.exists && item.count > 0);
const relatedTotal = present.reduce((sum, item) => sum + item.count, 0);

console.log("\n=== ЗАВИСИМЫЕ СТРОКИ (ссылаются на удаляемых) ===");
if (!present.length) {
  console.log("  нет");
} else {
  for (const item of present) {
    const action = item.rule.mode === "delete" ? "удалить" : "обнулить ссылку";
    console.log(`  ${`${item.rule.table}.${item.rule.column}`.padEnd(46)} ${String(item.count).padStart(5)}  → ${action}`);
  }
}
console.log(`  всего строк: ${relatedTotal}`);

/* ------------------------------------------------------------------ */
/* 3. Предохранители                                                   */
/* ------------------------------------------------------------------ */

const includeRelated = has("--include-related");
const confirm = has("--confirm");
const phrase = valueOf("--phrase");

if (relatedTotal > 0 && !includeRelated) {
  console.error(
    "\nОСТАНОВ: найдены зависимые строки. Удаление учётных записей оставит их сиротами.\n" +
      "Добавьте --include-related, чтобы удалить/обнулить их вместе с пользователями.",
  );
  process.exit(2);
}

if (confirm && !includeRelated) {
  console.error("\nОСТАНОВ: --confirm требует --include-related.");
  process.exit(2);
}

if (confirm && phrase !== CONFIRM_PHRASE) {
  console.error(`\nОСТАНОВ: для реального запуска нужна точная фраза --phrase "${CONFIRM_PHRASE}".`);
  process.exit(2);
}

if (!confirm) {
  console.log("\n=== DRY-RUN ===");
  console.log(`Будет оставлено учётных записей: ${founderIds.length}`);
  console.log(`Будет удалено учётных записей   : ${targetIds.length}`);
  console.log(`Будет удалено зависимых строк   : ${present.filter(i => i.rule.mode === "delete").reduce((s, i) => s + i.count, 0)}`);
  console.log(`Будет обнулено ссылок           : ${present.filter(i => i.rule.mode === "null").reduce((s, i) => s + i.count, 0)}`);
  console.log("\nНичего не изменено. Для реального запуска добавьте --confirm --include-related --phrase.");
  process.exit(0);
}

/* ------------------------------------------------------------------ */
/* 4. Резервная копия без хешей паролей                                */
/* ------------------------------------------------------------------ */

fs.mkdirSync(BACKUPS_DIR, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = path.join(BACKUPS_DIR, `reset-users-${stamp}.json`);

const userRows = await rows<Record<string, unknown>>(
  sql`SELECT * FROM users WHERE id IN (${idList(targetIds)})`,
);
const safeUserRows = userRows.map(row => {
  const { passwordHash: _drop, ...rest } = row as Record<string, unknown>;
  return rest;
});

const relatedDump: Record<string, unknown[]> = {};
for (const item of present) {
  const key = `${item.rule.table}.${item.rule.column}`;
  const dump = await rows<Record<string, unknown>>(
    sql`SELECT * FROM \`${sql.raw(item.rule.table)}\`
        WHERE \`${sql.raw(item.rule.column)}\` IN (${idList(targetIds)})`,
  );
  relatedDump[key] = item.rule.mode === "delete" ? dump : [];
}

const payload = {
  generatedAt: new Date().toISOString(),
  note: "Копия удаляемых строк. Хеши паролей намеренно не выгружаются.",
  keptFounderCount: founderIds.length,
  deletedUserCount: safeUserRows.length,
  deletedUserIds: targetIds,
  users: safeUserRows,
  relatedDeleted: relatedDump,
};

fs.writeFileSync(backupPath, JSON.stringify(payload, null, 2), "utf8");

/* Читаем обратно и сверяем счётчики. */
const readBack = JSON.parse(fs.readFileSync(backupPath, "utf8")) as typeof payload;
const backupOk =
  readBack.users.length === safeUserRows.length &&
  readBack.deletedUserIds.length === targetIds.length &&
  JSON.stringify(readBack.deletedUserIds) === JSON.stringify(targetIds);
if (!backupOk) {
  console.error(`\nОСТАНОВ: копия ${backupPath} не совпала по счётчикам. Ничего не удалено.`);
  process.exit(3);
}
console.log(`\nКопия записана и сверена: ${path.relative(process.cwd(), backupPath)}`);
console.log(`  строк users в копии: ${readBack.users.length} (ожидалось ${safeUserRows.length})`);
console.log(`  хешей паролей в копии: ${fs.readFileSync(backupPath, "utf8").includes("passwordHash") ? "ЕСТЬ — ОШИБКА" : "нет"}`);

/* ------------------------------------------------------------------ */
/* 5. Одна транзакция                                                  */
/* ------------------------------------------------------------------ */

let deletedUsers = 0;
await db.transaction(async tx => {
  for (const item of present) {
    if (item.rule.mode === "delete") {
      await tx.execute(
        sql`DELETE FROM \`${sql.raw(item.rule.table)}\`
            WHERE \`${sql.raw(item.rule.column)}\` IN (${idList(targetIds)})`,
      );
    } else {
      await tx.execute(
        sql`UPDATE \`${sql.raw(item.rule.table)}\` SET \`${sql.raw(item.rule.column)}\` = NULL
            WHERE \`${sql.raw(item.rule.column)}\` IN (${idList(targetIds)})`,
      );
    }
  }

  const before = (await tx.execute(sql`SELECT COUNT(*) AS n FROM users`)) as unknown;
  const beforeList = Array.isArray(before) ? (before[0] as { n: number }[]) : ((before as { rows?: unknown[] }).rows ?? []);
  void beforeList;

  await tx.execute(sql`DELETE FROM users WHERE id IN (${idList(targetIds)})`);

  const remaining = (await tx.execute(
    sql`SELECT COUNT(*) AS total, SUM(role = 'founder') AS founders FROM users`,
  )) as unknown;
  const list = Array.isArray(remaining) ? (remaining[0] as { total: number; founders: number }[]) : [];
  const total = Number(list[0]?.total ?? 0);
  const founders = Number(list[0]?.founders ?? 0);

  if (total !== founders || founders !== founderIds.length) {
    throw new Error(`Проверка внутри транзакции не прошла: users=${total}, founder=${founders}, ожидалось ${founderIds.length}. Откат.`);
  }
  deletedUsers = targetIds.length;
});

/* ------------------------------------------------------------------ */
/* 6. Итог                                                             */
/* ------------------------------------------------------------------ */

const finalUsers = await rows<{ role: string; n: number }>(sql`SELECT role, COUNT(*) AS n FROM users GROUP BY role`);
const finalProfiles = await rows<{ n: number }>(sql`SELECT COUNT(*) AS n FROM studentProfiles`);

console.log("\n=== ГОТОВО ===");
console.log(`удалено учётных записей: ${deletedUsers}`);
console.log(`users теперь           : ${finalUsers.map(row => `${row.role}=${row.n}`).join(" ")}`);
console.log(`studentProfiles теперь : ${Number(finalProfiles[0]?.n ?? 0)}`);
process.exit(0);
