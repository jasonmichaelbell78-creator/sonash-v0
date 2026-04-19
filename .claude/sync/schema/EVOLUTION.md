# Sync-Mechanism Registry Schema — Evolution Rules

**Version:** 1.0 **Last Updated:** 2026-04-19 **Status:** ACTIVE **Applies to
schema version:** v1.0 **Cross-references:**

- Schema contract: `./SCHEMA.md`
- Authoritative decisions:
  `../../../.planning/piece-2-schema-design/DECISIONS.md` (D4, D5, D20, D31,
  Section 12)
- Enums (machine-readable): `./enums.json`
- Validation schema: `./schema-v1.json`
- Worked examples: `./EXAMPLES.md`

This is the governance document for schema evolution. It tells future operators
what happens when they need to add a field, add an enum value, or rename
something. SCHEMA.md §10 is the executive summary; this document is the full
rulebook.

---

## §1 Versioning Policy

The schema uses **semver-lite: `major.minor`**. v1.0 is current.

| Bump                    | When                                                     | Example                                                                                                                                                                                                         |
| ----------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Minor** (`1.0 → 1.1`) | Non-breaking additions. Existing records still validate. | Add a new enum value, add an optional column with a default, add a per-type extension field.                                                                                                                    |
| **Major** (`1.x → 2.0`) | Breaking changes. Existing records may need migration.   | Remove a field, rename a field, add a required field with no default, tighten a constraint.                                                                                                                     |
| **Patch**               | Not used.                                                | The schema does not have bug fixes separate from its version — a correction that changes the contract is a minor or major bump; a correction that changes only prose in SCHEMA.md is not a version bump at all. |

Every version bump is recorded in SCHEMA.md §11 (Version History) using the
template in §10 of this document.

**Principle:** prefer additive changes. Every renamed or removed field is a
migration event that costs the mirror and any downstream sync tooling. If the
addition can be made without a rename, make it that way.

---

## §2 Adding a New Enum Value (non-breaking, minor bump)

Per **D5**: adding a new value to an enum is a minor version bump. Records that
use the old enum values remain valid.

### Worked example — adding `ToolUseWarning` to `hook_event`

Suppose Claude Code ships a new hook event `ToolUseWarning`, fired when a tool
use emits a non-fatal warning. Today `hook_event` has 9 values (§8.5); after
this change it has 10.

Operator steps:

1. **SCHEMA.md §8.5** — add `ToolUseWarning` to the enum listing, with a
   one-line description of when the event fires.
2. **`enums.json`** — append `"ToolUseWarning"` to the `hook_event` array. Keep
   the alphabetical/grouping order consistent with the rest of the file.
3. **`schema-v1.json`** — if the `hook_event` enum is inlined into the
   validation schema (rather than referenced by `$ref`), add the value there as
   well. If it's referenced, no change needed.
4. **SCHEMA.md §11 (Version History)** — add a row: `1.0 → 1.1`, date, one-line
   description (`Added hook_event value: ToolUseWarning`).
5. **Document the reason** — either in DECISIONS.md (if this is part of a larger
   decision batch) or in a supplementary `DECISIONS-v1.1.md` doc in
   `.planning/piece-2-schema-design/`. The reason matters: future operators need
   to know why the value was added, not just that it was.
6. **Mirror repo** — apply the identical change to the mirrored schema in the
   partner repo (see §8). Do this before the next sync cycle.

### Special case: adding a `type` value

The `type` enum has an additional obligation beyond the 6 steps above: the
`other` auto-upgrade. See §5 for the full walkthrough.

---

## §3 Adding a New Universal Column

Whether this is breaking depends on **default behavior**.

**Non-breaking (minor bump) IF:**

- Field is optional, OR
- Field has a sensible default that can be assigned to every existing record
  without opening the source files (null, empty array, empty string, `false`, a
  fixed literal).

**Breaking (major bump) IF:**

- Field is required AND no default exists, OR
- Field requires per-record computation that can't be done automatically,
  forcing each existing record to be audited.

### Worked example — adding `last_scanned_at` as an optional timestamp

Hypothetical: we want to track when each record was last refreshed by a scan, so
the sync engine can prefer fresh records over stale ones.

This is **non-breaking** — the field is optional and existing records can
default to `null` until the next scan fills them in.

Operator steps:

1. **SCHEMA.md §3** — add the column under the appropriate sub-section.
   `last_scanned_at` most naturally fits §3.5 (Sync mechanics) as it's a
   sync-engine concern. Include: column name, type (`string | null`, ISO-8601
   timestamp), description, rationale pointer.
