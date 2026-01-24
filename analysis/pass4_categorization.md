# Pass 4: Categorization & Feature Group Alignment

**Generated:** 2026-01-24 | **Status:** COMPLETE

---

## Executive Summary

This analysis reconciles the 18 new feature groups from the expansion evaluation
with the existing ROADMAP structure. Key findings:

- **Naming conflicts detected:** M5 has 4 existing features (F1-F4) that collide
  with 5 new groups (F0-F4)
- **Scope expansion required:** M6 and M7 have significantly more content than
  original estimates
- **Recommendation:** Rename existing ROADMAP features to avoid collision with
  new F-prefixed groups

---

## 1. Feature Group Comparison Table

### M5 - Inventories/Offline + Steps

| Source               | Group ID | Name                          | Item Count | Conflict Type     |
| -------------------- | -------- | ----------------------------- | ---------- | ----------------- |
| **Existing ROADMAP** | F1       | 10th Step Inventory Tool      | 47 SP      | Naming collision  |
| **Existing ROADMAP** | F2       | Inventory Templates           | 21 SP      | Naming collision  |
| **Existing ROADMAP** | F3       | Amends Tracker                | 26 SP      | Naming collision  |
| **Existing ROADMAP** | F4       | Pattern Recognition           | 22 SP      | Naming collision  |
| **New (Expansion)**  | F0       | App-Wide Input Infrastructure | 1 item     | NEW - No conflict |
| **New (Expansion)**  | F1       | Offline Infrastructure        | 13 items   | Naming collision  |
| **New (Expansion)**  | F2       | Step Work Worksheets          | 2 items    | Naming collision  |
| **New (Expansion)**  | F3       | Step Work Enhancements        | 2 items    | Naming collision  |
| **New (Expansion)**  | F4       | Step Work Context Tools       | 1 item     | Naming collision  |

**Resolution:** See Section 2 - Rename existing features to avoid collision.

---

### M6 - Prayers/Journaling + Safety

| Source               | Group ID | Name                    | Item Count | Conflict Type   |
| -------------------- | -------- | ----------------------- | ---------- | --------------- |
| **Existing ROADMAP** | F1       | Prayer Library          | 21 SP      | Theme mismatch  |
| **Existing ROADMAP** | F2       | Daily Meditation        | 16 SP      | Theme mismatch  |
| **Existing ROADMAP** | F3       | Guided Meditation       | 26 SP      | Theme mismatch  |
| **New (Expansion)**  | F1       | Journaling & Insights   | 17 items   | Scope expansion |
| **New (Expansion)**  | F2       | Safety & Harm Reduction | 4 items    | Scope expansion |
| **New (Expansion)**  | F3       | Onboarding              | 2 items    | Scope expansion |

**Resolution:** M6 requires theme reconciliation:

- Existing: "Prayers & Meditations" (spiritual content focus)
- New: "Journaling + Safety + Onboarding" (behavioral tools focus)

**Recommendation:** Split M6 into two parts (see Section 4).

---

### M7 - Fellowship Suite

| Source               | Group ID | Name                    | Item Count | Conflict Type        |
| -------------------- | -------- | ----------------------- | ---------- | -------------------- |
| **Existing ROADMAP** | F1       | Sponsor Connection      | 32 SP      | Scope overlap        |
| **Existing ROADMAP** | F2       | Phone List              | 21 SP      | None                 |
| **Existing ROADMAP** | F3       | Support Network         | 26 SP      | None                 |
| **Existing ROADMAP** | F4       | Milestone Celebrations  | 11 SP      | None                 |
| **Existing ROADMAP** | F5       | Gamification (Optional) | 10 SP      | None                 |
| **New (Expansion)**  | F1       | Sponsor Connection      | 12 items   | Overlaps existing F1 |
| **New (Expansion)**  | F2       | Service & Fellowship    | 1 item     | NEW                  |
| **New (Expansion)**  | F3       | Daily Engagement        | 2 items    | NEW                  |
| **New (Expansion)**  | F4       | Exports & Reports       | 14 items   | NEW                  |
| **New (Expansion)**  | F5       | Nashville Advantage     | 8 items    | NEW                  |
| **New (Expansion)**  | F6       | Recovery Knowledge Base | 13 items   | NEW                  |
| **New (Expansion)**  | F7       | Extended Safety         | 5 items    | NEW                  |
| **New (Expansion)**  | F8       | Personalization         | 11 items   | NEW                  |
| **New (Expansion)**  | F9       | Analytics & Data        | 7 items    | NEW                  |
| **New (Expansion)**  | F10      | Visionary Features      | 2 items    | NEW                  |
| **New (Expansion)**  | F11      | Financial & Old-Timers  | 4 items    | NEW                  |

