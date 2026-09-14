import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Quote, Star, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";

interface Testimonial {
  id: number;
  rating: number;
  program: { en: string; ms: string; ar: string };
  author: string;
  role: { en: string; ms: string; ar: string };
  avatarInitial: string;
  avatarBg: string;
  en: { quote: string };
  ms: { quote: string };
  ar: { quote: string };
}

const testimonialsData: Testimonial[] = [
  {
    id: 1,
    rating: 5,
    program: {
      en: "General English & Speaking",
      ms: "Bahasa Inggeris Umum & Pertuturan",
      ar: "اللغة الإنجليزية العامة والمحادثة"
    },
    author: "Fatima Al-Harbi",
    role: {
      en: "International Student, Saudi Arabia",
      ms: "Pelajar Antarabangsa, Arab Saudi",
      ar: "طالبة دولية، المملكة العربية السعودية"
    },
    avatarInitial: "F",
    avatarBg: "bg-emerald-500",
    en: {
      quote: "Bilingual Idol completely changed my confidence! In just 3 months, I went from struggling with basic grammar to speaking fluently. The location at Pavilion Embassy is so modern and convenient."
    },
    ms: {
      quote: "Bilingual Idol mengubah keyakinan saya sepenuhnya! Dalam masa 3 bulan sahaja, saya berjaya bertutur dengan lancar daripada menghadapi masalah tatabahasa asas. Lokasi di Pavilion Embassy sangat moden dan selesa."
    },
    ar: {
      quote: "لقد غيرت بايلينجوال آيدول مستوى ثقتي بنفسي تمامًا! في غضون 3 أشهر فقط، انتقلت من الصعوبة في القواعد الأساسية إلى التحدث بطلاقة تامة. كما أن موقع المركز في بافيليون إمباسي حديث للغاية ومريح."
    }
  },
  {
    id: 2,
    rating: 5,
    program: {
      en: "IELTS Exam Preparation",
      ms: "Persediaan Peperiksaan IELTS",
      ar: "التحضير لامتحان الآيلتس"
    },
    author: "Marcus Chen",
    role: {
      en: "Software Developer, Kuala Lumpur",
      ms: "Pembangun Perisian, Kuala Lumpur",
      ar: "مطور برمجيات، كوالالمبور"
    },
    avatarInitial: "M",
    avatarBg: "bg-blue-600",
    en: {
      quote: "The IELTS coaching here is top-notch. Thanks to the structured mock exams and personalized writing feedback, I achieved an overall Band 8.0 on my first attempt! Highly recommend the educators here."
    },
    ms: {
      quote: "Bimbingan IELTS di sini adalah yang terbaik. Terima kasih kepada peperiksaan olok-olok berstruktur dan maklum balas penulisan peribadi, saya mencapai Band 8.0 dalam cubaan pertama saya! Sangat mengesyorkan pendidik di sini."
    },
    ar: {
      quote: "التدريب على الآيلتس هنا متميز للغاية. بفضل الامتحانات التجريبية المنظمة والملاحظات المخصصة على الكتابة، حققت درجة 8.0 في محاولتي الأولى! أوصي بشدة بالمعلمين هنا."
    }
  },
  {
    id: 3,
    rating: 5,
    program: {
      en: "Kids English Programme",
      ms: "Program Bahasa Inggeris Kanak-kanak",
      ar: "برنامج اللغة الإنجليزية للأطفال"
    },
    author: "Aisyah Mokhtar",
    role: {
      en: "Parent of 8-year-old Learner",
      ms: "Ibu bapa kepada Pelajar 8 tahun",
      ar: "ولي أمر طالب بعمر 8 سنوات"
    },
    avatarInitial: "A",
    avatarBg: "bg-amber-500",
    en: {
      quote: "My son used to be extremely shy about speaking English, but the teachers at Bilingual Idol made classes so engaging and playful. Now he loves reading English storybooks and speaks with superb pronunciation."
    },
    ms: {
      quote: "Anak lelaki saya dahulunya sangat pemalu untuk bertutur dalam bahasa Inggeris, tetapi guru di Bilingual Idol menjadikan kelas sangat menarik dan menyeronokkan. Kini dia suka membaca buku cerita Inggeris dan bertutur dengan sebutan yang hebat."
    },
    ar: {
      quote: "كان ابني خجولًا للغاية من التحدث باللغة الإنجليزية، لكن المعلمين هنا جعلوا الحصص تفاعلية وممتعة ومحفزة. أصبح الآن يحب قراءة القصص باللغة الإنجليزية ويتحدث بنطق ممتاز."
    }
  },
  {
    id: 4,
    rating: 5,
    program: {
      en: "Business Communication",
      ms: "Komunikasi Perniagaan",
      ar: "التواصل وإدارة الأعمال"
    },
    author: "Hiroshi Sato",
    role: {
      en: "Project Manager, KL Sentral",
      ms: "Pengurus Projek, KL Sentral",
      ar: "مدير مشاريع، كي إل سنترال"
    },
    avatarInitial: "H",
    avatarBg: "bg-purple-600",
    en: {
      quote: "The professional speaking workshops helped me refine my corporate presentation skills. It is not just about vocabulary; they teach cultural nuances and body language which is critical for my work."
    },
    ms: {
      quote: "Bengkel bertutur profesional membantu saya memperhalusi kemahiran pembentangan korporat saya. Ia bukan hanya tentang perbendaharaan kata; mereka mengajar nuansa budaya dan bahasa badan yang penting untuk kerja saya."
    },
    ar: {
      quote: "ساعدتني ورش عمل التحدث الاحترافية على تحسين مهارات التقديم في الشركات. الأمر لا يتعلق فقط بالمفردات؛ بل يعلمون الفروق الثقافية الدقيقة ولغة الجسد الضرورية لعملي."
    }
  }
];

