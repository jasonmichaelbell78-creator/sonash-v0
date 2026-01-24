# SoNash ROADMAP Deduplication Analysis

**Generated:** 2026-01-24 **Source:** full_inventory.csv (396 items)
**Analyst:** Claude Code

---

## Executive Summary

| Metric                    | Count       | Notes                                |
| ------------------------- | ----------- | ------------------------------------ |
| **Total Items Analyzed**  | 396         | Full ROADMAP inventory               |
| **Exact/Near Duplicates** | 8 pairs     | Same functionality, different IDs    |
| **Significant Overlaps**  | 23 pairs    | Partially overlapping scope          |
| **Items to Merge**        | 14 groups   | Should be consolidated               |
| **Conflicts**             | 3 pairs     | Potentially contradictory approaches |
| **Estimated Reduction**   | 35-45 items | ~9-11% reduction possible            |

### Key Findings

1. **Sponsor Features** are fragmented across M1.5, M1.6, M7 - 12 related items
   should consolidate to 5-6
2. **Analytics/Monitoring** duplicated between OV, M2, M7 - 11 items should
   consolidate to 6-7
3. **Export functionality** scattered across M7-F4 and Desktop/Web - 14 items
   should consolidate to 9-10
4. **User Analytics Tab** appears 3 times with different IDs
5. **Offline Queue** appears in both M2 and M5 with different scope

---

## Section 1: Exact/Near Duplicates (SKIP or MERGE)

These items describe the same functionality with different IDs.

| Item A                                        | Item B                                   | Similarity | Recommendation                          |
| --------------------------------------------- | ---------------------------------------- | ---------- | --------------------------------------- |
| OV-A19 (User Analytics Tab)                   | OV-C1 (User Analytics Tab - Admin Panel) | 95%        | **SKIP** OV-C1 - exact duplicate        |
| OV-A21 (Sentry Error to User Correlation)     | M16-P4-5 (User ID correlation)           | 90%        | **SKIP** M16-P4-5 - same feature        |
| OV-A22 (GCP Cloud Logging Query Builder)      | OV-FE-2 (Query GCP Cloud Logging API)    | 85%        | **MERGE** - combine scope               |
| M15-005 (Sponsor Personalization System)      | M7-PHASE (Journey Phase)                 | 80%        | **MERGE** - overlapping personalization |
| M15-006 (Stage-of-Recovery Selector)          | M7-PHASE (Journey Phase)                 | 85%        | **MERGE** - both track recovery stage   |
| M4-001 (Multiple sobriety dates)              | FD-006 (Multiple Sobriety Dates)         | 100%       | **SKIP** FD-006 - decision tracker only |
| M4-002 (Tone/language settings)               | FD-005 (Tone Settings)                   | 100%       | **SKIP** FD-005 - decision tracker only |
| M2-EFF-010 (Implement Offline Queue CRITICAL) | T1.2 (Custom mutation queue Dexie.js)    | 85%        | **MERGE** - same offline queue system   |

---

## Section 2: Significant Overlaps by Domain

### 2.1 Sponsor Features (High Risk Area)

**Current State:** 12+ items across 4 milestones

| ID           | Milestone   | Title                                   | Overlap With           |
| ------------ | ----------- | --------------------------------------- | ---------------------- |
| M15-005      | M1.5        | Sponsor Personalization System          | M7-PHASE, M7-SPONSOR-2 |
| M16-P6-4     | M1.6        | Custom phone numbers (sponsor, support) | T2.4, M7-SPONSOR-1     |
| T2.4         | M7          | Sponsor contact storage                 | M16-P6-4, M7-SPONSOR-1 |
| F2.1         | M7          | Sponsor Export + Redaction              | T5.6, DW-014           |
| T5.6         | M7          | Sponsor packet builder UI               | F2.1, F7.2             |
| T9.9         | M7          | Sponsor link UX (QR pairing)            | F2.5                   |
| M7-SPONSOR-1 | M7          | Sponsor contact quick-dial              | T2.4, M16-P6-4         |
| M7-SPONSOR-2 | M7          | Sponsor dashboard                       | M15-005                |
| F8.11        | M7          | Sponsor Link Status                     | T9.9                   |
| DW-014       | Desktop/Web | Sponsor report generation               | F2.1, T5.6             |

**Recommendation:** Consolidate into 5-6 coherent items:

1. **Sponsor Contact Management** (T2.4 + M16-P6-4 + M7-SPONSOR-1)
2. **Sponsor Dashboard** (M7-SPONSOR-2 + M15-005 personalization aspects)
3. **Sponsor Packet/Export** (F2.1 + T5.6 + DW-014)
4. **Sponsor Linking** (T9.9 + F8.11 + F2.5)
5. **Sponsor Tools** (F2.2, F2.4, F2.6, F2.8, F2.9, F2.10 - these are distinct)

