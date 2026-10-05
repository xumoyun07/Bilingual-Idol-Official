import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Shield, Check, Landmark, ScrollText, AlertCircle, Loader2, CheckCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminPaymentsModule() {
  const { td } = useLanguage();
  const utils = trpc.useUtils();

  // 1. Fetch gateway status
  const { data: gatewayStatus, isLoading: isGatewayLoading } = trpc.payments.getGatewayStatus.useQuery();

  // 2. Fetch all payments list
  const { data: paymentsList, isLoading: isPaymentsLoading, refetch } = trpc.payments.list.useQuery();

  // 3. Mutation for manual status updates
  const updateStatusMutation = trpc.payments.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      utils.payments.list.invalidate();
      closeModal();
    }
  });

  // State for manual payment update modal
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<"completed" | "failed" | "refunded">("completed");
  const [notes, setNotes] = useState("");
  const [txnRef, setTxnRef] = useState("");

  const handleOpenUpdateModal = (payment: any) => {
    setSelectedPayment(payment);
    setNewStatus("completed");
    setNotes("");
    setTxnRef(payment.transactionReference || "MANUAL-" + Math.floor(100000 + Math.random() * 900000));
  };

  const closeModal = () => {
    setSelectedPayment(null);
    setNotes("");
    setTxnRef("");
  };

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: selectedPayment.id,
        status: newStatus,
        paymentMethod: "manual_admin",
        transactionReference: txnRef,
        notes: notes.trim() || undefined,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (amount: number) => {
    return `RM ${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateInput: any) => {
    if (!dateInput) return "N/A";
    const d = new Date(dateInput);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "refunded":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const isLoading = isGatewayLoading || isPaymentsLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#10253e]">{td("Student Tuition Payments & Fees")}</h2>
          <p className="text-sm text-[#53657a]">{td("Verify real-time online gateway transactions and log manual administrative approvals.")}</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="px-4 py-2 border border-[#d9cbb8] text-xs font-bold text-[#10253e] hover:bg-slate-50 bg-white rounded-lg flex items-center gap-1.5 transition-colors min-h-[40px]"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <ScrollText size={14} />}
          <span>{td("Refresh list")}</span>
        </button>
      </div>

      {/* 1. Connection Status Card */}
      <div className="p-5 rounded-2xl bg-white border border-[#eee4d7] shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <span className="text-xs font-extrabold text-[#708098] uppercase tracking-wider block">{td("Payment Gateway Settings")}</span>
          <h3 className="text-base font-black text-[#10253e] mt-1.5 flex items-center gap-2">
            <Landmark size={18} className="text-[#173fad]" />
            <span>Billplz Malaysia FPX Integration</span>
          </h3>
          <p className="text-xs text-[#53657a] mt-1.5 leading-relaxed">
            {td("Online student tuition fees are routed directly into the designated secure Billplz merchant collection. Environment-specific keys are strictly managed on the server side.")}
          </p>
        </div>

        <div className="flex flex-col justify-center md:items-end gap-2.5 p-4 bg-slate-50 rounded-xl border border-dashed border-[#dfd1bf]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#53657a]">{td("Connection Status:")}</span>
            {gatewayStatus?.isEnabled ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle size={12} />
                <span>{gatewayStatus.provider === "billplz" ? td("Connected (Production/Sandbox)") : td("Dev Mock Active")}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <AlertCircle size={12} />
                <span>{td("Offline / Not Configured")}</span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#708098]">
            * {td("Secrets (API key, Signature Key) are securely redacted and never returned to the browser.")}
          </span>
        </div>
      </div>

      {/* 2. Payments Table Card */}
      <div className="rounded-2xl border border-[#eee4d7] bg-white overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-[#eee4d7] bg-[#faf7f2]/30 flex justify-between items-center">
          <span className="text-xs font-extrabold text-[#10253e] uppercase tracking-wider">{td("Global Tuition Log")}</span>
          <span className="text-xs text-[#53657a] font-medium">
            {td("Total records:")} <strong className="text-[#10253e]">{paymentsList?.length ?? 0}</strong>
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 size={36} className="text-[#173fad] animate-spin" />
            <p className="text-sm text-[#53657a]">{td("Fetching financial records…")}</p>
          </div>
        ) : !paymentsList || paymentsList.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto space-y-3.5">
            <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto">
              <ScrollText size={24} />
            </div>
            <h3 className="font-bold text-[#10253e] text-base">{td("No tuition records registered")}</h3>
            <p className="text-xs text-[#53657a]">
              {td("When students check out their level tuition fee, their pending references and settlement statuses will appear automatically in this log.")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-start text-sm">
              <thead>
                <tr className="border-b border-[#eee4d7] bg-[#faf7f2]/10 text-xs font-bold text-[#708098] text-start">
                  <th className="px-5 py-3 text-start">{td("Receipt / invoice")}</th>
                  <th className="px-5 py-3 text-start">{td("Student ID")}</th>
                  <th className="px-5 py-3 text-start">{td("Dues settled")}</th>
                  <th className="px-5 py-3 text-start">{td("Method")}</th>
                  <th className="px-5 py-3 text-start">{td("Ref ID")}</th>
                  <th className="px-5 py-3 text-start">{td("Date")}</th>
                  <th className="px-5 py-3 text-start">{td("Status")}</th>
                  <th className="px-5 py-3 text-end">{td("Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentsList.map((pay: any) => {
                  const metadata = pay.metadataJson ? JSON.parse(pay.metadataJson) : {};
                  return (
                    <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 font-bold text-[#10253e]">
                        <div>{pay.receiptNumber}</div>
                        {metadata.adminNote && (
                          <div className="text-[10px] text-amber-700 mt-1 font-semibold max-w-xs truncate" title={metadata.adminNote}>
                            Note: {metadata.adminNote}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-[#53657a]">
                        Student #{pay.userId}
                      </td>
                      <td className="px-5 py-4 font-black text-[#173fad]">
                        {formatCurrency(pay.amount)}
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-[#10253e]">
                        {pay.paymentMethod === "manual_admin" ? (
                          <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                            {td("Manual Admin")}
                          </span>
                        ) : (
                          <span className="text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                            FPX Bank
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#708098] font-mono">
                        {pay.transactionReference || "none"}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#53657a]">
                        {formatDate(pay.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-extrabold uppercase ${getStatusBadgeClass(pay.status)}`}>
                          {td(pay.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-end">
                        {pay.status === "pending" ? (
                          <button
                            onClick={() => handleOpenUpdateModal(pay)}
                            className="px-3 py-1.5 bg-[#173fad] hover:bg-[#102c7e] text-white text-xs font-bold rounded-lg transition-all min-h-[32px]"
                          >
                            {td("Review & Update")}
                          </button>
                        ) : (
                          <span className="text-xs text-[#708098] italic font-medium">{td("Settled")}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Manual Payment Approval Dialog */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#fbf8f2] rounded-2xl border border-[#dfd1bf] max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#eee4d7]">
              <h3 className="text-base font-black text-[#10253e] flex items-center gap-2">
                <Shield size={18} className="text-[#173fad]" />
                <span>{td("Manual Administrative Overrule")}</span>
              </h3>
              <button onClick={closeModal} className="text-[#708098] hover:text-[#10253e] text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitManual} className="space-y-4">
              <div className="p-3.5 bg-white rounded-xl border border-[#eee4d7]">
                <div className="flex justify-between text-xs text-[#53657a] mb-1">
                  <span>Invoice Receipt:</span>
                  <span className="font-bold text-[#10253e]">{selectedPayment.receiptNumber}</span>
                </div>
                <div className="flex justify-between text-xs text-[#53657a]">
                  <span>Total Amount Due:</span>
                  <span className="font-extrabold text-[#173fad]">{formatCurrency(selectedPayment.amount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#10253e] uppercase tracking-wider mb-1.5">
                  {td("Transition Status")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["completed", "failed", "refunded"] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatus(st)}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all min-h-[38px] ${
                        newStatus === st
                          ? "bg-[#10253e] text-white border-[#10253e]"
                          : "bg-white text-[#53657a] border-[#dce4e7] hover:bg-[#faf7f2]"
                      }`}
                    >
                      {td(st)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#10253e] uppercase tracking-wider mb-1.5">
                  {td("Transaction Reference (optional)")}
                </label>
                <input
                  type="text"
                  placeholder="e.g. FPX-MANUAL-123456"
                  value={txnRef}
                  onChange={e => setTxnRef(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#dce4e7] bg-white rounded-lg outline-none focus:border-[#173fad] min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#10253e] uppercase tracking-wider mb-1.5">
                  {td("Administrative Notes / Audit Remark")}
                </label>
                <textarea
                  required
                  placeholder="Explain why this transaction was modified manually (e.g., student settled via cash on campus, bank slip verified, etc.)"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-[#dce4e7] bg-white rounded-lg outline-none focus:border-[#173fad] resize-none"
                />
              </div>

              {updateStatusMutation.error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  <span>{updateStatusMutation.error.message}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 min-h-[40px] border-[#dfd1bf]"
                >
                  {td("Cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={updateStatusMutation.isPending || !notes.trim()}
                  className="flex-1 compass-btn-primary min-h-[40px]"
                >
                  {updateStatusMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : td("Save changes")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
