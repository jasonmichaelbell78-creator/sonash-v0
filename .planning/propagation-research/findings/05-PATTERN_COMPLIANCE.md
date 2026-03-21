# Finding 05: Pattern Compliance Enforcement Gaps

**Document Version:** 1.0 **Date:** 2026-03-20 **Status:** RESEARCH COMPLETE
**Severity:** High

---

## 1. System Overview

The pattern compliance pipeline has three enforcement points:

| Context         | Mode               | Files Checked                                 | Blocking?                     |
| --------------- | ------------------ | --------------------------------------------- | ----------------------------- |
| Pre-commit hook | `--staged`         | Staged files only (ACM filter)                | Critical = block; High = warn |
| CI on PR        | Explicit file list | Changed files only (tj-actions/changed-files) | Critical + High = block       |
| CI on main push | `--all`            | All files in repo (minus excludes)            | Critical + High = block       |

**Script:** `scripts/check-pattern-compliance.js` (2174 lines, 50+ patterns)
**State:** `.claude/state/warned-files.json` **Exemptions:**
`scripts/config/verified-patterns.json` (438 lines)

---

## 2. The "Changed Files Only" Gap (PR-Level Blind Spot)

### How It Works

On pull requests, CI uses `tj-actions/changed-files` (ci.yml:177) to build a
file list, then passes only those files to the pattern checker:

```yaml
node scripts/check-pattern-compliance.js -- ${{
steps.changed-files.outputs.all_changed_files }}
```

### The Blind Spot

**Scenario:** File A has a critical pattern violation. File B is changed in a
PR. CI only checks File B. File A's violation is invisible to the PR check.

This means violations that already exist in `main` (or were introduced via a PR
that didn't touch the violating file) persist indefinitely on PRs. Only a push
directly to main triggers `--all` mode.

### Mitigation: Main-Push Full Scan

When code merges to main, `patterns:check-all` runs (ci.yml:205):

```yaml
- name: Pattern compliance check (push to main)
  if: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}
  run: npm run patterns:check-all
```

This catches violations that slipped through PR checks -- but only AFTER merge.
The damage is already done.

---

## 3. The GLOBAL_EXCLUDE Blanket Exemption (Permanent Immunity)

### What It Is

Lines 166-209 of `check-pattern-compliance.js` define a `GLOBAL_EXCLUDE` array
of 30+ regex patterns. Files matching any pattern are excluded from ALL checks,
in ALL modes (`--staged`, `--all`, and explicit file list).

### Key Problem: Global Excludes Apply Even to `--all`

The `getFilesToCheck()` function (line 1681) applies the global exclude filter
in every mode:

```js
return files.filter((f) => !isGloballyExcluded(f)); // applies in --all mode too
```

This means even the "full scan" on main push cannot catch violations in globally
excluded files.

### Files With Known Critical Violations Under GLOBAL_EXCLUDE

| File                                      | Violation                                                     | Severity                  |
| ----------------------------------------- | ------------------------------------------------------------- | ------------------------- |
| `scripts/check-document-sync.js`          | `rel.startsWith("..")` (4 instances, lines 91, 102, 235, 246) | Critical (path traversal) |
| `scripts/check-docs-light.js`             | `rel.startsWith("..")` (1 instance, line 590)                 | Critical (path traversal) |
| `scripts/assign-review-tier.js`           | `rel.startsWith("..")` (2 instances, lines 285, 301)          | Critical (path traversal) |
| `scripts/generate-documentation-index.js` | `path.startsWith("/")` (line 439)                             | High (cross-platform)     |

These files have permanent immunity from pattern compliance checking. Their
violations will never appear in any check mode.

**Root cause:** The GLOBAL_EXCLUDE was intended for files containing "pattern
definitions as strings (meta-detection false positives)" and "pre-existing
debt." But it has grown to include 30+ files, some with real security
violations.

---

## 4. The Graduation System: Severity-Based, Not Time-Based

### Current Behavior (Lines 1956-1974)

The graduation system was refactored from a time-based warn-then-block model to
a severity-based model:

```
critical → always block (no grace period)
high     → block in CI/--all mode, warn in --staged (pre-commit)
medium   → always warn (never blocks)
```

### What Happens to warned-files.json

The `warned-files.json` state file (currently `{}` -- empty) tracks files that
have generated warnings. Key behaviors:

1. **Warnings accumulate as counts** (line 2154):
   `existing[w.file] = (existing[w.file] || 0) + 1`
2. **Stale entries expire after 30 days** (line 2072):
   `expireByAge(WARNED_FILES_PATH, 30)`
3. **Max 200 entries** (line 87): oldest by timestamp are dropped
4. **Counts are used by alerts checker** for hotspot detection (count >= 3)

### Gap: Warned Files Are Not Blocked

Despite counting warnings, the graduation system **never uses the count to
escalate to blocking**. The `applyGraduation()` function (line 1956) only looks
at severity -- it never reads `warned-files.json` at all. The state file is
write-only from the pattern checker's perspective (read only by the alerts
system).

