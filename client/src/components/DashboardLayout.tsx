import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { FileImage, GraduationCap, LayoutDashboard, LogOut, ScrollText, UsersRound } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

type DashboardRole = "founder" | "super_admin";

const menuByRole: Record<DashboardRole, { icon: typeof LayoutDashboard; label: string; path: string }[]> = {
  founder: [
    { icon: LayoutDashboard, label: "Overview", path: "/admin" },
    { icon: UsersRound, label: "Users", path: "/admin/users" },
    { icon: GraduationCap, label: "Students", path: "/admin/students" },
    { icon: FileImage, label: "Media", path: "/admin/media" },
    { icon: ScrollText, label: "Audit logs", path: "/admin/audit-logs" },
  ],
  super_admin: [
    { icon: LayoutDashboard, label: "Overview", path: "/super-admin" },
    { icon: UsersRound, label: "Users", path: "/super-admin/users" },
    { icon: ScrollText, label: "Audit logs", path: "/super-admin/audit-logs" },
  ],
};

export default function DashboardLayout({ children, role = "founder" }: { children: React.ReactNode; role?: DashboardRole }) {
  const { loading, user } = useAuth();

  useEffect(() => {
    if (!loading && user && user.role !== role) {
      window.location.replace(user.role === "super_admin" ? "/super-admin" : user.role === "founder" ? "/admin" : "/dashboard");
    }
  }, [loading, role, user]);

  if (loading || (user && user.role !== role)) return <DashboardLayoutSkeleton />;
  if (!user) return <DashboardSignIn />;

  return <SidebarProvider open className="blue-workspace" style={{ "--sidebar-width": "16rem" } as React.CSSProperties}>
    <DashboardShell role={role}>{children}</DashboardShell>
  </SidebarProvider>;
}

function DashboardSignIn() {
  return <main className="minimal-auth-state blue-auth-state"><div><p className="minimal-eyebrow">Secure workspace</p><h1>Sign in to continue</h1><p>Use the e-mail and password issued for your account.</p><Button className="mt-7 min-h-12 w-full rounded-lg" onClick={() => { window.location.href = "/login"; }}>Sign in</Button></div></main>;
}

function DashboardShell({ children, role }: { children: React.ReactNode; role: DashboardRole }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const menuItems = menuByRole[role];
  const active = menuItems.filter(item => location === item.path || location.startsWith(`${item.path}/`)).sort((a, b) => b.path.length - a.path.length)[0] ?? menuItems[0];

  return <>
    <Sidebar collapsible="icon" className="minimal-sidebar fixed inset-y-0 left-0 border-r-0">
      <SidebarHeader className="minimal-sidebar-header">
        <span className="minimal-brand-mark" aria-hidden="true">BI</span>
        <span className="min-w-0 group-data-[collapsible=icon]:hidden"><strong>Bilingual Idol</strong><small>Learning centre</small></span>
      </SidebarHeader>
      <SidebarContent className="minimal-sidebar-content">
        <p className="minimal-sidebar-label group-data-[collapsible=icon]:hidden">Workspace</p>
        <SidebarMenu className="px-2">
          {menuItems.map(item => {
            const isActive = item.path === active.path;
            const Icon = item.icon;
            return <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={isActive} tooltip={item.label} onClick={() => setLocation(item.path)} className={isActive ? "minimal-nav-item minimal-nav-item-active" : "minimal-nav-item"}><Icon size={18} /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>;
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="minimal-sidebar-footer">
        <div className="flex min-w-0 items-center gap-3 group-data-[collapsible=icon]:justify-center"><Avatar className="h-9 w-9 border border-[#d9e2f1]"><AvatarFallback className="bg-[#e8eeff] text-xs font-bold text-[#173fad]">{user?.name?.slice(0, 1).toUpperCase() || "U"}</AvatarFallback></Avatar><div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-semibold text-[#10253e]">{user?.name || "Account"}</p><p className="truncate text-xs text-[#566983]">{user?.email || ""}</p></div></div>
        <button className="minimal-signout group-data-[collapsible=icon]:justify-center" onClick={logout}><LogOut size={16} /><span className="group-data-[collapsible=icon]:hidden">Sign out</span></button>
      </SidebarFooter>
    </Sidebar>
    <SidebarInset className="minimal-dashboard-inset">
      <header className="minimal-dashboard-header"><div className="flex items-center gap-3"><SidebarTrigger className="minimal-mobile-trigger" /><div><p className="minimal-eyebrow">Workspace</p><h1>{active.label}</h1></div></div><span className="hidden text-xs font-medium text-[#61727c] sm:inline">Account active</span></header>
      <main className="minimal-dashboard-main workspace-surface">{children}</main>
    </SidebarInset>
  </>;
}
