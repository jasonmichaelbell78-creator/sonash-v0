# Findings: Catalog 9 Operational Skills (N-Z) — Data & Output for Web Dashboard

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question:** Catalog 9 operational skills (N–Z) and what data/output they
produce that could surface on a web dashboard.

---

## Overview

All 9 skills were read directly from their SKILL.md files in `.claude/skills/`.
Each skill was analyzed for: output artifacts, formats, persistence, and
dashboard utility.

---

## Skill Catalog

### 1. pr-review

**Purpose:** Process external PR code review feedback (CodeRabbit, Qodo,
SonarCloud, Gemini) through an 8-step protocol.

#### Data Produced

| File / Output                                                | Format                     | What It Measures                                                                                           |
| ------------------------------------------------------------ | -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `.claude/state/task-pr-review-{pr}-r{round}.state.json`      | JSON                       | Per-round counts: total items, fixed, deferred, rejected; severity breakdown (C/M/m/T); status; commit SHA |
| `.claude/state/reviews.jsonl` (via `write-review-record.js`) | JSONL                      | Canonical review record: PR number, round, source, totals, timestamps                                      |
| `docs/AI_REVIEW_LEARNINGS_LOG.md`                            | Markdown                   | Human-readable learning log entry per review (deprecated bridge format)                                    |
| TDMS DEBT items (via `/add-debt`)                            | JSONL in MASTER_DEBT.jsonl | Deferred items from review rounds                                                                          |

**State file schema (key fields):**

```json
{
  "pr": 432,
  "round": 3,
  "review_number": 476,
  "source": "mixed",
  "total": 7,
  "fixed": 6,
  "deferred": 0,
  "rejected": 1,
  "severity": { "critical": 0, "major": 2, "minor": 3, "trivial": 2 },
  "status": "complete",
  "commit_sha": "32d52dcf",
  "completed_at": "ISO8601"
}
```

**CLI-only vs persistent:** Fully persistent. State files survive sessions and
are explicitly designed for cross-round and cross-session recovery.

**Web dashboard relevance:** HIGH Review cycle data (rounds, fix rates, severity
trends, rejection patterns) is exactly the kind of structured historical data a
dashboard can visualize — per-PR timelines, aggregated fix rates, rejection
source breakdown.

**Natural grouping affinity:** pr-retro (consumes this data), sonarcloud (a
source of review items), session-end (compiles review sync at closure).

---

### 2. pr-retro

**Purpose:** PR Review Retrospective — analyzes completed PR review cycles for
patterns, recurring issues, and process health.

#### Data Produced

| File / Output                            | Format    | What It Measures                                                                                     |
| ---------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| `.claude/state/retros.jsonl`             | JSONL     | Retro records: PR#, findings, action items with `status` + `verify_cmd`, process feedback, learnings |
| `.claude/state/task-pr-retro.state.json` | JSON      | Compaction state: current finding index, decisions, pause/resume pointer                             |
| `docs/AI_REVIEW_LEARNINGS_LOG.md`        | Markdown  | Appended retro section (bridge format)                                                               |
| Learnings in JSONL                       | JSONL     | 2-3 auto-generated insights per retro, saved to `learnings` field                                    |
| Suppression additions                    | TOML / MD | `.gemini/styleguide.md` + `.qodo/pr-agent.toml` updated for repeat false-positives                   |

**Key retros.jsonl fields:** PR#, findings (N), action items (with
`status: complete|deferred`, `verify_cmd`), recurrence map, cross-PR patterns.

**CLI-only vs persistent:** Fully persistent. `retros.jsonl` is the
cross-session source of truth for retro history and action item tracking. Used
by `pr-review` Step 1 for backward-flow pattern detection.

**Web dashboard relevance:** HIGH Action item completion rates, recurring
pattern frequency, cross-PR churn analysis, and retro-to-retro trend data are
natural dashboard widgets. The `verify_cmd` execution pass/fail status is a
particularly useful health signal.

**Natural grouping affinity:** pr-review (data source), session-begin (reads
last 3 entries), session-end (referenced in review sync).

---

### 3. pre-commit-fixer

**Purpose:** Diagnose and fix pre-commit hook failures — classify → fix → report
→ confirm workflow.

#### Data Produced

