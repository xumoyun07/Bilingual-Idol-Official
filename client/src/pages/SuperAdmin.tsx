import { useAuth } from "@/_core/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DashboardLayout from "@/components/DashboardLayout";
import { ConfigurableCreateUserModal } from "@/components/ConfigurableCreateUserModal";
import { trpc } from "@/lib/trpc";
import AuditLogs from "./AuditLogs";
import { AlertCircle, ArrowUpRight, CalendarDays, Check, ChevronRight, CircleSlash, Filter, GraduationCap, Loader2, Megaphone, Plus, RotateCcw, Search, Shield, SlidersHorizontal, Trash2, UserPlus, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

const managedRoles = ["student", "teacher", "marketing", "admin"] as const;
type ManagedRole = (typeof managedRoles)[number];
type FilterStatus = "all" | "active" | "inactive";
type ModalMode = "create" | "detail" | null;
type AccountDraft = { name: string; nickname?: string; email?: string; password: string; role: ManagedRole | "super_admin"; isActive: boolean };
type ManagedAccount = { id: number; name: string | null; email: string | null; role: ManagedRole | "user"; isActive: boolean; openId: string; createdAt: Date; lastSignedIn: Date };

const blankDraft: AccountDraft = { name: "", nickname: "", email: "", password: "", role: "student", isActive: true };
const roleLabels: Record<ManagedRole | "user", string> = { user: "Legacy user", student: "Students", teacher: "Teachers", marketing: "Marketing", admin: "Admins" };
const singularRoleLabels: Record<ManagedRole | "user", string> = { user: "Legacy user", student: "Student", teacher: "Teacher", marketing: "Marketing", admin: "Admin" };
const roleTone: Record<ManagedRole | "user", string> = { user: "bg-[#edf0f4] text-[#596879]", student: "bg-[#e9eef8] text-[#325c95]", teacher: "bg-[#e8eeff] text-[#173fad]", marketing: "bg-[#fff0ed] text-[#a34732]", admin: "bg-[#f4eddd] text-[#705a30]" };
const categoryItems = [
  { role: "student" as const, icon: GraduationCap },
  { role: "teacher" as const, icon: UsersRound },
  { role: "marketing" as const, icon: Megaphone },
  { role: "admin" as const, icon: Shield },
];

export default function SuperAdmin() {
  const { user, loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    if (!user) {
      window.location.replace("/login");
    } else if (user.role !== "super_admin") {
      window.location.replace(user.role === "founder" ? "/admin" : "/dashboard");
    }
  }, [loading, user]);
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#fbf8f2]"><Loader2 className="animate-spin text-[#173fad]" /></div>;
  if (!user || user.role !== "super_admin") return null;
  return <DashboardLayout role="super_admin"><SuperAdminConsole /></DashboardLayout>;
}

function SuperAdminConsole() {
  const [location] = useLocation();
  if (location === "/super-admin/audit-logs") return <AuditLogs role="super_admin" />;
  return <div id="superadmin-dashboard-container" data-page="superadmin" className="workspace-page founder-command founder-workspace page-superadmin mx-auto w-full max-w-[88rem] pb-10">{location === "/super-admin/users" ? <SuperAdminUsersModule /> : <SuperAdminDashboard />}</div>;
}

function ModuleHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="founder-command-header"><div><p className="founder-command-eyebrow">{eyebrow}</p><h1 className="founder-command-title">{title}</h1><p className="founder-command-description">{description}</p></div>{action ? <div className="founder-command-action">{action}</div> : null}</header>;
}

