# Expansion Evaluation Tracker

**Document Version:** 2.5 **Created:** 2026-01-20 | **Last Updated:** 2026-01-24

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

> **Last Session:** 2026-01-24 (ALL 21 MODULES COMPLETE 🎉) **Last Evaluated:**
> T9 Open Questions & Future (12/12 ideas evaluated) **Total Evaluated:**
> 280/280 ideas across 21 modules **Placement Status:** ~85 items staged for
> ROADMAP across M4.5/M5/M6/M7/M9/M10 **Next Action:** ROADMAP Review &
> Reorganization session (see section above) **Open Questions:** All 12
> foundational resolved ✅ **Ready to Push:** All staged items ready (use
> `/expansion-evaluation push-to-roadmap`) **Key Outcomes:**
>
> - M5: Offline infrastructure, step work worksheets, encryption foundation
> - M6: 10+ journaling features (Pattern Matcher, Time Capsule, Wave, etc.)
> - M7: 50+ features (sponsor, exports, Nashville, knowledge base,
>   personalization)
> - M9: Native path via Capacitor (biometrics, secure storage, health APIs)
> - M10: Visionary features deferred (AI companion, beacon, service exchange)

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

## Final Step: ROADMAP Review & Reorganization

**✅ COMPLETED: 2026-01-24**

The ROADMAP Review & Reorganization session has been completed. All deliverables
achieved through Phase B Full Analysis (passes B1-B6).

### Deliverables Completed

1. ✅ **ROADMAP.md v3.9** - Refined with optimized milestone structure
   - Added M4.5 (Security & Privacy) and M9 (Native App) milestones
   - Split M2 into M2.1/M2.2/M2.3 and M7 into M7.1/M7.2/M7.3/M7.4
   - Removed 8 duplicates, relocated 4 items, assigned 28 priorities
   - Added ⚡ cross-references and 🔬 R&D notes

2. ✅ **Cross-module dependency map** - `analysis/full_dependencies.md`
   - 85 key items analyzed with item-level dependencies
   - 8 critical blockers identified (T4.3, T1.2, T8.1, T2.2)
   - 0 circular dependencies found

3. ✅ **Implementation sequencing strategy** -
   `analysis/PARALLEL_EXECUTION_GUIDE.md`
   - 7 parallelization groups identified
   - 15-week potential timeline savings
   - Resource requirements and execution order documented

4. ✅ **Risk mitigation plan** - M8 exit criteria with go/no-go decision table
   - PWA limitations, user feedback, cost/benefit, app store readiness criteria
   - Clear signals for M9 native app go/no-go decision

5. ✅ **Updated effort estimates** - `analysis/effort_estimates.md`
   - All items classified E0-E3
   - Milestone capacity validated

### Analysis Artifacts

| Document                               | Purpose                               |
| -------------------------------------- | ------------------------------------- |
| `analysis/FULL_ANALYSIS_SUMMARY.md`    | Consolidated findings from all passes |
| `analysis/full_dependencies.md`        | Item-level dependency mapping         |
| `analysis/full_categorization.md`      | 396 items across 11 categories        |
| `analysis/PARALLEL_EXECUTION_GUIDE.md` | Timeline optimization guide           |

**Next Step:** Begin M4.5 implementation (Security & Privacy milestone)

---

## Progress Summary

| Category  | Modules | Ideas | Reviewed | Decided | Pending |
| --------- | ------- | ----- | -------- | ------- | ------- |
| Feature   | 12      | 175   | 175      | 175     | 0       |
| Technical | 9       | 105   | 105      | 105     | 0       |
| **Total** | **21**  | 280   | **280**  | **280** | **0**   |

**🎉 ALL MODULES COMPLETE - Ready for ROADMAP Review & Reorganization**

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
| F1  | Step Work Depth         | 51    | 51       | ✅ Complete | 2     |
| F2  | Sponsor Tooling         | 11    | 11       | ✅ Complete | 3     |
| F3  | Nashville Advantage     | 8     | 8        | ✅ Complete | 4     |
| F4  | Offline/Privacy         | 15    | 15       | ✅ Complete | 1     |
| F5  | Journaling & Insights   | 15    | 15       | ✅ Complete | 2     |
| F6  | Recovery Knowledge Base | 12    | 12       | ✅ Complete | 4     |
| F7  | Exports & Reports       | 11    | 11       | ✅ Complete | 3     |
| F8  | Personalization         | 11    | 11       | ✅ Complete | 5     |
| F9  | Daily Engagement        | 11    | 11       | ✅ Complete | 2     |
| F10 | Safety & Harm Reduction | 10    | 10       | ✅ Complete | 5     |
| F11 | Visionary/Dream Big     | 10    | 10       | ✅ Complete | 7     |
| F12 | Final Gaps              | 11    | 11       | ✅ Complete | 7     |

### Technical Modules (T1-T9)

| ID  | Module                   | Ideas | Reviewed | Status      | Phase |
| --- | ------------------------ | ----- | -------- | ----------- | ----- |
| T1  | System Architecture      | 18    | 18       | ✅ Complete | 1     |
| T2  | Data Model & Firestore   | 12    | 12       | ✅ Complete | 2     |
| T3  | Offline Queue & Conflict | 15    | 15       | ✅ Complete | 1     |
| T4  | Encryption & Passcode    | 12    | 12       | ✅ Complete | 1     |
| T5  | Exports & PDF            | 10    | 10       | ✅ Complete | 3     |
| T6  | Analytics Plan           | 8     | 8        | ✅ Complete | 6     |
| T7  | Tech Debt & Quality      | 10    | 10       | ✅ Complete | 6     |
| T8  | Native Path              | 8     | 8        | ✅ Complete | 7     |
| T9  | Open Questions & Future  | 12    | 12       | ✅ Complete | 7     |

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

### Session: 2026-01-24 (T2 + F5 Complete)

- **T2 Data Model & Firestore: 12/12 ideas evaluated**
- **F5 Journaling & Insights: 15/15 ideas evaluated**
- F5.2 Pattern Matcher bundles: F5.3 (weather viz), F5.7 (HALT heat map), F5.13
  (context tags)
- M6 gets 10 journaling features (Pattern Matcher, Gratitude Mosaic, Time
  Capsule, The Wave, Rant Room, Unsent Letter, Dynamic Prompts, Meeting
  Takeaways, Brain Dump)
- F5.8 Service Points → M7-F2 (esteemable acts for Step 12)
- F5.1 Tag as Inventory → M5-F3 (journal to Step 4 bridge)
- Split features: F5.4 (core M6, widget M9), F5.9 (basic M6, tone M9)
- Deferred: F5.15 (Symptom vs Feeling - needs UX research)
- **34 items now staged for ROADMAP** (up from 23)

**T2 Decisions:**

- Accepted M5-F1 (3): T2.2 (sharedPackets), T2.8 (SyncState), T2.12 (soft
  delete)
- Accepted M7-F1 (1): T2.4 (sponsor contact storage - revised from
  metadata-only)
- Merged (6): T2.3→Q5+T2.2, T2.5-7→T2.2, T2.10→M5-F2, T2.11→T3
- Deferred (1): T2.9→T6 (Analytics Plan)
- Acknowledged (1): T2.1 (already implemented)
- **Key Decision:** User preference to store sponsor contact data (name, phone,
  email) for offline emergency access, rather than just UID reference
- **sharedPackets schema consolidation:** T2.5 (immutability), T2.6 (expiry),
  T2.7 (revocation) merged into T2.2 schema design

### Session: 2026-01-24 (BATCH COMPLETE - ALL 21 MODULES) 🎉

**Batch evaluated remaining 14 modules (142 ideas):**

- F9: Daily Engagement (11) → 6 M6, 2 M7, 2 deferred M9, 2 merged
- F2: Sponsor Tooling (11) → 9 M7, 2 merged
- F7: Exports & Reports (11) → 9 M7, 1 M6, 1 merged
- T5: Exports & PDF (10) → 6 M7, 4 merged
- F3: Nashville Advantage (8) → 8 M7
- F6: Recovery Knowledge Base (12) → 11 M7, 1 M6
- F10: Safety & Harm Reduction (10) → 4 M6, 5 M7, 1 merged
- F8: Personalization (11) → 11 M7
- T7: Tech Debt & Quality (10) → 3 M5, 5 merged, 1 acknowledged
- T6: Analytics Plan (8) → 5 M7, 1 merged, 1 rejected, 1 acknowledged
- F11: Visionary/Dream Big (10) → 2 M7, 7 deferred, 1 merged
- T8: Native Path (8) → 3 M9, 2 merged, 1 deferred, 1 rejected, 1 acknowledged
- F12: Final Gaps (11) → 5 M7, 2 M6, 3 deferred M9, 1 merged
- T9: Open Questions (12) → 4 M7, 6 merged, 2 deferred

**Final Milestone Distribution:**

- M4.5 (Security): 13 items (encryption + privacy controls)
- M5 (Offline/Steps): 12 items (infrastructure + worksheets + quality)
- M6 (Journaling): 17 items (pattern matcher, engagement, safety, onboarding)
- M7 (Fellowship): ~50 items (sponsor, exports, Nashville, knowledge,
  personalization, analytics)
- M9 (Native): 10 items (Capacitor, biometrics, health APIs, deferred native
  features)
- M10 (Future): 8 items (visionary features requiring significant
  infrastructure)

**Key Decisions:**

- T8: Capacitor chosen over Expo (4/5 AI consensus) - preserves Next.js codebase
- T6: Firebase Analytics retained; PostHog rejected; privacy toggle mandatory
- F11: Most visionary features deferred (BLE beacon, AI companion, service
  exchange)
- F12: Bio-rhythm features (sleep, HR, movement) require native → M9
- T9: FlexSearch for local-first search; both code + QR for sponsor links

**NEXT STEP: Schedule dedicated ROADMAP Review & Reorganization session**

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

### T1: System Architecture ✅ COMPLETE

**Evaluated:** 2026-01-23 | **Ideas:** 18/18 | **Phase 1, Order 3**