| File / Output                             | Format     | What It Measures                                                                          |
| ----------------------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| `.claude/tmp/pre-commit-fixer-state.json` | JSON       | Categories attempted, fixes applied, attempt count — ephemeral during run                 |
| `hook-runs.jsonl` (append at session-end) | JSONL      | Fix summary: categories fixed, errors resolved, deferred items — persistent after session |
| `.git/hook-output.log`                    | Plain text | Raw pre-commit error output (read-only input, written by hook)                            |

**Note on persistence:** The state file (`.claude/tmp/`) is session-scoped and
cleaned up. The durable data is the session-end append to `hook-runs.jsonl`. The
skill reads `hook-checks.json` as canonical checklist but does not write it.

**CLI-only vs persistent:** Partially persistent. Ephemeral during run; durable
via `hook-runs.jsonl` after session close.

**Web dashboard relevance:** MEDIUM Pre-commit failure category frequency
(ESLint vs pattern compliance vs doc headers) over time is a useful quality
hygiene signal. However, the data only becomes available after session-end
appends it — there is no real-time stream. Dashboard utility is retrospective.

**Natural grouping affinity:** session-end (appends hook data), session-begin
(reads hook anomaly data), alerts (consumes hook warning trends).

---

### 4. session-begin

**Purpose:** Pre-flight checklist — loads context, runs 9 health scripts,
surfaces warnings, gates on acknowledgment before work begins.

#### Data Produced

| File / Output                               | Format   | What It Measures                                                                          |
| ------------------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| `SESSION_CONTEXT.md`                        | Markdown | Read (not written) — current status, goals, branch                                        |
| `.claude/hook-warnings.json`                | JSON     | Hook warnings with `lastCleared` timestamp — read and acknowledged                        |
| `.claude/state/session-start-failures.json` | JSON     | Build/script failures from SessionStart hook                                              |
| `.claude/state/health-score-log.jsonl`      | JSONL    | Read for grade-drop detection (2+ level drop triggers warning)                            |
| `.claude/state/hook-warnings-log.jsonl`     | JSONL    | Read for 10+ warnings in 7-day window                                                     |
| `.claude/override-log.jsonl`                | JSONL    | Read for 50%+ override trend spike                                                        |
| Script health results (9 scripts)           | Console  | Patterns, review sync, lessons, session gaps, roadmap hygiene — not written by this skill |

**CLI-only vs persistent:** Primarily a reader/consumer of persistent state. The
session counter increment and warning acknowledgment timestamp update are the
only writes. Does not produce net-new data streams.

**Web dashboard relevance:** MEDIUM Session-begin orchestrates the health check
surface, but the dashboard-relevant data lives in the files it reads
(hook-warnings-log, health-score-log, override-log). The skill itself is a
gating ceremony rather than a data producer.

**Natural grouping affinity:** session-end (writes what session-begin reads),
alerts (drill-down from session-begin warnings), hooks infrastructure.

---

### 5. session-end

**Purpose:** Session closure pipeline — context preservation, compliance review,
metrics capture, and final commit.

#### Data Produced

| File / Output                                                                    | Format   | What It Measures                                                   |
| -------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------ |
| `SESSION_CONTEXT.md`                                                             | Markdown | Updated session summary, status table, next goals (human-readable) |
| `docs/SESSION_HISTORY.md`                                                        | Markdown | Archived session summaries (rolling)                               |
| `ROADMAP.md`                                                                     | Markdown | Checkbox completion status updated                                 |
| `.claude/state/velocity-log.jsonl`                                               | JSONL    | Velocity metrics per session — roadmap item progress               |
| `.claude/state/reviews.jsonl`                                                    | JSONL    | Review sync output (bridge script)                                 |
| `.claude/skills/ecosystem-health/scripts/` output → `ecosystem-health-log.jsonl` | JSONL    | Health score snapshot per session close                            |
| `docs/technical-debt/MASTER_DEBT.jsonl`                                          | JSONL    | Consolidated TDMS debt (all sources merged)                        |
| `docs/technical-debt/metrics.json`                                               | JSON     | Machine-readable TDMS metrics: counts by severity/status           |
| `docs/technical-debt/METRICS.md`                                                 | Markdown | Human-readable TDMS metrics                                        |
| `.claude/state/commit-log.jsonl`                                                 | JSONL    | Read for commit pattern analytics (avg files/commit)               |
| `.claude/state/agent-invocations.jsonl`                                          | JSONL    | Read for agent activity summary (not written here)                 |
| `.planning/.../decisions.jsonl`                                                  | JSONL    | Read for planning data summary                                     |

