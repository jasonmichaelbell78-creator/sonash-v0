---
name: multi-ai-audit
description:
  Interactive orchestrator for multi-AI consensus audits with any-format input
  support
---

<!-- prettier-ignore-start -->
**Document Version:** 1.5
**Last Updated:** 2026-02-16
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Multi-AI Audit Orchestrator

## When to Use

- Tasks related to multi-ai-audit
- User explicitly invokes `/multi-ai-audit`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## Purpose

Single-entry-point skill that orchestrates the entire multi-AI audit workflow
with:

- Category-by-category progression (user-controlled)
- Template output for external AI systems
- Schema fixing/normalization for messy AI outputs
- Per-category aggregation with verification
- Final cross-category unification
- Automated TDMS intake (MASTER_DEBT.jsonl integration)
- Automated roadmap track assignment and validation
- Context compaction survival via file-based state

**Invocation:** `/multi-ai-audit`

---

## AI Instructions

This skill is invoked via `/multi-ai-audit`. Follow the workflow state machine
below step-by-step. Do not skip phases or summarize template output.

---

## Workflow State Machine

```
START -> Check Session -> [No Session] -> Create New Session -> Select Category
                       -> [Has Session] -> Offer Resume

Select Category -> Output Template -> Await Findings

Await Findings -> [User: "add <source>"] -> Prompt for Paste -> Process Findings -> Await Findings
              -> [User: "done"] -> Aggregate Category -> Select Next Category
              -> [User: "skip"] -> Select Next Category
              -> [User: "finish"] -> Unify All Categories -> Interactive Review -> TDMS Intake -> Roadmap Integration -> COMPLETE
              -> [User: "status"] -> Show Status -> Await Findings
```

---

## Phase 1: Session Initialization

**On skill invocation, execute these steps:**

### Step 1.1: Check for Existing Session

Read the state file:

```javascript
// Read: .claude/multi-ai-audit/session-state.json
```

**If session exists and status !== "complete":**

Present to user:

```
Found incomplete session: [session_id]
  Created: [date]
  Current category: [category or "none"]
  Completed: [list of completed categories]
  Pending: [list of pending categories]

Options:
1. Resume this session
2. Start fresh (new session)
```

Wait for user choice before proceeding.

**If no session or user chooses fresh:**

### Step 1.2: Create New Session

```bash
node scripts/multi-ai/state-manager.js create
```

This creates:

- Session ID: `maa-YYYY-MM-DD-<random6>`
- Directory: `docs/audits/multi-ai/<session-id>/`
  - `raw/` - For user-pasted findings
  - `canon/` - For aggregated findings
  - `final/` - For unified output
- State file: `.claude/multi-ai-audit/session-state.json`

### Step 1.3: Select Audit Scope

After session creation (or when starting a fresh session), present scope
options:

```
=== Multi-AI Audit: [session_id] ===

Audit scope:
  a. All categories (full 9-category sweep)
  b. Select specific categories
  c. Single category

Enter choice:
```

**Option "a" (all):** Set all 9 categories to pending. Proceed to first
category.

**Option "b" (select):** Display numbered list:

```
Available categories:
  1. code-quality
  2. security
  3. performance
  4. refactoring
  5. documentation
  6. process
  7. engineering-productivity
  8. enhancements
  9. ai-optimization

Enter category numbers (comma-separated, e.g., 1,3,7):
```

Set selected categories to "pending", all others to "skipped". Proceed to first
selected category.

**Option "c" (single):** Display same numbered list, user picks exactly one.

Update state file with selected categories:

```bash
node scripts/multi-ai/state-manager.js update <session-id> selected_categories='["security","performance"]'
```

### Step 1.4: Present Category Menu

```
=== Multi-AI Audit: [session_id] ===

Select a category to audit:

  1. code          - Code quality, hygiene, types, testing
  2. security      - Rate limiting, auth, Firebase, OWASP
  3. performance   - Bundle, rendering, memory, vitals
  4. refactoring   - Duplication, architecture, boundaries
  5. documentation - Links, staleness, coverage, tiers
  6. process       - CI/CD, hooks, scripts, triggers
  7. engineering-productivity - Golden path, debugging, DX
  8. enhancements  - Feature gaps, UX improvements, nice-to-haves
  9. ai-optimization - Token waste, skill overlap, hook latency

Enter category name or number (or "status" to see progress):
```

---

## Phases 2-9: Detailed Execution

