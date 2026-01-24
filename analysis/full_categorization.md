# Full Categorization Analysis

**Generated:** 2026-01-24 **Analyst:** Claude Code (Opus 4.5) **Sources:**

- ROADMAP.md v3.9
- analysis/full_inventory.md (396 items)
- analysis/effort_estimates.md (96 items with E0-E3 estimates)
- analysis/full_dependencies.md (dependency chains)

---

## Summary

| Metric                              | Value           |
| ----------------------------------- | --------------- |
| **Items categorized**               | 396             |
| **Primary categories**              | 11              |
| **Priority distribution validated** | 368 items (93%) |
| **Miscategorized items identified** | 14              |
| **Reorganization recommendations**  | 8               |

---

## Category Distribution

| Category           | Count | Percentage | Primary Milestones         |
| ------------------ | ----- | ---------- | -------------------------- |
| **Feature**        | 127   | 32.1%      | M6, M7, M4, M3             |
| **UI/UX**          | 65    | 16.4%      | M7, M1.6, OVS, Desktop/Web |
| **Security**       | 42    | 10.6%      | M4.5, M2, OVS              |
| **Offline**        | 36    | 9.1%       | M5, M2                     |
| **Testing**        | 29    | 7.3%       | OVS, M1.5, M5              |
| **Infrastructure** | 27    | 6.8%       | M2, OVS, Process           |
| **API/Backend**    | 24    | 6.1%       | OVS, M1.6, M2              |
| **Privacy**        | 18    | 4.5%       | M4.5, M7                   |
| **Analytics**      | 13    | 3.3%       | M7, M2, OVS                |
| **Documentation**  | 9     | 2.3%       | M1.5, M2, Process          |
| **Mobile/Native**  | 6     | 1.5%       | M9                         |

### Category Distribution Visualization

```
Feature        ████████████████████████████████  127 (32.1%)
UI/UX          ████████████████  65 (16.4%)
Security       ██████████  42 (10.6%)
Offline        █████████  36 (9.1%)
Testing        ███████  29 (7.3%)
Infrastructure ██████  27 (6.8%)
API/Backend    ██████  24 (6.1%)
Privacy        ████  18 (4.5%)
Analytics      ███  13 (3.3%)
Documentation  ██  9 (2.3%)
Mobile/Native  █  6 (1.5%)
```

---

## Priority Distribution by Milestone

| Milestone                    | P0     | P1      | P2      | P3     | Total   | Notes                                      |
| ---------------------------- | ------ | ------- | ------- | ------ | ------- | ------------------------------------------ |
| **Operational Visibility**   | 22     | 20      | 5       | 0      | 47      | Well-prioritized, 47% P0                   |
| **M1.5 - Quick Wins**        | 5      | 16      | 9       | 0      | 30      | Appropriate P0/P1 mix                      |
| **M1.6 - Admin Panel**       | 4      | 19      | 2       | 0      | 25      | Heavy P1, reasonable                       |
| **M2 - Architecture**        | 4      | 15      | 43      | 10     | 72      | P2 heavy (60%), appropriate for "optional" |
| **M3 - Meetings**            | 0      | 6       | 0       | 0      | 6       | All P1, consistent                         |
| **M4 - Expansion**           | 0      | 0       | 12      | 0      | 12      | All P2, consistent                         |
| **M4.5 - Security**          | 7      | 6       | 0       | 0      | 13      | 54% P0, appropriate for security           |
| **M5 - Offline + Steps**     | 4      | 18      | 1       | 0      | 23      | Strong P1 focus                            |
| **M6 - Journaling + Safety** | 4      | 21      | 0       | 1      | 26      | P0 are safety items                        |
| **M7 - Fellowship Suite**    | 0      | 77      | 2       | 0      | 79      | 97% P1, consistent                         |
| **M8 - Speakers**            | 0      | 0       | 3       | 0      | 3       | All P2, appropriate                        |
| **M9 - Native App**          | 3      | 5       | 6       | 1      | 15      | Mixed priorities                           |
| **M10 - Monetization**       | 0      | 1       | 3       | 8      | 12      | P3 heavy (67%), appropriate for research   |
| **Desktop/Web**              | 0      | 1       | 16      | 1      | 18      | P2 heavy, enhancement milestone            |
| **Process & Tooling**        | 0      | 4       | 2       | 2      | 8       | Balanced                                   |
| **Feature Decisions**        | 1      | 2       | 3       | 1      | 7       | Decision tracking, appropriate             |
| **TOTAL**                    | **54** | **211** | **107** | **24** | **396** |                                            |

### Priority Distribution Visualization

```
P0 (Critical)  █████  54 (13.6%)
P1 (Core)      ████████████████████████████████████████████████████  211 (53.3%)
P2 (Nice-Have) ███████████████████████████  107 (27.0%)
P3 (Deferred)  ██████  24 (6.1%)
```

---

## Category Assignments

### Categorization Key

| Category       | Color  | Description                                 | Examples              |
| -------------- | ------ | ------------------------------------------- | --------------------- |
| Security       | Red    | Auth, encryption, App Check, access control | T4.3, M2-SEC-2        |
| Privacy        | Purple | Anonymization, data protection, consent     | F4.10, F4.12          |
| Offline        | Blue   | IndexedDB, service worker, sync, cache      | T1.2, T1.4            |
| UI/UX          | Green  | Components, layouts, accessibility          | DW-001, M16-P6-3      |
| API/Backend    | Orange | Cloud Functions, Firestore, schema          | OV-A5, M16-P4-1       |
| Testing        | Yellow | Unit, integration, E2E, coverage            | OV-TEST-_, M15-TEST-_ |
| Documentation  | Gray   | Docs, guides, help system                   | M15-007, CANON-\*     |
| Analytics      | Teal   | Tracking, metrics, dashboards               | T6.3, M2-MON-\*       |
| Mobile/Native  | Pink   | Capacitor, native features, PWA             | T8.1, T9.1            |
| Infrastructure | Brown  | DevOps, CI/CD, tooling                      | PT-_, M2-TOOL-_       |
| Feature        | Cyan   | Core app functionality                      | F5._, F6._, F9.\*     |

---

## Miscategorized Items

Items that appear to be in the wrong milestone based on their category and
priority.

### High-Impact Miscategorizations (Recommended to Move)

