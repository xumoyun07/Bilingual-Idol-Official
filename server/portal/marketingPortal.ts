import { Router, type Request, type Response, type NextFunction } from "express";
import { sdk } from "../_core/sdk";
import * as marketing from "../marketing";

export const marketingPortalRouter = Router();

// Middleware: Authenticate and verify role for content & marketing actions
export async function requireContentManager(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await sdk.authenticateRequest(req);
    const allowed = ["marketing", "admin", "super_admin", "founder"];
    if (!user || !allowed.includes(user.role)) {
      return res.status(403).json({
        error: "forbidden",
        message: "This endpoint requires content management privileges (marketing, admin, super_admin).",
      });
    }
    (req as any).user = user;
    next();
  } catch {
    return res.status(401).json({ error: "unauthorized", message: "Authentication required." });
  }
}

// -----------------------------------------------------------------------------
// MK6: Content Blocks (/content-blocks)
// -----------------------------------------------------------------------------
marketingPortalRouter.get("/content-blocks", async (req: Request, res: Response) => {
  try {
    const slug = typeof req.query.pageSlug === "string" ? req.query.pageSlug : undefined;
    const blocks = await marketing.listContentBlocks(slug);
    res.json({ blocks });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch content blocks." });
  }
});

marketingPortalRouter.post("/content-blocks", requireContentManager, async (req: Request, res: Response) => {
  try {
    const block = await marketing.createContentBlock(req.body);
    res.status(201).json({ block });
  } catch (error: any) {
    const status = error.code === "BAD_REQUEST" ? 400 : 500;
    res.status(status).json({ error: error.message || "Failed to create content block." });
  }
});

marketingPortalRouter.patch("/content-blocks/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const block = await marketing.updateContentBlock(id, req.body);
    res.json({ block });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : error.code === "BAD_REQUEST" ? 400 : 500;
    res.status(status).json({ error: error.message || "Failed to update content block." });
  }
});

marketingPortalRouter.delete("/content-blocks/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await marketing.deleteContentBlock(id);
    res.json({ success: true });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message || "Failed to delete content block." });
  }
});

// -----------------------------------------------------------------------------
// MK6: Courses Content Editing (/portal/admin/courses/:id)
// -----------------------------------------------------------------------------
marketingPortalRouter.patch("/portal/admin/courses/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const callerRole = (req as any).user.role;
    const course = await marketing.updateCourseContent(id, req.body, callerRole);
    res.json({ course });
  } catch (error: any) {
    const status =
      error.code === "FORBIDDEN"
        ? 403
        : error.code === "NOT_FOUND"
        ? 404
        : error.code === "BAD_REQUEST"
        ? 400
        : 500;
    res.status(status).json({ error: error.message || "Failed to update course." });
  }
});

