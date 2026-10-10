# OPERATING RULES

R1 Secrets: never print env values, hashes, passwords or real people's emails. Scanners print file:line and match type only.
R2 Scope: no public site code (public pages, PublicLayout, public routers, public locale text), no BackgroundCircleField. Dashboards, admin routers, tests, scripts and docs are in scope.
R3 Code first, commit, then prove. One commit per item. After each commit run npx tsc --noEmit (baseline 4) and npm run check:e2e (0 errors).
R4 Sandbox: vitest, tsx, docker and browsers fail with EPERM for you. Do not try workarounds. Mark such checks "OWNER RUNS", write the exact command under "Owner commands" in docs/HANDOFF.md, and never claim a result you did not see.
R5 Checkpoints: tag step-N-start before each step. Before any DDL take a verified dump (docker cp variant, password via MYSQL_PWD inside the container, never printed).
R6 Budget: when low, finish the current sub-item, commit, update docs/HANDOFF.md (done, not done, owner commands, next sub-item) and stop. On "continue" read HANDOFF.md and resume at the next sub-item without asking again.
R7 Blocked twice on the same thing: use the listed fallback, record it in HANDOFF.md, move on. Ask the owner only if the decision list (R8) does not cover it.
R8 Decisions made (do not ask): admin sees only modules its server procedures allow; founder-only: User Accounts, Audit & Security; prices are set/changed/cancelled by founder, super_admin and admin; currency MYR; no prices in public code; programs.fees must never hold amounts; test accounts only through the test helper, always deleted, print the remaining count (must be 0).