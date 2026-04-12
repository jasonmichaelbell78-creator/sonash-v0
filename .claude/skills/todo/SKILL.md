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
3. **`render-todos.js` runs automatically.** The CLI invokes it after every
   successful mutation. Do not run it separately.
4. **Confirm destructive actions.** Hard delete and bulk archive MUST get user
   confirmation before executing.
5. **AI proposes, user decides.** When adding todos, propose title, description,
   priority, and tags from context — then ask "Does this look right, or did you
   have something else in mind?"
6. **All JSONL mutations go through `scripts/planning/todos-cli.js`.** NEVER
   read-then-Write the file directly. The CLI acquires an advisory lock,
   strictly parses, applies the mutation, runs a regression guard against silent
   drops, and only then writes. Bypassing it (Write tool, Edit tool, manual
   JSONL editing) reintroduces the T26/T27/T28 data-loss bug. `[T30 fix]`

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
- **Mutation CLI:** `scripts/planning/todos-cli.js` (locked, regression-guarded)
- **Render script:** `scripts/planning/render-todos.js [--dry-run]` (called by
  the CLI automatically; can also be run standalone)

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
6. MUST: Call the CLI (the CLI assigns the next id automatically, runs the
   regression guard, and renders the `.md`):

   ```bash
   node scripts/planning/todos-cli.js add --data '{
     "title": "...",
     "description": "...",
     "priority": "P2",
     "tags": ["#tag1"],
     "context": { "branch": "...", "files": ["..."] }
   }'
   ```

7. On non-zero exit: surface the CLI error to the user, do NOT retry blindly.
8. Confirm: "Added T{N}: {title} ({priority})" using the CLI's stdout summary.

**Done when:** New todo saved and `.md` regenerated (both done by the CLI).

### 3) Complete Todo

1. MUST: Present the table (non-completed items only)
2. Ask: "Which todo is done? (ID or number)"
3. MUST: Call the CLI:

   ```bash
   node scripts/planning/todos-cli.js complete --id T29
   ```

4. On non-zero exit: surface the error, do NOT retry blindly.
5. Confirm using the CLI's stdout summary.

**Done when:** Status updated, `.md` regenerated (both done by the CLI).

### 4) Edit Todo

1. MUST: Present the table
2. Ask: "Which todo do you want to edit? (ID or number)"
3. SHOULD: Show the full todo details (all fields)
4. Ask: "What would you like to change?"
5. MUST: Call the CLI with a JSON patch (only fields being changed):

   ```bash
   node scripts/planning/todos-cli.js edit --id T29 --data '{
     "priority": "P1",
     "tags": ["#new-tag"]
   }'
   ```

   The CLI rejects any patch that contains an `id` field. `updatedAt` is set
   automatically. To change `progress` use the dedicated `progress` subcommand.

6. On non-zero exit: surface the error, then ask "Anything else on this todo?"

**Done when:** User confirms no more edits.

### 5) Update Progress

1. MUST: Present the table (active/in-progress items highlighted)
2. Ask: "Which todo? (ID or number)"
3. SHOULD: Show current progress text (if any)
4. Ask: "What's the status?"
5. MUST: Call the CLI:

   ```bash
   node scripts/planning/todos-cli.js progress --id T29 --text "halfway done"
   ```

**Done when:** Progress saved, `.md` regenerated (both done by the CLI).

### 6) Delete Todo

1. MUST: Present the table
2. Ask: "Which todo do you want to delete? (ID or number)"
3. MUST: Confirm: "Delete T{N}: {title} permanently? This cannot be undone."
4. If confirmed, MUST call the CLI:

   ```bash
   node scripts/planning/todos-cli.js delete --id T29
   ```

   The CLI's regression guard verifies exactly one record was removed and no
   others were silently dropped before writing.

**Done when:** Line removed from JSONL, `.md` regenerated (both done by the
CLI).

### 7) Reprioritize

1. MUST: Present the table (sorted by current priority)
2. Ask: "Which todo do you want to reprioritize, or 'bulk' to reorder multiple?"
3. **Single:** Ask new priority, then call:

   ```bash
   node scripts/planning/todos-cli.js reprioritize --id T29 --priority P1
   ```

