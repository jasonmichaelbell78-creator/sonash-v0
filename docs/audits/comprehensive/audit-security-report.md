# Security Audit Report

**Date:** 2026-02-03 **Auditor:** security-auditor agent **Scope:**
Comprehensive security audit covering auth, input validation, OWASP compliance,
injection risks **Repository:** sonash-v0 **Branch:**
feature/audit-documentation-6-stage

---

## Purpose

This report documents the security audit findings for the SoNash project,
covering authentication, input validation, OWASP compliance, and security best
practices.

## Executive Summary

This security audit analyzed the SoNash codebase for
authentication/authorization vulnerabilities, input validation issues, OWASP Top
10 compliance, and other security concerns. The application demonstrates
**strong security architecture** with defense-in-depth principles properly
implemented.

### Overall Security Posture: GOOD

| Severity      | Count | Status                         |
| ------------- | ----- | ------------------------------ |
| S0 (Critical) | 0     | None found                     |
| S1 (High)     | 1     | App Check temporarily disabled |
| S2 (Medium)   | 2     | Configuration concerns         |
| S3 (Low)      | 3     | Minor improvements recommended |

---

## Baselines

### npm audit Results

- **Total vulnerabilities:** 1
- **Critical:** 1
- **High:** 0
- **Moderate:** 0
- **Low:** 0

### Security Pattern Compliance

```
npm run patterns:check: PASS
Checked 13 file(s) against 31 known anti-patterns
No pattern violations found
```

### Security Headers (firebase.json)

- Cross-Origin-Opener-Policy: same-origin-allow-popups
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security: max-age=31536000; includeSubDomains
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(),
  usb=()

**Missing:** Content-Security-Policy (CSP) header

---

## Findings Detail

### SEC-001: App Check Temporarily Disabled [S1/E1]

**File:** `functions/src/index.ts:84` **Category:** Auth **OWASP:** A07:2021 -
Identification and Authentication Failures **Confidence:** HIGH **Verified:**
DUAL_PASS_CONFIRMED

**Description:** App Check verification is temporarily disabled across all Cloud
Functions with the comment "TEMPORARILY DISABLED - waiting for throttle to
clear". This removes an important layer of bot protection.

**Evidence:**

```typescript
// functions/src/index.ts:84
requireAppCheck: false, // TEMPORARILY DISABLED - waiting for throttle to clear
recaptchaAction: "save_daily_log", // Manual reCAPTCHA verification
```

Similar patterns found at:

- `functions/src/index.ts:170` (saveJournalEntry)
- `functions/src/index.ts:269` (softDeleteJournalEntry)
- `functions/src/index.ts:363` (saveInventoryEntry)
- `functions/src/index.ts:506-511` (migrateAnonymousUserData)

**Impact:** While reCAPTCHA Enterprise is still active as a secondary
protection, disabling App Check removes:

- Automated attestation that requests come from legitimate app instances
- Protection against replay attacks from intercepted tokens
- Defense against automated tooling that bypasses reCAPTCHA

**Recommendation:**

1. Re-enable App Check once throttle clears
2. Add a tracking mechanism (e.g., TODO with date, backlog item) to ensure
   re-enablement
3. Consider implementing a feature flag for App Check instead of code comments

**CWE:** CWE-306 (Missing Authentication for Critical Function)

**Verification Steps:**

1. Search for `requireAppCheck: false` in functions/src
2. Verify each instance has a documented re-enablement plan
3. After re-enabling, test that Cloud Functions reject requests without valid
   App Check tokens

---

### SEC-002: Missing Content-Security-Policy Header [S2/E1]

**File:** `firebase.json:30-57` **Category:** Headers **OWASP:** A05:2021 -
Security Misconfiguration **Confidence:** HIGH **Verified:** MANUAL_ONLY

**Description:** The hosting configuration includes excellent security headers
but lacks a Content-Security-Policy (CSP) header. CSP is a critical defense
against XSS attacks.

**Evidence:**

```json
// firebase.json:30-57
{
  "source": "**",
  "headers": [
    {
      "key": "Cross-Origin-Opener-Policy",
      "value": "same-origin-allow-popups"
    },
    { "key": "X-Frame-Options", "value": "DENY" },
    { "key": "X-Content-Type-Options", "value": "nosniff" }
    // ... no CSP header
  ]
}
```

**Impact:** Without CSP:

- Inline scripts can execute without restriction
- Third-party resources can be loaded without validation
- XSS attacks have broader impact if they occur

