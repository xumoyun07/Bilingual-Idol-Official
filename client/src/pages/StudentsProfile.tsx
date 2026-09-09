import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { AlertCircle, ArrowLeft, ArrowUpDown, BookOpen, CalendarCheck2, ChevronLeft, ChevronRight, FileArchive, FileImage, FileText, Filter, GraduationCap, Layers, Loader2, Pencil, Plus, RotateCcw, Search, ShieldCheck, SlidersHorizontal, Trash2, Upload, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type StudentDraft = { name: string; email: string; isActive: boolean; guardianName: string; guardianPhone: string; contactEmail: string; dateOfBirth: string; address: string; notes: string; attendedSessions: number; totalSessions: number; currentLevel: string; courseName: string; courseCode: string; courseStartDate: string; courseEndDate: string };
type StudentSummary = { id: number; name: string | null; email: string | null; isActive: boolean; createdAt: Date; currentLevel: string | null; courseName: string | null; attendedSessions: number | null; totalSessions: number | null };
type StudentDocument = { id: number; fileName: string; mimeType: string; fileSize: number; url: string; createdAt: Date };
type StudentDetail = Omit<StudentDraft, "dateOfBirth" | "courseStartDate" | "courseEndDate"> & { userId: number; dateOfBirth: Date | null; courseStartDate: Date | null; courseEndDate: Date | null; createdAt: Date; updatedAt: Date; documents: StudentDocument[]; history: { id: number; eventType: string; changesJson: string | null; createdAt: Date; actorName: string | null }[] };

const blankStudent: StudentDraft = { name: "", email: "", isActive: true, guardianName: "", guardianPhone: "", contactEmail: "", dateOfBirth: "", address: "", notes: "", attendedSessions: 0, totalSessions: 0, currentLevel: "", courseName: "", courseCode: "", courseStartDate: "", courseEndDate: "" };
const supportedAccept = ".pdf,.docx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png";

function toDateInput(value: Date | string | null | undefined) { if (!value) return ""; return new Date(value).toISOString().slice(0, 10); }
function toDraft(profile: StudentDetail): StudentDraft { return { name: profile.name ?? "", email: profile.email ?? "", isActive: profile.isActive, guardianName: profile.guardianName ?? "", guardianPhone: profile.guardianPhone ?? "", contactEmail: profile.contactEmail ?? "", dateOfBirth: toDateInput(profile.dateOfBirth), address: profile.address ?? "", notes: profile.notes ?? "", attendedSessions: profile.attendedSessions ?? 0, totalSessions: profile.totalSessions ?? 0, currentLevel: profile.currentLevel ?? "", courseName: profile.courseName ?? "", courseCode: profile.courseCode ?? "", courseStartDate: toDateInput(profile.courseStartDate), courseEndDate: toDateInput(profile.courseEndDate) }; }
function nullable(value: string) { return value.trim() || null; }
function payload(draft: StudentDraft) { return { ...draft, email: nullable(draft.email), guardianName: nullable(draft.guardianName), guardianPhone: nullable(draft.guardianPhone), contactEmail: nullable(draft.contactEmail), dateOfBirth: nullable(draft.dateOfBirth), address: nullable(draft.address), notes: nullable(draft.notes), currentLevel: nullable(draft.currentLevel), courseName: nullable(draft.courseName), courseCode: nullable(draft.courseCode), courseStartDate: nullable(draft.courseStartDate), courseEndDate: nullable(draft.courseEndDate) }; }
function pageItems(total: number, current: number) { return Array.from({ length: Math.min(total, 5) }, (_, index) => index + 1); }
function attendanceText(attended: number | null, total: number | null) { if (!total) return "No sessions recorded"; return `${attended ?? 0}/${total} sessions · ${Math.round(((attended ?? 0) / total) * 100)}%`; }
function formatBytes(size: number) { return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`; }

export function StudentsProfileList() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [course, setCourse] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "name" | "level">("newest");
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<StudentDraft>(blankStudent);

  const input = useMemo(() => ({
    query: search.trim() || undefined,
    level: level.trim() || undefined,
    course: course.trim() || undefined,
    isActive: status === "all" ? undefined : status === "active",
    sortBy,
    page,
    pageSize: 10,
  }), [search, level, course, status, sortBy, page]);

  const list = trpc.students.list.useQuery(input);
  const create = trpc.students.create.useMutation({
    onSuccess: async profile => {
      await utils.students.list.invalidate();
      setCreateOpen(false);
      setDraft(blankStudent);
      setLocation(`/admin/students/${profile.userId}`);
    },
  });

  const total = list.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 10));

  function resetFilters() {
    setSearch("");
    setLevel("");
    setCourse("");
    setStatus("all");
    setSortBy("newest");
    setPage(0);
  }

  function changeFilter(action: () => void) {
    action();
    setPage(0);
  }

  const activeFiltersCount = (search.trim() ? 1 : 0) + (status !== "all" ? 1 : 0) + (level.trim() ? 1 : 0) + (course.trim() ? 1 : 0) + (sortBy !== "newest" ? 1 : 0);

  return (
    <div id="students-profile-container" data-page="students-profile" className="workspace-page founder-command founder-workspace page-students-profile mx-auto w-full max-w-[88rem] pb-10">
      <ModuleHeader
        eyebrow="Control centre · Students Profile"
        title="Every student, with their learning record in reach."
        description="Review student information, attendance, current level, course and documents from one private Founder workspace."
        action={
          <Button type="button" onClick={() => { setDraft(blankStudent); setCreateOpen(true); }} className="compass-btn-primary min-h-12 shadow-sm transition-all hover:translate-y-[-1px]">
            <Plus size={17} />
            <span>Add student</span>
          </Button>
        }
      />

      {/* FILTER & SEARCH CONTROL HUB */}
      <section className="founder-panel founder-panel-paper mt-6 rounded-2xl border border-[#dce4e7] bg-white p-5 sm:p-6 shadow-sm transition-all hover:border-[#cfd9de]" aria-label="Student profile filters">
        {/* Top bar: title, active count and clear all */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf2f4] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef4ff] text-[#173fad]">
              <SlidersHorizontal size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#10253e] uppercase tracking-wider">Search & Filters</h2>
              <p className="text-xs text-[#53657a]">Filter by student name, contact, level, or assigned course</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#eef4ff] px-2.5 py-0.5 text-xs font-semibold text-[#173fad]">
                <Filter size={12} />
                {activeFiltersCount} active {activeFiltersCount === 1 ? "filter" : "filters"}
              </span>
            )}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-bold text-[#b4563c] transition-colors hover:bg-[#fff0ed] hover:border-[#efc4b8]"
              >
                <RotateCcw size={13} />
                <span>Reset all</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Controls Grid */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-12">
          {/* Main Search Input */}
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#53657a] mb-1.5">
              Search query
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#708098]" size={16} />
              <input
                value={search}
                onChange={event => changeFilter(() => setSearch(event.target.value))}
                className="h-11 w-full rounded-xl border border-[#dce4e7] bg-[#f8fafb] pl-10 pr-9 text-sm text-[#10253e] transition-all placeholder:text-[#8c9ba8] focus:border-[#173fad] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173fad]/20"
                placeholder="Name, email, level or course…"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => changeFilter(() => setSearch(""))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#708098] hover:bg-[#edf2f4] hover:text-[#10253e]"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Status Segmented / Select */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#53657a] mb-1.5">
              Status
            </label>
            <div className="relative">
              <select
                value={status}
                onChange={event => changeFilter(() => setStatus(event.target.value))}
                className="h-11 w-full appearance-none rounded-xl border border-[#dce4e7] bg-[#f8fafb] px-3.5 pr-8 text-sm font-medium text-[#10253e] transition-all focus:border-[#173fad] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173fad]/20"
              >
                <option value="all">All statuses</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#708098]">
                <ChevronRight size={14} className="rotate-90" />
              </div>
            </div>
          </div>

          {/* Level Filter */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#53657a] mb-1.5">
              Learning Level
            </label>
            <div className="relative">
              <Layers className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#708098]" size={14} />
              <input
                value={level}
                onChange={event => changeFilter(() => setLevel(event.target.value))}
                className="h-11 w-full rounded-xl border border-[#dce4e7] bg-[#f8fafb] pl-8 pr-7 text-sm text-[#10253e] transition-all placeholder:text-[#8c9ba8] focus:border-[#173fad] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173fad]/20"
                placeholder="e.g. A1, B2, Advanced"
              />
              {level && (
                <button
                  type="button"
                  onClick={() => changeFilter(() => setLevel(""))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#708098] hover:bg-[#edf2f4]"
                  title="Clear level"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Course Filter */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#53657a] mb-1.5">
              Course Name
            </label>
            <div className="relative">
              <BookOpen className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#708098]" size={14} />
              <input
                value={course}
                onChange={event => changeFilter(() => setCourse(event.target.value))}
                className="h-11 w-full rounded-xl border border-[#dce4e7] bg-[#f8fafb] pl-8 pr-7 text-sm text-[#10253e] transition-all placeholder:text-[#8c9ba8] focus:border-[#173fad] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173fad]/20"
                placeholder="e.g. English, IELTS"
              />
              {course && (
                <button
                  type="button"
                  onClick={() => changeFilter(() => setCourse(""))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#708098] hover:bg-[#edf2f4]"
                  title="Clear course"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Sort Order */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#53657a] mb-1.5">
              Sort By
            </label>
            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#708098]" size={14} />
              <select
                value={sortBy}
                onChange={event => changeFilter(() => setSortBy(event.target.value as "newest" | "name" | "level"))}
                className="h-11 w-full appearance-none rounded-xl border border-[#dce4e7] bg-[#f8fafb] pl-8 pr-8 text-sm font-medium text-[#10253e] transition-all focus:border-[#173fad] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173fad]/20"
              >
                <option value="newest">Newest first</option>
                <option value="name">Name (A-Z)</option>
                <option value="level">Level (A-Z)</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#708098]">
                <ChevronRight size={14} className="rotate-90" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Filter Chips strip */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#edf2f4] pt-3.5">
            <span className="text-xs font-semibold text-[#708098]">Applied criteria:</span>
            {search.trim() && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#f0f4f8] px-2.5 py-1 text-xs font-medium text-[#10253e]">
                <span>Query: <strong>"{search}"</strong></span>
                <button type="button" onClick={() => changeFilter(() => setSearch(""))} className="text-[#708098] hover:text-[#b4563c]"><X size={12} /></button>
              </span>
            )}
            {status !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#f0f4f8] px-2.5 py-1 text-xs font-medium text-[#10253e]">
                <span>Status: <strong>{status === "active" ? "Active" : "Inactive"}</strong></span>
                <button type="button" onClick={() => changeFilter(() => setStatus("all"))} className="text-[#708098] hover:text-[#b4563c]"><X size={12} /></button>
              </span>
            )}
            {level.trim() && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#f0f4f8] px-2.5 py-1 text-xs font-medium text-[#10253e]">
                <span>Level: <strong>{level}</strong></span>
                <button type="button" onClick={() => changeFilter(() => setLevel(""))} className="text-[#708098] hover:text-[#b4563c]"><X size={12} /></button>
              </span>
            )}
            {course.trim() && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#f0f4f8] px-2.5 py-1 text-xs font-medium text-[#10253e]">
                <span>Course: <strong>{course}</strong></span>
                <button type="button" onClick={() => changeFilter(() => setCourse(""))} className="text-[#708098] hover:text-[#b4563c]"><X size={12} /></button>
              </span>
            )}
            {sortBy !== "newest" && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#f0f4f8] px-2.5 py-1 text-xs font-medium text-[#10253e]">
                <span>Sort: <strong>{sortBy === "name" ? "Name" : "Level"}</strong></span>
                <button type="button" onClick={() => changeFilter(() => setSortBy("newest"))} className="text-[#708098] hover:text-[#b4563c]"><X size={12} /></button>
              </span>
            )}
          </div>
        )}
      </section>

      {/* RESULTS LIST SECTION */}
      <section className="founder-panel founder-panel-paper mt-6 overflow-hidden p-0 rounded-2xl border border-[#dce4e7] bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-[#edf2f4] px-5 py-5 sm:flex-row sm:items-center sm:justify-between bg-[#fbfcfc]">
          <div>
            <p className="founder-command-eyebrow">Student directory</p>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl text-[#10253e] font-bold">
              {list.isLoading ? "Loading students…" : `${total} student ${total === 1 ? "record" : "records"}`}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#f0f4f8] text-[#53657a]">
              10 profiles per page
            </span>
          </div>
        </div>

        {list.isLoading ? (
          <div className="grid min-h-72 place-items-center">
            <Loader2 className="animate-spin text-[#173fad]" size={32} />
          </div>
        ) : list.error ? (
          <ErrorState message="Student profiles are unavailable. Refresh the page or try again shortly." />
        ) : !list.data?.rows.length ? (
          <EmptyStudents onAdd={() => setCreateOpen(true)} />
        ) : (
          <div className="divide-y divide-[#f0f4f8]">
            {list.data.rows.map(row => (
              <StudentRow key={row.id} student={row as StudentSummary} onOpen={() => setLocation(`/admin/students/${row.id}`)} />
            ))}
          </div>
        )}

        {list.data?.rows.length ? <Pagination page={page} totalPages={totalPages} onPage={setPage} /> : null}
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-1rem)] overflow-y-auto rounded-[1.25rem] border-[#dfd1bf] bg-[#fbf8f2] p-0 sm:max-w-3xl">
          <StudentForm
            title="Add student"
            description="Create a student profile and capture their initial learning record. A student profile does not issue login credentials."
            draft={draft}
            setDraft={setDraft}
            pending={create.isPending}
            error={create.error?.message}
            submitLabel="Create student"
            onSubmit={() => create.mutate(payload(draft))}
            onClose={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function StudentProfileDetail({ studentId }: { studentId: number }) {
  const [, setLocation] = useLocation(); const utils = trpc.useUtils(); const detail = trpc.students.byId.useQuery({ studentId }); const [draft, setDraft] = useState<StudentDraft>(blankStudent); const [editing, setEditing] = useState(false); const [fileError, setFileError] = useState<string | null>(null);
  useEffect(() => { if (detail.data) setDraft(toDraft(detail.data as StudentDetail)); }, [detail.data]);
  const invalidate = async () => { await Promise.all([utils.students.byId.invalidate({ studentId }), utils.students.list.invalidate()]); };
  const update = trpc.students.update.useMutation({ onSuccess: async () => { setEditing(false); await invalidate(); } }); const remove = trpc.students.remove.useMutation({ onSuccess: async () => { await utils.students.list.invalidate(); setLocation("/admin/students"); } }); const upload = trpc.students.uploadDocument.useMutation({ onSuccess: async () => { setFileError(null); await invalidate(); } }); const removeDocument = trpc.students.removeDocument.useMutation({ onSuccess: invalidate });
  async function uploadFile(file: File | undefined) { if (!file) return; if (!new Set(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"]).has(file.type)) { setFileError("Only PDF, DOCX, JPG and PNG are supported."); return; } if (file.size > 5 * 1024 * 1024) { setFileError("Document size must not exceed 5 MB."); return; } const base64 = await readFileBase64(file); upload.mutate({ studentId, fileName: file.name, mimeType: file.type as "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "image/jpeg" | "image/png", contentBase64: base64 }); }
  if (detail.isLoading) return <div className="grid min-h-80 place-items-center"><Loader2 className="animate-spin text-[#173fad]" /></div>; if (detail.error || !detail.data) return <div className="workspace-page founder-command founder-workspace mx-auto max-w-[88rem] pb-10"><ErrorState message="Student profile is unavailable or no longer exists." /></div>;
  const student = detail.data as StudentDetail; const attendance = student.totalSessions ? Math.round((student.attendedSessions / student.totalSessions) * 100) : 0;
  return <div className="workspace-page founder-command founder-workspace mx-auto w-full max-w-[88rem] pb-10"><button type="button" onClick={() => setLocation("/admin/students")} className="inline-flex min-h-12 items-center gap-2 rounded-xl px-3 text-sm font-extrabold text-[#173fad] hover:bg-[#eef4ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173fad]"><ArrowLeft size={17} />All students</button><ModuleHeader eyebrow="Students Profile · private record" title={student.name || "Student profile"} description={`Student ID ${student.userId} · last updated ${new Date(student.updatedAt).toLocaleString()}`} action={<div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => setEditing(true)} className="min-h-12 border-[#d8cfbf] text-[#29415b]"><Pencil size={16} />Edit student</Button><AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="outline" className="min-h-12 border-[#efc4b8] text-[#b4563c] hover:bg-[#fff0ed]"><Trash2 size={16} />Delete student</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this student profile?</AlertDialogTitle><AlertDialogDescription>This removes the student record, document references and history from the application. Unreferenced stored document objects can no longer be reached.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep student</AlertDialogCancel><AlertDialogAction onClick={() => remove.mutate({ studentId })} className="bg-[#b4563c] hover:bg-[#923e2a]">Delete student</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>} />
    {update.error || remove.error || upload.error || removeDocument.error ? <Alert variant="destructive" className="mt-5"><AlertCircle className="h-4 w-4" /><AlertTitle>Student profile action needs attention</AlertTitle><AlertDescription>{update.error?.message ?? remove.error?.message ?? upload.error?.message ?? removeDocument.error?.message}</AlertDescription></Alert> : null}
    <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,.9fr)]"><section className="space-y-5"><ProfileCard icon={UserRound} eyebrow="Information about student" title="Contact and profile"><InfoGrid values={[["E-mail", student.email || "Not recorded"], ["Date of birth", student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "Not recorded"], ["Guardian", student.guardianName || "Not recorded"], ["Guardian phone", student.guardianPhone || "Not recorded"], ["Guardian e-mail", student.contactEmail || "Not recorded"], ["Status", student.isActive ? "Active" : "Inactive"]]} /><InfoText label="Address" value={student.address} /><InfoText label="Notes" value={student.notes} /></ProfileCard><ProfileCard icon={CalendarCheck2} eyebrow="Attendance" title="Learning participation"><div className="rounded-xl bg-[#f7f2e9] p-5"><div className="flex items-end justify-between gap-4"><div><p className="text-3xl font-extrabold text-[#10253e]">{attendance}%</p><p className="mt-1 text-sm text-[#53657a]">{attendanceText(student.attendedSessions, student.totalSessions)}</p></div><CalendarCheck2 className="text-[#173fad]" size={28} /></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[#173fad]" style={{ width: `${attendance}%` }} /></div></div></ProfileCard><ProfileCard icon={GraduationCap} eyebrow="Level" title="Current learning level"><p className="font-display text-4xl text-[#10253e]">{student.currentLevel || "Not recorded"}</p></ProfileCard><ProfileCard icon={BookOpen} eyebrow="Course" title="Current course"><InfoGrid values={[["Course", student.courseName || "Not recorded"], ["Course code", student.courseCode || "Not recorded"], ["Start", student.courseStartDate ? new Date(student.courseStartDate).toLocaleDateString() : "Not recorded"], ["End", student.courseEndDate ? new Date(student.courseEndDate).toLocaleDateString() : "Not recorded"]]} /></ProfileCard></section><aside className="space-y-5"><ProfileCard icon={FileArchive} eyebrow="Documents" title="Student documents"><p className="text-sm leading-6 text-[#53657a]">Upload PDF, DOCX, JPG or PNG up to 5 MB. Images and PDFs have an in-page preview; DOCX files remain available as a secure file card and download link.</p><label className="mt-4 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#c8d9f8] bg-[#eef4ff] px-4 text-sm font-extrabold text-[#173fad] hover:bg-[#e0ecff]"><Upload size={16} />{upload.isPending ? "Uploading…" : "Upload document"}<input type="file" accept={supportedAccept} className="sr-only" disabled={upload.isPending} onChange={event => { void uploadFile(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label>{fileError ? <p className="mt-3 text-sm font-semibold text-[#b4563c]">{fileError}</p> : null}<div className="mt-4 space-y-3">{student.documents.length ? student.documents.map(document => <DocumentCard key={document.id} document={document} onRemove={() => removeDocument.mutate({ studentId, documentId: document.id })} pending={removeDocument.isPending} />) : <p className="rounded-xl border border-dashed border-[#dfd1bf] p-4 text-sm text-[#708098]">No documents uploaded yet.</p>}</div></ProfileCard><ProfileCard icon={ShieldCheck} eyebrow="History" title="Recent profile changes"><div className="space-y-3">{student.history.length ? student.history.map(entry => <HistoryRow key={entry.id} entry={entry} />) : <p className="text-sm text-[#708098]">No profile changes recorded yet.</p>}</div></ProfileCard></aside></div>
    <Dialog open={editing} onOpenChange={setEditing}><DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-1rem)] overflow-y-auto rounded-[1.25rem] border-[#dfd1bf] bg-[#fbf8f2] p-0 sm:max-w-3xl"><StudentForm title="Edit student" description="Update any student profile field. The change record stores field names and timestamps without duplicating sensitive prior values." draft={draft} setDraft={setDraft} pending={update.isPending} error={update.error?.message} submitLabel="Save changes" onSubmit={() => update.mutate({ studentId, ...payload(draft) })} onClose={() => setEditing(false)} /></DialogContent></Dialog>
  </div>;
}

function ModuleHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) { return <header className="founder-command-header mt-2"><div><p className="founder-command-eyebrow">{eyebrow}</p><h1 className="founder-command-title">{title}</h1><p className="founder-command-description">{description}</p></div>{action ? <div className="founder-command-action flex flex-wrap gap-2">{action}</div> : null}</header>; }
function StudentRow({ student, onOpen }: { student: StudentSummary; onOpen: () => void }) { return <button type="button" onClick={onOpen} className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 bg-white px-5 py-4 text-left transition-colors hover:bg-[#faf6ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#173fad] sm:grid-cols-[minmax(0,1fr)_minmax(10rem,.7fr)_auto]"><span className="min-w-0"><span className="block truncate font-extrabold text-[#10253e]">{student.name || "Unnamed student"}</span><span className="mt-1 block truncate text-xs text-[#708098]">{student.email || "No e-mail recorded"}</span></span><span className="hidden text-sm text-[#53657a] sm:block"><span className="block font-semibold text-[#29415b]">{student.currentLevel || "Level not recorded"}</span><span className="mt-1 block truncate text-xs">{student.courseName || "Course not recorded"}</span></span><span className="text-right text-xs"><span className={`inline-flex rounded-full px-2.5 py-1 font-extrabold ${student.isActive ? "bg-[#e8eeff] text-[#173fad]" : "bg-[#fff0ed] text-[#a34732]"}`}>{student.isActive ? "Active" : "Inactive"}</span><span className="mt-2 block text-[#708098]">{attendanceText(student.attendedSessions, student.totalSessions)}</span></span></button>; }
function StudentForm({ title, description, draft, setDraft, pending, error, submitLabel, onSubmit, onClose }: { title: string; description: string; draft: StudentDraft; setDraft: (value: StudentDraft) => void; pending: boolean; error?: string; submitLabel: string; onSubmit: () => void; onClose: () => void }) { return <form onSubmit={event => { event.preventDefault(); onSubmit(); }}><DialogHeader className="border-b border-[#e6dccd] bg-white px-6 py-6 text-left"><p className="founder-command-eyebrow">Students Profile</p><DialogTitle className="font-display text-4xl text-[#10253e]">{title}</DialogTitle><DialogDescription className="max-w-xl text-[#53657a]">{description}</DialogDescription></DialogHeader><div className="space-y-6 px-6 py-6">{error ? <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Student profile action needs attention</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}<FormSection title="Information about student"><FormGrid><Input label="Student name" value={draft.name} onChange={value => setDraft({ ...draft, name: value })} required /><Input label="Student e-mail" type="email" value={draft.email} onChange={value => setDraft({ ...draft, email: value })} /><Input label="Date of birth" type="date" value={draft.dateOfBirth} onChange={value => setDraft({ ...draft, dateOfBirth: value })} /><Input label="Guardian name" value={draft.guardianName} onChange={value => setDraft({ ...draft, guardianName: value })} /><Input label="Guardian phone" value={draft.guardianPhone} onChange={value => setDraft({ ...draft, guardianPhone: value })} /><Input label="Guardian e-mail" type="email" value={draft.contactEmail} onChange={value => setDraft({ ...draft, contactEmail: value })} /></FormGrid><Textarea label="Address" value={draft.address} onChange={value => setDraft({ ...draft, address: value })} /><Textarea label="Private notes" value={draft.notes} onChange={value => setDraft({ ...draft, notes: value })} /></FormSection><FormSection title="Attendance"><FormGrid><NumberInput label="Attended sessions" value={draft.attendedSessions} onChange={value => setDraft({ ...draft, attendedSessions: value })} /><NumberInput label="Total sessions" value={draft.totalSessions} onChange={value => setDraft({ ...draft, totalSessions: value })} /></FormGrid></FormSection><FormSection title="Level and course"><FormGrid><Input label="Current level" value={draft.currentLevel} onChange={value => setDraft({ ...draft, currentLevel: value })} /><Input label="Course name" value={draft.courseName} onChange={value => setDraft({ ...draft, courseName: value })} /><Input label="Course code" value={draft.courseCode} onChange={value => setDraft({ ...draft, courseCode: value })} /><Input label="Course start" type="date" value={draft.courseStartDate} onChange={value => setDraft({ ...draft, courseStartDate: value })} /><Input label="Course end" type="date" value={draft.courseEndDate} onChange={value => setDraft({ ...draft, courseEndDate: value })} /></FormGrid></FormSection><label className="flex min-h-14 items-center justify-between gap-4 rounded-xl border border-[#e1d5c4] bg-[#faf6ef] px-4 text-sm font-bold text-[#29415b]"><span><span className="block">Student record active</span><span className="mt-0.5 block text-xs font-normal text-[#708098]">Inactive student records remain private but are excluded by the active filter.</span></span><input type="checkbox" aria-label="Student record active" checked={draft.isActive} onChange={event => setDraft({ ...draft, isActive: event.target.checked })} className="h-5 w-5 accent-[#173fad]" /></label></div><DialogFooter className="border-t border-[#e6dccd] bg-white px-6 py-5"><Button type="button" variant="outline" onClick={onClose} disabled={pending} className="min-h-12 border-[#d8cfbf] text-[#53657a]">Cancel</Button><Button type="submit" disabled={pending} className="compass-btn-primary min-h-12">{pending ? <Loader2 className="animate-spin" size={16} /> : null}{submitLabel}</Button></DialogFooter></form>; }
function ProfileCard({ icon: Icon, eyebrow, title, children }: { icon: typeof UserRound; eyebrow: string; title: string; children: React.ReactNode }) { return <section className="founder-panel founder-panel-paper"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef4ff] text-[#173fad]"><Icon size={19} /></span><p className="mt-5 founder-command-eyebrow">{eyebrow}</p><h2 className="mt-1 font-display text-3xl text-[#10253e]">{title}</h2><div className="mt-5">{children}</div></section>; }
function InfoGrid({ values }: { values: [string, string][] }) { return <dl className="grid gap-4 sm:grid-cols-2">{values.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-[11px] font-extrabold tracking-[.08em] text-[#708098] uppercase">{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-[#29415b]">{value}</dd></div>)}</dl>; }
function InfoText({ label, value }: { label: string; value: string | null | undefined }) { return <div className="mt-5 border-t border-[#eee4d7] pt-4"><p className="text-[11px] font-extrabold tracking-[.08em] text-[#708098] uppercase">{label}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#53657a]">{value || "Not recorded"}</p></div>; }
function DocumentCard({ document, onRemove, pending }: { document: StudentDocument; onRemove: () => void; pending: boolean }) { const isImage = document.mimeType.startsWith("image/"); const isPdf = document.mimeType === "application/pdf"; return <article className="overflow-hidden rounded-xl border border-[#e1d5c4] bg-white">{isImage ? <img src={document.url} alt={`Preview of ${document.fileName}`} className="max-h-56 w-full object-cover" /> : isPdf ? <iframe title={`Preview of ${document.fileName}`} src={document.url} className="h-56 w-full bg-[#f7f2e9]" /> : <div className="grid min-h-28 place-items-center bg-[#f7f2e9] text-[#708098]"><FileText size={28} /><span className="mt-2 text-xs font-bold">DOCX file preview</span></div>}<div className="p-4"><p className="truncate text-sm font-extrabold text-[#29415b]" title={document.fileName}>{document.fileName}</p><p className="mt-1 text-xs text-[#708098]">{formatBytes(document.fileSize)} · {new Date(document.createdAt).toLocaleString()}</p><div className="mt-3 flex flex-wrap gap-2"><a href={document.url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-lg border border-[#d8cfbf] px-3 text-xs font-extrabold text-[#29415b] hover:bg-[#faf6ef]">Open</a><button type="button" onClick={onRemove} disabled={pending} className="inline-flex min-h-10 items-center rounded-lg px-3 text-xs font-extrabold text-[#b4563c] hover:bg-[#fff0ed]">Remove</button></div></div></article>; }
function HistoryRow({ entry }: { entry: StudentDetail["history"][number] }) { let fields: string[] = []; try { fields = JSON.parse(entry.changesJson || "{}").changedFields ?? []; } catch { fields = []; } return <article className="rounded-xl border border-[#e1d5c4] bg-white p-4"><p className="text-sm font-extrabold text-[#29415b]">{entry.eventType.replace(/_/g, " ").replace(/\./g, " · ")}</p><p className="mt-1 text-xs leading-5 text-[#708098]">{entry.actorName || "Founder"} · {new Date(entry.createdAt).toLocaleString()}</p>{fields.length ? <p className="mt-2 text-xs leading-5 text-[#53657a]">Changed: {fields.join(", ")}</p> : null}</article>; }
function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (next: number) => void }) { return <footer className="flex flex-col gap-3 border-t border-[#eee4d7] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-[#53657a]">Page {page + 1} of {totalPages}</p><nav className="flex flex-wrap items-center gap-2" aria-label="Student directory pages"><Button type="button" variant="outline" disabled={page === 0} onClick={() => onPage(page - 1)} className="min-h-12 border-[#d8cfbf] text-[#29415b]"><ChevronLeft size={16} />Previous</Button>{pageItems(totalPages, page).map(item => <button key={item} type="button" onClick={() => onPage(item - 1)} aria-current={item === page + 1 ? "page" : undefined} className={`min-h-12 min-w-12 rounded-lg border px-3 text-sm font-extrabold ${item === page + 1 ? "border-[#10253e] bg-[#10253e] text-white" : "border-[#d8cfbf] text-[#29415b]"}`}>{item}</button>)}<Button type="button" variant="outline" disabled={page + 1 >= totalPages} onClick={() => onPage(page + 1)} className="min-h-12 border-[#d8cfbf] text-[#29415b]">Next<ChevronRight size={16} /></Button></nav></footer>; }
function FormSection({ title, children }: { title: string; children: React.ReactNode }) { return <section><h3 className="border-b border-[#eee4d7] pb-3 font-display text-2xl text-[#10253e]">{title}</h3><div className="mt-4 space-y-4">{children}</div></section>; }
function FormGrid({ children }: { children: React.ReactNode }) { return <div className="grid gap-4 sm:grid-cols-2">{children}</div>; }
function Input({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) { return <label className="block text-xs font-extrabold text-[#53657a]">{label}<input required={required} type={type} value={value} onChange={event => onChange(event.target.value)} className="mt-1.5 h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm text-[#10253e] outline-none focus:border-[#173fad] focus:ring-2 focus:ring-[#c8d9f8]" /></label>; }
function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="block text-xs font-extrabold text-[#53657a]">{label}<input type="number" min={0} value={value} onChange={event => onChange(Math.max(0, Number(event.target.value) || 0))} className="mt-1.5 h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm text-[#10253e] outline-none focus:border-[#173fad] focus:ring-2 focus:ring-[#c8d9f8]" /></label>; }
function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-xs font-extrabold text-[#53657a]">{label}<textarea value={value} onChange={event => onChange(event.target.value)} className="mt-1.5 min-h-24 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 py-3 text-sm text-[#10253e] outline-none focus:border-[#173fad] focus:ring-2 focus:ring-[#c8d9f8]" /></label>; }
function SmallSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) { return <label className="block text-[11px] font-extrabold tracking-[.08em] text-[#708098] uppercase">{label}<select value={value} onChange={event => onChange(event.target.value)} className="mt-1 block h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#10253e] outline-none focus:border-[#173fad] focus:ring-2 focus:ring-[#c8d9f8]">{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>; }
function TextFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-[11px] font-extrabold tracking-[.08em] text-[#708098] uppercase">{label}<input value={value} onChange={event => onChange(event.target.value)} className="mt-1 h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#10253e] outline-none focus:border-[#173fad] focus:ring-2 focus:ring-[#c8d9f8]" placeholder={`Filter ${label.toLowerCase()}`} /></label>; }
function EmptyStudents({ onAdd }: { onAdd: () => void }) { return <div className="p-10 text-center"><GraduationCap className="mx-auto text-[#aab5c1]" size={30} /><h3 className="mt-4 font-display text-3xl text-[#10253e]">No students match this view</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#53657a]">Adjust the search and filters, or add a student profile when a real record is ready.</p><Button type="button" onClick={onAdd} className="compass-btn-primary mt-6"><Plus size={16} />Add student</Button></div>; }
function ErrorState({ message }: { message: string }) { return <div className="p-8"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Students Profile is unavailable</AlertTitle><AlertDescription>{message}</AlertDescription></Alert></div>; }
function readFileBase64(file: File) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error("The document could not be read.")); reader.onload = () => resolve(String(reader.result).split(",")[1] ?? ""); reader.readAsDataURL(file); }); }
