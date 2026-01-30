# Master Issue List

**Generated:** 2026-01-30 **Source:** Aggregated from single-session audits,
CANON files, and backlogs **Total Items:** 285 (deduplicated from 295 raw
findings) **NET NEW:** 198 (87 already in ROADMAP/Tech Debt)

---

## Summary Statistics

### 🎯 NET NEW Analysis

| Metric                | Count   |
| --------------------- | ------- |
| Total Unique Findings | 285     |
| Already in ROADMAP    | 87      |
| **NET NEW**           | **198** |

### By Severity

| Severity | Count | Description                      |
| -------- | ----- | -------------------------------- |
| S0       | 10    | Critical - implement immediately |
| S1       | 75    | High - implement this sprint     |
| S2       | 135   | Medium - implement next sprint   |
| S3       | 65    | Low - backlog                    |

### By Category

| Category                 | Count |
| ------------------------ | ----- |
| code                     | 120   |
| refactoring              | 40    |
| security                 | 36    |
| performance              | 31    |
| process                  | 24    |
| documentation            | 24    |
| engineering-productivity | 10    |

### By PR Bucket

| PR Bucket                | Count |
| ------------------------ | ----- |
| code-quality             | 83    |
| security-hardening       | 39    |
| performance-optimization | 31    |
| process-automation       | 24    |
| documentation-sync       | 24    |
| dx-improvements          | 10    |
| types-domain             | 10    |
| boundaries               | 6     |
| tests-hardening          | 6     |
| firebase-access          | 6     |
| misc                     | 6     |
| PR16                     | 6     |
| hooks-standardization    | 4     |
| ui-primitives            | 3     |
| PR3                      | 2     |
| PR4                      | 2     |
| PR6                      | 2     |
| PR7                      | 2     |
| PR11                     | 2     |
| PR15                     | 2     |
| PR-BATCH-AUTO            | 2     |
| PR2                      | 1     |
| PR8                      | 1     |
| PR-LINT-WARNINGS         | 1     |
| PR1                      | 1     |
| PR13                     | 1     |
| PR14                     | 1     |
| PR12                     | 1     |
| PR18                     | 1     |
| PR17                     | 1     |
| PR10                     | 1     |
| PR9                      | 1     |
| PR5                      | 1     |
| PR-BATCH-MANUAL          | 1     |

---

## Critical Items (S0)

### MASTER-0078: App Check disabled on all production Cloud Functions

- **Category:** code
- **Effort:** E2
- **Priority Score:** 100
- **PR Bucket:** security-hardening
- **Files:** functions/src/index.ts
- **Sources:** CANON-0001

S0: Bot/device attestation layer is disabled for callable endpoints, increasing
abuse/spam risk and weakening defense-in-depth.

**Recommendation:** Re-enable App Check (requireAppCheck: true) across
functions; add monitoring for App Check failures and ensure client App Check
init is working.

### MASTER-0079: Legacy journalEntries collection allows direct client writes (bypasses function security posture)

- **Category:** code
- **Effort:** E2
- **Priority Score:** 100
- **PR Bucket:** security-hardening
- **Files:** firestore.rules
- **Sources:** CANON-0002, CANON-0034

S0: Direct client writes bypass App Check / rate limiting / server-side
validation, creating a high-risk security outlier vs other collections.

**Recommendation:** Migrate remaining data off legacy path and set allow write:
if false (or route writes through Cloud Functions if still used).

### MASTER-0120: useJournal creates redundant auth listener + potential memory leak from nested cleanup

- **Category:** performance
- **Effort:** E1
- **Priority Score:** 100
- **PR Bucket:** performance-optimization
- **Files:** hooks/use-journal.ts, components/providers/auth-provider.tsx
- **Sources:** CANON-0044

**Recommendation:** Remove auth listener from useJournal; consume user from
useAuthCore() instead. Move onSnapshot unsubscribe to outer useEffect scope.

### MASTER-0140: 47 CRITICAL cognitive complexity violations in scripts (19 functions)

