<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-01
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Phase 7: Integration & Cutover - Research

**Researched:** 2026-03-01 **Domain:** Session lifecycle integration, v1-to-v2
migration, test infrastructure, health scoring **Confidence:** HIGH

## Summary

Phase 7 is an integration and wiring phase -- no new algorithms or data
structures, just connecting existing v2 components into the session lifecycle,
swapping v1 scripts, filling test gaps, and establishing baseline metrics. All
building blocks exist from Phases 1-6.

The current health score is 62-63 (grade D), far below the B+ target (87+). The
biggest drag comes from Technical Debt (F/24), Testing (F/25), and
Infrastructure (F/41) categories. The B+ target requires either recalibrating
benchmarks to reflect this project's reality (SonarCloud debt is
external/automated intake) or excluding certain categories from the composite.

The quick health check runs in 0.13s and the full check in 0.28s -- both well
within performance budgets. Session-start already runs many checks but does NOT
run health:quick. Session-end is a skill (SKILL.md), not a hook, and does NOT
run health:score.

**Primary recommendation:** Start with session-start/end wiring (INTG-01/02)
since they are simple additions, then do v1-to-v2 cutover (INTG-06), then E2E
smoke test (INTG-07), then fill test gaps (TEST-02 through TEST-05), and finally
establish baseline (INTG-08) last since it depends on everything else being
stable.

## Standard Stack

No new libraries needed. Phase 7 uses existing infrastructure:

### Core

| Component           | Location                              | Purpose                         | Status                        |
| ------------------- | ------------------------------------- | ------------------------------- | ----------------------------- |
| Health check runner | `scripts/health/run-health-check.js`  | Composite scoring, 10 checkers  | Complete                      |
| Session-start hook  | `.claude/hooks/session-start.js`      | Session lifecycle startup       | Needs health:quick addition   |
| Session-end skill   | `.claude/skills/session-end/SKILL.md` | Session lifecycle shutdown      | Needs health:score addition   |
| v2 review scripts   | `scripts/reviews/*.ts`                | JSONL-first review pipeline     | Complete, compiled to `dist/` |
| v1 review scripts   | `scripts/*.js` (root)                 | Legacy sync/promote/consolidate | To be swapped out             |
| Settings config     | `.claude/settings.json`               | Hook registration               | Wiring target                 |

### Supporting

| Component        | Location                                                      | Purpose                |
| ---------------- | ------------------------------------------------------------- | ---------------------- |
| Gemini config    | `.gemini/config.yaml` + `.gemini/styleguide.md`               | Already in-repo        |
| Compaction hooks | `.claude/hooks/pre-compaction-save.js` + `compact-restore.js` | State persistence      |
| Pre-commit hook  | `.husky/pre-commit`                                           | 11-check gate pipeline |
| Health log       | `data/ecosystem-v2/ecosystem-health-log.jsonl`                | Score history          |

## Architecture Patterns

### 1. Session-Start Hook Integration (INTG-01)

**Current session-start.js structure** (574 lines):

1. Cross-session validation (check previous session ended)
2. Encrypted secrets check
3. Dependency cache check + npm ci
4. Firebase Functions build
5. Test build (dist-tests TTL guard)
6. Pattern compliance check
7. Auto-consolidation
8. Review sync (markdown to JSONL)
9. Commit log sync
10. Archive health check (reviews.jsonl rotation)
11. State log rotation
12. Technical Debt health check (TDMS)

**Where to add health:quick:** After step 12 (TDMS check), before the final
summary. The quick check runs 4/10 checkers (code-quality, security,
debt-health, test-coverage) in 0.13s. It should be non-blocking (continue on
error) to avoid breaking session startup.

**Pattern:**

```javascript
// Health quick check (non-blocking)
try {
  const output = execFileSync(
    "node",
    ["scripts/health/run-health-check.js", "--quick"],
    {
      cwd: projectDir,
      stdio: "pipe",
      timeout: 10000,
      encoding: "utf8",
    }
  );
  // Parse last line for score
  const scoreMatch = output.match(/Score:\s*(\d+)/);
  if (scoreMatch) {
    console.log(`Health: ${scoreMatch[1]} (quick)`);
  }
} catch {
  // Non-fatal
}
```

