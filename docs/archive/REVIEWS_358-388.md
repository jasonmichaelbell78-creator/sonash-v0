<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-27
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Archived Reviews #358-#384

Reviews archived from AI_REVIEW_LEARNINGS_LOG.md on 2026-02-27.

---

### PR #383 Retrospective (2026-02-21)

#### Review Cycle Summary

| Metric         | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| Rounds         | 8 (R1–R8, all on 2026-02-21)                                 |
| Total items    | ~282                                                         |
| Fixed          | ~192                                                         |
| Deferred       | ~67 (CC pre-existing)                                        |
| Rejected       | ~23                                                          |
| Review sources | SonarCloud, Qodo Compliance, Qodo PR Suggestions, CI, Gemini |

#### Per-Round Breakdown

| Round     | Date       | Source                  | Items    | Fixed    | Rejected | Key Patterns                                                     |
| --------- | ---------- | ----------------------- | -------- | -------- | -------- | ---------------------------------------------------------------- |
| R1        | 2026-02-21 | SonarCloud              | ~60      | ~58      | ~2       | Bulk SonarCloud fixes across 18 files                            |
| R2        | 2026-02-21 | Qodo Compliance+Suggest | ~15      | ~13      | ~2       | Compliance items, code suggestions                               |
| R3        | 2026-02-21 | SonarCloud+Qodo+CI      | ~27      | ~22      | ~5       | Catch parameter whack-a-mole, CI doc lint                        |
| R4        | 2026-02-21 | SonarCloud+Qodo+CI      | ~18      | ~14      | ~4       | Bare catch, i++ pattern, path guards, destructured import bug    |
| R5        | 2026-02-21 | SonarCloud+Qodo         | ~41      | ~19      | ~22(CC)  | Secret leakage, path traversal, atomic writes                    |
| R6        | 2026-02-21 | SonarCloud+Qodo         | ~41      | ~19      | ~22(CC)  | Symlink dir bypass, double-counting, propagation misses          |
| R7        | 2026-02-21 | SonarCloud+Qodo+CI      | ~50      | ~25      | ~25(CC)  | 25 CC reductions, 5 security hotspots                            |
| R8        | 2026-02-21 | Qodo+SonarCloud         | ~30      | ~22      | ~8       | Atomic rollback, symlink parents, path traversal, token validate |
| **Total** |            |                         | **~282** | **~192** | **~90**  |                                                                  |

#### Ping-Pong Chains

##### Chain 1: Symlink/Write Guard Progressive Hardening (R5→R6→R7→R8 = 4 rounds)

| Round | What Happened                                                                                      | Files Affected | Root Cause          |
| ----- | -------------------------------------------------------------------------------------------------- | -------------- | ------------------- |
| R5    | Added isWriteSafe() and atomic writes in intake-sonar-reliability.js                               | 2 files        | First security pass |
| R6    | isWriteSafe() only checked file, not parent dirs. saveJsonl missing guard                          | 2 files        | Incomplete R5       |
| R7    | sync-deduped.js writeJsonl still unguarded, commit-failure-reporter fail-open                      | 2 files        | Propagation miss    |
| R8    | Added remaining guards: sync-deduped symlink, parent dir traversal, report file guard, fail-closed | 5 files        | Final sweep         |

**Avoidable rounds:** 2 (R7, R8). A codebase-wide `grep` for all write paths in
R5 would have caught them all.

**Prevention:** After any security fix, mandatory
`grep -rn 'writeFileSync\|renameSync\|appendFileSync' scripts/` and fix ALL
instances.

##### Chain 2: Atomic Paired Writes (R5→R6→R8 = 3 rounds)

| Round | What Happened                                                | Files Affected                                                                       | Root Cause             |
| ----- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------- |
| R5    | Added atomic writes but no rollback on second rename failure | intake-sonar-reliability.js                                                          | Initial implementation |
| R6    | Added CRITICAL error message but still no rollback           | intake-sonar-reliability.js                                                          | Incomplete fix         |
| R8    | Added rollback to 4 files                                    | audit-s0-promotions, reverify-resolved, verify-resolutions, intake-sonar-reliability | Propagation            |

**Avoidable rounds:** 1 (R8 propagation).

##### Chain 3: Catch Parameter Naming (R3→R4 = 2 rounds)

| Round | What Happened                                                | Files Affected | Root Cause                             |
| ----- | ------------------------------------------------------------ | -------------- | -------------------------------------- |
| R3    | Added console.debug() to catch blocks, kept unused parameter | Multiple       | Satisfying one rule, violating another |
| R4    | Flagged unused parameter. Fixed with bare `catch {}`         | Multiple       | Two competing rules                    |

**Avoidable rounds:** 1 (R4).

**Total avoidable rounds across all chains: 4** (~50% of rounds R1-R4 necessary,
R5-R8 mix of necessary + avoidable)

#### Rejection Analysis

| Category                          | Count | Rounds | Examples                                                 |
| --------------------------------- | ----- | ------ | -------------------------------------------------------- |
| CC pre-existing (deferred)        | ~67   | R5-R7  | CC 16-67 across 13 files, not in PR scope                |
| Qodo compliance (offline scripts) | ~15   | R2-R4  | "Missing audit trails", "Secure logging" for CLI scripts |
| Data quality (JSONL)              | ~8    | R2-R3  | Placeholder titles — intentional pipeline output         |

**Rejection accuracy:** ~90/90 rejections correct (100%). CC deferrals and
compliance rejections match established patterns.

#### Recurring Patterns (Automation Candidates)

| Pattern              | Rounds           | Already Automated?    | Recommended Action                                                         | Est. Effort |
| -------------------- | ---------------- | --------------------- | -------------------------------------------------------------------------- | ----------- |
| Symlink write guards | R5,R6,R7,R8      | Partial (ESLint rule) | Ensure `sonash/no-stat-without-lstat` covers all writeFileSync paths       | ~20 min     |
| Atomic paired writes | R5,R6,R8         | No                    | Add check-pattern-compliance rule for dual JSONL writes without tmp+rename | ~30 min     |
| Propagation misses   | R6,R7,R8         | No (process)          | Mandatory codebase-wide grep after any security fix                        | Process     |
| CC >15               | R5-R7 (deferred) | **YES**               | Implemented this PR — complexity: ["error", 15] on staged files            | Done        |

#### Previous Retro Action Item Audit

| Retro   | Recommended Action                 | Implemented?      | Impact on #383                     |
| ------- | ---------------------------------- | ----------------- | ---------------------------------- |
| PR #367 | CC eslint complexity rule          | **YES** (this PR) | 0 new CC violations — rule working |
| PR #367 | shellcheck for .husky hooks        | **NOT DONE**      | Not relevant (.husky now JS-based) |
| PR #368 | FIX_TEMPLATES #22 (atomic write)   | YES               | Used in R5 fixes                   |
| PR #368 | FIX_TEMPLATES #27 (fd-based write) | YES               | Referenced in R7                   |
| PR #369 | Qodo JSONL suppression             | **YES** (PR #371) | Reduced noise from ~40 to ~8 items |
| PR #369 | TDMS entries for retro actions     | Partial           | 3 entries exist                    |
| PR #370 | Path normalization test matrix     | **NOT DONE**      | 1 item in R8 (sprint-intake)       |
| PR #370 | Qodo actor context suppression     | **NOT DONE**      | ~5 rejected compliance items       |

**Total avoidable rounds from unimplemented retro actions: ~1**

#### Cross-PR Systemic Analysis

| Pattern                | PRs Affected        | Times Recommended | Status                 | Required Action                        |
| ---------------------- | ------------------- | ----------------- | ---------------------- | -------------------------------------- |
| CC lint rule           | #366-#370           | 4x                | **RESOLVED** (PR #383) | Done                                   |
| Qodo JSONL suppression | #369-#370           | 2x                | **RESOLVED** (PR #371) | Done                                   |
| Symlink write guards   | #366,#368,#369,#383 | 4x                | Partial                | Ensure ESLint rule covers all patterns |
| Propagation protocol   | #369,#383           | 2x                | Process only           | Consider mandatory grep step           |
| shellcheck             | #367-#370           | 4x                | Never done             | Low priority — hooks now JS            |
| TDMS retro tracking    | #369-#370           | 2x                | Partial                | Continue creating DEBT entries         |

#### Skills/Templates to Update

- **FIX_TEMPLATES.md:** Add template for "atomic dual-JSONL write with rollback"
  (~15 min)
- **pr-review SKILL.md Step 0.5:** Add dual-file write grep check (~5 min)
- **check-pattern-compliance.js:** Rule for writeFileSync without symlink guard
  in scripts/ (~30 min)

#### Process Improvements

1. **Propagation is the #1 churn driver** — 3/10 R6 fixes and most R8 fixes were
   propagation misses. Evidence: R6, R7, R8.
2. **CC rule implementation paid off** — 0 new CC violations despite 16 files
   modified. Evidence: R7-R8.
3. **Large PRs amplify review cycles** — 24 commits, 30+ files, 8 rounds.
   Evidence: largest PR in series.

#### Verdict

The review cycle was **moderately efficient** — 8 rounds with ~4 avoidable (50%
necessary). R1-R4 were productive (bulk fixes, compliance). R5-R6 were
productive security hardening. R7-R8 were propagation cleanup. The **single
highest-impact change** for future PRs: enforce the propagation protocol — after
fixing any security pattern, `grep` and fix ALL instances in the same commit.

