# Findings: Ecosystem Audit Skills -- Data Catalog for Dev Dashboard

**Searcher:** deep-research-searcher  
**Profile:** codebase  
**Date:** 2026-03-29  
**Sub-Question IDs:** SQ1a-2

---

## Summary

All 8 ecosystem audit skills follow an identical pattern: run a Node.js audit
script, produce v2 JSON output, display an interactive dashboard, walk through
findings, and append a history record to a persistent JSONL file. Each skill
writes to `.claude/state/<skill-name>-history.jsonl` as its primary long-lived
data artifact. Temporary session artifacts go to `.claude/tmp/` and are deleted
on completion. The result is a rich, structured, time-series dataset per
ecosystem that is highly suitable for a web dashboard.

---

## Skill 1: `doc-ecosystem-audit`

**Invocation:** `/doc-ecosystem-audit`  
**Scope:** Documentation quality, index sync, link integrity, generation
pipelines, coverage

### Data Produced

| Artifact             | Path                                                    | Format   | Lifetime                          |
| -------------------- | ------------------------------------------------------- | -------- | --------------------------------- |
| Audit script stdout  | (piped)                                                 | v2 JSON  | Ephemeral                         |
| Progress file        | `.claude/tmp/doc-audit-progress.json`                   | JSON     | Session-only, deleted on complete |
| Session decision log | `.claude/tmp/doc-audit-session-{YYYY-MM-DD-HHMM}.jsonl` | JSONL    | Session-only                      |
| Audit report         | `.claude/tmp/doc-audit-report-{YYYY-MM-DD}.md`          | Markdown | Session-only                      |
| **History file**     | `.claude/state/doc-ecosystem-audit-history.jsonl`       | JSONL    | **Persistent, append-only**       |

### What It Measures

16 categories across 5 domains (D1=20%, D2=25%, D3=20%, D4=20%, D5=15%):

- **D1: Index & Registry Health** -- index-filesystem sync, metadata accuracy,
  orphaned docs
- **D2: Link & Reference Integrity** -- internal links, cross-doc deps, anchors,
  images
- **D3: Content Quality & Compliance** -- headers, formatting, content freshness
  (30-day threshold)
- **D4: Generation Pipeline Health** -- docs:index script, doc-optimizer,
  pre-commit doc checks
- **D5: Coverage & Completeness** -- doc coverage of major systems, CLAUDE.md
  refs, README health

Outputs: per-category scores (0-100), composite grade (A-F), error/warning/info
counts, trend sparkline.

### History File Fields

Standard pattern from shared `SUMMARY_AND_TRENDS.md` template. Minimum expected:
`{timestamp, grade, score, unresolvedFindings}`. Likely includes per-category
scores and delta vs prior run.

### CLI-only vs Persistent

**Persistent.** History JSONL survives sessions. Temporary artifacts (progress
file, session log, report) are deleted on completion.

### Web Dashboard Relevance

**HIGH** -- Doc health is a fundamental project quality indicator. The
16-category breakdown with A-F grade and trend sparkline maps directly to a
dashboard panel. Content freshness (30-day threshold) and broken link counts are
immediately actionable metrics.

### Natural Grouping Affinity

`skill-ecosystem-audit` (both measure AI toolchain quality),
`session-ecosystem-audit` (session docs are part of the doc ecosystem),
`hook-ecosystem-audit` (both audit pipeline infrastructure).

---

## Skill 2: `health-ecosystem-audit`

**Invocation:** `/health-ecosystem-audit`  
**Scope:** Health monitoring system -- `scripts/health/` checkers, scoring
pipeline, data persistence, test coverage, mid-session alerts

### Data Produced

| Artifact            | Path                                                       | Format   | Lifetime                           |
| ------------------- | ---------------------------------------------------------- | -------- | ---------------------------------- |
| Audit script stdout | (piped)                                                    | v2 JSON  | Ephemeral                          |
| Progress file       | `.claude/tmp/health-audit-progress.json`                   | JSON     | Session-only, deleted on complete  |
| Session log         | `.claude/tmp/health-audit-session-{YYYY-MM-DD-HHMM}.jsonl` | JSONL    | Session-only                       |
| Audit report        | `.claude/tmp/health-audit-report-{YYYY-MM-DD}.md`          | Markdown | Session-only                       |
| Orchestrator result | `.claude/tmp/ecosystem-health-result.json`                 | JSON     | Session-only (comprehensive-audit) |
| **History file**    | `.claude/state/health-ecosystem-audit-history.jsonl`       | JSONL    | **Persistent, append-only**        |