**Estimated Reduction:** 12 items -> 6 items (50%)

---

### 2.2 Privacy/Security Features (High Risk Area)

**Current State:** 20+ items across M1.5, M4.5, M7, M9

| ID             | Milestone | Title                                | Overlap With                 |
| -------------- | --------- | ------------------------------------ | ---------------------------- |
| M15-CANON-0107 | M1.5      | Missing security headers             | M2-SEC-2 (App Check)         |
| M15-CANON-0108 | M1.5      | No Firebase Storage rules            | OV-FE-3                      |
| OV-FE-3        | OV        | Sensitive log persistence review     | M15-CANON-0108               |
| T4.1           | M4.5      | Tab-level PIN passcode               | T4.10 (Biometric unlock)     |
| T4.10          | M9        | Biometric unlock                     | T4.1, T8.4                   |
| T8.4           | M9        | Native biometrics (Face ID/Touch ID) | T4.10                        |
| T8.5           | M9        | Native secure storage                | T4.7 (DEK/KEK)               |
| F4.4           | M9        | Stealth Mode                         | M15-011 (Disguised App Icon) |
| M15-011        | M1.5      | Disguised App Icon + Name            | F4.4                         |
| F4.10          | M4.5      | Nuclear Option (account deletion)    | OV-A25 (Soft-Delete)         |
| F4.14          | M4.5      | Snapshot Protection                  | F4.4 (Stealth Mode)          |

**Recommendation:** Consolidate:

1. **PIN/Biometric Auth** (T4.1 + T4.10 + T8.4) - single auth system
2. **Secure Storage** (T8.5 + T4.7) - single storage architecture
3. **Stealth/Disguise** (F4.4 + M15-011 + F4.14) - single privacy UI
4. **Account Deletion** (F4.10 + OV-A25) - already related, link them
5. **Security Rules** (M15-CANON-0107 + M15-CANON-0108 + OV-FE-3) - single
   security audit

**Estimated Reduction:** 11 items -> 7 items (36%)

---

### 2.3 Analytics/Monitoring Features

**Current State:** 15+ items across OV, M2, M7, Process

| ID        | Milestone | Title                                    | Overlap With             |
| --------- | --------- | ---------------------------------------- | ------------------------ |
| OV-A12    | OV        | Generate Usage Analytics job             | M2-MON-2                 |
| OV-A19    | OV        | User Analytics Tab                       | OV-C1, M2-MON-2          |
| OV-C1     | OV        | User Analytics Tab - Admin Panel         | OV-A19                   |
| M2-MON-1  | M2        | Performance monitoring                   | M2-DD-6 (API Latency)    |
| M2-MON-2  | M2        | User analytics baseline (DAU, retention) | OV-A19, T6.8             |
| M2-DD-6   | M2        | API Latency Metrics                      | M2-MON-1                 |
| M2-DD-4   | M2        | Test Coverage Dashboard                  | OV-B5                    |
| M2-TOOL-9 | M2        | Automated Metrics Dashboard              | M2-DD-1 through M2-DD-10 |
| T6.3      | M7        | Action event taxonomy                    | M2-MON-2                 |
| T6.8      | M7        | 90-day retention                         | M2-MON-2                 |
| M7-ANLY   | M7        | Analytics toggle                         | F4.12 (No-Tracking)      |
| PT-001    | Process   | Session Activity Monitor                 | M2-DD-2                  |
| PT-002    | Process   | Error & Tracing Viewer                   | OV-A3, M2-INC-P1-3       |
| PT-004    | Process   | Document Sync Status                     | OV-B4                    |

**Recommendation:** Consolidate:

1. **User Analytics Tab** (OV-A19 + OV-C1) - eliminate OV-C1
2. **Performance Monitoring** (M2-MON-1 + M2-DD-6) - single perf dashboard
3. **Usage Analytics** (OV-A12 + M2-MON-2 + T6.3 + T6.8) - unified analytics
4. **Dev Dashboard** (M2-TOOL-9 should encompass M2-DD-\* items)
5. **Process Tooling** (PT-001, PT-002, PT-004 overlap with OV-B\* items)

**Estimated Reduction:** 14 items -> 8 items (43%)

---

### 2.4 Journaling/Step Work Features

**Current State:** 17+ items in M5-F2, M5-F3, M6-F1

