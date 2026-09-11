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
  CheckCircle2,
  Edit2,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface TestimonialFormState {
  id?: number;
  authorName: string;
  relation: string;
  quote: string;
  rating: number;
  approved: boolean;
  consentConfirmed: boolean;
}

const emptyTestimonial: TestimonialFormState = {
  authorName: "",
  relation: "Parent of Young Explorer Student",
  quote: "",
  rating: 5,
  approved: true,
  consentConfirmed: true,
};

export function MarketingTestimonialsModule() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<TestimonialFormState>(emptyTestimonial);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const testimonialsQuery = trpc.content.listTestimonials.useQuery();

  const createMutation = trpc.content.createTestimonial.useMutation({
    onSuccess: () => {
      utils.content.listTestimonials.invalidate();
      utils.content.publicTestimonials.invalidate();
      toast.success("Testimonial created successfully.");
      setIsModalOpen(false);
      setFormState(emptyTestimonial);
    },
    onError: (err) => toast.error(err.message || "Failed to create testimonial."),
  });

  const updateMutation = trpc.content.updateTestimonial.useMutation({
    onSuccess: () => {
      utils.content.listTestimonials.invalidate();
      utils.content.publicTestimonials.invalidate();
      toast.success("Testimonial updated successfully.");
      setIsModalOpen(false);
      setFormState(emptyTestimonial);
    },
    onError: (err) => toast.error(err.message || "Failed to update testimonial."),
  });

  const deleteMutation = trpc.content.deleteTestimonial.useMutation({
    onSuccess: () => {
      utils.content.listTestimonials.invalidate();
      utils.content.publicTestimonials.invalidate();
      toast.success("Testimonial removed.");
      setDeleteTargetId(null);
    },
    onError: (err) => toast.error(err.message || "Failed to delete testimonial."),
  });

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormState(emptyTestimonial);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: any) => {
    setIsEditing(true);
    setFormState({
      id: t.id,
      authorName: t.authorName,
      relation: t.relation,
      quote: t.quote,
      rating: t.rating,
      approved: Boolean(t.approved),
      consentConfirmed: Boolean(t.consentConfirmed),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.authorName.trim() || !formState.quote.trim()) {
      toast.error("Author name and quote are required.");
      return;
    }

    const payload = {
      authorName: formState.authorName.trim(),
      relation: formState.relation.trim(),
      quote: formState.quote.trim(),
      rating: formState.rating,
      approved: formState.approved,
      consentConfirmed: formState.consentConfirmed,
    };

    if (isEditing && formState.id) {
      updateMutation.mutate({ id: formState.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleApproval = (t: any) => {
    updateMutation.mutate({
      id: t.id,
      data: {
        authorName: t.authorName,
        relation: t.relation,
        quote: t.quote,
        rating: t.rating,
        approved: !t.approved,
        consentConfirmed: Boolean(t.consentConfirmed),
      },
    });
  };

  const filteredTestimonials = React.useMemo(() => {
    const list = testimonialsQuery.data || [];
    return list.filter((t) => {
      return (
        !searchQuery.trim() ||
        t.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.relation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.quote.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [testimonialsQuery.data, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#fff0ed] text-[#a34732] border border-[#ffd1c7]">
              <MessageSquare size={13} />
              Marketing Module
            </span>
            <span className="text-xs text-[#53657a]">CRUD: Verified Student & Parent Reviews</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#10253e] mt-1">Testimonials & Reviews</h2>
          <p className="text-sm text-[#53657a]">
            Manage verified student feedback, star ratings, parent testimonials, and public approvals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => testimonialsQuery.refetch()}
            disabled={testimonialsQuery.isFetching}
            className="h-9 gap-1.5"
          >
            <RefreshCw size={14} className={testimonialsQuery.isFetching ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-9 gap-1.5 bg-[#173fad] hover:bg-[#12328b] text-white"
          >
            <Plus size={15} />
            Add Testimonial
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-[#dce4e7] shadow-sm">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#53657a]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search testimonials by author name, relation, or quote..."
            className="pl-9 h-9 text-sm"
          />
        </div>
        <span className="text-xs text-[#53657a] px-2 whitespace-nowrap">
          {filteredTestimonials.length} reviews
        </span>
      </div>

      {/* Grid */}
      {testimonialsQuery.isLoading ? (
        <div className="text-center py-16">
          <RefreshCw className="animate-spin text-[#173fad] size-6 mx-auto" />
        </div>
      ) : filteredTestimonials.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#dce4e7] rounded-xl">
          <MessageSquare className="mx-auto size-10 text-[#53657a]/50" />
          <p className="mt-2 text-sm font-semibold text-[#10253e]">No reviews found</p>
          <p className="text-xs text-[#53657a]">Click "Add Testimonial" to create a new student feedback quote.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTestimonials.map((t) => (
            <Card key={t.id} className="border-[#dce4e7] shadow-sm flex flex-col justify-between">
              <div>
                <div className="p-4 border-b border-[#edf2f5]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} size={14} className="fill-amber-400" />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleApproval(t)}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        t.approved
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {t.approved ? "Approved" : "Pending Review"}
                    </button>
                  </div>
                  <h3 className="font-bold text-base text-[#10253e] mt-2">{t.authorName}</h3>
                  <p className="text-xs text-[#53657a]">{t.relation}</p>
                </div>

                <CardContent className="p-4 text-xs text-[#314155] italic">
                  "{t.quote}"
                </CardContent>
              </div>

              <div className="p-3 bg-[#f8fafc] border-t border-[#edf2f5] flex items-center justify-end gap-2 rounded-b-xl">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(t)}
                  className="min-h-[44px] sm:min-h-[32px] sm:h-8 text-xs gap-1 flex-1 sm:flex-initial"
                >
                  <Edit2 size={13} />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteTargetId(t.id)}
                  className="min-h-[44px] sm:min-h-[32px] sm:h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1 flex-1 sm:flex-initial"
                >
                  <Trash2 size={13} />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-full h-full max-h-screen max-w-none rounded-none sm:rounded-2xl sm:max-h-[90vh] sm:max-w-lg overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-[#10253e]">
              {isEditing ? "Edit Testimonial" : "Add Student Testimonial"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#53657a]">
              Manage author credentials, star rating, and review quote.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Author Name *</Label>
                <Input
                  required
                  value={formState.authorName}
                  onChange={(e) => setFormState((p) => ({ ...p, authorName: e.target.value }))}
                  placeholder="e.g. Datin Faridah & Adam"
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Author Relation / Background</Label>
                <Input
                  value={formState.relation}
                  onChange={(e) => setFormState((p) => ({ ...p, relation: e.target.value }))}
                  placeholder="e.g. Parent of Cambridge Primary Student"
                  className="h-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Star Rating (1 - 5 Stars)</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormState((p) => ({ ...p, rating: star }))}
                    className="min-h-[42px] min-w-[42px] inline-flex items-center justify-center p-1 text-amber-500 hover:scale-110 transition-transform touch-manipulation"
                  >
                    <Star
                      size={22}
                      className={star <= formState.rating ? "fill-amber-400 text-amber-500" : "text-gray-300"}
                    />
                  </button>
                ))}
                <span className="text-xs font-semibold text-[#10253e] ml-2">{formState.rating} / 5 Stars</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Testimonial Quote *</Label>
              <Textarea
                required
                rows={4}
                value={formState.quote}
                onChange={(e) => setFormState((p) => ({ ...p, quote: e.target.value }))}
                placeholder="Share the student's learning experience, progress, and recommendations..."
                className="text-sm"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#f8fafc] border border-[#dce4e7]">
              <div>
                <p className="text-xs font-semibold text-[#10253e]">Approved For Public Display</p>
                <p className="text-[11px] text-[#53657a]">Publish this review directly to the public home page.</p>
              </div>
              <Switch
                checked={formState.approved}
                onCheckedChange={(checked) => setFormState((p) => ({ ...p, approved: checked }))}
              />
            </div>

            <DialogFooter className="pt-3 flex flex-col-reverse sm:flex-row gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] bg-[#173fad] hover:bg-[#12328b] text-white"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : isEditing
                  ? "Save Changes"
                  : "Create Testimonial"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#10253e]">Delete Review?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#53657a]">
              Are you sure you want to delete this verified testimonial?
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
