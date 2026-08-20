# Learning Compass — Frontend Handover

## Scope completed

| Area | Implemented visual change | Preserved behaviour |
|---|---|---|
| Shared public experience | New compass masthead, brand seal, navigation, footer, responsive containers and semantic design tokens. | Existing routes, SEO metadata, contact links, skip link and required CTA labels **Enroll Now** / **Learn More**. |
| Public routes | Rebuilt Home, Programmes, Programme Detail, About, News, Contact, Enrolment and 404 around route markers, finder controls, paper-grid surfaces and consistent cards/forms. | tRPC data queries, empty/loading/error states, programme search/filtering, map, links and validated enquiry/enrolment submissions. |
| Learning Hub | Rebuilt as a task-focused six-area workspace with semantic tab navigation and focused support forms. | Today, schedule, materials, teacher, payments and reports routes; learning item queries and support request creation. |
| Founder access and workspace | New password-only sign-in, responsive rail/mobile navigation, Learning Compass command headers, cards, tables, forms and state surfaces. | Founder-only auth, routes, resize/collapse/logout, content and learning-data CRUD, status updates and publication workflows. |

## Change record

The interface no longer uses Language Atelier as its primary visual grammar. **Learning Compass** establishes one reusable system: Ivory canvases, Ink information hierarchy, Apricot route markers, Sage guidance states, paper-grid work surfaces, and a restricted two-font scale. Shared CSS classes (`compass-*`, `founder-workspace`) now support headers, cards, forms, navigation, empty states and feedback consistently across public, learning and Founder contexts.

## Quality checklist

| Check | Result |
|---|---|
| TypeScript | Passed with `pnpm check`. |
| Server tests | **24** tests across **10** files passed with `pnpm test`. |
| Keyboard QA | **7 of 7** scenarios passed: skip link, public navigation, programme filters, learning-area navigation, form validation and protected-route redirects. |
| Founder CRUD QA | Password sign-in plus create/update/delete, query error and mutation error states passed for both operations and learning-data routes. |
| Responsive evidence | Desktop and mobile captures were collected for public routes and Founder overview, operations, learning data and announcement editor. |
| Test content integrity | Temporary QA learning items were removed; final query by QA title prefixes returned no rows. |

Tablet captures at `768×1024` additionally confirmed the public home, programme finder, Learning Hub, contact and enrolment paths, as well as Founder overview, retain readable hierarchy and accessible control spacing. The full final component-pair contrast audit is recorded in `learning-compass-contrast-verification.md`.

## External follow-up

The only remaining checks require people rather than automation: the Founder should enter authentic centre content and validate their day-to-day content workflow; moderated usability sessions should be conducted with intended learners or guardians. The platform intentionally does not add fictional programmes, team members, testimonials, schedules or payment data.
