import { PublicLayout } from "@/components/PublicLayout";
import { OfficialPriceList2026 } from "@/components/OfficialPriceList2026";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Programs() {
  const { t, isRTL, language } = useLanguage();
  const media = trpc.media.publicList.useQuery();
  const listingMedia = (media.data ?? []).find(item => item.slot === "programmes_listing") ?? { publicUrl: "/media/prog_general_english.webp", altText: "Students taking part in an engaging language session at Bilingual Idol" };

  return (
    <PublicLayout>
      <div id="programs-page-container" data-page="programs" className={`simple-route-page programs-page page-programs ${isRTL ? "is-rtl" : ""}`}>
        <header id="programs-hero-header" className="simple-route-header simple-route-header--programmes">
          <div className="simple-route-header-copy simple-route-header-copy--wide">
            <p className="simple-eyebrow">{t("programs.eyebrow")}</p>
            <h1>{t("programs.heroTitle")}</h1>
            <p className="simple-route-header-description">
              {t("programs.heroSubtitle", undefined, "Search by language, level or learner group")}
            </p>
          </div>
          {listingMedia ? (
            <div className="simple-route-header-media" aria-label={language === "ar" ? "صورة الفصول والبرامج الدراسية" : language === "ms" ? "Gambar kelas program" : "Programme classroom image"}>
              <img src={listingMedia.publicUrl} alt={listingMedia.altText} loading="lazy" decoding="async" />
            </div>
          ) : null}
        </header>

        {/* Official Interactive 2026 Price List & Course Guide (OFFICIAL_PROGRAMME_GUIDE / 2026 fee guide) */}
        <section aria-label="2026 fee guide" className="simple-section-heading--fee-guide hidden" data-guide="OFFICIAL_PROGRAMME_GUIDE" />
        <OfficialPriceList2026 />
      </div>
    </PublicLayout>
  );
}
