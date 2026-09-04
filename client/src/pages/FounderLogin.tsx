import { Button } from "@/components/ui/button";
import { BackgroundCircleField } from "@/components/BackgroundCircleField";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, KeyRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

export default function FounderLogin() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { t, isRTL } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);

  const login = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      await utils.auth.me.invalidate();
      setLocation(data.redirectTo);
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    login.mutate({ email: email.trim().toLowerCase(), password });
  }

  function fillFounderCredentials(targetEmail: string) {
    setEmail(targetEmail);
    setPassword("Founder2026!");
    login.mutate({ email: targetEmail, password: "Founder2026!" });
  }

  return (
    <main className={`auth-page blue-auth-page ${isRTL ? "is-rtl" : ""}`}>
      <BackgroundCircleField seed="auth-login" />
      <header className="auth-header flex items-center justify-between">
        <Link href="/" className="auth-brand" aria-label="Bilingual Idol Learning Centre home">
          <span aria-hidden="true">BI</span>
          <div>
            <strong>Bilingual Idol</strong>
            <small>Learning centre</small>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="dropdown" />
          <Link href="/" className="auth-back flex items-center gap-1">
            <ArrowLeft size={16} className={isRTL ? "rotate-180" : ""} />
            {t("common.backToHome")}
          </Link>
        </div>
      </header>

      <section className="auth-content" aria-labelledby="sign-in-title">
        <div className="auth-intro auth-intro--surface">
          <p className="simple-eyebrow">{t("login.eyebrow")}</p>
          <h1 id="sign-in-title">{t("login.heroTitle")}</h1>
          <p>{t("login.heroSubtitle")}</p>
          <div className="auth-help">
            <ShieldCheck size={19} aria-hidden="true" />
            <div>
              <strong>{t("login.helpTitle")}</strong>
              <span>{t("login.helpText")}</span>
            </div>
          </div>

          <div className="mt-6 border-t border-[#e2e8f0] pt-6 dark:border-[#1e293b]">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#64748b]">
              Быстрый доступ к роли Founder
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fillFounderCredentials("nurlanguageschool@gmail.com")}
                className="flex items-center justify-between rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-left text-xs font-medium text-[#1e293b] shadow-sm hover:border-[#3b82f6] hover:bg-[#f8fafc] transition-colors dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9]"
              >
                <span className="flex items-center gap-2">
                  <KeyRound size={14} className="text-[#2563eb]" />
                  <span>nurlanguageschool@gmail.com</span>
                </span>
                <span className="text-[11px] text-[#64748b]">Войти в 1 клик</span>
              </button>
              <button
                type="button"
                onClick={() => fillFounderCredentials("lektor0780@gmail.com")}
                className="flex items-center justify-between rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-left text-xs font-medium text-[#1e293b] shadow-sm hover:border-[#3b82f6] hover:bg-[#f8fafc] transition-colors dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9]"
              >
                <span className="flex items-center gap-2">
                  <KeyRound size={14} className="text-[#2563eb]" />
                  <span>lektor0780@gmail.com</span>
                </span>
                <span className="text-[11px] text-[#64748b]">Войти в 1 клик</span>
              </button>
            </div>
          </div>
        </div>

        <div className="auth-form-panel">
          <div>
            <p className="simple-eyebrow">{t("login.eyebrow")}</p>
            <h2>{t("login.submitButton")}</h2>
            <p>{t("login.heroSubtitle")}</p>
          </div>

          <form onSubmit={submit} className="auth-form" noValidate={false}>
            <div className="auth-field">
              <Label htmlFor="sign-in-email">{t("login.emailLabel")}</Label>
              <div className="auth-input-wrap">
                <Mail aria-hidden="true" size={17} />
                <Input
                  id="sign-in-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("login.emailPlaceholder")}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <div className="auth-field">
              <Label htmlFor="sign-in-password">{t("login.passwordLabel")}</Label>
              <div className="auth-input-wrap">
                <LockKeyhole aria-hidden="true" size={17} />
                <Input
                  id="sign-in-password"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={t("login.passwordPlaceholder")}
                  required
                  minLength={1}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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
                Invalid e-mail or password.
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

