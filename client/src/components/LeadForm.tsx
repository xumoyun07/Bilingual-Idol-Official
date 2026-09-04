import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

const leadSchema = z.object({
  studentName: z.string().trim().min(2, "Please enter the student's full name.").max(160),
  studentAge: z.coerce.number().int().min(3, "Please enter an age of 3 or above.").max(100, "Please enter a valid age."),
  parentName: z.string().trim().min(2, "Please enter the parent or guardian's name.").max(160),
  parentEmail: z.string().trim().email("Please enter a valid email address.").max(320),
  parentPhone: z.string().trim().min(7, "Please enter a valid phone number.").max(64),
  programInterest: z.string().min(2, "Please choose a programme."),
  preferredSchedule: z.string().min(2, "Please choose a preferred schedule."),
  message: z.string().max(1500, "Please keep your message under 1,500 characters.").optional(),
});

type LeadValues = z.infer<typeof leadSchema>;

const fieldClass = "mt-2 w-full rounded-lg border border-[#d9cbb8] bg-white px-3.5 py-3 text-sm text-[#10253e] shadow-sm outline-none placeholder:text-[#708098] focus:border-[#397563] focus:ring-2 focus:ring-[#397563]/20 min-h-[44px]";

export function LeadForm({ type = "enrollment", title }: { type?: "enrollment" | "inquiry"; title?: string }) {
  const [mobileStep, setMobileStep] = useState<number>(1);
  const { t, isRTL, language } = useLanguage();
  const form = useForm<LeadValues>({
    defaultValues: {
      studentName: "",
      studentAge: undefined,
      parentName: "",
      parentEmail: "",
      parentPhone: "",
      programInterest: "",
      preferredSchedule: "",
      message: "",
    },
  });

  const mutation = trpc.submissions.create.useMutation();
  const programs = trpc.content.publicPrograms.useQuery();

  const formTitle = title || (type === "enrollment" ? t("enroll.formTitle") : t("contact.formTitle"));

  const onSubmit = async (values: LeadValues) => {
    const parsed = leadSchema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof LeadValues;
        form.setError(key, { type: "validate", message: issue.message });
      });
      return;
    }
    await mutation.mutateAsync({ ...parsed.data, type, source: "website" });
    form.reset();
    setMobileStep(1);
  };

  const errorFor = (key: keyof LeadValues) => form.formState.errors[key]?.message;

  const validateStep1 = async () => {
    const valid = await form.trigger(["studentName", "studentAge"]);
    if (valid) setMobileStep(2);
  };

  const validateStep2 = async () => {
    const valid = await form.trigger(["programInterest", "preferredSchedule"]);
    if (valid) setMobileStep(3);
  };

  if (mutation.isSuccess) {
    return (
      <div className={`compass-status-ok p-7 ${isRTL ? "is-rtl" : ""}`} role="status">
        <CheckCircle2 size={30} aria-hidden="true" />
        <h3 className="compass-display mt-4 text-3xl">{t("enroll.successTitle")}</h3>
        <p className="mt-2 text-sm leading-6">{t("enroll.successSubtitle")}</p>
        <button
          className="mt-5 text-sm font-extrabold underline underline-offset-4 min-h-[44px]"
          onClick={() => {
            mutation.reset();
            setMobileStep(1);
          }}
        >
          {t("enroll.submitAnother")}
        </button>
      </div>
    );
  }

  return (
    <form className={`p-1 sm:p-2 bilc-adaptive-lead-form ${isRTL ? "is-rtl text-right" : ""}`} onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div>
        <p className="compass-kicker">{language === "ms" ? "Hubungi Kami" : language === "ar" ? "تواصل معنا" : "Let’s talk"}</p>
        <h2 className="compass-display mt-3 text-2xl sm:text-3xl text-[#10253e]">{formTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-[#53657a]">{t("enroll.formSubtitle")}</p>
      </div>

      {/* Mobile-Only Step Progress Tracker */}
      <div className="bilc-form-mobile-stepper sm:hidden mt-4">
        <div className="flex items-center justify-between text-xs font-bold text-[#173fad] mb-2">
          <span>
            {language === "ms" ? `Langkah ${mobileStep} drpd 3` : language === "ar" ? `الخطوة ${mobileStep} من 3` : `Step ${mobileStep} of 3`}
          </span>
          <span>
            {mobileStep === 1
              ? language === "ms" ? "Maklumat Pelajar" : language === "ar" ? "بيانات المتعلم" : "Learner Info"
              : mobileStep === 2
              ? language === "ms" ? "Pilihan Kursus" : language === "ar" ? "المسار الدراسي" : "Course Track"
              : language === "ms" ? "Ibu Bapa & Hubungan" : language === "ar" ? "ولي الأمر والتواصل" : "Guardian & Contact"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${mobileStep >= 1 ? "bg-[#173fad]" : "bg-slate-200"}`} />
          <div className={`h-full rounded-full transition-all ${mobileStep >= 2 ? "bg-[#173fad]" : "bg-slate-200"}`} />
          <div className={`h-full rounded-full transition-all ${mobileStep >= 3 ? "bg-[#173fad]" : "bg-slate-200"}`} />
        </div>
      </div>

      {/* Adaptive Form Body: Step Wizard on Mobile vs. 2-Col on Desktop */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Step 1: Student Information */}
        <div className={`sm:contents ${mobileStep !== 1 ? "hidden sm:contents" : "contents"}`}>
          <label className="text-sm font-bold text-[#29415b]">
            {t("enroll.studentNameLabel")}
            <input
              className={fieldClass}
              autoComplete="name"
              placeholder={t("enroll.studentNamePlaceholder")}
              aria-invalid={Boolean(errorFor("studentName"))}
              aria-describedby={errorFor("studentName") ? "studentName-error" : undefined}
              {...form.register("studentName")}
            />
          </label>

          <label className="text-sm font-bold text-[#29415b]">
            {t("enroll.studentAgeLabel")}
            <input
              className={fieldClass}
              type="number"
              min="3"
              max="100"
              placeholder={t("enroll.studentAgePlaceholder")}
              inputMode="numeric"
              aria-invalid={Boolean(errorFor("studentAge"))}
              aria-describedby={errorFor("studentAge") ? "studentAge-error" : undefined}
              {...form.register("studentAge", { valueAsNumber: true })}
            />
          </label>
        </div>

        {/* Step 2: Program & Schedule */}
        <div className={`sm:contents ${mobileStep !== 2 ? "hidden sm:contents" : "contents"}`}>
          <label className="text-sm font-bold text-[#29415b]">
            {t("enroll.programLabel")}
            <select
              className={fieldClass}
              aria-invalid={Boolean(errorFor("programInterest"))}
              aria-describedby={errorFor("programInterest") ? "programInterest-error" : undefined}
              {...form.register("programInterest")}
            >
              <option value="">{t("enroll.programPlaceholder")}</option>
              <option value="General English (1-12 Months)">General English (1-12 Months)</option>
              <option value="IELTS Preparation Track">IELTS Preparation Track</option>
              <option value="Summer Camp Intensive">Summer Camp Intensive</option>
              <option value="1-on-1 Private Lessons">1-on-1 Private Lessons</option>
              <option value="Executive Business English">Executive Business English</option>
              {programs.data?.map((program) => (
                <option key={program.id} value={program.title}>
                  {program.title}
                </option>
              ))}
              <option value="Not sure yet">{language === "ms" ? "Belum pasti (Perlukan nasihat)" : language === "ar" ? "غير متأكد (طلب استشارة)" : "Not sure yet (Request Guidance)"}</option>
            </select>
          </label>

          <label className="text-sm font-bold text-[#29415b]">
            {t("enroll.scheduleLabel")}
            <select
              className={fieldClass}
              aria-invalid={Boolean(errorFor("preferredSchedule"))}
              aria-describedby={errorFor("preferredSchedule") ? "preferredSchedule-error" : undefined}
              {...form.register("preferredSchedule")}
            >
              <option value="">{t("enroll.schedulePlaceholder")}</option>
              <option value="Weekday mornings">{language === "ms" ? "Pagi hari bekerja (09:00 - 12:00)" : language === "ar" ? "صباح أيام العمل (09:00 - 12:00)" : "Weekday mornings (09:00 - 12:00)"}</option>
              <option value="Weekday afternoons">{language === "ms" ? "Petang hari bekerja (13:30 - 16:30)" : language === "ar" ? "بعد الظهر أيام العمل (13:30 - 16:30)" : "Weekday afternoons (13:30 - 16:30)"}</option>
              <option value="Weekday evenings">{language === "ms" ? "Malam hari bekerja (18:00 - 21:00)" : language === "ar" ? "مساء أيام العمل (18:00 - 21:00)" : "Weekday evenings (18:00 - 21:00)"}</option>
              <option value="Weekends">{language === "ms" ? "Hujung minggu intensif" : language === "ar" ? "عطلة نهاية الأسبوع مكثف" : "Weekends intensive"}</option>
              <option value="Please advise">{language === "ms" ? "Fleksibel / Sila beri cadangan" : language === "ar" ? "مرن / يرجى تقديم المشورة" : "Flexible / Please advise"}</option>
            </select>
          </label>
        </div>

        {/* Step 3: Guardian Details & Notes */}
        <div className={`sm:contents ${mobileStep !== 3 ? "hidden sm:contents" : "contents"}`}>
          <label className="text-sm font-bold text-[#29415b]">
            {t("enroll.parentNameLabel")}
            <input
              className={fieldClass}
              autoComplete="name"
              placeholder={t("enroll.parentNamePlaceholder")}
              aria-invalid={Boolean(errorFor("parentName"))}
              aria-describedby={errorFor("parentName") ? "parentName-error" : undefined}
              {...form.register("parentName")}
            />
          </label>

          <label className="text-sm font-bold text-[#29415b]">
            {t("enroll.emailLabel")}
            <input
              className={fieldClass}
              type="email"
              placeholder={t("enroll.emailPlaceholder")}
              autoComplete="email"
              aria-invalid={Boolean(errorFor("parentEmail"))}
              aria-describedby={errorFor("parentEmail") ? "parentEmail-error" : undefined}
              {...form.register("parentEmail")}
            />
          </label>

          <label className="text-sm font-bold text-[#29415b] sm:col-span-2">
            {t("enroll.phoneLabel")}
            <input
              className={fieldClass}
              type="tel"
              placeholder={t("enroll.phonePlaceholder")}
              autoComplete="tel"
              aria-invalid={Boolean(errorFor("parentPhone"))}
              aria-describedby={errorFor("parentPhone") ? "parentPhone-error" : undefined}
              {...form.register("parentPhone")}
            />
          </label>

          <label className="text-sm font-bold text-[#29415b] sm:col-span-2">
            {t("enroll.messageLabel")}
            <textarea
              className={`${fieldClass} min-h-24 resize-y`}
              maxLength={1500}
              placeholder={t("enroll.messagePlaceholder")}
              {...form.register("message")}
            />
          </label>
        </div>
      </div>

      <div className="mt-3 min-h-5 text-xs text-[#b14e38]" role="alert">
        {Object.entries(form.formState.errors).map(([key, value]) => (
          <p key={key} id={`${key}-error`}>
            {value.message}
          </p>
        ))}
      </div>

      {mutation.error && (
        <p className="compass-status-error mt-2 p-3 text-sm font-semibold" role="alert">
          {language === "ms"
            ? "Kami tidak dapat menghantar butiran anda buat masa ini. Sila cuba lagi."
            : language === "ar"
            ? "تعذر إرسال البيانات الآن. يرجى المحاولة مرة أخرى."
            : "We could not send your details just now. Please try again."}
        </p>
      )}

      {/* Mobile Wizard Nav Buttons (< 768px) */}
      <div className="flex sm:hidden items-center gap-2 mt-4">
        {mobileStep > 1 && (
          <button
            type="button"
            className="bilc-nav-btn min-h-[44px] px-4 flex items-center gap-1"
            onClick={() => setMobileStep((s) => s - 1)}
          >
            <ChevronLeft size={16} className={isRTL ? "rotate-180" : ""} /> {language === "ms" ? "Kembali" : language === "ar" ? "السابق" : "Back"}
          </button>
        )}

        {mobileStep === 1 && (
          <button
            type="button"
            className="compass-btn-primary w-full min-h-[44px] flex items-center justify-center gap-1.5"
            onClick={validateStep1}
          >
            {language === "ms" ? "Teruskan ke Pilihan Kursus" : language === "ar" ? "المتابعة للمسار الدراسي" : "Continue to Course Track"} <ChevronRight size={16} className={isRTL ? "rotate-180" : ""} />
          </button>
        )}

        {mobileStep === 2 && (
          <button
            type="button"
            className="compass-btn-primary flex-1 min-h-[44px] flex items-center justify-center gap-1.5"
            onClick={validateStep2}
          >
            {language === "ms" ? "Teruskan ke Maklumat Hubungan" : language === "ar" ? "المتابعة لبيانات التواصل" : "Continue to Contact"} <ChevronRight size={16} className={isRTL ? "rotate-180" : ""} />
          </button>
        )}

        {mobileStep === 3 && (
          <button
            className="compass-btn-primary flex-1 min-h-[44px] flex items-center justify-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={17} />}
            {type === "enrollment" ? t("enroll.submitButton") : t("contact.submitButton")}
          </button>
        )}
      </div>

      {/* Desktop Submit Button (>= 768px) */}
      <button
        className="hidden sm:flex compass-btn-primary mt-5 w-full min-h-[44px] items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={17} />}
        {type === "enrollment" ? t("enroll.submitButton") : t("contact.submitButton")}
      </button>
    </form>
  );
}
