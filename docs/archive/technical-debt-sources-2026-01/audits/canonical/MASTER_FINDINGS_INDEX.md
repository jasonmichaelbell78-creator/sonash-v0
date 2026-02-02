# Master Findings Index

<!-- prettier-ignore-start -->
**Document Version:** 1.1
**Last Updated:** 2026-01-30
**Status:** ACTIVE
<!-- prettier-ignore-end -->

> Generated: 2026-01-30 | Session #116 | Total Findings: 203 Includes: 172
> Session #116 findings + 31 legacy findings (DEDUP, EFF, PERF, M2.3-REF,
> M4.5-SEC)

---

## Summary

| Severity    | Count | Description             |
| ----------- | ----- | ----------------------- |
| S0 Critical | 6     | Immediate fix required  |
| S1 High     | 52    | Fix before next release |
| S2 Medium   | 96    | Fix when convenient     |
| S3 Low      | 49    | Nice to have            |

| Category                 | Count | ROADMAP Section         |
| ------------------------ | ----- | ----------------------- |
| code                     | 89    | M2.1 Code Quality       |
| security                 | 26    | M4.5 Security & Privacy |
| refactoring              | 24    | M2.3-REF                |
| process                  | 20    | Track D                 |
| performance              | 19    | Track P                 |
| documentation            | 18    | Track B                 |
| engineering-productivity | 7     | Track E                 |

---

## S0 Critical (6)

### CANON-0067: 47 CRITICAL cognitive complexity violations in scripts (19 functions)

- **Original ID:** CANON-0064
- **File:** `scripts/assign-review-tier.js`
- **Category:** refactoring
- **Effort:** E3
- **ROADMAP:** M2.3-REF
- **Description:** SonarQube CRITICAL violations. Functions exceeding 15-point
  threshold are difficult to test, maintain, debug.

### CANON-0138: Reduce 47 CRITICAL complexity functions

- **Original ID:** DEDUP-0014
- **File:** `undefined`
- **Category:** code
- **Effort:** E3
- **ROADMAP:** M2.1 Code Quality
- **Description:**

### CANON-0162: Convert CI gates to blocking

- **Original ID:** DEDUP-0015
- **File:** `undefined`
- **Category:** code
- **Effort:** E2
- **ROADMAP:** M2.1 Code Quality
- **Description:**

### CANON-0173: Re-enable App Check on Cloud Functions

- **Original ID:** DEDUP-0001
- **File:** `lib/firebase.ts:45`
- **Category:** security
- **Effort:** E2
- **ROADMAP:** M4.5
- **Description:** Re-enable Firebase App Check on Cloud Functions after
  reCAPTCHA and rate limiting prerequisites

### CANON-0174: Close legacy journalEntries write path

- **Original ID:** DEDUP-0002
- **File:** `lib/firestore-service.ts:156`
- **Category:** security
- **Effort:** E2
- **ROADMAP:** M2.3-REF
- **Description:** Close the legacy direct journalEntries Firestore write path

### CANON-0178: Fix useJournal memory leak

- **Original ID:** DEDUP-0011
- **File:** `hooks/use-journal.ts:156`
- **Category:** code
- **Effort:** E1
- **ROADMAP:** M2.1
- **Description:** Fix memory leak in useJournal hook cleanup

## S1 High (52)

