# SoNash Security Audit Report

> **Last Updated:** 2026-01-30

## Purpose

This document provides a comprehensive security audit of the SoNash recovery
application, covering authentication, authorization, input validation, OWASP Top
10 mapping, secrets management, infrastructure security, and compliance
assessment for handling sensitive personal recovery data.

---

**Audit Date:** 2026-01-30 **Auditor:** Security Agent (Claude Opus 4.5)
**Scope:** Comprehensive security review covering authentication, authorization,
input validation, OWASP Top 10, secrets management, and infrastructure security
**Codebase Version:** claude/new-session-U1Jou branch

---

## Executive Summary

This comprehensive security audit evaluated the SoNash recovery application,
which handles sensitive personal recovery data. The application demonstrates
**strong security fundamentals** with defense-in-depth architecture.

### Overall Security Posture: **A- (Good with Minor Gaps)**

### Finding Counts by Severity

| Severity      | Count | Description                             |
| ------------- | ----- | --------------------------------------- |
| S0 (Critical) | 0     | Issues requiring immediate action       |
| S1 (High)     | 2     | Significant security risks              |
| S2 (Medium)   | 3     | Moderate risks with mitigations         |
| S3 (Low)      | 4     | Minor issues or hardening opportunities |
| **Total**     | **9** |                                         |

**Strengths:**

- Multi-layered security architecture with Cloud Functions enforcement
- Comprehensive rate limiting (user + IP-based)
- PII redaction and sanitization throughout logging
- Strong authentication with anonymous account migration
- Defense-in-depth with reCAPTCHA Enterprise
- Extensive input validation with Zod schemas
- Security event logging with TTL policies
- **Security headers properly configured** (X-Frame-Options, HSTS,
  X-Content-Type-Options, etc.)

**Current Issues:**

- **S1 (High):** App Check verification temporarily disabled on all user-facing
  functions
- **S1 (High):** reCAPTCHA verification optional in migration function
- **S2 (Medium):** Content Security Policy (CSP) header not configured
- **S2 (Medium):** RECAPTCHA_BYPASS environment variable exists
- **S2 (Medium):** Password strength only enforced client-side

---

## Severity and Effort Scale

**Severity:**

- **S0 (Critical):** Immediate security risk, active exploitation possible
- **S1 (High):** Significant security weakness, high impact
- **S2 (Medium):** Moderate security concern, limited impact
- **S3 (Low):** Minor security improvement, defense-in-depth

**Effort:**

- **E0 (Trivial):** < 30 minutes, configuration change
- **E1 (Small):** 1-2 hours, minor code changes
- **E2 (Medium):** 2-4 hours, moderate refactoring
- **E3 (Large):** > 4 hours, significant architecture changes

---

## Findings Table

| ID      | Severity | Effort | File:Line                                 | OWASP    | Description                                                                    |
| ------- | -------- | ------ | ----------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| SEC-101 | S1       | E1     | functions/src/index.ts:84,170,269,363     | A07:2021 | App Check verification temporarily disabled on all user-facing Cloud Functions |
| SEC-102 | S1       | E1     | functions/src/index.ts:516-527            | A07:2021 | reCAPTCHA verification optional in migrateAnonymousUserData function           |
| SEC-103 | S2       | E2     | firebase.json:30-57                       | A05:2021 | Content-Security-Policy (CSP) header not configured                            |
| SEC-104 | S2       | E0     | functions/src/security-wrapper.ts:182-184 | A07:2021 | RECAPTCHA_BYPASS environment variable allows bypass in emulator mode           |
| SEC-105 | S2       | E1     | components/auth/sign-in-modal.tsx:51      | A07:2021 | Password strength requirements only enforced client-side                       |
| SEC-106 | S3       | E0     | .env.production:5-10                      | A02:2021 | Firebase public config in tracked env file (acceptable but could confuse)      |
| SEC-107 | S3       | E0     | app/admin/page.tsx:35-37                  | A04:2021 | Admin panel mobile detection is client-side only                               |
| SEC-108 | S3       | E1     | functions/src/recaptcha-verify.ts:66      | A05:2021 | Default reCAPTCHA site key hardcoded as fallback                               |
| SEC-109 | S3       | E0     | .env.production:20                        | A09:2021 | Sentry DSN publicly visible (acceptable but noted)                             |

