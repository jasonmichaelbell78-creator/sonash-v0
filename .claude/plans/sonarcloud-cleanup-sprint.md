# SonarCloud Cleanup Sprint Plan

**Created**: 2026-01-19 **Last Updated**: 2026-01-19 **Status**: ACTIVE
**Detailed Report**:
[sonarcloud-issues-detailed.md](../../docs/audits/sonarcloud-issues-detailed.md)

---

## Goal

Resolve ALL 1,608 SonarCloud issues and 97 security hotspots to achieve a
passing Quality Gate. Each issue must be either FIXED or DISMISSED with
documented justification.

---

## Current State (2026-01-19)

| Metric            | Value     | Target       |
| ----------------- | --------- | ------------ |
| Quality Gate      | ERROR     | PASSED       |
| BLOCKER Issues    | 3         | 0            |
| CRITICAL Issues   | 107       | 0            |
| MAJOR Issues      | 409       | 0            |
| MINOR Issues      | 1,080     | 0            |
| INFO Issues       | 9         | 0            |
| Security Hotspots | 97        | All reviewed |
| **Total**         | **1,705** | **0 open**   |

### Issues by Type

| Type          | Count |
| ------------- | ----- |
| CODE_SMELL    | 1,581 |
| BUG           | 24    |
| VULNERABILITY | 3     |

### Top Files by Issue Count

| File                                      | Issues |
| ----------------------------------------- | ------ |
| `scripts/generate-documentation-index.js` | 213    |
| `scripts/suggest-pattern-automation.js`   | 52     |
| `hooks/use-journal.ts`                    | 49     |
| `scripts/phase-complete-check.js`         | 48     |
| `lib/db/meetings.ts`                      | 42     |

See full breakdown:
[sonarcloud-issues-detailed.md](../../docs/audits/sonarcloud-issues-detailed.md)

---

## PR Structure (5 PRs)

### PR 1: Mechanical Fixes (~189 issues)

