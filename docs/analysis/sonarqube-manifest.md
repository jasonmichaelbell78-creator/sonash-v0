# SonarQube Issues Manifest for Phase 4 Multi-AI Review

> Generated: 2026-01-05 | Source: sonarqube-issues.json (778 issues)

## Purpose

This manifest provides a condensed view of SonarQube findings to inform the Phase 4 Multi-AI Review. The full JSON data is preserved in `sonarqube-issues.json` for detailed analysis.

## Summary

| Severity | Count | Action |
|----------|-------|--------|
| BLOCKER | 1 | False Positive (Firebase public key) |
| CRITICAL | 47 | Refactoring targets for complexity reduction |
| MAJOR | 216 | Code quality improvements |
| MINOR | 507 | Style/convention fixes (batch with linting) |
| INFO | 7 | Informational only |

## Known False Positives

### BLOCKER: Firebase API Key in .env.production

- **File**: `.env.production:5`
- **Status**: FALSE POSITIVE
- **Reason**: Firebase `NEXT_PUBLIC_FIREBASE_API_KEY` is intentionally public. Security is enforced via:
  - Firebase Security Rules
  - App Check (reCAPTCHA Enterprise configured on line 13)
  - Authentication flows
- **Action**: No change required

## Priority 1: Cognitive Complexity (47 CRITICAL)

These functions exceed the 15-point complexity threshold and are primary refactoring targets:

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

### scripts/validate-phase-completion.js
- Line 26: Complexity 20/15

### scripts/surface-lessons-learned.js
- Line 75: Complexity 20/15

### scripts/check-docs-light.js
- Line 152: Complexity 23/15
- Line 43: Complexity 21/15
- Line 218: Complexity 19/15
- Line 345: Complexity 16/15

### hooks/use-journal.ts
- Multiple functions with complexity > 15

### scripts/check-review-needed.js
- Line 114: Complexity 22/15
- Line 236: Complexity 16/15

## Priority 2: Top Rule Violations

| Rule | Count | Description | Fix Strategy |
|------|-------|-------------|--------------|
| typescript:S6759 | 62 | Remove unused imports | Auto-fix: ESLint |
| javascript:S7781 | 49 | Use replaceAll() | ES2021+ replacement |
| typescript:S7764 | 46 | Use optional chaining (?.) | Auto-fix: ESLint |
| typescript:S3358 | 41 | Nested ternary operators | Manual refactor |
| javascript:S7772 | 40 | Use node: prefix imports | ES2022+ |
| shelldre:S7688 | 38 | Shell script improvements | Manual review |
| javascript:S7780 | 33 | Use Array.includes() | Auto-fix: ESLint |
| typescript:S7772 | 31 | Use node: prefix imports | ES2022+ |
| typescript:S1874 | 31 | Deprecated API usage | Manual refactor |
| typescript:S7781 | 30 | Use replaceAll() | ES2021+ replacement |

## Priority 3: Files With Most Issues

- **lib/db/meetings.ts** (36 issues) - Priority: MEDIUM
- **scripts/suggest-pattern-automation.js** (31 issues) - Priority: HIGH
- **scripts/phase-complete-check.js** (30 issues) - Priority: HIGH
- **hooks/use-journal.ts** (27 issues) - Priority: HIGH
- **scripts/check-pattern-compliance.js** (24 issues) - Priority: HIGH
- **scripts/check-docs-light.js** (21 issues) - Priority: HIGH
- **scripts/check-review-needed.js** (19 issues) - Priority: HIGH
- **components/admin/meetings-tab.tsx** (19 issues) - Priority: MEDIUM
- **components/notebook/pages/resources-page.tsx** (18 issues) - Priority: HIGH
- **scripts/update-readme-status.js** (16 issues) - Priority: HIGH
- **components/growth/Step1WorksheetCard.tsx** (14 issues) - Priority: MEDIUM
- **scripts/archive-doc.js** (13 issues) - Priority: HIGH
- **scripts/check-review-triggers.sh** (13 issues) - Priority: MEDIUM
- **components/journal/entry-detail-dialog.tsx** (13 issues) - Priority: MEDIUM
- **app/meetings/all/page.tsx** (13 issues) - Priority: HIGH

## Batch Fix Opportunities

### Auto-fixable with ESLint (est. 200+ issues)

- S6759: Unused imports
- S7764: Optional chaining
- S7780: Array.includes()

### RegExp-based replacements (est. 79 issues)

- S7781: `replace(/x/g, y)` -> `replaceAll('x', y)`

### Node.js import prefix (est. 71 issues)

- S7772: `require('fs')` -> `require('node:fs')`

## Phase 4 Integration Notes

1. Use this manifest to identify high-value refactoring targets
2. Focus multi-AI review on CRITICAL complexity files first
3. Batch MINOR issues with automated tooling (ESLint --fix, codemod)
4. Cross-reference with existing improvement plan in `docs/INTEGRATED_IMPROVEMENT_PLAN.md`
