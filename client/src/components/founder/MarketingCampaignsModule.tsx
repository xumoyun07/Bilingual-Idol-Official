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
  Calendar,
  Edit2,
  Megaphone,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface CampaignItem {
  id: number;
  name: string;
  promoCode: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  targetAudience: string;
  startDate: string;
  endDate: string;
  status: "active" | "scheduled" | "expired";
  budget: string;
  notes: string;
}

const initialCampaigns: CampaignItem[] = [
  {
    id: 1,
    name: "Early Bird Term 2 Intake 2026",
    promoCode: "EARLY2026",
    discountType: "percentage",
    discountValue: "15% OFF",
    targetAudience: "New Adult Learners & General English",
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    status: "active",
    budget: "RM 2,500",
    notes: "Meta Ads & Google Search Ads campaign.",
  },
  {
    id: 2,
    name: "Sibling & Family Package Discount",
    promoCode: "FAMILYBILINGUAL",
    discountType: "percentage",
    discountValue: "20% OFF",
    targetAudience: "Kids & Young Explorers Families",
    startDate: "2026-08-15",
    endDate: "2026-12-31",
    status: "active",
    budget: "RM 1,200",
    notes: "Direct WhatsApp and campus front-desk promotion.",
  },
  {
    id: 3,
    name: "IELTS Intensive Masterclass Promo",
    promoCode: "IELTSFAST7",
    discountType: "fixed",
    discountValue: "RM 200 OFF",
    targetAudience: "University Applicants & Immigrants",
    startDate: "2026-10-01",
    endDate: "2026-11-15",
    status: "scheduled",
    budget: "RM 3,000",
    notes: "Targeting IELTS mock test takers.",
  },
];

const emptyCampaign: Omit<CampaignItem, "id"> = {
  name: "",
  promoCode: "",
  discountType: "percentage",
  discountValue: "10% OFF",
  targetAudience: "All Language Students",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  status: "active",
  budget: "RM 1,000",
  notes: "",
};

