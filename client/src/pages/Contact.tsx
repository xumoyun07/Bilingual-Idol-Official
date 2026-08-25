import { Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { CentreMap } from "@/components/CentreMap";
import { LeadForm } from "@/components/LeadForm";
import { PublicLayout } from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";

export default function Contact() {
  const settings = trpc.content.siteSettings.useQuery();
  const media = trpc.media.publicList.useQuery();
  const contactMedia = media.data?.find(item => item.slot === "home_task_contact") ?? media.data?.find(item => item.slot === "about_cta");
  const contacts = [
    { icon: Phone, label: "Call", value: "+6 03 6731 0449", href: "tel:+60367310449" },
    { icon: MessageCircle, label: "WhatsApp", value: "Message the centre", href: "https://wa.me/60367310449" },
    { icon: Mail, label: "Email", value: "info@bilingualidol.edu.my", href: "mailto:info@bilingualidol.edu.my" },
    { icon: Clock3, label: "Opening hours", value: settings.data?.operatingHours ?? "Contact the centre for current opening hours." },
  ];

  return (
    <PublicLayout>
      <div className="simple-route-page contact-page">
        <header className="simple-route-header contact-hero-header">
          <div className="contact-hero-copy">
            <p className="simple-eyebrow">Contact</p>
            <h1>Get in touch with the centre.</h1>
            <p>Choose the contact method that works best for you, or send a short enquiry below.</p>
          </div>
          {contactMedia ? <div className="contact-hero-media"><img src={contactMedia.publicUrl} alt={contactMedia.altText} fetchPriority="high" decoding="async" /></div> : null}
        </header>

        <section className="simple-route-section contact-details-section">
          <div className="simple-contact-grid">
            {contacts.map(({ icon: Icon, label, value, href }) => (
              <div className="simple-contact-item" key={label}>
                <Icon size={19} aria-hidden="true" />
                <div>
                  <strong>{label}</strong>
                  {href ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>{value}</a> : <span>{value}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="simple-map-block"><MapPin size={18} aria-hidden="true" /><p>E-03-10, StarParc Point, Jalan Genting Kelang, Setapak, Kuala Lumpur.</p></div>
          <div className="simple-map"><CentreMap /></div>
        </section>

        <section className="simple-route-section simple-section-tint contact-enquiry-section">
          <div className="simple-form-layout">
            <div className="contact-enquiry-copy">
              <p className="simple-eyebrow">Send an enquiry</p>
              <h2>Tell us what the learner needs.</h2>
              <p className="simple-body-copy">A short description of the learner’s language goal and preferred timing is enough to begin.</p>
            </div>
            <div className="simple-form-card"><LeadForm type="inquiry" title="Your enquiry" /></div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
