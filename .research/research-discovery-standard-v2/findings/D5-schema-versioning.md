# Findings: /todo JSONL Schema Versioning and Backward-Compatible Migration of 19 Existing Todos

**Searcher:** deep-research-searcher **Profile:** codebase + web **Date:**
2026-04-04 **Sub-Question IDs:** SQ5 **Domain:** technology

---

## 1. Sub-Question Restated

SoNash has 19 active todos in `.planning/todos.jsonl` with an established schema
(`id`, `title`, `description`, `priority`, `status`, `progress`, `tags`,
`context`, `createdAt`, `updatedAt`, `completedAt`). The plan is to extend this
schema with new fields (`stage`, `type`, `artifacts`, `findings_refs`, `blocks`,
`blocked_by`) to support R&D pipeline tracking. The existing 19 todos must
migrate without data loss, and the schema must support future evolution without
breaking old records.

Key questions: What is the simplest versioning approach for ~20 records?
Per-record `schema_version` or header record? How to validate migrated records
without breaking the existing `/todo` skill? What is the retroactive inference
heuristic for populating `stage` on 19 existing todos? What is the rollback
plan?

---

## 2. Search Strategy

**Codebase reads (primary — ground truth):**

- `.planning/todos.jsonl` — all 19 records read line by line
- `.claude/skills/todo/SKILL.md` and `REFERENCE.md` — full schema definition,
  status values, JSONL mutation rules, render-todos.js output contract
- `scripts/planning/render-todos.js` — how fields are consumed by the renderer
- `scripts/planning/lib/read-jsonl.js` — existing JSONL parser behavior
- `scripts/reviews/lib/schemas/shared.ts` — SoNash's existing `schema_version`
  pattern in production (BaseRecord Zod schema)
- `scripts/reviews/migrate-retros.js` and `migrate-ecosystem-v2.js` — real
  migration scripts for precedent
- `.research/research-discovery-standard-v2/findings/D1-state-machine.md` — SQ1
  findings on the proposed stage/type schema (parallel findings, same research
  session)
- `.research/research-discovery-standard-v2/findings/D4-todo-ux-split.md` — SQ4
  findings on PROJECT vs TASK type discrimination

**Web research (secondary):**

- Schema evolution and backward compatibility patterns (Confluent Schema
  Registry docs)
- Upcaster pattern in event sourcing (artium.ai deep dive)
- Verzod — Zod-based versioned entity migration library (GitHub)
- Schema versioning strategies (StudyRaid, Couchbase, DataExpert)
- Atomic write patterns for JSONL files (write-file-atomic npm)
- JSON schema version field design (GitHub Gist mattyod/3608613)
- Zod v4 optional fields and default value behavior (zod.dev)

**Queries run (7 unique):**

1. "JSONL schema versioning migration patterns 2025 backward compatible
   evolution"
2. "event sourcing upcaster pattern JSON schema migration on-read transform"
3. "Zod 4 optional fields backward compatible schema versioning additive
   migration"
4. "JSONL append-only file migration strategy backup rollback atomic write
   Node.js"
5. "JSON file schema_version per-record vs header record sentinel record JSONL
   versioning"
6. "Verzod schema migration library Zod TypeScript version migration chain
   example"
7. "JSON file schema_version header record versioning version field per record
   migration"

---

## 3. Findings

### Finding 1 — The current todos.jsonl schema has NO version marker; all 19 records are schema version 1 [CONFIDENCE: HIGH]

Direct read of `.planning/todos.jsonl` confirms: the existing 11
required/optional fields (`id`, `title`, `description`, `priority`, `status`,
`progress`, `tags`, `context`, `createdAt`, `updatedAt`, `completedAt`) contain
NO version marker of any kind. There is no `schema_version`, `v`, `_version`, or
equivalent field. The schema is implicitly version 1 (the only version that has
ever existed).

The `render-todos.js` script reads only these fields: `id`, `title`, `priority`,
`status`, `progress`, `tags`, `createdAt`, `completedAt`. It uses `??` fallbacks
on every access (`t.id ?? ""`, `t.title ?? ""`), meaning the renderer is already
forward-compatible with unknown fields — it will silently ignore any new fields
added.

The `/todo` SKILL.md mutation rule: "Read the full file, apply changes in
memory, Write the full file back. Do NOT use Edit tool on JSONL." This means the
migration script pattern is already specified — full-file rewrite, not append.

**Implication:** Adding new optional fields to existing records is zero-risk.
The renderer and mutation code both use defensive access patterns that ignore
unknown fields.

Sources: [1] `.planning/todos.jsonl` (direct read, ground truth), [2]
`scripts/planning/render-todos.js` (direct read, ground truth), [3]
`.claude/skills/todo/SKILL.md` (direct read, ground truth)

---

### Finding 2 — SoNash already uses per-record `schema_version` in production JSONL (BaseRecord pattern) [CONFIDENCE: HIGH]

`scripts/reviews/lib/schemas/shared.ts` defines a `BaseRecord` Zod schema that
is the foundation of all 5 review-system JSONL files (reviews.jsonl,
retros.jsonl, ecosystem.jsonl, learnings.jsonl, deferred-items.jsonl). The
canonical field is:

```typescript
schema_version: z.number().int().positive(); // e.g., 1
```

Every migration script (`migrate-retros.js`, `migrate-ecosystem-v2.js`)
hardcodes `schema_version: 1` on each record. This is the established SoNash
pattern for JSONL schema versioning: per-record integer version field on every
record.

