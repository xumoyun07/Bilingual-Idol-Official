# Architectural Implementation Plan: Authentication & Onboarding Workflows (Revised)

This revised plan incorporates crucial feedback on single-use OTP burning at successful login, standardized storage in `passwordHash`, administrative password resets with RBAC, session-duration differentiation, and explicit audit trail constraints.

---

## 💾 1. Database Schema Changes & Migration Plan

We will add tracking columns to the existing `users` table to manage single-use OTP states, brute-force locking, and session versions. All monetary fields in `enrollments` are explicitly confirmed as stored in **sen** (cents), matching the `payments` table (e.g. 75000 for RM 750.00).

### Proposed Drizzle Schema Changes (`/drizzle/schema.ts`)
```typescript
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }), // Stores the generated login: nameMMYYYY@bilc.my (admin-editable)
  passwordHash: text("passwordHash"), // Stores standard scrypt hash (set to NULL or disabled hash upon OTP burn)
  isActive: boolean("isActive").default(true).notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "student", "teacher", "marketing", "admin", "super_admin", "founder"]).default("student").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),

  // Secure Workflow Columns:
  sessionVersion: int("sessionVersion").default(1).notNull(), // Incremented to atomically revoke previous sessions
  isOtp: boolean("isOtp").default(false).notNull(), // Flag indicating if the password currently in passwordHash is an unburned single-use OTP
  otpCreatedAt: timestamp("otpCreatedAt"), // Expiration limit tracking (7 days)
  failedAttempts: int("failedAttempts").default(0).notNull(), // Sequential failed login attempts to lock account
});

export const enrollments = mysqlTable("enrollments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  programId: int("programId").notNull(),
  status: mysqlEnum("status", ["pending", "active", "completed", "suspended", "cancelled"]).default("pending").notNull(),
  
  // Monetary fields explicitly stored in sen (RM 1.00 = 100 sen)
  agreedPrice: int("agreedPrice").default(0).notNull(), // amount in sen
  registrationFee: int("registrationFee").default(0).notNull(), // amount in sen
  placementTestFee: int("placementTestFee").default(0).notNull(), // amount in sen
  visaFee: int("visaFee").default(0).notNull(), // amount in sen
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

### Raw SQL DDL Migration Statement
```sql
ALTER TABLE `users` 
ADD COLUMN `sessionVersion` INT NOT NULL DEFAULT 1,
ADD COLUMN `isOtp` TINYINT(1) NOT NULL DEFAULT 0,
ADD COLUMN `otpCreatedAt` TIMESTAMP NULL DEFAULT NULL,
ADD COLUMN `failedAttempts` INT NOT NULL DEFAULT 0;

