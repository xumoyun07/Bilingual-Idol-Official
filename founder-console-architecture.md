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
| Browser Users E2E | A self-cleaning temporary account completed all six role modules, keyboard modal close/reopen, modal create, role/status update, inactive sign-in denial, local search, role/status/date filtering, modal delete confirmation and deletion. Database cleanup was verified as zero remaining QA accounts. |
| Responsive Founder matrix | Dashboard and Users passed 16 route–viewport checks across 8 target viewports plus 2 tablet orientation checks: zero overflow, fixed chrome preserved and no measured undersized visible button/link targets. |
| Users modal layout | Create modal passed 4 mobile/tablet layout checks: zero overflow, dialog bounds inside viewport and no measured undersized control hit areas. |
| Regression | 26 automated tests passed; TypeScript and whitespace checks passed; keyboard QA passed 8 of 8 scenarios. |

## Optional future launch gates

The owner has elected to retain Founder content-operation acceptance and moderated usability testing as **optional future launch gates**. They do not block the present version, and they are not an instruction to create, alter, publish, delete or otherwise change real centre data. They may be resumed only under a new explicit owner request, with authentic source content and a confirmed intended action where applicable.
