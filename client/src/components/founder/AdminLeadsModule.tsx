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
import {
  CheckCircle2,
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
  Trash2,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

type SubmissionStatus = "new" | "contacted" | "interested" | "enrolled" | "closed";

const statusConfig: Record<SubmissionStatus, { label: string; tone: string }> = {
  new: { label: "New Lead", tone: "bg-blue-50 text-blue-700 border-blue-200" },
  contacted: { label: "Contacted", tone: "bg-amber-50 text-amber-700 border-amber-200" },
  interested: { label: "Interested", tone: "bg-purple-50 text-purple-700 border-purple-200" },
  enrolled: { label: "Enrolled", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed: { label: "Closed", tone: "bg-gray-100 text-gray-700 border-gray-200" },
};

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [leadForm, setLeadForm] = useState<LeadFormState>(emptyLead);

  const utils = trpc.useUtils();
  const leadsQuery = trpc.submissions.list.useQuery();

  const createMutation = trpc.submissions.create.useMutation({
    onSuccess: () => {
      utils.submissions.list.invalidate();
      toast.success("Lead created successfully.");
      setIsModalOpen(false);
      setLeadForm(emptyLead);
    },
    onError: (err) => toast.error(err.message || "Failed to create lead."),
  });

  const updateStatusMutation = trpc.submissions.updateStatus.useMutation({
    onSuccess: () => {
      utils.submissions.list.invalidate();
      toast.success("Lead status updated.");
    },
    onError: (err) => toast.error(err.message || "Failed to update lead status."),
  });

  const deleteMutation = trpc.submissions.delete.useMutation({
    onSuccess: () => {
      utils.submissions.list.invalidate();
      toast.success("Lead removed successfully.");
      setDeleteTargetId(null);
    },
    onError: (err) => toast.error(err.message || "Failed to delete lead."),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.studentName.trim() || !leadForm.parentEmail.trim()) {
      toast.error("Student name and email are required.");
      return;
    }
    createMutation.mutate(leadForm);
  };

  const filteredLeads = React.useMemo(() => {
    const list = leadsQuery.data || [];
    return list.filter((lead) => {
      const matchSearch =
        !searchQuery.trim() ||
        lead.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.parentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.programInterest.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = selectedStatus === "all" || lead.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [leadsQuery.data, searchQuery, selectedStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#f4eddd] text-[#705a30] border border-[#e4d3b1]">
              <FileSpreadsheet size={13} />
              Admin Module
            </span>
            <span className="text-xs text-[#53657a]">CRUD: Admissions Leads</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#10253e] mt-1">Admissions & Inquiries Pipeline</h2>
          <p className="text-sm text-[#53657a]">
            Process student enrollments, course inquiries, parental contacts, and conversion statuses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => leadsQuery.refetch()}
            disabled={leadsQuery.isFetching}
            className="h-9 gap-1.5"
          >
            <RefreshCw size={14} className={leadsQuery.isFetching ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setLeadForm(emptyLead);
              setIsModalOpen(true);
            }}
            className="h-9 gap-1.5 bg-[#173fad] hover:bg-[#12328b] text-white"
          >
            <Plus size={15} />
            Add Manual Lead
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
            placeholder="Search leads by student name, parent email, or programme..."
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter submissions by status"
            className="h-9 px-3 text-xs font-medium rounded-lg border border-[#dce4e7] bg-[#f8fafc] text-[#10253e] focus:outline-none focus:ring-2 focus:ring-[#173fad]"
          >
            <option value="all">All Statuses</option>
            <option value="new">New Lead</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested</option>
            <option value="enrolled">Enrolled</option>
            <option value="closed">Closed</option>
          </select>
          <span className="text-xs text-[#53657a] px-2 whitespace-nowrap">
            {filteredLeads.length} leads
          </span>
        </div>
      </div>

      {/* Leads Table / Cards */}
      {leadsQuery.isLoading ? (
        <div className="text-center py-16">
          <RefreshCw className="animate-spin text-[#173fad] size-6 mx-auto" />
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#dce4e7] rounded-xl">
          <FileSpreadsheet className="mx-auto size-10 text-[#53657a]/50" />
          <p className="mt-2 text-sm font-semibold text-[#10253e]">No admissions leads found</p>
          <p className="text-xs text-[#53657a]">Click "Add Manual Lead" to register a walk-in or inquiry.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#dce4e7] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] border-b border-[#dce4e7] text-[#53657a] uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Student / Parent</th>
                  <th className="p-3.5">Programme & Schedule</th>
                  <th className="p-3.5">Source & Date</th>
                  <th className="p-3.5">Status Stage</th>
                  <th className="p-3.5 text-right">Actions</th>
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
                          <span>Parent: {lead.parentName}</span>
                          <span>·</span>
                          <span>Age {lead.studentAge}</span>
                        </div>
                        <div className="text-[11px] text-[#173fad] flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1">
                            <Mail size={11} /> {lead.parentEmail}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone size={11} /> {lead.parentPhone}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-[#10253e]">{lead.programInterest}</div>
                        <div className="text-[#53657a] text-[11px]">{lead.preferredSchedule}</div>
                        {lead.message ? (
                          <p className="text-[#53657a] text-[11px] italic mt-1 line-clamp-1 bg-[#f8fafc] p-1 rounded border border-[#edf2f5]">
                            "{lead.message}"
                          </p>
                        ) : null}
                      </td>
                      <td className="p-3.5 text-[#53657a]">
                        <span className="px-2 py-0.5 rounded bg-[#f0f4f8] text-[11px] font-medium text-[#33475b]">
                          {lead.source || "Website"}
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
                          <option value="new">New Lead</option>
                          <option value="contacted">Contacted</option>
                          <option value="interested">Interested</option>
                          <option value="enrolled">Enrolled</option>
                          <option value="closed">Closed</option>
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
      )}

      {/* Add Lead Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#10253e]">Add Manual Admission Lead</DialogTitle>
            <DialogDescription className="text-xs text-[#53657a]">
              Record walk-in inquiries, phone inquiries, and student admissions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Student Name *</Label>
                <Input
                  required
                  value={leadForm.studentName}
                  onChange={(e) => setLeadForm((p) => ({ ...p, studentName: e.target.value }))}
                  placeholder="Full student name"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Student Age *</Label>
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
                <Label className="text-xs font-semibold">Parent / Guardian Name *</Label>
                <Input
                  required
                  value={leadForm.parentName}
                  onChange={(e) => setLeadForm((p) => ({ ...p, parentName: e.target.value }))}
                  placeholder="Guardian full name"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Parent Email *</Label>
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
                <Label className="text-xs font-semibold">Parent Phone *</Label>
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
                <Label className="text-xs font-semibold">Program Interest</Label>
                <Input
                  value={leadForm.programInterest}
                  onChange={(e) => setLeadForm((p) => ({ ...p, programInterest: e.target.value }))}
                  placeholder="e.g. General English / IELTS"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Preferred Schedule</Label>
                <Input
                  value={leadForm.preferredSchedule}
                  onChange={(e) => setLeadForm((p) => ({ ...p, preferredSchedule: e.target.value }))}
                  placeholder="e.g. Weekday Evenings / Saturday"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Inquiry Notes / Special Requests</Label>
              <Textarea
                rows={3}
                value={leadForm.message}
                onChange={(e) => setLeadForm((p) => ({ ...p, message: e.target.value }))}
                placeholder="Notes regarding student language goals, consultation notes, etc."
                className="text-sm"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending}
                className="bg-[#173fad] hover:bg-[#12328b] text-white"
              >
                {createMutation.isPending ? "Creating..." : "Save Lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Lead Alert */}
      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#10253e]">Remove Lead Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#53657a]">
              Are you sure you want to delete this admission inquiry? This action cannot be undone.
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
