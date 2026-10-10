import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Inbox, Loader2, UserCheck, UserPlus, XCircle } from "lucide-react";
import Founder from "./Founder";

/**
 * C2/G3: консоль admin на /admin. Основатель, открывший /admin, до C3 видит
 * founder-консоль; admin получает собственную консоль: обзор + очередь заявок
 * (Application Pipeline, A2) без единого founder-слова.
 */
export default function Admin() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) { window.location.replace("/login"); return; }
    if (user.role === "super_admin") { window.location.replace("/super-admin"); return; }
    if (user.role !== "founder" && user.role !== "admin") { window.location.replace("/dashboard"); return; }
  }, [loading, user]);

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[#fbf8f2]"><Loader2 className="animate-spin text-[#173fad]" /></div>;
  }
  if (!user) return null;
  if (user.role === "founder") return <Founder />;

  return (
    <DashboardLayout>
      <AdminConsole />
    </DashboardLayout>
  );
}

function AdminConsole() {
  const { t, td } = useLanguage();
  const utils = trpc.useUtils();
  const [category, setCategory] = useState("all");
  const [programFilter, setProgramFilter] = useState("");

  const queue = trpc.applications.queue.useQuery({
    applicantCategory: category === "all" ? undefined : category,
    programInterest: programFilter.trim() || undefined,
  });
  const assign = trpc.applications.assign.useMutation();
  const approve = trpc.applications.approve.useMutation();
  const reject = trpc.applications.reject.useMutation();
  const apps = trpc.applications.adminList.useQuery();
  const advance = trpc.applications.advanceStatus.useMutation();

  const refresh = () => {
    void utils.applications.queue.invalidate();
    void utils.applications.adminList.invalidate();
  };

  const rows = queue.data ?? [];

  return (
    <div data-page="admin" className="w-full space-y-6 p-6 text-start">
      <div>
        <h1 className="text-lg font-bold text-[#10253e]">{t("adminConsole.title", undefined, "Administrator Console")}</h1>
        <p className="mt-1 max-w-xl text-sm text-[#53657a]">
          {t("adminConsole.overview", undefined, "Programmes, admissions and the registration queue. User accounts, audit and security are managed by other roles.")}
        </p>
      </div>

      <section className="rounded-2xl border border-[#edf2f5] bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-bold text-[#10253e]">{t("adminConsole.queueTitle", undefined, "Registration queue")}</h2>
          <select
            value={category}
            onChange={event => setCategory(event.target.value)}
            className="rounded-lg border border-[#d9e2f1] px-2 py-1.5 text-xs text-[#10253e]"
            aria-label={t("adminConsole.filterCategory", undefined, "Applicant category")}
          >
            <option value="all">{t("adminConsole.category.all", undefined, "All categories")}</option>
            <option value="adult">{t("adminConsole.category.adult", undefined, "Adult")}</option>
            <option value="child">{t("adminConsole.category.child", undefined, "Child")}</option>
            <option value="internationalStudent">{t("adminConsole.category.internationalStudent", undefined, "International student")}</option>
          </select>
          <input
            value={programFilter}
            onChange={event => setProgramFilter(event.target.value)}
            placeholder={t("adminConsole.filterProgram", undefined, "Filter by programme…")}
            className="rounded-lg border border-[#d9e2f1] px-2 py-1.5 text-xs text-[#10253e]"
          />
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-[#708098]">
            <Inbox size={24} aria-hidden="true" />
            <p className="text-xs">{t("adminConsole.empty", undefined, "No registration requests match the current filters.")}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map(row => (
              <li key={row.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#edf2f5] bg-[#fcfdfe] p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[#10253e]"><bdi>{row.fullName}</bdi></p>
                  <p className="truncate text-[11px] text-[#566983]">
                    <bdi dir="ltr">{row.email}</bdi> · <bdi>{row.programInterest}</bdi> · {td(row.applicantCategory)} · {td(row.status)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={assign.isPending}
                    onClick={() => assign.mutate({ submissionId: Number(row.id) }, { onSuccess: refresh })}
                    className="rounded-lg border border-[#d9e2f1] bg-white px-2.5 py-1.5 text-xs font-bold text-[#445d80] hover:text-[#173fad]"
                  >
                    <UserPlus size={12} className="me-1 inline" aria-hidden="true" />
                    {t("adminConsole.action.assign", undefined, "Assign to me")}
                  </button>
                  <button
                    type="button"
                    disabled={approve.isPending || String(row.status) === "accountCreated"}
                    onClick={() => approve.mutate({ submissionId: Number(row.id) }, { onSuccess: refresh })}
                    className="rounded-lg bg-[#173fad] px-2.5 py-1.5 text-xs font-bold text-white"
                  >
                    <UserCheck size={12} className="me-1 inline" aria-hidden="true" />
                    {t("adminConsole.action.approve", undefined, "Approve")}
                  </button>
                  <button
                    type="button"
                    disabled={reject.isPending || String(row.status) === "accountCreated"}
                    onClick={() => {
                      const reason = window.prompt(t("adminConsole.action.rejectPrompt", undefined, "Rejection reason:"));
                      if (reason && reason.trim().length >= 3) {
                        reject.mutate({ submissionId: Number(row.id), reason: reason.trim() }, { onSuccess: refresh });
                      }
                    }}
                    className="rounded-lg border border-rose-100 bg-rose-50/40 px-2.5 py-1.5 text-xs font-bold text-rose-600"
                  >
                    <XCircle size={12} className="me-1 inline" aria-hidden="true" />
                    {t("adminConsole.action.reject", undefined, "Reject")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      </section>

      <section className="rounded-2xl border border-[#edf2f5] bg-white p-5">
        <h2 className="mb-3 text-sm font-bold text-[#10253e]">{t("adminConsole.applicationsTitle", undefined, "Applications")}</h2>
        {(apps.data ?? []).length === 0 ? (
          <p className="text-xs text-[#708098]">{t("adminConsole.noApplications", undefined, "No applications yet. Approve a registration request to create one.")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {(apps.data ?? []).map(app => (
              <li key={app.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#edf2f5] bg-[#fcfdfe] p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#10253e]"><bdi dir="ltr">#{app.id}</bdi> · {td(String(app.status))}</p>
                  <p className="text-[11px] text-[#566983]"><bdi dir="ltr">{td("Student")} #{app.userId}</bdi></p>
                </div>
                <button
                  type="button"
                  disabled={advance.isPending || String(app.status) === "registrationCompleted"}
                  onClick={() => advance.mutate({ applicationId: Number(app.id) }, { onSuccess: refresh })}
                  className="rounded-lg border border-[#d9e2f1] bg-white px-2.5 py-1.5 text-xs font-bold text-[#445d80] hover:text-[#173fad] disabled:opacity-50"
                >
                  {t("adminConsole.action.advance", undefined, "Advance stage")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
