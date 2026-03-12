---
name: ecosystem-health
description: >-
  Interactive health dashboard with 8-category composite scoring, 13-dimension
  drill-down, trend tracking, and fix-on-the-spot triage. Runs 10 health
  checkers, persists scores to JSONL, and guides interactive remediation through
  deep-plan Q&A style decisions.
---

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-03-11
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Ecosystem Health -- Interactive Dashboard

**Ecosystem ownership:** Part of `health-ecosystem-audit` ecosystem (D#18,
D#31). Audited by `/health-ecosystem-audit` D4: Consumer Integration (D#47).

## Critical Rules (MUST follow)

1. **MUST** run the orchestrator script before presenting any data
2. **MUST** present the dashboard to the user before starting triage
3. **MUST** use conversational Q&A (deep-plan style) for all triage decisions —
   NEVER use AskUserQuestion
4. **MUST** persist triage decisions to state file after each dimension
5. **MUST** check for duplicate runs before executing health checks
6. **MUST** follow CLAUDE.md Section 5 anti-patterns and Section 2 security
   rules when executing fixes
7. **SHOULD** check ROADMAP.md before presenting fix options (note tracked
   items)
8. **SHOULD** present effort estimate in warm-up

## Routing Guide

| I want to...                        | Use                               |
| ----------------------------------- | --------------------------------- |
| See overall ecosystem health score  | `/ecosystem-health`               |
| Quick check on active warnings      | `/alerts`                         |
| Deep audit of health infrastructure | `/health-ecosystem-audit`         |
| Investigate a specific dimension    | `/ecosystem-health --dimension=X` |
| Fix health issues interactively     | `/ecosystem-health` (triage loop) |

## When to Use

- User explicitly invokes `/ecosystem-health`
- User asks about ecosystem health, health score, or health dashboard

## When NOT to Use

- For quick alert triage: use `/alerts` instead
- For auditing the health infrastructure itself (checkers, scoring logic, data
  pipelines): use `/health-ecosystem-audit`. This skill _uses_ the health
  infrastructure; that skill _audits_ it.

## Overview

Runs 10 health checkers across 8 weighted categories (64 metrics), computes
composite score with letter grades, persists results with trend tracking, and
guides interactive triage of flagged dimensions.

**Output:** Markdown dashboard + interactive triage loop + closure summary.

## Usage

```
/ecosystem-health              # Full check with triage
/ecosystem-health --quick      # Fast subset (4 checkers), no triage
/ecosystem-health --dimension=X  # Drill into specific dimension
```

---

## Workflow

### Phase 0: Warm-up (SHOULD)

Read the last entry from `ecosystem-health-log.jsonl` and present context:

```
Ecosystem Health Check
Last run: [grade] ([score]/100), [N days/hours] ago
Previously flagged: [dimension list]
Full run with triage: ~10-15 min. Quick dashboard only: ~1 min.
Running [full/quick] check now...
```

**Done when:** Previous score displayed, mode announced.

### Phase 1: Run Health Checks (MUST)

**Duplicate-run guard (MUST):** Before running, read the last entry in
`ecosystem-health-log.jsonl`. If the last entry is < 30 minutes old, warn:
"Health check already ran this session (score: X). Re-run anyway? [y/N]"

Execute the orchestrator script:

```bash
node .claude/skills/ecosystem-health/scripts/run-ecosystem-health.js
# For quick mode:
node .claude/skills/ecosystem-health/scripts/run-ecosystem-health.js --quick
```

**Error handling (MUST):** If the script fails:

1. Show the error (sanitized via `scripts/lib/sanitize-error.js`)
2. Suggest running directly: `node scripts/health/run-health-check.js`
3. Offer to display the last cached dashboard from `ecosystem-health-log.jsonl`

**Done when:** Script completes successfully or fallback displayed.

### Phase 2: Display Dashboard (MUST)

Present the script's markdown output. Add severity emoji badges to grades:

- A/B: green circle
- C: yellow circle
- D: orange circle
- F: red circle

**Done when:** Dashboard shown to user.

### Phase 3: Interactive Triage Loop (SHOULD)

> Read `.claude/skills/ecosystem-health/REFERENCE.md` for dimension
> descriptions, action mapping table, and Q&A format template.

**Scope boundary (MUST):** The triage loop is for quick fixes and deferral
decisions. If a fix requires more than one command or 5 minutes, recommend
deferring to a dedicated session.

**Entry:** Identify all dimensions scoring below C (< 70). If none, skip to
Phase 5.

**ROADMAP check (SHOULD):** Before presenting fix options, check ROADMAP.md. If
a dimension's issue is already tracked (e.g., debt-aging → ROADMAP Track D),
note it: "Already tracked: ROADMAP Track D (Debt Elimination, ~6%)."

**Delegation protocol (MUST):** Ask the user which triage mode to use:

- **Review each** (default) — present one dimension at a time
- **Fix all** — accept all recommendations without review
- **You decide** — AI picks based on severity (fix F-grade, defer D-grade, skip
  C-grade)

**Batch management (SHOULD):** If 5+ dimensions are flagged, present in severity
batches: F-grade first (batch 1), then D-grade (batch 2), then C-grade (batch
3). Show "Batch 1 of N: critical dimensions" header.

**Per-dimension Q&A format (MUST for review-each mode):**

```
**Dimension N of M** | Progress: X fixed, Y deferred, Z skipped

**[Dimension Name]** ([grade]/[score])
Problem: [1-2 sentence description from REFERENCE.md]
Options:
  1. [Fix command/skill] — [what it does, expected impact]
  2. [Alternative fix] — [trade-offs]
  3. Defer — add to next session goals
  4. Skip — no action needed
Recommendation: Option [N] because [rationale]
```

**Decision persistence (MUST):** After each dimension decision, save to state
file: dimension, score, action taken, command run (if any).

**Done when:** All flagged dimensions reviewed, all decisions recorded.

### Phase 4: Execute Fixes (MAY)

Run the commands/skills approved in Phase 3. For each fix:

1. Run the command
2. Report success/failure
3. Update state file with result

**Done when:** All approved fixes attempted.

### Phase 5: Closure (MUST)

Present closure summary:

```
Health Check Complete
Score: [grade] ([score]/100) [trend arrow]
Triaged: [N] dimensions ([M] fixed, [K] deferred, [J] skipped)
Fixes applied: [list commands run]
Deferred items: [list with recommended timing]
Next check: [recommendation based on findings]
```

**Session-end handoff (SHOULD):** The triage state file serves as data source
for `/session-end` to report: "N dimensions triaged (M fixed, K deferred)."

**Retro prompt (SHOULD):** "Any observations? (Inaccurate dimension
descriptions, fix commands that need updating, missing dimensions.) Enter
feedback or 'none' to complete."

