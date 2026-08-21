import { useAuth } from "@/_core/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { AlertCircle, ArrowUpRight, BarChart3, CalendarDays, Check, ChevronRight, CircleSlash, Filter, LayoutDashboard, Loader2, Pencil, Plus, Search, ShieldCheck, Trash2, UserPlus, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

const managedRoles = ["student", "teacher", "marketing", "admin", "super_admin"] as const;
type ManagedRole = (typeof managedRoles)[number];
type FilterRole = ManagedRole | "founder" | "all";
type FilterStatus = "all" | "active" | "inactive";
type AccountDraft = { name: string; email: string; password: string; role: ManagedRole; isActive: boolean };

const blankDraft: AccountDraft = { name: "", email: "", password: "", role: "student", isActive: true };
type VisibleRole = ManagedRole | "founder" | "user";
const roleLabels: Record<VisibleRole, string> = { user: "Legacy user", student: "Student", teacher: "Teacher", marketing: "Marketing", admin: "Admin", super_admin: "Super admin", founder: "Founder" };
const roleTone: Record<VisibleRole, string> = {
  user: "bg-[#edf0f4] text-[#596879]",
  student: "bg-[#e9eef8] text-[#325c95]", teacher: "bg-[#e7f0eb] text-[#397563]", marketing: "bg-[#fff0ed] text-[#a34732]", admin: "bg-[#f4eddd] text-[#705a30]", super_admin: "bg-[#efe8fb] text-[#6e4c9a]", founder: "bg-[#10253e] text-white",
};

export default function Admin() {
  const { user, loading } = useAuth();
  useEffect(() => { if (!loading && !user) window.location.href = "/login"; }, [loading, user]);
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#fbf8f2]"><Loader2 className="animate-spin text-[#397563]" /></div>;
  if (!user) return null;
  if (user.role !== "founder") return <FounderDenied />;
  return <DashboardLayout><FounderConsole /></DashboardLayout>;
}

function FounderDenied() {
  return <div className="grid min-h-screen place-items-center bg-[#fbf8f2] p-5"><div className="max-w-md rounded-[1.5rem] border border-[#f0c8bb] bg-[#fff6f2] p-8 text-center"><ShieldCheck className="mx-auto text-[#c55e44]" size={34} /><h1 className="mt-5 font-display text-4xl text-[#10253e]">Founder access required</h1><p className="mt-3 text-sm leading-6 text-[#53657a]">This two-module console is reserved for the Founder account.</p><Link href="/" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-[#10253e] px-5 text-sm font-extrabold text-white hover:bg-[#f07e5d] hover:text-[#10253e]">Return to website</Link></div></div>;
}

function FounderConsole() {
  const [location] = useLocation();
  const isUsers = location === "/admin/users";
  return <div className="founder-command founder-workspace mx-auto w-full max-w-[88rem] pb-10">
    {isUsers ? <UsersModule /> : <DashboardModule />}
  </div>;
}

function ModuleHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="founder-command-header"><div><p className="founder-command-eyebrow">{eyebrow}</p><h1 className="founder-command-title">{title}</h1><p className="founder-command-description">{description}</p></div>{action ? <div className="founder-command-action">{action}</div> : null}</header>;
}

const widgetZones = [
  { icon: BarChart3, label: "Metric widgets", description: "KPI cards and change indicators will connect to an approved analytics source." },
  { icon: LayoutDashboard, label: "Insight widgets", description: "Charts and distributions have a typed, empty-state-ready slot." },
  { icon: CircleSlash, label: "Quick actions", description: "Permission-aware operational shortcuts can be added without changing the shell." },
];

