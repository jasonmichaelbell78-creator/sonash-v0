# Findings: Academic Memory Architecture Patterns for T28

**Searcher:** deep-research-searcher **Profile:** academic + web **Date:**
2026-04-07 **Sub-Question:** D4

---

## Summary

Four key academic systems evaluated: MemSkill (meta-learning, not applicable),
A-MEM (7-field Zettelkasten nodes, directly applicable), MAGMA (4-graph
decomposition, research-grade), Graphiti/Zep (production-proven, best-in-class
for T28). "Dual-Embedding Memory Bank" confirmed non-existent in MemSkill.
Recommendation: Graphiti patterns as foundation, A-MEM nodes as schema
inspiration, defer MAGMA and MemSkill to future versions.

---

## Key Findings

### 1. "Dual-Embedding Memory Bank" Does Not Exist in MemSkill [CONFIDENCE: HIGH]

Confirmed false. The paper (arXiv:2602.02474) describes two distinct stores:
**Trace-Specific Memory Bank** (stores facts per interaction) and **Shared Skill
Bank** (reusable memory operations). Two separate embedding models:
**Qwen3-Embedding-0.6B** (Controller scoring) and **Contriever** (memory
retrieval). Neither constitutes a "Dual-Embedding Memory Bank."

**T28 implication:** MemSkill's architecture is not applicable. It's a
meta-learning system for evolving memory extraction procedures, requiring RL
training loops. The span-level processing insight (group history into spans, not
turns) is useful for ingestion design.

### 2. MemSkill: Meta-Learning, Not Graph [CONFIDENCE: HIGH]

Controller-Executor-Designer RL loop: Controller (MLP) selects skills per text
span, Executor (LLM) generates memory updates, Designer (LLM) evolves skill
bank. LoCoMo score 50.96-52.07. Strong cross-model generalization (LLaMA → Qwen
transfer without retraining).

**T28 applicable:** Span-level processing only. Defer the RL infrastructure.

### 3. A-MEM: Multi-Attribute Nodes Directly Applicable [CONFIDENCE: HIGH]

A-MEM (arXiv:2502.12110, NeurIPS 2025) implements Zettelkasten-inspired memory
with 7-field nodes:

```
{c_i, t_i, K_i, G_i, X_i, e_i, L_i}
= content, timestamp, keywords, tags, contextual_description, embedding, links
```

**Bidirectional evolution:** New memory arrives → retrieve top-k similar → LLM
judges whether to link and whether to update existing nodes' contextual
descriptions. Emergent patterns without explicit ontology.

**Performance:** ~1,200 tokens/operation (85-93% reduction vs baselines).
Retrieval: 0.31μs to 3.70μs across 1K to 1M memories. 847 GitHub stars.

**T28 applicable patterns:**

- 7-field schema (keywords + tags + contextual_description as separate
  attributes)
- Bidirectional link evolution (retrieve-then-LLM-judge before writing)
- On-demand link generation matches T28's on-demand synthesis

### 4. MAGMA: Research-Grade, Defer to T28 v2 [CONFIDENCE: HIGH]

Four orthogonal graphs over same node set: **Temporal** (ordered pairs),
**Causal** (logical entailment), **Semantic** (cosine similarity), **Entity**
(object permanence). Intent-aware query router: "Why?" → causal graph, "When?" →
temporal graph.

**Benchmarks (verified):** LoCoMo 0.700 vs A-MEM 0.580. The 45.5% figure refers
to relative margin vs weakest baseline (MemoryOS 0.553), confirmed accurate.
LongMemEval 61.2% using only 0.7k-4.2k tokens vs 100K+ for baselines.

**T28 implication:** Architecturally powerful but four separate graph
structures + vector DB + async consolidation is substantial operational overhead
for first graph project. RRF query fusion is transferable. Revisit at v2.

### 5. Graphiti/Zep: Best-In-Class, Production-Proven [CONFIDENCE: HIGH]

Three-tier hierarchy: **Episode Subgraph** (raw, non-lossy) → **Semantic Entity
Subgraph** (extracted entities + relationships) → **Community Subgraph**
(label-propagation clusters with summaries). 24.6K GitHub stars, supports Neo4j,
FalkorDB, Kuzu, Neptune.

**Bi-temporal edge model:** Every edge carries 4 timestamps —
creation/expiration in transaction time, validity start/end in event time.
Contradictions → old edges **invalidated** (expiration set), not deleted. Full
historical lineage preserved.

**Retrieval pipeline:** φ (search: cosine + BM25 + BFS) → ρ (reranker:
RRF/MMR/cross-encoder) → χ (constructor).