**Resolution:** M7 needs major restructuring (see Section 4).

---

## 2. Naming Convention Recommendations

### Current Problem

Two naming systems in conflict:

| System               | Format             | Example                         | Used In                 |
| -------------------- | ------------------ | ------------------------------- | ----------------------- |
| **Existing ROADMAP** | "Feature N - Name" | "F1: 10th Step Inventory Tool"  | M3-M8 original features |
| **New Expansion**    | "Fx: Short Name"   | "M5-F1: Offline Infrastructure" | Expansion evaluation    |

The F-prefix collides because both systems use "F1", "F2", etc.

### Recommended Standard

Adopt a **milestone-scoped identifier** to avoid ambiguity:

```
Format: M{milestone}-{type}{number}: {Name}

Types:
- F = Feature Group (from expansion)
- L = Legacy Feature (existing ROADMAP)
- T = Technical Item

Examples:
- M5-F1: Offline Infrastructure (new)
- M5-L1: 10th Step Inventory Tool (existing, renamed)
```

### Migration Plan

**Phase 1: Immediate (before ROADMAP push)**

1. Rename existing M5 features: F1-F4 becomes L1-L4
2. Rename existing M6 features: F1-F3 becomes L1-L3
3. Rename existing M7 features: F1-F5 becomes L1-L5
4. New expansion groups retain F-prefix

**Phase 2: During ROADMAP Update**

1. Add clarifying comments at milestone headers
2. Update dependency references
3. Add cross-reference tables

**Phase 3: Documentation**

1. Update DEVELOPMENT.md glossary
2. Add naming convention to CONTRIBUTING.md

---

## 3. Scope Alignment Matrix

### Which new groups map to existing features

| New Group              | Maps To Existing              | Relationship                     |
| ---------------------- | ----------------------------- | -------------------------------- |
| M5-F0: Input           | (none)                        | NEW - standalone                 |
| M5-F1: Offline         | (none)                        | NEW - infrastructure             |
| M5-F2: Worksheets      | M5-L1: 10th Step              | EXTENDS - adds Steps 2-9, 11-12  |
| M5-F3: Enhancements    | M5-L4: Pattern Recognition    | OVERLAPS - similar AI features   |
| M5-F4: Context         | M5-L2: Templates              | EXTENDS - adds reference library |
| M6-F1: Journaling      | (none)                        | NEW - behavioral tools           |
| M6-F2: Safety          | (none)                        | NEW - harm reduction             |
| M6-F3: Onboarding      | (none)                        | NEW - progressive disclosure     |
| M7-F1: Sponsor         | M7-L1: Sponsor Connection     | OVERLAPS - same theme            |
| M7-F2: Service         | M7-L3: Support Network        | EXTENDS - adds service tracking  |
| M7-F3: Engagement      | M7-L4: Milestone Celebrations | EXTENDS - adds daily rituals     |
| M7-F4: Exports         | (none)                        | NEW - reporting suite            |
| M7-F5: Nashville       | (none)                        | NEW - local features             |
| M7-F6: Knowledge       | (none)                        | NEW - education content          |
| M7-F7: Safety          | M6-F2: Safety                 | EXTENDS - advanced safety        |
| M7-F8: Personalization | (none)                        | NEW - customization              |
| M7-F9: Analytics       | (none)                        | NEW - data & privacy             |
| M7-F10: Visionary      | M7-L5: Gamification           | EXTENDS - timeline features      |
| M7-F11: Financial      | (none)                        | NEW - money tracking             |

### Which new groups require new sections

| Group                  | Requires New Section | Reason                  |
| ---------------------- | -------------------- | ----------------------- |
| M4.5-F1: Encryption    | YES                  | New milestone entirely  |
| M4.5-F2: Privacy       | YES                  | New milestone entirely  |
| M5-F0: Input           | YES                  | App-wide infrastructure |
| M5-F1: Offline         | YES                  | Major technical feature |
| M6-F2: Safety          | YES                  | Harm reduction focus    |
| M6-F3: Onboarding      | YES                  | User experience focus   |
| M7-F4: Exports         | YES                  | Reporting suite         |
| M7-F5: Nashville       | YES                  | Location-specific       |
| M7-F6: Knowledge       | YES                  | Education content       |
| M7-F8: Personalization | YES                  | Customization suite     |
| M7-F9: Analytics       | YES                  | Data governance         |
| M7-F11: Financial      | YES                  | Money tracking          |
| M9-F1: Native Security | YES                  | New milestone entirely  |
| M9-F2: Health          | YES                  | Native health APIs      |

