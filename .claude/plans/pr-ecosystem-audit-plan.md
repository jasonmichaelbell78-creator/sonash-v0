<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-20
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Implementation Plan: PR Ecosystem Audit Skill

## Summary

Build a comprehensive, reusable `/pr-ecosystem-audit` skill that performs a deep
diagnostic of the entire PR review ecosystem — from skill invocation through
pattern enforcement and learning capture. The skill produces per-category
scores, a composite health grade, trend tracking over time, and an interactive
walkthrough where each finding is presented for Fix/Defer/Suppress decisions.
Findings integrate with TDMS for tracking and can suggest concrete patches to
skill files, hook configs, and pattern rules.

---

## Decision Record (from Q&A)

| Decision                | Choice                                                                       |
| ----------------------- | ---------------------------------------------------------------------------- |
| Skill name              | `pr-ecosystem-audit`                                                         |
| Output mode             | Interactive walkthrough (same UX as /alerts)                                 |
| Reusability             | Recurring + trending (saves results to state file, compares across runs)     |
| Scope                   | Full ecosystem — expanded 16-18 consolidated categories from 45 raw dims     |
| Architecture            | Standalone script (`run-pr-ecosystem-audit.js`), NOT inside /alerts          |
| State storage           | `.claude/state/pr-ecosystem-audit.jsonl` (one entry per run)                 |
| Action integration      | TDMS via `/add-debt` + suggest patches to skill/hook/pattern files           |
| Scoring                 | Both composite grade (A-F, 0-100) + per-category scores                      |
| Relationship to /alerts | /alerts = quick signal (3 review checkers), this = deep root-cause analysis  |
| Auto-update level       | Suggest patches (generate specific diffs, present to user for approval)      |
| Priority order          | Impact-weighted: severity x frequency x blast-radius                         |
| Cadence                 | On-demand (manual invocation by user)                                        |
| Code structure          | Modular checkers — orchestrator + individual checker files                   |
| Interaction model       | Same as /alerts (Fix Now / Defer / Suppress per finding via AskUserQuestion) |
| Patch presentation      | Inline during walkthrough (show patch suggestion with each finding)          |
| Benchmarks              | Both internal trending + external/industry best practices                    |

---

## Consolidated Audit Categories (18 categories in 5 domains)

### Domain 1: Process Compliance (4 categories)

| #   | Category                    | Raw Dimensions Covered                                                      | What It Checks                                                                                 |
| --- | --------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | Skill Invocation Fidelity   | #1 invocation, #39 steps followed                                           | Are /pr-review's 10 steps (0-9) actually followed? Are any skipped or truncated?               |
| 2   | Review Process Completeness | #2 fidelity, #27 algorithm pre-check, #28 propagation, #29 input validation | Multi-pass parsing done? Propagation sweeps executed? Pre-checks run for new files >500 lines? |
| 3   | Retro Quality & Compliance  | #3 effectiveness, #42 action tracking, #45 mandatory sections               | Are all mandatory retro sections present? Are action items created as DEBT entries?            |
| 4   | Learning Capture Integrity  | #4 quality, #19 numbering                                                   | Are learning entries complete? Are review numbers sequential with no gaps?                     |

### Domain 2: Data & State Health (3 categories)

| #   | Category                   | Raw Dimensions Covered       | What It Checks                                                                             |
| --- | -------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| 5   | State File Consistency     | #9 data integrity, #36 drift | reviews.jsonl synced with markdown? consolidation.json pointer valid? No orphaned entries? |
| 6   | Archive & Retention Health | #12 archive, #30 retention   | Active review count within threshold (≤20)? Archives intact? Retrieval working?            |
| 7   | JSONL Sync Fidelity        | #9 subset — sync specific    | `npm run reviews:sync --check` passes? Markdown↔JSONL drift detected?                      |

### Domain 3: Pattern Lifecycle & Enforcement (4 categories)

