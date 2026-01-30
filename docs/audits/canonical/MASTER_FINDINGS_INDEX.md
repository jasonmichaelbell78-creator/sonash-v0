# Master Findings Index

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-01-30
**Status:** ACTIVE
<!-- prettier-ignore-end -->

> Generated: 2026-01-30 | Session #116 | Total Findings: 172

---

## Summary

| Severity    | Count | Description             |
| ----------- | ----- | ----------------------- |
| S0 Critical | 3     | Immediate fix required  |
| S1 High     | 42    | Fix before next release |
| S2 Medium   | 78    | Fix when convenient     |
| S3 Low      | 49    | Nice to have            |

| Category                 | Count | ROADMAP Section         |
| ------------------------ | ----- | ----------------------- |
| code                     | 87    | M2.1 Code Quality       |
| refactoring              | 19    | M2.3-REF                |
| documentation            | 18    | Track B                 |
| security                 | 17    | M4.5 Security & Privacy |
| process                  | 17    | Track D                 |
| performance              | 11    | Track P                 |
| engineering-productivity | 3     | Track E                 |

---

## S0 Critical (3)

### CANON-0067: 47 CRITICAL cognitive complexity violations in scripts (19 functions)

- **File:** `scripts/assign-review-tier.js`
- **Category:** refactoring
- **Effort:** E3
- **ROADMAP:** M2.3-REF
- **Description:** SonarQube CRITICAL violations. Functions exceeding 15-point
  threshold are difficult to test, maintain, debug....

### CANON-0138: Reduce 47 CRITICAL complexity functions

- **File:** `undefined`
- **Category:** code
- **Effort:** E3
- **ROADMAP:** M2.1 Code Quality
- **Description:** ...

### CANON-0162: Convert CI gates to blocking

- **File:** `undefined`
- **Category:** code
- **Effort:** E2
- **ROADMAP:** M2.1 Code Quality
- **Description:** ...

## S1 High (42)

