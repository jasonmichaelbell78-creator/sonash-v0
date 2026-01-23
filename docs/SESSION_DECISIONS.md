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

---

## Version History

| Version | Date       | Changes                                                         |
| ------- | ---------- | --------------------------------------------------------------- |
| 1.2     | 2026-01-22 | Add deferred tracker format migration decision (PR review #195) |
| 1.1     | 2026-01-21 | Add 12 expansion evaluation foundational decisions              |
| 1.0     | 2026-01-17 | Initial creation with Firebase decisions                        |
