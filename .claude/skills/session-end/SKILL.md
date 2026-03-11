---
name: session-end
description:
  Session closure pipeline — context preservation, compliance review, metrics
  capture, and final commit. Ensures the next session starts with accurate
  context and current metrics.
---

# Session End Pipeline

Structured closure workflow that preserves session context for the next session,
runs compliance checks, captures metrics, and commits all changes. Designed to
prevent stale context — the #1 cause of wasted time in subsequent sessions.

## Critical Rules (MUST follow)

1. **MUST update SESSION_CONTEXT.md** — all three sections (summary, status
   table, next goals). Skipping this causes the next session to start with wrong
   priorities, wrong metrics, wrong status.
2. **MUST show pre-commit summary** before pushing — `git status`, script
   results, and any warnings. Never push blind.
3. **MUST note script failures** — if any script fails, log it, continue with
   remaining steps, and flag in the pre-commit summary.
4. **MUST show health score dashboard and velocity summary** to the user.
   Summarize other script output only if errors occurred.

## When to Use

- End of work session (done for the day)
- Before closing Claude Code
- When switching to a different project
- User explicitly invokes `/session-end`

## When NOT to Use

- **Mid-session save** — use `/checkpoint` instead (preserves state without
  closure)
- **Quick break without pushing** — use `/session-end --no-push` (runs steps
  1-8, skips commit)
- **Still actively working** — don't run yet; session-end is for closure

> **Routing:** `session-end` = full closure (context + metrics + commit + push).
> `checkpoint` = mid-session state preservation without closure or metrics.

## Inputs

This skill needs:

- **Conversation context** — what was accomplished this session
- **SESSION_CONTEXT.md** — current state to update
- **State files** — `.claude/hooks/.session-agents.json`,
  `.agent-trigger-state.json`, `pending-reviews.json`

**Compaction recovery (MUST):** If conversation context is unavailable after
compaction, reconstruct from git commits — they are the most reliable context
source:

```bash
git log --oneline -20
git diff --stat HEAD~10
```

State files are secondary (may already be cleaned up by Step 7).

## Anti-Patterns

- **Running mid-task** — finish current work first, then close the session
- **Skipping Step 2** — stale SESSION_CONTEXT.md is the #1 session-start problem
- **Committing on wrong branch** — verify you're on the branch where session
  work was done
- **Running twice** — check duplicate detection (Step 8) before re-running

## Duplicate Detection (MUST)

Before running, check if session-end already ran this session:

1. Was SESSION_CONTEXT.md already updated today with a current session summary?
2. Did the conversation already complete this checklist?

If yes, skip redundant steps. Warn the user: "Session-end already ran this
session. Re-running would duplicate the session summary."

---

## Warm-Up (MUST — present at start)

```
Session-end pipeline: context preservation, compliance review, metrics
capture, and final commit. 4 phases, ~2-3 minutes.
```

---

## Phase 1: Context Preservation (Steps 1-3) — MUST

### Step 1. Review Session Work

Use git log to review what was done. This output feeds Step 2.

```bash
git log --oneline -10
```

### Step 2. Update SESSION_CONTEXT.md (MANDATORY — DO NOT SKIP)

> **Why this matters:** If you skip this step, the next session starts with
> stale context — wrong priorities, wrong metrics, wrong status. This has caused
> real bugs. Every section below must be updated.

Use the commit summary from Step 1 to update **all three sections**:

**A. Recent Session Summaries (MUST)**

Add this session's summary. Must include:

1. What was accomplished (reference commits)
2. TDMS metrics delta (if changed)
3. Any blockers for next session

Keep only the **last 3 session summaries** — archive older ones to
`docs/SESSION_HISTORY.md` (add new entries at the **top** of the most recent
month section, format: `### Session #N (YYYY-MM-DD)` with `**Focus**:` line).

> **Format note:** Session summary format must match what `session-begin`
> expects to parse. See session-begin Step 1 for the canonical format.

**B. Quick Status Table (MUST)**

Update to reflect **current reality** — TDMS numbers, sprint progress, plan step
status.

**C. Next Session Goals (MUST)**

Rewrite based on what's **actually next** — remove completed goals, add new
goals unlocked by this session's work, update S0/S1 counts.

