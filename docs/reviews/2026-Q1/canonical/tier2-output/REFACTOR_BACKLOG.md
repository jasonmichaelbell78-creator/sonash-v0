# Refreshed Refactor Backlog

**Generated:** 2026-01-11 **Task:** 4.3.3 - Create refreshed refactor backlog
**Source:** 97 STILL_VALID findings from Tier-2 aggregation **Format:** Ready
for Step 6 ROADMAP.md integration

---

## Purpose

This document contains the refreshed refactor backlog derived from Tier-2
aggregation, organized by category and prioritized for ROADMAP.md integration.

## Version History

| Version | Date       | Changes                      |
| ------- | ---------- | ---------------------------- |
| 1.0     | 2026-01-11 | Initial backlog from Tier-2  |

---

## Backlog Structure

Items are grouped by category and prioritized by:

1. Severity (S0 → S3)
2. Effort (E0 → E3, lower first within severity)
3. Dependencies (items without deps first)

---

## Category: Security Hardening

### S0 Critical

| ID         | Title                                  | Effort | Deps                   | PR  |
| ---------- | -------------------------------------- | ------ | ---------------------- | --- |
| DEDUP-0001 | Re-enable App Check on Cloud Functions | E2     | DEDUP-0003, DEDUP-0004 | -   |
| DEDUP-0002 | Close legacy journalEntries write path | E2     | None                   | PR2 |

### S1 High

| ID         | Title                                 | Effort | Deps       | PR  |
| ---------- | ------------------------------------- | ------ | ---------- | --- |
| DEDUP-0003 | Make reCAPTCHA fail-closed            | E1     | None       | PR3 |
| DEDUP-0004 | Complete rate limiting (IP + admin)   | E2     | DEDUP-0003 | PR4 |
| DEDUP-0005 | Replace console.\* with logger        | E1     | None       | PR8 |
| CANON-0005 | Restore client App Check init         | E1     | DEDUP-0001 | -   |
| CANON-0010 | Admin-claim rules defense-in-depth    | E2     | None       | -   |
| CANON-0014 | Verify reCAPTCHA coverage             | E1     | DEDUP-0003 | PR3 |
| CANON-0015 | Rate limit bypass mitigation          | E2     | DEDUP-0004 | PR4 |
| CANON-0016 | Audit localStorage for sensitive data | E2     | None       | -   |

### S2 Medium

| ID         | Title                                | Effort | Deps | PR               |
| ---------- | ------------------------------------ | ------ | ---- | ---------------- |
| CANON-0019 | Address ESLint security warnings     | E2     | None | PR-LINT-WARNINGS |
| CANON-0038 | Remove hardcoded reCAPTCHA fallback  | E1     | None | -                |
| CANON-0041 | Route admin writes through Functions | E1     | None | -                |

---

## Category: Types & Correctness

### S1 High

| ID         | Title                           | Effort | Deps | PR  |
| ---------- | ------------------------------- | ------ | ---- | --- |
| DEDUP-0006 | Fix journal entry type mismatch | E0     | None | PR6 |

### S2 Medium

| ID         | Title                           | Effort | Deps       | PR  |
| ---------- | ------------------------------- | ------ | ---------- | --- |
| CANON-0021 | Add error.message null safety   | E0     | None       | -   |
| CANON-0022 | Safe localStorage JSON.parse    | E0     | None       | -   |
| DEDUP-0013 | Add .strict() to Zod schemas    | E2     | None       | -   |
| CANON-0018 | Replace unsafe type assertions  | E1     | None       | -   |
| CANON-0020 | Single source for journal types | E2     | DEDUP-0006 | PR6 |
| CANON-0025 | Type httpsCallable generics     | E1     | None       | -   |

### S3 Low

| ID         | Title                            | Effort | Deps | PR  |
| ---------- | -------------------------------- | ------ | ---- | --- |
| CANON-0030 | Fix @ts-expect-error suppression | E0     | None | -   |
| CANON-0032 | Replace 'any' with proper types  | E1     | None | -   |

---

## Category: Hooks & Services Standardization

### S0 Critical

| ID         | Title                      | Effort | Deps | PR  |
| ---------- | -------------------------- | ------ | ---- | --- |
| DEDUP-0011 | Fix useJournal memory leak | E1     | None | PR1 |

