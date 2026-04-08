# Diagnosis: T28 Content Analysis System

**Date:** 2026-04-08 **Task:** Build the Content Analysis System — two
user-facing skills (`/analyze` + `/recall`), 4 source-type handlers, unified Zod
schema, queryable data layer, synthesis within router, data migration.

## ROADMAP Alignment

**Aligned.** T28 is tracked in SESSION_CONTEXT.md as P1. Falls within the Meta
Tooling & Infrastructure bucket. Supports the ROADMAP vision by improving the
research/extraction workflow that feeds both SoNash and JASON-OS decisions.

## Brainstorm Context

Brainstorm completed this session
(`.research/content-analysis-system/BRAINSTORM.md`).

**Chosen direction:** Two user-facing commands (`/analyze` and `/recall`), 4
source-type handlers behind a router, unified Zod schema, queryable data layer,
synthesis within router. Ships complete — no MVP, no phases.

**Anti-goals:** Don't let infrastructure eat the project. Don't require users to
know which skill to call. Don't build 12 separate skills. Don't break existing
skills.

**Open questions from brainstorm (7):** Queryable data layer design, universal
schema fields, existing skill adaptation, media transcription approach,
cross-type synthesis, router type detection, migration plan.

## Prior Research (Reference Only)

| Research                      | Location                                       | Relevance                                                                                                                                      |
| ----------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Analysis/synthesis comparison | `.research/analysis-synthesis-comparison/`     | Schema drift findings, Zod recommendation. **Directly applicable.**                                                                            |
| T28 data layer                | `.research/t28-intelligence-graph-data-layer/` | SQLite/FTS5 findings **directly inform the queryable store component.** Not the project, but the research for this specific component is done. |
| T27 media extraction          | Extraction journal + Session #266 repos        | Transcription architecture. **Informs media handler.**                                                                                         |
| Unstructured-io patterns      | Extraction journal entries #143-155            | Auto-routing, type detection. **Informs router design.**                                                                                       |

## Prior Extraction Context

Relevant candidates from extraction-journal.jsonl:

- **Auto-routing via type detection** (unstructured-io) — `partition()` detects
  file type, routes to format-specific handler. Core pattern for `/analyze`
  router.
- **Strategy fallback chain** (unstructured-io) — AUTO→HI_RES→OCR_ONLY→FAST maps
  to Quick/Standard/Deep with graceful degradation.
- **Don't build per-format parsers in TypeScript** (unstructured-io
  anti-pattern) — delegate parsing to existing tools, focus on orchestration.
- **Ingest-Query-Lint operational triad** (karpathy gist) — Ingest=`/analyze`,
  Query=`/recall`, Lint=existing health scripts. Gap: no unified orchestration.

## Relevant Existing Systems

| System                   | Relationship      | Key Facts                                                                                                                                                    |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| repo-analysis v4.3       | Handler to adapt  | 24 analyzed repos. `analysis.json` uses camelCase, `summaryBands` A-F grades, `creatorLens` string.                                                          |
| website-analysis v1.1    | Handler to adapt  | 5 analyzed sites. `analysis.json` uses snake_case, `value_axes` 0-100 scores, `key_claims` array.                                                            |
| repo-synthesis v1.3      | Merge into router | Reads from `.research/repo-analysis/*/`. Min 3 repos.                                                                                                        |
| website-synthesis v1.1   | Merge into router | Reads from `.research/website-analysis/*/`. Min 3 sites.                                                                                                     |
| CONVENTIONS.md           | Expand            | 11 sections: phase markers, write-to-disk, prose, bands, fit scoring, SKILL/REF split, no silent skips, self-audit, home context, retro, extraction context. |
| extraction-journal.jsonl | Migrate + expand  | 168 entries, schema v2.0. Fields: source_type, source, candidate, type, decision, novelty, effort, relevance.                                                |
| source-slug-map.json     | Use in migration  | 18 source-to-directory mappings (13 repos + 5 websites). All verified.                                                                                       |

## Schema Drift (Confirmed)

The analysis/synthesis comparison research (60 claims) identified critical
schema drift between repo and website analysis:

| Dimension            | repo-analysis               | website-analysis             |
| -------------------- | --------------------------- | ---------------------------- |
| Schema version key   | `schemaVersion`             | `schema_version`             |
| Scoring model        | `summaryBands` (A-F grades) | `value_axes` (0-100 numeric) |
| Creator output       | `creatorLens` (string)      | `key_claims` (array)         |
| Metadata structure   | Flat `metadata` object      | Nested `meta` object         |
| Depth flag syntax    | `--depth=standard`          | `--standard`                 |
| value-map candidates | Has `tier`, `confidence`    | Has `personal_fit`           |

**This drift is the primary technical challenge.** The unified schema must
reconcile these differences without breaking the existing skills.

## Verified Claims

| Claim                                         | Verification                                               |
| --------------------------------------------- | ---------------------------------------------------------- |
| 168 extraction journal entries                | `wc -l extraction-journal.jsonl` → 168 ✓                   |
| 24 repo analysis directories                  | `ls .research/repo-analysis/` excluding \_ prefixed → 24 ✓ |
| 5 website analysis directories                | `ls .research/website-analysis/` → 5 site dirs ✓           |
| CONVENTIONS.md has 11 sections                | Read file — 11 numbered sections ✓                         |
| repo-analysis at v4.3                         | Read SKILL.md frontmatter ✓                                |
| website-analysis at v1.1                      | Read SKILL.md frontmatter ✓                                |
| No scripts/content-analysis/ exists           | Glob returned empty ✓                                      |
| source-slug-map.json has 18 verified mappings | Node script confirmed 18 OK, 0 MISS ✓                      |

## Current Data Storage Gap

**Today:** Data lives in flat files with no indexing or query capability.

| File                        | Entries        | Query method today      |
| --------------------------- | -------------- | ----------------------- |
| extraction-journal.jsonl    | 168            | Grep / read entire file |
| analysis.json (per source)  | 29 files       | Read individually       |
| value-map.json (per source) | 29 files       | Read individually       |
| EXTRACTIONS.md              | 1 summary file | Human skim / grep       |

**The gap:** No way to ask "show me all high-novelty architecture patterns"
without Claude reading hundreds of lines. At 168 entries this is manageable. At
500+ it breaks down. At 1000+ it's unusable.

**Research available:** The T28 data layer research (73 claims, HIGH confidence)
concluded SQLite + better-sqlite3 + FTS5 is the right queryable store. Key
findings: FTS5 handles 85% of real query patterns, M2M junction tags for
filtering, content-hash for incremental sync, full rebuild from files in under 1
second. This research directly serves the queryable store component — it just
isn't the whole project.

## Reframe Check

No reframe needed. The brainstorm already reframed T28 from "intelligence graph
data layer" back to "unified content analysis system." The diagnosis confirms
the task is what it appears to be — a skill unification project with a data
management component.

**Recommendation:** Proceed as stated.
