<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-22
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Security Audit Report — SoNash v0

**Date:** 2026-02-22 **Auditor:** Security-Auditor Agent (claude-sonnet-4-6)
**Scope:** Full application security audit **Stack:** Next.js 16.1.1, React
19.2.3, Firebase 12.6.0, Cloud Functions (Node.js 24), Tailwind CSS 4.1.9, Zod
4.2.1

---

## 1. Executive Summary

SoNash has a well-structured security posture with multiple defense-in-depth
layers. The architecture demonstrates strong security awareness: Cloud Functions
enforce all sensitive writes, Firestore security rules lock down critical paths,
and a comprehensive security wrapper applies authentication, rate limiting, App
Check, and reCAPTCHA checks.

However, three issues require immediate attention: **App Check is completely
disabled across all Cloud Functions** (marked "TEMPORARILY DISABLED" with no
restoration plan), **a hardcoded reCAPTCHA site key exists as a fallback in
production server-side code**, and **the `security_logs` and `system` Firestore
collections have no security rules** (defaulting to deny-all via Firebase's
default behavior, but relying on implicit behavior rather than explicit rules).

### Severity Breakdown

| Severity      | Count  |
| ------------- | ------ |
| S0 (Critical) | 0      |
| S1 (High)     | 3      |
| S2 (Medium)   | 5      |
| S3 (Low)      | 7      |
| **Total**     | **15** |

---

## 2. Top Findings Table

| ID     | Title                                                                             | Severity | Effort | Area                   |
| ------ | --------------------------------------------------------------------------------- | -------- | ------ | ---------------------- |
| SEC-01 | App Check disabled across all Cloud Functions                                     | S1       | E1     | Cloud Functions        |
| SEC-02 | Hardcoded reCAPTCHA site key fallback in production code                          | S1       | E1     | Secret Management      |
| SEC-03 | `security_logs` and `system` collections not explicitly denied in Firestore rules | S1       | E1     | Firestore Rules        |
| SEC-04 | Migration does not verify `anonymousUid` is actually anonymous via Auth SDK       | S2       | E1     | Auth / Data Migration  |
| SEC-05 | No Content-Security-Policy (CSP) header configured                                | S2       | E2     | HTTP Security Headers  |
| SEC-06 | `.env.production` committed to repository with Firebase config and Sentry DSN     | S2       | E2     | Secret Management      |
| SEC-07 | Flexible `z.record(z.string(), z.unknown())` schemas allow arbitrary nested data  | S2       | E2     | Input Validation       |
| SEC-08 | Migration function not fully atomic across Firestore batch commits                | S2       | E3     | Data Integrity         |
| SEC-09 | Admin password reset reveals user enumeration via "No user found" response        | S3       | E1     | Information Disclosure |
| SEC-10 | Missing `Cross-Origin-Embedder-Policy` (COEP) header for Google OAuth             | S3       | E1     | HTTP Security Headers  |
| SEC-11 | `firebase-service-account.json` present on disk (gitignored, but risky)           | S3       | E1     | Secret Management      |
| SEC-12 | `VALIDATION_FAILURE` severity mapped to INFO (suppresses Firestore storage)       | S3       | E1     | Security Monitoring    |
| SEC-13 | Rate limiter `rate_limits` doc ID includes raw userId (not hashed)                | S3       | E1     | PII Exposure           |
| SEC-14 | Admin panel mobile block relies on user-agent / screen width (client-side)        | S3       | E0     | Defense-in-Depth       |
| SEC-15 | `searchUserByNickname` Firestore prefix query lacks explicit upper bound length   | S3       | E1     | Input Validation       |

---

## 3. Detailed Findings

### SEC-01 — App Check Disabled Across All Cloud Functions

**Severity:** S1 (High) | **Effort:** E1 (Small)

**Location:** `functions/src/index.ts` lines 84, 170, 269, 363, 506

**Description:** Firebase App Check is disabled on all five user-facing Cloud
Functions (`saveDailyLog`, `saveJournalEntry`, `softDeleteJournalEntry`,
`saveInventoryEntry`, `migrateAnonymousUserData`) with the comment:

```
requireAppCheck: false, // TEMPORARILY DISABLED - waiting for throttle to clear
```

The disabled state is also confirmed in `lib/firebase.ts` where the App Check
initialization code is commented out (lines 61–90). With App Check disabled, any
client — including automated scripts, bots, or other Firebase projects — can
call these Cloud Functions with only a valid Firebase ID token. This
significantly weakens bot protection and removes a key security layer.

**Risk:** Without App Check, reCAPTCHA is the sole bot-protection layer.
reCAPTCHA is also optional (skipped when token is missing, see
`migrateAnonymousUserData` lines 515–529). An attacker with a valid Firebase
account (including anonymous) can call functions at any rate (bounded only by
per-user rate limiting).

**Recommendation:**

1. Re-enable App Check: uncomment initialization in `lib/firebase.ts` and set
   `requireAppCheck: true` (the default) in `withSecurityChecks` options.
2. Set up a GitHub issue or ROADMAP item with a target date for re-enablement.
3. In the interim, ensure reCAPTCHA enforcement is strict (see SEC-01 context in
   `handleRecaptchaVerification` — token is currently required in the security
   wrapper when `recaptchaAction` is set, which is good).

---

### SEC-02 — Hardcoded reCAPTCHA Site Key in Production Server Code

**Severity:** S1 (High) | **Effort:** E1 (Small)

**Location:** `functions/src/recaptcha-verify.ts` line 66

**Description:**

```typescript
const siteKey =
  process.env.RECAPTCHA_SITE_KEY || "6LdeazosAAAAAMDNCh1hTUDKh_UeS6xWY1-85B2O";
```

The reCAPTCHA Enterprise site key is hardcoded as a fallback. While site keys
are not private secrets (they are embedded in client-side scripts), hardcoding
them in server-side code raises concerns:

1. **Incorrect server-side verification**: The server-side verification should
   use the same site key as the client. If the environment variable is
   misconfigured, the fallback silently allows verification against the
   hardcoded key — no error, no alert.
2. **Key rotation difficulty**: Changing the key requires a code change and
   redeployment, not just a config update.
3. **Misleading security posture**: The pattern suggests the code is "safe to
   deploy without config" when it should fail loudly.

The same key also appears in `.env.production` as
`NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY`, making it intentionally
public, but the server-side fallback is still a bad practice.

**Recommendation:** Remove the hardcoded fallback. If `RECAPTCHA_SITE_KEY` is
not set, throw a configuration error at startup or log it prominently:

```typescript
const siteKey = process.env.RECAPTCHA_SITE_KEY;
if (!siteKey) {
  // Already handled below: throws HttpsError("failed-precondition", ...)
}
```

The existing `if (!projectId || !siteKey)` check at line 68 already handles the
missing case, so removing the fallback makes the code safer and more explicit.

---

### SEC-03 — `security_logs` and `system` Collections Not Explicitly Covered in Firestore Rules

**Severity:** S1 (High) | **Effort:** E1 (Small)

**Location:** `firestore.rules`

**Description:** The following collections used by Cloud Functions via Admin SDK
are **not explicitly matched** in `firestore.rules`:

- `/security_logs/{docId}` — stores all security events including AUTH_FAILURE,
  AUTHORIZATION_FAILURE, RATE_LIMIT_EXCEEDED events
- `/system/{docId}` — stores privilege type configurations used by
  `adminSetUserPrivilege`

Firebase's default behavior is to **deny all** client access to unmatched paths
(since no `allow` rule matches, the implicit result is `false`). However:

1. **Explicit is safer than implicit.** If a future Firestore rules update
   introduces a wildcard `match /{collection}/{doc}` for any reason, these
   collections would be exposed.
2. **Auditability.** Security reviewers (and automated tools) cannot confirm the
   intended access policy without explicit rules.
3. **Security event logs contain hashed user IDs and security event metadata** —
   even hashed, this is sensitive data that should be explicitly locked down.

**Recommendation:** Add explicit deny-all rules:

```
// Security event logs - Admin SDK only (Cloud Functions)
match /security_logs/{docId} {
  allow read, write: if false; // Only Cloud Functions (Admin SDK)
}

// System configuration - Admin SDK only
match /system/{docId=**} {
  allow read, write: if false; // Only Cloud Functions (Admin SDK)
}
```

