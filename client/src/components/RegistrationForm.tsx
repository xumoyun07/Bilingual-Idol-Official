import { CheckCircle2, Loader2, Send, Upload, FileText, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

const registrationSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z.string().trim().min(7, "Please enter a valid phone number."),
  programInterest: z.string().min(2, "Please select a programme of interest."),
  applicantCategory: z.string().min(1, "Please select an applicant category."),
});

type RegistrationValues = z.infer<typeof registrationSchema>;

const fieldClass = "mt-2 w-full rounded-lg border border-[#d9cbb8] bg-white px-3.5 py-3 text-sm text-[#10253e] shadow-sm outline-none placeholder:text-[#708098] focus:border-[#173fad] focus:ring-2 focus:ring-[#173fad]/20 min-h-[44px]";

export function RegistrationForm({ title }: { title?: string }) {
  const { t, isRTL, language } = useLanguage();
  const [customValues, setCustomValues] = useState<Record<number, string>>({});
  const [fileStates, setFileStates] = useState<Record<number, { name: string; size: string; uploading: boolean }>>({});
  
  const form = useForm<RegistrationValues>({
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      programInterest: "",
      applicantCategory: "",
    },
  });

  const mutation = trpc.registrationSubmissions.submit.useMutation();
  const programsQuery = trpc.content.publicPrograms.useQuery();
  const fieldsQuery = trpc.registrationSubmissions.getRegistrationFields.useQuery();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const progPrefill = searchParams.get("programInterest") || searchParams.get("course") || searchParams.get("language");
    const catPrefill = searchParams.get("applicantCategory");

    if (progPrefill) {
      const match = programsQuery.data?.find(
        p => p.title.toLowerCase() === progPrefill.toLowerCase() || p.slug === progPrefill.toLowerCase()
      );
      if (match) {
        form.setValue("programInterest", match.title);
      } else {
        form.setValue("programInterest", progPrefill);
      }
    }

    if (catPrefill) {
      form.setValue("applicantCategory", catPrefill);
    }
  }, [programsQuery.data, form]);

  const handleCustomFieldChange = (fieldId: number, value: string) => {
    setCustomValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleFileUpload = (fieldId: number, file: File) => {
    // Simulate real-time upload progress with state
    setFileStates(prev => ({
      ...prev,
      [fieldId]: { name: file.name, size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`, uploading: true }
    }));

    setTimeout(() => {
      setFileStates(prev => ({
        ...prev,
        [fieldId]: { ...prev[fieldId], uploading: false }
      }));
      // Save simulated path as the field value
      handleCustomFieldChange(fieldId, `/uploads/simulated_${Date.now()}_${file.name}`);
    }, 1500);
  };

  const removeFile = (fieldId: number) => {
    const nextFiles = { ...fileStates };
    delete nextFiles[fieldId];
    setFileStates(nextFiles);

    const nextValues = { ...customValues };
    delete nextValues[fieldId];
    setCustomValues(nextValues);
  };

  const onSubmit = async (values: RegistrationValues) => {
    // Auto-capture UTM variables from URL search parameters
    const searchParams = new URLSearchParams(window.location.search);
    const utmSource = searchParams.get("utm_source") || undefined;
    const utmMedium = searchParams.get("utm_medium") || undefined;
    const utmCampaign = searchParams.get("utm_campaign") || undefined;
    const utmTerm = searchParams.get("utm_term") || undefined;
    const utmContent = searchParams.get("utm_content") || undefined;

    // Convert custom field values to matching array payload
    const fieldValues = Object.entries(customValues).map(([fieldId, value]) => ({
      fieldId: Number(fieldId),
      value,
    }));

    await mutation.mutateAsync({
      ...values,
      fieldValues,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
    });

    form.reset();
    setCustomValues({});
    setFileStates({});
  };

  const errorFor = (key: keyof RegistrationValues) => form.formState.errors[key]?.message;

  if (mutation.isSuccess) {
    return (
      <div className={`compass-status-ok p-8 bg-emerald-50/50 rounded-xl border border-emerald-100 ${isRTL ? "is-rtl text-right" : ""}`} role="status">
        <CheckCircle2 size={36} className="text-emerald-600" aria-hidden="true" />
        <h3 className="compass-display mt-4 text-3xl font-extrabold text-[#10253e]">{language === "ms" ? "Pendaftaran Berjaya!" : language === "ar" ? "تم التسجيل بنجاح!" : "Registration Submitted!"}</h3>
        <p className="mt-2 text-sm leading-6 text-[#53657a]">{language === "ms" ? "Terima kasih atas pendaftaran anda. Pegawai pendaftaran kami akan menghubungi anda dalam masa 24 jam dengan butiran akaun anda." : language === "ar" ? "شكرًا لك على التسجيل. سيتواصل معك مستشار القبول لدينا في غضون ٢٤ ساعة لتزويدك ببيانات حسابك." : "Thank you for registering. Our admissions advisor will contact you within 24 hours with your placement details and course materials."}</p>
        <button
          className="mt-6 text-sm font-extrabold text-[#173fad] hover:underline min-h-[44px]"
          onClick={() => mutation.reset()}
        >
          {language === "ms" ? "Hantar pendaftaran lain" : language === "ar" ? "إرسال طلب تسجيل آخر" : "Submit another registration"}
        </button>
      </div>
    );
  }

  const courseLabel = language === "ms" ? "Kursus Minat *" : language === "ar" ? "البرنامج الدراسي المهتم به *" : "Programme of Interest *";
  const categoryLabel = language === "ms" ? "Kategori Pemohon *" : language === "ar" ? "فئة المتقدم *" : "Applicant Category *";

  return (
    <form className={`p-1 sm:p-2 bilc-adaptive-lead-form ${isRTL ? "is-rtl text-right" : ""}`} onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div>
        <h2 className="compass-display text-2xl sm:text-3xl font-bold text-[#10253e]">
          {title || (language === "ms" ? "Borang Pendaftaran Kemasukan" : language === "ar" ? "نموذج طلب التسجيل والالتحاق" : "Official CRM Registration Form")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#53657a]">
          {language === "ms" ? "Sila lengkapkan butiran di bawah untuk memulakan proses kemasukan rasmi anda." : language === "ar" ? "يرجى ملء النموذج أدناه لبدء عملية الالتحاق والتسجيل الرسمية." : "Please complete the comprehensive registry fields below to begin your academic enrollment."}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Full Name */}
        <label className="text-sm font-bold text-[#29415b]">
          {language === "ms" ? "Nama Penuh *" : language === "ar" ? "الاسم الكامل *" : "Full Name *"}
          <input
            className={fieldClass}
            placeholder={language === "ms" ? "Masukkan nama penuh anda" : language === "ar" ? "أدخل اسمك الكامل" : "Enter your full name"}
            aria-invalid={Boolean(errorFor("fullName"))}
            {...form.register("fullName")}
          />
          {errorFor("fullName") && <span className="text-xs text-red-500 mt-1 block">{errorFor("fullName")}</span>}
        </label>

        {/* Email Address */}
        <label className="text-sm font-bold text-[#29415b]">
          {language === "ms" ? "Alamat Emel *" : language === "ar" ? "البريد الإلكتروني *" : "Email Address *"}
          <input
            className={fieldClass}
            type="email"
            placeholder="name@example.com"
            aria-invalid={Boolean(errorFor("email"))}
            {...form.register("email")}
          />
          {errorFor("email") && <span className="text-xs text-red-500 mt-1 block">{errorFor("email")}</span>}
        </label>

        {/* Phone Number */}
        <label className="text-sm font-bold text-[#29415b]">
          {language === "ms" ? "No. Telefon *" : language === "ar" ? "رقم الهاتف *" : "Phone Number *"}
          <input
            className={fieldClass}
            placeholder="+6012345678"
            aria-invalid={Boolean(errorFor("phone"))}
            {...form.register("phone")}
          />
          {errorFor("phone") && <span className="text-xs text-red-500 mt-1 block">{errorFor("phone")}</span>}
        </label>

        {/* Program Interest */}
        <label className="text-sm font-bold text-[#29415b]">
          {courseLabel}
          <select
            className={fieldClass}
            aria-invalid={Boolean(errorFor("programInterest"))}
            {...form.register("programInterest")}
          >
            <option value="">{language === "ms" ? "Pilih kursus..." : language === "ar" ? "اختر البرنامج..." : "Select a programme..."}</option>
            {programsQuery.data?.map(prog => (
              <option key={prog.id} value={prog.title}>{prog.title} ({prog.language})</option>
            ))}
          </select>
          {errorFor("programInterest") && <span className="text-xs text-red-500 mt-1 block">{errorFor("programInterest")}</span>}
        </label>

        {/* Applicant Category */}
        <label className="text-sm font-bold text-[#29415b]">
          {categoryLabel}
          <select
            className={fieldClass}
            aria-invalid={Boolean(errorFor("applicantCategory"))}
            {...form.register("applicantCategory")}
          >
            <option value="">{language === "ms" ? "Pilih kategori..." : language === "ar" ? "اختر الفئة..." : "Select category..."}</option>
            <option value="individual">{language === "ms" ? "Individu / Persendirian" : language === "ar" ? "فردي / شخصي" : "Individual Student"}</option>
            <option value="corporate">{language === "ms" ? "Tajaan Korporat / Syarikat" : language === "ar" ? "رعاية شركة / مؤسسة" : "Corporate Sponsored"}</option>
            <option value="international">{language === "ms" ? "Pelajar Antarabangsa (Memerlukan Visa)" : language === "ar" ? "طالب دولي (بحاجة لتأشيرة)" : "International Student (Visa Needed)"}</option>
          </select>
          {errorFor("applicantCategory") && <span className="text-xs text-red-500 mt-1 block">{errorFor("applicantCategory")}</span>}
        </label>

        {/* DYNAMIC CUSTOM FIELDS */}
        {fieldsQuery.data?.fields.map(field => {
          const isRequired = field.isRequired;
          const keyId = field.id;
          const currentVal = customValues[keyId] ?? "";

          return (
            <div key={keyId} className="sm:col-span-2 mt-2">
              <label className="text-sm font-bold text-[#29415b] block mb-1">
                {field.label} {isRequired ? "*" : ""}
              </label>

              {field.fieldType === "text" && (
                <input
                  type="text"
                  className={fieldClass}
                  placeholder={field.placeholder || ""}
                  value={currentVal}
                  required={isRequired}
                  onChange={e => handleCustomFieldChange(keyId, e.target.value)}
                />
              )}

              {field.fieldType === "textarea" && (
                <textarea
                  className={`${fieldClass} min-h-[100px] resize-none`}
                  placeholder={field.placeholder || ""}
                  value={currentVal}
                  required={isRequired}
                  onChange={e => handleCustomFieldChange(keyId, e.target.value)}
                />
              )}

              {field.fieldType === "number" && (
                <input
                  type="number"
                  className={fieldClass}
                  placeholder={field.placeholder || ""}
                  value={currentVal}
                  required={isRequired}
                  onChange={e => handleCustomFieldChange(keyId, e.target.value)}
                />
              )}

              {field.fieldType === "date" && (
                <input
                  type="date"
                  className={fieldClass}
                  value={currentVal}
                  required={isRequired}
                  onChange={e => handleCustomFieldChange(keyId, e.target.value)}
                />
              )}

              {field.fieldType === "dropdown" && (
                <select
                  className={fieldClass}
                  value={currentVal}
                  required={isRequired}
                  onChange={e => handleCustomFieldChange(keyId, e.target.value)}
                >
                  <option value="">{language === "ms" ? "Sila pilih..." : language === "ar" ? "الرجاء الاختيار..." : "Please select..."}</option>
                  {field.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {field.fieldType === "checkbox" && (
                <label className="flex items-center gap-3.5 mt-3 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-[#d9cbb8] text-[#173fad] focus:ring-[#173fad]"
                    checked={currentVal === "true"}
                    required={isRequired}
                    onChange={e => handleCustomFieldChange(keyId, e.target.checked ? "true" : "false")}
                  />
                  <span className="text-sm text-[#53657a]">{field.placeholder || "Agree to conditions"}</span>
                </label>
              )}

              {field.fieldType === "file" && (
                <div className="mt-2">
                  {fileStates[keyId] ? (
                    <div className="flex items-center justify-between p-3.5 rounded-lg border border-[#d9cbb8] bg-[#fcfbfa]">
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-[#173fad]" />
                        <div>
                          <p className="text-sm font-semibold text-[#10253e] truncate max-w-xs">{fileStates[keyId].name}</p>
                          <p className="text-xs text-[#708098]">
                            {fileStates[keyId].uploading 
                              ? (language === "ms" ? "Memuat naik..." : language === "ar" ? "جاري الرفع..." : "Uploading...")
                              : fileStates[keyId].size}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(keyId)}
                        className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                        aria-label="Remove uploaded file"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center rounded-lg border-2 border-dashed border-[#d9cbb8] bg-[#fcfbfa] hover:bg-slate-50/50 hover:border-[#173fad] transition-colors px-6 py-6 text-center cursor-pointer relative">
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(keyId, file);
                        }}
                      />
                      <div>
                        <Upload size={24} className="mx-auto text-[#708098]" />
                        <p className="mt-2 text-sm text-[#10253e] font-semibold">
                          {language === "ms" ? "Klik atau seret fail untuk memuat naik" : language === "ar" ? "انقر أو اسحب الملف للتحميل" : "Click or drag file to upload"}
                        </p>
                        <p className="text-xs text-[#708098] mt-1">
                          {language === "ms" ? "Format PDF, PNG, JPG atau DOCX (Maks 10MB)" : language === "ar" ? "صيغ PDF أو PNG أو JPG أو DOCX (بحد أقصى ١٠ ميجابايت)" : "PDF, PNG, JPG or DOCX (Max 10MB)"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#173fad] hover:bg-[#102c7e] text-white font-extrabold rounded-lg shadow-md transition-colors disabled:opacity-55 min-h-[44px]"
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {language === "ms" ? "Memproses..." : language === "ar" ? "جاري الإرسال..." : "Processing..."}
            </>
          ) : (
            <>
              {language === "ms" ? "Hantar Pendaftaran" : language === "ar" ? "تقديم طلب التسجيل" : "Submit Registration"}
              <Send size={18} className={isRTL ? "rotate-180" : ""} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
