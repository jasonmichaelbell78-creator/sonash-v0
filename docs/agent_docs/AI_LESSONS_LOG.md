# AI Lessons Log

**Purpose**: Capture learnings from code quality sprints, SonarCloud cleanups,
and other systematic improvement efforts. This complements the
AI_REVIEW_LEARNINGS_LOG.md which tracks PR review learnings.

**Last Updated**: 2026-01-19

---

## Table of Contents

1. [SonarCloud Cleanup Sprint](#sonarcloud-cleanup-sprint)
   - [PR 1: Mechanical Fixes](#pr-1-mechanical-fixes-2026-01-19)

---

## SonarCloud Cleanup Sprint

### PR 1: Mechanical Fixes (2026-01-19)

**Issues Resolved**: 190 total (8 rules across 48 files)

**Summary**: Addressed all mechanical/automatable SonarCloud issues including
Node.js import conventions and shell script best practices.

---

#### Patterns Discovered

##### 1. Node.js Import Protocol Inconsistency

**Description**: Mixed usage of bare imports (`require('fs')`) and protocol
imports (`require('node:fs')`) across the codebase.

- **Root Cause**: No established convention; different files written at
  different times
- **Scale**: 117 issues across 40 files
- **Prevention**: Add ESLint rule or pattern check for `node:` prefix

##### 2. Shell Script Syntax Modernization

**Description**: Legacy shell syntax (`[ ]`) used instead of modern bash
(`[[ ]]`), missing return statements, and inconsistent error handling.

- **Root Cause**: Scripts written by different authors with varying shell
  experience
- **Scale**: 73 issues across 10 shell scripts
- **Prevention**: Add `shellcheck` to CI pipeline

##### 3. Repeated String Literals in Shell

**Description**: Same string (e.g., separator lines, file paths) repeated
multiple times instead of using constants.

- **Root Cause**: Incremental script development without refactoring
- **Scale**: 4 issues, but indicates broader pattern
- **Prevention**: Code review checklist item for shell scripts

---

#### Fix Techniques

| Rule  | Technique                          | Example                                           |
| ----- | ---------------------------------- | ------------------------------------------------- |
| S7772 | Add `node:` prefix to imports      | `require('fs')` → `require('node:fs')`            |
| S7688 | Use `[[` instead of `[` for tests  | `[ -z "$var" ]` → `[[ -z "$var" ]]`               |
| S7682 | Add explicit return statements     | Add `return 0` at function end                    |
| S7677 | Redirect errors to stderr          | `echo "Error"` → `echo "Error" >&2`               |
| S1192 | Define constants for literals      | `readonly SEPARATOR="━━━"`                        |
| S131  | Add default case to case statement | `*) ;; # default case`                            |
| S7679 | Assign positional params to locals | `local input="$1"` instead of using `$1` directly |

---

#### False Positives Identified

None in PR 1 - all issues were valid and fixable.

---

#### Secondary Learnings (from PR Review)

During the PR review process (Review #181), additional patterns were discovered:

##### 1. SonarCloud Fixes Can Introduce New Bugs

When converting `[ ]` to `[[ ]]`, a typo introduced `[[[` syntax which is
invalid bash. The pattern compliance checker caught this before merge.

- **Lesson**: Run syntax validation after batch find-replace operations
- **Prevention**: Add bash syntax check to pre-commit hooks

##### 2. ESM Import Syntax for Node Built-ins

In ESM modules, `import fs from 'node:fs'` works but
`import * as fs from 'node:fs'` is more correct because fs doesn't have a
default export.

- **Lesson**: Use namespace imports for Node built-ins in ESM
- **Prevention**: Update ESLint config or add pattern check

##### 3. Path Containment Check Patterns

Simple `.startsWith('..')` checks have edge cases (e.g., files named
`..hidden.md`). Use regex: `/^\.\.(?:[\\/]|$)/.test(relative)`

- **Lesson**: Path security checks need robust regex patterns
- **Prevention**: Add to CODE_PATTERNS.md anti-patterns

##### 4. Variable Definition Order in Shell

With `set -u`, using a variable before it's defined causes script failure. When
adding constants, ensure they're defined before first use.

- **Lesson**: Shell variable order matters with strict mode
- **Prevention**: Define all constants at top of script

---

#### Recommendations for claude.md

- [x] Path containment pattern already in Section 4
- [ ] Consider adding `node:` prefix convention to coding standards
- [ ] Consider adding shell script best practices section

---

#### Files Modified

**Node.js Scripts (40 files)**:

- `scripts/*.js` - Build and utility scripts
- `scripts/*.ts` - TypeScript utility scripts
- `.claude/hooks/*.js` - Claude Code hook implementations
- `tests/scripts/*.ts` - Test files
- `functions/src/*.ts` - Firebase Functions
- `lib/*.ts` - Shared library code

**Shell Scripts (10 files)**:

- `.claude/hooks/*.sh` - Claude Code shell hooks
- `scripts/check-review-triggers.sh` - Review trigger checker
- `.claude/skills/artifacts-builder/scripts/*.sh` - Artifact builder scripts

---

#### Metrics

| Metric             | Value |
| ------------------ | ----- |
| Total Issues Fixed | 190   |
| Files Modified     | 48    |
| Rules Addressed    | 8     |
| Commits            | 10    |
| False Positives    | 0     |
| Issues Dismissed   | 0     |

---