**Done when:** Summary displayed, feedback captured (or skipped).

---

## Guard Rails

- **Script failure:** Show sanitized error, offer cached dashboard fallback
- **Scope explosion:** Triage is for quick fixes only — defer deep
  investigations to dedicated sessions
- **Duplicate runs:** Warn if < 30 min since last run to prevent trend pollution
- **Pause/resume:** User says "pause" → save all decisions to state file, print
  progress ("5 of 8 dimensions triaged"), exit cleanly. On next invocation,
  check state file — if incomplete triage exists, offer to resume without
  re-running checks

## Anti-Patterns

- Running during PR review (health checks reflect repo state, not PR diff)
- Trying to fix all F-grades in one triage session (scope explosion)
- Ignoring trend direction when absolute score is acceptable (B but degrading)
- Re-running repeatedly to "see the score improve" (pollutes trend data)

---

## Compaction Resilience

- **State file:** `.claude/state/task-ecosystem-health-triage.state.json`
- **Update frequency:** After each triage dimension decision
- **Recovery:** On resume, re-read state, skip completed dimensions, resume
  triage without re-running checks
- **Schema:**
  `{ dimensions: [{ id, score, action, command, timestamp }], mode, dashboard_score, started }`

---

## Data & Artifact Contracts

| File                                                    | Purpose             | Writer                                 | Consumers                                                            |
| ------------------------------------------------------- | ------------------- | -------------------------------------- | -------------------------------------------------------------------- |
| `data/ecosystem-v2/ecosystem-health-log.jsonl`          | Historical scores   | `run-ecosystem-health.js`              | `/alerts` trend, `health-ecosystem-audit` D4, `/session-end` metrics |
| `data/ecosystem-v2/warnings.jsonl`                      | Active warnings     | `warning-lifecycle.js` (not yet wired) | This skill (Active Warnings section)                                 |
| `.claude/state/task-ecosystem-health-triage.state.json` | Triage decisions    | This skill (Phase 3)                   | `/session-end` (session summary)                                     |
| `scripts/health/checkers/*.js`                          | Health check logic  | Manual                                 | `run-health-check.js` orchestrator                                   |
| `scripts/health/lib/*.js`                               | Scoring, dimensions | Manual                                 | Checkers, orchestrator                                               |

---

## Integration

- Persists each run to `ecosystem-health-log.jsonl` for historical tracking
- Reads active warnings from `warnings.jsonl` (warning-lifecycle.js)
- Trend computed from last 5 runs using `scoring.js` `computeTrend`
- Triage state consumed by `/session-end` for session summary

---

## Version History

| Version | Date       | Description                                               |
| ------- | ---------- | --------------------------------------------------------- |
| 2.0     | 2026-03-11 | Full rewrite: interactive triage, guard rails, Q&A format |
| 1.0     | 2026-03-01 | Initial release                                           |