| #   | Category                      | Raw Dimensions Covered                       | What It Checks                                                                                 |
| --- | ----------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 8   | Pattern Discovery→Automation  | #6 lifecycle, #26 automation lifecycle       | Do patterns flow from retro→CODE_PATTERNS→check-pattern-compliance→hook? What % are automated? |
| 9   | Pattern Enforcement Coverage  | #7 enforcement, #32 checker coverage, #35 CC | Are hooks catching known patterns? False positive rate? Graduation from warn→block working?    |
| 10  | Consolidation Pipeline Health | #5 consolidation, #41 trigger reliability    | Consolidation triggering at threshold? Producing actionable rules? Rules being adopted?        |
| 11  | Automation Coverage Gap       | #8 coverage                                  | What % of known patterns are automated vs manual-only? Trend over time?                        |

### Domain 4: Feedback Loop & Integration (4 categories)

| #   | Category                    | Raw Dimensions Covered                                     | What It Checks                                                                                  |
| --- | --------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 12  | Feedback Loop Closure       | #17 closure, #20 deferred follow-through                   | Are retro action items actually implemented? Closure rate? Time-to-implementation?              |
| 13  | Cross-PR Pattern Recurrence | #21 cross-PR, #38 false positive rate                      | Same patterns appearing across multiple PRs? False positive rates by tool? Recurrence trending? |
| 14  | External Tool Configuration | #16 suppression, #18 SonarCloud, #25 Qodo, #31 compliance  | Are Qodo/SonarCloud configs current? Suppressions covering noise? All sections configured?      |
| 15  | Cross-System Integration    | #11 coherence, #22 episodic memory, #23 session continuity | Do all components integrate? Is episodic memory being consulted? Session handoffs working?      |

### Domain 5: Effectiveness Metrics (3 categories)

| #   | Category                        | Raw Dimensions Covered                  | What It Checks                                                                     |
| --- | ------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------- |
| 16  | Review Cycle Efficiency         | #10 churn, #37 source diversity         | Fix ratio, rounds per PR, churn %. Trend over last 5-10 PRs. By-source breakdown.  |
| 17  | Agent Utilization Effectiveness | #14 agents, #40 specialization matching | Are parallel agents used for 20+ items? Are specialist agents matched correctly?   |
| 18  | Template & Reference Quality    | #15 template quality, #34 doc accuracy  | FIX_TEMPLATES coverage vs top churn patterns? Reference docs accurate and current? |

---

## Files to Create/Modify

### New Files (12)

1. **`.claude/skills/pr-ecosystem-audit/SKILL.md`** — Skill definition with
   invocation guide, phase descriptions, category reference, benchmarks, and
   interactive walkthrough instructions

2. **`.claude/skills/pr-ecosystem-audit/scripts/run-pr-ecosystem-audit.js`** —
   Main orchestrator script. Loads checkers, runs them, computes composite
   score, outputs v2 JSON to stdout (same schema pattern as run-alerts.js)

3. **`.claude/skills/pr-ecosystem-audit/scripts/checkers/process-compliance.js`**
   — Categories 1-4: Skill invocation fidelity, review process completeness,
   retro quality, learning capture integrity

4. **`.claude/skills/pr-ecosystem-audit/scripts/checkers/data-state-health.js`**
   — Categories 5-7: State file consistency, archive health, JSONL sync fidelity

5. **`.claude/skills/pr-ecosystem-audit/scripts/checkers/pattern-lifecycle.js`**
   — Categories 8-11: Pattern discovery→automation, enforcement coverage,
   consolidation health, automation coverage gap

6. **`.claude/skills/pr-ecosystem-audit/scripts/checkers/feedback-integration.js`**
   — Categories 12-15: Feedback loop closure, cross-PR recurrence, external tool
   config, cross-system integration

7. **`.claude/skills/pr-ecosystem-audit/scripts/checkers/effectiveness-metrics.js`**
   — Categories 16-18: Review cycle efficiency, agent utilization, template
   quality

