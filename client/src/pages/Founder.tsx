import { useAuth } from "@/_core/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DashboardLayout, { ModuleSkeleton, ModuleEmptyState, ModuleErrorState, DashboardContentArea } from "@/components/DashboardLayout";
import { ConfigurableCreateUserModal } from "@/components/ConfigurableCreateUserModal";
import { DynamicUserProfileFields, type DynamicField, type DynamicSection } from "@/components/DynamicUserProfileFields";
import { UserFieldBuilder } from "@/components/UserFieldBuilder";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import AuditLogs from "./AuditLogs";
import {
  PlatformUserType,
} from "@/components/founder/FounderNavTypes";
import { useFounderNav } from "@/components/founder/useFounderNav";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronRight,
  CircleSlash,
  Crown,
  Filter,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ScrollText,
  Settings2,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

const managedRoles = ["student", "teacher", "marketing", "admin", "super_admin"] as const;
type ManagedRole = (typeof managedRoles)[number];
type CategoryRole = ManagedRole;
type VisibleRole = CategoryRole | "user";
type FilterStatus = "all" | "active" | "inactive";
type ModalMode = "create" | "detail" | null;
type AccountDraft = { name: string; nickname?: string; email?: string; password: string; role: ManagedRole; isActive: boolean };
type ManagedAccount = { id: number; name: string | null; email: string | null; role: VisibleRole; isActive: boolean; openId: string; loginMethod: string | null; createdAt: Date; lastSignedIn: Date };

const blankDraft: AccountDraft = { name: "", nickname: "", email: "", password: "", role: "student", isActive: true };
const roleLabels: Record<VisibleRole, string> = { user: "Legacy user", student: "Students", teacher: "Teachers", marketing: "Marketing", admin: "Admins", super_admin: "Super admins" };
const singularRoleLabels: Record<VisibleRole, string> = { user: "Legacy user", student: "Student", teacher: "Teacher", marketing: "Marketing", admin: "Admin", super_admin: "Super admin" };
const roleTone: Record<VisibleRole, string> = { user: "bg-[#edf0f4] text-[#596879]", student: "bg-[#e9eef8] text-[#325c95]", teacher: "bg-[#e8eeff] text-[#173fad]", marketing: "bg-[#fff0ed] text-[#a34732]", admin: "bg-[#f4eddd] text-[#705a30]", super_admin: "bg-[#efe8fb] text-[#6e4c9a]" };
const categoryItems: { role: CategoryRole; icon: typeof UsersRound }[] = [
  { role: "student", icon: GraduationCap }, { role: "teacher", icon: UsersRound }, { role: "marketing", icon: Megaphone }, { role: "admin", icon: Shield }, { role: "super_admin", icon: ShieldCheck },
];

const STRATEGIC_PORTFOLIOS = [
  {
    id: "platform-gov",
    label: "Platform & Governance",
    icon: Crown,
    tone: "bg-[#fff8e6] text-[#b47d00] border-[#ffd580]",
    modules: [
      { id: "founder-overview", title: "Overview", icon: LayoutDashboard, role: "founder" },
      { id: "founder-users", title: "User Accounts", icon: UsersRound, role: "founder" },
      { id: "founder-audit", title: "Audit & Security", icon: ScrollText, role: "founder" },
    ],
  },
];

export default function Founder() {
  const { user, loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    if (!user) {
      window.location.replace("/login");
    } else if (user.role !== "founder" && user.role !== "admin") {
      window.location.replace(user.role === "super_admin" ? "/super-admin" : "/dashboard");
    }
  }, [loading, user]);
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#fbf8f2]"><Loader2 className="animate-spin text-[#173fad]" /></div>;
  if (!user || (user.role !== "founder" && user.role !== "admin")) return null;
  return <DashboardLayout><FounderConsole /></DashboardLayout>;
}

