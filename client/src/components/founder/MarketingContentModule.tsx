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
import { Switch } from "@/components/ui/switch";
import {
  Edit2,
  Globe,
  Layers,
  Layout,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface ContentBlock {
  id: number;
  blockKey: string;
  title: string;
  category: string;
  content: string;
  ctaText?: string;
  ctaLink?: string;
  isActive: boolean;
  updatedAt: string;
}

const initialBlocks: ContentBlock[] = [
  {
    id: 1,
    blockKey: "hero_headline_primary",
    title: "Homepage Hero Main Value Proposition",
    category: "Homepage Hero",
    content: "Empowering global voices through bilingual mastery, certified Cambridge curriculum, and cultural fluency.",
    ctaText: "Explore 2026 Intakes",
    ctaLink: "/courses",
    isActive: true,
    updatedAt: "2026-09-08",
  },
  {
    id: 2,
    blockKey: "banner_term2_alert",
    title: "Term 2 Admissions Alert Banner",
    category: "Top Notification Bar",
    content: "🔥 2026 Term 2 Admissions now open! Early bird 15% tuition waiver available for registrations before Sept 30.",
    ctaText: "Apply Now",
    ctaLink: "/admissions",
    isActive: true,
    updatedAt: "2026-09-07",
  },
  {
    id: 3,
    blockKey: "placement_test_teaser",
    title: "Free Level Assessment Widget Teaser",
    category: "Assessment Promo",
    content: "Take our 10-minute online CEFR diagnostic test and get placed in the right proficiency tier immediately.",
    ctaText: "Take Free Test",
    ctaLink: "/placement-test",
    isActive: true,
    updatedAt: "2026-09-05",
  },
  {
    id: 4,
    blockKey: "footer_accreditation_statement",
    title: "Institutional Accreditation Statement",
    category: "Footer Legal & Trust",
    content: "Bilingual Idol Language Centre (BILC) is licensed by the Ministry of Education Malaysia as an accredited private educational institution.",
    isActive: true,
    updatedAt: "2026-09-01",
  },
];

const emptyBlock: Omit<ContentBlock, "id" | "updatedAt"> = {
  blockKey: "",
  title: "",
  category: "Homepage",
  content: "",
  ctaText: "",
  ctaLink: "",
  isActive: true,
};

export function MarketingContentModule() {
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => {
    const saved = localStorage.getItem("bilc_marketing_content_blocks");
    return saved ? JSON.parse(saved) : initialBlocks;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [formState, setFormState] = useState<Omit<ContentBlock, "id" | "updatedAt">>(emptyBlock);

  const saveBlocks = (newBlocks: ContentBlock[]) => {
    setBlocks(newBlocks);
    localStorage.setItem("bilc_marketing_content_blocks", JSON.stringify(newBlocks));
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditId(null);
    setFormState(emptyBlock);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: ContentBlock) => {
    setIsEditing(true);
    setEditId(b.id);
    setFormState({
      blockKey: b.blockKey,
      title: b.title,
      category: b.category,
      content: b.content,
      ctaText: b.ctaText,
      ctaLink: b.ctaLink,
      isActive: b.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim()) {
      toast.error("Block title is required.");
      return;
    }
    const blockKey = formState.blockKey.trim() || formState.title.toLowerCase().replace(/[^a-z0-9]+/g, "_");

    if (isEditing && editId !== null) {
      const updated = blocks.map((b) =>
        b.id === editId
          ? {
              ...formState,
              blockKey,
              id: editId,
              updatedAt: new Date().toISOString().slice(0, 10),
            }
          : b
      );
      saveBlocks(updated);
      toast.success("Content block updated.");
    } else {
      const newBlock: ContentBlock = {
        ...formState,
        blockKey,
        id: Date.now(),
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      saveBlocks([newBlock, ...blocks]);
      toast.success("New content block created.");
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    const updated = blocks.filter((b) => b.id !== deleteTargetId);
    saveBlocks(updated);
    toast.success("Content block removed.");
    setDeleteTargetId(null);
  };

  const toggleActive = (id: number) => {
    const updated = blocks.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b));
    saveBlocks(updated);
    toast.success("Content block status toggled.");
  };

  const filteredBlocks = React.useMemo(() => {
    return blocks.filter((b) => {
      return (
        !searchQuery.trim() ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.blockKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [blocks, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#fff0ed] text-[#a34732] border border-[#ffd1c7]">
              <Layers size={13} />
              Marketing Module
            </span>
            <span className="text-xs text-[#53657a]">CRUD: CMS Dynamic Content Blocks</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#10253e] mt-1">CMS Content Blocks</h2>
          <p className="text-sm text-[#53657a]">
            Manage promotional banners, homepage call-to-actions, trust badges, and public text copy.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-9 gap-1.5 bg-[#173fad] hover:bg-[#12328b] text-white"
          >
            <Plus size={15} />
            Add Content Block
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
            placeholder="Search content blocks by title, key, or copy..."
            className="pl-9 h-9 text-sm"
          />
        </div>
        <span className="text-xs text-[#53657a] px-2 whitespace-nowrap">{filteredBlocks.length} blocks</span>
      </div>

      {/* Grid */}
      {filteredBlocks.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#dce4e7] rounded-xl">
          <Layers className="mx-auto size-10 text-[#53657a]/50" />
          <p className="mt-2 text-sm font-semibold text-[#10253e]">No content blocks found</p>
          <p className="text-xs text-[#53657a]">Click "Add Content Block" to create a new editable message.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBlocks.map((b) => (
            <Card key={b.id} className="border-[#dce4e7] shadow-sm flex flex-col justify-between">
              <div>
                <div className="p-4 border-b border-[#edf2f5]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#f0f4f8] text-[#53657a]">
                      {b.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleActive(b.id)}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        b.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {b.isActive ? "Active on Site" : "Hidden"}
                    </button>
                  </div>
                  <h3 className="font-bold text-base text-[#10253e] mt-2">{b.title}</h3>
                  <code className="text-[11px] font-mono text-[#173fad] mt-1 block">Key: #{b.blockKey}</code>
                </div>

                <CardContent className="p-4 space-y-2 text-xs text-[#53657a]">
                  <p className="text-[#314155] leading-relaxed bg-[#f8fafc] p-2.5 rounded-lg border border-[#edf2f5]">
                    {b.content}
                  </p>
                  {b.ctaText ? (
                    <div className="flex items-center gap-2 pt-1 text-[11px]">
                      <span className="font-semibold text-[#10253e]">CTA Button:</span>
                      <span className="bg-[#e8eeff] text-[#173fad] px-2 py-0.5 rounded font-medium">
                        {b.ctaText} ({b.ctaLink})
                      </span>
                    </div>
                  ) : null}
                </CardContent>
              </div>

              <div className="p-3 bg-[#f8fafc] border-t border-[#edf2f5] flex items-center justify-between rounded-b-xl">
                <span className="text-[10px] text-[#8292a1]">Updated {b.updatedAt}</span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(b)}
                    className="h-8 text-xs gap-1"
                  >
                    <Edit2 size={12} />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteTargetId(b.id)}
                    className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1"
                  >
                    <Trash2 size={12} />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#10253e]">
              {isEditing ? "Edit Content Block" : "Add New Content Block"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#53657a]">
              Manage public copy, alert texts, and CTA links.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Block Title *</Label>
                <Input
                  required
                  value={formState.title}
                  onChange={(e) => setFormState((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Hero Headline"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Slot Key Identifier</Label>
                <Input
                  value={formState.blockKey}
                  onChange={(e) => setFormState((p) => ({ ...p, blockKey: e.target.value }))}
                  placeholder="e.g. hero_headline_primary"
                  className="h-9 text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Category / Placement</Label>
              <Input
                value={formState.category}
                onChange={(e) => setFormState((p) => ({ ...p, category: e.target.value }))}
                placeholder="e.g. Homepage Hero / Top Notification Bar"
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Content Text / Copy *</Label>
              <Textarea
                required
                rows={4}
                value={formState.content}
                onChange={(e) => setFormState((p) => ({ ...p, content: e.target.value }))}
                placeholder="Write the promotional text or announcement..."
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">CTA Button Text (Optional)</Label>
                <Input
                  value={formState.ctaText || ""}
                  onChange={(e) => setFormState((p) => ({ ...p, ctaText: e.target.value }))}
                  placeholder="e.g. Apply Now"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">CTA Target URL</Label>
                <Input
                  value={formState.ctaLink || ""}
                  onChange={(e) => setFormState((p) => ({ ...p, ctaLink: e.target.value }))}
                  placeholder="e.g. /admissions"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8fafc] border border-[#dce4e7]">
              <div>
                <p className="text-xs font-semibold text-[#10253e]">Publish On Website</p>
                <p className="text-[11px] text-[#53657a]">Enable to make this block live immediately.</p>
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
              <Button type="submit" size="sm" className="bg-[#173fad] hover:bg-[#12328b] text-white">
                {isEditing ? "Save Changes" : "Create Block"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#10253e]">Delete Content Block?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#53657a]">
              Are you sure you want to remove this CMS content block?
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
