<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-10
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Health Ecosystem Audit — Reference

Reference material for the health ecosystem audit skill. Contains templates,
schemas, category definitions, benchmarks, and development guides.

---

## Progress State Schema

Path: `.claude/tmp/health-audit-progress.json`

```json
{
  "auditTimestamp": "ISO timestamp of audit run",
  "score": 82,
  "grade": "B",
  "totalFindings": 18,
  "currentFindingIndex": 5,
  "decisions": [
    {
      "findingIndex": 1,
      "category": "file_io_safety",
      "message": "description",
      "decision": "fix|defer|skip|acknowledge|delegated-accept",
      "note": "optional context"
    }
  ],
  "fixesApplied": ["description of fix"],
  "findingsData": []
}
```

---

## Session Decision Log Schema

Path: `.claude/tmp/health-audit-session-{YYYY-MM-DD-HHMM}.jsonl`

Each line:

```json
{
  "findingIndex": 1,
  "category": "file_io_safety",
  "severity": "warning",
  "message": "description",
  "decision": "fix|defer|skip|acknowledge",
  "note": "optional context",
  "timestamp": "ISO timestamp"
}
```

---

## Trend History Schema

Path: `.claude/state/health-ecosystem-audit-history.jsonl`

Each line (one per audit run):

```json
{
  "timestamp": "ISO timestamp",
  "healthScore": { "score": 82, "grade": "B" },
  "categories": { "file_io_safety": { "score": 85, "rating": "good" } },
  "summary": { "errors": 2, "warnings": 5, "info": 8 }
}
```

---

## Dashboard Template

```
Health Ecosystem Health: {grade} ({score}/100)  |  Trend: {sparkline} ({delta})
{errors} errors . {warnings} warnings . {info} info  |  {patches} patch suggestions

Domain                                   Score  Rating  Trend
D1: Checker Infrastructure & Reliability
  Command Execution Robustness            {s}   {rtg}   {trend}
  File I/O Safety                         {s}   {rtg}   {trend}
  Benchmark Configuration                 {s}   {rtg}   {trend}
  Edge Case Handling                      {s}   {rtg}   {trend}
  Error Propagation                       {s}   {rtg}   {trend}
D2: Scoring Pipeline Integrity
  Composite Weight Validation             {s}   {rtg}   {trend}
  Missing Data Handling                   {s}   {rtg}   {trend}
  Metric Direction Consistency            {s}   {rtg}   {trend}
  Category-to-Dimension Mapping           {s}   {rtg}   {trend}
D3: Data Persistence & Concurrency
  JSONL Append Atomicity                  {s}   {rtg}   {trend}
  File Rotation & Cleanup                 {s}   {rtg}   {trend}
  Schema Validation                       {s}   {rtg}   {trend}
  Timestamp Consistency                   {s}   {rtg}   {trend}
  Corrupt Entry Detection                 {s}   {rtg}   {trend}
D4: Consumer Integration & Versioning
  Output Schema Versioning                {s}   {rtg}   {trend}
  Health Check Timeout Consistency        {s}   {rtg}   {trend}
  Duplicate Logic Detection               {s}   {rtg}   {trend}
  Downstream Error Handling               {s}   {rtg}   {trend}
D5: Coverage & Completeness
  Checker Success Aggregation             {s}   {rtg}   {trend}
  External Tool Availability              {s}   {rtg}   {trend}
  Test Coverage Verification              {s}   {rtg}   {trend}
  Test Registry Completeness              {s}   {rtg}   {trend}
D6: Mid-Session Alert System
  Cooldown State Management               {s}   {rtg}   {trend}
  Warning Lifecycle Consistency           {s}   {rtg}   {trend}
  Score Degradation Detection             {s}   {rtg}   {trend}
```

Rating badges: good = "Good", average = "Avg", poor = "Poor" Trend indicators:
improving = ascending, declining = descending, stable = flat

---

## Summary Template

```
--- Audit Summary -----------------------------------------

Composite: {grade} ({score}/100)  |  {trend}

Decisions:
  Fixed:      {count} findings
  Deferred:   {count} findings -> {count} DEBT entries created
  Skipped:    {count} findings

Patches Applied: {count}/{total patchable}

TDMS Entries Created:
  {list each DEBT entry with severity and source_id}

Top 3 Impact Areas:
  1. {category} -- {brief description}
  2. {category} -- {brief description}
  3. {category} -- {brief description}

Next Steps:
  - {actionable recommendation}
  - {actionable recommendation}
-----------------------------------------------------------
```

