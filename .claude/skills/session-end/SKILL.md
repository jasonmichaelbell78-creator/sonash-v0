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
reflects current status. Mark completed items with `[x]`.

## 2. Learning Consolidation (AUTOMATIC)

Consolidation runs **automatically** during SessionStart when the threshold is
reached (10+ reviews). No manual action required at session end.

## 3. Commit Summary

Review what was done this session:

```bash
git log --oneline -5
```

## 3b. Session Context Update (MANDATORY — DO NOT SKIP)

> **Why this matters:** If you skip this step, the next session starts with
> stale context — wrong priorities, wrong metrics, wrong status. This has caused
> real bugs. Every section below must be updated.

Update **all three forward-looking sections** of SESSION_CONTEXT.md:

### A. Recent Session Summaries

1. Add this session's summary (what was accomplished, TDMS metrics snapshot)
2. Keep only the **last 3 session summaries** — archive older ones to
   `docs/SESSION_HISTORY.md`
   - Add new entries at the **top** of the most recent month section
   - Use format: `### Session #N (YYYY-MM-DD)` with `**Focus**:` line
3. Target: SESSION_CONTEXT.md should stay under ~300 lines

### B. Quick Status Table

Update the Quick Status table to reflect **current reality**:

- Check each row — does the status/progress match what was accomplished?
- Update TDMS numbers, sprint progress percentages, plan step status
- If a plan advanced (e.g., "Step 0a done" → "Steps 0a-10 done"), update it

### C. Next Session Goals

Rewrite the "Immediate Priority" goals based on **what's actually next**:

- Remove goals that were completed this session
- Add new goals based on what this session's work unlocked
- Update S0/S1 counts to match current TDMS metrics
- Goals should reflect the state AFTER this session, not before

## 4. Agent Compliance Review

Check if agents suggested during the session were actually invoked:

```bash
# Check agent tracking state
cat .claude/hooks/.session-agents.json 2>/dev/null
cat .claude/hooks/.agent-trigger-state.json 2>/dev/null
```

Compare `agentsInvoked` from `.session-agents.json` against suggestions in
`.agent-trigger-state.json`. Report any gaps:

- Which agents were suggested but never invoked?
- Were code-reviewer agents used after code modifications?

Also check the delegated review queue:

```bash
cat .claude/state/pending-reviews.json 2>/dev/null
```

If `pending-reviews.json` shows `queued: true` but no code-reviewer was invoked,
flag this as a compliance gap and suggest the user run a review before merging.

## 4b. Override Audit Review

Check if any blocking checks were skipped during this session:

```bash
node scripts/log-override.js --list
```

If overrides were used:

1. Were they justified? (Check reason field)
2. Did the skipped check actually pass later? (Rerun the check now)
3. Should this check be made non-blocking instead of requiring SKIP\_?
4. Log unjustified skips as process improvement items

Flag any overrides without reasons as process violations.

## 5. Update Session State

```bash
npm run hooks:health -- --end
```

## 6. Clean Up State Files

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

## 7. Velocity Tracking

Capture session velocity metrics (items completed from ROADMAP.md):

```bash
node scripts/velocity/track-session.js
```

This script:

- Diffs ROADMAP.md to count items checked off this session
- Appends an entry to `.claude/state/velocity-log.jsonl`
- Prints a summary with rolling average and trend

## 7b. Review Sync (AUTOMATIC)

**Auto-sync** review entries from the markdown log to the JSONL consumption
file. This step is **mandatory and automatic** — always run it, do not skip.

```bash
npm run reviews:sync -- --apply
```

This ensures `AI_REVIEW_LEARNINGS_LOG.md` and `.claude/state/reviews.jsonl` stay
in sync. If no new reviews were added this session, the script exits cleanly.

**Important:** This must run before the final commit (Step 9) so synced data is
included. Session-begin will verify this was done and flag drift if skipped.

## 8. TDMS Consolidation & Metrics

Run the full consolidation pipeline to ensure dedup is current (~1.5s):

```bash
node scripts/debt/consolidate-all.js
```

This runs: extract → normalize → multi-pass dedup (6 passes) → generate views.

Then regenerate metrics for dashboard integration:

```bash
node scripts/debt/generate-metrics.js
```

This generates:

- `docs/technical-debt/MASTER_DEBT.jsonl` - Canonical debt store (deduped)
- `docs/technical-debt/metrics.json` - Machine-readable for dashboard
- `docs/technical-debt/METRICS.md` - Human-readable summary

## 9. Final Commit & Push (MANDATORY)

```bash
npm run session:end
```

This script commits and pushes all session-end changes.

Session complete.

---

## Version History

| Version | Date       | Description            |
| ------- | ---------- | ---------------------- |
| 1.0     | 2026-02-25 | Initial implementation |
