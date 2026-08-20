# Browser QA Evidence

The project includes a deterministic keyboard QA script at `scripts/keyboard-qa.mjs`. It was executed against the running local platform using Chromium and completed with five passing checks.

| Journey | Keyboard action verified | Result |
|---|---|---|
| Skip navigation | `Tab` focuses “Skip to content”; `Enter` moves focus to `main#main-content`. | Passed after adding a programmatic focus target to the main landmark. |
| Programme discovery | Focus the programme link and activate it with `Enter`. | Passed. |
| Programme filtering | Focus the search field, type with the keyboard, focus a category filter, and activate it with `Enter`. | Passed. |
| Enrollment validation | Focus and submit the enrollment form button with the keyboard. | Passed; invalid controls and alert feedback are exposed. |
| Founder denial | Open the Founder announcement editor in a clean browser context. | Passed; non-Founder access is denied. |
| Founder sidebar | Founder navigation entries use labelled native button controls provided by `SidebarMenuButton`; this is asserted in the accessibility structure suite. | Passed structural keyboard-semantics check. |

The corresponding automated test suite also confirms Founder-only announcement create, edit, publish-state, and delete procedures. No sample programmes, announcements, submissions, or reviews were inserted during QA.

## End-to-End Journey Record

| Journey | Concrete route and action | Observed outcome |
|---|---|---|
| Discover a programme | `/` → keyboard-activate **Learn More** → `/programs`; enter text in search and activate an age-group filter. | Navigation, keyboard input, and filter activation succeeded. The catalogue intentionally shows no records until the Founder publishes confirmed programme data. |
| Submit a lead | `/enroll` → keyboard-submit the empty form. | Client validation exposes invalid controls and alert feedback without sending an incomplete request. The same form is wired to the server for valid inquiries and enrollments. |
| Manage announcements as Founder | `/admin/announcements` → create or select a record; `/admin/announcements/edit` → change copy/status → save; publish/unpublish or delete as appropriate. | Founder-only server procedures provide create, edit, publish-state, and delete operations. The exact contract is covered by automated tests. |
| Confirm access denial | Open `/admin/announcements/edit` in a clean browser context or use a non-Founder account. | Founder-protected procedure test returns `FORBIDDEN`; the browser QA check confirms the denial screen in a clean context. |
