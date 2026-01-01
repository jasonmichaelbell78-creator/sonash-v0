# AI Workflow Guide

**Last Updated**: 2025-12-31
**Document Version**: 1.0
**Purpose**: Master navigation and workflow guide for AI assistants
**When to Use**: Start of EVERY session

---

## 📋 Purpose & Scope

### What This Document Provides

This is the **master navigation guide** for AI assistants working on the SoNash Recovery Notebook project. It provides:

1. **Session startup procedure** - What to do when beginning work
2. **Documentation hierarchy** - Which docs to read and when
3. **Standard procedures** - Common workflows and processes
4. **Update workflows** - How to maintain documentation
5. **Navigation map** - Finding the right information quickly

**Primary Audience**: AI Assistants (Claude, ChatGPT, etc.)

**Use this when:**
- Starting any new work session
- Unsure which documentation to reference
- Need to understand project workflow
- Planning documentation updates

---

## 🎯 Quick Reference

### Session Startup Checklist

```
☐ 1. Read SESSION_CONTEXT.md (current status, next goals)
☐ 2. Check ROADMAP.md (verify milestone priorities)
☐ 3. Check active blockers (DOCUMENTATION_STANDARDIZATION_PLAN.md if active)
☐ 4. Review AI_HANDOFF.md (detailed recent work)
☐ 5. Consult specific planning docs as needed
☐ 6. Begin work following documented procedures
```

**Time**: 5-10 minutes

---

## 📚 Documentation Hierarchy

### Read Documents in This Order

**Every Session** (Critical - Always Read):
1. **[SESSION_CONTEXT.md](./SESSION_CONTEXT.md)** - Start here!
   - Current sprint focus
   - Next session goals
   - Active blockers
   - Recent completions

2. **[ROADMAP.md](./ROADMAP.md)** - Project priorities
   - Current milestones
   - Feature priorities
   - Dependencies

**As Needed** (Reference When Relevant):

3. **[AI_HANDOFF.md](./AI_HANDOFF.md)** - Detailed context
   - Full recent work history
   - Technical decisions
   - Known issues
   - Architecture overview

4. **Planning Documents** (when working on specific features):
   - [EIGHT_PHASE_REFACTOR_PLAN.md](./docs/EIGHT_PHASE_REFACTOR_PLAN.md)
   - [DOCUMENTATION_STANDARDIZATION_PLAN.md](./DOCUMENTATION_STANDARDIZATION_PLAN.md)
   - [M1.6_SUPPORT_TAB_PLAN.md](./docs/M1.6_SUPPORT_TAB_PLAN.md)
   - Feature-specific plans in `docs/`

