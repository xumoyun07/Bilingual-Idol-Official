import { ReactNode } from "react";

export function FounderRouteSurface({ children, route }: { children: ReactNode; route: "overview" | "operations" | "learning-data" | "announcements" }) {
  const copy = {
    overview: { eyebrow: "Founder console · Centre control", title: "Review the work. <em>Keep the route clear.</em>", description: "Manage confirmed public content, incoming requests, operational settings and publication decisions from one protected workspace." },
    operations: { eyebrow: "Learning operations", title: "Make every next step <em>clear.</em>", description: "Set up the verified learning information families and teachers need, without introducing fictional records." },
    "learning-data": { eyebrow: "Learning Compass · Founder data", title: "Confirm the detail, then <em>publish the route.</em>", description: "Manage learning items and learner support requests through an organised, protected data workspace." },
    announcements: { eyebrow: "Founder content control", title: "Edit verified <em>centre updates.</em>", description: "Select, refine and publish announcements while keeping the public notice board accurate." },
  }[route];
  return <section className={`founder-route-surface founder-route-${route}`}><FounderCommandHeader eyebrow={copy.eyebrow} title={<><span>{copy.title.split("<em>")[0]}</span>{copy.title.includes("<em>") && <em>{copy.title.split("<em>")[1].replace("</em>", "")}</em>}</>} description={copy.description} action={<a href={route === "operations" || route === "learning-data" ? "/learning" : "/"} className="compass-btn-secondary">{route === "operations" || route === "learning-data" ? "Preview learning hub" : "View website"}</a>} /><FounderSegmentedNav><span className="founder-surface-marker">Protected Founder workspace</span><span className="founder-surface-marker">Verified data only</span><span className="founder-surface-marker">Visible feedback states</span></FounderSegmentedNav><div className="founder-route-metrics"><FounderMetricCard icon="↗" value="1" label="Protected workspace" tone="ink" /><FounderMetricCard icon="✓" value="0" label="Unverified items shown" tone="sage" /><FounderMetricCard icon="•" value="AA" label="Accessible feedback cues" tone="apricot" /></div><FounderState kind="empty"><strong>Operate with confirmed information.</strong><span> Content, requests and public updates retain their existing validation and feedback rules.</span></FounderState><FounderPanel>{children}</FounderPanel></section>;
}

export function FounderCommandHeader({ eyebrow, title, description, action }: { eyebrow: string; title: ReactNode; description: string; action?: ReactNode }) {
  return <header className="founder-command-header"><div><p className="founder-command-eyebrow">{eyebrow}</p><h1 className="founder-command-title">{title}</h1><p className="founder-command-description">{description}</p></div>{action && <div className="founder-command-action">{action}</div>}</header>;
}

export function FounderSegmentedNav({ children }: { children: ReactNode }) { return <nav className="founder-segmented-nav" aria-label="Founder workspace sections">{children}</nav>; }
export function FounderMetricCard({ icon, label, value, tone = "sage" }: { icon: ReactNode; label: string; value: ReactNode; tone?: "sage" | "apricot" | "ink" | "sand" }) { return <article className={`founder-metric founder-metric-${tone}`}><span className="founder-metric-icon">{icon}</span><p className="founder-metric-value">{value}</p><p className="founder-metric-label">{label}</p></article>; }
export function FounderPanel({ children, tone = "paper" }: { children: ReactNode; tone?: "paper" | "ink" | "sage" | "sand" }) { return <section className={`founder-panel founder-panel-${tone}`}>{children}</section>; }
export function FounderState({ children, kind = "empty" }: { children: ReactNode; kind?: "empty" | "success" | "error" }) { return <div className={`founder-state founder-state-${kind}`}>{children}</div>; }
