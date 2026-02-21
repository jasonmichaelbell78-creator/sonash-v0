# Sprint Workflow Skill Design

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-21
**Status:** APPROVED
**Session:** #179
<!-- prettier-ignore-end -->

## Purpose

Build a `/sprint` skill that automates the GRAND PLAN technical debt elimination
workflow. Provides dashboard, team-based parallel execution, new item intake,
document sync, and full sprint lifecycle management.

## Problem Statement

The TDMS sprint workflow is ~60% built. Missing pieces:

- No sprint lifecycle commands (start/status/complete)
- No automated intake of new items into sprints
- Pipeline sync is fragile (deduped.jsonl ↔ MASTER_DEBT.jsonl drift)
- Docs go stale after changes (ROADMAP, SESSION_CONTEXT, metrics, views)
- No team-based parallel execution for working through sprint items
- No runbook documentation

## Architecture: Single Skill with Subcommands

**Skill location:** `.claude/skills/sprint/SKILL.md`

### Subcommands

| Command                      | Purpose                                      | Agents     |
| ---------------------------- | -------------------------------------------- | ---------- |
| `/sprint` (no args)          | Dashboard + action menu                      | None       |
| `/sprint start <N>`          | Initialize sprint, validate, brief           | None       |
| `/sprint work [--batch N]`   | Spawn team, resolve items in parallel waves  | Full team  |
| `/sprint resolve <DEBT-IDs>` | Mark items resolved manually                 | None       |
| `/sprint complete`           | Validate, archive, carry forward, update all | 3 parallel |
| `/sprint fix-docs`           | Regenerate all views/metrics/docs            | 4 parallel |
| `/sprint intake`             | Place new unplaced items into sprints        | None       |

### Phase 0 — Always Run

Every invocation starts with automatic state read:

1. Run `sprint-status.js --json` for dashboard data
2. Auto-sync deduped.jsonl if drifted
3. Detect unplaced items
4. Present dashboard
5. Route to subcommand

### Dashboard Format

```
Sprint Dashboard
  Active Sprint: 4 — lib/ + hooks/ + app/
  Items: 132 total | 12 resolved | 120 remaining
  Progress: 9%
  Severity: S0: 2 | S1: 42 | S2: 70 | S3: 6
  Pipeline: synced/stale indicators
  Unplaced: N new items
  Actions: work / intake / fix-docs / complete
```

## Team Model — Full Team with Specialists

For `/sprint work`, spawn a persistent team:

```
Team: sprint-{N}-workers
  fixer-security      (security + process items)
  fixer-codequality   (code-quality + refactoring items)
  fixer-performance   (performance items)
  verifier            (tests + lint after each wave)
  doc-updater         (resolve, sync, regenerate, update docs)
```

### Rules

- Max 4 fixers (skip empty categories)
- Wave-based: each fixer gets 3-5 items per wave
- S0/S1 items assigned first (priority ordering)
- Verifier runs after all fixers complete
- Doc-updater runs after verifier passes
- User approves each wave before it starts

### Wave Flow

```
Present wave plan → user approves → fixers work in parallel →
verifier checks → doc-updater syncs → present results →
ask continue/stop → next wave or shutdown team
```

### Error Handling

- Verifier fails: ask user to review, revert, or continue
- Fixer can't fix item: stays VERIFIED, noted in report
- Doc-updater fails: retry once, then flag for manual

## Intake System

### Two intake paths

1. **SonarCloud sync** — `sync-sonarcloud.js` pulls new issues, gets DEBT IDs
2. **Manual/PR-deferred** — `/add-debt` or `intake-pr-deferred.js`

### Placement logic

Match `item.file` prefix against sprint focus directories:

| Path prefix                | Sprint   | Overflow     |
| -------------------------- | -------- | ------------ |
| `scripts/`                 | sprint-1 | sprint-8a    |
| `components/`              | sprint-2 | sprint-8b    |
| `docs/` + `.claude/`       | sprint-3 | sprint-8c    |
| `lib/` + `hooks/` + `app/` | sprint-4 | (current)    |
| `.github/` + `.husky/`     | sprint-5 | (current)    |
| `functions/`               | sprint-6 | (current)    |
| `tests/`                   | sprint-7 | (current)    |
| No file ref                | manual   | user decides |

