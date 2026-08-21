import { z } from "zod";
import * as db from "../db";
import { founderProcedure, publicProcedure, router } from "../_core/trpc";

const announcementInput = z.object({
  slug: z.string().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(5).max(220),
  excerpt: z.string().min(10).max(1000),
  body: z.string().min(10).max(12000),
  category: z.enum(["announcement", "event", "holiday"]),
  isPublished: z.boolean(),
  publishedAt: z.date().nullable(),
});

const programInput = z.object({
  slug: z.string().min(3).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(2).max(180),
  language: z.string().min(2).max(80),
  category: z.string().min(2).max(100),
  ageGroup: z.string().min(2).max(100),
  level: z.string().min(2).max(100),
  duration: z.string().min(2).max(120),
  schedule: z.string().min(2).max(180),
  fees: z.string().min(2).max(180),
  description: z.string().min(10).max(6000),
  isActive: z.boolean(),
});
const testimonialInput = z.object({
  authorName: z.string().min(2).max(160),
  relation: z.string().min(2).max(100),
  quote: z.string().min(10).max(4000),
  rating: z.number().int().min(1).max(5),
  approved: z.boolean(),
  consentConfirmed: z.boolean(),
}).refine(input => !input.approved || input.consentConfirmed, { message: "Consent must be confirmed before publishing a review.", path: ["consentConfirmed"] });
const teamInput = z.object({
  name: z.string().min(2).max(160),
  role: z.string().min(2).max(160),
  languages: z.string().min(2).max(320),
  bio: z.string().min(10).max(4000),
  isPublished: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
});
export const contentRouter = router({
  publicAnnouncements: publicProcedure.query(() => db.listPublicAnnouncements()),
  publicPrograms: publicProcedure.query(() => db.listPublicPrograms()),
  publicProgram: publicProcedure.input(z.object({ slug: z.string().min(1) })).query(({ input }) => db.getPublicProgram(input.slug)),
  publicTestimonials: publicProcedure.query(() => db.listPublicTestimonials()),
  publicTeamProfiles: publicProcedure.query(() => db.listPublicTeamProfiles()),
  siteSettings: publicProcedure.query(() => db.listSiteSettings()),
  announcements: founderProcedure.query(() => db.listAnnouncements()),
  createAnnouncement: founderProcedure.input(announcementInput).mutation(({ input }) =>
    db.createAnnouncement({
      ...input,
      publishedAt: input.isPublished ? input.publishedAt ?? new Date() : null,
    }),
  ),
  updateAnnouncement: founderProcedure.input(z.object({ id: z.number().int().positive(), data: announcementInput })).mutation(({ input }) => db.updateAnnouncement(input.id, { ...input.data, publishedAt: input.data.isPublished ? input.data.publishedAt ?? new Date() : null })),
  setAnnouncementPublishState: founderProcedure.input(z.object({ id: z.number().int().positive(), isPublished: z.boolean() })).mutation(({ input }) => db.updateAnnouncementPublishState(input.id, input.isPublished)),
  deleteAnnouncement: founderProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.deleteAnnouncement(input.id)),
  updateSiteSettings: founderProcedure.input(z.record(z.string().min(1).max(80), z.string().max(320))).mutation(({ input }) => db.updateSiteSettings(input)),
  programs: founderProcedure.query(() => db.listPrograms()),
  createProgram: founderProcedure.input(programInput).mutation(({ input }) => db.createProgram(input)),
  updateProgram: founderProcedure.input(z.object({ id: z.number().int().positive(), data: programInput })).mutation(({ input }) => db.updateProgram(input.id, input.data)),
  deleteProgram: founderProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.deleteProgram(input.id)),
  testimonials: founderProcedure.query(() => db.listTestimonials()),
  createTestimonial: founderProcedure.input(testimonialInput).mutation(({ input }) => db.createTestimonial(input)),
  updateTestimonial: founderProcedure.input(z.object({ id: z.number().int().positive(), data: testimonialInput })).mutation(({ input }) => db.updateTestimonial(input.id, input.data)),
  deleteTestimonial: founderProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.deleteTestimonial(input.id)),
  teamProfiles: founderProcedure.query(() => db.listTeamProfiles()),
  createTeamProfile: founderProcedure.input(teamInput).mutation(({ input }) => db.createTeamProfile(input)),
  updateTeamProfile: founderProcedure.input(z.object({ id: z.number().int().positive(), data: teamInput })).mutation(({ input }) => db.updateTeamProfile(input.id, input.data)),
  deleteTeamProfile: founderProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.deleteTeamProfile(input.id)),
});
