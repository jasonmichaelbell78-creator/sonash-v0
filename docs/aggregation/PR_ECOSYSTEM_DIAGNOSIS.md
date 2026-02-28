# PR Review Ecosystem Diagnosis

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-27
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Date:** 2026-02-27 **Analysis Window:** Reviews #1–#406 (2026-01-01 to
2026-02-27, 58 days) **Review Count:** 406 reviews across 27 merged PRs
(#367–#397) **Methodology:** 4-agent parallel data mining + manual synthesis.
Sources: reviews.jsonl (45 entries), AI_REVIEW_LEARNINGS_LOG.md, 13 archive
files, MASTER_DEBT.jsonl (8,354 items), consolidation.json, CODE_PATTERNS.md
(~275 patterns), check-pattern-compliance.js (65 enforced), FIX_TEMPLATES.md (34
templates), 16 registered hooks, 20 pre-commit/pre-push gates, 131 override log
entries.

---

## Executive Summary

### Composite Health Grade: D+

The PR review ecosystem has impressive breadth — 35+ components spanning
capture, storage, consolidation, promotion, enforcement, automation, and audit
layers. But quantitative analysis reveals severe data quality issues that
undermine the entire feedback loop:

- **JSONL covers 7.8% of review history** (45/406 reviews) with 85–100% data
  loss across key fields
- **76% of documented patterns have no automated enforcement** (65/275)
- **~90% of deferred items vanish** without resolution tracking (123 items,
  ~5–8% conversion to DEBT)
- **10 of 14 critical pipeline scripts have zero test coverage**
- **Review-sourced DEBT resolution rate is 6.9%** (558/638 stuck in VERIFIED)

### Top 5 Highest-Impact Findings

| #   | Finding                                                  | Severity | Impact                                                                          |
| --- | -------------------------------------------------------- | -------- | ------------------------------------------------------------------------------- |
| 1   | JSONL is effectively non-functional as a data store      | S0       | All downstream analytics, promotion, and effectiveness tracking use broken data |
| 2   | Deferred items have no itemized tracking                 | S0       | 123 items across 8 retros are unresolvable — cannot verify fix or escalate      |
| 3   | 76% of patterns rely on AI reading docs, not enforcement | S1       | Pattern recurrence is inevitable without automated gates                        |
| 4   | 10/14 critical scripts have no tests                     | S1       | One refactor could silently break the entire pipeline                           |
| 5   | Review-sourced DEBT resolution rate is 6.9%              | S1       | DEBT from reviews accumulates but never clears — system is write-only           |

### Recommended Investment Areas (ranked by impact)

1. **JSONL data pipeline rebuild** — Fix sync mechanism to capture all fields
   from markdown
2. **Deferred item itemization** — Change from counts to lists with per-item
   tracking
3. **Enforcement coverage expansion** — Target 50% coverage (currently 24%)
4. **Pipeline test coverage** — Contract tests for all 10 handoffs
5. **DEBT resolution workflow** — Automated triage for review-sourced items

---

## 1. Ecosystem Inventory

### 1.1 Complete Component Map (~35 components, 7 layers)

#### Layer 1: Capture (review ingestion)

| Component                | Purpose                                                   | Health |
| ------------------------ | --------------------------------------------------------- | ------ |
| `pr-review` skill        | Process external review feedback (Qodo/Gemini/SonarCloud) | Active |
| `code-reviewer` agent    | Post-implementation internal review                       | Active |
| `multi-ai-audit` skill   | Multi-AI review orchestration                             | Active |
| SonarCloud GitHub Action | Automated analysis on push/PR                             | Active |
| Qodo PR-Agent            | Automated PR review with 19 suppression rules             | Active |
| Gemini review            | GitHub-level review (config not in-repo)                  | Active |

#### Layer 2: Storage (data persistence)

| Component                              | Purpose                          | Health                        |
| -------------------------------------- | -------------------------------- | ----------------------------- |
| `AI_REVIEW_LEARNINGS_LOG.md`           | Primary review record (markdown) | Good — authoritative source   |
| `.claude/state/reviews.jsonl`          | Structured review data           | **Poor** — 85–100% field loss |
| `docs/archive/REVIEWS_*.md` (13 files) | Archived review records          | Fair — 3 overlaps, 7 gaps     |
| `.claude/state/consolidation.json`     | Pipeline state tracking          | Fair — counter discontinuity  |

#### Layer 3: Analysis (pattern extraction)

| Component                                 | Purpose                       | Health                         |
| ----------------------------------------- | ----------------------------- | ------------------------------ |
| `run-consolidation.js`                    | Extract patterns from reviews | Active (17 runs total)         |
| `analyze-learning-effectiveness.js`       | Measure pattern learning      | Active (session-start)         |
| `consolidation-output/suggested-rules.md` | Generated TODO templates      | **Dead end** — never converted |
| `pr-retro` skill                          | Post-merge retrospective      | Active (59% coverage)          |

#### Layer 4: Promotion (pattern documentation)

| Component               | Purpose                           | Health                             |
| ----------------------- | --------------------------------- | ---------------------------------- |
| `CODE_PATTERNS.md`      | Pattern reference (~275 patterns) | Active                             |
| `FIX_TEMPLATES.md`      | Fix templates (34 templates)      | Active                             |
| `SECURITY_CHECKLIST.md` | Security check reference          | Active but drift from others       |
| `promote-patterns.js`   | Auto-promote recurring patterns   | **Barely used** — 6 patterns total |

#### Layer 5: Enforcement (automated checking)

| Component                           | Purpose                                | Health |
| ----------------------------------- | -------------------------------------- | ------ |
| `check-pattern-compliance.js`       | Regex-based pattern checker (43 rules) | Active |
| Custom ESLint plugin (22 rules)     | AST-based pattern checker              | Active |
| Pre-commit gates (11 total)         | Commit-time enforcement                | Active |
| Pre-push gates (9 total)            | Push-time enforcement                  | Active |
| GitHub Actions (4 review workflows) | CI-time enforcement                    | Active |

#### Layer 6: Tracking (debt & resolution)

| Component                  | Purpose                               | Health                     |
| -------------------------- | ------------------------------------- | -------------------------- |
| `MASTER_DEBT.jsonl`        | Technical debt tracking (8,354 items) | Active                     |
| `sync-sonarcloud.js`       | SonarCloud → DEBT pipeline            | Active (no tests)          |
| `sync-reviews-to-jsonl.js` | Markdown → JSONL bridge               | **Broken** — 85% data loss |
| Override log (131 entries) | Gate bypass tracking                  | Active                     |

#### Layer 7: Audit & Meta

| Component                    | Purpose                           | Health                             |
| ---------------------------- | --------------------------------- | ---------------------------------- |
| `pr-ecosystem-audit` skill   | Ecosystem health check            | Active                             |
| `hook-ecosystem-audit` skill | Hook system health                | Active                             |
| 21 audit variant skills      | Domain-specific audits            | Active (possible sprawl)           |
| `track-agent-invocation.js`  | Agent usage tracking              | Partial — misses skill invocations |
| Session-start automation     | Review sync, rotation, compliance | Active                             |

### 1.2 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CAPTURE LAYER                                       │
│  Qodo ──┐  Gemini ──┐  SonarCloud ──┐  code-reviewer ──┐  manual ──┐       │
│          v           v               v                   v           v       │
│         pr-review skill / multi-ai-audit / direct review                    │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   v
┌──────────────────────────────────────────────────────────────────────────────┐
│                          STORAGE LAYER                                       │
│  AI_REVIEW_LEARNINGS_LOG.md ◄── primary record (rich markdown)              │
│       │                                                                      │
│       │  sync-reviews-to-jsonl.js (85-100% DATA LOSS)                       │
│       v                                                                      │
│  reviews.jsonl ◄── structured store (45 entries, most fields zero)          │
│       │                                                                      │
│  archive/REVIEWS_*.md ◄── rotated archives (3 overlaps, 7 gaps)            │
└──────────────┬───────────────────────────────────────────────────────────────┘
               │
               v
┌──────────────────────────────────────────────────────────────────────────────┐
│                        ANALYSIS LAYER                                        │
│  run-consolidation.js ──► consolidation-output/suggested-rules.md (DEAD END)│
│       │                                                                      │
│  analyze-learning-effectiveness.js ──► LEARNING_METRICS.md                  │
│       │                                                                      │
│  pr-retro skill ──► retro entries in reviews.jsonl (59% coverage)           │
└──────────────┬───────────────────────────────────────────────────────────────┘
               │
               v
┌──────────────────────────────────────────────────────────────────────────────┐
│                       PROMOTION LAYER                                        │
│  promote-patterns.js ──► CODE_PATTERNS.md (~275 patterns)                   │
│  (6 auto-promoted)       FIX_TEMPLATES.md (34 templates)                    │
│  (269 manually added)    SECURITY_CHECKLIST.md                              │
└──────────────┬───────────────────────────────────────────────────────────────┘
               │
               v
┌──────────────────────────────────────────────────────────────────────────────┐
│                      ENFORCEMENT LAYER                                       │
│  check-pattern-compliance.js (43 regex rules)  ──┐                          │
│  ESLint plugin (22 rules)                        ├─► 24% coverage           │
│  Pre-commit (11 gates) + Pre-push (9 gates)      │                          │
│  4 GitHub Actions workflows                    ──┘                          │
└──────────────┬───────────────────────────────────────────────────────────────┘
               │
               v
┌──────────────────────────────────────────────────────────────────────────────┐
│                       TRACKING LAYER                                         │
│  MASTER_DEBT.jsonl (638 review-sourced items, 6.9% resolved)                │
│  override-log.jsonl (131 overrides, 48.9% cross-doc)                        │
│  agent-invocations.jsonl (pr-review not tracked)                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Component Version/Staleness Table

| Component                   | Last Active       | Update Frequency   | Staleness Risk                                |
| --------------------------- | ----------------- | ------------------ | --------------------------------------------- |
| reviews.jsonl               | 2026-02-27        | Per session (auto) | Low (auto-synced)                             |
| CODE_PATTERNS.md            | 2026-02-27 (v3.7) | Per consolidation  | Low                                           |
| FIX_TEMPLATES.md            | 2026-02-27        | Per retro action   | Low                                           |
| check-pattern-compliance.js | 2026-02-27        | Ad hoc             | Medium                                        |
| promote-patterns.js         | 2026-02-27        | Rarely used        | **High**                                      |
| consolidation.json          | 2026-02-27        | Per consolidation  | Medium (counter reset)                        |
| Qodo config                 | 2026-02-27        | Per friction event | Low (19 rules)                                |
| SECURITY_CHECKLIST.md       | Unknown           | Ad hoc             | **High** (22 ESLint migrations not reflected) |
| suggested-rules.md          | 2026-02-27        | Per consolidation  | **High** (never acted on)                     |

---

## 2. Data Quality Analysis

### 2.1 JSONL Field Completeness

**45 total entries** (33 review + 12 retrospective) covering reviews #364–#406.

#### Review Entries (33)

| Field                           | Completeness | Assessment                                                    |
| ------------------------------- | ------------ | ------------------------------------------------------------- |
| id, date, title, source         | 100%         | Good — structural fields always populated                     |
| total                           | 61%          | Fair — 13 entries have total=0 despite markdown showing items |
| pr                              | 24%          | Poor — 76% null                                               |
| patterns                        | 15%          | **Very Poor** — 28/33 empty arrays                            |
| learnings                       | 15%          | **Very Poor** — 28/33 empty arrays                            |
| fixed                           | 3%           | **Critical** — 32/33 are zero                                 |
| deferred                        | 0%           | **Critical** — All 33 are zero                                |
| rejected                        | 0%           | **Critical** — All 33 are zero                                |
| critical, major, minor, trivial | 0%           | **Critical** — All severity fields zero across all entries    |

#### Retrospective Entries (12)

| Field                     | Completeness |
| ------------------------- | ------------ |
| rounds, totalItems, fixed | 83–92%       |
| rejected                  | 83%          |
| deferred                  | 42%          |
| churnChains               | 33%          |
| automationCandidates      | 50%          |
| learnings                 | 50%          |

**Root Cause:** `sync-reviews-to-jsonl.js` fails to parse structured data from
markdown format, defaulting most fields to zero/empty. The markdown is
authoritative; the JSONL is a lossy shadow.

### 2.2 Markdown vs JSONL Fidelity Gap

| Data Dimension     | In Markdown                                  | In JSONL                  | Loss Rate |
| ------------------ | -------------------------------------------- | ------------------------- | --------- |
| Source detail      | Always multi-source (SonarCloud+Qodo+Gemini) | 88% collapsed to "manual" | ~88%      |
| Fixed count        | Always present with per-item detail          | 1/33 non-zero             | ~97%      |
| Deferred count     | Usually present                              | 0/33 non-zero             | 100%      |
| Rejected count     | Usually present                              | 0/33 non-zero             | 100%      |
| Severity breakdown | Sometimes present                            | Always zero               | 100%      |
| Pattern slugs      | Rich descriptions                            | 5/33 populated            | ~85%      |
| Learnings          | Multi-sentence narrative                     | 5/33 populated            | ~85%      |
| PR number          | Always present                               | 8/33 non-null             | ~76%      |

**Impact:** Every downstream consumer (consolidation, promotion, effectiveness
analysis, ecosystem audit) operates on broken data. Metrics derived from JSONL
are unreliable.

### 2.3 Source Distribution

| Source Tag                  | Count | %   |
| --------------------------- | ----- | --- |
| manual                      | 29    | 88% |
| sonarcloud+qodo             | 2     | 6%  |
| (retrospectives, no source) | 12    | N/A |

Multi-source detail (e.g., "SonarCloud (3) + Qodo Compliance (2) + Qodo PR
Suggestions (6)") exists in markdown but is collapsed to "manual" in JSONL.
Source attribution is effectively destroyed.

### 2.4 Temporal Coverage

- **JSONL date range:** 2026-02-16 to 2026-02-27 (12 days)
- **Full review history:** 2026-01-01 to 2026-02-27 (58 days)
- **JSONL coverage:** 45/406 entries = **7.8% of total review history**
- **Missing dates within JSONL range:** Feb 19, Feb 23, Feb 24 (despite active
  reviews)
- **No JSONL data for:** Reviews #1–#363 (89% of history)

### 2.5 Archive Health

**13 archive files** covering claimed range #1–#393.

| Issue                  | Severity | Detail                                                              |
| ---------------------- | -------- | ------------------------------------------------------------------- |
| Overlapping ranges     | Medium   | Reviews #366–#369 appear in 3 separate files with different content |
| Duplicate numbering    | High     | REVIEWS_358-388.md has two different Review #367, #368, #369        |
| Coverage gaps          | Medium   | #41, portions of #101–#144, #180–#196, #203–#210, #323, #335, #349  |
| Summary-only archives  | Low      | REVIEWS_101-136.md contains summaries, not individual entries       |
| Duplicate IDs in JSONL | High     | id 367 and 368 each appear twice with different dates/content       |

**Archive overlap detail:**

- REVIEWS_347-369 ∩ REVIEWS_354-357: Reviews #354–#357 in both
- REVIEWS_347-369 ∩ REVIEWS_358-388: Reviews #366–#369 in both (true overlap)
- REVIEWS_358-388 internal: Duplicate numbering event — two sets of #367–#369

---

## 3. Pipeline Integrity

### 3.1 Capture → Storage (sync quality)

**Status: BROKEN**

The `sync-reviews-to-jsonl.js` bridge loses 76–100% of data across key fields.
The markdown log is the authoritative source; the JSONL is a degraded copy.

| Metric                               | Value                           |
| ------------------------------------ | ------------------------------- |
| Entries synced                       | 45/406 (11%)                    |
| Field loss rate (resolution counts)  | 97–100%                         |
| Field loss rate (patterns/learnings) | 85%                             |
| Source attribution preserved         | 12% (2/17 multi-source reviews) |

**Arithmetic inconsistency:** Review id 401 has `fixed: 2` but `total: 0`.

### 3.2 Storage → Consolidation (data loss)

**Status: DEGRADED**

Consolidation reads reviews.jsonl, which has:

- 85% empty `patterns[]` arrays → consolidation sees almost no patterns
- Coarse meta-tags (qodo, ci, security) instead of specific pattern IDs
- Only 45 entries for a 406-review history

The consolidation generates `suggested-rules.md` with TODO templates, but these
are never converted to actual compliance rules. **22 suggested rules sit idle.**

### 3.3 Consolidation → Promotion (manual gap)

**Status: MOSTLY MANUAL**

| Metric                      | Value                                    |
| --------------------------- | ---------------------------------------- |
| Auto-promoted patterns      | 6 (one batch, all from consolidation #2) |
| Manually added patterns     | ~269                                     |
| Auto-promotion rate         | 2.2%                                     |
| Suggested rules unconverted | 22                                       |

`promote-patterns.js` exists but is not integrated into any workflow. It ran
once successfully. The overwhelming majority of pattern documentation happened
through manual curation during retros and consolidations.

### 3.4 Promotion → Enforcement (sync gap)

**Status: LOW COVERAGE**

| Metric                    | Value                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| Documented patterns       | ~275                                                                                      |
| Enforced (regex + ESLint) | 65                                                                                        |
| Coverage rate             | **24%**                                                                                   |
| Unenforced categories     | React/Frontend (20/22), Process Mgmt (12/12), Documentation (17/17), Security Audit (8/8) |

Cross-document sync gaps:

- Test mocking (CLAUDE.md top-5) missing from SECURITY_CHECKLIST and
  FIX_TEMPLATES
- Regex two-strikes (CLAUDE.md top-5) not explicitly in CODE_PATTERNS
- 22 ESLint migrations not reflected in SECURITY_CHECKLIST
- SSRF allowlist has no automated checker AND no FIX_TEMPLATE

### 3.5 Pipeline Throughput Metrics

```
Discovery (406 reviews)
    │
    ├─ ~275 patterns documented ───► Discovery Rate: 6.8 per 10 reviews (GOOD)
    │
    ├─ 6 auto-promoted ────────────► Auto-Promotion Rate: 2.2% (POOR)
    │  269 manually promoted          Manual Promotion Rate: 97.8%
    │
    ├─ 65 enforced ────────────────► Enforcement Rate: 24% (POOR)
    │
    └─ Pipeline Velocity: Unknown ─► No timestamps on promotion decisions
```

---

## 4. Component Scorecards

### 4.1 reviews.jsonl

| Dimension   | Rating                                                       | Detail                                                                          |
| ----------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Purpose     | Structured review data for analytics                         |                                                                                 |
| Health      | **F**                                                        | 85–100% data loss on key fields                                                 |
| Utilization | Low                                                          | Consumed by consolidation, effectiveness analyzer, promotion — all get bad data |
| Gaps        | Sync mechanism broken, temporal coverage 7.8%, duplicate IDs |
| Severity    | **S0**                                                       | Foundation of entire analytics pipeline is unreliable                           |

### 4.2 AI_REVIEW_LEARNINGS_LOG.md

| Dimension   | Rating                                                |
| ----------- | ----------------------------------------------------- | --------------------------------------------------- |
| Purpose     | Primary review record                                 |
| Health      | **B+**                                                | Rich, detailed, consistently maintained             |
| Utilization | High                                                  | Authoritative source, used by retros, session-start |
| Gaps        | No structured parsing — richness trapped in free-text |
| Severity    | S3                                                    |

### 4.3 Archive System (13 files)

| Dimension   | Rating                                          |
| ----------- | ----------------------------------------------- | ------------------------------------------ |
| Purpose     | Historical review storage                       |
| Health      | **C**                                           | 3 overlaps, 7 gaps, duplicate numbering    |
| Utilization | Medium                                          | Referenced by retros for cross-PR analysis |
| Gaps        | No integrity verification, no dedup on rotation |
| Severity    | S2                                              |

### 4.4 run-consolidation.js

| Dimension   | Rating                                                            |
| ----------- | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| Purpose     | Extract patterns from reviews                                     |
| Health      | **C+**                                                            | Works but counter was reset, suggested rules are dead ends |
| Utilization | Medium                                                            | 17 runs total, auto-triggered at threshold                 |
| Gaps        | Output (suggested-rules.md) never consumed, counter discontinuity |
| Severity    | S2                                                                |

### 4.5 promote-patterns.js

| Dimension   | Rating                                                 |
| ----------- | ------------------------------------------------------ | -------------------------------------------- |
| Purpose     | Auto-promote recurring patterns to CODE_PATTERNS       |
| Health      | **D**                                                  | Exists but barely used (6 patterns in 1 run) |
| Utilization | Very Low                                               | Not integrated into any workflow             |
| Gaps        | Depends on reviews.jsonl patterns[] which is 85% empty |
| Severity    | S1                                                     |

### 4.6 check-pattern-compliance.js

| Dimension   | Rating                                   |
| ----------- | ---------------------------------------- | ------------------------------------------- |
| Purpose     | Automated pattern enforcement            |
| Health      | **B**                                    | 43 regex rules actively catching violations |
| Utilization | High                                     | Runs at pre-commit and session-start        |
| Gaps        | Only 24% coverage of documented patterns |
| Severity    | S2 (coverage gap)                        |

### 4.7 ESLint Custom Plugin (22 rules)

| Dimension   | Rating                                                           |
| ----------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| Purpose     | AST-based pattern enforcement                                    |
| Health      | **B+**                                                           | Well-tested, AST-based (more reliable than regex) |
| Utilization | High                                                             | Runs at pre-commit via lint                       |
| Gaps        | Migration from regex checker not reflected in SECURITY_CHECKLIST |
| Severity    | S3                                                               |

### 4.8 CODE_PATTERNS.md

| Dimension   | Rating                                                      |
| ----------- | ----------------------------------------------------------- | --------------------------------------------------- |
| Purpose     | Pattern documentation reference (~275 patterns)             |
| Health      | **B**                                                       | Comprehensive, versioned, regularly updated         |
| Utilization | High                                                        | Referenced by AI, consolidation, compliance checker |
| Gaps        | No explicit entry for "regex two-strikes" (CLAUDE.md top-5) |
| Severity    | S3                                                          |

### 4.9 FIX_TEMPLATES.md

| Dimension | Rating                                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Purpose   | Copy-paste fix templates (34)                                                                                    |
| Health    | **B-**                                                                                                           | All 34 map to patterns, no orphans |
| Gaps      | No templates for: SSRF, defense-in-depth, all React/Frontend (22), all Process Mgmt (12), all Security Audit (8) |
| Severity  | S2                                                                                                               |

### 4.10 SECURITY_CHECKLIST.md

| Dimension   | Rating                        |
| ----------- | ----------------------------- | -------------------------------------------------------- |
| Purpose     | Pre-write security reference  |
| Health      | **C-**                        | 22 ESLint migrations not reflected, test mocking missing |
| Utilization | Medium                        | Referenced in CLAUDE.md                                  |
| Gaps        | Drift from other pattern docs |
| Severity    | S2                            |

### 4.11 pr-retro Skill

| Dimension   | Rating                                                    |
| ----------- | --------------------------------------------------------- | ------------------------------------------------ |
| Purpose     | Post-merge retrospective analysis                         |
| Health      | **B**                                                     | Well-structured protocol with cross-PR detection |
| Utilization | 59% coverage (16/27 PRs)                                  |
| Gaps        | Deferred items are counts not lists, S1 escalation unused |
| Severity    | S1 (deferred tracking gap)                                |

### 4.12 pr-review Skill

| Dimension   | Rating                                                        |
| ----------- | ------------------------------------------------------------- | --------------------------------------------------- |
| Purpose     | External review feedback processing                           |
| Health      | **B-**                                                        | Active but invocations not tracked by agent tracker |
| Utilization | Regular                                                       | Used for every PR with external reviews             |
| Gaps        | Bypasses Task tool → agent-invocations.jsonl doesn't track it |
| Severity    | S2                                                            |

### 4.13 sync-reviews-to-jsonl.js

| Dimension   | Rating                                                            |
| ----------- | ----------------------------------------------------------------- | --------------------------------------------- |
| Purpose     | Bridge markdown → JSONL                                           |
| Health      | **F**                                                             | 85–100% field data loss                       |
| Utilization | Auto (session-start)                                              | Runs every session but produces broken output |
| Gaps        | Doesn't parse resolution counts, severity, patterns from markdown |
| Severity    | **S0**                                                            |

### 4.14 sync-sonarcloud.js

| Dimension   | Rating                            |
| ----------- | --------------------------------- | ----------------------------------------------- |
| Purpose     | SonarCloud → MASTER_DEBT pipeline |
| Health      | **B**                             | Well-integrated with severity mapping and dedup |
| Utilization | Regular                           | Used via skill and CLI                          |
| Gaps        | **No test coverage**              |
| Severity    | S2                                |

### 4.15 Pre-Commit/Pre-Push Gates

| Dimension   | Rating                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------- | --------------------------- |
| Purpose     | Commit-time and push-time enforcement                                                             |
| Health      | **B-**                                                                                            | 20 gates with 131 overrides |
| Utilization | High                                                                                              | Every commit/push           |
| Gaps        | Cross-doc deps overridden 48.9% (miscalibrated), code-reviewer gate well-calibrated (4.6% bypass) |
| Severity    | S2 (cross-doc calibration)                                                                        |

### 4.16 Override Logging

| Dimension   | Rating                                      |
| ----------- | ------------------------------------------- | ---------------------------------- |
| Purpose     | Track gate bypass decisions                 |
| Health      | **B**                                       | 131 entries with reasons           |
| Utilization | Passive                                     | Logged but not analyzed or alerted |
| Gaps        | No threshold alerts for high override rates |
| Severity    | S3                                          |

### 4.17 Agent Invocation Tracker

| Dimension   | Rating                                     |
| ----------- | ------------------------------------------ | --------------------------------- |
| Purpose     | Track which agents are invoked per session |
| Health      | **C**                                      | Only tracks Task-tool invocations |
| Utilization | Partial                                    | Feeds pre-push gate 3a            |
| Gaps        | pr-review skill bypasses tracker entirely  |
| Severity    | S2                                         |

### 4.18 Qodo Configuration

| Dimension   | Rating                                                        |
| ----------- | ------------------------------------------------------------- | ------------------------------------- |
| Purpose     | Control Qodo PR-Agent behavior                                |
| Health      | **B-**                                                        | 19 suppression rules from PR friction |
| Utilization | Active                                                        | Every PR                              |
| Gaps        | Suppression debt — rules reference specific PRs, may be stale |
| Severity    | S3                                                            |

### 4.19 Session-Start Automation

| Dimension   | Rating                                             |
| ----------- | -------------------------------------------------- | ------------------- |
| Purpose     | Auto-sync reviews, rotate archives, run compliance |
| Health      | **B**                                              | Reliable automation |
| Utilization | Every session                                      |
| Gaps        | Calls broken sync script, no test coverage         |
| Severity    | S2 (inherits sync-reviews-to-jsonl issues)         |

### 4.20 Skill Ecosystem (27 review-related)

| Dimension   | Rating                                                                    |
| ----------- | ------------------------------------------------------------------------- | ---------------------------------------------- |
| Purpose     | 6 core review + 21 audit variants                                         |
| Health      | **C+**                                                                    | Core skills mature, audit variants may overlap |
| Utilization | Variable                                                                  | Core 6 heavily used, audit variants sporadic   |
| Gaps        | Potential skill sprawl — 21 audit variants for a single-developer project |
| Severity    | S3                                                                        |

---

## 5. Effectiveness Metrics

### 5.1 Pipeline Throughput (discovery → enforcement)

| Metric                    | Formula                       | Value          | Rating                           |
| ------------------------- | ----------------------------- | -------------- | -------------------------------- |
| Discovery rate            | New patterns per 10 reviews   | 6.8            | **Good** (≥3)                    |
| Promotion rate            | Promoted / discovered         | ~100% manually | **Good** (manual path works)     |
| Auto-promotion rate       | Auto-promoted / total         | 2.2%           | **Poor** (<20%)                  |
| Enforcement rate          | Enforced / promoted           | 24%            | **Poor** (<30%)                  |
| Pipeline velocity         | Days: discovery → enforcement | Unknown        | **Unmeasurable** (no timestamps) |
| Suggested rule conversion | Converted / generated         | 0%             | **Critical** (22 sitting idle)   |

### 5.2 Quality Metrics (recurrence, FP rate, churn)

| Metric            | Formula                                | Value                 | Rating                                 |
| ----------------- | -------------------------------------- | --------------------- | -------------------------------------- |
| Recurrence rate   | Patterns recurring after documentation | 15/275 tracked (5.5%) | **Good** (<10%) but data is incomplete |
| FP rate (overall) | Rejected / total items                 | 330/1641 = 20.1%      | **Average** (15–30%)                   |
| Churn ratio       | Avg review rounds                      | 5.1 rounds/PR         | **Poor** (>3 indicates churn)          |
| Fix-or-track rate | (Fixed + tracked as DEBT) / total      | ~68%                  | **Poor** (<80%)                        |

**Note on recurrence:** The learning effectiveness dashboard tracks 15 patterns
with recurrences. However, this uses JSONL data which is 85% empty. Actual
recurrence is likely higher but unmeasurable.

### 5.3 Coverage Metrics (JSONL completeness, retro coverage)

| Metric             | Formula                               | Value | Rating               |
| ------------------ | ------------------------------------- | ----- | -------------------- |
| JSONL completeness | Non-zero fields / total               | ~18%  | **Poor** (<60%)      |
| Temporal coverage  | JSONL entries / total reviews         | 7.8%  | **Poor**             |
| Retro coverage     | PRs w/ retros / PRs w/ reviews        | 59%   | **Average** (50–79%) |
| Pattern yield      | Reviews w/ patterns in JSONL / total  | 15%   | **Poor** (<40%)      |
| Learning capture   | Reviews w/ learnings in JSONL / total | 15%   | **Poor** (<80%)      |

### 5.4 Outcome Metrics (round trends, pre-check catch rate)

| Metric                | Formula                                              | Value                                           | Rating           |
| --------------------- | ---------------------------------------------------- | ----------------------------------------------- | ---------------- |
| Round trend           | Comparison over time                                 | Insufficient data (12 days of JSONL)            | **Unmeasurable** |
| Pre-check catch rate  | Pre-check catches / total issues                     | Pattern checker catches some; no aggregate data | **Unmeasurable** |
| Action item impl rate | Retros with implementation commits / total           | 75%                                             | **Good** (≥70%)  |
| Deferred resolution   | Resolved DEBT from reviews / total DEBT from reviews | 6.9%                                            | **Poor** (<20%)  |

### 5.5 Composite Scores

| Tier        | Category            | Score                                                                    |
| ----------- | ------------------- | ------------------------------------------------------------------------ |
| 1           | Pipeline Throughput | **D** (discovery good, enforcement poor, automation broken)              |
| 2           | Quality             | **C-** (FP rate ok, churn high, fix-or-track low)                        |
| 3           | Coverage            | **F** (JSONL broken, yields near zero)                                   |
| 4           | Outcomes            | **C** (action items good, deferred resolution poor, trends unmeasurable) |
| **Overall** |                     | **D+**                                                                   |

---

## 6. Retro & Learning Analysis

### 6.1 Action Item Implementation Rate

| Category              | Generated | Implemented             | Rate     |
| --------------------- | --------- | ----------------------- | -------- |
| Automation candidates | 14        | ~10 (via retro commits) | ~71%     |
| Skills to update      | 6         | ~5                      | ~83%     |
| Process improvements  | 30        | ~20                     | ~67%     |
| **Total**             | **50**    | **~35**                 | **~70%** |

Evidence: 27 commits with "retro action" in messages, 72 commits mentioning
"retro". 12 of 16 retros (75%) have at least one implementation commit.

**Gap:** Individual action item tracking is absent. DEBT-3528 self-reports "4 of
~14 action items tracked as DEBT" (~29%). The system generates action items but
has no item-level follow-through tracking.

### 6.2 Deferred Item Triage Status

| PR#       | Deferred Count | Tracked as DEBT | Resolution |
| --------- | -------------- | --------------- | ---------- |
| 367       | 6              | Unknown         | Unknown    |
| 370       | 1              | Unknown         | Unknown    |
| 374       | 5              | ~1              | ~20%       |
| 379       | 4              | ~1              | ~25%       |
| 383       | **67**         | ~3              | ~4%        |
| 392       | 4              | ~1              | ~25%       |
| 394       | **35**         | ~2              | ~6%        |
| 396       | 1              | 0               | 0%         |
| **Total** | **123**        | **~8**          | **~6.5%**  |

**Critical finding:** 123 deferred items exist as counts, not itemized lists.
There is no mechanism to:

1. Know what was deferred (items are aggregated into a single number)
2. Track if deferred items were resolved in later PRs
3. Escalate items deferred in multiple PRs
4. Distinguish "intentionally deferred" from "forgotten"

PR #383 alone deferred 67 items and PR #394 deferred 35 items. These 102 items
represent real review findings that have no resolution path.

### 6.3 Cross-PR Systemic Detection Quality

The pr-retro skill has explicit cross-PR detection (Step 1.4: check previous
retros, Step 5.2: flag repeat offenders). Evidence of it working:

| Pattern             | Cross-PR Occurrences | Detection          | Resolution                  |
| ------------------- | -------------------- | ------------------ | --------------------------- |
| CC reduction        | 5 retros             | Detected           | Automated (pre-commit hook) |
| Propagation         | 6 retros             | Detected           | Partially automated         |
| Algorithm hardening | 2 retros             | Detected, BLOCKING | Unresolved                  |
| Path normalization  | 4 retros             | Detected           | Template created            |
| Fix-one-audit-all   | 2 retros             | Detected           | Generalized from pattern 5  |

**Assessment:**

- Detection rate: **High** — system reliably identifies cross-PR patterns
- Resolution rate: **Medium** — templates created but problems recur
- Escalation rate: **Low** — only 1 of 8 active patterns escalated to BLOCKING
- S1 escalation mechanism exists but is **unused in practice**

### 6.4 Known Pattern Staleness

| Pattern                     | Status       | Last Seen | Assessment                                |
| --------------------------- | ------------ | --------- | ----------------------------------------- |
| #1 CC >15                   | IMPLEMENTED  | PR #394   | Resolved — automated in pre-commit        |
| #2 Incremental Security     | ADDRESSED    | PR #374   | Resolved — via FIX_TEMPLATES              |
| #3 JSONL Quality            | IMPLEMENTED  | PR #371   | Resolved — Qodo config                    |
| #4 Pattern Checker          | ADDRESSED    | PR #388   | Resolved                                  |
| #5 Propagation              | "ARCHIVED"   | PR #394   | **NOT resolved** — renamed as Pattern #13 |
| #6 FS Guard Lifecycle       | Active       | PR #374   | Active, low frequency                     |
| #7 Path Containment         | Active       | PR #374   | Active, low frequency                     |
| #8 Algorithm Hardening      | **BLOCKING** | PR #394   | Critical — drove 12-round PR              |
| #9 Dual-File JSONL          | Active       | PR #383   | Active                                    |
| #10 Stale Reviewer Comments | Active       | PR #388   | Active                                    |
| #11 Cross-Platform Path     | Active       | PR #392   | Active                                    |
| #12 ChainExpression         | Active       | PR #394   | Active                                    |
| #13 Fix-One-Audit-All       | Active       | PR #394   | Active — generalization of #5             |

**Resolution rate:** 5/13 = 38% (but #5 was falsely archived)

---

## 7. Touchpoint Analysis

### 7.1 TDMS Integration

| Touchpoint                      | Status        | Data Quality                                    |
| ------------------------------- | ------------- | ----------------------------------------------- |
| Review → DEBT (via pr-retro)    | Active        | 638 review-sourced items (7.6% of total DEBT)   |
| SonarCloud → DEBT (via sync)    | Active        | Well-integrated with severity mapping           |
| Deferred → DEBT conversion      | **Broken**    | ~5–8% conversion rate                           |
| DEBT resolution of review items | **Very slow** | 6.9% resolved, 87.5% stuck in VERIFIED          |
| Duplicate DEBT entries          | Bug           | 7 duplicate pairs from pr-retro (dedup failure) |

### 7.2 Session Ecosystem

| Touchpoint                             | Status                            |
| -------------------------------------- | --------------------------------- |
| Session-start → review sync            | Active (calls broken sync script) |
| Session-start → archive rotation       | Active                            |
| Session-start → pattern compliance     | Active                            |
| Session-start → consolidation          | Active (auto at threshold)        |
| Session-start → effectiveness analysis | Active                            |
| Session-end → agent compliance check   | Active (checks invocation log)    |

### 7.3 Hook Ecosystem

| Touchpoint                      | Status | Override Rate                           |
| ------------------------------- | ------ | --------------------------------------- |
| Pre-commit → pattern compliance | Active | 16% override rate                       |
| Pre-commit → audit S0/S1        | Active | 15.3% override rate                     |
| Pre-commit → cross-doc deps     | Active | **48.9% override rate** (miscalibrated) |
| Pre-push → code-reviewer gate   | Active | 4.6% override rate (well-calibrated)    |
| Pre-push → propagation check    | Active | Unknown                                 |
| PostToolUse → agent tracking    | Active | Misses skill invocations                |
| PostToolUse → write validation  | Active | 10 sub-validators                       |

### 7.4 SonarCloud/Qodo/Gemini

| Integration                | Status | Friction                                 |
| -------------------------- | ------ | ---------------------------------------- |
| SonarCloud → GitHub Action | Active | 778 baseline issues, gradual reduction   |
| SonarCloud → MCP tools     | Active | Direct querying available                |
| SonarCloud → DEBT sync     | Active | Well-integrated, no tests                |
| Qodo PR-Agent              | Active | **19 suppression rules** (friction debt) |
| Gemini                     | Active | Config not in-repo (GitHub-level)        |

---

## 8. Workflow Test Gap Analysis

### 8.1 Contract Test Inventory (10 handoffs)

| #   | Handoff                       | Producer            | Consumer                          | Test?       | Evidence                                                        |
| --- | ----------------------------- | ------------------- | --------------------------------- | ----------- | --------------------------------------------------------------- |
| 1   | Review entry → JSONL          | pr-review           | sync-reviews-to-jsonl.js          | **None**    | No test file found                                              |
| 2   | JSONL → Consolidation         | sync script         | run-consolidation.js              | **None**    | No test file found                                              |
| 3   | Consolidation → CODE_PATTERNS | consolidation       | CODE_PATTERNS.md                  | **None**    | No test file found                                              |
| 4   | Patterns → Compliance checker | CODE_PATTERNS.md    | check-pattern-compliance.js       | **Partial** | 2 test files exist but test rule behavior, not pattern coverage |
| 5   | Review → Retro                | pr-review entries   | pr-retro skill                    | **None**    | No test file found                                              |
| 6   | Retro → DEBT                  | pr-retro            | /add-debt                         | **None**    | No test file found                                              |
| 7   | Archive → Search              | archive-reviews.js  | pr-retro                          | **None**    | No test file found                                              |
| 8   | JSONL → Effectiveness         | reviews.jsonl       | analyze-learning-effectiveness.js | **None**    | No test file found                                              |
| 9   | JSONL → Ecosystem audit       | reviews.jsonl       | pr-ecosystem-audit checkers       | **None**    | No test file found                                              |
| 10  | Promote → CODE_PATTERNS       | promote-patterns.js | CODE_PATTERNS.md                  | **None**    | No test file found                                              |

**Contract test coverage: 1/10 (10%), partial**

### 8.2 E2E Pipeline Test Inventory (7 pipelines)

| #   | Pipeline                                                 | Coverage | Notes                                                     |
| --- | -------------------------------------------------------- | -------- | --------------------------------------------------------- |
| 1   | Capture → Storage (full round-trip)                      | **None** | No test verifies review markdown produces correct JSONL   |
| 2   | Storage → Analysis (consolidation consumes JSONL)        | **None** | No test verifies consolidation reads JSONL correctly      |
| 3   | Analysis → Promotion (patterns flow to CODE_PATTERNS)    | **None** | No test verifies promoted patterns appear in doc          |
| 4   | Promotion → Enforcement (new pattern catches violations) | **None** | No test verifies a new CODE_PATTERNS entry gets a checker |
| 5   | Retro → Action tracking (action items become DEBT)       | **None** | No test verifies retro → DEBT flow                        |
| 6   | Archive → Search (archived reviews findable by retro)    | **None** | No test verifies search across archives                   |
| 7   | Full pipeline smoke test (review → enforcement)          | **None** | No end-to-end test exists                                 |

**E2E test coverage: 0/7 (0%)**

### 8.3 Missing Test Catalog

| Priority | Component                 | Why It Needs Tests                                                   |
| -------- | ------------------------- | -------------------------------------------------------------------- |
| **P0**   | sync-reviews-to-jsonl.js  | Root cause of JSONL data loss — needs field-level contract test      |
| **P0**   | run-consolidation.js      | Consumes broken data, output never used — needs E2E test             |
| **P1**   | check-cross-doc-deps.js   | 48.9% override rate suggests false positives — needs regression test |
| **P1**   | sync-sonarcloud.js        | Well-integrated but zero test coverage — regression risk             |
| **P1**   | promote-patterns.js       | Barely used, needs test to build confidence for automation           |
| **P1**   | check-propagation.js      | Pre-push gate with no test                                           |
| **P2**   | session-start.js hook     | Orchestrates 5+ review operations — needs integration test           |
| **P2**   | track-agent-invocation.js | Feeds pre-push gate — needs correctness test                         |
| **P2**   | post-write-validator.js   | 10 sub-validators — needs regression suite                           |
| **P2**   | log-override.js           | Audit trail component — needs format contract test                   |
| **P3**   | check-review-needed.js    | Drives GitHub workflow — needs threshold test                        |
| **P3**   | assign-review-tier.js     | Drives GitHub workflow — needs label test                            |
| **P3**   | check-agent-compliance.js | Warning gate — lower priority                                        |
| **P3**   | commit-tracker.js         | Indirect review dependency — lower priority                          |

---

## 9. Gap Catalog (Known + Discovered)

### Known Gaps (from pre-diagnosis understanding)

| ID    | Gap                                         | Evidence                                                                         | Severity | Impact                                        | Effort                     |
| ----- | ------------------------------------------- | -------------------------------------------------------------------------------- | -------- | --------------------------------------------- | -------------------------- |
| KG-1  | Deferred items counted but never triaged    | 123 items across 8 retros, ~5–8% conversion to DEBT                              | **S0**   | Review findings vanish; no accountability     | Medium (change data model) |
| KG-2  | JSONL stores ~30% of downstream needs       | 85–100% field loss documented in §2.2                                            | **S0**   | All analytics broken                          | High (rebuild sync)        |
| KG-3  | Pattern promotion fully manual              | 6/275 auto-promoted (2.2%), promote-patterns.js unused                           | **S1**   | Bottleneck at human curation step             | Medium                     |
| KG-4  | No throughput tracking                      | Pipeline velocity unmeasurable, no timestamps                                    | **S1**   | Cannot measure improvement                    | Medium                     |
| KG-5  | No "is this improving code quality" metrics | Round trends unmeasurable, pre-check catch rate unknown                          | **S1**   | Cannot justify ecosystem investment           | High                       |
| KG-6  | No workflow-level tests                     | 0/7 E2E tests, 1/10 contract tests (partial)                                     | **S1**   | Silent breakage possible                      | High                       |
| KG-7  | Archive overlap/gaps                        | 3 overlapping ranges, 7 coverage gaps, duplicate numbering                       | **S2**   | Search returns inconsistent/duplicate results | Low                        |
| KG-8  | Suggested rules are dead ends               | 22 TODO templates unconverted in consolidation-output                            | **S2**   | Consolidation output wasted                   | Low                        |
| KG-9  | Cross-doc sync drift                        | Test mocking missing from SECURITY_CHECKLIST; 22 ESLint migrations not reflected | **S2**   | Inconsistent guidance across docs             | Medium                     |
| KG-10 | S1 escalation mechanism unused              | Step 5.2 "Flag Repeat Offenders" exists but no S1 escalations found              | **S2**   | Repeat patterns don't get prioritized         | Low                        |
| KG-11 | Review-sourced DEBT resolution rate 6.9%    | 558/638 items stuck in VERIFIED status                                           | **S1**   | DEBT accumulates without clearing             | Medium                     |
| KG-12 | Recurring deferrals undetectable            | Deferred items are counts, same item across PRs unknowable                       | **S0**   | Related to KG-1, compounding effect           | Medium                     |
| KG-13 | Source attribution destroyed                | 88% collapsed to "manual" in JSONL                                               | **S2**   | Cannot measure per-source FP rates            | Low (part of KG-2 fix)     |

### Newly Discovered Gaps

| ID    | Gap                                                 | Evidence                                                                        | Severity | Impact                                                    | Effort  |
| ----- | --------------------------------------------------- | ------------------------------------------------------------------------------- | -------- | --------------------------------------------------------- | ------- |
| NG-1  | pr-review invocations not tracked                   | Skill invocation bypasses Task-tool tracker entirely                            | **S2**   | Pre-push gate only validates code-reviewer, not pr-review | Low     |
| NG-2  | Consolidation counter reset without documentation   | State file says #4, version history shows #18 historical                        | **S3**   | Historical analysis confusion                             | Trivial |
| NG-3  | Pattern tag granularity too coarse                  | reviews.jsonl uses meta-categories (qodo, ci) not specific pattern IDs          | **S1**   | Data-driven promotion unreliable, recurrence unmeasurable | Medium  |
| NG-4  | Cross-doc deps gate miscalibrated                   | 48.9% override rate (64/131 overrides)                                          | **S2**   | Gate generates friction without proportionate value       | Medium  |
| NG-5  | 7 duplicate DEBT entry pairs from pr-retro          | DEBT-2236/10673, DEBT-2364/10798, etc.                                          | **S2**   | TDMS dedup pipeline failure for retro-sourced items       | Low     |
| NG-6  | Retro arithmetic mismatches                         | 4 retros have fixed+rejected+deferred < totalItems (up to 63 items unaccounted) | **S2**   | Possible uncategorized item types not tracked             | Low     |
| NG-7  | 19 Qodo suppression rules accumulated               | Rules reference PRs #366–#396, may be stale                                     | **S3**   | Suppression debt — legitimate issues may be suppressed    | Low     |
| NG-8  | Pattern 5 falsely archived but recurs as Pattern 13 | "Propagation" archived, "Fix-One-Audit-All" is the same root cause              | **S2**   | False resolution inflates pattern resolution rate         | Trivial |
| NG-9  | No templates for critical security patterns         | SSRF, defense-in-depth, git pathspec magic — all documented but no FIX_TEMPLATE | **S2**   | Harder to fix correctly without template guidance         | Medium  |
| NG-10 | 10/14 critical pipeline scripts have no tests       | Detailed in §8.3                                                                | **S1**   | Any refactor could silently break the pipeline            | High    |
| NG-11 | Skill sprawl (27 review-related skills)             | 6 core + 21 audit variants for single-developer project                         | **S3**   | Maintenance burden, potential confusion                   | Medium  |
| NG-12 | Gemini config not in-repo                           | No .gemini/ directory, configured at GitHub level                               | **S3**   | Not version-controlled, changes not auditable             | Low     |
| NG-13 | JSONL duplicate IDs                                 | id 367 and 368 each appear twice with different content                         | **S2**   | Incorrect analytics, potential data corruption            | Low     |
| NG-14 | Override log not analyzed                           | 131 entries logged but never reviewed for patterns                              | **S3**   | Override insights wasted                                  | Low     |

### Gap Severity Distribution

| Severity  | Known  | New                          | Total  |
| --------- | ------ | ---------------------------- | ------ |
| S0        | 3      | 0                            | 3      |
| S1        | 4      | 3                            | 7      |
| S2        | 4      | 8                            | 12     |
| S3        | 2      | 4                            | 6      |
| **Total** | **13** | **14** (exceeds target of 5) | **27** |

---

## 10. Recommendations

### Phase 1: Foundation Repair (highest impact, addresses S0 gaps)

| #   | Recommendation                                                                                                                                                 | Addresses   | Impact   | Effort    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------- | --------- |
| 1.1 | **Rebuild sync-reviews-to-jsonl.js** — Parse all fields from markdown: source detail, fixed/deferred/rejected counts, severity, patterns, learnings, PR number | KG-2, KG-13 | Critical | 4–8 hours |
| 1.2 | **Backfill JSONL** — Run rebuilt sync against all 13 archives + active log to populate full history                                                            | KG-2        | Critical | 2–4 hours |
| 1.3 | **Itemize deferred items** — Change retro data model from `deferred: 67` to `deferred: [{item, source, severity}, ...]` in reviews.jsonl                       | KG-1, KG-12 | Critical | 4–8 hours |
| 1.4 | **Add JSONL contract test** — Test that sync-reviews-to-jsonl.js produces correct output for sample markdown                                                   | KG-6, NG-10 | High     | 2–4 hours |

### Phase 2: Pipeline Hardening (addresses S1 gaps)

| #   | Recommendation                                                                                                                                | Addresses | Impact | Effort     |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ | ---------- |
| 2.1 | **Add specific pattern IDs** — Replace coarse tags (qodo, ci) with specific pattern slugs in reviews.jsonl                                    | NG-3      | High   | 2–4 hours  |
| 2.2 | **Integrate promote-patterns.js into session-end** — Auto-run promotion check before session ends                                             | KG-3      | High   | 1–2 hours  |
| 2.3 | **Convert suggested rules to actual rules** — Process the 22 pending TODO templates                                                           | KG-8      | Medium | 4–8 hours  |
| 2.4 | **Add test coverage for critical scripts** — Priority: sync-sonarcloud.js, check-cross-doc-deps.js, promote-patterns.js, check-propagation.js | NG-10     | High   | 8–16 hours |
| 2.5 | **Create DEBT triage workflow for review items** — Auto-triage VERIFIED review DEBT items at session-start                                    | KG-11     | Medium | 2–4 hours  |
| 2.6 | **Add pipeline throughput tracking** — Timestamp when patterns are discovered, promoted, and enforced                                         | KG-4      | Medium | 2–4 hours  |

### Phase 3: Coverage Expansion (addresses S2 gaps)

| #   | Recommendation                                                                               | Addresses   | Impact | Effort     |
| --- | -------------------------------------------------------------------------------------------- | ----------- | ------ | ---------- |
| 3.1 | **Expand enforcement to 50%** — Add checkers for highest-recurrence unenforced patterns      | S2 coverage | High   | 8–16 hours |
| 3.2 | **Sync SECURITY_CHECKLIST** — Reflect 22 ESLint migrations, add test mocking                 | KG-9        | Medium | 1–2 hours  |
| 3.3 | **Fix archive overlaps** — Deduplicate #366–#369 across 3 files, resolve numbering collision | KG-7, NG-13 | Low    | 1–2 hours  |
| 3.4 | **Recalibrate cross-doc deps gate** — Reduce false positive rate from 48.9%                  | NG-4        | Medium | 2–4 hours  |
| 3.5 | **Track pr-review invocations** — Add skill invocation tracking alongside agent tracking     | NG-1        | Low    | 1–2 hours  |
| 3.6 | **Add missing FIX_TEMPLATES** — SSRF, defense-in-depth, git pathspec magic                   | NG-9        | Medium | 2–4 hours  |
| 3.7 | **Enable S1 escalation** — Implement auto-escalation when item deferred in 2+ PRs            | KG-10       | Medium | 2–4 hours  |

### Phase 4: Metrics & Observability (addresses quality-of-life gaps)

| #   | Recommendation                                                                                                   | Addresses | Impact  | Effort    |
| --- | ---------------------------------------------------------------------------------------------------------------- | --------- | ------- | --------- |
| 4.1 | **Build effectiveness dashboard** — Per-component scorecards from this diagnosis, refreshable                    | KG-5      | Medium  | 4–8 hours |
| 4.2 | **Add E2E pipeline smoke test** — At minimum: review markdown → JSONL → consolidation → pattern in CODE_PATTERNS | KG-6      | Medium  | 4–8 hours |
| 4.3 | **Fix consolidation counter** — Document reset, reconcile with version history                                   | NG-2      | Low     | 30 min    |
| 4.4 | **Audit Qodo suppressions** — Review 19 rules for staleness, remove resolved ones                                | NG-7      | Low     | 1–2 hours |
| 4.5 | **Override rate alerting** — Alert when any gate exceeds 30% override rate                                       | NG-14     | Low     | 1–2 hours |
| 4.6 | **Correct Pattern #5 archive status** — Mark as "renamed to #13" not "resolved"                                  | NG-8      | Trivial | 15 min    |

### Dependency Chains

```
Phase 1.1 (rebuild sync) ──► Phase 1.2 (backfill) ──► Phase 2.1 (pattern IDs)
                                                         │
Phase 1.3 (itemize deferred) ──► Phase 3.7 (auto-escalation)
                                                         │
Phase 1.4 (contract test) ──► Phase 2.4 (more tests) ──► Phase 4.2 (E2E smoke)
                                                         │
Phase 2.2 (integrate promotion) ──► Phase 2.3 (convert suggested rules)
                                                         │
Phase 2.6 (throughput tracking) ──► Phase 4.1 (dashboard)
```

### Estimated Total Effort

| Phase     | Effort Range     | S0/S1 Gaps Addressed   |
| --------- | ---------------- | ---------------------- |
| Phase 1   | 12–24 hours      | 3 S0 gaps              |
| Phase 2   | 19–38 hours      | 4 S1 gaps              |
| Phase 3   | 16–34 hours      | 0 (S2 only)            |
| Phase 4   | 10–20 hours      | 0 (quality-of-life)    |
| **Total** | **57–116 hours** | **7 of 10 S0/S1 gaps** |

---

## Appendices

### Appendix A: Raw Data Tables

#### A.1 JSONL Entry Summary (45 entries)

| Type          | Count | Date Range               | ID Range               |
| ------------- | ----- | ------------------------ | ---------------------- |
| Review        | 33    | 2026-02-20 to 2026-02-27 | 364–406                |
| Retrospective | 12    | 2026-02-16 to 2026-02-27 | retro-367 to retro-396 |

#### A.2 Retro Aggregate Statistics

| Metric                                 | Value         |
| -------------------------------------- | ------------- |
| Total review items                     | 1,641         |
| Fixed                                  | 1,019 (62.1%) |
| Rejected                               | 330 (20.1%)   |
| Deferred                               | 123 (7.5%)    |
| Unaccounted (arithmetic gaps)          | 169 (10.3%)   |
| Average rounds/PR                      | 5.1           |
| Median rounds/PR                       | 4.5           |
| Max rounds (PR #394)                   | 12            |
| Min rounds (PR #371, #393, #395, #396) | 2             |

#### A.3 Consolidation Run History

| System            | Runs        | Reviews Processed | Patterns Added |
| ----------------- | ----------- | ----------------- | -------------- |
| Old (v1.x–v2.x)   | 13 (#6–#18) | #61–#284          | ~227           |
| New (JSONL-based) | 4 (#1–#4)   | #1–#406           | ~6 auto        |
| **Total**         | **~17**     | **#1–#406**       | **~275**       |

#### A.4 Override Log Summary (131 entries)

| Check                      | Count | %     | Assessment      |
| -------------------------- | ----- | ----- | --------------- |
| cross-doc-deps + cross-doc | 64    | 48.9% | Miscalibrated   |
| pattern-compliance         | 21    | 16.0% | Moderate        |
| audit-s0s1                 | 20    | 15.3% | Moderate        |
| triggers                   | 8     | 6.1%  | Acceptable      |
| reviewer                   | 6     | 4.6%  | Well-calibrated |
| doc-index                  | 6     | 4.6%  | Acceptable      |
| doc-header                 | 6     | 4.6%  | Acceptable      |

#### A.5 Review-Sourced DEBT Status

| Status         | Count   | %     |
| -------------- | ------- | ----- |
| VERIFIED       | 558     | 87.5% |
| RESOLVED       | 44      | 6.9%  |
| NEW            | 26      | 4.1%  |
| FALSE_POSITIVE | 10      | 1.6%  |
| **Total**      | **638** | 100%  |

### Appendix B: Effectiveness Metric Formulas & Benchmarks

| Metric                | Formula                            | Good       | Average | Poor       |
| --------------------- | ---------------------------------- | ---------- | ------- | ---------- |
| Discovery rate        | New patterns per 10 reviews        | ≥3         | 1–2     | 0          |
| Promotion rate        | Promoted / discovered              | ≥40%       | 20–39%  | <20%       |
| Enforcement rate      | Enforced / promoted                | ≥60%       | 30–59%  | <30%       |
| Pipeline velocity     | Days: discovery → enforcement      | <14        | 14–30   | >30        |
| Recurrence rate       | Patterns recurring after promotion | <10%       | 10–25%  | >25%       |
| FP rate               | Rejected / total per source        | <15%       | 15–30%  | >30%       |
| Churn ratio           | Avoidable rounds / total           | <20%       | 20–40%  | >40%       |
| Fix-or-track          | Items w/ fix or DEBT / total       | ≥95%       | 80–94%  | <80%       |
| JSONL completeness    | Non-zero fields / total            | ≥80%       | 60–79%  | <60%       |
| Retro coverage        | PRs w/ retros / PRs w/ reviews     | ≥80%       | 50–79%  | <50%       |
| Pattern yield         | Reviews w/ patterns / total        | ≥70%       | 40–69%  | <40%       |
| Learning capture      | Reviews w/ learnings / total       | ≥80%       | 50–79%  | <50%       |
| Round trend           | Avg rounds now vs prior period     | Decreasing | Flat    | Increasing |
| Pre-check catch rate  | Pre-check catches / total issues   | ≥30%       | 10–29%  | <10%       |
| Action item impl rate | Implemented / total retro items    | ≥70%       | 40–69%  | <40%       |
| Deferred resolution   | Resolved DEBT from reviews / total | ≥50%       | 20–49%  | <20%       |

### Appendix C: Methodology Notes

1. **Data mining phase:** 4 specialized agents ran in parallel, each focused on
   a distinct data domain (data quality, pipeline flow, retro/actions,
   integration). Each agent produced a structured findings report.

2. **Synthesis phase:** Reports were merged by the lead agent, with
   deduplication of overlapping findings and conflict resolution where agents
   reported different numbers for the same metric.

3. **Limitations:**
   - JSONL analysis covers only 45 entries (7.8% of history) — metrics derived
     from JSONL should be considered representative of recent behavior only
   - Archive analysis relied on file headers and grep patterns — some entries in
     summary-only archives may have been missed
   - Action item implementation rate is estimated from git commit messages,
     which may not capture all implementations (some may have been committed
     without retro references)
   - Deferred item resolution estimates are rough due to the counts-only data
     model
   - Consolidation run counts reconcile old system (#6–#18) with new system
     (#1–#4) but the exact mapping of consolidation → patterns added may have
     gaps

4. **Sources analyzed:**
   - `.claude/state/reviews.jsonl` (45 entries)
   - `docs/AI_REVIEW_LEARNINGS_LOG.md` (~1,500 lines)
   - 13 archive files (`docs/archive/REVIEWS_*.md`)
   - `docs/technical-debt/MASTER_DEBT.jsonl` (8,354 items)
   - `.claude/state/consolidation.json`
   - `docs/agent_docs/CODE_PATTERNS.md` (~275 patterns)
   - `scripts/check-pattern-compliance.js` (43 regex rules)
   - `docs/agent_docs/FIX_TEMPLATES.md` (34 templates)
   - `docs/agent_docs/SECURITY_CHECKLIST.md`
   - `scripts/promote-patterns.js`
   - `scripts/run-consolidation.js`
   - `.claude/hooks/` (13 hook files)
   - `.husky/pre-commit`, `.husky/pre-push`
   - `.claude/override-log.jsonl` (131 entries)
   - `.claude/state/agent-invocations.jsonl`
   - `.qodo/pr-agent.toml`
   - `.claude/skills/` (27 review-related skills)
   - `tests/` directory (test inventory)
   - `.github/workflows/` (12 workflows)
   - Git history (commit messages for retro implementation tracking)
