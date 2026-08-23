# Founder Console Architecture

## Purpose and scope

The private control console is reduced to two protected modules: **Dashboard** and **Users**. Its authority and modules are not exposed in public navigation, universal sign-in copy, non-Founder dashboard copy, user directories or non-Founder API error responses. Legacy management screens for submissions, announcements, content and announcement editing are removed from protected navigation and application routes.

## Role governance

| Role | Platform meaning | Users module authority |
|---|---|---|
| `founder` | Internal private control authority | Full access. This role and its records are excluded from all user-visible directories and detail responses. |
| `super_admin` | Senior operational authority | Uses a separate dashboard and may manage only student, teacher, marketing and admin accounts. Peer Super admin records are not listed, created, read, updated or deleted. |
| `admin` | Administrative operator | May be issued and managed by Founder only. |
| `marketing` | Communications and marketing operator | May be issued and managed by Founder only. |
| `teacher` | Educator account | May be issued and managed by Founder only. |
| `student` | Learner account | May be issued and managed by Founder only. |

The former generic `user` role is migrated to `student` for issued platform accounts. The enum retains `user` only as an internal compatibility value for framework-generated service/session identities; it is never selectable from the private control interface. The internal `founder` value is intentionally not selectable, listed, returned by user detail, or discoverable through a role filter.

## Users module contract

The module is guarded server-side by `founderProcedure`; no other role can list or mutate platform accounts. It provides the following operations:

| Operation | Input and safeguards | Result |
|---|---|---|
| List and search | Query text, role, activity state, date-from/date-to, pagination | A bounded, newest-first account list plus a total count. Search covers name, e-mail, account identifier and login method. |
| Detail | Numeric account id | One account record for a selected row. |
| Create | Name, e-mail, initial password, permitted role, active state | Password is stored as a salted scrypt hash; a generated non-guessable account identifier is used. Duplicate e-mail is rejected. |
| Update | Editable account id and safe profile fields; optional password rotation | Founder records cannot be targeted. Duplicate e-mail is rejected. |
| Delete | Explicit account id and confirmation on the client | Founder records cannot be targeted. Current schema has no foreign keys from other active application tables to `users`, so removal does not cascade or destroy centre-content records. |

The deletion confirmation is a client safety barrier; the server separately enforces the role and target restrictions. Deactivation blocks future password sign-ins, while retained account details remain available to the Founder until deletion is explicitly confirmed.

## Dynamic Field Builder contract

The **Configure create form** control in the Users module opens a private configuration dialog for every field used by the account-creation form. The runtime **New user** modal reads the active schema and renders the configured fields directly from that metadata, so the form can change without a frontend deployment or code change.

| Contract element | Storage and behaviour | Safety boundary |
|---|---|---|
| Groups | `userFormSections` stores title, icon, sort order and active state. A group organises fields visually; it does not own user values. | Removing a group leaves its fields ungrouped. No field definition or value is deleted by that action. |
| Fields | `userFormFields` stores a generated stable key, visible label, supported type, required flag, order, placeholder, dropdown options, optional group, and active state. | Only six configurable types are accepted: `text`, `textarea`, `number`, `date`, `dropdown`, and `checkbox`. |
| Values | `userProfileValues` stores the EAV tuple `{ userId, fieldId, value }` with one value per user/field pair. | Values are never accepted as arbitrary columns. The server maps only submitted active field keys to known field IDs after validation. |
| Account-backed fields | `siteSettings.user_create_system_fields_v1` persists the label, required flag, visibility, display order and optional group assignment for name, e-mail, role, password and account status. | Each is presented as an ordinary field: it can be renamed, made optional, hidden from the form and restored. A hidden database-required value is generated internally. |

The `users.formSchema`, `updateSystemFields`, `createSection`, `updateSection`, `removeSection`, `createField`, `updateField`, `removeField` and `reorderFields` procedures are all guarded by the private-role procedure. The standard `users.create` procedure accepts optional account-backed inputs plus an optional EAV values map. It validates active required fields on the server, then writes the account and approved EAV rows in one database transaction. A failed validation creates neither an account nor partial profile rows.

| Field type | Server validation rule |
|---|---|
| `text` / `textarea` | Trimmed string within the configured request limits. |
| `number` | Finite numeric representation. |
| `date` | ISO calendar-date value that parses to a real date. |
| `dropdown` | A configured, normalized option only. |
| `checkbox` | Literal `true` or `false`. |

Required visible fields are enforced server-side even if a browser is modified. Unknown, inactive or deleted keys are rejected. Empty optional values are omitted rather than stored. Field labels are converted to collision-resistant stable keys when metadata is created; labels may later change without losing the field identity used by stored values.

The existing configurable-field list is orderable. A Founder can drag a row by its visible grip to move it; the client submits the complete ordered list of field IDs to `reorderFields`. The server rejects an incomplete list, an unknown ID or a duplicate ID, then updates all `sortOrder` values in a single transaction. The same list exposes 48px **move up** and **move down** controls as a keyboard and touch fallback. The runtime create form refreshes its schema when opened, so it renders the persisted order rather than a stale client cache.

### Lifecycle, migration and compatibility policy

Migration `0008_eager_doctor_octopus.sql` adds only the three Field Builder tables. It does not rewrite the existing `users` table, so existing accounts remain valid with no stored values for newly configured fields. Adding a group or field is backwards compatible because missing optional EAV rows are represented as empty values; a new field can be marked required only for future create-form submissions.

Deleting an EAV field deletes its associated values as part of the managed data lifecycle. Hiding an account-backed field removes it from the create form rather than deleting a database column. The server generates an internal e-mail, password hash, name or default role/status when a hidden field is required to form a valid account record; an account issued without a supplied e-mail and password is created inactive. Deleting a user deletes that user’s EAV values in the same transaction. The initial interface intentionally configures this capability only for the **create** form.