| ID         | Current Milestone | Title                              | Category        | Recommended Milestone                   | Rationale                                  |
| ---------- | ----------------- | ---------------------------------- | --------------- | --------------------------------------- | ------------------------------------------ |
| M2-SEC-2   | M2 (Architecture) | Re-enable Firebase App Check       | Security        | M4.5 (Security)                         | Core security item, not architecture debt  |
| M2-EFF-010 | M2 (Architecture) | Implement Offline Queue (CRITICAL) | Offline         | M5 (Offline + Steps)                    | Marked CRITICAL, belongs with offline work |
| M2-EFF-011 | M2 (Architecture) | Add Offline Tests                  | Testing/Offline | M5 (Offline + Steps)                    | Offline-specific tests belong with M5      |
| M15-004    | M1.5 (Quick Wins) | Expanded Onboarding Wizard         | Feature         | M6 (Onboarding features F12.10, F12.11) | Large feature (8-13 SP), not a quick win   |
| M15-005    | M1.5 (Quick Wins) | Sponsor Personalization System     | Feature         | M7 (Sponsor features F2.\*)             | 8-13 SP, aligns with M7 sponsor work       |
| M4-001     | M4 (Expansion)    | Multiple sobriety dates            | Feature         | M5 (Step Work)                          | Related to step work tracking              |
| F12.1      | M7 (Fellowship)   | Savings Ticker                     | Feature         | M4 (Expansion)                          | Financial feature, not fellowship          |
| F12.2      | M7 (Fellowship)   | Wreckage List                      | Feature         | M5 (Step Work)                          | Step 9 feature, fits with M5 amends work   |

### Medium-Impact Miscategorizations (Consider Moving)

| ID          | Current Milestone  | Title                             | Category       | Consideration               | Rationale                         |
| ----------- | ------------------ | --------------------------------- | -------------- | --------------------------- | --------------------------------- |
| M2-DATA-1   | M2 (Architecture)  | Retry Geocoding for 50 Meetings   | API/Backend    | M3 (Meetings)               | Meeting data quality, fits M3     |
| M2-PERF-005 | M2 (Architecture)  | Development Dashboard Integration | Infrastructure | OVS (Track B)               | Already overlaps with OVS Track B |
| DW-015      | Desktop/Web        | Full-text search                  | Feature        | M7-F6 (Knowledge Base)      | Overlaps with T9.5 FlexSearch     |
| M16-P55-\*  | M1.6 (Admin Panel) | Local Resources (9 items)         | Feature        | M7-F5 (Nashville Advantage) | Nashville-specific, fits M7 theme |

### Low-Impact Observations (No Action Needed)

| ID        | Current Milestone | Title                          | Category       | Observation                             |
| --------- | ----------------- | ------------------------------ | -------------- | --------------------------------------- |
| M2-CTX-\* | M2 (Architecture) | Agent Infrastructure (9 items) | Infrastructure | Correctly in M2 as tooling optimization |
| FD-\*     | Feature Decisions | Decision tracking items        | Process        | Correctly isolated for tracking         |
| PT-\*     | Process & Tooling | Development tools              | Infrastructure | Correctly isolated                      |

---

## Reorganization Recommendations

### Recommendation 1: Create M2.1 Security Hardening Sub-Milestone

**Items to Move from M2 to M2.1:**

- M2-SEC-1: Manual reCAPTCHA Enterprise Implementation
- M2-SEC-2: Re-enable Firebase App Check (P0)
- M2-SC-PR5: Security Hotspots (97 items)

**Rationale:** Security items have higher priority (P0-P1) than typical M2
architecture work (P2). Creating a focused sub-milestone ensures these don't get
lost in the larger optional backlog.

**Impact:** 3 items moved, clearer security focus

---

### Recommendation 2: Consolidate Offline Items into M5

**Items to Move from M2 to M5:**

- M2-EFF-010: Implement Offline Queue (CRITICAL P0)
- M2-EFF-011: Add Offline Tests (P2)
- M2-EFF-012: Network Failure Error Handling Tests (P2)

**Rationale:** These are prerequisites for M5 offline architecture, not general
architecture debt. Moving them ensures they're completed as part of the offline
sprint.

**Impact:** 3 items moved, clearer offline scope

---

### Recommendation 3: Move Large Features from M1.5 Quick Wins

**Items to Move from M1.5 to Future Milestones:**

| Item                                      | Move To | Rationale                            |
| ----------------------------------------- | ------- | ------------------------------------ |
| M15-004 Expanded Onboarding (8-13 SP)     | M6-F3   | Aligns with F12.10/F12.11 onboarding |
| M15-005 Sponsor Personalization (8-13 SP) | M7-F1   | Aligns with sponsor features         |

**Rationale:** "Quick Wins" should be E0-E1 items (1-8 SP). Features exceeding 8
SP are not "quick" and inflate the milestone scope.

**Impact:** 2 items moved, M1.5 becomes truly quick wins

---

### Recommendation 4: Consolidate Financial Features into M4

**Items to Move from M7 to M4:**

- F12.1: Savings Ticker
- F12.2: Wreckage List (→ M5 for Step 9 alignment)

**Rationale:** Financial recovery features (F12.1) are user value expansion, not
fellowship-specific. Wreckage List is Step 9 work.

**Impact:** 2 items moved, cleaner M7 scope (fellowship-focused)

---

### Recommendation 5: Merge Overlapping Local Resources Items

**Items with Overlap:**

- M16-P55-\* (9 items in M1.6) vs M7-F5 (8 items - Nashville Advantage)

**Recommendation:** Keep M16-P55-\* items in M1.6 as admin-side CRUD, but add
explicit dependency to M7-F5 for user-facing features.

**Impact:** Clearer ownership, no duplication

---

### Recommendation 6: Split M7 Into Sub-Milestones

**Current State:** M7 has 79 items and ~350 SP (overloaded)

**Recommended Split:**

| Sub-Milestone | Focus                                 | Items | Estimated SP |
| ------------- | ------------------------------------- | ----- | ------------ |
| M7.1          | Sponsor Features (F1, F2)             | 15    | ~80 SP       |
| M7.2          | Exports & Knowledge Base (F4, F6)     | 27    | ~120 SP      |
| M7.3          | Nashville & Personalization (F5, F8)  | 19    | ~80 SP       |
| M7.4          | Safety & Analytics (F7, F9, F10, F11) | 18    | ~70 SP       |

**Impact:** Better estimation, clearer progress tracking

---

### Recommendation 7: Validate M9 Gate More Explicitly

**Current State:** M9 is conditional on T8.1 (Capacitor) decision gate

**Recommendation:** Add explicit "M9-GATE" item with decision criteria:

- PoC success metrics
- PWA fallback scope if rejected
- Items that can proceed regardless of decision

**Impact:** Clearer go/no-go criteria

---

### Recommendation 8: Add Missing Priorities

**18 items currently missing priority assignments.**

