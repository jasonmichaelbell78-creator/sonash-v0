# Hook & Session State Files Schema

<!-- prettier-ignore-start -->
**Document Version:** 1.2
**Last Updated:** 2026-02-26
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Source:** OPT-H006 (AI Optimization Audit)

---

## Overview

Hooks and skills create state files in two locations:

| Location           | Purpose                             | Survives Compaction | Git-tracked              |
| ------------------ | ----------------------------------- | ------------------- | ------------------------ |
| `.claude/hooks/.*` | Ephemeral session state (dot-files) | No                  | No (gitignored)          |
| `.claude/state/*`  | Persistent session-surviving data   | Yes                 | Partial (see .gitignore) |

---

## Ephemeral State (`.claude/hooks/`)

These files track in-session state and are reset each session.

### `.session-state.json`

**Writers:** `session-start.js` **Readers:** `pre-compaction-save.js`,
`track-agent-invocation.js`, `alerts/run-alerts.js`

```json
{
  "sessionId": "string (ISO timestamp of session start)",
  "startedAt": "string (ISO timestamp)"
}
```

### `.context-tracking-state.json`

**Writers:** `post-read-handler.js` (Phase 1) **Readers:**
`post-read-handler.js` (Phase 1 + Phase 2), `pre-compaction-save.js`,
`user-prompt-handler.js`

```json
{
  "filesRead": ["string (relative file paths)"],
  "lastReset": "number (epoch ms)",
  "warningShown": "boolean"
}
```

Auto-resets after 30 minutes of inactivity (new session heuristic).

### `.auto-save-state.json`

**Writers:** `post-read-handler.js` (Phase 2) **Readers:**
`post-read-handler.js` (Phase 2, self)

```json
{
  "lastSave": "number (epoch ms)",
  "saveCount": "number"
}
```

### `.commit-tracker-state.json`

**Writers:** `commit-tracker.js` **Readers:** `commit-tracker.js` (self)

```json
{
  "lastHead": "string (git SHA)",
  "updatedAt": "string (ISO timestamp)"
}
```

### `.handoff-state.json` (DEPRECATED)

> **Note:** The hook `compaction-handoff.js` that wrote/read this file no longer
> exists. Compaction state is now handled by `pre-compaction-save.js` and
> `compact-restore.js`.

### `.agent-trigger-state.json` (DEPRECATED)

> **Note:** The hook `agent-trigger-enforcer.js` that wrote/read this file no
> longer exists. Agent tracking is now handled by `track-agent-invocation.js`.

---

## Persistent State (`.claude/state/`)

These files survive compaction and span sessions.

### `handoff.json` (gitignored)

**Writers:** `pre-compaction-save.js` **Readers:** `compact-restore.js`,
`state-utils.js`

```json
{
  "version": 2,
  "timestamp": "string (ISO timestamp)",
  "session": "number (session counter)",
  "git": { "branch": "string", "head": "string" },
  "tasks": ["string (active todo items)"],
  "filesRead": ["string (files read before compaction)"],
  "recentCommits": [{ "hash": "string", "message": "string" }],
  "context": "string (summary of work in progress)"
}
```

### `commit-log.jsonl` (gitignored)

**Writers:** `commit-tracker.js` **Readers:** `pre-compaction-save.js`,
`session-begin` skill, `alerts/run-alerts.js`

```jsonl
{"timestamp":"ISO","hash":"SHA","shortHash":"7-char","message":"string","author":"string","authorDate":"ISO","branch":"string","filesChanged":0,"filesList":["string"],"session":null|number}
```

**Retention:** Append-only with rotation. `commit-tracker.js` rotates at 500
entries, keeping the most recent 300.

### `pending-reviews.json` (gitignored, DEPRECATED)

> **Note:** Created by `session-end` skill cleanup and referenced by
> `pre-compaction-save.js`, `post-write-validator.js`, `state-utils.js`. The
> original writer (`agent-trigger-enforcer.js`) no longer exists. File is
> ephemeral — deleted at session end.

### `agent-invocations.jsonl`

**Writers:** `track-agent-invocation.js` **Readers:** `alerts/run-alerts.js`

```jsonl
{"timestamp":"ISO","agent":"string","prompt":"string (first 100 chars)","session":null|number}
```

### `alerts-baseline.json`

**Writers:** `alerts/run-alerts.js` **Readers:** `alerts/run-alerts.js` (self)

Stores previous alert run results for delta computation.

### `consolidation.json`

**Writers:** `run-consolidation.js` **Readers:** `run-consolidation.js`,
`check-triggers.js`, `session-start.js`

Tracks consolidation status (last consolidated review, number, and date).

### `reviews.jsonl`

**Writers:** `sync-reviews-to-jsonl.js` **Readers:** `run-consolidation.js`,
`promote-patterns.js`, `session-start.js`, `alerts/run-alerts.js`

Append-only log of PR reviews and retrospectives. Two entry types:

- **Review entries:** `id` (number), `date`, `title`, `source`, `pr`,
  `patterns`, `fixed`, `deferred`, `rejected`, `critical`, `major`, `minor`,
  `trivial`, `total`, `learnings`, `sourceBreakdown`
- **Retrospective entries:** `id` (string, e.g., "retro-370"), `type`:
  "retrospective", `pr`, `date`, `rounds`, `totalItems`, `fixed`, `rejected`,
  `deferred`, `churnChains`, `automationCandidates`, `skillsToUpdate`,
  `processImprovements`, `learnings`

Managed by: `npm run reviews:sync`, `npm run reviews:repair` (full rebuild).
Archive at >20 active entries via `npm run reviews:archive`.

### `warned-files.json`

**Writers:** `scripts/check-pattern-compliance.js` **Readers:**
`scripts/check-pattern-compliance.js` (self)

Graduation state for pattern compliance: tracks which file+pattern combos have
been warned so they can be promoted to blocking on repeat.

```json
{
  "<file_path>::<pattern_id>": "string (ISO timestamp of first warning)"
}
```
