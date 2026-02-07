# Multi-AI Audit Summary

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-07
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Session:** maa-2026-02-06-b87316 **Generated:** 2026-02-07

---

## Overview

| Metric                   | Value |
| ------------------------ | ----- |
| Total AI Sources         | 143   |
| Raw Findings             | 394   |
| Unique After Unification | 72    |
| Cross-Cutting Findings   | 67    |

---

## Category Breakdown

| Category                 | Findings |  S0 |  S1 |  S2 |  S3 |
| ------------------------ | -------- | --: | --: | --: | --: |
| code                     | 63       |   2 |  18 |  35 |   8 |
| documentation            | 66       |   2 |  10 |  32 |  22 |
| engineering-productivity | 65       |   1 |  17 |  31 |  16 |
| performance              | 58       |   0 |  11 |  29 |  18 |
| process                  | 53       |   1 |   7 |  25 |  20 |
| refactoring              | 60       |   0 |  16 |  37 |   7 |
| security                 | 29       |   0 |   4 |  14 |  11 |

---

## Severity Distribution

| Severity    | Count |   % |
| ----------- | ----: | --: |
| S0 Critical |     0 |  0% |
| S1 High     |    52 | 72% |
| S2 Medium   |    15 | 21% |
| S3 Low      |     5 |  7% |

---

## Top 20 Priority Findings

