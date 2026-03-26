---
name: pr-ecosystem-audit
description: |
  Comprehensive diagnostic of the PR review ecosystem — 18 categories across 5
  domains with composite health scoring, trend tracking, patch suggestions, and
  interactive finding-by-finding walkthrough. Triggers: "pr ecosystem audit",
  "audit pr ecosystem", "review health", "ecosystem health".
---

<!-- prettier-ignore-start -->
**Document Version:** 1.2
**Last Updated:** 2026-02-24
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# PR Ecosystem Audit

Deep diagnostic of the entire PR review ecosystem — from skill invocation
through pattern enforcement and learning capture. Produces per-category scores,
a composite health grade (A-F), trend tracking across runs, and an interactive
walkthrough with patch suggestions.

**Invocation:** `/pr-ecosystem-audit`

**When to use:** When you want to understand the overall health of the PR review
ecosystem, identify systemic issues, and get actionable recommendations with
specific patches. Unlike `/alerts` (quick signal with 3 review-related
checkers), this is a deep root-cause analysis across 18 categories.

---

## When to Use

- |
- User explicitly invokes `/pr-ecosystem-audit`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## CRITICAL RULES (Read First)

> Read `.claude/skills/_shared/ecosystem-audit/CRITICAL_RULES.md` and follow all
> 8 rules. The rules below are summaries — the shared file is authoritative.

1. **CHECK for saved progress first** (MUST)
2. **ALWAYS run the script first** (MUST)
3. **ALWAYS display the dashboard** (MUST)
4. **Use conversational Q&A for decisions** (MUST) — NEVER use AskUserQuestion
5. **SAVE progress after every decision** (MUST)
6. **Show patch suggestions inline** (SHOULD)
7. **Create TDMS entries** (MUST) for deferred findings
8. **Save decisions** (MUST) to session log

---

## Compaction Guard

> Read `.claude/skills/_shared/ecosystem-audit/COMPACTION_GUARD.md` for the full
> compaction guard protocol (state file schema, resume, save, cleanup).

State file path: `.claude/tmp/pr-audit-progress.json`

---

## Dependency Constraints

This skill runs as a single-threaded sequential workflow (run script, display
dashboard, walk through findings one-by-one). It does not spawn parallel agents
internally. When invoked as part of `/comprehensive-ecosystem-audit`, it runs as
one of 4 independent parallel agents in Stage 1 -- no ordering required relative
to the hook, session, or TDMS audit agents.

---

## Phase 1: Run & Parse

1. Run the audit script:

```bash
node .claude/skills/pr-ecosystem-audit/scripts/run-pr-ecosystem-audit.js
```

2. Parse the v2 JSON output from stdout (progress goes to stderr).

3. Create a session decision log file:
   - Path: `.claude/tmp/ecosystem-audit-session-{YYYY-MM-DD-HHMM}.jsonl`
   - Create `.claude/tmp/` directory if it doesn't exist

---

## Phase 2: Dashboard Overview (compact)

Present a compact header with composite grade and domain breakdown:

```
PR Ecosystem Health: {grade} ({score}/100)  |  Trend: {sparkline} ({delta})
{errors} errors · {warnings} warnings · {info} info  |  {patches} patch suggestions

┌────────────────────────────────┬───────┬──────────┬──────────────┐
│ Category                       │ Score │ Rating   │ Trend        │
├────────────────────────────────┼───────┼──────────┼──────────────┤
│ D1: Process Compliance         │       │          │              │
│   Skill Invocation Fidelity    │  {s}  │ {rating} │ {trend}      │
│   Review Process Completeness  │  {s}  │ {rating} │ {trend}      │
│   Retro Quality & Compliance   │  {s}  │ {rating} │ {trend}      │
│   Learning Capture Integrity   │  {s}  │ {rating} │ {trend}      │
├────────────────────────────────┼───────┼──────────┼──────────────┤
│ D2: Data & State Health        │       │          │              │
│   State File Consistency       │  {s}  │ {rating} │ {trend}      │
│   Archive & Retention Health   │  {s}  │ {rating} │ {trend}      │
│   JSONL Sync Fidelity          │  {s}  │ {rating} │ {trend}      │
├────────────────────────────────┼───────┼──────────┼──────────────┤
│ D3: Pattern Lifecycle          │       │          │              │
│   Pattern Discovery→Automation │  {s}  │ {rating} │ {trend}      │
│   Pattern Enforcement Coverage │  {s}  │ {rating} │ {trend}      │
│   Consolidation Pipeline Health│  {s}  │ {rating} │ {trend}      │
│   Automation Coverage Gap      │  {s}  │ {rating} │ {trend}      │
├────────────────────────────────┼───────┼──────────┼──────────────┤
│ D4: Feedback & Integration     │       │          │              │
│   Feedback Loop Closure        │  {s}  │ {rating} │ {trend}      │
│   Cross-PR Pattern Recurrence  │  {s}  │ {rating} │ {trend}      │
│   External Tool Configuration  │  {s}  │ {rating} │ {trend}      │
│   Cross-System Integration     │  {s}  │ {rating} │ {trend}      │
├────────────────────────────────┼───────┼──────────┼──────────────┤
│ D5: Effectiveness Metrics      │       │          │              │
│   Review Cycle Efficiency      │  {s}  │ {rating} │ {trend}      │
│   Agent Utilization            │  {s}  │ {rating} │ {trend}      │
│   Template & Reference Quality │  {s}  │ {rating} │ {trend}      │
└────────────────────────────────┴───────┴──────────┴──────────────┘
```