- **Category:** refactoring
- **Effort:** E3
- **Priority Score:** 100
- **PR Bucket:** misc
- **Files:** scripts/assign-review-tier.js, scripts/phase-complete-check.js,
  scripts/suggest-pattern-automation.js, scripts/check-pattern-compliance.js,
  scripts/validate-phase-completion.js, scripts/surface-lessons-learned.js,
  scripts/check-docs-light.js, scripts/check-review-needed.js
- **Sources:** CANON-0064

SonarQube CRITICAL violations. Functions exceeding 15-point threshold are
difficult to test, maintain, debug.

**Recommendation:** Extract nested conditionals into helper functions. Use early
returns. Add test coverage before refactoring.

### MASTER-0175: Multiple CI quality gates configured as non-blocking (continue-on-error: true)

- **Category:** process
- **Effort:** E2
- **Priority Score:** 100
- **PR Bucket:** process-automation
- **Files:** .github/workflows/ci.yml
- **Sources:** CANON-0105

Prettier, unused deps check, pattern compliance, and docs checks have
continue-on-error: true. Formatting drift, dependency issues, pattern
violations, and doc issues can accumulate and ship.

**Recommendation:** Convert to diff-based blocking (changed files only) while
tracking baseline; Add baseline trend reporting to CI logs; Burn down baseline
violations over time, then remove continue-on-error

### MASTER-0189: Re-enable App Check on Cloud Functions

- **Category:** security
- **Effort:** E2
- **Priority Score:** 100
- **PR Bucket:** security-hardening
- **Files:** N/A
- **Sources:** DEDUP-0001

### MASTER-0190: Close legacy journalEntries write path

- **Category:** security
- **Effort:** E2
- **Priority Score:** 100
- **PR Bucket:** PR2
- **Files:** N/A
- **Sources:** DEDUP-0002

### MASTER-0211: Fix useJournal memory leak

- **Category:** code
- **Effort:** E1
- **Priority Score:** 100
- **PR Bucket:** PR1
- **Files:** N/A
- **Sources:** DEDUP-0011

### MASTER-0244: Reduce 47 CRITICAL complexity functions

- **Category:** code
- **Effort:** E3
- **Priority Score:** 100
- **PR Bucket:** PR18
- **Files:** scripts/assign-review-tier.js, scripts/phase-complete-check.js,
  scripts/check-pattern-compliance.js
- **Sources:** DEDUP-0014, CANON-0068, CANON-0068

### MASTER-0275: Convert CI gates to blocking

- **Category:** code
- **Effort:** E2
- **Priority Score:** 100
- **PR Bucket:** PR5
- **Files:** N/A
- **Sources:** DEDUP-0015

---

## High Priority Items (S1)

### MASTER-0001: 5 failing tests in check-docs-light.test.ts

- **Category:** code
- **Effort:** E1
- **Priority Score:** 100
- **PR Bucket:** code-quality
- **Sources:** CODE-001

### MASTER-0004: Very high cognitive complexity in adminListUsers

- **Category:** code
- **Effort:** E2
- **Priority Score:** 100
- **PR Bucket:** code-quality
- **Sources:** CODE-004

### MASTER-0015: Missing critical security headers

- **Category:** security
- **Effort:** E1
- **Priority Score:** 100
- **PR Bucket:** security-hardening
- **Sources:** SEC-001

### MASTER-0016: App Check disabled on Cloud Functions

- **Category:** security
- **Effort:** E0
- **Priority Score:** 100
- **PR Bucket:** security-hardening
- **Sources:** SEC-002

### MASTER-0026: 16 broken anchor links detected by docs:check

- **Category:** documentation
- **Effort:** E1
- **Priority Score:** 100
- **PR Bucket:** documentation-sync
- **Sources:** DOC-001

### MASTER-0027: 20 placeholder issues across 5 template instances

- **Category:** documentation
- **Effort:** E1
- **Priority Score:** 100
- **PR Bucket:** documentation-sync
- **Sources:** DOC-002

### MASTER-0036: Large monolithic component (1117 lines) without code splitting

- **Category:** performance
- **Effort:** E2
- **Priority Score:** 100
- **PR Bucket:** performance-optimization
- **Sources:** PERF-001

