/**
 * Единственный источник правды для консоли: какая роль какой консолью пользуется,
 * какие модули ей показывает сервер, на какой маршрут она попадает и куда её
 * перенаправить с чужого маршрута.
 *
 * Чистый модуль: без React, без DOM, без сети.
 * Наборы ролей выведены из реальных guard'ов в server/_core/trpc.ts.
 * Таблица: docs/CONSOLE_MATRIX.md.
 */

export type SessionRole =
  | "founder"
  | "super_admin"
  | "admin"
  | "marketing"
  | "teacher"
  | "student"
  | "user";

export type RouteRole = "founder" | "admin" | "super_admin" | "marketing" | "teacher" | "student";

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
export const ROUTE_ROLES: RouteRole[] = ["founder", "admin", "super_admin", "marketing", "teacher", "student"];

/** Маршрут каждой роли. Ровно один маршрут на роль, без общих. */
export const ROLE_ROUTE: Record<SessionRole, string> = {
  founder: "/founder",
  admin: "/admin",
  super_admin: "/super-admin",
  marketing: "/marketing",
  teacher: "/teacher",
  student: "/dashboard",
  user: "/dashboard",
};

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
  return ROLE_ROUTE[sessionRole];
}

export function routeRoleOf(path: string): RouteRole | null {
  const clean = String(path || "").split("?")[0].replace(/\/+$/, "") || "/";
  const known: Array<[RouteRole, string]> = [
    ["founder", "/founder"],
    ["admin", "/admin"],
    ["super_admin", "/super-admin"],
    ["marketing", "/marketing"],
    ["teacher", "/teacher"],
    ["student", "/dashboard"],
  ];
  for (const pair of known) {
    if (clean === pair[1] || clean.indexOf(pair[1] + "/") === 0) return pair[0];
  }
  return null;
}

/**
 * Только своя роль на своём маршруте: founder на /founder, admin на /admin.
 * Общих маршрутов нет, поэтому чужая роль всегда перенаправляется.
 */
const ALLOWED: Record<RouteRole, string[]> = {
  founder: ["founder"],
  admin: ["admin"],
  super_admin: ["super_admin"],
  marketing: ["marketing"],
  teacher: ["teacher"],
  // legacy user остаётся на студенческой оболочке, иначе редирект зациклится.
  student: ["student", "user"],
};

export function isAuthorizedFor(sessionRole: string | null | undefined, routeRole: RouteRole): boolean {
  if (!isSessionRole(sessionRole)) return false;
  return (ALLOWED[routeRole] || []).indexOf(sessionRole) >= 0;
}

/**
 * Единственная функция редиректа. null означает «остаться на месте».
 * Маршруты без ограничений (публичные) не трогаем.
 */
export function resolveRedirect(sessionRole: string | null | undefined, path: string): string | null {
  const routeRole = routeRoleOf(path);
  if (routeRole === null) return null;
  if (isAuthorizedFor(sessionRole, routeRole)) return null;
  const home = resolveHomeRoute(sessionRole);
  // Если и домашний маршрут недоступен (неизвестная роль), уводим на вход.
  return home === path ? "/login" : home;
}