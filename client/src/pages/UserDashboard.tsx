import { useAuth } from "@/_core/hooks/useAuth";
import { BackgroundCircleField } from "@/components/BackgroundCircleField";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";

const OPERATIONS_ROLES = ["founder", "super_admin"];

export default function UserDashboard() {
  const { user, loading, logout } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/login" });
  const isOperationsUser = Boolean(user && OPERATIONS_ROLES.includes(user.role));
  const isTeacher = user?.role === "teacher";

  useEffect(() => {
    if (isOperationsUser) window.location.href = user?.role === "super_admin" ? "/super-admin" : "/admin";
    if (isTeacher) window.location.href = "/teacher";
  }, [isOperationsUser, isTeacher, user?.role]);

  if (loading || isOperationsUser || isTeacher) return <main className="minimal-auth-state"><BackgroundCircleField seed="member-loading" /><div><p className="minimal-eyebrow">Account</p><h1>Preparing your workspace</h1><p>Please wait while your account access is confirmed.</p></div></main>;

  const role = user?.role === "student" ? "Student" : user?.role === "teacher" ? "Teacher" : "Member";
  return <main className="member-page blue-member-page">
    <BackgroundCircleField seed={`member-${user?.role ?? "user"}`} />
    <header className="member-header"><Link href="/" className="auth-brand" aria-label="Bilingual Idol Learning Centre home"><span aria-hidden="true">BI</span><div><strong>Bilingual Idol</strong><small>Learning centre</small></div></Link><Button type="button" variant="outline" className="member-signout" onClick={() => logout()}><LogOut size={16} />Sign out</Button></header>
    <section className="member-content" aria-labelledby="member-dashboard-title">
      <div className="member-welcome"><span className="member-avatar" aria-hidden="true"><UserRound size={23} /></span><p className="simple-eyebrow">{role} account</p><h1 id="member-dashboard-title">Welcome{user?.name ? `, ${user.name}` : ""}.</h1><p>Your account is ready. Information shared by the centre will appear here when it is available for your role.</p></div>
      <section className="member-next-step" aria-label="Next step"><div><BookOpen aria-hidden="true" size={21} /><h2>Find a programme</h2><p>Review the current programme information or contact the centre if you need help choosing the right option.</p></div><Link href="/programs" className="simple-button">View programmes<ArrowRight size={16} /></Link></section>
      <section className="member-status" aria-label="Account information"><ShieldCheck aria-hidden="true" size={19} /><div><strong>No account information is published yet.</strong><p>Schedules, materials, payments and progress will appear only when the centre enables the relevant account area.</p></div></section>
    </section>
  </main>;
}
