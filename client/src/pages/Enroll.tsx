import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { RegistrationForm } from "@/components/RegistrationForm";
import { PublicLayout } from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Enroll() {
  const { t, isRTL } = useLanguage();
  const media = trpc.media.publicList.useQuery();
  const accountMedia = (media.data ?? []).find(item => item.slot === "home_task_account");

  return (
    <PublicLayout>
      <div id="enroll-page-container" data-page="enroll" className={`simple-route-page enroll-page page-enroll ${isRTL ? "is-rtl" : ""}`}>
        <header id="enroll-hero-header" className="simple-route-header enroll-hero-header">
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
              <img src={accountMedia.publicUrl} alt={accountMedia.altText} decoding="async" />
            </div>
          ) : null}
        </header>

        <section id="enroll-layout-section" className="simple-route-section simple-enroll-layout">
          <aside id="enroll-next-steps-aside" className="enroll-next-steps">
            <h2>{t("enroll.nextStepsTitle")}</h2>
            <ol>
              <li>{t("enroll.step1")}</li>
              <li>{t("enroll.step2")}</li>
              <li>{t("enroll.step3")}</li>
            </ol>
          </aside>
          <div id="enroll-form-card" className="simple-form-card">
            <div className="mt-2">
              <RegistrationForm />
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
