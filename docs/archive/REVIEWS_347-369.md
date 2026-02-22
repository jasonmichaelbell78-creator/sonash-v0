<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-22
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Archived Reviews #347-#369

Reviews archived from AI_REVIEW_LEARNINGS_LOG.md on 2026-02-22.

---

#### Review #369 — PR #383 R8 (Qodo + SonarCloud) — 2026-02-21

**Source:** Qodo Code Suggestions (12), Qodo Compliance (5), SonarCloud (4), CI
(ROADMAP debt refs)

**Key Fixes:**

1. **Symlink guard — sync-deduped.js** — writeJsonl() lacked symlink guard on
   DEDUPED_PATH. Added `refuseSymlinkWithParents()`.
2. **Fail-closed fallback** — commit-failure-reporter.js `isSafeToWrite`
   fallback changed from `() => true` to `() => false`.
3. **Atomic paired writes with rollback** — intake-sonar-reliability.js,
   audit-s0-promotions.js, reverify-resolved.js, verify-resolutions.js all now
   rollback master on deduped rename failure.
4. **Parent dir symlink check** — intake-sonar-reliability.js `isWriteSafe()`
   now traverses all ancestor directories.
5. **Path traversal guards** — clean-intake.js `fileExists()`,
   categorize-and-assign.js `getSprintBucketForPath()` now validate paths stay
   within project root.
6. **Token validation** — sync-sonarcloud.js `buildAuthHeaders()` validates
   token is non-empty string.
7. **Sprint-status robustness** — Missing deduped items counted as mismatches;
   invalid metrics.generated handled; Array#push consolidated (SonarCloud).
8. **Triage-scattered-intake** — Dynamic `created` date; extracted
   `printPrefixBreakdown` helper (CC reduction).
9. **verify-resolutions.js** — `fileExists()` uses `statSync.isFile()` instead
   of `existsSync()`.
10. **ROADMAP debt refs** — 49 orphaned DEBT-XXXX references resolved by adding
    stub entries to MASTER_DEBT.jsonl.

**Patterns Identified:**

1. **Propagation remains dominant** — 4/10 R8 fixes were patterns already fixed
   in R5-R6 but missed in other files (sync-deduped.js symlink, atomic rollback
   in 3 files).
2. **Fail-closed is the correct default** — `isSafeToWrite = () => true`
   fallback was a fail-open vulnerability.
3. **Parent directory symlink traversal** — Checking only the file and immediate
   parent is insufficient; must walk all ancestors.

---

#### Review #368 — PR #383 R7 (SonarCloud + Qodo + CI) — 2026-02-21

**Source:** SonarCloud (30), Qodo Compliance (5), Qodo Code Suggestions (15), CI
(pattern compliance)

**Key Fixes:**

1. **25 CC reductions** — Extracted helper functions across 16 files to bring
   cognitive complexity under 15. Pre-commit CC rule (implemented this PR)
   blocked all new violations.
2. **5 security hotspots** — sync-sonarcloud.js hotspot line parsing,
   commit-failure-reporter.js state file handling, sprint-status.js PRNG
   replacement.
3. **Compliance fixes** — doc headers, pattern compliance alignment.

**Deferred:** 22 CC violations (pre-existing, CC 16-67 across 13 files).

**Resolution Stats:** 25/50 fixed (50%), 25/50 deferred (CC — pre-existing)

---

#### Review #367 — PR #383 R6 (SonarCloud + Qodo + CI) — 2026-02-21

**Source:** SonarCloud (25), Qodo Compliance (5), Qodo Code Suggestions (9), CI
(pattern compliance)

**Key Fixes:**

1. **Symlink directory bypass** — `isWriteSafe()` in both
   `intake-sonar-reliability.js` and `verify-resolutions.js` now checks parent
   directories for symlinks, not just the target file.
2. **verify-resolutions.js saveJsonl** — Added `isWriteSafe()` guard
   (propagation miss from R5).
3. **Double-counting bug** — `sprint-intake.js:229` was adding `manualCount` to
   unplaced, inflating coverage metrics. Removed the addition.
4. **readJsonlFromGit crash** — `audit-s0-promotions.js:52` used
   `.map(JSON.parse)` which crashes on any malformed line. Replaced with
   `.flatMap()` + per-line try/catch (propagation miss from R5).
5. **reverify-resolved.js crash** — Line 47 had unguarded `readFileSync` +
   `.map(JSON.parse)`. Added try/catch for file read and per-line parse safety.