### S1 High

| ID         | Title                                      | Effort | Deps       | PR  |
| ---------- | ------------------------------------------ | ------ | ---------- | --- |
| DEDUP-0007 | Extract error handling utility             | E1     | None       | PR7 |
| DEDUP-0008 | Remove deprecated saveNotebookJournalEntry | E2     | DEDUP-0006 | -   |
| CANON-0071 | Separate domain/transport in useJournal    | E2     | DEDUP-0011 | -   |

### S2 Medium

| ID         | Title                             | Effort | Deps       | PR   |
| ---------- | --------------------------------- | ------ | ---------- | ---- |
| CANON-0076 | Create callSecureFunction wrapper | E1     | DEDUP-0003 | PR11 |
| CANON-0078 | Shared reCAPTCHA action constants | E1     | CANON-0076 | PR11 |
| CANON-0079 | Extract useGrowthCardDialog hook  | E2     | None       | -    |

---

## Category: Architecture & Boundaries

### S1 High

| ID         | Title                             | Effort | Deps       | PR   |
| ---------- | --------------------------------- | ------ | ---------- | ---- |
| DEDUP-0012 | Enable SSR for landing page       | E2     | None       | PR13 |
| CANON-0046 | Reduce 'use client' directives    | E2     | DEDUP-0012 | PR14 |
| CANON-0072 | Split TodayPage god component     | E3     | None       | -    |
| CANON-0009 | Explicit client providers wrapper | E1     | None       | -    |

### S2 Medium

| ID         | Title                                | Effort | Deps       | PR   |
| ---------- | ------------------------------------ | ------ | ---------- | ---- |
| CANON-0075 | Route Firebase through service layer | E2     | CANON-0077 | -    |
| CANON-0077 | Create typed collection helpers      | E2     | None       | PR12 |
| CANON-0085 | Clarify FirestoreAdapter boundary    | E2     | CANON-0075 | -    |
| CANON-0082 | Audit inventory dual-write pattern   | E2     | None       | -    |

---

## Category: Performance

### S1 High

| ID         | Title                          | Effort | Deps | PR  |
| ---------- | ------------------------------ | ------ | ---- | --- |
| CANON-0047 | Implement image optimization   | E2     | None | -   |
| CANON-0048 | Fix TodayPage subscription bug | E0     | None | -   |
| CANON-0049 | Lazy load notebook modules     | E2     | None | -   |

### S2 Medium

| ID         | Title                             | Effort | Deps | PR   |
| ---------- | --------------------------------- | ------ | ---- | ---- |
| CANON-0050 | Complete Sentry integration       | E1     | None | -    |
| CANON-0052 | Add reduced-motion to animations  | E1     | None | -    |
| CANON-0053 | Add React.memo to list components | E1     | None | -    |
| CANON-0054 | Optimize hero background image    | E1     | None | -    |
| CANON-0055 | Add virtualization to large lists | E2     | None | PR15 |
| CANON-0056 | Add marker clustering to map      | E2     | None | PR15 |
| CANON-0057 | Remove 7 unused dependencies      | E0     | None | -    |
| CANON-0059 | Add Firebase query indexes        | E1     | None | -    |
| CANON-0060 | Paginate admin CRUD table         | E2     | None | -    |
| CANON-0061 | Decompose Step1WorksheetCard      | E3     | None | -    |
| CANON-0062 | Add loading.tsx files             | E1     | None | -    |
| CANON-0063 | Lazy load JournalHub forms        | E2     | None | -    |

---

## Category: Testing

### S1 High

| ID         | Title                                 | Effort | Deps       | PR   |
| ---------- | ------------------------------------- | ------ | ---------- | ---- |
| CANON-0011 | Add Cloud Function security tests     | E2     | DEDUP-0001 | -    |
| CANON-0012 | Add Firestore rules emulator tests    | E2     | None       | -    |
| CANON-0013 | Increase security file coverage       | E2     | None       | -    |
| CANON-0068 | Add tests for high-complexity scripts | E2     | None       | PR17 |
| CANON-0106 | Add script test coverage (CI)         | E2     | None       | PR17 |

