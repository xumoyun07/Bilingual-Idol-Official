import { useAuth } from "@/_core/hooks/useAuth";
import { LocalUserDataManager } from "@/components/LocalUserDataManager";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BookOpen, ShieldCheck, Calendar, Receipt, Info, CheckCircle, HelpCircle, XCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { ApplicationTracker } from "@/components/dashboard/ApplicationTracker";
import { DiagnosticPlacementTest } from "@/components/dashboard/DiagnosticPlacementTest";
import { TuitionPaymentModule } from "@/components/dashboard/TuitionPaymentModule";
import { Card } from "@/components/ui/card";

const OPERATIONS_ROLES = ["founder", "super_admin", "admin"];

export default function UserDashboard() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/login" });
  const { t, isRTL, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");

  const isOperationsUser = Boolean(user && OPERATIONS_ROLES.includes(user.role));
  const isTeacher = user?.role === "teacher";
  const isMarketing = user?.role === "marketing";

  const attendanceSummary = trpc.studentAttendance.summary.useQuery(undefined, { 
    enabled: user?.role === "student", 
    retry: false 
  });

  const enrollmentsQuery = trpc.enrollments.myEnrollments.useQuery(undefined, {
    enabled: user?.role === "student",
    retry: false
  });

  const programsQuery = trpc.content.publicPrograms.useQuery();

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

  // Helper to map program info
  const getProgramInfo = (programId: number) => {
    const prog = programsQuery.data?.find(p => p.id === programId);
    return prog ? { title: prog.title, language: prog.language } : { title: "Academic Programme", language: "English" };
  };

  return (
    <DashboardLayout role="student" activeTab={activeTab} setActiveTab={setActiveTab}>
      <div id="user-dashboard-container" data-page="user-dashboard" className={`member-page blue-member-page w-full space-y-6 text-start ${isRTL ? "dir-rtl" : ""}`}>
        <OfflineIndicator />
        <div className="member-content space-y-6">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#dfd1bf]/50">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-[#708098]">{roleLabel}</p>
              <h1 id="member-dashboard-title" className="font-bold text-[#10253e] tracking-tight text-[clamp(1.5rem,4vw,2.25rem)] leading-tight">
                {activeTab === "enrollments" 
                  ? (language === "ms" ? "Kursus & Penilaian Saya" : language === "ar" ? "تفاصيل ودراسة البرامج الدراسية" : "My Course Enrollments")
                  : t("userDashboard.welcome") + (user?.name ? `, ${user.name}` : "") + "."
                }
              </h1>
              <p className="text-xs sm:text-sm text-[#53657a] max-w-2xl leading-relaxed">
                {activeTab === "enrollments"
                  ? (language === "ms" ? "Semak harga, yuran, dan status penarafan akademik rasmi anda." : language === "ar" ? "عرض ومتابعة الرسوم والأسعار والحالة الدراسية لبرامجك." : "Secure and verified statement of your academic programs, custom agreed pricing, and official fees.")
                  : t("userDashboard.subtitle")
                }
              </p>
            </div>
          </header>

          {/* PWA Prompt Card */}
          <PWAInstallButton variant="card" />

          {activeTab === "enrollments" ? (
            <div className="space-y-6">
              {enrollmentsQuery.isLoading ? (
                <div className="space-y-4">
                  <div className="h-28 w-full bg-slate-200 animate-pulse rounded-2xl" />
                  <div className="h-28 w-full bg-slate-200 animate-pulse rounded-2xl" />
                </div>
              ) : enrollmentsQuery.data && enrollmentsQuery.data.length > 0 ? (
                <div className="grid gap-6">
                  {enrollmentsQuery.data.map((enrollment) => {
                    const progInfo = getProgramInfo(enrollment.programId);
                    const totalFees = enrollment.agreedPrice + enrollment.registrationFee + enrollment.placementTestFee + enrollment.visaFee;

                    return (
                      <div 
                        key={enrollment.id} 
                        className="rounded-2xl border border-[#eee4d7] bg-white p-5 sm:p-6 shadow-sm overflow-hidden text-start flex flex-col gap-6 relative"
                      >
                        {/* Status Ribbon / Badge */}
                        <div className="absolute top-5 right-5 sm:top-6 sm:right-6">
                          {enrollment.status === "active" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              {language === "ms" ? "Aktif" : language === "ar" ? "نشط" : "Active"}
                            </span>
                          ) : enrollment.status === "completed" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              <CheckCircle size={12} />
                              {language === "ms" ? "Selesai" : language === "ar" ? "مكتمل" : "Completed"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                              <XCircle size={12} />
                              {language === "ms" ? "Dibatalkan" : language === "ar" ? "ملغي" : "Cancelled"}
                            </span>
                          )}
                        </div>

                        {/* Title Section */}
                        <div className="space-y-1 max-w-[70%]">
                          <h2 className="text-xl font-bold text-[#10253e]">{progInfo.title}</h2>
                          <p className="text-xs font-semibold text-[#173fad] uppercase tracking-wider">{progInfo.language} Programme</p>
                        </div>

                        {/* Content Blocks */}
                        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 border-t border-[#dfd1bf]/30 pt-6">
                          {/* Block 1: Enrollment Dates */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#708098]">
                              <Calendar size={14} />
                              <span>{language === "ms" ? "Tarikh Pendaftaran" : language === "ar" ? "تاريخ الالتحاق" : "Enrollment Dates"}</span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-[#10253e]">
                                {language === "ms" ? "Daftar pada: " : language === "ar" ? "تاريخ البدء: " : "Enrolled on: "}
                                <span className="font-extrabold">{new Date(enrollment.approvedAt).toLocaleDateString()}</span>
                              </p>
                              {enrollment.completedAt && (
                                <p className="text-xs text-[#53657a] flex items-center gap-1">
                                  <Clock size={12} />
                                  <span>
                                    {enrollment.status === "completed" 
                                      ? (language === "ms" ? "Selesai pada: " : language === "ar" ? "اكتمل في: " : "Completed on: ")
                                      : (language === "ms" ? "Dibatalkan pada: " : language === "ar" ? "ألغي في: " : "Cancelled on: ")
                                    }
                                    {new Date(enrollment.completedAt).toLocaleDateString()}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Block 2: Price Breakdown */}
                          <div className="space-y-3 sm:col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#708098]">
                              <Receipt size={14} />
                              <span>{language === "ms" ? "Butiran Yuran Akademik" : language === "ar" ? "تفاصيل الرسوم والأسعار" : "Academic Financial Statement"}</span>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              {/* Left column: Individual Custom Fees */}
                              <div className="space-y-1.5 text-xs text-[#53657a]">
                                <div className="flex justify-between">
                                  <span>{language === "ms" ? "Yuran Pengajian Disepakati:" : language === "ar" ? "رسوم الدراسة المتفق عليها:" : "Agreed Tuition Fee:"}</span>
                                  <span className="font-bold text-[#10253e]">RM {(enrollment.agreedPrice / 100).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>{language === "ms" ? "Yuran Pendaftaran:" : language === "ar" ? "رسوم التسجيل والقبول:" : "Registration Fee:"}</span>
                                  <span className="font-bold text-[#10253e]">RM {(enrollment.registrationFee / 100).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>{language === "ms" ? "Yuran Ujian Penempatan:" : language === "ar" ? "رسوم اختبار المستوى:" : "Placement Test Fee:"}</span>
                                  <span className="font-bold text-[#10253e]">RM {(enrollment.placementTestFee / 100).toFixed(2)}</span>
                                </div>
                                {enrollment.visaFee > 0 && (
                                  <div className="flex justify-between">
                                    <span>{language === "ms" ? "Yuran Visa Pelajar:" : language === "ar" ? "رسوم تأشيرة الطالب:" : "Student Visa Fee:"}</span>
                                    <span className="font-bold text-[#10253e]">RM {(enrollment.visaFee / 100).toFixed(2)}</span>
                                  </div>
                                )}
                              </div>

                              {/* Right column: Total pricing summary */}
                              <div className="bg-[#faf7f2] p-3.5 rounded-xl border border-[#eee4d7]/70 flex flex-col justify-center">
                                <span className="text-[10px] font-extrabold uppercase text-[#708098] tracking-widest block mb-0.5">
                                  {language === "ms" ? "Jumlah Kos Keseluruhan" : language === "ar" ? "إجمالي التكلفة" : "Total Enrollment Cost"}
                                </span>
                                <span className="text-xl font-extrabold text-[#173fad]">
                                  RM {(totalFees / 100).toFixed(2)}
                                </span>
                                <span className="text-[10px] text-[#53657a] mt-1 flex items-center gap-1">
                                  <ShieldCheck size={10} className="text-emerald-600" />
                                  <span>{language === "ms" ? "Harga disahkan & rasmi" : language === "ar" ? "سعر معتمد ورسمي" : "Verified institutional price"}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Notes Section (if populated) */}
                        {enrollment.notes && (
                          <div className="bg-[#fcfbfa] border-l-2 border-[#dfd1bf] p-3 text-xs leading-relaxed text-[#53657a] flex items-start gap-2.5 rounded-r-lg">
                            <Info size={14} className="text-[#708098] shrink-0 mt-0.5" />
                            <div>
                              <strong className="block font-bold text-[#10253e] mb-0.5">{language === "ms" ? "Nota Akademik / Pentadbiran" : language === "ar" ? "ملاحظات إدارية وأكاديمية" : "Administrative Notes"}</strong>
                              <span>{enrollment.notes}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 rounded-2xl border border-dashed border-[#d9cbb8] bg-[#fcfbfa]/50 p-6">
                  <HelpCircle size={40} className="mx-auto text-[#708098]" />
                  <h3 className="font-bold text-[#10253e] mt-4 text-lg">
                    {language === "ms" ? "Tiada Penyata Pendaftaran Aktif" : language === "ar" ? "لا توجد برامج مسجلة حاليًا" : "No Active Course Enrollments"}
                  </h3>
                  <p className="text-sm text-[#53657a] mt-2 max-w-md mx-auto leading-relaxed">
                    {language === "ms" ? "Butiran pengajian disepakati anda akan muncul di sini sebaik sahaja pentadbir BILC mendaftarkan pelan harga rasmi anda." : language === "ar" ? "ستظهر تفاصيل البرامج المتفق عليها هنا فور اعتماد مسؤول المركز لخطة الأسعار الخاصة بك." : "Your structured custom agreed course pricing statements will appear here as soon as our administrator sets up your billing account."}
                  </p>
                </div>
              )}
            </div>
          ) : (
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
              <section className="rounded-2xl border border-[#eee4d7] bg-[#ffffff] p-5 sm:p-6 shadow-sm overflow-hidden text-start" aria-label="Local User Data Management">
                <LocalUserDataManager />
              </section>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