8. **`.claude/skills/pr-ecosystem-audit/scripts/lib/scoring.js`** — Shared
   scoring utilities: benchmark comparison, grade calculation (A-F), sparkline
   generation, trend computation

9. **`.claude/skills/pr-ecosystem-audit/scripts/lib/patch-generator.js`** —
   Patch suggestion engine: generates specific code diffs for skill files, hook
   configs, and pattern rules based on findings

10. **`.claude/skills/pr-ecosystem-audit/scripts/lib/benchmarks.js`** —
    Internal + external benchmark definitions for all 18 categories

11. **`.claude/skills/pr-ecosystem-audit/scripts/lib/industry-benchmarks.js`** —
    External/industry best practice benchmarks (Google eng practices, DORA
    metrics, review literature) with citations

12. **`.claude/skills/pr-ecosystem-audit/scripts/lib/state-manager.js`** —
    Read/write/trend `.claude/state/pr-ecosystem-audit.jsonl`. Handles atomic
    writes, symlink guards, delta computation between runs

### New Directories

- `.claude/skills/pr-ecosystem-audit/`
- `.claude/skills/pr-ecosystem-audit/scripts/`
- `.claude/skills/pr-ecosystem-audit/scripts/checkers/`
- `.claude/skills/pr-ecosystem-audit/scripts/lib/`

### Modified Files (2)

1. **`package.json`** — Add npm scripts:
   - `"ecosystem-audit": "node .claude/skills/pr-ecosystem-audit/scripts/run-pr-ecosystem-audit.js"`
   - `"ecosystem-audit:check": "node .claude/skills/pr-ecosystem-audit/scripts/run-pr-ecosystem-audit.js --check"`

2. **`docs/agent_docs/CODE_PATTERNS.md`** — Add pattern for "ecosystem audit
   integration" if relevant patterns emerge during implementation

---

## Implementation Steps

### Step 1: Scaffolding & Shared Libraries

Create the directory structure and shared utility files.

**Files:** scoring.js, benchmarks.js, industry-benchmarks.js, state-manager.js

**scoring.js** core functions:

```javascript
// Score a metric against good/average/poor benchmarks
function scoreMetric(value, benchmark, direction = 'lower-is-better') { ... }

// Compute letter grade from 0-100 score
function computeGrade(score) { ... } // A: 90+, B: 80+, C: 70+, D: 60+, F: <60

// Generate sparkline from historical values
function sparkline(values) { ... }

// Compute trend direction and magnitude
function computeTrend(history, windowSize = 5) { ... }

// Compute weighted composite score from category scores
function compositeScore(categoryScores, weights) { ... }
```

**benchmarks.js** structure (mirrors run-alerts.js BENCHMARKS):

```javascript
const BENCHMARKS = {
  skill_invocation: {
    steps_completed_pct: { good: 100, average: 80, poor: 50 },
    pre_checks_run: { good: 100, average: 75, poor: 25 },
  },
  review_process: {
    multi_pass_pct: { good: 100, average: 80, poor: 50 },
    propagation_sweep_pct: { good: 100, average: 60, poor: 20 },
  },
  // ... all 18 categories
};
```

**industry-benchmarks.js** references:

```javascript
const INDUSTRY = {
  review_rounds: {
    source: "Google Engineering Practices",
    benchmark: { good: 1, average: 2, poor: 5 },
    note: "Most changes should need only 1-2 rounds of review",
  },
  fix_ratio: {
    source: "DORA / Accelerate metrics",
    benchmark: { good: 0.1, average: 0.2, poor: 0.4 },
    note: "Review fix ratio should be <20% of total commits",
  },
  automation_coverage: {
    source: "Google Code Health team",
    benchmark: { good: 60, average: 30, poor: 10 },
    note: "Automated checks should catch 60%+ of common patterns",
  },
  // ...
};
```

