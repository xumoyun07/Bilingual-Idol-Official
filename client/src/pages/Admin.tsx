import { useAuth } from "@/_core/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DashboardLayout from "@/components/DashboardLayout";
import { ConfigurableCreateUserModal } from "@/components/ConfigurableCreateUserModal";
import { DynamicUserProfileFields, type DynamicField, type DynamicSection } from "@/components/DynamicUserProfileFields";
import { UserFieldBuilder } from "@/components/UserFieldBuilder";
import { trpc } from "@/lib/trpc";
import AuditLogs from "./AuditLogs";
import NewsManager from "./NewsManager";
import { StudentProfileDetail, StudentsProfileList } from "./StudentsProfile";
import MediaLibrary from "./MediaLibrary";
import {
  FOUNDER_NAVIGATION_SECTIONS,
  PlatformUserType,
} from "@/components/founder/FounderNavTypes";
import { FounderSettingsModule } from "@/components/founder/FounderSettingsModule";
import { ProjectDossierModule } from "@/components/founder/ProjectDossierModule";
import { AdminProgramsModule } from "@/components/founder/AdminProgramsModule";
import { AdminLeadsModule } from "@/components/founder/AdminLeadsModule";
import { AdminScheduleModule } from "@/components/founder/AdminScheduleModule";
import { TeacherAttendanceModule } from "@/components/founder/TeacherAttendanceModule";
import { TeacherGradesModule } from "@/components/founder/TeacherGradesModule";
import { TeacherLessonsModule } from "@/components/founder/TeacherLessonsModule";
import { MarketingCampaignsModule } from "@/components/founder/MarketingCampaignsModule";
import { MarketingContentModule } from "@/components/founder/MarketingContentModule";
import { MarketingTestimonialsModule } from "@/components/founder/MarketingTestimonialsModule";
import { MarketingAnalyticsModule } from "@/components/founder/MarketingAnalyticsModule";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CalendarDays,
  Check,
  ChevronRight,
  CircleSlash,
  Crown,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

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

export default function Admin() {
  const { user, loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    if (!user) {
      window.location.replace("/login");
    } else if (user.role !== "founder") {
      window.location.replace(user.role === "super_admin" ? "/super-admin" : "/dashboard");
    }
  }, [loading, user]);
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#fbf8f2]"><Loader2 className="animate-spin text-[#173fad]" /></div>;
  if (!user || user.role !== "founder") return null;
  return <DashboardLayout><FounderConsole /></DashboardLayout>;
}

