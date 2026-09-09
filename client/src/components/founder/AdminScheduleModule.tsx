import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Clock,
  Edit2,
  GraduationCap,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

interface ScheduleSlot {
  id: number;
  courseTitle: string;
  teacherName: string;
  classroom: string;
  dayOfWeek: string;
  timeSlot: string;
  enrolledStudents: number;
  maxCapacity: number;
  level: string;
  status: "active" | "full" | "upcoming";
}

const initialSchedules: ScheduleSlot[] = [
  {
    id: 1,
    courseTitle: "General English (Adults)",
    teacherName: "Sarah Jenkins",
    classroom: "Room 101 (Cambridge Suite)",
    dayOfWeek: "Monday & Wednesday",
    timeSlot: "19:00 - 20:30",
    enrolledStudents: 12,
    maxCapacity: 15,
    level: "Intermediate B2",
    status: "active",
  },
  {
    id: 2,
    courseTitle: "IELTS Exam Preparation",
    teacherName: "David Wong",
    classroom: "Room 204 (Oxford Hall)",
    dayOfWeek: "Tuesday & Thursday",
    timeSlot: "18:30 - 20:30",
    enrolledStudents: 10,
    maxCapacity: 10,
    level: "Upper-Intermediate C1",
    status: "full",
  },
  {
    id: 3,
    courseTitle: "Kids English Foundation",
    teacherName: "Nurul Aini",
    classroom: "Room 102 (Young Explorers)",
    dayOfWeek: "Saturday",
    timeSlot: "10:00 - 12:00",
    enrolledStudents: 8,
    maxCapacity: 12,
    level: "Beginner A1",
    status: "active",
  },
  {
    id: 4,
    courseTitle: "Business English Masterclass",
    teacherName: "Michael Croft",
    classroom: "Room 301 (Executive Boardroom)",
    dayOfWeek: "Friday",
    timeSlot: "19:00 - 21:00",
    enrolledStudents: 6,
    maxCapacity: 12,
    level: "Advanced C1/C2",
    status: "upcoming",
  },
];

const emptySlot: Omit<ScheduleSlot, "id"> = {
  courseTitle: "",
  teacherName: "",
  classroom: "Room 101",
  dayOfWeek: "Monday & Wednesday",
  timeSlot: "19:00 - 20:30",
  enrolledStudents: 0,
  maxCapacity: 15,
  level: "Beginner A1",
  status: "active",
};

