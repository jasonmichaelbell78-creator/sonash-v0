# Findings: Graphiti/Zep Architecture Deep Dive

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-07 **Sub-Question:** D14-2

---

## Summary

Deep dive into WHY Graphiti's decisions were made. Bi-temporal edges solve
out-of-order episode arrival. LLM-per-ingest is expensive and there's an open
issue (#1299) requesting no-LLM mode. FalkorDB became default over Neo4j for
latency (496x claim) and multi-tenancy. Label propagation chosen over Leiden for
incremental update cost, not quality. MCP "experimental" means API stability not
guaranteed. Pydantic custom types work via docstring→LLM context injection.
**T28 should adopt:** soft invalidation, hybrid retrieval (no LLM at query
time), Pydantic type patterns, edge type maps. **T28 should reject:**
LLM-per-ingest, full bi-temporal T' axis, MCP server for ingest, Kuzu backend.

---

## Key Findings

### 1. Why Bi-Temporal Edges [CONFIDENCE: HIGH]

Episodes arrive out of chronological order. Without separating "when did this
happen" from "when did the system learn," temporal reconstruction is impossible.
Soft invalidation (set invalid_at, never delete) preserves audit history.

**T28:** Don't need full bi-temporal T' axis. Adopt `valid_at`/`invalid_at` for
soft invalidation only.

### 2. LLM-Per-Ingest Cost [CONFIDENCE: MEDIUM]

Multiple LLM calls per `add_episode()`: entity extraction, edge extraction,
dedup resolution, temporal assignment. No published token counts anywhere. Open
issue #1299 (March 2026, 4 upvotes) requests no-LLM mode.

**Escape hatch:** `add_fact_triple()` — pre-extracted facts, bypasses extraction
LLM calls. Dedup behavior without pre-controlled UUIDs is unclear.

**T28:** Strongest argument to NOT adopt LLM-per-ingest. Files are already
structured. Use lighter custom pipeline.

### 3. Backend Evolution [CONFIDENCE: HIGH]

- **Neo4j (original):** Mature graph ops, Lucene FTS, established
- **FalkorDB (now default):** 496x lower latency claim, multi-tenancy at all
  tiers, Redis-protocol
- **Kuzu (embedded):** Zero-server local dev. **Archived Oct 2025.** PR #1296
  open for LadybugDB migration.
- **Neptune:** Enterprise AWS cloud-native, contributed by AWS team

README recommends Neo4j "for production." FalkorDB is default for new projects.

### 4. Why Label Propagation Over Leiden [CONFIDENCE: HIGH]

**Not quality — incremental update cost.** Leiden requires full recomputation.
Label propagation allows single recursive step when new entity arrives.
Trade-off: "communities gradually diverge" → periodic full refreshes needed.

Paper does NOT describe "dual-algorithm" (Leiden batch + LP incremental) — uses
LP as primary with periodic refreshes. Bug #1086 fixed oscillation in LP
implementation.

### 5. MCP "Experimental" [CONFIDENCE: MEDIUM]

Covers: API stability (tool signatures may change), transport (broke
SSE→Streaming HTTP in 1.0), provider coverage (9 hardcoded entity types). Does
NOT cover: core Python library (4,000+ lines of tests).

**T28:** Don't depend on MCP server API stability for core data layer. Use
library directly.

### 6. Pydantic Custom Types [CONFIDENCE: HIGH]

Class docstring → LLM type description via `_build_entity_types_context()`. LLM
classifies by auto-incremented `entity_type_id` integer. Attributes validated
through Pydantic constructor. `edge_type_map` constrains
`(source_label, target_label) → [allowed_types]`.

**Bug #1111:** Custom edge attributes not extracted for first-time edges — only
subsequent appearances. Correctness concern for new graphs.

### 7. T28 Adoption Guidance [CONFIDENCE: MEDIUM]

**Adopt:**

- Soft invalidation (valid_at/invalid_at)
- Hybrid retrieval (semantic + BM25 + graph, no LLM at query time)
- Pydantic custom types via docstrings
- Edge type maps with typed attributes
- Label propagation for community detection (if needed later)

**Reject:**

- LLM-per-ingest via add_episode()
- Full bi-temporal T' audit axis
- MCP server for ingest pipeline
- Kuzu backend (archived)
- Community detection at launch

---

## Sources

| #    | Title                               | Type          | Trust  |
| ---- | ----------------------------------- | ------------- | ------ |
| 1    | arXiv:2501.13956 (Zep paper)        | Academic      | HIGH   |
| 2    | Beyond Static Graphs blog           | Official      | HIGH   |
| 3-4  | Custom Entity Types docs + DeepWiki | Official/wiki | HIGH   |
| 5-7  | GitHub issues #1299, #1193, #1132   | Issues        | MEDIUM |
| 8    | Graphiti + FalkorDB blog            | Vendor        | MEDIUM |
| 9-10 | 20K stars blog, MCP server docs     | Official      | HIGH   |
| 11   | KuzuDB archived news                | News          | MEDIUM |

---

## Contradictions

1. **FalkorDB 496x claim vs Neo4j "for production" recommendation** — likely
   maturity, not performance.
2. **"Dual-algorithm" framing vs paper** — paper uses LP only with periodic
   refreshes, not Leiden batch.

---

## Gaps

1. Actual LLM call count per episode — no benchmarks published anywhere
2. `add_fact_triple()` dedup behavior without pre-controlled UUIDs
3. LadybugDB adoption PR #1296 status
4. Leiden in current codebase — not confirmed

---

## Serendipity

1. **Kuzu archival** eliminates the obvious embedded no-server option for
   Graphiti
2. **FalkorDB 1.0 broke SSE→Streaming HTTP** — confirms experimental label is
   genuine
