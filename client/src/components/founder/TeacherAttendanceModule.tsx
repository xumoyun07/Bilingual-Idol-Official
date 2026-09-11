import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit2,
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { FounderModuleHeader } from "./FounderModuleHeader";

type AttendanceStatus = "present" | "late" | "absent" | "excused";

interface AttendanceRecord {
  id: number;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  sessionDate: string;
  status: AttendanceStatus;
  note: string;
  markedBy: string;
}

const initialAttendanceRecords: AttendanceRecord[] = [
  {
    id: 1,
    studentName: "Ahmad Farhan",
    studentEmail: "ahmad@bilc.my",
    courseTitle: "General English (Adults)",
    sessionDate: "2026-09-08",
    status: "present",
    note: "Active participation in speaking drill.",
    markedBy: "Sarah Jenkins",
  },
  {
    id: 2,
    studentName: "Siti Nurhaliza",
    studentEmail: "siti@bilc.my",
    courseTitle: "General English (Adults)",
    sessionDate: "2026-09-08",
    status: "present",
    note: "Completed all homework exercises.",
    markedBy: "Sarah Jenkins",
  },
  {
    id: 3,
    studentName: "Li Wei",
    studentEmail: "liwei@bilc.my",
    courseTitle: "General English (Adults)",
    sessionDate: "2026-09-08",
    status: "late",
    note: "Arrived 15 minutes late due to traffic.",
    markedBy: "Sarah Jenkins",
  },
  {
    id: 4,
    studentName: "Zainab Al-Mansoor",
    studentEmail: "zainab@bilc.my",
    courseTitle: "IELTS Exam Preparation",
    sessionDate: "2026-09-08",
    status: "excused",
    note: "Medical certificate submitted to centre.",
    markedBy: "David Wong",
  },
];

