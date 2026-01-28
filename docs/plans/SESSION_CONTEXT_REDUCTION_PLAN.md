# SESSION_CONTEXT.md Reduction Plan

**Version**: 1.0 **Created**: 2026-01-28 (Session #113) **Status**: PROPOSED

---

## Problem Statement

SESSION_CONTEXT.md has grown to **1,089 lines** with historical session
summaries dating back to Session #76. This violates its original purpose as a
"Quick session-to-session handoff" that should be "read in under 2 minutes."

**Current Issues:**

- Contains 30+ historical session summaries (Sessions #76-103)
- Duplicate information (also in ROADMAP_LOG.md, commit messages)
- Cognitive overload for AI at session start
- Frequent merge conflicts due to size

---

## Proposed Solution

### Phase 1: Create SESSION_HISTORY.md (Archive)

Create a new file `docs/SESSION_HISTORY.md` to archive historical session
summaries.

**Contents to move:**

- Session #76-100 summaries
- Detailed "Session #XX Update" blocks
- Historical sprint progress not relevant to current work

**SESSION_HISTORY.md Structure:**

```markdown
# Session History Log

Append-only archive of completed session summaries.

## 2026-01 Sessions

### Session #103 (2026-01-27)

[Summary here]

### Session #102 (2026-01-27)

[Summary here]
```

### Phase 2: Streamline SESSION_CONTEXT.md

Keep only these sections (target: <200 lines):

1. **Quick Recovery** (Current - keep)
   - Last checkpoint, branch, working on, next step, uncommitted work

2. **Purpose** (Current - keep as-is)

3. **Session Tracking** (Current - keep)
   - Current session count only

4. **Current Sprint Focus** (Current - TRIM)
   - Remove completed session summaries
   - Keep only active sprint reference
   - Remove "Session #XX Update" blocks older than 5 sessions

5. **Active Blockers** (Keep if exists)

6. **Recently Completed** (NEW SECTION - rolling 5 sessions max)
   - One-liner per session: `Session #103: Track T integration`
   - Links to detailed entry in SESSION_HISTORY.md

### Phase 3: Automate Session Summary Archival

Add to `/session-end` skill:

```
1. Archive current session summary to SESSION_HISTORY.md
2. Update SESSION_CONTEXT.md "Recently Completed" (keep last 5)
3. Remove older entries from SESSION_CONTEXT.md
```

---

## Day-to-Day Process Changes

### 1. Session Start (no change)

- Read SESSION_CONTEXT.md (now faster - <200 lines)
- Increment session counter
- Check alerts via `/alerts` skill

### 2. During Session (new)

- **Large context warning** → Triggers MCP save reminder (alerts-reminder.js)
- **20+ files read** → Automatic context preservation prompt
- **Use `/checkpoint`** for mid-session saves (existing)

### 3. Session End (enhanced)

- Run `/session-end` which now:
  1. Archives session summary to SESSION_HISTORY.md
  2. Updates SESSION_CONTEXT.md (trims old entries)
  3. Saves critical context to MCP memory
  4. Generates pending alerts for next session

### 4. Hook-Triggered Skills (new)

Instead of manual intervention, hooks trigger skills:

| Trigger              | Hook             | Skill           | Action                     |
| -------------------- | ---------------- | --------------- | -------------------------- |
| Pre-commit lint fail | pre-commit       | `/quick-fix`    | Auto-suggest fixes         |
| Doc file changed     | pre-commit       | `/docs-update`  | Update DOCUMENTATION_INDEX |
| Large context        | PostToolUse:Read | `/save-context` | Prompt MCP save            |
| Session >4 hours     | UserPromptSubmit | `/session-end`  | Remind to wrap up          |

---

## Implementation Steps

### Immediate (Session #113)

- [x] Create this plan
- [ ] Create SESSION_HISTORY.md with header
- [ ] Move Sessions #76-100 from SESSION_CONTEXT.md to SESSION_HISTORY.md
- [ ] Update SESSION_CONTEXT.md structure

### Follow-up (E14 in ROADMAP)

- [ ] Update `/session-end` skill to automate archival
- [ ] Add SESSION_HISTORY.md to DOCUMENT_DEPENDENCIES.md
- [ ] Test new workflow over 3-5 sessions

---

## Success Criteria

1. SESSION_CONTEXT.md < 200 lines
2. Session start reads take < 30 seconds for AI
3. Historical context preserved in SESSION_HISTORY.md
4. No loss of important information
5. `/session-end` handles archival automatically

---

## Rollback Plan

If issues arise:

1. SESSION_HISTORY.md can be merged back
2. Git history preserves original SESSION_CONTEXT.md
3. Process changes are non-breaking
