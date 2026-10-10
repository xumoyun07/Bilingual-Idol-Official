import { beforeEach, describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { inMemoryStore } from "./db";
import { nextApplicationStatus, APPLICATION_STATUS_CHAIN } from "./services/applicationPipeline";
import { FOUNDER_EMAIL } from "./founderIdentity";

/**
 * Application Pipeline (A2/S3/F2): очередь, назначение, одобрение, отклонение,
 * движение только вперёд, founder-оверсайд, студенческий трекер.
 * Правила из документов: rejected не создаёт аккаунт; visaProcess только для
 * internationalStudent; откат — только founder; студент видит только своё.
 */

// Инвариант основателя требует ровно одну founder-запись с адресом FOUNDER_EMAIL,
// иначе управление пользователями fail-closed. Фикстура использует реальный адрес.
const FOUNDER = { id: 1, email: FOUNDER_EMAIL, role: "founder" };
const ADMIN = { id: 2, email: "admin@example.test", role: "admin" };
const TEACHER = { id: 3, email: "teacher@example.test", role: "teacher" };
const STUDENT_LOCAL = { id: 4, email: "local@example.test", role: "student" };
const STUDENT_INTL = { id: 5, email: "intl@example.test", role: "student" };
const MARKETING = { id: 6, email: "mkt@example.test", role: "marketing" };

function seed() {
  inMemoryStore.users = [FOUNDER, ADMIN, TEACHER, STUDENT_LOCAL, STUDENT_INTL, MARKETING].map(row => ({
    id: row.id, openId: `seed:${row.id}`, name: `Seed ${row.role}`, email: row.email,
    passwordHash: null, role: row.role, isActive: true, loginMethod: "test",
    createdAt: new Date("2026-01-01T00:00:00.000Z"), updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    lastSignedIn: new Date("2026-01-01T00:00:00.000Z"), sessionVersion: 1, isOtp: false,
    otpCreatedAt: null, failedAttempts: 0,
  })) as never;

  inMemoryStore.registrationSubmissions = [
    { id: 11, programId: 1, programInterest: "General English", applicantCategory: "adult", fullName: "Local Kid", email: STUDENT_LOCAL.email, phone: "+6011111111", status: "new", assignedToUserId: null, utmSource: null, utmMedium: null, utmCampaign: null, utmTerm: null, utmContent: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 12, programId: 1, programInterest: "General English", applicantCategory: "internationalStudent", fullName: "Intl Kid", email: STUDENT_INTL.email, phone: "+6022222222", status: "new", assignedToUserId: null, utmSource: null, utmMedium: null, utmCampaign: null, utmTerm: null, utmContent: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 13, programId: 2, programInterest: "IELTS Prep", applicantCategory: "child", fullName: "Routed Kid", email: "routed@example.test", phone: "+6033333333", status: "routed", assignedToUserId: ADMIN.id, utmSource: null, utmMedium: null, utmCampaign: null, utmTerm: null, utmContent: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 14, programId: 1, programInterest: "General English", applicantCategory: "adult", fullName: "Rejected Kid", email: "rejected@example.test", phone: "+6044444444", status: "rejected", assignedToUserId: null, utmSource: null, utmMedium: null, utmCampaign: null, utmTerm: null, utmContent: null, createdAt: new Date(), updatedAt: new Date() },
  ] as never;

  (inMemoryStore as unknown as { applications?: unknown[] }).applications = [];
  (inMemoryStore as unknown as { studentProfiles?: unknown[] }).studentProfiles = [];
}

function caller(role: string | null) {
  const row = role ? inMemoryStore.users.find(u => u.role === role) : undefined;
  return appRouter.createCaller({
    user: (row ?? null) as TrpcContext["user"],
    req: { headers: {}, protocol: "http", ip: "127.0.0.1", socket: {} } as TrpcContext["req"],
    res: { cookie: () => {}, clearCookie: () => {} } as TrpcContext["res"],
  });
}

beforeEach(seed);

describe("nextApplicationStatus (чистая функция)", () => {
  it("движется по цепочке вперёд", () => {
    expect(nextApplicationStatus("submitted", "adult")).toBe("documentsReceived");
    expect(nextApplicationStatus("paymentCompleted", "adult")).toBe("registrationCompleted");
  });

  it("visaProcess только для международных", () => {
    expect(nextApplicationStatus("paymentCompleted", "internationalStudent")).toBe("visaProcess");
    expect(nextApplicationStatus("paymentCompleted", "child")).toBe("registrationCompleted");
    expect(nextApplicationStatus("paymentCompleted", null)).toBe("registrationCompleted");
  });

  it("на последней стадии и вне цепочки — null", () => {
    expect(nextApplicationStatus("registrationCompleted", "adult")).toBeNull();
    expect(nextApplicationStatus("nonsense", "adult")).toBeNull();
  });
});

describe("applications.queue", () => {
  it("по умолчанию отдаёт только new", async () => {
    const rows = await caller("admin").applications.queue({});
    expect(rows.map(r => r.id)).toEqual([11, 12]);
  });

  it("фильтрует по статусу и категории", async () => {
    const routed = await caller("admin").applications.queue({ status: "routed" });
    expect(routed.map(r => r.id)).toEqual([13]);
    const intl = await caller("admin").applications.queue({ applicantCategory: "internationalStudent" });
    expect(intl.map(r => r.id)).toEqual([12]);
  });

  it("marketing и teacher не имеют доступа к очереди", async () => {
    await expect(caller("marketing").applications.queue({})).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller("teacher").applications.queue({})).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("applications.assign", () => {
  it("new переходит в routed и назначается актору", async () => {
    const result = await caller("admin").applications.assign({ submissionId: 11 });
    expect(result.status).toBe("routed");
    expect(result.assignedToUserId).toBe(ADMIN.id);
  });

  it("rejected нельзя назначить", async () => {
    await expect(caller("admin").applications.assign({ submissionId: 14 })).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("applications.reject", () => {
  it("требует причину", async () => {
    await expect(caller("admin").applications.reject({ submissionId: 11, reason: "no" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("переводит в rejected", async () => {
    const result = await caller("admin").applications.reject({ submissionId: 11, reason: "No show." });
    expect(result.status).toBe("rejected");
  });
});

describe("applications.approve", () => {
  it("создаёт student-аккаунт, личное дело, applications(submitted) и accountCreated", async () => {
    const result = await caller("admin").applications.approve({ submissionId: 11 });
    expect(result.userId).toBeGreaterThan(0);
    expect(result.applicationId).toBeGreaterThan(0);
    expect(typeof result.temporaryPassword).toBe("string");
    expect((result.temporaryPassword as string).length).toBeGreaterThanOrEqual(12);
    const user = inMemoryStore.users.find(u => u.id === result.userId);
    expect(user?.role).toBe("student");
    const apps = (inMemoryStore as unknown as { applications?: Array<Record<string, unknown>> }).applications!;
    expect(apps.find(a => Number(a.id) === result.applicationId)?.status).toBe("submitted");
    const submission = inMemoryStore.registrationSubmissions.find(s => s.id === 11);
    expect(submission?.status).toBe("accountCreated");
  });

  it("rejected не создаёт аккаунт", async () => {
    const before = inMemoryStore.users.length;
    await expect(caller("admin").applications.approve({ submissionId: 14 })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(inMemoryStore.users.length).toBe(before);
  });

  it("accountCreated нельзя одобрить повторно", async () => {
    await caller("admin").applications.approve({ submissionId: 11 });
    await expect(caller("admin").applications.approve({ submissionId: 11 })).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("applications.advanceStatus", () => {
  it("местный студент проходит всю цепочку без visaProcess", async () => {
    const approved = await caller("admin").applications.approve({ submissionId: 11 });
    let current: string = "submitted";
    const seen: string[] = [current];
    for (let i = 0; i < 5; i += 1) {
      const result = await caller("admin").applications.advanceStatus({ applicationId: approved.applicationId });
      current = result.status;
      seen.push(current);
    }
    expect(seen).toEqual(["submitted", "documentsReceived", "underReview", "offerIssued", "paymentCompleted", "registrationCompleted"]);
    await expect(caller("admin").applications.advanceStatus({ applicationId: approved.applicationId })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("международный студент проходит visaProcess", async () => {
    const approved = await caller("admin").applications.approve({ submissionId: 12 });
    let status = "submitted";
    for (let i = 0; i < 5; i += 1) {
      const result = await caller("admin").applications.advanceStatus({ applicationId: approved.applicationId });
      status = result.status;
    }
    expect(status).toBe("visaProcess");
  });
});

describe("applications.overrideStatus", () => {
  it("admin не может оверсайдить", async () => {
    const approved = await caller("admin").applications.approve({ submissionId: 11 });
    await expect(caller("admin").applications.overrideStatus({ applicationId: approved.applicationId, status: "registrationCompleted" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("founder может двигать и откатывать", async () => {
    const approved = await caller("admin").applications.approve({ submissionId: 11 });
    await caller("admin").applications.advanceStatus({ applicationId: approved.applicationId });
    const rollback = await caller("founder").applications.overrideStatus({ applicationId: approved.applicationId, status: "submitted" });
    expect(rollback.status).toBe("submitted");
    const forward = await caller("founder").applications.overrideStatus({ applicationId: approved.applicationId, status: "registrationCompleted" });
    expect(forward.status).toBe("registrationCompleted");
  });

  it("неизвестная стадия отклоняется", async () => {
    const approved = await caller("admin").applications.approve({ submissionId: 11 });
    await expect(caller("founder").applications.overrideStatus({ applicationId: approved.applicationId, status: "teleported" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("applications.myStatus", () => {
  it("студент видит свою цепочку; visa скрыт для местного", async () => {
    const approved = await caller("admin").applications.approve({ submissionId: 11 });
    const mine = await caller("student").applications.myStatus();
    expect(mine.state).toBe("set");
    expect(mine.application?.id).toBe(approved.applicationId);
    // ST11: для местного студента стадия visaProcess отсутствует в цепочке целиком.
    const visa = mine.application?.chain.find(s => s.stage === "visaProcess");
    expect(visa).toBeUndefined();
  });

  it("у международного visa видна", async () => {
    await caller("admin").applications.approve({ submissionId: 12 });
    const mine = await caller("student").applications.myStatus();
    expect(mine.state).toBe("set");
    // Для международного студента visaProcess присутствует в цепочке.
    const visa = mine.application?.chain.find(s => s.stage === "visaProcess");
    expect(visa).toBeDefined();
  });

  it("без заявки — явное состояние no_application", async () => {
    const mine = await caller("student").applications.myStatus();
    expect(mine.state).toBe("no_application");
    expect(mine.application).toBeNull();
  });

  it("teacher не может вызвать myStatus", async () => {
    await expect(caller("teacher").applications.myStatus()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("параметров у myStatus нет — чужой id подставить нельзя", () => {
    const procedures = appRouter._def.procedures as Record<string, unknown>;
    expect(procedures["applications.myStatus"]).toBeDefined();
  });

  it("статус студента не изменился после оверсайда чужой роли", async () => {
    const approved = await caller("admin").applications.approve({ submissionId: 11 });
    await expect(caller("student").applications.overrideStatus({ applicationId: approved.applicationId, status: "visaProcess" })).rejects.toBeDefined();
  });
});
