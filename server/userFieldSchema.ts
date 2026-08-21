export const userFieldTypes = ["text", "textarea", "number", "date", "dropdown", "checkbox"] as const;
export type UserFieldType = (typeof userFieldTypes)[number];

export type RuntimeUserField = {
  id: number;
  key: string;
  label: string;
  fieldType: UserFieldType;
  isRequired: boolean;
  placeholder: string | null;
  options: string[];
  sectionId: number | null;
  sortOrder: number;
  isActive: boolean;
};

export function parseFieldOptions(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every(option => typeof option === "string") ? parsed : [];
  } catch { return []; }
}

export function normaliseOptions(fieldType: UserFieldType, options: string[] = []) {
  if (fieldType !== "dropdown") return [];
  const unique = Array.from(new Set(options.map(option => option.trim()).filter(Boolean)));
  if (!unique.length) throw new Error("Dropdown fields need at least one option.");
  if (unique.length > 30 || unique.some(option => option.length > 100)) throw new Error("Dropdown options exceed the supported limit.");
  return unique;
}

export function validateProfileValues(fields: RuntimeUserField[], values: Record<string, string> = {}) {
  const activeFields = fields.filter(field => field.isActive);
  const supportedKeys = new Set(activeFields.map(field => field.key));
  for (const key of Object.keys(values)) if (!supportedKeys.has(key)) throw new Error("The submitted profile contains an unavailable field.");
  const validated: Record<number, string> = {};
  for (const field of activeFields) {
    const raw = values[field.key] ?? "";
    const value = typeof raw === "string" ? raw.trim() : "";
    if (field.isRequired && value === "") throw new Error(`${field.label} is required.`);
    if (value === "") continue;
    if (value.length > 4000) throw new Error(`${field.label} is too long.`);
    if (field.fieldType === "number" && !/^-?\d+(\.\d+)?$/.test(value)) throw new Error(`${field.label} must be a number.`);
    if (field.fieldType === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)))) throw new Error(`${field.label} must be a valid date.`);
    if (field.fieldType === "dropdown" && !field.options.includes(value)) throw new Error(`${field.label} must use a configured option.`);
    if (field.fieldType === "checkbox" && value !== "true" && value !== "false") throw new Error(`${field.label} must be a true or false value.`);
    validated[field.id] = value;
  }
  return validated;
}
