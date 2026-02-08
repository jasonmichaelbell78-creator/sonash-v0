# AI Workflow Guide

**Document Version**: 2.0 **Purpose**: Master navigation and workflow guide for
AI assistants **When to Use**: Start of EVERY session **Last Updated**:
2026-02-02

---

## 📋 Purpose & Scope

### What This Document Provides

This is the **master navigation guide** for AI assistants working on the SoNash
Recovery Notebook project. It provides:

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

## Quick Start

1. Start each session with `/session-begin`
2. Follow the Decision Tree for task approach
3. End sessions with `/session-end`

---

## 🎯 Quick Reference

### Session Startup Checklist

> **Automated Checks (via session-start.sh hook):**
>
> When running Claude Code on the web, the session-start hook automatically:
>
> - ✅ Installs dependencies and builds functions
> - ✅ Runs pattern compliance check
> - ✅ Checks consolidation status (reviews/archiving)
> - ✅ Surfaces relevant past learnings from AI_REVIEW_LEARNINGS_LOG.md
> - ✅ Checks document sync status (template instances)
>
> These run before you start - review their output for warnings.

```
☐ 1. Read SESSION_CONTEXT.md (current status, next goals)
☐ 2. Read GLOBAL_SECURITY_STANDARDS.md (MANDATORY before any coding)
☐ 3. Check docs/multi-ai-audit/COORDINATOR.md:
     - Increment session counter
     - Note any health issues
☐ 4. Check AUDIT_TRACKER.md:
     - Check audit thresholds for each category
     - Note if any single-session audits are due
     - Check multi-AI audit scheduling triggers
☐ 5. Check Available Capabilities (MANDATORY):
     - Scan .claude/skills/ for applicable skills
     - Scan .claude/agents/ for specialist agents
     - Note any MCP servers configured
     - If task matches a capability, USE IT (not optional)
     - For new domains: run '/find-skills' to discover ecosystem capabilities
☐ 6. Check ROADMAP.md (verify milestone priorities)
☐ 7. Check active blockers (none currently - see ROADMAP.md)
☐ 8. Consult specific planning docs as needed
☐ 9. Begin work following documented procedures
```

**Time**: 5-10 minutes (automated checks add ~5-10 seconds)

> **CRITICAL**: Step 2 is NOT optional. All code must comply with the 4
> mandatory security standards (rate limiting, input validation, secrets
> management, OWASP compliance). See
> [GLOBAL_SECURITY_STANDARDS.md](./docs/GLOBAL_SECURITY_STANDARDS.md).
>
> **IMPORTANT**: Step 3 tracks session count for health triggers. Increment the
> counter in docs/multi-ai-audit/COORDINATOR.md → "Session Counter" section.
>
> **AUDIT TRACKING**: Step 4 tracks audit thresholds by category. Single-session
> audits can be run via `/audit-code`, `/audit-security`, etc. See
> [AUDIT_TRACKER.md](./docs/AUDIT_TRACKER.md).
>
> **MANDATORY**: Step 5 ensures you leverage ALL available tools. If a skill or
> agent clearly applies to your task, you MUST use it. See "Available AI
> Capabilities" section below.

---

## 📚 Documentation Hierarchy

### Read Documents in This Order

**Every Session** (Critical - Always Read):

1. **[SESSION_CONTEXT.md](./SESSION_CONTEXT.md)** - Start here!
   - Current sprint focus
   - Next session goals
   - Active blockers
   - Recent completions

2. **[GLOBAL_SECURITY_STANDARDS.md](./docs/GLOBAL_SECURITY_STANDARDS.md)** -
   MANDATORY before coding!
   - Rate limiting requirements
   - Input validation requirements
   - Secrets management rules
   - OWASP compliance checklist

3. **[COORDINATOR.md](./docs/multi-ai-audit/COORDINATOR.md)** - Project health &
   reviews
   - Session counter (increment each session)
   - Project Health Dashboard
   - Compliance log

