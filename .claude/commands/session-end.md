---
description: Complete session end checklist including consolidation and documentation updates
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

## 4. Learning Consolidation (IMPORTANT)
Check if consolidation is due and perform it so patterns are in claude.md for next session:

1. **Check consolidation trigger** in AI_REVIEW_LEARNINGS_LOG.md:
   - Find "Reviews since last consolidation" counter
   - If >= 10, consolidation is needed

2. **If consolidation needed:**
   - Review all entries since last consolidation
   - Identify patterns appearing 3+ times across reviews
   - Add new distilled patterns to claude.md Section 4 "Tribal Knowledge"
   - **Run `npm run patterns:suggest`** to find automatable patterns
   - Add suggested patterns to check-pattern-compliance.js (with human review)
   - Reset consolidation counter in AI_REVIEW_LEARNINGS_LOG.md
   - Note consolidation in version history

3. **Why this matters:**
   - claude.md is loaded at session START
   - Patterns consolidated NOW will be in context for NEXT session
   - This is how the AI "learns" from previous sessions

## 5. Code Review Completeness Audit
If you received code review feedback this session:
```
VERIFICATION CHECKLIST:
├─ Did you address ALL suggestions? (not just some)
├─ Did you test regex patterns for performance?
├─ Did you verify path-based filtering works correctly?
├─ Did you check for CI workflow impacts?
└─ Did you commit descriptive messages explaining WHY changes were made?
```

## 6. Key Learnings to Remember
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

## 7. Commit Summary
Provide a summary of all commits made this session:

```
git log --oneline -10
```

---
Session complete. All work has been verified and documented.
