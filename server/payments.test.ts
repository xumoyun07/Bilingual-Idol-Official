import { afterEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";
import { paymentsRouter } from "./routers/payments";
import * as db from "./db";
import * as paymentProvider from "./paymentProvider";
import { ENV } from "./_core/env";
import { handleBillplzCallback } from "./paymentsWebhook";
import { Request, Response } from "express";

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

afterEach(() => {
  vi.restoreAllMocks();
  db.inMemoryStore.payments = [];
  db.inMemoryStore.enrollments = [];
});

describe("Bilingual Idol - Billplz Payment Integration Tests", () => {

  it("1. Missing keys in production leads to a controlled error, database is not modified", async () => {
    // Mock configuration state to disabled/unconfigured
    const configSpy = vi.spyOn(paymentProvider, "isBillplzConfigured").mockReturnValue(false);
    
    // Set production env
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const origIsProd = ENV.isProduction;
    (ENV as any).isProduction = true;

    // Seed mock active enrollment to avoid pre-gateway errors
    db.inMemoryStore.enrollments = [{
      id: 50,
      userId: 6,
      programId: 1,
      agreedPrice: 75000,
      registrationFee: 0,
      placementTestFee: 0,
      visaFee: 0,
      status: "active" as const,
      approvedByUserId: 1,
      approvedAt: new Date(),
      source: "whatsapp" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }];

    const ctx = createTrpcContext("student", 6);
    const caller = paymentsRouter.createCaller(ctx);

    const initialLength = db.inMemoryStore.payments.length;

    // Expect the mutation to throw BAD_REQUEST with a clear localized message
    await expect(caller.create({})).rejects.toThrow(/disabled|offline|payment/i);

    // Verify database was not changed
    expect(db.inMemoryStore.payments.length).toBe(initialLength);

    // Restore environment
    process.env.NODE_ENV = origEnv;
    (ENV as any).isProduction = origIsProd;
    configSpy.mockRestore();
    db.inMemoryStore.enrollments = [];
  });

  it("2. Users cannot initiate payments for other student accounts (unauthorized enrollment access)", async () => {
    // Enable stubbing
    vi.spyOn(paymentProvider, "isBillplzConfigured").mockReturnValue(false);
    
    // Student 6 tries to pay for Student 7
    const ctx = createTrpcContext("student", 6);
    const caller = paymentsRouter.createCaller(ctx);

    await expect(caller.create({ userId: 7 })).rejects.toThrowError(
      new TRPCError({ code: "FORBIDDEN", message: "You are only authorized to make payments for your own account." })
    );
  });

  it("3. Dev-stub/gateway must throw an error and refuse to initialize in production", () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    
    const origIsProd = ENV.isProduction;
    (ENV as any).isProduction = true;

    // Instantiating DevPaymentProvider in production must throw
    expect(() => new paymentProvider.DevPaymentProvider()).toThrow(/strictly unavailable/i);

    // Restore
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

    let resStatus = 0;
    let resText = "";
    const mockRes = {
      status: (code: number) => {
        resStatus = code;
        return mockRes;
      },
      send: (text: string) => {
        resText = text;
        return mockRes;
      },
    } as unknown as Response;

    // Set configuration so it instantiates the real BillplzProvider
    const origApiKey = process.env.BILLPLZ_API_KEY;
    const origCollId = process.env.BILLPLZ_COLLECTION_ID;
    const origSigKey = process.env.BILLPLZ_SIGNATURE_KEY;
    const origEnabled = process.env.BILLPLZ_ENABLED;

    process.env.BILLPLZ_API_KEY = "test_api_key";
    process.env.BILLPLZ_COLLECTION_ID = "test_coll_id";
    process.env.BILLPLZ_SIGNATURE_KEY = "super_secret_sig_key";
    process.env.BILLPLZ_ENABLED = "true";
    
    await handleBillplzCallback(mockReq, mockRes);

    // Invalid signature must yield a 400 Bad Request with "Invalid signature"
    expect(resStatus).toBe(400);
    expect(resText).toContain("Invalid signature");

    // Restore
    process.env.BILLPLZ_API_KEY = origApiKey;
    process.env.BILLPLZ_COLLECTION_ID = origCollId;
    process.env.BILLPLZ_SIGNATURE_KEY = origSigKey;
    process.env.BILLPLZ_ENABLED = origEnabled;
  });

  it("5. Rejected webhooks: Callbacks with mismatched amounts or unknown bill IDs must fail", async () => {
    // Prepare a mock transaction in-memory
    const testPayment = {
      id: 99,
      userId: 6,
      amount: 75000, // RM 750.00
      currency: "MYR",
      status: "pending" as const,
      provider: "billplz",
      transactionReference: "BILL-OK-111",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.inMemoryStore.payments.push(testPayment);

    // Webhook with a mismatched amount (e.g. 50000 instead of 75000)
    const mockReqWrongAmount = {
      body: {
        id: "BILL-OK-111",
        paid: "true",
        amount: "50000", // 50000 is wrong
        x_signature: "any_val_dev",
      },
    } as unknown as Request;

    let resStatusWrong = 0;
    const mockResWrong = {
      status: (code: number) => {
        resStatusWrong = code;
        return mockResWrong;
      },
      send: () => mockResWrong,
    } as unknown as Response;

    // Mock verification so signature check passes
    vi.spyOn(paymentProvider.DevPaymentProvider.prototype, "verifyCallback").mockReturnValue(true);

    await handleBillplzCallback(mockReqWrongAmount, mockResWrong);
    expect(resStatusWrong).toBe(400); // Mismatched amount rejected

    // Unknown Bill ID
    const mockReqUnknownBill = {
      body: {
        id: "BILL-NON-EXISTENT",
        paid: "true",
        amount: "75000",
        x_signature: "any_val_dev",
      },
    } as unknown as Request;

    let resStatusUnknown = 0;
    const mockResUnknown = {
      status: (code: number) => {
        resStatusUnknown = code;
        return mockResUnknown;
      },
      send: () => mockResUnknown,
    } as unknown as Response;

    await handleBillplzCallback(mockReqUnknownBill, mockResUnknown);
    expect(resStatusUnknown).toBe(400); // Unknown bill ID rejected
  });

  it("6. Idempotence: Duplicate success callbacks are safe and return 200 OK (Idempotent)", async () => {
    // Set up a mock payment record that is already marked as completed
    const testPayment = {
      id: 101,
      userId: 6,
      amount: 75000,
      currency: "MYR",
      status: "completed" as const, // already completed
      provider: "billplz",
      transactionReference: "BILL-ID-IDEM",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.inMemoryStore.payments.push(testPayment);

    const mockReq = {
      body: {
        id: "BILL-ID-IDEM",
        paid: "true",
        amount: "75000",
        x_signature: "dev_sig",
      },
    } as unknown as Request;

    let resStatus = 0;
    let resText = "";
    const mockRes = {
      status: (code: number) => {
        resStatus = code;
        return mockRes;
      },
      send: (text: string) => {
        resText = text;
        return mockRes;
      },
    } as unknown as Response;

    vi.spyOn(paymentProvider.DevPaymentProvider.prototype, "verifyCallback").mockReturnValue(true);

    await handleBillplzCallback(mockReq, mockRes);

    // Duplicate callback must return 200 OK with idempotent confirmation
    expect(resStatus).toBe(200);
    expect(resText).toContain("Idempotent");
  });

  it("7. Gateway connection checks must never leak secret API keys/credentials in API responses", async () => {
    process.env.BILLPLZ_API_KEY = "SUPER_SECRET_PRIVATE_API_KEY_NEVER_LEAK";
    process.env.BILLPLZ_SIGNATURE_KEY = "SUPER_SECRET_SIGNATURE_KEY_NEVER_LEAK";

    const ctx = createTrpcContext("admin", 3);
    const caller = paymentsRouter.createCaller(ctx);

    const statusRes = await caller.getGatewayStatus();

    // Verify response is completely redacted and contains no secret traces
    const serialised = JSON.stringify(statusRes);
    expect(serialised).not.toContain("API_KEY");
    expect(serialised).not.toContain("SIGNATURE_KEY");
    expect(statusRes).toHaveProperty("isConfigured");
    expect(statusRes).toHaveProperty("isEnabled");
  });

  it("8. Verify signature generation matches the clean callback webhook format processed in production", () => {
    // Pure Callback format (webhook POST style) from Billplz
    const payload = {
      "id": "zq0tm2wc",
      "paid": "true",
      "paid_at": "2018-09-27 15:15:09 +0800",
      "x_signature": "4db8ddef73ae51dbf8df9268aacc0d746756e8cc0e4ebdb7a4522ed8c3c07ef1"
    };
    const signatureKey = "S-s7b4yWpp9h7rrkNM1i3Z_g";

    // 1. Verify standard helper function matches expected hash exactly
    const computed = paymentProvider.generateBillplzSignature(payload, signatureKey);
    expect(computed).toBe("4db8ddef73ae51dbf8df9268aacc0d746756e8cc0e4ebdb7a4522ed8c3c07ef1");

    // 2. Verify BillplzProvider.verifyCallback processes the payload and returns true
    const origSigKey = process.env.BILLPLZ_SIGNATURE_KEY;
    process.env.BILLPLZ_SIGNATURE_KEY = signatureKey;

    const provider = new paymentProvider.BillplzProvider();
    const isVerified = provider.verifyCallback(payload);
    expect(isVerified).toBe(true);

    process.env.BILLPLZ_SIGNATURE_KEY = origSigKey;
  });

  it("9. Verify signature generation matches the official mixed/redirect reference example from Billplz documentation", () => {
    // Official Billplz documented reference example payload with mixed/bracket keys and x_signature
    const payload = {
      "billplz[id]": "zq0tm2wc",
      "billplz[paid]": "true",
      "billplz[paid_at]": "2018-09-27 15:15:09 +0800",
      "x_signature": "4aab095fe5a39b1d534500988f9a0cb085cd1b6d5bbb55dd4e02ea6fa102b47b"
    };
    const signatureKey = "S-s7b4yWpp9h7rrkNM1i3Z_g";

    // 1. Verify standard helper function matches expected hash exactly
    const computed = paymentProvider.generateBillplzSignature(payload, signatureKey);
    expect(computed).toBe("4aab095fe5a39b1d534500988f9a0cb085cd1b6d5bbb55dd4e02ea6fa102b47b");

    // 2. Verify BillplzProvider.verifyCallback processes the payload and returns true
    const origSigKey = process.env.BILLPLZ_SIGNATURE_KEY;
    process.env.BILLPLZ_SIGNATURE_KEY = signatureKey;

    const provider = new paymentProvider.BillplzProvider();
    const isVerified = provider.verifyCallback(payload);
    expect(isVerified).toBe(true);

    process.env.BILLPLZ_SIGNATURE_KEY = origSigKey;
  });
});
