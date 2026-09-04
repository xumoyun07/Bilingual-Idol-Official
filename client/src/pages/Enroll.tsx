import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { LeadForm } from "@/components/LeadForm";
import { PublicLayout } from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Enroll() {
  const { t, isRTL, language } = useLanguage();
  const media = trpc.media.publicList.useQuery();
  const accountMedia = (media.data ?? []).find(item => item.slot === "home_task_account");

  return (
    <PublicLayout>
      <div className={`simple-route-page enroll-page ${isRTL ? "is-rtl" : ""}`}>
        <header className="simple-route-header enroll-hero-header">
          <div className="enroll-hero-copy">
            <Link href="/" className="simple-text-link">
              <ArrowLeft size={16} className={isRTL ? "rotate-180" : ""} /> {t("common.backToHome")}
            </Link>
            <p className="simple-eyebrow enroll-eyebrow">{t("enroll.eyebrow")}</p>
            <h1>{t("enroll.heroTitle")}</h1>
            <p>{t("enroll.heroSubtitle")}</p>
          </div>
          {accountMedia ? (
            <div className="enroll-hero-media">
              <img src={accountMedia.publicUrl} alt={accountMedia.altText} fetchPriority="high" decoding="async" />
            </div>
          ) : null}
        </header>

        <section className="simple-route-section simple-enroll-layout">
          <aside className="enroll-next-steps">
            <h2>{t("enroll.nextStepsTitle")}</h2>
            <ol>
              <li>{t("enroll.step1")}</li>
              <li>{t("enroll.step2")}</li>
              <li>{t("enroll.step3")}</li>
            </ol>
          </aside>
          <div className="simple-form-card">
            <p className="simple-eyebrow">{language === "ms" ? "Maklumat Pemohon" : language === "ar" ? "بيانات المتقدم" : "Learner details"}</p>
            <p className="simple-body-copy">{language === "ms" ? "Ruangan bertanda bintang adalah wajib diisi." : language === "ar" ? "الحقول المميزة بالنجمة إلزامية." : "Fields marked with an asterisk are required."}</p>
            <div className="mt-6">
              <LeadForm />
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
