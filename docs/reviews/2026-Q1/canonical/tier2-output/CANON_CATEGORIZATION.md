# CANON Findings Categorization

**Generated:** 2026-01-11 **Task:** 4.3.2 - Cross-reference with
EIGHT_PHASE_REFACTOR_PLAN.md **Input:** 97 unique findings (after Tier-2
deduplication)

---

## Purpose

This document categorizes canonical findings by their current status (DONE,
STILL_VALID, STALE, NEW) after cross-referencing with the
EIGHT_PHASE_REFACTOR_PLAN to avoid duplicate work.

## Quick Start

1. Review canonical ID categories
2. Check categorization rules
3. Use for finding classification

## AI Instructions

When categorizing findings:

- Follow category definitions exactly
- Use consistent CANON ID format
- Update this reference for new categories

## Version History

| Version | Date       | Changes                         |
| ------- | ---------- | ------------------------------- |
| 1.0     | 2026-01-11 | Initial categorization complete |

---

## Categorization Legend

| Status          | Description                                                             |
| --------------- | ----------------------------------------------------------------------- |
| **DONE**        | Already addressed by previous work (EIGHT_PHASE_REFACTOR_PLAN or other) |
| **STILL_VALID** | Still needs work, validated as relevant                                 |
| **STALE**       | No longer relevant (superseded by new tooling, design changes)          |
| **NEW**         | Not in previous plan, discovered by Multi-AI audits                     |

---

## Summary

| Category    | Count  | Percentage |
| ----------- | ------ | ---------- |
| DONE        | 8      | 8%         |
| STILL_VALID | 67     | 69%        |
| STALE       | 3      | 3%         |
| NEW         | 19     | 20%        |
| **Total**   | **97** | 100%       |

---

## DONE (Already Addressed)

These findings have been fully or substantially addressed by previous work.

| ID                 | Title                            | Evidence                                                   | Source               |
| ------------------ | -------------------------------- | ---------------------------------------------------------- | -------------------- |
| _(old)_ CANON-0001 | Journal writes unified           | Deprecated method removed, routing through Cloud Functions | EIGHT_PHASE Phase 1  |
| _(old)_ CANON-0003 | Firestore rules alignment        | Rules verified and aligned                                 | EIGHT_PHASE Phase 1  |
| _(old)_ CANON-0041 | Rate limiting alignment          | Rate limiting aligned (2025-12-30)                         | EIGHT_PHASE Phase 1  |
| _(old)_ CANON-0043 | Client validation strategy       | CF-only validation confirmed                               | EIGHT_PHASE Phase 1  |
| _(old)_ CANON-0044 | Rules comment mismatch           | Comments fixed                                             | EIGHT_PHASE Phase 1  |
| _(new)_ CANON-0087 | CloudFunctionError defined twice | Partially addressed - one copy remains                     | Verified in code     |
| _(new)_ CANON-0088 | ESLint auto-fixable issues       | Some addressed via lint:fix runs                           | CI history           |
| _(new)_ CANON-0099 | Duplicate CODE_REVIEW_PLAN files | One copy moved to reviews/2026-Q1/                         | File system verified |

---

## STALE (No Longer Relevant)

These findings are superseded by new tooling or design changes.

| ID         | Title                               | Reason Stale                                       |
| ---------- | ----------------------------------- | -------------------------------------------------- |
| CANON-0031 | Environment variables in components | Acceptable pattern for Next.js NEXT*PUBLIC*\* vars |
| CANON-0116 | Pattern checker false positives     | Pattern checker already has allowlist mechanism    |
| CANON-0117 | Review trigger thresholds           | Alert fatigue not observed; thresholds appropriate |

---

## STILL_VALID (Needs Work)

These findings are validated and require remediation.

### S0 Critical (5 items)

| ID         | Title                                 | Effort | PR Bucket             | Notes                             |
| ---------- | ------------------------------------- | ------ | --------------------- | --------------------------------- |
| DEDUP-0001 | App Check disabled on Cloud Functions | E2     | security-hardening    | Maps to old CANON-0002 (DEFERRED) |
| DEDUP-0002 | Legacy journalEntries direct writes   | E2     | security-hardening    | Migration path needed             |
| DEDUP-0011 | useJournal memory leak                | E1     | hooks-standardization | New finding from Multi-AI audit   |
| DEDUP-0014 | 47 CRITICAL cognitive complexity      | E3     | misc                  | SonarQube CRITICAL violations     |
| DEDUP-0015 | CI quality gates non-blocking         | E2     | process               | Regressions escaping to main      |

### S1 High (27 items)

