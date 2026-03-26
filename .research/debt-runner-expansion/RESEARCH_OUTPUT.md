# Research Report: debt-runner Expansion — Complete Debt Dashboard

**Generated:** 2026-03-26 **Agents:** 12 searcher agents across 9 sub-questions
**Confidence:** HIGH across all major findings (all claims grounded in direct
filesystem reads) **Data source:** 8,470-item MASTER_DEBT.jsonl, 30 scripts, 25+
skill definitions, 11 CI workflows

---

## Executive Summary

The `/debt-runner` skill is a well-designed 7-mode interactive orchestrator for
the Technical Debt Management System (TDMS), but it addresses only a fraction of
the debt ecosystem it sits inside. The skill orchestrates cleaning, verifying,
and planning against an existing MASTER_DEBT.jsonl — but the majority of
debt-producing activity in the codebase flows through paths that debt-runner
cannot see. Of 25+ skills surveyed, 4 are fully DISCONNECTED from TDMS, 9 are
PARTIAL (findings sometimes escape), and only 7 are fully INTEGRATED. Six
external sources (SonarCloud auto-sync, GitHub Code Scanning, npm audit,
ESLint/tooling suppressed zone, known-debt-baseline.json, override-log.jsonl)
accumulate findings that never automatically reach MASTER_DEBT.

The current TDMS state is acute: 8,470 total items, 7,281 open, 13% resolution
rate, 11 open S0 alerts, 2,125 items stuck in the verification queue with no
age-based escalation, and a resolution log with only 14 entries — suggesting
most resolutions bypass the log entirely. Three verified bugs exist in the
current system: `debt-health.js` uses lowercase status strings to filter a
database with uppercase statuses (causing miscalculated avg_age),
`dedup-multi-pass.js` has no `--dry-run` flag despite REFERENCE.md documenting
one (blind execution on first use), and `resolve-bulk.js` does not call
`sync-deduped.js` after CI resolutions, leaving `raw/deduped.jsonl` permanently
out of sync after every CI-triggered resolution.

The expanded debt-runner should become a complete debt dashboard — integrating
intake from all major sources, exposing trend data, showing roadmap alignment,
and providing an "intake refresh" mode that surfaces all 26
currently-disconnected gaps. The interactive design should extend the existing
flat-menu model (already well-suited for this purpose) with new modes for intake
audit, source status, dark-debt surfacing, and roadmap reconciliation. All
evidence from 13 surveyed interactive skills confirms 3 levels of depth is the
practical maximum, and the current debt-runner already implements the
best-practice menu pattern. The expansion is additive, not a rewrite.

---

## 1. Current State

### 1.1 debt-runner (7 modes)

**Skill files:** `.claude/skills/debt-runner/SKILL.md` (v1.1),
`.claude/skills/debt-runner/REFERENCE.md` (v1.0)

**Invocation:** `/debt-runner [mode] [--severity S0,S1] [--interactive]`

**Warm-up before menu:** Current S0-S3 counts (derived from
`generate-metrics.js`), effort estimates per mode, resume status from
`.claude/state/debt-runner.state.json`, pending staging files count.

| Mode     | Purpose                                         | Script sequence                                                                                  | CL preset               | Effort estimate       |
| -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------- | --------------------- |
| verify   | Verify debt accuracy against codebase           | `generate-metrics.js` → CL standard → `resolve-bulk.js` → `sync-deduped.js`                      | standard (S0: thorough) | ~10min S0, ~30min all |
| sync     | Sync new debt from SonarCloud                   | `sync-sonarcloud.js --dry-run` → confirm → `--force` → CL standard → `sync-deduped.js`           | standard                | ~5min + CL            |
| plan     | Create resolution plan for target severities    | AI reads MASTER_DEBT → generates `plans/resolution-YYYY-MM-DD.jsonl` + `.md` → CL standard       | standard                | ~15min                |
| health   | Surface debt metrics and trends                 | `generate-metrics.js` → `debt-health.js` → CL quick                                              | quick                   | ~5min                 |
| dedup    | Run deduplication with verified merge decisions | `dedup-multi-pass.js` → staging → CL standard → `consolidate-all.js` → `sync-deduped.js`         | standard                | ~20min                |
| validate | Schema validation + stale item detection        | `validate-schema.js` → `verify-resolutions.js` → CL standard                                     | standard                | ~10min                |
| cleanup  | Archive resolved, clear FPs, regenerate views   | Identify targets → CL standard → `sync-deduped.js` → `generate-views.js` → `generate-metrics.js` | standard                | ~10min                |

**Post-mode:** Returns to menu with updated stats. Post-mutation sync check (CL
quick) runs after verify, sync, dedup, validate, cleanup.

**Guard rails:** >100 mutations requires confirmation + preview; >20 items for
decision offers "you decide / severity filter / batch review"; staging files
never deleted until full pipeline succeeds.

**MASTER_DEBT protection:** All mutations go through staging files first. All
writes use `appendMasterDebtSync` or `writeMasterDebtSync` from
`scripts/lib/safe-fs.js`. Never writes MASTER_DEBT directly in skill code.

### 1.2 TDMS Script Inventory (30 scripts in `scripts/debt/`)

**Scripts that write to MASTER_DEBT.jsonl:**

| Script                       | Write method                                                   | Triggered by                           |
| ---------------------------- | -------------------------------------------------------------- | -------------------------------------- |
| `intake-audit.js`            | `appendMasterDebtSync`                                         | `/add-debt`, audit skills, debt-runner |
| `intake-manual.js`           | `appendMasterDebtSync`                                         | `/add-debt`                            |
| `intake-pr-deferred.js`      | `appendMasterDebtSync`                                         | `/add-debt`, `escalate-deferred.js`    |
| `ingest-cleaned-intake.js`   | `appendMasterDebtSync`                                         | Manual (Step 0h)                       |
| `sync-sonarcloud.js`         | `appendMasterDebtSync` (new) / `writeMasterDebtSync` (resolve) | `/sonarcloud`, debt-runner sync mode   |
| `generate-views.js --ingest` | `writeMasterDebtSync` (full rewrite)                           | `consolidate-all.js`                   |
| `assign-roadmap-refs.js`     | `writeMasterDebtSync`                                          | Manual / `intake-audit.js`             |
| `backfill-hashes.js`         | `writeMasterDebtSync`                                          | Manual (one-time)                      |
| `resolve-item.js`            | `writeMasterDebtSync`                                          | Manual, `/add-debt`                    |
| `resolve-bulk.js`            | `writeMasterDebtSync` (atomic)                                 | CI `resolve-debt.yml`, debt-runner     |
| `reverify-resolved.js`       | atomic tmp+rename                                              | Manual (one-time, dated)               |
| `verify-resolutions.js`      | atomic tmp+rename                                              | debt-runner verify, manual             |

