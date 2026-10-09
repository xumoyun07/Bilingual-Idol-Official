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
import { useAuth } from "@/_core/hooks/useAuth";
import { FounderModuleHeader } from "./FounderModuleHeader";

export function AdminLeadsModule() {
  const { user } = useAuth();
  const isMarketing = user?.role === "marketing";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  // Account creation state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createdAccountResult, setCreatedAccountResult] = useState<any>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formProgramId, setFormProgramId] = useState("");
  const [formAgreedPrice, setFormAgreedPrice] = useState(0);
  const [formRegFee, setFormRegFee] = useState(0);
  const [formPlacementFee, setFormPlacementFee] = useState(0);
  const [formVisaFee, setFormVisaFee] = useState(0);
  const [formSource, setFormSource] = useState<"registration_form" | "enquiry_form" | "direct_call" | "whatsapp">("direct_call");
  const [formSubmissionId, setFormSubmissionId] = useState<number | null>(null);
  const [formRegSubmissionId, setFormRegSubmissionId] = useState<number | null>(null);
  const [formNotes, setFormNotes] = useState("");

  const utils = trpc.useUtils();
  const leadsQuery = trpc.registrationSubmissions.list.useQuery();
  const programsQuery = trpc.content.publicPrograms.useQuery();
  const inquiriesQuery = trpc.submissions.list.useQuery(undefined, { enabled: !isMarketing });

  const createAccountMutation = trpc.enrollments.createClientAccountAndEnrollment.useMutation({
    onSuccess: (data) => {
      setCreatedAccountResult(data);
      toast.success("Client account & active enrollment successfully created!");
      utils.registrationSubmissions.list.invalidate();
      if (selectedLead) setSelectedLead(null);
      // Reset form
      setFormName("");
      setFormEmail("");
      setFormPhone("");
      setFormProgramId("");
      setFormAgreedPrice(0);
      setFormRegFee(0);
      setFormPlacementFee(0);
      setFormVisaFee(0);
      setFormNotes("");
      setFormSubmissionId(null);
      setFormRegSubmissionId(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create client account.");
    }
  });

  const openWithLead = (lead: any, type: "registration" | "inquiry") => {
    setFormName(lead.fullName || lead.studentName || "");
    setFormEmail(lead.email || lead.parentEmail || "");
    setFormPhone(lead.phone || lead.parentPhone || "");
    setFormProgramId(lead.programId ? String(lead.programId) : "");
    setFormSource(type === "registration" ? "registration_form" : "enquiry_form");
    if (type === "registration") {
      setFormRegSubmissionId(lead.id);
      setFormSubmissionId(null);
    } else {
      setFormSubmissionId(lead.id);
      setFormRegSubmissionId(null);
    }
    setFormNotes(lead.message || "");
    setCreatedAccountResult(null);
    setIsCreateModalOpen(true);
  };

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
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => leadsQuery.refetch()}
            className="w-full sm:w-auto h-11 border-slate-200 dark:border-slate-800 flex items-center gap-2"
            disabled={leadsQuery.isFetching}
          >
            <RefreshCw size={15} className={leadsQuery.isFetching ? "animate-spin" : ""} />
            <span>Refresh Leads</span>
          </Button>

          {!isMarketing && (
            <Button
              onClick={() => {
                setFormName("");
                setFormEmail("");
                setFormPhone("");
                setFormProgramId("");
                setFormAgreedPrice(0);
                setFormRegFee(0);
                setFormPlacementFee(0);
                setFormVisaFee(0);
                setFormNotes("");
                setFormSource("direct_call");
                setFormSubmissionId(null);
                setFormRegSubmissionId(null);
                setCreatedAccountResult(null);
                setIsCreateModalOpen(true);
              }}
              className="w-full sm:w-auto h-11 bg-blue-700 hover:bg-blue-800 text-white font-bold flex items-center justify-center gap-2 shadow-md shrink-0 cursor-pointer"
            >
              <UserCheck size={16} />
              <span>Create Client Account</span>
            </Button>
          )}
        </div>
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
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedLead(lead)}
                      className="h-8 text-xs border-slate-200 text-slate-700"
                    >
                      Manage Lifecycle
                    </Button>
                    
                    {!isMarketing && lead.status !== 'accountCreated' && (
                      <Button
                        size="sm"
                        onClick={() => openWithLead(lead, "registration")}
                        className="h-8 text-xs bg-blue-700 hover:bg-blue-800 text-white font-semibold px-2.5 flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <UserCheck size={13} />
                        <span>Activate Account</span>
                      </Button>
                    )}
                  </div>
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
      {/* Create Client Account & Active Enrolment Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {createdAccountResult ? "Account Activation Credentials" : "Create Learner Account & Active Enrolment"}
            </DialogTitle>
            <DialogDescription>
              {createdAccountResult 
                ? "Securely copy the generated credentials to share with the student." 
                : "Register a student account, establish custom program pricing, and launch their active academic enrolment."}
            </DialogDescription>
          </DialogHeader>

          {createdAccountResult ? (
            <div className="space-y-6 py-4 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100 shadow-xs">
                <CheckCircle2 size={30} className="stroke-[2.5]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-slate-900">Student Portal Active!</h3>
                <p className="text-sm text-slate-500">Provide the following temporary credentials to the learner for their initial login:</p>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/60 text-left font-mono space-y-3 text-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Portal Login Username:</span>
                  <span className="text-slate-800 font-bold break-all select-all text-base">{formEmail || "Student Email"}</span>
                </div>
                <div className="pt-2 border-t border-slate-200/50">
                  <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Temporary Password:</span>
                  <span className="text-blue-700 font-extrabold select-all text-base">{createdAccountResult.tempPassword}</span>
                </div>
              </div>

              <Button 
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer" 
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreatedAccountResult(null);
                }}
              >
                Complete Workflow
              </Button>
            </div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!formName.trim() || !formEmail.trim() || !formPhone.trim() || !formProgramId) {
                  toast.error("Please fill in all mandatory fields.");
                  return;
                }
                createAccountMutation.mutate({
                  name: formName,
                  email: formEmail,
                  phone: formPhone,
                  programId: Number(formProgramId),
                  agreedPrice: Math.round(Number(formAgreedPrice) * 100),
                  registrationFee: Math.round(Number(formRegFee) * 100),
                  placementTestFee: Math.round(Number(formPlacementFee) * 100),
                  visaFee: Math.round(Number(formVisaFee) * 100),
                  source: formSource,
                  submissionId: formSource === "enquiry_form" ? formSubmissionId : null,
                  registrationSubmissionId: formSource === "registration_form" ? formRegSubmissionId : null,
                  notes: formNotes,
                });
              }}
              className="space-y-5 py-4"
            >
              {/* Basic Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student Full Name <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder="E.g., John Doe" 
                    value={formName} 
                    onChange={(e) => setFormName(e.target.value)} 
                    required 
                    className="h-10 border-slate-200"
                  />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Email <span className="text-red-500">*</span></label>
                  <Input 
                    type="email" 
                    placeholder="student@example.com" 
                    value={formEmail} 
                    onChange={(e) => setFormEmail(e.target.value)} 
                    required 
                    className="h-10 border-slate-200"
                  />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder="E.g., +6012345678" 
                    value={formPhone} 
                    onChange={(e) => setFormPhone(e.target.value)} 
                    required 
                    className="h-10 border-slate-200"
                  />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Academic Program <span className="text-red-500">*</span></label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                    value={formProgramId}
                    onChange={(e) => setFormProgramId(e.target.value)}
                    required
                  >
                    <option value="">Select a program...</option>
                    {programsQuery.data?.map(prog => (
                      <option key={prog.id} value={String(prog.id)}>{prog.title} ({prog.language})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing & Fees Breakdowns */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={14} />
                  <span>Custom Pricing & Academic Fees</span>
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Agreed Price (MYR) <span className="text-red-500">*</span></label>
                    <Input 
                      type="number" 
                      min="0" 
                      value={formAgreedPrice} 
                      onChange={(e) => setFormAgreedPrice(Number(e.target.value))} 
                      required 
                      className="h-10 border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Registration Fee (MYR)</label>
                    <Input 
                      type="number" 
                      min="0" 
                      value={formRegFee} 
                      onChange={(e) => setFormRegFee(Number(e.target.value))} 
                      className="h-10 border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Placement Test Fee (MYR)</label>
                    <Input 
                      type="number" 
                      min="0" 
                      value={formPlacementFee} 
                      onChange={(e) => setFormPlacementFee(Number(e.target.value))} 
                      className="h-10 border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Visa Processing Fee (MYR)</label>
                    <Input 
                      type="number" 
                      min="0" 
                      value={formVisaFee} 
                      onChange={(e) => setFormVisaFee(Number(e.target.value))} 
                      className="h-10 border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Source & Reference Mapping */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enrolment Source <span className="text-red-500">*</span></label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                    value={formSource}
                    onChange={(e) => {
                      const src = e.target.value as any;
                      setFormSource(src);
                      setFormSubmissionId(null);
                      setFormRegSubmissionId(null);
                    }}
                    required
                  >
                    <option value="direct_call">Direct Call</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="registration_form">Form 2 (CRM Registration)</option>
                    <option value="enquiry_form">Form 1 (Inquiry / Consultation)</option>
                  </select>
                </div>

                {/* Reference Inquiry Selection (Form 1) */}
                {formSource === "enquiry_form" && (
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Link Submission <span className="text-red-500">*</span></label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                      value={formSubmissionId ? String(formSubmissionId) : ""}
                      onChange={(e) => setFormSubmissionId(e.target.value ? Number(e.target.value) : null)}
                      required
                    >
                      <option value="">Select unlinked inquiry...</option>
                      {inquiriesQuery.data
                        ?.filter(sub => sub.status !== "account_created")
                        ?.map(sub => (
                          <option key={sub.id} value={sub.id}>
                            {sub.studentName} ({sub.parentEmail})
                          </option>
                        ))
                      }
                    </select>
                  </div>
                )}

                {/* Reference CRM Submission Selection (Form 2) */}
                {formSource === "registration_form" && (
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Link Registration <span className="text-red-500">*</span></label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                      value={formRegSubmissionId ? String(formRegSubmissionId) : ""}
                      onChange={(e) => setFormRegSubmissionId(e.target.value ? Number(e.target.value) : null)}
                      required
                    >
                      <option value="">Select unlinked registration...</option>
                      {leadsQuery.data
                        ?.filter(lead => lead.status !== "accountCreated")
                        ?.map(lead => (
                          <option key={lead.id} value={lead.id}>
                            {lead.fullName} ({lead.email})
                          </option>
                        ))
                      }
                    </select>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enrolment Note / Remarks</label>
                <textarea
                  className="w-full min-h-[80px] p-3 text-sm rounded-md border border-slate-200 bg-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 resize-y"
                  placeholder="Any details regarding the customized pricing or special needs..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-10 text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createAccountMutation.isPending}
                  className="h-10 text-xs bg-blue-700 hover:bg-blue-800 text-white font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  {createAccountMutation.isPending ? <RefreshCw className="animate-spin" size={13} /> : <UserCheck size={14} />}
                  <span>Activate Student & Enrolment</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminLeadsModule;
