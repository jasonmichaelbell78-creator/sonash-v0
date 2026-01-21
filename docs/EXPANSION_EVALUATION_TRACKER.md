# Expansion Evaluation Tracker

**Purpose:** Track progress through ~280 expansion ideas across 21 modules
**Created:** 2026-01-20 | **Last Updated:** 2026-01-21

---

## Quick Resume

> **Last Session:** 2026-01-21 (Foundational Questions Complete)
> **Last Evaluated:** None yet - foundational framework established
> **Next Suggested:** Run `/expansion evaluate T4` to begin Phase 1 (Encryption)
> **Open Questions:** All 12 resolved ✅

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
| `/expansion push-to-roadmap`       | Push staged decisions to ROADMAP   |

### Decision Actions

- `accept [milestone] [reason]` - Stage for ROADMAP (not pushed until requested)
- `defer [reason]` - Good idea, not now
- `reject [reason]` - Doesn't fit
- `merge [item] [reason]` - Enhance existing ROADMAP item
- `discuss` - Mark for more discussion

### ROADMAP Integration Process

**Important:** Decisions are STAGED, not immediately pushed to ROADMAP.md.

1. During evaluation, accepted ideas are logged in "Staged for ROADMAP" section
2. User reviews staged items with `/expansion status`
3. User explicitly requests `/expansion push-to-roadmap` when ready
4. Only then are items added to ROADMAP.md and committed

This prevents ROADMAP churn and allows batch review before integration.

---

## Progress Summary

| Category  | Modules | Ideas | Reviewed | Decided | Pending |
| --------- | ------- | ----- | -------- | ------- | ------- |
| Feature   | 12      | ~175  | 0        | 0       | 175     |
| Technical | 9       | ~105  | 0        | 0       | 105     |
| **Total** | **21**  | ~280  | 0        | 0       | 280     |

---

## Foundational Decisions

All 12 foundational questions have been answered. These decisions guide all module evaluations.

### Architecture Decisions

| Q# | Question | Decision | Rationale |
|----|----------|----------|-----------|
| 1 | Offline-first priority | **Per-feature decision** | Evaluate each module's offline need individually rather than blanket policy |
| 3 | Encryption scope | **Mandatory maximum** | All step work encrypted as much as possible; implementation details TBD during T4 |
| 10 | Native wrapper | **Defer** | Focus on PWA first; revisit when evaluating F11/T8 |
| 11 | Evaluation order | **Hybrid (dependency-grouped)** | Analyze F↔T connections; group related items; slot standalone technical into feature flow |

### Feature Decisions

| Q# | Question | Decision | Rationale |
|----|----------|----------|-----------|
| 4 | Nashville scope | **Nashville-first, abstracted** | Build for Nashville but with city as parameter for future expansion |
| 5 | Sponsor model | **Push only** | Sponsee sends read-only snapshots on demand; maximum privacy and user agency |
| 6 | Meeting finder | **Explore automation** | Already built manually; worth exploring scripts for periodic pulls + geocoding pipeline |

### Technical Decisions

| Q# | Question | Decision | Rationale |
|----|----------|----------|-----------|
| 7 | IndexedDB library | **Dexie.js** | Rich query API, React `useLiveQuery` hook, declarative schema, encryption addon support |
| 8 | PDF generation | **@react-pdf/renderer** | React component model, flexbox layout, automatic pagination; bundle size acceptable (lazy-loaded) |
| 9 | Analytics | **Minimal custom (Tier 1 + opt-in Tier 2)** | Privacy-first; Tier 1 = anonymous aggregates, Tier 2 = explicit opt-in for richer data |

### Process Decisions

| Q# | Question | Decision | Rationale |
|----|----------|----------|-----------|
| 12 | ROADMAP integration | **Staged with explicit push** | Log decisions during evaluation; push to ROADMAP only on user request |

---

## Approved Evaluation Order

Dependency-grouped, 7-phase evaluation flow:

### Phase 1: Core Privacy Foundation
| Order | Module | Why Here |
|-------|--------|----------|
| 1 | **T4** (Encryption & Passcode) | Everything depends on encryption decisions |
| 2 | **F4** (Offline/Privacy) | Directly depends on T4; defines privacy UX |
| 3 | **T1** (System Architecture) | Offline architecture informed by F4 needs |
| 4 | **T3** (Offline Queue & Conflict) | Implementation details for T1 decisions |

