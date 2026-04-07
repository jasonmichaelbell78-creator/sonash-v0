# Learning System Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the vanity-metric learning system with a closed-loop system
that measures actual violation trends, fixes the broken graduation pipeline, and
architecturally separates code enforcement from behavioral learning.

**Architecture:** Three systems replace two disconnected ones: (1) a violation
trend tracker reading hook-runs data, (2) a fixed learning-router with
reclassified routes, (3) a gutted effectiveness analyzer that reports real
metrics. The session-start dashboard switches from "88.7% learned" to
"violations this week vs last week."

**Tech Stack:** Node.js (CJS), JSONL state files, existing pre-commit/pre-push
hooks, `scripts/lib/safe-fs.js` and `scripts/lib/security-helpers.js` for I/O.

---

## File Structure

| File                                                   | Action             | Responsibility                                                    |
| ------------------------------------------------------ | ------------------ | ----------------------------------------------------------------- |
| `scripts/analyze-learning-effectiveness.js`            | Gut + rewrite core | Replace vanity metric with 4 MVMs from hook data                  |
| `scripts/health/checkers/learning-effectiveness.js`    | Rewrite            | Health checker reads new MVM metrics instead of old ones          |
| `scripts/refine-scaffolds.js:154`                      | Fix                | Field-name mismatch `generatedCode` → match router's actual field |
| `scripts/lib/learning-router.js:323`                   | Fix                | Add `generatedCode` field to scaffold output                      |
| `.claude/state/learning-routes.jsonl`                  | Reclassify         | Tag each route as `code` or `behavioral`, update stuck statuses   |
| `.claude/state/pending-refinements.jsonl`              | Regenerate         | Rebuild after field-name fix                                      |
| `docs/LEARNING_METRICS.md`                             | Rewrite            | New format showing 4 MVMs + trend lines                           |
| `tests/scripts/analyze-learning-effectiveness.test.ts` | Rewrite            | Test new metric calculations                                      |
| `tests/scripts/refine-scaffolds.test.ts`               | Add case           | Test field-name alignment                                         |
| `tests/scripts/lib/learning-router.test.ts`            | Add case           | Test scaffold output includes generatedCode                       |

---

### Task 1: Fix the learning-router scaffold field-name mismatch

**Files:**

- Modify: `scripts/lib/learning-router.js:321-327`
- Modify: `scripts/refine-scaffolds.js:154`
- Test: `tests/scripts/lib/learning-router.test.ts`
- Test: `tests/scripts/refine-scaffolds.test.ts`

The learning-router writes `scaffold: { targetFile, status }` but
refine-scaffolds reads `entry.scaffold?.generatedCode`. The field doesn't exist,
so all 37 pending-refinements have `generated_code: null` and the escalation
path is dead.

**Fix strategy:** The router should include the generated code from the scaffold
functions. Each scaffold function already returns type-specific content (entry,
script, rule, annotation). The router should pass that through.

- [ ] **Step 1: Write failing test for learning-router scaffold output**

In `tests/scripts/lib/learning-router.test.ts`, add:

```typescript
describe("scaffold output includes generatedCode", () => {
  it("code type scaffold includes entry as generatedCode", () => {
    const result = route(
      {
        type: "code",
        pattern: "test-pattern-scaffold-field",
        source: "test",
        severity: "medium",
      },
      { routesPath: testRoutesPath }
    );

    assert.ok(
      result.scaffold.entry ||
        result.scaffold.script ||
        result.scaffold.annotation,
      "scaffold should include generated content"
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
`npm run test:build && node --test dist-tests/tests/scripts/lib/learning-router.test.js`
Expected: FAIL — scaffold object only has `targetFile` and `status`

- [ ] **Step 3: Fix learning-router.js trackRouting to include generated
      content**

In `scripts/lib/learning-router.js`, modify the `trackRouting` function's entry
construction (around line 321-327):

```javascript
    scaffold: {
      targetFile: result.targetFile,
      status: result.status,
      generatedCode: result.entry    // verified-pattern: the pattern entry object
        || result.script             // hook-gate: the script string
        || result.annotation         // claude-md-annotation: the annotation string
        || result.rule               // lint-rule: the rule object
        || null,
    },