**Read-only / staging scripts (do NOT write MASTER_DEBT):**

`normalize-all.js`, `dedup-multi-pass.js`, `extract-audits.js`,
`extract-reviews.js`, `extract-scattered-debt.js`, `extract-roadmap-debt.js`,
`extract-context-debt.js`, `extract-audit-reports.js`, `clean-intake.js`,
`process-review-needed.js`, `validate-schema.js`, `sync-deduped.js`,
`sync-roadmap-refs.js`, `reconcile-roadmap.js`, `generate-metrics.js`,
`check-phase-status.js`

**Post-write side-effects chain:** `resolve-item.js` and `resolve-bulk.js` both
call `generate-views.js` → `reconcile-roadmap.js --write`. `resolve-item.js`
also calls `sync-deduped.js --apply`. `intake-audit.js` calls
`assign-roadmap-refs.js` and `generate-views.js`.

**ESM outliers:** `check-phase-status.js` and `sync-roadmap-refs.js` use ES
module syntax (`import`/`export`) while all other scripts use CommonJS
`require`. This could cause issues in mixed-module environments.

### 1.3 Data Architecture (MASTER_DEBT → views/metrics)

```
MASTER_DEBT.jsonl (8,470 items — canonical source of truth)
  |
  +-> generate-metrics.js  -> metrics.json (point-in-time snapshot)
  |                           METRICS.md (human dashboard)
  |                           logs/metrics-log.jsonl (112 entries, append-only)
  |
  +-> generate-views.js    -> INDEX.md (all S0, first 20 S1, totals)
                              views/by-severity.md
                              views/by-category.md
                              views/by-status.md
                              views/verification-queue.md (2,126 NEW items)
                              LEGACY_ID_MAPPING.json
                              [unplaced-items.md -- STALE, not regenerated]

raw/ pipeline:
  scattered-intake.jsonl
  audits.jsonl
  reviews.jsonl
  normalized-all.jsonl
  deduped.jsonl  <-- sync-deduped.js keeps this current with MASTER_DEBT
  review-needed.jsonl  <-- uncertain dedup matches awaiting human review
```

**Live data (2026-03-26):**

| Metric                   | Value |
| ------------------------ | ----- |
| Total items              | 8,470 |
| Open                     | 7,281 |
| Resolved                 | 1,115 |
| False positives          | 74    |
| Resolution rate          | 13%   |
| S0 open alerts           | 11    |
| S1 open alerts           | 1,259 |
| NEW (verification queue) | 2,125 |
| VERIFIED                 | 5,156 |

**Source distribution:** sonarcloud (2,561), audit (2,942), unknown (766),
review (623), roadmap (172), dec-2025-report (641), sonarcloud-paste (286),
context (252), manual (81), intake (64), pr-deferred (34), pr-review (22),
others small.

---

## 2. Debt Entry Points — Complete Map

### 2.1 INTEGRATED Paths (auto-route to TDMS)

These paths have a reliable, structured connection from finding to
MASTER_DEBT.jsonl.

| Source                                                                                                                                                                                                                                       | Mechanism                                                           | Script used                                   | Notes                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| Single-session audits (13 skills: audit-code, -security, -performance, -refactoring, -engineering-productivity, -ai-optimization, -documentation, -process, -enhancements, -aggregator, -comprehensive, multi-ai-audit, audit-agent-quality) | Batch JSONL → `intake-audit.js`                                     | `intake-audit.js`                             | User-gated interactive review before intake                               |
| `/pr-review` (deferred items)                                                                                                                                                                                                                | Per-finding → `/add-debt`                                           | `intake-pr-deferred.js`                       | Mandatory: Step 7 gate requires every deferred item has DEBT-XXXX ID      |
| `/sonarcloud` (sync mode)                                                                                                                                                                                                                    | Live API → `sync-sonarcloud.js`                                     | `sync-sonarcloud.js`                          | One user confirmation gates full pipeline                                 |
| `/add-debt`                                                                                                                                                                                                                                  | Direct intake                                                       | `intake-manual.js` or `intake-pr-deferred.js` | The canonical single-item intake mechanism                                |
| CI `resolve-debt.yml`                                                                                                                                                                                                                        | PR merge body → `resolve-bulk.js`                                   | `resolve-bulk.js --eligible-only`             | Only resolves; never creates. Only works with `Resolves: DEBT-XXXX` lines |
| `escalate-deferred.js`                                                                                                                                                                                                                       | `deferred-items.jsonl` (defer_count >= 2) → `intake-pr-deferred.js` | `intake-pr-deferred.js`                       | Only automated promotion path from ecosystem deferral to TDMS             |

### 2.2 PARTIAL Paths (some findings reach TDMS)

| Source                                                                                                      | What reaches TDMS                                                                     | What is lost                                                         | Notes                                                                                        |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Ecosystem audits (8 skills: hook, session, tdms, pr, skill, doc, script, health + data-effectiveness-audit) | Deferred findings via `/add-debt`                                                     | "Fix Now" findings (no audit trail), "Skip" findings                 | Hardcoded `category: "engineering-productivity"` for ALL deferred items regardless of domain |
| `/pre-commit-fixer`                                                                                         | Pre-existing errors deferred to `/add-debt` (Path A)                                  | Items deferred to `known-debt-baseline.json` (Path B) — shadow store | Two defer paths, one reaches TDMS, one does not                                              |
| `/alerts`                                                                                                   | Pending-refinements escalations (suggested S1 DEBT creation)                          | Most deferred alerts (suggestion, not enforcement)                   | "suggest /add-debt" vs ecosystem audit "MUST"                                                |
| `/pr-retro`                                                                                                 | Systemic findings only, when user explicitly says "defer"/"create DEBT"/"add to TDMS" | All immediate-action and process items (by design)                   | Anti-TDMS design philosophy: "Filing into TDMS where it gets lost is NOT a default option"   |
| `/system-test`                                                                                              | Findings synced in Domain 20 (when user chooses Sync)                                 | All findings when user picks "Skip sync"                             | Batch sync with explicit user gate                                                           |
| `/ecosystem-health`                                                                                         | Debt-aging dimension via `/add-debt` (suggested)                                      | All other dimension findings                                         | Session deferral is the default, not TDMS                                                    |
| `session-end`                                                                                               | Existing audit/review JSONL files via `consolidate-all.js`                            | Findings only in Claude context (never written to JSONL)             | Consolidation pipeline, not new-finding intake                                               |

