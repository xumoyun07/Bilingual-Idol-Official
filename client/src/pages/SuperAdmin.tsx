import { useAuth } from "@/_core/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DashboardLayout from "@/components/DashboardLayout";
import { ConfigurableCreateUserModal } from "@/components/ConfigurableCreateUserModal";
import { trpc } from "@/lib/trpc";
import AuditLogs from "./AuditLogs";
import { AlertCircle, ArrowUpRight, CalendarDays, Check, ChevronRight, CircleSlash, GraduationCap, Loader2, Megaphone, Plus, Search, Shield, Trash2, UserPlus, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

const managedRoles = ["student", "teacher", "marketing", "admin"] as const;
type ManagedRole = (typeof managedRoles)[number];
type FilterStatus = "all" | "active" | "inactive";
type ModalMode = "create" | "detail" | null;
type AccountDraft = { name: string; email: string; password: string; role: ManagedRole | "super_admin"; isActive: boolean };
type ManagedAccount = { id: number; name: string | null; email: string | null; role: ManagedRole | "user"; isActive: boolean; openId: string; createdAt: Date; lastSignedIn: Date };

const blankDraft: AccountDraft = { name: "", email: "", password: "", role: "student", isActive: true };
const roleLabels: Record<ManagedRole | "user", string> = { user: "Legacy user", student: "Students", teacher: "Teachers", marketing: "Marketing", admin: "Admins" };
const singularRoleLabels: Record<ManagedRole | "user", string> = { user: "Legacy user", student: "Student", teacher: "Teacher", marketing: "Marketing", admin: "Admin" };
const roleTone: Record<ManagedRole | "user", string> = { user: "bg-[#edf0f4] text-[#596879]", student: "bg-[#e9eef8] text-[#325c95]", teacher: "bg-[#e7f0eb] text-[#397563]", marketing: "bg-[#fff0ed] text-[#a34732]", admin: "bg-[#f4eddd] text-[#705a30]" };
const categoryItems = [
  { role: "student" as const, icon: GraduationCap },
  { role: "teacher" as const, icon: UsersRound },
  { role: "marketing" as const, icon: Megaphone },
  { role: "admin" as const, icon: Shield },
];

export default function SuperAdmin() {
  const { user, loading } = useAuth();
  useEffect(() => {
    if (!loading && !user) window.location.replace("/login");
    else if (!loading && user?.role !== "super_admin") window.location.replace(user?.role === "founder" ? "/admin" : "/dashboard");
  }, [loading, user]);
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#fbf8f2]"><Loader2 className="animate-spin text-[#397563]" /></div>;
  if (!user || user.role !== "super_admin") return null;
  return <DashboardLayout role="super_admin"><SuperAdminConsole /></DashboardLayout>;
}

function SuperAdminConsole() {
  const [location] = useLocation();
  if (location === "/super-admin/audit-logs") return <AuditLogs role="super_admin" />;
  return <div className="workspace-page founder-command founder-workspace mx-auto w-full max-w-[88rem] pb-10">{location === "/super-admin/users" ? <SuperAdminUsersModule /> : <SuperAdminDashboard />}</div>;
}

function ModuleHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="founder-command-header"><div><p className="founder-command-eyebrow">{eyebrow}</p><h1 className="founder-command-title">{title}</h1><p className="founder-command-description">{description}</p></div>{action ? <div className="founder-command-action">{action}</div> : null}</header>;
}