| ID         | Title                                               | File                                  | Category      | Effort | ROADMAP                 |
| ---------- | --------------------------------------------------- | ------------------------------------- | ------------- | ------ | ----------------------- |
| CANON-0001 | 5 failing tests in check-docs-light.test.ts         | `check-docs-light.test.ts:199`        | code          | E1     | M2.1 Code Quality       |
| CANON-0011 | 16 broken anchor links detected by docs:check       | `SESSION_CONTEXT.md:47`               | documentation | E1     | Track B                 |
| CANON-0012 | 20 placeholder issues across 5 template instances   | `PERFORMANCE_AUDIT_PLAN_2026_Q1.md:1` | documentation | E1     | Track B                 |
| CANON-0023 | Deprecated saveNotebookJournalEntry still used in   | `firestore-service.ts`                | refactoring   | E2     | M2.3-REF                |
| CANON-0030 | Console.\* usage in app components bypasses standar | `library.ts`                          | refactoring   | E1     | M2.3-REF                |
| CANON-0031 | Client App Check initialization is disabled/commen  | `firebase.ts`                         | code          | E1     | M2.1 Code Quality       |
| CANON-0032 | Critical logic divergence in journal saving (depre  | `firestore-service.ts`                | refactoring   | E1     | M2.3-REF                |
| CANON-0033 | reCAPTCHA verification is logged but not enforced   | `security-wrapper.ts`                 | code          | E1     | M2.1 Code Quality       |
| CANON-0034 | Admin-claim Firestore rule writes lack function-on  | `firestore.rules`                     | code          | E2     | M2.1 Code Quality       |
| CANON-0035 | No integration tests for Firestore rules (emulator  | `firestore.rules`                     | code          | E2     | M2.1 Code Quality       |
| CANON-0036 | Security-critical files have low test coverage (ac  | `account-linking.ts`                  | code          | E2     | M2.1 Code Quality       |
| CANON-0037 | Potential rate limit bypass via cycling anonymous   | `auth-context.tsx`                    | code          | E2     | M2.1 Code Quality       |
| CANON-0038 | Potential sensitive data in localStorage (needs au  | `N/A`                                 | code          | E2     | M2.1 Code Quality       |
| CANON-0050 | reCAPTCHA token missing does not block requests (l  | `security-wrapper.ts`                 | security      | E1     | M4.5 Security & Privacy |
| CANON-0051 | Rate limiting is incomplete (no IP throttling, adm  | `security-wrapper.ts`                 | security      | E2     | M4.5 Security & Privacy |
| CANON-0056 | Landing page forced to client-side rendering block  | `page.tsx`                            | performance   | E2     | Track P                 |
| CANON-0057 | Notebook module registry eagerly imports all pages  | `roadmap-modules.tsx`                 | performance   | E2     | Track P                 |
| CANON-0068 | Journal entry type definitions diverge between cli  | `journal.ts`                          | refactoring   | E2     | M2.3-REF                |
| CANON-0069 | useJournal mixes domain logic with transport (http  | `use-journal.ts`                      | refactoring   | E2     | M2.3-REF                |
| CANON-0077 | Broken relative links in review/output docs (wrong  | `CODE_REVIEW_2026_Q1.md`              | documentation | E1     | Track B                 |
| CANON-0078 | [X] placeholders remain in 2026-Q1 plan instances   | `CODE_REVIEW_PLAN_2026_Q1.md`         | documentation | E1     | Track B                 |
| CANON-0090 | Automation scripts have critically low test covera  | ``                                    | process       | E2     | Track D                 |
| CANON-0091 | Deploy workflow calls gcloud without installing Go  | `deploy-firebase.yml`                 | process       | E1     | Track D                 |
| CANON-0099 | Restore client App Check init                       | `N/A`                                 | security      | E1     | M4.5 Security & Privacy |
| CANON-0100 | Admin-claim rules defense-in-depth                  | `N/A`                                 | security      | E2     | M4.5 Security & Privacy |
| CANON-0101 | Verify reCAPTCHA coverage                           | `N/A`                                 | security      | E1     | M4.5 Security & Privacy |
| CANON-0102 | Rate limit bypass mitigation                        | `N/A`                                 | security      | E2     | M4.5 Security & Privacy |
| CANON-0103 | Audit localStorage for sensitive data               | `N/A`                                 | security      | E2     | M4.5 Security & Privacy |
| CANON-0106 | Fix journal entry type mismatch                     | `N/A`                                 | code          | E0     | M2.1 Code Quality       |
| CANON-0115 | Remove deprecated saveNotebookJournalEntry          | `N/A`                                 | code          | E2     | M2.1 Code Quality       |
| CANON-0116 | Separate domain/transport in useJournal             | `N/A`                                 | code          | E2     | M2.1 Code Quality       |
| CANON-0119 | Reduce 'use client' directives                      | `N/A`                                 | code          | E2     | M2.1 Code Quality       |
| CANON-0120 | Explicit client providers wrapper                   | `N/A`                                 | code          | E1     | M2.1 Code Quality       |
| CANON-0124 | Fix TodayPage subscription bug                      | `N/A`                                 | code          | E0     | M2.1 Code Quality       |
| CANON-0125 | Lazy load notebook modules                          | `N/A`                                 | code          | E2     | M2.1 Code Quality       |
| CANON-0136 | Add Firestore rules emulator tests                  | `N/A`                                 | code          | E2     | M2.1 Code Quality       |
| CANON-0137 | Increase security file coverage                     | `N/A`                                 | code          | E2     | M2.1 Code Quality       |
| CANON-0148 | Fix broken relative links                           | `N/A`                                 | code          | E1     | M2.1 Code Quality       |
| CANON-0149 | Replace [X] placeholders                            | `N/A`                                 | code          | E1     | M2.1 Code Quality       |
| CANON-0163 | Add npm audit + CodeQL + Dependabot                 | `N/A`                                 | code          | E2     | M2.1 Code Quality       |
| CANON-0164 | Add gcloud setup to deploy workflow                 | `N/A`                                 | code          | E1     | M2.1 Code Quality       |
| CANON-0170 | Item Name                                           | `N/A`                                 | code          | E0     | M2.1 Code Quality       |

## S2 Medium (78)

| ID         | Title                                    | File                            | Category                 | ROADMAP                 |
| ---------- | ---------------------------------------- | ------------------------------- | ------------------------ | ----------------------- |
| CANON-0007 | GitHub Actions using version tags instea | `auto-label-review-tier.yml:18` | process                  | Track D                 |
| CANON-0013 | 99 files fail docs:check (313 errors, 17 | `README.md:1`                   | documentation            | Track B                 |
| CANON-0014 | 15 recent commits touch docs but AUDIT_T | ``                              | documentation            | Track B                 |
| CANON-0021 | Artifact upload without retention policy | `ci.yml:99`                     | process                  | Track D                 |
| CANON-0022 | Git diff with @{u}...HEAD fails on new b | `pre-push:48`                   | process                  | Track D                 |
| CANON-0027 | No scripts/doctor.js for environment val | ``                              | engineering-productivity | Track E                 |
| CANON-0039 | Unsafe type assertions with 'as unknown  | `Step1WorksheetCard.tsx`        | code                     | M2.1 Code Quality       |
| CANON-0040 | ESLint security plugin warnings in scrip | `check-review-needed.js`        | code                     | M2.1 Code Quality       |
| CANON-0041 | Unsafe localStorage JSON.parse in use-sm | `use-smart-prompts.ts`          | code                     | M2.1 Code Quality       |
| CANON-0042 | Inconsistent Firebase Functions import p | `firestore-service.ts`          | refactoring              | M2.3-REF                |
| CANON-0043 | Inconsistent httpsCallable typing (missi | `firestore-service.ts`          | code                     | M2.1 Code Quality       |
| CANON-0044 | useJournal sets up its own auth listener | `use-journal.ts`                | refactoring              | M2.3-REF                |
| CANON-0045 | Journal entry schema data is weakly type | `schemas.ts`                    | code                     | M2.1 Code Quality       |
| CANON-0046 | No tests for useJournal hook             | `use-journal.ts`                | code                     | M2.1 Code Quality       |
| CANON-0052 | Zod schemas missing .strict() (unknown f | `schemas.ts`                    | security                 | M4.5 Security & Privacy |
| CANON-0053 | Server-side journal entry type enum miss | `schemas.ts`                    | security                 | M4.5 Security & Privacy |
| CANON-0054 | Permissive z.record(..., z.unknown()) al | `schemas.ts`                    | security                 | M4.5 Security & Privacy |
| CANON-0055 | Some admin-managed collections allow dir | `firestore.rules`               | security                 | M4.5 Security & Privacy |
| CANON-0058 | Sentry integration incomplete - no Web V | `sentry.client.ts`              | performance              | Track P                 |
| CANON-0059 | Celebration animations create 150+ DOM e | `confetti-burst.tsx`            | performance              | Track P                 |
| CANON-0060 | No React.memo usage causes unnecessary r | `entry-card.tsx`                | performance              | Track P                 |
| CANON-0061 | Meeting map renders all markers without  | `page.tsx`                      | performance              | Track P                 |
| CANON-0062 | Console statements in production code    | `use-journal.ts`                | performance              | Track P                 |
| CANON-0063 | Firebase queries lack consistent indexin | `meetings.ts`                   | performance              | Track P                 |
| CANON-0064 | Step1WorksheetCard excessive complexity  | `Step1WorksheetCard.tsx`        | performance              | Track P                 |
| CANON-0065 | No route-level loading UI (loading.tsx)  | `page.tsx`                      | performance              | Track P                 |
| CANON-0066 | JournalHub eagerly imports all entry for | `journal-hub.tsx`               | performance              | Track P                 |
| CANON-0070 | Critical paths have low test coverage (f | `firestore-service.ts`          | refactoring              | M2.3-REF                |
| CANON-0071 | Firebase collection access scattered acr | `slogans.ts`                    | refactoring              | M2.3-REF                |
| CANON-0072 | Dual-write pattern to inventory AND jour | `SpotCheckCard.tsx`             | refactoring              | M2.3-REF                |
| CANON-0073 | Deprecated API usage (31 instances) + Ne | `multiple`                      | refactoring              | M2.3-REF                |
| CANON-0074 | FirestoreAdapter exists but is unused (r | `firestore-adapter.ts`          | refactoring              | M2.3-REF                |
| CANON-0079 | DOCUMENTATION_INDEX.md orphaned and miss | `DOCUMENTATION_INDEX.md`        | documentation            | Track B                 |
| CANON-0080 | Tier 2 docs missing required metadata (D | `ANTIGRAVITY_GUIDE.md`          | documentation            | Track B                 |
| CANON-0081 | Standards/templates contain live placeho | `DOCUMENTATION_STANDARDS.md`    | documentation            | Track B                 |
| CANON-0082 | DOCUMENT_DEPENDENCIES.md claims SYNCED b | `DOCUMENT_DEPENDENCIES.md`      | documentation            | Track B                 |
| CANON-0083 | PR_REVIEW_PROMPT_TEMPLATE lacks required | `PR_REVIEW_PROMPT_TEMPLATE.md`  | documentation            | Track B                 |
| CANON-0084 | CODE_PATTERNS.md referenced with incorre | `CODE_PATTERNS.md`              | documentation            | Track B                 |
| CANON-0092 | Pre-commit hook runs full test suite cau | `pre-commit`                    | process                  | Track D                 |
| CANON-0093 | Auto-label workflow has invalid if: expr | `auto-label-review-tier.yml`    | process                  | Track D                 |
| CANON-0104 | Address ESLint security warnings         | `N/A`                           | security                 | M4.5 Security & Privacy |
| CANON-0105 | Route admin writes through Functions     | `N/A`                           | security                 | M4.5 Security & Privacy |
| CANON-0107 | Add error.message null safety            | `N/A`                           | code                     | M2.1 Code Quality       |
| CANON-0108 | Safe localStorage JSON.parse             | `N/A`                           | code                     | M2.1 Code Quality       |
| CANON-0109 | Add .strict() to Zod schemas             | `N/A`                           | code                     | M2.1 Code Quality       |
| CANON-0110 | Replace unsafe type assertions           | `N/A`                           | code                     | M2.1 Code Quality       |
| CANON-0111 | Single source for journal types          | `N/A`                           | code                     | M2.1 Code Quality       |
| CANON-0112 | Type httpsCallable generics              | `N/A`                           | code                     | M2.1 Code Quality       |
| CANON-0117 | Create callSecureFunction wrapper        | `N/A`                           | code                     | M2.1 Code Quality       |
| CANON-0118 | Shared reCAPTCHA action constants        | `N/A`                           | code                     | M2.1 Code Quality       |

_... and 28 more S2 findings_

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

## Quick Reference

- **Full details:** `docs/audits/canonical/MASTER_FINDINGS.jsonl`
- **Procedures:** `docs/AUDIT_FINDINGS_PROCEDURE.md`
- **ROADMAP integration:** `docs/audits/canonical/ROADMAP_INTEGRATION.md`
