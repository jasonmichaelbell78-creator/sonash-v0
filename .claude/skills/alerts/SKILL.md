---
name: alerts
description: |
  Lightweight health signal with scoring, benchmarks, trends, and interactive
  alert-by-alert workflow. Default mode (--limited) checks 18 categories. Use
  --full for comprehensive reporting with all 42 categories.
---

# Alerts -- Lightweight Health Signal

**Ecosystem role:** Consumer of `health-ecosystem-audit` ecosystem (D#17).
`/health-ecosystem-audit` OWNS the ecosystem. `/ecosystem-health` and `/alerts`
CONSUME it. `/audit-health` audits the audit system, not health.

## Critical Rules

1. **MUST** run the checker script before presenting any data
2. **MUST** present every alert to the user (no silent filtering)
3. **MUST** recommend an action per alert based on severity + trend
4. **MUST** log every decision to session JSONL immediately (per-alert, not
   batched)
5. **MUST NOT** present a health score without running checkers first
6. **MUST** surface previous learnings from alerts-history.jsonl at warm-up

## When to Use

- User explicitly invokes `/alerts`
- User asks "check alerts", "what needs attention", "system health", "show
  warnings", "pending issues"
- Called from `session-begin` with `--limited` mode

## When NOT to Use

| Need                    | Use Instead         | Why                                |
| ----------------------- | ------------------- | ---------------------------------- |
| Domain-specific audit   | `/audit-code`, etc. | Deeper analysis per domain         |
| Audit system meta-check | `/audit-health`     | Checks audit infra, not health     |
| Full health dashboard   | `/ecosystem-health` | 8 weighted categories, deep triage |
| Skill validation        | `/skill-audit`      | Quality audit for individual skill |

## Routing Decision Tree

- "Just show me warnings" (30s) -> `/alerts --limited`
- "Full health picture" (15min) -> `/ecosystem-health`
- "Health system seems broken" (30min) -> `/health-ecosystem-audit`
- "Is my audit system healthy?" (5min) -> `/audit-health`

## What This Skill Does NOT Do

- Infrastructure monitoring, uptime checks, or server health
- CI/CD status monitoring (use `/gh-fix-ci` for that)
- Live application metrics or APM

## Overview

Intelligence = trend detection, cross-category grouping, suppression management,
and self-audit of checker coverage. This skill measures **project/codebase
health**, not infrastructure or server health.

**Note:** The checker script handles Phase 1 (data collection). Phases 2-7 are
orchestrated by the skill caller (Claude). Session JSONL is created and
populated by the caller.

## Alert Object Schema

```json
{
  "severity": "error | warning | info",
  "message": "string",
  "details": "string | array of strings | null",
  "action": "string | null"
}
```

Note: `category` is the key in `results.categories{}`, not a field in the alert
object. `trend` is in `category.context`, not per-alert. Context objects vary
per category (benchmarks, ratings, totals, sparklines, groups).

## Usage

```
/alerts           # Limited mode (default) - 18 categories
/alerts --full    # Full mode - 42 categories
/alerts --limited # Explicit limited (used by session-begin)
```

**Context-aware mode:** When called from `session-begin`, MUST use `--limited`.
When standalone, ask user which mode if not specified.

---

## Workflow

> Detailed phase workflows, schemas, benchmarks, and weights are in
> [REFERENCE.md](./REFERENCE.md).

### Warm-Up (MUST)

- **Mode:** limited (18 categories, ~15-30s) or full (42 categories, ~30-60s)
- **What to expect:** Dashboard overview, then interactive alert-by-alert
  walkthrough
- **Starting signal:** "Starting health checks... (this may take 15-30s)"
- **Previous learnings (MUST):** Read last 3 entries from alerts-history.jsonl.
  Surface insights if they exist.
- **Resume check (SHOULD):** If progress file exists and is <2h old, offer
  resume.

### Phase 1: Run & Parse (MUST)

Run: `node .claude/skills/alerts/scripts/run-alerts.js --limited` (or `--full`).
Parse v2 JSON. Create session log. Load suppressions. Check for duplicate run
(<30min). See REFERENCE.md for error handling details.

### Phase 2: Dashboard Overview (MUST)

Scoring: 100 - (30/error + 10/warning). Grades: A=90+, B=80+, C=70+, D=60+,
F=<60. Dashboard table sorted worst-first. Cross-session trends from
alerts-history.jsonl. If 3+ categories declining simultaneously, flag as
"ecosystem stress" and recommend `/ecosystem-health`. If trend=null, treat as
stable. Zero alerts: skip Phases 3-5, go to Phase 6. Benchmark mapping: Poor ->
error, Average -> warning, Good -> no alert.

### Phase 3: Alert-by-Alert Loop (MUST)

Sort errors first. Group 3+ same category+severity. Progress: "Alert N of M".
See REFERENCE.md for context card format, decision semantics, example dialogue.
Escape hatch every 10 alerts (10, 20, 30...). Remaining auto-defer with
confirmation. Scope guard: >5min or >3 files -> pause. 2-5min -> defer to
appropriate skill. <2min -> inline (follow CLAUDE.md Section 6). Decisions
logged per-alert immediately.

### Phase 4: Decision Review (MUST, skip if zero alerts)

Review all decisions. Contradiction check: same alert with conflicting
decisions. Revision: show numbered list, user selects alerts to change.
DONE-WHEN: User confirms "Proceed" or completes revisions.

### Phase 5: Batch Execution + Fix Verification (MUST)

Execute fix_now items inline or via skills. Defer items: log and suggest
`/add-debt`. On failure: report error, offer retry or skip. Update session JSONL
with results. **Convergence loop (SHOULD):** Re-run affected checkers after
fixes to verify resolution. If alert persists, flag as "fix failed" and present
to user. DONE-WHEN: All selected fixes attempted and verified.

### Phase 6: Self-Audit + Feedback (MUST)

Checker coverage, suppression health (>50% -> WARNING), score integrity,
decision balance, trend health, process gaps, baseline staleness (>7d). Checker
escalation: no_data for 3+ consecutive runs -> WARNING. **User feedback
(SHOULD):** "Any observations about checker quality?" Save to
alerts-history.jsonl. DONE-WHEN: All findings presented and decided.

### Phase 7: Cleanup & Verification (MUST)

Write artifacts, save suppressions (reason MUST be present), clear resolved
warnings, append to alerts-history.jsonl with learnings. Offer re-run (loops to
Phase 1, same mode, delta display). Closure: "Alert review complete. Health:
{before} -> {after}. Session log: [path]." DONE-WHEN: Files written and closure
summary presented.

---

**Phase separators:** Use `---` between all phases in output.

## Dependencies

**Hard:** `run-alerts.js`, `.claude/state/alert-suppressions.json` **Soft:**
`alerts-baseline.json` (computed first run), `alerts-history.jsonl` (no trends
if missing), `health-ecosystem-audit-history.jsonl` (omit Test Health if
missing/stale >1 day)

## Compaction Resilience

State: `.claude/tmp/alerts-progress-{YYYY-MM-DD}.json`. On start: check if <2h
old, offer resume. After every 5 decisions: update currentAlertIndex. On
compaction: re-read state, skip completed alerts.

## Delegation Protocol

Triggers: "you decide", "all", "auto", "apply all", "go ahead", "yes" at
delegation prompt. For scoped requests ("fix errors only", "except item 3"),
fall back to per-alert loop. If >15 alerts: "Apply to all N? [Apply All / Next
15 / Revise]". Show preview before execution: "Will apply: X Fix Now, Y Defer.
Confirm? [Y/n]"

