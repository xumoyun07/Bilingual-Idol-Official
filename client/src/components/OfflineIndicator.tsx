import React from "react";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useLanguage } from "@/contexts/LanguageContext";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { language, isRTL } = useLanguage();

  if (isOnline) return null;

  const text =
    language === "ar"
      ? "أنت تعمل حالياً في وضع عدم الاتصال. المحتوى المحفوظ والبيانات المحلية متاحة."
      : language === "ms"
      ? "Anda sedang di luar talian. Kandungan yang disimpan dan data tempatan masih tersedia."
      : "You are currently offline. Cached materials and local data remain accessible.";

  return (
    <aside
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-[9999] max-w-md bg-[#10253E] text-white border border-[#E5A93C]/40 rounded-xl shadow-2xl p-3.5 flex items-center gap-3 backdrop-blur-md transition-all duration-300 ${
        isRTL ? "text-right" : "text-left"
      }`}
    >
      <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
        <WifiOff size={18} />
      </div>
      <p className="text-xs md:text-sm font-medium leading-tight text-slate-200">
        {text}
      </p>
    </aside>
  );
}
