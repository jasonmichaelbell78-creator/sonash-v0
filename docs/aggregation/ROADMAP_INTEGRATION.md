# Roadmap Integration Analysis

**Generated:** 2026-01-17 **Total Findings:** 283 unique items from master
aggregation **Roadmap Version:** 2.6 (as of 2026-01-16)

---

## Executive Summary

This document maps the 283 aggregated audit findings to the existing ROADMAP.md
structure, identifying:

- Items already tracked in the roadmap
- New items requiring integration
- Recommended milestone assignments

### Coverage Analysis

| Category      | Aggregated | Already in ROADMAP | New Items | Gap %    |
| ------------- | ---------- | ------------------ | --------- | -------- |
| Security      | 38         | 12                 | 26        | 68%      |
| Performance   | 31         | 18                 | 13        | 42%      |
| Code Quality  | 84         | 8                  | 76        | 90%      |
| Process       | 24         | 16                 | 8         | 33%      |
| Documentation | 24         | 2                  | 22        | 92%      |
| Refactoring   | 40         | 15                 | 25        | 63%      |
| DX/Offline    | 7          | 4                  | 3         | 43%      |
| **Total**     | **283**    | **75**             | **173**   | **~61%** |

**Key Finding:** ~61% of aggregated items are NOT currently tracked in
ROADMAP.md.

---

## Milestone Mapping

### 🚨 Critical Items (S0) - Immediate Action Required

**10 S0 items requiring immediate attention:**

| ID          | Title                                   | Current Location | Recommended Milestone      |
| ----------- | --------------------------------------- | ---------------- | -------------------------- |
| MASTER-0078 | App Check disabled on Cloud Functions   | M2 (DEDUP-0001)  | **M2 - Security**          |
| MASTER-0079 | Legacy journalEntries direct write path | M2 (DEDUP-0002)  | **M2 - Security**          |
| MASTER-0120 | useJournal memory leak                  | M2 (DEDUP-0011)  | **Operational Visibility** |
| MASTER-0140 | 47 CRITICAL cognitive complexity        | M2 (CANON-0064)  | **M2 - Code Quality**      |
| MASTER-0143 | Reduce complexity functions             | NEW              | **M2 - Code Quality**      |
| MASTER-0176 | CI quality gates non-blocking           | M1.5 (AUTO-005)  | **M1.5 - Quick Wins**      |
| MASTER-0190 | Re-enable App Check                     | M2 (DEDUP-0001)  | **M2 - Security**          |
| MASTER-0191 | Close legacy write path                 | M2 (DEDUP-0002)  | **M2 - Security**          |
| MASTER-0212 | Fix useJournal memory leak              | M2 (DEDUP-0011)  | **Operational Visibility** |
| MASTER-0276 | Convert CI gates to blocking            | M1.5 (AUTO-005)  | **M1.5 - Quick Wins**      |

**Status:** 8/10 already tracked, 2 are duplicates/merged items

---

### 🚀 Operational Visibility Sprint (Active P0)

**Items to add to current sprint:**

| ID          | Title                          | Effort | Track                       |
| ----------- | ------------------------------ | ------ | --------------------------- |
| MASTER-0120 | useJournal memory leak (S0)    | E1     | Track A - Critical Fix      |
| MASTER-0003 | Missing X-Frame-Options header | E0     | Track A - Security          |
| MASTER-0004 | Missing X-Content-Type-Options | E0     | Track A - Security          |
| MASTER-0005 | Missing HSTS header            | E0     | Track A - Security          |
| MASTER-0121 | Landing page SSR blocked       | E2     | Track C - Performance       |
| MASTER-0050 | Sentry integration incomplete  | E1     | Track A - Already in Sprint |

**Recommended Sprint Addition:** 6 items (~8-12 hours)

---

### ⚡ M1.5 - Quick Wins (Paused)

**Current backlog in ROADMAP:** 9 items **New items to add:** 47 items

#### New S1 Quick Wins (E0/E1)

| ID          | Title                               | Effort | Category      |
| ----------- | ----------------------------------- | ------ | ------------- |
| MASTER-0057 | Remove 7 unused dependencies        | E0     | Performance   |
| MASTER-0087 | Remove duplicate CloudFunctionError | E0     | Code          |
| MASTER-0088 | Run ESLint auto-fix (200+ issues)   | E0     | Code          |
| MASTER-0048 | Fix TodayPage subscription bug      | E0     | Performance   |
| MASTER-0095 | Fix standards placeholder links     | E0     | Documentation |
| MASTER-0098 | Fix CODE_PATTERNS.md path refs      | E0     | Documentation |
| MASTER-0112 | Pin firebase-tools version          | E0     | Process       |
| MASTER-0113 | Fix auto-label workflow syntax      | E0     | Process       |
| MASTER-0021 | Add error.message null safety       | E0     | Code          |
| MASTER-0022 | Safe localStorage JSON.parse        | E0     | Code          |

