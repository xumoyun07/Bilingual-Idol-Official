# Learning Compass Contrast Verification

The final Learning Compass audit was calculated with `scripts/contrast-check.mjs` against the component combinations used in public, learning and Founder workspaces. All listed pairs meet **WCAG AA for normal text** (minimum ratio `4.5:1`).

| Component combination | Foreground | Background | Ratio | AA normal text |
|---|---:|---:|---:|---|
| Primary copy and headings | Ink `#10253E` | Ivory `#FBF8F2` | 14.61:1 | Pass |
| Ink workspace / primary action | White `#FFFFFF` | Ink `#10253E` | 15.48:1 | Pass |
| Apricot route marker / CTA context | Ink `#10253E` | Apricot `#EF795B` | 5.57:1 | Pass |
| Guidance panel | Ink `#10253E` | Sage `#E7F0EB` | 13.32:1 | Pass |
| Support panel | Ink `#10253E` | Sand `#F4EDDD` | 13.28:1 | Pass |
| Secondary guidance link and labels | Sage Dark `#397563` | Ivory `#FBF8F2` | 5.08:1 | Pass |
| Secondary solid action | White `#FFFFFF` | Sage Dark `#397563` | 5.39:1 | Pass |

Status components are additionally paired with `role="status"` and `role="alert"`; colour is never the sole indicator of success or error. Focus styling uses an explicit visible outline. Motion respects `prefers-reduced-motion` in the shared stylesheet.
