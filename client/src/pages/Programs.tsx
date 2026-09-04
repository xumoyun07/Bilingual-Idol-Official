import { Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/PublicLayout";
import { OFFICIAL_PROGRAMME_GUIDE, PROGRAM_CATEGORIES } from "@/lib/siteData";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Programs() {
  const [category, setCategory] = useState<(typeof PROGRAM_CATEGORIES)[number]>("All");
  const [query, setQuery] = useState("");
  const { t, isRTL, language } = useLanguage();
  const programmes = trpc.content.publicPrograms.useQuery();
  const media = trpc.media.publicList.useQuery();
  const listingMedia = (media.data ?? []).find(item => item.slot === "programmes_listing") ?? { publicUrl: "/media/prog_general_english.webp", altText: "Students taking part in an engaging language session at Bilingual Idol" };
  const matches = useMemo(
    () =>
      (programmes.data ?? []).filter(
        item =>
          (category === "All" || item.category === category) &&
          [item.title, item.language, item.ageGroup, item.level].join(" ").toLowerCase().includes(query.toLowerCase()),
      ),
    [category, query, programmes.data],
  );

  return (
    <PublicLayout>
      <div className={`simple-route-page programs-page ${isRTL ? "is-rtl" : ""}`}>
        <header className="simple-route-header simple-route-header--programmes">
          <div className="simple-route-header-copy simple-route-header-copy--wide">
            <p className="simple-eyebrow">{t("programs.eyebrow")}</p>
            <h1>{t("programs.heroTitle")}</h1>
            <p className="simple-route-header-description">
              {t("programs.heroSubtitle")}
            </p>
          </div>
          {listingMedia ? (
            <div className="simple-route-header-media" aria-label="Programme classroom image">
              <img src={listingMedia.publicUrl} alt={listingMedia.altText} loading="lazy" decoding="async" />
            </div>
          ) : null}
        </header>

        <section className="simple-route-section simple-guide-section">
          <div className="simple-section-heading simple-section-heading--fee-guide">
            <div>
              <p className="simple-eyebrow">{t("programs.feeGuideEyebrow")}</p>
              <h2>{t("programs.feeGuideTitle")}</h2>
            </div>
            <p>{t("programs.feeGuideSubtitle")}</p>
          </div>
          <div className="simple-programme-guide">
            {OFFICIAL_PROGRAMME_GUIDE.map(item => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                <strong>{item.fee}</strong>
                <small>{item.note}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="simple-route-section">
          <div className="simple-filter-bar">
            <label>
              <Search size={17} />
              <span className="sr-only">{t("programs.searchPlaceholder")}</span>
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder={t("programs.searchPlaceholder")} />
            </label>
            <div className="simple-filter-options" aria-label="Programme category filters">
              <span>
                <Filter size={15} /> {t("programs.filterAll")}
              </span>
              {PROGRAM_CATEGORIES.map(item => (
                <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item}>
                  {item === "All" ? t("programs.filterAll") : item}
                </button>
              ))}
            </div>
          </div>

          <p className="simple-list-summary simple-list-summary--surface">
            <strong>{matches.length}</strong> {t("programs.showingCount", { count: matches.length })}
          </p>

          {programmes.isLoading ? (
            <div className="simple-programme-list">
              {[1, 2, 3].map(item => (
                <div className="simple-loading-row" key={item} />
              ))}
            </div>
          ) : matches.length ? (
            <div className="simple-programme-list">
              {matches.map(programme => (
                <Link key={programme.slug} href={`/programs/${programme.slug}`} className="simple-programme-row">
                  <div>
                    <strong>{programme.title}</strong>
                    <span>
                      {programme.language} · {programme.level} · {programme.ageGroup}
                    </span>
                  </div>
                  <span>{t("programs.viewDetails")}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="simple-empty-state">
              <p>{t("programs.emptyText")}</p>
              <Link href="/contact" className="simple-text-link">
                {t("programs.emptyCta")}
              </Link>
            </div>
          )}
        </section>
      </div>
    </PublicLayout>
  );
}
