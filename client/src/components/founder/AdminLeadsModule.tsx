import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
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
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileSpreadsheet,
  Filter,
  GraduationCap,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
  UserCheck,
  X,
  BookOpen,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { FounderModuleHeader } from "./FounderModuleHeader";
import { FilterDrawer } from "@/components/ui/FilterDrawer";

type SubmissionStatus = "new" | "contacted" | "interested" | "enrolled" | "closed";

const statusConfig: Record<SubmissionStatus, { label: string; tone: string }> = {
  new: { label: "New Lead", tone: "bg-blue-50 text-blue-700 border-blue-200" },
  contacted: { label: "Contacted", tone: "bg-amber-50 text-amber-700 border-amber-200" },
  interested: { label: "Interested", tone: "bg-purple-50 text-purple-700 border-purple-200" },
  enrolled: { label: "Enrolled", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed: { label: "Closed", tone: "bg-gray-100 text-gray-700 border-gray-200" },
};

export const LEAD_STATUS_OPTIONS = [
  { value: "all", label: "All Lead Statuses" },
  { value: "new", label: "New Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "enrolled", label: "Enrolled" },
  { value: "closed", label: "Closed" },
] as const;

export const LEAD_SOURCE_OPTIONS = [
  { value: "all", label: "All Sources" },
  { value: "Admin Manual Entry", label: "Admin Manual Entry" },
  { value: "website", label: "Website Form / Online" },
  { value: "whatsapp", label: "WhatsApp Consultation" },
  { value: "phone", label: "Phone Call Inquiry" },
  { value: "referral", label: "Referral / Word of Mouth" },
  { value: "social", label: "Social Media (Instagram/TikTok)" },
  { value: "event", label: "Event / Campus Tour" },
] as const;

export const LEAD_COURSE_OPTIONS = [
  { value: "all", label: "All Courses & Programs" },
  { value: "General English", label: "General English" },
  { value: "IELTS Preparation", label: "IELTS Preparation" },
  { value: "Summer Camp", label: "Summer Camp" },
  { value: "Private English Lessons", label: "Private English Lessons" },
  { value: "Executive English", label: "Executive English" },
  { value: "World Languages", label: "World Languages" },
] as const;

interface LeadFormState {
  type: "enrollment" | "inquiry";
  studentName: string;
  studentAge: number;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  programInterest: string;
  preferredSchedule: string;
  message?: string;
  source?: string;
}

const emptyLead: LeadFormState = {
  type: "enrollment",
  studentName: "",
  studentAge: 16,
  parentName: "",
  parentEmail: "",
  parentPhone: "",
  programInterest: "General English",
  preferredSchedule: "Weekday Evenings",
  message: "",
  source: "Admin Manual Entry",
};

export function AdminLeadsModule() {
  const { td, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [expandedLeadIds, setExpandedLeadIds] = useState<Set<number>>(new Set());

  const toggleExpand = (id: number) => {
    setExpandedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const [leadForm, setLeadForm] = useState<LeadFormState>(emptyLead);

  const utils = trpc.useUtils();
  const leadsQuery = trpc.submissions.list.useQuery();

  const createMutation = trpc.submissions.create.useMutation({
    onSuccess: () => {
      utils.submissions.list.invalidate();
      toast.success(td("Lead created successfully."));
      setIsModalOpen(false);
      setLeadForm(emptyLead);
    },
    onError: (err) => toast.error(err.message || td("Failed to create lead.")),
  });

  const updateStatusMutation = trpc.submissions.updateStatus.useMutation({
    onSuccess: () => {
      utils.submissions.list.invalidate();
      toast.success(td("Lead status updated."));
    },
    onError: (err) => toast.error(err.message || td("Failed to update lead status.")),
  });

  const deleteMutation = trpc.submissions.delete.useMutation({
    onSuccess: () => {
      utils.submissions.list.invalidate();
      toast.success(td("Lead removed successfully."));
      setDeleteTargetId(null);
    },
    onError: (err) => toast.error(err.message || td("Failed to delete lead.")),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.studentName.trim() || !leadForm.parentEmail.trim()) {
      toast.error(td("Student name and email are required."));
      return;
    }
    createMutation.mutate(leadForm);
  };

  const filteredLeads = useMemo(() => {
    const list = leadsQuery.data || [];
    return list.filter((lead) => {
      const matchSearch =
        !searchQuery.trim() ||
        lead.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.parentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.programInterest.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.source && lead.source.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = selectedStatus === "all" || lead.status === selectedStatus;

      const matchSource =
        selectedSource === "all" ||
        (lead.source && lead.source.toLowerCase().includes(selectedSource.toLowerCase()));

      const matchCourse =
        selectedCourse === "all" ||
        (lead.programInterest &&
          lead.programInterest.toLowerCase().includes(selectedCourse.toLowerCase()));

      return matchSearch && matchStatus && matchSource && matchCourse;
    });
  }, [leadsQuery.data, searchQuery, selectedStatus, selectedSource, selectedCourse]);

  const activeFiltersCount =
    (selectedStatus !== "all" ? 1 : 0) +
    (selectedSource !== "all" ? 1 : 0) +
    (selectedCourse !== "all" ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedStatus("all");
    setSelectedSource("all");
    setSelectedCourse("all");
    setSearchQuery("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <FounderModuleHeader
        badgeIcon={FileSpreadsheet}
        badgeLabel="Admin Module"
        badgeTone="bg-[#f4eddd] text-[#705a30] border-[#e4d3b1]"
        subtitle="Admissions Pipeline"
        title="Consultation & Enrolment Leads"
        description="Track incoming inquiries, course interests, and admissions pipeline records."
        decorativeIcon={FileSpreadsheet}
        statusText="Pipeline Active"
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => leadsQuery.refetch()}
              disabled={leadsQuery.isFetching}
              className="h-10 px-3.5 gap-1.5 border-[#dce4e7]"
            >
              <RefreshCw size={14} className={leadsQuery.isFetching ? "animate-spin" : ""} />
              {td("Refresh")}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setLeadForm(emptyLead);
                setIsModalOpen(true);
              }}
              className="compass-btn-primary h-10 px-4 gap-1.5 shadow-xs w-full sm:w-auto"
            >
              <Plus size={15} />
              {td("Add Lead")}
            </Button>
          </div>
        }
      />

      {/* Filter Bar with FilterDrawer */}
      <div className="space-y-2.5 bg-white p-3.5 sm:p-4 rounded-2xl border border-[#dce4e7] shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={15}
              className={`absolute top-1/2 -translate-y-1/2 text-[#53657a] ${isRTL ? "right-3.5" : "left-3.5"}`}
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={td("Search leads by student, parent, email, phone, course...")}
              className={`h-11 text-sm rounded-xl border-[#dce4e7] bg-[#fbfcfe] focus:bg-white transition-colors ${
                isRTL ? "pr-10 pl-3.5 text-right" : "pl-10 pr-3.5 text-left"
              }`}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Status select for Desktop only */}
            <div className="hidden md:block">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                aria-label="Quick filter by lead status"
                className="h-11 px-3.5 text-xs font-medium rounded-xl border border-[#dce4e7] bg-[#f8fafc] text-[#10253e] focus:outline-none focus:ring-2 focus:ring-[#173fad] min-w-[150px]"
              >
                {LEAD_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {td(opt.label)}
                  </option>
                ))}
              </select>
            </div>

            {/* Reusable FilterDrawer (Mobile Bottom Sheet & Desktop Panel) */}
            <FilterDrawer
              title={td("Filter Leads Pipeline (MK1)")}
              description={td("Select status, source, and academic program to refine leads.")}
              activeCount={activeFiltersCount}
              triggerLabel={td("Filters")}
              onReset={resetAllFilters}
              resetLabel={td("Reset all")}
              applyLabel={td("Apply filters")}
            >
              {/* Filter 1: Lead Status */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#10253e] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[#173fad]" />
                  <span>{td("Lead Status")}</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LEAD_STATUS_OPTIONS.map((opt) => {
                    const isSelected = selectedStatus === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedStatus(opt.value)}
                        className={`min-h-11 px-3 py-2 rounded-xl text-xs font-semibold border text-start transition-all ${
                          isSelected
                            ? "border-[#173fad] bg-[#eef4ff] text-[#173fad] shadow-xs ring-1 ring-[#173fad]"
                            : "border-[#dce4e7] bg-white text-[#29415b] hover:bg-[#f8fafb]"
                        }`}
                      >
                        {td(opt.label)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter 2: Lead Acquisition Source */}
              <div className="space-y-2 pt-2 border-t border-[#edf2f5]">
                <label className="text-xs font-bold text-[#10253e] uppercase tracking-wider flex items-center gap-1.5">
                  <Tag size={14} className="text-[#173fad]" />
                  <span>{td("Acquisition Source")}</span>
                </label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full min-h-11 px-3.5 text-xs font-medium rounded-xl border border-[#dce4e7] bg-[#f8fafc] text-[#10253e] focus:outline-none focus:ring-2 focus:ring-[#173fad]"
                >
                  {LEAD_SOURCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {td(opt.label)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 3: Course & Program Interest */}
              <div className="space-y-2 pt-2 border-t border-[#edf2f5]">
                <label className="text-xs font-bold text-[#10253e] uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={14} className="text-[#173fad]" />
                  <span>{td("Course & Program Interest")}</span>
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full min-h-11 px-3.5 text-xs font-medium rounded-xl border border-[#dce4e7] bg-[#f8fafc] text-[#10253e] focus:outline-none focus:ring-2 focus:ring-[#173fad]"
                >
                  {LEAD_COURSE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {td(opt.label)}
                    </option>
                  ))}
                </select>
              </div>
            </FilterDrawer>

            {/* Total count badge */}
            <span className="text-xs font-semibold text-[#53657a] px-2 whitespace-nowrap hidden sm:inline">
              {filteredLeads.length} {td("leads")}
            </span>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {(activeFiltersCount > 0 || searchQuery.trim()) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#edf2f5]">
            <span className="text-[11px] font-bold text-[#53657a] me-1">{td("Active filters")}:</span>

            {/* Status chip */}
            {selectedStatus !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#eef4ff] text-[#173fad] border border-[#c0d4ff]">
                <span>{statusConfig[selectedStatus as SubmissionStatus]?.label || selectedStatus}</span>
                <button
                  type="button"
                  onClick={() => setSelectedStatus("all")}
                  aria-label="Remove status filter"
                  className="hover:text-rose-600 focus:outline-none ms-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {/* Source chip */}
            {selectedSource !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#f4eddd] text-[#705a30] border border-[#e4d3b1]">
                <span>{selectedSource}</span>
                <button
                  type="button"
                  onClick={() => setSelectedSource("all")}
                  aria-label="Remove source filter"
                  className="hover:text-rose-600 focus:outline-none ms-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {/* Course chip */}
            {selectedCourse !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#efe8fb] text-[#6e4c9a] border border-[#d8c3f8]">
                <span>{selectedCourse}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCourse("all")}
                  aria-label="Remove course filter"
                  className="hover:text-rose-600 focus:outline-none ms-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {/* Search query chip */}
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#f0f4f7] text-[#29415b] border border-[#dce4e7]">
                <span>"{searchQuery}"</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search query"
                  className="hover:text-rose-600 focus:outline-none ms-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs font-semibold text-[#173fad] hover:text-[#10253e] underline ms-2 py-0.5"
            >
              {td("Reset all")}
            </button>
          </div>
        )}
      </div>

      {/* Leads Table (Desktop) / Cards (Mobile) */}
      {leadsQuery.isLoading ? (
        <div className="text-center py-16">
          <RefreshCw className="animate-spin text-[#173fad] size-6 mx-auto" />
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#dce4e7] rounded-xl">
          <FileSpreadsheet className="mx-auto size-10 text-[#53657a]/50" />
          <p className="mt-2 text-sm font-semibold text-[#10253e]">{td("No admissions or inquiry leads found.")}</p>
          <p className="text-xs text-[#53657a]">{td("Try adjusting your search or status filter.")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Mobile View: High-Accessibility Cards (< md) */}
          <div className="block md:hidden space-y-3">
            {filteredLeads.map((lead) => {
              const statusInfo = statusConfig[lead.status as SubmissionStatus] || statusConfig.new;
              const isExpanded = expandedLeadIds.has(lead.id);
              return (
                <div
                  key={`lead-card-${lead.id}`}
                  className="bg-white rounded-xl border border-[#dce4e7] p-4 shadow-xs space-y-3"
                >
                  {/* Card Header: Name + Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-base text-[#10253e] leading-snug">{lead.studentName}</h4>
                      <p className="text-xs text-[#53657a] mt-0.5">
                        {td("Age")} {lead.studentAge} · {td("Parent")}: {lead.parentName}
                      </p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${statusInfo.tone}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Primary Data Points */}
                  <div className="grid grid-cols-1 gap-1.5 text-xs">
                    <div className="flex items-center gap-2 text-[#10253e]">
                      <GraduationCap size={14} className="text-[#173fad] shrink-0" />
                      <span className="font-medium">{td(lead.programInterest)}</span>
                      {lead.preferredSchedule && (
                        <span className="text-[#53657a] text-[11px]">({td(lead.preferredSchedule)})</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[#173fad]">
                      <a
                        href={`mailto:${lead.parentEmail}`}
                        className="inline-flex items-center gap-1 text-xs hover:underline min-h-[36px] py-1"
                      >
                        <Mail size={13} /> {lead.parentEmail}
                      </a>
                      <a
                        href={`tel:${lead.parentPhone}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold hover:underline min-h-[36px] py-1"
                      >
                        <Phone size={13} /> {lead.parentPhone}
                      </a>
                    </div>
                  </div>

                  {/* Collapsible Secondary Details (Notes, Source, Date) */}
                  <div className="border-t border-[#edf2f5] pt-2">
                    <button
                      type="button"
                      onClick={() => toggleExpand(lead.id)}
                      className="w-full flex items-center justify-between text-xs text-[#53657a] font-medium py-1.5 hover:text-[#10253e]"
                    >
                      <span>{isExpanded ? td("Hide details") : td("View inquiry notes & origin")}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-2 text-xs bg-[#f8fafc] p-3 rounded-lg border border-[#edf2f5]">
                        {lead.message && (
                          <div>
                            <span className="font-semibold text-[#10253e] block mb-0.5">{td("Inquiry Notes")}:</span>
                            <p className="text-[#53657a] italic">"{lead.message}"</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[11px] text-[#53657a] pt-1 border-t border-[#edf2f5]">
                          <span>
                            {td("Source")}: <strong className="text-[#10253e]">{td(lead.source || "Website")}</strong>
                          </span>
                          <span>
                            {new Date(lead.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Action Footer: Full-Width Status Selector & Delete */}
                  <div className="pt-2 border-t border-[#edf2f5] flex items-center gap-2">
                    <div className="flex-1">
                      <label htmlFor={`lead-status-${lead.id}`} className="sr-only">
                        {td("Update Status")}
                      </label>
                      <select
                        id={`lead-status-${lead.id}`}
                        value={lead.status}
                        onChange={(e) =>
                          updateStatusMutation.mutate({
                            id: lead.id,
                            status: e.target.value as SubmissionStatus,
                          })
                        }
                        className={`w-full min-h-[44px] text-xs font-semibold px-3 py-2 rounded-lg border focus:outline-none ${statusInfo.tone}`}
                      >
                        <option value="new">{td("New Lead")}</option>
                        <option value="contacted">{td("Contacted")}</option>
                        <option value="interested">{td("Interested")}</option>
                        <option value="enrolled">{td("Enrolled")}</option>
                        <option value="closed">{td("Closed")}</option>
                      </select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTargetId(lead.id)}
                      className="min-h-[44px] min-w-[44px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0"
                      aria-label={td("Delete lead record")}
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
                    <th className="p-3.5">{td("Student & Parent")}</th>
                    <th className="p-3.5">{td("Program & Schedule")}</th>
                    <th className="p-3.5">{td("Source & Date")}</th>
                    <th className="p-3.5">{td("Stage Status")}</th>
                    <th className="p-3.5 text-right">{td("Quick Actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2f5]">
                  {filteredLeads.map((lead) => {
                    const statusInfo = statusConfig[lead.status as SubmissionStatus] || statusConfig.new;
                    return (
                      <tr key={lead.id} className="hover:bg-[#fbfcfe] transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-sm text-[#10253e]">{lead.studentName}</div>
                          <div className="text-[#53657a] text-[11px] flex items-center gap-1.5 mt-0.5">
                            <span>{td("Parent")}: {lead.parentName}</span>
                            <span>·</span>
                            <span>{td("Age")} {lead.studentAge}</span>
                          </div>
                          <div className="text-[11px] text-[#173fad] flex items-center gap-2 mt-1">
                            <a href={`mailto:${lead.parentEmail}`} className="flex items-center gap-1 hover:underline">
                              <Mail size={11} /> {lead.parentEmail}
                            </a>
                            <a href={`tel:${lead.parentPhone}`} className="flex items-center gap-1 hover:underline">
                              <Phone size={11} /> {lead.parentPhone}
                            </a>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-[#10253e]">{td(lead.programInterest)}</div>
                          <div className="text-[#53657a] text-[11px]">{td(lead.preferredSchedule)}</div>
                          {lead.message ? (
                            <p className="text-[#53657a] text-[11px] italic mt-1 line-clamp-1 bg-[#f8fafc] p-1 rounded border border-[#edf2f5]">
                              "{lead.message}"
                            </p>
                          ) : null}
                        </td>
                        <td className="p-3.5 text-[#53657a]">
                          <span className="px-2 py-0.5 rounded bg-[#f0f4f8] text-[11px] font-medium text-[#33475b]">
                            {td(lead.source || "Website")}
                          </span>
                          <div className="text-[10px] text-[#8292a1] mt-1">
                            {new Date(lead.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <select
                            value={lead.status}
                            onChange={(e) =>
                              updateStatusMutation.mutate({
                                id: lead.id,
                                status: e.target.value as SubmissionStatus,
                              })
                            }
                            aria-label={`Update status for lead ${lead.studentName}`}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-md border focus:outline-none ${statusInfo.tone}`}
                          >
                            <option value="new">{td("New Lead")}</option>
                            <option value="contacted">{td("Contacted")}</option>
                            <option value="interested">{td("Interested")}</option>
                            <option value="enrolled">{td("Enrolled")}</option>
                            <option value="closed">{td("Closed")}</option>
                          </select>
                        </td>
                        <td className="p-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTargetId(lead.id)}
                            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 size={14} />
                          </Button>
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

      {/* Add Lead Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#10253e]">{td("Create new enrollment or general enquiry lead")}</DialogTitle>
            <DialogDescription className="text-xs text-[#53657a]">
              {td("Record walk-in inquiries, phone inquiries, and student admissions.")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{td("Prospective Student Name")} *</Label>
                <Input
                  required
                  value={leadForm.studentName}
                  onChange={(e) => setLeadForm((p) => ({ ...p, studentName: e.target.value }))}
                  placeholder={td("Full student name")}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{td("Student Age (Years)")} *</Label>
                <Input
                  required
                  type="number"
                  min={3}
                  max={99}
                  value={leadForm.studentAge}
                  onChange={(e) => setLeadForm((p) => ({ ...p, studentAge: Number(e.target.value) }))}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{td("Parent / Guardian Full Name")} *</Label>
                <Input
                  required
                  value={leadForm.parentName}
                  onChange={(e) => setLeadForm((p) => ({ ...p, parentName: e.target.value }))}
                  placeholder={td("Guardian full name")}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{td("Parent Email Address")} *</Label>
                <Input
                  required
                  type="email"
                  value={leadForm.parentEmail}
                  onChange={(e) => setLeadForm((p) => ({ ...p, parentEmail: e.target.value }))}
                  placeholder="parent@example.com"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{td("Parent Phone / WhatsApp")} *</Label>
                <Input
                  required
                  value={leadForm.parentPhone}
                  onChange={(e) => setLeadForm((p) => ({ ...p, parentPhone: e.target.value }))}
                  placeholder="+60 12-345 6789"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{td("Program / Course Interest")}</Label>
                <Input
                  value={leadForm.programInterest}
                  onChange={(e) => setLeadForm((p) => ({ ...p, programInterest: e.target.value }))}
                  placeholder="e.g. General English / IELTS"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{td("Preferred Schedule")}</Label>
                <Input
                  value={leadForm.preferredSchedule}
                  onChange={(e) => setLeadForm((p) => ({ ...p, preferredSchedule: e.target.value }))}
                  placeholder="e.g. Weekday Evenings / Saturday"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{td("Initial Notes & Message")}</Label>
              <Textarea
                rows={3}
                value={leadForm.message}
                onChange={(e) => setLeadForm((p) => ({ ...p, message: e.target.value }))}
                placeholder={td("Notes regarding student language goals, consultation notes, etc.")}
                className="text-sm"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                {td("Cancel")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending}
                className="bg-[#173fad] hover:bg-[#12328b] text-white"
              >
                {createMutation.isPending ? td("Creating lead...") : td("Save Lead")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Lead Alert */}
      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#10253e]">{td("Delete Inquiry")}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#53657a]">
              {td("Are you sure you want to delete this lead record?")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">{td("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTargetId && deleteMutation.mutate({ id: deleteTargetId })}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
            >
              {deleteMutation.isPending ? td("Deleting...") : td("Delete Record")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
