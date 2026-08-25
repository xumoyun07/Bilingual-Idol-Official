import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as audit from "../audit";
import * as db from "../db";
import { founderProcedure, publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

const category = z.enum(["announcement", "event", "holiday"]);
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const imageMime = z.enum(["image/jpeg", "image/webp", "image/png"]);
const imageInput = z.object({ mimeType: imageMime, fileName: z.string().trim().min(1).max(180), contentBase64: z.string().min(4), altText: z.string().trim().min(2).max(255) });
const postInput = z.object({ slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180), title: z.string().trim().min(3).max(220), excerpt: z.string().trim().min(10).max(1_000), body: z.string().trim().min(20).max(20_000), category, isPublished: z.boolean(), image: imageInput.optional(), clearImage: z.boolean().default(false) }).strict();

function validImageBytes(bytes: Buffer, mime: z.infer<typeof imageMime>) {
  if (mime === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/webp") return bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}
function extensionFor(mime: z.infer<typeof imageMime>) { return mime === "image/jpeg" ? "jpg" : mime === "image/webp" ? "webp" : "png"; }
function fail(error: unknown): never { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "News update could not be completed." }); }
async function writeAudit(ctx: { user: any; req: any }, event: Omit<audit.AuditEventInput, "actor" | "request">) { try { await audit.writeAuditEvent({ ...event, actor: ctx.user, request: ctx.req }); } catch (error) { console.error("[audit] Could not persist News event", error); } }
async function uploadImage(slug: string, input: z.infer<typeof imageInput>) {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(input.contentBase64) || input.contentBase64.length % 4 !== 0) throw new Error("Image payload is invalid.");
  const bytes = Buffer.from(input.contentBase64, "base64");
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error("News image must be between 1 byte and 3 MB.");
  if (!validImageBytes(bytes, input.mimeType)) throw new Error("Image content does not match the selected file type.");
  const safeBase = input.fileName.replace(/[^a-zA-Z0-9._ -]/g, "_").replace(/\.[^.]+$/, "").slice(0, 140) || "news-image";
  const { key, url } = await storagePut(`news/${slug}/${safeBase}.${extensionFor(input.mimeType)}`, bytes, input.mimeType);
  return { imageUrl: url, imageStorageKey: key, imageAltText: input.altText };
}

export const newsRouter = router({
  publicPage: publicProcedure.input(z.object({ page: z.number().int().min(0).default(0) })).query(({ input }) => db.listPublicAnnouncementsPage({ page: input.page })),
  list: founderProcedure.query(() => db.listAnnouncements()),
  create: founderProcedure.input(postInput).mutation(async ({ ctx, input }) => {
    try {
      const media = input.image ? await uploadImage(input.slug, input.image) : { imageUrl: null, imageStorageKey: null, imageAltText: null };
      const record = await db.createAnnouncement({ slug: input.slug, title: input.title, excerpt: input.excerpt, body: input.body, category: input.category, isPublished: input.isPublished, publishedAt: input.isPublished ? new Date() : null, ...media });
      if (!record) throw new Error("News post could not be created.");
      await writeAudit(ctx, { action: "news.create", targetType: "news_post", targetId: record.id, description: "Created a News post.", metadata: { category: record.category, published: record.isPublished } });
      if (input.image) await writeAudit(ctx, { action: "news.image_upload", targetType: "news_post", targetId: record.id, description: "Uploaded a News card image.", metadata: { bytes: Buffer.from(input.image.contentBase64, "base64").length } });
      return record;
    } catch (error) { await writeAudit(ctx, { action: "news.create", targetType: "news_post", description: "News post creation failed.", isSuccess: false, metadata: { reason: "operation_failed" } }); return fail(error); }
  }),
  update: founderProcedure.input(postInput.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      const existing = await db.getAnnouncement(input.id); if (!existing) throw new Error("News post not found.");
      const media = input.image ? await uploadImage(input.slug, input.image) : input.clearImage ? { imageUrl: null, imageStorageKey: null, imageAltText: null } : { imageUrl: existing.imageUrl, imageStorageKey: existing.imageStorageKey, imageAltText: existing.imageAltText };
      const publishedAt = input.isPublished ? (existing.isPublished ? existing.publishedAt ?? new Date() : new Date()) : null;
      const record = await db.updateAnnouncement(input.id, { slug: input.slug, title: input.title, excerpt: input.excerpt, body: input.body, category: input.category, isPublished: input.isPublished, publishedAt, ...media });
      if (!record) throw new Error("News post not found.");
      await writeAudit(ctx, { action: "news.update", targetType: "news_post", targetId: record.id, description: "Updated a News post.", metadata: { category: record.category, published: record.isPublished } });
      if (input.image) await writeAudit(ctx, { action: "news.image_upload", targetType: "news_post", targetId: record.id, description: "Uploaded or replaced a News card image.", metadata: { bytes: Buffer.from(input.image.contentBase64, "base64").length } });
      return record;
    } catch (error) { await writeAudit(ctx, { action: "news.update", targetType: "news_post", targetId: input.id, description: "News post update failed.", isSuccess: false, metadata: { reason: "operation_failed" } }); return fail(error); }
  }),
  remove: founderProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try { const existing = await db.getAnnouncement(input.id); if (!existing) throw new Error("News post not found."); await db.deleteAnnouncement(input.id); await writeAudit(ctx, { action: "news.delete", targetType: "news_post", targetId: input.id, description: "Deleted a News post.", metadata: { category: existing.category } }); return { success: true } as const; } catch (error) { await writeAudit(ctx, { action: "news.delete", targetType: "news_post", targetId: input.id, description: "News post deletion failed.", isSuccess: false, metadata: { reason: "operation_failed" } }); return fail(error); }
  }),
});
