---
description: Complete verification steps before starting any work session
---

# Session Begin Checklist

Before starting any work, complete these verification steps:

## 1. Context Loading (MANDATORY)
- [ ] Read [SESSION_CONTEXT.md](../../SESSION_CONTEXT.md) - Current status, active blockers, next goals
- [ ] Increment session counter in [SESSION_CONTEXT.md](../../SESSION_CONTEXT.md)
- [ ] Check [ROADMAP.md](../../ROADMAP.md) for priority changes

## 2. Consolidation Status Check
Check [AI_REVIEW_LEARNINGS_LOG.md](../../docs/AI_REVIEW_LEARNINGS_LOG.md) for the "Consolidation Trigger" section:
- If "Reviews since last consolidation" >= 10: **⚠️ CONSOLIDATION WAS MISSED**
- This means patterns from previous reviews are NOT in claude.md context
- Previous session should have consolidated but didn't

**If consolidation was missed:**
1. Note this in your session summary
2. The patterns are still available in AI_REVIEW_LEARNINGS_LOG.md (read if needed)
3. Consolidation will happen at THIS session's end

## 3. Documentation & Planning Awareness
- [ ] Check [INTEGRATED_IMPROVEMENT_PLAN.md](../../docs/INTEGRATED_IMPROVEMENT_PLAN.md) for current step
- [ ] Note: Archive files in `docs/archive/` are excluded from linting
- [ ] Completed plans are archived to `docs/archive/completed-plans/`

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
**Before writing code**, scan claude.md Section 4 "Critical Anti-Patterns" and [CODE_PATTERNS.md](../../docs/agent_docs/CODE_PATTERNS.md) for issues. Key patterns:
- **Read before edit** - Always read files before attempting to edit
- **Regex performance** - Avoid greedy `.*` in patterns; use bounded `[\s\S]{0,N}?`
- **ESLint flat config** - Spread plugin configs, don't use directly
- **Path-based filtering** - Add pathFilter for directory-specific patterns
- **Archive exclusions** - Historical docs should be excluded from strict linting

## 7. Session Start Scripts (AUTO-RUN)

**Execute these scripts automatically** when processing this command:

```bash
# Surface known anti-patterns (errors should be visible, not suppressed)
npm run patterns:check

# Check if multi-AI review thresholds reached
npm run review:check

# Surface past lessons relevant to current work
npm run lessons:surface
```

**Important**: These scripts are **required**. If any script fails:
1. Note the error in session summary
2. Investigate if it's a real issue vs missing script
3. If script missing, note it as "N/A" in audit

**Record results in session audit** - these must be marked as "Ran" or "Failed (reason)" in `/session-end` audit.

## 8. Incident Documentation Reminder
**After encountering any significant errors or issues:**
- Document the issue in [AI_REVIEW_LEARNINGS_LOG.md](../../docs/AI_REVIEW_LEARNINGS_LOG.md)
- Use the standard "Review #XX" format
- Include: cause, fix, pattern identified, prevention steps
- This builds institutional knowledge for future sessions

---
Ready to begin session. What would you like to work on?
