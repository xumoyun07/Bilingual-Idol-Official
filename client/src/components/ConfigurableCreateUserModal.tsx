import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DynamicUserProfileFields, type DynamicField, type DynamicSection } from "@/components/DynamicUserProfileFields";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Loader2 } from "lucide-react";

type ManagedRole = "student" | "teacher" | "marketing" | "admin" | "super_admin";
type Draft = { name: string; email: string; password: string; role: ManagedRole; isActive: boolean };
type SystemField = { id: "name" | "email" | "role" | "password" | "isActive"; label: string; inputType: "text" | "email" | "role" | "password" | "checkbox"; isRequired: boolean; isActive: boolean; sortOrder: number; sectionId: number | null };
const roles: ManagedRole[] = ["student", "teacher", "marketing", "admin", "super_admin"];
const roleLabels: Record<ManagedRole, string> = { student: "Student", teacher: "Teacher", marketing: "Marketing", admin: "Admin", super_admin: "Super admin" };

export function ConfigurableCreateUserModal({ draft, setDraft, profileValues, setProfileValues, pending, error, onSubmit, onClose }: { draft: Draft; setDraft: (draft: Draft) => void; profileValues: Record<string, string>; setProfileValues: (values: Record<string, string>) => void; pending: boolean; error?: string; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  const schema = trpc.users.formSchema.useQuery();
  const systemFields = ((schema.data?.systemFields ?? []) as SystemField[]).filter(field => field.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const fields = (schema.data?.fields ?? []) as DynamicField[];
  const sections = (schema.data?.sections ?? []) as DynamicSection[];
  return <form data-testid="users-modal-form" onSubmit={onSubmit}>
    <DialogHeader className="border-b border-[#e6dccd] bg-white px-6 py-6 text-left"><p className="founder-command-eyebrow">Issue new access</p><DialogTitle className="font-display text-4xl text-[#10253e]">Create user</DialogTitle><DialogDescription className="max-w-xl text-[#53657a]">This form follows the active Field Builder configuration. Hidden fields are safely generated in the background when needed so the account record remains valid.</DialogDescription></DialogHeader>
    <div className="px-6 py-6">{error ? <Alert variant="destructive" className="mb-5"><AlertCircle className="h-4 w-4" /><AlertTitle>Account action needs attention</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}{schema.isLoading ? <div className="grid min-h-48 place-items-center"><Loader2 className="animate-spin text-[#397563]" /></div> : <><div className="grid gap-4 sm:grid-cols-2">{systemFields.map(field => <SystemInput key={field.id} field={field} draft={draft} setDraft={setDraft} />)}</div><DynamicUserProfileFields fields={fields} sections={sections} values={profileValues} onChange={(key, value) => setProfileValues({ ...profileValues, [key]: value })} /></>}</div>
    <DialogFooter className="border-t border-[#e6dccd] bg-white px-6 py-5"><div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={onClose} disabled={pending} className="min-h-12 border-[#d8cfbf] text-[#53657a] hover:bg-[#faf6ef]">Cancel</Button><Button type="submit" disabled={pending || schema.isLoading} className="compass-btn-primary min-h-12">{pending ? <Loader2 className="animate-spin" size={16} /> : null}Create user</Button></div></DialogFooter>
  </form>;
}

function SystemInput({ field, draft, setDraft }: { field: SystemField; draft: Draft; setDraft: (draft: Draft) => void }) {
  if (field.id === "name" || field.id === "email" || field.id === "password") return <label className="block text-xs font-extrabold text-[#53657a]">{field.label}<input required={field.isRequired} type={field.inputType} autoComplete={field.id === "password" ? "new-password" : field.id === "email" ? "email" : "name"} value={draft[field.id]} onChange={event => setDraft({ ...draft, [field.id]: event.target.value })} className="mt-1.5 h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm text-[#10253e] outline-none focus:border-[#397563] focus:ring-2 focus:ring-[#b9d7ca]" />{field.id === "password" ? <span className="mt-1.5 block text-[11px] font-normal leading-4 text-[#708098]">Minimum 10 characters when visible. Stored only as a salted hash.</span> : null}</label>;
  if (field.id === "role") return <label className="block text-xs font-extrabold text-[#53657a]">{field.label}<select required={field.isRequired} value={draft.role} onChange={event => setDraft({ ...draft, role: event.target.value as ManagedRole })} className="mt-1.5 h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm text-[#10253e] outline-none focus:border-[#397563] focus:ring-2 focus:ring-[#b9d7ca]">{roles.map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label>;
  return <label className="flex min-h-14 items-center justify-between gap-4 rounded-xl border border-[#e1d5c4] bg-[#faf6ef] px-4 text-sm font-bold text-[#29415b] sm:col-span-2"><span><span className="block">{field.label}</span><span className="mt-0.5 block text-xs font-normal text-[#708098]">Controls whether the issued account can sign in.</span></span><input aria-label={field.label} required={field.isRequired} type="checkbox" checked={draft.isActive} onChange={event => setDraft({ ...draft, isActive: event.target.checked })} className="h-5 w-5 accent-[#397563]" /></label>;
}