---

### SEC-04 — Migration Does Not Verify `anonymousUid` Is Actually Anonymous

**Severity:** S2 (Medium) | **Effort:** E1 (Small)

**Location:** `functions/src/index.ts` lines 486–765
(`migrateAnonymousUserData`)

**Description:** The `migrateAnonymousUserData` function verifies:

- Caller is the `targetUid` (line 550)
- The `anonymousUid` document exists in Firestore (line 565)

But it does **not** verify via Firebase Auth Admin SDK that the `anonymousUid`
account is actually an anonymous Firebase Auth account. An authenticated user
who knows another user's `uid` (which is not secret — UIDs appear in Firestore
paths and logs) could potentially trigger migration of a **non-anonymous**
account's data into their own account.

This could be exploited to copy another permanent user's journal entries to the
attacker's account, since the migration reads all subcollections from the
provided `anonymousUid`.

**Recommendation:** Add a check using the Admin Auth SDK:

```typescript
const anonymousAuthUser = await admin
  .auth()
  .getUser(validatedData.anonymousUid);
if (
  !anonymousAuthUser.providerData ||
  anonymousAuthUser.providerData.length > 0
) {
  // Has linked providers - not purely anonymous
  logSecurityEvent(
    "AUTHORIZATION_FAILURE",
    "migrateAnonymousUserData",
    "Source account is not anonymous",
    { userId }
  );
  throw new HttpsError(
    "permission-denied",
    "Source account is not an anonymous account"
  );
}
```

---

### SEC-05 — No Content-Security-Policy (CSP) Header

**Severity:** S2 (Medium) | **Effort:** E2 (Medium)

**Location:** `firebase.json` (hosting headers section)

**Description:** The `firebase.json` hosting configuration includes several
security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`) but **does
not include a Content-Security-Policy header**.

Without CSP:

- Malicious inline scripts (if XSS were possible) would execute without
  restriction
- Third-party script injection is not limited
- The `script-src` directive is absent, meaning scripts from any domain could
  theoretically be loaded

The app loads external scripts (reCAPTCHA from `google.com`) and uses Sentry. A
CSP that allows these would meaningfully reduce the XSS attack surface.

Note: React's JSX rendering escapes content by default (no
`dangerouslySetInnerHTML` usage found), which significantly reduces XSS risk.
But CSP provides defense-in-depth.

**Recommendation:** Add a CSP header to `firebase.json`. A starting
configuration:

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://*.sentry.io; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.sentry.io wss://*.firebaseio.com; frame-src https://www.google.com/recaptcha/ https://recaptcha.google.com; object-src 'none'; base-uri 'self'; form-action 'self';"
}
```

---

### SEC-06 — `.env.production` Committed to Repository with Firebase Config and Sentry DSN

**Severity:** S2 (Medium) | **Effort:** E2 (Medium)

**Location:** `.env.production` (committed to git)

**Description:** The file `.env.production` is tracked in the repository and
contains:

- Firebase Web API Key: `AIzaSyDGvM5kFwkgSTUS1Tbwt0piuhk9bcCeY7Q`
- Firebase App ID: `1:236021751794:web:8d54964dbe6d9288bf956b`
- Firebase Messaging Sender ID: `236021751794`
- reCAPTCHA Enterprise Site Key: `6LdeazosAAAAAMDNCh1hTUDKh_UeS6xWY1-85B2O`
- Sentry DSN:
  `https://f585a8353ec50d104e5484fedca6c2f2@o4510530873589760.ingest.us.sentry.io/...`

The `.gitignore` correctly excludes `.env*.local` but not `.env.production`. All
these values are prefixed with `NEXT_PUBLIC_` and are intentionally embedded in
the built JavaScript bundle for browser use — the Firebase config and reCAPTCHA
site key are inherently public. However:

1. **Sentry DSN exposure**: While the Sentry DSN is technically "public" (it
   appears in browser JS), committing it to source enables anyone who clones the
   repo to send crafted error events to your Sentry project, potentially
   polluting your error monitoring.