| ID    | Idea                           | Decision        | Details                                    |
| ----- | ------------------------------ | --------------- | ------------------------------------------ |
| T1.1  | Use Dexie.js for IndexedDB     | 🔗 Merge Q7     | Already decided in foundational question   |
| T1.2  | Custom mutation queue          | ✅ Accept M5-F1 | Core offline infrastructure                |
| T1.3  | UI always reads from local     | ✅ Accept M5-F1 | Local-first read pattern                   |
| T1.4  | Background sync worker         | ✅ Accept M5-F1 | Sync engine with iOS fallback bundled      |
| T1.5  | Sync-on-open strategy for iOS  | 🔗 Merge T1.4   | iOS fallback implementation detail of T1.4 |
| T1.6  | Persisted Storage API request  | ✅ Accept M5-F1 | Early request + fallback to online-only    |
| T1.7  | Read pipeline with staleness   | 🔗 Merge T1.11  | Unified "Sync Status" with queue depth     |
| T1.8  | Write pipeline (local-first)   | 🔗 Merge T1.2   | Write side of offline infrastructure       |
| T1.9  | Network detection + retry      | 🔗 Merge T1.4   | Network awareness for sync engine          |
| T1.10 | Exponential backoff retries    | 🔗 Merge T1.4   | Retry reliability for sync engine          |
| T1.11 | Queue depth visibility         | ✅ Accept M5-F1 | Unified sync status (staleness + queue)    |
| T1.12 | Sync & Storage settings panel  | ✅ Accept M5-F1 | Full settings: offline, sync, storage mgmt |
| T1.13 | React Query integration        | ❌ Reject       | Conflicts with offline-first architecture  |
| T1.14 | iOS PWA constraint mitigations | 🔗 Merge Multi  | Cross-cutting: T1.4/5/6/12/15 handle iOS   |
| T1.15 | Storage quota management       | 🔗 Merge T1.6   | Storage management cluster with T1.6/T1.12 |
| T1.16 | Export backup flow             | 🔗 Merge T5+F7  | Evaluate exports holistically (21 ideas)   |
| T1.17 | useOfflineFirst hook           | 🔗 Merge T1.2   | Hook API is implementation detail of T1.2  |
| T1.18 | Why not PouchDB/RxDB analysis  | 📝 Document ADR | Architecture Decision Record for rationale |

**Summary:** 6 accepted M5-F1, 10 merged (T1.1→Q7, T1.5/8/9/10/17→T1.2/4,
T1.7→T1.11, T1.14→Multi, T1.15→T1.6, T1.16→T5+F7), 1 rejected (T1.13), 1
document (T1.18 ADR)

**T1.6 + T1.15 Implementation Notes (Storage Management):**

- **T1.6 (Persistent Storage):** Request after first journal entry with clear
  warning
- **T1.15 (Quota Management):** Monitor usage, warn at 80%/90%/95%, cleanup
  tools
- **Combined "Storage Management" cluster in T1.12 Settings Panel**
- Persistent storage permission + quota monitoring + usage display
- If permission denied: Offer "Online-Only Mode" (Firestore only, no local)
- iOS-specific: Handle 50MB hard limit (T1.14)
- Smart cleanup: Delete oldest synced entries, export-before-delete

**T1.11 Implementation Notes (Unified Sync Status):**

- Combined T1.7 (staleness) + T1.11 (queue depth) into single feature
- Header badge: "Last synced 2h ago • 3 pending uploads"
- Color coding: 🟢 synced, 🟡 stale, 🔴 errors
- Smart visibility: auto-hide when all synced (reduces noise)
- Tap to expand for detailed sync stats in settings
- Priority: Medium (ship after core sync T1.2-T1.4 works)

**T1.12 Implementation Notes (Settings Panel):**

- All 5 AIs unanimous - marked "high priority"
- Full settings: offline toggle, manual sync, storage management
- Natural integration point for T1.6 (persistent storage), T1.11 (sync status),
  T1.15 (quota)
- MVP controls: offline mode toggle, manual sync button, storage usage display
- Advanced: view sync queue, clear cache, detailed stats
- Start simple and expand over time

**T1.18 Documentation Task (ADR):**

- Create Architecture Decision Record:
  `docs/architecture/ADR-001-offline-sync-approach.md`
- Document decision, context, alternatives (PouchDB/RxDB), rationale
- Explain why custom sync (T1.2-T1.4) + Dexie.js (T1.1) over off-the-shelf
  solutions
- Prevents future revisiting of already-decided architectural questions
- Standard ADR format, ~30 minutes to write

### T3: Offline Queue & Conflict ✅ COMPLETE

**Evaluated:** 2026-01-23 | **Ideas:** 15/15 | **Phase 1, Order 4**

| ID    | Idea                                  | Decision        | Details                                     |
| ----- | ------------------------------------- | --------------- | ------------------------------------------- |
| T3.1  | Queue item format (ULID, status, etc) | 🔗 Merge T1.2   | Schema is implementation detail of T1.2     |
| T3.2  | Mutation types enum                   | 🔗 Merge T1.2   | Part of queue schema (T3.1)                 |
| T3.3  | Content hash comparison (SHA-256)     | ✅ Accept M5-F1 | Bundled: Conflict Resolution Strategy       |
| T3.4  | Append-only detection for journal     | ✅ Accept M5-F1 | Bundled: Conflict Resolution Strategy       |
| T3.5  | Row-level merge for Step 4            | ✅ Accept M5-F1 | Bundled: Conflict Resolution Strategy       |
| T3.6  | Last-write-wins for settings          | ✅ Accept M5-F1 | Bundled: Conflict Resolution Strategy       |
| T3.7  | Conflict banner in ribbon             | ✅ Accept M5-F1 | Bundled: Conflict Resolution UI             |
| T3.8  | Conflict resolution UI (keep/merge)   | ✅ Accept M5-F1 | Bundled: Conflict Resolution UI (All 5 AIs) |
| T3.9  | "Resolve later" option                | ✅ Accept M5-F1 | Bundled: Conflict Resolution UI             |
| T3.10 | useOfflineQueue hook                  | 🔗 Merge T1.2   | Hook abstraction (like T1.17)               |
| T3.11 | Sync worker single pass logic         | 🔗 Merge T1.4   | Sync engine implementation detail           |
| T3.12 | Retry with backoff                    | 🔗 Merge T1.4   | Already covered by T1.10→T1.4               |
| T3.13 | Dead letter queue for failed items    | ✅ Accept M5-F1 | Handle permanent failures                   |
| T3.14 | Queue compaction for long offline     | ⏸️ Defer        | Optimization for v2, not critical           |
| T3.15 | Rev integer for simple versioning     | 🔗 Merge T1.2   | Versioning for conflict detection           |

**Summary:** 3 accepted M5-F1 (bundled: Conflict Strategy, Conflict UI, Dead
Letter Queue), 6 merged (T3.1/2/10/15→T1.2, T3.11/12→T1.4), 1 deferred (T3.14)

**T3 M5-F1 Features (3 bundled features):**

1. **Conflict Resolution Strategy (T3.3-T3.6):**
   - Content hash comparison (SHA-256) for conflict detection
   - Append-only detection for journal entries (auto-resolve)
   - Row-level merge for Step 4 inventory (granular resolution)
   - Last-write-wins for settings (simple overwrite)
   - Core algorithm layer for conflict handling

2. **Conflict Resolution UI (T3.7-T3.9):**
   - Conflict banner in ribbon (visual indicator)
   - Conflict resolution modal (keep local / keep server / merge)
   - "Resolve later" option (defer decision, track unresolved)
   - All 5 AIs agreed this is essential

3. **Dead Letter Queue (T3.13):**
   - Separate queue for permanently failed mutations
   - Manual intervention/review for items that exhausted retries
   - Prevents data loss from silent failures
   - Essential for production reliability

### F1: Step Work Depth ✅ COMPLETE

**Evaluated:** 2026-01-23 | **Ideas:** 51/51 | **Phase 2, Order 5**

**Summary:** 4 staged features using Option C structure (separate worksheets,
enhancements, tools): 3 step-work feature groups (`M5-F2`/`M5-F3`/`M5-F4`) plus
speech-to-text elevated to an app-wide feature (`M5-F0`). Established per-step
bundling pattern (12 steps × 4 step-specific tools = 48), plus 3 universal tools
shared across all steps (51 total tools). All step work requires an R&D phase
for ubiquitous exercises.

**Structure Decision:** Option C - Separate backbone + enhancements + tools

- **M5-F2**: Step Work Worksheets (Steps 2-9, 11-12) - text-based foundations
  with R&D
- **M5-F3**: Step Work Interactive Enhancements (Steps 1-12) -
  visual/interactive tools (build after worksheets validated)
- **M5-F4**: Step Work Context Tools - Unstuck button + Reference sidebar
  (universal helpers)
- **M5-F0**: App-Wide Speech-to-Text (elevated from step work to universal input
  feature)

**Key Decisions:**