```

- [ ] **Step 4: Run test to verify it passes**

Run:
`npm run test:build && node --test dist-tests/tests/scripts/lib/learning-router.test.js`
Expected: PASS

- [ ] **Step 5: Verify refine-scaffolds now reads the field correctly**

The existing code at `scripts/refine-scaffolds.js:154` already reads
`entry.scaffold?.generatedCode`, which will now find the field. No change needed
in refine-scaffolds. Verify with:

Run:
`node -e "const {route} = require('./scripts/lib/learning-router'); const r = route({type:'code',pattern:'test',source:'test',severity:'medium'}, {routesPath:'/dev/null'}); console.log('generatedCode:', r.scaffold?.generatedCode != null)"`
Expected: `generatedCode: true`

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/learning-router.js tests/scripts/lib/learning-router.test.ts
git commit -m "fix: include generatedCode in learning-router scaffold output

The scaffold object written to learning-routes.jsonl was missing the
generatedCode field that refine-scaffolds.js reads, making all 37
pending-refinements have generated_code: null and the escalation
path dead.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Reclassify learning-routes.jsonl entries as code vs behavioral

**Files:**

- Modify: `.claude/state/learning-routes.jsonl`
- Create: `scripts/reclassify-learning-routes.js` (one-time migration script)

40 routes exist. The research found only 2 target code patterns; 38 are
behavioral/process with no deterministic enforcement path. These 38 should NOT
be stuck at "refined" waiting for code enforcement that will never come.

- [ ] **Step 1: Write the migration script**

```javascript
#!/usr/bin/env node
/**
 * reclassify-learning-routes.js — One-time migration
 *
 * Reads learning-routes.jsonl, tags each entry with enforcement_layer
 * (deterministic|semi-deterministic|probabilistic), and updates status
 * for behavioral routes from "refined" to "behavioral-acknowledged".
 */

const fs = require("node:fs");
const path = require("node:path");

let sanitizeError;
try {
  ({ sanitizeError } = require(
    path.join(__dirname, "lib", "security-helpers.js")
  ));
} catch {
  sanitizeError = () => "error (details redacted)";
}

const { safeWriteFileSync } = require(
  path.join(__dirname, "lib", "safe-fs.js")
);

const ROUTES_PATH = path.join(
  __dirname,
  "..",
  ".claude",
  "state",
  "learning-routes.jsonl"
);

// Routes that map to verified-patterns.json entries (deterministic enforcement)
const CODE_PATTERN_IDS = new Set([
  // Will be populated after reading the file and cross-referencing
]);

function main() {
  let content;
  try {
    content = fs.readFileSync(ROUTES_PATH, "utf8");
  } catch (error) {
    console.error(`Failed to read routes: ${sanitizeError(error)}`);
    process.exit(1);
  }

  const lines = content.trim().split("\n");
  const updated = [];
  let reclassified = 0;

  for (const line of lines) {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      updated.push(line); // preserve malformed lines as-is
      continue;
    }

    const routeType = entry.route || "";
    const learningType = entry.learning?.type || "";

    // Classify enforcement layer
    if (routeType === "verified-pattern" || routeType === "lint-rule") {
      entry.enforcement_layer = "deterministic";
      // These can stay as-is — they're code-enforceable
    } else if (routeType === "hook-gate") {
      entry.enforcement_layer = "semi-deterministic";
      // Hook gates CAN enforce tool-call patterns but NOT cognitive patterns
      if (entry.status === "refined") {
        entry.status = "behavioral-acknowledged";
        entry._reclassified = "2026-04-07";
        entry._reclassification_reason =
          "hook-gate routes require human judgment to advance";
        reclassified++;
      }
    } else if (routeType === "claude-md-annotation") {
      entry.enforcement_layer = "probabilistic";
      // These can never be deterministically enforced
      if (entry.status === "refined") {
        entry.status = "behavioral-acknowledged";
        entry._reclassified = "2026-04-07";
        entry._reclassification_reason =
          "behavioral patterns are probabilistic, cannot graduate to deterministic enforcement";
        reclassified++;
      }
    }

    updated.push(JSON.stringify(entry));
  }

  const output = updated.join("\n") + "\n";
  const relPath = path.relative(path.join(__dirname, ".."), ROUTES_PATH);
  safeWriteFileSync(ROUTES_PATH, output);

  console.log(`Reclassified ${reclassified} of ${lines.length} routes`);
  console.log(`Updated: ${relPath}`);
}

