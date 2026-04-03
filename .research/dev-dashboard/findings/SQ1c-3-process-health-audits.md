# Findings: Health Monitoring, Ecosystem Audit, and Documentation Maintenance Processes

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ1c-3

---

## Key Findings

### 1. Health Monitoring: Three-Layer Architecture [CONFIDENCE: HIGH]

The health monitoring system has three distinct layers that feed each other:

**Layer A — Lightweight health check** (`scripts/health/run-health-check.js`):

- 11 checkers, 9 weighted categories, 14 drill-down dimensions
- Runs at session start (`session-start.js` line 1117) via `--quick` flag (4
  checkers only)
- Also called by `/ecosystem-health` skill on demand (full or quick mode)
- Output:
  `{ timestamp, mode, score, grade, categoryScores, dimensionScores, checkerResults }`
- Does NOT persist directly — writes to stdout, then the orchestrator persists

**Layer B — Ecosystem health dashboard orchestrator**
(`.claude/skills/ecosystem-health/scripts/run-ecosystem-health.js`):

- Wraps Layer A, captures JSON output, appends to
  `data/ecosystem-v2/ecosystem-health-log.jsonl`
- Computes trends from last 10 entries before writing
- Also updates `data/ecosystem-v2/warnings.jsonl` with new warnings via
  warning-lifecycle
- Produces full markdown dashboard with letter grades and severity badges

**Layer C — Mid-session alerts** (`scripts/health/lib/mid-session-alerts.js`):

- Triggered by `commit-tracker.js` hook after every successful commit (async, 5s
  timeout)
- Reads `data/ecosystem-v2/deferred-items.jsonl` and
  `data/ecosystem-v2/ecosystem-health-log.jsonl`
- Detects: aged deferred items, duplicate deferrals, score degradation
- Writes to both `data/ecosystem-v2/warnings.jsonl` (persistent) and hook
  warnings (immediate)
- Uses `.claude/hooks/.alerts-cooldown.json` to prevent alert storms (1h
  cooldown)

**Data flow summary (text-based):**

```
[session-start hook]
  → run-health-check.js --quick (4 checkers)
  → stdout: composite score + category scores
  → .claude/state/health-score-log.jsonl (appended, rotated to 20 entries at session start)
  → If grade drop >= 2 letters → warning surfaced to user

[/ecosystem-health invocation or session-start full run]
  → run-ecosystem-health.js
    → run-health-check.js --json (11 checkers)
    → appendHealthScore() → data/ecosystem-v2/ecosystem-health-log.jsonl
    → readAllEntries() for trend (last 10)
    → warning-lifecycle.js → data/ecosystem-v2/warnings.jsonl
  → markdown dashboard to stdout

[post-commit hook: commit-tracker.js]
  → mid-session-alerts.js (async subprocess)
    → reads deferred-items.jsonl + ecosystem-health-log.jsonl
    → new warnings → data/ecosystem-v2/warnings.jsonl
    → immediate hook warnings → .claude/state/hook-warnings-log.jsonl
```

### 2. Health Checker Data Sources [CONFIDENCE: HIGH]

Each checker reads specific state files:

| Checker                     | Primary Data Sources                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| `hook-pipeline.js`          | `.claude/state/hook-warnings-log.jsonl`, `.claude/override-log.jsonl`, `.claude/state/hook-runs.jsonl` |
| `ecosystem-integration.js`  | `.claude/state/review-metrics.jsonl`, GitHub CLI (`gh run list`), `npm run sonar:check`                |
| `data-effectiveness.js`     | `.claude/state/lifecycle-scores.jsonl`                                                                 |
| `documentation.js`          | `docs/SESSION_CONTEXT.md` mtime, `npm run validate:canon`, `scripts/check-cross-doc-deps.js`           |
| `debt-health.js`            | `docs/technical-debt/MASTER_DEBT.jsonl`                                                                |
| `learning-effectiveness.js` | `.claude/state/learning-routes.jsonl`                                                                  |
| `session-management.js`     | `.claude/state/handoff.json`, `.claude/state/commit-log.jsonl`                                         |
| `code-quality.js`           | TypeScript compiler, ESLint, `npm run patterns:check`                                                  |
| `security.js`               | `npm audit`, secret scanning                                                                           |
| `test-coverage.js`          | Test runner output                                                                                     |
| `pattern-enforcement.js`    | `.claude/state/hook-warnings-log.jsonl`, `docs/agent_docs/CODE_PATTERNS.md`                            |