The `backfill-reviews.ts` and `write-deferred-items.ts` also produce
`schema_version: 1` records, confirming this is not legacy — it is the current
standard.

**Implication:** The todos.jsonl migration should follow the same pattern: add
`schema_version: 1` to all existing records (retroactive backfill). New records
with new fields (stage, type, etc.) increment to `schema_version: 2`. This
creates a clear, auditable schema lineage.

Sources: [4] `scripts/reviews/lib/schemas/shared.ts` (direct read, ground
truth), [5] `scripts/reviews/migrate-retros.js` (direct read, ground truth), [6]
`scripts/reviews/migrate-ecosystem-v2.js` (direct read, ground truth)

---

### Finding 3 — Additive-only migration (new fields are optional with defaults) is the simplest and safest approach for a ~20-record file [CONFIDENCE: HIGH]

The DataExpert backward compatibility guide, Confluent Schema Registry
documentation, and the SoNash existing pattern all converge on the same core
rule: **make new fields optional with default values; never remove or rename
existing required fields**.

For `todos.jsonl`, the proposed new fields (`stage`, `type`, `artifacts`,
`findings_refs`, `blocks`, `blocked_by`) are ALL additive. None of the existing
11 fields are being removed or renamed. This means:

1. Existing consumers (render-todos.js, /todo SKILL.md read logic, session-start
   hook) continue working without modification — they simply ignore the new
   fields.
2. New consumers (the /rnd skill, stage-aware views) read new fields with
   `?? null` or `?? "TASK"` defaults.
3. No "version gate" logic is needed in consumers because old records are still
   valid — they just have null/missing fields for the new additions.

The additive-only rule also future-proofs subsequent schema extensions: as long
as new fields remain optional with explicit defaults, schema_version can be
bumped without a mandatory migration script.

Sources: [7] DataExpert Backward Compatibility Guide (web, verified), [8]
Confluent Schema Registry Evolution Docs (official, HIGH trust), [4]
`scripts/reviews/lib/schemas/shared.ts` (codebase, ground truth)

---

### Finding 4 — The per-record `schema_version` field is strongly preferred over a header sentinel record for JSONL files [CONFIDENCE: HIGH]

Two approaches exist for JSONL schema versioning:

**Option A: Per-record version field** (`schema_version: 1` on every line)

- Used by: SoNash BaseRecord, Couchbase document versioning, Azure Cosmos DB
  design pattern
- Pros: Each record is self-describing; partial file reads are safe; append
  operations don't require reading the header; records are individually
  replayable/upcasted
- Cons: Redundant data when all records share the same version (minor for 20
  records)

**Option B: Header sentinel record** (first line is
`{"_type":"schema","version":2}`)

- Used by: Some event log formats (Apache Kafka headers)
- Pros: Single version declaration for the whole file
- Cons: Breaks JSONL parsers that assume all lines are data records; the
  `readJsonl.js` parser in SoNash filters `// comments` and empty lines but
  would NOT filter a sentinel JSON object without modification; mixing metadata
  with data records violates JSONL's primary use case (homogeneous records)

For SoNash specifically: the existing `readJsonl.js` parser does NOT handle a
header sentinel record pattern. Adopting Option B would require modifying the
parser, all consumers, and the `/todo` SKILL.md validation step. Option A
(per-record) requires only a migration script and a Zod schema update.

**Conclusion:** Per-record `schema_version` is the correct choice for SoNash
todos.

Sources: [4] `scripts/reviews/lib/schemas/shared.ts` (ground truth), [9]
`scripts/planning/lib/read-jsonl.js` (direct read, ground truth), [10] Microsoft
Learn Azure Cosmos DB Schema Versioning Pattern (web, HIGH trust), [11]
Confluent Schema Evolution documentation (official, HIGH trust)

---

### Finding 5 — Zod v4 additive schema extension: use `.optional()` with `.default()` for backward-compatible new fields [CONFIDENCE: HIGH]

SoNash uses Zod 4.3.6 (CLAUDE.md Section 1). In Zod 4, default values are
applied even when the field is absent from the input (changed from Zod 3
behavior, where defaults only applied if the field was present but invalid).
This is precisely the behavior needed for migration: old records missing `type`
will receive `"task"` as the default value when parsed through the new schema.

The correct Zod 4 pattern for backward-compatible extension:

```typescript
// Existing V1 schema (todos.jsonl today)
const TodoV1 = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(["P0", "P1", "P2", "P3"]),
  status: z.enum([
    "pending",
    "in-progress",
    "blocked",
    "completed",
    "archived",
  ]),
  progress: z.string().optional(),
  tags: z.array(z.string()).optional(),
  context: z
    .object({ branch: z.string(), files: z.array(z.string()) })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().nullable().optional(),
  schema_version: z.number().int().positive().default(1),
});

// Extended V2 schema (with R&D pipeline fields)
const TodoV2 = TodoV1.extend({
  schema_version: z.literal(2).default(2),
  type: z.enum(["task", "project"]).default("task"),
  stage: z
    .enum([
      "IDEA",
      "BRAINSTORM",
      "RESEARCH",
      "PLAN",
      "IMPLEMENT",
      "TEST",
      "COMPLETE",
      "ABANDONED",
      "PARKED",
    ])
    .nullable()
    .optional(),
  artifacts: z.record(z.string()).optional(),
  findings_refs: z.array(z.string()).optional(),
  blocks: z.array(z.string()).optional(),
  blocked_by: z.array(z.string()).optional(),
  stage_history: z
    .array(
      z.object({
        from: z.string().nullable(),
        to: z.string(),
        at: z.string(),
        by: z.enum(["user", "auto-advance", "migration"]),
        skipped: z.array(z.string()).optional(),
        reason: z.string().optional(),
      })
    )
    .optional(),
});
```

