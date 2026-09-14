import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, like, sql } from "drizzle-orm";
import {
  audienceSegments,
  blogPosts,
  chatbotFaqEntries,
  contentBlocks,
  contentPages,
  events,
  galleryMedia,
  leadSources,
  mediaAssets,
  messageTemplates,
  programs,
  socialLinks,
  testimonials,
  translations,
  type AudienceSegment,
  type BlogPost,
  type ChatbotFaqEntry,
  type ContentBlock,
  type ContentPage,
  type Event,
  type GalleryMediaItem,
  type LeadSource,
  type MediaAsset,
  type MessageTemplate,
  type Program,
  type SocialLink,
  type Testimonial,
  type Translation,
} from "../drizzle/schema";
import { getDb, inMemoryStore } from "./db";

/**
 * XSS Sanitization utility for content block text / config.
 * Strips script tags, javascript: URIs, and inline event handlers.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/\bon\w+\s*=/gi, "data-blocked-event=");
}

// In-memory fallback stores for non-DB environments and tests
export const marketingStore = {
  contentBlocks: [] as ContentBlock[],
  events: [] as Event[],
  blogPosts: [] as BlogPost[],
  testimonials: [] as Testimonial[],
  galleryMedia: [] as GalleryMediaItem[],
  contentPages: [] as ContentPage[],
  whatsappEntryPoints: [] as {
    id: number;
    label: string;
    whatsappNumber: string;
    prefilledMessage: string | null;
    order: number;
    active: boolean;
  }[],
  chatbotFaqEntries: [] as ChatbotFaqEntry[],
  socialLinks: [] as SocialLink[],
  translations: [] as Translation[],
  mediaAssets: [] as MediaAsset[],
  audienceSegments: [] as AudienceSegment[],
  leadSources: [
    { id: 1, name: "Website Direct", code: "website", active: true, sortOrder: 1 },
    { id: 2, name: "Google Search", code: "google_search", active: true, sortOrder: 2 },
    { id: 3, name: "Instagram Ad", code: "instagram", active: true, sortOrder: 3 },
    { id: 4, name: "TikTok Campaign", code: "tiktok", active: true, sortOrder: 4 },
    { id: 5, name: "WhatsApp Inquiry", code: "whatsapp", active: true, sortOrder: 5 },
    { id: 6, name: "Education Fair", code: "education_fair", active: true, sortOrder: 6 },
    { id: 7, name: "Partner Referral", code: "referral", active: true, sortOrder: 7 },
  ] as LeadSource[],
  messageTemplates: [
    {
      id: 1,
      name: "Welcome Inquiry Response",
      channel: "email" as const,
      subject: "Welcome to Bilingual Idol Language Centre",
      body: "Dear {{name}}, thank you for reaching out regarding {{course}}. Our student advisor will contact you within 24 hours.",
      variables: JSON.stringify(["name", "course"]),
      createdAt: new Date(),
    },
    {
      id: 2,
      name: "WhatsApp Quick Intro",
      channel: "whatsapp" as const,
      subject: null,
      body: "Hi {{name}}! Welcome to Bilingual Idol at Pavilion Embassy. Would you like to schedule a free campus visit or diagnostic placement test?",
      variables: JSON.stringify(["name"]),
      createdAt: new Date(),
    },
  ] as MessageTemplate[],
  systemSettings: {
    "cta.apply_now.text": "Apply Now",
    "cta.apply_now.link": "/enroll",
    "cta.placement_test.text": "Book Placement Test",
    "cta.placement_test.link": "/enroll?type=placement",
    "cta.book_visit.text": "Book a Campus Visit",
    "cta.book_visit.link": "/contact?reason=visit",
    "cta.consultation.text": "Request Consultation",
    "cta.consultation.link": "/contact?reason=consultation",
    "allowMarketingPixelManagement": "false",
    "GA_MEASUREMENT_ID": "G-BILC2026EXP",
    "META_PIXEL_ID": "987654321012345",
    "TIKTOK_PIXEL_ID": "TT-BILC-8899",
  } as Record<string, string>,
  nextId: 1000,
};

export const ALLOWED_CTA_KEYS = [
  "cta.apply_now.text",
  "cta.apply_now.link",
  "cta.placement_test.text",
  "cta.placement_test.link",
  "cta.book_visit.text",
  "cta.book_visit.link",
  "cta.consultation.text",
  "cta.consultation.link",
] as const;

export const TRACKING_KEYS = [
  "GA_MEASUREMENT_ID",
  "META_PIXEL_ID",
  "TIKTOK_PIXEL_ID",
] as const;

// -----------------------------------------------------------------------------
// MK11: Explicit Restrictions Verification
// -----------------------------------------------------------------------------
export function assertMarketingAllowed(action: string, role?: string | null) {
  if (!role) throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required." });
  if (role === "marketing") {
    switch (action) {
      case "delete_user":
        throw new TRPCError({ code: "FORBIDDEN", message: "Marketing role cannot delete users." });
      case "modify_attendance":
        throw new TRPCError({ code: "FORBIDDEN", message: "Marketing role cannot modify attendance records." });
      case "modify_grades":
        throw new TRPCError({ code: "FORBIDDEN", message: "Marketing role cannot modify student grades." });
      case "modify_class_sessions":
        throw new TRPCError({ code: "FORBIDDEN", message: "Marketing role cannot create or edit class sessions." });
      case "assign_teacher":
        throw new TRPCError({ code: "FORBIDDEN", message: "Marketing role cannot assign teacherId to sessions or courses." });
      case "modify_payments":
        throw new TRPCError({ code: "FORBIDDEN", message: "Marketing role cannot modify payments or process refunds." });
      case "view_application_documents":
        throw new TRPCError({ code: "FORBIDDEN", message: "Marketing role cannot view application passports or visa documents." });
      case "manage_roles":
        throw new TRPCError({ code: "FORBIDDEN", message: "Marketing role cannot provision user roles or manage administrative accounts." });
      case "modify_system_settings_unauthorized":
        throw new TRPCError({ code: "FORBIDDEN", message: "Marketing role cannot modify system settings outside the authorized whitelist." });
    }
  }
}

// -----------------------------------------------------------------------------
// MK6: Content Blocks
// -----------------------------------------------------------------------------
export async function listContentBlocks(pageSlug?: string) {
  if (pageSlug) {
    return marketingStore.contentBlocks
      .filter(b => b.pageSlug === pageSlug && b.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return [...marketingStore.contentBlocks].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createContentBlock(input: {
  pageSlug: string;
  sectionKey: string;
  blockType: string;
  title?: string;
  content?: string;
  configJson?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const allowedTypes = ["hero", "text", "cards", "banner", "cta", "faq", "features", "custom"];
  if (!allowedTypes.includes(input.blockType)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Invalid blockType. Allowed: ${allowedTypes.join(", ")}` });
  }

  const block: ContentBlock = {
    id: marketingStore.nextId++,
    pageSlug: input.pageSlug,
    sectionKey: input.sectionKey,
    blockType: input.blockType,
    title: input.title ? sanitizeHtml(input.title) : null,
    content: input.content ? sanitizeHtml(input.content) : null,
    configJson: input.configJson ? sanitizeHtml(input.configJson) : null,
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  marketingStore.contentBlocks.push(block);
  return block;
}

export async function updateContentBlock(
  id: number,
  input: Partial<{
    pageSlug: string;
    sectionKey: string;
    blockType: string;
    title: string;
    content: string;
    configJson: string;
    sortOrder: number;
    isActive: boolean;
  }>
) {
  const block = marketingStore.contentBlocks.find(b => b.id === id);
  if (!block) throw new TRPCError({ code: "NOT_FOUND", message: "Content block not found." });

  if (input.pageSlug !== undefined) block.pageSlug = input.pageSlug;
  if (input.sectionKey !== undefined) block.sectionKey = input.sectionKey;
  if (input.blockType !== undefined) block.blockType = input.blockType;
  if (input.title !== undefined) block.title = sanitizeHtml(input.title);
  if (input.content !== undefined) block.content = sanitizeHtml(input.content);
  if (input.configJson !== undefined) block.configJson = sanitizeHtml(input.configJson);
  if (input.sortOrder !== undefined) block.sortOrder = input.sortOrder;
  if (input.isActive !== undefined) block.isActive = input.isActive;
  block.updatedAt = new Date();
  return block;
}

export async function deleteContentBlock(id: number) {
  const index = marketingStore.contentBlocks.findIndex(b => b.id === id);
  if (index === -1) throw new TRPCError({ code: "NOT_FOUND", message: "Content block not found." });
  marketingStore.contentBlocks.splice(index, 1);
  return { success: true };
}

// -----------------------------------------------------------------------------
// MK6: Course Content Updates (with Strict Operational Protection)
// -----------------------------------------------------------------------------
export async function updateCourseContent(
  courseId: number,
  input: {
    title?: string;
    description?: string;
    fees?: string;
    duration?: string;
    schedule?: string;
    level?: string;
    ageGroup?: string;
    category?: string;
    language?: string;
    faqJson?: string;
    outcomes?: string;
    imageUrl?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    seoTitle?: string;
    seoDescription?: string;
    // Operational fields (strictly restricted for marketing)
    seatsEnrolled?: number;
    teacherId?: number | null;
  },
  callerRole: string
) {
  // Check MK6 / MK11: Marketing cannot modify operational fields seatsEnrolled or teacherId
  if (callerRole === "marketing") {
    if (input.seatsEnrolled !== undefined) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Marketing role is not permitted to modify course capacity or seats enrolled.",
      });
    }
    if (input.teacherId !== undefined) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Marketing role is not permitted to assign or modify course instructors.",
      });
    }
  }

  // Find course in database or fallback
  const db = await getDb();
  if (db) {
    const updateSet: Record<string, any> = {};
    if (input.title !== undefined) updateSet.title = input.title;
    if (input.description !== undefined) updateSet.description = input.description;
    if (input.fees !== undefined) updateSet.fees = input.fees;
    if (input.duration !== undefined) updateSet.duration = input.duration;
    if (input.schedule !== undefined) updateSet.schedule = input.schedule;
    if (input.level !== undefined) updateSet.level = input.level;
    if (input.ageGroup !== undefined) updateSet.ageGroup = input.ageGroup;
    if (input.category !== undefined) updateSet.category = input.category;
    if (input.language !== undefined) updateSet.language = input.language;
    if (input.faqJson !== undefined) updateSet.faqJson = input.faqJson;
    if (input.outcomes !== undefined) updateSet.outcomes = input.outcomes;
    if (input.imageUrl !== undefined) updateSet.imageUrl = input.imageUrl;
    if (input.ctaLabel !== undefined) updateSet.ctaLabel = input.ctaLabel;
    if (input.ctaUrl !== undefined) updateSet.ctaUrl = input.ctaUrl;
    if (input.seoTitle !== undefined) updateSet.seoTitle = input.seoTitle;
    if (input.seoDescription !== undefined) updateSet.seoDescription = input.seoDescription;

    if (callerRole !== "marketing") {
      if (input.seatsEnrolled !== undefined) updateSet.seatsEnrolled = input.seatsEnrolled;
      if (input.teacherId !== undefined) updateSet.teacherId = input.teacherId;
    }

    await db.update(programs).set(updateSet).where(eq(programs.id, courseId));
    const [updated] = await db.select().from(programs).where(eq(programs.id, courseId));
    return updated;
  }

  // Fallback in-memory
  const course = inMemoryStore?.programs?.find(p => p.id === courseId);
  if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "Course not found." });

  if (input.title !== undefined) course.title = input.title;
  if (input.description !== undefined) course.description = input.description;
  if (input.fees !== undefined) course.fees = input.fees;
  if (input.duration !== undefined) course.duration = input.duration;
  if (input.schedule !== undefined) course.schedule = input.schedule;
  if (input.level !== undefined) course.level = input.level;
  if (input.ageGroup !== undefined) course.ageGroup = input.ageGroup;
  if (input.category !== undefined) course.category = input.category;
  if (input.language !== undefined) course.language = input.language;
  if (input.faqJson !== undefined) (course as any).faqJson = input.faqJson;
  if (input.outcomes !== undefined) (course as any).outcomes = input.outcomes;
  if (input.imageUrl !== undefined) (course as any).imageUrl = input.imageUrl;
  if (input.ctaLabel !== undefined) (course as any).ctaLabel = input.ctaLabel;
  if (input.ctaUrl !== undefined) (course as any).ctaUrl = input.ctaUrl;
  if (input.seoTitle !== undefined) (course as any).seoTitle = input.seoTitle;
  if (input.seoDescription !== undefined) (course as any).seoDescription = input.seoDescription;

  if (callerRole !== "marketing") {
    if (input.seatsEnrolled !== undefined) (course as any).seatsEnrolled = input.seatsEnrolled;
    if (input.teacherId !== undefined) (course as any).teacherId = input.teacherId;
  }

  return course;
}

// -----------------------------------------------------------------------------
// MK6: Events CRUD (Instant publish, no pendingApproval)
// -----------------------------------------------------------------------------
export async function listEvents() {
  return [...marketingStore.events].sort(
    (a, b) => (b.eventDate?.getTime() ?? 0) - (a.eventDate?.getTime() ?? 0)
  );
}

export async function createEvent(input: {
  title: string;
  slug: string;
  description: string;
  eventDate?: Date | string;
  location?: string;
  imageUrl?: string;
  isPublished?: boolean;
  createdByUserId?: number;
}) {
  const existing = marketingStore.events.find(e => e.slug === input.slug);
  if (existing) throw new TRPCError({ code: "BAD_REQUEST", message: "Event slug already exists." });

  const event: Event = {
    id: marketingStore.nextId++,
    title: input.title,
    slug: input.slug,
    description: input.description,
    eventDate: input.eventDate ? new Date(input.eventDate) : null,
    location: input.location ?? null,
    imageUrl: input.imageUrl ?? null,
    isPublished: input.isPublished ?? true,
    publishedAt: (input.isPublished ?? true) ? new Date() : null,
    createdByUserId: input.createdByUserId ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  marketingStore.events.push(event);
  return event;
}

export async function updateEvent(
  id: number,
  input: Partial<{
    title: string;
    slug: string;
    description: string;
    eventDate: Date | string;
    location: string;
    imageUrl: string;
    isPublished: boolean;
  }>
) {
  const event = marketingStore.events.find(e => e.id === id);
  if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found." });

  if (input.title !== undefined) event.title = input.title;
  if (input.slug !== undefined) event.slug = input.slug;
  if (input.description !== undefined) event.description = input.description;
  if (input.eventDate !== undefined) event.eventDate = new Date(input.eventDate);
  if (input.location !== undefined) event.location = input.location;
  if (input.imageUrl !== undefined) event.imageUrl = input.imageUrl;
  if (input.isPublished !== undefined) {
    event.isPublished = input.isPublished;
    if (input.isPublished && !event.publishedAt) event.publishedAt = new Date();
  }
  event.updatedAt = new Date();
  return event;
}

export async function deleteEvent(id: number) {
  const index = marketingStore.events.findIndex(e => e.id === id);
  if (index === -1) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found." });
  marketingStore.events.splice(index, 1);
  return { success: true };
}

// -----------------------------------------------------------------------------
// MK6: Blog Posts CRUD (Instant draft <-> published toggle)
// -----------------------------------------------------------------------------
export async function listBlogPosts(status?: "draft" | "published") {
  if (status) {
    return marketingStore.blogPosts.filter(p => p.status === status);
  }
  return [...marketingStore.blogPosts].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export async function createBlogPost(input: {
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  category?: string;
  status?: "draft" | "published";
  imageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  authorId?: number;
}) {
  const existing = marketingStore.blogPosts.find(p => p.slug === input.slug);
  if (existing) throw new TRPCError({ code: "BAD_REQUEST", message: "Blog slug already exists." });

  const status = input.status ?? "published";
  const post: BlogPost = {
    id: marketingStore.nextId++,
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt ?? null,
    body: input.body,
    category: input.category ?? "general",
    status,
    imageUrl: input.imageUrl ?? null,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    authorId: input.authorId ?? null,
    publishedAt: status === "published" ? new Date() : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  marketingStore.blogPosts.push(post);
  return post;
}

export async function updateBlogPost(
  id: number,
  input: Partial<{
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    category: string;
    status: "draft" | "published";
    imageUrl: string;
    seoTitle: string;
    seoDescription: string;
  }>
) {
  const post = marketingStore.blogPosts.find(p => p.id === id);
  if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Blog post not found." });

  if (input.title !== undefined) post.title = input.title;
  if (input.slug !== undefined) post.slug = input.slug;
  if (input.excerpt !== undefined) post.excerpt = input.excerpt;
  if (input.body !== undefined) post.body = input.body;
  if (input.category !== undefined) post.category = input.category;
  if (input.status !== undefined) {
    post.status = input.status;
    if (input.status === "published" && !post.publishedAt) post.publishedAt = new Date();
  }
  if (input.imageUrl !== undefined) post.imageUrl = input.imageUrl;
  if (input.seoTitle !== undefined) post.seoTitle = input.seoTitle;
  if (input.seoDescription !== undefined) post.seoDescription = input.seoDescription;
  post.updatedAt = new Date();
  return post;
}

export async function deleteBlogPost(id: number) {
  const index = marketingStore.blogPosts.find(p => p.id === id);
  if (!index) throw new TRPCError({ code: "NOT_FOUND", message: "Blog post not found." });
  marketingStore.blogPosts = marketingStore.blogPosts.filter(p => p.id !== id);
  return { success: true };
}

// -----------------------------------------------------------------------------
// MK6: Testimonials CRUD (Direct toggle, no approval bottlenecks)
// -----------------------------------------------------------------------------
export async function listTestimonials() {
  return [...marketingStore.testimonials];
}

export async function createTestimonial(input: {
  authorName: string;
  relation: string;
  quote: string;
  rating: number;
  approved?: boolean;
}) {
  const t: Testimonial = {
    id: marketingStore.nextId++,
    authorName: input.authorName,
    relation: input.relation,
    quote: input.quote,
    rating: input.rating,
    approved: input.approved ?? true,
    consentConfirmed: true,
    createdAt: new Date(),
  };
  marketingStore.testimonials.push(t);
  return t;
}

export async function updateTestimonial(
  id: number,
  input: Partial<{
    authorName: string;
    relation: string;
    quote: string;
    rating: number;
    approved: boolean;
  }>
) {
  const item = marketingStore.testimonials.find(t => t.id === id);
  if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Testimonial not found." });
  if (input.authorName !== undefined) item.authorName = input.authorName;
  if (input.relation !== undefined) item.relation = input.relation;
  if (input.quote !== undefined) item.quote = input.quote;
  if (input.rating !== undefined) item.rating = input.rating;
  if (input.approved !== undefined) item.approved = input.approved;
  return item;
}

export async function deleteTestimonial(id: number) {
  const idx = marketingStore.testimonials.findIndex(t => t.id === id);
  if (idx === -1) throw new TRPCError({ code: "NOT_FOUND", message: "Testimonial not found." });
  marketingStore.testimonials.splice(idx, 1);
  return { success: true };
}

// -----------------------------------------------------------------------------
// MK6: Gallery Media
// -----------------------------------------------------------------------------
export async function listGalleryMedia(category?: string) {
  if (category) {
    return marketingStore.galleryMedia.filter(g => g.category === category);
  }
  return [...marketingStore.galleryMedia].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createGalleryMedia(input: {
  title: string;
  category: string;
  url: string;
  altText?: string;
  sortOrder?: number;
}) {
  const item: GalleryMediaItem = {
    id: marketingStore.nextId++,
    title: input.title,
    category: input.category,
    url: input.url,
    altText: input.altText ?? null,
    sortOrder: input.sortOrder ?? 0,
    createdAt: new Date(),
  };
  marketingStore.galleryMedia.push(item);
  return item;
}

export async function deleteGalleryMedia(id: number) {
  const idx = marketingStore.galleryMedia.findIndex(g => g.id === id);
  if (idx === -1) throw new TRPCError({ code: "NOT_FOUND", message: "Gallery item not found." });
  marketingStore.galleryMedia.splice(idx, 1);
  return { success: true };
}

// -----------------------------------------------------------------------------
// MK6: Content Pages (Landing Pages)
// -----------------------------------------------------------------------------
export async function listContentPages(pageType?: "site" | "landingPage") {
  if (pageType) {
    return marketingStore.contentPages.filter(p => p.pageType === pageType);
  }
  return [...marketingStore.contentPages];
}

export async function createLandingPage(input: {
  slug: string;
  title: string;
  contentJson?: string;
  seoTitle?: string;
  seoDescription?: string;
  isPublished?: boolean;
}) {
  const existing = marketingStore.contentPages.find(p => p.slug === input.slug);
  if (existing) throw new TRPCError({ code: "BAD_REQUEST", message: "Page slug already exists." });

  const page: ContentPage = {
    id: marketingStore.nextId++,
    slug: input.slug,
    title: input.title,
    pageType: "landingPage",
    contentJson: input.contentJson ?? null,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    isPublished: input.isPublished ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  marketingStore.contentPages.push(page);
  return page;
}

export async function updateContentPage(
  id: number,
  input: Partial<{
    title: string;
    contentJson: string;
    seoTitle: string;
    seoDescription: string;
    isPublished: boolean;
  }>
) {
  const page = marketingStore.contentPages.find(p => p.id === id);
  if (!page) throw new TRPCError({ code: "NOT_FOUND", message: "Page not found." });
  if (input.title !== undefined) page.title = input.title;
  if (input.contentJson !== undefined) page.contentJson = input.contentJson;
  if (input.seoTitle !== undefined) page.seoTitle = input.seoTitle;
  if (input.seoDescription !== undefined) page.seoDescription = input.seoDescription;
  if (input.isPublished !== undefined) page.isPublished = input.isPublished;
  page.updatedAt = new Date();
  return page;
}

export async function deleteContentPage(id: number) {
  const idx = marketingStore.contentPages.findIndex(p => p.id === id);
  if (idx === -1) throw new TRPCError({ code: "NOT_FOUND", message: "Page not found." });
  marketingStore.contentPages.splice(idx, 1);
  return { success: true };
}

// -----------------------------------------------------------------------------
// MK6: WhatsApp Entry Points
// -----------------------------------------------------------------------------
export async function listWhatsappEntryPoints() {
  return [...marketingStore.whatsappEntryPoints].sort((a, b) => a.order - b.order);
}

export async function createWhatsappEntryPoint(input: {
  label: string;
  whatsappNumber: string;
  prefilledMessage?: string;
  order?: number;
  active?: boolean;
}) {
  const entry = {
    id: marketingStore.nextId++,
    label: input.label,
    whatsappNumber: input.whatsappNumber,
    prefilledMessage: input.prefilledMessage ?? null,
    order: input.order ?? 0,
    active: input.active ?? true,
  };
  marketingStore.whatsappEntryPoints.push(entry);
  return entry;
}

export async function updateWhatsappEntryPoint(
  id: number,
  input: Partial<{
    label: string;
    whatsappNumber: string;
    prefilledMessage: string;
    order: number;
    active: boolean;
  }>
) {
  const entry = marketingStore.whatsappEntryPoints.find(e => e.id === id);
  if (!entry) throw new TRPCError({ code: "NOT_FOUND", message: "WhatsApp entry point not found." });
  if (input.label !== undefined) entry.label = input.label;
  if (input.whatsappNumber !== undefined) entry.whatsappNumber = input.whatsappNumber;
  if (input.prefilledMessage !== undefined) entry.prefilledMessage = input.prefilledMessage;
  if (input.order !== undefined) entry.order = input.order;
  if (input.active !== undefined) entry.active = input.active;
  return entry;
}

export async function deleteWhatsappEntryPoint(id: number) {
  const idx = marketingStore.whatsappEntryPoints.findIndex(e => e.id === id);
  if (idx === -1) throw new TRPCError({ code: "NOT_FOUND", message: "WhatsApp entry point not found." });
  marketingStore.whatsappEntryPoints.splice(idx, 1);
  return { success: true };
}

// -----------------------------------------------------------------------------
// MK6: Chatbot FAQ Entries
// -----------------------------------------------------------------------------
export async function listChatbotFaqEntries() {
  return [...marketingStore.chatbotFaqEntries];
}

export async function createChatbotFaqEntry(input: {
  question: string;
  answerText: string;
  keywords?: string[];
  relatedCourseId?: number;
  active?: boolean;
}) {
  const entry: ChatbotFaqEntry = {
    id: marketingStore.nextId++,
    question: input.question,
    answerText: input.answerText,
    keywords: input.keywords ? JSON.stringify(input.keywords) : null,
    relatedCourseId: input.relatedCourseId ?? null,
    active: input.active ?? true,
    updatedAt: new Date(),
  };
  marketingStore.chatbotFaqEntries.push(entry);
  return entry;
}

export async function updateChatbotFaqEntry(
  id: number,
  input: Partial<{
    question: string;
    answerText: string;
    keywords: string[];
    relatedCourseId: number | null;
    active: boolean;
  }>
) {
  const entry = marketingStore.chatbotFaqEntries.find(e => e.id === id);
  if (!entry) throw new TRPCError({ code: "NOT_FOUND", message: "Chatbot FAQ entry not found." });
  if (input.question !== undefined) entry.question = input.question;
  if (input.answerText !== undefined) entry.answerText = input.answerText;
  if (input.keywords !== undefined) entry.keywords = JSON.stringify(input.keywords);
  if (input.relatedCourseId !== undefined) entry.relatedCourseId = input.relatedCourseId;
  if (input.active !== undefined) entry.active = input.active;
  entry.updatedAt = new Date();
  return entry;
}

export async function deleteChatbotFaqEntry(id: number) {
  const idx = marketingStore.chatbotFaqEntries.findIndex(e => e.id === id);
  if (idx === -1) throw new TRPCError({ code: "NOT_FOUND", message: "Chatbot FAQ entry not found." });
  marketingStore.chatbotFaqEntries.splice(idx, 1);
  return { success: true };
}

// -----------------------------------------------------------------------------
// MK6: Social Links
// -----------------------------------------------------------------------------
export async function listSocialLinks() {
  return [...marketingStore.socialLinks].sort((a, b) => a.order - b.order);
}

export async function createSocialLink(input: {
  platform: "instagram" | "tiktok" | "facebook" | "telegram" | "other";
  url: string;
  active?: boolean;
  order?: number;
}) {
  const link: SocialLink = {
    id: marketingStore.nextId++,
    platform: input.platform,
    url: input.url,
    active: input.active ?? true,
    order: input.order ?? 0,
  };
  marketingStore.socialLinks.push(link);
  return link;
}

export async function updateSocialLink(
  id: number,
  input: Partial<{
    platform: "instagram" | "tiktok" | "facebook" | "telegram" | "other";
    url: string;
    active: boolean;
    order: number;
  }>
) {
  const link = marketingStore.socialLinks.find(l => l.id === id);
  if (!link) throw new TRPCError({ code: "NOT_FOUND", message: "Social link not found." });
  if (input.platform !== undefined) link.platform = input.platform;
  if (input.url !== undefined) link.url = input.url;
  if (input.active !== undefined) link.active = input.active;
  if (input.order !== undefined) link.order = input.order;
  return link;
}

export async function deleteSocialLink(id: number) {
  const idx = marketingStore.socialLinks.findIndex(l => l.id === id);
  if (idx === -1) throw new TRPCError({ code: "NOT_FOUND", message: "Social link not found." });
  marketingStore.socialLinks.splice(idx, 1);
  return { success: true };
}

// -----------------------------------------------------------------------------
// MK6: Multilingual Translations
// -----------------------------------------------------------------------------
export async function listTranslations(languageCode?: string) {
  if (languageCode) {
    return marketingStore.translations.filter(t => t.languageCode === languageCode);
  }
  return [...marketingStore.translations];
}

export async function upsertTranslation(input: {
  entityType: string;
  entityId: string;
  languageCode: string;
  fieldKey: string;
  translatedValue: string;
}) {
  const existing = marketingStore.translations.find(
    t =>
      t.entityType === input.entityType &&
      t.entityId === input.entityId &&
      t.languageCode === input.languageCode &&
      t.fieldKey === input.fieldKey
  );
  if (existing) {
    existing.translatedValue = input.translatedValue;
    existing.updatedAt = new Date();
    return existing;
  }
  const t: Translation = {
    id: marketingStore.nextId++,
    entityType: input.entityType,
    entityId: input.entityId,
    languageCode: input.languageCode,
    fieldKey: input.fieldKey,
    translatedValue: input.translatedValue,
    updatedAt: new Date(),
  };
  marketingStore.translations.push(t);
  return t;
}

// -----------------------------------------------------------------------------
// MK7: Media Assets (Internal Marketing Repository)
// -----------------------------------------------------------------------------
export async function listMediaAssets(filter?: { type?: string; tag?: string }) {
  let list = [...marketingStore.mediaAssets];
  if (filter?.type) {
    list = list.filter(a => a.type === filter.type);
  }
  if (filter?.tag) {
    list = list.filter(a => {
      try {
        const tags: string[] = a.tags ? JSON.parse(a.tags) : [];
        return tags.includes(filter.tag!);
      } catch {
        return false;
      }
    });
  }
  return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createMediaAsset(input: {
  type: "banner" | "logo" | "creative" | "other";
  url: string;
  tags?: string[];
  uploadedByUserId?: number;
}) {
  const asset: MediaAsset = {
    id: marketingStore.nextId++,
    type: input.type,
    url: input.url,
    tags: input.tags ? JSON.stringify(input.tags) : null,
    uploadedByUserId: input.uploadedByUserId ?? null,
    createdAt: new Date(),
  };
  marketingStore.mediaAssets.push(asset);
  return asset;
}

export async function deleteMediaAsset(id: number) {
  const idx = marketingStore.mediaAssets.findIndex(a => a.id === id);
  if (idx === -1) throw new TRPCError({ code: "NOT_FOUND", message: "Media asset not found." });
  marketingStore.mediaAssets.splice(idx, 1);
  return { success: true };
}

// -----------------------------------------------------------------------------
// MK8: Audience Segments (Snapshot Criteria on Campaign Launch)
// -----------------------------------------------------------------------------
export async function listAudienceSegments() {
  return [...marketingStore.audienceSegments].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export async function createAudienceSegment(input: {
  name: string;
  filterCriteria: {
    status?: string[];
    source?: string[];
    courseInterestId?: number | null;
    ageGroup?: string;
    languagePreference?: string;
  };
  createdByUserId?: number;
}) {
  const segment: AudienceSegment = {
    id: marketingStore.nextId++,
    name: input.name,
    filterCriteria: JSON.stringify(input.filterCriteria),
    createdByUserId: input.createdByUserId ?? null,
    createdAt: new Date(),
  };
  marketingStore.audienceSegments.push(segment);
  return segment;
}

export async function updateAudienceSegment(
  id: number,
  input: {
    name?: string;
    filterCriteria?: Record<string, any>;
  }
) {
  const segment = marketingStore.audienceSegments.find(s => s.id === id);
  if (!segment) throw new TRPCError({ code: "NOT_FOUND", message: "Audience segment not found." });
  if (input.name !== undefined) segment.name = input.name;
  if (input.filterCriteria !== undefined) segment.filterCriteria = JSON.stringify(input.filterCriteria);
  return segment;
}

export async function deleteAudienceSegment(id: number) {
  const idx = marketingStore.audienceSegments.findIndex(s => s.id === id);
  if (idx === -1) throw new TRPCError({ code: "NOT_FOUND", message: "Audience segment not found." });
  marketingStore.audienceSegments.splice(idx, 1);
  return { success: true };
}

// -----------------------------------------------------------------------------
// MK9: Marketing Reports & CSV Export
// -----------------------------------------------------------------------------
export async function getMarketingReport(params: {
  groupBy?: "source" | "course" | "campaign";
  period?: "7d" | "30d" | "90d" | "all";
}) {
  const groupBy = params.groupBy ?? "source";
  const period = params.period ?? "30d";

  // Aggregate submissions/leads based on grouped attribute
  const submissions = inMemoryStore?.submissions ?? [];

  // Filter by period
  const now = Date.now();
  const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 3650;
  const filtered = submissions.filter(
    s => now - s.createdAt.getTime() <= periodDays * 24 * 60 * 60 * 1000
  );

  const groupCounts: Record<string, { total: number; contacted: number; enrolled: number }> = {};

  for (const s of filtered) {
    const key =
      groupBy === "source"
        ? s.source || "organic"
        : groupBy === "course"
        ? s.programInterest || "General English"
        : "campaign_general";

    if (!groupCounts[key]) {
      groupCounts[key] = { total: 0, contacted: 0, enrolled: 0 };
    }
    groupCounts[key].total++;
    if (s.status === "contacted" || s.status === "interested" || s.status === "enrolled") {
      groupCounts[key].contacted++;
    }
    if (s.status === "enrolled") {
      groupCounts[key].enrolled++;
    }
  }

  const rows = Object.entries(groupCounts).map(([group, counts]) => ({
    group,
    total: counts.total,
    contacted: counts.contacted,
    enrolled: counts.enrolled,
    conversionRate: counts.total > 0 ? ((counts.enrolled / counts.total) * 100).toFixed(1) : "0.0",
  }));

  const totalLeads = filtered.length;
  const totalEnrolled = filtered.filter(s => s.status === "enrolled").length;
  const conversionRate = totalLeads > 0 ? ((totalEnrolled / totalLeads) * 100).toFixed(1) : "0.0";

  return {
    groupBy,
    period,
    totalLeads,
    totalEnrolled,
    conversionRate,
    breakdown: rows,
  };
}

export async function exportMarketingReportCsv(params: {
  groupBy?: "source" | "course" | "campaign";
  period?: "7d" | "30d" | "90d" | "all";
}): Promise<string> {
  const report = await getMarketingReport(params);
  const headers = ["Group", "Total Leads", "Contacted", "Enrolled", "Conversion Rate (%)"];
  const csvLines = [headers.join(",")];

  for (const row of report.breakdown) {
    csvLines.push(
      `"${row.group}",${row.total},${row.contacted},${row.enrolled},${row.conversionRate}%`
    );
  }

  return csvLines.join("\n");
}

// -----------------------------------------------------------------------------
// MK10: Marketing Settings (CTA, Tracking Pixels, Lead Sources, Message Templates)
// -----------------------------------------------------------------------------
export async function getCtaSettings() {
  const result: Record<string, string> = {};
  for (const key of ALLOWED_CTA_KEYS) {
    result[key] = marketingStore.systemSettings[key] ?? "";
  }
  return result;
}

export async function updateCtaSettings(
  values: Record<string, string>,
  callerRole: string
) {
  // Validate that only whitelisted keys are being updated
  for (const key of Object.keys(values)) {
    if (!ALLOWED_CTA_KEYS.includes(key as any)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Key '${key}' is not in the authorized CTA settings whitelist.`,
      });
    }
  }

  for (const [key, val] of Object.entries(values)) {
    marketingStore.systemSettings[key] = val;
  }
  return getCtaSettings();
}

export async function getTrackingSettings() {
  const allowPixelManagement = marketingStore.systemSettings["allowMarketingPixelManagement"] === "true";
  const pixels: Record<string, string> = {};
  for (const key of TRACKING_KEYS) {
    pixels[key] = marketingStore.systemSettings[key] ?? "";
  }
  return {
    allowMarketingPixelManagement: allowPixelManagement,
    pixels,
  };
}

export async function updateTrackingSettings(
  pixels: Record<string, string>,
  callerRole: string
) {
  const isSuperOrFounder = ["founder", "super_admin"].includes(callerRole);
  const allowMarketing = marketingStore.systemSettings["allowMarketingPixelManagement"] === "true";

  if (callerRole === "marketing" && !allowMarketing) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Pixel management is currently restricted by Super Admin policy.",
    });
  }

  for (const key of Object.keys(pixels)) {
    if (!TRACKING_KEYS.includes(key as any)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Unknown tracking key '${key}'.`,
      });
    }
  }

  for (const [key, val] of Object.entries(pixels)) {
    marketingStore.systemSettings[key] = val;
  }
  return getTrackingSettings();
}

export async function setAllowMarketingPixelManagement(allowed: boolean, callerRole: string) {
  if (!["founder", "super_admin"].includes(callerRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only Super Admin can toggle pixel management permission.",
    });
  }
  marketingStore.systemSettings["allowMarketingPixelManagement"] = String(allowed);
  return { allowMarketingPixelManagement: allowed };
}

export async function listLeadSources() {
  return [...marketingStore.leadSources].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createLeadSource(input: {
  name: string;
  code: string;
  active?: boolean;
  sortOrder?: number;
}) {
  const existing = marketingStore.leadSources.find(s => s.code === input.code);
  if (existing) throw new TRPCError({ code: "BAD_REQUEST", message: "Lead source code already exists." });

  const item: LeadSource = {
    id: marketingStore.nextId++,
    name: input.name,
    code: input.code,
    active: input.active ?? true,
    sortOrder: input.sortOrder ?? marketingStore.leadSources.length + 1,
  };
  marketingStore.leadSources.push(item);
  return item;
}

export async function updateLeadSource(
  id: number,
  input: Partial<{
    name: string;
    active: boolean;
    sortOrder: number;
  }>
) {
  const item = marketingStore.leadSources.find(s => s.id === id);
  if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Lead source not found." });
  if (input.name !== undefined) item.name = input.name;
  if (input.active !== undefined) item.active = input.active;
  if (input.sortOrder !== undefined) item.sortOrder = input.sortOrder;
  return item;
}

export async function deleteLeadSource(id: number) {
  const idx = marketingStore.leadSources.findIndex(s => s.id === id);
  if (idx === -1) throw new TRPCError({ code: "NOT_FOUND", message: "Lead source not found." });
  marketingStore.leadSources.splice(idx, 1);
  return { success: true };
}

export async function listMessageTemplates() {
  return [...marketingStore.messageTemplates];
}

export async function createMessageTemplate(input: {
  name: string;
  channel: "email" | "sms" | "whatsapp";
  subject?: string;
  body: string;
  variables?: string[];
}) {
  const t: MessageTemplate = {
    id: marketingStore.nextId++,
    name: input.name,
    channel: input.channel,
    subject: input.subject ?? null,
    body: input.body,
    variables: input.variables ? JSON.stringify(input.variables) : null,
    createdAt: new Date(),
  };
  marketingStore.messageTemplates.push(t);
  return t;
}

export async function updateMessageTemplate(
  id: number,
  input: Partial<{
    name: string;
    subject: string;
    body: string;
    variables: string[];
  }>
) {
  const t = marketingStore.messageTemplates.find(item => item.id === id);
  if (!t) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found." });
  if (input.name !== undefined) t.name = input.name;
  if (input.subject !== undefined) t.subject = input.subject;
  if (input.body !== undefined) t.body = input.body;
  if (input.variables !== undefined) t.variables = JSON.stringify(input.variables);
  return t;
}

export async function deleteMessageTemplate(id: number) {
  const idx = marketingStore.messageTemplates.findIndex(item => item.id === id);
  if (idx === -1) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found." });
  marketingStore.messageTemplates.splice(idx, 1);
  return { success: true };
}