### 3. Dual Health Log Problem [CONFIDENCE: HIGH]

There are **two separate health log files** tracking overlapping data:

- `.claude/state/health-score-log.jsonl` (24 entries): Old format with flat
  `categoryScores` map — many null values for categories not yet supported. Used
  by `session-start.js` for grade-drop detection. Rotated to 20 entries at
  session start.
- `data/ecosystem-v2/ecosystem-health-log.jsonl` (32 entries): Newer format
  appended by the orchestrator. Richer structure (trend data, warning
  integration).

The `lifecycle-scores.jsonl` system's entry for `ls-007` (Health Scores)
identifies both files and notes the gap: "No regression alerting — scores can
degrade indefinitely without triggering re-audit."

### 4. Comprehensive Ecosystem Audit: 8-Audit Staged Wave Architecture [CONFIDENCE: HIGH]

`/comprehensive-ecosystem-audit` orchestrates 8 sub-audits in 2 stages:

**Stage 1 (5 parallel):** Hook, Session, TDMS, PR, Health ecosystem audits
**Stage 2 (3 parallel):** Skill, Doc, Script ecosystem audits

Each sub-audit follows a standard pattern:

1. Runs its own script (e.g.,
   `node .claude/skills/hook-ecosystem-audit/scripts/run-hook-ecosystem-audit.js --batch --summary`)
2. Writes JSON result to `.claude/tmp/ecosystem-{name}-result.json`
3. Returns only:
   `COMPLETE: {name} grade {grade} score {score} errors {N} warnings {N} info {N}`
4. Orchestrator verifies via `wc -c` / file existence, never reads full result

**Output:** `COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md` in project root
(ephemeral, replaced each run)

**Weighted composite:** Hook 14%, Skill 18%, TDMS 14%, PR 14%, Script 12%,
Health 10%, Session 9%, Doc 9%

**No persistent history** for the comprehensive audit itself — only individual
sub-audits write to their own history files.

### 5. Ecosystem Audit History Files [CONFIDENCE: HIGH]

Seven `*-ecosystem-audit-history.jsonl` files in `.claude/state/`:

| File                                    | Line Count | Last Modified | Format                                                                           |
| --------------------------------------- | ---------- | ------------- | -------------------------------------------------------------------------------- |
| `hook-ecosystem-audit-history.jsonl`    | 25 entries | 2026-03-19    | `{timestamp, healthScore: {score, grade, breakdown}, categories, summary}`       |
| `skill-ecosystem-audit-history.jsonl`   | 15 entries | 2026-02-25    | Same structure                                                                   |
| `script-ecosystem-audit-history.jsonl`  | 9 entries  | 2026-03-19    | Same structure                                                                   |
| `doc-ecosystem-audit-history.jsonl`     | 1 entry    | 2026-02-25    | Same structure, 16 categories                                                    |
| `session-ecosystem-audit-history.jsonl` | 1 entry    | 2026-02-25    | Same structure                                                                   |
| `tdms-ecosystem-audit-history.jsonl`    | 1 entry    | 2026-02-25    | Same structure                                                                   |
| `alerts-history.jsonl`                  | 1 entry    | 2026-03-19    | `{timestamp, mode, grade, score, errors, warnings, infos, fixes[], learnings[]}` |
| `audit-agent-quality-history.jsonl`     | 1 entry    | 2026-03-17    | `{date, agents_total, agents_audited, ecosystem_grade, mean_score, ...}`         |

