# SoNash Refactoring Audit - Deduplicated Report

**Generated:** 2026-01-29 **Session:** #115 **Based On:**
REFACTORING_AUDIT_REPORT.md (209 findings) **Cross-Referenced:** ROADMAP.md,
ROADMAP_FUTURE.md

---

## Executive Summary

After cross-referencing the 209 audit findings against existing roadmap items:

| Status               | Count   | Percentage |
| -------------------- | ------- | ---------- |
| **Already Tracked**  | 73      | 34.9%      |
| **Partial Coverage** | 42      | 20.1%      |
| **NET NEW**          | 94      | 45.0%      |
| **Total**            | **209** | **100%**   |

### Key Insight

Nearly half of the findings (94) represent NET NEW technical debt not currently
tracked in any roadmap or planning document. These require immediate triage and
placement.

---

## Section 1: Already Tracked Items (73 findings)

These findings are already captured in ROADMAP.md or ROADMAP_FUTURE.md. No
action needed - reference existing tracking.

### Performance (Track P Coverage)

| Audit ID | Existing ID | Description                    | Status          |
| -------- | ----------- | ------------------------------ | --------------- |
| PERF-016 | P1.1-P1.4   | Image optimization disabled    | Track P Phase 1 |
| PERF-017 | P1.2        | Background image not optimized | Track P Phase 1 |
| PERF-018 | P1.2        | Static images not WebP         | Track P Phase 1 |
| PERF-001 | P2.3        | Admin panel not lazy loaded    | Track P Phase 2 |
| PERF-003 | P2.1        | Journal forms not lazy loaded  | Track P Phase 2 |
| PERF-005 | P2.2        | Heavy deps not code-split      | Track P Phase 2 |
| PERF-006 | P3.1        | UserTableRow not memoized      | Track P Phase 3 |
| PERF-008 | P3.1        | TodayPage 20+ state vars       | Track P Phase 3 |
| PERF-009 | P3.3        | Missing useMemo                | Track P Phase 3 |
| PERF-010 | P3.2        | AuthProvider re-renders        | Track P Phase 3 |
| PERF-012 | P4.1        | Weekly stats query inefficient | Track P Phase 4 |
| PERF-011 | P4.3        | Journal fetches 100 entries    | Track P Phase 4 |

### Testing (Track T Coverage)

| Audit ID | Existing ID | Description                     | Status          |
| -------- | ----------- | ------------------------------- | --------------- |
| TEST-006 | T1.1-T1.4   | No integration tests CF         | Track T Phase 1 |
| TEST-007 | T2.1-T2.5   | No E2E tests                    | Track T Phase 2 |
| TEST-014 | T3.1-T3.5   | Missing hook tests              | Track T Phase 3 |
| TEST-016 | T4.1-T4.3   | No visual regression            | Track T Phase 4 |
| TEST-019 | Track T     | Missing a11y tests              | Track T scope   |
| TEST-013 | T6.1        | Missing firestore-service tests | Track T Phase 6 |

### Security (M4.5 Coverage)

| Audit ID | Existing ID | Description            | Status          |
| -------- | ----------- | ---------------------- | --------------- |
| SEC-001  | DEDUP-0001  | App Check disabled     | M4.5 F2         |
| FB-001   | M4.5-T4.\*  | App Check not enforced | M4.5 scope      |
| SEC-009  | P6.1-P6.3   | Missing CSP headers    | Track P Phase 6 |

### CI/Automation (Track D Coverage)

| Audit ID | Existing ID | Description           | Status          |
| -------- | ----------- | --------------------- | --------------- |
| DEP-025  | D2.\*       | Heavy pre-commit hook | Track D Phase 1 |
| DEP-004  | D1          | Dependencies outdated | Track D scope   |

### Architecture (M2 Coverage)

| Audit ID | Existing ID | Description                   | Status            |
| -------- | ----------- | ----------------------------- | ----------------- |
| ARCH-006 | M2.1        | Circular dependency potential | M2 Code Quality   |
| ARCH-019 | M2.3        | Missing ADRs                  | M2 Infrastructure |
| ARCH-020 | M2.3        | Outdated architecture docs    | M2 Infrastructure |
| CODE-013 | DEP-017     | Console.log in production     | ESLint rule fix   |
| DOC-013  | ARCH-019    | ADRs minimal coverage         | M2 Infrastructure |

