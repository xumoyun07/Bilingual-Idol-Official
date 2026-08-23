import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { AlertCircle, ArchiveRestore, ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileText, Filter, History, Loader2, RotateCcw, Search, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";

type AuditRole = "founder" | "super_admin";
type AuditSource = "active" | "archive";
type AuditActorRole = "" | "founder" | "super_admin" | "admin" | "marketing" | "teacher" | "student" | "user";
type AuditRow = { id: number; source: AuditSource; createdAt: Date; actorUserId: number | null; actorRole: string | null; action: string; targetType: string; targetId: string | null; targetRole: string | null; description: string; isSuccess: boolean; ipAddress: string | null; browser: string | null; operatingSystem: string | null; archivedAt?: Date; archivedByUserId?: number | null };

const actionOptions = [
  ["", "All actions"], ["audit.view", "Viewed audit logs"], ["audit.search", "Searched audit logs"], ["audit.export_csv", "Exported CSV"], ["audit.export_pdf", "Exported PDF"], ["audit.archive", "Archived logs"], ["audit.restore", "Restored logs"],
  ["user.create", "Created user"], ["user.update", "Updated user"], ["user.delete", "Deleted user"], ["user_group.create", "Created group"], ["user_group.update", "Updated group"], ["user_group.delete", "Deleted group"], ["user_field.create", "Created field"], ["user_field.update", "Updated field"], ["user_field.delete", "Deleted field"], ["user_field.reorder", "Reordered fields"], ["user_field.system_update", "Updated create form"],
] as const;
const targetOptions = [["", "All objects"], ["audit_log", "Audit log"], ["user", "User"], ["user_group", "User group"], ["user_field", "User field"], ["user_form", "User form"]] as const;
const roleOptions: Record<AuditRole, readonly (readonly [string, string])[]> = {
  founder: [["", "All roles"], ["founder", "Founder"], ["super_admin", "Super admin"], ["admin", "Admin"], ["marketing", "Marketing"], ["teacher", "Teacher"], ["student", "Student"], ["user", "Legacy user"]],
  super_admin: [["", "All visible roles"], ["super_admin", "My role"], ["admin", "Admin"], ["marketing", "Marketing"], ["teacher", "Teacher"], ["student", "Student"], ["user", "Legacy user"]],
};

function localDate(value: Date | string) { return new Date(value).toLocaleString(); }
function labelAction(value: string) { return value.replace(/_/g, " ").replace(/\./g, " · "); }
function downloadFile(content: BlobPart, filename: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement("a"); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}
function decodeBase64(value: string) { const binary = atob(value); const bytes = new Uint8Array(binary.length); for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index); return bytes; }