6. **Partial atomic write** — `intake-sonar-reliability.js:2512` second
   `renameSync` now has try/catch with CRITICAL error message for operator
   recovery if MASTER updated but deduped fails.
7. **Dedup key normalization** — `dedupInput()` in `intake-sonar-reliability.js`
   now normalizes title with trim+lowercase to match `buildDedupIndices()`.
8. **Hotspot body discard** — `sync-sonarcloud.js` second fetch function
   (`fetchSonarCloudHotspots`) now wraps body discard in try/catch (propagation
   miss from R5).
9. **Remove assignment of "i"** — `sprint-complete.js` and `sprint-wave.js` arg
   parsers restructured from for-loop with `i += 1` to `indexOf`-based lookups,
   eliminating SonarCloud S1854.
10. **response.body.cancel()** — `sync-sonarcloud.js` now uses
    `response.body.cancel()` to discard error bodies without buffering.

**Patterns Identified:**

1. **Propagation misses are the #1 R6 driver** — 3 of 10 fixes were propagation
   misses from R5 (symlink guard, body discard guard, readJsonlFromGit). The
   propagation protocol must be applied more systematically.
2. **indexOf-based arg parsing avoids SonarCloud S1854** — When a for-loop
   modifies its counter (i += 1 to skip values), SonarCloud flags it regardless
   of style. Using `args.indexOf("--flag")` eliminates the issue entirely.
3. **isWriteSafe must check parent dirs** — Symlink on a parent directory
   redirects all writes under it. Always check `path.dirname(filePath)` too.

**Deferred:** 23 CC violations (pre-existing, same as R5) + 743 CI pattern
compliance warnings (pre-existing across entire codebase).

**Resolution Stats:** 19/41 fixed (46%), 22/41 deferred (CC — pre-existing)

---

#### Review #366 — PR #383 R5 (SonarCloud + Qodo + CI) — 2026-02-21

**Source:** SonarCloud (24), Qodo Compliance (5), Qodo Code Suggestions (12), CI
(pattern compliance)

**Key Fixes:**

1. **Secret leakage in redaction** — `commit-failure-reporter.js:246` used
   `$&_REDACTED` which appends to the secret instead of replacing. Fixed regex
   to use capture group `$1[REDACTED]`.
2. **Path traversal (2 files)** — `extract-context-debt.js:100` used
   `replace(/^(\.\.)+/)` which is bypassable. `verify-resolutions.js` used
   `startsWith(ROOT + sep)`. Both replaced with proper `path.relative()` +
   traversal rejection.
3. **Math.random() PRNG** — `sprint-status.js:137` replaced with
   `crypto.randomInt()` for SonarCloud S2245.
4. **Atomic dual-file writes** — `intake-sonar-reliability.js` now writes both
   MASTER and deduped atomically via tmp files + rename, with symlink guard.
5. **Over-broad S0 downgrade** — `clean-intake.js:284` now only downgrades
   non-critical categories (documentation, process, ai-optimization,
   engineering-productivity), not all non-security.
6. **Sync by ID+hash** — `verify-resolutions.js:applyChanges` now syncs deduped
   items by both id and content_hash, preventing missed updates.
7. **Duplicate debt IDs** — `intake-sonar-reliability.js` now takes max ID from
   both master and deduped files.
8. **Unreachable null guard** — `sprint-complete.js:220` changed from `!allDebt`
   (always false for array) to `allDebt.length === 0`.
9. **Swallowed parse errors** — Added `console.warn` to 3 silent JSONL catch
   blocks (intake-sonar-reliability, sprint-status, verify-resolutions).
10. **Per-line JSONL safety** — `audit-s0-promotions.js:readJsonl` now uses
    flatMap with per-line try/catch instead of map-throw.
11. **JSON.parse guard** — `generate-grand-plan.js:readJson` now wraps
    JSON.parse in try/catch.
12. **Body discard guard** — `sync-sonarcloud.js:287` wraps response.text() in
    try/catch to prevent secondary network error from hiding the original.

**Patterns Identified:**

1. **`$&` backreference leaks secrets** — In sanitization regexes, `$&` includes
   the full match (including the secret). Use capture groups around the
   non-sensitive prefix only.
2. **`startsWith(root + sep)` is fragile** — `path.relative()` +
   `startsWith("..")` check is more robust for path containment.
3. **Dual-file writes need atomicity** — When two files must stay in sync, stage
   both writes (via tmp) before committing either via rename.
4. **readJsonl silent catch is a smell** — Even for expected malformed lines,
   always log at least a count or warning to prevent silent data loss.

