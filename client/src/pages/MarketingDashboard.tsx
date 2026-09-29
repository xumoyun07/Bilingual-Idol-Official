import React, { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout, { DashboardContentArea } from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, ShieldAlert } from "lucide-react";

// Import actual marketing modules from components/founder
import { MarketingAnalyticsModule } from "@/components/founder/MarketingAnalyticsModule";
import { MarketingCampaignsModule } from "@/components/founder/MarketingCampaignsModule";
import { MarketingContentModule } from "@/components/founder/MarketingContentModule";
import { MarketingTestimonialsModule } from "@/components/founder/MarketingTestimonialsModule";
import MediaLibrary from "./MediaLibrary";
import { AdminLeadsModule } from "@/components/founder/AdminLeadsModule";

export default function MarketingDashboard() {
  const { user, loading } = useAuth();
  const { td, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      window.location.replace("/login");
    } else if (user.role !== "marketing" && user.role !== "founder" && user.role !== "super_admin" && user.role !== "admin") {
      window.location.replace("/dashboard");
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#fbf8f2]">
        <Loader2 className="animate-spin text-[#173fad]" />
      </div>
    );
  }

  if (!user) return null;

  const renderActiveModule = () => {
    switch (activeTab) {
      case "overview":
        return <MarketingAnalyticsModule />;
      case "content":
        return <MarketingContentModule />;
      case "media":
        return <MediaLibrary />;
      case "audiences":
        return <MarketingCampaignsModule />;
      case "channels":
        return <MarketingTestimonialsModule />;
      case "settings":
        return <AdminLeadsModule />; // Lead generation settings/CTA
      case "restrictions":
        return (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#eee4d7] shadow-xs space-y-6 text-start">
            <div className="flex items-center gap-3 border-b border-[#eee4d7] pb-4">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#10253e]">{td("Marketing Guardrails & Policies")}</h2>
                <p className="text-xs text-[#53657a]">{td("Official compliance rules & content publishing guidelines")}</p>
              </div>
            </div>
            
            <div className="space-y-4 text-sm text-[#53657a] leading-relaxed">
              <p>
                {td("All media assets, promotional codes, and homepage hero texts must align with the official Bilingual Idol brand guidelines. Creative assets larger than 5MB should be optimized before upload. Promotion codes require founder approval for discounts greater than 25%.")}
              </p>
              
              <div className="p-4 rounded-xl bg-[#faf7f2] border border-[#eee4d7]/70 text-xs flex gap-3">
                <span className="text-amber-600 font-bold">⚠️ {td("Important Note:")}</span>
                <span>{td("Violation of brand safety thresholds or publishing non-approved creatives on the direct customer-facing interface will result in instant account lock and a platform audit.")}</span>
              </div>
            </div>
          </div>
        );
      default:
        return <MarketingAnalyticsModule />;
    }
  };

  return (
    <DashboardLayout role="marketing" activeTab={activeTab} setActiveTab={setActiveTab}>
      <div id="marketing-dashboard-container" className={`w-full ${isRTL ? "dir-rtl" : ""}`}>
        <DashboardContentArea>
          {renderActiveModule()}
        </DashboardContentArea>
      </div>
    </DashboardLayout>
  );
}