**Benchmarks (verified):** DMR 94.8%, LongMemEval gpt-4o 71.2% (+18.5% vs
baseline), ~90% latency reduction, 1.6K tokens avg vs 115K baseline.

**T28 applicable patterns:**

- `group_id` isolation (per-session namespacing without separate DBs)
- `add_episode()` API (raw text + reference_time → automatic extraction)
- `valid_at`/`invalid_at` on edges for temporal queries
- **Fact Ratings** — developer-accessible confidence scores (maps to per-node
  confidence)
- Community summaries for high-level synthesis

### 6. Per-Node Confidence: Zep Fact Ratings [CONFIDENCE: MEDIUM]

Academic literature supports confidence ∈ [0,1] from co-occurrence frequency,
recency decay, source authority, relationship type. Zep's "Fact Ratings" is the
only verified production API exposing this as developer-accessible filter during
retrieval. **Gap:** Whether Fact Ratings are in open-source graphiti-core or Zep
managed service only is unconfirmed.

### 7. Meta-Architecture Recommendation [CONFIDENCE: MEDIUM]

| System   | Use for T28                                                                                     | Status            |
| -------- | ----------------------------------------------------------------------------------------------- | ----------------- |
| Graphiti | Foundation — bi-temporal edges, Episode→Entity→Community, hybrid search, group_id, Fact Ratings | Production-proven |
| A-MEM    | Schema inspiration — 7-field nodes, bidirectional evolution, retrieve-then-judge                | Adapt patterns    |
| MAGMA    | Defer — 4-graph decomposition, RRF fusion                                                       | T28 v2            |
| MemSkill | Defer — span-level processing insight only                                                      | T28 v3+           |

---

## Sources

| #   | Title                                                     | Type          | Trust  |
| --- | --------------------------------------------------------- | ------------- | ------ |
| 1   | MemSkill arXiv:2602.02474 (HTML)                          | arXiv paper   | HIGH   |
| 2   | A-MEM arXiv:2502.12110 (HTML)                             | arXiv paper   | HIGH   |
| 3   | Graphiti/Zep arXiv:2501.13956 (HTML)                      | arXiv paper   | HIGH   |
| 4   | MAGMA arXiv:2601.03236 (HTML)                             | arXiv paper   | HIGH   |
| 5   | Graphiti GitHub (24.6K stars)                             | Official repo | HIGH   |
| 6   | A-MEM GitHub (847 stars)                                  | Official repo | HIGH   |
| 7   | Memory in the Age of AI Agents (survey, arXiv:2512.13564) | Survey        | HIGH   |
| 8   | FluxMem arXiv:2602.14038                                  | arXiv paper   | MEDIUM |
| 9   | Graphiti + FalkorDB blog                                  | Official blog | MEDIUM |
| 10  | Comprehensive Graphiti Guide (Medium)                     | Community     | MEDIUM |
| 11  | Memory Systems in AI Agents (analyticsvidhya)             | Industry blog | MEDIUM |

---

## Contradictions

1. **Contriever vs Qwen3-Embedding in MemSkill:** Not contradictory — two models
   for two roles (Controller scoring vs memory retrieval). Prior research
   implied Contriever was the sole model.

2. **MAGMA production status:** Paper open-sources modular code but acknowledges
   "additional storage and engineering complexity." GitHub URL has typo (MAMGA
   vs MAGMA).

3. **Graphiti open-source vs Zep managed:** Some features (Fact Ratings,
   higher-level APIs) may be Zep-managed-only, not in open-source graphiti-core.
   Critical for T28's confidence requirement.

---

## Gaps

1. MAGMA GitHub (MAMGA) repo existence/activity not verified
2. Zep Fact Ratings in open-source vs managed service — critical for T28
3. A-MEM "A-mem-sys" production implementation not researched
4. On-demand vs automatic synthesis configuration in Graphiti not verified

---

## Serendipity

1. **FluxMem Beta Mixture Model** — probabilistic distribution-aware filtering
   instead of hard cosine thresholds. Principled alternative for retrieval
   quality.
2. **FalkorDB ~3x faster than Neo4j** for point lookups (O(1) Redis hash tables,
   1.1ms startup). Serious Neo4j alternative for solo developer.
3. **Two-phase ingestion consensus** — raw storage first, consolidation second.
   Matches T28's on-demand synthesis and prevents write-time latency.
4. **EverMemOS** — memory as OS primitive. Direction the field is moving. T28
   v3+ consideration.
