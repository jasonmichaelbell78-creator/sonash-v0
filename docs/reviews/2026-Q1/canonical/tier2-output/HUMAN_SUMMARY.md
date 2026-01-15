# Tier-2 Cross-Category Aggregation Summary

**Generated:** 2026-01-11 **Input:** 118 CANON findings across 6 categories
**Output:** 97 unique findings (21 merged as duplicates) **Scope:** CANON
findings + SonarQube (548) + ESLint warnings (246)

---

## Purpose

This document provides a human-readable summary of Tier-2 cross-category
aggregation, consolidating findings from all 6 Multi-AI audits into a unified
prioritized backlog.

## Version History

| Version | Date       | Changes                               |
| ------- | ---------- | ------------------------------------- |
| 1.0     | 2026-01-11 | Initial cross-category summary created |

---

## Executive Summary

This Tier-2 aggregation consolidates findings from 6 Multi-AI audits into a
unified, prioritized backlog. Cross-category deduplication identified 12
duplicate clusters where the same root issue was reported in multiple
categories.

### Issue Distribution After Deduplication

| Severity      | Count | Categories Affected                     |
| ------------- | ----- | --------------------------------------- |
| S0 (Critical) | 5     | CODE, SECURITY, PERF, REFACTOR, PROCESS |
| S1 (High)     | 32    | All 6 categories                        |
| S2 (Medium)   | 42    | All 6 categories                        |
| S3 (Low)      | 18    | All 6 categories                        |

### Comprehensive Remediation Scope

| Source               | Raw Count | After Dedup | Notes                               |
| -------------------- | --------- | ----------- | ----------------------------------- |
| CANON Findings       | 118       | 97          | 21 cross-category duplicates merged |
| SonarQube Issues     | 941       | 548         | 393 null-file excluded              |
| ESLint Warnings      | 246       | 246         | Security plugin warnings            |
| **Total Actionable** | **1,305** | **~891**    | With overlap removal                |

---

## Top 10 Quick Wins (Low Effort, High Impact)

| Rank | ID         | Title                                   | Effort | Severity | Category |
| ---- | ---------- | --------------------------------------- | ------ | -------- | -------- |
| 1    | CANON-0004 | Add 'step-1-worksheet' to server schema | E0     | S1       | Types    |
| 2    | CANON-0021 | Missing error.message null safety       | E0     | S2       | Types    |
| 3    | CANON-0022 | Unsafe localStorage JSON.parse          | E0     | S2       | Types    |
| 4    | CANON-0030 | @ts-expect-error suppression            | E0     | S3       | Types    |
| 5    | CANON-0087 | CloudFunctionError defined twice        | E0     | S3       | Refactor |
| 6    | CANON-0088 | 200+ ESLint auto-fixable issues         | E0     | S3       | Refactor |
| 7    | CANON-0095 | Standards contain placeholder links     | E0     | S2       | Docs     |
| 8    | CANON-0098 | CODE_PATTERNS.md wrong path reference   | E0     | S2       | Docs     |
| 9    | CANON-0099 | Duplicate CODE_REVIEW_PLAN files        | E0     | S2       | Docs     |
| 10   | CANON-0113 | Auto-label workflow invalid if syntax   | E0     | S2       | Process  |

---

## Top 5 High-Risk/High-Payoff Items

| Rank | ID         | Title                                                        | Severity | Effort | Impact            | Merged From                        |
| ---- | ---------- | ------------------------------------------------------------ | -------- | ------ | ----------------- | ---------------------------------- |
| 1    | DEDUP-0001 | App Check disabled on Cloud Functions + client init disabled | S0       | E2     | Security posture  | CANON-0001, CANON-0043, CANON-0069 |
| 2    | DEDUP-0002 | Legacy journalEntries bypasses validation                    | S0       | E2     | Data integrity    | CANON-0002, CANON-0034             |
| 3    | DEDUP-0011 | useJournal memory leak + redundant auth listener             | S0       | E1     | App stability     | CANON-0044, CANON-0026             |
| 4    | DEDUP-0014 | 47 CRITICAL cognitive complexity violations                  | S0       | E3     | Maintainability   | CANON-0064                         |
| 5    | DEDUP-0015 | CI quality gates non-blocking                                | S0       | E2     | Quality assurance | CANON-0105, CANON-0111             |

---

## Key Duplication Clusters (Consolidated)

### Cluster 1: App Check Disabled (3 findings merged)

- **Primary:** CANON-0001 (CODE)
- **Merged:** CANON-0043 (SECURITY), CANON-0069 (REFACTOR)
- **Root Issue:** App Check disabled on all Cloud Functions and client init
  commented out
- **Remediation:** Re-enable App Check with monitoring; ensure client init
  restored

