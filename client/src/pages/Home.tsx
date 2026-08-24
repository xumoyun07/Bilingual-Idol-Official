import { ArrowRight, BookOpen, CalendarDays, MessageCircle, UserRound } from "lucide-react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const programmes = trpc.content.publicPrograms.useQuery();
  const media = trpc.media.publicList.useQuery();
  const mediaBySlot = new Map((media.data ?? []).map(item => [item.slot, item]));
  const heroVideo = mediaBySlot.get("home_hero_video");
  const heroPoster = mediaBySlot.get("home_hero_poster");
  const programmesMedia = mediaBySlot.get("home_task_programmes");
  const contactMedia = mediaBySlot.get("home_task_contact");
  const accountMedia = mediaBySlot.get("home_task_account");
  return <PublicLayout><div className="simple-public-page">
    <section className="simple-home-intro simple-home-intro-media">
      {heroPoster ? <img className="simple-home-hero-media" src={heroPoster.publicUrl} alt="" aria-hidden="true" fetchPriority="high" decoding="async" /> : null}
      {heroVideo ? <video className="simple-home-hero-media" src={heroVideo.publicUrl} poster={heroPoster?.publicUrl} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" data-hero-video="true" /> : null}
      <div className="simple-home-intro-content"><p className="simple-eyebrow">Language learning in Setapak</p><h1>Find the right next step for learning.</h1><p>Explore language programmes, ask the centre a question, or sign in to the information prepared for your account.</p><div className="simple-actions-row"><Link href="/programs" className="simple-button">View programmes <ArrowRight size={17} /></Link><Link href="/contact" className="simple-button simple-button-quiet">Contact the centre</Link></div></div>
    </section>

    <section className="simple-section"><div className="simple-section-heading"><div><p className="simple-eyebrow">Start here</p><h2>What do you need today?</h2></div><p>Choose one clear action. You can ask for help before choosing a programme.</p></div><div className="simple-task-grid"><Link href="/programs" className="simple-task-card">{programmesMedia ? <img className="simple-task-media" src={programmesMedia.publicUrl} alt={programmesMedia.altText} loading="lazy" decoding="async" /> : null}<BookOpen size={22} /><div><h3>Browse programmes</h3><p>Filter confirmed options by language, learner group and level.</p></div><ArrowRight size={18} /></Link><Link href="/contact" className="simple-task-card">{contactMedia ? <img className="simple-task-media" src={contactMedia.publicUrl} alt={contactMedia.altText} loading="lazy" decoding="async" /> : null}<MessageCircle size={22} /><div><h3>Ask a question</h3><p>Call, email, WhatsApp or send an enquiry to the centre.</p></div><ArrowRight size={18} /></Link><Link href="/login" className="simple-task-card">{accountMedia ? <img className="simple-task-media" src={accountMedia.publicUrl} alt={accountMedia.altText} loading="lazy" decoding="async" /> : null}<UserRound size={22} /><div><h3>Access your account</h3><p>Sign in with the details issued by the centre.</p></div><ArrowRight size={18} /></Link></div></section>

    <section className="simple-section simple-section-tint"><div className="simple-section-heading"><div><p className="simple-eyebrow">Programmes</p><h2>Current programme information</h2></div><Link href="/programs" className="simple-text-link">See all programmes <ArrowRight size={16} /></Link></div>{programmes.isLoading ? <div className="simple-programme-list">{[1, 2, 3].map(item => <div key={item} className="simple-loading-row" />)}</div> : programmes.data?.length ? <div className="simple-programme-list">{programmes.data.slice(0, 4).map(programme => <Link key={programme.slug} href={`/programs/${programme.slug}`} className="simple-programme-row"><div><strong>{programme.title}</strong><span>{programme.language} · {programme.level} · {programme.ageGroup}</span></div><ArrowRight size={18} /></Link>)}</div> : <div className="simple-empty-state"><CalendarDays size={22} /><p>Programme details are being updated. Contact the centre for guidance.</p><Link href="/contact" className="simple-text-link">Contact the centre <ArrowRight size={16} /></Link></div>}</section>

    <section className="simple-contact-strip"><div><p className="simple-eyebrow">Need guidance?</p><h2>Tell us about the learner and the language goal.</h2><p>The centre can help identify a useful next step.</p></div><Link href="/enroll" className="simple-button">Make an enquiry <ArrowRight size={17} /></Link></section>
  </div></PublicLayout>;
}
