/**
 * Слой данных согласованных цен студента.
 *
 * Правила:
 *  - одна 'active' цена на пару (studentId, programId): уникальный индекс
 *    studentPrices_active_unique + проверка в коде внутри транзакции;
 *  - сумму существующей строки изменить нельзя НИКОГДА: смена цены создаёт новую
 *    строку, старая становится 'superseded' со ссылкой supersededById и причиной;
 *  - ничего в истории цен и платежей не удаляется физически;
 *  - staffNote — внутренняя заметка: наружу студенту не отдаётся.
 */

import { and, desc, eq, inArray } from "drizzle-orm";
import { studentPrices, payments, users, type User } from "../../drizzle/schema";
import { getDb, inMemoryStore } from "../db";
import { DEFAULT_CURRENCY } from "../../shared/const";
import { decideDeletion, DEACTIVATION_MESSAGE } from "./userPolicy";

export type PriceStatus = "active" | "paid" | "completed" | "cancelled" | "superseded";

export type PriceRow = {
  id: number;
  studentId: number;
  programId: number;
  amountMinor: number;
  currency: string;
  status: PriceStatus;
  agreedBy: number;
  agreedAt: Date;
  staffNote: string | null;
  supersededById: number | null;
  supersededReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class PriceError extends Error {
  readonly code: "NOT_FOUND" | "CONFLICT" | "BAD_REQUEST" | "FORBIDDEN";
  constructor(code: PriceError["code"], message: string) {
    super(message);
    this.name = "PriceError";
    this.code = code;
  }
}

export const NO_PRICE_STATE = "not_set" as const;

/** Поля, которые видит СТУДЕНТ: без staffNote. */
export const STUDENT_PRICE_FIELDS = ["id", "programId", "amountMinor", "currency", "status", "agreedAt"] as const;

export type StudentVisiblePrice = Pick<PriceRow, "id" | "programId" | "amountMinor" | "currency" | "status" | "agreedAt">;

export function toStudentVisiblePrice(row: PriceRow): StudentVisiblePrice {
  return {
    id: row.id,
    programId: row.programId,
    amountMinor: row.amountMinor,
    currency: row.currency,
    status: row.status,
    agreedAt: row.agreedAt,
  };
}

/* ------------------------------------------------------------------ */
/* Чтение                                                              */
/* ------------------------------------------------------------------ */

async function memoryRows(): Promise<PriceRow[]> {
  return ((inMemoryStore as unknown as { studentPrices?: PriceRow[] }).studentPrices ?? []);
}

export async function listPricesByStudent(studentId: number): Promise<PriceRow[]> {
  const database = await getDb();
  if (!database) {
    return (await memoryRows()).filter(row => row.studentId === studentId).sort((a, b) => b.id - a.id);
  }
  return database.select().from(studentPrices).where(eq(studentPrices.studentId, studentId)).orderBy(desc(studentPrices.id));
}

export async function getPriceById(id: number): Promise<PriceRow | undefined> {
  const database = await getDb();
  if (!database) return (await memoryRows()).find(row => row.id === id);
  return (await database.select().from(studentPrices).where(eq(studentPrices.id, id)).limit(1))[0];
}

export async function findActivePrice(studentId: number, programId: number): Promise<PriceRow | undefined> {
  const database = await getDb();
  if (!database) {
    return (await memoryRows()).find(row => row.studentId === studentId && row.programId === programId && row.status === "active");
  }
  return (await database
    .select()
    .from(studentPrices)
    .where(and(eq(studentPrices.studentId, studentId), eq(studentPrices.programId, programId), eq(studentPrices.status, "active")))
    .limit(1))[0];
}

export async function listPaymentsByStudent(studentId: number) {
  const database = await getDb();
  if (!database) {
    const store = (inMemoryStore as unknown as { payments?: Array<Record<string, unknown>> }).payments ?? [];
    return store.filter(row => Number(row.userId) === studentId);
  }
  return database.select().from(payments).where(eq(payments.userId, studentId)).orderBy(desc(payments.id));
}

export async function getPaymentById(id: number) {
  const database = await getDb();
  if (!database) {
    const store = (inMemoryStore as unknown as { payments?: Array<Record<string, unknown>> }).payments ?? [];
    return store.find(row => Number(row.id) === id);
  }
  return (await database.select().from(payments).where(eq(payments.id, id)).limit(1))[0];
}

/** Согласованная цена вместе с платежами по ней — для staff-истории. */
export async function historyWithPayments(studentId: number) {
  const prices = await listPricesByStudent(studentId);
  const payList = await listPaymentsByStudent(studentId);
  return prices.map(price => ({
    ...price,
    payments: (payList as Array<Record<string, unknown>>).filter(payment => Number(payment.priceId) === price.id),
  }));
}

/* ------------------------------------------------------------------ */
/* Проверки цели                                                       */
/* ------------------------------------------------------------------ */

async function assertActiveStudent(studentId: number): Promise<void> {
  const database = await getDb();
  let row: { id: number; role: string; isActive: boolean } | undefined;
  if (!database) {
    const found = inMemoryStore.users.find(user => user.id === studentId);
    row = found ? { id: found.id, role: found.role, isActive: Boolean(found.isActive) } : undefined;
  } else {
    row = (await database.select({ id: users.id, role: users.role, isActive: users.isActive }).from(users).where(eq(users.id, studentId)).limit(1))[0];
  }
  if (!row) throw new PriceError("NOT_FOUND", "Student account not found.");
  if (row.role !== "student") throw new PriceError("BAD_REQUEST", "Prices can only be agreed for student accounts.");
  if (!row.isActive) throw new PriceError("BAD_REQUEST", "This student account is deactivated.");
}

async function programExists(programId: number): Promise<boolean> {
  const database = await getDb();
  if (!database) {
    const store = (inMemoryStore as unknown as { programs?: Array<{ id: number }> }).programs ?? [];
    return store.some(program => Number(program.id) === programId);
  }
  const { programs } = await import("../../drizzle/schema");
  const rows = await database.select({ id: programs.id }).from(programs).where(eq(programs.id, programId)).limit(1);
  return rows.length > 0;
}

/** Платежи по цене, которые уже завершены. */
export async function completedPaymentsForPrice(priceId: number): Promise<number> {
  const database = await getDb();
  const filter = (row: Record<string, unknown>) => Number(row.priceId) === priceId && String(row.status) === "completed";
  if (!database) {
    const store = (inMemoryStore as unknown as { payments?: Array<Record<string, unknown>> }).payments ?? [];
    return store.filter(filter).length;
  }
  const rows = await database
    .select()
    .from(payments)
    .where(and(eq(payments.priceId, priceId), eq(payments.status, "completed")));
  return rows.length;
}

/* ------------------------------------------------------------------ */
/* Мутации                                                             */
/* ------------------------------------------------------------------ */

export type SetPriceInput = {
  studentId: number;
  programId: number;
  amountMinor: number;
  staffNote?: string | null;
};

function assertAmount(amountMinor: number) {
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    throw new PriceError("BAD_REQUEST", "The agreed price must be a positive whole number of minor units.");
  }
}

