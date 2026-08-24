# Minimal Blue Public Theme — QA Report

## Delivered Public Theme

The public website has been revised into a restrained **royal-blue, ink, mist and white** system derived from the visible blue brand treatment on the official Bilingual Idol website. The shared public header, navigation, Hero, programme guide, enquiry paths, public forms, contact route, footer and responsive states now use the same visual rules. Dashboard components and protected workspace styling were intentionally not changed.

| Area | Implemented result |
|---|---|
| Brand treatment | Royal blue (`#173FAD`) is reserved for primary actions, navigation state, links and focus; deep ink carries headings and footer contrast. |
| Layout | A 76rem maximum content width, measured section spacing, clear dividers and modest 1rem radii replace an unstyled or decorative appearance. |
| Typography | Compact, high-contrast display headings and 1.6–1.7 body line-height support quick reading. |
| Interaction | Primary controls have 48px minimum height, visible focus outlines, concise hover feedback and reduced-motion support. |
| Responsive system | Full-bleed mist sections preserve safe gutters; navigation changes to an accessible menu on smaller viewports. |

## Confirmed Content Incorporated

The public Programme route now presents published 2026 guidance for General English, IELTS Preparation, Summer Camp, Private English Lessons and Executive English. It explicitly asks visitors to verify live availability, visa requirements, total fees and intake before enrolment. Home adds the confirmed language portfolio: English, Bahasa Melayu, Mandarin, Arabic, Japanese and Korean. About reflects the supplied profile’s stated learning approach—consultation, placement guidance, interactive classrooms and digital resources—without publishing conflicting contacts or unverified testimonials.

| Source | Incorporated public information | Deliberately excluded |
|---|---|---|
| Official website | Brand-blue reference, public contact route, Setapak location, language portfolio. | Repeated testimonials and unverified performance claims. |
| `BILC_PRICE_LIST.pdf` | Named course packages, durations and stated 2026 fee ranges. | Checkout or availability guarantee. |
| `CopyofCompanyprofile.pdf` | Learning principles, interactive classrooms, digital resources, placement guidance. | Conflicting Pavilion Embassy contact records and testimonials. |

## QA Evidence

Visual reviews covered desktop Home, Programmes, About and Contact pages as well as mobile Home, Programmes, About, Contact and Enquiry routes at 390px. The Home Hero preserves readable white copy over the supplied classroom photo, the new programme guide cards wrap without clipping and the enquiry form maintains vertical spacing and accessible controls at mobile size.

| Check | Result |
|---|---|
| Full automated regression | Passed: 16 Vitest files / 60 tests. |
| TypeScript | Passed: `pnpm check`. |
| Whitespace integrity | Passed: `git diff --check`. |
| Browser scenario suite | Passed: 23 checks across 1440px, 768px and 390px public routes, programme discovery and mobile navigation. |
| Visual desktop review | Passed: Home, Programmes, About and Contact at 1280px. |
| Visual mobile review | Passed: Home, Programmes, About, Contact and Enquiry at 390px. |
| Fresh runtime diagnostics | Passed: no fresh browser-console or development-server error signatures. |

> **Content governance:** Public wording never exposes private workspace roles or operations. Conflicting contact data remain documented in `brand-content-source-notes.md` until an owner confirms a single source of truth.