The `healthScore.breakdown` object contains per-category scores with weight and
contribution, enabling per-dimension trend charting.
`doc-ecosystem-audit-history.jsonl` has 16 categories covering index sync, link
health, content quality, generation pipelines, and coverage.

### 6. Documentation Maintenance: Two-Mode Unified Skill [CONFIDENCE: HIGH]

`/docs-maintain` (v1.0, 2026-02-14) combines two operations:

**Check mode** (`npm run docs:sync-check`):

- Validates template-instance synchronization
- Checks for placeholder content (`[e.g., ...]`, `[X]`, `[TODO]`)
- Verifies relative links point to existing files
- Flags sync dates older than 90 days
- Exit codes: 0 = clean, 1 = issues, 2 = error

**Update mode** (`npm run docs:index && git add DOCUMENTATION_INDEX.md`):

- Regenerates `DOCUMENTATION_INDEX.md` (726 active docs, 104 archived as of
  2026-03-29)
- Reviews `docs/DOCUMENT_DEPENDENCIES.md` for affected triggers
- Verifies archive folders have `README.md`
- Suggests updates for docs referencing moved/deleted files

**Pre-commit enforcement:** The `.husky/pre-commit` script auto-regenerates
`DOCUMENTATION_INDEX.md` on every commit (with atomic backup/restore pattern).
Cross-doc dependency check (`scripts/check-cross-doc-deps.js`) also runs in
pre-commit, skippable via `SKIP_CHECKS="cross-doc"`.

### 7. Doc Optimizer: Parallel Agent Repair Pipeline [CONFIDENCE: HIGH]

`/doc-optimizer` (v1.4) runs 13 agents across 5 waves:

- **Wave 0:** Discovery — builds inventory, link graph, metadata index →
  `.claude/state/doc-optimizer/shared-state.json`
- **Wave 1:** 3 parallel + 1 sequential — format/lint fix (AUTO-FIX),
  header/metadata fix (AUTO-FIX), external link validation (REPORT), content
  accuracy (MIXED)
- **Wave 2:** 4 parallel — internal link fix, orphan detection,
  freshness/lifecycle, cross-ref/deps
- **Wave 3:** 2 parallel — coherence/duplication, structure/classification
- **Wave 4:** 3 parallel — quality scoring, content gap, visual/navigation

**Key behavior:**

- AUTO-FIX agents write changes directly; REPORT agents write JSONL findings
- All output to `.claude/state/doc-optimizer/wave*.jsonl` (13 files)
- JSONL schema includes `auto_fixed: boolean`,
  `finding_type: "issue"|"enhancement"`, per-agent metadata
- Output cleaned up after run (temp files deleted)
- Unresolved issues fed to TDMS intake as debt items
- No persistent history of doc-optimizer runs (all ephemeral)

**Context overflow protection:** `doc-optimizer/` had a previous crash from
agents returning full results; now enforces single-line return protocol and
`wc -l` completion checking.

### 8. Documentation Index: Auto-Generated Central Artifact [CONFIDENCE: HIGH]

`DOCUMENTATION_INDEX.md` (3094 lines, generated 2026-03-29):

- 726 active documents, 104 archived
- Auto-generated by `npm run docs:index`
  (`scripts/generate-documentation-index.js`)
- Pre-commit hook regenerates it atomically on every commit
- Contains: summary statistics, documents by category, reference graph, orphaned
  docs list, full document list, archived docs
- Not stored in history — regenerated each time, not tracked by any history file

**Cross-doc dependency tracking:** `docs/DOCUMENT_DEPENDENCIES.md` (v2.0, 23KB)
tracks template→instance relationships and cross-document sync requirements.
Template instances were removed in Session #140 (412-artifact cleanup); now
handled directly via templates. Still used to define sync triggers for related
docs.

### 9. Data Effectiveness: Lifecycle Scoring System [CONFIDENCE: HIGH]

