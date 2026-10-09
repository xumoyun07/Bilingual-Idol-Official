import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Megaphone } from "lucide-react";

export default function MarketingDashboard() {
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

  if (!user) return null;

  return (
    <DashboardLayout role="marketing" activeTab="overview">
      <div 
        id="marketing-dashboard-container" 
        className={`w-full min-h-[500px] flex flex-col justify-center items-center text-center p-8 bg-white border border-[#eee4d7] rounded-2xl shadow-sm ${isRTL ? "dir-rtl" : ""}`}
      >
        <div className="p-4 rounded-full bg-[#faf7f2] border border-[#f0e6d6] text-[#708098] mb-4">
          <Megaphone size={32} />
        </div>
        <h2 className="text-xl font-bold text-[#10253e] mb-2">
          {td("Marketing Dashboard")}
        </h2>
        <p className="text-sm text-[#53657a] max-w-sm leading-relaxed">
          {td("Your marketing workstation is fully configured and ready. Promotional campaigns and audience segment analytics will appear here once connected.")}
        </p>
      </div>
    </DashboardLayout>
  );
}
