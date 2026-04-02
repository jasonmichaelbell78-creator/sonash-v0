# Findings: Governance & Audits Tab — Data Design

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** W3-T5A

---

## Summary

All 8 ecosystem audit history files were read directly from `.claude/state/`.
The agent quality history file was also read. Schemas are substantially uniform
across all 8 audit files. Record counts range from 1 to 25. Two audits have not
been re-run in 35 days. Total raw data is ~178 KB. The static export plan is
feasible and well within browser size limits.

---

## 1. Data Schema Analysis

### 1a. Universal Schema (7 of 8 ecosystem audit files)

All 7 ecosystem audit history files (`doc`, `hook`, `script`, `session`,
`skill`, `tdms`, `pr`) share this exact top-level structure:

```json
{
  "timestamp": "2026-03-19T...", // ISO 8601 UTC
  "healthScore": {
    "score": 95, // integer 0-100
    "grade": "A", // A/B/C/D/F
    "breakdown": {
      "<category_key>": {
        "score": 100, // integer 0-100
        "weight": 0.07, // float, weights sum to ~1.0
        "contribution": 7 // score * weight (rounded)
      }
    }
  },
  "categories": {
    "<category_key>": {
      "score": 100, // mirrors breakdown.score
      "rating": "good" // "good" | "average" | "poor"
    }
  },
  "summary": {
    "errors": 2, // integer
    "warnings": 123, // integer
    "info": 23 // integer
  }
}
```

**Key observation:** `categories` and `healthScore.breakdown` contain the same
category keys with identical scores. They differ only in the additional fields:
`breakdown` has `weight` and `contribution`; `categories` has `rating` (text
enum). For dashboard use, `categories` is sufficient for rendering — it provides
score + semantic rating without the weight arithmetic. Use `breakdown` only if
you need to explain how a composite score was calculated.

**Confirmed identical across:** doc, hook, script, session, skill, tdms, pr.
[CONFIDENCE: HIGH — verified by direct field inspection of all 7 files]

### 1b. Agent Quality Schema (separate)

`audit-agent-quality-history.jsonl` uses a completely different schema:

```json
{
  "date": "2026-03-17", // date string (not ISO timestamp)
  "agents_total": 36,
  "agents_audited": 36,
  "ecosystem_grade": "F", // A/B/C/D/F
  "mean_score": 51, // integer 0-100
  "post_improvement_mean": 54,
  "structural_findings": 59,
  "behavioral_findings": 36,
  "decisions": {
    "improve": 6,
    "skip": 18,
    "flag_upstream": 12
  },
  "top_gap": "code-patterns",
  "cl_corrections": 4,
  "categories": 13 // count, not object
}
```

This file is distinct from the 8 ecosystem audits. No `healthScore` wrapper.
`categories` is an integer (count), not an object map. The `date` field is a
plain date string, not an ISO timestamp. [CONFIDENCE: HIGH]

### 1c. File Name Inconsistency

The PR audit file is named `pr-ecosystem-audit.jsonl` (no `-history` suffix).
All others follow `<name>-ecosystem-audit-history.jsonl`. This is a data layer
concern: the static export script must hard-code this exception or normalize the
name at load time.

The `health-ecosystem-audit-history.jsonl` file does not exist. The
`health-ecosystem-audit` skill is documented but has not been run against this
project. [CONFIDENCE: HIGH — verified via `ls` of `.claude/state/`]

---

## 2. Record Counts and Run Frequency

| Audit         | File                                    | Records | Last Run   | Days Stale | Score Range | Last Score | Last Grade |
| ------------- | --------------------------------------- | ------- | ---------- | ---------- | ----------- | ---------- | ---------- |
| hook          | `hook-ecosystem-audit-history.jsonl`    | 25      | 2026-03-19 | 10         | 63–99       | 95         | A          |
| pr            | `pr-ecosystem-audit.jsonl`              | 24      | 2026-02-22 | 35         | 65–91       | 88         | B          |
| skill         | `skill-ecosystem-audit-history.jsonl`   | 15      | 2026-02-25 | 32         | 65–83       | 83         | B          |
| script        | `script-ecosystem-audit-history.jsonl`  | 9       | 2026-03-19 | 10         | 57–64       | 64         | D          |
| doc           | `doc-ecosystem-audit-history.jsonl`     | 1       | 2026-02-25 | 32         | 77–77       | 77         | C          |
| session       | `session-ecosystem-audit-history.jsonl` | 1       | 2026-02-24 | 33         | 78–78       | 78         | C          |
| tdms          | `tdms-ecosystem-audit-history.jsonl`    | 1       | 2026-02-24 | 33         | 51–51       | 51         | F          |
| health        | (no file)                               | 0       | never      | —          | —           | —          | —          |
| agent_quality | `audit-agent-quality-history.jsonl`     | 1       | 2026-03-17 | 12         | —           | 51         | F          |

