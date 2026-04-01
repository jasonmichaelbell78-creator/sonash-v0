---
name: todo
description: >-
  Cross-session todo management with interactive menu, JSONL-backed persistence,
  and AI-powered context capture. Manages ideas, tasks, and insights that emerge
  during sessions so they survive across sessions. Independent of GSD.
---

# Todo — Cross-Session Task Management

Capture, review, and act on ideas across sessions. Every todo carries the
conversation context where it was born.

## Critical Rules (MUST follow)

1. **Show the table first, then the action.** Every menu option MUST present the
   current todo table before prompting for the action.
2. **JSONL is source of truth.** `.planning/todos.jsonl` is canonical. The `.md`
   is a generated view — never edit it directly.
3. **Regenerate `.md` after every mutation.** Run `render-todos.js` after any
   add, edit, complete, delete, reprioritize, or archive operation.
4. **Confirm destructive actions.** Hard delete and bulk archive MUST get user
   confirmation before executing.
5. **AI proposes, user decides.** When adding todos, propose title, description,
   priority, and tags from context — then ask "Does this look right, or did you
   have something else in mind?"
6. **Use Write tool for JSONL mutations.** Read the full file, apply changes in
   memory, Write the full file back. Do NOT use Edit tool on JSONL — line
   matching is unreliable with JSON objects.

## When to Use

- Capturing an idea or task mid-session
- Reviewing what's on the backlog
- Starting, completing, or reprioritizing work items
- User explicitly invokes `/todo`

**Quick start:** `/todo` → table + menu appears → pick a number → done.

## When NOT to Use

- **ROADMAP task dependency resolution** — use `/task-next`
- **Session state preservation** — use `/checkpoint`
- **GSD project phases** — use `/gsd:add-todo` (feeds GSD's `.planning/STATE.md`
  and phase planning; `/todo` is standalone, cross-session, not tied to GSD)
- **Technical debt tracking** — use `/add-debt`

## Input

`/todo` takes no arguments. All interaction happens through the menu.

## Storage

- **Data:** `.planning/todos.jsonl` (one JSON object per line)
- **View:** `.planning/TODOS.md` (generated, do not edit)
- **Script:** `scripts/planning/render-todos.js [--dry-run]`

## Menu

On invocation, read `.planning/todos.jsonl`. If file is missing or empty,
present: "No todos yet. Would you like to add one?" and go to Add Todo.

Otherwise, render the active todo table, then present:

```
What would you like to do?
1) View Todos        — filter and search
2) Add Todo          — capture from current context
3) Complete Todo     — mark as done
4) Edit Todo         — modify any field
5) Update Progress   — add progress notes
6) Delete Todo       — permanent removal
7) Reprioritize      — change priority
8) Archive Completed — hide finished items
```

If >20 active todos, show top 10 by priority with "Show all? (y/n)".

Wait for user selection, then follow the process for that option below. After
each completed action, return to the menu unless user says "exit" or "done."

On exit, present: "Done. N todos active, M completed this session."

**Disengagement:** User can say "cancel", "exit", or "done" at any prompt to
return to menu (cancel) or leave `/todo` (exit/done) without saving pending
changes.

---

## Processes

### 1) View Todos

1. MUST: Present the full active table (non-archived, sorted priority → status)
2. SHOULD: Ask "Filter by: priority (P0-P3) | status | tag | or 'all' to see
   archived too?"
3. If user filters, re-render the table with the filter applied

**Done when:** User has seen the view they want.

### 2) Add Todo

1. MUST: Present the table (shows current state)
2. Analyze current conversation context — branch, recent discussion, files
   touched
3. Propose all fields with reasoning:
   - **Title:** short, actionable
   - **Description:** AI-generated from conversation context
   - **Priority:** P0-P3 with brief reasoning ("P1 because security-related")
   - **Tags:** AI-suggested from context (e.g., `#security`, `#skill`)
   - **Context:** auto-captured branch + files
4. MUST: Ask "Does this look right, or did you have something else in mind?"
5. Apply user edits if any. **Delegation:** if user says "you decide," accept
   AI-proposed values and save.
6. Assign next available ID (`T` + max existing ID + 1)
7. Write to JSONL with `status: "pending"`, current timestamp
8. MUST: Run `node scripts/planning/render-todos.js`
9. Confirm: "Added T{N}: {title} ({priority})"

**Done when:** New todo saved and `.md` regenerated.

### 3) Complete Todo

1. MUST: Present the table (non-completed items only)
2. Ask: "Which todo is done? (ID or number)"
3. Set `status: "completed"`, `completedAt: now`
4. MUST: Run `node scripts/planning/render-todos.js`
5. Confirm: "Completed T{N}: {title}"

**Done when:** Status updated, `.md` regenerated.

### 4) Edit Todo

1. MUST: Present the table
2. Ask: "Which todo do you want to edit? (ID or number)"
3. SHOULD: Show the full todo details (all fields)
4. Ask: "What would you like to change?"
5. Conversationally apply edits — user can change title, description, priority,
   tags, progress, or status
