# Accessibility and Interaction Review

## Scope

This review documents the implementation-level checks completed for the public routes, enrollment flow, and Founder console. It is not a legal certification of WCAG conformance; final compliance also requires real content, assistive-technology testing, and review of production integrations.

| Check | Result | Evidence |
|---|---|---|
| Semantic structure | Implemented | Public layout uses skip navigation, header, nav, main, footer, sections, headings, forms, tables, and address semantics. |
| Keyboard focus | Implemented | A consistent `:focus-visible` ring is defined globally for links, buttons, inputs, selects, and textareas. |
| Form feedback | Implemented | Client Zod validation and server validation provide required-field checks, alert semantics, and connected error descriptions. |
| Motion preferences | Implemented | Reduced-motion media query disables nonessential transitions and animations. |
| Responsive behaviour | Visually checked | Desktop and mobile captures were reviewed for the home, programmes, about, news, contact, and enrollment routes. |
| Founder authorization | Tested | Automated tests confirm ordinary users are rejected and Founder users are accepted by Founder-only procedures. |
| Founder announcement lifecycle | Tested | Automated tests cover Founder create, edit, publish/unpublish, and delete procedures, plus non-Founder denial before any mutation runs. |
| Contrast and content review | Pending production content | Founder should verify all supplied copy, images, embedded map output, and eventual photographs against contrast and alternative-text expectations before publication. |

## Primary Journey Checks

The public journey supports navigation from the bilingual hero to programme discovery, inquiry, and enrollment. Forms validate learner and guardian data locally before sending data to the server, and the protected Founder console can manage submissions, announcements, operating hours, programmes, profiles, and consented reviews. Final acceptance testing should be performed by the Founder after entering authentic content and signing in with the intended account.
