import { ArrowLeft, ArrowUp, Menu, Phone, X, Gift } from "lucide-react";
import { BackgroundCircleField } from "@/components/BackgroundCircleField";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { SmartWhatsAppWidget } from "@/components/SmartWhatsAppWidget";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/translations";
import { PromotionalPopupModal, PromotionalFloatingBadge } from "@/components/PromotionalPopup";
import { OfficialRegistryModal } from "@/components/OfficialRegistryModal";
import { trpc } from "@/lib/trpc";

type FabId = "whatsapp" | "phone" | "promo" | "scrollTop";

interface FabItem {
  id: FabId;
  currentSlotIndex: number;
  isDisplaced: boolean;
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [promoOpen, setPromoOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [location] = useLocation();
  const { t, isRTL, language } = useLanguage();
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);

  const { data: settings, isLoading: isSettingsLoading } = trpc.content.siteSettings.useQuery();
  const { data: publicPromos, isLoading: isPromosLoading } = trpc.promotions.publicList.useQuery();

  const isPromoLoading = isSettingsLoading || isPromosLoading;

  let isPromoActive = settings?.promo_active === "true";
  let promoDiscount = settings?.promo_discount || "";
  let promoColor = settings?.promo_color || "red";

  if (!isPromoActive && publicPromos && publicPromos.length > 0) {
    const latestPromo = publicPromos[0];
    isPromoActive = true;
    promoDiscount = latestPromo.discountType === "percentage" ? `${latestPromo.discountValue}% OFF` : `RM ${latestPromo.discountValue} OFF`;
    promoColor = "blue";
  }

  const getPromoTheme = (color: string) => {
    switch (color) {
      case "blue":
        return {
          bg: "from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800",
          ping: "bg-blue-400",
          shadow: "shadow-[0_4px_14px_rgba(37,99,235,0.25)]",
        };
      case "green":
        return {
          bg: "from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800",
          ping: "bg-emerald-400",
          shadow: "shadow-[0_4px_14px_rgba(5,150,105,0.25)]",
        };
      case "amber":
        return {
          bg: "from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700",
          ping: "bg-amber-400",
          shadow: "shadow-[0_4px_14px_rgba(245,158,11,0.25)]",
        };
      case "purple":
        return {
          bg: "from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800",
          ping: "bg-purple-400",
          shadow: "shadow-[0_4px_14px_rgba(147,51,234,0.25)]",
        };
      case "slate":
        return {
          bg: "from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900",
          ping: "bg-slate-400",
          shadow: "shadow-[0_4px_14px_rgba(71,85,105,0.25)]",
        };
      case "red":
      default:
        return {
          bg: "from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700",
          ping: "bg-rose-400",
          shadow: "shadow-[0_4px_14px_rgba(244,63,94,0.25)]",
        };
    }
  };

  const promoTheme = getPromoTheme(promoColor);

  // Static Quick Action button list and states are simplified for permanent non-draggable layouts.

  useEffect(() => {
    const handleOpen = () => setIsRegistryOpen(true);
    window.addEventListener("open-registry-modal", handleOpen);
    return () => window.removeEventListener("open-registry-modal", handleOpen);
  }, []);

