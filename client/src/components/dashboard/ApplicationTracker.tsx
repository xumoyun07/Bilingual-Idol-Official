import { FileCheck, Sparkles, Send, Award, Plane, ClipboardList, Calendar, MapPin, AlertCircle, ArrowUpRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";

export function ApplicationTracker() {
  const { language, isRTL } = useLanguage();
  const { user } = useAuth();
  
  // Query our new applications.byUserId endpoint
  const applicationQuery = trpc.applications.byUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  if (applicationQuery.isLoading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-100 animate-pulse" id="app-tracker-loading">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-5/6" />
        </div>
      </div>
    );
  }

  const data = applicationQuery.data;
  const activeApp = data?.application;
  const history = data?.history || [];

  // If no application exists, render a clean start helper
  if (!activeApp) {
    return (
      <div className="p-6 bg-[#fcfbfa] rounded-xl border border-[#d9cbb8]" id="app-tracker-empty">
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

  const isInternational = activeApp.isInternational;

  // Dynamically tailor the stages based on international status
  const baseStages = [
    { key: "submitted", label: language === "ms" ? "Permohonan Dihantar" : language === "ar" ? "تم تقديم الطلب" : "Submitted", icon: Send },
    { key: "documentsReceived", label: language === "ms" ? "Dokumen Diterima" : language === "ar" ? "تم استلام المستندات" : "Documents Received", icon: FileCheck },
    { key: "underReview", label: language === "ms" ? "Dalam Semakan" : language === "ar" ? "قيد المراجعة" : "Under Review", icon: ClipboardList },
    { key: "offerIssued", label: language === "ms" ? "Surat Tawaran Dikeluarkan" : language === "ar" ? "تم إصدار عرض القبول" : "Offer Issued", icon: Sparkles },
    { key: "paymentCompleted", label: language === "ms" ? "Yuran Selesai" : language === "ar" ? "تم دفع الرسوم" : "Payment Completed", icon: Award },
    { key: "visaProcess", label: language === "ms" ? "Proses Visa Pelajar" : language === "ar" ? "تأشيرة الطالب" : "Student Visa Process", icon: Plane },
    { key: "registrationCompleted", label: language === "ms" ? "Pendaftaran Selesai" : language === "ar" ? "اكتمل التسجيل النهائي" : "Registration Complete", icon: Award },
  ];

  // If NOT international, omit the student visa process entirely from the timeline
  const stages = isInternational 
    ? baseStages 
    : baseStages.filter(stage => stage.key !== "visaProcess");

  const currentStageIndex = stages.findIndex(s => s.key === activeApp.status);

  // Status badge style helper
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case "registrationCompleted":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "visaProcess":
      case "paymentCompleted":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "underReview":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  // Human-readable status translator
  const getReadableStatus = (status: string) => {
    const s = baseStages.find(x => x.key === status);
    return s ? s.label : status;
  };

  return (
    <div className="p-6 sm:p-8 bg-white rounded-xl border border-[#dce4e7] shadow-sm space-y-8" id="application-tracker-wrapper">
      {/* Header section with active status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#173fad] uppercase tracking-wider block">
            {language === "ms" ? "Portal Kemasukan Pelajar" : language === "ar" ? "بوابة قبول الطلاب" : "Student Admissions Portal"}
          </span>
          <h2 className="text-xl font-extrabold text-[#10253e] mt-1">
            {language === "ms" ? "Status Permohonan Akademik Anda" : language === "ar" ? "حالة طلب الالتحاق الأكاديمي" : "Academic Application Status"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 text-xs font-extrabold rounded-full border ${getBadgeStyle(activeApp.status)}`}>
            {getReadableStatus(activeApp.status)}
          </span>
          {isInternational && (
            <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-extrabold rounded-full border border-indigo-200 flex items-center gap-1">
              <Plane size={12} />
              {language === "ms" ? "Visa Diperlukan" : language === "ar" ? "بحاجة لتأشيرة" : "Visa Required"}
            </span>
          )}
        </div>
      </div>

      {/* Visual Stepper Progress Bar */}
      <div className="relative pt-4 pb-2" id="application-visual-stepper">
        {/* Connector Line */}
        <div className="absolute top-9 left-4 right-4 h-0.5 bg-slate-100 -z-10" />
        <div 
          className="absolute top-9 left-4 h-0.5 bg-[#173fad] transition-all duration-500 -z-10" 
          style={{ 
            width: `${currentStageIndex === -1 ? 0 : (currentStageIndex / (stages.length - 1)) * 100}%`,
            right: isRTL ? "4px" : "auto",
            left: isRTL ? "auto" : "4px"
          }} 
        />

        <div className="grid grid-cols-6 sm:grid-cols-7 gap-1" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = idx < currentStageIndex;
            const isActive = idx === currentStageIndex;

            return (
              <div key={stage.key} className="flex flex-col items-center text-center group">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isCompleted 
                      ? "bg-[#173fad] text-white border-[#173fad] shadow-sm" 
                      : isActive 
                      ? "bg-white text-[#173fad] border-2 border-[#173fad] ring-4 ring-[#173fad]/10 font-bold scale-110 shadow-md" 
                      : "bg-white text-[#708098] border-slate-200 hover:border-slate-300"
                  }`}
                  title={stage.label}
                >
                  <Icon size={16} className={isActive ? "animate-pulse" : ""} />
                </div>
                <span className={`text-[10px] sm:text-xs font-bold mt-3.5 hidden md:block leading-tight max-w-[100px] transition-colors ${
                  isActive ? "text-[#10253e]" : isCompleted ? "text-[#53657a]" : "text-[#708098]"
                }`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile-only active label */}
      <div className="md:hidden text-center p-3 bg-slate-50 rounded-lg">
        <p className="text-xs font-bold text-[#708098] uppercase">
          {language === "ms" ? "Langkah Semasa" : language === "ar" ? "الخطوة الحالية" : "Current Step"}
        </p>
        <p className="text-sm font-extrabold text-[#10253e] mt-0.5">
          {stages[currentStageIndex]?.label}
        </p>
      </div>

      {/* Application Stage Details / Contextual Helper */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-3">
        <AlertCircle size={18} className="text-[#173fad] mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-extrabold text-[#10253e] uppercase tracking-wider">
            {language === "ms" ? "Kemas Kini Pentadbir" : language === "ar" ? "تحديث الإدارة" : "Admissions Guidance"}
          </p>
          <p className="text-xs text-[#53657a] leading-relaxed">
            {activeApp.status === "submitted" && (
              language === "ms" 
                ? "Permohonan anda telah berjaya diterima. Pasukan kemasukan kami sedang memulakan fail pelajar anda." 
                : language === "ar"
                ? "تم استلام طلبك بنجاح. تبدأ إدارة القبول حالياً في إعداد ملف الطالب الخاص بك."
                : "Your application has been received. Our admissions officers are initializing your enrollment file and will contact you shortly."
            )}
            {activeApp.status === "documentsReceived" && (
              language === "ms" 
                ? "Semua dokumen pengenalan dan akademik telah diterima dan sedia untuk penilaian akademik." 
                : language === "ar"
                ? "تم استلام جميع المستندات الأكاديمية والتعريفية بنجاح وهي جاهزة للتقييم الأكاديمي."
                : "All prerequisite credential and identity documents have been logged successfully. Your file is ready for academic evaluation."
            )}
            {activeApp.status === "underReview" && (
              language === "ms" 
                ? "Fail anda sedang dalam proses penilaian oleh dewan akademik bagi penempatan tahap yang bersesuaian." 
                : language === "ar"
                ? "ملفك قيد التقييم والمراجعة الأكاديمية لتحديد المستوى الدراسي الأنسب لك."
                : "Your application is undergoing evaluation by our academic board to confirm your level placement and eligibility."
            )}
            {activeApp.status === "offerIssued" && (
              language === "ms" 
                ? "Tahniah! Surat Tawaran rasmi telah dikeluarkan. Sila semak e-mel anda dan lakukan pembayaran yuran pendaftaran/deposit untuk mengesahkan tempat." 
                : language === "ar"
                ? "تهانينا! تم إصدار عرض القبول الرسمي. يرجى مراجعة بريدك الإلكتروني وسداد الرسوم أو الوديعة لتأكيد مكانك."
                : "Congratulations! Your Official Offer Letter has been issued. Check your email inbox to sign and complete registration deposit payment."
            )}
            {activeApp.status === "paymentCompleted" && (
              language === "ms" 
                ? "Pembayaran yuran/deposit telah disahkan. Sila tunggu langkah seterusnya untuk onboarding pusat latihan." 
                : language === "ar"
                ? "تم تأكيد دفع الرسوم والوديعة بنجاح. يرجى الانتظار لتلقي إرشادات التهيئة والتسجيل النهائي."
                : "Your registration payment has been verified successfully. We are preparing your student profile orientation toolkit."
            )}
            {activeApp.status === "visaProcess" && (
              language === "ms" 
                ? "Permohonan Visa Pelajar anda sedang diproses bersama pihak imigresen. Kami akan mengemas kini status kelulusan tidak lama lagi." 
                : language === "ar"
                ? "طلب تأشيرة الطالب الخاص بك قيد المعالجة مع الهيئة المعنية. سنخطرك فور صدور الموافقة."
                : "Your Student Visa Application is actively being filed with EMGS/Immigration. Our visa advisors will keep you updated on progress."
            )}
            {activeApp.status === "registrationCompleted" && (
              language === "ms" 
                ? "Selamat datang! Pendaftaran anda telah selesai sepenuhnya. Anda kini bersedia untuk menghadiri kelas pertama anda!" 
                : language === "ar"
                ? "أهلاً بك! اكتملت إجراءات التسجيل والالتحاق بالكامل. أنت الآن مستعد تماماً لبدء المحاضرات والدروس!"
                : "Welcome aboard! Your enrollment lifecycle is complete. You are fully registered and ready for class schedules and student portal access!"
            )}
          </p>
        </div>
      </div>

      {/* Transaction & Transition History Log */}
      <div className="space-y-4" id="application-history-log">
        <h3 className="text-xs font-bold text-[#10253e] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Calendar size={14} className="text-[#173fad]" />
          {language === "ms" ? "Log Sejarah Permohonan" : language === "ar" ? "سجل تاريخ المعاملات" : "Application History Log"}
        </h3>
        
        {history.length === 0 ? (
          <p className="text-xs text-slate-400 italic">
            {language === "ms" ? "Tiada sejarah transaksi direkodkan lagi." : language === "ar" ? "لا توجد سجلات معاملات حتى الآن." : "No history transitions recorded yet."}
          </p>
        ) : (
          <div className="relative pl-4 space-y-4 border-l border-slate-100 rtl:border-l-0 rtl:border-r rtl:border-slate-100 rtl:pl-0 rtl:pr-4">
            {history.map((log) => (
              <div key={log.id} className="relative space-y-1">
                {/* Visual marker dot */}
                <div className="absolute top-1.5 -left-[21px] w-2.5 h-2.5 rounded-full bg-[#173fad] border-2 border-white ring-4 ring-[#173fad]/10 rtl:left-auto rtl:-right-[21px]" />
                
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-[#10253e]">
                    {language === "ms" ? "Status Diperbaharui" : language === "ar" ? "تحديث الحالة" : "Status Transition"}
                  </p>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(log.createdAt).toLocaleDateString(language === "ms" ? "ms-MY" : language === "ar" ? "ar-EG" : "en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {language === "ms" && (
                    <>Pasukan {log.actorName} menukar status permohonan kepada <strong className="text-[#173fad]">{getReadableStatus(log.toStatus)}</strong>.</>
                  )}
                  {language === "ar" && (
                    <>قام فريق {log.actorName} بتحديث حالة الطلب إلى <strong className="text-[#173fad]">{getReadableStatus(log.toStatus)}</strong>.</>
                  )}
                  {language === "en" && (
                    <>The {log.actorName} transitioned the application state to <strong className="text-[#173fad]">{getReadableStatus(log.toStatus)}</strong>.</>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