async function insertPrice(row: Omit<PriceRow, "id" | "createdAt" | "updatedAt" | "supersededById" | "supersededReason">): Promise<PriceRow> {
  const database = await getDb();
  const now = new Date();
  if (!database) {
    const store = (inMemoryStore as unknown as { studentPrices?: PriceRow[] }).studentPrices ?? [];
    const created: PriceRow = {
      ...row,
      id: store.reduce((max, item) => Math.max(max, item.id), 0) + 1,
      supersededById: null,
      supersededReason: null,
      createdAt: now,
      updatedAt: now,
    };
    store.push(created);
    (inMemoryStore as unknown as { studentPrices?: PriceRow[] }).studentPrices = store;
    return created;
  }
  const result = await database.insert(studentPrices).values({
    studentId: row.studentId,
    programId: row.programId,
    amountMinor: row.amountMinor,
    currency: row.currency,
    status: row.status,
    agreedBy: row.agreedBy,
    agreedAt: row.agreedAt,
    staffNote: row.staffNote,
  });
  return (await getPriceById(Number(result[0].insertId))) as PriceRow;
}

/** Новая согласованная цена. Отказывает, если 'active' уже есть — нужен change. */
export async function setPrice(input: SetPriceInput, actor: { id: number; role: string }): Promise<PriceRow> {
  assertAmount(input.amountMinor);
  await assertActiveStudent(input.studentId);
  if (!(await programExists(input.programId))) throw new PriceError("NOT_FOUND", "Program not found.");

  const existing = await findActivePrice(input.studentId, input.programId);
  if (existing) {
    throw new PriceError("CONFLICT", `An active price already exists for this student and program (id ${existing.id}). Use prices.change to replace it.`);
  }
  return insertPrice({
    studentId: input.studentId,
    programId: input.programId,
    amountMinor: input.amountMinor,
    currency: DEFAULT_CURRENCY,
    status: "active",
    agreedBy: actor.id,
    agreedAt: new Date(),
    staffNote: input.staffNote ?? null,
  });
}