**Artifact manifest (as declared in SKILL.md):** SESSION_CONTEXT.md,
SESSION_HISTORY.md, ROADMAP.md, velocity-log.jsonl, reviews.jsonl,
ecosystem-health-log.jsonl, MASTER_DEBT.jsonl, metrics.json, METRICS.md.

**CLI-only vs persistent:** Fully persistent. Session-end is the primary
data-writing event for the entire session metrics pipeline. All JSONL outputs
are append-based and survive sessions.

**Web dashboard relevance:** HIGH Session-end produces the richest set of
dashboard-ready data: velocity trends (velocity-log.jsonl), health score trends
(ecosystem-health-log.jsonl), TDMS debt metrics (metrics.json), and review sync
state (reviews.jsonl). This is the most dashboard-relevant skill in the N-Z
group.

**Natural grouping affinity:** session-begin (consumes its output), pr-review
(reviews.jsonl bridge), sonarcloud (feeds MASTER_DEBT.jsonl), pr-retro
(retros.jsonl sourced separately but surfaced here).

---

### 6. skill-audit

**Purpose:** Interactive behavioral quality audit for individual skills — 11
categories, produces decision record and updated skill files.

#### Data Produced

| File / Output                                            | Format                | What It Measures                                                                                                                  |
| -------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/state/task-skill-audit-{skill-name}.state.json` | JSON                  | Audit decision record: categories, scores, decisions (accepted/rejected), overall score before/after, learnings, process feedback |
| Updated `SKILL.md` + companion files                     | Markdown              | Behavioral improvements applied                                                                                                   |
| Invocation record via `write-invocation.js`              | JSONL (reviews.jsonl) | Tracks that skill-audit was run on target, with context: `{target, decisions, score}`                                             |

**State file fields:** skill name, category scores (11 categories), decisions
list with confidence and delegated-accept flags, overall score N/100,
repeat-audit delta if applicable, learnings array, process_feedback.

**CLI-only vs persistent:** Persistent via state file (retained after completion
as decision record). Score history enables repeat-audit trend analysis.

**Web dashboard relevance:** MEDIUM Per-skill quality scores over time (score
trend per skill, recurring gap categories, decisions-per-audit volume) could
power a "skill health" dashboard panel. Limited scope compared to session-level
metrics — relevant only when audits are run, not on every session.

**Natural grouping affinity:** skill-creator (paired workflow),
skill-ecosystem-audit (aggregate view), invocation tracking in reviews.jsonl.

---

### 7. sonarcloud

**Purpose:** Unified SonarCloud integration — fetch, sync, report, and resolve
code quality issues against TDMS.

#### Data Produced

| File / Output                                   | Format   | What It Measures                                                                         |
| ----------------------------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `docs/technical-debt/MASTER_DEBT.jsonl`         | JSONL    | New issues appended with DEBT-XXXX IDs, source_id, severity (S0-S3), category, sonar_key |
| `docs/technical-debt/raw/deduped.jsonl`         | JSONL    | Deduplicated raw intake (mirrors MASTER_DEBT minus manual items)                         |
| `docs/technical-debt/logs/intake-log.jsonl`     | JSONL    | Timestamped log of each sync operation: items added, deduplication stats                 |
| `docs/technical-debt/logs/resolution-log.jsonl` | JSONL    | Items marked RESOLVED (sonar_key no longer in active set)                                |
| `docs/audits/sonarcloud-issues-detailed.md`     | Markdown | Report mode: exec summary, top-20 files, rule table, BLOCKER/CRITICAL with code snippets |
| Views (generated)                               | JSON/MD  | `generate-views.js` output — severity views, track assignments                           |
| `docs/technical-debt/metrics.json`              | JSON     | Updated via `generate-metrics.js` after sync                                             |

**Key TDMS fields per issue:** `id` (DEBT-XXXX), `source_id` (sonarcloud:{key}),
`sonar_key`, `category`, `severity` (S0-S3), `status` (NEW/RESOLVED),
`resolved_date`.

**CLI-only vs persistent:** Fully persistent. Sonarcloud is a primary data
ingestion point for TDMS. All output survives sessions and is the canonical
source of code quality issue tracking.

**Web dashboard relevance:** HIGH SonarCloud produces the most structured,
queryable quality data in the stack: severity distributions (S0-S3), issue
categories, resolution rates, quality gate pass/fail, top-affected files.
Directly maps to standard code quality dashboard widgets. The `--status` mode
exposes quality gate status on demand.

**Natural grouping affinity:** session-end (consolidates MASTER_DEBT.jsonl),
pr-review (SonarCloud is a review source), TDMS debt system (add-debt,
generate-metrics).

---

### 8. system-test

**Purpose:** 23-domain interactive audit of the full SoNash codebase — deep
checks, per-finding review, TDMS sync.

#### Data Produced

| File / Output                                                     | Format                     | What It Measures                                                                                                                       |
| ----------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/audits/system-test/audit-YYYY-MM-DD/PLAN_INDEX.md`          | Markdown                   | Session progress tracker: 23 domains, status (pending/complete), session boundaries                                                    |
| `docs/audits/system-test/audit-YYYY-MM-DD/domains/d{NN}-*.jsonl`  | JSONL (per-domain)         | Per-domain findings: ID, severity (S0-S3), effort (E0-E3), evidence, status (accepted/rejected/deferred), suggestion_text, reviewed_at |
| `docs/audits/system-test/audit-YYYY-MM-DD/unified-findings.jsonl` | JSONL                      | All domains merged into a single findings file (written at end)                                                                        |
| `docs/audits/system-test/audit-YYYY-MM-DD/SUMMARY.md`             | Markdown                   | Final audit report with cross-cutting analysis                                                                                         |
| TDMS items (via sync protocol)                                    | JSONL in MASTER_DEBT.jsonl | Accepted findings promoted to technical debt                                                                                           |

