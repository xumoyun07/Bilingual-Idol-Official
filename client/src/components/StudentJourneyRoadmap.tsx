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
      en: "Consultation & Goal Setting",
      ms: "Perundingan & Penetapan Matlamat",
      ar: "الاستشارة وتحديد الأهداف",
    },
    subtitles: {
      en: "Personalized Roadmap",
      ms: "Pelan Hala Tuju Peribadi",
      ar: "خطة دراسية مخصصة",
    },
    summaries: {
      en: "Begin with a personalized consultation where our academic advisors analyze your linguistic goals, timeline, and career or university aspirations.",
      ms: "Mulakan dengan sesi perundingan peribadi bersama penasihat akademik kami untuk menganalisis matlamat bahasa, tempoh masa, dan aspirasi universiti atau kerjaya anda.",
      ar: "ابدأ بجلسة استشارية فردية مع مستشارينا الأكاديميين لتحديد أهدافك اللغوية، الجدول الزمني، وتطلعاتك الجامعية والمهنية بدقة.",
    },
    details: {
      en: [
        "1-on-1 academic consultation with certified advisors",
        "Goal-based pathway recommendation (IELTS, General English, Executive)",
        "Clear timetable and fee breakdown with no hidden costs",
      ],
      ms: [
        "Perundingan akademik 1-sama-1 bersama penasihat bertauliah",
        "Cadangan laluan berasaskan matlamat (IELTS, Bahasa Inggeris Umum, Eksekutif)",
        "Pecahan jadual dan yuran yang telus tanpa kos tersembunyi",
      ],
      ar: [
        "استشارة أكاديمية فردية ومباشرة مع مستشارين معتمدين",
        "توصية بمسار دراسي مخصص (آيلتس، إنجليزية عامة، برامج تنفيذية)",
        "جدول دراسي ورسوم واضحة ومفصلة بدون أي تكاليف خفية",
      ],
    },
  },
  {
    number: "02",
    icon: FileCheck,
    titles: {
      en: "Visa & Admission Support",
      ms: "Sokongan Visa & Kemasukan",
      ar: "دعم تأشيرة الطالب والقبول",
    },
    subtitles: {
      en: "EMGS & MOE Processing",
      ms: "Pemprosesan EMGS & KPT",
      ar: "إجراءات فيزا معتمدة وسريعة",
    },
    summaries: {
      en: "Experience a seamless, hassle-free visa application. Our experienced immigration liaison team handles your EMGS visa processing from start to finish.",
      ms: "Alami proses permohonan visa yang lancar dan mudah. Pasukan perhubungan imigresen kami menguruskan pemprosesan visa EMGS anda dari awal hingga akhir.",
      ar: "تمتع بإجراءات تأشيرة ميسرة وسريعة. يتولى فريقنا المتخصص في شؤون الهجرة استخراج تأشيرة الطالب (EMGS) من البداية وحتى استلام الجواز.",
    },
    details: {
      en: [
        "Official acceptance letter from accredited institution (WZ10104)",
        "Complete EMGS Student Pass processing support",
        "Regular status updates and pre-departure checklist",
      ],
      ms: [
        "Surat tawaran rasmi dari institusi bertauliah (WZ10104)",
        "Sokongan penuh pemprosesan Pas Pelajar EMGS",
        "Kemas kini status berkala dan senarai semak sebelum berlepas",
      ],
      ar: [
        "خطاب قبول رسمي وموثق من معهد مرخص رسمياً (WZ10104)",
        "دعم كامل لإجراءات تأشيرة الطالب عبر منظومة EMGS",
        "متابعة دورية مستمرة وقائمة إرشادات شاملة قبل السفر",
      ],
    },
  },
  {
    number: "03",
    icon: Building2,
    titles: {
      en: "Curated Luxury Accommodation",
      ms: "Penginapan Mewah Terpilih",
      ar: "سكن فاخر ومجهز بالكامل",
    },
    subtitles: {
      en: "Safe & Central KL Residences",
      ms: "Kediaman Selamat di Pusat KL",
      ar: "أبراج سكنية راقية في قلب كوالالمبور",
    },
    summaries: {
      en: "Settle comfortably into handpicked high-end residential suites in Kuala Lumpur, selected for 24/7 security, modern amenities, and prime proximity.",
      ms: "Menetap dengan selesa di suite kediaman mewah terpilih di Kuala Lumpur dengan kawalan keselamatan 24/7, kemudahan moden, dan lokasi yang strategik.",
      ar: "استقر براحة تامة في أجنحة سكنية فاخرة ومختارة بعناية بالقرب من بافيليون إمباسي، مع حراسة أمنية 24/7 ومرافق ترفيهية متكاملة.",
    },
    details: {
      en: [
        "Prime residential choices within walking distance of Pavilion Embassy",
        "Fully furnished suites with swimming pool, gym & security access",
        "Quiet, student-friendly environments with high-speed internet",
      ],
      ms: [
        "Pilihan kediaman utama berdekatan Pavilion Embassy",
        "Suite serba lengkap dengan kolam renang, gimnasium & akses keselamatan",
        "Persekitaran yang tenang, mesra pelajar dengan internet pantas",
      ],
      ar: [
        "خيارات سكنية مميزة على بعد خطوات مشياً من بافيليون إمباسي",
        "شقق مؤثثة بالكامل مع مسبح ونادٍ صحي وبطاقة دخول أمنية",
        "بيئة هادئة ومثالية للدراسة ومزودة بإنترنت فائق السرعة",
      ],
    },
  },
  {
    number: "04",
    icon: Plane,
    titles: {
      en: "VIP Airport Meet & Greet",
      ms: "Penyambutan VIP di Lapangan Terbang",
      ar: "استقبال VIP وتوصيل من المطار",
    },
    subtitles: {
      en: "Direct Airport Transfer",
      ms: "Pengangkutan Terus dari Lapangan Terbang",
      ar: "خدمة استقبال وتوصيل مباشر",
    },
    summaries: {
      en: "Arrive in Malaysia with complete peace of mind. Our dedicated representative welcomes you at KLIA airport and provides direct private transfer to your residence.",
      ms: "Tiba di Malaysia dengan ketenangan fikiran. Wakil kami menyambut anda di lapangan terbang KLIA dan menyediakan pengangkutan peribadi terus ke tempat penginapan.",
      ar: "صل إلى ماليزيا براحة واطمئنان كاملين. يستقبلك مندوبنا الرسمي في مطار كوالالمبور الدولي ويوفر لك نقلاً خاصاً ومباشراً إلى مقر إقامتك.",
    },
    details: {
      en: [
        "Personal greeting at Kuala Lumpur International Airport (KLIA 1/2)",
        "Assistance with Malaysian SIM card and currency exchange",
        "Direct private transfer to your apartment or residence",
      ],
      ms: [
        "Sambutan peribadi di Lapangan Terbang Antarabangsa KL (KLIA 1/2)",
        "Bantuan mendapatkan kad SIM Malaysia dan pertukaran mata wang",
        "Pengangkutan peribadi terus ke apartmen kediaman anda",
      ],
      ar: [
        "استقبال شخصي عند بوابة الخروج في مطار كوالالمبور (KLIA 1/2)",
        "مساعدة فورية في شراء شريحة الاتصال المحلية وصرف العملات",
        "توصيل خاص ومباشر إلى شقتك أو مكان إقامتك",
      ],
    },
  },
  {
    number: "05",
    icon: UserPlus,
    titles: {
      en: "Registration & Diagnostic Test",
      ms: "Pendaftaran & Ujian Diagnostik",
      ar: "التسجيل واختبار تحديد المستوى",
    },
    subtitles: {
      en: "Accurate CEFR Placement",
      ms: "Penempatan CEFR yang Tepat",
      ar: "تقييم دقيق وشامل لمعايير CEFR",
    },
    summaries: {
      en: "Formalize your enrollment and take our multi-skill diagnostic placement test (speaking, listening, reading, writing) to ensure precise class matching.",
      ms: "Lengkapkan pendaftaran anda dan ambil ujian diagnostik pelbagai kemahiran (pertuturan, pendengaran, pembacaan, penulisan) untuk penempatan kelas yang tepat.",
      ar: "أكمل إجراءات التسجيل الرسمية وخض اختبار تحديد المستوى التشخيصي الشامل (محادثة، استماع، قراءة، كتابة) لضمان انضمامك للمستوى الأنسب لك.",
    },
    details: {
      en: [
        "Comprehensive CEFR-aligned diagnostic assessment",
        "Direct oral evaluation with senior academic director",
        "Personalized course schedule and study materials package",
      ],
      ms: [
        "Penilaian diagnostik komprehensif selaras piawaian CEFR",
        "Penilaian lisan secara langsung bersama pengarah akademik",
        "Jadual kursus peribadi dan pakej bahan pembelajaran rasmi",
      ],
      ar: [
        "تقييم تشخيصي شامل متوافق مع الإطار الأوروبي المشترك CEFR",
        "مقابلة شفهية مباشرة لتقييم المحادثة مع المدير الأكاديمي",
        "جدول حصص دراسي مخصص وحقيبة المواد التعليمية الرسمية",
      ],
    },
  },
  {
    number: "06",
    icon: Sparkles,
    titles: {
      en: "First Day & Luxury Learning",
      ms: "Hari Pertama & Pembelajaran Unggul",
      ar: "اليوم الأول وانطلاق التجربة التعليمية",
    },
    subtitles: {
      en: "Join Our Global Community",
      ms: "Sertai Komuniti Global Kami",
      ar: "انضم إلى مجتمع أكاديمي عالمي",
    },
    summaries: {
      en: "Step into your new academic home—designer smart classrooms, inspiring international instructors, and an exclusive global community.",
      ms: "Langkah ke persekitaran akademik baharu anda—bilik darjah pintar eksklusif, tenaga pengajar antarabangsa yang berinspirasi, dan komuniti global yang dinamik.",
      ar: "انطلق في رحلتك التعليمية الراقية—فصول ذكية مجهزة، مدربون دوليون ملهمون، ومجتمع طلابي عالمي يعزز تطورك اللغوي والشخصي.",
    },
    details: {
      en: [
        "Campus orientation and executive lounge access",
        "Introduction to instructors and international peers",
        "Continuous milestone tracking and individual mentorship",
      ],
      ms: [
        "Orientasi kampus dan akses ke ruang rehat eksekutif",
        "Pengenalan kepada tenaga pengajar dan rakan antarabangsa",
        "Penjejakan kemajuan berterusan dan bimbingan individu",
      ],
      ar: [
        "جولة تعريفية في الحرم واستخدام صالة كبار الشخصيات",
        "التعرف على المدرسين والزملاء من مختلف دول العالم",
        "متابعة دورية دقيقة للتقدم الأكاديمي وتوجيه مستمر",
      ],
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
                    ? `Langkah ${step.number} drpd 06`
                    : language === "ar"
                    ? `الخطوة ${step.number} من 06`
                    : `Step ${step.number} of 06`}
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

            <Link href="/enroll" className="simple-button">
              {t("nav.makeEnquiry")} <Sparkles size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MOBILE-ONLY PREMIUM INTERACTIVE SLIDER STEPPER (FULLY REDESIGNED)
         ========================================================================= */}
      <div className="block lg:hidden w-full px-4 sm:px-6">
        {/* Horizontal Progress Timeline Tracker */}
        <div className="relative w-full flex items-center justify-between mb-6 px-2">
          {/* Progress Connecting Line Track */}
          <div className="absolute top-1/2 left-4 right-4 h-[3px] bg-slate-200 -translate-y-1/2 z-0 rounded-full" />
          
          {/* Active Progress Highlight Line */}
          <div 
            className="absolute top-1/2 h-[3px] bg-[#173fad] -translate-y-1/2 transition-all duration-300 z-0 rounded-full"
            style={{
              width: `calc(${(activeStep / (JOURNEY_STEPS.length - 1)) * 100}% - 32px)`,
              [isRTL ? "right" : "left"]: "16px"
            }}
          />

          {/* Stepper Dots/Circles */}
          {JOURNEY_STEPS.map((s, idx) => {
            const isActive = activeStep === idx;
            const isCompleted = idx < activeStep;
            return (
              <button
                key={s.number}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs z-10 transition-all duration-300 relative border ${
                  isActive
                    ? "bg-[#173fad] text-white ring-4 ring-blue-100 border-[#173fad] scale-110 shadow-sm"
                    : isCompleted
                    ? "bg-[#173fad] text-white border-[#173fad]"
                    : "bg-white text-slate-400 border-slate-200"
                }`}
                aria-label={`Step ${s.number}`}
              >
                {s.number}
              </button>
            );
          })}
        </div>

        {/* Active Step Showcase Spotlight Card */}
        <div 
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden transition-all duration-300"
        >
          {/* Subtle elegant background decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-50/40 via-transparent to-transparent pointer-events-none rounded-bl-3xl" />

          {/* Step Metadata Header (Unboxed, clean metadata as per zero-pill) */}
          <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
            <span className="text-[#173fad]">
              {language === "ms" 
                ? `Langkah ${step.number} drpd 06` 
                : language === "ar" 
                ? `الخطوة ${step.number} من ٠٦` 
                : `Step ${step.number} of 06`}
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="text-slate-500">{stepSubtitle}</span>
          </div>

          {/* Icon Section */}
          <div className="w-12 h-12 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-center text-[#173fad] mb-4">
            <StepIcon size={22} className="stroke-[2.2]" />
          </div>

          {/* Step Title */}
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug mb-2">
            {stepTitle}
          </h3>

          {/* Step Description */}
          <p className="text-slate-500 text-[12px] leading-relaxed mb-5">
            {stepSummary}
          </p>

          {/* Compact Guarantees checklist */}
          <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-4">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
              {language === "ms" 
                ? "Jaminan & Sokongan:" 
                : language === "ar" 
                ? "المزايا والضمانات:" 
                : "Guarantees & Support:"}
            </p>
            {stepDetails.map((detail, dIdx) => (
              <div key={dIdx} className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-700 font-semibold">
                <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mt-0.5 flex-shrink-0">
                  <Check size={10} className="stroke-[3]" />
                </div>
                <span className="flex-1">{detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Swipe instruction helper (premium touch detail) */}
        <div className="text-center mt-3 text-[10px] text-slate-400 font-medium">
          {language === "ms"
            ? "Leret ke kiri atau kanan untuk menukar langkah"
            : language === "ar"
            ? "اسحب لليمين أو اليسار للتنقل بين الخطوات"
            : "Swipe left or right to switch steps"}
        </div>

        {/* Interactive Nav Controls */}
        <div className="flex items-center justify-between gap-3 mt-4">
          <button
            type="button"
            className="flex-1 h-11 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
            disabled={activeStep === 0}
            onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
          >
            {language === "ms" ? "Sebelumnya" : language === "ar" ? "السابق" : "Previous"}
          </button>
          <button
            type="button"
            className="flex-1 h-11 bg-[#173fad] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40"
            disabled={activeStep === JOURNEY_STEPS.length - 1}
            onClick={() => setActiveStep((prev) => Math.min(JOURNEY_STEPS.length - 1, prev + 1))}
          >
            {language === "ms" ? "Seterusnya" : language === "ar" ? "التالي" : "Next Step"}
          </button>
        </div>

        {/* Central Call to Action */}
        <div className="mt-5 px-1">
          <Link href="/enroll" className="w-full h-12 bg-[#173fad] text-white rounded-xl flex items-center justify-center gap-2 text-xs font-extrabold shadow-md active:scale-[0.98]">
            {t("nav.makeEnquiry")} <Sparkles size={14} className="stroke-[2.5]" />
          </Link>
        </div>
      </div>
    </section>
  );
}

