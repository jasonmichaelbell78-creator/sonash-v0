# Phase 6: Gate Recalibration - Research

n<!-- prettier-ignore-start --> **Document Version:** 1.0 **Last Updated:**
2026-03-01 **Status:** ACTIVE

<!-- prettier-ignore-end -->

**Researched:** 2026-03-01 **Domain:** Git hooks, override tracking, Qodo
PR-Agent config, deferred item lifecycle, review archival **Confidence:** HIGH

## Summary

Phase 6 targets the gating infrastructure: cross-doc deps (currently 50% of all
overrides), override accountability, auto-fix capabilities, deferred item
escalation, Qodo suppression pruning, SECURITY_CHECKLIST/ESLint sync, review
archival automation, DEBT triage automation, and temporal coverage monitoring.

The codebase already has strong foundations: `check-cross-doc-deps.js` supports
`diffPattern`, `gitFilter`, and `--trivial` mode; `log-override.js` writes
structured JSONL to `.claude/override-log.jsonl`; `write-deferred-items.ts`
creates typed deferred records with `defer_count` and `promoted_to_debt` fields;
`archive-reviews.js` handles archival with `--apply` mode; and Phase 5 health
checkers already monitor hook pipeline metrics. The work is about closing gaps
and connecting existing pieces.

**Primary recommendation:** Start with cross-doc deps recalibration (GATE-01) as
it addresses 50% of all overrides. Then add auto-fix (GATE-02) and override
analytics (GATE-03) as they build directly on the same infrastructure. Handle
the independent items (GATE-04 through GATE-09) in parallel or as a second plan.

## Current State Analysis

### Cross-Doc Deps Gate (GATE-01 target)

**Location:** `scripts/check-cross-doc-deps.js` +
`scripts/config/doc-dependencies.json` **Hook integration:** `.husky/pre-commit`
step 7 (blocking)

The gate already supports:

- `diffPattern` (regex applied to `git diff --cached` output)
- `gitFilter` (e.g., `"AD"` = only Added/Deleted, not Modified)
- `--trivial` mode (skips enforcement for whitespace/comment-only changes)
- `checkDiff: true/false` per rule
- `filePattern` (regex filter on matching files)

**Current rules (11 rules in doc-dependencies.json):**

| Rule | Trigger                    | Dependents                  | Has diffPattern | Has gitFilter |
| ---- | -------------------------- | --------------------------- | --------------- | ------------- |
| 1    | ROADMAP.md                 | SESSION_CONTEXT.md          | No              | No            |
| 2    | package.json               | DEVELOPMENT.md              | Yes ("scripts") | No            |
| 3    | .husky/                    | TRIGGERS.md, DEVELOPMENT.md | No              | AD            |
| 4    | .claude/hooks/             | TRIGGERS.md, DEVELOPMENT.md | No              | AD (.js only) |
| 5    | .claude/commands/          | COMMAND_REFERENCE.md        | No              | AD            |
| 6    | .claude/skills/            | COMMAND_REFERENCE.md        | No              | AD            |
| 7    | app/admin/                 | ROADMAP.md                  | No              | AD            |
| 8    | functions/src/admin        | ROADMAP.md                  | No              | No            |
| 9    | app/(protected)/dashboard/ | ROADMAP.md                  | No              | AD            |
| 10   | docs/plans/                | PLAN_MAP.md, README.md      | No              | AD            |
| 11   | docs/technical-debt/       | SESSION_CONTEXT.md          | No              | AD            |

**Override rate analysis (from override-log.jsonl, 166 total entries):**

- cross-doc + cross-doc-deps: 83 overrides = **50.0%** of all overrides
- pattern-compliance: 28 (16.9%)
- audit-s0s1: 20 (12.0%)
- doc-index: 8, doc-header: 8, triggers: 8
- reviewer: 6, tests: 5