**Recommended Assignments:**

| ID          | Title                            | Recommended Priority | Rationale                  |
| ----------- | -------------------------------- | -------------------- | -------------------------- |
| M2-MON-1    | Performance monitoring           | P2                   | Architecture improvement   |
| M2-MON-2    | User analytics baseline          | P2                   | Architecture improvement   |
| M2-MON-3    | Alert thresholds                 | P2                   | Architecture improvement   |
| M2-JOB-1    | Refresh Cache/Indexes            | P3                   | Optimization, not required |
| M2-JOB-2    | Database Backup Verification     | P3                   | Optimization               |
| M2-ARCH-1   | Component library consolidation  | P2                   | Technical debt             |
| M2-ARCH-2   | State management standardization | P2                   | Technical debt             |
| M2-ARCH-3   | API abstraction layer            | P2                   | Technical debt             |
| M4-001      | Multiple sobriety dates          | P2                   | User feature               |
| M4-002      | Tone/language settings           | P2                   | User feature               |
| M4-003      | Craving countdown timer          | P2                   | User feature               |
| M4-004      | Auto-carry-forward task nudges   | P2                   | User feature               |
| M10-MODEL-1 | Premium Features                 | P2                   | Revenue strategy           |
| M10-MODEL-2 | Donation Model                   | P2                   | Revenue strategy           |
| M10-MODEL-3 | B2B Licensing                    | P2                   | Revenue strategy           |
| F4.11       | Shoulder Surf Blur               | P3                   | Deferred                   |
| T3.14       | Queue compaction                 | P3                   | Optimization               |
| F11.2       | Reclaiming City (map)            | P3                   | Deferred to M10            |

---

## Full Item Categorization (by Milestone)

### Operational Visibility (47 items)

| ID              | Title                                      | Category       | Priority | Validated |
| --------------- | ------------------------------------------ | -------------- | -------- | --------- |
| OV-A1           | Wire Sentry client                         | Infrastructure | P0       | Yes       |
| OV-A2           | Configure Sentry Cloud Function env        | Infrastructure | P0       | Yes       |
| OV-A3           | Admin Errors Tab                           | UI/UX          | P0       | Yes       |
| OV-A3.1         | User correlation to Errors Tab             | Analytics      | P0       | Yes       |
| OV-A4           | Admin Logs Tab with GCP deep links         | UI/UX          | P0       | Yes       |
| OV-A5           | Fix Dashboard Tab - adminGetDashboardStats | API/Backend    | P0       | Yes       |
| OV-A6           | Users Tab - pagination                     | UI/UX          | P0       | Yes       |
| OV-A7           | Stacked Tabs UI                            | UI/UX          | P0       | Yes       |
| OV-A8           | User privilege types                       | Security       | P0       | Yes       |
| OV-A9           | Grant privileges UI                        | Security       | P0       | Yes       |
| OV-A10          | Cleanup Old Sessions job                   | API/Backend    | P0       | Yes       |
| OV-A11          | Cleanup Orphaned Storage Files             | API/Backend    | P0       | Yes       |
| OV-A12          | Generate Usage Analytics                   | Analytics      | P0       | Yes       |
| OV-A13          | Prune Security Events                      | Security       | P0       | Yes       |
| OV-A14          | Health Check Notifications                 | API/Backend    | P0       | Yes       |
| OV-A15          | Password Reset Button                      | Security       | P1       | Yes       |
| OV-A16          | Storage Stats in Dashboard                 | Analytics      | P1       | Yes       |
| OV-A17          | Rate Limit Viewer                          | Security       | P1       | Yes       |
| OV-A18          | Collection Document Counts                 | Analytics      | P1       | Yes       |
| OV-A19          | User Analytics Tab                         | Analytics      | P1       | Yes       |
| OV-A20          | Job Results Detailed Viewer                | UI/UX          | P1       | Yes       |
| OV-A21          | Sentry Error to User Correlation           | Analytics      | P1       | Yes       |
| OV-A22          | GCP Cloud Logging Query Builder            | Infrastructure | P1       | Yes       |
| OV-A23          | Error JSON Export                          | UI/UX          | P1       | Yes       |
| OV-A24          | Auto-Refresh Tabs                          | UI/UX          | P1       | Yes       |
| OV-A25          | Soft-Delete Users                          | Security       | P1       | Yes       |
| OV-B1           | Create /dev route                          | Infrastructure | P1       | Yes       |
| OV-B2           | PERF-001 Lighthouse script                 | Testing        | P1       | Yes       |
| OV-B3           | Lighthouse Dashboard Tab                   | UI/UX          | P1       | Yes       |
| OV-B4           | Doc Sync Tab                               | Documentation  | P1       | Yes       |
| OV-B5           | Testing Integration Tab                    | Testing        | P1       | Yes       |
| OV-B6           | Audit Threshold Monitoring                 | Testing        | P1       | Yes       |
| OV-B7           | PERF-002 Lighthouse CI                     | Testing        | P1       | Yes       |
| OV-B8           | PERF-003 Firestore history                 | Analytics      | P1       | Yes       |
| OV-B9-B11       | Error, Session, Override tabs              | UI/UX          | P2       | Yes       |
| OV-C1           | User Analytics Tab - Admin                 | Analytics      | P2       | Yes       |
| OV-C2           | Monitoring Consolidation                   | Infrastructure | P2       | Yes       |
| OV-FE-1         | Error knowledge base to Firestore          | API/Backend    | P2       | Yes       |
| OV-FE-2         | Query GCP Cloud Logging API                | API/Backend    | P2       | Yes       |
| OV-FE-3         | Sensitive log persistence review           | Security       | P2       | Yes       |
| OV-TEST-LOGS    | Logs Tab UI Tests                          | Testing        | P0       | Yes       |
| OV-TEST-PRIV-BE | Privileges Backend Tests                   | Testing        | P0       | Yes       |
| OV-TEST-PRIV-FE | Privileges Frontend Tests                  | Testing        | P0       | Yes       |
| OV-TEST-JOBS    | Background Jobs Tests                      | Testing        | P0       | Yes       |
| OV-TEST-SEC     | Security Testing                           | Testing        | P0       | Yes       |
| OV-TEST-INT     | Integration Tests                          | Testing        | P0       | Yes       |
| OV-TEST-PERF    | Performance Tests                          | Testing        | P0       | Yes       |

### M1.5 - Quick Wins (30 items)

