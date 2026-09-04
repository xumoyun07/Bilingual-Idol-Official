import { CalendarDays, ChevronLeft, ChevronRight, Megaphone, Newspaper, PartyPopper, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PublicLayout } from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

const icons = { announcement: Megaphone, event: CalendarDays, holiday: PartyPopper };
type NewsPost = { id: number; slug: string; title: string; excerpt: string; body: string; category: "announcement" | "event" | "holiday"; imageUrl: string | null; imageAltText: string | null; publishedAt: Date | null };

function dateLabel(value: Date | null, locale: string) {
  return value ? new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : locale === "ms" ? "ms-MY" : "en-GB", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value)) : "Published by the centre";
}

export default function News() {
  const { t, isRTL, language } = useLanguage();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<NewsPost | null>(null);
  const [shareLabel, setShareLabel] = useState("");
  const feed = trpc.news.publicPage.useQuery({ page });
  const totalPages = feed.data?.totalPages ?? 0;
  const media = trpc.media.publicList.useQuery();
  const listingMedia = (media.data ?? []).find(item => item.slot === "news_listing") ?? { publicUrl: "/media/prog_general_english.webp", altText: "Latest news and updates at Bilingual Idol" };

  const defaultShareLabel = language === "ms" ? "Kongsi" : language === "ar" ? "مشاركة" : "Share";
  const copiedShareLabel = language === "ms" ? "Pautan disalin" : language === "ar" ? "تم نسخ الرابط" : "Link copied";

  useEffect(() => {
    if (totalPages && page >= totalPages) setPage(totalPages - 1);
  }, [page, totalPages]);

  const changePage = (next: number) => {
    setSelected(null);
    setShareLabel("");
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openPost = (post: NewsPost) => {
    setSelected(post);
    setShareLabel("");
  };

  async function sharePost(post: NewsPost) {
    const url = new URL(window.location.href);
    url.searchParams.set("post", post.slug);
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareLabel(copiedShareLabel);
      window.setTimeout(() => setShareLabel(""), 2200);
    } catch {
      const fallback = document.createElement("textarea");
      fallback.value = url.toString();
      fallback.setAttribute("readonly", "");
      fallback.style.position = "fixed";
      fallback.style.opacity = "0";
      document.body.appendChild(fallback);
      fallback.select();
      const copied = document.execCommand("copy");
      fallback.remove();
      setShareLabel(copied ? copiedShareLabel : defaultShareLabel);
      window.setTimeout(() => setShareLabel(""), 2200);
    }
  }

  return (
    <PublicLayout>
      <div className={`simple-route-page news-page ${isRTL ? "is-rtl" : ""}`}>
        <header className="simple-route-header simple-route-header--news">
          <div className="simple-route-header-copy">
            <p className="simple-eyebrow">{t("news.eyebrow")}</p>
            <h1>{t("news.heroTitle")}</h1>
            <p>{t("news.heroSubtitle")}</p>
          </div>
          {listingMedia ? (
            <div className="simple-route-header-media" aria-label="News header image">
              <img src={listingMedia.publicUrl} alt={listingMedia.altText} loading="lazy" decoding="async" />
            </div>
          ) : null}
        </header>

        <section className="simple-route-section news-feed" aria-label="Centre news">
          {feed.isLoading ? (
            <div className="news-grid" aria-label="Loading news">
              {Array.from({ length: 6 }, (_, index) => (
                <div className="news-card news-card-loading" key={index} />
              ))}
            </div>
          ) : null}
          {feed.error ? (
            <div className="simple-empty-state">
              <Newspaper size={20} />
              <p>Updates are temporarily unavailable. Please contact the centre directly if you need help.</p>
            </div>
          ) : null}
          {!feed.isLoading && !feed.error && feed.data?.rows.length ? (
            <>
              <div className="news-grid">
                {feed.data.rows.map((item) => {
                  const Icon = icons[item.category];
                  return (
                    <article className="news-card" key={item.id}>
                      <button type="button" className="news-card-trigger" onClick={() => openPost(item)} aria-haspopup="dialog" aria-label={`Read ${item.title}`}>
                        {item.imageUrl ? (
                          <img className="news-card-image" src={item.imageUrl} alt={item.imageAltText || ""} loading="lazy" decoding="async" />
                        ) : (
                          <span className="news-card-image news-card-image-empty" aria-hidden="true">
                            <Icon size={30} />
                          </span>
                        )}
                        <span className="news-card-content">
                          <span className="news-card-meta">
                            <span className="news-category">
                              <Icon size={14} />
                              {item.category}
                            </span>
                            <time dateTime={item.publishedAt?.toISOString()}>{dateLabel(item.publishedAt, language)}</time>
                          </span>
                          <strong>{item.title}</strong>
                          <span className="news-card-excerpt">{item.excerpt}</span>
                          <span className="news-read-more">
                            {t("news.readUpdate")} <ChevronRight size={16} className={isRTL ? "rotate-180" : ""} />
                          </span>
                        </span>
                      </button>
                    </article>
                  );
                })}
              </div>
              {totalPages > 1 ? (
                <nav className="news-pagination" aria-label="News pages">
                  <Button type="button" variant="outline" onClick={() => changePage(page - 1)} disabled={page === 0} className="news-pagination-arrow" aria-label="Previous news page">
                    <ChevronLeft size={17} className={isRTL ? "rotate-180" : ""} />
                    <span>{t("news.previous")}</span>
                  </Button>
                  <div className="news-page-numbers">
                    {Array.from({ length: totalPages }, (_, index) => (
                      <button type="button" key={index} onClick={() => changePage(index)} className={index === page ? "news-page-number is-current" : "news-page-number"} aria-current={index === page ? "page" : undefined} aria-label={`News page ${index + 1}`}>
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  <Button type="button" variant="outline" onClick={() => changePage(page + 1)} disabled={page === totalPages - 1} className="news-pagination-arrow" aria-label="Next news page">
                    <span>{t("news.next")}</span>
                    <ChevronRight size={17} className={isRTL ? "rotate-180" : ""} />
                  </Button>
                </nav>
              ) : null}
            </>
          ) : null}
          {!feed.isLoading && !feed.error && feed.data && !feed.data.rows.length ? (
            <div className="simple-empty-state">
              <Newspaper size={20} />
              <div>
                <p>{t("news.noUpdates")}</p>
                <p className="mt-1 text-sm">{t("news.noUpdatesText")}</p>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="news-dialog max-h-[calc(100dvh-2rem)] max-w-[calc(100%-1rem)] overflow-y-auto p-0 sm:max-w-2xl">
          <DialogHeader className="news-dialog-header">{selected ? <NewsDialogHeader post={selected} language={language} /> : null}</DialogHeader>
          {selected ? (
            <div className="news-dialog-body">
              {selected.imageUrl ? <img src={selected.imageUrl} alt={selected.imageAltText || ""} /> : null}
              <div className="news-dialog-copy">
                {selected.body.split(/\n{2,}/).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              <div className="news-dialog-actions">
                <button type="button" className="news-dialog-share" onClick={() => void sharePost(selected)}>
                  <Share2 size={16} />
                  <span aria-live="polite">{shareLabel || defaultShareLabel}</span>
                </button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}

function NewsDialogHeader({ post, language }: { post: NewsPost; language: string }) {
  const Icon = icons[post.category];
  return (
    <>
      <div className="news-card-meta">
        <span className="news-category">
          <Icon size={14} />
          {post.category}
        </span>
        <time dateTime={post.publishedAt?.toISOString()}>{dateLabel(post.publishedAt, language)}</time>
      </div>
      <DialogTitle>{post.title}</DialogTitle>
      <DialogDescription>{post.excerpt}</DialogDescription>
    </>
  );
}