function DashboardModule() {
  return <>
    <ModuleHeader eyebrow="Founder console · Dashboard" title="A calm base for the next decisions." description="This dashboard is ready for real analytics, chart widgets and permission-aware quick actions. No invented activity or performance numbers are shown." action={<Link href="/admin/users" className="compass-btn-primary inline-flex items-center gap-2"><UsersRound size={17} />Open Users<ArrowUpRight size={16} /></Link>} />
    <section className="mt-6 grid gap-4 lg:grid-cols-3" aria-label="Future dashboard widget zones">
      {widgetZones.map(({ icon: Icon, label, description }) => <article key={label} className="founder-panel founder-panel-paper min-h-56"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e7f0eb] text-[#397563]"><Icon size={20} /></span><h2 className="mt-8 font-display text-3xl text-[#10253e]">{label}</h2><p className="mt-3 text-sm leading-6 text-[#53657a]">{description}</p><span className="mt-7 inline-flex rounded-full border border-[#d8cfbf] px-3 py-1 text-[11px] font-extrabold tracking-[.08em] text-[#708098] uppercase">Data source pending</span></article>)}
    </section>
    <section className="founder-panel founder-panel-sand mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="founder-command-eyebrow">Quick action</p><h2 className="mt-2 font-display text-3xl text-[#10253e]">Manage the platform’s access.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#53657a]">Create, review, filter, update and safely remove issued accounts from one protected workspace.</p></div><Link href="/admin/users" className="compass-btn-secondary inline-flex items-center gap-2"><UserPlus size={17} />Manage users<ChevronRight size={16} /></Link></section>
    <section className="founder-state founder-state-empty mt-6"><p className="font-semibold text-[#10253e]">Analytics is intentionally empty.</p><p className="mt-1 text-sm leading-6 text-[#53657a]">Connect a confirmed analytics source later; the dashboard accepts metric, insight and quick-action widget contracts without an interface rewrite.</p></section>
  </>;
}

function UsersModule() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<FilterRole>("all");
  const [status, setStatus] = useState<FilterStatus>("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<AccountDraft>(blankDraft);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const input = useMemo(() => ({ query: search.trim() || undefined, role: role === "all" ? undefined : role, isActive: status === "all" ? undefined : status === "active", createdFrom: createdFrom || undefined, createdTo: createdTo || undefined, page: 0, pageSize: 50 }), [search, role, status, createdFrom, createdTo]);
  const list = trpc.users.list.useQuery(input);
  const detail = trpc.users.byId.useQuery({ id: selectedId ?? 1 }, { enabled: selectedId !== null });
  const invalidate = async () => { await Promise.all([utils.users.list.invalidate(), utils.users.byId.invalidate()]); };
  const create = trpc.users.create.useMutation({ onSuccess: async account => { setSelectedId(account.id); setMode("edit"); setDraft({ name: account.name ?? "", email: account.email ?? "", password: "", role: account.role as ManagedRole, isActive: account.isActive }); await invalidate(); } });
  const update = trpc.users.update.useMutation({ onSuccess: async account => { await invalidate(); setSelectedId(account.id); } });
  const remove = trpc.users.remove.useMutation({ onSuccess: async () => { await invalidate(); resetCreate(); } });

  useEffect(() => {
    if (!detail.data || detail.data.role === "founder") return;
    setMode("edit");
    setDraft({ name: detail.data.name ?? "", email: detail.data.email ?? "", password: "", role: detail.data.role as ManagedRole, isActive: detail.data.isActive });
  }, [detail.data]);

  function resetCreate() { setSelectedId(null); setMode("create"); setDraft(blankDraft); }
  function openAccount(id: number) { setSelectedId(id); }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "create") create.mutate(draft);
    else if (selectedId) update.mutate({ id: selectedId, ...draft });
  }
  const mutationError = create.error ?? update.error ?? remove.error;
  const selectedFounder = detail.data?.role === "founder";

  return <>
    <ModuleHeader eyebrow="Founder console · Users" title="One clear view of every account." description="Issue access, tune permissions and keep the account directory accurate. Founder records are visibly protected from changes and deletion." action={<Button type="button" onClick={resetCreate} className="compass-btn-primary gap-2"><Plus size={17} />New user</Button>} />
    <section className="founder-panel founder-panel-paper mt-6"><div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_11rem_11rem_10rem_10rem]"><label className="relative block"><span className="sr-only">Search users</span><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#708098]" size={17} /><input value={search} onChange={event => setSearch(event.target.value)} className="h-12 w-full rounded-xl border border-[#dfd1bf] bg-white pl-10 pr-3 text-sm text-[#10253e] outline-none focus:border-[#397563] focus:ring-2 focus:ring-[#b9d7ca]" placeholder="Search name, e-mail, ID or sign-in method" /></label><FilterSelect label="Role" value={role} onChange={value => setRole(value as FilterRole)} options={[['all', 'All roles'], ['student', 'Student'], ['teacher', 'Teacher'], ['marketing', 'Marketing'], ['admin', 'Admin'], ['super_admin', 'Super admin'], ['founder', 'Founder']]} /><FilterSelect label="Status" value={status} onChange={value => setStatus(value as FilterStatus)} options={[['all', 'All status'], ['active', 'Active'], ['inactive', 'Inactive']]} /><DateFilter label="From" value={createdFrom} onChange={setCreatedFrom} /><DateFilter label="To" value={createdTo} onChange={setCreatedTo} /></div><div className="mt-4 flex items-center justify-between gap-3"><p className="text-sm text-[#53657a]">{list.isLoading ? "Refreshing directory…" : `${list.data?.total ?? 0} account${(list.data?.total ?? 0) === 1 ? "" : "s"} found`}</p><button type="button" onClick={() => { setSearch(""); setRole("all"); setStatus("all"); setCreatedFrom(""); setCreatedTo(""); }} className="inline-flex min-h-12 items-center gap-2 rounded-full px-3 text-xs font-extrabold text-[#397563] hover:bg-[#e7f0eb]"><X size={15} />Clear filters</button></div></section>
    {mutationError ? <Alert variant="destructive" className="mt-5"><AlertCircle className="h-4 w-4" /><AlertTitle>Account action needs attention</AlertTitle><AlertDescription>{mutationError.message}</AlertDescription></Alert> : null}
    <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,.75fr)]"><div className="founder-panel founder-panel-paper overflow-hidden p-0"><div className="border-b border-[#eee4d7] px-5 py-5"><h2 className="font-display text-3xl text-[#10253e]">Directory</h2><p className="mt-1 text-sm text-[#53657a]">Select a row to see details and make an authorised change.</p></div>{list.isLoading ? <LoadingDirectory /> : list.error ? <DirectoryError /> : !list.data?.rows.length ? <EmptyDirectory /> : <div className="divide-y divide-[#f0e9df]">{list.data.rows.map(account => <AccountRow key={account.id} account={account} selected={account.id === selectedId} onClick={() => openAccount(account.id)} />)}</div>}</div><UserEditor mode={mode} draft={draft} setDraft={setDraft} selected={detail.data} loading={detail.isLoading} founderProtected={selectedFounder} pending={create.isPending || update.isPending || remove.isPending} onSubmit={submit} onCancel={resetCreate} onDelete={() => selectedId && remove.mutate({ id: selectedId })} /></section>
  </>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) { return <label className="block text-[11px] font-extrabold tracking-[.08em] text-[#708098] uppercase">{label}<select value={value} onChange={event => onChange(event.target.value)} className="mt-1 block h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#10253e] outline-none focus:border-[#397563] focus:ring-2 focus:ring-[#b9d7ca]">{options.map(([key, copy]) => <option key={key} value={key}>{copy}</option>)}</select></label>; }
function DateFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-[11px] font-extrabold tracking-[.08em] text-[#708098] uppercase">{label}<span className="relative mt-1 block"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#708098]" size={15} /><input type="date" value={value} onChange={event => onChange(event.target.value)} className="h-12 w-full rounded-xl border border-[#dfd1bf] bg-white pl-9 pr-2 text-sm font-semibold normal-case tracking-normal text-[#10253e] outline-none focus:border-[#397563] focus:ring-2 focus:ring-[#b9d7ca]" /></span></label>; }
function AccountRow({ account, selected, onClick }: { account: { id: number; name: string | null; email: string | null; role: VisibleRole; isActive: boolean; createdAt: Date }; selected: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={`grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[#faf6ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#397563] ${selected ? "bg-[#e7f0eb]" : "bg-white"}`}><span className="min-w-0"><span className="block truncate font-bold text-[#10253e]">{account.name || "Unnamed account"}</span><span className="mt-1 block truncate text-xs text-[#708098]">{account.email || "No e-mail"}</span></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${roleTone[account.role]}`}>{roleLabels[account.role]}</span><span className={`inline-flex items-center gap-1 text-[11px] font-bold ${account.isActive ? "text-[#397563]" : "text-[#9a5a47]"}`}>{account.isActive ? <Check size={13} /> : <CircleSlash size={13} />}{account.isActive ? "Active" : "Paused"}</span></button>; }
function UserEditor({ mode, draft, setDraft, selected, loading, founderProtected, pending, onSubmit, onCancel, onDelete }: { mode: "create" | "edit"; draft: AccountDraft; setDraft: (draft: AccountDraft) => void; selected: { id: number; name: string | null; email: string | null; role: string; openId: string; loginMethod: string | null; createdAt: Date; lastSignedIn: Date; isActive: boolean } | undefined; loading: boolean; founderProtected: boolean; pending: boolean; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onCancel: () => void; onDelete: () => void }) {
  if (mode === "edit" && loading) return <div className="founder-panel founder-panel-paper grid min-h-96 place-items-center"><Loader2 className="animate-spin text-[#397563]" /></div>;
  if (founderProtected && selected) return <article className="founder-panel founder-panel-ink"><ShieldCheck className="text-[#f3b59f]" size={24} /><p className="mt-7 text-xs font-extrabold tracking-[.1em] text-[#f3b59f] uppercase">Protected Founder account</p><h2 className="mt-2 font-display text-3xl">{selected.name || "Founder"}</h2><p className="mt-3 text-sm leading-6 text-white/75">Founder records remain visible in the directory but cannot be edited, paused or deleted through Users. This prevents loss of the highest platform authority.</p><div className="mt-7 border-t border-white/15 pt-5 text-xs text-white/65"><p>{selected.email}</p><p className="mt-2">Created {new Date(selected.createdAt).toLocaleDateString()}</p></div></article>;
  return <form data-testid="users-editor-form" onSubmit={onSubmit} className="founder-panel founder-panel-paper"><div className="flex items-start justify-between gap-4"><div><p className="founder-command-eyebrow">{mode === "create" ? "Issue new access" : "Account details"}</p><h2 className="mt-2 font-display text-3xl text-[#10253e]">{mode === "create" ? "New user" : "Edit user"}</h2></div>{mode === "edit" ? <Pencil className="text-[#397563]" size={21} /> : <UserPlus className="text-[#397563]" size={21} />}</div><div className="mt-6 grid gap-4"><TextField label="Full name" value={draft.name} onChange={value => setDraft({ ...draft, name: value })} required autoComplete="name" /><TextField label="E-mail" value={draft.email} onChange={value => setDraft({ ...draft, email: value })} required type="email" autoComplete="email" /><label className="block text-xs font-extrabold text-[#53657a]">Role<select value={draft.role} onChange={event => setDraft({ ...draft, role: event.target.value as ManagedRole })} className="mt-1.5 h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm text-[#10253e] outline-none focus:border-[#397563] focus:ring-2 focus:ring-[#b9d7ca]">{managedRoles.map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label><TextField label={mode === "create" ? "Initial password" : "New password (optional)"} value={draft.password} onChange={value => setDraft({ ...draft, password: value })} required={mode === "create"} type="password" autoComplete="new-password" hint="Minimum 10 characters. Stored only as a salted hash." /><label className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-[#e1d5c4] bg-[#faf6ef] px-4 text-sm font-bold text-[#29415b]"><span><span className="block">Account active</span><span className="mt-0.5 block text-xs font-normal text-[#708098]">Inactive accounts cannot sign in with their password.</span></span><input type="checkbox" checked={draft.isActive} onChange={event => setDraft({ ...draft, isActive: event.target.checked })} className="h-5 w-5 accent-[#397563]" /></label></div>{mode === "edit" && selected ? <div className="mt-5 rounded-xl bg-[#f7f2e9] p-4 text-xs leading-5 text-[#53657a]"><p><span className="font-bold text-[#29415b]">Account ID:</span> {selected.openId}</p><p className="mt-1"><span className="font-bold text-[#29415b]">Issued:</span> {new Date(selected.createdAt).toLocaleString()}</p><p className="mt-1"><span className="font-bold text-[#29415b]">Last sign-in:</span> {new Date(selected.lastSignedIn).toLocaleString()}</p></div> : null}<div className="mt-6 flex flex-col gap-3"><Button type="submit" disabled={pending || (mode === "edit" && !selected)} className="compass-btn-primary w-full">{pending ? <Loader2 className="animate-spin" size={16} /> : null}{mode === "create" ? "Create user" : "Save changes"}</Button><Button type="button" variant="outline" onClick={onCancel} disabled={pending} className="min-h-12 border-[#d8cfbf] text-[#53657a] hover:bg-[#faf6ef]">{mode === "create" ? "Clear form" : "Cancel edit"}</Button>{mode === "edit" ? <AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="outline" disabled={pending || !selected} className="min-h-12 border-[#efc4b8] text-[#b4563c] hover:bg-[#fff0ed]"><Trash2 size={15} />Delete account</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this account?</AlertDialogTitle><AlertDialogDescription>This permanently removes the selected account. Existing centre content is not attached to user records and will remain unchanged.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep account</AlertDialogCancel><AlertDialogAction onClick={onDelete} className="bg-[#b4563c] hover:bg-[#923e2a]">Delete account</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog> : null}</div></form>;
}
function TextField({ label, value, onChange, type = "text", required, hint, autoComplete }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; hint?: string; autoComplete?: string }) { return <label className="block text-xs font-extrabold text-[#53657a]">{label}<input required={required} type={type} autoComplete={autoComplete} value={value} onChange={event => onChange(event.target.value)} className="mt-1.5 h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm text-[#10253e] outline-none focus:border-[#397563] focus:ring-2 focus:ring-[#b9d7ca]" />{hint ? <span className="mt-1.5 block text-[11px] font-normal leading-4 text-[#708098]">{hint}</span> : null}</label>; }
function LoadingDirectory() { return <div className="grid min-h-80 place-items-center"><Loader2 className="animate-spin text-[#397563]" /></div>; }
function DirectoryError() { return <div className="p-8"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Directory unavailable</AlertTitle><AlertDescription>Refresh the page or try again shortly.</AlertDescription></Alert></div>; }
function EmptyDirectory() { return <div className="p-10 text-center"><UsersRound className="mx-auto text-[#aab5c1]" size={28} /><h3 className="mt-4 font-display text-3xl text-[#10253e]">No matching accounts</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#53657a]">Adjust the search or filters, or issue an account with the New user action.</p></div>; }
