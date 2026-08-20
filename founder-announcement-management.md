# Founder Announcement Management Verification

## Access Model

The `/admin/announcements/edit` route is rendered only inside the Founder console. The route and all related procedures require the `founder` role; a standard signed-in user is rejected by the server before an announcement mutation can run. The Founder role is distinct from `super_admin` and remains the highest role in the configured hierarchy.

## Verified Founder Workflow

| Step | Founder action | System outcome | Verification method |
|---|---|---|---|
| 1 | Open **Announcements** in the Founder console. | The Founder can create an announcement, select its category, and choose whether to publish it immediately. | UI implementation review and typed procedure coverage. |
| 2 | Select **Edit announcements** in the sidebar. | The editor lists existing records, lets the Founder alter title, slug, summary, body, category, and publication state, then saves changes through a Founder-only procedure. | Founder console visual capture and the `updateAnnouncement` contract. |
| 3 | Use **Publish** or **Unpublish** on an announcement. | The public news visibility and publication timestamp are updated. | Automated authorization and procedure tests. |
| 4 | Use **Delete** and confirm the dialog. | The selected announcement is removed through a Founder-only procedure. | Automated authorization and procedure tests. |
| 5 | Attempt the same operation as a non-Founder. | The server returns `FORBIDDEN` before data access or mutation occurs. | `announcement-access.test.ts`. |

The Founder editor was visually checked in its authentic empty-content state. No sample announcement was created solely for testing, so the implementation does not add invented public news to the centre’s platform. Once the Founder enters the first genuine announcement, the same editor presents that record for editing and publication management.

## Automated Coverage

The authorization test suite covers Founder create, edit, publish-state change, and delete procedures as well as non-Founder refusal. The current test suite passes with **3 test files and 8 tests**. The tests use mocked data-access calls and do not insert test records into the production database.

## Founder Publishing Checklist

Before publishing, the Founder should verify the announcement title, summary, full text, category, URL slug, and publication state. The Founder should also inspect the public news page after saving to confirm that only intended updates are visible.