6. Update `updatedAt` timestamp
7. MUST: Run `node scripts/planning/render-todos.js`
8. Confirm changes, then: "Anything else on this todo?"

**Done when:** User confirms no more edits.

### 5) Update Progress

1. MUST: Present the table (active/in-progress items highlighted)
2. Ask: "Which todo? (ID or number)"
3. SHOULD: Show current progress text (if any)
4. Ask: "What's the status?"
5. Update `progress` field (free-text), set `updatedAt`
6. MUST: Run `node scripts/planning/render-todos.js`
7. Confirm: "Updated T{N} progress."

**Done when:** Progress saved, `.md` regenerated.

### 6) Delete Todo

1. MUST: Present the table
2. Ask: "Which todo do you want to delete? (ID or number)"
3. MUST: Confirm: "Delete T{N}: {title} permanently? This cannot be undone."
4. If confirmed: remove the line from JSONL entirely
5. MUST: Run `node scripts/planning/render-todos.js`
6. Confirm: "Deleted T{N}."

**Done when:** Line removed from JSONL, `.md` regenerated.

### 7) Reprioritize

1. MUST: Present the table (sorted by current priority)
2. Ask: "Which todo do you want to reprioritize, or 'bulk' to reorder multiple?"
3. **Single:** Ask new priority (P0/P1/P2/P3), update, regenerate
4. **Bulk:** Present list, conversationally walk through reordering
5. MUST: Run `node scripts/planning/render-todos.js`

**Done when:** Priorities updated, `.md` regenerated.

### 8) Archive Completed

1. MUST: Present table of completed items only
2. If none: "No completed todos to archive."
3. Ask: "Archive all, or pick specific ones?"
4. **All:** MUST confirm: "Archive {N} completed todos? They'll be hidden from
   default view."
5. **Specific:** Ask which IDs
6. Set `status: "archived"` on selected items
7. MUST: Run `node scripts/planning/render-todos.js`

**Done when:** Selected items archived, `.md` regenerated.

---

## Schema

See [REFERENCE.md](./REFERENCE.md) for the full JSONL schema and field
definitions.

**Statuses:** `pending` | `in-progress` | `blocked` | `completed` | `archived`

**Priorities:** `P0` (critical) | `P1` (high) | `P2` (normal) | `P3` (someday)

## JSONL Mutation

When writing to `todos.jsonl`:

1. Read the full file into memory
2. Validate: parse each line as JSON. If any line fails, report error and do NOT
   proceed with the write — the file may be corrupted
3. Apply the mutation (add, edit, delete, status change)
4. Use the **Write tool** to overwrite the full file (one JSON object per line)
5. Run `node scripts/planning/render-todos.js` to regenerate the `.md`

## Table Format

```
| ID  | Title              | Priority | Status      | Progress     | Tags       | Created    |
| --- | ---                | ---      | ---         | ---          | ---        | ---        |
| T3  | Fix auth redirect  | P0       | in-progress | halfway done | #security  | 2026-03-31 |
```

Sort order: priority (P0 first) → status (in-progress → blocked → pending →
completed).

## Automations

**Session-start hook:** Surface todo count in startup output:

```
📋 Todos: 3 active (1 P0, 2 P1) — run /todo to manage
```

**Session-end integration:** Before closure, the session-end skill SHOULD read
`todos.jsonl` and prompt: "You have N open todos. Review before closing?
(y/n/skip)". If yes → invoke `/todo`.

## Compaction Resilience

This skill is inherently compaction-resilient — all data lives in
`.planning/todos.jsonl` on disk. No in-memory state or state file needed. If
compaction occurs mid-`/todo`, re-invoke `/todo` to resume from the JSONL.

## Guard Rails

- **Confirm before delete:** "This cannot be undone." (MUST)
- **Confirm before bulk archive:** Show count, require explicit yes (MUST)
- **Table first:** Every menu option shows the table before acting (MUST)
- **No orphan IDs:** Deleted IDs are NOT reused. Next ID is always max + 1.
- **Disengagement:** "cancel" returns to menu, "exit"/"done" leaves the skill.
- **Large lists:** If >20 active todos, show top 10 by priority with expand
  option.
- **Defensive reads:** Validate JSON parse before overwriting JSONL file.

## Invocation Tracking

After the user exits `/todo`, log the invocation:

```bash
cd scripts/reviews && node dist/write-invocation.js --data '{"skill":"todo","type":"skill","success":true,"context":{"action":"MENU_ACTION","todosActive":N}}'
```

---

## Version History

| Version | Date       | Description                                             |
| ------- | ---------- | ------------------------------------------------------- |
| 1.1     | 2026-03-31 | Skill-audit: 19 decisions — guards, hooks, UX, I/O      |
| 1.0     | 2026-03-31 | Initial — 8-option menu, JSONL storage, context capture |
