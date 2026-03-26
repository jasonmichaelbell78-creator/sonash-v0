---
name: session-ecosystem-audit
description: |
  Comprehensive diagnostic of the Session Ecosystem — 17 categories across
  5 domains with composite health scoring, trend tracking, patch suggestions,
  and interactive finding-by-finding walkthrough. Covers session lifecycle hooks,
  state persistence, compaction resilience layers, cross-session safety, and
  integration configuration.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-23
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Session Ecosystem Audit

Deep diagnostic of the entire Session Ecosystem — lifecycle skills
(`session-begin`, `session-end`, `checkpoint`, `alerts`), hooks
(`session-start.js`, `commit-tracker.js`, `pre-compaction-save.js`,
`compact-restore.js`, `compaction-handoff.js`), state files (`handoff.json`,
`commit-log.jsonl`, `session-notes.json`), and the 4-layer compaction resilience
system. Produces per-category scores, a composite health grade (A-F), trend
tracking across runs, and an interactive walkthrough with patch suggestions.

**Invocation:** `/session-ecosystem-audit`

**When to use:** When you want to understand the overall health of the session
management system, identify gaps in lifecycle coverage, validate compaction
resilience layers, check cross-session safety invariants, or verify hook
registration alignment. Complementary with `/hook-ecosystem-audit` (that skill
audits ALL hooks; this skill audits the SESSION SYSTEM specifically).

---

## When to Use

- Tasks related to session-ecosystem-audit
- User explicitly invokes `/session-ecosystem-audit`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## CRITICAL RULES (Read First)

> Read `.claude/skills/_shared/ecosystem-audit/CRITICAL_RULES.md` and follow all
> 8 rules. The rules below are summaries — the shared file is authoritative.

1. **CHECK for saved progress first** (MUST)
2. **ALWAYS run the script first** (MUST)
3. **ALWAYS display the dashboard** (MUST)
4. **Use conversational Q&A for decisions** (MUST) — NEVER use AskUserQuestion
5. **SAVE progress after every decision** (MUST)
6. **Show patch suggestions inline** (SHOULD)
7. **Create TDMS entries** (MUST) for deferred findings
8. **Save decisions** (MUST) to session log

---

## Compaction Guard

> Read `.claude/skills/_shared/ecosystem-audit/COMPACTION_GUARD.md` for the full
> compaction guard protocol (state file schema, resume, save, cleanup).

State file path: `.claude/tmp/session-audit-progress.json`

---

## Phase 1: Run & Parse

1. Run the audit script:

```bash
node .claude/skills/session-ecosystem-audit/scripts/run-session-ecosystem-audit.js
```

2. Parse the v2 JSON output from stdout (progress goes to stderr).

3. Create a session decision log file:
   - Path: `.claude/tmp/session-audit-session-{YYYY-MM-DD-HHMM}.jsonl`
   - Create `.claude/tmp/` directory if it doesn't exist

4. Save initial progress state to `.claude/tmp/session-audit-progress.json` with
   `currentFindingIndex: 0`, the full findings data, score, and grade.

---

## Phase 2: Dashboard Overview (compact)

Present a compact header with composite grade and domain breakdown:

