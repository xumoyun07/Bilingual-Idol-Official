import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  FileImage,
  Film,
  Globe,
  HardDrive,
  Info,
  Loader2,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { FormEvent, useState } from "react";

const slots = [
  { value: "home_hero_video", label: "Home Hero video", kind: "video" as const, desc: "Looped ambient background on the main public homepage hero" },
  { value: "home_hero_poster", label: "Home Hero poster", kind: "image" as const, desc: "Fallback poster preview before hero video streams" },
  { value: "home_task_programmes", label: "Home programmes card", kind: "image" as const, desc: "Featured visual for the academic programmes section card" },
  { value: "home_task_contact", label: "Home contact card", kind: "image" as const, desc: "Visual presentation for the contact & admissions card" },
  { value: "home_task_account", label: "Home account card", kind: "image" as const, desc: "Visual accent for the student & portal access block" },
  { value: "programmes_listing", label: "Programmes listing image", kind: "image" as const, desc: "Header banner across the public programmes directory" },
  { value: "programme_detail", label: "Programme detail image", kind: "image" as const, desc: "Visual media accent across individual course detail views" },
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
  const { td } = useLanguage();
  const utils = trpc.useUtils();
  const inventory = trpc.media.list.useQuery();
  const upload = trpc.media.upload.useMutation({
    onSuccess: () => {
      utils.media.list.invalidate();
      utils.media.publicList.invalidate();
    },
  });
  const update = trpc.media.update.useMutation({
    onSuccess: () => {
      utils.media.list.invalidate();
      utils.media.publicList.invalidate();
    },
  });
  const remove = trpc.media.remove.useMutation({
    onSuccess: () => {
      utils.media.list.invalidate();
      utils.media.publicList.invalidate();
    },
  });
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
    if (!allowed.includes(file.type))
      return setNotice(selected.kind === "video" ? "Use an MP4 video for this slot." : "Use a JPEG or WebP image for this slot.");
    if (file.size > maximum)
      return setNotice(selected.kind === "video" ? "Video must be 12 MB or smaller." : "Image must be 3 MB or smaller.");
    try {
      await upload.mutateAsync({
        slot,
        label: selected.label,
        kind: selected.kind,
        altText: selected.kind === "video" ? "Decorative silent classroom video background." : altText.trim(),
        mimeType: file.type as "image/jpeg" | "image/webp" | "video/mp4",
        fileName: file.name,
        contentBase64: await toBase64(file),
        isPublished: true,
      });
      setFile(null);
      setAltText("");
      setNotice("Media was saved and published to its public slot.");
      const input = document.getElementById("public-media-file") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Media upload could not be completed.");
    }
  }

  return (
    <section
      id="media-library-container"
      data-page="media-library"
      className="founder-command media-library page-media-library mx-auto max-w-[80rem]"
      aria-labelledby="media-library-title"
    >
        <header className="founder-command-header">
          <div>
            <p className="founder-command-eyebrow">Public website · Assets</p>
            <h1 id="media-library-title" className="founder-command-title">
              Media library
            </h1>
            <p className="founder-command-description">
              Replace public Hero, video and promotional card media. Published items are rendered dynamically across public pages; uploaded assets remain securely in project storage.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#173fad] shadow-xs">
            <FileImage aria-hidden="true" size={24} />
          </div>
        </header>

        {/* Upload Panel */}
        <section className="founder-panel founder-panel-paper mt-6 h-[319px] pb-6 overflow-y-auto rounded-2xl border border-[#dce4e7] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-[#edf2f4] pb-4 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef4ff] text-[#173fad]">
              <Upload size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#10253e]">{td("Upload or replace media asset")}</h2>
              <p className="text-xs text-[#53657a]">{td("Images: JPEG / WebP up to 3 MB · Hero video: MP4 up to 12 MB")}</p>
            </div>
          </div>

          <form className="mt-4 grid gap-4" onSubmit={submit}>
            <div className="grid gap-1.5">
              <Label htmlFor="public-media-slot" className="text-xs font-bold uppercase tracking-wider text-[#53657a]">
                Target Public Placement
              </Label>
              <div className="relative">
                <select
                  id="public-media-slot"
                  value={slot}
                  onChange={event => {
                    setSlot(event.target.value as Slot);
                    setFile(null);
                  }}
                  className="h-11 w-full rounded-xl border border-[#dce4e7] bg-[#f8fafb] px-3.5 text-sm font-medium text-[#10253e] transition-all focus:border-[#173fad] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173fad]/20"
                  aria-describedby="public-media-help"
                >
                  {slots.map(item => (
                    <option key={item.value} value={item.value}>
                      {item.label} ({item.kind.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
              <p id="public-media-help" className="text-xs text-[#61727c]">
                {selected.kind === "video"
                  ? "This video is decorative, muted and looped on the public Home Hero."
                  : "Alternative text is shown to assistive technologies; describe the learning scene briefly."}
              </p>
            </div>

            {selected.kind === "image" && (
              <div className="grid gap-1.5">
                <Label htmlFor="public-media-alt" className="text-xs font-bold uppercase tracking-wider text-[#53657a]">
                  Accessibility Description (Alt text)
                </Label>
                <Textarea
                  id="public-media-alt"
                  value={altText}
                  onChange={event => setAltText(event.target.value)}
                  minLength={2}
                  maxLength={255}
                  required
                  placeholder="Describe the learning scene without unnecessary detail…"
                  className="rounded-xl border border-[#dce4e7] bg-[#f8fafb] text-sm text-[#10253e] focus:border-[#173fad] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173fad]/20"
                />
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="public-media-file" className="text-xs font-bold uppercase tracking-wider text-[#53657a]">
                Choose Source File
              </Label>
              <Input
                id="public-media-file"
                type="file"
                accept={selected.kind === "video" ? "video/mp4" : "image/jpeg,image/webp"}
                onChange={event => setFile(event.target.files?.[0] ?? null)}
                required
                className="h-11 rounded-xl border border-[#dce4e7] bg-[#f8fafb] file:mr-3 file:rounded-lg file:border-0 file:bg-[#10253e] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
              />
              <p className="text-xs text-[#61727c]">
                {file ? `${file.name} · ${(file.size / 1024).toFixed(1)} KB` : "No file selected yet."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button type="submit" className="compass-btn-primary h-11 px-5 text-xs font-bold" disabled={upload.isPending}>
                {upload.isPending ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                Upload & Publish Asset
              </Button>
              {notice && (
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#edf4ff] px-3 py-1.5 text-xs font-semibold text-[#173fad]">
                  <Info size={14} />
                  <span>{notice}</span>
                </div>
              )}
            </div>
          </form>
        </section>

        {/* Current Inventory Section */}
        <section className="mt-8" aria-labelledby="media-inventory-title">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dce4e7] pb-4">
            <div>
              <p className="founder-command-eyebrow">{td("Active library")}</p>
              <h2 id="media-inventory-title" className="mt-1 font-display text-2xl text-[#10253e]">
                {td("Published Media Inventory")}
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#f0f4f8] px-3 py-1 text-xs font-semibold text-[#29415b]">
              <HardDrive size={13} />
              <span>{inventory.data?.length ?? 0} active placement{(inventory.data?.length ?? 0) === 1 ? "" : "s"}</span>
            </div>
          </div>

          {inventory.isLoading ? (
            <div className="founder-state founder-state-empty mt-6 rounded-2xl border border-[#dce4e7] bg-white p-8 text-center">
              <Loader2 className="mx-auto animate-spin text-[#173fad]" size={24} />
              <p className="mt-2 text-sm text-[#53657a]">Loading public media inventory…</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5">
              {inventory.data?.length ? (
                inventory.data.map(item => (
                  <MediaRecord
                    key={item.id}
                    item={item}
                    saving={update.isPending || remove.isPending}
                    onUpdate={values => update.mutateAsync({ id: item.id, ...values })}
                    onRemove={() => remove.mutateAsync({ id: item.id })}
                  />
                ))
              ) : (
                <div className="founder-state founder-state-empty rounded-2xl border border-dashed border-[#cfd9de] bg-white p-10 text-center">
                  <FileImage className="mx-auto text-[#94a3b8]" size={36} />
                  <h3 className="mt-3 text-base font-bold text-[#10253e]">{td("No custom media uploaded")}</h3>
                  <p className="mt-1 text-sm text-[#53657a]">
                    {td("Public pages are currently using default fallback visual assets until custom media is uploaded.")}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </section>
  );
}

function MediaRecord({
  item,
  saving,
  onUpdate,
  onRemove,
}: {
  item: {
    id: number;
    label: string;
    slot: string;
    kind: "image" | "video";
    altText: string;
    publicUrl: string;
    isPublished: boolean;
    fileSize: number;
    mimeType: string;
  };
  saving: boolean;
  onUpdate: (values: { label: string; altText: string; isPublished: boolean }) => Promise<unknown>;
  onRemove: () => Promise<unknown>;
}) {
  const { td } = useLanguage();
  const [label, setLabel] = useState(item.label);
  const [altText, setAltText] = useState(item.altText);
  const [published, setPublished] = useState(item.isPublished);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const matchedSlot = slots.find(s => s.value === item.slot);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setStatusMessage(null);
    try {
      await onUpdate({ label: label.trim(), altText: altText.trim(), isPublished: published });
      setStatusMessage({ type: "success", text: "Changes saved successfully." });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch {
      setStatusMessage({ type: "error", text: "Failed to save media changes." });
    }
  };

  const handleRemove = async () => {
    if (!window.confirm(`Are you sure you want to remove the "${item.label}" asset from the public website?`)) {
      return;
    }
    try {
      await onRemove();
    } catch {
      setStatusMessage({ type: "error", text: "Could not remove asset." });
    }
  };

  return (
    <article className="founder-panel founder-panel-paper rounded-2xl border border-[#dce4e7] bg-white p-5 sm:p-6 shadow-sm transition-all hover:border-[#cfd9de] hover:shadow-md">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Visual Preview Card */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[#dce4e7] bg-[#10253e] shadow-inner group">
            {item.kind === "video" ? (
              <video
                src={item.publicUrl}
                muted
                playsInline
                autoPlay
                loop
                preload="metadata"
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={item.publicUrl}
                alt={item.altText}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}

            {/* Badges Overlay */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md bg-black/75 backdrop-blur-xs px-2 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
                {item.kind === "video" ? <Film size={12} className="text-[#93c5fd]" /> : <FileImage size={12} className="text-[#93c5fd]" />}
                {item.kind}
              </span>
            </div>

            <div className="absolute top-2.5 right-2.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-xs backdrop-blur-xs ${
                  published
                    ? "bg-[#10253e]/85 text-[#93c5fd]"
                    : "bg-[#10253e]/85 text-[#f6ad55]"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${published ? "bg-[#3b82f6] animate-pulse" : "bg-[#ed8936]"}`} />
                {published ? "Live" : "Draft"}
              </span>
            </div>

            {/* Open Original Link on Hover */}
            <a
              href={item.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/90"
              title="Open full-resolution asset in new tab"
            >
              <span>{td("View asset")}</span>
              <ExternalLink size={11} />
            </a>
          </div>

          {/* Technical Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f8fafb] px-3.5 py-2 text-xs text-[#53657a] border border-[#edf2f4]">
            <span className="font-mono text-[11px] font-semibold uppercase">{item.mimeType}</span>
            <span className="font-semibold text-[#10253e]">{(item.fileSize / 1024).toFixed(1)} KB</span>
            <span className="truncate max-w-[140px] text-[11px] text-[#708098]" title={item.slot}>
              {item.slot}
            </span>
          </div>
        </div>

        {/* Right Column: Configuration & Metadata Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {/* Header / Placement Identity */}
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#edf2f4] pb-3">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#173fad]">
                  <Globe size={12} />
                  {matchedSlot?.label ?? item.slot}
                </span>
                <p className="mt-0.5 text-xs text-[#708098]">
                  {matchedSlot?.desc ?? `Public slot key: ${item.slot}`}
                </p>
              </div>
              <code className="rounded-md bg-[#f0f4f8] px-2 py-0.5 text-[11px] font-mono font-medium text-[#29415b]">
                {item.slot}
              </code>
            </div>

            {/* Form Fields */}
            <div className="grid gap-3.5">
              {/* Display Label */}
              <div>
                <Label htmlFor={`label-${item.id}`} className="block text-[11px] font-bold uppercase tracking-wider text-[#53657a] mb-1">
                  Asset Display Label
                </Label>
                <Input
                  id={`label-${item.id}`}
                  value={label}
                  onChange={event => setLabel(event.target.value)}
                  minLength={2}
                  maxLength={160}
                  required
                  className="h-10 rounded-xl border border-[#dce4e7] bg-[#f8fafb] px-3 text-sm text-[#10253e] transition-all focus:border-[#173fad] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173fad]/20"
                />
              </div>

              {/* Alternative Text / Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor={`alt-${item.id}`} className="block text-[11px] font-bold uppercase tracking-wider text-[#53657a]">
                    Accessibility Alt Text
                  </Label>
                  <span className="text-[11px] text-[#8c9ba8]">{altText.length} / 255</span>
                </div>
                <Textarea
                  id={`alt-${item.id}`}
                  value={altText}
                  onChange={event => setAltText(event.target.value)}
                  minLength={2}
                  maxLength={255}
                  required
                  rows={2}
                  placeholder="Describe visual contents for screen readers and accessibility audits…"
                  className="rounded-xl border border-[#dce4e7] bg-[#f8fafb] p-2.5 text-sm text-[#10253e] transition-all focus:border-[#173fad] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173fad]/20"
                />
              </div>

              {/* Publish Toggle Card */}
              <div className="flex items-center justify-between gap-4 rounded-xl border border-[#edf2f4] bg-[#f8fafb] p-3 transition-colors hover:bg-[#f3f7f9]">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${published ? "bg-[#edf4ff] text-[#173fad]" : "bg-[#f1f5f9] text-[#64748b]"}`}>
                    {published ? <Eye size={16} /> : <EyeOff size={16} />}
                  </div>
                  <div>
                    <Label htmlFor={`published-${item.id}`} className="cursor-pointer text-xs font-bold text-[#10253e]">
                      Publish to public website
                    </Label>
                    <p className="text-[11px] text-[#708098]">
                      {published ? "Active: visible to all website visitors" : "Inactive: fallback media will be displayed"}
                    </p>
                  </div>
                </div>
                <Switch
                  id={`published-${item.id}`}
                  checked={published}
                  onCheckedChange={setPublished}
                />
              </div>
            </div>

            {/* Action Buttons & Feedback */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf2f4] pt-3.5 mt-1">
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="compass-btn-primary h-10 px-4 text-xs font-bold gap-1.5 shadow-xs"
                >
                  {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                  Save changes
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={handleRemove}
                  className="h-10 rounded-xl border border-[#f0d5ce] bg-white px-3.5 text-xs font-bold text-[#b4563c] transition-colors hover:bg-[#fff0ed] hover:border-[#efc4b8]"
                >
                  <Trash2 size={14} />
                  <span>{td("Remove")}</span>
                </Button>
              </div>

              {statusMessage && (
                <div
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    statusMessage.type === "success"
                      ? "bg-[#edf4ff] text-[#173fad]"
                      : "bg-[#fff0ed] text-[#b4563c]"
                  }`}
                  role="status"
                >
                  {statusMessage.type === "success" ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  <span>{statusMessage.text}</span>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </article>
  );
}
