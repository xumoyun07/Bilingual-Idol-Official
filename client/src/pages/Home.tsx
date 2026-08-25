import { ArrowRight, BookOpen, CalendarDays, Check, MessageCircle, UserRound } from "lucide-react";
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
    <section className="simple-home-intro simple-home-intro-media simple-home-intro-offset simple-home-intro--refined simple-home-intro--desktop-geometry simple-home-intro--mobile-480 simple-home-intro--desktop-580">
      {heroPoster ? <img className="simple-home-hero-media" src={heroPoster.publicUrl} alt="" aria-hidden="true" fetchPriority="high" decoding="async" /> : null}
      {heroVideo ? <video className="simple-home-hero-media" src={heroVideo.publicUrl} poster={heroPoster?.publicUrl} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" data-hero-video="true" /> : null}
      <div className="simple-home-intro-content simple-home-intro-content--desktop-offset simple-home-intro-content--desktop-geometry"><p className="simple-eyebrow">Language learning in Setapak</p><h1>Find the right next step for learning.</h1><p>Explore language programmes, ask the centre a question, or sign in to the information prepared for your account.</p><div className="simple-actions-row"><Link href="/programs" className="simple-button">View programmes <ArrowRight size={17} /></Link><Link href="/contact" className="simple-button simple-button-quiet">Contact the centre</Link></div></div>
    </section>

    <section className="simple-section simple-home-panel simple-home-start-panel"><div className="simple-section-heading"><div><p className="simple-eyebrow">Start here</p><h2>Choose a clear next step.</h2></div><p>Compare course guidance, speak with the centre or sign in to information prepared for your account.</p></div><div className="simple-task-grid"><Link href="/programs" className="simple-task-card">{programmesMedia ? <img className="simple-task-media" src={programmesMedia.publicUrl} alt={programmesMedia.altText} loading="lazy" decoding="async" /> : null}<BookOpen size={22} /><div><h3>Browse programmes</h3><p>View language options and the published 2026 course guidance.</p></div><ArrowRight size={18} /></Link><Link href="/contact" className="simple-task-card">{contactMedia ? <img className="simple-task-media" src={contactMedia.publicUrl} alt={contactMedia.altText} loading="lazy" decoding="async" /> : null}<MessageCircle size={22} /><div><h3>Ask a question</h3><p>Discuss a learner’s goal, course route or next available intake.</p></div><ArrowRight size={18} /></Link><Link href="/login" className="simple-task-card">{accountMedia ? <img className="simple-task-media" src={accountMedia.publicUrl} alt={accountMedia.altText} loading="lazy" decoding="async" /> : null}<UserRound size={22} /><div><h3>Access your account</h3><p>Sign in with the secure details issued by the centre.</p></div><ArrowRight size={18} /></Link></div></section>

    <section className="simple-section simple-language-band simple-home-panel simple-home-language-panel"><div><p className="simple-eyebrow">Language options</p><h2>Start with the language that matters to you.</h2><p>Explore English, Bahasa Melayu, Mandarin, Arabic, Japanese and Korean with guidance from the centre.</p></div><ul>{["English", "Bahasa Melayu", "Mandarin", "Arabic", "Japanese", "Korean"].map(language => <li key={language}><Check size={16} aria-hidden="true" />{language}</li>)}</ul><Link href="/contact" className="simple-text-link">Discuss your learning goal <ArrowRight size={16} /></Link></section>

    <section className="simple-section simple-section-tint simple-home-programmes-panel simple-home-programmes-geometry"><div className="simple-section-heading"><div><p className="simple-eyebrow">Programmes</p><h2>Course guidance for your next step.</h2></div><Link href="/programs" className="simple-text-link">See the course guide <ArrowRight size={16} /></Link></div>{programmes.isLoading ? <div className="simple-programme-list">{[1, 2, 3].map(item => <div key={item} className="simple-loading-row" />)}</div> : programmes.data?.length ? <div className="simple-programme-list">{programmes.data.slice(0, 4).map(programme => <Link key={programme.slug} href={`/programs/${programme.slug}`} className="simple-programme-row"><div><strong>{programme.title}</strong><span>{programme.language} · {programme.level} · {programme.ageGroup}</span></div><ArrowRight size={18} /></Link>)}</div> : <div className="simple-empty-state"><CalendarDays size={22} /><p>Explore the published 2026 course guide, then ask the centre to confirm the right course, fee and intake.</p><Link href="/programs" className="simple-text-link">View course guidance <ArrowRight size={16} /></Link></div>}</section>

    <section className="simple-contact-strip simple-contact-strip--refined simple-contact-strip--geometry"><div><p className="simple-eyebrow">Need guidance?</p><h2>Tell us about the learner and the language goal.</h2><p>The centre can help identify a useful next step.</p></div><Link href="/enroll" className="simple-button">Make an enquiry <ArrowRight size={17} /></Link></section>
  </div></PublicLayout>;
}
