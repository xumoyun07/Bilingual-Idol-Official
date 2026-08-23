# Audit logs module guide

## Who can use it

The Audit logs workspace is restricted to **Founder** and **Super admin** accounts. Founder opens it at `/admin/audit-logs`; Super admin opens it at `/super-admin/audit-logs`. Users without either exact role are denied at the server and redirected by their dashboard shell without receiving private-control information.

| Function | Founder | Super admin |
|---|---:|---:|
| View active events | Yes | Yes, scoped operational events only |
| Search, filter and export | Yes | Yes, against the same scoped records |
| Open archive | Yes | No |
| Restore archived records | Yes | No |
| Run manual 12-month archive | Yes | No |

## Reviewing records

The table displays localised time and also keeps the underlying UTC value visible. It includes the actor user ID and role snapshot, action, target object, IP address, browser, operating system and success state. Use the global search field for partial matches in IDs, descriptions, actions, targets, IP addresses and client-platform labels. Suggestions originate from the already authorised server-side scope, not from a client-side cache.

Use **UTC from** and **UTC to** for an inclusive date range. Role, action, object and result filters are evaluated server-side. The page-size selector supports 10, 25, 50 or 100 rows per page. Records are never fabricated for empty states.

## Exporting

**CSV** and **PDF** buttons export the current source and filters only. CSV values are quoted and spreadsheet formula prefixes are hardened. The PDF is generated on the server from the same filtered, authorised records. Neither export includes stored metadata, session cookies, credential values or private records excluded by the server scope.

## Archive and recovery

Founder can run a manual archive operation. It moves active records older than twelve calendar months into archive storage in a transaction. The archive table retains the original active ID as a unique key so retries do not create duplicate archive rows.

Founder can select archived rows and restore them to active storage. The restore itself is audit-recorded. Since an event retains its original timestamp, a restored event can qualify for a later 12-month archive again; this preserves event-time accuracy rather than rewriting history.

## Scheduled rotation rollout

The secure callback endpoint is implemented at `POST /api/scheduled/audit-log-rotation`, but **no recurring job is active in development**. Before enabling automatic rotation, save and deploy a checkpoint, then explicitly approve a project-level daily UTC Heartbeat job. The endpoint accepts only platform cron identities and has a two-minute bounded HTTP lifecycle; it does not use `setInterval`, `node-cron` or any in-process scheduler.

## Security and data minimisation

Audit metadata is restricted to a small, serialised contextual object. Keys resembling passwords, secrets, tokens, cookies, authorisation values, hashes, credentials, raw request bodies or profile values are redacted before storage. Raw passwords, session tokens, password hashes and dynamic profile values must never be supplied to the event writer. Client user-agent text is truncated; browser and operating-system labels are derived server-side.

The protected audit API remains on the platform’s signed httpOnly session-JWT and typed tRPC transport. This avoids a second authentication scheme while ensuring that validation, RBAC and scope filtering are applied on the server for every list, suggestion, export and lifecycle call.