**Branch**: `cleanup/phase-1-mechanical` **Commit**:
`fix(sonar): mechanical fixes - node imports and shell scripts` **Tracking**:
[PR1 Checklist](#pr-1-checklist)

#### Part A: Node Protocol Imports (~117 issues, MINOR)

Convert bare Node.js imports to use `node:` protocol prefix.

| Rule             | Count | Example Fix                                        |
| ---------------- | ----- | -------------------------------------------------- |
| javascript:S7772 | 63    | `require('fs')` → `require('node:fs')`             |
| typescript:S7772 | 54    | `import fs from 'fs'` → `import fs from 'node:fs'` |

**Files**: See report section "Rule Reference" filtering by S7772

#### Part B: Shell Script Fixes (~72 issues, MAJOR/MINOR)

| Rule           | Count | Fix                               |
| -------------- | ----- | --------------------------------- |
| shelldre:S7688 | 55    | Use `[[` instead of `[` for tests |
| shelldre:S7682 | 6     | Add explicit return statements    |
| shelldre:S7677 | 5     | Redirect errors to stderr         |
| shelldre:S1192 | 4     | Define constants for literals     |
| shelldre:S7679 | 1     | Exit code handling                |
| shelldre:S131  | 1     | Add default case                  |

**Files**: `.claude/hooks/*.sh`, `scripts/*.sh`

---

### PR 2: Critical Issues (~107 issues)

**Branch**: `cleanup/phase-2-critical` **Commit**:
`fix(sonar): resolve all critical and blocker issues` **Tracking**:
[PR2 Checklist](#pr-2-checklist)

#### Part A: Cognitive Complexity (~82 issues, CRITICAL)

Refactor functions exceeding complexity threshold of 15.

| Rule             | Count | Approach                     |
| ---------------- | ----- | ---------------------------- |
| javascript:S3776 | 48    | Extract helper functions     |
| typescript:S3776 | 34    | Split into smaller functions |

**High-Priority Files** (from detailed report Priority section):

- `functions/src/jobs.ts:196` - Complexity 34
- `functions/src/jobs.ts:653` - Complexity 42
- `scripts/aggregate-audit-findings.js` - Multiple functions

#### Part B: Other Critical Issues (~25 issues, CRITICAL)

| Rule             | Count | Fix                               |
| ---------------- | ----- | --------------------------------- |
| typescript:S3735 | 12    | Remove `void` operator misuse     |
| typescript:S2004 | 5     | Extract nested functions          |
| typescript:S2871 | 4     | Add compare function to sort()    |
| typescript:S6861 | 3     | Use `const` for exported bindings |
| shelldre:S131    | 1     | Add default case to switch        |

---

### PR 3: Major Code Quality (~220 issues)

**Branch**: `cleanup/phase-3-major-quality` **Commit**:
`fix(sonar): resolve major code quality issues` **Tracking**:
[PR3 Checklist](#pr-3-checklist)

#### Part A: Ternary Expression Complexity (~108 issues, MAJOR)

| Rule             | Count | Fix                                 |
| ---------------- | ----- | ----------------------------------- |
| typescript:S3358 | 79    | Extract nested ternaries to if/else |
| javascript:S3358 | 29    | Use intermediate variables          |

#### Part B: React-Specific Issues (~110 issues, MAJOR)

| Rule             | Count | Description                  |
| ---------------- | ----- | ---------------------------- |
| typescript:S6853 | 42    | Form label association       |
| typescript:S6479 | 21    | Don't use array index as key |
| typescript:S6819 | 19    | Img alt vs presentation role |
| typescript:S6848 | 13    | Non-native interactive roles |
| typescript:S6772 | 9     | Ambiguous spacing            |
| typescript:S6481 | 6     | Object in context value      |

#### Part C: Other Major Issues (~10 issues)

| Rule             | Count | Fix                       |
| ---------------- | ----- | ------------------------- |
| typescript:S7785 | 14    | Use top-level await       |
| javascript:S7785 | 13    | Use top-level await       |
| javascript:S5843 | 12    | Simplify regex complexity |

**Note**: Shell script issues (S7688, S7682, S7677) counted in PR1.

---

### PR 4: Medium/Minor Priority (~1,095 issues)

**Branch**: `cleanup/phase-4-medium-priority` **Commit**:
`fix(sonar): resolve medium and minor code issues` **Tracking**:
[PR4 Checklist](#pr-4-checklist)

#### Part A: String Methods (~362 issues, MINOR)

| Rule             | Count | Fix                                       |
| ---------------- | ----- | ----------------------------------------- |
| javascript:S7781 | 150   | Use `replaceAll()` instead of `replace()` |
| typescript:S7781 | 61    | Use `replaceAll()` instead of `replace()` |
| javascript:S7778 | 151   | Batch multiple `push()` calls             |

#### Part B: Modern JavaScript (~300 issues, MINOR)

| Rule             | Count | Fix                                   |
| ---------------- | ----- | ------------------------------------- |
| javascript:S7780 | 77    | Use `String.raw` for escapes          |
| typescript:S7764 | 73    | Use `globalThis` over `window`        |
| typescript:S7773 | 52    | Use `Number.isNaN` over `isNaN`       |
| javascript:S7773 | 26    | Use `Number.parseInt` over `parseInt` |

#### Part C: React Props (~143 issues, MINOR)

| Rule             | Count | Fix                                     |
| ---------------- | ----- | --------------------------------------- |
| typescript:S6759 | 71    | Mark component props as read-only       |
| typescript:S1874 | 52    | Replace deprecated API usage            |
| typescript:S1082 | 13    | Add keyboard handlers to click handlers |

#### Part D: Remaining Issues (~290 issues)

All other MINOR and INFO level issues. See detailed report for complete list.

---

### PR 5: Security Hotspots (97 hotspots)

**Branch**: `cleanup/phase-5-security` **Commit**:
`security(sonar): resolve all security hotspots` **Tracking**:
[PR5 Checklist](#pr-5-checklist)

#### Part A: HIGH Probability (~14 hotspots)

Command injection and hard-coded credentials. See report "Security Hotspots"
section.

**Action**: Fix or mark SAFE with justification.

#### Part B: MEDIUM Probability (~48 hotspots)

Regex DoS and Math.random usage.

| Category    | Count | Resolution                                |
| ----------- | ----- | ----------------------------------------- |
| Regex DoS   | ~33   | Limit input length, rewrite patterns      |
| Math.random | ~15   | Mark SAFE if visual-only (confetti, etc.) |

#### Part C: LOW Probability (~35 hotspots)

| Category          | Count | Resolution                      |
| ----------------- | ----- | ------------------------------- |
| PATH manipulation | 27    | Review, mark SAFE if dev-only   |
| GitHub Actions    | 3     | Pin to full SHA, review secrets |
| Other             | 5     | Case-by-case review             |

---

## Verification Process

### Pre-Commit Verification

Before committing each PR phase, run the verification checklist:

```bash
# Generate fresh checklist for the PR phase
node scripts/verify-sonar-phase.js --phase=1  # (or 2, 3, 4, 5)
```

This script:

1. Reads the detailed report for issues in that phase
2. Checks which issues are resolved (file/line no longer matches)
3. Requires dismissal justification for unresolved issues
4. Outputs a verification report

### Checklist Requirements

For each issue, one of:

- **FIXED**: Code changed, issue no longer present
- **DISMISSED**: Issue acknowledged, documented reason (e.g., false positive,
  acceptable risk)
- **DEFERRED**: Moved to different PR with justification

### Dismissal Documentation

Create `docs/audits/sonarcloud-dismissals.md` with:

```markdown
## Dismissed Issues

### [Rule ID] - File:Line

**Reason**: [False positive | Acceptable risk | By design | ...]
**Justification**: [Detailed explanation] **Reviewed by**: [Name/Date]
```

---

## PR Checklists

### PR 1 Checklist

- [ ] All S7772 node import issues resolved (117)
- [ ] All shelldre:\* issues resolved (72)
- [ ] Verification script passes: `node scripts/verify-sonar-phase.js --phase=1`
- [ ] Any dismissals documented in sonarcloud-dismissals.md
- [ ] Tests passing: `npm test`
- [ ] Lint passing: `npm run lint`
- [ ] Type check passing: `npm run type-check`

### PR 2 Checklist

- [ ] All S3776 complexity issues resolved (82)
- [ ] All S3735 void operator issues resolved (12)
- [ ] All S2004 nested function issues resolved (5)
- [ ] All S2871 sort comparison issues resolved (4)
- [ ] All S6861 mutable export issues resolved (3)
- [ ] Verification script passes: `node scripts/verify-sonar-phase.js --phase=2`
- [ ] Any dismissals documented
- [ ] All tests passing

### PR 3 Checklist

- [ ] All S3358 nested ternary issues resolved (108)
- [ ] All React accessibility issues resolved (~110)
- [ ] Verification script passes: `node scripts/verify-sonar-phase.js --phase=3`
- [ ] Any dismissals documented
- [ ] All tests passing

### PR 4 Checklist

- [ ] All string method issues resolved (~362)
- [ ] All modern JS issues resolved (~300)
- [ ] All React props issues resolved (~143)
- [ ] Remaining MINOR/INFO issues resolved (~290)
- [ ] Verification script passes: `node scripts/verify-sonar-phase.js --phase=4`
- [ ] Any dismissals documented
- [ ] All tests passing

### PR 5 Checklist

- [ ] All HIGH probability hotspots reviewed
- [ ] All MEDIUM probability hotspots reviewed
- [ ] All LOW probability hotspots reviewed
- [ ] Verification script passes: `node scripts/verify-sonar-phase.js --phase=5`
- [ ] All hotspot decisions documented (FIXED/SAFE/ACKNOWLEDGED)
- [ ] All tests passing

---

## Execution Order

Recommended sequence for maximum impact:

1. **PR 1** - Mechanical (build confidence, reduce noise)
2. **PR 2** - Critical (highest severity, biggest quality impact)
3. **PR 5** - Security (address security early in sprint)
4. **PR 3** - Major quality (significant improvements)
5. **PR 4** - Medium/minor (largest volume, lowest risk)

---

## Success Criteria

- [ ] Quality Gate: PASSED
- [ ] BLOCKER Issues: 0
- [ ] CRITICAL Issues: 0
- [ ] MAJOR Issues: 0
- [ ] MINOR Issues: 0 (or all dismissed with documentation)
- [ ] Security Hotspots: All reviewed (SAFE/FIXED/ACKNOWLEDGED)
- [ ] All dismissals documented in sonarcloud-dismissals.md
- [ ] No new issues introduced
- [ ] All tests passing
- [ ] Post-sprint snapshot created

---

## Related Documents

- [Detailed Report](../../docs/audits/sonarcloud-issues-detailed.md) - Full
  issue list with code snippets
- [Cleanup Runbook](../../docs/SONARCLOUD_CLEANUP_RUNBOOK.md) - Step-by-step
  procedures
- [Triage Decisions](../../docs/SONARCLOUD_TRIAGE.md) - Historical triage
  decisions
- [SonarCloud Dashboard](https://sonarcloud.io/project/overview?id=jasonmichaelbell78-creator_sonash-v0)
- [Report Generator](../../scripts/generate-detailed-sonar-report.js) - Script
  to refresh report