**Key insight:** Rules 1 (ROADMAP -> SESSION_CONTEXT) and 4 (.claude/hooks/ ->
TRIGGERS.md, DEVELOPMENT.md) are the biggest override sources. Rule 1 lacks both
`diffPattern` and `gitFilter` -- every ROADMAP.md touch fires it regardless of
what changed. Rule 4 fires on modifications to hooks even though it has
`gitFilter: "AD"` -- but overrides happen because modifying existing hook
behavior doesn't always warrant doc updates.

**What needs recalibrating:**

1. Rule 1: Add `diffPattern` to only fire on meaningful ROADMAP changes (phase
   status, sprint focus)
2. Rule 4 is already filtered to AD-only, but still gets overridden --
   investigate why (likely the `.claude/hooks/` trigger is too broad for
   modifications not tracked by gitFilter)
3. Several rules without `diffPattern` could benefit from it (Rules 7-9 for
   admin/dashboard changes)

### Override Tracking (GATE-03 target)

**Location:** `scripts/log-override.js` + `.claude/override-log.jsonl`

Current tracking captures: timestamp, check name, reason, user, cwd, git_branch.

**What's missing for analytics:**

- No `--list --json` output mode for programmatic consumption
- No pattern detection (same check overridden N times in same session)
- No aggregation by time period, branch, or check type beyond the simple
  `--list` display
- 27 entries (16.3%) have "No reason" -- the `validateSkipReason` module was
  added later
- No integration with health checker beyond `hook-pipeline.js` counting
  overrides

**What exists:**

- `scripts/health/checkers/hook-pipeline.js` already tracks `overrides_7d`,
  `overrides_24h`, `no_reason_pct`, `override_trend`
- JSONL format makes analytics straightforward

### Deferred Items System (GATE-08 target)

**Location:** `scripts/reviews/write-deferred-items.ts` +
`data/ecosystem-v2/deferred-items.jsonl` **Schema:**
`scripts/reviews/lib/schemas/deferred-item.ts`

The schema already has `defer_count` (int, min 1, default 1) and
`promoted_to_debt` (boolean, default false) and `status` enum including
"promoted".

**Current state (3 items in deferred-items.jsonl):**

- All have `defer_count: 1` and `promoted_to_debt: false`
- Status options: open, resolved, promoted, wont-fix

**What's missing for GATE-08:**

- No script that scans deferred-items.jsonl for `defer_count >= 2` and
  auto-promotes
- No script that increments `defer_count` when an item is re-deferred
- No bridge to `scripts/debt/intake-pr-deferred.js` for creating DEBT entries
- The `intake-pr-deferred.js` already creates DEBT entries with severity -- just
  needs to be called from the escalation logic

### Review Archival (GATE-04 target)

**Location:** `scripts/archive-reviews.js` **Current behavior:**
`npm run reviews:archive` (dry-run) or `npm run reviews:archive -- --apply`
(execute) **Threshold:** Default 20 active reviews before archiving

**What's missing for GATE-04:**

- Currently requires human to run `--apply` flag
- The check-review-archive.js validates archives but doesn't trigger archival
- Need: auto-run archive at session-end or pre-commit when threshold exceeded,
  without manual confirmation

### Qodo Suppression Rules (GATE-05 target)

**Location:** `.pr_agent.toml` (root of repo)

**Current suppression categories (counted from the toml):**

1. **Known FP rules (FP-001 through FP-016):** ~10 explicit false positive
   suppressions
