# News Module Architecture

## Public Experience

The public header receives a **News** destination. `/news` shows only published posts in descending publication order. Each result is an image-led card with a category label, title, excerpt, publication date and an explicit “Read update” action. Selecting a card or its action opens an accessible modal with the full post, its image description, date and body. No fabricated news records are seeded: the empty state is displayed until an authorised editor publishes a real post.

The public list contract always uses a page size of **6**. Desktop layout is a three-column by two-row grid; tablet and mobile progressively collapse the grid without changing page size. Pagination resets only when a public page is loaded, and exposes disabled Previous/Next controls plus numeric pages and `aria-current="page"` for the active page.

| Requirement | Contract |
|---|---|
| Card image | Optional author-supplied image metadata attached to each post; a neutral text-first card is used only when no image is published. |
| Post details | Modal reads the detail from the public paginated row, so no hidden records are fetched or disclosed. |
| Page size | Server validates `pageSize = 6`; client cannot request a larger count. |
| Ordering | `publishedAt DESC`, then `createdAt DESC`. |
| Empty state | No made-up notices, events or announcements. |

## Founder-Only Publishing

The announcement table receives optional image URL, S3 key and image alt text fields. The dedicated `news` router provides public read-only pagination, plus founder-only list, create, update, publish-state, image upload and delete procedures. Image upload follows the established storage pattern: images are validated by MIME, size and signature; actual bytes live in S3 while their metadata is stored in the database. Each mutation emits a scoped audit event.

The founder workspace gains a **News** entry and management route. No other role sees the route, navigation entry, writer controls or mutation procedure. Public error and empty-state copy disclose no restricted workspace details.

## Accessibility and Security

Card controls are semantic buttons with visible focus. The modal has a labelled title, close button, Escape support and scroll-safe content. Images require author-provided alt text when uploaded. The public router contains no create/update/delete procedures, and founder-only mutations reject other authenticated roles before database or storage work begins.
