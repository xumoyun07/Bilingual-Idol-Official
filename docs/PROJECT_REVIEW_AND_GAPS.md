# PROJECT REVIEW AND GAP ANALYSIS — BILC (Bilingual Idol Language Centre)

Date: 2026-10-10 · Branch: `stage-3c-shell` · Method: full read of the 12 provided specification documents; requirement extraction into 203 stable IDs ([M01]–[M53], [S01]–[S33], [G01]–[G35], [U01]–[U21], [D01]–[D26], [F01]–[F30], [ST01]–[ST17], [TE01]–[TE13], [MK01]–[MK17], [AD01]–[AD13], [SA01]–[SA13], [FD01]–[FD18]); direct code verification of every "unconfirmed" item.

Rule applied throughout: where the documents allow "implementation may differ if the result is achieved" ([M32], [S27], [G24], [F22], [SA12], [FD17]), an implemented deviation is **accepted** provided the observable result matches. Secrets rule R1 applies: no credentials, hashes or personal data are reproduced here.

---

## PART 1 — REVIEW OF THE IMPLEMENTED PART

### 1.1 Role model, guards and audit — IMPLEMENTED, ACCEPTED
- All seven roles (`user, student, teacher, marketing, admin, super_admin, founder`) exist; guards in `server/_core/trpc.ts` verified line-by-line: `founderProcedure` (founder only), `superAdminProcedure` (super_admin only), `auditProcedure` (founder+super_admin), `adminProcedure` (admin+super_admin+founder), `contentManagerProcedure`/`marketingProcedure` (marketing+admin+super_admin+founder), `teacherProcedure`, `studentProcedure`, `protectedProcedure`, `publicProcedure`. Matches [S32], [G01].
- `auditLogs` + `auditLogArchives` + `scheduledAuditRotation` exist; `audit.archive`/`audit.restore` are founder-only [F5, SA2, G04].
- Cross-role MUST-NOT matrix verified by tests (`server/procedureRoleMatrix.test.ts`, `server/pricesAccess.test.ts` and others): student cannot read others' attendance/prices; teacher procedures are exact-role; marketing cannot call the pixel toggle; super_admin is excluded from founder procedures.
- **Deviation accepted:** the docs' bootstrap founder credentials ([FD10]) are not used. The implemented system derives founder auth from `FOUNDER_PASSWORD_HASH`/`FOUNDER_EMAIL` env (fail-closed, single-founder invariant enforced by a unique generated column). This is the security-hardened variant of the same result and is accepted per [ACCEPT-DIFFERENT-IF-RESULT].

### 1.2 Funnel forms (Form 1 / Form 2) — IMPLEMENTED, ACCEPTED with two notes
- Form 1: `submissions.createInquiry` (public) writes `type='inquiry'` with `reasonType` (`general|consultation|campusTour`) [F01–F04, D20]; `submissions.updateStatus` (marketing) implements the lead funnel `new→contacted→interested→enrolled→closed` [MK2]; `leadSources` table exists.
- Form 2: `registration.submit` (public), `registration.formSchema` (public, `atRegistration` only), `registration.onboardingSchema`/`getOnboardingSchema` + `submitOnboarding` (student) [F15, D21]; `userFormFields.collectionStage` enum `atRegistration|atFirstLogin` exists and Stage A/B filtering is enforced server-side ("Field ID ... does not belong to the registration collection stage") [F08, G22]; Stage B values land in `userProfileValues` [F12]; only founder manages fields via `users.*` [F07, F16, FD03].
- UTM columns verified on **both** `submissions` and `registrationSubmissions` [MK8] — attribution schema is complete.
- `FindYourCourseWidget` exists (no contact collection; result → Form 2) [M09, F23-F24].
- **Note 1 (gap, see G6):** `submissions.create` still accepts the legacy enrollment input (`studentName/studentAge/parentName/…`) — the old parallel schema that [M33]/[F25] removed from the flow. New records still go through Form 2, so the *result* is achieved, but the deprecated input should be removed.
- **Note 2 (gap, see G7):** `/enroll` redirects to `/contact` (Form 1). [S16]/[F25] require registration entry points to reach Form 2; the redirect target should be the Form 2 entry.

