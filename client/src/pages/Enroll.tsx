import { ArrowLeft, Landmark, FileCheck } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { LeadForm } from "@/components/LeadForm";
import { RegistrationForm } from "@/components/RegistrationForm";
import { PublicLayout } from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Enroll() {
  const { t, isRTL, language } = useLanguage();
  const [formType, setFormType] = useState<"inquiry" | "registration">("registration");
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
            {/* Form Selection Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#fcfbfa] border border-[#d9cbb8] rounded-xl mb-6">
              <button
                onClick={() => setFormType("registration")}
                className={`flex items-center justify-center gap-2 px-4 py-3.5 text-xs sm:text-sm font-extrabold rounded-lg transition-all min-h-[44px] ${
                  formType === "registration"
                    ? "bg-[#173fad] text-white shadow-md"
                    : "text-[#53657a] hover:text-[#10253e] hover:bg-slate-50"
                }`}
              >
                <FileCheck size={16} />
                {language === "ms" ? "Pendaftaran Rasmi" : language === "ar" ? "طلب تسجيل رسمي" : "Official Registry"}
              </button>
              <button
                onClick={() => setFormType("inquiry")}
                className={`flex items-center justify-center gap-2 px-4 py-3.5 text-xs sm:text-sm font-extrabold rounded-lg transition-all min-h-[44px] ${
                  formType === "inquiry"
                    ? "bg-[#173fad] text-white shadow-md"
                    : "text-[#53657a] hover:text-[#10253e] hover:bg-slate-50"
                }`}
              >
                <Landmark size={16} />
                {language === "ms" ? "Pertanyaan Cepat" : language === "ar" ? "استفسار سريع" : "Quick Inquiry"}
              </button>
            </div>

            <div className="mt-2">
              {formType === "registration" ? (
                <RegistrationForm />
              ) : (
                <LeadForm />
              )}
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