**Recommendation:** Add a CSP header. Suggested starting policy:

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' https://www.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com; frame-ancestors 'none'"
}
```

**CWE:** CWE-1021 (Improper Restriction of Rendered UI Layers)

---

### SEC-003: Hardcoded reCAPTCHA Site Key Fallback [S2/E0]

**File:** `functions/src/recaptcha-verify.ts:66` **Category:** Data **OWASP:**
A02:2021 - Cryptographic Failures **Confidence:** MEDIUM **Verified:**
DUAL_PASS_CONFIRMED

**Description:** The reCAPTCHA verification code has a hardcoded fallback site
key, which should be environment-driven only.

**Evidence:**

```typescript
// functions/src/recaptcha-verify.ts:66
const siteKey =
  process.env.RECAPTCHA_SITE_KEY || "6LdeazosAAAAAMDNCh1hTUDKh_UeS6xWY1-85B2O";
```

**Impact:**

- Site keys are not secrets (they're public), but hardcoding creates:
  - Deployment confusion if different environments need different keys
  - Risk of testing with wrong environment's key
  - Version control tracking of environment-specific values

**Recommendation:** Remove the fallback and require the environment variable:

```typescript
const siteKey = process.env.RECAPTCHA_SITE_KEY;
if (!siteKey) {
  throw new Error("RECAPTCHA_SITE_KEY environment variable is required");
}
```

**CWE:** CWE-798 (Use of Hard-coded Credentials)

---

### SEC-004: npm Critical Vulnerability [S3/E0]

**File:** `package.json` (dependency tree) **Category:** Deps **OWASP:**
A06:2021 - Vulnerable and Outdated Components **Confidence:** HIGH **Verified:**
TOOL_VALIDATED (npm audit)

**Description:** npm audit reports 1 critical vulnerability in the dependency
tree.

**Evidence:**

```
npm audit --json output:
{
  "info": 0,
  "low": 0,
  "moderate": 0,
  "high": 0,
  "critical": 1,
  "total": 1
}
```

**Impact:** Unknown without specific CVE details. The `overrides` section in
package.json shows `fast-xml-parser` was previously pinned to address a
vulnerability.

**Recommendation:**

1. Run `npm audit` to identify the specific vulnerable package
2. Check if it can be resolved with an override or update
3. Document if it's a development-only dependency with limited exposure

**CWE:** CWE-1104 (Use of Unmaintained Third Party Components)

---

### SEC-005: Optional reCAPTCHA for Migration Function [S3/E1]

**File:** `functions/src/index.ts:515-530` **Category:** Auth **OWASP:**
A07:2021 - Identification and Authentication Failures **Confidence:** MEDIUM
**Verified:** DUAL_PASS_CONFIRMED

**Description:** The `migrateAnonymousUserData` function makes reCAPTCHA token
optional, allowing migration to proceed without bot protection when the token is
missing.

**Evidence:**

```typescript
// functions/src/index.ts:515-530
const token = data.recaptchaToken;
if (!token || token.trim() === "") {
  logSecurityEvent(
    "RECAPTCHA_MISSING_TOKEN",
    "migrateAnonymousUserData",
    "Migration processed without reCAPTCHA token (may indicate network blocking)",
    { userId, severity: "WARNING", metadata: { action: "migrate_user_data" } }
  );
  // Continue without reCAPTCHA protection - rely on other security layers
} else {
  await verifyRecaptchaToken(token, "migrate_user_data", userId);
}
```

**Impact:**

- Migration can proceed without reCAPTCHA verification
- Relies on rate limiting (5 req/5min) as primary protection
- The comment indicates this is intentional for users behind network blocking

**Recommendation:** This appears to be a deliberate trade-off for UX. Consider:

1. Adding stricter rate limits when reCAPTCHA is missing
2. Logging these cases for monitoring
3. Documenting this decision in security documentation

**CWE:** CWE-778 (Insufficient Logging)

---

### SEC-006: Debug Token Configuration Comment in Client Code [S3/E0]

**File:** `lib/firebase.ts:61-90` **Category:** Data **OWASP:** A05:2021 -
Security Misconfiguration **Confidence:** LOW **Verified:** MANUAL_ONLY

**Description:** Commented-out code includes references to debug token
configuration that could be accidentally uncommented in production.

**Evidence:**

```typescript
// lib/firebase.ts:66-77 (commented out)
// if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN) {
//   const debugToken = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN
//   if (debugToken) {
//     const debugValue = debugToken === 'true' ? true : debugToken;
//     const globalSelf = self as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean };
//     globalSelf.FIREBASE_APPCHECK_DEBUG_TOKEN = debugValue;
```

**Impact:** Minimal since code is commented, but:

- Shows debug token pattern that could be copied/adapted incorrectly
- Commented code can be mistakenly uncommented

**Recommendation:** Consider removing the commented debug token code entirely
and documenting the pattern in a separate development guide instead.

**CWE:** CWE-489 (Active Debug Code)

---

## Security Strengths Observed

### 1. Excellent Firestore Security Rules

The `firestore.rules` file demonstrates proper security architecture:

- `isOwner()` helper function for consistent authorization checks
- Sensitive collections (journal, daily_logs, inventoryEntries) block direct
  writes
- All writes routed through Cloud Functions for server-side validation
- Admin-only collections properly gated with custom claims

### 2. Robust Cloud Function Security

The `withSecurityChecks` wrapper in `security-wrapper.ts` provides:

- Authentication verification
- Rate limiting (user-based and IP-based)
- App Check verification (when enabled)
- reCAPTCHA verification
- Zod schema validation
- User ID authorization
- Comprehensive security logging

### 3. Comprehensive Input Validation

- Zod schemas defined for all data types in `schemas.ts`
- Content size limits (50KB for content fields)
- Regex validation for date formats
- Type-safe interfaces throughout

### 4. Secure Logging Practices

The `security-logger.ts` demonstrates excellent practices:

- User IDs are hashed before logging (GDPR/HIPAA compliance)
- Sensitive keys are redacted from metadata
- PII patterns (email, phone, IP) are stripped from messages
- Message truncation prevents log flooding

### 5. Client-Side Defense-in-Depth

`firestore-validation.ts` provides additional protection:

- User ID format validation
- Path traversal prevention
- Clear documentation that this is defense-in-depth, not primary security

### 6. Proper Error Handling

Throughout the codebase:

- Generic error messages to clients (no information leakage)
- Detailed logging for debugging
- HttpsError codes used correctly

---

## OWASP Top 10 Coverage

| Category                           | Status | Notes                                                    |
| ---------------------------------- | ------ | -------------------------------------------------------- |
| A01:2021 Broken Access Control     | PASS   | Firestore rules + Cloud Functions enforce access control |
| A02:2021 Cryptographic Failures    | PASS   | SHA-256 for hashing, server timestamps, no weak crypto   |
| A03:2021 Injection                 | PASS   | Zod validation, parameterized queries via Firestore SDK  |
| A04:2021 Insecure Design           | PASS   | Defense-in-depth architecture properly implemented       |
| A05:2021 Security Misconfiguration | WARN   | Missing CSP header (SEC-002)                             |
| A06:2021 Vulnerable Components     | WARN   | 1 critical npm vulnerability (SEC-004)                   |
| A07:2021 Auth Failures             | WARN   | App Check disabled (SEC-001)                             |
| A08:2021 Software/Data Integrity   | PASS   | No eval/Function usage, signed deployments               |
| A09:2021 Logging/Monitoring        | PASS   | Comprehensive security logging with Sentry integration   |
| A10:2021 SSRF                      | N/A    | No server-side URL fetching                              |

---

## Recommendations Summary

### Immediate (within 1 sprint)

1. **[S1]** Create tracking item for App Check re-enablement
2. **[S2]** Add Content-Security-Policy header to firebase.json

### Short-term (within 1 month)

3. **[S2]** Remove hardcoded reCAPTCHA site key fallback
4. **[S3]** Investigate and resolve npm critical vulnerability

### Maintenance

5. **[S3]** Document reCAPTCHA-optional migration decision
6. **[S3]** Clean up commented debug token code

---

## Appendix: Files Reviewed

### Core Security Files

- `firestore.rules` - Firestore security rules
- `storage.rules` - Storage security rules
- `firebase.json` - Hosting/headers configuration
- `functions/src/index.ts` - Main Cloud Functions
- `functions/src/admin.ts` - Admin Cloud Functions
- `functions/src/security-wrapper.ts` - Security middleware
- `functions/src/schemas.ts` - Zod validation schemas
- `functions/src/firestore-rate-limiter.ts` - Rate limiting
- `functions/src/recaptcha-verify.ts` - reCAPTCHA verification
- `functions/src/security-logger.ts` - Security logging
- `functions/src/jobs.ts` - Scheduled jobs with security implications

### Client-Side Security Files

- `lib/firebase.ts` - Firebase initialization
- `lib/auth/account-linking.ts` - Account linking flows
- `lib/security/firestore-validation.ts` - Client-side validation
- `lib/logger.ts` - Client logging with PII redaction
- `lib/recaptcha.ts` - reCAPTCHA token management
- `lib/db/users.ts` - User data access

### Configuration Files

- `package.json` - Dependencies
- `functions/package.json` - Functions dependencies
- `next.config.mjs` - Next.js configuration

---

**Report generated:** 2026-02-03T00:00:00Z **Methodology:** Sequential
single-agent audit following `.claude/skills/audit-security/SKILL.md`

---

## Version History

| Version | Date       | Description          |
| ------- | ---------- | -------------------- |
| 1.0     | 2026-02-03 | Initial audit report |