### MASTER-0037: No React.memo on frequently re-rendered admin list (924 lines)

- **Category:** performance
- **Effort:** E1
- **Priority Score:** 100
- **PR Bucket:** performance-optimization
- **Sources:** PERF-002

### MASTER-0056: TodayPage god component (1117 lines, 14 useState, 10 useEffect, 24 imports)

- **Category:** refactoring
- **Effort:** E2
- **Priority Score:** 100
- **PR Bucket:** code-quality
- **Sources:** REF-001

### MASTER-0057: UsersTab god component (924 lines, 21 useState, 3 useEffect)

- **Category:** refactoring
- **Effort:** E2
- **Priority Score:** 100
- **PR Bucket:** code-quality
- **Sources:** REF-002

### MASTER-0060: Time-of-day rotation logic duplicated in quotes.ts and slogans.ts (80+ lines)

- **Category:** refactoring
- **Effort:** E1
- **Priority Score:** 100
- **PR Bucket:** code-quality
- **Sources:** REF-005, CANON-0065

### MASTER-0063: Direct Firebase SDK usage in 22+ files bypasses service layer

- **Category:** refactoring
- **Effort:** E2
- **Priority Score:** 100
- **PR Bucket:** code-quality
- **Sources:** REF-008, CANON-0075

### MASTER-0064: Deprecated saveNotebookJournalEntry still used in 6+ UI components

- **Category:** refactoring
- **Effort:** E2
- **Priority Score:** 100
- **PR Bucket:** hooks-standardization
- **Sources:** CANON-0070, REF-009

### MASTER-0071: No correlation IDs for request tracing (frontend to backend)

- **Category:** engineering-productivity
- **Effort:** E2
- **Priority Score:** 100
- **PR Bucket:** dx-improvements
- **Sources:** EFFP-004

### MASTER-0074: No offline write queue - data loss when user goes offline

- **Category:** engineering-productivity
- **Effort:** E3
- **Priority Score:** 100
- **PR Bucket:** dx-improvements
- **Sources:** EFFP-007

### MASTER-0075: No Firebase persistence enabled - Firestore cache not persisted

- **Category:** engineering-productivity
- **Effort:** E1
- **Priority Score:** 100
- **PR Bucket:** dx-improvements
- **Sources:** EFFP-008

### MASTER-0080: Console.\* usage in app components bypasses standardized logger/sanitization

- **Category:** refactoring
- **Effort:** E1
- **Priority Score:** 100
- **PR Bucket:** security-hardening
- **Sources:** CANON-0003

### MASTER-0081: Cloud Function schema missing 'step-1-worksheet' journal entry type (validation drift / feature break)

- **Category:** code
- **Effort:** E0
- **Priority Score:** 100
- **PR Bucket:** types-domain
- **Sources:** CANON-0004

### MASTER-0082: Client App Check initialization is disabled/commented out

- **Category:** code
- **Effort:** E1
- **Priority Score:** 100
- **PR Bucket:** security-hardening
- **Sources:** CANON-0005

### MASTER-0083: Cloud Function error handling duplicated (4 locations) + duplicate CloudFunctionError type definitions

- **Category:** refactoring
- **Effort:** E1
- **Priority Score:** 100
- **PR Bucket:** hooks-standardization
- **Sources:** CANON-0006

### MASTER-0084: Critical logic divergence in journal saving (deprecated FirestoreService path bypasses hook business logic)

- **Category:** refactoring
- **Effort:** E1
- **Priority Score:** 100
- **PR Bucket:** hooks-standardization
- **Sources:** CANON-0007

### MASTER-0085: reCAPTCHA verification is logged but not enforced when configured

- **Category:** code
- **Effort:** E1
- **Priority Score:** 100
- **PR Bucket:** security-hardening
- **Sources:** CANON-0008

### MASTER-0086: Server layout composes client providers; boundary should be explicit

- **Category:** refactoring
- **Effort:** E1
- **Priority Score:** 100
- **PR Bucket:** boundaries
- **Sources:** CANON-0009