| ID         | Title                                     | Effort | PR Bucket             |
| ---------- | ----------------------------------------- | ------ | --------------------- |
| DEDUP-0003 | reCAPTCHA not enforced (fail-open)        | E1     | security-hardening    |
| DEDUP-0004 | Rate limiting incomplete                  | E2     | security-hardening    |
| DEDUP-0005 | Console logging in production             | E1     | security-hardening    |
| DEDUP-0006 | Journal entry type mismatch               | E0     | types-domain          |
| DEDUP-0007 | Error handling duplicated                 | E1     | hooks-standardization |
| DEDUP-0008 | Deprecated saveNotebookJournalEntry       | E2     | hooks-standardization |
| CANON-0005 | Client App Check init disabled            | E1     | security-hardening    |
| CANON-0009 | Server layout client boundary             | E1     | boundaries            |
| CANON-0010 | Admin-claim rules lack defense-in-depth   | E2     | security-hardening    |
| CANON-0011 | Missing security layer tests              | E2     | tests-hardening       |
| CANON-0012 | No Firestore rules tests                  | E2     | tests-hardening       |
| CANON-0013 | Security files low coverage               | E2     | tests-hardening       |
| CANON-0014 | reCAPTCHA coverage incomplete             | E1     | security-hardening    |
| CANON-0015 | Rate limit bypass via anon cycling        | E2     | security-hardening    |
| CANON-0016 | Sensitive data in localStorage            | E2     | security-hardening    |
| DEDUP-0012 | Landing page SSR blocked                  | E2     | boundaries            |
| CANON-0046 | Excessive 'use client' directives         | E2     | boundaries            |
| CANON-0047 | Static export disables image optimization | E2     | performance           |
| CANON-0048 | TodayPage re-subscribes on change         | E0     | performance           |
| CANON-0049 | Notebook eagerly imports all pages        | E2     | performance           |
| CANON-0068 | Scripts no test coverage                  | E2     | tests-hardening       |
| CANON-0071 | useJournal mixes domain/transport         | E2     | hooks-standardization |
| CANON-0072 | TodayPage god component                   | E3     | boundaries            |
| CANON-0091 | Broken relative links in docs             | E1     | docs                  |
| CANON-0092 | [X] placeholders in plans                 | E1     | docs                  |
| CANON-0106 | Scripts low test coverage                 | E2     | tests-hardening       |
| CANON-0107 | Missing security scanning in CI           | E2     | process               |
| CANON-0108 | Deploy workflow missing gcloud setup      | E1     | process               |

### S2 Medium (28 items)

| ID         | Title                                    | Effort | PR Bucket          |
| ---------- | ---------------------------------------- | ------ | ------------------ |
| DEDUP-0009 | Time rotation logic duplicated           | E1     | misc               |
| DEDUP-0010 | DailyQuoteCard duplicated                | E1     | ui-primitives      |
| DEDUP-0013 | Zod schemas permissive                   | E2     | types-domain       |
| CANON-0018 | Unsafe type assertions                   | E1     | types-domain       |
| CANON-0019 | ESLint security warnings in scripts      | E2     | security-hardening |
| CANON-0020 | Journal types duplicated                 | E2     | types-domain       |
| CANON-0021 | Missing error.message null safety        | E0     | types-domain       |
| CANON-0022 | Unsafe localStorage JSON.parse           | E0     | types-domain       |
| CANON-0024 | Inconsistent Firebase imports            | E1     | firebase-access    |
| CANON-0025 | Inconsistent httpsCallable typing        | E1     | types-domain       |
| CANON-0027 | Cloud Function test skipped              | E2     | tests-hardening    |
| CANON-0029 | No tests for useJournal                  | E2     | tests-hardening    |
| CANON-0038 | Hardcoded reCAPTCHA fallback             | E1     | security-hardening |
| CANON-0041 | Admin writes bypass validation           | E1     | security-hardening |
| CANON-0050 | Sentry integration incomplete            | E1     | observability      |
| CANON-0052 | Celebration animations no reduced-motion | E1     | performance        |
| CANON-0053 | No React.memo in list components         | E1     | performance        |
| CANON-0054 | Hero background bypasses optimization    | E1     | performance        |
| CANON-0055 | Large lists not virtualized              | E2     | performance        |
| CANON-0056 | Meeting map no clustering                | E2     | performance        |
| CANON-0057 | 7 unused dependencies                    | E0     | misc               |
| CANON-0059 | Firebase queries lack indexing           | E1     | firebase-access    |
| CANON-0060 | Admin table unbounded fetch              | E2     | firebase-access    |
| CANON-0061 | Step1WorksheetCard 804 lines             | E3     | refactor           |
| CANON-0062 | No route-level loading UI                | E1     | performance        |
| CANON-0063 | JournalHub eagerly imports forms         | E2     | performance        |
| CANON-0074 | Critical paths low coverage              | E2     | tests-hardening    |
| CANON-0075 | Direct Firebase SDK in components        | E2     | boundaries         |

_(Additional S2 items: CANON-0076-0086, CANON-0093-0098, CANON-0109-0115)_

### S3 Low (7 items)