### S2 Medium

| ID         | Title                           | Effort | Deps       | PR  |
| ---------- | ------------------------------- | ------ | ---------- | --- |
| CANON-0027 | Unskip Cloud Function test      | E2     | None       | -   |
| CANON-0029 | Add useJournal hook tests       | E2     | DEDUP-0011 | -   |
| CANON-0074 | Increase critical path coverage | E2     | None       | -   |

---

## Category: Refactoring & Duplication

### S0 Critical

| ID         | Title                                   | Effort | Deps       | PR   |
| ---------- | --------------------------------------- | ------ | ---------- | ---- |
| DEDUP-0014 | Reduce 47 CRITICAL complexity functions | E3     | CANON-0068 | PR18 |

### S2 Medium

| ID         | Title                                  | Effort | Deps       | PR   |
| ---------- | -------------------------------------- | ------ | ---------- | ---- |
| DEDUP-0009 | Extract time rotation utilities        | E1     | None       | PR10 |
| DEDUP-0010 | Consolidate DailyQuoteCard             | E1     | None       | PR9  |
| CANON-0080 | Create CRUD factory                    | E2     | CANON-0077 | -    |
| CANON-0081 | Centralize admin function wrappers     | E1     | None       | -    |
| CANON-0084 | Extract safeReadFile/safeWriteFile     | E1     | None       | -    |
| CANON-0086 | Consolidate searchable-text generation | E1     | None       | -    |

### S3 Low

| ID         | Title                                  | Effort | Deps | PR              |
| ---------- | -------------------------------------- | ------ | ---- | --------------- |
| CANON-0083 | Fix deprecated APIs + nested ternaries | E2     | None | PR-BATCH-MANUAL |
| CANON-0087 | Remove duplicate CloudFunctionError    | E0     | None | PR7             |
| CANON-0088 | Run ESLint auto-fix                    | E0     | None | PR-BATCH-AUTO   |
| CANON-0089 | replaceAll + node: prefix batch        | E1     | None | PR-BATCH-AUTO   |
| CANON-0090 | Extract parseTime helper               | E0     | None | -               |

---

## Category: Documentation

### S1 High

| ID         | Title                     | Effort | Deps | PR   |
| ---------- | ------------------------- | ------ | ---- | ---- |
| CANON-0091 | Fix broken relative links | E1     | None | PR16 |
| CANON-0092 | Replace [X] placeholders  | E1     | None | PR16 |

### S2 Medium

| ID         | Title                                | Effort | Deps | PR   |
| ---------- | ------------------------------------ | ------ | ---- | ---- |
| CANON-0093 | Add DOCUMENTATION_INDEX to README    | E1     | None | PR16 |
| CANON-0094 | Add Tier 2 required metadata         | E1     | None | PR16 |
| CANON-0095 | Fix standards placeholder links      | E0     | None | PR16 |
| CANON-0096 | Update DOCUMENT_DEPENDENCIES sync    | E1     | None | -    |
| CANON-0097 | Add PR_REVIEW_PROMPT metadata        | E1     | None | -    |
| CANON-0098 | Fix CODE_PATTERNS.md path references | E0     | None | PR16 |
| CANON-0109 | Update DEVELOPMENT.md workflow docs  | E1     | None | -    |

### S3 Low

| ID         | Title                                | Effort | Deps | PR  |
| ---------- | ------------------------------------ | ------ | ---- | --- |
| CANON-0100 | Fix archive link rot                 | E2     | None | -   |
| CANON-0101 | Replace template date placeholders   | E0     | None | -   |
| CANON-0102 | Move PR template to docs/templates/  | E0     | None | -   |
| CANON-0103 | Update DEVELOPMENT.md test count     | E0     | None | -   |
| CANON-0104 | Document fragile anchor links        | E0     | None | -   |
| CANON-0114 | Update Husky docs for patterns:check | E0     | None | -   |

---

## Category: Process & CI/CD

### S0 Critical

| ID         | Title                        | Effort | Deps | PR  |
| ---------- | ---------------------------- | ------ | ---- | --- |
| DEDUP-0015 | Convert CI gates to blocking | E2     | None | PR5 |

### S1 High

