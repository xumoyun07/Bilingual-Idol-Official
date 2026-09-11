import { Button } from "@/components/ui/button";
import { BackgroundCircleField } from "@/components/BackgroundCircleField";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { COOKIE_NAME } from "@shared/const";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

export default function FounderLogin() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { t, isRTL, language } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const titles: Record<string, string> = {
      en: "Sign in | Bilingual Idol Language Centre",
      ms: "Log Masuk | Pusat Bahasa Bilingual Idol",
      ar: "تسجيل الدخول | مركز بايلينجوال آيدول للغات",
    };
    document.title = titles[language] || titles.en;
  }, [language]);

  const login = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      if (data.token) {
        try {
          sessionStorage.setItem("manus-cookie", `${COOKIE_NAME}=${data.token}`);
          localStorage.setItem("manus-cookie", `${COOKIE_NAME}=${data.token}`);
          sessionStorage.setItem("manus-session-token", data.token);
          localStorage.setItem("manus-session-token", data.token);
        } catch {}
      }
      try {
        await utils.auth.me.invalidate();
      } catch {}
      window.location.href = data.redirectTo;
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    login.mutate({ email: email.trim().toLowerCase(), password });
  }

  return (
    <main id="login-page-container" data-page="login" key={`auth-page-${language}`} className={`auth-page blue-auth-page page-login ${isRTL ? "is-rtl" : ""}`}>
      <BackgroundCircleField seed="auth-login" />
      <header id="login-hero-header" className="auth-header flex items-center justify-between">
        <Link href="/" className="auth-brand" aria-label={t("footer.centreName")}>
          <span aria-hidden="true">BI</span>
          <div>
            <strong>Bilingual Idol</strong>
            <small>{t("footer.brandSubtitle")}</small>
          </div>
        </Link>
        <Link href="/" className="auth-back flex items-center gap-1">
          <ArrowLeft size={16} className={isRTL ? "rotate-180" : ""} />
          {t("common.backToHome")}
        </Link>
      </header>

      <section id="login-content-section" className="auth-content max-md:pt-0" aria-labelledby="sign-in-title">
        {/* Mobile-only Header texts */}
        <div className="md:hidden text-center max-w-md mx-auto mb-2 px-4 bg-white border border-[#edf2f5] rounded-2xl py-5 shadow-xs max-md:-mt-[10px] max-md:-mb-[20px]">
          <p className="simple-eyebrow text-[10px] uppercase tracking-wider text-[#526d9c]">{t("login.eyebrow")}</p>
          <h1 className="text-xl font-bold text-[#10253e] mt-1 leading-tight">{t("login.heroTitle")}</h1>
          <p className="text-xs text-[#566983] mt-1 leading-normal">{t("login.heroSubtitle")}</p>
        </div>

        <div className="auth-intro auth-intro--surface order-2 md:order-1 max-md:!border-0 max-md:!bg-transparent max-md:!shadow-none max-md:!p-0 max-md:-mt-5">
          {/* Desktop-only Header texts */}
          <div className="hidden md:block">
            <p className="simple-eyebrow">{t("login.eyebrow")}</p>
            <h1 id="sign-in-title">{t("login.heroTitle")}</h1>
            <p>{t("login.heroSubtitle")}</p>
          </div>
          
          <div className="auth-help max-sm:p-3 max-md:mt-[15px] max-sm:gap-2">
            <ShieldCheck size={14} className="max-sm:mt-0 max-sm:size-4" aria-hidden="true" />
            <div className="max-sm:text-[10px]">
              <strong className="max-sm:text-[10px] max-sm:block">{t("login.helpTitle")}</strong>
              <span className="max-sm:text-[9px] max-sm:mt-0.5 max-sm:block max-sm:leading-tight">{t("login.helpText")}</span>
            </div>
          </div>
        </div>

        <div className="auth-form-panel order-1 md:order-2 max-md:bg-white max-md:border-0">
          <div>
            <p className="simple-eyebrow">{t("login.eyebrow")}</p>
            <h2>{t("login.submitButton")}</h2>
            <p>{t("login.heroSubtitle")}</p>
          </div>

          <form key={`login-form-${language}`} onSubmit={submit} className="auth-form" noValidate={false}>
            <div className="auth-field">
              <Label htmlFor="sign-in-email">{t("login.emailLabel")}</Label>
              <div className="auth-input-wrap">
                <Mail aria-hidden="true" size={17} />
                <Input
                  id="sign-in-email"
                  key={`sign-in-email-${language}`}
                  type="text"
                  autoComplete="username"
                  placeholder={t("login.emailPlaceholder")}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            </div>

            <div className="auth-field">
              <Label htmlFor="sign-in-password">{t("login.passwordLabel")}</Label>
              <div className="auth-input-wrap">
                <LockKeyhole aria-hidden="true" size={17} />
                <Input
                  id="sign-in-password"
                  key={`sign-in-password-${language}`}
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={t("login.passwordPlaceholder")}
                  required
                  minLength={1}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  dir={isRTL ? "rtl" : "ltr"}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={visible ? t("login.hidePassword") : t("login.showPassword")}
                  onClick={() => setVisible((current) => !current)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {login.error ? (
              <p className="auth-error" role="alert">
                {t("login.invalidCredentials", undefined, "Invalid e-mail or password.")}
              </p>
            ) : null}

            <Button type="submit" className="auth-submit" disabled={login.isPending}>
              {login.isPending ? t("login.signingIn") : t("login.submitButton")}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}