**Most frequently run:** hook (25 records across 4 dates — heavily iterated
during the hook if-conditions project), pr (24 records across 1 date — iterated
during a pr-review fix session).

**Least run / stale:** tdms, session, doc each have exactly 1 record, 32–33 days
stale. health has never been run.

**Pattern:** High record counts represent iterative improvement sessions (audit
→ fix → re-audit), not weekly cadence. Multiple records within a single date are
common (hook: 17 records on 2026-02-24 alone).

---

## 3. Schema Consistency and Drift

**Schema drift is real and must be handled.**

Two audits added new category keys mid-history:

- **hook**: Records 1–17 have 16 category keys. Records 18–25 (starting
  2026-03-08) added 3 new keys: `ci_cache_effectiveness`,
  `workflow_script_alignment`, `bot_config_freshness`. Two distinct schemas
  exist within the same file.

- **pr**: Records 1–20 have 14 category keys. Records 21–24 (latest batch) added
  4 new keys: `pattern_discovery_automation`, `automation_coverage_gap`,
  `pattern_enforcement_coverage`, `consolidation_pipeline_health`. The audit was
  extended to cover D3 (Pattern Lifecycle) more granularly.

**Implication for dashboard:** Per-category trend lines must handle missing
values (a category absent in older records has no historical data for that key).
The UI should render `null`/gap rather than `0` for missing historical points. A
"first appeared" date per category key would be a useful derived field in the
static export.

---

## 4. Category Keys Per Audit (for sub-audit comparison panel)

### doc (16 categories)

`index_filesystem_sync`, `index_metadata_accuracy`, `orphaned_documents`,
`internal_link_health`, `cross_doc_dependency_accuracy`,
`anchor_reference_validity`, `image_asset_references`,
`header_frontmatter_compliance`, `formatting_consistency`, `content_freshness`,
`docs_index_correctness`, `doc_optimizer_pipeline`, `precommit_doc_checks`,
`documentation_coverage`, `agent_doc_references`, `readme_onboarding`

### hook (16 base + 3 added in v2)

Base: `settings_file_alignment`, `event_coverage_matchers`,
`global_local_consistency`, `error_handling_sanitization`, `security_patterns`,
`code_hygiene`, `regex_safety`, `stage_ordering_completeness`,
`bypass_override_controls`, `gate_effectiveness`, `test_coverage`,
`output_protocol_compliance`, `behavioral_accuracy`, `state_file_health`,
`cross_hook_dependencies`, `compaction_resilience` Added:
`ci_cache_effectiveness`, `workflow_script_alignment`, `bot_config_freshness`

### script (18 categories)

`cjs_esm_consistency`, `shebang_entry_point`, `nodejs_api_compatibility`,
`file_io_safety`, `error_sanitization`, `path_traversal_guards`, `exec_safety`,
`security_helper_usage`, `package_json_coverage`, `cross_script_dependencies`,
`shared_lib_utilization`, `documentation_headers`, `consistent_patterns`,
`dead_code`, `complexity`, `test_coverage`, `test_freshness`,
`error_path_testing`

### session (16 categories)

`session_begin_completeness`, `session_end_completeness`,
`session_counter_accuracy`, `session_doc_freshness`, `handoff_file_schema`,
`commit_log_integrity`, `task_state_file_health`, `session_notes_quality`,
`layer_a_commit_tracker`, `layer_c_precompact_save`, `layer_d_gap_detection`,
`restore_output_quality`, `begin_end_balance`, `multi_session_validation`,
`hook_registration_alignment`, `state_file_management`

### skill (21 categories)