### 2. Session-End Skill Integration (INTG-02)

**Current session-end SKILL.md** has 9 steps. Health:score should be added as a
new step between step 7b (Review Sync) and step 8 (TDMS Consolidation).

**Pattern for SKILL.md addition:**

```markdown
## 7c. Health Score Snapshot

Run a full health check and persist the score:

\`\`\`bash node scripts/health/run-health-check.js \`\`\`
```

Note: The health check already appends to the log. Verify whether
`run-health-check.js` self-persists or requires external persistence. Based on
the existing log entries, the runner appears to self-persist via the `--json`
output path.

### 3. v1-to-v2 Script Cutover Map (INTG-06)

| v1 Script (scripts/)          | v2 Equivalent (scripts/reviews/)                                   | npm Script          | Action             |
| ----------------------------- | ------------------------------------------------------------------ | ------------------- | ------------------ |
| `sync-reviews-to-jsonl.js`    | `write-review-record.ts` + `write-retro-record.ts`                 | `reviews:sync`      | Swap caller        |
| `promote-patterns.js`         | `lib/promote-patterns.ts` (already wraps v2)                       | `patterns:promote`  | Already v2 wrapper |
| `run-consolidation.js`        | `lib/completeness.ts` (partial)                                    | `consolidation:run` | Needs evaluation   |
| `check-pattern-compliance.js` | `verify-enforcement-manifest.ts` + `build-enforcement-manifest.ts` | `patterns:check`    | Partial overlap    |

**Key insight:** `promote-patterns.js` is already a thin wrapper that calls into
the v2 TypeScript pipeline. The cutover for this script is essentially done. The
main cutover targets are `sync-reviews-to-jsonl.js` and `run-consolidation.js`.

**Fallback strategy:** Rename v1 scripts to `*.v1.js` and add a `--v1` flag to
npm scripts. Or keep v1 scripts in place and create v2 npm script aliases.

### 4. Gemini Config Status (INTG-03)

The Gemini review config is **already in-repo** at `.gemini/config.yaml` and
`.gemini/styleguide.md`. Both are version-controlled. This requirement may
already be satisfied. Verify by checking git history for when these were added.

### 5. Test Tier Inventory (TEST-03)

**Current count: 54 source test files** (excluding dist-tests duplicates)

| Tier        | Count | Files                                                                                   |
| ----------- | ----- | --------------------------------------------------------------------------------------- |
| Unit        | 47    | `tests/**/*.test.ts`, `scripts/reviews/__tests__/*.test.ts`, `scripts/health/*.test.js` |
| Contract    | 7     | `tests/scripts/ecosystem-v2/contracts/*.contract.test.ts`                               |
| Integration | 0     | None exist                                                                              |
| E2E         | 0     | None exist                                                                              |
| Performance | 0     | None exist                                                                              |

**Target: 39 test files across 5 tiers.** We already have 54 files but zero in 3
tiers. The requirement is about tier coverage, not total count. Need to create:

- At least 1 integration test (cross-module pipeline test)
- At least 1 E2E test (full markdown-to-enforcement pipeline)
- At least 1 performance test (timing budget assertions)

### Anti-Patterns to Avoid

- **Do not add health check as a blocking gate in session-start.** A D grade
  would block every session. It must be informational only.
- **Do not delete v1 scripts without a fallback mechanism.** The cutover should
  be reversible for at least one sprint.
- **Do not try to reach B+ by only tuning benchmarks.** The Technical Debt
  category (F/24) reflects real SonarCloud intake volume. The baseline
  definition needs to account for which categories are within the ecosystem's
  control vs external factors.

## Don't Hand-Roll

| Problem           | Don't Build              | Use Instead                                     | Why                                                           |
| ----------------- | ------------------------ | ----------------------------------------------- | ------------------------------------------------------------- |
| Health scoring    | Custom metric calculator | `scripts/health/run-health-check.js`            | Already has 10 checkers, composite scoring, grade computation |
| JSONL persistence | Custom file append       | `scripts/reviews/lib/write-jsonl.ts`            | Handles atomic writes, schema validation                      |
| Test runner       | Custom test harness      | Node.js built-in `--test`                       | Already configured in package.json                            |
| Compaction state  | Custom save/restore      | `pre-compaction-save.js` + `compact-restore.js` | Already captures comprehensive state                          |