4. **[AUDIT_TRACKER.md](./docs/AUDIT_TRACKER.md)** - Audit thresholds &
   scheduling
   - Per-category threshold tracking (code, security, performance, refactoring,
     documentation, process)
   - Single-session audit history
   - Multi-AI audit scheduling triggers

5. **[ROADMAP.md](./ROADMAP.md)** - Project priorities
   - Current milestones
   - Feature priorities
   - Dependencies

**As Needed** (Reference When Relevant):

6. **Planning Documents** (when working on specific features):
   - Feature-specific plans in `docs/`
   - Archived plans: `docs/archive/completed-plans/`,
     `docs/archive/superseded-plans/`
   - Completed decisions: `docs/archive/completed-decisions/`

7. **Foundation Documents** (when making architectural decisions):
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
   - [SECURITY.md](./docs/SECURITY.md) - Security guidelines
   - [DEVELOPMENT.md](./DEVELOPMENT.md) - Development procedures, Git hooks,
     CI/CD workflows
   - [.claude/HOOKS.md](./.claude/HOOKS.md) - Claude hooks documentation
   - [.claude/CROSS_PLATFORM_SETUP.md](./.claude/CROSS_PLATFORM_SETUP.md) -
     Cross-platform Claude Code setup
   - [.claude/REQUIRED_PLUGINS.md](./.claude/REQUIRED_PLUGINS.md) - Plugin
     installation and troubleshooting

8. **Reference Documents** (when following workflows):
   - [PR_WORKFLOW_CHECKLIST.md](./docs/PR_WORKFLOW_CHECKLIST.md)
   - [AI_REVIEW_PROCESS.md](docs/AI_REVIEW_PROCESS.md)
   - [docs/SLASH_COMMANDS_REFERENCE.md](./docs/SLASH_COMMANDS_REFERENCE.md) -
     Slash commands reference (including audit commands)
   - [IMPLEMENTATION_PROMPTS.md](./docs/archive/IMPLEMENTATION_PROMPTS.md)
     (archived - historical reference only)

9. **Standards** (when creating/updating docs):
   - [DOCUMENTATION_STANDARDS.md](docs/DOCUMENTATION_STANDARDS.md)

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

**⚠️ IMPORTANT**: CodeRabbit reviews occur multiple times daily and must be
processed systematically.

**See**: [AI_REVIEW_PROCESS.md](docs/AI_REVIEW_PROCESS.md) for complete workflow

**Quick Reference**:

1. **Categorize** suggestions: Critical → Major → Minor → Trivial
2. **Triage** using decision matrix
3. **Document** decisions using template
4. **Implement** accepted changes
5. **Commit** with CodeRabbit review summary

**Template** (from AI_REVIEW_PROCESS.md):