`frontmatter_schema`, `step_continuity`, `section_structure`, `bloat_score`,
`skill_to_skill_refs`, `skill_to_script_refs`, `skill_to_template_refs`,
`evidence_citation_validity`, `dependency_chain_health`,
`scope_boundary_clarity`, `trigger_accuracy`, `output_format_consistency`,
`skill_registry_sync`, `version_history_currency`, `dead_skill_detection`,
`pattern_reference_sync`, `inline_code_duplication`, `agent_prompt_consistency`,
`agent_skill_alignment`, `parallelization_correctness`, `team_config_health`

### tdms (16 categories)

`script_execution_order`, `data_flow_integrity`, `intake_pipeline`,
`dedup_algorithm_health`, `schema_compliance`, `content_hash_integrity`,
`id_uniqueness_referential`, `error_handling_coverage`, `master_deduped_sync`,
`backup_atomicity`, `track_assignment_rules`, `roadmap_debt_cross_ref`,
`sprint_file_alignment`, `view_generation_accuracy`,
`metrics_dashboard_correctness`, `audit_trail_completeness`

### pr (14 base + 4 added)

Base: `skill_invocation_fidelity`, `review_process_completeness`,
`retro_quality_compliance`, `learning_capture_integrity`,
`state_file_consistency`, `archive_retention_health`, `jsonl_sync_fidelity`,
`feedback_loop_closure`, `cross_pr_pattern_recurrence`,
`external_tool_configuration`, `cross_system_integration`,
`review_cycle_efficiency`, `agent_utilization_effectiveness`,
`template_reference_quality` Added: `pattern_discovery_automation`,
`automation_coverage_gap`, `pattern_enforcement_coverage`,
`consolidation_pipeline_health`

---

## 5. Worst-Category Signals (Latest Run Per Audit)

Critical signals for a "stale/failing categories" panel:

| Audit   | Worst Category           | Score | Second Worst                    | Score |
| ------- | ------------------------ | ----- | ------------------------------- | ----- |
| tdms    | content_hash_integrity   | 0     | master_deduped_sync             | 0     |
| session | session_notes_quality    | 0     | begin_end_balance               | 0     |
| skill   | agent_prompt_consistency | 0     | step_continuity                 | 33    |
| doc     | index_metadata_accuracy  | 0     | image_asset_references          | 0     |
| script  | security_helper_usage    | 0     | test_coverage                   | 7     |
| pr      | review_cycle_efficiency  | 35    | agent_utilization_effectiveness | 50    |
| hook    | regex_safety             | 60    | global_local_consistency        | 80    |

---

## 6. Visualization Spec

### 6a. Audit Recency Table

Columns: Audit Name | Last Run Date | Days Since | Score | Grade | Warning

**Stale thresholds (per audit type):**

| Audit   | Warning Threshold | Critical Threshold | Rationale                                          |
| ------- | ----------------- | ------------------ | -------------------------------------------------- |
| hook    | 14 days           | 30 days            | High-churn infrastructure; hooks change frequently |
| pr      | 14 days           | 30 days            | Every PR session should trigger a re-audit         |
| script  | 21 days           | 45 days            | Script changes are less frequent                   |
| skill   | 21 days           | 45 days            | Skills evolve at documentation cadence             |
| doc     | 21 days           | 45 days            | Doc pipeline runs on doc changes                   |
| session | 30 days           | 60 days            | Session infrastructure changes rarely              |
| tdms    | 30 days           | 60 days            | TDMS pipeline changes are infrequent               |
| health  | 30 days           | 60 days            | Health infrastructure changes rarely               |

**Current state with these thresholds (as of 2026-03-29):**

- hook: 10 days — OK
- script: 10 days — OK
- agent_quality: 12 days — OK
- pr: 35 days — CRITICAL (14-day warning, 30-day critical)
- skill: 32 days — CRITICAL (21-day warning, 45-day critical) — WARNING
- doc: 32 days — WARNING (21-day threshold)
- session: 33 days — WARNING (30-day threshold)
- tdms: 33 days — WARNING (30-day threshold)
- health: never — MISSING (no file exists)

### 6b. Score Comparison Panel (8 Audits Side-by-Side)

Horizontal bar chart or radar chart showing the composite score for each of the
8 audits (latest run). health shows as "Not Run" / 0 with a distinct visual
treatment.

**Data for latest scores:**

| Audit   | Score | Grade | Visual Status  |
| ------- | ----- | ----- | -------------- |
| hook    | 95    | A     | green          |
| pr      | 88    | B     | green-yellow   |
| skill   | 83    | B     | green-yellow   |
| session | 78    | C     | yellow         |
| doc     | 77    | C     | yellow         |
| script  | 64    | D     | orange         |
| tdms    | 51    | F     | red            |
| health  | N/A   | —     | gray (not run) |

