import { afterEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { paymentsRouter } from "./routers/payments";
import * as db from "./db";
import * as paymentProvider from "./paymentProvider";
import { ENV } from "./_core/env";
import { handleBillplzCallback } from "./paymentsWebhook";
import { Request, Response } from "express";

/**
 * Тесты платежей под НОВЫЙ контракт:
 *  - payments.create принимает только { priceId, idempotencyKey };
 *  - сумма берётся из studentPrices и копируется на платёж как amountMinor;
 *  - фикстуры вебхука используют amountMinor.
 */

function createTrpcContext(role: "student" | "admin" | "founder", userId: number = 6): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `manus:${role}:${userId}`,
      name: `Test ${role}`,
      email: `${role}@example.test`,
      passwordHash: null,
      isActive: true,
      loginMethod: "test",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: { host: "localhost:3000" } } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

type SeedPrice = { id: number; studentId: number; programId?: number; amountMinor: number; status?: string };

function seedPrice(input: SeedPrice) {
  const store = (db.inMemoryStore as unknown as { studentPrices?: unknown[] }).studentPrices ?? [];
  store.push({
    id: input.id,
    studentId: input.studentId,
    programId: input.programId ?? 1,
    amountMinor: input.amountMinor,
    currency: "MYR",
    status: input.status ?? "active",
    agreedBy: 1,
    agreedAt: new Date(),
    staffNote: null,
    supersededById: null,
    supersededReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  (db.inMemoryStore as unknown as { studentPrices?: unknown[] }).studentPrices = store;
}

function mockResponse() {
  const state = { status: 0, text: "" };
  const res = {
    status: (code: number) => {
      state.status = code;
      return res;
    },
    send: (text: string) => {
      state.text = text ?? "";
      return res;
    },
  } as unknown as Response;
  return { res, state };
}

afterEach(() => {
  vi.restoreAllMocks();
  db.inMemoryStore.payments = [];
  db.inMemoryStore.enrollments = [];
  (db.inMemoryStore as unknown as { studentPrices?: unknown[] }).studentPrices = [];
});

describe("Bilingual Idol - Billplz Payment Integration Tests", () => {

  it("1. Missing keys in production leads to a controlled error, database is not modified", async () => {
    vi.spyOn(paymentProvider, "isBillplzConfigured").mockReturnValue(false);

    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const origIsProd = ENV.isProduction;
    (ENV as any).isProduction = true;

    // Согласованная цена — единственный источник суммы.
    seedPrice({ id: 500, studentId: 6, amountMinor: 75000 });

    const caller = paymentsRouter.createCaller(createTrpcContext("student", 6));
    const initialLength = db.inMemoryStore.payments.length;

    await expect(caller.create({ priceId: 500, idempotencyKey: "test-key-0001" })).rejects.toThrow(/disabled|offline|payment/i);

    expect(db.inMemoryStore.payments.length).toBe(initialLength);

    process.env.NODE_ENV = origEnv;
    (ENV as any).isProduction = origIsProd;
  });

  it("2. A student cannot pay another student's price (NOT_FOUND)", async () => {
    vi.spyOn(paymentProvider, "isBillplzConfigured").mockReturnValue(false);

    seedPrice({ id: 501, studentId: 7, amountMinor: 75000 });

    const caller = paymentsRouter.createCaller(createTrpcContext("student", 6));
    await expect(caller.create({ priceId: 501, idempotencyKey: "test-key-0002" })).rejects.toMatchObject({ code: "NOT_FOUND" });

    // Чужая цена не должна создавать платёж.
    expect(db.inMemoryStore.payments.length).toBe(0);
  });

  it("3. Dev-stub/gateway must throw an error and refuse to initialize in production", () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const origIsProd = ENV.isProduction;
    (ENV as any).isProduction = true;

    expect(() => new paymentProvider.DevPaymentProvider()).toThrow(/strictly unavailable/i);

    process.env.NODE_ENV = origEnv;
    (ENV as any).isProduction = origIsProd;
  });

  it("4. Rejected webhooks: Invalid callback signatures must be rejected", async () => {
    const mockReq = {
      body: {
        id: "bill_123",
        paid: "true",
        amount: "50000",
        x_signature: "mismatched_or_invalid_signature_key",
      },
    } as unknown as Request;

    const { res, state } = mockResponse();

    const origApiKey = process.env.BILLPLZ_API_KEY;
    const origCollId = process.env.BILLPLZ_COLLECTION_ID;
    const origSigKey = process.env.BILLPLZ_SIGNATURE_KEY;
    const origEnabled = process.env.BILLPLZ_ENABLED;

    process.env.BILLPLZ_API_KEY = "test_api_key";
    process.env.BILLPLZ_COLLECTION_ID = "test_coll_id";
    process.env.BILLPLZ_SIGNATURE_KEY = "super_secret_sig_key";
    process.env.BILLPLZ_ENABLED = "true";

    await handleBillplzCallback(mockReq, res);

    expect(state.status).toBe(400);
    expect(state.text).toContain("Invalid signature");

    process.env.BILLPLZ_API_KEY = origApiKey;
    process.env.BILLPLZ_COLLECTION_ID = origCollId;
    process.env.BILLPLZ_SIGNATURE_KEY = origSigKey;
    process.env.BILLPLZ_ENABLED = origEnabled;
  });

  it("5. Rejected webhooks: mismatched amounts and unknown bill IDs must fail", async () => {
    // Фикстура нового образца: сумма хранится в amountMinor.
    db.inMemoryStore.payments.push({
      id: 99,
      userId: 6,
      amount: 75000,
      amountMinor: 75000,
      currency: "MYR",
      status: "pending" as const,
      provider: "billplz",
      priceId: 500,
      idempotencyKey: "webhook-fixture-1",
      transactionReference: "BILL-OK-111",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    vi.spyOn(paymentProvider.DevPaymentProvider.prototype, "verifyCallback").mockReturnValue(true);

    const wrongAmount = mockResponse();
    await handleBillplzCallback(
      { body: { id: "BILL-OK-111", paid: "true", amount: "50000", x_signature: "any_val_dev" } } as unknown as Request,
      wrongAmount.res,
    );
    expect(wrongAmount.state.status).toBe(400);

    const unknownBill = mockResponse();
    await handleBillplzCallback(
      { body: { id: "BILL-NON-EXISTENT", paid: "true", amount: "75000", x_signature: "any_val_dev" } } as unknown as Request,
      unknownBill.res,
    );
    expect(unknownBill.state.status).toBe(400);

    // Ни одна из отклонённых попыток не изменила платёж.
    expect(db.inMemoryStore.payments[0].status).toBe("pending");
  });

  it("6. Idempotence: duplicate success callbacks return 200 and change nothing", async () => {
    db.inMemoryStore.payments.push({
      id: 101,
      userId: 6,
      amount: 75000,
      amountMinor: 75000,
      currency: "MYR",
      status: "completed" as const,
      provider: "billplz",
      priceId: 500,
      idempotencyKey: "webhook-fixture-2",
      transactionReference: "BILL-ID-IDEM",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    seedPrice({ id: 500, studentId: 6, amountMinor: 75000, status: "paid" });

    const snapshot = JSON.stringify(db.inMemoryStore.payments);

    vi.spyOn(paymentProvider.DevPaymentProvider.prototype, "verifyCallback").mockReturnValue(true);

    const { res, state } = mockResponse();
    await handleBillplzCallback(
      { body: { id: "BILL-ID-IDEM", paid: "true", amount: "75000", x_signature: "dev_sig" } } as unknown as Request,
      res,
    );

    expect(state.status).toBe(200);
    expect(state.text).toContain("Idempotent");
    expect(JSON.stringify(db.inMemoryStore.payments)).toBe(snapshot);
    expect(db.inMemoryStore.payments.length).toBe(1);
  });

  it("7. Gateway connection checks must never leak secret API keys/credentials in API responses", async () => {
    process.env.BILLPLZ_API_KEY = "SUPER_SECRET_PRIVATE_API_KEY_NEVER_LEAK";
    process.env.BILLPLZ_SIGNATURE_KEY = "SUPER_SECRET_SIGNATURE_KEY_NEVER_LEAK";

    const ctx = createTrpcContext("admin", 3);
    const caller = paymentsRouter.createCaller(ctx);

    const statusRes = await caller.getGatewayStatus();

    const serialised = JSON.stringify(statusRes);
    expect(serialised).not.toContain("API_KEY");
    expect(serialised).not.toContain("SIGNATURE_KEY");
    expect(statusRes).toHaveProperty("isConfigured");
    expect(statusRes).toHaveProperty("isEnabled");
  });

  it("8. Verify signature generation matches the clean callback webhook format processed in production", () => {
    const payload = {
      "id": "zq0tm2wc",
      "paid": "true",
      "paid_at": "2018-09-27 15:15:09 +0800",
      "x_signature": "4db8ddef73ae51dbf8df9268aacc0d746756e8cc0e4ebdb7a4522ed8c3c07ef1"
    };
    const signatureKey = "S-s7b4yWpp9h7rrkNM1i3Z_g";

    const computed = paymentProvider.generateBillplzSignature(payload, signatureKey);
    expect(computed).toBe("4db8ddef73ae51dbf8df9268aacc0d746756e8cc0e4ebdb7a4522ed8c3c07ef1");

    const origSigKey = process.env.BILLPLZ_SIGNATURE_KEY;
    process.env.BILLPLZ_SIGNATURE_KEY = signatureKey;

    const provider = new paymentProvider.BillplzProvider();
    expect(provider.verifyCallback(payload)).toBe(true);

    process.env.BILLPLZ_SIGNATURE_KEY = origSigKey;
  });

  it("9. Verify signature generation matches the official mixed/redirect reference example from Billplz documentation", () => {
    const payload = {
      "billplz[id]": "zq0tm2wc",
      "billplz[paid]": "true",
      "billplz[paid_at]": "2018-09-27 15:15:09 +0800",
      "x_signature": "4aab095fe5a39b1d534500988f9a0cb085cd1b6d5bbb55dd4e02ea6fa102b47b"
    };
    const signatureKey = "S-s7b4yWpp9h7rrkNM1i3Z_g";

    const computed = paymentProvider.generateBillplzSignature(payload, signatureKey);
    expect(computed).toBe("4aab095fe5a39b1d534500988f9a0cb085cd1b6d5bbb55dd4e02ea6fa102b47b");

    const origSigKey = process.env.BILLPLZ_SIGNATURE_KEY;
    process.env.BILLPLZ_SIGNATURE_KEY = signatureKey;

    const provider = new paymentProvider.BillplzProvider();
    expect(provider.verifyCallback(payload)).toBe(true);

    process.env.BILLPLZ_SIGNATURE_KEY = origSigKey;
  });
});
