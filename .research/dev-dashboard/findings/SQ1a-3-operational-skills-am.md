# Findings: Catalog of Operational Skills A-M and Their Dashboard Data

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ1a-3

---

## Summary

Nine operational skills were cataloged by reading their SKILL.md files directly
from `.claude/skills/`. All produce persistent disk artifacts — none are
CLI-only in the "ephemeral" sense. Several share overlapping state consumers
(alerts-history, ecosystem-health-log, convergence state). The table below
groups them, and detailed per-skill sections follow.

---

## Quick-Reference Table

| Skill            | Primary Artifact(s)                                                      | Format          | Persistence                                   | Dashboard Relevance |
| ---------------- | ------------------------------------------------------------------------ | --------------- | --------------------------------------------- | ------------------- |
| alerts           | `alerts-history.jsonl`, `alert-suppressions.json`, session JSONL         | JSONL, JSON     | Persistent                                    | HIGH                |
| checkpoint       | `handoff.json`, `task-*.state.json`, SESSION_CONTEXT.md                  | JSON, MD        | Persistent (until cleared)                    | MEDIUM              |
| code-reviewer    | Invocation tracking (write-invocation.ts output), episodic memory        | JSONL, MCP      | Persistent                                    | MEDIUM              |
| convergence-loop | `convergence-loop-{topic}.state.json`, `convergence-report-{topic}.md`   | JSON, MD        | Persistent                                    | MEDIUM              |
| debt-runner      | `staging/*.jsonl`, `plans/resolution-YYYY-MM-DD.jsonl`, `plans/*.md`     | JSONL, MD       | Persistent                                    | HIGH                |
| deep-plan        | `DIAGNOSIS.md`, `DECISIONS.md`, `PLAN.md`, `deep-plan.<slug>.state.json` | MD, JSON        | Persistent                                    | MEDIUM              |
| deep-research    | `RESEARCH_OUTPUT.md`, `claims.jsonl`, `sources.jsonl`, `metadata.json`   | MD, JSONL, JSON | Persistent                                    | MEDIUM              |
| docs-maintain    | `DOCUMENTATION_INDEX.md`, sync-check stdout                              | MD, exit code   | Persistent (index), ephemeral (check results) | LOW                 |
| ecosystem-health | `ecosystem-health-log.jsonl`, `warnings.jsonl`, triage state JSON        | JSONL, JSON     | Persistent                                    | HIGH                |

---

## Skill A: alerts

### Data Produced

| File          | Path                                                | Format | What It Measures                           |
| ------------- | --------------------------------------------------- | ------ | ------------------------------------------ |
| Session log   | `.claude/tmp/alert-session-{YYYY-MM-DD-HHMM}.jsonl` | JSONL  | Per-alert decisions + actions in this run  |
| Suppressions  | `.claude/state/alert-suppressions.json`             | JSON   | Suppressed alerts with reasons + expiry    |
| History       | `.claude/state/alerts-history.jsonl`                | JSONL  | Cross-session health trends, learnings     |
| Baseline      | `.claude/state/alerts-baseline.json`                | JSON   | First-run baseline for delta computation   |
| Health score  | `.claude/state/health-score-log.jsonl`              | JSONL  | Historical grades (A/B/C/D/F) + timestamps |
| Hook warnings | `.claude/hook-warnings.json`                        | JSON   | Active hook-generated warnings             |
| Ack state     | `.claude/state/hook-warnings-ack.json`              | JSON   | What warnings have been acknowledged       |
| Override log  | `.claude/state/override-log.jsonl`                  | JSONL  | Hook override events                       |

**Alert Object Schema:**

```json
{
  "severity": "error|warning|info",
  "message": "...",
  "details": "...|null",
  "action": "...|null"
}
```

### What It Represents

A rolling health dashboard for the project codebase. Tracks 18 categories
(limited mode) or 42 categories (full mode), scores 100 - (30/error +
10/warning), grades A-F, and records trend direction across sessions.

### CLI-Only vs Persistent

**Persistent.** Session logs go to `.claude/tmp/` (transient within session),
but `alerts-history.jsonl`, `health-score-log.jsonl`, and suppressions survive
across sessions. History is read at warm-up for trend computation.

### Web Dashboard Relevance: HIGH

Direct mapping to a health score panel, trend sparklines, and active-warning
count badges. The JSONL history is machine-readable with grades, timestamps, and
category breakdowns — ideal for time-series visualization. The suppression count
and suppression-rate warning (>50% = WARNING) are useful operational metrics.

