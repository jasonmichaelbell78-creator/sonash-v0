---
name: sprint
description: >-
  TDMS Sprint workflow automation. Dashboard, team-based parallel execution,
  intake, doc sync, and sprint lifecycle management for the GRAND PLAN technical
  debt elimination. Invoke with /sprint [subcommand].
---

# Sprint Workflow Skill

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-21
**Status:** ACTIVE
<!-- prettier-ignore-end -->

## Constants

```
MAX_FIXERS: 4
DEFAULT_BATCH: 5
SPRINT_ORDER: [4,5,6,7,8a,8b,8c,8d,9a,9b,10,11a,11b,11c,12a,12b]
STATE_FILE: .claude/state/active-sprint.json
MANIFEST: docs/technical-debt/logs/grand-plan-manifest.json
MASTER: docs/technical-debt/MASTER_DEBT.jsonl
```

## Subcommand Routing

Parse the ARGUMENTS string to determine which phase to execute:

| Input                   | Phase     |
| ----------------------- | --------- |
| (no args or empty)      | Dashboard |
| `start <N>`             | Start     |
| `work [--batch N]`      | Work      |
| `resolve <DEBT-IDs...>` | Resolve   |
| `complete`              | Complete  |
| `fix-docs`              | Fix-Docs  |
| `intake`                | Intake    |

---

## Phase 0 — Always Run First (All Subcommands)

**Every invocation starts here before routing to the requested subcommand.**

### Step 1: Gather State

Run the dashboard data gatherer:

```bash
node scripts/debt/sprint-status.js --json
```

Parse the JSON output into `dashboardData`.

### Step 2: Auto-Fix Sync Drift

If `dashboardData.pipeline.dedupedSynced === false`:

```bash
node scripts/debt/sync-deduped.js --apply
```

Note in output: "Auto-synced deduped.jsonl"

### Step 3: Detect New Items

If `dashboardData.unplacedItems.count > 0`, store the count for dashboard
display. Do NOT auto-place — the user decides via `/sprint intake`.

### Step 4: Present Dashboard

Format `dashboardData` as a text dashboard:

```
Sprint Dashboard
  Active Sprint: {id} — {focus}
  Items: {total} total | {resolved} resolved | {remaining} remaining
  Progress: {progressBar} {percent}%
  Severity (remaining): S0: {n} | S1: {n} | S2: {n} | S3: {n}

  Pipeline Health:
    {icon} MASTER <-> deduped: {synced|drifted}
    {icon} metrics.json: {current|Nh stale}
    {icon} ROADMAP S0 table: {current|shows X, actual Y}
    {icon} views: {current|stale}

  {if unplaced > 0}
  New Unplaced Items: {count}
  {endif}

  {if any stale}
  Stale Docs Detected — run /sprint fix-docs to repair
  {endif}
```

### Step 5: Route to Subcommand

If no subcommand was provided, present an action menu using AskUserQuestion:

```
What would you like to do?
  1. Work on next items (/sprint work)
  2. Review N unplaced items (/sprint intake)
  3. Fix stale docs (/sprint fix-docs)
  4. Complete sprint (/sprint complete)
  5. Start a different sprint (/sprint start N)
```

If a subcommand was provided, proceed directly to that phase.

---

## Phase: Start

**ARGUMENTS:** sprint number (required, e.g., "4" or "sprint-4")

### Steps

1. Validate `docs/technical-debt/logs/sprint-{N}-ids.json` exists
2. Read manifest, check status is not COMPLETE
3. Write `.claude/state/active-sprint.json`:
   ```json
   { "sprint": "sprint-N", "startedAt": "<ISO>", "startedSession": <N> }
   ```
4. Run file-existence check: for each item in the sprint, verify `item.file`
   exists in the codebase using Glob or Bash `test -f`
5. Collect missing-file items
6. Present sprint briefing:
   - Total / resolved / remaining / severity breakdown
   - Missing-file items (ask: "Mark N items as FALSE_POSITIVE?")
   - Top 5 priority items (S0 first, then S1)
