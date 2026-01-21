# Expansion Evaluation Tracker

**Purpose:** Track progress through ~240 expansion ideas across 21 modules
**Created:** 2026-01-20 | **Last Updated:** 2026-01-20

---

## Quick Resume

> **Last Session:** 2026-01-20 (Initial setup) **Last Evaluated:** None yet
> **Next Suggested:** Run `/expansion begin` to answer foundational questions
> **Open Questions:** 8 foundational questions ready for discussion

---

## Command Reference

| Command                            | Description                        |
| ---------------------------------- | ---------------------------------- |
| `/expansion begin`                 | Initialize or resume evaluation    |
| `/expansion evaluate [module]`     | Jump to a specific module          |
| `/expansion evaluate [module] [n]` | Jump to specific idea in module    |
| `/expansion status`                | Show progress and recent decisions |
| `/expansion decide [action]`       | Record decision for current idea   |
| `/expansion questions`             | Review open questions              |
| `/expansion end`                   | Save checkpoint and commit         |

### Decision Actions

- `accept [milestone] [reason]` - Add to ROADMAP
- `defer [reason]` - Good idea, not now
- `reject [reason]` - Doesn't fit
- `merge [item] [reason]` - Enhance existing ROADMAP item
- `discuss` - Mark for more discussion

---

## Progress Summary

| Category  | Modules | Ideas | Reviewed | Decided | Pending |
| --------- | ------- | ----- | -------- | ------- | ------- |
| Feature   | 12      | ~175  | 0        | 0       | 175     |
| Technical | 9       | ~105  | 0        | 0       | 105     |
| **Total** | **21**  | ~280  | 0        | 0       | 280     |

---

## Module Navigation Index

### Feature Modules (F1-F12)

| ID  | Module                  | Ideas | Reviewed | Status      |
| --- | ----------------------- | ----- | -------- | ----------- |
| F1  | Step Work Depth         | 60    | 0        | Not Started |
| F2  | Sponsor Tooling         | 11    | 0        | Not Started |
| F3  | Nashville Advantage     | 8     | 0        | Not Started |
| F4  | Offline/Privacy         | 15    | 0        | Not Started |
| F5  | Journaling & Insights   | 15    | 0        | Not Started |
| F6  | Recovery Knowledge Base | 12    | 0        | Not Started |
| F7  | Exports & Reports       | 11    | 0        | Not Started |
| F8  | Personalization         | 11    | 0        | Not Started |
| F9  | Daily Engagement        | 11    | 0        | Not Started |
| F10 | Safety & Harm Reduction | 10    | 0        | Not Started |
| F11 | Visionary/Dream Big     | 10    | 0        | Not Started |
| F12 | Final Gaps              | 11    | 0        | Not Started |

### Technical Modules (T1-T9)

| ID  | Module                   | Ideas | Reviewed | Status      |
| --- | ------------------------ | ----- | -------- | ----------- |
| T1  | System Architecture      | ~18   | 0        | Not Started |
| T2  | Data Model & Firestore   | ~12   | 0        | Not Started |
| T3  | Offline Queue & Conflict | ~15   | 0        | Not Started |
| T4  | Encryption & Passcode    | ~12   | 0        | Not Started |
| T5  | Exports & PDF            | ~10   | 0        | Not Started |
| T6  | Analytics Plan           | ~8    | 0        | Not Started |
| T7  | Tech Debt & Quality      | ~10   | 0        | Not Started |
| T8  | Native Path              | ~8    | 0        | Not Started |
| T9  | Open Questions & Future  | ~12   | 0        | Not Started |

---

## Cross-References (Feature ↔ Technical Dependencies)

| Feature Module         | Related Technical | Dependency Type      |
| ---------------------- | ----------------- | -------------------- |
| F4 (Offline/Privacy)   | T1, T3, T4        | Core (must have T)   |
| F7 (Exports & Reports) | T5                | Direct overlap       |
| F2 (Sponsor Tooling)   | T2, T4            | Data + Privacy       |
| F1 (Step Work Depth)   | T2, T4            | Schema + Encryption  |
| F5 (Journaling)        | T1, T3            | Offline sync         |
| F3 (Nashville)         | None              | Independent          |
| F6 (Knowledge Base)    | T1                | Offline availability |
| F8 (Personalization)   | T2                | Data schema          |
| F9 (Daily Engagement)  | T1, T6            | Offline + Analytics  |
| F10 (Safety)           | T4                | Privacy sensitive    |
| F11 (Visionary)        | T8                | Native capabilities  |
| F12 (Final Gaps)       | Various           | Varies               |

