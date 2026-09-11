import { useEffect, useState } from "react";
import { Gift, X, ArrowRight, Sparkles, Megaphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

interface PromoProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface ColorTheme {
  floatingBg: string;
  floatingPing: string;
  floatingShadow: string;
  modalStripe: string;
  tagText: string;
  iconBg: string;
  discountText: string;
  closeBtnHover: string;
  codeBox: string;
  codeBtn: string;
  ctaBg: string;
}

function getColorTheme(colorName?: string): ColorTheme {
  const color = colorName || "red";
  switch (color) {
    case "blue":
      return {
        floatingBg: "bg-gradient-to-br from-blue-600 to-indigo-700",
        floatingPing: "bg-blue-400",
        floatingShadow: "shadow-[0_10px_24px_-3px_rgba(37,99,235,0.45),_0_4px_10px_-2px_rgba(16,37,62,0.2)] hover:shadow-[0_14px_30px_-3px_rgba(37,99,235,0.58),_0_6px_14px_-2px_rgba(16,37,62,0.26)]",
        modalStripe: "bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-700",
        tagText: "text-blue-600",
        iconBg: "bg-blue-50 text-blue-600 border border-blue-100",
        discountText: "text-indigo-500",
        closeBtnHover: "hover:bg-blue-50 hover:text-blue-600",
        codeBox: "bg-blue-50/75 border border-dashed border-blue-200",
        codeBtn: "bg-white hover:bg-blue-100 border border-blue-200 text-blue-700 hover:text-blue-800",
        ctaBg: "from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
      };
    case "green":
      return {
        floatingBg: "bg-gradient-to-br from-emerald-600 to-teal-700",
        floatingPing: "bg-emerald-400",
        floatingShadow: "shadow-[0_10px_24px_-3px_rgba(5,150,105,0.45),_0_4px_10px_-2px_rgba(16,37,62,0.2)] hover:shadow-[0_14px_30px_-3px_rgba(5,150,105,0.58),_0_6px_14px_-2px_rgba(16,37,62,0.26)]",
        modalStripe: "bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700",
        tagText: "text-emerald-600",
        iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-100",
        discountText: "text-teal-600",
        closeBtnHover: "hover:bg-emerald-50 hover:text-emerald-600",
        codeBox: "bg-emerald-50/75 border border-dashed border-emerald-200",
        codeBtn: "bg-white hover:bg-emerald-100 border border-emerald-200 text-emerald-700 hover:text-emerald-800",
        ctaBg: "from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800"
      };
    case "amber":
      return {
        floatingBg: "bg-gradient-to-br from-amber-500 to-orange-600",
        floatingPing: "bg-amber-400",
        floatingShadow: "shadow-[0_10px_24px_-3px_rgba(245,158,11,0.45),_0_4px_10px_-2px_rgba(16,37,62,0.2)] hover:shadow-[0_14px_30px_-3px_rgba(245,158,11,0.58),_0_6px_14px_-2px_rgba(16,37,62,0.26)]",
        modalStripe: "bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600",
        tagText: "text-amber-600",
        iconBg: "bg-amber-50 text-amber-600 border border-amber-100",
        discountText: "text-orange-500",
        closeBtnHover: "hover:bg-amber-50 hover:text-amber-600",
        codeBox: "bg-amber-50/75 border border-dashed border-amber-200",
        codeBtn: "bg-white hover:bg-amber-100 border border-amber-200 text-amber-700 hover:text-amber-800",
        ctaBg: "from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
      };
    case "purple":
      return {
        floatingBg: "bg-gradient-to-br from-purple-600 to-violet-700",
        floatingPing: "bg-purple-400",
        floatingShadow: "shadow-[0_10px_24px_-3px_rgba(147,51,234,0.45),_0_4px_10px_-2px_rgba(16,37,62,0.2)] hover:shadow-[0_14px_30px_-3px_rgba(147,51,234,0.58),_0_6px_14px_-2px_rgba(16,37,62,0.26)]",
        modalStripe: "bg-gradient-to-r from-purple-600 via-violet-500 to-purple-700",
        tagText: "text-purple-600",
        iconBg: "bg-purple-50 text-purple-600 border border-purple-100",
        discountText: "text-violet-500",
        closeBtnHover: "hover:bg-purple-50 hover:text-purple-600",
        codeBox: "bg-purple-50/75 border border-dashed border-purple-200",
        codeBtn: "bg-white hover:bg-purple-100 border border-purple-200 text-purple-700 hover:text-purple-800",
        ctaBg: "from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800"
      };
    case "slate":
      return {
        floatingBg: "bg-gradient-to-br from-slate-600 to-slate-800",
        floatingPing: "bg-slate-400",
        floatingShadow: "shadow-[0_10px_24px_-3px_rgba(71,85,105,0.45),_0_4px_10px_-2px_rgba(16,37,62,0.2)] hover:shadow-[0_14px_30px_-3px_rgba(71,85,105,0.58),_0_6px_14px_-2px_rgba(16,37,62,0.26)]",
        modalStripe: "bg-gradient-to-r from-slate-600 via-slate-500 to-slate-700",
        tagText: "text-slate-700",
        iconBg: "bg-slate-50 text-slate-700 border border-slate-200",
        discountText: "text-slate-600",
        closeBtnHover: "hover:bg-slate-100 hover:text-slate-800",
        codeBox: "bg-slate-100/75 border border-dashed border-slate-200",
        codeBtn: "bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 hover:text-slate-800",
        ctaBg: "from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900"
      };
    case "red":
    default:
      return {
        floatingBg: "bg-gradient-to-br from-red-600 to-rose-700",
        floatingPing: "bg-red-400",
        floatingShadow: "shadow-[0_10px_24px_-3px_rgba(220,38,38,0.45),_0_4px_10px_-2px_rgba(16,37,62,0.2)] hover:shadow-[0_14px_30px_-3px_rgba(220,38,38,0.58),_0_6px_14px_-2px_rgba(16,37,62,0.26)]",
        modalStripe: "bg-gradient-to-r from-red-600 via-rose-500 to-red-700",
        tagText: "text-red-600",
        iconBg: "bg-red-50 text-red-600 border border-red-100",
        discountText: "text-rose-500",
        closeBtnHover: "hover:bg-red-50 hover:text-red-600",
        codeBox: "bg-red-50/75 border border-dashed border-red-200",
        codeBtn: "bg-white hover:bg-red-100 border border-red-200 text-red-700 hover:text-red-800",
        ctaBg: "from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800"
      };
  }
}

export function PromotionalFloatingBadge({ isOpen, setIsOpen }: PromoProps) {
  const { t } = useLanguage();
  const { data: settings, isLoading } = trpc.content.siteSettings.useQuery();

  const [showFloatingButton, setShowFloatingButton] = useState(false);

  const isActive = settings?.promo_active === "true";
  const title = settings?.promo_title || "";
  const discount = settings?.promo_discount || "";
  const promoColor = settings?.promo_color || "red";

  const theme = getColorTheme(promoColor);

  useEffect(() => {
    if (!isLoading && isActive) {
      // Check if already auto-shown in this session
      const hasBeenShown = sessionStorage.getItem("bilc_promo_session_shown");
      
      if (!hasBeenShown) {
        // First entry - auto open the modal
        setIsOpen(true);
        sessionStorage.setItem("bilc_promo_session_shown", "true");
        setShowFloatingButton(true);
      } else {
        // Not first entry, but campaign is active, so keep floating button available
        setShowFloatingButton(true);
      }
    }
  }, [isLoading, isActive, setIsOpen]);

  if (!isActive || isLoading) return null;

  return (
    <AnimatePresence>
      {showFloatingButton && !isOpen && (
        <motion.button
          key="promo-floating-btn"
          initial={{ scale: 0, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 15 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          onClick={() => setIsOpen(true)}
          className={`relative flex items-center justify-center ${theme.floatingBg} text-white rounded-full w-14 h-14 ${theme.floatingShadow} border border-white/35 cursor-pointer hover:scale-[1.05] hover:-translate-y-[3px] active:scale-[0.96] transition-all duration-150 group z-50 pointer-events-auto`}
          aria-label={t("promo.buttonLabel", undefined, "Show Active Promotions")}
          title={title}
        >
          <span className="relative flex h-5 w-5 items-center justify-center">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.floatingPing} opacity-75`}></span>
            <Gift size={22} className="relative text-white group-hover:rotate-12 transition-transform duration-300" />
          </span>
          {discount && (
            <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-slate-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-white shadow-xs select-none tracking-tight whitespace-nowrap">
              {discount}
            </span>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export function PromotionalPopupModal({ isOpen, setIsOpen }: PromoProps) {
  const { t, isRTL } = useLanguage();
  const { data: settings, isLoading } = trpc.content.siteSettings.useQuery();

  const isActive = settings?.promo_active === "true";
  const title = settings?.promo_title || "";
  const text = settings?.promo_text || "";
  const discount = settings?.promo_discount || "";
  const code = settings?.promo_code || "";
  const ctaText = settings?.promo_cta_text || "";
  const ctaUrl = settings?.promo_cta_url || "";
  const promoColor = settings?.promo_color || "red";

  const theme = getColorTheme(promoColor);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isActive || isLoading) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop with elegant fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Card with spring zoom & scale */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
            className={`relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col z-10 ${
              isRTL ? "text-right" : "text-left"
            }`}
            style={{ direction: isRTL ? "rtl" : "ltr" }}
          >
            {/* Header Visual Stripe */}
            <div className={`h-2 bg-gradient-to-r ${theme.modalStripe}`} />

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} p-1.5 rounded-full bg-slate-100 ${theme.closeBtnHover} text-slate-500 cursor-pointer transition-colors duration-200 z-20`}
              aria-label={t("common.close", undefined, "Close")}
            >
              <X size={18} />
            </button>

            {/* Promo Content Container */}
            <div className="p-6 md:p-8 flex flex-col space-y-5">
              {/* Visual Icon & Tag */}
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-xs ${theme.iconBg}`}>
                  <Megaphone size={20} className="animate-bounce" />
                </div>
                <div className="flex flex-col">
                  <span className={`text-[10px] md:text-xs font-bold tracking-widest uppercase ${theme.tagText}`}>
                    {t("promo.badge", undefined, "EXCLUSIVE OFFER")}
                  </span>
                  {discount && (
                    <span className={`text-xs font-semibold ${theme.discountText}`}>
                      {discount} {t("promo.off", undefined, "Discount Active")}
                    </span>
                  )}
                </div>
              </div>

              {/* Secure Heading & Text (Plain-text interpolation automatically prevents XSS) */}
              <div className="space-y-2">
                <h3 className="text-lg md:text-xl font-extrabold text-slate-900 leading-snug tracking-tight">
                  {title}
                </h3>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {text}
                </p>
              </div>

              {/* Promo Code Box */}
              {code && (
                <div className={`rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 ${theme.codeBox}`}>
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      {t("promo.codeLabel", undefined, "PROMO CODE")}
                    </p>
                    <p className="text-sm font-bold text-slate-800 tracking-wide mt-0.5">
                      {code}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(code);
                    }}
                    className={`font-bold text-xs px-3 py-1.5 rounded-lg shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer select-none ${theme.codeBtn}`}
                  >
                    {t("promo.copyCode", undefined, "Copy Code")}
                  </button>
                </div>
              )}

              {/* CTA & Dismiss Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {ctaText && ctaUrl && (
                  <a
                    href={ctaUrl}
                    onClick={handleClose}
                    className={`flex-1 bg-gradient-to-r ${theme.ctaBg} text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer text-center`}
                  >
                    <Sparkles size={16} />
                    {ctaText}
                    <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 font-bold text-sm py-3 px-4 rounded-xl transition-all duration-200 cursor-pointer"
                >
                  {t("promo.dismiss", undefined, "Maybe Later")}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
