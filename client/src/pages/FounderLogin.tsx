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

        <div className="custom-login-card w-full max-w-md mx-auto bg-white border border-slate-100 rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(16,37,62,0.04)] order-1 md:order-2 relative overflow-hidden">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#eef4ff] text-[#173fad] text-[10px] sm:text-xs font-extrabold uppercase tracking-widest rounded-full mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#173fad] animate-pulse"></span>
              {t("login.eyebrow")}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#10253e] tracking-tight">
              {t("login.submitButton")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              {t("login.heroSubtitle")}
            </p>
          </div>

          <form key={`login-form-${language}`} onSubmit={submit} className="space-y-5" noValidate={false}>
            <div className="space-y-2">
              <Label htmlFor="sign-in-email" className="text-[11px] font-extrabold text-[#10253e] tracking-widest uppercase">
                {t("login.emailLabel")}
              </Label>
              <div className="relative flex items-center group">
                <Mail className="absolute left-4 text-slate-400 group-focus-within:text-[#173fad] transition-colors pointer-events-none" size={18} />
                <input
                  id="sign-in-email"
                  key={`sign-in-email-${language}`}
                  type="email"
                  autoComplete="email"
                  placeholder={t("login.emailPlaceholder")}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-slate-50/50 border border-slate-200 focus:border-[#173fad] focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#173fad]/10 transition-all duration-200"
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sign-in-password" className="text-[11px] font-extrabold text-[#10253e] tracking-widest uppercase">
                {t("login.passwordLabel")}
              </Label>
              <div className="relative flex items-center group">
                <LockKeyhole className="absolute left-4 text-slate-400 group-focus-within:text-[#173fad] transition-colors pointer-events-none" size={18} />
                <input
                  id="sign-in-password"
                  key={`sign-in-password-${language}`}
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={t("login.passwordPlaceholder")}
                  required
                  minLength={1}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full h-12 pl-12 pr-12 bg-slate-50/50 border border-slate-200 focus:border-[#173fad] focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#173fad]/10 transition-all duration-200"
                  dir={isRTL ? "rtl" : "ltr"}
                />
                <button
                  type="button"
                  onClick={() => setVisible((prev) => !prev)}
                  className="absolute right-4 text-slate-400 hover:text-[#173fad] focus:outline-none transition-colors"
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {login.error ? (
              <p className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded-lg p-3 text-center" role="alert">
                {t("login.invalidCredentials", undefined, "Invalid e-mail or password.")}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full h-12 flex items-center justify-center bg-[#173fad] hover:bg-[#10253e] active:bg-[#0c1c2e] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#173fad]/15 hover:shadow-xl hover:shadow-[#173fad]/25 active:shadow-md active:translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              {login.isPending ? t("login.signingIn") : t("login.submitButton")}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}


