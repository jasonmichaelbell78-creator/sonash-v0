<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-10
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Archived Reviews #438-#476

Reviews archived from AI_REVIEW_LEARNINGS_LOG.md on 2026-03-10.

---

#### Review #476: Qodo R3 — fnm ripple effects, gitleaks hardening, cross-platform globs (2026-03-07)

**Source:** Qodo PR Compliance + Code Suggestions **PR/Branch:** #421
skill-audits **Suggestions:** 14 total (Critical: 2, Major: 3, Minor: 8,
Trivial: 1)

**Patterns Identified:**

1. fnm env without fnm use: Multiple shell scripts called
   `eval "$(fnm env ...)"` but not `fnm use`, meaning fnm's environment was set
   up but the project-specific Node version wasn't activated.
   - Root cause: fnm migration (PR #421) focused on ensure-fnm.sh wrapper but
     missed standalone scripts.
   - Prevention: Grep for `fnm env` after any fnm-related change; always pair
     with `fnm use`.

2. Cross-platform npm script quoting: Single quotes in npm scripts work on bash
   but not on Windows cmd.exe, where they're treated as literal characters.
   Node's `--test` glob could silently match zero files.
   - Root cause: Package.json test scripts written with Unix-first assumptions.
   - Prevention: Always use escaped double quotes (`\"..\"`) in package.json
     scripts for cross-platform compat.

3. Security gate bypass on tool errors: Gitleaks pre-commit check warned but
   didn't block when the scanner itself errored (exit code > 1), allowing
   commits to bypass the secret scan.
   - Root cause: Defensive "don't break the developer" approach didn't account
     for security gate semantics.
   - Prevention: Security scanners should fail-closed; non-security tools can
     fail-open.

**Resolution:**

- Fixed: 10 items
- Deferred: 0 items
- Rejected: 4 items (with justification)

**Key Learnings:**

- `$ARGUMENTS` in Claude Code hooks is runtime-set JSON, not untrusted input —
  safe to use unquoted in shell
- `eval "$(fnm env)"` is the standard documented pattern for fnm/nvm/rbenv — not
  a security issue
- When rejecting security scanner FPs, validate the actual data flow (who sets
  the variable, can it be influenced)
- Global template hooks should guard `fnm` with `command -v` since fnm may not
  be installed everywhere

---

#### Review #475: Qodo R4 — fnm eval safety, gitleaks regex, cwd determinism (2026-03-07)

**Source:** Qodo PR Compliance + Code Suggestions **PR/Branch:** #421
skill-audits **Suggestions:** 13 total (Critical: 0, Major: 3, Minor: 8,
Trivial: 2)

**Patterns Identified:**

1. fnm env eval without validation: `ensure-fnm.sh` ran `eval "$(fnm env ...)"`
   without checking exit status or empty output, silently swallowing init
   failures.
   - Root cause: R3 fixed standalone scripts but missed the central wrapper.
   - Prevention: Always capture command substitution output, validate non-empty,
     then eval.

2. Gitleaks regex false-positive: The fail regex `/(leaks found)/i` also matched
   success messages like "no leaks found", causing false alerts.
   - Root cause: Overly broad word-boundary regex without negative lookbehind.
   - Prevention: Use negative lookbehind `(?<!no\s)` for patterns that have
     negation variants.

3. Deterministic cwd for execFileSync: Two `execFileSync` calls in
   session-start.js used relative script paths without explicit `cwd`, while
   sibling calls already set `cwd: projectDir`.
   - Root cause: Inconsistency during incremental additions to the hook.
   - Prevention: When adding execFileSync with relative paths, always include
     `cwd`.

**Resolution:**

- Fixed: 11 items
- Deferred: 0 items
- Rejected: 2 items (with justification)

**Key Learnings:**

- Capture `$(command)` into a variable before `eval` — enables empty-output and
  exit-status validation
- Regex patterns for pass/fail detection need careful asymmetry — success
  strings often embed failure keywords with negation ("no leaks found")
- test:coverage script must be kept in sync with test script when adding new
  test suites
- Archive JSONL files accumulate duplicates when scripts append without
  deduplication — periodic cleanup needed

---

#### Review #474: Qodo R5 — eval input validation, maxBuffer, TDMS provenance (2026-03-08)

**Source:** Qodo PR Compliance + Code Suggestions **PR/Branch:** #421
skill-audits **Suggestions:** 10 total (Critical: 0, Major: 2, Minor: 6,
Trivial: 2)

**Patterns Identified:**

1. Eval input validation: Even after capturing fnm env output into a variable,
   the content should be screened for shell metacharacters (backticks, `$(`,
   semicolons) before eval — defense-in-depth against compromised binaries.
   - Root cause: R4 added capture-before-eval but not content validation.
   - Prevention: Any eval of external command output should validate content.

2. TDMS provenance gap: Manual debt entries created by `/add-debt` were missing
   the top-level `"source"` field that downstream tooling expects for filtering.
   - Root cause: `/add-debt` skill doesn't inject `"source"` field
     automatically.
   - Prevention: Check field parity with existing entries when appending JSONL.

**Resolution:**

- Fixed: 5 items (+ propagation to 12 TDMS entries across 2 files)
- Deferred: 0 items
- Rejected: 5 items (with justification)

**Key Learnings:**

- Defense-in-depth for eval: validate content even when the source is trusted
- JSONL entries need field parity auditing — missing fields cause silent
  downstream issues
- Repeat rejections across rounds indicate reviewer FP patterns (e.g.,
  `_errorsCount7d`, lookbehind compat) — consider `.qodo/pr-agent.toml` tuning
- `maxBuffer` should be set on any execFileSync with `stdio: "pipe"` to prevent
  silent truncation

---

#### Review #473: Qodo R6 — diminishing returns, JSONL data normalization (2026-03-08)

**Source:** Qodo PR Compliance + Code Suggestions **PR/Branch:** #421
skill-audits **Suggestions:** 10 total (Critical: 0, Major: 1, Minor: 7,
Trivial: 2)

**Patterns Identified:**

1. Diminishing returns in multi-round reviews: R6 had 8/10 items rejected —
   mostly repeats of `_errorsCount7d` (3rd time), `err.message` (2nd time), and
   eval hardening beyond defense-in-depth. Signal-to-noise ratio drops sharply
   after R4-R5 for this PR.

2. JSONL data normalization: Empty string `""` vs `null` for absent fields
   creates inconsistency for downstream consumers. Standardize on `null`.

**Resolution:**

- Fixed: 2 items (rev-436 completeness, `""` → `null` x7 entries x2 files)
- Deferred: 0 items
- Rejected: 8 items (3 repeats, 5 pre-existing/over-engineering)

**Key Learnings:**

- After 5+ rounds, most new items are repeat FPs or diminishing-value hardening
- Consider merging PR after R5 when fix rate drops below 30%
- JSONL empty fields should use `null` not `""` for consistency
- Suggested code with syntax errors should be rejected regardless of intent

---

#### Review #472: Mixed (Qodo + SonarCloud) R1 — ecosystem expansion test infrastructure (2026-03-09)

**PR:** #424 | **Source:** Qodo/CodeRabbit + SonarCloud | **Round:** R1 (3
parts)

**Scope:** 74 new test files from Ecosystem Expansion Phase 1-2. Massive
first-pass review covering test quality, security hotspots, code smells, and
modernization across health checkers, ecosystem audit tests, hook tests, and
debt pipeline tests.

**Key Findings:**

1. Health checker test mocks used zero-param default functions (`() => []`) but
   were called with args via spread — SonarCloud flagged as "expects no
   arguments but 1 provided." Fix: add unused params to defaults.

2. ReDoS risk in session counter regex `\s*:?\s*` — sequential lazy quantifiers
   on overlapping whitespace. Fix: collapse to single character class `[\s:]*`.

3. Broad catch blocks in ESM dynamic imports (health-log.test.js) silently
   swallowed syntax errors — only MODULE_NOT_FOUND should be caught.

4. 186 SonarCloud code smells across new test files — bulk modernization:
   `replaceAll`, `Number.parseInt`, `structuredClone`, optional chaining,
   `String.raw`, unused import cleanup, `Set` over `Array` for lookups.

5. Ecosystem audit integration tests had non-unique failure IDs, in-place
   finding mutation, and silent treatment of invalid severity values.

**Resolution:**

- Fixed: 197 items across 60+ files
- Deferred: 3 items (cognitive complexity refactors — architectural)
- Rejected: 6 items (test fixture passwords, safe Math.random, bounded regex)

**Key Learnings:**

- When mocking via mutable function refs, give the DEFAULT value a matching
  parameter signature — SonarCloud infers types from initial assignment
- `\s*:?\s*` is a common ReDoS pattern — collapse adjacent quantifiers on
  overlapping classes into `[\s:]*`
- Broad `catch {}` in test setup hides real failures — always catch specific
  error codes
- `structuredClone()` is a cleaner deep-clone than
  `JSON.parse(JSON.stringify())` and avoids edge cases with undefined,
  functions, and circular refs
- SonarCloud S2068 (hard-coded passwords) is a known FP for test fixtures that
  intentionally test password detection — reject with justification

---

#### Review #471: Qodo R2-3 — error handling, duplicate detection, cross-platform (2026-03-09)

**PR:** #424 | **Source:** Qodo Compliance + Code Suggestions | **Round:** R2-3

**Scope:** 13 Qodo suggestions across generate-test-registry.js, 7 ecosystem
audit integration tests, health-log.test.js, hook-pipeline.test.js, and
ecosystem state-manager tests.

**Key Findings:**

1. Swallowed catch blocks in `readdirRecursive` silently hide directory read
   failures. Fix: log with sanitizeError.

2. All 7 ecosystem audit integration tests had identical
   `allScores[cat] = score` without checking for duplicate category keys from
   different checkers. Fix: detect collision, emit warning finding, keep first
   value.

3. Broad `catch {}` in ESM dynamic import (health-log.test.js) silently skipped
   all errors. Fix: only catch MODULE_NOT_FOUND, rethrow others.

4. Hardcoded `/tmp` paths in 4 state-manager/regression tests break on Windows.
   Fix: `path.join(os.tmpdir(), ...)` — os was already imported.

**Resolution:**

- Fixed: 9 items (across 17 files with propagation)
- Deferred: 0 items
- Rejected: 4 items (CI step dedupe, registry sort, checker validation,
  fail-fast root)

**Key Learnings:**

- Duplicate category keys across checkers are a silent data-clobbering risk —
  always guard with `cat in allScores` check
- `safeWriteFileSync` satisfies pattern checker for symlink guard without manual
  isSafeToWrite calls
- Cross-platform test portability: always use `os.tmpdir()` instead of `/tmp`

---

#### Review #470: SonarCloud R2-2 — ReDoS regex simplification + CI exec blocker (2026-03-09)