7. If unplaced items match this sprint's focus dirs, offer to place them
8. End with: "Ready to work? Run `/sprint work`"

### Missing File Handling

If user approves FALSE_POSITIVE for missing-file items:

```bash
# For each missing-file item:
node scripts/debt/resolve-item.js DEBT-XXXX --false-positive
node scripts/debt/resolve-item.js DEBT-YYYY --false-positive
# ... (resolve-item.js auto-syncs deduped after each resolve)
```

---

## Phase: Work

**ARGUMENTS:** `--batch N` (default: 5 items per fixer per wave)

**REQUIRES:** `.claude/state/active-sprint.json` exists. If not, prompt user to
run `/sprint start N` first.

### Step 1: Compute Wave

```bash
node scripts/debt/sprint-wave.js <sprint-id> --batch <N> --json
```

Parse the wave assignments.

### Step 2: Present Wave Plan

Show the user what will be worked on:

```
Wave 1: {totalWaveItems} items across {numFixers} fixers

  security ({count} items):
    DEBT-XXXX [S0] Title — file:line
    ...

  codequality ({count} items):
    DEBT-XXXX [S1] Title — file:line
    ...

  performance ({count} items):
    DEBT-XXXX [S1] Title — file:line
    ...

Proceed with this wave?
```

Use AskUserQuestion to confirm.

### Step 3: Spawn Team

```
TeamCreate("sprint-{N}-workers")
```

### Step 4: Spawn Fixer Agents

For each non-empty category in the wave assignments, spawn a Task agent:

```
Task(
  subagent_type = "general-purpose",
  team_name = "sprint-{N}-workers",
  name = "fixer-{category}",
  mode = "bypassPermissions",
  prompt = "<fixer prompt below>"
)
```

**Fixer prompt template:**

```
You are fixing technical debt items in the {category} category for sprint {N}.

Items to fix (resolve each one by editing the code):

{for each item}
## {item.id} [{item.severity}] — {item.title}
- File: {item.file}:{item.line}
- Description: {item.description}
- Category: {item.category}
{endfor}

Instructions:
1. Read each file and understand the issue
2. Implement the fix following project patterns (CLAUDE.md Section 4-5)
3. Do NOT run tests — the verifier handles that
4. Do NOT resolve items in MASTER_DEBT — the doc-updater handles that
5. For each item, report your result as:
   - FIXED: {ID} — brief description of what you changed
   - SKIPPED: {ID} — reason (file not found, too complex, needs design decision)

Report all results at the end.
```

Launch all fixers in parallel (multiple Task calls in one message).

### Step 5: Wait for Fixers

All fixer agents complete and report results. Collect FIXED and SKIPPED lists.

### Step 6: Spawn Verifier

```
Task(
  subagent_type = "general-purpose",
  team_name = "sprint-{N}-workers",
  name = "verifier",
  mode = "bypassPermissions",
  prompt = "Run these commands and report results:
    npm test
    npm run lint
    npm run patterns:check

    Report: PASS (all clear) or FAIL (with details of what failed and which
    files are involved)."
)
```

### Step 7: Handle Verifier Result

**If PASS:** proceed to Step 8.

**If FAIL:** present to user:

```
Tests/lint failed after wave {N}. Failures:
  {failure details}

Options:
  1. Review and fix manually
  2. Revert wave changes (git checkout on affected files)
  3. Continue anyway (skip doc-update for failed items)
```

Use AskUserQuestion. If revert: `git checkout -- {files}`. Remove reverted items
from the FIXED list.

### Step 8: Spawn Doc-Updater

