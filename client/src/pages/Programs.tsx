import { Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/PublicLayout";
import { PROGRAM_CATEGORIES } from "@/lib/siteData";
import { trpc } from "@/lib/trpc";

export default function Programs() {
  const [category, setCategory] = useState<(typeof PROGRAM_CATEGORIES)[number]>("All");
  const [query, setQuery] = useState("");
  const programmes = trpc.content.publicPrograms.useQuery();
  const matches = useMemo(() => (programmes.data ?? []).filter(item => (category === "All" || item.category === category) && [item.title, item.language, item.ageGroup, item.level].join(" ").toLowerCase().includes(query.toLowerCase())), [category, query, programmes.data]);
  return <PublicLayout><div className="simple-route-page"><header className="simple-route-header"><p className="simple-eyebrow">Programmes</p><h1>Find a programme that fits the learner.</h1><p>Use language, learner group and level to narrow the list. Contact the centre if you are not sure where to start.</p></header><section className="simple-route-section"><div className="simple-filter-bar"><label><Search size={17} /><span className="sr-only">Search programmes</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by language, level or learner group" /></label><div className="simple-filter-options" aria-label="Programme category filters"><span><Filter size={15} /> Filter</span>{PROGRAM_CATEGORIES.map(item => <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item}>{item}</button>)}</div></div><p className="simple-list-summary"><strong>{matches.length}</strong> programme{matches.length === 1 ? "" : "s"} shown</p>{programmes.isLoading ? <div className="simple-programme-list">{[1,2,3].map(item => <div className="simple-loading-row" key={item} />)}</div> : matches.length ? <div className="simple-programme-list">{matches.map(programme => <Link key={programme.slug} href={`/programs/${programme.slug}`} className="simple-programme-row"><div><strong>{programme.title}</strong><span>{programme.language} · {programme.level} · {programme.ageGroup}</span></div><span>View details</span></Link>)}</div> : <div className="simple-empty-state"><p>No confirmed programme matches this search.</p><Link href="/contact" className="simple-text-link">Ask the centre for guidance</Link></div>}</section></div></PublicLayout>;
}