export type ChangePriceInput = {
  studentId: number;
  programId: number;
  amountMinor: number;
  reason: string;
  staffNote?: string | null;
};

/**
 * Замена цены: НОВАЯ строка 'active', старая — 'superseded' + supersededById + reason.
 * Одной транзакцией. Сумма старой строки не меняется.
 */
export async function changePrice(input: ChangePriceInput, actor: { id: number; role: string }): Promise<{ created: PriceRow; superseded: PriceRow }> {
  assertAmount(input.amountMinor);
  const reason = (input.reason ?? "").trim();
  if (reason.length < 3) throw new PriceError("BAD_REQUEST", "A reason of at least 3 characters is required to change an agreed price.");
  await assertActiveStudent(input.studentId);

  const previous = await findActivePrice(input.studentId, input.programId);
  if (!previous) throw new PriceError("NOT_FOUND", "There is no active price for this student and program. Use prices.set first.");

  const database = await getDb();
  const now = new Date();

  if (!database) {
    const created = await insertPrice({
      studentId: input.studentId,
      programId: input.programId,
      amountMinor: input.amountMinor,
      currency: DEFAULT_CURRENCY,
      status: "active",
      agreedBy: actor.id,
      agreedAt: now,
      staffNote: input.staffNote ?? null,
    });
    const store = (inMemoryStore as unknown as { studentPrices?: PriceRow[] }).studentPrices ?? [];
    const target = store.find(row => row.id === previous.id);
    if (target) {
      target.status = "superseded";
      target.supersededById = created.id;
      target.supersededReason = reason;
      target.updatedAt = now;
    }
    return { created, superseded: { ...previous, status: "superseded", supersededById: created.id, supersededReason: reason } };
  }

  const created = await database.transaction(async tx => {
    const inserted = await tx.insert(studentPrices).values({
      studentId: input.studentId,
      programId: input.programId,
      amountMinor: input.amountMinor,
      currency: DEFAULT_CURRENCY,
      status: "active",
      agreedBy: actor.id,
      agreedAt: now,
      staffNote: input.staffNote ?? null,
    });
    const newId = Number(inserted[0].insertId);
    await tx
      .update(studentPrices)
      .set({ status: "superseded", supersededById: newId, supersededReason: reason, updatedAt: now })
      .where(eq(studentPrices.id, previous.id));
    return (await tx.select().from(studentPrices).where(eq(studentPrices.id, newId)).limit(1))[0] as PriceRow;
  });

  return { created, superseded: { ...previous, status: "superseded", supersededById: created.id, supersededReason: reason } };
}

/** Отмена: только если по цене нет ни одного завершённого платежа. */
export async function cancelPrice(input: { priceId: number; reason: string }, actor: { id: number; role: string }): Promise<PriceRow> {
  const reason = (input.reason ?? "").trim();
  if (reason.length < 3) throw new PriceError("BAD_REQUEST", "A reason of at least 3 characters is required to cancel a price.");
  const price = await getPriceById(input.priceId);
  if (!price) throw new PriceError("NOT_FOUND", "Price not found.");
  if (price.status === "cancelled") throw new PriceError("CONFLICT", "This price is already cancelled.");
  if ((await completedPaymentsForPrice(price.id)) > 0) {
    throw new PriceError("CONFLICT", "This price has a completed payment and cannot be cancelled.");
  }
  return updateStatus(price, "cancelled", reason, actor);
}

