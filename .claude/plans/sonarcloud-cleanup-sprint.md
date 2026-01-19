# SonarCloud Cleanup Sprint Plan

**Created**: 2026-01-19 **Status**: BLOCKER for Operational Visibility Sprint
**Full Snapshot**:
[docs/audits/sonarcloud-snapshots/20260119-full.md](../../docs/audits/sonarcloud-snapshots/20260119-full.md)

---

## Goal

Resolve ALL 1,213 SonarCloud issues (1,116 code issues + 97 security hotspots)
to achieve a passing Quality Gate before resuming feature development.

---

## Current State

| Metric            | Value     | Target       |
| ----------------- | --------- | ------------ |
| Quality Gate      | ERROR     | PASSED       |
| CRITICAL Issues   | 93        | 0            |
| MAJOR Issues      | 304       | 0            |
| MINOR Issues      | 716       | 0            |
| Security Hotspots | 97        | All reviewed |
| **Total**         | **1,213** | **0 open**   |

### Issues by Directory

| Directory  | Total | CRITICAL | MAJOR | MINOR |
| ---------- | ----- | -------- | ----- | ----- |
| scripts    | 512   | 51       | 84    | 376   |
| components | 352   | 24       | 140   | 187   |
| lib        | 76    | 5        | 11    | 59    |
| .claude    | 55    | 1        | 51    | 3     |
| functions  | 41    | 10       | 11    | 20    |
| hooks      | 34    | 1        | 0     | 33    |
| tests      | 21    | 0        | 1     | 20    |
| app        | 21    | 1        | 5     | 15    |

---

## PR Structure (5 PRs - One Per Phase)

### PR 1: Mechanical Fixes (~290 issues, ~5hr)

**Branch**: `cleanup/phase-1-mechanical` **Commit**:
`fix(sonar): mechanical fixes - node imports and shell scripts`

#### Part A: Node Protocol Imports (~230 issues, MINOR)

Convert bare Node.js imports to use `node:` protocol prefix.

| Rule  | Count | Example Fix                                                |
| ----- | ----- | ---------------------------------------------------------- |
| S7772 | 93    | `require('fs')` → `require('node:fs')`                     |
| S7781 | 126   | `import path from 'path'` → `import path from 'node:path'` |
| S7778 | ~93   | Similar pattern                                            |

**Directories**: scripts/, tests/, functions/

#### Part B: Shell Script Fixes (~60 issues, MAJOR)

| Rule  | Count | Fix                         |
| ----- | ----- | --------------------------- |
| S7688 | 51    | Shell script best practices |
| S7682 | 6     | Double-quote variables      |
| S7677 | 5     | Proper condition brackets   |
| S131  | 1     | Add default case            |
| S1192 | 4     | Reduce string duplication   |

**Directories**: .claude/, scripts/

---

### PR 2: Critical Complexity (75 issues, ~14hr)

**Branch**: `cleanup/phase-2-complexity` **Commit**:
`refactor(sonar): reduce cognitive complexity across codebase`

#### Part A: Scripts Complexity (46 issues, CRITICAL)

Reduce cognitive complexity below threshold of 15.

| File                            | Current | Target | Approach                     |
| ------------------------------- | ------- | ------ | ---------------------------- |
| aggregate-audit-findings.js     | 87      | 15     | Extract 5+ helper functions  |
| generate-documentation-index.js | 56      | 15     | Split generator logic        |
| check-docs-light.js             | 55      | 15     | Extract validation functions |
| check-backlog-health.js         | 39      | 15     | Modularize checks            |
| validate-canon-schema.js        | 37      | 15     | Extract rule validators      |
| security-check.js               | 35      | 15     | Separate check patterns      |
| run-consolidation.js            | 34      | 15     | Extract steps                |
| validate-audit.js               | 34      | 15     | Modularize                   |
| + 38 more files                 | 16-32   | 15     | Simplify logic               |

#### Part B: App Code Complexity (29 issues, CRITICAL)

