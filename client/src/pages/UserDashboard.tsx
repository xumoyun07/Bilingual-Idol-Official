import { useAuth } from "@/_core/hooks/useAuth";
import { LocalUserDataManager } from "@/components/LocalUserDataManager";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BookOpen, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

const OPERATIONS_ROLES = ["founder", "super_admin"];

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
      <div className="grid min-h-screen place-items-center bg-white">
        <div className="text-center">
          <p className="text-sm font-semibold text-[#173fad] uppercase tracking-wider">{t("nav.workspace")}</p>
          <h1 className="text-2xl font-bold text-[#10253e] mt-2">{t("userDashboard.preparing")}</h1>
          <p className="text-sm text-[#53657a] mt-1">{t("userDashboard.preparingText")}</p>
        </div>
      </div>
    );
  }

  const roleLabel =
    user?.role === "student"
      ? t("userDashboard.roleStudent")
      : user?.role === "teacher"
      ? t("userDashboard.roleTeacher")
      : t("userDashboard.roleMember");

  return (
    <DashboardLayout role="student">
      <div id="user-dashboard-container" data-page="user-dashboard" className={`workspace-page founder-command founder-workspace page-student mx-auto w-full max-w-[88rem] px-4 sm:px-6 md:px-8 overflow-x-hidden pb-10 ${isRTL ? "dir-rtl" : ""}`}>
        <OfflineIndicator />
        <div className="member-content space-y-6">
          <header className="founder-command-header">
            <div>
              <p className="founder-command-eyebrow">{roleLabel}</p>
              <h1 id="member-dashboard-title" className="founder-command-title">
                {t("userDashboard.welcome")}
                {user?.name ? `, ${user.name}` : ""}.
              </h1>
              <p className="founder-command-description">{t("userDashboard.subtitle")}</p>
            </div>
          </header>

          {/* PWA Prompt Card */}
          <PWAInstallButton variant="card" />

          <section className="member-next-step" aria-label={t("userDashboard.nextStepTitle")}>
            <div>
              <BookOpen aria-hidden="true" size={21} />
              <h2>{t("userDashboard.nextStepTitle")}</h2>
              <p>{t("userDashboard.nextStepText")}</p>
            </div>
            <Link href="/programs" className="simple-button">
              {t("userDashboard.nextStepButton")}
              <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
            </Link>
          </section>

          <section className="member-status" aria-label={t("userDashboard.attendanceTitle")}>
            <ShieldCheck aria-hidden="true" size={19} />
            <div>
              {attendanceSummary.isLoading ? (
                <>
                  <strong>{t("userDashboard.attendanceLoading")}</strong>
                  <p>{t("userDashboard.attendanceLoadingText")}</p>
                </>
              ) : attendanceSummary.data?.totalSessions ? (
                <>
                  <strong>{t("userDashboard.attendanceScore", { percentage: attendanceSummary.data.percentage })}</strong>
                  <p>
                    {t("userDashboard.attendanceScoreText", {
                      attended: attendanceSummary.data.attendedSessions,
                      total: attendanceSummary.data.totalSessions,
                    })}
                  </p>
                </>
              ) : (
                <>
                  <strong>{t("userDashboard.attendanceNotAvailable", undefined, "Attendance is not available yet.")}</strong>
                  <p>{t("userDashboard.attendanceNotAvailableText")}</p>
                </>
              )}
            </div>
          </section>

          {/* Local User Data, Offline Storage & Privacy Management */}
          <section aria-label="Local User Data Management">
            <LocalUserDataManager />
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
