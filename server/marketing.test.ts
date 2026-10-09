import { describe, expect, it } from "vitest";
import {
  assertMarketingAllowed,
  createAudienceSegment,
  createBlogPost,
  createChatbotFaqEntry,
  createContentBlock,
  createEvent,
  createGalleryMedia,
  createLandingPage,
  createLeadSource,
  createMediaAsset,
  createMessageTemplate,
  createSocialLink,
  createTestimonial,
  createWhatsappEntryPoint,
  deleteContentBlock,
  deleteLeadSource,
  exportMarketingReportCsv,
  getCtaSettings,
  getMarketingReport,
  getTrackingSettings,
  listAudienceSegments,
  listBlogPosts,
  listContentBlocks,
  listEvents,
  listLeadSources,
  listMediaAssets,
  sanitizeHtml,
  setAllowMarketingPixelManagement,
  updateBlogPost,
  updateCourseContent,
  updateCtaSettings,
  updateEvent,
  updateLeadSource,
  updateTestimonial,
  updateTrackingSettings,
  upsertTranslation,
} from "./marketing";

describe("Marketing Module (MK6–MK11)", () => {
  // ---------------------------------------------------------------------------
  // MK6: Content Management
  // ---------------------------------------------------------------------------
  describe("MK6: Content Management & XSS Protection", () => {
    it("sanitizes content blocks against XSS scripts and dangerous event handlers", async () => {
      const maliciousHtml = '<p>Normal text</p><script>alert("hack")</script><img src="x" onerror="stealCookies()">';
      const clean = sanitizeHtml(maliciousHtml);
      expect(clean).not.toContain("<script>");
      expect(clean).not.toContain("onerror=");
      expect(clean).toContain("Normal text");

      const block = await createContentBlock({
        pageSlug: "home",
        sectionKey: "hero-intro",
        blockType: "hero",
        title: 'Safe Title <script>console.log("bad")</script>',
        content: '<div onclick="evil()">Click here</div>',
      });

      expect(block.title).toBe("Safe Title ");
      expect(block.content).not.toContain("onclick=");
    });

    it("allows marketing to edit course content, but STRICTLY BLOCKS seatsEnrolled and teacherId", async () => {
      // Marketing role can update content: fees, description, faq
      const updatedByMarketing = await updateCourseContent(
        1,
        {
          fees: "RM 3,200",
          description: "Updated engaging IELTS curriculum description for 2026.",
          faqJson: JSON.stringify([{ q: "When are intakes?", a: "Every month." }]),
        },
        "marketing"
      );
      expect(updatedByMarketing).toBeDefined();

      // Marketing role attempting to modify seatsEnrolled MUST throw 403 FORBIDDEN
      await expect(
        updateCourseContent(1, { seatsEnrolled: 25 }, "marketing")
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      // Marketing role attempting to assign teacherId MUST throw 403 FORBIDDEN
      await expect(
        updateCourseContent(1, { teacherId: 4 }, "marketing")
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      // Admin role CAN modify operational fields
      const updatedByAdmin = await updateCourseContent(
        1,
        { seatsEnrolled: 18, teacherId: 3 },
        "admin"
      );
      expect(updatedByAdmin).toBeDefined();
    });

    it("allows events direct creation and instant publishing without moderation bottlenecks", async () => {
      const event = await createEvent({
        title: "Open Day & Free Diagnostic Test",
        slug: "open-day-march-2026",
        description: "Join us at Pavilion Embassy campus for language diagnostics.",
        eventDate: "2026-03-25T10:00:00Z",
        location: "Level 8, Tower B, Pavilion Embassy, Kuala Lumpur",
        isPublished: true,
      });

      expect(event.isPublished).toBe(true);
      expect(event.publishedAt).toBeInstanceOf(Date);

      // Instant update toggle
      const toggled = await updateEvent(event.id, { isPublished: false });
      expect(toggled.isPublished).toBe(false);
    });

    it("allows blog posts instant draft <-> published toggle without approval required", async () => {
      const post = await createBlogPost({
        title: "5 Tips for IELTS Speaking Band 7+",
        slug: "ielts-speaking-band-7-tips",
        body: "Preparing for IELTS requires consistent practice and authentic exposure.",
        category: "ielts",
        status: "draft",
      });

      expect(post.status).toBe("draft");

      // Switch directly to published without pending approval
      const published = await updateBlogPost(post.id, { status: "published" });
      expect(published.status).toBe("published");
      expect(published.publishedAt).toBeInstanceOf(Date);
    });

    it("allows direct testimonial management and toggle without pending status", async () => {
      const item = await createTestimonial({
        authorName: "Sarah Al-Mansoor",
        relation: "Student, Intensive English Programme",
        quote: "The cultural immersion in Kuala Lumpur combined with high-calibre teachers helped me pass IELTS in 3 months.",
        rating: 5,
        approved: true,
      });
      expect(item.approved).toBe(true);

      const unapproved = await updateTestimonial(item.id, { approved: false });
      expect(unapproved.approved).toBe(false);
    });

    it("supports landing page creation with arbitrary custom slug", async () => {
      const page = await createLandingPage({
        slug: "ielts-summer-2026-special",
        title: "IELTS Summer 2026 Accelerated Bootcamp",
        seoTitle: "IELTS Summer Bootcamp Kuala Lumpur | Bilingual Idol",
        seoDescription: "Comprehensive 4-week IELTS masterclass at Pavilion Embassy.",
        isPublished: true,
      });

      expect(page.slug).toBe("ielts-summer-2026-special");
      expect(page.pageType).toBe("landingPage");
    });

    it("manages WhatsApp entry points, Chatbot FAQ, and multilingual translations", async () => {
      const wp = await createWhatsappEntryPoint({
        label: "Arabic Advisory Desk",
        whatsappNumber: "+60123456789",
        prefilledMessage: "مرحباً، أود الاستفسار عن دورات اللغة الإنجليزية",
      });
      expect(wp.label).toBe("Arabic Advisory Desk");

      const faq = await createChatbotFaqEntry({
        question: "What are your visa requirements for international students?",
        answerText: "We assist with EMGS Student Visa for courses of 6 months or more.",
        keywords: ["visa", "emgs", "international", "passport"],
      });
      expect(faq.question).toContain("visa requirements");

      const trans = await upsertTranslation({
        entityType: "cta",
        entityId: "apply_now",
        languageCode: "ar",
        fieldKey: "label",
        translatedValue: "قدّم الآن",
      });
      expect(trans.translatedValue).toBe("قدّم الآن");
    });
  });

  // ---------------------------------------------------------------------------
  // MK7: Media Assets Library
  // ---------------------------------------------------------------------------
  describe("MK7: Media Assets", () => {
    it("manages internal marketing banners, logos, and creatives with tags", async () => {
      const asset = await createMediaAsset({
        type: "banner",
        url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644",
        tags: ["campus", "summer-camp", "promo"],
      });
      expect(asset.type).toBe("banner");

      const filtered = await listMediaAssets({ type: "banner", tag: "promo" });
      expect(filtered.some(a => a.id === asset.id)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // MK8: Audience Segments
  // ---------------------------------------------------------------------------
  describe("MK8: Audience Segments", () => {
    it("creates audience segments with criteria snapshots", async () => {
      const segment = await createAudienceSegment({
        name: "Middle East IELTS Prospects",
        filterCriteria: {
          source: ["instagram", "referral"],
          languagePreference: "Arabic",
          ageGroup: "Adults",
        },
      });

      expect(segment.name).toBe("Middle East IELTS Prospects");
      const parsed = JSON.parse(segment.filterCriteria);
      expect(parsed.languagePreference).toBe("Arabic");

      const list = await listAudienceSegments();
      expect(list.some(s => s.id === segment.id)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // MK9: Marketing Reports & CSV Export
  // ---------------------------------------------------------------------------
  describe("MK9: Marketing Reports & CSV Export", () => {
    it("aggregates lead data and generates marketing reports", async () => {
      const report = await getMarketingReport({ groupBy: "source", period: "30d" });
      expect(report).toHaveProperty("totalLeads");
      expect(report).toHaveProperty("totalEnrolled");
      expect(report).toHaveProperty("breakdown");
    });

    it("exports valid CSV formatted output with headers even when data is empty", async () => {
      const csv = await exportMarketingReportCsv({ groupBy: "course", period: "7d" });
      expect(csv).toContain("Group,Total Leads,Contacted,Enrolled,Conversion Rate (%)");
      const lines = csv.split("\n");
      expect(lines.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ---------------------------------------------------------------------------
  // MK10: Marketing Settings
  // ---------------------------------------------------------------------------
  describe("MK10: Settings (CTA, Tracking, Lead Sources, Templates)", () => {
    it("updates CTA button texts with whitelist validation", async () => {
      const initial = await getCtaSettings();
      expect(initial).toHaveProperty("cta.apply_now.text");

      const updated = await updateCtaSettings(
        {
          "cta.apply_now.text": "Enroll for 2026",
          "cta.apply_now.link": "/enroll",
        },
        "marketing"
      );
      expect(updated["cta.apply_now.text"]).toBe("Enroll for 2026");

      // Attempting to update non-whitelisted key should be rejected
      await expect(
        updateCtaSettings({ "unauthorized.key": "malicious" }, "marketing")
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("enforces allowMarketingPixelManagement toggle policy", async () => {
      // Ensure pixel management is disabled initially
      await setAllowMarketingPixelManagement(false, "super_admin");

      // Marketing role attempting to edit tracking pixels must fail with FORBIDDEN
      await expect(
        updateTrackingSettings({ GA_MEASUREMENT_ID: "G-NEW12345" }, "marketing")
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      // Super Admin enables allowMarketingPixelManagement
      await setAllowMarketingPixelManagement(true, "super_admin");

      // Marketing role can now update pixels
      const updated = await updateTrackingSettings({ GA_MEASUREMENT_ID: "G-NEW12345" }, "marketing");
      expect(updated.pixels.GA_MEASUREMENT_ID).toBe("G-NEW12345");
    });

    it("manages lead sources and message templates", async () => {
      const source = await createLeadSource({
        name: "WeChat Mini Program",
        code: "wechat_mini",
      });
      expect(source.code).toBe("wechat_mini");

      const template = await createMessageTemplate({
        name: "Placement Test Invitation",
        channel: "email",
        subject: "Your Free English Diagnostic Test",
        body: "Hello {{name}}, we have scheduled your assessment on {{date}}.",
        variables: ["name", "date"],
      });
      expect(template.name).toBe("Placement Test Invitation");
    });
  });

  // ---------------------------------------------------------------------------
  // MK11: Strict Operational & Data Access Restrictions
  // ---------------------------------------------------------------------------
  describe("MK11: Negative Tests for Operational Restrictions", () => {
    it("strictly blocks marketing from deleting users", () => {
      expect(() => assertMarketingAllowed("delete_user", "marketing")).toThrowError(/cannot delete users/);
    });

    it("strictly blocks marketing from modifying attendance records", () => {
      expect(() => assertMarketingAllowed("modify_attendance", "marketing")).toThrowError(/cannot modify attendance/);
    });

    it("strictly blocks marketing from modifying grades", () => {
      expect(() => assertMarketingAllowed("modify_grades", "marketing")).toThrowError(/cannot modify student grades/);
    });

    it("strictly blocks marketing from creating or editing class sessions", () => {
      expect(() => assertMarketingAllowed("modify_class_sessions", "marketing")).toThrowError(/cannot create or edit class sessions/);
    });

    it("strictly blocks marketing from assigning teacherId", () => {
      expect(() => assertMarketingAllowed("assign_teacher", "marketing")).toThrowError(/cannot assign teacherId/);
    });

    it("strictly blocks marketing from modifying payments or processing refunds", () => {
      expect(() => assertMarketingAllowed("modify_payments", "marketing")).toThrowError(/cannot modify payments/);
    });

    it("strictly blocks marketing from viewing student application documents (passports, visa files)", () => {
      expect(() => assertMarketingAllowed("view_application_documents", "marketing")).toThrowError(/cannot view application/);
    });

    it("strictly blocks marketing from provisioning user roles", () => {
      expect(() => assertMarketingAllowed("manage_roles", "marketing")).toThrowError(/cannot provision user roles/);
    });

    it("strictly blocks marketing from modifying system settings outside whitelist", () => {
      expect(() => assertMarketingAllowed("modify_system_settings_unauthorized", "marketing")).toThrowError(/outside the authorized whitelist/);
    });
  });
});
