import { ArrowLeft, ArrowRight, CalendarClock, Clock3, GraduationCap, Landmark, WalletCards } from "lucide-react";
import { Link, useRoute } from "wouter";
import { PublicLayout } from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";

export default function ProgramDetail() {
  const [, params] = useRoute("/programs/:slug");
  const record = trpc.content.publicProgram.useQuery({ slug: params?.slug ?? "" }, { enabled: Boolean(params?.slug) });
  if (record.isLoading) return <PublicLayout><div className="simple-route-page simple-route-section"><div className="simple-loading-row" /></div></PublicLayout>;
  const programme = record.data;
  if (!programme) return <PublicLayout><div className="simple-route-page simple-route-section"><div className="simple-empty-state"><p>Programme details are not available yet.</p><Link href="/programs" className="simple-text-link"><ArrowLeft size={16} /> Back to programmes</Link></div></div></PublicLayout>;
  const facts = [{ icon: GraduationCap, label: "Learner group", value: programme.ageGroup }, { icon: Landmark, label: "Level", value: programme.level }, { icon: Clock3, label: "Duration", value: programme.duration }, { icon: CalendarClock, label: "Schedule", value: programme.schedule }, { icon: WalletCards, label: "Fees", value: programme.fees }];
  return <PublicLayout><div className="simple-route-page"><header className="simple-route-header"><Link href="/programs" className="simple-text-link"><ArrowLeft size={16} /> All programmes</Link><p className="simple-eyebrow mt-8">{programme.language} programme</p><h1>{programme.title}</h1><p>{programme.description}</p></header><section className="simple-route-section simple-detail-layout"><aside><h2>Programme details</h2><dl className="simple-facts">{facts.map(({ icon: Icon, label, value }) => <div key={label}><dt><Icon size={17} /> {label}</dt><dd>{value}</dd></div>)}</dl></aside><div><h2>Before you enquire</h2><p className="simple-body-copy">Share the learner’s current level, language goal and preferred schedule. The centre can confirm availability and the most relevant starting point.</p><ul className="simple-check-list"><li>Confirmed schedule and fee information</li><li>The appropriate level for the learner</li><li>A clear next step before you commit</li></ul><div className="simple-callout"><strong>Need help choosing?</strong><p>Ask the centre about this programme before submitting an enquiry.</p><Link href="/contact" className="simple-button">Contact the centre <ArrowRight size={17} /></Link></div></div></section></div></PublicLayout>;
}