Target: SESSION_CONTEXT.md should stay under ~300 lines.

### Step 3. Roadmap Check (SHOULD — if feature work done)

If you implemented features or completed tasks, verify ROADMAP.md reflects
current status. Mark completed items with `[x]`. Skip if no feature work done.

**Progress: Context preservation complete (1/4 phases).**

---

## Phase 2: Compliance Review (Steps 4-6) — SHOULD

### Step 4. Agent Compliance Review (SHOULD)

Check if agents suggested during the session were actually invoked:

```bash
cat .claude/hooks/.session-agents.json 2>/dev/null
cat .claude/hooks/.agent-trigger-state.json 2>/dev/null
```

Compare `agentsInvoked` against suggestions. Report gaps. Also check:

```bash
cat .claude/state/pending-reviews.json 2>/dev/null
```

If `pending-reviews.json` shows `queued: true` but no code-reviewer was invoked,
flag as a compliance gap.

### Step 5. Override Audit Review (SHOULD — if overrides were used)

```bash
node scripts/log-override.js --list
```

If overrides exist: Were they justified? Did the skipped check pass later?
Should it be made non-blocking? Flag overrides without reasons as process
violations. Skip if no overrides were used this session.

### Step 6. Update Session State (SHOULD)

```bash
npm run hooks:health -- --end
```

**Progress: Compliance review complete (2/4 phases).**

---

## Phase 3: Metrics & Data Pipeline (Step 7) — MUST

Run these commands sequentially. If any command fails, note the failure and
continue with the remaining commands.

| #   | Command                                                                | Purpose                 | Output                     | Skip if                  |
| --- | ---------------------------------------------------------------------- | ----------------------- | -------------------------- | ------------------------ |
| a   | `node scripts/velocity/track-session.js`                               | Velocity tracking       | velocity-log.jsonl         | No roadmap items changed |
| b   | `npm run reviews:sync -- --apply`                                      | Review sync (v1 bridge) | reviews.jsonl              | Never skip               |
| c   | `node .claude/skills/ecosystem-health/scripts/run-ecosystem-health.js` | Health score snapshot   | ecosystem-health-log.jsonl | Never skip               |
| d   | `node scripts/debt/consolidate-all.js`                                 | TDMS consolidation      | MASTER_DEBT.jsonl          | Never skip               |
| e   | `node scripts/debt/generate-metrics.js`                                | TDMS metrics            | metrics.json, METRICS.md   | Never skip               |

**Ecosystem health triage check (SHOULD):** After 7c, check if
`.claude/state/task-ecosystem-health-triage.state.json` exists. If it does, read
it and include in session summary: "N dimensions triaged (M fixed, K deferred)."
If the file doesn't exist, skip silently (triage wasn't run this session).

**Show to user:** Health score dashboard (7c), velocity summary (7a), and
ecosystem health triage results (if any). Summarize other output only if errors
occurred. If health score degraded since last check, note in session summary
(Step 2).

> **Note:** Learning consolidation runs automatically during SessionStart when
> threshold is reached (10+ reviews). No action needed here.

> **v1/v2 Note (INTG-06):** Review sync (7b) uses the v1 script which bridges
> legacy markdown reviews to JSONL. The v2 pipeline writes JSONL directly.
> Fallback: `npm run reviews:sync:v1`.

**Progress: Metrics & data pipeline complete (3/4 phases).**

---

## Phase 4: Cleanup & Closure (Steps 8-10) — MUST

### Step 8. Clean Up State Files (MUST)

```bash
# Remove ephemeral session tracking files
rm -f .claude/hooks/.session-agents.json
rm -f .claude/hooks/.agent-trigger-state.json
rm -f .claude/state/pending-reviews.json

# Only remove handoff if no tasks are still in progress
if ! grep -q '"status": "in_progress"' .claude/state/task-*.state.json 2>/dev/null; then
  echo "No in-progress tasks found. Cleaning up handoff file."
  rm -f .claude/state/handoff.json
else
  echo "In-progress tasks found. Preserving handoff.json for session recovery."
fi
```

### Step 9. Pre-Commit Review (MUST)

Before committing, present a summary to the user:

1. Run `git status` — show all files that will be committed
2. **Dirty tree check:** If files outside session-end's expected output are
   staged, warn the user before proceeding
3. List scripts that succeeded/failed from Step 7
4. Ask: **"Ready to commit and push? [Y/n]"**

Expected session-end output files: SESSION_CONTEXT.md, SESSION_HISTORY.md,
ROADMAP.md, velocity-log.jsonl, reviews.jsonl, ecosystem-health-log.jsonl,
MASTER_DEBT.jsonl, metrics.json, METRICS.md.

### Step 10. Final Commit & Push (MUST — unless --no-push)

```bash
npm run session:end
```

If `--no-push` was specified, skip this step. All prior steps still run —
context is preserved locally without pushing.

**Progress: Cleanup & closure complete (4/4 phases).**

---

## Done When

Session-end is complete when ALL of the following are true:

- [ ] SESSION_CONTEXT.md updated (all 3 sections: summary, status, next goals)
- [ ] All metrics scripts ran (or failures noted)
- [ ] Pre-commit summary shown to user
- [ ] Final commit pushed (or `--no-push` acknowledged)
- [ ] Health score and velocity summary shown to user

## Artifact Manifest

| File                                    | Read/Write | Step | Purpose                             |
| --------------------------------------- | ---------- | ---- | ----------------------------------- |
| SESSION_CONTEXT.md                      | R/W        | 2    | Session summary, status, goals      |
| SESSION_HISTORY.md                      | W          | 2    | Archived session summaries          |
| ROADMAP.md                              | R/W        | 3    | Feature completion status           |
| .session-agents.json                    | R/D        | 4, 8 | Agent compliance check, then delete |
| .agent-trigger-state.json               | R/D        | 4, 8 | Agent trigger check, then delete    |
| pending-reviews.json                    | R/D        | 4, 8 | Review queue check, then delete     |
| velocity-log.jsonl                      | W          | 7a   | Velocity metrics                    |
| reviews.jsonl                           | W          | 7b   | Review sync                         |
| ecosystem-health-log.jsonl              | W          | 7c   | Health score trend                  |
| task-ecosystem-health-triage.state.json | R          | 7c   | Triage results (if exists)          |
| MASTER_DEBT.jsonl                       | W          | 7d   | Consolidated debt                   |
| metrics.json                            | W          | 7e   | Machine-readable metrics            |
| METRICS.md                              | W          | 7e   | Human-readable metrics              |

---

## Script Failure Handling

If any script fails during execution:

1. Note the error message and which script failed
2. Continue with remaining steps — do not stop the pipeline
3. Include the failure in the pre-commit summary (Step 9)
4. If a MUST script fails (7b-7e), warn that metrics may be stale

---

## Integration

- **Neighbors:** `session-begin` (reads what session-end writes), `checkpoint`
  (mid-session alternative)
- **Input:** Conversation context, SESSION_CONTEXT.md, state files
- **Output:** Updated SESSION_CONTEXT.md, metrics files, final commit
- **Handoff:** `session-begin` will verify SESSION_CONTEXT.md freshness, review
  sync status, and session gaps. Get these right.

**session-begin will verify:**

1. SESSION_CONTEXT.md "Last Updated" is current
2. Review sync (reviews.jsonl matches markdown log)
3. Session gaps (undocumented sessions between commits)
4. ROADMAP hygiene (completed items marked)

---

## Learning Loop (MUST — after Step 10)

**Auto-learnings** (MUST): Generate 2-3 data-driven insights from the session
closure (steps skipped, steps that failed, duration patterns). Save to
auto-memory (`memory/session-end-learnings.md`).

**Optional user feedback** (SHOULD): "Any steps to add, remove, or reorder?"
Accept empty / "none" to proceed. If provided, persist to auto-memory.

**On next startup** (MUST): Surface previous auto-learnings and user feedback so
future invocations benefit from accumulated experience.

---

## Version History

| Version | Date       | Description                                         |
| ------- | ---------- | --------------------------------------------------- |
| 2.0     | 2026-03-07 | Full rewrite from skill-audit: 32 decisions applied |
| 1.1     | 2026-03-01 | Add health score snapshot step (INTG-02)            |
| 1.0     | 2026-02-25 | Initial implementation                              |