2. **`schema-v1.json`** — add to the `file_record` properties. Mark as optional
   (not in `required`). Specify format (`"format": "date-time"` for ISO-8601).
3. **EXAMPLES.md** — show the column in at least one example record so operators
   can see the shape.
4. **SCHEMA.md §11** — version history row: `1.x → 1.(x+1)`.
5. **Mirror repo** — per §8.

### Worked example — breaking case

If the same field were made **required** (no null allowed), it would be
breaking: every one of the ~200 existing records would fail validation until
assigned a value. That's a major bump with a written migration plan: see §6.

---

## §4 Adding a New Per-Type Extension Field

**Always non-breaking. Always a minor bump.**

Per-type fields are by definition optional on all other types. Adding a field to
`type: skill` doesn't affect records where `type: agent` — the field simply
isn't in scope for those records.

### Worked example — adding `preferred_model` to skills

Suppose we want to record that `/deep-research` prefers Opus for its
orchestrator even though member agents use Sonnet. Add
`preferred_model: string | null` to the skill per-type extension set.

Operator steps:

1. **SCHEMA.md §9.1** — add the row under "Skills (`type: skill`)".
2. **`enums.json`** — if `preferred_model` is a free string, no enum change. If
   it's constrained to `sonnet | opus | haiku`, reuse the existing `model` enum
   (see §9.2) and note the reuse rather than duplicating.
3. **`schema-v1.json`** — add to the skill-branch conditional. Mark optional.
4. **EXAMPLES.md** — extend the skill example record.
5. **SCHEMA.md §11** — version history row.
6. **Mirror repo** — per §8.

---

## §5 Adding a New `type` Value

Per **D5**: minor bump, non-breaking.

**The `other` upgrade contract (per D4):** files currently tagged `type: other`
that match the new type's pattern are upgraded automatically by the next sync
scan. `other` is a temporary holding cell, not a permanent category. This is
what allows us to add types incrementally without breaking existing records.

### Worked example — adding `custom-widget`

Hypothetical: Claude Code introduces a new file kind under `.claude/widgets/`,
and we decide these warrant their own type rather than being lumped into
`config` or `other`.

Operator steps:

1. **SCHEMA.md §8.1** — add `custom-widget` to the type enum with a one-line
   description.
2. **`enums.json`** — add `"custom-widget"` to the `type` array.
3. **`schema-v1.json`** — if any type-conditional branches in the validation
   schema need updating for this type's extension fields, add that branch. If
   this type introduces no new extension fields (just a plain classification),
   the type enum update in step 2 propagates automatically.
4. **Per-type extensions (optional)** — if the new type needs its own extension
   fields (like §9.1 skills have `reference_layout` etc.), add a SCHEMA.md §9
   sub-section and document them. This is still one minor bump — adding a type
   and its extensions is one change.
5. **EXAMPLES.md** — add an example record for the new type. If the first
   real-world instance won't land until a later piece, the EXAMPLES.md record
   can be annotated `(ecosystem-watch — no instances yet)`.
6. **Auto-upgrade scan** — on the next sync scan, the registry scanner
   identifies any file currently tagged `type: other` that matches the new
   type's pattern (path glob, content sniff, or whatever classification rule is
   used) and upgrades their `type` field to `custom-widget`. This is the D4
   contract in action.
7. **SCHEMA.md §11** — version history row.
8. **Mirror repo** — per §8.

See §7 for more on the `other` escape-valve mechanic.

---

## §6 Removing or Renaming a Field (BREAKING)

Major version bump. Requires a written migration plan. **Discouraged.**

If the field really must go or be renamed, these obligations fire:

1. **Deprecation notice** — record the intent in SCHEMA.md §11 one version
   BEFORE the removal. Example: in v1.4 mark `old_field` as deprecated with a
   note `(removed in v2.0)`. This gives the mirror and downstream tooling a
   window to adapt.