| ID         | Original     | Title                                          | File                           | Category                 | ROADMAP                 |
| ---------- | ------------ | ---------------------------------------------- | ------------------------------ | ------------------------ | ----------------------- |
| CANON-0001 | CODE-001     | 5 failing tests in check-docs-light.test.ts    | `check-docs-light.test.ts:199` | code                     | M2.1 Code Quality       |
| CANON-0011 | DOC-001      | 16 broken anchor links detected by docs:check  | `SESSION_CONTEXT.md:47`        | documentation            | Track B                 |
| CANON-0012 | DOC-002      | 20 placeholder issues across 5 template insta  | `PERFORMANCE_AUDIT_PLAN_20`    | documentation            | Track B                 |
| CANON-0023 | CANON-0070   | Deprecated saveNotebookJournalEntry still use  | `firestore-service.ts`         | refactoring              | M2.3-REF                |
| CANON-0030 | CANON-0003   | Console.\* usage in app components bypasses st | `library.ts`                   | refactoring              | M2.3-REF                |
| CANON-0031 | CANON-0005   | Client App Check initialization is disabled/c  | `firebase.ts`                  | code                     | M2.1 Code Quality       |
| CANON-0032 | CANON-0007   | Critical logic divergence in journal saving (  | `firestore-service.ts`         | refactoring              | M2.3-REF                |
| CANON-0033 | CANON-0008   | reCAPTCHA verification is logged but not enfo  | `security-wrapper.ts`          | code                     | M2.1 Code Quality       |
| CANON-0034 | CANON-0010   | Admin-claim Firestore rule writes lack functi  | `firestore.rules`              | code                     | M2.1 Code Quality       |
| CANON-0035 | CANON-0012   | No integration tests for Firestore rules (emu  | `firestore.rules`              | code                     | M2.1 Code Quality       |
| CANON-0036 | CANON-0013   | Security-critical files have low test coverag  | `account-linking.ts`           | code                     | M2.1 Code Quality       |
| CANON-0037 | CANON-0015   | Potential rate limit bypass via cycling anony  | `auth-context.tsx`             | code                     | M2.1 Code Quality       |
| CANON-0038 | CANON-0016   | Potential sensitive data in localStorage (nee  | `N/A`                          | code                     | M2.1 Code Quality       |
| CANON-0050 | CANON-0035   | reCAPTCHA token missing does not block reques  | `security-wrapper.ts`          | security                 | M4.5 Security & Privacy |
| CANON-0051 | CANON-0036   | Rate limiting is incomplete (no IP throttling  | `security-wrapper.ts`          | security                 | M4.5 Security & Privacy |
| CANON-0056 | CANON-0045   | Landing page forced to client-side rendering   | `page.tsx`                     | performance              | Track P                 |
| CANON-0057 | CANON-0049   | Notebook module registry eagerly imports all   | `roadmap-modules.tsx`          | performance              | Track P                 |
| CANON-0068 | CANON-0067   | Journal entry type definitions diverge betwee  | `journal.ts`                   | refactoring              | M2.3-REF                |
| CANON-0069 | CANON-0071   | useJournal mixes domain logic with transport   | `use-journal.ts`               | refactoring              | M2.3-REF                |
| CANON-0077 | CANON-0091   | Broken relative links in review/output docs (  | `CODE_REVIEW_2026_Q1.md`       | documentation            | Track B                 |
| CANON-0078 | CANON-0092   | [X] placeholders remain in 2026-Q1 plan insta  | `CODE_REVIEW_PLAN_2026_Q1.`    | documentation            | Track B                 |
| CANON-0090 | CANON-0106   | Automation scripts have critically low test c  | ``                             | process                  | Track D                 |
| CANON-0091 | CANON-0108   | Deploy workflow calls gcloud without installi  | `deploy-firebase.yml`          | process                  | Track D                 |
| CANON-0099 | CANON-0005   | Restore client App Check init                  | `N/A`                          | security                 | M4.5 Security & Privacy |
| CANON-0100 | CANON-0010   | Admin-claim rules defense-in-depth             | `N/A`                          | security                 | M4.5 Security & Privacy |
| CANON-0101 | CANON-0014   | Verify reCAPTCHA coverage                      | `N/A`                          | security                 | M4.5 Security & Privacy |
| CANON-0102 | CANON-0015   | Rate limit bypass mitigation                   | `N/A`                          | security                 | M4.5 Security & Privacy |
| CANON-0103 | CANON-0016   | Audit localStorage for sensitive data          | `N/A`                          | security                 | M4.5 Security & Privacy |
| CANON-0106 | DEDUP-0006   | Fix journal entry type mismatch                | `N/A`                          | code                     | M2.1 Code Quality       |
| CANON-0115 | DEDUP-0008   | Remove deprecated saveNotebookJournalEntry     | `N/A`                          | code                     | M2.1 Code Quality       |
| CANON-0116 | CANON-0071   | Separate domain/transport in useJournal        | `N/A`                          | code                     | M2.1 Code Quality       |
| CANON-0119 | CANON-0046   | Reduce 'use client' directives                 | `N/A`                          | code                     | M2.1 Code Quality       |
| CANON-0120 | CANON-0009   | Explicit client providers wrapper              | `N/A`                          | code                     | M2.1 Code Quality       |
| CANON-0124 | CANON-0048   | Fix TodayPage subscription bug                 | `N/A`                          | code                     | M2.1 Code Quality       |
| CANON-0125 | CANON-0049   | Lazy load notebook modules                     | `N/A`                          | code                     | M2.1 Code Quality       |
| CANON-0136 | CANON-0012   | Add Firestore rules emulator tests             | `N/A`                          | code                     | M2.1 Code Quality       |
| CANON-0137 | CANON-0013   | Increase security file coverage                | `N/A`                          | code                     | M2.1 Code Quality       |
| CANON-0148 | CANON-0091   | Fix broken relative links                      | `N/A`                          | code                     | M2.1 Code Quality       |
| CANON-0149 | CANON-0092   | Replace [X] placeholders                       | `N/A`                          | code                     | M2.1 Code Quality       |
| CANON-0163 | CANON-0107   | Add npm audit + CodeQL + Dependabot            | `N/A`                          | code                     | M2.1 Code Quality       |
| CANON-0164 | CANON-0108   | Add gcloud setup to deploy workflow            | `N/A`                          | code                     | M2.1 Code Quality       |
| CANON-0170 | LEGACY-001   | Item Name                                      | `today-page.tsx:89`            | code                     | M2.1 Code Quality       |
| CANON-0175 | DEDUP-0003   | Make reCAPTCHA fail-closed                     | `security-wrapper.ts:89`       | security                 | M4.5                    |
| CANON-0176 | DEDUP-0004   | Complete rate limiting (IP + admin)            | `security-wrapper.ts:45`       | security                 | M4.5                    |
| CANON-0177 | DEDUP-0005   | Replace console.\* with logger                 | `library.ts:23`                | code                     | M2.1                    |
| CANON-0179 | DEDUP-0012   | Enable SSR for landing page                    | `page.tsx`                     | performance              | Track P                 |
| CANON-0184 | EFF-010      | Offline Queue Infrastructure                   | `use-journal.ts:319`           | engineering-productivity | M5                      |
| CANON-0187 | PERF-001     | Unoptimized images (11MB)                      | ``                             | performance              | Track P                 |
| CANON-0188 | PERF-002     | No code splitting                              | `page.tsx`                     | performance              | Track P                 |
| CANON-0194 | M2.3-REF-001 | Split admin.ts (3,111 lines)                   | `admin.ts:143`                 | refactoring              | M2.3-REF                |
| CANON-0195 | M2.3-REF-002 | Split users-tab.tsx (2,092 lines)              | `users-tab.tsx:84`             | refactoring              | M2.3-REF                |
| CANON-0199 | M4.5-SEC-001 | Rate limiting on public endpoints              | `security-wrapper.ts:45`       | security                 | M4.5                    |

## S2 Medium (96)

| ID         | Original   | Title                                    | File                   | Category                 |
| ---------- | ---------- | ---------------------------------------- | ---------------------- | ------------------------ |
| CANON-0007 | PROC-001   | GitHub Actions using version tags instea | `auto-label-review-ti` | process                  |
| CANON-0013 | DOC-003    | 99 files fail docs:check (313 errors, 17 | `README.md`            | documentation            |
| CANON-0014 | DOC-007    | 15 recent commits touch docs but AUDIT_T | ``                     | documentation            |
| CANON-0021 | PROC-009   | Artifact upload without retention policy | `ci.yml`               | process                  |
| CANON-0022 | PROC-010   | Git diff with @{u}...HEAD fails on new b | `pre-push`             | process                  |
| CANON-0027 | EFFP-002   | No scripts/doctor.js for environment val | ``                     | engineering-productivity |
| CANON-0039 | CANON-0018 | Unsafe type assertions with 'as unknown  | `Step1WorksheetCard.t` | code                     |
| CANON-0040 | CANON-0019 | ESLint security plugin warnings in scrip | `check-review-needed.` | code                     |
| CANON-0041 | CANON-0022 | Unsafe localStorage JSON.parse in use-sm | `use-smart-prompts.ts` | code                     |
| CANON-0042 | CANON-0024 | Inconsistent Firebase Functions import p | `firestore-service.ts` | refactoring              |
| CANON-0043 | CANON-0025 | Inconsistent httpsCallable typing (missi | `firestore-service.ts` | code                     |
| CANON-0044 | CANON-0026 | useJournal sets up its own auth listener | `use-journal.ts`       | refactoring              |
| CANON-0045 | CANON-0028 | Journal entry schema data is weakly type | `schemas.ts`           | code                     |
| CANON-0046 | CANON-0029 | No tests for useJournal hook             | `use-journal.ts`       | code                     |
| CANON-0052 | CANON-0037 | Zod schemas missing .strict() (unknown f | `schemas.ts`           | security                 |
| CANON-0053 | CANON-0039 | Server-side journal entry type enum miss | `schemas.ts`           | security                 |
| CANON-0054 | CANON-0040 | Permissive z.record(..., z.unknown()) al | `schemas.ts`           | security                 |
| CANON-0055 | CANON-0041 | Some admin-managed collections allow dir | `firestore.rules`      | security                 |
| CANON-0058 | CANON-0050 | Sentry integration incomplete - no Web V | `sentry.client.ts`     | performance              |
| CANON-0059 | CANON-0052 | Celebration animations create 150+ DOM e | `confetti-burst.tsx`   | performance              |
| CANON-0060 | CANON-0053 | No React.memo usage causes unnecessary r | `entry-card.tsx`       | performance              |
| CANON-0061 | CANON-0056 | Meeting map renders all markers without  | `page.tsx`             | performance              |
| CANON-0062 | CANON-0058 | Console statements in production code    | `use-journal.ts`       | performance              |
| CANON-0063 | CANON-0059 | Firebase queries lack consistent indexin | `meetings.ts`          | performance              |
| CANON-0064 | CANON-0061 | Step1WorksheetCard excessive complexity  | `Step1WorksheetCard.t` | performance              |
| CANON-0065 | CANON-0062 | No route-level loading UI (loading.tsx)  | `page.tsx`             | performance              |
| CANON-0066 | CANON-0063 | JournalHub eagerly imports all entry for | `journal-hub.tsx`      | performance              |
| CANON-0070 | CANON-0074 | Critical paths have low test coverage (f | `firestore-service.ts` | refactoring              |
| CANON-0071 | CANON-0077 | Firebase collection access scattered acr | `slogans.ts`           | refactoring              |
| CANON-0072 | CANON-0082 | Dual-write pattern to inventory AND jour | `SpotCheckCard.tsx`    | refactoring              |
| CANON-0073 | CANON-0083 | Deprecated API usage (31 instances) + Ne | `multiple`             | refactoring              |
| CANON-0074 | CANON-0085 | FirestoreAdapter exists but is unused (r | `firestore-adapter.ts` | refactoring              |
| CANON-0079 | CANON-0093 | DOCUMENTATION_INDEX.md orphaned and miss | `DOCUMENTATION_INDEX.` | documentation            |
| CANON-0080 | CANON-0094 | Tier 2 docs missing required metadata (D | `ANTIGRAVITY_GUIDE.md` | documentation            |
| CANON-0081 | CANON-0095 | Standards/templates contain live placeho | `DOCUMENTATION_STANDA` | documentation            |
| CANON-0082 | CANON-0096 | DOCUMENT_DEPENDENCIES.md claims SYNCED b | `DOCUMENT_DEPENDENCIE` | documentation            |
| CANON-0083 | CANON-0097 | PR_REVIEW_PROMPT_TEMPLATE lacks required | `PR_REVIEW_PROMPT_TEM` | documentation            |
| CANON-0084 | CANON-0098 | CODE_PATTERNS.md referenced with incorre | `CODE_PATTERNS.md`     | documentation            |
| CANON-0092 | CANON-0110 | Pre-commit hook runs full test suite cau | `pre-commit`           | process                  |
| CANON-0093 | CANON-0113 | Auto-label workflow has invalid if: expr | `auto-label-review-ti` | process                  |

_... and 56 more S2 findings_

## S3 Low (49)

S3 findings are tracked in MASTER_FINDINGS.jsonl but not listed here
individually.

| Category                 | Count |
| ------------------------ | ----- |
| code                     | 21    |
| process                  | 10    |
| documentation            | 6     |
| refactoring              | 6     |
| security                 | 4     |
| engineering-productivity | 2     |

---

## Legacy ID Cross-Reference

The following legacy IDs have been migrated to canonical CANON IDs:

| Legacy ID    | Canonical ID | Title                                    |
| ------------ | ------------ | ---------------------------------------- |
| CODE-001     | CANON-0001   | 5 failing tests in check-docs-light.test |
| CODE-006     | CANON-0002   | void operator usage flagged by SonarClou |
| CODE-009     | CANON-0003   | TODO comment for unimplemented feature   |
| CODE-010     | CANON-0004   | TODO comment for user preferences featur |
| CODE-011     | CANON-0005   | Useless assignment to hasMore variable   |
| DEDUP-0001   | CANON-0173   | Re-enable App Check on Cloud Functions   |
| DEDUP-0002   | CANON-0174   | Close legacy journalEntries write path   |
| DEDUP-0003   | CANON-0175   | Make reCAPTCHA fail-closed               |
| DEDUP-0004   | CANON-0176   | Complete rate limiting (IP + admin)      |
| DEDUP-0005   | CANON-0177   | Replace console.\* with logger           |
| DEDUP-0006   | CANON-0106   | Fix journal entry type mismatch          |
| DEDUP-0008   | CANON-0115   | Remove deprecated saveNotebookJournalEnt |
| DEDUP-0010   | CANON-0141   | Consolidate DailyQuoteCard               |
| DEDUP-0011   | CANON-0178   | Fix useJournal memory leak               |
| DEDUP-0012   | CANON-0179   | Enable SSR for landing page              |
| DEDUP-0013   | CANON-0109   | Add .strict() to Zod schemas             |
| DEDUP-0014   | CANON-0138   | Reduce 47 CRITICAL complexity functions  |
| DEDUP-0015   | CANON-0162   | Convert CI gates to blocking             |
| DOC-001      | CANON-0011   | 16 broken anchor links detected by docs: |
| DOC-002      | CANON-0012   | 20 placeholder issues across 5 template  |
| DOC-003      | CANON-0013   | 99 files fail docs:check (313 errors, 17 |
| DOC-007      | CANON-0014   | 15 recent commits touch docs but AUDIT_T |
| DOC-008      | CANON-0015   | Archive docs contain significant link ro |
| EFF-006      | CANON-0180   | Add Correlation IDs to Logger            |
| EFF-007      | CANON-0181   | Add Network Status to Logs               |
| EFF-008      | CANON-0182   | Create Smoke Test Script                 |
| EFF-009      | CANON-0183   | Add Bug Report GitHub Template           |
| EFF-010      | CANON-0184   | Offline Queue Infrastructure             |
| EFF-011      | CANON-0185   | Offline Tests                            |
| EFF-012      | CANON-0186   | Network Failure Error Handling Tests     |
| EFFP-002     | CANON-0027   | No scripts/doctor.js for environment val |
| EFFP-006     | CANON-0028   | Error messages lack actionable fix hints |
| EFFP-010     | CANON-0029   | OfflineIndicator is display-only - no sy |
| LEGACY-001   | CANON-0170   | Item Name                                |
| M2.3-REF-001 | CANON-0194   | Split admin.ts (3,111 lines)             |
| M2.3-REF-002 | CANON-0195   | Split users-tab.tsx (2,092 lines)        |
| M2.3-REF-003 | CANON-0196   | Split today-page.tsx (1,199 lines)       |
| M2.3-REF-004 | CANON-0197   | Split dashboard-tab.tsx (1,031 lines)    |
| M2.3-REF-005 | CANON-0198   | Repository pattern violations            |
| M4.5-SEC-001 | CANON-0199   | Rate limiting on public endpoints        |
| M4.5-SEC-002 | CANON-0200   | Restrict CORS origins                    |
| M4.5-SEC-003 | CANON-0201   | Admin privilege hardening                |
| M4.5-SEC-004 | CANON-0202   | Token rotation for long-lived sessions   |
| M4.5-SEC-005 | CANON-0203   | Security rules for new collections       |
| PERF-001     | CANON-0187   | Unoptimized images (11MB)                |
| PERF-002     | CANON-0188   | No code splitting                        |
| PERF-003     | CANON-0189   | Historical Score Tracking                |
| PERF-004     | CANON-0190   | Performance Budgets                      |
| PERF-005     | CANON-0191   | Development Dashboard Integration        |
| PERF-006     | CANON-0192   | PWA Audit Baseline                       |
| PERF-007     | CANON-0193   | Missing cache headers                    |
| PROC-001     | CANON-0007   | GitHub Actions using version tags instea |
| PROC-002     | CANON-0016   | tj-actions/changed-files without CVE-pin |
| PROC-004     | CANON-0017   | Multiple trap commands may override each |
| PROC-006     | CANON-0018   | Script has minimal console output (1 cal |
| PROC-007     | CANON-0019   | TRIGGERS.md last updated 2026-01-02 but  |
| PROC-008     | CANON-0020   | All 12 slash commands have frontmatter d |
| PROC-009     | CANON-0021   | Artifact upload without retention policy |
| PROC-010     | CANON-0022   | Git diff with @{u}...HEAD fails on new b |
| REF-010      | CANON-0024   | CloudFunctionError interface defined twi |
| REF-011      | CANON-0025   | 2 tracked TODO markers in codebase       |
| REF-012      | CANON-0026   | 4 linter suppressions in codebase (ts-ig |
| SEC-007      | CANON-0006   | Math.random for visual effects           |
| SEC-009      | CANON-0008   | Secrets expanded in run block            |
| SEC-010      | CANON-0009   | process.env.NODE_ENV checks for debug in |
| SEC-011      | CANON-0010   | Agent config files present               |

---

## Quick Reference

- **Full details:** `docs/audits/canonical/MASTER_FINDINGS.jsonl`
- **Procedures:** `docs/AUDIT_FINDINGS_PROCEDURE.md`
- **ROADMAP integration:** `docs/audits/canonical/ROADMAP_INTEGRATION.md`
- **Legacy ID mapping:** `docs/audits/canonical/LEGACY_ID_MAPPING.json`
