import { createHmac, timingSafeEqual } from "crypto";
import { ENV } from "./_core/env";

export interface CreateBillInput {
  name: string;
  email: string;
  mobile?: string;
  amount: number; // in cents
  description: string;
  callbackUrl: string;
  redirectUrl: string;
}

export interface BillResponse {
  id: string;
  url: string;
}

export interface PaymentProvider {
  createBill(input: CreateBillInput): Promise<BillResponse>;
  getBill(billId: string): Promise<{ paid: boolean; status: string; amount: number }>;
  verifyCallback(params: Record<string, any>): boolean;
}

// Helper to check if Billplz environment variables are fully configured
export function isBillplzConfigured(): boolean {
  return !!(
    process.env.BILLPLZ_API_KEY &&
    process.env.BILLPLZ_COLLECTION_ID &&
    process.env.BILLPLZ_SIGNATURE_KEY &&
    process.env.BILLPLZ_ENABLED === "true"
  );
}

/**
 * Normalizes any nested payload structure into flat bracket-notation keys.
 * Handles both already flat { "billplz[id]": "..." } and parsed nested { billplz: { id: "..." } } payloads.
 */
export function normalizePayload(body: any): Record<string, string> {
  const result: Record<string, string> = {};

  function recurse(obj: any, prefix = "") {
    if (obj === null || obj === undefined) return;
    if (typeof obj !== "object" || obj instanceof Date) {
      if (prefix) {
        result[prefix] = String(obj);
      }
      return;
    }
    for (const [key, val] of Object.entries(obj)) {
      const nextPrefix = prefix ? `${prefix}[${key}]` : key;
      recurse(val, nextPrefix);
    }
  }

  // If already flat with bracket keys, use as is
  let isAlreadyFlat = false;
  for (const k of Object.keys(body || {})) {
    if (k.includes("[")) {
      isAlreadyFlat = true;
      break;
    }
  }

  if (isAlreadyFlat) {
    for (const [k, v] of Object.entries(body || {})) {
      result[k] = v === null || v === undefined ? "" : String(v);
    }
  } else {
    recurse(body);
  }

  return result;
}

/**
 * Generates Billplz signature for verification.
 * Follows the official rule: sorts keys case-insensitively ascending, joins key-value with |, computes HMAC-SHA256.
 */
export function generateBillplzSignature(payload: Record<string, any>, signatureKey: string): string {
  const flatPayload = normalizePayload(payload);
  
  // Filter out any signature key (x_signature, billplz[x_signature], or suffix)
  const rest: Record<string, string> = {};
  for (const [key, val] of Object.entries(flatPayload)) {
    if (key === "x_signature" || key === "billplz[x_signature]" || key.endsWith("[x_signature]")) {
      continue;
    }
    rest[key] = val;
  }

  const sourceStrings: string[] = [];

  for (const [key, val] of Object.entries(rest)) {
    // 1. Strip brackets from key
    const cleanKey = key.replace(/[\[\]]/g, "");
    // 2. Convert value to string (or empty if nil)
    const valStr = val === undefined || val === null ? "" : String(val);
    // 3. Construct source string
    sourceStrings.push(cleanKey + valStr);
  }

  // 4. Sort case-insensitively ascending
  sourceStrings.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  // 5. Combine with pipe
  const combined = sourceStrings.join("|");

  // 6. Compute HMAC-SHA256 signature using signatureKey as secret
  return createHmac("sha256", signatureKey).update(combined).digest("hex");
}

export class BillplzProvider implements PaymentProvider {
  private apiKey: string;
  private collectionId: string;
  private signatureKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.BILLPLZ_API_KEY || "";
    this.collectionId = process.env.BILLPLZ_COLLECTION_ID || "";
    this.signatureKey = process.env.BILLPLZ_SIGNATURE_KEY || "";
    
