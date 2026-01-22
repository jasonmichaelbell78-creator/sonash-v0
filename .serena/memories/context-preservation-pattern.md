# Context Preservation Pattern

## Problem

Context compaction can lose important decisions, options presented, and user
choices.

## Solution

Auto-save decisions to `docs/SESSION_DECISIONS.md` when:

- Presenting 3+ options to user
- User makes architectural/feature choices
- Discussing implementation approaches
- Any decision that would be painful to re-research

## Format

```markdown
### [DATE] - [SHORT TITLE]

**Context:** What prompted this **Options:** Numbered list **User Choice:**
Selection **Implementation:** Link to PR/commit/roadmap
```

## Other Context Sources

- Full transcript: `~/.claude/projects/.../[session-id].jsonl`
- Plans: `.claude/plans/`
- Checkpoints: `/checkpoint` command updates SESSION_CONTEXT.md

## Added

2026-01-17 - After losing 10 Firebase Console options during compaction