### Natural Grouping Affinity

- **ecosystem-health** (sister skill, deeper version of the same health concept)
- **code-reviewer** (alerts feed into code quality trends)
- **debt-runner** (debt health is one of the 42 alert categories)

---

## Skill B: checkpoint

### Data Produced

| File            | Path                                        | Format     | What It Measures                              |
| --------------- | ------------------------------------------- | ---------- | --------------------------------------------- |
| Handoff         | `.claude/state/handoff.json`                | JSON       | Current git state, task, pending steps        |
| Task state      | `.claude/state/task-{name}.state.json`      | JSON       | Per-task progress for multi-step work         |
| Session context | `SESSION_CONTEXT.md` (Quick Recovery block) | Markdown   | Human-readable last-checkpoint summary        |
| MCP memory      | MCP memory (optional, `--mcp` flag)         | MCP entity | Cross-session identity for entities/decisions |

**handoff.json schema:**

```json
{
  "timestamp": "ISO",
  "git": { "branch": "...", "lastCommit": "...", "uncommittedFiles": [] },
  "currentTask": "...",
  "completedSteps": [],
  "pendingSteps": [],
  "notes": "..."
}
```

### What It Represents

Point-in-time snapshot of session state. Designed for recovery after compaction
or crash, not for long-term analytics. Tells you what was in progress, what
branch, and what steps remain.

### CLI-Only vs Persistent

**Persistent until overwritten.** `handoff.json` is overwritten on each
`/checkpoint` invocation; it reflects only the most recent checkpoint. Task
state files (`task-{name}.state.json`) persist until manually cleaned. MCP
variant is cross-session but stored externally.

### Web Dashboard Relevance: MEDIUM

The `handoff.json` shows current work-in-progress: branch, task name, pending
steps. Useful for a "current session" widget but stale once a new session starts
without checkpointing. Not a historical log — just a current-state snapshot. MCP
entity tracking could expose cross-session continuity if the MCP memory is
queryable.

### Natural Grouping Affinity

- **deep-plan** (generates the task steps that checkpoint tracks progress on)
- **deep-research** (another long-running skill with compaction-resilience
  state)
- **convergence-loop** (all three have `*.state.json` files for resumability)

---

## Skill C: code-reviewer

### Data Produced

| File / Sink           | Path                                                 | Format           | What It Measures                         |
| --------------------- | ---------------------------------------------------- | ---------------- | ---------------------------------------- |
| Invocation tracking   | Via `scripts/reviews/write-invocation.ts`            | JSONL (appended) | When reviews ran, topic, decisions count |
| Pattern check results | `npm run patterns:check` stdout                      | CLI output       | Anti-pattern violation count per file    |
| Episodic memory       | MCP memory (pre-review search)                       | MCP entities     | Prior review decisions and patterns      |
| Review feedback       | In-conversation only (unless PR review writes state) | Ephemeral        | Critical/Important/Minor findings        |

**Note:** The SKILL.md does not specify a standalone output artifact for
code-reviewer findings (unlike deep-plan which writes DECISIONS.md). Findings
are presented conversationally. The invocation JSONL via `write-invocation.ts`
is the durable signal.

### What It Represents

Code quality gate enforcement. Tracks whether anti-patterns were caught before
commit, whether the review ran. Does not persist granular per-finding data to
disk by default — that lives in PR review tooling (CodeRabbit, SonarCloud).

### CLI-Only vs Persistent

**Mostly ephemeral.** Review findings are conversational. Only the invocation
timestamp/metadata via `write-invocation.ts` and the MCP episodic memory
persist. Pattern check (`npm run patterns:check`) writes nothing to disk —
stdout only.

### Web Dashboard Relevance: MEDIUM

If invocation JSONL captures
`{ skill, success, context: { topic, decisions } }`, it enables: review
frequency trend, post-task review compliance rate, and patterns:check pass/fail
history. The limiting factor is that finding-level data is not persisted — you
can show "reviewed N times this week" but not "found X critical issues."

### Natural Grouping Affinity

- **alerts** (code quality is one of the 42 alert categories)
- **ecosystem-health** (code health is a scored dimension)
- **debt-runner** (code issues that fail review may feed into TDMS)

---

## Skill D: convergence-loop

### Data Produced

| File               | Path                                                | Format   | What It Measures                                 |
| ------------------ | --------------------------------------------------- | -------- | ------------------------------------------------ |
| State file         | `.claude/state/convergence-loop-{topic}.state.json` | JSON     | Pass history, tally, agent outputs, claim status |
| Convergence report | `.claude/state/convergence-report-{topic}.md`       | Markdown | Summary table + claims delta + confidence        |

