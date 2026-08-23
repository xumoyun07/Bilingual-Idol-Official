# Dashboard navigation QA

## Most-specific active route — 2026-08-23

In an authenticated Founder session, `/admin/users` showed **Users** as the only dark active sidebar item. Dashboard remained inactive and the Users icon received the active apricot colour.

The subsequent `/admin/students` check showed **Students Profile** as the only dark active item, with the same active icon treatment; Dashboard and Users remained inactive. The fixed header label matched the current module in both observations.

The self-cleaning Super admin E2E then passed six checks. On `/super-admin/users`, Users alone had the active navy background and apricot icon while Dashboard/Audit logs were inactive. On `/super-admin/audit-logs`, Audit logs alone received the same active treatment. The QA account was removed by the harness.

After removing the desktop collapse control, Founder desktop review confirmed that the fixed expanded sidebar retained branding and navigation while no Toggle navigation button was rendered. The Super admin self-cleaning QA then passed eight checks, including absence of the desktop collapse control and an accessible mobile `Toggle Sidebar` trigger that opens the mobile navigation at 390×844.
