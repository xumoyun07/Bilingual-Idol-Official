import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/DashboardLayout";
import { ShieldCheck } from "lucide-react";

export default function SuperAdmin() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/login" });
  const { td, isRTL } = useLanguage();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#fbf8f2]">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-[#10253e]">{td("Preparing Workspace…")}</h1>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "super_admin") return null;

  return (
    <DashboardLayout role="super_admin" activeTab="overview">
      <div 
        id="superadmin-dashboard-container" 
        data-page="superadmin" 
        className={`workspace-page founder-command w-full min-h-[500px] flex flex-col justify-center items-center text-center p-8 bg-white border border-[#eee4d7] rounded-2xl shadow-sm ${isRTL ? "dir-rtl" : ""}`}
      >
        <div className="p-4 rounded-full bg-[#faf7f2] border border-[#f0e6d6] text-[#708098] mb-4">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-xl font-bold text-[#10253e] mb-2">
          {td("Super Admin Dashboard")}
        </h2>
        <p className="text-sm text-[#53657a] max-w-sm leading-relaxed">
          {td("Your administrator workspace is active. The central management portal is ready for future configuration and data integration.")}
        </p>
      </div>
    </DashboardLayout>
  );
}
