# Bilingual Idol Learning Centre Platform

A professional, responsive learning-centre platform for **Bilingual Idol Learning Centre**. The application combines a public information site with authenticated role-based workspaces for centre operations, teachers and students. It is designed around a calm royal-blue visual system, accessible interaction patterns, server-side authorization and storage-backed media.

> This repository contains application source code, database schema and migrations, automated tests, QA notes and product documentation. Credentials, environment files and local runtime data are intentionally excluded.

## Product scope

The platform provides a public-facing website with programme information, About, News, Contact and enquiry flows. Authenticated users enter through one email/password login and are routed to the workspace permitted by their role. Internal workflows are implemented with typed server procedures, database-backed records and responsive dashboard components.

The current teacher scope includes read-only access to assigned classes, date-filtered schedule views, class details, attendance recording, draft and published results, and student-facing attendance summaries. Class creation, enrolment and teacher assignment remain administrative workflows and are not exposed to teachers.

## Main capabilities

| Area | Included capability |
|---|---|
| Public website | Home, About, Programmes, News, Contact and enquiry journey |
| Authentication | Email/password login, secure session cookie and role-based redirects |
| Operations | Protected administrative workspaces, user governance and audit logging |
| Teacher workspace | Own schedule, class details, attendance, grades and result publication |
| Student workspace | Personal dashboard and live attendance percentage when records exist |
| Content and media | Storage-backed public media, news cards and responsive media surfaces |
| Data layer | Drizzle schema, MySQL/TiDB-compatible queries and tracked migrations |
| Quality | Vitest coverage, TypeScript checks, responsive QA notes and accessibility checks |

## Technology stack

The project uses React 19 and Vite on the client, with Tailwind CSS 4 and Radix-based UI primitives. The server is an Express application using tRPC 11 for typed application procedures. Data access is implemented with Drizzle ORM and MySQL-compatible storage. Authentication uses the platform session context and signed httpOnly cookies. S3-compatible project storage is used for media and user-uploaded files; file bytes are not stored in database columns.

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI, Wouter |
| API | Express 4, tRPC 11, Zod validation, SuperJSON |
| Database | Drizzle ORM, MySQL/TiDB, schema-first migrations |
| Auth | Platform session authentication, JWT-backed session handling, role guards |
| Storage | S3-compatible project storage with server-side helpers |
| Testing | Vitest, TypeScript compiler, Playwright-based QA scripts |
| Build | Vite production build and esbuild server bundle |

## Architecture

The repository follows a typed full-stack structure:

```text
client/
  src/
    components/       Shared layouts and UI components
    pages/            Public, authenticated and role-specific pages
    contexts/         Theme and application contexts
    hooks/            Reusable client hooks
    lib/trpc.ts       Typed tRPC client
    App.tsx           Route registry

drizzle/
  schema.ts           Database tables, enums and indexes
  migrations/         Generated migration history

server/
  _core/              Authentication, context, Express and tRPC infrastructure
  routers/            Feature-specific typed procedures
  db.ts               Shared database helpers
  teacher.ts          Teacher-owned schedule, attendance and grade logic
  teacherPortal.ts    Teacher REST endpoint handlers
  studentAttendance.ts Student attendance aggregation

shared/
  _core/              Shared error and platform types

*.md                  Architecture, QA, design-system and handover documentation
```

The preferred request path is **React → typed tRPC procedure → server helper → database/storage**. The teacher portal also exposes explicit REST paths where an external contract requires them:

```text
GET  /portal/teacher/class-sessions
GET  /portal/teacher/class-sessions/:id
GET  /portal/teacher/class-sessions/:id/attendance
POST /portal/teacher/class-sessions/:id/attendance
```

Every teacher query receives the authenticated server-side user ID. A caller cannot select another teacher's class by changing an ID in the URL or request body; foreign class sessions are concealed as not found by the REST detail contract.

## Roles and access boundaries

Access is enforced on the server, not only by hiding frontend navigation. Exact-role procedures reject users outside their permitted role, and feature helpers repeat ownership checks at the database query boundary.

| Role | Workspace principle |
|---|---|
| `student` | Personal dashboard and student-owned information, including attendance summary |
| `teacher` | Assigned class sessions, attendance and grade workflows only |
| `marketing` | Role-specific workspace permitted by the centre |
| `admin` | Administrative workflows permitted by the centre |
| `super_admin` | Higher-level administrative governance with restricted peer-role controls |
| Privileged management | Server-only controls for platform governance and sensitive operations |

