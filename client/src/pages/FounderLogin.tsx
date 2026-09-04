import { Button } from "@/components/ui/button";
import { BackgroundCircleField } from "@/components/BackgroundCircleField";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
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

