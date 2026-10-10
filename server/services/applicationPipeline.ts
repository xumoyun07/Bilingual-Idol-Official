/**
 * Application Pipeline (A2/S3/F2): очередь заявок, назначение, одобрение,
 * отклонение, движение статуса ТОЛЬКО вперёд, founder-оверсайд (включая откат)
 * и студенческий просмотр собственной заявки.
 *
 * Правила из документов:
 *  - rejected не создаёт аккаунт; accountCreated не отклоняется;
 *  - visaProcess — только для applicantCategory='internationalStudent', иначе
 *    стадия пропускается (paymentCompleted → registrationCompleted);
 *  - откат назад — только founder (override);
 *  - мутации пишут аудит; ничего не удаляется.
 */

import { desc, eq } from "drizzle-orm";
import { applications, registrationSubmissions, users } from "../../drizzle/schema";
import { createApplication, createManagedUser, deleteManagedUser, getDb, inMemoryStore, listApplications, updateApplicationStatus } from "../db";
import { createStudentProfile } from "../students";

export const APPLICATION_STATUS_CHAIN = [
  "submitted",
  "documentsReceived",
  "underReview",
  "offerIssued",
  "paymentCompleted",
  "visaProcess",
  "registrationCompleted",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUS_CHAIN)[number];

export const INTERNATIONAL_CATEGORY = "internationalStudent";

export class PipelineError extends Error {
  readonly code: "NOT_FOUND" | "CONFLICT" | "BAD_REQUEST" | "FORBIDDEN";
  constructor(code: PipelineError["code"], message: string) {
    super(message);
    this.name = "PipelineError";
    this.code = code;
  }
}

/**
 * Следующая стадия цепочки. Чистая функция: visaProcess пропускается для
 * не-международных заявителей; на последней стадии и вне цепочки — null.
 */
export function nextApplicationStatus(current: string, applicantCategory: string | null | undefined): ApplicationStatus | null {
  const idx = APPLICATION_STATUS_CHAIN.indexOf(current as ApplicationStatus);
  if (idx < 0 || idx >= APPLICATION_STATUS_CHAIN.length - 1) return null;
  const next = APPLICATION_STATUS_CHAIN[idx + 1];
  if (next === "visaProcess" && (applicantCategory ?? "") !== INTERNATIONAL_CATEGORY) return "registrationCompleted";
  return next;
}

/* ------------------------------------------------------------------ */
/* Внутренние чтение/запись с собственными memory-ветками               */
/* ------------------------------------------------------------------ */

async function allSubmissions() {
  const database = await getDb();
  if (!database) return (inMemoryStore.registrationSubmissions as unknown[]) as Array<Record<string, unknown>>;
  return database.select().from(registrationSubmissions).orderBy(desc(registrationSubmissions.id));
}

export async function getSubmissionById(id: number) {
  const database = await getDb();
  if (!database) return (inMemoryStore.registrationSubmissions as Array<Record<string, any>>).find(s => s.id === id);
  return (await database.select().from(registrationSubmissions).where(eq(registrationSubmissions.id, id)).limit(1))[0];
}

async function setSubmissionStatus(id: number, status: string, assignedToUserId?: number | null) {
  const database = await getDb();
  if (!database) {
    const list = inMemoryStore.registrationSubmissions as Array<Record<string, any>>;
    const target = list.find(s => s.id === id);
    if (!target) return null;
    target.status = status;
    if (assignedToUserId !== undefined) target.assignedToUserId = assignedToUserId;
    return target;
  }
  if (assignedToUserId !== undefined) {
    await database.update(registrationSubmissions).set({ status: status as never, assignedToUserId }).where(eq(registrationSubmissions.id, id));
  } else {
    await database.update(registrationSubmissions).set({ status: status as never }).where(eq(registrationSubmissions.id, id));
  }
  return getSubmissionById(id);
}