export function VerifiedTestimonials() {
  const { language, t, isRTL } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const localized = (testi: Testimonial) => {
    const quote = language === "ms" ? testi.ms.quote : language === "ar" ? testi.ar.quote : testi.en.quote;
    const program = language === "ms" ? testi.program.ms : language === "ar" ? testi.program.ar : testi.program.en;
    const role = language === "ms" ? testi.role.ms : language === "ar" ? testi.role.ar : testi.role.en;
    return { quote, program, role };
  };

  const activeTestimonial = testimonialsData[currentIndex]!;
  const info = localized(activeTestimonial);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonialsData.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonialsData.length) % testimonialsData.length);
  };

  return (
    <section id="verified-testimonials-section" className="relative bg-white dark:bg-slate-950 py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-100 dark:border-slate-900 overflow-hidden">
      
      {/* Decorative Blur Accent */}
      <div className="absolute right-0 top-0 w-80 h-80 bg-blue-50/50 dark:bg-blue-900/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute left-0 bottom-0 w-80 h-80 bg-slate-50/50 dark:bg-slate-900/10 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            <span>{t("home.testimonialsEyebrow")}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
            {t("home.testimonialsTitle")}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
            {t("home.testimonialsSubtitle")}
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 sm:p-10 lg:p-12 shadow-xs">
          
          {/* Quote Icon Background decorative */}
          <div className="absolute top-6 left-6 text-blue-100 dark:text-blue-950/40 opacity-70 pointer-events-none select-none">
            <Quote size={80} className="stroke-none fill-current" />
          </div>

          <div className="relative min-h-[220px] flex flex-col justify-between">
            
            {/* Animated Quote */}
            <div className="mb-6 relative z-10">
              <div className="flex gap-1 mb-4">
                {[...Array(activeTestimonial.rating)].map((_, i) => (
                  <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-slate-700 dark:text-slate-200 text-lg sm:text-xl font-medium leading-relaxed italic"
                >
                  "{info.quote}"
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Author Information Layout */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-200/60 dark:border-slate-800/50 pt-6">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-4"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm ${activeTestimonial.avatarBg}`}>
                    {activeTestimonial.avatarInitial}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      {activeTestimonial.author}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1.5 mt-0.5">
                      <span>{info.role}</span>
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Program pill & Navigation controls */}
              <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100/30 text-blue-700 dark:text-blue-300 text-xs font-semibold"
                  >
                    <GraduationCap size={13} />
                    <span>{info.program}</span>
                  </motion.div>
                </AnimatePresence>

                {/* Arrow Controls */}
                <div className="flex gap-2">
                  <button
                    onClick={handlePrev}
                    className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={handleNext}
                    className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
                    aria-label="Next testimonial"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}

export default VerifiedTestimonials;