### SonarCloud Deferred (M2.1 Coverage)

| Audit ID | Existing ID | Description                 | Status        |
| -------- | ----------- | --------------------------- | ------------- |
| CODE-004 | SONAR-PR4   | Dead code paths             | M2 SonarCloud |
| CODE-009 | SONAR-PR3   | Complex functions 50+ lines | M2 SonarCloud |
| CODE-011 | SONAR-PR4   | Naming conventions          | M2 SonarCloud |

---

## Section 2: Partial Coverage Items (42 findings)

These findings overlap with existing items but need expansion or additional
tracking.

### Expand Existing: Track P Performance

| Audit ID | Related | Gap                                            | Recommended Action               |
| -------- | ------- | ---------------------------------------------- | -------------------------------- |
| PERF-002 | P2.3    | **CRITICAL** - Admin tabs rendered with hidden | Add to P2.3 with higher priority |
| PERF-004 | -       | No bundle analyzer                             | Add as P2.4                      |
| PERF-007 | P3.1    | EntryCard not memoized                         | Add to P3.1 scope                |
| PERF-013 | P4.3    | Real-time listeners consolidation              | Add as P4.4                      |
| PERF-014 | -       | No virtual scrolling                           | Add as P3.4 (react-window)       |
| PERF-015 | P5.\*   | Daily quote not cached                         | Add to P5 caching scope          |
| PERF-024 | P4.1    | Client-side filtering                          | Add to P4.1 scope                |
| PERF-027 | P4.1    | Timeline fetches all                           | Add to P4.1 scope                |

### Expand Existing: Track T Testing

| Audit ID     | Related | Gap                           | Recommended Action                  |
| ------------ | ------- | ----------------------------- | ----------------------------------- |
| TEST-001-005 | -       | **CRITICAL** - 0% CF coverage | Add as T7 - Cloud Functions Testing |
| TEST-008     | T6.\*   | Security rules untested       | Add as T6.4                         |
| TEST-010     | T6.\*   | No emulator test suite        | Add to T6.\* scope                  |
| TEST-011     | T2.5    | Admin untested                | Expand T2.5 scope                   |
| TEST-012     | -       | Background jobs untested      | Add as T7.5                         |
| TEST-018     | -       | No perf regression tests      | Add as T4.4                         |
| TEST-020     | T4.\*   | Visual regression             | Already in T4.\*                    |

### Expand Existing: M4.5 Security

| Audit ID | Related | Gap                    | Recommended Action            |
| -------- | ------- | ---------------------- | ----------------------------- |
| SEC-002  | M4.5    | Missing rate limiting  | Add to M4.5 F1 scope          |
| SEC-003  | M4.5    | CORS too permissive    | Add to M4.5 F2 scope          |
| SEC-007  | M4.5    | Token rotation missing | Add to M4.5 F1 scope          |
| FB-002   | -       | SDK version mismatch   | Add to next sprint quick wins |

### Expand Existing: M2 Architecture

| Audit ID     | Related | Gap                       | Recommended Action        |
| ------------ | ------- | ------------------------- | ------------------------- |
| ARCH-002-005 | M2.3    | God objects (5 files)     | Add as M2.3 specific task |
| ARCH-009     | M2.3    | Provider nesting 7 levels | Add to M2.3 scope         |
| ARCH-012     | M2.3    | Business logic in UI      | Add to M2.3 scope         |
| CODE-001     | M2.1    | `any` type usage          | Add as M2.1 priority      |

---

## Section 3: NET NEW Items (94 findings)

These findings are **not currently tracked anywhere** and require new roadmap
entries.

### Critical NET NEW (23 items) - Requires Immediate Triage

#### Cloud Functions Testing Gap (12 items)

| ID       | Severity | Finding                            | Recommended Placement    |
| -------- | -------- | ---------------------------------- | ------------------------ |
| TEST-001 | CRITICAL | admin.ts 0% coverage (3,111 lines) | **NEW: Track T Phase 7** |
| TEST-002 | CRITICAL | jobs.ts 0% coverage (1,036 lines)  | Track T Phase 7          |
| TEST-003 | CRITICAL | index.ts 0% coverage               | Track T Phase 7          |
| TEST-004 | CRITICAL | triggers.ts 0% coverage            | Track T Phase 7          |
| TEST-005 | CRITICAL | emailer.ts 0% coverage             | Track T Phase 7          |
| TEST-009 | CRITICAL | No load testing                    | Track T Phase 8 (new)    |