### Phase 2: Core Features
| Order | Module | Why Here |
|-------|--------|----------|
| 5 | **F1** (Step Work Depth) | Core feature, needs T4 encryption, T2 schema |
| 6 | **T2** (Data Model & Firestore) | Schema decisions informed by F1 needs |
| 7 | **F5** (Journaling & Insights) | Core feature, uses T1/T3 offline patterns |
| 8 | **F9** (Daily Engagement) | Core feature, offline + light analytics |

### Phase 3: Sponsor & Sharing
| Order | Module | Why Here |
|-------|--------|----------|
| 9 | **F2** (Sponsor Tooling) | Push model decided; needs T2 schema, T4 privacy |
| 10 | **F7** (Exports & Reports) | Sharing mechanism for sponsor/self |
| 11 | **T5** (Exports & PDF) | Technical implementation for F7 |

### Phase 4: Local & Knowledge
| Order | Module | Why Here |
|-------|--------|----------|
| 12 | **F3** (Nashville Advantage) | Independent, abstracted per Q4 |
| 13 | **F6** (Recovery Knowledge Base) | Offline content availability |

### Phase 5: Safety & Personalization
| Order | Module | Why Here |
|-------|--------|----------|
| 14 | **F10** (Safety & Harm Reduction) | Privacy-sensitive (T4), critical UX |
| 15 | **F8** (Personalization) | Data schema (T2) dependent |

### Phase 6: Quality & Operations
| Order | Module | Why Here |
|-------|--------|----------|
| 16 | **T7** (Tech Debt & Quality) | Informed by all prior decisions |
| 17 | **T6** (Analytics Plan) | Now know what to measure from features |

### Phase 7: Future Vision
| Order | Module | Why Here |
|-------|--------|----------|
| 18 | **F11** (Visionary/Dream Big) | Depends on native decision (T8) |
| 19 | **T8** (Native Path) | Deferred but evaluate options |
| 20 | **F12** (Final Gaps) | Catch-all for anything missed |
| 21 | **T9** (Open Questions & Future) | Remaining technical questions |

---

## Module Navigation Index

### Feature Modules (F1-F12)

| ID  | Module                  | Ideas | Reviewed | Status      | Phase |
| --- | ----------------------- | ----- | -------- | ----------- | ----- |
| F1  | Step Work Depth         | 60    | 0        | Not Started | 2     |
| F2  | Sponsor Tooling         | 11    | 0        | Not Started | 3     |
| F3  | Nashville Advantage     | 8     | 0        | Not Started | 4     |
| F4  | Offline/Privacy         | 15    | 0        | Not Started | 1     |
| F5  | Journaling & Insights   | 15    | 0        | Not Started | 2     |
| F6  | Recovery Knowledge Base | 12    | 0        | Not Started | 4     |
| F7  | Exports & Reports       | 11    | 0        | Not Started | 3     |
| F8  | Personalization         | 11    | 0        | Not Started | 5     |
| F9  | Daily Engagement        | 11    | 0        | Not Started | 2     |
| F10 | Safety & Harm Reduction | 10    | 0        | Not Started | 5     |
| F11 | Visionary/Dream Big     | 10    | 0        | Not Started | 7     |
| F12 | Final Gaps              | 11    | 0        | Not Started | 7     |

### Technical Modules (T1-T9)

| ID  | Module                   | Ideas | Reviewed | Status      | Phase |
| --- | ------------------------ | ----- | -------- | ----------- | ----- |
| T1  | System Architecture      | ~18   | 0        | Not Started | 1     |
| T2  | Data Model & Firestore   | ~12   | 0        | Not Started | 2     |
| T3  | Offline Queue & Conflict | ~15   | 0        | Not Started | 1     |
| T4  | Encryption & Passcode    | ~12   | 0        | Not Started | 1     |
| T5  | Exports & PDF            | ~10   | 0        | Not Started | 3     |
| T6  | Analytics Plan           | ~8    | 0        | Not Started | 6     |
| T7  | Tech Debt & Quality      | ~10   | 0        | Not Started | 6     |
| T8  | Native Path              | ~8    | 0        | Not Started | 7     |
| T9  | Open Questions & Future  | ~12   | 0        | Not Started | 7     |

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

~~All foundational questions resolved as of 2026-01-21.~~

### Resolved Questions