---

## Verification Template

```
--- Verification Re-run -----------------------------------

Before: {previous_grade} ({previous_score}/100)
After:  {new_grade} ({new_score}/100)
Delta:  {+/-delta} points

Improved Categories:
  {category}: {before} -> {after} (+{delta})

Remaining Issues:
  {count} findings still open (deferred/skipped)
-----------------------------------------------------------
```

---

## Trend Report Template

```
--- Trend Report ------------------------------------------

Composite Trend: {sparkline}  {direction} ({delta})

Improving:
  {category}: {before} -> {after} (+{delta})

Declining:
  {category}: {before} -> {after} ({delta})

Stable:
  {category}: {score} (no change)
-----------------------------------------------------------
```

---

## Category Reference

### Domain 1: Checker Infrastructure & Reliability (22% weight)

| Category                     | What It Checks                                             |
| ---------------------------- | ---------------------------------------------------------- |
| Command Execution Robustness | Timeouts, fallbacks, tool detection (npm, gh, tsc)         |
| File I/O Safety              | Race conditions, missing files, encoding, max size guards  |
| Benchmark Configuration      | Hardcoded thresholds, validation, versioning, drift        |
| Edge Case Handling           | Empty output, malformed JSON, NaN propagation, bounds      |
| Error Propagation            | Silent failures vs explicit errors, no_data vs zero vs NaN |

### Domain 2: Scoring Pipeline Integrity (18% weight)

| Category                      | What It Checks                                          |
| ----------------------------- | ------------------------------------------------------- |
| Composite Weight Validation   | 8 category weights sum to 1.0, correct per-category     |
| Missing Data Handling         | no_data vs zero vs NaN -- broken checker shouldn't tank |
| Metric Direction Consistency  | higher/lower-is-better interpolation correctness        |
| Category-to-Dimension Mapping | 13 dimensions map to correct checker fields             |

### Domain 3: Data Persistence & Concurrency (20% weight)

| Category                | What It Checks                                                |
| ----------------------- | ------------------------------------------------------------- |
| JSONL Append Atomicity  | Concurrent write safety (session hook + manual run)           |
| File Rotation & Cleanup | Unbounded growth (ecosystem-health-log.jsonl, warnings.jsonl) |
| Schema Validation       | Required fields present in all JSONL records                  |
| Timestamp Consistency   | ISO format validation, timezone handling, NaN date            |
| Corrupt Entry Detection | Silent filter vs explicit error, recovery                     |

### Domain 4: Consumer Integration & Versioning (18% weight)

| Category                         | What It Checks                                           |
| -------------------------------- | -------------------------------------------------------- |
| Output Schema Versioning         | Breaking changes between health output and consumers     |
| Health Check Timeout Consistency | Quick (10s) vs full modes, per-checker timeout alignment |
| Duplicate Logic Detection        | Drift risk from scoring copies across audits             |
| Downstream Error Handling        | /ecosystem-health and /alerts handle all output formats  |

### Domain 5: Coverage & Completeness (12% weight)

