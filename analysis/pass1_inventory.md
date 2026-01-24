# Pass 1: Structural Inventory & Baseline

**Generated:** 2026-01-24 | **Source:** ROADMAP.md +
EXPANSION_EVALUATION_TRACKER.md

---

## 1. Milestone Summary Table

| Milestone ID               | Name                  | Status                 | Item Count             | Target    | Priority   |
| -------------------------- | --------------------- | ---------------------- | ---------------------- | --------- | ---------- |
| **M0**                     | Baseline              | ✅ Complete            | Archived               | Q4 2025   | Foundation |
| **M1**                     | Foundation            | ✅ Complete            | Archived               | Q1 2026   | P0         |
| **Integrated Improvement** | Documentation         | ✅ Complete            | 9/9 steps              | Q1 2026   | Done       |
| **Operational Visibility** | Admin+Dev Dashboard   | 🔄 ACTIVE              | ~38 items              | Q1 2026   | **P0**     |
| **M1.5**                   | Quick Wins            | ⏸️ Paused              | ~19 items              | Q1 2026   | P1         |
| **M1.6**                   | Admin Panel + UX      | ⏸️ Paused              | ~15 items              | Q1 2026   | P1         |
| **M2**                     | Architecture Refactor | ⏸️ Optional            | ~60+ items             | As needed | P2         |
| **M3**                     | Meetings & Location   | 📋 Planned             | 6 features             | Q2 2026   | P1         |
| **M4**                     | Feature Expansion     | 📋 Planned             | ~8 items               | Q2 2026   | P1         |
| **M4.5**                   | Security & Privacy    | **NEW**                | 13 items               | Q2 2026   | P0         |
| **M5**                     | Offline + Steps       | 📋 Planned + Expansion | 4 existing + 19 new    | Q3 2026   | P1         |
| **M6**                     | Journaling + Safety   | 📋 Planned + Expansion | 3 existing + 23 new    | Q3 2026   | P2         |
| **M7**                     | Fellowship Suite      | 📋 Planned + Expansion | 5 existing + 75+ new   | Q4 2026   | P1         |
| **M8**                     | Speaker Recordings    | 📋 Planned             | 3 features             | Q4 2026   | P2         |
| **M9**                     | Native App Features   | **NEW**                | 12 items               | 2027      | P2         |
| **M10**                    | Monetization + Future | 🔬 Research            | 4 models + 11 deferred | 2027      | P2         |

---

## 2. Staged Items Summary (85 Items)

### By Milestone

| Milestone | Feature Groups                                | Staged Items |
| --------- | --------------------------------------------- | ------------ |
| **M4.5**  | F1 (Encryption), F2 (Privacy)                 | 13           |
| **M5**    | F0 (Input), F1 (Offline), F2-F4 (Step Work)   | 19           |
| **M6**    | F1 (Journaling), F2 (Safety), F3 (Onboarding) | 23           |
| **M7**    | F1-F11 (11 feature groups)                    | ~50          |
| **M9**    | F1 (Native Security)                          | 3 staged     |
| **Total** | **18 feature groups**                         | **~108**     |

_Note: Some items have multiple placements or dependencies_

### M4.5 Items (13)

- **M4.5-F1 Encryption (7):** T4.1-T4.4, T4.6, T4.7, T4.9
- **M4.5-F2 Privacy (6):** F4.1, F4.5, F4.7, F4.10, F4.12, F4.14

### M5 Items (19)

- **M5-F0 Input (1):** F1.0 (Speech-to-Text)
- **M5-F1 Offline (13):** T1.2-4, T1.6, T1.11-12, T2.2, T2.8, T2.12, T7.1-2,
  T7.8-9
- **M5-F2 Worksheets (2):** F1.2, F1.2b
- **M5-F3 Enhancements (2):** F1.3, F5.1
- **M5-F4 Context (1):** F1.4

### M6 Items (23)

- **M6-F1 Journaling (17):** F5.2, F5.4-6, F5.9-12, F5.14, F9.1-2, F9.6-7,
  F9.10, F7.6, F6.5
- **M6-F2 Safety (4):** F10.1-4
- **M6-F3 Onboarding (2):** F12.10-11

### M7 Items (~50)

- **M7-F1 Sponsor (12):** T2.4, F2.1-6, F2.8-10, T9.9
- **M7-F2 Service (1):** F5.8
- **M7-F3 Engagement (2):** F9.4-5
- **M7-F4 Exports (14):** F7.1-2, F7.4-5, F7.7-11, T5.2-3, T5.5-8
- **M7-F5 Nashville (8):** F3.1-8
- **M7-F6 Knowledge (13):** F6.1-4, F6.6-12, T9.5
- **M7-F7 Safety (5):** F10.5-9
- **M7-F8 Personalization (11):** F8.1-11
- **M7-F9 Analytics (7):** T6.3-5, T6.7-8, T9.2, T9.12
- **M7-F10 Visionary (2):** F11.6, F11.8
- **M7-F11 Financial (4):** F12.1-2, F12.7-8

