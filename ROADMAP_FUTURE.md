# SoNash Future Roadmap

<!-- prettier-ignore-start -->
**Document Version:** 1.2
**Last Updated:** 2026-01-29
**Status:** ACTIVE
**Parent Document:** [ROADMAP.md](./ROADMAP.md)
<!-- prettier-ignore-end -->

> **Purpose:** Detailed specifications for future milestones (M2-M10). For
> active sprint work and current priorities, see [ROADMAP.md](./ROADMAP.md).

---

## Status/Progress

**Current Status:** Planning document for future milestones (M2-M10). Not yet in
active development.

**Last Review:** 2026-01-27

---

## 🎯 Document Purpose

This document contains **detailed specifications for future milestones** that
are not yet active. It serves as:

1. **Planning Reference** - Full task breakdowns for upcoming work
2. **Dependency Tracker** - Which tasks can parallelize
3. **Promotion Queue** - What moves to ROADMAP.md when activated

**Scope:** Milestones M2 through M10 (Architecture → Monetization)

**Out of Scope:** Active sprint work (see [ROADMAP.md](./ROADMAP.md))

---

## 📋 How to Use This Document

### For Planning

1. Check **Milestone Overview** table in ROADMAP.md for priorities
2. Review **Parallel Groups** to identify concurrent work opportunities
3. Check **Dependencies** before scheduling work

### For Promotion (Moving to Active Sprint)

When a milestone becomes active:

1. Copy the milestone section from this document to ROADMAP.md
2. Update status in ROADMAP.md Milestones Overview table
3. Remove detailed section from this document (keep 1-line summary)
4. Update both document versions

---

## 🤖 AI Instructions

### When to Update This Document

| Trigger                               | Action Required                                                               |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| New feature idea for future milestone | Add to appropriate milestone section with `- [ ] **ID** - Description` format |
| Dependency discovered                 | Add to Dependencies subsection AND update Parallel Group if affected          |
| Effort estimate changes               | Update Story Points in milestone header                                       |
| Task completed early                  | Move task to ROADMAP_LOG.md with completion date                              |
| Milestone promoted to active          | Move section to ROADMAP.md, leave 1-line reference here                       |

### What to Update (Specific Fields)

**When adding a new task:**

```markdown
- [ ] **F#.#** - Task title (effort estimate) `⏸ PG#` ← if parallelizable
  - Subtask or implementation note
  - Dependency: [Blocking task ID]
```

**When updating a milestone:**

1. Update `**Story Points:**` in milestone header
2. Update `**Items:**` count in milestone header
3. Add to appropriate Feature Group (F1, F2, etc.)
4. Check if task belongs in a Parallel Group

**When a task is parallelizable:**

- Add `⏸ PG#` marker (see Parallel Groups Legend below)
- Verify task is listed in PARALLEL_EXECUTION_GUIDE.md

### What NOT to Do

- ❌ Do NOT add active sprint tasks here (those go in ROADMAP.md)
- ❌ Do NOT remove completed tasks (archive to ROADMAP_LOG.md)
- ❌ Do NOT change Parallel Group assignments without updating
  PARALLEL_EXECUTION_GUIDE.md