async function getApplicationById(id: number) {
  const database = await getDb();
  if (!database) {
    const store = (inMemoryStore as unknown as { applications?: Array<Record<string, any>> }).applications ?? [];
    return store.find(a => Number(a.id) === id);
  }
  return (await database.select().from(applications).where(eq(applications.id, id)).limit(1))[0];
}

async function createApplicationRow(userId: number, status: ApplicationStatus = "submitted") {
  const database = await getDb();
  if (!database) {
    const store = (inMemoryStore as unknown as { applications?: Array<Record<string, any>> }).applications ?? [];
    const row = {
      id: store.reduce((max, a) => Math.max(max, Number(a.id)), 0) + 1,
      userId,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (inMemoryStore as unknown as { applications?: Array<Record<string, any>> }).applications = [...store, row];
    return row;
  }
  return createApplication(userId, status);
}

async function setApplicationStatus(id: number, status: ApplicationStatus) {
  const database = await getDb();
  if (!database) {
    const store = (inMemoryStore as unknown as { applications?: Array<Record<string, any>> }).applications ?? [];
    const target = store.find(a => Number(a.id) === id);
    if (!target) return null;
    target.status = status;
    target.updatedAt = new Date();
    return target;
  }
  await updateApplicationStatus(id, status);
  return getApplicationById(id);
}

/** Категория заявителя: последняя заявка в accountCreated с email студента. */
async function applicantCategoryForUser(userId: number): Promise<string | null> {
  const database = await getDb();
  let email: string | null = null;
  if (database) {
    const rows = await database.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
    email = rows[0]?.email ?? null;
  } else {
    email = inMemoryStore.users.find(u => u.id === userId)?.email ?? null;
  }
  if (!email) return null;
  const subs = await allSubmissions();
  const match = subs
    .filter(s => String(s.status) === "accountCreated" && String(s.email ?? "").toLowerCase() === email!.toLowerCase())
    .sort((a, b) => Number(b.id) - Number(a.id))[0];
  return match ? String(match.applicantCategory ?? null) : null;
}

/* ------------------------------------------------------------------ */
/* Публичные операции пайплайна                                        */
/* ------------------------------------------------------------------ */

export type QueueFilter = { status?: "new" | "routed"; applicantCategory?: string; programInterest?: string };

export async function queueSubmissions(filter: QueueFilter) {
  const rows = await allSubmissions();
  const status = filter.status ?? "new";
  return rows
    .filter(s => String(s.status) === status)
    .filter(s => !filter.applicantCategory || String(s.applicantCategory) === filter.applicantCategory)
    .filter(s => !filter.programInterest || String(s.programInterest ?? "").toLowerCase().includes(filter.programInterest.toLowerCase()));
}

export async function assignSubmission(input: { submissionId: number; assigneeUserId?: number }, actor: { id: number; role: string }) {
  const submission = await getSubmissionById(input.submissionId);
  if (!submission) throw new PipelineError("NOT_FOUND", "Registration request not found.");
  if (String(submission.status) === "rejected") throw new PipelineError("CONFLICT", "A rejected request cannot be assigned.");
  if (String(submission.status) === "accountCreated") throw new PipelineError("CONFLICT", "This request already has a student account.");
  const assignee = input.assigneeUserId ?? actor.id;
  const nextStatus = String(submission.status) === "new" ? "routed" : String(submission.status);
  await setSubmissionStatus(submission.id, nextStatus, assignee);
  return { ...submission, status: nextStatus, assignedToUserId: assignee };
}

export async function rejectSubmission(input: { submissionId: number; reason: string }, actor: { id: number; role: string }) {
  const submission = await getSubmissionById(input.submissionId);
  if (!submission) throw new PipelineError("NOT_FOUND", "Registration request not found.");
  if (String(submission.status) === "accountCreated") {
    throw new PipelineError("CONFLICT", "An application with a created account cannot be rejected; deactivate the student instead.");
  }
  const reason = (input.reason ?? "").trim();
  if (reason.length < 3) throw new PipelineError("BAD_REQUEST", "A rejection reason of at least 3 characters is required.");
  await setSubmissionStatus(submission.id, "rejected");
  void actor;
  return { ...submission, status: "rejected", rejectionReason: reason };
}

export type ApproveResult = { userId: number; applicationId: number; temporaryPassword: string | null; submissionId: number };

export async function approveSubmission(input: { submissionId: number }, actor: { id: number; role: string }): Promise<ApproveResult> {
  const submission = await getSubmissionById(input.submissionId);
  if (!submission) throw new PipelineError("NOT_FOUND", "Registration request not found.");
  if (String(submission.status) === "rejected") throw new PipelineError("CONFLICT", "A rejected request cannot be approved.");
  if (String(submission.status) === "accountCreated") throw new PipelineError("CONFLICT", "This request already has a student account.");
  const email = String(submission.email ?? "").trim();
  if (!email.includes("@")) throw new PipelineError("BAD_REQUEST", "The request has no valid email address.");
  const fullName = String(submission.fullName ?? "").trim();

  // Отклонённая заявка не должна создавать аккаунт — поэтому сначала проверка,
  // затем создание, и при сбое следующих шагов — откат созданной учётки.
  const created = (await createManagedUser(
    { name: fullName, email, role: "student" } as never,
    { id: actor.id, role: actor.role },
  )) as unknown as { id?: number; tempPassword?: string | null };
  const userId = Number(created.id);
  if (!userId) throw new PipelineError("BAD_REQUEST", "The student account could not be created.");
  try {
    await createStudentProfile(
      { name: fullName, email, isActive: true, contactEmail: email } as never,
      { id: actor.id, role: actor.role },
    );
    const application = await createApplicationRow(userId, "submitted");
    await setSubmissionStatus(submission.id, "accountCreated", actor.id);
    return { userId, applicationId: Number(application.id), temporaryPassword: created.tempPassword ?? null, submissionId: submission.id };
  } catch (error) {
    try { await deleteManagedUser(userId, { id: actor.id, role: actor.role } as never); } catch { /* компенсация не удалась */ }
    throw error;
  }
}

export async function advanceApplication(input: { applicationId: number }, actor: { id: number; role: string }) {
  const application = await getApplicationById(input.applicationId);
  if (!application) throw new PipelineError("NOT_FOUND", "Application not found.");
  const category = await applicantCategoryForUser(Number(application.userId));
  const next = nextApplicationStatus(String(application.status), category);
  if (!next) throw new PipelineError("CONFLICT", "The application is already at the final stage.");
  await setApplicationStatus(Number(application.id), next);
  void actor;
  return { id: Number(application.id), userId: Number(application.userId), status: next };
}

/** Founder-оверсайд: любая стадия, включая откат. Только founder. */
export async function overrideApplication(input: { applicationId: number; status: string }, actor: { id: number; role: string }) {
  if (actor.role !== "founder") throw new PipelineError("FORBIDDEN", "Only the founder can override an application stage.");
  const application = await getApplicationById(input.applicationId);
  if (!application) throw new PipelineError("NOT_FOUND", "Application not found.");
  if ((APPLICATION_STATUS_CHAIN as readonly string[]).indexOf(input.status) < 0) {
    throw new PipelineError("BAD_REQUEST", "Unknown application stage.");
  }
  await setApplicationStatus(Number(application.id), input.status as ApplicationStatus);
  return { id: Number(application.id), status: input.status };
}

export async function myApplicationStatus(userId: number) {
  const rows = await listApplications(userId);
  if (!rows.length) return { state: "no_application" as const, application: null as null };
  const latest = [...rows].sort((a, b) => Number(b.id) - Number(a.id))[0];
  const category = await applicantCategoryForUser(userId);
  return {
    state: "set" as const,
    application: {
      id: Number(latest.id),
      status: String(latest.status),
      applicantCategory: category,
      chain: APPLICATION_STATUS_CHAIN.map(stage => ({
        stage,
        visible: stage !== "visaProcess" || category === INTERNATIONAL_CATEGORY,
      })),
    },
  };
}
