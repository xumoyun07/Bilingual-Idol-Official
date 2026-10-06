import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/DashboardLayout";
import { GraduationCap } from "lucide-react";

export default function TeacherDashboard() {
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
    <DashboardLayout role="teacher" activeTab="overview">
      <div 
        id="teacher-dashboard-container" 
        data-page="teacher-dashboard" 
        className={`w-full min-h-[500px] flex flex-col justify-center items-center text-center p-8 bg-white border border-[#eee4d7] rounded-2xl shadow-sm text-start ${isRTL ? "dir-rtl" : ""}`}
      >
        <div className="p-4 rounded-full bg-[#faf7f2] border border-[#f0e6d6] text-[#708098] mb-4">
          <GraduationCap size={32} />
        </div>
        <h2 className="text-xl font-bold text-[#10253e] mb-2">
          {td("Teacher Dashboard")}
        </h2>
        <p className="text-sm text-[#53657a] max-w-sm leading-relaxed">
          {td("Your instructor workspace is ready. Future lessons and student timetables will appear here once assigned.")}
        </p>
      </div>
    </DashboardLayout>
  );
}
