import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { founderProcedure, publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import * as audit from "../audit";

const mediaSlot = z.enum(["home_hero_video", "home_hero_poster", "home_task_programmes", "home_task_contact", "home_task_account", "programmes_listing", "programme_detail"]);
const mediaKind = z.enum(["image", "video"]);
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_VIDEO_BYTES = 12 * 1024 * 1024;
const supportedMimes = new Map([["image/jpeg", "jpg"], ["image/webp", "webp"], ["video/mp4", "mp4"]] as const);

function hasExpectedSignature(bytes: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/webp") return bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  return bytes.length >= 12 && bytes.subarray(4, 8).toString("ascii") === "ftyp";
}

function failure(error: unknown): never { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Media update could not be completed." }); }
async function writeMediaAudit(ctx: { user: any; req: any }, event: Omit<audit.AuditEventInput, "actor" | "request">) { try { await audit.writeAuditEvent({ ...event, actor: ctx.user, request: ctx.req }); } catch (error) { console.error("[audit] Could not persist public media event", error); } }

export const mediaRouter = router({
  publicList: publicProcedure.query(() => db.listPublicMedia()),
  list: founderProcedure.query(() => db.listManagedPublicMedia()),
  upload: founderProcedure.input(z.object({ slot: mediaSlot, label: z.string().trim().min(2).max(160), kind: mediaKind, altText: z.string().trim().min(2).max(255), mimeType: z.enum(["image/jpeg", "image/webp", "video/mp4"]), fileName: z.string().trim().min(1).max(180), contentBase64: z.string().min(4), isPublished: z.boolean().default(true) })).mutation(async ({ ctx, input }) => {
    try {
      const extension = supportedMimes.get(input.mimeType);
      if (!extension || (input.kind === "image" && input.mimeType === "video/mp4") || (input.kind === "video" && input.mimeType !== "video/mp4")) throw new Error("Media type does not match the selected file.");
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(input.contentBase64) || input.contentBase64.length % 4 !== 0) throw new Error("Media payload is invalid.");
      const bytes = Buffer.from(input.contentBase64, "base64");
      const limit = input.kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
      if (!bytes.length || bytes.length > limit) throw new Error(`Media file must be between 1 byte and ${input.kind === "video" ? "12 MB" : "3 MB"}.`);
      if (!hasExpectedSignature(bytes, input.mimeType)) throw new Error("Media content does not match the selected file type.");
      const baseName = input.fileName.replace(/[^a-zA-Z0-9._ -]/g, "_").replace(/\.+/g, ".").slice(0, 160).replace(/\.[^.]+$/, "") || "public-media";
      const { key, url } = await storagePut(`public-media/${input.slot}/${baseName}.${extension}`, bytes, input.mimeType);
      const record = await db.upsertPublicMedia({ slot: input.slot, label: input.label, kind: input.kind, altText: input.altText, mimeType: input.mimeType, fileSize: bytes.length, storageKey: key, publicUrl: url, isPublished: input.isPublished, createdByUserId: ctx.user.id });
      await writeMediaAudit(ctx, { action: "public_media.upload", targetType: "public_media", targetId: record.id, description: "Uploaded or replaced public demonstration media.", metadata: { slot: record.slot, kind: record.kind, bytes: record.fileSize } });
      return record;
    } catch (error) { await writeMediaAudit(ctx, { action: "public_media.upload", targetType: "public_media", description: "Public media upload failed.", isSuccess: false, metadata: { reason: "operation_failed", slot: input.slot } }); return failure(error); }
  }),
  update: founderProcedure.input(z.object({ id: z.number().int().positive(), label: z.string().trim().min(2).max(160), altText: z.string().trim().min(2).max(255), isPublished: z.boolean() })).mutation(async ({ ctx, input }) => {
    try { const record = await db.updatePublicMedia(input.id, input); if (!record) throw new Error("Media item not found."); await writeMediaAudit(ctx, { action: "public_media.update", targetType: "public_media", targetId: record.id, description: "Updated public media details.", metadata: { slot: record.slot, published: record.isPublished } }); return record; } catch (error) { await writeMediaAudit(ctx, { action: "public_media.update", targetType: "public_media", targetId: input.id, description: "Public media update failed.", isSuccess: false, metadata: { reason: "operation_failed" } }); return failure(error); }
  }),
  remove: founderProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try { const record = await db.getManagedPublicMedia(input.id); if (!record) throw new Error("Media item not found."); await db.deletePublicMedia(input.id); await writeMediaAudit(ctx, { action: "public_media.delete", targetType: "public_media", targetId: input.id, description: "Removed public media reference.", metadata: { slot: record.slot } }); return { success: true } as const; } catch (error) { await writeMediaAudit(ctx, { action: "public_media.delete", targetType: "public_media", targetId: input.id, description: "Public media removal failed.", isSuccess: false, metadata: { reason: "operation_failed" } }); return failure(error); }
  }),
});