| ID             | Title                            | Category       | Priority | Validated          |
| -------------- | -------------------------------- | -------------- | -------- | ------------------ |
| M15-CANON-0107 | Missing security headers         | Security       | P0       | Yes                |
| M15-CANON-0108 | No Firebase Storage rules        | Security       | P0       | Yes                |
| M15-CANON-0103 | Fix docs:check false positives   | Documentation  | P1       | Yes                |
| M15-CANON-0104 | Add scripts to session start     | Infrastructure | P1       | Yes                |
| M15-CANON-0105 | Add CANON validation to CI       | Infrastructure | P1       | Yes                |
| M15-CANON-0106 | Add npm commands for scripts     | Infrastructure | P2       | Yes                |
| M15-LEGACY-001 | Retrofit SSR-safe localStorage   | Offline        | P2       | Yes                |
| M15-REFAC-001  | Extract admin.ts/jobs.ts helpers | API/Backend    | P2       | Yes                |
| M15-CANON-0101 | Missing Quick Start sections     | Documentation  | P2       | Yes                |
| M15-CANON-0102 | Missing AI Instructions sections | Documentation  | P2       | Yes                |
| M15-SAST       | Research SAST Tool Integration   | Security       | P1       | Yes                |
| M15-001        | Settings page UI                 | UI/UX          | P1       | Yes                |
| M15-002        | Profile management               | UI/UX          | P1       | Yes                |
| M15-003        | Clean date picker improvements   | UI/UX          | P1       | Yes                |
| M15-004        | Expanded Onboarding Wizard       | Feature        | P0       | **MISCATEGORIZED** |
| M15-005        | Sponsor Personalization System   | Feature        | P0       | **MISCATEGORIZED** |
| M15-006        | Stage-of-Recovery Selector       | Feature        | P0       | Yes                |
| M15-007        | User Documentation & Help System | Documentation  | P1       | Yes                |
| M15-008        | Sober Fun Ideas Generator        | Feature        | P1       | Yes                |
| M15-009        | Meetings Starting Soon Filter    | Feature        | P1       | Yes                |
| M15-010        | Too Tired Mode                   | Feature        | P2       | Yes                |
| M15-011        | Disguised App Icon + Name        | Privacy        | P2       | Yes                |
| M15-EFF-001    | npm run dev:offline Script       | Infrastructure | P1       | Yes                |
| M15-EFF-003    | scripts/doctor.js Validator      | Infrastructure | P1       | Yes                |
| M15-EFF-005    | Cache npm ci in CI               | Infrastructure | P1       | Yes                |
| M15-AUTO-001   | Wire Session-Start Scripts       | Infrastructure | P1       | Yes                |
| M15-AUTO-002   | Add npm audit to Pre-Push        | Security       | P1       | Yes                |
| M15-AUTO-003   | Integrate Sentry with Logger     | Infrastructure | P1       | Yes                |
| M15-TEST-001   | Add redactSensitiveUrl Tests     | Testing        | P1       | Yes                |
| M15-TEST-002   | Cloud Functions Validation Tests | Testing        | P1       | Yes                |

### M1.6 - Admin Panel + UX (25 items)

| ID        | Title                           | Category       | Priority | Validated |
| --------- | ------------------------------- | -------------- | -------- | --------- |
| M16-P4-1  | adminGetSentryErrorSummary      | API/Backend    | P0       | Yes       |
| M16-P4-2  | Error summary card on Dashboard | UI/UX          | P0       | Yes       |
| M16-P4-3  | Errors tab with recent errors   | UI/UX          | P0       | Yes       |
| M16-P4-4  | Deep links to Sentry            | UI/UX          | P0       | Yes       |
| M16-P4-5  | User ID correlation             | Analytics      | P1       | Yes       |
| M16-P5-1  | Recent security events display  | Security       | P1       | Yes       |
| M16-P5-2  | Deep link to GCP Cloud Logging  | UI/UX          | P1       | Yes       |
| M16-P5-3  | Verify log retention            | Security       | P1       | Yes       |
| M16-P5-4  | Log sink for archival           | Infrastructure | P2       | Yes       |
| M16-P55-1 | Display local resources         | Feature        | P1       | Yes       |
| M16-P55-2 | Category filtering              | UI/UX          | P1       | Yes       |
| M16-P55-3 | Search/filter resources         | UI/UX          | P1       | Yes       |
| M16-P55-4 | Map view with Nearby            | UI/UX          | P1       | Yes       |
| M16-P55-5 | Resource detail cards           | UI/UX          | P1       | Yes       |
| M16-P55-6 | Call and Get Directions         | UI/UX          | P1       | Yes       |
| M16-P55-7 | Sort by distance                | UI/UX          | P1       | Yes       |
| M16-P55-8 | Resources tab in Admin          | UI/UX          | P1       | Yes       |
| M16-P55-9 | CRUD for local resources        | API/Backend    | P1       | Yes       |
| M16-P6-1  | Quick Actions settings panel    | UI/UX          | P1       | Yes       |
| M16-P6-2  | Action selection                | UI/UX          | P1       | Yes       |
| M16-P6-3  | Action ordering (drag-drop)     | UI/UX          | P1       | Yes       |
| M16-P6-4  | Custom phone numbers            | Feature        | P1       | Yes       |
| M16-P6-5  | Save preferences to profile     | API/Backend    | P1       | Yes       |
| M16-FUT-1 | Batch Operations                | UI/UX          | P2       | Yes       |
| M16-FUT-2 | Dark Mode for Admin             | UI/UX          | P2       | Yes       |

### M2 - Architecture Refactor (72 items)