```
Task(
  subagent_type = "general-purpose",
  team_name = "sprint-{N}-workers",
  name = "doc-updater",
  mode = "bypassPermissions",
  prompt = "Update the TDMS pipeline after wave completion.

    Items resolved this wave (mark each as RESOLVED in MASTER):
    {list of FIXED DEBT IDs}

    Steps:
    1. For each resolved item:
       node scripts/debt/resolve-item.js {ID}
    2. node scripts/debt/sync-deduped.js --apply
    3. node scripts/debt/generate-views.js
    4. node scripts/debt/generate-metrics.js
    5. Read MASTER_DEBT.jsonl and count S0 VERIFIED items
    6. Update ROADMAP.md:
       - Rebuild 'S0 Critical Debt (Immediate Action)' table from live S0 data
       - Update Grand Plan metrics table (Total items, Resolved, S0, S1)
       - Update Milestones Overview row for GRAND PLAN progress %
    7. Update SESSION_CONTEXT.md:
       - Update TDMS line in Quick Status table
       - Update GRAND PLAN progress line

    Report what was updated and final TDMS stats."
)
```

### Step 9: Present Wave Results

```
Wave {N} complete:
  Fixed: {fixed}/{total} | Skipped: {skipped} | Tests: {PASS/FAIL}
  Sprint {id} progress: {resolved}/{total} ({percent}%)

  {if skipped items}
  Skipped items:
    DEBT-XXXX: {reason}
    ...
  {endif}

Continue with next wave?
```

Use AskUserQuestion: Yes / No / Pick specific items.

### Step 10: Loop or Shutdown

**On "Yes":** go back to Step 1 (compute next wave).

**On "No":**

```
SendMessage(type="shutdown_request") to all teammates
```

Wait for shutdown confirmations, then:

```
TeamDelete()
```

Present final session stats:

```
Sprint {id} session summary:
  Waves completed: {N}
  Items fixed: {total fixed}
  Items skipped: {total skipped}
  Sprint progress: {resolved}/{total} ({percent}%)
  Time elapsed: ~{duration}
```

---

## Phase: Resolve

**ARGUMENTS:** one or more DEBT-XXXX IDs

For manual resolution outside of team work:

1. For each ID:
   ```bash
   node scripts/debt/resolve-item.js {ID}
   ```
2. Sync is automatic (resolve-item.js calls sync-deduped.js)
3. Regenerate metrics:
   ```bash
   node scripts/debt/generate-metrics.js
   ```
4. Present: "{N} items resolved. Sprint progress: X/Y (Z%)"

---

## Phase: Complete

**REQUIRES:** `.claude/state/active-sprint.json` exists.

### Step 1: Compute Stats

```bash
node scripts/debt/sprint-status.js --json
```

Extract active sprint resolved/remaining counts.

### Step 2: Assess Readiness

- If remaining == 0: "Sprint fully complete!"
- If remaining <= 5: "Nearly done — {N} items remaining. Carry forward or
  resolve now?"
- If remaining > 5: "Sprint has {N} items remaining ({percent}% complete).
  Continue working, force complete, or cancel?"

Use AskUserQuestion.

### Step 3: Execute Completion (3 Parallel Agents)

**Agent 1: Archive Sprint**

```
Task(subagent_type="general-purpose", mode="bypassPermissions"):
  "Archive the sprint:
   node scripts/debt/sprint-complete.js {sprint-id} {--force if needed} {--carry-to next}

   Then clear or update .claude/state/active-sprint.json:
   - If next sprint exists: set it as new active sprint
   - If no more sprints: delete the file"
```

**Agent 2: Update All Docs**

```
Task(subagent_type="general-purpose", mode="bypassPermissions"):
  "Run full document sync:
   1. node scripts/debt/sync-deduped.js --apply
   2. node scripts/debt/generate-views.js
   3. node scripts/debt/generate-metrics.js
   4. Update ROADMAP.md: S0 table, Grand Plan metrics, Milestones progress
   5. Update SESSION_CONTEXT.md: Quick Status, Grand Plan progress, Next Goals"
```

**Agent 3: Generate Sprint Report**

```
Task(subagent_type="general-purpose", mode="bypassPermissions"):
  "Read docs/technical-debt/logs/sprint-{N}-report.md (just generated by
   sprint-complete.js). Summarize key findings:
   - Total resolved, false positives, carried forward
   - Top categories of fixed items
   - Append a 3-line summary to SESSION_CONTEXT.md session summary section"
```

Launch all 3 in parallel. Wait for completion.

### Step 4: Present Results

