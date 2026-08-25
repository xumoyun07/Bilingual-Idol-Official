import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { TeacherSessionAccessError, getTeacherSessionDetails, listTeacherSchedule, type TeacherScheduleFilter } from "./teacher";

export const teacherClassSessionsPath = "/portal/teacher/class-sessions";

type DateRangePreset = "today" | "week" | "custom";

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function dateAtUtcMidnight(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function readSingle(query: Request["query"], key: string) {
  const value = query[key];
  return typeof value === "string" ? value : undefined;
}

function isDateKey(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function parseTeacherScheduleFilter(query: Request["query"], now = new Date()): { preset: DateRangePreset; filter: TeacherScheduleFilter } {
  const rawPreset = readSingle(query, "range") ?? "week";
  if (!(["today", "week", "custom"] as const).includes(rawPreset as DateRangePreset)) throw new Error("range must be today, week or custom.");
  const preset = rawPreset as DateRangePreset;
  const today = dateKey(now);
  if (preset === "today") return { preset, filter: { from: dateAtUtcMidnight(today), to: dateAtUtcMidnight(today) } };
  if (preset === "week") return { preset, filter: { from: dateAtUtcMidnight(today), to: dateAtUtcMidnight(dateKey(addDays(now, 6))) } };
  const from = readSingle(query, "from");
  const to = readSingle(query, "to");
  if (!isDateKey(from) || !isDateKey(to) || from > to) throw new Error("custom range requires valid from and to dates, with from not after to.");
  return { preset, filter: { from: dateAtUtcMidnight(from), to: dateAtUtcMidnight(to) } };
}

async function authenticateTeacher(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (user.role !== "teacher") {
      res.status(403).json({ error: "teacher-only" });
      return null;
    }
    return user;
  } catch {
    res.status(401).json({ error: "authentication-required" });
    return null;
  }
}

export async function handleTeacherClassSessions(req: Request, res: Response) {
  const user = await authenticateTeacher(req, res);
  if (!user) return;
  try {
    const { preset, filter } = parseTeacherScheduleFilter(req.query);
    const sessions = await listTeacherSchedule(user.id, filter);
    return res.json({ sessions, filter: { preset, from: filter.from?.toISOString().slice(0, 10), to: filter.to?.toISOString().slice(0, 10) } });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Invalid class session request." });
  }
}

export async function handleTeacherClassSessionDetails(req: Request, res: Response) {
  const user = await authenticateTeacher(req, res);
  if (!user) return;
  const classSessionId = Number(req.params.id);
  if (!Number.isSafeInteger(classSessionId) || classSessionId < 1) return res.status(400).json({ error: "Invalid class session id." });
  try {
    const details = await getTeacherSessionDetails(user.id, classSessionId);
    return res.json(details);
  } catch (error) {
    if (error instanceof TeacherSessionAccessError) return res.status(404).json({ error: "Class session not found." });
    console.error("[teacher-portal] Could not load class session", error);
    return res.status(500).json({ error: "Class session could not be loaded." });
  }
}