Rating badges: good = "Good", average = "Avg", poor = "Poor"

Then say: **"Found N findings to review. Walking through each one
(impact-weighted)..."**

---

## Phase 3: Finding-by-Finding Walkthrough

> Read `.claude/skills/_shared/ecosystem-audit/FINDING_WALKTHROUGH.md` for the
> full walkthrough protocol (finding card, decisions, patches, delegation,
> batching).

Sort findings by `impactScore` descending (highest impact first). DEBT entries
use source_id: `review:pr-ecosystem-audit-{date}`.

**PR-specific:** Include industry benchmarks (DORA, Accelerate) in finding
context cards where applicable.

---

## Phase 4: Summary & Actions

> Read `.claude/skills/_shared/ecosystem-audit/SUMMARY_AND_TRENDS.md` for the
> summary template, trend report template, and verification re-run template.

Write report to `.claude/tmp/pr-audit-report-{YYYY-MM-DD}.md`.

**Process verification:** Run `__tests__/` suite:

```bash
node --test .claude/skills/pr-ecosystem-audit/scripts/__tests__/*.test.js
```

---

## Phase 5: Trend Report (if previous runs exist)

> Uses trend report template from `SUMMARY_AND_TRENDS.md`.

History: `.claude/state/pr-ecosystem-audit-history.jsonl`

---

## Category Reference

### Domain 1: Process Compliance (20% weight)

| Category                    | What It Checks                                                 |
| --------------------------- | -------------------------------------------------------------- |
| Skill Invocation Fidelity   | Are /pr-review's 10 steps actually followed and documented?    |
| Review Process Completeness | Multi-pass parsing, propagation sweeps, pre-push gate running? |
| Retro Quality & Compliance  | All mandatory sections present? Action items tracked as DEBT?  |
| Learning Capture Integrity  | Review entry fields complete? Sequential numbering, no gaps?   |

### Domain 2: Data & State Health (15% weight)

| Category               | What It Checks                                           |
| ---------------------- | -------------------------------------------------------- |
| State File Consistency | reviews.jsonl synced? consolidation pointer valid?       |
| Archive & Retention    | Active review count ≤20? Archives accessible?            |
| JSONL Sync Fidelity    | No drift between markdown and JSONL? No corrupted lines? |

### Domain 3: Pattern Lifecycle & Enforcement (25% weight)

| Category                | What It Checks                                              |
| ----------------------- | ----------------------------------------------------------- |
| Pattern Discovery→Auto  | Discovered patterns flowing to automation? Pipeline health? |
| Enforcement Coverage    | Hooks catching patterns? False positive rate? Graduation?   |
| Consolidation Pipeline  | Consolidation running? Rules being adopted?                 |
| Automation Coverage Gap | What % of known patterns are automated vs manual-only?      |

### Domain 4: Feedback Loop & Integration (25% weight)

| Category                 | What It Checks                                            |
| ------------------------ | --------------------------------------------------------- |
| Feedback Loop Closure    | Retro action items implemented? Repeat offenders tracked? |
| Cross-PR Recurrence      | Same patterns in 3+ PRs? False positive rates by tool?    |
| External Tool Config     | Qodo/SonarCloud configs current? Suppressions working?    |
| Cross-System Integration | Session hooks, episodic memory, handoff all connected?    |

### Domain 5: Effectiveness Metrics (15% weight)