Teacher endpoints do not create classes, assign teachers, manage enrolments or access administrative user-management APIs. Student attendance summary queries use the authenticated student's own ID and are unavailable to other roles.

## Attendance model

Attendance records are unique per class session and student. Saving a mark again intentionally **updates the existing record** rather than creating a duplicate. The method is recorded as either `manual` or `qr`; teacher marking defaults to `manual`. `present` and `late` count as attended, while cancelled sessions are excluded from the student's live percentage calculation.

The student dashboard displays an honest empty state when no completed or past non-cancelled sessions exist. No fabricated attendance, user, enrolment or review data is included in the repository or database.

## Local development

### Prerequisites

Use Node.js 22 or a compatible current LTS release, pnpm 10+, and a configured MySQL/TiDB-compatible database. The platform runtime supplies the required authentication, database and storage environment values in managed deployments.

### Install dependencies

```bash
pnpm install
```

### Configure environment

Create a local `.env` from your deployment or development environment. Do not commit it. The application expects platform-provided values such as `DATABASE_URL`, `JWT_SECRET`, OAuth configuration, built-in API configuration and storage configuration. Never place credentials in source code, README files or test fixtures.

### Run the development server

```bash
pnpm dev
```

The development server starts the Express application with the Vite development bridge. Do not hardcode a production port in application code.

### Database workflow

Schema changes follow a schema-first process:

```bash
pnpm drizzle-kit generate
```

Review the generated SQL before applying it through the managed database workflow. Existing migrations must remain ordered and non-destructive. The repository's package script `pnpm db:push` is available for environments where direct Drizzle migration execution is appropriate.

### Build and production start

```bash
pnpm build
pnpm start
```

## Quality checks

Run the standard checks before opening a pull request or creating a release checkpoint:

```bash
pnpm check
pnpm test
pnpm build
```

`pnpm check` runs the TypeScript compiler without emitting files. `pnpm test` runs the Vitest suite. The project also contains Playwright-oriented QA scripts under `scripts/` and route-specific QA documentation. Browser-based screenshots complement, but do not replace, unit and integration tests.

## Media and storage rules

Large or user-provided media must use project storage. Do not add images, videos, audio, documents or archives to `client/public/` or `client/src/assets/`. Store only small configuration assets in `client/public/`, and reference storage-backed assets through their returned project URLs. Database records should contain file metadata and storage references, never file bytes.

Supported student document formats are PDF, DOCX, JPG and PNG. Upload handlers validate MIME type, file signature, file size and sanitized file names before storing metadata and bytes separately.

## Security principles

The application uses server-side role guards, authenticated ownership predicates, input validation and privacy-preserving not-found responses for foreign resources. Secrets are supplied through environment configuration and are not committed. Audit records minimize sensitive values and explicitly sanitize password, token and authorization fields. Destructive data operations require protected procedures and confirmation-oriented UI flows.

When adding a new feature, preserve these rules:

1. Validate every external input with Zod or an equivalent server-side validator.
2. Derive identity and ownership from the authenticated server context, never from a client-provided role or user ID.
3. Add or update database schema and migration SQL before relying on new columns or tables.
4. Store file bytes in project storage and only references/metadata in the database.
5. Add Vitest coverage for authorization denial, ownership isolation, validation and success paths.
6. Keep secrets, local logs, browser state, generated build output and dependency directories out of Git.

## Documentation map

The repository includes focused documentation for the design system, responsive QA, public media, audit logs, student profiles, teacher T1 verification and frontend architecture. Start with the relevant document before changing a subsystem; the documents record decisions that are not obvious from a single component.

| Document | Focus |
|---|---|
| `design-system.md` | Core visual tokens and component guidance |
| `responsive-report.md` | Responsive validation matrix and known constraints |
| `teacher-t1-qa.md` | Teacher class-session API and UI verification |
| `audit-logs-architecture.md` | Audit storage, access and lifecycle architecture |
| `students-profile-architecture.md` | Student profile model and document workflow |
| `minimal-frontend-architecture.md` | Frontend foundations and route composition |
| `todo.md` | Historical implementation tracker and deferred acceptance gates |

## Repository workflow

Keep commits focused, run checks before pushing, and document any deferred acceptance gate rather than inventing test data or test findings. For production deployment, use the platform's managed publish workflow after creating a verified project checkpoint.

## License and ownership

This repository is maintained for Bilingual Idol Learning Centre. Licensing, redistribution and production data policies should be confirmed by the centre owner before external distribution.