main();
```

- [ ] **Step 2: Run the migration (dry check first)**

Run:
`node -e "const fs=require('fs'); const lines=fs.readFileSync('.claude/state/learning-routes.jsonl','utf8').trim().split('\n').map(l=>JSON.parse(l)); const byRoute={}; lines.forEach(l=>{byRoute[l.route]=(byRoute[l.route]||0)+1}); console.log(byRoute)"`

This confirms the route type distribution before migration.

- [ ] **Step 3: Run the migration**

Run: `node scripts/reclassify-learning-routes.js` Expected:
`Reclassified ~38 of 40 routes`

- [ ] **Step 4: Verify the result**

Run:
`node -e "const fs=require('fs'); const lines=fs.readFileSync('.claude/state/learning-routes.jsonl','utf8').trim().split('\n').map(l=>JSON.parse(l)); const byStatus={}; lines.forEach(l=>{byStatus[l.status]=(byStatus[l.status]||0)+1}); console.log(byStatus)"`
Expected: `{ enforced: 1, 'behavioral-acknowledged': ~38, refined: ~1 }`

- [ ] **Step 5: Commit**

```bash
git add scripts/reclassify-learning-routes.js .claude/state/learning-routes.jsonl
git commit -m "fix: reclassify 38 behavioral learning routes stuck at 'refined'

These routes were stuck because behavioral patterns (CLAUDE.md annotations,
hook gates for cognitive patterns) cannot graduate to deterministic
enforcement. Reclassified to 'behavioral-acknowledged' with enforcement_layer
tags (deterministic/semi-deterministic/probabilistic).

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Replace the vanity metric with 4 minimum viable metrics

**Files:**

- Modify: `scripts/analyze-learning-effectiveness.js` (gut
  `calculateSummaryMetrics`, rewrite)
- Modify: `docs/LEARNING_METRICS.md` (new format)
- Test: `tests/scripts/analyze-learning-effectiveness.test.ts`

The current 88.7% metric counts "patterns not seen again" as evidence of
learning. Replace with 4 metrics from the deep-research findings that form a
closed loop:

1. **New violations per PR** (rolling 30-day) — from hook-warnings-log.jsonl
2. **Recurrence rate** (same rule, same file category) — from
   hook-warnings-log.jsonl
3. **Hook adoption rate** (% commits where hooks ran) — from hook-runs.jsonl (if
   available) or git log
4. **Time-to-fix per category** — from review-metrics.jsonl timestamps

- [ ] **Step 1: Write failing tests for the 4 new metrics**