    const isSandbox = process.env.BILLPLZ_SANDBOX === "true";
    this.baseUrl = isSandbox 
      ? "https://www.billplz-sandbox.com/api/v3" 
      : "https://www.billplz.com/api/v3";
  }

  private getAuthHeader(): string {
    return "Basic " + Buffer.from(`${this.apiKey}:`).toString("base64");
  }

  async createBill(input: CreateBillInput): Promise<BillResponse> {
    if (!this.apiKey || !this.collectionId) {
      throw new Error("Billplz API key or Collection ID is not configured.");
    }

    const endpoint = `${this.baseUrl}/bills`;
    const bodyParams = new URLSearchParams();
    bodyParams.append("collection_id", this.collectionId);
    bodyParams.append("email", input.email);
    bodyParams.append("name", input.name);
    bodyParams.append("amount", Math.round(input.amount).toString()); // amount in cents
    bodyParams.append("description", input.description);
    bodyParams.append("callback_url", input.callbackUrl);
    bodyParams.append("redirect_url", input.redirectUrl);
    if (input.mobile) {
      bodyParams.append("mobile", input.mobile);
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": this.getAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyParams.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Billplz API bill creation failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.id || !data.url) {
      throw new Error("Invalid response received from Billplz API.");
    }

    return {
      id: data.id,
      url: data.url,
    };
  }

  async getBill(billId: string): Promise<{ paid: boolean; status: string; amount: number }> {
    if (!this.apiKey) {
      throw new Error("Billplz API key is not configured.");
    }

    const endpoint = `${this.baseUrl}/bills/${billId}`;
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Authorization": this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Billplz API bill fetch failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return {
      paid: data.paid === true || data.paid === "true",
      status: data.state || "pending",
      amount: Number(data.amount || 0),
    };
  }

  verifyCallback(params: Record<string, any>): boolean {
    if (!this.signatureKey) return false;
    
    // Support both callback (x_signature) and redirect (billplz[x_signature])
    const flatPayload = normalizePayload(params);
    const receivedSig = flatPayload.x_signature || flatPayload["billplz[x_signature]"] || params.x_signature;
    if (!receivedSig) return false;

    const computedSig = generateBillplzSignature(params, this.signatureKey);

    try {
      const buf1 = Buffer.from(receivedSig, "hex");
      const buf2 = Buffer.from(computedSig, "hex");
      if (buf1.length !== buf2.length) return false;
      return timingSafeEqual(buf1, buf2);
    } catch {
      return receivedSig === computedSig;
    }
  }
}

/**
 * Dev payment gateway stub for sandbox simulations in non-production environments.
 * Throws errors if initialized or invoked in production.
 */
export class DevPaymentProvider implements PaymentProvider {
  constructor() {
    if (ENV.isProduction) {
      throw new Error("DevPaymentProvider stub is strictly unavailable in production environments.");
    }
  }

  async createBill(input: CreateBillInput): Promise<BillResponse> {
    if (ENV.isProduction) {
      throw new Error("DevPaymentProvider stub is strictly unavailable in production environments.");
    }
    const mockBillId = "MOCK-BILL-" + Math.floor(100000 + Math.random() * 900000);
    // Return a dummy URL that redirects to the local callback test route
    return {
      id: mockBillId,
      url: `/payment/simulated-gateway?billId=${mockBillId}&amount=${input.amount}`,
    };
  }

  async getBill(billId: string): Promise<{ paid: boolean; status: string; amount: number }> {
    if (ENV.isProduction) {
      throw new Error("DevPaymentProvider stub is strictly unavailable in production environments.");
    }
    return {
      paid: true,
      status: "completed",
      amount: 75000,
    };
  }

  verifyCallback(params: Record<string, any>): boolean {
    if (ENV.isProduction) {
      throw new Error("DevPaymentProvider stub is strictly unavailable in production environments.");
    }
    // Simple verification for mock callbacks - allow empty/mock signature for development
    return true;
  }
}

/**
 * Returns the configured PaymentProvider instance based on configuration and environment.
 */
export function getPaymentProvider(): PaymentProvider {
  if (isBillplzConfigured()) {
    return new BillplzProvider();
  }

  if (!ENV.isProduction) {
    return new DevPaymentProvider();
  }

  throw new Error("Payment gateway is not configured. Please contact the administrator.");
}