## Common Pitfalls

### Pitfall 1: Health Score Baseline Unreachable at B+ (87+)

**What goes wrong:** The current composite score is 62 (D grade). Technical Debt
alone scores 24/100 due to 7,371 open items and 39 S0 findings -- most from
automated SonarCloud intake, not hand-created debt. Reaching B+ requires all
categories averaging 87+.

**Why it happens:** The health scoring benchmarks were designed for a small,
manually-curated debt tracker, not SonarCloud's automated bulk import.

**How to avoid:** Define the B+ baseline with category exclusions or adjusted
benchmarks for Technical Debt. Document which categories are
"ecosystem-controlled" vs "external-feed-dominated."

**Warning signs:** Score stuck at D regardless of real improvements in other
areas.

### Pitfall 2: Session-Start Timeout Budget

**What goes wrong:** Session-start already runs 12+ steps. Adding health:quick
(0.13s) is fine, but adding health:full (0.28s) or anything heavier risks
pushing session-start past the 30s budget.

**Why it happens:** Each addition seems small in isolation.

**How to avoid:** Only add `--quick` to session-start. Full check goes in
session-end (not time-constrained).

**Warning signs:** Session-start takes >15s consistently.

### Pitfall 3: v1/v2 Script Confusion During Cutover

**What goes wrong:** npm scripts still point to v1, hooks reference v1, but v2
data format is different. Running the wrong version corrupts data.

**Why it happens:** Partial cutover leaves mixed references.

**How to avoid:** Cut over one script at a time, verify with E2E test after each
swap, and keep v1 available via explicit `--v1` flag or renamed file.

### Pitfall 4: Test Count vs Test Tier Mismatch

**What goes wrong:** Claiming 54 test files "exceeds" the 39-file requirement
while having zero coverage in 3 of 5 tiers.

**Why it happens:** The requirement specifies 39 files ACROSS 5 tiers, implying
minimum coverage in each tier.

**How to avoid:** Create at least 1 test file per missing tier (integration,
E2E, performance). The total count is already well above 39.

### Pitfall 5: Cross-Doc Sync Gap False Positive

**What goes wrong:** The cross-doc dependency checker
(`check-cross-doc-deps.js --trivial`) only checks staged files. Running it
without staged files shows "No staged files to check" -- not a clean bill of
health.

**Why it happens:** The checker is a pre-commit gate, not a full-repo scanner.

**How to avoid:** Use `check-cross-doc-deps.js --all` (if available) or manually
audit known cross-doc references for INTG-04.

## Code Examples

### Adding health:quick to session-start.js

```javascript
// Add after the TDMS health check block (line ~565), before final summary
// Source: Pattern from existing session-start.js structure
try {
  const healthOutput = execFileSync(
    "node",
    ["scripts/health/run-health-check.js", "--quick"],
    {
      cwd: projectDir,
      encoding: "utf8",
      stdio: "pipe",
      timeout: 10000,
    }
  );
  // Extract score from stderr (run-health-check writes to stderr for text mode)
  const lines = healthOutput.split("\n");
  const scoreLine = lines.find((l) => l.includes("Score:"));
  if (scoreLine) {
    console.log(`Health: ${scoreLine.trim()}`);
  }
} catch {
  console.log("Health check: skipped (non-fatal)");
}
```

### E2E Smoke Test Structure (TEST-02 / INTG-07)

```javascript
// tests/e2e/pipeline-smoke.e2e.test.js
const { describe, it } = require("node:test");
const assert = require("node:assert");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

describe("E2E: Full pipeline smoke test", () => {
  it("review markdown -> JSONL -> consolidation -> promotion -> enforcement", () => {
    // Step 1: Write a test review record
    // Step 2: Run sync to JSONL
    // Step 3: Run consolidation
    // Step 4: Run promotion pipeline
    // Step 5: Verify enforcement manifest updated
    // Step 6: Run gate check (verify-enforcement-manifest)
    // Each step asserts expected output before proceeding
  });
});
```

### Performance Budget Test Structure (TEST-04)

