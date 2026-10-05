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

  // Persistent drag-and-drop state for the vertical side capsule buttons (desktop)
  const [order, setOrder] = useState<FabId[]>(() => {
    const saved = localStorage.getItem("bilc_buttons_order_v3");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as FabId[];
        const DEFAULT_ORDER: FabId[] = ["promo", "phone", "whatsapp"];
        if (Array.isArray(parsed) && parsed.every(k => DEFAULT_ORDER.includes(k))) {
          const missing = DEFAULT_ORDER.filter(k => !parsed.includes(k));
          return [...parsed, ...missing];
        }
      } catch (e) {
        // ignore
      }
    }
    return ["promo", "phone", "whatsapp"];
  });

  const [draggedKey, setDraggedKey] = useState<FabId | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const [isWaOpen, setIsWaOpen] = useState(false);
  const showBackButton = false;

  const draggedKeyRef = useRef<FabId | null>(null);
  const dragStartYRef = useRef<number>(0);
  const dragOffsetYRef = useRef<number>(0);
  const draggedTargetRef = useRef<HTMLElement | null>(null);
  const draggedPointerIdRef = useRef<number | null>(null);
  const orderRef = useRef<FabId[]>(order);
  const hasDraggedRef = useRef<boolean>(false);

  // Keep order ref in sync
  useEffect(() => {
    orderRef.current = order;
    localStorage.setItem("bilc_buttons_order_v3", JSON.stringify(order));
  }, [order]);



  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Pointer event handlers
  const handlePointerDown = (id: FabId, e: React.PointerEvent) => {
    if (e.button !== 0) return; // Left click only
    const target = e.currentTarget as HTMLElement;

    draggedKeyRef.current = id;
    dragStartYRef.current = e.clientY;
    dragOffsetYRef.current = 0;
    draggedTargetRef.current = target;
    draggedPointerIdRef.current = e.pointerId;
    hasDraggedRef.current = false;

    setDraggedKey(id);
    setDragOffsetY(0);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggedKeyRef.current === null) return;
    const id = draggedKeyRef.current;
    const deltaY = e.clientY - dragStartYRef.current;
    dragOffsetYRef.current = deltaY;

    if (Math.abs(deltaY) > 5) {
      if (!hasDraggedRef.current) {
        hasDraggedRef.current = true;
        if (draggedTargetRef.current && draggedPointerIdRef.current !== null) {
          try {
            draggedTargetRef.current.setPointerCapture(draggedPointerIdRef.current);
          } catch (err) {
            // ignore
          }
        }
      }
    }

    setDragOffsetY(deltaY);

    // List of currently visible capsule buttons in order
    const currentVisible = orderRef.current.filter(k => k !== "scrollTop");
    const draggedIdx = currentVisible.indexOf(id);
    if (draggedIdx === -1) return;

    // Determine target slot by rounding delta Y with 60px slot size
    const deltaSlot = -Math.round(deltaY / 60);
    const targetIdx = draggedIdx + deltaSlot;

    if (targetIdx >= 0 && targetIdx < currentVisible.length && targetIdx !== draggedIdx) {
      const targetKey = currentVisible[targetIdx];
      const newOrder = [...orderRef.current];
      const fullDraggedIdx = newOrder.indexOf(id);
      const fullTargetIdx = newOrder.indexOf(targetKey);

      if (fullDraggedIdx !== -1 && fullTargetIdx !== -1) {
        newOrder[fullDraggedIdx] = targetKey;
        newOrder[fullTargetIdx] = id;
        setOrder(newOrder);

        // Adjust starting coordinates to maintain smooth tracking without jumps
        const actualDeltaSlot = targetIdx - draggedIdx;
        dragStartYRef.current -= actualDeltaSlot * 60;
        dragOffsetYRef.current = e.clientY - dragStartYRef.current;
        setDragOffsetY(dragOffsetYRef.current);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggedKeyRef.current === null) return;
    if (draggedTargetRef.current && draggedPointerIdRef.current !== null) {
      try {
        draggedTargetRef.current.releasePointerCapture(draggedPointerIdRef.current);
      } catch (err) {
        // ignore
      }
    }
    draggedKeyRef.current = null;
    draggedTargetRef.current = null;
    draggedPointerIdRef.current = null;
    setDraggedKey(null);
    setDragOffsetY(0);
  };

  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    action();
  };

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

      {/* Desktop Version: Premium Draggable Cohesive Vertical Capsule Dock (for screens >= 768px) */}
      <div
        className="desktop-quick-actions-bar hidden md:flex flex-col items-center bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-[#cbdcfc]/45 dark:border-slate-700/50 shadow-[0_12px_40px_rgba(23,63,173,0.08)] px-2 rounded-[32px] z-[999]"
        style={{
          position: "fixed",
          top: "50%",
          transform: "translateY(-50%)",
          right: isRTL ? "auto" : "1.5rem",
          left: isRTL ? "1.5rem" : "auto",
          width: "64px",
          height: showBackButton ? "264px" : "200px",
          transition: "height 0.3s cubic-bezier(0.16, 1, 0.3, 1), right 0.3s ease, left 0.3s ease",
          paddingTop: "12px",
          paddingBottom: "12px",
        }}
        aria-label={language === "ar" ? "إجراءات سريعة" : language === "ms" ? "Tindakan pantas" : "Quick actions"}
      >
        <div className="relative w-full h-full pointer-events-none">
          {/* Render Draggable Visible Buttons */}
          {order.map((id, itemIdx) => {
            const isDragging = id === draggedKey;
            const slotIndex = showBackButton ? itemIdx + 1 : itemIdx;
            const baseY = -slotIndex * 60;
            const translateY = isDragging ? baseY + dragOffsetY : baseY;

            // Compute lateral displacement for other buttons
            let translateX = 0;
            if (draggedKey !== null && id !== draggedKey) {
              const draggedBaseIdx = order.indexOf(draggedKey);
              const draggedSlotIdx = showBackButton ? draggedBaseIdx + 1 : draggedBaseIdx;
              const draggedBaseY = -draggedSlotIdx * 60;
              const draggedCurrentY = draggedBaseY + dragOffsetY;
              const currentY = baseY;
              const distY = Math.abs(draggedCurrentY - currentY);

              if (distY < 52) {
                translateX = isRTL ? 52 : -52;
              }
            }

            return (
              <div
                key={id}
                onPointerDown={(e) => handlePointerDown(id, e)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "50%",
                  marginLeft: "-24px",
                  transform: `translateY(${translateY}px) translateX(${translateX}px)`,
                  transition: isDragging || prefersReducedMotion
                    ? "none"
                    : "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                  touchAction: "none",
                  zIndex: isDragging ? 100 : 10,
                  pointerEvents: "auto",
                }}
              >
                {/* Button Content based on ID */}
                {id === "promo" && (
                  <div className="relative group">
                    <button
                      type="button"
                      className={`bilc-quick-btn w-12 h-12 rounded-full bg-gradient-to-br ${promoTheme.bg} text-white flex items-center justify-center ${promoTheme.shadow} hover:scale-[1.08] active:scale-95 transition-all duration-300 border border-white/15 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#173fad] relative`}
                      onClick={(e) => handleButtonClick(e, () => setPromoOpen(true))}
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
                    {!isDragging && (
                      <div
                        className={`hidden md:block absolute top-1/2 -translate-y-1/2 bg-[#10253e] text-white text-[11px] px-2.5 py-1.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap font-medium tracking-wide border border-white/10 z-[1000] flex items-center ${
                          isRTL
                            ? "left-[60px] -translate-x-2 group-hover:translate-x-0 group-focus-within:translate-x-0 after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:-left-[4px] after:border-y-[4px] after:border-y-transparent after:border-r-[4px] after:border-r-[#10253e]"
                            : "right-[60px] translate-x-2 group-hover:translate-x-0 group-focus-within:translate-x-0 after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:-right-[4px] after:border-y-[4px] after:border-y-transparent after:border-l-[4px] after:border-l-[#10253e]"
                        }`}
                      >
                        {language === "ar" ? "العروض النشطة" : language === "ms" ? "Promosi Aktif" : "Active Promotions"}
                      </div>
                    )}
                  </div>
                )}

                {id === "phone" && (
                  <div className="relative group">
                    <a
                      href="tel:+60367310449"
                      onClick={(e) => {
                        if (hasDraggedRef.current) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      className="bilc-quick-btn w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white flex items-center justify-center shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:scale-[1.08] active:scale-95 transition-all duration-300 border border-white/10 focus-visible:ring-2 focus-visible:ring-[#173fad]"
                      aria-label={`${t("common.call")} Bilingual Idol: +60 3 6731 0449`}
                    >
                      <Phone size={20} className="group-hover:rotate-12 transition-transform duration-300" aria-hidden="true" />
                    </a>
                    {/* Tooltip */}
                    {!isDragging && (
                      <div
                        className={`hidden md:block absolute top-1/2 -translate-y-1/2 bg-[#10253e] text-white text-[11px] px-2.5 py-1.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap font-medium tracking-wide border border-white/10 z-[1000] flex items-center ${
                          isRTL
                            ? "left-[60px] -translate-x-2 group-hover:translate-x-0 group-focus-within:translate-x-0 after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:-left-[4px] after:border-y-[4px] after:border-y-transparent after:border-r-[4px] after:border-r-[#10253e]"
                            : "right-[60px] translate-x-2 group-hover:translate-x-0 group-focus-within:translate-x-0 after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:-right-[4px] after:border-y-[4px] after:border-y-transparent after:border-l-[4px] after:border-l-[#10253e]"
                        }`}
                      >
                        {language === "ar" ? "اتصل بقسم القبول" : language === "ms" ? "Hubungi Kemasukan" : "Call Admissions"}
                      </div>
                    )}
                  </div>
                )}

                {id === "whatsapp" && (
                  <div className="relative group">
                    <button
                      type="button"
                      className={`bilc-wa-trigger-btn w-12 h-12 rounded-full bg-gradient-to-br from-[#25d366] to-[#128c7e] hover:from-[#20ba5a] hover:to-[#0e7064] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(37,211,102,0.3)] hover:scale-[1.08] active:scale-95 transition-all duration-300 border border-white/10 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#10253e] focus-visible:ring-offset-2 focus-visible:outline-none ${isWaOpen ? "is-open" : ""}`}
                      onClick={(e) => handleButtonClick(e, () => setIsWaOpen(!isWaOpen))}
                      aria-label={language === "ar" ? "تواصل معنا عبر واتساب" : language === "ms" ? "Hubungi kami melalui WhatsApp" : "Chat with Bilingual Idol on WhatsApp"}
                    >
                      <span className="bilc-wa-glow-halo" aria-hidden="true" />
                      {isWaOpen ? (
                        <X size={20} className="bilc-wa-icon" aria-hidden="true" />
                      ) : (
                        <WhatsAppIcon size={24} />
                      )}
                    </button>
                    {/* Tooltip */}
                    {!isDragging && (
                      <div
                        className={`hidden md:block absolute top-1/2 -translate-y-1/2 bg-[#10253e] text-white text-[11px] px-2.5 py-1.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap font-medium tracking-wide border border-white/10 z-[1000] flex items-center ${
                          isRTL
                            ? "left-[60px] -translate-x-2 group-hover:translate-x-0 group-focus-within:translate-x-0 after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:-left-[4px] after:border-y-[4px] after:border-y-transparent after:border-r-[4px] after:border-r-[#10253e]"
                            : "right-[60px] translate-x-2 group-hover:translate-x-0 group-focus-within:translate-x-0 after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:-right-[4px] after:border-y-[4px] after:border-y-transparent after:border-l-[4px] after:border-l-[#10253e]"
                        }`}
                      >
                        {language === "ar" ? "واتساب قسم القبول" : language === "ms" ? "WhatsApp Kemasukan" : "WhatsApp Admissions"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
          width: showScrollTop ? "244px" : "188px",
          paddingLeft: "14px",
          paddingRight: "14px",
          paddingTop: "0.6rem",
          paddingBottom: "0.6rem",
          transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1), padding 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        aria-label={language === "ar" ? "إجراءات سريعة للجوال" : language === "ms" ? "Tindakan pantas mudah alih" : "Mobile quick actions"}
      >
        {/* Button 1: Promotions / Gift Button with dynamic glow and active discount badge */}
        <div className="w-11 h-11 flex items-center justify-center shrink-0">
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
        </div>

        {/* Button 2: Call/Phone Link */}
        <div className="w-11 h-11 flex items-center justify-center shrink-0">
          <a
            href="tel:+60367310449"
            className="bilc-quick-btn w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 active:scale-95 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.25)] border border-white/10 shrink-0"
            aria-label={`${t("common.call")} Bilingual Idol: +60 3 6731 0449`}
          >
            <Phone size={18} aria-hidden="true" />
          </a>
        </div>

        {/* Button 3: Smart WhatsApp Widget */}
        <div className="w-11 h-11 flex items-center justify-center shrink-0">
          <button
            type="button"
            className={`bilc-wa-trigger-btn w-11 h-11 rounded-full bg-gradient-to-br from-[#25d366] to-[#128c7e] hover:from-[#20ba5a] hover:to-[#0e7064] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(37,211,102,0.3)] border border-white/10 cursor-pointer active:scale-95 ${isWaOpen ? "is-open" : ""}`}
            onClick={() => setIsWaOpen(!isWaOpen)}
            aria-label={language === "ar" ? "تواصل معنا عبر واتساب" : language === "ms" ? "Hubungi kami melalui WhatsApp" : "Chat with Bilingual Idol on WhatsApp"}
          >
            {isWaOpen ? <X size={18} /> : <WhatsAppIcon size={20} />}
          </button>
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

      {/* Shared WhatsApp Dialog Popup Panel */}
      {isWaOpen && (
        <>
          <div
            className="bilc-wa-popup"
            style={{
              position: "fixed",
              bottom: "calc(6rem + env(safe-area-inset-bottom))",
              right: isRTL ? "auto" : "1.5rem",
              left: isRTL ? "1.5rem" : "auto",
              width: "355px",
              zIndex: 1000,
            }}
            role="dialog"
            aria-label={language === "ar" ? "قائمة محادثة واتساب" : language === "ms" ? "Pilihan sembang WhatsApp" : "Smart WhatsApp Chat Selection"}
          >
            <div className="bilc-wa-popup-header">
              <div className="flex items-center gap-2">
                <div className="bilc-wa-avatar">
                  <WhatsAppIcon size={18} />
                </div>
                <div>
                  <strong>
                    {language === "ms"
                      ? "Kemasukan Bilingual Idol"
                      : language === "ar"
                      ? "قسم القبول والتسجيل"
                      : "Bilingual Idol Admissions"}
                  </strong>
                  <p>
                    {language === "ms"
                      ? "Pavilion Embassy · Membalas dalam beberapa minit"
                      : language === "ar"
                      ? "بافيليون إمباسي · الرد عادة خلال دقائق"
                      : "Pavilion Embassy · Typically replies within minutes"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="bilc-wa-close-btn"
                onClick={() => setIsWaOpen(false)}
                aria-label={language === "ar" ? "إغلاق قائمة الواتساب" : language === "ms" ? "Tutup Menu WhatsApp" : "Close WhatsApp Menu"}
              >
                <X size={18} />
              </button>
            </div>

            <div className="bilc-wa-popup-body">
              <p className="bilc-wa-prompt">
                {language === "ms"
                  ? "Bagaimanakah pasukan kemasukan kami boleh membantu anda hari ini?"
                  : language === "ar"
                  ? "كيف يمكن لفريق القبول مساعدتك اليوم"
                  : "How can our admissions team assist you today?"}
              </p>
              <div className="bilc-wa-topics-list">
                {WHATSAPP_TOPICS.map((topic) => {
                  const topicTitle = topic.titles[language] || topic.titles.en;
                  const topicDesc = topic.descs[language] || topic.descs.en;
                  const topicMsg = topic.msgs[language] || topic.msgs.en;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      className="bilc-wa-topic-item"
                      onClick={() => {
                        const encoded = encodeURIComponent(topicMsg);
                        const url = `https://wa.me/60367310449?text=${encoded}`;
                        window.open(url, "_blank", "noreferrer");
                        setIsWaOpen(false);
                      }}
                    >
                      <span className="bilc-topic-emoji">{topic.icon}</span>
                      <div className="bilc-topic-copy">
                        <strong>{topicTitle}</strong>
                        <span>{topicDesc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bilc-wa-popup-footer">
              <span>
                {language === "ms" ? (
                  <>WhatsApp Terus: <bdi dir="ltr">+60 3-6731 0449</bdi></>
                ) : language === "ar" ? (
                  <>واتساب المباشر: <bdi dir="ltr">+60 3-6731 0449</bdi></>
                ) : (
                  <>Direct WhatsApp: <bdi dir="ltr">+60 3-6731 0449</bdi></>
                )}
              </span>
            </div>
          </div>
          <div
            className="bilc-wa-backdrop"
            onClick={() => setIsWaOpen(false)}
            aria-hidden="true"
          />
        </>
      )}

      {/* Official Registry Modal */}
      <OfficialRegistryModal isOpen={isRegistryOpen} onClose={() => setIsRegistryOpen(false)} />
    </div>
  );
}

function WhatsAppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.276-.1-.476-.15-.677.15-.2.301-.777.979-.953 1.18-.175.2-.351.225-.652.075-.301-.15-1.27-.468-2.42-1.493-.894-.798-1.498-1.784-1.674-2.085-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.2-.301.301-.502.1-.2.05-.376-.025-.526-.075-.15-.677-1.632-.928-2.235-.245-.588-.494-.508-.677-.518-.175-.008-.376-.01-.577-.01-.2 0-.527.075-.803.376s-1.054 1.03-1.054 2.511c0 1.482 1.079 2.911 1.23 3.112.15.2 2.124 3.244 5.145 4.549.718.311 1.279.497 1.716.636.722.23 1.379.197 1.898.12.579-.086 1.78-.727 2.03-1.43.251-.703.251-1.305.176-1.43-.075-.126-.276-.201-.577-.351z" />
      <path d="M12.004 2c-5.518 0-9.996 4.478-9.996 9.996 0 1.764.46 3.486 1.334 5.004L2 22l5.13-1.308c1.472.802 3.13 1.228 4.874 1.228 5.518 0 9.996-4.478 9.996-9.996S17.522 2 12.004 2zm0 18.258c-1.503 0-2.975-.405-4.256-1.171l-.305-.181-3.045.776.812-2.968-.198-.316c-.84-1.338-1.284-2.889-1.284-4.398 0-4.553 3.705-8.258 8.276-8.258 4.571 0 8.276 3.705 8.276 8.258 0 4.553-3.705 8.258-8.276 8.258z" />
    </svg>
  );
}

interface WhatsAppTopic {
  id: string;
  icon: string;
  titles: Record<Language, string>;
  descs: Record<Language, string>;
  msgs: Record<Language, string>;
}

const WHATSAPP_TOPICS: WhatsAppTopic[] = [
  {
    id: "general",
    icon: "📚",
    titles: {
      en: "Course & 2026 Price Enquiry",
      ms: "Pertanyaan Kursus & Yuran 2026",
      ar: "استفسار عن الدورات وأسعار 2026",
    },
    descs: {
      en: "Ask about tuition fees, timetables and course catalogs",
      ms: "Tanya tentang yuran pengajian, jadual & katalog kursus",
      ar: "استفسر عن الرسوم والجداول الدراسية وكتالوج البرامج",
    },
    msgs: {
      en: "Hello Bilingual Idol, I would like to inquire about your 2026 courses, fees, and schedule at Pavilion Embassy.",
      ms: "Salam Bilingual Idol, saya ingin bertanya mengenai kursus, yuran dan jadual 2026 di Pavilion Embassy.",
      ar: "مرحباً بايلينجوال آيدول، أود الاستفسار عن دورات 2026 والرسوم وجداول الحصص في بافيليون إمباسي.",
    },
  },
  {
    id: "international",
    icon: "✈️",
    titles: {
      en: "International Student & Visa",
      ms: "Pelajar Antarabangsa & Visa",
      ar: "شؤون الطلاب الدوليين والفيزا",
    },
    descs: {
      en: "EMGS student visa support, accommodation & airport transfer",
      ms: "Sokongan visa pelajar EMGS, penginapan & ketibaan",
      ar: "دعم تأشيرة EMGS والسكن الجامعي والاستقبال من المطار",
    },
    msgs: {
      en: "Hello! I am an international student planning to study English at Bilingual Idol Malaysia. I would like details about EMGS visas and enrolment.",
      ms: "Hai! Saya seorang pelajar antarabangsa yang merancang untuk belajar Bahasa Inggeris di Bilingual Idol Malaysia. Saya ingin maklumat lanjut tentang visa EMGS.",
      ar: "مرحباً! أنا طالب دولي أخطط لدراسة اللغة الإنجليزية في بايلينجوال آيدول ماليزيا. أود معرفة تفاصيل فيزا EMGS وإجراءات القبول.",
    },
  },
  {
    id: "ielts",
    icon: "🎯",
    titles: {
      en: "IELTS Preparation Coaching",
      ms: "Bimbingan Persediaan IELTS",
      ar: "دورات التحضير لاختبار الآيلتس",
    },
    descs: {
      en: "Express 4w, Intensive 8w, Premium 12w coaching",
      ms: "Pakej Ekspres 4 minggu, Intensif 8 minggu, Premium 12 minggu",
      ar: "باقات مكثفة 4، 8، و12 أسبوعاً مع تدريب امتحاني مباشر",
    },
    msgs: {
      en: "Hello Bilingual Idol! I want to prepare for the IELTS exam. Please share details regarding your upcoming IELTS intakes and diagnostic test.",
      ms: "Hai Bilingual Idol! Saya ingin membuat persediaan untuk peperiksaan IELTS. Sila kongsikan maklumat pengambilan terdekat dan ujian diagnostik.",
      ar: "مرحباً بايلينجوال آيدول! أود التحضير لاختبار الآيلتس. يرجى تزويدي بمواعيد الدورات القادمة واختبار تحديد المستوى.",
    },
  },
  {
    id: "camp",
    icon: "☀️",
    titles: {
      en: "Summer Camps & Kids Programs",
      ms: "Kem Musim Panas & Program Kanak-kanak",
      ar: "المخيمات الصيفية وبرامج الصغار",
    },
    descs: {
      en: "Junior English, International Camp & Leadership Programs",
      ms: "Bahasa Inggeris Junior, Kem Antarabangsa & Kepimpinan",
      ar: "إنجليزية للصغار، مخيمات دولية وبرامج قيادية",
    },
    msgs: {
      en: "Hello! I would like information about the upcoming Summer Camps and youth programmes at Bilingual Idol.",
      ms: "Hai! Saya ingin maklumat mengenai Kem Musim Panas dan program belia yang akan datang di Bilingual Idol.",
      ar: "مرحباً! أود الحصول على معلومات حول المخيمات الصيفية القادمة وبرامج الشباب في بايلينجوال آيدول.",
    },
  },
  {
    id: "placement",
    icon: "📝",
    titles: {
      en: "Book Free Placement Test",
      ms: "Tempah Ujian Penempatan Percuma",
      ar: "حجز اختبار تحديد مستوى مجاني",
    },
    descs: {
      en: "Schedule a diagnostic test in person or via Zoom",
      ms: "Jadualkan ujian diagnostik secara bersemuka atau melalui Zoom",
      ar: "حدد موعداً للاختبار حضورياً أو عبر تطبيق زووم",
    },
    msgs: {
      en: "Hello Admissions, I would like to schedule a free Placement Test to evaluate my English level.",
      ms: "Salam Pegawai Kemasukan, saya ingin menjadualkan Ujian Penempatan percuma untuk menilai tahap Bahasa Inggeris saya.",
      ar: "مرحباً قسم القبول, أود حجز موعد لاختبار تحديد المستوى المجاني لتقييم لغتي الإنجليزية.",
    },
  },
];
