# User Checkpoint: Tab Grouping Decisions

**Date:** 2026-03-29 (Session #245) **Decision:** 6 tabs + 1 header widget,
process domain model with full coverage

## Final Tab Structure

### Tab 1: Health & Alerts

- Ecosystem health grade + trend (ecosystem-health-log.jsonl)
- Per-category scorecards (health-score-log.jsonl)
- Active warnings unified from both systems (warnings.jsonl +
  hook-warnings-log.jsonl)
- Lifecycle score matrix (lifecycle-scores.jsonl)
- **Pattern gate coverage widget** (enforcement-manifest.jsonl — 360 records)
- CLI: `/alerts`, `/ecosystem-health`, `/comprehensive-ecosystem-audit`

### Tab 2: Debt Pipeline

- Severity/status breakdown from metrics.json (dashboard-ready)
- Debt trend line from metrics-log.jsonl (114 snapshots)
- MASTER_DEBT.jsonl field-stripped (~300KB)
- Intake activity (intake-log.jsonl)
- Resolution activity (resolution-log.jsonl — 14 records)
- Verification queue (review-needed.jsonl — 27 items)
- CLI: `/debt-runner`, `/sonarcloud --sync`

### Tab 3: Code Review Quality

- Active PR state (pr-review-state.json)
- Fix rate trend (review-metrics.jsonl — 52 records)
- Recurring patterns (retros.jsonl — 57 records)
- PR history (reviews.jsonl + archive — 501 records)
- **Unrouted learning items** (pending-refinements.jsonl)
- **Learning routing disposition** (learning-routes.jsonl)
- CLI: `/pr-review`, `/pr-retro`

### Tab 4: Build Pipeline & Process Compliance

- Hook compliance heatmap (hook-runs.jsonl — 114 records)
- Commit activity timeline (commit-log.jsonl — 634 records)
- Agent invocations by session (agent-invocations.jsonl — 92 records)
- **Override/bypass rate trends** (override-log.jsonl)
- **Process Compliance section (T7 Hygiene):**
  - Bypass rate by check type (override-log)
  - Auto-fix rate / silent remediations (hook-runs auto-fix status)
  - Chronic skip detection (hook-runs skip patterns, e.g., cognitive-cc)
  - Agent compliance rate (required agents invoked before commit?)
  - Retro action item follow-through rate (retros.jsonl cross-ref)
- **Velocity widget** (velocity-log.jsonl — "data unavailable" until fixed)
- CLI: `/session-begin`, `/session-end`, `/pre-commit-fixer`

### Tab 5: Governance & Audits

- Ecosystem audit recency (7 ecosystem-audit-history files)
- Agent quality trend (audit-agent-quality-history.jsonl)
- Sub-audit comparison (all 8 scores side-by-side)
- Stale audit warnings
- Deferred findings promoted to TDMS
- CLI: `/comprehensive-ecosystem-audit`, individual audit skills

### Tab 6: Planning & Research

- Active research topics (research-index.jsonl — 4 entries)
- Active plans with phase/status (deep-plan state files — 12 files)
- Sprint board from ROADMAP.md tasks (needs `--json` flag on
  resolve-dependencies.js)
- Lifecycle score drill-down (lifecycle-scores.jsonl — shared with Health)
- CLI: `/deep-research`, `/deep-plan`, `/task-next`

### Dashboard Header Widget

- **Watch Items** (forward-findings.jsonl — pinned cross-PR issues feed)

## Coverage

- 36/36 HIGH-relevance files covered
- T7 Hygiene incorporated into Tab 4 as Process Compliance section
- All uncovered items distributed to natural homes
- Only deliberate overlap: hook-warnings-log (Health + Pipeline),
  lifecycle-scores (Health + Planning)

## Data Gaps Requiring Pre-Work

- velocity-log.jsonl broken (show "unavailable" state)
- Two warning systems need aggregation logic
- ROADMAP.md needs `--json` flag on resolve-dependencies.js
- comprehensive-ecosystem-audit deletes JSON at run end
- Dual health-log files — use ecosystem-health-log.jsonl as primary
