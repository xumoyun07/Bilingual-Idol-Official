import { ClipboardList, ListChecks } from "lucide-react";

export type DynamicField = {
  id: number;
  key: string;
  label: string;
  fieldType: "text" | "textarea" | "number" | "date" | "dropdown" | "checkbox";
  isRequired: boolean;
  placeholder: string | null;
  options: string[];
  sectionId: number | null;
  sortOrder: number;
  isActive: boolean;
};

export type DynamicSection = { id: number; title: string; icon: string; sortOrder: number; isActive: boolean };

export function DynamicUserProfileFields({ fields, sections, values, onChange }: { fields: DynamicField[]; sections: DynamicSection[]; values: Record<string, string>; onChange: (key: string, value: string) => void }) {
  const activeFields = fields.filter(field => field.isActive);
  if (!activeFields.length) return <section className="mt-6 rounded-xl border border-dashed border-[#d8cfbf] bg-[#faf6ef] p-5"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e7f0eb] text-[#397563]"><ListChecks size={18} /></span><div><p className="font-bold text-[#10253e]">Additional profile fields are not configured.</p><p className="mt-1 text-sm leading-5 text-[#53657a]">Use Configure create form to add optional profile fields or edit any active base account field.</p></div></div></section>;
  const activeSections = sections.filter(section => section.isActive);
  const ungrouped = activeFields.filter(field => !field.sectionId || !activeSections.some(section => section.id === field.sectionId));
  return <section className="mt-6 space-y-4" aria-label="Additional profile fields"><div className="border-t border-[#e6dccd] pt-6"><p className="founder-command-eyebrow">Additional profile</p><h3 className="mt-2 font-display text-3xl text-[#10253e]">Configured details</h3><p className="mt-1 text-sm leading-6 text-[#53657a]">Fields below are defined by the Founder. Required fields are checked again by the server.</p></div>{activeSections.map(section => { const sectionFields = activeFields.filter(field => field.sectionId === section.id); return sectionFields.length ? <ProfileSection key={section.id} title={section.title} fields={sectionFields} values={values} onChange={onChange} /> : null; })}{ungrouped.length ? <ProfileSection title="Other details" fields={ungrouped} values={values} onChange={onChange} /> : null}</section>;
}

function ProfileSection({ title, fields, values, onChange }: { title: string; fields: DynamicField[]; values: Record<string, string>; onChange: (key: string, value: string) => void }) {
  return <section className="rounded-xl border border-[#e6dccd] bg-[#faf6ef] p-4 sm:p-5"><div className="mb-4 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e7f0eb] text-[#397563]"><ClipboardList size={15} /></span><h4 className="font-bold text-[#10253e]">{title}</h4></div><div className="grid gap-4 sm:grid-cols-2">{fields.map(field => <RuntimeField key={field.id} field={field} value={values[field.key] ?? ""} onChange={value => onChange(field.key, value)} />)}</div></section>;
}

function RuntimeField({ field, value, onChange }: { field: DynamicField; value: string; onChange: (value: string) => void }) {
  const label = <span>{field.label}{field.isRequired ? <span className="ml-1 text-[#c55e44]" aria-hidden="true">*</span> : null}</span>;
  const shared = "mt-1.5 h-12 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 text-sm text-[#10253e] outline-none focus:border-[#397563] focus:ring-2 focus:ring-[#b9d7ca]";
  if (field.fieldType === "textarea") return <label data-profile-field-key={field.key} className="block text-xs font-extrabold text-[#53657a] sm:col-span-2">{label}<textarea required={field.isRequired} value={value} placeholder={field.placeholder ?? undefined} onChange={event => onChange(event.target.value)} className="mt-1.5 min-h-28 w-full rounded-xl border border-[#dfd1bf] bg-white px-3 py-3 text-sm text-[#10253e] outline-none focus:border-[#397563] focus:ring-2 focus:ring-[#b9d7ca]" /></label>;
  if (field.fieldType === "dropdown") return <label data-profile-field-key={field.key} className="block text-xs font-extrabold text-[#53657a]">{label}<select required={field.isRequired} value={value} onChange={event => onChange(event.target.value)} className={shared}><option value="">Select an option</option>{field.options.map(option => <option key={option} value={option}>{option}</option>)}</select></label>;
  if (field.fieldType === "checkbox") return <label data-profile-field-key={field.key} className="flex min-h-14 items-center justify-between gap-4 rounded-xl border border-[#e1d5c4] bg-white px-4 text-sm font-bold text-[#29415b]"><span>{label}<span className="mt-0.5 block text-xs font-normal text-[#708098]">Select if applicable.</span></span><input aria-label={field.label} required={field.isRequired} type="checkbox" checked={value === "true"} onChange={event => onChange(event.target.checked ? "true" : "false")} className="h-5 w-5 accent-[#397563]" /></label>;
  return <label data-profile-field-key={field.key} className="block text-xs font-extrabold text-[#53657a]">{label}<input required={field.isRequired} type={field.fieldType} value={value} placeholder={field.placeholder ?? undefined} onChange={event => onChange(event.target.value)} className={shared} /></label>;
}