### MASTER-0087: Admin-claim Firestore rule writes lack function-only defense-in-depth

- **Category:** code
- **Effort:** E2
- **Priority Score:** 100
- **PR Bucket:** security-hardening
- **Sources:** CANON-0010

### MASTER-0088: Missing automated tests for Cloud Function security layers (App Check / rate limiting / authz)

- **Category:** code
- **Effort:** E2
- **Priority Score:** 100
- **PR Bucket:** tests-hardening
- **Sources:** CANON-0011

### MASTER-0089: No integration tests for Firestore rules (emulator-based)

- **Category:** code
- **Effort:** E2
- **Priority Score:** 100
- **PR Bucket:** tests-hardening
- **Sources:** CANON-0012

### MASTER-0090: Security-critical files have low test coverage (account-linking, firestore-service, recaptcha, users DB)

- **Category:** code
- **Effort:** E2
- **Priority Score:** 100
- **PR Bucket:** tests-hardening
- **Sources:** CANON-0013

### MASTER-0091: reCAPTCHA verification coverage may be incomplete when App Check is disabled (needs verification)

- **Category:** code
- **Effort:** E1
- **Priority Score:** 100
- **PR Bucket:** security-hardening
- **Sources:** CANON-0014

### MASTER-0092: Potential rate limit bypass via cycling anonymous accounts (needs threat-model validation)

- **Category:** code
- **Effort:** E2
- **Priority Score:** 100
- **PR Bucket:** security-hardening
- **Sources:** CANON-0015

### MASTER-0093: Potential sensitive data in localStorage (needs audit)

- **Category:** code
- **Effort:** E2
- **Priority Score:** 100
- **PR Bucket:** security-hardening
- **Sources:** CANON-0016

_...and 45 more S1 items_

---

## Quick Wins (E0/E1 + S1/S2)