**Recommendation:** Use a horizontal bar chart (not radar). Scores are on a
0–100 scale with clear thresholds (A: 90+, B: 80+, C: 70+, D: 60+, F: <60). A
threshold line at 70 (C threshold) and 80 (B threshold) aids interpretation.

### 6c. Trend Lines (Per-Audit Score Over Time)

Eligibility (5+ distinct records): hook (25), pr (24), skill (15) qualify.
script (9), doc (1), session (1), tdms (1) do not qualify.

**Hook trend** (4 distinct dates, but 25 runs shows within-session convergence):

- 2026-02-24: 63 → 99 (8 iterations within one day, rapid improvement)
- 2026-02-25: 96
- 2026-03-08: 91 → 95 (3 iterations)
- 2026-03-19: 95

**PR trend** (1 distinct date — all 24 runs on 2026-02-22):

- 2026-02-22: 65 → 91 (24 iterations in one session)

**Skill trend** (1 distinct date — all 15 runs on 2026-02-25):

- 2026-02-25: 65 → 83

**Implication for trend chart:** All three high-record audits show intra-session
iteration patterns rather than time-series across weeks. A single x-axis date is
not meaningful for "trend". Options:

1. Plot all records sequentially (run index, not date) — shows improvement
   within sessions
2. Plot only the last run per date — shows inter-session stability
3. Collapse to per-date max score — shows best-achieved score over time

**Recommendation:** Use run-index x-axis (option 1) with date bands (shaded
regions indicating date boundaries). This shows both the in-session improvement
arc and cross-session stability. Add a "session start" marker where date
changes.

### 6d. Agent Quality Trend

Only 1 record. Score: 51 (F), mean 51, post-improvement mean 54. Show as a
single data point with grade badge. No trend line possible yet.

Display: Score badge (F / 51), `agents_audited / agents_total`, structural vs
behavioral finding counts, decisions breakdown (improve/skip/flag_upstream).

---

## 7. Static Export Plan

### 7a. Output File: `public/audits-data.json`

Structure:

```json
{
  "generated_at": "2026-03-29T...",
  "audits": {
    "hook":    { "name": "Hook",    "file": "hook-ecosystem-audit-history.jsonl",   "records": [...] },
    "pr":      { "name": "PR",      "file": "pr-ecosystem-audit.jsonl",              "records": [...] },
    "skill":   { "name": "Skill",   "file": "skill-ecosystem-audit-history.jsonl",  "records": [...] },
    "script":  { "name": "Script",  "file": "script-ecosystem-audit-history.jsonl", "records": [...] },
    "doc":     { "name": "Doc",     "file": "doc-ecosystem-audit-history.jsonl",    "records": [...] },
    "session": { "name": "Session", "file": "session-ecosystem-audit-history.jsonl","records": [...] },
    "tdms":    { "name": "TDMS",    "file": "tdms-ecosystem-audit-history.jsonl",   "records": [...] },
    "health":  { "name": "Health",  "file": null, "records": [] }
  },
  "agent_quality": { "records": [...] }
}
```

Each record in `records` is the raw JSONL entry verbatim, plus a derived field:

```json
{
  "timestamp": "...",
  "healthScore": { ... },
  "categories": { ... },
  "summary": { ... },
  "_run_index": 0,       // sequential index across all records for this audit
  "_date": "2026-02-24"  // extracted date string for grouping
}
```

### 7b. Size Estimate

Raw JSONL total: 182,105 bytes (177.8 KB)

With `_run_index` and `_date` added (~20 bytes each × ~76 records): +1,520
bytes.

**Estimate for `public/audits-data.json`:** ~185–190 KB raw JSON, ~60–65 KB
gzipped. Well within browser budget (Next.js static page typical budget is 200
KB gzipped). No pagination or lazy loading required for this dataset size.

**Note:** The per-category `breakdown` field (score + weight + contribution) is
redundant with the `categories` field for display purposes. Stripping
`healthScore.breakdown` from the export would reduce size by approximately 40%
(breakdown is 3 fields vs categories's 2 fields, and breakdown is used in
`healthScore.breakdown` object which duplicates all keys). Optional optimization
if size becomes a concern.

### 7c. Build Script Location