const statusStyles: Record<AttendanceStatus, { label: string; tone: string }> = {
  present: { label: "Present", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  late: { label: "Late", tone: "bg-amber-50 text-amber-700 border-amber-200" },
  absent: { label: "Absent", tone: "bg-rose-50 text-rose-700 border-rose-200" },
  excused: { label: "Excused", tone: "bg-blue-50 text-blue-700 border-blue-200" },
};

export function TeacherAttendanceModule() {
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem("bilc_teacher_attendance");
    return saved ? JSON.parse(saved) : initialAttendanceRecords;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const [formState, setFormState] = useState<Omit<AttendanceRecord, "id">>({
    studentName: "",
    studentEmail: "",
    courseTitle: "General English (Adults)",
    sessionDate: new Date().toISOString().slice(0, 10),
    status: "present",
    note: "",
    markedBy: "Teacher Console",
  });

  const saveRecords = (newRecords: AttendanceRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem("bilc_teacher_attendance", JSON.stringify(newRecords));
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditId(null);
    setFormState({
      studentName: "",
      studentEmail: "",
      courseTitle: "General English (Adults)",
      sessionDate: new Date().toISOString().slice(0, 10),
      status: "present",
      note: "",
      markedBy: "Teacher Console",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: AttendanceRecord) => {
    setIsEditing(true);
    setEditId(rec.id);
    setFormState({
      studentName: rec.studentName,
      studentEmail: rec.studentEmail,
      courseTitle: rec.courseTitle,
      sessionDate: rec.sessionDate,
      status: rec.status,
      note: rec.note,
      markedBy: rec.markedBy,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.studentName.trim()) {
      toast.error("Student name is required.");
      return;
    }

    if (isEditing && editId !== null) {
      const updated = records.map((r) => (r.id === editId ? { ...formState, id: editId } : r));
      saveRecords(updated);
      toast.success("Attendance record updated.");
    } else {
      const newRec: AttendanceRecord = {
        ...formState,
        id: Date.now(),
      };
      saveRecords([newRec, ...records]);
      toast.success("Attendance recorded successfully.");
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    const updated = records.filter((r) => r.id !== deleteTargetId);
    saveRecords(updated);
    toast.success("Attendance entry deleted.");
    setDeleteTargetId(null);
  };

  const handleQuickStatus = (id: number, status: AttendanceStatus) => {
    const updated = records.map((r) => (r.id === id ? { ...r, status } : r));
    saveRecords(updated);
    toast.success(`Updated status to ${statusStyles[status].label}`);
  };

  const filteredRecords = React.useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        !searchQuery.trim() ||
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = selectedStatus === "all" || r.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [records, searchQuery, selectedStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <FounderModuleHeader
        badgeIcon={CheckCircle2}
        badgeLabel="Teacher Module"
        badgeTone="bg-[#e8eeff] text-[#173fad] border-[#c0d4ff]"
        subtitle="Attendance Tracking"
        title="Student Attendance Records"
        description="Record daily lesson attendance, mark present/late/absent status, and log participation notes."
        decorativeIcon={CheckCircle2}
        statusText="Active Register"
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="compass-btn-primary h-10 px-4 gap-1.5 shadow-xs w-full sm:w-auto"
            >
              <Plus size={15} />
              Record Attendance
            </Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-[#dce4e7] shadow-sm">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#53657a]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, email, or course..."
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter attendance by status"
            className="h-9 px-3 text-xs font-medium rounded-lg border border-[#dce4e7] bg-[#f8fafc] text-[#10253e] focus:outline-none focus:ring-2 focus:ring-[#173fad]"
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
            <option value="excused">Excused</option>
          </select>
          <span className="text-xs text-[#53657a] px-2 whitespace-nowrap">
            {filteredRecords.length} records
          </span>
        </div>
      </div>

      {/* Table (Desktop) / Cards (Mobile) */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#dce4e7] rounded-xl">
          <CheckCircle2 className="mx-auto size-10 text-[#53657a]/50" />
          <p className="mt-2 text-sm font-semibold text-[#10253e]">No attendance entries found</p>
          <p className="text-xs text-[#53657a]">Click "Record Attendance" to log a student session.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Mobile View: High-Accessibility Cards (< md) */}
          <div className="block md:hidden space-y-3">
            {filteredRecords.map((rec) => {
              const style = statusStyles[rec.status] || statusStyles.present;
              return (
                <div
                  key={`attendance-card-${rec.id}`}
                  className="bg-white rounded-xl border border-[#dce4e7] p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-base text-[#10253e]">{rec.studentName}</h4>
                      <p className="text-xs text-[#53657a]">{rec.studentEmail}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-[#53657a] flex items-center gap-1 bg-[#f8fafc] px-2 py-1 rounded-md border border-[#edf2f5]">
                      <CalendarDays size={12} /> {rec.sessionDate}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="font-medium text-[#10253e]">{rec.courseTitle}</div>
                    {rec.note && (
                      <p className="text-[#53657a] italic bg-[#f8fafc] p-2 rounded border border-[#edf2f5]">
                        "{rec.note}"
                      </p>
                    )}
                    <span className="text-[10px] text-[#8292a1] block">Marked by {rec.markedBy}</span>
                  </div>

                  {/* Status Selection Full-Width */}
                  <div>
                    <label htmlFor={`attendance-status-${rec.id}`} className="sr-only">
                      Update attendance status
                    </label>
                    <select
                      id={`attendance-status-${rec.id}`}
                      value={rec.status}
                      onChange={(e) => handleQuickStatus(rec.id, e.target.value as AttendanceStatus)}
                      aria-label={`Update status for ${rec.studentName}`}
                      className={`w-full min-h-[44px] text-xs font-semibold px-3 py-2 rounded-lg border focus:outline-none ${style.tone}`}
                    >
                      <option value="present">Present</option>
                      <option value="late">Late</option>
                      <option value="absent">Absent</option>
                      <option value="excused">Excused</option>
                    </select>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-2 border-t border-[#edf2f5] flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(rec)}
                      className="flex-1 min-h-[44px] text-xs font-semibold text-[#173fad] border-[#c0d4ff] hover:bg-[#e8eeff] gap-1.5"
                    >
                      <Edit2 size={14} /> Edit Entry
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTargetId(rec.id)}
                      className="min-h-[44px] min-w-[44px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0"
                      aria-label="Delete attendance entry"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop View: Multi-Column Table (>= md) */}
          <div className="hidden md:block bg-white rounded-xl border border-[#dce4e7] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] border-b border-[#dce4e7] text-[#53657a] uppercase font-semibold">
                  <tr>
                    <th className="p-3.5">Student</th>
                    <th className="p-3.5">Course / Date</th>
                    <th className="p-3.5">Attendance Status</th>
                    <th className="p-3.5">Observation Notes</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2f5]">
                  {filteredRecords.map((rec) => {
                    const style = statusStyles[rec.status] || statusStyles.present;
                    return (
                      <tr key={rec.id} className="hover:bg-[#fbfcfe] transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-sm text-[#10253e]">{rec.studentName}</div>
                          <div className="text-[#53657a] text-[11px] mt-0.5">{rec.studentEmail}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-[#10253e]">{rec.courseTitle}</div>
                          <div className="text-[#53657a] text-[11px] flex items-center gap-1 mt-0.5">
                            <CalendarDays size={11} /> {rec.sessionDate}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <select
                              value={rec.status}
                              onChange={(e) => handleQuickStatus(rec.id, e.target.value as AttendanceStatus)}
                              aria-label={`Update status for ${rec.studentName}`}
                              className={`text-xs font-semibold px-2 py-0.5 rounded-md border focus:outline-none ${style.tone}`}
                            >
                              <option value="present">Present</option>
                              <option value="late">Late</option>
                              <option value="absent">Absent</option>
                              <option value="excused">Excused</option>
                            </select>
                          </div>
                        </td>
                        <td className="p-3.5 text-[#53657a] max-w-xs">
                          <p className="line-clamp-2">{rec.note || "No note recorded."}</p>
                          <span className="text-[10px] text-[#8292a1] block mt-0.5">Marked by {rec.markedBy}</span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(rec)}
                              className="h-8 w-8 p-0 text-[#173fad] hover:bg-[#e8eeff]"
                            >
                              <Edit2 size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTargetId(rec.id)}
                              className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#10253e]">
              {isEditing ? "Edit Attendance Entry" : "Record Student Attendance"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#53657a]">
              Log lesson attendance status and student classroom observations.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Student Name *</Label>
              <Input
                required
                value={formState.studentName}
                onChange={(e) => setFormState((p) => ({ ...p, studentName: e.target.value }))}
                placeholder="Student full name"
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Student Nickname / Email</Label>
              <Input
                value={formState.studentEmail}
                onChange={(e) => setFormState((p) => ({ ...p, studentEmail: e.target.value }))}
                placeholder="student@bilc.my"
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Class Session</Label>
                <Input
                  value={formState.courseTitle}
                  onChange={(e) => setFormState((p) => ({ ...p, courseTitle: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Session Date</Label>
                <Input
                  type="date"
                  value={formState.sessionDate}
                  onChange={(e) => setFormState((p) => ({ ...p, sessionDate: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Attendance Status</Label>
              <select
                value={formState.status}
                onChange={(e) => setFormState((p) => ({ ...p, status: e.target.value as AttendanceStatus }))}
                aria-label="Attendance status selection"
                className="w-full h-9 px-3 text-sm rounded-lg border border-[#dce4e7] bg-white text-[#10253e]"
              >
                <option value="present">Present (On Time)</option>
                <option value="late">Late (Arrived After Start)</option>
                <option value="absent">Absent (Unexcused)</option>
                <option value="excused">Excused (Medical / Prior Notice)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Observation Notes</Label>
              <Textarea
                rows={2}
                value={formState.note}
                onChange={(e) => setFormState((p) => ({ ...p, note: e.target.value }))}
                placeholder="Lesson engagement, homework completion, or remarks..."
                className="text-sm"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-[#173fad] hover:bg-[#12328b] text-white">
                {isEditing ? "Save Changes" : "Record Entry"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#10253e]">Delete Attendance Entry?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#53657a]">
              Are you sure you want to delete this attendance record?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-white text-xs">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