**state-manager.js** handles:

- Atomic JSONL append with symlink guard
- Read last N audit runs for trending
- Compute deltas between consecutive runs
- Prune entries older than 12 months (configurable)

---

### Step 2: Process Compliance Checkers (Categories 1-4)

**File:** `checkers/process-compliance.js`

**Category 1 — Skill Invocation Fidelity:**

- Parse reviews.jsonl for recent PRs
- Cross-reference with learnings log to check if all 10 steps were documented
- Check: Step 0 (context loading), Step 0.5 (pre-push gate), Step 1 (parsing),
  Step 1.5 (SonarCloud enrichment), Step 2 (categorization), Step 3 (plan), Step
  4 (agents), Step 5 (fix), Step 6 (document), Step 7 (learning), Step 8
  (summary), Step 9 (commit)
- Score: % of steps documented across last 5 reviews
- **Patch suggestions:** If steps are consistently skipped, suggest adding a
  compliance checklist to SKILL.md

**Category 2 — Review Process Completeness:**

- Check if multi-pass parsing was used for reviews >200 lines
- Check if propagation sweeps were run (grep for evidence in commits)
- Check if pre-push reviewer gate was used for new files >500 lines
- Check if algorithm pre-check was done when applicable
- Score: weighted composite of sub-checks

**Category 3 — Retro Quality & Compliance:**

- Parse retro entries from reviews.jsonl (type: 'retro')
- Verify all 10 mandatory sections present in each retro
- Check if TDMS entries were created for action items (cross-ref
  MASTER_DEBT.jsonl)
- Score: % mandatory sections × % action items tracked

**Category 4 — Learning Capture Integrity:**

- Check review numbers are sequential (no gaps, no duplicates)
- Check all required fields populated (source, PR, patterns, resolution,
  learnings)
- Check learning entries have actionable content (not just "learned X")
- Score: field completeness % × numbering integrity %

---

### Step 3: Data & State Health Checkers (Categories 5-7)

**File:** `checkers/data-state-health.js`

**Category 5 — State File Consistency:**

- Run `npm run reviews:sync -- --check` (exit code 0 = synced)
- Verify consolidation.json.lastConsolidatedReview ≤ max review ID in
  reviews.jsonl
- Check for orphaned entries (JSONL entries with no markdown source)
- Validate all state file schemas (JSON parse, required fields present)
- Score: % of checks passing

**Category 6 — Archive & Retention Health:**

- Count active reviews in AI_REVIEW_LEARNINGS_LOG.md
- If >20: flag as "archival overdue" with patch suggestion to run
  `npm run reviews:archive -- --apply`
- Check archive files exist and are readable
- Verify archived reviews are still accessible via
  `npm run reviews:check-archive`
- Score: (20 - max(0, active - 20)) / 20 × 100

**Category 7 — JSONL Sync Fidelity:**

- Run sync check, measure drift count
- Check last sync timestamp vs last review date
- Verify JSONL entries parse correctly (no corrupted lines)
- Score: 100 if synced, degrade by 10 per drifted entry

---

### Step 4: Pattern Lifecycle Checkers (Categories 8-11)

**File:** `checkers/pattern-lifecycle.js`

**Category 8 — Pattern Discovery→Automation:**

- Parse retro entries for "Recurring Patterns" and "Automation Candidates"
- Cross-reference with check-pattern-compliance.js to see which are automated
- Build pipeline view: discovered → documented → automated → enforced
- Score: % of discovered patterns that reached "automated" status

**Category 9 — Pattern Enforcement Coverage:**

- Run `npm run patterns:check` in dry-run mode, count violations
- Analyze warned-files.json for graduation state (warning → blocking)
- Calculate false positive rate from rejection data in retros
- Check pre-commit hook is actually running pattern checks
- Score: (1 - false_positive_rate) × enforcement_coverage

**Category 10 — Consolidation Pipeline Health:**

