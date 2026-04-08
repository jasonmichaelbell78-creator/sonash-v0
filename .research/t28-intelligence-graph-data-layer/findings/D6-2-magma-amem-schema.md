# Findings: MAGMA and A-MEM Schema Patterns

**Searcher:** deep-research-searcher **Profile:** academic + web **Date:**
2026-04-07 **Sub-Question:** D6-2

---

## Summary

A-MEM 7-field schema verified from arXiv:2502.12110. Keywords (specific
retrieval signals) vs tags (broad categories) are distinct. Bidirectional
evolution is asymmetric — new notes trigger neighbor updates but not vice versa.
MAGMA uses 4 orthogonal edge sets over shared nodes (temporal, causal, semantic,
entity). Goldilocks "3-7 node types, 5-15 edge types" claim is UNVERIFIED folk
wisdom — MAGMA uses 2/4, A-MEM uses 1/1. Single SourceNode with `source_type`
property is valid for 28 source types. Confidence propagation: store
`conf_extract` + `conf_source` per node, use `min()` for synthesis, defer edge
propagation to v2.

---

## Key Findings

### 1. A-MEM 7-Field Node Schema [CONFIDENCE: HIGH]

```
m_i = { c_i, t_i, K_i, G_i, X_i, e_i, L_i }
```

| Field                        | Type          | Description                                            |
| ---------------------------- | ------------- | ------------------------------------------------------ |
| content (c_i)                | text          | Original interaction verbatim                          |
| timestamp (t_i)              | datetime      | When interaction occurred                              |
| keywords (K_i)               | list[str]     | Specific nouns/verbs, 3-7, ordered by importance       |
| tags (G_i)                   | list[str]     | Broad categorical themes (domain, format, type)        |
| contextual_description (X_i) | str           | One LLM-generated sentence: topic, arguments, audience |
| embedding (e_i)              | vector(d)     | Dense vector over concat(c, K, G, X)                   |
| links (L_i)                  | list[node_id] | Semantically linked memory notes                       |

**Keywords vs tags:** Keywords = specific retrieval signals ("photography",
"scenery"). Tags = broad categories ("hobby", "personal development"). Keywords
drive similarity matching; tags classify.

**Embedding formula:** `e_i = f_enc[concat(c_i, K_i, G_i, X_i)]` — all 4 text
fields concatenated before encoding. LLM-generated enrichment directly shapes
embedding space.

Implementations add: `importance_score`, `retrieval_count`, `last_accessed`,
`evolution_history`, `category`.

### 2. A-MEM Bidirectional Evolution — Asymmetric [CONFIDENCE: HIGH]

**Phase 1 — Link Generation:** New note → cosine similarity top-k (k=5-10) → LLM
judges connections → populate L_n.

**Phase 2 — Neighbor Evolution:** For each top-k neighbor, LLM decides:
NO_EVOLUTION, STRENGTHEN, UPDATE_NEIGHBOR, STRENGTHEN_AND_UPDATE. Updates
neighbor's tags (G_j) and contextual_description (X_j).

**IMPORTANT: "Bidirectional" is misleading.** New note triggers updates to
historical notes, but reverse doesn't happen. "Bidirectional" means any note CAN
evolve, not that updates are symmetric.

### 3. MAGMA 4-Graph Decomposition [CONFIDENCE: HIGH]

**Shared node structure:**

```
n_i = ⟨ c_i, τ_i, v_i, A_i ⟩
= content, timestamp, vector, attributes
```

Same nodes participate in all 4 graphs simultaneously — edges differentiate
relational views:

| Graph    | Edge Type                     | Direction  | Inferred By                 |
| -------- | ----------------------------- | ---------- | --------------------------- |
| Temporal | τ_i < τ_j pairs               | Directed   | Automatic (timestamp)       |
| Causal   | S(n_j\|n_i, q) > δ            | Directed   | Slow-path LLM consolidation |
| Semantic | cos(v_i, v_j) > θ             | Undirected | Fast-path vector similarity |
| Entity   | Event → abstract entity nodes | Directed   | Slow-path consolidation     |

**Dual-stream ingestion:**

- Fast path (synaptic): non-blocking — event segmentation, vector indexing,
  temporal backbone. No LLM.
- Slow path (structural): async — LLM infers causal edges and entity links. High
  value, high latency.

**Intent-Aware Router (4 stages):** Query decomposition → multi-signal anchor
(RRF across vector/keyword/temporal) → adaptive beam-search traversal (max 5
hops, 200 nodes) → narrative synthesis with salience-based token budgeting.

### 4. Goldilocks Ranges — UNVERIFIED [CONFIDENCE: LOW]

**"3-7 node types, 5-15 edge types"** — no academic or practitioner source
found. MAGMA uses 2 node types, 4 edge types. A-MEM uses 1 node type, 1 edge
type. Neo4j guidance: "1-2 labels per node suffices in ~95% of well-designed
models." The claim is likely folk wisdom, not validated finding.

