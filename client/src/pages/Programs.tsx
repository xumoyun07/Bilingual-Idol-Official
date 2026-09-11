import { Filter, Search, SlidersHorizontal, X, Layers, CheckCircle2, GraduationCap } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/PublicLayout";
import { OFFICIAL_PROGRAMME_GUIDE, PROGRAM_CATEGORIES } from "@/lib/siteData";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { FilterDrawer } from "@/components/ui/FilterDrawer";

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

        <section id="programs-guide-section" className="simple-route-section simple-guide-section">
          <div className="simple-section-heading simple-section-heading--fee-guide">
            <div>
              <p className="simple-eyebrow">{t("programs.feeGuideEyebrow")}</p>
              <h2>{t("programs.feeGuideTitle", undefined, "2026 fee guide")}</h2>
            </div>
            <p>{t("programs.feeGuideSubtitle")}</p>
          </div>
          <div className="simple-programme-guide">
            {[
              {
                title: language === "ar" ? "اللغة الإنجليزية العامة" : language === "ms" ? "Bahasa Inggeris Umum" : "General English",
                detail: language === "ar" ? "1، 3، 6، 9 أو 12 شهراً · 5 أيام/الأسبوع" : language === "ms" ? "1, 3, 6, 9 atau 12 bulan · 5 hari/seminggu" : "1, 3, 6, 9 or 12 months · 5 days/week",
                fee: language === "ar" ? "الرسوم من 2,950 ر.م" : language === "ms" ? "Yuran dari RM 2,950" : "Tuition from RM 2,950",
                note: language === "ar" ? "رسوم التسجيل وتحديد المستوى مدرجة في دليل 2026." : language === "ms" ? "Yuran pendaftaran dan penempatan disenaraikan secara berasingan dalam panduan 2026." : "Registration and placement fees are listed separately in the 2026 guide.",
              },
              {
                title: language === "ar" ? "التحضير لاختبار آيلتس (IELTS)" : language === "ms" ? "Persediaan IELTS" : "IELTS Preparation",
                detail: language === "ar" ? "سريع 4 أسابيع · مكثف 8 أسابيع · بريميوم 12 أسبوعاً" : language === "ms" ? "Ekspres 4 minggu · Intensif 8 minggu · Premium 12 minggu" : "Express 4 weeks · Intensive 8 weeks · Premium 12 weeks",
                fee: language === "ar" ? "3,500 – 9,900 ر.م" : language === "ms" ? "RM 3,500–RM 9,900" : "RM 3,500–RM 9,900",
                note: language === "ar" ? "يشمل اختبار تحديد المستوى وتقييم التقدم والمواد الدراسية وشهادة الإتمام." : language === "ms" ? "Termasuk ujian penempatan, penilaian kemajuan, bahan pembelajaran dan sijil tamat." : "Includes placement test, progress assessment, learning materials and certificate of completion.",
              },
              {
                title: language === "ar" ? "المخيم الصيفي الدولي" : language === "ms" ? "Kem Musim Panas" : "Summer Camp",
                detail: language === "ar" ? "إنجليزي للصغار أسبوعان · مخيم دولي وقيادي 4 أسابيع" : language === "ms" ? "Bahasa Inggeris Junior 2 minggu · Kem antarabangsa & kepimpinan 4 minggu" : "Junior English 2 weeks · International and Leadership camps 4 weeks",
                fee: language === "ar" ? "4,400 – 7,600 ر.م" : language === "ms" ? "RM 4,400–RM 7,600" : "RM 4,400–RM 7,600",
                note: language === "ar" ? "الباقات تشمل دروس اللغة والأنشطة والرحلات والكتب والشهادات." : language === "ms" ? "Pakej merangkumi kelas bahasa Inggeris, aktiviti/lawatan, bahan pembelajaran dan sijil." : "Packages list English classes, activities/trips, learning materials and certificates.",
              },
              {
                title: language === "ar" ? "دروس إنجليزية خاصة (فردية)" : language === "ms" ? "Pelajaran Bahasa Inggeris Peribadi" : "Private English Lessons",
                detail: language === "ar" ? "الفضي 10 ساعات · الذهبي 20 ساعة · البلاتيني 40 ساعة" : language === "ms" ? "Perak 10 jam · Emas 20 jam · Platinum 40 jam" : "Silver 10 hours · Gold 20 hours · Platinum 40 hours",
                fee: language === "ar" ? "1,800 – 5,800 ر.م" : language === "ms" ? "RM 1,800–RM 5,800" : "RM 1,800–RM 5,800",
                note: language === "ar" ? "باقات دروس فردية مخصصة بالكامل وفق احتياجاتك." : language === "ms" ? "Pakej pelajaran yang diperibadikan mengikut keperluan anda." : "Personalised lesson packages.",
              },
              {
                title: language === "ar" ? "الإنجليزية التنفيذية للأعمال" : language === "ms" ? "Bahasa Inggeris Eksekutif" : "Executive English",
                detail: language === "ar" ? "إنجليزية أعمال شهر · تواصل تنفيذي شهران · ماستر كلاس مخصص للشركات" : language === "ms" ? "Bahasa Inggeris Perniagaan 1 bulan · Komunikasi Eksekutif 2 bulan · Kelas Master Korporat" : "Business English 1 month · Executive Communication 2 months · Corporate Masterclass customised",
                fee: language === "ar" ? "3,800 – 6,600 ر.م" : language === "ms" ? "RM 3,800–RM 6,600" : "RM 3,800–RM 6,600",
                note: language === "ar" ? "يتم تقديم عروض الأسعار للشركات والمؤسسات عند الطلب." : language === "ms" ? "Kelas Master Bahasa Inggeris Korporat disebut harga atas permintaan." : "Corporate English Masterclass is quoted on request.",
              },
            ].map(item => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                <strong>{item.fee}</strong>
                <small>{item.note}</small>
              </article>
            ))}
          </div>
        </section>

        <section id="programs-list-section" className="simple-route-section">
          {/* Main Search & Filter Bar */}
          <div className="simple-filter-bar">
            <div className="flex items-center gap-2 w-full">
              <label className="flex-1">
                <Search size={17} />
                <span className="sr-only">{t("programs.searchPlaceholder")}</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("programs.searchPlaceholder")}
                />
              </label>

              {/* Mobile Filter Drawer Button */}
              <div className="sm:hidden shrink-0">
                <FilterDrawer
                  title={
                    language === "ar"
                      ? "تصفية كتالوج الدورات"
                      : language === "ms"
                      ? "Penapis Katalog Kursus"
                      : "Course Catalog Filters"
                  }
                  description={
                    language === "ar"
                      ? "اختر الفئة الأكاديمية لعرض البرامج المتاحة"
                      : language === "ms"
                      ? "Pilih kategori akademik untuk melihat kursus"
                      : "Select an academic category to filter available courses."
                  }
                  activeCount={category !== "All" ? 1 : 0}
                  triggerLabel={
                    language === "ar" ? "تصفية" : language === "ms" ? "Tapis" : "Filters"
                  }
                  onReset={() => {
                    setCategory("All");
                    setQuery("");
                  }}
                  resetLabel={
                    language === "ar" ? "إعادة ضبط" : language === "ms" ? "Set semula" : "Reset"
                  }
                  applyLabel={
                    language === "ar" ? "تطبيق" : language === "ms" ? "Guna" : "Apply"
                  }
                >
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#10253e] uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap size={15} className="text-[#173fad]" />
                      <span>
                        {language === "ar"
                          ? "فئة البرامج"
                          : language === "ms"
                          ? "Kategori Program"
                          : "Program Category"}
                      </span>
                    </label>

                    <div className="flex flex-col gap-2">
                      {PROGRAM_CATEGORIES.map((item) => {
                        const isSelected = category === item;
                        const label =
                          item === "All"
                            ? t("programs.filterAll")
                            : item === "Kids"
                            ? language === "ar"
                              ? "الأطفال والمخيمات الصيفية"
                              : language === "ms"
                              ? "Kanak-kanak & Kem Musim Panas"
                              : "Kids & Holiday Camps"
                            : item === "English"
                            ? language === "ar"
                              ? "اللغة الإنجليزية وآيلتس"
                              : language === "ms"
                              ? "Bahasa Inggeris & IELTS"
                              : "English & IELTS Prep"
                            : item === "World Languages"
                            ? language === "ar"
                              ? "لغات عالمية (ماندرين، عربية، ملايو)"
                              : language === "ms"
                              ? "Bahasa Antarabangsa (Mandarin/Arab)"
                              : "World Languages (Mandarin, Arabic, Malay)"
                            : language === "ar"
                            ? "مهني وتدريب مؤسسي"
                            : language === "ms"
                            ? "Profesional & Korporat"
                            : "Corporate & Executive";

                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setCategory(item)}
                            className={`w-full min-h-12 px-4 py-3 rounded-xl text-xs font-semibold border flex items-center justify-between transition-all text-start ${
                              isSelected
                                ? "border-[#173fad] bg-[#eef4ff] text-[#173fad] shadow-xs ring-1 ring-[#173fad]"
                                : "border-[#dce4e7] bg-white text-[#29415b] hover:bg-[#f8fafb]"
                            }`}
                          >
                            <span className="truncate">{label}</span>
                            {isSelected && (
                              <CheckCircle2 size={16} className="text-[#173fad] shrink-0 ms-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </FilterDrawer>
              </div>
            </div>

            {/* Desktop Filter Options */}
            <div
              className="hidden sm:flex simple-filter-options"
              aria-label={
                language === "ar"
                  ? "تصفية فئات البرامج"
                  : language === "ms"
                  ? "Penapis kategori program"
                  : "Programme category filters"
              }
            >
              <span>
                <Filter size={15} /> {t("programs.filterAll")}
              </span>
              {PROGRAM_CATEGORIES.map((item) => {
                const label =
                  item === "All"
                    ? t("programs.filterAll")
                    : item === "Kids"
                    ? language === "ar"
                      ? "الأطفال"
                      : language === "ms"
                      ? "Kanak-kanak"
                      : "Kids"
                    : item === "English"
                    ? language === "ar"
                      ? "اللغة الإنجليزية"
                      : language === "ms"
                      ? "Bahasa Inggeris"
                      : "English"
                    : item === "World Languages"
                    ? language === "ar"
                      ? "لغات عالمية"
                      : language === "ms"
                      ? "Bahasa Antarabangsa"
                      : "World Languages"
                    : language === "ar"
                    ? "مهني وتطويري"
                    : language === "ms"
                    ? "Profesional"
                    : "Professional";
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    aria-pressed={category === item}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filter Chips */}
          {(category !== "All" || query.trim()) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 pb-1 px-1">
              <span className="text-[11px] font-bold text-[#53657a] me-1">
                {language === "ar" ? "الفلاتر النشطة:" : language === "ms" ? "Penapis aktif:" : "Active filters:"}
              </span>

              {category !== "All" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#eef4ff] text-[#173fad] border border-[#c0d4ff]">
                  <span>
                    {category === "Kids"
                      ? language === "ar"
                        ? "الأطفال"
                        : language === "ms"
                        ? "Kanak-kanak"
                        : "Kids"
                      : category === "English"
                      ? language === "ar"
                        ? "اللغة الإنجليزية"
                        : language === "ms"
                        ? "Bahasa Inggeris"
                        : "English"
                      : category === "World Languages"
                      ? language === "ar"
                        ? "لغات عالمية"
                        : language === "ms"
                        ? "Bahasa Antarabangsa"
                        : "World Languages"
                      : language === "ar"
                      ? "مهني"
                      : language === "ms"
                      ? "Profesional"
                      : "Professional"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCategory("All")}
                    aria-label="Remove category filter"
                    className="hover:text-rose-600 focus:outline-none ms-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {query.trim() && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#f0f4f7] text-[#29415b] border border-[#dce4e7]">
                  <span>"{query}"</span>
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search query"
                    className="hover:text-rose-600 focus:outline-none ms-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  setCategory("All");
                  setQuery("");
                }}
                className="text-xs font-semibold text-[#173fad] hover:text-[#10253e] underline ms-2 py-0.5"
              >
                {language === "ar" ? "إعادة ضبط الكل" : language === "ms" ? "Set semula semua" : "Reset all"}
              </button>
            </div>
          )}

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