| ID         | Title                              | Effort | PR Bucket    |
| ---------- | ---------------------------------- | ------ | ------------ |
| CANON-0030 | @ts-expect-error suppression       | E0     | types-domain |
| CANON-0032 | 'any' types in production          | E1     | types-domain |
| CANON-0083 | Deprecated APIs + nested ternaries | E2     | misc         |
| CANON-0089 | replaceAll + node: prefix batch    | E1     | misc         |
| CANON-0090 | parseTime helper duplicated        | E0     | misc         |
| CANON-0100 | Archive docs link rot              | E2     | docs         |
| CANON-0118 | Deploy secret handling             | E1     | process      |

---

## NEW (Discovered by Multi-AI Audits)

These findings were not in the EIGHT_PHASE_REFACTOR_PLAN.

### New Security Findings (5)

- DEDUP-0003: reCAPTCHA fail-open behavior
- CANON-0015: Rate limit bypass via anonymous cycling
- CANON-0016: Potential sensitive data in localStorage
- CANON-0038: Hardcoded reCAPTCHA fallback
- CANON-0041: Admin writes bypass validation

### New Performance Findings (10)

- DEDUP-0011: useJournal memory leak (elevated to S0)
- CANON-0047: Image optimization disabled
- CANON-0048: TodayPage subscription bug
- CANON-0052: Celebration animations accessibility
- CANON-0053: Missing React.memo
- CANON-0054: Hero background unoptimized
- CANON-0055: Lists not virtualized
- CANON-0056: Map markers not clustered
- CANON-0062: No loading.tsx files
- CANON-0063: JournalHub eager imports

### New Process Findings (4)

- DEDUP-0015: CI gates non-blocking (elevated to S0)
- CANON-0107: Missing security scanning
- CANON-0108: Deploy workflow gcloud issue
- CANON-0113: Auto-label workflow syntax error

---

## Items Superseded by New Tooling

The following capabilities now address issues that were previously manual:

| Capability                 | Issues Addressed                     |
| -------------------------- | ------------------------------------ |
| Pattern Compliance Checker | Anti-pattern detection automated     |
| Session Start Hook         | Context loading automated            |
| Review Trigger Detection   | Multi-AI review thresholds automated |
| Document Sync Check        | Link validation automated            |
| Consolidation Trigger      | Learnings consolidation tracked      |

---

## Cross-Reference: EIGHT_PHASE_REFACTOR_PLAN Mapping

| Old Plan Item                        | Status      | New CANON Mapping                  |
| ------------------------------------ | ----------- | ---------------------------------- |
| Phase 1 CANON-0001 (Journal writes)  | DONE        | N/A - Completed                    |
| Phase 1 CANON-0002 (App Check)       | STILL_VALID | DEDUP-0001                         |
| Phase 1 CANON-0003 (Rules alignment) | DONE        | N/A - Completed                    |
| Phase 1 CANON-0041 (Rate limiting)   | PARTIAL     | DEDUP-0004 extends this            |
| Phase 1 CANON-0043 (Validation)      | DONE        | N/A - Completed                    |
| Phase 1 CANON-0044 (Comments)        | DONE        | N/A - Completed                    |
| Phase 2 (Firestore patterns)         | STILL_VALID | CANON-0075, CANON-0077             |
| Phase 3 (Typing)                     | PARTIAL     | DEDUP-0006, DEDUP-0013             |
| Phase 4 (Rate limiting)              | STILL_VALID | DEDUP-0004                         |
| Phase 5 (Growth cards)               | STILL_VALID | CANON-0079                         |
| Phase 6 (Rotation/CRUD)              | STILL_VALID | DEDUP-0009, CANON-0080             |
| Phase 7 (Test coverage)              | STILL_VALID | CANON-0068, CANON-0074, CANON-0106 |
| Phase 8 (Journal hook)               | STILL_VALID | DEDUP-0011, CANON-0071             |

---

## Recommendations

### Immediate Actions (S0)

1. Fix useJournal memory leak (DEDUP-0011) - NEW, highest impact
2. Close legacy journalEntries path (DEDUP-0002)
3. Make CI gates blocking (DEDUP-0015) - NEW, process fix
4. Re-enable App Check (DEDUP-0001) - EIGHT_PHASE carry-over

### Quick Wins (E0 items)

1. CANON-0004/DEDUP-0006: Add step-1-worksheet to server schema
2. CANON-0021: Add null safety to error handling
3. CANON-0022: Wrap localStorage parse in try/catch
4. CANON-0030: Fix @ts-expect-error suppression
5. CANON-0057: Remove 7 unused dependencies
6. CANON-0090: Extract parseTime helper

### Batch Operations

1. Run `npm run lint:fix` for auto-fixable issues
2. Run SonarQube auto-fix script for ~317 issues
3. Run docs link fixer for broken relative links

---

**Document Version:** 1.0 **Next Task:** 4.3.3 - Create refreshed refactor
backlog