**Trend: Clearly improving.** The top 2 systemic issues (CC rule, Qodo JSONL
suppression) were resolved. Avoidable-round percentage dropped from 57% (#369)
to 50% (#383) despite 5x larger scope. The remaining churn driver (propagation
misses) is a process issue, not a tooling gap.

#### Review #358: PR #379 R4 — ReDoS Bounded Quantifiers, Dead Store Elimination, CRLF/BOM Normalization (2026-02-20)

**Source:** SonarCloud + Qodo + Gemini **PR/Branch:** PR #379 /
claude/cherry-pick-commits-thZGO **Suggestions:** 30 total (Critical: 1, Major:
9, Minor: 9, Info: 8, Incremental: 3) (Fixed: 12 code smells + 9 PR suggestions,
Rejected: 8 Info false positives)

**Process Failure:** This review was handled WITHOUT invoking the `/pr-review`
skill. No proper intake, no categorization table, no learning log entry was
created at commit time. This entry is being written retroactively. The same
failure occurred in Review #357.

**Patterns Identified:**

1. **ReDoS via unbounded quantifiers in alternation** (CRITICAL): Regex
   `/(?:join\s*\(|`[^`]*\$\{|\/\S*session|...)`had two backtracking-prone quantifiers:`[^`]_`and`\S_` followed by literals. Fix: split into individual tests with bounded quantifiers (`[^`]{0,200}`, `\S{0,100}`) and simple `includes()`
   for literal matches.
2. **Dead store false positives in for-loop index manipulation** (MAJOR):
   SonarCloud flagged `c += 1` inside for-loops as dead stores (8 instances
   across 2 functions). The increments were correct (skip 2-char tokens like
   `/*` and `*/`) but SonarCloud's dataflow analysis doesn't model for-loop
   header interactions. Fix: refactored to while-loops with explicit `i += 2`
   and merged duplicate functions into shared `parseBlockCommentState`.
3. **Not-applicable metrics inflating scores** (MAJOR): When no large reviews
   exist, `parallelPct` defaulted to 100 instead of null, inflating the agent
   utilization score. Fix: return null and short-circuit to neutral
   `{ score: 100, rating: "good" }`.
4. **CRLF/BOM in JSONL parsers** (MINOR): Three JSONL parsers split on `\n`
   without handling `\r\n` or BOM bytes. Cross-platform files would produce
   JSON.parse errors from trailing `\r`. Fixed in backlog health, data-state
   health, and effectiveness metrics parsers.
5. **Cross-device rename failure** (MINOR): `fs.renameSync` fails with EXDEV on
   cross-device moves (e.g., tmp on different partition). Added try/catch with
   `copyFileSync` + `rmSync` fallback.

**Key Learning:** Skipping the `/pr-review` protocol is false economy — it
creates more work in follow-up rounds because categorization and learning
capture are deferred but still required. The 9-step protocol exists because
every shortcut eventually costs more than the ceremony.

---

#### Review #359: PR #379 R5 — CC Helper Extraction, Checker Failure Surfacing, CRLF Propagation, .bak Rotation (2026-02-20)

**Source:** SonarCloud + Qodo (Round 3 on this branch) **PR/Branch:** PR #379 /
claude/cherry-pick-commits-thZGO **Suggestions:** 22 total + 3 propagation
(Critical: 1, Major: 4, Minor: 10, Trivial: 1, Rejected: 8 Info false positives,
Duplicate: 1) (Fixed: 14 + 3 propagation, Rejected: 8, Duplicate: 1)

**Patterns Identified:**

1. **CC regression from helper merge** (CRITICAL): Merging two CC-17/18
   functions into one shared `parseBlockCommentState` created a CC-19 function —
   worse than the originals. Fix: extract `advanceStringChar` sub-helper per
   Template 30. **Root cause**: Template 30 verification checklist ("run CC
   check on entire file after extraction") was not executed in Round 2.
2. **CRLF propagation miss across loadJsonl copies** (MINOR): Fixed CRLF in
   effectiveness-metrics.js but 3 identical `loadJsonl` functions in
   process-compliance.js, feedback-integration.js, pattern-lifecycle.js were
   missed. **Root cause**: Step 5.6 propagation check was skipped in Round 2
   because the protocol wasn't followed.
3. **Silent checker failures in audit runner** (MAJOR): When a domain checker
   threw, the error was logged to stderr but no finding was created — the audit
   report showed a clean pass. Fix: push a high-severity `PEA-DOMAIN-FAIL-*`
   finding into allFindings on catch.
4. **Case-insensitive severity normalization** (MAJOR): JSONL entries with
   lowercase `s1` or `warning` were silently ignored by filters checking for
   uppercase. Two separate instances: backlog parser and alerts failureRate7d.

**Resolution:**

- Fixed: 17 items (14 direct + 3 propagation)
- Rejected: 8 items (TODO false positives in TODO-extractor script)
- Duplicate: 1 item (Qodo #12 = incremental variant of #7)
- Deferred: 0

**Key Learnings:**

- Always run CC check on the ENTIRE file after extracting helpers, not just the
  refactored function. A merge that reduces two 17+18 CC functions to one 19 CC
  function is a regression, not an improvement.
- The `/pr-review` protocol exists because every skipped step costs a future
  review round. Rounds 1-2 skipped the protocol entirely, causing Round 3 to
  catch propagation misses and CC regressions that the protocol would have
  prevented.
- When fixing a JSONL parsing issue (CRLF), always `grep -rn "loadJsonl"` to
  find ALL copies. The pr-ecosystem-audit checkers have 6 nearly-identical
  `loadJsonl` functions — a dedup opportunity for future refactoring.

---

#### Review #360: PR #379 R6 — Null Metrics, safeRenameSync, Linter False Positives, Edge Guards (2026-02-20)

**Source:** SonarCloud + Qodo + Gemini (Round 4 on this branch) **PR/Branch:**
PR #379 / claude/cherry-pick-commits-thZGO **Suggestions:** 30 total (Qodo: 15,
SonarCloud: 11, Gemini: 3, Security: 1) (Fixed: 15, Rejected: 12, Already
addressed: 3, Architectural: 1 flagged)

**Patterns Identified:**

1. **Null-safe metric aggregation** (MAJOR): `computeAvgFixRatio` and
   `computeChurnPct` returned 0 when no data existed, inflating composite scores
   to appear healthy. Fix: return `null` for missing data, filter nulls from
   aggregation, compute average only from available metrics.
2. **Linter rule self-flagging** (MAJOR): `rename-no-fallback` rule only checked
   for `writeFileSync` fallback, missing `copyFileSync` (which the fix template
   actually recommends). Also missed `catch` block validation and cleanup
   (`unlinkSync/rmSync`). Fix: require try + catch + copy fallback + cleanup.
3. **safeRenameSync propagation to own code** (MAJOR): Round 5 added `.bak`
   rotation with bare `renameSync` calls — exactly the pattern the linter rule
   detects. Fix: inline `safeRename` helper with copyFileSync + unlinkSync
   fallback.
4. **Empty backlog = healthy, not error** (MINOR): An empty MASTER_DEBT.jsonl
   was treated as corrupt (exit code 2). Fix: detect truly empty files and
   output "no debt" summary with exit code 0.
5. **Future-dated timestamps bypass aging alerts** (MINOR): Negative `ageDays`
   values from future `created` dates would never be "oldest" but could confuse
   metrics. Fix: `if (ageDays < 0) continue`.

**Resolution:**

- Fixed: 15 items (6 Major, 7 Minor, 2 Trivial)
- Rejected: 12 items (1 SonarCloud tool conflict, 10 persistent TODO FPs, 1 dup)
- Already addressed: 3 items (Gemini outdated)
- Architectural: 1 (repo code execution via execFileSync — flagged to user)
- Deferred: 0

**Key Learnings:**

- When building linter rules, test them against the project's OWN fix patterns.
  The `rename-no-fallback` rule only accepted `writeFileSync` but the project's
  standard fix uses `copyFileSync` — the rule would flag its own recommended
  fix.
- Metric functions returning 0 for "no data" vs "measured at zero" is a semantic
  bug that inflates composite scores. Always use null/undefined to represent
  absence, not zero.
- First round to follow the full `/pr-review` protocol from Step 0. Caught 3
  more items via categorization discipline than the previous skip-protocol
  rounds averaged.

---

#### Review #361: PR #381 R1+R2 — Empty Catch Logging, Filter Safety, Regex Broadening, Propagation Fix (2026-02-20)

**Source:** Qodo Compliance + Qodo Code Suggestions + Gemini Code Assist (R1+R2)
**PR/Branch:** PR #381 / claude/fix-tool-use-ids-LYbwR **R1:** 10 raw → 6 fixed,
4 rejected **R2:** 9 raw (3 repeats) → 5 new fixed, 4 rejected (3 repeats + 1
new)

**Patterns Identified:**

1. **Empty catch blocks in new code** — Three reviewers independently flagged
   the same empty catch in session-start.js. Always log warnings in catch
   blocks, even for non-fatal operations. Pattern: "non-fatal" ≠ "silent".
2. **Truthy filter vs type check** — `r.id` is falsy when `id === 0`, causing
   review #0 to be excluded. Use `typeof r.id === "number"` for numeric fields.
3. **Regex anchoring assumptions** — `[a-z]` as first char excludes uppercase or
   digit-leading IDs. Use `[\w]` with word boundary for broader matching.
4. **Propagation miss on truthy filters (R2)** — R1 fixed `r.id` at line 538 but
   missed `r.pr_number || r.pr` at lines 152 and 274. Same class of bug, should
   have been caught by grep in R1. Reinforces: always grep the pattern.
5. **Dedup metric accuracy (R2)** — `.match()` counts all occurrences including
   duplicates. For counting unique IDs, use `matchAll` + `Set`.
6. **Defensive error access (R2)** — `err.message` crashes if a non-Error is
   thrown. Use `err instanceof Error ? err.message : String(err)`.

**Key Learnings:**

- When adding try/catch around non-fatal operations, always include at minimum a
  `console.warn` with the error message — this was flagged by all 3 reviewers
- Filter predicates on numeric fields must use `typeof` checks, not truthiness
- **R2 lesson**: When fixing a truthy-filter bug, grep for ALL similar filter
  predicates in the same file, not just the reported line. R1 fixed line 538 but
  lines 152 and 274 had the identical pattern

---

#### Review #362: PR #382 R1 — Regex DoS, Severity Mapping Bug, Table Parsing, 49 Items (2026-02-20)

**Source:** SonarCloud (23) + Gemini Code Assist (3) + Qodo PR Suggestions (23)
**PR/Branch:** PR #382 / claude/fix-tool-use-ids-EfyvE **Total:** 49 raw → 42
fixed, 4 rejected (compliance not-applicable), 3 flagged to user (architectural)

**Patterns Identified:**

- TWO-STRIKES regex: `matchNumberedHeading` L548 flagged for both DoS (S5852)
  and complexity (31>20) — replaced with string parsing per CLAUDE.md rule
- Severity mapping bug: `critical→S1` instead of `S0` caused 374 items to be
  mis-prioritized in initial extraction
- `filter(Boolean)` on table splits drops empty cells, shifting column indexes
- Title-only dedup key causes distinct findings (same title, different files) to
  merge incorrectly
- Explicit severity markers (S0-S3) must be checked before keyword heuristics
- `source_id` sequence suffix != source file line number (false positive)

**Key Learnings:**

- Regex complexity >20 from large alternation sets → replace with Set + function
- Severity mapping in extraction scripts should always prefer explicit markers
- Table parsing must strip outer pipes before split, not filter(Boolean) after
- CRLF handling needed even for repo-internal files on Windows
- Compliance checks (audit trails, input validation) don't apply to one-shot
  offline scripts processing trusted repo files

---

#### Review #363: PR #382 R2 — Regex DoS String Parse, CC Extraction, Severity Split, 16 Items (2026-02-20)

**Source:** SonarCloud (12) + CI/Prettier (1) + Qodo PR Suggestions (6)
**PR/Branch:** PR #382 / claude/fix-tool-use-ids-EfyvE **Total:** 16 unique → 14
fixed, 4 rejected (R1 compliance repeats)

**Patterns Identified:**

- TWO-STRIKES regex (R2): `isTableHeaderLine` separator regex flagged again for
  DoS (S5852) — replaced with `isTableSeparatorLine` character-by-character
  parser
- CC extraction: `extractFromBullets` CC 19>15 — extracted `processBulletLine`
  helper to reduce cognitive complexity
- Severity split: `medium` and `low` were both mapped to S3 — split to
  medium→S2, low→S3 with proper `\b` word boundaries
- H1 heading guard: `matchNumberedHeading` accepted H1 (`# Title`) due to
  `startsWith("#")` — changed to `/^#{2,5}\s/` test
- Within-run dedup: `buildFindings` in roadmap script could produce duplicates
  within a single run — added `seenRunHashes` Set
- End-of-line severity: regex `[\s,)]` missed markers at end of string — added
  `|$` alternative

**Key Learnings:**

- String parsing beats regex for table separator detection (simple char loop)
- CC extraction should check the _extracted_ helper too, not just the parent
- Severity mapping should separate medium (S2) from low (S3) — grouping them
  causes silent mis-prioritization
- Anchor regexes for ID matching (`^...$`) to prevent false matches on
  substrings

---

#### Review #364: PR #382 R3 — Cross-Report Dedup, Milestone Reset, Severity Case, 5 Fixes (2026-02-20)

**Source:** SonarCloud (2) + Qodo Compliance (6) + Qodo PR Suggestions (3)
**PR/Branch:** PR #382 / claude/fix-tool-use-ids-EfyvE **Total:** 11 raw → 5
fixed, 5 rejected (compliance repeats for offline CLI scripts), 1 green pass

**Patterns Identified:**

- Cross-report dedup gap: `existingHashes` not updated during report loop —
  findings appearing in 2+ reports would be duplicated within a single run
- Stale milestone: `currentMilestone` persisted across non-milestone headings,
  causing incorrect attribution in TDMS entries
- Case-insensitive severity: `S[0-3]` regex missed lowercase `s0` markers in
  source documents — added `[sS]` + `.toUpperCase()`
- String.raw for RegExp: `\\d+` in template literal → `String.raw` avoids
  double-escaping

**Key Learnings:**

- When accumulating dedup hashes across a loop, update the hash set inside the
  loop — not just before it
- State variables (currentMilestone) that track context must be reset when
  context changes, not just set when matching
- Compliance items for offline CLI scripts (audit trails, secure logging, input
  validation) are consistently not applicable — 3 consecutive rounds confirm

---

#### Review #365: PR #383 R1-R4 — SonarCloud Bulk Fixes, Qodo Compliance, CI Doc Lint (2026-02-21)

**Source:** SonarCloud (R1-R4) + Qodo Compliance (R2-R4) + Qodo PR Suggestions
(R2-R4) + CI Failure (R3-R4) **PR/Branch:** PR #383 /
claude/fix-tool-use-ids-EfyvE **Total:** 235 raw items across 4 rounds → 162
fixed, 22 CC deferred, 1 rejected, 1 architectural

**Patterns Identified:**

- **Catch parameter naming whack-a-mole**: R3 added `console.debug()` to empty
  catch blocks but kept unused `error_`/`_` parameters. R4 flagged both the
  unused parameter AND the original empty-catch rule. Fix: use bare `catch {}`
  when the error object isn't needed. Root cause: R3 focused on satisfying one
  rule without checking if the fix introduced violations of other rules.
- **Assignment expression vs increment**: `i += 1` flagged by SonarCloud S1854
  as "useless assignment" even when used for arg-parsing skip. `i++` as
  standalone statement is exempt from S1854. R3 "fixed" this by reordering but
  kept `i += 1`. Fix: use `i++` for standalone increments, reserve `i += 1` for
  when the expression value is needed.
- **Destructured import bug**: `const sanitizeError = require(...)` assigns the
  module object, not the function. Would cause runtime TypeError. Need
  `const { sanitizeError } = require(...)`. This was a latent bug introduced in
  the original PR, not caught until R4.
- **Missing learning log entries**: Steps 3-7 of the pr-review protocol were
  skipped across R1-R3 due to context compaction dropping the protocol midway
  through each round. The learning capture (Step 7) is the LAST step and most
  vulnerable to compaction.

**Key Learnings:**

1. When fixing catch blocks, always check TWO rules: (a) is the catch handler
   meaningful? (b) is the catch parameter used? If not used, use bare
   `catch {}`.
2. For CLI arg-parsing `i` skips, use `i++` not `i += 1` — SonarCloud treats
   them differently for S1854.
3. The pr-review protocol's learning capture should happen IMMEDIATELY after
   fixes, not at the end of the session. Move Step 7 earlier in the protocol to
   survive compaction.
4. When a file is edited, SonarCloud may flag pre-existing issues in the same
   file that weren't in scope before — treat these as "pre-existing, fixable."

**Resolution:** 4 rounds total. R1: 60+ SonarCloud fixes. R2: 15 Qodo fixes. R3:
27 fixes (re-flags from R1/R2 fix artifacts). R4: 18 fixes (re-flags from R3
catch/assignment pattern + CI doc lint + path traversal + import bug).

---

#### Review #366: PR #384 R1 — SonarCloud + Qodo + CI (2026-02-22)

**Source**: SonarCloud (17 issues) + Qodo (10 suggestions) + CI failure (1)
**PR**: #384 (comprehensive 9-domain audit + TDMS intake + debt placement)
**Items**: 28 total — 19 fixed, 0 deferred, 9 Qodo suggestions (acknowledged)

**Patterns Identified**:

- **CC extraction creates new CC**: Extracting helpers from a CC>15 function can
  produce helpers that themselves exceed CC>15. Always re-check extracted
  helpers.
- **FP report double-counting**: When two exclusion mechanisms exist
  (verified-patterns.json
  - pathExcludeList), merging counts without tracking source inflates the total.
    Fix: separate columns per source.
- **Duplicate code in if/else-if**: `applyGraduation()` had identical blocks for
  `critical` and `high && !STAGED`. Combine with boolean:
  `severity === "critical" || (severity === "high" && !STAGED)`.
- **Regex `[Cc]` with `i` flag**: Case-insensitive flag makes explicit case
  character classes redundant. SonarCloud flags as "duplicate in character
  class."
- **Division by zero in analytics**: Coverage percentage divides by
  `openItems.length` without checking for zero. Always guard division in
  reporting code.

---

#### Review #367: PR #389 R1 — Qodo + Gemini (2026-02-25)

**Source**: Qodo (23 suggestions + 4 compliance) + Gemini (1 bug) **PR**: #389
(ecosystem audit expansion + skill bloat reduction) **Items**: 25 total — 22
fixed, 0 deferred, 2 rejected, 1 pre-fixed

**Patterns Identified**:

- **Path containment across new audit checkers**: 6 files had
  `path.join(rootDir, ref)` without containment guards. All new audit checker
  files that accept external file references need `path.isAbsolute()` +
  `path.resolve()` + `path.relative()` containment check. This is a propagation
  pattern — should be caught at code review time, not reviewer feedback time.
- **Basename-only dedup in run files**: 3 run-\*-ecosystem-audit.js files used
  basename-only regex for finding dedup, silently collapsing distinct findings
  from different directories. Fix: prefer `f.patchTarget` and match full paths.
- **Symlink skip via lstatSync**: New filesystem walker code should always use
  `lstatSync` + `isSymbolicLink()` skip before `statSync`. This prevents
  symlink-based directory escapes in audit tools.
- **canVerifyPkgScripts flag**: When checker validates `npm run` scripts against
  package.json, missing/unreadable package.json should not penalize the score.
  Add explicit `canVerifyPkgScripts` boolean.
- **Code fence counting needs state machine**: Regex `/^```\s*$/gm` counts both
  opening and closing fences. Need line-by-line state machine to only count
  opening fences without language tags.
- **Frontmatter regex must anchor to file start**: Using `/m` flag with `^---`
  matches horizontal rules mid-document. Remove `m` flag for frontmatter
  detection.

**Resolution**: 22 items fixed across 14 files. 2 rejected (safeReadFile silent
catch is intentional; finding snippets are local-only). 1 pre-fixed (auditName
negative lookbehind already applied). Tests: 293 pass, 0 fail.

---

#### Review #368: PR #389 R2 — Qodo + Gemini + Compliance (2026-02-25)

**Source**: Qodo (32 suggestions + 3 compliance) + Gemini (0 new) **PR**: #389
(ecosystem audit expansion + skill bloat reduction) **Items**: 40 parsed — 31
fixed, 0 deferred, 3 rejected, 6 stale (R1-fixed)

**Patterns Identified**:

- **collectScriptFiles symlink propagation**: `fs.statSync` in recursive walkers
  appears in module-consistency.js AND code-quality.js (same pattern, different
  files). Both need `lstatSync` + symlink skip. Always grep for duplicate walker
  implementations.
- **findings.filter ID generation**: O(n^2) anti-pattern appeared in 6 checker
  files across 3 ecosystem audits. All produce non-unique IDs. Replace with
  pre-loop counter everywhere.
- **YAML multiline run: parsing**: Hardcoded `^\s{6,}` indentation fails for
  non-standard nesting depths. Track `runIndent` dynamically.
- **isInsideTryCatch brace logic**: When scanning backwards, `{` increments
  depth (entering a block) and `}` decrements (leaving). The original code had
  these swapped.
- **resolveRelativePath absolute path stripping**: Stripping leading slashes
  from absolute paths (`/etc/passwd` → `etc/passwd`) creates a valid-looking
  relative path. Always reject absolute paths outright.
- **DoS caps for recursive walkers**: New recursive walkers need MAX_DEPTH and
  MAX_FILES constants to prevent CI abuse via deep/wide directory trees.

**Resolution**: 31 items fixed across 17 files. Tests: 293 pass, 0 fail. 3
rejected (safeRequire error surfacing, silent catches — all intentional). 6
stale items already addressed in Review #367.

---

#### Review #369: PR #394 R1 — SonarCloud + Qodo + Gemini + CI (2026-02-26)

**Source**: SonarCloud (35 code smells + 1 security hotspot) + Qodo (18
suggestions + 6 compliance) + Gemini (1 inline) + CI (2 blockers) **PR**: #394
(resolve over-engineering findings, ESLint AST migration) **Items**: 86 parsed
(82 unique after dedup) — 42 fixed, 0 deferred, 16 enhancement suggestions
(flagged to user), ~24 false positives/pre-existing/test-intentional

**Patterns Identified**:

- **CC reduction via generic AST walker**: Two nearly-identical `walk()` inner
  functions (each CC 23) in `no-unsafe-error-access.js` collapsed to one shared
  `walkAst(node, visitor)` at module scope. Visitor pattern eliminates
  duplicated traversal logic. Applicable to any ESLint rule with recursive AST
  walking.
- **isInsideTryBlock must check range, not just ancestor type**: Returning true
  for any `TryStatement` ancestor counts `catch`/`finally` blocks as guarded.
  Must verify `node.range` falls within `current.block.range`. This is the third
  time this pattern has appeared (Reviews #374, #375, now #369).
- **hasRenameSyncNearby ordering matters**: Checking for `renameSync` anywhere
  in a block creates false negatives — a pre-existing rename before the write
  masks a non-atomic write. Fix: only search statements after the writeFileSync.
- **Pre-existing violations surface when file is modified**: `generate-views.js`
  had 8 CRITICAL (symlink guard) + 49 HIGH (Array.isArray) pre-existing
  violations that blocked commit/push when the file was staged for unrelated
  fixes. Added to `verified-patterns.json` exclusions. Lesson: when touching
  large files, check pattern compliance before committing.
- **SEC-004 triggered by inline comment examples**: Comments containing
  `AKIAIOSFODNN7EXAMPLE` in `no-hardcoded-secrets.js` triggered CI security scan
  even though they were documentation, not code. Replaced with generic
  descriptions. Test files with the same strings are excluded by the security
  check's `exclude: [/test/]` pattern.
- **Duplicate hash prevention in batch ingestion**: When ingesting multiple
  items from `deduped.jsonl`, the `masterHashes` set must be updated within the
  loop to prevent two items with the same `content_hash` in the same batch from
  both being ingested.

**Resolution**: 42 items fixed across 20 files. Tests: 282 pass, 0 fail. 16
enhancement suggestions documented for user review (ESLint rule improvements for
false positive/negative reduction). Quality Gate duplication (13.4%) is
structural — ESLint rules share similar AST patterns by design.

---

#### Review #367: PR #384 R2 — CI Pattern Compliance + Qodo Suggestions (2026-02-22)

**Source**: CI failure (112 blocking pattern violations) + Qodo compliance (4
items) + Qodo code suggestions (20 items) + SonarCloud (3 items) **PR**: #384
(comprehensive 9-domain audit + TDMS intake + debt placement) **Items**: 139
total — 125 fixed, 7 rejected, 7 deferred

**Patterns Identified**:

- **Array.isArray checker false positives**: The `missing-array-isarray` pattern
  regex uses forward lookahead for `Array.isArray` but guards appear BEFORE
  array methods. Files with correct guards still get flagged. Fix: add to
  verified-patterns.json when guards are confirmed present.
- **Parallel agent fix strategy effective**: 4 parallel agents fixing 4 file
  groups resolved 95+ violations in a single round. File grouping by concern
  area (debt scripts, consolidation scripts, ecosystem checkers, remaining) kept
  agent context focused.
- **`// catch-verified: core module` comment pattern**: The loadConfig/require
  pattern checker accepts this inline comment to suppress false positives on
  core module require() calls. Consistent with how other fixed files handle it.
- **happy-path-only regex was fundamentally flawed**:
  `async\s+function\s+\w+[^}]*?(?!try)` produced false positives. Replaced with
  testFn that scans an 80-line window for `await` and `try` keywords — more
  accurate and no regex DoS risk.
- **`||` vs `??` for zero-value metrics**:
  `review.total || review.items_total || 0` treats 0 as falsy, causing incorrect
  metric calculations. Use `??` for numeric fields that may legitimately be 0.
- **Sprint file format resilience**: `data.sprint` may be undefined if sprint
  file format varies. Always derive sprint name from filename as fallback.

**Resolution**: 112 CI blocking violations → 0. All 30 pattern tests pass.

---

#### Review #368: SonarCloud + Qodo + CI R3 — CC Reduction, Nested Ternaries, Atomic Writes (2026-02-22)

**Source**: SonarCloud (10 items) + CI Security Pattern Check (1 failure) + Qodo
compliance (1 item) + Qodo code suggestions (6 items) **PR**: #384 R3 **Items**:
18 total — 16 fixed, 1 deferred, 1 rejected

**Key Patterns:**

- CC reduction via helper extraction (3 functions across 2 files:
  `simplifyPlacements` 19→~8, `loadSprintFiles` 20→~10, `placeItemsIntoSprints`
  24→~12)
- Nested ternary extraction → independent statements (4 instances)
- Atomic write improvements: `renameSync` first, copy+delete fallback
- Sprint metadata path traversal: trust filename over JSON content
- Regex complexity 35→string parsing (two-strikes rule: replaced with
  function-based test)
- TOCTOU regex: expanded to detect same-line `&&` patterns

**Deferred:** `compact-restore.js:34,36` path containment (pre-existing,
complex) **Rejected:** CI SEC-002/001/010/003 on `pattern-compliance.test.js`
(intentional test data)

---

#### Review #369: CI + SonarCloud + Qodo R4 — Security Excludes, CC Extract, EXDEV Guard (2026-02-22)

**Source**: CI failure (SEC-001/SEC-010 blocking) + SonarCloud (2 items) + Qodo
code suggestions (7 items) **PR**: #384 R4 **Items**: 12 total — 11 fixed, 0
deferred, 1 rejected

**Key Patterns:**

- Security scanner exclude patterns: test files containing intentional security
  anti-patterns (eval, execSync, innerHTML) need explicit excludes in
  `security-check.js` per-rule `exclude` array
- CC reduction: extracted `placeGroupItems` from `placeItemsIntoSprints`
  (21→~10)
- EXDEV-only fallback: `safeRename` should only fall back to copy+delete for
  cross-device rename errors, not swallow all errors
- Scoped regex replace: `updateCurrentMetrics` now scopes to "Current Metrics"
  section to prevent accidental replacements elsewhere
- CRLF-safe JSONL: `split(/\r?\n/)` for cross-platform robustness
- BOM stripping on JSON reads for Windows compatibility

**Rejected:** [6] inline-patterns.js regex fix — Qodo suggested removing `\\)`
from TOCTOU regex but the closing paren matches `if()`'s closing paren; removing
it would cause false negatives.

---

#### Review #370: PR #386 R1 — SonarCloud + Qodo + Gemini + CI (2026-02-23)

**Source**: SonarCloud (6 code smells + 1 security hotspot) + Qodo compliance (3
items) + Qodo code suggestions (8 items) + Gemini (1 item) + CI Prettier failure
(1 item) **PR**: #386 R1 **Items**: 19 total — 17 fixed, 0 deferred, 1 rejected
(false positive), 1 architectural (flagged to user)

**Key Patterns:**

- SonarCloud S5852 two-strikes: replaced 2 complex regexes (complexity 31
  and 26) with string-parsing testFn functions in check-pattern-compliance.js
- Regex DoS in seed-commit-log.js: replaced complex session counter regex with
  line-by-line string parsing
- Optional chaining: 3 instances of `x && x.test()` → `x?.test()` in
  check-pattern-compliance.js
- Array mutation: `keys.sort()` → `[...keys].sort()` for non-mutating sort
- Git log parsing: `parts.length < 4` → `< 6` to match 6-field format
- Atomic write hardening: added try/catch cleanup, rmSync before renameSync,
  copy/unlink fallback for cross-drive
- Repo root resolution: `process.cwd()` → `git rev-parse --show-toplevel`
- Sticky boolean false positive: replaced boolean flag with window-based
  proximity check in testFn
- Prettier CI fix: quote style in semgrep.yml
- Verified patterns: added seed-commit-log.js to 3 pathExcludeList entries

**Rejected:** Sensitive content in seeded JSONL — git commit data (author,
message) is already public in the repo history. No new exposure.

**Architectural (flagged to user):** ESLint migration for
check-pattern-compliance.js — significant effort, tracked as future tech debt.

---

#### Review #371: PR #386 R2 — SonarCloud S5852 + CC Reduction + Qodo Hardening (2026-02-23)

**Source**: SonarCloud (1 security hotspot + 2 CC critical) + Qodo code
suggestions (2 items) + SonarCloud minor (1 String.raw) **PR**: #386 R2
**Items**: 6 total — 6 fixed, 0 deferred, 0 rejected

**Key Patterns:**

- S5852 two-strikes: replaced `/(\d+)\s*$/` regex with backward digit walk (pure
  string parsing, no regex at all in getSessionCounter)
- CC reduction: extracted `parseCommitLines` and `writeEntries` from `main()`
  (CC 16→~6)
- CC reduction: wrapped `logical-or-numeric-fallback` testFn in IIFE with
  extracted `isWordChar` and `findNumericOrFallback` helpers (CC 24→~8)
- Concurrency-safe tmp: `COMMIT_LOG.tmp` → `COMMIT_LOG.tmp.${pid}.${Date.now()}`
- Fallback unlinkSync guard: added try/catch around cross-drive cleanup
- String.raw for backslash: `"\\|"` → `String.raw\`\\|\``
- Match snippets: added `match: line.trim().slice(0, 120)` to both testFn
  results for better violation output

---

### PR #370 Retrospective (2026-02-17)

#### Review Cycle Summary

| Metric         | Value                                         |
| -------------- | --------------------------------------------- |
| Rounds         | 5 (R1-R5, all on 2026-02-17)                  |
| Total items    | 53                                            |
| Fixed          | 46                                            |
| Deferred       | 1 (docs:check pre-existing errors)            |
| Rejected       | 6                                             |
| Review sources | SonarCloud, Qodo Compliance, Qodo Suggestions |

#### Per-Round Breakdown

| Round     | Date       | Source               | Items  | Fixed  | Rejected | Key Patterns                                               |
| --------- | ---------- | -------------------- | ------ | ------ | -------- | ---------------------------------------------------------- |
| R1        | 2026-02-17 | Qodo                 | 11     | 11     | 0        | Schema validation, security writeFileSync, data quality    |
| R2        | 2026-02-17 | SonarCloud+Qodo+CI   | 11     | 10     | 0        | Path traversal, i assignment, write helper, orphaned refs  |
| R3        | 2026-02-17 | SonarCloud+Qodo+User | 11     | 11     | 0        | CC 16>15, i assignment, symlink order, view preservation   |
| R4        | 2026-02-17 | SonarCloud+Qodo      | 11     | 8      | 3        | Hard-coded path, merged defaults, unknown args, negated    |
| R5        | 2026-02-17 | Qodo                 | 9      | 6      | 3        | TOCTOU file path, CWD resolve, trailing slash, assignedIds |
| **Total** |            |                      | **53** | **46** | **6**    |                                                            |

**Note:** R1 has no learnings log entry (predates numbering). Data from commit
a5e6d28.

#### Ping-Pong Chains

##### Chain 1: normalizeFilePath Progressive Hardening (R3->R4->R5 = 3 rounds)

| Round | What Happened                                                                                                                        | Files Affected    | Root Cause                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------- | --------------------------- |
| R3    | Added `normalizeFilePath()` with hard-coded string `"home/user/sonash-v0/"`                                                          | generate-views.js | Initial implementation      |
| R4    | Qodo flagged hard-coded prefix. Changed to `path.resolve(__dirname, "../..")`. Also: `path.resolve(filePath)` resolves against CWD   | generate-views.js | Non-portable, CWD-dependent |
| R5    | Qodo flagged CWD-dependence. Changed to `path.resolve(repoRootAbs, filePath)`. Also: trailing slash stripped (`scripts/`->`scripts`) | generate-views.js | Incomplete fix from R4      |

**Avoidable rounds:** 1 (R5). If R4 had resolved against repo root AND preserved
trailing slashes in one pass, R5 would have had no normalizeFilePath items.

**Prevention:** When implementing path normalization, test with: (1) absolute
paths, (2) relative paths from different CWD, (3) directory paths with trailing
slash. A simple test matrix catches all edge cases.

##### Chain 2: --file Path Validation (R4->R5 = 2 rounds)

| Round | What Happened                                                     | Files Affected  | Root Cause                                     |
| ----- | ----------------------------------------------------------------- | --------------- | ---------------------------------------------- |
| R4    | Added `validatePathInDir` for --file arg                          | resolve-bulk.js | Initial implementation                         |
| R5    | Qodo flagged TOCTOU: validated resolved path but stored raw input | resolve-bulk.js | Incomplete fix — didn't persist resolved value |

**Avoidable rounds:** 1 (R5). If R4 had stored `resolvedFilePath` instead of
`next`, the TOCTOU gap wouldn't exist.

**Prevention:** When validating paths, always store the resolved/validated form.
Never validate one form and store another.

##### Chain 3: Unknown Arg Handling (R4->R5 = 2 rounds)

| Round | What Happened                                                | Files Affected  | Root Cause                           |
| ----- | ------------------------------------------------------------ | --------------- | ------------------------------------ |
| R4    | Added `else if (arg.startsWith("-"))` to catch unknown flags | resolve-bulk.js | Initial implementation               |
| R5    | Qodo flagged non-flag, non-DEBT args still silently ignored  | resolve-bulk.js | Incomplete — only handled `-` prefix |

**Avoidable rounds:** 1 (R5). If R4 had added a final `else` clause for ALL
unrecognized args (not just flags), R5 wouldn't flag this.

**Prevention:** When adding CLI arg validation, always include a catch-all
`else` for any unrecognized input. This is a standard pattern.

##### Chain 4: Repeat Compliance Items (R3->R4->R5 = 3 rounds, no code churn)

"Missing actor context" and "Unstructured console logs" were flagged by Qodo
Compliance in R3, R4, and R5, rejected each time with the same rationale. This
is NOT ping-pong (no code changes), but adds categorization overhead.

**Total avoidable rounds across all chains: 3** (R5 normalizeFilePath, R5
TOCTOU, R5 unknown args — all could have been resolved in R4 with more thorough
fixes)

#### Rejection Analysis

| Category                   | Count | Rounds   | Examples                                                    |
| -------------------------- | ----- | -------- | ----------------------------------------------------------- |
| Audit trail actor identity | 3     | R4,R4,R5 | "Missing actor context" — captured in resolution-log.jsonl  |
| Unstructured console logs  | 3     | R4,R4,R5 | "Use structured logging" — pre-existing pattern (DEBT-0455) |

**Rejection accuracy:** 6/6 rejections were correct (100% accuracy). Both items
are legitimate observations about pre-existing architectural patterns, but
fixing them is out of scope for this PR (tracked in DEBT-0455 for structured
logging; resolution-log.jsonl already captures actor identity for audit trail).

**Note:** The same 2 Qodo compliance items repeated in R3, R4, and R5. Unlike PR
#369 where JSONL data quality rejections added ~4-5 items of noise per round, PR
#370's rejection noise was limited to 2-3 items per round in R4-R5. This is a
significant improvement, likely because PR #370 only modified 2 script files
(not 12+ like #369).

#### Recurring Patterns (Automation Candidates)

| Pattern                      | Rounds | Also in PRs                | Already Automated?  | Recommended Action                                                     | Est. Effort |
| ---------------------------- | ------ | -------------------------- | ------------------- | ---------------------------------------------------------------------- | ----------- |
| CC >15                       | R3     | #366-#369                  | **NO (4th retro!)** | Add `complexity: [error, 15]` to eslint.config.mjs                     | ~30 min     |
| Incremental path hardening   | R3-R5  | New for path normalization | No                  | Test matrix for normalizeFilePath (abs, relative, trailing slash, CWD) | ~15 min     |
| TOCTOU validate-then-store   | R4-R5  | #368 (fd-based write)      | No                  | FIX_TEMPLATES: "Always store validated/resolved path, never raw input" | ~10 min     |
| Repeat compliance rejections | R3-R5  | #369 (JSONL quality)       | **NO (2nd retro)**  | `.qodo/suppression.yaml` for actor context + unstructured logs         | ~15 min     |

#### Previous Retro Action Item Audit

| Retro   | Recommended Action                                   | Implemented? | Impact on #370                                  |
| ------- | ---------------------------------------------------- | ------------ | ----------------------------------------------- |
| PR #367 | CC eslint complexity rule (~30 min)                  | **NOT DONE** | Caused 1 round (R3 CC 16>15)                    |
| PR #367 | Shared validate-skip-reason.js (~20 min)             | DONE         | Not relevant to #370                            |
| PR #367 | shellcheck for .husky hooks (~15 min)                | **NOT DONE** | Not relevant to #370                            |
| PR #368 | FIX_TEMPLATES Template #22 (atomic write)            | DONE         | Used in writeOutputJson (R2)                    |
| PR #368 | FIX_TEMPLATES Template #27 (fd-based write)          | DONE         | Not directly used in #370                       |
| PR #368 | Qodo suppression for SKIP_REASON (~10 min)           | **NOT DONE** | Not relevant to #370                            |
| PR #368 | CODE_PATTERNS fstatSync-after-open doc               | **NOT DONE** | Not relevant to #370                            |
| PR #369 | CC eslint complexity rule (~30 min)                  | **NOT DONE** | Same as #367 — caused 1 round                   |
| PR #369 | Qodo suppression for JSONL pipeline output (~15 min) | **NOT DONE** | Would have suppressed 2-3 repeat items in R4-R5 |
| PR #369 | FIX_TEMPLATES Template #28 (fail-closed catch)       | **NOT DONE** | Not relevant to #370                            |
| PR #369 | TDMS entries for retro action items                  | **NOT DONE** | Retro actions continue to be undone             |

**Total avoidable rounds from unimplemented retro actions: 1** (CC rule would
have caught R3's CC 16>15 pre-push). Lower impact than previous PRs because PR
#370 only touched 2 script files vs 12+ in #369.

#### Cross-PR Systemic Analysis

| PR       | Rounds | Total Items | CC Rounds   | Path/Security Rounds | Rejections | Key Issue              |
| -------- | ------ | ----------- | ----------- | -------------------- | ---------- | ---------------------- |
| #366     | 8      | ~90         | 4           | 5                    | ~20        | Symlink ping-pong      |
| #367     | 7      | ~193        | 6(deferred) | 0                    | ~24        | SKIP_REASON validation |
| #368     | 6      | ~65         | 3           | 3                    | ~15        | TOCTOU fd-based write  |
| #369     | 9      | 119         | 6           | 8                    | 41         | Both CC + symlink      |
| **#370** | **5**  | **53**      | **1**       | **3**                | **6**      | **Path normalization** |

**Trend: Significant improvement.** PR #370 is the shortest review cycle in the
last 5 PRs (5 rounds vs 6-9), with the fewest total items (53 vs 65-193), and
the lowest rejection count (6 vs 15-41).

**Reasons for improvement:**

1. **Smaller scope** — 2 script files modified vs 12+ in #369
2. **Existing hardening patterns applied** — writeOutputJson used Template #22
   from R1/R2, preventing 2-3 symlink/atomic write rounds
3. **Stable rejections** — Only 2 recurring compliance items, rejected
   consistently (no waffling that causes churn)
4. **generate-views.js preservation** — The mergeManualItems() pattern worked
   well, requiring only incremental refinements (not architectural rework)

**Persistent cross-PR patterns:**

| Pattern                         | PRs Affected | Times Recommended | Status            | Required Action                                            |
| ------------------------------- | ------------ | ----------------- | ----------------- | ---------------------------------------------------------- |
| CC lint rule                    | #366-#370    | **4x**            | Never implemented | **BLOCKING — 4 retros, ~20 avoidable rounds across 5 PRs** |
| Qodo suppression                | #369,#370    | 2x                | Never implemented | Should implement before next PR                            |
| TDMS tracking for retro actions | #369,#370    | 2x                | Never implemented | Retro recommendations decay without tracking               |
| FIX_TEMPLATES #28 (fail-closed) | #369         | 1x                | Not done          | Low urgency — only relevant to new audit scripts           |

#### Skills/Templates to Update

1. **eslint.config.mjs:** Add `complexity: ["error", 15]` rule. **4th retro
   recommending this. BLOCKING.** Estimated savings: ~20 avoidable rounds across
   5 PRs. (~30 min)

2. **FIX_TEMPLATES.md:** Add template: "Validate-then-store path pattern" — when
   validating a user-supplied path, always store the resolved/validated form,
   not the raw input. Pattern from R5 TOCTOU fix. (~10 min)

3. **pr-review SKILL.md Step 5:** Add: "When implementing path normalization,
   verify with test matrix: absolute paths, relative paths from non-repo CWD,
   directory paths with trailing slash." (~5 min)

4. **.qodo/ suppression config:** Suppress "actor context in JSON output" and
   "unstructured console logs" for scripts that already use resolution-log.jsonl
   for audit trails. (~15 min)

#### Process Improvements

1. **Path normalization needs a test matrix** — `normalizeFilePath` went through
   3 rounds (R3-R5) because edge cases (CWD independence, trailing slashes) were
   missed. When writing any path manipulation function, immediately test with:
   absolute path, relative path from different CWD, directory with trailing
   slash, empty string, non-string input. Evidence: R3-R5 chain.

2. **CLI arg validation: always include catch-all else** — The unknown arg
   handler went through 2 rounds (R4-R5) because R4 only handled `-` prefixed
   args. Standard pattern: known options -> DEBT-XXXX match -> flag check ->
   **else: error**. Evidence: R4-R5 chain.

3. **Store validated forms, not raw input** — The TOCTOU on --file path was a
   classic validate-then-use-raw pattern. After any `validatePathInDir()` or
   `path.resolve()`, store the result. Evidence: R4-R5 chain.

4. **Retro action items MUST be tracked in TDMS** — For the 4th consecutive PR,
   the CC lint rule is recommended and not implemented. The learnings log is
   clearly insufficient as a tracking mechanism. Action items need DEBT entries
   with sprint assignments. Evidence: 4 retros, 0 implementation.

#### Verdict

PR #370 had the **most efficient review cycle in the last 5 PRs** — 5 rounds
with 53 total items, compared to 9 rounds/119 items (#369), 6 rounds/65 items
(#368), 7 rounds/193 items (#367), and 8 rounds/90 items (#366). This is a clear
positive trend driven by smaller PR scope and reuse of hardening patterns from
prior rounds.

Of the 5 rounds, **R1-R3 were fully productive** (100% fix rate, genuine new
issues). **R4-R5 showed mild ping-pong** in normalizeFilePath (3 rounds) and CLI
arg validation (2 rounds), but each chain involved genuinely new edge cases
rather than the deep incremental hardening seen in #369's symlink chain.

**Approximately 1 round was avoidable** (60% of R5 items were incremental
refinements to R4 fixes). This is a significant improvement over #369's ~6
avoidable rounds.

**Single highest-impact change:** Implement the CC lint rule
(`complexity: [error, 15]` in eslint.config.mjs). This has been recommended in
**4 consecutive retros** and never implemented. While it only caused 1 avoidable
round in this PR, it has caused ~20 avoidable rounds across the last 5 PRs
cumulatively. This is the project's most persistent and expensive process gap.

**Trend comparison:** Improving. The per-round efficiency has increased (46/53 =
87% fix rate vs 78/119 = 66% in #369), rejection noise has decreased (6 vs 41),
and total cycle length has decreased (5 vs 9). If the CC lint rule is finally
implemented, the next similarly-scoped PR should achieve a 2-3 round cycle.

---

### PR #369 Retrospective (2026-02-17)

#### Review Cycle Summary

- **Rounds:** 9 (R1–R9, all on 2026-02-17)
- **Total items processed:** 119 (Fixed: 78, Rejected: 41, Deferred: 0)
- **TDMS items created:** 0
- **Review IDs:** #335 (R1) through #343 (R9)
- **Files in original PR diff:** 12 scripts across `scripts/audit/`,
  `scripts/debt/`, `scripts/check-pattern-compliance.js`
- **Review sources:** SonarCloud (CC, hotspots, code smells) + Qodo (security,
  compliance, code suggestions)

#### Per-Round Breakdown

| Round | Items | Fixed | Rejected | Key Focus Area                                          |
| ----- | ----- | ----- | -------- | ------------------------------------------------------- |
| R1    | 63    | 58    | 5        | execSync→execFileSync (CRITICAL), CC reduction          |
| R2    | 38    | 24    | 14       | CC extraction, push batching, normalizeRepoRelPath      |
| R3    | 12    | 7     | 5        | Repo containment, category mapping, date validation     |
| R4    | 12    | 6     | 6        | realpathSync, atomic write, fail-fast JSONL             |
| R5    | 12    | 7     | 5        | CC extraction, tmpFile symlink, ISO normalization       |
| R6    | 11    | 7     | 4        | CC extraction x2, wx flag, atomic writeMasterDebt       |
| R7    | 10    | 7     | 3        | CC indexByKey, ancestor symlink, fstatSync scan         |
| R8    | 13    | 8     | 5        | CC buildResults+safeRename, symlink walk, format        |
| R9    | 9     | 5     | 4        | Fail-closed guard, non-object guard, pattern recognizer |

**Observation:** R1 was the only high-volume round (63 items — 5 CRITICAL
command injection). R2 was moderate (38 items). R3-R9 were all 9-13 items each,
suggesting diminishing returns after R2.

#### Churn Analysis — Detailed Ping-Pong Chains

**Chain 1: Symlink/Security Hardening (R2→R3→R4→R5→R6→R7→R8→R9 = 8 rounds)**

This was the dominant churn driver. Each round added one layer of defense, and
the next round found a gap:

| Round | What was added                           | What the next round found missing                   |
| ----- | ---------------------------------------- | --------------------------------------------------- |
| R2    | Basic lstatSync symlink check on outputs | R3: No containment check on CLI input path          |
| R3    | `startsWith(REPO_ROOT)` containment      | R4: startsWith bypassable via symlinks→realpathSync |
| R4    | realpathSync + atomic write (tmp+rename) | R5: tmpFile itself could be pre-existing symlink    |
| R5    | lstatSync on tmpFile + Windows fallback  | R6: Should use `wx` flag instead of manual check    |
| R6    | `wx` flag, extracted guardSymlink()      | R7: Ancestor dir could be symlink (realpathSync)    |
| R7    | Ancestor containment, dir/dest fallback  | R8: walk() follows symlinks during directory scan   |
| R8    | `isSymbolicLink()` in walk()             | R9: guardSymlink catch swallows EPERM/EIO           |
| R9    | Fail-closed catch (ENOENT/ENOTDIR only)  | (resolved)                                          |

- **Root cause:** Incremental hardening — each round fixed the specific issue
  flagged without auditing all write paths holistically. The propagation check
  (SKILL.md v2.2) was added mid-cycle but not applied retroactively.
- **What should have happened:** R2 fix + `grep -rn 'writeFileSync\|renameSync'`
  across all files in scope → apply Template 27 (Secure Audit File Write) to
  every write path in one pass. This existed in FIX_TEMPLATES.md since PR #368
  but wasn't used.
- **Avoidable rounds:** R4-R9 (6 rounds) could have been resolved in R3-R4 with
  holistic write-path audit.

**Chain 2: Cognitive Complexity (R1→R2→R5→R6→R7→R8 = 6 rounds)**

SonarCloud flagged CC >15 in new/modified functions each round:

| Round | Functions flagged (CC)                                         | Extraction applied                                           |
| ----- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| R1    | Multiple main() functions (CC 20-30)                           | Some extracted, most deferred to R2                          |
| R2    | count-commits-since main(), results-index, validate-templates  | findThresholdTableStart, collectSingleSession, etc.          |
| R5    | post-audit.js main() (CC 20)                                   | validateInputPath() extracted                                |
| R6    | results-index main() (CC 17), track-resolutions main() (CC 22) | guardSymlink+atomicWrite, classifyOpenItems+applyResolutions |
| R7    | compare-audits compareFindings() (CC 17)                       | indexByKey() extracted                                       |
| R8    | count-commits main() (CC 17), writeMasterDebt (CC 20)          | buildResults+statusIcon, guardSymlink+safeRename             |

- **Root cause:** No CC lint rule exists. Functions are written, SonarCloud
  flags them post-push, extraction creates new functions that sometimes also
  exceed CC 15.
- **What should have happened:** Run
  `npx eslint --rule 'complexity: [error, 15]'` on all new files BEFORE first
  push. Every CC violation would have been caught in R1.
- **Cross-PR pattern:** This is the #1 systemic issue. PR #366 had CC in 4
  rounds. PR #367 had CC in 6 rounds (deferred). PR #368 had CC in 3 rounds. PR
  #369 had CC in 6 rounds. **The CC lint rule has been recommended in every
  retro since #367 and has never been implemented.**
- **Avoidable rounds:** R5-R8 CC items (4 rounds) would not have existed if R1
  had clean functions.

**Chain 3: check-pattern-compliance.js (R7→R8→R9 = 3 rounds)**

| Round | What changed                                | What was incomplete                                  |
| ----- | ------------------------------------------- | ---------------------------------------------------- |
| R7    | Added fstatSync forward scan                | Scanned from `backStart` not `i`, applied to all ops |
| R8    | Restricted to `hasOpenSync`, start from `i` | Didn't recognize `guardSymlink` as valid guard       |
| R9    | Added `guardSymlink` to guard patterns      | (resolved)                                           |

- **Root cause:** Pattern checker modifications were done one-at-a-time without
  enumerating all guard function names or all scan directions.
- **Avoidable rounds:** R8-R9 if R7 had added all guard names and correct scan
  bounds.

**Chain 4: intake-audit.js detectAndMapFormat (R8→R9 = 2 rounds)**

| Round | What changed                       | What was incomplete           |
| ----- | ---------------------------------- | ----------------------------- |
| R8    | Refactored to early-return pattern | No guard for non-object input |
| R9    | Added plain-object type check      | (resolved)                    |

- **Root cause:** Refactoring focused on control flow, not input validation.
- **Avoidable rounds:** R9 if R8 refactor included type guard.

#### Rejection Analysis (41 items = 34% of total)

The same JSONL data quality suggestions appeared in **every round R1-R9**:

| Rejection Category                   | Occurrences | Files Affected                     |
| ------------------------------------ | ----------- | ---------------------------------- |
| JSONL evidence schema normalization  | ~12         | normalized-all.jsonl, audits.jsonl |
| JSONL file/line field normalization  | ~8          | audits.jsonl                       |
| JSONL recommendation "" → null       | ~5          | audits.jsonl                       |
| state-manager.js CLI dedup/filtering | ~6          | state-manager.js                   |
| SonarCloud S5852 regex DoS (false +) | ~6          | count-commits-since.js             |
| SonarCloud S4036 PATH lookup         | ~2          | compare-audits.js                  |
| Other pre-existing                   | ~2          | various                            |

These are legitimate observations about pre-existing data quality, but they are
**not addressable in this PR** (the JSONL files are pipeline output, not
hand-edited). They add ~4-5 items of noise per round.

#### Previous Retro Action Items — Implementation Status

Checking what was recommended in previous PR retros and whether it was done:

| Retro   | Recommended Action                               | Status             | Impact on #369                       |
| ------- | ------------------------------------------------ | ------------------ | ------------------------------------ |
| PR #367 | CC eslint complexity rule (~30 min)              | **NOT DONE**       | Would have saved 4+ rounds           |
| PR #367 | Shared validate-skip-reason.js (~20 min)         | DONE               | Not relevant to #369                 |
| PR #367 | shellcheck for .husky hooks (~15 min)            | **NOT DONE**       | Not relevant to #369                 |
| PR #368 | FIX_TEMPLATES Template #22 (atomic write)        | DONE (Template 22) | Available but not consistently used  |
| PR #368 | FIX_TEMPLATES Template #27 (fd-based write)      | DONE (Template 27) | Available but not used for new files |
| PR #368 | Qodo suppression for SKIP_REASON (~10 min)       | **NOT DONE**       | Not relevant to #369                 |
| PR #368 | CODE_PATTERNS fstatSync-after-open doc (~10 min) | **UNKNOWN**        | fstatSync was flagged again in R7    |

**Key finding: The #1 recommended action from both PR #367 and PR #368 retros —
adding a CC complexity rule — has never been implemented. This single omission
caused 4-6 avoidable rounds in each of the last 3 PRs.**

#### Recurring Patterns (Automation Candidates)

| Pattern              | Rounds in #369 | Also in PRs    | Already Automated?   | Recommended Action                                             | Effort          |
| -------------------- | -------------- | -------------- | -------------------- | -------------------------------------------------------------- | --------------- |
| CC >15 violations    | R1,R2,R5-R8    | #366,#367,#368 | **NO** (3 retros!)   | Add `complexity: [error, 15]` to eslint.config.mjs             | ~30 min         |
| Symlink guard        | R2-R9          | #366,#368      | Partial              | guardSymlink now shared + in pattern checker. Done for this PR | Done            |
| JSONL data quality   | R1-R9 (noise)  | #366,#367,#368 | **NO**               | Add `.qodo/suppression.yaml` for pre-existing JSONL patterns   | ~15 min         |
| Atomic write         | R4-R6          | #368           | Yes (Template 22/27) | Templates exist but weren't used for new audit scripts         | ~0 (discipline) |
| Fail-closed catch    | R9             | New            | **NO**               | Add Template 28 to FIX_TEMPLATES.md                            | ~15 min         |
| Pattern checker gaps | R7-R9          | New            | **NO**               | When modifying checker, enumerate ALL guard names in one pass  | ~0 (discipline) |

#### Skills/Templates to Update

1. **eslint.config.mjs:** Add `complexity: ["error", 15]` rule. This is the
   single highest-impact automation item — recommended in 3 consecutive retros,
   never implemented. Estimated savings: 4-6 review rounds per PR. (~30 min)

2. **FIX_TEMPLATES.md:** Add Template 28: "Fail-Closed Catch Block" — only allow
   ENOENT/ENOTDIR through, treat all other errors as fatal. Pattern:

   ```javascript
   } catch (err) {
     const code = err && typeof err === "object" ? err.code : null;
     if (code === "ENOENT" || code === "ENOTDIR") return;
     const msg = err instanceof Error ? err.message : String(err);
     console.error(`Error: ${msg}`);
     process.exit(1);
   }
   ```

   (~15 min)

3. **pr-review SKILL.md Step 0.5:** Add: "Run
   `npx eslint --rule 'complexity: [error, 15]'` on all new/modified .js files
   before first push." This catches CC before SonarCloud sees it. (~5 min)

4. **CODE_PATTERNS.md:** Add `guardSymlink` to the "recognized symlink guard
   patterns" list alongside `isSafeToWrite` and `isSymbolicLink`. (~5 min)

5. **.qodo/ suppression config:** Suppress JSONL data quality patterns (evidence
   schema, file/line normalization, recommendation null) for pipeline output
   files. Would eliminate ~4 rejected items per round. (~15 min)

#### Process Improvements

1. **IMPLEMENT THE CC RULE** — This has been recommended in 3 consecutive retros
   (#367, #368, #369) and never done. Each time it's listed as "~30 min" and
   each time it would have saved 4-6 review rounds. The cumulative cost of NOT
   implementing it across PRs #366-#369 is approximately **18 avoidable review
   rounds** of CC-related fixes. This is no longer a "nice to have" — it's the
   single biggest source of review churn in the project.

2. **Use FIX_TEMPLATES for new files** — Templates 22 and 27 exist (atomic
   write, fd-based write) but were not applied when writing the original audit
   scripts. The scripts were written with raw `writeFileSync` and then hardened
   over 8 rounds. When writing NEW scripts that do file I/O, check FIX_TEMPLATES
   FIRST and use the established pattern from the start.

3. **Holistic security audit on first flag** — The propagation check (SKILL.md
   v2.2) was added mid-cycle but never applied retroactively. When a security
   pattern is first flagged (R2 in this case), immediately:

   ```bash
   grep -rn 'writeFileSync\|renameSync\|appendFileSync' scripts/ --include="*.js"
   ```

   and fix ALL instances, not just the flagged one. Evidence: 6 avoidable rounds
   (R4-R9) from incremental hardening.

4. **Suppress recurring rejections** — 34% of all items processed (41/119) were
   pre-existing JSONL data quality rejections that appeared in every round. This
   wastes time categorizing, documenting, and rejecting the same items 9 times.
   A Qodo suppression config or comment would eliminate this noise entirely.

5. **Complete pattern checker modifications in one pass** — When adding a new
   guard pattern to check-pattern-compliance.js, enumerate ALL recognized guard
   function names AND scan directions (forward + backward) before committing.
   Evidence: 3 rounds (R7-R9) of incremental pattern checker fixes.

#### Cross-PR Systemic Analysis

Comparing the last 4 PR review cycles:

| PR   | Rounds | Total Items | CC Rounds   | Symlink Rounds | JSONL Rejections | Key Issue              |
| ---- | ------ | ----------- | ----------- | -------------- | ---------------- | ---------------------- |
| #366 | 8      | ~90         | 4           | 5              | ~20              | Symlink ping-pong      |
| #367 | 7      | ~193        | 6(deferred) | 0              | ~24              | SKIP_REASON validation |
| #368 | 6      | ~65         | 3           | 3              | ~15              | TOCTOU fd-based write  |
| #369 | 9      | 119         | 6           | 8              | 41               | Both CC + symlink      |

**Systemic patterns visible across all 4 PRs:**

1. **CC is the #1 cross-PR churn driver** — Appeared in every PR, consuming 19+
   rounds total across the 4 PRs. A lint rule would have prevented nearly all of
   them.

2. **Symlink/security hardening is the #2 driver** — PR #366 pioneered the
   patterns, #368 refined with fd-based writes, #369 re-learned the same lessons
   on new files. The templates (22, 27) exist but aren't used proactively.

3. **JSONL data quality is persistent noise** — ~100 rejected items across 4
   PRs, all the same patterns (evidence schema, file normalization). Never
   suppressed, never fixed (because they're pipeline output), just rejected
   every round.

4. **Retro action items are not being implemented** — The CC rule has been
   recommended 3 times. Qodo suppression has been recommended 2 times. Neither
   has been done. This suggests retro action items need a tracking mechanism
   (e.g., TDMS entries or sprint tasks) rather than just documenting them in the
   learnings log.

#### Verdict

The review cycle was **significantly longer than necessary** — 9 rounds where
3-4 would have sufficed with existing tooling. This is the 4th consecutive PR
with the same root causes (CC violations, incremental security hardening, JSONL
rejection noise). The retro process itself is failing — action items are
documented but never executed.

**Three concrete actions that would have the most impact:**

1. **Add `complexity: [error, 15]` to eslint.config.mjs** (~30 min). This is the
   single highest-ROI change. It has been recommended in 3 retros and would have
   saved ~18 rounds across the last 4 PRs.

2. **Create TDMS entries for retro action items** — Stop relying on the
   learnings log to drive implementation. Create DEBT entries with owners and
   sprint assignments so they actually get done.

3. **Add Qodo suppression for JSONL pipeline output** (~15 min). Eliminates ~34%
   of all review items as noise.

---

### PR #368 Retrospective (2026-02-16)

#### Review Cycle Summary

- **Rounds:** 6 (R1 through R6, all on 2026-02-16)
- **Total items processed:** ~65 (Fixed: ~50, Rejected: ~15, Deferred: 0)
- **TDMS items created:** 0
- **Key files:** `check-triggers.js` (+93 lines), `validate-skip-reason.js`
  (+35/-20), `run-alerts.js` (+20), `SKILL.md` (+27), `.husky/pre-commit`
  (+13/-13), `FIX_TEMPLATES.md` (+13/-13)

#### Churn Analysis

- **R1->R2: Symlink guard incomplete** (ping-pong)
  - R1 added realpathSync on logDir; R2 Qodo flagged logPath itself could be a
    symlink
  - **Root cause:** Partial fix — checked directory but not file
  - **Prevention:** Checklist: "symlink guards must cover both directory AND
    file targets"

- **R2->R3: Symlink still incomplete + shell:true recurring** (ping-pong)
  - R2 added lstatSync on file; R3 Qodo flagged ancestor directory + shell:true
    again
  - **Root cause:** shell:true was "explained away" with comments in R1-R2
    instead of eliminated
  - **Prevention:** "Explain-away" is not a fix. Eliminate the attack surface
    (`.cmd` suffix approach)

- **R3->R4: DoS in validation + TOCTOU in file creation** (ping-pong)
  - R3 added validateSkipReason but length check was after char iteration
  - **Root cause:** Validation order wasn't optimized (cheap checks first)
  - **Prevention:** Input validation template:
    type→trim→empty→length→format→encoding (Step 5.7)

- **R4->R5: TOCTOU in file creation race** (ping-pong)
  - R4 added explicit file permissions but via separate existsSync +
    openSync("wx") + appendFileSync
  - **Root cause:** Three separate fs calls = TOCTOU window
  - **Prevention:** Atomic fd-based pattern: openSync("a") + fchmodSync +
    writeSync + closeSync

- **R5->R6: fstatSync gap in fd-based write** (ping-pong)
  - R5 introduced fd-based write but didn't verify fd points to regular file
  - **Root cause:** Incremental hardening — each round fixed one layer but not
    the next
  - **Prevention:** FIX_TEMPLATES.md template for "secure file write" covering
    the full chain

- **SKIP_REASON persistence: rejected consistently R3-R6** (NOT ping-pong)
  - Qodo compliance re-flagged this every round; rejected each time with same
    justification
  - This is correct behavior — consistent rejection prevents churn

#### Recurring Patterns (Automation Candidates)

| Pattern                           | Rounds      | Already Automated?                 | Recommended Action                                                                                   |
| --------------------------------- | ----------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Symlink guard completeness        | R1,R2,R3    | Partial (check-pattern-compliance) | Add rule: `writeFileSync\|appendFileSync\|openSync` must have both dir+file symlink checks (~30 min) |
| TOCTOU file write                 | R4,R5,R6    | No                                 | Add FIX_TEMPLATES.md template #22: "Secure Audit File Write" with full fd-based pattern (~15 min)    |
| SKIP_REASON persistence rejection | R3,R4,R5,R6 | No                                 | Add Qodo suppression rule for "sensitive log persistence" on `override-log.jsonl` (~10 min)          |
| shell:true elimination            | R1,R2,R3    | No (fixed at source)               | Fixed permanently in R3 via .cmd suffix — no automation needed                                       |
| Validation order (cheap first)    | R3,R4       | No                                 | Already codified in Step 5.7 of pr-review SKILL.md                                                   |

#### Skills/Templates to Update

- **FIX_TEMPLATES.md:** Add Template #22 "Secure Audit File Write" — the full
  fd-based write pattern (openSync→fstatSync→fchmodSync→writeSync→closeSync)
  used in R5+R6. Would have saved 2 rounds (~15 min effort).
- **pr-review SKILL.md:** The Step 5.7 input validation chain (added from PR
  #367 retro) worked — R4 was the only validation-order issue. No update needed.
- **CODE_PATTERNS.md:** Document fstatSync-after-open as mandatory for
  security-sensitive writes (~10 min effort).

#### Process Improvements

1. **"Full chain" security fixes, not incremental** — R1-R6 each fixed one layer
   of the symlink/TOCTOU defense (dir check → file check → realpath →
   permissions → fd-based → fstatSync). A single comprehensive fix using
   FIX_TEMPLATES would have resolved this in R1-R2. Evidence: 4 rounds of TOCTOU
   ping-pong (R3-R6).
2. **Consistent rejection prevents churn** — SKIP_REASON persistence was
   rejected identically in R3-R6 with the same justification. This is working
   correctly — the reviewer re-flags it each round, we reject it each round, no
   code changes. Evidence: 0 wasted commits from this pattern.
3. **Eliminate, don't explain** — shell:true persisted R1-R3 because the "fix"
   was adding comments. The R3 `.cmd` suffix approach eliminated the risk
   entirely. Rule: if a reviewer keeps flagging the same thing despite your
   comments, eliminate the surface area instead.

#### Verdict

The review cycle was **moderately inefficient** — 6 rounds where 3 would have
sufficed. The core issue was **incremental security hardening** instead of
applying the full defense-in-depth pattern upfront. Rounds R1-R2 were productive
(adding new functionality). Rounds R3-R6 were progressive layering of the same
symlink/TOCTOU fix that could have been done once with a complete template.

**Highest-impact change:** Create FIX_TEMPLATES.md Template #22 ("Secure Audit
File Write") with the full fd-based chain. This single template would have
prevented R4-R6 entirely, saving ~3 review rounds.

---

### PR #367 Retrospective (2026-02-16)

**Rounds:** 7 (R1-R7, all same day) | **Items:** 193 total appearances, ~100
unique | **Fixed:** 100 | **Deferred:** 6 CC (pre-existing) | **Rejected:** ~24

**Ping-pong chains (3-4 avoidable rounds):**

- **SKIP_REASON validation** (R4-R7): 4 rounds of progressive hardening
  (newlines, propagation to JS, control chars, codePointAt). Should have been
  one comprehensive pass. **Fix:** Extract to shared
  `scripts/lib/validate-skip-reason.js`.
- **POSIX portability** (R4-R6): `grep -P` then `$'\r'` then `printf '\r'`. Each
  fix used a still-non-POSIX construct. **Fix:** Add `shellcheck` to pre-commit.
- **suppressAll edge cases** (R5-R7): Type guard then explicit flag then
  category requirement. 3 rounds for one filter function. **Fix:** Unit tests
  for `filterSuppressedAlerts()`.

**Automation candidates:** CC eslint rule (~30 min), shared validateSkipReason
(~20 min), shellcheck for hooks (~15 min), suppress SonarCloud S7741 Math.max
(~5 min).

**Verdict:** R1-R3 productive. R4-R7 were progressive hardening ping-pong.
Highest-impact fix: shared SKIP_REASON validator + filterSuppressedAlerts tests
would have saved 3 rounds.

---

### PR #371 Retrospective (2026-02-17)

#### Review Cycle Summary

| Metric         | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| Rounds         | 2 (R1 2026-02-17, R2 2026-02-17)                              |
| Total items    | 45 (34 R1 + 11 R2)                                            |
| Fixed          | 38                                                            |
| Deferred       | 0                                                             |
| Rejected       | 7 (3 R1 + 4 R2)                                               |
| Review sources | SonarCloud (hotspots + issues), Qodo Compliance + Suggestions |

#### Per-Round Breakdown

| Round     | Date       | Source                      | Items  | Fixed  | Rejected | Key Patterns                                                    |
| --------- | ---------- | --------------------------- | ------ | ------ | -------- | --------------------------------------------------------------- |
| R1        | 2026-02-17 | SonarCloud (22) + Qodo (12) | 34     | 31     | 3        | S5852 regex DoS (10), CC >15 (12), atomic write, symlink guards |
| R2        | 2026-02-17 | SonarCloud (7) + Qodo (4)   | 11     | 7      | 4        | CC extraction (2), options object, for-of, negated condition    |
| **Total** |            |                             | **45** | **38** | **7**    |                                                                 |

#### Ping-Pong Chains

##### Chain 1: Cognitive Complexity Extraction (R1→R2 = 2 rounds)

| Round | What Happened                                                                                           | Files Affected                 | Root Cause                                     |
| ----- | ------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------- |
| R1    | Flagged 12 CC >15 functions. Extracted ~15 helpers. Two new helpers still had CC 33 and CC 17.          | sync-reviews, promote, archive | Extraction didn't verify helpers stayed <CC 15 |
| R2    | SonarCloud flagged `parseSeverityCount` CC 33 and `parseRetrospectives` CC 17. Extracted 5 sub-helpers. | sync-reviews-to-jsonl.js       | Helpers inherited CC from parent functions     |

**Avoidable rounds:** 0.5 (partial — R2 also had 5 unrelated items)
**Prevention:** After extracting helpers, run
`npx eslint --rule 'complexity: [error, 15]'` on modified files.

##### Chain 2: executeArchival Parameter Count (R1→R2 = 2 rounds)

| Round | What Happened                                                         | Files Affected     | Root Cause                         |
| ----- | --------------------------------------------------------------------- | ------------------ | ---------------------------------- |
| R1    | Extracted `executeArchival` from `main()` with 10 individual params   | archive-reviews.js | Focused on CC, not API design      |
| R2    | SonarCloud: "Too many parameters (10). Max 7." Refactored to options. | archive-reviews.js | R1 didn't consider parameter count |

**Avoidable rounds:** 0.5 (partial) **Prevention:** Use options object pattern
when extracting with 7+ params.

**Total avoidable rounds across all chains: ~1**

#### Rejection Analysis

| Category                  | Count | Rounds | Examples                                                            |
| ------------------------- | ----- | ------ | ------------------------------------------------------------------- |
| Unstructured logging      | 2     | R1, R2 | "Use structured JSON logs" — CLI dev tool by design                 |
| No audit trail            | 2     | R1, R2 | "Log actor identity" — local dev script                             |
| Silent JSONL parse errors | 2     | R1, R2 | "Swallowed catch blocks" — intentional tolerance for JSONL          |
| Absolute path leakage     | 1     | R2     | "Paths in DEBT table" — pre-existing in TDMS data, not from this PR |

**Rejection accuracy:** 7/7 correct (100%). 4 of 7 R2 rejections were exact
repeats from R1 despite `.qodo/pr-agent.toml` suppression config.

#### Recurring Patterns (Automation Candidates)

| Pattern                      | Rounds | Also in PRs | Already Automated? | Recommended Action                                         | Est. Effort |
| ---------------------------- | ------ | ----------- | ------------------ | ---------------------------------------------------------- | ----------- |
| CC >15 violations            | R1, R2 | #366-#370   | Yes (warn)         | Upgrade `complexity` from `warn` to `error`                | ~5 min      |
| S5852 Regex DoS false pos.   | R1     | #369        | No (resolved)      | String parsing eliminates pattern. Done.                   | Done        |
| Repeat Qodo Compliance       | R1, R2 | #367-#370   | Partial (pr-agent) | Investigate suppression config format for Compliance rules | ~15 min     |
| Options object for 7+ params | R2     | New         | No                 | Add to FIX_TEMPLATES extraction guidelines                 | ~10 min     |

#### Previous Retro Action Item Audit

| Retro   | Recommended Action                     | Implemented?            | Impact on #371                                     |
| ------- | -------------------------------------- | ----------------------- | -------------------------------------------------- |
| PR #367 | CC eslint complexity rule              | **YES (warn)**          | Caught as warnings but didn't block push           |
| PR #368 | FIX_TEMPLATES #22 (atomic write)       | DONE                    | Applied consistently in R1                         |
| PR #368 | Qodo suppression for recurring items   | **YES but ineffective** | Same compliance items appeared in both rounds      |
| PR #369 | FIX_TEMPLATES #28 (fail-closed catch)  | DONE                    | Not needed in #371                                 |
| PR #369 | TDMS entries for retro action items    | DONE                    | Working — action items tracked                     |
| PR #370 | CC eslint as error (upgrade from warn) | **NOT DONE**            | CC violations reached SonarCloud despite warn rule |
| PR #370 | Qodo suppression for actor/logs items  | Partial                 | Still appearing                                    |

**Total avoidable rounds from unimplemented retro actions: ~0.5** (CC error rule
would have caught R2 CC items pre-push)

#### Cross-PR Systemic Analysis

| PR       | Rounds | Total Items | CC Rounds   | Security Rounds | Rejections | Key Issue               |
| -------- | ------ | ----------- | ----------- | --------------- | ---------- | ----------------------- |
| #366     | 8      | ~90         | 4           | 5               | ~20        | Symlink ping-pong       |
| #367     | 7      | ~193        | 6(deferred) | 0               | ~24        | SKIP_REASON validation  |
| #368     | 6      | ~65         | 3           | 3               | ~15        | TOCTOU fd-based write   |
| #369     | 9      | 119         | 6           | 8               | 41         | Both CC + symlink       |
| #370     | 5      | 53          | 1           | 3               | 6          | Path normalization      |
| **#371** | **2**  | **45**      | **2**       | **0**           | **7**      | **CC extraction+S5852** |

**Persistent cross-PR patterns:**

| Pattern          | PRs Affected | Times Recommended | Status                       | Required Action                                       |
| ---------------- | ------------ | ----------------- | ---------------------------- | ----------------------------------------------------- |
| CC lint rule     | #366-#371    | 5x (warn since)   | Partially implemented        | Upgrade to `error` — warn doesn't block pushes        |
| Qodo suppression | #369-#371    | 3x                | Implemented, **ineffective** | Investigate pr-agent.toml format for Compliance rules |
| TDMS for retros  | #369-#370    | 2x                | **DONE**                     | Resolved                                              |

#### Skills/Templates to Update

1. **eslint.config.mjs:** Upgrade `complexity` from `["warn", 15]` to
   `["error", 15]`. Warnings don't block commits/pushes. (~5 min)
2. **.qodo/pr-agent.toml:** Investigate why repeat compliance items are not
   suppressed. May need compliance-specific rules vs suggestion rules. (~15 min)
3. **FIX_TEMPLATES.md:** Add extraction guideline: "Use options object for 7+
   params. Verify extracted helpers stay under CC 15." (~10 min)

#### Process Improvements

1. **Post-extraction CC verification** — After extracting helpers to reduce CC,
   run the CC check on new helpers too. R1 extracted ~15 helpers without
   checking, creating 2 CC violations caught in R2. Evidence: R1→R2 CC chain.
2. **Upgrade CC rule to error** — `warn` was a good first step but doesn't
   prevent CI churn. Evidence: R2 CC items despite warn rule.
3. **Fix Qodo suppression** — `.qodo/pr-agent.toml` did not suppress the 4
   repeat items in R2. Needs investigation. Evidence: identical R1+R2
   rejections.

#### Verdict

PR #371 had the **most efficient review cycle in the last 6 PRs** — just 2
rounds to resolve 45 items (38 fixed, 7 rejected, 84% fix rate). This is a 60%
reduction from #370 (5 rounds) and 78% from #369 (9 rounds).

Approximately **0.5-1 round was avoidable**. The R2 items split between CC
violations in extracted helpers (preventable with post-extraction check) and
genuinely new SonarCloud findings (for-of, negated conditions, .indexOf).

The single highest-impact change is upgrading CC from `warn` to `error` (~5
min). This blocks pushes with CC >15, preventing the helpers-exceeding-CC
pattern.

**Trend: Strongly improving.** Rounds: 9→5→2. Items: 119→53→45. Security rounds:
8→3→0. Rejections: 41→6→7. Prior retro actions (CC warn rule, atomic write
templates, TDMS tracking) are paying off. One more upgrade (CC error + Qodo
suppression fix) should enable 1-round cycles.

---

### PR #374 Retrospective (2026-02-18)

#### Review Cycle Summary

| Metric         | Value                                    |
| -------------- | ---------------------------------------- |
| Rounds         | 5 (R1-R5, 2026-02-17 through 2026-02-18) |
| Total items    | 40                                       |
| Fixed          | 29                                       |
| Deferred       | 5                                        |
| Rejected       | 5                                        |
| Review sources | Qodo Compliance + Code Suggestions, CI   |

#### Per-Round Breakdown

| Round     | Date       | Source  | Items  | Fixed  | Deferred | Rejected | Key Patterns                                                 |
| --------- | ---------- | ------- | ------ | ------ | -------- | -------- | ------------------------------------------------------------ |
| R1        | 2026-02-17 | Qodo+CI | 15     | 8      | 4        | 3        | Bidirectional containment, fail-closed guard, backupSwap     |
| R2        | 2026-02-17 | Qodo    | 3      | 3      | 0        | 0        | Path sep boundary, realpathSync on new files, evidence dedup |
| R3        | 2026-02-18 | Qodo+CI | 8      | 7      | 1        | 0        | Descendant containment, backupSwap copy, mkdirSync order     |
| R4        | 2026-02-18 | Qodo+CI | 8      | 6      | 0        | 1        | Ancestor containment restore, gitExec trim, fresh repo       |
| R5        | 2026-02-18 | Qodo    | 6      | 5      | 0        | 1        | saveJson guard bypass, NUL trim propagation, depth limit     |
| **Total** |            |         | **40** | **29** | **5**    | **5**    |                                                              |

#### Ping-Pong Chains

##### Chain 1: resolveProjectDir Containment Direction (R1->R2->R3->R4 = 4 rounds)

| Round | What Happened                                                                                        | Files Affected | Root Cause                   |
| ----- | ---------------------------------------------------------------------------------------------------- | -------------- | ---------------------------- |
| R1    | Added bidirectional containment: ancestor OR descendant of CWD allowed                               | git-utils.js   | Initial — both directions    |
| R2    | startsWith without path.sep boundary — `/repo/app` matches `/repo/app-malicious`                     | git-utils.js   | Missing boundary check       |
| R3    | Ancestor direction too permissive — allows `/`. Restricted to descendant-only                        | git-utils.js   | R1's bidirectional too loose |
| R4    | Descendant-only too restrictive — monorepo root needs ancestor. Restored bidirectional + depth limit | git-utils.js   | R3 overcorrected             |

**Avoidable rounds:** 2 (R3 + R4). If R1 had bidirectional with path.sep
boundary AND depth limit, R2 would fix boundary and R3/R4 wouldn't exist.

**Prevention:** Path containment: always (1) use path.sep boundary, (2) handle
both directions with justification, (3) add depth limits for ancestor direction.

##### Chain 2: isSafeToWrite / realpathSync Lifecycle (R1->R2->R3->R4 = 4 rounds)

| Round | What Happened                                                                         | Files Affected | Root Cause                 |
| ----- | ------------------------------------------------------------------------------------- | -------------- | -------------------------- |
| R1    | Added fail-closed fallback isSafeToWrite using realpathSync                           | state-utils.js | Initial implementation     |
| R2    | realpathSync crash on .tmp/.bak files that don't exist. Fixed: realpath parent        | state-utils.js | Non-existent file paths    |
| R3    | mkdirSync was after isSafeToWrite — parent dir may not exist yet                      | state-utils.js | Ordering dependency missed |
| R4    | Fresh repo: no .claude/state/ dir — fallback guard fails. Fixed: realpath .claude dir | state-utils.js | Fresh checkout edge case   |

**Avoidable rounds:** 2 (R3 + R4). Full lifecycle test matrix at R1/R2 would
catch mkdir ordering and fresh checkout edge cases.

**Prevention:** Filesystem guard test matrix: existing path, non-existent file,
non-existent parent, fresh checkout with no directory tree.

##### Chain 3: gitExec .trim() Propagation (R4->R5 = 2 rounds)

| Round | What Happened                                                                   | Files Affected                               | Root Cause            |
| ----- | ------------------------------------------------------------------------------- | -------------------------------------------- | --------------------- |
| R4    | Added opts.trim=false option to gitExec for NUL-delimited git output            | git-utils.js                                 | Initial — opt-in flag |
| R5    | 4 callers in other files use -z but weren't updated. Added auto-detect approach | post-read-handler.js, pre-compaction-save.js | Propagation miss      |

**Avoidable rounds:** 1 (R5). Grep for ALL git -z callers at R4 would fix all 5
callers in one pass.

##### Chain 4: backupSwap Safety (R1->R3 = 2 rounds)

| Round | What Happened                                                                            | Files Affected | Root Cause                    |
| ----- | ---------------------------------------------------------------------------------------- | -------------- | ----------------------------- |
| R1    | Added restore-on-failure logic using renameSync in catch                                 | state-utils.js | Initial fix                   |
| R3    | renameSync(file, bak) failure → silentRm(file) deletes original. Changed to copyFileSync | state-utils.js | Catch path had data-loss risk |

**Avoidable rounds:** 1 (R3). Use copyFileSync from the start per FIX_TEMPLATES
#22.

**Total avoidable rounds across all chains: ~6 items, ~2 full rounds avoidable
(R3 and R5 were predominantly incremental refinements)**

#### Rejection Analysis

| Category                    | Count | Rounds | Examples                                                             |
| --------------------------- | ----- | ------ | -------------------------------------------------------------------- |
| Threat model mismatch       | 2     | R4, R5 | "CLAUDE_PROJECT_DIR attacker-controlled" — env set by Claude runtime |
| Seed data PII               | 1     | R4     | "Public business listings" — not PII                                 |
| Pre-existing/not applicable | 2     | R1     | Already handled upstream or not applicable to this context           |

**Rejection accuracy:** 5/5 rejections were correct (100% accuracy).

#### Recurring Patterns (Automation Candidates)

| Pattern                            | Rounds | Also in PRs        | Already Automated? | Recommended Action                                              | Est. Effort |
| ---------------------------------- | ------ | ------------------ | ------------------ | --------------------------------------------------------------- | ----------- |
| Path containment direction         | R1-R4  | New                | No                 | Add pre-implementation decision checklist to pr-review Step 0.5 | ~10 min     |
| realpathSync on non-existent paths | R1-R4  | #370 (path norm)   | No                 | FIX_TEMPLATES: "realpathSync lifecycle" template                | ~15 min     |
| Propagation miss on shared utils   | R4-R5  | #366, #367         | Partial (Step 5.6) | Enforcement gap — consider auto-remind                          | ~0 min      |
| Fallback bypasses safety guard     | R1, R5 | #369 (fail-closed) | No                 | FIX_TEMPLATES: "Hoist safety flag to function scope"            | ~10 min     |

#### Previous Retro Action Item Audit

| Retro   | Recommended Action                      | Implemented?            | Impact on #374                                 |
| ------- | --------------------------------------- | ----------------------- | ---------------------------------------------- |
| PR #370 | CC eslint as error                      | **YES** (pre-commit)    | 0 CC rounds — fully resolved                   |
| PR #370 | Qodo suppression for actor/logs         | **YES** (pr-agent.toml) | 0 repeat compliance rejections                 |
| PR #370 | Path normalization test matrix          | **NOT DONE**            | realpathSync chain R1-R4 (~2 avoidable rounds) |
| PR #370 | FIX_TEMPLATES #29 (validate-then-store) | DONE                    | Applied correctly                              |
| PR #371 | CC from warn to error                   | **YES** (pre-commit)    | 0 CC rounds — success                          |
| PR #371 | Qodo suppression for compliance rules   | **DONE**                | No repeat compliance rejections                |
| PR #371 | FIX_TEMPLATES extraction guidelines     | DONE                    | Not directly relevant                          |

**Total avoidable rounds from unimplemented retro actions: ~2** (Path test
matrix from #370 would have prevented realpathSync lifecycle chain R3-R4)

#### Cross-PR Systemic Analysis

| PR       | Rounds | Total Items | CC Rounds | Security Rounds | Rejections | Key Issue              |
| -------- | ------ | ----------- | --------- | --------------- | ---------- | ---------------------- |
| #366     | 8      | ~90         | 4         | 5               | ~20        | Symlink ping-pong      |
| #367     | 7      | ~193        | 6         | 0               | ~24        | SKIP_REASON validation |
| #368     | 6      | ~65         | 3         | 3               | ~15        | TOCTOU fd-based write  |
| #369     | 9      | 119         | 6         | 8               | 41         | Both CC + symlink      |
| #370     | 5      | 53          | 1         | 3               | 6          | Path normalization     |
| #371     | 2      | 45          | 2         | 0               | 7          | CC extraction+S5852    |
| **#374** | **5**  | **40**      | **0**     | **5**           | **5**      | **Path containment**   |

**Persistent cross-PR patterns:**

| Pattern                        | PRs Affected | Times Recommended | Status                          | Required Action                                    |
| ------------------------------ | ------------ | ----------------- | ------------------------------- | -------------------------------------------------- |
| CC lint rule                   | #366-#371    | 5x                | **RESOLVED** (pre-commit error) | None — 0 CC rounds in #374                         |
| Qodo suppression               | #369-#371    | 3x                | **RESOLVED** (pr-agent.toml)    | None — 0 repeat compliance in #374                 |
| Incremental security hardening | #366-#374    | 4x                | Improved but recurring          | Pre-implementation test matrix for guard functions |
| Propagation check              | #366-#374    | 3x                | Documented in Step 5.6          | Enforcement gap — still missed R4->R5              |

#### Skills/Templates to Update

1. **FIX_TEMPLATES.md:** Add "realpathSync lifecycle" template — handle:
   existing path, non-existent file, non-existent parent, fresh checkout. (~15
   min)
2. **FIX_TEMPLATES.md:** Add "Hoist safety flag to function scope" — when
   try/catch has a fallback write path, hoist the safety check result to a
   variable accessible in the catch block. (~10 min)
3. **pr-review SKILL.md Step 0.5:** Add filesystem guard pre-push check: verify
   guard functions with test matrix (existing path, non-existent file,
   non-existent parent, fresh checkout). (~5 min)

#### Process Improvements

1. **Path containment decisions need upfront design** — Containment direction
   flipped 3 times across R1-R4. Document required directions with justification
   BEFORE writing code. Evidence: R1-R4 containment chain.
2. **Filesystem guard test matrix at implementation time** — isSafeToWrite
   failed in 4 different ways across 4 rounds. A 4-row test matrix would have
   prevented 2 rounds. Evidence: R1-R4 realpathSync chain.
3. **Propagation check enforcement** — Despite Step 5.6 documenting the
   propagation pattern, R4->R5 missed 4 git -z callers. Consider auto-remind
   after shared utility modifications. Evidence: R4->R5 trim chain.

#### Verdict

PR #374 had a **moderate review cycle** — 5 rounds with 40 items (29 fixed, 5
deferred, 5 rejected). This matches PR #370's round count but with fewer total
items (40 vs 53) and fewer rejections (5 vs 6).

**~2 rounds were fully avoidable** (R3 and R5 were predominantly incremental
refinements of previous fixes). R1-R2 were productive, R4 had a mix of genuine
and avoidable items.

The **single highest-impact change** is implementing a filesystem guard test
matrix (test with non-existent files, non-existent parents, fresh checkouts).
This would have prevented the 4-round isSafeToWrite chain.

**Key milestone:** The two most persistent cross-PR patterns (CC lint rule: 5
retros, Qodo suppression: 3 retros) are now **fully resolved**. PR #374 had 0 CC
rounds and 0 repeat compliance rejections — validating the retro-driven
improvement cycle. Security/filesystem hardening remains the dominant churn
driver, suggesting a new pre-implementation checklist for hook infrastructure
changes.

**Trend:** CC rounds: 6→1→2→0 (resolved). Rejections: 41→6→7→5 (stable low).
Security rounds: 8→3→0→5 (spiked due to new containment logic). Total: improving
overall with resolved systemic patterns, but hook infrastructure PRs remain
inherently security-heavy.

---

### PR #382 Retrospective (2026-02-20)

#### Review Cycle Summary

| Metric         | Value                                             |
| -------------- | ------------------------------------------------- |
| Rounds         | 3 (R1-R3, all 2026-02-20)                         |
| Total items    | 76 raw (61 unique actionable)                     |
| Fixed          | 61                                                |
| Deferred       | 0                                                 |
| Rejected       | 13 (compliance not-applicable for offline CLI)    |
| Flagged        | 3 (architectural — to user)                       |
| Review sources | SonarCloud, Gemini Code Assist, Qodo, CI/Prettier |

#### Per-Round Breakdown

| Round     | Date       | Source                 | Items  | Fixed  | Rejected | Key Patterns                                                    |
| --------- | ---------- | ---------------------- | ------ | ------ | -------- | --------------------------------------------------------------- |
| R1        | 2026-02-20 | SonarCloud+Gemini+Qodo | 49     | 42     | 4        | regex DoS, severity mapping bug, table parsing, dedup key       |
| R2        | 2026-02-20 | SonarCloud+CI+Qodo     | 16     | 14     | 4        | 2nd regex DoS (two-strikes), CC 19>15, severity split, H1 guard |
| R3        | 2026-02-20 | SonarCloud+Qodo        | 11     | 5      | 5        | cross-report dedup, milestone reset, severity case-insensitive  |
| **Total** |            |                        | **76** | **61** | **13**   |                                                                 |

#### Ping-Pong Chains

##### Chain 1: Severity Mapping Incremental Hardening (R1→R2→R3 = 3 rounds)

| Round | What Happened                                                         | Files Affected           | Root Cause                  |
| ----- | --------------------------------------------------------------------- | ------------------------ | --------------------------- |
| R1    | Fixed critical→S0 (was S1), high→S1 (was S2). Left medium+low as S3   | extract-audit-reports.js | Partial fix — only top 2    |
| R2    | medium→S3 should be S2, low→S3 is correct. Added `\b` word boundaries | extract-audit-reports.js | R1 didn't review all levels |
| R3    | Case-insensitive: `S[0-3]` missed lowercase `s0` in source docs       | extract-roadmap-debt.js  | R1/R2 only fixed one file   |

**Avoidable rounds:** 1 (R3). If R1 had done a complete severity audit across
both files — all levels (S0-S3), word boundaries, case sensitivity — R2 and R3
severity items would have been caught in R1. R2's medium/S2 split was a genuine
oversight, but R3's case-insensitive fix in the _other_ file was a propagation
miss.

**Prevention:** When fixing severity/priority mapping, audit ALL levels and ALL
files that contain similar mapping logic in one pass.

##### Chain 2: Dedup Logic Incremental Hardening (R1→R2→R3 = 3 rounds)

| Round | What Happened                                                             | Files Affected           | Root Cause                      |
| ----- | ------------------------------------------------------------------------- | ------------------------ | ------------------------------- |
| R1    | Added file+line to dedup key (was title-only). Cross-MASTER dedup existed | extract-audit-reports.js | Initial — improved key quality  |
| R2    | Within-run dedup: same entry could appear twice in single run             | extract-roadmap-debt.js  | No seenRunHashes set            |
| R3    | Cross-report dedup: existingHashes not updated during report loop         | extract-audit-reports.js | Hash set not maintained in loop |

**Avoidable rounds:** 1 (R3). If R1 had designed the full dedup algorithm
upfront — enumerate all dedup boundaries (cross-MASTER, within-run,
cross-report) — R2 and R3 dedup items would have been caught. This is a minor
instance of Pattern 8 (incremental algorithm hardening).

**Prevention:** Algorithm Design Pre-Check (pr-review Step 0.5) — when
implementing dedup logic, enumerate ALL dedup boundaries before coding.

##### Chain 3: Regex DoS Two-Strikes (R1→R2 = 2 rounds)

| Round | What Happened                                                            | Files Affected           | Root Cause               |
| ----- | ------------------------------------------------------------------------ | ------------------------ | ------------------------ |
| R1    | `matchNumberedHeading` regex flagged S5852. Replaced with string parsing | extract-audit-reports.js | SonarCloud DoS detection |
| R2    | `isTableHeaderLine` regex flagged S5852. Same rule, different function   | extract-audit-reports.js | 2nd DoS regex in file    |

**Avoidable rounds:** 0.5 (partial). R1 could have grepped for all potentially
DoS-vulnerable regexes in the file after fixing the first one. However, this was
partially a SonarCloud scanning limitation (only one finding per rule per scan
sometimes).

**Prevention:** After fixing a SonarCloud rule violation, grep the file for all
similar patterns: `grep -n 'regex.*[+*].*[+*]' file.js` for nested quantifiers.

**Total avoidable rounds across all chains: ~2.5 (roughly 1 full round)**

#### Rejection Analysis

| Category                     | Count | Rounds   | Examples                                                          |
| ---------------------------- | ----- | -------- | ----------------------------------------------------------------- |
| Compliance: audit trails     | 3     | R1,R2,R3 | "No durable audit record" — offline CLI script, not a service     |
| Compliance: secure logging   | 3     | R1,R2,R3 | "Unstructured console logs" — CLI tool output                     |
| Compliance: input validation | 3     | R1,R2,R3 | "Weak input validation on extractFilePath" — repo-internal files  |
| Compliance: error handling   | 3     | R1,R2,R3 | "Swallowed exceptions" — intentional for JSONL partial-file parse |
| Compliance: secure errors    | 1     | R3       | "Raw error details in readRoadmapLines" — CLI exits on error      |

**Rejection accuracy:** 13/13 rejections were correct (100% accuracy). All were
compliance rules not applicable to offline CLI scripts processing trusted repo
files.

#### Recurring Patterns (Automation Candidates)

| Pattern                        | Rounds   | Already Automated?      | Recommended Action                                        | Est. Effort |
| ------------------------------ | -------- | ----------------------- | --------------------------------------------------------- | ----------- |
| Compliance noise (offline CLI) | R1,R2,R3 | Partial (pr-agent.toml) | Add `scripts/debt/` to Qodo compliance exclusions         | ~5 min      |
| replaceAll conversion          | R1,R2,R3 | No                      | Already enforced by SonarCloud — just be thorough in R1   | ~0 min      |
| Severity mapping completeness  | R1,R2,R3 | No                      | Add to CODE_PATTERNS: "audit all severity levels at once" | ~5 min      |

#### Previous Retro Action Item Audit

| Retro   | Recommended Action                             | Implemented?            | Impact on #382                                  |
| ------- | ---------------------------------------------- | ----------------------- | ----------------------------------------------- |
| PR #379 | Algorithm Design Pre-Check (Step 0.5)          | **YES**                 | Triggered for dedup logic but not fully applied |
| PR #379 | FIX_TEMPLATES #34 (evidence merge)             | **YES**                 | Not directly relevant (different algorithm)     |
| PR #379 | Propagation enforcement                        | **NOT DONE** (6th time) | Severity case-insensitive missed (R2→R3)        |
| PR #379 | Patterns:check in Step 5.4                     | **YES**                 | Caught 0 issues — validation only               |
| PR #374 | FIX_TEMPLATES: realpathSync lifecycle (#31)    | **YES**                 | Not relevant                                    |
| PR #374 | pr-review Step 0.5: filesystem guard pre-check | **YES**                 | Not triggered (no guard functions)              |

**Total avoidable rounds from unimplemented retro actions: ~0.5** (Propagation
enforcement would have caught severity case-insensitive fix across both files)

#### Cross-PR Systemic Analysis

| PR       | Rounds | Total Items | Avoidable Rounds | Rejections | Key Issue                      |
| -------- | ------ | ----------- | ---------------- | ---------- | ------------------------------ |
| #366     | 8      | ~90         | ~5               | ~20        | Symlink ping-pong              |
| #367     | 7      | ~193        | ~4               | ~24        | SKIP_REASON validation         |
| #368     | 6      | ~65         | ~3               | ~15        | TOCTOU fd-based write          |
| #369     | 9      | 119         | ~5               | 41         | CC + symlink combined          |
| #370     | 5      | 53          | ~2               | 6          | Path normalization             |
| #371     | 2      | 45          | ~0               | 7          | CC extraction + S5852          |
| #374     | 5      | 40          | ~2               | 5          | Path containment               |
| #379     | 11     | ~119        | ~8               | ~61        | Evidence algorithm + protocol  |
| **#382** | **3**  | **76**      | **~1**           | **13**     | **Severity/dedup incremental** |

**Persistent cross-PR patterns:**

| Pattern                         | PRs Affected | Times Recommended | Status                                     | Required Action                                               |
| ------------------------------- | ------------ | ----------------- | ------------------------------------------ | ------------------------------------------------------------- |
| CC lint rule                    | #366-#371    | 5x                | **RESOLVED** (pre-commit error since #371) | None — 0 CC rounds in #374, #379, #382                        |
| Qodo suppression                | #369-#371    | 3x                | **RESOLVED** (pr-agent.toml)               | Minor gap: `scripts/debt/` not excluded from compliance       |
| Propagation check               | #366-#382    | **6x**            | Documented but STILL missed                | **BLOCKING — 6x recommended, still causing avoidable rounds** |
| Incremental algorithm hardening | #379, #382   | 2x                | Improved (Step 0.5)                        | Working — severity/dedup chains were minor vs #379            |
| Compliance noise (offline CLI)  | #382         | New               | Not suppressed for `scripts/debt/`         | Add path exclusion to pr-agent.toml                           |

#### Skills/Templates to Update

1. **`.qodo/pr-agent.toml`:** Add `scripts/debt/` to compliance exclusion paths
   — 13 rejected compliance items across 3 rounds were all for offline CLI
   scripts. (~5 min — do now)
2. **CODE_PATTERNS.md:** Add pattern: "When fixing severity/priority mapping,
   audit ALL levels and ALL files with similar logic in one pass." (~5 min — do
   now)

#### Process Improvements

1. **Complete severity/mapping audits** — R1 fixed 2 of 4 severity levels,
   leaving medium and case-sensitivity for R2/R3. When fixing any mapping logic,
   enumerate all possible inputs and verify all branches in one pass. Evidence:
   R1→R2→R3 severity chain.

2. **Dedup algorithm boundaries** — R1-R3 each added a different dedup boundary
   (cross-MASTER, within-run, cross-report). The Algorithm Design Pre-Check from
   #379 retro should have been applied more rigorously here. Evidence: R1→R2→R3
   dedup chain.

3. **Same-file regex DoS sweep** — After fixing one regex DoS in a file, grep
   the same file for all other potentially vulnerable regexes before committing.
   Evidence: R1→R2 regex DoS chain.

#### Verdict

PR #382 had a **clean, efficient review cycle** — 3 rounds with 76 raw items (61
fixed, 13 rejected), completed in a single session. **~1 of 3 rounds was
partially avoidable** (~33%), making this one of the lowest-churn PRs since #371
(2 rounds, 0 avoidable).

The primary churn driver was **incremental hardening** of severity mapping and
dedup logic, a minor variant of Pattern 8 (incremental algorithm hardening) from
PR #379. However, the chains were much shorter (3 rounds vs 7) and the items
were MINOR/LOW severity, not CRITICAL — showing that the Algorithm Design
Pre-Check from #379's retro is working for the major cases.

The **single highest-impact change** is adding `scripts/debt/` to Qodo
compliance exclusion paths — this would eliminate 13 rejected items (17% of raw
total) across 3 rounds. The compliance rules (audit trails, secure logging,
input validation) are consistently not applicable to offline CLI scripts.

**Comparison to previous retros:** The trend is clearly improving: #369(9) →
#370(5) → #371(2) → #374(5) → #379(11) → **#382(3)**. The spike to 11 in #379
was due to a new failure mode (algorithm hardening); #382's 3 rounds show that
the countermeasure (Algorithm Design Pre-Check) is effective. Rejection rate
remains a concern (17% of raw items) but is driven by a specific gap (compliance
rules for offline scripts) that has a clear fix.

---

### PR #379 Retrospective (2026-02-20)

#### Review Cycle Summary

| Metric         | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| Rounds         | 11 (R1 2026-02-19 through R11 2026-02-20)                    |
| Branches       | 2 (claude/new-session-DQVDk R1-R7, cherry-pick-thZGO R8-R11) |
| Total items    | ~190 raw, ~119 unique after dedup                            |
| Fixed          | 106                                                          |
| Deferred       | 4 (JSONL schema migration, timestamp mutation, pipeline)     |
| Rejected       | ~61 (mostly Qodo compliance repeats + impossible type FPs)   |
| Review sources | Gemini, SonarCloud, Qodo Compliance + Code, Qodo Security    |

#### Per-Round Breakdown

| Round     | Date       | Source              | Branch      | Items (unique) | Fixed   | Rejected | Deferred | Key Patterns                                               |
| --------- | ---------- | ------------------- | ----------- | -------------- | ------- | -------- | -------- | ---------------------------------------------------------- |
| R1        | 2026-02-19 | Gemini              | new-session | 4              | 3       | 0        | 1        | EXIT trap, evidence dedup, mktemp guards                   |
| R2        | 2026-02-19 | Gemini              | new-session | 9              | 6       | 2        | 0        | Key-order canonicalize, backslash paths, absolute paths    |
| R3        | 2026-02-20 | SonarCloud+Qodo     | new-session | 12             | 6       | 4        | 2        | Prototype pollution, type-stable keys, circular ref        |
| R4        | 2026-02-20 | Qodo                | new-session | 4              | 3       | 2        | 1        | try/finally circular ref, regex escaping, internal dedup   |
| R5        | 2026-02-20 | SonarCloud+Qodo     | new-session | 5              | 3       | 2        | 0        | CC extraction (mergeItems 18→<15), String.raw, env guard   |
| R6        | 2026-02-20 | Qodo                | new-session | 3              | 3       | 4        | 0        | Depth cap, non-array wrapping, fallback keys               |
| R7        | 2026-02-20 | SonarCloud+Qodo     | new-session | 2              | 2       | 6        | 0        | Nested ternary→toArray(), incoming evidence wrapping       |
| R8        | 2026-02-20 | SonarCloud+Qodo+Gem | cherry-pick | 27             | 27      | 13       | 0        | ReDoS, CC monolith, block comment string tracking, symlink |
| R9        | 2026-02-20 | SonarCloud+Qodo+Gem | cherry-pick | 21             | 21      | 8        | 0        | ReDoS bounded quantifiers, dead store, CRLF/BOM, EXDEV     |
| R10       | 2026-02-20 | SonarCloud+Qodo     | cherry-pick | 17             | 17      | 9        | 0        | CC regression fix, CRLF propagation, checker failures      |
| R11       | 2026-02-20 | SonarCloud+Qodo+Gem | cherry-pick | 15             | 15      | 12       | 0        | Null metrics, safeRename, linter self-flag, empty backlog  |
| **Total** |            |                     |             | **~119**       | **106** | **~61**  | **4**    |                                                            |

**Note on round numbering:** R1-R7 occurred on the original branch
(claude/new-session-DQVDk). Code was then cherry-picked to a new branch
(claude/cherry-pick-commits-thZGO), where R8-R11 reflect new CI reviews on the
combined changes. R8-R9 were processed WITHOUT the `/pr-review` protocol
(retroactive entries written later); R10-R11 followed the full protocol.

#### Ping-Pong Chains

##### Chain 1: Evidence Algorithm Incremental Hardening (R2→R7, 6 rounds)

| Round | What Happened                                                                 | Files Affected   | Root Cause                           |
| ----- | ----------------------------------------------------------------------------- | ---------------- | ------------------------------------ |
| R2    | Added `canonicalize()` for key-order-sensitive JSON.stringify evidence dedup  | normalize-all.js | Initial — no dedup existed           |
| R3    | Prototype pollution in canonicalize (`Object.create(null)`), type-stable keys | normalize-all.js | Algorithm not designed for untrusted |
| R4    | try/finally for circular ref detection, regex escaping, internal array dedup  | normalize-all.js | Edge cases missed incrementally      |
| R5    | CC extraction: mergeItems CC 18→<15. String coercion, String.raw              | normalize-all.js | Accumulated complexity from R2-R4    |
| R6    | Depth cap on canonicalize (DoS), non-array evidence wrapping, fallback keys   | normalize-all.js | More edge cases: depth, type safety  |
| R7    | Nested ternary→toArray() helper, incoming evidence symmetric wrapping         | normalize-all.js | Defensive coding creates nesting     |

**Avoidable rounds:** 4 (R4-R7). If R2-R3 had designed the full algorithm
upfront (invariants: no prototype pollution, circular ref detection, depth cap,
type-stable keys, both-sides dedup), R4-R7 would not have been needed.

**Prevention:** Algorithm Design Pre-Check — before committing non-trivial
algorithm logic, define invariants, enumerate edge cases, handle all input
types, add depth/size caps. Now documented in pr-review Step 0.5.

##### Chain 2: Protocol Non-Compliance Cascade (R8-R9 → R10, 3 rounds)

| Round | What Happened                                                                  | Files Affected                                      | Root Cause                      |
| ----- | ------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------- |
| R8    | Processed ~40 items WITHOUT pr-review protocol. CC regression: merged 2 CC-17  | extract-scattered-debt.js, state-manager.js +9 more | No protocol = no verification   |
|       | functions into CC-19. CRLF fix applied to 3 of 6 loadJsonl copies.             |                                                     |                                 |
| R9    | Also no protocol. More CC regressions. ReDoS in regex. CRLF still incomplete.  | extract-scattered-debt.js, 3 parsers                | Skipped propagation check again |
| R10   | Protocol restored. Fixed CC regression from R8 (advanceStringChar extraction). | extract-scattered-debt.js + 3 CRLF files            | Cleanup of R8-R9 shortcuts      |
|       | Propagated CRLF to remaining 3 loadJsonl copies. Surfaced checker failures.    |                                                     |                                 |

**Avoidable rounds:** 2 (R10 was entirely cleanup from R8-R9). If R8-R9 had
followed the protocol, CC regression would have been caught by Step 0.5 CC
pre-check, and CRLF propagation would have been caught by Step 5.6.

**Prevention:** Always follow `/pr-review` protocol. The protocol exists because
every skipped step creates a deferred cost in the next round.

##### Chain 3: CRLF Propagation Miss (R9 → R10, 2 rounds)

| Round | What Happened                                                                     | Files Affected                                                       | Root Cause                        |
| ----- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------- |
| R9    | Fixed CRLF in 3 JSONL parsers (effectiveness-metrics, backlog-health, data-state) | effectiveness-metrics.js, backlog-health.js, data-state-health.js    | Partial fix — only reported files |
| R10   | Found 3 MORE identical `loadJsonl` functions missing CRLF fix                     | process-compliance.js, feedback-integration.js, pattern-lifecycle.js | Propagation check skipped         |

**Avoidable rounds:** 1 (R10 CRLF portion). A `grep -rn "loadJsonl"` at R9 would
have found all 6 copies.

**Prevention:** Step 5.6 propagation check — when fixing a pattern in one file,
grep for ALL instances. This has been recommended in PRs #366, #367, #369, #374,
and now #379. **This is the 5th time this recommendation appears.**

##### Chain 4: Linter Self-Flagging (R10 → R11, 2 rounds)

| Round | What Happened                                                                   | Files Affected               | Root Cause                     |
| ----- | ------------------------------------------------------------------------------- | ---------------------------- | ------------------------------ |
| R10   | Added .bak rotation with bare `renameSync` — the exact pattern the linter flags | state-manager.js             | Didn't test own code vs linter |
| R11   | rename-no-fallback rule flagged R10's code. Also: rule only accepted            | check-pattern-compliance.js, | Rule spec incomplete +         |
|       | writeFileSync fallback, not copyFileSync (which fix template recommends)        | state-manager.js             | didn't test against own fix    |

**Avoidable rounds:** 1 (R11 linter portion). If R10 had run
`npm run patterns:check` before pushing, both the self-flagging and the
incomplete rule spec would have been caught.

**Prevention:** Run linter/pattern checks against your own code before pushing.
Add to the pre-push verification list.

**Total avoidable rounds across all chains: ~8 out of 11 (~73%)**

#### Rejection Analysis

| Category                         | Count | Rounds    | Examples                                                                |
| -------------------------------- | ----- | --------- | ----------------------------------------------------------------------- |
| Impossible types from JSON.parse | ~15   | R3-R7     | "Handle Date/RegExp/Map/Set" — impossible from JSON.parse output        |
| Qodo compliance repeats          | ~12   | R3-R7,R11 | Same intake-manual user ID, operator "root" label — rejected 5+ times   |
| TODO false positives             | ~16   | R8-R10    | TODO-extractor script flagging its own TODO keyword patterns            |
| SonarCloud tool conflict         | 1     | R11       | globals → \_\_dirname conflict with SonarCloud env expectations         |
| Gemini outdated suggestions      | 3     | R11       | Already addressed in earlier rounds                                     |
| Over-engineering                 | ~5    | R3-R7     | WeakMap for IDs, key length caps, array sorting that corrupts semantics |
| Threat model mismatch            | ~2    | R8,R11    | Env vars set by runtime, not attacker-controlled                        |
| Data quality / style             | ~7    | R2,R8-R11 | Intentional audit data, project conventions                             |

**Rejection accuracy:** ~58/61 rejections were correct (~95% accuracy). 3
borderline cases where the reviewer had a point but the fix was disproportionate
to the risk.

#### Recurring Patterns (Automation Candidates)

| Pattern                       | Rounds            | Already Automated? | Recommended Action                                                   | Est. Effort |
| ----------------------------- | ----------------- | ------------------ | -------------------------------------------------------------------- | ----------- |
| Impossible JSON.parse types   | R3,R4,R5,R6,R7    | No (Qodo config)   | Add suppression rule to `.qodo/pr-agent.toml` for JSON.parse context | ~5 min      |
| loadJsonl code duplication    | R9,R10            | No                 | Extract shared `loadJsonl` to lib/ module used by all 6 checkers     | ~30 min     |
| Protocol non-compliance       | R8,R9             | No (human issue)   | Add protocol-compliance note to session-begin checklist              | ~5 min      |
| Evidence algorithm edge cases | R2,R3,R4,R5,R6,R7 | Now: Step 0.5      | Algorithm Design Pre-Check (added post-retro)                        | Done        |

#### Previous Retro Action Item Audit

| Retro   | Recommended Action                             | Implemented?       | Impact on #379                                      |
| ------- | ---------------------------------------------- | ------------------ | --------------------------------------------------- |
| PR #374 | FIX_TEMPLATES: realpathSync lifecycle (#31)    | **YES**            | No realpathSync issues in #379                      |
| PR #374 | FIX_TEMPLATES: Hoist safety flag (#32)         | **YES**            | Applied correctly in state-manager.js               |
| PR #374 | pr-review Step 0.5: filesystem guard pre-check | **YES**            | Not triggered (no new guard functions in #379)      |
| PR #374 | Propagation check enforcement                  | **NOT DONE**       | CRLF propagation miss R9→R10 (~1 avoidable round)   |
| PR #371 | CC from warn to error (pre-commit)             | **YES**            | CC caught at R5 before it would have gone to CI     |
| PR #371 | Qodo suppression for compliance rules          | **YES**            | Reduced but didn't eliminate compliance noise       |
| PR #370 | Path normalization test matrix                 | **YES** (Step 5.8) | Applied correctly in normalize-all.js path handling |

**Total avoidable rounds from unimplemented retro actions: ~1** (Propagation
enforcement would have prevented the CRLF chain R9→R10)

#### Cross-PR Systemic Analysis

| PR       | Rounds | Total Items | Algorithm Rounds | Protocol Rounds | Rejections | Key Issue                         |
| -------- | ------ | ----------- | ---------------- | --------------- | ---------- | --------------------------------- |
| #366     | 8      | ~90         | 0                | 0               | ~20        | Symlink ping-pong                 |
| #367     | 7      | ~193        | 0                | 0               | ~24        | SKIP_REASON validation            |
| #368     | 6      | ~65         | 0                | 0               | ~15        | TOCTOU fd-based write             |
| #369     | 9      | 119         | 0                | 0               | 41         | CC + symlink combined             |
| #370     | 5      | 53          | 0                | 0               | 6          | Path normalization                |
| #371     | 2      | 45          | 0                | 0               | 7          | CC extraction + S5852             |
| #374     | 5      | 40          | 0                | 0               | 5          | Path containment                  |
| **#379** | **11** | **~119**    | **6**            | **2**           | **~61**    | **Evidence algorithm + protocol** |

**Persistent cross-PR patterns:**

| Pattern                        | PRs Affected    | Times Recommended | Status                                     | Required Action                                               |
| ------------------------------ | --------------- | ----------------- | ------------------------------------------ | ------------------------------------------------------------- |
| CC lint rule                   | #366-#371       | 5x                | **RESOLVED** (pre-commit error since #371) | None — CC caught locally                                      |
| Qodo suppression               | #369-#371       | 3x                | **RESOLVED** (pr-agent.toml)               | None — reduced noise                                          |
| Propagation check              | #366-#379       | **5x**            | Documented but still missed                | **BLOCKING — 5x recommended, still causing avoidable rounds** |
| Incremental security hardening | #366-#374       | 4x                | Improved (test matrix)                     | Resolved for security; new variant: algorithm hardening       |
| Impossible type FP             | #379 (5 rounds) | New               | Not suppressed                             | Add Qodo suppression for JSON.parse impossible types          |

#### Skills/Templates to Update

1. **FIX_TEMPLATES.md:** Added Template #34 — evidence/array merge with deep
   dedup (canonicalize, depth cap, circular ref, type-stable keys). (~Done
   during retro)
2. **pr-review SKILL.md Step 0.5:** Added Algorithm Design Pre-Check for
   non-trivial algorithm logic. (~Done during retro)
3. **pr-retro SKILL.md:** Added Pattern 8 (Incremental Algorithm Hardening) to
   Known Churn Patterns. (~Done during retro)
4. **`.qodo/pr-agent.toml`:** Add 2 new suppression rules for impossible
   JSON.parse type suggestions. (~Done during retro)
5. **Shared loadJsonl refactor:** Extract shared `loadJsonl` to
   `pr-ecosystem-audit/scripts/lib/load-jsonl.js` used by all 6 checkers. (~30
   min, create DEBT entry)

#### Process Improvements

1. **Algorithm design before implementation** — The evidence dedup algorithm
   (canonicalize + merge + dedup) evolved over 6 rounds of reviewer feedback
   instead of being designed upfront. Each round added one more edge case
   (prototype pollution → circular refs → depth cap → type coercion → String.raw
   → nested ternary). An upfront design phase enumerating invariants and edge
   cases would have reduced this to 2-3 rounds. Evidence: R2-R7 algorithm chain.

2. **Protocol compliance is non-negotiable** — R8-R9 skipped the `/pr-review`
   protocol entirely, creating CC regressions and CRLF propagation misses that
   required R10 to clean up. The protocol's CC pre-check (Step 0.5) and
   propagation check (Step 5.6) exist specifically to prevent these issues.
   Evidence: R8-R9 → R10 cascade.

3. **Propagation enforcement still missing** — Despite being recommended in PRs
   #366, #367, #369, #374, and now #379, propagation checks are still missed
   when the protocol is skipped. The root cause is that propagation is a
   protocol step, not an automated check. Consider adding a pre-commit hook or
   CI check that detects duplicate function signatures across files. Evidence:
   CRLF chain R9→R10, 5th recommendation.

4. **Test your own code against your own linter** — R10 introduced bare
   `renameSync` that R11's linter flagged. Running `npm run patterns:check`
   before pushing would have caught this. Evidence: R10→R11 linter chain.

#### Verdict

PR #379 had a **high-churn review cycle** — 11 rounds across 2 branches with
~119 unique items, making it the most review-intensive PR since #369 (9 rounds,
119 items). **~8 of 11 rounds (~73%) were avoidable.**

The primary churn driver was a **new pattern** not seen in previous PRs:
incremental algorithm hardening, where a non-trivial evidence dedup algorithm
was designed through reviewer iteration rather than upfront planning. This
accounted for 6 of 11 rounds. The secondary driver was protocol non-compliance
in R8-R9, which cascaded into R10 cleanup.

The **single highest-impact change** is the Algorithm Design Pre-Check added to
pr-review Step 0.5 — requiring upfront invariant definition, edge case
enumeration, and full algorithm design before committing non-trivial logic. This
would have prevented ~4 of the 6 algorithm rounds.

**Comparison to previous retros:** The trend shows resolved systemic patterns
(CC: 0 rounds, Qodo compliance: reduced) but new patterns emerging (algorithm
hardening). Round counts: #366(8) → #367(7) → #368(6) → #369(9) → #370(5) →
#371(2) → #374(5) → #379(11). The spike to 11 is partly due to spanning 2
branches (7+4) and partly due to the algorithm chain being a genuinely new
failure mode. Rejection noise remains high (~61 items, ~51% of raw suggestions)
driven primarily by Qodo impossible-type false positives.

**Key insight:** The retro-driven improvement cycle works for known patterns (CC
resolved after 5 retros, security hardening improved after 4 retros) but cannot
prevent novel failure modes. The Algorithm Design Pre-Check is a proactive
defense against the class of "incremental refinement" problems, not just the
specific evidence dedup instance.

---

### PR #384 Retrospective (2026-02-23)

#### Review Cycle Summary

| Metric         | Value                                                |
| -------------- | ---------------------------------------------------- |
| Rounds         | 4 (R1–R4, all 2026-02-22)                            |
| Total items    | 197                                                  |
| Fixed          | 171                                                  |
| Deferred       | 8 (compact-restore.js path containment, CC items)    |
| Rejected       | 9 + 9 acknowledged                                   |
| Review sources | SonarCloud, Qodo Compliance, Qodo PR Suggestions, CI |

#### Per-Round Breakdown

| Round     | Date       | Source             | Items   | Fixed   | Rejected | Key Patterns                                                                |
| --------- | ---------- | ------------------ | ------- | ------- | -------- | --------------------------------------------------------------------------- |
| R1        | 2026-02-22 | SonarCloud+Qodo+CI | 28      | 19      | 0        | CC extraction creates CC, FP double-counting, division by zero, [Cc]+i      |
| R2        | 2026-02-22 | CI+SonarCloud+Qodo | 139     | 125     | 7        | 112 CI violations, Array.isArray FPs, happy-path regex flaw, `\|\|` vs `??` |
| R3        | 2026-02-22 | SonarCloud+CI+Qodo | 18      | 16      | 1        | CC reduction (3 funcs), nested ternary, atomic writes, TOCTOU regex         |
| R4        | 2026-02-22 | CI+SonarCloud+Qodo | 12      | 11      | 1        | Security excludes for tests, CC extract, EXDEV fallback, CRLF/BOM           |
| **Total** |            |                    | **197** | **171** | **9**    |                                                                             |

#### Ping-Pong Chains

##### Chain 1: CI Pattern Compliance Cascade (R1→R2 = 2 rounds)

| Round | What Happened                                                            | Files Affected                                           | Root Cause                                 |
| ----- | ------------------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------ |
| R1    | Fixed 19 SonarCloud/Qodo items across 6 files, introduced new code       | analyze-placement.js, place-unassigned-debt.js +4        | New code for 9-domain audit feature        |
| R2    | CI pre-push found 112 blocking pattern violations in R1's modified files | Same files + 11 more (ecosystem checkers, consolidation) | R1 code not tested against pattern checker |

**Avoidable rounds:** 1 (R2's 112 CI violations). Running
`npm run patterns:check` before pushing R1 would have caught all 112 violations
locally.

**Prevention:** Add `npm run patterns:check --staged` to the R1 fix workflow.

##### Chain 2: CC Progressive Reduction (R1→R3→R4 = 3 rounds)

| Round | What Happened                                                                         | Files Affected                                 | Root Cause                            |
| ----- | ------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------- |
| R1    | CC extraction in check-pattern-compliance.js; noted "CC extraction creates new CC"    | check-pattern-compliance.js                    | Pattern identified but not swept      |
| R3    | CC >15 in 3 functions: simplifyPlacements (19), loadSprintFiles (20), placeItems (24) | analyze-placement.js, place-unassigned-debt.js | SonarCloud flagged on R2 push         |
| R4    | CC in placeGroupItems extracted from placeItemsIntoSprints (21→~10)                   | place-unassigned-debt.js                       | R3 extraction created new CC function |

**Avoidable rounds:** 1 (R4). R3 should have re-checked all extracted helpers
per the "CC extraction creates new CC" pattern identified in R1.

**Prevention:** After extracting helpers for CC reduction, always re-check the
ENTIRE file with `npx eslint --rule 'complexity: ["error", 15]'`.

##### Chain 3: Persistent Script Files (R1→R2→R3→R4 = 4 rounds)

| Round | What Happened                            | Files Affected                                  | Root Cause                     |
| ----- | ---------------------------------------- | ----------------------------------------------- | ------------------------------ |
| R1    | Initial SonarCloud/Qodo fixes            | analyze-placement.js, place-unassigned-debt.js  | Original feature code          |
| R2    | CI pattern violations + Qodo suggestions | Same + archive-reviews.js, run-consolidation.js | Pattern checker on R1 code     |
| R3    | SonarCloud CC + atomic write fixes       | Same + inline-patterns.js                       | R2 modifications flagged by SC |
| R4    | EXDEV guard, scoped regex, BOM/CRLF      | Same + process-compliance.js, security-check.js | Incremental hardening          |

**Avoidable rounds:** 0.5 (each round after R2 had diminishing but genuine new
findings).

**Total avoidable rounds across all chains: ~2.5 out of 4 (~62.5% partially
avoidable)**

#### Rejection Analysis

| Category                          | Count | Rounds | Examples                                                         |
| --------------------------------- | ----- | ------ | ---------------------------------------------------------------- |
| Qodo acknowledged (not rejected)  | 9     | R1     | Qodo suggestions acknowledged as valid but not blocking          |
| CI pattern false positives        | ~5    | R2     | Array.isArray checker flagging files with existing guards        |
| Qodo compliance (offline scripts) | ~2    | R2-R3  | "Missing audit trails" for CLI tools                             |
| Intentional test data             | 1     | R3-R4  | SEC-001/002/003/010 on pattern-compliance.test.js (intentional)  |
| Regex false negative              | 1     | R4     | Qodo suggested removing `\\)` from TOCTOU regex — would break it |

**Rejection accuracy:** 9/9 explicit rejections were correct (100%).

#### Recurring Patterns (Automation Candidates)

| Pattern                             | Rounds   | Already Automated?      | Recommended Action                                                  | Est. Effort |
| ----------------------------------- | -------- | ----------------------- | ------------------------------------------------------------------- | ----------- |
| CI pattern violations from new code | R2       | YES (pre-commit hook)   | Enforce `--staged` check before pushing review fixes                | ~5 min      |
| CC extraction creates new CC        | R1,R3,R4 | YES (pre-commit hook)   | Add "re-check file" reminder to CC fix template                     | ~5 min      |
| happy-path-only regex flawed        | R2       | YES (replaced w/testFn) | Already fixed in this PR                                            | Done        |
| `\|\|` vs `??` for zero-values      | R2       | No                      | Add pattern to check-pattern-compliance.js for numeric `\|\|` usage | ~20 min     |

#### Previous Retro Action Item Audit

| Retro   | Recommended Action                                 | Implemented? | Impact on #384                                   |
| ------- | -------------------------------------------------- | ------------ | ------------------------------------------------ |
| PR #383 | FIX_TEMPLATES #36 (dual-JSONL write with rollback) | **YES**      | Not directly relevant (no dual-JSONL writes)     |
| PR #383 | pr-review Step 0.5 dual-file write grep            | **YES**      | Not triggered                                    |
| PR #383 | check-pattern-compliance symlink guard rule        | **NOT DONE** | No impact (no new write paths in #384)           |
| PR #383 | Propagation protocol enforcement                   | **NOT DONE** | ~0.5 avoidable round (R3→R4 CRLF)                |
| PR #382 | scripts/debt/ Qodo compliance exclusion            | **NOT DONE** | ~2 rejected compliance items in R2               |
| PR #382 | CODE_PATTERNS severity mapping audit pattern       | **NOT DONE** | No impact (no severity mapping in #384)          |
| PR #379 | Algorithm Design Pre-Check (Step 0.5)              | **YES**      | Not triggered (no new algorithms)                |
| PR #379 | Propagation enforcement                            | **NOT DONE** | **7th time recommended** — ~0.5 avoidable rounds |

**Total avoidable rounds from unimplemented retro actions: ~1**

#### Cross-PR Systemic Analysis

| PR       | Rounds | Total Items | Avoidable Rounds | Rejections | Key Issue                     |
| -------- | ------ | ----------- | ---------------- | ---------- | ----------------------------- |
| #371     | 2      | 45          | ~0               | 7          | CC extraction + S5852         |
| #374     | 5      | 40          | ~2               | 5          | Path containment              |
| #379     | 11     | ~119        | ~8               | ~61        | Evidence algorithm + protocol |
| #382     | 3      | 76          | ~1               | 13         | Severity/dedup incremental    |
| #383     | 8      | ~282        | ~4               | ~90        | Symlink/atomic/catch          |
| **#384** | **4**  | **197**     | **~2.5**         | **~18**    | **CI pattern cascade + CC**   |

**Persistent cross-PR patterns:**

| Pattern                         | PRs Affected | Times Recommended | Status                                     | Required Action                                                      |
| ------------------------------- | ------------ | ----------------- | ------------------------------------------ | -------------------------------------------------------------------- |
| CC lint rule                    | #366-#371    | 5x                | **RESOLVED** (pre-commit error since #371) | None                                                                 |
| Qodo suppression                | #369-#371    | 3x                | **RESOLVED** (pr-agent.toml)               | Minor gap: `scripts/debt/` still not excluded                        |
| Propagation check               | #366-#384    | **7x**            | Documented but STILL missed                | **BLOCKING — 7x recommended, still causing avoidable rounds**        |
| `scripts/debt/` compliance excl | #382-#384    | 2x                | **NOT DONE**                               | Add path exclusion to pr-agent.toml (~5 min)                         |
| Local pattern check before push | #384 (new)   | 1x                | Not enforced                               | Pre-push or pre-commit should run `patterns:check` on modified files |

#### Skills/Templates to Update

1. **`.qodo/pr-agent.toml`:** Add `scripts/debt/` to compliance exclusion paths
   — 2x recommended, ~4+ rejected items per PR. (~5 min — do now)
2. **FIX_TEMPLATES.md:** Add reminder to CC extraction template: "After
   extracting helpers, re-check ENTIRE file for CC" (~5 min — do now)
3. **pr-retro SKILL.md:** No new known churn patterns needed. PR #384's issues
   are variants of existing patterns (CC cascade = Pattern 1, CI violations =
   Pattern 5 propagation).

#### Process Improvements

1. **Run pattern checker before pushing review fixes** — 112 of 197 items (57%)
   were CI pattern violations caught by `npm run patterns:check`. Running
   locally before push would have eliminated the entire R2 CI block. Evidence:
   R2.
2. **CC re-check after extraction is not optional** — R1 documented "CC
   extraction creates new CC" then R3/R4 had exactly this. The learning was
   captured but not applied within the same PR. Evidence: R1→R3→R4.
3. **Propagation enforcement remains the top systemic issue** — This is the
   **7th PR retro** recommending it. Impact declining (~0.5 vs 2+ rounds in
   earlier PRs) but still persistent. Evidence: R3→R4 CRLF/BOM.

#### Verdict

PR #384 had a **moderately efficient review cycle** — 4 rounds with 197 items,
171 fixed. ~2.5 of 4 rounds were partially avoidable (~62.5%), driven primarily
by the R2 CI pattern cascade (112 items). Without the CI cascade, this would
have been a clean 2-3 round PR.

The **single highest-impact change** for future PRs: enforce
`npm run patterns:check` before pushing review fix commits — eliminates ~80% of
R2 items.

**Trend: Improving.** Round count: #379(11) → #382(3) → #383(8) → **#384(4)**.
Per-round throughput improving: #383 = 35 items/round, #384 = 49 items/round.
Rejection rate dropped from 32% (#383) to 9% (#384). Propagation impact
declining: ~4 rounds (#383) → ~0.5 (#384).

---

### PR #386 Retrospective (2026-02-23)

#### Review Cycle Summary

| Metric         | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| Rounds         | 2 (R1–R2, both 2026-02-23)                                   |
| Total items    | 25                                                           |
| Fixed          | 23                                                           |
| Deferred       | 0                                                            |
| Rejected       | 1 (false positive)                                           |
| Architectural  | 1 (ESLint migration — flagged to user)                       |
| Review sources | SonarCloud, Qodo Compliance, Qodo PR Suggestions, Gemini, CI |

#### Per-Round Breakdown

| Round     | Date       | Source                    | Items  | Fixed  | Rejected | Key Patterns                                                                       |
| --------- | ---------- | ------------------------- | ------ | ------ | -------- | ---------------------------------------------------------------------------------- |
| R1        | 2026-02-23 | SonarCloud+Qodo+Gemini+CI | 19     | 17     | 1        | S5852 regex→testFn (2), seed-commit-log hardening (8), optional chain, CI Prettier |
| R2        | 2026-02-23 | SonarCloud+Qodo           | 6      | 6      | 0        | S5852 regex→string parsing, CC reduction (main→3, testFn IIFE→3), concurrency tmp  |
| **Total** |            |                           | **25** | **23** | **1**    |                                                                                    |

#### Ping-Pong Chains

##### Chain 1: S5852 Regex Complexity Two-Stage (R1→R2 = 2 rounds)

| Round | What Happened                                                                                      | Files Affected                                  | Root Cause                                     |
| ----- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| R1    | S5852 flagged 2 regexes (complexity 31, 26). Replaced with testFn functions. Also seed-commit-log. | check-pattern-compliance.js, seed-commit-log.js | Original regexes exceeded SonarCloud threshold |
| R2    | S5852 re-flagged getSessionCounter — R1's testFn still used `/(\d+)\s*$/` regex inside.            | check-pattern-compliance.js                     | R1 replaced pattern regex but not helper regex |

**Avoidable rounds:** 0.5. R1's testFn strategy was correct but helper regex
within testFn wasn't checked against S5852. A "re-check all regex" step would
have caught it.

**Prevention:** After any S5852 fix, re-check ALL regex complexity in modified
functions, not just the flagged one.

##### Chain 2: CC Progressive Reduction (R1→R2 = 2 rounds)

| Round | What Happened                                                                                   | Files Affected                                  | Root Cause                         |
| ----- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------- |
| R1    | 8 hardening fixes added to seed-commit-log.js main(). testFn IIFE created in compliance.js.     | seed-commit-log.js, check-pattern-compliance.js | Necessary hardening from review    |
| R2    | CC >15 in main() and CC 24 in testFn IIFE. Extracted parseCommitLines, writeEntries, isWordChar | seed-commit-log.js, check-pattern-compliance.js | R1 added features without CC check |

**Avoidable rounds:** 0.5. Pre-commit CC hook should catch these on staged
files. Verify IIFE expressions get CC-checked.

**Total avoidable rounds across all chains: ~1 out of 2 (~50% partially
avoidable)**

#### Rejection Analysis

| Category       | Count | Round | Examples                                                                             |
| -------------- | ----- | ----- | ------------------------------------------------------------------------------------ |
| False positive | 1     | R1    | "Sensitive content in seeded JSONL" — git commit data already public in repo history |

**Rejection accuracy:** 1/1 rejections correct (100%).

**Architectural (not rejected):** ESLint migration for
check-pattern-compliance.js — significant effort, flagged to user as future tech
debt.

#### Recurring Patterns (Automation Candidates)

| Pattern                | Rounds | Already Automated?    | Recommended Action                                        | Est. Effort |
| ---------------------- | ------ | --------------------- | --------------------------------------------------------- | ----------- |
| S5852 regex complexity | R1, R2 | No                    | Add regex complexity check to pr-review Step 0.5 pre-push | ~30 min     |
| CC >15 in new code     | R2     | YES (pre-commit hook) | Verify hook catches CC in IIFE testFn expressions         | ~10 min     |
| Sticky boolean FP      | R1     | YES (proximity check) | Already fixed this PR                                     | Done        |

#### Previous Retro Action Item Audit

| Retro   | Recommended Action                             | Implemented? | Impact on #386                                           |
| ------- | ---------------------------------------------- | ------------ | -------------------------------------------------------- |
| PR #384 | `\|\|` vs `??` pattern compliance rule         | **YES**      | `logical-or-numeric-fallback` rule (line 1479). Working. |
| PR #384 | CC re-check reminder in FIX_TEMPLATES          | **YES**      | Line 1426. Partially effective — R2 still had CC.        |
| PR #384 | `scripts/debt/` Qodo compliance exclusion      | **YES**      | 4 entries in pr-agent.toml.                              |
| PR #384 | Run patterns:check before pushing review fixes | **NOT DONE** | No impact (only 5 files, no CI pattern cascade).         |
| PR #383 | Propagation protocol (mandatory codebase grep) | **NOT DONE** | No impact (no security patterns in #386).                |
| PR #383 | writeFileSync guard rule in compliance checker | **NOT DONE** | No impact (no write paths in #386 scope).                |
| PR #379 | Algorithm Design Pre-Check (Step 0.5)          | **YES**      | Not triggered.                                           |

**Total avoidable rounds from unimplemented retro actions: 0**

#### Cross-PR Systemic Analysis

| PR       | Rounds | Total Items | Avoidable Rounds | Rejections | Key Issue                     |
| -------- | ------ | ----------- | ---------------- | ---------- | ----------------------------- |
| #379     | 11     | ~119        | ~8               | ~61        | Evidence algorithm + protocol |
| #382     | 3      | 76          | ~1               | 13         | Severity/dedup incremental    |
| #383     | 8      | ~282        | ~4               | ~90        | Symlink/atomic/catch          |
| #384     | 4      | 197         | ~2.5             | ~18        | CI pattern cascade + CC       |
| **#386** | **2**  | **25**      | **~1**           | **1**      | **S5852 regex + CC**          |

**Persistent cross-PR patterns:**

| Pattern                       | PRs Affected   | Times Recommended | Status                       | Required Action                                    |
| ----------------------------- | -------------- | ----------------- | ---------------------------- | -------------------------------------------------- |
| CC lint rule                  | #366-#371      | 5x                | **RESOLVED** (pre-commit)    | None                                               |
| Qodo suppression              | #369-#384      | 4x                | **RESOLVED** (pr-agent.toml) | None                                               |
| Propagation check             | #366-#384      | 7x                | Process only                 | Declining impact — not triggered in #386           |
| S5852 regex complexity        | **#386 (new)** | 1x                | Not automated                | Consider local SonarCloud or regex complexity lint |
| CC in testFn/IIFE expressions | **#386 (new)** | 1x                | Partial (pre-commit hook)    | Verify IIFE testFns get CC-checked                 |

#### Skills/Templates to Update

1. **pr-review SKILL.md Step 0.5:** Add "After S5852 fix, re-check ALL regex
   complexity in modified functions" (~5 min — do now)
2. **FIX_TEMPLATES.md:** No update needed — existing CC template already has
   "re-check ENTIRE file" reminder (line 1426).
3. **pr-retro SKILL.md:** No new known churn patterns — S5852 is a variant of
   Pattern 1 (CC progressive reduction).

#### Process Improvements

1. **S5852 requires recursive regex audit** — When SonarCloud flags regex
   complexity, check ALL regexes in the modified file, not just the flagged one.
   Evidence: R1→R2 (helper regex inside testFn).
2. **Pre-commit CC hook may not cover IIFE expressions** — R2 had CC 24 in a
   testFn IIFE. Verify hook scans IIFE contexts. Evidence: R2.
3. **Small PRs = fewer rounds** — 5 files, 2 rounds, 25 items. Compare to #383
   (30+ files, 8 rounds, 282 items). Evidence: this PR.

#### Verdict

PR #386 had an **efficient review cycle** — 2 rounds with 25 items, 23 fixed, 1
rejection (100% accuracy). ~1 of 2 rounds was partially avoidable (~50%), driven
by S5852 two-stage regex fix. The **single highest-impact change**: after any
SonarCloud regex fix, audit ALL regex patterns in modified functions.

**Trend: Clearly improving.** Round count: #379(11) → #383(8) → #384(4) →
**#386(2)**. Items per round: #383(35) → #384(49) → **#386(12.5)**. Rejection
rate: #383(32%) → #384(9%) → **#386(4%)**. Cleanest cycle in the series. Small
PR scope and systemic improvements (CC hook, Qodo suppression) are paying off.

---

### PR #388 Retrospective — Final (2026-02-24)

_Supersedes R1-R4 retro. Covers complete R1-R7 review cycle._

#### Review Cycle Summary

| Metric         | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| Rounds         | 7 (R1–R4 2026-02-23, R5–R7 2026-02-24)                                             |
| Total items    | 144                                                                                |
| Fixed          | 108                                                                                |
| Deferred       | 9 (DEBT-7559–7566 from R1, DEBT-7567 from R3)                                      |
| Rejected       | 29                                                                                 |
| Review sources | CI (Pattern Compliance, Doc Lint), Qodo Compliance+Suggestions, SonarCloud, Gemini |

**Note:** Review #372 was mislabeled as "PR #387 R1" — corrected to "PR #388
R1".

#### Per-Round Breakdown

| Round     | Date       | Source                         | Items   | Fixed   | Def.  | Rej.   | Key Patterns                                                                               |
| --------- | ---------- | ------------------------------ | ------- | ------- | ----- | ------ | ------------------------------------------------------------------------------------------ |
| R1        | 2026-02-23 | CI+Qodo+Gemini                 | 42      | 34      | 8     | 0      | exec→matchAll (20), try/catch wrapping (9), rmSync (3), RegExp→helper (3), div-by-zero (4) |
| R2        | 2026-02-23 | CI+Qodo Compliance+Suggestions | 22      | 17      | 0     | 5      | Self-referential set bug, parseInt comma, regex overlap, backtracking, nested parens       |
| R3        | 2026-02-23 | CI+Qodo Suggestions            | 16      | 14      | 1     | 1      | Brace direction flip, regex backtracking, writesMaster FP, table header skip               |
| R4        | 2026-02-23 | CI+Qodo Suggestions            | 16      | 15      | 0     | 1      | CI blocker (RegExp→indexOf), brace re-correction, iterative DFS, BigInt, null vs falsy     |
| R5        | 2026-02-24 | SonarCloud+CI+Gemini+Qodo      | 25      | 14      | 0     | 4      | CC reduction (26→~10), escapeForRegex, sanitizeInput ×3, test predicate, dedup extraction  |
| R6        | 2026-02-24 | Qodo Comp+Suggestions+CI+Sonar | 14      | 11      | 0     | 3      | CI blockers (xargs -r, mktemp trap, grep), lstatSync ×4, JSONL dedup 1685 entries          |
| R7        | 2026-02-24 | Qodo+Gemini+SonarCloud QG+CI   | 9       | 1       | 0     | 8      | typeof guard on lazy-load, stale Gemini review, SonarCloud QG self-resolved                |
| **Total** |            |                                | **144** | **108** | **9** | **29** |                                                                                            |

**Trajectory:** 42 → 22 → 16 → 16 → 25 → 14 → 9. R5 spike from adding
SonarCloud+Gemini sources. Converged to single digits by R7.

#### Ping-Pong Chains

##### Chain 1: isInsideTryCatch Brace Direction (R2→R3→R4, 3 rounds)

| Round | What Happened                                                                      | Files Affected                                      | Root Cause                              |
| ----- | ---------------------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------- |
| R2    | Added brace counting for isInsideTryCatch heuristic                                | hook/state-integration.js                           | Initial implementation                  |
| R3    | Brace counting direction was wrong (backwards → false positives). Fixed direction. | hook/code-quality-security.js, state-integration.js | Heuristic designed without test matrix  |
| R4    | R3's fix was STILL wrong. Corrected with proper forward scan.                      | hook/code-quality-security.js, state-integration.js | R3 didn't validate against known inputs |

**Avoidable rounds:** 1 (R4). Pattern 8 (Incremental Algorithm Hardening)
applied to heuristic functions.

**Prevention:** Before committing heuristic functions, define test matrix of
expected inputs→outputs and validate.

##### Chain 2: data-quality-dedup.js Progressive Hardening (R1→R2→R3→R4, 4 rounds)

| Round | What Happened                                                               | Files Affected             | Root Cause                                  |
| ----- | --------------------------------------------------------------------------- | -------------------------- | ------------------------------------------- |
| R1    | Initial matchAll conversion, try/catch wrapping                             | tdms/data-quality-dedup.js | Bulk pattern compliance fix                 |
| R2    | Self-referential set bug (mergedFromIds → always true). parseInt comma fix. | tdms/data-quality-dedup.js | R1 introduced logic error                   |
| R3    | Non-serializable values in hash. Strengthened glob path regex.              | tdms/data-quality-dedup.js | R2 fixes didn't cover all data types        |
| R4    | Recursive DFS → iterative DFS + color map. BigInt handling.                 | tdms/data-quality-dedup.js | Stack overflow risk from recursive approach |

**Avoidable rounds:** 1.5. Self-referential set (R2) was testable. Iterative DFS
(R4) was designable upfront.

**Prevention:** (1) Verify filter sets come from independent data source. (2)
For recursive traversal, evaluate stack depth risk upfront.

##### Chain 3: Regex Safety Escalation (R1→R2→R3→R4, 4 rounds)

| Round | What Happened                                                               | Files Affected    | Root Cause                         |
| ----- | --------------------------------------------------------------------------- | ----------------- | ---------------------------------- |
| R1    | Converted exec-while to matchAll (~20 instances), RegExp validation helpers | 10 checker files  | Bulk compliance fix                |
| R2    | Word boundaries (readFile vs readFileSync overlap), backtracking guards     | 6 checker files   | R1 patterns too broad              |
| R3    | [^)\n] for backtracking, anchored session counter regex                     | 5 checker files   | R2 guards insufficient             |
| R4    | CI blocker: RegExp constructor with variable → indexOf                      | file-io-safety.js | patterns:check not run before push |

**Avoidable rounds:** 0.5 (R4 CI blocker). Running `npm run patterns:check`
before R3 push would have caught it.

##### Chain 4: metrics-reporting.js Enhancement (R1→R2→R3→R4, 4 rounds)

| Round | What Happened                                           | Files Affected            | Root Cause                      |
| ----- | ------------------------------------------------------- | ------------------------- | ------------------------------- |
| R1    | Basic pattern compliance                                | tdms/metrics-reporting.js | Initial compliance              |
| R2    | Warning emoji regex, table header                       | tdms/metrics-reporting.js | New edge cases from review      |
| R3    | Invalid JSONL surfacing (TMR-103A), header skip         | tdms/metrics-reporting.js | Missing diagnostic              |
| R4    | invalidCount early returns, null vs falsy (5 locations) | tdms/metrics-reporting.js | Truthy checks rejecting valid 0 |

**Avoidable rounds:** 0.5. Null vs falsy (R4) is a known anti-pattern.

##### Chain 5: Qodo Self-Contradiction (R3→R4, 2 rounds)

| Round | What Happened                                              | Files Affected        | Root Cause                  |
| ----- | ---------------------------------------------------------- | --------------------- | --------------------------- |
| R3    | Qodo: "remove \b word boundaries from callsite detection"  | precommit-pipeline.js | Reviewer suggestion         |
| R4    | Qodo: "add \b word boundaries back" — resolved via indexOf | precommit-pipeline.js | Reviewer self-contradiction |

**Avoidable rounds:** 0 (Reviewer error).

##### Chain 6: check-propagation.js grep→git grep→POSIX (R5→R6+, 3 commits)

| Round | What Happened                                                         | Files Affected       | Root Cause                       |
| ----- | --------------------------------------------------------------------- | -------------------- | -------------------------------- |
| R5    | CC >15 (26). Extracted 3 helpers. Qodo: grep→git grep for portability | check-propagation.js | CC reduction + valid suggestion  |
| R6+   | git grep with \s and \b fails (POSIX ERE). Fixed to [[:space:]]       | check-propagation.js | \s/\b not supported in POSIX ERE |

**Avoidable rounds:** 0.5. Should have used POSIX-safe patterns from the start.

##### Chain 7: lstatSync Propagation Across 4 State-Managers (R5→R6, 2 rounds)

| Round | What Happened                                                   | Files Affected           | Root Cause                       |
| ----- | --------------------------------------------------------------- | ------------------------ | -------------------------------- |
| R5    | Qodo: use lstatSync for symlink safety in hook state-manager    | hook/state-manager.js    | Valid security suggestion        |
| R6    | Same issue in 3 other forked state-managers (pr, session, tdms) | 4 state-manager.js files | Propagation miss — fix 1, miss 3 |

**Avoidable rounds:** 0.5. Propagation check (9th time recommended).

##### Chain 8: Gemini Stale Review (R5→R7, 2 rounds)

| Round | What Happened                                | Files Affected                   | Root Cause                   |
| ----- | -------------------------------------------- | -------------------------------- | ---------------------------- |
| R5    | Gemini: 3 sanitizeInput fixes on error paths | session-start.js                 | Valid at time of review      |
| R7    | Same 3 items — already fixed in R5           | session-start.js, state-utils.js | Gemini reviewed stale commit |

**Avoidable rounds:** 0 (reviewer lag, not our code).

**Total avoidable rounds across all chains: ~4.5 out of 7 (~64%)**

6 files appeared in ALL R1-R4 rounds: code-quality-security.js,
precommit-pipeline.js, state-integration.js (hook); data-quality-dedup.js,
metrics-reporting.js, pipeline-correctness.js (TDMS). check-propagation.js
appeared in R5, R6+, and R7.

#### Rejection Analysis

| Category                        | Count | Rounds | Examples                                                           |
| ------------------------------- | ----- | ------ | ------------------------------------------------------------------ |
| Path traversal (false positive) | 3     | R2     | "Validate rootDir" — hardcoded constant, not user-controlled       |
| Command injection (FP)          | 1     | R2     | "Sanitize patchContent" — patches are display-only                 |
| JSON.stringify replacer (FP)    | 1     | R2     | "Add replacer function" — works as-is                              |
| Stale CI result                 | 2     | R3, R7 | docs:check / lint passes locally, stale CI cache                   |
| Qodo self-contradiction         | 1     | R4     | R3 "remove \b" → R4 "add \b back"                                  |
| Human-verify (amber compliance) | 3     | R5     | MCP server names, missing user context, limited validation         |
| Architectural (out of scope)    | 1     | R5     | Replace custom tooling with SonarQube/CodeQL                       |
| Already-fixed (stale review)    | 6     | R6, R7 | commit-tracker fields; regex char present; Gemini sanitizeInput ×3 |
| Git pathspec works correctly    | 1     | R7     | git grep `**/*.js` tested, 23 matches found                        |
| SonarCloud QG self-resolved     | 2     | R7     | 0 hotspots, 0.0% duplication at re-check                           |
| Infrastructure (GitHub API)     | 1     | R7     | HttpError: Unexpected end of JSON input — API infra                |
| Already-passing CI              | 1     | R7     | CI lint/test passes locally — stale run                            |

**Rejection accuracy:** 29/29 correct (100%).

**False-positive rate by source:** Qodo Compliance ~15%, Qodo PR ~8%, Gemini
~30% (stale reviews), SonarCloud 0%, CI ~25% (stale results).

#### Recurring Patterns (Automation Candidates)

| Pattern                         | Rounds   | Already Automated?    | Recommended Action                                        | Est. Effort |
| ------------------------------- | -------- | --------------------- | --------------------------------------------------------- | ----------- |
| isInsideTryCatch fragility      | R2,R3,R4 | No (4 AST DEBT items) | Replace regex heuristics with AST parser (DEBT-7559–7562) | E1 (~2hr)   |
| Self-referential set validation | R2       | No                    | Already in CODE_PATTERNS.md (prior retro action)          | Done        |
| POSIX ERE in git grep           | R5→R6+   | Fixed ad-hoc          | Add [[:space:]] convention to CODE_PATTERNS.md            | ~5 min      |
| lstatSync propagation miss      | R5→R6    | check-propagation.js  | Propagation script now automated; was process-only before | Done        |
| Stale reviewer comments         | R5, R7   | No                    | Add note to pr-review Step 1.4                            | ~5 min      |
| Lazy-load typeof guard          | R5→R7    | No                    | Add to FIX_TEMPLATES.md as standard lazy-load pattern     | ~5 min      |

#### Previous Retro Action Item Audit

| Retro          | Recommended Action               | Implemented?     | Impact on #388 R5-R7                                   |
| -------------- | -------------------------------- | ---------------- | ------------------------------------------------------ |
| PR #388 (R1-4) | Heuristic test matrices          | **NOT DONE**     | No impact (no new heuristics in R5-R7)                 |
| PR #388 (R1-4) | Run patterns:check before push   | **YES**          | R5+ ran patterns:check; eliminated CI pattern cascades |
| PR #388 (R1-4) | Split multi-skill PRs            | **NOT FOLLOWED** | Still 36+ files → continued churn through R7           |
| PR #386        | S5852 recursive regex audit      | **YES**          | R5 SonarCloud replaceAll() caught by pre-check         |
| PR #386        | Small PRs = fewer rounds         | **NOT FOLLOWED** | Direct impact: 7 rounds total                          |
| PR #384        | Propagation protocol enforcement | **PARTIAL**      | R6 propagated lstatSync ×4; R7 propagated typeof ×2    |

**Total avoidable rounds from unimplemented retro actions: ~1**

#### Cross-PR Systemic Analysis

| PR       | Rounds | Total Items | Avoidable Rounds | Rejections | Key Issue                           |
| -------- | ------ | ----------- | ---------------- | ---------- | ----------------------------------- |
| #379     | 11     | ~119        | ~8               | ~61        | Evidence algorithm + protocol       |
| #382     | 3      | 76          | ~1               | 13         | Severity/dedup incremental          |
| #383     | 8      | ~282        | ~4               | ~90        | Symlink/atomic/catch                |
| #384     | 4      | 197         | ~2.5             | ~18        | CI pattern cascade + CC             |
| #386     | 2      | 25          | ~1               | 1          | S5852 regex + CC                    |
| **#388** | **7**  | **144**     | **~4.5**         | **29**     | **Heuristic + regex + propagation** |

**Persistent cross-PR patterns:**

| Pattern                          | PRs Affected   | Times Recommended | Status                        | Required Action                                       |
| -------------------------------- | -------------- | ----------------- | ----------------------------- | ----------------------------------------------------- |
| CC lint rule                     | #366-#371      | 5x                | **RESOLVED** (pre-commit)     | None                                                  |
| Qodo suppression                 | #369-#384      | 4x                | **RESOLVED** (pr-agent.toml)  | None                                                  |
| Propagation check                | #366-#388      | **9x**            | **PARTIAL** (script + manual) | check-propagation.js exists but only in pre-push hook |
| Local patterns:check before push | #384-#388      | 3x                | **RESOLVED** (pre-push hook)  | Now enforced in pre-push                              |
| Large PR scope → more rounds     | #383-#388      | **4x**            | Acknowledged                  | Split multi-skill PRs — strongest signal in dataset   |
| Stale reviewer comments          | **#388 (new)** | 1x                | Not checked                   | Verify reviewer HEAD in Step 1.4                      |

#### Skills/Templates to Update

1. **pr-review SKILL.md Step 1.4:** Add "Verify reviewer comments are on current
   HEAD" (~5 min — do now)
2. **FIX_TEMPLATES.md:** Add Template #37: standard lazy-load with typeof guard
   (~5 min — do now)
3. **CODE_PATTERNS.md:** Add "POSIX ERE: use [[:space:]] not \s in git grep" (~5
   min — do now)
4. **pr-retro SKILL.md:** Add Pattern 10: stale reviewer comments (~5 min)

#### Process Improvements

1. **Large PR scope is the #1 systemic driver** — 36+ files, 7 rounds, 144
   items. Compare #386 (5 files, 2 rounds, 25 items). 7x more files = 3.5x more
   rounds. Evidence: all chains, all rounds. **4th retro recommending split.**
2. **Propagation is now partially automated** — check-propagation.js runs in
   pre-push hook. R6's lstatSync fix across 4 files was manual; R7's typeof fix
   propagated to commit-failure-reporter.js. 9th recommendation partially
   resolved.
3. **Multi-source review has diminishing returns** — R5 added SonarCloud+Gemini
   (25 items). R7 showed Gemini reviewing stale code (3 FPs) and SonarCloud QG
   self-resolving. Net R5-R7: ~16 real items, ~10 noise. Evidence: R7 (9 items,
   8 rejected).
4. **Review convergence achieved** — Items: 42→22→16→16→25→14→9. R7 had 1 real
   fix, suggesting codebase is stabilized for this PR.

#### Verdict

PR #388 had a **moderately inefficient review cycle** — 7 rounds with 144 items,
108 fixed. ~4.5 of 7 rounds were partially avoidable (~64%), driven by
isInsideTryCatch heuristic ping-pong (1 round), data-quality-dedup progressive
hardening (1.5 rounds), regex safety escalation (0.5 rounds), POSIX ERE
incompatibility (0.5 rounds), and lstatSync propagation miss (0.5 rounds).

**Trend: Regression from #386, correlated with PR scope.** Round count: #384(4)
→ #386(2) → **#388(7)**. Items/round: #386(12.5) → **#388(20.6)**. Rejection
rate: #386(4%) → **#388(20.1%)**. The high R5-R7 rejection rate is driven by
stale reviewer comments and SonarCloud QG self-resolution.

**The single highest-impact change:** Split multi-skill PRs into
one-skill-per-PR. This is now a **4x recommended action** (#383, #384, #386,
#388) with overwhelming evidence: 5-file PRs get 2 rounds; 36-file PRs get 7.
Every additional skill/module adds ~1.5 review rounds on average.

**Positive signal:** Review converged cleanly — R7 had only 1 real fix.
check-propagation.js partially automates the 9x-recommended propagation check.
Pre-push pattern compliance eliminated CI cascades (#384 R2's 112 violations).

---

#### Review #372: PR #388 R1 (2026-02-23)

- **Source**: CI (Doc Lint + Pattern Compliance), Qodo Compliance, Qodo PR
  Suggestions, Gemini Code Review
- **PR**: Ecosystem audit skills (hook, session, TDMS)
- **Total items**: 42
- **Fixed**: 34
- **Deferred**: 8 (AST replacements x4, command injection, DRY consolidation,
  KNOWN_HOOKS hardcoded, dual-write duplication)
- **Rejected**: 0

**Key patterns**: Broken doc links (3), exec()-in-while→matchAll conversion (~20
instances across 10 files), loadConfig/require wrapped in try/catch (9 files),
renameSync+rmSync (3 files), Variable in RegExp→helper function extraction (3
files), division-by-zero guards (4 instances), non-deterministic JSON→sorted
keys, duplicate finding IDs, missing vs empty file differentiation

**Deferred DEBT IDs**: DEBT-7559 to DEBT-7566 (AST parsers x4, command
injection, DRY x2, hardcoded hooks)

**Lesson**: Pattern checker does line-by-line regex analysis — it cannot track
that a regex defined on line N has /g when exec() is on line N+2, or that
require() on a line is inside a try/catch block. Solutions: (1) convert
exec()/while to matchAll() which doesn't need /g tracking, (2) add files to
verified-patterns.json for confirmed false positives, (3) extract
`new RegExp(variable)` into named helper functions.

---

#### Review #373: PR #388 R2 (2026-02-23)

- **Source**: CI (docs:check), Qodo Compliance, Qodo PR Suggestions
- **PR**: Ecosystem audit skills (hook, session, TDMS) — continued
- **Total items**: 22
- **Fixed**: 17
- **Deferred**: 0
- **Rejected**: 5 (path traversal x3 — rootDir not user-controlled, command
  injection — patches are display-only, JSON.stringify replacer — works as-is)

**Key patterns**: Broken reference detection logic (mergedFromIds set was built
from same data it checked — always returned true), parseInt fails on
comma-formatted numbers (1,234), overlapping regex patterns (readFile matches
readFileSync), unbounded regex backtracking on large files, nested parentheses
in console.log regex, incomplete regex escaping (only dots vs full
metacharacters)

**Lesson**: When building a "known good" set to filter against, verify the set
is populated from a DIFFERENT data source than the items being checked.
Self-referential filtering (checking if X is in a set built from X) is a logic
bug that makes the check always pass.

---

#### Review #374: PR #388 R3 (2026-02-23)

- **Source**: CI (docs:check — false alarm, passes locally), Qodo PR Suggestions
- **PR**: Ecosystem audit skills (hook, session, TDMS) — continued
- **Total items**: 16 (1 CI false alarm, 14 Qodo code suggestions, 1 generic)
- **Fixed**: 14
- **Deferred**: 1 (DEBT-7567: safeReadFile error swallowing, 25+ instances, S2)
- **Rejected**: 1 (CI docs:check — passes locally, was stale CI result)
- **Key patterns**: Heuristic accuracy (isInsideTryCatch brace direction), regex
  backtracking prevention ([^)\n] instead of [^)]), false positive reduction
  (writesMaster fallback, table header skip, callsite word boundaries)

#### Review #376: PR #392 R1 (2026-02-25)

- **Source**: SonarCloud (2), Qodo Compliance (1), Gemini (2), Qodo PR
  Suggestions (13)
- **Total Items**: 18 (8 fixed, 3 minor fixed, 7 rejected/deferred)
- **Key Fix**: `checkKnownPatterns()` in check-propagation.js had logic flaw
  where `changedInArea` checked `unguardedFiles` instead of `uniqueMatches` —
  fixed files were excluded before the area check, making the check always skip.
- **Pattern**: git glob pathspecs require `:(glob)` prefix when using
  `execFileSync` (no shell expansion). Silent failure without it.
- **Pattern**: Empty catch blocks on `execFileSync` should check
  `err.status === 1` specifically, not swallow all errors.
- **Rejected**: S4036 (PATH binary hijacking) — `execFileSync("git",...)` uses
  hardcoded binary name, safe. Qodo raw audit entry removal —
  pipeline-generated.

#### Review #377: PR #392 R2 (2026-02-25)

- **Source**: SonarCloud (1), Qodo Compliance (3 repeat-rejected), Qodo PR
  Suggestions (9)
- **Total Items**: 13 (6 fixed, 3 repeat-rejected, 4 deferred)
- **Key Fix**: `changedInArea` R1 fix was incomplete — checking `uniqueMatches`
  still misses files where the pattern was removed. Directory overlap approach
  correctly detects when dev is working in an area with the pattern.
- **Pattern**: `String(err)` on exec error objects produces `[object Object]` —
  use `err.message` or structured access instead.
- **Pattern**: Always reset `regex.lastIndex = 0` before `.test()` in loops to
  prevent stateful regex bugs.
- **3 Qodo Compliance items repeat-rejected** (same justification as R1 #376)

#### Review #378: PR #392 R4 (2026-02-25)

- **Source**: Qodo Compliance (3), SonarCloud (1), Qodo PR Suggestions (14)
- **Total Items**: 18 (15 fixed, 3 rejected)
- **Key Fix**: `excludeFilePattern` for statSync-without-lstat missed
  `.isSymbolicLink()` method calls — added alternate branch to regex.
- **Key Fix**: `changedPaths` normalization didn't strip `./` prefix, causing
  path comparison mismatch with `findPatternMatches` output.
- **Pattern**: Cross-platform path normalization must happen BEFORE string
  checks (includes, endsWith) — not just before filesystem calls.
- **Pattern**: In `--blocking` mode, unexpected git grep failures should
  `process.exit(1)` not just warn.
- **Data Quality**: JSONL audit records had `verified_by: true` (boolean)
  instead of `"auto"` (string), `file:linenum` in file field, directory-only
  paths. Fixed 111 audits.jsonl + 764 normalized-all.jsonl records.
- **Rejected**: S5852 regex DoS on `/\/+$/` — single char class + quantifier
  anchored to `$`, no backtracking. First flag (two-strikes N/A).
- **Rejected**: `filterUnguardedFiles` fail-open → fail-closed — fail-open is
  correct for security pattern detection (false negatives worse than false
  positives).
- **Rejected**: Structured logging for CLI script — `console.log` is correct
  pattern for pre-push hooks.

#### Review #378: PR #392 R3 (2026-02-25)

- **Source**: Qodo PR Suggestions (5)
- **Total Items**: 5 (3 fixed, 2 deferred pipeline-generated)
- **Key Fix**: `path.dirname` on Windows returns backslash paths even for POSIX
  inputs — must use string-based `posixDirname` for cross-platform.
- **Pattern**: `\b` is NOT valid in POSIX ERE (`git grep -E`). Use
  `(^|[^[:alnum:]_$])` as word boundary equivalent.
- **Pattern**: Security/lint checkers should fail-open (return true = flag it)
  not fail-closed (return false = skip it) on read errors.

#### Review #375: PR #389 R1 (2026-02-24)

- **Source**: SonarCloud (1), Qodo Compliance (3), CI Pattern Check (35
  blocking), Gemini Code Assist (18)
- **PR**: Ecosystem audit expansion — doc, script, skill audits + skill trimming
- **Total items**: 57
- **Fixed**: 55
- **Deferred**: 0
- **Rejected**: 2 (Gemini "use ESLint custom rules instead of static analysis" —
  architectural suggestion beyond PR scope; Gemini "duplicate safeReadFile" —
  only one definition found in file)
- **Key patterns**:
  - **Pattern checker false positives**: `exec-without-global` checker only
    inspects the `while` line, not the regex definition line above. Added 6
    files to verified-patterns.json. `unguarded-loadconfig` lookahead window (30
    chars) too small for multi-require try/catch blocks — added 4 files.
  - **Path traversal in new audit checkers**: 4 files lacked containment guards
    on `path.resolve()` results. Added `/^\.\.(?:[\\/]|$)/.test(rel)` guards.
  - **Dedup function O(n²)**: `deduped[deduped.indexOf(existing)]` pattern in 3
    audit runners — replaced with Map-based O(n) approach.
  - **Chained replace regex bug**: `.replace(/-audit$/, "-ecosystem-audit")`
    double-transforms names already containing `-ecosystem-audit`. Fixed with
    negative lookbehind `(?<!-ecosystem)`.
  - **Hardcoded finding IDs**: `id: "SIA-400"` in loop produces duplicates.
    Fixed with counter suffix.

#### Review #375: PR #388 R4 (2026-02-23)

- **Source**: CI (pattern compliance blocker), Qodo PR Suggestions
- **PR**: Ecosystem audit skills (hook, session, TDMS) — continued
- **Total items**: 16
- **Fixed**: 15 (CI blocker: indexOf replaces regex, brace depth corrected,
  iterative DFS, BigInt handling, invalidCount early returns, null vs falsy
  checks, paired quotes, raw path regex, matcher validation, scoped function
  body checks, nearest stage attribution, writesDeduped fallback removal, hook
  path priority extraction, TMR-200A invalidCount)
- **Deferred**: 0
- **Rejected**: 1 (item [16] — Qodo self-contradicted R3 suggestion about \b
  word boundaries; resolved by indexOf approach)
- **Key patterns**: Qodo self-contradiction (R3 "remove \b" → R4 "add \b back",
  resolved by indexOf), CI pattern compliance blocker from RegExp constructor
  with variable, backward brace scanning direction (R3 got it wrong, R4
  corrected), null vs falsy distinction for safeReadFile returns

#### Review #376: PR #388 R5 (2026-02-24)

- **Source**: SonarCloud (5), CI Pattern Compliance (12 blocking), Gemini Code
  Assist (3), Qodo Compliance (4), Qodo PR Suggestions (4)
- **PR**: Ecosystem audit skills (hook, session, TDMS) — review fixes
- **Total items**: 25 (1 CRITICAL, 5 MAJOR, 7 MINOR, 1 TRIVIAL, 3 human-verify,
  1 rejected)
- **Fixed**: 14 (CC reduction searchForFunction 26→~10 via 3 extracted helpers,
  funcName regex escaping + String.raw, unused imports removed, silent error
  swallowing→diagnostic warning, incorrect test predicate logic, optional
  chaining, sanitizeInput on 3 error paths, isSafeToWrite typeof guard,
  duplicated test helper extracted, verified-patterns.json for 3 new files +
  state-utils.js atomic write FP)
- **Deferred**: 0
- **Rejected**: 4 (3 amber compliance items requiring human verification — MCP
  server names in stdout, missing user context in audit entries, limited
  subagent_type validation; 1 architectural — replace custom tooling with
  SonarQube/CodeQL)
- **Key patterns**: CC helper extraction (escapeForRegex, shouldSkipMatch,
  parseGrepLine), verified-patterns.json false positive management, silent error
  swallowing is a recurring Qodo compliance finding (see also PR #388 R3
  DEBT-7567)

#### Review #377: PR #388 R6 (2026-02-24)

- **Source**: Qodo Compliance (5), Qodo PR Suggestions (6), CI Pattern
  Compliance (3 blocking), SonarCloud (1)
- **PR**: Ecosystem audit skills (hook, session, TDMS) — review fixes
- **Total items**: 14 (3 MAJOR, 7 MINOR, 2 TRIVIAL, 3 REJECTED)
- **Fixed**: 11 (CI blockers: pre-push xargs -r, mktemp trap ordering, grep
  simplification; silent write skip warning added to track-agent-invocation;
  statSync→lstatSync + symlink check across 4 state-managers; error output
  truncation across 4 state-managers; git grep portability in
  check-propagation.js; replaceAll() over replace(); dedup logic improved in
  test helper; normalized-all.jsonl deduped 1685 duplicate entries)
- **Deferred**: 0
- **Rejected**: 3 ([2] commit-tracker already has author+session fields; [4]
  commit messages are public git data, already sanitized; [5] regex [gimsuy]
  already contains 'i' — Qodo false positive)
- **Key patterns**: Propagation of lstatSync fix across 4 forked
  state-manager.js files prevented 4+ potential future review rounds. JSONL
  dedup removed 1685 entries (31% of file was duplicated). Pre-push shell script
  pattern compliance is now enforced in CI.

#### Review #378: PR #388 R7 (2026-02-24)

- **Source**: Qodo PR Suggestions (2), Gemini Code Assist (3), SonarCloud QG
  (2), CI Checks (2)
- **PR**: Ecosystem audit skills — review fixes
- **Total items**: 9 (1 MINOR, 8 REJECTED)
- **Fixed**: 1 + 2 propagation (typeof guard on lazy-loaded isSafeToWrite import
  in track-agent-invocation.js, propagated to commit-failure-reporter.js with
  isSafeToWrite + sanitizeInput; pre-existing startsWith() pattern violation
  also fixed in commit-failure-reporter.js)
- **Deferred**: 0
- **Rejected**: 8 ([2] git grep glob works correctly via pathspec — tested;
  [3-5] Gemini sanitizeInput × 3 — already present in current code, stale
  review; [6-7] SonarCloud QG now passes — 0 hotspots, 0.0% duplication; [8] CI
  lint/test passes locally — stale run; [9] GitHub API infrastructure error, not
  our code)
- **Key patterns**: Lightest review round in PR #388 series (1 real fix vs 11-15
  in prior rounds). SonarCloud QG self-resolved between scans. Gemini reviewed
  stale commit (pre-R6 code), producing 3 false positives — always verify
  reviewer is commenting on current HEAD. Propagation check caught same
  lazy-load pattern in commit-failure-reporter.js.

#### Review #379: PR #388 R1 (2026-02-24)

- **Source**: Gemini Code Assist (1), Qodo PR Suggestions (7)
- **PR**: PR #388 retrospective + retro action items
- **Items**: 8 total — 7 fixed, 0 deferred, 1 tracked to TDMS (pre-existing)
- **Patterns**: Data inconsistency in retro metrics (Fixed count mismatch, R7
  breakdown exceeds total), incorrect syntax in documented patterns
  (`=== null || === undefined` → `== null`, POSIX ERE word boundaries),
  duplicate section numbering, undefined variable in example code, broken
  markdown table row
- **Key Learning**: docs:index script has a date regression bug — "Last
  Modified" dates revert to older values. Pre-existing, tracked as TDMS item.

---

#### Review #380: PR #390 R2 (2026-02-24)

- **Source**: Qodo PR Suggestions (7)
- **PR**: PR #390 — cherry-pick of PR #388 retro action items + docs:index fix
- **Items**: 7 total — 7 fixed, 0 deferred, 0 rejected
- **Patterns**: Use committer date (%cI) not author date (%aI) to prevent date
  regression from cherry-picks/rebases; cache git log results per file for
  performance; normalize backslashes in git paths for Windows; use fd 0 not
  process.stdin.fd for cross-platform stdin; POSIX ERE word boundary guidance
  updated to `git grep -w` or explicit groups; retro metrics consistency (PR
  label, fixed count)
- **Key Learning**: getLastModifiedDate needed 3 improvements in one pass (date
  format, caching, path normalization) — combining related suggestions prevents
  incremental fix rounds.

---

#### Review #381: PR #390 R3 (2026-02-24)

- **Source**: SonarCloud (1 hotspot, 1 code smell), Qodo Compliance (1), Qodo PR
  Suggestions (3)
- **PR**: PR #390 — cherry-pick review fixes (R3)
- **Items**: 6 total — 4 fixed, 0 deferred, 2 rejected
- **Fixed**: `--follow` flag for git log rename tracking, `.has()` for Map cache
  check, canonicalized cache key with forward slashes, `replaceAll()` over
  `replace()` (propagated to 2 additional instances in same file)
- **Rejected**: SonarCloud S4036 PATH hotspot — `execFileSync("git", [...])` is
  hardcoded command with array args, no shell injection risk, local-only script,
  same pattern in 10+ scripts; Qodo swallowed exceptions — catch blocks are
  intentional graceful degradation with fallback chain, not silent error
  swallowing
- **Patterns**: Combine cache key normalization with cache check improvement in
  single pass; propagate `replaceAll` to all same-file instances
- **Key Learning**: SonarCloud S4036 on `execFileSync` with hardcoded binary +
  array args is a standard false positive for local tooling scripts.

---

#### Review #382: PR #390 R4 (2026-02-24)

- **Source**: Qodo Compliance (2), Qodo PR Suggestions (2)
- **PR**: PR #390 — cherry-pick review fixes (R4)
- **Items**: 4 total — 2 fixed, 0 deferred, 2 rejected
- **Fixed**: Deterministic fallback date ("UNKNOWN" sentinel replaces
  non-deterministic `new Date()`), fix rejected item numbering in learning log
- **Rejected**: PATH binary hijacking (repeat of R3 S4036 — same justification);
  swallowed exceptions (repeat of R3 — same justification)
- **Key Learning**: Qodo Compliance re-raises the same items across rounds even
  when already rejected. Mark as repeat-rejected without re-investigating.

---

#### Review #383: PR #393 R1 (2026-02-25)

- **Source**: Qodo Compliance (4), Qodo PR Suggestions (4), Gemini Code Review
  (1), CI Failure (1)
- **PR**: PR #393 — Over-engineering audit: hook consolidation, token reduction
- **Items**: 6 unique (after dedup) — 4 fixed, 0 deferred, 2 rejected
- **Fixed**: Atomic write pattern for log rotation (tmp+rename), quoted-value
  secret redaction (handle `"foo bar"` boundaries), failure output to stderr,
  linked gitdir resolution (worktree/submodule `.git` files)
- **Rejected**: (1) Swallowed errors in reportCommitFailure — by design,
  best-effort function that must never block; (2) Log rotation memory efficiency
  — 10KB file cap makes Buffer.alloc optimization unnecessary
- **Patterns**: Gemini and Qodo independently flagged the same redaction bug —
  confirms high-signal issue; CI blocking violation was real (non-atomic write)
- **Key Learning**: Secret sanitization must handle quoted values — space-based
  tokenization leaks secrets containing spaces. Always test redaction logic
  against `KEY="multi word secret"` patterns.

---

#### Review #384: PR #393 R2 (2026-02-26)

- **Source**: Qodo Compliance (5), Qodo PR Suggestions (4)
- **PR**: PR #393 — Over-engineering audit: hook consolidation, token reduction
- **Items**: 9 total → 6 unique — 2 fixed, 0 deferred, 4 rejected (5 Compliance
  items repeat-rejected, same justification as R1)
- **Fixed**: Bounds check for valueStart in redaction (edge case: `token=\n`),
  cross-platform log rotation with rmSync fallback for Windows
- **Rejected**: (1) gitdir path.dirname vs cwd — `dirname(cwd/.git)` === `cwd`,
  no functional change; (2) Restore pending-alerts.json loading — file is
  gitignored, doesn't exist, source removed in Overhaul W1.4; (3-7) 5 Compliance
  items repeat-rejected (sensitive log disclosure, swallowed errors, GIT_DIR
  validation, secure error handling — all same justification as R1 Review #383)
- **Key Learning**: Validate data-loss claims by checking if the referenced file
  exists, is generated by anything, and is gitignored before accepting.

---