| Category                | What It Checks                                             |
| ----------------------- | ---------------------------------------------------------- |
| Review Cycle Efficiency | Avg rounds per PR, fix ratio, churn %. Trending?           |
| Agent Utilization       | Parallel agents for 20+ items? Specialists matched?        |
| Template & Reference    | FIX_TEMPLATES coverage, freshness, reference doc accuracy? |

---

## Benchmarks

Internal benchmarks are defined in `scripts/lib/benchmarks.js`. Industry
benchmarks reference Google Engineering Practices, DORA/Accelerate metrics, Lean
Software Development, Microsoft SARIF, and IEEE SWEBOK.

Each category scores 0-100 with ratings: good (90+), average (70-89), poor
(<70). The composite grade uses weighted average across all categories.

**Calibration notes** (v1.1): Benchmarks are calibrated for multi-tool review
workflows (SonarCloud + Qodo + Gemini). Multi-tool reviews naturally have more
rounds (4-5 typical) than single-reviewer workflows. If review tooling changes,
recalibrate `avg_rounds_per_pr` and `churn_pct` thresholds.

---

## Checker Development Guide

### Data Sources

Checkers have two data sources for review content:

1. **JSONL entries** (`.claude/state/reviews.jsonl`) — structured data with
   fields like `id`, `pr`, `total`, `rejected`, `patterns[]`, `source`, `date`.
   Good for counts and metadata. Poor for keyword/prose analysis.

2. **Markdown sections** (`docs/AI_REVIEW_LEARNINGS_LOG.md`) — rich prose
   describing findings, process, agent usage. Must be extracted per-review using
   heading-based parsing (`extractMarkdownSections`).

**Rule: Always combine both sources for keyword matching.** JSONL entries alone
miss 60-80% of keyword evidence.

### JSONL Schema Pitfalls

| Actual Field | Common Mistake   | Notes                                  |
| ------------ | ---------------- | -------------------------------------- |
| `id`         | `review_id`      | Numeric for reviews, string for retros |
| `pr`         | `pr_number`      | Both work, prefer `pr`                 |
| `total`      | `items_total`    | Total suggestions in the review        |
| `rejected`   | `items_rejected` | Suggestions rejected/skipped           |
| `type`       | —                | `"review"` or `"retrospective"`        |

### Retro vs Review Entries

The JSONL contains both reviews and retrospectives. **Retrospective entries MUST
be excluded** from review-specific metrics:

```javascript
// CORRECT — filter to actual reviews only
const reviews = jsonl.filter(
  (r) => r.type !== "retrospective" && typeof r.id === "number"
);

// WRONG — retros have numeric 'pr' field, so this includes them
const reviews = jsonl.filter((r) => typeof r.pr === "number");
```

Retros are valid for: round counts (`r.rounds`), churn data, action item
tracking. They are NOT valid for: step keyword matching, specialist analysis,
large review detection.

### Markdown Section Extraction

Use line-by-line heading parsing (not regex with multiline flag — `$` matches
end-of-line not end-of-section):

```javascript
function extractMarkdownSections(content, reviewIds) {
  const lines = content.split("\n");
  const headingRe = /^#{2,4}\s+Review\s+#(\d+)\b/i;
  // Build heading index, then slice between headings
}
```

### State File Paths

Canonical location: `.claude/state/` (NOT `docs/data/`).

| File                | Path                                 |
| ------------------- | ------------------------------------ |
| Reviews JSONL       | `.claude/state/reviews.jsonl`        |
| Review metrics      | `.claude/state/review-metrics.jsonl` |
| Consolidation state | `.claude/state/consolidation.json`   |

### Gap Counting

When counting numbering gaps, only count gaps within the **active range**
(minActive..maxActive). Historical gaps in older archives are intentional
(skipped/merged reviews) and not actionable.

### Specialist Matching

When checking if reviews show specialist depth, look for domain-specific
analysis keywords (e.g., "vulnerability", "injection" for security) rather than
just the word "agent". All reviews in this system are agent-performed, so agent
evidence is implicit.

---

## Version History

| Version | Date       | Description                                                                                                                               |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1.3     | 2026-03-25 | Extract shared patterns to \_shared/ecosystem-audit/                                                                                      |
| 1.2     | 2026-02-24 | Add Compaction Guard with progress file, resume-on-start, save-after-decision, and cleanup-on-completion                                  |
| 1.1     | 2026-02-22 | Add Checker Development Guide with data source, JSONL schema, retro/review separation, markdown extraction, path, and calibration lessons |
| 1.0     | 2026-02-20 | Initial implementation                                                                                                                    |
