import { ArrowUp, Menu, Phone, X } from "lucide-react";
import { BackgroundCircleField } from "@/components/BackgroundCircleField";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { SmartWhatsAppWidget } from "@/components/SmartWhatsAppWidget";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/translations";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [location] = useLocation();
  const { t, isRTL, language } = useLanguage();

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

  useEffect(() => {
    const getScrollY = () =>
      Math.max(
        window.scrollY || 0,
        window.pageYOffset || 0,
        document.documentElement?.scrollTop || 0,
        document.body?.scrollTop || 0
      );

    const handleScroll = () => {
      setShowScrollTop(getScrollY() > 180);
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

    // Accessibility check: instant reset if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
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
      <header className="simple-public-header simple-public-header--refined">
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
            <Link href="/enroll" className="simple-button">
              {t("nav.makeEnquiry", undefined, "Make an enquiry")}
            </Link>
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
            <Link href="/login" onClick={close}>
              {t("nav.signIn")}
            </Link>
            <Link href="/enroll" className="simple-button" onClick={close}>
              {t("nav.makeEnquiry", undefined, "Make an enquiry")}
            </Link>
          </nav>
        )}
      </header>

      <OfflineIndicator />

      <main id="main-content" className="simple-public-main" tabIndex={-1}>
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

      {/* Floating Actions Dock */}
      <div
        className={`floating-actions-dock ${isRTL ? "is-rtl" : ""}`}
        aria-label={language === "ar" ? "إجراءات سريعة" : language === "ms" ? "Tindakan pantas" : "Quick actions"}
      >
        <a
          href="tel:+60367310449"
          className="floating-call-button"
          aria-label={`${t("common.call")} Bilingual Idol: +60 3 6731 0449`}
          title={`${t("common.call")} Bilingual Idol: +60 3 6731 0449`}
        >
          <Phone size={22} className="floating-call-icon" aria-hidden="true" />
          <span className="floating-call-ping" aria-hidden="true" />
        </a>

        {/* Smart Multi-Topic WhatsApp Concierge */}
        <SmartWhatsAppWidget />

        <button
          type="button"
          id="floating-scroll-top"
          className={`floating-scroll-top-button ${showScrollTop ? "is-visible" : ""} ${isScrolling ? "is-scrolling" : ""}`}
          onClick={scrollToTop}
          aria-label={language === "ar" ? "الرجوع إلى أعلى الصفحة" : language === "ms" ? "Tatal ke atas" : "Scroll to top of page"}
          title={language === "ar" ? "إلى الأعلى" : language === "ms" ? "Ke atas" : "Scroll to top"}
          aria-hidden={!showScrollTop}
          tabIndex={showScrollTop ? 0 : -1}
        >
          <ArrowUp size={22} className="floating-scroll-top-icon" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
