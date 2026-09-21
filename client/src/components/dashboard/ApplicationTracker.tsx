import { FileCheck, Sparkles, Send, ShieldAlert, Award, Plane, ClipboardList } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

export function ApplicationTracker() {
  const { language, isRTL } = useLanguage();
  const applicationsQuery = trpc.registrationSubmissions.listApplications.useQuery();

  if (applicationsQuery.isLoading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-100 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-5/6" />
        </div>
      </div>
    );
  }

  const applications = applicationsQuery.data || [];
  const activeApp = applications[0]; // Take latest application

  // If no application exists, render a clean start helper
  if (!activeApp) {
    return (
      <div className="p-6 bg-[#fcfbfa] rounded-xl border border-[#d9cbb8]">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#173fad]/10 text-[#173fad] rounded-lg">
            <ClipboardList size={22} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#10253e]">
              {language === "ms" ? "Mula Proses Kemasukan Rasmi Anda" : language === "ar" ? "ابدأ إجراءات الالتحاق الرسمية" : "Begin Your Official Enrollment"}
            </h3>
            <p className="text-sm text-[#53657a] mt-1">
              {language === "ms" 
                ? "Anda belum memulakan permohonan kemasukan lagi. Lengkapkan Borang Pendaftaran Rasmi kami untuk memulakan proses." 
                : language === "ar" 
                ? "لم تبدأ بعد في تقديم طلب الالتحاق. يرجى إتمام نموذج طلب التسجيل لبدء الإجراءات الرسمية." 
                : "You have not initialized an active enrollment registry. Submit the Official Registry Form to unlock course schedules, placement advisors, and visa tracking."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Define enrollment stages
  const stages = [
    { key: "submitted", label: language === "ms" ? "Permohonan Dihantar" : language === "ar" ? "تم تقديم الطلب" : "Submitted", icon: Send },
    { key: "documentsReceived", label: language === "ms" ? "Dokumen Diterima" : language === "ar" ? "تم استلام المستندات" : "Documents Received", icon: FileCheck },
    { key: "underReview", label: language === "ms" ? "Dalam Semakan" : language === "ar" ? "قيد المراجعة" : "Under Review", icon: ClipboardList },
    { key: "offerIssued", label: language === "ms" ? "Surat Tawaran Dikeluarkan" : language === "ar" ? "تم إصدار عرض القبول" : "Offer Issued", icon: Sparkles },
    { key: "paymentCompleted", label: language === "ms" ? "Yuran / Deposit Selesai" : language === "ar" ? "تم دفع الرسوم" : "Payment Completed", icon: Award },
    { key: "visaProcess", label: language === "ms" ? "Proses Visa Pelajar" : language === "ar" ? "تأشيرة الطالب" : "Student Visa Process", icon: Plane },
    { key: "registrationCompleted", label: language === "ms" ? "Pendaftaran Selesai" : language === "ar" ? "اكتمل التسجيل النهائي" : "Registration Complete", icon: Award },
  ];

  const currentStageIndex = stages.findIndex(s => s.key === activeApp.status);

  return (
    <div className="p-6 sm:p-8 bg-white rounded-xl border border-[#d9cbb8] shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-bold text-[#173fad] uppercase tracking-wider block">
            {language === "ms" ? "Sistem Penjejak Kemasukan" : language === "ar" ? "نظام تتبع حالة الالتحاق" : "Official Enrollment Tracker"}
          </span>
          <h2 className="text-xl font-extrabold text-[#10253e] mt-1">
            {language === "ms" ? "Status Permohonan Akademik Anda" : language === "ar" ? "حالة طلب الالتحاق الأكاديمي" : "Academic Application Status"}
          </h2>
        </div>
        <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-extrabold rounded-full border border-amber-200">
          <bdi dir="ltr">{activeApp.status}</bdi>
        </span>
      </div>

      {/* Visual Stepper Progress Bar */}
      <div className="relative mt-8 mb-4">
        {/* Connector Line */}
        <div className="absolute top-5 left-4 right-4 h-0.5 bg-slate-100 -z-10" />
        <div 
          className="absolute top-5 left-4 h-0.5 bg-[#173fad] transition-all duration-500 -z-10" 
          style={{ 
            width: `${(currentStageIndex / (stages.length - 1)) * 100}%`,
            right: isRTL ? "4px" : "auto",
            left: isRTL ? "auto" : "4px"
          }} 
        />

        <div className="grid grid-cols-7 gap-1">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = idx < currentStageIndex;
            const isActive = idx === currentStageIndex;

            return (
              <div key={stage.key} className="flex flex-col items-center text-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                    isCompleted 
                      ? "bg-[#173fad] text-white border-[#173fad]" 
                      : isActive 
                      ? "bg-white text-[#173fad] border-2 border-[#173fad] ring-4 ring-[#173fad]/10 font-bold" 
                      : "bg-white text-[#708098] border-slate-200"
                  }`}
                >
                  <Icon size={16} />
                </div>
                <span className={`text-[10px] sm:text-xs font-bold mt-2.5 hidden sm:block leading-tight ${
                  isActive ? "text-[#10253e]" : "text-[#708098]"
                }`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile-only active label */}
      <div className="sm:hidden text-center mt-3 p-3 bg-slate-50 rounded-lg">
        <p className="text-xs font-bold text-[#708098] uppercase">
          {language === "ms" ? "Status Semasa" : language === "ar" ? "الحالة الحالية" : "Current Status"}
        </p>
        <p className="text-sm font-extrabold text-[#10253e] mt-0.5">
          {stages[currentStageIndex]?.label}
        </p>
      </div>
    </div>
  );
}
