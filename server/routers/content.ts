import { z } from "zod";
import * as db from "../db";
import { adminProcedure, founderProcedure, publicProcedure, router } from "../_core/trpc";

export const programInput = z.object({
  slug: z.string().trim().min(2).max(160),
  title: z.string().trim().min(2).max(180),
  language: z.string().trim().min(2).max(80),
  category: z.string().trim().min(2).max(100),
  ageGroup: z.string().trim().min(2).max(100),
  level: z.string().trim().min(2).max(100),
  duration: z.string().trim().min(2).max(120),
  schedule: z.string().trim().min(2).max(180),
  fees: z.string().trim().min(2).max(180),
  description: z.string().trim().min(5),
  faqJson: z.string().optional().nullable(),
  outcomes: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  ctaLabel: z.string().optional().nullable(),
  ctaUrl: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  seatsEnrolled: z.number().int().min(0).default(0),
  teacherId: z.number().int().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const testimonialInput = z.object({
  authorName: z.string().trim().min(2).max(160),
  relation: z.string().trim().min(2).max(100),
  quote: z.string().trim().min(5),
  rating: z.number().int().min(1).max(5),
  approved: z.boolean().default(false),
  consentConfirmed: z.boolean().default(true),
});

export const teamProfileInput = z.object({
  name: z.string().trim().min(2).max(160),
  role: z.string().trim().min(2).max(160),
  languages: z.string().trim().min(2).max(320),
  bio: z.string().trim().min(5),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const contentRouter = router({
  // Public
  publicAnnouncements: publicProcedure.query(() => db.listPublicAnnouncements()),
  publicPrograms: publicProcedure.query(() => db.listPublicPrograms()),
  publicProgram: publicProcedure.input(z.object({ slug: z.string().min(1) })).query(({ input }) => db.getPublicProgram(input.slug)),
  publicTestimonials: publicProcedure.query(() => db.listPublicTestimonials()),
  publicTeamProfiles: publicProcedure.query(() => db.listPublicTeamProfiles()),
  siteSettings: publicProcedure.query(() => db.listSiteSettings()),

  // Admin / Founder CRUD: Programs
  listPrograms: adminProcedure.query(() => db.listPrograms()),
  createProgram: adminProcedure.input(programInput).mutation(({ input }) => {
    return db.createProgram({
      ...input,
      faqJson: input.faqJson ?? null,
      outcomes: input.outcomes ?? null,
      imageUrl: input.imageUrl ?? null,
      ctaLabel: input.ctaLabel ?? null,
      ctaUrl: input.ctaUrl ?? null,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      teacherId: input.teacherId ?? null,
    });
  }),
  updateProgram: adminProcedure.input(z.object({ id: z.number().int().positive(), data: programInput })).mutation(({ input }) => {
    return db.updateProgram(input.id, {
      ...input.data,
      faqJson: input.data.faqJson ?? null,
      outcomes: input.data.outcomes ?? null,
      imageUrl: input.data.imageUrl ?? null,
      ctaLabel: input.data.ctaLabel ?? null,
      ctaUrl: input.data.ctaUrl ?? null,
      seoTitle: input.data.seoTitle ?? null,
      seoDescription: input.data.seoDescription ?? null,
      teacherId: input.data.teacherId ?? null,
    });
  }),
  deleteProgram: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.deleteProgram(input.id)),

  // Admin / Founder CRUD: Testimonials
  listTestimonials: adminProcedure.query(() => db.listTestimonials()),
  createTestimonial: adminProcedure.input(testimonialInput).mutation(({ input }) => db.createTestimonial(input)),
  updateTestimonial: adminProcedure.input(z.object({ id: z.number().int().positive(), data: testimonialInput })).mutation(({ input }) => db.updateTestimonial(input.id, input.data)),
  deleteTestimonial: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.deleteTestimonial(input.id)),

  // Admin / Founder CRUD: Team Profiles
  listTeamProfiles: adminProcedure.query(() => db.listTeamProfiles()),
  createTeamProfile: adminProcedure.input(teamProfileInput).mutation(({ input }) => db.createTeamProfile(input)),
  updateTeamProfile: adminProcedure.input(z.object({ id: z.number().int().positive(), data: teamProfileInput })).mutation(({ input }) => db.updateTeamProfile(input.id, input.data)),
  deleteTeamProfile: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.deleteTeamProfile(input.id)),

  // Founder Settings
  updateSiteSettings: founderProcedure.input(z.record(z.string(), z.string())).mutation(({ input }) => db.updateSiteSettings(input)),
});