function FounderConsole() {
  const [location, setLocation] = useLocation();

  // Search parameters for dynamic tab routing
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const roleParam = (searchParams.get("role") as PlatformUserType) || "founder";
  const tabParam = searchParams.get("tab") || "";

  // Canonical paths
  if (location === "/admin/audit-logs") return <AuditLogs role="founder" />;
  if (location === "/admin/news") return <NewsManager />;
  if (location === "/admin/students") return <StudentsProfileList />;
  const studentMatch = location.match(/^\/admin\/students\/(\d+)$/);
  if (studentMatch) return <StudentProfileDetail studentId={Number(studentMatch[1])} />;

  // Render module based on active Tab
  const renderActiveModule = () => {
    switch (tabParam) {
      case "founder-overview":
        return <DashboardModule />;
      case "founder-users":
      case "superadmin-users":
        return <UsersModule />;
      case "founder-fields":
      case "superadmin-fields":
        return <UserFieldBuilderStandalone />;
      case "founder-students":
      case "admin-students":
        return <StudentsProfileList />;
      case "founder-news":
      case "superadmin-news":
      case "admin-news":
        return <NewsManager />;
      case "founder-media":
      case "marketing-media":
        return <MediaLibrary />;
      case "founder-audit":
      case "superadmin-audit":
        return <AuditLogs role="founder" />;
      case "founder-dossier":
        return <ProjectDossierModule />;
      case "founder-settings":
        return <FounderSettingsModule />;
      case "superadmin-overview":
        return <SuperAdminOverviewModule />;
      case "admin-overview":
        return <AdminOverviewModule />;
      case "admin-leads":
      case "marketing-leads":
        return <AdminLeadsModule />;
      case "admin-programs":
        return <AdminProgramsModule />;
      case "admin-schedule":
      case "teacher-schedule":
        return <AdminScheduleModule />;
      case "teacher-attendance":
        return <TeacherAttendanceModule />;
      case "teacher-grades":
        return <TeacherGradesModule />;
      case "teacher-lessons":
        return <TeacherLessonsModule />;
      case "marketing-overview":
        return <MarketingAnalyticsModule />;
      case "marketing-campaigns":
        return <MarketingCampaignsModule />;
      case "marketing-content":
        return <MarketingContentModule />;
      case "marketing-testimonials":
        return <MarketingTestimonialsModule />;
      default:
        return location === "/admin/users" ? <UsersModule /> : <DashboardModule />;
    }
  };

  return (
    <div id="admin-dashboard-container" data-page="admin" className="workspace-page founder-command founder-workspace page-admin mx-auto w-full max-w-[88rem] pb-12">
      {/* Top User Type Pill Navigator */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#dce4e7] shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#708098] px-2">
            User Type Focus:
          </span>
          {FOUNDER_NAVIGATION_SECTIONS.map((sec) => {
            const isSelected = roleParam === sec.type;
            const SecIcon = sec.icon;
            return (
              <button
                key={sec.type}
                type="button"
                onClick={() => setLocation(`/admin?role=${sec.type}&tab=${sec.modules[0].id}`)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-[#10253e] text-white shadow-xs"
                    : "bg-[#f8fafc] text-[#475569] hover:bg-[#eef2f6] border border-[#e2e8f0]"
                }`}
              >
                <SecIcon size={14} className={isSelected ? "text-amber-300" : "text-[#64748b]"} />
                <span>{sec.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-[#edf2f7] text-[#64748b]"}`}>
                  {sec.modules.length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#53657a] font-medium hidden md:inline">
            Active: <strong className="text-[#10253e]">{FOUNDER_NAVIGATION_SECTIONS.find(s => s.type === roleParam)?.label}</strong>
          </span>
        </div>
      </div>

      {renderActiveModule()}
    </div>
  );
}

function UserFieldBuilderStandalone() {
  const [open, setOpen] = useState(true);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#efe8fb] text-[#6e4c9a] border border-[#ddcefa]">
              <Settings2 size={13} />
              Platform Schema
            </span>
            <span className="text-xs text-[#53657a]">User Profile Field Configurator</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#10253e] mt-1">Dynamic Profile Schema Builder</h2>
          <p className="text-sm text-[#53657a]">
            Customise registration fields, required metadata, dropdowns, and sections across all user roles.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[#dce4e7] shadow-sm">
        <UserFieldBuilder open={open} onOpenChange={setOpen} />
      </div>
    </div>
  );
}

function SuperAdminOverviewModule() {
  const usersCount = trpc.users.list.useQuery({ page: 0, pageSize: 1 });
  const auditCount = trpc.audit.list.useQuery({ page: 0, pageSize: 10 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#efe8fb] text-[#6e4c9a] border border-[#ddcefa]">
              <ShieldCheck size={13} />
              Super Admin Console
            </span>
            <span className="text-xs text-[#53657a]">Core Centre Operations</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#10253e] mt-1">Super Administrator Operations</h2>
          <p className="text-sm text-[#53657a]">
            Global user account permissions, security audit trails, and institutional policies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#dce4e7] shadow-sm">
          <span className="text-xs font-semibold text-[#53657a]">Total Staff & Managed Accounts</span>
          <div className="text-3xl font-bold text-[#10253e] mt-1">{usersCount.data?.total ?? "..."}</div>
          <p className="text-xs text-emerald-600 font-medium mt-1">Active multi-role directory</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#dce4e7] shadow-sm">
          <span className="text-xs font-semibold text-[#53657a]">Recorded Security Events</span>
          <div className="text-3xl font-bold text-[#173fad] mt-1">{auditCount.data?.total ?? "..."}</div>
          <p className="text-xs text-[#53657a] mt-1">Tamper-evident logs</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#dce4e7] shadow-sm">
          <span className="text-xs font-semibold text-[#53657a]">Super Admin Authority</span>
          <div className="text-3xl font-bold text-[#6e4c9a] mt-1">Level 2</div>
          <p className="text-xs text-[#53657a] mt-1">Governed under Founder</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin?role=super_admin&tab=superadmin-users" className="p-6 rounded-2xl bg-white border border-[#dce4e7] hover:border-[#173fad] shadow-sm transition-all block group">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-[#efe8fb] text-[#6e4c9a]">
              <UsersRound size={22} />
            </span>
            <div>
              <h3 className="font-bold text-base text-[#10253e] group-hover:text-[#173fad]">Manage Staff Directory</h3>
              <p className="text-xs text-[#53657a] mt-0.5">Create, update, toggle active status, and filter staff records.</p>
            </div>
          </div>
        </Link>
        <Link href="/admin?role=super_admin&tab=superadmin-audit" className="p-6 rounded-2xl bg-white border border-[#dce4e7] hover:border-[#173fad] shadow-sm transition-all block group">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-[#efe8fb] text-[#6e4c9a]">
              <ShieldAlert size={22} />
            </span>
            <div>
              <h3 className="font-bold text-base text-[#10253e] group-hover:text-[#173fad]">View Security Audit Logs</h3>
              <p className="text-xs text-[#53657a] mt-0.5">Inspect user logins, profile alterations, and administrative actions.</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

function AdminOverviewModule() {
  const studentsCount = trpc.students.list.useQuery({ page: 0, pageSize: 1, sortBy: "newest" });
  const submissionsCount = trpc.submissions.list.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#f4eddd] text-[#705a30] border border-[#e5d5b7]">
              <Shield size={13} />
              Admin Module
            </span>
            <span className="text-xs text-[#53657a]">Academic & Admissions Administration</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#10253e] mt-1">Administrator Dashboard</h2>
          <p className="text-sm text-[#53657a]">
            Manage student records, program offerings, incoming admissions leads, and class timetables.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#dce4e7] shadow-sm">
          <span className="text-xs font-semibold text-[#53657a]">Enrolled Students</span>
          <div className="text-3xl font-bold text-[#10253e] mt-1">{studentsCount.data?.total ?? "..."}</div>
          <p className="text-xs text-[#53657a] mt-1">Active learner profiles</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#dce4e7] shadow-sm">
          <span className="text-xs font-semibold text-[#53657a]">Admissions Pipeline Leads</span>
          <div className="text-3xl font-bold text-[#173fad] mt-1">{submissionsCount.data?.length ?? "..."}</div>
          <p className="text-xs text-emerald-600 font-medium mt-1">Awaiting review / contact</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#dce4e7] shadow-sm">
          <span className="text-xs font-semibold text-[#53657a]">Academic Timetable</span>
          <div className="text-3xl font-bold text-[#705a30] mt-1">Active</div>
          <p className="text-xs text-[#53657a] mt-1">Mon - Sat classes running</p>
        </div>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin?role=admin&tab=admin-students" className="p-5 rounded-2xl bg-white border border-[#dce4e7] hover:border-[#173fad] shadow-sm transition-all block group">
          <GraduationCap className="text-[#325c95] size-6 mb-2" />
          <h4 className="font-bold text-sm text-[#10253e] group-hover:text-[#173fad]">Students Directory</h4>
          <p className="text-xs text-[#53657a] mt-1">Inspect profiles, CEFR tiers, and emergency contacts.</p>
        </Link>
        <Link href="/admin?role=admin&tab=admin-leads" className="p-5 rounded-2xl bg-white border border-[#dce4e7] hover:border-[#173fad] shadow-sm transition-all block group">
          <Users className="text-[#173fad] size-6 mb-2" />
          <h4 className="font-bold text-sm text-[#10253e] group-hover:text-[#173fad]">Admissions Leads</h4>
          <p className="text-xs text-[#53657a] mt-1">Process enrollments and update pipeline status.</p>
        </Link>
        <Link href="/admin?role=admin&tab=admin-programs" className="p-5 rounded-2xl bg-white border border-[#dce4e7] hover:border-[#173fad] shadow-sm transition-all block group">
          <BookOpen className="text-[#705a30] size-6 mb-2" />
          <h4 className="font-bold text-sm text-[#10253e] group-hover:text-[#173fad]">Language Programs</h4>
          <p className="text-xs text-[#53657a] mt-1">Create and configure courses, tuition, and CEFR levels.</p>
        </Link>
        <Link href="/admin?role=admin&tab=admin-schedule" className="p-5 rounded-2xl bg-white border border-[#dce4e7] hover:border-[#173fad] shadow-sm transition-all block group">
          <Calendar className="text-[#a34732] size-6 mb-2" />
          <h4 className="font-bold text-sm text-[#10253e] group-hover:text-[#173fad]">Class Timetables</h4>
          <p className="text-xs text-[#53657a] mt-1">Manage classrooms, schedule slots, and teacher rosters.</p>
        </Link>
      </div>
    </div>
  );
}


function ModuleHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="founder-command-header"><div><p className="founder-command-eyebrow">{eyebrow}</p><h1 className="founder-command-title">{title}</h1><p className="founder-command-description">{description}</p></div>{action ? <div className="founder-command-action">{action}</div> : null}</header>;
}

function DashboardModule() {
  const usersCount = trpc.users.list.useQuery({ page: 0, pageSize: 1 });
  const studentsCount = trpc.students.list.useQuery({ page: 0, pageSize: 1, sortBy: "newest" });

  return <>
    <ModuleHeader eyebrow="Control centre · Dashboard" title="Manage centre access." description="Use this workspace to manage issued accounts, student records and audit evidence. Activity metrics appear only when a confirmed data source is connected." action={<Link href="/admin/users" className="compass-btn-primary inline-flex items-center gap-2"><UsersRound size={17} />Open Users<ArrowUpRight size={16} /></Link>} />
    <section className="founder-panel founder-panel-paper mt-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between p-6 sm:p-8 bg-white border border-[#dce4e7] rounded-2xl shadow-sm">
      <div className="flex-1 space-y-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-[#eef4ff] text-[#173fad]">
            <ShieldCheck size={14} className="text-[#173fad]" />
            Core Directory
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#f0f4f8] text-[#53657a]">
            {usersCount.data?.total !== undefined ? `${usersCount.data.total} registered accounts` : "Database connected"}
          </span>
          {studentsCount.data?.total !== undefined ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#eef4ff] text-[#173fad]">
              <GraduationCap size={13} />
              {studentsCount.data.total} student profiles
            </span>
          ) : null}
        </div>
        <div>
          <h2 className="font-display text-2xl sm:text-3xl text-[#10253e] font-bold tracking-tight">Manage issued accounts & permissions.</h2>
          <p className="mt-2 max-w-2xl text-sm sm:text-base leading-relaxed text-[#53657a]">Create, review, filter, update and safely remove accounts from one protected directory with fine-grained role-based access.</p>
        </div>
        <div className="flex flex-wrap gap-2 pt-1 text-xs text-[#53657a]">
          <span className="inline-flex items-center gap-1 bg-[#f7f9fa] px-2.5 py-1 rounded-md border border-[#e5ebed]"><UsersRound size={12} className="text-[#173fad]" /> Staff & Teachers</span>
          <span className="inline-flex items-center gap-1 bg-[#f7f9fa] px-2.5 py-1 rounded-md border border-[#e5ebed]"><GraduationCap size={12} className="text-[#325c95]" /> Students</span>
          <span className="inline-flex items-center gap-1 bg-[#f7f9fa] px-2.5 py-1 rounded-md border border-[#e5ebed]"><Shield size={12} className="text-[#705a30]" /> Administrators</span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
        <Link href="/admin/users" className="compass-btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold shadow-sm transition-all hover:translate-y-[-1px] active:translate-y-[0px]"><UserPlus size={18} /><span>Manage users</span><ChevronRight size={16} /></Link>
        <Link href="/admin/students" className="compass-btn-secondary inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all hover:bg-[#f2f5f6]"><GraduationCap size={18} /><span>Student profiles</span></Link>
      </div>
    </section>
    <section className="founder-state founder-state-empty mt-6"><p className="font-semibold text-[#10253e]">No live analytics are connected.</p><p className="mt-1 text-sm leading-6 text-[#53657a]">The workspace can accept approved metrics later without changing the account-management flow.</p></section>
  </>;
}

function UsersModule() {
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
    <ModuleHeader eyebrow="Control centre · Users" title="People, organised by responsibility." description="Choose a role to work with its dedicated directory. Each group has its own local search and filters; account actions stay in focused modal windows." action={<div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => setBuilderOpen(true)} className="min-h-12 border-[#d8cfbf] text-[#29415b] hover:bg-[#faf6ef]"><Settings2 size={16} />Configure create form</Button><Button type="button" onClick={openCreate} className="compass-btn-primary gap-2"><Plus size={17} />New user</Button></div>} />
    <nav className="founder-panel founder-panel-paper mt-6 p-3" aria-label="User type modules"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">{categoryItems.map(({ role, icon: Icon }) => <button key={role} type="button" aria-pressed={category === role} onClick={() => chooseCategory(role)} className={`flex min-h-16 items-center gap-3 rounded-xl px-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173fad] ${category === role ? "bg-[#10253e] text-white" : "bg-[#faf6ef] text-[#29415b] hover:bg-[#eef4ff]"}`}><span className={`grid h-8 w-8 place-items-center rounded-lg ${category === role ? "bg-white/15 text-[#f3b59f]" : roleTone[role]}`}><Icon size={16} /></span><span><span className="block text-[11px] font-extrabold tracking-[.08em] uppercase opacity-70">Type</span><span className="block text-sm font-extrabold">{roleLabels[role]}</span></span></button>)}</div></nav>
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
    <section className="founder-panel founder-panel-paper mt-6 overflow-hidden p-0"><div className="border-b border-[#eee4d7] px-5 py-5"><h2 className="font-display text-3xl text-[#10253e]">{roleLabels[category]}</h2><p className="mt-1 text-sm text-[#53657a]">Open an account to view its full profile and authorised actions.</p></div>{list.isLoading ? <LoadingDirectory /> : list.error ? <DirectoryError /> : !list.data?.rows.length ? <EmptyDirectory role={roleLabels[category]} onCreate={openCreate} /> : <div className="divide-y divide-[#f0e9df]">{list.data.rows.map(account => <AccountRow key={account.id} account={account as ManagedAccount} onClick={() => openDetail(account.id)} />)}</div>}</section>
    <Dialog open={modal !== null} onOpenChange={open => { if (!open) closeModal(); }}><DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-1rem)] overflow-y-auto rounded-[1.25rem] border-[#dfd1bf] bg-[#fbf8f2] p-0 sm:max-w-2xl" showCloseButton={false}><UserModal mode={modal} selected={selected} loading={detail.isLoading} draft={draft} setDraft={setDraft} profileFields={(formSchema.data?.fields ?? []) as DynamicField[]} profileSections={(formSchema.data?.sections ?? []) as DynamicSection[]} profileValues={profileValues} setProfileValues={setProfileValues} pending={create.isPending || update.isPending || remove.isPending} error={mutationError?.message} onSubmit={submit} onClose={closeModal} onDelete={() => selectedId && remove.mutate({ id: selectedId })} /></DialogContent></Dialog>
    <UserFieldBuilder open={builderOpen} onOpenChange={setBuilderOpen} />
  </>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) { return <label className="block text-[11px] font-extrabold tracking-[.08em] text-[#708098] uppercase">{label}<select value={value} onChange={event => onChange(event.target.value)} className="mt-1 block h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#10253e] outline-none focus:border-[#173fad] focus:ring-2 focus:ring-[#c8d9f8]">{options.map(([key, copy]) => <option key={key} value={key}>{copy}</option>)}</select></label>; }
function DateFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-[11px] font-extrabold tracking-[.08em] text-[#708098] uppercase">{label}<span className="relative mt-1 block"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#708098]" size={15} /><input type="date" value={value} onChange={event => onChange(event.target.value)} className="h-12 w-full rounded-xl border border-[#dfd1bf] bg-white pl-9 pr-2 text-sm font-semibold normal-case tracking-normal text-[#10253e] outline-none focus:border-[#173fad] focus:ring-2 focus:ring-[#c8d9f8]" /></span></label>; }
function AccountRow({ account, onClick }: { account: ManagedAccount; onClick: () => void }) { return <button type="button" onClick={onClick} className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 bg-white px-5 py-4 text-left transition-colors hover:bg-[#faf6ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#173fad]"><span className="min-w-0"><span className="block truncate font-bold text-[#10253e]">{account.name || "Unnamed account"}</span><span className="mt-1 block truncate text-xs text-[#708098]">{account.email || "No e-mail"}</span></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${roleTone[account.role]}`}>{singularRoleLabels[account.role]}</span><span className={`inline-flex items-center gap-1 text-[11px] font-bold ${account.isActive ? "text-[#173fad]" : "text-[#9a5a47]"}`}>{account.isActive ? <Check size={13} /> : <CircleSlash size={13} />}{account.isActive ? "Active" : "Paused"}</span></button>; }

function UserModal({ mode, selected, loading, draft, setDraft, profileFields, profileSections, profileValues, setProfileValues, pending, error, onSubmit, onClose, onDelete }: { mode: ModalMode; selected: ManagedAccount | undefined; loading: boolean; draft: AccountDraft; setDraft: (draft: AccountDraft) => void; profileFields: DynamicField[]; profileSections: DynamicSection[]; profileValues: Record<string, string>; setProfileValues: (values: Record<string, string>) => void; pending: boolean; error?: string; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onClose: () => void; onDelete: () => void }) {
  if (mode === "detail" && loading) return <div className="grid min-h-80 place-items-center"><Loader2 className="animate-spin text-[#173fad]" /></div>;
  const createMode = mode === "create";
  if (createMode) return <ConfigurableCreateUserModal draft={draft} setDraft={setDraft} profileValues={profileValues} setProfileValues={setProfileValues} pending={pending} error={error} onSubmit={onSubmit} onClose={onClose} />;
  return <form data-testid="users-modal-form" onSubmit={onSubmit}><DialogHeader className="border-b border-[#e6dccd] bg-white px-6 py-6 text-left"><p className="founder-command-eyebrow">{createMode ? "Issue new access" : "Account profile"}</p><DialogTitle className="font-display text-4xl text-[#10253e]">{createMode ? "Create user" : "Edit user"}</DialogTitle><DialogDescription className="max-w-xl text-[#53657a]">{createMode ? "Assign protected access details, then complete any Founder-configured profile fields." : "Update profile, type, password or active status from this focused account window."}</DialogDescription></DialogHeader><div className="px-6 py-6">{error ? <Alert variant="destructive" className="mb-5"><AlertCircle className="h-4 w-4" /><AlertTitle>Account action needs attention</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}<div className="grid gap-4 sm:grid-cols-2"><TextField label="Full name" value={draft.name} onChange={value => setDraft({ ...draft, name: value })} required autoComplete="name" /><TextField label="E-mail" value={draft.email ?? ""} onChange={value => setDraft({ ...draft, email: value })} required type="email" autoComplete="email" /><label className="block text-xs font-extrabold text-[#53657a]">User type<select value={draft.role} onChange={event => setDraft({ ...draft, role: event.target.value as ManagedRole })} className="mt-1.5 h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm text-[#10253e] outline-none focus:border-[#173fad] focus:ring-2 focus:ring-[#c8d9f8]">{managedRoles.map(role => <option key={role} value={role}>{singularRoleLabels[role]}</option>)}</select></label><TextField label={createMode ? "Initial password" : "New password (optional)"} value={draft.password} onChange={value => setDraft({ ...draft, password: value })} required={createMode} type="password" autoComplete="new-password" hint="Minimum 10 characters. Stored only as a salted hash." /></div>{createMode ? <DynamicUserProfileFields fields={profileFields} sections={profileSections} values={profileValues} onChange={(key, value) => setProfileValues({ ...profileValues, [key]: value })} /> : null}<label className="mt-4 flex min-h-14 items-center justify-between gap-4 rounded-xl border border-[#e1d5c4] bg-[#faf6ef] px-4 text-sm font-bold text-[#29415b]"><span><span className="block">Account active</span><span className="mt-0.5 block text-xs font-normal text-[#708098]">Inactive accounts cannot sign in with their password.</span></span><input aria-label="Account active" type="checkbox" checked={draft.isActive} onChange={event => setDraft({ ...draft, isActive: event.target.checked })} className="h-5 w-5 accent-[#173fad]" /></label>{!createMode && selected ? <div className="mt-5 rounded-xl bg-[#f7f2e9] p-4 text-xs leading-5 text-[#53657a]"><p><span className="font-bold text-[#29415b]">Account ID:</span> {selected.openId}</p><p className="mt-1"><span className="font-bold text-[#29415b]">Issued:</span> {new Date(selected.createdAt).toLocaleString()}</p><p className="mt-1"><span className="font-bold text-[#29415b]">Last sign-in:</span> {new Date(selected.lastSignedIn).toLocaleString()}</p></div> : null}</div><DialogFooter className="border-t border-[#e6dccd] bg-white px-6 py-5"><div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div>{!createMode ? <AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="outline" disabled={pending} className="min-h-12 border-[#efc4b8] text-[#b4563c] hover:bg-[#fff0ed]"><Trash2 size={15} />Delete account</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this account?</AlertDialogTitle><AlertDialogDescription>This permanently removes the selected account. Centre content is not attached to user records and will remain unchanged.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep account</AlertDialogCancel><AlertDialogAction onClick={onDelete} className="bg-[#b4563c] hover:bg-[#923e2a]">Delete account</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog> : null}</div><div className="flex flex-col gap-2 sm:flex-row"><Button type="button" variant="outline" onClick={onClose} disabled={pending} className="min-h-12 border-[#d8cfbf] text-[#53657a] hover:bg-[#faf6ef]">Cancel</Button><Button type="submit" disabled={pending || (!createMode && !selected)} className="compass-btn-primary min-h-12">{pending ? <Loader2 className="animate-spin" size={16} /> : null}{createMode ? "Create user" : "Save changes"}</Button></div></div></DialogFooter></form>;
}

function TextField({ label, value, onChange, type = "text", required, hint, autoComplete }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; hint?: string; autoComplete?: string }) { return <label className="block text-xs font-extrabold text-[#53657a]">{label}<input required={required} type={type} autoComplete={autoComplete} value={value} onChange={event => onChange(event.target.value)} className="mt-1.5 h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm text-[#10253e] outline-none focus:border-[#173fad] focus:ring-2 focus:ring-[#c8d9f8]" />{hint ? <span className="mt-1.5 block text-[11px] font-normal leading-4 text-[#708098]">{hint}</span> : null}</label>; }
function LoadingDirectory() { return <div className="grid min-h-80 place-items-center"><Loader2 className="animate-spin text-[#173fad]" /></div>; }
function DirectoryError() { return <div className="p-8"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Directory unavailable</AlertTitle><AlertDescription>Refresh the page or try again shortly.</AlertDescription></Alert></div>; }
function EmptyDirectory({ role, onCreate }: { role: string; onCreate: () => void }) { return <div className="p-10 text-center"><UsersRound className="mx-auto text-[#aab5c1]" size={28} /><h3 className="mt-4 font-display text-3xl text-[#10253e]">No {role.toLowerCase()} yet</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#53657a]">Adjust the local filters or create an account for this part of the platform.</p><Button type="button" onClick={onCreate} className="compass-btn-primary mt-6"><Plus size={16} />Create user</Button></div>; }
