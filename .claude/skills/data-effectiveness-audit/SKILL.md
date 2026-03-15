---
name: data-effectiveness-audit
description: >-
  Comprehensive audit of data system effectiveness — lifecycle scoring across
  Capture, Storage, Recall, and Action dimensions for all data systems in the
  project.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-13
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Data Effectiveness Audit

Systematic audit of all data systems to identify write-only data, broken
feedback loops, and enforcement gaps. Uses lifecycle scoring
(Capture/Storage/Recall/Action, 0-3 each, 0-12 total) to quantify effectiveness
and route gaps through the learning-to-automation pipeline.

**Invocation:** `/data-effectiveness-audit`

## Critical Rules (MUST follow)

1. **READ lifecycle-scores.jsonl first** (MUST) — never generate findings
   without current data.
2. **Present findings interactively** (MUST) — one system at a time, worst
   first, with user decisions.
3. **Use conversational Q&A for decisions** (MUST) — NEVER use AskUserQuestion.
4. **Update scores after decisions** (MUST) — write to lifecycle-scores.jsonl
   immediately.
5. **Regenerate dashboard after updates** (MUST) — run
   `node scripts/generate-lifecycle-scores-md.js`.
6. **Route gaps through pipeline** (MUST) — Action<2 gaps routed via
   `scripts/route-lifecycle-gaps.js`.
7. **Create TDMS entries** (MUST) — for deferred findings via `/add-debt`.

---

## When to Use

- User explicitly invokes `/data-effectiveness-audit`
- Periodic health check on data pipeline effectiveness
- After adding new JSONL files or data systems
- When health score Data Effectiveness dimension drops
- When `/alerts` surfaces data staleness warnings

## When NOT to Use

- For individual file rotation — use `scripts/rotate-jsonl.js`
- For learning routing — use `scripts/lib/learning-router.js` directly
- For general health monitoring — use `/health-ecosystem-audit`
- For code quality auditing — use `/audit-code`
- Running all ecosystem audits — use `/comprehensive-ecosystem-audit`

## Routing Guide

| Concern                        | Use                              |
| ------------------------------ | -------------------------------- |
| Data system lifecycle scoring  | `/data-effectiveness-audit`      |
| Health monitoring system audit | `/health-ecosystem-audit`        |
| Hook internals, pre-commit     | `/hook-ecosystem-audit`          |
| PR review workflow             | `/pr-ecosystem-audit`            |
| Session lifecycle              | `/session-ecosystem-audit`       |
| Technical debt management      | `/tdms-ecosystem-audit`          |
| All of the above               | `/comprehensive-ecosystem-audit` |

---

## Process Overview

```
WARM-UP    Orientation     -> Effort estimate, process overview
PHASE 1    Load & Score    -> Read lifecycle-scores.jsonl, check staleness
PHASE 2    Re-Score        -> Score all systems across 4 dimensions (if stale)
PHASE 3    Dashboard       -> Composite grades, domain breakdown (worst first)
PHASE 4    Walkthrough     -> Interactive finding-by-finding decisions
PHASE 5    Route Gaps      -> Run gap routing scripts
PHASE 6    Summary         -> Decision aggregate + remediation plan
PHASE 7    Verification    -> Re-run scoring to confirm improvements
PHASE 8    Closure         -> Retro, invocation tracking, artifact list
```

---

## Warm-Up (MUST)

```
Data Effectiveness Audit
Phases: Load scores -> Re-score -> Dashboard -> Walkthrough -> Route gaps -> Summary
Estimated time: 15-25 min (depends on system count + finding severity)
```

**Done when:** User confirms proceed.

---

## Audit Domains (8)

### D1. Capture Completeness

Score systems on data capture quality (0-3):

| Score | Meaning                           |
| ----- | --------------------------------- |
| 0     | No structured capture             |
| 1     | Ad-hoc/manual capture             |
| 2     | Systematic capture with schema    |
| 3     | Automated capture with validation |

### D2. Storage Health

Score systems on data storage (0-3):

| Score | Meaning                              |
| ----- | ------------------------------------ |
| 0     | No rotation or management            |
| 1     | Exists but unbounded                 |
| 2     | Rotation policy applied              |
| 3     | Rotation + backup + versioned schema |

### D3. Consumer Coverage (Recall)

Score systems on data consumption (0-3):

| Score | Meaning                             |
| ----- | ----------------------------------- |
| 0     | Write-only (no consumer)            |
| 1     | One informational consumer          |
| 2     | Multiple active consumers           |
| 3     | Consumers trigger automated actions |

### D4. Enforcement (Action)

Score systems on automated enforcement (0-3):

| Score | Meaning                            |
| ----- | ---------------------------------- |
| 0     | No enforcement                     |
| 1     | Alerting/informational             |
| 2     | Semi-automated (gates + manual)    |
| 3     | Fully automated (gates + auto-fix) |

### D5. Feedback Loop Closure

Check that data flows form closed loops: capture -> store -> recall -> act ->
improve capture.

### D6. Orphan Detection

Identify files with zero consumers (Recall = 0).

### D7. Growth Management

Verify all JSONL files have rotation policies (Storage >= 2).

### D8. Cross-System Integration

Count cross-skill data flows and identify isolated systems.

---

## Scoring Rubric

| Score | Grade | Meaning                                |
| ----- | ----- | -------------------------------------- |
| 10-12 | A     | Excellent — fully wired and automated  |
| 8-9   | B     | Good — most loops closed, minor gaps   |
| 6-7   | C     | Adequate — functional but gaps exist   |
| 4-5   | D     | Poor — significant gaps, action needed |
| 0-3   | F     | Critical — write-only or broken        |

**Threshold:** Systems below 6/12 are flagged for immediate remediation.

---

## Phase 1: Load & Score (MUST)