### 5. Schema for 28 Source Types [CONFIDENCE: MEDIUM]

**Pattern B recommended:** Single `SourceNode` with
`source_type: "repo"|"pdf"|"arxiv"|...` property. Type-specific properties as
optional/nullable fields. Labels as orthogonal classifiers (`:Processed`,
`:Pending`).

**Anti-pattern:** Separate node types per source creates 28 types with
overlapping schemas. Neo4j guidance: past 4 labels per node, performance
degrades.

Neither MAGMA nor A-MEM was designed for multi-source heterogeneous ingestion.
T28 must design this independently.

### 6. Confidence Propagation [CONFIDENCE: MEDIUM]

Neither A-MEM nor MAGMA implements explicit confidence propagation.

**Academic pattern (arXiv:2405.16929):** Three confidence levels:

- `conf_extract` (0.0-1.0): extraction algorithm confidence
- `conf_source` (tier S0-S3): source reliability
- `conf_trustworthiness`: cumulative, updated as facts verified/refuted

**Dual-Process framework (arXiv:2601.15703):**

- System 1 (fast): Implicit confidence stored with each entry
- System 2 (slow, on-demand): Activates when confidence < threshold (~0.9)

**T28 recommendation:** Store `conf_extract` + `conf_source` per node.
Synthesized outputs inherit `min(conf_extract, conf_source)` of inputs. Do NOT
propagate through graph edges for v1.

---

## T28 Schema Recommendation

**Node types (2):**

1. `SourceNode` — all 28 types via `source_type` property. Fields: id,
   source_type, content_hash, raw_content, url, ingested_at, conf_extract (0-1),
   conf_source (S0-S3), embedding, keywords[], tags[], summary, importance_score
2. `ConceptNode` (optional) — entity/concept aggregation. Fields: id,
   canonical_name, aliases[], first_seen, last_seen

**Edge types (4):**

1. `LINKS_TO` — semantic link (weight 0-1, reasoning text)
2. `CITES` — directional provenance
3. `MENTIONS` — SourceNode → ConceptNode
4. `SUPERSEDES` — version/update relationship

**Evolution:** A-MEM-style top-5 cosine neighbor enrichment on ingestion. Do NOT
implement MAGMA slow-path for v1.

---

## Sources

| #   | Title                                          | Type          | Trust       |
| --- | ---------------------------------------------- | ------------- | ----------- |
| 1   | A-MEM arXiv:2502.12110v9 (HTML)                | arXiv/NeurIPS | HIGH        |
| 2   | MAGMA arXiv:2601.03236v1 (HTML)                | arXiv         | HIGH        |
| 3-4 | A-MEM implementations (WujiangXu, agiresearch) | GitHub        | HIGH        |
| 5   | MAMGA community implementation                 | GitHub        | MEDIUM      |
| 6   | KG Uncertainty Survey arXiv:2405.16929         | arXiv         | HIGH        |
| 7   | Agentic UQ arXiv:2601.15703                    | arXiv         | HIGH        |
| 8   | Anatomy of Agentic Memory arXiv:2602.19320     | arXiv         | HIGH        |
| 9   | A-MEM MCP Server (tobs-code)                   | GitHub        | MEDIUM      |
| 10  | Neo4j Graph Modeling Labels (David Allen)      | Official      | MEDIUM-HIGH |

---

## Contradictions

1. **"Bidirectional" in A-MEM:** Paper claims bidirectional. Implementation is
   asymmetric. "Bidirectional" means any note CAN evolve, not symmetric mutual
   updating.
2. **A-MEM 7 fields vs implementations:** Paper has 7. Both implementations add
   importance_score, retrieval_count, etc.
3. **MAGMA entity node schema:** Paper establishes entity nodes but never
   formally defines their internal schema.
4. **Goldilocks range vs evidence:** MAGMA (2/4) outperforms more complex
   systems. No source validates the 3-7/5-15 claim.

---

## Gaps

1. MAGMA entity node internal schema undefined in paper
2. No official MAGMA open-source release (FredJiang0324/MAMGA is community
   approximation)
3. Confidence propagation through A-MEM links not defined
4. 28-source-type schema untested at scale
5. Performance at thousands of nodes untested in any paper

---

## Serendipity

1. **Embedding over enriched text** — all 4 A-MEM fields concatenated before
   encoding. Extraction quality directly affects retrieval quality.
2. **MAGMA 95% token reduction is structural** — graph retrieval IS the
   compression mechanism.
3. **Format sensitivity doubles in weaker LLMs** — argues for schema-simple
   designs with robust fallbacks.
4. **A-MEM MCP implementation adds edge pruning** — edges >90 days OR weight
   <0.3. T28 needs decay policy.
5. **MAGMA slow path is async by design** — fast ingestion, slow enrichment as
   background jobs.