export function MarketingCampaignsModule() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(() => {
    const saved = localStorage.getItem("bilc_marketing_campaigns");
    return saved ? JSON.parse(saved) : initialCampaigns;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [formState, setFormState] = useState<Omit<CampaignItem, "id">>(emptyCampaign);

  const saveCampaigns = (newItems: CampaignItem[]) => {
    setCampaigns(newItems);
    localStorage.setItem("bilc_marketing_campaigns", JSON.stringify(newItems));
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditId(null);
    setFormState(emptyCampaign);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: CampaignItem) => {
    setIsEditing(true);
    setEditId(c.id);
    setFormState({
      name: c.name,
      promoCode: c.promoCode,
      discountType: c.discountType,
      discountValue: c.discountValue,
      targetAudience: c.targetAudience,
      startDate: c.startDate,
      endDate: c.endDate,
      status: c.status,
      budget: c.budget,
      notes: c.notes,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim() || !formState.promoCode.trim()) {
      toast.error("Campaign name and promo code are required.");
      return;
    }

    if (isEditing && editId !== null) {
      const updated = campaigns.map((c) => (c.id === editId ? { ...formState, id: editId } : c));
      saveCampaigns(updated);
      toast.success("Campaign updated successfully.");
    } else {
      const newCamp: CampaignItem = {
        ...formState,
        id: Date.now(),
      };
      saveCampaigns([newCamp, ...campaigns]);
      toast.success("Promotional campaign created.");
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    const updated = campaigns.filter((c) => c.id !== deleteTargetId);
    saveCampaigns(updated);
    toast.success("Campaign deleted.");
    setDeleteTargetId(null);
  };

  const filteredCampaigns = React.useMemo(() => {
    return campaigns.filter((c) => {
      const matchSearch =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.promoCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.targetAudience.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = selectedStatus === "all" || c.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [campaigns, searchQuery, selectedStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#fff0ed] text-[#a34732] border border-[#ffd1c7]">
              <Tag size={13} />
              Marketing Module
            </span>
            <span className="text-xs text-[#53657a]">CRUD: Campaigns & Discount Codes</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#10253e] mt-1">Marketing Campaigns & Promos</h2>
          <p className="text-sm text-[#53657a]">
            Manage seasonal discount codes, campaign budgets, audience targets, and run durations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-9 gap-1.5 bg-[#173fad] hover:bg-[#12328b] text-white"
          >
            <Plus size={15} />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-[#dce4e7] shadow-sm">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#53657a]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaigns by name, promo code, or target audience..."
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter campaigns by status"
            className="h-9 px-3 text-xs font-medium rounded-lg border border-[#dce4e7] bg-[#f8fafc] text-[#10253e] focus:outline-none focus:ring-2 focus:ring-[#173fad]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
          </select>
          <span className="text-xs text-[#53657a] px-2 whitespace-nowrap">
            {filteredCampaigns.length} campaigns
          </span>
        </div>
      </div>

      {/* Cards */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#dce4e7] rounded-xl">
          <Tag className="mx-auto size-10 text-[#53657a]/50" />
          <p className="mt-2 text-sm font-semibold text-[#10253e]">No campaigns found</p>
          <p className="text-xs text-[#53657a]">Click "Create Campaign" to launch a promotional code.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map((camp) => (
            <Card key={camp.id} className="border-[#dce4e7] shadow-sm flex flex-col justify-between">
              <div>
                <div className="p-4 border-b border-[#edf2f5]">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        camp.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : camp.status === "scheduled"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {camp.status}
                    </span>
                    <span className="text-xs font-bold text-[#173fad] bg-[#e8eeff] px-2 py-0.5 rounded">
                      {camp.discountValue}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-[#10253e] mt-2">{camp.name}</h3>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-xs text-[#53657a]">Code:</span>
                    <code className="text-xs font-mono font-bold bg-[#f1f5f9] px-2 py-0.5 rounded text-[#10253e] border border-[#e2e8f0]">
                      {camp.promoCode}
                    </code>
                  </div>
                </div>

                <CardContent className="p-4 space-y-2 text-xs text-[#53657a]">
                  <div>
                    <span className="text-[#10253e] font-semibold block">Target Audience:</span>
                    <span className="text-[#314155]">{camp.targetAudience}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[#10253e] font-semibold block">Duration:</span>
                      <span>
                        {camp.startDate} to {camp.endDate}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#10253e] font-semibold block">Allocated Budget:</span>
                      <span className="text-[#10253e] font-medium">{camp.budget}</span>
                    </div>
                  </div>
                  {camp.notes ? (
                    <p className="text-[11px] italic bg-[#f8fafc] p-1.5 rounded border border-[#edf2f5] mt-1">
                      {camp.notes}
                    </p>
                  ) : null}
                </CardContent>
              </div>

              <div className="p-3 bg-[#f8fafc] border-t border-[#edf2f5] flex items-center justify-end gap-1.5 rounded-b-xl">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(camp)}
                  className="h-8 text-xs gap-1"
                >
                  <Edit2 size={12} />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteTargetId(camp.id)}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#10253e]">
              {isEditing ? "Edit Promotion Campaign" : "Create Promotion Campaign"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#53657a]">
              Configure discount coupons, audience segments, and budget.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Campaign Name *</Label>
              <Input
                required
                value={formState.name}
                onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. September Back-to-School Special"
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Promo Code *</Label>
                <Input
                  required
                  value={formState.promoCode}
                  onChange={(e) => setFormState((p) => ({ ...p, promoCode: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SEP2026"
                  className="h-9 text-sm font-mono uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Discount Value</Label>
                <Input
                  value={formState.discountValue}
                  onChange={(e) => setFormState((p) => ({ ...p, discountValue: e.target.value }))}
                  placeholder="e.g. 15% OFF or RM 150 OFF"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Target Audience</Label>
              <Input
                value={formState.targetAudience}
                onChange={(e) => setFormState((p) => ({ ...p, targetAudience: e.target.value }))}
                placeholder="e.g. New Adult English Learners"
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Start Date</Label>
                <Input
                  type="date"
                  value={formState.startDate}
                  onChange={(e) => setFormState((p) => ({ ...p, startDate: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">End Date</Label>
                <Input
                  type="date"
                  value={formState.endDate}
                  onChange={(e) => setFormState((p) => ({ ...p, endDate: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Status</Label>
                <select
                  value={formState.status}
                  onChange={(e) => setFormState((p) => ({ ...p, status: e.target.value as any }))}
                  aria-label="Campaign status"
                  className="w-full h-9 px-3 text-sm rounded-lg border border-[#dce4e7] bg-white text-[#10253e]"
                >
                  <option value="active">Active</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Marketing Budget</Label>
                <Input
                  value={formState.budget}
                  onChange={(e) => setFormState((p) => ({ ...p, budget: e.target.value }))}
                  placeholder="e.g. RM 2,000"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Campaign Notes</Label>
              <Textarea
                rows={2}
                value={formState.notes}
                onChange={(e) => setFormState((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Channel strategy, UTM tags, or campaign goals..."
                className="text-sm"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-[#173fad] hover:bg-[#12328b] text-white">
                {isEditing ? "Save Changes" : "Launch Campaign"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#10253e]">Delete Campaign Promo?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#53657a]">
              Are you sure you want to delete this marketing promo code?
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