```javascript
// tests/perf/budget.perf.test.js
const { describe, it } = require("node:test");
const assert = require("node:assert");

describe("Performance budgets", () => {
  it("gate check completes in <3s", () => {
    const start = Date.now();
    // Run verify-enforcement-manifest
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 3000, `Gate check took ${elapsed}ms (budget: 3000ms)`);
  });

  it("pre-commit hook completes in <10s", () => {
    // Measure pre-commit hook execution time
  });

  it("health:quick completes in <1s", () => {
    const start = Date.now();
    // Run health check --quick
    const elapsed = Date.now() - start;
    assert.ok(
      elapsed < 1000,
      `Quick health check took ${elapsed}ms (budget: 1000ms)`
    );
  });
});
```

## State of the Art

| Component      | Current State                         | Phase 7 Target                       | Gap                            |
| -------------- | ------------------------------------- | ------------------------------------ | ------------------------------ |
| Session-start  | 12 steps, no health check             | 13 steps with health:quick           | 1 addition                     |
| Session-end    | 9-step skill, no health score         | 10-step skill with health:score      | 1 addition                     |
| Gemini config  | Already in `.gemini/`                 | In-repo version controlled           | Already done                   |
| v1 scripts     | 4 scripts in `scripts/` root          | Replaced by v2 in `scripts/reviews/` | 2-3 scripts to swap            |
| Test files     | 54 files, 2 tiers (unit + contract)   | 39+ files, 5 tiers                   | 3 tiers missing                |
| Health score   | 62 (D grade)                          | B+ (87+) baseline                    | Benchmark recalibration needed |
| Compaction     | pre-compaction-save + compact-restore | Verify ecosystem state survives      | Needs verification             |
| Cross-doc sync | Checker exists, pre-commit gated      | Verify no gaps remain                | Needs audit                    |

## Current Health Score Breakdown

**Composite: 62/100 (D grade)** -- from most recent full check

| Category            | Score | Grade | Key Issue                                 |
| ------------------- | ----- | ----- | ----------------------------------------- |
| Code Quality        | 92    | A     | 1 TS error, 1 circular dep                |
| Learning & Patterns | 85    | B     | Low automation coverage (14%)             |
| Security            | 75    | C     | audit_status = 0 (npm audit issue)        |
| Documentation       | 71    | C     | Staleness (30 days)                       |
| Process & Workflow  | 70    | C     | No recent reviews/velocity                |
| Infrastructure      | 41-48 | F     | High warnings/overrides count             |
| Testing             | 25    | F     | 40% pass rate, 3 errors, 22-day staleness |
| Technical Debt      | 24    | F     | 7,371 open items, 39 S0, 1,220 S1         |

**B+ (87+) feasibility analysis:** Even if Code Quality (A), Learning (B),
Security (C->B), Documentation (C->B), and Process (C->B) all reach B+, the
F-tier categories would need to reach at least C (70) for the composite to
approach B+. Technical Debt at 24 is the primary blocker -- those 7,371
SonarCloud items cannot be resolved in Phase 7.

**Recommendation for INTG-08:** Define the "ecosystem composite" as a subset of
categories that the ecosystem actually controls (exclude or weight-down
Technical Debt which is dominated by external SonarCloud intake). Alternatively,
adjust the Technical Debt benchmarks to reflect the project's scale.

## Requirement Dependency Order

```
INTG-03 (Gemini config) -----> Already done, just verify
INTG-04 (Cross-doc sync) ----> Independent verification task
INTG-05 (Compaction) --------> Independent verification task

INTG-01 (session-start) -----> Simple, do early
INTG-02 (session-end) -------> Simple, do early

INTG-06 (v1-to-v2 cutover) --> After INTG-01/02 (need stable session hooks)
  |
  v
INTG-07 (E2E smoke test) ----> After INTG-06 (tests v2 pipeline end-to-end)
TEST-02 (E2E test file) -----> Same as INTG-07
  |
  v
TEST-03 (39 files / 5 tiers) -> After TEST-02 (E2E tier filled)
TEST-04 (Perf budgets) -------> After INTG-06 (measure v2 scripts)
TEST-05 (Tests with scripts) -> Parallel with TEST-03/04

INTG-08 (Baseline score) ----> LAST (after all fixes, measures final state)
```

