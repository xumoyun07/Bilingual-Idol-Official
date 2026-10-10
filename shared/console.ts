/**
 * Единственный источник правды для консоли: какая роль какой консолью пользуется,
 * какие модули ей показывает сервер и на какой маршрут она попадает.
 *
 * Чистый модуль: без React, без DOM, без сети — поэтому его можно покрыть
 * юнит-тестами и использовать и в браузере, и на сервере.
 *
 * Наборы ролей выведены из реальных guard'ов в server/_core/trpc.ts, а не из
 * намерений интерфейса. Подробная таблица: docs/CONSOLE_MATRIX.md.
 */

export type SessionRole =
  | "founder"
  | "super_admin"
  | "admin"
  | "marketing"
  | "teacher"
  | "student"
  | "user";

export type RouteRole = "founder" | "super_admin" | "marketing" | "teacher" | "student";

export type ConsoleModuleId = "overview" | "users" | "audit" | "prices";

export type ConsoleModule = { id: ConsoleModuleId; labelKey: string };

export type ConsoleResolution = {
  consoleKey: string;
  labelKey: string;
  titleKey: string;
  modules: ConsoleModule[];
} | null;

/** Модуль -> ключ подписи и процедура, которая его разрешает на сервере. */
export const CONSOLE_MODULES: Record<ConsoleModuleId, { labelKey: string; authorizingProcedure: string }> = {
  overview: { labelKey: "console.module.overview", authorizingProcedure: "(always allowed)" },
  users: { labelKey: "console.module.users", authorizingProcedure: "users.* (founderProcedure)" },
  audit: { labelKey: "console.module.audit", authorizingProcedure: "audit.list|suggestions|exportCsv|exportPdf (auditProcedure = founder+super_admin)" },
  prices: { labelKey: "console.module.prices", authorizingProcedure: "prices.set|change|cancel|complete|historyByStudent (adminProcedure = admin+super_admin+founder)" },
};

const BY_ROLE: Record<SessionRole, { consoleKey: string; labelKey: string; titleKey: string; modules: ConsoleModuleId[] }> = {
  founder: { consoleKey: "founder", labelKey: "console.founder.label", titleKey: "console.founder.title", modules: ["overview", "users", "audit", "prices"] },
  super_admin: { consoleKey: "super_admin", labelKey: "console.super_admin.label", titleKey: "console.super_admin.title", modules: ["overview", "audit", "prices"] },
  admin: { consoleKey: "admin", labelKey: "console.admin.label", titleKey: "console.admin.title", modules: ["overview", "prices"] },
  marketing: { consoleKey: "marketing", labelKey: "console.marketing.label", titleKey: "console.marketing.title", modules: ["overview"] },
  teacher: { consoleKey: "teacher", labelKey: "console.teacher.label", titleKey: "console.teacher.title", modules: ["overview"] },
  student: { consoleKey: "student", labelKey: "console.student.label", titleKey: "console.student.title", modules: ["overview"] },
  user: { consoleKey: "empty", labelKey: "console.empty.label", titleKey: "console.empty.title", modules: [] },
};

export const SESSION_ROLES: SessionRole[] = ["founder", "super_admin", "admin", "marketing", "teacher", "student", "user"];
export const ROUTE_ROLES: RouteRole[] = ["founder", "super_admin", "marketing", "teacher", "student"];

export function isSessionRole(value: unknown): value is SessionRole {
  return typeof value === "string" && (SESSION_ROLES as string[]).indexOf(value) >= 0;
}

/** Возвращает null для неизвестной или отсутствующей роли: консоли нет. */
export function resolveConsole(sessionRole: string | null | undefined): ConsoleResolution {
  if (!isSessionRole(sessionRole)) return null;
  const spec = BY_ROLE[sessionRole];
  return {
    consoleKey: spec.consoleKey,
    labelKey: spec.labelKey,
    titleKey: spec.titleKey,
    modules: spec.modules.map(function (id) { return { id: id, labelKey: CONSOLE_MODULES[id].labelKey }; }),
  };
}

/** Домашний маршрут роли. Неизвестная роль — /login. */
export function resolveHomeRoute(sessionRole: string | null | undefined): string {
  if (!isSessionRole(sessionRole)) return "/login";
  if (sessionRole === "super_admin") return "/super-admin";
  if (sessionRole === "marketing") return "/marketing";
  if (sessionRole === "teacher") return "/teacher";
  if (sessionRole === "student" || sessionRole === "user") return "/dashboard";
  return "/admin";
}

export function routeRoleOf(path: string): RouteRole | null {
  const clean = String(path || "").split("?")[0].replace(/\/+$/, "") || "/";
  if (clean === "/admin" || clean.indexOf("/admin/") === 0) return "founder";
  if (clean === "/super-admin" || clean.indexOf("/super-admin/") === 0) return "super_admin";
  if (clean === "/marketing" || clean.indexOf("/marketing/") === 0) return "marketing";
  if (clean === "/teacher" || clean.indexOf("/teacher/") === 0) return "teacher";
  if (clean === "/dashboard" || clean.indexOf("/dashboard/") === 0) return "student";
  return null;
}

const ALLOWED: Record<RouteRole, string[]> = {
  // /admin принимает и founder, и admin: admin попадает на свою консоль там же.
  founder: ["founder", "admin"],
  super_admin: ["super_admin"],
  marketing: ["marketing", "admin", "super_admin", "founder"],
  teacher: ["teacher"],
  // legacy user остаётся на студенческой оболочке, иначе редирект зациклится.
  student: ["student", "user"],
};

export function isAuthorizedFor(sessionRole: string | null | undefined, routeRole: RouteRole): boolean {
  if (!isSessionRole(sessionRole)) return false;
  return (ALLOWED[routeRole] || []).indexOf(sessionRole) >= 0;
}