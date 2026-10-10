# CONSOLE MATRIX (derived from the real guards, not from UI intent)

Source of truth: `server/_core/trpc.ts`.

| Guard | Roles allowed by the code |
|---|---|
| `studentProcedure` | student |
| `teacherProcedure` | teacher |
| `adminProcedure` | **admin, super_admin, founder** |
| `contentManagerProcedure` / `marketingProcedure` | admin, marketing, super_admin, founder |
| `founderProcedure` | **founder only** |
| `superAdminProcedure` | super_admin only |
| `auditProcedure` | **founder, super_admin** |
| `protectedProcedure` | any authenticated user |

## role x module x authorizing procedure

| Role | Route today | Console | Modules the server actually allows | Authorizing procedure |
|---|---|---|---|---|
| founder | /admin | founder | overview, **users**, **audit**, prices | none; `users.*` = founderProcedure; `audit.*` = auditProcedure; `prices.*` = adminProcedure |
| super_admin | /super-admin | super_admin | overview, **audit**, prices | none; `audit.*` = auditProcedure (founder+super_admin); `prices.*` = adminProcedure |
| admin | /admin | admin | overview, prices | none; `prices.*` = adminProcedure (admin+super_admin+founder) |
| marketing | /marketing | marketing | overview | none; `marketing.*`/`contentManagerProcedure` allows admin, marketing, super_admin, founder |
| teacher | /teacher | teacher | overview | none |
| student | /dashboard | student | overview | none |
| user (legacy) | /dashboard | empty | **none** | no procedure grants this role anything in the console |

**User Accounts is founder-only** because `server/routers/users.ts` uses `founderProcedure` on `list`, `byId`, `formSchema`, `updateSystemFields`, `createSection` and the rest.

**Audit & Security excludes admin** because `audit.list`, `suggestions`, `exportCsv` and `exportPdf` use `auditProcedure`, whose role set is exactly `["founder", "super_admin"]`. `audit.archive` is stricter still (`founderProcedure`). So admin does **not** get Audit & Security.

**Ambiguity resolved restrictively, recorded per R8:** `server/routers/superAdminUsers.ts` is named for super admin but its procedures are guarded by `adminProcedure`, which also admits `admin`. I did **not** turn that into an admin-visible "User Accounts" module, because the module the founder console shows is `users.*`, which is `founderProcedure`. The more restrictive role set wins, so User Accounts stays founder-only. Admin keeps **Overview** and **Prices**.

**Legacy `user` role:** no console module maps to it, so it resolves to the empty console and the translated empty state. Its home route stays `/dashboard`, and `isAuthorizedFor("user", "student")` is true so it is not bounced — this keeps the redirect idempotent.