/** Завершение курса: 'active' или 'paid' → 'completed'. История сохраняется. */
export async function completePrice(input: { priceId: number }, actor: { id: number; role: string }): Promise<PriceRow> {
  const price = await getPriceById(input.priceId);
  if (!price) throw new PriceError("NOT_FOUND", "Price not found.");
  if (price.status === "completed") throw new PriceError("CONFLICT", "This price is already completed.");
  if (price.status === "cancelled" || price.status === "superseded") {
    throw new PriceError("CONFLICT", `A ${price.status} price cannot be completed.`);
  }
  return updateStatus(price, "completed", `Course completed by ${actor.role}.`, actor);
}

async function updateStatus(price: PriceRow, status: PriceStatus, reason: string, actor: { id: number; role: string }): Promise<PriceRow> {
  const database = await getDb();
  const now = new Date();
  void reason;
  void actor;
  if (!database) {
    const store = (inMemoryStore as unknown as { studentPrices?: PriceRow[] }).studentPrices ?? [];
    const target = store.find(row => row.id === price.id);
    if (target) {
      target.status = status;
      target.updatedAt = now;
    }
    return { ...price, status, updatedAt: now };
  }
  await database.update(studentPrices).set({ status, updatedAt: now }).where(eq(studentPrices.id, price.id));
  return (await getPriceById(price.id)) as PriceRow;
}

/* ------------------------------------------------------------------ */
/* Проверка удаления: финансовые строки блокируют жёсткое удаление      */
/* ------------------------------------------------------------------ */

export async function priceDeletionGuard(studentId: number): Promise<{ allowed: true } | { allowed: false; message: string }> {
  const prices = await listPricesByStudent(studentId);
  const payList = await listPaymentsByStudent(studentId);
  const decision = decideDeletion({ dependents: { perTable: {}, total: prices.length + payList.length } });
  return decision.action === "hard_delete" ? { allowed: true } : { allowed: false, message: DEACTIVATION_MESSAGE };
}

export type { User };
export { inArray };

/* ------------------------------------------------------------------ */
/* Проведение платежа: платёж и связанная цена — одной транзакцией      */
/* ------------------------------------------------------------------ */

/**
 * Идемпотентно: если платёж уже не 'pending', ничего не меняется и возвращается
 * changed=false. При 'completed' связанная цена переходит в 'paid'.
 */
export async function settlePaymentAndPrice(
  paymentId: number,
  status: "completed" | "failed",
  reference?: string,
  method?: string,
): Promise<{ changed: boolean; reason: "settled" | "already_settled" | "not_found" }> {
  const database = await getDb();
  const now = new Date();
  if (database) {
    return database.transaction(async tx => {
      const row = (await tx.select().from(payments).where(eq(payments.id, paymentId)).limit(1))[0] as unknown as
        | { id: number; status: string; priceId: number | null; transactionReference: string | null; paymentMethod: string | null }
        | undefined;
      if (!row) return { changed: false, reason: "not_found" as const };
      if (row.status !== "pending") return { changed: false, reason: "already_settled" as const };
      await tx.update(payments).set({
        status,
        transactionReference: reference ?? row.transactionReference,
        paymentMethod: method ?? row.paymentMethod,
        updatedAt: now,
      }).where(eq(payments.id, paymentId));
      if (status === "completed" && row.priceId) {
        await tx.update(studentPrices)
          .set({ status: "paid", updatedAt: now })
          .where(and(eq(studentPrices.id, row.priceId), eq(studentPrices.status, "active")));
      }
      return { changed: true, reason: "settled" as const };
    });
  }

  const store = (inMemoryStore as unknown as { payments?: Array<Record<string, any>> }).payments ?? [];
  const row = store.find(item => Number(item.id) === paymentId);
  if (!row) return { changed: false, reason: "not_found" as const };
  if (String(row.status) !== "pending") return { changed: false, reason: "already_settled" as const };
  row.status = status;
  if (status === "completed" && row.priceId) {
    const prices = (inMemoryStore as unknown as { studentPrices?: PriceRow[] }).studentPrices ?? [];
    const target = prices.find(price => price.id === Number(row.priceId) && price.status === "active");
    if (target) target.status = "paid";
  }
  return { changed: true, reason: "settled" as const };
}