### 1.3 Placement test — PARTIALLY IMPLEMENTED
- Tables `placementTests`/`placementTestAttempts` exist [M34–M35, D13]; router `placementTests` has `list/get/submitAttempt/listAttempts/createTest/deleteTest` [G12].
- `submitAttempt` stores answers JSON with score computation. **Unverified:** that the recommendation is bound to `recommendedProgramId` (a real `programs` FK) rather than free text [D22]; and the RTL stepper behaviour of the test widget [U15].

### 1.4 Teacher & student academic loop — IMPLEMENTED, ACCEPTED
- `classSessions`, `attendanceRecords`, `grades` tables exist; `teacher.schedule/sessionDetails/attendance/saveAttendance/upsertGrade/publishGrade` are `teacherProcedure` and scoped to `teacherId` = caller [TE02–TE04]; attendance is upserted on `(classSessionId, studentId)`; grade uniqueness on `(classSessionId, studentId, title)` [TE08]; unpublished grades invisible to students [TE07, ST12]; `studentAttendance.summary` (student) shows own data only [ST03, ST09].
- **Gap (G4):** no student read endpoint for **own published grades** and no student read endpoint for **own `studentDocuments`** [S4, ST06, ST12–ST13]. Students currently cannot see the documents the docs require.

### 1.5 Payments & pricing — IMPLEMENTED BEYOND PHASE-3 REQUIREMENT, ACCEPTED
- The docs schedule payments as Phase 3 with ToyyibPay [S23]. The codebase implemented a **price-based checkout**: `studentPrices` (agreed price per student/program, set/change/cancel/complete by staff, one `active` per pair via unique generated column, history never deleted), `payments.create({priceId, idempotencyKey})` (student-only, server-takes-amount, minor units, idempotency), webhook compares `amountMinor` and settles payment+price in one idempotent transaction, `payments.mine/list` with role split (student own; founder/super_admin/admin all; teacher/marketing/user FORBIDDEN). This fully achieves the Phase-3 payment result and is accepted.
- Currency MYR from one shared constant; money formatting via `shared/money.ts` (en/ms/ar). Payments statuses include `completed`; invoices/receipt numbers generated (`BILC-…`).

### 1.6 Marketing & content — MOSTLY IMPLEMENTED
- `marketing` router: blogPosts/events/galleryMedia/contentBlocks/contentPages/testimonials moderation/teamProfiles/socialLinks [MK3]; drafts and unapproved testimonials excluded from public reads [MK10, S20]; `whatsappEntryPoints` and `chatbotFaqEntries` exist [MK5]; `audienceSegments` and `exportReportCsv` exist [MK6]; `marketing.toggleAllowMarketingPixelManagement` is the sole `superAdminProcedure` method [SA3–SA4].
- SEO fields `seoTitle/seoDescription` verified on `programs`, `contentPages` and `blogPosts` [M26, U18] — the extension the docs marked missing is present.
- **Gap (G5):** promotions partially implemented (`list/create/delete/validate/publicList` under marketing), but [MK3]/[M38]/[M47] require: `update`, a `publicActive` (active + non-expired), unique `promoCode`, `placesUsed ≤ availablePlaces` guard, and the field set (`discountType percentage|fixedAmount`, `bannerImageUrl`, `termsAndConditions`). Current schema uses `maxUses/scope/startsAt/expiresAt` — functionally close, but the named procedures and guards are missing.

### 1.7 Founder / super_admin modules — IMPLEMENTED, ACCEPTED
- `users.*` (full registry + dynamic field/section builder, founder-only) [F1, FD02–FD03]; `superAdminUsers.*` (staff roles only) [SA1]; `students.*` with documents and profile history [F2]; `media.*`/`news.*` public reads + founder CRUD [F3–F4]; `audit.archive/restore` founder-only [F5]. Rejected-application/rollback rules belong to the pipeline (see G1).

### 1.8 i18n and RTL — IMPLEMENTED, ACCEPTED
- en/ms/ar dictionaries, `dir` managed only via `LanguageContext` [U01], logical properties in the shell, `<bdi dir="ltr">` isolation for phones/currencies [U06], Arabic typography tokens (0.9375rem base, Cairo/IBM Plex Sans Arabic, no italics) [U08–U10]. Unabbreviated Arabic dates and the tracker-timestamp rule [U11, U16] apply to the tracker UI — covered by G2/G3 work.