export function AdminScheduleModule() {
  const { td, isRTL } = useLanguage();
  const [schedules, setSchedules] = useState<ScheduleSlot[]>(() => {
    const saved = localStorage.getItem("bilc_admin_schedules");
    return saved ? JSON.parse(saved) : initialSchedules;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formState, setFormState] = useState<Omit<ScheduleSlot, "id">>(emptySlot);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const saveSchedules = (newSlots: ScheduleSlot[]) => {
    setSchedules(newSlots);
    localStorage.setItem("bilc_admin_schedules", JSON.stringify(newSlots));
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditId(null);
    setFormState(emptySlot);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (slot: ScheduleSlot) => {
    setIsEditing(true);
    setEditId(slot.id);
    setFormState({
      courseTitle: slot.courseTitle,
      teacherName: slot.teacherName,
      classroom: slot.classroom,
      dayOfWeek: slot.dayOfWeek,
      timeSlot: slot.timeSlot,
      enrolledStudents: slot.enrolledStudents,
      maxCapacity: slot.maxCapacity,
      level: slot.level,
      status: slot.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.courseTitle.trim() || !formState.teacherName.trim()) {
      toast.error(td("Course title and teacher name are required."));
      return;
    }

    if (isEditing && editId !== null) {
      const updated = schedules.map((s) => (s.id === editId ? { ...formState, id: editId } : s));
      saveSchedules(updated);
      toast.success(td("Schedule slot updated successfully."));
    } else {
      const newSlot: ScheduleSlot = {
        ...formState,
        id: Date.now(),
      };
      saveSchedules([newSlot, ...schedules]);
      toast.success(td("New class schedule created successfully."));
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    const updated = schedules.filter((s) => s.id !== deleteTargetId);
    saveSchedules(updated);
    toast.success(td("Class schedule removed."));
    setDeleteTargetId(null);
  };

  const filteredSchedules = React.useMemo(() => {
    return schedules.filter((s) => {
      const matchSearch =
        !searchQuery.trim() ||
        s.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.classroom.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDay = selectedDay === "all" || s.dayOfWeek.toLowerCase().includes(selectedDay.toLowerCase());
      return matchSearch && matchDay;
    });
  }, [schedules, searchQuery, selectedDay]);

  return (
    <div className={`space-y-6 ${isRTL ? "dir-rtl" : ""}`}>
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#f4eddd] text-[#705a30] border border-[#e4d3b1]">
              <CalendarDays size={13} />
              {td("Admin Module")}
            </span>
            <span className="text-xs text-[#53657a]">{td("CRUD: Timetable & Class Allocations")}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#10253e] mt-1">{td("Class Timetables & Schedules")}</h2>
          <p className="text-sm text-[#53657a]">
            {td("Manage teacher assignments, classroom allocations, student capacities, and weekly class times.")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-9 gap-1.5 bg-[#173fad] hover:bg-[#12328b] text-white"
          >
            <Plus size={15} />
            {td("Add Class Schedule")}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-[#dce4e7] shadow-sm">
        <div className="relative flex-1">
          <Search size={15} className={`absolute top-1/2 -translate-y-1/2 text-[#53657a] ${isRTL ? "right-3" : "left-3"}`} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={td("Search classes by course name, instructor, or room...")}
            className={`h-9 text-sm ${isRTL ? "pr-9 pl-3" : "pl-9 pr-3"}`}
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            aria-label="Filter schedules by day"
            className="h-9 px-3 text-xs font-medium rounded-lg border border-[#dce4e7] bg-[#f8fafc] text-[#10253e] focus:outline-none focus:ring-2 focus:ring-[#173fad]"
          >
            <option value="all">{td("All Days")}</option>
            <option value="monday">{td("Monday")}</option>
            <option value="tuesday">{td("Tuesday")}</option>
            <option value="wednesday">{td("Wednesday")}</option>
            <option value="thursday">{td("Thursday")}</option>
            <option value="friday">{td("Friday")}</option>
            <option value="saturday">{td("Saturday")}</option>
          </select>
          <span className="text-xs text-[#53657a] px-2 whitespace-nowrap">
            {filteredSchedules.length} {td("classes")}
          </span>
        </div>
      </div>

      {/* Grid */}
      {filteredSchedules.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#dce4e7] rounded-xl">
          <CalendarDays className="mx-auto size-10 text-[#53657a]/50" />
          <p className="mt-2 text-sm font-semibold text-[#10253e]">{td("No class schedules found")}</p>
          <p className="text-xs text-[#53657a]">{td("Click \"Add Class Schedule\" to allocate a classroom and teacher.")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSchedules.map((slot) => (
            <Card key={slot.id} className="border-[#dce4e7] shadow-sm flex flex-col justify-between">
              <div>
                <div className="p-4 border-b border-[#edf2f5] flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#173fad]">
                        {td(slot.level)}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          slot.status === "full"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : slot.status === "upcoming"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {td(slot.status.toUpperCase())}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-[#10253e] mt-1">{td(slot.courseTitle)}</h3>
                  </div>
                </div>

                <CardContent className="p-4 space-y-2.5 text-xs text-[#53657a]">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5">
                      <UsersRound size={13} className="text-[#173fad]" />
                      <span>
                        {td("Teacher")}: <strong className="text-[#10253e]">{td(slot.teacherName)}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-[#173fad]" />
                      <span>
                        {td("Room")}: <strong className="text-[#10253e]">{td(slot.classroom)}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarDays size={13} className="text-[#173fad]" />
                      <span>{td(slot.dayOfWeek)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-[#173fad]" />
                      <span>{td(slot.timeSlot)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#edf2f5] flex items-center justify-between">
                    <span>{td("Class Capacity")}:</span>
                    <span className="font-semibold text-[#10253e]">
                      {slot.enrolledStudents} / {slot.maxCapacity} {td("Students Enrolled")}
                    </span>
                  </div>
                </CardContent>
              </div>

              <div className="p-3 bg-[#f8fafc] border-t border-[#edf2f5] flex items-center justify-end gap-1.5 rounded-b-xl">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(slot)}
                  className="h-8 text-xs gap-1"
                >
                  <Edit2 size={12} />
                  {td("Edit")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteTargetId(slot.id)}
                  className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1"
                >
                  <Trash2 size={12} />
                  {td("Delete")}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className={`max-w-xl max-h-[90vh] overflow-y-auto ${isRTL ? "dir-rtl" : ""}`}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#10253e]">
              {isEditing ? td("Edit Class Timetable Slot") : td("Create New Class Timetable Slot")}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#53657a]">
              {td("Assign instructors, classroom facilities, student limits, and weekly times.")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{td("Course Title")} *</Label>
              <Input
                required
                value={formState.courseTitle}
                onChange={(e) => setFormState((p) => ({ ...p, courseTitle: e.target.value }))}
                placeholder="e.g. Intensive Academic English"
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{td("Assigned Instructor")} *</Label>
                <Input
                  required
                  value={formState.teacherName}
                  onChange={(e) => setFormState((p) => ({ ...p, teacherName: e.target.value }))}
                  placeholder="e.g. Sarah Jenkins"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{td("Classroom")}</Label>
                <Input
                  value={formState.classroom}
                  onChange={(e) => setFormState((p) => ({ ...p, classroom: e.target.value }))}
                  placeholder="e.g. Room 101 (Cambridge Suite)"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{td("Days of Week")}</Label>
                <Input
                  value={formState.dayOfWeek}
                  onChange={(e) => setFormState((p) => ({ ...p, dayOfWeek: e.target.value }))}
                  placeholder="e.g. Monday & Wednesday"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{td("Time Slot")}</Label>
                <Input
                  value={formState.timeSlot}
                  onChange={(e) => setFormState((p) => ({ ...p, timeSlot: e.target.value }))}
                  placeholder="e.g. 19:00 - 20:30"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{td("Level")}</Label>
                <Input
                  value={formState.level}
                  onChange={(e) => setFormState((p) => ({ ...p, level: e.target.value }))}
                  placeholder="e.g. B2 Intermediate"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{td("Enrolled Students")}</Label>
                <Input
                  type="number"
                  min={0}
                  value={formState.enrolledStudents}
                  onChange={(e) => setFormState((p) => ({ ...p, enrolledStudents: Number(e.target.value) }))}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{td("Max Capacity")}</Label>
                <Input
                  type="number"
                  min={1}
                  value={formState.maxCapacity}
                  onChange={(e) => setFormState((p) => ({ ...p, maxCapacity: Number(e.target.value) }))}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{td("Class Status")}</Label>
              <select
                value={formState.status}
                onChange={(e) => setFormState((p) => ({ ...p, status: e.target.value as any }))}
                aria-label="Class status"
                className="w-full h-9 px-3 text-sm rounded-lg border border-[#dce4e7] bg-white text-[#10253e]"
              >
                <option value="active">{td("Active (Enrolling)")}</option>
                <option value="full">{td("Full (Waitlist Only)")}</option>
                <option value="upcoming">{td("Upcoming (Future Intake)")}</option>
              </select>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                {td("Cancel")}
              </Button>
              <Button type="submit" size="sm" className="bg-[#173fad] hover:bg-[#12328b] text-white">
                {isEditing ? td("Save Changes") : td("Create Schedule")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent className={isRTL ? "dir-rtl" : ""}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#10253e]">
              {td("Remove Class Schedule Slot?")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#53657a]">
              {td("Are you sure you want to delete this class schedule? Assigned students and classroom records will be updated.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">{td("Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-white text-xs">
              {td("Confirm Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