5. **Foundation Documents** (when making architectural decisions):
   - [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System design
   - [SECURITY.md](./docs/SECURITY.md) - Security guidelines
   - [DEVELOPMENT.md](./docs/DEVELOPMENT.md) - Development procedures

6. **Reference Documents** (when following workflows):
   - [PR_WORKFLOW_CHECKLIST.md](./docs/PR_WORKFLOW_CHECKLIST.md)
   - [CODERABBIT_REVIEW_PROCESS.md](./CODERABBIT_REVIEW_PROCESS.md)
   - [IMPLEMENTATION_PROMPTS.md](./docs/IMPLEMENTATION_PROMPTS.md)

7. **Standards** (when creating/updating docs):
   - [DOCUMENTATION_STANDARDS.md](./DOCUMENTATION_STANDARDS.md)

---

## 🔄 Standard Procedures

### Starting a New Session

**1. Context Gathering (5 minutes)**:
```markdown
1. Read SESSION_CONTEXT.md → "Next Session Goals"
2. Check ROADMAP.md → Verify no priority changes
3. Review any active blockers
4. Note current branch if specified
```

**2. Clarify Intent (if needed)**:
- If user request conflicts with documented priorities, ask for clarification
- If critical blocker is active, confirm user wants to proceed anyway
- If unclear scope, ask specific questions before starting

**3. Plan Approach**:
- Use TodoWrite to create task list for session
- Break complex work into phases
- Identify which docs will need updates

### CodeRabbit Review Processing

**⚠️ IMPORTANT**: CodeRabbit reviews occur multiple times daily and must be processed systematically.

**See**: [CODERABBIT_REVIEW_PROCESS.md](./CODERABBIT_REVIEW_PROCESS.md) for complete workflow

**Quick Reference**:
1. **Categorize** suggestions: Critical → Major → Minor → Trivial
2. **Triage** using decision matrix
3. **Document** decisions using template
4. **Implement** accepted changes
5. **Commit** with CodeRabbit review summary

**Template** (from CODERABBIT_REVIEW_PROCESS.md):
```markdown
## CodeRabbit Review Summary

**Total Suggestions:** X
**Addressed:** Y
**Deferred:** Z
**Rejected:** W

### ✅ Addressed
1. **[Severity] Description**
   - **Issue**: What CodeRabbit flagged
   - **Fix**: What was done
   - **Files**: Changed files
```

### Implementing Features

**For ALL implementation work**:

1. **Check Planning Docs First**:
   - Is there a plan for this feature?
   - Are dependencies satisfied?
   - What's the acceptance criteria?

2. **Follow PR Workflow** (if multi-phase):
   - See [PR_WORKFLOW_CHECKLIST.md](./docs/PR_WORKFLOW_CHECKLIST.md)
   - 4-step process: Implementation → R1 → R2 → Between-PR

3. **Maintain Tests**:
   - Run `npm test` before and after changes
   - Maintain >95% pass rate
   - Add tests for new functionality

4. **Update Documentation**:
   - Update relevant planning docs
   - Update ROADMAP_LOG.md when completing milestones
   - Update SESSION_CONTEXT.md at end of session

### Handling Blockers

**If you encounter a blocker**:

1. **Document it immediately**:
   ```markdown
   - **Blocker**: [Description]
   - **Impact**: [What's blocked]
   - **Mitigation**: [Possible solutions]
   ```

2. **Update relevant docs**:
   - Add to planning doc if feature-specific
   - Add to SESSION_CONTEXT.md "Known Issues"
   - Flag in commit message

3. **Communicate to user**:
   - Explain blocker clearly
   - Propose alternatives
   - Get user input on path forward

---

## 📝 Documentation Update Workflows

### When to Update Each Document

**After Every Session**:
- ✅ **SESSION_CONTEXT.md** - Update "Recently Completed" and "Next Session Goals"
- ✅ **Relevant planning docs** - Update status, progress tracking

**After Milestone Completion**:
- ✅ **ROADMAP_LOG.md** - Add completion entry
- ✅ **ROADMAP.md** - Update status dashboard
- ✅ **AI_HANDOFF.md** - Add to "Recently Completed"

**When Architecture/Process Changes**:
- ✅ **ARCHITECTURE.md** - New patterns
- ✅ **SECURITY.md** - Security changes
- ✅ **DEVELOPMENT.md** - Process updates

**When Workflows Change**:
- ✅ **PR_WORKFLOW_CHECKLIST.md** - Process refinements
- ✅ **This document (AI_WORKFLOW.md)** - Navigation updates

### How to Update Documentation

**Standard Update Process**:

1. **Read current doc** before editing
2. **Make changes** to relevant sections
3. **Update metadata**:
   - "Last Updated" date (always)
   - Version number (if significant)
   - Status/completion (if applicable)
4. **Add version history entry** (for significant changes)
5. **Commit with clear message**:
   ```bash
   git add path/to/doc.md
   git commit -m "docs: Update [doc-name] - [what changed]"
   ```

**Quality Checklist**:
- [ ] Metadata updated
- [ ] Required sections present (per tier)
- [ ] Links work
- [ ] No typos
- [ ] Follows [DOCUMENTATION_STANDARDS.md](./DOCUMENTATION_STANDARDS.md)

---

## 🗺️ Navigation Map

### "I need to know about..."

**Current Project Status**:
→ [SESSION_CONTEXT.md](./SESSION_CONTEXT.md)

**What to Work On Next**:
→ [SESSION_CONTEXT.md](./SESSION_CONTEXT.md) → "Next Session Goals"

**Project Roadmap**:
→ [ROADMAP.md](./ROADMAP.md)

**Recent Work History**:
→ [AI_HANDOFF.md](./AI_HANDOFF.md)
→ [ROADMAP_LOG.md](./ROADMAP_LOG.md)

**System Architecture**:
→ [ARCHITECTURE.md](./docs/ARCHITECTURE.md)

**Security Guidelines**:
→ [SECURITY.md](./docs/SECURITY.md)

**Development Procedures**:
→ [DEVELOPMENT.md](./docs/DEVELOPMENT.md)

**How to Implement Features**:
→ [PR_WORKFLOW_CHECKLIST.md](./docs/PR_WORKFLOW_CHECKLIST.md)
→ [IMPLEMENTATION_PROMPTS.md](./docs/IMPLEMENTATION_PROMPTS.md)

**How to Process CodeRabbit Reviews**:
→ [CODERABBIT_REVIEW_PROCESS.md](./CODERABBIT_REVIEW_PROCESS.md)

**Documentation Standards**:
→ [DOCUMENTATION_STANDARDS.md](./DOCUMENTATION_STANDARDS.md)

**Specific Feature Plans**:
→ Check `docs/` for feature-specific plans

---

## 🚨 Common Scenarios

### Scenario 1: Starting a New Feature

1. Read [SESSION_CONTEXT.md](./SESSION_CONTEXT.md) - Verify this is the priority
2. Check [ROADMAP.md](./ROADMAP.md) - Understand milestone context
3. Look for feature plan in `docs/` - Follow if exists
4. Reference [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Understand patterns
5. Follow [PR_WORKFLOW_CHECKLIST.md](./docs/PR_WORKFLOW_CHECKLIST.md) - Implementation workflow
6. Update docs as you work

### Scenario 2: Fixing a Bug

1. Read [AI_HANDOFF.md](./AI_HANDOFF.md) - Check known issues
2. Reference [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Understand component
3. Fix the bug
4. Add tests
5. Update [SESSION_CONTEXT.md](./SESSION_CONTEXT.md) if significant
6. Update [AI_HANDOFF.md](./AI_HANDOFF.md) known issues if applicable

### Scenario 3: Processing CodeRabbit Feedback

1. Follow [CODERABBIT_REVIEW_PROCESS.md](./CODERABBIT_REVIEW_PROCESS.md)
2. Categorize all suggestions
3. Triage using decision matrix
4. Implement accepted changes
5. Document using provided template
6. Commit with review summary

### Scenario 4: Documentation-Only Work

1. Check which tier doc belongs to ([DOCUMENTATION_STANDARDS.md](./DOCUMENTATION_STANDARDS.md))
2. Use appropriate template from `docs/templates/`
3. Follow metadata requirements
4. Validate links and formatting
5. Commit with "docs:" prefix

### Scenario 5: Completing a Milestone

1. Update planning doc - Mark complete
2. Update [ROADMAP.md](./ROADMAP.md) - Update dashboard
3. Add entry to [ROADMAP_LOG.md](./ROADMAP_LOG.md) - Archive completion
4. Update [SESSION_CONTEXT.md](./SESSION_CONTEXT.md) - Note completion
5. Update [AI_HANDOFF.md](./AI_HANDOFF.md) - Add to recent work
6. Commit all doc updates together

---

## 💡 Best Practices

### Do This

✅ **Always start with SESSION_CONTEXT.md**
- **Why**: Most up-to-date priorities and goals
- **Example**: Every single session, first thing

✅ **Use TodoWrite for complex sessions**
- **Why**: Tracks progress, helps user see status
- **Example**: Any session with >3 distinct tasks

✅ **Update docs as you work, not after**
- **Why**: Don't forget details, maintain accuracy
- **Example**: Update planning doc status when completing each task

✅ **Follow documented workflows**
- **Why**: Consistency, quality, completeness
- **Example**: PR_WORKFLOW_CHECKLIST.md for all implementation

✅ **Ask clarifying questions early**
- **Why**: Avoid wasted work, ensure alignment
- **Example**: If user request conflicts with documented blocker

### Avoid This

❌ **Don't skip reading SESSION_CONTEXT.md**
- **Why**: Risk working on wrong priorities
- **Instead**: Make it first step every time

❌ **Don't invent new patterns without updating docs**
- **Why**: Creates inconsistency, confuses future work
- **Instead**: Update ARCHITECTURE.md when adding patterns

❌ **Don't batch documentation updates**
- **Why**: Easy to forget details, introduces errors
- **Instead**: Update as you complete each phase/task

❌ **Don't ignore documented blockers**
- **Why**: Work may be wasted or duplicated
- **Instead**: Clarify with user if blocker should be bypassed

---

## 🔄 Maintenance

### When to Update This Document

**Update immediately when:**
- ✅ New critical documentation added
- ✅ Workflows change
- ✅ Navigation structure changes
- ✅ Standard procedures evolve

**Review periodically:**
- 🔁 Monthly - Verify links work, content current
- 🔁 After major project changes

### How to Update

1. Make changes to relevant sections
2. Update "Last Updated" date at top
3. Increment version number if significant
4. Test all links
5. Commit:
   ```bash
   git add AI_WORKFLOW.md
   git commit -m "docs: Update AI_WORKFLOW - [changes]"
   ```

---

## 🗓️ Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-31 | Initial AI workflow guide created; includes CodeRabbit process reference | Claude Code |

---

## 🤖 AI Instructions

**For AI Assistants reading this:**

**At session start:**
1. **ALWAYS** read this document first
2. Follow Session Startup Checklist (Quick Reference section)
3. Use Documentation Hierarchy to navigate efficiently
4. Check for active blockers before starting work

**During session:**
1. Follow Standard Procedures for all workflows
2. Reference Navigation Map when looking for information
3. Use Common Scenarios as templates
4. Update documentation as you work

**At session end:**
1. Update SESSION_CONTEXT.md
2. Update relevant planning docs
3. Commit documentation changes
4. Verify all work documented

**When updating this document:**
1. Preserve structure and organization
2. Keep Quick Reference current
3. Update Navigation Map when docs change
4. Test all links before committing

---

**END OF AI_WORKFLOW.md**

This is your primary navigation guide. Bookmark it mentally for every session.