Completed sprints overflow to next matching sprint.

### Severity mapping fix

SonarCloud BLOCKER for cognitive complexity must map to S1 (not S0).

## Document Sync — `/sprint fix-docs`

4 parallel agents, each writing to different files:

1. **Pipeline Sync** — sync-deduped + generate-views + generate-metrics
2. **ROADMAP Update** — S0 table, Grand Plan metrics, Milestones Overview
3. **SESSION_CONTEXT Update** — Quick Status, Next Session Goals
4. **GRAND_PLAN_V2 Regenerate** — generate-grand-plan.js + manifest statuses

### deduped.jsonl Sync Fix

Smart sync via `sync-deduped.js`: for items in both files (matched by
content_hash), copy severity/status from MASTER to deduped. Does not add/remove
items from either file.

`generate-views.js` gets a safety guard: if MASTER is newer than deduped, auto-
sync before reading.

## Sprint Lifecycle

### `/sprint start <N>`

Validate manifest, set active-sprint.json, run file-existence check, present
briefing with top priority items.

### `/sprint complete`

Compute completion stats. If items remain: offer carry-forward to next sprint. 3
parallel agents: archive sprint, update all docs, generate sprint report.

### State tracking

`.claude/state/active-sprint.json`:

```json
{ "sprint": "sprint-4", "startedAt": "ISO", "startedSession": 179 }
```

### Sprint execution order

```
4 → 5 → 6 → 7 → 8a → 8b → 8c → 8d → 9a → 9b → 10 →
11a → 11b → 11c → 12a → 12b
```

## New Scripts

| Script                            | Purpose                       | I/O                  |
| --------------------------------- | ----------------------------- | -------------------- |
| `scripts/debt/sprint-status.js`   | Dashboard data gatherer       | Read-only → JSON     |
| `scripts/debt/sprint-intake.js`   | Place unplaced items          | Read/write manifests |
| `scripts/debt/sprint-complete.js` | Archive sprint, carry forward | Read/write manifests |
| `scripts/debt/sprint-wave.js`     | Compute wave assignments      | Read-only → JSON     |
| `scripts/debt/sync-deduped.js`    | Smart MASTER → deduped sync   | Read/write deduped   |

## Modified Scripts

| Script                            | Change                                     |
| --------------------------------- | ------------------------------------------ |
| `scripts/debt/sync-sonarcloud.js` | Cognitive complexity BLOCKER → S1          |
| `scripts/debt/generate-views.js`  | Sync safety guard (already has source fix) |
| `scripts/debt/resolve-item.js`    | Call sync-deduped.js after resolve         |

## npm Scripts

```json
{
  "sprint:status": "node scripts/debt/sprint-status.js",
  "sprint:intake": "node scripts/debt/sprint-intake.js",
  "sprint:complete": "node scripts/debt/sprint-complete.js",
  "sprint:wave": "node scripts/debt/sprint-wave.js",
  "sprint:sync": "node scripts/debt/sync-deduped.js --apply"
}
```

## Docs Updated by Skill

- `ROADMAP.md` — S0 table, Grand Plan metrics, Milestones Overview
- `SESSION_CONTEXT.md` — Quick Status, Next Session Goals
- `docs/technical-debt/GRAND_PLAN_V2.md` — sprint statuses, metrics
- `docs/technical-debt/views/*` — generated by generate-views.js
- `docs/technical-debt/metrics.json` + `METRICS.md` — generated
- `docs/technical-debt/logs/grand-plan-manifest.json` — sprint statuses
- `docs/technical-debt/logs/sprint-N-report.md` — generated on complete
- `.claude/state/active-sprint.json` — runtime state

## Version History

| Version | Date       | Change         |
| ------- | ---------- | -------------- |
| 1.0     | 2026-02-21 | Initial design |
