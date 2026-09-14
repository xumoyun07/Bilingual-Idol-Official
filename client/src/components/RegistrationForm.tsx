import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

// Dynamic registration form schema can be validated client-side and sent as standard values record.
const registrationBaseSchema = z.object({
  programInterest: z.string().trim().min(1, "Please select a program."),
  applicantCategory: z.enum(["child", "adult", "international"]),
  fullName: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z.string().trim().min(7, "Please enter a valid phone number."),
  values: z.record(z.string(), z.string()).default({}),
});

type RegistrationValues = z.infer<typeof registrationBaseSchema>;

const fieldClass = "mt-2 w-full rounded-lg border border-[#d9cbb8] bg-white px-3.5 py-3 text-sm text-[#10253e] shadow-sm outline-none placeholder:text-[#708098] focus:border-[#173fad] focus:ring-2 focus:ring-[#173fad]/20 min-h-[44px]";

export function RegistrationForm() {
  const { t, isRTL, language } = useLanguage();
  
  // Get pre-filled program from URL query
  const queryParams = new URLSearchParams(window.location.search);
  const initialProgram = queryParams.get("program") || "";

  const form = useForm<RegistrationValues>({
    defaultValues: {
      programInterest: initialProgram,
      applicantCategory: "adult",
      fullName: "",
      email: "",
      phone: "",
      values: {},
    },
  });

  // Watch fields to ensure reactive behavior
  const valuesWatch = form.watch("values");

  // If initialProgram changes or load, update form value
  useEffect(() => {
    if (initialProgram) {
      form.setValue("programInterest", initialProgram);
    }
  }, [initialProgram, form]);

  const schemaQuery = trpc.submissions.getRegistrationSchema.useQuery();
  const programsQuery = trpc.content.publicPrograms.useQuery();
  const mutation = trpc.submissions.createRegistration.useMutation();

  const onSubmit = async (data: RegistrationValues) => {
    // Validate custom fields
    if (schemaQuery.data?.fields) {
      for (const field of schemaQuery.data.fields) {
        if (field.isRequired) {
          const val = data.values[field.key];
          if (!val || val.trim().length === 0) {
            form.setError(`values.${field.key}` as any, {
              type: "manual",
              message: `${field.label} is required.`,
            });
            return;
          }
        }
      }
    }

    try {
      await mutation.mutateAsync(data);
      form.reset({
        programInterest: "",
        applicantCategory: "adult",
        fullName: "",
        email: "",
        phone: "",
        values: {},
      });
    } catch (e) {
      console.error(e);
    }
  };

  const errorFor = (key: keyof RegistrationValues) => form.formState.errors[key]?.message;

  if (mutation.isSuccess) {
    return (
      <div className={`compass-status-ok p-7 text-center sm:text-left ${isRTL ? "is-rtl text-right" : ""}`} role="status">
        <CheckCircle2 size={40} className="mx-auto sm:mx-0 text-emerald-600 mb-4" aria-hidden="true" />
        <h3 className="compass-display text-3xl font-bold text-[#10253e]">{t("enroll.successTitle", undefined, "Registration Submitted!")}</h3>
        <p className="mt-2 text-sm leading-6 text-[#53657a]">
          {language === "ms"
            ? "Pendaftaran anda berjaya dihantar. Sila semak e-mel anda atau hubungi WhatsApp kami untuk tindakan seterusnya."
            : language === "ar"
            ? "تم تقديم طلب التسجيل بنجاح. يرجى مراجعة بريدك الإلكتروني أو التواصل معنا عبر الواتساب لإكمال الإجراءات."
            : "Your registration was submitted successfully. Our admissions team will review your application and email you credentials to log in to the Student Portal."}
        </p>

        <div className="mt-6 flex flex-wrap gap-3 justify-center sm:justify-start">
          <a
            href="https://wa.me/60367310449"
            target="_blank"
            rel="noreferrer"
            className="simple-button bg-[#173fad] text-white px-5 py-2.5 rounded-lg font-bold"
          >
            💬 {language === "ms" ? "Hubungi Penasihat di WhatsApp" : language === "ar" ? "تواصل معنا عبر واتساب" : "Contact Admissions on WhatsApp"}
          </a>
          <button
            className="simple-button simple-button-quiet border border-slate-200 px-5 py-2.5 rounded-lg text-[#173fad]"
            onClick={() => mutation.reset()}
          >
            {t("enroll.submitAnother", undefined, "Submit another registration")}
          </button>
        </div>
      </div>
    );
  }

  const dynamicFields = schemaQuery.data?.fields || [];

  return (
    <form className={`p-1 sm:p-2 ${isRTL ? "is-rtl text-right" : ""}`} onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div>
        <p className="compass-kicker text-xs font-bold uppercase tracking-wider text-[#173fad]">
          {language === "ms" ? "Kemasukan 2026" : language === "ar" ? "القبول لعام 2026" : "Admissions 2026"}
        </p>
        <h2 className="compass-display mt-3 text-2xl sm:text-3xl font-bold text-[#10253e]">
          {language === "ms" ? "Daftar untuk Kemasukan" : language === "ar" ? "نموذج تقديم طلب التسجيل" : "Application for Admissions"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#53657a]">
          {language === "ms"
            ? "Lengkapkan pendaftaran dalam talian anda untuk memulakan perjalanan akademik anda di Kuala Lumpur."
            : language === "ar"
            ? "أكمل تقديم طلبك إلكترونياً لبدء رحلتك التعليمية المتميزة معنا في كوالالمبور."
            : "Complete the form below to begin. This takes only 2 minutes and registers you into our student queue."}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Base Fields */}
        <label className="text-sm font-bold text-[#29415b] sm:col-span-2">
          {language === "ms" ? "Program yang Diminati" : language === "ar" ? "البرنامج الدراسي المفضل" : "Program of Interest"} <span className="text-red-500">*</span>
          <select
            className={fieldClass}
            aria-invalid={Boolean(errorFor("programInterest"))}
            aria-describedby={errorFor("programInterest") ? "programInterest-error" : undefined}
            {...form.register("programInterest")}
          >
            <option value="">{t("enroll.programPlaceholder", undefined, "Choose a program...")}</option>
            <option value="General English (1-12 Months)">
              {language === "ms" ? "Bahasa Inggeris Umum (1-12 Bulan)" : language === "ar" ? "اللغة الإنجليزية العامة (1-12 شهراً)" : "General English (1-12 Months)"}
            </option>
            <option value="IELTS Preparation Track">
              {language === "ms" ? "Laluan Persediaan IELTS" : language === "ar" ? "مسار التحضير لاختبار الآيلتس" : "IELTS Preparation Track"}
            </option>
            <option value="Summer Camp Intensive">
              {language === "ms" ? "Kem Musim Panas Intensif" : language === "ar" ? "المخيم الصيفي المكثف" : "Summer Camp Intensive"}
            </option>
            <option value="1-on-1 Private Lessons">
              {language === "ms" ? "Pelajaran Peribadi 1-sama-1" : language === "ar" ? "دروس خاصة فردية 1-على-1" : "1-on-1 Private Lessons"}
            </option>
            <option value="Executive Business English">
              {language === "ms" ? "Bahasa Inggeris Perniagaan Eksekutif" : language === "ar" ? "الإنجليزية للأعمال التنفيذية" : "Executive Business English"}
            </option>
            {programsQuery.data?.map((program) => (
              <option key={program.id} value={program.title}>
                {program.title}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-bold text-[#29415b]">
          {language === "ms" ? "Kategori Pemohon" : language === "ar" ? "فئة المتقدم" : "Applicant Category"} <span className="text-red-500">*</span>
          <select
            className={fieldClass}
            aria-invalid={Boolean(errorFor("applicantCategory"))}
            aria-describedby={errorFor("applicantCategory") ? "applicantCategory-error" : undefined}
            {...form.register("applicantCategory")}
          >
            <option value="adult">{language === "ms" ? "Pelajar Dewasa / Umum" : language === "ar" ? "طالب بالغ / عام" : "Adult / General Learner"}</option>
            <option value="child">{language === "ms" ? "Pelajar Junior (Kanak-kanak / Remaja)" : language === "ar" ? "طالب ناشئ (يافعين / أطفال)" : "Junior Learner (Child / Teen)"}</option>
            <option value="international">{language === "ms" ? "Pelajar Antarabangsa (Memerlukan Visa EMGS)" : language === "ar" ? "طالب دولي (بحاجة لتأشيرة دراسية)" : "International Student (EMGS Visa Needed)"}</option>
          </select>
        </label>

        <label className="text-sm font-bold text-[#29415b]">
          {language === "ms" ? "Nama Penuh Pemohon" : language === "ar" ? "الاسم الكامل للمتقدم" : "Applicant Full Name"} <span className="text-red-500">*</span>
          <input
            className={fieldClass}
            autoComplete="name"
            placeholder={language === "ms" ? "Cth. Muhammad Ali" : language === "ar" ? "الاسم كما هو في جواز السفر" : "Your official name"}
            aria-invalid={Boolean(errorFor("fullName"))}
            aria-describedby={errorFor("fullName") ? "fullName-error" : undefined}
            {...form.register("fullName")}
          />
        </label>

        <label className="text-sm font-bold text-[#29415b]">
          {t("enroll.emailLabel", undefined, "Email Address")} <span className="text-red-500">*</span>
          <input
            className={fieldClass}
            type="email"
            placeholder={t("enroll.emailPlaceholder", undefined, "student@example.com")}
            autoComplete="email"
            aria-invalid={Boolean(errorFor("email"))}
            aria-describedby={errorFor("email") ? "email-error" : undefined}
            {...form.register("email")}
          />
        </label>

        <label className="text-sm font-bold text-[#29415b]">
          {t("enroll.phoneLabel", undefined, "Phone Number")} <span className="text-red-500">*</span>
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

        {/* Dynamic Fields */}
        {dynamicFields.map((field) => {
          const valueKey = `values.${field.key}`;
          const isErr = !!form.formState.errors.values?.[field.key];
          const errMsg = form.formState.errors.values?.[field.key]?.message;

          return (
            <div key={field.id} className="sm:col-span-2">
              <label className="text-sm font-bold text-[#29415b]">
                {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                
                {field.fieldType === "text" && (
                  <input
                    type="text"
                    placeholder={field.placeholder || ""}
                    className={fieldClass}
                    {...form.register(valueKey as any)}
                  />
                )}

                {field.fieldType === "textarea" && (
                  <textarea
                    placeholder={field.placeholder || ""}
                    className={`${fieldClass} min-h-24 resize-y`}
                    {...form.register(valueKey as any)}
                  />
                )}

                {field.fieldType === "number" && (
                  <input
                    type="number"
                    placeholder={field.placeholder || ""}
                    className={fieldClass}
                    {...form.register(valueKey as any)}
                  />
                )}

                {field.fieldType === "date" && (
                  <input
                    type="date"
                    className={fieldClass}
                    {...form.register(valueKey as any)}
                  />
                )}

                {field.fieldType === "dropdown" && (
                  <select
                    className={fieldClass}
                    {...form.register(valueKey as any)}
                  >
                    <option value="">{field.placeholder || "Select option..."}</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                {field.fieldType === "checkbox" && (
                  <div className="mt-2.5 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`chk-${field.id}`}
                      className="h-5 w-5 rounded border-[#d9cbb8] text-[#173fad] focus:ring-[#173fad]/20"
                      onChange={(e) => {
                        form.setValue(valueKey as any, e.target.checked ? "true" : "false");
                      }}
                      checked={valuesWatch?.[field.key] === "true"}
                    />
                    <span className="text-sm font-medium text-[#53657a]">{field.placeholder || "Yes, I agree"}</span>
                  </div>
                )}

                {field.fieldType === "file" && (
                  <div className="mt-2 border-2 border-dashed border-[#d9cbb8] rounded-lg p-5 text-center bg-slate-50/50 hover:bg-slate-50 transition-all">
                    <input
                      type="file"
                      id={`file-${field.id}`}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          form.setValue(valueKey as any, `${file.name} (${Math.round(file.size / 1024)} KB)`);
                        }
                      }}
                    />
                    <label htmlFor={`file-${field.id}`} className="cursor-pointer block">
                      <span className="text-[#173fad] font-bold text-sm block">
                        {valuesWatch?.[field.key] ? "✓ File chosen" : "Choose file"}
                      </span>
                      <span className="text-xs text-[#708098] mt-1 block">
                        {valuesWatch?.[field.key] || field.placeholder || "Select a document or image to attach."}
                      </span>
                    </label>
                  </div>
                )}
              </label>

              {isErr && (
                <p className="text-xs text-red-500 mt-1">{errMsg}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 min-h-5 text-xs text-[#b14e38]" role="alert">
        {Object.entries(form.formState.errors)
          .filter(([k]) => k !== "values")
          .map(([key, value]) => {
            const msg = typeof value === "object" && value && "message" in value ? (value.message as string) : "";
            return msg ? <p key={key}>{msg}</p> : null;
          })}
      </div>

      {mutation.error && (
        <p className="compass-status-error mt-2 p-3 text-sm font-semibold text-red-600 bg-red-50 rounded-lg" role="alert">
          {language === "ms"
            ? "Kami tidak dapat memproses pendaftaran anda buat masa ini. Sila cuba lagi."
            : language === "ar"
            ? "تعذر إرسال طلب التسجيل الآن. يرجى المحاولة مرة أخرى."
            : "We could not process your registration. Please verify details and try again."}
        </p>
      )}

      <button
        className="compass-btn-primary mt-6 w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-[#173fad] hover:bg-[#12318a] text-white font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 shadow-md"
        type="submit"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={17} />}
        {language === "ms" ? "Hantar Pendaftaran Kursus" : language === "ar" ? "تقديم طلب التسجيل" : "Submit Course Registration"}
      </button>
    </form>
  );
}
