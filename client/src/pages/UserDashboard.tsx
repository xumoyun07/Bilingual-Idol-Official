import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";

const OPERATIONS_ROLES = ["admin", "super_admin", "founder"];

export default function UserDashboard() {
  const { user, loading, logout } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/login" });
  const isOperationsUser = Boolean(user && OPERATIONS_ROLES.includes(user.role));
  useEffect(() => { if (isOperationsUser) window.location.href = "/admin"; }, [isOperationsUser]);
  if (loading || isOperationsUser) return <main className="compass-page compass-grid grid min-h-screen place-items-center"><p className="compass-kicker">Preparing your dashboard</p></main>;
  const role = user?.role === "student" ? "Student" : user?.role === "teacher" ? "Teacher" : "Member";
  return <main className="compass-page compass-grid min-h-screen"><header className="border-b border-[#ded4c2] bg-[#fbf8f2]/95 backdrop-blur"><div className="compass-shell flex min-h-18 items-center justify-between gap-4 py-4"><Link href="/" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#397563] hover:text-[#10253e]"><ArrowLeft size={16} /> Back to website</Link><Button variant="outline" className="border-[#cbbba4]" onClick={() => logout()}><LogOut className="mr-2" size={15} /> Sign out</Button></div></header><section className="compass-shell grid min-h-[calc(100svh-5.5rem)] place-items-center py-10"><div className="w-full max-w-3xl"><div className="compass-card p-8 sm:p-12"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e7f0eb] text-[#397563]"><UserRound size={26} /></span><p className="compass-kicker mt-8">Private dashboard · {role}</p><h1 className="compass-display mt-4 text-5xl leading-[.95] text-[#10253e]">Welcome back{user?.name ? `, ${user.name}` : ""}.</h1><p className="mt-5 max-w-xl text-base leading-7 text-[#53657a]">This is your private account space. The centre will add account-specific information here when it is ready to share it with you.</p><div className="mt-8 rounded-2xl border border-dashed border-[#cbbba4] bg-[#fbf8f2] p-5"><div className="flex gap-3"><ShieldCheck className="shrink-0 text-[#397563]" size={20} /><div><p className="font-bold text-[#10253e]">No account information is published yet.</p><p className="mt-1 text-sm leading-6 text-[#5b6d80]">No schedules, payments, materials, or progress records are shown until the centre enables the appropriate account module.</p></div></div></div></div></div></section></main>;
}