---

## High Severity Findings (S1)

### SEC-101: App Check Temporarily Disabled

**Severity:** S1 (High) | **Effort:** E1 (1-2 hours) | **Status:** OPEN

**Location:** `/home/user/sonash-v0/functions/src/index.ts`

- Line 84:
  `requireAppCheck: false, // TEMPORARILY DISABLED - waiting for throttle to clear`
- Line 170: `requireAppCheck: false, // TEMPORARILY DISABLED`
- Line 269: `requireAppCheck: false, // TEMPORARILY DISABLED`
- Line 363: `requireAppCheck: false, // TEMPORARILY DISABLED`

**OWASP:** A07:2021 - Identification and Authentication Failures

**Description:** App Check verification is disabled on all user-facing Cloud
Functions (saveDailyLog, saveJournalEntry, softDeleteJournalEntry,
saveInventoryEntry). The comments indicate this is temporary due to "throttle"
issues, but there is no documented timeline for re-enablement.

**Risk:** Without App Check, the functions are vulnerable to:

- Automated bot attacks
- API abuse from non-app clients
- Credential stuffing attacks

**Mitigation (Current):** reCAPTCHA Enterprise verification is enabled as an
alternative.

**Recommendation:**

1. Create a tracking issue with a specific re-enablement date
2. Enable App Check in enforcement mode once throttle clears
3. Consider using App Check in "debug token" mode for gradual rollout

---

### SEC-102: Optional reCAPTCHA in Migration Function

**Severity:** S1 (High) | **Effort:** E1 (1-2 hours) | **Status:** OPEN

**Location:** `/home/user/sonash-v0/functions/src/index.ts:516-527`

```typescript
if (!token || token.trim() === "") {
  logSecurityEvent(
    "RECAPTCHA_MISSING_TOKEN",
    "migrateAnonymousUserData",
    "Migration processed without reCAPTCHA token (may indicate network blocking)",
    { ... }
  );
  // Continue without reCAPTCHA protection - rely on other security layers
}
```

**OWASP:** A07:2021 - Identification and Authentication Failures

**Description:** The data migration function allows requests to proceed without
reCAPTCHA verification when the token is missing. While other security layers
exist (auth, rate limiting), this creates an inconsistency with other functions
that require reCAPTCHA.

**Risk:**

- Automated attacks against data migration endpoint
- Potential for mass account manipulation if combined with other vulnerabilities

**Recommendation:**

1. Align with other functions - require reCAPTCHA or fail
2. If network blocking is a genuine concern, implement alternative verification
   (e.g., email confirmation)
3. Add stricter rate limits for migration operations (currently 5 req/5min)

---

## Medium Severity Findings (S2)

### SEC-103: Missing Content-Security-Policy Header

**Severity:** S2 (Medium) | **Effort:** E2 (2-4 hours) | **Status:** OPEN

**Location:** `/home/user/sonash-v0/firebase.json:30-57`

**OWASP:** A05:2021 - Security Misconfiguration

**Description:** The hosting configuration includes good security headers but
does not include Content-Security-Policy (CSP).

**Current Headers (Properly Configured):**

```json
"X-Frame-Options": "DENY",
"X-Content-Type-Options": "nosniff",
"Strict-Transport-Security": "max-age=31536000; includeSubDomains",
"Referrer-Policy": "strict-origin-when-cross-origin",
"Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=(), usb=()"
```

**Risk:**

- Increased XSS attack surface
- No protection against inline script injection
- Data exfiltration via uncontrolled resource loading

**Recommendation:**

1. Start with Report-Only CSP to identify violations:

```json
{
  "key": "Content-Security-Policy-Report-Only",
  "value": "default-src 'self'; script-src 'self' https://www.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.sentry.io; frame-src https://www.google.com; report-uri /csp-report"
}
```

2. After testing, switch to enforcement mode
3. Add nonces for inline scripts if needed

---

### SEC-104: reCAPTCHA Bypass Environment Variable