function SuperAdminDashboard() {
  return <>
    <ModuleHeader eyebrow="Administration · Executive Overview" title="Central Platform Administration & Governance" description="Supreme authority dashboard for system-wide account control, institutional operations, staff governance, and audit verification." action={<Link href="/super-admin/users" className="compass-btn-primary inline-flex items-center gap-2"><UsersRound size={17} />Open Users<ArrowUpRight size={16} /></Link>} />
    <section className="founder-panel founder-panel-paper mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="founder-command-eyebrow">Primary task</p><h2 className="mt-2 font-display text-3xl text-[#10253e]">Institutional User & Staff Directory</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#53657a]">Search, review, issue, configure or remove administrator, marketing, instructor, and student accounts across the learning centre.</p></div><Link href="/super-admin/users" className="compass-btn-secondary inline-flex items-center gap-2"><UserPlus size={17} />Manage users<ChevronRight size={16} /></Link></section>
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
    <ModuleHeader eyebrow="Administration · User Directory" title="Central User & Staff Directory" description="Comprehensive directory of institutional administrators, instructors, marketing officers, and students with full access controls." action={<Button type="button" onClick={openCreate} className="compass-btn-primary gap-2"><Plus size={17} />New user</Button>} />
    <nav className="founder-panel founder-panel-paper mt-6 p-3" aria-label="User type modules"><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{categoryItems.map(({ role, icon: Icon }) => <button key={role} type="button" aria-pressed={category === role} onClick={() => chooseCategory(role)} className={`flex min-h-16 items-center gap-3 rounded-xl px-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173fad] ${category === role ? "bg-[#10253e] text-white" : "bg-[#faf6ef] text-[#29415b] hover:bg-[#eef4ff]"}`}><span className={`grid h-8 w-8 place-items-center rounded-lg ${category === role ? "bg-white/15 text-[#f3b59f]" : roleTone[role]}`}><Icon size={16} /></span><span><span className="block text-[11px] font-extrabold tracking-[.08em] uppercase opacity-70">Type</span><span className="block text-sm font-extrabold">{roleLabels[role]}</span></span></button>)}</div></nav>
    {/* UPGRADED MODERN FILTER SECTION */}
    <section className="founder-panel founder-panel-paper mt-6 rounded-2xl border border-[#dce4e7] bg-white p-5 sm:p-6 shadow-sm transition-all hover:border-[#cfd9de]" aria-label={`${roleLabels[category]} filters`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf2f4] pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef4ff] text-[#173fad]">
            <SlidersHorizontal size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#10253e] uppercase tracking-wider">{roleLabels[category]} directory filters</h2>
            <p className="text-xs text-[#53657a]">{list.isLoading ? "Refreshing directory…" : `${list.data?.total ?? 0} account${(list.data?.total ?? 0) === 1 ? "" : "s"} in this group`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {((search.trim() ? 1 : 0) + (status !== "all" ? 1 : 0) + (createdFrom ? 1 : 0) + (createdTo ? 1 : 0)) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#eef4ff] px-2.5 py-0.5 text-xs font-semibold text-[#173fad]">
              <Filter size={12} />
              {(search.trim() ? 1 : 0) + (status !== "all" ? 1 : 0) + (createdFrom ? 1 : 0) + (createdTo ? 1 : 0)} active
            </span>
          )}
          {((search.trim() ? 1 : 0) + (status !== "all" ? 1 : 0) + (createdFrom ? 1 : 0) + (createdTo ? 1 : 0)) > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-bold text-[#b4563c] transition-colors hover:bg-[#fff0ed] hover:border-[#efc4b8]"
            >
              <RotateCcw size={13} />
              <span>Reset all</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-12">
        {/* Search Input */}
        <div className="sm:col-span-2 lg:col-span-5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#53657a] mb-1.5">
            Search account
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#708098]" size={16} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="h-11 w-full rounded-xl border border-[#dce4e7] bg-[#f8fafb] pl-10 pr-9 text-sm text-[#10253e] transition-all placeholder:text-[#8c9ba8] focus:border-[#173fad] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173fad]/20"
              placeholder={`Search ${roleLabels[category].toLowerCase()} by name, email or ID…`}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#708098] hover:bg-[#edf2f4] hover:text-[#10253e]"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Status Select */}
        <div className="sm:col-span-1 lg:col-span-3">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#53657a] mb-1.5">
            Account Status
          </label>
          <div className="relative">
            <select
              value={status}
              onChange={event => setStatus(event.target.value as FilterStatus)}
              className="h-11 w-full appearance-none rounded-xl border border-[#dce4e7] bg-[#f8fafb] px-3.5 pr-8 text-sm font-medium text-[#10253e] transition-all focus:border-[#173fad] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173fad]/20"
            >
              <option value="all">All statuses</option>
              <option value="active">Active accounts</option>
              <option value="inactive">Paused / inactive</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#708098]">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>
        </div>

        {/* Date From */}
        <div className="sm:col-span-1 lg:col-span-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#53657a] mb-1.5">
            Created From
          </label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#708098]" size={14} />
            <input
              type="date"
              value={createdFrom}
              onChange={event => setCreatedFrom(event.target.value)}
              className="h-11 w-full rounded-xl border border-[#dce4e7] bg-[#f8fafb] pl-8 pr-7 text-xs font-semibold text-[#10253e] transition-all focus:border-[#173fad] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173fad]/20"
            />
            {createdFrom && (
              <button
                type="button"
                onClick={() => setCreatedFrom("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#708098] hover:bg-[#edf2f4]"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Date To */}
        <div className="sm:col-span-1 lg:col-span-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#53657a] mb-1.5">
            Created To
          </label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#708098]" size={14} />
            <input
              type="date"
              value={createdTo}
              onChange={event => setCreatedTo(event.target.value)}
              className="h-11 w-full rounded-xl border border-[#dce4e7] bg-[#f8fafb] pl-8 pr-7 text-xs font-semibold text-[#10253e] transition-all focus:border-[#173fad] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173fad]/20"
            />
            {createdTo && (
              <button
                type="button"
                onClick={() => setCreatedTo("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#708098] hover:bg-[#edf2f4]"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Applied Criteria Chips */}
      {((search.trim() ? 1 : 0) + (status !== "all" ? 1 : 0) + (createdFrom ? 1 : 0) + (createdTo ? 1 : 0)) > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#edf2f4] pt-3.5">
          <span className="text-xs font-semibold text-[#708098]">Applied filters:</span>
          {search.trim() && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#f0f4f8] px-2.5 py-1 text-xs font-medium text-[#10253e]">
              <span>Query: <strong>"{search}"</strong></span>
              <button type="button" onClick={() => setSearch("")} className="text-[#708098] hover:text-[#b4563c]"><X size={12} /></button>
            </span>
          )}
          {status !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#f0f4f8] px-2.5 py-1 text-xs font-medium text-[#10253e]">
              <span>Status: <strong>{status === "active" ? "Active" : "Inactive"}</strong></span>
              <button type="button" onClick={() => setStatus("all")} className="text-[#708098] hover:text-[#b4563c]"><X size={12} /></button>
            </span>
          )}
          {createdFrom && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#f0f4f8] px-2.5 py-1 text-xs font-medium text-[#10253e]">
              <span>From: <strong>{createdFrom}</strong></span>
              <button type="button" onClick={() => setCreatedFrom("")} className="text-[#708098] hover:text-[#b4563c]"><X size={12} /></button>
            </span>
          )}
          {createdTo && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#f0f4f8] px-2.5 py-1 text-xs font-medium text-[#10253e]">
              <span>To: <strong>{createdTo}</strong></span>
              <button type="button" onClick={() => setCreatedTo("")} className="text-[#708098] hover:text-[#b4563c]"><X size={12} /></button>
            </span>
          )}
        </div>
      )}
    </section>
    {mutationError && !modal ? <Alert variant="destructive" className="mt-5"><AlertCircle className="h-4 w-4" /><AlertTitle>Account action needs attention</AlertTitle><AlertDescription>{mutationError.message}</AlertDescription></Alert> : null}
    <section className="founder-panel founder-panel-paper mt-6 overflow-hidden p-0"><div className="border-b border-[#eee4d7] px-5 py-5"><h2 className="font-display text-3xl text-[#10253e]">{roleLabels[category]}</h2><p className="mt-1 text-sm text-[#53657a]">Open an account to view its authorised actions.</p></div>{list.isLoading ? <LoadingDirectory /> : list.error ? <DirectoryError /> : !list.data?.rows.length ? <EmptyDirectory role={roleLabels[category]} onCreate={openCreate} /> : <div className="divide-y divide-[#f0e9df]">{list.data.rows.map(account => <AccountRow key={account.id} account={account as ManagedAccount} onClick={() => { setSelectedId(account.id); setModal("detail"); }} />)}</div>}</section>
    <Dialog open={modal !== null} onOpenChange={open => { if (!open) closeModal(); }}><DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-1rem)] overflow-y-auto rounded-[1.25rem] border-[#dfd1bf] bg-[#fbf8f2] p-0 sm:max-w-2xl" showCloseButton={false}><SuperAdminUserModal mode={modal} selected={selected} loading={detail.isLoading} draft={draft} setDraft={setDraft} profileValues={profileValues} setProfileValues={setProfileValues} pending={create.isPending || update.isPending || remove.isPending} error={mutationError?.message} onSubmit={submit} onClose={closeModal} onDelete={() => selectedId && remove.mutate({ id: selectedId })} /></DialogContent></Dialog>
  </>;
}

function SuperAdminUserModal({ mode, selected, loading, draft, setDraft, profileValues, setProfileValues, pending, error, onSubmit, onClose, onDelete }: { mode: ModalMode; selected: ManagedAccount | undefined; loading: boolean; draft: AccountDraft; setDraft: (draft: AccountDraft) => void; profileValues: Record<string, string>; setProfileValues: (values: Record<string, string>) => void; pending: boolean; error?: string; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onClose: () => void; onDelete: () => void }) {
  if (mode === "detail" && loading) return <div className="grid min-h-80 place-items-center"><Loader2 className="animate-spin text-[#173fad]" /></div>;
  if (mode === "create") return <ConfigurableCreateUserModal draft={draft} setDraft={setDraft} profileValues={profileValues} setProfileValues={setProfileValues} pending={pending} error={error} onSubmit={onSubmit} onClose={onClose} scope="super_admin" />;
  return <form data-testid="users-modal-form" onSubmit={onSubmit}><DialogHeader className="border-b border-[#e6dccd] bg-white px-6 py-6 text-left"><p className="founder-command-eyebrow">Account profile</p><DialogTitle className="font-display text-4xl text-[#10253e]">Edit user</DialogTitle><DialogDescription className="max-w-xl text-[#53657a]">Update profile, type, password or active status within your operational scope.</DialogDescription></DialogHeader><div className="px-6 py-6">{error ? <Alert variant="destructive" className="mb-5"><AlertCircle className="h-4 w-4" /><AlertTitle>Account action needs attention</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}<div className="grid gap-4 sm:grid-cols-2"><TextField label="Full name" value={draft.name} onChange={value => setDraft({ ...draft, name: value })} required /><TextField label="E-mail" value={draft.email ?? ""} onChange={value => setDraft({ ...draft, email: value })} required type="email" /><label className="block text-xs font-extrabold text-[#53657a]">User type<select value={draft.role} onChange={event => setDraft({ ...draft, role: event.target.value as ManagedRole })} className="mt-1.5 h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm text-[#10253e] outline-none focus:border-[#173fad] focus:ring-2 focus:ring-[#c8d9f8]">{managedRoles.map(role => <option key={role} value={role}>{singularRoleLabels[role]}</option>)}</select></label><TextField label="New password (optional)" value={draft.password} onChange={value => setDraft({ ...draft, password: value })} type="password" hint="Minimum 10 characters. Stored only as a salted hash." /></div><label className="mt-4 flex min-h-14 items-center justify-between gap-4 rounded-xl border border-[#e1d5c4] bg-[#faf6ef] px-4 text-sm font-bold text-[#29415b]"><span><span className="block">Account active</span><span className="mt-0.5 block text-xs font-normal text-[#708098]">Inactive accounts cannot sign in with their password.</span></span><input aria-label="Account active" type="checkbox" checked={draft.isActive} onChange={event => setDraft({ ...draft, isActive: event.target.checked })} className="h-5 w-5 accent-[#173fad]" /></label>{selected ? <div className="mt-5 rounded-xl bg-[#f7f2e9] p-4 text-xs leading-5 text-[#53657a]"><p><span className="font-bold text-[#29415b]">Account ID:</span> {selected.openId}</p><p className="mt-1"><span className="font-bold text-[#29415b]">Issued:</span> {new Date(selected.createdAt).toLocaleString()}</p><p className="mt-1"><span className="font-bold text-[#29415b]">Last sign-in:</span> {new Date(selected.lastSignedIn).toLocaleString()}</p></div> : null}</div><DialogFooter className="border-t border-[#e6dccd] bg-white px-6 py-5"><div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="outline" disabled={pending} className="min-h-12 border-[#efc4b8] text-[#b4563c] hover:bg-[#fff0ed]"><Trash2 size={15} />Delete account</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this account?</AlertDialogTitle><AlertDialogDescription>This permanently removes the selected account.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep account</AlertDialogCancel><AlertDialogAction onClick={onDelete} className="bg-[#b4563c] hover:bg-[#923e2a]">Delete account</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog><div className="flex flex-col gap-2 sm:flex-row"><Button type="button" variant="outline" onClick={onClose} disabled={pending} className="min-h-12 border-[#d8cfbf] text-[#53657a] hover:bg-[#faf6ef]">Cancel</Button><Button type="submit" disabled={pending || !selected} className="compass-btn-primary min-h-12">{pending ? <Loader2 className="animate-spin" size={16} /> : null}Save changes</Button></div></div></DialogFooter></form>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) { return <label className="block text-[11px] font-extrabold tracking-[.08em] text-[#708098] uppercase">{label}<select value={value} onChange={event => onChange(event.target.value)} className="mt-1 block h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#10253e] outline-none focus:border-[#173fad] focus:ring-2 focus:ring-[#c8d9f8]">{options.map(([key, copy]) => <option key={key} value={key}>{copy}</option>)}</select></label>; }
function DateFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-[11px] font-extrabold tracking-[.08em] text-[#708098] uppercase">{label}<span className="relative mt-1 block"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#708098]" size={15} /><input type="date" value={value} onChange={event => onChange(event.target.value)} className="h-12 w-full rounded-xl border border-[#dfd1bf] bg-white pl-9 pr-2 text-sm font-semibold normal-case tracking-normal text-[#10253e] outline-none focus:border-[#173fad] focus:ring-2 focus:ring-[#c8d9f8]" /></span></label>; }
function TextField({ label, value, onChange, type = "text", required, hint }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; hint?: string }) { return <label className="block text-xs font-extrabold text-[#53657a]">{label}<input required={required} type={type} value={value} onChange={event => onChange(event.target.value)} className="mt-1.5 h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm text-[#10253e] outline-none focus:border-[#173fad] focus:ring-2 focus:ring-[#c8d9f8]" />{hint ? <span className="mt-1.5 block text-[11px] font-normal leading-4 text-[#708098]">{hint}</span> : null}</label>; }
function AccountRow({ account, onClick }: { account: ManagedAccount; onClick: () => void }) { return <button type="button" onClick={onClick} className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 bg-white px-5 py-4 text-left transition-colors hover:bg-[#faf6ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#173fad]"><span className="min-w-0"><span className="block truncate font-bold text-[#10253e]">{account.name || "Unnamed account"}</span><span className="mt-1 block truncate text-xs text-[#708098]">{account.email || "No e-mail"}</span></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${roleTone[account.role]}`}>{singularRoleLabels[account.role]}</span><span className={`inline-flex items-center gap-1 text-[11px] font-bold ${account.isActive ? "text-[#173fad]" : "text-[#9a5a47]"}`}>{account.isActive ? <Check size={13} /> : <CircleSlash size={13} />}{account.isActive ? "Active" : "Paused"}</span></button>; }
function LoadingDirectory() { return <div className="grid min-h-80 place-items-center"><Loader2 className="animate-spin text-[#173fad]" /></div>; }
function DirectoryError() { return <div className="p-8"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Directory unavailable</AlertTitle><AlertDescription>Refresh the page or try again shortly.</AlertDescription></Alert></div>; }
function EmptyDirectory({ role, onCreate }: { role: string; onCreate: () => void }) { return <div className="p-10 text-center"><UsersRound className="mx-auto text-[#aab5c1]" size={28} /><h3 className="mt-4 font-display text-3xl text-[#10253e]">No {role.toLowerCase()} yet</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#53657a]">Adjust the local filters or create an account for this part of the platform.</p><Button type="button" onClick={onCreate} className="compass-btn-primary mt-6"><Plus size={16} />Create user</Button></div>; }
