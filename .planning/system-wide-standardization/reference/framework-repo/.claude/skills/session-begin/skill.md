---
name: session-begin
description: Complete verification steps before starting any work session
---

# Session Begin Checklist

**IMPORTANT - Duplicate Detection:**

Before proceeding with the full checklist, check if this session was already
started:

1. **Read the current conversation context** - Have I already completed this
   checklist in the current conversation?
2. **Check SESSION_CONTEXT.md timestamp** - Was "Last Updated" modified today?
   - **Note**: Field stores date only (YYYY-MM-DD), not time. Sub-day duplicate
     detection relies on conversation context check (#1) and session counter
     check (#3).
3. **Check session counter** - Did I already increment the session counter
   earlier in this conversation?

**If ANY of these are true:**

- Session is already active
- DO NOT re-run the checklist
- DO NOT re-increment the session counter
- DO NOT re-run startup scripts
- Example response: "Session #35 already active (started earlier in this
  conversation). Checklist completed earlier. What would you like to work on?"

**If ALL are false:**

- This is a new session
- Proceed with full checklist below

---

Before starting any work, complete these verification steps:

## When to Use

- Tasks related to session-begin
- User explicitly invokes `/session-begin`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## 0. Cross-Session Validation (AUTOMATIC)

On session start, check for any uncommitted work or interrupted sessions from
previous conversations:

```bash
git status
git log --oneline -5
```

If prior session appears to have missed cleanup, update SESSION_CONTEXT.md
accordingly.

---

## 0b. Episodic Memory Search (RECOMMENDED)

Search past conversations for relevant context using episodic memory. This helps
recover decisions, solutions, and patterns from previous sessions.

**Use `mcp__plugin_episodic-memory_episodic-memory__search` with these
queries:**

```javascript
// Search for context on current work
search({ query: ['current branch/feature name', 'decisions'] });

// Search for past errors if debugging
search({ query: 'error message or pattern' });

// Search for established patterns
search({ query: ['component/module name', 'patterns'] });
```

**When to search:**

| Situation             | Query Example                               |
| --------------------- | ------------------------------------------- |
| Starting feature work | `["feature-name", "decisions", "approach"]` |
| Debugging an error    | `"TypeError: Cannot read property"`         |
| Code review prep      | `["module-name", "review", "patterns"]`     |
| Resuming paused work  | `["branch-name", "context", "next steps"]`  |

**Tips:**

- Single string = semantic search (fuzzy, meaning-based)
- Array of 2-5 terms = AND search (all terms must match)
- Use `limit: 5` for focused results, `limit: 20` for broader search
- Current conversation is NOT indexed yet (only previous sessions)

**Summarize findings** for the user if relevant context is found.

---

## 1. Context Loading (MANDATORY)

- [ ] Read SESSION_CONTEXT.md if it exists - Current status, active blockers,
      next goals
- [ ] Increment session counter in SESSION_CONTEXT.md if it exists
- [ ] Read ROADMAP.md lines 1-100 (Active Sprint section only) if it exists

## 1b. Stale Documentation Check (RECOMMENDED)

**Documentation often drifts from reality.** Before trusting any status in docs,
verify against actual commits:

```bash
# Check recent commits to see actual work done
git log --oneline -30

# Check commits since last documented session date
git log --oneline --since="YYYY-MM-DD"
```

**Compare commits against documented status:**

1. Look for feature/fix commits (e.g., "feat:", "fix:", "refactor:")
2. Cross-reference with ROADMAP.md Active Sprint checkboxes if present
3. If commits show work done but docs show incomplete → **UPDATE THE DOCS**

**If docs are stale:**

1. Update the stale document with correct status
2. Note which sessions failed to update docs
3. Commit the corrections before proceeding

---

## 2. Documentation & Planning Awareness

- [ ] Review ROADMAP.md Active Sprint section (first ~100 lines) for current
      work if it exists
- [ ] Note: Archive files in `docs/archive/` are excluded from linting if
      applicable
- [ ] Completed plans are archived to `docs/archive/completed-plans/` if
      applicable

## 3. Skill Selection (BEFORE starting work)

```
DECISION TREE:
├─ New project/domain? → Use '/find-skills' to discover capabilities
├─ Bug/Error? → Use 'systematic-debugging' skill FIRST
├─ Writing code? → Use 'code-reviewer' agent AFTER completion
├─ Security work? → Use 'security-auditor' agent
├─ UI/Frontend? → Use 'frontend-design' skill
├─ Complex task? → Check available skills with /skills
└─ Multi-step task? → Use TodoWrite to track progress
```

## 4. Code Review Handling Procedures

When receiving code review feedback (CodeRabbit, Qodo, etc.):

1. **Analyze ALL suggestions** - Read through every comment multiple times
2. **Create TodoWrite checklist** - Track each suggestion as a task
3. **Address systematically** - Don't skip items; mark as resolved or note why
   skipped
4. **Verify CI impact** - Check if changes affect workflows
5. **Test after changes** - Run tests and lint before committing

## 5. Anti-Pattern Awareness

**Before writing code**, review any project-specific anti-patterns documented in
CLAUDE.md or equivalent. Key universal patterns:

- **Read before edit** - Always read files before attempting to edit
- **Regex performance** - Avoid greedy `.*` in patterns; use bounded
  `[\s\S]{0,N}?`
- **Path-based filtering** - Add pathFilter for directory-specific patterns
- **Archive exclusions** - Historical docs should be excluded from strict
  linting

## 6. Session State Check

Check for any pending work from previous sessions:

```bash
# Check for unfinished task state files
ls .claude/state/task-*.state.json 2>/dev/null

# Check handoff file if it exists
cat .claude/state/handoff.json 2>/dev/null
```

If task state files exist with `in_progress` steps, review them before starting
new work.

---

Ready to begin session. What would you like to work on?

---

## Version History

| Version | Date       | Description                                               |
| ------- | ---------- | --------------------------------------------------------- |
| 1.0     | 2026-02-25 | Initial implementation                                    |
| 1.1     | 2026-03-01 | Sanitized for framework repo (removed app-specific steps) |