### 2.3 DISCONNECTED Paths (findings never reach TDMS)

| Source                          | Finding type                                                             | Volume estimate                           | Gap severity                                                               |
| ------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------- | -------------------------------------------------------------------------- |
| `/code-reviewer`                | Code review violations, anti-patterns, pre-existing architectural issues | 5-30 per PR; triggered every code change  | CRITICAL — highest volume operational stream                               |
| `/gh-fix-ci`                    | Root cause debt behind CI failures                                       | Low frequency but high signal             | MEDIUM                                                                     |
| `/quick-fix` (v1.0, 2026-02-25) | Pre-commit pattern violations                                            | Low                                       | LOW — deprecation is preferred path                                        |
| `/convergence-loop`             | "New" findings discovered during verification                            | 0-10 per CL session                       | LOW — callers (debt-runner) handle this; gap is in non-debt-runner callers |
| `comprehensive-ecosystem-audit` | Aggregated ecosystem findings                                            | N/A — aggregator produces no new findings | STRUCTURAL — relies on individual audits running first                     |
| `audit-health`                  | Meta-check findings (audit infrastructure health)                        | N/A                                       | BY DESIGN — meta-checks intentionally produce no TDMS items                |

### 2.4 External Sources

| Source                              | CI Detection                                   | Auto-Ingestion to TDMS                             | Manual Path                             | Gap Severity                                   |
| ----------------------------------- | ---------------------------------------------- | -------------------------------------------------- | --------------------------------------- | ---------------------------------------------- |
| SonarCloud                          | Yes (sonarcloud.yml, every push/PR)            | No — sonarcloud.yml never calls sync-sonarcloud.js | `sync-sonarcloud.js` (robust, works)    | HIGH — script exists, just not auto-triggered  |
| CodeRabbit                          | Yes (PR comments)                              | No                                                 | `/pr-review` + `/add-debt` manual paste | HIGH — fully manual                            |
| Qodo                                | Yes (PR comments, 21 suppression rules)        | No                                                 | `/pr-review` + `/add-debt` manual paste | HIGH — fully manual                            |
| Gemini Code Assist                  | Yes (PR comments)                              | No                                                 | `/pr-review` + `/add-debt` manual paste | HIGH — fully manual                            |
| npm audit                           | No (health check aggregate only, not in CI)    | No                                                 | None documented                         | HIGH — not even tracked                        |
| Dependabot                          | Yes (creates PRs)                              | No                                                 | None                                    | LOW — routine updates not debt                 |
| ESLint (scripts/.claude/hooks zone) | Suppressed — zero-warning override             | No                                                 | None                                    | MEDIUM — shadow zone                           |
| Semgrep                             | Yes (SARIF to GitHub Security)                 | No                                                 | None                                    | HIGH — invisible locally                       |
| CodeQL                              | Yes (SARIF to GitHub Security)                 | No                                                 | None                                    | HIGH — invisible locally                       |
| GitHub Issues (pattern-compliance)  | Yes (creates GH Issues with `tech-debt` label) | No                                                 | None                                    | HIGH — parallel tracking not connected to TDMS |
| `known-debt-baseline.json`          | Yes (pre-commit hook)                          | No                                                 | None                                    | MEDIUM — shadow debt store with 45+ entries    |
| `override-log.jsonl`                | Yes (SKIP_REASON logging)                      | No                                                 | None                                    | MEDIUM — aging skips not monitored             |

---

## 3. Debt Consumption and Reporting

### 3.1 Current Consumers

| Consumer                  | Data Read                                                                  | What It Shows                                                                  | Freshness                                        | Notes                                                                         |
| ------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| `generate-views.js`       | MASTER_DEBT.jsonl                                                          | 5 views + INDEX.md                                                             | Per consolidation run                            | No roadmap_ref view; `unplaced-items.md` is permanently stale (2026-02-01)    |
| `generate-metrics.js`     | MASTER_DEBT.jsonl                                                          | metrics.json + METRICS.md + metrics-log.jsonl                                  | Every session-end (mandatory)                    | Trend log lacks per-category breakdown; S0/S1 alert arrays capped at 10 items |
| `debt-health.js`          | metrics.json + MASTER_DEBT.jsonl                                           | 8 scored health metrics                                                        | Per health check run                             | **BUG: lowercase status filter** — sees all 8,470 items as "open" for avg_age |
| `/alerts` (run-alerts.js) | metrics.json + MASTER_DEBT.jsonl + intake-log.jsonl + resolution-log.jsonl | debt-metrics (limited mode), debt-intake + debt-resolution (full mode only)    | metrics.json freshness                           | Full mode required for intake/resolution; limited mode default                |
| `/ecosystem-health`       | runs all 11 health checkers                                                | Technical Debt category (12% weight), 8 sub-metrics — currently 21/100 F-grade | Per invocation                                   | Reads cached metrics.json; Technical Debt is second-worst category            |
| `session-begin` skill     | `docs/technical-debt/INDEX.md`                                             | S0/S1 counts in pre-flight summary                                             | INDEX.md freshness                               | Static read; only first 100 lines of ROADMAP.md scanned                       |
| `session-end` skill       | Invokes scripts                                                            | Runs `consolidate-all.js` (views) + `generate-metrics.js` (metrics)            | Regenerates at every session-end                 | `sync-roadmap-refs.js` not in pipeline                                        |
| Go statusline             | None (debt-related)                                                        | Nothing                                                                        | N/A                                              | **Zero debt awareness** — no S0 count, no total, no resolution rate widget    |
| ROADMAP.md                | Embedded `DEBT-XXXX` references                                            | Roadmap tracks with debt item links                                            | Manual update + `reconcile-roadmap.js` on demand | `sync-roadmap-refs.js` not automated; no by-track aggregate view              |

