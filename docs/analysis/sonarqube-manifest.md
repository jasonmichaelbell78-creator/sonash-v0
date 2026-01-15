# SonarQube Issues Manifest for Phase 4 Multi-AI Review

> Generated: 2026-01-11 | Source: sonarqube-issues-2026-01-11.json (941 issues)
> Previous: sonarqube-issues.json (778 issues, 2026-01-05)
> **Last Updated:** 2026-01-15

## Purpose

This manifest provides a condensed view of SonarQube findings to inform the
Phase 4 Multi-AI Review. The full JSON data is preserved in
`sonarqube-issues-2026-01-11.json` for detailed analysis.

## Quick Start

1. Review the issue breakdown by category
2. Check accepted risks and rationale
3. Track deferred items in ROADMAP

## AI Instructions

When working with SonarCloud issues:

- Reference this manifest for baseline
- Update when issues are resolved
- Document new accepted risks with rationale

## Summary

| Severity  | Count   | Delta    | Action                                       |
| --------- | ------- | -------- | -------------------------------------------- |
| BLOCKER   | 1       | 0        | False Positive (secrets in gitignored file)  |
| CRITICAL  | 61      | +14      | Refactoring targets for complexity reduction |
| MAJOR     | 246     | +30      | Code quality improvements                    |
| MINOR     | 625     | +118     | Style/convention fixes (batch with linting)  |
| INFO      | 8       | +1       | Informational only                           |
| **TOTAL** | **941** | **+163** | Increase due to new audit scripts            |

## Known False Positives

### BLOCKER: GitHub Token in mcp.json

- **File**: `mcp.json:19`
- **Status**: FALSE POSITIVE (mcp.json is gitignored)
- **Reason**: File excluded from git, contains local MCP server config
- **Action**: No change required

### Previous: Firebase API Key in .env.production

- **Status**: NOT IN SCAN (no longer flagged or resolved)
- **Reason**: Firebase `NEXT_PUBLIC_FIREBASE_API_KEY` is intentionally public

## Priority 1: Cognitive Complexity (61 CRITICAL)

These functions exceed the 15-point complexity threshold and are primary
refactoring targets:

### scripts/generate-documentation-index.js

- Line 118: Complexity 51/15
- Line 331: Complexity 42/15
- Line 520: Complexity 37/15
- Line 252: Complexity 33/15

### scripts/validate-canon-schema.js

- Line 92: Complexity 37/15
- Line 219: Complexity 29/15

### scripts/check-review-needed.js

- Line 253: Complexity 35/15
- Line 854: Complexity 22/15
- Line 114: Complexity 22/15
- Line 236: Complexity 16/15

### scripts/validate-audit.js

- Line 189: Complexity 32/15
- Line 422: Complexity 23/15
- Line 141: Complexity 22/15

### scripts/assign-review-tier.js

- Line 289: Complexity 38/15
- Line 176: Complexity 16/15

### scripts/phase-complete-check.js

- Line 131: Complexity 27/15
- Line 227: Complexity 25/15
- Line 348: Complexity 22/15

### scripts/suggest-pattern-automation.js

- Line 100: Complexity 27/15

### scripts/check-pattern-compliance.js

- Line 457: Complexity 26/15
- Line 143: Complexity 22/15

### scripts/check-document-sync.js

- Line 197: Complexity 25/15
- Line 301: Complexity 23/15

### scripts/normalize-canon-ids.js

- Line 182: Complexity 21/15

### scripts/add-false-positive.js

- Line 131: Complexity 21/15

### scripts/check-docs-light.js

- Line 152: Complexity 23/15
- Line 43: Complexity 21/15
- Line 218: Complexity 19/15
- Line 345: Complexity 16/15

### scripts/validate-phase-completion.js

- Line 26: Complexity 20/15

### scripts/surface-lessons-learned.js

- Line 75: Complexity 20/15

### hooks/use-journal.ts

- Multiple functions with complexity > 15

## Priority 2: Top Rule Violations