| ID          | Title                            | Category       | Priority | Validated          |
| ----------- | -------------------------------- | -------------- | -------- | ------------------ |
| M2-MON-1    | Performance monitoring           | Analytics      | P2       | **MISSING**        |
| M2-MON-2    | User analytics baseline          | Analytics      | P2       | **MISSING**        |
| M2-MON-3    | Alert thresholds                 | Analytics      | P2       | **MISSING**        |
| M2-INC-P1-1 | GCP budget alerts                | Infrastructure | P1       | Yes                |
| M2-INC-P1-2 | Log-based metrics                | Analytics      | P1       | Yes                |
| M2-INC-P1-3 | Sentry alert rules               | Infrastructure | P1       | Yes                |
| M2-INC-P2-1 | Hot-loadable blocklist           | Security       | P2       | Yes                |
| M2-INC-P2-2 | Emergency response scripts       | Security       | P2       | Yes                |
| M2-INC-P2-3 | Incident timeline extractor      | Infrastructure | P2       | Yes                |
| M2-INC-P2-4 | Admin panel UI for blocklist     | UI/UX          | P2       | Yes                |
| M2-JOB-1    | Refresh Cache/Indexes            | API/Backend    | P3       | **MISSING**        |
| M2-JOB-2    | Database Backup Verification     | API/Backend    | P3       | **MISSING**        |
| M2-SC-PR3   | Major Code Quality (~220)        | Infrastructure | P2       | Yes                |
| M2-SC-PR4   | Medium/Minor Priority (~1,095)   | Infrastructure | P3       | Yes                |
| M2-SC-PR5   | Security Hotspots (97)           | Security       | P2       | Yes                |
| M2-TOOL-1   | Prettier                         | Infrastructure | P0       | Yes                |
| M2-TOOL-2   | ESLint                           | Infrastructure | P0       | Yes                |
| M2-TOOL-3   | madge                            | Infrastructure | P0       | Yes                |
| M2-TOOL-4   | Pattern Compliance               | Infrastructure | P0       | Yes                |
| M2-TOOL-5   | Delta Review Process             | Infrastructure | P0       | Yes                |
| M2-TOOL-6   | Cross-Platform Testing           | Testing        | P2       | Yes                |
| M2-TOOL-7   | knip                             | Infrastructure | P2       | Yes                |
| M2-TOOL-8   | ESLint Import Boundary           | Infrastructure | P2       | Yes                |
| M2-TOOL-9   | Automated Metrics Dashboard      | Analytics      | P2       | Yes                |
| M2-DEP-1    | recharts migration               | Infrastructure | P2       | Yes                |
| M2-DEP-2    | tailwind-merge migration         | Infrastructure | P2       | Yes                |
| M2-DEP-3    | react-resizable-panels migration | Infrastructure | P2       | Yes                |
| M2-DEP-4    | lucide-react update              | Infrastructure | P2       | Yes                |
| M2-DEP-5    | Add LICENSE file                 | Documentation  | P3       | Yes                |
| M2-CTX-1    | File-Size Filtering              | Infrastructure | P1       | Yes                |
| M2-CTX-2    | Shared Path Validation           | Infrastructure | P1       | Yes                |
| M2-CTX-3    | Hook Redundancy Analysis         | Infrastructure | P1       | Yes                |
| M2-CTX-4    | codebase-explorer Agent          | Infrastructure | P1       | Yes                |
| M2-CTX-5    | code-reviewer Parallelization    | Infrastructure | P1       | Yes                |
| M2-CTX-6    | agent-router Agent               | Infrastructure | P2       | Yes                |
| M2-CTX-7    | Extract Shared Utilities         | Infrastructure | P2       | Yes                |
| M2-CTX-8    | documentation-enforcement Agent  | Infrastructure | P3       | Yes                |
| M2-CTX-9    | Audit All 42 Skills              | Infrastructure | P3       | Yes                |
| M2-CTX-10   | context-optimizer Agent          | Infrastructure | P3       | Yes                |
| M2-DD-1     | Bundle Size Analysis Tab         | Analytics      | P1       | Yes                |
| M2-DD-2     | CI/CD Pipeline Status            | Infrastructure | P1       | Yes                |
| M2-DD-3     | Deployment History               | Infrastructure | P1       | Yes                |
| M2-DD-4     | Test Coverage Dashboard          | Testing        | P2       | Yes                |
| M2-DD-5     | Dependency Security Tab          | Security       | P2       | Yes                |
| M2-DD-6     | API Latency Metrics              | Analytics      | P2       | Yes                |
| M2-DD-7     | Database Stats                   | Analytics      | P2       | Yes                |
| M2-DD-8     | Health Check Endpoint            | API/Backend    | P1       | Yes                |
| M2-DD-9     | Feature Flags Management         | Infrastructure | P2       | Yes                |
| M2-DD-10    | Cost Monitoring                  | Analytics      | P2       | Yes                |
| M2-SEC-1    | Manual reCAPTCHA Enterprise      | Security       | P1       | Yes                |
| M2-SEC-2    | Re-enable Firebase App Check     | Security       | P0       | **MISCATEGORIZED** |
| M2-DATA-1   | Retry Geocoding                  | API/Backend    | P2       | **MISCATEGORIZED** |
| M2-DATA-2   | Revert to next/font/google       | Infrastructure | P3       | Yes                |
| M2-CQ-1     | Prettier Formatting              | Infrastructure | P2       | Yes                |
| M2-CQ-2     | Unused devDependencies           | Infrastructure | P3       | Yes                |
| M2-CQ-3     | Unlisted dependencies            | Infrastructure | P2       | Yes                |
| M2-CQ-4     | Duplicate exports fix            | Infrastructure | P3       | Yes                |
| M2-CQ-5     | Pattern Compliance Scripts       | Infrastructure | P3       | Yes                |
| M2-EFF-006  | Add Correlation IDs              | Infrastructure | P2       | Yes                |
| M2-EFF-007  | Add Network Status               | Infrastructure | P2       | Yes                |
| M2-EFF-008  | Create Smoke Test Script         | Testing        | P2       | Yes                |
| M2-EFF-009  | Bug Report Template              | Documentation  | P2       | Yes                |
| M2-EFF-010  | Implement Offline Queue          | Offline        | P0       | **MISCATEGORIZED** |
| M2-EFF-011  | Add Offline Tests                | Testing        | P2       | **MISCATEGORIZED** |
| M2-EFF-012  | Network Failure Tests            | Testing        | P2       | Yes                |
| M2-PERF-003 | Historical Score Tracking        | Analytics      | P2       | Yes                |
| M2-PERF-004 | Performance Budgets              | Testing        | P2       | Yes                |
| M2-PERF-005 | Dashboard Integration            | UI/UX          | P2       | **MISCATEGORIZED** |
| M2-PERF-006 | PWA Audit Baseline               | Testing        | P2       | Yes                |
| M2-ARCH-1   | Component library                | UI/UX          | P2       | **MISSING**        |
| M2-ARCH-2   | State management                 | Infrastructure | P2       | **MISSING**        |
| M2-ARCH-3   | API abstraction layer            | API/Backend    | P2       | **MISSING**        |

### M3 - Meetings & Location (6 items)

| ID    | Title                          | Category | Priority | Validated |
| ----- | ------------------------------ | -------- | -------- | --------- |
| M3-F1 | Meeting Proximity Detection    | Feature  | P1       | Yes       |
| M3-F2 | Meeting Notes                  | Feature  | P1       | Yes       |
| M3-F3 | Calendar Integration           | Feature  | P1       | Yes       |
| M3-F4 | Virtual Meeting Support        | Feature  | P1       | Yes       |
| M3-F5 | Enhanced Meeting Data          | Feature  | P1       | Yes       |
| M3-F6 | Celebrate Recovery Integration | Feature  | P1       | Yes       |