```
Session Ecosystem Health: {grade} ({score}/100)  |  Trend: {sparkline} ({delta})
{errors} errors · {warnings} warnings · {info} info  |  {patches} patch suggestions

┌──────────────────────────────────┬───────┬──────────┬──────────────┐
│ Category                         │ Score │ Rating   │ Trend        │
├──────────────────────────────────┼───────┼──────────┼──────────────┤
│ D1: Session Lifecycle Mgmt       │       │          │              │
│   Session Begin Completeness     │  {s}  │ {rating} │ {trend}      │
│   Session End Completeness       │  {s}  │ {rating} │ {trend}      │
│   Session Counter Accuracy       │  {s}  │ {rating} │ {trend}      │
│   Session Documentation Freshness│  {s}  │ {rating} │ {trend}      │
│   Passive Surfacing Compliance   │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────────┼───────┼──────────┼──────────────┤
│ D2: State Persistence & Handoff  │       │          │              │
│   Handoff File Schema            │  {s}  │ {rating} │ {trend}      │
│   Commit Log Integrity           │  {s}  │ {rating} │ {trend}      │
│   Task State File Health         │  {s}  │ {rating} │ {trend}      │
│   Session Notes Quality          │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────────┼───────┼──────────┼──────────────┤
│ D3: Compaction Resilience        │       │          │              │
│   Layer A: Commit Tracker        │  {s}  │ {rating} │ {trend}      │
│   Layer C: Pre-Compaction Save   │  {s}  │ {rating} │ {trend}      │
│   Layer D: Gap Detection         │  {s}  │ {rating} │ {trend}      │
│   Restore Output Quality         │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────────┼───────┼──────────┼──────────────┤
│ D4: Cross-Session Safety         │       │          │              │
│   Begin/End Balance              │  {s}  │ {rating} │ {trend}      │
│   Multi-Session Validation       │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────────┼───────┼──────────┼──────────────┤
│ D5: Integration & Configuration  │       │          │              │
│   Hook Registration Alignment    │  {s}  │ {rating} │ {trend}      │
│   State File Management          │  {s}  │ {rating} │ {trend}      │
└──────────────────────────────────┴───────┴──────────┴──────────────┘
```

Rating badges: good = "Good", average = "Avg", poor = "Poor"

Then say: **"Found N findings to review. Walking through each one
(impact-weighted)..."**

---

## Phase 3: Finding-by-Finding Walkthrough

> Read `.claude/skills/_shared/ecosystem-audit/FINDING_WALKTHROUGH.md` for the
> full walkthrough protocol (finding card, decisions, patches, delegation,
> batching).

Sort findings by `impactScore` descending (highest impact first). DEBT entries
use source_id: `review:session-ecosystem-audit-{date}`.

---

## Phase 4: Summary & Actions

> Read `.claude/skills/_shared/ecosystem-audit/SUMMARY_AND_TRENDS.md` for the
> summary template, trend report template, and verification re-run template.

Write report to `.claude/tmp/session-audit-report-{YYYY-MM-DD}.md`.

**Process verification:** Run `__tests__/` suite:

```bash
node --test .claude/skills/session-ecosystem-audit/scripts/__tests__/*.test.js
```

---

## Phase 5: Trend Report (if previous runs exist)

> Uses trend report template from `SUMMARY_AND_TRENDS.md`.

History: `.claude/state/session-ecosystem-audit-history.jsonl`

---

## Category Reference

### Domain 1: Session Lifecycle Management (20% weight)

| Category                        | What It Checks                                                           |
| ------------------------------- | ------------------------------------------------------------------------ |
| Session Begin Completeness      | All /session-begin sections backed by scripts/npm commands that exist    |
| Session End Completeness        | All /session-end sections backed by scripts/npm commands that exist      |
| Session Counter Accuracy        | SESSION_CONTEXT.md counter matches commit-log.jsonl session numbers      |
| Session Documentation Freshness | SESSION_CONTEXT.md within limits: line count, staleness, section quality |
| Passive Surfacing Compliance    | Warnings have action paths, HIGH→state flags, MEDIUM→JSONL, no wallpaper |

### Domain 2: State Persistence & Handoff (25% weight)

| Category               | What It Checks                                                           |
| ---------------------- | ------------------------------------------------------------------------ |
| Handoff File Schema    | handoff.json has all 11 required fields + gitState sub-fields            |
| Commit Log Integrity   | commit-log.jsonl entries valid JSON, required fields, file size managed  |
| Task State File Health | task-\*.state.json files valid JSON, no orphaned completed tasks         |
| Session Notes Quality  | session-notes.json valid, entries have timestamps/text, no stale entries |

### Domain 3: Compaction Resilience (20% weight)

