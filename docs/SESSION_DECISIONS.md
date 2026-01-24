# Session Decision Log

**Document Version:** 1.2 **Last Updated:** 2026-01-22

## Purpose

This document captures important decisions, options presented, and user choices
to prevent loss during context compaction. It serves as a persistent record of
architectural, feature, and implementation decisions made during Claude Code
sessions.

**Auto-updated by:** Claude Code when presenting options or making decisions

---

## AI Instructions

When presenting 3+ options to the user:

1. Save the decision to this document AFTER user makes their choice
2. Include context, all options presented, user's choice, and rationale
3. Link to implementation (PR/commit/roadmap item)
4. Update version history table

Use this for:

- Architectural decisions (tech stack, patterns, infrastructure)
- Feature design choices (behavior, scope, implementation approach)
- Process decisions (workflow, tooling, sprint planning)

Do NOT use for trivial choices (naming, formatting, minor tweaks).

---

## Quick Start

**For AI Assistants:**

1. Check if presenting 3+ options → save decision after user chooses
2. Use Decision Format template below
3. Update Version History table
4. Reference this doc in SESSION_CONTEXT.md when decisions are logged

**For Developers:**

- Review recent decisions for context on "why" choices were made
- Check Version History for decision timeline

---

## Decision Format

```markdown
### [DATE] - [SHORT TITLE]

**Context:** Brief description of what prompted this decision **Options
Presented:**

1. Option A - description
2. Option B - description ...

**User Choice:** Which option(s) selected **Rationale:** Why this choice was
made (if discussed) **Implementation:** Link to PR/commit or roadmap item
```

---

## Decisions Log

### 2026-01-17 - Firebase Console In-App Features

**Context:** User asked what Firebase/GCP Console features could be brought into
the admin panel to reduce context switching.

**Options Presented:** (reconstructed from implementation)

1. **Password Reset Button** - Send password reset emails from Users tab
2. **Storage Stats** - View storage usage, file counts, orphaned files
3. **Rate Limit Viewer** - View/clear active rate limits
4. **Collection Document Counts** - See Firestore collection sizes
5. **User Analytics Tab** - DAU/WAU/MAU trends visualization
6. **Job Results Detailed Viewer** - View full job output logs in-app
7. **Sentry Error → User Correlation** - Link errors to specific users
8. **GCP Cloud Logging Query Builder** - Simple log queries without GCP Console
9. _(Not recovered)_
10. _(Not recovered)_

**User Choice:** Items 1-8

**Implementation:**

- Items 1-4: Complete (A15-A18) - Commit 89e5c83
- Items 5-8: Planned (A19-A22) - Added to Track A-P2 in ROADMAP.md v2.11

### 2026-01-21 - Expansion Evaluation Foundational Decisions

**Context:** Before evaluating ~280 expansion ideas across 21 modules, 12
foundational questions needed resolution to guide all subsequent module
evaluations. These decisions establish core principles for architecture,
features, tooling, and process.

**Options Presented:**

**Architecture (4 decisions):**

1. **Offline-first priority** - (a) Blanket offline-first policy, (b)
   Case-by-case evaluation, (c) Cloud-first only
2. **Encryption scope** - (a) Encryption for step work only, (b) Maximum
   encryption everywhere possible, (c) Minimal encryption for compliance
3. **Native wrapper** - (a) Build native apps now, (b) Defer to focus on PWA,
   (c) Never go native
4. **Evaluation order** - (a) Sequential F1-F12→T1-T9, (b) Dependency-grouped
   hybrid, (c) Random/flexible

**Features (3 decisions):**

5. **Nashville scope** - (a) Nashville-only hardcoded, (b) Nashville-first with
   abstraction, (c) Multi-city from day 1
6. **Sponsor model** - (a) Two-way sync, (b) Push-only (sponsee sends
   snapshots), (c) Pull-only (sponsor requests data)
7. **Meeting finder** - (a) Keep manual process, (b) Explore automation scripts,
   (c) Build full automation immediately

**Technical Tooling (3 decisions):**

8. **IndexedDB library** - (a) Vanilla IndexedDB, (b) Dexie.js, (c) localForage,
   (d) PouchDB
9. **PDF generation** - (a) jsPDF, (b) @react-pdf/renderer, (c) pdfmake, (d)
   Third-party service
10. **Analytics approach** - (a) No analytics, (b) Minimal custom (tiered
    privacy), (c) Google Analytics 4, (d) Full product analytics platform

**Process (2 decisions):**

11. **ROADMAP integration** - (a) Immediate push to ROADMAP, (b) Staged with
    explicit push, (c) Separate tracking doc only
12. **Session workflow** - (a) Complete all modules in one session, (b)
    Checkpointed resumable sessions

**User Choice:**

**Architecture:**

1. **Per-feature decision** - Evaluate each module's offline need individually
   (not blanket policy)
