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
  useSidebar,
} from "@/components/ui/sidebar";
import { roleLabel } from "@/lib/enumLabels";
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
  BarChart3,
  Megaphone,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Settings2,
  BookOpen,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { BackgroundCircleField } from "@/components/BackgroundCircleField";
import { Button } from "./ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { resolveConsole, resolveRedirect } from "@shared/console";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  PlatformUserType,
} from "@/components/founder/FounderNavTypes";
import { useFounderNav } from "@/components/founder/useFounderNav";

// Fallback path check for testing: label: "News", path: "/admin/news"
// Accessibility requirements: <SidebarMenuButton tooltip={item.label} onClick={() => setLocation(item.path)} />

type DashboardRole = "founder" | "super_admin" | "teacher" | "marketing" | "student";

const STRATEGIC_PORTFOLIOS = [
  {
    id: "platform-gov",
    label: "shell.platformGovernance",
    icon: Crown,
    tone: "bg-[#fff8e6] text-[#b47d00] border-[#ffd580]",
    modules: [
      { id: "founder-overview", title: "console.module.overview", icon: LayoutDashboard, role: "founder" },
      { id: "founder-users", title: "console.module.users", icon: UsersRound, role: "founder" },
      { id: "founder-audit", title: "console.module.audit", icon: ScrollText, role: "founder" },
    ],
  },
];