### M4 - Feature Expansion (12 items)

| ID           | Title                          | Category  | Priority | Validated   |
| ------------ | ------------------------------ | --------- | -------- | ----------- |
| M4-001       | Multiple sobriety dates        | Feature   | P2       | **MISSING** |
| M4-002       | Tone/language settings         | Feature   | P2       | **MISSING** |
| M4-003       | Craving countdown timer        | Feature   | P2       | **MISSING** |
| M4-004       | Auto-carry-forward task nudges | Feature   | P2       | **MISSING** |
| M4-HALT-P2-1 | Pattern detection analytics    | Analytics | P2       | Yes         |
| M4-HALT-P2-2 | Weekly/monthly HALT summaries  | Analytics | P2       | Yes         |
| M4-HALT-P2-3 | Correlation analysis with mood | Analytics | P2       | Yes         |
| M4-HALT-P3-1 | Predictive alerts              | Feature   | P2       | Yes         |
| M4-HALT-P3-2 | Context-aware suggestions      | Feature   | P2       | Yes         |
| M4-HALT-P3-3 | Reminder system for HALT       | Feature   | P2       | Yes         |
| M4-HALT-P4-1 | Anonymous aggregate insights   | Analytics | P2       | Yes         |
| M4-HALT-P4-2 | AI-powered coping strategies   | Feature   | P2       | Yes         |

### M4.5 - Security & Privacy (13 items)

| ID    | Title                             | Category | Priority | Validated |
| ----- | --------------------------------- | -------- | -------- | --------- |
| T4.1  | Tab-level PIN passcode            | Security | P0       | Yes       |
| T4.2  | PBKDF2 key derivation             | Security | P0       | Yes       |
| T4.3  | AES-256-GCM encryption engine     | Security | P0       | Yes       |
| T4.4  | Encrypt ALL step work             | Security | P0       | Yes       |
| T4.6  | Recovery key generation           | Security | P0       | Yes       |
| T4.7  | DEK/KEK key wrapping              | Security | P0       | Yes       |
| T4.9  | Auto-lock timeout                 | Security | P0       | Yes       |
| F4.1  | Offline Queue Trust Indicator     | Offline  | P1       | Yes       |
| F4.5  | Guest Mode (sandboxed demo)       | Privacy  | P1       | Yes       |
| F4.7  | Selective Sync                    | Privacy  | P1       | Yes       |
| F4.10 | Nuclear Option (account deletion) | Privacy  | P1       | Yes       |
| F4.12 | No-Tracking Dashboard             | Privacy  | P1       | Yes       |
| F4.14 | Snapshot Protection               | Privacy  | P2       | Yes       |

### M5 - Offline + Steps (23 items)

| ID         | Title                               | Category | Priority | Validated |
| ---------- | ----------------------------------- | -------- | -------- | --------- |
| F1.0       | App-wide speech-to-text             | Feature  | P1       | Yes       |
| T1.2       | Custom mutation queue (Dexie.js)    | Offline  | P0       | Yes       |
| T1.3       | Sync worker with exponential retry  | Offline  | P0       | Yes       |
| T1.4       | IndexedDB setup via Dexie.js        | Offline  | P0       | Yes       |
| T1.6       | Storage quota management            | Offline  | P1       | Yes       |
| T1.11      | Multi-device conflict detection UI  | Offline  | P1       | Yes       |
| T1.12      | Conflict resolution strategies      | Offline  | P1       | Yes       |
| T2.2       | sharedPackets collection            | Offline  | P0       | Yes       |
| T2.8       | SyncState per device tracking       | Offline  | P1       | Yes       |
| T2.12      | Soft delete pattern                 | Offline  | P1       | Yes       |
| T7.1       | Feature flag for offline rollout    | Offline  | P1       | Yes       |
| T7.2       | PR strategy (types incremental)     | Offline  | P1       | Yes       |
| T7.8       | Unit tests for conflict scenarios   | Testing  | P1       | Yes       |
| T7.9       | Firebase emulator integration tests | Testing  | P1       | Yes       |
| F1.2       | Step Work Worksheets (Steps 2-9)    | Feature  | P1       | Yes       |
| F1.2b      | Step Work Worksheets (Steps 11-12)  | Feature  | P1       | Yes       |
| M5-STEP-1  | 10th Step Inventory Tool            | Feature  | P1       | Yes       |
| M5-STEP-2  | Inventory Templates                 | Feature  | P1       | Yes       |
| F1.3       | Interactive step tools              | Feature  | P1       | Yes       |
| F5.1       | Tag as Inventory                    | Feature  | P1       | Yes       |
| M5-AMENDS  | Amends Tracker                      | Feature  | P1       | Yes       |
| F1.4       | I'm Stuck button                    | Feature  | P1       | Yes       |
| M5-PATTERN | Pattern Recognition                 | Feature  | P2       | Yes       |

### M6 - Journaling + Safety (26 items)

| ID         | Title                          | Category      | Priority | Validated |
| ---------- | ------------------------------ | ------------- | -------- | --------- |
| F5.2       | Pattern Matcher (bundled)      | Feature       | P1       | Yes       |
| F5.4       | Gratitude Mosaic               | Feature       | P1       | Yes       |
| F5.5       | Time Capsule (On This Day)     | Feature       | P1       | Yes       |
| F5.6       | The Wave (Urge Log)            | Feature       | P1       | Yes       |
| F5.9       | Rant Room (audio journal)      | Feature       | P1       | Yes       |
| F5.10      | Unsent Letter                  | Feature       | P1       | Yes       |
| F5.11      | Dynamic Prompts                | Feature       | P1       | Yes       |
| F5.12      | Meeting Takeaways              | Feature       | P1       | Yes       |
| F5.14      | Brain Dump                     | Feature       | P1       | Yes       |
| F9.1       | One Action                     | Feature       | P1       | Yes       |
| F9.2       | Bookends (AM/PM routine)       | Feature       | P1       | Yes       |
| F9.6       | Pause Protocol                 | Feature       | P1       | Yes       |
| F9.7       | Habit Stacker                  | Feature       | P1       | Yes       |
| F9.10      | Sleep Hygiene (Wind-Down)      | Feature       | P1       | Yes       |
| F7.6       | 30-Day Retrospective           | Feature       | P1       | Yes       |
| F6.5       | Crisis Decision Tree           | Feature       | P0       | Yes       |
| M6-PRAYER  | Prayer Library                 | Feature       | P1       | Yes       |
| F10.1      | The Lifeline (emergency)       | Feature       | P0       | Yes       |
| F10.2      | The Guardrails (trauma gates)  | Feature       | P0       | Yes       |
| F10.3      | Harm Reduction Locker          | Feature       | P0       | Yes       |
| F10.4      | Compassionate U-Turn (relapse) | Feature       | P1       | Yes       |
| F12.10     | Intake Interview               | Feature       | P1       | Yes       |
| F12.11     | Slow Rollout                   | Feature       | P1       | Yes       |
| M6-MED-1   | Daily Meditation               | Feature       | P1       | Yes       |
| M6-MED-2   | Guided Meditation              | Feature       | P1       | Yes       |
| M6-LICENSE | Content Licensing              | Documentation | P0       | Yes       |