2. **Firebase API Key**: While Firebase Web API keys are designed to be public
   and are restricted by Firebase security rules, having them in source creates
   unnecessary exposure and complicates key rotation.
3. **Best practice violation**: Production configuration should not be in source
   control, even for "public" values.

**Recommendation:**

- Move `NEXT_PUBLIC_SENTRY_DSN` out of the committed file or restrict it using
  Sentry's DSN rate limiting and project-level restrictions.
- Store production values in CI/CD secrets (GitHub Actions secrets) injected at
  build time.
- Add `.env.production` to `.gitignore` and use a CI secret for the build
  pipeline.
- Consider Sentry's client-key restrictions to limit what domains can submit to
  your DSN.

---

### SEC-07 — Flexible `z.record(z.string(), z.unknown())` Schemas Allow Arbitrary Nested Data

**Severity:** S2 (Medium) | **Effort:** E2 (Medium)

**Location:** `functions/src/schemas.ts` lines 32, 51

**Description:** The `journalEntrySchema` and `inventoryEntrySchema` both use:

```typescript
data: z.record(z.string(), z.unknown()), // Flexible object, validated per-type in function
```

While the comment says "validated per-type in function," examining
`functions/src/index.ts` reveals that the `data` field is **stored directly to
Firestore without per-type validation**:

```typescript
const { type, data: entryData, ... } = data;
// ...
data: entryData,  // Written directly to Firestore
```

This means:

1. Any key/value pairs (up to Firestore document size limits) can be stored in
   the `data` field
2. The `sanitizeData` function in `saveInventoryEntry` removes `undefined`
   values but does not enforce schema
3. An attacker could store arbitrary structures including deeply nested objects
   (limited by the `MAX_DEPTH = 50` sanitizer in `saveInventoryEntry`, but not
   in `saveJournalEntry`)
4. Stored data is user-scoped so cross-user impact is limited, but could be used
   for storage abuse

**Recommendation:**

- Add per-type Zod schemas for the `data` field and validate against them
  server-side
- At minimum, add depth and size limits to the `data` field in
  `saveJournalEntry` (similar to the `sanitizeData` function in
  `saveInventoryEntry`)
- Add a `MAX_KEYS` check on the `data` object to prevent excessive field count

---

### SEC-08 — Migration Not Fully Atomic Across Firestore Batch Commits

**Severity:** S2 (Medium) | **Effort:** E3 (Large)

**Location:** `functions/src/index.ts` lines 688–722

**Description:** The migration function acknowledges in comments:

```
// Note: Not fully atomic across batches - if a later batch fails,
// earlier batches cannot be rolled back (Firestore limitation).
```

For migrations with >499 documents (requiring multiple batches), a failure
mid-migration leaves the user with partial data. The error message to the client
includes batch count information:

```typescript
`Migration partially completed: ${committedBatches}/${batches.length} batches succeeded.`;
```

This has both a **data integrity concern** (users may end up with incomplete
migrated data and a stale anonymous account) and a minor **information
disclosure** (batch count reveals internal implementation details about data
volume).

**Recommendation:**

- Implement a Firestore-based migration state document to track completion and
  allow retrying from where it left off
- Change the client-facing error message to be generic: "Migration partially
  completed. Please contact support."
- Log the detailed batch information server-side only (already done)

---

### SEC-09 — Admin Password Reset Reveals User Enumeration via Distinct Error

**Severity:** S3 (Low) | **Effort:** E1 (Small)

**Location:** `functions/src/admin.ts` lines 3374–3376, 3411–3413

**Description:** The `adminSendPasswordReset` function returns distinct errors
when a user is not found:

```typescript
throw new HttpsError("not-found", "No user found with this email address");
```

This is an admin-only function (protected by `requireAdmin()`), so the attack
surface is limited to existing admin users. However, for completeness:

- A compromised admin account could be used to enumerate all valid email
  addresses in the system
- Both the Firebase Admin SDK check and the REST API check both return "No user
  found" for non-existent emails, confirming enumeration is possible

**Recommendation:** For a recovery support app handling sensitive user data,
even admin-only user enumeration should be mitigated. Consider returning a
generic "If a user exists with that email, a reset has been sent" response, and
always calling the Firebase API even when the user check fails (to add timing
consistency).