| Category                     | What It Checks                                                       |
| ---------------------------- | -------------------------------------------------------------------- |
| Layer A: Commit Tracker      | commit-tracker.js registered, Bash matcher, file exists, content OK  |
| Layer C: Pre-Compaction Save | pre-compaction-save.js registered, captures key state fields         |
| Layer D: Gap Detection       | check-session-gaps.js exists, npm script, reads commit-log + context |
| Restore Output Quality       | compact-restore.js registered with "compact" matcher, reads handoff  |

### Domain 4: Cross-Session Safety (15% weight)

| Category                 | What It Checks                                                    |
| ------------------------ | ----------------------------------------------------------------- |
| Begin/End Balance        | Session begin count matches end count in .session-state.json      |
| Multi-Session Validation | session-start.js has validation logic, SESSION_CONTEXT.md current |

### Domain 5: Integration & Configuration (20% weight)

| Category                    | What It Checks                                                     |
| --------------------------- | ------------------------------------------------------------------ |
| Hook Registration Alignment | 7 expected session hooks registered in settings.json + files exist |
| State File Management       | .claude/state/ gitignored, no oversized files, tmp cleanup         |

---

## Benchmarks & Checker Development

> Read `.claude/skills/_shared/ecosystem-audit/CLOSURE_AND_GUARDRAILS.md` for
> scoring conventions and the checker development guide.

17 categories. Domain weights: D1=20%, D2=25%, D3=20%, D4=15%, D5=20%.

### Data Sources

| Source             | Path                                   | Content                                |
| ------------------ | -------------------------------------- | -------------------------------------- |
| Session skills     | `.claude/skills/session-*/SKILL.md`    | Session begin, end, checkpoint, alerts |
| Session hooks      | `.claude/hooks/session-start.js`       | SessionStart event handler             |
| Commit tracker     | `.claude/hooks/commit-tracker.js`      | PostToolUse commit logger              |
| Pre-compact save   | `.claude/hooks/pre-compaction-save.js` | PreCompact state snapshot              |
| Compact restore    | `.claude/hooks/compact-restore.js`     | SessionStart:compact recovery          |
| Compaction handoff | `.claude/hooks/compaction-handoff.js`  | PreCompact handoff writer              |
| Handoff state      | `.claude/state/handoff.json`           | Last compaction state snapshot         |
| Commit log         | `.claude/state/commit-log.jsonl`       | Historical commit records              |
| Session state      | `.claude/hooks/.session-state.json`    | Begin/end counters and timestamps      |
| Session notes      | `.claude/state/session-notes.json`     | AI-written session context notes       |
| Task states        | `.claude/state/task-*.state.json`      | In-progress task snapshots             |
| Gap detector       | `scripts/check-session-gaps.js`        | Layer D gap detection                  |
| Settings           | `.claude/settings.json`                | Hook registrations                     |
| SESSION_CONTEXT    | `SESSION_CONTEXT.md`                   | Current session counter and status     |

### Compaction Resilience Architecture

```
Layer A: commit-tracker.js (PostToolUse: Bash)
  → Logs every commit to .claude/state/commit-log.jsonl
  → Survives compaction (persistent file)

Layer C: pre-compaction-save.js (PreCompact)
  → Captures full state snapshot to .claude/state/handoff.json
  → Includes: git state, task states, commit log, agents, active plan

Layer D: check-session-gaps.js (session-begin script)
  → Detects undocumented sessions by comparing commit-log vs SESSION_CONTEXT.md
  → Runs at session start to catch missed session-ends

Restore: compact-restore.js (SessionStart: compact)
  → Reads handoff.json after compaction
  → Outputs recovery context to stdout for Claude to read
```

---

## Version History

| Version | Date       | Description                                          |
| ------- | ---------- | ---------------------------------------------------- |
| 1.0     | 2026-02-23 | Initial implementation                               |
| 1.2     | 2026-03-25 | Extract shared patterns to \_shared/ecosystem-audit/ |
| 1.1     | 2026-02-24 | Add compaction guard for progress persistence        |
