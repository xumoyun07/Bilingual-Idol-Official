import React from "react";
import { Download, Smartphone, Check } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useLanguage } from "@/contexts/LanguageContext";

interface PWAInstallButtonProps {
  className?: string;
  variant?: "header" | "button" | "card" | "banner";
}

export function PWAInstallButton({ className = "", variant = "button" }: PWAInstallButtonProps) {
  const { canInstall, isInstalled, isPromptReady, isIOS, isStandalone, promptInstall } = usePWAInstall();
  const { language } = useLanguage();
  const [showIosGuide, setShowIosGuide] = React.useState(false);

  const getLabel = () => {
    if (isInstalled || isStandalone) {
      return language === "ar" ? "تم تثبيت التطبيق" : language === "ms" ? "Aplikasi Dipasang" : "App Installed";
    }
    return language === "ar" ? "تثبيت التطبيق" : language === "ms" ? "Pasang Aplikasi" : "Install App";
  };

  const getDesc = () => {
    return language === "ar"
      ? "قم بتثبيت تطبيق مركز بايلينجوال آيدول على شاشتك الرئيسية للوصول السريع والعمل دون اتصال."
      : language === "ms"
      ? "Pasang aplikasi Pusat Bahasa Bilingual Idol pada skrin utama untuk akses pantas dan luar talian."
      : "Install the Bilingual Idol app on your home screen for quick offline-ready access.";
  };

  if (isInstalled || isStandalone) {
    if (variant === "card") {
      return (
        <div className={`p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 ${className}`}>
          <div className="p-2 bg-emerald-500 text-white rounded-lg">
            <Check size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">{getLabel()}</h3>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
              {language === "ar"
                ? "التطبيق مثبت بالفعل على جهازك."
                : language === "ms"
                ? "Aplikasi sudah dipasang pada peranti anda."
                : "App is running as an installed progressive web app."}
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  if (!canInstall && !isIOS) {
    return null;
  }

  const handleClick = async () => {
    if (isPromptReady) {
      await promptInstall();
    } else if (isIOS) {
      setShowIosGuide(true);
    }
  };

  if (variant === "header") {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#E5A93C] text-[#10253E] hover:bg-[#d4972c] transition-colors shadow-sm ${className}`}
          title={getDesc()}
        >
          <Download size={14} />
          <span>{getLabel()}</span>
        </button>

        {showIosGuide && (
          <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-[#10253E] shadow-2xl space-y-4">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <Smartphone size={20} className="text-[#173FAD]" />
                {language === "ar" ? "تثبيت على جهاز iPhone / iPad" : language === "ms" ? "Pasang di iOS" : "Install on iOS"}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {language === "ar"
                  ? "اضغط على زر المشاركة (Share) في متصفح Safari، ثم اختر 'إضافة إلى الشاشة الرئيسية' (Add to Home Screen)."
                  : language === "ms"
                  ? "Ketik butang Kongsi (Share) di Safari, kemudian pilih 'Tambah ke Skrin Utama' (Add to Home Screen)."
                  : "Tap the Share icon in Safari browser, then choose 'Add to Home Screen'."}
              </p>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="w-full py-2.5 rounded-xl bg-[#10253E] text-white font-bold text-sm"
              >
                {language === "ar" ? "حسناً، فهمت" : language === "ms" ? "Faham" : "Got it"}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (variant === "card") {
    return (
      <div className={`p-4 bg-[#10253E]/5 border border-[#10253E]/15 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#173FAD] text-white rounded-xl shadow-sm">
            <Smartphone size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#10253E]">{getLabel()}</h3>
            <p className="text-xs text-slate-600 max-w-md">{getDesc()}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClick}
          className="px-4 py-2 bg-[#10253E] hover:bg-[#193B63] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Download size={15} />
          {getLabel()}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-[#173FAD] hover:bg-[#123087] text-white transition-all shadow-sm ${className}`}
    >
      <Download size={15} />
      <span>{getLabel()}</span>
    </button>
  );
}