**Finding JSONL schema (key fields):** `id` (SYST-YYYY-MM-DD-D{NN}-{NNN}),
`domain`, `domain_name`, `check_id`, `severity`, `effort`, `category`, `title`,
`status`, `evidence`, `detected_at`, `reviewed_at`.

**CLI-only vs persistent:** Fully persistent. Designed for multi-session
execution (6 recommended sessions) with checkpoint recovery via PLAN_INDEX.md.
All findings are written to disk immediately (anti-compaction layer 1).

**Web dashboard relevance:** MEDIUM System-test produces rich point-in-time
audit snapshots (not continuous). Useful for an "Audit History" panel showing:
findings per domain, severity distribution, acceptance rate per domain, TDMS
intake from audits. Less useful for live monitoring; strong for trend analysis
across audit runs.

**Natural grouping affinity:** sonarcloud (overlapping quality concerns),
TDMS/add-debt (sync target), pr-retro (both feed action items into TDMS).

---

### 9. skill-creator

**Purpose:** Structured workflow for creating or updating skills — discovery
through validation and audit.

#### Data Produced

| File / Output                                         | Format                | What It Measures                                                                                                                   |
| ----------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/state/skill-creator.state.json`              | JSON                  | Creation record: skill name, discovery decisions (each with rationale), planning checklist, phase, files created, process_feedback |
| Created `.claude/skills/<name>/SKILL.md`              | Markdown              | The new skill itself                                                                                                               |
| Created companion files (REFERENCE.md, scripts, etc.) | Markdown / JS         | Skill package components                                                                                                           |
| Invocation record via `write-invocation.ts`           | JSONL (reviews.jsonl) | Tracks invocation: `{"skill":"skill-creator", "context":{"target":"SKILL_NAME"}}`                                                  |

**State file:** Retained after completion as creation record and artifact
contract for `/skill-audit` handoff. Not deleted post-completion.

**CLI-only vs persistent:** Persistent. State file is the canonical creation
record. Invocation tracking is persistent via reviews.jsonl.

**Web dashboard relevance:** LOW Skill creation is an infrequent, one-off
operation. The data it produces (state file, invocation record) reflects
governance/process rather than ongoing health metrics. A "Skills Created" count
or "Last Audit Date per Skill" could appear in a project health dashboard, but
this is low-frequency data with limited value for day-to-day monitoring.

**Natural grouping affinity:** skill-audit (always run after creation),
skill-ecosystem-audit (aggregate skill health), reviews.jsonl invocation log.

---

## Summary Table

| Skill            | Key Output Formats                                           | Persistent? | Dashboard Relevance | Dashboard Use Case                                                      |
| ---------------- | ------------------------------------------------------------ | ----------- | ------------------- | ----------------------------------------------------------------------- |
| pr-review        | JSON state, JSONL reviews                                    | Yes         | HIGH                | Per-PR review round history, fix/defer/reject rates, severity trends    |
| pr-retro         | JSONL retros, JSON state                                     | Yes         | HIGH                | Action item completion, recurring pattern frequency, cross-PR churn     |
| pre-commit-fixer | JSON tmp state, JSONL hook-runs                              | Partially   | MEDIUM              | Pre-commit failure categories over time, fix vs defer rate              |
| session-begin    | Reads state only (writes ACK timestamps)                     | Minimal     | MEDIUM              | Health gate status at session start; anomaly surface for dashboarding   |
| session-end      | JSONL velocity/health/reviews/debt, MD summaries             | Yes         | HIGH                | Velocity trends, health score over time, TDMS debt metrics, review sync |
| skill-audit      | JSON state (score record), JSONL invocations                 | Yes         | MEDIUM              | Per-skill quality scores, audit frequency, recurring gap categories     |
| sonarcloud       | JSONL MASTER_DEBT, intake/resolution logs, MD report         | Yes         | HIGH                | Issue severity distribution, resolution rate, quality gate status       |
| system-test      | JSONL per-domain + unified findings, MD PLAN_INDEX + SUMMARY | Yes         | MEDIUM              | Audit snapshot: findings by domain, severity, acceptance rate           |
| skill-creator    | JSON state, JSONL invocation                                 | Yes         | LOW                 | Skill governance: created count, last audit dates                       |

---

## Natural Grouping Clusters

### Cluster A: Code Quality Pipeline

**Skills:** sonarcloud + pr-review + pr-retro **Shared data:**
MASTER_DEBT.jsonl, reviews.jsonl, retros.jsonl **Dashboard panel:** "Code
Quality" — open issues by severity, PR review efficiency, recurring patterns

### Cluster B: Session Health & Velocity

**Skills:** session-end + session-begin **Shared data:** velocity-log.jsonl,
ecosystem-health-log.jsonl, hook-warnings-log.jsonl, SESSION_CONTEXT.md
**Dashboard panel:** "Session Metrics" — health score trend, velocity, hook
anomalies

### Cluster C: Skill Governance

**Skills:** skill-creator + skill-audit **Shared data:**
skill-creator.state.json + task-skill-audit-\*.state.json + reviews.jsonl
invocations **Dashboard panel:** "Skill Health" — quality scores per skill,
audit coverage, last-audited dates

### Cluster D: Point-in-Time Audits

**Skills:** system-test + pre-commit-fixer **Shared data:** JSONL findings,
hook-runs.jsonl **Dashboard panel:** "Audit History" — system-test findings over
audit runs, pre-commit category failures

---

## Gaps & Notes

1. **session-begin produces almost no data** — it is a consumer/gating skill.
   Dashboard integration requires reading the data it surfaces
   (hook-warnings.json, health-score-log.jsonl), not the skill's output itself.

2. **pre-commit-fixer has a persistence gap** — fix data only becomes durable
   when session-end appends to `hook-runs.jsonl`. A dashboard would see
   incomplete data if session-end is skipped.

3. **system-test is periodic, not continuous** — designed for 6-session runs on
   demand. Dashboard panels would show historical snapshots, not live data. The
   audit directory naming (`audit-YYYY-MM-DD`) makes time-series comparison
   across runs tractable.

4. **skill-creator and skill-audit together form a governance loop** — neither
   produces high-frequency operational data, but together they track the health
   of the AI infrastructure itself (meta-level dashboard).

5. **reviews.jsonl is a shared ingestion point** — pr-review, pr-retro,
   skill-audit, and skill-creator all write invocation records to
   `reviews.jsonl` via `write-invocation.js`. This file is the most broadly
   queryable cross-skill activity log.

---

## Confidence Assessment

- HIGH claims: 8 (data formats and file paths read directly from SKILL.md source
  files)
- MEDIUM claims: 3 (dashboard relevance judgments involve interpretation)
- LOW claims: 0
- UNVERIFIED claims: 0

**Overall confidence:** HIGH — all findings sourced directly from canonical
SKILL.md files via filesystem reads.