Zod 4's `.default()` on absent fields guarantees that V1 records parsed through
TodoV2 will receive `type: "task"` and `schema_version: 2` automatically.

The key Zod 4 behavior change to be aware of: `.default()` now applies even when
the key is entirely absent (not just when the value is undefined). For
partial-update scenarios (e.g., `/todo` Edit updating only `progress`), the
write-back should use the full-record pattern (already specified in SKILL.md
rule 6) to avoid inadvertently resetting optional fields to their defaults.

Sources: [12] Zod v4 Migration Guide (zod.dev, official, HIGH trust), [13] Zod
v4 release notes and changelog (zod.dev, official, HIGH trust), [4] SoNash
schemas.ts showing Zod usage patterns (ground truth)

---

### Finding 6 — Upcaster pattern (lazy migration on read) is valid but unnecessary for a 20-record file [CONFIDENCE: MEDIUM]

Event sourcing literature (artium.ai, martendb.io, event-driven.io) defines
**upcasting** as transforming old schema records to the current version at read
time, without modifying the stored records. This is the canonical approach for
immutable event streams where rewriting is prohibited:

```python
# Upcaster: V1 → V2 transform
def account_credited_v1_to_v2(event: EventV1) -> EventV2:
    return EventV2(
        account_id=event.account_id,
        amount=event.amount,
        currency=Currency.USD  # Default for legacy events
    )
```

For SoNash's `todos.jsonl` (20 records), the upcaster pattern is technically
valid but overengineered. The arguments against it for this specific use case:

1. **File is mutable, not immutable.** JSONL event logs are typically
   append-only and immutable (writes are never modified). `todos.jsonl` is
   mutated on every Add, Edit, Complete, or Archive operation. There is no
   immutability guarantee.

2. **Scale is trivially small.** Upcasters make sense when an event log has
   thousands of historical events that would be expensive to rewrite. A
   20-record file runs in milliseconds with a bulk migration.

3. **Complexity cost.** An upcaster chain adds runtime parsing complexity to
   every read operation. For a skill that runs at most once per session, this is
   unmotivated.

**Conclusion:** Use bulk migration (one-shot rewrite) for the initial 19
records. Reserve upcaster-style logic for future schema changes IF the file
grows large and a bulk migration becomes disruptive. Document the upcaster
pattern as the fallback if needed.

Sources: [14] artium.ai upcasting deep dive (web, MEDIUM trust), [15]
event-driven.io versioning patterns (web, MEDIUM trust), [16] martendb.io event
versioning docs (official docs, HIGH trust)

---

### Finding 7 — The Verzod library provides a principled Zod-native migration chain, but is an external dependency [CONFIDENCE: MEDIUM]

`verzod` (GitHub: AndrewBastin/verzod) is a TypeScript library for Zod-based
versioned entity migration. The API:

```typescript
const Todo = createVersionedEntity({
  latestVersion: 2,
  versionMap: {
    1: defineVersion({
      initial: true,
      schema: TodoV1,
      up(data) {
        return { ...data, type: "task", schema_version: 2 };
      },
    }),
    2: defineVersion({
      schema: TodoV2,
    }),
  },
  getVersion(data) {
    return data.schema_version ?? 1;
  },
});

// Usage: Todo.safeParse(record) — auto-migrates V1 to V2
```

The library handles version detection, migration chains, and `latestSchema`
exposure. This would be the cleanest implementation if SoNash adopted it.

**Caveats:**

- The library has a peer dependency on Zod v3.22.0, NOT Zod v4.3.6 (which SoNash
  uses). This creates a compatibility risk with SoNash's Zod 4 stack.
- It is an external dependency for a ~20-record file that would be replaced by
  ~50 lines of migration script.
- Last release activity as of research date (April 2026): not recently
  maintained.

**Conclusion:** Verzod is the right conceptual reference but should NOT be added
as a dependency. The migration pattern it describes (version detection + chain)
is implementable in plain TypeScript with Zod 4 in a single `migrate-todos.js`
script.

Sources: [17] AndrewBastin/verzod GitHub (web, MEDIUM trust), [13] Zod v4
migration guide (official, HIGH trust — confirms Zod 4 peer dep break)

---

### Finding 8 — Bulk migration script (one-shot rewrite) is the correct pattern for todos.jsonl at current scale [CONFIDENCE: HIGH]

The SoNash codebase has three production examples of bulk migration scripts for
JSONL files: `migrate-retros.js`, `migrate-ecosystem-v2.js`, and
`backfill-reviews.ts`. All three follow the same pattern:

1. **Backup first** — or rely on Git history as the backup (commits are atomic)
2. **Read all records** — parse full JSONL into memory
3. **Transform each record** — apply field additions, set defaults, increment
   schema_version
4. **Validate transformed records** — run through Zod schema to catch errors
5. **Overwrite the file** — write the full new content atomically
6. **Dry-run mode** — `--dry-run` flag to preview output without writing

