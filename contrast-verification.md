# Language Atelier Contrast Verification

The revised UI uses the retained Bilingual Idol colours in new compositional roles. The checks below were calculated from the hexadecimal colour pairs used for primary text, navigation, buttons, and Founder surfaces. All listed pairs meet the **WCAG AA 4.5:1 threshold for normal-size text**.

| Pair | Foreground | Background | Contrast ratio | Result |
|---|---:|---:|---:|---|
| Ink on Ivory | `#10253E` | `#FBF8F2` | 14.61:1 | AA normal and large text. |
| White on Ink | `#FFFFFF` | `#10253E` | 15.48:1 | AA normal and large text. |
| Ink on Apricot | `#10253E` | `#EF795B` | 5.57:1 | AA normal and large text. |
| Ink on Sage | `#10253E` | `#E7F0EB` | 13.32:1 | AA normal and large text. |
| Ink on Sand | `#10253E` | `#F4EDDD` | 13.28:1 | AA normal and large text. |
| Dark Sage on Ivory | `#397563` | `#FBF8F2` | 5.08:1 | AA normal and large text. |
| White on Dark Sage | `#FFFFFF` | `#397563` | 5.39:1 | AA normal and large text. |

Accent apricot, sage, and sand surfaces always pair with Ink or another checked dark foreground when carrying body-sized text. The implementation also preserves visible focus states and motion-reduction behaviour from the existing accessibility baseline.
