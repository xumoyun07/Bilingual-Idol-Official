import { ExternalLink, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function CentreMap() {
  const { language, isRTL } = useLanguage();
  const address = "B-25-07, Pavilion Embassy, Menara G-Vestor, 200, Jln Ampang, 50450 Kuala Lumpur";
  const encodedAddress = encodeURIComponent(address);

  return (
    <div className={`centre-map-shell overflow-hidden rounded-[1rem] border border-[#e1d5c4] bg-white shadow-[0_16px_45px_rgba(16,37,62,.09)] ${isRTL ? "is-rtl" : ""}`}>
      <div className="relative h-[330px] overflow-hidden bg-[#e7f0eb]">
        <iframe
          className="h-full w-full border-0"
          title="Map showing Bilingual Idol Language Centre at Pavilion Embassy, Kuala Lumpur"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps?q=${encodedAddress}&output=embed`}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(16,37,62,.09)_1px,transparent_1px),linear-gradient(90deg,rgba(16,37,62,.09)_1px,transparent_1px)] bg-[size:28px_28px] opacity-35" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 w-[min(88%,25rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/70 bg-[#fbf8f2]/90 p-5 text-center shadow-[0_15px_35px_rgba(16,37,62,.14)] backdrop-blur-sm">
          <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#173fad] text-white">
            <MapPin size={18} />
          </span>
          <p className="mt-3 text-sm font-extrabold text-[#10253e]">Bilingual Idol Language Centre</p>
          <p className="mt-1 text-xs leading-5 text-[#5b6d80]">B-25-07, Pavilion Embassy, Jalan Ampang, Kuala Lumpur</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-start gap-2 text-sm font-semibold leading-6 text-[#29415b]">
          <MapPin className="mt-0.5 shrink-0 text-[#173fad]" size={18} />
          B-25-07, Pavilion Embassy, Menara G-Vestor, 200, Jln Ampang, Kuala Lumpur
        </p>
        <a
          className="inline-flex shrink-0 items-center gap-2 text-sm font-extrabold text-[#173fad] hover:text-[#10253e]"
          href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
          target="_blank"
          rel="noreferrer"
        >
          {language === "ms" ? "Dapatkan arah" : language === "ar" ? "الاتجاهات على الخريطة" : "Get directions"}{" "}
          <ExternalLink size={15} />
        </a>
      </div>
    </div>
  );
}

