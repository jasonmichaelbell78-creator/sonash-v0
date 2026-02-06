# Multi-AI Audit Summary

**Session:** maa-2026-02-06-361974 **Generated:** 2026-02-06

---

## Overview

| Metric                   | Value |
| ------------------------ | ----- |
| Total AI Sources         | 45    |
| Raw Findings             | 46    |
| Unique After Unification | 40    |
| Cross-Cutting Findings   | 1     |

---

## Category Breakdown

| Category | Findings |  S0 |  S1 |  S2 |  S3 |
| -------- | -------- | --: | --: | --: | --: |
| code     | 26       |   1 |   6 |  16 |   3 |
| security | 20       |   0 |   1 |   9 |  10 |

---

## Severity Distribution

| Severity    | Count |   % |
| ----------- | ----: | --: |
| S0 Critical |     1 |  3% |
| S1 High     |     7 | 18% |
| S2 Medium   |    22 | 55% |
| S3 Low      |    10 | 25% |

---

## Top 20 Priority Findings

| Rank | ID         | Severity | Categories | Score | Title                                       |
| ---: | :--------- | :------: | :--------: | ----: | :------------------------------------------ |
|    1 | CANON-0014 |    S0    |     1      | 108.5 | Security risk: Client-side filtering of ... |
|    2 | CANON-0001 |    S1    |     1      |  63.8 | App Check disabled across all Cloud Func... |
|    3 | CANON-0002 |    S1    |     1      |  58.3 | Performance anti-pattern: Excessive re-r... |
|    4 | CANON-0003 |    S1    |     1      |  57.3 | Missing input validation on server-gener... |
|    5 | CANON-0004 |    S1    |     1      |  56.5 | Data flow violation: Direct Firestore wr... |
|    6 | CANON-0001 |    S1    |     1      |  56.3 | Missing error boundary coverage for asyn... |
|    7 | CANON-0006 |    S1    |     1      |  56.3 | Missing cleanup for onSnapshot listener     |
|    8 | CANON-0005 |    S1    |     1      |  55.5 | Unvalidated URL construction in GCP link... |
|    9 | CANON-0012 |    S2    |     2      |  38.7 | API design inconsistency: Mixed return p... |
|   10 | CANON-0003 |    S2    |     1      |  34.1 | Missing Content-Security-Policy header      |
|   11 | CANON-0004 |    S2    |     1      |    34 | User profile document allows direct clie... |
|   12 | CANON-0002 |    S2    |     1      |  33.3 | Hardcoded reCAPTCHA site key in server-s... |
|   13 | CANON-0007 |    S2    |     1      |  29.5 | God component: dashboard-tab.tsx with ex... |
|   14 | CANON-0015 |    S2    |     1      |  29.5 | Any type usage in today-page.tsx snapsho... |
|   15 | CANON-0009 |    S2    |     1      |  29.2 | Tight coupling between UI components and... |
|   16 | CANON-0017 |    S2    |     1      |  29.2 | Hardcoded bucket name in Cloud Functions    |
|   17 | CANON-0008 |    S2    |     1      |    29 | Inconsistent state management patterns a... |
|   18 | CANON-0011 |    S2    |     1      |  28.8 | Anti-pattern: Firestore queries in compo... |
|   19 | CANON-0018 |    S2    |     1      |  28.8 | Missing dependency in useEffect for logs... |
|   20 | CANON-0010 |    S2    |     1      |  28.7 | Missing loading state coordination acros... |

---

## Cross-Cutting Files (Hotspots)

These files appear in 2+ audit categories and may need comprehensive attention:

### lib\firestore-service.ts

- **Categories:** code, security
- **Total Findings:** 4
  - `CANON-0012` (S2): API design inconsistency: Mixed return patterns
  - `CANON-0019` (S2): Exposed sensitive data in development console logs
  - `CANON-0022` (S2): Circular dependency risk in firestore-service
  - `CANON-0020` (S3): Client-side logger may leak sensitive data in deve

---

## Dependency Chains

- **components\providers\auth-provider.tsx**: 1 critical findings may block 1
  lower-severity fixes
- **hooks\use-journal.ts**: 3 critical findings may block 6 lower-severity fixes
- **components\admin\dashboard-tab.tsx**: 1 critical findings may block 1
  lower-severity fixes
- **components\admin\logs-tab.tsx**: 1 critical findings may block 1
  lower-severity fixes
- **functions/src/index.ts**: 1 critical findings may block 1 lower-severity
  fixes
- **functions\src\index.ts**: 1 critical findings may block 2 lower-severity
  fixes

---

## Recommended Action Plan

### Phase 1: Critical (S0) - Immediate

- [ ] **CANON-0014**: Security risk: Client-side filtering of sensitive data

### Phase 2: High Priority (S1) - This Sprint

- [ ] **CANON-0001**: App Check disabled across all Cloud Functions
- [ ] **CANON-0002**: Performance anti-pattern: Excessive re-renders from
      context
- [ ] **CANON-0003**: Missing input validation on server-generated data
- [ ] **CANON-0004**: Data flow violation: Direct Firestore writes in admin
      compon
- [ ] **CANON-0001**: Missing error boundary coverage for async operations
- [ ] **CANON-0006**: Missing cleanup for onSnapshot listener
- [ ] **CANON-0005**: Unvalidated URL construction in GCP links

### Phase 3: Cross-Cutting Files

- [ ] **lib\firestore-service.ts** (2 categories, 4 findings)

---

## Next Steps

1. **Review** this summary and the UNIFIED-FINDINGS.jsonl file
2. **Ingest** to TDMS: `node scripts/debt/intake-audit.js <path-to-unified>`
3. **Track** progress in ROADMAP.md or your issue tracker
4. **Archive** the session when complete

---

**Generated by Multi-AI Audit Orchestrator**