function SuperAdminDashboard() {
  return <>
    <ModuleHeader eyebrow="Operations · Dashboard" title="Manage issued accounts." description="This workspace provides scoped account management without exposing private control configuration or peer Super admin accounts." action={<Link href="/super-admin/users" className="compass-btn-primary inline-flex items-center gap-2"><UsersRound size={17} />Open Users<ArrowUpRight size={16} /></Link>} />
    <section className="founder-panel founder-panel-paper mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="founder-command-eyebrow">Primary task</p><h2 className="mt-2 font-display text-3xl text-[#10253e]">Open the people directory.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#53657a]">Search, review, issue, pause or remove accounts within your assigned operational scope.</p></div><Link href="/super-admin/users" className="compass-btn-secondary inline-flex items-center gap-2"><UserPlus size={17} />Manage users<ChevronRight size={16} /></Link></section>
  </>;
}

function SuperAdminUsersModule() {
  const utils = trpc.useUtils();
  const [category, setCategory] = useState<ManagedRole>("student");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<FilterStatus>("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<AccountDraft>(blankDraft);
  const [profileValues, setProfileValues] = useState<Record<string, string>>({});
  const input = useMemo(() => ({ query: search.trim() || undefined, role: category, isActive: status === "all" ? undefined : status === "active", createdFrom: createdFrom || undefined, createdTo: createdTo || undefined, page: 0, pageSize: 50 }), [category, createdFrom, createdTo, search, status]);
  const list = trpc.superAdminUsers.list.useQuery(input);
  const detail = trpc.superAdminUsers.byId.useQuery({ id: selectedId ?? 1 }, { enabled: modal === "detail" && selectedId !== null });
  const create = trpc.superAdminUsers.create.useMutation({ onSuccess: async account => { setCategory(account.role as ManagedRole); setSelectedId(account.id); setDraft(fromAccount(account)); setModal("detail"); await invalidate(); } });
  const update = trpc.superAdminUsers.update.useMutation({ onSuccess: async account => { setCategory(account.role as ManagedRole); setSelectedId(account.id); setDraft(fromAccount(account)); await invalidate(); } });
  const remove = trpc.superAdminUsers.remove.useMutation({ onSuccess: async () => { await invalidate(); closeModal(); } });
  const mutationError = create.error ?? update.error ?? remove.error;
  const selected = detail.data as ManagedAccount | undefined;

  async function invalidate() { await Promise.all([utils.superAdminUsers.list.invalidate(), utils.superAdminUsers.byId.invalidate()]); }
  function fromAccount(account: Pick<ManagedAccount, "name" | "email" | "isActive"> & { role: string }): AccountDraft { return { name: account.name ?? "", email: account.email ?? "", password: "", role: managedRoles.includes(account.role as ManagedRole) ? account.role as ManagedRole : "student", isActive: account.isActive }; }
  useEffect(() => { if (selected) setDraft(fromAccount(selected)); }, [selected?.id]);
  function chooseCategory(next: ManagedRole) { setCategory(next); setSearch(""); setStatus("all"); setCreatedFrom(""); setCreatedTo(""); setSelectedId(null); }
  function openCreate() { setSelectedId(null); setProfileValues({}); setDraft({ ...blankDraft, role: category }); setModal("create"); }
  function closeModal() { setModal(null); setSelectedId(null); setProfileValues({}); setDraft(blankDraft); }
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const role = draft.role === "super_admin" ? "student" : draft.role; if (modal === "create") create.mutate({ ...draft, role, profileValues }); else if (modal === "detail" && selectedId) update.mutate({ id: selectedId, ...draft, role }); }
  function clearFilters() { setSearch(""); setStatus("all"); setCreatedFrom(""); setCreatedTo(""); }

  return <>
    <ModuleHeader eyebrow="Operations · Users" title="People, managed within your scope." description="Review and manage operational accounts. Super admin accounts are not shown and cannot be created, updated or removed here." action={<Button type="button" onClick={openCreate} className="compass-btn-primary gap-2"><Plus size={17} />New user</Button>} />
    <nav className="founder-panel founder-panel-paper mt-6 p-3" aria-label="User type modules"><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{categoryItems.map(({ role, icon: Icon }) => <button key={role} type="button" aria-pressed={category === role} onClick={() => chooseCategory(role)} className={`flex min-h-16 items-center gap-3 rounded-xl px-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#397563] ${category === role ? "bg-[#10253e] text-white" : "bg-[#faf6ef] text-[#29415b] hover:bg-[#e7f0eb]"}`}><span className={`grid h-8 w-8 place-items-center rounded-lg ${category === role ? "bg-white/15 text-[#f3b59f]" : roleTone[role]}`}><Icon size={16} /></span><span><span className="block text-[11px] font-extrabold tracking-[.08em] uppercase opacity-70">Type</span><span className="block text-sm font-extrabold">{roleLabels[role]}</span></span></button>)}</div></nav>
    <section className="founder-panel founder-panel-paper mt-4"><div className="flex flex-col gap-1 border-b border-[#eee4d7] pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="founder-command-eyebrow">{roleLabels[category]} module</p><h2 className="mt-2 font-display text-3xl text-[#10253e]">{roleLabels[category]} directory</h2></div><p className="text-sm text-[#53657a]">{list.isLoading ? "Refreshing directory…" : `${list.data?.total ?? 0} account${(list.data?.total ?? 0) === 1 ? "" : "s"} in this type`}</p></div><div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_11rem_10rem_10rem]"><label className="relative block"><span className="sr-only">Search {roleLabels[category]}</span><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#708098]" size={17} /><input value={search} onChange={event => setSearch(event.target.value)} className="h-12 w-full rounded-xl border border-[#dfd1bf] bg-white pl-10 pr-3 text-sm text-[#10253e] outline-none focus:border-[#397563] focus:ring-2 focus:ring-[#b9d7ca]" placeholder={`Search ${roleLabels[category].toLowerCase()} by name, e-mail or ID`} /></label><FilterSelect label="Status" value={status} onChange={value => setStatus(value as FilterStatus)} options={[["all", "All status"], ["active", "Active"], ["inactive", "Inactive"]]} /><DateFilter label="From" value={createdFrom} onChange={setCreatedFrom} /><DateFilter label="To" value={createdTo} onChange={setCreatedTo} /></div><div className="mt-4 flex justify-end"><button type="button" onClick={clearFilters} className="inline-flex min-h-12 items-center gap-2 rounded-full px-3 text-xs font-extrabold text-[#397563] hover:bg-[#e7f0eb]"><X size={15} />Clear {roleLabels[category].toLowerCase()} filters</button></div></section>
    {mutationError && !modal ? <Alert variant="destructive" className="mt-5"><AlertCircle className="h-4 w-4" /><AlertTitle>Account action needs attention</AlertTitle><AlertDescription>{mutationError.message}</AlertDescription></Alert> : null}
    <section className="founder-panel founder-panel-paper mt-6 overflow-hidden p-0"><div className="border-b border-[#eee4d7] px-5 py-5"><h2 className="font-display text-3xl text-[#10253e]">{roleLabels[category]}</h2><p className="mt-1 text-sm text-[#53657a]">Open an account to view its authorised actions.</p></div>{list.isLoading ? <LoadingDirectory /> : list.error ? <DirectoryError /> : !list.data?.rows.length ? <EmptyDirectory role={roleLabels[category]} onCreate={openCreate} /> : <div className="divide-y divide-[#f0e9df]">{list.data.rows.map(account => <AccountRow key={account.id} account={account as ManagedAccount} onClick={() => { setSelectedId(account.id); setModal("detail"); }} />)}</div>}</section>
    <Dialog open={modal !== null} onOpenChange={open => { if (!open) closeModal(); }}><DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-1rem)] overflow-y-auto rounded-[1.25rem] border-[#dfd1bf] bg-[#fbf8f2] p-0 sm:max-w-2xl" showCloseButton={false}><SuperAdminUserModal mode={modal} selected={selected} loading={detail.isLoading} draft={draft} setDraft={setDraft} profileValues={profileValues} setProfileValues={setProfileValues} pending={create.isPending || update.isPending || remove.isPending} error={mutationError?.message} onSubmit={submit} onClose={closeModal} onDelete={() => selectedId && remove.mutate({ id: selectedId })} /></DialogContent></Dialog>
  </>;
}

function SuperAdminUserModal({ mode, selected, loading, draft, setDraft, profileValues, setProfileValues, pending, error, onSubmit, onClose, onDelete }: { mode: ModalMode; selected: ManagedAccount | undefined; loading: boolean; draft: AccountDraft; setDraft: (draft: AccountDraft) => void; profileValues: Record<string, string>; setProfileValues: (values: Record<string, string>) => void; pending: boolean; error?: string; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onClose: () => void; onDelete: () => void }) {
  if (mode === "detail" && loading) return <div className="grid min-h-80 place-items-center"><Loader2 className="animate-spin text-[#397563]" /></div>;
  if (mode === "create") return <ConfigurableCreateUserModal draft={draft} setDraft={setDraft} profileValues={profileValues} setProfileValues={setProfileValues} pending={pending} error={error} onSubmit={onSubmit} onClose={onClose} scope="super_admin" />;
  return <form data-testid="users-modal-form" onSubmit={onSubmit}><DialogHeader className="border-b border-[#e6dccd] bg-white px-6 py-6 text-left"><p className="founder-command-eyebrow">Account profile</p><DialogTitle className="font-display text-4xl text-[#10253e]">Edit user</DialogTitle><DialogDescription className="max-w-xl text-[#53657a]">Update profile, type, password or active status within your operational scope.</DialogDescription></DialogHeader><div className="px-6 py-6">{error ? <Alert variant="destructive" className="mb-5"><AlertCircle className="h-4 w-4" /><AlertTitle>Account action needs attention</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}<div className="grid gap-4 sm:grid-cols-2"><TextField label="Full name" value={draft.name} onChange={value => setDraft({ ...draft, name: value })} required /><TextField label="E-mail" value={draft.email} onChange={value => setDraft({ ...draft, email: value })} required type="email" /><label className="block text-xs font-extrabold text-[#53657a]">User type<select value={draft.role} onChange={event => setDraft({ ...draft, role: event.target.value as ManagedRole })} className="mt-1.5 h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm text-[#10253e] outline-none focus:border-[#397563] focus:ring-2 focus:ring-[#b9d7ca]">{managedRoles.map(role => <option key={role} value={role}>{singularRoleLabels[role]}</option>)}</select></label><TextField label="New password (optional)" value={draft.password} onChange={value => setDraft({ ...draft, password: value })} type="password" hint="Minimum 10 characters. Stored only as a salted hash." /></div><label className="mt-4 flex min-h-14 items-center justify-between gap-4 rounded-xl border border-[#e1d5c4] bg-[#faf6ef] px-4 text-sm font-bold text-[#29415b]"><span><span className="block">Account active</span><span className="mt-0.5 block text-xs font-normal text-[#708098]">Inactive accounts cannot sign in with their password.</span></span><input aria-label="Account active" type="checkbox" checked={draft.isActive} onChange={event => setDraft({ ...draft, isActive: event.target.checked })} className="h-5 w-5 accent-[#397563]" /></label>{selected ? <div className="mt-5 rounded-xl bg-[#f7f2e9] p-4 text-xs leading-5 text-[#53657a]"><p><span className="font-bold text-[#29415b]">Account ID:</span> {selected.openId}</p><p className="mt-1"><span className="font-bold text-[#29415b]">Issued:</span> {new Date(selected.createdAt).toLocaleString()}</p><p className="mt-1"><span className="font-bold text-[#29415b]">Last sign-in:</span> {new Date(selected.lastSignedIn).toLocaleString()}</p></div> : null}</div><DialogFooter className="border-t border-[#e6dccd] bg-white px-6 py-5"><div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="outline" disabled={pending} className="min-h-12 border-[#efc4b8] text-[#b4563c] hover:bg-[#fff0ed]"><Trash2 size={15} />Delete account</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this account?</AlertDialogTitle><AlertDialogDescription>This permanently removes the selected account.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep account</AlertDialogCancel><AlertDialogAction onClick={onDelete} className="bg-[#b4563c] hover:bg-[#923e2a]">Delete account</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog><div className="flex flex-col gap-2 sm:flex-row"><Button type="button" variant="outline" onClick={onClose} disabled={pending} className="min-h-12 border-[#d8cfbf] text-[#53657a] hover:bg-[#faf6ef]">Cancel</Button><Button type="submit" disabled={pending || !selected} className="compass-btn-primary min-h-12">{pending ? <Loader2 className="animate-spin" size={16} /> : null}Save changes</Button></div></div></DialogFooter></form>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) { return <label className="block text-[11px] font-extrabold tracking-[.08em] text-[#708098] uppercase">{label}<select value={value} onChange={event => onChange(event.target.value)} className="mt-1 block h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#10253e] outline-none focus:border-[#397563] focus:ring-2 focus:ring-[#b9d7ca]">{options.map(([key, copy]) => <option key={key} value={key}>{copy}</option>)}</select></label>; }
function DateFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-[11px] font-extrabold tracking-[.08em] text-[#708098] uppercase">{label}<span className="relative mt-1 block"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#708098]" size={15} /><input type="date" value={value} onChange={event => onChange(event.target.value)} className="h-12 w-full rounded-xl border border-[#dfd1bf] bg-white pl-9 pr-2 text-sm font-semibold normal-case tracking-normal text-[#10253e] outline-none focus:border-[#397563] focus:ring-2 focus:ring-[#b9d7ca]" /></span></label>; }
function TextField({ label, value, onChange, type = "text", required, hint }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; hint?: string }) { return <label className="block text-xs font-extrabold text-[#53657a]">{label}<input required={required} type={type} value={value} onChange={event => onChange(event.target.value)} className="mt-1.5 h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm text-[#10253e] outline-none focus:border-[#397563] focus:ring-2 focus:ring-[#b9d7ca]" />{hint ? <span className="mt-1.5 block text-[11px] font-normal leading-4 text-[#708098]">{hint}</span> : null}</label>; }
function AccountRow({ account, onClick }: { account: ManagedAccount; onClick: () => void }) { return <button type="button" onClick={onClick} className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 bg-white px-5 py-4 text-left transition-colors hover:bg-[#faf6ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#397563]"><span className="min-w-0"><span className="block truncate font-bold text-[#10253e]">{account.name || "Unnamed account"}</span><span className="mt-1 block truncate text-xs text-[#708098]">{account.email || "No e-mail"}</span></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${roleTone[account.role]}`}>{singularRoleLabels[account.role]}</span><span className={`inline-flex items-center gap-1 text-[11px] font-bold ${account.isActive ? "text-[#397563]" : "text-[#9a5a47]"}`}>{account.isActive ? <Check size={13} /> : <CircleSlash size={13} />}{account.isActive ? "Active" : "Paused"}</span></button>; }
function LoadingDirectory() { return <div className="grid min-h-80 place-items-center"><Loader2 className="animate-spin text-[#397563]" /></div>; }
function DirectoryError() { return <div className="p-8"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Directory unavailable</AlertTitle><AlertDescription>Refresh the page or try again shortly.</AlertDescription></Alert></div>; }
function EmptyDirectory({ role, onCreate }: { role: string; onCreate: () => void }) { return <div className="p-10 text-center"><UsersRound className="mx-auto text-[#aab5c1]" size={28} /><h3 className="mt-4 font-display text-3xl text-[#10253e]">No {role.toLowerCase()} yet</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#53657a]">Adjust the local filters or create an account for this part of the platform.</p><Button type="button" onClick={onCreate} className="compass-btn-primary mt-6"><Plus size={16} />Create user</Button></div>; }
