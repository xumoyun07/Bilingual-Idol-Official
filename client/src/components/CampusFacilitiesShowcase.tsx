import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Building2, ChevronLeft, ChevronRight, Eye, X, MapPin, Sofa, Monitor, BookOpen, Users, MessageSquare } from "lucide-react";

interface Facility {
  id: number;
  image: string;
  en: { title: string; desc: string; type: string };
  ms: { title: string; desc: string; type: string };
  ar: { title: string; desc: string; type: string };
}

const campusFacilities: Facility[] = [
  {
    id: 1,
    image: "/media/20260727_164539.webp",
    en: {
      title: "Pavilion Embassy Executive Lounge",
      desc: "Our elegant reception and consultation lounge designed for a premium, distraction-free environment.",
      type: "Executive Lounge"
    },
    ms: {
      title: "Ruang Rehat Eksekutif Pavilion Embassy",
      desc: "Ruang penerimaan dan rundingan kami yang elegan, direka untuk persekitaran pembelajaran yang premium dan fokus.",
      type: "Ruang Rehat Eksekutif"
    },
    ar: {
      title: "صالة كبار الشخصيات في بافيليون إمباسي",
      desc: "منطقة استقبال واستشارات راقية ومريحة لضمان تجربة تعليمية متميزة وهادئة.",
      type: "صالة استقبال كبار الشخصيات"
    }
  },
  {
    id: 2,
    image: "/media/20260727_170846.webp",
    en: {
      title: "Smart Multimedia Classroom",
      desc: "Equipped with interactive touch-screens and premium acoustic insulation to enhance interactive group speaking.",
      type: "Interactive Classroom"
    },
    ms: {
      title: "Bilik Darjah Multimedia Pintar",
      desc: "Dilengkapi dengan skrin sentuh interaktif dan penebat bunyi premium untuk meningkatkan komunikasi kumpulan.",
      type: "Bilik Darjah Interaktif"
    },
    ar: {
      title: "قاعات دراسية ذكية وتفاعلية",
      desc: "مجهزة بأحدث الشاشات التفاعلية وعزل صوتي ممتاز لتعزيز مهارات التحدث والتفاعل الجماعي.",
      type: "قاعة دراسية تفاعلية"
    }
  },
  {
    id: 3,
    image: "/media/20260803_142531.webp",
    en: {
      title: "Private Study & IELTS Coaching Suite",
      desc: "A dedicated quiet space for intensive IELTS coaching, individual assessments, and speaking practice.",
      type: "Private Suite"
    },
    ms: {
      title: "Suite Pengajian Peribadi & Bimbingan IELTS",
      desc: "Kawasan senyap khas untuk bimbingan IELTS intensif, penilaian individu dan latihan bertutur.",
      type: "Suite Peribadi"
    },
    ar: {
      title: "أجنحة الدراسة الخاصة والتدريب على الآيلتس",
      desc: "مساحة هادئة مخصصة للتحضير المكثف لامتحان الآيلتس، والتقييمات الفردية، والتدريب على المحادثة.",
      type: "جناح دراسة خاص"
    }
  },
  {
    id: 4,
    image: "/media/20260803_142543.webp",
    en: {
      title: "Student Collaboration Zone",
      desc: "Inspiring breakout spaces designed for bilingual networking, interactive debates, and cultural exchange.",
      type: "Breakout Space"
    },
    ms: {
      title: "Zon Kolaborasi Pelajar",
      desc: "Ruang santai yang memberi inspirasi untuk jaringan dwi-bahasa, perbincangan interaktif, dan pertukaran budaya.",
      type: "Zon Kolaborasi"
    },
    ar: {
      title: "منطقة التعاون والتبادل الطلابي",
      desc: "مساحات حيوية مصممة للشبكات ثنائية اللغة، والمناقشات التفاعلية، والتبادل الثقافي بين الطلاب.",
      type: "مساحة تفاعلية"
    }
  },
  {
    id: 5,
    image: "/media/20260803_142624.webp",
    en: {
      title: "Admissions & Counseling Wing",
      desc: "Modern consultation offices where expert educational advisors guide student academic journeys in KL.",
      type: "Admissions Center"
    },
    ms: {
      title: "Sayap Kemasukan & Kaunseling",
      desc: "Pejabat perundingan moden di mana penasihat pendidikan berpengalaman membimbing perjalanan akademik anda.",
      type: "Pusat Kemasukan"
    },
    ar: {
      title: "جناح القبول والتوجيه الأكاديمي",
      desc: "مكاتب استشارية حديثة حيث يرشدك مستشارونا التعليميون ذوو الخبرة في رحلتك الأكاديمية.",
      type: "مكتب القبول والتسجيل"
    }
  }
];

