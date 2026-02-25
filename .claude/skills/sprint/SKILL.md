---
name: sprint
description: >-
  TDMS Sprint workflow automation. Dashboard, team-based parallel execution,
  intake, doc sync, and sprint lifecycle management for the GRAND PLAN technical
  debt elimination. Invoke with /sprint [subcommand].
---

# Sprint Workflow Skill

<!-- prettier-ignore-start -->
**Document Version:** 1.1
**Last Updated:** 2026-02-24
**Status:** ACTIVE
<!-- prettier-ignore-end -->

## When to Use

- User explicitly invokes `/sprint`

## When NOT to Use

- When a more specialized skill exists for the specific task

## Constants

```
MAX_FIXERS: 4        STATE_FILE: .claude/state/active-sprint.json
DEFAULT_BATCH: 5     MANIFEST: docs/technical-debt/logs/grand-plan-manifest.json
SPRINT_ORDER: [4,5,6,7,8a,8b,8c,8d,9a,9b,10,11a,11b,11c,12a,12b]
MASTER: docs/technical-debt/MASTER_DEBT.jsonl
```

## Subcommand Routing

| Input                   | Phase     |
| ----------------------- | --------- |
| (no args)               | Dashboard |
| `start <N>`             | Start     |
| `work [--batch N]`      | Work      |
| `resolve <DEBT-IDs...>` | Resolve   |
| `complete`              | Complete  |
| `fix-docs`              | Fix-Docs  |
| `intake`                | Intake    |

---

## Phase 0 -- Always Run First

1. `node scripts/debt/sprint-status.js --json` -> parse `dashboardData`
2. If `dedupedSynced === false`: `node scripts/debt/sync-deduped.js --apply`
3. Store unplaced item count (do NOT auto-place)
4. Display dashboard: Active Sprint, Items, Progress bar, Severity breakdown,
   Pipeline Health (MASTER<->deduped sync, metrics freshness, ROADMAP S0 table,
   views), Unplaced Items, Stale Docs
5. Route to subcommand or present action menu via AskUserQuestion

---

## Phase: Start

**Args:** sprint number (e.g., "4")

1. Validate `docs/technical-debt/logs/sprint-{N}-ids.json` exists
2. Read manifest, check status not COMPLETE
3. Write `.claude/state/active-sprint.json`
4. File-existence check for each sprint item
5. Present sprint briefing: totals, severity, missing-file items (offer
   FALSE_POSITIVE), top 5 priority, unplaced items matching focus dirs

**Missing files:** If approved, resolve each:
`node scripts/debt/resolve-item.js DEBT-XXXX --false-positive`

---

## Phase: Work

**Args:** `--batch N` (default: 5). Requires active-sprint.json.

### Wave Loop

1. `node scripts/debt/sprint-wave.js <sprint-id> --batch <N> --json`
2. Present wave plan by category, confirm with AskUserQuestion
3. `TeamCreate("sprint-{N}-workers")`
4. Spawn fixer agents per category (max 4 parallel). Each fixer:
   - Reads files, implements fixes following CLAUDE.md patterns
   - Returns ONLY: `FIXED: {ID} -- description` or `SKIPPED: {ID} -- reason`
5. Collect results from all fixers
6. Spawn verifier: `npm test && npm run lint && npm run patterns:check` Returns:
   `PASS` or `FAIL (details)`
7. If FAIL: present options (fix manually, revert, continue)
8. Spawn doc-updater: resolve items, sync deduped, generate views/metrics,
   update ROADMAP.md (S0 table, Grand Plan metrics) and SESSION_CONTEXT.md
9. Present wave results, ask to continue
10. On "No": `TeamDelete()`, show session stats

**Dependencies:** Fixers are independent (distinct categories). Verifier depends
on all fixers. Doc-updater depends on verifier passing.

---

## Phase: Resolve

**Args:** DEBT-XXXX IDs

1. `node scripts/debt/resolve-item.js {ID}` for each (auto-syncs deduped)
2. `node scripts/debt/generate-metrics.js`
3. Present progress

---

## Phase: Complete

Requires active-sprint.json.

1. `node scripts/debt/sprint-status.js --json` -- compute stats
2. Assess readiness (0 remaining = done, <=5 = nearly done, >5 = ask)
3. Launch 3 parallel agents:
   - **Archive:** `node scripts/debt/sprint-complete.js {id}`, update/clear
     active-sprint.json
   - **Docs:** sync deduped, views, metrics, update ROADMAP + SESSION_CONTEXT
   - **Report:** summarize sprint report, append to SESSION_CONTEXT
4. Present results with next sprint info

---

## Phase: Fix-Docs

4 parallel agents for standalone doc repair:

1. **Pipeline:** sync-deduped, generate-views, generate-metrics
2. **ROADMAP:** rebuild S0 table, Grand Plan metrics, Milestones progress
3. **SESSION_CONTEXT:** update Quick Status, Next Goals, TDMS numbers
4. **GRAND_PLAN:** `node scripts/debt/generate-grand-plan.js`, verify manifest

---

## Phase: Intake

1. `node scripts/debt/sprint-intake.js --json`
2. Present auto-placements and manual items, confirm via AskUserQuestion
3. For manual items, ask placement per item
4. `node scripts/debt/sprint-intake.js --apply`

---

## Error Recovery

| Error                      | Action                                    |
| -------------------------- | ----------------------------------------- |
| sprint-status.js fails     | Show raw error, suggest manual inspection |
| Fixer can't fix an item    | Mark SKIPPED, continue wave               |
| Verifier fails             | Ask: fix manually, revert, or skip        |
| Doc-updater fails          | Retry once, then flag for manual          |
| sync-deduped.js fails      | Warn but continue (non-blocking)          |
| active-sprint.json missing | Prompt `/sprint start N`                  |
| Sprint manifest not found  | Error with available sprints list         |

---

## Version History

| Version | Date       | Change                                     |
| ------- | ---------- | ------------------------------------------ |
| 1.1     | 2026-02-24 | Trim to <500 lines: condense agent prompts |
| 1.0     | 2026-02-21 | Initial skill                              |
