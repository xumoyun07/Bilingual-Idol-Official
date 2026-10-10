import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { translations } from "@/lib/translations";
import { roleLabel } from "@/lib/enumLabels";

/**
 * B4: роли founder, super_admin и admin должны быть РАЗНЫМИ ключами и разными
 * подписями во всех трёх языках. Слитая подпись вида «Admin / Super admin»
 * недопустима: она стирает разницу в правах.
 */

const LANGUAGES = ["en", "ms", "ar"] as const;
const SEPARATE_ROLES = ["founder", "superAdmin", "admin"] as const;
const ALL_ROLES = ["founder", "superAdmin", "admin", "student", "teacher", "marketing", "user"] as const;

const LOCALES_DIR = path.join(process.cwd(), "client", "src", "locales");

function localeValue(lang: string, key: string): string | undefined {
  const raw = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${lang}.json`), "utf8")) as Record<string, unknown>;
  const ui = raw.ui as Record<string, { value?: string }> | undefined;
  return ui?.[key]?.value;
}

describe("B4 · подписи ролей разделены во всех языках", () => {
  it("в translations.ts есть ключ для каждой роли на каждом языке", () => {
    for (const lang of LANGUAGES) {
      const role = (translations as unknown as Record<string, { role: Record<string, string> }>)[lang]?.role;
      expect(role, `раздел role для языка ${lang}`).toBeDefined();
      for (const key of ALL_ROLES) {
        expect(typeof role[key], `role.${key} (${lang})`).toBe("string");
        expect(role[key].trim().length, `role.${key} (${lang}) не должен быть пустым`).toBeGreaterThan(0);
      }
    }
  });

  it("founder, superAdmin и admin — три разные подписи в каждом языке", () => {
    for (const lang of LANGUAGES) {
      const role = (translations as unknown as Record<string, { role: Record<string, string> }>)[lang].role;
      const values = SEPARATE_ROLES.map(key => role[key]);
      expect(new Set(values).size, `подписи ${SEPARATE_ROLES.join("/")} в ${lang} должны различаться: ${values.join(" | ")}`).toBe(3);
    }
  });

  it("ни одна подпись не склеивает admin и super admin", () => {
    for (const lang of LANGUAGES) {
      const role = (translations as unknown as Record<string, { role: Record<string, string> }>)[lang].role;
      for (const key of SEPARATE_ROLES) {
        expect(role[key], `слитая подпись role.${key} (${lang})`).not.toMatch(/admin\s*[/\\]\s*super/i);
        expect(role[key], `слитая подпись role.${key} (${lang})`).not.toMatch(/super\s*[/\\]\s*admin/i);
      }
    }
  });

  it("файлы локалей содержат те же три раздельные подписи", () => {
    for (const lang of LANGUAGES) {
      const values = SEPARATE_ROLES.map(key => localeValue(lang, `role.${key}`));
      expect(values.every(value => typeof value === "string" && value.trim().length > 0), `ключи role.* в ${lang}.json`).toBe(true);
      expect(new Set(values).size, `подписи в ${lang}.json: ${values.join(" | ")}`).toBe(3);
    }
  });

  it("значения в locale-файлах совпадают со словарём-источником", () => {
    for (const lang of LANGUAGES) {
      const role = (translations as unknown as Record<string, { role: Record<string, string> }>)[lang].role;
      for (const key of ALL_ROLES) {
        expect(localeValue(lang, `role.${key}`), `role.${key} (${lang}).json`).toBe(role[key]);
      }
    }
  });

  it("roleLabel() ведёт founder, super_admin и admin на разные ключи", () => {
    const seen = new Map<string, string>();
    for (const raw of ["founder", "super_admin", "admin"]) {
      const key = roleLabel(raw, (k, fallback) => `KEY:${k}`) || fallbackFor(raw);
      seen.set(raw, key);
    }
    expect(seen.get("founder")).not.toBe(seen.get("super_admin"));
    expect(seen.get("super_admin")).not.toBe(seen.get("admin"));
    expect(seen.get("founder")).not.toBe(seen.get("admin"));
    expect(seen.get("founder")).toContain("role.founder");
    expect(seen.get("super_admin")).toContain("role.superAdmin");
    expect(seen.get("admin")).toContain("role.admin");
  });

  function fallbackFor(raw: string) {
    return raw;
  }
});
