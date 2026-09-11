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
  Award,
  BookOpen,
  CheckCircle2,
  Edit2,
  FileText,
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { FounderModuleHeader } from "./FounderModuleHeader";

interface GradeRecord {
  id: number;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  assessmentTitle: string;
  category: "quiz" | "midterm" | "final" | "speaking" | "homework";
  score: number;
  maxScore: number;
  gradedDate: string;
  feedback: string;
  isPublished: boolean;
}

const initialGrades: GradeRecord[] = [
  {
    id: 1,
    studentName: "Ahmad Farhan",
    studentEmail: "ahmad@bilc.my",
    courseTitle: "General English (Adults)",
    assessmentTitle: "Unit 3 Vocabulary & Grammar Quiz",
    category: "quiz",
    score: 88,
    maxScore: 100,
    gradedDate: "2026-09-05",
    feedback: "Excellent command of modal verbs. Review conditional clauses.",
    isPublished: true,
  },
  {
    id: 2,
    studentName: "Siti Nurhaliza",
    studentEmail: "siti@bilc.my",
    courseTitle: "General English (Adults)",
    assessmentTitle: "Unit 3 Vocabulary & Grammar Quiz",
    category: "quiz",
    score: 95,
    maxScore: 100,
    gradedDate: "2026-09-05",
    feedback: "Outstanding score! Great listening and reading comprehension.",
    isPublished: true,
  },
  {
    id: 3,
    studentName: "Zainab Al-Mansoor",
    studentEmail: "zainab@bilc.my",
    courseTitle: "IELTS Exam Preparation",
    assessmentTitle: "IELTS Speaking Mock Test Part 2 & 3",
    category: "speaking",
    score: 7.5,
    maxScore: 9.0,
    gradedDate: "2026-09-06",
    feedback: "High lexical resource and natural pronunciation. Fluency scored high.",
    isPublished: true,
  },
  {
    id: 4,
    studentName: "Li Wei",
    studentEmail: "liwei@bilc.my",
    courseTitle: "General English (Adults)",
    assessmentTitle: "Mid-Term Written Essay",
    category: "midterm",
    score: 82,
    maxScore: 100,
    gradedDate: "2026-09-07",
    feedback: "Good essay structure. Watch paragraph transitions.",
    isPublished: false,
  },
];

const emptyGrade: Omit<GradeRecord, "id"> = {
  studentName: "",
  studentEmail: "",
  courseTitle: "General English (Adults)",
  assessmentTitle: "Term Assessment",
  category: "quiz",
  score: 85,
  maxScore: 100,
  gradedDate: new Date().toISOString().slice(0, 10),
  feedback: "",
  isPublished: true,
};