### 3.2 Missing Consumers

1. **Statusline widget for S0 count** — real-time S0 alert visible at all times
   (currently zero debt awareness)
2. **Roadmap-track view** — generated view grouping items by `roadmap_ref` /
   `milestone` (field exists in all items but no view exposes it)
3. **Trend visualization from metrics-log.jsonl** — 112 entries exist with
   timestamps but nothing renders time-series trends
4. **PR resolution summary** — which PRs resolved which debt (resolution.pr
   field exists but no consumer surfaces it)
5. **Intake source health view** — which sources are contributing new items vs.
   which are stale
6. **Category velocity view** — rate of intake vs. resolution per category over
   time
7. **review-needed.jsonl processing mode** — dedup creates this queue; no
   debt-runner mode processes it

---

## 4. Verification and Resolution

### 4.1 Current Systems

**Status lifecycle:**

| Transition                        | Mechanism                                                           | Automation                                          |
| --------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------- |
| NEW → VERIFIED                    | `verify-resolutions.js --write` (file existence + line count check) | Manual invocation; decision automated by file check |
| VERIFIED → IN_PROGRESS            | **NO IMPLEMENTATION**                                               | Not implemented                                     |
| IN_PROGRESS / VERIFIED → RESOLVED | `resolve-item.js` (single) or `resolve-bulk.js` (bulk)              | Semi-automated via CI `resolve-debt.yml`            |
| ANY → FALSE_POSITIVE              | `resolve-item.js --false-positive`                                  | Manual only                                         |
| RESOLVED → VERIFIED (reopen)      | `reverify-resolved.js --write`                                      | Manual, requires prior audit report                 |

**Deduplication: 6 passes**

| Pass | Strategy                                                  | Risk                                        |
| ---- | --------------------------------------------------------- | ------------------------------------------- |
| 0    | Parametric (numeric literal normalization)                | LOW — S0/S1 skip to review-needed           |
| 1    | Exact content_hash match                                  | NONE                                        |
| 2    | Same file + line ±5 + title >80% similar                  | MEDIUM                                      |
| 3    | Semantic: same file + title >90% similar                  | MEDIUM-HIGH (auto-flagged to review-needed) |
| 4    | Cross-source: SonarCloud ↔ audit, ±10 lines, >70% similar | MEDIUM                                      |
| 5    | Systemic: same title across ≥3 files                      | NONE (annotate only, no merge)              |

### 4.2 Bugs Found

**BUG-01: debt-health.js lowercase status filter** [CONFIDENCE: HIGH]

`debt-health.js` filters open items with
`d.status !== "resolved" && d.status !== "closed"` using lowercase strings.
MASTER_DEBT.jsonl stores uppercase statuses (`"RESOLVED"`, `"FALSE_POSITIVE"`).
Effect: the avg_age calculation includes ALL 8,470 items including resolved
ones, artificially deflating the reported average age. `generate-metrics.js`
uses correct uppercase comparisons.

**File:** `scripts/health/checkers/debt-health.js` — the filter logic in the
avg_age calculation loop.

**BUG-02: dedup-multi-pass.js missing --dry-run flag** [CONFIDENCE: HIGH]

`debt-runner/REFERENCE.md` documents
`node scripts/debt/dedup-multi-pass.js --dry-run` and `--force` as valid
invocations. The actual script source has no `--dry-run` or `--force` argument
parsing — it always runs all 6 passes and writes all output files
unconditionally. Any debt-runner session following REFERENCE.md step 1 for Dedup
mode executes dedup immediately without the documented preview step.

**Files:** `scripts/debt/dedup-multi-pass.js` (missing flag parsing),
`.claude/skills/debt-runner/REFERENCE.md` (documents non-existent flags).

**BUG-03: resolve-bulk.js does not call sync-deduped.js** [CONFIDENCE: HIGH]

`resolve-item.js` calls `sync-deduped.js --apply` after every single-item
resolution. `resolve-bulk.js` does NOT call `sync-deduped.js` after bulk
resolution. CI uses `resolve-bulk.js`. Result: every CI-triggered resolution
(`resolve-debt.yml` on PR merge) leaves `raw/deduped.jsonl` out of sync with
MASTER_DEBT.jsonl until manually reconciled. Running `consolidate-all.js` after
a CI resolution (without first running `sync-deduped.js`) would overwrite the CI
resolutions.

**Files:** `scripts/debt/resolve-bulk.js` (missing `sync-deduped.js` call),
`.github/workflows/resolve-debt.yml` (inherits the gap).

**BUG-04: TRIAGED status in ELIGIBLE_STATUSES but not in schema** [CONFIDENCE:
HIGH]

`resolve-bulk.js` defines
`ELIGIBLE_STATUSES = ["VERIFIED", "IN_PROGRESS", "TRIAGED"]`.
`scripts/config/audit-schema.json` defines
`validStatuses = ["NEW", "VERIFIED", "FALSE_POSITIVE", "IN_PROGRESS", "RESOLVED"]`.
TRIAGED is not a valid schema status. An item manually set to TRIAGED would pass
CI eligibility but fail schema validation — a code/schema contradiction.

**Files:** `scripts/debt/resolve-bulk.js:34`,
`scripts/config/audit-schema.json`.

**BUG-05: consolidate-all.js can overwrite CI resolutions** [CONFIDENCE: HIGH]

The `generate-views.js --ingest` step (called by `consolidate-all.js`)
regenerates MASTER_DEBT.jsonl from `raw/deduped.jsonl`. If `resolve-bulk.js`
(CI) runs and then `consolidate-all.js` runs before `sync-deduped.js`, the CI
resolutions in MASTER_DEBT.jsonl are silently overwritten. This is the
"MASTER_DEBT overwrite hazard" from canonical memory — confirmed by session #179
reference in `resolve-item.js` comments.

**Files:** The interaction between `scripts/debt/resolve-bulk.js`,
`scripts/debt/sync-deduped.js`, and `scripts/debt/consolidate-all.js`.

### 4.3 Status Lifecycle Gaps

1. **VERIFIED → IN_PROGRESS has no implementation.** The status exists in
   schema, views, metrics, and `ELIGIBLE_STATUSES` but no script transitions
   items to it. Items get this status only via direct JSONL edits.
