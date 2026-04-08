# Findings: Knowledge Compaction and Deduplication Operations

**Searcher:** deep-research-searcher **Profile:** web + academic **Date:**
2026-04-07 **Sub-Question:** D10-2

---

## Summary

Three-tier dedup pipeline: exact match → vector cosine (0.75-0.85 threshold) →
LLM resolver (hard cases only, ~0-3 calls per absorb at T28's volume). Physical
merge for clear duplicates (confidence >= 0.90), SAME_AS edge for ambiguous
pairs. Edge pruning via temporal invalidation (never delete). Node splitting
at >3 edge clusters OR >8 observations. farzaa's 15-entry checkpoint cycle
applies: index rebuild + cramming check + quality audit + split review. Garbage
collection: orphan nodes (no edges) + broken edges + SQLite VACUUM. A-MEM's
90-day/0.3-weight thresholds are UNVERIFIED in the paper.

---

## Key Findings

### 1. Entity Deduplication: Three-Tier Funnel [CONFIDENCE: HIGH]

**Stage 1 — Exact/normalized match:** Lowercase, strip punctuation, collapse
whitespace. Near-zero cost. Catches "SQLite" vs "sqlite".

**Stage 2 — FTS + embedding cosine:** iText2KG threshold: θ_E = 0.8 (0.6 name +
0.4 label weighted embedding). Mem0 + FalkorDB both use 0.7 default. Practical
range: 0.75-0.85 for "definitely same." T28: start at 0.78, calibrate.

**Stage 3 — LLM resolver (hard cases only):** Only for ambiguous band (0.65-0.78
cosine). At ~10 sources/day, fires 0-3 times per cycle. Can run synchronously.

**iText2KG weighted embedding technique:** 0.6 name weight + 0.4 label weight
prevents homonym false merges ("Python" language vs "Python" snake).

### 2. Merge Strategy [CONFIDENCE: MEDIUM-HIGH]

**Physical merge** for clear duplicates (confidence >= 0.90): collapse into one
node, redirect all edges, delete duplicate. Simpler to query.

**SAME_AS edge** for ambiguous pairs: both nodes kept, linked. Deferred-merge
marker for future `/reorganize` pass.

Edge handling: all edges from consumed node redirected to survivor. Duplicate
edges (same source+relation+target) deduplicated to one.

### 3. Edge Pruning: Temporal Invalidation [CONFIDENCE: HIGH]

Graphiti/Zep pattern: **never delete edges**, mark invalid with timestamp.

Triggers: contradiction (newer edge invalidates older), explicit retraction,
confidence below floor.

T28 practical staleness: edge with `confidence < 0.3` AND last seen > 180 days
AND no corroborating sources → candidate for `invalid_at` marking. More
conservative than A-MEM's alleged 90-day (which is UNVERIFIED).

### 4. Node Splitting (Anti-Cramming) [CONFIDENCE: MEDIUM]

farzaa's 150-line rule translated: split when node has >= 3 distinct edge-type
clusters AND >= 8 total observations.

Detection: query nodes with `observation_count > 8`. Fetch adjacent edges, group
by type. If >= 3 types each with >= 3 edges, flag for split review. **Do not
auto-split** — present to user for decision (on-demand philosophy).

No published validation for these specific thresholds — first-principles
heuristic from farzaa.

### 5. Node Enrichment (Anti-Thinning) [CONFIDENCE: MEDIUM]

Detection: `incoming_edge_count >= 3` AND `observation_count < 4` = "thin but
referenced."

Approaches:

1. **Passive:** Next absorb touching connected nodes can expand thin node
2. **Active LLM:** During cleanup, synthesize from adjacent nodes. Mark
   `source: "llm_synthesis"`, `confidence: 0.5`. Superseded by any source-backed
   observation.
3. **Source pull:** Query source archive for mentions not yet linked

Risk: LLM enrichment can hallucinate. Flag with `is_synthesized: true`.

### 6. Checkpoint Cycles [CONFIDENCE: MEDIUM-HIGH]

farzaa's 15-entry cycle adapted for T28:

1. Rebuild node/edge index metadata
2. Recalculate `incoming_edge_count` for all nodes
3. **New node audit:** If zero new nodes in last 15 absorbs → flag cramming
4. **Quality audit:** Re-read 3 most-updated nodes for coherence
5. **Split check:** Flag nodes exceeding thresholds
6. **Structural review:** Assess cluster structure

At ~10 sources/day: fires every 1-2 days. Named operation (`/graph-checkpoint`),
triggered after 15th absorb or manually. On-demand, not background.

### 7. Graph Garbage Collection [CONFIDENCE: MEDIUM]

**Orphan nodes:** No incoming AND no outgoing edges (except stubs marked
`stub: true`).

```sql
SELECT n.id FROM nodes n
WHERE NOT EXISTS (SELECT 1 FROM edges e WHERE e.source_id = n.id OR e.target_id = n.id)
AND n.is_stub = 0;
```

**Broken edges:** Source or target references non-existent node.

**Threshold:** `orphan_count > 5%` of total nodes → trigger cleanup.

**SQLite VACUUM:** After batch deletions, if `freelist_count > 20%` of pages,
run VACUUM.

### 8. Ingestion vs Batch Dedup: Hybrid [CONFIDENCE: HIGH]

- Stage 1 (exact) + Stage 2 (vector): at-ingestion (near-zero cost)
- Stage 3 (LLM resolver): defer to checkpoint cycle
- Flag ambiguous pairs during ingestion, resolve during next checkpoint
- Best of both: clean graph at low cost, thorough resolution on-demand

### 9. Confidence Tracking [CONFIDENCE: MEDIUM]

Simple model: `confidence = min(1.0, source_quality_sum / 5.0)`. Node seen with
quality 0.8 five times = 0.8 confidence. Once = 0.16. Avoids Bayesian
complexity. Store `observation_count` + `source_quality_sum` per node.

During merge: surviving node inherits max confidence of both. OpenCTI: "converge
towards highest confidence."

---

## Sources

| #   | Title                                               | Type           | Trust  |
| --- | --------------------------------------------------- | -------------- | ------ |
| 1   | iText2KG (arXiv:2409.03284) — threshold calibration | Academic       | HIGH   |
| 2   | Mem0 Graph Memory (DeepWiki)                        | Official       | HIGH   |
| 3   | FalkorDB production patterns (Medium)               | Blog           | MEDIUM |
| 4-5 | Graphiti DeepWiki + Zep blog                        | Official       | HIGH   |
| 6   | farzaa personal_wiki_skill.md gist                  | Primary source | HIGH   |
| 7   | Zep arXiv:2501.13956                                | Academic       | HIGH   |
| 8   | A-MEM arXiv:2502.12110                              | Academic       | HIGH   |
| 9   | OpenCTI Deduplication docs                          | Official       | HIGH   |
| 10  | Google EKG Confidence Score                         | Official       | HIGH   |

---

## Contradictions

1. **A-MEM 90-day/0.3-weight thresholds:** Cited in Q&A context but NOT in A-MEM
   paper. May be from GitHub implementation. UNVERIFIED — don't hardcode.
2. **Cosine threshold:** iText2KG says 0.8; Mem0/FalkorDB say 0.7. Range 0.7-0.8
   is well-supported; precise value domain-dependent.
3. **SAME_AS vs physical merge:** No consensus. Physical merge for simple
   personal graphs; SAME_AS for enterprise auditability.

---

## Gaps

1. A-MEM 90-day/0.3-weight values need codebase verification
2. No published research on node-splitting observation thresholds
3. Checkpoint "entry" unit needs T28-specific definition (source ingested? node
   created? edge added?)
4. No published edge weight decay formula for knowledge graphs

---

## Serendipity

1. **Graphiti community detection drift** — label propagation gradually
   diverges. Periodic full recompute safer than incremental.
2. **OpenCTI ±30-day tolerance** for edge deduplication — edges of same type
   within 30 days between same entities merge.
3. **iText2KG weighted name+label embedding** — prevents homonym false merges.
   T28 should adopt.