---

### SEC-10 — Missing Cross-Origin-Embedder-Policy (COEP) Header

**Severity:** S3 (Low) | **Effort:** E1 (Small)

**Location:** `firebase.json`

**Description:** The app uses
`Cross-Origin-Opener-Policy: same-origin-allow-popups` (to enable Google OAuth
popups) but **does not set `Cross-Origin-Embedder-Policy`**. While COEP is not
required for the current functionality, its absence limits the ability to use
certain browser features (SharedArrayBuffer, high-resolution timers) that
require COEP for security isolation. The CLAUDE.md mentions "Google OAuth
requires COOP/COEP headers" but only COOP is set.

**Recommendation:** Evaluate whether COEP should be set. If cross-origin
resources (reCAPTCHA iframes, Google scripts) are loaded without CORS headers,
setting `COEP: require-corp` could break functionality. The current COOP-only
approach is acceptable but should be documented as an intentional decision.

---

### SEC-11 — `firebase-service-account.json` Present on Disk

**Severity:** S3 (Low) | **Effort:** E1 (Small)

**Location:** Repository root: `firebase-service-account.json`

**Description:** A Firebase service account key file exists on disk and is
correctly listed in `.gitignore`. The git history shows no commits of this file
(0 entries). The file contains
`firebase-adminsdk-fbsvc@sonash-app.iam.gserviceaccount.com` credentials.

This is not a current vulnerability but represents ongoing risk:

- If `.gitignore` were accidentally removed or the file accidentally staged, it
  could be committed
- The service account key on disk is a credential management anti-pattern
- If the development machine were compromised, this key provides full
  Firestore/Auth Admin access

**Recommendation:**

- Use Application Default Credentials (ADC) for local development instead of a
  service account key file
- If the key is needed for local scripts, use environment variables or GCP
  Secret Manager
- Consider restricting this service account's IAM roles to the minimum needed
  for local operations
- Set up automatic credential rotation and expiry alerts

---

### SEC-12 — `VALIDATION_FAILURE` Severity Mapped to INFO (Suppresses Firestore Storage)

**Severity:** S3 (Low) | **Effort:** E1 (Small)

**Location:** `functions/src/security-logger.ts` lines 371–373, 149

**Description:** In `SEVERITY_MAP`, `VALIDATION_FAILURE` is classified as
`INFO`:

```typescript
VALIDATION_FAILURE: "INFO",
```

The `storeLogInFirestore` logic only persists events to Firestore if severity is
not `INFO` (line 149):

```typescript
if (severity !== "INFO" || options?.storeInFirestore) {
  storeLogInFirestore(event)...
}
```

This means validation failures from malicious inputs (fuzz testing, schema
probing) are **logged to GCP Cloud Logging but not to the Firestore
`security_logs` collection**, making them invisible in the admin panel security
log viewer. Repeated validation failures can indicate an attacker probing the
API.

**Recommendation:** Change `VALIDATION_FAILURE` to `WARNING` severity:

```typescript
VALIDATION_FAILURE: "WARNING",
```

Or add `storeInFirestore: true` to all `VALIDATION_FAILURE` log calls in
`withSecurityChecks` to force Firestore persistence despite INFO severity.

---

### SEC-13 — Rate Limiter `rate_limits` Document ID Uses Raw User ID

**Severity:** S3 (Low) | **Effort:** E1 (Small)

**Location:** `functions/src/firestore-rate-limiter.ts` lines 39–42, 82

**Description:** Rate limit documents are stored as:

```typescript
const docId = `${key}_${operation}`;
// key = `user_${userId}` for user-based limits
// key = `ip_${normalizedIp}` for IP-based limits
```

The document ID for user-based rate limits contains the raw Firebase UID
(`user_<uid>_<operation>`). While `rate_limits` is locked to Cloud Functions
only (`allow read, write: if false`), if the collection were ever accidentally
made readable, UIDs would be exposed.

For IP-based rate limits, raw IP addresses are stored in the document ID (e.g.,
`ip_1.2.3.4_saveDailyLog`). The security logger correctly hashes IPs before
logging (line 131), but the rate limiter stores them in plaintext.