### Which existing features become obsolete

| Existing Feature         | Status   | Reason                                |
| ------------------------ | -------- | ------------------------------------- |
| M5-L3: Amends Tracker    | KEEP     | No overlap with new groups            |
| M6-L1: Prayer Library    | RELOCATE | Move to M7-F6 (Knowledge Base)        |
| M6-L2: Daily Meditation  | RELOCATE | Move to M7-F6 (Knowledge Base)        |
| M6-L3: Guided Meditation | RELOCATE | Move to M7-F6 (Knowledge Base)        |
| M7-L2: Phone List        | MERGE    | Merge into M7-F1 (Sponsor Connection) |

---

## 4. Milestone Restructuring Proposals

### M4.5: Security & Privacy (NEW)

**Insert:** After M4, before M5 **Priority:** P0 (required for sensitive data)
**Target:** Q2 2026

| Group     | Name                    | Items  | Story Points (est) |
| --------- | ----------------------- | ------ | ------------------ |
| F1        | Encryption Foundation   | 7      | 40 SP              |
| F2        | Privacy & Data Controls | 6      | 30 SP              |
| **Total** |                         | **13** | **70 SP**          |

---

### M5: Offline + Step Work (EXPANDED)

**Original:** "Nightly Inventories" (116 SP) **New Theme:** "Offline
Infrastructure + Comprehensive Step Work" **Target:** Q3 2026

| Group     | Name                   | Items                 | Legacy Merge | SP Est      |
| --------- | ---------------------- | --------------------- | ------------ | ----------- |
| F0        | App-Wide Input         | 1                     | -            | 13 SP       |
| F1        | Offline Infrastructure | 13                    | -            | 55 SP       |
| F2        | Step Work Worksheets   | 2                     | L1 partial   | 35 SP       |
| F3        | Step Work Enhancements | 2                     | L4 partial   | 18 SP       |
| F4        | Step Work Context      | 1                     | L2 partial   | 8 SP        |
| L1        | 10th Step Inventory    | (legacy)              | Keep         | 47 SP       |
| L2        | Inventory Templates    | (legacy)              | Keep         | 21 SP       |
| L3        | Amends Tracker         | (legacy)              | Keep         | 26 SP       |
| L4        | Pattern Recognition    | (legacy)              | Keep         | 22 SP       |
| **Total** |                        | **19 new + 4 legacy** |              | **~245 SP** |

**Note:** Consider splitting M5 into M5.1 (Offline) and M5.2 (Step Work) if too
large.

---

### M6: Journaling + Safety (RESTRUCTURED)

**Original Theme:** "Prayers & Meditations" (63 SP) **New Theme:** "Journaling,
Safety & Onboarding" **Relocation:** Prayer/Meditation content moves to M7-F6

| Group     | Name                    | Items  | SP Est      |
| --------- | ----------------------- | ------ | ----------- |
| F1        | Journaling & Insights   | 17     | 68 SP       |
| F2        | Safety & Harm Reduction | 4      | 21 SP       |
| F3        | Onboarding              | 2      | 13 SP       |
| **Total** |                         | **23** | **~102 SP** |

**Breaking Change:** M6 theme changes from spiritual content to behavioral
tools.

---

### M7: Fellowship Suite (SPLIT PROPOSAL)

**Original:** 5 features, 100 SP **New:** 11 feature groups, 75+ items
**Recommendation:** Split into sub-milestones

#### M7.1 - Core Fellowship (Q4 2026)

| Group        | Name                 | Items    | Notes              |
| ------------ | -------------------- | -------- | ------------------ |
| F1           | Sponsor Connection   | 12       | Merges with L1, L2 |
| F2           | Service & Fellowship | 1        |                    |
| F3           | Daily Engagement     | 2        | Extends L4         |
| L3           | Support Network      | (legacy) | Keep               |
| **Subtotal** |                      | ~17      | ~55 SP             |

#### M7.2 - Exports & Reports (Q4 2026)

| Group        | Name              | Items | Notes             |
| ------------ | ----------------- | ----- | ----------------- |
| F4           | Exports & Reports | 14    | Major new feature |
| **Subtotal** |                   | 14    | ~45 SP            |

#### M7.3 - Knowledge & Personalization (Q1 2027)

| Group        | Name                    | Items | Notes                         |
| ------------ | ----------------------- | ----- | ----------------------------- |
| F6           | Recovery Knowledge Base | 13    | Includes relocated M6 prayers |
| F8           | Personalization         | 11    |                               |
| **Subtotal** |                         | 24    | ~65 SP                        |