- ❌ Do NOT add items without an ID (use next available F#.# or T#.#)

### Cross-Document Updates Required

| Change in This Document  | Also Update                                         |
| ------------------------ | --------------------------------------------------- |
| New milestone added      | ROADMAP.md Milestones Overview table                |
| Milestone promoted       | ROADMAP.md (add section), this doc (remove section) |
| Parallel group changed   | analysis/PARALLEL_EXECUTION_GUIDE.md                |
| Task completed           | ROADMAP_LOG.md                                      |
| Dependency chain changed | ROADMAP.md Critical Dependency Chains section       |

---

## ⏸ Parallel Groups Legend

Tasks marked with `⏸ PG#` can run in parallel with other tasks in the same
group. See [PARALLEL_EXECUTION_GUIDE.md](analysis/PARALLEL_EXECUTION_GUIDE.md)
for full details.

| Group | Name                           | Milestone | Savings   | Risk   |
| ----- | ------------------------------ | --------- | --------- | ------ |
| PG1   | M4.5 Privacy Features          | M4.5      | 1-2 weeks | Low    |
| PG2   | M5 Non-Offline Features        | M5        | 1 week    | Low    |
| PG3   | M6 Offline-Agnostic Journaling | M6        | 2-3 weeks | Low    |
| PG4   | M6 Safety Features             | M6        | 1-2 weeks | Medium |
| PG5   | M7 Content-First Features      | M7        | 2-3 weeks | Low    |
| PG6   | M7 Export Features             | M7        | 1-2 weeks | Low    |
| PG7   | M9 Native Features             | M9        | 3-4 weeks | Medium |

**How to use:** Tasks with the same `⏸ PG#` marker have no dependencies on each
other and can be worked on simultaneously by different developers or in parallel
sessions.

---

## 🏛️ M2 - Architecture Refactor (⏸️ Optional)

**Story Points:** ~200 SP | **Priority:** P2 | **Items:** ~72 | **Target:** As
needed

> **Status:** Optional maintenance milestone. Items can be pulled into active
> sprints as needed without activating entire milestone.

### 📦 M2.1 - Code Quality & Tooling (~25 items)

#### Deferred Foundation Work

**Priority:** P2-P3 | Can be done incrementally

- [ ] **EFF-002** - Add git pre-push hook for test failures (S effort) _Uses
      Track T infrastructure_
- [ ] **EFF-004** - Create shared TypeScript config packages (M effort)
- [ ] **EFF-006** - Add correlation IDs to logger (M effort) ⚡ _Cross-ref: C2
      Monitoring Consolidation_
- [ ] **EFF-007** - Implement request deduplication cache (M effort)
- [ ] **EFF-008** - Add bundle size tracking to CI (L effort)
- [ ] **EFF-009** - Create component showcase/storybook (L effort)
- [ ] **PERF-002** - Store Lighthouse scores in Firestore (2hr)
- [ ] **PERF-003** - Add trend visualization to Dev Dashboard (3hr)
- [ ] **PERF-004** - Configure Lighthouse CI assertions (thresholds) (1hr)
- [ ] **PERF-005** - Add performance regression alerts (2hr)
- [ ] **PERF-006** - Bundle size tracking integration (2hr)

#### SonarCloud Deferred Work (Session #85)

> Deferred from SonarCloud Cleanup Sprint. Low priority - fix opportunistically.

- [ ] **SONAR-PR3** - Major Code Smells (~400 issues)
  - Cognitive complexity refactoring
  - Code duplication cleanup
  - Dead code removal
- [ ] **SONAR-PR4** - Minor Issues (~600 issues)
  - Naming conventions
  - Comment cleanup
  - Import organization
- [ ] **SONAR-PR5** - Security Hotspots (~100 issues)
  - Review and dismiss false positives
  - Fix actual security issues
  - Document accepted risks

#### Developer Tooling (Session #69)

- [ ] **DT-001** - ESLint Plugin for Security Patterns
  - Auto-detect patterns from CODE_PATTERNS.md
  - Custom rules for project-specific anti-patterns
- [ ] **DT-002** - PR Template with Checklist
  - Auto-populated based on changed files
  - Security checklist for sensitive files
- [ ] **DT-003** - Automated Changelog Generation
  - From conventional commits
  - Group by feature/fix/docs

#### Deferred PR Review Items (Session #114)

> Triaged from PR reviews - long-term improvements not blocking current work.

- [ ] **DT-004** - Migrate regex patterns to AST-based parsing (Review #51)
  - Replace complex regex with proper AST parsing where appropriate
  - Improves maintainability and reduces ReDoS risk
- [ ] **DT-005** - Add `--fix` CLI flag to validation scripts (Review #211)
  - Auto-fix capability for pattern violations
  - Similar to ESLint's --fix behavior
- [ ] **DT-006** - Cross-file anchor validation for documentation (Review #213)
  - Validate markdown anchor links across documents
  - Detect broken cross-references automatically
- [ ] **DT-007** - Structured JSON state for consolidation tracking (PR #324)
  - Replace fragile markdown regex parsing with JSON state file
  - Store `lastConsolidatedReview` in `consolidation-state.json`
  - Improves robustness and eliminates silent parse failures

### Context Optimization & Agent Infrastructure (Session #90)

- [ ] **CTX-001** - Context Budget Tracking Dashboard
  - Real-time token usage display
  - Per-tool context consumption metrics
- [ ] **CTX-002** - Smart Context Pruning
  - LRU cache for file reads
  - Automatic summarization of large files
- [ ] **CTX-003** - Parallel Agent Orchestration
  - Coordinate multiple subagents
  - Share context efficiently
- [ ] **CTX-004** - Evaluate MCP Memory vs Vector DB (Review #211)
  - Compare current MCP memory server with vector database options
  - Consider Pinecone, Weaviate, or local vector stores for semantic search
  - Decision needed for long-term context persistence strategy

### 📊 M2.2 - Monitoring & Observability (~25 items)

#### Engineering Productivity - Observability

- [ ] **EFF-OBS-001** - Structured logging migration
- [ ] **EFF-OBS-002** - Error boundary telemetry
- [ ] **EFF-OBS-003** - Performance marks and measures
- [ ] **EFF-OBS-004** - User journey tracking

### 🏗️ M2.3 - Infrastructure & Refactoring (~22 items)

#### Validated Refactor Backlog (Step 4.3 Audit)

- [ ] Refactor large components (>500 lines)
- [ ] Extract shared hooks from duplicate code
- [ ] Consolidate API client patterns
- [ ] Migrate class components to functional

---

## 🗓️ M3 - Meetings & Location (📋 Planned - Q2 2026)

**Story Points:** ~45 SP | **Priority:** P1 | **Items:** 6 | **Target:** Q2 2026

### Features

- [ ] **M3-001** - Meeting finder with map integration
- [ ] **M3-002** - Favorite meetings list
- [ ] **M3-003** - Meeting reminders (push notifications)
- [ ] **M3-004** - Check-in at meetings (location verified)
- [ ] **M3-005** - Meeting notes capture
- [ ] **M3-006** - Meeting history and statistics

### Dependencies

- Requires Google Maps API key
- Location permissions on mobile

---

## 🎯 M4 - Feature Expansion (📋 Planned - Q2 2026)

**Story Points:** ~60 SP | **Priority:** P1 | **Items:** ~8 | **Target:** Q2
2026

### Features

- [ ] **M4-001** - Enhanced HALT check with history
- [ ] **M4-002** - Customizable dashboard widgets
- [ ] **M4-003** - Recovery date milestones
- [ ] **M4-004** - Goal setting and tracking
- [ ] **M4-005** - Accountability partner features
- [ ] **M4-006** - Community forum (moderated)
- [ ] **M4-007** - Event calendar integration
- [ ] **M4-008** - Resource library expansion

---

## 🔐 M4.5 - Security & Privacy (📋 Planned - Q2 2026)

**Story Points:** ~85 SP | **Priority:** P0 | **Items:** 13 | **Target:** Q2
2026

> **CRITICAL GATE:** This milestone MUST complete before M5 (Offline) can begin.
> All offline data storage requires encryption infrastructure from M4.5.

### Overview

Implements encryption infrastructure and privacy controls as prerequisite for
offline features in M5. All sensitive data (step work, inventories, journal
entries) will be encrypted at rest using AES-256-GCM with PBKDF2 key derivation.

### Dependencies

- **Prerequisite:** M4 (Feature Expansion) must complete first
- **Blocks:** M5 (Offline), M6 (Journaling), M7 (Fellowship) - 60+ items depend
  on encryption

### F1: Encryption Infrastructure (7 items)

- [ ] **T4.1** - Tab-level PIN passcode (user-set 4-6 digit PIN)
- [ ] **T4.2** - PBKDF2 key derivation (bundled with T4.1)
- [ ] **T4.3** - AES-256-GCM encryption engine
- [ ] **T4.4** - Encrypt ALL step work and inventories at rest
- [ ] **T4.6** - Recovery key generation (12-word mnemonic)
- [ ] **T4.7** - DEK/KEK key wrapping architecture
- [ ] **T4.9** - Auto-lock timeout (configurable: 1/5/15/30 min)

### F2: Privacy Controls (7 items) - `⏸ PG1`

These can start immediately (no encryption dependency):

- [ ] **F4.1** - Offline Queue Trust Indicator (visual sync status)
- [ ] **F4.5** - Guest Mode (sandboxed demo) `⏸ PG1`
- [ ] **F4.7** - Selective Sync UI `⏸ PG1`
- [ ] **F4.10** - Nuclear Option (account deletion) `⏸ PG1`
- [ ] **F4.12** - No-Tracking Dashboard `⏸ PG1`
- [ ] **F4.14** - Snapshot Protection `⏸ PG1`
- [ ] **DEDUP-0001** - Re-enable Firebase App Check `⏸ PG1` (after
      DEDUP-0003/0004)

### Pre-M4.5 R&D (Start During M4)

- [ ] **RND-T4.2** - PBKDF2 Prototype (1-2 days)
- [ ] **RND-T4.3** - AES-256-GCM Spike (2-3 days)
- [ ] **RND-AUDIT** - Security Audit Planning (1 day)
- [ ] **RND-DEXIE** - Dexie-Encrypted-Addon Evaluation (1 day)

---

## 📝 M5 - Offline + Steps (📋 Planned - Q3 2026)

**Story Points:** ~150 SP | **Priority:** P1 | **Items:** 23 | **Target:** Q3
2026

> **Prerequisite:** M4.5 (Encryption) must complete first

### F0: App-Wide Input Infrastructure (1 item) - `⏸ PG2`

- [ ] **F1.0** - App-wide speech-to-text `⏸ PG2`

### F1: Offline Infrastructure (14 items)

Core offline-first architecture (sequential - has dependencies):

- [ ] **T1.2** - Custom mutation queue (Dexie.js wrapper)
- [ ] **T1.3** - Sync worker with exponential retry
- [ ] **T1.4** - IndexedDB setup via Dexie.js
- [ ] **T1.6** - Storage quota management and warnings
- [ ] **T1.11** - Multi-device conflict detection UI
- [ ] **T1.12** - Conflict resolution strategies (LWW, merge, manual)
- [ ] **T2.2** - sharedPackets collection (sponsor sharing foundation)
- [ ] **T2.8** - SyncState per device tracking
- [ ] **T2.12** - Soft delete pattern for offline-safe deletes
- [ ] **T7.1** - Feature flag for offline rollout
- [ ] **T7.2** - PR strategy (types → conflict UI incremental)
- [ ] **T7.8** - Unit tests for conflict scenarios _Uses Track T infrastructure_
- [ ] **T7.9** - Firebase emulator integration tests _Uses Track T fixtures_
- [ ] **EFF-011** - Offline Tests _Uses Track T infrastructure_

### F2: Step Work Worksheets (4 items) - `⏸ PG2`

- [ ] **F1.2** - Step Work Worksheets (Steps 2-9) `⏸ PG2`
- [ ] **F1.2b** - Step Work Worksheets (Steps 11-12) `⏸ PG2`
- [ ] 10th Step Inventory Tool
- [ ] Inventory Templates

### F3: Step Work Enhancements (4 items) - `⏸ PG2`

- [ ] **F1.3** - Interactive step tools `⏸ PG2`
- [ ] **F5.1** - Tag as Inventory
- [ ] Amends Tracker
- [ ] Pattern Recognition 🔬

---

## 🙏 M6 - Journaling + Safety (📋 Planned - Q3 2026)

**Story Points:** ~180 SP | **Priority:** P1 | **Items:** 26 | **Target:** Q3
2026

> **Prerequisite:** M5 (Offline) must complete first for offline journaling

### F1: Journaling & Insights (17 items) - Partial `⏸ PG3`

- [ ] **F5.2** - Pattern Matcher `⏸ PG3`
- [ ] **F5.3** - Mood-to-Entry AI linking (depends on F5.2)
- [ ] **F5.4** - Gratitude Mosaic
- [ ] **F5.5** - Time Capsule
- [ ] **F5.6** - Voice-to-Journal `⏸ PG3`
- [ ] **F5.7** - Prompt Rotation `⏸ PG3`
- [ ] **F5.9** - Sentiment Sparkline `⏸ PG3`
- [ ] **F5.10** - Share Snippets `⏸ PG3`
- [ ] **F5.11** - Writing Streaks `⏸ PG3`
- [ ] **F5.12** - Topic Tags `⏸ PG3`
- [ ] **F5.14** - Brain Dump
- [ ] **F9.1** - One Action
- [ ] **F9.2** - Bookends
- [ ] **F9.6** - Pause Protocol
- [ ] **F9.7** - Habit Stacker
- [ ] **F9.10** - Sleep Hygiene
- [ ] Prayer Library

### F2: Safety & Harm Reduction (4 items) - `⏸ PG4`

- [ ] **F10.1** - The Lifeline `⏸ PG4`
- [ ] **F10.2** - The Guardrails `⏸ PG4`
- [ ] **F10.3** - Harm Reduction Locker `⏸ PG4`
- [ ] **F10.4** - Compassionate U-Turn `⏸ PG4`

### F3: Onboarding (3 items)

- [ ] **F12.10** - Intake Interview
- [ ] **F12.11** - Slow Rollout
- [ ] Expanded Onboarding Wizard

---

## 🤝 M7 - Fellowship Suite (📋 Planned - Q4 2026)

**Story Points:** ~350 SP | **Priority:** P1 | **Items:** ~55 | **Target:** Q4
2026

### 👥 M7.1 - Sponsor & Sharing (~15 items)

Sequential work (has dependencies on T2.2 from M5):

- [ ] **T2.3** - Sponsor invitation system
- [ ] **T2.4** - Sponsor acceptance workflow
- [ ] **T2.5** - Read-only sponsor view
- [ ] **T2.6** - Sponsor feedback/comments
- [ ] **T2.7** - Permission granularity UI

### 📄 M7.2 - Exports & Reports (~14 items) - `⏸ PG6`

- [ ] **F7.1** - Recovery Resume `⏸ PG6`
- [ ] **F7.2** - Step Packets `⏸ PG6`
- [ ] **F7.4** - Emergency Wallet Card `⏸ PG6`
- [ ] **F7.5** - Full Archive `⏸ PG6`
- [ ] **T5.2** - Client-side PDF `⏸ PG6`
- [ ] **T5.5** - Preview screen (depends on T5.2)
- [ ] **T5.7** - Watermark option (depends on T5.2)
- [ ] **T5.8** - Web Share API `⏸ PG6`

### 🎸 M7.3 - Nashville & Knowledge (~21 items) - `⏸ PG5`

- [ ] **F6.2** - Am I Doing This Right? `⏸ PG5`
- [ ] **F6.3** - Smart Glossary `⏸ PG5`
- [ ] **F6.4** - Script Lab `⏸ PG5`
- [ ] **F6.6** - Daily Principle Deck `⏸ PG5`
- [ ] **F6.7** - Anatomy of a Meeting `⏸ PG5`
- [ ] **F6.8** - Normie Translator `⏸ PG5`
- [ ] **F6.9** - Service Menu `⏸ PG5`
- [ ] **F6.10** - Fellowship Compass `⏸ PG5`
- [ ] **F6.11** - Traditions in Real Life `⏸ PG5`
- [ ] **F6.12** - Readiness Checkers `⏸ PG5`
- [ ] **F8.1** - Rosetta Stone `⏸ PG5`
- [ ] **T9.5** - FlexSearch `⏸ PG5`

### ⚙️ M7.4 - Personalization & Analytics (~17 items)

- [ ] **F7.6** - 30-Day Retrospective
- [ ] **F8.2** - Theme customization
- [ ] **F8.3** - Widget preferences
- [ ] **F9.3** - Usage analytics dashboard

---

## 🎤 M8 - Speaker Recordings (📋 Planned - Q4 2026)

**Story Points:** ~30 SP | **Priority:** P2 | **Items:** 3 | **Target:** Q4 2026

### Features

- [ ] **M8-001** - Speaker recording playback
- [ ] **M8-002** - Speaker favorites and playlists
- [ ] **M8-003** - Speaker search and discovery

### M8 Exit Criteria: M9 Go/No-Go Decision

| Criterion        | Threshold            | Decision        |
| ---------------- | -------------------- | --------------- |
| MAU              | >1,000               | Proceed with M9 |
| User Requests    | >100 native requests | Proceed with M9 |
| PWA Satisfaction | <70% satisfied       | Proceed with M9 |

---

## 📱 M9 - Native App Features (📋 Planned - 2027)

**Story Points:** ~120 SP | **Priority:** P2 | **Items:** 15 | **Target:** 2027

### Overview

Native mobile features via Capacitor wrapper. All features depend on T8.1.

### F1: Native Security (3 staged items)

- [ ] **T8.1** - Capacitor wrapper (GATE - blocks all other M9 items)
- [ ] **T8.2** - Native biometric auth `⏸ PG7`
- [ ] **T8.3** - Native file system access `⏸ PG7`

### F2: Native Features (6 items) - `⏸ PG7`

- [ ] **T8.4** - Push notifications `⏸ PG7`
- [ ] **T8.5** - Background sync `⏸ PG7`
- [ ] **T9.1** - Deep linking `⏸ PG7`
- [ ] **T9.3** - Offline map tiles `⏸ PG7`
- [ ] **T9.6** - Native share sheet
- [ ] **T9.7** - App store deployment

---

## 💰 M10 - Monetization + Future (🔬 Research - 2027+)

**Story Points:** TBD | **Priority:** P2 | **Items:** ~15 | **Target:** 2027+

> Research phase - not yet scheduled

### Research Findings (December 2025)

See [MONETIZATION_RESEARCH.md](docs/MONETIZATION_RESEARCH.md) for full analysis.

**Recommended Model:** Freemium with premium features

### Deferred Future Enhancements (11 items) - P3

- [ ] **F11.1** - Premium subscription system
- [ ] **F11.2** - Family plan sharing
- [ ] **F11.3** - Donation/tip jar
- [ ] **F11.4** - Corporate wellness partnerships
- [ ] **F11.5** - Treatment center integrations
- [ ] AI-powered insights (premium)
- [ ] Telehealth integration
- [ ] Insurance documentation exports
- [ ] Research data contribution (opt-in)
- [ ] Peer support marketplace
- [ ] Custom branding for organizations

---

## 📊 Technical Debt Backlog

> **Source:** [TECHNICAL_DEBT_MASTER.md](docs/TECHNICAL_DEBT_MASTER.md)

| Severity    | Count | Hours |
| ----------- | ----- | ----- |
| S0 Critical | 7     | ~8h   |
| S1 Major    | 28    | ~40h  |
| S2 Medium   | 45    | ~60h  |
| S3 Minor    | 32    | ~25h  |

See TECHNICAL_DEBT_MASTER.md for full breakdown and prioritization.

---

## 🗓️ Version History

| Version | Date       | Changes                                                                                                 | Author |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------- | ------ |
| 1.2     | 2026-01-29 | PR #324 review: Added DT-007 (JSON state for consolidation tracking)                                    | Claude |
| 1.1     | 2026-01-29 | Session #114: Added 4 deferred PR review items (DT-004 to DT-006, CTX-004) from Reviews #51, #211, #213 | Claude |
| 1.0     | 2026-01-27 | Initial creation - split from ROADMAP.md; added Parallel Group markers; comprehensive AI Instructions   | Claude |
