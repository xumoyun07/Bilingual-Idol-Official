import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { FileImage, Loader2, Trash2, Upload } from "lucide-react";
import { FormEvent, useState } from "react";

const slots = [
  { value: "home_hero_video", label: "Home Hero video", kind: "video" as const },
  { value: "home_hero_poster", label: "Home Hero poster", kind: "image" as const },
  { value: "home_task_programmes", label: "Home programmes card", kind: "image" as const },
  { value: "home_task_contact", label: "Home contact card", kind: "image" as const },
  { value: "home_task_account", label: "Home account card", kind: "image" as const },
  { value: "programmes_listing", label: "Programmes listing image", kind: "image" as const },
  { value: "programme_detail", label: "Programme detail image", kind: "image" as const },
] as const;

type Slot = (typeof slots)[number]["value"];

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The selected file could not be read."));
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(file);
  });
}

export default function MediaLibrary() {
  const utils = trpc.useUtils();
  const inventory = trpc.media.list.useQuery();
  const upload = trpc.media.upload.useMutation({ onSuccess: () => { utils.media.list.invalidate(); utils.media.publicList.invalidate(); } });
  const update = trpc.media.update.useMutation({ onSuccess: () => { utils.media.list.invalidate(); utils.media.publicList.invalidate(); } });
  const remove = trpc.media.remove.useMutation({ onSuccess: () => { utils.media.list.invalidate(); utils.media.publicList.invalidate(); } });
  const [slot, setSlot] = useState<Slot>("home_hero_video");
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const selected = slots.find(item => item.value === slot) ?? slots[0];

  async function submit(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    if (!file) return setNotice("Select a file before uploading.");
    const allowed = selected.kind === "video" ? ["video/mp4"] : ["image/jpeg", "image/webp"];
    const maximum = selected.kind === "video" ? 12 * 1024 * 1024 : 3 * 1024 * 1024;
    if (!allowed.includes(file.type)) return setNotice(selected.kind === "video" ? "Use an MP4 video for this slot." : "Use a JPEG or WebP image for this slot.");
    if (file.size > maximum) return setNotice(selected.kind === "video" ? "Video must be 12 MB or smaller." : "Image must be 3 MB or smaller.");
    try {
      await upload.mutateAsync({ slot, label: selected.label, kind: selected.kind, altText: selected.kind === "video" ? "Decorative silent classroom video background." : altText.trim(), mimeType: file.type as "image/jpeg" | "image/webp" | "video/mp4", fileName: file.name, contentBase64: await toBase64(file), isPublished: true });
      setFile(null); setAltText(""); setNotice("Media was saved and published to its public slot.");
      const input = document.getElementById("public-media-file") as HTMLInputElement | null; if (input) input.value = "";
    } catch (error) { setNotice(error instanceof Error ? error.message : "Media upload could not be completed."); }
  }

  return <DashboardLayout role="founder"><section className="founder-command media-library" aria-labelledby="media-library-title">
    <header className="founder-command-header"><div><p className="founder-command-eyebrow">Public website</p><h1 id="media-library-title" className="founder-command-title">Demonstration media</h1><p className="founder-command-description">Replace public Hero and card media here. Only published items are available to visitors; uploaded bytes remain in project storage.</p></div><FileImage aria-hidden="true" size={28} className="text-[#397563]" /></header>
    <section className="founder-panel founder-panel-paper mt-6"><h2 className="font-display text-2xl text-[#10253e]">Upload or replace media</h2><p className="mt-2 text-sm leading-6 text-[#53657a]">Images: JPEG or WebP up to 3 MB. Hero video: silent MP4 up to 12 MB. A replacement overwrites the public slot reference, not the previous stored object.</p><form className="mt-5 grid gap-4" onSubmit={submit}>
      <div className="grid gap-2"><Label htmlFor="public-media-slot">Public placement</Label><select id="public-media-slot" value={slot} onChange={event => { setSlot(event.target.value as Slot); setFile(null); }} className="min-h-12 border px-3" aria-describedby="public-media-help">{slots.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select><p id="public-media-help" className="text-xs text-[#61727c]">{selected.kind === "video" ? "This video is decorative, muted and looped on the public Home Hero." : "Alternative text is shown to assistive technologies; describe the learning scene briefly."}</p></div>
      {selected.kind === "image" ? <div className="grid gap-2"><Label htmlFor="public-media-alt">Alternative text</Label><Textarea id="public-media-alt" value={altText} onChange={event => setAltText(event.target.value)} minLength={2} maxLength={255} required placeholder="Describe the learning scene without unnecessary detail." /></div> : null}
      <div className="grid gap-2"><Label htmlFor="public-media-file">Media file</Label><Input id="public-media-file" type="file" accept={selected.kind === "video" ? "video/mp4" : "image/jpeg,image/webp"} onChange={event => setFile(event.target.files?.[0] ?? null)} required /><p className="text-xs text-[#61727c]">{file ? `${file.name} · ${Math.ceil(file.size / 1024)} KB` : "No file selected."}</p></div>
      <div className="flex flex-wrap items-center gap-3"><Button type="submit" className="min-h-12" disabled={upload.isPending}>{upload.isPending ? <Loader2 className="animate-spin" size={17} /> : <Upload size={17} />}Save public media</Button>{notice ? <p role="status" className="text-sm text-[#53657a]">{notice}</p> : null}</div>
    </form></section>
    <section className="mt-6" aria-labelledby="media-inventory-title"><div className="flex items-end justify-between gap-4"><div><p className="founder-command-eyebrow">Current inventory</p><h2 id="media-inventory-title" className="mt-2 font-display text-3xl text-[#10253e]">Public media slots</h2></div></div>{inventory.isLoading ? <div className="founder-state founder-state-empty mt-4">Loading public media inventory…</div> : <div className="mt-4 grid gap-4">{inventory.data?.length ? inventory.data.map(item => <MediaRecord key={item.id} item={item} saving={update.isPending || remove.isPending} onUpdate={values => update.mutateAsync({ id: item.id, ...values })} onRemove={() => remove.mutateAsync({ id: item.id })} />) : <div className="founder-state founder-state-empty">No media has been published. Public pages keep their content-first fallback layout until a file is added.</div>}</div>}</section>
  </section></DashboardLayout>;
}

function MediaRecord({ item, saving, onUpdate, onRemove }: { item: { id: number; label: string; slot: string; kind: "image" | "video"; altText: string; publicUrl: string; isPublished: boolean; fileSize: number; mimeType: string }; saving: boolean; onUpdate: (values: { label: string; altText: string; isPublished: boolean }) => Promise<unknown>; onRemove: () => Promise<unknown> }) {
  const [label, setLabel] = useState(item.label); const [altText, setAltText] = useState(item.altText); const [published, setPublished] = useState(item.isPublished); const [message, setMessage] = useState<string | null>(null);
  return <article className="founder-panel founder-panel-paper media-record"><div className="media-record-preview">{item.kind === "video" ? <video src={item.publicUrl} muted playsInline preload="metadata" /> : <img src={item.publicUrl} alt={item.altText} loading="lazy" />}</div><form onSubmit={async event => { event.preventDefault(); setMessage(null); try { await onUpdate({ label, altText, isPublished: published }); setMessage("Saved."); } catch { setMessage("Update could not be completed."); } }}><p className="founder-command-eyebrow">{item.slot}</p><div className="mt-3 grid gap-3"><div><Label htmlFor={`label-${item.id}`}>Label</Label><Input id={`label-${item.id}`} value={label} onChange={event => setLabel(event.target.value)} minLength={2} maxLength={160} required /></div><div><Label htmlFor={`alt-${item.id}`}>Alternative text</Label><Textarea id={`alt-${item.id}`} value={altText} onChange={event => setAltText(event.target.value)} minLength={2} maxLength={255} required /></div><div className="flex items-center justify-between gap-4"><Label htmlFor={`published-${item.id}`}>Published publicly</Label><Switch id={`published-${item.id}`} checked={published} onCheckedChange={setPublished} /></div><p className="text-xs text-[#61727c]">{item.mimeType} · {Math.ceil(item.fileSize / 1024)} KB</p><div className="flex flex-wrap gap-2"><Button type="submit" variant="outline" disabled={saving}>Save details</Button><Button type="button" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" disabled={saving} onClick={async () => { if (!window.confirm(`Remove the ${item.label} reference from the public website?`)) return; try { await onRemove(); } catch { setMessage("Removal could not be completed."); } }}><Trash2 size={16} />Remove</Button>{message ? <span role="status" className="self-center text-xs text-[#53657a]">{message}</span> : null}</div></div></form></article>;
}