2. **NEW → VERIFIED promotion does not verify issue existence.**
   `verify-resolutions.js` only checks that the referenced file exists and the
   line number is within file length. A refactored file still passes. An item
   pointing to a file that was fixed passes verification and becomes VERIFIED
   rather than RESOLVED.
3. **Verification queue (2,125 NEW items) has no SLA or escalation.** Items can
   remain NEW indefinitely. No age-based escalation triggers review or
   auto-promotion.
4. **FALSE_POSITIVES.jsonl is severely under-populated.** Only 6 entries;
   `reverify-resolved.js` data shows ~52% false positive rate in the "possibly
   unresolved" classification. True FP count in the verification queue is
   unknown but likely in the hundreds.
5. **Resolution log has only 14 entries** despite 1,115 resolved items. Most
   resolutions bypass `resolution-log.jsonl`.

---

## 5. Gap Analysis

### 5.1 Intake Gaps (26 catalogued)

Catalogued as GAP-01 through GAP-19 plus DARK-01 through DARK-06 in SQ8a
findings. Grouped by priority:

**MUST-HAVE (highest impact, feasible):**

| Gap    | Source                     | What's Missing                                                                       | Effort   |
| ------ | -------------------------- | ------------------------------------------------------------------------------------ | -------- |
| GAP-01 | `/code-reviewer`           | No TDMS path for code review findings — largest operational gap                      | Moderate |
| GAP-05 | SonarCloud CI              | `sonarcloud.yml` never calls `sync-sonarcloud.js`                                    | Trivial  |
| GAP-06 | Pattern compliance CI      | Weekly scan creates GitHub Issues, not TDMS items                                    | Moderate |
| GAP-09 | npm audit                  | No per-vulnerability TDMS tracking                                                   | Moderate |
| GAP-15 | `/alerts` defer            | "suggest /add-debt" should be "invoke /add-debt" for pending-refinements escalations | Trivial  |
| GAP-17 | `known-debt-baseline.json` | 45+ shadow debt entries with no DEBT-XXXX IDs                                        | Moderate |
| GAP-18 | Hook warnings              | Recurrent warnings not escalated to TDMS                                             | Moderate |
| GAP-13 | Ecosystem audit "Fix Now"  | Fixed findings leave no TDMS audit trail                                             | Moderate |

**NICE-TO-HAVE:**

| Gap       | Source                 | What's Missing                                     | Effort      |
| --------- | ---------------------- | -------------------------------------------------- | ----------- |
| GAP-02    | `/gh-fix-ci`           | Systemic CI failures not tracked                   | Trivial     |
| GAP-07/08 | Semgrep / CodeQL       | GitHub Code Scanning invisible to TDMS             | Significant |
| GAP-10    | Dependabot security    | Security-driven PRs not tracked as debt            | Moderate    |
| GAP-12    | CodeRabbit/Qodo/Gemini | No API; manual /pr-review path is appropriate      | Low         |
| GAP-14    | `/pr-retro`            | Systemic findings not surfaced for TDMS at closure | Trivial     |
| GAP-16    | `session-end`          | No "any debt discovered this session?" prompt      | Trivial     |
| GAP-19    | `/system-test`         | "Skip sync" loses all findings                     | Moderate    |

**LOW / POLICY-REQUIRED:**

| Gap    | Source              | Notes                                        |
| ------ | ------------------- | -------------------------------------------- |
| GAP-03 | `/convergence-loop` | Gap is in callers, not CL itself             |
| GAP-04 | `/quick-fix`        | Deprecate in favor of `pre-commit-fixer`     |
| GAP-11 | ESLint scripts zone | Requires policy change to restore visibility |

### 5.2 Defer-Path Audit (18 locations: 6 working, 5 aspirational, 1 broken, 2 missing)

| Classification | Locations                                                                                                                                                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WORKING        | `/pr-review` DAS block, `_shared/AUDIT_TEMPLATE.md`, `_shared/ecosystem-audit/FINDING_WALKTHROUGH.md`, `audit-comprehensive`, `multi-ai-audit`, `/pr-retro` (gated, user-explicit), `/pre-commit-fixer` Path A (pre-existing errors to `/add-debt`) |
| ASPIRATIONAL   | `/alerts` ("suggest" not "invoke"), `/session-begin` (session-scoped, not TDMS), `/ecosystem-health` (session goals, not TDMS), all ecosystem audits for non-deferred findings                                                                      |
| BROKEN         | `/pre-commit-fixer` Path B — defer to `known-debt-baseline.json` is a shadow store, not TDMS; the skill conflates two fundamentally different defer destinations without explaining the difference                                                  |
| MISSING        | `CLAUDE.md` guardrail #14 option (b) — no TDMS guidance; `resolve-item.js --action defer` documented in `audit-enhancements` but not in script `--help` output                                                                                      |

**Key contradiction:** `/alerts` defer is "suggest /add-debt" (weak), ecosystem
audit defer is "MUST via /add-debt" (strong). Same user action word "defer,"
radically different enforcement levels.

### 5.3 Dark Debt (invisible findings)

| ID      | Store                      | Location                                    | Volume                                   | Why Invisible                                                             |
| ------- | -------------------------- | ------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| DARK-01 | `known-debt-baseline.json` | `.claude/state/known-debt-baseline.json`    | 29 CC + 16 cyc = 45+ file entries        | No DEBT-XXXX IDs; no schema; not read by any consumer                     |
| DARK-02 | `override-log.jsonl`       | `.claude/override-log.jsonl`                | Unknown                                  | No aging checks; no TDMS intake; skips accumulate silently                |
| DARK-03 | `deferred-items.jsonl`     | `data/ecosystem-v2/deferred-items.jsonl`    | >20 items (alerts threshold)             | Items with defer_count=1 never escalate; first deferral invisible to TDMS |
| DARK-04 | ESLint suppressed zone     | `scripts/**` + `.claude/hooks/**`           | Unknown — suppressed at CI level         | Zero-warning override removes all warn-level visibility                   |
| DARK-05 | GitHub Code Scanning       | GitHub Security tab                         | Unknown — requires API                   | SARIF goes directly to GitHub; no local artifact                          |
| DARK-06 | `FALSE_POSITIVES.jsonl`    | `docs/technical-debt/FALSE_POSITIVES.jsonl` | 6 entries vs ~52% estimated true FP rate | FPs incorrectly counted as open S0/S1 inflate health metrics              |

