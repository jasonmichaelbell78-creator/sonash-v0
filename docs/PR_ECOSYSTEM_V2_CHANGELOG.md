<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-02
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# PR Review Ecosystem v2 — Comprehensive Changelog

A detailed breakdown of every aspect of the PR review ecosystem that changed
during the v2 overhaul (shipped 2026-03-01). Organized by domain with
before/after comparisons, what each change solves, and where things live now.

**Scope:** 7 phases, 30 execution plans, 59 requirements, 284 minutes of
AI-assisted implementation (wall-clock across all phases), 60 architectural
decisions.

**Source documents:**

- Diagnosis: `docs/aggregation/PR_ECOSYSTEM_DIAGNOSIS.md`
- Discovery: `.planning/ecosystem-v2/DISCOVERY_QA.md` (60 decisions)
- Requirements: `.planning/milestones/v1.0-REQUIREMENTS.md` (59 req)
- Milestone audit: `.planning/milestones/v1.0-MILESTONE-AUDIT.md`
- Phase plans: `.planning/phases/<phase-slug>/` (7 directories, 30 plan files)

---

## Table of Contents

1. [Data Layer & Storage](#1-data-layer--storage)
2. [Backfill & Data Migration](#2-backfill--data-migration)
3. [Core Pipeline (Capture to Promotion)](#3-core-pipeline-capture-to-promotion)
4. [Enforcement Expansion](#4-enforcement-expansion)
5. [Health Monitoring & Dashboard](#5-health-monitoring--dashboard)
6. [Gate Recalibration & Automation](#6-gate-recalibration--automation)
7. [Integration & Session Lifecycle](#7-integration--session-lifecycle)
8. [Skill Changes](#8-skill-changes)
9. [Testing Infrastructure](#9-testing-infrastructure)
10. [Metrics Summary](#10-metrics-summary)

---

## 1. Data Layer & Storage

**Phase 1 — Storage Foundation** | Requirements: STOR-01 through STOR-09

### 1.1 JSONL Architecture

| Aspect             | Before (v1)                                                                                   | After (v2)                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Source of truth    | Markdown (`AI_REVIEW_LEARNINGS_LOG.md`)                                                       | JSONL files with Zod validation                                                                               |
| Write flow         | AI writes markdown, `sync-reviews-to-jsonl.js` tries to parse it                              | AI writes structured JSONL directly via CLI writers                                                           |
| Data loss          | 85–100% field loss across key fields (pr: 76% null, patterns: 85% empty, severity: 100% zero) | 0% — Zod rejects invalid records at write time                                                                |
| Files              | 1 monolithic `reviews.jsonl` (45 entries, most fields zero)                                   | 5 split files: `reviews.jsonl`, `retros.jsonl`, `deferred-items.jsonl`, `invocations.jsonl`, `warnings.jsonl` |
| Schema enforcement | None — anything gets written                                                                  | Zod schemas defined for all 5 types (STOR-01) with write-time validation                                      |
| Queryability       | Poor — all record types in one file                                                           | Each file has independent schema, can be queried/filtered separately                                          |

**What it solves:** The v1 JSONL layer was "effectively non-functional as a data
store" (S0 finding #1 from the diagnosis). The `sync-reviews-to-jsonl.js` script
destroyed 85–100% of data when parsing markdown to JSONL. All downstream
analytics, promotion, and effectiveness tracking used broken data.

### 1.2 Completeness Model

| Aspect                 | Before                                            | After                                                                   |
| ---------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| Data quality tracking  | None — records were either present or absent      | Three-tier model: `full`, `partial`, `stub` (STOR-04)                   |
| Missing field handling | Silent nulls                                      | `completeness_missing[]` array explicitly lists which fields lack data  |
| Consumer behavior      | Consumers can't distinguish "zero" from "unknown" | `hasField()` helper checks both null AND completeness_missing (STOR-08) |

**What it solves:** Historical review data varies wildly in quality. Early
archives (reviews #1–100) are summary-only with minimal fields. The completeness
model lets consumers make informed decisions about data quality without
guessing.

### 1.3 Origin Tracking

| Aspect                | Before                                                                        | After                                                                               |
| --------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Source identification | String field (`"manual"`, `"session-start"`) — 88% attributed to wrong source | Zod-validated structured object with `type`, `pr`, `round`, `tool` fields (STOR-05) |
| Source drift          | Common — "SonarCloud + Qodo + Gemini" collapsed to "manual"                   | Impossible — schema rejects malformed origin objects                                |

### 1.4 Write Utilities

| Aspect          | Before                                         | After                                                                                      |
| --------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Write mechanism | Direct `fs.appendFileSync` in multiple scripts | Single shared `write-jsonl.ts` utility validates via Zod then appends (STOR-07)            |
| Read mechanism  | Raw `fs.readFileSync` + JSON.parse per-line    | `read-jsonl.ts` with schema validation and warning logging for malformed records (STOR-06) |

**Files created:** `scripts/reviews/lib/schemas/` (6 schema files),
`scripts/reviews/lib/write-jsonl.ts`, `scripts/reviews/lib/read-jsonl.ts`,
`scripts/reviews/lib/completeness.ts`

---

## 2. Backfill & Data Migration

**Phase 2 — Backfill & Data Migration** | Requirements: BKFL-01 through BKFL-07

### 2.1 Review History Coverage

| Aspect            | Before                                                         | After                                                            |
| ----------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| JSONL coverage    | 45/406 reviews (11.1%) covering 12 days                        | 372 validated records from 13 archives (100% backfill) (BKFL-01) |
| Temporal range    | 2026-02-16 to 2026-02-27 only                                  | Reviews #1 through #406, full project history                    |
| Archive integrity | 3 overlapping ranges with conflicting content, 7 coverage gaps | All overlaps resolved, gaps filled (BKFL-02)                     |

**What it solves:** With only 11.1% of history in JSONL, any analytics or
pattern detection was meaningless. The backfill means the full review history is
now available for promotion analysis, trend tracking, and effectiveness metrics.

### 2.2 Data Corrections

| Aspect                 | Before                                 | After                                                  |
| ---------------------- | -------------------------------------- | ------------------------------------------------------ |
| Retro arithmetic       | Computed metrics missing               | Tagged with calculated metrics for analytics (BKFL-04) |
| Consolidation counters | Counter discontinuity (miscounts)      | Corrected and verified (BKFL-05)                       |
| Known pattern errors   | Patterns #5 and #13 had incorrect data | Fixed (BKFL-06)                                        |
| DEBT deduplication     | Review-sourced DEBT entries duplicated | Deduplicated via `dedup-debt.ts` (BKFL-03)             |

### 2.3 Parser Infrastructure

| Aspect                 | Before                                           | After                                                                                            |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Archive parsing        | `sync-reviews-to-jsonl.js` — lossy regex parsing | `parse-review.ts` — heading + table format support with field extractors (BKFL-01)               |
| Backfill orchestration | Manual, one-off                                  | `backfill-reviews.ts` reads all 13 archives, resolves overlaps, writes validated JSONL (BKFL-01) |

**Files created:** `scripts/reviews/lib/parse-review.ts`,
`scripts/reviews/backfill-reviews.ts`, `scripts/reviews/dedup-debt.ts`

---

## 3. Core Pipeline (Capture to Promotion)

**Phase 3 — Core Pipeline** | Requirements: PIPE-01 through PIPE-10

### 3.1 Review Writer CLIs

| Aspect              | Before                                                                     | After                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Review capture      | AI writes markdown entry, hopes `sync-reviews-to-jsonl.js` parses it later | `write-review-record.ts` CLI writes JSONL directly as source of truth (PIPE-01)                                       |
| Retro capture       | Appended to markdown only                                                  | `write-retro-record.ts` writes JSONL + legacy markdown dual-write (PIPE-02)                                           |
| Deferred items      | Count-only in review summary ("3 deferred") — 90% vanish                   | `write-deferred-items.ts` creates itemized records with description, severity, source PR, resolution status (PIPE-03) |
| Invocation tracking | `track-agent-invocation.js` — misses skill invocations entirely            | `write-invocation.ts` unified tracker for all skills/agents (PIPE-04)                                                 |
| Markdown generation | Markdown was the primary artifact                                          | `render-reviews-to-md.ts` generates markdown VIEW from JSONL source of truth (PIPE-10)                                |

**What it solves:** The old pipeline had markdown as primary storage with a
lossy sync to JSONL. Now JSONL is primary, markdown is generated. This
eliminates the parsing problem entirely — AI writes structured data, never needs
to be parsed.

### 3.2 Promotion Pipeline

| Aspect               | Before                                                              | After                                                                                      |
| -------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Pattern promotion    | `promote-patterns.js` — barely used (6 auto-promoted vs 269 manual) | `promote-patterns.ts` — automated recurrence detection, generates rules (PIPE-05, PIPE-06) |
| Consolidation output | `suggested-rules.md` — dead end, never acted on                     | Merged into promotion pipeline — rules auto-generated (PIPE-05)                            |
| CODE_PATTERNS update | Manual — 275 patterns all hand-added                                | `generate-claude-antipatterns.ts` auto-generates from top patterns (PIPE-07)               |
| FIX_TEMPLATES        | Manual — 34 templates hand-written                                  | `generate-fix-template-stubs.ts` creates stubs from new patterns (PIPE-08)                 |
| Security templates   | Existed but gaps                                                    | 3 new security-specific FIX_TEMPLATES authored (#46–#48) (PIPE-09)                         |

**What it solves:** The v1 promotion pipeline was a dead end. Consolidation ran
but produced `suggested-rules.md` that nobody ever converted to enforcement
rules. The automation bottleneck caused a 100% stall rate. Now the pipeline
automatically detects recurrence and generates enforcement rules.

### 3.3 Skill Wiring

| Aspect               | Before      | After                                                                                                     |
| -------------------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| pr-review JSONL step | Not present | Step 7.5 added — writes review record, deferred items, invocation tracking (PIPE-01)                      |
| pr-retro JSONL step  | Not present | Step 4.1 added — writes retro record to JSONL as source of truth, Step 4.2 dual-writes markdown (PIPE-02) |

**Files created:** `scripts/reviews/write-review-record.ts`,
`scripts/reviews/write-retro-record.ts`,
`scripts/reviews/write-deferred-items.ts`,
`scripts/reviews/write-invocation.ts`,
`scripts/reviews/render-reviews-to-md.ts`,
`scripts/reviews/lib/promote-patterns.ts`,
`scripts/reviews/lib/generate-claude-antipatterns.ts`,
`scripts/reviews/lib/generate-fix-template-stubs.ts`

---

## 4. Enforcement Expansion

**Phase 4 — Enforcement Expansion** | Requirements: ENFR-01 through ENFR-07

### 4.1 Tiered Enforcement Overview

| Mechanism                                   | Before                | After                                                                    | Delta                   |
| ------------------------------------------- | --------------------- | ------------------------------------------------------------------------ | ----------------------- |
| Regex rules (`check-pattern-compliance.js`) | 43 rules              | 64 rules                                                                 | +21                     |
| ESLint AST rules (custom plugin)            | 22 rules              | 32 rules                                                                 | +10 (7 new + 3 refined) |
| Semgrep custom rules                        | 0 local rules         | 20 rules                                                                 | +20                     |
| Total automated enforcement                 | ~65 rules             | ~116 rules                                                               | +51                     |
| Enforcement coverage                        | 24% (65/275 patterns) | 32.2% automated (116/360 patterns), 100% tracked across all 7 mechanisms | See note below          |

> **Coverage note:** The absolute percentage dropped because v2 accurately
> counts all 360 known patterns (vs 275 before) and honestly measures which are
> automatable. The mathematical ceiling is 32.2% — many patterns are
> fundamentally unenforceable by static analysis (e.g., "use meaningful variable
> names"). What changed is that ALL 360 patterns are now tracked across all 7
> enforcement mechanisms. (ENFR-04, ENFR-06)

### 4.2 New Semgrep Rules (20 rules)

| Aspect               | Before                   | After                                                                     |
| -------------------- | ------------------------ | ------------------------------------------------------------------------- |
| Semgrep local rules  | None                     | 20 custom YAML rules in `.semgrep/rules/` (ENFR-01)                       |
| Semgrep CI           | Cloud-managed rules only | Local custom rules + cloud rules, both with SARIF output (Phase 4 commit) |
| Multi-line detection | Not possible with regex  | Semgrep handles multi-line patterns and taint tracking                    |

**What it solves:** Regex can't catch multi-line patterns or data flow issues.
ESLint requires significant AST knowledge. Semgrep fills the gap — YAML rules
that handle multi-line matching and taint analysis with low authoring effort.

### 4.3 New ESLint AST Rules (7 new)

New rules added to `eslint-plugin-sonash` (bumped to v4.0.0):

| Rule                          | What it catches                                |
| ----------------------------- | ---------------------------------------------- |
| `no-effect-missing-cleanup`   | useEffect with timers but no cleanup return    |
| `no-unsafe-spread`            | Unknown object spread into JSX props           |
| `no-state-update-in-render`   | setState calls in render body                  |
| `no-async-component`          | Async client components (Next.js anti-pattern) |
| `no-missing-error-boundary`   | Suspense without ErrorBoundary wrapper         |
| `no-unbounded-array-in-state` | Array growth in state without slice/limit      |
| `no-callback-in-effect-dep`   | Inline function in useEffect dependency array  |

All 7 have RuleTester test cases (43 total tests passing).

### 4.4 New Regex Rules (13 new)

| Category              | Rules added                                                                  |
| --------------------- | ---------------------------------------------------------------------------- |
| Banned imports (4)    | direct-firestore-write, moment, lodash-full, fs-in-client                    |
| Naming violations (3) | generic-handler, single-letter-var, todo-without-ticket                      |
| Security/safety (4)   | process-env-inline, string-concat-in-query, document-cookie, window-location |
| Correctness (2)       | json-parse-without-try, array-index-as-key                                   |

### 4.5 False Positive Management

| Aspect        | Before                      | After                                                                 |
| ------------- | --------------------------- | --------------------------------------------------------------------- |
| FP handling   | Manual exclusions, no limit | FP auto-disable: rules with >25 exclusions are auto-skipped (ENFR-07) |
| FP visibility | Hidden                      | `--fp-report` shows AUTO-DISABLED section                             |
| FP override   | Not possible                | `--fp-threshold=N` and `--include-fp-disabled` CLI flags              |

### 4.6 Enforcement Manifest

| Aspect               | Before                                               | After                                                                                            |
| -------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Pattern tracking     | No unified view of which patterns are enforced where | `build-enforcement-manifest.ts` cross-references all 360 patterns against 7 mechanisms (ENFR-04) |
| Staleness            | Patterns documented but never enforced               | Resolved — every pattern is enforced, documented, or explicitly removed (ENFR-05)                |
| Coverage measurement | Estimated ("about 24%")                              | Accurately calculated with `verify-enforcement-manifest.ts` (ENFR-06)                            |

**Files created:** `scripts/reviews/build-enforcement-manifest.ts`,
`scripts/reviews/verify-enforcement-manifest.ts`, `.semgrep/rules/` (20 rule
files), 7 new ESLint rules in `eslint-plugin-sonash/rules/`

---

## 5. Health Monitoring & Dashboard

**Phase 5 — Health Monitoring** | Requirements: HLTH-01 through HLTH-06

### 5.1 Health Check Infrastructure

| Aspect                | Before                                                       | After                                                                                    |
| --------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Health visibility     | `/pr-ecosystem-audit` with 18 categories (manual invocation) | 10 automated health checker scripts (HLTH-01) + 64-metric composite scoring (HLTH-02)    |
| Score persistence     | None — each audit was ephemeral                              | `ecosystem-health-log.jsonl` persists scores for trending (HLTH-03)                      |
| Dashboard             | Audit-only (deep dive)                                       | Interactive `/ecosystem-health` dashboard with 13 dimensions (HLTH-04)                   |
| Degradation detection | None                                                         | Warning lifecycle system with JSONL persistence (HLTH-05) + mid-session alerts (HLTH-06) |

### 5.2 Health Checkers (10 scripts)

Located in `scripts/health/checkers/`:

| Checker                     | What it measures                              |
| --------------------------- | --------------------------------------------- |
| `code-quality.js`           | ESLint errors, pattern violations, complexity |
| `debt-health.js`            | TDMS item counts, resolution rates, aging     |
| `documentation.js`          | Doc freshness, index sync, cross-doc deps     |
| `hook-pipeline.js`          | Pre-commit/pre-push gate health               |
| `learning-effectiveness.js` | Pattern learning rate, retro completion       |
| `ecosystem-integration.js`  | Cross-system wiring health                    |
| `security.js`               | Security rule coverage, vulnerability counts  |
| `pattern-enforcement.js`    | Enforcement coverage, FP rates                |
| `session-management.js`     | Session lifecycle health                      |
| `test-coverage.js`          | Test tier distribution, coverage metrics      |

### 5.3 Composite Scoring

| Aspect         | Before                                      | After                                                                                    |
| -------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Scoring model  | Per-category scores in ecosystem audit only | 64 metrics across 8 categories, weighted composite 0–100 with letter grade A–F (HLTH-02) |
| Trend tracking | Manual comparison between audit runs        | Automatic sparkline trends with delta percentages                                        |
| Performance    | N/A                                         | Budgets enforced: gate 84ms (<3s), quick 112ms (<1s), full 264ms (<5s)                   |

### 5.4 Warning Lifecycle

| Aspect              | Before                                             | After                                                                  |
| ------------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| Warning handling    | None — issues discovered only during manual audits | Warnings created, aged, resolved, or escalated automatically (HLTH-05) |
| Staleness detection | None                                               | Stale warnings detected and flagged at session start                   |
| Mid-session alerts  | None                                               | Metric degradation triggers alerts during active sessions (HLTH-06)    |

**Files created:** `scripts/health/` directory (10 checkers, 6 lib files, 3 test
files), `scripts/health/run-health-check.js`

---

## 6. Gate Recalibration & Automation

**Phase 6 — Gate Recalibration** | Requirements: GATE-01 through GATE-09

### 6.1 Cross-Doc Dependencies Gate

| Aspect                | Before                                        | After                                                                   |
| --------------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| Override rate         | 48.9% (131 overrides logged) — gate is broken | `diffPattern` filters + `gitFilter` AD added (GATE-01), targeting <15%  |
| Behavior on violation | Block only — must override to proceed         | Auto-fix mode for trivial violations (sync comment injection) (GATE-02) |
| Override analytics    | Raw log only                                  | Pattern detection on overrides identifies systematic issues (GATE-03)   |

**What it solves:** A 48.9% override rate means the gate is noise, not signal.
Developers override reflexively. Recalibrating rules and adding auto-fix for
trivial issues makes the gate trustworthy again.

### 6.2 Review Archival

| Aspect              | Before               | After                                             |
| ------------------- | -------------------- | ------------------------------------------------- |
| Archive trigger     | Manual, ad hoc       | Auto-archive with session safety checks (GATE-04) |
| Active review count | Could grow unbounded | Maintained at threshold (oldest rotate out)       |

### 6.3 External Tool Configuration

| Aspect                 | Before                             | After                                                   |
| ---------------------- | ---------------------------------- | ------------------------------------------------------- |
| Qodo suppression rules | 19 rules, unknown FP effectiveness | Pruned to 10 verified FP rules (GATE-05)                |
| SECURITY_CHECKLIST     | Drift from enforcement rules       | Synced: 34 ESLint, 8 Semgrep, 38 Manual items (GATE-06) |
| Gemini config          | Not in-repo                        | Moved in-repo for version control (INTG-03)             |

### 6.4 DEBT Triage & Escalation

| Aspect                   | Before                                                | After                                                               |
| ------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------- |
| Deferred item resolution | ~90% vanish — 123 items across 8 retros unresolvable  | Auto-tracked with escalation pipeline (GATE-07)                     |
| DEBT escalation          | Manual                                                | Auto-trigger: 2+ deferrals of same item promotes to S1 (GATE-08)    |
| Temporal coverage        | No monitoring                                         | ISO week gap detection identifies periods without reviews (GATE-09) |
| DEBT resolution rate     | 12.5% (80/638 resolved; 558 stuck in VERIFIED status) | Automated triage routes items by severity and age                   |

**What it solves:** The old system was write-only. Review findings got deferred,
logged as DEBT, and then nothing happened. The escalation pipeline ensures
repeatedly-deferred items get promoted to higher severity and surfaced
prominently.

---

## 7. Integration & Session Lifecycle

**Phase 7 — Integration & Cutover** | Requirements: INTG-01 through INTG-08

### 7.1 Session Lifecycle Wiring

| Aspect                | Before                                                           | After                                                                   |
| --------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Session start         | `sync-reviews-to-jsonl.js` + `analyze-learning-effectiveness.js` | `health:quick` composite score displayed on startup (INTG-01)           |
| Session end           | Nothing                                                          | `health:score` persists ecosystem score to `health-log.jsonl` (INTG-02) |
| Compaction safeguards | None                                                             | State preserved across context compaction events (INTG-05)              |

### 7.2 v1 to v2 Cutover

| Aspect                        | Before                          | After                                                                                  |
| ----------------------------- | ------------------------------- | -------------------------------------------------------------------------------------- |
| Migration strategy            | N/A                             | Gradual coexistence — v2 scripts in `scripts/reviews/`, v1 stays as fallback (INTG-06) |
| `sync-reviews-to-jsonl.js`    | Primary sync mechanism (broken) | Preserved as fallback; v2 writer CLIs are primary                                      |
| `check-pattern-compliance.js` | Pre-commit gate                 | Stays v1 — too risky to swap the pre-commit gate. v2 adds rules alongside              |
| `run-consolidation.js`        | Pattern consolidation           | No full v2 replacement yet — works alongside new promotion pipeline                    |

### 7.3 E2E Verification

| Aspect               | Before  | After                                                                   |
| -------------------- | ------- | ----------------------------------------------------------------------- |
| E2E testing          | None    | `pipeline-smoke.e2e.test.js` — 7 tests on real data, 959ms (INTG-07)    |
| Cross-module testing | None    | Integration tests verify cross-phase data flow                          |
| Baseline score       | Unknown | D (63/100) overall, C+ (78.6/100) ecosystem-controlled subset (INTG-08) |

### 7.4 Verified E2E Flows

5 complete end-to-end flows verified:

| Flow | Path                                                                    |
| ---- | ----------------------------------------------------------------------- |
| 1    | Review capture → JSONL → consolidation → promotion → enforcement → gate |
| 2    | Session-start → health:quick → display composite score                  |
| 3    | Session-end → health:score → persist to health-log.jsonl                |
| 4    | Warning creation → lifecycle → stale detection → mid-session alerts     |
| 5    | Deferred item → aging → escalation → DEBT entry                         |

---

## 8. Skill Changes

### 8.1 `/pr-review` (v3.6)

| Change                 | Details                                                                                                                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Step 7.5 added**     | JSONL pipeline — writes review record, deferred items, invocation tracking via CLI writers                                                                                                                                                        |
| **18 pre-push checks** | Accumulated from PR retros #366–#396. Includes: local pattern compliance, security sweep, CC check, filesystem guards, algorithm design, Qodo batch rejection, path normalization, regex DoS sweep, fix-one-audit-all, test/production regex sync |
| **JSONL-first flow**   | Step 7 (learning capture) writes markdown as human-readable view; Step 7.5 writes JSONL as source of truth                                                                                                                                        |
| **Version trajectory** | v1.0 (2026-01-15) → v2.0 (protocol) → v3.0 (pattern compliance) → v3.6 (JSONL pipeline)                                                                                                                                                           |

### 8.2 `/pr-retro` (v3.3)

| Change                      | Details                                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Dashboard mode**          | `/pr-retro` (no args) shows missing retros dashboard — merged PRs without retrospectives                                                   |
| **Step 4.1 JSONL**          | Writes retro record to JSONL as source of truth via `write-retro-record.ts`                                                                |
| **Step 4.2 dual-write**     | Legacy markdown maintained during transition                                                                                               |
| **Step 4.4 tracking**       | Invocation tracking via `write-invocation.ts`                                                                                              |
| **Step 5.0 Gemini sync**    | Rejected items (2+ times) synced to `.gemini/styleguide.md` and `.qodo/pr-agent.toml`                                                      |
| **Step 6 TDMS enforcement** | Every action item not immediately implemented gets DEBT entry; repeat offenders escalated to S1                                            |
| **13 churn patterns**       | Documented patterns covering CC, symlinks, JSONL sync, stale reviewers, path normalization, ChainExpression propagation, fix-one-audit-all |
| **Version trajectory**      | v1.0 (2026-02-12) → v2.0 (mandatory format) → v3.0 (BLOCKING patterns) → v3.3 (JSONL dual-write)                                           |

### 8.3 `/pr-ecosystem-audit` (v1.2)

| Change                | Details                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Created in v2**     | Entirely new skill — 18 categories across 5 domains                                                                            |
| **Compaction guard**  | Progress saved to `.claude/tmp/pr-audit-progress.json`; resumes from saved position after context compaction                   |
| **5 checker scripts** | `process-compliance.js`, `data-state-health.js`, `pattern-lifecycle.js`, `feedback-integration.js`, `effectiveness-metrics.js` |
| **Patch suggestions** | Findings include concrete patches that can be auto-applied                                                                     |
| **Trend tracking**    | Historical scores persisted, sparkline trends, delta comparisons                                                               |

### 8.4 `/code-reviewer` (v2.0)

| Change               | Details                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Scope clarified**  | Explicitly scoped for ad-hoc development reviews — NOT for formal PR gate reviews (use `/pr-review` for that) |
| **Script checklist** | 10-item checklist specifically for `scripts/`, `hooks/`, `.husky/` files                                      |
| **Episodic memory**  | Pre-review episodic memory search for past decisions, established patterns, and prior reviews on same module  |

---

## 9. Testing Infrastructure

**Cross-cutting** | Requirements: TEST-01 through TEST-06

| Aspect            | Before                                                       | After                                                                                          |
| ----------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Test files        | "10 of 14 critical pipeline scripts have zero test coverage" | 56 test files across 5 tiers (target was 39 — exceeded by 44%) (TEST-03)                       |
| Contract tests    | None                                                         | 7 contract tests verify data handoff across phase boundaries (TEST-01)                         |
| E2E tests         | None                                                         | Pipeline smoke test: 7 tests, 959ms on real data (TEST-02)                                     |
| Performance tests | None                                                         | `budget.perf.test.js` — 4 budgets: gate <3s, quick <1s, full <5s, consolidation <10s (TEST-04) |
| Co-location       | Tests separate from code, often missing                      | Co-location policy adopted; 13 scripts still lack co-located tests (documented gaps) (TEST-05) |
| Fixture quality   | N/A                                                          | Pipeline functions tested against all 3 completeness fixture types (TEST-06)                   |

### Test Tier Breakdown

| Tier        | Files | Examples                                          |
| ----------- | ----- | ------------------------------------------------- |
| Unit        | 45    | Schema tests, parser tests, writer tests          |
| Contract    | 7     | Data handoff verification across phase boundaries |
| Integration | 2     | Cross-module pipeline, health pipeline            |
| E2E         | 1     | pipeline-smoke.e2e.test.js (7 tests, real data)   |
| Performance | 1     | budget.perf.test.js (4 budgets, all passing)      |

### Performance Budget Results

| Budget        | Actual | Limit     |
| ------------- | ------ | --------- |
| Gate check    | 84ms   | <3,000ms  |
| Quick health  | 112ms  | <1,000ms  |
| Full health   | 264ms  | <5,000ms  |
| Consolidation | 46ms   | <10,000ms |

---

## 10. Metrics Summary

### Before vs After (Key Numbers)

| Metric                       | Before (v1)                     | After (v2)                                         |
| ---------------------------- | ------------------------------- | -------------------------------------------------- |
| Health grade                 | D+                              | D (63/100) overall, C+ (78.6) ecosystem-controlled |
| JSONL records                | 45 (11.1% coverage)             | 372 (100% backfill)                                |
| JSONL field loss             | 85–100%                         | 0% (Zod validated)                                 |
| JSONL files                  | 1 monolithic                    | 5 specialized                                      |
| Enforcement rules            | ~65 (ESLint + regex)            | ~116 (ESLint + regex + Semgrep)                    |
| Patterns tracked             | 275                             | 360 (all 7 mechanisms)                             |
| Auto-promoted patterns       | 6                               | Automated pipeline                                 |
| Deferred item tracking       | Count-only (90% vanish)         | Itemized with auto-escalation                      |
| Test files                   | ~10 (zero for critical scripts) | 56 across 5 tiers                                  |
| Cross-doc gate override rate | 48.9%                           | Recalibrated with diffPattern + auto-fix           |
| DEBT resolution rate         | 12.5% (80/638)                  | Automated triage pipeline                          |
| Health check scripts         | 0                               | 10                                                 |
| Health metrics               | 0                               | 64 across 8 categories                             |
| Pre-push checks              | ~5                              | 18 (accumulated from retros)                       |
| Performance budgets          | None                            | 4 budgets, all enforced                            |
| E2E verified flows           | 0                               | 5                                                  |
| Zod schemas                  | 0                               | 5 (all JSONL types)                                |
| Contract tests               | 0                               | 7                                                  |
| Architectural decisions      | Ad hoc                          | 60 recorded in discovery Q&A                       |

### Completion Stats

| Dimension                        | Count                                                  |
| -------------------------------- | ------------------------------------------------------ |
| Phases completed                 | 7/7                                                    |
| Execution plans                  | 30/30                                                  |
| Requirements satisfied           | 59/59                                                  |
| Cross-phase connections verified | 8/8                                                    |
| E2E flows verified               | 5/5                                                    |
| Total execution time             | 284 minutes                                            |
| Requirements adjusted            | 3 (coverage target, health baseline, cutover strategy) |
| Requirements dropped             | 0                                                      |

### Known Tech Debt from v2 (10 items)

1. Automated enforcement at 32.2% (116/360) — ceiling for static analysis
2. Health score D (63) vs B+ (87) target — SonarCloud items dominate
3. 10 health checkers lack direct unit tests (covered by integration)
4. `warnings.jsonl` doesn't exist yet (by design — created on first warning)
5. Override rate reduction not yet measured on real commits
6. Auto-fix limited to sync comments (complex docs need manual fixes)
7. v1/v2 cutover is gradual — `check-pattern-compliance.js` stays v1
8. `run-consolidation.js` has no full v2 replacement
9. 2 human verification items pending (session-start display, session-end
   persistence)
10. 13 documented test gaps (scripts without co-located tests)

---

## File Inventory (New in v2)

### Scripts

| Path                                                  | Purpose                                          |
| ----------------------------------------------------- | ------------------------------------------------ |
| `scripts/reviews/lib/schemas/*.ts` (6 files)          | Zod schemas for all JSONL types                  |
| `scripts/reviews/lib/write-jsonl.ts`                  | Shared validated JSONL writer                    |
| `scripts/reviews/lib/read-jsonl.ts`                   | Shared validated JSONL reader                    |
| `scripts/reviews/lib/completeness.ts`                 | Three-tier completeness helpers                  |
| `scripts/reviews/lib/parse-review.ts`                 | Markdown archive parser                          |
| `scripts/reviews/lib/promote-patterns.ts`             | Automated recurrence detection + rule generation |
| `scripts/reviews/lib/generate-claude-antipatterns.ts` | Auto-generate CLAUDE.md antipatterns             |
| `scripts/reviews/lib/generate-fix-template-stubs.ts`  | Auto-generate FIX_TEMPLATE stubs                 |
| `scripts/reviews/lib/enforcement-manifest.ts`         | Manifest builder library                         |
| `scripts/reviews/write-review-record.ts`              | Review JSONL writer CLI                          |
| `scripts/reviews/write-retro-record.ts`               | Retro JSONL writer CLI                           |
| `scripts/reviews/write-deferred-items.ts`             | Deferred item JSONL writer CLI                   |
| `scripts/reviews/write-invocation.ts`                 | Invocation tracker CLI                           |
| `scripts/reviews/render-reviews-to-md.ts`             | JSONL → markdown renderer                        |
| `scripts/reviews/backfill-reviews.ts`                 | Full history backfill orchestrator               |
| `scripts/reviews/dedup-debt.ts`                       | DEBT deduplication                               |
| `scripts/reviews/build-enforcement-manifest.ts`       | Enforcement manifest builder                     |
| `scripts/reviews/verify-enforcement-manifest.ts`      | Manifest coverage verifier                       |
| `scripts/health/checkers/*.js` (10 files)             | Health check scripts                             |
| `scripts/health/lib/*.js` (6 files)                   | Health scoring, composite, warnings, alerts      |
| `scripts/health/run-health-check.js`                  | Health check orchestrator                        |

### Tests (9 new test files in `scripts/reviews/`)

| Path                                     | What it tests            |
| ---------------------------------------- | ------------------------ |
| `__tests__/parse-review.test.ts`         | Archive parser functions |
| `__tests__/backfill-reviews.test.ts`     | Backfill orchestrator    |
| `__tests__/dedup-debt.test.ts`           | DEBT deduplication       |
| `__tests__/write-review-record.test.ts`  | Review writer CLI        |
| `__tests__/write-retro-record.test.ts`   | Retro writer CLI         |
| `__tests__/write-deferred-items.test.ts` | Deferred items writer    |
| `__tests__/write-invocation.test.ts`     | Invocation tracker       |
| `__tests__/render-reviews-to-md.test.ts` | Markdown renderer        |
| `__tests__/promotion-pipeline.test.ts`   | Promotion pipeline       |

### Planning (Not shipped — development artifacts)

| Path                                           | Purpose                              |
| ---------------------------------------------- | ------------------------------------ |
| `.planning/ROADMAP.md`                         | Phase overview and completion status |
| `.planning/PROJECT.md`                         | Project context and key decisions    |
| `.planning/ecosystem-v2/DISCOVERY_QA.md`       | 60 architectural decisions           |
| `.planning/milestones/v1.0-REQUIREMENTS.md`    | 59 requirement specifications        |
| `.planning/milestones/v1.0-MILESTONE-AUDIT.md` | Final audit results                  |
| `.planning/milestones/v1.0-ROADMAP.md`         | Phase-by-phase execution plan        |
| `.planning/phases/01-07/`                      | 30 individual plan + summary files   |

---

_Document created: 2026-03-02_ _Source: Analysis of PR Review Ecosystem v2
overhaul (shipped 2026-03-01 in PR #411)_