## Suppression Reason Validation

Reason minimum: 15 characters. Must reference alert category or ticket/decision.
Reject vague reasons ("skip", "not needed") — ask user to retry.

## Integration

See [REFERENCE.md](./REFERENCE.md) for file schemas, benchmarks, weights, hook
drill-down, scripts, learning loop details, and example walkthrough.

**Neighbors:** `/audit-health`, `/ecosystem-health`, `/health-ecosystem-audit`,
`session-begin`

**Skill routing:** Code -> `/audit-code`, Security -> `/audit-security`, Reviews
-> `/pr-retro`, Debt -> `/add-debt`, Hooks -> `/hook-ecosystem-audit`

**Convergence loops:** Phase 5 fix verification only. Not used for initial
checker execution (deterministic, single-pass).

---

## Version History

| Version | Date       | Description                                                     |
| ------- | ---------- | --------------------------------------------------------------- |
| 3.0     | 2026-03-19 | Skill audit v2: 56 decisions, REFERENCE.md extraction, CL fixes |
| 2.0     | 2026-03-07 | Full rewrite: 18 limited + 24 full checkers, 7-phase workflow   |
| 1.1     | 2026-02-25 | Trim to <500 lines: condense benchmark tables and weights       |
| 1.0     | 2026-02-25 | Initial implementation                                          |
