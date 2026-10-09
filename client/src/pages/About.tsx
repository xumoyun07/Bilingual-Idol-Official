import { useState } from "react";
import { BookMarked, ChevronLeft, ChevronRight, Compass, Heart, UsersRound } from "lucide-react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

type AboutMediaSlot = "about_hero" | "about_method" | "about_classroom" | "about_community" | "about_cta";

type AboutMedia = {
  src: string;
  alt: string;
};

const ABOUT_MEDIA_FALLBACKS: Record<AboutMediaSlot, AboutMedia> = {
  about_hero: { src: "/media/about_hero.webp", alt: "Contemporary classroom facilities at Bilingual Idol Language Centre." },
  about_method: { src: "/media/about_method.webp", alt: "Language-learning materials arranged for guided practice." },
  about_classroom: { src: "/media/about_classroom.webp", alt: "A bright, organised contemporary language classroom in Setapak." },
  about_community: { src: "/media/about_community.webp", alt: "Learners collaborating around a table during an interactive language activity." },
  about_cta: { src: "/media/about_cta.webp", alt: "A welcoming consultation corner prepared for a conversation about learning." },
};

function resolveAboutMedia(slot: AboutMediaSlot, items: Array<{ slot: string; publicUrl: string; altText: string }> | undefined): AboutMedia {
  const managed = items?.find(item => item.slot === slot);
  return managed ? { src: managed.publicUrl, alt: managed.altText } : ABOUT_MEDIA_FALLBACKS[slot];
}

function AboutImage({ media, className, loading = "lazy" }: { media: AboutMedia; className?: string; loading?: "eager" | "lazy" }) {
  return <img className={className} src={media.src} alt={media.alt} loading={loading} decoding="async" />;
}