| File                                         | Current | Target | Approach                  |
| -------------------------------------------- | ------- | ------ | ------------------------- |
| functions/src/jobs.ts:653                    | 42      | 15     | Extract job handlers      |
| functions/src/security-wrapper.ts:106        | 39      | 15     | Split validation          |
| components/notebook/pages/resources-page.tsx | 48      | 15     | Split into sub-components |
| components/admin/users-tab.tsx               | 41      | 15     | Extract UserRow, filters  |
| components/settings/settings-page.tsx        | 41      | 15     | Split sections            |
| + 24 more                                    | 16-35   | 15     | Various                   |

---

### PR 3: Major Code Quality (~175 issues, ~11hr)

**Branch**: `cleanup/phase-3-major-quality` **Commit**:
`fix(sonar): resolve major code quality issues`

#### Part A: Ternary Expression Complexity (71 issues, MAJOR)

| Language   | Count | Pattern                        |
| ---------- | ----- | ------------------------------ |
| TypeScript | 52    | Nested ternaries in components |
| JavaScript | 19    | Nested ternaries in scripts    |

**Fix**: Extract to if/else blocks or intermediate variables

#### Part B: Critical Code Smells (17 issues, CRITICAL)

| Rule  | Count | Fix                                            |
| ----- | ----- | ---------------------------------------------- |
| S3735 | 12    | `void promise()` → `promise().catch(() => {})` |
| S2004 | 2     | Extract deeply nested functions                |
| S6861 | 3     | Case-by-case fixes                             |

#### Part C: React-Specific Issues (~90 issues, MAJOR)

| Rule   | Count | Description                    |
| ------ | ----- | ------------------------------ |
| S6853  | 35    | React component best practices |
| S6479  | 20    | Don't use array index as key   |
| S6819  | 15    | JSX accessibility issues       |
| S6772  | 5     | Component structure            |
| S6848  | 5     | Hook dependencies              |
| Others | 10    | Misc React patterns            |

---

### PR 4: Medium Priority (~480 issues, ~13hr)

**Branch**: `cleanup/phase-4-medium-priority` **Commit**:
`fix(sonar): resolve medium and minor code issues`

#### Part A: Deprecation Warnings (~100 issues, MINOR)

| Rule  | Count | Description                  |
| ----- | ----- | ---------------------------- |
| S6759 | 68    | Various deprecation warnings |
| S1874 | 36    | Deprecated API usage         |

#### Part B: Remaining MAJOR Issues (~50 issues)

| Rule              | Count | Description                      |
| ----------------- | ----- | -------------------------------- |
| S7785             | 19    | Various issues                   |
| S1854             | 8     | Dead stores (unused assignments) |
| S6582             | 7     | Use optional chaining            |
| S5869/S4624/S5843 | 18    | Regex and logic issues           |
| Others            | ~10   | Miscellaneous                    |

#### Part C: Remaining MINOR Issues (~330 issues)

| Rule   | Count |
| ------ | ----- |
| S7780  | 44    |
| S7773  | 50    |
| S7735  | 34    |
| S6551  | 13    |
| S3863  | 12    |
| Others | ~180  |

---

### PR 5: Security Hotspots (97 hotspots, ~9hr)

**Branch**: `cleanup/phase-5-security` **Commit**:
`security(sonar): resolve all security hotspots`

#### Part A: HIGH Priority - Command Injection (10 hotspots)

| File                                | Lines    | Fix                |
| ----------------------------------- | -------- | ------------------ |
| scripts/ai-review.js                | 222, 227 | Use `execFileSync` |
| scripts/check-pattern-compliance.js | 463      | Use array args     |
| scripts/check-review-needed.js      | 234      | Use array args     |
| scripts/phase-complete-check.js     | 437      | Use array args     |
| scripts/security-check.js           | 189      | Use array args     |
| scripts/retry-failures.ts           | 113      | Use array args     |

**Pattern**:

```javascript
// Before (vulnerable)
execSync(`git log ${userInput}`);

// After (safe)
execFileSync("git", ["log", userInput]);
```

