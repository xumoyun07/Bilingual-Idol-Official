# Responsive Audit and Breakpoint Map

## Target matrix

| Device band | Target viewports | Layout intent |
|---|---:|---|
| Compact mobile | `360×640`, `390×844`, `412×915` | Single-column content, 48px touch targets, stacked forms, burger navigation and no fixed desktop rail. |
| Tablet | `768×1024`, `1024×1366` | Wider content shell, two-column cards/forms where space permits, mobile navigation retained until the desktop information density is safe. |
| Desktop | `1366×768`, `1920×1080` | Full grid layouts, public desktop navigation, fixed Founder rail and workspace header. |
| Wide | `2560×1440`, `3840×2160` | Centred max-width shells, fluid type capped at readable limits, no overly stretched content blocks. |

## Initial audit findings

Mobile `360×640` and tablet `768×1024` captures covered public landing, programmes, programme fallback, about, contact, enrollment, universal sign-in and access-protected dashboard routes. The reviewed public layouts retain readable type, compact navigation and stacked/flowing grids without observed horizontal clipping. The universal sign-in form remains usable at both sizes.

The audit found that shared interactive controls used a `2.9rem` minimum height, below the requested 48px touch target, and that only component-local overflow protections were present. The corrective rules below establish global horizontal containment, responsive media sizing and a shared 48px control baseline. Dashboard capture at one tablet run was interrupted by the protected-route state; protected route behaviour remains covered by keyboard QA and will be re-captured through the authenticated Founder visual scenario.

## Browser and device boundary

The sandbox uses Chromium for automated visual and keyboard checks. Firefox, Safari, Yandex Browser, physical-device touch gestures and 3G field-network LCP require a later cross-browser/device pass outside this environment. The layout code uses standards-based Grid, Flexbox, `svh/dvh`, logical sizing and media queries for this follow-up.

## Surface-level responsive rules

| Surface | Responsive and accessibility rule | QA evidence |
|---|---|---|
| Public routes and universal login | The public shell begins at 360px; the header switches between burger and desktop navigation at `lg`, forms and cards stack naturally, media cannot exceed the viewport, and primary CTAs are at least 48px high. | `responsive-layout-qa.mjs`: 56 checks, 0 failures; portrait-to-landscape public resize: 7 checks, 0 failures. |
| Personal dashboard | The private empty-state card keeps a bounded readable measure; its header uses two 48px controls and preserves the member dashboard in one column at compact mobile widths. | `non-founder-e2e-qa.mjs`: real temporary user, 8 dashboard viewports, 0 overflow and 0 undersized measured controls; cleanup confirmed. |
| Founder overview, submissions, announcements, editor and content | The fixed rail and workspace header remain at top 0px when applicable, while content grids and forms collapse without horizontal overflow. Every visible button and link within `.founder-command` has a 48px minimum height. | `founder-responsive-layout-qa.mjs`: 5 routes × 8 viewports = 40 checks, 0 failures and 0 undersized button/link controls. |
| Dialog and modal behaviour | No dialog, sheet or drawer is currently mounted by a production public, personal-dashboard or Founder route. The project contains reusable dialog primitives and an isolated component showcase only; no production dialog surface is therefore available to exercise. Any future mounted dialog must use a viewport-bounded content width, scrollable body, focus trap, escape action and 48px primary/secondary action controls before release. | Source review confirms no production imports of `ManusDialog`; no route-level dialog QA is applicable at this point. |

## Orientation coverage

Public routes have an automated 360×640 → 640×360 same-session resize check. The protected route matrix covers portrait and landscape target dimensions independently. A dedicated protected portrait-to-landscape resize pass is maintained as the remaining responsive evidence item before production acceptance.