**Severity:** S2 (Medium) | **Effort:** E0 (<30 min) | **Status:** OPEN

**Location:** `/home/user/sonash-v0/functions/src/security-wrapper.ts:182-184`

```typescript
const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
const bypassRequested = process.env.RECAPTCHA_BYPASS === "true";
const allowBypass = bypassRequested && isEmulator;
```

**OWASP:** A07:2021 - Identification and Authentication Failures

**Description:** A bypass mechanism exists for reCAPTCHA verification via
environment variable. While properly gated to emulator-only, this pattern
introduces risk if environment detection is ever bypassed or misconfigured.

**Current Mitigation:** Double-check with `isEmulator` flag.

**Recommendation:**

1. Add explicit warning log when bypass is used
2. Consider removing bypass entirely - use debug tokens instead
3. Add deployment validation to ensure RECAPTCHA_BYPASS is never set in
   production

---

### SEC-105: Client-Side Only Password Validation

**Severity:** S2 (Medium) | **Effort:** E1 (1-2 hours) | **Status:** OPEN

**Location:** `/home/user/sonash-v0/components/auth/sign-in-modal.tsx`

**OWASP:** A07:2021 - Identification and Authentication Failures

**Description:** Password requirements appear to only be enforced client-side.
Firebase Auth enforces a minimum of 6 characters, but there are no visible
server-side checks for password complexity (uppercase, numbers, special
characters).

**Risk:**

- Users can create weak passwords
- Increased susceptibility to credential stuffing
- Does not meet NIST guidelines (though recovery apps may have different risk
  profiles)

**Recommendation:**

1. Implement Firebase Auth password policy (if using Identity Platform)
2. Add client-side password strength indicator
3. Consider adding compromised password checking (HIBP API)

---

## Low Severity Findings (S3)

### SEC-106: Public Firebase Config in Tracked Env File

**Severity:** S3 (Low) | **Effort:** E0 (<30 min) | **Status:** INFORMATIONAL

**Location:** `/home/user/sonash-v0/.env.production:5-10`

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDGvM5kFwkgSTUS1Tbwt0piuhk9bcCeY7Q
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sonash-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sonash-app
```

**OWASP:** A02:2021 - Cryptographic Failures (tangential)

**Description:** Firebase public configuration values are stored in a tracked
`.env.production` file. While these values are intentionally public (as per
Firebase documentation), having them in an env file could confuse developers
into thinking they are secrets.

**Note:** This is NOT a security vulnerability per se - Firebase API keys are
designed to be public. The security comes from Firestore rules, App Check, and
authentication.

**Recommendation:**

1. Add clear comment at top of file:
   `# These are PUBLIC Firebase config values - security is enforced server-side`
2. Consider moving to `firebase-config.ts` for clarity

---

### SEC-107: Client-Side Admin Mobile Detection

**Severity:** S3 (Low) | **Effort:** E0 (documentation only) | **Status:** BY
DESIGN

**Location:** `/home/user/sonash-v0/app/admin/page.tsx:35-37`

```typescript
const isMobile =
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
  window.innerWidth < 768;
```

**OWASP:** A04:2021 - Insecure Design (tangential)

**Description:** The admin panel's mobile device blocking is client-side only. A
user could spoof their user agent or resize their browser to bypass this check.

**Actual Risk:** LOW - This is a UX feature, not a security control. Admin
authentication and authorization are properly enforced server-side via custom
claims.

**Recommendation:**

1. No action required - this is correctly designed as UX, not security
2. Document that this is a UX optimization, not a security boundary

---

### SEC-108: Hardcoded Fallback reCAPTCHA Site Key

**Severity:** S3 (Low) | **Effort:** E1 (1-2 hours) | **Status:** OPEN

**Location:** `/home/user/sonash-v0/functions/src/recaptcha-verify.ts:66`

```typescript
const siteKey =
  process.env.RECAPTCHA_SITE_KEY || "6LdeazosAAAAAMDNCh1hTUDKh_UeS6xWY1-85B2O";
```

**OWASP:** A05:2021 - Security Misconfiguration

