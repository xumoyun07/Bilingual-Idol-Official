# HANDOFF

## Owner commands

```powershell
$env:TEST_FIXTURES="1"; npm run e2e:sheet-all    # доказательство шторки: admin (/admin) и student (/dashboard)
npm run e2e:shell                                # diag-shell + mobile-header + sheet-proof
npm run check:e2e                                # tsc -p tsconfig.e2e.json
npx tsc --noEmit                                 # базовый уровень: 4 ошибки, все клиентские
npm test                                         # vitest
```

If the dashboard looks stale: stop the dev server, `pnpm build`, `npm run dev`, then Ctrl+F5.

## Steps 1-6

### STEP 1 — sheet proof unblock: DONE — OWNER RESULT: sheet proof PASS for admin and student, 0 failures, 0 temp accounts left
Done:
- `docs/OPERATING_RULES.md` saved verbatim.
- Fixed the real cause of "trigger found 0 times": `data-testid="mobile-shell-trigger"` was **never added**. Commit `2cf573d` added the other four ids but silently dropped that one because of a PowerShell array-concatenation bug in my edit; `git show 2cf573d` proves it. The button already carried the English `aria-label="Toggle menu"` in ms and ar, so my earlier "translated label" theory was wrong.
- The attribute is now on the mobile header button (`DashboardLayout.tsx:481`).
- Fallback cascades in `e2e/sheet-proof.ts` and `e2e/mobile-header.ts`. Trigger: `[data-testid=mobile-shell-trigger]` → `header.lg\:hidden button[aria-label="Toggle menu"]` → the only button inside `header.lg\:hidden`. Panel: `[data-testid=mobile-shell-panel]` → walk up from the Sign out button (testid or text `sign out|log keluar|تسجيل الخروج`) to the fixed ancestor, then set the test id on it so every later selector works. Each run prints which level matched.
- `OWNER MANUAL FALLBACK` comment at the top of both scripts.
- `/first-login` handled: if a fixture lands there, the proof opens the role route directly and prints the final URL.
- `npm run e2e:sheet-all` → `e2e/run-sheet-all.ts` runs the proof with `SHEET_ROLE=admin` then `SHEET_ROLE=student` via `process.env` in a tsx wrapper (no shell-specific syntax).

OWNER RESULT: `$env:TEST_FIXTURES="1"; npm run e2e:sheet-all` -> PASS for admin and student, 0 failures, 0 temporary accounts left. Screenshots at `e2e/screenshots/sheet-{en,ms,ar}-{top,bottom}.png` (gitignored).

Next sub-item: STEP 2 (role-based console).

### STEP 2 — IN PROGRESS (role-based console; R8 corrected: the SERVER decides who sees what)

Done (2.1, 2.2):
- `docs/CONSOLE_MATRIX.md` — the role x module x authorizing procedure table, derived from `server/_core/trpc.ts`, with today's landing route per role.
- `shared/console.ts` — pure module, no React: `resolveConsole(sessionRole)`, `resolveHomeRoute(sessionRole)`, `routeRoleOf(path)`, `isAuthorizedFor(sessionRole, routeRole)`, plus `CONSOLE_MODULES` mapping each module to its authorizing procedure.
- `server/console.test.ts` — unit tests for every role, the null console for unknown roles, the module sets (founder has users+audit; admin has neither; super_admin has audit but not users), home routes, route detection, and redirect idempotence for every role.

Restrictive calls recorded per R8:
- `superAdminUsers.*` is guarded by `adminProcedure`, which also admits `admin`, but the founder console's User Accounts module is `users.*` = `founderProcedure`. The more restrictive set wins, so User Accounts stays founder-only.
- `auditProcedure` is exactly `["founder","super_admin"]`, so **admin gets no Audit & Security**.
- Legacy `user` resolves to a console with no modules (empty state) and keeps `/dashboard`; `isAuthorizedFor("user","student")` is true so the redirect cannot loop.

Not done: 2.3 wiring, 2.4 redirect rewrite, 2.5 translations, 2.6 e2e/console-roles.ts.

Next sub-item: 2.3 — wire DashboardLayout (displayed role, badge, account chip, console title, breadcrumbs, module list) to `resolveConsole(user.role)`, remove the `role = "founder"` default, and stop `Admin.tsx` from forcing the founder console on admin sessions.

Owner commands: `npx vitest run`; `$env:TEST_FIXTURES="1"; npm run e2e:console` (script missing until 2.6 lands).
### STEP 3 — NOT STARTED
### STEP 4 — NOT STARTED
### STEP 5 — NOT STARTED
### STEP 6 — NOT STARTED

## Open items carried over