#### M7.4 - Nashville & Safety (Q1 2027)

| Group        | Name                | Items | Notes             |
| ------------ | ------------------- | ----- | ----------------- |
| F5           | Nashville Advantage | 8     | Location-specific |
| F7           | Extended Safety     | 5     | Builds on M6-F2   |
| **Subtotal** |                     | 13    | ~40 SP            |

#### M7.5 - Analytics & Future (Q1 2027)

| Group        | Name                   | Items    | Notes           |
| ------------ | ---------------------- | -------- | --------------- |
| F9           | Analytics & Data       | 7        | Data governance |
| F10          | Visionary Features     | 2        |                 |
| F11          | Financial & Old-Timers | 4        |                 |
| L5           | Gamification           | (legacy) | Keep            |
| **Subtotal** |                        | ~14      | ~35 SP          |

**M7 Total After Split:** ~82 items, ~240 SP across 5 sub-milestones

---

### M9: Native App Features (NEW)

**Insert:** After M8, before M10 **Target:** 2027

| Group     | Name                     | Items                      | Notes                   |
| --------- | ------------------------ | -------------------------- | ----------------------- |
| F1        | Native Security Features | 3 staged + 9 deferred      | Biometric, stealth, BLE |
| F2        | Health Integration       | 3 deferred                 | HR, sleep, movement     |
| **Total** |                          | **3 staged + 12 deferred** | ~40 SP                  |

---

## 5. Updated Feature Group Registry (Authoritative)

### By Milestone

| Milestone | Group ID | Name                          | Item Count | Status             |
| --------- | -------- | ----------------------------- | ---------- | ------------------ |
| **M4.5**  | F1       | Encryption Foundation         | 7          | NEW                |
| **M4.5**  | F2       | Privacy & Data Controls       | 6          | NEW                |
| **M5**    | F0       | App-Wide Input Infrastructure | 1          | NEW                |
| **M5**    | F1       | Offline Infrastructure        | 13         | NEW                |
| **M5**    | F2       | Step Work Worksheets          | 2          | NEW                |
| **M5**    | F3       | Step Work Enhancements        | 2          | NEW                |
| **M5**    | F4       | Step Work Context Tools       | 1          | NEW                |
| **M5**    | L1       | 10th Step Inventory Tool      | (SP)       | LEGACY             |
| **M5**    | L2       | Inventory Templates           | (SP)       | LEGACY             |
| **M5**    | L3       | Amends Tracker                | (SP)       | LEGACY             |
| **M5**    | L4       | Pattern Recognition           | (SP)       | LEGACY             |
| **M6**    | F1       | Journaling & Insights         | 17         | NEW                |
| **M6**    | F2       | Safety & Harm Reduction       | 4          | NEW                |
| **M6**    | F3       | Onboarding                    | 2          | NEW                |
| **M6**    | L1-L3    | (Prayer content)              | -          | RELOCATE to M7-F6  |
| **M7.1**  | F1       | Sponsor Connection            | 12         | NEW (merge L1, L2) |
| **M7.1**  | F2       | Service & Fellowship          | 1          | NEW                |
| **M7.1**  | F3       | Daily Engagement              | 2          | NEW                |
| **M7.1**  | L3       | Support Network               | (SP)       | LEGACY             |
| **M7.2**  | F4       | Exports & Reports             | 14         | NEW                |
| **M7.3**  | F6       | Recovery Knowledge Base       | 13         | NEW                |
| **M7.3**  | F8       | Personalization               | 11         | NEW                |
| **M7.4**  | F5       | Nashville Advantage           | 8          | NEW                |
| **M7.4**  | F7       | Extended Safety               | 5          | NEW                |
| **M7.5**  | F9       | Analytics & Data              | 7          | NEW                |
| **M7.5**  | F10      | Visionary Features            | 2          | NEW                |
| **M7.5**  | F11      | Financial & Old-Timers        | 4          | NEW                |
| **M7.5**  | L5       | Gamification                  | (SP)       | LEGACY             |
| **M9**    | F1       | Native Security Features      | 3 + 9 def  | NEW                |
| **M9**    | F2       | Health Integration            | 3 def      | NEW                |
| **M10**   | F1       | Future Enhancements           | 11 def     | NEW                |

### Summary Statistics

| Category                | Count                |
| ----------------------- | -------------------- |
| New Feature Groups      | 21                   |
| Legacy Groups (renamed) | 9                    |
| Relocated Groups        | 3 (M6 prayers to M7) |
| New Milestones          | 2 (M4.5, M9)         |
| Split Milestones        | 1 (M7 to M7.1-M7.5)  |

