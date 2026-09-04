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

      {/* Steps Navigation */}
      <div className="bilc-journey-stepper" role="tablist" aria-label="Student journey steps">
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
              {language === "ms" ? "Langkah Seterusnya" : language === "ar" ? "الخطوة التالية" : "Next Step"}
            </button>
          </div>

          <Link href="/enroll" className="simple-button">
            {t("nav.makeEnquiry")} <Sparkles size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