- Read consolidation.json for last run data
- Count pending reviews since last consolidation
- Check if suggested-rules.md has unreviewed rules
- Verify consolidation output was actionable (rules adopted vs ignored)
- Score: based on pending count, rule adoption rate, freshness

**Category 11 — Automation Coverage Gap:**

- Count total known patterns (from CODE_PATTERNS.md, retro findings,
  FIX_TEMPLATES)
- Count patterns with automated enforcement
- Calculate gap: (total - automated) / total
- Trend: is the gap shrinking over time?
- Score: automated / total × 100
- **Patch suggestions:** For top unautomated patterns, suggest specific
  additions to check-pattern-compliance.js

---

### Step 5: Feedback Loop & Integration Checkers (Categories 12-15)

**File:** `checkers/feedback-integration.js`

**Category 12 — Feedback Loop Closure:**

- Parse retro action items from reviews.jsonl
- Cross-reference with MASTER_DEBT.jsonl (source_id: "review:pr-retro-\*")
- Check resolution status: resolved, open, no-DEBT-entry
- Calculate closure rate: resolved / (resolved + open + missing)
- Calculate time-to-implementation for resolved items
- Flag repeat offenders: action items recommended 2+ times without
  implementation
- Score: closure_rate × (1 - repeat_offender_rate)
- **Patch suggestions:** For unimplemented actions, suggest DEBT entries

**Category 13 — Cross-PR Pattern Recurrence:**

- Group review findings by pattern name across all PRs
- Identify patterns appearing in 3+ PRs
- Calculate false positive rate by review tool (CodeRabbit, Qodo, SonarCloud)
- Check if recurring patterns triggered suppression config updates
- Score: (1 - recurring_unsuppressed_rate) × (1 - false_positive_rate)

**Category 14 — External Tool Configuration:**

- Parse .qodo/pr-agent.toml — verify all 3 sections present
- Check suppression rules against recent rejection data (are they working?)
- Verify SonarCloud enrichment is being used (Step 1.5 evidence)
- Check for stale suppression rules (pattern no longer appearing)
- Score: configuration_completeness × suppression_effectiveness
- **Patch suggestions:** For missing Qodo sections or stale rules, suggest
  specific .qodo/pr-agent.toml updates

**Category 15 — Cross-System Integration:**

- Check session-start.js runs consolidation
- Check session-end verifies TDMS entries for retro actions
- Check episodic memory usage in review entries (Step 0.1 evidence)
- Verify handoff.json maintains review context across sessions
- Score: % of integration points functioning

---

### Step 6: Effectiveness Metrics Checkers (Categories 16-18)

**File:** `checkers/effectiveness-metrics.js`

**Category 16 — Review Cycle Efficiency:**

- Read review-metrics.jsonl for per-PR data
- Calculate: avg rounds, avg fix ratio, churn %, trend over last 5-10 PRs
- Break down by review source (Qodo vs SonarCloud vs CodeRabbit)
- Compare against both internal history and industry benchmarks
- Score: weighted composite of rounds, fix_ratio, churn
- Include sparkline trend in output

**Category 17 — Agent Utilization Effectiveness:**

- Parse review entries for 20+ item PRs
- Check if parallel agents were used (evidence: multiple agent types in single
  review)
- Compare items/session for parallel vs sequential processing
- Score: parallel_usage_rate × effectiveness_multiplier

**Category 18 — Template & Reference Quality:**

- Count FIX_TEMPLATES entries, check freshness (last update date)
- Cross-reference templates against top churn patterns from retros
- Check CODE_PATTERNS.md coverage vs known patterns
- Check reference doc accuracy (SONARCLOUD_ENRICHMENT, LEARNING_CAPTURE, etc.)
- Score: coverage × freshness × accuracy
- **Patch suggestions:** For missing templates, suggest specific FIX_TEMPLATES
  additions based on churn data

---

### Step 7: Main Orchestrator Script