ALTER TABLE `enrollments`
MODIFY COLUMN `agreedPrice` INT NOT NULL DEFAULT 0 COMMENT 'amount in sen',
MODIFY COLUMN `registrationFee` INT NOT NULL DEFAULT 0 COMMENT 'amount in sen',
MODIFY COLUMN `placementTestFee` INT NOT NULL DEFAULT 0 COMMENT 'amount in sen',
MODIFY COLUMN `visaFee` INT NOT NULL DEFAULT 0 COMMENT 'amount in sen';
```

### Migration Impact on Existing Data
* **No Downtime & Backward Compatibility**: Existing students, teachers, and founders will default to `sessionVersion = 1`, `isOtp = false`, and `failedAttempts = 0`. Their password hashes remain unchanged, and they will log in directly via the standard unrestricted 1-year flow.

---

## 🛠 2. Implementation Modules

### Module A: Server-Side Login Generator (`/server/db.ts`)
* **Login Format**: `<latin_name><MM><YYYY>@bilc.my`, aligned to the `Asia/Kuala_Lumpur` timezone during the user creation transaction.
* **Transliteration**: Standard transliteration rule maps non-Latin names to equivalent Latin characters.
* **Collision Resolution**: Performs local uniqueness queries. If a collision is found, appends incremental suffixes (e.g., `_1`, `_2`).
* **Credentials Flow**: This generated login is saved in `email` (as their login identity), while their actual target communication address is saved in `contactEmail` of the student profile.
* **Admin Modification**: Administrators can edit the generated login if necessary.

### Module B: Standardized OTP Storage, Burning, & Rate-Limiting (`/server/userAuth.ts`)
* **Single Standard Storage**: OTPs are generated as strong temporary strings and saved *exclusively* inside the standard `passwordHash` field as a scrypt hash. No secondary column is used to store hashes.
* **Atomic Burn at Login (CRITICAL)**: In the single database transaction where the user successfully authenticates using their OTP:
  1. `isOtp` is updated to `false`.
  2. `passwordHash` is set to `NULL` (or a deactivated stub hash).
  * This burns the OTP atomically in the DB. Once authenticated, if they close their browser or sign out, they cannot log in again with the same temporary credential.
* **Expiration**: Rejects the login attempt if `isOtp = true` and `otpCreatedAt` is older than 7 days.
* **Rate-Limiting (Brute-Force Guard)**: Every failed login increments `failedAttempts`. If `failedAttempts >= 5`, any subsequent authentication attempt is blocked for 15 minutes. Successful login resets the counter to `0`.

### Module C: Restricted Session Tokens & Lifespans
* **Restricted Session**: Applies **ONLY** when logging in with a temporary OTP:
  * Generates a restricted JWT token (`isRestricted: true` in payload).
  * Forces maximum token expiration to **24 hours** (`24h`).
  * Cookie Lifespan rules:
    * Unchecked "Remember Me": Set without `maxAge` (Session Cookie, deleted on browser close).
    * Checked "Remember Me": Set with `maxAge: 24h` (24 hours).
* **Standard Session**: Standard logins retain their convenient **1-year session lifespan** (365 days) with normal cookie persistence.
* **Authorization Guard (`/server/_core/trpc.ts`)**:
  * If request context carries `user.isRestricted = true`, throws a `403 FORBIDDEN` for all endpoints EXCEPT:
    * `auth.me` (to fetch session restriction state)
    * `auth.logout`
    * `users.formSchema` / onboarding-related schema helpers
    * `auth.completeOnboarding` (Stage B onboarding + permanent password)

### Module D: First Login Onboarding Submission
* **Atomic Completion (`auth.completeOnboarding`)**:
  1. Collects and validates the permanent password (must be strong, hashes using scrypt).
  2. Persists Stage B profile fields.
  3. Increments `sessionVersion` on the user record to atomically revoke other sessions.
  4. Updates `passwordHash` with the permanent hash, clears OTP metadata.
  5. Returns a standard unrestricted JWT session token.

### Module E: Staff Password Reset Module (RBAC & Audit Logging)
* **RBAC Controls**: Only authorized roles can invoke password resets:
  * `founder` and `super_admin` can reset passwords of `admin`, `marketing`, `teacher`, `student`, and `user`.
  * `admin` can reset passwords of `marketing`, `teacher`, `student`, and `user` (they cannot reset passwords of other `admin`s, `super_admin`s, or `founder`s).
  * `marketing`, `teacher`, `student`, and `user` have no rights to reset passwords.
* **Functional Reset Workflow**:
  1. Generates a new random temporary password.
  2. Commits scrypt hash of the new temporary password to `passwordHash`, sets `isOtp = true`, `otpCreatedAt = NOW()`, and resets `failedAttempts = 0`.
  3. Increments target's `sessionVersion` to instantly invalidate all other active sessions for that user.
  4. **Strict Audit Logging**: Records an entry in `auditLogs` containing the ID of the resetting staff member, target student/user, and a status message. **No plain text passwords or hashes are ever saved in logs or audit logs.**
  5. **Rate-Limiting**: Restricts reset frequency to once every 30 seconds per target user to prevent staff double-click or DoS abuse.

### Module F: Localized Email Delivery Stub
* **EmailProvider Interface**: Standard stub logging during development. In production, raises a clear descriptive error if a real SMTP/API delivery provider is missing.
* **Language Templates**: Supports `en`, `ms`, and `ar`. Inside Arabic templates, the Login and Password strings are wrapped inside `<bdi dir="ltr">` to guarantee correct directionality in RTL clients.

---

## 📐 3. System Architecture & Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT                                    │
│                                                                        │
│  Standard Login Form (autoComplete="username")                        │
│         │                                                              │
│         ▼                                                              │
│  [POST] /api/trpc/auth.login                                           │
└─────────┬──────────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              SERVER                                    │
│                                                                        │
│  1. Check brute-force (failedAttempts >= 5)                           │
│  2. Verify credentials using scrypt                                    │
│  3. If user has isOtp === true:                                        │
│     ┌────────────────────────────────────────────────────────────────┐ │
│     │ TRANSACTION (Atomic Burn):                                     │ │
│     │ - Set isOtp = false                                            │ │
│     │ - Set passwordHash = NULL (burned)                             │ │
│     └────────────────────────────────────────────────────────────────┘ │
│  4. Generate restricted token (expires 24 hours, isRestricted: true)   │
│  5. Set restricted cookies (maxAge: 24h or Session)                    │
└─────────┬──────────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ONBOARDING SCREEN (Stage B)                      │
│                                                                        │
│  - Fill Stage B Onboarding Form                                        │
│  - Enter strong permanent password                                     │
│  - Submit [POST] /api/trpc/auth.completeOnboarding                     │
└─────────┬──────────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              SERVER                                    │
│                                                                        │
│  1. Save permanent password scrypt hash to passwordHash                │
│  2. Save Stage B profile fields                                        │
│  3. Increment sessionVersion to invalidate other restricted sessions    │
│  4. Upgrade session cookie to unrestricted (1-year lifespan)           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🧪 4. Verification & Testing Strategy

To verify compliance with the security requirements, we will implement the following automated test cases without logging passwords or hashes:

1. **Login Generation Tests**:
   * Verify transliteration of Cyrillic/Arabic names to Latin.
   * Verify MMYYYY appended correctly using the current Asia/Kuala_Lumpur date of creation.
   * Verify incremental suffixes (`_1`, `_2`) on suffix collision.
2. **OTP Atomic Burn Test**:
   * Verify that immediately following successful login with an OTP, the OTP is burned in the database, and any subsequent login attempts with that same OTP are rejected.
3. **Session Restrictions Test**:
   * Verify restricted token blocks access to billing, CRM, and scheduler routes (returning a `403 FORBIDDEN` error).
4. **Differentiation of Sessions Test**:
   * Verify restricted OTP-session lifespan is limited to 24 hours.
   * Verify standard permanent password session lifespan remains 1 year.
5. **Staff Reset & Audit Test**:
   * Verify resetting user password increments target user's `sessionVersion`.
   * Verify resetting user password records an audit entry containing target user's ID and actor's ID without plaintext password/hash leak.
   * Verify rate-limiting blocks password reset requests on the same target if requested within 30 seconds.