---

## Open Questions

Questions that need answers before or during evaluation. Add new questions here
as they arise. Mark resolved questions with ~~strikethrough~~.

### Architecture Questions

1. **Offline-first priority:** Should all features work offline, or just core
   journal/step work? (Impacts F3, F6, F9)

2. **Native app timing:** When (if ever) should we pursue a native app wrapper?
   (Impacts T8, F11)

3. **Encryption scope:** Should encryption be optional or mandatory for
   sensitive data like Step 4? (Impacts T4, F1, F4)

### Feature Questions

4. **Nashville scope:** How "Nashville-specific" should F3 features be? Reusable
   for other cities later?

5. **Sponsor model:** Push (snapshots) vs Pull (permissions)? Push seems
   consensus but confirm. (Impacts F2, T2)

6. **Meeting finder:** Build our own vs integrate with existing directories?
   (Impacts F3)

### Technical Questions

7. **IndexedDB library:** Dexie vs idb vs raw IndexedDB? (T1.1)

8. **PDF generation:** @react-pdf/renderer vs pdf-lib vs jsPDF? (T5.1)

9. **Analytics tool:** Firebase Analytics vs PostHog? (T6.1-T6.2)

10. **Capacitor vs Expo:** If/when we go native, which wrapper? (T8.1-T8.2)

### Process Questions

11. **Evaluation order:** Start with technical foundation (T1-T4) or feature
    modules (F1-F12)?

12. **ROADMAP integration:** Add accepted items immediately or batch at end?

---

## Decision Log

### Session: 2026-01-20 (Setup)

- Created tracker and skill infrastructure
- Parsed technical doc into 9 modules (T1-T9)
- Identified 12 open questions for initial discussion

---

## Module Evaluations

### F1: Step Work Depth

_Not yet started - 60 ideas pending_

### F2: Sponsor Tooling

_Not yet started - 11 ideas pending_

### F3: Nashville Advantage

_Not yet started - 8 ideas pending_

### F4: Offline/Privacy

_Not yet started - 15 ideas pending_

### F5: Journaling & Insights

_Not yet started - 15 ideas pending_

### F6: Recovery Knowledge Base

_Not yet started - 12 ideas pending_

### F7: Exports & Reports

_Not yet started - 11 ideas pending_

### F8: Personalization

_Not yet started - 11 ideas pending_

### F9: Daily Engagement

_Not yet started - 11 ideas pending_

### F10: Safety & Harm Reduction

_Not yet started - 10 ideas pending_

### F11: Visionary/Dream Big

_Not yet started - 10 ideas pending_

### F12: Final Gaps

_Not yet started - 11 ideas pending_

### T1: System Architecture

_Not yet started - ~18 ideas pending_

### T2: Data Model & Firestore

_Not yet started - ~12 ideas pending_

### T3: Offline Queue & Conflict

_Not yet started - ~15 ideas pending_

### T4: Encryption & Passcode

_Not yet started - ~12 ideas pending_

### T5: Exports & PDF

_Not yet started - ~10 ideas pending_

### T6: Analytics Plan

_Not yet started - ~8 ideas pending_

### T7: Tech Debt & Quality

_Not yet started - ~10 ideas pending_

### T8: Native Path

_Not yet started - ~8 ideas pending_

### T9: Open Questions & Future

_Not yet started - ~12 ideas pending_

---

## Accepted Ideas Summary

_None yet - decisions will be logged here as we evaluate_

| ID  | Idea | Decision | Target Milestone | Date |
| --- | ---- | -------- | ---------------- | ---- |

---

## Deferred Ideas Summary

_None yet_

---

## Rejected Ideas Summary

_None yet_

---

## Merged with ROADMAP

_None yet_

---

## Version History

| Version | Date       | Description                              |
| ------- | ---------- | ---------------------------------------- |
| 1.0     | 2026-01-20 | Initial tracker creation with 21 modules |
