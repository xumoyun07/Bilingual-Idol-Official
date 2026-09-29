import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout, { ModuleSkeleton, ModuleEmptyState, ModuleErrorState } from "@/components/DashboardLayout";
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
import { CalendarDays, CheckCircle2, ClipboardCheck, GraduationCap, Loader2, UsersRound, ArrowUpRight } from "lucide-react";
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
  const { language, format24hTime, td, isRTL } = useLanguage();
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

  return (
    <DashboardLayout role="teacher">
      <div id="teacher-dashboard-container" data-page="teacher-dashboard" className={`w-full space-y-6 text-start ${isRTL ? "dir-rtl" : ""}`} aria-labelledby="teacher-workspace-title">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#dfd1bf]/50">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[#708098]">{td("Teacher Workspace")}</p>
            <h1 id="teacher-workspace-title" className="font-bold text-[#10253e] tracking-tight text-[clamp(1.5rem,4vw,2.25rem)] leading-tight">{td("Your Assigned Classes")}</h1>
            <p className="text-xs sm:text-sm text-[#53657a] max-w-2xl leading-relaxed">
              {td("Review lessons assigned to your account, record attendance and prepare learner results. Class setup and teacher assignments are managed by the centre.")}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
          {/* Left Column: Classes List */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-[#eee4d7] bg-white rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="bg-[#faf7f2]/30 border-b border-[#eee4d7]/60 p-5">
                <CardTitle className="text-base font-bold text-[#10253e] flex items-center gap-2">
                  <CalendarDays size={18} className="text-[#173fad]" /> {td("My classes")}
                </CardTitle>
                <CardDescription className="text-xs text-[#53657a]">{td("Only sessions assigned to you are shown.")}</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2" aria-label="Schedule date filter">
                  <Label htmlFor="teacher-schedule-range" className="text-xs font-bold text-[#53657a]">{td("Show")}</Label>
                  <select
                    id="teacher-schedule-range"
                    value={range}
                    onChange={event => setRange(event.target.value as "today" | "week" | "custom")}
                    className="w-full h-10 px-3 text-sm rounded-xl border border-[#eee4d7] bg-[#faf7f2]/40 text-[#10253e]"
                  >
                    <option value="today">{td("Today")}</option>
                    <option value="week">{td("Next 7 days")}</option>
                    <option value="custom">{td("Custom range")}</option>
                  </select>
                  {range === "custom" && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <Label htmlFor="teacher-from" className="text-xs font-semibold">{td("From")}</Label>
                        <Input id="teacher-from" type="date" value={customFrom} onChange={event => setCustomFrom(event.target.value)} className="h-10 text-sm border-[#eee4d7]" />
                      </div>
                      <div>
                        <Label htmlFor="teacher-to" className="text-xs font-semibold">{td("To")}</Label>
                        <Input id="teacher-to" type="date" value={customTo} onChange={event => setCustomTo(event.target.value)} className="h-10 text-sm border-[#eee4d7]" />
                      </div>
                    </div>
                  )}
                  {range === "custom" && !customRangeReady && (
                    <p className="text-xs text-[#b4563c] pt-1">{td("Choose a valid start and end date.")}</p>
                  )}
                </div>

                {schedule.isLoading && (
                  <div className="flex items-center gap-2 text-xs text-[#53657a] py-4">
                    <Loader2 className="animate-spin text-[#173fad]" size={16} />
                    {td("Loading assigned sessions…")}
                  </div>
                )}
                {schedule.isError && (
                  <p className="text-xs text-rose-600 bg-rose-50/40 p-3 rounded-xl border border-rose-100">{td("Your schedule could not be loaded. Please try again.")}</p>
                )}
                {!schedule.isLoading && !schedule.isError && schedule.data?.length === 0 && (
                  <p className="text-xs text-[#53657a] bg-[#faf7f2]/50 p-4 rounded-xl border border-dashed border-[#dfd1bf]/60">{td("No class sessions have been assigned to your account yet.")}</p>
                )}

                <div className="space-y-2">
                  {schedule.data?.map(session => (
                    <button
                      key={session.id}
                      type="button"
                      className={`w-full text-start p-4 rounded-xl border text-xs transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 hover:shadow-xs min-h-[50px] ${
                        session.id === selectedSessionId
                          ? "bg-[#10253e] text-white border-transparent"
                          : "bg-white text-[#53657a] border-[#eee4d7] hover:border-[#dfd1bf]"
                      }`}
                      onClick={() => setSelectedSessionId(session.id)}
                    >
                      <span className="space-y-1">
                        <strong className={`block text-sm font-bold ${session.id === selectedSessionId ? "text-white" : "text-[#10253e]"}`}>
                          {session.title}
                        </strong>
                        <small className={`block text-xs ${session.id === selectedSessionId ? "text-amber-200" : "text-[#53657a]"}`}>
                          {td(session.courseName)} · {session.studentName || td("Student")}
                        </small>
                      </span>
                      <span className={`text-[11px] shrink-0 font-medium sm:text-end ${session.id === selectedSessionId ? "text-slate-300" : "text-[#708098]"}`}>
                        {formatSessionDate(session.scheduledFor, language)}
                        <br />
                        {format24hTime(session.startsAt)}–{format24hTime(session.endsAt)}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Class Details & Management */}
          <div className="lg:col-span-7 space-y-6">
            {!selectedSessionId || sessionDetails.isLoading ? (
              <ModuleSkeleton />
            ) : sessionDetails.isError ? (
              <Card className="border-red-100 bg-red-50/20 rounded-2xl p-6 text-center">
                <CardContent className="space-y-2 p-0 text-red-700 font-semibold">
                  <p>{td("The selected class is unavailable to your account.")}</p>
                </CardContent>
              </Card>
            ) : details ? (
              <div className="space-y-6">
                <Card className="border-[#eee4d7] bg-white rounded-2xl shadow-sm overflow-hidden p-5">
                  <CardContent className="p-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-[#708098]">{td("Selected class")}</p>
                      <h3 className="text-lg font-bold text-[#10253e] leading-tight">{details.session.title}</h3>
                      <p className="text-xs text-[#53657a]">
                        {td(details.session.courseName)} · {formatSessionDate(details.session.scheduledFor, language)} · {format24hTime(details.session.startsAt)}–{format24hTime(details.session.endsAt)}
                        {details.session.room ? ` · Room: ${details.session.room}` : ""}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-[#faf7f2] border border-[#eee4d7] text-[#10253e] font-bold px-3 py-1 text-xs shrink-0 rounded-lg flex items-center gap-1">
                      <UsersRound size={13} />
                      {details.students.length} {details.students.length === 1 ? td("Student") : td("Students")}
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="border-[#eee4d7] bg-white rounded-2xl shadow-sm overflow-hidden">
                  <CardHeader className="bg-[#faf7f2]/30 border-b border-[#eee4d7]/60 p-5">
                    <CardTitle className="text-base font-bold text-[#10253e] flex items-center gap-2">
                      <UsersRound size={18} className="text-[#173fad]" /> {td("Students")}
                    </CardTitle>
                    <CardDescription className="text-xs text-[#53657a]">{td("Students directly assigned to this session. This class view does not manage enrolments.")}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    {details.students.length ? (
                      <div className="space-y-2">
                        {details.students.map(student => (
                          <div className="flex items-center justify-between p-3 rounded-xl bg-[#faf7f2]/30 border border-[#eee4d7]/60" key={student.id}>
                            <div>
                              <strong className="block text-sm font-bold text-[#10253e]">{student.name || td("Student")}</strong>
                              <span className="block text-xs text-[#53657a]">{student.email || td("No e-mail available")}</span>
                            </div>
                            {student.attendanceStatus ? (
                              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase text-[9px] px-2.5 py-0.5 rounded-md">
                                {td(attendanceLabels[student.attendanceStatus as AttendanceStatus] ?? student.attendanceStatus)}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-500 border-slate-200 uppercase text-[9px] px-2.5 py-0.5 rounded-md">
                                {td("Not marked")}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#53657a]">{td("No student is assigned to this session.")}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2.5 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("teacher-attendance")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                        className="min-h-[44px] sm:min-h-[36px] text-xs font-semibold border-[#eee4d7] hover:bg-[#faf7f2] rounded-xl flex-1 sm:flex-none"
                      >
                        {td("Take attendance")}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => document.getElementById("teacher-results")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                        className="min-h-[44px] sm:min-h-[36px] text-xs font-semibold bg-[#173fad] hover:bg-[#12328b] text-white rounded-xl flex-1 sm:flex-none"
                      >
                        {td("Record results")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Attendance Card */}
                  <Card id="teacher-attendance" className="border-[#eee4d7] bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
                    <div>
                      <CardHeader className="bg-[#faf7f2]/30 border-b border-[#eee4d7]/60 p-5">
                        <CardTitle className="text-base font-bold text-[#10253e] flex items-center gap-2">
                          <CheckCircle2 size={18} className="text-[#173fad]" /> {td("Attendance")}
                        </CardTitle>
                        <CardDescription className="text-xs text-[#53657a]">{td("Save one attendance status for each student in this session. Re-saving updates the existing mark.")}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-5 space-y-4">
                        <div className="space-y-3" aria-label="Attendance students">
                          {(attendance.data?.students ?? details.students).map(student => (
                            <div className="flex flex-col gap-2 p-3 bg-[#faf7f2]/30 border border-[#eee4d7]/50 rounded-xl" key={student.id}>
                              <div>
                                <strong className="block text-sm font-bold text-[#10253e]">{student.name || td("Student")}</strong>
                                <span className="block text-xs text-[#53657a] truncate">{student.email || td("No e-mail available")}</span>
                              </div>
                              <div className="flex items-center gap-1.5 pt-1 w-full" role="group" aria-label={`Attendance for ${student.name || "student"}`}>
                                <Button
                                  type="button"
                                  className="min-h-[44px] h-11 text-xs font-bold rounded-xl flex-1"
                                  variant={("status" in student ? student.status : student.attendanceStatus) === "present" ? "default" : "outline"}
                                  onClick={() => setAttendanceStatus("present")}
                                >
                                  {td("Present")}
                                </Button>
                                <Button
                                  type="button"
                                  className="min-h-[44px] h-11 text-xs font-bold rounded-xl flex-1"
                                  variant={("status" in student ? student.status : student.attendanceStatus) === "absent" ? "destructive" : "outline"}
                                  onClick={() => setAttendanceStatus("absent")}
                                >
                                  {td("Absent")}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-1.5 pt-2">
                          <Label htmlFor="attendance-status" className="text-xs font-bold text-[#53657a]">{td("Attendance status")}</Label>
                          <select
                            id="attendance-status"
                            value={attendanceStatus}
                            onChange={event => setAttendanceStatus(event.target.value as AttendanceStatus)}
                            className="w-full h-11 px-3 text-sm rounded-xl border border-[#eee4d7] bg-white text-[#10253e]"
                          >
                            {(Object.keys(attendanceLabels) as AttendanceStatus[]).map(status => (
                              <option key={status} value={status}>{td(attendanceLabels[status])}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="attendance-note" className="text-xs font-bold text-[#53657a]">{td("Note")} <span className="text-[10px] font-normal text-slate-400">({td("Optional")})</span></Label>
                          <Textarea id="attendance-note" value={attendanceNote} onChange={event => setAttendanceNote(event.target.value)} maxLength={2000} placeholder={td("Add a concise attendance note")} className="text-xs border-[#eee4d7] rounded-xl" />
                        </div>
                      </CardContent>
                    </div>
                    <div className="p-4 bg-[#faf7f2]/30 border-t border-[#eee4d7]/60">
                      <Button
                        type="button"
                        onClick={submitAttendance}
                        disabled={saveAttendance.isPending}
                        className="w-full min-h-[44px] bg-[#173fad] hover:bg-[#12328b] text-white font-bold rounded-xl"
                      >
                        {saveAttendance.isPending ? td("Saving…") : td("Save attendance")}
                      </Button>
                    </div>
                  </Card>
                  
                  {/* Results Card */}
                  <Card id="teacher-results" className="border-[#eee4d7] bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
                    <div>
                      <CardHeader className="bg-[#faf7f2]/30 border-b border-[#eee4d7]/60 p-5">
                        <CardTitle className="text-base font-bold text-[#10253e] flex items-center gap-2">
                          <GraduationCap size={18} className="text-[#173fad]" /> {td("Result")}
                        </CardTitle>
                        <CardDescription className="text-xs text-[#53657a]">{td("Save a draft, or publish a result for the assigned student.")}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-5 space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="assessment-title" className="text-xs font-bold text-[#53657a]">{td("Assessment title")}</Label>
                          <Input id="assessment-title" value={assessmentTitle} onChange={event => setAssessmentTitle(event.target.value)} maxLength={160} className="h-10 text-sm border-[#eee4d7] rounded-xl" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="grade-score" className="text-xs font-bold text-[#53657a]">{td("Score")}</Label>
                            <Input id="grade-score" type="number" min="0" value={score} onChange={event => setScore(event.target.value)} className="h-10 text-sm border-[#eee4d7] rounded-xl" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="grade-max-score" className="text-xs font-bold text-[#53657a]">{td("Out of")}</Label>
                            <Input id="grade-max-score" type="number" min="1" value={maxScore} onChange={event => setMaxScore(event.target.value)} className="h-10 text-sm border-[#eee4d7] rounded-xl" />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="grade-feedback" className="text-xs font-bold text-[#53657a]">{td("Feedback")} <span className="text-[10px] font-normal text-slate-400">({td("Optional")})</span></Label>
                          <Textarea id="grade-feedback" value={feedback} onChange={event => setFeedback(event.target.value)} maxLength={4000} placeholder={td("Give clear, constructive feedback")} className="text-xs border-[#eee4d7] rounded-xl" />
                        </div>
                      </CardContent>
                    </div>
                    <div className="p-4 bg-[#faf7f2]/30 border-t border-[#eee4d7]/60 flex gap-2.5">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => submitGrade(false)}
                        disabled={upsertGrade.isPending}
                        className="flex-1 min-h-[44px] text-xs font-bold border-[#eee4d7] hover:bg-[#faf7f2]/80 rounded-xl"
                      >
                        {td("Save draft")}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => submitGrade(true)}
                        disabled={upsertGrade.isPending}
                        className="flex-1 min-h-[44px] text-xs font-bold bg-[#173fad] hover:bg-[#12328b] text-white rounded-xl"
                      >
                        {td("Save & publish")}
                      </Button>
                    </div>
                  </Card>
                </div>

                <Card className="border-[#eee4d7] bg-white rounded-2xl shadow-sm overflow-hidden">
                  <CardHeader className="bg-[#faf7f2]/30 border-b border-[#eee4d7]/60 p-5">
                    <CardTitle className="text-base font-bold text-[#10253e]">{td("Recorded results")}</CardTitle>
                    <CardDescription className="text-xs text-[#53657a]">{td("Only published results are available to the learner.")}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5">
                    {details.grades.length ? (
                      <div className="space-y-2">
                        {details.grades.map(grade => (
                          <div key={grade.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 bg-[#faf7f2]/30 border border-[#eee4d7]/50 rounded-xl gap-3">
                            <div className="space-y-1">
                              <strong className="block text-sm font-bold text-[#10253e]">{grade.title}</strong>
                              <p className="text-xs text-[#53657a] leading-relaxed">
                                {grade.score}/{grade.maxScore}{grade.feedback ? ` · Feedback: ${grade.feedback}` : ""}
                              </p>
                            </div>
                            <div className="shrink-0">
                              {grade.isPublished ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold text-[9px] px-2.5 py-0.5">
                                  {td("Published")}
                                </Badge>
                              ) : (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => publishGrade.mutate({ classSessionId: details.session.id, gradeId: grade.id })}
                                  disabled={publishGrade.isPending}
                                  className="min-h-[44px] sm:min-h-[32px] text-xs font-bold rounded-lg"
                                >
                                  {td("Publish")}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#53657a]">{td("No results have been saved for this lesson yet.")}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