function FounderConsole() {
  const [location] = useLocation();
  const { td, isRTL } = useLanguage();
  const { activeRole, activeTab, navigateTo } = useFounderNav();

  const roleParam = activeRole;
  const tabParam = activeTab;

  // Canonical paths
  if (location === "/admin/audit-logs") return <AuditLogs role="founder" />;
  if (location === "/admin/users") return <UsersModule />;

  // Render module based on active Tab
  const renderActiveModule = () => {
    switch (tabParam) {
      case "founder-overview":
        return <DashboardModule />;
      case "founder-users":
      case "superadmin-users":
        return <UsersModule />;
      case "founder-audit":
      case "superadmin-audit":
        return <AuditLogs role="founder" />;
      default:
        return <DashboardModule />;
    }
  };

  const activePortfolio = STRATEGIC_PORTFOLIOS.find((port) =>
    port.modules.some((m) => m.id === tabParam)
  ) || STRATEGIC_PORTFOLIOS[0];

  const activeModule = activePortfolio.modules.find((m) => m.id === tabParam) || activePortfolio.modules[0];

  return (
    <div id="admin-dashboard-container" data-page="admin" className={`workspace-page founder-command w-full space-y-6 ${isRTL ? "dir-rtl" : ""}`}>
      {/* 1. Desktop Breadcrumb Scope Header (Completely eliminates duplicate buttons next to sidebar) */}
      <div className="hidden lg:flex items-center justify-between border-b border-[#edf2f5] pb-4 mb-2">
        <div className="flex items-center gap-2 text-xs text-[#566983] font-semibold tracking-tight">
          <span>{td("Platform Control Centre")}</span>
          <span className="text-[#a1b0cb] font-normal">/</span>
          <span className="text-[#566983] font-bold">{td(activePortfolio.label)}</span>
          <span className="text-[#a1b0cb] font-normal">/</span>
          <span className="text-[#173fad] font-extrabold">{td(activeModule.title)}</span>
        </div>
        <div className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
          ● {td("Verified Founder Session")}
        </div>
      </div>

      {/* 2. Mobile-Only Intelligent Portfolio & Module Selector (Consolidates 33 screens into 4 swipeable portfolios with inner dropdown) */}
      <div className="lg:hidden space-y-3 bg-[#fbf8f2]/40 p-4 rounded-2xl border border-[#edf2f5] shadow-xs">
        {/* Swipeable Portfolio Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth pb-0.5">
          {STRATEGIC_PORTFOLIOS.map((port) => {
            const isSelected = activePortfolio.id === port.id;
            const PortIcon = port.icon;
            return (
              <button
                key={port.id}
                type="button"
                onClick={() => navigateTo(port.modules[0].role as PlatformUserType, port.modules[0].id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[38px] ${
                  isSelected
                    ? "bg-[#10253e] text-white"
                    : "bg-white text-[#475569] border border-[#dfd1bf]/40 hover:bg-[#faf7f2]"
                }`}
              >
                <PortIcon size={13} className={isSelected ? "text-amber-300" : "text-[#64748b]"} />
                <span>{td(port.label)}</span>
              </button>
            );
          })}
        </div>

        {/* Compact Sub-Module Dropdown Selector (Limits scroll and groups related functions) */}
        <div className="flex items-center justify-between gap-3 border-t border-[#edf2f5] pt-3">
          <span className="text-[11px] font-bold text-[#708098] uppercase tracking-wider shrink-0">
            {td("Active Module:")}
          </span>
          <select
            value={tabParam}
            onChange={(e) => {
              const selectedMod = activePortfolio.modules.find((m) => m.id === e.target.value);
              if (selectedMod) {
                navigateTo(selectedMod.role as PlatformUserType, selectedMod.id);
              }
            }}
            className="flex-1 max-w-[220px] min-h-[36px] bg-white border border-[#dce4e7] rounded-xl text-xs font-bold text-[#10253e] px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#173fad]/20"
          >
            {activePortfolio.modules.map((mod) => (
              <option key={mod.id} value={mod.id}>
                {td(mod.title)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DashboardContentArea>
        {renderActiveModule()}
      </DashboardContentArea>
    </div>
  );
}

function ModuleHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  const { td } = useLanguage();
  return <header className="founder-command-header"><div><p className="founder-command-eyebrow">{td(eyebrow)}</p><h1 className="founder-command-title">{td(title)}</h1><p className="founder-command-description">{td(description)}</p></div>{action ? <div className="founder-command-action">{action}</div> : null}</header>;
}

function DashboardModule() {
  const { td } = useLanguage();

  return (
    <div className="w-full min-h-[500px] flex flex-col justify-center items-center text-center p-8 bg-white border border-[#eee4d7] rounded-2xl shadow-sm">
      <div className="p-4 rounded-full bg-[#faf7f2] border border-[#f0e6d6] text-[#708098] mb-4">
        <LayoutDashboard size={32} />
      </div>
      <h2 className="text-xl font-bold text-[#10253e] mb-2">
        {td("Founder Dashboard")}
      </h2>
      <p className="text-sm text-[#53657a] max-w-sm leading-relaxed">
        {td("Your founder command console is active and ready. This page is empty and prepared for future operational summaries and metrics.")}
      </p>
    </div>
  );
}

function UsersModule() {
  const { td } = useLanguage();
  const utils = trpc.useUtils();
  const [category, setCategory] = useState<CategoryRole>("student");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<FilterStatus>("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [modal, setModal] = useState<ModalMode>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<AccountDraft>(blankDraft);
  const [profileValues, setProfileValues] = useState<Record<string, string>>({});
  const input = useMemo(() => ({ query: search.trim() || undefined, role: category, isActive: status === "all" ? undefined : status === "active", createdFrom: createdFrom || undefined, createdTo: createdTo || undefined, page: 0, pageSize: 50 }), [category, search, status, createdFrom, createdTo]);
  const list = trpc.users.list.useQuery(input);
  const detail = trpc.users.byId.useQuery({ id: selectedId ?? 1 }, { enabled: modal === "detail" && selectedId !== null });
  const formSchema = trpc.users.formSchema.useQuery();
  const invalidate = async () => { await Promise.all([utils.users.list.invalidate(), utils.users.byId.invalidate()]); };
  const create = trpc.users.create.useMutation({ onSuccess: async account => { setCategory(account.role as ManagedRole); setSelectedId(account.id); setDraft(fromAccount(account)); setModal("detail"); await invalidate(); } });
  const update = trpc.users.update.useMutation({ onSuccess: async account => { setCategory(account.role as ManagedRole); setSelectedId(account.id); setDraft(fromAccount(account)); await invalidate(); } });
  const remove = trpc.users.remove.useMutation({ onSuccess: async () => { await invalidate(); closeModal(); } });
  const mutationError = create.error ?? update.error ?? remove.error;
  const selected = detail.data as ManagedAccount | undefined;

  useEffect(() => { if (selected) setDraft(fromAccount(selected)); }, [selected?.id]);

  function fromAccount(account: Pick<ManagedAccount, "name" | "email" | "isActive"> & { role: VisibleRole | "founder" }): AccountDraft { return { name: account.name ?? "", email: account.email ?? "", password: "", role: account.role === "user" || account.role === "founder" ? "student" : account.role, isActive: account.isActive }; }
  function chooseCategory(next: CategoryRole) { setCategory(next); setSearch(""); setStatus("all"); setCreatedFrom(""); setCreatedTo(""); setSelectedId(null); }
  async function openCreate() { await utils.users.formSchema.invalidate(); setSelectedId(null); setProfileValues({}); setDraft({ ...blankDraft, role: category }); setModal("create"); }
  function openDetail(id: number) { setSelectedId(id); setModal("detail"); }
  function closeModal() { setModal(null); setSelectedId(null); setProfileValues({}); setDraft(blankDraft); }
  function clearFilters() { setSearch(""); setStatus("all"); setCreatedFrom(""); setCreatedTo(""); }
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (modal === "create") create.mutate({ ...draft, profileValues }); else if (modal === "detail" && selectedId) update.mutate({ id: selectedId, ...draft }); }

  return <>
    <ModuleHeader eyebrow="Control centre · Users" title="People, organised by responsibility." description="Choose a role to work with its dedicated directory. Each group has its own local search and filters; account actions stay in focused modal windows." action={<div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => setBuilderOpen(true)} className="min-h-12 border-[#d8cfbf] text-[#29415b] hover:bg-[#faf6ef]"><Settings2 size={16} />{td("Configure create form")}</Button><Button type="button" onClick={openCreate} className="compass-btn-primary gap-2"><Plus size={17} />{td("New user")}</Button></div>} />
    <nav className="founder-panel founder-panel-paper mt-6 p-3" aria-label="User type modules"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">{categoryItems.map(({ role, icon: Icon }) => <button key={role} type="button" aria-pressed={category === role} onClick={() => chooseCategory(role)} className={`flex min-h-16 items-center gap-3 rounded-xl px-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173fad] ${category === role ? "bg-[#10253e] text-white" : "bg-[#faf6ef] text-[#29415b] hover:bg-[#eef4ff]"}`}><span className={`grid h-8 w-8 place-items-center rounded-lg ${category === role ? "bg-white/15 text-[#f3b59f]" : roleTone[role]}`}><Icon size={16} /></span><span><span className="block text-[11px] font-extrabold tracking-[.08em] uppercase opacity-70">{td("Type")}</span><span className="block text-sm font-extrabold">{td(roleLabels[role])}</span></span></button>)}</div></nav>
    {/* UPGRADED MODERN FILTER SECTION */}
    <section className="founder-panel founder-panel-paper mt-6 rounded-2xl border border-[#dce4e7] bg-white p-5 sm:p-6 shadow-sm transition-all hover:border-[#cfd9de]" aria-label={`${roleLabels[category]} filters`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf2f4] pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef4ff] text-[#173fad]">
            <SlidersHorizontal size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#10253e] uppercase tracking-wider">{td(roleLabels[category])} {td("directory filters")}</h2>
            <p className="text-xs text-[#53657a]">{list.isLoading ? td("Refreshing directory…") : `${list.data?.total ?? 0} ${td("accounts in this group")}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {((search.trim() ? 1 : 0) + (status !== "all" ? 1 : 0) + (createdFrom ? 1 : 0) + (createdTo ? 1 : 0)) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#eef4ff] px-2.5 py-0.5 text-xs font-semibold text-[#173fad]">
              <Filter size={12} />
              {(search.trim() ? 1 : 0) + (status !== "all" ? 1 : 0) + (createdFrom ? 1 : 0) + (createdTo ? 1 : 0)} {td("active")}
            </span>
          )}
          {((search.trim() ? 1 : 0) + (status !== "all" ? 1 : 0) + (createdFrom ? 1 : 0) + (createdTo ? 1 : 0)) > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-bold text-[#b4563c] transition-colors hover:bg-[#fff0ed] hover:border-[#efc4b8]"
            >
              <RotateCcw size={13} />
              <span>{td("Reset all")}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-12">
        {/* Search Input */}
        <div className="sm:col-span-2 lg:col-span-5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#53657a] mb-1.5">
            {td("Search account")}
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-[#708098]" size={16} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="h-11 w-full rounded-xl border border-[#dce4e7] bg-[#f8fafb] ps-10 pe-9 text-sm text-[#10253e] transition-all placeholder:text-[#8c9ba8] focus:border-[#173fad] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173fad]/20"
              placeholder={`${td("Search")} ${td(roleLabels[category])}…`}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#708098] hover:bg-[#edf2f4] hover:text-[#10253e]"
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
            {td("Account Status")}
          </label>
          <div className="relative">
            <select
              value={status}
              onChange={event => setStatus(event.target.value as FilterStatus)}
              className="h-11 w-full appearance-none rounded-xl border border-[#dce4e7] bg-[#f8fafb] ps-3.5 pe-8 text-sm font-medium text-[#10253e] transition-all focus:border-[#173fad] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173fad]/20"
            >
              <option value="all">{td("All statuses")}</option>
              <option value="active">{td("Active accounts")}</option>
              <option value="inactive">{td("Paused / inactive")}</option>
            </select>
            <div className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[#708098]">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>
        </div>

        {/* Date From */}
        <div className="sm:col-span-1 lg:col-span-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#53657a] mb-1.5">
            {td("Created From")}
          </label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[#708098]" size={14} />
            <input
              type="date"
              value={createdFrom}
              onChange={event => setCreatedFrom(event.target.value)}
              className="h-11 w-full rounded-xl border border-[#dce4e7] bg-[#f8fafb] ps-8 pe-7 text-xs font-semibold text-[#10253e] transition-all focus:border-[#173fad] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173fad]/20"
            />
            {createdFrom && (
              <button
                type="button"
                onClick={() => setCreatedFrom("")}
                className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#708098] hover:bg-[#edf2f4]"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Date To */}
        <div className="sm:col-span-1 lg:col-span-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#53657a] mb-1.5">
            {td("Created To")}
          </label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[#708098]" size={14} />
            <input
              type="date"
              value={createdTo}
              onChange={event => setCreatedTo(event.target.value)}
              className="h-11 w-full rounded-xl border border-[#dce4e7] bg-[#f8fafb] ps-8 pe-7 text-xs font-semibold text-[#10253e] transition-all focus:border-[#173fad] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173fad]/20"
            />
            {createdTo && (
              <button
                type="button"
                onClick={() => setCreatedTo("")}
                className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#708098] hover:bg-[#edf2f4]"
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
          <span className="text-xs font-semibold text-[#708098]">{td("Applied filters:")}</span>
          {search.trim() && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#f0f4f8] px-2.5 py-1 text-xs font-medium text-[#10253e]">
              <span>{td("Query:")} <strong>"{search}"</strong></span>
              <button type="button" onClick={() => setSearch("")} className="text-[#708098] hover:text-[#b4563c]"><X size={12} /></button>
            </span>
          )}
          {status !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#f0f4f8] px-2.5 py-1 text-xs font-medium text-[#10253e]">
              <span>{td("Status:")} <strong>{status === "active" ? td("Active") : td("Inactive")}</strong></span>
              <button type="button" onClick={() => setStatus("all")} className="text-[#708098] hover:text-[#b4563c]"><X size={12} /></button>
            </span>
          )}
          {createdFrom && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#f0f4f8] px-2.5 py-1 text-xs font-medium text-[#10253e]">
              <span>{td("From:")} <strong>{createdFrom}</strong></span>
              <button type="button" onClick={() => setCreatedFrom("")} className="text-[#708098] hover:text-[#b4563c]"><X size={12} /></button>
            </span>
          )}
          {createdTo && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#f0f4f8] px-2.5 py-1 text-xs font-medium text-[#10253e]">
              <span>{td("To:")} <strong>{createdTo}</strong></span>
              <button type="button" onClick={() => setCreatedTo("")} className="text-[#708098] hover:text-[#b4563c]"><X size={12} /></button>
            </span>
          )}
        </div>
      )}
    </section>
    {mutationError && !modal ? <Alert variant="destructive" className="mt-5"><AlertCircle className="h-4 w-4" /><AlertTitle>{td("Account action needs attention")}</AlertTitle><AlertDescription>{mutationError.message}</AlertDescription></Alert> : null}
    <section className="founder-panel founder-panel-paper mt-6 overflow-hidden p-0 rounded-2xl border border-[#eee4d7] bg-white">
      <div className="border-b border-[#eee4d7] px-5 py-5 bg-[#faf7f2]/30">
        <h2 className="font-display text-2xl font-bold text-[#10253e]">{td(roleLabels[category])}</h2>
        <p className="mt-1 text-sm text-[#53657a]">{td("Open an account to view its full profile and authorised actions.")}</p>
      </div>
      {list.isLoading ? (
        <div className="p-8"><ModuleSkeleton /></div>
      ) : list.error ? (
        <div className="p-8"><ModuleErrorState error={list.error.message} onRetry={() => list.refetch()} /></div>
      ) : !list.data?.rows.length ? (
        <div className="p-8">
          <ModuleEmptyState
            title={td(`No accounts found`)}
            description={td("Adjust the local filters or create a new account for this part of the platform.")}
            icon={UsersRound}
            action={
              <Button type="button" onClick={openCreate} className="compass-btn-primary gap-2">
                <Plus size={16} />
                {td("Create user")}
              </Button>
            }
          />
        </div>
      ) : (
        <div className="divide-y divide-[#f0e9df]">
          {list.data.rows.map(account => (
            <AccountRow key={account.id} account={account as ManagedAccount} onClick={() => openDetail(account.id)} />
          ))}
        </div>
      )}
    </section>
    <Dialog open={modal !== null} onOpenChange={open => { if (!open) closeModal(); }}><DialogContent className="w-full h-full max-h-screen max-w-none overflow-y-auto rounded-none border-0 bg-[#fbf8f2] p-0 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-2xl sm:rounded-[1.25rem] sm:border sm:border-[#dfd1bf]" showCloseButton={false}><UserModal mode={modal} selected={selected} loading={detail.isLoading} draft={draft} setDraft={setDraft} profileFields={(formSchema.data?.fields ?? []) as DynamicField[]} profileSections={(formSchema.data?.sections ?? []) as DynamicSection[]} profileValues={profileValues} setProfileValues={setProfileValues} pending={create.isPending || update.isPending || remove.isPending} error={mutationError?.message} onSubmit={submit} onClose={closeModal} onDelete={() => selectedId && remove.mutate({ id: selectedId })} /></DialogContent></Dialog>
    <UserFieldBuilder open={builderOpen} onOpenChange={setBuilderOpen} />
  </>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) { const { td } = useLanguage(); return <label className="block text-[11px] font-extrabold tracking-[.08em] text-[#708098] uppercase">{td(label)}<select value={value} onChange={event => onChange(event.target.value)} className="mt-1 block h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#10253e] outline-none focus:border-[#173fad] focus:ring-2 focus:ring-[#c8d9f8]">{options.map(([key, copy]) => <option key={key} value={key}>{td(copy)}</option>)}</select></label>; }
function DateFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { const { td } = useLanguage(); return <label className="block text-[11px] font-extrabold tracking-[.08em] text-[#708098] uppercase">{td(label)}<span className="relative mt-1 block"><CalendarDays className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[#708098]" size={15} /><input type="date" value={value} onChange={event => onChange(event.target.value)} className="h-12 w-full rounded-xl border border-[#dfd1bf] bg-white ps-9 pe-2 text-sm font-semibold normal-case tracking-normal text-[#10253e] outline-none focus:border-[#173fad] focus:ring-2 focus:ring-[#c8d9f8]" /></span></label>; }
function AccountRow({ account, onClick }: { account: ManagedAccount; onClick: () => void }) {
  const { td } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white hover:bg-[#faf6ef] transition-colors border-b border-[#f0e9df]">
      {/* Mobile Card Layout (< sm) */}
      <div className="block sm:hidden p-4">
        {/* Toggle Expansion on Header click or tap */}
        <div 
          onClick={() => setExpanded(!expanded)} 
          className="flex items-start justify-between gap-3 cursor-pointer select-none"
        >
          <div className="min-w-0 flex-1">
            <span className="block truncate font-bold text-[#10253e] text-base">
              {account.name || td("Unnamed account")}
            </span>
            <span className="mt-0.5 block truncate text-xs text-[#708098]">
              {account.email || td("No e-mail")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${roleTone[account.role]}`}>
              {td(singularRoleLabels[account.role])}
            </span>
            <span className="text-[#708098] transition-transform duration-200" style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}>
              <ChevronRight size={16} />
            </span>
          </div>
        </div>

        {/* Priority fields (2-4 fields in collapsed state) */}
        <div className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-xl border border-[#edf2f4] bg-[#fafbfc] p-3 text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#708098]">{td("Account status")}</span>
            <span className={`inline-flex items-center gap-1 font-bold ${account.isActive ? "text-[#173fad]" : "text-[#9a5a47]"}`}>
              {account.isActive ? <Check size={13} /> : <CircleSlash size={13} />}
              {account.isActive ? td("Active") : td("Paused")}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#708098]">{td("Email Verified")}</span>
            <span className="font-semibold text-[#29415b] truncate">{account.email ? td("Yes") : td("No")}</span>
          </div>
        </div>

        {/* Expandable Section (with smooth height transition/animation) */}
        <div 
          className={`grid transition-all duration-300 ease-in-out ${
            expanded ? "grid-rows-[1fr] opacity-100 mt-3.5" : "grid-rows-[0fr] opacity-0 pointer-events-none"
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-2.5 rounded-xl border border-[#e1d5c4] bg-[#fbf8f2] p-3 text-xs">
              <div className="flex justify-between items-center gap-2 border-b border-[#eee4d7] pb-2">
                <span className="font-bold text-[#708098]">{td("Account ID:")}</span>
                <span className="font-mono text-[11px] text-[#29415b] truncate max-w-[180px]" title={account.openId}>{account.openId}</span>
              </div>
              <div className="flex justify-between items-center gap-2 border-b border-[#eee4d7] pb-2">
                <span className="font-bold text-[#708098]">{td("Issued:")}</span>
                <span className="font-semibold text-[#29415b]">{new Date(account.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center gap-2 border-b border-[#eee4d7] pb-2">
                <span className="font-bold text-[#708098]">{td("Last sign-in:")}</span>
                <span className="font-semibold text-[#29415b]">{new Date(account.lastSignedIn).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="font-bold text-[#708098]">{td("Sign-In Method:")}</span>
                <span className="font-semibold text-[#29415b] uppercase">{account.loginMethod || td("Password")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Full-width primary action button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="flex w-full min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#10253e] hover:bg-[#173fad] active:bg-[#0c1b2e] px-4 text-xs font-bold text-white transition-all shadow-xs"
          >
            <Pencil size={13} />
            <span>{td("Configure Account")}</span>
          </button>
        </div>
      </div>

      {/* Desktop Grid Row (>= sm) */}
      <button
        type="button"
        onClick={onClick}
        className="hidden sm:grid w-full grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-3 sm:px-5 sm:py-4 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#173fad]"
      >
        <span className="min-w-0">
          <span className="block truncate font-bold text-[#10253e]">{account.name || td("Unnamed account")}</span>
          <span className="mt-1 block truncate text-xs text-[#708098]">{account.email || td("No e-mail")}</span>
        </span>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${roleTone[account.role]}`}>
          {td(singularRoleLabels[account.role])}
        </span>
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${account.isActive ? "text-[#173fad]" : "text-[#9a5a47]"}`}>
          {account.isActive ? <Check size={13} /> : <CircleSlash size={13} />}
          {account.isActive ? td("Active") : td("Paused")}
        </span>
      </button>
    </div>
  );
}

function UserModal({ mode, selected, loading, draft, setDraft, profileFields, profileSections, profileValues, setProfileValues, pending, error, onSubmit, onClose, onDelete }: { mode: ModalMode; selected: ManagedAccount | undefined; loading: boolean; draft: AccountDraft; setDraft: (draft: AccountDraft) => void; profileFields: DynamicField[]; profileSections: DynamicSection[]; profileValues: Record<string, string>; setProfileValues: (values: Record<string, string>) => void; pending: boolean; error?: string; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onClose: () => void; onDelete: () => void }) {
  const { td } = useLanguage();
  if (mode === "detail" && loading) return <div className="grid min-h-80 place-items-center"><Loader2 className="animate-spin text-[#173fad]" /></div>;
  const createMode = mode === "create";
  if (createMode) return <ConfigurableCreateUserModal draft={draft} setDraft={setDraft} profileValues={profileValues} setProfileValues={setProfileValues} pending={pending} error={error} onSubmit={onSubmit} onClose={onClose} />;
  return <form data-testid="users-modal-form" onSubmit={onSubmit}><DialogHeader className="border-b border-[#e6dccd] bg-white px-4 py-4 sm:px-6 sm:py-6 text-start"><p className="founder-command-eyebrow">{createMode ? td("Issue new access") : td("Account profile")}</p><DialogTitle className="font-display text-2xl sm:text-4xl text-[#10253e]">{createMode ? td("Create user") : td("Edit user")}</DialogTitle><DialogDescription className="max-w-xl text-xs sm:text-sm text-[#53657a]">{createMode ? td("Assign protected access details, then complete any Founder-configured profile fields.") : td("Update profile, type, password or active status from this focused account window.")}</DialogDescription></DialogHeader><div className="px-4 py-4 sm:px-6 sm:py-6">{error ? <Alert variant="destructive" className="mb-5"><AlertCircle className="h-4 w-4" /><AlertTitle>{td("Account action needs attention")}</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}<div className="grid gap-4 sm:grid-cols-2"><TextField label={td("Full name")} value={draft.name} onChange={value => setDraft({ ...draft, name: value })} required autoComplete="name" /><TextField label={td("E-mail")} value={draft.email ?? ""} onChange={value => setDraft({ ...draft, email: value })} required type="email" autoComplete="email" /><label className="block text-xs font-extrabold text-[#53657a]">{td("User type")}<select value={draft.role} onChange={event => setDraft({ ...draft, role: event.target.value as ManagedRole })} className="mt-1.5 h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm text-[#10253e] outline-none focus:border-[#173fad] focus:ring-2 focus:ring-[#c8d9f8]">{managedRoles.map(role => <option key={role} value={role}>{td(singularRoleLabels[role])}</option>)}</select></label><TextField label={createMode ? td("Initial password") : td("New password (optional)")} value={draft.password} onChange={value => setDraft({ ...draft, password: value })} required={createMode} type="password" autoComplete="new-password" hint={td("Minimum 10 characters. Stored only as a salted hash.")} /></div>{createMode ? <DynamicUserProfileFields fields={profileFields} sections={profileSections} values={profileValues} onChange={(key, value) => setProfileValues({ ...profileValues, [key]: value })} /> : null}<label className="mt-4 flex min-h-14 items-center justify-between gap-4 rounded-xl border border-[#e1d5c4] bg-[#faf6ef] px-4 text-sm font-bold text-[#29415b]"><span><span className="block">{td("Account active")}</span><span className="mt-0.5 block text-xs font-normal text-[#708098]">{td("Inactive accounts cannot sign in with their password.")}</span></span><input aria-label="Account active" type="checkbox" checked={draft.isActive} onChange={event => setDraft({ ...draft, isActive: event.target.checked })} className="h-5 w-5 accent-[#173fad]" /></label>{!createMode && selected ? <div className="mt-5 rounded-xl bg-[#f7f2e9] p-4 text-xs leading-5 text-[#53657a]"><p><span className="font-bold text-[#29415b]">{td("Account ID:")}</span> {selected.openId}</p><p className="mt-1"><span className="font-bold text-[#29415b]">{td("Issued:")}</span> {new Date(selected.createdAt).toLocaleString()}</p><p className="mt-1"><span className="font-bold text-[#29415b]">{td("Last sign-in:")}</span> {new Date(selected.lastSignedIn).toLocaleString()}</p></div> : null}</div><DialogFooter className="border-t border-[#e6dccd] bg-white px-4 py-4 sm:px-6 sm:py-5"><div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div>{!createMode ? <AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="outline" disabled={pending} className="min-h-12 border-[#efc4b8] text-[#b4563c] hover:bg-[#fff0ed] w-full sm:w-auto"><Trash2 size={15} />{td("Delete account")}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{td("Delete this account?")}</AlertDialogTitle><AlertDialogDescription>{td("This permanently removes the selected account. Centre content is not attached to user records and will remain unchanged.")}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{td("Keep account")}</AlertDialogCancel><AlertDialogAction onClick={onDelete} className="bg-[#b4563c] hover:bg-[#923e2a]">{td("Delete account")}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog> : null}</div><div className="flex flex-col gap-2 sm:flex-row"><Button type="button" variant="outline" onClick={onClose} disabled={pending} className="min-h-12 border-[#d8cfbf] text-[#53657a] hover:bg-[#faf6ef]">{td("Cancel")}</Button><Button type="submit" disabled={pending || (!createMode && !selected)} className="compass-btn-primary min-h-12">{pending ? <Loader2 className="animate-spin" size={16} /> : null}{createMode ? td("Create user") : td("Save changes")}</Button></div></div></DialogFooter></form>;
}

function TextField({ label, value, onChange, type = "text", required, hint, autoComplete }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; hint?: string; autoComplete?: string }) { return <label className="block text-xs font-extrabold text-[#53657a]">{label}<input required={required} type={type} autoComplete={autoComplete} value={value} onChange={event => onChange(event.target.value)} className="mt-1.5 h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm text-[#10253e] outline-none focus:border-[#173fad] focus:ring-2 focus:ring-[#c8d9f8]" />{hint ? <span className="mt-1.5 block text-[11px] font-normal leading-4 text-[#708098]">{hint}</span> : null}</label>; }