In `tests/scripts/analyze-learning-effectiveness.test.ts`:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Minimum Viable Metrics", () => {
  it("calculates new violations per PR from hook warnings", () => {
    const warnings = [
      { timestamp: "2026-04-01T00:00:00Z", category: "patterns", pr: "490" },
      { timestamp: "2026-04-02T00:00:00Z", category: "patterns", pr: "491" },
      { timestamp: "2026-04-02T00:00:00Z", category: "patterns", pr: "491" },
    ];
    // 3 violations across 2 PRs = 1.5 violations/PR
    const result = calculateViolationsPerPr(warnings);
    assert.equal(result.violationsPerPr, 1.5);
    assert.equal(result.prCount, 2);
  });

  it("calculates recurrence rate by category", () => {
    const warnings = [
      { timestamp: "2026-03-01T00:00:00Z", category: "patterns" },
      { timestamp: "2026-03-15T00:00:00Z", category: "patterns" },
      { timestamp: "2026-03-01T00:00:00Z", category: "propagation" },
      { timestamp: "2026-04-01T00:00:00Z", category: "tdms-s0" },
    ];
    const result = calculateRecurrenceRate(warnings);
    // "patterns" recurs (2 occurrences), "propagation" and "tdms-s0" don't
    assert.equal(result.recurringCategories, 1);
    assert.equal(result.totalCategories, 3);
  });

  it("calculates weekly trend direction", () => {
    const thisWeek = [1, 2, 1]; // 4 violations
    const lastWeek = [3, 2, 2]; // 7 violations
    const trend = calculateTrend(thisWeek, lastWeek);
    assert.equal(trend.direction, "declining");
    assert.ok(trend.changePercent < 0);
  });

  it("returns 'insufficient_data' when less than 2 weeks of data", () => {
    const warnings = [
      { timestamp: "2026-04-06T00:00:00Z", category: "patterns" },
    ];
    const result = calculateViolationsPerPr(warnings, { windowDays: 30 });
    assert.equal(result.signal, "insufficient_data");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
`npm run test:build && node --test dist-tests/tests/scripts/analyze-learning-effectiveness.test.js`
Expected: FAIL — functions not exported

- [ ] **Step 3: Implement the 4 metric functions**

Add to `scripts/analyze-learning-effectiveness.js`, replacing the old
`calculateSummaryMetrics` method. The new functions are standalone (not class
methods) so they can be exported and tested:

```javascript
/**
 * Calculate new violations per PR over a rolling window.
 * Source: hook-warnings-log.jsonl + archive
 *
 * @param {Array<{timestamp: string, category: string, pr?: string}>} warnings
 * @param {{ windowDays?: number }} options
 * @returns {{ violationsPerPr: number, prCount: number, totalViolations: number, signal: string }}
 */
function calculateViolationsPerPr(warnings, options = {}) {
  const windowDays = options.windowDays || 30;
  const cutoff = new Date(Date.now() - windowDays * 86400000);

  const recent = warnings.filter((w) => new Date(w.timestamp) >= cutoff);
  if (recent.length < 2) {
    return {
      violationsPerPr: 0,
      prCount: 0,
      totalViolations: 0,
      signal: "insufficient_data",
    };
  }

  const prs = new Set(recent.map((w) => w.pr).filter(Boolean));
  const prCount = Math.max(prs.size, 1);
  const violationsPerPr = +(recent.length / prCount).toFixed(2);

  return {
    violationsPerPr,
    prCount,
    totalViolations: recent.length,
    signal: "ok",
  };
}

/**
 * Calculate recurrence rate — how many categories appear more than once.
 *
 * @param {Array<{timestamp: string, category: string}>} warnings
 * @returns {{ recurringCategories: number, totalCategories: number, recurrenceRate: number }}
 */
function calculateRecurrenceRate(warnings) {
  const counts = {};
  for (const w of warnings) {
    counts[w.category] = (counts[w.category] || 0) + 1;
  }
  const totalCategories = Object.keys(counts).length;
  const recurringCategories = Object.values(counts).filter((c) => c > 1).length;
  const recurrenceRate =
    totalCategories > 0
      ? +(recurringCategories / totalCategories).toFixed(3)
      : 0;

  return { recurringCategories, totalCategories, recurrenceRate };
}

/**
 * Calculate week-over-week trend direction.
 *
 * @param {number[]} thisWeek - violation counts per day this week
 * @param {number[]} lastWeek - violation counts per day last week
 * @returns {{ direction: string, changePercent: number }}
 */
function calculateTrend(thisWeek, lastWeek) {
  const sumThis = thisWeek.reduce((a, b) => a + b, 0);
  const sumLast = lastWeek.reduce((a, b) => a + b, 0);

  if (sumLast === 0) {
    return {
      direction: sumThis === 0 ? "stable" : "rising",
      changePercent: sumThis > 0 ? 100 : 0,
    };
  }
  const changePercent = +(((sumThis - sumLast) / sumLast) * 100).toFixed(1);
  const direction =
    changePercent < -10
      ? "declining"
      : changePercent > 10
        ? "rising"
        : "stable";

  return { direction, changePercent };
}
```

Export these at the bottom of the file alongside the existing class export.

- [ ] **Step 4: Run tests to verify they pass**

Run:
`npm run test:build && node --test dist-tests/tests/scripts/analyze-learning-effectiveness.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/analyze-learning-effectiveness.js tests/scripts/analyze-learning-effectiveness.test.ts
git commit -m "feat: replace vanity learning metric with 4 minimum viable metrics

The 88.7% 'learning effectiveness' was a vanity metric that counted
pattern absence as evidence of learning. Replaced with:
- new violations per PR (rolling 30-day)
- recurrence rate per category
- week-over-week trend direction
All derivable from existing hook-warnings-log.jsonl data.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Wire the new metrics into the session-start dashboard

**Files:**

- Modify: `scripts/analyze-learning-effectiveness.js` (the `outputReport` and
  `updateMetrics` methods)
- Modify: `scripts/health/checkers/learning-effectiveness.js` (read new metric
  format)
- Modify: `docs/LEARNING_METRICS.md` (new format)

- [ ] **Step 1: Rewrite the `updateMetrics` method to write new format**

Replace the existing `updateMetrics()` in
`scripts/analyze-learning-effectiveness.js` to read hook-warnings-log.jsonl
(current + archive) and compute the 4 MVMs:

```javascript
  async updateMetrics() {
    const fs = require("node:fs");
    const warningsPath = join(ROOT, ".claude", "state", "hook-warnings-log.jsonl");
    const archivePath = warningsPath + ".archive";

    let warnings = [];
    for (const p of [archivePath, warningsPath]) {
      try {
        const content = fs.readFileSync(p, "utf-8");
        const lines = content.trim().split("\n");
        for (const line of lines) {
          try { warnings.push(JSON.parse(line)); } catch { /* skip malformed */ }
        }
      } catch { /* file may not exist */ }
    }

    const vPerPr = calculateViolationsPerPr(warnings);
    const recurrence = calculateRecurrenceRate(warnings);

    // Weekly trend: split warnings into this week vs last week
    const now = Date.now();
    const weekMs = 7 * 86400000;
    const thisWeekW = warnings.filter((w) => now - new Date(w.timestamp).getTime() < weekMs);
    const lastWeekW = warnings.filter((w) => {
      const age = now - new Date(w.timestamp).getTime();
      return age >= weekMs && age < 2 * weekMs;
    });
    const trend = calculateTrend(
      [thisWeekW.length],
      [lastWeekW.length]
    );

    const metricsContent = [
      "# Learning Metrics (Minimum Viable)",
      "",
      `**Updated:** ${new Date().toISOString().split("T")[0]}`,
      `**Data source:** hook-warnings-log.jsonl (${warnings.length} entries)`,
      "",
      "| Metric | Value | Signal |",
      "| --- | --- | --- |",
      `| Violations per PR (30-day) | ${vPerPr.violationsPerPr} | ${vPerPr.signal} |`,
      `| Recurring categories | ${recurrence.recurringCategories}/${recurrence.totalCategories} (${(recurrence.recurrenceRate * 100).toFixed(1)}%) | ${recurrence.recurrenceRate > 0.5 ? "high" : "ok"} |`,
      `| Week-over-week trend | ${trend.direction} (${trend.changePercent > 0 ? "+" : ""}${trend.changePercent}%) | ${trend.direction} |`,
      `| Total warnings (all time) | ${warnings.length} | — |`,
      "",
      "## Interpretation",
      "",
      "- **Violations per PR declining** = learning is working",
      "- **Recurrence rate declining** = enforcement is sticking",
      "- **Week-over-week declining** = system improving",
      "- All flat or rising = system not learning, investigate",
      "",
    ].join("\n");

    safeWriteFile(METRICS_FILE, metricsContent);
    console.log(`\n✅ Metrics updated: ${METRICS_FILE}`);
  }
```

- [ ] **Step 2: Rewrite the `outputReport` method dashboard section**

Replace the vanity metric dashboard block in `outputReport()`:

```javascript
// Replace the old "LEARNING EFFECTIVENESS DASHBOARD" block with:
console.log(
  "╔════════════════════════════════════════════════════════════════════════╗"
);
console.log(
  "║            LEARNING SYSTEM — MINIMUM VIABLE METRICS                   ║"
);
console.log(
  "╚════════════════════════════════════════════════════════════════════════╝"
);
console.log("");
console.log(`  Violations/PR (30d):     ${vPerPr.violationsPerPr}`);
console.log(
  `  Recurring categories:    ${recurrence.recurringCategories}/${recurrence.totalCategories}`
);
console.log(
  `  Week-over-week:          ${trend.direction} (${trend.changePercent > 0 ? "+" : ""}${trend.changePercent}%)`
);
console.log(`  Data points:             ${warnings.length} warnings`);
console.log("");
```

- [ ] **Step 3: Update health checker to read new metric format**

In `scripts/health/checkers/learning-effectiveness.js`, update the regex
patterns:

```javascript
const violationsMatch = content.match(/Violations per PR.*?\|\s*([\d.]+)/);
const recurrenceMatch = content.match(
  /Recurring categories.*?\|\s*\d+\/\d+\s*\(([\d.]+)%\)/
);
const trendMatch = content.match(/Week-over-week trend.*?\|\s*(\w+)/);

const violationsPerPr = violationsMatch
  ? Number.parseFloat(violationsMatch[1])
  : null;
const recurrenceRate = recurrenceMatch
  ? Number.parseFloat(recurrenceMatch[1])
  : null;
const trendDirection = trendMatch ? trendMatch[1] : null;
```

Update BENCHMARKS:

```javascript
const BENCHMARKS = {
  violations_per_pr: { good: 1, average: 3, poor: 5 },
  recurrence_rate: { good: 20, average: 40, poor: 60 },
};
```

- [ ] **Step 4: Run full test suite**

Run:
`npm run test:build && node --test dist-tests/tests/scripts/analyze-learning-effectiveness.test.js && node --test dist-tests/tests/scripts/health/checkers/__tests__/learning-effectiveness.test.js`
Expected: PASS

- [ ] **Step 5: Run the analyzer to verify end-to-end**

Run: `npm run learning:analyze -- --auto` Expected: New dashboard format with
MVM metrics instead of 88.7%

- [ ] **Step 6: Commit**

```bash
git add scripts/analyze-learning-effectiveness.js scripts/health/checkers/learning-effectiveness.js docs/LEARNING_METRICS.md tests/
git commit -m "feat: wire 4 minimum viable metrics into session-start dashboard

Session-start now shows violations/PR, recurrence rate, and
week-over-week trend instead of the vanity 88.7% effectiveness
metric. Health checker updated to read new format.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Regenerate pending-refinements.jsonl with fixed data

**Files:**

- Modify: `.claude/state/pending-refinements.jsonl` (regenerated by running
  refine-scaffolds)

Now that Task 1 fixed the field-name mismatch and Task 2 reclassified routes,
regenerate the pending-refinements file.

- [ ] **Step 1: Back up current pending-refinements**

Run:
`cp .claude/state/pending-refinements.jsonl .claude/state/pending-refinements.jsonl.bak`

- [ ] **Step 2: Clear and regenerate**

Run: `node scripts/refine-scaffolds.js --json` Expected: Output showing
promoted/refined/skipped counts with non-null `generated_code` values

- [ ] **Step 3: Verify generated_code is populated**

Run:
`node -e "const fs=require('fs'); const lines=fs.readFileSync('.claude/state/pending-refinements.jsonl','utf8').trim().split('\n').map(l=>JSON.parse(l)); const nullCount=lines.filter(l=>l.generated_code===null).length; console.log('null generated_code:', nullCount, '/', lines.length)"`
Expected: `null generated_code: 0 / N` (or small number for entries that
genuinely have no code)

- [ ] **Step 4: Clean up backup**

Run: `rm .claude/state/pending-refinements.jsonl.bak`

- [ ] **Step 5: Commit**

```bash
git add .claude/state/pending-refinements.jsonl
git commit -m "fix: regenerate pending-refinements with populated generated_code

After fixing the field-name mismatch in learning-router, regenerated
pending-refinements.jsonl so entries have non-null generated_code
values and the escalation path is functional.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Update the run-consolidation.js invocation

**Files:**

- Modify: `scripts/run-consolidation.js:796-800`

The consolidation script invokes the analyzer with `--auto`. Verify it still
works with the rewritten analyzer.

- [ ] **Step 1: Read the invocation context**

Run: Read `scripts/run-consolidation.js` around line 796.

- [ ] **Step 2: Run consolidation in dry mode to verify no breakage**

Run: `node scripts/run-consolidation.js --dry-run 2>&1 | tail -20` Expected:
Learning effectiveness section runs without errors

- [ ] **Step 3: Commit (only if changes were needed)**

If no changes needed, skip this commit.

---

### Task 7: Update package.json npm scripts (if needed)

**Files:**

- Modify: `package.json` (lines 60-64)

- [ ] **Step 1: Verify existing npm scripts still work**

Run: `npm run learning:analyze -- --auto` Expected: New MVM dashboard output

- [ ] **Step 2: Remove obsolete scripts if any**

The `learning:category` script may no longer apply. Check if the `--category`
flag still exists in the rewritten analyzer. If not, remove the npm script.

- [ ] **Step 3: Commit (only if changes were needed)**

---

### Task 8: End-to-end verification

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `npm run test:build && npm test` Expected: All tests pass

- [ ] **Step 2: Run the session-start hook manually**

Run: `npm run learning:analyze -- --auto` Expected: New dashboard with MVM
metrics

- [ ] **Step 3: Verify health check**

Run: `node scripts/health/run-health-check.js --quick` Expected: Learning
effectiveness checker reports metrics from new format

- [ ] **Step 4: Verify no untracked files**

Run: `git status` Expected: Clean working tree or only expected state file
changes

---

## Scope Notes

**What this plan does NOT include (deferred to future work):**

- **Review bot feedback loop** — suppressing stale repeat findings from
  Qodo/SonarCloud. This requires changes to the PR review pipeline, not the
  learning system.
- **Notion-style ratchet mechanism** — enforcing "no new violations above
  baseline." This is a Phase 3 item that requires the MVM data to accumulate for
  60+ days first.
- **60-day sunset evaluation** — Phase 4. Requires the MVMs to run for 60 days
  before any system can be evaluated for decommissioning.
- **Behavioral compliance proxy metrics** — measuring CLAUDE.md guardrail
  adherence. This is the "other side" of the architectural separation and needs
  its own plan.