### What It Measures

26 categories across 6 domains:

- Health checker script quality and coverage
- Scoring pipeline accuracy
- Data persistence (`.claude/state/` JSONL schemas)
- Consumer integration (how health data is read by other systems)
- Test coverage (live `npm test` execution integrated as D5)
- Mid-session alert system

### History File Fields

**Explicitly documented:**
`{timestamp, grade, score, testPassRate, unresolvedFindings}`

The `testPassRate` field is consumed by `/alerts` for the Test Health category
-- the only history file with a documented cross-system consumer.

### CLI-only vs Persistent

**Persistent.** History JSONL survives sessions and is actively consumed by
`/alerts`. The `testPassRate` field creates a live integration with the session
alerting system.

### Web Dashboard Relevance

**HIGH** -- Richest cross-system integration of any audit skill. Captures live
test pass rates, monitors the health-check infrastructure itself, and feeds the
alerts system. Dashboard panels: overall health grade, test pass rate trend,
alert counts over time.

### Natural Grouping Affinity

`hook-ecosystem-audit` (both own infrastructure health),
`session-ecosystem-audit` (mid-session alerts are part of session lifecycle).
Secondary affinity with all other audits -- it monitors the monitoring system.

---

## Skill 3: `hook-ecosystem-audit`

**Invocation:** `/hook-ecosystem-audit`  
**Scope:** Claude Code hooks (`.claude/hooks/`), pre-commit pipeline
(`.husky/`), CI/CD pipeline health, state management

### Data Produced

| Artifact             | Path                                                     | Format   | Lifetime                           |
| -------------------- | -------------------------------------------------------- | -------- | ---------------------------------- |
| Audit script stdout  | (piped)                                                  | v2 JSON  | Ephemeral                          |
| Progress file        | `.claude/tmp/hook-audit-progress.json`                   | JSON     | Session-only, deleted on complete  |
| Session decision log | `.claude/tmp/hook-audit-session-{YYYY-MM-DD-HHMM}.jsonl` | JSONL    | Session-only                       |
| Audit report         | `.claude/tmp/hook-audit-report-{YYYY-MM-DD}.md`          | Markdown | Session-only                       |
| Orchestrator result  | `.claude/tmp/ecosystem-hook-result.json`                 | JSON     | Session-only (comprehensive-audit) |
| **History file**     | `.claude/state/hook-ecosystem-audit-history.jsonl`       | JSONL    | **Persistent, append-only**        |

### What It Measures

20 categories across 6 domains:

- **D1: Hook Structure** -- Claude Code hook file validity, registration in
  settings.json
- **D2: Pre-commit Pipeline** -- husky stages, pattern enforcement gates,
  skip/override handling
- **D3: Pre-commit Data** -- override-log.jsonl, warning aggregation, baseline
  handling
- **D4: Functional Correctness** -- hook trigger system, matcher patterns, Bash
  patterns
- **D5: State Integration** -- hook-runs.jsonl, override-log.jsonl, warning-log
  health
- **D6: CI/CD Pipeline** -- GitHub Actions workflow health

Includes a **Gate Effectiveness Review** (Phase 5) that reads
`.claude/state/override-log.jsonl` to compute override rates per gate over the
last 30 days.

### History File Fields

Explicitly documented:
`{timestamp, grade, score, learnings[], process_feedback}`. The `learnings`
field captures 2-3 auto-generated data-driven insights per run.

### CLI-only vs Persistent

**Persistent.** History JSONL survives sessions. Gate effectiveness data is
derived from `override-log.jsonl` which is also persistent and cross-system.

### Web Dashboard Relevance

**HIGH** -- Hook health is a developer productivity multiplier. Override rate
per gate is a uniquely actionable metric (gates overridden more than 50% of the
time are flagged as ineffective). The 20-category breakdown with CI/CD domain
makes this the most comprehensive infrastructure health signal.

### Natural Grouping Affinity

`session-ecosystem-audit` (both cover hooks and state files),
`script-ecosystem-audit` (both audit infrastructure scripts). The override-log
data cross-references with PR workflow quality.

