import { describe, expect, it } from "vitest";
import {
  isAuthorizedFor,
  resolveConsole,
  resolveHomeRoute,
  routeRoleOf,
  SESSION_ROLES,
  ROUTE_ROLES,
} from "../shared/console";

describe("resolveConsole", () => {
  it("founder получает Overview, User Accounts и Audit & Security", () => {
    const c = resolveConsole("founder");
    expect(c).not.toBeNull();
    expect(c!.consoleKey).toBe("founder");
    expect(c!.modules.map(m => m.id)).toEqual(["overview", "users", "audit", "prices"]);
  });

  it("admin НЕ получает User Accounts и Audit & Security", () => {
    const c = resolveConsole("admin");
    expect(c!.consoleKey).toBe("admin");
    const ids = c!.modules.map(m => m.id);
    expect(ids).toContain("overview");
    expect(ids).not.toContain("users");
    expect(ids).not.toContain("audit");
  });

  it("super_admin получает audit (auditProcedure), но не users (founderProcedure)", () => {
    const ids = resolveConsole("super_admin")!.modules.map(m => m.id);
    expect(ids).toContain("audit");
    expect(ids).not.toContain("users");
  });

  it("marketing, teacher и student получают только Overview", () => {
    for (const role of ["marketing", "teacher", "student"]) {
      expect(resolveConsole(role)!.modules.map(m => m.id), role).toEqual(["overview"]);
    }
  });

  it("legacy user получает консоль без модулей (пустое состояние)", () => {
    const c = resolveConsole("user");
    expect(c).not.toBeNull();
    expect(c!.modules).toEqual([]);
  });

  it("неизвестная, пустая и отсутствующая роль дают null", () => {
    expect(resolveConsole("nobody")).toBeNull();
    expect(resolveConsole("")).toBeNull();
    expect(resolveConsole(null)).toBeNull();
    expect(resolveConsole(undefined)).toBeNull();
  });
});

describe("resolveHomeRoute", () => {
  it("маршруты совпадают с текущими", () => {
    expect(resolveHomeRoute("founder")).toBe("/admin");
    expect(resolveHomeRoute("admin")).toBe("/admin");
    expect(resolveHomeRoute("super_admin")).toBe("/super-admin");
    expect(resolveHomeRoute("marketing")).toBe("/marketing");
    expect(resolveHomeRoute("teacher")).toBe("/teacher");
    expect(resolveHomeRoute("student")).toBe("/dashboard");
    expect(resolveHomeRoute("user")).toBe("/dashboard");
    expect(resolveHomeRoute("nobody")).toBe("/login");
  });
});

describe("routeRoleOf", () => {
  it("распознаёт маршруты и не путает вложенные", () => {
    expect(routeRoleOf("/admin")).toBe("founder");
    expect(routeRoleOf("/admin/users")).toBe("founder");
    expect(routeRoleOf("/super-admin")).toBe("super_admin");
    expect(routeRoleOf("/marketing")).toBe("marketing");
    expect(routeRoleOf("/teacher")).toBe("teacher");
    expect(routeRoleOf("/dashboard")).toBe("student");
    expect(routeRoleOf("/dashboard?tab=x")).toBe("student");
    expect(routeRoleOf("/programs")).toBeNull();
  });
});

describe("isAuthorizedFor", () => {
  it("admin авторизован на /admin (иначе редирект зациклится)", () => {
    expect(isAuthorizedFor("admin", "founder")).toBe(true);
    expect(isAuthorizedFor("founder", "founder")).toBe(true);
  });

  it("student не авторизован на чужих маршрутах", () => {
    for (const route of ROUTE_ROLES) {
      if (route === "student") continue;
      expect(isAuthorizedFor("student", route), route).toBe(false);
    }
  });

  it("неизвестная роль не авторизована нигде", () => {
    for (const route of ROUTE_ROLES) expect(isAuthorizedFor("nobody", route), route).toBe(false);
  });
});

describe("идемпотентность редиректа", () => {
  it("двукратное применение не меняет маршрут ни для одной роли", () => {
    for (const role of SESSION_ROLES) {
      const first = resolveHomeRoute(role);
      const firstRole = routeRoleOf(first);
      // Роль авторизована на своём домашнем маршруте, поэтому второй проход не редиректит.
      if (firstRole) {
        expect(isAuthorizedFor(role, firstRole), role + " -> " + first).toBe(true);
      }
      const second = resolveHomeRoute(role);
      expect(second, role).toBe(first);
    }
  });
});