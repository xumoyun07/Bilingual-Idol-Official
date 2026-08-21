# Founder Console Architecture

## Purpose and scope

The Founder console is reduced to two protected modules: **Dashboard** and **Users**. Legacy Founder screens for submissions, announcements, content and announcement editing are removed from Founder navigation and application routes. The related Founder tRPC mutation/list procedures are also removed. Database records and public-site read/create contracts remain intact where the public website still requires them.

## Role governance

| Role | Platform meaning | Users module authority |
|---|---|---|
| `founder` | Highest platform authority | Full access. Founder accounts are protected from edit, deactivation and deletion through the Users module. |
| `super_admin` | Senior operational authority | May be issued and managed by Founder only. |
| `admin` | Administrative operator | May be issued and managed by Founder only. |
| `marketing` | Communications and marketing operator | May be issued and managed by Founder only. |
| `teacher` | Educator account | May be issued and managed by Founder only. |
| `student` | Learner account | May be issued and managed by Founder only. |

The former generic `user` role is migrated to `student` for issued platform accounts. The enum retains `user` only as an internal compatibility value for framework-generated service/session identities; it is never selectable from the Founder interface. Founder is intentionally not selectable in create or edit forms, preventing the console from issuing a second high-authority account or allowing privilege escalation. A Founder cannot deactivate, delete or alter a Founder record through this module.

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

The **Configure create form** control in the Users module opens a Founder-only configuration dialog for safe, additional profile attributes. It does not expose system identity, authorization or credential attributes. The runtime **New user** modal reads the active form schema and renders grouped fields directly from that metadata, so a Founder can extend the account-creation profile without a frontend deployment or code change.

| Contract element | Storage and behaviour | Safety boundary |
|---|---|---|
| Sections | `userFormSections` stores title, icon, sort order and active state. A section organizes fields visually; it does not own user values. | Removing a section moves its fields to the ungrouped “Other details” area. No field definition or profile value is deleted by that action. |
| Fields | `userFormFields` stores a generated stable key, visible label, supported type, required flag, order, placeholder, dropdown options, optional section, and active state. | Only six v1 types are accepted: `text`, `textarea`, `number`, `date`, `dropdown`, and `checkbox`. Image/file uploads, e-mail and password fields are excluded. |
| Values | `userProfileValues` stores the EAV tuple `{ userId, fieldId, value }` with one value per user/field pair. | Values are never accepted as arbitrary columns. The server maps only submitted active field keys to known field IDs after validation. |

The `users.formSchema`, `createSection`, `updateSection`, `removeSection`, `createField`, `updateField`, `removeField` and `reorderFields` procedures are all guarded by `founderProcedure`. The standard `users.create` procedure accepts an optional `profileValues` map in addition to protected core account attributes. It validates values on the server, then writes the account and approved EAV rows in one database transaction. A failed profile validation creates neither an account nor partial profile rows.

| Field type | Server validation rule |
|---|---|
| `text` / `textarea` | Trimmed string within the configured request limits. |
| `number` | Finite numeric representation. |
| `date` | ISO calendar-date value that parses to a real date. |
| `dropdown` | A configured, normalized option only. |
| `checkbox` | Literal `true` or `false`. |

Required fields are enforced server-side even if a browser is modified. Unknown, inactive or deleted field keys are rejected. Empty optional values are omitted rather than stored. Field labels are converted to collision-resistant stable keys when metadata is created; labels may later change without losing the field identity used by stored values.

The existing configurable-field list is orderable. A Founder can drag a row by its visible grip to move it; the client submits the complete ordered list of field IDs to `reorderFields`. The server rejects an incomplete list, an unknown ID or a duplicate ID, then updates all `sortOrder` values in a single transaction. The same list exposes 48px **move up** and **move down** controls as a keyboard and touch fallback. The runtime create form refreshes its schema when opened, so it renders the persisted order rather than a stale client cache.

### Lifecycle, migration and compatibility policy

Migration `0008_eager_doctor_octopus.sql` adds only the three Field Builder tables. It does not rewrite the existing `users` table, so existing accounts remain valid with no additional profile values. Adding a section or field is backwards compatible because missing optional EAV rows are represented as empty values; a new field can be marked required only for future create-form submissions.

Deleting a field deletes its associated EAV values as part of the managed data lifecycle. Deleting a user deletes that user’s EAV profile values in the same transaction. The initial interface intentionally configures this capability only for the **create** form; presenting or editing historical dynamic values in existing-user detail is a separate future scope and must preserve the same validation and authorization rules.

> The Field Builder extends profiles; it never alters platform identity, role authority, password storage, login state or account-active controls. Those system fields remain owned by the Users contract.

## Users navigation and modal interaction contract

The Users page is divided into six local role modules: **Students**, **Teachers**, **Marketing**, **Admins**, **Super admins** and **Founders**. Selecting a module fixes the directory to that account type and resets its independent query, activity-state and registration-date filters. The Founder module remains visible for oversight, but Founder records are protected from modification and removal.

Account actions are deliberately contained in modal windows. The **New user** control opens a validated creation modal, a directory row opens a detail/edit modal, and deletion requires a separate confirmation modal. This keeps list navigation stable while preserving keyboard escape, focus containment and an explicit destructive-action boundary.

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
| `/admin` | Dashboard | Founder only |
| `/admin/users` | Users | Founder only |
| `/admin/*` | Not found / safe route fallback | No legacy Founder module is exposed |

## Verification record

| Check | Result |
|---|---|
| Role migration | Existing database `user` records were migrated to `student`; the designated Founder record was retained. The internal enum compatibility value is not issuable through Users. |
| Users unit coverage | Founder guard, permitted role validation, list filters, create delegation and protected Founder-target errors are covered. |
| Field Builder unit coverage | Server validation covers required values, dropdown option allowlists, number/date/checkbox formats, optional omissions and unsupported metadata types. Router coverage verifies Founder-only Field Builder access, rejects unsupported field types, and requires a duplicate-free full field order. |
| Browser Users E2E | A self-cleaning temporary account completed all six role modules, keyboard modal close/reopen, Field Builder section and two profile fields creation, persisted drag-and-drop ordering, schema-driven user creation, EAV persistence verification, role/status update, inactive sign-in denial, local search, role/status/date filtering, modal delete confirmation and deletion. The test then removes the temporary fields and section; database cleanup was verified. |
| Responsive Founder matrix | Dashboard and Users passed 16 route–viewport checks across 8 target viewports plus 2 tablet orientation checks: zero overflow, fixed chrome preserved and no measured undersized visible button/link targets. |
| Users modal layout | Create modal passed 4 mobile/tablet layout checks: zero overflow, dialog bounds inside viewport and no measured undersized control hit areas. |
| Regression | 32 automated tests passed; TypeScript and whitespace checks passed. The expanded self-cleaning Users E2E completed 15 checks, including drag-and-drop persistence, create-form ordering and cleanup. |

## Optional future launch gates

The owner has elected to retain Founder content-operation acceptance and moderated usability testing as **optional future launch gates**. They do not block the present version, and they are not an instruction to create, alter, publish, delete or otherwise change real centre data. They may be resumed only under a new explicit owner request, with authentic source content and a confirmed intended action where applicable.
