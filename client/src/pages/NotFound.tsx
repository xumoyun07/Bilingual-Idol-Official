import { Compass, Home } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFound() {
  const [, setLocation] = useLocation();
  const { language, isRTL } = useLanguage();

  return (
    <main className={`compass-page compass-grid grid min-h-screen place-items-center p-5 ${isRTL ? "is-rtl" : ""}`}>
      <section className="compass-card w-full max-w-xl p-8 text-center sm:p-12">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-[#e7f0eb] text-[#397563]">
          <Compass size={25} />
        </span>
        <p className="compass-kicker mt-7">
          {language === "ms" ? "Penanda Laluan 404" : language === "ar" ? "رمز الخطأ 404" : "Route marker 404"}
        </p>
        <h1 className="compass-display mt-4 text-4xl sm:text-5xl">
          {language === "ms" ? "Halaman ini tiada dalam peta." : language === "ar" ? "هذه الصفحة غير موجودة على الخريطة." : "This route is not on the map."}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#53657a]">
          {language === "ms"
            ? "Halaman mungkin telah dipindahkan atau tidak lagi tersedia. Sila kembali ke laman utama untuk meneruskan."
            : language === "ar"
            ? "ربما تم نقل الصفحة أو لم تعد متوفرة. تفضل بالعودة إلى الصفحة الرئيسية للمتابعة."
            : "The page may have moved or no longer be available. Return to the website to continue."}
        </p>
        <button onClick={() => setLocation("/")} className="compass-btn-primary mt-8 inline-flex items-center gap-2">
          <Home size={16} /> {language === "ms" ? "Ke Laman Utama" : language === "ar" ? "الصفحة الرئيسية" : "Go Home"}
        </button>
      </section>
    </main>
  );
}