4. **Bulk:** Walk through each item conversationally, calling the CLI per item.
   Each call goes through the regression guard independently.

**Done when:** Priorities updated, `.md` regenerated (both done by the CLI).

### 8) Archive Completed

1. MUST: Present table of completed items only
2. If none: "No completed todos to archive."
3. Ask: "Archive all completed, or pick specific ones?"
4. **All completed:** MUST confirm: "Archive {N} completed todos? They'll be
   hidden from default view." Then call:

   ```bash
   node scripts/planning/todos-cli.js archive --completed
   ```

5. **Specific ids:**

   ```bash
   node scripts/planning/todos-cli.js archive --bulk --ids T1,T2,T3
   ```

6. **Single id:**

   ```bash
   node scripts/planning/todos-cli.js archive --id T29
   ```

**Done when:** Selected items archived, `.md` regenerated (both done by the
CLI).

---

## Schema

See [REFERENCE.md](./REFERENCE.md) for the full JSONL schema and field
definitions.

**Statuses:** `pending` | `in-progress` | `blocked` | `completed` | `archived`

**Priorities:** `P0` (critical) | `P1` (high) | `P2` (normal) | `P3` (someday)

## JSONL Mutation

All mutations to `todos.jsonl` MUST go through `scripts/planning/todos-cli.js`.
NEVER read-then-Write the file directly from this skill — that pattern dropped
T26/T27/T28 twice and is the bug T30 fixes.

The CLI flow is:

1. Acquire an advisory file lock on `.planning/todos.jsonl` (60s stale-break,
   PID-tracked, via `scripts/lib/safe-fs.js withLock`).
2. Strictly parse the current file. Any single-line JSON parse error aborts the
   mutation with the file path and line number — no partial writes.
3. Pre-flight integrity check: shape, monotonic ids, no duplicates. Refuses
   mutation if pre-flight fails.
4. Apply the requested mutation in memory via the appropriate `op*` helper from
   `scripts/lib/todos-mutations.js`.
5. **Regression guard:** verify the post-mutation record set matches
   per-operation expectations (line count delta, removed ids, added ids, prior
   ids still present). Refuses write on any mismatch — this is the actual
   data-loss prevention.
6. Post-flight integrity check: same checks as pre-flight, on the new state.
7. `safeWriteFileSync` the serialized JSONL.
8. Call `renderTodos()` to regenerate `.planning/TODOS.md`.

Exit codes:

- `0` = success
- `1` = user error (invalid args, missing id, validation failure)
- `2` = fatal (corrupt file, lock failure, regression guard tripped)

On any non-zero exit, surface the CLI's stderr to the user. Do NOT retry blindly
— investigate the cause first (likely a stale read or a corrupted file).

To check integrity at any time without mutating:

```bash
node scripts/planning/todos-cli.js validate
```

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
- **Defensive reads:** The CLI strictly parses every line and aborts on any
  parse error before mutation. The skill itself MUST NOT bypass this.
- **Regression guard:** The CLI compares post-mutation state against
  per-operation expectations (line count delta, removed/added/prior ids). Any
  mismatch aborts the write. This is the actual T30 fix.

## Invocation Tracking

After the user exits `/todo`, log the invocation. The writer auto-fills
`schema_version`, `completeness`, and `origin` if missing — see
`.claude/skills/_shared/SKILL_STANDARDS.md` "Invocation Tracking" section for
the canonical snippet.

```bash
cd scripts/reviews && npx tsx write-invocation.ts --data '{
  "skill": "todo",
  "type": "skill",
  "success": true,
  "schema_version": 1,
  "completeness": "stub",
  "origin": { "type": "manual" },
  "context": { "action": "MENU_ACTION", "todosActive": N }
}'
```

---

## Version History

| Version | Date       | Description                                                                                                                      |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1.2     | 2026-04-10 | T30 fix: route all mutations through `scripts/planning/todos-cli.js` (locked, regression-guarded). Modernize invocation snippet. |
| 1.1     | 2026-03-31 | Skill-audit: 19 decisions — guards, hooks, UX, I/O                                                                               |
| 1.0     | 2026-03-31 | Initial — 8-option menu, JSONL storage, context capture                                                                          |