> Read `.claude/skills/multi-ai-audit/templates.md` for template code blocks,
> example prompts, JSONL schema examples, and detailed phase instructions
> covering:
>
> - **Phase 2**: Template output (reading, placeholder filling, full output)
> - **Phase 3**: Collecting findings (paste handling, normalize/fix pipeline)
> - **Phase 4**: Category aggregation (dedup, consensus, CANON IDs)
> - **Phase 5**: Cross-category unification
> - **Phase 6**: Interactive review (mandatory before TDMS intake)
> - **Phase 7**: TDMS intake (dry-run, execute, report)
> - **Phase 8**: Roadmap integration (placement analysis, severity rules)
> - **Phase 9**: Final summary and session completion

---

## Status Command

**When user says "status" at any point:**

```
=== Session Status: [session_id] ===

Created: [date]
Phase: [collecting|aggregating|unifying|intake|roadmap|complete]
Current category: [category or none]

Category Progress:
  [check] code          - 34 findings from 3 sources
  [check] security      - 28 findings from 2 sources
  [o]     performance   - collecting (1 source so far)
  [-]     refactoring   - pending
  [-]     documentation - pending
  [-]     process       - pending
  [-]     engineering-productivity - pending
  [-]     enhancements  - pending
  [-]     ai-optimization - pending

Legend: [check] complete, [o] in progress, [-] pending

Commands:
  - Select category: Enter name or number (1-9)
  - Add findings: "add <source>"
  - Aggregate: "done"
  - Skip: "skip"
  - Finish: "finish"
```

---

## Error Recovery

### Context Compaction Recovery

If the skill is invoked after context compaction:

1. The state file persists at `.claude/multi-ai-audit/session-state.json`
2. Backup state at `docs/audits/multi-ai/<session>/state.json`
3. All raw findings are saved to disk
4. Skill automatically offers to resume

### Parse Error Recovery

If normalize-format.js encounters issues:

- Partial results are saved
- Low confidence is assigned to uncertain extractions
- Original input is saved for manual review

### Validation Failures

Schema fixer never rejects findings - it always produces output:

- Missing fields get defaults
- Invalid values get normalized
- Confidence is reduced for uncertain data

---

## Related Documentation

- [JSONL_SCHEMA_STANDARD.md](../../../docs/templates/JSONL_SCHEMA_STANDARD.md) -
  Field definitions
- [docs/audits/multi-ai/templates/](../../../docs/audits/multi-ai/templates/) -
  Audit templates
- [scripts/multi-ai/](../../../scripts/multi-ai/) - Processing scripts
  (normalize, aggregate, unify)
- [scripts/debt/intake-audit.js](../../../scripts/debt/intake-audit.js) - TDMS
  intake (Phase 7)
- [scripts/debt/assign-roadmap-refs.js](../../../scripts/debt/assign-roadmap-refs.js) -
  Roadmap assignment (Phase 8)
- [scripts/debt/sync-roadmap-refs.js](../../../scripts/debt/sync-roadmap-refs.js) -
  Roadmap validation (Phase 8)
- [scripts/debt/generate-metrics.js](../../../scripts/debt/generate-metrics.js) -
  Metrics regeneration (Phase 8)
- [docs/technical-debt/PROCEDURE.md](../../../docs/technical-debt/PROCEDURE.md) -
  TDMS procedures

---

## Version History

| Version | Date       | Changes                                                                                                                                                                 |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.5     | 2026-02-16 | Added Step 1.3 (audit scope selection) for category scoping: all, select, or single category mode; renumbered category menu to Step 1.4                                 |
| 1.4     | 2026-02-16 | Added enhancements + ai-optimization categories (7->9), updated template mapping, output checklist, status display, roadmap integration table, and all count references |
| 1.3     | 2026-02-06 | Added per-category output checklist to Step 2.3 to prevent template summarization/truncation (recurring error)                                                          |
| 1.2     | 2026-02-05 | Fixed template mapping table format, standardized prompt extraction regex, resolved REFACTORING_AUDIT.md ambiguity                                                      |
| 1.2     | 2026-02-17 | Added Phase 6 (Interactive Review) — mandatory user review before TDMS intake; renumbered remaining phases 7-9                                                          |
| 1.1     | 2026-02-05 | Added TDMS intake, roadmap integration, summary phases — automates the full pipeline from unified findings through MASTER_DEBT.jsonl and roadmap track assignment       |
| 1.0     | 2026-02-04 | Initial skill creation                                                                                                                                                  |
