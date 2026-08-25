import { CalendarDays, ChevronLeft, ChevronRight, Megaphone, Newspaper, PartyPopper } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PublicLayout } from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";

const icons = { announcement: Megaphone, event: CalendarDays, holiday: PartyPopper };
type NewsPost = { id: number; title: string; excerpt: string; body: string; category: "announcement" | "event" | "holiday"; imageUrl: string | null; imageAltText: string | null; publishedAt: Date | null };

function dateLabel(value: Date | null) {
  return value ? new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long", day: "numeric" }).format(new Date(value)) : "Published by the centre";
}

export default function News() {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<NewsPost | null>(null);
  const feed = trpc.news.publicPage.useQuery({ page });
  const totalPages = feed.data?.totalPages ?? 0;

  useEffect(() => { if (totalPages && page >= totalPages) setPage(totalPages - 1); }, [page, totalPages]);
  const changePage = (next: number) => { setSelected(null); setPage(next); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <PublicLayout>
      <div className="simple-route-page news-page">
        <header className="simple-route-header simple-route-header--news">
          <p className="simple-eyebrow">News</p>
          <h1>Centre updates, notices and events.</h1>
          <p>Read information published directly by the centre. Select a card for the full update.</p>
        </header>

        <section className="simple-route-section news-feed" aria-label="Centre news">
          {feed.isLoading ? <div className="news-grid" aria-label="Loading news">{Array.from({ length: 6 }, (_, index) => <div className="news-card news-card-loading" key={index} />)}</div> : null}
          {feed.error ? <div className="simple-empty-state"><Newspaper size={20} /><p>Updates are temporarily unavailable. Please contact the centre directly if you need help.</p></div> : null}
          {!feed.isLoading && !feed.error && feed.data?.rows.length ? <>
            <div className="news-grid">
              {feed.data.rows.map(item => {
                const Icon = icons[item.category];
                return <article className="news-card" key={item.id}>
                  <button type="button" className="news-card-trigger" onClick={() => setSelected(item)} aria-haspopup="dialog" aria-label={`Read ${item.title}`}>
                    {item.imageUrl ? <img className="news-card-image" src={item.imageUrl} alt={item.imageAltText || ""} loading="lazy" decoding="async" /> : <span className="news-card-image news-card-image-empty" aria-hidden="true"><Icon size={30} /></span>}
                    <span className="news-card-content"><span className="news-card-meta"><span className="news-category"><Icon size={14} />{item.category}</span><time dateTime={item.publishedAt?.toISOString()}>{dateLabel(item.publishedAt)}</time></span><strong>{item.title}</strong><span className="news-card-excerpt">{item.excerpt}</span><span className="news-read-more">Read update <ChevronRight size={16} /></span></span>
                  </button>
                </article>;
              })}
            </div>
            {totalPages > 1 ? <nav className="news-pagination" aria-label="News pages"><Button type="button" variant="outline" onClick={() => changePage(page - 1)} disabled={page === 0} className="news-pagination-arrow" aria-label="Previous news page"><ChevronLeft size={17} /><span>Previous</span></Button><div className="news-page-numbers">{Array.from({ length: totalPages }, (_, index) => <button type="button" key={index} onClick={() => changePage(index)} className={index === page ? "news-page-number is-current" : "news-page-number"} aria-current={index === page ? "page" : undefined} aria-label={`News page ${index + 1}`}>{index + 1}</button>)}</div><Button type="button" variant="outline" onClick={() => changePage(page + 1)} disabled={page === totalPages - 1} className="news-pagination-arrow" aria-label="Next news page"><span>Next</span><ChevronRight size={17} /></Button></nav> : null}
          </> : null}
          {!feed.isLoading && !feed.error && feed.data && !feed.data.rows.length ? <div className="simple-empty-state"><Newspaper size={20} /><div><p>No updates are published right now.</p><p className="mt-1 text-sm">New notices and events will appear here once the centre publishes them.</p></div></div> : null}
        </section>
      </div>

      <Dialog open={selected !== null} onOpenChange={open => { if (!open) setSelected(null); }}>
        <DialogContent className="news-dialog max-h-[calc(100dvh-2rem)] max-w-[calc(100%-1rem)] overflow-y-auto p-0 sm:max-w-2xl">
          <DialogHeader className="news-dialog-header">{selected ? <NewsDialogHeader post={selected} /> : null}</DialogHeader>
          {selected ? <div className="news-dialog-body">{selected.imageUrl ? <img src={selected.imageUrl} alt={selected.imageAltText || ""} /> : null}<div className="news-dialog-copy">{selected.body.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></div> : null}
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}

function NewsDialogHeader({ post }: { post: NewsPost }) {
  const Icon = icons[post.category];
  return <><div className="news-card-meta"><span className="news-category"><Icon size={14} />{post.category}</span><time dateTime={post.publishedAt?.toISOString()}>{dateLabel(post.publishedAt)}</time></div><DialogTitle>{post.title}</DialogTitle><DialogDescription>{post.excerpt}</DialogDescription></>;
}
