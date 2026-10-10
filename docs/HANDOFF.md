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

### STEP 1 — sheet proof unblock: DONE (code committed in this step)
Done:
- `docs/OPERATING_RULES.md` saved verbatim.
- Fixed the real cause of "trigger found 0 times": `data-testid="mobile-shell-trigger"` was **never added**. Commit `2cf573d` added the other four ids but silently dropped that one because of a PowerShell array-concatenation bug in my edit; `git show 2cf573d` proves it. The button already carried the English `aria-label="Toggle menu"` in ms and ar, so my earlier "translated label" theory was wrong.
- The attribute is now on the mobile header button (`DashboardLayout.tsx:481`).
- Fallback cascades in `e2e/sheet-proof.ts` and `e2e/mobile-header.ts`. Trigger: `[data-testid=mobile-shell-trigger]` → `header.lg\:hidden button[aria-label="Toggle menu"]` → the only button inside `header.lg\:hidden`. Panel: `[data-testid=mobile-shell-panel]` → walk up from the Sign out button (testid or text `sign out|log keluar|تسجيل الخروج`) to the fixed ancestor, then set the test id on it so every later selector works. Each run prints which level matched.
- `OWNER MANUAL FALLBACK` comment at the top of both scripts.
- `/first-login` handled: if a fixture lands there, the proof opens the role route directly and prints the final URL.
- `npm run e2e:sheet-all` → `e2e/run-sheet-all.ts` runs the proof with `SHEET_ROLE=admin` then `SHEET_ROLE=student` via `process.env` in a tsx wrapper (no shell-specific syntax).

Not done (OWNER RUNS): the proof has never executed. vitest, tsx, docker and browsers fail with EPERM in my sandbox, so no proof value and no screenshot has been seen. The six screenshots are expected at `e2e/screenshots/sheet-{en,ms,ar}-{top,bottom}.png` and are gitignored.

Next sub-item: run `$env:TEST_FIXTURES="1"; npm run e2e:sheet-all`, then read the six screenshots.

### STEP 2 — NOT STARTED
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