| Rank | ID         | Severity | Categories | Score | Title                                       |
| ---: | :--------- | :------: | :--------: | ----: | :------------------------------------------ |
|    1 | CANON-0004 |    S1    |     6      |   360 | DEVELOPMENT.md references npm script typ... |
|    2 | CANON-0016 |    S1    |     3      |   210 | OfflineIndicator uses navigator.onLine i... |
|    3 | CANON-0003 |    S1    |     3      |   210 | Firebase Functions use Node 20 but CI us... |
|    4 | CANON-0012 |    S1    |     6      | 181.5 | Firebase App Check is disabled in client... |
|    5 | CANON-0003 |    S1    |     2      |   160 | Firebase Functions use Node 20 but CI us... |
|    6 | CANON-0005 |    S1    |     3      |   110 | reCAPTCHA Token Bypass (Existing DEBT-00... |
|    7 | CANON-0011 |    S1    |     3      |   110 | Inconsistent Admin Write Patterns (Cloud... |
|    8 | CANON-0001 |    S1    |     3      |   110 | DEVELOPMENT.md references missing npm sc... |
|    9 | CANON-0017 |    S1    |     2      | 108.8 | Firestore rules may not cover worksheets... |
|   10 | CANON-0017 |    S1    |     2      | 108.8 | Firestore rules may not cover worksheets... |
|   11 | CANON-0038 |    S2    |     3      |    90 | Hardcoded reCAPTCHA site key fallback in... |
|   12 | CANON-0011 |    S1    |     2      |    85 | Inconsistent Admin Write Patterns (Cloud... |
|   13 | CANON-0011 |    S1    |     2      |    85 | Inconsistent Admin Write Patterns (Cloud... |
|   14 | CANON-0011 |    S1    |     2      |    85 | Inconsistent Admin Write Patterns (Cloud... |
|   15 | CANON-0014 |    S1    |     2      |    85 | Sentry DSN, Firebase API key, and reCAPT... |
|   16 | CANON-0003 |    S1    |     2      |    85 | DOCUMENTATION_INDEX.md contains broken l... |
|   17 | CANON-0037 |    S2    |     3      |  83.6 | Functions code imports type from undecla... |
|   18 | CANON-0005 |    S1    |     2      |  81.3 | 498 external URLs need validation (expec... |
|   19 | CANON-0007 |    S1    |     2      |  77.5 | Notebook Animation Delays Interactivity     |
|   20 | CANON-0009 |    S1    |     4      |  72.5 | Critical Paths Lack Test Coverage           |

---

## Cross-Cutting Files (Hotspots)

These files appear in 2+ audit categories and may need comprehensive attention:

### package.json

- **Categories:** code, engineering-productivity, performance, process,
  refactoring, security
- **Total Findings:** 43
  - `CANON-0062` (S3): Potential unused @dataconnect/generated dependency
  - `CANON-0004` (S1): DEVELOPMENT.md references npm script type-check th
  - `CANON-0005` (S1): Tests require a compile step (tsc + tsc-alias) bef
  - `CANON-0009` (S1): Test coverage reporting broken - TypeScript compil
  - `CANON-0015` (S1): Playwright installed but not configured
  - `CANON-0020` (S0): Install/build can fail due to missing local file d
  - `CANON-0022` (S2): Repo context expects Jest but project uses Node's
  - `CANON-0026` (S2): No single golden path command that mirrors CI gate
  - `CANON-0030` (S2): Test build overhead slows feedback loop
  - `CANON-0031` (S2): No automated setup script - manual 5-step installa
  - `CANON-0035` (S2): No single npm run setup bootstrap command
  - `CANON-0037` (S2): No environment validation/doctor script
  - `CANON-0040` (S2): Playwright E2E tests configured but no test files
  - `CANON-0041` (S2): Test compilation required before running — slow fe
  - `CANON-0043` (S2): CI runtime may exceed 10 minutes for typical PRs d
  - `CANON-0051` (S3): 66 npm scripts lack discoverability
  - `CANON-0054` (S3): No npm run doctor diagnostic script
  - `CANON-0056` (S3): Missing setup automation script
  - `CANON-0057` (S3): Coverage percentage target and current baseline ar
  - `CANON-0060` (S3): Unknown test coverage percentage - no baseline doc
  - `CANON-0061` (S3): Playwright dependency present but no e2e script
  - `CANON-0063` (S3): Potential unused dependencies
  - `CANON-0005` (S1): Framer Motion Overuse - Heavy Animation Library
  - `CANON-0038` (S2): Overall JS chunk sizes and route-level bundle spli
  - `CANON-0039` (S2): Real LCP/INP/CLS values unknown (needs Lighthouse
  - `CANON-0040` (S2): 626KB largest chunk likely contains Firebase + Fra
  - `CANON-0043` (S2): Leaflet + markercluster dependencies may dominate
  - `CANON-0049` (S2): Framer Motion tree-shaking efficacy
  - `CANON-0057` (S3): date-fns may not be tree-shaken effectively
  - `CANON-0058` (S3): No recharts dependency despite being listed in sco
  - `CANON-0004` (S1): Broken Circular Dependency Check
  - `CANON-0005` (S1): Broken Unused Dependency Check
  - `CANON-0008` (S0): Install/build can fail due to missing local file d
  - `CANON-0011` (S2): Multiple TypeScript scripts in scripts/ are not wi
  - `CANON-0014` (S2): Test environment variables duplicated in package.j
  - `CANON-0026` (S2): Potential dead npm scripts - never called from oth
  - `CANON-0043` (S3): Test Runner Inconsistency
  - `CANON-0045` (S3): Potential duplication/overlap across documentation
  - `CANON-0049` (S3): lint-staged only runs Prettier (no ESLint auto-fix
  - `CANON-0022` (S2): Quality gates don't include patterns:check and dep
  - `CANON-0057` (S3): Dependency health baselines (circular/unused expor
  - `CANON-0010` (S2): 3 high-severity npm audit dependency vulnerabiliti
  - `CANON-0016` (S2): Dependency vulnerability status unknown (npm audit

### lib/firebase.ts

- **Categories:** code, documentation, engineering-productivity, performance,
  refactoring, security
- **Total Findings:** 14
  - `CANON-0012` (S1): Firebase App Check is disabled in client initializ
  - `CANON-0015` (S1): App Check is entirely disabled on client and serve
  - `CANON-0022` (S0): App Check Completely Disabled Across Entire Stack
  - `CANON-0036` (S2): Coverage gaps remain in critical firebase/auth/fir
  - `CANON-0033` (S0): APPCHECK_SETUP.md contradicts current code — App C
  - `CANON-0002` (S1): Firebase IndexedDB persistence not enabled
  - `CANON-0003` (S1): Firebase IndexedDB persistence not enabled - no of
  - `CANON-0013` (S1): App Check has been disabled since December 2025 —
  - `CANON-0014` (S1): Firestore offline persistence disabled
  - `CANON-0008` (S1): No Offline Detection or Sync Queue
  - `CANON-0060` (S3): Firestore client has no offline persistence or syn
  - `CANON-0015` (S1): App Check still disabled since Dec 2025
  - `CANON-0002` (S1): App Check enforcement disabled on callable write e
  - `CANON-0003` (S1): App Check disabled on all Cloud Functions

### hooks/use-journal.ts

- **Categories:** code, engineering-productivity, performance, refactoring
- **Total Findings:** 26
  - `CANON-0009` (S1): Critical Paths Lack Test Coverage
  - `CANON-0039` (S2): Dual hooks directories: hooks/ and lib/hooks/
  - `CANON-0045` (S2): Duplicate generateSearchableText implementations
  - `CANON-0046` (S2): Massive use-journal.ts hook (438 lines) handling t
  - `CANON-0011` (S1): No offline write queue — journal writes fail silen
  - `CANON-0008` (S1): No Offline Detection or Sync Queue
  - `CANON-0012` (S1): Duplicate Mood Data Fetches
  - `CANON-0020` (S2): No offline write queue - writes fail silently when
  - `CANON-0033` (S3): No pagination - only limit() used
  - `CANON-0034` (S3): No stale-while-revalidate caching
  - `CANON-0035` (S3): All journal entries held in memory
  - `CANON-0037` (S3): Full documents fetched without field selection
  - `CANON-0041` (S2): onSnapshot real-time listener on journal fetches u
  - `CANON-0053` (S3): 4 real-time onSnapshot listeners active simultaneo
  - `CANON-0056` (S3): Firestore client-side filtering of soft-deleted en
  - `CANON-0001` (S1): Direct Firestore SDK reads in UI/components bypass
  - `CANON-0004` (S1): Cloud Function calling patterns duplicated despite
  - `CANON-0009` (S1): getFunctions()/httpsCallable() boilerplate in 10 f
  - `CANON-0012` (S1): Cloud Function call boilerplate not migrated to ca
  - `CANON-0016` (S1): Inconsistent secure callable usage: httpsCallable
  - `CANON-0020` (S2): reCAPTCHA action strings/constants duplicated acro
  - `CANON-0032` (S2): COLLECTIONS constants built but never adopted
  - `CANON-0039` (S2): Hooks split across hooks/ and lib/hooks/ directori
  - `CANON-0041` (S2): Critical auth and journal paths have minimal/no te
  - `CANON-0042` (S2): Direct Firestore collection access bypasses Reposi
  - `CANON-0056` (S3): Potential duplicated domain types across lib/types

### lib/firestore-service.ts

- **Categories:** code, engineering-productivity, performance, refactoring
- **Total Findings:** 25
  - `CANON-0032` (S2): Today page bypasses service/repository boundary wi
  - `CANON-0033` (S2): High-volume console logging in journal save/stats
  - `CANON-0035` (S2): Firestore documents are cast to domain type withou
  - `CANON-0036` (S2): Coverage gaps remain in critical firebase/auth/fir
  - `CANON-0044` (S2): No correlation IDs for request tracing across clie
  - `CANON-0047` (S2): Duplicated Firestore Logic
  - `CANON-0007` (S1): No correlation ID system for distributed tracing
  - `CANON-0008` (S1): No write queue for offline mutations
  - `CANON-0012` (S1): No correlation IDs for frontend-to-backend request
  - `CANON-0018` (S2): Logger is present but lacks correlation/request ID
  - `CANON-0023` (S2): Console.log used in production paths (firestore-se
  - `CANON-0027` (S2): 46 console.log statements remain in production cod
  - `CANON-0028` (S2): No conflict resolution strategy
  - `CANON-0011` (S1): Writes rely on Cloud Functions, failing when offli
  - `CANON-0004` (S1): Cloud Function calling patterns duplicated despite
  - `CANON-0010` (S1): Triple data access layer: 3 overlapping Firestore
  - `CANON-0012` (S1): Cloud Function call boilerplate not migrated to ca
  - `CANON-0013` (S1): JournalEntryType string literals defined in 4+ loc
  - `CANON-0016` (S1): Inconsistent secure callable usage: httpsCallable
  - `CANON-0020` (S2): reCAPTCHA action strings/constants duplicated acro
  - `CANON-0040` (S2): lib/db/ services bypass firestore-service.ts repos
  - `CANON-0043` (S2): Repeated dynamic imports of firebase/functions in
  - `CANON-0045` (S2): Inconsistent service patterns: class-based vs obje
  - `CANON-0048` (S2): FirestoreAdapter overlaps with FirestoreService on
  - `CANON-0056` (S3): Potential duplicated domain types across lib/types

### components/notebook/pages/today-page.tsx

- **Categories:** code, engineering-productivity, performance, refactoring
- **Total Findings:** 23
  - `CANON-0010` (S1): Oversized UI Components (1,000-2,000+ Lines Each)
  - `CANON-0019` (S2): Type Safety: `any` type in today-page.tsx
  - `CANON-0032` (S2): Today page bypasses service/repository boundary wi
  - `CANON-0033` (S2): High-volume console logging in journal save/stats
  - `CANON-0048` (S2): Complex Logic in UI Component
  - `CANON-0054` (S2): Potential Firestore-rules alignment risk for direc
  - `CANON-0060` (S3): Explicit Any Type
  - `CANON-0023` (S2): Console.log used in production paths (firestore-se
  - `CANON-0027` (S2): 46 console.log statements remain in production cod
  - `CANON-0033` (S2): Debug console.log statements left in Today page
  - `CANON-0046` (S2): Offline write queue for mutations not found
  - `CANON-0003` (S1): Today page re-subscribes Firestore onSnapshot when
  - `CANON-0027` (S2): High-frequency re-renders during typing in Recover
  - `CANON-0028` (S2): Multiple disjoint fetches for daily logs
  - `CANON-0042` (S2): today-page.tsx has 10 useEffect hooks - potential
  - `CANON-0053` (S3): 4 real-time onSnapshot listeners active simultaneo
  - `CANON-0054` (S3): Client-side filtering of daily logs
  - `CANON-0057` (S3): date-fns may not be tree-shaken effectively
  - `CANON-0001` (S1): Direct Firestore SDK reads in UI/components bypass
  - `CANON-0002` (S1): TodayPage is a high-complexity god-component mixin
  - `CANON-0025` (S2): Bypassed typed collection helpers: 27 raw collecti
  - `CANON-0032` (S2): COLLECTIONS constants built but never adopted
  - `CANON-0035` (S2): today-page.tsx oversized component (1199+ lines)

### components/admin/admin-crud-table.tsx

- **Categories:** code, performance, refactoring
- **Total Findings:** 14
  - `CANON-0011` (S1): Inconsistent Admin Write Patterns (Cloud Functions
  - `CANON-0027` (S2): Redundant getFunctions() Calls (28+ Across Admin C
  - `CANON-0001` (S1): Excessive client-component surface ("use client" a
  - `CANON-0002` (S1): Unbounded Firestore reads in AdminCrudTable (getDo
  - `CANON-0015` (S2): AdminCrudTable filters items on every render witho
  - `CANON-0001` (S1): Direct Firestore SDK reads in UI/components bypass
  - `CANON-0004` (S1): Cloud Function calling patterns duplicated despite
  - `CANON-0005` (S1): Admin API service missing: 30+ getFunctions()/http
  - `CANON-0009` (S1): getFunctions()/httpsCallable() boilerplate in 10 f
  - `CANON-0018` (S2): Repeated Firestore snapshot.docs.map -> {id,...dat
  - `CANON-0023` (S2): AdminCrudTable mixes UI concerns with data access;
  - `CANON-0025` (S2): Bypassed typed collection helpers: 27 raw collecti
  - `CANON-0032` (S2): COLLECTIONS constants built but never adopted
  - `CANON-0037` (S2): links-tab.tsx simple CRUD tab not using AdminCrudT

### lib/db/quotes.ts

- **Categories:** code, refactoring, security
- **Total Findings:** 13
  - `CANON-0029` (S2): Inconsistent lib/db/ Write Patterns
  - `CANON-0047` (S2): Duplicated Firestore Logic
  - `CANON-0010` (S1): Triple data access layer: 3 overlapping Firestore
  - `CANON-0018` (S2): Repeated Firestore snapshot.docs.map -> {id,...dat
  - `CANON-0024` (S2): Timestamp inconsistency: Timestamp.now() vs server
  - `CANON-0025` (S2): Bypassed typed collection helpers: 27 raw collecti
  - `CANON-0026` (S2): Query builder duplication in lib/db/\*.ts services
  - `CANON-0032` (S2): COLLECTIONS constants built but never adopted
  - `CANON-0038` (S2): CRUD boilerplate duplicated across 5+ lib/db/ serv
  - `CANON-0040` (S2): lib/db/ services bypass firestore-service.ts repos
  - `CANON-0045` (S2): Inconsistent service patterns: class-based vs obje
  - `CANON-0050` (S2): DB modules split across lib/db/ and lib/database/
  - `CANON-0011` (S2): Admin CRUD uses client Firestore writes, bypassing

### lib/db/slogans.ts

- **Categories:** code, refactoring, security
- **Total Findings:** 13
  - `CANON-0029` (S2): Inconsistent lib/db/ Write Patterns
  - `CANON-0010` (S1): Triple data access layer: 3 overlapping Firestore
  - `CANON-0018` (S2): Repeated Firestore snapshot.docs.map -> {id,...dat
  - `CANON-0021` (S2): Firestore collection names/paths inconsistently ha
  - `CANON-0024` (S2): Timestamp inconsistency: Timestamp.now() vs server
  - `CANON-0025` (S2): Bypassed typed collection helpers: 27 raw collecti
  - `CANON-0032` (S2): COLLECTIONS constants built but never adopted
  - `CANON-0038` (S2): CRUD boilerplate duplicated across 5+ lib/db/ serv
  - `CANON-0040` (S2): lib/db/ services bypass firestore-service.ts repos
  - `CANON-0042` (S2): Direct Firestore collection access bypasses Reposi
  - `CANON-0045` (S2): Inconsistent service patterns: class-based vs obje
  - `CANON-0050` (S2): DB modules split across lib/db/ and lib/database/
  - `CANON-0011` (S2): Admin CRUD uses client Firestore writes, bypassing

### lib/db/sober-living.ts

- **Categories:** code, performance, refactoring
- **Total Findings:** 12
  - `CANON-0023` (S0): Sober Living Admin Tab Silently Fails All Writes
  - `CANON-0029` (S2): Inconsistent lib/db/ Write Patterns
  - `CANON-0046` (S2): Sober living list loads entire collection without
  - `CANON-0010` (S1): Triple data access layer: 3 overlapping Firestore
  - `CANON-0018` (S2): Repeated Firestore snapshot.docs.map -> {id,...dat
  - `CANON-0025` (S2): Bypassed typed collection helpers: 27 raw collecti
  - `CANON-0026` (S2): Query builder duplication in lib/db/\*.ts services
  - `CANON-0032` (S2): COLLECTIONS constants built but never adopted
  - `CANON-0038` (S2): CRUD boilerplate duplicated across 5+ lib/db/ serv
  - `CANON-0040` (S2): lib/db/ services bypass firestore-service.ts repos
  - `CANON-0045` (S2): Inconsistent service patterns: class-based vs obje
  - `CANON-0050` (S2): DB modules split across lib/db/ and lib/database/

### functions/src/security-wrapper.ts

- **Categories:** code, refactoring, security
- **Total Findings:** 11
  - `CANON-0005` (S1): reCAPTCHA Token Bypass (Existing DEBT-0045)
  - `CANON-0006` (S1): Incomplete Rate Limiting (Existing DEBT-0046)
  - `CANON-0008` (S1): Excessive Cognitive Complexity (40+ files)
  - `CANON-0044` (S2): No correlation IDs for request tracing across clie
  - `CANON-0008` (S1): admin.ts Mega-File: 33 Cloud Functions with identi
  - `CANON-0011` (S1): admin functions use weaker security checks than us
  - `CANON-0003` (S1): App Check disabled on all Cloud Functions
  - `CANON-0006` (S2): Cloud Function Zod schemas are not strict; unknown
  - `CANON-0008` (S2): IP-based rate limiting is supported but not applie
  - `CANON-0009` (S2): Rate limit exceed is treated as generic failure in
  - `CANON-0018` (S2): IP-based rate limiting not enforced and Retry-Afte

---

## Dependency Chains

- **components/**: 1 critical findings may block 1 lower-severity fixes
- **scripts/validate-audit.js**: 2 critical findings may block 1 lower-severity
  fixes
- **hooks/use-journal.ts**: 6 critical findings may block 3 lower-severity fixes
- **components/notebook/pages/today-page.tsx**: 4 critical findings may block 1
  lower-severity fixes
- **lib/firestore-service.ts**: 8 critical findings may block 1 lower-severity
  fixes
- **lib/db/library.ts**: 12 critical findings may block 1 lower-severity fixes
- **lib/db/glossary.ts**: 5 critical findings may block 1 lower-severity fixes
- **lib/db/quotes.ts**: 5 critical findings may block 1 lower-severity fixes
- **lib/db/slogans.ts**: 5 critical findings may block 1 lower-severity fixes
- **lib/db/sober-living.ts**: 5 critical findings may block 1 lower-severity
  fixes

---

## Recommended Action Plan

### Phase 1: Critical (S0) - Immediate

_No S0 findings_

### Phase 2: High Priority (S1) - This Sprint

- [ ] **CANON-0004**: DEVELOPMENT.md references npm script type-check that does
      no
- [ ] **CANON-0016**: OfflineIndicator uses navigator.onLine in useState
      initializ
- [ ] **CANON-0003**: Firebase Functions use Node 20 but CI uses Node 22 —
      version
- [ ] **CANON-0012**: Firebase App Check is disabled in client initialization
      path
- [ ] **CANON-0003**: Firebase Functions use Node 20 but CI uses Node 22 —
      version
- [ ] **CANON-0005**: reCAPTCHA Token Bypass (Existing DEBT-0045)
- [ ] **CANON-0011**: Inconsistent Admin Write Patterns (Cloud Functions vs
      Direct
- [ ] **CANON-0001**: DEVELOPMENT.md references missing npm script type-check
- [ ] **CANON-0017**: Firestore rules may not cover worksheets subcollection
- [ ] **CANON-0017**: Firestore rules may not cover worksheets subcollection

### Phase 3: Cross-Cutting Files

- [ ] **package.json** (6 categories, 43 findings)
- [ ] **lib/firebase.ts** (6 categories, 14 findings)
- [ ] **hooks/use-journal.ts** (4 categories, 26 findings)
- [ ] **lib/firestore-service.ts** (4 categories, 25 findings)
- [ ] **components/notebook/pages/today-page.tsx** (4 categories, 23 findings)

---

## Next Steps

1. **Review** this summary and the UNIFIED-FINDINGS.jsonl file
2. **Ingest** to TDMS: `node scripts/debt/intake-audit.js <path-to-unified>`
3. **Track** progress in ROADMAP.md or your issue tracker
4. **Archive** the session when complete

---

**Generated by Multi-AI Audit Orchestrator**