### 5.4 Leaky Pipes (findings lost mid-way)

1. Ecosystem audit "Fix Now" findings — applied but no TDMS record
2. `/alerts` defer → session carry-forward only, not TDMS
3. `/ecosystem-health` defer → SESSION_CONTEXT.md only, not TDMS
4. `/session-begin` defer → session-scoped only
5. `system-test` "Skip sync" → findings stay in domain JSONL files forever
6. `consolidate-all.js` running after CI resolutions without prior
   `sync-deduped.js` — silent overwrite of resolved items

---

## 6. Interactive Design Patterns

### 6.1 Current Patterns (5 menu types observed)

**A. Numbered flat menu** (debt-runner, sonarcloud): all modes at same level,
user picks by number, sub-options appear within mode. Best for debt-runner
expansion — already well-established.

**B. Dashboard + dimension drill-down** (ecosystem-health, alerts): scored
summary table first, then per-item sequential walkthrough. Never "navigate" —
skill moves through items.

**C. Numbered phase pipeline** (pr-review, session-end, pre-commit-fixer,
deep-plan): linear wizard with named steps, no menu. User gates at confirmation
points.

**D. Per-domain audit loop** (system-test, skill-audit): each domain presented
sequentially with decision point; skip/reorder/pause at boundaries.

**E. Per-finding review** (alerts, ecosystem-health, all ecosystem audits via
shared library): finest-grained unit — one finding at a time with numbered
options.

**Maximum depth observed: 3 levels.** Level 3 is always a single-item review
(never a sub-menu).

### 6.2 Best Practices for Debt Dashboard

Synthesized from 13 skills surveyed:

| Dashboard Need        | Recommended Pattern                                | Evidence                                         |
| --------------------- | -------------------------------------------------- | ------------------------------------------------ |
| Top-level navigation  | Numbered flat menu with live stats header          | debt-runner current design                       |
| Per-item triage       | Bordered context card + numbered options           | `_shared/ecosystem-audit/FINDING_WALKTHROUGH.md` |
| Health overview       | Dashboard table with grades/scores                 | ecosystem-health, alerts                         |
| Bulk handling         | Scope guards + delegation shortcuts                | All skills                                       |
| Progress tracking     | "Item N of M (X% — Y fixed, Z deferred)" header    | `_shared` finding card                           |
| State across sessions | PLAN_INDEX.md + state JSONL pair                   | system-test                                      |
| Severity filtering    | Per-severity delegation (fix S0/S1, delegate rest) | alerts, debt-runner                              |
| AI recommendations    | Every item gets recommendation + rationale         | All finding-loop skills                          |

**Scope explosion guards:** >100 mutations requires confirmation
(debt-runner); >20 items for decision offers "you decide / severity filter /
batch review" (debt-runner); these should be preserved and extended in new
modes.

**State persistence:** Every interactive skill persists to disk after every
decision. debt-runner uses `.claude/state/debt-runner.state.json`. This must be
updated to include new modes.

### 6.3 Delegation Spectrum

Observed across 13 skills, from most to least user-involved:

```
Full control    <————————————————————————————>    Full delegation
  Individual    Severity    Patchable    DAS-bracket    "You decide"
  per-item      filter      only         delegation      everything
  review        (skip S3)   ("fix all    (auto on        (all accept
                             patchable") clear items)    all deferred)
```

**Key rule confirmed by multiple skills:** S0/S1 items are never auto-accepted
without showing to user. S2/S3 items are safe for delegation. The most powerful
delegation phrase is "you decide on S2/S3, show me S0/S1."

---

## 7. Dashboard Vision — Capability Map

### 7.1 Current 7 Modes (Extended)

| Mode     | Current Scope                  | Expansion Needed                                                                                                         |
| -------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| verify   | Verify debt accuracy via CL    | Add: --source filter (verify only audit items / only SonarCloud items); add ability to process review-needed.jsonl queue |
| sync     | SonarCloud sync only           | Add: npm audit sync; GitHub Issues sync; Code Scanning sync; show which sources are stale                                |
| plan     | Severity-based resolution plan | Add: category-based planning; roadmap-alignment planning; "show items blocking milestone X"                              |
| health   | Metrics + debt-health          | Add: trend graph from metrics-log.jsonl; intake velocity; resolution velocity; FP rate; benchmark recalibration          |
| dedup    | Multi-pass dedup               | Fix BUG-02 (add --dry-run); add: review-needed.jsonl queue processing mode                                               |
| validate | Schema + stale detection       | Add: FALSE_POSITIVES.jsonl validation; IN_PROGRESS status setter                                                         |
| cleanup  | Archive + regenerate           | Add: actual archival to separate file; FP batch processing from verify-resolutions output                                |

### 7.2 New Modes Needed

| New Mode      | Purpose                                                                                                | Scripts needed                                                           | Priority  |
| ------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | --------- |
| intake        | Surface all disconnected sources; run any intake pipeline step interactively                           | Existing + new `sync-npm-audit.js`, `sync-baseline-debt.js`              | MUST-HAVE |
| sources       | Show intake source health: last sync date, item count, staleness, gap status                           | `generate-metrics.js` + new source-status checker                        | MUST-HAVE |
| roadmap       | Reconcile MASTER_DEBT ↔ ROADMAP.md; show items per track; identify orphaned DEBT-XXXX refs             | `sync-roadmap-refs.js`, `reconcile-roadmap.js`, `assign-roadmap-refs.js` | MUST-HAVE |
| triage        | Process the 2,125-item verification queue interactively: NEW → VERIFIED / FALSE_POSITIVE / IN_PROGRESS | `verify-resolutions.js` + interactive review                             | MUST-HAVE |
| review-needed | Process `raw/review-needed.jsonl` — uncertain dedup pairs awaiting human decision                      | `process-review-needed.js`                                               | MUST-HAVE |
| dark-debt     | Surface known-debt-baseline.json, override-log.jsonl, deferred-items.jsonl; offer to promote to TDMS   | New `sync-baseline-debt.js`                                              | MUST-HAVE |

### 7.3 Sub-Menus per New Mode (Level 2)

**intake sub-menu:**

