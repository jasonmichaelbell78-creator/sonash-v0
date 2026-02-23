---
name: pr-ecosystem-audit
description: |
  Comprehensive diagnostic of the PR review ecosystem — 18 categories across 5
  domains with composite health scoring, trend tracking, patch suggestions, and
  interactive finding-by-finding walkthrough. Triggers: "pr ecosystem audit",
  "audit pr ecosystem", "review health", "ecosystem health".
---

<!-- prettier-ignore-start -->
**Document Version:** 1.1
**Last Updated:** 2026-02-22
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

## CRITICAL RULES (Read First)

1. **ALWAYS run the script first** — never generate findings without data
2. **ALWAYS display the dashboard to the user** before starting the walkthrough
3. **Present findings one at a time** using AskUserQuestion for decisions
4. **Show patch suggestions inline** with each patchable finding
5. **Create TDMS entries** for deferred findings via `/add-debt`
6. **Save decisions** to session log for audit trail

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

Sort all findings by `impactScore` descending (highest impact first).

For each finding, present a context card:

```
━━━ Finding {n}/{total} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{SEVERITY}  |  {domainLabel}: {categoryLabel}  |  Impact: {impactScore}/100

{message}

Evidence:
  {details}

Benchmarks:
  Internal: {metrics or trend info}
  Industry: {industry benchmark if available}
```

If the finding has `patchable: true`, also show:

```
Patch Available:
  Target: {patch.target}
  Action: {patch.description}
  Preview:
    {patch.preview or patch.content}
```

Then use `AskUserQuestion` with options based on severity:

**ERROR findings:**

- Fix Now — execute the fix/patch immediately
- Defer — add to deferred list, create DEBT entry
- Suppress — suppress this finding type permanently

**WARNING findings:**

- Fix Now
- Defer
- Skip — acknowledge but don't track

**INFO findings:**

- Acknowledge
- Defer for later

### Handling Decisions

**Fix Now:**

1. If patch is available, apply it (edit file, run command, etc.)
2. If no patch, provide guidance for manual fix
3. Log decision to session file

**Defer:**

1. Create DEBT entry via `/add-debt` with:
   - severity: S1 (errors) or S2 (warnings)
   - category: engineering-productivity
   - source_id: "review:pr-ecosystem-audit-{date}"
2. Log decision to session file

**Suppress:**

1. Add to suppression list (not yet implemented — log for future)
2. Log decision to session file

---

## Phase 4: Summary & Actions

After all findings are reviewed, present the summary:

```
━━━ Audit Summary ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Composite: {grade} ({score}/100)  |  {trend}

Decisions:
  Fixed:      {count} findings
  Deferred:   {count} findings → {count} DEBT entries created
  Skipped:    {count} findings
  Suppressed: {count} findings

Patches Applied: {count}/{total patchable}

Top 3 Impact Areas:
  1. {category} — {brief description}
  2. {category} — {brief description}
  3. {category} — {brief description}

Next Steps:
  - {actionable recommendation based on worst categories}
  - {actionable recommendation}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Phase 5: Trend Report (if previous runs exist)

If the state file has previous entries, show improvement/regression:

```
━━━ Trend Report ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Composite Trend: {sparkline}  {direction} ({delta})

Improving:
  {category}: {before} → {after} (+{delta})

Declining:
  {category}: {before} → {after} ({delta})

Stable:
  {category}: {score} (no change)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

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
| 1.1     | 2026-02-22 | Add Checker Development Guide with data source, JSONL schema, retro/review separation, markdown extraction, path, and calibration lessons |
| 1.0     | 2026-02-20 | Initial implementation                                                                                                                    |