The `/todo` SKILL.md mutation rule already specifies this exact pattern for all
mutations: "Read the full file into memory → Validate → Apply mutation → Write
tool to overwrite the full file." The migration script is conceptually identical
to a large Edit operation.

For `todos.jsonl` specifically: a `migrate-todos-v2.js` script should:

- Take a `--dry-run` flag (matches existing script convention)
- Read all 19 records
- Add `schema_version: 2`, `type`, `stage`, and an initial `stage_history` entry
  (with `by: "migration"`) to each record
- Validate each record against the TodoV2 Zod schema
- Write back atomically (overwrite full file)
- Run `render-todos.js` after writing to regenerate the `.md`

Sources: [5] `scripts/reviews/migrate-retros.js` (ground truth), [6]
`scripts/reviews/migrate-ecosystem-v2.js` (ground truth), [3]
`.claude/skills/todo/SKILL.md` JSONL Mutation section (ground truth)

---

### Finding 9 — Rollback plan: Git is the atomic backup and the first-line recovery mechanism [CONFIDENCE: HIGH]

For a 20-record JSONL file under Git version control, the rollback strategy is
trivially simple: `git checkout -- .planning/todos.jsonl` restores the
pre-migration state instantly. No separate backup mechanism is needed.

The migration script protocol should be:

1. Confirm `git status` shows `todos.jsonl` clean before running
2. Run `node scripts/planning/migrate-todos-v2.js --dry-run` — review the diff
3. Commit the current state:
   `git add .planning/todos.jsonl && git commit -m "backup: todos.jsonl pre-v2-migration"`
4. Run `node scripts/planning/migrate-todos-v2.js --apply`
5. Validate with `node scripts/planning/render-todos.js --dry-run`
6. If anything is wrong: `git checkout -- .planning/todos.jsonl` — rollback in
   one command

For production JSONL files that aren't Git-tracked (e.g., the
`write-file-atomic` pattern for concurrent processes), atomic file writes (write
temp → rename) protect against partial-write corruption. For `todos.jsonl`,
which is written by Claude sequentially (no concurrent writes), the Git backup
is sufficient.

The `migrate-ecosystem-v2.js` script demonstrates the pattern: it reads from
orphaned source paths and writes to canonical destination paths, with the
`--dry-run` flag to inspect before applying.

Sources: [5] `scripts/reviews/migrate-retros.js` (ground truth), [18] npm
write-file-atomic (web, HIGH trust for atomic write pattern), [6]
`scripts/reviews/migrate-ecosystem-v2.js` (ground truth)

---

### Finding 10 — Validating migrated records with Zod requires a two-schema approach: lenient read, strict write [CONFIDENCE: HIGH]

The existing SoNash reviews pipeline uses two distinct Zod schema modes:

- `render-reviews-to-md.ts` comment: "without
  schema_version/completeness/origin. We parse leniently."
- `write-review-record.ts`: strict schema with required `schema_version`

For todos.jsonl, the same two-schema pattern applies:

**ReadSchema (lenient — for existing /todo skill operations):** All new fields
(stage, type, artifacts, etc.) are `.optional()` with defaults. This ensures the
existing `/todo` skill works on both V1 and V2 records without any code changes.

**WriteSchema (strict — for migration and new records):**
`schema_version: z.literal(2)`, `type: z.enum(["task","project"])` required.
Enforces that new records written after migration are always V2-compliant.

