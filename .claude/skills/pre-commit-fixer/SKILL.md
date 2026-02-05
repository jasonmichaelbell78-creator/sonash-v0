---
name: pre-commit-fixer
description: |
  Automatically fix pre-commit hook failures and retry the commit. Use when a
  git commit fails due to ESLint errors, pattern compliance violations, missing
  document headers, cross-document dependency issues, or documentation index
  staleness. Spawns a targeted subagent to fix each category of failure, then
  re-stages and re-commits. Reduces context waste from manual fix-commit-retry
  cycles.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-05
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Pre-Commit Fixer

## Purpose

Eliminate the context-heavy fix-commit-retry loop that happens when pre-commit
hooks fail. Instead of manually reading errors, fixing files, re-staging, and
re-committing (burning 500+ tokens per cycle), delegate the fix to a focused
subagent that works in bounded context.

## When to Use

Use this skill when `git commit` fails with any of these pre-commit errors:

| Error Category            | Detection Pattern                                |
| ------------------------- | ------------------------------------------------ |
| ESLint failures           | `ESLint passed (N errors)` or `eslint` in output |
| Pattern compliance        | `Pattern compliance` failed                      |
| Document headers          | `Missing required header` in output              |
| Cross-doc dependencies    | `not staged` or `cross-document` in output       |
| Documentation index stale | `DOCUMENTATION_INDEX.md not updated` in output   |
| Skill validation          | `Skill validation` failed                        |

## Workflow

### Step 1: Capture the Error

When a commit fails, capture the FULL error output. The error output contains
the exact information needed for the fix.

### Step 2: Classify the Failure

Read the error output and classify into one of these categories:

**Category A: Auto-fixable (no subagent needed)**

These can be fixed inline without spawning an agent:

1. **Documentation index stale** → Run
   `npm run docs:index && git add DOCUMENTATION_INDEX.md`
2. **Cross-doc dependency** → Stage the missing file: `git add <missing-file>`
3. **Lint-staged formatting** → Already auto-fixed by lint-staged, just
   re-commit

**Category B: Targeted fix (spawn subagent)**

These need code analysis and changes:

1. **ESLint errors** → Spawn `debugger` agent with error list and file paths
2. **Pattern compliance** → Spawn `code-reviewer` agent with violation details
3. **Document headers** → Add headers directly (template below)
4. **Skill validation** → Spawn `general-purpose` agent with skill file path

### Step 3: Execute Fix

**For Category A (inline fix):**

```bash
# Documentation index
npm run docs:index && git add DOCUMENTATION_INDEX.md

# Cross-doc dependency (example)
git add .claude/COMMAND_REFERENCE.md

# Re-commit (same message)
git commit -m "original message"
```

**For Category B (subagent fix):**

Spawn a focused subagent using the Task tool:

```
Task({
  subagent_type: "debugger",
  description: "Fix N pre-commit ESLint errors",
  prompt: "Fix these ESLint errors and stage the fixes:\n\n<paste error output>\n\nFiles to fix: <list>\n\nDo NOT create new files. Only fix the listed errors."
})
```

After the subagent returns, re-stage and re-commit.

### Step 4: Document Header Template

For new `.md` files missing headers, add this block after the YAML frontmatter
(if any) or at the top of the file:

```markdown
<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** YYYY-MM-DD
**Status:** ACTIVE
<!-- prettier-ignore-end -->
```

### Step 5: Re-commit

After all fixes are applied and staged:

```bash
git add <fixed-files>
git commit -m "original commit message"
```

If the commit fails again, repeat from Step 1. Cap at 3 retry cycles — if it
still fails after 3 attempts, report the remaining errors to the user.

## Anti-Patterns

- **Do NOT** use `SKIP_*` environment variables to bypass checks unless the user
  explicitly requests it
- **Do NOT** suppress ESLint rules with `// eslint-disable` unless the rule is
  genuinely a false positive
- **Do NOT** add files to pathExcludeList in check-pattern-compliance.js unless
  they are verified false positives
- **Do NOT** commit partial fixes — fix ALL reported errors before re-committing

## Context Efficiency

This skill saves context by:

1. Avoiding multiple round-trips of reading error → thinking → fixing → retrying
2. Delegating ESLint/pattern fixes to bounded subagents
3. Using deterministic templates for doc headers instead of researching format
4. Capping retry cycles to prevent unbounded loops
