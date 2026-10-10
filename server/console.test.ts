import { describe, expect, it } from "vitest";
import {
  isAuthorizedFor,
  resolveConsole,
  resolveHomeRoute,
  resolveRedirect,
  ROLE_ROUTE,
  routeRoleOf,
  SESSION_ROLES,
  ROUTE_ROLES,
} from "../shared/console";

const ALL_ROUTES = ["/founder", "/admin", "/super-admin", "/marketing", "/teacher", "/dashboard", "/programs"];

describe("resolveConsole", () => {
  it("founder получает Overview, User Accounts и Audit & Security", () => {
    const c = resolveConsole("founder");
    expect(c!.consoleKey).toBe("founder");
    expect(c!.modules.map(m => m.id)).toEqual(["overview", "users", "audit", "prices"]);
  });

  it("admin НЕ получает User Accounts и Audit & Security", () => {
    const ids = resolveConsole("admin")!.modules.map(m => m.id);
    expect(ids).toContain("overview");
    expect(ids).not.toContain("users");
    expect(ids).not.toContain("audit");
  });

  it("super_admin получает audit, но не users", () => {
    const ids = resolveConsole("super_admin")!.modules.map(m => m.id);
    expect(ids).toContain("audit");
    expect(ids).not.toContain("users");
  });

  it("marketing, teacher и student получают только Overview", () => {
    for (const role of ["marketing", "teacher", "student"]) {
      expect(resolveConsole(role)!.modules.map(m => m.id), role).toEqual(["overview"]);
    }
  });

  it("legacy user получает консоль без модулей", () => {
    expect(resolveConsole("user")!.modules).toEqual([]);
  });

  it("неизвестная роль даёт null", () => {
    expect(resolveConsole("nobody")).toBeNull();
    expect(resolveConsole(null)).toBeNull();
  });
});

describe("resolveHomeRoute: у каждой роли свой маршрут", () => {
  it("founder -> /founder, admin -> /admin", () => {
    expect(resolveHomeRoute("founder")).toBe("/founder");
    expect(resolveHomeRoute("admin")).toBe("/admin");
  });

  it("остальные роли сохраняют текущие маршруты", () => {
    expect(resolveHomeRoute("super_admin")).toBe("/super-admin");
    expect(resolveHomeRoute("marketing")).toBe("/marketing");
    expect(resolveHomeRoute("teacher")).toBe("/teacher");
    expect(resolveHomeRoute("student")).toBe("/dashboard");
    expect(resolveHomeRoute("user")).toBe("/dashboard");
    expect(resolveHomeRoute("nobody")).toBe("/login");
  });

  it("маршруты ролей не пересекаются", () => {
    const used = SESSION_ROLES.map(r => ROLE_ROUTE[r]);
    expect(new Set(used).size).toBe(new Set(used.filter(u => u !== "/dashboard")).size + 1);
    expect(ROLE_ROUTE.founder).not.toBe(ROLE_ROUTE.admin);
  });
});

describe("routeRoleOf", () => {
  it("различает /founder и /admin и не путает вложенные", () => {
    expect(routeRoleOf("/founder")).toBe("founder");
    expect(routeRoleOf("/founder?tab=x")).toBe("founder");
    expect(routeRoleOf("/admin")).toBe("admin");
    expect(routeRoleOf("/admin/users")).toBe("admin");
    expect(routeRoleOf("/dashboard")).toBe("student");
    expect(routeRoleOf("/programs")).toBeNull();
  });
});

describe("isAuthorizedFor: только своя роль", () => {
  it("founder не авторизован на /admin и наоборот", () => {
    expect(isAuthorizedFor("founder", "admin")).toBe(false);
    expect(isAuthorizedFor("admin", "founder")).toBe(false);
    expect(isAuthorizedFor("founder", "founder")).toBe(true);
    expect(isAuthorizedFor("admin", "admin")).toBe(true);
  });

  it("ни одна роль не авторизована на чужом маршруте", () => {
    for (const role of SESSION_ROLES) {
      const own = routeRoleOf(resolveHomeRoute(role));
      for (const route of ROUTE_ROLES) {
        if (own && route === own) continue;
        expect(isAuthorizedFor(role, route), role + " @ " + route).toBe(false);
      }
    }
  });
});

describe("resolveRedirect идемпотентен и всегда ведёт на разрешённый маршрут", () => {
  it("двукратное применение совпадает с однократным для каждой роли и маршрута", () => {
    for (const role of SESSION_ROLES) {
      for (const route of ALL_ROUTES) {
        const once = resolveRedirect(role, route);
        const landed = once ?? route;
        const twice = resolveRedirect(role, landed);
        expect(twice, role + " @ " + route + " -> " + landed).toBe(null);
      }
    }
  });

  it("конечный маршрут всегда разрешён роли", () => {
    for (const role of SESSION_ROLES) {
      for (const route of ALL_ROUTES) {
        const landed = resolveRedirect(role, route) ?? route;
        const routeRole = routeRoleOf(landed);
        if (routeRole === null) continue;
        expect(isAuthorizedFor(role, routeRole), role + " @ " + landed).toBe(true);
      }
    }
  });

  it("founder с /admin уходит на /founder, admin с /founder — на /admin", () => {
    expect(resolveRedirect("founder", "/admin")).toBe("/founder");
    expect(resolveRedirect("admin", "/founder")).toBe("/admin");
  });

  it("свой маршрут не перенаправляется", () => {
    for (const role of SESSION_ROLES) {
      expect(resolveRedirect(role, resolveHomeRoute(role)), role).toBe(null);
    }
  });

  it("публичный маршрут не трогаем", () => {
    expect(resolveRedirect("student", "/programs")).toBe(null);
  });
});