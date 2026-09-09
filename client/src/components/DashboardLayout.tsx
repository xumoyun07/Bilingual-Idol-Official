import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  CalendarDays,
  ChevronDown,
  Crown,
  FileImage,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  ScrollText,
  Shield,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { BackgroundCircleField } from "@/components/BackgroundCircleField";
import { Button } from "./ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  FOUNDER_NAVIGATION_SECTIONS,
  PlatformUserType,
} from "@/components/founder/FounderNavTypes";

type DashboardRole = "founder" | "super_admin" | "teacher";

export default function DashboardLayout({
  children,
  role = "founder",
}: {
  children: React.ReactNode;
  role?: DashboardRole;
}) {
  const { loading, user } = useAuth();

  useEffect(() => {
    if (!loading && user && user.role !== role) {
      window.location.replace(
        user.role === "super_admin"
          ? "/super-admin"
          : user.role === "founder"
          ? "/admin"
          : "/dashboard"
      );
    }
  }, [loading, role, user]);

  if (loading || (user && user.role !== role)) return <DashboardLayoutSkeleton />;
  if (!user) return <DashboardSignIn />;

  return (
    <SidebarProvider
      open
      className="blue-workspace"
      style={{ "--sidebar-width": "18.5rem" } as React.CSSProperties}
    >
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

function DashboardShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: DashboardRole;
}) {
  const { user, logout } = useAuth();
  const { t, isRTL } = useLanguage();
  const [location, setLocation] = useLocation();

  // Founder Nested Menu State
  const [openSections, setOpenSections] = useState<Record<PlatformUserType, boolean>>({
    founder: true,
    super_admin: false,
    admin: false,
    teacher: false,
    marketing: false,
  });

  // Determine current active module and user type from search query or location
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const activeRoleParam = (searchParams.get("role") as PlatformUserType) || "founder";
  const activeTabParam = searchParams.get("tab") || "";

  // Helper to map pathname to active tab
  const getActiveTab = () => {
    if (activeTabParam) return activeTabParam;
    if (location === "/admin/users") return "founder-users";
    if (location === "/admin/students") return "founder-students";
    if (location === "/admin/news") return "founder-news";
    if (location === "/admin/media") return "founder-media";
    if (location === "/admin/audit-logs") return "founder-audit";
    return "founder-overview";
  };

  const activeTab = getActiveTab();

  // Auto-expand section matching activeRoleParam
  useEffect(() => {
    if (role === "founder") {
      setOpenSections((prev) => ({
        ...prev,
        [activeRoleParam]: true,
      }));
    }
  }, [activeRoleParam, role]);

  const toggleSection = (userType: PlatformUserType) => {
    setOpenSections((prev) => ({
      ...prev,
      [userType]: !prev[userType],
    }));
  };

  const handleModuleClick = (userType: PlatformUserType, moduleId: string) => {
    // Map directly to admin query router
    const targetUrl = `/admin?role=${userType}&tab=${moduleId}`;
    setLocation(targetUrl);
  };

  // Header Title
  const getHeaderTitle = () => {
    if (role === "founder") {
      for (const section of FOUNDER_NAVIGATION_SECTIONS) {
        const mod = section.modules.find((m) => m.id === activeTab);
        if (mod) return `${section.label} · ${mod.title}`;
      }
      return "Founder · Platform Governance";
    }
    if (role === "super_admin") return "Super Admin Workspace";
    return "Teacher Workspace";
  };

  return (
    <>
      <Sidebar
        side={isRTL ? "right" : "left"}
        collapsible="icon"
        className={`minimal-sidebar fixed inset-y-0 ${
          isRTL ? "right-0 border-l" : "left-0 border-r-0"
        }`}
      >
        <SidebarHeader className="minimal-sidebar-header border-b border-[#edf2f5] pb-3">
          <span className="minimal-brand-mark" aria-hidden="true">
            BI
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <strong className="block text-sm font-bold text-[#10253e] leading-tight">
              Bilingual Idol
            </strong>
            <small className="text-[11px] text-[#53657a]">Learning Centre Admin</small>
          </span>
        </SidebarHeader>

        <SidebarContent className="minimal-sidebar-content px-2 py-3 overflow-y-auto space-y-4">
          {role === "founder" ? (
            <div className="space-y-2">
              <div className="px-2 py-1 flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#708098]">
                  Platform User Types & Modules
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#e8eeff] text-[#173fad]">
                  Founder Access
                </span>
              </div>

              {/* Render User Types Main Menu (Student Excluded) */}
              <div className="space-y-1.5">
                {FOUNDER_NAVIGATION_SECTIONS.map((section) => {
                  const isOpen = openSections[section.type];
                  const SectionIcon = section.icon;
                  const hasActiveModule = section.modules.some((m) => m.id === activeTab);

                  return (
                    <div
                      key={section.type}
                      className="rounded-xl border border-[#edf2f5] bg-white overflow-hidden shadow-xs"
                    >
                      {/* User Type Header / Click to Toggle Submenu */}
                      <button
                        type="button"
                        onClick={() => toggleSection(section.type)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${
                          hasActiveModule
                            ? "bg-[#f8fafc] text-[#10253e]"
                            : "hover:bg-[#fafbfc] text-[#33475b]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-bold border ${section.tone}`}
                          >
                            <SectionIcon size={15} />
                          </span>
                          <div className="min-w-0">
                            <span className="block text-xs font-bold text-[#10253e] truncate">
                              {section.label}
                            </span>
                            <span className="block text-[10px] text-[#708098] truncate">
                              {section.roleBadge} · {section.modules.length} modules
                            </span>
                          </div>
                        </div>

                        <ChevronDown
                          size={15}
                          className={`text-[#708098] transition-transform duration-200 shrink-0 ${
                            isOpen ? "rotate-180 text-[#173fad]" : ""
                          }`}
                        />
                      </button>

                      {/* Nested Submenu for this User Type */}
                      {isOpen && (
                        <div className="bg-[#fcfdfe] px-2 py-1.5 space-y-0.5 border-t border-[#edf2f5]">
                          {section.modules.map((mod) => {
                            const isModuleActive = activeTab === mod.id;
                            const ModIcon = mod.icon;

                            return (
                              <button
                                key={mod.id}
                                type="button"
                                onClick={() => handleModuleClick(section.type, mod.id)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  isModuleActive
                                    ? "bg-[#173fad] text-white font-semibold shadow-xs"
                                    : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <ModIcon
                                    size={14}
                                    className={
                                      isModuleActive ? "text-white" : "text-[#64748b]"
                                    }
                                  />
                                  <span className="truncate">{mod.title}</span>
                                </div>
                                {mod.badge && (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                      isModuleActive
                                        ? "bg-white/20 text-white"
                                        : "bg-[#edf2f7] text-[#475569]"
                                    }`}
                                  >
                                    {mod.badge}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : role === "super_admin" ? (
            <SidebarMenu className="px-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location === "/super-admin"}
                  onClick={() => setLocation("/super-admin")}
                  className="minimal-nav-item"
                >
                  <LayoutDashboard size={18} />
                  <span>Super Admin Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location === "/super-admin/users"}
                  onClick={() => setLocation("/super-admin/users")}
                  className="minimal-nav-item"
                >
                  <UsersRound size={18} />
                  <span>Staff & Users</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location === "/super-admin/audit-logs"}
                  onClick={() => setLocation("/super-admin/audit-logs")}
                  className="minimal-nav-item"
                >
                  <ScrollText size={18} />
                  <span>Audit Logs</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          ) : (
            <SidebarMenu className="px-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location === "/teacher"}
                  onClick={() => setLocation("/teacher")}
                  className="minimal-nav-item"
                >
                  <CalendarDays size={18} />
                  <span>My Classes & Schedule</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </SidebarContent>

        <SidebarFooter className="minimal-sidebar-footer border-t border-[#edf2f5]">
          <div className="flex min-w-0 items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-9 w-9 border border-[#d9e2f1]">
              <AvatarFallback className="bg-[#e8eeff] text-xs font-bold text-[#173fad]">
                {user?.name?.slice(0, 1).toUpperCase() || "F"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold text-[#10253e]">
                {user?.name || "Founder Account"}
              </p>
              <p className="truncate text-xs text-[#566983]">{user?.email || "founder@bilc.my"}</p>
            </div>
          </div>
          <button
            type="button"
            className="minimal-signout group-data-[collapsible=icon]:justify-center"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              logout();
            }}
          >
            <LogOut size={16} />
            <span className="group-data-[collapsible=icon]:hidden">
              {t("nav.signOut", undefined, "Sign out")}
            </span>
          </button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className={`minimal-dashboard-inset ${isRTL ? "rtl-inset" : ""}`}>
        <BackgroundCircleField seed={`dashboard-${role}-${location}`} />
        <header className="minimal-dashboard-header fixed top-0 z-50 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-[#edf2f5]">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="minimal-mobile-trigger" aria-label="Open menu">
              <Menu className="size-5" />
            </SidebarTrigger>
            <div>
              <p className="minimal-eyebrow">BILC Management Console</p>
              <h1 className="text-lg font-bold text-[#10253e]">{getHeaderTitle()}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="dropdown" />
            <span className="hidden text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 sm:inline">
              ● Founder Session
            </span>
          </div>
        </header>
        <main className="minimal-dashboard-main workspace-surface">{children}</main>
      </SidebarInset>
    </>
  );
}
