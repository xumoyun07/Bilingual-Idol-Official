import { Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { CentreMap } from "@/components/CentreMap";
import { LeadForm } from "@/components/LeadForm";
import { PublicLayout } from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Contact() {
  const { t, isRTL, language, translateAmPm } = useLanguage();
  const settings = trpc.content.siteSettings.useQuery();
  const media = trpc.media.publicList.useQuery();
  const contactMedia = media.data?.find(item => item.slot === "home_task_contact") ?? media.data?.find(item => item.slot === "about_cta");

  const contacts = [
    { icon: Phone, label: t("common.call"), value: "+6 03 6731 0449", href: "tel:+60367310449" },
    { icon: MessageCircle, label: t("common.whatsapp"), value: language === "ms" ? "Hantar mesej WhatsApp" : language === "ar" ? "تواصل عبر واتساب" : "Message the centre", href: "https://wa.me/60367310449" },
    { icon: Mail, label: t("common.email"), value: "info@bilingualidol.edu.my", href: "mailto:info@bilingualidol.edu.my" },
    { icon: Clock3, label: t("common.openingHours"), value: settings.data?.operatingHours ? translateAmPm(settings.data.operatingHours) : t("contact.openingHours") },
  ];

  return (
    <PublicLayout>
      <div id="contact-page-container" data-page="contact" className={`simple-route-page contact-page page-contact ${isRTL ? "is-rtl" : ""}`}>
        <header id="contact-hero-header" className="simple-route-header contact-hero-header contact-hero-header--compact contact-hero-header--spaced">
          <div className="contact-hero-copy">
            <p className="simple-eyebrow">{t("contact.eyebrow")}</p>
            <h1>{t("contact.heroTitle")}</h1>
            <p>{t("contact.heroSubtitle", undefined, "Get in touch with the centre.")}</p>
          </div>
          {contactMedia ? (
            <div className="contact-hero-media">
              <img src={contactMedia.publicUrl} alt={contactMedia.altText} decoding="async" />
            </div>
          ) : null}
        </header>

        <section id="contact-details-section" className="simple-route-section contact-details-section contact-details-section--transparent contact-details-section--borderless px-4">
          <div className="simple-contact-grid hidden md:grid">
            {contacts.map(({ icon: Icon, label, value, href }) => (
              <div className="simple-contact-item" key={label}>
                <Icon size={19} aria-hidden="true" />
                <div>
                  <strong>{label}</strong>
                  {href ? (
                    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>
                      {href.startsWith("tel:") || href.startsWith("mailto:") ? <bdi dir="ltr">{value}</bdi> : value}
                    </a>
                  ) : (
                    <span>{value}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Only: Beautiful Unified Compact Communication Card (Sleek, Simplified, Compact) */}
          <div className="block md:hidden bg-white rounded-3xl border border-[#cbdcfc]/45 shadow-[0_8px_30px_rgba(23,63,173,0.05)] overflow-hidden mb-6 p-5">
            <div className="space-y-4">
              {/* Friendly editorial headline */}
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-[#10253e] tracking-tight">
                  {language === "ms" ? "Hubungi Kami Terus" : language === "ar" ? "اتصل بنا مباشرة" : "Connect with Us Instantly"}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {language === "ms" ? "Sesi konsultasi akademik atau lawatan kampus Pavilion Embassy" : language === "ar" ? "جلسة استشارية أو جولة في حرم بافيليون إمباسي" : "Academic consultations or tours of Pavilion Embassy"}
                </p>
              </div>

              {/* Core Information List with clean typography and no capsules/pills */}
              <div className="space-y-3 py-3.5 border-t border-b border-slate-100">
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <Clock3 size={14} className="text-[#173fad]" />
                  </div>
                  <span className="truncate">{settings.data?.operatingHours ? translateAmPm(settings.data.operatingHours) : t("contact.openingHours")}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <Mail size={14} className="text-[#173fad]" />
                  </div>
                  <a href="mailto:info@bilingualidol.edu.my" className="hover:text-[#173fad] transition-colors truncate">
                    info@bilingualidol.edu.my
                  </a>
                </div>
              </div>

              {/* Action Buttons: Designed for thumb touches with perfect target sizes */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <a
                  href="tel:+60367310449"
                  className="h-11 rounded-xl bg-[#173fad] text-white flex items-center justify-center gap-2 text-xs font-extrabold shadow-sm active:scale-[0.98] transition-all"
                >
                  <Phone size={14} className="stroke-[2.5]" />
                  <span>{t("common.call")}</span>
                </a>
                <a
                  href="https://wa.me/60367310449"
                  target="_blank"
                  rel="noreferrer"
                  className="h-11 rounded-xl bg-gradient-to-br from-[#25d366] to-[#128c7e] text-white flex items-center justify-center gap-2 text-xs font-extrabold shadow-sm active:scale-[0.98] transition-all"
                >
                  <MessageCircle size={14} className="fill-white stroke-none" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          <div className="simple-map contact-map--rounded contact-map--borderless">
            <CentreMap />
          </div>
        </section>

        <section id="contact-enquiry-section" className="simple-route-section simple-section-tint contact-enquiry-section contact-enquiry-section--spaced contact-enquiry-section--wide-gap">
          <div className="simple-form-layout">
            <div className="contact-enquiry-copy contact-enquiry-copy--spaced hidden md:block">
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