`.claude/state/lifecycle-scores.jsonl` (20 entries) is a meta-tracking system
that scores 20 data systems (pattern rules, review learnings, health scores,
etc.) across 4 dimensions:

- **Capture** (1-3): Does the data get collected?
- **Storage** (1-3): Is it stored properly?
- **Recall** (1-3): Is it surfaced when needed?
- **Action** (1-3): Does it drive corrective action?

Total score 1-12 per system. The `data-effectiveness.js` checker reads this to
compute `avg_lifecycle_score` and `action_coverage`. Systems with `action < 2`
are flagged as gaps.

Key health-monitoring gap from `ls-007`: "Scores can degrade indefinitely
without triggering re-audit. No regression alerting."

---

## Data Touchpoints

### Files Read During Health Monitoring

| File                                           | Purpose                         | Consumer                                       |
| ---------------------------------------------- | ------------------------------- | ---------------------------------------------- |
| `data/ecosystem-v2/ecosystem-health-log.jsonl` | Previous runs + trends          | run-ecosystem-health.js, mid-session-alerts.js |
| `.claude/state/health-score-log.jsonl`         | Grade-drop detection            | session-start.js                               |
| `.claude/state/hook-warnings-log.jsonl`        | Hook pipeline health            | hook-pipeline.js checker                       |
| `.claude/state/override-log.jsonl`             | Override patterns               | hook-pipeline.js checker                       |
| `.claude/state/lifecycle-scores.jsonl`         | Data effectiveness              | data-effectiveness.js checker                  |
| `.claude/state/review-metrics.jsonl`           | Ecosystem integration           | ecosystem-integration.js checker               |
| `.claude/state/hook-runs.jsonl`                | Hook pass/fail                  | hook-pipeline.js checker                       |
| `docs/technical-debt/MASTER_DEBT.jsonl`        | Debt health                     | debt-health.js checker                         |
| `.claude/state/learning-routes.jsonl`          | Learning effectiveness          | learning-effectiveness.js checker              |
| `.claude/state/commit-log.jsonl`               | Session/commit patterns         | session-management.js checker                  |
| `docs/SESSION_CONTEXT.md`                      | Documentation staleness (mtime) | documentation.js checker                       |
| `data/ecosystem-v2/deferred-items.jsonl`       | Alert: aged items               | mid-session-alerts.js                          |

### Files Written During Health Monitoring

| File                                           | Written By                               | When                                           |
| ---------------------------------------------- | ---------------------------------------- | ---------------------------------------------- |
| `data/ecosystem-v2/ecosystem-health-log.jsonl` | run-ecosystem-health.js                  | Each `/ecosystem-health` run                   |
| `.claude/state/health-score-log.jsonl`         | session-start.js                         | Each session start (quick health check result) |
| `data/ecosystem-v2/warnings.jsonl`             | warning-lifecycle.js                     | New degradation warnings detected              |
| `.claude/state/hook-warnings-log.jsonl`        | mid-session-alerts.js, commit-tracker.js | Post-commit                                    |
| `.claude/hooks/.alerts-cooldown.json`          | mid-session-alerts.js                    | After firing alerts                            |

### Files Read/Written During Ecosystem Audits

| File                                                      | Purpose                                                                   |
| --------------------------------------------------------- | ------------------------------------------------------------------------- |
| `.claude/tmp/ecosystem-{name}-result.json`                | Inter-stage communication (written by each sub-audit, read by aggregator) |
| `.claude/tmp/comprehensive-ecosystem-audit-progress.json` | Compaction guard / resume                                                 |
| `.claude/state/*-ecosystem-audit-history.jsonl`           | History persistence (written by each sub-audit script)                    |
| `COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md`                 | Final output (project root, overwritten each run)                         |

### Files Read/Written During Doc Maintenance

