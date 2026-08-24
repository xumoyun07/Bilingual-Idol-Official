# Frontend redesign brief

## Purpose

The redesign evolves the platform from a primarily editorial, text-led surface into a **clear, media-led language-learning experience**. It retains the established warm ivory, navy, apricot and sage identity while creating stronger visual anchors, simpler primary actions and consistent responsive behaviour across public pages and authenticated workspaces.

## UI audit findings

| Surface | Current strength | Redesign focus |
|---|---|---|
| Public header | Clear destination links and a responsive menu | Reduce visual density, expose one primary action, and use a more tactile mobile trigger. |
| Home page | Strong hierarchy and structured content | Add an original media-led hero, simplify the first decision, and make pathways more scannable. |
| Forms | Semantic labels and validation | Use a calmer field rhythm, obvious required affordances and a single focused submit action. |
| Programme cards | Reusable data-driven presentation | Give card groups more visual pacing and consistent hover/focus feedback. |
| Dashboard shell | Fixed navigation and role-aware routes | Preserve persistent navigation while applying the same interaction, spacing and colour logic. |

## Design system direction

The public experience uses **editorial learning atlas** styling: warm paper backgrounds, navy ink, apricot action cues and sage supporting signals. Typography retains a high-contrast display face for titles and a highly legible sans-serif for information and controls. New imagery is original, text-free and positioned with clear overlay safe areas so it supports, rather than competes with, comprehension.

All buttons keep a minimum 48px target, keyboard focus remains visible, and non-essential motion is limited to transform and opacity under 300ms. Mobile navigation remains a full-height opaque drawer; desktop navigation remains stable and visible. Every visual media asset is loaded from project storage, uses lazy loading below the fold and carries an informative or empty alt text according to its purpose.

## Media plan

| Asset | Placement | Purpose | Treatment |
|---|---|---|---|
| Original collaborative classroom hero | Home hero | Establish human, multicultural learning context | Wide image with a left-side headline-safe area and a navy gradient overlay. |
| Original activity vignette | Programme and contact surfaces | Add human warmth without inventing programme facts | Small responsive card/image surface with descriptive alt text. |
| Abstract language-route texture | Shared public surfaces | Visual rhythm with minimal payload | CSS-generated pattern, not a downloaded image. |

## Verification criteria

The delivery must load every storage-backed media URL without console errors, preserve form and navigation flows, show no horizontal overflow at desktop/tablet/mobile widths, maintain visible focus states, and respect `prefers-reduced-motion`. Browser QA will cover public navigation, mobile menu, CTA and form interaction; dashboard QA will cover the fixed navigation shell.
