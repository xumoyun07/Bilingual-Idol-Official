# Bilingual Idol Design System

## Product Character

The product uses two complementary modes. The public experience is a warm, editorial invitation into a multilingual learning studio. The authenticated experience is more compact and operational, helping a learner or Founder immediately see what needs attention. Both modes retain the same Ink, Ivory, Apricot, Sage, and Sand identity system.

## Tokens and Application Rules

| System layer | Rule |
|---|---|
| Colour | Ink forms the structural background and primary action colour. Ivory is the default content surface. Apricot is reserved for human, motivational, or urgent emphasis. Sage communicates progress, support, and success. Sand creates quiet separation. |
| Typography | `DM Serif Display` is used for moment-defining headings and learning milestones. `Manrope` is used for navigation, data, labels, controls, and long reading. |
| Spacing | Base spacing follows a 4px rhythm. Page sections use 48–96px spacing on desktop and 32–56px on mobile. Task groups use 12–20px gaps. |
| Radius and elevation | Public cards use 20–28px rounding and restrained tonal shadows. Operational cards use 14–20px rounding, soft borders, and high information density. |
| Interaction | Button press feedback is 120–160ms. Surface hover is 160–220ms. Route changes use opacity/transform transitions below 300ms. Non-essential animation is disabled for reduced motion. |
| Accessibility | Every state has text, not color alone. Focus rings remain visible, minimum control height is 44px, all error states use linked descriptions, and contrast targets WCAG AA. |

## Component Language

| Component | Purpose | Behaviour |
|---|---|---|
| Path card | Communicates a learner’s next meaningful action. | One action per card, a precise status, optional progress indicator, and a quiet affordance. |
| Session row | Presents date, language, teacher, and material status. | Tappable as a whole; collapses non-critical detail on mobile. |
| Learning tile | Opens practice material or reports a useful empty state. | Uses script/translation motif and a visible material state. |
| Message prompt | Provides a direct teacher conversation entry point. | Provides expected response context; no false message history. |
| Payment panel | Summarizes payment or next required action. | Uses neutral, transparent status when no payment data is available. |
| Report snapshot | Shows progression after a session. | Uses narrative language rather than raw score-only treatment. |

## Reduced-Path UX Map

| Goal | Previous experience | Redesigned path |
|---|---|---|
| View timetable | Programme page or staff contact required. | Learning hub → **Today / timetable** → session detail. |
| Open material | No unified material route. | Learning hub → **Continue learning** → material state. |
| Ask a teacher | No clear communication path. | Learning hub → **Message teacher** → focused conversation entry. |
| Handle payment | No clear user-facing payment checkpoint. | Learning hub → **Payments** → current status or secure action. |
| Read progress | No consolidated report route. | Learning hub → **Progress report** → latest report summary. |
| Founder oversight | Content-first navigation only. | Founder workspace → learner health, sessions, finance, reports, and content operations. |

## Implementation Constraint

The redesign does not invent course times, learners, payments, teacher messages, reports, or testimonials. Until the Founder records verified operational data, learner-facing cards provide purposeful empty or preparation states rather than fictional activity.
