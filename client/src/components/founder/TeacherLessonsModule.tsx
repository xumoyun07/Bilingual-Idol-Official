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
  BookOpen,
  Calendar,
  Clock,
  Edit2,
  FileCode,
  FileText,
  Link,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { FounderModuleHeader } from "./FounderModuleHeader";

interface LessonPlan {
  id: number;
  courseTitle: string;
  topicTitle: string;
  lessonNumber: number;
  durationMinutes: number;
  learningObjectives: string;
  materials: string;
  homework: string;
  createdDate: string;
}

const initialLessons: LessonPlan[] = [
  {
    id: 1,
    courseTitle: "General English (Adults)",
    topicTitle: "Describing Experiences & Present Perfect vs Past Simple",
    lessonNumber: 5,
    durationMinutes: 90,
    learningObjectives: "Master distinction between finished past time and life experiences.",
    materials: "Cambridge English File Unit 4, Audio Track 4.2, Handout 4B.",
    homework: "Complete Workbook exercises pages 32-34 and write 5 life goals.",
    createdDate: "2026-09-02",
  },
  {
    id: 2,
    courseTitle: "IELTS Exam Preparation",
    topicTitle: "Academic Writing Task 1: Describing Bar Charts & Trends",
    lessonNumber: 3,
    durationMinutes: 120,
    learningObjectives: "Overview paragraph formulas, vocabulary of upward/downward trends.",
    materials: "Official Cambridge IELTS 18 Test 2 Task 1 Sample charts.",
    homework: "Write a 150-word report on the global renewable energy usage chart.",
    createdDate: "2026-09-04",
  },
  {
    id: 3,
    courseTitle: "Kids English Foundation",
    topicTitle: "Animals & Habitats: Phonics and Simple Present Sentences",
    lessonNumber: 8,
    durationMinutes: 60,
    learningObjectives: "Identify jungle & farm animals; pronounce 'sh' and 'ch' blends.",
    materials: "Flashcards Set 3, Oxford Phonics World Book 2, Toy figurines.",
    homework: "Colour the animals worksheet and practice phonics chants with parents.",
    createdDate: "2026-09-06",
  },
];

const emptyLesson: Omit<LessonPlan, "id"> = {
  courseTitle: "General English (Adults)",
  topicTitle: "",
  lessonNumber: 1,
  durationMinutes: 90,
  learningObjectives: "",
  materials: "",
  homework: "",
  createdDate: new Date().toISOString().slice(0, 10),
};