### M9 Items (3 staged + 9 deferred)

- **M9-F1 Security (3):** T8.1, T8.4-5

---

## 3. Deferred Items Summary (23 Items)

| Milestone  | Items | Reason                                              |
| ---------- | ----- | --------------------------------------------------- |
| **M9-F1**  | 9     | Requires native app (biometric, stealth, BLE, push) |
| **M9-F2**  | 3     | Requires native health APIs (HR, sleep, movement)   |
| **M10-F1** | 11    | Future enhancements (AI, marketplace, attachments)  |

---

## 4. Merged Items Reference (27 Items)

Items merged into other features during evaluation:

| Category                            | Count | Examples                   |
| ----------------------------------- | ----- | -------------------------- |
| Schema attributes merged → T2.2     | 5     | T2.3, T2.5-7, T2.11        |
| Pattern visualization merged → F5.2 | 3     | F5.3, F5.7, F5.13          |
| Foundational decisions              | 2     | T1.1→Q7, T5.1→Q8           |
| Implementation details              | 10    | T1.5-17, T3.1-15 (various) |
| Feature consolidation               | 7     | F2.7→F7, F9.3→F5.6, etc.   |

---

## 5. Cross-Reference: Module → Milestone

### Feature Modules (F1-F12)

| Module             | Primary Milestone | Secondary    |
| ------------------ | ----------------- | ------------ |
| F1 Step Work       | M5 (F0, F2-F4)    | -            |
| F2 Sponsor         | M7-F1             | -            |
| F3 Nashville       | M7-F5             | -            |
| F4 Privacy         | M4.5-F2           | M9-F1        |
| F5 Journaling      | M6-F1             | M7-F2, M5-F3 |
| F6 Knowledge       | M7-F6             | M6-F1        |
| F7 Exports         | M7-F4             | M6-F1        |
| F8 Personalization | M7-F8             | -            |
| F9 Engagement      | M6-F1             | M7-F3, M9    |
| F10 Safety         | M6-F2             | M7-F7        |
| F11 Visionary      | M7-F10            | M9, M10      |
| F12 Final Gaps     | M6-F3, M7-F11     | M9, M10      |

### Technical Modules (T1-T9)

| Module            | Primary Milestone | Secondary |
| ----------------- | ----------------- | --------- |
| T1 Architecture   | M5-F1             | -         |
| T2 Data Model     | M5-F1             | M7-F1     |
| T3 Conflict       | M5-F1             | M10       |
| T4 Encryption     | M4.5-F1           | M9        |
| T5 Exports        | M7-F4             | -         |
| T6 Analytics      | M7-F9             | -         |
| T7 Quality        | M5-F1             | -         |
| T8 Native         | M9-F1             | M10       |
| T9 Open Questions | M7 (various)      | M9, M10   |

---

## 6. Baseline Statistics

### Existing ROADMAP Items

| Category                       | Count           |
| ------------------------------ | --------------- |
| Active Sprint (Ops Visibility) | ~38 items       |
| Paused (M1.5 + M1.6)           | ~34 items       |
| Tech Debt (M2)                 | ~60+ items      |
| Planned (M3-M8, M10)           | ~250 items      |
| **Total Existing**             | **~380+ items** |

### Expansion Evaluation Totals

| Category              | Count |
| --------------------- | ----- |
| Total Ideas Evaluated | 280   |
| Staged for ROADMAP    | 85    |
| Deferred              | 23    |
| Merged                | 27    |
| Rejected              | 5     |

### New Structure

| Change               | Description                      |
| -------------------- | -------------------------------- |
| New Milestones       | M4.5 (Security), M9 (Native)     |
| New Feature Groups   | 18 across M4.5/M5/M6/M7/M9/M10   |
| Net Items After Push | ~465+ (380 existing + 85 staged) |

---

## Critical Files

| File                                  | Purpose                      |
| ------------------------------------- | ---------------------------- |
| ROADMAP.md                            | Primary target (~380+ items) |
| docs/EXPANSION_EVALUATION_TRACKER.md  | Source of 85 staged items    |
| ROADMAP_LOG.md                        | Completed items archive      |
| docs/aggregation/MASTER_ISSUE_LIST.md | Tech debt (283 items)        |

---

**Pass 1 Status:** COMPLETE **Confidence:** HIGH **Next:** Pass 2
(Deduplication) → Pass 3 (Dependencies) → Pass 4 (Categorization)
