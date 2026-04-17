---
name: recall
description: >-
  Query the Content Analysis System (CAS) knowledge base. Search extraction
  candidates, filter by tags/type/source, search across all analyzed sources.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.2
**Last Updated:** 2026-04-17
**Status:** ACTIVE
**Tier:** Standard
<!-- prettier-ignore-end -->

# Recall

`/recall` is the query layer of the Content Analysis System (CAS) — the T28 epic
that turns analyzed sources into a searchable knowledge base. Everything
analyzed via `/analyze` (or a direct handler) is queryable here. "Extraction
candidates" are individual ideas, patterns, or findings extracted during
`/analyze` runs and journaled to `.research/extraction-journal.jsonl`.

**TL;DR:** SQLite-backed query primitive over CAS extractions. Default = FTS5
free-text search. Common flags: `--tag`, `--type`, `--sort`, `--source`,
`--target=sources`, `--stats`, `--limit`. Auto-rebuilds index if missing. See
`.planning/content-analysis-system/DECISIONS.md` for architecture.

## Routing

```
"Query what's in the index"           → /recall
"Synthesize patterns across sources"  → /synthesize  (cross-source interpretation)
"Analyze a new URL/file"              → /analyze     (or direct handler)
"Search filesystem text"              → Grep         (file substrate, not extractions)
```

Pipeline: `/analyze` → writes extractions → `/recall` queries → `/synthesize`
interprets → `/deep-plan` / `/brainstorm` consume.

`/recall` is a **query primitive** — use inside discovery workflows or
standalone for exploration.

## When to Use

- Query the CAS knowledge base after running `/analyze`
- Filter extractions by tag, type, source, or date
- Explore what's been extracted before starting new analysis
- List all analyzed sources (`/recall --target=sources`)
- **Prior-art scan before `/deep-plan` or `/brainstorm`** — per CLAUDE.md
  PRE-TASK rule, scan `/recall --tag=<topic>` before building/improving anything

## When NOT to Use

- Analyzing a new source → use `/analyze` or a direct handler first
- Cross-source synthesis / patterns / opportunity matrices → use `/synthesize`.
  `/recall` **queries** the index; `/synthesize` **interprets** it.
- Raw filesystem search for arbitrary text → use Grep. `/recall` searches
  extracted knowledge (SQLite-backed); Grep searches files directly.

## Input

```
/recall <search terms>                  # FTS5 free-text (quote multi-word; OR/NOT/prefix* — see REFERENCE.md §1.1)
/recall --tag=architecture              # Filter by tag
/recall --type=<repo|website|document|media>   # Filter by source type
/recall --sort=<recent|novelty>         # Sort (novelty = high/medium/low, set during /analyze)
/recall --source=unstructured           # By specific source (slug or partial — LIKE match)
/recall --target=sources                # List analyzed sources instead
/recall --stats                         # Show index statistics
/recall --limit=30                      # Adjust result limit (default 20)
```

**Combine filters:**

```
/recall "plugin architecture" --type=repo --sort=novelty   # cross-source idea discovery
/recall --tag=anti-pattern --type=website
/recall --target=sources --type=media
```

## Critical Rules

1. **MUST Auto-rebuild if missing.** Don't error on missing index — rebuild from
   `.research/` files. If rebuild fails, surface sanitized error; do not fall
   back to file-based search.
2. **MUST Transform JSON to readable format.** The script outputs JSON on
   stdout; `/recall` transforms it into human-readable presentation in chat.