export function TeacherLessonsModule() {
  const [lessons, setLessons] = useState<LessonPlan[]>(() => {
    const saved = localStorage.getItem("bilc_teacher_lessons");
    return saved ? JSON.parse(saved) : initialLessons;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [formState, setFormState] = useState<Omit<LessonPlan, "id">>(emptyLesson);

  const saveLessons = (newLessons: LessonPlan[]) => {
    setLessons(newLessons);
    localStorage.setItem("bilc_teacher_lessons", JSON.stringify(newLessons));
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditId(null);
    setFormState(emptyLesson);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: LessonPlan) => {
    setIsEditing(true);
    setEditId(plan.id);
    setFormState({
      courseTitle: plan.courseTitle,
      topicTitle: plan.topicTitle,
      lessonNumber: plan.lessonNumber,
      durationMinutes: plan.durationMinutes,
      learningObjectives: plan.learningObjectives,
      materials: plan.materials,
      homework: plan.homework,
      createdDate: plan.createdDate,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.topicTitle.trim()) {
      toast.error("Topic title is required.");
      return;
    }

    if (isEditing && editId !== null) {
      const updated = lessons.map((l) => (l.id === editId ? { ...formState, id: editId } : l));
      saveLessons(updated);
      toast.success("Lesson plan updated.");
    } else {
      const newPlan: LessonPlan = {
        ...formState,
        id: Date.now(),
      };
      saveLessons([newPlan, ...lessons]);
      toast.success("Lesson plan created successfully.");
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    const updated = lessons.filter((l) => l.id !== deleteTargetId);
    saveLessons(updated);
    toast.success("Lesson plan removed.");
    setDeleteTargetId(null);
  };

  const filteredLessons = React.useMemo(() => {
    return lessons.filter((l) => {
      return (
        !searchQuery.trim() ||
        l.topicTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.learningObjectives.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [lessons, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <FounderModuleHeader
        badgeIcon={BookOpen}
        badgeLabel="Teacher Module"
        badgeTone="bg-[#e8eeff] text-[#173fad] border-[#c0d4ff]"
        subtitle="Curriculum Authoring"
        title="Lesson Plans & Curriculum"
        description="Author classroom curricula, lesson learning objectives, handouts, and assigned homework."
        decorativeIcon={BookOpen}
        statusText="Active Plans"
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="compass-btn-primary h-10 px-4 gap-1.5 shadow-xs w-full sm:w-auto"
            >
              <Plus size={15} />
              Create Lesson Plan
            </Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-[#dce4e7] shadow-sm">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#53657a]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lesson plans by topic, objectives, or course..."
            className="pl-9 h-9 text-sm"
          />
        </div>
        <span className="text-xs text-[#53657a] px-2 whitespace-nowrap">{filteredLessons.length} plans</span>
      </div>

      {/* Cards */}
      {filteredLessons.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#dce4e7] rounded-xl">
          <BookOpen className="mx-auto size-10 text-[#53657a]/50" />
          <p className="mt-2 text-sm font-semibold text-[#10253e]">No lesson plans found</p>
          <p className="text-xs text-[#53657a]">Click "Create Lesson Plan" to prepare a new session guide.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLessons.map((plan) => (
            <Card key={plan.id} className="border-[#dce4e7] shadow-sm flex flex-col justify-between">
              <div>
                <div className="p-4 border-b border-[#edf2f5]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#e8eeff] text-[#173fad]">
                      Lesson #{plan.lessonNumber}
                    </span>
                    <span className="text-[11px] text-[#53657a] flex items-center gap-1">
                      <Clock size={11} /> {plan.durationMinutes} mins
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[#10253e] mt-2 leading-snug">{plan.topicTitle}</h3>
                  <p className="text-xs font-medium text-[#173fad] mt-1">{plan.courseTitle}</p>
                </div>

                <CardContent className="p-4 space-y-2.5 text-xs text-[#53657a]">
                  <div>
                    <strong className="text-[#10253e] block mb-0.5">Objectives:</strong>
                    <p className="text-[#314155] line-clamp-2">{plan.learningObjectives}</p>
                  </div>
                  {plan.materials ? (
                    <div>
                      <strong className="text-[#10253e] block mb-0.5">Materials / Handouts:</strong>
                      <p className="text-[#53657a] line-clamp-1">{plan.materials}</p>
                    </div>
                  ) : null}
                  {plan.homework ? (
                    <div>
                      <strong className="text-[#10253e] block mb-0.5">Homework:</strong>
                      <p className="text-[#53657a] line-clamp-1">{plan.homework}</p>
                    </div>
                  ) : null}
                </CardContent>
              </div>

              <div className="p-3 bg-[#f8fafc] border-t border-[#edf2f5] flex items-center justify-end gap-1.5 rounded-b-xl">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(plan)}
                  className="h-8 text-xs gap-1"
                >
                  <Edit2 size={12} />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteTargetId(plan.id)}
                  className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1"
                >
                  <Trash2 size={12} />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#10253e]">
              {isEditing ? "Edit Lesson Plan" : "Create New Lesson Plan"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#53657a]">
              Design structured instructional modules, targets, and classroom exercises.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">Course Name *</Label>
                <Input
                  required
                  value={formState.courseTitle}
                  onChange={(e) => setFormState((p) => ({ ...p, courseTitle: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Lesson #</Label>
                <Input
                  type="number"
                  min={1}
                  value={formState.lessonNumber}
                  onChange={(e) => setFormState((p) => ({ ...p, lessonNumber: Number(e.target.value) }))}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Topic / Theme *</Label>
              <Input
                required
                value={formState.topicTitle}
                onChange={(e) => setFormState((p) => ({ ...p, topicTitle: e.target.value }))}
                placeholder="e.g. Present Perfect Continuous in Business Meetings"
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Learning Objectives</Label>
              <Textarea
                rows={2}
                value={formState.learningObjectives}
                onChange={(e) => setFormState((p) => ({ ...p, learningObjectives: e.target.value }))}
                placeholder="Key competencies and language points students will master..."
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Materials & Resources</Label>
                <Textarea
                  rows={2}
                  value={formState.materials}
                  onChange={(e) => setFormState((p) => ({ ...p, materials: e.target.value }))}
                  placeholder="Coursebook pages, audio tracks, digital worksheets..."
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Homework Assignment</Label>
                <Textarea
                  rows={2}
                  value={formState.homework}
                  onChange={(e) => setFormState((p) => ({ ...p, homework: e.target.value }))}
                  placeholder="Take-home writing, workbook exercises, online drills..."
                  className="text-sm"
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-[#173fad] hover:bg-[#12328b] text-white">
                {isEditing ? "Save Changes" : "Create Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#10253e]">Delete Lesson Plan?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#53657a]">
              Are you sure you want to delete this curriculum module?
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
