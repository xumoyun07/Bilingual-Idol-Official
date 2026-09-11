import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
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
import { FounderModuleHeader } from "./FounderModuleHeader";

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
  const { td } = useLanguage();
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
      toast.error(td("Campaign name and promo code are required."));
      return;
    }

    if (isEditing && editId !== null) {
      const updated = campaigns.map((c) => (c.id === editId ? { ...formState, id: editId } : c));
      saveCampaigns(updated);
      toast.success(td("Campaign updated successfully."));
    } else {
      const newCamp: CampaignItem = {
        ...formState,
        id: Date.now(),
      };
      saveCampaigns([newCamp, ...campaigns]);
      toast.success(td("Promotional campaign created."));
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    const updated = campaigns.filter((c) => c.id !== deleteTargetId);
    saveCampaigns(updated);
    toast.success(td("Campaign deleted."));
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
      <FounderModuleHeader
        badgeIcon={Tag}
        badgeLabel="Marketing Module"
        badgeTone="bg-[#fff0ed] text-[#a34732] border-[#ffd1c7]"
        subtitle="Campaigns & Promos"
        title="Marketing Campaigns & Promos"
        description="Manage seasonal discount codes, campaign budgets, audience targets, and run durations."
        decorativeIcon={Megaphone}
        statusText="Promotions Active"
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="compass-btn-primary h-10 px-4 gap-1.5 shadow-xs w-full sm:w-auto"
            >
              <Plus size={15} />
              {td("Create Campaign")}
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
            placeholder={td("Search campaigns by name, promo code, or target audience...")}
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
            <option value="all">{td("All Statuses")}</option>
            <option value="active">{td("Active")}</option>
            <option value="scheduled">{td("Scheduled")}</option>
            <option value="expired">{td("Expired")}</option>
          </select>
          <span className="text-xs text-[#53657a] px-2 whitespace-nowrap">
            {filteredCampaigns.length} {td("campaigns")}
          </span>
        </div>
      </div>

      {/* Cards */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#dce4e7] rounded-xl">
          <Tag className="mx-auto size-10 text-[#53657a]/50" />
          <p className="mt-2 text-sm font-semibold text-[#10253e]">{td("No campaigns found")}</p>
          <p className="text-xs text-[#53657a]">{td("Click \"Create Campaign\" to launch a promotional code.")}</p>
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
                      {td(camp.status)}
                    </span>
                    <span className="text-xs font-bold text-[#173fad] bg-[#e8eeff] px-2 py-0.5 rounded">
                      {camp.discountValue}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-[#10253e] mt-2">{camp.name}</h3>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-xs text-[#53657a]">{td("Code")}:</span>
                    <code className="text-xs font-mono font-bold bg-[#f1f5f9] px-2 py-0.5 rounded text-[#10253e] border border-[#e2e8f0]">
                      {camp.promoCode}
                    </code>
                  </div>
                </div>

                <CardContent className="p-4 space-y-2 text-xs text-[#53657a]">
                  <div>
                    <span className="text-[#10253e] font-semibold block">{td("Target Audience")}:</span>
                    <span className="text-[#314155]">{camp.targetAudience}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[#10253e] font-semibold block">{td("Duration")}:</span>
                      <span>
                        {camp.startDate} {td("to")} {camp.endDate}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#10253e] font-semibold block">{td("Allocated Budget")}:</span>
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

              <div className="p-3 bg-[#f8fafc] border-t border-[#edf2f5] flex items-center justify-end gap-2 rounded-b-xl">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(camp)}
                  className="min-h-[44px] sm:min-h-[32px] sm:h-8 text-xs gap-1 flex-1 sm:flex-initial"
                >
                  <Edit2 size={13} />
                  {td("Edit")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteTargetId(camp.id)}
                  className="min-h-[44px] sm:min-h-[32px] sm:h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1 flex-1 sm:flex-initial"
                >
                  <Trash2 size={13} />
                  {td("Delete")}
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
              {isEditing ? td("Edit Promotion Campaign") : td("Create Promotion Campaign")}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#53657a]">
              {td("Configure discount coupons, audience segments, and budget.")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{td("Campaign Name")} *</Label>
              <Input
                required
                value={formState.name}
                onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. September Back-to-School Special"
                className="h-10 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{td("Promo Code")} *</Label>
                <Input
                  required
                  value={formState.promoCode}
                  onChange={(e) => setFormState((p) => ({ ...p, promoCode: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SEP2026"
                  className="h-10 text-sm font-mono uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{td("Discount Value")}</Label>
                <Input
                  value={formState.discountValue}
                  onChange={(e) => setFormState((p) => ({ ...p, discountValue: e.target.value }))}
                  placeholder="e.g. 15% OFF or RM 150 OFF"
                  className="h-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{td("Target Audience")}</Label>
              <Input
                value={formState.targetAudience}
                onChange={(e) => setFormState((p) => ({ ...p, targetAudience: e.target.value }))}
                placeholder="e.g. New Adult English Learners"
                className="h-10 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{td("Start Date")}</Label>
                <Input
                  type="date"
                  value={formState.startDate}
                  onChange={(e) => setFormState((p) => ({ ...p, startDate: e.target.value }))}
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{td("End Date")}</Label>
                <Input
                  type="date"
                  value={formState.endDate}
                  onChange={(e) => setFormState((p) => ({ ...p, endDate: e.target.value }))}
                  className="h-10 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{td("Status")}</Label>
                <select
                  value={formState.status}
                  onChange={(e) => setFormState((p) => ({ ...p, status: e.target.value as any }))}
                  aria-label="Campaign status"
                  className="w-full h-10 px-3 text-sm rounded-lg border border-[#dce4e7] bg-white text-[#10253e]"
                >
                  <option value="active">{td("Active")}</option>
                  <option value="scheduled">{td("Scheduled")}</option>
                  <option value="expired">{td("Expired")}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{td("Marketing Budget")}</Label>
                <Input
                  value={formState.budget}
                  onChange={(e) => setFormState((p) => ({ ...p, budget: e.target.value }))}
                  placeholder="e.g. RM 2,000"
                  className="h-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{td("Campaign Notes")}</Label>
              <Textarea
                rows={2}
                value={formState.notes}
                onChange={(e) => setFormState((p) => ({ ...p, notes: e.target.value }))}
                placeholder={td("Channel strategy, UTM tags, or campaign goals...")}
                className="text-sm"
              />
            </div>

            <DialogFooter className="pt-3 flex flex-col-reverse sm:flex-row gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
              >
                {td("Cancel")}
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] bg-[#173fad] hover:bg-[#12328b] text-white"
              >
                {isEditing ? td("Save Changes") : td("Launch Campaign")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#10253e]">{td("Delete Campaign Promo?")}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#53657a]">
              {td("Are you sure you want to delete this marketing promo code?")}
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