// -----------------------------------------------------------------------------
// MK6: Events (/portal/marketing/events)
// -----------------------------------------------------------------------------
marketingPortalRouter.get("/portal/marketing/events", async (req: Request, res: Response) => {
  try {
    const events = await marketing.listEvents();
    res.json({ events });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.post("/portal/marketing/events", requireContentManager, async (req: Request, res: Response) => {
  try {
    const callerId = (req as any).user?.id;
    const event = await marketing.createEvent({ ...req.body, createdByUserId: callerId });
    res.status(201).json({ event });
  } catch (error: any) {
    const status = error.code === "BAD_REQUEST" ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
});

marketingPortalRouter.patch("/portal/marketing/events/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const event = await marketing.updateEvent(id, req.body);
    res.json({ event });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

marketingPortalRouter.delete("/portal/marketing/events/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await marketing.deleteEvent(id);
    res.json({ success: true });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// MK6: Blog Posts (/portal/marketing/blog-posts)
// -----------------------------------------------------------------------------
marketingPortalRouter.get("/portal/marketing/blog-posts", async (req: Request, res: Response) => {
  try {
    const status = req.query.status === "draft" || req.query.status === "published" ? req.query.status : undefined;
    const posts = await marketing.listBlogPosts(status);
    res.json({ posts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.post("/portal/marketing/blog-posts", requireContentManager, async (req: Request, res: Response) => {
  try {
    const callerId = (req as any).user?.id;
    const post = await marketing.createBlogPost({ ...req.body, authorId: callerId });
    res.status(201).json({ post });
  } catch (error: any) {
    const status = error.code === "BAD_REQUEST" ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
});

marketingPortalRouter.patch("/portal/marketing/blog-posts/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const post = await marketing.updateBlogPost(id, req.body);
    res.json({ post });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

marketingPortalRouter.delete("/portal/marketing/blog-posts/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await marketing.deleteBlogPost(id);
    res.json({ success: true });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// MK6: Testimonials (/portal/marketing/testimonials)
// -----------------------------------------------------------------------------
marketingPortalRouter.get("/portal/marketing/testimonials", async (_req: Request, res: Response) => {
  try {
    const testimonials = await marketing.listTestimonials();
    res.json({ testimonials });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.post("/portal/marketing/testimonials", requireContentManager, async (req: Request, res: Response) => {
  try {
    const testimonial = await marketing.createTestimonial(req.body);
    res.status(201).json({ testimonial });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.patch("/portal/marketing/testimonials/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const testimonial = await marketing.updateTestimonial(id, req.body);
    res.json({ testimonial });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

marketingPortalRouter.delete("/portal/marketing/testimonials/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await marketing.deleteTestimonial(id);
    res.json({ success: true });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// MK6: Gallery Media (/portal/marketing/gallery-media)
// -----------------------------------------------------------------------------
marketingPortalRouter.get("/portal/marketing/gallery-media", async (req: Request, res: Response) => {
  try {
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const media = await marketing.listGalleryMedia(category);
    res.json({ media });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.post("/portal/marketing/gallery-media", requireContentManager, async (req: Request, res: Response) => {
  try {
    const item = await marketing.createGalleryMedia(req.body);
    res.status(201).json({ item });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.delete("/portal/marketing/gallery-media/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await marketing.deleteGalleryMedia(id);
    res.json({ success: true });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// MK6: Content Pages / Landing Pages (/portal/marketing/landing-pages)
// -----------------------------------------------------------------------------
marketingPortalRouter.get("/portal/marketing/landing-pages", async (_req: Request, res: Response) => {
  try {
    const pages = await marketing.listContentPages("landingPage");
    res.json({ pages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.post("/portal/marketing/landing-pages", requireContentManager, async (req: Request, res: Response) => {
  try {
    const page = await marketing.createLandingPage(req.body);
    res.status(201).json({ page });
  } catch (error: any) {
    const status = error.code === "BAD_REQUEST" ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
});

marketingPortalRouter.patch("/portal/marketing/landing-pages/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const page = await marketing.updateContentPage(id, req.body);
    res.json({ page });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

marketingPortalRouter.delete("/portal/marketing/landing-pages/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await marketing.deleteContentPage(id);
    res.json({ success: true });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// MK6: WhatsApp Entry Points (/portal/marketing/whatsapp-entry-points)
// -----------------------------------------------------------------------------
marketingPortalRouter.get("/portal/marketing/whatsapp-entry-points", async (_req: Request, res: Response) => {
  try {
    const points = await marketing.listWhatsappEntryPoints();
    res.json({ points });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.post("/portal/marketing/whatsapp-entry-points", requireContentManager, async (req: Request, res: Response) => {
  try {
    const point = await marketing.createWhatsappEntryPoint(req.body);
    res.status(201).json({ point });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.patch("/portal/marketing/whatsapp-entry-points/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const point = await marketing.updateWhatsappEntryPoint(id, req.body);
    res.json({ point });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

marketingPortalRouter.delete("/portal/marketing/whatsapp-entry-points/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await marketing.deleteWhatsappEntryPoint(id);
    res.json({ success: true });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// MK6: Chatbot FAQ (/portal/marketing/chatbot-faq)
// -----------------------------------------------------------------------------
marketingPortalRouter.get("/portal/marketing/chatbot-faq", async (_req: Request, res: Response) => {
  try {
    const entries = await marketing.listChatbotFaqEntries();
    res.json({ entries });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.post("/portal/marketing/chatbot-faq", requireContentManager, async (req: Request, res: Response) => {
  try {
    const entry = await marketing.createChatbotFaqEntry(req.body);
    res.status(201).json({ entry });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.patch("/portal/marketing/chatbot-faq/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const entry = await marketing.updateChatbotFaqEntry(id, req.body);
    res.json({ entry });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

marketingPortalRouter.delete("/portal/marketing/chatbot-faq/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await marketing.deleteChatbotFaqEntry(id);
    res.json({ success: true });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// MK6: Social Links (/portal/marketing/social-links)
// -----------------------------------------------------------------------------
marketingPortalRouter.get("/portal/marketing/social-links", async (_req: Request, res: Response) => {
  try {
    const links = await marketing.listSocialLinks();
    res.json({ links });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.post("/portal/marketing/social-links", requireContentManager, async (req: Request, res: Response) => {
  try {
    const link = await marketing.createSocialLink(req.body);
    res.status(201).json({ link });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.patch("/portal/marketing/social-links/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const link = await marketing.updateSocialLink(id, req.body);
    res.json({ link });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

marketingPortalRouter.delete("/portal/marketing/social-links/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await marketing.deleteSocialLink(id);
    res.json({ success: true });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// MK6: Translations (/portal/marketing/translations)
// -----------------------------------------------------------------------------
marketingPortalRouter.get("/portal/marketing/translations", async (req: Request, res: Response) => {
  try {
    const lang = typeof req.query.languageCode === "string" ? req.query.languageCode : undefined;
    const translations = await marketing.listTranslations(lang);
    res.json({ translations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.post("/portal/marketing/translations", requireContentManager, async (req: Request, res: Response) => {
  try {
    const translation = await marketing.upsertTranslation(req.body);
    res.json({ translation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// MK7: Media Assets (/portal/marketing/media-assets)
// -----------------------------------------------------------------------------
marketingPortalRouter.get("/portal/marketing/media-assets", requireContentManager, async (req: Request, res: Response) => {
  try {
    const type = typeof req.query.type === "string" ? req.query.type : undefined;
    const tag = typeof req.query.tag === "string" ? req.query.tag : undefined;
    const assets = await marketing.listMediaAssets({ type, tag });
    res.json({ assets });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.post("/portal/marketing/media-assets", requireContentManager, async (req: Request, res: Response) => {
  try {
    const callerId = (req as any).user?.id;
    const asset = await marketing.createMediaAsset({ ...req.body, uploadedByUserId: callerId });
    res.status(201).json({ asset });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.delete("/portal/marketing/media-assets/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await marketing.deleteMediaAsset(id);
    res.json({ success: true });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// MK8: Audience Segments (/portal/marketing/audience-segments)
// -----------------------------------------------------------------------------
marketingPortalRouter.get("/portal/marketing/audience-segments", requireContentManager, async (_req: Request, res: Response) => {
  try {
    const segments = await marketing.listAudienceSegments();
    res.json({ segments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.post("/portal/marketing/audience-segments", requireContentManager, async (req: Request, res: Response) => {
  try {
    const callerId = (req as any).user?.id;
    const segment = await marketing.createAudienceSegment({ ...req.body, createdByUserId: callerId });
    res.status(201).json({ segment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.patch("/portal/marketing/audience-segments/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const segment = await marketing.updateAudienceSegment(id, req.body);
    res.json({ segment });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

marketingPortalRouter.delete("/portal/marketing/audience-segments/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await marketing.deleteAudienceSegment(id);
    res.json({ success: true });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// MK9: Marketing Reports (/portal/marketing/reports and /export)
// -----------------------------------------------------------------------------
marketingPortalRouter.get("/portal/marketing/reports", requireContentManager, async (req: Request, res: Response) => {
  try {
    const groupBy = (req.query.groupBy as any) || "source";
    const period = (req.query.period as any) || "30d";
    const report = await marketing.getMarketingReport({ groupBy, period });
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.get("/portal/marketing/reports/export", requireContentManager, async (req: Request, res: Response) => {
  try {
    const groupBy = (req.query.groupBy as any) || "source";
    const period = (req.query.period as any) || "30d";
    const csv = await marketing.exportMarketingReportCsv({ groupBy, period });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="marketing-report-${groupBy}-${period}.csv"`);
    res.status(200).send(csv);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// MK10: Marketing Settings (/portal/marketing/settings/...)
// -----------------------------------------------------------------------------
marketingPortalRouter.get("/portal/marketing/settings/cta", async (_req: Request, res: Response) => {
  try {
    const cta = await marketing.getCtaSettings();
    res.json({ cta });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.patch("/portal/marketing/settings/cta", requireContentManager, async (req: Request, res: Response) => {
  try {
    const callerRole = (req as any).user.role;
    const cta = await marketing.updateCtaSettings(req.body, callerRole);
    res.json({ cta });
  } catch (error: any) {
    const status = error.code === "FORBIDDEN" ? 403 : 500;
    res.status(status).json({ error: error.message });
  }
});

marketingPortalRouter.get("/portal/marketing/settings/tracking", requireContentManager, async (_req: Request, res: Response) => {
  try {
    const tracking = await marketing.getTrackingSettings();
    res.json(tracking);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.patch("/portal/marketing/settings/tracking", requireContentManager, async (req: Request, res: Response) => {
  try {
    const callerRole = (req as any).user.role;
    const tracking = await marketing.updateTrackingSettings(req.body, callerRole);
    res.json(tracking);
  } catch (error: any) {
    const status = error.code === "FORBIDDEN" ? 403 : error.code === "BAD_REQUEST" ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
});

marketingPortalRouter.post("/portal/marketing/settings/tracking/allow-management", async (req: Request, res: Response) => {
  try {
    const user = await sdk.authenticateRequest(req);
    const allowed = req.body.allowed === true || req.body.allowed === "true";
    const result = await marketing.setAllowMarketingPixelManagement(allowed, user.role);
    res.json(result);
  } catch (error: any) {
    const status = error.code === "FORBIDDEN" ? 403 : 500;
    res.status(status).json({ error: error.message });
  }
});

marketingPortalRouter.get("/portal/marketing/settings/lead-sources", async (_req: Request, res: Response) => {
  try {
    const leadSources = await marketing.listLeadSources();
    res.json({ leadSources });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.post("/portal/marketing/settings/lead-sources", requireContentManager, async (req: Request, res: Response) => {
  try {
    const leadSource = await marketing.createLeadSource(req.body);
    res.status(201).json({ leadSource });
  } catch (error: any) {
    const status = error.code === "BAD_REQUEST" ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
});

marketingPortalRouter.patch("/portal/marketing/settings/lead-sources/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const leadSource = await marketing.updateLeadSource(id, req.body);
    res.json({ leadSource });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

marketingPortalRouter.delete("/portal/marketing/settings/lead-sources/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await marketing.deleteLeadSource(id);
    res.json({ success: true });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

marketingPortalRouter.get("/portal/marketing/settings/message-templates", requireContentManager, async (_req: Request, res: Response) => {
  try {
    const templates = await marketing.listMessageTemplates();
    res.json({ templates });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.post("/portal/marketing/settings/message-templates", requireContentManager, async (req: Request, res: Response) => {
  try {
    const template = await marketing.createMessageTemplate(req.body);
    res.status(201).json({ template });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

marketingPortalRouter.patch("/portal/marketing/settings/message-templates/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const template = await marketing.updateMessageTemplate(id, req.body);
    res.json({ template });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

marketingPortalRouter.delete("/portal/marketing/settings/message-templates/:id", requireContentManager, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await marketing.deleteMessageTemplate(id);
    res.json({ success: true });
  } catch (error: any) {
    const status = error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});