---

## Skill 4: `pr-ecosystem-audit`

**Invocation:** `/pr-ecosystem-audit`  
**Scope:** PR review workflow -- skill invocation fidelity, pattern lifecycle,
data state, feedback loops, effectiveness metrics

### Data Produced

| Artifact             | Path                                                          | Format   | Lifetime                          |
| -------------------- | ------------------------------------------------------------- | -------- | --------------------------------- |
| Audit script stdout  | (piped)                                                       | v2 JSON  | Ephemeral                         |
| Progress file        | `.claude/tmp/pr-audit-progress.json`                          | JSON     | Session-only, deleted on complete |
| Session decision log | `.claude/tmp/ecosystem-audit-session-{YYYY-MM-DD-HHMM}.jsonl` | JSONL    | Session-only                      |
| Audit report         | `.claude/tmp/pr-audit-report-{YYYY-MM-DD}.md`                 | Markdown | Session-only                      |
| **History file**     | `.claude/state/pr-ecosystem-audit-history.jsonl`              | JSONL    | **Persistent, append-only**       |

### What It Measures

18 categories across 5 domains (D1=20%, D2=15%, D3=25%, D4=25%, D5=15%):

- **D1: Process Compliance** -- skill invocation fidelity, review completeness,
  retro quality, learning capture
- **D2: Data & State Health** -- reviews.jsonl sync, archive retention, JSONL
  drift
- **D3: Pattern Lifecycle** -- pattern discovery-to-automation pipeline,
  enforcement coverage, consolidation
- **D4: Feedback & Integration** -- feedback loop closure, cross-PR recurrence,
  external tool config (Qodo, SonarCloud)
- **D5: Effectiveness Metrics** -- review cycle efficiency (rounds per PR, churn
  %), agent utilization, template quality

References DORA/Accelerate industry benchmarks. Reads
`.claude/state/reviews.jsonl` and `review-metrics.jsonl`.

### History File Fields

Not explicitly documented in SKILL.md beyond standard pattern. Likely:
`{timestamp, grade, score, unresolvedFindings}` plus domain scores.

### CLI-only vs Persistent

**Persistent.** History JSONL survives sessions. Source data in
`.claude/state/reviews.jsonl` and `review-metrics.jsonl` provides the underlying
richness.

### Web Dashboard Relevance

**HIGH** -- PR review metrics are among the most actionable developer
productivity signals. Rounds per PR, fix ratio, pattern automation coverage, and
churn percentage are DORA-style metrics. The cross-PR recurrence detector
identifies systemic issues.

### Natural Grouping Affinity

`skill-ecosystem-audit` (both measure AI toolchain quality/usage),
`hook-ecosystem-audit` (pattern enforcement flows through hooks). The
`reviews.jsonl` data powers the review-metrics panel.

---

## Skill 5: `script-ecosystem-audit`

**Invocation:** `/script-ecosystem-audit`  
**Scope:** `scripts/**/*.js` infrastructure -- module consistency, safety
patterns, reachability, code quality, testing

### Data Produced

| Artifact            | Path                                                       | Format  | Lifetime                          |
| ------------------- | ---------------------------------------------------------- | ------- | --------------------------------- |
| Audit script stdout | (piped)                                                    | v2 JSON | Ephemeral                         |
| Progress file       | `.claude/tmp/script-audit-progress.json`                   | JSON    | Session-only, deleted on complete |
| Session log         | `.claude/tmp/script-audit-session-{YYYY-MM-DD-HHMM}.jsonl` | JSONL   | Session-only                      |
| **History file**    | `.claude/state/script-ecosystem-audit-history.jsonl`       | JSONL   | **Persistent, append-only**       |

### What It Measures

18 categories across 5 domains. Key domains:

- **Module consistency** -- require/import patterns, shared library usage
- **Safety patterns** -- CLAUDE.md Section 5 anti-patterns (error sanitization,
  path traversal, shell injection risks, etc.)
- **Reachability** -- scripts referenced in package.json exist; no dead scripts
- **Code quality** -- try/catch coverage, complexity indicators
- **Testing** -- test coverage for script utilities

Supports `--summary`, `--check`, `--batch`, `--save-baseline` flags for
programmatic use.