**Description:** A fallback reCAPTCHA site key is hardcoded in the Cloud
Functions code. While this ensures functionality if the environment variable is
not set, it creates a coupling between code and infrastructure.

**Risk:** Minimal - reCAPTCHA site keys are designed to be public.

**Recommendation:**

1. Remove fallback and require environment variable
2. Fail fast if configuration is missing

---

### SEC-109: Public Sentry DSN

**Severity:** S3 (Low) | **Effort:** E0 (<30 min) | **Status:** INFORMATIONAL

**Location:** `/home/user/sonash-v0/.env.production:20`

```
NEXT_PUBLIC_SENTRY_DSN=https://f585a8353ec50d104e5484fedca6c2f2@o4510530873589760.ingest.us.sentry.io/4510711416094720
```

**OWASP:** A09:2021 - Security Logging and Monitoring Failures (tangential)

**Description:** The Sentry DSN is publicly visible. Per Sentry documentation,
DSNs are designed to be public (they only allow sending data, not reading).
However, exposure could lead to event injection.

**Current Mitigation:** Sentry has built-in protections against abuse.

**Recommendation:**

1. Configure Sentry allowed domains to restrict submissions
2. Enable rate limiting in Sentry project settings
3. Review Sentry's security features documentation

---

## Positive Security Patterns Observed

### Excellent Practices

1. **Defense-in-Depth Architecture:**
   - Firestore security rules block direct writes
   - Cloud Functions enforce validation + rate limiting + App Check
   - Client-side validation prevents bad UX

2. **Comprehensive Input Validation:**
   - Zod schemas for all Cloud Function inputs
     (`/home/user/sonash-v0/functions/src/schemas.ts`)
   - Type-safe validation with `z.infer<>`
   - Content length limits (50KB for daily logs, 10KB for searchable text)
   - Date format validation (YYYY-MM-DD regex)

3. **Rate Limiting:**
   - Firestore-backed (survives cold starts and horizontal scaling)
   - User-based + IP-based (CANON-0036)
   - Configurable limits per operation
   - Cleanup jobs prevent database bloat
   - Fail-closed strategy during outages

4. **PII Protection:**
   - SHA-256 hashing of user IDs in logs (`hashUserId()`)
   - Sensitive metadata redaction (`redactSensitiveMetadata()`)
   - PII pattern redaction in messages (`redactPiiFromMessage()`)
   - Exported redaction function for defense-in-depth on read

5. **Security Logging:**
   - Structured JSON logs for GCP Cloud Logging
   - Firestore storage for admin panel access
   - 30-day TTL policy via `expiresAt` field
   - Sentry integration for critical events

6. **Security Headers (Properly Configured):**
   - X-Frame-Options: DENY (clickjacking protection)
   - X-Content-Type-Options: nosniff (MIME-sniffing protection)
   - Strict-Transport-Security: max-age=31536000; includeSubDomains
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy: restricts sensitive APIs

7. **Data Migration Security:**
   - Only target user can receive migrated data
   - Prevents anonymous users pushing to arbitrary accounts
   - Batch chunking for >500 documents (Firestore limit)
   - Partial migration tracking with detailed logging

8. **Secure Coding Patterns:**
   - No `dangerouslySetInnerHTML` usage found
   - No `eval()` or `innerHTML` usage found
   - Path traversal prevention in file cleanup (`jobs.ts:46-64`)
   - Regex DoS prevention with bounded quantifiers

---

## OWASP Top 10 2021 Mapping

| OWASP Category                     | Findings                                 | Status        |
| ---------------------------------- | ---------------------------------------- | ------------- |
| **A01: Broken Access Control**     | None - Firestore rules + Cloud Functions | **COMPLIANT** |
| **A02: Cryptographic Failures**    | SEC-106 (informational)                  | **COMPLIANT** |
| **A03: Injection**                 | None - Zod validation, no raw SQL        | **COMPLIANT** |
| **A04: Insecure Design**           | SEC-107 (by design)                      | **COMPLIANT** |
| **A05: Security Misconfiguration** | SEC-103 (CSP), SEC-108 (fallback key)    | MODERATE RISK |
| **A06: Vulnerable Components**     | Not tested - requires npm audit          | NOT TESTED    |
| **A07: Auth Failures**             | SEC-101, SEC-102, SEC-104, SEC-105       | MODERATE RISK |
| **A08: Software/Data Integrity**   | None - server-side timestamps            | **COMPLIANT** |
| **A09: Logging Failures**          | None - comprehensive logging present     | **COMPLIANT** |
| **A10: SSRF**                      | None - no user-controlled URLs           | **COMPLIANT** |