| ID           | Milestone | Title                              | Overlap With            |
| ------------ | --------- | ---------------------------------- | ----------------------- |
| F5.2         | M6        | Pattern Matcher (bundled)          | M5-PATTERN              |
| M5-PATTERN   | M5        | Pattern Recognition                | F5.2, M4-HALT-P2-1      |
| M4-HALT-P2-1 | M4        | Pattern detection analytics        | M5-PATTERN, F5.2        |
| F5.12        | M6        | Meeting Takeaways                  | M3-F2 (Meeting Notes)   |
| M3-F2        | M3        | Meeting Notes                      | F5.12                   |
| F1.2         | M5        | Step Work Worksheets (Steps 2-9)   | F1.3, F1.2b             |
| F1.2b        | M5        | Step Work Worksheets (Steps 11-12) | F1.2                    |
| M5-STEP-1    | M5        | 10th Step Inventory Tool           | F5.1 (Tag as Inventory) |
| M5-STEP-2    | M5        | Inventory Templates                | M5-STEP-1               |
| M5-AMENDS    | M5        | Amends Tracker                     | F7.8 (Amends Ledger)    |
| F7.8         | M7        | Amends Ledger                      | M5-AMENDS               |

**Recommendation:** Consolidate:

1. **Pattern Recognition** (F5.2 + M5-PATTERN + M4-HALT-P2-1) - single pattern
   system
2. **Meeting Notes** (M3-F2 + F5.12) - link as related
3. **Step Worksheets** (F1.2 + F1.2b) - should be single item
4. **Inventory Tools** (M5-STEP-1 + M5-STEP-2 + F5.1) - single inventory system
5. **Amends** (M5-AMENDS + F7.8) - single amends feature

**Estimated Reduction:** 11 items -> 6 items (45%)

---

### 2.5 Export Features

**Current State:** 14+ items in M7-F4 and Desktop/Web

| ID     | Milestone   | Title                     | Overlap With                  |
| ------ | ----------- | ------------------------- | ----------------------------- |
| F7.1   | M7          | Recovery Resume           | F7.5 (Full Archive)           |
| F7.2   | M7          | Step Packets              | T5.6 (Sponsor packet builder) |
| F7.5   | M7          | Full Archive              | DW-012 (CSV/JSON/PDF)         |
| F7.7   | M7          | Clinical Hand-Off         | F7.5                          |
| T5.2   | M7          | Client-side only PDF      | DW-012                        |
| T5.6   | M7          | Sponsor packet builder UI | F2.1, F7.2                    |
| T5.8   | M7          | Web Share API             | DW-009                        |
| DW-009 | Desktop/Web | Export charts as PNG/SVG  | T5.8                          |
| DW-012 | Desktop/Web | CSV/JSON/PDF export       | F7.5, T5.2                    |
| DW-013 | Desktop/Web | Automated cloud backup    | T9.12 (Backup UX)             |
| DW-014 | Desktop/Web | Sponsor report generation | F2.1, T5.6                    |
| T9.12  | M7          | Backup UX                 | DW-013                        |

**Recommendation:** Consolidate:

1. **PDF Generation** (T5.2 + DW-012 PDF portion) - single PDF engine
2. **Archive/Backup** (F7.5 + DW-012 + DW-013 + T9.12) - single backup system
3. **Sponsor Exports** (F2.1 + T5.6 + F7.2 + DW-014) - already noted above
4. **Share Features** (T5.8 + DW-009) - single share system

**Estimated Reduction:** 12 items -> 7 items (42%)

---

### 2.6 Meeting/Location Features

**Current State:** 10+ items in M3, M7-F5

| ID        | Milestone | Title                        | Overlap With             |
| --------- | --------- | ---------------------------- | ------------------------ |
| M3-F1     | M3        | Meeting Proximity Detection  | M7-NASH                  |
| M7-NASH   | M7        | Nashville meeting proximity  | M3-F1, F3.2              |
| M3-F2     | M3        | Meeting Notes                | F5.12                    |
| F3.2      | M7        | Safe Spaces Map              | M16-P55-4 (Map view)     |
| M16-P55-4 | M1.6      | Map view with Nearby feature | F3.2, M7-NASH            |
| F3.4      | M7        | Meeting After Meeting        | M3-F5 (Enhanced Meeting) |
| F6.7      | M7        | Anatomy of a Meeting         | M3-F6 (CR Integration)   |

**Recommendation:** Consolidate:

1. **Meeting Proximity/Maps** (M3-F1 + M7-NASH + M16-P55-4 + F3.2) - single map
   system
2. **Meeting Notes** (M3-F2 + F5.12) - link as related features
3. Keep M3 items as the primary meeting milestone

**Estimated Reduction:** 7 items -> 4 items (43%)

