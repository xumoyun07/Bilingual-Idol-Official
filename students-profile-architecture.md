# Students Profile architecture

## Scope and access boundary

Students Profile is a **Founder-only** module. Its routes are `/admin/students` and `/admin/students/:studentId`; the item exists only in the Founder navigation. Every server operation is behind `founderProcedure`, so Super admin and all other roles are rejected by the server even if they attempt direct transport calls.

The module creates and manages an application record with role `student`. It intentionally does **not** issue a password or enable a login flow: identity-account issuance remains the existing Users module responsibility. This separation avoids accidentally granting access while creating a learning record.

| Layer | Responsibility | Privacy / security control |
|---|---|---|
| `studentProfiles` | Learning record, guardian contact, attendance, level and course fields | Unique `userId`, indexed level/course queries, server-side student-role constraint |
| `studentDocuments` | File metadata and storage key only | File bytes are stored in S3; file data never enters MySQL |
| `studentProfileHistory` | Timestamp, actor and changed field names | Does not store old/new field values or raw document bytes |
| `server/students.ts` | Transactions, profile lifecycle, signature checks and storage hand-off | Supports only PDF/DOCX/JPG/PNG up to 5 MB |
| `server/routers/students.ts` | Validated tRPC contract and Founder RBAC | Zod input bounds, neutral client errors and Audit event integration |
| `StudentsProfile.tsx` | List, detail, CRUD, history and previews | Responsive cards/grid, keyboard-accessible controls and 48px actions |

## Profile data and change history

Student information includes the student and guardian contacts, date of birth, address and private notes. Attendance is represented as attended and total session counts; level and course include current level, course name/code, and optional course dates. The list supports query, level, course, activity status, sort order and server pagination.

Each create/update/document action creates a history entry. Updates retain **only names of changed fields**, the time and the Founder actor; the previous and new personal-data values are deliberately not duplicated in history storage. Module actions also create sanitized Audit Logs events.

## Document handling

The browser reads a selected file and sends it through the protected tRPC contract. The server validates the declared MIME type, base64 envelope, maximum size and a matching file signature before sending bytes to S3. The database records a generated storage key, filename, MIME type, byte count, uploader and timestamp.

| Type | In-profile behaviour |
|---|---|
| PDF | Embedded browser preview plus Open link |
| JPG / PNG | Image preview plus Open link |
| DOCX | Safe metadata card and Open/download link; browsers do not offer a dependable native inline DOCX renderer |

When a document reference or whole student profile is deleted, the metadata row is removed. The storage provider has no delete helper; removing the only stored key makes the object unreachable through the application.

## Operational notes

All timestamps are persisted as UTC-based values and rendered in the browser locale. The module uses server pagination with a default page size of ten records to protect list performance. Its automated tests cover access denial, validated filters/sort/pagination forwarding, profile create/update/delete and document MIME restrictions. The browser QA log records Founder-route rendering, real self-cleaning create/detail/document-preview validation and confirmed cleanup.