**Recommendation:** Hash both the user ID and IP address before using them as
document IDs:

```typescript
async consume(userId: string, operation: string = "default"): Promise<void> {
  const hashedId = createHash("sha256").update(userId).digest("hex").substring(0, 16);
  return this.consumeByKey(`user_${hashedId}`, operation);
}
```

---

### SEC-14 — Admin Panel Mobile Block Relies on Client-Side Detection

**Severity:** S3 (Low) | **Effort:** E0 (Trivial)

**Location:** `app/admin/page.tsx` lines 36–37

**Description:** The admin panel attempts to block mobile access:

```typescript
const isMobile =
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
  window.innerWidth < 768;
```

This is purely cosmetic — any user on a mobile device can bypass this by:

- Spoofing their user agent string
- Using browser developer tools to emulate desktop
- Using a browser that doesn't match the regex

The actual security is provided by the Firebase custom claim check at line
68-72, which correctly verifies the `admin` claim server-side. The mobile block
is UX, not security.

**Recommendation:** Document this explicitly in a code comment to prevent future
developers from treating it as a security control. No code change required
beyond documentation.

---

### SEC-15 — `searchUsersByNickname` Prefix Query Lacks Input Length Validation

**Severity:** S3 (Low) | **Effort:** E1 (Small)

**Location:** `functions/src/admin.ts` lines 286–337 (`searchUsersByNickname`)

**Description:** The nickname prefix search uses a Firestore range query:

```typescript
.where("nickname", ">=", nickname)
.where("nickname", "<=", nickname + "\uf8ff")
```

The `nickname` value is not length-validated before use in this query. While
this is an admin-only function, an admin providing a very long nickname string
could cause inefficient Firestore queries. The `searchUsersRequest` schema (if
it exists) should include a `maxLength` constraint on the search query
parameter.

**Recommendation:** Add input length validation to the `adminSearchUsers` input
schema:

```typescript
query: z.string().min(1).max(100).trim();
```

---

## 4. OWASP Top 10 Compliance Matrix (2021)

| OWASP Category                  | Status  | Notes                                                                                                                                                  |
| ------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A01 Broken Access Control       | PASS    | Firestore rules enforce user scoping; Cloud Functions verify auth; admin claim enforced server-side                                                    |
| A02 Cryptographic Failures      | PASS    | No sensitive data transmitted unencrypted; user IDs hashed in logs (SHA-256); passwords handled by Firebase Auth                                       |
| A03 Injection                   | PASS    | No SQL; Firestore uses typed APIs; React JSX escapes by default; no `dangerouslySetInnerHTML` found; scripts use `execFileSync` with args array        |
| A04 Insecure Design             | PARTIAL | Architecture is solid. Migration atomicity gap (SEC-08). App Check disabled (SEC-01) weakens bot defense.                                              |
| A05 Security Misconfiguration   | PARTIAL | App Check disabled (SEC-01); missing CSP (SEC-05); missing explicit Firestore rules for `security_logs`/`system` (SEC-03)                              |
| A06 Vulnerable Components       | INFO    | Not audited in this review. Recommend `npm audit` and Dependabot alerts.                                                                               |
| A07 Auth and Session Management | PASS    | Firebase Auth handles sessions; anonymous-to-permanent linking is well-implemented; admin claim verification is server-side                            |
| A08 Software and Data Integrity | PARTIAL | Zod validation on all Cloud Function inputs. Flexible `z.unknown()` for `data` fields (SEC-07). No integrity checks on `firebase-service-account.json` |
| A09 Security Logging            | PASS    | Comprehensive structured security logging; Sentry integration; GCP Cloud Logging; PII redaction in logs                                                |
| A10 SSRF                        | PASS    | `validateUrl()` helper in `scripts/lib/security-helpers.js` implements allowlist. reCAPTCHA verification calls are to fixed Google endpoints           |

---

## 5. Positive Security Findings

The following security controls are well-implemented and worth preserving:

