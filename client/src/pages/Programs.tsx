import { Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/PublicLayout";
import { OFFICIAL_PROGRAMME_GUIDE, PROGRAM_CATEGORIES } from "@/lib/siteData";
import { trpc } from "@/lib/trpc";

export default function Programs() {
  const [category, setCategory] = useState<(typeof PROGRAM_CATEGORIES)[number]>("All");
  const [query, setQuery] = useState("");
  const programmes = trpc.content.publicPrograms.useQuery();
  const media = trpc.media.publicList.useQuery();
  const listingMedia = (media.data ?? []).find(item => item.slot === "programmes_listing");
  const matches = useMemo(
    () =>
      (programmes.data ?? []).filter(
        item =>
          (category === "All" || item.category === category) &&
          [item.title, item.language, item.ageGroup, item.level].join(" ").toLowerCase().includes(query.toLowerCase()),
      ),
    [category, query, programmes.data],
  );

  return (
    <PublicLayout>
      <div className="simple-route-page programs-page">
        <header className="simple-route-header simple-route-header--programmes">
          <div className="simple-route-header-copy simple-route-header-copy--wide">
            <p className="simple-eyebrow">Programmes</p>
            <h1>Find a programme that fits the learner.</h1>
            <p className="simple-route-header-description">
              Explore the published 2026 course guide, then contact the centre to confirm suitability, availability and the current fee.
            </p>
          </div>
          {listingMedia ? (
            <div className="simple-route-header-media" aria-label="Programme classroom image">
              <img src={listingMedia.publicUrl} alt={listingMedia.altText} loading="lazy" decoding="async" />
            </div>
          ) : null}
        </header>

        <section className="simple-route-section simple-guide-section">
          <div className="simple-section-heading simple-section-heading--fee-guide">
            <div>
              <p className="simple-eyebrow">2026 fee guide</p>
              <h2>Published course options</h2>
            </div>
            <p>Fees are guidance from the 2026 list. Confirm the current total, visa requirements and intake with the centre before enrolment.</p>
          </div>
          <div className="simple-programme-guide">
            {OFFICIAL_PROGRAMME_GUIDE.map(item => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                <strong>{item.fee}</strong>
                <small>{item.note}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="simple-route-section">
          <div className="simple-filter-bar">
            <label>
              <Search size={17} />
              <span className="sr-only">Search programmes</span>
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by language, level or learner group" />
            </label>
            <div className="simple-filter-options" aria-label="Programme category filters">
              <span>
                <Filter size={15} /> Filter
              </span>
              {PROGRAM_CATEGORIES.map(item => (
                <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <p className="simple-list-summary simple-list-summary--surface">
            <strong>{matches.length}</strong> confirmed programme{matches.length === 1 ? "" : "s"} shown
          </p>

          {programmes.isLoading ? (
            <div className="simple-programme-list">
              {[1, 2, 3].map(item => (
                <div className="simple-loading-row" key={item} />
              ))}
            </div>
          ) : matches.length ? (
            <div className="simple-programme-list">
              {matches.map(programme => (
                <Link key={programme.slug} href={`/programs/${programme.slug}`} className="simple-programme-row">
                  <div>
                    <strong>{programme.title}</strong>
                    <span>
                      {programme.language} · {programme.level} · {programme.ageGroup}
                    </span>
                  </div>
                  <span>View details</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="simple-empty-state">
              <p>Looking for another option? The centre can advise on the most suitable course and current availability.</p>
              <Link href="/contact" className="simple-text-link">
                Ask the centre for guidance
              </Link>
            </div>
          )}
        </section>
      </div>
    </PublicLayout>
  );
}