| Rule             | Count | Description                       | Fix Strategy         |
| ---------------- | ----- | --------------------------------- | -------------------- |
| javascript:S7778 | 84    | Use Array.at() for negative index | ES2022+ Array.at()   |
| javascript:S7781 | 71    | Use replaceAll()                  | ES2021+ replaceAll   |
| typescript:S6759 | 62    | Remove unused imports             | Auto-fix: ESLint     |
| shelldre:S7688   | 47    | Shell script improvements         | Manual review        |
| typescript:S7764 | 46    | Use optional chaining (?.)        | Auto-fix: ESLint     |
| typescript:S3358 | 41    | Nested ternary operators          | Manual refactor      |
| javascript:S7780 | 40    | Use Array.includes()              | Auto-fix: ESLint     |
| javascript:S7772 | 39    | Use node: prefix imports          | ES2022+ node: prefix |
| javascript:S3776 | 34    | Cognitive complexity              | Manual refactor      |
| typescript:S7772 | 31    | Use node: prefix imports          | ES2022+ node: prefix |
| typescript:S1874 | 31    | Deprecated API usage              | Manual refactor      |
| typescript:S7781 | 30    | Use replaceAll()                  | ES2021+ replaceAll   |

## Priority 3: Files With Most Issues

- **scripts/generate-documentation-index.js** (119 issues) - Priority: HIGH -
  NEW FILE
- **lib/db/meetings.ts** (36 issues) - Priority: HIGH
- **scripts/suggest-pattern-automation.js** (31 issues) - Priority: HIGH
- **scripts/phase-complete-check.js** (30 issues) - Priority: HIGH
- **.claude/hooks/session-start.sh** (25 issues) - Priority: MEDIUM (shell
  script)
- **scripts/check-pattern-compliance.js** (24 issues) - Priority: HIGH
- **scripts/check-docs-light.js** (21 issues) - Priority: HIGH
- **components/admin/meetings-tab.tsx** (19 issues) - Priority: MEDIUM
- **scripts/update-readme-status.js** (16 issues) - Priority: HIGH
- **scripts/check-review-needed.js** (15+ issues) - Priority: HIGH
- **components/notebook/pages/resources-page.tsx** (15+ issues) - Priority: HIGH
- **hooks/use-journal.ts** (15+ issues) - Priority: HIGH

## Batch Fix Opportunities

### Auto-fixable with ESLint (est. 150+ issues)

- S6759: Unused imports
- S7764: Optional chaining
- S7780: Array.includes()

### RegExp-based replacements (est. 100+ issues)

- S7781: `replace(/x/g, y)` -> `replaceAll('x', y)`

### Node.js import prefix (est. 70 issues)

- S7772: `require('fs')` -> `require('node:fs')`

## Delta Analysis (vs Jan 5 Scan)

### New Files Scanned

The +163 issue increase is primarily due to new audit tooling scripts:

- `scripts/generate-documentation-index.js` (119 issues) - NEW
- `scripts/validate-canon-schema.js` - NEW
- `scripts/normalize-canon-ids.js` - NEW
- `scripts/validate-audit.js` - NEW
- `scripts/add-false-positive.js` - NEW
- `scripts/check-document-sync.js` - EXPANDED

### Existing File Changes

Most existing files show minimal change; new issues in
`scripts/check-review-needed.js` from expanded functionality.

## Phase 4 Integration Notes

1. Use this manifest to identify high-value refactoring targets
2. Focus multi-AI review on CRITICAL complexity files first
3. Batch MINOR issues with automated tooling (ESLint --fix, codemod)
4. Cross-reference with existing improvement plan in
   `docs/archive/completed-plans/INTEGRATED_IMPROVEMENT_PLAN.md`
5. New scripts are audit tooling - complexity is acceptable if readable
6. **393 issues have null file** - these are likely from files not in repo
   (gitignored)

---

## Version History

| Version | Date       | Changes                       |
| ------- | ---------- | ----------------------------- |
| 1.0     | 2026-01-11 | Initial manifest generation   |
| 1.1     | 2026-01-15 | Added Version History section |
