import { Link, useLocation } from "wouter";
import { ArrowUpRight, Menu, Phone, X } from "lucide-react";
import { CSSProperties, useEffect, useLayoutEffect, useRef, useState } from "react";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Learning hub", href: "/learning" },
  { label: "Programmes", href: "/programs" },
  { label: "About", href: "/about" },
  { label: "News", href: "/news" },
  { label: "Contact", href: "/contact" },
];

function Mark() { return <span className="compass-brand-seal" aria-hidden="true">BI</span>; }

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const syncHeaderHeight = () => setHeaderHeight(Math.round(header.getBoundingClientRect().height));
    syncHeaderHeight();
    const observer = new ResizeObserver(syncHeaderHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, [open]);
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
    <div className="compass-page" style={{ "--public-header-height": `${headerHeight}px` } as CSSProperties}>
      <a className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-[#10253e]" href="#main-content">Skip to content</a>
      <header ref={headerRef} className="compass-public-header">
        <div className="compass-topline"><div className="compass-shell">
          <span className="hidden sm:inline">English · Bahasa Melayu · Mandarin · Arabic · Japanese · Korean</span>
          <span className="sm:hidden">A language community in Kuala Lumpur</span>
          <a className="inline-flex items-center gap-1.5 hover:text-white" href="tel:+60367310449"><Phone size={12} aria-hidden="true" /> +603 6731 0449</a>
        </div></div>
        <div className="compass-shell compass-navline">
          <Link href="/" className="compass-brand min-w-0" aria-label="Bilingual Idol Language Centre home">
            <Mark />
            <span className="min-w-0 leading-none"><strong className="block truncate text-sm font-extrabold tracking-[-0.03em]">Bilingual Idol</strong><span className="mt-1 block text-[9px] font-extrabold tracking-[.12em] uppercase text-[#397563]">Learning Centre</span></span>
          </Link>
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
            {navigation.map(item => <Link key={item.href} href={item.href} aria-current={location === item.href ? "page" : undefined} className="compass-nav-link">{item.label}</Link>)}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <a href="https://wa.me/60367310449" target="_blank" rel="noreferrer" className="text-sm font-bold text-[#405269] hover:text-[#10253e]">WhatsApp</a>
            <Link href="/admin/login" className="compass-btn-secondary !min-h-10 !px-3" aria-label="Вход в Founder console">Вход</Link>
            <Link href="/enroll" className="compass-btn-primary !min-h-10">Enroll Now <ArrowUpRight size={16} aria-hidden="true" /></Link>
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-lg border border-[#cbbba4] text-[#10253e] lg:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open}>{open ? <X /> : <Menu />}</button>
        </div>
        {open && <nav className="compass-mobile-menu lg:hidden" aria-label="Mobile navigation"><div className="compass-shell">{navigation.map(item => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={location === item.href ? "page" : undefined}>{item.label}</Link>)}<div className="mt-4 flex gap-3"><Link href="/admin/login" onClick={() => setOpen(false)} className="compass-btn-secondary flex-1">Вход</Link><Link href="/enroll" onClick={() => setOpen(false)} className="compass-btn-primary flex-1">Enroll Now</Link></div></div></nav>}
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
      <footer className="compass-footer">
        <div className="compass-shell grid gap-10 py-14 md:grid-cols-[1.15fr_.8fr_.9fr]">
          <div><div className="flex items-center gap-3"><Mark /><div><p className="font-bold">Bilingual Idol</p><p className="text-[10px] font-extrabold tracking-[.14em] uppercase text-[#a7c6b8]">Language Centre</p></div></div><p className="mt-5 max-w-sm text-sm leading-7 text-white/65">A welcoming place to learn, practise, and connect through language — in Kuala Lumpur and beyond.</p></div>
          <div><p className="text-xs font-extrabold tracking-[.12em] uppercase text-[#a7c6b8]">Explore</p><div className="mt-4 grid gap-2">{navigation.map(item => <Link key={item.href} href={item.href} className="w-fit text-sm text-white/75 hover:text-[#f3b59f]">{item.label}</Link>)}<Link href="/enroll" className="w-fit text-sm text-white/75 hover:text-[#f3b59f]">Enroll Now</Link></div></div>
          <div><p className="text-xs font-extrabold tracking-[.12em] uppercase text-[#a7c6b8]">Visit & contact</p><address className="mt-4 not-italic text-sm leading-7 text-white/75">E-03-10, StarParc Point<br />Jalan Genting Kelang, Setapak<br />Kuala Lumpur, Malaysia</address><a className="mt-3 block text-sm font-bold text-[#f3b59f] hover:text-white" href="mailto:info@bilingualidol.edu.my">info@bilingualidol.edu.my</a></div>
        </div>
        <div className="border-t border-white/10"><div className="compass-shell flex flex-col gap-2 py-5 text-[11px] text-white/45 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} Bilingual Idol Language Centre.</span><span>Clear pathways. Real progress.</span></div></div>
      </footer>
    </div>
  );
}