**State schema (partial):**

```json
{
  "topic": "...",
  "preset": "standard|quick|thorough|research-claims",
  "passes": [{ "behavior": "...", "tally": { "confirmed": N, "corrected": N, "extended": N, "new": N }, "corrections": [] }],
  "graduatedClaims": [],
  "unconvergedClaims": [],
  "confidence": "HIGH|MEDIUM|LOW"
}
```

**T20 Tally per pass:** Confirmed / Corrected / Extended / New

### What It Represents

Verification quality signal — how many claims were wrong, partially wrong, or
genuinely unknown on each pass. The tally series shows whether
research/diagnosis is converging toward truth or staying noisy.

### CLI-Only vs Persistent

**Persistent.** State files survive compaction by design. Convergence reports
are written for long-running/high-stakes loops. The state file is per-topic, and
multiple topic state files can coexist.

### Web Dashboard Relevance: MEDIUM

The T20 tally history is a data quality indicator: if corrections-per-pass is
consistently high across topics, that signals systematic over-confidence in
initial claims. Useful as a "research accuracy" trend chart. Not high-priority
standalone, but valuable as a component in a "research quality" panel alongside
deep-research.

### Natural Grouping Affinity

- **deep-research** (mandatory consumer — all deep-research runs use CL for
  verification)
- **deep-plan** (mandatory for L/XL plans in Phase 0 and 3.5)
- **debt-runner** (every debt-runner mode runs CL verification)

---

## Skill E: debt-runner

### Data Produced

| File                     | Path                                                    | Format                | What It Measures                        |
| ------------------------ | ------------------------------------------------------- | --------------------- | --------------------------------------- |
| Staging corrections      | `docs/technical-debt/staging/verify-corrections.jsonl`  | JSONL                 | Debt items identified as stale/resolved |
| Staging dedup merges     | `docs/technical-debt/staging/dedup-merges.jsonl`        | JSONL                 | Candidate duplicate items for merge     |
| Staging sync corrections | `docs/technical-debt/staging/sync-corrections.jsonl`    | JSONL                 | SonarCloud sync adjustments             |
| Staging validate fixes   | `docs/technical-debt/staging/validate-fixes.jsonl`      | JSONL                 | Schema violation fixes                  |
| Resolution plan JSONL    | `docs/technical-debt/plans/resolution-YYYY-MM-DD.jsonl` | JSONL                 | Prioritized S0/S1 resolution order      |
| Resolution plan MD       | `docs/technical-debt/plans/resolution-YYYY-MM-DD.md`    | Markdown              | Human-readable plan view                |
| Runner state             | `.claude/state/debt-runner.state.json`                  | JSON                  | Mode progress, incomplete step tracking |
| Debt metrics             | `node scripts/debt/generate-metrics.js` output          | stdout + metrics file | S0-S3 counts, trends, stale counts      |

**MASTER_DEBT.jsonl** (owned by TDMS, not debt-runner): the canonical debt
registry. Debt-runner reads it and mutates it only via existing scripts, never
direct write.

### What It Represents

The full TDMS orchestration layer. Tracks what technical debt exists (by
severity S0-S3), what's been verified against code, what's been planned for
resolution, and what the trend is. The `generate-metrics.js` output is the
primary analytics artifact.

### CLI-Only vs Persistent

**Persistent.** Staging files are written to disk and survive compaction. Plans
are dated artifacts. The runner state file tracks incomplete modes. The
MASTER_DEBT.jsonl and views are long-lived canonical files.

### Web Dashboard Relevance: HIGH

S0-S3 severity breakdown, total debt count, stale-item count (>90 days),
resolution-plan existence, and sync date are all first-class dashboard widgets.
Debt trends over time (requires MASTER_DEBT or metrics history) enable burn-down
chart visualization. Staging file count indicates in-progress debt work.

### Natural Grouping Affinity

- **alerts** (debt-health is an alert category)
- **ecosystem-health** (debt-aging is a scored dimension)
- **code-reviewer** (code review issues may feed into TDMS intake)

---

## Skill F: deep-plan

### Data Produced