| File                                              | Purpose                                                |
| ------------------------------------------------- | ------------------------------------------------------ |
| `DOCUMENTATION_INDEX.md`                          | Written by `docs:index`, read by pre-commit, doc audit |
| `docs/DOCUMENT_DEPENDENCIES.md`                   | Cross-doc dependency map (read by `crossdoc:check`)    |
| `.claude/state/doc-ecosystem-audit-history.jsonl` | Doc audit history (1 entry so far)                     |
| `.claude/state/doc-optimizer/*.jsonl`             | Per-wave findings (ephemeral, cleaned after run)       |
| `.claude/state/doc-optimizer/shared-state.json`   | Wave 0 inventory (ephemeral)                           |
| `.claude/tmp/doc-audit-progress.json`             | Doc audit compaction guard                             |
| `.claude/tmp/doc-audit-session-{date}.jsonl`      | Doc audit decision log (session-scoped)                |

---

## Visibility Gaps

1. **No persistent comprehensive audit history.**
   `COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md` is overwritten each run. There is
   no `comprehensive-audit-history.jsonl`. Trend comparisons across quarterly
   audits are impossible unless the report was manually saved. [CONFIDENCE:
   HIGH]

2. **Doc optimizer runs leave no audit trail.** All
   `.claude/state/doc-optimizer/*.jsonl` files are deleted at the end of the
   run. There is no doc-optimizer-history file. [CONFIDENCE: HIGH]

3. **Doc audit barely used.** `doc-ecosystem-audit-history.jsonl` has only 1
   entry (2026-02-25). The doc ecosystem audit has run once. [CONFIDENCE: HIGH]

4. **TDMS, session, comprehensive audit histories sparse.**
   `tdms-ecosystem-audit-history.jsonl` (1 entry),
   `session-ecosystem-audit-history.jsonl` (1 entry). These audits appear to
   have been run once during initial build and rarely since. [CONFIDENCE: HIGH]

5. **Health check duplicate writes.** Both `health-score-log.jsonl`
   (.claude/state) and `ecosystem-health-log.jsonl` (data/ecosystem-v2) record
   health scores in different formats. The session-start hook reads the state
   one; the orchestrator appends to the data one. They are not synchronized.
   [CONFIDENCE: HIGH]

6. **Mid-session alerts are fire-and-forget.** After writing to warnings.jsonl
   and hook-warnings-log.jsonl, there is no acknowledgment trail in
   health-score-log.jsonl or ecosystem-health-log.jsonl indicating which alerts
   were surfaced, when, and what action was taken. [CONFIDENCE: HIGH]

7. **doc-optimizer auto-fixes have no before/after record.** Wave 1A and 1B
   auto-fix files in place. The JSONL schema has `auto_fixed: boolean` but since
   all files are deleted post-run, there is no queryable history of what was
   auto-fixed and when. [CONFIDENCE: HIGH]

8. **DOCUMENTATION_INDEX.md generation is not timed/instrumented.** The
   pre-commit hook generates it atomically but does not log timing, doc count,
   orphan count, or failure reasons to any state file. [CONFIDENCE: HIGH]

9. **SonarCloud health is null in most records.** In `health-score-log.jsonl`,
   `sonarcloud: null` appears in virtually every entry. The
   ecosystem-integration checker calls `npm run sonar:check` but this appears to
   consistently return null/unavailable in practice. [CONFIDENCE: HIGH]

---

## Web Dashboard Opportunities

### Health Trends

1. **Health score timeline** — `ecosystem-health-log.jsonl` has 32 entries from
   2026-02-28 to 2026-03-26 with full `categoryScores` per entry. Chart:
   composite score over time with letter grades (A-F color bands). Show mode
   (full/limited/quick) as data quality indicator.

2. **Per-category scorecards** — 30+ categories tracked including `code`,
   `security`, `debt-metrics`, `hook-health`, `hook-completeness`,
   `hook-warnings`, `reviews-sync`, `crossdoc`, `consolidation`,
   `roadmap-health`. Dashboard: sparkline per category + current grade.