### 1.9 Dashboard shell & console separation — PARTIALLY IMPLEMENTED (work in progress)
- The floating shell, mobile sheet with inline language selector, single-scroller layout and the mobile header reservation are implemented and measured.
- `shared/console.ts` (pure): `resolveConsole/resolveHomeRoute/routeRoleOf/isAuthorizedFor/resolveRedirect`; founder → `/founder`, admin → `/admin`; idempotent redirect proven by unit tests.
- **Gap (G8):** the runtime wiring is incomplete — `Admin.tsx` still renders the founder console for admin sessions, `DashboardLayout` still holds the legacy admin-on-founder rule, `/founder` exists as a route but the console split (C2), redirect/link switch (C3) and authorization rewrite (C4) from the shell work are not done; the role-wording keys and `shell.language` (S2) are not added; `e2e/console-roles.ts` (S3) does not exist.

### 1.10 Deployment & infra — IMPLEMENTED, ACCEPTED
- Express + Vite middleware in dev / `dist` in prod [G13]; Docker MySQL with backup/DDL roles; PWA service worker and offline buffers [G16]; `check:e2e` type gate for the e2e scripts.

---

## PART 2 — GAPS (unimplemented or incomplete), in implementation order

| # | Gap | Doc IDs | What must be built |
|---|---|---|---|
| G1 | **Application Pipeline router** — `server/routers/applications.ts` does not exist | [A2], [S3], [M13], [G08], [D14], [D23], [AD03], [AD07–AD09], [ST04], [ST10–ST11], [FD05] | `applications.queue` (admin; new/routed), `assign`, `approve` (creates studentProfiles+users(role=student)+applications(status=submitted); registrationSubmissions→accountCreated), `reject` (reason required, no account), `advanceStatus` (forward-only chain; visaProcess only for `applicantCategory='internationalStudent'`, else skip to registrationCompleted), founder-only `overrideStatus` (incl. rollback), `myStatus` (student, own, view-only); auto-create `applications` when accountCreated is set; audit every mutation; tests for the full chain + all MUST-NOT rules |
| G2 | **Application Status Tracker UI** in `UserDashboard` | [ST01], [ST04], [M50], [G29], [U11], [U16] | tracker checklist (past steps marked, current highlighted), `visaProcess` hidden for non-international, translated via `useLanguage()`, logical RTL order, unabbreviated Arabic dates |
| G3 | **Admin application queue UI** in `/admin` | [AD01] | queue with `applicantCategory`/`programInterest` filters, assign/approve/reject/advance, default sort prioritising consultation/campusTour leads is [AD04] (leads, separate) |
| G4 | **Student grades & documents endpoints** | [S4], [ST06], [ST07], [ST12–ST13] | `studentProcedure` query: own published grades (`isPublished=true`) and own `studentDocuments` (read/download only); tests that unpublished grades and other students' rows are excluded |
| G5 | **Promotions completion** | [MK3], [M38], [M47], [MK13–MK15] | `promotions.update`, `promotions.publicActive` (active, non-expired), unique `promoCode`, `placesUsed ≤ availablePlaces` validation; align fields (`discountType percentage|fixedAmount`, `bannerImageUrl`, `termsAndConditions`) |
| G6 | **Remove legacy enrollment input** | [M33], [F25–F26] | `submissions.create` must stop accepting the old student/parent schema; historical `type='enrollment'` rows keep rendering in reports |
| G7 | **`/enroll` points to Form 2 entry** | [S16], [F25], [F28] | redirect `/enroll` to the Form 2 entry point, not `/contact`; verify no link treats `/enroll` as a registration route |
| G8 | **Console separation finish** (from the shell step) | [M02], [G32], [AD01], [FD01] + prior C2–C4/S2/S3 | C2 admin console in `Admin.tsx` (never `FounderConsole` for admin); C3 redirects/links switch (founder → `/founder` server+client, print every changed file:line); C4 authorization rewrite on `resolveRedirect`; S2 wording keys + `shell.language` in en/ms/ar; S3 `e2e/console-roles.ts` + `npm run e2e:console`; tag `step-2-done` |
| G9 | **Placement test recommendation binding** | [D22], [G23] | verify/ensure the attempt stores a real `recommendedProgramId` (FK to programs), not free text; result → Form 2 prefill; RTL stepper check [U15] |
| G10 | **Notification trigger engine** | [M28], [M39], [S13] | basic trigger engine over `messageTemplates`: enquiry received, payment received, promo expiring; audit-safe, no secrets in logs |
| G11 | **Form 1 / Form 2 component conformance** | [F20], [F21], [M49] | confirm every site entry point opens the shared forms with prefilled `reasonType`/`programInterest`; replace any remaining standalone entry points |
| G12 | **V2 journey content** | [D09] | `StudentJourneyRoadmap` must show the Form 1 → quiz/test → Form 2 → tracker funnel |