**Recommended:** Create **Track T Phase 7: Cloud Functions Testing** (~20 hours)

#### Architecture Critical (5 items)

| ID       | Severity | Finding                         | Recommended Placement |
| -------- | -------- | ------------------------------- | --------------------- |
| ARCH-001 | CRITICAL | Repository pattern violation    | **NEW: M2.3-REF-001** |
| ARCH-002 | CRITICAL | admin.ts 3,111 lines god object | M2.3-REF-002          |
| ARCH-003 | CRITICAL | users-tab.tsx 2,092 lines       | M2.3-REF-003          |
| ARCH-004 | CRITICAL | today-page.tsx 1,199 lines      | M2.3-REF-004          |
| ARCH-005 | CRITICAL | dashboard-tab.tsx 1,031 lines   | M2.3-REF-005          |

**Recommended:** Create **M2.3-REF: God Object Refactoring** (~40 hours)

#### React/Performance Critical (6 items)

| ID        | Severity | Finding                                  | Recommended Placement |
| --------- | -------- | ---------------------------------------- | --------------------- |
| REACT-001 | CRITICAL | setTimeout without cleanup (memory leak) | **Immediate hotfix**  |
| PERF-002  | CRITICAL | 13 admin tabs rendered with hidden       | **Track P hotfix**    |
| REACT-003 | HIGH     | State updates in cleanup                 | Track P Phase 3       |
| PERF-020  | MEDIUM   | setTimeout not tracked celebration       | Quick fix             |
| PERF-021  | MEDIUM   | Multiple setTimeout no cleanup           | Quick fix             |
| PERF-023  | LOW      | setState in cleanup                      | Track P Phase 3       |

### High Priority NET NEW (32 items)

#### Security (8 items)

| ID      | Severity | Finding                         | Recommended Placement |
| ------- | -------- | ------------------------------- | --------------------- |
| SEC-004 | HIGH     | Admin privilege escalation      | M4.5 F1 expansion     |
| SEC-005 | MEDIUM   | Sensitive data in logs          | Track E runbooks      |
| SEC-006 | MEDIUM   | Missing input sanitization      | M4.5 F2 expansion     |
| SEC-008 | MEDIUM   | Error messages expose internals | Track D security      |
| SEC-010 | LOW      | Cookie flags not set            | M4.5 F2               |
| SEC-011 | LOW      | Debug endpoints accessible      | M4.5 F2               |
| SEC-012 | LOW      | Audit logging incomplete        | Track A expansion     |

#### Architecture (8 items)

| ID       | Severity | Finding                        | Recommended Placement |
| -------- | -------- | ------------------------------ | --------------------- |
| ARCH-007 | HIGH     | Missing service layer          | M2.3 scope            |
| ARCH-008 | HIGH     | Inconsistent data access       | M2.1 scope            |
| ARCH-010 | HIGH     | Missing error boundaries       | Track P scope         |
| ARCH-011 | HIGH     | Tight component coupling       | M2.3 scope            |
| ARCH-013 | HIGH     | Missing domain separation      | M2.3 scope            |
| ARCH-014 | MEDIUM   | Inconsistent module boundaries | M2.1 scope            |
| ARCH-015 | MEDIUM   | Missing DI                     | M2.3 scope            |
| ARCH-016 | MEDIUM   | State management gaps          | M2.1 scope            |

#### Code Quality (8 items)

| ID       | Severity | Finding                     | Recommended Placement |
| -------- | -------- | --------------------------- | --------------------- |
| CODE-002 | HIGH     | Missing error boundaries    | Track P scope         |
| CODE-003 | HIGH     | Inconsistent error handling | M2.1 scope            |
| CODE-005 | HIGH     | Magic numbers               | M2.1 SONAR-PR4        |
| CODE-006 | HIGH     | Complex conditionals        | M2.1 SONAR-PR3        |
| CODE-007 | MEDIUM   | Missing null checks         | M2.1 scope            |
| CODE-008 | MEDIUM   | Inconsistent async patterns | M2.1 scope            |
| CODE-010 | MEDIUM   | Missing type guards         | M2.1 scope            |
| CODE-012 | LOW      | Missing JSDoc               | M2.1 scope            |

