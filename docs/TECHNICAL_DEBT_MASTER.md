# Technical Debt Master Tracker

**Created:** 2026-01-26 (Session #98) **Purpose:** Single source of truth for
all technical debt items **Status:** ACTIVE - Replaces fragmented tracking
across multiple files

---

## Quick Start

1. Check **URGENT** section for S0/S1 items before starting new features
2. Use **Quick Wins** table for small fixes (<2 hrs each)
3. Reference **Cross-Reference** table to map legacy IDs to current tracking

## AI Instructions

When working with technical debt:

- **Before coding**: Check if related debt exists here to address
  opportunistically
- **After audits**: Update this document with new findings (not
  MASTER_ISSUE_LIST)
- **ID conflicts**: Use namespace prefix (AUDIT-PERF-001 vs ROADMAP-PERF-001)
- **Completion**: Mark items with ✅ and date when resolved

---

## Overview

This document consolidates technical debt from:

- Comprehensive Audit (2026-01-24): 115 findings → **113 valid** (2 false
  positives)
- MASTER_ISSUE_LIST (2026-01-17): 291 findings (many duplicates with above)
- ROADMAP.md references: Various CANON-, DEDUP-, EFF-, PERF- items

### Verification Summary

| Source                 | Original Count | After Verification                         |
| ---------------------- | -------------- | ------------------------------------------ |
| Comprehensive Audit S0 | 9              | **7** (SEC-001, SEC-002 = false positives) |
| Comprehensive Audit S1 | 28             | **28** (all valid)                         |
| Comprehensive Audit S2 | 46             | **45** (1 partially invalid)               |
| Comprehensive Audit S3 | 32             | **32** (all valid)                         |
| **Total Valid**        | 115            | **112**                                    |

---

## URGENT - Resolve Now (S0/S1)

### Verified Critical (S0) - 7 Items

| ID           | Title                       | Status             | Effort | File(s)               |
| ------------ | --------------------------- | ------------------ | ------ | --------------------- |
| ~~SEC-001~~  | ~~Credentials in git~~      | **FALSE POSITIVE** | -      | -                     |
| ~~SEC-002~~  | ~~Firebase key exposed~~    | **FALSE POSITIVE** | -      | -                     |
| **PERF-001** | Unoptimized images (11MB)   | ✅ VALID           | E2     | `public/images/*`     |
| **PERF-002** | No code splitting           | ✅ VALID           | E2     | `app/page.tsx`        |
| **PERF-003** | Missing React memoization   | ✅ VALID           | E2     | `today-page.tsx`      |
| **PERF-004** | Unbounded Firestore queries | ✅ VALID           | E2     | `today-page.tsx:698`  |
| **PERF-005** | No service worker/offline   | ✅ VALID           | E2     | `next.config.mjs`     |
| **PERF-006** | Debug queries in production | ⚠️ LOW RISK        | E0     | Only runs in dev mode |
| **PERF-007** | Missing cache headers       | ✅ VALID           | E1     | `firebase.json`       |

### High Priority (S1) - 28 Items

#### Security (3)

| ID          | Title                           | Status   | Effort |
| ----------- | ------------------------------- | -------- | ------ |
| **SEC-003** | Missing Content Security Policy | ✅ VALID | E1     |
| **SEC-004** | Admin privilege escalation risk | ✅ VALID | E2     |
| **SEC-005** | Hardcoded reCAPTCHA fallback    | ✅ VALID | E0     |

#### Performance (10)

| ID           | Title                             | Status   | Effort |
| ------------ | --------------------------------- | -------- | ------ |
| **PERF-008** | Framer-motion not tree-shaken     | ✅ VALID | E1     |
| **PERF-009** | Firestore listeners no throttling | ✅ VALID | E1     |
| **PERF-010** | No lazy loading below-fold images | ✅ VALID | E1     |
| **PERF-011** | Poor LCP (3-5s)                   | ✅ VALID | E2     |
| **PERF-012** | Poor FID/INP (150-300ms)          | ✅ VALID | E2     |
| **PERF-013** | Request deduplication missing     | ✅ VALID | E2     |
| **PERF-014** | Firebase SDK not cached           | ✅ VALID | E1     |
| **PERF-015** | No performance monitoring         | ✅ VALID | E1     |
| **PERF-016** | Admin table no virtualization     | ✅ VALID | E2     |
| **PERF-017** | Auth context not memoized         | ✅ VALID | E1     |

#### Code Quality (2)

| ID           | Title                        | Status   | Effort |
| ------------ | ---------------------------- | -------- | ------ |
| **CODE-008** | Large component (1179 lines) | ✅ VALID | E2     |
| **CODE-013** | Missing correlation IDs      | ✅ VALID | E2     |

#### Refactoring (4)

| ID            | Title                        | Status   | Effort |
| ------------- | ---------------------------- | -------- | ------ |
| **REFAC-001** | Error handling duplication   | ✅ VALID | E1     |
| **REFAC-003** | CRUD pattern duplication     | ✅ VALID | E2     |
| **REFAC-006** | Deprecated function exported | ✅ VALID | E1     |
| **REFAC-010** | Service layer inconsistency  | ✅ VALID | E2     |

#### Documentation (4)

| ID          | Title                        | Status   | Effort |
| ----------- | ---------------------------- | -------- | ------ |
| **DOC-004** | Component JSDoc at 3%        | ✅ VALID | E3     |
| **DOC-005** | Cloud Functions undocumented | ✅ VALID | E2     |
| **DOC-009** | Public hooks undocumented    | ✅ VALID | E3     |
| **DOC-010** | No CONTRIBUTING.md           | ✅ VALID | E1     |

#### Process (5)

| ID              | Title                        | Status   | Effort |
| --------------- | ---------------------------- | -------- | ------ |
| **CICD-005**    | No canary deployment         | ✅ VALID | E2     |
| **DEPLOY-001**  | No pre-deploy smoke tests    | ✅ VALID | E2     |
| **DEPLOY-003**  | No rollback mechanism        | ✅ VALID | E3     |
| **MONITOR-001** | No post-deploy health checks | ✅ VALID | E3     |
| **HOOKS-005**   | No hook health dashboard     | ✅ VALID | E2     |

---

## Cross-Reference: Legacy IDs → Comprehensive Audit

These items from MASTER_ISSUE_LIST and ROADMAP map to comprehensive audit
findings:

| Legacy ID                      | Maps To                    | Status                                   |
| ------------------------------ | -------------------------- | ---------------------------------------- |
| MASTER-0078                    | PERF-related (App Check)   | ✅ Valid - Move to M4.5                  |
| MASTER-0079                    | SEC-004 related            | ✅ Valid                                 |
| MASTER-0120                    | PERF-017 (useJournal leak) | ✅ Valid                                 |
| MASTER-0140                    | CODE-related (complexity)  | ✅ Valid                                 |
| MASTER-0175/0176               | CICD-005 related           | ✅ Valid                                 |
| DEDUP-0001                     | App Check re-enable        | ✅ Valid - M4.5                          |
| DEDUP-0002                     | Legacy write path          | ✅ Valid                                 |
| DEDUP-0011                     | useJournal memory leak     | ✅ Valid                                 |
| CANON-0107                     | SEC-003 (CSP)              | ✅ Valid                                 |
| EFF-001 to EFF-012             | Engineering productivity   | ✅ Valid                                 |
| PERF-001 to PERF-006 (ROADMAP) | Lighthouse items           | ✅ Valid - Different from audit PERF IDs |

---

## Quick Wins (E0/E1) - Do This Week

| Task                                          | Effort | Impact          |
| --------------------------------------------- | ------ | --------------- |
| Remove hardcoded reCAPTCHA fallback (SEC-005) | 15min  | Security        |
| Add HTTP cache headers (PERF-007)             | 30min  | Performance     |
| Add security headers (SEC-003)                | 2hr    | XSS protection  |
| Tree-shake framer-motion (PERF-008)           | 2hr    | -25KB bundle    |
| Add lazy loading to images (PERF-010)         | 2hr    | LCP improvement |
| Create CONTRIBUTING.md (DOC-010)              | 2hr    | Onboarding      |
| Consolidate error handlers (REFAC-001)        | 3hr    | Consistency     |
| Remove deprecated export (REFAC-006)          | 1hr    | Cleanup         |

**Total Quick Wins: ~12 hours**

---

## Roadmap Integration

### Already in ROADMAP (No Change Needed)

- DEDUP-0001: App Check → M4.5
- EFF-\* items: Engineering productivity → M1.5/M2
- PERF-001/002 (Lighthouse): → M1.5 Dev Dashboard

### Need to Add to ROADMAP

| Item                        | Recommended Sprint | Priority |
| --------------------------- | ------------------ | -------- |
| PERF-001 (Images)           | Current Sprint     | P0       |
| PERF-002 (Code splitting)   | Current Sprint     | P0       |
| PERF-003 (Memoization)      | Current Sprint     | P0       |
| SEC-003 (CSP)               | Current Sprint     | P1       |
| DEPLOY-001/003/MONITOR-001  | Next Sprint        | P1       |
| CODE-008 (Split today-page) | Next Sprint        | P1       |

---

## Tracking Improvements Needed

### Current Problems

1. **Multiple sources of truth**: MASTER_ISSUE_LIST, AUDIT_TRACKER, ROADMAP,
   comprehensive audit all track different subsets
2. **ID collision**: PERF-001 in ROADMAP (Lighthouse) ≠ PERF-001 in audit
   (Images)
3. **Stale data**: MASTER_ISSUE_LIST (Jan 17) predates comprehensive audit
   (Jan 24)
4. **No single backlog**: Items scattered across 5+ documents

### Recommended Solution

1. **Use this document (TECHNICAL_DEBT_MASTER.md)** as single source of truth
2. **Deprecate MASTER_ISSUE_LIST.md** - superseded by comprehensive audit
3. **Namespace IDs**: Use `AUDIT-PERF-001` vs `ROADMAP-PERF-001` to avoid
   collision
4. **Add backlog:check script** that validates against this document
5. **Weekly review**: Mark items resolved, add new items from PR reviews

---

## Version History

| Version | Date       | Changes                                                                      |
| ------- | ---------- | ---------------------------------------------------------------------------- |
| 1.0     | 2026-01-26 | Initial consolidation from comprehensive audit + MASTER_ISSUE_LIST + ROADMAP |
