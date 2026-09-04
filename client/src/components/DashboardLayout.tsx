import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CalendarDays, FileImage, GraduationCap, LayoutDashboard, LogOut, Newspaper, ScrollText, UsersRound } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { BackgroundCircleField } from "@/components/BackgroundCircleField";
import { Button } from "./ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

type DashboardRole = "founder" | "super_admin" | "teacher";

export default function DashboardLayout({ children, role = "founder" }: { children: React.ReactNode; role?: DashboardRole }) {
  const { loading, user } = useAuth();

  useEffect(() => {
    if (!loading && user && user.role !== role) {
      window.location.replace(user.role === "super_admin" ? "/super-admin" : user.role === "founder" ? "/admin" : "/dashboard");
    }
  }, [loading, role, user]);

  if (loading || (user && user.role !== role)) return <DashboardLayoutSkeleton />;
  if (!user) return <DashboardSignIn />;

  return (
    <SidebarProvider open className="blue-workspace" style={{ "--sidebar-width": "16rem" } as React.CSSProperties}>
      <DashboardShell role={role}>{children}</DashboardShell>
    </SidebarProvider>
  );
}

function DashboardSignIn() {
  const { t } = useLanguage();
  return (
    <main className="minimal-auth-state blue-auth-state">
      <div>
        <p className="minimal-eyebrow">{t("nav.workspace")}</p>
        <h1>{t("login.heroTitle")}</h1>
        <p>{t("login.helpText")}</p>
        <Button
          className="mt-7 min-h-12 w-full rounded-lg"
          onClick={() => {
            window.location.href = "/login";
          }}
        >
          {t("nav.signIn")}
        </Button>
      </div>
    </main>
  );
}

function DashboardShell({ children, role }: { children: React.ReactNode; role: DashboardRole }) {
  const { user, logout } = useAuth();
  const { t, isRTL } = useLanguage();
  const [location, setLocation] = useLocation();

  const menuByRole: Record<DashboardRole, { icon: typeof LayoutDashboard; label: string; labelKey: string; defaultLabel: string; path: string }[]> = {
    founder: [
      { icon: LayoutDashboard, label: "Overview", labelKey: "nav.overview", defaultLabel: "Overview", path: "/admin" },
      { icon: UsersRound, label: "Users", labelKey: "nav.users", defaultLabel: "Users", path: "/admin/users" },
      { icon: GraduationCap, label: "Students", labelKey: "nav.students", defaultLabel: "Students", path: "/admin/students" },
      { icon: Newspaper, label: "News", path: "/admin/news", labelKey: "nav.news", defaultLabel: "News" },
      { icon: FileImage, label: "Media", labelKey: "nav.media", defaultLabel: "Media", path: "/admin/media" },
      { icon: ScrollText, label: "Audit logs", labelKey: "nav.auditLogs", defaultLabel: "Audit logs", path: "/admin/audit-logs" },
    ],
    super_admin: [
      { icon: LayoutDashboard, label: "Overview", labelKey: "nav.overview", defaultLabel: "Overview", path: "/super-admin" },
      { icon: UsersRound, label: "Users", labelKey: "nav.users", defaultLabel: "Users", path: "/super-admin/users" },
      { icon: ScrollText, label: "Audit logs", labelKey: "nav.auditLogs", defaultLabel: "Audit logs", path: "/super-admin/audit-logs" },
    ],
    teacher: [
      { icon: CalendarDays, label: "My classes", labelKey: "nav.myClasses", defaultLabel: "My classes", path: "/teacher" },
    ],
  };

  const menuItems = menuByRole[role];
  const active =
    menuItems.filter((item) => location === item.path || location.startsWith(`${item.path}/`)).sort((a, b) => b.path.length - a.path.length)[0] ??
    menuItems[0];

  return (
    <>
      <Sidebar collapsible="icon" className={`minimal-sidebar fixed inset-y-0 ${isRTL ? "right-0 border-l" : "left-0 border-r-0"}`}>
        <SidebarHeader className="minimal-sidebar-header">
          <span className="minimal-brand-mark" aria-hidden="true">
            BI
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <strong>Bilingual Idol</strong>
            <small>Learning centre</small>
          </span>
        </SidebarHeader>
        <SidebarContent className="minimal-sidebar-content">
          <p className="minimal-sidebar-label group-data-[collapsible=icon]:hidden">{t("nav.workspace")}</p>
          <SidebarMenu className="px-2">
            {menuItems.map((item) => {
              const isActive = item.path === active.path;
              const Icon = item.icon;
              const itemLabel = t(item.labelKey, undefined, item.label);
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.label}
                    onClick={() => setLocation(item.path)}
                    className={isActive ? "minimal-nav-item minimal-nav-item-active" : "minimal-nav-item"}
                  >
                    <Icon size={18} />
                    <span>{itemLabel}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="minimal-sidebar-footer">
          <div className="flex min-w-0 items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-9 w-9 border border-[#d9e2f1]">
              <AvatarFallback className="bg-[#e8eeff] text-xs font-bold text-[#173fad]">
                {user?.name?.slice(0, 1).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold text-[#10253e]">{user?.name || "Account"}</p>
              <p className="truncate text-xs text-[#566983]">{user?.email || ""}</p>
            </div>
          </div>
          <button className="minimal-signout group-data-[collapsible=icon]:justify-center" onClick={logout}>
            <LogOut size={16} />
            <span className="group-data-[collapsible=icon]:hidden">{t("nav.signOut")}</span>
          </button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className={`minimal-dashboard-inset ${isRTL ? "rtl-inset" : ""}`}>
        <BackgroundCircleField seed={`dashboard-${role}-${location}`} />
        <header className="minimal-dashboard-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="minimal-mobile-trigger" />
            <div>
              <p className="minimal-eyebrow">{t("nav.workspace")}</p>
              <h1>{t(active.labelKey, undefined, active.defaultLabel)}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="dropdown" />
            <span className="hidden text-xs font-medium text-[#61727c] sm:inline">{t("nav.accountActive")}</span>
          </div>
        </header>
        <main className="minimal-dashboard-main workspace-surface">{children}</main>
      </SidebarInset>
    </>
  );
}