export default function About() {
  const { t, isRTL, language } = useLanguage();
  const [activeApproach, setActiveApproach] = useState(0);
  const team = trpc.content.publicTeamProfiles.useQuery();
  const media = trpc.media.publicList.useQuery();
  const mediaItems = media.data;
  const heroMedia = resolveAboutMedia("about_hero", mediaItems);
  const methodMedia = resolveAboutMedia("about_method", mediaItems);
  const classroomMedia = resolveAboutMedia("about_classroom", mediaItems);
  const communityMedia = resolveAboutMedia("about_community", mediaItems);
  const ctaMedia = resolveAboutMedia("about_cta", mediaItems);

  const approach = [
    { icon: Compass, title: t("about.approach1Title"), body: t("about.approach1Body") },
    { icon: BookMarked, title: t("about.approach2Title"), body: t("about.approach2Body") },
    { icon: Heart, title: t("about.approach3Title"), body: t("about.approach3Body") },
  ];

  return (
    <PublicLayout>
      <div id="about-page-container" data-page="about" className={`simple-route-page about-page page-about about-page--compact-spacing ${isRTL ? "is-rtl" : ""}`}>
        <header id="about-hero-header" className="simple-route-header about-hero-header">
          <div className="about-hero-copy py-8 sm:py-12 md:py-16 pr-6 sm:pr-8 md:pr-12">
            <p className="simple-eyebrow text-indigo-600/90 font-semibold tracking-wide uppercase">{t("about.eyebrow")}</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mt-2 mb-4 leading-tight">{t("about.heroTitle")}</h1>
            <p className="text-slate-600 text-base md:text-lg leading-relaxed">{t("about.heroSubtitle")}</p>
          </div>
          <div className="about-hero-media">
            <AboutImage media={heroMedia} loading="eager" />
          </div>
        </header>

        <section id="about-story-section" className="simple-route-section about-story-section about-section--compact-spacing">
          {/* DESKTOP VERSION (hidden md:grid) */}
          <div className="about-story-grid about-story-grid--surface md:!ml-0 hidden md:grid">
            <div className="about-story-copy bg-white border border-slate-200/60 rounded-2xl p-6 sm:p-8 md:p-10 shadow-sm transition-all hover:shadow-md hover:border-slate-300/80">
              <p className="simple-eyebrow text-indigo-600/90 font-semibold tracking-wide uppercase">{t("about.storyEyebrow")}</p>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mt-2 mb-4">{t("about.storyTitle")}</h2>
              <p className="simple-body-copy text-slate-600 leading-relaxed text-base mb-6">{t("about.storyBody")}</p>
              <Link href="/programs" className="simple-text-link">
                {t("about.explorePrograms")}
              </Link>
            </div>
            <figure className="about-feature-media about-story-media--spaced">
              <AboutImage media={classroomMedia} />
            </figure>
          </div>

          {/* MOBILE VERSION (block md:hidden) - Beautiful, Compact & Consolidated Story Card */}
          <div className="block md:hidden px-4 py-2">
            <div className="bg-white rounded-3xl border border-[#cbdcfc]/45 shadow-[0_8px_30px_rgba(23,63,173,0.05)] overflow-hidden transition-all duration-300">
              {/* Top illustrative image nested inside the card with high-end editorial styling */}
              <div className="h-44 w-full overflow-hidden relative">
                <AboutImage media={classroomMedia} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>

              {/* Clean, editorial content area with highly professional typography */}
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-extrabold text-[#173fad] uppercase tracking-wider leading-none">
                    {t("about.storyEyebrow")}
                  </p>
                  <h2 className="text-lg font-extrabold text-[#10253e] tracking-tight leading-tight">
                    {t("about.storyTitle")}
                  </h2>
                </div>
                
                <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                  {t("about.storyBody")}
                </p>

                <div className="pt-2 border-t border-slate-50">
                  <Link href="/programs" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#173fad] hover:text-[#173fad]/80 transition-colors">
                    <span>{t("about.explorePrograms")}</span>
                    <ChevronRight size={14} className={isRTL ? "rotate-180" : ""} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about-approach-section" className="simple-route-section about-approach-section about-section--compact-spacing">
          <div className="about-approach-intro about-approach-intro--surface flex flex-col md:flex-row md:items-start md:justify-between gap-6 md:gap-12">
            <div className="flex flex-col gap-1.5 md:gap-2">
              <p className="simple-eyebrow text-indigo-600/90 font-semibold tracking-wide uppercase">{t("about.approachEyebrow")}</p>
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">{t("about.approachTitle")}</h2>
            </div>
            <p className="about-approach-intro-copy text-slate-500 text-base md:text-lg leading-relaxed max-w-2xl border-l-2 border-indigo-500/30 pl-4 py-1">{t("about.approachSubtitle")}</p>
          </div>

          {/* DESKTOP VERSION - SIDE BY SIDE WITH RICH GRAPHIC (md:block hidden) */}
          <div className="hidden md:block">
            <div className="about-method-layout mt-8">
              <div className="simple-approach-list about-approach-list about-approach-list--surface">
                {approach.map(({ icon: Icon, title, body }) => (
                  <article key={title}>
                    <Icon size={18} />
                    <div>
                      <strong>{title}</strong>
                      <p>{body}</p>
                    </div>
                  </article>
                ))}
              </div>
              <figure className="about-feature-media about-method-media">
                <AboutImage media={methodMedia} />
              </figure>
            </div>
          </div>

          {/* MOBILE VERSION - COMPACT INTERACTIVE CAPSULE SELECTOR (block md:hidden) */}
          <div className="block md:hidden mt-6">
            {/* Highly Professional Vertical Segmented Button Stack */}
            <div className="flex flex-col gap-2 w-full">
              {approach.map(({ icon: Icon, title }, idx) => {
                const isActive = activeApproach === idx;
                const ArrowIcon = isRTL ? ChevronLeft : ChevronRight;
                return (
                  <button
                    key={title}
                    type="button"
                    onClick={() => setActiveApproach(idx)}
                    className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl border text-xs font-extrabold transition-all duration-300 cursor-pointer ${
                      isActive
                        ? "bg-[#173fad] border-[#173fad] text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon size={15} className={`shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span className={`text-[11px] sm:text-xs ${isRTL ? "text-right" : "text-left"}`}>
                        {title}
                      </span>
                    </div>
                    <ArrowIcon
                      size={14}
                      className={`shrink-0 transition-all duration-300 ${
                        isActive ? "opacity-100 scale-110" : "opacity-30"
                      } ${isActive && !isRTL ? "translate-x-0.5" : ""} ${isActive && isRTL ? "-translate-x-0.5" : ""}`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Showcase Detail Card */}
            <div className="bg-white border border-slate-200/70 rounded-2xl p-5 mt-4 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-50/30 to-transparent pointer-events-none rounded-bl-3xl" />
              
              <div className="flex items-center gap-2.5 mb-3" dir={isRTL ? "rtl" : "ltr"}>
                <div className="w-8 h-8 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-center text-[#173fad] shrink-0">
                  {(() => {
                    const ActiveIcon = approach[activeApproach].icon;
                    return <ActiveIcon size={15} className="stroke-[2.2]" />;
                  })()}
                </div>
                <strong className="text-xs font-extrabold text-slate-800 leading-tight">
                  {approach[activeApproach].title}
                </strong>
              </div>
              
              <p className={`text-slate-500 text-[12px] leading-relaxed ${isRTL ? "text-right" : "text-left"}`}>
                {approach[activeApproach].body}
              </p>
            </div>
          </div>
        </section>

        <section id="about-community-section" className="simple-route-section simple-section-tint about-community-section">
          {/* DESKTOP VERSION (hidden md:grid) */}
          <div className="about-community-grid hidden md:grid">
            <figure className="about-feature-media about-community-media">
              <AboutImage media={communityMedia} />
              <figcaption>{t("about.communityCaption")}</figcaption>
            </figure>
            <div className="about-community-copy bg-white border border-slate-200/60 rounded-2xl p-6 sm:p-8 md:p-10 shadow-sm transition-all hover:shadow-md hover:border-slate-300/80">
              <p className="simple-eyebrow text-indigo-600/90 font-semibold tracking-wide uppercase">{t("about.communityEyebrow")}</p>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mt-2 mb-4">{t("about.communityTitle")}</h2>
              <p className="simple-body-copy text-slate-600 leading-relaxed text-base mb-6">
                {language === "ms"
                  ? "Persekitaran pembelajaran pusat ini menggabungkan komunikasi praktikal, kesedaran budaya dan sokongan untuk laluan pembelajaran berbeza."
                  : language === "ar"
                  ? "تجمع بيئة التعلم في المركز بين التواصل العملي، الوعي الثقافي والدعم المستمر لمختلف المسارات التعليمية."
                  : "The centre’s learning environment brings together practical communication, cultural awareness and support for different learning routes."}
              </p>
              <Link href="/contact" className="simple-text-link">
                {t("nav.contact")}
              </Link>
            </div>
          </div>

          {/* MOBILE VERSION (block md:hidden) - Beautiful, Compact & Consolidated Community Card */}
          <div className="block md:hidden px-0 py-2 mt-5">
            <div className="bg-white rounded-3xl border border-[#cbdcfc]/45 shadow-[0_8px_30px_rgba(23,63,173,0.05)] overflow-hidden transition-all duration-300">
              <div className="h-44 w-full overflow-hidden relative">
                <AboutImage media={communityMedia} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
                <span className="absolute bottom-3 start-3 text-[11px] font-semibold text-white/95 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20 select-none">
                  {t("about.communityCaption")}
                </span>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-extrabold text-[#173fad] uppercase tracking-wider leading-none">
                    {t("about.communityEyebrow")}
                  </p>
                  <h2 className="text-lg font-extrabold text-[#10253e] tracking-tight leading-tight">
                    {t("about.communityTitle")}
                  </h2>
                </div>
                
                <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                  {language === "ms"
                    ? "Persekitaran pembelajaran pusat ini menggabungkan komunikasi praktikal, kesedaran budaya dan sokongan untuk laluan pembelajaran berbeza."
                    : language === "ar"
                    ? "تجمع بيئة التعلم في المركز بين التواصل العملي، الوعي الثقافي والدعم المستمر لمختلف المسارات التعليمية."
                    : "The centre’s learning environment brings together practical communication, cultural awareness and support for different learning routes."}
                </p>

                <div className="pt-2 border-t border-slate-50">
                  <Link href="/contact" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#173fad] hover:text-[#173fad]/80 transition-colors">
                    <span>{t("nav.contact")}</span>
                    <ChevronRight size={14} className={isRTL ? "rotate-180" : ""} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about-team-section" className="simple-route-section about-team-section about-section--compact-spacing bg-gradient-to-b from-slate-50 to-white border border-slate-100 rounded-3xl p-4 sm:p-6 md:p-12 shadow-xs">
          <div className="simple-section-heading about-team-heading--surface">
            <div>
              <p className="simple-eyebrow">{t("about.teamEyebrow")}</p>
              <h2>{t("about.teamTitle")}</h2>
            </div>
            <Link href="/contact" className="simple-text-link about-team-contact-link">
              {t("nav.contact")}
            </Link>
          </div>
          {team.data?.length ? (
            <>
              {/* DESKTOP VERSION (hidden md:grid) */}
              <div className="about-team-grid hidden md:grid">
                {team.data.map((member) => {
                  const portrait =
                    member.id === 1 ? "/media/team_elena.webp" :
                    member.id === 2 ? "/media/team_marcus.webp" :
                    "/media/team_aisyah.webp";
                  const langList = member.languages.split(",").map(l => l.trim()).filter(Boolean);
                  return (
                    <article key={member.id} className="about-team-card">
                      <div className="about-team-card-image-wrap">
                        <img src={portrait} alt={`${member.name} - ${member.role}`} className="about-team-card-image" loading="lazy" decoding="async" />
                        <span className="about-team-card-badge">{member.role}</span>
                      </div>
                      <div className="about-team-card-body">
                        <div className="about-team-card-header">
                          <strong className="about-team-card-name">{member.name}</strong>
                        </div>
                        <p className="about-team-card-bio">{member.bio}</p>
                        <div className="about-team-card-languages">
                          <span className="about-team-lang-label">
                            {language === "ms" ? "Bahasa diajar & ditutur:" : language === "ar" ? "اللغات التي يتم تدريسها:" : "Languages taught & spoken:"}
                          </span>
                          <div className="about-team-lang-tags">
                            {langList.map((lang) => (
                              <span key={lang} className="about-team-lang-tag">
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* MOBILE VERSION (block md:hidden) - Compact Horizontal Swipe Carousel */}
              <div className="block md:hidden mt-4">
                <div className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 no-scrollbar scroll-smooth">
                  {team.data.map((member) => {
                    const portrait =
                      member.id === 1 ? "/media/team_elena.webp" :
                      member.id === 2 ? "/media/team_marcus.webp" :
                      "/media/team_aisyah.webp";
                    const langList = member.languages.split(",").map(l => l.trim()).filter(Boolean);
                    return (
                      <article key={member.id} className="w-[82vw] max-w-[300px] shrink-0 snap-center bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
                        <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                          <img src={portrait} alt={`${member.name} - ${member.role}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                          <span className="absolute bottom-2.5 start-2.5 bg-[#10253e]/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                            {member.role}
                          </span>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
                          <div>
                            <strong className="block text-sm font-extrabold text-[#10253e]">{member.name}</strong>
                            <p className="text-slate-500 text-xs leading-relaxed mt-1 line-clamp-3">{member.bio}</p>
                          </div>
                          <div className="pt-2 border-t border-slate-100">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                              {language === "ms" ? "Bahasa:" : language === "ar" ? "اللغات:" : "Languages:"}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {langList.map((lang) => (
                                <span key={lang} className="text-[10px] font-semibold text-[#173fad] bg-[#eef3ff] px-2 py-0.5 rounded-md">
                                  {lang}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-1.5 pt-2">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {language === "ms" ? "Leret untuk melihat pendidik lain →" : language === "ar" ? "اسحب للاستكشاف ←" : "Swipe to explore instructors →"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="simple-empty-state">
              <p>
                {language === "ms"
                  ? "Profil pendidik hanya ditunjukkan apabila pusat telah mengesahkan maklumat."
                  : language === "ar"
                  ? "يتم عرض ملفات المعلمين فقط بعد تأكيد المعلومات من قبل إدارة المركز."
                  : "Educator profiles are shown only when the centre has confirmed the information."}
              </p>
            </div>
          )}
        </section>

        <section id="about-contact-panel-section" className="about-contact-panel about-contact-panel--light !p-0 md:!p-10 border-0 md:border md:border-slate-200/80 bg-transparent md:bg-white shadow-none md:shadow-sm">
          {/* DESKTOP VERSION (hidden md:flex) */}
          <div className="hidden md:flex items-center justify-between gap-8 w-full">
            <div className="about-contact-copy about-contact-copy--light">
              <p className="simple-eyebrow about-contact-eyebrow--light">{t("home.contactStripTitle")}</p>
              <h2 className="about-contact-title--light">{t("about.heroTitle")}</h2>
              <p className="about-contact-body--light">{t("contact.formSubtitle")}</p>
              <Link href="/contact" className="simple-primary-link about-contact-link--light">
                {t("nav.contact")}
              </Link>
            </div>
            <div className="about-contact-media">
              <AboutImage media={ctaMedia} />
            </div>
          </div>

          {/* MOBILE VERSION (block md:hidden) - Unified, High-Converting Hero CTA Card */}
          <div className="block md:hidden w-full bg-gradient-to-br from-[#10253e] to-[#173fad] text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-blue-200 bg-white/10 px-2.5 py-1 rounded-full">
                {t("home.contactStripTitle")}
              </span>
              <h2 className="text-xl font-extrabold text-white leading-snug">
                {language === "ms" ? "Mulakan Perjalanan Bahasa Anda di BILC" : language === "ar" ? "ابدأ رحلتك اللغوية في مركز BILC" : "Ready to Start Your Language Journey?"}
              </h2>
              <p className="text-blue-100/85 text-xs leading-relaxed max-w-sm">
                {t("contact.formSubtitle")}
              </p>
              <div className="pt-2">
                <Link
                  href="/contact"
                  className="w-full min-h-11 rounded-xl bg-white text-[#10253e] hover:bg-blue-50 font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all"
                >
                  <span>{t("nav.contact")}</span>
                  <ChevronRight size={15} className={isRTL ? "rotate-180" : ""} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