3. **Category score heatmap** — At any given timestamp, show all 30+ category
   scores as a heatmap (green/yellow/red). Allow time-scrubbing to see how the
   heatmap evolved.

4. **Hook pipeline health over time** — `hook-ecosystem-audit-history.jsonl` (25
   entries) has per-category breakdown: `settings_file_alignment`,
   `event_coverage_matchers`, `output_protocol_compliance`,
   `behavioral_accuracy`, `test_coverage`, `security_patterns`. Rich enough for
   category-level trend charts.

5. **Grade regression alerts** — Surface when composite grade drops 2+ letters
   (already detected by session-start but not shown anywhere persistently).

### Ecosystem Audit History

6. **Audit run timeline** — When was each sub-audit last run? Show recency
   indicators: hook audit last ran 2026-03-19, doc audit last ran 2026-02-25
   (over a month ago).

7. **Sub-audit score comparison** — Show current score for all 8 sub-audits side
   by side with trend arrows from their history files.

8. **Stale audit warnings** — Flag any sub-audit with history file having only 1
   entry (doc, session, TDMS) — these need to be run more regularly.

### Doc Maintenance

9. **Documentation index stats** — Surface from DOCUMENTATION_INDEX.md: 726
   active docs, 104 archived, orphan count, broken links count. Could regenerate
   and display live stats without requiring user to run the tool.

10. **Doc sync status** — Run `docs:sync-check` and show which template-instance
    pairs are out of sync, with timestamps.

11. **Cross-doc dependency health** — `crossdoc:check` output could be surfaced
    as a dashboard widget showing which doc dependencies are failing.

12. **Lifecycle score matrix** — The 20 systems in `lifecycle-scores.jsonl` with
    their capture/storage/recall/action scores could be visualized as a heatmap
    table. Systems with action < 2 are actionable gaps.

### Warning Lifecycle

13. **Active warnings dashboard** — `data/ecosystem-v2/warnings.jsonl` tracks
    warnings through `new → acknowledged → resolved` lifecycle. Current count by
    status + category would be a useful operational widget.

14. **Deferred items aging** — `data/ecosystem-v2/deferred-items.jsonl`: show
    count, average age, items overdue for promotion to TDMS.

---

## CLI Handoff Points

These are points where a web UI user would want to trigger an action that
invokes an existing CLI process:

| Desired Action                   | CLI Equivalent                                          | Expected Duration         |
| -------------------------------- | ------------------------------------------------------- | ------------------------- |
| Run health check                 | `node scripts/health/run-health-check.js`               | ~30s (full), ~10s (quick) |
| Run health dashboard with triage | `/ecosystem-health` skill                               | 10-15 min                 |
| Run specific audit               | `npm run hooks:audit`, `docs:audit`, `tdms:audit`, etc. | 2-5 min each              |
| Run all ecosystem audits         | `/comprehensive-ecosystem-audit`                        | 30 min parallel           |
| Regenerate doc index             | `npm run docs:index`                                    | ~15s                      |
| Run doc sync check               | `npm run docs:sync-check`                               | ~10s                      |
| Run cross-doc check              | `npm run crossdoc:check`                                | ~5s                       |
| Run doc optimizer                | `/doc-optimizer`                                        | 40 min parallel           |
| Acknowledge warnings             | `warning-lifecycle.js` acknowledge API                  | Immediate                 |
| View alerts                      | `/alerts` skill                                         | 15-30s                    |

---

## Historical Data — Chartable Trends