2. **File ignore rules (pr_reviewer.ignore):** 9 file patterns (_.md, docs/\*\*,
   _.jsonl, .claude/**, scripts/migrations/**, _.test.ts/tsx, _.spec.ts/tsx)
3. **Focus areas:** "Skip flagging" section with 3 items

The "19 rules" count from the ROADMAP comes from the PR ecosystem diagnosis
aggregating all suppression directives across the toml sections. They reference
PRs #366-#396 era.

**What needs auditing:**

- Are the FP-\* items still valid? (FP-001 through FP-016)
- Are the file ignore patterns still appropriate?
- Have any suppressions been made obsolete by the custom ESLint plugin
  (`eslint-plugin-sonash`)?

### SECURITY_CHECKLIST vs ESLint Reality (GATE-06 target)

**Location:** `docs/agent_docs/SECURITY_CHECKLIST.md` **ESLint config:**
`eslint.config.mjs` **Custom plugin:** `eslint-plugin-sonash/` with 20+ custom
AST rules

The SECURITY_CHECKLIST references patterns by number (#17, #18, #31-41) and
points to `scripts/lib/security-helpers.js`. The ESLint config enforces many of
these via `eslint-plugin-sonash` rules.

**Gap analysis needed:**

- Which SECURITY_CHECKLIST items are now enforced by ESLint (and can be marked
  as "enforced")?
- Which items remain manual-only?
- Are there ESLint rules that should be mentioned in the checklist but aren't?

Current `eslint-plugin-sonash` rules (from eslint.config.mjs):

- File I/O: no-unguarded-file-read, no-stat-without-lstat, no-toctou-file-ops,
  no-non-atomic-write
- Error handling: no-raw-error-log, no-catch-console-error
- Security: no-shell-injection, no-unsafe-innerhtml, no-unsafe-error-access,
  no-sql-injection, no-hardcoded-secrets
- Code quality: no-object-assign-json, no-math-max-spread,
  no-writefile-missing-encoding, no-unbounded-regex, no-unescaped-regexp-input,
  no-unguarded-loadconfig, no-hallucinated-api, no-path-startswith,
  no-empty-path-check, no-unsafe-division
- React: no-index-key, no-div-onclick-no-role
- Test: no-trivial-assertions, no-test-mock-firestore

### DEBT Triage Automation (GATE-07 target)

**Existing scripts:**

- `scripts/debt/intake-pr-deferred.js` -- creates DEBT entries from PR-deferred
  items
- `scripts/debt/process-review-needed.js` -- processes items needing review
- `scripts/debt/verify-resolutions.js` -- verifies resolved items

**What's missing:**

- No auto-classification of review-sourced DEBT items by category
- No routing logic (which sprint/track gets the item)
- The `intake-pr-deferred.js` already accepts `--severity` and `--category` --
  triage would provide these automatically

### Temporal Coverage Monitoring (GATE-09 target)

**Location:** `scripts/check-review-archive.js` section 4 (Coverage Gaps)
**Current state:** The archive checker already detects gap ranges and
known-skipped IDs. It has `KNOWN_SKIPPED_IDS` set for expected gaps.

**What's missing:**

- No time-period analysis (e.g., "no reviews for 2+ weeks")
- Current gap detection is ID-based, not date-based
- `reviews.jsonl` has `date` fields that could power temporal analysis
- Need a script/checker that surfaces "weeks with no review activity"

### Health Checker Integration (Phase 5 deliverable, relevant here)

**Location:** `scripts/health/checkers/` (10 checkers)

The `hook-pipeline.js` checker already monitors:

- `overrides_7d`, `overrides_24h`, `no_reason_pct`
- `override_trend`, `top_warning_type`, `top_failed_check`

This means GATE-03 (override analytics) can build on this checker's data
collection.

## Standard Stack

### Core (All Existing -- No New Dependencies)

| Library                                     | Version | Purpose                                            | Status                            |
| ------------------------------------------- | ------- | -------------------------------------------------- | --------------------------------- |
| Node.js built-ins (fs, path, child_process) | N/A     | File I/O, git commands                             | Already used                      |
| Zod                                         | 4.3.5   | Schema validation                                  | Already used for deferred-item.ts |
| JSONL (line-delimited JSON)                 | N/A     | Data format for overrides, deferred items, reviews | Already standard                  |

### Supporting (All Existing)

| Library                             | Purpose                                | Where Used            |
| ----------------------------------- | -------------------------------------- | --------------------- |
| scripts/lib/security-helpers.js     | Safe file ops                          | All scripts           |
| scripts/lib/validate-skip-reason.js | Override reason validation             | Cross-doc, hooks      |
| scripts/config/load-config.js       | JSON config loading with regex support | doc-dependencies.json |
| scripts/reviews/lib/write-jsonl.ts  | JSONL append with validation           | deferred-items        |
| scripts/health/lib/scoring.js       | Health metric scoring                  | Health checkers       |

### No New Dependencies Needed

All 9 GATE requirements can be implemented with existing tooling. No new npm
packages needed.

## Architecture Patterns

### Recommended Approach: Enhance Existing Scripts

Phase 6 is about recalibrating and connecting existing infrastructure, not
building new systems.

```
scripts/
  check-cross-doc-deps.js         # GATE-01: Add new diffPattern/gitFilter rules
  config/doc-dependencies.json     # GATE-01: Recalibrate rules
  log-override.js                  # GATE-03: Add --analytics mode
  archive-reviews.js               # GATE-04: Add --auto mode (no confirm)
  check-review-archive.js          # GATE-09: Add temporal gap detection
  debt/
    intake-pr-deferred.js           # GATE-07: Add auto-classify logic
    escalate-deferred.js            # GATE-08: NEW - scan + promote deferred items
scripts/health/checkers/
  hook-pipeline.js                  # GATE-03: Enhance with analytics output
.pr_agent.toml                      # GATE-05: Prune stale rules
docs/agent_docs/SECURITY_CHECKLIST.md  # GATE-06: Add enforcement status column
```

### Pattern: Auto-Fix Mode for Gates (GATE-02)

**What:** When cross-doc gate detects a violation, instead of just blocking,
suggest the fix and optionally apply it. **Implementation:** The gate already
outputs which files need staging. Auto-fix would:

1. For missing doc updates: generate a "last updated" timestamp bump in the
   dependent doc
2. For missing ROADMAP updates: skip (too complex to auto-generate)
3. For missing COMMAND_REFERENCE updates: regenerate from skill/command files

```javascript
// Pattern: auto-fix in check-cross-doc-deps.js
if (process.argv.includes("--auto-fix")) {
  for (const issue of issues) {
    const fixResult = attemptAutoFix(issue);
    if (fixResult.fixed) {
      execFileSync("git", ["add", "--", fixResult.file]);
      log(`  Auto-fixed: ${issue.dependent}`, colors.green);
    } else {
      remainingIssues.push(issue);
    }
  }
}
```

### Pattern: Override Analytics Report (GATE-03)

```javascript
// scripts/log-override.js --analytics [--days N] [--json]
function generateAnalytics(entries, days) {
  return {
    period: { days, from: cutoffDate, to: now },
    total: entries.length,
    byCheck: groupBy(entries, "check"),
    byBranch: groupBy(entries, "git_branch"),
    noReasonCount: entries.filter((e) => e.reason === "No reason").length,
    patterns: detectPatterns(entries), // same check 3+ times in same branch
    trend: calculateTrend(entries), // week-over-week comparison
  };
}
```

### Pattern: Deferred Item Escalation (GATE-08)

```javascript
// scripts/debt/escalate-deferred.js
// Scan deferred-items.jsonl, find defer_count >= 2, auto-promote
function escalateDeferred(items) {
  const toEscalate = items.filter(
    (i) => i.defer_count >= 2 && i.status === "open"
  );
  for (const item of toEscalate) {
    item.status = "promoted";
    item.promoted_to_debt = true;
    // Create DEBT entry via intake-pr-deferred.js or direct MASTER_DEBT append
    createDebtEntry(item);
  }
}
```

### Anti-Patterns to Avoid

- **Don't create a new override tracking system** -- enhance the existing
  log-override.js
- **Don't rewrite archive-reviews.js** -- add `--auto` flag to skip confirmation
- **Don't build a separate analytics dashboard** -- extend health checker output
- **Don't add new npm dependencies** -- everything needed exists already

## Don't Hand-Roll

| Problem                   | Don't Build             | Use Instead                                | Why                                 |
| ------------------------- | ----------------------- | ------------------------------------------ | ----------------------------------- |
| JSONL parsing             | Custom parser           | Existing `safeParse` from health/lib/utils | Already handles malformed lines     |
| File safety               | Manual fs.writeFileSync | `safeWriteFile` from security-helpers      | Symlink guard, atomic write         |
| Skip reason validation    | Inline checks           | `validateSkipReason` module                | Already hardened (PR #367)          |
| Metric scoring            | Custom threshold logic  | `scoreMetric` from health/lib/scoring      | Consistent with Phase 5             |
| DEBT entry creation       | Manual JSONL append     | `appendMasterDebtSync` from safe-fs        | Handles dual-write to deduped.jsonl |
| Config loading with regex | Manual JSON.parse       | `loadConfigWithRegex` from load-config     | Compiles regex fields safely        |

## Common Pitfalls

### Pitfall 1: Breaking Existing Override Flow

**What goes wrong:** Changing cross-doc deps behavior invalidates override
reasons already in the log. **Why it happens:** Rules are tightly coupled to the
override skip mechanism. **How to avoid:** Add new rules or modify existing
ones, but don't change the `SKIP_CROSS_DOC_CHECK` env var interface. Override
log entries are immutable history. **Warning signs:** Pre-commit starts failing
on branches that were previously passing.

### Pitfall 2: Auto-Fix Creating Bad Commits

**What goes wrong:** Auto-fix mode modifies files and stages them, but the
changes are wrong or incomplete. **Why it happens:** Auto-generating doc content
is error-prone. **How to avoid:** Auto-fix should only handle trivial fixes
(timestamp bumps, index regeneration). Complex fixes should remain as
suggestions, not auto-applied. **Warning signs:** Auto-fix changes that look
like "Updated: 2026-03-01" with no real content.

### Pitfall 3: Override Analytics Exposing Sensitive Paths

**What goes wrong:** Analytics output includes full filesystem paths from the
`cwd` field. **Why it happens:** The override log stores `cwd` with absolute
paths. **How to avoid:** Sanitize paths in analytics output (use relative paths
or `[PATH]` masking). **Warning signs:** `C:\Users\jason\...` appearing in
analytics output.

### Pitfall 4: Deferred Escalation Loop

**What goes wrong:** Item gets promoted to DEBT, but it's re-deferred in the
next review, creating a cycle. **Why it happens:** No check for "was this
already promoted?" **How to avoid:** The `promoted_to_debt` flag exists in the
schema -- check it before re-deferring. A promoted item should not be re-created
as a new deferred item.

### Pitfall 5: Qodo Suppression Audit Removing Active Rules

**What goes wrong:** A suppression rule is pruned because it looks stale, but it
was actually preventing noise in every PR. **Why it happens:** No usage tracking
on Qodo suppressions -- they're just text directives. **How to avoid:**
Cross-reference each FP-\_ rule against recent PR review logs
(docs/archive/REVIEWS\_\_.md). If the pattern was seen in the last 30 days, keep
it.

### Pitfall 6: Auto-Archive Losing Data

**What goes wrong:** Auto-archive runs during a session and moves reviews that
are still being referenced. **Why it happens:** Archive threshold (20) hit while
active reviews are being written. **How to avoid:** Auto-archive should only run
at session-end, not mid-session. Use `--keep` threshold carefully.

## Code Examples

### Cross-Doc Rule with diffPattern (GATE-01)

```json
// scripts/config/doc-dependencies.json - recalibrated rule 1
{
  "trigger": "ROADMAP.md",
  "dependents": ["SESSION_CONTEXT.md"],
  "reason": "Session context reflects current roadmap focus",
  "checkDiff": true,
  "diffPattern": {
    "source": "Phase \\d|Sprint|Status.*COMPLETE|Current Focus",
    "flags": "i"
  }
}
```

### Override Analytics CLI (GATE-03)

```javascript
// Enhancement to scripts/log-override.js
// node scripts/log-override.js --analytics --days 30 --json
function detectPatterns(entries) {
  const byBranch = {};
  for (const e of entries) {
    const key = `${e.git_branch}:${e.check}`;
    byBranch[key] = (byBranch[key] || 0) + 1;
  }
  return Object.entries(byBranch)
    .filter(([, count]) => count >= 3)
    .map(([key, count]) => ({
      branch: key.split(":")[0],
      check: key.split(":")[1],
      count,
    }));
}
```

### Deferred Escalation Script (GATE-08)

```javascript
// scripts/debt/escalate-deferred.js
const items = readJsonl("data/ecosystem-v2/deferred-items.jsonl");
const toEscalate = items.filter(
  (i) => i.defer_count >= 2 && i.status === "open" && !i.promoted_to_debt
);
for (const item of toEscalate) {
  // Update deferred item
  updateJsonlRecord(item.id, { status: "promoted", promoted_to_debt: true });
  // Create DEBT entry
  execFileSync("node", [
    "scripts/debt/intake-pr-deferred.js",
    "--pr",
    item.review_id.replace("rev-", ""),
    "--file",
    "deferred-escalation",
    "--title",
    item.finding,
    "--severity",
    "S1",
    "--category",
    "code-quality",
  ]);
}
```

## Key Files That Will Need Modification

| File                                       | GATE   | Change Type                             |
| ------------------------------------------ | ------ | --------------------------------------- |
| `scripts/config/doc-dependencies.json`     | 01     | Modify rules, add diffPattern/gitFilter |
| `scripts/check-cross-doc-deps.js`          | 01, 02 | Add --auto-fix mode                     |
| `scripts/log-override.js`                  | 03     | Add --analytics mode                    |
| `.claude/override-log.jsonl`               | 03     | Read-only (analytics source)            |
| `scripts/archive-reviews.js`               | 04     | Add --auto mode (skip confirm)          |
| `.pr_agent.toml`                           | 05     | Prune stale rules                       |
| `docs/agent_docs/SECURITY_CHECKLIST.md`    | 06     | Add enforcement status column           |
| `eslint.config.mjs`                        | 06     | Read-only (reference for sync)          |
| `scripts/debt/escalate-deferred.js`        | 07, 08 | NEW script                              |
| `data/ecosystem-v2/deferred-items.jsonl`   | 08     | Updated by escalation                   |
| `scripts/check-review-archive.js`          | 09     | Add temporal gap detection              |
| `.husky/pre-commit`                        | 01, 02 | May need flag for auto-fix              |
| `scripts/health/checkers/hook-pipeline.js` | 03     | Enhance analytics output                |

## Dependency Analysis Between GATE Requirements

```
GATE-01 (cross-doc recalibration)
  |
  v
GATE-02 (auto-fix mode) -- depends on GATE-01 rules being correct first
  |
  v
GATE-03 (override analytics) -- independent but validates GATE-01 success

GATE-04 (auto-archive) -- fully independent
GATE-05 (Qodo pruning) -- fully independent
GATE-06 (SECURITY_CHECKLIST sync) -- fully independent

GATE-07 (DEBT triage) -- independent
  |
  v
GATE-08 (S1 escalation) -- depends on GATE-07 for routing, but could work standalone

GATE-09 (temporal coverage) -- fully independent
```

**Recommended grouping into plans:**

1. **Plan 1: Cross-doc recalibration + auto-fix** (GATE-01, GATE-02) -- highest
   impact, 50% of overrides
2. **Plan 2: Override analytics** (GATE-03) -- validates Plan 1 success
3. **Plan 3: Deferred lifecycle + DEBT triage** (GATE-07, GATE-08) -- connected
   by DEBT pipeline
4. **Plan 4: Independent gates** (GATE-04, GATE-05, GATE-06, GATE-09) -- can be
   one plan or split

## State of the Art

| Old Approach             | Current Approach                             | When Changed  | Impact                               |
| ------------------------ | -------------------------------------------- | ------------- | ------------------------------------ |
| No diffPattern filtering | diffPattern on package.json rule only        | Session #69   | Reduced false triggers for one rule  |
| No gitFilter             | gitFilter: "AD" on 6 rules                   | Phase 4 era   | Reduced triggers for add/delete only |
| No --trivial mode        | --trivial flag skips formatting-only changes | Phase 4 era   | Reduced false positives              |
| Manual skip reason       | validateSkipReason module                    | PR #367 retro | Requires 10+ char reason             |
| No deferred tracking     | deferred-items.jsonl with Zod schema         | Phase 3       | Structured deferred lifecycle        |
| No health monitoring     | 10 health checkers + composite scoring       | Phase 5       | Quantified override rates            |

## Open Questions

1. **What constitutes a "meaningful" ROADMAP change for diffPattern?**
   - What we know: ROADMAP.md changes that update phase status or sprint focus
     should trigger cross-doc
   - What's unclear: The exact regex that captures meaningful changes without
     false positives
   - Recommendation: Start with
     `/Phase \d|Sprint|Status.*COMPLETE|Current Focus/i` and iterate

2. **Should auto-fix be opt-in or opt-out?**
   - What we know: Currently there's no auto-fix at all
   - What's unclear: Whether `--auto-fix` should be the default in pre-commit or
     require explicit flag
   - Recommendation: Opt-in initially (`--auto-fix` flag), graduate to default
     after proving reliability

3. **How to increment defer_count when same finding is re-deferred?**
   - What we know: `defer_count` field exists but nothing increments it
   - What's unclear: How to match "same finding" across reviews (exact text
     match? fuzzy?)
   - Recommendation: Start with exact `finding` text match within same
     `review_id` prefix

4. **What "19 rules" actually means for Qodo audit scope**
   - What we know: The `.pr_agent.toml` has FP-001 through FP-016 plus file
     ignores plus skip directives
   - What's unclear: Whether "19" counts each FP-\* line or each `[section]`
     directive
   - Recommendation: Audit every line in `extra_instructions` and every file in
     `[pr_reviewer.ignore]`

## Sources

### Primary (HIGH confidence)

- `scripts/check-cross-doc-deps.js` -- full source read, 438 lines
- `scripts/config/doc-dependencies.json` -- 11 rules analyzed
- `scripts/log-override.js` -- full source read, 337 lines
- `.claude/override-log.jsonl` -- 166 entries analyzed (50% cross-doc override
  rate)
- `scripts/reviews/write-deferred-items.ts` -- full source read
- `scripts/reviews/lib/schemas/deferred-item.ts` -- Zod schema with defer_count,
  promoted_to_debt
- `data/ecosystem-v2/deferred-items.jsonl` -- 3 current entries
- `scripts/archive-reviews.js` -- header read, --apply flag mechanism
- `scripts/check-review-archive.js` -- full source read, gap detection logic
- `.pr_agent.toml` -- full Qodo config read
- `docs/agent_docs/SECURITY_CHECKLIST.md` -- full read, 435 lines
- `eslint.config.mjs` -- full read, 178 lines
- `.husky/pre-commit` -- full read, 11 steps
- `.husky/pre-push` -- full read, 7 steps
- `scripts/health/checkers/hook-pipeline.js` -- header + benchmarks read
- `scripts/debt/intake-pr-deferred.js` -- full read

### Secondary (MEDIUM confidence)

- Override rate statistics computed from JSONL analysis
- Dependency analysis between GATE requirements based on code dependencies

### Tertiary (LOW confidence)

- "19 rules" interpretation from ROADMAP/DISCOVERY_QA cross-references (the
  exact count depends on how you count suppression directives)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all code is in the repo, no external research needed
- Architecture: HIGH -- patterns follow existing codebase conventions
- Pitfalls: HIGH -- derived from actual override log data and code analysis

**Research date:** 2026-03-01 **Valid until:** 2026-03-31 (stable -- internal
tooling, no external dependency changes)