3. **MUST Show result count.** "Found N results" or "No results found." Result
   header echoes the full filter set (e.g., "Found 8 results for architecture
   --tag=pattern --type=repo").
4. **MUST Suggest refinements on empty results.** If zero results: suggest
   broader terms + `/recall --stats` for available tags. If index is empty (zero
   sources analyzed): suggest `/analyze <url>` to populate.
5. **MUST Surface errors cleanly.** Invalid flags, invalid enum values, and
   non-positive `--limit` surface error + Usage hint; do not silently default.
   FTS5 syntax errors (malformed query) → surface parse error + suggest quoting
   the query.
6. **MUST Handle corrupt DB recoverably.** If DB is unreadable or corrupt,
   surface sanitized error + suggest `rm .research/content-analysis.db` followed
   by `/recall` (triggers rebuild from source files).
7. **SHOULD State inferences.** If user query is ambiguous natural language
   (rather than explicit flags), infer sensible flags and state the inference in
   the result header ("Interpreting as: `/recall <terms> --sort=X`"). User can
   correct via Follow-Up Options.
8. **SHOULD Degrade gracefully on missing vocabulary.** If
   `.research/tag-vocabulary.json` is missing/invalid, tag grouping falls back
   to `orphan_tags` only — rebuild vocab via `/analyze` retag or
   `node scripts/cas/retag.js`.

## How It Works

0. **Check index:** if `.research/content-analysis.db` is missing, rebuild (see
   §When Index Is Missing) — safe to re-run; rebuild is idempotent.
1. **Parse the query** (free text, flags, or both).
2. **Run `node scripts/cas/recall.js`** with parsed arguments. Script outputs
   JSON on stdout, result count on stderr.
3. **Present results** using the mode-appropriate format: extraction list
   (default), source listing (`--target=sources`), or stats (`--stats`). 3a. If
   zero results, present refinement suggestions per Critical Rule 4.
4. **Offer follow-up options** (see §Follow-Up Options).

**Done when:** results presented in mode-appropriate format (or empty-result
suggestions offered), and user selects a follow-up option or says "Done."

## Presenting Results

Each result comes with **category-aware tag groupings** per
`.claude/skills/shared/CONVENTIONS.md §14`:

- `About:` = `semantic_tags` (flat, middle-dot separated)
- `Type:` = `taxonomic_tags` (artifact type)
- `Legacy tags:` = `orphan_tags` (shown only when non-empty — signals
  un-retagged entries)

### Extraction queries (default)

```
Found 2 results for "architecture":

1. Auto-routing via type detection [pattern]
   Source: unstructured-io/unstructured (repo) | Novelty: high | Effort: E2

   About: knowledge-management · claude-code · multi-agent · jason-os-relevant
   Type: framework

   "partition() auto-detects file type via libmagic, routes to format-specific
   partitioner."

2. Per-site extractor plugin architecture [pattern]
   Source: iawia002/lux (repo) | Novelty: high | Effort: E2

   About: extraction · web-crawling
   Type: utility-tool
   Legacy tags: repo, anti-pattern

   "44-site video downloader with per-site extractor plugins."
```

### Empty-result example

```
No results found for "quantum computing".

Suggestions:
- Broaden your search terms
- Check available tags: /recall --stats
- List all sources: /recall --target=sources
```

### Other modes

For source listing (`--target=sources`) and stats (`--stats`) presentation
formats, see REFERENCE.md §2.2-2.3. For JSON field contracts, see REFERENCE.md
§2.1-2.3.

## Follow-Up Options

After presenting results, offer (select by number or description, e.g., "1" or
"read full"):

1. **Read full analysis** — "Want to read the full analysis for [source]?"
2. **Narrow search** — add a filter (tag, type, source, sort, or limit) on top
   of the last query. E.g., `--tag=architecture`.
3. **Show related** — re-query with `--source=<selected-source>`.
4. **Synthesize** — `/synthesize --type=<selected-type>` for cross-source
   interpretation.
5. **Done** — Return to conversation.

For context-specific follow-ups (source mode, stats mode, empty results), see
REFERENCE.md §3.2-3.4.

## When Index Is Missing

If the SQLite database doesn't exist:

```
Index not found. Building from .research/ files...
[rebuild-index.js prints per-source progress — ~30-60s for 50+ sources]
Done. [N] sources, [M] extractions indexed.
[then runs the query]
```

Rebuild is idempotent — safe to re-run if interrupted. If rebuild fails, surface
sanitized error and suggest manual inspection
(`node scripts/cas/rebuild-index.js --verbose`). Do not fall back to file-based
search (REFERENCE.md §4.3).

## Integration

- **Producers:** `/synthesize`, `/analyze` (router), 4 analysis handler skills
  (`/repo-analysis`, `/website-analysis`, `/document-analysis`,
  `/media-analysis`). Handler `analysis.json` and `synthesis.json` schemas are
  validated during `rebuild-index.js`; schema mismatches surface at rebuild.
- **Downstream consumers:** `/deep-plan`, `/brainstorm`. Note: these skills
  currently access `.research/EXTRACTIONS.md` + `extraction-journal.jsonl`
  directly via Read/Grep (see CLAUDE.md PRE-TASK rule). `/recall` is an
  alternative query surface over the same data.
- **Consumer contract:** `/recall` returns human-readable text inline
  (transformed from `recall.js` JSON on stdout). No file handoff.
- **Future cross-skill gate (aspirational, not yet implemented):** if `/recall`
  ever reads `synthesis.json` directly, it SHOULD gate on
  `synthesis.json.schema_version >= 1.0` — older/unversioned artifacts ignored
  with a WARN and hint "Run `/synthesize` to rebuild." Current implementation
  relies on `rebuild-index.js` for substrate validation.
- **Data substrate:** JSONL (`.research/extraction-journal.jsonl`) is canonical
  for extraction records; SQLite (`.research/content-analysis.db`) is the
  derived queryable index. Per project standards (CLAUDE.md,
  SKILL_STANDARDS.md): JSONL for data, SQLite derived for query.
- **Security:** read-only DB access (`readonly: true`), symlink-refused paths,
  size-guarded file reads (`scripts/lib/security-helpers.js` +
  `scripts/lib/safe-fs.js`).
- **Architecture:** `.planning/content-analysis-system/DECISIONS.md` (T28 epic).
- **Invocation tracking:** logs to `data/ecosystem-v2/invocations.jsonl` per
  SKILL_STANDARDS.md.

## Phase 5: Self-Audit

**Status:** Scaffold — full self-audit.js script deferred to a follow-up
session. See `.planning/skill-audit-recall-phase4/HANDOFF.md` for scope.

Until `scripts/skills/recall/self-audit.js` exists, the "Done when:" gate in
§How It Works serves as the completion criterion. Once the script lands, Phase 5
will invoke:

```bash
node scripts/skills/recall/self-audit.js
```

Covering SKILL_STANDARDS.md Dims 1-5 + 8 (contract) + regression checks for
OPDEP-1 (`--target=sources` standalone), Wave 4 schema framing, and
`scripts/cas/self-audit.js` producer-side validation.

## Version History

| Version | Date       | Description                                                                                                                                                                                                                     |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.2     | 2026-04-17 | Session #285 — full skill-audit pass: primacy fix (Critical Rules moved up), MUST/SHOULD hierarchy, Routing + pipeline, Tier declaration, OPDEP-1/ECO-1/ECO-2 corrections, Phase 5 stub.                                        |
| 1.1     | 2026-04-12 | Session #281 — T40 Part C: category-aware tag display (semantic/taxonomic/orphan) + vocabulary-aware `--stats`. Why: retag work exposed that flat tag lists lose category meaning; fix makes taxonomy visible in query results. |
| 1.0     | 2026-04-08 | Session #269 — Initial creation (T28 CAS).                                                                                                                                                                                      |
