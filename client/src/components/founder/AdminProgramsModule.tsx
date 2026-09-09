import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
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
import { Switch } from "@/components/ui/switch";
import {
  BookOpen,
  Calendar,
  Check,
  CircleDollarSign,
  Edit2,
  GraduationCap,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface ProgramFormState {
  id?: number;
  slug: string;
  title: string;
  language: string;
  category: string;
  ageGroup: string;
  level: string;
  duration: string;
  schedule: string;
  fees: string;
  description: string;
  isActive: boolean;
}

const emptyForm: ProgramFormState = {
  slug: "",
  title: "",
  language: "English",
  category: "English",
  ageGroup: "Teens & adults",
  level: "Beginner to advanced",
  duration: "12 Weeks (36 Hours)",
  schedule: "Monday & Wednesday: 7:00 PM - 8:30 PM",
  fees: "RM 1,200 per term",
  description: "Comprehensive language learning program focusing on practical communication, grammar, and fluency.",
  isActive: true,
};

export function AdminProgramsModule() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [formState, setFormState] = useState<ProgramFormState>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);

  const utils = trpc.useUtils();
  const programsQuery = trpc.content.listPrograms.useQuery();

  const createMutation = trpc.content.createProgram.useMutation({
    onSuccess: () => {
      utils.content.listPrograms.invalidate();
      utils.content.publicPrograms.invalidate();
      toast.success("Programme created successfully.");
      setIsModalOpen(false);
      setFormState(emptyForm);
    },
    onError: (err) => toast.error(err.message || "Failed to create programme."),
  });

  const updateMutation = trpc.content.updateProgram.useMutation({
    onSuccess: () => {
      utils.content.listPrograms.invalidate();
      utils.content.publicPrograms.invalidate();
      toast.success("Programme updated successfully.");
      setIsModalOpen(false);
      setFormState(emptyForm);
    },
    onError: (err) => toast.error(err.message || "Failed to update programme."),
  });

  const deleteMutation = trpc.content.deleteProgram.useMutation({
    onSuccess: () => {
      utils.content.listPrograms.invalidate();
      utils.content.publicPrograms.invalidate();
      toast.success("Programme removed successfully.");
      setDeleteTargetId(null);
    },
    onError: (err) => toast.error(err.message || "Failed to delete programme."),
  });

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormState(emptyForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prog: any) => {
    setIsEditing(true);
    setFormState({
      id: prog.id,
      slug: prog.slug,
      title: prog.title,
      language: prog.language,
      category: prog.category,
      ageGroup: prog.ageGroup,
      level: prog.level,
      duration: prog.duration,
      schedule: prog.schedule,
      fees: prog.fees,
      description: prog.description,
      isActive: Boolean(prog.isActive),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim()) {
      toast.error("Programme title is required.");
      return;
    }
    const slug = formState.slug.trim() || formState.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const payload = {
      slug,
      title: formState.title.trim(),
      language: formState.language.trim(),
      category: formState.category.trim(),
      ageGroup: formState.ageGroup.trim(),
      level: formState.level.trim(),
      duration: formState.duration.trim(),
      schedule: formState.schedule.trim(),
      fees: formState.fees.trim(),
      description: formState.description.trim(),
      isActive: formState.isActive,
      seatsEnrolled: 0,
    };

    if (isEditing && formState.id) {
      updateMutation.mutate({ id: formState.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredPrograms = React.useMemo(() => {
    const list = programsQuery.data || [];
    return list.filter((item) => {
      const matchSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLang = selectedLanguage === "all" || item.language.toLowerCase() === selectedLanguage.toLowerCase();
      return matchSearch && matchLang;
    });
  }, [programsQuery.data, searchQuery, selectedLanguage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#f4eddd] text-[#705a30] border border-[#e4d3b1]">
              <BookOpen size={13} />
              Admin Module
            </span>
            <span className="text-xs text-[#53657a]">CRUD: Courses & Catalog</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#10253e] mt-1">Language Programmes & Courses</h2>
          <p className="text-sm text-[#53657a]">
            Manage institutional curriculum, tuition fees, schedules, age groups, and course descriptions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => programsQuery.refetch()}
            disabled={programsQuery.isFetching}
            className="h-9 gap-1.5"
          >
            <RefreshCw size={14} className={programsQuery.isFetching ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-9 gap-1.5 bg-[#173fad] hover:bg-[#12328b] text-white"
          >
            <Plus size={15} />
            Create Programme
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-[#dce4e7] shadow-sm">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#53657a]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search programs by name, category, or language..."
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            aria-label="Filter courses by language"
            className="h-9 px-3 text-xs font-medium rounded-lg border border-[#dce4e7] bg-[#f8fafc] text-[#10253e] focus:outline-none focus:ring-2 focus:ring-[#173fad]"
          >
            <option value="all">All Languages</option>
            <option value="english">English</option>
            <option value="bahasa melayu">Bahasa Melayu</option>
            <option value="mandarin">Mandarin</option>
            <option value="arabic">Arabic</option>
            <option value="japanese">Japanese</option>
            <option value="korean">Korean</option>
          </select>
          <span className="text-xs text-[#53657a] px-2 whitespace-nowrap">
            {filteredPrograms.length} items
          </span>
        </div>
      </div>

      {/* Programs Cards Grid */}
      {programsQuery.isLoading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="animate-spin text-[#173fad] size-6" />
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#dce4e7] rounded-xl">
          <BookOpen className="mx-auto size-10 text-[#53657a]/50" />
          <p className="mt-2 text-sm font-semibold text-[#10253e]">No programmes found</p>
          <p className="text-xs text-[#53657a]">Click "Create Programme" to add a new course.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrograms.map((prog) => (
            <Card
              key={prog.id}
              className="border-[#dce4e7] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="p-4 border-b border-[#edf2f5] flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#173fad]">
                        {prog.language}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0f4f8] text-[#53657a] font-medium">
                        {prog.category}
                      </span>
                      {prog.isActive ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-semibold">
                          Draft
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-[#10253e] mt-1 leading-snug">{prog.title}</h3>
                  </div>
                </div>

                <CardContent className="p-4 space-y-2.5 text-xs text-[#53657a]">
                  <p className="line-clamp-2 text-[#314155]">{prog.description}</p>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#edf2f5]">
                    <div>
                      <span className="font-semibold text-[#10253e] block">Level:</span>
                      <span className="truncate block">{prog.level}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#10253e] block">Duration:</span>
                      <span className="truncate block">{prog.duration}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-semibold text-[#10253e] block">Fees:</span>
                      <span className="text-[#173fad] font-semibold">{prog.fees}</span>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-3 bg-[#f8fafc] border-t border-[#edf2f5] flex items-center justify-end gap-1.5 rounded-b-xl">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(prog)}
                  className="h-8 text-xs gap-1"
                >
                  <Edit2 size={12} />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteTargetId(prog.id)}
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

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#10253e]">
              {isEditing ? "Edit Language Programme" : "Create New Language Programme"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#53657a]">
              Configure course details, levels, schedules, fees, and publishing status.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Programme Title *</Label>
                <Input
                  required
                  value={formState.title}
                  onChange={(e) => setFormState((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Intensive Academic English"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">URL Slug</Label>
                <Input
                  value={formState.slug}
                  onChange={(e) => setFormState((p) => ({ ...p, slug: e.target.value }))}
                  placeholder="e.g. intensive-academic-english"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Language</Label>
                <Input
                  value={formState.language}
                  onChange={(e) => setFormState((p) => ({ ...p, language: e.target.value }))}
                  placeholder="e.g. English"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Category</Label>
                <Input
                  value={formState.category}
                  onChange={(e) => setFormState((p) => ({ ...p, category: e.target.value }))}
                  placeholder="e.g. Professional / Kids"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Age Group</Label>
                <Input
                  value={formState.ageGroup}
                  onChange={(e) => setFormState((p) => ({ ...p, ageGroup: e.target.value }))}
                  placeholder="e.g. Teens & Adults"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Proficiency Level</Label>
                <Input
                  value={formState.level}
                  onChange={(e) => setFormState((p) => ({ ...p, level: e.target.value }))}
                  placeholder="e.g. Beginner to Advanced"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Duration</Label>
                <Input
                  value={formState.duration}
                  onChange={(e) => setFormState((p) => ({ ...p, duration: e.target.value }))}
                  placeholder="e.g. 12 Weeks (36h)"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tuition Fees</Label>
                <Input
                  value={formState.fees}
                  onChange={(e) => setFormState((p) => ({ ...p, fees: e.target.value }))}
                  placeholder="e.g. RM 1,200 per term"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Class Schedule</Label>
              <Input
                value={formState.schedule}
                onChange={(e) => setFormState((p) => ({ ...p, schedule: e.target.value }))}
                placeholder="e.g. Tuesdays & Thursdays: 6:00 PM - 8:00 PM"
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Course Description</Label>
              <Textarea
                rows={3}
                value={formState.description}
                onChange={(e) => setFormState((p) => ({ ...p, description: e.target.value }))}
                placeholder="Detailed curriculum overview, focus areas, and learning outcomes..."
                className="text-sm"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8fafc] border border-[#dce4e7]">
              <div>
                <p className="text-xs font-semibold text-[#10253e]">Public Visibility</p>
                <p className="text-[11px] text-[#53657a]">Enable to publish this programme on the public website catalog.</p>
              </div>
              <Switch
                checked={formState.isActive}
                onCheckedChange={(checked) => setFormState((p) => ({ ...p, isActive: checked }))}
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-[#173fad] hover:bg-[#12328b] text-white"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : isEditing
                  ? "Save Changes"
                  : "Create Programme"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#10253e]">
              Delete Language Programme?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#53657a]">
              Are you sure you want to permanently delete this course programme? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTargetId && deleteMutation.mutate({ id: deleteTargetId })}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
            >
              {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
