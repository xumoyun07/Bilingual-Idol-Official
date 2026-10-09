import { useEffect, useState, useCallback } from "react";
import { PlatformUserType, FOUNDER_NAVIGATION_SECTIONS } from "./FounderNavTypes";
import { useAuth } from "@/_core/hooks/useAuth";

interface FounderNavState {
  role: PlatformUserType;
  tab: string;
}

function parseCurrentNav(userRole?: string): FounderNavState {
  if (typeof window === "undefined") {
    return { role: "founder", tab: "founder-overview" };
  }

  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const roleParam = searchParams.get("role") as PlatformUserType | null;
  const tabParam = searchParams.get("tab");

  // Check query params first
  if (roleParam && tabParam) {
    return { role: roleParam, tab: tabParam };
  }

  // Check canonical pathname mappings
  if (pathname === "/admin/users") return { role: "founder", tab: "founder-users" };
  if (pathname === "/admin/students") return { role: "founder", tab: "founder-students" };
  if (pathname === "/admin/news") return { role: "founder", tab: "founder-news" };
  if (pathname === "/admin/media") return { role: "founder", tab: "founder-media" };
  if (pathname === "/admin/audit-logs") return { role: "founder", tab: "founder-audit" };
  if (pathname.startsWith("/admin/students/")) return { role: "founder", tab: "founder-students" };

  if (roleParam) {
    const section = FOUNDER_NAVIGATION_SECTIONS.find((s) => s.type === roleParam);
    return { role: roleParam, tab: tabParam || (section?.modules[0]?.id ?? "founder-overview") };
  }

  // Fallback defaults based on authenticated user's role
  if (userRole === "admin") {
    return { role: "admin", tab: tabParam || "admin-overview" };
  }
  if (userRole === "super_admin") {
    return { role: "super_admin", tab: tabParam || "superadmin-overview" };
  }
  if (userRole === "marketing") {
    return { role: "marketing", tab: tabParam || "marketing-overview" };
  }
  if (userRole === "teacher") {
    return { role: "teacher", tab: tabParam || "teacher-schedule" };
  }

  return { role: "founder", tab: tabParam || "founder-overview" };
}

export function useFounderNav() {
  const { user } = useAuth();
  const userRole = user?.role;
  const [navState, setNavState] = useState<FounderNavState>(() => parseCurrentNav(userRole));

  const [openSections, setOpenSections] = useState<Record<PlatformUserType, boolean>>({
    founder: true,
    super_admin: false,
    admin: false,
    teacher: false,
    marketing: false,
  });

  // Align when user object is loaded
  useEffect(() => {
    if (userRole) {
      setNavState(parseCurrentNav(userRole));
      
      // Auto-open sections based on user role permission set
      setOpenSections({
        founder: userRole === "founder",
        super_admin: userRole === "founder" || userRole === "super_admin",
        admin: userRole === "founder" || userRole === "admin",
        teacher: userRole === "founder" || userRole === "admin" || userRole === "teacher",
        marketing: userRole === "founder" || userRole === "admin" || userRole === "marketing",
      });
    }
  }, [userRole]);

  // Keep open section aligned with current active role
  useEffect(() => {
    setOpenSections((prev) => ({
      ...prev,
      [navState.role]: true,
    }));
  }, [navState.role]);

  // Listen to popstate (back/forward buttons) and custom founder-nav events
  useEffect(() => {
    const handlePopState = () => {
      setNavState(parseCurrentNav(userRole));
    };

    const handleCustomNav = (e: Event) => {
      const customEvent = e as CustomEvent<FounderNavState>;
      if (customEvent.detail) {
        setNavState(customEvent.detail);
      } else {
        setNavState(parseCurrentNav(userRole));
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("founder-nav", handleCustomNav);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("founder-nav", handleCustomNav);
    };
  }, [userRole]);

  const navigateTo = useCallback((role: PlatformUserType, tab: string) => {
    const targetUrl = `/admin?role=${role}&tab=${tab}`;
    
    // Update local state immediately with 0 latency
    setNavState({ role, tab });
    
    // Ensure section is open
    setOpenSections((prev) => ({ ...prev, [role]: true }));

    // Update browser history
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", targetUrl);
      // Dispatch custom event to notify all components synchronously
      window.dispatchEvent(
        new CustomEvent("founder-nav", {
          detail: { role, tab },
        })
      );
    }
  }, []);

  const toggleSection = useCallback((userType: PlatformUserType) => {
    setOpenSections((prev) => ({
      ...prev,
      [userType]: !prev[userType],
    }));
  }, []);

  return {
    activeRole: navState.role,
    activeTab: navState.tab,
    openSections,
    navigateTo,
    toggleSection,
  };
}
