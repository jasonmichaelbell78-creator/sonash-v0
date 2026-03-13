# PR Review Pre-Checks

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-07
**Status:** ACTIVE
<!-- prettier-ignore-end -->

18 mandatory pre-push checks that prevent known multi-round churn patterns. Run
ALL applicable checks before the first CI push. Each check includes the source
retro/PR that motivated it.

See [ARCHIVE.md](../ARCHIVE.md) for full evidence and historical context.

---

## 1. New File Pre-Review

New files >500 lines: run `code-reviewer` agent FIRST, fix issues, THEN push.

**Source:** General best practice.

## 2. Local Pattern Compliance

```bash
npm run patterns:check -- --staged
```

**Source:** PR #384 retro — 112 CI-blocking pattern violations, 57% of total
items, avoidable with one command.

## 3. Security Pattern Sweep

If PR introduces security-adjacent code, grep for unguarded write paths:

```bash
grep -rn 'writeFileSync\|renameSync\|appendFileSync' .claude/hooks/ scripts/ --include="*.js" | grep -v 'isSafeToWrite'
```

**Source:** PR #366 retro — 5 rounds of symlink guard ping-pong.

## 4. Cyclomatic Complexity

Pre-push hook enforces CC <=15 as error on all JS/TS files in the push diff.
Pre-commit warns; pre-push blocks. After extracting helpers, re-check the ENTIRE
file. Override: `SKIP_CC=1 SKIP_REASON="reason"`.

**Source:** PR #371 retro — CC violations were #1 cross-PR churn driver across
PRs #366-#371 (~20 avoidable rounds).

## 5. Filesystem Guard Pre-Check

If PR modifies guard functions, verify against full lifecycle matrix (file
exists, doesn't exist, parent doesn't exist, fresh checkout, symlink). See
FIX_TEMPLATES #31, #33.

**Source:** PR #374 retro — 4 rounds of containment flip-flop + 4 rounds of
realpathSync edge cases.

## 6. Shared Utility Caller Audit

If PR modifies shared utility functions, grep ALL callers and verify
compatibility.

**Source:** PR #374 retro — trim behavior change in `gitExec()` not propagated
to 4 callers.

## 7. Algorithm Design Pre-Check

**Trigger:** Non-trivial algorithm or heuristic/analysis function. Design the
full algorithm before committing: define invariants, enumerate edge cases,
handle all input types, add depth/size caps. For heuristics, define a test
matrix of inputs->outputs covering true positives, true negatives, and edge
cases.

**Source:** PR #379 retro — 7 rounds of incremental dedup refinement (4
avoidable). PR #388 — 3 rounds of brace direction flip-flop.

## 8. Mapping/Enumeration Completeness

When modifying mapping logic (severity, priority, etc.): list ALL possible input
values and verify each maps correctly. Use case-insensitive matching and `\b`
word boundaries where needed.

**Source:** PR #382 retro — 3-round severity chain (R1 fixed 2 of 4 levels).

## 9. Dual-File JSONL Write Check

If PR modifies scripts that write to MASTER_DEBT.jsonl, verify ALL write paths
also update `raw/deduped.jsonl`.

**Source:** PR #383 retro — 4 scripts with sequential writes missing rollback,
data loss from MASTER overwritten by stale deduped.jsonl.

## 10. Same-File Regex DoS Sweep

After fixing a flagged regex, grep the same file for ALL other vulnerable
regexes. Two-strikes rule: if SonarCloud flags same regex twice, replace with
string parsing.

**Source:** PR #382 retro — R1 fixed one regex DoS, R2 flagged another in same
file. PR #386 — replaced regex with testFn but left helper regex inside.

## 11. Large PR Scope Pre-Check

20+ files? Consider splitting. Grep for shared patterns across all files and fix
in one pass.

**Source:** PR #388 retro — 36+ files, 4 rounds, 6 files appearing in ALL
rounds.

## 12. Stale Reviewer HEAD Check

Before investigating reviewer items, compare reviewer's commit against HEAD. If
stale (2+ behind), reject ALL items from that reviewer as a batch.

**Source:** PR #388 retro — 3 Gemini items referenced pre-R6 code, wasted
investigation time.

## 13. Qodo Compliance Batch Rejection

Qodo Compliance re-raises the same items across rounds even when already
rejected. When processing R2+ rounds:

1. Check learning log for prior rejections in the same PR
2. If an item matches a previously rejected item (same rule ID + same file),
   mark as **repeat-rejected** without re-investigating
3. Add a single batch note: "N items repeat-rejected (same justification as RX)"
4. Known repeat offenders: S4036 (PATH binary hijacking on hardcoded
   `execFileSync`), swallowed exceptions in graceful degradation chains

**Source:** Multiple PRs — Qodo re-raises rejected items across rounds.

## 14. Cross-Platform Path Normalization

**Trigger:** PR modifies path-handling code (includes, endsWith, has, startsWith
on file paths). Verify ALL string-based path comparisons in modified files use
POSIX-normalized paths.

```bash
grep -n 'includes\|endsWith\|\.has(\|startsWith' <modified-file> | grep -iv 'toPosixPath\|normalize'
```

**Source:** PR #392 retro.

## 15. Logic Fix Test Matrix

**Trigger:** PR fixes logic bugs in pattern-matching, filtering, or detection
code. Before committing, define a test matrix covering: (1) target present +
changed, (2) target present + unchanged, (3) target removed + changed, (4) no
target + changed.

**Source:** PR #392 retro.

## 16. ESLint Rule CC: Extract Helpers Proactively

**Trigger:** PR adds or modifies ESLint rules. If any `create()` function or
helper has CC >10, extract into helper functions NOW. Target CC <=10 to leave
margin. Use the visitChild/visitAstChild pattern from `ast-utils.js` (see
FIX_TEMPLATE #42).

**Source:** PR #393/#394 retros.

## 17. Fix-One-Audit-All Propagation Check

**Trigger:** PR fixes a bug or adds handling for a pattern in one file. Before
committing, grep the codebase for ALL other instances of the same pattern gap.

Pre-commit runs propagation warning (non-blocking). Pre-push blocks on misses.

```bash
# Example: after fixing path normalization in one file
grep -rn 'includes\|endsWith\|\.has(\|startsWith' scripts/ --include="*.js" | grep -iv 'toPosixPath\|normalize'
```

**Source:** PR #366, #367, #369, #374, #379, #382 retros — longest-running
unresolved retro action item (6+ PRs).

## 18. Test-Production Regex Sync

**Trigger:** PR modifies a regex in a checker or compliance script. After
updating the production regex, verify that corresponding test files use the
matching pattern.

```bash
grep -rn 'pattern_you_changed' tests/ --include="*.test.*"
```

**Source:** PR #396 retro — test regex not updated with production regex (~0.5
avoidable rounds).

## 19. Tooling Migration Grep

**Trigger:** PR changes a dev tooling wrapper (fnm, nvm, rbenv, pyenv) or
migrates from one tool to another. Before pushing, grep for ALL usages of the
old AND new tool across the entire codebase:

```bash
grep -rn 'fnm env\|fnm use\|nvm use\|nvm install' scripts/ .claude/hooks/ --include="*.sh" --include="*.js"
```

Fix all instances in the same commit. Do NOT push with partial migration.

**Source:** PR #421 retro — 4-round fnm ripple chain (R2→R5). Each round found
another script missing `fnm use` after `fnm env`.

## 20. Parser/Algorithm Edge Case Matrix

**Trigger:** PR adds a new parser (YAML, JSON, config, log format) or algorithm
with multiple input formats. Before committing, enumerate ALL edge cases as a
test matrix:

- Quoted vs unquoted values
- Inline vs multi-line syntax
- Comments (inline, standalone)
- Empty/missing values
- Special characters / escaping
- Boundary markers (siblings vs children)

Commit the test matrix WITH the parser. Do not rely on reviewers to discover
edge cases one at a time.

**Source:** PR #423 retro — 3-round YAML parser hardening (boundary detection,
inline flow syntax, sibling keys, quoted comments).

## 21. Run SonarCloud Locally Before Pushing

**Trigger:** PR modifies >5 JS/TS files or introduces new scripts. Run
SonarCloud analysis locally before pushing to catch CC, code smells, and
security hotspots before the CI round-trip:

```bash
npx sonarqube-scanner 2>&1 | grep -E 'MAJOR|CRITICAL|BLOCKER'
```

Or at minimum, check CC on modified files:

```bash
npx eslint --rule '{"complexity": ["error", 15]}' <modified-files>
```

**Source:** PR #411 retro — 43% false positive rate from first-scan SonarCloud
volume not pre-screened.

## 22. Auto-Fixer Output Review

**Trigger:** PR runs an ESLint auto-fixer or codemod across multiple files.
After running any auto-fixer, review 3-5 transformed files for over-nesting,
unnecessary complexity, or patterns that will trigger SonarCloud. Auto-fixers
can produce technically correct but overly complex output.

```bash
# Check for deeply nested ternaries in fixed files
grep -n '? .* ? .* ?' <fixed-files> | head -10
```

**Source:** PR #427 retro — ESLint auto-fixer for no-unsafe-error-access
produced overly nested ternaries (R2→R3 ping-pong, ~0.5 avoidable rounds).

## 23. Escape Character Enumeration

**Trigger:** PR adds or modifies an escape/sanitization function (escapeMd,
escapeCell, escapeLinkText, sanitizeInput, etc.). Before committing, enumerate
ALL characters that need escaping for the target context and handle them in a
single pass. Do NOT discover characters one-at-a-time across review rounds.

Reference:
[MDN - Characters with special meaning](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#escaping)

**Source:** PR #398 retro — escapeLinkText needed 2 rounds due to incomplete
initial character enumeration.

## 24. Error Context in Catch Blocks

**Trigger:** PR adds or modifies try/catch blocks. Every `catch` block that logs
or re-throws MUST include the operation context (what was being attempted, which
file/record). Bare `catch(e) { throw e; }` or `console.error(e.message)` loses
context for debugging. Wrap with: `throw new Error(\`Failed to \${operation}:
\${e.message}\`)`.

**Source:** PR #427 retro — multiple catch blocks across review scripts lost
error context, required 2+ rounds to fix.