```markdown
## CodeRabbit Review Summary

**Total Suggestions:** X **Addressed:** Y **Deferred:** Z **Rejected:** W

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

- ✅ **SESSION_CONTEXT.md** - Update "Recently Completed" and "Next Session
  Goals"
- ✅ **Relevant planning docs** - Update status, progress tracking

**After Milestone Completion**:

- ✅ **ROADMAP_LOG.md** - Add completion entry
- ✅ **ROADMAP.md** - Update status dashboard
- ✅ **SESSION_CONTEXT.md** - Update "Recently Completed"

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
- [ ] Follows [DOCUMENTATION_STANDARDS.md](docs/DOCUMENTATION_STANDARDS.md)

---

## 🗺️ Navigation Map

### "I need to know about..."

**Current Project Status**: → [SESSION_CONTEXT.md](./SESSION_CONTEXT.md)

**What to Work On Next**: → [SESSION_CONTEXT.md](./SESSION_CONTEXT.md) → "Next
Session Goals"

**Project Roadmap**: → [ROADMAP.md](./ROADMAP.md)

**Recent Work History**: → [SESSION_CONTEXT.md](./SESSION_CONTEXT.md) →
"Recently Completed" → [ROADMAP_LOG.md](./ROADMAP_LOG.md)

**System Architecture**: → [ARCHITECTURE.md](./ARCHITECTURE.md)

**Security Guidelines**: →
[GLOBAL_SECURITY_STANDARDS.md](./docs/GLOBAL_SECURITY_STANDARDS.md) - MANDATORY
standards → [SECURITY.md](./docs/SECURITY.md) - Additional security docs

**Development Procedures**: → [DEVELOPMENT.md](./DEVELOPMENT.md)

**How to Implement Features**: →
[PR_WORKFLOW_CHECKLIST.md](./docs/PR_WORKFLOW_CHECKLIST.md) →
[IMPLEMENTATION_PROMPTS.md](./docs/archive/IMPLEMENTATION_PROMPTS.md)
(archived - historical reference only)

**How to Process CodeRabbit Reviews**: →
[AI_REVIEW_PROCESS.md](docs/AI_REVIEW_PROCESS.md)

**Documentation Standards**: →
[DOCUMENTATION_STANDARDS.md](docs/DOCUMENTATION_STANDARDS.md)

**Cross-Platform Setup**: →
[.claude/CROSS_PLATFORM_SETUP.md](./.claude/CROSS_PLATFORM_SETUP.md) - Windows
CLI and Web setup

**Plugin Configuration**: →
[.claude/REQUIRED_PLUGINS.md](./.claude/REQUIRED_PLUGINS.md) - Plugin
installation guide

**Specific Feature Plans**: → Check `docs/` for feature-specific plans

---

## 🛠️ Available AI Capabilities

### MANDATORY: Use Available Tools

**This is NOT optional.** Before ANY task, check if a skill, agent, or MCP
applies. If a capability **clearly applies** to your task, you MUST use it.

> **Rule**: Capabilities are discovered dynamically. When new skills/agents/MCPs
> are added to the project, they are automatically available. Always scan the
> directories - don't rely on memorized lists.

### 🚨 PRE-TASK Checklist (BEFORE Starting Work)

**When you receive a task from the user, IMMEDIATELY check these triggers:**

```
☐ Am I starting a new project or working in an unfamiliar domain?
   → SHOULD use '/find-skills' to discover specialized capabilities

☐ Is this a bug, error, or unexpected behavior?
   → MUST use 'systematic-debugging' skill FIRST

☐ Am I exploring unfamiliar codebase areas?
   → MUST use 'Explore' agent via Task tool

☐ Does this require planning a multi-step implementation?
   → MUST use 'Plan' agent via Task tool

☐ Does this involve security, auth, or sensitive data?
   → MUST use 'security-auditor' agent

☐ Am I creating new documentation?
   → MUST use 'documentation-expert' agent

☐ Is this UI/frontend implementation work?
   → MUST use 'frontend-design' skill

☐ Does this involve database design or queries?
   → MUST use 'database-architect' agent