2. **Mandatory maximum** - All step work encrypted as much as possible;
   implementation details TBD during T4
3. **Defer** - Focus on PWA first; revisit when evaluating F11/T8
4. **Hybrid (dependency-grouped)** - 7-phase evaluation analyzing F↔T
   connections

**Features:** 5. **Nashville-first, abstracted** - Build for Nashville with city
as parameter for future expansion 6. **Push only** - Sponsee sends read-only
snapshots on demand (maximum privacy/agency) 7. **Explore automation** - Worth
exploring scripts for periodic pulls + geocoding pipeline

**Technical Tooling:** 8. **Dexie.js** - Rich query API, React `useLiveQuery`
hook, declarative schema, encryption addon 9. **@react-pdf/renderer** - React
component model, flexbox layout, auto-pagination, lazy-loaded 10. **Minimal
custom (Tier 1 + opt-in Tier 2)** - Privacy-first: Tier 1 = anonymous
aggregates, Tier 2 = explicit opt-in

**Process:** 11. **Staged with explicit push** - Log decisions during
evaluation; push to ROADMAP only on user request (prevents ROADMAP churn) 12.
**Checkpointed resumable** - Save state between sessions for ~280-idea
evaluation

**Rationale:** These decisions balance:

- Privacy-first principles (encryption max, tiered analytics, sponsor push
  model)
- Future flexibility (city abstraction, PWA-first before native)
- Developer experience (React-based PDF, Dexie hooks, dependency-grouped
  evaluation)
- Process control (staged ROADMAP integration, resumable sessions)

**Implementation:**

- Documented in `docs/EXPANSION_EVALUATION_TRACKER.md` (foundational decisions
  section)
- Embedded in `.claude/skills/expansion-evaluation/SKILL.md` (guides all module
  evaluations)
- Evaluation ready to begin with Phase 1: T4 (Encryption) → F4 (Offline/Privacy)

### 2026-01-22 - Expansion Tracker Format Migration (DEFERRED)

**Context:** During PR review #195 of the expansion evaluation placement
metadata framework, Qodo suggested migrating `EXPANSION_EVALUATION_TRACKER.md`
from Markdown to JSON/YAML structured format (Importance: 9/10).

**Options Presented:**

1. **Keep Markdown** - Maintain current human-readable format with structured
   tables
   - Pros: Easy to read/edit manually, git diffs are meaningful, low friction
     for updates
   - Cons: Harder to parse programmatically, no schema validation, potential for
     formatting inconsistencies
2. **Migrate to JSON** - Convert tracker to structured JSON with schema
   validation
   - Pros: Programmatically accessible, schema validation, tooling support
   - Cons: Lose human readability, require tooling for all edits, verbose format
3. **Migrate to YAML** - Convert tracker to YAML (human-friendly structured
   format)
   - Pros: Balance of readability and structure, schema validation possible,
     easier to parse than Markdown
   - Cons: Less familiar than Markdown, still requires tooling for complex
     updates, whitespace-sensitive
4. **Hybrid Approach** - Keep Markdown for primary tracking, generate JSON/YAML
   artifacts for automation
   - Pros: Best of both worlds, no workflow disruption, enables automation
   - Cons: Synchronization complexity, potential for drift between formats

**User Choice:** _(Pending user input)_

**Rationale:** _(To be determined)_

**Implementation:** _(TBD after user decision)_

**Notes:**

- Current tracker actively used in Markdown format during expansion evaluation
  sessions
- Migration would affect workflow for `/expansion-evaluation` skill
- Automation benefits: deterministic parsing for ROADMAP push, validation, state
  queries
- Decision deferred during PR review to avoid blocking documentation fixes

### 2026-01-24 - ROADMAP Integration: Expansion Items Overlap Resolution

**Context:** During Phase A of the ROADMAP v3.0 integration, Pass 2
deduplication analysis identified 19 items that partially overlapped with
existing ROADMAP features. User decision required to determine whether to MERGE
(enhance existing) or ADD (new feature) for each overlap.

**Options Presented:**

1. **Accept All Recommendations** - Accept Pass 2 recommendations: MERGE T2.4
   into M1.5, ADD all 18 others as new features
2. **Review Each Category** - Present overlaps by category (Sponsor, Journaling,
   Meeting, Export, Privacy, Engagement) for individual decisions
3. **Show All 19 at Once** - Display all 19 overlaps in single summary for batch
   review

**User Choice:** Option 1 - Accept All Recommendations

**Details:**

- **MERGE (1 item):** T2.4 (Sponsor contact storage) → M1.5 Sponsor
  Personalization (same data model)
- **ADD (18 items):** F2.1, F2.5, F2.6, F5.2, F5.12, F7.6, F3.3, F9.5, F3.6,
  F7.1, F7.7, F4.12, F4.10, F9.2, F9.10 + 3 others