1. ~~**Offline-first priority**~~ → Per-feature decision (Q1)
2. ~~**Native app timing**~~ → Defer, focus on PWA (Q10)
3. ~~**Encryption scope**~~ → Mandatory maximum (Q3)
4. ~~**Nashville scope**~~ → Nashville-first, abstracted (Q4)
5. ~~**Sponsor model**~~ → Push only (Q5)
6. ~~**Meeting finder**~~ → Explore automation (Q6)
7. ~~**IndexedDB library**~~ → Dexie.js (Q7)
8. ~~**PDF generation**~~ → @react-pdf/renderer (Q8)
9. ~~**Analytics tool**~~ → Minimal custom T1+T2 (Q9)
10. ~~**Capacitor vs Expo**~~ → Defer (Q10)
11. ~~**Evaluation order**~~ → Hybrid dependency-grouped (Q11)
12. ~~**ROADMAP integration**~~ → Staged with explicit push (Q12)

### New Questions (During Evaluation)

_None yet - add questions as they arise during module evaluation_

---

## Decision Log

### Session: 2026-01-20 (Setup)

- Created tracker and skill infrastructure
- Parsed technical doc into 9 modules (T1-T9)
- Identified 12 open questions for initial discussion

### Session: 2026-01-21 (Foundational Framework)

- Answered all 12 foundational questions
- Established tooling decisions: Dexie.js, @react-pdf/renderer, minimal custom analytics
- Established privacy philosophy: mandatory encryption, push-only sponsor, no Google tracking
- Created 7-phase dependency-grouped evaluation order
- Added staged ROADMAP integration process (decisions logged, pushed on request)
- **Ready to begin module evaluations starting with T4 (Encryption)**

---

## Module Evaluations

### T4: Encryption & Passcode

_Not yet started - ~12 ideas pending (Phase 1, Order 1)_

### F4: Offline/Privacy

_Not yet started - 15 ideas pending (Phase 1, Order 2)_

### T1: System Architecture

_Not yet started - ~18 ideas pending (Phase 1, Order 3)_

### T3: Offline Queue & Conflict

_Not yet started - ~15 ideas pending (Phase 1, Order 4)_

### F1: Step Work Depth

_Not yet started - 60 ideas pending (Phase 2, Order 5)_

### T2: Data Model & Firestore

_Not yet started - ~12 ideas pending (Phase 2, Order 6)_

### F5: Journaling & Insights

_Not yet started - 15 ideas pending (Phase 2, Order 7)_

### F9: Daily Engagement

_Not yet started - 11 ideas pending (Phase 2, Order 8)_

### F2: Sponsor Tooling

_Not yet started - 11 ideas pending (Phase 3, Order 9)_

### F7: Exports & Reports

_Not yet started - 11 ideas pending (Phase 3, Order 10)_

### T5: Exports & PDF

_Not yet started - ~10 ideas pending (Phase 3, Order 11)_

### F3: Nashville Advantage

_Not yet started - 8 ideas pending (Phase 4, Order 12)_

### F6: Recovery Knowledge Base

_Not yet started - 12 ideas pending (Phase 4, Order 13)_

### F10: Safety & Harm Reduction

_Not yet started - 10 ideas pending (Phase 5, Order 14)_

### F8: Personalization

_Not yet started - 11 ideas pending (Phase 5, Order 15)_

### T7: Tech Debt & Quality

_Not yet started - ~10 ideas pending (Phase 6, Order 16)_

### T6: Analytics Plan

_Not yet started - ~8 ideas pending (Phase 6, Order 17)_

### F11: Visionary/Dream Big

_Not yet started - 10 ideas pending (Phase 7, Order 18)_

### T8: Native Path

_Not yet started - ~8 ideas pending (Phase 7, Order 19)_

### F12: Final Gaps

_Not yet started - 11 ideas pending (Phase 7, Order 20)_

### T9: Open Questions & Future

_Not yet started - ~12 ideas pending (Phase 7, Order 21)_

---

## Staged for ROADMAP

_Accepted ideas are staged here until user requests `/expansion push-to-roadmap`_

| ID | Idea | Target Milestone | Rationale | Date |
|----|------|------------------|-----------|------|
| _None yet_ | | | | |

---

## Deferred Ideas Summary

_None yet_

---

## Rejected Ideas Summary

_None yet_

---

## Merged with Existing ROADMAP Items

_None yet_

---

## Version History

| Version | Date       | Description                                        |
| ------- | ---------- | -------------------------------------------------- |
| 1.0     | 2026-01-20 | Initial tracker creation with 21 modules           |
| 2.0     | 2026-01-21 | Foundational framework complete; all 12 Qs answered; 7-phase eval order; staged ROADMAP process |