- All 12 steps need worksheet backbone (like existing Steps 1 & 10)
- Interactive tools are optional enhancements (progressive enhancement strategy)
- User feedback on worksheets determines enhancement scope ("seeing end product
  is final determination")
- Speech-to-text must be fast, smooth, available on ALL text inputs (not just
  step work)
- R&D phase required to identify ubiquitous exercises across all steps

**Existing Features (accounted for):**

- Step 1 worksheet (Powerlessness & Unmanageability) - exists
- Step 10 Nightly Inventory - exists
- Spot Check Inventory - exists
- Gratitude List - exists

**Pattern Established:**

- Per-step bundling (4 tools per step workspace)
- Worksheets first, enhancements later (risk mitigation)
- Universal tools benefit all steps (high ROI)

**Dependencies:**

- T4 (Encryption) - all step work encrypted
- T2 (Data model) - structured storage
- T1 (Offline) - works without connection

### T2: Data Model & Firestore ✅ COMPLETE

**Evaluated:** 2026-01-24 | **Ideas:** 12/12 | **Phase 2, Order 6**

| ID    | Idea                              | Decision         | Details                                     |
| ----- | --------------------------------- | ---------------- | ------------------------------------------- |
| T2.1  | User-scoped journal entries       | 📋 Acknowledge   | Already implemented in codebase             |
| T2.2  | Separate sharedPackets collection | ✅ Accept M5-F1  | Foundational schema for sponsor sharing     |
| T2.3  | Push model (not pull)             | 🔗 Merge Q5+T2.2 | Implicit in Q5 decision + T2.2 design       |
| T2.4  | Sponsor contact data storage      | ✅ Accept M7-F1  | Revised: store name/phone/email for offline |
| T2.5  | Packet immutability               | 🔗 Merge T2.2    | Snapshots are immutable by design           |
| T2.6  | Auto-expiry for packets           | 🔗 Merge T2.2    | expiresAt field in sharedPackets schema     |
| T2.7  | Revocation via status             | 🔗 Merge T2.2    | status field in sharedPackets schema        |
| T2.8  | SyncState per device              | ✅ Accept M5-F1  | Multi-device sync awareness                 |
| T2.9  | Telemetry daily counters          | ⏸️ Defer T6      | Define during Analytics Plan evaluation     |
| T2.10 | Step packets structured schema    | 🔗 Merge M5-F2   | Define during worksheet R&D phase           |
| T2.11 | localVersion field                | 🔗 Merge T3      | Implementation detail of conflict detection |
| T2.12 | Soft delete pattern               | ✅ Accept M5-F1  | Foundational for offline-safe deletes       |

**Summary:** 3 accepted M5-F1 (T2.2, T2.8, T2.12), 1 accepted M7-F1 (T2.4
revised), 6 merged, 1 deferred, 1 acknowledged

**T2.2 Implementation Notes (with T2.3, T2.5, T2.6, T2.7 merged):**

```javascript
/sharedPackets/{packetId}
{
  packetId: string,
  creatorUid: string,
  recipientUid: string,
  type: "step4" | "journal" | "progress",
  snapshot: { /* immutable frozen data (T2.5) */ },
  createdAt: Timestamp,
  expiresAt: Timestamp | null,     // T2.6: auto-expiry
  status: "active" | "revoked",    // T2.7: revocation
  revokedAt?: Timestamp
}
// Push model (T2.3) enforced via security rules - only creator can write
```

**T2.4 Implementation Notes (Revised - Sponsor Contact Storage):**

```javascript
/users/{uid}/sponsorContact
{
  name: string,              // User-entered sponsor name
  phone: string,             // For one-tap call / emergency button
  email?: string,            // Optional
  linkedUid?: string,        // If sponsor also uses SoNash
  connectedAt: Timestamp,
  notes?: string             // User's private notes
}
// Enables offline access to sponsor contact for emergency "I need help" button
```

### F5: Journaling & Insights ✅ COMPLETE

**Evaluated:** 2026-01-24 | **Ideas:** 15/15 | **Phase 2, Order 7**

| ID    | Idea                    | Decision        | Details                                        |
| ----- | ----------------------- | --------------- | ---------------------------------------------- |
| F5.1  | Tag as Inventory        | ✅ Accept M5-F3 | Journal → Step 4 conversion bridge             |
| F5.2  | Pattern Matcher         | ✅ Accept M6    | Local correlation insights (bundled F5.3/7/13) |
| F5.3  | Recovery Weather Report | 🔗 Merge F5.2   | Visualization layer of Pattern Matcher         |
| F5.4  | Gratitude Mosaic        | ✅ Accept M6+M9 | Core mosaic M6; widget/shake M9 native         |
| F5.5  | Time Capsule            | ✅ Accept M6    | On This Day reflection with growth tags        |
| F5.6  | The Wave (Urge Log)     | ✅ Accept M6    | Timer proving cravings pass                    |
| F5.7  | HALT Check Engine Light | 🔗 Merge F5.2   | Already exists; heat map is pattern viz        |
| F5.8  | Service Points          | ✅ Accept M7    | Esteemable acts tracking for Step 12           |
| F5.9  | Rant Room (Audio Dump)  | ✅ Accept M6+M9 | Basic audio M6; tone analysis M9 native        |
| F5.10 | Unsent Letter           | ✅ Accept M6    | Therapeutic writing with "Release" ritual      |
| F5.11 | Dynamic Prompts         | ✅ Accept M6    | Recovery-stage and time-aware questions        |
| F5.12 | Meeting Takeaways       | ✅ Accept M6    | One-line wisdom capture with speaker           |
| F5.13 | Context Tags            | 🔗 Merge F5.2   | Location/company data for Pattern Matcher      |
| F5.14 | Brain Dump              | ✅ Accept M6    | Timed freewriting sprint with nudge            |
| F5.15 | Symptom vs Feeling      | ⏸️ Defer        | Needs UX research; close to medical territory  |

**Summary:** 8 accepted M6, 1 accepted M5-F3, 1 accepted M7, 2 split (M6+M9), 3
merged→F5.2, 1 deferred

**F5.2 Pattern Matcher Bundle (M6):**

- Core pattern detection (day/mood, trigger/action correlations)
- Recovery Weather visualization (F5.3)
- HALT heat map calendar (F5.7)
- Context Tags data layer (F5.13: location + company)
- "Sponsor Flag" for repeat patterns

**M6 Journaling Features (10 items):** F5.2 (Pattern Matcher bundle), F5.4
(Gratitude Mosaic), F5.5 (Time Capsule), F5.6 (The Wave), F5.9 (Rant Room
basic), F5.10 (Unsent Letter), F5.11 (Dynamic Prompts), F5.12 (Meeting
Takeaways), F5.14 (Brain Dump)

### F9: Daily Engagement ✅ COMPLETE

**Evaluated:** 2026-01-24 | **Ideas:** 11/11 | **Phase 2, Order 8**

| ID    | Idea                        | Decision      | Details                                     |
| ----- | --------------------------- | ------------- | ------------------------------------------- |
| F9.1  | One Action (Dynamic Home)   | ✅ Accept M6  | Contextual suggestion engine (AM/PM/crisis) |
| F9.2  | Bookends (AM/PM Routine)    | ✅ Accept M6  | Paired check-in with intention/review       |
| F9.3  | The Wave                    | 🔗 Merge F5.6 | Already evaluated as F5.6 (Urge Log)        |
| F9.4  | Compassionate Milestones    | ✅ Accept M7  | Anti-streak; cumulative progress tracking   |
| F9.5  | Share Pocket (Meeting Prep) | ✅ Accept M7  | Flag journal entries for meeting shares     |
| F9.6  | The Pause Protocol          | ✅ Accept M6  | Haptic grounding tool for agitation         |
| F9.7  | Habit Stacker               | ✅ Accept M6  | Stack recovery actions onto existing habits |
| F9.8  | Service Snaps               | 🔗 Merge F5.8 | Already covered by Service Points           |
| F9.9  | Nashville Sound (Music)     | ⏸️ Defer M9   | Native deep links for Spotify/Apple Music   |
| F9.10 | Sleep Hygiene (Wind-Down)   | ✅ Accept M6  | Pre-sleep wizard with brain dump vault      |
| F9.11 | Drive Time Companion        | ⏸️ Defer M9   | Native car mode with voice journal          |

**Summary:** 6 accepted M6, 2 accepted M7, 2 deferred M9, 2 merged

### F2: Sponsor Tooling ✅ COMPLETE

**Evaluated:** 2026-01-24 | **Ideas:** 11/11 | **Phase 3, Order 9**

| ID    | Idea                       | Decision      | Details                                  |
| ----- | -------------------------- | ------------- | ---------------------------------------- |
| F2.1  | Sponsor Export + Redaction | ✅ Accept M7  | Pre-flight check with redaction UI       |
| F2.2  | Hard Conversation Scripts  | ✅ Accept M7  | Templates for difficult sponsor talks    |
| F2.3  | Mood-Stamped Check-In      | ✅ Accept M7  | Visual HALT card + quick dial            |
| F2.4  | Next Call Agenda (Parking) | ✅ Accept M7  | "Park for Sponsor" button on entries     |
| F2.5  | Circle of Trust            | ✅ Accept M7  | Multi-role permissions manager           |
| F2.6  | Sponsor Vetting Guide      | ✅ Accept M7  | Private checklist for potential sponsors |
| F2.7  | Sponsor Summary + Cheat    | 🔗 Merge F7   | Bundle with exports module               |
| F2.8  | Relapse Autopsy Worksheet  | ✅ Accept M7  | Collaborative debrief tool               |
| F2.9  | Shared Commitments         | ✅ Accept M7  | Digital handshake accountability         |
| F2.10 | Sponsor Prompt Library     | ✅ Accept M7  | Suggested questions for sponsors         |
| F2.11 | One-Time Share Code        | 🔗 Merge T2.2 | Already covered by sharedPackets expiry  |

**Summary:** 9 accepted M7, 2 merged

### F7: Exports & Reports ✅ COMPLETE

**Evaluated:** 2026-01-24 | **Ideas:** 11/11 | **Phase 3, Order 10**

| ID    | Idea                   | Decision      | Details                                      |
| ----- | ---------------------- | ------------- | -------------------------------------------- |
| F7.1  | Recovery Resume        | ✅ Accept M7  | Professional PDF for courts/sober living     |
| F7.2  | Step Packets           | ✅ Accept M7  | Workbook mode with margins for sponsor notes |
| F7.3  | Sponsor's Cheat Sheet  | 🔗 Merge F2.7 | Bundle with sponsor summary                  |
| F7.4  | Emergency Wallet Card  | ✅ Accept M7  | Print-and-fold pocket card generator         |
| F7.5  | Full Archive           | ✅ Accept M7  | JSON/CSV/Text export for data sovereignty    |
| F7.6  | 30-Day Retrospective   | ✅ Accept M6  | Monthly "magazine" of progress               |
| F7.7  | Clinical Hand-Off      | ✅ Accept M7  | Specialized export for therapists            |
| F7.8  | Amends Ledger          | ✅ Accept M7  | Step 9 spreadsheet export                    |
| F7.9  | Milestone Certificates | ✅ Accept M7  | Printable celebration certificates           |
| F7.10 | Service Log            | ✅ Accept M7  | Volunteer hours timesheet export             |
| F7.11 | Incident Report        | ✅ Accept M7  | 14-day "black box" relapse analysis          |

**Summary:** 9 accepted M7, 1 accepted M6, 1 merged

### T5: Exports & PDF ✅ COMPLETE

**Evaluated:** 2026-01-24 | **Ideas:** 10/10 | **Phase 3, Order 11**

| ID    | Idea                       | Decision      | Details                                  |
| ----- | -------------------------- | ------------- | ---------------------------------------- |
| T5.1  | @react-pdf/renderer        | 🔗 Merge Q8   | Already decided in foundational question |
| T5.2  | Client-side only           | ✅ Accept M7  | No server-side PDF generation (privacy)  |
| T5.3  | EXIF stripping             | ✅ Accept M7  | Canvas re-encode for metadata removal    |
| T5.4  | GPS/device sanitization    | 🔗 Merge T5.3 | Bundled with EXIF stripping              |
| T5.5  | Preview screen             | ✅ Accept M7  | Preview before generate                  |
| T5.6  | Sponsor packet builder UI  | ✅ Accept M7  | Visual packet construction               |
| T5.7  | Watermark option           | ✅ Accept M7  | "CONFIDENTIAL" watermark for sensitive   |
| T5.8  | Web Share API              | ✅ Accept M7  | Native share sheet integration           |
| T5.9  | Fallback download + mailto | 🔗 Merge T5.8 | Fallback bundled with share integration  |
| T5.10 | PDF minimal metadata       | 🔗 Merge T5.3 | Privacy bundle with EXIF stripping       |

**Summary:** 6 accepted M7, 4 merged

### F3: Nashville Advantage ✅ COMPLETE

**Evaluated:** 2026-01-24 | **Ideas:** 8/8 | **Phase 4, Order 12**

| ID   | Idea                  | Decision     | Details                                 |
| ---- | --------------------- | ------------ | --------------------------------------- |
| F3.1 | Tonight in Nashville  | ✅ Accept M7 | Best bet badge + rush hour filter       |
| F3.2 | Safe Spaces Map       | ✅ Accept M7 | Third places with late-night filter     |
| F3.3 | My Sober Circuit      | ✅ Accept M7 | Home group + routine stacking           |
| F3.4 | Meeting After Meeting | ✅ Accept M7 | Community-sourced tips for post-meeting |
| F3.5 | Broadway Escape Plan  | ✅ Accept M7 | Panic navigation for trigger zones      |
| F3.6 | Clubhouse Status Hub  | ✅ Accept M7 | Live dashboard for recovery centers     |
| F3.7 | First 72 Hours        | ✅ Accept M7 | Newcomer itinerary for Nashville        |
| F3.8 | Sober-Friendly Events | ✅ Accept M7 | Curated non-drinking social events      |

**Summary:** 8 accepted M7

### F6: Recovery Knowledge Base ✅ COMPLETE

**Evaluated:** 2026-01-24 | **Ideas:** 12/12 | **Phase 4, Order 13**

| ID    | Idea                    | Decision     | Details                                  |
| ----- | ----------------------- | ------------ | ---------------------------------------- |
| F6.1  | Plain English Steps     | ✅ Accept M7 | Translator toggle for Step language      |
| F6.2  | Am I Doing This Right?  | ✅ Accept M7 | Etiquette flowchart for scenarios        |
| F6.3  | Smart Glossary          | ✅ Accept M7 | Contextual hyperlinked definitions       |
| F6.4  | Script Lab              | ✅ Accept M7 | Roleplay scripts with vibe options       |
| F6.5  | Crisis Decision Tree    | ✅ Accept M6 | Yes/no wizard for crisis routing         |
| F6.6  | Daily Principle Deck    | ✅ Accept M7 | Randomized principle application cards   |
| F6.7  | Anatomy of a Meeting    | ✅ Accept M7 | Visual map for newcomer anxiety          |
| F6.8  | Normie Translator       | ✅ Accept M7 | Shareable cards for family members       |
| F6.9  | Service Menu            | ✅ Accept M7 | Micro-service options by difficulty      |
| F6.10 | Fellowship Compass      | ✅ Accept M7 | AA/NA/CA/SMART comparison guide          |
| F6.11 | Traditions in Real Life | ✅ Accept M7 | Relationship hacks from 12 Traditions    |
| F6.12 | Readiness Checkers      | ✅ Accept M7 | Self-reflective quizzes (dating, amends) |

**Summary:** 11 accepted M7, 1 accepted M6

### F10: Safety & Harm Reduction ✅ COMPLETE

**Evaluated:** 2026-01-24 | **Ideas:** 10/10 | **Phase 5, Order 14**

| ID     | Idea                   | Decision      | Details                               |
| ------ | ---------------------- | ------------- | ------------------------------------- |
| F10.1  | The Lifeline (Panic)   | ✅ Accept M6  | Single-tap emergency with silent mode |
| F10.2  | The Guardrails         | ✅ Accept M6  | Context-aware trauma gates            |
| F10.3  | Harm Reduction Locker  | ✅ Accept M6  | Naloxone guide + Good Samaritan law   |
| F10.4  | Compassionate U-Turn   | ✅ Accept M6  | Relapse debriefing wizard             |
| F10.5  | The Canary (Dead Man)  | ✅ Accept M7  | Timed check-in with auto-alert        |
| F10.6  | Medical ID             | ✅ Accept M7  | Lock screen wallpaper for EMTs        |
| F10.7  | Never Use Alone        | ✅ Accept M7  | Integration with spotter hotline      |
| F10.8  | Exit Strategy Scripts  | ✅ Accept M7  | Social excuses + fake call generator  |
| F10.9  | Detox Navigator        | ✅ Accept M7  | Nashville detox directory + transport |
| F10.10 | Double-Check (Pattern) | 🔗 Merge F5.2 | Pattern Matcher handles safety alerts |

**Summary:** 4 accepted M6, 5 accepted M7, 1 merged

### F8: Personalization ✅ COMPLETE

**Evaluated:** 2026-01-24 | **Ideas:** 11/11 | **Phase 5, Order 15**

| ID    | Idea                  | Decision     | Details                              |
| ----- | --------------------- | ------------ | ------------------------------------ |
| F8.1  | Rosetta Stone (Terms) | ✅ Accept M7 | AA/NA/Secular vocabulary toggle      |
| F8.2  | Journey Phase         | ✅ Accept M7 | Newcomer/Action/Maintenance UI modes |
| F8.3  | Dashboard Builder     | ✅ Accept M7 | Drag-and-drop home screen editor     |
| F8.4  | Nudge Engine          | ✅ Accept M7 | Granular notification controls       |
| F8.5  | Name Your Power       | ✅ Accept M7 | Spiritual term customization         |
| F8.6  | The Focus             | ✅ Accept M7 | Substance vs behavior tracker logic  |
| F8.7  | Notebook Aesthetics   | ✅ Accept M7 | Paper type, font, cover art theming  |
| F8.8  | The Why Anchor        | ✅ Accept M7 | Persistent motivational photo header |
| F8.9  | Accessibility Plus    | ✅ Accept M7 | Enhanced scaling + dyslexia font     |
| F8.10 | Red Line List         | ✅ Accept M7 | Trigger word content masking         |
| F8.11 | Sponsor Link Status   | ✅ Accept M7 | Hide sponsor features if no sponsor  |

**Summary:** 11 accepted M7

### T7: Tech Debt & Quality ✅ COMPLETE

**Evaluated:** 2026-01-24 | **Ideas:** 10/10 | **Phase 6, Order 16**

| ID    | Idea                          | Decision       | Details                                  |
| ----- | ----------------------------- | -------------- | ---------------------------------------- |
| T7.1  | Feature flag for offline      | ✅ Accept M5   | Gradual rollout of offline features      |
| T7.2  | PR0: Types/schemas only       | ✅ Accept M5   | PR strategy for offline implementation   |
| T7.3  | PR1: Queue + local writes     | 🔗 Merge T7.2  | Part of PR strategy                      |
| T7.4  | PR2: UI indicators + settings | 🔗 Merge T7.2  | Part of PR strategy                      |
| T7.5  | PR3: Sync worker + conflicts  | 🔗 Merge T7.2  | Part of PR strategy                      |
| T7.6  | PR4: Conflict resolution UI   | 🔗 Merge T7.2  | Part of PR strategy                      |
| T7.7  | PR5: Encryption Phase 1       | 🔗 Merge T7.2  | Part of PR strategy                      |
| T7.8  | Unit tests for conflicts      | ✅ Accept M5   | Critical testing for offline reliability |
| T7.9  | Firebase emulator tests       | ✅ Accept M5   | Integration testing infrastructure       |
| T7.10 | Strict typing (no any)        | 📋 Acknowledge | Already enforced via SonarCloud          |

**Summary:** 3 accepted M5 (T7.1, T7.2, T7.8, T7.9), 5 merged, 1 acknowledged

### T6: Analytics Plan ✅ COMPLETE

**Evaluated:** 2026-01-24 | **Ideas:** 8/8 | **Phase 6, Order 17**

| ID   | Idea                      | Decision       | Details                                     |
| ---- | ------------------------- | -------------- | ------------------------------------------- |
| T6.1 | PostHog recommendation    | ❌ Reject      | Firebase Analytics already in stack         |
| T6.2 | Firebase Analytics        | 📋 Acknowledge | Already in use; continue with existing      |
| T6.3 | Action event taxonomy     | ✅ Accept M7   | Define standard event naming conventions    |
| T6.4 | Word count buckets        | ✅ Accept M7   | Privacy-safe content length metrics         |
| T6.5 | Sync performance tracking | ✅ Accept M7   | Essential for offline debugging             |
| T6.6 | Conflict detection events | 🔗 Merge T6.5  | Part of sync performance tracking           |
| T6.7 | Analytics toggle          | ✅ Accept M7   | User control over telemetry (privacy-first) |
| T6.8 | 90-day retention          | ✅ Accept M7   | Privacy-compliant data retention policy     |

**Summary:** 5 accepted M7, 1 merged, 1 rejected, 1 acknowledged

**Note:** T2.9 (Telemetry daily counters) is now resolved - schema defined as
part of T6.3-T6.5.

### F11: Visionary/Dream Big ✅ COMPLETE

**Evaluated:** 2026-01-24 | **Ideas:** 10/10 | **Phase 7, Order 18**

| ID     | Idea                      | Decision      | Details                                       |
| ------ | ------------------------- | ------------- | --------------------------------------------- |
| F11.1  | SoNash Beacon (BLE radar) | ⏸️ Defer M9   | Requires native BLE APIs                      |
| F11.2  | Reclaiming City (map)     | ⏸️ Defer M10  | Complex; needs privacy review for geofencing  |
| F11.3  | Digital Coffee Table      | ⏸️ Defer M10  | Real-time sync requires significant infra     |
| F11.4  | Warm Handoff (B2B)        | ⏸️ Defer M10  | B2B integration out of scope for v1           |
| F11.5  | The Mirror (AI companion) | ⏸️ Defer M10  | Local LLM requires native; complex            |
| F11.6  | Scroll of Life (timeline) | ✅ Accept M7  | Data fusion timeline; valuable for old-timers |
| F11.7  | Family Bridge (trust)     | ⏸️ Defer M10  | Privacy/relationship complexity               |
| F11.8  | 90-in-90 Passport         | ✅ Accept M7  | Gamified meeting exploration                  |
| F11.9  | Service Exchange (barter) | ⏸️ Defer M10  | Marketplace complexity; moderation needed     |
| F11.10 | Voice from Past (capsule) | 🔗 Merge F5.5 | Similar to Time Capsule; bundle as audio      |

**Summary:** 2 accepted M7 (F11.6, F11.8), 7 deferred (1 M9, 6 M10), 1 merged

### T8: Native Path ✅ COMPLETE

**Evaluated:** 2026-01-24 | **Ideas:** 8/8 | **Phase 7, Order 19**

| ID   | Idea                     | Decision       | Details                                    |
| ---- | ------------------------ | -------------- | ------------------------------------------ |
| T8.1 | Capacitor wrapper        | ✅ Accept M9   | 4/5 AIs recommend; preserves Next.js       |
| T8.2 | Expo/React Native        | ❌ Reject      | Full rewrite; Capacitor preferred          |
| T8.3 | Keep Next.js + wrap      | 🔗 Merge T8.1  | Same as Capacitor approach                 |
| T8.4 | Native biometrics        | ✅ Accept M9   | Face ID/Touch ID via Capacitor plugin      |
| T8.5 | Native secure storage    | ✅ Accept M9   | Keychain/Keystore for encryption keys      |
| T8.6 | Native share sheet       | 🔗 Merge T5.8  | Already using Web Share API; enhance later |
| T8.7 | Extract offline-core pkg | ⏸️ Defer M10   | Optimization; not required for v1          |
| T8.8 | Flutter NOT recommended  | 📋 Acknowledge | Reference; confirms correct approach       |

**Summary:** 3 accepted M9 (T8.1, T8.4, T8.5), 2 merged, 1 deferred, 1 rejected,
1 acknowledged

**Native Path Strategy (M9):**

- Capacitor wrapper preserves existing Next.js/React codebase
- Add biometric unlock (Face ID, Touch ID) via @capacitor/biometrics
- Use native secure storage for encryption keys (Keychain/Keystore)
- Enable stealth mode (icon switching) and secure deletion (Burn After Reading)

### F12: Final Gaps (Modules 12-14) ✅ COMPLETE

**Evaluated:** 2026-01-24 | **Ideas:** 11/11 | **Phase 7, Order 20**

| ID     | Idea                      | Decision      | Details                                     |
| ------ | ------------------------- | ------------- | ------------------------------------------- |
| F12.1  | Savings Ticker            | ✅ Accept M7  | Financial motivation via cost visualization |
| F12.2  | Wreckage List (debt)      | ✅ Accept M7  | Step 9 debt tracking; privacy-safe          |
| F12.3  | The Envelope (budget)     | ⏸️ Defer M10  | Budgeting complexity; scope creep risk      |
| F12.4  | Stress Monitor (HR)       | ⏸️ Defer M9   | Requires native Health Kit/Google Fit       |
| F12.5  | Sleep Truth               | ⏸️ Defer M9   | Requires native health API integration      |
| F12.6  | Movement as Medicine      | ⏸️ Defer M9   | Requires native health API integration      |
| F12.7  | Sponsee CRM               | ✅ Accept M7  | Old-timer feature; mentor dashboard         |
| F12.8  | Speaker's Outline         | ✅ Accept M7  | Story builder pulling from timeline         |
| F12.9  | Legacy Archive (search)   | 🔗 Merge F5.5 | Journal search is part of Time Capsule      |
| F12.10 | Intake Interview          | ✅ Accept M6  | Conversational onboarding; Day 0 value      |
| F12.11 | Slow Rollout (disclosure) | ✅ Accept M6  | Progressive feature unlocking               |

**Summary:** 5 accepted M7 (F12.1, F12.2, F12.7, F12.8), 2 accepted M6 (F12.10,
F12.11), 3 deferred M9 (F12.4-6), 1 merged

### T9: Open Questions & Future ✅ COMPLETE

**Evaluated:** 2026-01-24 | **Ideas:** 12/12 | **Phase 7, Order 21**

| ID    | Idea                      | Decision       | Details                                    |
| ----- | ------------------------- | -------------- | ------------------------------------------ |
| T9.1  | Push notifications        | ⏸️ Defer M9    | Requires native push infrastructure        |
| T9.2  | Data retention policy     | ✅ Accept M7   | User choice for auto-cleanup; GDPR aligned |
| T9.3  | Cross-device race cond    | 🔗 Merge T3    | Already resolved in conflict resolution    |
| T9.4  | File attachments (photos) | ⏸️ Defer M10   | Storage complexity; v2 consideration       |
| T9.5  | FlexSearch vs Algolia     | ✅ Accept M7   | FlexSearch for local-first search          |
| T9.6  | Multi-device expectations | 🔗 Merge T3    | Already resolved in T3 conflict handling   |
| T9.7  | Max queue + compaction    | 🔗 Merge T3.14 | Already deferred as T3.14                  |
| T9.8  | Step 4 schema (row IDs)   | 🔗 Merge M5-F2 | Part of worksheet R&D phase                |
| T9.9  | Sponsor link UX           | ✅ Accept M7   | Both code and QR for flexibility           |
| T9.10 | Encrypted artifact share  | 🔗 Merge T2.2  | Part of sharedPackets encryption           |
| T9.11 | Telemetry posture         | 🔗 Merge T6.7  | Analytics toggle covers this               |
| T9.12 | Backup UX (reminder)      | ✅ Accept M7   | Monthly backup reminder notification       |

**Summary:** 4 accepted M7 (T9.2, T9.5, T9.9, T9.12), 6 merged, 2 deferred

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

| Milestone | Group | Name                          | Notes / Intended Contents                                       |
| --------- | ----- | ----------------------------- | --------------------------------------------------------------- |
| M4.5      | F1    | Encryption Foundation         | Key mgmt, encryption primitives, recovery, auto-lock, etc.      |
| M4.5      | F2    | Privacy & Data Controls       | Sync transparency, guest mode, selective sync, delete, etc.     |
| M5        | F0    | App-Wide Input Infrastructure | Speech-to-text on all text fields (universal)                   |
| M5        | F1    | Offline Infrastructure        | Mutation queue, sync worker, storage mgmt, sharedPackets, tests |
| M5        | F2    | Step Work Worksheets          | Text-based step work foundations (Steps 2-9, 11-12)             |
| M5        | F3    | Step Work Enhancements        | Interactive/visual tools for all step worksheets (optional)     |
| M5        | F4    | Step Work Context Tools       | Universal step work helpers (unstuck, reference library)        |
| M6        | F1    | Journaling & Insights         | Pattern Matcher, therapeutic writing, engagement tools          |
| M6        | F2    | Safety & Harm Reduction       | Panic button, guardrails, harm reduction, relapse debrief       |
| M6        | F3    | Onboarding                    | Conversational intake, progressive disclosure                   |
| M7        | F1    | Sponsor Connection            | Sponsor contact storage, sharing infrastructure, push model     |
| M7        | F2    | Service & Fellowship          | Service Points tracking, esteemable acts                        |
| M7        | F3    | Daily Engagement              | Compassionate milestones, share pocket                          |
| M7        | F4    | Exports & Reports             | PDFs, clinical handoff, certificates, service log               |
| M7        | F5    | Nashville Advantage           | Meeting finder enhancements, safe spaces, local features        |
| M7        | F6    | Recovery Knowledge Base       | Plain English steps, glossary, scripts, quizzes                 |
| M7        | F7    | Extended Safety               | Dead man switch, medical ID, detox navigator                    |
| M7        | F8    | Personalization               | Language, themes, accessibility, dashboard customization        |
| M7        | F9    | Analytics & Data              | Event taxonomy, privacy controls, retention policy              |
| M7        | F10   | Visionary Features            | Timeline scroll, gamified 90-in-90                              |
| M7        | F11   | Financial & Old-Timers        | Savings ticker, debt tracker, sponsee CRM, speaker outline      |
| M9        | F1    | Native Security Features      | Biometric unlock, stealth mode, secure deletion, push notif     |
| M9        | F2    | Health Integration            | Heart rate, sleep, movement tracking                            |
| M10       | F1    | Future Enhancements           | AI companion, beacon, service exchange, attachments, etc.       |

### Staged Items with Full Placement

**Relationship codes (machine-readable):**

- `NEW` - New standalone feature
- `BUNDLED_WITH:<ID>` - Technical implementation bundled with another item
- `REQUIRES_NATIVE` - Requires native app capabilities
- `FUTURE_ENHANCEMENT` - Post-launch enhancement

| ID     | Idea                               | Placement | Insert After | Relationship      | Rationale                                  | Date       |
| ------ | ---------------------------------- | --------- | ------------ | ----------------- | ------------------------------------------ | ---------- |
| T4.1   | Tab-level PIN passcode             | M4.5-F1   | MILESTONE:M4 | NEW               | Core encryption feature; privacy-first     | 2026-01-22 |
| T4.2   | PBKDF2 key derivation              | M4.5-F1   | ITEM:T4.1    | BUNDLED_WITH:T4.1 | Technical implementation for T4.1          | 2026-01-22 |
| T4.3   | AES-256-GCM encryption             | M4.5-F1   | ITEM:T4.2    | BUNDLED_WITH:T4.1 | Technical implementation for T4.1          | 2026-01-22 |
| T4.4   | Encrypt ALL step work/inventories  | M4.5-F1   | ITEM:T4.3    | NEW               | Maximum privacy for sensitive content      | 2026-01-22 |
| T4.6   | Recovery key generation            | M4.5-F1   | ITEM:T4.4    | NEW               | Critical for user data recovery            | 2026-01-22 |
| T4.7   | DEK/KEK key wrapping model         | M4.5-F1   | ITEM:T4.6    | NEW               | Industry-standard; enables future features | 2026-01-22 |
| T4.9   | Auto-lock timeout                  | M4.5-F1   | ITEM:T4.7    | NEW               | Standard security UX; configurable         | 2026-01-22 |
| F4.1   | Offline Queue (Trust Indicator)    | M4.5-F2   | ITEM:T4.9    | NEW               | Visible sync status; builds user trust     | 2026-01-22 |
| F4.5   | Guest Mode (Sandbox)               | M4.5-F2   | ITEM:F4.1    | NEW               | Try before sign-up; privacy-first          | 2026-01-22 |
| F4.7   | Selective Sync                     | M4.5-F2   | ITEM:F4.5    | NEW               | Granular control over cloud sync           | 2026-01-22 |
| F4.10  | Nuclear Option (Account Delete)    | M4.5-F2   | ITEM:F4.7    | NEW               | GDPR compliance; 3-step deletion           | 2026-01-22 |
| F4.12  | No-Tracking Dashboard              | M4.5-F2   | ITEM:F4.10   | NEW               | Transparency builds trust                  | 2026-01-22 |
| F4.14  | Snapshot Protection                | M4.5-F2   | ITEM:F4.12   | NEW               | Prevents app switcher snooping             | 2026-01-22 |
| F4.2   | Burn After Reading                 | M9-F1     | ITEM:F4.14   | REQUIRES_NATIVE   | Secure deletion requires native app        | 2026-01-22 |
| F1.0   | App-Wide Speech-to-Text            | M5-F0     | MILESTONE:M5 | NEW               | Universal input; fast/smooth; all fields   | 2026-01-23 |
| F1.2   | Step Work Worksheets (Steps 2-9)   | M5-F2     | ITEM:F1.0    | NEW               | Text foundations with R&D phase            | 2026-01-23 |
| F1.2b  | Step Work Worksheets (Steps 11-12) | M5-F2     | ITEM:F1.2    | BUNDLED_WITH:F1.2 | Bundled with Steps 2-9 worksheets          | 2026-01-23 |
| F1.3   | Step Work Enhancements (All)       | M5-F3     | ITEM:F1.2b   | NEW               | Optional; build after worksheet validation | 2026-01-23 |
| F1.4   | Step Work Context Tools            | M5-F4     | ITEM:F1.3    | NEW               | Unstuck button + Reference sidebar         | 2026-01-23 |
| T2.2   | sharedPackets collection           | M5-F1     | ITEM:T1.12   | NEW               | Foundational schema for sponsor sharing    | 2026-01-24 |
| T2.8   | SyncState per device               | M5-F1     | ITEM:T2.2    | NEW               | Multi-device sync awareness                | 2026-01-24 |
| T2.12  | Soft delete pattern                | M5-F1     | ITEM:T2.8    | NEW               | Foundational for offline-safe deletes      | 2026-01-24 |
| T2.4   | Sponsor contact storage            | M7-F1     | START:M7-F1  | NEW               | Store name/phone/email for offline access  | 2026-01-24 |
| F5.1   | Tag as Inventory                   | M5-F3     | ITEM:F1.3    | NEW               | Journal → Step 4 conversion bridge         | 2026-01-24 |
| F5.2   | Pattern Matcher (bundled)          | M6-F1     | START:M6     | NEW               | Includes F5.3, F5.7, F5.13 merged          | 2026-01-24 |
| F5.4   | Gratitude Mosaic (core)            | M6-F1     | ITEM:F5.2    | NEW               | Visual gratitude collage; widget→M9        | 2026-01-24 |
| F5.5   | Time Capsule                       | M6-F1     | ITEM:F5.4    | NEW               | On This Day reflection tool                | 2026-01-24 |
| F5.6   | The Wave (Urge Log)                | M6-F1     | ITEM:F5.5    | NEW               | Timer proving cravings pass                | 2026-01-24 |
| F5.9   | Rant Room (basic)                  | M6-F1     | ITEM:F5.6    | NEW               | Audio journal + transcription; tone→M9     | 2026-01-24 |
| F5.10  | Unsent Letter                      | M6-F1     | ITEM:F5.9    | NEW               | Therapeutic writing with Release ritual    | 2026-01-24 |
| F5.11  | Dynamic Prompts                    | M6-F1     | ITEM:F5.10   | NEW               | Recovery-stage aware question rotation     | 2026-01-24 |
| F5.12  | Meeting Takeaways                  | M6-F1     | ITEM:F5.11   | NEW               | One-line wisdom capture with speaker       | 2026-01-24 |
| F5.14  | Brain Dump                         | M6-F1     | ITEM:F5.12   | NEW               | Timed freewriting sprint with nudge        | 2026-01-24 |
| F5.8   | Service Points                     | M7-F2     | ITEM:T2.4    | NEW               | Esteemable acts tracking for Step 12       | 2026-01-24 |
| F9.1   | One Action (Dynamic Home)          | M6-F1     | ITEM:F5.14   | NEW               | Contextual suggestion engine               | 2026-01-24 |
| F9.2   | Bookends (AM/PM Routine)           | M6-F1     | ITEM:F9.1    | NEW               | Paired intention/review check-ins          | 2026-01-24 |
| F9.4   | Compassionate Milestones           | M7-F3     | START:M7-F3  | NEW               | Anti-streak cumulative progress            | 2026-01-24 |
| F9.5   | Share Pocket (Meeting Prep)        | M7-F3     | ITEM:F9.4    | NEW               | Flag entries for meeting shares            | 2026-01-24 |
| F9.6   | Pause Protocol                     | M6-F1     | ITEM:F9.2    | NEW               | Haptic grounding tool for agitation        | 2026-01-24 |
| F9.7   | Habit Stacker                      | M6-F1     | ITEM:F9.6    | NEW               | Stack recovery onto existing habits        | 2026-01-24 |
| F9.10  | Sleep Hygiene (Wind-Down)          | M6-F1     | ITEM:F9.7    | NEW               | Pre-sleep wizard with brain dump           | 2026-01-24 |
| F2.1   | Sponsor Export + Redaction         | M7-F1     | ITEM:T2.4    | NEW               | Pre-flight check with redaction UI         | 2026-01-24 |
| F2.2   | Hard Conversation Scripts          | M7-F1     | ITEM:F2.1    | NEW               | Templates for difficult sponsor talks      | 2026-01-24 |
| F2.3   | Mood-Stamped Check-In              | M7-F1     | ITEM:F2.2    | NEW               | Visual HALT card + quick dial              | 2026-01-24 |
| F2.4   | Next Call Agenda (Parking)         | M7-F1     | ITEM:F2.3    | NEW               | Park for Sponsor button on entries         | 2026-01-24 |
| F2.5   | Circle of Trust                    | M7-F1     | ITEM:F2.4    | NEW               | Multi-role permissions manager             | 2026-01-24 |
| F2.6   | Sponsor Vetting Guide              | M7-F1     | ITEM:F2.5    | NEW               | Private checklist for potential sponsors   | 2026-01-24 |
| F2.8   | Relapse Autopsy Worksheet          | M7-F1     | ITEM:F2.6    | NEW               | Collaborative debrief tool                 | 2026-01-24 |
| F2.9   | Shared Commitments                 | M7-F1     | ITEM:F2.8    | NEW               | Digital handshake accountability           | 2026-01-24 |
| F2.10  | Sponsor Prompt Library             | M7-F1     | ITEM:F2.9    | NEW               | Suggested questions for sponsors           | 2026-01-24 |
| F7.1   | Recovery Resume                    | M7-F4     | START:M7-F4  | NEW               | Professional PDF for courts                | 2026-01-24 |
| F7.2   | Step Packets                       | M7-F4     | ITEM:F7.1    | NEW               | Workbook mode with margins                 | 2026-01-24 |
| F7.4   | Emergency Wallet Card              | M7-F4     | ITEM:F7.2    | NEW               | Print-and-fold pocket card                 | 2026-01-24 |
| F7.5   | Full Archive                       | M7-F4     | ITEM:F7.4    | NEW               | JSON/CSV/Text data sovereignty             | 2026-01-24 |
| F7.6   | 30-Day Retrospective               | M6-F1     | ITEM:F9.10   | NEW               | Monthly magazine of progress               | 2026-01-24 |
| F7.7   | Clinical Hand-Off                  | M7-F4     | ITEM:F7.5    | NEW               | Specialized export for therapists          | 2026-01-24 |
| F7.8   | Amends Ledger                      | M7-F4     | ITEM:F7.7    | NEW               | Step 9 spreadsheet export                  | 2026-01-24 |
| F7.9   | Milestone Certificates             | M7-F4     | ITEM:F7.8    | NEW               | Printable celebration certificates         | 2026-01-24 |
| F7.10  | Service Log                        | M7-F4     | ITEM:F7.9    | NEW               | Volunteer hours timesheet                  | 2026-01-24 |
| F7.11  | Incident Report                    | M7-F4     | ITEM:F7.10   | NEW               | 14-day black box relapse analysis          | 2026-01-24 |
| T5.2   | Client-side only                   | M7-F4     | ITEM:F7.11   | NEW               | No server-side PDF (privacy)               | 2026-01-24 |
| T5.3   | EXIF stripping                     | M7-F4     | ITEM:T5.2    | NEW               | Canvas re-encode for metadata              | 2026-01-24 |
| T5.5   | Preview screen                     | M7-F4     | ITEM:T5.3    | NEW               | Preview before generate                    | 2026-01-24 |
| T5.6   | Sponsor packet builder UI          | M7-F4     | ITEM:T5.5    | NEW               | Visual packet construction                 | 2026-01-24 |
| T5.7   | Watermark option                   | M7-F4     | ITEM:T5.6    | NEW               | CONFIDENTIAL watermark for sensitive       | 2026-01-24 |
| T5.8   | Web Share API                      | M7-F4     | ITEM:T5.7    | NEW               | Native share sheet integration             | 2026-01-24 |
| F3.1   | Tonight in Nashville               | M7-F5     | START:M7-F5  | NEW               | Best bet badge + rush hour filter          | 2026-01-24 |
| F3.2   | Safe Spaces Map                    | M7-F5     | ITEM:F3.1    | NEW               | Third places with late-night filter        | 2026-01-24 |
| F3.3   | My Sober Circuit                   | M7-F5     | ITEM:F3.2    | NEW               | Home group + routine stacking              | 2026-01-24 |
| F3.4   | Meeting After Meeting              | M7-F5     | ITEM:F3.3    | NEW               | Community tips for post-meeting            | 2026-01-24 |
| F3.5   | Broadway Escape Plan               | M7-F5     | ITEM:F3.4    | NEW               | Panic navigation for trigger zones         | 2026-01-24 |
| F3.6   | Clubhouse Status Hub               | M7-F5     | ITEM:F3.5    | NEW               | Live dashboard for recovery centers        | 2026-01-24 |
| F3.7   | First 72 Hours                     | M7-F5     | ITEM:F3.6    | NEW               | Newcomer itinerary for Nashville           | 2026-01-24 |
| F3.8   | Sober-Friendly Events              | M7-F5     | ITEM:F3.7    | NEW               | Curated non-drinking social events         | 2026-01-24 |
| F6.1   | Plain English Steps                | M7-F6     | START:M7-F6  | NEW               | Translator toggle for Step language        | 2026-01-24 |
| F6.2   | Am I Doing This Right?             | M7-F6     | ITEM:F6.1    | NEW               | Etiquette flowchart for scenarios          | 2026-01-24 |
| F6.3   | Smart Glossary                     | M7-F6     | ITEM:F6.2    | NEW               | Contextual hyperlinked definitions         | 2026-01-24 |
| F6.4   | Script Lab                         | M7-F6     | ITEM:F6.3    | NEW               | Roleplay scripts with vibe options         | 2026-01-24 |
| F6.5   | Crisis Decision Tree               | M6-F1     | ITEM:F7.6    | NEW               | Yes/no wizard for crisis routing           | 2026-01-24 |
| F6.6   | Daily Principle Deck               | M7-F6     | ITEM:F6.4    | NEW               | Randomized principle application           | 2026-01-24 |
| F6.7   | Anatomy of a Meeting               | M7-F6     | ITEM:F6.6    | NEW               | Visual map for newcomer anxiety            | 2026-01-24 |
| F6.8   | Normie Translator                  | M7-F6     | ITEM:F6.7    | NEW               | Shareable cards for family members         | 2026-01-24 |
| F6.9   | Service Menu                       | M7-F6     | ITEM:F6.8    | NEW               | Micro-service options by difficulty        | 2026-01-24 |
| F6.10  | Fellowship Compass                 | M7-F6     | ITEM:F6.9    | NEW               | AA/NA/CA/SMART comparison guide            | 2026-01-24 |
| F6.11  | Traditions in Real Life            | M7-F6     | ITEM:F6.10   | NEW               | Relationship hacks from 12 Traditions      | 2026-01-24 |
| F6.12  | Readiness Checkers                 | M7-F6     | ITEM:F6.11   | NEW               | Self-reflective quizzes                    | 2026-01-24 |
| F10.1  | The Lifeline (Panic)               | M6-F2     | START:M6-F2  | NEW               | Single-tap emergency with silent mode      | 2026-01-24 |
| F10.2  | The Guardrails                     | M6-F2     | ITEM:F10.1   | NEW               | Context-aware trauma gates                 | 2026-01-24 |
| F10.3  | Harm Reduction Locker              | M6-F2     | ITEM:F10.2   | NEW               | Naloxone guide + Good Samaritan law        | 2026-01-24 |
| F10.4  | Compassionate U-Turn               | M6-F2     | ITEM:F10.3   | NEW               | Relapse debriefing wizard                  | 2026-01-24 |
| F10.5  | The Canary (Dead Man)              | M7-F7     | START:M7-F7  | NEW               | Timed check-in with auto-alert             | 2026-01-24 |
| F10.6  | Medical ID                         | M7-F7     | ITEM:F10.5   | NEW               | Lock screen wallpaper for EMTs             | 2026-01-24 |
| F10.7  | Never Use Alone                    | M7-F7     | ITEM:F10.6   | NEW               | Integration with spotter hotline           | 2026-01-24 |
| F10.8  | Exit Strategy Scripts              | M7-F7     | ITEM:F10.7   | NEW               | Social excuses + fake call                 | 2026-01-24 |
| F10.9  | Detox Navigator                    | M7-F7     | ITEM:F10.8   | NEW               | Nashville detox directory + transport      | 2026-01-24 |
| F8.1   | Rosetta Stone (Terms)              | M7-F8     | START:M7-F8  | NEW               | AA/NA/Secular vocabulary toggle            | 2026-01-24 |
| F8.2   | Journey Phase                      | M7-F8     | ITEM:F8.1    | NEW               | Newcomer/Action/Maintenance UI modes       | 2026-01-24 |
| F8.3   | Dashboard Builder                  | M7-F8     | ITEM:F8.2    | NEW               | Drag-and-drop home screen editor           | 2026-01-24 |
| F8.4   | Nudge Engine                       | M7-F8     | ITEM:F8.3    | NEW               | Granular notification controls             | 2026-01-24 |
| F8.5   | Name Your Power                    | M7-F8     | ITEM:F8.4    | NEW               | Spiritual term customization               | 2026-01-24 |
| F8.6   | The Focus                          | M7-F8     | ITEM:F8.5    | NEW               | Substance vs behavior tracker logic        | 2026-01-24 |
| F8.7   | Notebook Aesthetics                | M7-F8     | ITEM:F8.6    | NEW               | Paper type, font, cover art theming        | 2026-01-24 |
| F8.8   | The Why Anchor                     | M7-F8     | ITEM:F8.7    | NEW               | Persistent motivational photo header       | 2026-01-24 |
| F8.9   | Accessibility Plus                 | M7-F8     | ITEM:F8.8    | NEW               | Enhanced scaling + dyslexia font           | 2026-01-24 |
| F8.10  | Red Line List                      | M7-F8     | ITEM:F8.9    | NEW               | Trigger word content masking               | 2026-01-24 |
| F8.11  | Sponsor Link Status                | M7-F8     | ITEM:F8.10   | NEW               | Hide sponsor features if no sponsor        | 2026-01-24 |
| T7.1   | Feature flag for offline           | M5-F1     | ITEM:T2.12   | NEW               | Gradual rollout of offline features        | 2026-01-24 |
| T7.2   | PR strategy (types→conflict UI)    | M5-F1     | ITEM:T7.1    | NEW               | Incremental PR approach                    | 2026-01-24 |
| T7.8   | Unit tests for conflicts           | M5-F1     | ITEM:T7.2    | NEW               | Critical testing infrastructure            | 2026-01-24 |
| T7.9   | Firebase emulator tests            | M5-F1     | ITEM:T7.8    | NEW               | Integration testing infrastructure         | 2026-01-24 |
| T6.3   | Action event taxonomy              | M7-F9     | START:M7-F9  | NEW               | Standard event naming conventions          | 2026-01-24 |
| T6.4   | Word count buckets                 | M7-F9     | ITEM:T6.3    | NEW               | Privacy-safe content length metrics        | 2026-01-24 |
| T6.5   | Sync performance tracking          | M7-F9     | ITEM:T6.4    | NEW               | Essential for offline debugging            | 2026-01-24 |
| T6.7   | Analytics toggle                   | M7-F9     | ITEM:T6.5    | NEW               | User control over telemetry                | 2026-01-24 |
| T6.8   | 90-day retention                   | M7-F9     | ITEM:T6.7    | NEW               | Privacy-compliant retention policy         | 2026-01-24 |
| F11.6  | Scroll of Life (timeline)          | M7-F10    | START:M7-F10 | NEW               | Data fusion timeline for old-timers        | 2026-01-24 |
| F11.8  | 90-in-90 Passport                  | M7-F10    | ITEM:F11.6   | NEW               | Gamified meeting exploration               | 2026-01-24 |
| T8.1   | Capacitor wrapper                  | M9-F1     | START:M9-F1  | NEW               | Preserves Next.js codebase                 | 2026-01-24 |
| T8.4   | Native biometrics                  | M9-F1     | ITEM:T8.1    | NEW               | Face ID/Touch ID via Capacitor             | 2026-01-24 |
| T8.5   | Native secure storage              | M9-F1     | ITEM:T8.4    | NEW               | Keychain/Keystore for encryption keys      | 2026-01-24 |
| F12.1  | Savings Ticker                     | M7-F11    | START:M7-F11 | NEW               | Financial motivation via cost viz          | 2026-01-24 |
| F12.2  | Wreckage List (debt)               | M7-F11    | ITEM:F12.1   | NEW               | Step 9 debt tracking                       | 2026-01-24 |
| F12.7  | Sponsee CRM                        | M7-F11    | ITEM:F12.2   | NEW               | Old-timer mentor dashboard                 | 2026-01-24 |
| F12.8  | Speaker's Outline                  | M7-F11    | ITEM:F12.7   | NEW               | Story builder pulling from timeline        | 2026-01-24 |
| F12.10 | Intake Interview                   | M6-F3     | START:M6-F3  | NEW               | Conversational onboarding                  | 2026-01-24 |
| F12.11 | Slow Rollout (disclosure)          | M6-F3     | ITEM:F12.10  | NEW               | Progressive feature unlocking              | 2026-01-24 |
| T9.2   | Data retention policy              | M7-F9     | ITEM:T6.8    | NEW               | User choice for auto-cleanup               | 2026-01-24 |
| T9.5   | FlexSearch                         | M7-F6     | ITEM:F6.12   | NEW               | Local-first search                         | 2026-01-24 |
| T9.9   | Sponsor link UX                    | M7-F1     | ITEM:F2.10   | NEW               | Both code and QR for flexibility           | 2026-01-24 |
| T9.12  | Backup UX (reminder)               | M7-F9     | ITEM:T9.2    | NEW               | Monthly backup reminder notification       | 2026-01-24 |

**Summary by Milestone:**

- **M4.5-F1:** Encryption Foundation (7 items)
- **M4.5-F2:** Privacy & Data Controls (6 items)
- **M5-F0:** App-Wide Input Infrastructure (1 item)
- **M5-F1:** Offline Infrastructure (13 items: T1.2-4, T1.6, T1.11-12, T2.2,
  T2.8, T2.12, T7.1-2, T7.8-9)
- **M5-F2:** Step Work Worksheets (2 items bundled)
- **M5-F3:** Step Work Enhancements (2 items: F1.3, F5.1)
- **M5-F4:** Step Work Context Tools (1 item)
- **M6-F1:** Journaling & Insights (17 items: F5.2 bundle, F5.4-6, F5.9-12,
  F5.14, F9.1-2, F9.6-7, F9.10, F7.6, F6.5)
- **M6-F2:** Safety & Harm Reduction (4 items: F10.1-4)
- **M6-F3:** Onboarding (2 items: F12.10-11)
- **M7-F1:** Sponsor Connection (12 items: T2.4, F2.1-6, F2.8-10, T9.9)
- **M7-F2:** Service & Fellowship (1 item: F5.8)
- **M7-F3:** Daily Engagement (2 items: F9.4-5)
- **M7-F4:** Exports & Reports (14 items: F7.1-2, F7.4-5, F7.7-11, T5.2-3,
  T5.5-8)
- **M7-F5:** Nashville Advantage (8 items: F3.1-8)
- **M7-F6:** Recovery Knowledge Base (13 items: F6.1-4, F6.6-12, T9.5)
- **M7-F7:** Safety Features (5 items: F10.5-9)
- **M7-F8:** Personalization (11 items: F8.1-11)
- **M7-F9:** Analytics & Data (5 items: T6.3-5, T6.7-8, T9.2, T9.12)
- **M7-F10:** Visionary Features (2 items: F11.6, F11.8)
- **M7-F11:** Financial Repair & Old-Timers (4 items: F12.1-2, F12.7-8)
- **M9-F1:** Native Security Features (3 items staged: T8.1, T8.4-5; + deferred
  items)

---

## Deferred Ideas Summary

_Deferred items also get ROADMAP placement for future push_

| ID    | Idea                      | Placement | Insert After | Relationship       | Reason                                    | Revisit When |
| ----- | ------------------------- | --------- | ------------ | ------------------ | ----------------------------------------- | ------------ |
| T4.10 | Biometric unlock          | M9-F1     | MILESTONE:M8 | REQUIRES_NATIVE    | Requires native app (PWA limitation)      | M9 impl      |
| F4.4  | Stealth Mode              | M9-F1     | ITEM:T4.10   | REQUIRES_NATIVE    | Requires native for icon switching        | M9 impl      |
| F4.11 | Shoulder Surf Blur        | M10-F1    | END:M10      | FUTURE_ENHANCEMENT | Nice-to-have; auto-lock covers use case   | Post-launch  |
| T3.14 | Queue compaction          | M10-F1    | ITEM:F4.11   | FUTURE_ENHANCEMENT | Optimization for v2, not critical         | Post-launch  |
| F5.4b | Gratitude widget/shake    | M9-F1     | ITEM:F5.4    | REQUIRES_NATIVE    | Home screen widget needs native app       | M9 impl      |
| F5.9b | Voice tone analysis       | M9-F1     | ITEM:F5.9    | REQUIRES_NATIVE    | Audio tone analysis needs native APIs     | M9 impl      |
| F5.15 | Symptom vs Feeling        | TBD       | TBD          | DEFERRED           | Needs UX research; close to medical       | UX research  |
| F9.9  | Nashville Sound (Music)   | M9-F1     | ITEM:F5.9b   | REQUIRES_NATIVE    | Native deep links for music apps          | M9 impl      |
| F9.11 | Drive Time Companion      | M9-F1     | ITEM:F9.9    | REQUIRES_NATIVE    | Native car mode with voice journal        | M9 impl      |
| F11.1 | SoNash Beacon (BLE)       | M9-F1     | ITEM:F9.11   | REQUIRES_NATIVE    | Requires native BLE APIs                  | M9 impl      |
| F11.2 | Reclaiming City (map)     | M10-F1    | ITEM:T3.14   | FUTURE_ENHANCEMENT | Complex; needs privacy review             | Post-launch  |
| F11.3 | Digital Coffee Table      | M10-F1    | ITEM:F11.2   | FUTURE_ENHANCEMENT | Real-time sync requires significant infra | Post-launch  |
| F11.4 | Warm Handoff (B2B)        | M10-F1    | ITEM:F11.3   | FUTURE_ENHANCEMENT | B2B integration out of scope for v1       | Post-launch  |
| F11.5 | The Mirror (AI companion) | M10-F1    | ITEM:F11.4   | FUTURE_ENHANCEMENT | Local LLM requires native; complex        | Post-launch  |
| F11.7 | Family Bridge (trust)     | M10-F1    | ITEM:F11.5   | FUTURE_ENHANCEMENT | Privacy/relationship complexity           | Post-launch  |
| F11.9 | Service Exchange (barter) | M10-F1    | ITEM:F11.7   | FUTURE_ENHANCEMENT | Marketplace complexity; moderation        | Post-launch  |
| T8.7  | Extract offline-core pkg  | M10-F1    | ITEM:F11.9   | FUTURE_ENHANCEMENT | Optimization; not required for v1         | Post-launch  |
| F12.3 | The Envelope (budget)     | M10-F1    | ITEM:T8.7    | FUTURE_ENHANCEMENT | Budgeting complexity; scope creep risk    | Post-launch  |
| F12.4 | Stress Monitor (HR)       | M9-F2     | START:M9-F2  | REQUIRES_NATIVE    | Requires native Health Kit/Google Fit     | M9 impl      |
| F12.5 | Sleep Truth               | M9-F2     | ITEM:F12.4   | REQUIRES_NATIVE    | Requires native health API integration    | M9 impl      |
| F12.6 | Movement as Medicine      | M9-F2     | ITEM:F12.5   | REQUIRES_NATIVE    | Requires native health API integration    | M9 impl      |
| T9.1  | Push notifications        | M9-F1     | ITEM:F11.1   | REQUIRES_NATIVE    | Requires native push infrastructure       | M9 impl      |
| T9.4  | File attachments (photos) | M10-F1    | ITEM:F12.3   | FUTURE_ENHANCEMENT | Storage complexity; v2 consideration      | Post-launch  |

**Summary by Milestone:**

- **M9-F1:** Native Security/Features (9 items: T4.10, F4.4, F5.4b, F5.9b, F9.9,
  F9.11, F11.1, T9.1)
- **M9-F2:** Health Integration (3 items: F12.4-6 bio-rhythm features)
- **M10-F1:** Future Enhancements (11 items: F4.11, T3.14, F11.2-5, F11.7,
  F11.9, T8.7, F12.3, T9.4)
- **TBD:** F5.15 (needs UX research before placement)

---

## Rejected Ideas Summary

| ID    | Idea                         | Reason                                                           |
| ----- | ---------------------------- | ---------------------------------------------------------------- |
| T4.8  | Cloud escrow (encrypted key) | Conflicts with privacy-first; creates server-side attack vector  |
| F4.9  | Flip-to-Hide Gesture         | Auto-lock sufficient; accelerometer unreliable in PWA            |
| T1.13 | React Query integration      | Conflicts with offline-first architecture; Dexie.js handles it   |
| T6.1  | PostHog recommendation       | Firebase Analytics already in stack; no need for additional tool |
| T8.2  | Expo/React Native            | Full rewrite not justified; Capacitor preserves existing code    |

---

## Merged with Existing ROADMAP Items

| Merged ID | Merged Into | Rationale                                                            |
| --------- | ----------- | -------------------------------------------------------------------- |
| T2.3      | Q5 + T2.2   | Push model implicit in Q5 decision + sharedPackets design            |
| T2.5-7    | T2.2        | Immutability, expiry, revocation are sharedPackets schema attributes |
| T2.10     | M5-F2       | Step packet schemas defined during worksheet R&D                     |
| T2.11     | T3          | localVersion is conflict detection implementation detail             |
| F5.3      | F5.2        | Recovery Weather is visualization layer of Pattern Matcher           |
| F5.7      | F5.2        | HALT heat map is pattern visualization (existing HALT feature)       |
| F5.13     | F5.2        | Context tags are data layer for Pattern Matcher                      |
| F9.3      | F5.6        | The Wave already evaluated as F5.6 (Urge Log)                        |
| F9.8      | F5.8        | Service Snaps covered by Service Points                              |
| F2.7      | F7          | Sponsor summary bundled with exports module                          |
| F2.11     | T2.2        | One-time share code covered by sharedPackets expiry                  |
| F7.3      | F2.7        | Sponsor cheat sheet bundled with sponsor summary                     |
| T5.1      | Q8          | @react-pdf/renderer already decided in foundational question         |
| T5.4      | T5.3        | GPS/device sanitization bundled with EXIF stripping                  |
| T5.9      | T5.8        | Fallback bundled with Web Share API integration                      |
| T5.10     | T5.3        | Minimal PDF metadata bundled with privacy stripping                  |
| F10.10    | F5.2        | Pattern Matcher handles safety pattern detection                     |
| T6.6      | T6.5        | Conflict events part of sync performance tracking                    |
| F11.10    | F5.5        | Voice from Past similar to Time Capsule; bundle as audio             |
| T8.3      | T8.1        | Keep Next.js + wrap = Capacitor approach                             |
| T8.6      | T5.8        | Native share extends Web Share API                                   |
| F12.9     | F5.5        | Legacy Archive search is part of Time Capsule                        |
| T9.3      | T3          | Cross-device race conditions resolved in T3 conflict handling        |
| T9.6      | T3          | Multi-device expectations resolved in T3                             |
| T9.7      | T3.14       | Queue compaction already deferred as T3.14                           |
| T9.8      | M5-F2       | Step 4 schema part of worksheet R&D                                  |
| T9.10     | T2.2        | Encrypted sharing part of sharedPackets encryption                   |
| T9.11     | T6.7        | Telemetry posture covered by analytics toggle                        |

---

## Version History

| Version | Date       | Description                                                                                                                                                                                      |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.0     | 2026-01-20 | Initial tracker creation with 21 modules                                                                                                                                                         |
| 2.0     | 2026-01-21 | Foundational framework complete; all 12 Qs answered; 7-phase eval order; staged ROADMAP process                                                                                                  |
| 2.1     | 2026-01-22 | Added placement metadata (Placement, Insert After, Relationship columns); defined M4.5 and M9                                                                                                    |
| 2.2     | 2026-01-23 | F1 COMPLETE - 51 ideas evaluated; Option C structure (separate worksheets/enhancements/tools); speech-to-text M5-F0                                                                              |
| 2.3     | 2026-01-24 | T2 COMPLETE - 12 ideas; sharedPackets schema with expiry/revocation; sponsor contact storage (M7-F1)                                                                                             |
| 2.4     | 2026-01-24 | F5 COMPLETE - 15 ideas; Pattern Matcher bundles 3 features; M6 gets 10 journaling tools; 34 staged                                                                                               |
| 3.0     | 2026-01-24 | 🎉 ALL 21 MODULES COMPLETE - 280/280 ideas evaluated; 85+ staged items; M4.5/M5/M6/M7/M9/M10 feature groups defined                                                                              |
| 4.0     | 2026-01-24 | 🚀 ROADMAP PUSH COMPLETE - 76 items integrated into ROADMAP.md v3.0 (8 duplicates skipped, 1 merged). M4.5 and M9 sections added. Full deduplication analysis in analysis/pass2_deduplication.md |
