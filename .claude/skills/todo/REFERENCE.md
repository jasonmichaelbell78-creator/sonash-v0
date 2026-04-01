# Todo Reference

Companion file for `/todo` SKILL.md. Contains schema definition, table format
spec, and automation integration details.

---

## JSONL Schema

Each line in `.planning/todos.jsonl` is one JSON object:

```json
{
  "id": "T1",
  "title": "Short actionable title",
  "description": "Longer context, often AI-generated from conversation",
  "priority": "P2",
  "status": "pending",
  "progress": "Free-text progress notes",
  "tags": ["#security", "#skill"],
  "context": {
    "branch": "feature-xyz",
    "files": ["src/foo.ts", "lib/bar.ts"]
  },
  "createdAt": "2026-03-31T00:00:00Z",
  "updatedAt": "2026-03-31T00:00:00Z",
  "completedAt": null
}
```

### Field Definitions

| Field         | Type     | Required | Description                              |
| ------------- | -------- | -------- | ---------------------------------------- |
| `id`          | string   | MUST     | `T` + auto-incrementing integer          |
| `title`       | string   | MUST     | Short, actionable (under 60 chars ideal) |
| `description` | string   | MUST     | Full context, AI-generated or manual     |
| `priority`    | string   | MUST     | `P0` \| `P1` \| `P2` \| `P3`             |
| `status`      | string   | MUST     | See status values below                  |
| `progress`    | string   | MAY      | Free-text progress notes                 |
| `tags`        | string[] | MAY      | AI-suggested or manual, e.g. `#security` |
| `context`     | object   | SHOULD   | Auto-captured conversation context       |
| `createdAt`   | string   | MUST     | ISO 8601 timestamp                       |
| `updatedAt`   | string   | MUST     | ISO 8601, updated on every mutation      |
| `completedAt` | string   | MAY      | ISO 8601, set when status → completed    |

### Status Values

| Status        | Meaning                                    |
| ------------- | ------------------------------------------ |
| `pending`     | Not started                                |
| `in-progress` | Actively working on it                     |
| `blocked`     | Waiting on another todo or external factor |
| `completed`   | Done                                       |
| `archived`    | Hidden from default view, still in JSONL   |

### Priority Values

| Priority | Meaning                             |
| -------- | ----------------------------------- |
| `P0`     | Critical — do now                   |
| `P1`     | High — do soon                      |
| `P2`     | Normal — do when time allows        |
| `P3`     | Someday — idea capture, low urgency |

---

## ID Assignment

- IDs are `T` + integer: `T1`, `T2`, `T3`...
- Next ID = max existing ID + 1
- Deleted IDs are NOT reused
- Parse existing IDs: `Math.max(...todos.map(t => parseInt(t.id.slice(1))))`

---

## Table Display Spec

### Active View (default)

Columns: ID, Title, Priority, Status, Progress, Tags, Created

Sort order:

1. Priority ascending (P0 → P3)
2. Status order: in-progress → blocked → pending → completed

### Completed View

Columns: ID, Title, Priority, Completed, Tags

### Archived View (collapsed by default)

Columns: ID, Title, Priority, Tags

---

## Context Capture

When adding a todo, auto-capture:

1. **Branch:** current git branch (`git branch --show-current`)
2. **Files:** recently discussed or modified files in the conversation
3. **Description:** AI-generated summary of the conversation context that led to
   this todo — what was being discussed, what triggered the idea

The context helps future sessions understand _why_ a todo exists and _where_ it
came from.

---

## Render Script

**Path:** `scripts/planning/render-todos.js`

**Usage:**

```bash
node scripts/planning/render-todos.js           # Write .planning/TODOS.md
node scripts/planning/render-todos.js --dry-run  # Print to stdout only
```

**Behavior:**

- Reads `.planning/todos.jsonl`
- Partitions into active, completed, archived
- Renders markdown tables with summary line
- Archived section uses `<details>` collapsed block
- Uses shared `readJsonl()` and `escapeCell()` from `scripts/planning/lib/`

**Output contract (stable for hook parsing):**

- Line 1: `# Todos`
- Line 5: summary — `**N active** (M P0) · K completed · J archived`
- Sections: `## Active`, `## Completed`, `<details>` Archived
- Table columns are stable: ID, Title, Priority, Status, Progress, Tags, Created

---

## Automation Integration

### Session-Start Hook

Add to `.claude/hooks/session-start.js`:

```javascript
// Read todos.jsonl, count active by priority, output one-liner
// 📋 Todos: 3 active (1 P0, 2 P1) — run /todo to manage
```

### Session-End Prompt

In the session-end skill flow, after metrics but before commit:

```
📋 You have N open todos. Review before closing? (y/n/skip)
```

If user says yes → invoke `/todo` menu. If skip → proceed with closure.

---

## Version History

| Version | Date       | Description                                |
| ------- | ---------- | ------------------------------------------ |
| 1.1     | 2026-03-31 | Skill-audit: output contract, version bump |
| 1.0     | 2026-03-31 | Initial — schema, table, hooks             |