1. **Repository Pattern + Cloud Functions enforcement**: All writes to sensitive
   collections (`journal`, `daily_logs`, `inventoryEntries`) go through Cloud
   Functions. Firestore rules block direct client writes
   (`allow create, update: if false`).

2. **Comprehensive Security Wrapper** (`functions/src/security-wrapper.ts`):
   Authentication, rate limiting, App Check, reCAPTCHA, Zod validation, and
   userId authorization are composed into a single reusable wrapper with good
   defaults.

3. **PII Protection in Logs**: User IDs are hashed (SHA-256, 12-char truncation)
   throughout logging. IP addresses are hashed before Sentry submission.
   Sensitive key names are redacted from metadata. PII patterns (email, phone,
   JWT) are scrubbed from log messages.

4. **Firestore-Based Rate Limiting**: Using Firestore transactions prevents race
   conditions and survives Cloud Function cold starts and horizontal scaling.
   The fail-closed strategy (deny on Firestore error) is correct.

5. **Strict Firestore Security Rules**: The rules are well-organized, use helper
   functions, and correctly separate public read-only collections from
   user-scoped and admin-only collections.

6. **Secret Management**: Sentry API token and Auth REST API Key are stored in
   GCP Secret Manager via `defineSecret()`. Service account credentials are
   gitignored.

7. **Error Message Sanitization**: `sanitizeErrorMessage()` strips stack traces,
   file paths, JWTs, and API keys from error messages before they reach clients
   or Firestore.

8. **Path Traversal Prevention**: `scripts/lib/security-helpers.js` implements
   proper `validatePathInDir()` with the correct regex pattern
   (`/^\.\.(?:[\\/]|$)/`), symlink detection, and TOCTOU-safe file operations.

9. **Admin Authorization**: All admin functions use `requireAdmin()` which
   checks the Firebase custom `admin` claim server-side. The privilege
   escalation logic uses asymmetric fail-safe ordering (grant: Firestore first;
   revoke: claims first).

10. **GDPR Compliance Support**: Soft-delete pattern for journal entries; user
    delete functionality; 30-day TTL on security logs.

---

## 6. Recommendations (Priority Order)

### Immediate (before next release)

1. **Re-enable App Check** (SEC-01) — Remove `requireAppCheck: false` overrides
   and uncomment App Check initialization in `lib/firebase.ts`
2. **Remove hardcoded reCAPTCHA key fallback** (SEC-02) — The existing error
   handling already covers missing key
3. **Add explicit Firestore rules for `security_logs` and `system`** (SEC-03) —
   Two-line addition

### Short-term (this sprint)

4. **Verify anonymousUid via Auth SDK in migration** (SEC-04)
5. **Upgrade VALIDATION_FAILURE to WARNING severity** (SEC-12)
6. **Add CSP header to firebase.json** (SEC-05)

### Medium-term

7. **Move `.env.production` out of git** (SEC-06) — Use CI/CD secrets
8. **Add per-type validation for flexible `data` fields** (SEC-07)
9. **Hash IDs in rate limiter document IDs** (SEC-13)
10. **Add input length validation to user search** (SEC-15)

### Low-priority / documentation

11. **Document admin mobile block as UX-only** (SEC-14)
12. **Add migration partial-failure recovery mechanism** (SEC-08)
13. **Document COEP decision** (SEC-10)
14. **Rotate `firebase-service-account.json` if not used** (SEC-11)
15. **Address admin user enumeration** (SEC-09)

---

_Report generated: 2026-02-22 by security-auditor agent_ _Files reviewed:
firestore.rules, storage.rules, firebase.json, next.config.mjs,
functions/src/index.ts, functions/src/admin.ts, functions/src/schemas.ts,
functions/src/security-wrapper.ts, functions/src/recaptcha-verify.ts,
functions/src/security-logger.ts, functions/src/firestore-rate-limiter.ts,
lib/firebase.ts, lib/auth/account-linking.ts, lib/recaptcha.ts,
lib/security/firestore-validation.ts, lib/firestore-service.ts, app/layout.tsx,
app/admin/layout.tsx, app/admin/page.tsx,
components/providers/auth-provider.tsx, components/providers/auth-context.tsx,
scripts/lib/security-helpers.js, .env.production, .gitignore_