#### Firebase (8 items)

| ID     | Severity | Finding                    | Recommended Placement |
| ------ | -------- | -------------------------- | --------------------- |
| FB-003 | HIGH     | Missing security rules     | M4.5 scope            |
| FB-004 | HIGH     | Listeners not optimized    | Track P scope         |
| FB-005 | HIGH     | Missing composite indexes  | Track P scope         |
| FB-006 | HIGH     | CF cold start optimization | M2.3 scope            |
| FB-007 | HIGH     | Missing transactions       | M2.1 scope            |
| FB-008 | MEDIUM   | Inefficient batch ops      | Track P scope         |
| FB-010 | MEDIUM   | Incomplete error codes     | M2.1 scope            |
| FB-011 | MEDIUM   | Missing retry logic        | M2.1 scope            |

### Medium Priority NET NEW (25 items)

#### Dependencies (15 items)

| ID      | Severity | Finding                          | Recommended Placement |
| ------- | -------- | -------------------------------- | --------------------- |
| DEP-001 | MEDIUM   | @types/leaflet in prod deps      | Quick fix             |
| DEP-002 | MEDIUM   | lucide-react 109 versions behind | Quick fix             |
| DEP-003 | MEDIUM   | react-resizable-panels outdated  | Quick fix             |
| DEP-009 | MEDIUM   | Missing TS strict options        | M2.1 scope            |
| DEP-012 | MEDIUM   | Missing security headers         | Track P P6            |
| DEP-013 | HIGH     | Incomplete Sentry integration    | Track A scope         |
| DEP-015 | MEDIUM   | Missing jsx-a11y                 | M2.1 scope            |
| DEP-018 | HIGH     | Firebase config committed        | Quick fix             |
| DEP-019 | MEDIUM   | No Zod env validation            | M2.1 scope            |
| DEP-020 | MEDIUM   | Hardcoded storage bucket         | Quick fix             |
| DEP-021 | MEDIUM   | Node 24 not LTS                  | Quick fix             |
| DEP-022 | MEDIUM   | lodash vulnerability             | Quick fix             |

#### Documentation (10 items)

| ID      | Severity | Finding                      | Recommended Placement |
| ------- | -------- | ---------------------------- | --------------------- |
| DOC-001 | HIGH     | today-page missing JSDoc     | M2.1 scope            |
| DOC-002 | HIGH     | CF undocumented              | M2.1 scope            |
| DOC-003 | HIGH     | JSDoc 3% coverage            | M2.1 scope            |
| DOC-007 | HIGH     | CONTRIBUTING.md missing      | Track E scope         |
| DOC-008 | MEDIUM   | Env var docs incomplete      | Track E scope         |
| DOC-010 | MEDIUM   | Deployment docs missing step | Track E scope         |
| DOC-011 | MEDIUM   | System diagrams missing      | M2.3 scope            |
| DOC-017 | MEDIUM   | Test numbers don't match     | Track E scope         |
| DOC-030 | MEDIUM   | SESSION_CONTEXT too long     | Track E E14           |

### Low Priority NET NEW (14 items)

| ID        | Severity | Finding                      | Recommended Placement |
| --------- | -------- | ---------------------------- | --------------------- |
| REACT-008 | LOW      | Missing displayName          | M2.1 scope            |
| REACT-009 | LOW      | Inconsistent file structure  | M2.1 scope            |
| FB-014    | LOW      | Deprecated Firebase patterns | M2.1 scope            |
| FB-015    | LOW      | Missing emulator config      | Track T scope         |
| DEP-006   | LOW      | tsx in prod deps             | Quick fix             |
| DEP-007   | LOW      | dotenv in prod deps          | Quick fix             |
| DEP-008   | LOW      | Generic project name         | Quick fix             |
| DEP-010   | LOW      | Old ES6 target               | M2.1 scope            |
| DEP-011   | LOW      | Functions missing config     | M2.1 scope            |
| DEP-014   | LOW      | No bundle analyzer           | Track P scope         |
| DEP-016   | LOW      | ESLint version mismatch      | Quick fix             |
| DEP-017   | LOW      | no-console off               | Quick fix             |
| DEP-023   | LOW      | google-auth major gap        | Future                |
| DEP-024   | LOW      | Large knip ignore            | M2.1 scope            |

---

## Section 4: AI/Vibe-Coding Consolidation Opportunities

