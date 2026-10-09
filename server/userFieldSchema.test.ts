import { describe, expect, it } from "vitest";
import { normaliseOptions, validateProfileValues, type RuntimeUserField } from "./userFieldSchema";

const base = (overrides: Partial<RuntimeUserField>): RuntimeUserField => ({
  id: 1,
  key: "preferred_language",
  label: "Preferred language",
  fieldType: "text",
  isRequired: false,
  placeholder: null,
  options: [],
  sectionId: null,
  sortOrder: 0,
  isActive: true,
  ...overrides,
});

describe("Users Field Builder runtime validation", () => {
  it("normalises dropdown options and rejects empty dropdown configuration", () => {
    expect(normaliseOptions("dropdown", [" English ", "English", "Malay"])).toEqual(["English", "Malay"]);
    expect(() => normaliseOptions("dropdown", [])).toThrow("Dropdown fields need at least one option.");
    expect(normaliseOptions("text", ["ignored"])).toEqual([]);
  });

  it("enforces required values and rejects unavailable submitted keys", () => {
    const fields = [base({ isRequired: true })];
    expect(() => validateProfileValues(fields, {})).toThrow("Preferred language is required.");
    expect(() => validateProfileValues(fields, { unexpected: "value", preferred_language: "English" })).toThrow("unavailable field");
  });

  it("validates dropdown, number, date and checkbox values on the server", () => {
    const fields = [
      base({ id: 1, key: "level", label: "Level", fieldType: "dropdown", options: ["Beginner", "Advanced"] }),
      base({ id: 2, key: "hours", label: "Hours", fieldType: "number" }),
      base({ id: 3, key: "start_date", label: "Start date", fieldType: "date" }),
      base({ id: 4, key: "consent", label: "Consent", fieldType: "checkbox" }),
    ];
    expect(validateProfileValues(fields, { level: "Advanced", hours: "12.5", start_date: "2026-08-21", consent: "true" })).toEqual({ 1: "Advanced", 2: "12.5", 3: "2026-08-21", 4: "true" });
    expect(() => validateProfileValues(fields, { level: "Other" })).toThrow("configured option");
    expect(() => validateProfileValues(fields, { hours: "twelve" })).toThrow("must be a number");
    expect(() => validateProfileValues(fields, { start_date: "2026-15-99" })).toThrow("valid date");
    expect(() => validateProfileValues(fields, { consent: "yes" })).toThrow("true or false");
  });

  it("allows omitted optional values without creating a profile value", () => {
    expect(validateProfileValues([base({ key: "note", label: "Note", fieldType: "textarea" })], {})).toEqual({});
  });
});