export function TeacherGradesModule() {
  const [grades, setGrades] = useState<GradeRecord[]>(() => {
    const saved = localStorage.getItem("bilc_teacher_grades");
    return saved ? JSON.parse(saved) : initialGrades;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [formState, setFormState] = useState<Omit<GradeRecord, "id">>(emptyGrade);

  const saveGrades = (newGrades: GradeRecord[]) => {
    setGrades(newGrades);
    localStorage.setItem("bilc_teacher_grades", JSON.stringify(newGrades));
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditId(null);
    setFormState(emptyGrade);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: GradeRecord) => {
    setIsEditing(true);
    setEditId(rec.id);
    setFormState({
      studentName: rec.studentName,
      studentEmail: rec.studentEmail,
      courseTitle: rec.courseTitle,
      assessmentTitle: rec.assessmentTitle,
      category: rec.category,
      score: rec.score,
      maxScore: rec.maxScore,
      gradedDate: rec.gradedDate,
      feedback: rec.feedback,
      isPublished: rec.isPublished,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.studentName.trim() || !formState.assessmentTitle.trim()) {
      toast.error("Student name and assessment title are required.");
      return;
    }

    if (isEditing && editId !== null) {
      const updated = grades.map((g) => (g.id === editId ? { ...formState, id: editId } : g));
      saveGrades(updated);
      toast.success("Assessment grade updated.");
    } else {
      const newGrade: GradeRecord = {
        ...formState,
        id: Date.now(),
      };
      saveGrades([newGrade, ...grades]);
      toast.success("Grade recorded successfully.");
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    const updated = grades.filter((g) => g.id !== deleteTargetId);
    saveGrades(updated);
    toast.success("Assessment record deleted.");
    setDeleteTargetId(null);
  };

  const togglePublish = (id: number) => {
    const updated = grades.map((g) => (g.id === id ? { ...g, isPublished: !g.isPublished } : g));
    saveGrades(updated);
    toast.success("Publication status updated.");
  };

  const filteredGrades = React.useMemo(() => {
    return grades.filter((g) => {
      const matchSearch =
        !searchQuery.trim() ||
        g.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.assessmentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === "all" || g.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [grades, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <FounderModuleHeader
        badgeIcon={FileText}
        badgeLabel="Teacher Module"
        badgeTone="bg-[#e8eeff] text-[#173fad] border-[#c0d4ff]"
        subtitle="Evaluation & Feedback"
        title="Assessments & Grading"
        description="Record evaluation marks, write pedagogical feedback, and publish academic report cards."
        decorativeIcon={FileText}
        statusText="Grading Active"
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="compass-btn-primary h-10 px-4 gap-1.5 shadow-xs w-full sm:w-auto"
            >
              <Plus size={15} />
              Record Assessment
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
            placeholder="Search by student name, assessment title, or course..."
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter grades by category"
            className="h-9 px-3 text-xs font-medium rounded-lg border border-[#dce4e7] bg-[#f8fafc] text-[#10253e] focus:outline-none focus:ring-2 focus:ring-[#173fad]"
          >
            <option value="all">All Categories</option>
            <option value="quiz">Quizzes</option>
            <option value="midterm">Midterm Exams</option>
            <option value="final">Final Exams</option>
            <option value="speaking">Speaking Tests</option>
            <option value="homework">Homework</option>
          </select>
          <span className="text-xs text-[#53657a] px-2 whitespace-nowrap">
            {filteredGrades.length} grades
          </span>
        </div>
      </div>

      {/* Table */}
      {filteredGrades.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#dce4e7] rounded-xl">
          <Award className="mx-auto size-10 text-[#53657a]/50" />
          <p className="mt-2 text-sm font-semibold text-[#10253e]">No grading records found</p>
          <p className="text-xs text-[#53657a]">Click "Record Assessment" to grade a student quiz or exam.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Mobile View: High-Accessibility Cards (< md) */}
          <div className="block md:hidden space-y-3">
            {filteredGrades.map((g) => {
              const percentage = Math.round((g.score / g.maxScore) * 100);
              return (
                <div
                  key={`grade-card-${g.id}`}
                  className="bg-white rounded-xl border border-[#dce4e7] p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-base text-[#10253e]">{g.studentName}</h4>
                      <p className="text-xs text-[#53657a]">{g.courseTitle}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePublish(g.id)}
                      className={`text-[11px] px-3 py-1 rounded-full font-semibold border min-h-[36px] transition-colors shrink-0 ${
                        g.isPublished
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      {g.isPublished ? "Published" : "Draft"}
                    </button>
                  </div>

                  <div className="text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#10253e]">{g.assessmentTitle}</span>
                      <span className="px-2 py-0.5 rounded bg-[#f0f4f8] text-[#173fad] text-[10px] font-semibold uppercase">
                        {g.category}
                      </span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-[#10253e]">
                          {g.score} <span className="text-[#53657a] font-normal text-[11px]">/ {g.maxScore}</span>
                        </span>
                        <span
                          className={`font-semibold text-xs ${
                            percentage >= 85
                              ? "text-emerald-600"
                              : percentage >= 70
                              ? "text-blue-600"
                              : "text-amber-600"
                          }`}
                        >
                          {percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-[#eef2f6] rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            percentage >= 85
                              ? "bg-emerald-500"
                              : percentage >= 70
                              ? "bg-blue-500"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {g.feedback && (
                      <p className="text-xs text-[#53657a] italic bg-[#f8fafc] p-2 rounded border border-[#edf2f5] mt-2">
                        "{g.feedback}"
                      </p>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-2 border-t border-[#edf2f5] flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(g)}
                      className="flex-1 min-h-[44px] text-xs font-semibold text-[#173fad] border-[#c0d4ff] hover:bg-[#e8eeff] gap-1.5"
                    >
                      <Edit2 size={14} /> Edit Assessment
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTargetId(g.id)}
                      className="min-h-[44px] min-w-[44px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0"
                      aria-label="Delete grade record"
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
                    <th className="p-3.5">Assessment & Category</th>
                    <th className="p-3.5">Score / Max</th>
                    <th className="p-3.5">Teacher Feedback</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2f5]">
                  {filteredGrades.map((g) => {
                    const percentage = Math.round((g.score / g.maxScore) * 100);
                    return (
                      <tr key={g.id} className="hover:bg-[#fbfcfe] transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-sm text-[#10253e]">{g.studentName}</div>
                          <div className="text-[#53657a] text-[11px]">{g.courseTitle}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-[#10253e]">{g.assessmentTitle}</div>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-[#f0f4f8] text-[#173fad] text-[10px] font-semibold uppercase">
                            {g.category}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-sm text-[#10253e]">
                            {g.score} <span className="text-[#53657a] font-normal text-xs">/ {g.maxScore}</span>
                          </div>
                          <span
                            className={`text-[10px] font-semibold ${
                              percentage >= 85
                                ? "text-emerald-600"
                                : percentage >= 70
                                ? "text-blue-600"
                                : "text-amber-600"
                            }`}
                          >
                            {percentage}% Grade
                          </span>
                        </td>
                        <td className="p-3.5 text-[#53657a] max-w-xs">
                          <p className="line-clamp-2 text-xs text-[#314155]">{g.feedback || "No feedback."}</p>
                        </td>
                        <td className="p-3.5">
                          <button
                            type="button"
                            onClick={() => togglePublish(g.id)}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border transition-colors ${
                              g.isPublished
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                            }`}
                          >
                            {g.isPublished ? "Published" : "Draft"}
                          </button>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(g)}
                              className="h-8 w-8 p-0 text-[#173fad] hover:bg-[#e8eeff]"
                            >
                              <Edit2 size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTargetId(g.id)}
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
              {isEditing ? "Edit Assessment Score" : "Record Assessment Score"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#53657a]">
              Enter student test marks, category, and teacher feedback notes.
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Assessment Title *</Label>
                <Input
                  required
                  value={formState.assessmentTitle}
                  onChange={(e) => setFormState((p) => ({ ...p, assessmentTitle: e.target.value }))}
                  placeholder="e.g. Unit 4 Quiz"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Assessment Type</Label>
                <select
                  value={formState.category}
                  onChange={(e) => setFormState((p) => ({ ...p, category: e.target.value as any }))}
                  aria-label="Assessment type"
                  className="w-full h-9 px-3 text-sm rounded-lg border border-[#dce4e7] bg-white text-[#10253e]"
                >
                  <option value="quiz">Quiz</option>
                  <option value="midterm">Midterm Exam</option>
                  <option value="final">Final Exam</option>
                  <option value="speaking">Speaking Test</option>
                  <option value="homework">Homework</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Score Achieved *</Label>
                <Input
                  required
                  type="number"
                  step="0.5"
                  value={formState.score}
                  onChange={(e) => setFormState((p) => ({ ...p, score: Number(e.target.value) }))}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Maximum Score *</Label>
                <Input
                  required
                  type="number"
                  step="0.5"
                  value={formState.maxScore}
                  onChange={(e) => setFormState((p) => ({ ...p, maxScore: Number(e.target.value) }))}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Teacher Pedagogical Feedback</Label>
              <Textarea
                rows={3}
                value={formState.feedback}
                onChange={(e) => setFormState((p) => ({ ...p, feedback: e.target.value }))}
                placeholder="Specific guidance for the student on strengths and areas for improvement..."
                className="text-sm"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-[#173fad] hover:bg-[#12328b] text-white">
                {isEditing ? "Save Changes" : "Save Grade"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#10253e]">
              Delete Assessment Grade?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#53657a]">
              Are you sure you want to remove this grade entry?
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