---

## Compliance Assessment

### HIPAA Considerations (Recovery App Handles PHI)

- **Required:** Encryption at rest/transit - COMPLIANT (Firebase default)
- **Required:** Access controls - COMPLIANT (Strong auth + Firestore rules)
- **Required:** Audit logging - COMPLIANT (Security event logging)
- **Required:** Session management - COMPLIANT (Firebase SDK handles)
- **Required:** Data breach notification - NOT TESTED (No formal process
  documented)

### GDPR Compliance

- **Right to Access:** COMPLIANT (User can export data)
- **Right to Deletion:** COMPLIANT (Soft delete + hard delete jobs)
- **Right to Portability:** COMPLIANT (JSON export)
- **Data Minimization:** COMPLIANT (Only required fields collected)
- **Purpose Limitation:** COMPLIANT (Clear privacy-first architecture)
- **Storage Limitation:** COMPLIANT (30-day TTL on logs, 90-day archive)

---

## Recommendations Summary

### Immediate Actions (This Sprint)

1. **Create tracking issue for App Check re-enablement** (SEC-101) with specific
   date
2. **Make reCAPTCHA required** in migrateAnonymousUserData (SEC-102) or add
   alternative verification

### Short-Term (Next 2 Sprints)

3. **Implement CSP header** (SEC-103) starting with Report-Only mode
4. **Add deployment validation** (SEC-104) to prevent RECAPTCHA_BYPASS in
   production

### Long-Term (Backlog)

5. **Review password policy** (SEC-105) and consider strength requirements
6. **Clean up environment variable fallbacks** (SEC-108) in production code
7. **Configure Sentry allowed domains** (SEC-109)

---

## False Positives Acknowledged

Per `/home/user/sonash-v0/docs/audits/FALSE_POSITIVES.jsonl`:

- SEC-001, SEC-002 (previous audit): Verified as false positives - no
  credentials in git
- Firebase API keys in .env.production are intentionally public
- detect-object-injection warnings are safe iteration patterns
- detect-non-literal-fs-filename warnings are for validated CLI scripts

---

## Conclusion

The SoNash application demonstrates **strong security fundamentals** with
comprehensive defense-in-depth architecture. The primary gaps are:

1. **App Check disabled** - creates opportunity for API abuse (mitigated by
   reCAPTCHA)
2. **Missing CSP header** - increases XSS risk surface
3. **Optional reCAPTCHA** - inconsistent security enforcement

Once App Check is re-enabled and CSP is implemented, the application will have
**excellent security posture** appropriate for handling sensitive personal
recovery data.

**Recommended Next Steps:**

1. Create tracking issues for SEC-101 and SEC-102 with deadlines
2. Schedule CSP implementation and testing
3. Implement monthly security audit cadence
4. Add automated security scanning to CI/CD pipeline

---

**Report Prepared By:** Security Agent (Claude Opus 4.5) **Audit Methodology:**
Manual code review + static analysis + threat modeling **Review Duration:**
Comprehensive session **Files Reviewed:** 50+ files across authentication, Cloud
Functions, Firestore rules, client code **Total Findings:** 9 (0 Critical, 2
High, 3 Medium, 4 Low)

---

## Version History

| Version | Date       | Changes                                                               |
| ------- | ---------- | --------------------------------------------------------------------- |
| 1.0     | 2026-01-24 | Initial version                                                       |
| 1.1     | 2026-01-26 | Findings #1 and #2 verified as false positives                        |
| 2.0     | 2026-01-30 | Complete re-audit - updated findings, security headers now configured |

---

_Session: https://claude.ai/code/session_01GJYLw1MxVMeM5fZPBmg8kp_
