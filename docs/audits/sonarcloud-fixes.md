# SonarCloud Issue Fixes

**Purpose**: Track issues that have been fixed, organized by commit.

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

- [Detailed Report](sonarcloud-issues-detailed.md) - Full issue list with code
- [Dismissals](sonarcloud-dismissals.md) - Issues dismissed with justification
- [Sprint Plan](../../.claude/plans/sonarcloud-cleanup-sprint.md) - 5-PR
  structure
