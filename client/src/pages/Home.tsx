import { ArrowRight, Award, BookOpen, Building2, Calendar, Globe, GraduationCap, MapPin, MessageCircle, Phone, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { PublicLayout } from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { OfficialPriceList2026 } from "@/components/OfficialPriceList2026";
import { CampusFacilitiesShowcase } from "@/components/CampusFacilitiesShowcase";
import { StudentJourneyRoadmap } from "@/components/StudentJourneyRoadmap";
import { VerifiedTestimonials } from "@/components/VerifiedTestimonials";
import { FindYourCourseWidget } from "@/components/FindYourCourseWidget";
import { OnlinePlacementTestModal } from "@/components/OnlinePlacementTestModal";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
  const [_, setLocation] = useLocation();
  const [isPlacementTestOpen, setIsPlacementTestOpen] = useState(false);
  const { t, isRTL, language } = useLanguage();

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const activePromotionsQuery = trpc.promotions.publicList.useQuery();

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const media = trpc.media.publicList.useQuery();
  const mediaBySlot = new Map((media.data ?? []).map(item => [item.slot, item]));
  const heroVideoUrl = mediaBySlot.get("home_hero_video")?.publicUrl ?? "/media/hero_video.mp4";
  const heroPosterUrl = mediaBySlot.get("home_hero_poster")?.publicUrl ?? "/media/hero_poster.webp";
  const programmesMedia = mediaBySlot.get("home_task_programmes") ?? { publicUrl: "/media/task_programmes.webp", altText: "Classroom study materials at Bilingual Idol" };
  const contactMedia = mediaBySlot.get("home_task_contact") ?? { publicUrl: "/media/task_contact.webp", altText: "Admissions consultation lounge at Pavilion Embassy" };
  const accountMedia = mediaBySlot.get("home_task_account") ?? { publicUrl: "/media/task_account.webp", altText: "Learner studying in modern smart classroom" };

  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;

    // Explicitly guarantee muted attributes for standard browser autoplay compliance
    video.defaultMuted = true;
    video.muted = true;

    // Guarantee seamless loop at the trimmed duration (reduced by 1 second)
    const handleTimeUpdate = () => {
      if (video.duration && !Number.isNaN(video.duration)) {
        const targetDuration = Math.min(2.77, Math.max(1, video.duration - 1));
        if (video.currentTime >= targetDuration) {
          video.currentTime = 0;
          video.play().catch(() => {});
        }
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback gracefully if browser has aggressive battery saver or data-saver policies
      });
    }

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [heroVideoUrl]);

  const handleOpenBooking = (service?: string) => {
    const reason = service === "campus_tour" ? "campusTour" : "consultation";
    setLocation(`/contact?reason=${reason}`);
  };

  return (
    <PublicLayout>
      <div id="home-page-container" data-page="home" className={`simple-public-page home-page page-home ${isRTL ? "is-rtl" : ""} max-md:!mt-[10px]`}>
        {/* Luxury Hero Section with Seamless Loop Video */}
        <section id="home-hero-section" className="simple-home-intro simple-home-intro-offset simple-home-intro--refined simple-home-intro--desktop-geometry simple-home-intro--mobile-480 simple-home-intro--desktop-580 max-md:!mt-[10px]">
          <video
            ref={heroVideoRef}
            className="simple-home-hero-media"
            poster={heroPosterUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            aria-hidden="true"
            data-hero-video="true"
          >
            <source src="/media/hero_video.webm?v=trim-1s" type="video/webm" />
            <source src={`${heroVideoUrl}${heroVideoUrl.includes("?") ? "&" : "?"}v=trim-1s`} type="video/mp4" />
          </video>
          
          <div className="simple-home-intro-content simple-home-intro-content--desktop-offset simple-home-intro-content--desktop-geometry">
            <div className="bilc-hero-cert-badge">
              <ShieldCheck size={15} />
              <span>
                {language === "ms"
                  ? "Diperakui Kementerian Pendidikan Tinggi · WZ10104"
                  : language === "ar"
                  ? "معتمد من وزارة التعليم العالي الماليزية · WZ10104"
                  : "Ministry of Higher Education Certified · WZ10104"}
              </span>
            </div>
            
            <h1>
              {language === "ms"
                ? "Di Mana Bahasa dan Keanggunan Bersatu."
                : language === "ar"
                ? "حيث تلتقي فصاحة اللغة مع رفاهية التعلم."
                : "Where Language and Luxury Converge."}
            </h1>
            <p className="bilc-hero-zh-slogan">
              {language === "ms"
                ? "Belajar Hari Ini... Memimpin Hari Esok · Learn Today... Lead Tomorrow"
                : language === "ar"
                ? "تعلم اليوم... لتَقود الغد · Learn Today... Lead Tomorrow"
                : "语言与奢华的交汇处 · Learn Today... Lead Tomorrow"}
            </p>
            <p>{t("home.heroSubtitle")}</p>
            
            <div className="simple-actions-row max-md:pb-[15px]">
              <button 
                type="button" 
                onClick={() => setIsPlacementTestOpen(true)}
                className="simple-button"
                style={{ background: "#173fad", color: "#ffffff" }}
              >
                <Sparkles size={17} /> {t("home.ctaPlacement")}
              </button>
              <a href="#course-pricing" className="simple-button simple-button-quiet">
                {t("home.pricingEyebrow")} <ArrowRight size={17} className={isRTL ? "rotate-180" : ""} />
              </a>
              <Link
                href="/contact?reason=campusTour"
                className="simple-button simple-button-quiet cursor-pointer"
              >
                <Calendar size={17} /> {t("home.ctaBooking")}
              </Link>
            </div>
          </div>
        </section>

        {/* Official Trust Pillars Bar */}
        <div className="bilc-trust-strip">
          <div className="bilc-trust-item">
            <GraduationCap size={20} />
            <div>
              <strong>{language === "ms" ? "Kelulusan KPT" : language === "ar" ? "اعتماد رسمي" : "MOHE Approved"}</strong>
              <span>{language === "ms" ? "Lesen WZ10104" : language === "ar" ? "ترخيص WZ10104" : "License WZ10104"}</span>
            </div>
          </div>
          <div className="bilc-trust-item">
            <MapPin size={20} />
            <div>
              <strong>Pavilion Embassy</strong>
              <span>{language === "ms" ? "2-3 minit ke Menara Berkembar" : language === "ar" ? "على بعد دقيقتين من أبراج بتروناس" : "2-3 mins to Petronas Towers"}</span>
            </div>
          </div>
          <div className="bilc-trust-item">
            <Globe size={20} />
            <div>
              <strong>{language === "ms" ? "6 Bahasa Utama" : language === "ar" ? "6 لغات عالمية" : "Language options"}</strong>
              <span>{language === "ms" ? "Inggeris, Mandarin, Melayu & lain-lain" : language === "ar" ? "الإنجليزية، الملايوية، العربية وغيرها" : "English, Mandarin, Malay & more"}</span>
            </div>
          </div>
          <div className="bilc-trust-item">
            <Sparkles size={20} />
            <div>
              <strong>{language === "ms" ? "Standard Eksekutif" : language === "ar" ? "معايير تنفيذية راقية" : "Executive Standard"}</strong>
              <span>{language === "ms" ? "Bilik Darjah Pintar & Ruang Santai" : language === "ar" ? "فصول ذكية وصالات خاصة" : "Smart Classrooms & Private Lounge"}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Section 1: Interactive "Find Your Course" Guidance Widget */}
        <FindYourCourseWidget 
          onOpenPlacementTest={() => setIsPlacementTestOpen(true)}
          onOpenBooking={handleOpenBooking}
        />

        {/* Active Intake Promotions & Discounts Directory Section */}
        {activePromotionsQuery.data && activePromotionsQuery.data.length > 0 && (
          <section id="home-promotions-section" className="simple-section simple-home-panel bg-slate-50/50 border-t border-b border-slate-100 py-12">
            <div className="simple-section-heading mb-8">
              <div>
                <p className="simple-eyebrow flex items-center gap-1.5 justify-center md:justify-start">
                  <Sparkles size={14} className="text-indigo-600 animate-pulse" />
                  {language === "ms" ? "Tawaran Istimewa" : language === "ar" ? "عرض خاص" : "Special Offers"}
                </p>
                <h2>
                  {language === "ms"
                    ? "Tawaran Istimewa & Promosi Kemasukan Aktif"
                    : language === "ar"
                    ? "العروض الخاصة والتخفيضات النشطة"
                    : "Exclusive Offers & Active Intake Promotions"}
                </h2>
              </div>
              <p className="max-w-2xl text-slate-600">
                {language === "ms"
                  ? "Gunakan kod promosi semasa pendaftaran untuk menikmati diskaun istimewa untuk yuran pengajian anda."
                  : language === "ar"
                  ? "استخدم الرموز الترويجية أثناء التسجيل للحصول على خصومات حصرية على الرسوم الدراسية الخاصة بك."
                  : "Apply these limited-time promotional codes during registration to secure your exclusive tuition discounts."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
              {activePromotionsQuery.data.map((promo) => (
                <div
                  key={promo.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 hover:scale-[1.01] relative overflow-hidden"
                >
                  {/* Decorative Subtle Corner Accent */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/40 rounded-bl-full -mr-6 -mt-6 -z-10" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-sm font-extrabold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 select-all tracking-wide">
                        {promo.code}
                      </span>
                      <span className="text-lg font-black text-indigo-600">
                        {promo.discountType === "percentage" ? `${promo.discountValue}% OFF` : `RM ${promo.discountValue} OFF`}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
                        {promo.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {promo.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-5 mt-auto flex items-center justify-between gap-3 border-t border-slate-100">
                    {promo.expiresAt ? (
                      <span className="text-[10px] text-rose-500 font-semibold bg-rose-50 px-2 py-0.5 rounded-full">
                        {language === "ms" ? "Hingga " : language === "ar" ? "ينتهي " : "Expires "} 
                        {new Date(promo.expiresAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                        {language === "ms" ? "Kemasukan Aktif" : language === "ar" ? "نشط حالياً" : "Active Intake"}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopyCode(promo.code)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer ${
                        copiedCode === promo.code
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 active:scale-95"
                      }`}
                    >
                      {copiedCode === promo.code 
                        ? (language === "ms" ? "Disalin!" : language === "ar" ? "تم النسخ!" : "Copied!") 
                        : (language === "ms" ? "Salin Kod" : language === "ar" ? "نسخ الرمز" : "Copy Code")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Start Here 3-Card Grid */}
        <section id="home-start-here-section" className="simple-section simple-home-panel simple-home-start-panel">
          <div className="simple-section-heading">
            <div>
              <p className="simple-eyebrow">{t("home.startHereEyebrow")}</p>
              <h2>{t("home.startHereTitle")}</h2>
            </div>
            <p>{t("home.startHereDesc", undefined, "Choose a clear next step.")}</p>
          </div>
          
          <div className="simple-task-grid">
            <a href="#course-pricing" className="simple-task-card">
              <div className="simple-task-card-media-wrap">
                {programmesMedia ? (
                  <img className="simple-task-media" src={programmesMedia.publicUrl} alt={programmesMedia.altText} loading="lazy" decoding="async" />
                ) : null}
                <span className="simple-task-card-tag">{t("home.pricingEyebrow")}</span>
              </div>
              <div className="simple-task-card-body">
                <div className="simple-task-card-header">
                  <div className="simple-task-icon-wrap">
                    <BookOpen size={20} />
                  </div>
                  <h3>{t("home.taskProgramsTitle")}</h3>
                </div>
                <p>{t("home.taskProgramsDesc")}</p>
                <div className="simple-task-card-footer">
                  <span>{t("common.viewDetails")}</span>
                  <ArrowRight size={16} className={`simple-task-arrow ${isRTL ? "rotate-180" : ""}`} />
                </div>
              </div>
            </a>

            <Link 
              href="/contact?reason=consultation" 
              className={`simple-task-card ${isRTL ? "text-right" : "text-left"}`}
            >
              <div className="simple-task-card-media-wrap">
                {contactMedia ? (
                  <img className="simple-task-media" src={contactMedia.publicUrl} alt={contactMedia.altText} loading="lazy" decoding="async" />
                ) : null}
                <span className="simple-task-card-tag">{t("home.admissionsTag")}</span>
              </div>
              <div className="simple-task-card-body">
                <div className="simple-task-card-header">
                  <div className="simple-task-icon-wrap">
                    <MessageCircle size={20} />
                  </div>
                  <h3>{t("home.taskConsultationTitle")}</h3>
                </div>
                <p>{t("home.taskConsultationDesc")}</p>
                <div className="simple-task-card-footer">
                  <span>{t("home.ctaBooking")}</span>
                  <ArrowRight size={16} className={`simple-task-arrow ${isRTL ? "rotate-180" : ""}`} />
                </div>
              </div>
            </Link>

            <Link href="/login" className="simple-task-card">
              <div className="simple-task-card-media-wrap">
                {accountMedia ? (
                  <img className="simple-task-media" src={accountMedia.publicUrl} alt={accountMedia.altText} loading="lazy" decoding="async" />
                ) : null}
                <span className="simple-task-card-tag">{t("login.eyebrow")}</span>
              </div>
              <div className="simple-task-card-body">
                <div className="simple-task-card-header">
                  <div className="simple-task-icon-wrap">
                    <UserRound size={20} />
                  </div>
                  <h3>{t("home.taskPortalTitle")}</h3>
                </div>
                <p>{t("home.taskPortalDesc")}</p>
                <div className="simple-task-card-footer">
                  <span>{t("nav.signIn")}</span>
                  <ArrowRight size={16} className={`simple-task-arrow ${isRTL ? "rotate-180" : ""}`} />
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Dynamic Section 2: Official 2026 Price List & Course Guide */}
        <OfficialPriceList2026 />

        {/* Dynamic Section 3: World-Class Campus Facilities */}
        <CampusFacilitiesShowcase />

        {/* Dynamic Section 4: 6-Step International Student Journey */}
        <StudentJourneyRoadmap />

        {/* Dynamic Section 5: Authentic Student Testimonials */}
        <VerifiedTestimonials />

        {/* Contact Banner at Pavilion Embassy */}
        <section id="home-contact-strip-section" className="simple-contact-strip simple-contact-strip--refined simple-contact-strip--geometry">
          <div>
            <p className="simple-eyebrow">{language === "ms" ? "Lawati Kami" : language === "ar" ? "تفضل بزيارتنا" : "Visit Bilingual Idol"}</p>
            <h2>{t("home.contactStripTitle")}</h2>
            <p>{t("home.contactStripSubtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="tel:+60367310449" className="simple-button simple-button-quiet">
              <Phone size={16} /> +60 3-6731 0449
            </a>
            <Link
              href="/contact?reason=campusTour"
              className="simple-button cursor-pointer"
            >
              {t("home.ctaBooking")} <ArrowRight size={17} className={isRTL ? "rotate-180" : ""} />
            </Link>
          </div>
        </section>

        {/* Modals */}
        <OnlinePlacementTestModal
          isOpen={isPlacementTestOpen}
          onClose={() => setIsPlacementTestOpen(false)}
        />
      </div>
    </PublicLayout>
  );
}
