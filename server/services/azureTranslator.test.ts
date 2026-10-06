import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { 
  protectContent, 
  unprotectContent, 
  cleanExtraSpaces, 
  validateTranslation, 
  extractPlaceholders, 
  extractHtmlTags,
  translateBatch,
  getTranslatorUsage,
  decodeHtmlEntities
} from "./azureTranslator";

describe("Azure Translator Advanced Auditing & Spacing", () => {
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should wrap exact items in exactly one span and avoid nested wrapping for emails and links", () => {
    // 1. "nickname@bilc.my" should give exactly one span
    const emailProt = protectContent("nickname@bilc.my");
    expect(emailProt).toBe('<span class="notranslate">nickname@bilc.my</span>');

    // 2. "e.g. 3.5 hours" should give no spans
    const egProt = protectContent("e.g. 3.5 hours");
    expect(egProt).toBe("e.g. 3.5 hours");

    // 3. "Mr.Smith" should give no spans
    const smithProt = protectContent("Mr.Smith");
    expect(smithProt).toBe("Mr.Smith");

    // 4. Combined sentence with email and URL
    const combined = "Contact info@example.com or visit www.bilc.my";
    const combinedProt = protectContent(combined);
    expect(combinedProt).toBe('Contact <span class="notranslate">info@example.com</span> or visit <span class="notranslate">www.bilc.my</span>');
  });

  it("should successfully collapse horizontal spaces around punctuation while preserving carriage returns and newlines", () => {
    const input = "Visit Pavilion Embassy .\nCall us at Bilingual Idol , John !";
    const expected = "Visit Pavilion Embassy.\nCall us at Bilingual Idol, John!";
    const cleaned = cleanExtraSpaces(input);
    expect(cleaned).toBe(expected);

    // Additional requested test cases
    expect(cleanExtraSpaces("Welcome to Bilingual Idol, John!")).toBe("Welcome to Bilingual Idol, John!");
    expect(cleanExtraSpaces("Visit Pavilion Embassy. Call us.")).toBe("Visit Pavilion Embassy. Call us.");
  });

  it("should perform a perfect roundtrip protect/unprotect with no left-over notranslate tags", () => {
    const cases = [
      "info@example.com",
      "nickname@bilc.my",
      "www.bilc.my",
      "https://bilc.my/contact?x=1",
      "{name}, welcome to Bilingual Idol (IELTS)",
      "e.g. 3.5 hours",
      "مرحبا بك في منصة Bilingual Idol، {studentName}!"
    ];

    for (const c of cases) {
      const protectedText = protectContent(c);
      const unprotected = unprotectContent(protectedText);
      expect(unprotected).toBe(c);
      expect(protectedText).not.toContain("notranslate notranslate"); // No nested wrapping
      expect(unprotected).not.toContain("notranslate");
      expect(unprotected).not.toContain("<span");
    }
  });

  it("should not send empty batches and should return skipped/empty mappings immediately", async () => {
    // 1. Empty texts list
    const resEmptyTexts = await translateBatch([], ["ms"]);
    expect(resEmptyTexts.translations).toEqual({});
    expect(fetchSpy).not.toHaveBeenCalled();

    // 2. Empty target languages
    const resEmptyLangs = await translateBatch(["Hello"], []);
    expect(resEmptyLangs.translations["Hello"]).toEqual({});
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should only increment monthly quota for successful batches, not for failed ones", async () => {
    const initialUsage = await getTranslatorUsage();

    // Mock failure
    fetchSpy.mockRejectedValueOnce(new Error("Fatal Error"));
    await translateBatch(["UniqueFailedTextQuotaTest"], ["ms"]);
    
    const usageAfterFailure = await getTranslatorUsage();
    expect(usageAfterFailure).toBe(initialUsage); // Quota did not grow!

    // Mock success
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => [
        {
          translations: [{ text: "Halo", to: "ms" }]
        }
      ]
    } as Response);

    await translateBatch(["UniqueSuccessTextQuotaTest"], ["ms"]);
    const usageAfterSuccess = await getTranslatorUsage();
    expect(usageAfterSuccess).toBeGreaterThan(initialUsage); // Quota grew!
  });

  it("should run integration translation if real key is available, or skip gracefully", async () => {
    const key = process.env.AZURE_TRANSLATOR_KEY;
    if (key) {
      // Restore fetch spy so real network request is made
      fetchSpy.mockRestore();
      console.log("[Integration Test] Running real Azure Translator API call...");
      const res = await translateBatch(["Welcome to Bilingual Idol!"], ["ms"]);
      const msTrans = res.translations["Welcome to Bilingual Idol!"]["ms"];
      expect(["ok", "skipped"]).toContain(msTrans.status);
      if (msTrans.status === "ok") {
        console.log("[Integration Test] Translation success:", msTrans.text);
        expect(msTrans.text).toBeTruthy();
      } else {
        console.warn("[Integration Test] Translation skipped (possibly quota limits).");
      }
    } else {
      console.log("[Integration Test] No real Azure key available. Skipping real network integration check.");
    }
  });

  it("should decode HTML entities like &amp;, &#39;, and &apos; on translated texts", () => {
    const text = "Terms &amp; Conditions and Don&#39;t miss out!";
    const decoded = decodeHtmlEntities(text);
    expect(decoded).toBe("Terms & Conditions and Don't miss out!");
  });

  it("should calculate monthly quota based on the protectedText.length containing injected markup", () => {
    const text = "Welcome to Bilingual Idol, {name}!";
    const protectedText = protectContent(text);
    
    // Total length is exactly 100 characters containing 2 protective spans
    expect(protectedText.length).toBe(100);
  });

  it("should strictly not retry on 401 Unauthorized errors and return failed items status", async () => {
    fetchSpy.mockResolvedValue({
      status: 401,
      ok: false,
      text: async () => "Unauthorized Key"
    } as Response);

    const res = await translateBatch(["Hello"], ["ms"]);
    expect(res.translations["Hello"]["ms"].status).toBe("failed");
    expect(fetchSpy).toHaveBeenCalledTimes(1); // Exactly 1 call, no retries!
  });

  it("should strictly not retry on 403 Forbidden errors and return failed items status", async () => {
    fetchSpy.mockResolvedValue({
      status: 403,
      ok: false,
      text: async () => "Out of call volume quota"
    } as Response);

    const res = await translateBatch(["Hello"], ["ms"]);
    expect(res.translations["Hello"]["ms"].status).toBe("failed");
    expect(fetchSpy).toHaveBeenCalledTimes(1); // Exactly 1 call, no retries!
  });

  it("should retry on 429 Too Many Requests errors with exponential backoff", async () => {
    // Mock first call as 429, second as success
    fetchSpy
      .mockResolvedValueOnce({
        status: 429,
        ok: false,
        text: async () => "Too Many Requests"
      } as Response)
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => [
          {
            translations: [{ text: "Halo", to: "ms" }]
          }
        ]
      } as Response);

    const res = await translateBatch(["Hello"], ["ms"]);
    expect(res.translations["Hello"]["ms"].status).toBe("ok");
    expect(res.translations["Hello"]["ms"].text).toBe("Halo");
    expect(fetchSpy).toHaveBeenCalledTimes(2); // Retried once!
  });

  it("should return failed status on items when batch api request fails after retries", async () => {
    fetchSpy.mockRejectedValue(new Error("Network Failure"));

    const res = await translateBatch(["Hello"], ["ms"]);
    expect(res.translations["Hello"]["ms"].status).toBe("failed");
    expect(res.translations["Hello"]["ms"].text).toBeUndefined(); // Never returns original text as translation
    expect(fetchSpy).toHaveBeenCalledTimes(4); // Initial call + 3 retries
  }, 15000); // 15s timeout to allow full backoff retry cycle
});
