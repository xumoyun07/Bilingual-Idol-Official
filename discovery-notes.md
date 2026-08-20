# Discovery Notes

## Current Website Findings

The existing Bilingual Idol website positions the centre as a language school in Malaysia with a broad course catalogue and lead-generation focus. The current navigation includes Home, About Us, Programmes, Short Courses, Contact Us, and Apply Now. The homepage highlights the centre history since 2008, Ministry of Education Malaysia licensing, multiple language offerings, testimonial content, consultation capture, and contact details.

The visible programme set currently includes General English, Bahasa Melayu, Mandarin, Arabic, Japanese, and Korean. The homepage also surfaces learning formats such as Kid’s Class, Group Classes, Private 1-on-1 Class, and Corporate Language Training. Contact information visible on the current site includes `info@bilingualidol.edu.my`, `+603 6731 0449`, and the Setapak, Kuala Lumpur location.

The dedicated contact page confirms the office address as E-03-10, StarParc Point, Jalan Genting Kelang, Taman Danau Kota, 53300, Setapak, Kuala Lumpur. It also confirms the phone number and email address above. No operating hours are published on the current page, so the new site must not invent them; its contact section should state that visit times are confirmed by the centre or leave operating-hours values ready for staff configuration.

External search results indicate that some newer social and directory references may use a different Pavilion Embassy / Jalan Ampang location and alternate contact details. The supplied current website remains the working source for the Phase 1 implementation, but the centre should confirm its active address, phone, and operating hours before publishing the production site.

## PDF Requirement Findings

The uploaded brief describes the future site as more than an informational website and frames it as the foundation of a broader digital platform for the school. The stated objectives include attracting leads through SEO and social media, converting visitors into consultations and applications, eventually supporting online payment, giving students a personal dashboard, enabling teacher and administrator workflows, supporting internal content updates without coding, tracking lead sources, and preserving future scalability.

The homepage is expected to answer what the centre offers, who it is for, why it is credible, and how registration works. The PDF also emphasizes prominent conversion actions such as applying, contacting via WhatsApp, and booking a placement test. For courses, the brief requests structured categorization, with each course eventually having its own dedicated detail page including description, audience, level, duration, schedule, outcomes, structure, fees, intake, media, FAQ, and calls to apply or book a placement test.

Additional future-oriented modules in the PDF include an online placement test, a booking system for consultations and tours, a student application portal with document upload and tracking, and an international students page. The brief also requests role-based access, including Super Admin, Admin, Marketing, Teacher, and Student roles, plus secure document handling.

The next pages of the PDF extend this roadmap further with a dedicated kids and nursery section, a promotions management page, online payment capabilities, teacher/staff profile pages, a more formal reviews and success-stories area, a media-rich gallery, events and activities listings, an English-learning blog, an AI chatbot, WhatsApp entry points tailored to different intents, lead-management workflow states, and marketing-source tracking.

The final pages of the PDF add requirements for marketing analytics, student dashboards, deeper admin capabilities, automated notifications, multi-language content management, SEO-driven course landing pages, a more detailed contact page, and a guided course-matching experience. The analytics expectations specifically mention Google Analytics, Google Search Console, Meta Pixel, TikTok Pixel, conversion tracking, and UTM-style attribution.

## Reconciliation With Current Scope

For the current implementation request, the agreed core scope covers a refined public website, bilingual storytelling, programme presentation, validated inquiry/enrollment forms, announcements, contact details, protected administration, responsive experience, SEO, and accessibility. The PDF includes larger roadmap items such as payments, student portals, placement testing, advanced staff roles, document storage, and teacher operations; these should be accounted for in the data model and information architecture so the platform can expand without major rework.

This means the initial release should be designed as a credible Phase 1 platform with extensible data structures. In particular, submissions should be stored in a way that can later support CRM-style status tracking and attribution sources, announcements should be authored as manageable records, and page architecture should leave room for future expansions such as promotions, events, blog content, and international student journeys.

The role model should also be planned for later expansion beyond the default `admin` and `user` roles provided in the starter, even if the first release only needs protected administrative access. Likewise, multilingual architecture should avoid separate duplicated websites and instead support structured content that can later be localized from an administrative workflow.

## Compliance and Content Notes

The user requested a testimonials section with star ratings. This can only display authentic approved reviews supplied by the school or entered later by administrators; no testimonials or ratings may be fabricated as placeholder content. Until real data is available, the UI should be built to support testimonial publishing without inventing reviews.

The bilingual identity should be reflected visually and structurally through content presentation, page labels where appropriate, and messaging that addresses both parents and students. The exact call-to-action labels required by the user are `Enroll Now` and `Learn More`, and these must be preserved exactly in the hero section.

## Phase 1 Delivery Direction

For this first production-oriented release, the recommended scope is to deliver a premium public-facing bilingual website, validated lead capture, announcements, a protected admin dashboard for submissions and announcements, a trustworthy contact experience, and an extensible CMS-like foundation. Items such as payments, automated notifications, student dashboards, document storage, and advanced CRM workflows should be treated as planned next-stage capabilities rather than improvised partial features.
