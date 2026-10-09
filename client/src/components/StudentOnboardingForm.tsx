import { useForm } from "react-hook-form";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle2, Loader2, Send } from "lucide-react";

const fieldClass = "mt-2 w-full rounded-lg border border-[#d9cbb8] bg-white px-3.5 py-3 text-sm text-[#10253e] shadow-sm outline-none placeholder:text-[#708098] focus:border-[#173fad] focus:ring-2 focus:ring-[#173fad]/20 min-h-[44px]";

export function StudentOnboardingForm({ onComplete }: { onComplete?: () => void }) {
  const { t, isRTL, language } = useLanguage();
  const utils = trpc.useUtils();
  
  const schemaQuery = trpc.submissions.getOnboardingSchema.useQuery();
  const mutation = trpc.submissions.submitOnboarding.useMutation();

  const form = useForm<Record<string, string>>({
    defaultValues: {},
  });

  const valuesWatch = form.watch();

  const fields = schemaQuery.data?.fields || [];

  if (schemaQuery.isLoading) {
    return (
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center">
        <Loader2 className="animate-spin text-[#173fad] mx-auto" size={24} />
        <p className="text-sm text-[#53657a] mt-2">Loading profile setup...</p>
      </div>
    );
  }

  if (fields.length === 0) {
    return null;
  }

  const onSubmit = async (values: Record<string, string>) => {
    // Client-side required field validation
    for (const field of fields) {
      if (field.isRequired) {
        const val = values[field.key];
        if (!val || val.trim().length === 0) {
          form.setError(field.key, {
            type: "manual",
            message: `${field.label} is required.`,
          });
          return;
        }
      }
    }

    try {
      await mutation.mutateAsync(values);
      // Invalidate onboarding schema to refetch (will return empty if all filled)
      await utils.submissions.getOnboardingSchema.invalidate();
      if (onComplete) onComplete();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] border border-[#d9cbb8] rounded-xl p-6 shadow-sm mb-6">
      <div className="flex items-start gap-4">
        <div className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
          {language === "ms" ? "Tindakan Diperlukan" : language === "ar" ? "إجراء مطلوب" : "Required Action"}
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-[#10253e] mt-2">
        {language === "ms" ? "Lengkapkan Profil Pelajar Anda" : language === "ar" ? "أكمل بيانات ملفك الشخصي" : "Complete Your Student Profile"}
      </h3>
      <p className="text-sm text-[#53657a] mt-1">
        {language === "ms"
          ? "Sila isi maklumat penting berikut untuk menyelesaikan pendaftaran akaun anda di portal Bilingual Idol."
          : language === "ar"
          ? "يرجى تعبئة البيانات الهامة التالية لإتمام عملية إعداد حسابك الشخصي في بوابة معهد بايلينجوال آيدول."
          : "Please complete these additional onboarding fields to finalize your student account setup."}
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field: any) => {
            const isErr = !!form.formState.errors[field.key];
            const errMsg = form.formState.errors[field.key]?.message;

            return (
              <div key={field.id} className="sm:col-span-2">
                <label className="text-sm font-bold text-[#29415b]">
                  {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                  
                  {field.fieldType === "text" && (
                    <input
                      type="text"
                      placeholder={field.placeholder || ""}
                      className={fieldClass}
                      {...form.register(field.key)}
                    />
                  )}

                  {field.fieldType === "textarea" && (
                    <textarea
                      placeholder={field.placeholder || ""}
                      className={`${fieldClass} min-h-24 resize-y`}
                      {...form.register(field.key)}
                    />
                  )}

                  {field.fieldType === "number" && (
                    <input
                      type="number"
                      placeholder={field.placeholder || ""}
                      className={fieldClass}
                      {...form.register(field.key)}
                    />
                  )}

                  {field.fieldType === "date" && (
                    <input
                      type="date"
                      className={fieldClass}
                      {...form.register(field.key)}
                    />
                  )}

                  {field.fieldType === "dropdown" && (
                    <select
                      className={fieldClass}
                      {...form.register(field.key)}
                    >
                      <option value="">{field.placeholder || "Select option..."}</option>
                      {field.options?.map((opt: string) => (
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
                        id={`chk-onboarding-${field.id}`}
                        className="h-5 w-5 rounded border-[#d9cbb8] text-[#173fad] focus:ring-[#173fad]/20"
                        onChange={(e) => {
                          form.setValue(field.key, e.target.checked ? "true" : "false");
                        }}
                        checked={valuesWatch[field.key] === "true"}
                      />
                      <span className="text-sm font-medium text-[#53657a]">{field.placeholder || "Yes, I agree"}</span>
                    </div>
                  )}

                  {field.fieldType === "file" && (
                    <div className="mt-2 border-2 border-dashed border-[#d9cbb8] rounded-lg p-5 text-center bg-white hover:bg-slate-50 transition-all">
                      <input
                        type="file"
                        id={`file-onboarding-${field.id}`}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            form.setValue(field.key, `${file.name} (${Math.round(file.size / 1024)} KB)`);
                          }
                        }}
                      />
                      <label htmlFor={`file-onboarding-${field.id}`} className="cursor-pointer block">
                        <span className="text-[#173fad] font-bold text-sm block">
                          {valuesWatch[field.key] ? "✓ File chosen" : "Choose file"}
                        </span>
                        <span className="text-xs text-[#708098] mt-1 block">
                          {valuesWatch[field.key] || field.placeholder || "Select a document or image to attach."}
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

        {mutation.error && (
          <p className="text-sm font-semibold text-red-600 bg-red-50 p-3 rounded-lg" role="alert">
            {language === "ms"
              ? "Kami tidak dapat mengemas kini profil anda. Sila cuba lagi."
              : language === "ar"
              ? "تعذر حفظ البيانات الآن. يرجى المحاولة مرة أخرى."
              : "Could not save profile values. Please try again."}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="min-h-[44px] px-5 bg-[#173fad] hover:bg-[#12318a] text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={16} />}
          {language === "ms" ? "Simpan Maklumat Profil" : language === "ar" ? "حفظ البيانات وإكمال الملف" : "Save Profile Details"}
        </button>
      </form>
    </div>
  );
}