**File:** `run-pr-ecosystem-audit.js`

Architecture (mirrors run-alerts.js):

```javascript
// 1. Load all checker modules
const checkers = [
  require('./checkers/process-compliance'),
  require('./checkers/data-state-health'),
  require('./checkers/pattern-lifecycle'),
  require('./checkers/feedback-integration'),
  require('./checkers/effectiveness-metrics'),
];

// 2. Run all checkers, collect findings
const findings = [];
for (const checker of checkers) {
  const result = checker.run({ rootDir, benchmarks, history });
  findings.push(...result.findings);
  categories[result.domain] = result.scores;
}

// 3. Score and sort findings
findings.sort((a, b) => impactScore(b) - impactScore(a));

// 4. Compute composite score
const composite = compositeScore(categories, WEIGHTS);

// 5. Generate patch suggestions for applicable findings
for (const finding of findings) {
  if (finding.patchable) {
    finding.patch = patchGenerator.generate(finding);
  }
}

// 6. Save to state file
stateManager.append({ timestamp, composite, categories, findings });

// 7. Output v2 JSON to stdout
console.log(JSON.stringify({
  version: 2,
  timestamp: new Date().toISOString(),
  healthScore: composite,
  grade: computeGrade(composite.score),
  categories: categories,
  findings: findings,
  trends: stateManager.getTrends(),
  summary: { errors: ..., warnings: ..., info: ... }
}));
```

Output schema (v2 JSON, same pattern as /alerts):

```json
{
  "version": 2,
  "timestamp": "2026-02-20T...",
  "healthScore": { "score": 78, "grade": "B" },
  "categories": {
    "skill_invocation_fidelity": { "score": 85, "rating": "good", "findings": [...] },
    "review_process_completeness": { "score": 62, "rating": "average", "findings": [...] },
    "...": "..."
  },
  "findings": [
    {
      "id": "PEA-001",
      "category": "feedback_loop_closure",
      "domain": "feedback_integration",
      "severity": "error",
      "message": "3 retro action items recommended 2+ times without implementation",
      "details": "CC lint rule (PRs #367-369), batch file audit (#368), ...",
      "impactScore": 94,
      "benchmark": { "internal": "...", "industry": "..." },
      "suggestedAction": "Create DEBT entries and schedule implementation",
      "patchable": true,
      "patch": {
        "type": "debt_entry",
        "target": "MASTER_DEBT.jsonl",
        "content": "{ ... specific DEBT entry ... }"
      }
    }
  ],
  "trends": {
    "composite": { "current": 78, "previous": 72, "delta": "+6", "sparkline": "▂▃▅▆▇" },
    "per_category": { "...": "..." }
  },
  "summary": { "errors": 3, "warnings": 8, "info": 5 }
}
```

---

### Step 8: SKILL.md — Skill Definition

**File:** `.claude/skills/pr-ecosystem-audit/SKILL.md`

Key sections:

- **Invocation:** `/pr-ecosystem-audit`
- **Phase 1: Run & Parse** — Run the script, parse v2 JSON
- **Phase 2: Dashboard Overview** — Compact header with composite grade,
  category scorecard table, domain summary
- **Phase 3: Alert-by-Alert Loop** — Same UX as /alerts: present each finding
  with context card, show patch suggestion inline if patchable, offer Fix Now /
  Defer / Suppress via AskUserQuestion
- **Phase 4: Summary & Actions** — Final scorecard with decisions made, deferred
  items list, TDMS entries created, patches applied vs saved
- **Phase 5: Trend Report** — If previous runs exist, show
  improvement/regression per category with sparklines
- **Category Reference** — Full table of 18 categories with descriptions,
  benchmarks, and scoring methodology
- **Benchmarks Reference** — Internal thresholds + industry citations

Dashboard format:

```
PR Ecosystem Health: B (78/100)  |  Trend: ▂▃▅▆▇ (+6 from last run)
🔴 3 errors · 🟡 8 warnings · 🔵 5 info  |  4 patch suggestions ready

┌────────────────────────────────┬───────┬──────────┬──────────────┐
│ Category                       │ Score │ Rating   │ Trend        │
├────────────────────────────────┼───────┼──────────┼──────────────┤
│ D1: Process Compliance         │       │          │              │
│   Skill Invocation Fidelity    │   85  │ 🟢 Good  │ ▃▅▇ (+5)     │
│   Review Process Completeness  │   62  │ 🟡 Avg   │ ▅▃▂ (-8)     │
│   Retro Quality & Compliance   │   90  │ 🟢 Good  │ ▇▇▇ (=)      │
│   Learning Capture Integrity   │   78  │ 🟢 Good  │ ▅▆▇ (+3)     │
├────────────────────────────────┼───────┼──────────┼──────────────┤
│ D2: Data & State Health        │       │          │              │
│   State File Consistency       │  100  │ 🟢 Good  │ ▇▇▇ (=)      │
│   Archive & Retention Health   │   95  │ 🟢 Good  │ ▇▇▇ (=)      │
│   JSONL Sync Fidelity          │  100  │ 🟢 Good  │ ▇▇▇ (=)      │
├────────────────────────────────┼───────┼──────────┼──────────────┤
│ D3: Pattern Lifecycle          │       │          │              │
│   Pattern Discovery→Automation │   45  │ 🔴 Poor  │ ▂▃▃ (-2)     │
│   Enforcement Coverage         │   70  │ 🟡 Avg   │ ▃▅▆ (+5)     │
│   Consolidation Health         │   80  │ 🟢 Good  │ ▅▇▇ (+2)     │
│   Automation Coverage Gap      │   35  │ 🔴 Poor  │ ▂▂▃ (+1)     │
├────────────────────────────────┼───────┼──────────┼──────────────┤
│ D4: Feedback & Integration     │       │          │              │
│   Feedback Loop Closure        │   55  │ 🟡 Avg   │ ▃▃▅ (+2)     │
│   Cross-PR Recurrence          │   60  │ 🟡 Avg   │ ▅▅▅ (=)      │
│   External Tool Config         │   85  │ 🟢 Good  │ ▃▅▇ (+10)    │
│   Cross-System Integration     │   70  │ 🟡 Avg   │ ▅▅▆ (+1)     │
├────────────────────────────────┼───────┼──────────┼──────────────┤
│ D5: Effectiveness Metrics      │       │          │              │
│   Review Cycle Efficiency      │   72  │ 🟡 Avg   │ ▂▃▅ (+8)     │
│   Agent Utilization            │   80  │ 🟢 Good  │ ▇▇▇ (=)      │
│   Template & Reference Quality │   65  │ 🟡 Avg   │ ▃▅▆ (+3)     │
└────────────────────────────────┴───────┴──────────┴──────────────┘

Found 16 findings to review. Walking through each one (impact-weighted)...
```

Finding card format:

