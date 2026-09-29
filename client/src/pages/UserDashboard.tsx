import { useAuth } from "@/_core/hooks/useAuth";
import { LocalUserDataManager } from "@/components/LocalUserDataManager";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BookOpen, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";
import DashboardLayout, { DashboardContentArea } from "@/components/DashboardLayout";
import { ApplicationTracker } from "@/components/dashboard/ApplicationTracker";
import { DiagnosticPlacementTest } from "@/components/dashboard/DiagnosticPlacementTest";
import { TuitionPaymentModule } from "@/components/dashboard/TuitionPaymentModule";
import { Card, CardContent } from "@/components/ui/card";

const OPERATIONS_ROLES = ["founder", "super_admin", "admin"];

export default function UserDashboard() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/login" });
  const { t, isRTL } = useLanguage();
  const isOperationsUser = Boolean(user && OPERATIONS_ROLES.includes(user.role));
  const isTeacher = user?.role === "teacher";
  const isMarketing = user?.role === "marketing";
  const attendanceSummary = trpc.studentAttendance.summary.useQuery(undefined, { enabled: user?.role === "student", retry: false });

  useEffect(() => {
    if (isOperationsUser) window.location.href = user?.role === "super_admin" ? "/super-admin" : "/admin";
    if (isTeacher) window.location.href = "/teacher";
    if (isMarketing) window.location.href = "/marketing";
  }, [isOperationsUser, isTeacher, isMarketing, user?.role]);

  if (loading || isOperationsUser || isTeacher || isMarketing) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#fbf8f2]">
        <div className="text-center">
          <p className="text-sm font-semibold text-[#173fad] uppercase tracking-wider">{t("nav.workspace")}</p>
          <h1 className="text-2xl font-bold text-[#10253e] mt-2">{t("userDashboard.preparing")}</h1>
          <p className="text-sm text-[#53657a] mt-1">{t("userDashboard.preparingText")}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const roleLabel =
    user?.role === "student"
      ? t("userDashboard.roleStudent")
      : user?.role === "teacher"
      ? t("userDashboard.roleTeacher")
      : t("userDashboard.roleMember");

  return (
    <DashboardLayout role="student">
      <div id="user-dashboard-container" data-page="user-dashboard" className={`member-page blue-member-page w-full space-y-6 text-start ${isRTL ? "dir-rtl" : ""}`}>
        <OfflineIndicator />
        <div className="member-content space-y-6">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#dfd1bf]/50">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-[#708098]">{roleLabel}</p>
              <h1 id="member-dashboard-title" className="font-bold text-[#10253e] tracking-tight text-[clamp(1.5rem,4vw,2.25rem)] leading-tight">
                {t("userDashboard.welcome")}
                {user?.name ? `, ${user.name}` : ""}.
              </h1>
              <p className="text-xs sm:text-sm text-[#53657a] max-w-2xl leading-relaxed">{t("userDashboard.subtitle")}</p>
            </div>
          </header>

          {/* PWA Prompt Card */}
          <PWAInstallButton variant="card" />

          <div className="space-y-6">
            {/* Real-time CRM Admission Application Tracker */}
            <div className="rounded-2xl border border-[#eee4d7] bg-white p-5 sm:p-6 shadow-sm overflow-hidden text-start">
              <ApplicationTracker />
            </div>

            {/* Tuition Bursar Fees, Deposit & Active Promotions Module */}
            <div className="rounded-2xl border border-[#eee4d7] bg-white p-5 sm:p-6 shadow-sm overflow-hidden text-start">
              <TuitionPaymentModule />
            </div>

            {/* Diagnostics Placement Test */}
            <div className="rounded-2xl border border-[#eee4d7] bg-white p-5 sm:p-6 shadow-sm overflow-hidden text-start">
              <DiagnosticPlacementTest />
            </div>

            {/* Attendance Summary Progress Card */}
            <Card className="member-status-card rounded-2xl border border-[#eee4d7] bg-white shadow-sm overflow-hidden p-5 sm:p-6 text-start flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-[#eee4d7]/60 pb-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 shrink-0">
                  <ShieldCheck aria-hidden="true" size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#10253e]">{t("userDashboard.attendanceTitle", undefined, "Attendance Registry Summary")}</h3>
                  <p className="text-xs text-[#53657a]">{t("userDashboard.attendanceDescription", undefined, "Your live course enrollment statistics")}</p>
                </div>
              </div>

              <div className="space-y-4">
                {attendanceSummary.isLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 w-1/3 bg-slate-200 animate-pulse rounded" />
                    <div className="h-8 w-full bg-slate-100 animate-pulse rounded-full" />
                  </div>
                ) : attendanceSummary.data?.totalSessions ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#10253e]">
                        {attendanceSummary.data.percentage}%
                      </span>
                      <span className="text-xs font-semibold text-[#53657a]">
                        {t("userDashboard.attendanceScoreText", {
                          attended: attendanceSummary.data.attendedSessions,
                          total: attendanceSummary.data.totalSessions,
                        })}
                      </span>
                    </div>
                    
                    {/* Progress bar container */}
                    <div className="w-full h-3 bg-[#faf7f2] border border-[#eee4d7]/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500 animate-in fade-in-50" 
                        style={{ width: `${attendanceSummary.data.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#708098] leading-relaxed">
                      {t("userDashboard.attendanceScoreDescription", undefined, "Aim for at least 80% attendance to secure official certification credits.")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <strong className="block text-sm font-bold text-[#10253e]">
                      {t("userDashboard.attendanceNotAvailable", undefined, "Attendance is not available yet.")}
                    </strong>
                    <p className="text-xs text-[#53657a]">
                      {t("userDashboard.attendanceNotAvailableText", undefined, "Your course logs will activate after your advisor signs off on your placement test.")}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Next Steps Program Link */}
            <section className="member-next-step rounded-2xl border border-[#eee4d7] bg-white p-5 sm:p-6 shadow-sm text-start flex flex-col sm:flex-row sm:items-center justify-between gap-4" aria-label={t("userDashboard.nextStepTitle")}>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#173fad]/10 text-[#173fad] rounded-xl shrink-0 mt-0.5">
                  <BookOpen aria-hidden="true" size={20} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-[#10253e]">{t("userDashboard.nextStepTitle")}</h2>
                  <p className="text-xs sm:text-sm text-[#53657a] leading-relaxed max-w-xl">{t("userDashboard.nextStepText")}</p>
                </div>
              </div>
              <Link href="/programs" className="compass-btn-primary min-h-[44px] sm:min-h-[40px] text-xs font-semibold px-5 rounded-xl shrink-0 inline-flex items-center justify-center gap-1.5 self-stretch sm:self-auto">
                <span>{t("userDashboard.nextStepButton")}</span>
                <ArrowRight size={14} className={isRTL ? "rotate-180" : ""} />
              </Link>
            </section>

            {/* Local User Data, Offline Storage & Privacy Management */}
            <section className="rounded-2xl border border-[#eee4d7] bg-white p-5 sm:p-6 shadow-sm overflow-hidden text-start" aria-label="Local User Data Management">
              <LocalUserDataManager />
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
