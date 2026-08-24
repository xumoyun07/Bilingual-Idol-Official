import { Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

const primaryNavigation = [
  { label: "Programmes", href: "/programs" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const metadata: Record<string, { title: string; description: string }> = {
      "/": { title: "Bilingual Idol Language Centre | Kuala Lumpur", description: "Practical language learning support for families, students and teachers in Kuala Lumpur." },
      "/programs": { title: "Programmes | Bilingual Idol", description: "Find confirmed language programmes by learner needs." },
      "/about": { title: "About Bilingual Idol", description: "About Bilingual Idol Language Centre." },
      "/news": { title: "News | Bilingual Idol", description: "Centre updates and notices." },
      "/contact": { title: "Contact Bilingual Idol", description: "Contact Bilingual Idol Language Centre." },
      "/enroll": { title: "Enquiry | Bilingual Idol", description: "Send a learning enquiry to Bilingual Idol." },
      "/login": { title: "Sign in | Bilingual Idol", description: "Sign in to your Bilingual Idol account." },
    };
    const selected = metadata[location] ?? (location.startsWith("/programs/") ? { title: "Programme details | Bilingual Idol", description: "Programme information from Bilingual Idol." } : metadata["/"]);
    document.title = selected.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", selected.description);
  }, [location]);

  const close = () => setOpen(false);
  return <div className="simple-public-shell">
    <a className="simple-skip-link" href="#main-content">Skip to content</a>
    <header className="simple-public-header">
      <div className="simple-public-bar">
        <Link href="/" className="simple-brand" aria-label="Bilingual Idol Language Centre home" onClick={close}><span aria-hidden="true">BI</span><strong>Bilingual Idol<small>Language Centre</small></strong></Link>
        <nav className="simple-public-nav" aria-label="Primary navigation">{primaryNavigation.map(item => <Link key={item.href} href={item.href} aria-current={location === item.href ? "page" : undefined}>{item.label}</Link>)}</nav>
        <div className="simple-public-actions"><a className="simple-contact-link" href="tel:+60367310449"><Phone size={16} aria-hidden="true" /> Call</a><Link href="/login" className="simple-button simple-button-quiet">Sign in</Link><Link href="/enroll" className="simple-button">Make an enquiry</Link></div>
        <button className="simple-menu-button" onClick={() => setOpen(value => !value)} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open}>{open ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
      {open && <nav className="simple-mobile-nav" aria-label="Mobile navigation">{primaryNavigation.map(item => <Link key={item.href} href={item.href} onClick={close} aria-current={location === item.href ? "page" : undefined}>{item.label}</Link>)}<Link href="/login" onClick={close}>Sign in</Link><Link href="/enroll" className="simple-button" onClick={close}>Make an enquiry</Link></nav>}
    </header>
    <main id="main-content" tabIndex={-1}>{children}</main>
    <footer className="simple-public-footer"><div><strong>Bilingual Idol Language Centre</strong><span>Setapak, Kuala Lumpur</span></div><nav aria-label="Footer navigation"><Link href="/news">News</Link><Link href="/contact">Contact</Link><a href="mailto:info@bilingualidol.edu.my">Email</a></nav></footer>
  </div>;
}
