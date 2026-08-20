import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { trpc } from "@/lib/trpc";

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
const fieldClass = "mt-2 w-full rounded-xl border border-[#d9cbb8] bg-white px-3.5 py-3 text-sm text-[#10253e] shadow-sm outline-none placeholder:text-[#708098] focus:border-[#5e8c7b] focus:ring-2 focus:ring-[#5e8c7b]/20";

export function LeadForm({ type = "enrollment", title = "Begin your language journey" }: { type?: "enrollment" | "inquiry"; title?: string }) {
  const form = useForm<LeadValues>({ defaultValues: { studentName: "", studentAge: undefined, parentName: "", parentEmail: "", parentPhone: "", programInterest: "", preferredSchedule: "", message: "" } });
  const mutation = trpc.submissions.create.useMutation();
  const programs = trpc.content.publicPrograms.useQuery();
  const onSubmit = async (values: LeadValues) => {
    const parsed = leadSchema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach(issue => {
        const key = issue.path[0] as keyof LeadValues;
        form.setError(key, { type: "validate", message: issue.message });
      });
      return;
    }
    await mutation.mutateAsync({ ...parsed.data, type, source: "website" });
    form.reset();
  };
  const errorFor = (key: keyof LeadValues) => form.formState.errors[key]?.message;
  if (mutation.isSuccess) return <div className="rounded-[1.5rem] border border-[#b9d5c9] bg-[#eff8f3] p-7 text-[#1f5f50]" role="status"><CheckCircle2 size={30} aria-hidden="true" /><h3 className="mt-4 font-display text-3xl">Thank you — we have your details.</h3><p className="mt-2 text-sm leading-6">Our team will be in touch to discuss the next best step for your learner.</p><button className="mt-5 text-sm font-extrabold underline underline-offset-4" onClick={() => mutation.reset()}>Submit another response</button></div>;
  return <form className="rounded-[1.5rem] bg-[#f7f1e8] p-5 shadow-[0_16px_50px_rgba(16,37,62,.09)] sm:p-7" onSubmit={form.handleSubmit(onSubmit)} noValidate>
    <div><p className="eyebrow">Let’s talk</p><h2 className="mt-3 font-display text-3xl text-[#10253e]">{title}</h2><p className="mt-2 text-sm leading-6 text-[#53657a]">Tell us a little about the learner. All fields marked with * are required.</p></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-bold text-[#29415b]">Student name *<input className={fieldClass} autoComplete="name" aria-invalid={Boolean(errorFor("studentName"))} aria-describedby={errorFor("studentName") ? "studentName-error" : undefined} {...form.register("studentName")} /></label>
      <label className="text-sm font-bold text-[#29415b]">Student age *<input className={fieldClass} type="number" min="3" max="100" inputMode="numeric" aria-invalid={Boolean(errorFor("studentAge"))} aria-describedby={errorFor("studentAge") ? "studentAge-error" : undefined} {...form.register("studentAge", { valueAsNumber: true })} /></label>
      <label className="text-sm font-bold text-[#29415b]">Parent / guardian name *<input className={fieldClass} autoComplete="name" aria-invalid={Boolean(errorFor("parentName"))} aria-describedby={errorFor("parentName") ? "parentName-error" : undefined} {...form.register("parentName")} /></label>
      <label className="text-sm font-bold text-[#29415b]">Email address *<input className={fieldClass} type="email" autoComplete="email" aria-invalid={Boolean(errorFor("parentEmail"))} aria-describedby={errorFor("parentEmail") ? "parentEmail-error" : undefined} {...form.register("parentEmail")} /></label>
      <label className="text-sm font-bold text-[#29415b]">Phone / WhatsApp *<input className={fieldClass} type="tel" autoComplete="tel" aria-invalid={Boolean(errorFor("parentPhone"))} aria-describedby={errorFor("parentPhone") ? "parentPhone-error" : undefined} {...form.register("parentPhone")} /></label>
      <label className="text-sm font-bold text-[#29415b]">Programme of interest *<select className={fieldClass} aria-invalid={Boolean(errorFor("programInterest"))} aria-describedby={errorFor("programInterest") ? "programInterest-error" : undefined} {...form.register("programInterest")}><option value="">Select a programme</option>{programs.data?.map(program => <option key={program.id} value={program.title}>{program.title}</option>)}<option>Not sure yet</option></select></label>
      <label className="text-sm font-bold text-[#29415b] sm:col-span-2">Preferred schedule *<select className={fieldClass} aria-invalid={Boolean(errorFor("preferredSchedule"))} aria-describedby={errorFor("preferredSchedule") ? "preferredSchedule-error" : undefined} {...form.register("preferredSchedule")}><option value="">Select a preference</option><option>Weekday mornings</option><option>Weekday afternoons</option><option>Weekday evenings</option><option>Weekends</option><option>Please advise</option></select></label>
      <label className="text-sm font-bold text-[#29415b] sm:col-span-2">Anything else we should know? <textarea className={`${fieldClass} min-h-28 resize-y`} maxLength={1500} {...form.register("message")} /></label>
    </div>
    <div className="mt-3 min-h-5 text-xs text-[#b14e38]" role="alert">{Object.entries(form.formState.errors).map(([key, value]) => <p key={key} id={`${key}-error`}>{value.message}</p>)}</div>
    {mutation.error && <p className="mt-2 text-sm font-semibold text-[#b14e38]" role="alert">We could not send your details just now. Please try again.</p>}
    <button className="pressable mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#10253e] px-5 py-3.5 text-sm font-extrabold text-white hover:bg-[#f07e5d] hover:text-[#10253e] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={mutation.isPending}>{mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={17} />} {type === "enrollment" ? "Send enrollment request" : "Send inquiry"}</button>
  </form>;
}
