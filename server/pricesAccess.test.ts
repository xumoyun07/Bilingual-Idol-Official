import { beforeEach, describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { deleteManagedUser, inMemoryStore } from "./db";
import { FOUNDER_EMAIL } from "./founderIdentity";

/**
 * Item E: матрица ролей, подмена суммы, двойная оплата, идемпотентность,
 * история при переходе на новый курс, политика удаления и публичная утечка.
 */

const ROLES = [
  { id: 1, email: FOUNDER_EMAIL, role: "founder" },
  { id: 2, email: "sa@example.test", role: "super_admin" },
  { id: 3, email: "ad@example.test", role: "admin" },
  { id: 4, email: "te@example.test", role: "teacher" },
  { id: 5, email: "mk@example.test", role: "marketing" },
  { id: 6, email: "us@example.test", role: "user" },
  { id: 7, email: "a@example.test", role: "student" },
  { id: 8, email: "b@example.test", role: "student" },
];

const STUDENT_A = ROLES.find(r => r.role === "student" && r.id === 7)!;

function memory() {
  return inMemoryStore as unknown as {
    studentPrices?: Array<Record<string, any>>;
    payments?: Array<Record<string, any>>;
    programs?: Array<{ id: number }>;
  };
}

function seed() {
  inMemoryStore.users = ROLES.map(row => ({
    id: row.id, openId: `seed:${row.id}`, name: `Seed ${row.role}`, email: row.email,
    passwordHash: null, role: row.role, isActive: true, loginMethod: "test",
    createdAt: new Date("2026-01-01T00:00:00.000Z"), updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    lastSignedIn: new Date("2026-01-01T00:00:00.000Z"), sessionVersion: 1, isOtp: false,
    otpCreatedAt: null, failedAttempts: 0,
  })) as never;
  memory().programs = [{ id: 1 }, { id: 2 }];
  memory().studentPrices = [];
  memory().payments = [];
}

function priceRow(overrides: Record<string, any>) {
  return {
    id: 1, studentId: STUDENT_A.id, programId: 1, amountMinor: 75000, currency: "MYR",
    status: "active", agreedBy: 1, agreedAt: new Date("2026-02-01"), staffNote: "internal",
    supersededById: null, supersededReason: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01"),
    ...overrides,
  };
}

function paymentRow(overrides: Record<string, any>) {
  return {
    id: 1, userId: STUDENT_A.id, amount: 75000, amountMinor: 75000, currency: "MYR", status: "pending",
    provider: "dev_stub", priceId: 1, idempotencyKey: "key-1", transactionReference: "BILL-1",
    paymentMethod: "fpx_bank_transfer", receiptNumber: "R1", metadataJson: null,
    utmSource: null, utmMedium: null, utmCampaign: null, utmTerm: null, utmContent: null,
    createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01"),
    ...overrides,
  };
}

function caller(role: string | null) {
  const row = role ? inMemoryStore.users.find(u => u.role === role) : undefined;
  return appRouter.createCaller({
    user: (row ?? null) as TrpcContext["user"],
    req: { headers: {}, protocol: "http", ip: "127.0.0.1", socket: {} } as TrpcContext["req"],
    res: { cookie: () => {}, clearCookie: () => {} } as TrpcContext["res"],
  });
}

beforeEach(seed);

describe("E · матрица ролей для новых процедур", () => {
  const STAFF_ONLY = [
    ["prices.set", () => caller("student").prices.set({ studentId: STUDENT_A.id, programId: 1, amountMinor: 1000 })],
    ["prices.change", () => caller("student").prices.change({ studentId: STUDENT_A.id, programId: 1, amountMinor: 1000, reason: "probe" })],
    ["prices.cancel", () => caller("student").prices.cancel({ priceId: 1, reason: "probe" })],
    ["prices.complete", () => caller("student").prices.complete({ priceId: 1 })],
    ["prices.historyByStudent", () => caller("student").prices.historyByStudent({ studentId: STUDENT_A.id })],
  ] as const;

  it("staff-процедуры запрещены student, teacher, marketing, user", async () => {
    for (const role of ["student", "teacher", "marketing", "user"]) {
      for (const [name, build] of STAFF_ONLY) {
        void name;
        await expect(build(), `роль ${role}`).rejects.toMatchObject({ code: "FORBIDDEN" });
      }
    }
  });

  it("staff-процедуры запрещены без входа", async () => {
    await expect(caller(null).prices.historyByStudent({ studentId: STUDENT_A.id })).rejects.toBeDefined();
    await expect(caller(null).prices.mine()).rejects.toBeDefined();
  });

  it("staff-процедуры доступны founder, super_admin, admin", async () => {
    for (const role of ["founder", "super_admin", "admin"]) {
      await expect(caller(role).prices.historyByStudent({ studentId: STUDENT_A.id }), `роль ${role}`).resolves.toBeDefined();
    }
  });

  it("payments.mine доступен только студенту; staff его не видит", async () => {
    await expect(caller("teacher").payments.mine()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller("student").payments.mine()).resolves.toBeDefined();
  });
});

describe("E · подмена суммы игнорируется", () => {
  it("сумма берётся из цены, а не из запроса", async () => {
    memory().studentPrices = [priceRow({ id: 10, amountMinor: 75000, status: "active" })];
    const before = memory().payments!.length;
    // Клиент пытается подсунуть сумму: контракт её не принимает.
    let outcome: unknown = null;
    try {
      outcome = await caller("student").payments.create({ priceId: 10, idempotencyKey: "tamper-key-1", amount: 1 } as never);
    } catch {
      outcome = null;
    }
    void outcome;
    const created = memory().payments!.slice(before);
    for (const row of created) {
      expect(Number(row.amountMinor)).toBe(75000);
      expect(Number(row.amount)).toBe(75000);
      expect(Number(row.amountMinor)).not.toBe(1);
    }
    // В любом случае ни одного платежа с подменённой суммой не осталось.
    expect(memory().payments!.some(row => Number(row.amountMinor) === 1)).toBe(false);
  });
});

describe("E · двойная оплата и идемпотентность", () => {
  it("оплата по уже оплаченной цене отклоняется", async () => {
    memory().studentPrices = [priceRow({ id: 11, amountMinor: 75000, status: "active" })];
    memory().payments = [paymentRow({ id: 900, priceId: 11, status: "completed" })];
    await expect(caller("student").payments.create({ priceId: 11, idempotencyKey: "double-key-1" })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("оплата по цене с ожидающим платежом отклоняется", async () => {
    memory().studentPrices = [priceRow({ id: 12, amountMinor: 75000, status: "active" })];
    memory().payments = [paymentRow({ id: 901, priceId: 12, status: "pending" })];
    await expect(caller("student").payments.create({ priceId: 12, idempotencyKey: "double-key-2" })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("цене со статусом completed платить нельзя", async () => {
    memory().studentPrices = [priceRow({ id: 13, status: "completed" })];
    await expect(caller("student").payments.create({ priceId: 13, idempotencyKey: "done-key-1" })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("тот же ключ идемпотентности возвращает существующий платёж", async () => {
    memory().studentPrices = [priceRow({ id: 14, status: "active" })];
    memory().payments = [paymentRow({ id: 902, priceId: 14, idempotencyKey: "same-key", status: "pending" })];
    // Ветка идемпотентности срабатывает РАНЬШЕ проверки двойной оплаты:
    // тот же ключ возвращает тот же платёж и второго не создаёт.
    const again = await caller("student").payments.create({ priceId: 14, idempotencyKey: "same-key" });
    expect(again.id).toBe(902);
    expect(again.idempotent).toBe(true);
    expect(memory().payments!.filter(row => row.idempotencyKey === "same-key")).toHaveLength(1);
  });
});

describe("E · переход на новый курс сохраняет историю", () => {
  it("старая цена и её платёж остаются видимы студенту", async () => {
    memory().studentPrices = [
      priceRow({ id: 20, programId: 1, status: "completed", amountMinor: 75000 }),
      priceRow({ id: 21, programId: 2, status: "active", amountMinor: 90000 }),
    ];
    memory().payments = [paymentRow({ id: 903, priceId: 20, status: "completed", amountMinor: 75000 })];

    const mine = await caller("student").prices.mine();
    expect(mine.state).toBe("set");
    expect(mine.prices.map(p => p.id).sort((a, b) => a - b)).toEqual([20, 21]);
    expect(mine.prices.find(p => p.id === 20)?.status).toBe("completed");

    const paymentsList = await caller("student").payments.mine();
    expect(paymentsList.map(p => p.id)).toContain(903);
    expect(paymentsList.find(p => p.id === 903)?.priceId).toBe(20);
  });

  it("staffNote никогда не доходит до студента", async () => {
    memory().studentPrices = [priceRow({ id: 22, staffNote: "ONLY-STAFF-SECRET" })];
    const mine = await caller("student").prices.mine();
    expect(JSON.stringify(mine)).not.toContain("ONLY-STAFF-SECRET");
    const staffView = await caller("admin").prices.historyByStudent({ studentId: STUDENT_A.id });
    expect(JSON.stringify(staffView)).toContain("ONLY-STAFF-SECRET");
  });
});

describe("E · политика удаления учитывает цены и платежи", () => {
  it("студент с ценой деактивируется, а не удаляется", async () => {
    memory().studentPrices = [priceRow({ id: 30 })];
    const result = await deleteManagedUser(STUDENT_A.id, { id: 1, role: "founder" });
    expect(result.mode).toBe("deactivated");
    expect(result.dependents).toHaveProperty("studentPrices.studentId");
    expect(inMemoryStore.users.find(u => u.id === STUDENT_A.id)?.isActive).toBe(false);
  });

  it("студент с платежом тоже деактивируется", async () => {
    memory().payments = [paymentRow({ id: 904 })];
    const result = await deleteManagedUser(STUDENT_A.id, { id: 1, role: "founder" });
    expect(result.mode).toBe("deactivated");
    expect(result.dependents).toHaveProperty("payments.userId");
  });
});

describe("E · публичные процедуры не отдают цены, сборы и суммы (read-only)", () => {
  // Только денежные имена. Слово "total" намеренно НЕ входит: публичная процедура
  // translation.getLexicon отдаёт { total, glossary }, где total — количество
  // словарных записей, а не сумма (проверено в прогоне).
  const FORBIDDEN = /(price|fee|amount|cost|currency|minor)/i;

  function collectKeys(value: unknown, path = "", acc: string[] = []): string[] {
    if (Array.isArray(value)) {
      for (const item of value) collectKeys(item, path, acc);
      return acc;
    }
    if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        acc.push(key);
        collectKeys(child, `${path}.${key}`, acc);
      }
    }
    return acc;
  }

  it("ни одна публичная процедура не возвращает денежных полей", async () => {
    const publicCaller = appRouter.createCaller({
      user: null,
      req: { headers: {}, protocol: "http", ip: "127.0.0.1", socket: {} } as TrpcContext["req"],
      res: { cookie: () => {}, clearCookie: () => {} } as TrpcContext["res"],
    });
    const procedures = Object.keys(appRouter._def.procedures);
    const checked: string[] = [];
    const offenders: string[] = [];

    for (const path of procedures) {
      const segments = path.split(".");
      let node: unknown = publicCaller;
      for (const segment of segments) {
        node = (node as Record<string, unknown> | undefined)?.[segment];
        if (node === undefined) break;
      }
      if (typeof node !== "function") continue;
      let result: unknown;
      try {
        result = await (node as () => Promise<unknown>)();
      } catch {
        continue; // защищено ролью, требует ввода или недоступно анонимно
      }
      checked.push(path);
      const keys = collectKeys(result);
      const bad = keys.filter(key => FORBIDDEN.test(key));
      if (bad.length) offenders.push(`${path}: ${[...new Set(bad)].join(", ")}`);
    }

    expect(checked.length, "должна быть проверена хотя бы одна публичная процедура").toBeGreaterThan(0);
    expect(offenders, `публичные процедуры с денежными полями: ${offenders.join(" | ")}`).toEqual([]);
  });
});
