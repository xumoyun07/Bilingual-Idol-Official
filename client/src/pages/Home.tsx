import { ArrowRight, Award, BookOpen, Building2, Calendar, Globe, GraduationCap, MapPin, MessageCircle, Phone, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { OfficialPriceList2026 } from "@/components/OfficialPriceList2026";
import { CampusFacilitiesShowcase } from "@/components/CampusFacilitiesShowcase";
import { StudentJourneyRoadmap } from "@/components/StudentJourneyRoadmap";
import { VerifiedTestimonials } from "@/components/VerifiedTestimonials";
import { FindYourCourseWidget } from "@/components/FindYourCourseWidget";
import { OnlinePlacementTestModal } from "@/components/OnlinePlacementTestModal";
import { BookingSystemModal } from "@/components/BookingSystemModal";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
  const [isPlacementTestOpen, setIsPlacementTestOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingService, setBookingService] = useState<string>("placement_test");
  const { t, isRTL, language } = useLanguage();

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

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback gracefully if browser has aggressive battery saver or data-saver policies
      });
    }
  }, [heroVideoUrl]);

  const handleOpenBooking = (service?: string) => {
    if (service) setBookingService(service);
    setIsBookingOpen(true);
  };

  return (
    <PublicLayout>
      <div className={`simple-public-page home-page ${isRTL ? "is-rtl" : ""}`}>
        {/* Luxury Hero Section with Seamless Loop Video */}
        <section className="simple-home-intro simple-home-intro-media simple-home-intro-offset simple-home-intro--refined simple-home-intro--desktop-geometry simple-home-intro--mobile-480 simple-home-intro--desktop-580">
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
            <source src="/media/hero_video.webm" type="video/webm" />
            <source src={heroVideoUrl} type="video/mp4" />
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
            
            <div className="simple-actions-row">
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
              <button
                type="button"
                onClick={() => handleOpenBooking("campus_tour")}
                className="simple-button simple-button-quiet"
              >
                <Calendar size={17} /> {t("home.ctaBooking")}
              </button>
            </div>
          </div>
        </section>

        {/* Official Trust Pillars Bar */}
        <div className="bilc-trust-strip">
          <div className="bilc-trust-item">
            <GraduationCap size={20} />
            <div>
              <strong>{language === "ms" ? "Kelulusan KPT" : language === "ar" ? "اعتماد رسمي" : "MOHE Approved"}</strong>
              <span>License WZ10104</span>
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
              <strong>{language === "ms" ? "6 Bahasa Utama" : language === "ar" ? "6 لغات عالمية" : "6 World Languages"}</strong>
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

        {/* Start Here 3-Card Grid */}
        <section className="simple-section simple-home-panel simple-home-start-panel">
          <div className="simple-section-heading">
            <div>
              <p className="simple-eyebrow">{t("home.startHereEyebrow")}</p>
              <h2>{t("home.startHereTitle")}</h2>
            </div>
            <p>{t("home.startHereDesc")}</p>
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

            <button 
              type="button" 
              onClick={() => handleOpenBooking("consultation")} 
              className={`simple-task-card ${isRTL ? "text-right" : "text-left"}`}
              style={{ background: "none", border: "none", padding: 0 }}
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
            </button>

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
        <section className="simple-contact-strip simple-contact-strip--refined simple-contact-strip--geometry">
          <div>
            <p className="simple-eyebrow">{language === "ms" ? "Lawati Kami" : language === "ar" ? "تفضل بزيارتنا" : "Visit Bilingual Idol"}</p>
            <h2>{t("home.contactStripTitle")}</h2>
            <p>{t("home.contactStripSubtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="tel:+60367310449" className="simple-button simple-button-quiet">
              <Phone size={16} /> +60 3-6731 0449
            </a>
            <button
              type="button"
              onClick={() => handleOpenBooking("campus_tour")}
              className="simple-button"
            >
              {t("home.ctaBooking")} <ArrowRight size={17} className={isRTL ? "rotate-180" : ""} />
            </button>
          </div>
        </section>

        {/* Modals */}
        <OnlinePlacementTestModal
          isOpen={isPlacementTestOpen}
          onClose={() => setIsPlacementTestOpen(false)}
        />

        <BookingSystemModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          initialService={bookingService}
        />
      </div>
    </PublicLayout>
  );
}
