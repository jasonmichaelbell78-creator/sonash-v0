---
name: checkpoint
description: |
  Save session state for recovery after compaction or failures. Default: save to
  local files (.claude/state/). With --mcp: also save to MCP memory for
  cross-session persistence.
metadata:
  short-description: Save session state (local + optional MCP memory)
---

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-02-14
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Session Checkpoint

Save current state so you can recover after compaction or session failure.

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## Usage

```
/checkpoint          # Save to local files only
/checkpoint --mcp    # Save to local files + MCP memory
```

---

## Local Save (default)

### 1. Update SESSION_CONTEXT.md Quick Recovery

```markdown
## Quick Recovery

**Last Checkpoint**: YYYY-MM-DD HH:MM **Branch**: `branch-name-here` **Working
On**: [brief task description] **Files Modified**: [list or "none"] **Next
Step**: [what to do next] **Uncommitted Work**: yes/no
```

### 2. Write State Files

Update `.claude/state/handoff.json`:

```json
{
  "timestamp": "ISO datetime",
  "git": {
    "branch": "current branch",
    "lastCommit": "hash + message",
    "uncommittedFiles": ["list"]
  },
  "currentTask": "what you are working on",
  "completedSteps": ["step 1", "step 2"],
  "pendingSteps": ["step 3", "step 4"],
  "notes": "anything important for resumption"
}
```

For multi-step tasks, also write `.claude/state/task-{name}.state.json`:

```json
{
  "task": "task-name",
  "started": "ISO datetime",
  "lastUpdated": "ISO datetime",
  "steps": [
    { "name": "Step 1", "status": "completed" },
    { "name": "Step 2", "status": "in_progress" }
  ],
  "context": { "branch": "branch-name", "notes": "key info" }
}
```

### 3. Consider Committing

If uncommitted work exists and the task is at a safe point:

```bash
git add -A && git commit -m "WIP: checkpoint before potential failure"
```

---

## MCP Save (`--mcp` flag)

When `--mcp` is specified, also save structured entities to MCP memory.

### Create Entities

Use `mcp__memory__create_entities()`:

```javascript
entities = [
  {
    name: "Session_2026-01-28_TaskName",
    entityType: "session_context",
    observations: [
      "Working on: [task description]",
      "Completed: [what was done]",
      "Decision: [key choice made]",
      "Files: [files modified]",
      "Next: [pending work]",
    ],
  },
];
```

### Entity Types

| Type                     | Use For                                   |
| ------------------------ | ----------------------------------------- |
| `session_context`        | Current work status, progress, next steps |
| `architectural_decision` | Design choices with rationale             |
| `bug_investigation`      | Debugging context, findings, hypotheses   |
| `feature_implementation` | Feature details, approach, progress       |

### Naming Conventions

- **Sessions**: `Session_YYYY-MM-DD_BriefTaskName`
- **Decisions**: `Decision_FeatureName_Choice`
- **Bugs**: `Bug_ComponentName_Issue`

### Create Relations

Link related entities with `mcp__memory__create_relations()`.

### Confirm Save

After saving, report what was preserved:

```
Saved to MCP memory:
- Session context: [summary]
- Decisions: [count]
To retrieve later: mcp__memory__read_graph()
```

---

## When to Use

- Before large file operations
- Before complex multi-step tasks
- When session is getting long (50+ tool calls)
- Periodically during long sessions (every 30-60 minutes)
- Before risky operations

## Compaction Recovery

On resume after compaction:

1. Read `.claude/state/handoff.json`
2. Read any `.claude/state/task-*.state.json`
3. If MCP was used: `mcp__memory__search_nodes("Session_")`
4. Cross-reference with `git log` and `git status`

---

## Version History

| Version | Date       | Description            |
| ------- | ---------- | ---------------------- |
| 1.0     | 2026-02-25 | Initial implementation |