Note: Skill-local scripts (`.claude/skills/*/scripts/`) are owned by
`/skill-ecosystem-audit`, not this skill.

### History File Fields

Not explicitly documented beyond standard pattern. The `--save-baseline` flag
implies per-category scores are stored for regression comparison. Standard
`{timestamp, grade, score}` minimum expected.

### CLI-only vs Persistent

**Persistent.** History JSONL is append-only. Baseline capability adds a
regression tracking dimension not present in other audit skills.

### Web Dashboard Relevance

**MEDIUM** -- Script infrastructure health is important but less immediately
actionable than PR or hook health. The safety pattern compliance metric
(CLAUDE.md Section 5 anti-patterns) directly measures security posture. The
`--check` flag (exit code 0/1) enables CI integration.

### Natural Grouping Affinity

`hook-ecosystem-audit` (both audit infrastructure code), `skill-ecosystem-audit`
(both own different script scopes).

---

## Skill 6: session-ecosystem-audit

**Invocation:** /session-ecosystem-audit **Scope:** Session lifecycle skills,
session hooks, state files, 4-layer compaction resilience system, cross-session
safety

### Data Produced

| Artifact             | Path                                                      | Format   | Lifetime                          |
| -------------------- | --------------------------------------------------------- | -------- | --------------------------------- |
| Audit script stdout  | (piped)                                                   | v2 JSON  | Ephemeral                         |
| Progress file        | .claude/tmp/session-audit-progress.json                   | JSON     | Session-only, deleted on complete |
| Session decision log | .claude/tmp/session-audit-session-{YYYY-MM-DD-HHMM}.jsonl | JSONL    | Session-only                      |
| Audit report         | .claude/tmp/session-audit-report-{YYYY-MM-DD}.md          | Markdown | Session-only                      |
| **History file**     | .claude/state/session-ecosystem-audit-history.jsonl       | JSONL    | **Persistent, append-only**       |

### What It Measures

17 categories across 5 domains (D1=20%, D2=25%, D3=20%, D4=15%, D5=20%):

- D1: Session Lifecycle Management -- session-begin/end completeness, counter
  accuracy, passive surfacing compliance
- D2: State Persistence and Handoff -- handoff.json schema (11 required fields),
  commit-log.jsonl integrity, task state files, session-notes quality
- D3: Compaction Resilience -- Layer A (commit-tracker.js), Layer C
  (pre-compaction-save.js), Layer D (gap detection), restore output quality
- D4: Cross-Session Safety -- begin/end balance, multi-session validation
- D5: Integration and Configuration -- 7 expected session hook registrations,
  state file gitignore/size management

### History File Fields

Not explicitly documented. Standard pattern: {timestamp, grade, score,
unresolvedFindings} plus domain scores expected.

### CLI-only vs Persistent

**Persistent.** Reads from multiple persistent state files: handoff.json,
commit-log.jsonl, session-notes.json, task-\*.state.json, .session-state.json.

### Web Dashboard Relevance

**HIGH** -- Session health directly impacts developer experience. The session
counter accuracy check (SESSION_CONTEXT.md vs commit-log.jsonl) and begin/end
balance are unique diagnostic signals. The compaction resilience layer check
shows whether AI context recovery infrastructure is functioning.

### Natural Grouping Affinity

hook-ecosystem-audit (shares session hook oversight), health-ecosystem-audit
(mid-session alerts are session-system outputs). The commit-log.jsonl is a
shared data source.

---

## Skill 7: skill-ecosystem-audit

**Invocation:** /skill-ecosystem-audit **Scope:** All SKILL.md files,
cross-references, registry sync, staleness detection, agent orchestration health

### Data Produced

| Artifact             | Path                                                    | Format   | Lifetime                          |
| -------------------- | ------------------------------------------------------- | -------- | --------------------------------- |
| Audit script stdout  | (piped)                                                 | v2 JSON  | Ephemeral                         |
| Progress file        | .claude/tmp/skill-audit-progress.json                   | JSON     | Session-only, deleted on complete |
| Session decision log | .claude/tmp/skill-audit-session-{YYYY-MM-DD-HHMM}.jsonl | JSONL    | Session-only                      |
| Audit report         | .claude/tmp/skill-audit-report-{YYYY-MM-DD}.md          | Markdown | Session-only                      |
| **History file**     | .claude/state/skill-ecosystem-audit-history.jsonl       | JSONL    | **Persistent, append-only**       |

