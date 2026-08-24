# Public Demonstration Media Architecture

## Scope

This feature adds replacement-ready demonstration media **only to public website routes**. It does not alter the universal sign-in page, personal dashboard, Super admin workspace, or any other user-facing dashboard surface. A separate founder-only control route manages the inventory, while all visitor-facing routes use a read-only public media query.

The supplied classroom photograph is the active Home Hero background. The optional Hero video slot remains in the inventory as a future replacement point, but no video is currently published.

## Inventory

| Slot | Public placement | Asset type | Responsive behaviour |
|---|---|---|---|
| `home_hero_poster` | Home Hero background | WebP/JPEG image | Active supplied classroom photo; `object-fit: cover` and responsive crop preserve readable Hero copy. |
| `home_hero_video` | Reserved future Home Hero replacement | Muted MP4 loop | Not published at present. If enabled later, it is decorative, muted, inline and cannot block the first action. |
| `home_task_programmes` | Home programme task card | WebP/JPEG image | Fixed 16:10 image region with concise alternative text. |
| `home_task_contact` | Home contact task card | WebP/JPEG image | Fixed 16:10 image region with concise alternative text. |
| `home_task_account` | Home account task card | WebP/JPEG image | Fixed 16:10 image region with concise alternative text. |
| `programmes_listing` | Programme discovery card/list visual | WebP/JPEG image | Responsive card image with native lazy loading. |
| `programme_detail` | Programme detail visual | WebP/JPEG image | Full-width responsive editorial image, lazy loaded below the heading. |

## Data and Access Model

The `publicMedia` record stores a unique slot, public-purpose label, alternative text, MIME type, byte size, storage key, public URL and status. Actual bytes are stored through the existing platform storage helper; the database holds only metadata and the key. Removing a record removes its application reference, which makes the storage object unreachable.

| Operation | Public visitor | Standard user | Super admin | Founder |
|---|---:|---:|---:|---:|
| Read published media metadata | Allowed | Allowed | Allowed | Allowed |
| Upload a replacement | Denied | Denied | Denied | Allowed |
| Update description, slot or publish state | Denied | Denied | Denied | Allowed |
| Remove a media reference | Denied | Denied | Denied | Allowed |

Every management mutation uses the existing `founderProcedure`, validates a narrow allowlist of image/video MIME types, checks base64 payload structure, file size and binary signatures, and writes a privacy-minimised Audit Logs event. Rejected callers never receive implementation details.

## Performance and Accessibility Rules

Images are constrained to WebP/JPEG and uploaded with a 3 MB maximum. The currently active Hero is a responsive WebP photograph. The reserved future Hero video is constrained to MP4 and 12 MB maximum, is muted, plays inline, has no audio dependency and uses the Hero photo as its poster. Card media is lazy loaded except for the Hero photo. Every public image has founder-authored alternative text; any future decorative Hero video uses `aria-hidden` because the heading and supporting copy communicate the page purpose.

## Replacement Workflow

The founder-only Media route lists the fixed slots and current files. The account holder can upload a compliant replacement, edit its text/status and remove its public reference. If a slot has no published file, public routes keep their content-first layout without an invented fallback image. This allows the demonstration media to be replaced with confirmed centre assets later without changing public page code.