**Deferred:** 22 CC violations (pre-existing, CC 16-67 across 13 files) — bulk
refactoring items, partially tracked in existing TDMS entries.

#### Review #347: PR #370 R5 — TOCTOU file path, CWD-independent normalization, trailing slash preservation (2026-02-17)

**Source:** Qodo Compliance (3) + Qodo Suggestions (6) **PR/Branch:**
claude/new-session-6kCvR (PR #370) **Suggestions:** 9 total (Fixed: 6,
Rejected: 3)

**Patterns Identified:**

1. **TOCTOU on validated path** — `validatePathInDir` checks resolved path but
   raw input is stored. Must persist the resolved value.
2. **CWD-dependent path.resolve** — `path.resolve(filePath)` resolves against
   CWD, not repo root. Fragile if script invoked from different directory.
3. **Path normalization strips trailing slash** — `normalizeFilePath` converts
   `scripts/` to `scripts`, breaking directory-level DEBT item file references.
4. **Repeat items converging** — Actor context (R3,R4,R5) and unstructured logs
   (R3,R4,R5) repeatedly flagged despite rejection. Stable rejection rationale.

**Rejected:** [1] Arbitrary file overwrite (already constrained to REPO_ROOT via
validatePathInDir + refuseSymlinkWithParents), [2] Missing actor context (3rd
repeat — captured in resolution-log.jsonl), [3] Unstructured console logs (3rd
repeat — pre-existing pattern, DEBT-0455)

**Resolution Stats:** 6/9 fixed (67%), 3/9 rejected

---

#### Review #348: PR #371 R1+R2 — SonarCloud S5852 regex DoS, CC refactoring, atomic writes, symlink guards (2026-02-17)

