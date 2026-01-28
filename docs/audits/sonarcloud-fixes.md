# SonarCloud Issue Fixes

> **Last Updated:** 2026-01-27

## Purpose

This document tracks SonarCloud issues that have been fixed, organized by commit
and phase, providing an audit trail of code quality improvements.

**Format**: Each fix entry includes:

- Rule ID and location (or bulk marker)
- Commit hash
- Brief description of the fix

---

## Phase 1: Mechanical Fixes

### Node Protocol Imports (S7772)

#### Rule `javascript:S7772` - FIXED

**Commit**: `18025f7` **Files**: 40 files across scripts/, tests/, functions/,
lib/, .claude/hooks/ **Fix**: Converted bare `require('fs')` to
`require('node:fs')` pattern

#### Rule `typescript:S7772` - FIXED

**Commit**: `18025f7` **Files**: 40 files across scripts/, tests/, functions/,
lib/, .claude/hooks/ **Fix**: Converted bare `import from 'path'` to
`import from 'node:path'` pattern

### Shell Script Syntax (S7688)

#### Rule `shelldre:S7688` - FIXED

**Commit**: `ba5ba23` **Files**: 8 files in .claude/hooks/ and scripts/ **Fix**:
Converted POSIX `[ ]` test syntax to bash `[[ ]]` syntax

Files fixed:

- `.claude/hooks/analyze-user-request.sh`
- `.claude/hooks/check-edit-requirements.sh`
- `.claude/hooks/check-mcp-servers.sh`
- `.claude/hooks/check-write-requirements.sh`
- `.claude/hooks/coderabbit-review.sh`
- `.claude/hooks/pattern-check.sh`
- `.claude/hooks/session-start.sh`
- `scripts/check-review-triggers.sh`

### Shell Script Default Cases (S131)

#### Rule `shelldre:S131` - FIXED

**Commit**: `374d565` **Files**: 1 file **Fix**: Added default `*)` cases to
case statements in pattern-check.sh

### [shelldre:S131] - .claude/hooks/pattern-check.sh:36

**Commit**: `374d565` **Fix**: Added default case to security path validation
case statement

### [shelldre:S131] - .claude/hooks/pattern-check.sh:51

**Commit**: `374d565` **Fix**: Added default case to absolute/traversal path
check case statement

### Shell Script Return Statements (S7682)

#### Rule `shelldre:S7682` - FIXED

**Commit**: (current) **Files**: 4 files **Fix**: Added explicit `return`
statements at end of functions

Files fixed:

- `.claude/hooks/session-start.sh` - `compute_hash()`, `save_root_hash()`,
  `save_functions_hash()`
- `.claude/hooks/coderabbit-review.sh` - `to_lower()`
- `.claude/hooks/check-mcp-servers.sh` - `sanitize_output()`
- `.claude/hooks/analyze-user-request.sh` - `matches_word()`

### Shell Script Error Output (S7677)

#### Rule `shelldre:S7677` - FIXED

**Commit**: (current) **Files**: 3 files **Fix**: Redirected error messages to
stderr using `>&2`

Files fixed:

- `.claude/hooks/session-start.sh:254,280` - Error output for pattern checker
  and auto-consolidation
- `.claude/skills/artifacts-builder/scripts/init-artifact.sh:12,51` - Node
  version and tarball errors
- `.claude/skills/artifacts-builder/scripts/bundle-artifact.sh:8,14` - Missing
  file errors

### Shell Script Constants (S1192)

#### Rule `shelldre:S1192` - FIXED

**Commit**: (current) **Files**: 2 files **Fix**: Defined constants for repeated
literal strings

Files fixed:

- `.claude/hooks/session-start.sh` - Added `ROOT_LOCKFILE`,
  `FUNCTIONS_LOCKFILE`, `SEPARATOR_LINE` constants
- `scripts/check-review-triggers.sh` - Added `SEPARATOR_LINE` constant

### Shell Script Positional Parameters (S7679)

#### Rule `shelldre:S7679` - FIXED

**Commit**: (current) **Files**: 1 file **Fix**: Assigned positional parameter
to local variable before use

### [shelldre:S7679] - .claude/hooks/coderabbit-review.sh:33

**Commit**: (current) **Fix**: Changed `$1` to `local input="$1"` in
`to_lower()` function

---

## Phase 2: Critical Issues

<!-- Add Phase 2 fixes here -->

---

## Phase 3: Major Code Quality

<!-- Add Phase 3 fixes here -->

---

## Phase 4: Medium/Minor Priority

<!-- Add Phase 4 fixes here -->

---

## Phase 5: Security Hotspots

<!-- Add Phase 5 fixes here -->

---

## Related Documents

- **Detailed Report** - Run `node scripts/generate-detailed-sonar-report.js` to
  generate `sonarcloud-issues-detailed.md` (not tracked in git)
- [Dismissals](sonarcloud-dismissals.md) - Issues dismissed with justification
- [Sprint Plan](../archive/completed-plans/sonarcloud-cleanup-sprint.md) - 5-PR
  structure (paused)

---

## Version History

| Version | Date       | Changes                            |
| ------- | ---------- | ---------------------------------- |
| 1.0     | 2026-01-19 | Initial version with Phase 1 fixes |
