---
name: session-end
description: Complete verification steps before ending the session
---

# Session End Checklist

Before ending the session, complete these steps:

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

## 5. Update Session State

```bash
npm run hooks:health -- --end
```

## 6. Clean Up State Files

Remove ephemeral session state that should not persist.

```bash
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

## 7. TDMS Consolidation & Metrics

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

## 8. Final Commit & Push (MANDATORY)

```bash
npm run session:end
```

This script commits and pushes all session-end changes.

Session complete.