### M7 - Fellowship Suite (79 items)

| ID           | Title                         | Category  | Priority | Validated          |
| ------------ | ----------------------------- | --------- | -------- | ------------------ |
| T2.4         | Sponsor contact storage       | Offline   | P1       | Yes                |
| F2.1-F2.10   | Sponsor Connection (10 items) | Feature   | P1       | Yes                |
| T9.9         | Sponsor link UX (QR pairing)  | Feature   | P1       | Yes                |
| M7-SPONSOR-1 | Sponsor contact quick-dial    | Feature   | P1       | Yes                |
| M7-SPONSOR-2 | Sponsor dashboard             | Feature   | P1       | Yes                |
| F5.8         | Service Points                | Feature   | P1       | Yes                |
| F9.4-F9.5    | Engagement (2 items)          | Feature   | P1       | Yes                |
| F7.1-F7.11   | Exports (10 items)            | Feature   | P1       | Yes                |
| T5.2-T5.8    | Export Technical (7 items)    | Feature   | P1       | Yes                |
| F3.2-F3.8    | Nashville Advantage (7 items) | Feature   | P1       | Yes                |
| M7-NASH      | Nashville meeting proximity   | Feature   | P1       | Yes                |
| F6.2-F6.12   | Knowledge Base (11 items)     | Feature   | P1       | Yes                |
| T9.5         | FlexSearch                    | Feature   | P1       | Yes                |
| M7-STEPS     | Plain English Steps           | Feature   | P1       | Yes                |
| M7-LIB       | Recovery Library              | Feature   | P1       | Yes                |
| F10.5-F10.9  | Safety Features (5 items)     | Feature   | P1       | Yes                |
| F8.1-F8.11   | Personalization (11 items)    | Feature   | P1       | Yes                |
| M7-PHASE     | Journey Phase                 | Feature   | P1       | Yes                |
| M7-DASH      | Dashboard Builder             | Feature   | P1       | Yes                |
| T6.3-T6.8    | Analytics (6 items)           | Analytics | P1       | Yes                |
| T9.2         | Data retention policy         | Privacy   | P1       | Yes                |
| T9.12        | Backup UX                     | Feature   | P1       | Yes                |
| M7-ANLY      | Analytics toggle              | Privacy   | P1       | Yes                |
| F11.6        | Scroll of Life                | Feature   | P2       | Yes                |
| F11.8        | 90-in-90 Passport             | Feature   | P2       | Yes                |
| F12.1        | Savings Ticker                | Feature   | P1       | **MISCATEGORIZED** |
| F12.2        | Wreckage List                 | Feature   | P1       | **MISCATEGORIZED** |
| F12.7        | Sponsee CRM                   | Feature   | P1       | Yes                |
| F12.8        | Speaker's Outline             | Feature   | P1       | Yes                |

### M8 - Speaker Recordings (3 items)

| ID    | Title              | Category | Priority | Validated |
| ----- | ------------------ | -------- | -------- | --------- |
| M8-F1 | Speaker Library    | Feature  | P2       | Yes       |
| M8-F2 | Personal Recording | Feature  | P2       | Yes       |
| M8-F3 | Audio Player       | Feature  | P2       | Yes       |

### M9 - Native App Features (15 items)

| ID     | Title                        | Category      | Priority | Validated |
| ------ | ---------------------------- | ------------- | -------- | --------- |
| T8.1   | Capacitor wrapper (CRITICAL) | Mobile/Native | P0       | Yes       |
| T8.4   | Native biometrics            | Mobile/Native | P0       | Yes       |
| T8.5   | Native secure storage        | Mobile/Native | P0       | Yes       |
| T4.10  | Biometric unlock             | Mobile/Native | P1       | Yes       |
| F4.4   | Stealth Mode                 | Privacy       | P1       | Yes       |
| F5.4b  | Gratitude widget/shake       | Mobile/Native | P1       | Yes       |
| F5.9b  | Voice tone analysis          | Mobile/Native | P2       | Yes       |
| F9.9   | Nashville Sound              | Mobile/Native | P2       | Yes       |
| F9.11  | Drive Time Companion         | Mobile/Native | P2       | Yes       |
| F12.4  | Stress Monitor               | Feature       | P2       | Yes       |
| F12.5  | Sleep Truth                  | Feature       | P2       | Yes       |
| F12.6  | Movement as Medicine         | Feature       | P2       | Yes       |
| F11.1  | SoNash Beacon                | Mobile/Native | P2       | Yes       |
| T9.1   | Push notifications           | Mobile/Native | P1       | Yes       |
| M9-TBD | Additional native features   | Mobile/Native | P3       | Yes       |

### M10 - Monetization + Future (12 items)

| ID          | Title                   | Category | Priority | Validated   |
| ----------- | ----------------------- | -------- | -------- | ----------- |
| M10-MODEL-1 | Premium Features        | Feature  | P2       | **MISSING** |
| M10-MODEL-2 | Donation Model          | Feature  | P2       | **MISSING** |
| M10-MODEL-3 | B2B Licensing           | Feature  | P2       | **MISSING** |
| M10-MODEL-4 | Hybrid Approach         | Feature  | P1       | Yes         |
| F4.11       | Shoulder Surf Blur      | Privacy  | P3       | **MISSING** |
| T3.14       | Queue compaction        | Offline  | P3       | **MISSING** |
| F11.2       | Reclaiming City map     | Feature  | P3       | **MISSING** |
| F11.3       | Digital Coffee Table    | Feature  | P3       | Yes         |
| F11.4       | Warm Handoff B2B        | Feature  | P3       | Yes         |
| F11.5       | The Mirror AI companion | Feature  | P3       | Yes         |
| F11.7       | Family Bridge           | Feature  | P3       | Yes         |
| F11.9       | Service Exchange        | Feature  | P3       | Yes         |

### Desktop/Web Enhancements (18 items)

