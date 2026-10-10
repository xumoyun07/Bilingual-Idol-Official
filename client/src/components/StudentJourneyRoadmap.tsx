import { Building2, Check, Compass, FileCheck, Plane, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/translations";

interface Step {
  number: string;
  icon: typeof Compass;
  titles: Record<Language, string>;
  subtitles: Record<Language, string>;
  summaries: Record<Language, string>;
  details: Record<Language, string[]>;
}

const JOURNEY_STEPS: Step[] = [
  {
    number: "01",
    icon: Compass,
    titles: {
      en: "Form 1 — Contact & Enquiry",
      ms: "Borang 1 — Hubungan & Pertanyaan",
      ar: "النموذج 1 — التواصل والاستفسار",
    },
    subtitles: {
      en: "One light contact point",
      ms: "Satu titik hubungan ringan",
      ar: "نقطة تواصل واحدة وخفيفة",
    },
    summaries: {
      en: "Every visit starts with a single form: choose general, consultation or campus tour and our team responds through your preferred channel.",
      ms: "Setiap lawatan bermula dengan satu borang: pilih umum, konsultasi atau lawatan kampus dan pasukan kami membalas melalui saluran pilihan anda.",
      ar: "تبدأ كل زيارة بنموذج واحد: اختر استفسارًا عامًا أو استشارة أو جولة في الحرم وسيرد عليك فريقنا عبر قناتك المفضلة.",
    },
    details: {
      en: ["One shared form across the whole site", "Choose general, consultation or campus tour", "No account needed — just your name and a contact"],
      ms: ["Satu borang dikongsi di seluruh laman", "Pilih umum, konsultasi atau lawatan kampus", "Tiada akaun diperlukan — hanya nama dan kenalan"],
      ar: ["نموذج موحّد في كامل الموقع", "اختر عام أو استشارة أو جولة في الحرم", "لا حاجة لحساب — الاسم ووسيلة تواصل فقط"],
    },
  },
  {
    number: "02",
    icon: Sparkles,
    titles: {
      en: "Find Your Course & Placement Test",
      ms: "Cari Kursus Anda & Ujian Penempatan",
      ar: "ابحث عن دورتك واختبار تحديد المستوى",
    },
    subtitles: {
      en: "Recommendation without contact collection",
      ms: "Cadangan tanpa mengumpul kenalan",
      ar: "توصية دون جمع بيانات التواصل",
    },
    summaries: {
      en: "Take the 30-second quiz or the online placement test. Your recommended programme flows straight into the registration form.",
      ms: "Jawab kuiz 30 saat atau ujian penempatan dalam talian. Program yang disyorkan terus diisi ke dalam borang pendaftaran.",
      ar: "أجب عن الاختبار القصير أو اختبار تحديد المستوى عبر الإنترنت. يُملأ البرنامج الموصى به تلقائيًا في نموذج التسجيل.",
    },
    details: {
      en: ["Short quiz with no contact collection", "Placement test with automatic scoring", "The recommendation pre-fills your registration"],
      ms: ["Kuiz ringkas tanpa pengumpulan kenalan", "Ujian penempatan dengan pemarkahan automatik", "Cadangan mengisi borang pendaftaran anda"],
      ar: ["اختبار قصير دون جمع بيانات التواصل", "اختبار تحديد المستوى بتصحيح تلقائي", "التوصية تُعبّئ نموذج التسجيل تلقائيًا"],
    },
  },
  {
    number: "03",
    icon: FileCheck,
    titles: {
      en: "Form 2 — Universal Registration",
      ms: "Borang 2 — Pendaftaran Sejagat",
      ar: "النموذج 2 — التسجيل الموحّد",
    },
    subtitles: {
      en: "One registration for every programme",
      ms: "Satu pendaftaran untuk semua program",
      ar: "تسجيل واحد لكل البرامج",
    },
    summaries: {
      en: "A single dynamic form built from the founder's field configurator. Stage A captures the essentials; the rest is collected on your first login.",
      ms: "Satu borang dinamik daripada konfigurasi medan pengasas. Peringkat A mengumpul maklumat penting; selebihnya dikumpul semasa log masuk pertama.",
      ar: "نموذج ديناميكي واحد مبني على مُهيّئ الحقول الخاص بالمؤسس. المرحلة الأولى تجمع الأساسيات ويُستكمل الباقي عند أول تسجيل دخول.",
    },
    details: {
      en: ["One component replaces all old entry points", "Fields split into Stage A and Stage B", "International students attach visa-critical documents"],
      ms: ["Satu komponen menggantikan semua pintu masuk lama", "Medan dibahagi kepada Peringkat A dan Peringkat B", "Pelajar antarabangsa melampirkan dokumen visa kritikal"],
      ar: ["مكوّن واحد يحل محل جميع نقاط الدخول القديمة", "الحقول مقسمة إلى المرحلة الأولى والثانية", "الطلاب الدوليون يرفقون مستندات التأشيرة الأساسية"],
    },
  },
  {
    number: "04",
    icon: ShieldCheck,
    titles: {
      en: "Application Status Tracker",
      ms: "Penjejak Status Permohonan",
      ar: "متتبع حالة الطلب",
    },
    subtitles: {
      en: "From submission to registration",
      ms: "Dari penghantaran hingga pendaftaran",
      ar: "من الإرسال إلى التسجيل",
    },
    summaries: {
      en: "Follow your application step by step: submitted, documents received, under review, offer, payment, visa for internationals, and final registration.",
      ms: "Ikuti permohonan anda langkah demi langkah: dihantar, dokumen diterima, dalam semakan, tawaran, bayaran, visa untuk pelajar antarabangsa, dan pendaftaran akhir.",
      ar: "تابع طلبك خطوة بخطوة: تم الإرسال، استلام المستندات، قيد المراجعة، العرض، الدفع، التأشيرة للطلاب الدوليين، والتسجيل النهائي.",
    },
    details: {
      en: ["Visible in your student dashboard", "Visa stage only for international applicants", "Status moves forward — you always know where you stand"],
      ms: ["Kelihatan dalam papan pemuka pelajar", "Peringkat visa hanya untuk pemohon antarabangsa", "Status bergerak ke hadapan — anda sentiasa tahu kedudukan anda"],
      ar: ["يظهر في لوحة الطالب", "مرحلة التأشيرة للمتقدمين الدوليين فقط", "الحالة تتقدم للأمام — تعرف موقفك دائمًا"],
    },
  },
];
export function StudentJourneyRoadmap() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const step = JOURNEY_STEPS[activeStep];
  const StepIcon = step.icon;
  const { t, isRTL, language } = useLanguage();

  const stepTitle = step.titles[language] || step.titles.en;
  const stepSubtitle = step.subtitles[language] || step.subtitles.en;
  const stepSummary = step.summaries[language] || step.summaries.en;
  const stepDetails = step.details[language] || step.details.en;

  // Touch Swipe Gesture Support for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      if (isRTL) {
        setActiveStep((prev) => Math.max(0, prev - 1));
      } else {
        setActiveStep((prev) => Math.min(JOURNEY_STEPS.length - 1, prev + 1));
      }
    } else if (isRightSwipe) {
      if (isRTL) {
        setActiveStep((prev) => Math.min(JOURNEY_STEPS.length - 1, prev + 1));
      } else {
        setActiveStep((prev) => Math.max(0, prev - 1));
      }
    }
  };

  return (
    <section className={`simple-section bilc-journey-section ${isRTL ? "is-rtl" : ""}`} id="student-journey">
      <div className="bilc-journey-header">
        <div className="bilc-pricing-tag">
          <ShieldCheck size={16} />
          <span>
            {language === "ms"
              ? "Pengalaman Antarabangsa Lancar"
              : language === "ar"
              ? "تجربة دولية متكاملة وسلسة"
              : "Seamless International Experience"}
          </span>
        </div>
        <h2>{t("home.journeyTitle")}</h2>
        <p>{t("home.journeySubtitle")}</p>
      </div>

      {/* =========================================================================
          DESKTOP-ONLY HORIZONTAL STEPPER VIEW
         ========================================================================= */}
      <div className="hidden lg:block w-full">
        {/* Steps Navigation */}
        <div
          className="bilc-journey-stepper"
          role="tablist"
          aria-label={language === "ar" ? "خطوات رحلة الطالب" : language === "ms" ? "Langkah perjalanan pelajar" : "Student journey steps"}
        >
          {JOURNEY_STEPS.map((s, idx) => {
            const itemTitle = s.titles[language] || s.titles.en;
            const itemSub = s.subtitles[language] || s.subtitles.en;
            return (
              <button
                key={s.number}
                role="tab"
                aria-selected={activeStep === idx}
                className={`bilc-journey-step-btn ${activeStep === idx ? "is-active" : ""}`}
                onClick={() => setActiveStep(idx)}
              >
                <span className="bilc-step-num">{s.number}</span>
                <span className="bilc-step-name">{itemTitle}</span>
                <span className="bilc-step-zh">{itemSub}</span>
              </button>
            );
          })}
        </div>

        {/* Active Step Card */}
        <div className="bilc-journey-detail-card">
          <div className="bilc-journey-detail-header">
            <div className="bilc-journey-icon-wrap">
              <StepIcon size={26} />
            </div>
            <div>
              <div className="bilc-journey-badge-row">
                <span className="bilc-journey-step-tag">
                  {language === "ms"
                    ? `Langkah ${step.number} drpd 04`
                    : language === "ar"
                    ? `الخطوة ${step.number} من 04`
                    : `Step ${step.number} of 04`}
                </span>
                <span className="bilc-journey-zh-tag">{stepSubtitle}</span>
              </div>
              <h3>{stepTitle}</h3>
            </div>
          </div>

          <p className="bilc-journey-summary">{stepSummary}</p>

          <div className="bilc-journey-checklist">
            <p className="bilc-checklist-title">
              {language === "ms"
                ? "Jaminan Utama & Perkhidmatan:"
                : language === "ar"
                ? "أبرز المزايا والضمانات الأكاديمية:"
                : "Key Guarantees & Support:"}
            </p>
            <div className="bilc-checklist-grid">
              {stepDetails.map((detail, dIdx) => (
                <div key={dIdx} className="bilc-checklist-item">
                  <div className="bilc-check-icon">
                    <Check size={14} />
                  </div>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bilc-journey-footer">
            <div className="bilc-journey-nav-buttons">
              <button
                type="button"
                className="bilc-stepper-nav-btn"
                disabled={activeStep === 0}
                onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
              >
                {language === "ms" ? "Langkah Sebelumnya" : language === "ar" ? "الخطوة السابقة" : "Previous Step"}
              </button>
              <button
                type="button"
                className="bilc-stepper-nav-btn is-primary"
                disabled={activeStep === JOURNEY_STEPS.length - 1}
                onClick={() => setActiveStep((prev) => Math.min(JOURNEY_STEPS.length - 1, prev + 1))}
              >
                {language === "ms" ? "Langkah Seterusnya" : language === "ar" ? "Langkah Seterusnya" : "Next Step"}
              </button>
            </div>

            <Link href="/programs" className="simple-button">
              {t("nav.makeEnquiry")} <Sparkles size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MOBILE-ONLY PREMIUM INTERACTIVE ACCORDION ROADMAP LIST (OPTIMIZED)
         ========================================================================= */}
      <div className="block lg:hidden w-full px-4 sm:px-6">
        <div className="flex flex-col gap-3">
          {JOURNEY_STEPS.map((s, idx) => {
            const isActive = activeStep === idx;
            const itemTitle = s.titles[language] || s.titles.en;
            const itemSub = s.subtitles[language] || s.subtitles.en;
            const itemSummary = s.summaries[language] || s.summaries.en;
            const itemDetails = s.details[language] || s.details.en;

            return (
              <div
                key={s.number}
                className={`transition-all duration-300 rounded-xl border ${
                  isActive
                    ? "bg-white border-[#173fad]/30 shadow-[0_4px_20px_rgba(23,63,173,0.05)]"
                    : "bg-white/40 border-slate-200/60 hover:bg-white"
                } overflow-hidden`}
              >
                {/* Accordion Trigger Header */}
                <button
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left cursor-pointer transition-colors"
                  style={{ textAlign: isRTL ? "right" : "left", direction: isRTL ? "rtl" : "ltr" }}
                >
                  <div className="flex items-center gap-3">
                    {/* Circle Step Number */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-colors shrink-0 ${
                        isActive
                          ? "bg-[#173fad] text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {s.number}
                    </div>
                    <div className="text-left">
                      <span
                        className={`text-xs font-extrabold transition-colors block leading-tight ${
                          isActive ? "text-[#173fad]" : "text-slate-800"
                        }`}
                        style={{ textAlign: isRTL ? "right" : "left" }}
                      >
                        {itemTitle}
                      </span>
                      {!isActive && (
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                          {itemSub}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right hand toggle indicator */}
                  <div
                    className={`text-slate-400 transition-transform duration-300 shrink-0 ${
                      isActive ? "rotate-180" : ""
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Accordion Expanded Content */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isActive ? "max-h-[1000px] border-t border-slate-100 pb-4 pt-3.5 px-4" : "max-h-0 pointer-events-none"
                  }`}
                  style={{ direction: isRTL ? "rtl" : "ltr" }}
                >
                  {isActive && (
                    <div className="flex flex-col gap-3">
                      {/* Step Subtitle */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          {itemSub}
                        </span>
                      </div>

                      {/* Brief description */}
                      <p className="text-slate-600 text-[12px] leading-relaxed">
                        {itemSummary}
                      </p>

                      {/* Compact checklist */}
                      <div className="flex flex-col gap-2 mt-2">
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-0.5">
                          {language === "ms"
                            ? "Sokongan & Jaminan:"
                            : language === "ar"
                            ? "الضمانات والمزايا:"
                            : "Support & Guarantees:"}
                        </p>
                        {itemDetails.map((detail, dIdx) => (
                          <div
                            key={dIdx}
                            className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-700 font-medium"
                          >
                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mt-0.5 shrink-0">
                              <Check size={9} className="stroke-[3.5]" />
                            </div>
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Unified premium Call to Action button */}
        <div className="mt-6 px-1">
          <Link
            href="/programs"
            className="w-full h-12 bg-[#173fad] text-white rounded-xl flex items-center justify-center gap-2 text-xs font-extrabold shadow-md active:scale-[0.98] cursor-pointer"
          >
            {t("nav.makeEnquiry")} <Sparkles size={14} className="stroke-[2.5]" />
          </Link>
        </div>
      </div>
    </section>
  );
}