const getFacilityIcon = (id: number) => {
  switch (id) {
    case 1:
      return <Sofa size={22} className="text-blue-600 dark:text-blue-400" />;
    case 2:
      return <Monitor size={22} className="text-blue-600 dark:text-blue-400" />;
    case 3:
      return <BookOpen size={22} className="text-blue-600 dark:text-blue-400" />;
    case 4:
      return <Users size={22} className="text-blue-600 dark:text-blue-400" />;
    case 5:
      return <MessageSquare size={22} className="text-blue-600 dark:text-blue-400" />;
    default:
      return <Building2 size={22} className="text-blue-600 dark:text-blue-400" />;
  }
};

export function CampusFacilitiesShowcase() {
  const { language, t, isRTL } = useLanguage();
  const [activeFacility, setActiveFacility] = useState<number>(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const localized = (fac: Facility) => {
    if (language === "ms") return fac.ms;
    if (language === "ar") return fac.ar;
    return fac.en;
  };

  const nextFacility = () => {
    setActiveFacility((prev) => (prev + 1) % campusFacilities.length);
  };

  const prevFacility = () => {
    setActiveFacility((prev) => (prev - 1 + campusFacilities.length) % campusFacilities.length);
  };

  const activeInfo = localized(campusFacilities[activeFacility]!);

  return (
    <section id="campus-facilities-section" className="relative bg-slate-50 dark:bg-slate-900/50 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Building2 size={13} />
            <span>{t("home.facilitiesEyebrow")}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
            {t("home.facilitiesTitle")}
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
            {t("home.facilitiesSubtitle")}
          </p>
        </div>

        {/* Feature Layout (Split Screen Showcase) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden p-4 sm:p-6 lg:p-8">
          
          {/* Left: Gallery Control / Tabs */}
          <div className="lg:col-span-5 space-y-3 order-2 lg:order-1">
            <div className="hidden lg:block space-y-2">
              {campusFacilities.map((fac, idx) => {
                const info = localized(fac);
                const isActive = idx === activeFacility;
                return (
                  <button
                    key={fac.id}
                    onClick={() => setActiveFacility(idx)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-300 flex items-center justify-between border ${
                      isActive
                        ? "bg-blue-50/70 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/50 shadow-xs"
                        : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isActive ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}>
                        {info.type}
                      </span>
                      <h3 className={`font-medium text-sm mt-1 transition-colors ${isActive ? "text-blue-900 dark:text-blue-100" : "text-slate-700 dark:text-slate-300"}`}>
                        {info.title}
                      </h3>
                    </div>
                    {isActive && (
                      <motion.div layoutId="active-dot" className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile Controls */}
            <div className="lg:hidden space-y-4">
              {/* Header and counter for Mobile */}
              <div className="flex items-center justify-between mt-6 mb-2">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === "ms" ? "Terokai Lebih Banyak Kemudahan" : language === "ar" ? "استكشف المزيد من المرافق" : "Explore More Facilities"}
                </h4>
                <div className="text-sm">
                  <span className="font-bold text-blue-600 dark:text-blue-400">{String(activeFacility + 1).padStart(2, '0')}</span>
                  <span className="text-slate-400"> / {String(campusFacilities.length).padStart(2, '0')}</span>
                </div>
              </div>

              {/* Horizontal Scroll bar of facility cards */}
              <div 
                className="flex overflow-x-auto gap-4 pb-4 pt-1 -mx-4 px-4 scroll-smooth snap-x snap-mandatory"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {campusFacilities.map((fac, idx) => {
                  const info = localized(fac);
                  const isActive = idx === activeFacility;
                  return (
                    <button
                      key={fac.id}
                      onClick={() => setActiveFacility(idx)}
                      className={`flex-none snap-center w-[185px] p-5 rounded-2xl border text-center bg-white dark:bg-slate-900 transition-all duration-300 flex flex-col items-center justify-between h-[210px] ${
                        isActive
                          ? "border-blue-600 dark:border-blue-500 shadow-md ring-1 ring-blue-600/20"
                          : "border-slate-200/60 dark:border-slate-800/60 shadow-xs hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {/* Top: Icon Container */}
                      <div className="w-14 h-14 rounded-full flex items-center justify-center bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100/30">
                        {getFacilityIcon(fac.id)}
                      </div>

                      {/* Middle: Info text */}
                      <div className="flex-1 flex flex-col items-center justify-center mt-3">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 text-center block">
                          {info.type}
                        </span>
                        <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug text-center">
                          {info.title}
                        </h3>
                      </div>

                      {/* Bottom: Dot Indicator */}
                      <div className="w-full flex justify-center mt-2">
                        <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Enhanced Prev/Next buttons with smooth segmented scroll bar */}
              <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-800/60 mt-1">
                <button
                  onClick={prevFacility}
                  className="p-3 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all border border-slate-200/50 dark:border-slate-800/50 active:scale-95 shadow-2xs"
                  aria-label="Previous facility"
                >
                  <ChevronLeft size={18} />
                </button>
                
                {/* Visual Pagination Indicator Segments */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {language === "ms" ? "Sapu untuk meneroka semua kemudahan" : language === "ar" ? "اسحب لاستكشاف جميع المرافق" : "Swipe to explore all facilities"}
                  </span>
                  <div className="flex gap-1 h-1 w-28 items-center mt-0.5">
                    {campusFacilities.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          idx === activeFacility ? "bg-blue-600 dark:bg-blue-400" : "bg-slate-200 dark:bg-slate-750"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={nextFacility}
                  className="p-3 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all border border-slate-200/50 dark:border-slate-800/50 active:scale-95 shadow-2xs"
                  aria-label="Next facility"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Active Image with Information Overlay */}
          <div className="lg:col-span-7 order-1 lg:order-2 relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] xl:aspect-[16/10] rounded-xl overflow-hidden shadow-xs group">
            
            {/* Image Slider animation */}
            <div className="absolute inset-0 w-full h-full bg-slate-100 dark:bg-slate-800">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeFacility}
                  src={campusFacilities[activeFacility]!.image}
                  alt={localized(campusFacilities[activeFacility]!).title}
                  referrerPolicy="no-referrer"
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="w-full h-full object-cover select-none"
                />
              </AnimatePresence>
            </div>

            {/* Info Overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent p-5 sm:p-6 pt-20 flex flex-col justify-end text-white z-10 pointer-events-none">
              <div className="flex items-center gap-1.5 text-blue-300 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2">
                <MapPin size={12} className="text-blue-400" />
                <span>PAVILION EMBASSY, KL</span>
              </div>
              <div className="inline-block self-start bg-blue-600/90 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-md mb-2">
                {activeInfo.type}
              </div>
              <h3 className="text-base sm:text-xl font-bold tracking-tight text-white mb-2">
                {activeInfo.title}
              </h3>
              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed max-w-2xl opacity-90">
                {activeInfo.desc}
              </p>
            </div>

            {/* Floating Zoom Action */}
            <button
              onClick={() => setLightboxIndex(activeFacility)}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md text-white border border-white/10 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 transition-opacity duration-300"
              title="Expand image"
            >
              <Eye size={16} />
            </button>
          </div>

        </div>

      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8"
          >
            {/* Close Button */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-900/50 text-white hover:bg-slate-800 border border-white/10 transition-colors z-50"
              aria-label="Close lightbox"
            >
              <X size={20} />
            </button>

            {/* Navigation buttons */}
            <button
              onClick={() => setLightboxIndex((prev) => (prev !== null ? (prev - 1 + campusFacilities.length) % campusFacilities.length : null))}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/50 text-white hover:bg-slate-800 border border-white/10 transition-colors z-40 hidden sm:block"
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => setLightboxIndex((prev) => (prev !== null ? (prev + 1) % campusFacilities.length : null))}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/50 text-white hover:bg-slate-800 border border-white/10 transition-colors z-40 hidden sm:block"
              aria-label="Next slide"
            >
              <ChevronRight size={24} />
            </button>

            {/* Enlarged Image container */}
            <div className="relative max-w-5xl w-full aspect-[4/3] sm:aspect-[16/10] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
              <img
                src={campusFacilities[lightboxIndex]!.image}
                alt={localized(campusFacilities[lightboxIndex]!).title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover select-none"
              />
              <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 p-5 border-t border-slate-800 text-white">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-300 border border-blue-900/30">
                  {localized(campusFacilities[lightboxIndex]!).type}
                </span>
                <h3 className="text-lg font-bold mt-2">
                  {localized(campusFacilities[lightboxIndex]!).title}
                </h3>
                <p className="text-slate-300 text-sm mt-1">
                  {localized(campusFacilities[lightboxIndex]!).desc}
                </p>
              </div>
            </div>

            {/* Progress dot indicators in lightbox */}
            <div className="flex gap-2 mt-6">
              {campusFacilities.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${lightboxIndex === idx ? "bg-blue-500 scale-125" : "bg-slate-700 hover:bg-slate-600"}`}
                />
              ))}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}

export default CampusFacilitiesShowcase;