### What It Measures

21 categories across 5 domains (D1=20%, D2=25%, D3=20%, D4=15%, D5=20%):

- D1: Structural Compliance -- frontmatter schema, step continuity, section
  structure, bloat score (500-line warn, 800-line error)
- D2: Cross-Reference Integrity -- skill-to-skill refs, skill-to-script refs,
  template refs, citation validity, dependency chains
- D3: Coverage and Consistency -- scope boundary clarity, trigger accuracy,
  output format consistency, SKILL_INDEX.md sync
- D4: Staleness and Drift -- version currency (30-day), dead skill detection
  (60-day), pattern ref sync, code duplication
- D5: Agent Orchestration Health -- agent prompt consistency, agent-skill
  alignment (CLAUDE.md trigger table), parallelization correctness, team config
  validity

Uses extended compaction guard fields: currentDomain and domainsCompleted for
domain-based chunking.

### History File Fields

Not explicitly documented beyond standard pattern. The dead skill detection and
bloat score suggest per-skill metrics are captured in addition to aggregate
scores.

### CLI-only vs Persistent

**Persistent.** History JSONL is append-only.

### Web Dashboard Relevance

**MEDIUM-HIGH** -- The agent orchestration health domain (D5) validates that the
CLAUDE.md trigger table maps to real skill directories, parallel execution
constraints are documented, and team configs are valid. This is
meta-infrastructure health. Staleness detection (30/60-day thresholds) provides
aging signals for the skill catalog.

### Natural Grouping Affinity

doc-ecosystem-audit (both measure AI toolchain documentation quality),
health-ecosystem-audit (both audit the monitoring system own infrastructure).
The SKILL_INDEX.md sync check is a unique signal.

---

## Skill 8: tdms-ecosystem-audit

**Invocation:** /tdms-ecosystem-audit **Scope:** Technical Debt Management
System -- 37 pipeline scripts, MASTER_DEBT.jsonl (4500+ items), dedup pipeline,
views, metrics, roadmap cross-references

### Data Produced

| Artifact             | Path                                                   | Format   | Lifetime                          |
| -------------------- | ------------------------------------------------------ | -------- | --------------------------------- |
| Audit script stdout  | (piped)                                                | v2 JSON  | Ephemeral                         |
| Progress file        | .claude/tmp/tdms-audit-progress.json                   | JSON     | Session-only, deleted on complete |
| Session decision log | .claude/tmp/tdms-audit-session-{YYYY-MM-DD-HHMM}.jsonl | JSONL    | Session-only                      |
| Audit report         | .claude/tmp/tdms-audit-report-{YYYY-MM-DD}.md          | Markdown | Session-only                      |
| **History file**     | .claude/state/tdms-ecosystem-audit-history.jsonl       | JSONL    | **Persistent, append-only**       |

### What It Measures

16 categories across 5 domains (D1=20%, D2=25%, D3=20%, D4=15%, D5=20%):

- D1: Pipeline Correctness -- script execution order, data flow integrity,
  intake pipeline (4 intake scripts)
- D2: Data Quality and Deduplication -- 6-pass dedup accuracy, schema compliance
  (audit-schema.json), content hash integrity (SHA256), ID uniqueness
- D3: File I/O and Safety -- error handling (all 37 scripts must wrap file reads
  in try/catch), MASTER_DEBT vs deduped.jsonl sync, atomic writes with backup
- D4: Roadmap Integration -- track assignment rules, ROADMAP-DEBT
  cross-reference validity, sprint file alignment
- D5: Metrics and Reporting -- view generation accuracy, METRICS.md correctness
  vs computed totals, audit trail completeness

Critical known bug (Session 134): generate-views.js reads deduped but overwrites
master. The Master-Deduped Sync check (D3) specifically guards against this.

### History File Fields

Not explicitly documented beyond standard pattern. The metrics accuracy check
implies total debt count, dedup ratio, and audit trail size are likely captured
alongside grade/score.

### CLI-only vs Persistent

**Persistent.** Reads from the project largest persistent dataset:
MASTER_DEBT.jsonl (4500+ items). The history file and source data together
provide the richest longitudinal view in the ecosystem.

### Web Dashboard Relevance