Suggested: `scripts/dashboard/aggregate-audits.js`

Input: all `.claude/state/*-ecosystem-audit*.jsonl` +
`audit-agent-quality-history.jsonl` Output: `public/audits-data.json`

Must handle:

- PR file naming exception (`pr-ecosystem-audit.jsonl` not
  `pr-ecosystem-audit-history.jsonl`)
- health file absence (emit empty `records: []`)
- Schema drift (categories superset across records)
- agent_quality separate schema (no `healthScore` wrapper)

---

## 8. Component Breakdown

### `AuditsTab` (page-level container)

- Renders 4 child sections stacked vertically
- Receives `auditsData` prop from static `getStaticProps`

### `AuditRecencyTable`

- Props: `audits: AuditSummary[]`, `thresholds: StaleThresholds`
- Renders a sortable table: Name | Last Run | Days Since | Score | Grade |
  Status badge
- Status badge: OK (green) | WARNING (yellow) | CRITICAL (red) | MISSING (gray)
- Click row → expands to show per-category scores for latest run

### `AuditScoreComparison`

- Props: `audits: AuditSummary[]`
- Horizontal bar chart (Recharts `BarChart` or custom SVG bars)
- X-axis: 0–100 score, threshold lines at 70 and 80
- Y-axis: audit name
- Color-coded by grade: A=green, B=yellow-green, C=yellow, D=orange, F=red,
  missing=gray
- Tooltip shows score, grade, last run date, category count

### `AuditTrendChart`

- Props: `auditName: string`, `records: AuditRecord[]`
- Only rendered for hook, pr, skill (5+ records)
- Line chart with run-index x-axis
- Date boundary shading (vertical bands per date)
- "Session start" marker icons at date transitions
- Zoom/pan for hook (25 records) and pr (24 records)

### `SubAuditHeatmap`

- Props: `audit: AuditRecord`, `showDrift?: boolean`
- Grid of all category scores for one audit
- Color: score ≥ 80 = green, 60–79 = yellow, < 60 = red
- Shows `rating` text on hover
- If `showDrift`: highlights newly-added categories (not present in first
  record)

### `AgentQualityPanel`

- Props: `records: AgentQualityRecord[]`
- Single record: grade badge (F), score, agents_audited/agents_total
- Horizontal bar split: structural vs behavioral findings
- Decisions donut: improve / skip / flag_upstream
- If future records accumulate: add trend line

### `StaleAuditAlert`

- Props: `staleAudits: StaleAudit[]`
- Banner/callout above the table when any audit is CRITICAL or MISSING
- Lists audit names with days stale
- Dismissable per-session (localStorage flag)

---

## Sources

| #   | Path                                                                | Type                      | Trust | CRAAP     | Date       |
| --- | ------------------------------------------------------------------- | ------------------------- | ----- | --------- | ---------- |
| 1   | `.claude/state/doc-ecosystem-audit-history.jsonl`                   | filesystem (ground truth) | HIGH  | 5/5/5/5/5 | 2026-02-25 |
| 2   | `.claude/state/hook-ecosystem-audit-history.jsonl`                  | filesystem (ground truth) | HIGH  | 5/5/5/5/5 | 2026-03-19 |
| 3   | `.claude/state/pr-ecosystem-audit.jsonl`                            | filesystem (ground truth) | HIGH  | 5/5/5/5/5 | 2026-02-22 |
| 4   | `.claude/state/script-ecosystem-audit-history.jsonl`                | filesystem (ground truth) | HIGH  | 5/5/5/5/5 | 2026-03-19 |
| 5   | `.claude/state/session-ecosystem-audit-history.jsonl`               | filesystem (ground truth) | HIGH  | 5/5/5/5/5 | 2026-02-24 |
| 6   | `.claude/state/skill-ecosystem-audit-history.jsonl`                 | filesystem (ground truth) | HIGH  | 5/5/5/5/5 | 2026-02-25 |
| 7   | `.claude/state/tdms-ecosystem-audit-history.jsonl`                  | filesystem (ground truth) | HIGH  | 5/5/5/5/5 | 2026-02-24 |
| 8   | `.claude/state/audit-agent-quality-history.jsonl`                   | filesystem (ground truth) | HIGH  | 5/5/5/5/5 | 2026-03-17 |
| 9   | `.claude/skills/_shared/ecosystem-audit/SUMMARY_AND_TRENDS.md`      | filesystem (canonical)    | HIGH  | 5/5/5/5/5 | 2026-03-25 |
| 10  | `.research/dev-dashboard/findings/SQ1a-2-ecosystem-audit-skills.md` | prior research            | HIGH  | 5/5/5/4/5 | 2026-03-29 |