| ID         | Title                               | Effort | Deps | PR  |
| ---------- | ----------------------------------- | ------ | ---- | --- |
| CANON-0107 | Add npm audit + CodeQL + Dependabot | E2     | None | -   |
| CANON-0108 | Add gcloud setup to deploy workflow | E1     | None | -   |

### S2 Medium

| ID         | Title                             | Effort | Deps | PR  |
| ---------- | --------------------------------- | ------ | ---- | --- |
| CANON-0110 | Move full tests to pre-push only  | E1     | None | -   |
| CANON-0112 | Pin firebase-tools version        | E0     | None | -   |
| CANON-0113 | Fix auto-label workflow if syntax | E0     | None | -   |

### S3 Low

| ID         | Title                          | Effort | Deps | PR  |
| ---------- | ------------------------------ | ------ | ---- | --- |
| CANON-0115 | Add explicit permissions block | E0     | None | -   |
| CANON-0118 | Improve deploy secret handling | E1     | None | -   |

---

## Batch Operations (Not in Category)

| ID               | Title                    | Effort | Items | PR               |
| ---------------- | ------------------------ | ------ | ----- | ---------------- |
| PR-BATCH-AUTO    | SonarQube auto-fixes     | E1     | ~317  | PR-BATCH-AUTO    |
| PR-BATCH-MANUAL  | SonarQube manual fixes   | E2     | ~170  | PR-BATCH-MANUAL  |
| PR-LINT-WARNINGS | ESLint security warnings | E2     | 246   | PR-LINT-WARNINGS |

---

## Execution Summary

### Phase 1: Critical & Quick Wins (Est. 8-12 hours)

- 5 S0 items
- 10 E0 quick wins
- Batch auto-fixes

### Phase 2: S1 High Priority (Est. 20-30 hours)

- 27 S1 items across all categories
- Focus on security and hooks standardization

### Phase 3: S2 Medium Priority (Est. 30-40 hours)

- 28 S2 items
- Performance and architecture improvements

### Phase 4: S3 and Batch (Est. 10-15 hours)

- 7 S3 items
- Manual SonarQube fixes
- ESLint warnings

---

## ROADMAP.md Integration Format

```markdown
### M2.1 - Security Hardening

- [ ] Re-enable App Check (DEDUP-0001) [P0]
- [ ] Close legacy write paths (DEDUP-0002) [P0]
- [ ] Make reCAPTCHA fail-closed (DEDUP-0003) [P1]
- [ ] Complete rate limiting (DEDUP-0004) [P1]

### M2.2 - Hooks & Services

- [ ] Fix useJournal memory leak (DEDUP-0011) [P0]
- [ ] Extract error handling (DEDUP-0007) [P1]
- [ ] Create callSecureFunction wrapper (CANON-0076) [P2]

### M2.3 - Types & Correctness

- [ ] Fix journal entry types (DEDUP-0006) [P1]
- [ ] Add Zod .strict() (DEDUP-0013) [P2]
- [ ] Quick wins: null safety, localStorage (E0s) [P2]

### M2.4 - Performance

- [ ] Enable SSR (DEDUP-0012) [P1]
- [ ] Reduce 'use client' (CANON-0046) [P1]
- [ ] Add virtualization (CANON-0055) [P2]

### M2.5 - Testing

- [ ] Script test coverage (CANON-0106) [P1]
- [ ] Security tests (CANON-0011, 0012, 0013) [P1]

### M2.6 - Refactoring

- [ ] Reduce cognitive complexity (DEDUP-0014) [P0]
- [ ] Consolidate duplications (DEDUP-0009, 0010) [P2]

### M2.7 - Process

- [ ] Make CI gates blocking (DEDUP-0015) [P0]
- [ ] Add security scanning (CANON-0107) [P1]

### M2.8 - Documentation

- [ ] Fix broken links (CANON-0091) [P1]
- [ ] Replace placeholders (CANON-0092) [P1]

### M2.9 - Batch Operations

- [ ] SonarQube auto-fixes (~317) [P2]
- [ ] SonarQube manual fixes (~170) [P3]
- [ ] ESLint warnings (246) [P3]
```

---

**Document Version:** 1.0 **Next Task:** 4.3.4 - Document App Check
re-enablement plan
