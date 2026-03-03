---
name: session-end
description: Complete verification steps before ending the session
---

# Session End Checklist

Before ending the session, complete these steps:

## When to Use

- Tasks related to session-end
- User explicitly invokes `/session-end`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## 1. Roadmap Check (if feature work done)

If you implemented features or completed tasks this session, verify ROADMAP.md
reflects current status if it exists. Mark completed items with `[x]`.

## 2. Commit Summary

Review what was done this session:

```bash
git log --oneline -5
```

## 3. Session Context Update (MANDATORY — DO NOT SKIP)

> **Why this matters:** If you skip this step, the next session starts with
> stale context — wrong priorities, wrong metrics, wrong status. Every section
> below must be updated.

Update SESSION_CONTEXT.md if it exists:

### A. Recent Session Summaries

1. Add this session's summary (what was accomplished)
2. Keep only the **last 3 session summaries** — archive older ones to
   `docs/SESSION_HISTORY.md` if applicable
   - Add new entries at the **top** of the most recent section
   - Use format: `### Session #N (YYYY-MM-DD)` with `**Focus**:` line
3. Target: SESSION_CONTEXT.md should stay under ~300 lines

### B. Quick Status Table

Update the Quick Status table to reflect **current reality**:

- Check each row — does the status/progress match what was accomplished?
- Update any progress numbers, plan step status

### C. Next Session Goals

Rewrite the "Immediate Priority" goals based on **what's actually next**:

- Remove goals that were completed this session
- Add new goals based on what this session's work unlocked
- Goals should reflect the state AFTER this session, not before

## 4. Agent Compliance Review

Check if agents suggested during the session were actually invoked:

```bash
# Check agent tracking state if hooks are configured
cat .claude/hooks/.session-agents.json 2>/dev/null
cat .claude/hooks/.agent-trigger-state.json 2>/dev/null
```

Compare agents invoked against suggestions. Report any gaps:

- Which agents were suggested but never invoked?
- Were code-reviewer agents used after code modifications?

Also check the delegated review queue:

```bash
cat .claude/state/pending-reviews.json 2>/dev/null
```

If `pending-reviews.json` shows `queued: true` but no code-reviewer was invoked,
flag this as a compliance gap and suggest the user run a review before merging.

## 5. Clean Up State Files

Remove ephemeral session state that should not persist.

```bash
# Remove ephemeral session tracking files
rm -f .claude/hooks/.session-agents.json
rm -f .claude/hooks/.agent-trigger-state.json

# Always remove the pending reviews queue for the session
rm -f .claude/state/pending-reviews.json

# Only remove handoff if no tasks are still in progress
if ! grep -q '"status": "in_progress"' .claude/state/task-*.state.json 2>/dev/null; then
  echo "No in-progress tasks found. Cleaning up handoff file."
  rm -f .claude/state/handoff.json
else
  echo "In-progress tasks found. Preserving handoff.json for session recovery."
fi
```

Keep `task-*.state.json` files only if they have `in_progress` steps (the user
may resume them next session).

## 6. Final Commit (MANDATORY)

Commit and push all session-end changes:

```bash
git add -A
git commit -m "session-end: [brief summary of session work]"
git push
```

Session complete.

---

## Version History

| Version | Date       | Description                                                 |
| ------- | ---------- | ----------------------------------------------------------- |
| 1.0     | 2026-02-25 | Initial implementation                                      |
| 1.1     | 2026-03-01 | Sanitized for framework repo (removed app-specific scripts) |
