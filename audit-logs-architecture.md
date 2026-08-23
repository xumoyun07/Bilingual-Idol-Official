# Audit logs — Architecture and operating model

## Purpose and scope

The Audit logs module records security-relevant and operational events performed through the application. It is intentionally isolated into storage, server and client layers. The module is available only to the private control account and to Super admin accounts through their dedicated dashboards. It never records passwords, session tokens, complete request bodies, password hashes or unredacted dynamic profile values.

> Audit events are evidence records, not a secondary copy of application data. Each event keeps the minimum contextual information necessary to reconstruct *who did what, to which object, when and with what outcome*.

| Layer | Responsibility |
|---|---|
| Storage | `auditLogs` and `auditLogArchives` preserve the event envelope and only sanitized metadata. Both tables are indexed for their query paths. |
| Server | `server/audit.ts`, `server/routers/audit.ts` and `server/scheduledAuditRotation.ts` implement typed events, scope enforcement, exports and lifecycle operations. |
| Client | `/admin/audit-logs` and `/super-admin/audit-logs` provide a searchable, paginated and responsive audit workspace. |

## Access and privacy matrix

| Capability | Founder | Super admin |
|---|---:|---:|
| Read active audit logs | Yes | Yes, excluding private-control activity and targets |
| Search, filter and export active logs | Yes | Yes, within the same scoped dataset |
| View archived logs | Yes | No |
| Restore archived events | Yes | No |
| Trigger archive rotation manually | Yes | No |
| Configure/inspect rotation schedule | Founder after production deployment | No |

The Super admin scope deliberately suppresses events caused by the private control account and events targeting that account. This preserves the existing private control-account isolation contract while still providing a complete operational audit trail for the roles visible to Super admin.

## Event envelope and data minimisation

Each active record stores the event timestamp, numeric actor user ID, actor role snapshot, action code, target type and opaque target ID, target role snapshot, a human-readable description, outcome, source IP address, browser and operating-system labels, a truncated user-agent, and a small sanitized JSON metadata object. Fields used in filtering are indexed: timestamp, actor ID and role, action, target type and target role, success state and IP address.

The event writer owns sanitization. Its denylist removes values whose key refers to a password, secret, token, cookie, authorization header, hash, or raw dynamic profile value. Metadata is size-limited and must be serializable. The application records the *presence* of an update and its target, not sensitive replacement values.

## Query, search and export contract

Audit list calls use page/size bounds, typed UTC date range and validated filters. Global partial search is applied server-side across actor ID, action, target identity, description, IP address, browser and operating system. Search suggestions are computed only from values already within the caller’s authorised audit scope. The interface renders persisted UTC dates in the current browser locale while retaining the UTC value in the table.

CSV and PDF exports reuse the same query and scope filter as the on-screen table. The export serializers emit only the visible audit columns; sanitized metadata, session identifiers and hidden/private records are not included. PDF is generated server-side as a text-based document so exports are deterministic and do not execute client-side content.

## Archive lifecycle

Audit events older than twelve calendar months are copied to `auditLogArchives` in a database transaction, then removed from the active table. The archive table keeps the immutable original event ID and archive timestamp with a unique index, making the job idempotent. A Founder-only restore procedure moves selected archived records back to active storage. Super admin accounts cannot query archives, restore them, or trigger rotation.

The application exposes the cron-authenticated `POST /api/scheduled/audit-log-rotation` handler and a Founder-only manual fallback. It checks the platform Heartbeat identity (`isCron` and `taskUid`), returns JSON diagnostics on failure, and uses the archive table’s unique `originalLogId` for retry-safe idempotency. **No recurring Heartbeat job has been created yet.** After this implementation checkpoint is deployed, the project owner must explicitly approve creation of a project-level daily UTC job and its returned task UID must be recorded in durable project configuration. No in-process timer is used.

## Security controls and verification

The module follows the existing signed, httpOnly session-JWT and protected tRPC HTTP transport rather than introducing a parallel REST wrapper. This keeps the existing application authentication and input-validation architecture intact while retaining the required protected API boundary. Every server procedure checks exact role scope before querying, exporting, restoring or rotating. Each audit-module view, suggestion search, export, restore and archive action creates a fresh audit event without recursively logging the internal write. Founder and Super admin Users CRUD and Founder Field Builder mutations also write best-effort sanitized events after completion, including safe failure markers.

Current automated coverage verifies metadata redaction, client-context parsing, exact-role denial, scoped API contracts, CSV formula hardening, export scope hand-off, manual archive/restore restriction and the cron-only handler. Browser QA and creation of the production Heartbeat job remain explicit release gates.