**Total E0 Quick Wins:** 15 items (~4-6 hours)

#### S1/S2 Items for M1.5

| ID          | Title                          | Effort | Category      |
| ----------- | ------------------------------ | ------ | ------------- |
| MASTER-0091 | Fix broken relative links      | E1     | Documentation |
| MASTER-0092 | Replace [X] placeholders       | E1     | Documentation |
| MASTER-0003 | Make reCAPTCHA fail-closed     | E1     | Security      |
| MASTER-0005 | Replace console.\* with logger | E1     | Security      |
| MASTER-0052 | Add reduced-motion support     | E1     | Performance   |
| MASTER-0053 | Add React.memo to lists        | E1     | Performance   |
| MASTER-0054 | Optimize hero background       | E1     | Performance   |
| MASTER-0110 | Move tests to pre-push only    | E1     | Process       |

---

### 🏛️ M2 - Architecture Refactor (Optional)

**Current items:** ~40 **New items to add:** 89

#### Security Hardening (38 items total)

| Priority | Count | Description                       |
| -------- | ----- | --------------------------------- |
| S0       | 3     | App Check, Legacy writes          |
| S1       | 15    | reCAPTCHA, rate limiting, headers |
| S2       | 15    | ESLint warnings, admin writes     |
| S3       | 5     | Minor security improvements       |

#### Code Quality (84 items total)

| Priority | Count | Description                    |
| -------- | ----- | ------------------------------ |
| S1       | 19    | Type mismatches, test coverage |
| S2       | 42    | God objects, duplications      |
| S3       | 23    | Minor refactoring              |

#### Refactoring Priorities

| ID          | Title                           | Effort | Impact              |
| ----------- | ------------------------------- | ------ | ------------------- |
| MASTER-0072 | Split TodayPage god component   | E3     | High - testability  |
| MASTER-0065 | Extract time rotation utilities | E1     | Medium - DRY        |
| MASTER-0073 | Consolidate DailyQuoteCard      | E1     | Medium - DRY        |
| MASTER-0075 | Route Firebase through service  | E2     | High - architecture |
| MASTER-0077 | Create typed collection helpers | E2     | High - type safety  |

---

## PR Bucket → Milestone Mapping

| PR Bucket                    | Count | Primary Milestone | Secondary              |
| ---------------------------- | ----- | ----------------- | ---------------------- |
| **security-hardening**       | 38    | M2 (Security)     | Operational Visibility |
| **performance-optimization** | 31    | M2 (Performance)  | M1.5 (Quick Wins)      |
| **code-quality**             | 84    | M2 (Code Quality) | -                      |
| **process-automation**       | 24    | M1.5 (AUTO-\*)    | M2 (Process)           |
| **documentation-sync**       | 24    | M1.5 (Backlog)    | M2 (Docs)              |
| **types-domain**             | 10    | M2 (Types)        | -                      |
| **boundaries**               | 6     | M2 (Architecture) | -                      |
| **tests-hardening**          | 6     | M2 (Testing)      | -                      |
| **firebase-access**          | 6     | M2 (Firebase)     | -                      |
| **hooks-standardization**    | 4     | M2 (Hooks)        | -                      |
| **offline-support**          | 4     | M2 (EFF-010)      | -                      |
| **dx-improvements**          | 3     | M1.5 (EFF-\*)     | -                      |
| **ui-primitives**            | 3     | M2 (Components)   | -                      |

---

## Recommended ROADMAP.md Updates

### 1. Add to Operational Visibility Sprint (Immediate)

```markdown
### Sprint Track A - Critical Fixes (NEW)

- [ ] **MASTER-0120:** Fix useJournal memory leak (S0, E1)
- [ ] **MASTER-0003:** Add security headers (S1, E0)
- [ ] **MASTER-0004:** Add X-Content-Type-Options (S1, E0)
- [ ] **MASTER-0005:** Add HSTS header (S1, E0)
```

### 2. Expand M1.5 Clear Audit Backlog

```markdown
### 🚨 Clear Audit Backlog (EXPANDED)

**Current backlog:** 56 items (was 9) **Source:**
[MASTER_ISSUE_LIST.md](docs/aggregation/MASTER_ISSUE_LIST.md)

#### E0 Quick Wins (15 items, ~4-6 hours)

| ID          | Title                      | Category    |
| ----------- | -------------------------- | ----------- |
| MASTER-0057 | Remove 7 unused deps       | Performance |
| MASTER-0087 | Remove duplicate interface | Code        |
| MASTER-0088 | Run ESLint auto-fix        | Code        |

...

#### S1/S2 Items (41 items, ~25-35 hours)

See MASTER_ISSUE_LIST.md for full list
```