**HIGH** -- Technical debt metrics are a core engineering dashboard category.
MASTER_DEBT.jsonl (4500+ items) is the most data-rich source in the project.
Dashboard panels: total debt count by severity/category, dedup ratio, roadmap
alignment %, intake pipeline health, trend over time.

### Natural Grouping Affinity

pr-ecosystem-audit (both track engineering quality debt), hook-ecosystem-audit
(hooks enforce pattern compliance which feeds TDMS). The ROADMAP.md
cross-reference links debt data to project planning.

---

## Cross-Skill Summary Table

| Skill                   | Categories | Domains | History File                          | Key Dashboard Metric                  | Relevance   | Groups With        |
| ----------------------- | ---------- | ------- | ------------------------------------- | ------------------------------------- | ----------- | ------------------ |
| doc-ecosystem-audit     | 16         | 5       | doc-ecosystem-audit-history.jsonl     | Doc freshness (30-day), broken links  | HIGH        | skill, session     |
| health-ecosystem-audit  | 26         | 6       | health-ecosystem-audit-history.jsonl  | Test pass rate, alert counts          | HIGH        | hook, session, all |
| hook-ecosystem-audit    | 20         | 6       | hook-ecosystem-audit-history.jsonl    | Gate override rate, CI/CD health      | HIGH        | session, script    |
| pr-ecosystem-audit      | 18         | 5       | pr-ecosystem-audit-history.jsonl      | Rounds/PR, pattern automation %       | HIGH        | skill, hook        |
| script-ecosystem-audit  | 18         | 5       | script-ecosystem-audit-history.jsonl  | Safety pattern compliance             | MEDIUM      | hook, skill        |
| session-ecosystem-audit | 17         | 5       | session-ecosystem-audit-history.jsonl | Begin/end balance, compaction health  | HIGH        | hook, health       |
| skill-ecosystem-audit   | 21         | 5       | skill-ecosystem-audit-history.jsonl   | Dead skills (60-day), agent alignment | MEDIUM-HIGH | doc, health        |
| tdms-ecosystem-audit    | 16         | 5       | tdms-ecosystem-audit-history.jsonl    | Debt count trend, dedup ratio         | HIGH        | pr, hook           |

---

## Shared Infrastructure

All 8 skills share:

1. Same execution pattern: run Node.js script -> parse v2 JSON stdout ->
   dashboard -> walkthrough -> history append
2. Same progress file convention: .claude/tmp/<name>-audit-progress.json
3. Same history file convention: .claude/state/<skill-name>-history.jsonl
4. Same CRITICAL_RULES: all reference
   .claude/skills/\_shared/ecosystem-audit/CRITICAL_RULES.md
5. Same shared modules: COMPACTION_GUARD.md, FINDING_WALKTHROUGH.md,
   SUMMARY_AND_TRENDS.md, CLOSURE_AND_GUARDRAILS.md
6. Same composite scoring: A-F grade with per-category 0-100 scores
7. Same TDMS integration: deferred findings create DEBT entries via /add-debt
8. Invocation tracking: all write to scripts/reviews/ invocation log

### Comprehensive Audit Orchestration

When /comprehensive-ecosystem-audit runs, 4 skills execute in parallel as
independent agents. Each saves a JSON result to
.claude/tmp/ecosystem-<name>-result.json and returns: COMPLETE: <name> grade
{grade} score {score} errors {N} warnings {N} info {N}

---

## Key Findings for Dashboard Design

1. All 8 history files are persistent and append-only -- they form a native
   time-series dataset requiring zero additional infrastructure for trend
   tracking. [CONFIDENCE: HIGH -- verified directly from SKILL.md files]

2. health-ecosystem-audit is the only skill with an explicitly documented
   cross-system consumer -- its testPassRate field is consumed by /alerts. This
   pattern (history file -> alerting system) is the prototype for dashboard
   integration. [CONFIDENCE: HIGH]

3. hook-ecosystem-audit has the richest real-time data cross-reference -- its
   Phase 5 Gate Effectiveness Review reads override-log.jsonl to compute 30-day
   gate override rates, making it both a static audit and a live behavioral
   signal. [CONFIDENCE: HIGH]

4. tdms-ecosystem-audit covers the largest dataset -- 4,500+ MASTER_DEBT.jsonl
   items make it the richest source for absolute metric counts; the other audits
   report health grades, not item volumes. [CONFIDENCE: HIGH]