- **SKIP (8 duplicates):** F12.10, F8.2, F8.3, F2.3, F7.9, T6.7, F6.1, F3.1

**Rationale:** Pass 2 analysis confirmed 90.6% of staged items were truly unique
contributions. The 18 ADD items expand on existing concepts with distinct
functionality (e.g., Pattern Matcher broader than HALT detection, Export
features target different audiences than celebration graphics).

**Implementation:**

- ROADMAP.md v3.0 - 76 items integrated (85 - 8 duplicates - 1 merge)
- M4.5 and M9 sections added
- M5, M6, M7 updated with expanded feature groups
- Full analysis in `analysis/pass2_deduplication.md`

### 2026-01-24 - ROADMAP v3.9 Reorganization (10 Recommendations)

**Context:** After completing Phase B Full Analysis (passes B1-B6) of the
unified ROADMAP with all 660 items, 10 actionable recommendations were
generated. User reviewed each recommendation sequentially and made decisions.

**Recommendations & Decisions:**

| #   | Recommendation                  | Options                                                 | User Choice                                      |
| --- | ------------------------------- | ------------------------------------------------------- | ------------------------------------------------ |
| 1   | Remove 8 duplicates             | (1) Apply all, (2) Review each, (3) Skip                | **Apply all**                                    |
| 2   | Relocate 4 miscategorized items | (1) Apply all, (2) Review each, (3) Skip                | **Apply all**                                    |
| 3   | Assign 28 missing priorities    | (1) Apply all P2/P3, (2) Review each, (3) Skip          | **Apply all**                                    |
| 4   | Split M2 and M7 milestones      | (1) Apply both, (2) M2 only, (3) M7 only, (4) Skip      | **Apply both**                                   |
| 5   | Add encryption R&D tracking     | (1) Create R&D items, (2) Add notes only, (3) Skip      | **Create R&D items**                             |
| 6   | Content licensing outreach      | (1) Create task, (2) Add to M6, (3) Skip, (4) Later     | **Skip** (not blocking critical safety features) |
| 7   | Create parallel execution guide | (1) Add notes to ROADMAP, (2) Detailed guide            | **Detailed guide**                               |
| 8   | Add M9 go/no-go gate            | (1) Add after M9, (2) Add to M8 exit criteria, (3) Skip | **M8 exit criteria**                             |
| 9   | Consolidate overlapping domains | (1) Add cross-refs, (2) Merge into groups, (3) Skip     | **Add cross-refs**                               |
| 10  | Add R&D notes to E3 items       | (1) Add notes, (2) Create R&D tasks, (3) Skip           | **Add notes**                                    |

**Implementation (ROADMAP.md v3.0 → v3.9):**

- v3.1: Removed 8 duplicates (C1, ADMIN-FE-2, FD-005, FD-006, etc.)
- v3.2: Relocated 4 items (DEDUP-0001→M4.5, EFF-011→M5, etc.)
- v3.3: Assigned P2/P3 to 28 items
- v3.4: Split M2 into M2.1/M2.2/M2.3 and M7 into M7.1/M7.2/M7.3/M7.4
- v3.5: Created 4 pre-M4.5 R&D items (RND-T4.2, RND-T4.3, RND-AUDIT, RND-DEXIE)
- v3.6: Created `analysis/PARALLEL_EXECUTION_GUIDE.md` with 7 parallelization
  groups
- v3.7: Added M8 exit criteria with go/no-go decision table for M9
- v3.8: Added ⚡ cross-references for overlapping domains
- v3.9: Added 🔬 R&D notes to E3 items

**Key Clarification (Rec 6):** User asked what "4 safety features" were blocked
by licensing. Clarified that licensing only blocks meditation/spiritual content
features (M6-PRAYER, M6-MED-1, M6-MED-2, F6.5), NOT critical safety features
like crisis hotlines (SOS Button, Guardrails, etc.).

**Artifacts Created:**

- `analysis/FULL_ANALYSIS_SUMMARY.md` - Consolidated analysis findings
- `analysis/PARALLEL_EXECUTION_GUIDE.md` - 7-group parallel execution plan
  (15-week savings)
- `analysis/full_dependencies.md` - Item-level dependency mapping
- `analysis/full_categorization.md` - 396 items categorized across 11 categories

---

## Version History

| Version | Date       | Changes                                                         |
| ------- | ---------- | --------------------------------------------------------------- |
| 1.4     | 2026-01-24 | Add ROADMAP v3.9 reorganization (10 recommendations)            |
| 1.3     | 2026-01-24 | Add ROADMAP v3.0 overlap resolution decision                    |
| 1.2     | 2026-01-22 | Add deferred tracker format migration decision (PR review #195) |
| 1.1     | 2026-01-21 | Add 12 expansion evaluation foundational decisions              |
| 1.0     | 2026-01-17 | Initial creation with Firebase decisions                        |
