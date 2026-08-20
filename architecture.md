# Bilingual Idol Platform Architecture

## Product Structure

The first release is a public-facing website supported by a compact, protected content and lead-management area. The public experience is designed for prospective students and parents, while the administrative experience is designed for authenticated centre staff. The site structure uses focused conversion pathways rather than a single long, undifferentiated course page.

| Area | Routes | Primary audience | Purpose |
|---|---|---|---|
| Discover | `/`, `/about`, `/programs`, `/programs/:slug` | Parents and prospective students | Explain the centre, build trust, and help visitors identify an appropriate programme. |
| Convert | `/enroll`, `/contact` | Parents and prospective students | Capture validated enrollment and inquiry details, then provide a clear next action. |
| Stay informed | `/news` | All visitors | Publish announcements, events, and holiday notices from staff-managed records. |
| Manage | `/admin`, `/admin/submissions`, `/admin/announcements` | Authenticated administrators | Review leads, update lead status, and manage announcements. |

## Visual Direction

The visual direction is **academic prestige with human warmth**. It combines a deep ink-blue foundation with warm ivory surfaces, apricot highlights, restrained sage accents, and a precise serif/sans-serif pairing. The visual system avoids school-template clichés and uses asymmetric layouts, editorial typography, considered whitespace, subtle grid textures, soft shadows, and high-contrast interface controls.

| Token | Value | Intended use |
|---|---|---|
| Ink | `#10253E` | Headings, navigation, high-emphasis text, hero foundation. |
| Ivory | `#FBF8F2` | Main background and calm reading surfaces. |
| Apricot | `#F07E5D` | Primary actions, key highlights, warm emphasis. |
| Sage | `#5E8C7B` | Secondary highlights, utility tags, and calm status accents. |
| Sand | `#E8DCC9` | Borders, tonal panels, and layered texture. |

The site uses `DM Serif Display` for editorial headings and `Manrope` for interface and body text. Motion is limited to composited opacity and transform transitions, employs a reduced-motion fallback, and keeps interaction feedback compact and readable.

## Bilingual Identity

The interface reinforces a bilingual identity through short English and Bahasa Melayu pairings in high-value moments rather than pretending to be a fully translated product before localized content is supplied. The hero is anchored by a bilingual statement, programme cards use language/level labels, and navigation microcopy recognizes both family decision-makers and independent learners.

## Data Model

| Entity | Purpose | Core fields |
|---|---|---|
| `programs` | Extensible source for programme pages and catalogue filters. | `slug`, `title`, `language`, `category`, `ageGroup`, `level`, `duration`, `schedule`, `fees`, `description`, `isActive`. |
| `submissions` | Captures enrollment and general inquiry flows. | `type`, student and parent details, `programId`, `preferredSchedule`, `message`, `source`, `status`, `createdAt`. |
| `announcements` | Supports news, events, and holiday notices. | `slug`, `title`, `excerpt`, `body`, `category`, `isPublished`, `publishedAt`. |
| `testimonials` | Holds only genuine, approved reviews for future display. | `quote`, `authorName`, `relation`, `rating`, `approved`, `consentConfirmed`. |

No testimonial records will be pre-populated. The public-facing testimonials area should render only approved genuine records, with a graceful, non-deceptive empty state when none have been provided.

## Access Control

Public routes use public server procedures. Submission creation is public and validated with Zod. Read and mutation operations for submissions and announcements use administrative procedures, which require a signed-in user with the `admin` role. The platform owner is automatically assigned this role by the starter’s existing authentication workflow; staff can be promoted through the administrative database workflow.

## Accessibility and SEO Baseline

Semantic landmarks, descriptive headings, visible keyboard focus indicators, labelled controls, validation messages connected through `aria-describedby`, sufficient color contrast, reduced-motion support, meaningful button labels, and responsive spacing are treated as baseline requirements. The document head will include a meaningful title, description, language, theme color, and social preview metadata. Course and content pages will be implemented as distinct routes with descriptive headings and canonical page intent.