> The Field Builder controls field labels, visibility, required status and user-created group assignment. It does not expose raw password hashes or alter database-column types that maintain account integrity.

## Users navigation and modal interaction contract

The Users page is divided into five local role modules: **Students**, **Teachers**, **Marketing**, **Admins** and **Super admins**. Selecting a module fixes the directory to that account type and resets its independent query, activity-state and registration-date filters. Private control records are excluded server-side from list, role-filter and detail responses.

Account actions are deliberately contained in modal windows. The **New user** control opens a validated creation modal, a directory row opens a detail/edit modal, and deletion requires a separate confirmation modal. This keeps list navigation stable while preserving keyboard escape, focus containment and an explicit destructive-action boundary.

## Super admin workspace contract

Super admin accounts receive a separate fixed-sidebar workspace at `/super-admin` and `/super-admin/users`. Universal sign-in routes that role to this workspace; an attempt to visit a private control route returns the account to `/super-admin`. Conversely, the Super admin shell redirects any other role to its own permitted route.

| Capability | Super admin behaviour |
|---|---|
| Dashboard | A dedicated operations dashboard with no invented metrics and a clear entry point to Users. |
| Users directory | Shows only Students, Teachers, Marketing and Admins. The Super admins category is absent from the UI and excluded in database queries. |
| Account lifecycle | Can create, view, edit, pause and delete only the four allowed role types. The server independently validates every role and target before mutation. |
| Create form | Renders the active runtime user form for account issuance, but has no **Configure create form** action or Field Builder procedures. |
| Peer and private roles | `super_admin` and the private control role are absent from list/detail responses, cannot be selected in the create or edit UI, and are rejected by the scoped API. |

> The Super admin restriction is enforced in both the interface and the `superAdminUsers` server contract. Hiding a tab is never the authorization control.

## Dashboard widget contract

The Dashboard contains no invented analytics or placeholder measurements. It declares three composable widget zones:

| Zone | Intended widget types | Data contract for future work |
|---|---|---|
| Metrics | KPI cards and change indicators | `{ id, title, value, change?, trend?, status }` |
| Insights | Charts, trends and distributions | `{ id, title, series, range, emptyState }` |
| Quick actions | Permission-aware operational entry points | `{ id, title, description, action, icon, enabled }` |

Widget rendering is configuration-driven so a future analytics data source can populate declared widgets without changing the dashboard shell or introducing fictional data. Until a real source is approved, the interface presents an honest empty analytics state and only navigates to the operational Users module.

## Route contract

| Route | Module | Access |
|---|---|---|
| `/super-admin` | Super admin dashboard | Super admin only; all other roles are redirected to their appropriate dashboard. |
| `/super-admin/users` | Scoped Users management | Super admin only; Field Builder and peer Super admin records are unavailable. |
| `/admin` | Private dashboard | Private control account only; all other authenticated roles are silently redirected to `/dashboard`. |
| `/admin/users` | Private Users control | Private control account only; all other authenticated roles are silently redirected to `/dashboard`. |
| `/admin/*` | Not found / safe route fallback | No legacy or private control module is exposed. |

## Verification record

| Check | Result |
|---|---|
| Role migration | Existing database `user` records were migrated to `student`; the designated Founder record was retained. The internal enum compatibility value is not issuable through Users. |
| Users unit coverage | Private-role guard, permitted role validation, excluded private records, list filters and create delegation are covered. |
| Field Builder unit coverage | Server validation covers required values, dropdown option allowlists, number/date/checkbox formats, optional omissions and unsupported metadata types. Router coverage verifies private Field Builder access, rejects unsupported field types, requires a duplicate-free full field order, and permits configuration of every account-backed field. |
| Browser Users E2E | A self-cleaning temporary account completed all five visible role modules, keyboard modal close/reopen, Field Builder group and two field creation, persisted drag-and-drop ordering, schema-driven user creation, EAV persistence verification, role/status update, inactive sign-in denial, local search, role/status/date filtering, modal delete confirmation and deletion. A standard account was silently redirected from `/admin/users` to `/dashboard` with no private-role disclosure. The test then removes only its temporary fields and group; database cleanup was verified. |
| Super admin Users E2E | A self-cleaning Super admin account was routed from universal sign-in to `/super-admin`, opened the scoped Users module, verified the four permitted role categories, verified the absence of Field Builder and the Super admins category, confirmed the create selector excludes `super_admin`, and was redirected away from `/admin/users` to its own dashboard. |
| Responsive Founder matrix | Dashboard and Users passed 16 route–viewport checks across 8 target viewports plus 2 tablet orientation checks: zero overflow, fixed chrome preserved and no measured undersized visible button/link targets. |
| Users modal layout | Create modal passed 4 mobile/tablet layout checks: zero overflow, dialog bounds inside viewport and no measured undersized control hit areas. |
| Field browser QA | A field label was renamed and restored; a field was hidden, confirmed absent from New user, then restored. Group selectors are available for every account-backed field and every configurable field. |
| Regression | 33 automated tests passed; TypeScript and whitespace checks passed. The expanded self-cleaning Users E2E completed 16 checks, including drag-and-drop persistence, create-form ordering, cleanup and non-Founder private-console isolation. |

## Optional future launch gates

The owner has elected to retain Founder content-operation acceptance and moderated usability testing as **optional future launch gates**. They do not block the present version, and they are not an instruction to create, alter, publish, delete or otherwise change real centre data. They may be resumed only under a new explicit owner request, with authentic source content and a confirmed intended action where applicable.
