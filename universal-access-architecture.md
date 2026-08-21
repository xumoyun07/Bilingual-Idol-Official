# Universal Access Architecture

## Product decision

Learning Hub is removed as a public product area. The platform will retain a **single Sign in** entry point, but the destination will be determined by the authenticated account’s role. There is no public registration: the centre provisions user accounts, assigns a role, and issues credentials through its own operational process.

| Account role | Destination after successful sign-in | Scope |
|---|---|---|
| `user`, `student`, `teacher`, `marketing` | `/dashboard` | Private account home with a clear no-data state until role-specific modules are supplied. |
| `admin`, `super_admin`, `founder` | `/admin` | Existing protected operational console. Founder continues to have the highest authority. |

## Authentication contract

The existing Founder password remains stored only as the configured scrypt environment hash. Centrally provisioned non-Founder accounts will use a **per-user scrypt password hash** in the user record; plaintext passwords are never stored. The universal server procedure accepts e-mail and password, verifies the appropriate credential source, issues the existing secure session cookie, and returns the role-determined dashboard path.

## Scope removed with Learning Hub

The public `/learning` route, primary navigation link, homepage learning CTA, and Founder routes that operate only Learning Hub data (`/admin/operations`, `/admin/learning-data`) are removed. Learning-item and support-request procedures are retired from the application surface. The two legacy tables remain **schema-preserved only** so that routine Drizzle feature work cannot accidentally drop them; they are excluded from application types, helpers, UI, routes, tRPC procedures, and feature migrations. A regression test enforces that active application boundaries continue to omit those contracts.

## Initial ordinary-user dashboard

The first `/dashboard` is an honest private account home. It provides identity, role label, sign-out, and a clear notice that account-specific resources will appear when the centre enables them. It does not reproduce Learning Hub, fabricate schedules/materials/payments, or expose Founder operations.
