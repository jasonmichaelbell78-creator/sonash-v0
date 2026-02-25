---
name: quick-fix
description:
  Auto-suggest fixes for common pre-commit and pattern compliance issues
---

# quick-fix Skill

Auto-suggest fixes for common pre-commit and pattern compliance issues.

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## When to Use

- When pre-commit hook fails with lint errors
- When pattern compliance check fails
- When TypeScript type errors occur
- For quick resolution of common blocking issues

## What It Does

1. **Parse Error Output**
   - Reads the failed check output
   - Categorizes errors by type and severity
   - Identifies auto-fixable vs manual issues

2. **Generate Fix Suggestions**
   - ESLint: Suggests `npm run lint -- --fix` for auto-fixable issues
   - Prettier: Runs lint-staged to auto-format
   - Pattern compliance: Shows specific line changes needed
   - TypeScript: Suggests type annotations or fixes

3. **Apply Auto-Fixes**
   - Can run `npm run lint -- --fix` automatically
   - Stages fixed files for commit
   - Re-runs checks to verify

## Usage

```
/quick-fix
```

Or with specific error context:

```
/quick-fix [paste error output]
```

## Common Fix Patterns

### ESLint Errors

| Error              | Auto-Fix | Command                 |
| ------------------ | -------- | ----------------------- |
| Missing semicolons | Yes      | `npm run lint -- --fix` |
| Unused imports     | Yes      | `npm run lint -- --fix` |
| Quote style        | Yes      | `npm run lint -- --fix` |
| Complex functions  | No       | Manual refactor needed  |

### Pattern Compliance

| Pattern          | Issue          | Fix                           |
| ---------------- | -------------- | ----------------------------- |
| Direct Firestore | Use repository | Wrap in repository method     |
| Console.log      | Use logger     | Replace with `logger.debug()` |
| Hardcoded paths  | Use config     | Move to config file           |

### TypeScript

| Error        | Fix                                 |
| ------------ | ----------------------------------- |
| Missing type | Add explicit type annotation        |
| Any usage    | Replace with specific type          |
| Null check   | Add optional chaining or null check |

## Hook Integration

This skill can be suggested by hooks when failures occur:

### Pre-commit Failure Hook (proposed)

When pre-commit fails, a hook could:

1. Capture the error output
2. Suggest `/quick-fix` with context
3. Offer auto-fix for known patterns

### Pattern Check Failure

When pattern compliance fails:

1. Show specific file and line numbers
2. Suggest code changes inline
3. Offer to apply fix

## Output Format

```
/quick-fix Results
==================

Found 3 issues:

1. ESLint: Unused import (AUTO-FIXABLE)
   File: src/components/Button.tsx:5
   Fix: Remove `import { useState } from 'react'`
   Command: npm run lint -- --fix

2. Pattern: Direct Firestore access (MANUAL)
   File: src/services/user.ts:42
   Issue: `db.collection('users')` should use repository
   Fix: Use `userRepository.find()` instead

3. TypeScript: Missing return type (AUTO-FIXABLE)
   File: src/utils/format.ts:10
   Fix: Add `: string` return type

Auto-fix available for 2 issues.
Run: npm run lint -- --fix && npx tsc --noEmit

Apply auto-fixes? [Y/n]
```

## Related

- Pre-commit hook - Runs lint, patterns, tests
- scripts/check-pattern-compliance.js - Pattern checker
- eslint.config.mjs - ESLint configuration

---

## Version History

| Version | Date       | Description            |
| ------- | ---------- | ---------------------- |
| 1.0     | 2026-02-25 | Initial implementation |
