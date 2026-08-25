import { BookMarked, Compass, Heart, UsersRound } from "lucide-react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";

type AboutMediaSlot = "about_hero" | "about_method" | "about_classroom" | "about_community" | "about_cta";

type AboutMedia = {
  src: string;
  alt: string;
};

const approach = [
  { icon: Compass, title: "Start with the learner’s goal", body: "Consultation and placement guidance help identify an appropriate language route before enrolment." },
  { icon: BookMarked, title: "Practise actively", body: "The centre describes interactive learning supported by digital classroom tools and guided practice." },
  { icon: Heart, title: "Build confidence steadily", body: "Learning pathways are designed around language development, cultural awareness and practical communication." },
];

const ABOUT_MEDIA_FALLBACKS: Record<AboutMediaSlot, AboutMedia> = {
  about_hero: { src: "/manus-storage/about-hero_7f016d63.jpg", alt: "Learners taking part in a calm language class." },
  about_method: { src: "/manus-storage/about-method_83b25818.jpg", alt: "Language-learning materials arranged for guided practice." },
  about_classroom: { src: "/manus-storage/about-classroom_8f0d35b2.jpg", alt: "A bright, organised contemporary language classroom." },
  about_community: { src: "/manus-storage/about-community_8a879b9b.jpg", alt: "Learners collaborating around a table during a language activity." },
  about_cta: { src: "/manus-storage/about-cta_4823f44c.jpg", alt: "A quiet consultation corner prepared for a conversation about learning." },
};

function resolveAboutMedia(slot: AboutMediaSlot, items: Array<{ slot: string; publicUrl: string; altText: string }> | undefined): AboutMedia {
  const managed = items?.find(item => item.slot === slot);
  return managed ? { src: managed.publicUrl, alt: managed.altText } : ABOUT_MEDIA_FALLBACKS[slot];
}

function AboutImage({ media, className, loading = "lazy" }: { media: AboutMedia; className?: string; loading?: "eager" | "lazy" }) {
  return <img className={className} src={media.src} alt={media.alt} loading={loading} decoding="async" />;
}

export default function About() {
  const team = trpc.content.publicTeamProfiles.useQuery();
  const media = trpc.media.publicList.useQuery();
  const mediaItems = media.data;
  const heroMedia = resolveAboutMedia("about_hero", mediaItems);
  const methodMedia = resolveAboutMedia("about_method", mediaItems);
  const classroomMedia = resolveAboutMedia("about_classroom", mediaItems);
  const communityMedia = resolveAboutMedia("about_community", mediaItems);
  const ctaMedia = resolveAboutMedia("about_cta", mediaItems);

  return (
    <PublicLayout>
      <div className="simple-route-page about-page">
        <header className="simple-route-header about-hero-header">
          <div className="about-hero-copy">
            <p className="simple-eyebrow">About</p>
            <h1>Language learning built around clear progress.</h1>
            <p>Bilingual Idol Language Centre supports learners in Kuala Lumpur with language pathways, consultation and a focus on confident communication.</p>
          </div>
          <div className="about-hero-media">
            <AboutImage media={heroMedia} loading="eager" />
          </div>
        </header>

        <section className="simple-route-section about-story-section">
          <div className="about-story-grid about-story-grid--surface">
            <div className="about-story-copy">
              <p className="simple-eyebrow">A considered start</p>
              <h2>What the centre supports</h2>
              <p className="simple-body-copy">The centre describes a learning environment with interactive classrooms, digital learning resources, placement guidance and personalised language routes.</p>
              <Link href="/programs" className="simple-text-link">Explore programmes</Link>
            </div>
            <figure className="about-feature-media about-story-media--spaced">
              <AboutImage media={classroomMedia} />
            </figure>
          </div>
        </section>

        <section className="simple-route-section about-approach-section">
          <div className="about-approach-intro about-approach-intro--surface">
            <div>
              <p className="simple-eyebrow">Learning approach</p>
              <h2>How learning is supported</h2>
            </div>
            <p className="about-approach-intro-copy">Clear next steps, active practice and steady confidence-building shape the centre’s public learning approach.</p>
          </div>
          <div className="about-method-layout">
            <div className="simple-approach-list about-approach-list about-approach-list--surface">
              {approach.map(({ icon: Icon, title, body }) => <article key={title}><Icon size={18} /><div><strong>{title}</strong><p>{body}</p></div></article>)}
            </div>
            <figure className="about-feature-media about-method-media">
              <AboutImage media={methodMedia} />
            </figure>
          </div>
        </section>

        <section className="simple-route-section simple-section-tint about-community-section">
          <div className="about-community-grid">
            <figure className="about-feature-media about-community-media">
              <AboutImage media={communityMedia} />
              <figcaption>Language grows through meaningful exchange and shared practice.</figcaption>
            </figure>
            <div className="about-community-copy">
              <p className="simple-eyebrow">People and practice</p>
              <h2>A place to keep moving forward</h2>
              <p className="simple-body-copy">The centre’s learning environment brings together practical communication, cultural awareness and support for different learning routes.</p>
              <Link href="/contact" className="simple-text-link">Speak with the centre</Link>
            </div>
          </div>
        </section>

        <section className="simple-route-section about-team-section">
          <div className="simple-section-heading about-team-heading--surface">
            <div><p className="simple-eyebrow">Educators</p><h2>Team information</h2></div>
            <Link href="/contact" className="simple-text-link about-team-contact-link">Contact the centre</Link>
          </div>
          {team.data?.length ? <div className="simple-team-list">{team.data.map(member => <article key={member.id}><UsersRound size={18} /><div><strong>{member.name}</strong><span>{member.role}</span><p>{member.bio}</p><small>Languages: {member.languages}</small></div></article>)}</div> : <div className="simple-empty-state"><p>Educator profiles are shown only when the centre has confirmed the information.</p></div>}
        </section>

        <section className="about-contact-panel about-contact-panel--light">
          <div className="about-contact-copy about-contact-copy--light">
            <p className="simple-eyebrow about-contact-eyebrow--light">Start a conversation</p>
            <h2 className="about-contact-title--light">Choose a clear next step for learning.</h2>
            <p className="about-contact-body--light">Ask about programmes, placement guidance or the most suitable route for the learner.</p>
            <Link href="/contact" className="simple-primary-link about-contact-link--light">Contact the centre</Link>
          </div>
          <div className="about-contact-media"><AboutImage media={ctaMedia} /></div>
        </section>
      </div>
    </PublicLayout>
  );
}
