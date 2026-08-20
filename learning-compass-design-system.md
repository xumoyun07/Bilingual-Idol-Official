# Learning Compass — Design System

## Direction

**Learning Compass** reframes the platform as a clear, dependable educational environment. The visual language combines calm paper surfaces with structured navigation, distinctive route markers, and restrained Apricot emphasis. It replaces the previous page-by-page editorial collage with a scalable product system, while retaining the Bilingual Idol brand palette and all existing user journeys.

## Brand tokens

| Token | Value | Interface role |
|---|---:|---|
| Ink | `#10253E` | Primary text, navigation, high-emphasis actions and focused workspaces. |
| Ivory | `#FBF8F2` | Default canvas and calm content backgrounds. |
| Apricot | `#EF795B` | Primary accent, markers, active states and selective emphasis. |
| Sage | `#E7F0EB` | Guidance surfaces and secondary success context. |
| Sage Dark | `#397563` | Accessible secondary action text and success messaging. |
| Sand | `#F4EDDD` | Warm support surfaces and information groups. |
| Error | `#A34732` | Validation and destructive-action feedback. |

## Typography and layout

The system uses exactly two families: **Manrope** for functional interfaces and **DM Serif Display** for high-level editorial emphasis. Page headings use a compact display scale; controls, labels, tables and actions remain in Manrope for reliable scanning. The spacing scale is based on `4px`, with common intervals of `8`, `12`, `16`, `24`, `32`, `48` and `64px`. Content is centred in a maximum `1200px` shell with responsive padding.

## Components and states

| Component | Rule |
|---|---|
| Primary action | Ink background, white text, concise verb-first label, Apricot marker on hover. |
| Secondary action | Ivory/white surface, Ink outline, no decorative shadow. |
| Surface/card | White or tonal surface, `12–16px` radius, single low-elevation border/shadow treatment. |
| Form field | Visible label, quiet background, 2px focus ring, inline help/error placement. |
| Navigation | One active treatment per context: route marker for public navigation, filled rail item for Founder tools. |
| Empty state | Clear explanation, data-integrity statement where relevant, and one contextual next action. |
| Status feedback | `role="status"` for success, `role="alert"` for errors; never colour-only. |

## Motion

Motion uses the shared `--ease-out` curve and remains within `150–280ms` for controls and `220–360ms` for route/surface entrances. Only opacity and transform animate for nonessential movement. All nonessential animation is disabled by `prefers-reduced-motion`.

## Information architecture

No route, data model, login rule or functional section is renamed or removed. The public site uses a consistent masthead, page marker and support footer. Learning Hub groups its six actions in a task-focused workspace. Founder tools use one command layout with stable navigation, dense operational content, and persistent feedback areas.