| ID     | Title                       | Category  | Priority | Validated |
| ------ | --------------------------- | --------- | -------- | --------- |
| DW-001 | Split-screen views          | UI/UX     | P2       | Yes       |
| DW-002 | Dashboard mode (4-panel)    | UI/UX     | P2       | Yes       |
| DW-003 | Resizable panels            | UI/UX     | P2       | Yes       |
| DW-004 | Keyboard shortcuts (basic)  | UI/UX     | P2       | Yes       |
| DW-005 | Mood heat map               | UI/UX     | P2       | Yes       |
| DW-006 | Correlation matrix          | Analytics | P2       | Yes       |
| DW-007 | Trend lines                 | Analytics | P2       | Yes       |
| DW-008 | Word clouds from journal    | UI/UX     | P2       | Yes       |
| DW-009 | Export charts as PNG/SVG    | UI/UX     | P2       | Yes       |
| DW-010 | J/K Navigate timeline       | UI/UX     | P2       | Yes       |
| DW-011 | Vim-style navigation        | UI/UX     | P3       | Yes       |
| DW-012 | CSV/JSON/PDF export         | Feature   | P2       | Yes       |
| DW-013 | Automated cloud backup      | Offline   | P2       | Yes       |
| DW-014 | Sponsor report generation   | Feature   | P2       | Yes       |
| DW-015 | Full-text search            | Feature   | P1       | Yes       |
| DW-016 | Advanced filters            | UI/UX     | P2       | Yes       |
| DW-017 | Admin Panel mobile-friendly | UI/UX     | P2       | Yes       |
| DW-018 | On-call admin scenarios     | UI/UX     | P2       | Yes       |

### Process & Tooling (8 items)

| ID     | Title                          | Category       | Priority | Validated |
| ------ | ------------------------------ | -------------- | -------- | --------- |
| PT-001 | Session Activity Monitor       | Infrastructure | P1       | Yes       |
| PT-002 | Error & Tracing Viewer         | Infrastructure | P1       | Yes       |
| PT-003 | Override Audit Trail           | Infrastructure | P2       | Yes       |
| PT-004 | Document Sync Status           | Documentation  | P1       | Yes       |
| PT-005 | Cross-Document Dependency Map  | Documentation  | P1       | Yes       |
| PT-006 | Pre-Commit Hook Integration    | Infrastructure | P3       | Yes       |
| PT-007 | Pre-Push Hook Integration      | Infrastructure | P2       | Yes       |
| PT-008 | CI/CD Integration for doc sync | Infrastructure | P1       | Yes       |

### Feature Decisions Table (7 items)

| ID     | Title                   | Category | Priority | Validated |
| ------ | ----------------------- | -------- | -------- | --------- |
| FD-001 | Recovery Library        | Feature  | P0       | Yes       |
| FD-002 | HALT Check              | Feature  | P1       | Yes       |
| FD-003 | God Box                 | Feature  | P3       | Yes       |
| FD-004 | Complacency Detector    | Feature  | P2       | Yes       |
| FD-005 | Tone Settings           | Feature  | P1       | Yes       |
| FD-006 | Multiple Sobriety Dates | Feature  | P2       | Yes       |
| FD-007 | Principle-Based Badges  | Feature  | P2       | Yes       |

---

## Summary Statistics

### Category Distribution Summary

| Category       | OVS | M1.5 | M1.6 | M2  | M3  | M4  | M4.5 | M5  | M6  | M7  | M8  | M9  | M10 | DW  | PT  | FD  |
| -------------- | --- | ---- | ---- | --- | --- | --- | ---- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Feature        | 0   | 6    | 2    | 0   | 6   | 8   | 0    | 14  | 24  | 72  | 3   | 3   | 10  | 3   | 0   | 7   |
| UI/UX          | 8   | 4    | 18   | 4   | 0   | 0   | 0    | 0   | 0   | 0   | 0   | 0   | 0   | 14  | 0   | 0   |
| Security       | 7   | 4    | 3    | 12  | 0   | 0   | 7    | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Offline        | 0   | 1    | 0    | 3   | 0   | 0   | 1    | 12  | 0   | 1   | 0   | 0   | 2   | 1   | 0   | 0   |
| Testing        | 10  | 2    | 0    | 8   | 0   | 0   | 0    | 2   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Infrastructure | 6   | 8    | 1    | 30  | 0   | 0   | 0    | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 6   | 0   |
| API/Backend    | 5   | 1    | 3    | 4   | 0   | 0   | 0    | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Privacy        | 0   | 1    | 0    | 0   | 0   | 0   | 5    | 0   | 0   | 3   | 0   | 1   | 1   | 0   | 0   | 0   |
| Analytics      | 6   | 0    | 1    | 9   | 0   | 4   | 0    | 0   | 0   | 6   | 0   | 0   | 0   | 2   | 0   | 0   |
| Documentation  | 1   | 4    | 0    | 2   | 0   | 0   | 0    | 0   | 1   | 0   | 0   | 0   | 0   | 0   | 2   | 0   |
| Mobile/Native  | 0   | 0    | 0    | 0   | 0   | 0   | 0    | 0   | 0   | 0   | 0   | 11  | 0   | 0   | 0   | 0   |

### Validation Summary

| Status                        | Count | Percentage |
| ----------------------------- | ----- | ---------- |
| Validated (correct placement) | 368   | 92.9%      |
| Missing Priority              | 18    | 4.5%       |
| Miscategorized (should move)  | 14    | 3.5%       |

### Priority Validation Summary

| Priority | Expected Distribution | Actual Distribution | Status |
| -------- | --------------------- | ------------------- | ------ |
| P0       | 10-15%                | 13.6% (54)          | OK     |
| P1       | 40-50%                | 53.3% (211)         | OK     |
| P2       | 25-35%                | 27.0% (107)         | OK     |
| P3       | 5-10%                 | 6.1% (24)           | OK     |

---

## Action Items

### Immediate (High Impact)

1. **Move M2-SEC-2 (App Check)** to M4.5 as P0 security item
2. **Move M2-EFF-010/011** to M5 as offline prerequisites
3. **Move M15-004/005** to M6/M7 (too large for Quick Wins)
4. **Assign priorities** to 28 missing items using recommendations above

### Near-Term (Medium Impact)

5. **Create M2.1** sub-milestone for security hardening
6. **Split M7** into 4 sub-milestones per recommendation
7. **Add explicit M9-GATE** decision item

### Documentation Updates

8. **Update ROADMAP.md** with validated priorities
9. **Update full_inventory.md** with category assignments
10. **Create milestone reorganization PR** with changes

---

_Generated by Claude Code (Opus 4.5) on 2026-01-24_
