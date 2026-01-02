---
description: Load context, check blockers, and verify consolidation status before starting work
---

# Session Begin Checklist

Before starting any work, complete these verification steps:

## 1. Context Loading (MANDATORY)
- [ ] Read SESSION_CONTEXT.md - Current status, active blockers, next goals
- [ ] Increment session counter in SESSION_CONTEXT.md
- [ ] Check ROADMAP.md for priority changes

## 2. Consolidation Status Check
Check AI_REVIEW_LEARNINGS_LOG.md for the "Consolidation Trigger" section:
- If "Reviews since last consolidation" >= 10: **⚠️ CONSOLIDATION WAS MISSED**
- This means patterns from previous reviews are NOT in claude.md context
- Previous session should have consolidated but didn't

**If consolidation was missed:**
1. Note this in your session summary
2. The patterns are still available in AI_REVIEW_LEARNINGS_LOG.md (read if needed)
3. Consolidation will happen at THIS session's end

## 3. Documentation Phase Awareness
- [ ] Check DOCUMENTATION_STANDARDIZATION_PLAN.md for current phase
- [ ] Note: CI uses `continue-on-error` for docs:check until Phase 6 complete
- [ ] Archive files in `docs/archive/` are excluded from linting

## 4. Skill Selection (BEFORE starting work)
```
DECISION TREE:
├─ Bug/Error? → Use 'systematic-debugging' skill FIRST
├─ Writing code? → Use 'code-reviewer' agent AFTER completion
├─ Security work? → Use 'security-auditor' agent
├─ UI/Frontend? → Use 'frontend-design' skill
├─ Complex task? → Check available skills with /skills
└─ Multi-step task? → Use TodoWrite to track progress
```

## 5. Code Review Handling Procedures
When receiving code review feedback (CodeRabbit, Qodo, etc.):

1. **Analyze ALL suggestions** - Read through every comment multiple times
2. **Create TodoWrite checklist** - Track each suggestion as a task
3. **Address systematically** - Don't skip items; mark as resolved or note why skipped
4. **Verify CI impact** - Check if changes affect workflows (ci.yml, docs-lint.yml)
5. **Test after changes** - Run `npm test` and `npm run lint` before committing

## 6. Anti-Pattern Awareness
Review these common issues before writing code:
- **Read before edit** - Always read files before attempting to edit
- **Regex performance** - Avoid greedy `.*` in patterns; use bounded `[\s\S]{0,N}?`
- **ESLint flat config** - Spread plugin configs, don't use directly
- **Path-based filtering** - Add pathFilter for directory-specific patterns
- **Archive exclusions** - Historical docs should be excluded from strict linting

## 7. Pattern Check
Run: `npm run patterns:check` to surface known anti-patterns

---
Ready to begin session. What would you like to work on?
