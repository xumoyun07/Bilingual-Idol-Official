import React, { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";

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
          <div className="bg-white p-6 rounded-2xl border border-[#dce4e7] shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-[#10253e]">{td("Marketing Guardrails & Policies")}</h2>
            <p className="text-sm text-[#53657a] leading-relaxed">
              {td("All media assets, promotional codes, and homepage hero texts must align with the official Bilingual Idol brand guidelines. Creative assets larger than 5MB should be optimized before upload. Promotion codes require founder approval for discounts greater than 25%.")}
            </p>
          </div>
        );
      default:
        return <MarketingAnalyticsModule />;
    }
  };

  return (
    <DashboardLayout role="marketing" activeTab={activeTab} setActiveTab={setActiveTab}>
      <div id="marketing-dashboard-container" className={`workspace-page marketing-workspace page-marketing mx-auto w-full max-w-[88rem] px-4 sm:px-6 md:px-8 overflow-x-hidden pb-12 ${isRTL ? "dir-rtl" : ""}`}>
        {renderActiveModule()}
      </div>
    </DashboardLayout>
  );
}
