import { Armchair, BookOpen, ChevronLeft, ChevronRight, Laptop, MonitorPlay, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/translations";

interface Facility {
  id: string;
  icon: typeof MonitorPlay;
  imageUrl: string;
  titles: Record<Language, string>;
  subtitles: Record<Language, string>;
  descriptions: Record<Language, string>;
  highlights: Record<Language, string[]>;
}

const FACILITIES: Facility[] = [
  {
    id: "smart-classrooms",
    icon: Laptop,
    imageUrl: "/media/about_classroom.webp",
    titles: {
      en: "Smart Interactive Classrooms",
      ms: "Bilik Darjah Pintar Interaktif",
      ar: "فصول دراسية ذكية وتفاعلية",
    },
    subtitles: {
      en: "Cutting-Edge Digital Interactive Systems",
      ms: "Sistem Digital Terkini & Interaktif",
      ar: "أنظمة رقمية متطورة وتفاعلية بالكامل",
    },
    descriptions: {
      en: "Every classroom is equipped with interactive digital smartboards, multimedia audio-visual learning systems, and modern collaborative spaces to transform lessons into immersive experiences.",
      ms: "Setiap bilik darjah dilengkapi dengan papan pintar digital interaktif, sistem pembelajaran audio-visual multimedia, dan ruang kolaboratif moden untuk pengalaman pembelajaran menyeluruh.",
      ar: "جميع الفصول مجهزة بشاشات تفاعلية ذكية، أنظمة صوتية ومرئية حديثة، ومساحات تعليمية تفاعلية تحول الدروس إلى تجربة مشوقة وعملية.",
    },
    highlights: {
      en: [
        "Interactive digital whiteboards & touchscreen systems",
        "Ergonomic acoustic layout for crystal-clear language practice",
        "High-speed fiber connectivity for international digital resources",
      ],
      ms: [
        "Papan putih digital interaktif & sistem skrin sentuh",
        "Susun atur akustik ergonomik untuk latihan pertuturan yang jelas",
        "Sambungan gentian berkelajuan tinggi untuk sumber digital global",
      ],
      ar: [
        "شاشات ذكية تفاعلية وأنظمة لمس متطورة",
        "تصميم صوتي هندسي يضمن وضوحاً تاماً في تدريب النطق والمحادثة",
        "إنترنت فائق السرعة للوصول إلى أحدث المراجع التعليمية العالمية",
      ],
    },
  },
  {
    id: "executive-lounge",
    icon: Armchair,
    imageUrl: "/media/task_contact.webp",
    titles: {
      en: "Executive Lounge & Networking Hub",
      ms: "Ruang Rehat Eksekutif & Hab Jaringan",
      ar: "صالة كبار الشخصيات ومساحة التواصل",
    },
    subtitles: {
      en: "Elite Collaboration & Relaxation Space",
      ms: "Ruang Kerjasama & Rehat Elit",
      ar: "مساحة راقية للتعاون وبناء العلاقات",
    },
    descriptions: {
      en: "More than a resting space—an executive salon designed for collaboration and networking. Students connect, exchange cultural perspectives, brainstorm, and relax in a private clubhouse atmosphere.",
      ms: "Lebih daripada ruang rehat—salon eksekutif yang direka untuk kerjasama dan rangkaian sosial. Pelajar dapat bertukar pandangan budaya dan berehat dalam suasana kelab peribadi.",
      ar: "أكثر من مجرد مساحة للاستراحة—صالة تنفيذية راقية مصممة للتواصل وبناء العلاقات وتبادل الثقافات في أجواء مريحة وفاخرة.",
    },
    highlights: {
      en: [
        "Private members' club ambiance for professionals & diplomats",
        "Complimentary premium beverage bar and quiet conversation corners",
        "Prime Pavilion Embassy views overlooking Kuala Lumpur city center",
      ],
      ms: [
        "Suasana kelab eksklusif untuk profesional dan diplomat",
        "Bar minuman premium percuma dan sudut perbincangan tenang",
        "Pemandangan Pavilion Embassy menghadap pusat bandar Kuala Lumpur",
      ],
      ar: [
        "أجواء نوادٍ خاصة تلائم المهنيين والدبلوماسيين والطلاب",
        "ركن مشروبات مجاني وزوايا هادئة للمناقشة والدراسة",
        "إطلالات خلابة من بافيليون إمباسي على قلب كوالالمبور",
      ],
    },
  },
  {
    id: "library-resource",
    icon: BookOpen,
    imageUrl: "/media/about_method.webp",
    titles: {
      en: "Library & Digital Resource Center",
      ms: "Perpustakaan & Pusat Sumber Digital",
      ar: "المكتبة ومركز الموارد الرقمية",
    },
    subtitles: {
      en: "Global Academic & Language Archive",
      ms: "Arkib Pembelajaran & Bahasa Global",
      ar: "أرشيف أكاديمي ولغوي شامل",
    },
    descriptions: {
      en: "A seamless fusion of traditional literature and modern digital learning. Access curated academic textbooks, IELTS test archives, and global linguistic databases in a serene environment.",
      ms: "Gabungan harmoni antara bahan bacaan tradisional dan pembelajaran digital moden. Akses buku teks akademik, arkib ujian IELTS, dan pangkalan data bahasa dalam suasana tenang.",
      ar: "مزيج متكامل بين الكتب الأكاديمية والمراجع الرقمية الحديثة. وصول مباشر لأرشيف اختبارات الآيلتس وقواعد البيانات اللغوية في بيئة هادئة.",
    },
    highlights: {
      en: [
        "Extensive collection of ESL, IELTS, HSK & foreign language materials",
        "Dedicated quiet study zones & multimedia terminals",
        "Direct guidance from academic research advisors",
      ],
      ms: [
        "Koleksi lengkap bahan ESL, IELTS, HSK & bahasa antarabangsa",
        "Zon belajar tenang dan terminal multimedia khusus",
        "Bimbingan langsung daripada penasihat akademik",
      ],
      ar: [
        "مجموعة غنية من مراجع اللغة الإنجليزية والآيلتس واللغات الحية",
        "مناطق مخصصة للدراسة الهادئة ومحطات وسائط متعددة",
        "إشراف وإرشاد مستمر من المستشارين الأكاديميين",
      ],
    },
  },
  {
    id: "designer-interior",
    icon: Sparkles,
    imageUrl: "/media/about_hero.webp",
    titles: {
      en: "Designer-Inspired Modern Interior",
      ms: "Reka Bentuk Dalaman Moden Eksklusif",
      ar: "تصميم داخلي عصري وفاخر",
    },
    subtitles: {
      en: "Where Language Meets Luxury & Focus",
      ms: "Tempat Pertemuan Bahasa & Keanggunan",
      ar: "حيث تجتمع فصاحة اللغة مع رفاهية التصميم",
    },
    descriptions: {
      en: "Step into an ambiance that feels like an exclusive private academy rather than a conventional classroom. Warm ambient lighting, refined architectural finishes, and prestigious surroundings.",
      ms: "Melangkah masuk ke suasana akademi peribadi yang eksklusif dengan pencahayaan hangat, kemasan seni bina moden, dan persekitaran yang berprestij.",
      ar: "ادخل إلى بيئة تعليمية مصممة بأناقة تماثل الأكاديميات الدولية الكبرى. إضاءة مريحة وتشطيبات راقية تضمن أعلى درجات التركيز.",
    },
    highlights: {
      en: [
        "Prestigious Pavilion Embassy address (2–3 mins to Petronas Twin Towers)",
        "Warm ambient architectural lighting and boutique aesthetics",
        "Inspiring, safe, and prestigious environment for learners of all ages",
      ],
      ms: [
        "Alamat berprestij di Pavilion Embassy (2–3 minit ke Menara Berkembar KLCC)",
        "Pencahayaan arkitektur yang selesa dan estetika butik",
        "Persekitaran yang selamat, memberi inspirasi untuk semua peringkat umur",
      ],
      ar: [
        "موقع متميز في بافيليون إمباسي (دقيقتين من أبراج بتروناس)",
        "إضاءة معمارية مريحة وجماليات راقية تعزز الدافعية",
        "بيئة تعليمية آمنة وملهمة لجميع الفئات العمرية",
      ],
    },
  },
];

export function CampusFacilitiesShowcase() {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const selectedFacility = FACILITIES[selectedIndex];
  const { t, isRTL, language } = useLanguage();

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : FACILITIES.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < FACILITIES.length - 1 ? prev + 1 : 0));
  };

  const facilityTitle = selectedFacility.titles[language] || selectedFacility.titles.en;
  const facilitySubtitle = selectedFacility.subtitles[language] || selectedFacility.subtitles.en;
  const facilityDescription = selectedFacility.descriptions[language] || selectedFacility.descriptions.en;
  const facilityHighlights = selectedFacility.highlights[language] || selectedFacility.highlights.en;

  return (
    <section className={`simple-section bilc-facilities-section ${isRTL ? "is-rtl" : ""}`} id="campus-facilities">
      <div className="bilc-facilities-header">
        <div className="bilc-pricing-tag">
          <Sparkles size={16} />
          <span>
            {language === "ms"
              ? "Kampus Pavilion Embassy"
              : language === "ar"
              ? "حرم بافيليون إمباسي"
              : "Pavilion Embassy Campus"}
          </span>
        </div>
        <h2>{t("home.facilitiesTitle")}</h2>
        <p>{t("home.facilitiesSubtitle")}</p>
      </div>

      {/* Mobile Swipe / Carousel Navigation Toolbar (< 1024px) */}
      <div className="bilc-facilities-mobile-controls">
        <span className="bilc-carousel-counter">
          {language === "ms"
            ? `Kemudahan ${selectedIndex + 1} drpd ${FACILITIES.length}`
            : language === "ar"
            ? `المرفق ${selectedIndex + 1} من ${FACILITIES.length}`
            : `Facility ${selectedIndex + 1} of ${FACILITIES.length}`}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="bilc-carousel-btn"
            onClick={isRTL ? handleNext : handlePrev}
            aria-label={language === "ar" ? "المرفق السابق" : language === "ms" ? "Kemudahan sebelumnya" : "Previous facility"}
          >
            <ChevronLeft size={20} className={isRTL ? "rotate-180" : ""} />
          </button>
          <button
            type="button"
            className="bilc-carousel-btn"
            onClick={isRTL ? handlePrev : handleNext}
            aria-label={language === "ar" ? "المرفق التالي" : language === "ms" ? "Kemudahan seterusnya" : "Next facility"}
          >
            <ChevronRight size={20} className={isRTL ? "rotate-180" : ""} />
          </button>
        </div>
      </div>

      <div className="bilc-facilities-layout">
        {/* Desktop Navigation Selector (>= 1024px) */}
        <div className="bilc-facilities-nav" role="tablist">
          {FACILITIES.map((facility, index) => {
            const Icon = facility.icon;
            const isSelected = selectedIndex === index;
            const itemTitle = facility.titles[language] || facility.titles.en;
            const itemSub = facility.subtitles[language] || facility.subtitles.en;
            return (
              <button
                key={facility.id}
                role="tab"
                aria-selected={isSelected}
                aria-label={itemTitle}
                title={itemTitle}
                className={`bilc-facility-nav-item ${isSelected ? "is-selected" : ""}`}
                onClick={() => setSelectedIndex(index)}
              >
                <div className="bilc-facility-icon-circle">
                  <Icon size={20} />
                </div>
                <div className="bilc-facility-nav-text">
                  <strong>{itemTitle}</strong>
                  <span>{itemSub}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Facility Display Card */}
        <div className="bilc-facility-display-card">
          <div className="bilc-facility-media-wrap aspect-[3/4] overflow-hidden">
            <img
              src={selectedFacility.imageUrl}
              alt={facilityTitle}
              className="bilc-facility-img aspect-[3/4] object-cover object-center w-full h-full"
              loading="lazy"
              decoding="async"
            />
            <div className="bilc-facility-overlay-badge">
              <span>
                {language === "ms"
                  ? "Kampus Pavilion Embassy"
                  : language === "ar"
                  ? "حرم بافيليون إمباسي"
                  : "Pavilion Embassy Campus"}
              </span>
            </div>
          </div>

          {/* Mobile Dot Indicators */}
          <div className="bilc-carousel-dots-row" aria-hidden="true">
            {FACILITIES.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`bilc-carousel-dot ${selectedIndex === i ? "is-active" : ""}`}
                onClick={() => setSelectedIndex(i)}
                aria-label={`Go to facility ${i + 1}`}
              />
            ))}
          </div>

          <div className="bilc-facility-body">
            <h3>{facilityTitle}</h3>
            <p className="bilc-facility-desc">{facilityDescription}</p>

            <div className="bilc-facility-highlights-list">
              {facilityHighlights.map((highlight, idx) => (
                <div key={idx} className="bilc-facility-highlight-row">
                  <span className="bilc-highlight-bullet">✦</span>
                  <span>{highlight}</span>
                </div>
              ))}
            </div>

            <div className="bilc-facility-action-row">
              <Link href="/about" className="simple-button simple-button-quiet min-h-[44px]">
                {language === "ms"
                  ? "Ketahui lebih lanjut tentang kampus"
                  : language === "ar"
                  ? "تعرف أكثر على الحرم الأكاديمي"
                  : "Learn more about campus"}
              </Link>
              <Link href="/contact" className="simple-button min-h-[44px]">
                {language === "ms"
                  ? "Tempah Lawatan Kampus"
                  : language === "ar"
                  ? "احجز جولة في الحرم"
                  : "Book a Campus Tour"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