#### Part B: HIGH Priority - Hard-coded Passwords (4 hotspots)

| File                       | Lines   | Action                                          |
| -------------------------- | ------- | ----------------------------------------------- |
| lib/utils/errors.ts        | 69, 71  | Review - likely false positive (error patterns) |
| tests/utils/logger.test.ts | 96, 130 | Review - test fixture data                      |

#### Part C: MEDIUM Priority - Regex DoS (33 hotspots)

Affected: 15 script files, 5 app files

**Fixes**:

1. Limit input length before regex matching
2. Rewrite patterns to avoid catastrophic backtracking
3. Use linear-time alternatives where possible

#### Part D: MEDIUM Priority - Math.random (15 hotspots)

| File                                       | Count | Resolution                 |
| ------------------------------------------ | ----- | -------------------------- |
| components/celebrations/confetti-burst.tsx | 10    | Mark SAFE - visual effects |
| components/celebrations/firework-burst.tsx | 5     | Mark SAFE - visual effects |

**Rationale**: Math.random used for purely visual particle animations - no
security impact.

#### Part E: LOW Priority Hotspots (35 hotspots)

| Rule            | Count | Action                                      |
| --------------- | ----- | ------------------------------------------- |
| S4036 (PATH)    | 27    | Review dev scripts - controlled environment |
| S7637 (SHA)     | 2     | Pin GitHub Actions to full SHA              |
| S7636 (secrets) | 1     | Review workflow pattern                     |
| S5604 (geo)     | 1     | Document geolocation usage                  |
| S5332 (HTTP)    | 1     | Test file - mark SAFE                       |
| S1523 (eval)    | 1     | Test file - review                          |

---

## Execution Strategy

### Branch Structure

```
main
├── cleanup/phase-1-mechanical     # PR 1: ~290 issues
├── cleanup/phase-2-complexity     # PR 2: 75 issues
├── cleanup/phase-3-major-quality  # PR 3: ~175 issues
├── cleanup/phase-4-medium-priority # PR 4: ~480 issues
└── cleanup/phase-5-security       # PR 5: 97 hotspots
```

### Recommended Order

1. **PR 1**: Mechanical fixes (build confidence, reduce noise)
2. **PR 2**: Critical complexity (biggest quality impact)
3. **PR 5**: Security hotspots (address HIGH priority early)
4. **PR 3**: Major code quality
5. **PR 4**: Medium/minor issues (largest volume, lowest risk)

### Verification Per PR

```bash
npm run lint && npm run type-check && npm test
```

Push to trigger SonarCloud PR analysis before merging.

---

## Timeline

| PR        | Focus               | Issues    | Effort    | Cumulative |
| --------- | ------------------- | --------- | --------- | ---------- |
| PR 1      | Mechanical Fixes    | 290       | 5hr       | 5hr        |
| PR 2      | Critical Complexity | 75        | 14hr      | 19hr       |
| PR 3      | Major Code Quality  | 175       | 11hr      | 30hr       |
| PR 4      | Medium/Minor        | 480       | 13hr      | 43hr       |
| PR 5      | Security Hotspots   | 97        | 9hr       | 52hr       |
| **TOTAL** |                     | **1,117** | **~52hr** |            |

---

## Success Criteria

- [ ] Quality Gate: PASSED
- [ ] CRITICAL Issues: 0
- [ ] MAJOR Issues: 0
- [ ] MINOR Issues: 0
- [ ] Security Hotspots: All reviewed (SAFE/FIXED/ACKNOWLEDGED)
- [ ] No new issues introduced
- [ ] All tests passing
- [ ] Post-sprint snapshot created

---

## Related Documents

- [Full Snapshot](../../docs/audits/sonarcloud-snapshots/20260119-full.md)
- [SONARCLOUD_CLEANUP_RUNBOOK.md](../../docs/SONARCLOUD_CLEANUP_RUNBOOK.md)
- [SonarCloud Dashboard](https://sonarcloud.io/project/overview?id=jasonmichaelbell78-creator_sonash-v0)
