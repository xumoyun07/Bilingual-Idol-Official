import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as marketing from "../marketing";
import { contentManagerProcedure, founderProcedure, router, superAdminProcedure } from "../_core/trpc";

export const marketingRouter = router({
  // ---------------------------------------------------------------------------
  // MK6: Content Blocks
  // ---------------------------------------------------------------------------
  listContentBlocks: contentManagerProcedure
    .input(z.object({ pageSlug: z.string().optional() }))
    .query(({ input }) => marketing.listContentBlocks(input.pageSlug)),

  createContentBlock: contentManagerProcedure
    .input(
      z.object({
        pageSlug: z.string().min(1),
        sectionKey: z.string().min(1),
        blockType: z.string().min(1),
        title: z.string().optional(),
        content: z.string().optional(),
        configJson: z.string().optional(),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => marketing.createContentBlock(input)),

  updateContentBlock: contentManagerProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        pageSlug: z.string().optional(),
        sectionKey: z.string().optional(),
        blockType: z.string().optional(),
        title: z.string().optional(),
        content: z.string().optional(),
        configJson: z.string().optional(),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return marketing.updateContentBlock(id, data);
    }),

  deleteContentBlock: contentManagerProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input }) => marketing.deleteContentBlock(input.id)),

  // ---------------------------------------------------------------------------
  // MK6: Course Content Updates (Restricted seatsEnrolled & teacherId for marketing)
  // ---------------------------------------------------------------------------
  updateCourseContent: contentManagerProcedure
    .input(
      z.object({
        courseId: z.number().int().positive(),
        title: z.string().optional(),
        description: z.string().optional(),
        fees: z.string().optional(),
        duration: z.string().optional(),
        schedule: z.string().optional(),
        level: z.string().optional(),
        ageGroup: z.string().optional(),
        category: z.string().optional(),
        language: z.string().optional(),
        faqJson: z.string().optional(),
        outcomes: z.string().optional(),
        imageUrl: z.string().optional(),
        ctaLabel: z.string().optional(),
        ctaUrl: z.string().optional(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        seatsEnrolled: z.number().int().optional(),
        teacherId: z.number().int().nullable().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { courseId, ...data } = input;
      return marketing.updateCourseContent(courseId, data, ctx.user.role);
    }),

  // ---------------------------------------------------------------------------
  // MK6: Events
  // ---------------------------------------------------------------------------
  listEvents: contentManagerProcedure.query(() => marketing.listEvents()),

  createEvent: contentManagerProcedure
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().min(1),
        eventDate: z.string().or(z.date()).optional(),
        location: z.string().optional(),
        imageUrl: z.string().optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      marketing.createEvent({ ...input, createdByUserId: ctx.user.id })
    ),

  updateEvent: contentManagerProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        title: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        eventDate: z.string().or(z.date()).optional(),
        location: z.string().optional(),
        imageUrl: z.string().optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return marketing.updateEvent(id, data);
    }),

  deleteEvent: contentManagerProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input }) => marketing.deleteEvent(input.id)),

  // ---------------------------------------------------------------------------
  // MK6: Blog Posts
  // ---------------------------------------------------------------------------
  listBlogPosts: contentManagerProcedure
    .input(z.object({ status: z.enum(["draft", "published"]).optional() }))
    .query(({ input }) => marketing.listBlogPosts(input.status)),

  createBlogPost: contentManagerProcedure
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        excerpt: z.string().optional(),
        body: z.string().min(1),
        category: z.string().optional(),
        status: z.enum(["draft", "published"]).optional(),
        imageUrl: z.string().optional(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      marketing.createBlogPost({ ...input, authorId: ctx.user.id })
    ),

  updateBlogPost: contentManagerProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        title: z.string().optional(),
        slug: z.string().optional(),
        excerpt: z.string().optional(),
        body: z.string().optional(),
        category: z.string().optional(),
        status: z.enum(["draft", "published"]).optional(),
        imageUrl: z.string().optional(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return marketing.updateBlogPost(id, data);
    }),

  deleteBlogPost: contentManagerProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input }) => marketing.deleteBlogPost(input.id)),

  // ---------------------------------------------------------------------------
  // MK6: Testimonials
  // ---------------------------------------------------------------------------
  listTestimonials: contentManagerProcedure.query(() => marketing.listTestimonials()),

  createTestimonial: contentManagerProcedure
    .input(
      z.object({
        authorName: z.string().min(1),
        relation: z.string().min(1),
        quote: z.string().min(1),
        rating: z.number().int().min(1).max(5),
        approved: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => marketing.createTestimonial(input)),

  updateTestimonial: contentManagerProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        authorName: z.string().optional(),
        relation: z.string().optional(),
        quote: z.string().optional(),
        rating: z.number().int().min(1).max(5).optional(),
        approved: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return marketing.updateTestimonial(id, data);
    }),

  deleteTestimonial: contentManagerProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input }) => marketing.deleteTestimonial(input.id)),

  // ---------------------------------------------------------------------------
  // MK6: Gallery Media
  // ---------------------------------------------------------------------------
  listGalleryMedia: contentManagerProcedure
    .input(z.object({ category: z.string().optional() }))
    .query(({ input }) => marketing.listGalleryMedia(input.category)),

  createGalleryMedia: contentManagerProcedure
    .input(
      z.object({
        title: z.string().min(1),
        category: z.string().min(1),
        url: z.string().min(1),
        altText: z.string().optional(),
        sortOrder: z.number().int().optional(),
      })
    )
    .mutation(({ input }) => marketing.createGalleryMedia(input)),

  deleteGalleryMedia: contentManagerProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input }) => marketing.deleteGalleryMedia(input.id)),

  // ---------------------------------------------------------------------------
  // MK6: Landing Pages
  // ---------------------------------------------------------------------------
  listLandingPages: contentManagerProcedure.query(() => marketing.listContentPages("landingPage")),

  createLandingPage: contentManagerProcedure
    .input(
      z.object({
        slug: z.string().min(1),
        title: z.string().min(1),
        contentJson: z.string().optional(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => marketing.createLandingPage(input)),

  updateLandingPage: contentManagerProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        title: z.string().optional(),
        contentJson: z.string().optional(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return marketing.updateContentPage(id, data);
    }),

  deleteLandingPage: contentManagerProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input }) => marketing.deleteContentPage(input.id)),

  // ---------------------------------------------------------------------------
  // MK6: WhatsApp Entry Points
  // ---------------------------------------------------------------------------
  listWhatsappEntryPoints: contentManagerProcedure.query(() => marketing.listWhatsappEntryPoints()),

  createWhatsappEntryPoint: contentManagerProcedure
    .input(
      z.object({
        label: z.string().min(1),
        whatsappNumber: z.string().min(1),
        prefilledMessage: z.string().optional(),
        order: z.number().int().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => marketing.createWhatsappEntryPoint(input)),

  updateWhatsappEntryPoint: contentManagerProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        label: z.string().optional(),
        whatsappNumber: z.string().optional(),
        prefilledMessage: z.string().optional(),
        order: z.number().int().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return marketing.updateWhatsappEntryPoint(id, data);
    }),

  deleteWhatsappEntryPoint: contentManagerProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input }) => marketing.deleteWhatsappEntryPoint(input.id)),

  // ---------------------------------------------------------------------------
  // MK6: Chatbot FAQ Entries
  // ---------------------------------------------------------------------------
  listChatbotFaq: contentManagerProcedure.query(() => marketing.listChatbotFaqEntries()),

  createChatbotFaq: contentManagerProcedure
    .input(
      z.object({
        question: z.string().min(1),
        answerText: z.string().min(1),
        keywords: z.array(z.string()).optional(),
        relatedCourseId: z.number().int().nullable().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(({ input }) =>
      marketing.createChatbotFaqEntry({
        ...input,
        relatedCourseId: input.relatedCourseId ?? undefined,
      })
    ),

  updateChatbotFaq: contentManagerProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        question: z.string().optional(),
        answerText: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        relatedCourseId: z.number().int().nullable().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return marketing.updateChatbotFaqEntry(id, data);
    }),

  deleteChatbotFaq: contentManagerProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input }) => marketing.deleteChatbotFaqEntry(input.id)),

  // ---------------------------------------------------------------------------
  // MK6: Social Links
  // ---------------------------------------------------------------------------
  listSocialLinks: contentManagerProcedure.query(() => marketing.listSocialLinks()),

  createSocialLink: contentManagerProcedure
    .input(
      z.object({
        platform: z.enum(["instagram", "tiktok", "facebook", "telegram", "other"]),
        url: z.string().min(1),
        active: z.boolean().optional(),
        order: z.number().int().optional(),
      })
    )
    .mutation(({ input }) => marketing.createSocialLink(input)),

  updateSocialLink: contentManagerProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        platform: z.enum(["instagram", "tiktok", "facebook", "telegram", "other"]).optional(),
        url: z.string().optional(),
        active: z.boolean().optional(),
        order: z.number().int().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return marketing.updateSocialLink(id, data);
    }),

  deleteSocialLink: contentManagerProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input }) => marketing.deleteSocialLink(input.id)),

  // ---------------------------------------------------------------------------
  // MK6: Multilingual Translations
  // ---------------------------------------------------------------------------
  listTranslations: contentManagerProcedure
    .input(z.object({ languageCode: z.string().optional() }))
    .query(({ input }) => marketing.listTranslations(input.languageCode)),

  upsertTranslation: contentManagerProcedure
    .input(
      z.object({
        entityType: z.string().min(1),
        entityId: z.string().min(1),
        languageCode: z.string().min(1),
        fieldKey: z.string().min(1),
        translatedValue: z.string(),
      })
    )
    .mutation(({ input }) => marketing.upsertTranslation(input)),

  // ---------------------------------------------------------------------------
  // MK7: Media Assets
  // ---------------------------------------------------------------------------
  listMediaAssets: contentManagerProcedure
    .input(z.object({ type: z.string().optional(), tag: z.string().optional() }))
    .query(({ input }) => marketing.listMediaAssets(input)),

  createMediaAsset: contentManagerProcedure
    .input(
      z.object({
        type: z.enum(["banner", "logo", "creative", "other"]),
        url: z.string().min(1),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      marketing.createMediaAsset({ ...input, uploadedByUserId: ctx.user.id })
    ),

  deleteMediaAsset: contentManagerProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input }) => marketing.deleteMediaAsset(input.id)),

  // ---------------------------------------------------------------------------
  // MK8: Audience Segments
  // ---------------------------------------------------------------------------
  listAudienceSegments: contentManagerProcedure.query(() => marketing.listAudienceSegments()),

  createAudienceSegment: contentManagerProcedure
    .input(
      z.object({
        name: z.string().min(1),
        filterCriteria: z.object({
          status: z.array(z.string()).optional(),
          source: z.array(z.string()).optional(),
          courseInterestId: z.number().int().nullable().optional(),
          ageGroup: z.string().optional(),
          languagePreference: z.string().optional(),
        }),
      })
    )
    .mutation(({ ctx, input }) =>
      marketing.createAudienceSegment({ ...input, createdByUserId: ctx.user.id })
    ),

  updateAudienceSegment: contentManagerProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        name: z.string().optional(),
        filterCriteria: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return marketing.updateAudienceSegment(id, data);
    }),

  deleteAudienceSegment: contentManagerProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input }) => marketing.deleteAudienceSegment(input.id)),

  // ---------------------------------------------------------------------------
  // MK9: Reports & Export
  // ---------------------------------------------------------------------------
  getReport: contentManagerProcedure
    .input(
      z.object({
        groupBy: z.enum(["source", "course", "campaign"]).default("source"),
        period: z.enum(["7d", "30d", "90d", "all"]).default("30d"),
      })
    )
    .query(({ input }) => marketing.getMarketingReport(input)),

  exportReportCsv: contentManagerProcedure
    .input(
      z.object({
        groupBy: z.enum(["source", "course", "campaign"]).default("source"),
        period: z.enum(["7d", "30d", "90d", "all"]).default("30d"),
      })
    )
    .query(({ input }) => marketing.exportMarketingReportCsv(input)),

  // ---------------------------------------------------------------------------
  // MK10: Marketing Settings
  // ---------------------------------------------------------------------------
  getCtaSettings: contentManagerProcedure.query(() => marketing.getCtaSettings()),

  updateCtaSettings: contentManagerProcedure
    .input(z.record(z.string(), z.string()))
    .mutation(({ ctx, input }) => marketing.updateCtaSettings(input, ctx.user.role)),

  getTrackingSettings: contentManagerProcedure.query(() => marketing.getTrackingSettings()),

  updateTrackingSettings: contentManagerProcedure
    .input(z.record(z.string(), z.string()))
    .mutation(({ ctx, input }) => marketing.updateTrackingSettings(input, ctx.user.role)),

  toggleAllowMarketingPixelManagement: superAdminProcedure
    .input(z.object({ allowed: z.boolean() }))
    .mutation(({ ctx, input }) =>
      marketing.setAllowMarketingPixelManagement(input.allowed, ctx.user.role)
    ),

  listLeadSources: contentManagerProcedure.query(() => marketing.listLeadSources()),

  createLeadSource: contentManagerProcedure
    .input(
      z.object({
        name: z.string().min(1),
        code: z.string().min(1),
        active: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
      })
    )
    .mutation(({ input }) => marketing.createLeadSource(input)),

  updateLeadSource: contentManagerProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        name: z.string().optional(),
        active: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return marketing.updateLeadSource(id, data);
    }),

  deleteLeadSource: contentManagerProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input }) => marketing.deleteLeadSource(input.id)),

  listMessageTemplates: contentManagerProcedure.query(() => marketing.listMessageTemplates()),

  createMessageTemplate: contentManagerProcedure
    .input(
      z.object({
        name: z.string().min(1),
        channel: z.enum(["email", "sms", "whatsapp"]),
        subject: z.string().optional(),
        body: z.string().min(1),
        variables: z.array(z.string()).optional(),
      })
    )
    .mutation(({ input }) => marketing.createMessageTemplate(input)),

  updateMessageTemplate: contentManagerProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        name: z.string().optional(),
        subject: z.string().optional(),
        body: z.string().optional(),
        variables: z.array(z.string()).optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return marketing.updateMessageTemplate(id, data);
    }),

  deleteMessageTemplate: contentManagerProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input }) => marketing.deleteMessageTemplate(input.id)),

  // ---------------------------------------------------------------------------
  // MK11: Explicit Restrictions Verification Endpoint
  // ---------------------------------------------------------------------------
  verifyRestriction: contentManagerProcedure
    .input(
      z.object({
        action: z.enum([
          "delete_user",
          "modify_attendance",
          "modify_grades",
          "modify_class_sessions",
          "assign_teacher",
          "modify_payments",
          "view_application_documents",
          "manage_roles",
          "modify_system_settings_unauthorized",
        ]),
      })
    )
    .mutation(({ ctx, input }) => {
      marketing.assertMarketingAllowed(input.action, ctx.user.role);
      return { allowed: true };
    }),
});