  const defaultNav = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Programmes", href: "/programs" },
    { label: "News", href: "/news" },
    { label: "Contact", href: "/contact" },
  ];

  const primaryNavigation = [
    { label: t("nav.home", undefined, "Home"), href: "/" },
    { label: t("nav.about", undefined, "About"), href: "/about" },
    { label: t("nav.programs", undefined, "Programmes"), href: "/programs" },
    { label: t("nav.news", undefined, "News"), href: "/news" },
    { label: t("nav.contact", undefined, "Contact"), href: "/contact" },
  ];

  useEffect(() => {
    const localizedMetadata: Record<Language, Record<string, { title: string; description: string }>> = {
      en: {
        "/": { title: "Bilingual Idol Language Centre | Kuala Lumpur", description: "Boutique language school at Pavilion Embassy Kuala Lumpur. General English, IELTS preparation, Summer camps & World languages." },
        "/programs": { title: "Academic Programmes | Bilingual Idol", description: "Explore accredited English and language programmes at Bilingual Idol Kuala Lumpur." },
        "/about": { title: "About Us | Bilingual Idol Language Centre", description: "Discover our educational approach, certified faculty and luxury Pavilion Embassy campus in Kuala Lumpur." },
        "/news": { title: "News & Announcements | Bilingual Idol", description: "Official updates, intake dates and campus notices from Bilingual Idol Language Centre." },
        "/contact": { title: "Contact Us & Campus Tour | Bilingual Idol", description: "Get in touch with admissions or visit our Pavilion Embassy campus in Kuala Lumpur." },
        "/enroll": { title: "Student Enrolment & Consultation | Bilingual Idol", description: "Apply online or book an academic consultation with Bilingual Idol Language Centre." },
        "/login": { title: "Student & Staff Portal | Bilingual Idol", description: "Access course schedules, attendance and learning resources." },
      },
      ms: {
        "/": { title: "Pusat Bahasa Bilingual Idol | Kuala Lumpur", description: "Pusat bahasa butik di Pavilion Embassy Kuala Lumpur. Bahasa Inggeris Umum, persediaan IELTS, Kem Musim Panas & Bahasa Dunia." },
        "/programs": { title: "Program Akademik | Pusat Bahasa Bilingual Idol", description: "Terokai program Bahasa Inggeris dan bahasa antarabangsa yang diiktiraf di Kuala Lumpur." },
        "/about": { title: "Mengenai Kami | Pusat Bahasa Bilingual Idol", description: "Ketahui pendekatan pembelajaran, tenaga pengajar bertauliah dan kampus eksklusif Pavilion Embassy kami." },
        "/news": { title: "Berita & Pengumuman | Bilingual Idol", description: "Kemas kini rasmi, tarikh pengambilan dan makluman terkini dari Pusat Bahasa Bilingual Idol." },
        "/contact": { title: "Hubungi Kami & Lawatan Kampus | Bilingual Idol", description: "Hubungi pasukan kemasukan atau lawati kampus kami di Pavilion Embassy Kuala Lumpur." },
        "/enroll": { title: "Pendaftaran & Perundingan Pelajar | Bilingual Idol", description: "Daftar dalam talian atau tempah sesi perundingan akademik bersama Pusat Bahasa Bilingual Idol." },
        "/login": { title: "Portal Pelajar & Kakitangan | Bilingual Idol", description: "Akses jadual kursus, kehadiran dan sumber pembelajaran." },
      },
      ar: {
        "/": { title: "مركز بايلينجوال آيدول للغات | كوالالمبور", description: "معهد تعليم لغات راقٍ في بافيليون إمباسي كوالالمبور. دورات لغة إنجليزية عامة، تحضير آيلتس، مخيمات صيفية ولغات عالمية." },
        "/programs": { title: "البرامج الأكاديمية | معهد بايلينجوال آيدول", description: "استكشف دورات اللغة الإنجليزية المعتمدة واللغات العالمية في كوالالمبور." },
        "/about": { title: "عن المعهد | مركز بايلينجوال آيدول للغات", description: "تعرف على منهجيتنا التعليمية، كادرنا التدريسي المعتمد وحرمنا الفاخر في بافيليون إمباسي." },
        "/news": { title: "الأخبار والإعلانات | بايلينجوال آيدول", description: "آخر الأخبار، مواعيد القبول والتسجيل وإشعارات مركز بايلينجوال آيدول للغات." },
        "/contact": { title: "اتصل بنا وجولة في المقر | بايلينجوال آيدول", description: "تواصل مع فريق القبول والتسجيل أو قم بزيارة حرمنا في بافيليون إمباسي كوالالمبور." },
        "/enroll": { title: "التسجيل والاستشارة الأكاديمية | بايلينجوال آيدول", description: "سجل إلكترونياً أو احجز موعد استشارة أكاديمية مع مركز بايلينجوال آيدول." },
        "/login": { title: "بوابة الطلاب والأساتذة | بايلينجوال آيدول", description: "سجل الدخول لعرض الجداول الدراسية وسجلات الحضور والموارد الأكاديمية." },
      },
    };

    const currentMetaMap = localizedMetadata[language] || localizedMetadata.en;
    const fallbackTitle = language === "ar" ? "تفاصيل البرنامج | بايلينجوال آيدول" : language === "ms" ? "Maklumat Program | Bilingual Idol" : "Programme details | Bilingual Idol";
    const fallbackDesc = language === "ar" ? "معلومات البرنامج من مركز بايلينجوال آيدول للغات." : language === "ms" ? "Maklumat program daripada Pusat Bahasa Bilingual Idol." : "Programme information from Bilingual Idol Language Centre.";
    
    const selected = currentMetaMap[location] ?? (location.startsWith("/programs/") ? { title: fallbackTitle, description: fallbackDesc } : currentMetaMap["/"]);
    
    document.title = selected.title;
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", selected.description);

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", selected.title);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement("meta");
      ogDesc.setAttribute("property", "og:description");
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute("content", selected.description);

    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement("meta");
      metaKeywords.setAttribute("name", "keywords");
      document.head.appendChild(metaKeywords);
    }
    const arabicKeywords = "معهد تعليم لغات كوالالمبور, دورات لغة إنجليزية ماليزيا, معهد بايلينجوال آيدول, دراسة آيلتس في كوالالمبور, بافيليون إمباسي, مخيمات صيفية لتعليم الإنجليزية, تأشيرة طالب إنجليزية ماليزيا, رسوم معهد اللغات ماليزيا 2026";
    const defaultKeywords = "Bilingual Idol, English Language Centre Kuala Lumpur, Pavilion Embassy, IELTS Preparation Malaysia, General English Course, Summer Camp KL";
    metaKeywords.setAttribute("content", language === "ar" ? arabicKeywords : defaultKeywords);
  }, [location, language]);

  const scrollAnimRef = useRef<number | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const getScrollY = () =>
      Math.max(
        window.scrollY || 0,
        window.pageYOffset || 0,
        document.documentElement?.scrollTop || 0,
        document.body?.scrollTop || 0
      );

    const handleScroll = () => {
      const currentScrollY = getScrollY();
      setShowScrollTop(currentScrollY > 180);

      // Keep header always visible and locked in place
      setHeaderVisible(true);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll);
      if (scrollAnimRef.current !== null) {
        cancelAnimationFrame(scrollAnimRef.current);
      }
    };
  }, []);

  const scrollToTop = () => {
    if (scrollAnimRef.current !== null) {
      cancelAnimationFrame(scrollAnimRef.current);
    }

    const html = document.documentElement;
    const body = document.body;
    const mainContent = document.getElementById("main-content");
    const root = document.getElementById("root");
    const shell = document.querySelector(".simple-public-shell") as HTMLElement | null;

    const getScrollTop = () =>
      Math.max(
        window.scrollY || 0,
        window.pageYOffset || 0,
        html?.scrollTop || 0,
        body?.scrollTop || 0,
        mainContent?.scrollTop || 0,
        root?.scrollTop || 0,
        shell?.scrollTop || 0
      );

    const startY = getScrollTop();
    if (startY <= 0) return;

    // Accessibility and viewport checks: instant reset if user prefers reduced motion or on mobile screens (<768px/user-agent)
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const isMobileDevice =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 ||
        (typeof navigator !== "undefined" &&
          /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)));

    if (prefersReducedMotion || isMobileDevice) {
      window.scrollTo(0, 0);
      if (html) html.scrollTop = 0;
      if (body) body.scrollTop = 0;
      if (mainContent) mainContent.scrollTop = 0;
      if (root) root.scrollTop = 0;
      if (shell) shell.scrollTop = 0;
      return;
    }

    setIsScrolling(true);

    const originalHtmlBehavior = html ? html.style.scrollBehavior : "";
    const originalBodyBehavior = body ? body.style.scrollBehavior : "";
    if (html) html.style.scrollBehavior = "auto";
    if (body) body.style.scrollBehavior = "auto";

    const startTime = performance.now();
    // Responsive duration: fast 260ms for modest scrolls, up to 480ms for very deep pages
    const duration = Math.min(480, Math.max(260, Math.sqrt(startY) * 9.5));

    // Quintic ease-out: swift initial release, silky deceleration
    const easeOutQuint = (x: number) => 1 - Math.pow(1 - x, 5);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutQuint(progress);
      const currentY = Math.round(startY * (1 - eased));

      window.scrollTo(0, currentY);
      if (html) html.scrollTop = currentY;
      if (body) body.scrollTop = currentY;
      if (mainContent) mainContent.scrollTop = currentY;
      if (root) root.scrollTop = currentY;
      if (shell) shell.scrollTop = currentY;

      if (progress < 1) {
        scrollAnimRef.current = requestAnimationFrame(step);
      } else {
        // Guarantee absolute 0 across all possible scrolling elements
        window.scrollTo(0, 0);
        if (html) {
          html.scrollTop = 0;
          html.style.scrollBehavior = originalHtmlBehavior;
        }
        if (body) {
          body.scrollTop = 0;
          body.style.scrollBehavior = originalBodyBehavior;
        }
        if (mainContent) mainContent.scrollTop = 0;
        if (root) root.scrollTop = 0;
        if (shell) shell.scrollTop = 0;

        scrollAnimRef.current = null;
        setIsScrolling(false);
      }
    };

    scrollAnimRef.current = requestAnimationFrame(step);
  };

  const close = () => setOpen(false);

  return (
    <div className={`simple-public-shell ${isRTL ? "is-rtl" : ""}`}>
      <BackgroundCircleField />
      <a className="simple-skip-link" href="#main-content">
        {t("nav.skipToContent")}
      </a>
      <header className={`simple-public-header simple-public-header--refined transition-all duration-300 ${headerVisible ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0 pointer-events-none"}`}>
        <div className="simple-public-bar">
          <Link href="/" className="simple-brand" aria-label={t("footer.centreName")} onClick={close}>
            <span aria-hidden="true">BI</span>
            <strong>
              <bdi dir="ltr">Bilingual Idol</bdi><small>{t("footer.brandSubtitle")}</small>
            </strong>
          </Link>
          <nav className="simple-public-nav" aria-label={language === "ar" ? "التنقل الرئيسي" : language === "ms" ? "Navigasi utama" : "Primary navigation"}>
            {primaryNavigation.map((item) => (
              <Link key={item.href} href={item.href} aria-current={location === item.href ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="simple-public-actions flex items-center gap-2">
            <LanguageSwitcher variant="dropdown" />
            <PWAInstallButton variant="header" />
            <Link href="/login" className="simple-button simple-button-quiet">
              {t("nav.signIn")}
            </Link>
            <button
              onClick={() => setIsRegistryOpen(true)}
              className="simple-button cursor-pointer"
            >
              {t("nav.makeEnquiry", undefined, "Make an enquiry")}
            </button>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <PWAInstallButton variant="header" className="!px-2.5 !py-1 text-[11px]" />
            <button
              className="simple-menu-button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="simple-mobile-nav" aria-label="Mobile navigation">
            <div className="pb-3 mb-2 border-b border-[#d9e2f1] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#566983] px-1">{t("nav.switchLanguage")}</span>
              <LanguageSwitcher variant="dropdown" />
            </div>
            {primaryNavigation.map((item) => (
              <Link key={item.href} href={item.href} onClick={close} aria-current={location === item.href ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
            <div className="py-2">
              <PWAInstallButton variant="card" />
            </div>
            <Link href="/login" className="simple-button simple-button-quiet mt-2" onClick={close}>
              {t("nav.signIn")}
            </Link>
            <button
              onClick={() => {
                close();
                setIsRegistryOpen(true);
              }}
              className="simple-button cursor-pointer text-center"
            >
              {t("nav.makeEnquiry", undefined, "Make an enquiry")}
            </button>
          </nav>
        )}
      </header>

      <OfflineIndicator />

      <main id="main-content" className="simple-public-main pb-24 md:pb-0" tabIndex={-1}>
        {children}
      </main>

      <footer className="simple-public-footer">
        <div>
          <strong>{t("footer.centreName")}</strong>
          <span>{t("footer.location")}</span>
        </div>
        <nav aria-label={language === "ar" ? "تنقل التذييل" : language === "ms" ? "Navigasi bahagian bawah" : "Footer navigation"}>
          <Link href="/news">{t("nav.news")}</Link>
          <Link href="/contact">{t("nav.contact")}</Link>
          <a href="mailto:info@bilingualidol.edu.my">{t("common.email")}</a>
        </nav>
      </footer>

      {/* Promotional Campaign Modal Popup */}
      <PromotionalPopupModal isOpen={promoOpen} setIsOpen={setPromoOpen} />

      {/* Desktop Version: Static, Cohesive Vertical Capsule Dock Centered Vertically (for screens >= 768px) */}
      <div
        className="desktop-quick-actions-bar hidden md:flex flex-col items-center bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-[#cbdcfc]/45 dark:border-slate-700/50 shadow-[0_12px_40px_rgba(23,63,173,0.08)] px-2 py-3.5 rounded-[32px] gap-4 z-[999]"
        style={{
          position: "fixed",
          top: "50%",
          transform: "translateY(-50%)",
          right: isRTL ? "auto" : "1.5rem",
          left: isRTL ? "1.5rem" : "auto",
          width: "64px",
          transition: "right 0.3s ease, left 0.3s ease",
        }}
        aria-label={language === "ar" ? "إجراءات سريعة" : language === "ms" ? "Tindakan pantas" : "Quick actions"}
      >
        {/* Button 1 (Topmost): Promotions / Gift Button with dynamic glow and active discount badge */}
        <div className="relative group">
          <button
            type="button"
            className={`bilc-quick-btn w-12 h-12 rounded-full bg-gradient-to-br ${promoTheme.bg} text-white flex items-center justify-center ${promoTheme.shadow} hover:scale-[1.08] active:scale-95 transition-all duration-300 border border-white/15 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#173fad] relative`}
            onClick={() => setPromoOpen(true)}
            aria-label={language === "ar" ? "عرض العروض الترويجية النشطة" : language === "ms" ? "Papar Promosi Aktif" : "Show Active Promotions"}
          >
            <span className="relative flex h-5 w-5 items-center justify-center mx-auto">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${promoTheme.ping} opacity-75`}></span>
              <Gift size={22} className="relative text-white group-hover:rotate-12 transition-transform duration-300" aria-hidden="true" />
            </span>
            {promoDiscount && (
              <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-slate-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-white shadow-xs select-none tracking-tight whitespace-nowrap">
                {promoDiscount}
              </span>
            )}
          </button>
          {/* Tooltip */}
          <div
            className={`hidden md:block absolute top-1/2 -translate-y-1/2 bg-[#10253e] text-white text-[11px] px-2.5 py-1.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap font-medium tracking-wide border border-white/10 z-[1000] flex items-center ${
              isRTL
                ? "left-[60px] -translate-x-2 group-hover:translate-x-0 group-focus-within:translate-x-0 after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:-left-[4px] after:border-y-[4px] after:border-y-transparent after:border-r-[4px] after:border-r-[#10253e]"
                : "right-[60px] translate-x-2 group-hover:translate-x-0 group-focus-within:translate-x-0 after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:-right-[4px] after:border-y-[4px] after:border-y-transparent after:border-l-[4px] after:border-l-[#10253e]"
            }`}
          >
            {language === "ar" ? "العروض النشطة" : language === "ms" ? "Promosi Aktif" : "Active Promotions"}
          </div>
        </div>

        {/* Button 2: Call/Phone Link */}
        <div className="relative group">
          <a
            href="tel:+60367310449"
            className="bilc-quick-btn w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white flex items-center justify-center shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:scale-[1.08] active:scale-95 transition-all duration-300 border border-white/10 focus-visible:ring-2 focus-visible:ring-[#173fad]"
            aria-label={`${t("common.call")} Bilingual Idol: +60 3 6731 0449`}
          >
            <Phone size={20} className="group-hover:rotate-12 transition-transform duration-300" aria-hidden="true" />
          </a>
          {/* Tooltip */}
          <div
            className={`hidden md:block absolute top-1/2 -translate-y-1/2 bg-[#10253e] text-white text-[11px] px-2.5 py-1.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap font-medium tracking-wide border border-white/10 z-[1000] flex items-center ${
              isRTL
                ? "left-[60px] -translate-x-2 group-hover:translate-x-0 group-focus-within:translate-x-0 after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:-left-[4px] after:border-y-[4px] after:border-y-transparent after:border-r-[4px] after:border-r-[#10253e]"
                : "right-[60px] translate-x-2 group-hover:translate-x-0 group-focus-within:translate-x-0 after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:-right-[4px] after:border-y-[4px] after:border-y-transparent after:border-l-[4px] after:border-l-[#10253e]"
            }`}
          >
            {language === "ar" ? "اتصل بقسم القبول" : language === "ms" ? "Hubungi Kemasukan" : "Call Admissions"}
          </div>
        </div>

        {/* Button 3: Smart WhatsApp Widget */}
        <div className="w-12 h-12 flex items-center justify-center shrink-0">
          <SmartWhatsAppWidget key="whatsapp-widget" className="w-12 h-12" />
        </div>
      </div>

      {/* Desktop Version: Separate Fixed Scroll-to-Top Button */}
      <div
        className="desktop-scroll-top-wrap hidden md:block transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          position: "fixed",
          bottom: "2rem",
          right: isRTL ? "auto" : "2rem",
          left: isRTL ? "2rem" : "auto",
          zIndex: 998,
          pointerEvents: showScrollTop ? "auto" : "none",
          opacity: showScrollTop ? 1 : 0,
          transform: showScrollTop ? "scale(1) translateY(0)" : "scale(0.8) translateY(12px)",
        }}
      >
        <div className="relative group">
          <button
            type="button"
            className="bilc-scroll-top-btn bilc-quick-btn w-12 h-12 rounded-full bg-[#173fad] hover:bg-[#2563eb] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(23,63,173,0.22)] hover:scale-[1.08] active:scale-95 transition-all duration-300 border border-[#173fad]/20 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#173fad]"
            onClick={scrollToTop}
            aria-label={language === "ar" ? "الرجوع إلى أعلى الصفحة" : language === "ms" ? "Tatal ke atas" : "Scroll to top of page"}
          >
            <ArrowUp size={20} className="group-hover:-translate-y-0.5 transition-transform duration-300" aria-hidden="true" />
          </button>
          {/* Tooltip */}
          <div
            className={`hidden md:block absolute top-1/2 -translate-y-1/2 bg-[#10253e] text-white text-[11px] px-2.5 py-1.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap font-medium tracking-wide border border-white/10 z-[1000] flex items-center ${
              isRTL
                ? "left-[60px] -translate-x-2 group-hover:translate-x-0 group-focus-within:translate-x-0 after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:-left-[4px] after:border-y-[4px] after:border-y-transparent after:border-r-[4px] after:border-r-[#10253e]"
                : "right-[60px] translate-x-2 group-hover:translate-x-0 group-focus-within:translate-x-0 after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:-right-[4px] after:border-y-[4px] after:border-y-transparent after:border-l-[4px] after:border-l-[#10253e]"
            }`}
          >
            {language === "ar" ? "الرجوع للأعلى" : language === "ms" ? "Kembali ke Atas" : "Back to Top"}
          </div>
        </div>
      </div>

      {/* Mobile Version: Bottom Horizontal Floating Panel Capsule (for screens < 768px) */}
      <div
        className={`mobile-quick-actions-bar md:hidden flex items-center justify-between bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-[#cbdcfc]/45 dark:border-slate-700/50 shadow-[0_12px_40px_rgba(23,63,173,0.08)] rounded-full z-[999] ${isRTL ? "flex-row-reverse" : "flex-row"}`}
        style={{
          position: "fixed",
          bottom: "calc(1.25rem + env(safe-area-inset-bottom))",
          left: "0",
          right: "0",
          marginLeft: "auto",
          marginRight: "auto",
          width: showScrollTop ? "264px" : "200px",
          paddingLeft: "14px",
          paddingRight: "14px",
          paddingTop: "0.6rem",
          paddingBottom: "0.6rem",
          transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1), padding 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        aria-label={language === "ar" ? "إجراءات سريعة للجوال" : language === "ms" ? "Tindakan pantas mudah alih" : "Mobile quick actions"}
      >
        {/* Button 1: Promotions / Gift Button with dynamic glow and active discount badge */}
        <button
          type="button"
          className={`bilc-quick-btn w-11 h-11 rounded-full bg-gradient-to-br ${promoTheme.bg} active:scale-95 text-white flex items-center justify-center ${promoTheme.shadow} border border-white/15 cursor-pointer relative shrink-0`}
          onClick={() => setPromoOpen(true)}
          aria-label={language === "ar" ? "عرض العروض الترويجية النشطة" : language === "ms" ? "Papar Promosi Aktif" : "Show Active Promotions"}
        >
          <span className="relative flex h-5 w-5 items-center justify-center">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${promoTheme.ping} opacity-75`}></span>
            <Gift size={18} className="relative text-white" aria-hidden="true" />
          </span>
          {promoDiscount && (
            <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-slate-900 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border border-white shadow-xs select-none tracking-tight whitespace-nowrap">
              {promoDiscount}
            </span>
          )}
        </button>

        {/* Button 2: Call/Phone Link */}
        <a
          href="tel:+60367310449"
          className="bilc-quick-btn w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 active:scale-95 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.25)] border border-white/10 shrink-0"
          aria-label={`${t("common.call")} Bilingual Idol: +60 3 6731 0449`}
        >
          <Phone size={18} aria-hidden="true" />
        </a>

        {/* Button 3: Smart WhatsApp Widget */}
        <div className="w-11 h-11 flex items-center justify-center shrink-0">
          <SmartWhatsAppWidget key="whatsapp-widget-mobile" className="w-11 h-11" />
        </div>

        {/* Button 4 (Appears on scroll on the right side of the panel): Scroll-to-Top Button */}
        <div
          className="transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center shrink-0"
          style={{
            width: showScrollTop ? "44px" : "0px",
            opacity: showScrollTop ? 1 : 0,
            transform: showScrollTop ? "scale(1)" : "scale(0.8)",
            pointerEvents: showScrollTop ? "auto" : "none",
            overflow: "visible",
          }}
        >
          <button
            type="button"
            className="bilc-scroll-top-btn bilc-quick-btn w-11 h-11 rounded-full bg-[#173fad] hover:bg-[#2563eb] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(23,63,173,0.22)] border border-[#173fad]/20 cursor-pointer active:scale-95"
            onClick={scrollToTop}
            aria-label={language === "ar" ? "الرجوع إلى أعلى الصفحة" : language === "ms" ? "Tatal ke atas" : "Scroll to top"}
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>

      {/* Official Registry Modal */}
      <OfficialRegistryModal isOpen={isRegistryOpen} onClose={() => setIsRegistryOpen(false)} />
    </div>
  );
}