---

## PART 3 — VERIFICATION STATUS

- Owner-run evidence: `npx vitest run` → 334 passed | 11 skipped; `npx tsc --noEmit` → 4 (four known client-side errors, baseline); `npm run check:e2e` → 0 errors.
- Sandbox note: vitest, tsx, docker and browsers are blocked for the agent (EPERM); all such checks are recorded as OWNER RUNS in `docs/HANDOFF.md` with exact commands.

## PART 4 — OWNER COMMANDS

```powershell
npx vitest run
npm run i18n:sync            # answer n if asked to call Azure
$env:TEST_FIXTURES="1"; npm run e2e:console   # after S3 lands
npm run e2e:sheet-all
```

---

## PART 5 — IMPLEMENTATION STATUS (final)

All twelve gaps from Part 2 plus the console-split items are implemented and committed on `stage-3c-shell`:

| Item | Commit | What was implemented |
|---|---|---|
| G1 Application Pipeline | a711abd | `applications` router + service: queue/assign/approve/reject/advanceStatus (forward-only, visa skip for locals), founder override incl. rollback, student myStatus with per-stage visibility; audit on every mutation; 20 tests |
| G4 Student cabinet | d65ff5d | `studentCabinet.grades` (published only) and `.documents` (own, read-only) under studentProcedure; 5 tests |
| G2 Tracker UI | 01d29ed | `ApplicationStatusTracker` in UserDashboard with `tracker.*` keys en/ms/ar |
| G5 Promotions | 459a291 | `update`, `publicActive`, duplicate-code CONFLICT, `usedCount` immutable via CRUD, audit, 10 tests |
| G6 Legacy enrollment closed | 687627e | `submissions.create` rejects `type='enrollment'`; historical rows preserved; test |
| G7 `/enroll` retargeted | 3c04b2a | redirects to `/programs`; popup and roadmap links updated |
| C2 Admin console | 140bcb1 | founder console moved to `pages/Founder.tsx`; `/admin` renders the admin console (overview + queue), no founder wording |
| C3 Founder under /founder | 7485d02 | server redirects, nav hook paths, canonical paths, `?role=` ignored, `/founder` sub-routes |
| C4 Single redirect | 1ea0e34 | layout effect on `resolveRedirect`; legacy admin-on-founder rule removed; source-level tests |
| S2 Wording + shell.language | 0e0b2f4 | role console label/title/subtitle keys, founder console strings, `shell.language`; en/ms/ar by hand in translations.ts |
| S3 Console e2e | 9c1f830 | `e2e/console-roles.ts` + `npm run e2e:console`; tag `step-2-done` |
| G9 Placement binding | 7aada9d | `resolveRecommendedProgram` + `recommendedProgramId` in submitAttempt; migration + rollback for persistent storage; tests |
| G10 Notifications | 5a1af25 | template-driven engine (enquiry/payment/promo-expiring), wired into createInquiry and the payments webhook, cron-ping endpoint; tests |
| G11 Form conformance | (verified) | single Form 1 (LeadForm) and Form 2 (OfficialRegistryModal), quiz prefill, no booking entities — no change required |
| G12 Journey content | 8026f9b | roadmap rewritten to the 4-step V2 funnel in en/ms/ar |
| G3 remainder | eca0909 | Applications section in the admin console with forward-only Advance |

Verification run for every commit: `npx tsc --noEmit` = 0 (improved from the stale baseline of 4) and `npm run check:e2e` = 0 errors.

OWNER RUNS (sandbox blocks vitest/tsx/docker/browsers for the agent; no result is claimed):
- `npx vitest run`
- `npm run i18n:sync` (answer n to the Azure question) — locale JSONs updated by hand only in translations.ts; key-parity stays red until sync
- `$env:TEST_FIXTURES="1"; npm run e2e:console`
- `npm run e2e:sheet-all`
- DDL (after a verified dump): `docs/pending-migrations/2026-placement-recommended-program.sql` (idempotent, guarded) and its rollback
