---
description: Complete verification steps before ending the session
---

# Session End Checklist

Before ending the session, complete these verification steps:

## 1. Work Verification
- [ ] All TodoWrite items marked as completed or documented as blocked
- [ ] All commits pushed to remote branch
- [ ] All code review suggestions addressed or documented as skipped (with reason)
- [ ] Tests pass: `npm test`
- [ ] Lint passes: `npm run lint`
- [ ] Pattern check passes: `npm run patterns:check`

## 2. CI Verification
If you modified any of these, verify they still work:
- [ ] `.github/workflows/ci.yml` - Main CI pipeline
- [ ] `.github/workflows/docs-lint.yml` - Documentation linting
- [ ] `scripts/check-docs-light.js` - Doc linter script
- [ ] `scripts/check-pattern-compliance.js` - Pattern checker
- [ ] `eslint.config.mjs` - ESLint configuration

## 3. Documentation Updates
- [ ] Update SESSION_CONTEXT.md with:
  - Work completed this session
  - Any new blockers discovered
  - Next steps for future sessions
- [ ] If applicable, update DOCUMENTATION_STANDARDIZATION_PLAN.md with phase progress
- [ ] Log any significant learnings in AI_REVIEW_LEARNINGS_LOG.md

## 4. Code Review Completeness Audit
If you received code review feedback this session:
```
VERIFICATION CHECKLIST:
├─ Did you address ALL suggestions? (not just some)
├─ Did you test regex patterns for performance?
├─ Did you verify path-based filtering works correctly?
├─ Did you check for CI workflow impacts?
└─ Did you commit descriptive messages explaining WHY changes were made?
```

## 5. Key Learnings to Remember
Today's session reinforced these patterns:

### DO:
- Read files before editing
- Use TodoWrite for multi-step tasks
- Check all code review items multiple times
- Add path-based filtering for context-specific patterns
- Use bounded regex (`{0,N}?`) instead of greedy (`.*`)
- Spread ESLint plugin configs in flat config format
- Exclude archive files from strict linting
- Add `continue-on-error` for pre-existing issues in CI

### DON'T:
- Skip code review suggestions without documenting why
- Use greedy regex that can cause runaway matches
- Forget to test changes before committing
- Push without verifying CI impact
- Edit files without reading them first

## 6. Commit Summary
Provide a summary of all commits made this session:

```
git log --oneline -10
```

---
Session complete. All work has been verified and documented.