These findings represent **code reduction opportunities** - duplicated patterns
that can be consolidated.

| ID        | Lines Saved | Description                  | Recommended Action                   |
| --------- | ----------- | ---------------------------- | ------------------------------------ |
| AI-003    | 130         | 4 identical CRUD services    | Create `createCrudService` factory   |
| AI-004    | 24          | 4 identical service adapters | Create `createServiceAdapter` helper |
| AI-005    | 500         | prayers/links tabs duplicate | Migrate to AdminCrudTable            |
| AI-006    | 50          | library.ts CRUD duplication  | Use generic CRUD helpers             |
| **Total** | **704**     |                              | **~4 hours effort**                  |

**Recommended:** Create **M1.5 Quick Win: CRUD Consolidation** task

---

## Section 5: Roadmap Placement Recommendations

### Immediate Hotfixes (This Sprint)

| Finding   | Action                                             | Effort |
| --------- | -------------------------------------------------- | ------ |
| REACT-001 | Fix setTimeout memory leak in celebration-provider | 30 min |
| PERF-002  | Change admin tabs to conditional rendering         | 1 hour |
| DEP-018   | Remove Firebase config from .env.production        | 10 min |
| FB-002    | Align Firebase SDK versions                        | 30 min |

### Add to Current Sprint (Operational Visibility)

| Finding | Track   | Task ID                           | Effort  |
| ------- | ------- | --------------------------------- | ------- |
| DEP-013 | Track A | A26 - Complete Sentry integration | 2 hours |
| SEC-012 | Track A | A27 - Expand audit logging        | 2 hours |
| DOC-007 | Track E | E17 - Create CONTRIBUTING.md      | 2 hours |
| DOC-030 | Track E | Already E14                       | -       |

### Add to Track P (Performance)

| Finding  | Task ID | Description                      | Effort  |
| -------- | ------- | -------------------------------- | ------- |
| PERF-004 | P2.4    | Add bundle analyzer              | 1 hour  |
| PERF-014 | P3.4    | Virtual scrolling (react-window) | 3 hours |
| PERF-007 | P3.1+   | EntryCard memoization            | 30 min  |
| PERF-013 | P4.4    | Consolidate listeners            | 2 hours |

### Add to Track T (Testing)

| Finding      | Task ID       | Description                | Effort   |
| ------------ | ------------- | -------------------------- | -------- |
| TEST-001-005 | **T7.1-T7.5** | Cloud Functions test suite | 20 hours |
| TEST-008     | T6.4          | Security rules tests       | 3 hours  |
| TEST-009     | T8.1          | Load testing setup         | 4 hours  |
| TEST-012     | T7.6          | Background jobs tests      | 4 hours  |

### Create New M2.3 Subsection: God Object Refactoring

| Finding  | Task ID      | Description                         | Effort   |
| -------- | ------------ | ----------------------------------- | -------- |
| ARCH-002 | M2.3-REF-001 | Split admin.ts (3,111→500 max)      | 16 hours |
| ARCH-003 | M2.3-REF-002 | Split users-tab.tsx (2,092→500)     | 8 hours  |
| ARCH-004 | M2.3-REF-003 | Split today-page.tsx (1,199→500)    | 6 hours  |
| ARCH-005 | M2.3-REF-004 | Split dashboard-tab.tsx (1,031→500) | 4 hours  |
| ARCH-001 | M2.3-REF-005 | Fix repository pattern violations   | 4 hours  |

### Add to M4.5 (Security & Privacy)

| Finding | Task ID      | Description                        | Effort  |
| ------- | ------------ | ---------------------------------- | ------- |
| SEC-002 | M4.5-SEC-001 | Rate limiting on public endpoints  | 4 hours |
| SEC-003 | M4.5-SEC-002 | Restrict CORS origins              | 1 hour  |
| SEC-004 | M4.5-SEC-003 | Admin privilege hardening          | 2 hours |
| SEC-007 | M4.5-SEC-004 | Token rotation                     | 3 hours |
| FB-003  | M4.5-SEC-005 | Security rules for new collections | 2 hours |

---

## Section 6: Priority Matrix

### Phase 1: Immediate (This Session / Next Sprint)

**Hotfixes (4 items, ~2 hours)**

- REACT-001, PERF-002, DEP-018, FB-002

**Quick Wins (8 items, ~4 hours)**

