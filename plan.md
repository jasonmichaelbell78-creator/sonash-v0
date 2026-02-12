# Implementation Plan: PR Review Churn Reduction System

**Session**: #151 **Status**: IN PROGRESS **Created**: 2026-02-11

## Summary

Reduce PR review fix commits from 50-69% to under 25% by closing the enforcement
gap (9.3% to ~60% of known patterns enforced), adding mandatory self-review for
script changes, and creating fix templates for the top 20 Qodo findings.

## Decision Record (from Q&A)

| Decision                  | Choice                                                         |
| ------------------------- | -------------------------------------------------------------- |
| Scope                     | All three tiers: enforcement + self-review + cascade reduction |
| Enforcement strictness    | Warn once per file, block on repeat occurrence                 |
| Code-reviewer for scripts | Mandatory, automatic at pre-push                               |
| Enforcement tooling       | Regex checker expansion + ESLint plugin                        |
| ESLint plugin             | Local `eslint-plugin-sonash/` directory                        |
| Pattern priority          | By Qodo frequency (top 20 first)                               |
| Cascade reduction         | Expanded local checks + fix templates                          |
| Fix templates             | `docs/agent_docs/FIX_TEMPLATES.md`                             |
| Success metrics           | Review fix ratio (<25%) + round count (<3)                     |
| Graduation                | Warn once per file, block on repeat                            |

## Files to Create/Modify

### New Files (6)

1. `eslint-plugin-sonash/index.js` - Plugin entry, exports rules
2. `eslint-plugin-sonash/rules/no-unguarded-file-read.js` - AST:
   readFileSync/loadConfig in try/catch
3. `eslint-plugin-sonash/rules/no-stat-without-lstat.js` - AST: statSync
   preceded by lstatSync
4. `eslint-plugin-sonash/rules/no-toctou-file-ops.js` - AST:
   existsSync+readFileSync detection
5. `docs/agent_docs/FIX_TEMPLATES.md` - Fix patterns for top 20 Qodo findings
6. `scripts/metrics/review-churn-tracker.js` - Review fix ratio + round count
   tracker

### Modified Files (5)

1. `scripts/check-pattern-compliance.js` - Add ~40 new regex patterns
2. `eslint.config.mjs` - Register eslint-plugin-sonash
3. `.husky/pre-push` - Mandatory code-reviewer for script changes
4. `.claude/skills/pr-review/SKILL.md` - Fix template refs, batch workflow
5. `.claude/skills/code-reviewer/SKILL.md` - Script-specific checklist

## Steps

### Step 1: Expand regex pattern checker (+40 patterns) - PARALLEL

- Add top 20 Qodo findings (regex-checkable ones) to check-pattern-compliance.js
- Add graduation logic: warnedFiles.json state file
- First occurrence = warn, same file again = block

### Step 2: Build ESLint plugin (3 AST rules) - PARALLEL

- Create `eslint-plugin-sonash/` directory
- Rule 1: `no-unguarded-file-read` - readFileSync/loadConfig outside try/catch
- Rule 2: `no-stat-without-lstat` - statSync without preceding lstatSync
- Rule 3: `no-toctou-file-ops` - existsSync then readFileSync pattern
- Register in eslint.config.mjs

### Step 3: Create FIX_TEMPLATES.md - PARALLEL

- Top 20 Qodo findings with bad/good code examples
- Common mistakes section per template
- Referenced by pr-review and code-reviewer skills

### Step 4: Pre-push code-reviewer gate - AFTER 1-3

- Check if scripts/, .claude/hooks/, .husky/ changed
- Check agent-invocations.jsonl for code-reviewer this session
- Auto-invoke if not run

### Step 5: Review churn metrics - AFTER 1-3

- scripts/metrics/review-churn-tracker.js
- Uses gh CLI for PR data
- Tracks review fix ratio + round count
- Appends to .claude/state/review-metrics.jsonl

### Step 6: Update skills - AFTER 1-3

- pr-review/SKILL.md: FIX_TEMPLATES.md reference, batch fix workflow
- code-reviewer/SKILL.md: Script-specific checklist