**PR:** #424 | **Source:** SonarCloud Security Hotspots + CI | **Round:** R2-2

**Scope:** 11 SonarCloud security hotspots across test files and 1 script, plus
1 CI pattern compliance blocker. Focused on S5852 (ReDoS), S1523 (code injection
FP), S2245 (PRNG FP), S5443 (public dir FP).

**Patterns Identified:**

1. `main()/run()` stripping regex (`/^main\(\s*\)\s*;?\s*$/m`) used in 5 test
   files — multiple `\s*` quantifiers create polynomial backtracking risk.
   Applied two-strikes rule: replaced with string-based line comparison.

2. `(.+)\s*$` pattern in stepRegex — `.+` captures trailing spaces, then `\s*$`
   backtracks. Fix: remove redundant `\s*` since `.trim()` handles it.

3. `\s*` in ANY_PATTERNS alternations with `$` — replace with `[ \t]*` to
   eliminate newline-related backtracking paths.

4. CI pattern checker can't trace `/g` flag through array iteration — flagged
   `while(exec())` as missing /g even though patterns had it. Fix: use
   `matchAll()` which is both clearer and satisfies static analysis.

**Resolution:**

- Fixed: 8 items (1 CI blocker + 7 S5852 regex simplifications across 8 files)
- Deferred: 0 items
- Rejected: 3 items (S1523 string literal FP, S2245 test PRNG FP, S5443 test
  fixture path FP)

**Key Learnings:**

- Two-strikes rule works well for test isolation patterns — simple string
  comparison (`t === "main();"`) is more readable than the regex it replaces
- `[ \t]*` is a safe drop-in for `\s*` when matching within single lines —
  eliminates cross-line backtracking without changing behavior
- `matchAll()` is preferred over `while(exec())` — avoids both the real
  infinite-loop risk AND false positives from static analyzers

---

### PR #393 Retrospective (2026-02-26)

_Over-engineering audit: hook consolidation, token reduction, dead code cleanup.
PR scope: 44 files (+10,605/-many). 2 review rounds._

**Review Cycle Summary:**

| Metric      | Value                              |
| ----------- | ---------------------------------- |
| Rounds      | 2 (R1: 2026-02-25, R2: 2026-02-26) |
| Total items | 15 (6 unique R1 + 9 R2)            |
| Fixed       | 6                                  |
| Deferred    | 0                                  |
| Rejected    | 9 (5 Qodo repeats + 4 design/FP)   |

**Ping-Pong Chains:** None. Clean forward progression.

**Rejection accuracy:** 9/9 correct (100%).

**Key findings:** (1) Deletion-heavy PRs have lower review surface — 44 files
but only 2 rounds. (2) Gemini + Qodo convergence on quoted-value secret
redaction bug (high-signal multi-source agreement). (3) Qodo Compliance FP rate
78% — 5 repeats + 2 design rejections.

**Action items:** Add quoted-value secret redaction edge case tests. Pattern:
`KEY="multi word"` + `KEY=\n` boundary. Implemented in FIX_TEMPLATE #45.

**Verdict:** Efficient 2-round cycle. ~0 rounds avoidable. First 2-round PR in
the #384-#394 series.

---

### PR #390 Retrospective (2026-02-25)

_Incorporated into PR #391 dual retro above. See "Review Cycle Summary — PR
#390" section._

---

### PR #391 Retrospective (2026-02-25)

_Covers 3 review rounds. Reviews filed under "PR #389" naming due to branch
reuse (`claude/cherry-pick-commits-TNgtU`). Also includes PR #390 retro (4
rounds)._

#### Review Cycle Summary — PR #391

| Metric         | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| Rounds         | 3 (R1 2026-02-24, R2-R3 2026-02-25)                                      |
| Total items    | 122                                                                      |
| Fixed          | 108                                                                      |
| Deferred       | 0                                                                        |
| Rejected       | 7                                                                        |
| Stale          | 6 (R3 items already fixed in R1)                                         |
| Pre-fixed      | 1                                                                        |
| Files changed  | 153 (+31,797/-18,702)                                                    |
| Review sources | CI (Pattern Compliance), SonarCloud, Qodo Compliance+Suggestions, Gemini |

**Note:** Review numbering collision — Reviews #367/#368 duplicated for PR #389
vs PR #384. The PR #389 entries (lines ~2951/2983) use `####` h4 headers.

#### Per-Round Breakdown — PR #391

| Round     | Date       | Source                    | Items   | Fixed   | Rej.  | Stale | Key Patterns                                                                                   |
| --------- | ---------- | ------------------------- | ------- | ------- | ----- | ----- | ---------------------------------------------------------------------------------------------- |
| R1        | 2026-02-24 | CI+SonarCloud+Qodo+Gemini | 57      | 55      | 2     | 0     | CI pattern violations (35), path containment (4 files), dedup O(n²)→Map, chained replace regex |
| R2        | 2026-02-25 | Qodo+Gemini               | 25      | 22      | 2     | 0     | Path containment (6 files), lstatSync+symlink skip, code fence state machine, frontmatter      |
| R3        | 2026-02-25 | Qodo+Compliance           | 40      | 31      | 3     | 6     | symlink propagation, dedup IDs O(n²), YAML indentation, brace direction, DoS caps, abs reject  |
| **Total** |            |                           | **122** | **108** | **7** | **6** |                                                                                                |

**Trajectory:** 57 → 25 → 40. R3 spike from Qodo Compliance adding 6 stale items
(already fixed in R1) plus new propagation findings.

---

#### Review Cycle Summary — PR #390

| Metric         | Value                                           |
| -------------- | ----------------------------------------------- |
| Rounds         | 4 (R1–R4, all 2026-02-24)                       |
| Total items    | 25                                              |
| Fixed          | 20                                              |
| Deferred       | 0                                               |
| Rejected       | 4                                               |
| Tracked (TDMS) | 1 (pre-existing docs:index date bug)            |
| Files changed  | 10 (+942/-594)                                  |
| Review sources | Qodo Compliance+Suggestions, SonarCloud, Gemini |

#### Per-Round Breakdown — PR #390

| Round     | Date       | Source                | Items  | Fixed  | Rej.  | Key Patterns                                                                  |
| --------- | ---------- | --------------------- | ------ | ------ | ----- | ----------------------------------------------------------------------------- |
| R1        | 2026-02-24 | Gemini+Qodo           | 8      | 7      | 0     | Metrics inconsistency, pattern syntax, section numbering, undefined var       |
| R2        | 2026-02-24 | Qodo Suggestions      | 7      | 7      | 0     | Committer date (%cI), git log cache, backslash normalization, fd 0 stdin      |
| R3        | 2026-02-24 | SonarCloud+Qodo       | 6      | 4      | 2     | git --follow, .has() for Map, cache key normalization, replaceAll propagation |
| R4        | 2026-02-24 | Qodo Compliance+Sugg. | 4      | 2      | 2     | Deterministic date fallback, rejected numbering fix. 2 repeat rejections.     |
| **Total** |            |                       | **25** | **20** | **4** |                                                                               |

**Trajectory:** 8 → 7 → 6 → 4. Clean linear convergence.

---

#### Ping-Pong Chains

##### PR #391 Chain 1: Path Containment Guards (R1→R2→R3, 3 rounds)

| Round | What Happened                                                        | Files Affected             | Root Cause                    |
| ----- | -------------------------------------------------------------------- | -------------------------- | ----------------------------- |
| R1    | 4 files lacked containment guards on `path.resolve()` results        | 4 audit checker files      | New code without guards       |
| R2    | 6 MORE files had same issue (path containment on external file refs) | 6 additional checker files | Propagation miss from R1      |
| R3    | `resolveRelativePath` strips leading slashes from absolute paths     | Shared utility             | Edge case not caught in R1/R2 |

**Avoidable rounds:** 1.5. R2 propagation miss (should have grepped all checkers
in R1). R3 absolute path edge case was testable.

**Prevention:** After adding a security guard (path containment, symlink check,
etc.), immediately grep ALL similar files for the same missing guard.

##### PR #391 Chain 2: Symlink/lstatSync Propagation (R1→R2→R3, 3 rounds)

| Round | What Happened                                                     | Files Affected                     | Root Cause                    |
| ----- | ----------------------------------------------------------------- | ---------------------------------- | ----------------------------- |
| R1    | Some walkers used `statSync` without symlink check                | Audit runner files                 | New walker code               |
| R2    | `lstatSync` + `isSymbolicLink()` skip recommended for all walkers | module-consistency, code-quality   | Same pattern, different files |
| R3    | `collectScriptFiles` in 2 more files still had `statSync`         | content-quality, coverage-complete | Propagation miss from R2      |

**Avoidable rounds:** 1. R3 was a pure propagation miss.

**Prevention:** `check-propagation.js` should include `statSync→lstatSync`
pattern. This is the **10th propagation recommendation** across retros.

##### PR #391 Chain 3: Dedup ID Generation O(n²) (R1→R3, 2 rounds)

| Round | What Happened                                           | Files Affected                  | Root Cause                       |
| ----- | ------------------------------------------------------- | ------------------------------- | -------------------------------- |
| R1    | Dedup used `deduped[deduped.indexOf(existing)]` — O(n²) | 3 audit runner files            | Copy-paste from template         |
| R3    | 6 checker files had non-unique `id: "SIA-400"` in loops | 6 checker files across 3 audits | Same pattern, counter suffix fix |

**Avoidable rounds:** 0.5. R3 IDs were a different manifestation of same
dedup/uniqueness issue.

##### PR #390 Chain 1: Qodo Repeat Rejections (R3→R4, 2 rounds)

| Round | What Happened                                                           | Files | Root Cause                          |
| ----- | ----------------------------------------------------------------------- | ----- | ----------------------------------- |
| R3    | Rejected: PATH binary hijacking (S4036), swallowed exceptions           | 2     | Qodo Compliance standard findings   |
| R4    | SAME 2 items re-raised by Qodo Compliance. Re-rejected with same reason | 2     | Qodo doesn't track prior rejections |

**Avoidable rounds:** 1 (R4 entirely). Qodo Compliance re-raises rejected items.

**Prevention:** Add batch rejection note in PR for repeat Qodo compliance items.

##### PR #390 Chain 2: getLastModifiedDate Multi-Fix (R1→R2, 2 rounds)

| Round | What Happened                                                                   | Files | Root Cause                      |
| ----- | ------------------------------------------------------------------------------- | ----- | ------------------------------- |
| R1    | Section numbering, undefined var, pattern syntax in retro action items          | 3     | Documentation quality issues    |
| R2    | 3 improvements in same function: date format (%cI), caching, path normalization | 1     | Related suggestions not batched |

**Avoidable rounds:** 0.5. R2's 3 improvements could have been anticipated as a
single refactor pass in R1 if the function was examined holistically.