**Result:** A file can accumulate unlimited medium-severity warnings across
sessions and never be blocked. The old graduation system (warn once, block on
repeat) was replaced with a severity-only model, but the state file was kept for
alerting without enforcement.

---

## 5. The FP Auto-Disable Threshold (Gaming Risk)

### How It Works (Lines 1552-1567)

If a pattern has more than 25 exemptions in `verified-patterns.json`, it is
auto-disabled:

```js
const FP_THRESHOLD = 25;
if (count > FP_THRESHOLD) {
  FP_DISABLED_RULES.add(ap.id);
}
```

### Current State: Patterns At or Exceeding Threshold

| Pattern ID                     | Exemptions | Status                           |
| ------------------------------ | ---------- | -------------------------------- |
| `rename-without-remove`        | 34         | **AUTO-DISABLED**                |
| `missing-array-isarray`        | 29         | **AUTO-DISABLED**                |
| `missing-bom-handling`         | 28         | **AUTO-DISABLED**                |
| `process-exit-without-cleanup` | 25         | Borderline (not > 25, so active) |
| `regex-complexity-s5852`       | 24         | Active                           |
| `write-without-symlink-guard`  | 24         | Active                           |
| `exec-without-global`          | 22         | Active                           |

### Who Decides What's a False Positive?

The `verified-patterns.json` file is maintained manually. Each exemption entry
is a filename (not a full path), and there is no structured review process for
additions. The `add-false-positive.js` script (globally excluded from checking
itself) handles additions.

### Gaming Risk Assessment

**Can this be gamed?** Theoretically, yes. If 25+ files with legitimate
violations are all exempted as "verified false positives," the pattern gets
auto-disabled for the entire codebase. However:

1. The exemptions are committed to git (auditable)
2. `--include-fp-disabled` flag can force all rules
3. `--fp-threshold=N` can adjust the cutoff
4. The `--fp-report` flag shows exclusion counts

**Practical risk:** LOW for intentional gaming (solo developer). MEDIUM for
organic drift -- each exemption makes the next one easier to justify, and no
mechanism forces re-verification of old exemptions.

---

## 6. Propagation-Specific Gaps

### Pre-Commit: check-propagation-staged.js

The pre-commit hook runs `check-propagation-staged.js` (line 402 of pre-commit)
which checks if staged files contain security patterns that also exist in
unstaged sibling files. This is **non-blocking** (warn-only).

### Pre-Push: check-propagation.js

The pre-push hook runs `check-propagation.js --blocking` which is a blocking
check for propagation issues across the entire push.

### The Gap Between Them

Neither check catches the "unchanged file" problem from Section 2. They detect
inconsistency between staged and unstaged files in the same commit, but they
cannot detect that File A (not in the PR at all) has a violation that should
have been fixed alongside File B.

---

## 7. Specific Pattern Violations Currently Invisible to CI

Based on grep analysis of the codebase:

### 7a. Critical: Path Traversal via startsWith('..')

**Files with violations (all in GLOBAL_EXCLUDE):**

- `scripts/check-document-sync.js` -- 4 instances
- `scripts/check-docs-light.js` -- 1 instance
- `scripts/assign-review-tier.js` -- 2 instances

These use `rel.startsWith("..")` instead of `/^\.\.(?:[\/\\]|$)/.test(rel)`. The
startsWith check has false positives for filenames like `..hidden.md` and more
critically, misses the `".."` exact match case (parent directory).

