import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { 
  Building2, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  X, 
  MapPin, 
  Sofa, 
  Monitor, 
  Users, 
  GraduationCap, 
  MessageSquare 
} from "lucide-react";

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
      desc: "مساحة هادئة مخصصة للتحضير المكثф لامتحان الآيلتس، والتقييمات الفردية، والتدريب на المحادثة.",
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
      return <Sofa size={24} className="text-[#173fad]" />;
    case 2:
      return <Monitor size={24} className="text-[#173fad]" />;
    case 3:
      return <GraduationCap size={24} className="text-[#173fad]" />;
    case 4:
      return <Users size={24} className="text-[#173fad]" />;
    case 5:
      return <Building2 size={24} className="text-[#173fad]" />;
    default:
      return <Building2 size={24} className="text-[#173fad]" />;
  }
};

export function CampusFacilitiesShowcase() {
  const { language, t, isRTL } = useLanguage();
  const [activeFacility, setActiveFacility] = useState<number>(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Swipe state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

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

  // Touch handlers for responsive swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const diff = touchStartX - touchEndX;
    const swipeThreshold = 50;

    if (diff > swipeThreshold) {
      // Swipe Left -> Next (In RTL, this moves to previous)
      if (isRTL) prevFacility();
      else nextFacility();
    } else if (diff < -swipeThreshold) {
      // Swipe Right -> Prev (In RTL, this moves to next)
      if (isRTL) nextFacility();
      else prevFacility();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const activeInfo = localized(campusFacilities[activeFacility]!);

  // Multilingual CTA resources
  const tCTA = {
    en: {
      title: "Want to explore in person?",
      subtitle: "Book a campus tour and experience our learning spaces firsthand.",
      button: "Book a Tour"
    },
    ms: {
      title: "Mahu meneroka secara peribadi?",
      subtitle: "Tempah lawatan kampus dan alami ruang pembelajaran kami secara langsung.",
      button: "Tempah Lawatan"
    },
    ar: {
      title: "هل ترغب في زيارتنا شخصياً؟",
      subtitle: "احجز جولة في المركز واستكشف بيئتنا التعليمية الراقية بنفسك.",
      button: "احجز جولة الآن"
    }
  }[language === "ms" ? "ms" : language === "ar" ? "ar" : "en"];

  const tView = language === "ms" ? "Lihat" : language === "ar" ? "عرض" : "View";

  return (
    <section id="campus-facilities-section" className="relative bg-transparent py-16 px-4 sm:px-6 lg:px-8 overflow-hidden border-none">
      <div className="max-w-7xl mx-auto relative z-10">
        
         {/* =========================================================================
            1. Section Introduction (Unified Heading & Context)
           ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#173fad] text-xs font-extrabold uppercase tracking-widest mb-3 border border-blue-100/30">
            <Building2 size={13} className="stroke-[2.5]" />
            <span>{t("home.facilitiesEyebrow", undefined, "CAMPUS FACILITIES")}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] tracking-tight mb-4">
            {t("home.facilitiesTitle", undefined, "Modern Learning Spaces at Pavilion Embassy")}
          </h2>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
            {t("home.facilitiesSubtitle", undefined, "Experience our state-of-the-art multimedia classrooms, executive lounges, private study suites, and student breakout zones.")}
          </p>
        </div>

        {/* =========================================================================
            2. Split Screen / Responsive Showcase Grid
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-transparent overflow-hidden p-4 sm:p-6 lg:p-8">
          
          {/* =========================================================================
              DESKTOP LEFT SIDEBAR: Interactive Facility Selector Tabs (Hidden on mobile)
             ========================================================================= */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-center space-y-3">
            {campusFacilities.map((fac, idx) => {
              const info = localized(fac);
              const isActive = idx === activeFacility;
              return (
                <button
                  key={fac.id}
                  onClick={() => setActiveFacility(idx)}
                  className={`w-full text-left p-4.5 rounded-xl transition-all duration-350 flex items-center justify-between border ${
                    isActive
                      ? "bg-blue-50/70 border-blue-200 shadow-xs"
                      : "border-transparent bg-white/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-lg flex items-center justify-center transition-colors ${
                      isActive ? "bg-[#173fad] text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      {React.cloneElement(getFacilityIcon(fac.id), { 
                        size: 18,
                        className: isActive ? "text-white" : "text-slate-500"
                      })}
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                        isActive ? "text-[#173fad]" : "text-slate-400"
                      }`}>
                        {info.type}
                      </span>
                      <h3 className={`font-bold text-sm mt-0.5 transition-colors ${
                        isActive ? "text-[#0f172a]" : "text-slate-600"
                      }`}>
                        {info.title}
                      </h3>
                    </div>
                  </div>
                  {isActive && (
                    <motion.div 
                      layoutId="active-dot" 
                      className="w-1.5 h-1.5 rounded-full bg-[#173fad]" 
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* =========================================================================
              DESKTOP FEATURED CONTENT CARD (Visible on Desktop Only)
             ========================================================================= */}
          <div className="hidden lg:flex lg:col-span-7 flex-col justify-between">
            <div 
              id="campus-facilities-main-card"
              className="relative aspect-[1.4] rounded-[24px] overflow-hidden shadow-xs group cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Active Slide Image */}
              <div className="absolute inset-0 w-full h-full bg-slate-50 flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeFacility}
                    src={campusFacilities[activeFacility]!.image}
                    alt={localized(campusFacilities[activeFacility]!).title}
                    referrerPolicy="no-referrer"
                    initial={{ opacity: 0, scale: 1.01 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover select-none"
                  />
                </AnimatePresence>
              </div>

              {/* Floating View Lightbox Action */}
              <button
                onClick={() => setLightboxIndex(activeFacility)}
                className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white backdrop-blur-md text-[#173fad] text-xs font-bold border border-slate-200/50 transition-all active:scale-95 shadow-sm"
                title="Expand image"
              >
                <Eye size={13} className="text-[#173fad]" />
                <span>{tView}</span>
              </button>

              {/* Overlay Interactive Text (Styled for Desktop overlay) */}
              <div id="campus-facilities-overlay-text" className="absolute bottom-0 z-10 flex flex-col items-start">
                <div className="flex items-center gap-1.5 text-[#173fad] text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1.5">
                  <MapPin size={11} className="text-[#173fad] stroke-[2.5]" />
                  <span>PAVILION EMBASSY, KL</span>
                </div>
                <div className="bg-[#173fad]/10 text-[#173fad] text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md mb-2 shadow-2xs">
                  {activeInfo.type}
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-extrabold tracking-tight text-[#0f172a] mb-1.5 leading-tight">
                  {activeInfo.title}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-xl font-medium">
                  {activeInfo.desc}
                </p>
              </div>
            </div>

            {/* Desktop Carousel Indicators and Navigation */}
            <div className="flex flex-col items-center mt-5">
              <div className="flex gap-1.5 justify-center items-center h-2 w-36 mb-2">
                {campusFacilities.map((_, idx) => {
                  const isIndicatorActive = idx === activeFacility;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveFacility(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        isIndicatorActive ? "w-8 bg-[#173fad]" : "w-2 bg-slate-200"
                      }`}
                      aria-label={`Show facility ${idx + 1}`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-between w-full max-w-sm px-4">
                <button
                  onClick={prevFacility}
                  className="campus-facilities-nav-btn w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-700 transition-all duration-150 active:scale-90 shadow-2xs"
                  aria-label="Previous Facility"
                >
                  <ChevronLeft size={18} className="stroke-[2.5]" />
                </button>

                <div className="text-xs sm:text-sm font-extrabold">
                  <span className="text-[#173fad]">{String(activeFacility + 1).padStart(2, '0')}</span>
                  <span className="text-slate-400 font-medium"> / {String(campusFacilities.length).padStart(2, '0')}</span>
                </div>

                <button
                  onClick={nextFacility}
                  className="campus-facilities-nav-btn w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-700 transition-all duration-150 active:scale-90 shadow-2xs"
                  aria-label="Next Facility"
                >
                  <ChevronRight size={18} className="stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* =========================================================================
              MOBILE/TABLET ULTRA-SIMPLIFIED CARD VIEW (Visible on Mobile Only)
             ========================================================================= */}
          <div className="flex lg:hidden flex-col w-full">
            {/* Aspect frame with clean Swipeable Area */}
            <div 
              className="relative w-full aspect-[1.5] rounded-2xl overflow-hidden shadow-xs bg-slate-50 cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeFacility}
                  src={campusFacilities[activeFacility]!.image}
                  alt={localized(campusFacilities[activeFacility]!).title}
                  referrerPolicy="no-referrer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full object-cover select-none"
                />
              </AnimatePresence>

              {/* Instant Zoom trigger button */}
              <button
                onClick={() => setLightboxIndex(activeFacility)}
                className="absolute top-3 right-3 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-white/95 backdrop-blur-md text-[#173fad] border border-slate-200/50 transition-all active:scale-90 shadow-xs"
                aria-label="Zoom facility"
              >
                <Eye size={14} />
              </button>

              {/* Compact page/index indicator pill */}
              <div className="absolute top-3 left-3 z-20 bg-[#173fad]/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs">
                {activeFacility + 1} / {campusFacilities.length}
              </div>
            </div>

            {/* Clean, comfortable text info block below the image */}
            <div className="mt-4 flex flex-col items-start text-left">
              <div className="flex items-center gap-1 text-[#173fad] text-[10px] font-semibold uppercase tracking-wider mb-1">
                <MapPin size={10} className="text-[#173fad] stroke-[2.5]" />
                <span>PAVILION EMBASSY, KL</span>
              </div>
              
              <h3 className="text-base font-extrabold text-[#0f172a] tracking-tight leading-tight mb-1">
                {activeInfo.title}
              </h3>

              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                {activeInfo.desc}
              </p>
            </div>

            {/* Pagination dots & clean left/right buttons below text */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 w-full">
              <button
                onClick={prevFacility}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-50 border border-slate-200/50 text-slate-700 active:scale-90 transition-all"
                aria-label="Previous Facility"
              >
                <ChevronLeft size={16} className="stroke-[2.5]" />
              </button>

              <div className="flex gap-1.5 justify-center items-center">
                {campusFacilities.map((_, idx) => {
                  const isDotActive = idx === activeFacility;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveFacility(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        isDotActive ? "w-6 bg-[#173fad]" : "w-1.5 bg-slate-200"
                      }`}
                      aria-label={`Go to facility slide ${idx + 1}`}
                    />
                  );
                })}
              </div>

              <button
                onClick={nextFacility}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-50 border border-slate-200/50 text-slate-700 active:scale-90 transition-all"
                aria-label="Next Facility"
              >
                <ChevronRight size={16} className="stroke-[2.5]" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* =========================================================================
          6. FULL SCREEN IMMERSIVE LIGHTBOX MODAL (Cinematic Picture View)
         ========================================================================= */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxIndex(null)}
            className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 cursor-pointer"
          >
            {/* Top Bar with type and Close Action (Always visible, clean, and unclipped) */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl flex items-center justify-between mb-4 px-1 text-white z-50"
            >
              <span className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider">
                {localized(campusFacilities[lightboxIndex]!).type}
              </span>
              <button
                onClick={() => setLightboxIndex(null)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs font-bold transition-all border border-white/10 active:scale-95 cursor-pointer"
                aria-label="Close lightbox"
              >
                <X size={14} />
                <span>{language === "ms" ? "Tutup" : language === "ar" ? "إغلاق" : "Close"}</span>
              </button>
            </div>

            {/* Navigation buttons */}
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev !== null ? (prev - 1 + campusFacilities.length) % campusFacilities.length : null)) }}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/50 text-white hover:bg-slate-800 border border-white/10 transition-colors z-45 hidden sm:block active:scale-90"
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev !== null ? (prev + 1) % campusFacilities.length : null)) }}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/50 text-white hover:bg-slate-800 border border-white/10 transition-colors z-45 hidden sm:block active:scale-90"
              aria-label="Next slide"
            >
              <ChevronRight size={24} />
            </button>

            {/* Enlarged Image Container with Full Info Bar */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl cursor-default"
            >
              <img
                src={campusFacilities[lightboxIndex]!.image}
                alt={localized(campusFacilities[lightboxIndex]!).title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover select-none"
              />
              <div className="absolute inset-x-0 bottom-0 bg-slate-950/85 p-5 border-t border-slate-800 text-white">
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-blue-900/50 text-blue-300 border border-blue-900/30">
                  {localized(campusFacilities[lightboxIndex]!).type}
                </span>
                <h3 className="text-base sm:text-lg font-extrabold mt-2.5">
                  {localized(campusFacilities[lightboxIndex]!).title}
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm mt-1 leading-relaxed">
                  {localized(campusFacilities[lightboxIndex]!).desc}
                </p>
              </div>
            </div>

            {/* Progress dots in modal */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="flex gap-2.5 mt-6 z-50"
            >
              {campusFacilities.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    lightboxIndex === idx ? "bg-blue-500 scale-125" : "bg-slate-700 hover:bg-slate-600"
                  }`}
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
