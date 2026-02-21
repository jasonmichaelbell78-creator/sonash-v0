# Context Preservation & Compaction Safety

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-10
**Status:** ACTIVE
<!-- prettier-ignore-end -->

## Purpose

Detailed guidance for preventing loss of important decisions and state during
context compaction. Loaded on-demand by compaction hooks.

**Source:** Extracted from claude.md Section 7 (v4.2)

---

## Decision Logging

**Auto-save to `docs/SESSION_DECISIONS.md` when:**

- Presenting 3+ options to user for a decision
- User makes a significant architectural/feature choice
- Discussing implementation approaches with trade-offs
- Any decision that would be painful to re-research

**Format:**

```markdown
### [DATE] - [SHORT TITLE]

**Context:** What prompted this **Options:** Numbered list of choices **User
Choice:** What was selected **Implementation:** Link to PR/commit/roadmap
```

## File-Based State Persistence

**For any multi-step task (3+ steps)**, write progress to
`.claude/state/task-{name}.state.json`:

```json
{
  "task": "task-name",
  "started": "ISO datetime",
  "lastUpdated": "ISO datetime",
  "steps": [
    { "name": "Step 1", "status": "completed", "output": "file.md" },
    { "name": "Step 2", "status": "in_progress" },
    { "name": "Step 3", "status": "pending" }
  ],
  "context": { "branch": "branch-name", "notes": "key info" }
}
```

This file survives compaction and enables clean resumption. Update it after
completing each step. The `.claude/state/` directory is gitignored for ephemeral
session data.

## Compaction-Resilient State Persistence (4 Layers)

Automatic multi-layer defense against state loss during context compaction:

| Layer         | Hook                     | Trigger                       | Output                           |
| ------------- | ------------------------ | ----------------------------- | -------------------------------- |
| A: Commit Log | `commit-tracker.js`      | PostToolUse: Bash             | `.claude/state/commit-log.jsonl` |
| B: Threshold  | `compaction-handoff.js`  | PostToolUse: Read (25+ files) | `.claude/state/handoff.json`     |
| C: PreCompact | `pre-compaction-save.js` | PreCompact (auto/manual)      | `.claude/state/handoff.json`     |
| Restore       | `compact-restore.js`     | SessionStart:compact          | stdout (context injection)       |
| D: Gap Detect | `check-session-gaps.js`  | Session begin (npm script)    | Console warnings                 |

- **Layer A** logs every git commit to append-only JSONL — survives all failure
  modes including crashes
- **Layer C** is the most reliable — fires at exactly the right moment before
  compaction, captures full task states + commit log + git context
- **Restore** automatically outputs structured recovery context after compaction
  (task progress, recent commits, git status)
- **Layer D** detects sessions missing from SESSION_CONTEXT.md at next session
  start (`npm run session:gaps`)

**On session resume after compaction:**

1. `compact-restore.js` auto-outputs recovery context (no manual action needed)
2. Read `.claude/state/handoff.json` for full details if needed
3. Read any `.claude/state/task-*.state.json` for in-progress tasks
4. Cross-reference with `git log --oneline -5` and `git status`

## Other Preservation Tools

- Writing detailed plans to `.claude/plans/` before implementation
- Using `/checkpoint` before risky operations
- **MCP Memory for cross-session context** - Save important context with
  `mcp__memory__create_entities()` before compaction, retrieve with
  `mcp__memory__read_graph()` at session start

## Pre-Commit Failure Recovery

When `git commit` fails on pre-commit hooks, use `/pre-commit-fixer` to classify
and fix failures efficiently instead of manual fix-retry cycles. Category A
errors (doc index, cross-doc deps) are auto-fixable inline. Category B errors
(ESLint, pattern violations) should be delegated to a focused subagent.

## Agent Team Compaction Safety

Agent teams have unique compaction challenges because each teammate is a
separate context window:

- **Lead compaction:** If the lead's context compacts, teammates keep working.
  On restore, lead reads handoff.json + checks team status via task list.
- **Teammate compaction:** Individual teammates may compact independently. They
  restore from their own context. Lead should check teammate status after any
  pause.
- **Pre-compaction save:** The `pre-compaction-save.js` hook captures team
  status in handoff.json (active teammates, their assigned tasks, completion
  status).
- **Budget monitoring:** If total team token usage exceeds 80% of budget, lead
  should proactively wind down the team to prevent mid-work compaction.

## Version History

| Version | Date       | Change                           |
| ------- | ---------- | -------------------------------- |
| 1.0     | 2026-02-10 | Extracted from claude.md v4.2 S7 |
