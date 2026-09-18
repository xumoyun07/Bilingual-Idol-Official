import { useEffect } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  email: z.string().trim().max(320).optional().default(""),
  phone: z.string().trim().max(64).optional().default(""),
  message: z.string().trim().max(1500, "Please keep your message under 1,500 characters.").optional(),
  reasonType: z.enum(["general", "consultation", "campusTour"]),
}).refine(data => data.email.trim().length > 0 || data.phone.trim().length > 0, {
  message: "Please provide either an email or a phone number so we can reach you.",
  path: ["email"],
});

type InquiryValues = z.infer<typeof inquirySchema>;

const fieldClass = "mt-2 w-full rounded-lg border border-[#d9cbb8] bg-white px-3.5 py-3 text-sm text-[#10253e] shadow-sm outline-none placeholder:text-[#708098] focus:border-[#173fad] focus:ring-2 focus:ring-[#173fad]/20 min-h-[44px]";

export function LeadForm({ title }: { type?: "enrollment" | "inquiry"; title?: string }) {
  const { t, isRTL, language } = useLanguage();
  const form = useForm<InquiryValues>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
      reasonType: "general",
    },
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const reason = searchParams.get("reason");
    if (reason && ["general", "consultation", "campusTour"].includes(reason)) {
      form.setValue("reasonType", reason as "general" | "consultation" | "campusTour");
    }
  }, [form]);

  const mutation = trpc.submissions.createInquiry.useMutation();

  const onSubmit = async (values: InquiryValues) => {
    try {
      await mutation.mutateAsync({
        ...values,
        sourcePage: window.location.pathname + window.location.search,
      });
      form.reset();
    } catch (e) {
      console.error(e);
    }
  };

  const errorFor = (key: keyof InquiryValues) => form.formState.errors[key]?.message;

  if (mutation.isSuccess) {
    return (
      <div className={`compass-status-ok p-7 ${isRTL ? "is-rtl text-right" : ""}`} role="status">
        <CheckCircle2 size={30} className="text-emerald-600" aria-hidden="true" />
        <h3 className="compass-display mt-4 text-3xl font-bold text-[#10253e]">{t("enroll.successTitle", undefined, "Thank You!")}</h3>
        <p className="mt-2 text-sm leading-6 text-[#53657a]">{t("enroll.successSubtitle", undefined, "Your enquiry has been submitted. Our team will contact you shortly.")}</p>
        <button
          className="mt-5 text-sm font-extrabold underline underline-offset-4 min-h-[44px] text-[#173fad]"
          onClick={() => {
            mutation.reset();
          }}
        >
          {t("enroll.submitAnother", undefined, "Submit another enquiry")}
        </button>
      </div>
    );
  }

  return (
    <form className={`p-1 sm:p-2 ${isRTL ? "is-rtl text-right" : ""}`} onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div>
        <p className="compass-kicker text-xs font-bold uppercase tracking-wider text-[#173fad]">
          {language === "ms" ? "Hubungi Kami" : language === "ar" ? "تواصل معنا" : "Let’s talk"}
        </p>
        <h2 className="compass-display mt-3 text-2xl sm:text-3xl font-bold text-[#10253e]">{title || t("contact.formTitle", undefined, "Send an Enquiry")}</h2>
        <p className="mt-2 text-sm leading-6 text-[#53657a]">{t("contact.formSubtitle", undefined, "Have a question or want to book a visit? Leave your details below.")}</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-[#29415b] sm:col-span-2">
          {t("enroll.studentNameLabel", undefined, "Your Name")} <span className="text-red-500">*</span>
          <input
            className={fieldClass}
            autoComplete="name"
            placeholder={language === "ms" ? "Nama penuh anda" : language === "ar" ? "اسمك الكامل" : "Your full name"}
            aria-invalid={Boolean(errorFor("name"))}
            aria-describedby={errorFor("name") ? "name-error" : undefined}
            {...form.register("name")}
          />
        </label>

        <label className="text-sm font-bold text-[#29415b] sm:col-span-2">
          {language === "ms" ? "Tujuan Pertanyaan" : language === "ar" ? "سبب الاستفسار" : "Enquiry Purpose"}
          <select
            className={fieldClass}
            aria-invalid={Boolean(errorFor("reasonType"))}
            aria-describedby={errorFor("reasonType") ? "reasonType-error" : undefined}
            {...form.register("reasonType")}
          >
            <option value="general">{language === "ms" ? "Pertanyaan Umum" : language === "ar" ? "استفسار عام" : "General Enquiry"}</option>
            <option value="consultation">{language === "ms" ? "Tempah Sesi Konsultasi" : language === "ar" ? "حجز جلسة استشارة" : "Book Consultation"}</option>
            <option value="campusTour">{language === "ms" ? "Tempah Lawatan Kampus" : language === "ar" ? "حجز جولة في المركز" : "Book Campus Tour"}</option>
          </select>
        </label>

        <label className="text-sm font-bold text-[#29415b]">
          {t("enroll.emailLabel", undefined, "Email Address")}
          <input
            className={fieldClass}
            type="email"
            placeholder={t("enroll.emailPlaceholder", undefined, "name@example.com")}
            autoComplete="email"
            aria-invalid={Boolean(errorFor("email"))}
            aria-describedby={errorFor("email") ? "email-error" : undefined}
            {...form.register("email")}
          />
        </label>

        <label className="text-sm font-bold text-[#29415b]">
          {t("enroll.phoneLabel", undefined, "Phone Number")}
          <input
            className={fieldClass}
            type="tel"
            placeholder={t("enroll.phonePlaceholder", undefined, "+60 12-345 6789")}
            autoComplete="tel"
            aria-invalid={Boolean(errorFor("phone"))}
            aria-describedby={errorFor("phone") ? "phone-error" : undefined}
            {...form.register("phone")}
          />
        </label>

        <label className="text-sm font-bold text-[#29415b] sm:col-span-2">
          {t("enroll.messageLabel", undefined, "Your Message")}
          <textarea
            className={`${fieldClass} min-h-24 resize-y`}
            maxLength={1500}
            placeholder={language === "ms" ? "Bagaimana kami boleh membantu anda?" : language === "ar" ? "كيف يمكننا مساعدتك؟" : "How can we help you?"}
            {...form.register("message")}
          />
        </label>
      </div>

      <div className="mt-3 min-h-5 text-xs text-[#b14e38]" role="alert">
        {Object.entries(form.formState.errors).map(([key, value]) => (
          <p key={key} id={`${key}-error`}>
            {value.message}
          </p>
        ))}
        {form.formState.errors.root?.message && (
          <p>{form.formState.errors.root.message}</p>
        )}
      </div>

      {mutation.error && (
        <p className="compass-status-error mt-2 p-3 text-sm font-semibold text-red-600 bg-red-50 rounded-lg" role="alert">
          {language === "ms"
            ? "Kami tidak dapat menghantar butiran anda buat masa ini. Sila cuba lagi."
            : language === "ar"
            ? "تعذر إرسال البيانات الآن. يرجى المحاولة مرة أخرى."
            : "We could not send your details just now. Please try again."}
        </p>
      )}

      <button
        className="compass-btn-primary mt-5 w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-[#173fad] hover:bg-[#12318a] text-white font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 shadow-md"
        type="submit"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={17} />}
        {t("contact.submitButton", undefined, "Send Enquiry")}
      </button>
    </form>
  );
}
