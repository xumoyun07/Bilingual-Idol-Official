import { CalendarDays, Megaphone, Newspaper, PartyPopper } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";

const icons = { announcement: Megaphone, event: CalendarDays, holiday: PartyPopper };

export default function News() {
  const announcements = trpc.content.publicAnnouncements.useQuery();
  return <PublicLayout><div className="simple-route-page"><header className="simple-route-header"><p className="simple-eyebrow">News</p><h1>Centre updates and notices.</h1><p>Only information published by the centre appears here.</p></header><section className="simple-route-section">{announcements.isLoading && <div className="simple-programme-list">{[1,2,3].map(item => <div key={item} className="simple-loading-row" />)}</div>}{announcements.error && <div className="simple-empty-state"><p>Updates are temporarily unavailable. Please contact the centre directly if you need help.</p></div>}{announcements.data?.length ? <div className="simple-news-list">{announcements.data.map(item => { const Icon = icons[item.category]; return <article key={item.id}><Icon size={18} /><div><div className="flex flex-wrap items-center gap-2"><strong>{item.title}</strong><span>{item.category}</span></div><p>{item.excerpt}</p><small>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "Published by the centre"}</small></div></article>; })}</div> : announcements.data && <div className="simple-empty-state"><Newspaper size={20} /><p>No notices are published right now.</p></div>}</section></div></PublicLayout>;
}