**Total avoidable rounds: PR #391 ~3 of 3, PR #390 ~1.5 of 4 = ~4.5 of 7 total
(~64%)**

---

#### Rejection Analysis

##### PR #391 Rejections (7/122 = 5.7%)

| Category                     | Count | Round | Examples                                                          |
| ---------------------------- | ----- | ----- | ----------------------------------------------------------------- |
| Architectural (out of scope) | 2     | R1    | "Use ESLint custom rules", "Duplicate safeReadFile"               |
| Silent catch (intentional)   | 3     | R2,R3 | safeReadFile/safeRequire catches — graceful degradation by design |
| Pre-fixed (stale)            | 1     | R2    | auditName negative lookbehind already applied                     |
| Finding snippets local       | 1     | R2    | Audit snippets are local-only, no sanitization needed             |

##### PR #390 Rejections (4/25 = 16%)

| Category                   | Count | Round | Examples                                                |
| -------------------------- | ----- | ----- | ------------------------------------------------------- |
| PATH binary hijacking (FP) | 2     | R3,R4 | `execFileSync("git")` — hardcoded cmd, array args, safe |
| Swallowed exceptions (FP)  | 2     | R3,R4 | Intentional graceful degradation with fallback chain    |

**Overall rejection accuracy:** 11/11 correct (100%).

**FP rate by source:** Qodo Compliance ~20% (repeat items inflate), Gemini ~10%
(stale review), SonarCloud S4036 ~100% for local tooling scripts, CI ~5%.

---

#### Recurring Patterns (Automation Candidates)

| Pattern                        | PRs Affected     | Rounds  | Already Automated? | Recommended Action                                        | Est. Effort |
| ------------------------------ | ---------------- | ------- | ------------------ | --------------------------------------------------------- | ----------- |
| Path containment propagation   | #391 R1→R2→R3    | 3       | No                 | Add path-containment to check-propagation.js patterns     | ~30 min     |
| lstatSync propagation          | #388 R5→R6, #391 | 5       | Partial (script)   | Add statSync→lstatSync to propagation script              | ~15 min     |
| Qodo Compliance repeat reject  | #390 R3→R4       | 2       | No                 | Batch-reject known Qodo compliance repeats in PR comments | ~5 min      |
| Dedup/uniqueness in audit code | #391 R1, R3      | 2       | No                 | Add to audit skill template: unique ID + Map-based dedup  | ~10 min     |
| Review number collisions       | #389/#384 (#367) | Ongoing | No                 | Auto-increment from JSONL max to prevent numbering gaps   | ~20 min     |

---

#### Previous Retro Action Item Audit

| Retro   | Recommended Action                        | Implemented?             | Impact on #390/#391                                        |
| ------- | ----------------------------------------- | ------------------------ | ---------------------------------------------------------- |
| PR #388 | pr-review Step 1.4: Verify reviewer HEAD  | **YES** (1 match)        | R3 stale items caught faster                               |
| PR #388 | FIX_TEMPLATES #37: lazy-load typeof guard | **YES** (1 match)        | Not triggered in #390/#391                                 |
| PR #388 | CODE_PATTERNS.md: POSIX ERE               | **YES** (2 matches)      | No POSIX ERE issues in #390/#391                           |
| PR #388 | pr-retro Pattern 10: stale reviews        | **YES** (v2.6)           | Applied in #391 R3 stale item handling                     |
| PR #388 | Heuristic test matrices                   | **NOT DONE**             | No impact (no new heuristics)                              |
| PR #388 | Split multi-skill PRs                     | **NOT FOLLOWED**         | **DIRECT IMPACT**: #391 had 153 files, 3 rounds, 122 items |
| PR #386 | S5852 regex complexity pre-push           | **NOT DONE** (DEBT-7543) | No impact (no S5852 in #390/#391)                          |
| PR #386 | Small PRs = fewer rounds                  | **NOT FOLLOWED**         | Same as "split" above — 5th recommendation                 |

**Implemented rate: 4/8 (50%).** All 4 "do now" items from PR #388 retro were
implemented. The 2 process recommendations (split PRs, heuristic matrices) and 2
automation items (S5852 pre-push, test matrices) remain unimplemented.

---

#### Cross-PR Systemic Analysis

| PR       | Rounds | Total Items | Avoidable Rounds | Rejections | Key Issue                              |
| -------- | ------ | ----------- | ---------------- | ---------- | -------------------------------------- |
| #384     | 4      | 197         | ~2.5             | ~18        | CI pattern cascade + CC                |
| #386     | 2      | 25          | ~1               | 1          | S5852 regex + CC                       |
| #388     | 7      | 144         | ~4.5             | 29         | Heuristic + regex + propagation        |
| **#390** | **4**  | **25**      | **~1.5**         | **4**      | **Qodo repeats + date/cache fixes**    |
| **#391** | **3**  | **122**     | **~3**           | **7**      | **Path containment + symlink + dedup** |

**Persistent cross-PR patterns:**

| Pattern                           | PRs Affected | Times Recommended | Status                        | Required Action                                     |
| --------------------------------- | ------------ | ----------------- | ----------------------------- | --------------------------------------------------- |
| Large PR scope → more rounds      | #383-#391    | **5x**            | **NOT FOLLOWED**              | Split multi-skill PRs — strongest signal in dataset |
| Propagation check                 | #366-#391    | **10x**           | **PARTIAL** (script + manual) | Add path-containment + statSync patterns to script  |
| Qodo Compliance repeat rejections | #390, #382   | 2x                | Not automated                 | Batch-reject template for known false positives     |
| CC lint rule                      | #366-#371    | 5x                | **RESOLVED** (pre-commit)     | None                                                |
| Local patterns:check before push  | #384-#388    | 3x                | **RESOLVED** (pre-push hook)  | None                                                |

---

#### Skills/Templates to Update

1. **check-propagation.js:** Add `path.resolve.*containment` and
   `statSync→lstatSync` patterns (~30 min)
2. **Audit skill templates:** Add unique ID generation + Map-based dedup as
   standard patterns (~10 min)
3. **pr-review SKILL.md:** Add "batch-reject known Qodo Compliance repeat items
   (PATH hijack, swallowed exceptions)" (~5 min)
4. **reviews:sync script:** Auto-increment review numbers from JSONL max to
   prevent numbering collisions (~20 min)

---

#### Process Improvements

1. **Large PR scope remains the #1 systemic driver** — PR #391 had 153 files, 3
   rounds, 122 items. PR #390 had 10 files, 4 rounds, 25 items. Scope correlates
   with item count (15.3x files = 4.9x items) but not necessarily round count.
   **5th retro recommending split.** Evidence: all PRs >50 files get 100+ review
   items.
2. **Propagation is the persistent #2 driver** — 10th recommendation. PR #391
   had 2 propagation chains (path containment R1→R2, lstatSync R2→R3). The
   `check-propagation.js` script exists but doesn't cover path containment or
   statSync patterns. Adding these 2 patterns would eliminate ~1.5 rounds.
3. **PR #390 shows small PRs work** — 10 files, 4 rounds, but only 25 items
   (6.25 items/round). Rounds driven by Qodo repeat rejections, not real issues.
   Effective fix rate: 20/21 real items (95%) in 2 rounds.
4. **R1 review quality improving** — PR #391 R1 had 55/57 items fixed (96% fix
   rate). PR #390 R1 had 7/8 (88%). Both are strong first-round execution.

---

#### Verdict

**PR #391** had a **moderately efficient review cycle** — 3 rounds with 122
items, 108 fixed. ~3 of 3 rounds were partially avoidable (~100%), all driven by
propagation misses (path containment, lstatSync, dedup patterns). The massive
scope (153 files, +31K/-18K lines) is the root cause — impossible to catch all
propagation targets manually in a PR this large.

**PR #390** had an **efficient review cycle** — 4 rounds with 25 items, 20
fixed. ~1.5 of 4 rounds were avoidable (~38%), driven by Qodo Compliance
re-raising already-rejected items (R4 entirely avoidable). The small scope (10
files) kept item counts manageable.

**Trend: Mixed.** Round count: #388(7) → **#390(4)** → **#391(3)**. Items per
round: #388(20.6) → **#390(6.25)** → **#391(40.7)**. Rejection rate: #388(20%) →
**#390(16%)** → **#391(5.7%)**. PR #391's high items/round reflects massive
scope, not process regression. PR #390's clean cycle validates the "small PR"
recommendation.

**The single highest-impact change:** Add path-containment and
statSync→lstatSync patterns to `check-propagation.js`. This would have
eliminated ~2.5 rounds across both PRs. Combined with the 5x-recommended PR
scope reduction, these two changes would prevent ~80% of avoidable review
cycles.

**Positive signals:** (1) All 4 "do now" action items from PR #388 retro were
implemented. (2) PR #391 rejection rate dropped to 5.7% (best in series). (3) PR
#390 demonstrates small PRs converge faster. (4) Review number collision is a
data quality issue, not a process issue.

**Data quality issue:** Review numbers #367 and #368 are used for both PR #384
and PR #389, creating ambiguity in the learnings log. Recommend auto-increment
from JSONL max.

---

### PR #392 Retrospective (2026-02-25)

_Covers 4 review rounds on `check-propagation.js` pattern checker + JSONL data
quality fixes. PR scope: 5 files (+5,670/-4,673). First PR to follow "small
scope" recommendation._

#### Review Cycle Summary

| Metric          | Value                                                    |
| --------------- | -------------------------------------------------------- |
| Rounds          | 4 (R1–R4, all 2026-02-25)                                |
| Total items     | 54                                                       |
| Fixed           | 35                                                       |
| Deferred        | 4 (pipeline-generated JSONL, R1)                         |
| Rejected        | 12                                                       |
| Repeat-rejected | 3 (Qodo Compliance R2)                                   |
| Files changed   | 5 (1 script, 2 JSONL data, 1 JSONL sync, 1 doc)          |
| Diff size       | +5,670/-4,673 (JSONL churn inflates; script: +175/-175)  |
| Review sources  | SonarCloud, Qodo Compliance, Qodo PR Suggestions, Gemini |

#### Per-Round Breakdown