| File                | Path                                              | Format   | What It Measures                                          |
| ------------------- | ------------------------------------------------- | -------- | --------------------------------------------------------- |
| Diagnosis           | `.planning/<topic-slug>/DIAGNOSIS.md`             | Markdown | Codebase state analysis, reframe check, ROADMAP alignment |
| Decisions           | `.planning/<topic-slug>/DECISIONS.md`             | Markdown | Numbered decision record with rationale                   |
| Plan                | `.planning/<topic-slug>/PLAN.md`                  | Markdown | Step-by-step implementation with done-when criteria       |
| State file          | `.claude/state/deep-plan.<topic-slug>.state.json` | JSON     | Batch history, decisions captured, current phase          |
| Invocation tracking | Via `scripts/reviews/write-invocation.ts`         | JSONL    | Skill invocations: topic, decisions count, success        |

**State schema (partial):**

```json
{
  "task": "...",
  "batchNumber": N,
  "decisionsCount": N,
  "currentPhase": "discovery|decisions|plan|approval",
  "timestamp": "...",
  "process_feedback": "..."
}
```

### What It Represents

Planning activity and decision-making quality. The decisions count, number of
plan steps, and whether a plan was approved (vs abandoned) are the key signals.
The `.planning/` artifact tree is durable documentation of how a feature was
designed.

### CLI-Only vs Persistent

**Persistent.** All three artifacts (DIAGNOSIS.md, DECISIONS.md, PLAN.md) are
written to disk. State file survives compaction. Invocation JSONL is appended.
The `.planning/` tree is not gitignored by default (unlike `.research/`), so
plans may persist in the repo.

### Web Dashboard Relevance: MEDIUM