| Category                    | What It Checks                                          |
| --------------------------- | ------------------------------------------------------- |
| Checker Success Aggregation | How many of 10 checkers actually completed?             |
| External Tool Availability  | npm, gh, tsc declarations -- what happens when missing? |
| Test Coverage Verification  | Live test execution, pass rate, coverage data (D#15)    |
| Test Registry Completeness  | All test sources registered (8 source_types)            |

### Domain 6: Mid-Session Alert System (10% weight)

| Category                      | What It Checks                                       |
| ----------------------------- | ---------------------------------------------------- |
| Cooldown State Management     | Write failures, loss of state, alert fatigue risk    |
| Warning Lifecycle Consistency | Resolved warnings archival, stale detection          |
| Score Degradation Detection   | Threshold calibration, accuracy of trend computation |

---

## Benchmarks

| Category                      | Metric                | Good  | Avg  | Poor | Direction        |
| ----------------------------- | --------------------- | ----- | ---- | ---- | ---------------- |
| Command Execution Robustness  | timeout_coverage_pct  | 90%   | 70%  | 40%  | higher-is-better |
| Command Execution Robustness  | fallback_coverage_pct | 80%   | 60%  | 30%  | higher-is-better |
| File I/O Safety               | guarded_pct           | 95%   | 80%  | 60%  | higher-is-better |
| Benchmark Configuration       | drift_count           | 0     | 2    | 5    | lower-is-better  |
| Edge Case Handling            | handled_pct           | 90%   | 70%  | 50%  | higher-is-better |
| Error Propagation             | explicit_pct          | 90%   | 70%  | 45%  | higher-is-better |
| Composite Weight Validation   | weight_sum_deviation  | 0.001 | 0.01 | 0.05 | lower-is-better  |
| Missing Data Handling         | graceful_pct          | 100%  | 80%  | 50%  | higher-is-better |
| Metric Direction Consistency  | consistent_pct        | 100%  | 90%  | 70%  | higher-is-better |
| Category-to-Dimension Mapping | valid_pct             | 100%  | 90%  | 70%  | higher-is-better |
| JSONL Append Atomicity        | safe_write_pct        | 100%  | 80%  | 50%  | higher-is-better |
| File Rotation & Cleanup       | unbounded_count       | 0     | 1    | 3    | lower-is-better  |
| Schema Validation             | valid_pct             | 100%  | 90%  | 70%  | higher-is-better |
| Timestamp Consistency         | valid_pct             | 100%  | 90%  | 70%  | higher-is-better |
| Corrupt Entry Detection       | handled_pct           | 100%  | 80%  | 50%  | higher-is-better |
| Output Schema Versioning      | breaking_changes      | 0     | 1    | 3    | lower-is-better  |
| Health Check Timeout          | consistent_pct        | 100%  | 80%  | 60%  | higher-is-better |
| Duplicate Logic Detection     | drift_count           | 0     | 1    | 3    | lower-is-better  |
| Downstream Error Handling     | handled_pct           | 90%   | 70%  | 45%  | higher-is-better |
| Checker Success Aggregation   | success_pct           | 100%  | 80%  | 60%  | higher-is-better |
| External Tool Availability    | declared_pct          | 90%   | 70%  | 40%  | higher-is-better |
| Test Coverage Verification    | pass_rate_pct         | 100%  | 90%  | 70%  | higher-is-better |
| Test Coverage Verification    | coverage_pct          | 65%   | 50%  | 30%  | higher-is-better |
| Test Registry Completeness    | registered_pct        | 100%  | 90%  | 70%  | higher-is-better |
| Cooldown State Management     | healthy_pct           | 100%  | 80%  | 50%  | higher-is-better |
| Warning Lifecycle Consistency | consistent_pct        | 100%  | 85%  | 60%  | higher-is-better |
| Score Degradation Detection   | accurate_pct          | 100%  | 80%  | 50%  | higher-is-better |

Staleness guard: benchmarks.js uses `HMS_STALENESS_HOURS` env var (default: 24h)
for CI result freshness (D#52).

---

## Data Sources

| Source             | Path                                           | Content                        |
| ------------------ | ---------------------------------------------- | ------------------------------ |
| Health checkers    | `scripts/health/checkers/*.js`                 | 10 health checker impls        |
| Health lib         | `scripts/health/lib/*.js`                      | Scoring, composite, dimensions |
| Health runner      | `scripts/health/run-health-check.js`           | Orchestrator                   |
| Health log         | `data/ecosystem-v2/ecosystem-health-log.jsonl` | Score history                  |
| Warnings log       | `data/ecosystem-v2/warnings.jsonl`             | Warning lifecycle              |
| Deferred items     | `data/ecosystem-v2/deferred-items.jsonl`       | Deferred decision tracking     |
| Alert cooldown     | `.claude/hooks/.alerts-cooldown.json`          | Mid-session alert cooldown     |
| Test registry      | `data/ecosystem-v2/test-registry.jsonl`        | All registered test sources    |
| Mid-session alerts | `scripts/health/lib/mid-session-alerts.js`     | Alert detection system         |
| Warning lifecycle  | `scripts/health/lib/warning-lifecycle.js`      | Warning state machine          |

---

## Checker Development Guide

### Adding a New Category

1. Choose the appropriate domain checker in `scripts/checkers/`
2. Add check function following existing category patterns
3. Add benchmarks to `scripts/lib/benchmarks.js`
4. Add weight to `CATEGORY_WEIGHTS` in benchmarks.js
5. Add labels to orchestrator's `CATEGORY_LABELS` and `CATEGORY_DOMAIN_MAP`
6. Test: `node scripts/run-health-ecosystem-audit.js --summary`