1. Read `.claude/state/lifecycle-scores.jsonl` for current scores.
2. Check staleness: if newest entry is > 7 days old, mark as stale.
3. List all known data systems (JSONL files, state files, metrics).
4. Identify any new systems not yet scored.

**Done when:** Current scores loaded and staleness assessed.

---

## Phase 2: Re-Score (CONDITIONAL)

If scores are stale or new systems found:

1. For each data system, score across all 4 dimensions (C/S/R/A).
2. Compute total (0-12) and letter grade.
3. Write updated scores to `.claude/state/lifecycle-scores.jsonl`.
4. Run `node scripts/generate-lifecycle-scores-md.js` to regenerate dashboard.

**Done when:** All systems scored, dashboard regenerated.

**Skip if:** All scores are fresh (< 7 days) and no new systems.

---

## Phase 3: Dashboard (MUST)

Present dashboard sorted by score ascending (worst first):

```
## Data Effectiveness Dashboard

| System | Capture | Storage | Recall | Action | Total | Grade |
|--------|---------|---------|--------|--------|-------|-------|
| ...    | 0-3     | 0-3     | 0-3    | 0-3    | 0-12  | A-F   |

Composite Score: X/12 (Grade)
Systems below threshold (< 6): N
Orphaned systems (Recall = 0): N
Unbounded growth (Storage < 2): N
```

**Zero findings below threshold:** Skip walkthrough, go to Phase 6. **With
findings:** Begin walkthrough.

---

## Phase 4: Finding-by-Finding Walkthrough (MUST)

Sort systems by total score ascending (worst first). For each system below
threshold (< 6/12):

1. Show current scores with dimension breakdown.
2. Identify weakest dimension(s).
3. Recommend specific remediation action.
4. Get user decision.

### Decision Options

- **Fix Now:** Implement remediation in this session.
- **Defer:** Create TDMS entry via `/add-debt`.
- **Skip:** Acknowledge with justification.

### Batch Shortcuts

After 3+ similar low-severity findings: offer batch acknowledgment.

### Scope Explosion Guard

More than 15 systems below threshold: offer filtered review (F-grade only first,
then D-grade).

---

## Phase 5: Route Gaps (MUST)

1. Run `node scripts/route-lifecycle-gaps.js` — routes Action<2 gaps through
   learning-to-automation pipeline.
2. Run `node scripts/route-enforcement-gaps.js` — routes CLAUDE.md enforcement
   gaps.
3. Run `node scripts/verify-enforcement.js` — verify enforcement effectiveness.
4. Present routing results to user.

**Done when:** All gap routing scripts executed and results shown.

---

## Phase 6: Summary & Actions (MUST)

```
## Audit Summary

- Systems audited: N
- Composite score: X/12 (Grade)
- Systems improved: N
- Systems deferred: N
- Systems skipped: N
- Gaps routed: N

### Remediation Plan
[Ordered list of deferred items with priority]

### Key Insights
[2-3 data-driven observations about system health trends]
```

Write report to `.claude/tmp/data-effectiveness-audit-report-{YYYY-MM-DD}.md`.

---

## Phase 7: Verification (SHOULD)

Re-run scoring to confirm improvements:

1. Regenerate lifecycle scores.
2. Compare before/after composite score.
3. Verify fixed systems now score >= 6/12.

---

## Phase 8: Closure (MUST)

1. **Auto-learnings** (MUST): 2-3 data-driven insights about system health.
2. **Invocation tracking** (MUST):
   ```bash
   cd scripts/reviews && npx tsx write-invocation.ts --data '{"skill":"data-effectiveness-audit","type":"skill","success":true,"context":{"score":SCORE,"grade":"GRADE"}}'
   ```
3. **Closure signal** (MUST): List all artifacts created/modified.
4. **Cleanup** (SHOULD): Remove any temporary files.

---

## Key Scripts

| Script                                    | Purpose                          |
| ----------------------------------------- | -------------------------------- |
| `scripts/generate-lifecycle-scores-md.js` | Generate dashboard from JSONL    |
| `scripts/route-lifecycle-gaps.js`         | Route Action<2 gaps              |
| `scripts/route-enforcement-gaps.js`       | Route CLAUDE.md enforcement gaps |
| `scripts/lib/learning-router.js`          | Core routing library             |
| `scripts/verify-enforcement.js`           | Verify enforcement effectiveness |
| `scripts/ratchet-baselines.js`            | Tighten violation baselines      |
| `scripts/rotate-jsonl.js`                 | Apply rotation policies          |

## Output Artifacts

| Artifact                                                      | Purpose             |
| ------------------------------------------------------------- | ------------------- |
| `.claude/state/lifecycle-scores.jsonl`                        | Updated scores      |
| `.planning/system-wide-standardization/learnings-effectiveness-audit/LIFECYCLE_SCORES.md` | Generated dashboard |
| `.claude/state/learning-routes.jsonl`                         | Routing decisions   |
| `.claude/tmp/data-effectiveness-audit-report-{date}.md`       | Session report      |

## Integration

- **Health Check:** `scripts/health/checkers/data-effectiveness.js` (15% weight)
- **Alerts:** `/alerts` checks velocity-regression, stale-planning,
  deferred-items
- **Session:** session-end includes planning data + commit analytics

## Guard Rails

- **Zero findings below threshold:** Skip walkthrough, go to Summary.
- **Scope explosion:** >15 systems below threshold -> offer filtered review.
- **Script failure:** Report error, suggest manual scoring.
- **Disengagement:** Save progress, show resume instructions.

---

## Version History

| Version | Date       | Description                                         |
| ------- | ---------- | --------------------------------------------------- |
| 1.0     | 2026-03-13 | Initial creation from Data Effectiveness Audit plan |