2. **Migration plan** — a written doc (e.g.
   `.planning/piece-2-schema-design/MIGRATION-v2.0.md`) covering:
   - Every existing record's transformation path
   - Data preservation (renames carry values; removals document what's lost)
   - Rollback plan if migration fails mid-flight
   - Validation that post-migration records pass `schema-v2.json`
3. **Dual-schema read window** — the sync engine (Piece 5) must support reading
   both the old and new schema during the migration window. Old records get
   upgraded on read; new records are written in the new shape.
4. **Cutover** — either an explicit date or a version-gate (e.g. "after all
   records have been upgraded and validated, drop v1 read support in v2.1"). The
   cutover removes the dual-schema burden.
5. **Mirror coordination** — both repos migrate in lockstep. See §8.

**Prefer additive alternatives:** if `old_field` has confusing semantics, add
`new_field` alongside it, migrate consumers to `new_field`, and leave
`old_field` in place marked `deprecated`. A future major bump can clean up the
deprecated field when the cost is lower. This keeps the minor-bump cadence
stable.

---

## §7 The `other` Escape-Valve Rule

Per **D4**:

- `other` is a **temporary holding cell** for files that don't fit any current
  type value. It exists so a scan never has to block on "I don't know how to
  classify this."
- **Threshold rule:** if ~3 files accumulate with `type: other`, that's a signal
  that a real type value should be added. Pick a name, add it per §5, and let
  the next scan auto-upgrade the `other` entries.
- **Auto-upgrade contract:** adding a new type triggers a re-classification pass
  on existing `other` records. The contract is explicit (§5 step 6) so operators
  know that adding a type is not just an enum change — it's a promise that
  existing `other` records will be re-sorted.

`other` is not meant to be a stable bucket. A registry with dozens of `other`
records is a sign that the type enum has fallen behind reality.

---

## §8 Mirror Rule

**Any schema change in one repo MUST be applied to the mirror repo before the
next sync cycle.**

The schema is the contract. Mirrored schema means mirrored interpretation.
Desynced schemas mean the same record means different things in JASON-OS than in
SoNash, which is silent sync-bug territory.

### Mirror workflow

1. Change lands in repo A (e.g. JASON-OS). Commit bundles all touched schema
   files together: `SCHEMA.md` + `enums.json` + `schema-v1.json`
   - (if affected) `EXAMPLES.md` + `EVOLUTION.md`.
2. Before the next sync cycle, apply the identical change to repo B (e.g.
   SoNash). This is a dedicated mirror commit — do not mix it with unrelated
   work.
3. The mirror commit message cross-references the repo-A commit SHA:
   `schema(mirror): apply JASON-OS <sha> — add hook_event:ToolUseWarning`.
4. Verify parity after the mirror commit: both repos' `enums.json` files should
   be byte-identical (or intentionally different only for repo-specific values,
   which per the schema-architecture decision should be zero — the enums are
   universal).

### Why this is strict

The sync engine (Piece 5) reads the schema from the _source_ repo to decide how
to port a record. If the target repo's schema lacks a type value the source
uses, the port either crashes or writes an invalid record. Both outcomes are
worse than the mirror commit cost.

---

## §9 Schema Is NOT a Registry Record

Per **DECISIONS.md Section 12** (cross-referenced from the Phase-1 Q4
discussion): the schema is **external meta**. It is the contract that registry
records conform to; it does not have its own file record in `files.jsonl`.

### Reasoning

- **Meta-recursion breaks the mental model.** If the schema were a record, its
  fields would need to describe themselves — including its own `type`,
  `source_scope`, `portability`. That's philosophically tangled without adding
  sync value.
- **Tools that want to reason about the schema read it directly** from the
  filesystem at `.claude/sync/schema/`. They don't query the registry.
- **Mirroring is governed separately** (§8 above). The mirror rule is explicit;
  baking the schema into the registry would hide the mirror obligation behind
  the same machinery that handles ordinary records.

Practical consequence: do not attempt to add `SCHEMA.md`, `enums.json`, or
`schema-v1.json` as file records. If a scanner finds them, it skips them with a
`reason: external-meta` log entry.

---

## §10 Version History Template

Each schema version bump adds one row to SCHEMA.md §11 using this format:

```markdown
| Version | Date       | Description                                                                                                      |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2026-04-19 | Initial release. 26 universal columns + 41 per-type fields + sections + migration-metadata + composites catalog. |
```

### Row-content guidelines

- **Version** — `major.minor`, no `v` prefix.
- **Date** — ISO-8601 (`YYYY-MM-DD`). The date the change lands, not the date it
  was proposed.
- **Description** — one sentence, concrete. Name the change (e.g. "Added
  hook_event value: ToolUseWarning") rather than describing its effect
  ("improved hook routing"). Future operators scanning this history want to know
  what changed, not why — the why lives in DECISIONS.md.

### Conventions for multi-change releases

If a minor bump bundles several changes (e.g. two new enum values + one new
per-type field), write them as a semicolon-separated list in the description:

```markdown
| 1.1 | 2026-05-10 | Added hook_event value: ToolUseWarning; added skill
per-type field: preferred_model. |
```

Breaking changes (major bumps) get a longer description and link to the
migration plan:

```markdown
| 2.0 | 2026-08-01 | Renamed `external_services` to `external_apis`. Migration:
`.planning/piece-2-schema-design/MIGRATION-v2.0.md`. |
```

---

**End of EVOLUTION.md v1.0.**
