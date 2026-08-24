# News Module QA Record

## Delivered Scope

The public header now includes **News**. The public `/news` route renders only currently published posts, ordered by publication date, with image-led cards when an authorised editor has supplied an image. Existing centre records were preserved; no test, placeholder or invented news records were written to the database.

Each public page is server-limited to six posts. The interface presents a three-column, two-row layout at desktop width and progressively collapses at narrower widths. Published cards open a labelled detail dialog, which closes via the dialog close control or Escape. Previous/Next controls are disabled at their relevant boundaries, and numeric buttons identify the active page with `aria-current="page"`.

| Area | Evidence | Result |
|---|---|---|
| Public navigation | Primary News link is present, active on `/news`, and included in desktop/mobile shared navigation. | Passed |
| Public page contract | `news.publicPage` returns `rows`, `total`, `page`, `pageSize` and `totalPages`; the database helper fixes `pageSize` at 6. | Passed |
| Card modal | Browser QA opened a real published card, found the dialog, then closed it with Escape. | Passed |
| Responsive layout | Browser checks found no horizontal overflow on `/news` at 1440×900, 768×1024 and 390×844. | Passed |
| Founder publishing | Dedicated `/admin/news` manager supports real post create, edit, publish/draft state, image alt text, image replacement/removal and delete confirmation. | Passed |
| Access control | Direct router tests deny unauthenticated, admin and super-admin callers from News management; only the founder procedure can mutate records. | Passed |
| Image validation | Publisher accepts JPEG, WebP or PNG up to 3 MB only after base64, MIME and signature validation; metadata persists in the database and bytes use project storage. | Passed |
| Regression | `pnpm test`: 17 files / 65 tests; TypeScript and whitespace checks passed. Public browser QA: 25 checks. | Passed |

## Operational Notes

The public cards do not invent content when an image has not yet been supplied: they use a category icon surface. Authors should provide useful image descriptions for every uploaded card image. The image-object key remains in the post record; removing a post drops the database reference, and storage cleanup follows the platform storage model.

The actual number of cards and pagination buttons reflects published centre content. A page with fewer than six published posts correctly shows only its available cards and omits unnecessary navigation. The test suite verifies the seven-record pagination contract deterministically without inserting test posts into the production database.
