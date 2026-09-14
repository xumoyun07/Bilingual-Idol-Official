import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Building2, ChevronLeft, ChevronRight, Eye, X, MapPin } from "lucide-react";

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
            <div className="lg:hidden flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-800 mt-2">
              <button
                onClick={prevFacility}
                className="p-2.5 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                aria-label="Previous facility"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {activeFacility + 1} / {campusFacilities.length}
              </span>
              <button
                onClick={nextFacility}
                className="p-2.5 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                aria-label="Next facility"
              >
                <ChevronRight size={20} />
              </button>
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
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-5 pt-16 flex flex-col justify-end text-white z-10 pointer-events-none">
              <div className="flex items-center gap-1.5 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                <MapPin size={11} />
                <span>Pavilion Embassy, KL</span>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-white mb-2">
                {localized(campusFacilities[activeFacility]!).title}
              </h3>
              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed max-w-2xl">
                {localized(campusFacilities[activeFacility]!).desc}
              </p>
            </div>

            {/* Floating Zoom Action */}
            <button
              onClick={() => setLightboxIndex(activeFacility)}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-900/50 hover:bg-slate-900/80 backdrop-blur-md text-white border border-white/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-300"
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