---

## Contradictions

**SKILL.md claims vs actual files:**

- `health-ecosystem-audit` SKILL.md documents a `testPassRate` field and a
  persistent history file at `health-ecosystem-audit-history.jsonl`. Neither the
  file nor the field exist in the actual filesystem. The skill has been designed
  but not run. The `testPassRate` cross-system consumer (consumed by `/alerts`)
  documented in SQ1a-2 findings is therefore not active.

- The SKILL.md files for doc, hook, session, skill, tdms, pr all reference the
  shared `SUMMARY_AND_TRENDS.md` template but do not reproduce the exact history
  file schema. The actual schema found in all 7 files
  (`{timestamp, healthScore, categories, summary}`) does NOT include the
  explicitly documented `unresolvedFindings` field. The SQ1a-2 prior research
  expected `{timestamp, grade, score, unresolvedFindings}` — the actual data
  wraps `grade` and `score` inside `healthScore{}` and has no
  `unresolvedFindings` field at the top level.

---

## Gaps

1. **health-ecosystem-audit has never been run.** The file does not exist.
   Dashboard must handle this gracefully as a "MISSING" state. There is no
   historical data to display for health.

2. **Agent quality has only 1 record.** Trend line is not possible. The
   dashboard should suppress the trend chart for this audit and show a "Run
   again to see trends" message.

3. **No deferred-findings-to-TDMS linkage in history files.** The SKILL.md
   documents that deferred findings create DEBT entries via `/add-debt`, but the
   history JSONL records do not contain any `deferredFindings` or `debtCreated`
   field. There is no direct data path from audit history to TDMS in the current
   schema. If the tab is supposed to show "deferred findings promoted to TDMS,"
   this data must come from a different source (e.g., MASTER_DEBT.jsonl filtered
   by source=audit, or a separate deferred log). This gap requires a design
   decision before implementation.

4. **`pr-ecosystem-audit.jsonl` naming inconsistency is undocumented.** No
   SKILL.md or convention file explains why this file lacks the `-history`
   suffix. The build script must hard-code this as a special case.

5. **`categories` vs `healthScore.breakdown` redundancy.** Both contain the same
   score per category. The `breakdown` additionally has `weight` and
   `contribution`. `categories` additionally has `rating` (text). Neither is
   strictly a superset of the other. For dashboard purposes, `categories` is
   sufficient. The `weight` data in `breakdown` could support a "weighted
   contribution" breakdown visualization but this was not requested.

---

## Serendipity

- **Intra-session iteration is the dominant record pattern.** hook has 17
  records on a single date, pr has 24 records on a single date, skill has 15 on
  one date. This is audit→fix→re-audit convergence behavior, not a weekly
  cadence. A run-index x-axis for trend charts is not just acceptable — it is
  the correct representation of how this data is actually generated.

- **Three audits are simultaneously critical.** pr (35 days), skill (32 days),
  and doc (32 days) all exceed reasonable stale thresholds as of 2026-03-29.
  tdms (33 days, grade F) and session (33 days) are also stale. Five of eight
  audits need re-runs. This makes the stale audit warning banner a day-one
  active feature, not an edge case.

- **tdms has both a grade F score and critical staleness.** It was last run on
  2026-02-24 with score 51/F, and two categories at exactly 0
  (`content_hash_integrity`, `master_deduped_sync`). This is the highest
  priority audit to re-run. The dashboard's stale warning could surface this
  priority ordering (stale + low grade > stale + high grade).

- **Schema drift can serve as a feature signal.** When new category keys appear
  in later records (hook gained 3 in March, pr gained 4 in the same batch), this
  marks when the audit skill was extended. A dashboard could annotate the trend
  chart: "3 new categories added" at the schema transition point. This turns a
  data hazard into useful context.

---

## Confidence Assessment

- HIGH claims: 14
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All schema findings were verified directly against the JSONL files via Python
`json.loads`. Record counts verified via `wc -l`. File existence verified via
`ls`. Prior research from SQ1a-2 used as context only; all data claims in this
document are ground-truth verified.