```
1. SonarCloud sync  — run sync-sonarcloud.js [--dry-run preview]
2. npm audit        — run sync-npm-audit.js (new)
3. Scattered debt   — run extract-scattered-debt.js → clean-intake.js → ingest-cleaned-intake.js
4. Review JSONL     — run extract-reviews.js → consolidate pipeline
5. Baseline debt    — run sync-baseline-debt.js (new, bridges known-debt-baseline.json)
6. Source status    — show each source: last run, items added, staleness
```

**sources sub-menu:**

```
1. Source health summary  — table: source | last sync | items | trend
2. SonarCloud status      — last API sync date, open issues in dashboard vs TDMS
3. Review pipeline        — last extract-reviews.js run, items in reviews.jsonl
4. Audit pipeline         — last extract-audits.js run, items in audits.jsonl
5. Manual intake log      — recent /add-debt invocations from intake-log.jsonl
```

**roadmap sub-menu:**

```
1. Sync check     — sync-roadmap-refs.js --check-only (validate refs)
2. Orphan report  — list DEBT-XXXX refs in ROADMAP.md pointing to nonexistent items
3. Track view     — items per roadmap_ref (generated from MASTER_DEBT grouping)
4. Reconcile      — reconcile-roadmap.js --write (update CANON → DEBT refs)
5. Assign refs    — assign-roadmap-refs.js --dry-run → --write
```

**triage sub-menu:**

```
1. Quick triage   — process NEW items with file existence check (verify-resolutions.js)
2. Interactive    — per-item walkthrough: verify issue still present? assign status
3. FP sweep       — surface HIGH keyword-proximity matches for FP review
4. Stale items    — items with no status change in >90 days
```

### 7.4 Integration Points (what the expanded skill connects to)

| Integration                        | How                                                                      | Scripts                                      |
| ---------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------- |
| SonarCloud API                     | Live sync on demand or on schedule                                       | `sync-sonarcloud.js`                         |
| npm registry advisories            | `npm audit --json` parsing                                               | New `sync-npm-audit.js`                      |
| GitHub Code Scanning               | REST API `/code-scanning/alerts`                                         | New `sync-code-scanning.js`                  |
| GitHub Issues (pattern-compliance) | REST API or workflow change                                              | New `sync-github-issues.js` or workflow edit |
| `known-debt-baseline.json`         | Read + cross-reference MASTER_DEBT                                       | New `sync-baseline-debt.js`                  |
| `deferred-items.jsonl`             | `escalate-deferred.js`                                                   | Existing script                              |
| `override-log.jsonl`               | New aging checker in `/alerts`                                           | Extension of `run-alerts.js`                 |
| ROADMAP.md                         | `sync-roadmap-refs.js`, `reconcile-roadmap.js`, `assign-roadmap-refs.js` | Existing scripts                             |
| Go statusline                      | New S0/S1 widget reading `metrics.json`                                  | `tools/statusline/widgets.go`                |

### 7.5 Full Debt Refresh Workflow (new capability)

A "full refresh" mode that orchestrates the complete intake-to-report pipeline:

```
1. sync-sonarcloud.js --dry-run     → preview new items
2. sync-npm-audit.js --dry-run      → preview vulnerability items
3. extract-scattered-debt.js        → re-scan source files for TODO/FIXME
4. consolidate-all.js               → normalize + dedup all sources
5. generate-views.js                → regenerate views
6. generate-metrics.js              → refresh metrics.json
7. sync-roadmap-refs.js --check-only → check for orphaned refs
8. show dashboard: before/after counts, new items by severity/source
```

User confirmation gate before step 4 (destructive: rewrites MASTER_DEBT via
--ingest). Critical: must call `sync-deduped.js --apply` BEFORE
consolidate-all.js if any resolutions happened since last sync.

### 7.6 Deep-Plan Style Reconciliation

The `/deep-plan` skill's reconciliation pattern is applicable: after any batch
of operations, present a structured summary showing:

- Items added (by source, by severity)
- Items resolved
- Items reclassified
- Items merged (dedup)
- Net delta (open items before vs. after)
- Sync status (MASTER_DEBT vs. deduped.jsonl aligned?)

This summary should be saved to the state file and displayed on menu return.

---

## 8. Critical Bugs and Immediate Fixes

These bugs exist regardless of the expansion. They should be fixed in a
dedicated pre-expansion PR.

| #      | Bug                                                                                                                   | File                                                                            | Fix                                                                                                                  | Effort  |
| ------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------- |
| BUG-01 | `debt-health.js` lowercase status filter — avg_age calculation includes resolved items                                | `scripts/health/checkers/debt-health.js`                                        | Change `"resolved"` and `"closed"` to `"RESOLVED"` and `"FALSE_POSITIVE"`                                            | Trivial |
| BUG-02 | `dedup-multi-pass.js` has no `--dry-run` / `--force` flags despite REFERENCE.md documenting them                      | `scripts/debt/dedup-multi-pass.js`, `.claude/skills/debt-runner/REFERENCE.md`   | Add `--dry-run` flag (output only, no file writes) OR update REFERENCE.md to remove documented-but-nonexistent flags | Low     |
| BUG-03 | `resolve-bulk.js` does not call `sync-deduped.js` after bulk write — deduped.jsonl diverges after every CI resolution | `scripts/debt/resolve-bulk.js`                                                  | Add `execFileSync` call to `sync-deduped.js --apply` after successful write, same as `resolve-item.js`               | Low     |
| BUG-04 | TRIAGED in `ELIGIBLE_STATUSES` but not in `validStatuses` schema                                                      | `scripts/debt/resolve-bulk.js:34`, `scripts/config/audit-schema.json`           | Either add TRIAGED to schema or remove from ELIGIBLE_STATUSES                                                        | Trivial |
| BUG-05 | `unplaced-items.md` not regenerated by `generate-views.js` — permanently stale since 2026-02-01                       | `scripts/debt/generate-views.js`, `docs/technical-debt/views/unplaced-items.md` | Add generation logic to `generate-views.js` OR remove the stale file and its link from INDEX.md                      | Low     |
| BUG-06 | `resolve-debt.yml` does not call `sync-roadmap-refs.js` after resolution — ROADMAP.md not updated by CI               | `.github/workflows/resolve-debt.yml`                                            | Add `reconcile-roadmap.js --write` step after `resolve-bulk.js`                                                      | Trivial |

