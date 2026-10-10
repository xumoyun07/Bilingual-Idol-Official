import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

/**
 * Application Status Tracker (M13, S3): чек-лист стадий заявки в кабинете студента.
 * Только просмотр: статус меняют admin (вперёд) и founder (оверсайд).
 * visaProcess скрыт для не-международных заявителей (приходит уже отфильтрованным
 * полем visible, но здесь не зависит от flex-row-reverse — порядок логический,
 * dir наследуется от корня, поэтому в арабском список зеркалится сам).
 */
export function ApplicationStatusTracker() {
  const { t } = useLanguage();
  const query = trpc.applications.myStatus.useQuery();

  if (query.isLoading) return null;
  if (!query.data || query.data.state === "no_application" || !query.data.application) return null;

  const application = query.data.application;
  const visible = application.chain.filter(entry => entry.visible);
  const currentIndex = visible.findIndex(entry => entry.stage === application.status);

  return (
    <section
      className="mt-6 w-full max-w-md rounded-2xl border border-[#edf2f5] bg-white p-5 text-start"
      aria-label={t("tracker.title", undefined, "Track Application")}
    >
      <h2 className="mb-4 text-sm font-bold text-[#10253e]">{t("tracker.title", undefined, "Track Application")}</h2>
      <ol className="flex flex-col gap-2">
        {visible.map((entry, index) => {
          const done = currentIndex >= 0 && index < currentIndex;
          const active = index === currentIndex;
          return (
            <li key={entry.stage} className="flex items-center gap-3">
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                  done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                    : active
                    ? "border-[#173fad] bg-[#173fad] text-white"
                    : "border-[#d9e2f1] bg-white text-transparent"
                }`}
              >
                {done ? <Check size={14} aria-hidden="true" /> : <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />}
              </span>
              <span className={`text-xs ${active ? "font-bold text-[#10253e]" : done ? "font-semibold text-[#33475b]" : "text-[#708098]"}`}>
                {t(`tracker.stage.${entry.stage}`, undefined, entry.stage)}
              </span>
              {active && (
                <span className="ms-auto rounded-full bg-[#e8eeff] px-2 py-0.5 text-[10px] font-bold text-[#173fad]">
                  {t("tracker.current", undefined, "Current stage")}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}