---

### 2.7 Offline/Sync Features

**Current State:** 10+ items in M2, M5

| ID         | Milestone | Title                               | Overlap With     |
| ---------- | --------- | ----------------------------------- | ---------------- |
| M2-EFF-010 | M2        | Implement Offline Queue (CRITICAL)  | T1.2             |
| M2-EFF-011 | M2        | Add Offline Tests                   | T7.8, T7.9       |
| T1.2       | M5        | Custom mutation queue (Dexie.js)    | M2-EFF-010       |
| T1.3       | M5        | Sync worker with exponential retry  | M2-EFF-010       |
| T1.4       | M5        | IndexedDB setup via Dexie.js        | T1.2             |
| T7.8       | M5        | Unit tests for conflict scenarios   | M2-EFF-011       |
| T7.9       | M5        | Firebase emulator integration tests | M2-EFF-011       |
| F4.1       | M4.5      | Offline Queue Trust Indicator       | T1.2, M2-EFF-010 |

**Recommendation:**

- M2-EFF-010 and M2-EFF-011 should reference M5 items, not duplicate them
- F4.1 is a UI feature for T1.2 - link them
- Consolidate test items (M2-EFF-011 + T7.8 + T7.9)

**Estimated Reduction:** 8 items -> 5 items (38%)

---

## Section 3: Conflict Analysis

### 3.1 Offline Queue Architecture Conflict

| Item       | Approach                                                          |
| ---------- | ----------------------------------------------------------------- |
| M2-EFF-010 | "Implement Offline Queue (CRITICAL)" - implies new implementation |
| T1.2       | "Custom mutation queue (Dexie.js)" - specifies Dexie.js           |

**Resolution:** T1.2 is the implementation spec for M2-EFF-010. Make M2-EFF-010
reference T1.2 rather than being a separate item.

### 3.2 Authentication Approach Conflict

| Item  | Approach                                |
| ----- | --------------------------------------- |
| T4.1  | Tab-level PIN passcode (web-compatible) |
| T4.10 | Biometric unlock (native-only)          |
| T8.4  | Native biometrics (Capacitor)           |

**Resolution:** These are complementary, not conflicting. PIN is for web,
biometrics for native. However, they should be designed together. Create unified
auth strategy item that encompasses all three.

### 3.3 Monitoring Dashboard Conflict

| Item                | Approach                           |
| ------------------- | ---------------------------------- |
| M2-TOOL-9           | Automated Metrics Dashboard        |
| M2-DD-1 to M2-DD-10 | Individual dashboard tabs/features |
| OV-B1 to OV-B11     | Dev Dashboard items                |

**Resolution:** M2-TOOL-9 appears to be a parent item for M2-DD-\* items. OV-B
items are a separate "Dev Dashboard" concept. Clarify whether these are the same
dashboard or different ones. If same, consolidate. If different, clarify naming.

---

## Section 4: Recommended Cleanup Actions

### Priority 1: High Impact, Low Effort

| Action                                                   | Items Affected | Effort | Impact                      |
| -------------------------------------------------------- | -------------- | ------ | --------------------------- |
| **Remove OV-C1** (duplicate of OV-A19)                   | 1              | E0     | Eliminate confusion         |
| **Remove FD-005, FD-006** (duplicates of M4-001, M4-002) | 2              | E0     | Clean feature decisions     |
| **Merge M2-EFF-010 into T1.2**                           | 2              | E0     | Clarify offline ownership   |
| **Link F5.12 to M3-F2**                                  | 2              | E0     | Meeting notes relationship  |
| **Link M5-AMENDS to F7.8**                               | 2              | E0     | Amends feature relationship |

### Priority 2: Medium Impact, Medium Effort

| Action                              | Items Affected | Effort | Impact                      |
| ----------------------------------- | -------------- | ------ | --------------------------- |
| **Consolidate Sponsor items**       | 12             | E1     | Major clarity improvement   |
| **Consolidate Analytics items**     | 14             | E1     | Reduce monitoring confusion |
| **Consolidate Pattern Recognition** | 3              | E1     | Single pattern system       |
| **Consolidate Step Worksheets**     | 3              | E1     | Single worksheet feature    |

### Priority 3: Strategic Restructuring

| Action                                 | Items Affected | Effort | Impact                    |
| -------------------------------------- | -------------- | ------ | ------------------------- |
| **Create unified Export architecture** | 14             | E2     | Clear export strategy     |
| **Create unified Auth architecture**   | 5              | E2     | Clear auth strategy       |
| **Consolidate Map/Location features**  | 7              | E2     | Clear location strategy   |
| **Merge Dev Dashboard concepts**       | 15             | E2     | Single dev tooling vision |