### Cluster 2: Console Logging in Production (3 findings merged)

- **Primary:** CANON-0003 (CODE)
- **Merged:** CANON-0042 (SECURITY), CANON-0058 (PERF)
- **Root Issue:** 50+ console.\* statements bypass standardized logger
- **Remediation:** Replace with logger utility; add ESLint no-console rule

### Cluster 3: Journal Entry Type Mismatch (3 findings merged)

- **Primary:** CANON-0004 (CODE)
- **Merged:** CANON-0039 (SECURITY), CANON-0067 (REFACTOR)
- **Root Issue:** Client/server type enum divergence for journal entry types
- **Remediation:** Single source of truth in shared package; contract tests

### Cluster 4: DailyQuoteCard Duplication (3 findings merged)

- **Primary:** CANON-0023 (CODE)
- **Merged:** CANON-0051 (PERF), CANON-0073 (REFACTOR)
- **Root Issue:** 3 implementations with duplicate fetch logic
- **Remediation:** Create useDailyQuote hook; single component with variants

### Cluster 5: useJournal Auth Listener (2 findings merged)

- **Primary:** CANON-0044 (PERF) - elevated due to memory leak
- **Merged:** CANON-0026 (CODE)
- **Root Issue:** Redundant auth listener causing memory leak
- **Remediation:** Consume user from useAuthCore(); fix cleanup scope

---

## Cross-Cutting Themes

### 1. Security Hardening (15 findings)

- App Check disabled (CANON-0001)
- reCAPTCHA not enforced (CANON-0008)
- Rate limiting incomplete (CANON-0036)
- Direct Firestore writes bypass validation (CANON-0002, CANON-0041)
- Console logging exposes info (CANON-0003)

### 2. Type Safety & Validation (12 findings)

- Client/server type divergence (CANON-0004, CANON-0020)
- Weak Zod schemas (CANON-0028)
- Unsafe type assertions (CANON-0018)
- `any` types in production (CANON-0032)

### 3. Duplication & DRY Violations (14 findings)

- Error handling patterns (CANON-0006)
- reCAPTCHA boilerplate (CANON-0076)
- Growth card dialog patterns (CANON-0079)
- CRUD service patterns (CANON-0080)
- Time rotation logic (CANON-0017)

### 4. Test Coverage Gaps (8 findings)

- Security-critical paths low coverage (CANON-0013, CANON-0074)
- Scripts minimal coverage (CANON-0068, CANON-0106)
- Missing integration tests (CANON-0011, CANON-0012)

### 5. Performance Bottlenecks (10 findings)

- SSR blocked by 'use client' (CANON-0045, CANON-0046)
- Memory leaks (CANON-0044)
- Missing virtualization (CANON-0055)
- Unoptimized images (CANON-0047)

### 6. Documentation Drift (14 findings)

- Broken relative links (CANON-0091)
- Stale placeholders (CANON-0092)
- Missing metadata (CANON-0094)
- Workflow docs outdated (CANON-0109)

---

## Batch Remediation PRs

### PR-BATCH-AUTO: SonarQube Auto-Fix (~317 issues)

**Effort:** E1 | **Risk:** Low

Issues addressable via automated tooling:

- S7778: Array.at() (84 issues)
- S7781: replaceAll() (101 issues)
- S6759: Unused imports (62 issues)
- S7772: node: prefix (70 issues)

**Command:** `npm run lint:fix` + manual review

### PR-BATCH-MANUAL: SonarQube Manual (~170 issues)

**Effort:** E2 | **Risk:** Medium

Issues requiring manual refactoring:

- S3358: Nested ternary operators (41 issues)
- S1874: Deprecated API usage (31 issues)
- S7688: Shell script improvements (47 issues)
- Other MAJOR issues (~50)

### PR-LINT-WARNINGS: ESLint Security Warnings (246 issues)

**Effort:** E2 | **Risk:** Low-Medium

Security plugin warnings:

- detect-non-literal-fs-filename (~100)
- detect-object-injection (~80)
- detect-unsafe-regex (~30)
- detect-non-literal-regexp (~20)
- no-unused-vars (~16)

---

## Recommended Implementation Order

### Phase 1: Critical Security & Stability (Week 1-2)

1. **CANON-0044**: Fix useJournal memory leak (S0/E1)
2. **CANON-0002**: Close legacy journalEntries write path (S0/E2)
3. **CANON-0008**: Make reCAPTCHA fail-closed (S1/E1)
4. **CANON-0036**: Complete rate limiting (S1/E2)
5. **CANON-0105**: Convert CI gates to blocking (S0/E2)

### Phase 2: Type Safety & Quick Wins (Week 2-3)