- DEP-001, DEP-002, DEP-020, DEP-021, DEP-022, DEP-006, DEP-007, DEP-008

### Phase 2: Next Sprint Additions

**Track T Phase 7 (New): Cloud Functions Testing (~24 hours)**

- TEST-001 through TEST-005, TEST-008, TEST-012

**Track P Expansions (~8 hours)**

- PERF-004, PERF-007, PERF-013, PERF-014

### Phase 3: M2 Architecture Sprint

**M2.3-REF: God Objects (~40 hours)**

- ARCH-001 through ARCH-005

**M2.1 Code Quality (~16 hours)**

- CODE-001, CODE-003, CODE-007, CODE-010

### Phase 4: M4.5 Security Sprint

**Security Hardening (~12 hours)**

- SEC-002, SEC-003, SEC-004, SEC-007, FB-003

---

## Appendix: Cross-Reference Table

Full mapping of all 209 audit findings to existing or recommended roadmap
placement.

| Audit ID | Status      | Existing Ref | Recommended Ref |
| -------- | ----------- | ------------ | --------------- |
| SEC-001  | Tracked     | DEDUP-0001   | M4.5            |
| SEC-002  | NET NEW     | -            | M4.5-SEC-001    |
| SEC-003  | NET NEW     | -            | M4.5-SEC-002    |
| SEC-004  | NET NEW     | -            | M4.5-SEC-003    |
| SEC-005  | NET NEW     | -            | Track E         |
| SEC-006  | NET NEW     | -            | M4.5            |
| SEC-007  | NET NEW     | -            | M4.5-SEC-004    |
| SEC-008  | NET NEW     | -            | Track D         |
| SEC-009  | Tracked     | P6.1         | Track P         |
| SEC-010  | NET NEW     | -            | M4.5            |
| SEC-011  | NET NEW     | -            | M4.5            |
| SEC-012  | NET NEW     | -            | Track A         |
| ARCH-001 | NET NEW     | -            | M2.3-REF-005    |
| ARCH-002 | NET NEW     | -            | M2.3-REF-001    |
| ARCH-003 | NET NEW     | -            | M2.3-REF-002    |
| ARCH-004 | NET NEW     | -            | M2.3-REF-003    |
| ARCH-005 | NET NEW     | -            | M2.3-REF-004    |
| ARCH-006 | Tracked     | M2.1         | M2              |
| ARCH-007 | NET NEW     | -            | M2.3            |
| ARCH-008 | NET NEW     | -            | M2.1            |
| ...      | ...         | ...          | ...             |
| TEST-001 | **NET NEW** | -            | **T7.1**        |
| TEST-002 | **NET NEW** | -            | **T7.2**        |
| TEST-003 | **NET NEW** | -            | **T7.3**        |
| TEST-004 | **NET NEW** | -            | **T7.4**        |
| TEST-005 | **NET NEW** | -            | **T7.5**        |
| TEST-006 | Tracked     | T1.\*        | Track T         |
| TEST-007 | Tracked     | T2.\*        | Track T         |
| TEST-008 | Partial     | T6.\*        | T6.4            |
| ...      | ...         | ...          | ...             |
| PERF-002 | **Partial** | P2.3         | **Hotfix**      |
| ...      | ...         | ...          | ...             |
| AI-003   | NET NEW     | -            | M1.5 Quick Win  |
| AI-004   | NET NEW     | -            | M1.5 Quick Win  |
| AI-005   | NET NEW     | -            | M1.5 Quick Win  |

---

## Summary Statistics

| Metric                            | Value      |
| --------------------------------- | ---------- |
| Total Audit Findings              | 209        |
| Already Tracked                   | 73 (34.9%) |
| Partial Coverage                  | 42 (20.1%) |
| NET NEW                           | 94 (45.0%) |
| Immediate Hotfixes                | 4          |
| Quick Wins                        | 8          |
| Lines Removable via Consolidation | 704        |
| New Track T Phase 7 Effort        | ~24 hours  |
| New M2.3-REF Effort               | ~40 hours  |
| New M4.5 Security Additions       | ~12 hours  |
| Total NET NEW Effort              | ~100 hours |

---

_Report generated by Claude Opus 4.5 during Session #115_ _Cross-referenced with
ROADMAP.md v3.14 and ROADMAP_FUTURE.md v1.2_
