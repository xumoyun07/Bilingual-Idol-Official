import { Link, useLocation } from "wouter";
import { ArrowUpRight, ChevronDown, Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Programmes", href: "/programs" },
  { label: "About", href: "/about" },
  { label: "News", href: "/news" },
  { label: "Contact", href: "/contact" },
];

function Mark() {
  return <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f07e5d] font-display text-xl text-[#10253e]">BI</span>;
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  useEffect(() => {
    const metadata: Record<string, { title: string; description: string }> = {
      "/": { title: "Bilingual Idol Language Centre | Kuala Lumpur", description: "Thoughtful language learning for children, teens, adults, and professionals in Kuala Lumpur." },
      "/programs": { title: "Programmes & Courses | Bilingual Idol", description: "Explore confirmed language programmes by age group, language, level, schedule, and fee information." },
      "/about": { title: "About Bilingual Idol Language Centre", description: "Discover Bilingual Idol’s mission, vision, teaching approach, and educator profiles." },
      "/news": { title: "Announcements & News | Bilingual Idol", description: "Verified updates, events, and holiday notices from Bilingual Idol Language Centre." },
      "/contact": { title: "Contact Bilingual Idol | Kuala Lumpur", description: "Contact Bilingual Idol Language Centre, find the office location, operating hours, and inquiry form." },
      "/enroll": { title: "Enroll Now | Bilingual Idol Language Centre", description: "Send a validated enrollment request for a Bilingual Idol language programme." },
    };
    const selected = metadata[location] ?? (location.startsWith("/programs/") ? { title: "Programme Details | Bilingual Idol", description: "Confirmed programme information from Bilingual Idol Language Centre." } : metadata["/"]);
    document.title = selected.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", selected.description);
  }, [location]);
  return (
    <div className="page-wrap">
      <a className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-[#10253e]" href="#main-content">Skip to content</a>
      <div className="bg-[#10253e] text-white/80">
        <div className="site-container flex min-h-9 items-center justify-between gap-3 text-[11px] font-bold tracking-[0.08em] uppercase">
          <span className="hidden sm:inline">English · Bahasa Melayu · Mandarin · Arabic · Japanese · Korean</span>
          <span className="sm:hidden">A language community in Kuala Lumpur</span>
          <a className="inline-flex items-center gap-1.5 hover:text-white" href="tel:+60367310449"><Phone size={12} aria-hidden="true" /> +603 6731 0449</a>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-[#e8dcc9]/80 bg-[#fbf8f2]/90 backdrop-blur-xl">
        <div className="site-container flex h-[76px] items-center justify-between gap-5">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Bilingual Idol Language Centre home">
            <Mark />
            <span className="min-w-0 leading-none"><strong className="block truncate text-sm font-extrabold tracking-[-0.03em] text-[#10253e]">Bilingual Idol</strong><span className="mt-1 block text-[9px] font-extrabold tracking-[0.14em] uppercase text-[#5e8c7b]">Language Centre</span></span>
          </Link>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
            {navigation.map(item => <Link key={item.href} href={item.href} className={`text-sm font-bold ${location === item.href ? "text-[#f07e5d]" : "text-[#29415b] hover:text-[#f07e5d]"}`}>{item.label}</Link>)}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <a href="https://wa.me/60367310449" target="_blank" rel="noreferrer" className="text-sm font-bold text-[#29415b] hover:text-[#f07e5d]">WhatsApp</a>
            <Link href="/enroll" className="pressable inline-flex items-center gap-2 rounded-full bg-[#10253e] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_30px_rgba(16,37,62,.18)] hover:bg-[#f07e5d] hover:text-[#10253e]">Enroll Now <ArrowUpRight size={16} aria-hidden="true" /></Link>
          </div>
          <button className="grid h-11 w-11 place-items-center rounded-full border border-[#d5c6b1] text-[#10253e] lg:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open}>{open ? <X /> : <Menu />}</button>
        </div>
        {open && <nav className="border-t border-[#e8dcc9] bg-[#fbf8f2] px-4 pb-5 pt-3 lg:hidden" aria-label="Mobile navigation"><div className="site-container grid gap-1">{navigation.map(item => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`rounded-xl px-4 py-3 text-sm font-extrabold ${location === item.href ? "bg-[#10253e] text-white" : "text-[#29415b] hover:bg-[#f2eade]"}`}>{item.label}</Link>)}<Link href="/enroll" onClick={() => setOpen(false)} className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#f07e5d] px-4 py-3 text-sm font-extrabold text-[#10253e]">Enroll Now <ArrowUpRight size={16} /></Link></div></nav>}
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
      <footer className="bg-[#10253e] text-white">
        <div className="site-container grid gap-10 py-14 md:grid-cols-[1.15fr_.8fr_.9fr]">
          <div><div className="flex items-center gap-3"><Mark /><div><p className="font-bold">Bilingual Idol</p><p className="text-[10px] font-extrabold tracking-[.14em] uppercase text-[#a7c6b8]">Language Centre</p></div></div><p className="mt-5 max-w-sm text-sm leading-7 text-white/65">A welcoming place to learn, practise, and connect through language — in Kuala Lumpur and beyond.</p></div>
          <div><p className="text-xs font-extrabold tracking-[.12em] uppercase text-[#a7c6b8]">Explore</p><div className="mt-4 grid gap-2">{navigation.map(item => <Link key={item.href} href={item.href} className="w-fit text-sm text-white/75 hover:text-[#f3b59f]">{item.label}</Link>)}<Link href="/enroll" className="w-fit text-sm text-white/75 hover:text-[#f3b59f]">Enroll Now</Link></div></div>
          <div><p className="text-xs font-extrabold tracking-[.12em] uppercase text-[#a7c6b8]">Visit & contact</p><address className="mt-4 not-italic text-sm leading-7 text-white/75">E-03-10, StarParc Point<br />Jalan Genting Kelang, Setapak<br />Kuala Lumpur, Malaysia</address><a className="mt-3 block text-sm font-bold text-[#f3b59f] hover:text-white" href="mailto:info@bilingualidol.edu.my">info@bilingualidol.edu.my</a></div>
        </div>
        <div className="border-t border-white/10"><div className="site-container flex flex-col gap-2 py-5 text-[11px] text-white/45 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} Bilingual Idol Language Centre.</span><span className="inline-flex items-center gap-1">Learn with confidence <ChevronDown size={13} aria-hidden="true" /></span></div></div>
      </footer>
    </div>
  );
}