export default function AuditLogs({ role }: { role: AuditRole }) {
  const isFounder = role === "founder";
  const utils = trpc.useUtils();
  const [source, setSource] = useState<AuditSource>("active");
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actorRole, setActorRole] = useState<AuditActorRole>("");
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [success, setSuccess] = useState("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [selectedArchiveIds, setSelectedArchiveIds] = useState<number[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const filters = useMemo(() => ({ query: query.trim() || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, actorRole: actorRole || undefined, action: action || undefined, targetType: targetType || undefined, isSuccess: success === "all" ? undefined : success === "success", source }), [action, actorRole, dateFrom, dateTo, query, source, success, targetType]);
  const input = useMemo(() => ({ ...filters, page, pageSize }), [filters, page, pageSize]);
  const list = trpc.audit.list.useQuery(input);
  const suggestions = trpc.audit.suggestions.useQuery({ ...filters, query: query.trim() }, { enabled: query.trim().length >= 2 });
  const refresh = async () => { await Promise.all([utils.audit.list.invalidate(), utils.audit.suggestions.invalidate()]); };
  const exportCsv = trpc.audit.exportCsv.useMutation({ onSuccess: result => { downloadFile(result.data, result.filename, result.mimeType); setNotice("CSV export is ready."); refresh(); } });
  const exportPdf = trpc.audit.exportPdf.useMutation({ onSuccess: result => { downloadFile(decodeBase64(result.dataBase64), result.filename, result.mimeType); setNotice("PDF export is ready."); refresh(); } });
  const archive = trpc.audit.archive.useMutation({ onSuccess: async result => { setNotice(`Archived ${result.archived} record${result.archived === 1 ? "" : "s"} older than 12 months.`); await refresh(); } });
  const restore = trpc.audit.restore.useMutation({ onSuccess: async result => { setNotice(`Restored ${result.restored} record${result.restored === 1 ? "" : "s"}.`); setSelectedArchiveIds([]); await refresh(); } });
  const rows = (list.data?.rows ?? []) as AuditRow[];
  const total = list.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const mutationError = exportCsv.error ?? exportPdf.error ?? archive.error ?? restore.error;
  const isPending = exportCsv.isPending || exportPdf.isPending || archive.isPending || restore.isPending;

  function resetFilters() { setQuery(""); setDateFrom(""); setDateTo(""); setActorRole(""); setAction(""); setTargetType(""); setSuccess("all"); setPage(0); setSelectedArchiveIds([]); }
  function updateSource(next: AuditSource) { setSource(next); setPage(0); setSelectedArchiveIds([]); }
  function selectSuggestion(value: string) { setQuery(value.startsWith("#") ? value.slice(1) : value); setPage(0); }
  function toggleArchive(id: number) { setSelectedArchiveIds(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]); }

  return <main className="founder-command founder-workspace mx-auto w-full max-w-[96rem] pb-10">
    <header className="founder-command-header">
      <div><p className="founder-command-eyebrow">{isFounder ? "Control centre" : "Operations"} · Audit logs</p><h1 className="founder-command-title">Review sensitive activity with clear scope.</h1><p className="founder-command-description">UTC-based events are stored with indexed filters and rendered in your local time. {isFounder ? "You can also review archived records and restore selected entries." : "Private-control and peer Super admin activity is excluded from this workspace."}</p></div>
      <div className="founder-command-action flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={isPending} onClick={() => exportCsv.mutate(filters)} className="min-h-12 border-[#d8cfbf] text-[#29415b] hover:bg-[#faf6ef]"><FileSpreadsheet size={16} />CSV</Button><Button type="button" variant="outline" disabled={isPending} onClick={() => exportPdf.mutate(filters)} className="min-h-12 border-[#d8cfbf] text-[#29415b] hover:bg-[#faf6ef]"><FileText size={16} />PDF</Button></div>
    </header>

    {notice ? <Alert className="mt-5 border-[#b9d7ca] bg-[#f2faf4] text-[#244e40]"><ShieldCheck className="h-4 w-4" /><AlertTitle>Audit operation completed</AlertTitle><AlertDescription className="flex items-center justify-between gap-3">{notice}<button type="button" onClick={() => setNotice(null)} className="min-h-10 rounded-lg px-2 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#397563]" aria-label="Dismiss notice">Dismiss</button></AlertDescription></Alert> : null}
    {mutationError ? <Alert variant="destructive" className="mt-5"><AlertCircle className="h-4 w-4" /><AlertTitle>Audit operation needs attention</AlertTitle><AlertDescription>{mutationError.message}</AlertDescription></Alert> : null}

    <section className="founder-panel founder-panel-paper mt-6" aria-label="Audit log filters">
      {isFounder ? <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee4d7] pb-5"><div className="inline-flex rounded-xl border border-[#dfd1bf] bg-white p-1" role="tablist" aria-label="Audit data source"><button type="button" role="tab" aria-selected={source === "active"} onClick={() => updateSource("active")} className={`min-h-11 rounded-lg px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#397563] ${source === "active" ? "bg-[#10253e] text-white" : "text-[#53657a] hover:bg-[#faf6ef]"}`}>Active records</button><button type="button" role="tab" aria-selected={source === "archive"} onClick={() => updateSource("archive")} className={`min-h-11 rounded-lg px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#397563] ${source === "archive" ? "bg-[#10253e] text-white" : "text-[#53657a] hover:bg-[#faf6ef]"}`}>Archive</button></div>{source === "active" ? <Button type="button" onClick={() => archive.mutate()} disabled={isPending} className="compass-btn-secondary min-h-12"><History size={16} />Run 12-month archive</Button> : selectedArchiveIds.length ? <Button type="button" onClick={() => restore.mutate({ archiveIds: selectedArchiveIds })} disabled={isPending} className="compass-btn-primary min-h-12"><ArchiveRestore size={16} />Restore selected ({selectedArchiveIds.length})</Button> : <p className="text-sm text-[#53657a]">Select archived records to restore them.</p>}</div> : null}
      <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_10rem_11rem_11rem_10rem]">
        <label className="relative block xl:col-span-2"><span className="sr-only">Search audit records</span><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#708098]" size={17} /><input value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} className="h-12 w-full rounded-xl border border-[#dfd1bf] bg-white pl-10 pr-3 text-sm text-[#10253e] outline-none focus:border-[#397563] focus:ring-2 focus:ring-[#b9d7ca]" placeholder="Search ID, description, IP, browser, action or object" aria-describedby={suggestions.data?.length ? "audit-search-suggestions" : undefined} />{suggestions.data?.length ? <div id="audit-search-suggestions" className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-[#dfd1bf] bg-white p-1 shadow-lg" role="listbox" aria-label="Search suggestions">{suggestions.data.map((item: string) => <button key={item} type="button" role="option" onClick={() => selectSuggestion(item)} className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm text-[#29415b] hover:bg-[#e7f0eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#397563]">{item}</button>)}</div> : null}</label>
        <Select label="Role" value={actorRole} onChange={value => { setActorRole(value as AuditActorRole); setPage(0); }} options={roleOptions[role]} />
        <Select label="Action" value={action} onChange={value => { setAction(value); setPage(0); }} options={actionOptions} />
        <Select label="Object" value={targetType} onChange={value => { setTargetType(value); setPage(0); }} options={targetOptions} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3 xl:grid-cols-[10rem_10rem_11rem_auto]"><DateInput label="UTC from" value={dateFrom} onChange={value => { setDateFrom(value); setPage(0); }} /><DateInput label="UTC to" value={dateTo} onChange={value => { setDateTo(value); setPage(0); }} /><Select label="Result" value={success} onChange={value => { setSuccess(value); setPage(0); }} options={[["all", "All results"], ["success", "Successful"], ["failed", "Failed"]]} /><div className="flex items-end justify-end"><button type="button" onClick={resetFilters} className="inline-flex min-h-12 items-center gap-2 rounded-full px-3 text-xs font-extrabold text-[#397563] hover:bg-[#e7f0eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#397563]"><X size={15} />Clear filters</button></div></div>
    </section>

    <section className="founder-panel founder-panel-paper mt-6 overflow-hidden p-0" aria-live="polite">
      <div className="flex flex-col gap-3 border-b border-[#eee4d7] px-5 py-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="founder-command-eyebrow">{source === "archive" ? "Archived events" : "Current events"}</p><h2 className="mt-1 font-display text-3xl text-[#10253e]">{list.isLoading ? "Loading records…" : `${total.toLocaleString()} matching event${total === 1 ? "" : "s"}`}</h2></div><label className="text-xs font-extrabold tracking-[.08em] text-[#708098] uppercase">Rows per page<select value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(0); }} className="ml-2 h-11 rounded-lg border border-[#dfd1bf] bg-white px-2 text-sm font-semibold normal-case tracking-normal text-[#10253e] outline-none focus:border-[#397563] focus:ring-2 focus:ring-[#b9d7ca]"><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></label></div>
      {list.isLoading ? <div className="grid min-h-72 place-items-center"><Loader2 className="animate-spin text-[#397563]" /></div> : list.error ? <div className="p-6"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Audit logs are unavailable</AlertTitle><AlertDescription>Refresh the page or try again shortly.</AlertDescription></Alert></div> : !rows.length ? <div className="grid min-h-72 place-items-center px-6 text-center"><div><Filter className="mx-auto text-[#aab5c1]" size={30} /><h3 className="mt-4 font-display text-3xl text-[#10253e]">No matching audit records</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#53657a]">Try clearing or changing filters. The system does not invent events when none exist.</p></div></div> : <div className="overflow-x-auto"><table className="min-w-[1080px] w-full border-collapse text-left"><thead className="bg-[#f7f2e9] text-[11px] font-extrabold tracking-[.08em] text-[#53657a] uppercase"><tr>{isFounder && source === "archive" ? <th className="w-14 px-4 py-4"><span className="sr-only">Select for restore</span></th> : null}<th className="px-4 py-4">Local date / UTC</th><th className="px-4 py-4">User ID / role</th><th className="px-4 py-4">Action</th><th className="px-4 py-4">Target object</th><th className="px-4 py-4">IP address</th><th className="px-4 py-4">Browser / OS</th><th className="px-4 py-4">Result</th></tr></thead><tbody className="divide-y divide-[#f0e9df]">{rows.map(row => <tr key={`${row.source}-${row.id}`} className="bg-white align-top hover:bg-[#fcfaf5]">{isFounder && source === "archive" ? <td className="px-4 py-4"><Checkbox checked={selectedArchiveIds.includes(row.id)} onCheckedChange={() => toggleArchive(row.id)} aria-label={`Select archived audit record ${row.id} for restoration`} className="h-5 w-5 border-[#708098]" /></td> : null}<td className="px-4 py-4 text-xs leading-5 text-[#53657a]"><span className="block font-bold text-[#29415b]">{localDate(row.createdAt)}</span><span className="block">{new Date(row.createdAt).toISOString()}</span></td><td className="px-4 py-4 text-sm text-[#29415b]"><span className="block font-bold">{row.actorUserId ?? "System"}</span><span className="block text-xs text-[#708098]">{row.actorRole ?? "—"}</span></td><td className="px-4 py-4"><span className="inline-flex rounded-full bg-[#e9eef8] px-2.5 py-1 text-xs font-extrabold text-[#325c95] capitalize">{labelAction(row.action)}</span><p className="mt-2 max-w-[20rem] text-xs leading-5 text-[#53657a]">{row.description}</p></td><td className="px-4 py-4 text-sm text-[#29415b]"><span className="block font-bold">{row.targetType}</span><span className="block text-xs text-[#708098]">{row.targetId ?? "—"}{row.targetRole ? ` · ${row.targetRole}` : ""}</span></td><td className="px-4 py-4 font-mono text-xs text-[#53657a]">{row.ipAddress ?? "—"}</td><td className="px-4 py-4 text-xs leading-5 text-[#53657a]"><span className="block font-semibold text-[#29415b]">{row.browser ?? "Unknown"}</span><span className="block">{row.operatingSystem ?? "Unknown"}</span></td><td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold ${row.isSuccess ? "bg-[#e7f0eb] text-[#397563]" : "bg-[#fff0ed] text-[#a34732]"}`}>{row.isSuccess ? "Success" : "Failed"}</span></td></tr>)}</tbody></table></div>}
      {rows.length ? <footer className="flex flex-col gap-3 border-t border-[#eee4d7] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-[#53657a]">Page {page + 1} of {totalPages}</p><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setPage(current => Math.max(0, current - 1))} disabled={page === 0} className="min-h-12 border-[#d8cfbf] text-[#29415b]"><ChevronLeft size={16} />Previous</Button><Button type="button" variant="outline" onClick={() => setPage(current => Math.min(totalPages - 1, current + 1))} disabled={page + 1 >= totalPages} className="min-h-12 border-[#d8cfbf] text-[#29415b]">Next<ChevronRight size={16} /></Button></div></footer> : null}
    </section>
  </main>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly (readonly [string, string])[] }) { return <label className="block text-[11px] font-extrabold tracking-[.08em] text-[#708098] uppercase">{label}<select value={value} onChange={event => onChange(event.target.value)} className="mt-1 block h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#10253e] outline-none focus:border-[#397563] focus:ring-2 focus:ring-[#b9d7ca]">{options.map(([key, copy]) => <option key={key || "all"} value={key}>{copy}</option>)}</select></label>; }
function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-[11px] font-extrabold tracking-[.08em] text-[#708098] uppercase">{label}<input type="date" value={value} onChange={event => onChange(event.target.value)} className="mt-1 block h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#10253e] outline-none focus:border-[#397563] focus:ring-2 focus:ring-[#b9d7ca]" /></label>; }
