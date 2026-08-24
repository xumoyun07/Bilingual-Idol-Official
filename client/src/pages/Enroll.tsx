import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { LeadForm } from "@/components/LeadForm";
import { PublicLayout } from "@/components/PublicLayout";

export default function Enroll() {
  return <PublicLayout><div className="simple-route-page"><header className="simple-route-header"><Link href="/" className="simple-text-link"><ArrowLeft size={16} /> Back to home</Link><p className="simple-eyebrow mt-8">Learning enquiry</p><h1>Tell the centre about the learner.</h1><p>Submit the details you already know. An enquiry does not commit you to a course.</p></header><section className="simple-route-section simple-enroll-layout"><aside><h2>What happens next</h2><ol><li>The centre reviews the learner’s language goal and current stage.</li><li>The centre can recommend a relevant next step or ask a follow-up question.</li><li>Your information is handled by authorised centre staff.</li></ol></aside><div className="simple-form-card"><p className="simple-eyebrow">Learner details</p><p className="simple-body-copy">Fields marked with an asterisk are required.</p><div className="mt-6"><LeadForm /></div></div></section></div></PublicLayout>;
}