1. **PR-BATCH-AUTO**: Run auto-fixers (E1)
2. **CANON-0004**: Fix journal entry type enum (S1/E0)
3. **CANON-0087**: Remove duplicate CloudFunctionError (S3/E0)
4. **CANON-0006**: Extract error handling utility (S1/E1)
5. **CANON-0020**: Single source of truth for types (S2/E2)

### Phase 3: Duplication Cleanup (Week 3-4)

1. **CANON-0003**: Replace console with logger (S1/E1)
2. **CANON-0023**: Consolidate DailyQuoteCard (S2/E1)
3. **CANON-0017**: Extract rotation utilities (S2/E1)
4. **CANON-0076**: Create callSecureFunction wrapper (S2/E1)
5. **CANON-0077**: Create typed collection helpers (S2/E2)

### Phase 4: Performance & Architecture (Week 4-5)

1. **CANON-0045**: Split landing page for SSR (S1/E2)
2. **CANON-0046**: Reduce 'use client' directives (S1/E2)
3. **CANON-0055**: Add virtualization to lists (S2/E2)
4. **CANON-0047**: Implement image optimization (S1/E2)

### Phase 5: Testing & Documentation (Week 5-6)

1. **CANON-0106**: Add script test coverage (S1/E2)
2. **CANON-0091**: Fix broken doc links (S1/E1)
3. **CANON-0092**: Replace placeholders in plans (S1/E1)
4. **PR-LINT-WARNINGS**: Address security warnings (E2)

### Phase 6: Cognitive Complexity (Week 6-8)

1. **CANON-0064**: Refactor 47 CRITICAL complexity functions (S0/E3)
2. **PR-BATCH-MANUAL**: Manual SonarQube fixes (E2)

---

## Dependencies Map

```
CANON-0001 (App Check) ─────────────────────────────┐
                                                     │
CANON-0008 (reCAPTCHA) ──┬──> CANON-0043 (Risk-accepted) ◄┘
                         │
CANON-0036 (Rate Limit) ─┘

CANON-0006 (Error handling) ──> CANON-0066 (Refactor)
                                     │
                                     v
CANON-0076 (reCAPTCHA pattern) ──> CANON-0071 (useJournal refactor)

CANON-0077 (Collection helpers) ──> CANON-0080 (CRUD factory)
                                         │
                                         v
                                    CANON-0075 (Service layer)
```

---

## Items Demoted/Merged

| Original ID | Status                      | Reason                         |
| ----------- | --------------------------- | ------------------------------ |
| CANON-0034  | Merged into CANON-0002      | Same issue (legacy writes)     |
| CANON-0039  | Merged into CANON-0004      | Same issue (type mismatch)     |
| CANON-0042  | Merged into CANON-0003      | Same issue (console logging)   |
| CANON-0043  | Merged into CANON-0001      | Same issue (App Check)         |
| CANON-0044  | Primary (merged CANON-0026) | Memory leak elevated           |
| CANON-0045  | Primary (merged CANON-0033) | SSR blocking                   |
| CANON-0051  | Merged into CANON-0023      | Same issue (DailyQuoteCard)    |
| CANON-0058  | Merged into CANON-0003      | Same issue (console logging)   |
| CANON-0065  | Merged into CANON-0017      | Same issue (rotation logic)    |
| CANON-0066  | Merged into CANON-0006      | Same issue (error handling)    |
| CANON-0067  | Merged into CANON-0004      | Same issue (type mismatch)     |
| CANON-0069  | Merged into CANON-0001      | Same issue (App Check)         |
| CANON-0070  | Merged into CANON-0007      | Same issue (deprecated method) |
| CANON-0073  | Merged into CANON-0023      | Same issue (DailyQuoteCard)    |

---

## Quality Gate Baseline (at aggregation time)

| Metric             | Value                                                 | Status  |
| ------------------ | ----------------------------------------------------- | ------- |
| Tests              | 115 pass, 0 fail, 1 skipped                           | Pass    |
| Circular deps      | 0                                                     | Pass    |
| Unused deps        | 4 (recharts, vaul, @modelcontextprotocol/sdk, undici) | Warning |
| ESLint errors      | 0                                                     | Pass    |
| ESLint warnings    | 246                                                   | Tracked |
| Pattern violations | 0 (critical files)                                    | Pass    |
| SonarQube issues   | 941 (548 actionable)                                  | Tracked |

---

## Next Steps

1. Review and approve this summary
2. Create GitHub issues for S0 items
3. Proceed to Step 4B (Remediation Sprint) and execute PRs from `PR_PLAN.json`
4. Update CANON backlog status as items are addressed

---

**Document Version:** 1.0 **Aggregator:** Claude Opus 4.5 **Mode:** TIER-2
Cross-Category Unification
