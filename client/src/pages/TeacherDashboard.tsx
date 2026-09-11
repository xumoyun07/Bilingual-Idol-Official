import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocaleForLanguage } from "@/lib/timeLocalization";
import { Language } from "@/lib/translations";
import { CalendarDays, CheckCircle2, ClipboardCheck, GraduationCap, Loader2, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

const attendanceLabels: Record<AttendanceStatus, string> = { present: "Present", absent: "Absent", late: "Late", excused: "Excused" };

function formatSessionDate(value: string | Date, language: Language = "en") {
  const date = typeof value === "string" ? new Date(`${value}T12:00:00`) : value;
  const locale = getLocaleForLanguage(language);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function dateKey(date: Date) { return date.toISOString().slice(0, 10); }
function dateAfter(date: Date, amount: number) { const next = new Date(date); next.setUTCDate(next.getUTCDate() + amount); return next; }

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { language, format24hTime, td } = useLanguage();
  const isTeacher = user?.role === "teacher";
  const utils = trpc.useUtils();
  const [range, setRange] = useState<"today" | "week" | "custom">("week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const scheduleFilter = useMemo(() => {
    const today = new Date();
    if (range === "today") { const day = dateKey(today); return { from: day, to: day }; }
    if (range === "week") return { from: dateKey(today), to: dateKey(dateAfter(today, 6)) };
    return { from: customFrom || undefined, to: customTo || undefined };
  }, [range, customFrom, customTo]);
  const customRangeReady = range !== "custom" || (Boolean(customFrom) && Boolean(customTo) && customFrom <= customTo);
  const schedule = trpc.teacher.schedule.useQuery(scheduleFilter, { enabled: isTeacher && customRangeReady, retry: false });
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const sessionDetails = trpc.teacher.sessionDetails.useQuery({ classSessionId: selectedSessionId ?? 1 }, { enabled: isTeacher && selectedSessionId !== null, retry: false });
  const attendance = trpc.teacher.attendance.useQuery({ classSessionId: selectedSessionId ?? 1 }, { enabled: isTeacher && selectedSessionId !== null, retry: false });
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>("present");
  const [attendanceNote, setAttendanceNote] = useState("");
  const [assessmentTitle, setAssessmentTitle] = useState("Lesson result");
  const [score, setScore] = useState("0");
  const [maxScore, setMaxScore] = useState("100");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!selectedSessionId && schedule.data?.[0]) setSelectedSessionId(schedule.data[0].id);
  }, [schedule.data, selectedSessionId]);

  useEffect(() => {
    if (sessionDetails.data?.attendance) {
      setAttendanceStatus(sessionDetails.data.attendance.status);
      setAttendanceNote(sessionDetails.data.attendance.note ?? "");
    } else {
      setAttendanceStatus("present");
    }
  }, [sessionDetails.data?.attendance, selectedSessionId]);

  const refresh = async () => {
    await Promise.all([utils.teacher.schedule.invalidate(), utils.teacher.sessionDetails.invalidate(), utils.teacher.attendance.invalidate()]);
  };
  const saveAttendance = trpc.teacher.saveAttendance.useMutation({ onSuccess: async () => { await refresh(); toast.success(td("Attendance saved.")); }, onError: error => toast.error(error.message) });
  const upsertGrade = trpc.teacher.upsertGrade.useMutation({ onSuccess: async (_result, variables) => { await refresh(); toast.success(variables.isPublished ? td("Result published.") : td("Result saved as a draft.")); }, onError: error => toast.error(error.message) });
  const publishGrade = trpc.teacher.publishGrade.useMutation({ onSuccess: async () => { await refresh(); toast.success(td("Result published.")); }, onError: error => toast.error(error.message) });

  const details = sessionDetails.data;
  const submitAttendance = () => {
    if (!selectedSessionId) return;
    saveAttendance.mutate({ classSessionId: selectedSessionId, studentId: details?.session.studentId ?? 0, status: attendanceStatus, method: "manual", note: attendanceNote || null });
  };
  const submitGrade = (isPublished: boolean) => {
    if (!selectedSessionId) return;
    const numericScore = Number(score);
    const numericMaxScore = Number(maxScore);
    if (!Number.isInteger(numericScore) || !Number.isInteger(numericMaxScore) || numericScore < 0 || numericMaxScore < 1 || numericScore > numericMaxScore) {
      toast.error(td("Enter a valid score that does not exceed the maximum score."));
      return;
    }
    upsertGrade.mutate({ classSessionId: selectedSessionId, title: assessmentTitle, score: numericScore, maxScore: numericMaxScore, feedback: feedback || null, isPublished });
  };

  return <DashboardLayout role="teacher">
    <div id="teacher-dashboard-container" data-page="teacher-dashboard" className="workspace-page founder-command founder-workspace page-teacher mx-auto w-full max-w-[88rem] px-4 sm:px-6 md:px-8 overflow-x-hidden pb-10" aria-labelledby="teacher-workspace-title">
      <header className="founder-command-header">
        <div>
          <p className="founder-command-eyebrow">{td("Teacher Workspace")}</p>
          <h1 id="teacher-workspace-title" className="founder-command-title">{td("Your Assigned Classes")}</h1>
          <p className="founder-command-description">
            {td("Review lessons assigned to your account, record attendance and prepare learner results. Class setup and teacher assignments are managed by the centre.")}
          </p>
        </div>
      </header>

      <div className="teacher-workspace-grid mt-6">
        <Card className="teacher-session-list"><CardHeader><CardTitle><CalendarDays size={19} /> {td("My classes")}</CardTitle><CardDescription>{td("Only sessions assigned to you are shown.")}</CardDescription></CardHeader><CardContent>
          <div className="teacher-schedule-filters" aria-label="Schedule date filter">
            <Label htmlFor="teacher-schedule-range">{td("Show")}</Label>
            <select id="teacher-schedule-range" value={range} onChange={event => setRange(event.target.value as "today" | "week" | "custom")}>
              <option value="today">{td("Today")}</option>
              <option value="week">{td("Next 7 days")}</option>
              <option value="custom">{td("Custom range")}</option>
            </select>
            {range === "custom" ? <div className="teacher-custom-date-grid"><div><Label htmlFor="teacher-from">{td("From")}</Label><Input id="teacher-from" type="date" value={customFrom} onChange={event => setCustomFrom(event.target.value)} /></div><div><Label htmlFor="teacher-to">{td("To")}</Label><Input id="teacher-to" type="date" value={customTo} onChange={event => setCustomTo(event.target.value)} /></div></div> : null}
            {range === "custom" && !customRangeReady ? <p className="teacher-filter-help">{td("Choose a valid start and end date.")}</p> : null}
          </div>
          {schedule.isLoading ? <div className="teacher-loading"><Loader2 className="animate-spin" size={18} />{td("Loading assigned sessions…")}</div> : null}
          {schedule.isError ? <p className="teacher-empty">{td("Your schedule could not be loaded. Please try again.")}</p> : null}
          {!schedule.isLoading && !schedule.isError && schedule.data?.length === 0 ? <p className="teacher-empty">{td("No class sessions have been assigned to your account yet.")}</p> : null}
          <div className="teacher-session-stack">{schedule.data?.map(session => <button key={session.id} type="button" className={session.id === selectedSessionId ? "teacher-session-button is-selected" : "teacher-session-button"} onClick={() => setSelectedSessionId(session.id)}>
            <span><strong>{session.title}</strong><small>{td(session.courseName)} · {session.studentName || td("Student")}</small></span><span className="teacher-session-time">{formatSessionDate(session.scheduledFor, language)}<br />{format24hTime(session.startsAt)}–{format24hTime(session.endsAt)}</span>
          </button>)}</div>
        </CardContent></Card>

        <div className="teacher-session-detail">
          {!selectedSessionId || sessionDetails.isLoading ? <Card className="teacher-empty-card"><CardContent><Loader2 className="animate-spin" size={20} /><p>{td("Select an assigned session to record attendance and results.")}</p></CardContent></Card> : null}
          {sessionDetails.isError ? <Card className="teacher-empty-card"><CardContent><p>{td("The selected class is unavailable to your account.")}</p></CardContent></Card> : null}
          {details ? <>
            <Card className="teacher-class-summary"><CardContent><div><p className="minimal-eyebrow">{td("Selected class")}</p><h3>{details.session.title}</h3><p>{td(details.session.courseName)} · {formatSessionDate(details.session.scheduledFor, language)} · {format24hTime(details.session.startsAt)}–{format24hTime(details.session.endsAt)}{details.session.room ? ` · ${details.session.room}` : ""}</p></div><Badge variant="secondary"><UsersRound size={14} />{details.students.length} {details.students.length === 1 ? td("Student") : td("Students")}</Badge></CardContent></Card>
            <Card className="teacher-roster-card"><CardHeader><CardTitle><UsersRound size={19} /> {td("Students")}</CardTitle><CardDescription>{td("Students directly assigned to this session. This class view does not manage enrolments.")}</CardDescription></CardHeader><CardContent>{details.students.length ? <div className="teacher-roster-stack">{details.students.map(student => <div className="teacher-roster-row" key={student.id}><div><strong>{student.name || td("Student")}</strong><p>{student.email || td("No e-mail available")}</p></div>{student.attendanceStatus ? <Badge variant="secondary">{td(attendanceLabels[student.attendanceStatus as AttendanceStatus] ?? student.attendanceStatus)}</Badge> : <Badge variant="outline">{td("Not marked")}</Badge>}</div>)}</div> : <p className="teacher-empty">{td("No student is assigned to this session.")}</p>}<div className="teacher-session-actions"><Button type="button" variant="outline" onClick={() => document.getElementById("teacher-attendance")?.scrollIntoView({ behavior: "smooth", block: "start" })}>{td("Take attendance")}</Button><Button type="button" onClick={() => document.getElementById("teacher-results")?.scrollIntoView({ behavior: "smooth", block: "start" })}>{td("Record results")}</Button></div></CardContent></Card>
            <div className="teacher-action-grid">
              <Card id="teacher-attendance"><CardHeader><CardTitle><CheckCircle2 size={19} /> {td("Attendance")}</CardTitle><CardDescription>{td("Save one attendance status for each student in this session. Re-saving updates the existing mark.")}</CardDescription></CardHeader><CardContent className="teacher-form-stack">
                <div className="teacher-attendance-roster" aria-label="Attendance students">{(attendance.data?.students ?? details.students).map(student => <div className="teacher-attendance-row" key={student.id}><div><strong>{student.name || td("Student")}</strong><p>{student.email || td("No e-mail available")}</p></div><div className="teacher-attendance-toggle" role="group" aria-label={`Attendance for ${student.name || "student"}`}><Button type="button" size="sm" variant={("status" in student ? student.status : student.attendanceStatus) === "present" ? "default" : "outline"} onClick={() => setAttendanceStatus("present")}>{td("Present")}</Button><Button type="button" size="sm" variant={("status" in student ? student.status : student.attendanceStatus) === "absent" ? "destructive" : "outline"} onClick={() => setAttendanceStatus("absent")}>{td("Absent")}</Button></div></div>)}</div>
                <Label htmlFor="attendance-status">{td("Attendance status")}</Label><select id="attendance-status" value={attendanceStatus} onChange={event => setAttendanceStatus(event.target.value as AttendanceStatus)}>{(Object.keys(attendanceLabels) as AttendanceStatus[]).map(status => <option key={status} value={status}>{td(attendanceLabels[status])}</option>)}</select>
                <Label htmlFor="attendance-note">{td("Note")} <span>{td("Optional")}</span></Label><Textarea id="attendance-note" value={attendanceNote} onChange={event => setAttendanceNote(event.target.value)} maxLength={2000} placeholder={td("Add a concise attendance note")} />
                <Button type="button" onClick={submitAttendance} disabled={saveAttendance.isPending}>{saveAttendance.isPending ? td("Saving…") : td("Save attendance")}</Button>
              </CardContent></Card>
              <Card id="teacher-results"><CardHeader><CardTitle><GraduationCap size={19} /> {td("Result")}</CardTitle><CardDescription>{td("Save a draft, or publish a result for the assigned student.")}</CardDescription></CardHeader><CardContent className="teacher-form-stack">
                <Label htmlFor="assessment-title">{td("Assessment title")}</Label><Input id="assessment-title" value={assessmentTitle} onChange={event => setAssessmentTitle(event.target.value)} maxLength={160} />
                <div className="teacher-score-grid"><div><Label htmlFor="grade-score">{td("Score")}</Label><Input id="grade-score" type="number" min="0" value={score} onChange={event => setScore(event.target.value)} /></div><div><Label htmlFor="grade-max-score">{td("Out of")}</Label><Input id="grade-max-score" type="number" min="1" value={maxScore} onChange={event => setMaxScore(event.target.value)} /></div></div>
                <Label htmlFor="grade-feedback">{td("Feedback")} <span>{td("Optional")}</span></Label><Textarea id="grade-feedback" value={feedback} onChange={event => setFeedback(event.target.value)} maxLength={4000} placeholder={td("Give clear, constructive feedback")} />
                <div className="teacher-grade-actions"><Button type="button" variant="outline" onClick={() => submitGrade(false)} disabled={upsertGrade.isPending}>{td("Save draft")}</Button><Button type="button" onClick={() => submitGrade(true)} disabled={upsertGrade.isPending}>{td("Save & publish")}</Button></div>
              </CardContent></Card>
            </div>
            <Card className="teacher-results-list"><CardHeader><CardTitle>{td("Recorded results")}</CardTitle><CardDescription>{td("Only published results are available to the learner.")}</CardDescription></CardHeader><CardContent>{details.grades.length ? <div className="teacher-results-stack">{details.grades.map(grade => <div key={grade.id} className="teacher-result-row"><div><strong>{grade.title}</strong><p>{grade.score}/{grade.maxScore}{grade.feedback ? ` · ${grade.feedback}` : ""}</p></div><div>{grade.isPublished ? <Badge className="teacher-published-badge">{td("Published")}</Badge> : <Button type="button" size="sm" onClick={() => publishGrade.mutate({ classSessionId: details.session.id, gradeId: grade.id })} disabled={publishGrade.isPending}>{td("Publish")}</Button>}</div></div>)}</div> : <p className="teacher-empty">{td("No results have been saved for this lesson yet.")}</p>}</CardContent></Card>
          </> : null}
        </div>
      </div>
    </div>
  </DashboardLayout>;
}