**Suggested plan grouping:**

1. **Plan 07-01: Verification & Quick Wins** -- INTG-03 (verify), INTG-04
   (verify), INTG-05 (verify)
2. **Plan 07-02: Session Lifecycle Wiring** -- INTG-01, INTG-02
3. **Plan 07-03: v1-to-v2 Cutover** -- INTG-06
4. **Plan 07-04: E2E Smoke Test** -- INTG-07, TEST-02
5. **Plan 07-05: Test Tier Completion** -- TEST-03, TEST-04, TEST-05
6. **Plan 07-06: Baseline Establishment** -- INTG-08

## Open Questions

1. **Does `run-health-check.js` self-persist to the health log?**
   - What we know: The health log has entries with full categoryScores. The
     runner has `--json` flag.
   - What's unclear: Whether persistence happens automatically or requires
     explicit append.
   - Recommendation: Read the full runner source to confirm. If not
     self-persisting, add persistence in session-end.

2. **What constitutes "cross-doc sync gap closure"?**
   - What we know: `check-cross-doc-deps.js` exists as a pre-commit gate. It
     only checks staged files.
   - What's unclear: Whether there's a full-repo mode, and what specific sync
     gaps were identified in earlier phases.
   - Recommendation: Run `check-cross-doc-deps.js` with `--all` flag or manually
     audit. Check Phase 6 outputs for identified gaps.

3. **Which v1 scripts are still actively called by hooks?**
   - What we know: `sync-reviews-to-jsonl.js` is called by session-start
     (reviews:sync). `run-consolidation.js` is called by session-start.
     `check-pattern-compliance.js` is called by both session-start and
     pre-commit.
   - What's unclear: Whether `check-pattern-compliance.js` has a full v2
     replacement or just partial overlap with `verify-enforcement-manifest.ts`.
   - Recommendation: Map every reference to v1 scripts in hooks and npm scripts
     before cutting over.

4. **How to reach B+ with Technical Debt at F?**
   - What we know: 7,371 open items from SonarCloud intake. Cannot resolve them
     all.
   - What's unclear: Whether the B+ target means "ecosystem-controlled
     categories only" or "overall composite."
   - Recommendation: Ask user or define composite variant that excludes
     external-feed categories.

## Sources

### Primary (HIGH confidence)

- `.claude/hooks/session-start.js` -- Full source read, 574 lines
- `.claude/hooks/pre-compaction-save.js` -- Compaction hook, state capture
- `.claude/hooks/compact-restore.js` -- Compaction restore
- `.claude/settings.json` -- Hook registration config
- `.claude/skills/session-end/SKILL.md` -- Session-end workflow
- `.husky/pre-commit` -- Pre-commit gate pipeline, 365 lines
- `scripts/health/run-health-check.js` -- Health runner with 10 checkers
- `data/ecosystem-v2/ecosystem-health-log.jsonl` -- Actual health scores
- `.gemini/config.yaml` + `.gemini/styleguide.md` -- Gemini config (already
  in-repo)
- `package.json` -- npm scripts mapping

### Measured (HIGH confidence)

- Health quick check: 0.13s (well within 30s session-start budget)
- Health full check: 0.28s (well within any budget)
- Current health score: 62 (D grade)
- Test file count: 54 source files (47 unit, 7 contract, 0 integration/E2E/perf)

## Metadata

**Confidence breakdown:**

- Session lifecycle wiring: HIGH -- read full source of session-start.js and
  SKILL.md
- v1/v2 cutover mapping: HIGH -- identified all 4 v1 scripts and their v2
  equivalents
- Test inventory: HIGH -- enumerated all test files and classified by tier
- Health baseline: HIGH -- ran actual health checks, parsed real log data
- Gemini config: HIGH -- confirmed already in-repo
- Compaction safeguards: MEDIUM -- read hook source but did not test compaction
  cycle
- Cross-doc sync gaps: MEDIUM -- checker exists but could not run full audit
  (staged-only mode)

**Research date:** 2026-03-01 **Valid until:** 2026-03-31 (stable
infrastructure, no external dependencies)