The SKILL.md validation step ("Validate: parse each line as JSON. If any line
fails, report error and do NOT proceed") already implements defensive reads.
Adding a lenient-mode Zod parse after JSON.parse would add runtime type safety
without breaking the existing guard.

Sources: [4] `scripts/reviews/lib/schemas/shared.ts` (ground truth), [19]
`scripts/reviews/render-reviews-to-md.ts` comment line 70 (ground truth), [3]
`.claude/skills/todo/SKILL.md` JSONL Mutation section (ground truth), [12] Zod
v4 docs on .optional() and .default() (official, HIGH trust)

---

### Finding 11 — Database migration analogs (Rails, Flyway, Alembic) suggest a `schema_version` bump on each structural change, not semantic changes [CONFIDENCE: MEDIUM]

Rails migrations, Flyway, and Alembic all version migrations sequentially
(Rails: `20260404_add_stage_to_todos.rb`; Flyway: `V2__add_stage_field.sql`).
The version number increments represent structural changes to the schema, not
data value changes.

The analog for JSONL:

- **V1:** original schema (current todos) — no `schema_version` field
- **V2:** additive extension — adds `schema_version: 2`, `type`, `stage`,
  `artifacts`, `findings_refs`, `stage_history`, `blocks`, `blocked_by`
- **V3 (future):** any further structural additions (e.g., `sub_items`,
  `estimated_sessions`)

Each migration has a companion script: `migrate-todos-v2.js`,
`migrate-todos-v3.js`. The scripts are idempotent: running V2 migration on a V2
record does nothing (guard: `if (record.schema_version >= 2) return record`).

Idempotency is the key requirement: migration scripts in Rails/Flyway are
designed to be safe to re-run, failing gracefully if already applied. The same
applies here.

Sources: [20] StudyRaid schema versioning strategies (web, MEDIUM trust), [8]
Confluent Schema Evolution (official, HIGH trust)

---

### Finding 12 — The `render-todos.js` output contract is stable and immune to new fields [CONFIDENCE: HIGH]

REFERENCE.md specifies: "Table columns are stable: ID, Title, Priority, Status,
Progress, Tags, Created." The renderer uses only those 7 fields explicitly. The
`render-todos.js` code accesses: `t.id`, `t.title`, `t.priority`, `t.status`,
`t.progress`, `t.tags`, `t.createdAt`, `t.completedAt` — and uses `?? ""`
fallbacks on every field access.

Adding `type`, `stage`, `artifacts`, `findings_refs`, `schema_version` to
records does NOT change the renderer output. The session-start hook which parses
"line 5: summary — N active (M P0)" is also immune because it reads
active/completed/archived counts from the JSONL data, not from the rendered
table.

However, D4 findings (Finding 7) recommend updating the Progress column to show
`[STAGE]` badge for PROJECT items. This is a renderer change, not a schema
change — it can be done as a separate step after migration, using the new `type`
and `stage` fields.

Sources: [2] `scripts/planning/render-todos.js` (ground truth, direct read),
[21] `.claude/skills/todo/REFERENCE.md` "Output contract" section (ground truth)

---

### Finding 13 — The stage_history initial migration entry establishes audit trail provenance [CONFIDENCE: HIGH]

Event sourcing and upcasting literature (artium.ai, Azure Architecture Center)
emphasizes that transformation provenance must be preserved — the system should
know that a value was set by migration, not by a user action.

For the `stage_history` initial entry on migrated todos, the entry should use
`by: "migration"` with a descriptive `reason`:

```json
{
  "from": null,
  "to": "RESEARCH",
  "at": "2026-04-04T00:00:00Z",
  "by": "migration",
  "reason": "retroactive_v2_migration: inferred from status=in-progress + progress_text"
}
```

This creates a clear audit trail: any future analysis of stage_history can
distinguish inferred initial stages (by: "migration") from user-confirmed
transitions (by: "user") and auto-advance triggers (by: "auto-advance").

The `migrate-retros.js` precedent uses `origin: { type: "migration" }` for the
same purpose in the review system — recording the source of data that was
bulk-ingested rather than organically created.

Sources: [14] artium.ai upcasting deep dive (web, MEDIUM trust), [5]
`scripts/reviews/migrate-retros.js` (ground truth — origin: { type: "migration"
}), [22] Azure Architecture Center event sourcing pattern (web, HIGH trust)

---

## 4. Synthesis

**The migration problem is simpler than it looks.** For a 20-record JSONL file
with additive-only changes:

1. **New fields are optional by design** — the renderer, mutation code, and
   session hooks already use defensive access patterns that silently handle
   absent fields. The migration could technically be delayed indefinitely
   without breaking anything.

2. **SoNash already has the pattern** — `scripts/reviews/lib/schemas/shared.ts`
   `BaseRecord` with `schema_version: z.number().int().positive()` is the
   canonical pattern. The todos migration should follow this exactly.

3. **The migration script writes itself** — read 19 records, apply inference
   heuristic (Section 6), add `schema_version: 2` + new fields, validate with
   Zod, write back. This is ~80-100 lines of Node.js. The existing
   `migrate-retros.js` is the template.

4. **Git is the rollback plan** — one `git checkout -- .planning/todos.jsonl`
   command reverts to pre-migration state. No separate backup infrastructure
   needed.

5. **Two Zod schemas, not one** — a lenient ReadSchema (all new fields optional)
   and a strict WriteSchema (new fields required for V2 records). The lenient
   schema ensures existing `/todo` operations don't break during the window when
   both V1 and V2 records may coexist (though for 20 records the migration
   window is seconds).

---

## 5. Recommendations Specific to SoNash /todo Schema Evolution

### R1 — Adopt per-record `schema_version` integer as the canonical versioning mechanism

Follow the `BaseRecord` precedent in `scripts/reviews/lib/schemas/shared.ts`.
Every record gets `schema_version: 2` after migration. Future structural
additions bump to v3, v4, etc. Never use a header sentinel record — it breaks
the existing `readJsonl.js` parser and violates JSONL's homogeneous-record
assumption.

### R2 — The minimal V2 schema extension (in order of priority)

Add these fields for the R&D pipeline extension:

```json
{
  "schema_version": 2,
  "type": "task",
  "stage": null,
  "stage_history": [],
  "artifacts": {},
  "findings_refs": [],
  "blocks": [],
  "blocked_by": []
}
```

All new fields are optional in the ReadSchema (backward compatible). The `type`
field defaults to `"task"` for all existing records. The `stage` field is null
for task-type records. The `stage_history` array is populated by the inference
heuristic for project-type records.

### R3 — Write a standalone `scripts/planning/migrate-todos-v2.js` migration script

The script should:

- Accept `--dry-run` flag (prints to stdout, no write)
- Accept `--apply` flag (writes file)
- Read `.planning/todos.jsonl` using `readJsonl()` from `scripts/planning/lib/`
- Apply the inference heuristic (Section 6) to each record
- Validate each transformed record against TodoV2 Zod schema
- If ANY validation fails, abort and print the failing record (do not
  partial-write)
- On `--apply`: write the full file back using `safeWriteFileSync` (already used
  by render-todos.js)
- Run `render-todos.js` after successful write
- Print a summary: "Migrated N records. Inferred stages: X project, Y task."

### R4 — Define two Zod schemas: TodoV2ReadSchema (lenient) and TodoV2WriteSchema (strict)

```typescript
// Lenient: used by /todo skill read operations
const TodoV2ReadSchema = z.object({
  id: z.string(),
  title: z.string(),
  // ... existing V1 fields unchanged ...
  schema_version: z.number().int().positive().default(1),
  type: z.enum(["task", "project"]).default("task"),
  stage: z.string().nullable().optional(),
  stage_history: z.array(z.any()).optional(),
  artifacts: z.record(z.string()).optional(),
  findings_refs: z.array(z.string()).optional(),
  blocks: z.array(z.string()).optional(),
  blocked_by: z.array(z.string()).optional(),
});

// Strict: used by migration script and new-record writes
const TodoV2WriteSchema = TodoV2ReadSchema.extend({
  schema_version: z.literal(2),
  type: z.enum(["task", "project"]),
});
```

Store in `scripts/planning/lib/todo-schemas.ts` for import by both
`migrate-todos-v2.js` and future `/todo` skill extensions.

### R5 — Update SKILL.md and REFERENCE.md AFTER migration, not before

Do not update the SKILL.md schema documentation until the migration script has
run and been verified. This prevents documentation drift during the migration
window. The REFERENCE.md "Field Definitions" table is the single source of truth
— update it once, atomically, after migration is confirmed.

### R6 — Preserve existing `progress` field — do not deprecate it

The `progress` free-text field continues to serve as a scratchpad/notes field
even after the `stage` field takes over pipeline tracking. Multiple todos (T5:
"Testing Direction F now", T12: "Starting /deep-plan") have detailed progress
notes that are not equivalent to the stage. The `progress` field should remain
in V2. A tombstone deprecation approach is NOT recommended — the field serves a
different semantic purpose (narrative notes) than `stage` (pipeline position).

---

## 6. Retroactive Stage Inference Heuristic (Concrete Proposal for 19 Existing Todos)

The goal: for each of the 19 todos, determine:

1. **`type`**: `"task"` or `"project"`
2. **`stage`**: the most accurate current R&D pipeline stage (or null for tasks)
3. **`stage_history`**: a single initial entry documenting the inferred stage

### Classification Decision Tree

**Step 1: Determine `type`**

Classify as `"task"` if ALL of these are true:

- `progress` field is empty OR a single short sentence (< 80 chars)
- `description` is a single sentence (< 120 chars)
- `tags` does NOT include `#research`, `#canon`, `#os`, `#skill` with
  multi-session lifecycle
- No references to `.research/`, `.planning/PLAN.md`, or multi-phase artifacts

Otherwise classify as `"project"`.

**Step 2: For tasks, set `stage: null` and empty `stage_history: []`**

**Step 3: For projects, infer `stage` using this priority-ordered rule set:**

| Rule (checked in order)                                                                                                            | Inferred Stage                                      |
| ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `status === "completed"` OR `completedAt` is non-null                                                                              | `COMPLETE`                                          |
| `status === "blocked"` AND progress text mentions specific blocker (another todo)                                                  | `PLAN` (blocked mid-planning) or infer from content |
| progress text contains "research complete\|research done\|research in progress" (case-insensitive) AND next step involves planning | `PLAN`                                              |
| progress text contains "research in progress\|in separate worktree\|research underway"                                             | `RESEARCH`                                          |
| progress text contains "brainstorm complete\|brainstorm done" AND no research mention                                              | `RESEARCH`                                          |
| progress text contains "starting /deep-plan\|starting /deep-research\|planning next"                                               | `PLAN`                                              |
| progress text contains "implemented\|all.\*steps complete\|shipped\|merged"                                                        | `COMPLETE` or `IMPLEMENT`                           |
| progress text contains "brainstorm" keyword AND status is in-progress                                                              | `BRAINSTORM`                                        |
| progress text contains "plan.md\|PLAN.md\|planning complete"                                                                       | `IMPLEMENT`                                         |
| `status === "pending"` AND minimal progress text                                                                                   | `IDEA`                                              |
| `status === "in-progress"` AND progress text exists but no clear stage signal                                                      | `RESEARCH` (safe default)                           |

### Applied Heuristic — All 19 Todos

Based on direct inspection of the todos.jsonl data:

| ID  | Title (abbreviated)            | Inferred Type | Inferred Stage | Inference Rule                                                                            |
| --- | ------------------------------ | ------------- | -------------- | ----------------------------------------------------------------------------------------- |
| T1  | Repo analysis skill            | project       | COMPLETE       | status=completed, completedAt set                                                         |
| T2  | Dev dashboard                  | project       | IMPLEMENT      | progress="Started Session #245", status=in-progress, #frontend                            |
| T3  | debt-runner expansion          | project       | RESEARCH       | progress="Research done. Blocked on T2", status=blocked — research done, plan not started |
| T4  | Multi-layer memory             | project       | PLAN           | progress="Research complete. Execution next." — research done, execution=plan             |
| T5  | Worktree management            | project       | RESEARCH       | progress="Testing Direction F", status=in-progress, brainstorm done → still researching   |
| T6  | Plan orchestration             | project       | PLAN           | progress="Wave 1 done. Blocked on T3" — wave 1 complete = some planning done              |
| T7  | SWS CANON enforcement          | project       | PLAN           | progress="Blocked on T6" — dependent on planning upstream                                 |
| T8  | Custom agents                  | project       | COMPLETE       | status=completed, completedAt set                                                         |
| T9  | Agent stalling — investigation | project       | IDEA           | status=pending, progress="" — not started                                                 |
| T10 | Install Codex plugin           | project       | COMPLETE       | status=completed, completedAt set                                                         |
| T11 | /todo skill                    | project       | COMPLETE       | status=completed, completedAt set                                                         |
| T12 | GitHub Health skill            | project       | PLAN           | progress="Starting /deep-plan. Research complete" — plan phase                            |
| T13 | Research-Discovery Standard    | project       | PLAN           | progress="Changes identified, plan updates not yet made" — planning updates needed        |
| T14 | Learnings analysis skill       | project       | RESEARCH       | progress="Research in progress in separate worktree" — research active                    |
| T15 | Audit .gitignore               | task          | null           | Single-sentence description, empty progress, #maintenance only                            |
| T16 | Claude Code OS                 | project       | RESEARCH       | progress="Brainstorm complete...Next: Domain 01 Internal Archaeology" — research phase    |
| T17 | (ID gap — not in file)         | n/a           | n/a            | ID T17 does not exist in todos.jsonl (gap in sequence)                                    |
| T18 | deep-research metadata gap     | project       | COMPLETE       | status=completed, completedAt set                                                         |
| T19 | Internal testing suite         | task          | null           | status=pending, empty progress, single-sentence description                               |
| T20 | Alert refresh mechanisms       | task          | null           | status=pending, empty progress, short description                                         |

**Summary:** 15 projects, 3 tasks (T15, T19, T20), 1 ID gap (T17 absent)

**Confidence by record:**

- HIGH confidence (unambiguous): T1, T8, T10, T11, T18 (completed status +
  date), T15, T19, T20 (clear task signals)
- MEDIUM confidence (clear progress signal): T3, T4, T5, T12, T13, T14, T16
- LOW confidence (ambiguous): T2 (in-progress but progress text is minimal), T6,
  T7 (blocked with upstream dependency)

**Manual review recommended for LOW-confidence items before committing the
migration.**

### Migration Entry Template

For each project record, the initial `stage_history` entry should be:

```json
{
  "from": null,
  "to": "RESEARCH",
  "at": "2026-04-04T00:00:00Z",
  "by": "migration",
  "skipped": [],
  "reason": "retroactive_v2_migration: inferred from progress='Research in progress in separate worktree'"
}
```

The `reason` field should include the specific inference rule that fired, quoted
with the source evidence. This allows future review to validate or correct the
inference without re-reading all 19 original records.

---

## 7. Gaps Identified

**GAP-1: T2 (Dev Dashboard) stage ambiguity.** T2 has `status: "in-progress"`
and `progress: "Started Session #245"`. This is minimal signal — the project was
started but there is no indication whether it is in BRAINSTORM, RESEARCH, or
IMPLEMENT stage. The tags `#frontend` suggest implementation work, but "Started"
is ambiguous. **Recommendation:** manually set T2 to `IMPLEMENT` (since a dev
dashboard would start at design/implementation, not research) but mark for user
confirmation.

**GAP-2: `blocks` / `blocked_by` field population.** The todos already have
informal blocking relationships in the `progress` text (T3 blocks T6, T6 blocks
T7, T2 blocks T3). The migration heuristic does not address populating `blocks`
and `blocked_by` arrays from these implicit references. A separate extraction
pass (regex on progress text for "Blocked on T\d+") would cover most cases, but
would need manual validation.

**GAP-3: Zod 4 compatibility with Verzod.** Verzod (the principled migration
library) requires Zod 3.22.0 as a peer dependency. SoNash uses Zod 4.3.6. If
Verzod is ever revisited as a dependency, a compatibility layer or fork would be
needed. This gap is accepted — the custom migration script approach does not
have this dependency.

**GAP-4: No JSONL line-level atomicity guarantee.** The existing
`safeWriteFileSync` (used by render-todos.js) writes to a temp file and renames,
providing atomic write behavior. The migration script MUST use this function (or
the equivalent) rather than a direct `fs.writeFileSync`. If it uses a direct
write and crashes mid-write, the JSONL file can be corrupted. This is mitigated
by the Git backup step, but the script should be defensive regardless.

**GAP-5: The V1→V2 migration is one-way only as written.** The migration script
as designed has no `--rollback` mode (beyond `git checkout`). This is acceptable
for a 20-record file but becomes a limitation if the migration pattern is used
for larger JSONL files in the future (e.g., if todos.jsonl grows to 200+
records). A future improvement: store a pre-migration backup at
`.planning/todos.jsonl.v1.bak` before writing.

---

## 8. Source List

| #   | URL / File Path                                                                                      | Title                                           | Type          | Trust Tier     | CRAAP Score | Date       |
| --- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------- | -------------- | ----------- | ---------- |
| 1   | `.planning/todos.jsonl`                                                                              | Live todo data (19 records)                     | filesystem    | T1 HIGH        | 5.0         | 2026-04-04 |
| 2   | `scripts/planning/render-todos.js`                                                                   | Todo renderer — field access patterns           | filesystem    | T1 HIGH        | 5.0         | 2026-03-31 |
| 3   | `.claude/skills/todo/SKILL.md`                                                                       | /todo skill — mutation rules                    | filesystem    | T1 HIGH        | 5.0         | 2026-03-31 |
| 4   | `scripts/reviews/lib/schemas/shared.ts`                                                              | BaseRecord Zod schema with schema_version       | filesystem    | T1 HIGH        | 5.0         | 2026-03-18 |
| 5   | `scripts/reviews/migrate-retros.js`                                                                  | Retros bulk migration script (precedent)        | filesystem    | T1 HIGH        | 5.0         | 2026-03-18 |
| 6   | `scripts/reviews/migrate-ecosystem-v2.js`                                                            | Ecosystem v2 migration (precedent)              | filesystem    | T1 HIGH        | 5.0         | 2026-03-18 |
| 7   | https://www.dataexpert.io/blog/backward-compatibility-schema-evolution-guide                         | Backward Compatibility Schema Evolution         | web-blog      | T2 MEDIUM-HIGH | 4.0         | 2025       |
| 8   | https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html        | Confluent Schema Evolution & Compatibility      | official-docs | T1 HIGH        | 4.8         | 2025       |
| 9   | `scripts/planning/lib/read-jsonl.js`                                                                 | JSONL parser — filter behavior                  | filesystem    | T1 HIGH        | 5.0         | 2026-03-31 |
| 10  | https://learn.microsoft.com/en-us/samples/azure-samples/cosmos-db-design-patterns/schema-versioning/ | Azure Cosmos DB Schema Versioning Pattern       | official-docs | T1 HIGH        | 4.8         | 2024       |
| 11  | https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html        | Confluent Schema Registry — Compatibility Types | official-docs | T1 HIGH        | 4.8         | 2025       |
| 12  | https://zod.dev/v4/changelog                                                                         | Zod v4 Migration Guide                          | official-docs | T1 HIGH        | 5.0         | 2025       |
| 13  | https://zod.dev/v4                                                                                   | Zod v4 Release Notes                            | official-docs | T1 HIGH        | 5.0         | 2025       |
| 14  | https://artium.ai/insights/event-sourcing-what-is-upcasting-a-deep-dive                              | Event Sourcing Upcasting Deep Dive              | web-blog      | T3 MEDIUM      | 3.8         | 2025       |
| 15  | https://event-driven.io/en/simple_events_versioning_patterns/                                        | Simple Event Versioning Patterns                | web-blog      | T2 MEDIUM-HIGH | 4.0         | 2024       |
| 16  | https://martendb.io/events/versioning.html                                                           | Marten Events Versioning                        | official-docs | T1 HIGH        | 4.5         | 2025       |
| 17  | https://github.com/AndrewBastin/verzod                                                               | Verzod — Zod versioned migration library        | open-source   | T2 MEDIUM      | 3.8         | 2024       |
| 18  | https://www.npmjs.com/package/write-file-atomic                                                      | write-file-atomic npm                           | official-docs | T1 HIGH        | 4.5         | current    |
| 19  | `scripts/reviews/render-reviews-to-md.ts`                                                            | Reviews renderer — lenient parse comment        | filesystem    | T1 HIGH        | 5.0         | 2026-03-18 |
| 20  | https://app.studyraid.com/en/read/12384/399934/schema-versioning-strategies                          | Schema Versioning Strategies                    | educational   | T3 MEDIUM      | 3.5         | 2024       |
| 21  | `.claude/skills/todo/REFERENCE.md`                                                                   | /todo schema, output contract                   | filesystem    | T1 HIGH        | 5.0         | 2026-03-31 |
| 22  | https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing                         | Event Sourcing Pattern — Azure Architecture     | official-docs | T1 HIGH        | 5.0         | 2024       |

---

## Contradictions

**C1 — Upcaster (lazy migration on read) vs. bulk migration (one-shot
rewrite).** Event sourcing literature strongly favors upcasters for immutable
event logs (never rewrite stored events). The SoNash todos.jsonl is mutable (the
`/todo` skill rewrites the full file on every mutation). These are different
paradigms: event logs (immutable, append-only) vs. state files (mutable,
full-file rewrite). The contradiction is resolved by the mutable nature of
todos.jsonl — bulk migration is the correct approach for a mutable state file.
Upcasters apply to immutable event logs.

**C2 — Zod 4 default behavior change creates a migration risk for partial
updates.** Zod 4 (SoNash's version) applies `.default()` even when a field is
entirely absent. Zod 3 only applied defaults to invalid (present but undefined)
values. For the `/todo` Edit operation (which reads the full record, modifies
one field, writes back), this should not matter because the full record is
written. But if any code path does a partial patch (updating only `progress`
without reading the full record), Zod 4 `.default()` could reset optional
fields. The SKILL.md rule 6 ("Read the full file, apply changes in memory, Write
the full file back") prevents this — the risk exists only if that rule is
violated.

**C3 — Verzod vs. custom migration script.** Verzod provides a principled typed
API for migration chains. A custom script is simpler but less reusable. The
source authority is split: the verzod GitHub repo recommends using the library
(self-serving), while the SoNash codebase precedent (migrate-retros.js,
migrate-ecosystem-v2.js) shows custom scripts work perfectly at this scale.
Resolution: custom script is preferred given the Zod 4 compatibility gap in
Verzod. Reassess Verzod if todos.jsonl grows to 200+ records and migration
chains become complex.

---

## Confidence Assessment

- HIGH claims: 9 (Findings 1, 2, 3, 4, 5, 8, 9, 10, 12, 13)
- MEDIUM claims: 3 (Findings 6, 7, 11)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

The codebase evidence is ground-truth quality (direct file reads from 9 distinct
source files). External web sources (Confluent, Azure, Zod official docs) are
Tier 1 HIGH trust. No training data was used as a primary source. The one area
of genuine uncertainty is the type/stage inference for LOW-confidence todos (T2,
T6, T7), which is explicitly flagged for manual review.