| File                                                 | Entry Count | Date Range                | Chartable Fields                                              |
| ---------------------------------------------------- | ----------- | ------------------------- | ------------------------------------------------------------- |
| `data/ecosystem-v2/ecosystem-health-log.jsonl`       | 32          | 2026-02-28 to 2026-03-26  | `score`, `grade`, 30+ `categoryScores`                        |
| `.claude/state/health-score-log.jsonl`               | 24          | 2026-02-28 to 2026-03-26  | `score`, `grade`, `categoryScores`, `summary.errors/warnings` |
| `.claude/state/hook-ecosystem-audit-history.jsonl`   | 25          | 2026-02-24 to 2026-03-19  | `healthScore.score`, 16 breakdown categories                  |
| `.claude/state/skill-ecosystem-audit-history.jsonl`  | 15          | Early dates to 2026-02-25 | `healthScore.score`, breakdown                                |
| `.claude/state/script-ecosystem-audit-history.jsonl` | 9           | Dates to 2026-03-19       | `healthScore.score`, breakdown                                |
| `.claude/state/alerts-history.jsonl`                 | 1           | 2026-03-19                | Single-entry; `score`, `grade`, `fixes[]`, `learnings[]`      |
| `.claude/state/audit-agent-quality-history.jsonl`    | 1           | 2026-03-17                | `mean_score`, `ecosystem_grade`, finding counts               |
| `data/ecosystem-v2/deferred-items.jsonl`             | Multiple    | 2026-03-01                | Count over time, status changes, severity distribution        |
| `data/ecosystem-v2/warnings.jsonl`                   | Multiple    | Active                    | Status lifecycle, category distribution                       |

The `ecosystem-health-log.jsonl` and `health-score-log.jsonl` have the most
entries and the richest data for trend analysis. The hook ecosystem audit
history (25 entries) has per-dimension scores across 16 categories, making it
the richest single-audit history available.

---

## Sources

| #   | Source                                                            | Type                        | Trust | Notes                                              |
| --- | ----------------------------------------------------------------- | --------------------------- | ----- | -------------------------------------------------- |
| 1   | `.claude/skills/ecosystem-health/SKILL.md`                        | Codebase (SKILL definition) | HIGH  | v2.0, 2026-03-11                                   |
| 2   | `.claude/skills/comprehensive-ecosystem-audit/SKILL.md`           | Codebase (SKILL definition) | HIGH  | v1.1, 2026-02-24                                   |
| 3   | `.claude/skills/docs-maintain/SKILL.md`                           | Codebase (SKILL definition) | HIGH  | v1.0, 2026-02-14                                   |
| 4   | `.claude/skills/doc-optimizer/SKILL.md`                           | Codebase (SKILL definition) | HIGH  | v1.4, 2026-02-24                                   |
| 5   | `scripts/health/run-health-check.js`                              | Codebase (source)           | HIGH  | Ground truth for checker list and category mapping |
| 6   | `scripts/health/lib/composite.js`                                 | Codebase (source)           | HIGH  | Category weights and scoring logic                 |
| 7   | `scripts/health/lib/health-log.js`                                | Codebase (source)           | HIGH  | Persistence path confirmation                      |
| 8   | `scripts/health/lib/mid-session-alerts.js`                        | Codebase (source)           | HIGH  | Alert trigger points                               |
| 9   | `scripts/health/lib/warning-lifecycle.js`                         | Codebase (source)           | HIGH  | Warning state machine                              |
| 10  | `scripts/health/checkers/hook-pipeline.js`                        | Codebase (source)           | HIGH  | Data sources per checker                           |
| 11  | `scripts/health/checkers/ecosystem-integration.js`                | Codebase (source)           | HIGH  | External integrations                              |
| 12  | `scripts/health/checkers/data-effectiveness.js`                   | Codebase (source)           | HIGH  | lifecycle-scores.jsonl consumption                 |
| 13  | `.claude/skills/ecosystem-health/scripts/run-ecosystem-health.js` | Codebase (source)           | HIGH  | Orchestration + persistence                        |
| 14  | `.claude/skills/doc-ecosystem-audit/SKILL.md`                     | Codebase (SKILL definition) | HIGH  | Doc audit detail                                   |
| 15  | `.claude/skills/health-ecosystem-audit/SKILL.md`                  | Codebase (SKILL definition) | HIGH  | Health audit routing                               |
| 16  | `.claude/state/health-score-log.jsonl`                            | Codebase (state data)       | HIGH  | Actual format + 24 real entries                    |
| 17  | `.claude/state/lifecycle-scores.jsonl`                            | Codebase (state data)       | HIGH  | 20 system lifecycle entries                        |
| 18  | `data/ecosystem-v2/ecosystem-health-log.jsonl`                    | Codebase (state data)       | HIGH  | 32 real health entries                             |
| 19  | `.claude/state/*-ecosystem-audit-history.jsonl`                   | Codebase (state data)       | HIGH  | Format confirmed, line counts verified             |
| 20  | `.claude/state/consolidation.json`                                | Codebase (state data)       | HIGH  | Review consolidation state                         |
| 21  | `.claude/hooks/commit-tracker.js`                                 | Codebase (source)           | HIGH  | Mid-session alert trigger                          |
| 22  | `.claude/hooks/session-start.js`                                  | Codebase (source)           | HIGH  | Session-start health check trigger                 |
| 23  | `.husky/pre-commit`                                               | Codebase (source)           | HIGH  | Doc index enforcement                              |
| 24  | `package.json` scripts                                            | Codebase (config)           | HIGH  | Available CLI commands                             |

