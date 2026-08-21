# Learning Hub Removal and Universal Access

## Completed application changes

| Area | Current state |
|---|---|
| Public routes and navigation | The `/learning` route is removed, the public navigation contains no Learning Hub link, and the homepage orientation CTA leads to programme discovery. Requests to the retired URL resolve to the accessible 404 state. |
| Founder console | The Learning Data and Learning Operations routes and sidebar items are removed. The remaining Founder console continues to manage confirmed public content and centre operations. |
| Server API | Learning-item and learning-support tRPC procedures are removed. No active application code can retrieve, create, update, or publish Learning Hub data. |
| Legacy data | `learningItems` and `learningSupportRequests` remain in the database as **schema-preserved archive-only tables**, in accordance with the user’s selected safe option. They are retained solely to prevent a future migration from deleting them; no application types, helpers, UI, routes, API contracts, or feature migrations use them. |

## Universal access

The public **Вход** control now opens `/login`, a shared e-mail/password entry page for every account. There is still no public registration: accounts are centrally provisioned by the centre.

| Role | Redirect after sign-in | Interface |
|---|---|---|
| `user`, `student`, `teacher`, `marketing` | `/dashboard` | Private account home with an honest no-account-data state. |
| `admin`, `super_admin`, `founder` | `/admin` | Protected operational console. |

The server accepts the existing Founder password only through its configured secret hash. Other provisioned accounts require a separate per-user scrypt hash and active account status. Plaintext passwords are never stored. A user cannot open Founder routes, and an operational role is redirected away from the ordinary user dashboard.

## Verification

The updated keyboard QA checks eight current scenarios, including the retired `/learning` route, universal e-mail/password controls, and protected redirects. The full test suite passes with 23 tests; TypeScript is clean. Founder sign-in through the new shared entry path was verified end-to-end. Desktop and mobile screenshots confirm the universal login page and the mobile public navigation without Learning Hub.
