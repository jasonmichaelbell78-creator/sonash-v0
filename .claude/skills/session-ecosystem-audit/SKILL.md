---
name: session-ecosystem-audit
description: |
  Comprehensive diagnostic of the Session Ecosystem — 16 categories across
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

## CRITICAL RULES (Read First)

1. **CHECK for saved progress first** — resume from
   `.claude/tmp/session-audit-progress.json` if it exists and is < 2 hours old.
   Never re-present findings that were already decided.
2. **ALWAYS run the script first** (if no saved progress) — never generate
   findings without data
3. **ALWAYS display the dashboard to the user** before starting the walkthrough
4. **Present findings one at a time** using AskUserQuestion for decisions
5. **SAVE progress after every decision** — write updated state to progress file
   immediately
6. **Show patch suggestions inline** with each patchable finding
7. **Create TDMS entries** for deferred findings via `/add-debt`
8. **Save decisions** to session log for audit trail

---

## Compaction Guard

Audits are long-running interactive workflows vulnerable to context compaction.
To survive compaction, save progress after every decision and check for existing
progress on startup.

### State File

Path: `.claude/tmp/session-audit-progress.json`

Schema:

```json
{
  "auditTimestamp": "ISO timestamp of audit run",
  "score": 85,
  "grade": "B",
  "totalFindings": 42,
  "currentFindingIndex": 8,
  "decisions": [
    {
      "findingIndex": 1,
      "category": "session_begin_completeness",
      "message": "finding description",
      "decision": "skip",
      "note": "reason"
    }
  ],
  "fixesApplied": ["description of fix"],
  "findingsData": []
}
```

### On Skill Start (Before Phase 1)

1. Check if `.claude/tmp/session-audit-progress.json` exists and is < 2 hours
   old
2. If yes: **resume from saved position**
   - Display the dashboard from saved data (skip re-running the audit script)
   - Show: "Resuming audit from finding {n}/{total} ({n-1} already reviewed)"
   - List prior decisions briefly: "{n} fixed, {n} skipped, {n} deferred"
   - Continue the walkthrough from `currentFindingIndex`
3. If no (or stale): proceed to Phase 1 normally

### After Each Decision (During Phase 3)

After each AskUserQuestion response, immediately save progress:

1. Update `currentFindingIndex` to the next finding
2. Append the decision to the `decisions` array
3. If "Fix Now" was chosen, append to `fixesApplied`
4. Write the updated JSON to `.claude/tmp/session-audit-progress.json`

### On Audit Completion (Phase 4)

After the summary is presented, delete the progress file (audit is complete).

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

Sort all findings by `impactScore` descending (highest impact first).

For each finding, present a context card:

```
━━━ Finding {n}/{total} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{SEVERITY}  |  {domainLabel}: {categoryLabel}  |  Impact: {impactScore}/100

{message}

Evidence:
  {details}
```

If the finding has `patchable: true`, also show:

```
Patch Available:
  Target: {patch.target}
  Action: {patch.description}
  Preview:
    {patch.preview or patch.content}
```

Then use `AskUserQuestion` with options based on severity:

**ERROR findings:**

- Fix Now — execute the fix/patch immediately
- Defer — add to deferred list, create DEBT entry
- Suppress — suppress this finding type permanently

**WARNING findings:**

- Fix Now
- Defer
- Skip — acknowledge but don't track

**INFO findings:**

- Acknowledge
- Defer for later

### Handling Decisions

**Fix Now:**

1. If patch is available, apply it (edit file, run command, etc.)
2. If no patch, provide guidance for manual fix
3. Log decision to session file

**Defer:**

1. Create DEBT entry via `/add-debt` with:
   - severity: S1 (errors) or S2 (warnings)
   - category: engineering-productivity
   - source_id: "review:session-ecosystem-audit-{date}"
2. Log decision to session file

**Suppress:**

1. Add to suppression list (not yet implemented — log for future)
2. Log decision to session file

---

## Phase 4: Summary & Actions

After all findings are reviewed, present the summary:

```
━━━ Audit Summary ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Composite: {grade} ({score}/100)  |  {trend}

Decisions:
  Fixed:      {count} findings
  Deferred:   {count} findings → {count} DEBT entries created
  Skipped:    {count} findings
  Suppressed: {count} findings

Patches Applied: {count}/{total patchable}

Top 3 Impact Areas:
  1. {category} — {brief description}
  2. {category} — {brief description}
  3. {category} — {brief description}

Next Steps:
  - {actionable recommendation based on worst categories}
  - {actionable recommendation}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Phase 5: Trend Report (if previous runs exist)

If the state file has previous entries, show improvement/regression:

```
━━━ Trend Report ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Composite Trend: {sparkline}  {direction} ({delta})

Improving:
  {category}: {before} → {after} (+{delta})

Declining:
  {category}: {before} → {after} ({delta})

Stable:
  {category}: {score} (no change)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Category Reference

### Domain 1: Session Lifecycle Management (20% weight)

| Category                        | What It Checks                                                           |
| ------------------------------- | ------------------------------------------------------------------------ |
| Session Begin Completeness      | All /session-begin sections backed by scripts/npm commands that exist    |
| Session End Completeness        | All /session-end sections backed by scripts/npm commands that exist      |
| Session Counter Accuracy        | SESSION_CONTEXT.md counter matches commit-log.jsonl session numbers      |
| Session Documentation Freshness | SESSION_CONTEXT.md within limits: line count, staleness, section quality |

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

## Benchmarks

Internal benchmarks are defined in `scripts/lib/benchmarks.js`. Each category
scores 0-100 with ratings: good (90+), average (70-89), poor (<70). The
composite grade uses weighted average across all 16 categories with domain
weights: D1=20%, D2=25%, D3=20%, D4=15%, D5=20%.

---

## Checker Development Guide

### Adding a New Category

1. Choose the appropriate domain checker in `scripts/checkers/`
2. Add a new check function following the pattern of existing categories
3. Add benchmarks to `scripts/lib/benchmarks.js`
4. Add weight to `CATEGORY_WEIGHTS` in benchmarks.js (adjust existing weights)
5. Add labels to the orchestrator's `CATEGORY_LABELS` and `CATEGORY_DOMAIN_MAP`
6. Test: `node scripts/run-session-ecosystem-audit.js --summary`

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

| Version | Date       | Description                                   |
| ------- | ---------- | --------------------------------------------- |
| 1.0     | 2026-02-23 | Initial implementation                        |
| 1.1     | 2026-02-24 | Add compaction guard for progress persistence |
