# Frontend redesign QA

## Visual and media validation

The Home page was reviewed at 1440×900 and 390×844. The original storage-backed hero is visible, uses a readable headline-safe gradient, and retains two clear primary choices. The Programmes and Contact page hero surfaces were reviewed at desktop and mobile widths; their matching editorial images load with their intended crop and no horizontal overflow.

| Validation | Result |
|---|---|
| Critical storage-backed hero media | Passed: Home `1920px`, Programmes `1536px`, Contact `1920px` natural width in browser QA. |
| Lazy below-fold media | Marked `loading="lazy"`; validated in static regression contract. |
| Desktop layout | No horizontal overflow at 1440px across Home, Programmes, Contact, Enroll and Login. |
| Mobile layout | No horizontal overflow at 390px across the same public routes. |
| Mobile navigation | The labelled public menu opens and Programmes navigation completes. |
| Primary CTA | The Home learning-enquiry CTA reaches the enrollment flow. |
| Reduced motion | Essential UI functions without animation; decorative floating card is gated by `prefers-reduced-motion: no-preference`. |

## Automated evidence

`scripts/frontend-redesign-qa.mjs` passed 15 checks: ten responsive route-width checks, three critical media checks, the primary CTA and mobile navigation. `server/frontend-redesign.test.ts` covers project-storage media paths, descriptive alternatives, lazy/eager handling, mobile navigation labels, reduced motion, 48px target baseline and the shared dashboard surface. Current dev-server and browser-console tails contain no active error signatures after the redesign.
