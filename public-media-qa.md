# Public Media Integration — QA Report

## Scope and Result

The public website now uses the supplied classroom photograph as an optimised Hero background and as the source for responsive task-card and programme imagery. The active Home Hero is a photograph rather than a video by the owner's confirmed decision. The account dashboard, staff dashboards and their workflows were not redesigned or otherwise changed; the only protected addition is the owner-only **Media** route used to manage public assets.

| Area | Implemented behaviour | Result |
|---|---|---|
| Home Hero | Optimised WebP classroom photo with content-first contrast overlay. | Passed on desktop and mobile visual review. |
| Task cards | Three responsive card crops, each with concise alternative text and lazy loading. | Passed on desktop and mobile visual review. |
| Programme routes | Responsive listing and detail imagery, loaded from published media metadata. | Passed; unavailable programme data retains its existing honest empty state. |
| Management | Upload, replace, edit publication/alternative text and remove public media references. | Founder-only tRPC procedures and responsive manager UI passed. |
| Non-public surfaces | Universal sign-in, personal dashboard and other protected workspaces. | No visual or logic changes introduced. |

## Performance and Loading Evidence

All active demonstration assets were converted to WebP before being placed in persistent project storage. The six-file media inventory totals **267,710 bytes**: the Hero photo is 74,114 bytes; three task-card crops are 27,196–33,724 bytes each; and the programme images are 50,230–51,290 bytes each. The Hero image receives high fetch priority because it is immediately visible. Card and programme images use native lazy loading and asynchronous decoding. No local media files were added to the application bundle.

| Check | Evidence | Result |
|---|---|---|
| Asset optimisation | Shell size audit of the six uploaded WebP files. | Passed: 267,710 bytes total. |
| Desktop responsiveness | Screenshot review of `/`, `/programs` and programme-detail fallback at 1280px. | Passed: photo framing and content remained readable; no horizontal overflow. |
| Mobile responsiveness | Screenshot review of `/` and `/programs` at 390px. | Passed: Hero copy, media crop, cards and filters stack without horizontal overflow. |
| Public journey regression | Existing browser scenario suite across 1440px, 768px and 390px routes. | Passed: 23 checks, including programme discovery and mobile navigation. |
| Runtime diagnostics | Fresh development and browser log check after media QA. | Passed: no fresh error signatures found. |

## Access-Control Verification

Public visitors can read only published asset metadata required to render public pages. Management actions are protected by the existing owner-only procedure; unauthenticated users, standard administrators and Super administrators are denied before any media operation occurs. Binary upload checks are enforced server-side for MIME type, base64 shape, file size and file signature. Successful and failed management actions write privacy-minimised audit events.

| Test | Evidence | Result |
|---|---|---|
| Public read surface | `media.publicList` returns published metadata only. | Passed. |
| Denial paths | `media.list` and `media.remove` tested for unauthenticated, admin and Super administrator callers. | Passed: all denied. |
| Owner upload path | Valid image upload test with mocked persistent storage, typed metadata and audit path. | Passed. |
| File validation | Video slot with image payload rejected before storage. | Passed. |
| Founder browser flow | Self-cleaning account reached `/admin/media`, loaded a public preview, had active Media navigation and no cross-workspace access. | Passed: 3 checks. |
| Mobile manager | 390px manager opened its accessible drawer and did not overflow. | Passed. |

## Full Regression Summary

The final automated run passed **16 Vitest files and 59 tests**, followed by successful TypeScript checking and a clean whitespace validation. The scheduled Audit rotation suite deliberately logs a controlled 500-path error as part of its expected test scenario; it did not fail the test run.

## Operational Handover

The authorised owner can now use **Media** in the protected workspace to replace the Hero photo or any card/programme image with a compliant asset. The future Hero video slot is intentionally retained but unpublished. Publishing a later MP4 will activate the existing decorative video rendering path while preserving the image poster fallback; no public page rewrite is required.
