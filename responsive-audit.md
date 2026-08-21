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
