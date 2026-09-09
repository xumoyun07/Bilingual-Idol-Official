import { Globe2, Quote, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

export function VerifiedTestimonials() {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const { t, isRTL, language } = useLanguage();
  const { data: testimonials = [] } = trpc.content.publicTestimonials.useQuery();

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <section className={`simple-section bilc-testimonials-section ${isRTL ? "is-rtl" : ""}`} id="student-testimonials">
      <div className="bilc-testimonials-header">
        <div className="bilc-pricing-tag">
          <Globe2 size={16} />
          <span>
            {language === "ms"
              ? "Kisah Kejayaan Pelajar"
              : language === "ar"
              ? "تجارب وقصص نجاح طلابنا"
              : "Student Stories · Verified Reviews"}
          </span>
        </div>
        <h2>{t("home.testimonialsTitle")}</h2>
        <p>{t("home.testimonialsSubtitle")}</p>
      </div>

      <div className="bilc-testimonials-grid">
        {testimonials.map((item, idx) => (
          <div
            key={item.id}
            className={`bilc-testimonial-card ${activeIdx === idx ? "is-featured" : ""}`}
            onClick={() => setActiveIdx(idx)}
          >
            <div className="bilc-testimonial-top">
              <div className="bilc-stars-row">
                {[...Array(item.rating || 5)].map((_, i) => (
                  <Star key={i} size={15} className="bilc-star-icon" fill="currentColor" />
                ))}
              </div>
              <Quote size={24} className="bilc-quote-icon" />
            </div>

            <p className="bilc-testimonial-text">"{item.quote}"</p>

            <div className="bilc-testimonial-author">
              <div>
                <strong>{item.authorName}</strong>
                {item.relation && <span className="bilc-author-country">{item.relation}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Box */}
      <div className="bilc-testimonial-cta-banner">
        <div className="bilc-cta-copy">
          <h3>
            {language === "ms"
              ? "Bersedia untuk Membina Kisah Kejayaan Anda?"
              : language === "ar"
              ? "هل أنت مستعد لبدء قصة نجاحك؟"
              : "Ready to Write Your Success Story?"}
          </h3>
          <p>
            {language === "ms"
              ? "Jadualkan ujian penempatan atau berunding dengan pasukan akademik kami di Pavilion Embassy Kuala Lumpur."
              : language === "ar"
              ? "احجز اختبار تحديد المستوى أو استشر فريقنا الأكاديمي في بافيليون إمباسي كوالالمبور."
              : "Schedule a placement test or consult with our academic team at Pavilion Embassy Kuala Lumpur."}
          </p>
        </div>
        <div className="bilc-cta-actions">
          <Link href="/contact" className="simple-button simple-button-quiet min-h-[44px]">
            {t("nav.contactUs")}
          </Link>
          <Link href="/enroll" className="simple-button min-h-[44px]">
            {t("nav.enrollNow")}
          </Link>
        </div>
      </div>
    </section>
  );
}