Active plans (state files that haven't reached "approved + routed") are
meaningful "work in progress" signals. The invocation JSONL enables: plan
frequency, average decisions per plan, topic taxonomy. The full plan content is
too verbose for a dashboard widget, but counts and status are useful. Low
urgency unless tracking planning activity specifically.

### Natural Grouping Affinity

- **deep-research** (research precedes planning; research-plan-team links the
  two)
- **convergence-loop** (mandatory for L/XL plans)
- **checkpoint** (both produce state files for session recovery)

---

## Skill G: deep-research

### Data Produced

| File                           | Path                                            | Format   | What It Measures                                      |
| ------------------------------ | ----------------------------------------------- | -------- | ----------------------------------------------------- |
| Research output                | `.research/<topic-slug>/RESEARCH_OUTPUT.md`     | Markdown | Synthesized findings with citations                   |
| Claims                         | `.research/<topic-slug>/claims.jsonl`           | JSONL    | Machine-parseable claims with confidence levels       |
| Sources                        | `.research/<topic-slug>/sources.jsonl`          | JSONL    | Source registry with trust tier and CRAAP scores      |
| Metadata                       | `.research/<topic-slug>/metadata.json`          | JSON     | Topic, depth, agent count, timestamps, consumer hints |
| State file                     | `.claude/state/deep-research.<slug>.state.json` | JSON     | Phase progress, wave status, sub-question tracking    |
| Research index                 | `.research/research-index.jsonl`                | JSONL    | Cross-session topic index for recall/search           |
| Findings (intermediate)        | `.research/<topic-slug>/findings/`              | MD files | Per-agent findings (gitignored)                       |
| Challenge files (intermediate) | `.research/<topic-slug>/challenges/`            | MD files | Contrarian + OTB outputs (gitignored)                 |

**claims.jsonl entry schema:**

```json
{
  "claim": "...",
  "confidence": "HIGH|MEDIUM|LOW|UNVERIFIED",
  "sources": [],
  "sub_question_id": "..."
}
```

**metadata.json schema includes:** `topic`, `depth`, `agent_count`,
`phases_complete`, `consumer_hints` (adapters for deep-plan, skill-creator,
GSD).

### What It Represents

Research provenance and quality tracking. The claims JSONL enables confidence
distribution analysis (how many HIGH vs LOW claims). The research index enables
recall and topic deduplication. Sources JSONL tracks which external sources were
used and their trust tiers.

### CLI-Only vs Persistent

**Persistent (selectively).** Conclusion artifacts (RESEARCH_OUTPUT.md,
claims.jsonl, sources.jsonl, metadata.json) are retained. Intermediate artifacts
(findings/, challenges/) are gitignored but survive within the session
directory. State file survives compaction.

### Web Dashboard Relevance: MEDIUM

The research index (`research-index.jsonl`) is the most dashboard-relevant
artifact — it's a compact registry of all research topics, dates, and depths.
Claims confidence distribution (HIGH/MEDIUM/LOW breakdown per research session)
is a "research quality" metric. Not high-urgency compared to health or debt
signals.

### Natural Grouping Affinity

- **deep-plan** (natural pipeline: research → plan)
- **convergence-loop** (mandatory Phase 2.5/3 verification consumer)
- **checkpoint** (all three are long-running skills with compaction-resilient
  state)

---

## Skill H: docs-maintain

### Data Produced

| File                | Path                             | Format                  | What It Measures                                          |
| ------------------- | -------------------------------- | ----------------------- | --------------------------------------------------------- |
| Documentation index | `DOCUMENTATION_INDEX.md`         | Markdown                | Auto-generated index of all docs                          |
| Sync check output   | `npm run docs:sync-check` stdout | CLI stdout (exit 0/1/2) | Template-instance sync health, broken links, placeholders |
| Dependencies map    | `docs/DOCUMENT_DEPENDENCIES.md`  | Markdown                | Cross-doc trigger relationships                           |

**No JSONL or structured state file.** The sync check result is stdout only (no
persistence). The doc index is the only persistent generated artifact.

### What It Represents

Documentation hygiene — whether template-derived docs are in sync, whether links
are broken, whether placeholder content remains (`[TODO]`, `[e.g., ...]`). The
sync check exit code (0/1/2) is the primary signal.

### CLI-Only vs Persistent

**Mixed.** `DOCUMENTATION_INDEX.md` is a persistent generated file, regenerated
on demand. Sync check results are ephemeral (stdout, no log file). There is no
history — you cannot trend "docs were 3/10 in sync last week, now 8/10."

### Web Dashboard Relevance: LOW

No structured machine-readable output for the most interesting metric (sync
health). The doc index file count could be extracted, but that's a vanity
metric. The most useful thing would be persisting sync-check results to a JSONL
(which doesn't currently exist). Without that, there's nothing to render beyond
"run the check now" as a trigger.

### Natural Grouping Affinity

- **ecosystem-health** (documentation health is one of the 8 scored dimensions)
- **alerts** (doc sync check is one of the 42 full-mode alert categories)
- **code-reviewer** (both serve as quality gate checks before committing)

---

## Skill I: ecosystem-health

### Data Produced

| File                 | Path                                                    | Format | What It Measures                                 |
| -------------------- | ------------------------------------------------------- | ------ | ------------------------------------------------ |
| Health log           | `data/ecosystem-v2/ecosystem-health-log.jsonl`          | JSONL  | Per-run composite scores + per-dimension grades  |
| Active warnings      | `data/ecosystem-v2/warnings.jsonl`                      | JSONL  | Active warning lifecycle events                  |
| Triage state         | `.claude/state/task-ecosystem-health-triage.state.json` | JSON   | Per-session dimension decisions (fix/defer/skip) |
| Enforcement manifest | `data/ecosystem-v2/enforcement-manifest.jsonl`          | JSONL  | Pattern enforcement events                       |
| Invocations          | `data/ecosystem-v2/invocations.jsonl`                   | JSONL  | Run history with timestamps                      |
| Test registry        | `data/ecosystem-v2/test-registry.jsonl`                 | JSONL  | Test health tracking                             |

**ecosystem-health-log.jsonl entry schema (inferred from SKILL.md):**

- Composite score (0-100), letter grade (A-F)
- Per-dimension scores (8 dimensions, 13 sub-dimensions, 64 metrics total)
- Timestamp
- Run mode (full/quick)

**8 weighted categories** (from REFERENCE.md references): includes code health,
test health, documentation health, debt-aging, security, CI/CD, pattern
enforcement, and learning effectiveness.

### What It Represents

The most comprehensive health signal in the system. 64 metrics across 8 weighted
categories, with letter grades and composite score. The JSONL history enables
trend computation across sessions. This is the source of truth for project-wide
health, consumed by `/alerts` for trend data and by `/session-end` for session
summaries.

### CLI-Only vs Persistent

**Persistent.** The health log is specifically designed for historical trend
tracking — the skill explicitly warns against re-running within 30 minutes to
avoid "trend pollution." The triage state persists per session. Invocations log
is an audit trail.

### Web Dashboard Relevance: HIGH

This is the primary candidate for a health score widget. Time-series of
composite scores, per-dimension grade breakdown, active warning count, and trend
direction (derived from last 5 runs) are all dashboard-native. The JSONL
structure is clean and well-defined. The `data/ecosystem-v2/` prefix suggests
intentional separation of machine-readable data from ephemeral state.

### Natural Grouping Affinity

- **alerts** (direct consumer relationship; `/alerts` reads health trend data)
- **debt-runner** (debt-aging is a scored dimension; shares MASTER_DEBT as
  input)
- **docs-maintain** (documentation health is a scored dimension)
- **code-reviewer** (code health is a scored dimension)

---

## Cross-Skill Analysis

### Shared State Files / Consumers

| State File                      | Writer                 | Reader(s)                                                          |
| ------------------------------- | ---------------------- | ------------------------------------------------------------------ |
| `alerts-history.jsonl`          | `/alerts`              | `/alerts` (warm-up), `/session-end`                                |
| `ecosystem-health-log.jsonl`    | `/ecosystem-health`    | `/alerts` (trend), `/session-end`, `/health-ecosystem-audit`       |
| `health-score-log.jsonl`        | `/alerts`              | `/alerts` (REFERENCE.md mentions this as a display source)         |
| `warnings.jsonl`                | `warning-lifecycle.js` | `/ecosystem-health`                                                |
| `convergence-loop-*.state.json` | `/convergence-loop`    | `/debt-runner`, `/deep-plan`, `/deep-research`                     |
| `research-index.jsonl`          | `/deep-research`       | `/deep-research` (--recall), `/deep-plan` (Phase 0 research check) |

### Natural Dashboard Groupings

**Group 1: Health & Quality (Primary Panel)**

- ecosystem-health (`ecosystem-health-log.jsonl` → composite score + trend)
- alerts (`alerts-history.jsonl` → active warning count, grade trend)
- debt-runner (MASTER_DEBT counts by severity, stale count)

**Group 2: Research & Planning (Activity Feed)**

- deep-research (`research-index.jsonl` → recent topics, confidence
  distribution)
- deep-plan (state files → active plans, decisions count)
- convergence-loop (T20 tallies → claim correction rates as quality signal)

**Group 3: Session Activity (Context Panel)**

- checkpoint (`handoff.json` → current branch, task, pending steps)
- code-reviewer (invocation JSONL → review frequency, post-task compliance)
- docs-maintain (DOCUMENTATION_INDEX.md → doc count; sync check trigger)

---

## Confidence Assessment

- HIGH claims: 6 (artifact paths and formats verified against SKILL.md source
  text)
- MEDIUM claims: 8 (schema structures inferred from SKILL.md examples;
  REFERENCE.md partially read)
- LOW claims: 2 (dashboard schema for ecosystem-health dimensions;
  write-invocation.ts exact output format)
- UNVERIFIED claims: 0

**Overall confidence: HIGH** — all data sourced from authoritative SKILL.md
files read directly from filesystem.

---

## Gaps

1. **docs-maintain sync-check persistence**: No structured output file exists.
   If the dashboard needs sync history, a new output artifact would need to be
   created.
2. **code-reviewer per-finding persistence**: Finding-level data
   (critical/important/minor counts) is not persisted to disk by default. The
   invocation JSONL via `write-invocation.ts` captures invocation metadata but
   not findings content.
3. **convergence-loop report condition**: The convergence report is written "for
   long-running or high-stakes loops" (SHOULD, not MUST). May not exist for all
   CL runs, making it unreliable as a dashboard data source unless always
   written.
4. **ecosystem-health 8 dimension names**: The exact names of all 8 weighted
   categories were not confirmed from SKILL.md — REFERENCE.md would need to be
   read for the full list.
5. **deep-plan `.planning/` gitignore status**: SKILL.md says plans are written
   to `.planning/<topic-slug>/` but does not specify whether this is gitignored.
   The research directory is explicitly gitignored (intermediate files) — plan
   artifacts may not be.

## Serendipity

- The `data/ecosystem-v2/` directory naming convention (vs `.claude/state/`)
  appears intentional — it separates long-lived analytics data from
  session-scoped operational state. This distinction is significant for
  dashboard architecture: `data/ecosystem-v2/*.jsonl` files are analytics-grade;
  `.claude/state/*.json` files are operational-grade.
- The `/alerts` and `/ecosystem-health` skills have an explicit "don't use X
  when Y is better" routing contract baked into their SKILL.md files — they are
  designed as a two-tier health system (quick 15s check vs 10-15min full
  dashboard). A web dashboard could mirror this tiering.
- `deep-research` explicitly gitignores intermediate artifacts (findings/,
  challenges/) but retains conclusion artifacts — suggesting the authors
  anticipated the need to share/reference research output without cluttering git
  history with agent work product.