```
Sprint {id} complete!
  Resolved: {N} | False Positive: {N} | Carried Forward: {N} -> {next}
  Report: docs/technical-debt/logs/sprint-{id}-report.md

  Next sprint: {next-id} ({focus}, {items} items)
  Start it? -> /sprint start {next-N}
```

---

## Phase: Fix-Docs

Standalone document repair. Spawn 4 parallel Task agents:

**Agent 1: Pipeline Sync**

```
Task(subagent_type="general-purpose", mode="bypassPermissions"):
  "Sync and regenerate the TDMS pipeline:
   1. node scripts/debt/sync-deduped.js --apply
   2. node scripts/debt/generate-views.js
   3. node scripts/debt/generate-metrics.js
   Report final stats from metrics output."
```

**Agent 2: ROADMAP Update**

```
Task(subagent_type="general-purpose", mode="bypassPermissions"):
  "Update ROADMAP.md with current TDMS data:
   1. Read MASTER_DEBT.jsonl — count S0 VERIFIED items, total resolved, etc.
   2. Rebuild 'S0 Critical Debt (Immediate Action)' table:
      - Only include items with severity=S0 AND status=VERIFIED
      - Columns: ID, Title, File, Category, Effort
   3. Update Grand Plan metrics table:
      - Total items, Resolved count + %, S0, S1 counts
   4. Update Milestones Overview row:
      - Progress = resolved/total as percentage
   5. Update old tech debt severity table if present (S0/S1/S2/S3 counts)"
```

**Agent 3: SESSION_CONTEXT Update**

```
Task(subagent_type="general-purpose", mode="bypassPermissions"):
  "Update SESSION_CONTEXT.md with current TDMS data:
   1. Read MASTER_DEBT.jsonl for live counts
   2. Update Quick Status table — GRAND PLAN row progress
   3. Update Next Session Goals — S0/S1 item counts
   4. Ensure TDMS numbers match current reality"
```

**Agent 4: GRAND_PLAN_V2 Regenerate**

```
Task(subagent_type="general-purpose", mode="bypassPermissions"):
  "Regenerate the Grand Plan document:
   node scripts/debt/generate-grand-plan.js

   Verify sprint statuses in manifest match reality:
   - If all items in a sprint are RESOLVED, status should be COMPLETE
   - Update grand-plan-manifest.json if needed"
```

Launch all 4 in parallel. Present summary when done.

---

## Phase: Intake

Interactive placement of unplaced items.

### Step 1: Get Placement Plan

```bash
node scripts/debt/sprint-intake.js --json
```

### Step 2: Present Plan

```
{count} new items to place:

  Auto-placement:
    sprint-{N} ({focus}): {count} items
      DEBT-XXXX [S1] Title — file
      ...

  Manual placement needed: {count} items
    DEBT-XXXX [S2] No file reference
    ...

Approve auto-placements?
```

Use AskUserQuestion: Approve / Edit / Skip.

### Step 3: Handle Manual Items

For items needing manual placement, use AskUserQuestion:

```
Where should DEBT-XXXX go?
  "{item.title}" — {item.description}
  Options: sprint-4, sprint-5, sprint-6, sprint-7, sprint-8a, Other
```

### Step 4: Apply

```bash
node scripts/debt/sprint-intake.js --apply
```

Present: "{N} items placed. Sprint {active} now has {total} items."

---

## Error Recovery

| Error                      | Action                                    |
| -------------------------- | ----------------------------------------- |
| sprint-status.js fails     | Show raw error, suggest manual inspection |
| Fixer can't fix an item    | Mark as SKIPPED, continue wave            |
| Verifier fails             | Ask user: fix manually, revert, or skip   |
| Doc-updater fails          | Retry once, then flag for manual          |
| sync-deduped.js fails      | Warn but continue (non-blocking)          |
| active-sprint.json missing | Prompt user to /sprint start N            |
| Sprint manifest not found  | Error with list of available sprints      |

---

## Version History

| Version | Date       | Change        |
| ------- | ---------- | ------------- |
| 1.0     | 2026-02-21 | Initial skill |