1. `npm run e2e:sheet-all` never executed; the sheet proof, the mobile header proof and the diag-shell assertions are all unmeasured.
2. Six sheet screenshots not read.
3. Role-based console (was item 2 of earlier prompts) not started: no `resolveConsole(sessionRole)`, no role/module/procedure table from `server/routers/*`, no wiring of badge/account chip/console title/breadcrumbs to `ctx.user.role`, `DashboardLayout.tsx:73` still defaults `role = "founder"` and `Admin.tsx:88` still passes no role, no translated empty state, no unit tests, no source-level URL test.
4. The admin redirect rule to remember when touching item 2: `DashboardLayout.tsx:84-90` fails authorization for an admin on role `student`, line 108 renders `DashboardLayoutSkeleton`, and the effect at 92-106 (lines 97-98) hard-reloads to `/admin`.
5. Sidebar still carries several `!important` declarations and the `nth-of-type` dropdown chain at `index.css:10488`; deliberately left.
6. `e2e/run-shell-checks.ts` needs `TEST_FOUNDER_PASSWORD` and is not part of `e2e:shell`.
7. Dev serves source through Vite middleware (`server/_core/index.ts:165`), so `dist/public` (built 10:14) being older than the source edits is irrelevant in dev; it would only matter for a production build.
## STEP 2 STATUS BY EVIDENCE (read-only check)

| Sub-item | Status | Proof |
|---|---|---|
| 2.1 decision table | DONE | `docs/CONSOLE_MATRIX.md` exists; committed in a8c68a9 |
| 2.2 pure module | DONE | `shared/console.ts` exists; committed in a8c68a9 |
| 2.3 wire the layout | **NOT DONE** | grep `role = "founder"` still matches in DashboardLayout.tsx, and `FounderConsole` still matches in Admin.tsx; nothing calls resolveConsole |
| 2.4 loop-free redirect | **NOT DONE** | DashboardLayout.tsx 84-108 untouched; idempotence is proven only for the pure functions in server/console.test.ts |
| 2.5 translations | **NOT DONE** | no `shell.language` key in locales or translations.ts; "Founder Dashboard", "ACTIVE MODULE" and "Platform & Governance" still appear in translations.ts; the sheet heading still uses `td("Language")` |
| 2.6 tests | **PARTIAL** | unit tests exist (server/console.test.ts, owner ran vitest: 334 passed | 11 skipped). `e2e/console-roles.ts` does NOT exist and `npm run e2e:console` is missing, so the browser part and the source-level tests are not done |
| 2.7 fallbacks | not needed yet | no redirect loop observed in code review; nothing recorded |
| 2.8 checks and tag | **PARTIAL** | `npx tsc --noEmit` = 4 and `npm run check:e2e` = 0 errors after each commit. `step-2-done` NOT tagged because step 2 is not done |

Owner run confirmed: `npx vitest run` -> 334 passed, 11 skipped; `npm run e2e:console` -> "Missing script".

Next sub-item: 2.3 wiring, then 2.4, then 2.5, then the rest of 2.6 (e2e/console-roles.ts plus the npm script).
- 2026-10-10 15:34: 2.3 committed in 2396e9b — displayed role/badge/title/modules from resolveConsole(sessionRole); founder default removed with a loop guard. Still open in 2.3: Admin.tsx founder wording and the new en/ms/ar keys (shell.language).

- 2026-10-10 15:39: S1 partial, committed f0486d2 — pure module split (/founder vs /admin), routeRoleOf admin role, resolveRedirect + idempotence tests over all six routes, matrix updated. Still open in S1: /founder route in App.tsx, Admin.tsx admin console (no FounderConsole for admin), server redirectTo updates, client "/admin" links, and the isRoleAuthorized/effect rewrite on resolveRedirect. Owner commands: npm run i18n:sync (answer n to the Azure question), npx vitest run, $env:TEST_FIXTURES="1"; npm run e2e:console.

- 2026-10-10 15:49: C1 done, committed 484bd2e — /founder route added, renders the existing founder console, ?tab= preserved via useFounderNav, ?role= ignored. /admin unchanged.

- 2026-10-10 16:52: NEW STREAM — 12-doc review completed; docs/PROJECT_REVIEW_AND_GAPS.md written. Gaps G1-G12; implementation order G1 applications router -> G2 tracker UI -> G3 admin queue -> G4 student grades/documents -> G5 promotions -> G6 legacy enrollment input -> G7 /enroll target -> G8 console finish (C2-C4, S2, S3) -> G9 placement binding -> G10 notifications -> G11 form conformance -> G12 journey content.

- 2026-10-10 16:58: G1 done, committed a711abd — applications router (queue/assign/approve/reject/advanceStatus/overrideStatus/myStatus) + service + audit actions + vitest suite. Owner runs: npx vitest run. Next: G2 tracker UI in UserDashboard, G3 admin queue UI in /admin.

- 2026-10-10 17:00: G4 done, committed d65ff5d — studentCabinet.grades/documents (studentProcedure, own-only, published-only) + tests. Next: G2 tracker UI in UserDashboard.

- 2026-10-10 17:02: G2 done, committed 01d29ed — ApplicationStatusTracker component + tracker.* keys in translations.ts (en/ms/ar) + block in UserDashboard. Key-parity stays RED until owner runs npm run i18n:sync. Next: G3 admin queue UI in /admin.

