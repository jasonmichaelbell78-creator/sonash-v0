# Expansion Evaluation Tracker

**Document Version:** 2.1 **Created:** 2026-01-20 | **Last Updated:** 2026-01-22

---

## Purpose

This document tracks the systematic evaluation of ~280 expansion ideas across 21
modules (12 feature + 9 technical) for the SoNash project. It maintains:

- **Progress status** for all modules (F1-F12, T1-T9)
- **Staging area** for accepted/deferred items before ROADMAP push
- **Decision log** with rationale for each evaluated idea
- **Placement metadata** (milestone, insertion point, relationship) for ROADMAP
  integration
- **Quick Resume** context for multi-session evaluation workflow

This is the **source of truth** for expansion evaluation state, used by the
`/expansion-evaluation` skill.

---

## AI Instructions

When working with this tracker:

1. **Always read this file first** before any expansion evaluation actions
2. **Check Quick Resume** to understand current context and next suggested
   module
3. **Update incrementally** during evaluation sessions (don't batch at end)
4. **Discuss placement** for ALL accepted/deferred items (milestone, feature
   group, insertion point)
5. **Stage items, don't push** - Only user can request
   `/expansion-evaluation push-to-roadmap`
6. **Record full rationale** in decision logs for future reference
7. **Update Quick Resume** at session end with clear context for next session

**Critical:** Placement metadata (Placement, Insert After, Relationship) is
**mandatory** for all accepted AND deferred items.

---

## Quick Start

**For new evaluation sessions:**

1. Run `/expansion-evaluation begin` to load current state and get context
2. Review "Quick Resume" section below for last session context
3. Check "Staged for ROADMAP" count - remind user if >10 items awaiting push
4. Continue from suggested next module or user can specify any module

**For resuming work:**

1. Check "Last Session" date in Quick Resume
2. Review any open questions or decisions made since last session
3. Use `/expansion-evaluation evaluate [module]` to jump to specific module

---

## Quick Resume

> **Last Session:** 2026-01-22 (T1 In Progress - Skill Template Added) **Last
> Evaluated:** T1 System Architecture (5/18 evaluated) **Placement Status:** 20
> items with full placement metadata (M4.5, M9, M10, M5-F1) **Next Suggested:**
> Continue `/expansion-evaluation evaluate T1` - **T1.5 decision pending**
> (merge with T1.4 or separate?) **Open Questions:** All 12 resolved ✅ **Ready
> to Push:** 17 items to M4.5/M9/M5 (use `/expansion-evaluation push-to-roadmap`
> when ready) **Skill Update:** Added detailed presentation format template to
> skill file (Description, Feature, Cross-Ref, Technical, Trade-offs, Options,
> Placement, Recommendation)

---

## Command Reference

| Command                                       | Description                        |
| --------------------------------------------- | ---------------------------------- |
| `/expansion-evaluation begin`                 | Initialize or resume evaluation    |
| `/expansion-evaluation evaluate [module]`     | Jump to a specific module          |
| `/expansion-evaluation evaluate [module] [n]` | Jump to specific idea in module    |
| `/expansion-evaluation status`                | Show progress and recent decisions |
| `/expansion-evaluation decide [action]`       | Record decision for current idea   |
| `/expansion-evaluation questions`             | Review open questions              |
| `/expansion-evaluation end`                   | Save checkpoint and commit         |
| `/expansion-evaluation push-to-roadmap`       | Push staged decisions to ROADMAP   |

### Decision Actions

- `accept [milestone] [reason]` - Stage for ROADMAP (not pushed until requested)
- `defer [reason]` - Good idea, not now
- `reject [reason]` - Doesn't fit
- `merge [item] [reason]` - Enhance existing ROADMAP item
- `discuss` - Mark for more discussion

### ROADMAP Integration Process

**Important:** Decisions are STAGED, not immediately pushed to ROADMAP.md.

1. During evaluation, accepted ideas are logged in "Staged for ROADMAP" section
2. User reviews staged items with `/expansion-evaluation status`
3. User explicitly requests `/expansion-evaluation push-to-roadmap` when ready
4. Only then are items added to ROADMAP.md and committed

This prevents ROADMAP churn and allows batch review before integration.

---

## Progress Summary

| Category  | Modules | Ideas | Reviewed | Decided | Pending |
| --------- | ------- | ----- | -------- | ------- | ------- |
| Feature   | 12      | ~175  | 15       | 15      | 160     |
| Technical | 9       | ~105  | 12       | 12      | 93      |
| **Total** | **21**  | ~280  | 27       | 27      | 253     |

---

## Foundational Decisions

All 12 foundational questions have been answered. These decisions guide all
module evaluations.

### Architecture Decisions

| Q#  | Question               | Decision                        | Rationale                                                                                 |
| --- | ---------------------- | ------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | Offline-first priority | **Per-feature decision**        | Evaluate each module's offline need individually rather than blanket policy               |
| 3   | Encryption scope       | **Mandatory maximum**           | All step work encrypted as much as possible; implementation details TBD during T4         |
| 10  | Native wrapper         | **Defer**                       | Focus on PWA first; revisit when evaluating F11/T8                                        |
| 11  | Evaluation order       | **Hybrid (dependency-grouped)** | Analyze F↔T connections; group related items; slot standalone technical into feature flow |

### Feature Decisions

| Q#  | Question        | Decision                        | Rationale                                                                               |
| --- | --------------- | ------------------------------- | --------------------------------------------------------------------------------------- |
| 4   | Nashville scope | **Nashville-first, abstracted** | Build for Nashville but with city as parameter for future expansion                     |
| 5   | Sponsor model   | **Push only**                   | Sponsee sends read-only snapshots on demand; maximum privacy and user agency            |
| 6   | Meeting finder  | **Explore automation**          | Already built manually; worth exploring scripts for periodic pulls + geocoding pipeline |

### Technical Decisions

| Q#  | Question          | Decision                                    | Rationale                                                                                         |
| --- | ----------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 7   | IndexedDB library | **Dexie.js**                                | Rich query API, React `useLiveQuery` hook, declarative schema, encryption addon support           |
| 8   | PDF generation    | **@react-pdf/renderer**                     | React component model, flexbox layout, automatic pagination; bundle size acceptable (lazy-loaded) |
| 9   | Analytics         | **Minimal custom (Tier 1 + opt-in Tier 2)** | Privacy-first; Tier 1 = anonymous aggregates, Tier 2 = explicit opt-in for richer data            |

### Process Decisions

| Q#  | Question            | Decision                      | Rationale                                                             |
| --- | ------------------- | ----------------------------- | --------------------------------------------------------------------- |
| 12  | ROADMAP integration | **Staged with explicit push** | Log decisions during evaluation; push to ROADMAP only on user request |

---

## Approved Evaluation Order

Dependency-grouped, 7-phase evaluation flow:

### Phase 1: Core Privacy Foundation

| Order | Module                            | Why Here                                   |
| ----- | --------------------------------- | ------------------------------------------ |
| 1     | **T4** (Encryption & Passcode)    | Everything depends on encryption decisions |
| 2     | **F4** (Offline/Privacy)          | Directly depends on T4; defines privacy UX |
| 3     | **T1** (System Architecture)      | Offline architecture informed by F4 needs  |
| 4     | **T3** (Offline Queue & Conflict) | Implementation details for T1 decisions    |

### Phase 2: Core Features

| Order | Module                          | Why Here                                     |
| ----- | ------------------------------- | -------------------------------------------- |
| 5     | **F1** (Step Work Depth)        | Core feature, needs T4 encryption, T2 schema |
| 6     | **T2** (Data Model & Firestore) | Schema decisions informed by F1 needs        |
| 7     | **F5** (Journaling & Insights)  | Core feature, uses T1/T3 offline patterns    |
| 8     | **F9** (Daily Engagement)       | Core feature, offline + light analytics      |

### Phase 3: Sponsor & Sharing

| Order | Module                     | Why Here                                        |
| ----- | -------------------------- | ----------------------------------------------- |
| 9     | **F2** (Sponsor Tooling)   | Push model decided; needs T2 schema, T4 privacy |
| 10    | **F7** (Exports & Reports) | Sharing mechanism for sponsor/self              |
| 11    | **T5** (Exports & PDF)     | Technical implementation for F7                 |

### Phase 4: Local & Knowledge

| Order | Module                           | Why Here                       |
| ----- | -------------------------------- | ------------------------------ |
| 12    | **F3** (Nashville Advantage)     | Independent, abstracted per Q4 |
| 13    | **F6** (Recovery Knowledge Base) | Offline content availability   |

### Phase 5: Safety & Personalization

| Order | Module                            | Why Here                            |
| ----- | --------------------------------- | ----------------------------------- |
| 14    | **F10** (Safety & Harm Reduction) | Privacy-sensitive (T4), critical UX |
| 15    | **F8** (Personalization)          | Data schema (T2) dependent          |

### Phase 6: Quality & Operations

| Order | Module                       | Why Here                               |
| ----- | ---------------------------- | -------------------------------------- |
| 16    | **T7** (Tech Debt & Quality) | Informed by all prior decisions        |
| 17    | **T6** (Analytics Plan)      | Now know what to measure from features |

### Phase 7: Future Vision

| Order | Module                           | Why Here                        |
| ----- | -------------------------------- | ------------------------------- |
| 18    | **F11** (Visionary/Dream Big)    | Depends on native decision (T8) |
| 19    | **T8** (Native Path)             | Deferred but evaluate options   |
| 20    | **F12** (Final Gaps)             | Catch-all for anything missed   |
| 21    | **T9** (Open Questions & Future) | Remaining technical questions   |

---

## Module Navigation Index

### Feature Modules (F1-F12)

| ID  | Module                  | Ideas | Reviewed | Status      | Phase |
| --- | ----------------------- | ----- | -------- | ----------- | ----- |
| F1  | Step Work Depth         | 60    | 0        | Not Started | 2     |
| F2  | Sponsor Tooling         | 11    | 0        | Not Started | 3     |
| F3  | Nashville Advantage     | 8     | 0        | Not Started | 4     |
| F4  | Offline/Privacy         | 15    | 15       | ✅ Complete | 1     |
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
| T4  | Encryption & Passcode    | 12    | 12       | ✅ Complete | 1     |
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
- Established tooling decisions: Dexie.js, @react-pdf/renderer, minimal custom
  analytics
- Established privacy philosophy: mandatory encryption, push-only sponsor, no
  Google tracking
- Created 7-phase dependency-grouped evaluation order
- Added staged ROADMAP integration process (decisions logged, pushed on request)
- **Ready to begin module evaluations starting with T4 (Encryption)**

### Session: 2026-01-22 (T4 + F4 Complete)

- **T4 Encryption & Passcode: 12/12 ideas evaluated**
- Accepted (M5): T4.1-4 (PIN + PBKDF2 + AES-GCM + encrypt all), T4.6-7 (recovery
  key + DEK/KEK), T4.9 (auto-lock)
- Rejected: T4.8 (cloud escrow - conflicts with privacy-first)
- Deferred: T4.10 (biometric - requires native app)
- Merged: T4.5 (journal encryption covered by T4.1), T4.11 (phased plan
  implicit)
- Acknowledged: T4.12 (security questions not recommended - reference)

- **F4 Offline/Privacy: 15/15 ideas evaluated**
- Accepted M5: F4.1 (trust indicator), F4.5 (guest mode), F4.7 (selective sync),
  F4.10 (nuclear option), F4.12 (no-tracking dashboard), F4.14 (snapshot
  protection)
- Accepted M6+: F4.2 (burn after reading - needs native)
- Rejected: F4.9 (flip-to-hide - unreliable)
- Deferred: F4.4 (stealth mode), F4.11 (shoulder blur)
- Merged: F4.3→T4.1+T4.10, F4.6→T3, F4.8→T5, F4.13→T4.9
- Acknowledged: F4.15 (local network cloak - design principle)

- **14 items staged for ROADMAP (7 T4 + 7 F4)**
- **Next: T1 (System Architecture)**

---

## Module Evaluations

### T4: Encryption & Passcode ✅ COMPLETE

**Evaluated:** 2026-01-22 | **Ideas:** 12/12 | **Phase 1, Order 1**

| ID    | Idea                     | Decision       | Details                                    |
| ----- | ------------------------ | -------------- | ------------------------------------------ |
| T4.1  | 6-digit PIN passcode     | ✅ Accept M5   | Tab-level PIN lock (Journal + Growth tabs) |
| T4.2  | PBKDF2 key derivation    | ✅ Accept M5   | Bundled with T4.1                          |
| T4.3  | AES-256-GCM encryption   | ✅ Accept M5   | Bundled with T4.1                          |
| T4.4  | Encrypt Step 4 inventory | ✅ Accept M5   | ALL step work & inventories encrypted      |
| T4.5  | Encrypt journal entries  | 🔗 Merge T4.1  | Already covered by tab-level encryption    |
| T4.6  | Recovery key generation  | ✅ Accept M5   | Recovery key only; no server-side recovery |
| T4.7  | DEK/KEK key wrapping     | ✅ Accept M5   | Industry-standard key architecture         |
| T4.8  | Cloud escrow (encrypted) | ❌ Reject      | Conflicts with privacy-first architecture  |
| T4.9  | Auto-lock timeout        | ✅ Accept M5   | Configurable (default 5 min)               |
| T4.10 | Biometric unlock         | ⏸️ Defer       | Requires native app; revisit at T8         |
| T4.11 | Phase 1 vs Phase 2 plan  | 🔗 Merge       | Already implicit in accepted items         |
| T4.12 | Security questions       | 📋 Acknowledge | Reference; confirms correct approach       |

**Summary:** 6 accepted (M5), 1 deferred, 1 rejected, 2 merged, 1 acknowledged

### F4: Offline/Privacy ✅ COMPLETE

**Evaluated:** 2026-01-22 | **Ideas:** 15/15 | **Phase 1, Order 2**

| ID    | Idea                  | Decision            | Details                                  |
| ----- | --------------------- | ------------------- | ---------------------------------------- |
| F4.1  | Offline Queue (Trust) | ✅ Accept M5        | Status pill showing sync state           |
| F4.2  | Burn After Reading    | ✅ Accept M6+       | Deferred to native for secure deletion   |
| F4.3  | Biometric Step Vault  | 🔗 Merge T4.1+T4.10 | Covered by PIN (M5) + biometric (native) |
| F4.4  | Stealth Mode          | ⏸️ Defer            | Requires native for icon switching       |
| F4.5  | Guest Mode (Sandbox)  | ✅ Accept M5        | Try before sign-up with local storage    |
| F4.6  | Conflict-Safe Sync    | 🔗 Merge T3         | Will evaluate with T3 module             |
| F4.7  | Selective Sync        | ✅ Accept M5        | Granular privacy toggles per data type   |
| F4.8  | Metadata Scrubber     | 🔗 Merge T5         | Will implement with exports              |
| F4.9  | Flip-to-Hide Gesture  | ❌ Reject           | Auto-lock sufficient; unreliable in PWA  |
| F4.10 | Nuclear Option        | ✅ Accept M5        | 3-step account deletion + GDPR           |
| F4.11 | Shoulder Surf Blur    | ⏸️ Defer            | Nice-to-have; auto-lock covers use case  |
| F4.12 | No-Tracking Dashboard | ✅ Accept M5        | Transparency screen in settings          |
| F4.13 | Inactivity Lock       | 🔗 Merge T4.9       | Already covered by auto-lock             |
| F4.14 | Snapshot Protection   | ✅ Accept M5        | Logo overlay on app background           |
| F4.15 | Local Network Cloak   | 📋 Acknowledge      | Design principle; in privacy dashboard   |

**Summary:** 6 accepted M5, 1 accepted M6+, 2 deferred, 1 rejected, 4 merged, 1
acknowledged

### T1: System Architecture ⏸️ IN PROGRESS

**Evaluated:** 2026-01-23 | **Ideas:** 6/18 | **Phase 1, Order 3**

| ID    | Idea                           | Decision        | Details                                    |
| ----- | ------------------------------ | --------------- | ------------------------------------------ |
| T1.1  | Use Dexie.js for IndexedDB     | 🔗 Merge Q7     | Already decided in foundational question   |
| T1.2  | Custom mutation queue          | ✅ Accept M5-F1 | Core offline infrastructure                |
| T1.3  | UI always reads from local     | ✅ Accept M5-F1 | Local-first read pattern                   |
| T1.4  | Background sync worker         | ✅ Accept M5-F1 | Sync engine with iOS fallback bundled      |
| T1.5  | Sync-on-open strategy for iOS  | 🔗 Merge T1.4   | iOS fallback implementation detail of T1.4 |
| T1.6  | Persisted Storage API request  | Not evaluated   |                                            |
| T1.7  | Read pipeline with staleness   | Not evaluated   |                                            |
| T1.8  | Write pipeline (local-first)   | Not evaluated   |                                            |
| T1.9  | Network detection + retry      | Not evaluated   |                                            |
| T1.10 | Exponential backoff retries    | Not evaluated   |                                            |
| T1.11 | Queue depth visibility         | Not evaluated   |                                            |
| T1.12 | Sync & Storage settings panel  | Not evaluated   |                                            |
| T1.13 | React Query integration        | Not evaluated   |                                            |
| T1.14 | iOS PWA constraint mitigations | Not evaluated   |                                            |
| T1.15 | Storage quota management       | Not evaluated   |                                            |
| T1.16 | Export backup flow             | Not evaluated   |                                            |
| T1.17 | useOfflineFirst hook           | Not evaluated   |                                            |
| T1.18 | Why not PouchDB/RxDB analysis  | Not evaluated   |                                            |

**Summary:** 3 accepted M5-F1, 2 merged (Q7, T1.4), 12 remaining

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

_Accepted ideas are staged here until user requests
`/expansion-evaluation push-to-roadmap`_

### Placement Strategy (Decided 2026-01-22)

**New Milestone: M4.5 - Security & Privacy (Q2 2026)** Insert after M4, before
M5. Contains all encryption infrastructure and privacy-first UX features.

**New Milestone: M9 - Native App Features (2027)** Insert after M8, before M10.
For features requiring native app (from T8 evaluation).

#### Feature Group Registry (authoritative)

| Milestone | Group | Name                     | Notes / Intended Contents                                   |
| --------- | ----- | ------------------------ | ----------------------------------------------------------- |
| M4.5      | F1    | Encryption Foundation    | Key mgmt, encryption primitives, recovery, auto-lock, etc.  |
| M4.5      | F2    | Privacy & Data Controls  | Sync transparency, guest mode, selective sync, delete, etc. |
| M9        | F1    | Native Security Features | Biometric unlock, stealth/icon switching, secure deletion.  |
| M10       | F1    | Future Enhancements      | Post-launch improvements and nice-to-haves.                 |

### Staged Items with Full Placement

**Relationship codes (machine-readable):**

- `NEW` - New standalone feature
- `BUNDLED_WITH:<ID>` - Technical implementation bundled with another item
- `REQUIRES_NATIVE` - Requires native app capabilities
- `FUTURE_ENHANCEMENT` - Post-launch enhancement

| ID    | Idea                              | Placement | Insert After | Relationship      | Rationale                                  | Date       |
| ----- | --------------------------------- | --------- | ------------ | ----------------- | ------------------------------------------ | ---------- |
| T4.1  | Tab-level PIN passcode            | M4.5-F1   | MILESTONE:M4 | NEW               | Core encryption feature; privacy-first     | 2026-01-22 |
| T4.2  | PBKDF2 key derivation             | M4.5-F1   | ITEM:T4.1    | BUNDLED_WITH:T4.1 | Technical implementation for T4.1          | 2026-01-22 |
| T4.3  | AES-256-GCM encryption            | M4.5-F1   | ITEM:T4.2    | BUNDLED_WITH:T4.1 | Technical implementation for T4.1          | 2026-01-22 |
| T4.4  | Encrypt ALL step work/inventories | M4.5-F1   | ITEM:T4.3    | NEW               | Maximum privacy for sensitive content      | 2026-01-22 |
| T4.6  | Recovery key generation           | M4.5-F1   | ITEM:T4.4    | NEW               | Critical for user data recovery            | 2026-01-22 |
| T4.7  | DEK/KEK key wrapping model        | M4.5-F1   | ITEM:T4.6    | NEW               | Industry-standard; enables future features | 2026-01-22 |
| T4.9  | Auto-lock timeout                 | M4.5-F1   | ITEM:T4.7    | NEW               | Standard security UX; configurable         | 2026-01-22 |
| F4.1  | Offline Queue (Trust Indicator)   | M4.5-F2   | ITEM:T4.9    | NEW               | Visible sync status; builds user trust     | 2026-01-22 |
| F4.5  | Guest Mode (Sandbox)              | M4.5-F2   | ITEM:F4.1    | NEW               | Try before sign-up; privacy-first          | 2026-01-22 |
| F4.7  | Selective Sync                    | M4.5-F2   | ITEM:F4.5    | NEW               | Granular control over cloud sync           | 2026-01-22 |
| F4.10 | Nuclear Option (Account Delete)   | M4.5-F2   | ITEM:F4.7    | NEW               | GDPR compliance; 3-step deletion           | 2026-01-22 |
| F4.12 | No-Tracking Dashboard             | M4.5-F2   | ITEM:F4.10   | NEW               | Transparency builds trust                  | 2026-01-22 |
| F4.14 | Snapshot Protection               | M4.5-F2   | ITEM:F4.12   | NEW               | Prevents app switcher snooping             | 2026-01-22 |
| F4.2  | Burn After Reading                | M9-F1     | ITEM:F4.14   | REQUIRES_NATIVE   | Secure deletion requires native app        | 2026-01-22 |

**M4.5-F1:** Encryption Foundation (7 items) **M4.5-F2:** Privacy & Data
Controls (6 items) **M9-F1:** Native Security Features (1 item; 2 more from
deferred section)

---

## Deferred Ideas Summary

_Deferred items also get ROADMAP placement for future push_

| ID    | Idea               | Placement | Insert After | Relationship       | Reason                                  | Revisit When |
| ----- | ------------------ | --------- | ------------ | ------------------ | --------------------------------------- | ------------ |
| T4.10 | Biometric unlock   | M9-F1     | MILESTONE:M8 | REQUIRES_NATIVE    | Requires native app (PWA limitation)    | T8 eval      |
| F4.4  | Stealth Mode       | M9-F1     | ITEM:T4.10   | REQUIRES_NATIVE    | Requires native for icon switching      | T8 eval      |
| F4.11 | Shoulder Surf Blur | M10-F1    | END:M10      | FUTURE_ENHANCEMENT | Nice-to-have; auto-lock covers use case | Post-launch  |

**M9-F1:** Native Security Features (2 items deferred until T8 Native Path
evaluation + 1 from staged section) **M10:** Future Enhancements (1 item,
post-launch consideration)

---

## Rejected Ideas Summary

| ID   | Idea                         | Reason                                                          |
| ---- | ---------------------------- | --------------------------------------------------------------- |
| T4.8 | Cloud escrow (encrypted key) | Conflicts with privacy-first; creates server-side attack vector |
| F4.9 | Flip-to-Hide Gesture         | Auto-lock sufficient; accelerometer unreliable in PWA           |

---

## Merged with Existing ROADMAP Items

_None yet_

---

## Version History

| Version | Date       | Description                                                                                     |
| ------- | ---------- | ----------------------------------------------------------------------------------------------- |
| 1.0     | 2026-01-20 | Initial tracker creation with 21 modules                                                        |
| 2.0     | 2026-01-21 | Foundational framework complete; all 12 Qs answered; 7-phase eval order; staged ROADMAP process |
| 2.1     | 2026-01-22 | Added placement metadata (Placement, Insert After, Relationship columns); defined M4.5 and M9   |