### 3. Restructure M2 by Category

```markdown
## 🏛️ M2 - Architecture Refactor

### M2.1 - Security Hardening (38 items)

- S0: 3 items (App Check, legacy writes)
- S1: 15 items (reCAPTCHA, rate limiting)
- Full list: MASTER_ISSUE_LIST.md filtered by security

### M2.2 - Performance (31 items)

- Memory leaks, SSR optimization, bundle size
- Full list: MASTER_ISSUE_LIST.md filtered by performance

### M2.3 - Code Quality (84 items)

- Type safety, test coverage, god objects
- Full list: MASTER_ISSUE_LIST.md filtered by code

### M2.4 - Process & CI/CD (24 items)

- CI gates, hooks, scripts
- Full list: MASTER_ISSUE_LIST.md filtered by process

### M2.5 - Documentation (24 items)

- Link rot, sync issues, metadata
- Full list: MASTER_ISSUE_LIST.md filtered by documentation
```

---

## Implementation Phases

### Phase 1: Critical (Week 1) - 10 items

Focus: S0 items only

- Re-enable App Check
- Close legacy write paths
- Fix memory leak
- Make CI gates blocking

### Phase 2: Security + Quick Wins (Week 2) - 30 items

Focus: S1 security + all E0 items

- Security headers
- reCAPTCHA hardening
- ESLint auto-fixes
- Unused dependency removal

### Phase 3: Performance + Code (Weeks 3-4) - 60 items

Focus: S1/S2 performance + code quality

- SSR optimization
- Bundle size reduction
- Type safety improvements
- React.memo additions

### Phase 4: Architecture (Weeks 5-6) - 50 items

Focus: S2/S3 refactoring + documentation

- God object decomposition
- Service layer standardization
- Documentation sync

### Phase 5: Remaining (Ongoing) - 133 items

Focus: Backlog integration into regular sprints

- 5-10 items per sprint
- Prioritize by PR bucket

---

## Visual Summary

```
                    ROADMAP.md Integration
    ┌─────────────────────────────────────────────────┐
    │                                                 │
    │   283 Aggregated Findings                       │
    │   ┌─────────────────────────────────────────┐   │
    │   │ S0: 10  │ S1: 75  │ S2: 135 │ S3: 63   │   │
    │   └─────────────────────────────────────────┘   │
    │                      ▼                          │
    │   ┌─────────────────────────────────────────┐   │
    │   │        Milestone Assignment              │   │
    │   │  ┌───────────┐  ┌────────────────────┐  │   │
    │   │  │ Op Vis    │  │ M1.5 Quick Wins    │  │   │
    │   │  │ Sprint    │  │ 56 items           │  │   │
    │   │  │ 6 items   │  │ E0: 15, S1/S2: 41  │  │   │
    │   │  └───────────┘  └────────────────────┘  │   │
    │   │  ┌────────────────────────────────────┐ │   │
    │   │  │ M2 Architecture (221 items)        │ │   │
    │   │  │ ┌──────┐┌──────┐┌──────┐┌───────┐  │ │   │
    │   │  │ │Sec38 ││Perf31││Code84││Proc24 │  │ │   │
    │   │  │ └──────┘└──────┘└──────┘└───────┘  │ │   │
    │   │  │ ┌──────┐┌──────┐┌──────┐           │ │   │
    │   │  │ │Docs24││Refac │││Other │           │ │   │
    │   │  │ └──────┘└──────┘└──────┘           │ │   │
    │   │  └────────────────────────────────────┘ │   │
    │   └─────────────────────────────────────────┘   │
    │                                                 │
    └─────────────────────────────────────────────────┘
```

---

## Quick Reference: Files to Update

| File                               | Action                  | Items Affected |
| ---------------------------------- | ----------------------- | -------------- |
| `ROADMAP.md`                       | Add Sprint items        | 6              |
| `ROADMAP.md`                       | Expand M1.5 backlog     | 47             |
| `ROADMAP.md`                       | Restructure M2          | 221            |
| `AUDIT_TRACKER.md`                 | Update aggregation date | ✅ Done        |
| `OPERATIONAL_VISIBILITY_SPRINT.md` | Add critical fixes      | 6              |

---

## Notes

1. **Avoid Duplicate Tracking:** Reference MASTER_ISSUE_LIST.md rather than
   copying all 283 items into ROADMAP.md
2. **Use PR Buckets:** Group work by PR bucket for efficient implementation
3. **Priority Score:** Items with score 90+ should be addressed in current/next
   sprint
4. **Dependencies:** Check IMPLEMENTATION_PLAN.md for dependency chains

---

**Document Version:** 1.0 **Last Updated:** 2026-01-17
