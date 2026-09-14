import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Search,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Layers,
  Trash2,
  CheckCircle2,
  UserCheck,
  AlertCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { FounderModuleHeader } from "./FounderModuleHeader";

export function AdminLeadsModule() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const leadsQuery = trpc.registrationSubmissions.list.useQuery();

  const updateStatusMutation = trpc.registrationSubmissions.updateStatus.useMutation({
    onSuccess: () => {
      utils.registrationSubmissions.list.invalidate();
      toast.success("Lead status updated successfully.");
      if (selectedLead) {
        setSelectedLead(null);
      }
    },
    onError: (err) => toast.error(err.message || "Failed to update lead status."),
  });

  const deleteMutation = trpc.registrationSubmissions.delete.useMutation({
    onSuccess: () => {
      utils.registrationSubmissions.list.invalidate();
      toast.success("Lead record removed successfully.");
      setDeleteTargetId(null);
      if (selectedLead) {
        setSelectedLead(null);
      }
    },
    onError: (err) => toast.error(err.message || "Failed to remove lead."),
  });

  const handleUpdateStatus = (id: number, status: "new" | "routed" | "accountCreated" | "rejected") => {
    updateStatusMutation.mutate({ id, status });
  };

  const filteredLeads = React.useMemo(() => {
    if (!leadsQuery.data) return [];
    return leadsQuery.data.filter((lead: any) => {
      const q = searchQuery.toLowerCase();
      return (
        lead.fullName.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.phone.includes(q) ||
        lead.programInterest.toLowerCase().includes(q)
      );
    });
  }, [leadsQuery.data, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-100 rounded-md font-semibold">New</Badge>;
      case "routed":
        return <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border border-amber-100 rounded-md font-semibold">Contacted</Badge>;
      case "accountCreated":
        return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-100 rounded-md font-semibold">Enrolled</Badge>;
      case "rejected":
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-md font-semibold">Closed</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-600 hover:bg-slate-50 rounded-md">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <FounderModuleHeader
        title="Student Admissions CRM"
        description="Review inbound student enrollment enquiries, process academic placement routing, and activate portal accounts."
        badgeLabel="Admissions"
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <Input
            placeholder="Search leads by name, email, phone or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 border-slate-200 focus-visible:ring-blue-600 dark:border-slate-800"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => leadsQuery.refetch()}
          className="w-full sm:w-auto h-11 border-slate-200 dark:border-slate-800 flex items-center gap-2"
          disabled={leadsQuery.isFetching}
        >
          <RefreshCw size={15} className={leadsQuery.isFetching ? "animate-spin" : ""} />
          <span>Refresh Leads</span>
        </Button>
      </div>

      {/* Leads Grid/Table */}
      {leadsQuery.isLoading ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <RefreshCw size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Fetching inbound submissions...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
          <AlertCircle size={36} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-slate-800 dark:text-slate-200 font-bold text-lg">No leads found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">There are no inbound leads matching your filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead: any) => (
            <Card
              key={lead.id}
              className="border-slate-200/80 dark:border-slate-800/80 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {lead.fullName}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
                      {lead.applicantCategory}
                    </span>
                  </div>
                  {getStatusBadge(lead.status)}
                </div>

                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    <span>{lead.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700 dark:text-slate-200">{lead.programInterest}</span>
                  </div>
                  {lead.createdAt && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                      <Calendar size={12} />
                      <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Actions Bar */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedLead(lead)}
                    className="h-8 text-xs border-slate-200 text-slate-700"
                  >
                    Manage Lifecycle
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteTargetId(lead.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details / Management Dialog */}
      <Dialog open={selectedLead !== null} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Process Academic Lead</DialogTitle>
            <DialogDescription>
              Process prospective learner pathway records from this CRM workspace.
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-2">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Applicant Info</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedLead.fullName}</p>
                <p className="text-xs text-slate-500">{selectedLead.email} · {selectedLead.phone}</p>
                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                  <p className="text-xs font-semibold text-slate-500">Interested in:</p>
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mt-0.5">{selectedLead.programInterest}</p>
                </div>
              </div>

              {/* Status Updates */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">Update Enrolment State</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleUpdateStatus(selectedLead.id, "new")}
                    variant={selectedLead.status === "new" ? "default" : "outline"}
                    className="h-9 text-xs justify-start px-3"
                  >
                    <Clock size={13} className="mr-1.5" />
                    <span>New Lead</span>
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus(selectedLead.id, "routed")}
                    variant={selectedLead.status === "routed" ? "default" : "outline"}
                    className="h-9 text-xs justify-start px-3"
                  >
                    <Phone size={13} className="mr-1.5" />
                    <span>Contacted</span>
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus(selectedLead.id, "accountCreated")}
                    variant={selectedLead.status === "accountCreated" ? "default" : "outline"}
                    className="h-9 text-xs justify-start px-3"
                  >
                    <CheckCircle2 size={13} className="mr-1.5" />
                    <span>Enrolled</span>
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus(selectedLead.id, "rejected")}
                    variant={selectedLead.status === "rejected" ? "default" : "outline"}
                    className="h-9 text-xs justify-start px-3"
                  >
                    <AlertCircle size={13} className="mr-1.5" />
                    <span>Close Enq.</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLead(null)} className="h-10 text-xs">
              Close Window
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the prospective student lead record from the CRM. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTargetId && deleteMutation.mutate({ id: deleteTargetId })}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AdminLeadsModule;