### 7b. High: startsWith('/') Instead of path.isAbsolute()

**Files with violations (in GLOBAL_EXCLUDE):**

- `scripts/generate-documentation-index.js` -- 1 instance (line 439)

### 7c. Auto-Disabled: rename-without-remove (34 exemptions)

This pattern (renameSync without prior rmSync on Windows) is auto-disabled. Any
new file using bare renameSync in `scripts/` will not be flagged unless
`--include-fp-disabled` is passed.

---

## 8. Quantified Summary

| Gap Category               | Scope                               | Files Affected                 | Severity |
| -------------------------- | ----------------------------------- | ------------------------------ | -------- |
| GLOBAL_EXCLUDE immunity    | 30+ files exempt from all checks    | 7+ with real violations        | Critical |
| PR changed-files-only      | Every PR misses unchanged files     | All non-touched files          | High     |
| Auto-disabled patterns     | 3 patterns disabled (87 exemptions) | Unknown new violations         | Medium   |
| Graduation non-enforcement | warned-files.json is write-only     | Medium violations never block  | Low      |
| Propagation detection      | Non-blocking in pre-commit          | Sibling misses are only warned | Medium   |

---

## 9. Proposed Fixes

### Fix 1: Periodic Full Scan Job (Recommended -- High Impact, Low Risk)

Add a scheduled CI workflow that runs `--all --include-fp-disabled` weekly:

```yaml
on:
  schedule:
    - cron: "0 6 * * 1" # Monday 6am UTC
```

This catches drift in unchanged files and auto-disabled patterns without slowing
down every PR. Report violations as a GitHub issue or artifact.

**Estimated impact:** Catches all Section 7 violations. No PR slowdown.

### Fix 2: GLOBAL_EXCLUDE Audit and Tiering

Split GLOBAL_EXCLUDE into two tiers:

- **Tier 1 (Meta-Detection):** Files that contain pattern definitions as strings
  (check-pattern-compliance.js, check-propagation.js,
  tests/pattern-compliance.test.js). Keep these excluded.
- **Tier 2 (Pre-Existing Debt):** Files excluded for "pre-existing debt" should
  be moved to `verified-patterns.json` per-pattern exemptions instead of blanket
  global exclusion. This lets each pattern decide per-file.

**Estimated impact:** 7+ real violations would become visible immediately.

### Fix 3: PR Full Scan on Critical Patterns Only

For PR checks, run critical-only patterns against ALL files (not just changed):

```yaml
node scripts/check-pattern-compliance.js --all --severity=critical
```

Critical patterns are few and fast (path-traversal, injection, symlink). Running
them against the full codebase adds ~2-5 seconds to CI.

**Estimated impact:** Critical violations in unchanged files caught at PR time.

### Fix 4: Re-Enable Graduation Enforcement

Wire `warned-files.json` back into `applyGraduation()`: if a file has
accumulated 3+ medium-severity warnings across sessions, escalate to blocking.

```js
const warnedCount = warned[v.file] || 0;
if (severity === "medium" && warnedCount >= 3) {
  // Escalate to block
}
```

**Estimated impact:** Persistent medium violations eventually get fixed.

### Fix 5: FP Threshold Review Process

Add a validation step to `add-false-positive.js` that:

1. Warns when a pattern approaches the threshold (20+)
2. Requires a comment/justification for each exemption
3. Logs exemption additions to a JSONL audit trail

**Estimated impact:** Prevents organic drift toward auto-disable.

---

## 10. Priority Ranking

| Priority | Fix                                   | Effort    | Impact                             |
| -------- | ------------------------------------- | --------- | ---------------------------------- |
| P1       | Fix 2: GLOBAL_EXCLUDE audit           | 2-3 hours | Unmasks 7+ critical violations     |
| P2       | Fix 1: Scheduled full scan            | 1 hour    | Catches all drift weekly           |
| P3       | Fix 3: Critical-only full scan on PRs | 1 hour    | Catches critical at PR time        |
| P4       | Fix 5: FP threshold review process    | 2 hours   | Prevents future erosion            |
| P5       | Fix 4: Graduation re-enforcement      | 1 hour    | Medium violations eventually block |