| Round     | Date       | Source                                             | Items  | Fixed  | Def.  | Rej.   | Severity                 | Files Modified                                                                                      | Key Patterns                                                                                                                                                                                                                                             |
| --------- | ---------- | -------------------------------------------------- | ------ | ------ | ----- | ------ | ------------------------ | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1        | 2026-02-25 | SonarCloud (2), Qodo (1), Gemini (2), Qodo PR (13) | 18     | 11     | 0     | 7      | 0C, 3 MAJ, 8 MIN, 7 TRIV | check-propagation.js, AI_REVIEW_LEARNINGS_LOG.md                                                    | checkKnownPatterns logic flaw (checked unguardedFiles not uniqueMatches), git glob :(glob) pathspec, empty catch swallowing all exit codes, toPosixPath(), TS/TSX coverage, secure logging                                                               |
| R2        | 2026-02-25 | SonarCloud (1), Qodo Compliance (3), Qodo PR (9)   | 13     | 6      | 4     | 3      | 0C, 2 MAJ, 7 MIN, 4 TRIV | check-propagation.js, AI_REVIEW_LEARNINGS_LOG.md                                                    | changedInArea R1 fix incomplete (directory overlap approach), String(err) → err.message, regex.lastIndex=0 before .test() in loops, toFsPath() for Windows FS API, defensive String() cast                                                               |
| R3        | 2026-02-25 | Qodo PR Suggestions (5)                            | 5      | 3      | 2     | 0      | 0C, 1 MAJ, 2 MIN, 2 TRIV | check-propagation.js, AI_REVIEW_LEARNINGS_LOG.md                                                    | path.dirname returns backslash on Windows even for POSIX inputs (replaced with posixDirname), \b invalid in POSIX ERE (use character class boundary), \s → [[:space:]], revert filterUnguardedFiles to fail-open                                         |
| R4        | 2026-02-25 | Qodo Compliance (3), SonarCloud (1), Qodo PR (14)  | 18     | 15     | 0     | 3      | 0C, 2 MAJ, 7 MIN, 9 TRIV | check-propagation.js, audits.jsonl, normalized-all.jsonl, deduped.jsonl, AI_REVIEW_LEARNINGS_LOG.md | excludeFilePattern missed .isSymbolicLink() method calls, changedPaths normalization missing ./ strip, shouldSkipMatch not POSIX-normalizing before string checks, --blocking fail-fast, param naming (p→filePath), JSONL data quality (111+764 records) |
| **Total** |            |                                                    | **54** | **35** | **4** | **12** |                          |                                                                                                     |                                                                                                                                                                                                                                                          |

**Trajectory:** 18 → 13 → 5 → 18. R3 convergence (5 items) then R4 spike from
JSONL data quality items (9 data records) and Qodo Compliance re-raising items.
Without JSONL data fixes, R4 would have been 9 items — clean convergence.

**Severity distribution across all rounds:** 0 CRITICAL, 8 MAJOR, 24 MINOR, 22
TRIVIAL. No security or data-loss issues — entirely code quality and robustness.

**Scope analysis — This-PR vs Pre-existing:**

| Origin              | Count | Rounds | Examples                                                |
| ------------------- | ----- | ------ | ------------------------------------------------------- |
| This-PR (code)      | 27    | R1–R4  | Logic flaws, path handling, naming, error handling      |
| This-PR (data)      | 9     | R4     | JSONL verified_by type, file:line, directory paths      |
| Pre-existing (data) | 6     | R4     | Truncated titles, empty file fields, section headers    |
| Repeat-rejected     | 3     | R2     | Qodo Compliance items from R1                           |
| Stale/pre-existing  | 5     | R1     | Already-addressed items, pipeline-generated artifacts   |
| Architectural       | 4     | R1, R4 | Pipeline JSONL structure, fail-open design, CLI logging |

---

#### Ping-Pong Chains

##### Chain 1: checkKnownPatterns Logic (R1→R2, 2 rounds)

| Round | What Happened                                                                                                                   | Files Affected           | Root Cause                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------- |
| R1    | `changedInArea` checked `unguardedFiles` instead of `uniqueMatches` — fixed files were excluded before the area check ran       | check-propagation.js:417 | Logic error: filter before check            |
| R2    | R1 fix (checking `uniqueMatches`) still incomplete — files where pattern was REMOVED no longer appear in `uniqueMatches` at all | check-propagation.js:428 | Edge case: grep can't find what was deleted |

**Resolution:** R2 introduced directory overlap approach — check if any changed
file shares a directory with unguarded files. This is semantically correct
because a developer working in a directory with unguarded files should see the
warning regardless of whether their fix removed the pattern.

**Avoidable rounds:** 0.5. The R2 edge case (removed pattern not appearing in
grep) was a genuine insight that required rethinking the approach. However, the
R1 fix could have been validated with a mental test matrix: "what happens when
dev fixes file A (removing the pattern) but file B in the same dir still has
it?"

**Prevention:** Before committing logic fixes for pattern-matching code, define
a test matrix: (1) pattern present+changed, (2) pattern present+unchanged, (3)
pattern removed+changed, (4) no pattern+changed. Validate each case.

##### Chain 2: Cross-Platform Path Handling (R3→R4, 2 rounds)

| Round | What Happened                                                                                                              | Files Affected                                    | Root Cause                                                |
| ----- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------- |
| R3    | `path.dirname` on Windows returns `scripts\check-propagation` (backslash) even for `scripts/check-propagation.js` (POSIX)  | check-propagation.js:62 (posixDirname introduced) | Node.js path module uses OS-native separators             |
| R4    | `shouldSkipMatch` used `file.includes()` on non-normalized paths; `changedPaths` in `checkKnownPatterns` didn't strip `./` | check-propagation.js:241, :419                    | R3 fixed dirname but didn't audit all string-based checks |

**Resolution:** R4 added `toPosixPath()` normalization at entry to
`shouldSkipMatch`, and `./` strip + `toPosixPath()` for `changedPaths` set in
`checkKnownPatterns`. This aligns with `findPatternMatches` which already
normalized with `.replace(/^\.\//, "")`.

**Avoidable rounds:** 0.5. After R3 introduced cross-platform dirname fix, a
propagation grep for all string-based path comparisons (`includes`, `endsWith`,
`has`) would have caught R4's issues. The pattern is: when fixing path handling,
audit ALL path comparisons in the same file, not just the one that broke.

**Prevention:** New pattern: "When fixing cross-platform path handling in a
file, grep that file for all `includes(`, `endsWith(`, `has(`, `startsWith(` on
path variables and verify each uses normalized paths."

##### Chain 3: Qodo Compliance Repeat Rejections (R1→R2, 2 rounds)

| Round | What Happened                                                                          | Files Affected       | Root Cause                          |
| ----- | -------------------------------------------------------------------------------------- | -------------------- | ----------------------------------- |
| R1    | Rejected: S4036 PATH binary hijacking on `execFileSync("git",...)`, Qodo audit entries | check-propagation.js | Qodo Compliance standard findings   |
| R2    | Same 3 items re-raised by Qodo Compliance. Batch-rejected with note "same as R1"       | check-propagation.js | Qodo doesn't track prior rejections |

**Resolution:** pr-review SKILL.md v3.3 added Qodo Compliance batch rejection
pre-check (Step 0.5 #13). Applied successfully in R2 — 3 items handled in one
batch note instead of individual investigation.

**Avoidable rounds:** 0.5 (3 of R2's 13 items were repeats, ~23% of the round).
The remaining 10 R2 items were genuine new findings.

##### Chain 4: filterUnguardedFiles Fail-Open Direction (R2→R3→R4, 3 rounds)

| Round | What Happened                                                            | Files Affected                   | Root Cause                        |
| ----- | ------------------------------------------------------------------------ | -------------------------------- | --------------------------------- |
| R2    | Changed to fail-closed (return false = skip unreadable files)            | check-propagation.js:402-408     | R1 reviewer suggested less noise  |
| R3    | Reverted to fail-open (return true = flag unreadable as unguarded)       | check-propagation.js:402-408     | Security check: false neg > FP    |
| R4    | R4 reviewer re-suggested fail-closed; rejected with documented rationale | check-propagation.js (no change) | Reviewer didn't read R3 rationale |

**Avoidable rounds:** 0.5. The R3 revert was correct (security checkers should
fail-open), but R2's change should not have been accepted. In security-sensitive
code, don't flip error-handling direction without documenting the security
rationale.

**Prevention:** When a reviewer suggests changing error-handling direction in
security code, verify: "does this pattern detect security issues? If yes,
fail-open (flag it) is correct. If no, fail-closed (skip it) is correct." Add
inline comment documenting the choice.

**Total avoidable rounds: ~2 of 4 (~50%)**

---

#### Rejection Analysis

| Category                         | Count | Round(s) | Specific Items                                                            | Justification                                                  |
| -------------------------------- | ----- | -------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Qodo Compliance repeats          | 3     | R2       | S4036 PATH hijacking, swallowed exceptions, raw audit entry               | Same items as R1, batch-rejected (pr-review v3.3 pre-check)    |
| S4036 PATH binary hijacking (FP) | 1     | R1       | `execFileSync("git", [...])` — hardcoded binary + array args              | No shell injection risk, local-only script, array args safe    |
| Pipeline-generated artifacts     | 2     | R1       | Qodo raw audit JSONL entries, pipeline-generated JSONL structure          | These are intake pipeline artifacts, not hand-written code     |
| Stale/pre-existing               | 2     | R1       | Items from previous rounds already addressed                              | Verified in codebase — already fixed                           |
| S5852 regex DoS (FP)             | 1     | R4       | `/\/+$/` in posixDirname — single char class + quantifier anchored to `$` | No backtracking risk; input is bounded file paths; first flag  |
| Fail-open correct (design)       | 1     | R4       | `filterUnguardedFiles` fail-open → fail-closed                            | Security checker: false negatives worse than false positives   |
| Structured logging (FP)          | 1     | R4       | "Use structured logging" for CLI pre-push hook                            | `console.log` is correct for CLI scripts, not services         |
| Secure Logging (compliance)      | 1     | R4       | "Unstructured console.log messages"                                       | Same as above — CLI script, not a service with log aggregation |

**Rejection accuracy:** 12/12 correct (100%). No wrongly rejected items
resurfaced in subsequent rounds — all R4 rejections held.

**False-positive rate by source:**

| Source           | Total Items | Rejected | FP Rate | Notes                                         |
| ---------------- | ----------- | -------- | ------- | --------------------------------------------- |
| Qodo Compliance  | 7           | 4        | 57%     | 3 repeats + 1 S4036 (all known FP categories) |
| SonarCloud       | 4           | 1        | 25%     | S5852 regex DoS on simple pattern             |
| Qodo Suggestions | 41          | 5        | 12%     | Pipeline artifacts + stale items              |
| Gemini           | 2           | 0        | 0%      | Both were valid suggestions in R1             |

**Trend:** Qodo Compliance FP rate (57%) is highest, driven entirely by repeat
rejections and S4036. Without repeats: 1/4 = 25%. SonarCloud continues to flag
simple regexes (S5852) — first flag, two-strikes rule not yet triggered.

---

#### Scope Creep Analysis

**In-scope (This-PR, check-propagation.js):** 36 of 54 items (67%) — all code
changes were to the single script file introduced in this PR's parent commit.
Clean scope containment.

**Out-of-scope (JSONL data quality):** 15 of 54 items (28%) — R4 included 9
JSONL data record fixes (audits.jsonl, normalized-all.jsonl) plus 6 pre-existing
data quality items. These were accepted because they were < 5 min each and
improved downstream tooling. However, they inflated R4's item count from 9 to 18
and obscured the actual code convergence.

**Repeat rejections:** 3 of 54 items (5%) — Qodo Compliance re-raising R1 items.

---

#### Recurring Patterns (Automation Candidates)

| Pattern                                   | This PR  | Cross-PR History              | Already Automated?       | Recommended Action                                                            | Est. Effort |
| ----------------------------------------- | -------- | ----------------------------- | ------------------------ | ----------------------------------------------------------------------------- | ----------- |
| Cross-platform path normalization         | R3→R4    | #388 R5-R6, #391 R1-R3        | No                       | Add ESLint custom rule or CODE_PATTERNS entry: normalize before string checks | ~20 min     |
| Qodo Compliance repeat rejections         | R1→R2    | #390 R3-R4, #391 R3           | **YES** (pr-review v3.3) | Done — batch rejection pre-check working as designed                          | Done        |
| JSONL data quality (type consistency)     | R4       | #383, #391                    | No                       | Add JSONL schema validation to intake scripts (verified_by type, file format) | ~30 min     |
| Logic fix without test matrix             | R1→R2    | #388 R2-R4 (isInsideTryCatch) | Pattern 8 in pr-retro    | Enforce "define test matrix before committing logic fixes" in Step 0.5        | ~5 min      |
| Fail-open/fail-closed direction flip-flop | R2→R3→R4 | None prior                    | No                       | Add inline comment template for error-handling direction rationale            | ~5 min      |

---

#### Previous Retro Action Item Audit

| Retro   | Recommended Action                                      | Implemented?             | Impact on PR #392                                                        | Avoidable Rounds Caused |
| ------- | ------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------ | ----------------------- |
| PR #391 | Add path-containment to check-propagation.js patterns   | **YES** (this PR)        | Core feature — the PR IS this implementation                             | 0                       |
| PR #391 | Add statSync→lstatSync to check-propagation.js patterns | **YES** (this PR)        | Core feature — the PR IS this implementation                             | 0                       |
| PR #391 | Batch-reject known Qodo Compliance repeats              | **YES** (pr-review v3.3) | Applied in R2 — 3 items batch-rejected in one note                       | 0                       |
| PR #391 | Audit skill template unique IDs                         | **NOT DONE**             | No impact (no new audit skills in #392)                                  | 0                       |
| PR #391 | Auto-increment review numbers from JSONL max            | **NOT DONE**             | Review #376-#378 reused across PRs (collision). Data quality issue only. | 0                       |
| PR #388 | Split multi-skill PRs                                   | **FOLLOWED**             | PR #392 = 1 script + data = small scope → cleaner cycle                  | -1 (saved ~1 round)     |
| PR #388 | Heuristic test matrices before commit                   | **NOT DONE**             | No impact (no new heuristics in #392)                                    | 0                       |
| PR #388 | pr-review Step 1.4: verify reviewer HEAD                | **YES** (R1 applied)     | Checked reviewer analyzed current HEAD — all items valid                 | 0                       |
| PR #386 | S5852 regex complexity pre-push check                   | **NOT DONE** (DEBT-7543) | S5852 flagged in R4 on `/\/+$/`, correctly rejected as FP                | 0                       |
| PR #386 | Small PRs = fewer rounds                                | **FOLLOWED**             | Same as "split" above — 5 files instead of 153                           | -1 (saved ~1 round)     |

**Implemented rate:** 5/10 (50%). All 3 "do now" items from PR #391 retro were
implemented. Both process recommendations (small scope, verify reviewer HEAD)
were followed. 5 items remain unimplemented (2 deferred to TDMS, 3 had no impact
this PR).

**Impact of unimplemented items:** 0 avoidable rounds. All unimplemented items
either had no trigger in this PR (no heuristics, no new audit skills) or were
informational (review number collision, S5852 pre-push). This is the first PR
where unimplemented retro items caused zero avoidable rounds.

---

#### Cross-PR Systemic Analysis

| PR       | Rounds | Total Items | Avoidable Rounds | Avoidable % | Rejections | Rej. Rate | Key Issue                              |
| -------- | ------ | ----------- | ---------------- | ----------- | ---------- | --------- | -------------------------------------- |
| #384     | 4      | 197         | ~2.5             | 63%         | ~18        | 9%        | CI pattern cascade + CC                |
| #386     | 2      | 25          | ~1               | 50%         | 1          | 4%        | S5852 regex + CC                       |
| #388     | 7      | 144         | ~4.5             | 64%         | 29         | 20%       | Heuristic + regex + propagation        |
| #390     | 4      | 25          | ~1.5             | 38%         | 4          | 16%       | Qodo repeats + date/cache fixes        |
| #391     | 3      | 122         | ~3               | 100%        | 7          | 6%        | Path containment + symlink + dedup     |
| **#392** | **4**  | **54**      | **~2**           | **50%**     | **12**     | **22%**   | **Logic + path normalization + JSONL** |

**Persistent cross-PR patterns (updated):**

| Pattern                       | PRs Affected     | Times Rec. | Status                             | Trend                              |
| ----------------------------- | ---------------- | ---------- | ---------------------------------- | ---------------------------------- |
| Large PR scope → more rounds  | #383-#391        | **5x**     | **FOLLOWED** in #392               | **Improving** — first clean follow |
| Propagation check (automated) | #366-#392        | **10x**    | **RESOLVED** (automated in #392)   | **Resolved** — pre-push hook works |
| Qodo Compliance repeat reject | #390-#392        | **3x**     | **RESOLVED** (pr-review v3.3)      | **Resolved** — batch-reject works  |
| Cross-platform path handling  | #388, #391, #392 | **3x**     | Partial (ad-hoc fixes per PR)      | **Recurring** — needs automation   |
| JSONL data quality            | #383, #391, #392 | **3x**     | Not automated                      | **Recurring** — needs validation   |
| Review number collisions      | #389, #392       | **2x**     | Not automated (DEBT needed)        | Recurring — data quality risk      |
| Logic fix without test matrix | #388, #392       | **2x**     | Pattern 8 documented, not enforced | Recurring — needs Step 0.5 check   |

**Resolution milestone:** PR #392 marks the first PR where 2 long-standing
systemic patterns (propagation check 10x, Qodo repeat rejection 3x) are **fully
resolved**. Combined with the "small PR scope" recommendation being followed, 3
of the top 5 systemic patterns are now addressed.

---

#### Skills/Templates to Update

| Item | Target Document             | Change                                                                                              | Priority     | Est. Effort |
| ---- | --------------------------- | --------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| 1    | pr-review SKILL.md Step 0.5 | Add pre-check #14: "Cross-platform path normalization: verify all string checks use POSIX paths"    | Do now       | ~5 min      |
| 2    | pr-review SKILL.md Step 0.5 | Add pre-check #15: "Logic fix test matrix: define inputs→outputs before committing logic changes"   | Do now       | ~5 min      |
| 3    | FIX_TEMPLATES.md            | Add Template #38: POSIX path normalization before string comparison                                 | Do now       | ~5 min      |
| 4    | FIX_TEMPLATES.md            | Add Template #39: Error-handling direction comment (fail-open vs fail-closed rationale)             | Do now       | ~5 min      |
| 5    | CODE_PATTERNS.md            | Add pattern: "Path normalization before string checks — toPosixPath() before includes/endsWith/has" | Do now       | ~5 min      |
| 6    | pr-retro SKILL.md           | Add Pattern 11: Cross-platform path normalization (3x across #388, #391, #392)                      | Do now       | ~5 min      |
| 7    | JSONL intake scripts        | Add schema validation: verified_by type, file field format, no trailing slashes                     | Defer (TDMS) | ~30 min     |
| 8    | reviews:sync script         | Auto-increment review numbers from JSONL max to prevent collisions                                  | Defer (TDMS) | ~20 min     |

---

#### Process Improvements

1. **PR scope discipline paid off** — PR #392 had 5 files (+5,670/-4,673, but
   script only +175/-175). 4 rounds with 54 items (13.5 items/round). Compare:
   PR #391 had 153 files and 122 items (40.7 items/round). **3x fewer items per
   round** with 30x fewer files. Evidence: items/round correlates with file
   count (r=0.87 across #384-#392), not with code complexity.

2. **Propagation automation is production-validated** — The
   `check-propagation.js` patterns (statSync→lstatSync, path containment) ran in
   pre-push during the R4 push and correctly identified 50+ files with unguarded
   patterns. This resolves the **10th** propagation recommendation (PRs
   #366-#392). The script caught in pre-push what would have been 1-2 additional
   review rounds in prior PRs.

3. **Qodo batch rejection saves investigation time** — R2's 3 repeat items were
   handled in one batch note ("same justification as R1") per pr-review v3.3
   Step 0.5 #13. Estimated savings: ~15 min of re-investigation per repeat item
   = ~45 min saved. Resolves the **3rd** recommendation.

4. **Cross-platform path normalization is now the #1 recurring pattern** — Chain
   2 (R3→R4) was entirely caused by incomplete path normalization. This pattern
   appeared in 3 consecutive PRs (#388, #391, #392). The fix is structural: a
   CODE_PATTERNS entry + FIX_TEMPLATE + pr-review Step 0.5 pre-check that says
   "when fixing path handling, grep the file for ALL string-based path
   comparisons."

5. **JSONL data quality inflates review metrics** — R4's 18 items included 9
   JSONL data fixes that are not code quality issues but data cleanup. Without
   them, R4 would have been 9 items — clean convergence matching R3's 5.
   Consider separating data-quality fixes from code-quality fixes in future PR
   scoping.

6. **Zero avoidable rounds from unimplemented retro items** — First time in the
   PR series (#384-#392). All 5 unimplemented items from prior retros had no
   trigger in this PR. This validates the severity-based TDMS tracking: S2 items
   can wait without causing review churn, as long as they're tracked.

---

#### Verdict

**PR #392** had a **moderately efficient review cycle** — 4 rounds with 54
items, 35 fixed. ~2 of 4 rounds were partially avoidable (~50%), driven by:

- Chain 1: Incomplete logic fix without test matrix (R1→R2, ~0.5 avoidable)
- Chain 2: Incomplete path normalization propagation (R3→R4, ~0.5 avoidable)
- Chain 3: Qodo Compliance repeat rejections (R1→R2, ~0.5 avoidable)
- Chain 4: Fail-open direction flip-flop (R2→R3→R4, ~0.5 avoidable)

**Trend: Improving across all key metrics.**

| Metric         | #388 | #390 | #391 | **#392** | Direction |
| -------------- | ---- | ---- | ---- | -------- | --------- |
| Rounds         | 7    | 4    | 3    | **4**    | Stable    |
| Items/round    | 20.6 | 6.25 | 40.7 | **13.5** | Improving |
| Avoidable %    | 64%  | 38%  | 100% | **50%**  | Improving |
| Rejection rate | 20%  | 16%  | 5.7% | **22%**  | Higher\*  |
| Files          | 36+  | 10   | 153  | **5**    | Improving |

\*Higher rejection rate driven by Qodo Compliance repeats (3) and architectural
rejections (4). Excluding repeats: 9/54 = 17%, in line with historical average.

**The single highest-impact change:** Add cross-platform path normalization
pre-check to pr-review Step 0.5 + CODE_PATTERNS.md entry. This would have
eliminated Chain 2 entirely (~0.5 rounds) and prevents the pattern from
recurring in future PRs. Combined with the "logic fix test matrix" pre-check
(Chain 1), these two additions would prevent ~1 round per PR.

**Resolution milestone:** Two long-standing systemic patterns are now **fully
resolved** in PR #392:

- **Propagation check** (10x recommended, PRs #366-#392) — automated via
  `check-propagation.js` with statSync + path-containment patterns in pre-push
- **Qodo Compliance repeat rejection** (3x recommended, PRs #390-#392) —
  automated via pr-review v3.3 Step 0.5 #13 batch rejection pre-check

**Positive signals:** (1) All 3 "do now" items from PR #391 retro were
implemented. (2) First PR to follow "small scope" recommendation — validates the
5x recommendation with data. (3) Zero avoidable rounds from unimplemented retro
items — first time in series. (4) 100% rejection accuracy maintained across all
4 rounds. (5) Propagation pre-push hook ran successfully and identified 50+
files — production validation of the automation.

---

### PR #395 Retrospective (2026-02-27)

_Retro action items implementation + secret redaction hardening + TDMS data
quality fixes. PR scope: ~12 files. 2 review rounds._

#### Review Cycle Summary

| Metric         | Value                                                    |
| -------------- | -------------------------------------------------------- |
| Rounds         | 2 (R1: 2026-02-26, R2: 2026-02-26)                       |
| Total items    | 18 (10 R1 + 8 R2)                                        |
| Fixed          | 17                                                       |
| Deferred       | 0                                                        |
| Rejected       | 1                                                        |
| Files changed  | ~12 (sanitize-error.js, sanitize-input.js, MASTER_DEBT)  |
| Review sources | Qodo PR Suggestions, Gemini Code Assist, Qodo Compliance |

#### Per-Round Breakdown

| Round     | Date       | Source                                       | Items  | Fixed  | Def.  | Rej.  | Key Patterns                                                          |
| --------- | ---------- | -------------------------------------------- | ------ | ------ | ----- | ----- | --------------------------------------------------------------------- |
| R1        | 2026-02-26 | Qodo PR (9), Gemini (1), Qodo Compliance (2) | 10     | 10     | 0     | 0     | Secret redaction consolidation, escaped quotes, single-quote patterns |
| R2        | 2026-02-26 | Qodo PR Suggestions (8)                      | 8      | 7      | 0     | 1     | JSON key quoting, TDMS data quality (5 DEBT entries)                  |
| **Total** |            |                                              | **18** | **17** | **0** | **1** |                                                                       |

**Trajectory:** 10 → 8. Clean convergence — no item count spikes.

**Severity distribution:** 0 CRITICAL, 5 MAJOR (security), 8 MINOR (TDMS data),
5 TRIVIAL (cosmetic). Security fixes were high-value, data fixes were routine.

#### Ping-Pong Chains

None found. Clean forward progression across both rounds. R2 items were entirely
new findings (JSON key quoting, different DEBT entries), not regressions from R1
fixes.

#### Rejection Analysis

| Category                       | Count | Round | Items                         | Justification                                      |
| ------------------------------ | ----- | ----- | ----------------------------- | -------------------------------------------------- |
| Schema convention disagreement | 1     | R2    | DEBT-7595 roadmap_ref null→"" | Standardized on `null` in R1; `""` is inconsistent |

**Rejection accuracy:** 1/1 correct (100%). The `null` convention was
established in R1 and applied consistently — changing back to `""` would create
inconsistency.

**False-positive rate by source:**

| Source          | Total Items | Rejected | FP Rate | Notes                     |
| --------------- | ----------- | -------- | ------- | ------------------------- |
| Qodo PR         | 17          | 1        | 6%      | Lowest FP rate in series  |
| Qodo Compliance | 2           | 0        | 0%      | Informational only        |
| Gemini          | 1           | 0        | 0%      | Converged with Qodo on #1 |

**Trend:** Extremely low rejection rate (6%). Multi-source convergence (Gemini +
Qodo) on the secret redaction consolidation was high-signal — both identified
the same gap independently.

#### Recurring Patterns (Automation Candidates)

| Pattern                             | This PR  | Cross-PR History    | Already Automated?      | Recommended Action                               | Est. Effort |
| ----------------------------------- | -------- | ------------------- | ----------------------- | ------------------------------------------------ | ----------- |
| Dual-file propagation (sanitize-\*) | R1 all 4 | #393 (same pattern) | **YES** (pre-check #17) | Done — propagation discipline followed correctly | Done        |
| TDMS data quality (missing fields)  | R1-R2    | #392 R4, #391       | No                      | Schema validation in intake scripts (DEBT-11312) | ~30 min     |
| Secret redaction pattern gaps       | R1       | #393 (quoted-value) | Partial (#45)           | FIX_TEMPLATE #45 updated with all edge cases     | Done        |

#### Previous Retro Action Item Audit

| Retro   | Recommended Action                            | Implemented?              | Impact on PR #395                                      | Avoidable Rounds Caused     |
| ------- | --------------------------------------------- | ------------------------- | ------------------------------------------------------ | --------------------------- |
| PR #394 | FIX_TEMPLATE #42 CC extraction                | **YES** (template exists) | No trigger (no ESLint rule work in #395)               | 0                           |
| PR #394 | FIX_TEMPLATE #43 ChainExpression unwrap       | **YES** (template exists) | No trigger (no AST work in #395)                       | 0                           |
| PR #394 | Split large PRs                               | **FOLLOWED**              | PR #395 is focused scope — retro actions only          | -0.5 (saved ~0.5 round)     |
| PR #393 | Quoted-value secret redaction edge case tests | **YES** (this PR)         | Core feature — PR IS this implementation               | 0                           |
| PR #392 | Cross-platform path normalization pre-check   | **YES** (pre-check #14)   | No trigger (no path work in #395)                      | 0                           |
| PR #392 | JSONL schema validation in intake scripts     | **NOT DONE** (DEBT-11312) | TDMS data quality items surfaced again (5 in R1, 5 R2) | 0 (items found, not caused) |
| PR #392 | Auto-increment review numbers from JSONL max  | **NOT DONE** (DEBT-7582)  | No collision in #395                                   | 0                           |

**Implemented rate:** 5/7 (71%). All "do now" items from #394 and #393 were
implemented. 2 deferred TDMS items remain open but caused zero avoidable rounds.

**Impact of unimplemented items:** 0 avoidable rounds. The TDMS data quality
items in R1/R2 were organic findings from the PR's own DEBT entries, not caused
by missing schema validation. Schema validation would have prevented the bad
data from being created initially, but the PR's fix was the correct remediation.

#### Cross-PR Systemic Analysis

| PR       | Rounds | Total Items | Avoidable Rounds | Avoidable % | Rejections | Rej. Rate | Key Issue                            |
| -------- | ------ | ----------- | ---------------- | ----------- | ---------- | --------- | ------------------------------------ |
| #388     | 7      | 144         | ~4.5             | 64%         | 29         | 20%       | Heuristic + regex + propagation      |
| #390     | 4      | 25          | ~1.5             | 38%         | 4          | 16%       | Qodo repeats + date/cache fixes      |
| #391     | 3      | 122         | ~3               | 100%        | 7          | 6%        | Path containment + symlink + dedup   |
| #392     | 4      | 54          | ~2               | 50%         | 12         | 22%       | Logic + path normalization + JSONL   |
| #393     | 2      | 15          | ~0               | 0%          | 9          | 60%       | Over-engineering cleanup (mostly FP) |
| #394     | 12     | ~321        | ~5               | 42%         | ~112       | 35%       | Large PR, CC, ChainExpression        |
| **#395** | **2**  | **18**      | **~0**           | **0%**      | **1**      | **6%**    | **Focused: security + data quality** |

**Persistent cross-PR patterns (updated):**

| Pattern                      | PRs Affected           | Times Rec. | Status                          | Trend                                 |
| ---------------------------- | ---------------------- | ---------- | ------------------------------- | ------------------------------------- |
| Large PR scope → more rounds | #383-#394              | **6x**     | **FOLLOWED** in #395            | **Improving** — 2nd clean follow      |
| TDMS data quality            | #383, #391, #392, #395 | **4x**     | Not automated (DEBT-11312)      | **Recurring** — needs validation      |
| Dual-file propagation        | #393, #395             | **2x**     | **RESOLVED** (pre-check #17)    | **Resolved** — discipline followed    |
| Secret redaction gaps        | #393, #395             | **2x**     | **RESOLVED** (FIX_TEMPLATE #45) | **Resolved** — template comprehensive |

#### Skills/Templates to Update

| Item | Target Document  | Change                                                                                     | Priority | Est. Effort |
| ---- | ---------------- | ------------------------------------------------------------------------------------------ | -------- | ----------- |
| 1    | FIX_TEMPLATES.md | Verify Template #45 covers JSON key quoting (`"token": "value"`)                           | Do now   | ~2 min      |
| 2    | CODE_PATTERNS.md | Add pattern: TDMS DEBT entry must have `source` field and `null` for empty optional fields | Do now   | ~3 min      |

**Note:** No new templates or pre-checks needed — PR #395 validated existing
templates (#45) and pre-checks (#17). This is a positive signal that the tooling
from prior retros is working.

#### Process Improvements

1. **Focused PR scope continues to pay off** — PR #395 had 2 rounds, 18 items,
   0% avoidable. Compare: PR #394 had 12 rounds with 42% avoidable. The "retro
   action items" scope was tight and well-defined.

2. **Propagation discipline held** — All 4 security fixes in R1 were propagated
   between `sanitize-error.js` and `sanitize-input.js` in the same commit. This
   is pre-check #17 working as designed.

3. **Multi-source convergence is high-signal** — Gemini and Qodo independently
   identified the secret redaction consolidation gap. When 2+ reviewers converge
   on the same finding, priority should be elevated automatically.

4. **TDMS data quality is the remaining systemic issue** — 10 of 18 items were
   TDMS data fixes (missing fields, duplicates, truncated titles). This is now
   the 4th PR where TDMS data quality appears. Schema validation (DEBT-11312) is
   the structural fix.

5. **FIX_TEMPLATE #45 is production-validated** — Created in PR #393, applied
   and refined in PR #395. The template correctly guided the secret redaction
   improvements. R2's JSON key quoting addition extended the template further.

#### Verdict

**PR #395** had an **efficient review cycle** — 2 rounds with 18 items, 17
fixed. **~0 rounds avoidable (0%)**. This is the best efficiency score since PR
#393.

**Trend: Continued improvement for focused PRs.**

| Metric         | #392 | #393 | #394 | **#395** | Direction |
| -------------- | ---- | ---- | ---- | -------- | --------- |
| Rounds         | 4    | 2    | 12   | **2**    | Improving |
| Items/round    | 13.5 | 7.5  | 26.8 | **9.0**  | Improving |
| Avoidable %    | 50%  | 0%   | 42%  | **0%**   | Improving |
| Rejection rate | 22%  | 60%  | 35%  | **6%**   | Improving |

**The single highest-impact change:** Implement JSONL schema validation
(DEBT-11312). This would eliminate ~55% of all items in this PR (10 of 18 were
TDMS data quality fixes that schema validation would have prevented at intake
time).

**Positive signals:** (1) 0% avoidable rounds — only the 2nd PR to achieve this
(after #393). (2) Propagation discipline (pre-check #17) fully followed — all
sanitize-\* fixes cross-propagated. (3) FIX_TEMPLATE #45 production-validated
and extended. (4) Lowest rejection rate in the series (6%). (5) Multi-source
convergence confirmed as high-signal pattern.

---

### PR #396 Retrospective (2026-02-27)

_ESLint + pattern compliance fixes. PR scope: 27 items across safe-fs.js,
check-pattern-compliance.js, categorize-and-assign.js, generate-views.js, and
test files. 2 review rounds._

#### Review Cycle Summary

| Metric         | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Rounds         | 2 (R1: 2026-02-26, R2: 2026-02-26)                         |
| Total items    | 48 (38 R1 + 10 R2)                                         |
| Fixed          | 30                                                         |
| Deferred       | 1 (N/A — out of scope)                                     |
| Rejected       | 16                                                         |
| Duplicate      | 1                                                          |
| Files changed  | ~15 (safe-fs.js, check-pattern-compliance.js, tests, etc.) |
| Review sources | Qodo Compliance, SonarCloud, Qodo PR Suggestions, CI       |

#### Per-Round Breakdown

| Round     | Date       | Source                                   | Items  | Fixed  | Def.  | Rej.   | Key Patterns                                                                                                                       |
| --------- | ---------- | ---------------------------------------- | ------ | ------ | ----- | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| R1        | 2026-02-26 | Qodo Compliance (26), SonarCloud (12)    | 38     | 24     | 1     | 12     | safe-fs security (symlink guard, dir-over-file, atomic write cleanup, Unicode), path containment, regex broadening, unused imports |
| R2        | 2026-02-26 | Qodo Compliance (4), Qodo PR (7), CI (1) | 10     | 6      | 0     | 4      | Same-path rename guard, test regex alignment, POSIX path normalization                                                             |
| **Total** |            |                                          | **48** | **30** | **1** | **16** |                                                                                                                                    |

**Trajectory:** 38 → 10. Strong convergence — 74% reduction in items from R1 to
R2.

**Severity distribution:** 0 CRITICAL, 6 MAJOR (security: symlink guard,
same-path rename, atomic cleanup), 18 MINOR (code quality, regex), 24 TRIVIAL
(unused imports, cosmetic). The security fixes in safe-fs.js were high-value
real bug fixes.

#### Ping-Pong Chains

##### Chain 1: Test Regex Alignment (R1→R2, 2 rounds)

| Round | What Happened                                                                          | Files Affected              | Root Cause                                     |
| ----- | -------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------- |
| R1    | Broadened `no-raw-fs-write` regex with `\b` word boundary to detect destructured calls | check-pattern-compliance.js | Regex improvement                              |
| R2    | Test file regex didn't match production regex (`\b(?:fs\.)?` pattern) — CI failing     | pattern-compliance.test.js  | Test not updated when production regex changed |

**Resolution:** Aligned test regex with production regex pattern. Added
`String.raw` for clarity.

**Avoidable rounds:** 0.5. When modifying a regex in production code, the
corresponding test regex should be updated in the same commit. This is a
specific case of the general pattern: "when changing behavior, update tests in
the same commit."

**Prevention:** pr-review pre-check: after modifying any regex in a checker
script, verify the corresponding test file uses the same pattern.

##### Chain 2: Qodo Compliance Repeat Rejections (R1→R2, 2 rounds)

| Round | What Happened                                              | Files Affected | Root Cause                          |
| ----- | ---------------------------------------------------------- | -------------- | ----------------------------------- |
| R1    | Rejected: TOCTOU, audit trails, logging — design decisions | safe-fs.js     | Qodo Compliance standard findings   |
| R2    | Same 3 items re-raised + 1 ESM/CJS false positive          | safe-fs.js     | Qodo doesn't track prior rejections |

**Resolution:** Batch-rejected per pr-review v3.3 Step 0.5 #13 with "same
justification as R1" note.

**Avoidable rounds:** 0.5 (4 of R2's 10 items were repeats/FP, ~40% of the
round).

**Total avoidable rounds: ~1 of 2 (~50%)**

#### Rejection Analysis

| Category                         | Count | Round(s) | Specific Items                                   | Justification                                 |
| -------------------------------- | ----- | -------- | ------------------------------------------------ | --------------------------------------------- |
| S4036 PATH binary hijacking (FP) | 1     | R1       | Hardcoded "node" in execSync                     | No shell injection risk, hardcoded binary     |
| Arbitrary file overwrite (FP)    | 1     | R1       | safe-fs.js write — covered by directory guard    | Already guarded by isSafeToWrite              |
| Missing audit log                | 1     | R1       | Single-user CLI tool, not a service              | CLI tools don't need audit trails             |
| EXDEV rollback                   | 1     | R1       | Atomic write cross-device — copy succeeds = safe | Copy is the rollback mechanism itself         |
| Error basename exposure          | 1     | R1       | Internal tool, not user-facing                   | Error paths in internal CLI are acceptable    |
| Unbounded payload                | 1     | R1       | Internally constructed data                      | No external input                             |
| No allowlist                     | 1     | R1       | All callers are hardcoded                        | Allowlist unnecessary for known callers       |
| Consolidate isSafeToWrite        | 1     | R1       | Defensive fallback by design                     | Intentional redundancy                        |
| Remove limit(200)                | 1     | R1       | Deliberate unbounded-query fix                   | The limit IS the fix                          |
| test.before() suggestion         | 1     | R1       | Sequential test runner                           | test.before() not needed in sequential runner |
| Pre-existing try/catch           | 1     | R1       | Out of scope for this PR                         | Pre-existing code, not changed in this PR     |
| Temp cleanup concurrency         | 1     | R1       | Sequential execution                             | No concurrent access to temp files            |
| Qodo Compliance repeats          | 3     | R2       | TOCTOU, audit trails, logging — same as R1       | Batch-rejected per pr-review v3.3             |
| ESM/CJS import (FP)              | 1     | R2       | Runtime verified — module works correctly        | False positive — verified at runtime          |

**Rejection accuracy:** 16/16 correct (100%). No wrongly rejected items
resurfaced — all rejections held.

**False-positive rate by source:**

| Source           | Total Items | Rejected | FP Rate | Notes                                        |
| ---------------- | ----------- | -------- | ------- | -------------------------------------------- |
| Qodo Compliance  | 30          | 15       | 50%     | 12 R1 + 3 R2 repeats. Standard FP categories |
| SonarCloud       | 12          | 0        | 0%      | All 12 items were actionable                 |
| Qodo Suggestions | 7           | 1        | 14%     | ESM/CJS false positive                       |
| CI               | 1           | 0        | 0%      | Test alignment fix was valid                 |

**Trend:** Qodo Compliance FP rate (50%) continues high, driven by known
categories (TOCTOU, audit trails, S4036). SonarCloud maintains 0% FP — all items
actionable.

#### Recurring Patterns (Automation Candidates)

| Pattern                                      | This PR  | Cross-PR History      | Already Automated?       | Recommended Action                                          | Est. Effort |
| -------------------------------------------- | -------- | --------------------- | ------------------------ | ----------------------------------------------------------- | ----------- |
| Qodo Compliance repeat rejections            | R1→R2    | #390-#395             | **YES** (pr-review v3.3) | Done — batch rejection working as designed                  | Done        |
| Test regex not updated with production regex | R1→R2    | New pattern           | No                       | pr-review pre-check: verify test patterns match production  | ~5 min      |
| Unused import cleanup                        | R1 (11x) | Common across all PRs | Partial (ESLint)         | ESLint `no-unused-imports` rule should catch at commit time | ~10 min     |

#### Previous Retro Action Item Audit

| Retro   | Recommended Action                          | Implemented?              | Impact on PR #396                                 | Avoidable Rounds Caused |
| ------- | ------------------------------------------- | ------------------------- | ------------------------------------------------- | ----------------------- |
| PR #395 | Verify Template #45 JSON key quoting        | **YES** (done in #395)    | No trigger (no secret redaction in #396)          | 0                       |
| PR #394 | FIX_TEMPLATE #42-44                         | **YES**                   | No trigger (no ESLint rule creation in #396)      | 0                       |
| PR #394 | Split large PRs                             | **FOLLOWED**              | PR #396 is focused — ESLint compliance fixes only | -0.5 (saved ~0.5 round) |
| PR #392 | Cross-platform path normalization pre-check | **YES** (pre-check #14)   | Applied in R2 — POSIX normalization for test file | 0                       |
| PR #392 | JSONL schema validation                     | **NOT DONE** (DEBT-11312) | No trigger (no JSONL work in #396)                | 0                       |

**Implemented rate:** 4/5 (80%). All "do now" items from recent retros were
implemented or followed. Only JSONL schema validation remains deferred.

#### Cross-PR Systemic Analysis

| PR       | Rounds | Total Items | Avoidable Rounds | Avoidable % | Rejections | Rej. Rate | Key Issue                             |
| -------- | ------ | ----------- | ---------------- | ----------- | ---------- | --------- | ------------------------------------- |
| #391     | 3      | 122         | ~3               | 100%        | 7          | 6%        | Path containment + symlink + dedup    |
| #392     | 4      | 54          | ~2               | 50%         | 12         | 22%       | Logic + path normalization + JSONL    |
| #393     | 2      | 15          | ~0               | 0%          | 9          | 60%       | Over-engineering cleanup (mostly FP)  |
| #394     | 12     | ~321        | ~5               | 42%         | ~112       | 35%       | Large PR, CC, ChainExpression         |
| #395     | 2      | 18          | ~0               | 0%          | 1          | 6%        | Focused: security + data quality      |
| **#396** | **2**  | **48**      | **~1**           | **50%**     | **16**     | **33%**   | **ESLint compliance + safe-fs fixes** |

**Persistent cross-PR patterns (updated):**

| Pattern                       | PRs Affected           | Times Rec. | Status                        | Trend                             |
| ----------------------------- | ---------------------- | ---------- | ----------------------------- | --------------------------------- |
| Large PR scope → more rounds  | #383-#394              | **6x**     | **FOLLOWED** in #395, #396    | **Improving** — 3rd clean follow  |
| TDMS data quality             | #383, #391, #392, #395 | **4x**     | Not automated (DEBT-11312)    | **Stable** — no trigger in #396   |
| Qodo Compliance repeat reject | #390-#396              | **5x**     | **RESOLVED** (pr-review v3.3) | **Resolved** — batch-reject works |
| Test/prod regex sync          | #396                   | **1x**     | Not automated                 | **New** — first occurrence        |

#### Skills/Templates to Update

| Item | Target Document             | Change                                                                                        | Priority | Est. Effort |
| ---- | --------------------------- | --------------------------------------------------------------------------------------------- | -------- | ----------- |
| 1    | pr-review SKILL.md Step 0.5 | Add pre-check #18: "After modifying regex in checker, verify test file uses matching pattern" | Do now   | ~5 min      |
| 2    | CODE_PATTERNS.md            | Add pattern: same-path rename guard (`src === dest` early return before destructive ops)      | Do now   | ~3 min      |

#### Process Improvements

1. **safe-fs.js received substantive security fixes** — Symlink guard,
   directory- over-file guard, tmp cleanup on atomic write failure, Unicode
   codePointAt, and same-path rename guard are all real bugs with data-loss
   potential. This PR had the highest ratio of genuine security findings to
   total items.

2. **SonarCloud 0% FP rate** — All 12 SonarCloud items in R1 were actionable.
   This continues to validate SonarCloud as the highest-signal review source.

3. **Qodo Compliance FP rate remains high (50%)** — Dominated by known FP
   categories (TOCTOU on single-user CLI, audit trails, S4036 PATH). These could
   be suppressed via `.qodo/suppression.yaml` to reduce noise.

4. **Test-production regex sync is a new pattern** — When modifying a regex in
   production code, the test should be updated in the same commit. This caused
   ~0.5 avoidable rounds in R2. A pr-review pre-check can prevent recurrence.

5. **Unused import cleanup (11 files)** — `writeFileSync` imports were removed
   from 11 files. This suggests the ESLint `no-unused-imports` rule should be
   enabled at the pre-commit level to catch these automatically.

#### Verdict

**PR #396** had a **moderately efficient review cycle** — 2 rounds with 48
items, 30 fixed. **~1 of 2 rounds partially avoidable (~50%)**, driven by:

- Chain 1: Test regex not updated with production regex (R1→R2, ~0.5 avoidable)
- Chain 2: Qodo Compliance repeat rejections (R1→R2, ~0.5 avoidable)

**Trend: Consistent 2-round cycles for focused PRs.**

| Metric         | #393 | #394 | #395 | **#396** | Direction |
| -------------- | ---- | ---- | ---- | -------- | --------- |
| Rounds         | 2    | 12   | 2    | **2**    | Stable    |
| Items/round    | 7.5  | 26.8 | 9.0  | **24.0** | Higher\*  |
| Avoidable %    | 0%   | 42%  | 0%   | **50%**  | Moderate  |
| Rejection rate | 60%  | 35%  | 6%   | **33%**  | Moderate  |

\*Higher items/round driven by Qodo Compliance's 26-item R1 dump (many standard
boilerplate findings). Excluding Qodo Compliance FP: 12 SonarCloud + ~12
actionable Qodo items = 24 genuine items / 2 rounds = 12 items/round.

**The single highest-impact change:** Add Qodo Compliance suppressions for known
FP categories (TOCTOU on CLI tools, audit trails, S4036 PATH on hardcoded
binaries). This would reduce R1 from 38 to ~26 items and eliminate the repeat
rejection chain entirely.

**Positive signals:** (1) safe-fs.js received 6 genuine security fixes (symlink,
directory guard, atomic cleanup, Unicode, same-path rename). (2) SonarCloud
maintained 0% FP rate. (3) Pre-check #14 (POSIX normalization) applied
successfully in R2. (4) Focused PR scope — 2 rounds, not 12.

---

#### Review #438: PR #407 R12 — SonarCloud + Qodo (2026-03-01)

_PR Review Ecosystem v2 Phases 1-3. Round 12 of ongoing review cycle._

**Source:** SonarCloud (5), Qodo PR Suggestions (10) **Total:** 15 **Fixed:** 4
**Rejected:** 11

**Severity:** 2 CRITICAL (CC reduction), 2 MAJOR (nested ternary, write
hardening), 11 rejected

**Items Fixed:**

1. **Nested ternary extraction** (`backfill-reviews.ts:580`) — Extracted nested
   ternary in `buildV1ReviewRecord` to if-else chain for readability
2. **CC reduction: writeDebtOutput** (`dedup-debt.ts:231`) — CC 16→≤15 via
   symlink guard extraction + cross-device write hardening (!isFile check)
3. **CC reduction: processArchiveLine** (`parse-review.ts:90`) — CC 18→≤15 via
   fence handling extraction to `processFenceLine` helper
4. **Cross-device write hardening** (`dedup-debt.ts:247`) — Added !isFile()
   check in cross-device fallback (combined with CC fix)

**Rejected (with justification):**

- SC: Top-level await ×2 (`promote-patterns.js`, `backfill-reviews.ts`) — CJS
  modules (tsconfig module=commonjs, wrapper uses require). Top-level await
  requires ESM.
- Q: V1 ID type normalization — V1 IDs are always numeric from JSON.parse. Type
  mismatch is hypothetical.
- Q: Undated retro fallback — All retro headings have dates. Sentinel
  "1970-01-01" would corrupt data.
- Q: Table wrapping EOL regex — First-run code, markers already exist in
  CLAUDE.md.
- Q: Retro #### termination — Archives don't use #### within retro sections.
- Q: Prefixed ID parsing — `rev-` is output format, not input. V1 has plain
  numbers.
- Q: safe-fs try-catch ×2 — Infrastructure file; crash is correct if missing.
- Q: 4+ backtick fence tracking — Archives use standard ``` fences only.
- Q: Temp file cleanup after fallback — finally block already handles this.

**Patterns:** CJS-vs-ESM awareness (reject top-level await in CJS), CC
extraction discipline, data format validation before accepting suggestions

---

#### Review #439: PR #407 R14 — SonarCloud + Qodo (2026-03-01)

_PR Review Ecosystem v2 Phases 1-3. Round 14 of ongoing review cycle._

**Source:** SonarCloud (5), Qodo Compliance (3), Qodo PR Suggestions (10)
**Total:** 18 **Fixed:** 12 **Rejected:** 6

**Severity:** 1 CRITICAL (CC reduction), 4 MAJOR (TOCTOU, safeParse, ID
collision, wx flag), 7 MINOR (sanitization, regex, line numbers, String.raw,
exception handling)

**Items Fixed:**

1. **CC reduction: getLatestLogHash** (`seed-commit-log.js:185`) — CC 16→≤15 via
   `findLastHash` helper extraction
2. **TOCTOU race: appendEntries** (`seed-commit-log.js:325`) — fd-based append
   with fstatSync verification replaces lstatSync+appendFileSync
3. **Temp file symlink race** (`backfill-reviews.ts:927`) — `wx` flag for
   exclusive create on tmpPath (reviews + retros)
4. **RetroRecord.parse → safeParse** (`backfill-reviews.ts:470`) — Graceful
   degradation instead of script crash on single malformed retro
5. **Invocation ID collision** (`write-invocation.ts:44`) — Added pid + random
   entropy to auto-generated IDs
6. **Line number accuracy** (`backfill-reviews.ts:642`) — indexOf→index loop var
7. **Harden table input** (`generate-claude-antipatterns.ts:61`) — Defensive
   null coalescing + String.raw for escaped pipe
8. **Sanitize markdown headings** (`promote-patterns.ts:239`) — Strip
   newlines/backticks/hashes from pattern titles
9. **Sanitize markdown render** (`render-reviews-to-md.ts:43`) — safeInline for
   title, patterns, learnings
10. **Relax reviewId regex** (`write-deferred-items.ts:82`) — `?` → `*` for
    multi-segment IDs
11. **Handle exception context** (`write-invocation.ts:83`) — Log error.message
    instead of generic string
12. **String.raw** (`generate-claude-antipatterns.ts:61`) — Use String.raw for
    escaped pipe character

**Rejected (with justification):**

- SC: Top-level await ×2 — **Repeat-rejected from R12.** CJS modules (tsconfig
  module=commonjs). Top-level await requires ESM.
- Q: String-based numeric ID handling — Already handled downstream in
  buildV1ReviewRecord (line 575-584) which converts via parseInt.
- Q Compliance: Silent catches — By-design race condition guards per
  CODE_PATTERNS.md.
- Q Compliance: CLI input trust boundary — Local dev tool with Zod validation.
- Q Compliance: Implicit code execution — By-design session hook behavior.

**Patterns:** fd-based file operations (TOCTOU mitigation), safeParse for
resilient batch processing, entropy in auto-IDs, markdown input sanitization

---

#### Review #440: PR #407 R16 — Qodo + SonarCloud (2026-03-01)

_PR Review Ecosystem v2 Phases 1-3. Round 16 of ongoing review cycle._

**Source:** Qodo Compliance (1), Qodo PR Suggestions (11), SonarCloud (3)
**Total:** 14 **Fixed:** 11 **Rejected:** 3

**Severity:** 1 CRITICAL (sanitizeMdLine regex SyntaxError), 1 CRITICAL
(SonarCloud CC 16>15), 5 MAJOR (v1 ID dedup, retro truncation, wx flag, TOCTOU
race, fallback guard), 4 MINOR (top-level await x2, ID collision, swallowed
exception)

**Patterns:** regex-character-class-escaping, cognitive-complexity-extraction,
toctou-file-race, wx-exclusive-create, retro-parser-subheading,
string-id-coercion

**Learnings:**

- Character classes in regex: `[` and `]` must be escaped as `\[` `\]` inside
  `[]`
- Extract rename-with-fallback helpers to reduce CC in atomic write functions
- `r+` mode + post-open guard is safer than `a` mode for TOCTOU mitigation
- v1 migration must coerce string IDs to numbers for dedup checks

**Rejected items:**

- fsync in writeAtomicSafe: Over-engineering for CLI backfill script
- Validate JSON payload shape: Redundant with TypeScript typing + Zod validation
- Sanitize markdown-bound strings: Pattern names are internal, not
  user-controlled

---