☐ Is this complex debugging requiring deep analysis?
   → MUST use 'debugger' agent (AFTER 'systematic-debugging' if it's a bug/unexpected behavior)
```

**If ANY trigger matches → Use the agent/skill BEFORE doing manual work.**

### 🚨 POST-TASK Checklist (AFTER Completing Work)

**Before committing, check these triggers:**

```
☐ Did I write or modify code (any amount)?
   → MUST run 'code-reviewer' agent

☐ Did I create new documentation?
   → MUST use 'documentation-expert' for authoring
   → SHOULD run 'technical-writer' for quality check

☐ Did I update existing documentation?
   → SHOULD run 'technical-writer' agent for quality check

☐ Did I make security-related changes?
   → MUST run 'security-auditor' agent

☐ Did I write tests?
   → SHOULD run 'test-engineer' agent to validate strategy
```

**If ANY trigger matches → Use the agent BEFORE committing.**

### How to Discover Capabilities

```bash
# Search all ecosystems (skills.sh + plugin marketplaces)
npm run capabilities:search -- [query]
# or invoke: /find-skills [query]

# Skills (specialized workflows and knowledge)
ls .claude/skills/

# Agents (specialist subagents for complex tasks)
ls .claude/agents/

# MCP Servers (external tool integrations)
# Check .claude/settings.json or project MCP configuration
```

### Skills (`.claude/skills/`)

Skills are specialized workflows with domain-specific knowledge. They are
invoked using the **Skill tool**.

**When to Use Skills:**

- `systematic-debugging` → Use FIRST for ANY bug, error, or unexpected behavior
- `code-reviewer` → Use AFTER writing or modifying code
- `requesting-code-review` → Use when completing features before merge
- `frontend-design` → Use for UI/UX implementation work
- `senior-frontend` / `senior-backend` / `senior-fullstack` → Use for
  implementation guidance
- `mcp-builder` → Use when creating MCP server integrations
- `gh-fix-ci` → Use when GitHub Actions CI/CD fails
- `markitdown` → Use when converting documents to Markdown

**Priority Order:**

1. **Process skills first** (debugging, brainstorming) - determine HOW to
   approach
2. **Implementation skills second** (frontend-design, senior-backend) - guide
   execution

**Example:**

```
Task: "Fix this authentication bug"
→ Use `systematic-debugging` skill FIRST
→ Then use `senior-backend` or `security-auditor` for the fix
```

### Agents (`.claude/agents/`)

Agents are specialist subagents invoked via the **Task tool** with
`subagent_type` parameter. They run autonomously and return results.

**When to Use Agents:**

- `code-reviewer` → Post-code review for quality/security
- `security-auditor` → Security vulnerability assessment
- `debugger` → Complex debugging requiring deep analysis
- `frontend-developer` / `backend-architect` → Domain-specific implementation
- `test-engineer` → Test strategy and automation
- `documentation-expert` → Documentation creation/improvement
- `git-flow-manager` → Git workflow operations
- `deployment-engineer` → CI/CD and deployment tasks

**Example:**

```
After writing a new Cloud Function:
→ Invoke code-reviewer agent to review the code
→ Invoke security-auditor agent to check for vulnerabilities
```

### MCP Servers

MCP (Model Context Protocol) servers provide external tool integrations. Check
project configuration for available servers.

**Common MCP Integrations:**

- Database access tools
- External API integrations
- File conversion tools
- Custom project-specific tools

### Decision Matrix: Skill vs Agent vs Direct Action

| Scenario                                | Use                                |
| --------------------------------------- | ---------------------------------- |
| New project/unfamiliar domain           | **Skill** (`/find-skills`)         |
| Need specific workflow guidance         | **Skill**                          |
| Need autonomous complex task completion | **Agent**                          |
| Simple, well-understood task            | **Direct action**                  |
| Bug or error encountered                | **Skill** (`systematic-debugging`) |
| Code review needed                      | **Agent** (`code-reviewer`)        |
| UI implementation                       | **Skill** (`frontend-design`)      |
| Security assessment                     | **Agent** (`security-auditor`)     |

### Red Flags: When You're Avoiding Capabilities

If you find yourself thinking these thoughts, STOP - you're rationalizing:

| Thought                                      | Reality                                             |
| -------------------------------------------- | --------------------------------------------------- |
| "This is just a simple task"                 | Simple tasks become complex. Check for skills.      |
| "I can do this faster myself"                | Skills/agents have specialized knowledge. Use them. |
| "Let me try first, then use skill if needed" | Check BEFORE starting.                              |
| "I remember what this skill does"            | Skills evolve. Read current version.                |
| "The skill is overkill for this"             | If it applies, use it.                              |
| "I'll just check git/files quickly"          | Skills tell you HOW to check correctly.             |

### Capability Maintenance

**When new capabilities are added:**

1. They appear automatically in `.claude/skills/` or `.claude/agents/`
2. No documentation update needed - discovery is dynamic
3. AIs scan directories at session start (Step 4 of Startup Checklist)

**To add new capabilities:**

- Skills: Add `SKILL.md` in `.claude/skills/<skill-name>/`
- Agents: Add `<agent-name>.md` in `.claude/agents/`
- MCPs: Configure in `.claude/settings.json` or project MCP config

---

## 🚨 Common Scenarios

### Scenario 1: Starting a New Feature

1. Read [SESSION_CONTEXT.md](./SESSION_CONTEXT.md) - Verify this is the priority
2. Check [ROADMAP.md](./ROADMAP.md) - Understand milestone context
3. Look for feature plan in `docs/` - Follow if exists
4. Reference [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand patterns
5. Follow [PR_WORKFLOW_CHECKLIST.md](./docs/PR_WORKFLOW_CHECKLIST.md) -
   Implementation workflow
6. Update docs as you work

### Scenario 2: Fixing a Bug

1. Check [SESSION_CONTEXT.md](./SESSION_CONTEXT.md) - Check known
   blockers/issues
2. Reference [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand component
3. Fix the bug
4. Add tests
5. Update [SESSION_CONTEXT.md](./SESSION_CONTEXT.md) if significant

### Scenario 3: Processing CodeRabbit Feedback

1. Follow [AI_REVIEW_PROCESS.md](docs/AI_REVIEW_PROCESS.md)
2. Categorize all suggestions
3. Triage using decision matrix
4. Implement accepted changes
5. Document using provided template
6. Commit with review summary

### Scenario 4: Documentation-Only Work

1. Check which tier doc belongs to
   ([DOCUMENTATION_STANDARDS.md](docs/DOCUMENTATION_STANDARDS.md))
2. Use appropriate template from `docs/templates/`
3. Follow metadata requirements
4. Validate links and formatting
5. Commit with "docs:" prefix

### Scenario 5: Completing a Milestone/Phase

1. Update planning doc - Mark complete
2. Update [ROADMAP.md](./ROADMAP.md) - Update dashboard
3. Add entry to [ROADMAP_LOG.md](./ROADMAP_LOG.md) - Archive completion
4. Update [SESSION_CONTEXT.md](./SESSION_CONTEXT.md) - Note completion
5. **RUN DELIVERABLE AUDIT** (see below)
6. Commit all doc updates together

---

## 🔍 MANDATORY: Deliverable Audit Procedure

### Purpose

**Every phase, section, or milestone completion MUST include a deliverable
audit** - a systematic verification that all goals were met and all deliverables
are complete. This is NOT optional.

### When to Run

Run a deliverable audit when ANY of these occur:

- ✅ Phase completion (e.g., Phase 1.5 complete)
- ✅ Milestone completion (e.g., M1.6 complete)
- ✅ Section completion within a plan
- ✅ Feature completion
- ✅ Sprint completion
- ✅ Any work package with defined deliverables

### Audit Process

```
DELIVERABLE AUDIT CHECKLIST

1. GATHER REQUIREMENTS
   ├── Find original goals/objectives
   ├── Find original acceptance criteria
   ├── Find original deliverables list
   └── Note any scope changes during work

2. VERIFY DELIVERABLES
   For each deliverable:
   ├── Does it exist? (file created, feature implemented)
   ├── Is it complete? (all required sections/features)
   ├── Does it meet acceptance criteria?
   └── Is it documented?

3. CHECK FOR GAPS
   ├── Any deliverables missing?
   ├── Any partially complete items?
   ├── Any acceptance criteria unmet?
   └── Any scope items forgotten?

4. DOCUMENT FINDINGS
   ├── List all deliverables and status
   ├── Note any gaps found
   ├── Note any items that exceed scope (bonus)
   └── Add to "What Was Accomplished" section

5. ADDRESS GAPS
   ├── Fix any gaps before marking complete
   ├── Or document why gap is acceptable
   └── Get user approval if scope changed
```

### Audit Template

Use this template when completing any phase/milestone:

```markdown
## Deliverable Audit: [Phase/Milestone Name]

**Audit Date:** YYYY-MM-DD **Auditor:** [AI Name]

### Original Goals

[List from original plan]

### Original Deliverables

[List from original plan]

### Verification Results

| Deliverable | Exists? | Complete? | Meets Criteria? | Notes |
| ----------- | ------- | --------- | --------------- | ----- |
| [Item 1]    | ✅/❌   | ✅/❌     | ✅/❌           |       |
| [Item 2]    | ✅/❌   | ✅/❌     | ✅/❌           |       |

### Acceptance Criteria Check

| Criterion     | Met?  | Evidence |
| ------------- | ----- | -------- |
| [Criterion 1] | ✅/❌ |          |
| [Criterion 2] | ✅/❌ |          |

### Gaps Found

- [Gap 1]: [Resolution]
- [Gap 2]: [Resolution]

### Additional Deliverables (Beyond Scope)

- [Bonus item 1]
- [Bonus item 2]

### Audit Result

- [ ] ALL deliverables complete
- [ ] ALL acceptance criteria met
- [ ] ALL gaps addressed
- [ ] Ready to mark phase/milestone COMPLETE
```

### Integration with Phase Completion

**Before marking ANY phase/milestone complete:**

1. Run deliverable audit
2. Fix any gaps found
3. Document in "What Was Accomplished" section
4. Only THEN mark as complete

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

| Version | Date       | Changes                                                                                                                                                                                              | Author      |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 2.0     | 2026-02-02 | Added cross-platform setup and plugin documentation references to hierarchy and navigation map                                                                                                       | Claude      |
| 1.9     | 2026-01-13 | Documented automated session-start checks (lessons:surface, docs:sync-check, pattern compliance, consolidation status); added time estimate for automated checks                                     | Claude      |
| 1.8     | 2026-01-08 | Added AUDIT_TRACKER.md to hierarchy (step 4); added .claude/HOOKS.md and SLASH_COMMANDS.md references; updated startup checklist for per-category audit tracking                                     | Claude      |
| 1.7     | 2026-01-03 | Added database-architect, debugger to PRE-TASK; split documentation triggers in POST-TASK; aligned with claude.md                                                                                    | Claude      |
| 1.6     | 2026-01-03 | Added PRE-TASK and POST-TASK mandatory checklists for agent/skill usage; strengthened enforcement language                                                                                           | Claude      |
| 1.5     | 2026-01-02 | Removed AI_HANDOFF.md references (deprecated/archived); updated navigation to use SESSION_CONTEXT.md for recent work                                                                                 | Claude      |
| 1.4     | 2026-01-01 | Added "Available AI Capabilities" section covering skills, agents, MCPs; added Step 4 to startup checklist for mandatory capability scanning; future-proofed for dynamic discovery of new tools      | Claude      |
| 1.3     | 2026-01-01 | Added MULTI_AI_REVIEW_COORDINATOR.md as step 3 in startup (session counter, health triggers); added compliance log update to session end; synced with DOCUMENTATION_STANDARDIZATION_PLAN.md workflow | Claude      |
| 1.2     | 2026-01-01 | Added MANDATORY Deliverable Audit Procedure as global standard for phase/milestone completion                                                                                                        | Claude      |
| 1.1     | 2026-01-01 | Added GLOBAL_SECURITY_STANDARDS.md as mandatory step 2 in session startup                                                                                                                            | Claude      |
| 1.0     | 2025-12-31 | Initial AI workflow guide created; includes CodeRabbit process reference                                                                                                                             | Claude Code |

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
3. Add entry to compliance log in
   [COORDINATOR.md](./docs/multi-ai-audit/COORDINATOR.md)
4. Commit documentation changes
5. Verify all work documented

**When updating this document:**

1. Preserve structure and organization
2. Keep Quick Reference current
3. Update Navigation Map when docs change
4. Test all links before committing

---

**END OF AI_WORKFLOW.md**

This is your primary navigation guide. Bookmark it mentally for every session.
