# PR Review Skill — Archive

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-24
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Archived content from SKILL.md to reduce file size. Referenced by the active
skill for historical context.

---

## Archived Pre-Check Evidence & Details

### Local Pattern Compliance Check (PR #384 Retro)

PR #384 R2 had 112 CI blocking pattern violations because R1's code wasn't
tested against the pattern checker before push. This single check would have
eliminated 57% of the PR's total items. The pre-commit hook runs this
automatically, but if commits are made with `SKIP_CHECKS` or the pattern rules
were updated since the original commit, violations slip through.

### Security Pattern Sweep (PR #366 Retro)

This catches the most common ping-pong pattern: a security fix applied to one
file while the same pattern exists in 10+ other files. PR #366 had 5 rounds of
symlink guard ping-pong that this sweep would have prevented.

### Cognitive Complexity Pre-Check (PR #371 Retro)

CC violations were the #1 cross-PR churn driver across PRs #366-#371, causing
~20 avoidable review rounds. The pre-commit hook now enforces CC as error on
staged files (warn globally for 113 pre-existing violations).

### Filesystem Guard Pre-Check (PR #374 Retro)

PR #374 had 4 rounds of containment direction flip-flopping and 4 rounds of
realpathSync edge cases — all preventable with this pre-check.

Full lifecycle test matrix:

| Scenario                        | Test With                            |
| ------------------------------- | ------------------------------------ |
| File exists                     | Normal operation                     |
| File doesn't exist, parent does | `.tmp`/`.bak` paths                  |
| Parent doesn't exist            | Fresh checkout, `mkdirSync` ordering |
| Fresh checkout (no .claude/)    | First-ever run on clean clone        |
| Symlink in path                 | Symlink to outside project           |

Path containment decisions BEFORE writing code:

1. **Which directions needed?** Descendant-only or bidirectional (ancestor +
   descendant)?
2. **Separator boundary?** `startsWith(root + path.sep)`, not `startsWith(root)`
3. **Case sensitivity?** Windows needs `.toLowerCase()`
4. **Depth limit?** If ancestor direction, cap at 10 levels

See FIX_TEMPLATES.md Templates 31 (realpathSync lifecycle) and 33 (path
containment decision matrix).

### Shared Utility Caller Audit (PR #374 Retro)

This catches the propagation miss pattern where a shared function behavior
changes but callers in other files aren't updated. PR #374 R4->R5 had a trim
behavior change in `gitExec()` that wasn't propagated to 4 callers in other
files.

### Algorithm Design Pre-Check (PR #379 Retro)

**Evidence:** PR #379 had 7 rounds of incremental evidence dedup refinement. 4
rounds (~57%) were avoidable with upfront algorithm design. PR #388 had 3 rounds
of isInsideTryCatch brace direction flip-flop — a test matrix would have
prevented 1 round. PR #388 R4 had a self-referential dedup set that was a no-op
— a test matrix with known duplicates would have caught it instantly. See
FIX_TEMPLATES #34 for the complete evidence merge pattern.

**Heuristic function test matrix:**

| Heuristic Type         | Required Test Cases                                       |
| ---------------------- | --------------------------------------------------------- |
| Brace/scope detection  | Nested braces, adjacent blocks, empty blocks, single-line |
| Regex-based analysis   | Match, non-match, partial match, multiline, special chars |
| Line-counting logic    | 0 lines, 1 line, boundary lines, lines with mixed content |
| AST-like parsing       | Nested constructs, sibling constructs, malformed input    |
| Dedup/canonicalization | Identical, near-identical, different types, circular refs |

### Mapping/Enumeration Completeness Pre-Check (PR #382 Retro)

**Evidence:** PR #382 had 3-round severity chain (R1 fixed 2 of 4 levels) and
3-round dedup chain (3 boundaries discovered incrementally).

### Dual-File JSONL Write Check (PR #383 Retro)

**Evidence:** PR #383 R7 found 4 scripts with sequential writes missing rollback
on second rename failure, and earlier sessions found data loss from MASTER being
overwritten by stale deduped.jsonl.

### Same-File Regex DoS Sweep (PR #382 Retro)

SonarCloud sometimes reports only one DoS regex per scan. If the file has
multiple vulnerable regexes, you'll get a new finding each round.

**Important:** When replacing a regex with a `testFn` function, also check any
helper regexes INSIDE the testFn. S5852 applies to all regex patterns, not just
the top-level pattern config.

**Evidence:** PR #382 R1 fixed `matchNumberedHeading` regex DoS, but R2 flagged
`isTableHeaderLine` regex DoS in the same file — same rule, avoidable round. PR
#386 R1 replaced pattern regex with testFn but left helper regex `/(\d+)\s*$/`
inside testFn that also triggered S5852 in R2.

### Large PR Scope Pre-Check (PR #388 Retro)

Large PRs consistently produce more review rounds: #383 (30+ files, 8 rounds),
#384 (20+ files, 4 rounds), #388 (36+ files, 4 rounds). Compare to small PRs:
#386 (5 files, 2 rounds), #371 (6 files, 2 rounds).

**Evidence:** PR #388 had 6 files appearing in ALL 4 rounds. 36 new files across
3 ecosystem audit skills with shared patterns meant each fix needed propagation
to 3+ copies.

### Stale Reviewer HEAD Check (PR #388 Retro)

**Evidence:** PR #388 R7 had 3 Gemini items that referenced pre-R6 code (missing
`sanitizeInput` calls that were already added in R6). Investigating each one
individually wasted time — a single HEAD check would have rejected all 3
instantly.

---

## Archived Propagation Evidence

### PR #366 (symlink guard ping-pong)

- R4: Qodo flagged missing symlink check on 1 write path -> fixed 1 path
- R5: Qodo found 3 more paths -> fixed 3
- R6: Created shared `isSafeToWrite()` but only applied to target files, not tmp
  files
- R7: Qodo found tmp paths, standalone files, rotate-state.js -> fixed 9 more
- **What should have happened:** R4 fix + grep for ALL `writeFileSync` +
  `renameSync` patterns -> fix all ~15 paths in one round

### PR #367 (env var validation)

**CRITICAL:** Propagation checks must search ALL file types that consume the
same pattern. PR #367 R4 fixed SKIP_REASON validation in shell hooks but missed
the 3 JS scripts that also read SKIP_REASON — causing 3 extra review rounds.

### PR #382 (propagation escalation)

Propagation has been recommended in PRs #366, #367, #369, #374, #379, and #382
but is STILL missed. This is the longest-running unresolved retro action item (6
PRs).

Expanded scope: Propagation applies to mapping logic, regex DoS, dedup
boundaries — not just code patterns.

---

## Archived Version History

| Version | Date       | Description                                                                            |
| ------- | ---------- | -------------------------------------------------------------------------------------- |
| 2.3     | 2026-02-17 | Add CC Pre-Push Check (Step 0.5) + Path Test Matrix (Step 5.8). Source: PR #370 retro. |
| 2.2     | 2026-02-15 | Add Security Pattern Sweep + Propagation Check (PR #366 retro)                         |
| 2.1     | 2026-02-14 | Extract reference docs: SonarCloud, agents, TDMS, learning                             |
| 2.0     | 2026-02-10 | Full protocol with parallel agents, TDMS integration                                   |
| 1.0     | 2026-01-15 | Initial version                                                                        |
