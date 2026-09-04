import { Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { CentreMap } from "@/components/CentreMap";
import { LeadForm } from "@/components/LeadForm";
import { PublicLayout } from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Contact() {
  const { t, isRTL, language } = useLanguage();
  const settings = trpc.content.siteSettings.useQuery();
  const media = trpc.media.publicList.useQuery();
  const contactMedia = media.data?.find(item => item.slot === "home_task_contact") ?? media.data?.find(item => item.slot === "about_cta");

  const contacts = [
    { icon: Phone, label: t("common.call"), value: "+6 03 6731 0449", href: "tel:+60367310449" },
    { icon: MessageCircle, label: t("common.whatsapp"), value: language === "ms" ? "Hantar mesej WhatsApp" : language === "ar" ? "تواصل عبر واتساب" : "Message the centre", href: "https://wa.me/60367310449" },
    { icon: Mail, label: t("common.email"), value: "info@bilingualidol.edu.my", href: "mailto:info@bilingualidol.edu.my" },
    { icon: Clock3, label: t("contact.openingHours"), value: settings.data?.operatingHours ?? (language === "ms" ? "Hubungi pusat untuk waktu operasi terkini." : language === "ar" ? "تواصل مع المركز لمعرفة ساعات العمل الحالية." : "Contact the centre for current opening hours.") },
  ];

  return (
    <PublicLayout>
      <div className={`simple-route-page contact-page ${isRTL ? "is-rtl" : ""}`}>
        <header className="simple-route-header contact-hero-header contact-hero-header--compact contact-hero-header--spaced">
          <div className="contact-hero-copy">
            <p className="simple-eyebrow">{t("contact.eyebrow")}</p>
            <h1>{t("contact.heroTitle")}</h1>
            <p>{t("contact.heroSubtitle")}</p>
          </div>
          {contactMedia ? (
            <div className="contact-hero-media">
              <img src={contactMedia.publicUrl} alt={contactMedia.altText} fetchPriority="high" decoding="async" />
            </div>
          ) : null}
        </header>

        <section className="simple-route-section contact-details-section contact-details-section--transparent contact-details-section--borderless contact-details-section--flush contact-details-section--topless">
          <div className="simple-contact-grid contact-grid--flush">
            {contacts.map(({ icon: Icon, label, value, href }) => (
              <div className="simple-contact-item" key={label}>
                <Icon size={19} aria-hidden="true" />
                <div>
                  <strong>{label}</strong>
                  {href ? (
                    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>
                      {value}
                    </a>
                  ) : (
                    <span>{value}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="simple-map-block contact-map-block--light">
            <MapPin size={18} aria-hidden="true" />
            <p>{t("contact.addressText")}</p>
          </div>
          <div className="simple-map contact-map--rounded contact-map--borderless">
            <CentreMap />
          </div>
        </section>

        <section className="simple-route-section simple-section-tint contact-enquiry-section contact-enquiry-section--spaced contact-enquiry-section--wide-gap">
          <div className="simple-form-layout">
            <div className="contact-enquiry-copy contact-enquiry-copy--spaced">
              <p className="simple-eyebrow">{t("contact.formEyebrow")}</p>
              <h2>{t("contact.formTitle")}</h2>
              <p className="simple-body-copy">{t("contact.formSubtitle")}</p>
            </div>
            <div className="simple-form-card contact-form-card--tinted">
              <LeadForm type="inquiry" title={t("contact.formTitle")} />
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