```
━━━ Finding 1/16 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ERROR  |  D4: Feedback Loop Closure  |  Impact: 94/100

3 retro action items recommended 2+ times without implementation

Evidence:
  - CC lint rule: recommended PRs #367, #368, #369 (never done, ~18 avoidable rounds)
  - Batch file audit: recommended PR #368 (partial, still causing churn)
  - Path containment pre-check: recommended PR #374 (not yet in hook)

Benchmarks:
  Internal: Closure rate dropped from 80% → 55% over last 3 runs
  Industry: Google eng practices target 100% action item closure within 2 sprints

📎 Patch Available:
  Target: MASTER_DEBT.jsonl
  Action: Create 3 DEBT entries (S1 severity, source: pr-retro)
  Preview:
    + {"id":"DEBT-3051","severity":"S1","title":"Implement CC lint rule (retro action, 3x recommended)","source_id":"review:pr-retro-367",...}
    + {"id":"DEBT-3052","severity":"S1","title":"Complete batch file audit (retro action, 2x recommended)","source_id":"review:pr-retro-368",...}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Step 9: Patch Generator Engine

**File:** `lib/patch-generator.js`

The patch generator creates specific, actionable suggestions for different
target types:

```javascript
const PATCH_TYPES = {
  // Add DEBT entry to MASTER_DEBT.jsonl
  debt_entry: { target: "MASTER_DEBT.jsonl", action: "append" },

  // Add pattern to check-pattern-compliance.js
  pattern_rule: { target: "check-pattern-compliance.js", action: "insert" },

  // Add template to FIX_TEMPLATES.md
  fix_template: { target: "FIX_TEMPLATES.md", action: "append" },

  // Update .qodo/pr-agent.toml suppression config
  qodo_config: { target: ".qodo/pr-agent.toml", action: "edit" },

  // Update skill SKILL.md (pr-review, pr-retro, etc.)
  skill_update: { target: "dynamic", action: "edit" },

  // Add pre-check to pr-review Step 0.5
  pre_check: { target: "pr-review/SKILL.md", action: "insert" },

  // Update consolidation threshold or config
  config_update: { target: "dynamic", action: "edit" },
};
```

Each patch generates:

- A human-readable description of the change
- The specific file path and location
- A diff preview showing the proposed change
- An impact estimate (what it would prevent if applied)

---

### Step 10: Package.json & Integration

**File:** `package.json`

Add scripts:

```json
{
  "ecosystem-audit": "node .claude/skills/pr-ecosystem-audit/scripts/run-pr-ecosystem-audit.js",
  "ecosystem-audit:check": "node .claude/skills/pr-ecosystem-audit/scripts/run-pr-ecosystem-audit.js --check"
}
```

The `--check` flag runs a lightweight check (no interactive output, exit code 0
= healthy, 1 = issues found). Useful for CI or pre-PR verification.

---

### Step 11: Testing & Validation

After implementation:

1. Run `npm run ecosystem-audit` and verify v2 JSON output is valid
2. Verify all 18 categories produce scores
3. Verify composite grade computes correctly
4. Run twice to verify trending works (second run shows deltas)
5. Verify state file is written atomically with symlink guard
6. Test patch generation for each PATCH_TYPE
7. Run `npm run lint` to verify no code quality issues
8. Run `npm run patterns:check` to verify pattern compliance

---

## Category Weights (for composite score)

| Domain                 | Weight | Categories                                                                 |
| ---------------------- | ------ | -------------------------------------------------------------------------- |
| Process Compliance     | 20%    | 4 categories × 5% each                                                     |
| Data & State Health    | 15%    | 3 categories × 5% each                                                     |
| Pattern Lifecycle      | 25%    | 4 categories (8% disc→auto, 7% enforcement, 5% consolidation, 5% coverage) |
| Feedback & Integration | 25%    | 4 categories (8% closure, 7% recurrence, 5% ext tools, 5% integration)     |
| Effectiveness Metrics  | 15%    | 3 categories × 5% each                                                     |

Pattern Lifecycle and Feedback & Integration get the highest weights because
they measure whether the ecosystem is actually learning and improving — the core
purpose of the entire system.

---

## Execution Order

Steps 1-6 can be partially parallelized:

- **Step 1** (scaffolding) must complete first
- **Steps 2-6** (checker modules) can run in parallel after Step 1
- **Step 7** (orchestrator) depends on Steps 1-6
- **Step 8** (SKILL.md) can run in parallel with Step 7
- **Step 9** (patch generator) can run in parallel with Steps 2-6
- **Step 10** (package.json) runs after Step 7
- **Step 11** (testing) runs last

Recommended parallel batches:

1. Step 1 (scaffolding)
2. Steps 2, 3, 4, 5, 6, 9 in parallel
3. Steps 7, 8 in parallel
4. Step 10
5. Step 11