**Source:** R1: SonarCloud (10 hotspots + 12 issues) + Qodo Compliance (2) +
Qodo Suggestions (11). R2: SonarCloud (7 issues) + Qodo Compliance (4).
**PR/Branch:** claude/new-session-6kCvR (PR #371) **Suggestions:** R1: 34 total
(Fixed: 31, Rejected: 3). R2: 11 total (Fixed: 7, Rejected: 4).

**Patterns Identified:**

1. **Regex DoS false positives (S5852)** — SonarCloud flags simple patterns like
   `\d+\s*CRITICAL` that have disjoint character classes and no backtracking
   risk. Replace with string parsing to clear quality gate.
2. **CC explosion in parsing functions** — Functions that parse markdown with
   multiple format variants (bold, table, inline) accumulate CC rapidly. Extract
   format-specific helpers to keep each under CC 15.
3. **Atomic write consistency** — Some write paths use atomic tmp+rename, others
   use direct `writeFileSync`. Standardize on atomic pattern for all state
   files.
4. **Symlink guard propagation** — Backup write paths (.bak) missed symlink
   guards despite main paths being protected.
5. **Extracted helpers still exceeding CC 15** — R1 refactoring pushed CC into
   new helper functions (parseSeverityCount CC 33, parseRetrospectives CC 17).
   Need to extract sub-helpers from helpers.
6. **Options object pattern** — Functions with 7+ params should use a single
   options object for readability and maintainability.

**R1 Rejected:** [25] Unstructured logging (CLI tool by design), [26] No audit
trail (local dev script), [27] Silent parse failures (intentional for JSONL
tolerance)

**R2 Rejected:** [8] Swallowed parse errors (repeat from R1 — intentional for
JSONL tolerance), [9] Absolute path leakage (pre-existing in TDMS data, not
introduced by this PR), [10] Audit trail (repeat from R1), [11] Console output
review (repeat from R1)

**Resolution Stats:** R1: 31/34 fixed (91%), 3/34 rejected. R2: 7/11 fixed
(64%), 4/11 rejected (all repeats).

---

#### Review #350: PR #374 R1 — Bidirectional Containment, Fail-Closed Guard, backupSwap Safety (2026-02-17)

**Source:** Qodo Compliance + CI (Prettier) + SonarCloud Duplication
**PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR #374)
**Suggestions:** 15 total (Fixed: 8, Deferred: 4, Rejected: 3)

**Patterns:**

1. **Bidirectional containment on env vars** — `CLAUDE_PROJECT_DIR` resolved
   without checking it stays within expected bounds. Fix: `realpathSync` +
   bidirectional `startsWith` check between resolved and CWD.
2. **Fail-closed fallback** — When `symlink-guard` module unavailable, fallback
   was `() => true` (allow all). Fix: restrict to known `.claude/state/` dir.
3. **backupSwap data loss** — `renameSync` without try/catch after moving
   original to `.bak` could lose both files. Fix: wrap in try/catch with
   rollback.
4. **Propagation win** — Found same unsafe `projectDir` pattern in
   `post-write-validator.js` and migrated to shared `git-utils.js`.
5. **Seed data immutability** — `readonly` array prevents accidental mutation of
   constants used in reset operations.

**Key learning:** When extracting shared libraries from hooks, the security
properties of the original inline code must transfer to the shared module. The
`resolveProjectDir()` function now centralizes validation that was previously
done (or missing) in each hook independently.

---

#### Review #351: PR #374 R2 — Path Sep Boundary, New-File Guard, Evidence Dedup (2026-02-17)

**Source:** Qodo Compliance + Code Suggestions **PR/Branch:**
claude/cherry-pick-recent-commits-X1eKD (PR #374) **Suggestions:** 3 total
(Fixed: 3)

**Patterns:**

1. **Path separator boundary** — `startsWith(dir)` without `+ path.sep` allows
   sibling-prefix bypass (`/repo/app` matches `/repo/app-malicious`). Fix: check
   `a === b || a.startsWith(b + path.sep)`. Also case-insensitive on Windows.
2. **realpathSync on new files** — Fallback `isSafeToWrite` used `realpathSync`
   on paths that don't exist yet (`.tmp`, `.bak`). Fix: realpath the parent dir
   and rejoin basename.
3. **Evidence dedup** — 27 JSONL entries had 3x duplicated `code_reference` and
   `description` objects in evidence arrays. Fixed with Set-based dedup.

---

#### Review #352: PR #374 R3 — Descendant Containment, backupSwap Copy, mkdirSync Order, CI Fix (2026-02-17)

**Source:** Qodo Compliance + Code Suggestions + CI Failure **PR/Branch:**
claude/cherry-pick-recent-commits-X1eKD (PR #374) **Suggestions:** 8 total
(Fixed: 7, Deferred: 1)

**Patterns:**

1. **Descendant-only containment** — Bidirectional `startsWith` allowed ancestor
   directories (e.g., `/`). Restricted to descendant-only: resolved must be cwd
   or under cwd, not the reverse.
2. **backupSwap: copy fallback** — If rename to `.bak` fails, `copyFileSync` as
   fallback instead of deleting the original. Prevents data loss on cross-drive.
3. **mkdirSync before isSafeToWrite** — `realpathSync` in isSafeToWrite fails if
   parent dir doesn't exist yet. Move mkdirSync first.
4. **isSafeToWrite hooks dir** — Fallback guard was too restrictive (state dir
   only). Added hooks dir since hooks write to their own directory.
5. **npm UA parsing crash** — `split("/")[1].split(" ")[0]` crashes on
   unexpected format. Replaced with regex extraction.
6. **MASTER_DEBT orphaned refs** — Evidence dedup in R2 used `generate-views.js`
   which overwrites MASTER_DEBT from deduped.jsonl. The deduped.jsonl had fewer
   items than main's MASTER_DEBT (missing ROADMAP-referenced IDs). Fixed by
   merging committed + main entries.

**Key learning:** The MASTER_DEBT/deduped.jsonl sync is fragile. When deduping
evidence arrays, operate on MASTER_DEBT directly and only copy TO deduped.jsonl
afterward — never let generate-views.js overwrite MASTER_DEBT with a subset.

---

#### Review #353: Qodo — check-review-archive.js Silent Catches, groupConsecutive Robustness (2026-02-18)

**Source:** Qodo PR Code Suggestions **PR/Branch:** claude/new-session-KE2kF
**Suggestions:** 4 total (Fixed: 3, Rejected: 1, Propagation: +2)

**Patterns:**

1. **Silent catch blocks** — 5 catch blocks in check-review-archive.js swallowed
   errors silently. Added error logging to all file-level catches (symlink-guard
   import, extractReviewIds, checkWrongHeadings, getJsonlMaxId). Left per-line
   JSONL parse catch silent (expected failures on malformed lines).
2. **Defensive sort/dedupe** — groupConsecutive assumed sorted, unique input.
   Added `Array.from(new Set(nums)).sort()` for robustness.
3. **False positive: redundant exit code** — Qodo suggested adding
   `process.exitCode = 1` after main(), but main() already sets it on line 345.
   Rejected as redundant.

**Key Learnings:**

- Propagation check caught 2 additional silent catches beyond the 3 reported by
  Qodo (checkWrongHeadings L170, getJsonlMaxId L193)
- Per-line JSONL parsing catches should remain silent — malformed lines are
  expected input, not errors

---