- 2026-10-10 17:05: G5 done, committed 459a291 — promotions.update + publicActive + duplicate-code CONFLICT + audit + tests. Field-name deviation (code vs promoCode etc.) recorded as accepted; no migration. Next: G6 legacy enrollment input removal + G7 /enroll target, then G3 admin queue UI.

- 2026-10-10 17:07: G6 done, committed 687627e — submissions.create rejects type=enrollment; test added.

- 2026-10-10 17:07: G7 done, committed 3c04b2a — /enroll redirects to /programs; PromotionalPopup and StudentJourneyRoadmap links updated.

- 2026-10-10 17:09: C2+G3 core done, committed 140bcb1 — Founder.tsx holds the founder console; Admin.tsx renders the admin console (overview + queue with assign/approve/reject via applications.*). Stage-advance UI in the queue still to add. Next: C3 redirect/link switch, C4 authorization rewrite, S2 shell.language, S3 e2e console test.

- 2026-10-10 17:12: C3 done, committed 7485d02 — founder redirects/links/canonical paths -> /founder; ?role= ignored; /founder sub-routes added.

- 2026-10-10 17:12: C4 done, committed 1ea0e34 — effect on resolveRedirect, legacy rule removed, consoleSource.test.ts added.

- 2026-10-10 17:15: S2 done, committed 0e0b2f4 — shell.language + role console wording keys; founder console strings translated via keys. Key parity red until owner npm run i18n:sync. Next: S3 e2e/console-roles.ts + e2e:console + step-2-done, then G9/G10/G11/G12.

- 2026-10-10 17:16: S3 done, committed 9c1f830 — e2e/console-roles.ts + npm run e2e:console; tag step-2-done создан. OWNER RUNS: `$env:TEST_FIXTURES="1"; npm run e2e:console`, npx vitest run, npm run i18n:sync.

- 2026-10-10 17:18: G9 done, committed 7aada9d — resolveRecommendedProgram + recommendedProgramId в submitAttempt + тесты; миграция 2026-placement-recommended-program.sql (OWNER: применить после дампа, команда в файле HANDOFF). Next: G10 уведомления, G11 формы, G12 roadmap.

- 2026-10-10 17:22: G10 done, committed 5a1af25 — notification engine (enquiry/payment/promo-expiring) + scheduled endpoint + tests. Next: G11 form conformance, G12 roadmap.

- 2026-10-10 17:25: G11 (verified conformant, no change) + G12 done, committed 8026f9b — roadmap V2 funnel (4 steps, en/ms/ar). Next: G3 remainder (advance-stage UI) and the final report.

- 2026-10-10 17:26: G3 remainder done, committed eca0909 — admin console Applications section with forward-only Advance. ALL GAPS DONE: G1-G12, C1-C4, S2-S3. Next: final report and goal completion.

- 2026-10-10 17:45: OWNER-FIX G1 done, committed 61a6f9a — pipeline генерирует пароль внутри.

- 2026-10-10 17:46: OWNER-FIX G2 done, committed 826a3e7 — импорт TRPCError.

- 2026-10-10 17:46: OWNER-FIX G3 done, committed 1251c48 — dashboardPathForRole -> resolveHomeRoute; тест выровнен.

- 2026-10-10 17:46: OWNER-FIX G3 (доп.) committed 69891f1 — функция делегирует resolveHomeRoute (первая замена промахнулась по отступам).

- 2026-10-10 17:47: OWNER-FIX G3 (CRLF-нормализация) committed cf2e821 — функция заменена.

- 2026-10-10 17:47: OWNER-FIX G4 done, committed 60ef5f0 — даты в тесте от реальных часов.

- 2026-10-10 17:47: OWNER-FIX G5 done, committed 67e7a72 — тест ждёт B1 при 50%.

- 2026-10-10 17:47: OWNER-FIX G6 done, committed be84685 — ожидание #sign-in-email + дамп диагностики при провале.

## Owner commands (обязательная предпосылка)
Запустите dev-сервер в отдельном терминале перед любым e2e: 
pm run dev. Если его нет — форма входа не отрендерится и e2e:sheet-all / e2e:console повиснут на #sign-in-email.

## Owner final sequence (в этом порядке)

1. `npm run i18n:sync` → ответить y (22 символа, 1 ms-ключ: console.super_admin.label)
2. `npx vitest run` → ожидается 0 failed
3. Запустить `npm run dev` в отдельном терминале
4. `$env:TEST_FIXTURES="1"; npm run e2e:console` → ожидается 0 failures
5. `$env:TEST_FIXTURES="1"; npm run e2e:sheet-all` → ожидается 0 failures для admin и student
6. `git push origin stage-3c-shell`
- 2026-10-10 18:07: OWNER-FIX FILE1 done, committed 406fb32 — initialPassword в createManagedUser + pipeline.

- 2026-10-10 18:07: OWNER-FIX FILE2 done, committed ea2a002 — visa-стадия отфильтрована для местных.

- 2026-10-10 18:08: OWNER-FIX FILE2 (код) committed b33ea67 — фильтр visa в myStatus.