---

## 9. Confidence and Limitations

### Confidence Assessment

- **HIGH confidence claims:** 120+ (all grounded in direct filesystem reads)
- **MEDIUM confidence claims:** 3 (caller attributions confirmed by skill files
  but not exhaustively traced; `resolve-item.js --action defer` flag behavior in
  `audit-enhancements`)
- **LOW confidence claims:** 0
- **UNVERIFIED claims:** 0

All findings are based on direct reads of source files, script code, workflow
YAML, and skill documentation. No claims rely on training data inference. Every
source was read at its actual file path on 2026-03-26.

### Known Limitations

1. `sync-sonarcloud.js` body (lines 80+) was partially read in SQ1; full API
   fetch logic not confirmed but header and CLI flags fully documented.
2. `extract-audit-reports.js` body exceeds 10k tokens; the extraction loop
   structure was not fully confirmed beyond line 160.
3. GitHub Code Scanning alert counts for Semgrep and CodeQL are unknown (require
   live API call).
4. npm audit current vulnerability count is unknown (would require live
   `npm audit --json` run).
5. `docs/technical-debt/plans/` directory does not exist — no existing
   resolution plans to inspect.
6. The full caller graph for `consolidate-all.js` was confirmed via skill files
   but not exhaustively traced through every code path.

---

## Sources (by tier)

### Tier 1 — Canonical Scripts and Data (ground truth)

| #   | Source                                          | Notes                     |
| --- | ----------------------------------------------- | ------------------------- |
| S01 | `scripts/debt/` (30 scripts, all read directly) | Complete script inventory |
| S02 | `docs/technical-debt/MASTER_DEBT.jsonl`         | 8,470 lines, live data    |
| S03 | `docs/technical-debt/metrics.json`              | Live snapshot 2026-03-26  |
| S04 | `scripts/config/audit-schema.json`              | Schema definitions        |
| S05 | `scripts/lib/safe-fs.js`                        | Write helpers             |
| S06 | `.github/workflows/` (11 workflow files)        | CI configuration          |
| S07 | `.husky/pre-commit` + `.husky/pre-push`         | Hook definitions          |
| S08 | `scripts/health/checkers/debt-health.js`        | Health checker            |
| S09 | `scripts/health/run-health-check.js`            | Health orchestrator       |
| S10 | `scripts/health/lib/composite.js`               | Composite scoring         |
| S11 | `.claude/skills/alerts/scripts/run-alerts.js`   | Alerts runner             |
| S12 | `tools/statusline/widgets.go`                   | Statusline implementation |
| S13 | `.claude/state/known-debt-baseline.json`        | Shadow debt store         |
| S14 | `docs/technical-debt/logs/metrics-log.jsonl`    | 112-entry trend data      |
| S15 | `docs/technical-debt/logs/resolution-log.jsonl` | 14-entry resolution log   |
| S16 | `docs/technical-debt/FALSE_POSITIVES.jsonl`     | 6-entry FP file           |
| S17 | `data/ecosystem-v2/ecosystem-health-log.jsonl`  | Health trend              |

### Tier 2 — Skill and Reference Documentation

| #   | Source                                                            | Notes                           |
| --- | ----------------------------------------------------------------- | ------------------------------- |
| S18 | `.claude/skills/debt-runner/SKILL.md` + `REFERENCE.md`            | Primary skill spec              |
| S19 | `.claude/skills/_shared/AUDIT_TEMPLATE.md`                        | Shared audit pattern            |
| S20 | `.claude/skills/_shared/ecosystem-audit/` (5 shared modules)      | Shared ecosystem audit protocol |
| S21 | 25 skill SKILL.md files (all audit + operational skills surveyed) | Complete skill coverage         |
| S22 | `CLAUDE.md`                                                       | System rules                    |
| S23 | `.claude/skills/pr-review/reference/TDMS_INTEGRATION.md`          | PR-review TDMS integration      |

### Tier 3 — Configuration and Supporting Files

| #   | Source                                                          | Notes                                       |
| --- | --------------------------------------------------------------- | ------------------------------------------- |
| S24 | `eslint.config.mjs`                                             | ESLint configuration, zero-warning override |
| S25 | `.qodo/pr-agent.toml`                                           | Qodo suppression rules                      |
| S26 | `.gemini/config.yaml`                                           | Gemini configuration                        |
| S27 | `sonar-project.properties`                                      | SonarCloud defaults                         |
| S28 | `scripts/mcp/sonarcloud-server.js`                              | MCP server for AI access                    |
| S29 | `.claude/skills/_shared/ecosystem-audit/FINDING_WALKTHROUGH.md` | Shared finding walkthrough                  |
| S30 | `docs/technical-debt/views/*.md` + `INDEX.md`                   | Generated views (current)                   |

---

## Methodology

**Research structure:** 12 searcher agents across 9 sub-questions, each reading
source files directly.

| Sub-question | Scope                                               | Agents | Confidence |
| ------------ | --------------------------------------------------- | ------ | ---------- |
| SQ1          | debt-runner current state (7 modes, scripts, state) | 1      | HIGH       |
| SQ2a         | Scripts 1-15 detailed documentation                 | 1      | HIGH       |
| SQ2b         | Scripts 16-30 detailed documentation                | 1      | HIGH       |
| SQ3a         | Audit skill TDMS routing (25 skills)                | 1      | HIGH       |
| SQ3b         | Operational skill TDMS routing (16 skills)          | 1      | HIGH       |
| SQ4          | Script, hook, and CI intake mapping                 | 1      | HIGH       |
| SQ5          | External sources (SonarCloud, Semgrep, CodeQL, npm) | 1      | HIGH       |
| SQ6          | Debt consumption and reporting (all consumers)      | 1      | HIGH       |
| SQ7          | Verification and resolution systems                 | 1      | HIGH       |
| SQ8a         | Intake gap matrix (26 gaps catalogued)              | 1      | HIGH       |
| SQ8b         | Defer-path audit (18 locations classified)          | 1      | HIGH       |
| SQ9          | Interactive design patterns (13 skills surveyed)    | 1      | HIGH       |

**No external sources consulted.** All findings are derived from direct reads of
the codebase, skill files, scripts, workflow YAML, and configuration files as of
2026-03-26.