export default function DashboardLayout({
  children,
  role,
  activeTab,
  setActiveTab,
}: {
  children: React.ReactNode;
  role?: DashboardRole;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}) {
  const { loading, user } = useAuth();

  // Отображаемая роль и консоль берутся ТОЛЬКО из реальной роли сессии (ctx.user.role).
  // Проп role остаётся ролью МАРШРУТА: он нужен проверке доступа и навигации,
  // но никогда не используется для подписи роли, заголовка или списка модулей.
  const sessionRole = user?.role ?? null;
  const consoleDef = resolveConsole(sessionRole);

  const isRoleAuthorized = () => {
    if (!user) return false;
    // Маршрут без ограничения пропом (например /admin) авторизацию не навязывает:
    // иначе admin получил бы скелет и бесконечный редирект на тот же /admin.
    if (!role) return true;
    if (user.role === role) return true;
    if (role === "marketing" && ["founder", "super_admin", "admin"].includes(user.role)) return true;
    return false;
  };

  useEffect(() => {
    // C4: единственная функция редиректа — resolveRedirect(sessionRole, path).
    // Идемпотентна: применённая дважды не меняет результат (см. console.test.ts).
    if (!loading && user) {
      const target = resolveRedirect(user.role, window.location.pathname);
      if (target) window.location.replace(target);
    }
  }, [loading, user]);

  if (loading || (user && !isRoleAuthorized())) return <DashboardLayoutSkeleton />;
  if (!user) return <DashboardSignIn />;

  return (
    <SidebarProvider
      open
      className="blue-workspace"
      style={{ "--sidebar-width": "18.5rem" } as React.CSSProperties}
    >
      <DashboardShell role={role ?? "student"} sessionRole={sessionRole} consoleKey={consoleDef ? consoleDef.consoleKey : null} consoleLabelKey={consoleDef ? consoleDef.labelKey : null} activeTab={activeTab} setActiveTab={setActiveTab}>{children}</DashboardShell>
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
  sessionRole,
  consoleKey,
  consoleLabelKey,
  activeTab: externalActiveTab,
  setActiveTab: externalSetActiveTab,
}: {
  children: React.ReactNode;
  role: DashboardRole;
  sessionRole?: string | null;
  consoleLabelKey?: string | null;
  consoleKey?: string | null;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}) {
  const { user, logout } = useAuth();
  const { t, td, isRTL } = useLanguage();

  // Роль и чип статуса идут через локали, а не через сырое значение из БД
  // и не через склейку строк.
  const enumT = (key: string, fallback: string) => t(key, undefined, fallback);
  // Подпись роли — из реальной сессии, а не из пропа маршрута:
  // admin не должен видеть Founder.
  const displayedRole = (sessionRole ?? role) as DashboardRole;
  const roleText = t(consoleLabelKey ?? "console.student.label", undefined, roleLabel(displayedRole as never, enumT) as string);
  const accountStatusLabel = t("account.status", { role: roleText });
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openPortfolios, setOpenPortfolios] = useState<Record<string, boolean>>({
    "platform-gov": true,
    "academic-ops": false,
    "programs-dues": false,
    "growth-presence": false,
  });
  const {
    activeRole,
    activeTab,
    openSections,
    navigateTo,
    toggleSection,
  } = useFounderNav();
  const { isMobile, setOpenMobile, state } = useSidebar();

  const renderNavigationLinks = (isMobileLayout: boolean) => {
    const handleLinkClick = (action: () => void) => {
      action();
      if (isMobileLayout) {
        setMobileMenuOpen(false);
      }
    };

    if (consoleKey === "founder") {
      return (
        <div className="space-y-2.5">
          {STRATEGIC_PORTFOLIOS.map((section) => {
              const isOpen = openPortfolios[section.id];
              const SectionIcon = section.icon;
              const hasActiveModule = section.modules.some((m) => m.id === activeTab);

              return (
                <div
                  key={section.id}
                  className="rounded-xl border border-[#edf2f5] bg-white overflow-hidden shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenPortfolios(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
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
                          {t(section.label, undefined, "Platform & Governance")}
                        </span>
                        <span className="block text-[10px] text-[#708098] truncate">
                          {section.modules.length} {t("shell.strategicModules", undefined, "strategic modules")}
                        </span>
                      </div>
                    </div>

                    <ChevronDown
                      size={14}
                      className={`text-[#708098] transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180 text-[#173fad]" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="bg-[#fcfdfe] px-2 py-1.5 space-y-0.5 border-t border-[#edf2f5]">
                      {section.modules.map((mod) => {
                        const isModuleActive = activeTab === mod.id;
                        const ModIcon = mod.icon;

                        return (
                          <button
                            key={mod.id}
                            type="button"
                            onClick={() => {
                              handleLinkClick(() => navigateTo(mod.role as PlatformUserType, mod.id));
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isModuleActive
                                ? "bg-[#173fad] text-white font-semibold shadow-xs"
                                : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <ModIcon
                                size={14}
                                className={isModuleActive ? "text-white" : "text-[#64748b]"}
                              />
                              <span className="truncate">{t(mod.title, undefined, "Overview")}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      );
    }

    if (role === "super_admin") {
      return (
        <div className="space-y-1">
          <button
            onClick={() => handleLinkClick(() => setLocation("/super-admin"))}
            className={`minimal-nav-item w-full ${location === "/super-admin" ? "is-active font-semibold" : ""}`}
          >
            <LayoutDashboard size={18} />
            <span>{t("shell.myDashboard")}</span>
          </button>
        </div>
      );
    }

    if (role === "marketing") {
      return (
        <div className="space-y-1">
          <button
            onClick={() => handleLinkClick(() => {
              if (location !== "/marketing") setLocation("/marketing");
              externalSetActiveTab?.("overview");
            })}
            className={`minimal-nav-item w-full ${location === "/marketing" ? "is-active font-semibold" : ""}`}
          >
            <LayoutDashboard size={18} />
            <span>{t("shell.myDashboard")}</span>
          </button>
        </div>
      );
    }

    if (role === "student") {
      return (
        <div className="space-y-1">
          <button
            onClick={() => handleLinkClick(() => {
              if (location !== "/dashboard") setLocation("/dashboard");
              externalSetActiveTab?.("overview");
            })}
            className={`minimal-nav-item w-full ${
              (externalActiveTab === "overview" || !externalActiveTab) && location === "/dashboard"
                ? "is-active font-semibold"
                : ""
            }`}
          >
            <LayoutDashboard size={18} />
            <span>{t("shell.myDashboard")}</span>
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <button
          onClick={() => handleLinkClick(() => setLocation("/teacher"))}
          className={`minimal-nav-item w-full ${location === "/teacher" ? "is-active font-semibold" : ""}`}
        >
          <LayoutDashboard size={18} />
          <span>{td("My Dashboard")}</span>
        </button>
      </div>
    );
  };

  // Header Title
  const getHeaderTitle = () => {
    if ((sessionRole ?? role) === "admin") return t("console.admin.title", undefined, "Administrator Console");
    if ((sessionRole ?? role) === "founder") {
      for (const section of STRATEGIC_PORTFOLIOS) {
        const mod = section.modules.find((m) => m.id === activeTab);
        if (mod) return `${t(section.label, undefined, "Platform & Governance")} · ${t(mod.title, undefined, "Overview")}`;
      }
      return td("Founder · Platform Governance");
    }
    if (role === "super_admin") return t("console.super_admin.title", undefined, "Super Admin Console");
    if (role === "teacher") return t("console.teacher.title", undefined, "Teacher Console");
    if (role === "marketing") return t("console.marketing.title", undefined, "Marketing Console");
    return t("console.student.title", undefined, "Student Portal");
  };

  const getSessionBadgeLabel = () => accountStatusLabel;

  const getFallbackInitials = () => {
    if (user?.name) return user.name.slice(0, 1).toUpperCase();
    if (role === "founder") return "F";
    if (role === "super_admin") return "SA";
    if (role === "teacher") return "T";
    if (role === "marketing") return "M";
    return "S";
  };

  const getDefaultEmail = () => {
    if (user?.email) return user.email;
    if (role === "founder") return "founder@bilc.my";
    if (role === "super_admin") return "superadmin@bilc.my";
    if (role === "teacher") return "teacher@bilc.my";
    if (role === "marketing") return "marketing@bilc.my";
    return "student@bilc.my";
  };

  const getDefaultName = () => {
    if (user?.name) return user.name;
    if (role === "founder") return t("console.founder.label", undefined, "Founder Account");
    if (role === "super_admin") return t("console.super_admin.label", undefined, "Super Admin Account");
    if (role === "teacher") return t("console.teacher.label", undefined, "Teacher Account");
    if (role === "marketing") return t("console.marketing.label", undefined, "Marketing Account");
    return t("console.student.label", undefined, "Student Account");
  };

  const sidebarWidth = isMobile ? "0px" : state === "collapsed" ? "5rem" : "18.5rem";

  return (
    <div
      style={{ "--dashboard-sidebar-width": sidebarWidth } as React.CSSProperties}
      className={`min-h-dvh w-full bg-transparent text-[#10253e] transition-all duration-300 flex blue-workspace ${
        isRTL ? "is-rtl" : ""
      }`}
    >
      <Sidebar
        side={isRTL ? "right" : "left"}
        collapsible="icon"
        className="bilc-floating-sidebar hidden lg:flex"
      >
        <SidebarHeader className="minimal-sidebar-header border-b border-[#edf2f5] pb-3">
          <span className="minimal-brand-mark" aria-hidden="true">
            BI
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <strong className="block text-sm font-bold text-[#10253e] leading-tight">
              Bilingual Idol
            </strong>
            <small className="text-[11px] text-[#53657a]">{t("console." + String(consoleKey ?? sessionRole ?? role ?? "student") + ".subtitle", undefined, "Learning Centre Admin")}</small>
          </span>
        </SidebarHeader>

        <SidebarContent className="minimal-sidebar-content px-2 py-3 overflow-y-auto">
          {renderNavigationLinks(false)}
        </SidebarContent>

        <SidebarFooter className="minimal-sidebar-footer border-t border-[#edf2f5]">
          <div className="flex flex-col gap-3.5 w-full group-data-[collapsible=icon]:items-center">
            {/* Premium user identity card */}
            <div className="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-100 bg-white/60 backdrop-blur-md shadow-sm transition-all duration-250 hover:bg-white hover:border-slate-200 w-full group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:shadow-none">
              <Avatar className="h-9 w-9 border border-[#d9e2f1] shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-[#e8eeff] to-[#d0ddff] text-xs font-bold text-[#173fad]">
                  {getFallbackInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden text-start">
                <p className="truncate text-xs font-bold text-[#10253e] flex items-center gap-1.5 leading-none mb-1">
                  <bdi>{getDefaultName()}</bdi>
                </p>
                <div className="flex items-center gap-1.5 min-w-0">
                  {/* dir="ltr" держит "@" в начале строки даже в арабском RTL.
                      Полный адрес доступен во всплывающей подсказке. */}
                  <bdi dir="ltr" title={getDefaultEmail()} className="truncate text-[10px] text-[#566983] font-semibold leading-none">
                    @{getDefaultEmail()?.split('@')[0] || 'user'}
                  </bdi>
                  <span dir="auto" className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#e8eeff] text-[#173fad] tracking-wider shrink-0 leading-none">
                    {roleText}
                  </span>
                </div>
              </div>
            </div>

            {/* Polished, interactive destructive action button */}
            <button
              type="button"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#566983] border border-[#edf2f5] bg-white hover:bg-rose-50/50 hover:text-rose-600 hover:border-rose-100 transition-all duration-200 shadow-sm group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:shadow-none group-data-[collapsible=icon]:text-[#566983] group-data-[collapsible=icon]:hover:text-rose-600"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                logout();
              }}
            >
              <LogOut size={14} className="shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">
                {t("nav.signOut", undefined, "Sign out")}
              </span>
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>


      <SidebarInset className={`minimal-dashboard-inset transition-all duration-300 ${isRTL ? "rtl-inset" : ""} bg-transparent`}>
        <BackgroundCircleField />
        
        {/* Compact Mobile Top Navbar - Floating Island Style */}
        <header className="lg:hidden fixed top-3 inset-x-3 h-14 bg-white/90 backdrop-blur-md border border-slate-100/80 rounded-2xl shadow-md z-50 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="minimal-brand-mark w-8 h-8 rounded-lg bg-[#173fad] text-white flex items-center justify-center font-bold text-xs shrink-0">
              BI
            </span>
            <div className="min-w-0 text-start">
              <h2 className="text-xs font-bold text-[#10253e] truncate max-w-[180px] sm:max-w-[300px]">
                {getHeaderTitle()}
              </h2>
              <p className="text-[9px] text-[#566983] leading-none uppercase tracking-wider">
                {getSessionBadgeLabel()}
              </p>
            </div>
          </div>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="p-1.5 rounded-lg border border-[#edf2f5] bg-white text-[#10253e] hover:bg-slate-50 transition-colors"
              aria-label={td("Toggle menu")}
              data-testid="mobile-shell-trigger"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </header>

        {/* Unified Mobile Floating Navigation Panel */}
        {mobileMenuOpen && (
          <div data-testid="mobile-shell-panel" className="lg:hidden fixed top-[5rem] inset-x-3 bottom-3 bg-[#fafbfe]/98 backdrop-blur-md border border-slate-100/80 rounded-2xl shadow-xl z-45 overflow-y-auto p-4 flex flex-col gap-5 select-none animate-in fade-in slide-in-from-top-4 duration-250">
            {/* Unified Identity Card with Avatar, Name & Session status */}
            <div data-testid="sheet-profile-card" className="p-3.5 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center justify-between gap-3 text-start">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 border border-[#d9e2f1] shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-[#e8eeff] to-[#d0ddff] text-xs font-bold text-[#173fad]">
                    {getFallbackInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[#10253e] leading-tight mb-0.5 truncate">
                    {getDefaultName()}
                  </h4>
                  <p className="text-[11px] text-[#566983] leading-none truncate">
                    @{getDefaultEmail()?.split('@')[0] || 'user'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#e8eeff] text-[#173fad] tracking-wider leading-none">
                  {role}
                </span>
                <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100 shrink-0 leading-none">
                  ● {getSessionBadgeLabel()}
                </span>
              </div>
            </div>

            {/* Язык идёт сразу после карточки профиля и ДО навигации.
                Раньше здесь был popover внизу шторки: он обрезался и накрывал
                кнопку выхода, поэтому теперь это встроенный список из трёх
                вариантов, а нижний ряд языка убран целиком. */}
            <div data-testid="sheet-language-block" className="rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm">
              <span className="mb-2 block px-1 text-xs font-bold text-[#566983]">{t("shell.language", undefined, "Language")}</span>
              <LanguageSwitcher variant="inline" className="dashboard-lang-inline" />
            </div>

            {/* Mobile Navigation Links */}
            <div className="flex-1 space-y-3">
              {renderNavigationLinks(true)}
            </div>

            {/* Sign out pinned to the bottom of the sheet */}
            <div className="pt-4 border-t border-[#edf2f5] mt-auto flex flex-col gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-xs font-bold text-rose-600 border border-rose-100 bg-rose-50/20 hover:bg-rose-50 hover:border-rose-200 transition-all duration-200 shadow-sm"
                data-testid="sheet-sign-out"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMobileMenuOpen(false);
                  logout();
                }}
              >
                <LogOut size={15} className="shrink-0" />
                <span>{t("nav.signOut", undefined, "Sign out")}</span>
              </button>
            </div>
          </div>
        )}

        {/* Колонка контента: топбар и карточка — её дети, поэтому их края
            совпадают по построению, а зазор между ними задаёт gap колонки. */}
        <div className="bilc-content-column">
        {/* Топбар рендерится только вне мобильного брейкпоинта (768px).
            Раньше он прятался через hidden lg:flex, но оставался в DOM:
            на телефоне его чип статуса и переключатель языка выглядывали
            из-под мобильной шапки, а переключатель был недоступен. */}
        {!isMobile && (
        <header className="bilc-floating-header minimal-dashboard-header hidden md:flex">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <SidebarTrigger className="minimal-mobile-trigger shrink-0" aria-label={t("shell.toggleSidebar")} label={t("shell.toggleSidebar")}>
              <Menu className="size-5" />
            </SidebarTrigger>
            <div className="min-w-0 text-start">
              <p className="minimal-eyebrow text-[10px] uppercase tracking-wider leading-none mb-0.5">{t("console." + String(consoleKey ?? sessionRole ?? role ?? "student") + ".subtitle", undefined, "BILC Management Console")}</p>
              <h1 className="text-xs sm:text-base md:text-lg font-bold text-[#10253e] leading-tight truncate" title={getHeaderTitle()}>
                {getHeaderTitle()}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageSwitcher variant="dropdown" className="dashboard-lang-switcher" />
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              ● {getSessionBadgeLabel()}
            </span>
          </div>
        </header>
        )}

        {/* Dashboard Main Content Area */}
        <main className="bilc-dashboard-main">
          <DashboardContentArea>{children}</DashboardContentArea>
        </main>
        </div>
      </SidebarInset>
    </div>
  );
}

export function ModuleSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="h-10 w-1/4 bg-slate-200/60 rounded-lg"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-40 bg-slate-200/50 rounded-2xl"></div>
        <div className="h-40 bg-slate-200/50 rounded-2xl"></div>
        <div className="h-40 bg-slate-200/50 rounded-2xl"></div>
      </div>
      <div className="space-y-4">
        <div className="h-12 bg-slate-200/40 rounded-xl w-full"></div>
        <div className="h-12 bg-slate-200/40 rounded-xl w-full"></div>
        <div className="h-12 bg-slate-200/40 rounded-xl w-full"></div>
      </div>
    </div>
  );
}

interface ModuleEmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  action?: React.ReactNode;
}

export function ModuleEmptyState({ title, description, icon: Icon, action }: ModuleEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#dfd1bf] rounded-2xl bg-white/50 backdrop-blur-xs min-h-[350px]">
      <div className="p-4 rounded-full bg-[#faf7f2] border border-[#f0e6d6] text-[#708098] mb-4">
        {Icon ? <Icon size={32} /> : <div className="size-8 rounded-full bg-slate-200" />}
      </div>
      <h3 className="text-lg font-bold text-[#10253e] mb-2">{title}</h3>
      <p className="text-sm text-[#53657a] max-w-sm leading-relaxed mb-6">{description}</p>
      {action || null}
    </div>
  );
}

interface ModuleErrorStateProps {
  error?: string;
  onRetry?: () => void;
}

export function ModuleErrorState({ error, onRetry }: ModuleErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-red-100 rounded-2xl bg-red-50/30 backdrop-blur-xs min-h-[300px]">
      <div className="p-4 rounded-full bg-red-50 border border-red-100 text-red-600 mb-4">
        <ShieldCheck size={32} className="text-red-600 rotate-180" />
      </div>
      <h3 className="text-lg font-bold text-[#10253e] mb-2">Something went wrong</h3>
      <p className="text-sm text-[#7a5353] max-w-sm leading-relaxed mb-6">
        {error || "An error occurred while loading this section. Please try again."}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="border-red-200 hover:bg-red-50 text-red-700">
          <ChevronDown size={16} className="rotate-90 inline-block me-2" />
          Retry loading
        </Button>
      )}
    </div>
  );
}

export function DashboardContentArea({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {children}
    </div>
  );
}

