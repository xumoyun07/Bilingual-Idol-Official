import { BookMarked, Compass, Heart, UsersRound } from "lucide-react";
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
          <div className="about-story-grid about-story-grid--surface md:!ml-0">
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
        </section>

        <section id="about-approach-section" className="simple-route-section about-approach-section about-section--compact-spacing">
          <div className="about-approach-intro about-approach-intro--surface flex flex-col md:flex-row md:items-start md:justify-between gap-6 md:gap-12">
            <div className="flex flex-col gap-1.5 md:gap-2">
              <p className="simple-eyebrow text-indigo-600/90 font-semibold tracking-wide uppercase">{t("about.approachEyebrow")}</p>
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">{t("about.approachTitle")}</h2>
            </div>
            <p className="about-approach-intro-copy text-slate-500 text-base md:text-lg leading-relaxed max-w-2xl border-l-2 border-indigo-500/30 pl-4 py-1">{t("about.approachSubtitle")}</p>
          </div>
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
        </section>

        <section id="about-community-section" className="simple-route-section simple-section-tint about-community-section">
          <div className="about-community-grid">
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
        </section>

        <section id="about-team-section" className="simple-route-section about-team-section about-section--compact-spacing bg-gradient-to-b from-slate-50/50 to-white border border-slate-100 rounded-3xl p-6 sm:p-8 md:p-12 shadow-xs">
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
            <div className="about-team-grid">
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

        <section id="about-contact-panel-section" className="about-contact-panel about-contact-panel--light">
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
        </section>
      </div>
    </PublicLayout>
  );
}