---

## Section 5: Items Confirmed as Distinct (KEEP BOTH)

These items may appear similar but serve different purposes:

| Item A                      | Item B                         | Why Keep Both                |
| --------------------------- | ------------------------------ | ---------------------------- |
| F5.4 (Gratitude Mosaic)     | F5.4b (Gratitude widget/shake) | Web vs native implementation |
| F5.9 (Rant Room audio)      | F5.9b (Voice tone analysis)    | Input vs analysis feature    |
| M6-MED-1 (Daily Meditation) | M6-MED-2 (Guided Meditation)   | Different meditation types   |
| T4.3 (AES-256-GCM engine)   | T4.7 (DEK/KEK architecture)    | Engine vs key management     |
| F10.1 (Lifeline emergency)  | F6.5 (Crisis Decision Tree)    | Immediate vs guided support  |

---

## Section 6: Summary Statistics

### By Domain

| Domain                    | Original Items | After Cleanup | Reduction |
| ------------------------- | -------------- | ------------- | --------- |
| Sponsor Features          | 12             | 6             | 50%       |
| Analytics/Monitoring      | 14             | 8             | 43%       |
| Journaling/Steps          | 11             | 6             | 45%       |
| Export Features           | 12             | 7             | 42%       |
| Meeting/Location          | 7              | 4             | 43%       |
| Offline/Sync              | 8              | 5             | 38%       |
| Privacy/Security          | 11             | 7             | 36%       |
| **Totals in Focus Areas** | **75**         | **43**        | **43%**   |

### Overall Impact

| Metric                        | Value           |
| ----------------------------- | --------------- |
| Total items in focus areas    | 75              |
| Duplicates to remove          | 8               |
| Items to merge                | 24              |
| Items to link (keep separate) | 10              |
| **Net item reduction**        | **32**          |
| **Percentage reduction**      | **8.1%**        |
| **Estimated effort saved**    | **40-60 hours** |

---

## Appendix A: Full Duplicate Pair Reference

| #   | Item A ID  | Item A Title                     | Item B ID | Item B Title                     | Action        |
| --- | ---------- | -------------------------------- | --------- | -------------------------------- | ------------- |
| 1   | OV-A19     | User Analytics Tab               | OV-C1     | User Analytics Tab - Admin Panel | SKIP OV-C1    |
| 2   | OV-A21     | Sentry Error to User Correlation | M16-P4-5  | User ID correlation              | SKIP M16-P4-5 |
| 3   | OV-A22     | GCP Cloud Logging Query Builder  | OV-FE-2   | Query GCP Cloud Logging API      | MERGE         |
| 4   | M15-005    | Sponsor Personalization System   | M7-PHASE  | Journey Phase                    | MERGE         |
| 5   | M15-006    | Stage-of-Recovery Selector       | M7-PHASE  | Journey Phase                    | MERGE         |
| 6   | M4-001     | Multiple sobriety dates          | FD-006    | Multiple Sobriety Dates          | SKIP FD-006   |
| 7   | M4-002     | Tone/language settings           | FD-005    | Tone Settings                    | SKIP FD-005   |
| 8   | M2-EFF-010 | Implement Offline Queue          | T1.2      | Custom mutation queue            | MERGE         |

---

## Appendix B: Recommended ID Consolidation

After cleanup, suggested primary IDs for merged features:

| New Primary ID | Merged From                     | New Title                  |
| -------------- | ------------------------------- | -------------------------- |
| SPONSOR-001    | T2.4, M16-P6-4, M7-SPONSOR-1    | Sponsor Contact Management |
| SPONSOR-002    | M7-SPONSOR-2, M15-005           | Sponsor Dashboard          |
| SPONSOR-003    | F2.1, T5.6, DW-014              | Sponsor Packet Export      |
| ANALYTICS-001  | OV-A19                          | User Analytics Tab         |
| PATTERN-001    | F5.2, M5-PATTERN, M4-HALT-P2-1  | Pattern Recognition System |
| OFFLINE-001    | M2-EFF-010, T1.2                | Offline Queue (Dexie.js)   |
| AUTH-001       | T4.1, T4.10, T8.4               | Authentication System      |
| EXPORT-001     | T5.2, DW-012                    | PDF Export Engine          |
| BACKUP-001     | F7.5, DW-013, T9.12             | Backup & Archive System    |
| MAP-001        | M3-F1, M7-NASH, M16-P55-4, F3.2 | Meeting Map & Proximity    |

---

_Analysis completed by Claude Code on 2026-01-24_ _Next steps: Review with
product owner, implement Priority 1 changes first_