| ID          | Title                                                  | Severity | Effort | Category                 | PR Bucket                |
| ----------- | ------------------------------------------------------ | -------- | ------ | ------------------------ | ------------------------ |
| MASTER-0001 | 5 failing tests in check-docs-light.test.ts            | S1       | E1     | code                     | code-quality             |
| MASTER-0002 | Debug console.log statements in production code        | S2       | E1     | code                     | code-quality             |
| MASTER-0012 | Nested component definition                            | S2       | E1     | code                     | code-quality             |
| MASTER-0015 | Missing critical security headers                      | S1       | E1     | security                 | security-hardening       |
| MASTER-0016 | App Check disabled on Cloud Functions                  | S1       | E0     | security                 | security-hardening       |
| MASTER-0017 | Hardcoded reCAPTCHA site key fallback                  | S2       | E0     | security                 | security-hardening       |
| MASTER-0022 | GitHub Actions using version tags instead of commi...  | S2       | E1     | process                  | process-automation       |
| MASTER-0026 | 16 broken anchor links detected by docs:check          | S1       | E1     | documentation            | documentation-sync       |
| MASTER-0027 | 20 placeholder issues across 5 template instances      | S1       | E1     | documentation            | documentation-sync       |
| MASTER-0028 | 99 files fail docs:check (313 errors, 177 warnings...  | S2       | E1     | documentation            | documentation-sync       |
| MASTER-0029 | TRIGGERS.md last updated 2026-01-02 (15 days stale...  | S2       | E0     | documentation            | documentation-sync       |
| MASTER-0030 | DOCUMENTATION_STANDARDS.md last updated 2026-01-01...  | S2       | E0     | documentation            | documentation-sync       |
| MASTER-0031 | DOCUMENT_DEPENDENCIES.md claims SYNCED but sync ch...  | S2       | E1     | documentation            | documentation-sync       |
| MASTER-0032 | 15 recent commits touch docs but AUDIT_TRACKER sho...  | S2       | E1     | documentation            | documentation-sync       |
| MASTER-0037 | No React.memo on frequently re-rendered admin list...  | S1       | E1     | performance              | performance-optimization |
| MASTER-0038 | 30+ components with inline onClick arrow functions     | S2       | E1     | performance              | performance-optimization |
| MASTER-0039 | 28 components with inline style objects                | S2       | E1     | performance              | performance-optimization |
| MASTER-0040 | Large chunk file (628KB) indicates code splitting ...  | S2       | E1     | performance              | performance-optimization |
| MASTER-0041 | 20+ uses of key={index} in list rendering              | S2       | E0     | performance              | performance-optimization |
| MASTER-0042 | setInterval without visibility check continues in ...  | S2       | E1     | performance              | performance-optimization |
| MASTER-0043 | getAllMeetings() deprecated but still available wi...  | S2       | E1     | performance              | performance-optimization |
| MASTER-0050 | 28 scripts have 715 console.log/error/warn calls w...  | S2       | E1     | process                  | process-automation       |
| MASTER-0054 | Artifact upload without retention policy               | S2       | E1     | process                  | process-automation       |
| MASTER-0055 | Git diff with @{u}...HEAD fails on new branches wi...  | S2       | E1     | process                  | process-automation       |
| MASTER-0060 | Time-of-day rotation logic duplicated in quotes.ts...  | S1       | E1     | refactoring              | code-quality             |
| MASTER-0061 | reCAPTCHA token fetch pattern repeated 5x across c...  | S2       | E1     | refactoring              | code-quality             |
| MASTER-0068 | No npm run dev:offline script - requires 2 termina...  | S2       | E0     | engineering-productivity | dx-improvements          |
| MASTER-0069 | No scripts/doctor.js for environment validation        | S2       | E1     | engineering-productivity | dx-improvements          |
| MASTER-0075 | No Firebase persistence enabled - Firestore cache ...  | S1       | E1     | engineering-productivity | dx-improvements          |
| MASTER-0080 | Console.\* usage in app components bypasses standar... | S1       | E1     | refactoring              | security-hardening       |
| MASTER-0081 | Cloud Function schema missing 'step-1-worksheet' j...  | S1       | E0     | code                     | types-domain             |
| MASTER-0082 | Client App Check initialization is disabled/commen...  | S1       | E1     | code                     | security-hardening       |
| MASTER-0083 | Cloud Function error handling duplicated (4 locati...  | S1       | E1     | refactoring              | hooks-standardization    |
| MASTER-0084 | Critical logic divergence in journal saving (depre...  | S1       | E1     | refactoring              | hooks-standardization    |
| MASTER-0085 | reCAPTCHA verification is logged but not enforced ...  | S1       | E1     | code                     | security-hardening       |
| MASTER-0086 | Server layout composes client providers; boundary ...  | S1       | E1     | refactoring              | boundaries               |
| MASTER-0091 | reCAPTCHA verification coverage may be incomplete ...  | S1       | E1     | code                     | security-hardening       |
| MASTER-0094 | Duplicated time-of-day rotation logic for quotes a...  | S2       | E1     | refactoring              | ui-primitives            |
| MASTER-0095 | Unsafe type assertions with 'as unknown as' (works...  | S2       | E1     | code                     | types-domain             |
| MASTER-0098 | Missing error.message null safety in TodayPage cat...  | S2       | E0     | code                     | types-domain             |

---

## Full List by Priority Score

| Rank | ID          | Title                                        | Sev | Effort | Score | Category                 |
| ---- | ----------- | -------------------------------------------- | --- | ------ | ----- | ------------------------ |
| 1    | MASTER-0001 | 5 failing tests in check-docs-light.test...  | S1  | E1     | 100   | code                     |
| 2    | MASTER-0002 | Debug console.log statements in producti...  | S2  | E1     | 100   | code                     |
| 3    | MASTER-0003 | High cognitive complexity in adminSetUse...  | S2  | E2     | 100   | code                     |
| 4    | MASTER-0004 | Very high cognitive complexity in adminL...  | S1  | E2     | 100   | code                     |
| 5    | MASTER-0005 | High cognitive complexity in UsersTab co...  | S2  | E2     | 100   | code                     |
| 6    | MASTER-0006 | void operator usage flagged by SonarClou...  | S3  | E0     | 100   | code                     |
| 7    | MASTER-0007 | No correlation/request ID tracing            | S2  | E2     | 100   | code                     |
| 8    | MASTER-0008 | @ts-expect-error suppression for type mi...  | S3  | E0     | 100   | code                     |
| 9    | MASTER-0009 | TODO comment for unimplemented feature       | S3  | E0     | 100   | code                     |
| 10   | MASTER-0010 | TODO comment for user preferences featur...  | S3  | E0     | 100   | code                     |
| 11   | MASTER-0012 | Nested component definition                  | S2  | E1     | 100   | code                     |
| 12   | MASTER-0015 | Missing critical security headers            | S1  | E1     | 100   | security                 |
| 13   | MASTER-0016 | App Check disabled on Cloud Functions        | S1  | E0     | 100   | security                 |
| 14   | MASTER-0017 | Hardcoded reCAPTCHA site key fallback        | S2  | E0     | 100   | security                 |
| 15   | MASTER-0018 | SonarCloud: Potentially hard-coded passw...  | S3  | E0     | 100   | security                 |
| 16   | MASTER-0019 | OS command execution in CLI scripts          | S2  | E2     | 100   | security                 |
| 17   | MASTER-0020 | ReDoS vulnerable regex patterns              | S2  | E2     | 100   | security                 |
| 18   | MASTER-0021 | Math.random for visual effects               | S3  | E0     | 100   | security                 |
| 19   | MASTER-0022 | GitHub Actions using version tags instea...  | S2  | E1     | 100   | process                  |
| 20   | MASTER-0023 | Secrets expanded in run block                | S3  | E0     | 100   | security                 |
| 21   | MASTER-0024 | process.env.NODE_ENV checks for debug in...  | S3  | E0     | 100   | security                 |
| 22   | MASTER-0025 | Agent config files present                   | S3  | E0     | 100   | security                 |
| 23   | MASTER-0026 | 16 broken anchor links detected by docs:...  | S1  | E1     | 100   | documentation            |
| 24   | MASTER-0027 | 20 placeholder issues across 5 template ...  | S1  | E1     | 100   | documentation            |
| 25   | MASTER-0028 | 99 files fail docs:check (313 errors, 17...  | S2  | E1     | 100   | documentation            |
| 26   | MASTER-0029 | TRIGGERS.md last updated 2026-01-02 (15 ...  | S2  | E0     | 100   | documentation            |
| 27   | MASTER-0030 | DOCUMENTATION_STANDARDS.md last updated ...  | S2  | E0     | 100   | documentation            |
| 28   | MASTER-0031 | DOCUMENT_DEPENDENCIES.md claims SYNCED b...  | S2  | E1     | 100   | documentation            |
| 29   | MASTER-0032 | 15 recent commits touch docs but AUDIT_T...  | S2  | E1     | 100   | documentation            |
| 30   | MASTER-0034 | PR_REVIEW_PROMPT_TEMPLATE.md lacks Last ...  | S3  | E0     | 100   | documentation            |
| 31   | MASTER-0035 | DOCUMENTATION_INDEX.md orphaned - not re...  | S3  | E0     | 100   | documentation            |
| 32   | MASTER-0036 | Large monolithic component (1117 lines) ...  | S1  | E2     | 100   | performance              |
| 33   | MASTER-0037 | No React.memo on frequently re-rendered ...  | S1  | E1     | 100   | performance              |
| 34   | MASTER-0038 | 30+ components with inline onClick arrow...  | S2  | E1     | 100   | performance              |
| 35   | MASTER-0039 | 28 components with inline style objects      | S2  | E1     | 100   | performance              |
| 36   | MASTER-0040 | Large chunk file (628KB) indicates code ...  | S2  | E1     | 100   | performance              |
| 37   | MASTER-0041 | 20+ uses of key={index} in list renderin...  | S2  | E0     | 100   | performance              |
| 38   | MASTER-0042 | setInterval without visibility check con...  | S2  | E1     | 100   | performance              |
| 39   | MASTER-0043 | getAllMeetings() deprecated but still av...  | S2  | E1     | 100   | performance              |
| 40   | MASTER-0047 | tj-actions/changed-files without CVE-pin...  | S3  | E0     | 100   | process                  |
| 41   | MASTER-0048 | lint-staged using npx --no-install may f...  | S3  | E0     | 100   | process                  |
| 42   | MASTER-0049 | Multiple trap commands may override each...  | S3  | E0     | 100   | process                  |
| 43   | MASTER-0050 | 28 scripts have 715 console.log/error/wa...  | S2  | E1     | 100   | process                  |
| 44   | MASTER-0051 | Script has minimal console output (1 cal...  | S3  | E0     | 100   | process                  |
| 45   | MASTER-0052 | TRIGGERS.md last updated 2026-01-02 but ...  | S3  | E0     | 100   | process                  |
| 46   | MASTER-0053 | All 12 slash commands have frontmatter d...  | S3  | E0     | 100   | process                  |
| 47   | MASTER-0054 | Artifact upload without retention policy     | S2  | E1     | 100   | process                  |
| 48   | MASTER-0055 | Git diff with @{u}...HEAD fails on new b...  | S2  | E1     | 100   | process                  |
| 49   | MASTER-0056 | TodayPage god component (1117 lines, 14 ...  | S1  | E2     | 100   | refactoring              |
| 50   | MASTER-0057 | UsersTab god component (924 lines, 21 us...  | S1  | E2     | 100   | refactoring              |
| 51   | MASTER-0058 | Step1WorksheetCard large component (845 ...  | S2  | E2     | 100   | refactoring              |
| 52   | MASTER-0059 | ResourcesPage large component (728 lines...  | S2  | E2     | 100   | refactoring              |
| 53   | MASTER-0060 | Time-of-day rotation logic duplicated in...  | S1  | E1     | 100   | refactoring              |
| 54   | MASTER-0061 | reCAPTCHA token fetch pattern repeated 5...  | S2  | E1     | 100   | refactoring              |
| 55   | MASTER-0062 | Growth card dialog/save pattern duplicat...  | S2  | E2     | 100   | refactoring              |
| 56   | MASTER-0063 | Direct Firebase SDK usage in 22+ files b...  | S1  | E2     | 100   | refactoring              |
| 57   | MASTER-0064 | Deprecated saveNotebookJournalEntry stil...  | S1  | E2     | 100   | refactoring              |
| 58   | MASTER-0065 | CloudFunctionError interface defined twi...  | S3  | E0     | 100   | refactoring              |
| 59   | MASTER-0066 | 2 tracked TODO markers in codebase           | S3  | E0     | 100   | refactoring              |
| 60   | MASTER-0068 | No npm run dev:offline script - requires...  | S2  | E0     | 100   | engineering-productivity |
| 61   | MASTER-0069 | No scripts/doctor.js for environment val...  | S2  | E1     | 100   | engineering-productivity |
| 62   | MASTER-0070 | Setup requires multiple commands - no si...  | S3  | E0     | 100   | engineering-productivity |
| 63   | MASTER-0071 | No correlation IDs for request tracing (...  | S1  | E2     | 100   | engineering-productivity |
| 64   | MASTER-0072 | 8:1 ratio of console.log to structured l...  | S2  | E2     | 100   | engineering-productivity |
| 65   | MASTER-0074 | No offline write queue - data loss when ...  | S1  | E3     | 100   | engineering-productivity |
| 66   | MASTER-0075 | No Firebase persistence enabled - Firest...  | S1  | E1     | 100   | engineering-productivity |
| 67   | MASTER-0076 | No service worker - no offline asset cac...  | S2  | E2     | 100   | engineering-productivity |
| 68   | MASTER-0078 | App Check disabled on all production Clo...  | S0  | E2     | 100   | code                     |
| 69   | MASTER-0079 | Legacy journalEntries collection allows ...  | S0  | E2     | 100   | code                     |
| 70   | MASTER-0080 | Console.\* usage in app components bypass... | S1  | E1     | 100   | refactoring              |
| 71   | MASTER-0081 | Cloud Function schema missing 'step-1-wo...  | S1  | E0     | 100   | code                     |
| 72   | MASTER-0082 | Client App Check initialization is disab...  | S1  | E1     | 100   | code                     |
| 73   | MASTER-0083 | Cloud Function error handling duplicated...  | S1  | E1     | 100   | refactoring              |
| 74   | MASTER-0084 | Critical logic divergence in journal sav...  | S1  | E1     | 100   | refactoring              |
| 75   | MASTER-0085 | reCAPTCHA verification is logged but not...  | S1  | E1     | 100   | code                     |
| 76   | MASTER-0086 | Server layout composes client providers;...  | S1  | E1     | 100   | refactoring              |
| 77   | MASTER-0087 | Admin-claim Firestore rule writes lack f...  | S1  | E2     | 100   | code                     |
| 78   | MASTER-0088 | Missing automated tests for Cloud Functi...  | S1  | E2     | 100   | code                     |
| 79   | MASTER-0089 | No integration tests for Firestore rules...  | S1  | E2     | 100   | code                     |
| 80   | MASTER-0090 | Security-critical files have low test co...  | S1  | E2     | 100   | code                     |
| 81   | MASTER-0091 | reCAPTCHA verification coverage may be i...  | S1  | E1     | 100   | code                     |
| 82   | MASTER-0092 | Potential rate limit bypass via cycling ...  | S1  | E2     | 100   | code                     |
| 83   | MASTER-0093 | Potential sensitive data in localStorage...  | S1  | E2     | 100   | code                     |
| 84   | MASTER-0094 | Duplicated time-of-day rotation logic fo...  | S2  | E1     | 100   | refactoring              |
| 85   | MASTER-0095 | Unsafe type assertions with 'as unknown ...  | S2  | E1     | 100   | code                     |
| 86   | MASTER-0096 | ESLint security plugin warnings in scrip...  | S2  | E2     | 100   | code                     |
| 87   | MASTER-0097 | Journal entry type definitions duplicate...  | S2  | E2     | 100   | refactoring              |
| 88   | MASTER-0098 | Missing error.message null safety in Tod...  | S2  | E0     | 100   | code                     |
| 89   | MASTER-0099 | Unsafe localStorage JSON.parse in use-sm...  | S2  | E0     | 100   | code                     |
| 90   | MASTER-0100 | Duplicated DailyQuoteCard component exis...  | S2  | E1     | 100   | refactoring              |
| 91   | MASTER-0101 | Inconsistent Firebase Functions import p...  | S2  | E1     | 100   | refactoring              |
| 92   | MASTER-0102 | Inconsistent httpsCallable typing (missi...  | S2  | E1     | 100   | code                     |
| 93   | MASTER-0103 | useJournal sets up its own auth listener...  | S2  | E1     | 100   | refactoring              |
| 94   | MASTER-0104 | Cloud Function integration test is skipp...  | S2  | E2     | 100   | code                     |
| 95   | MASTER-0105 | Journal entry schema data is weakly type...  | S2  | E2     | 100   | code                     |
| 96   | MASTER-0106 | No tests for useJournal hook                 | S2  | E2     | 100   | code                     |
| 97   | MASTER-0107 | @ts-expect-error suppression comment in ...  | S3  | E0     | 100   | code                     |
| 98   | MASTER-0108 | Environment variables accessed directly ...  | S3  | E0     | 100   | refactoring              |
| 99   | MASTER-0111 | reCAPTCHA token missing does not block r...  | S1  | E1     | 100   | security                 |
| 100  | MASTER-0112 | Rate limiting is incomplete (no IP throt...  | S1  | E2     | 100   | security                 |

_...and 185 more items (see MASTER_ISSUE_LIST.jsonl for full list)_

---

## Notes

- Priority scores range from 0-100
- Score formula: (severity*weight * 25) + (effort*inverse * 15) +
  (roi_multiplier \* 10) + persistence_boost
- Items found in multiple sources get +10 persistence boost
- See IMPLEMENTATION_PLAN.md for grouped execution plan

---

**Document Version:** 1.0 **Last Updated:** 2026-01-30