---

## 6. Breaking Changes Requiring Approval

The following changes significantly alter the ROADMAP structure:

### Critical (Requires User Approval)

| Change                        | Impact                                                | Recommendation                               |
| ----------------------------- | ----------------------------------------------------- | -------------------------------------------- |
| M6 theme change               | "Prayers & Meditations" becomes "Journaling + Safety" | APPROVE - prayers relocated to M7-F6         |
| M7 split                      | Single milestone becomes 5 sub-milestones             | APPROVE - scope too large for single release |
| F-prefix collision resolution | Rename existing features to L-prefix                  | APPROVE - prevents ambiguity                 |

### Non-Breaking (Proceed Without Approval)

| Change                           | Impact                                                |
| -------------------------------- | ----------------------------------------------------- |
| Add M4.5                         | New milestone insertion, no existing content affected |
| Add M9                           | New milestone insertion, no existing content affected |
| Merge M7-L2 (Phone List) into F1 | Consolidation of related features                     |

---

## 7. Implementation Recommendations

### Immediate Actions

1. **Update ROADMAP.md header** to note naming convention change
2. **Rename existing features** M5-F1-F4 to M5-L1-L4 (etc.)
3. **Add M4.5 section** with encryption/privacy features
4. **Add M9 section** with placeholder for native features

### Before Push to ROADMAP

1. **Confirm M6 theme change** with user
2. **Confirm M7 split strategy** with user (M7.1-M7.5 or single large M7)
3. **Validate Prayer relocation** - user may prefer separate milestone

### After Push

1. **Update dependency graph** in ROADMAP mermaid diagram
2. **Recalculate timeline** - M7 split extends into Q1 2027
3. **Archive this analysis** to docs/analysis/

---

## Appendix A: Offline Infrastructure Items (M5-F1)

The 13 items in M5-F1 come from these evaluated ideas:

| ID    | Idea                               | Source Module   |
| ----- | ---------------------------------- | --------------- |
| T1.2  | Custom mutation queue              | T1 Architecture |
| T1.3  | UI always reads from local         | T1 Architecture |
| T1.4  | Background sync worker             | T1 Architecture |
| T1.6  | Persisted Storage API request      | T1 Architecture |
| T1.11 | Queue depth visibility             | T1 Architecture |
| T1.12 | Sync & Storage settings panel      | T1 Architecture |
| T2.2  | sharedPackets collection           | T2 Data Model   |
| T2.8  | SyncState per device               | T2 Data Model   |
| T2.12 | Soft delete pattern                | T2 Data Model   |
| T7.1  | Feature flag for offline           | T7 Quality      |
| T7.2  | PR strategy (types to conflict UI) | T7 Quality      |
| T7.8  | Unit tests for conflicts           | T7 Quality      |
| T7.9  | Firebase emulator tests            | T7 Quality      |

---

## Appendix B: Cross-Reference Quick Lookup

### By Original Module (Expansion Evaluation)

| Module             | Primary Placement | Items |
| ------------------ | ----------------- | ----- |
| F1 Step Work       | M5-F2, F3, F4     | 5     |
| F2 Sponsor         | M7.1-F1           | 12    |
| F3 Nashville       | M7.4-F5           | 8     |
| F4 Privacy         | M4.5-F2           | 6     |
| F5 Journaling      | M6-F1             | 17    |
| F6 Knowledge       | M7.3-F6           | 13    |
| F7 Exports         | M7.2-F4           | 14    |
| F8 Personalization | M7.3-F8           | 11    |
| F9 Engagement      | M6-F1, M7.1-F3    | Split |
| F10 Safety         | M6-F2, M7.4-F7    | Split |
| F11 Visionary      | M7.5-F10          | 2     |
| F12 Final Gaps     | M6-F3, M7.5-F11   | Split |
| T1 Architecture    | M5-F1             | 6     |
| T2 Data Model      | M5-F1, M7.1-F1    | 4     |
| T4 Encryption      | M4.5-F1           | 7     |
| T5 Exports         | M7.2-F4           | 6     |
| T6 Analytics       | M7.5-F9           | 5     |
| T7 Quality         | M5-F1             | 4     |
| T8 Native          | M9-F1             | 3     |
| T9 Open Questions  | Various           | 4     |

---

**Pass 4 Status:** COMPLETE **Confidence:** HIGH **Next Action:** User review of
breaking changes, then Pass 5 (ROADMAP Update)
