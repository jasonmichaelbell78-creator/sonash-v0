<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-12
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Plan: Wire Dead Data Producers Into Alerts Skill

## Context

Multiple scripts generate structured data (metrics, logs, suggestions) that
nothing consumes. The alerts skill already aggregates system health data and
presents it at session start. Rather than building a separate dashboard, we
extend the alerts skill to consume all dead data sources — splitting output into
**Actionable** (do something) and **Informational** (be aware) sections.

User requirement: "the important part would be offering actionable suggestions
for each bit of data, if possible."

## Approach: Hybrid (Option C)

Extend `run-alerts.js` to read each data source, extract key data points, and
output structured JSON. The SKILL.md tells Claude how to present results with
actionable framing. This is consistent with how alerts already works.

## Changes

### Change 1: Extend `run-alerts.js` with new reader functions

**File:** `.claude/skills/alerts/scripts/run-alerts.js`

Add 7 new reader functions after the existing category checks. Each reads a data
file and pushes alerts into the existing `results.categories` structure.

#### New categories to add:

| Category           | Source File(s)                                                                | Mode    | Type          |
| ------------------ | ----------------------------------------------------------------------------- | ------- | ------------- |
| `debt-metrics`     | `docs/technical-debt/metrics.json`                                            | Limited | Actionable    |
| `learning`         | `docs/LEARNING_METRICS.md`                                                    | Limited | Actionable    |
| `agent-compliance` | `.claude/hooks/.session-agents.json`                                          | Limited | Actionable    |
| `review-quality`   | `.claude/state/review-metrics.jsonl`                                          | Full    | Actionable    |
| `consolidation`    | `consolidation-output/suggested-rules.md` + `docs/AI_REVIEW_LEARNINGS_LOG.md` | Full    | Actionable    |
| `velocity`         | `.claude/state/velocity-log.jsonl`                                            | Full    | Informational |
| `session-activity` | `.claude/session-activity.jsonl`                                              | Full    | Informational |

#### Reader function details:

**1. `checkDebtMetrics()` — Limited mode, Actionable**

- Read `docs/technical-debt/metrics.json`
- If `alerts.s0_count > 0`: error — "N S0 critical debt items need attention" +
  list item IDs → action: "Run /task-next or fix DEBT-XXXX directly"
- If `alerts.s1_count > threshold(10)`: warning — "N S1 high-priority items" →
  action: "Review MASTER_DEBT.jsonl for S1 items"
- Trend: read last 2 entries from `docs/technical-debt/logs/metrics-log.jsonl`,
  compare `open` count. If increasing: warning — "Debt growing: N→M open items"
  → action: "Resolve more items than you create"
- Always: info — "Debt summary: N total, N open, N% resolved"

**2. `checkLearningEffectiveness()` — Limited mode, Actionable**

- Read `docs/LEARNING_METRICS.md` (parse the metrics table)
- If `patternsFailing > 0`: warning — "N patterns failing to be learned (3+
  recurrences)" → action: "Automate top 3: [names]. Est. effort: 30-60 min each.
  Add to check-pattern-compliance.js"
- If `learningEffectiveness < 70%`: warning — "Learning effectiveness at N% —
  below 70% threshold" → action: "Review documentation clarity in
  CODE_PATTERNS.md"
- If `automationCoverage < 20%`: info — "Only N% of patterns automated" →
  action: "Run consolidation to generate automation suggestions"

**3. `checkAgentCompliance()` — Limited mode, Actionable**

- Read `.claude/hooks/.session-agents.json`
- Cross-reference with current git staged files (or last commit)
- If code files changed without `code-reviewer`: warning → action: "Run
  /code-reviewer before merging"
- If security files changed without `security-auditor`: warning → action: "Run
  /security-auditor"
- Note: file may not exist if no agents invoked yet — handle gracefully as info

**4. `checkReviewQuality()` — Full mode, Actionable**

- Read `.claude/state/review-metrics.jsonl`
- Last 5 entries: calculate avg `fix_ratio` and avg `review_rounds`
- If any PR has `review_rounds >= 5`: warning — "PR #N took N rounds" → action:
  "Run /pr-retro N to analyze churn"
- If avg `fix_ratio > 0.3`: warning — "Average fix ratio N% (target: <25%)" →
  action: "Check if review scope is consistent between rounds"
- File may not exist — handle gracefully (info: "No review metrics yet")

**5. `checkConsolidation()` — Full mode, Actionable**

- Read `docs/AI_REVIEW_LEARNINGS_LOG.md`, parse the consolidation trigger
  counter
- If counter >= 10: warning — "N reviews since last consolidation" → action:
  "Consolidation will auto-run at next session-start"
- Read `consolidation-output/suggested-rules.md`
- Count `## ` headers (each is a suggested rule)
- If count > 0: info — "N suggested automation rules pending review" → action:
  "Review suggested-rules.md and add to check-pattern-compliance.js"

**6. `checkVelocity()` — Full mode, Informational**

- Read `.claude/state/velocity-log.jsonl`
- Last 5 entries: items completed per session
- Info — "Velocity: avg N items/session over last 5 sessions"
- If 0 items completed in last 3 sessions: info — "No debt items resolved in 3
  sessions"
- File may not exist — skip silently

**7. `checkSessionActivity()` — Full mode, Informational**

- Read `.claude/session-activity.jsonl`
- Count events since last `session_start`
- Info — "Last session: N files modified, N commits, N skills invoked"
- If no `session_end` event for previous session: info — "Previous session did
  not run /session-end"
- File may not exist — skip silently

### Change 2: Update SKILL.md with new categories and output format

**File:** `.claude/skills/alerts/SKILL.md`

#### Add to Limited Mode:

- **Debt Health** (from `checkDebtMetrics`)
- **Learning Health** (from `checkLearningEffectiveness`)
- **Agent Compliance** (from `checkAgentCompliance`)

#### Add to Full Mode:

- **Review Quality** (from `checkReviewQuality`)
- **Consolidation Status** (from `checkConsolidation`)
- **Velocity** (from `checkVelocity`)
- **Session Activity** (from `checkSessionActivity`)

#### Update presentation format:

Add instructions for Claude to split output into two sections:

```
## Actionable Items
[Items with specific "do X" actions — errors first, then warnings]

## Informational
[Items for awareness — no immediate action required]
```

Each actionable item must include:

- What the problem is
- What command or action to take
- Estimated effort (if applicable)

### Change 3: Handle redundant files

**Files that become redundant (no changes needed to them, just documenting):**

- `docs/technical-debt/METRICS.md` — redundant with `metrics.json` (alerts reads
  JSON)
- `docs/technical-debt/logs/metrics-log.jsonl` — consumed for trend detection (2
  most recent entries)
- `consolidation-output/suggested-rules.md` — consumed for rule count + names

No files are deleted. All data sources get consumed. Nothing is left out.

## Files to Modify

| File                                          | Change                                                                                    |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `.claude/skills/alerts/scripts/run-alerts.js` | Add 7 new reader functions + wire into category flow                                      |
| `.claude/skills/alerts/SKILL.md`              | Add new categories to Limited/Full mode sections + Actionable/Informational output format |

## Verification

1. Run `node .claude/skills/alerts/scripts/run-alerts.js` — confirm JSON output
   includes new categories
2. Run `node .claude/skills/alerts/scripts/run-alerts.js --full` — confirm all 7
   new categories appear
3. Verify graceful handling: rename `metrics.json` temporarily — confirm no
   crash, just skip
4. Run `/alerts` and `/alerts --full` — confirm Claude presents Actionable vs
   Informational split
5. Confirm each actionable item has a concrete "do X" recommendation
