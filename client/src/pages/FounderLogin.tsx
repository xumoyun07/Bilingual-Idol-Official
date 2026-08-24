import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

export default function FounderLogin() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const login = trpc.auth.login.useMutation({
    onSuccess: async data => {
      await utils.auth.me.invalidate();
      setLocation(data.redirectTo);
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    login.mutate({ email, password });
  }

  return <main className="auth-page blue-auth-page">
    <header className="auth-header">
      <Link href="/" className="auth-brand" aria-label="Bilingual Idol Learning Centre home">
        <span aria-hidden="true">BI</span>
        <div><strong>Bilingual Idol</strong><small>Learning centre</small></div>
      </Link>
      <Link href="/" className="auth-back"><ArrowLeft size={16} />Back to website</Link>
    </header>

    <section className="auth-content" aria-labelledby="sign-in-title">
      <div className="auth-intro">
        <p className="simple-eyebrow">Account access</p>
        <h1 id="sign-in-title">Sign in to your account.</h1>
        <p>Use the e-mail address and password issued by the centre. You will be taken to the workspace available for your account.</p>
        <div className="auth-help"><ShieldCheck size={19} aria-hidden="true" /><div><strong>Access is issued by the centre.</strong><span>There is no public registration. Please contact the centre if you need access details.</span></div></div>
      </div>

      <div className="auth-form-panel">
        <div><p className="simple-eyebrow">Secure sign in</p><h2>Continue</h2><p>Enter both fields to proceed.</p></div>
        <form onSubmit={submit} className="auth-form" noValidate={false}>
          <div className="auth-field"><Label htmlFor="sign-in-email">E-mail</Label><div className="auth-input-wrap"><Mail aria-hidden="true" size={17} /><Input id="sign-in-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></div></div>
          <div className="auth-field"><Label htmlFor="sign-in-password">Password</Label><div className="auth-input-wrap"><LockKeyhole aria-hidden="true" size={17} /><Input id="sign-in-password" type={visible ? "text" : "password"} autoComplete="current-password" required minLength={1} value={password} onChange={event => setPassword(event.target.value)} /><button type="button" className="auth-password-toggle" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible(current => !current)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
          {login.error ? <p className="auth-error" role="alert">Invalid e-mail or password.</p> : null}
          <Button type="submit" className="auth-submit" disabled={login.isPending}>{login.isPending ? "Signing in…" : "Sign in"}</Button>
        </form>
      </div>
    </section>
  </main>;
}
