import { useAuth } from "@/_core/hooks/useAuth";
import { BackgroundCircleField } from "@/components/BackgroundCircleField";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";

const OPERATIONS_ROLES = ["founder", "super_admin"];

export default function UserDashboard() {
  const { user, loading, logout } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/login" });
  const { t, isRTL } = useLanguage();
  const isOperationsUser = Boolean(user && OPERATIONS_ROLES.includes(user.role));
  const isTeacher = user?.role === "teacher";
  const attendanceSummary = trpc.studentAttendance.summary.useQuery(undefined, { enabled: user?.role === "student", retry: false });

  useEffect(() => {
    if (isOperationsUser) window.location.href = user?.role === "super_admin" ? "/super-admin" : "/admin";
    if (isTeacher) window.location.href = "/teacher";
  }, [isOperationsUser, isTeacher, user?.role]);

  if (loading || isOperationsUser || isTeacher) {
    return (
      <main className={`minimal-auth-state ${isRTL ? "is-rtl" : ""}`}>
        <BackgroundCircleField seed="member-loading" />
        <div>
          <p className="minimal-eyebrow">{t("nav.workspace")}</p>
          <h1>{t("userDashboard.preparing")}</h1>
          <p>{t("userDashboard.preparingText")}</p>
        </div>
      </main>
    );
  }

  const roleLabel =
    user?.role === "student"
      ? t("userDashboard.roleStudent")
      : user?.role === "teacher"
      ? t("userDashboard.roleTeacher")
      : t("userDashboard.roleMember");

  return (
    <main className={`member-page blue-member-page ${isRTL ? "is-rtl" : ""}`}>
      <BackgroundCircleField seed={`member-${user?.role ?? "user"}`} />
      <header className="member-header flex items-center justify-between">
        <Link href="/" className="auth-brand" aria-label="Bilingual Idol Learning Centre home">
          <span aria-hidden="true">BI</span>
          <div>
            <strong>Bilingual Idol</strong>
            <small>Learning centre</small>
          </div>
        </Link>
        <div className="flex items-center gap-2.5">
          <LanguageSwitcher variant="dropdown" />
          <Button type="button" variant="outline" className="member-signout" onClick={() => logout()}>
            <LogOut size={16} />
            {t("userDashboard.signOut")}
          </Button>
        </div>
      </header>
      <section className="member-content" aria-labelledby="member-dashboard-title">
        <div className="member-welcome">
          <span className="member-avatar" aria-hidden="true">
            <UserRound size={23} />
          </span>
          <p className="simple-eyebrow">{roleLabel}</p>
          <h1 id="member-dashboard-title">
            {t("userDashboard.welcome")}
            {user?.name ? `, ${user.name}` : ""}.
          </h1>
          <p>{t("userDashboard.subtitle")}</p>
        </div>
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
      </section>
    </main>
  );
}