---

## Contradictions

**Health log split:** The session-start hook appends to
`.claude/state/health-score-log.jsonl` but the ecosystem-health orchestrator
appends to `data/ecosystem-v2/ecosystem-health-log.jsonl`. These two files exist
independently and are not merged. The lifecycle-scores system (ls-007) lists the
`.claude/state/health-score-log.jsonl` as the primary file but also lists the
ecosystem-v2 audit history files. This is inconsistent — it is unclear which is
the canonical health trend source. Both files have data from the same date range
with slightly different entry counts (24 vs 32).

---

## Gaps

1. **No data on what doc-optimizer has actually fixed.** The auto-fix history is
   ephemeral. Cannot tell how many docs were fixed, or when.
2. **No insight into doc sync check failures.** `docs:sync-check` exit codes are
   not persisted to any state file; failures only surface in pre-commit output
   or manual invocations.
3. **`data/ecosystem-v2/test-registry.jsonl`** (112KB) and
   `enforcement-manifest.jsonl` (122KB) were listed in the ecosystem-v2
   directory but their role in health monitoring was not fully explored in this
   investigation. They appear to be reference catalogs rather than active health
   logs.
4. **How warnings in `warnings.jsonl` are consumed** beyond `/alerts` was not
   fully traced. The lifecycle states (new/acknowledged/resolved) are managed by
   `warning-lifecycle.js` but the resolution pathway was not confirmed.
5. **`pr-ecosystem-audit.jsonl`** in `.claude/state/` (59KB) appears to be a raw
   audit results file from an earlier format. Its relationship to
   `pr-ecosystem-audit-history.jsonl` (which does not exist in the state
   directory) was not investigated.

---

## Serendipity

**Two competing warning systems.** The `data/ecosystem-v2/warnings.jsonl` (with
full lifecycle state machine) and `.claude/state/hook-warnings-log.jsonl` (flat
log from hooks) serve overlapping purposes but operate independently. A
dashboard would need to aggregate from both. The `warnings.jsonl` system has
richer lifecycle metadata; `hook-warnings-log.jsonl` has more real-time data
(grows daily from commits).

**`data/ecosystem-v2/invocations.jsonl`** (8.5KB) tracks skill invocations with
schema_version, origin, type, etc. This is separate from
`.claude/state/agent-invocations.jsonl` (14KB). Two parallel invocation tracking
systems exist with different schemas. A dashboard showing "skill usage over
time" would need to reconcile both.

**The `data/ecosystem-v2/` directory is the intended ecosystem data home** but
only the health orchestrator and warning lifecycle system fully use it. Other
processes (session-start, checkers) continue reading/writing directly to
`.claude/state/`. This suggests an incomplete migration toward a centralized
data store.

---

## Confidence Assessment

- HIGH claims: 9
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH (all findings from direct filesystem and source code
  inspection)