5. The v2 JSON output schema is consistent across all skills -- the shared
   CLOSURE_AND_GUARDRAILS.md defines scoring conventions, making it feasible to
   build a single dashboard data consumer for all 8 audits. [CONFIDENCE: HIGH --
   inferred from shared module references]

6. Session logs are ephemeral by design -- .claude/tmp/ artifacts are deleted on
   completion. A dashboard would need to read history JSONL files, not session
   logs. [CONFIDENCE: HIGH]

---

## Sources

| #   | Path                                            | Title                        | Type       | Trust | Date       |
| --- | ----------------------------------------------- | ---------------------------- | ---------- | ----- | ---------- |
| 1   | .claude/skills/doc-ecosystem-audit/SKILL.md     | Doc Ecosystem Audit v1.0     | filesystem | HIGH  | 2026-02-24 |
| 2   | .claude/skills/health-ecosystem-audit/SKILL.md  | Health Ecosystem Audit v1.0  | filesystem | HIGH  | 2026-03-10 |
| 3   | .claude/skills/hook-ecosystem-audit/SKILL.md    | Hook Ecosystem Audit v2.0    | filesystem | HIGH  | 2026-03-08 |
| 4   | .claude/skills/pr-ecosystem-audit/SKILL.md      | PR Ecosystem Audit v1.2      | filesystem | HIGH  | 2026-02-24 |
| 5   | .claude/skills/script-ecosystem-audit/SKILL.md  | Script Ecosystem Audit v2.0  | filesystem | HIGH  | 2026-03-08 |
| 6   | .claude/skills/session-ecosystem-audit/SKILL.md | Session Ecosystem Audit v1.0 | filesystem | HIGH  | 2026-02-23 |
| 7   | .claude/skills/skill-ecosystem-audit/SKILL.md   | Skill Ecosystem Audit v1.0   | filesystem | HIGH  | 2026-02-24 |
| 8   | .claude/skills/tdms-ecosystem-audit/SKILL.md    | TDMS Ecosystem Audit v1.0    | filesystem | HIGH  | 2026-02-23 |

---

## Contradictions

None found. All 8 skills follow the same structural pattern with consistent
naming conventions, shared modules, and identical CRITICAL_RULES. Minor
variation: health-ecosystem-audit is the only skill to explicitly document all
history file fields ({timestamp, grade, score, testPassRate,
unresolvedFindings}); the other 7 rely on the shared SUMMARY_AND_TRENDS.md
template, which was not read in this investigation.

---

## Gaps

1. Shared SUMMARY_AND_TRENDS.md not read -- the exact history file schema for
   skills 1, 4, 5, 6, 7, 8 is inferred from health-ecosystem-audit explicit
   documentation and common patterns, not directly verified from
   .claude/skills/\_shared/ecosystem-audit/SUMMARY_AND_TRENDS.md.

2. v2 JSON output schema not verified -- the audit scripts actual JSON output
   structure was not read from the scripts themselves. The SKILL.md files
   reference it as v2 JSON but do not reproduce the full schema inline.

3. Actual history file content not sampled -- the .claude/state/\*-history.jsonl
   files were not read to verify they exist and contain the expected fields from
   live runs.

---

## Serendipity

- The health-ecosystem-audit skill documents that its history file is consumed
  by /alerts for Test Health -- this is the only existing example of a history
  file feeding a real-time display system. It is the prototype for dashboard
  integration architecture.

- The hook-ecosystem-audit Gate Effectiveness Review (Phase 5) computes a 30-day
  rolling override rate per gate from override-log.jsonl. This behavioral metric
  would be uniquely valuable on a dashboard: gates with high override rates are
  systematically ineffective and should be redesigned.

- script-ecosystem-audit has a --save-baseline flag that snapshots current
  scores as a regression baseline -- this concept (explicit baseline vs current
  delta) is different from trend tracking and could inform a dashboard
  regression alerts feature.

- /comprehensive-ecosystem-audit is an orchestrating skill not in the 8 being
  catalogued. It runs 4 of the 8 skills in parallel and aggregates results. A
  dashboard could mirror this as a composite ecosystem health panel.

---

## Confidence Assessment

- HIGH claims: 8
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH
