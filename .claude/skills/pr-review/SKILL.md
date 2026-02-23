---
name: pr-review
description: PR Code Review Processor
---

# PR Code Review Processor

You are about to process AI code review feedback. This is a **standardized,
thorough review protocol** that ensures every issue is caught, addressed, and
documented.

## Scope — When to Use

- **Formal PR gate reviews** with standardized 8-step protocol
- Processing external review feedback (CodeRabbit, Qodo, SonarCloud)
- Ensuring every issue is fixed or tracked to TDMS before merge

> **Not for ad-hoc development reviews.** Use `code-reviewer` for post-task
> quality checks, quick reviews during development, or pre-merge self-review.

## Core Principles

1. **Fix Everything** - Including trivial items
2. **Learning First** - Create log entry before fixes
3. **Multi-Pass Verification** - Never miss an issue
4. **Parallel Agent Execution** - For 20+ items, spawn specialized agents in
   parallel
5. **Agent Augmentation** - Invoke domain specialists (security, docs, code
   quality)
6. **Full Documentation** - Every decision tracked
7. **Fix-or-Track** - Every issue is either fixed or logged to TDMS with a DEBT
   ID. No silent dismissals. "Pre-existing" and "out of scope" are not valid
   reasons to skip — classify the origin and either fix it or track it.

## Protocol Overview

```
STEP 0: CONTEXT (Load tiered docs)
    ↓
STEP 1: PARSE (Multi-pass for >200 lines + validate claims)
    ↓
STEP 1.5: SONARCLOUD ENRICHMENT (Auto-fetch code snippets if SonarCloud issues present)
    ↓
STEP 2: CATEGORIZE (ALWAYS - Critical/Major/Minor/Trivial)
    ↓
STEP 3: PLAN (TodoWrite - learning entry FIRST)
    ↓
STEP 4: AGENTS (20+ items? → PARALLEL specialists, else sequential)
    ↓
STEP 5: FIX (Priority order, verify each)
    ↓
STEP 6: DOCUMENT (Deferred/rejected decisions)
    ↓
STEP 6.5: TDMS (Ingest deferred items to debt tracker)
    ↓
STEP 7: LEARNING (Complete entry - MANDATORY)
    ↓
STEP 8: SUMMARY (Final verification status)
    ↓
STEP 9: COMMIT (Following project conventions)
```

---

## INPUT: Copy/Paste Feedback

**Why copy/paste**: Direct paste from CodeRabbit, Qodo, or SonarCloud provides
the most specific and thorough feedback. Automated fetch commands lose detail
and context.

**Supported sources**:

- CodeRabbit PR comments/suggestions
- Qodo PR compliance and code suggestions
- SonarCloud security hotspots and issues
- CI failure logs with pattern violations

---

## STEP 0.5: PRE-PUSH REVIEWER GATE (New Files)

**Before the first push to CI**, check if the PR includes any new files >500
lines. If so, run a code-reviewer agent on those files FIRST:

- New files >500 lines get 10+ Qodo issues per round
- A single code-reviewer pass catches 70-80% of issues pre-CI
- This prevents multi-round ping-pong with Qodo

If new large files exist:

1. Run `code-reviewer` agent on each file
2. Fix issues found
3. THEN push to CI

### Security Pattern Sweep (NEW — PR #366 Retro)

**Before the first push**, if the PR introduces security-adjacent code (write
helpers, state files, hooks), run a targeted grep for all write paths:

```bash
# Find all unguarded write paths in hooks/scripts
grep -rn 'writeFileSync\|renameSync\|appendFileSync' .claude/hooks/ scripts/ --include="*.js" | grep -v 'isSafeToWrite'
```

This catches the most common ping-pong pattern: a security fix applied to one
file while the same pattern exists in 10+ other files. PR #366 had 5 rounds of
symlink guard ping-pong that this sweep would have prevented.

### Cognitive Complexity Pre-Check (Updated — PR #371 Retro)

**Before the first push**, the pre-commit hook automatically runs CC as error on
staged .js files. This blocks commits with CC >15 functions.

If you need to check manually (e.g., before staging):

```bash
npx eslint --no-eslintrc --rule 'complexity: [error, 15]' --parser-options=ecmaVersion:2022 --parser-options=sourceType:module <files>
```

**After extracting helpers to reduce CC**, re-run the check on the entire file —
extracted helpers can inherit CC >15 from their parent functions. See
FIX_TEMPLATES.md Template 30.

CC violations were the #1 cross-PR churn driver across PRs #366-#371, causing
~20 avoidable review rounds. The pre-commit hook now enforces CC as error on
staged files (warn globally for 113 pre-existing violations).

### Filesystem Guard Pre-Check (NEW — PR #374 Retro)

**Before the first push**, if the PR introduces or modifies filesystem guard
functions (`isSafeToWrite`, `validatePathInDir`, path containment checks),
verify against the full lifecycle test matrix:

| Scenario                        | Test With                            |
| ------------------------------- | ------------------------------------ |
| File exists                     | Normal operation                     |
| File doesn't exist, parent does | `.tmp`/`.bak` paths                  |
| Parent doesn't exist            | Fresh checkout, `mkdirSync` ordering |
| Fresh checkout (no .claude/)    | First-ever run on clean clone        |
| Symlink in path                 | Symlink to outside project           |

Also verify path containment decisions BEFORE writing code:

1. **Which directions needed?** Descendant-only or bidirectional (ancestor +
   descendant)?
2. **Separator boundary?** `startsWith(root + path.sep)`, not `startsWith(root)`
3. **Case sensitivity?** Windows needs `.toLowerCase()`
4. **Depth limit?** If ancestor direction, cap at 10 levels

See FIX_TEMPLATES.md Templates 31 (realpathSync lifecycle) and 33 (path
containment decision matrix).

PR #374 had 4 rounds of containment direction flip-flopping and 4 rounds of
realpathSync edge cases — all preventable with this pre-check.

### Shared Utility Caller Audit (NEW — PR #374 Retro)

**Before the first push**, if the PR modifies any shared utility function (in
`lib/` directories), grep for ALL callers and verify they're compatible:

```bash
# Find all callers of the modified function
grep -rn "functionName" .claude/hooks/ scripts/ --include="*.js"
```

This catches the propagation miss pattern where a shared function behavior
changes but callers in other files aren't updated. PR #374 R4→R5 had a trim
behavior change in `gitExec()` that wasn't propagated to 4 callers in other
files.

### Algorithm Design Pre-Check (NEW — PR #379 Retro)

**Trigger:** PR introduces non-trivial algorithm logic (dedup, merge,
canonicalization, hashing, reconciliation, diffing).

Before pushing, verify the algorithm was **designed upfront**, not evolved
through reviewer feedback:

1. **Define invariants**: What properties must always hold? (e.g., "no duplicate
   evidence entries", "deterministic key ordering")
2. **Enumerate edge cases**: null/undefined inputs, empty arrays, circular
   references, nested objects, prototype pollution, depth overflow
3. **Handle all input types**: If consuming `JSON.parse` output, only
   string/number/boolean/null/array/object are possible — skip
   Date/RegExp/Map/Set
4. **Add depth/size caps**: Any recursive traversal needs `maxDepth` with a
   sensible default (e.g., 10) and circular reference detection via `WeakSet`
5. **Design the full algorithm before committing**: Write pseudocode or comments
   describing the complete approach, then implement. Don't commit a partial
   algorithm expecting reviewer iteration to complete it.

**Evidence:** PR #379 had 7 rounds of incremental evidence dedup refinement. 4
rounds (~57%) were avoidable with upfront algorithm design. See FIX_TEMPLATES
#34 for the complete evidence merge pattern.

### Mapping/Enumeration Completeness Pre-Check (NEW — PR #382 Retro)

**Trigger:** PR introduces or modifies mapping logic (severity, priority,
status, category) or dedup/enumeration boundaries.

Before pushing, verify completeness in one pass:

1. **Mapping completeness**: List ALL possible input values and verify each maps
   to the correct output. Don't fix only the reported branch — audit all
   branches. See FIX_TEMPLATES #35.
2. **Case sensitivity**: If inputs come from user-generated content or parsed
   markdown, use case-insensitive matching.
3. **Word boundaries**: Add `\b` to prevent substring false matches.
4. **Cross-file propagation**: Grep for ALL files with similar mapping logic and
   fix in one pass.
5. **Dedup boundaries**: Enumerate ALL dedup boundaries (cross-source,
   within-run, cross-batch) before coding. Add a hash set for each.

**Evidence:** PR #382 had 3-round severity chain (R1 fixed 2 of 4 levels) and
3-round dedup chain (3 boundaries discovered incrementally).

### Dual-File JSONL Write Check (NEW — PR #383 Retro)

**Trigger:** PR modifies any script in `scripts/debt/` that writes to
MASTER_DEBT.jsonl.

Before pushing, verify that ALL write paths also update `raw/deduped.jsonl`:

```bash
# Find scripts that write to MASTER but may miss deduped
grep -rn 'MASTER.*write\|MASTER.*rename\|masterTmp\|MASTER_FILE' scripts/debt/ --include="*.js" | grep -v deduped
```

If any script writes to MASTER_DEBT.jsonl without also writing to
raw/deduped.jsonl, `generate-views.js` will overwrite MASTER with stale data on
next run. Use FIX_TEMPLATES #36 (atomic dual-JSONL write with rollback) for the
correct pattern.

**Evidence:** PR #383 R7 found 4 scripts with sequential writes missing rollback
on second rename failure, and earlier sessions found data loss from MASTER being
overwritten by stale deduped.jsonl.

### Same-File Regex DoS Sweep (NEW — PR #382 Retro)

**Trigger:** SonarCloud flags a regex DoS (S5852) in a file.

After fixing the flagged regex, **grep the same file** for all other potentially
vulnerable regexes before committing:

```bash
grep -n '[+*].*[+*]\|[+*].*\\s' scripts/debt/target-file.js
```

SonarCloud sometimes reports only one DoS regex per scan. If the file has
multiple vulnerable regexes, you'll get a new finding each round.

**Evidence:** PR #382 R1 fixed `matchNumberedHeading` regex DoS, but R2 flagged
`isTableHeaderLine` regex DoS in the same file — same rule, avoidable round.

---

## STEP 0: CONTEXT LOADING (Tiered Access)

### 0.1 Episodic Memory Search

Search episodic memory for relevant past reviews before loading docs. Check if
same patterns were addressed in prior PRs to avoid re-investigating.

### 0.2 Tiered Document Loading

| Tier | When          | Documents                                                                       |
| ---- | ------------- | ------------------------------------------------------------------------------- |
| 1    | Always        | `claude.md` (root)                                                              |
| 2    | Quick Lookup  | `docs/agent_docs/CODE_PATTERNS.md`, `docs/agent_docs/FIX_TEMPLATES.md`          |
| 3    | Investigating | `docs/AI_REVIEW_LEARNINGS_LOG.md` (active reviews), `docs/AI_REVIEW_PROCESS.md` |
| 4    | Rarely        | `docs/archive/REVIEWS_*.md`                                                     |

---

## STEP 1: INITIAL INTAKE & PARSING

### 1.1 Identify Review Source

Determine which tool generated this review:

- **CodeRabbit PR** - GitHub PR comments/suggestions
- **CodeRabbit CLI** - Local hook output
- **Qodo Compliance** - PR compliance and suggestions
- **Qodo PR** - PR code suggestions
- **Mixed** - Multiple sources combined

### 1.2 Extract ALL Suggestions

Parse the entire input systematically. For reviews >200 lines:

- **First pass**: Extract all issue headers/titles
- **Second pass**: Extract details for each issue
- **Third pass**: Verify no issues were missed

For shorter reviews, single-pass extraction is acceptable.

Create a numbered master list:

```
[1] <file>:<line> - <issue summary>
[2] <file>:<line> - <issue summary>
...
[N] <file>:<line> - <issue summary>
```

### 1.3 Announce Count

State: "I identified **N total suggestions** from this review. Proceeding with
categorization."

### 1.4 Validate Critical Claims (IMPORTANT)

**BEFORE accepting "data loss" or "missing content" claims**, verify via
`git log --all --grep` and `git log --follow`. Common false positives: range gap
misinterpretation, intentional numbering skips, file moves. If FALSE POSITIVE:
mark REJECTED and document verification.

---

## STEP 1.5: SONARCLOUD ENRICHMENT (Automatic)

When SonarCloud issues are detected in pasted feedback, auto-fetch code snippets
for specific context. Triggers on `javascript:S####` rule IDs, "Security
Hotspot"/"Code Smell"/"Bug" labels, or SonarCloud file paths.

> **Details:** See
> [reference/SONARCLOUD_ENRICHMENT.md](reference/SONARCLOUD_ENRICHMENT.md)

---

## STEP 2: CATEGORIZATION (ALWAYS)

Categorize EVERY suggestion using this matrix:

**Severity:**

| Category     | Criteria                                                                     | Action Required                        |
| ------------ | ---------------------------------------------------------------------------- | -------------------------------------- |
| **CRITICAL** | Security vulnerabilities, data loss, breaking changes, blocking issues       | Fix IMMEDIATELY, separate commit       |
| **MAJOR**    | Significant bugs, performance issues, missing validation, logic errors       | Fix before proceeding                  |
| **MINOR**    | Code style, naming, missing tests, doc improvements, library recommendations | Fix (don't defer unless truly complex) |
| **TRIVIAL**  | Typos, whitespace, comment clarity, formatting                               | **FIX THESE TOO** - no skipping        |

**Origin (MANDATORY -- classify every item):**

| Origin                    | Criteria                                                | Action                                                          |
| ------------------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| **This-PR**               | Introduced by current PR's changes                      | Must fix -- this is your code                                   |
| **Pre-existing, fixable** | Not from this PR, but small enough to fix now (< 5 min) | Fix it now -- don't leave broken windows                        |
| **Pre-existing, complex** | Not from this PR, would take > 5 min or unfamiliar code | Track via `/add-debt` with DEBT-XXXX ID (mandatory)             |
| **Architectural**         | Requires design discussion or large-scale refactoring   | Flag to user -- do NOT silently dismiss or defer without asking |

> **"Pre-existing" and "out of scope" are never valid reasons to skip an
> issue.** Every item must be either fixed, tracked with a DEBT ID, or
> explicitly raised to the user for architectural discussion.

### Output Format:

```
## Categorization Results

### CRITICAL (X items) - IMMEDIATE ACTION
- [1] <issue> - File: <path> - Origin: This-PR

### MAJOR (X items) - MUST FIX
- [3] <issue> - File: <path> - Origin: Pre-existing, fixable

### MINOR (X items) - WILL FIX
- [5] <issue> - File: <path> - Origin: This-PR

### TRIVIAL (X items) - WILL FIX (not skipping)
- [8] <issue> - File: <path> - Origin: Pre-existing, fixable
```

---

## STEP 3: CREATE TODO LIST

Use **TodoWrite** to create trackable items for ALL issues (including TRIVIAL).

**CRITICAL RULE**: The learning log entry (`#TBD` stub) is ALWAYS the FIRST todo
item. Review number finalized in Step 7.

---

## STEP 4: INVOKE SPECIALIZED AGENTS

### 4.1 Single vs Parallel Execution

**Use PARALLEL agents when:**

- Total suggestions >= 20 items
- Multiple distinct files affected (3+ files)
- Issues span multiple concern areas (security + code quality + docs)
- User explicitly requests "multiple agents" or "parallel"
- **No S0/S1 security issues are in scope** (S0/S1 security must run
  focused/sequential)

**Use SEQUENTIAL agents when:**

- Total suggestions < 20 items
- All issues in same file or same concern area
- Simple/straightforward fixes

### 4.2 Agent Selection Matrix

| Issue Type               | Agent to Invoke                                   |
| ------------------------ | ------------------------------------------------- |
| Security vulnerabilities | `security-auditor` agent                          |
| Test coverage gaps       | `test-engineer` agent                             |
| Performance issues       | `performance-engineer` agent                      |
| Documentation issues     | `technical-writer` agent                          |
| Complex debugging        | `debugger` agent                                  |
| Architecture concerns    | `backend-architect` or `frontend-developer` agent |
| General code quality     | `code-reviewer` agent                             |

### 4.3-4.5 Parallel Agent Strategy

For 20+ items: group by concern area, batch into max 4 parallel agents, launch
via Task tool, then collect and verify results.

> **Details:** See
> [reference/PARALLEL_AGENT_STRATEGY.md](reference/PARALLEL_AGENT_STRATEGY.md)

---

## STEP 5: ADDRESS ISSUES (In Priority Order)

### 5.1 Fix Order

1. **CRITICAL** - Each in separate commit if needed
2. **MAJOR** - Can batch related fixes
3. **MINOR** - Can batch by file
4. **TRIVIAL** - Batch all together

### 5.2 For Each Fix

- **Check FIX_TEMPLATES first** - Read `docs/agent_docs/FIX_TEMPLATES.md` for
  copy-paste fixes for the top 29 Qodo findings. This prevents cascade fixes
  (fixing one issue in a way that creates another)
- **Read** the file first (never edit without reading)
- **Understand** the context around the issue
- **Apply** the fix (use template if available)
- **PROPAGATION CHECK (MANDATORY)** - After fixing a pattern-based issue, grep
  the entire codebase for the same pattern and fix ALL instances. See Section
  5.6 below. This prevents multi-round ping-pong where Qodo finds the same issue
  in a new file each round.
- **Verify** the fix doesn't introduce new issues
- **Mark** todo as completed
- **Two-strikes regex rule** - If SonarCloud flags the same regex twice, replace
  it with string parsing. Do NOT try to shrink the regex further. See
  FIX_TEMPLATES.md Template 21.

### 5.3 Pre-existing Items

Pre-existing fixable items (Origin: "Pre-existing, fixable") get fixed alongside
PR items in the normal priority flow. They do not need separate commits -- batch
them with related fixes by file or concern area.

**Do not skip these because they "aren't from this PR."** The review surfaced
them, so they get fixed now while the context is fresh.

### 5.4 Verification Passes

After all fixes:

- **Pass 1**: Re-read each modified file
- **Pass 2**: Run linter if available (`npm run lint`)
- **Pass 3**: Run tests if available (`npm run test`)
- **Pass 4**: Run pattern compliance check (`npm run patterns:check`) — catches
  cases where your own fixes violate the project's pattern rules. Evidence: PR
  #379 R10 introduced bare `renameSync` that R11's pattern checker flagged.
- **Pass 5**: Cross-reference original suggestions - confirm each is addressed

### 5.5 Batch Rule for Repetitive Files

If the same file appears in 3+ consecutive review rounds:

1. **Stop fixing incrementally** -- read ALL remaining suggestions holistically
2. Fix everything in one batch, then push once
3. This prevents the "fix one, break another" ping-pong pattern

### 5.6 Propagation Check (MANDATORY for Pattern-Based Fixes)

**Problem:** Fixing a pattern in one file while the same pattern exists in 10
other files causes multi-round ping-pong (Qodo finds a new instance each round).

**Rule:** When a review item describes a **pattern** (not a one-off bug), search
the entire codebase for all instances BEFORE committing.

**How to identify pattern-based issues:**

- Issue mentions a general practice (e.g., "symlink check", "atomic write",
  "try/catch around fs call")
- Fix involves adding/using a shared helper or utility
- The same code shape exists in multiple files
- Issue title says "also apply to..." or "missing in other files"

**Propagation workflow:**

1. Fix the reported instance first
2. Determine the **search pattern** — what does the unfixed version look like?
3. `grep -rn "PATTERN" .claude/hooks/ scripts/ --include="*.js"` (adjust scope)
4. Fix ALL matching instances in one pass
5. If a shared helper was created, verify every write path imports and uses it

**Examples from PR #366 (symlink guard ping-pong):**

- R4: Qodo flagged missing symlink check on 1 write path → fixed 1 path
- R5: Qodo found 3 more paths → fixed 3
- R6: Created shared `isSafeToWrite()` but only applied to target files, not tmp
  files
- R7: Qodo found tmp paths, standalone files, rotate-state.js → fixed 9 more
- **What should have happened:** R4 fix + grep for ALL `writeFileSync` +
  `renameSync` patterns → fix all ~15 paths in one round

**Search patterns for common issues:**

| Issue Type         | Search Pattern                                             |
| ------------------ | ---------------------------------------------------------- |
| Missing symlink    | `writeFileSync\|renameSync\|appendFileSync` without guard  |
| Missing try/catch  | `readFileSync` without surrounding try                     |
| Atomic write       | `writeFileSync.*tmp` without rm+rename                     |
| statSync vs lstat  | `statSync` (should be `lstatSync` for symlink safety)      |
| Inline vs shared   | Old inline pattern that should use the new shared helper   |
| Env var validation | `SKIP_REASON` (search ALL file types: JS, shell, hooks)    |
| POSIX compliance   | `$'\\'` or `grep -P` in `.husky/` scripts                  |
| realpathSync guard | `realpathSync` without try/catch or parent-dir fallback    |
| Path containment   | `startsWith(dir)` without `+ path.sep` boundary            |
| Shared util change | Modified function name → grep ALL callers across all files |
| Dual-file JSONL    | `MASTER.*write\|MASTER.*rename` without matching deduped   |

**CRITICAL (PR #367 retro):** Propagation checks must search ALL file types that
consume the same pattern. PR #367 R4 fixed SKIP_REASON validation in shell hooks
but missed the 3 JS scripts that also read SKIP_REASON — causing 3 extra review
rounds. When fixing env var handling, always:

1. `grep -rn "ENV_VAR_NAME" scripts/ .claude/hooks/ .husky/ --include="*.js" --include="*.sh"`
2. Fix ALL consumers in one pass, not just the reported file

**BLOCKING (PR #382 retro — 6th recommendation):** Propagation checks have been
recommended in PRs #366, #367, #369, #374, #379, and #382 but are STILL missed.
This is now the longest-running unresolved retro action item (6 PRs).

**Expanded scope (PR #382):** Propagation applies to MORE than just code
patterns. It also applies to:

- **Mapping logic**: Fix severity/priority in one file → grep for ALL files with
  similar mapping logic and fix in one pass
- **Regex DoS**: Fix one DoS regex → grep same file for ALL other vulnerable
  regexes
- **Dedup boundaries**: Add one dedup check → enumerate ALL dedup boundaries
  (cross-source, within-run, cross-batch)

The root cause is that propagation is a manual protocol step. When fixing ANY
pattern-based issue, ALWAYS grep before committing — even if you think it's a
one-off. Evidence: PR #382 R1 fixed severity mapping in one file but missed the
same mapping in the other file, causing R3. PR #382 R1 fixed one regex DoS but
missed a second in the same file, causing R2.

---

### 5.7 Input Validation Completeness (NEW — PR #367 Retro)

**Problem:** PR #367 had 4 rounds (R4-R7) of progressively hardening SKIP_REASON
validation — each round adding one more check. This is a common ping-pong
pattern.

**Rule:** When adding input validation for ANY user-controlled value (env vars,
CLI args, file content), implement the FULL validation chain in a single pass:

1. **Type check** — Is the value the expected type?
2. **Trim/normalize** — Strip whitespace, normalize encoding
3. **Empty check** — Reject empty after normalization
4. **Format check** — Single-line, no control chars, expected charset
5. **Length limit** — Prevent DoS via oversized input
6. **Encoding safety** — Use `codePointAt` not `charCodeAt` for Unicode

**If a shared validator exists, USE IT:**

- JS: `require("./lib/validate-skip-reason")` for SKIP_REASON
- Shell: Full validation in `require_skip_reason()` function

**If no shared validator exists, CREATE ONE** if 2+ files need the same
validation. This prevents future propagation misses.

---

### 5.8 Path Normalization Test Matrix (NEW — PR #370 Retro)

**Problem:** PR #370 had 3 rounds of `normalizeFilePath` ping-pong because edge
cases (CWD independence, trailing slashes) were missed incrementally.

**Rule:** When writing or modifying ANY path manipulation function, verify
against this test matrix BEFORE committing:

| Input                                      | Expected Behavior                  |
| ------------------------------------------ | ---------------------------------- |
| Absolute path (`/home/user/repo/file.js`)  | Strip prefix, return relative      |
| Relative path (`src/file.js`)              | Pass through unchanged             |
| Different CWD (`../other/file.js`)         | Resolve against repo root, not CWD |
| Directory with trailing slash (`scripts/`) | Preserve trailing slash            |
| Empty string                               | Return as-is or error              |
| Non-string input (`null`, `undefined`)     | Return as-is or error              |

Also: always store the resolved/validated form, never validate one form and
store another (see FIX_TEMPLATES #29).

---

## STEP 6: DOCUMENT DECISIONS

For any items NOT directly fixed in code, document using the strict templates
below. **Every non-fixed item MUST have a DEBT ID or explicit user sign-off.**

### Deferred Items (if any)

Every deferred item requires a DEBT-XXXX tracking ID. "Out of scope" and
"pre-existing" are NOT valid deferral reasons on their own.

```
### Deferred (X items)
- [N] <issue>
  - **Origin**: Pre-existing, complex / Architectural
  - **DEBT ID**: DEBT-XXXX (MANDATORY -- created via /add-debt)
  - **Why not now**: <specific reason>
  - **Estimated effort**: <rough size>
```

### Architectural Items (flagged to user)

Items classified as "Architectural" origin must be explicitly raised to the
user. Do NOT silently defer these -- present them and ask for direction.

### Rejected Items (if any - should be rare)

```
### Rejected (X items)
- [N] <issue>
  - **Reason**: <specific justification -- must be concrete>
  - **Reference**: <user requirement or design decision>
```

**NOTE**: Lean heavily toward FIXING over deferring. Even trivial items should
be fixed. Nothing gets silently dismissed.

---

## STEP 6.5: TDMS INTEGRATION (Deferred Items)

When items are deferred, they MUST be ingested into TDMS. Use `/add-debt` to
create entries with proper severity mapping (CRITICAL->S0, MAJOR->S1, MINOR->S2,
TRIVIAL->S3).

> **Details:** See
> [reference/TDMS_INTEGRATION.md](reference/TDMS_INTEGRATION.md)

---

## STEP 7: LEARNING CAPTURE (MANDATORY)

Finalize the review number (deferred from Step 3 to avoid collisions), complete
the learning entry with patterns, resolution stats, and key learnings. Run
`npm run reviews:sync -- --apply` to sync to JSONL.

> **Details:** See
> [reference/LEARNING_CAPTURE.md](reference/LEARNING_CAPTURE.md)

---

## STEP 8: FINAL SUMMARY

Provide: Statistics (total/fixed/deferred/rejected by severity), files modified,
agents invoked, learning entry number, TDMS items, verification checklist
(suggestions cross-referenced, linter, tests, learning entry), and commit
message suggestion.

---

## STEP 9: COMMIT

Create commit(s) following project conventions:

- **Prefix**: `fix:` for bug fixes, `docs:` for documentation
- **Body**: Reference the review source and summary
- **Separate commits** for Critical fixes if needed

---

## IMPORTANT RULES

1. **NEVER skip trivial items** - Fix everything
2. **ALWAYS create learning entry FIRST** - Before any fixes
3. **ALWAYS read files before editing** - No blind edits
4. **ALWAYS verify fixes** - Multiple passes
5. **ALWAYS use TodoWrite** - Track every item
6. **ALWAYS invoke specialized agents** - When issue matches their domain
7. **USE PARALLEL AGENTS for 20+ items** - Group by file/concern, launch 2-4
   simultaneously
8. **NEVER silently ignore** - Document all decisions
9. **MONITOR document health** - Archive when all criteria in Step 7.5 are met
10. **NEVER dismiss issues as "pre-existing" or "out of scope"** - Classify the
    origin, then fix it or track it with a DEBT ID. Architectural items get
    flagged to the user.

## Quick Reference

**Commands:** `npm run lint`, `npm run test`, `npm run patterns:check`

**Files to Update:** All review files + `docs/AI_REVIEW_LEARNINGS_LOG.md`
(MANDATORY)

---

## Update Dependencies

When updating this command (steps, rules, protocol), also update:

| Document                           | What to Update            | Why                           |
| ---------------------------------- | ------------------------- | ----------------------------- |
| `docs/SLASH_COMMANDS_REFERENCE.md` | `/pr-review` section      | Documentation of this command |
| `docs/AI_REVIEW_PROCESS.md`        | Related workflow sections | Process documentation         |

---

## NOW: Ready to process PR review feedback

Paste the review feedback below (CodeRabbit, Qodo, SonarCloud, or CI logs).

**Note:** Copy/paste provides more thorough feedback than automated fetching.

---

## Version History

| Version | Date       | Description                                                                                                                |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| 2.9     | 2026-02-22 | Add dual-file JSONL write check (Step 0.5), dual-file propagation pattern (Step 5.6). Source: PR #383 retro.               |
| 2.8     | 2026-02-20 | Add mapping/enumeration + regex DoS sweep pre-checks (Step 0.5), strengthen propagation (Step 5.6). Source: PR #382 retro. |
| 2.7     | 2026-02-20 | Add patterns:check to Step 5.4, propagation enforcement escalation in Step 5.6. Source: PR #379 retro.                     |
| 2.6     | 2026-02-19 | Add Algorithm Design Pre-Check (Step 0.5). Source: PR #379 retro.                                                          |
| 2.5     | 2026-02-18 | Add filesystem guard pre-check, shared utility caller audit, propagation patterns. Source: PR #374 retro.                  |
| 2.4     | 2026-02-17 | CC now enforced via pre-commit hook (error on staged files). Source: PR #371 retro.                                        |
| 2.3     | 2026-02-17 | Add CC Pre-Push Check (Step 0.5) + Path Test Matrix (Step 5.8). Source: PR #370 retro.                                     |
| 2.2     | 2026-02-15 | Add Security Pattern Sweep + Propagation Check (PR #366 retro)                                                             |
| 2.1     | 2026-02-14 | Extract reference docs: SonarCloud, agents, TDMS, learning                                                                 |
| 2.0     | 2026-02-10 | Full protocol with parallel agents, TDMS integration                                                                       |
| 1.0     | 2026-01-15 | Initial version                                                                                                            |
