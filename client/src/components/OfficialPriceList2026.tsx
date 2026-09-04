import { CheckCircle2, ChevronRight, Clock, FileText, Globe, GraduationCap, Sparkles, UserCheck, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/translations";

type CourseCategory = "general" | "ielts" | "camps" | "private" | "executive" | "languages";

interface GeneralCourse {
  duration: Record<Language, string>;
  rawDuration: string;
  classes: Record<Language, string>;
  visaFee: Record<Language, string>;
  tuitionFee: string;
  popular?: boolean;
}

interface IeltsCourse {
  name: Record<Language, string>;
  rawName: string;
  duration: Record<Language, string>;
  hours: Record<Language, string>;
  tuitionFee: string;
}

interface CampCourse {
  name: Record<Language, string>;
  rawName: string;
  duration: Record<Language, string>;
  tuitionFee: string;
  highlight: Record<Language, string>;
}

interface PrivateCourse {
  package: Record<Language, string>;
  rawPackage: string;
  hours: Record<Language, string>;
  tuitionFee: string;
}

interface ExecutiveCourse {
  programme: Record<Language, string>;
  rawProgramme: string;
  duration: Record<Language, string>;
  tuitionFee: Record<Language, string>;
  desc: Record<Language, string>;
}

const GENERAL_COURSES: GeneralCourse[] = [
  {
    duration: { en: "1 Month", ms: "1 Bulan", ar: "شهر واحد" },
    rawDuration: "1 Month",
    classes: { en: "5 Days / Week", ms: "5 Hari / Minggu", ar: "5 أيام / أسبوعياً" },
    visaFee: { en: "—", ms: "—", ar: "—" },
    tuitionFee: "RM 2,950",
  },
  {
    duration: { en: "3 Months", ms: "3 Bulan", ar: "3 أشهر" },
    rawDuration: "3 Months",
    classes: { en: "5 Days / Week", ms: "5 Hari / Minggu", ar: "5 أيام / أسبوعياً" },
    visaFee: { en: "RM 3,000", ms: "RM 3,000", ar: "3,000 رنجت" },
    tuitionFee: "RM 7,900",
  },
  {
    duration: { en: "6 Months", ms: "6 Bulan", ar: "6 أشهر" },
    rawDuration: "6 Months",
    classes: { en: "5 Days / Week", ms: "5 Hari / Minggu", ar: "5 أيام / أسبوعياً" },
    visaFee: { en: "RM 3,000", ms: "RM 3,000", ar: "3,000 رنجت" },
    tuitionFee: "RM 14,100",
    popular: true,
  },
  {
    duration: { en: "9 Months", ms: "9 Bulan", ar: "9 أشهر" },
    rawDuration: "9 Months",
    classes: { en: "5 Days / Week", ms: "5 Hari / Minggu", ar: "5 أيام / أسبوعياً" },
    visaFee: { en: "RM 4,500", ms: "RM 4,500", ar: "4,500 رنجت" },
    tuitionFee: "RM 19,150",
  },
  {
    duration: { en: "12 Months", ms: "12 Bulan", ar: "12 شهراً" },
    rawDuration: "12 Months",
    classes: { en: "5 Days / Week", ms: "5 Hari / Minggu", ar: "5 أيام / أسبوعياً" },
    visaFee: { en: "RM 4,500", ms: "RM 4,500", ar: "4,500 رنجت" },
    tuitionFee: "RM 23,400",
  },
];

const IELTS_COURSES: IeltsCourse[] = [
  {
    name: { en: "IELTS Express", ms: "IELTS Ekspres", ar: "آيلتس السريع (Express)" },
    rawName: "IELTS Express",
    duration: { en: "4 Weeks", ms: "4 Minggu", ar: "4 أسابيع" },
    hours: { en: "40 Hours", ms: "40 Jam", ar: "40 ساعة تدريبية" },
    tuitionFee: "RM 3,500",
  },
  {
    name: { en: "IELTS Intensive", ms: "IELTS Intensif", ar: "آيلتس المكثف (Intensive)" },
    rawName: "IELTS Intensive",
    duration: { en: "8 Weeks", ms: "8 Minggu", ar: "8 أسابيع" },
    hours: { en: "80 Hours", ms: "80 Jam", ar: "80 ساعة تدريبية" },
    tuitionFee: "RM 6,700",
  },
  {
    name: { en: "IELTS Premium Coaching", ms: "Bimbingan Premium IELTS", ar: "برنامج الآيلتس المتميز (Premium)" },
    rawName: "IELTS Premium Coaching",
    duration: { en: "12 Weeks", ms: "12 Minggu", ar: "12 أسبوعاً" },
    hours: { en: "120 Hours", ms: "120 Jam", ar: "120 ساعة تدريبية" },
    tuitionFee: "RM 9,900",
  },
];

const CAMP_COURSES: CampCourse[] = [
  {
    name: { en: "Junior English Summer Camp", ms: "Kem Musim Panas Bahasa Inggeris Junior", ar: "مخيم الصيف للناشئين" },
    rawName: "Junior English Summer Camp",
    duration: { en: "2 Weeks", ms: "2 Minggu", ar: "أسبوعان" },
    tuitionFee: "RM 4,400",
    highlight: {
      en: "Ages 7–14, immersive language play & local excursions",
      ms: "Umur 7–14 tahun, pembelajaran bahasa interaktif & lawatan sambil belajar",
      ar: "للأعمار 7–14 سنة، أنشطة تفاعلية ورحلات استكشافية ممتعة",
    },
  },
  {
    name: { en: "International Summer Camp", ms: "Kem Musim Panas Antarabangsa", ar: "المخيم الصيفي الدولي" },
    rawName: "International Summer Camp",
    duration: { en: "4 Weeks", ms: "4 Minggu", ar: "4 أسابيع" },
    tuitionFee: "RM 7,000",
    highlight: {
      en: "Global student mix, cultural immersion & academic development",
      ms: "Gabungan pelajar antarabangsa, penglibatan budaya & kecemerlangan akademik",
      ar: "مزيج طلابي دولي، معايشة ثقافية وتطوير لغوي مكثف",
    },
  },
  {
    name: { en: "Premium Leadership & English Camp", ms: "Kem Kepimpinan & Bahasa Inggeris Premium", ar: "مخيم القيادة واللغة المتميز" },
    rawName: "Premium Leadership & English Camp",
    duration: { en: "4 Weeks", ms: "4 Minggu", ar: "4 أسابيع" },
    tuitionFee: "RM 7,600",
    highlight: {
      en: "Leadership modules, public speaking & Malaysian landmark trips",
      ms: "Modul kepimpinan, pengucapan awam & lawatan ke mercu tanda Malaysia",
      ar: "تطوير المهارات القيادية، الخطابة، وجولات إلى أبرز معالم ماليزيا",
    },
  },
];

const PRIVATE_COURSES: PrivateCourse[] = [
  {
    package: { en: "Silver Package", ms: "Pakej Perak (Silver)", ar: "الباقة الفضية (Silver)" },
    rawPackage: "Silver Package",
    hours: { en: "10 Hours", ms: "10 Jam", ar: "10 ساعات" },
    tuitionFee: "RM 1,800",
  },
  {
    package: { en: "Gold Package", ms: "Pakej Emas (Gold)", ar: "الباقة الذهبية (Gold)" },
    rawPackage: "Gold Package",
    hours: { en: "20 Hours", ms: "20 Jam", ar: "20 ساعة" },
    tuitionFee: "RM 3,200",
  },
  {
    package: { en: "Platinum Package", ms: "Pakej Platinum", ar: "الباقة البلاتينية (Platinum)" },
    rawPackage: "Platinum Package",
    hours: { en: "40 Hours", ms: "40 Jam", ar: "40 ساعة" },
    tuitionFee: "RM 5,800",
  },
];

const EXECUTIVE_COURSES: ExecutiveCourse[] = [
  {
    programme: { en: "Business English", ms: "Bahasa Inggeris Perniagaan", ar: "الإنجليزية للأعمال (Business English)" },
    rawProgramme: "Business English",
    duration: { en: "1 Month", ms: "1 Bulan", ar: "شهر واحد" },
    tuitionFee: { en: "RM 3,800", ms: "RM 3,800", ar: "3,800 رنجت" },
    desc: {
      en: "Corporate presentations, correspondence & boardroom fluency",
      ms: "Pembentangan korporat, surat-menyurat & kelancaran bilik mesyuarat",
      ar: "العروض التقديمية للشركات، المراسلات الرسمية والطلاقة في اجتماعات الأعمال",
    },
  },
  {
    programme: { en: "Executive Communication", ms: "Komunikasi Eksekutif", ar: "التواصل التنفيذي والدبلوماسي" },
    rawProgramme: "Executive Communication",
    duration: { en: "2 Months", ms: "2 Bulan", ar: "شهران" },
    tuitionFee: { en: "RM 6,600", ms: "RM 6,600", ar: "6,600 رنجت" },
    desc: {
      en: "High-level negotiations, diplomacy & executive leadership presence",
      ms: "Rundingan peringkat tinggi, diplomasi & kepimpinan eksekutif",
      ar: "المفاوضات رفيعة المستوى، اللباقة الدبلوماسية والحضور القيادي التنفيذي",
    },
  },
  {
    programme: { en: "Corporate English Masterclass", ms: "Masterclass Bahasa Inggeris Korporat", ar: "ماستركلاس الشركات والمؤسسات" },
    rawProgramme: "Corporate English Masterclass",
    duration: { en: "Customised", ms: "Tersuai", ar: "حسب الطلب" },
    tuitionFee: { en: "Upon Request", ms: "Atas Permintaan", ar: "حسب الطلب" },
    desc: {
      en: "Tailor-made for multinational enterprise teams & diplomatic staff",
      ms: "Disesuaikan khas untuk pasukan perusahaan multinasional & kakitangan diplomatik",
      ar: "مصمم خصيصاً لفرق الشركات متعددة الجنسيات والهيئات الدبلوماسية",
    },
  },
];

const WORLD_LANGUAGES = [
  {
    code: "EN",
    name: { en: "English", ms: "Bahasa Inggeris", ar: "اللغة الإنجليزية" },
    rawName: "English",
    native: "English",
    desc: {
      en: "General, Academic, IELTS & Executive pathways",
      ms: "Laluan Umum, Akademik, IELTS & Eksekutif",
      ar: "مسارات اللغة العامة والأكاديمية والآيلتس والبرامج التنفيذية",
    },
  },
  {
    code: "ZH",
    name: { en: "Mandarin", ms: "Bahasa Mandarin", ar: "اللغة الصينية (ماندرين)" },
    rawName: "Mandarin",
    native: "普通话 / 中文",
    desc: {
      en: "HSK preparation, business Mandarin & conversational fluency",
      ms: "Persediaan HSK, Mandarin perniagaan & kelancaran perbualan",
      ar: "التحضير لاختبار HSK، الصينية للأعمال والطلاقة في المحادثة",
    },
  },
  {
    code: "MS",
    name: { en: "Malay", ms: "Bahasa Melayu", ar: "اللغة الملايوية" },
    rawName: "Malay",
    native: "Bahasa Melayu",
    desc: {
      en: "Essential local language skills for living and working in Malaysia",
      ms: "Kemahiran bahasa tempatan penting untuk kehidupan dan kerjaya di Malaysia",
      ar: "مهارات اللغة المحلية الأساسية للعيش والعمل والدراسة في ماليزيا",
    },
  },
  {
    code: "AR",
    name: { en: "Arabic", ms: "Bahasa Arab", ar: "اللغة العربية" },
    rawName: "Arabic",
    native: "العربية",
    desc: {
      en: "Modern standard Arabic for diplomatic, business & academic needs",
      ms: "Bahasa Arab standard moden untuk diplomasi, perniagaan & akademik",
      ar: "العربية الفصحى الحديثة للأغراض الدبلوماسية والتجارية والأكاديمية",
    },
  },
  {
    code: "KO",
    name: { en: "Korean", ms: "Bahasa Korea", ar: "اللغة الكورية" },
    rawName: "Korean",
    native: "한국어",
    desc: {
      en: "TOPIK preparation, modern conversational Korean & cultural immersion",
      ms: "Persediaan TOPIK, perbualan moden Korea & penghayatan budaya",
      ar: "التحضير لاختبار TOPIK، المحادثة المعاصرة والتعرف على الثقافة",
    },
  },
  {
    code: "JA",
    name: { en: "Japanese", ms: "Bahasa Jepun", ar: "اللغة اليابانية" },
    rawName: "Japanese",
    native: "日本語",
    desc: {
      en: "JLPT pathways, corporate Japanese & etiquette",
      ms: "Laluan JLPT, bahasa Jepun korporat & etika perniagaan",
      ar: "مسارات التحضير لاختبار JLPT، اليابانية للأعمال وآداب التواصل",
    },
  },
];

export function OfficialPriceList2026() {
  const [activeTab, setActiveTab] = useState<CourseCategory>("general");
  const { t, isRTL, language } = useLanguage();

  return (
    <section className={`simple-section bilc-pricing-section ${isRTL ? "is-rtl" : ""}`} id="course-pricing">
      <div className="bilc-pricing-header">
        <div className="bilc-pricing-tag">
          <GraduationCap size={16} />
          <span>
            {language === "ms"
              ? "Katalog Akademik Rasmi 2026"
              : language === "ar"
              ? "الدليل الأكاديمي الرسمي 2026"
              : "Official 2026 Academic Catalog"}
          </span>
        </div>
        <h2>{t("home.pricingTitle")}</h2>
        <p>{t("home.pricingSubtitle")}</p>
      </div>

      {/* Category Navigation */}
      <div className="bilc-pricing-tabs" role="tablist" aria-label="Course categories">
        <button
          role="tab"
          aria-selected={activeTab === "general"}
          className={`bilc-tab-btn ${activeTab === "general" ? "is-active" : ""}`}
          onClick={() => setActiveTab("general")}
        >
          {t("home.pricingTabGeneral")}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "ielts"}
          className={`bilc-tab-btn ${activeTab === "ielts" ? "is-active" : ""}`}
          onClick={() => setActiveTab("ielts")}
        >
          {t("home.pricingTabIelts")}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "camps"}
          className={`bilc-tab-btn ${activeTab === "camps" ? "is-active" : ""}`}
          onClick={() => setActiveTab("camps")}
        >
          {t("home.pricingTabCamps")}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "private"}
          className={`bilc-tab-btn ${activeTab === "private" ? "is-active" : ""}`}
          onClick={() => setActiveTab("private")}
        >
          {t("home.pricingTabPrivate")}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "executive"}
          className={`bilc-tab-btn ${activeTab === "executive" ? "is-active" : ""}`}
          onClick={() => setActiveTab("executive")}
        >
          {t("home.pricingTabExecutive")}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "languages"}
          className={`bilc-tab-btn ${activeTab === "languages" ? "is-active" : ""}`}
          onClick={() => setActiveTab("languages")}
        >
          {t("home.pricingTabWorld")}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bilc-tab-panel-container">
        {/* 1. General English - Desktop Table & Mobile/Tablet Adaptive Cards */}
        {activeTab === "general" && (
          <div className="bilc-pricing-grid-general">
            {/* Desktop Table View (>= 1024px) */}
            <div className="bilc-desktop-table-container">
              <div className="bilc-table-wrap">
                <table className="bilc-price-table">
                  <thead>
                    <tr>
                      <th>{language === "ms" ? "Tempoh" : language === "ar" ? "المدة" : "Duration"}</th>
                      <th>{language === "ms" ? "Jadual" : language === "ar" ? "الجدول الدراسي" : "Schedule"}</th>
                      <th>{language === "ms" ? "Yuran Visa" : language === "ar" ? "رسوم الفيزا" : "Visa Fee"}</th>
                      <th>{language === "ms" ? "Yuran Pengajian (RM)" : language === "ar" ? "الرسوم الدراسية (RM)" : "Tuition Fee (RM)"}</th>
                      <th>{language === "ms" ? "Tindakan" : language === "ar" ? "التسجيل" : "Action"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GENERAL_COURSES.map((course) => {
                      const durText = course.duration[language] || course.duration.en;
                      const clsText = course.classes[language] || course.classes.en;
                      const visaText = course.visaFee[language] || course.visaFee.en;
                      return (
                        <tr key={course.rawDuration} className={course.popular ? "is-highlighted" : ""}>
                          <td>
                            <strong>{durText}</strong>
                            {course.popular && (
                              <span className="bilc-popular-pill">
                                {language === "ms" ? "Paling Popular" : language === "ar" ? "الأكثر طلباً" : "Most Popular"}
                              </span>
                            )}
                          </td>
                          <td>{clsText}</td>
                          <td>{visaText}</td>
                          <td className="bilc-price-cell">{course.tuitionFee}</td>
                          <td>
                            <Link href={`/enroll?course=General+English+${encodeURIComponent(course.rawDuration)}`} className="bilc-enroll-inline-btn">
                              {language === "ms" ? "Daftar" : language === "ar" ? "استفسار" : "Enquire"}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile & Tablet Adaptive Card Transformation (< 1024px) */}
            <div className="bilc-mobile-pricing-cards" role="list">
              {GENERAL_COURSES.map((course) => {
                const durText = course.duration[language] || course.duration.en;
                const clsText = course.classes[language] || course.classes.en;
                const visaText = course.visaFee[language] || course.visaFee.en;
                return (
                  <div 
                    key={course.rawDuration} 
                    className={`bilc-mobile-price-card ${course.popular ? "is-highlighted" : ""}`}
                    role="listitem"
                  >
                    {course.popular && (
                      <div className="bilc-mobile-card-badge">
                        {language === "ms" ? "Pilihan Paling Popular" : language === "ar" ? "الخيار الأكثر شعبية" : "Most Popular Choice"}
                      </div>
                    )}
                    
                    <div className="bilc-mobile-card-header">
                      <div>
                        <h3 className="bilc-mobile-card-title">
                          {language === "ms" ? `Pakej ${durText}` : language === "ar" ? `مسار ${durText}` : `${durText} Track`}
                        </h3>
                        <span className="bilc-mobile-card-sub">{clsText}</span>
                      </div>
                      <div className="bilc-mobile-card-price">
                        <strong>{course.tuitionFee}</strong>
                        <span>{language === "ms" ? "Yuran Pengajian" : language === "ar" ? "الرسوم الدراسية" : "Tuition Fee"}</span>
                      </div>
                    </div>

                    <div className="bilc-mobile-card-specs">
                      <div className="bilc-spec-row">
                        <span className="bilc-spec-label">
                          {language === "ms" ? "Pas Pelajar EMGS:" : language === "ar" ? "فيزا الطالب EMGS:" : "EMGS Student Visa:"}
                        </span>
                        <span className="bilc-spec-val">
                          {visaText === "—" ? (language === "ms" ? "Lawatan Singkat / Pelancong" : language === "ar" ? "فيزا سياحية / زيارة قصيرة" : "Tourist / Short Visit") : visaText}
                        </span>
                      </div>
                      <div className="bilc-spec-row">
                        <span className="bilc-spec-label">
                          {language === "ms" ? "Lokasi Kampus:" : language === "ar" ? "مقر الحرم:" : "Campus Location:"}
                        </span>
                        <span className="bilc-spec-val">Pavilion Embassy, KL</span>
                      </div>
                    </div>

                    <Link 
                      href={`/enroll?course=General+English+${encodeURIComponent(course.rawDuration)}`} 
                      className="bilc-mobile-card-cta"
                    >
                      <span>
                        {language === "ms" ? `Tanya mengenai ${durText}` : language === "ar" ? `استفسر عن مدة ${durText}` : `Enquire for ${durText}`}
                      </span>
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                );
              })}
            </div>

            <div className="bilc-fee-notes">
              <div className="bilc-note-item">
                <FileText size={16} />
                <span>
                  <strong>{language === "ms" ? "Yuran Pendaftaran:" : language === "ar" ? "رسوم التسجيل:" : "Registration Fee:"}</strong> RM 500 {language === "ms" ? "(sekali semasa pendaftaran)" : language === "ar" ? "(تدفع لمرة واحدة عند التسجيل)" : "(one-time upon enrollment)"}
                </span>
              </div>
              <div className="bilc-note-item">
                <UserCheck size={16} />
                <span>
                  <strong>{language === "ms" ? "Yuran Ujian Penempatan:" : language === "ar" ? "رسوم تحديد المستوى:" : "Placement Test Fee:"}</strong> RM 300 {language === "ms" ? "(penilaian diagnostik komprehensif)" : language === "ar" ? "(تقييم تشخيصي شامل)" : "(comprehensive diagnostic assessment)"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. IELTS Preparation */}
        {activeTab === "ielts" && (
          <div>
            <div className="bilc-cards-grid">
              {IELTS_COURSES.map((course) => {
                const nameText = course.name[language] || course.name.en;
                const durText = course.duration[language] || course.duration.en;
                const hrsText = course.hours[language] || course.hours.en;
                return (
                  <div key={course.rawName} className="bilc-course-card">
                    <div className="bilc-course-card-top">
                      <h3>{nameText}</h3>
                      <div className="bilc-duration-badge">
                        <Clock size={14} />
                        <span>{durText} · {hrsText}</span>
                      </div>
                    </div>
                    <div className="bilc-course-price">
                      <span className="bilc-price-val">{course.tuitionFee}</span>
                      <span className="bilc-price-sub">{language === "ms" ? "Yuran Pengajian" : language === "ar" ? "الرسوم الدراسية" : "Tuition Fee"}</span>
                    </div>
                    <div className="bilc-course-inclusions">
                      <p className="bilc-inclusions-title">
                        {language === "ms" ? "Pakej Termasuk:" : language === "ar" ? "الباقة تشمل:" : "Package Includes:"}
                      </p>
                      <ul>
                        <li><CheckCircle2 size={14} /> {language === "ms" ? "Ujian Penempatan & Diagnostik" : language === "ar" ? "اختبار تحديد المستوى والتشخيص" : "Placement Test"}</li>
                        <li><CheckCircle2 size={14} /> {language === "ms" ? "Bahan Pembelajaran & Buku Latihan" : language === "ar" ? "المناهج وكتب التدريبات الرسمية" : "Learning Materials & Practice Books"}</li>
                        <li><CheckCircle2 size={14} /> {language === "ms" ? "Penilaian Kemajuan Berterusan" : language === "ar" ? "متابعة دورية مستمرة للتقدم" : "Continuous Progress Assessment"}</li>
                        <li><CheckCircle2 size={14} /> {language === "ms" ? "Sijil Tamat Kursus Rasmi" : language === "ar" ? "شهادة إتمام معتمدة رسمياً" : "Official Certificate of Completion"}</li>
                      </ul>
                    </div>
                    <Link href={`/enroll?course=${encodeURIComponent(course.rawName)}`} className="simple-button w-full">
                      {language === "ms" ? `Tanya mengenai ${nameText}` : language === "ar" ? `استفسر عن ${nameText}` : `Enquire for ${nameText}`}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Summer Camp */}
        {activeTab === "camps" && (
          <div>
            <div className="bilc-cards-grid">
              {CAMP_COURSES.map((course) => {
                const nameText = course.name[language] || course.name.en;
                const durText = course.duration[language] || course.duration.en;
                const hlText = course.highlight[language] || course.highlight.en;
                return (
                  <div key={course.rawName} className="bilc-course-card">
                    <div className="bilc-course-card-top">
                      <h3>{nameText}</h3>
                      <div className="bilc-duration-badge">
                        <Clock size={14} />
                        <span>{durText}</span>
                      </div>
                    </div>
                    <p className="bilc-camp-highlight">{hlText}</p>
                    <div className="bilc-course-price">
                      <span className="bilc-price-val">{course.tuitionFee}</span>
                      <span className="bilc-price-sub">{language === "ms" ? "Pakej Serba Lengkap" : language === "ar" ? "باقة شاملة متكاملة" : "All-inclusive Package"}</span>
                    </div>
                    <div className="bilc-course-inclusions">
                      <p className="bilc-inclusions-title">
                        {language === "ms" ? "Pakej Termasuk:" : language === "ar" ? "الباقة تشمل:" : "Package Includes:"}
                      </p>
                      <ul>
                        <li><CheckCircle2 size={14} /> {language === "ms" ? "Kelas Bahasa Inggeris Intensif" : language === "ar" ? "حصص إنجليزية مكثفة وتفاعلية" : "Intensive English Classes"}</li>
                        <li><CheckCircle2 size={14} /> {language === "ms" ? "Aktiviti Pendidikan & Lawatan KL" : language === "ar" ? "أنشطة تعليمية وجولات في كوالالمبور" : "Educational Activities & KL Excursions"}</li>
                        <li><CheckCircle2 size={14} /> {language === "ms" ? "Bahan Pembelajaran Premium" : language === "ar" ? "مواد وحقائب تعليمية مميزة" : "Premium Learning Materials"}</li>
                        <li><CheckCircle2 size={14} /> {language === "ms" ? "Sijil Rasmi & Majlis Graduasi" : language === "ar" ? "شهادات رسمية وحفل تخرج" : "Official Certificates & Graduation"}</li>
                      </ul>
                    </div>
                    <Link href={`/enroll?course=${encodeURIComponent(course.rawName)}`} className="simple-button w-full">
                      {language === "ms" ? "Tanya mengenai Kem" : language === "ar" ? "استفسر عن المخيم" : "Enquire for Camp"}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Private Lessons */}
        {activeTab === "private" && (
          <div className="bilc-cards-grid">
            {PRIVATE_COURSES.map((course) => {
              const pkgText = course.package[language] || course.package.en;
              const hrsText = course.hours[language] || course.hours.en;
              return (
                <div key={course.rawPackage} className="bilc-course-card">
                  <div className="bilc-course-card-top">
                    <h3>{pkgText}</h3>
                    <div className="bilc-duration-badge">
                      <Clock size={14} />
                      <span>{hrsText} {language === "ms" ? "Bimbingan 1-sama-1" : language === "ar" ? "تدريس فردي مباشر" : "1-on-1 Instruction"}</span>
                    </div>
                  </div>
                  <div className="bilc-course-price">
                    <span className="bilc-price-val">{course.tuitionFee}</span>
                    <span className="bilc-price-sub">{language === "ms" ? "Bimbingan Peribadi" : language === "ar" ? "تدريب فردي مخصص" : "Personalized Coaching"}</span>
                  </div>
                  <div className="bilc-course-inclusions">
                    <p className="bilc-inclusions-title">
                      {language === "ms" ? "Kelebihan Utama:" : language === "ar" ? "أبرز المزايا:" : "Highlights:"}
                    </p>
                    <ul>
                      <li><CheckCircle2 size={14} /> {language === "ms" ? "Jadual fleksibel mengikut kesesuaian anda" : language === "ar" ? "مواعيد مرنة تماماً تتناسب مع جدولك" : "Flexible scheduling tailored to your calendar"}</li>
                      <li><CheckCircle2 size={14} /> {language === "ms" ? "Silibus khas dibina mengikut matlamat anda" : language === "ar" ? "منهج مخصص مبني حول أهدافك الفردية" : "Custom syllabus built around your goals"}</li>
                      <li><CheckCircle2 size={14} /> {language === "ms" ? "Tutor pakar berdedikasi secara individu" : language === "ar" ? "معلم خبير مخصص للتدريب الفردي المباشر" : "1-on-1 dedicated expert language tutor"}</li>
                      <li><CheckCircle2 size={14} /> {language === "ms" ? "Kemajuan pembelajaran yang pantas & berfokus" : language === "ar" ? "تسريع وتيرة التعلم وتحقيق نتائج سريعة" : "Accelerated learning progress"}</li>
                    </ul>
                  </div>
                  <Link href={`/enroll?course=${encodeURIComponent(course.rawPackage)}`} className="simple-button w-full">
                    {language === "ms" ? `Tempah ${pkgText}` : language === "ar" ? `حجز ${pkgText}` : `Book ${pkgText}`}
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. Executive Programs */}
        {activeTab === "executive" && (
          <div className="bilc-cards-grid">
            {EXECUTIVE_COURSES.map((course) => {
              const progText = course.programme[language] || course.programme.en;
              const durText = course.duration[language] || course.duration.en;
              const feeText = course.tuitionFee[language] || course.tuitionFee.en;
              const descText = course.desc[language] || course.desc.en;
              return (
                <div key={course.rawProgramme} className="bilc-course-card">
                  <div className="bilc-course-card-top">
                    <h3>{progText}</h3>
                    <div className="bilc-duration-badge">
                      <Clock size={14} />
                      <span>{durText}</span>
                    </div>
                  </div>
                  <p className="bilc-camp-highlight">{descText}</p>
                  <div className="bilc-course-price">
                    <span className="bilc-price-val">{feeText}</span>
                    <span className="bilc-price-sub">{language === "ms" ? "Yuran Eksekutif" : language === "ar" ? "الرسوم التنفيذية" : "Executive Tuition"}</span>
                  </div>
                  <div className="bilc-course-inclusions">
                    <p className="bilc-inclusions-title">
                      {language === "ms" ? "Ciri-ciri Program:" : language === "ar" ? "مميزات البرنامج:" : "Program Features:"}
                    </p>
                    <ul>
                      <li><CheckCircle2 size={14} /> {language === "ms" ? "Komunikasi perniagaan antarabangsa" : language === "ar" ? "التواصل في بيئات الأعمال الدولية" : "International business communication"}</li>
                      <li><CheckCircle2 size={14} /> {language === "ms" ? "Diplomasi & perundingan peringkat tinggi" : language === "ar" ? "المفاوضات والبروتوكول الدبلوماسي" : "High-level diplomacy & negotiation"}</li>
                      <li><CheckCircle2 size={14} /> {language === "ms" ? "Akses ke ruang rehat eksekutif untuk rangkaian" : language === "ar" ? "دخول صالة كبار الشخصيات لبناء العلاقات" : "Executive lounge access for networking"}</li>
                      <li><CheckCircle2 size={14} /> {language === "ms" ? "Tenaga pengajar bertauliah antarabangsa" : language === "ar" ? "مدربون حاصلون على اعتمادات دولية" : "Internationally certified instructors"}</li>
                    </ul>
                  </div>
                  <Link href={`/enroll?course=${encodeURIComponent(course.rawProgramme)}`} className="simple-button w-full">
                    {language === "ms" ? `Tanya mengenai ${progText}` : language === "ar" ? `استفسر عن ${progText}` : `Enquire for ${progText}`}
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* 6. World Languages */}
        {activeTab === "languages" && (
          <div className="bilc-languages-grid">
            {WORLD_LANGUAGES.map((lang) => {
              const nameText = lang.name[language] || lang.name.en;
              const descText = lang.desc[language] || lang.desc.en;
              return (
                <div key={lang.rawName} className="bilc-lang-card">
                  <div className="bilc-lang-card-header">
                    <span className="bilc-lang-badge">{lang.code}</span>
                    <div>
                      <h3>{nameText}</h3>
                      <p className="bilc-lang-native">{lang.native}</p>
                    </div>
                  </div>
                  <p className="bilc-lang-desc">{descText}</p>
                  <div className="bilc-lang-card-footer">
                    <span className="bilc-lang-avail">
                      {language === "ms" ? "Tersedia: Permulaan hingga Lanjutan" : language === "ar" ? "متاح: من المبتدئ إلى المتقدم" : "Available: Beginner to Advanced"}
                    </span>
                    <Link href={`/enroll?language=${encodeURIComponent(lang.rawName)}`} className="bilc-lang-link">
                      <span>{language === "ms" ? "Tanya Sekarang" : language === "ar" ? "استفسار" : "Enquire"}</span>
                      <ChevronRight size={15} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Official Inclusions Strip from brochure page 1 */}
      <div className="bilc-features-strip">
        <div className="bilc-feature-item">
          <GraduationCap size={22} />
          <div>
            <strong>{language === "ms" ? "Tenaga Pengajar Pakar" : language === "ar" ? "نخبة من الأساتذة والخبراء" : "Expert Teachers"}</strong>
            <p>{language === "ms" ? "Pengajar bertauliah & berpengalaman antarabangsa" : language === "ar" ? "معلمون معتمدون دولياً ذوو كفاءة عالية" : "Internationally qualified & certified instructors"}</p>
          </div>
        </div>
        <div className="bilc-feature-item">
          <Sparkles size={22} />
          <div>
            <strong>{language === "ms" ? "Kemudahan Moden" : language === "ar" ? "مرافق تعليمية متطورة" : "Modern Facilities"}</strong>
            <p>{language === "ms" ? "Bilik darjah pintar interaktif di Pavilion Embassy" : language === "ar" ? "فصول ذكية تفاعلية في بافيليون إمباسي" : "Interactive smart classrooms at Pavilion Embassy"}</p>
          </div>
        </div>
        <div className="bilc-feature-item">
          <Globe size={22} />
          <div>
            <strong>{language === "ms" ? "Komuniti Global" : language === "ar" ? "مجتمع طلابي عالمي" : "Global Community"}</strong>
            <p>{language === "ms" ? "Kelompok pelajar pelbagai negara dan budaya" : language === "ar" ? "بيئة تفاعلية تحتضن طلاباً من مختلف دول العالم" : "Diverse international student cohort"}</p>
          </div>
        </div>
        <div className="bilc-feature-item">
          <Users size={22} />
          <div>
            <strong>{language === "ms" ? "Pembelajaran Peribadi" : language === "ar" ? "توجيه وتعليم مخصص" : "Personalized Learning"}</strong>
            <p>{language === "ms" ? "Laluan tersuai menepati aspirasi setiap individu" : language === "ar" ? "مسارات دراسية مرنة تلبي طموحاتك الخاصة" : "Tailored pathways matching individual ambitions"}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

