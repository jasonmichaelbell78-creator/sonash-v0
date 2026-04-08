# Findings: Graphiti/Zep Schema Patterns Deep Dive

**Searcher:** deep-research-searcher **Profile:** docs + web **Date:**
2026-04-07 **Sub-Question:** D6-1

---

## Summary

Deep dive into Graphiti's exact schema from source code. Bi-temporal edges use 4
timestamps across 2 timelines (event time + system time). Three-tier hierarchy:
EpisodicNode → EntityNode → CommunityNode (plus undocumented SagaNode as 4th
tier). RRF uses k=1 (not standard k=60). Non-destructive contradiction: old
edges invalidated, never deleted. **Critical: No native confidence/fact_rating
field exists** in open-source graphiti-core — secondary sources claiming this
are incorrect. Must be added via custom Pydantic models in `attributes` dict.
Community detection uses Leiden (batch) + label propagation (incremental).

---

## Key Findings

### 1. Bi-Temporal Edge Model: Four Fields [CONFIDENCE: HIGH]

**Event time (T):**

- `valid_at: datetime | None` — when fact became true in real world
  (LLM-extracted)
- `invalid_at: datetime | None` — when fact stopped being true (set by
  contradiction detection)

**System time (T'):**

- `created_at: datetime` — when edge entered database
- `expired_at: datetime | None` — when edge superseded by newer info

**Enabled queries:**

- Current facts: `WHERE invalid_at IS NULL AND expired_at IS NULL`
- Point-in-time:
  `WHERE valid_at <= X AND (invalid_at IS NULL OR invalid_at > X)`
- Ingestion history: filter on `created_at` range
- Invalidation log: `WHERE expired_at IS NOT NULL`

Each edge also carries `reference_time` (source episode's valid_at) and
`episodes: list[str]` (UUID provenance chain).

### 2. Three-Tier Hierarchy: Exact Schema [CONFIDENCE: HIGH]

**Base Node (all types):** uuid, name, group_id, labels, created_at

**EpisodicNode (raw source):**

- source: EpisodeType (message|text|json)
- source_description, content, valid_at
- entity_edges: list[str] (extracted edge UUIDs)

**EntityNode (extracted knowledge):**

- name_embedding: list[float] (1024-dim)
- summary: str (LLM-generated)
- attributes: dict[str, Any] (custom Pydantic fields)
- labels: list[str] (includes custom types e.g. ["Entity", "Person"])

**CommunityNode (cluster summaries):**

- name_embedding, summary (collated from member EntityNodes)

**SagaNode (UNDOCUMENTED 4th tier):**

- summary, first_episode_uuid, last_episode_uuid, last_summarized_at
- Narrative container for episode sequences

**Edge types:**

- EpisodicEdge: base fields only (Episode→Entity)
- EntityEdge: full temporal model + name, fact, fact_embedding, episodes,
  attributes
- CommunityEdge: HAS_MEMBER (Community→Entity)

### 3. RRF: k=1, Not Standard k=60 [CONFIDENCE: HIGH]

```python
score[uuid] += 1 / (i + rank_const)  # rank_const = 1
```

Three search methods in parallel (cosine, BM25, BFS), equal weighting. Top
result gets score 1.0 (vs ~0.016 with standard k=60). Intentionally aggressive
top-position scoring.

**Alternative rerankers:** rrf (default), node_distance, episode_mentions, mmr
(lambda 0-1), cross_encoder (normalized [0,1]).

### 4. Non-Destructive Contradiction [CONFIDENCE: HIGH]

Pipeline: New edge extracted → fetch semantically similar existing edges → LLM
classifies as duplicate/contradicted/new → contradicted edges get `invalid_at`
set to new edge's `valid_at`, `expired_at` set to current time. **Old edges
NEVER deleted.** Out-of-order episodes resolved by sorting on `valid_at`.

### 5. group_id Isolation [CONFIDENCE: HIGH]

Required field on ALL nodes and edges. Passed to `add_episode()`, inherited by
all downstream extractions. All queries auto-inject
`WHERE group_id = $group_id`. Cross-group queries NOT natively supported — must
execute separate queries per group and merge in application.

### 6. Fact Ratings / Confidence: NOT IN OPEN-SOURCE [CONFIDENCE: MEDIUM]

**No `confidence_score` or `fact_rating` field exists** on EntityEdge or
EntityNode in graphiti-core source code. Secondary sources claiming "every edge
gets a confidence level" are incorrect — they conflate validity window semantics
with confidence.

**What exists instead:** temporal validity as confidence proxy, cross-encoder
scores at query time (ephemeral, not stored), RRF/MMR scores (computed per
query, not persisted).

**T28 implementation path:** Add `confidence: float` to custom Pydantic model →
stored in `attributes` dict → queryable as native property in Neo4j/FalkorDB
(but JSON string in Kuzu).

### 7. Community Detection [CONFIDENCE: HIGH]

- **Batch rebuild:** `build_communities()` — Leiden algorithm (removes all
  existing, rebuilds)
- **Incremental:** `update_communities=True` in `add_episode` — label
  propagation
- Summaries: LLM-generated at entity level, assembled at community level
- arXiv paper says "label propagation" — only true for incremental path

### 8. T28 Schema Adaptation [CONFIDENCE: HIGH]

| T28                 | Graphiti                   | Implementation                                      |
| ------------------- | -------------------------- | --------------------------------------------------- |
| SourceNode          | EpisodicNode               | `source=text`, `source_description="markdown file"` |
| KnowledgeNode       | EntityNode + custom type   | Pydantic with confidence, tags, claim_type          |
| ThemeNode           | CommunityNode              | `build_communities()` on demand                     |
| Flat #tags          | Entity labels + attributes | `labels` list or `attributes["tags"]`               |
| Per-node confidence | Custom attribute           | `confidence: float` in Pydantic model               |
| On-demand synthesis | `build_communities()`      | Manual trigger only                                 |

Custom entity type example:

```python
class KnowledgeClaim(BaseModel):
    confidence: float = Field(0.8)
    tags: list[str] = Field(default_factory=list)
    claim_type: str = Field("insight")  # insight|fact|opinion|question
```

**Attributes storage warning:** Neo4j/FalkorDB flatten as native properties
(queryable). Kuzu serializes as JSON string (requires parsing).

---

## Sources

| #     | Title                                   | Type          | Trust       |
| ----- | --------------------------------------- | ------------- | ----------- |
| 1     | arXiv:2501.13956 (Zep paper)            | Academic      | HIGH        |
| 2-3   | Graphiti nodes.py, edges.py source      | Source code   | HIGH        |
| 4     | Custom Entity/Edge Types docs           | Official      | HIGH        |
| 5     | DeepWiki getzep/graphiti                | Wiki analysis | MEDIUM-HIGH |
| 6     | search_utils.py (RRF implementation)    | Source code   | HIGH        |
| 7-8   | Graph Namespacing docs, Multi-tenancy   | Official/Wiki | HIGH        |
| 9     | Beyond Static Knowledge Graphs blog     | Vendor blog   | MEDIUM      |
| 10    | search_config.py source                 | Source code   | HIGH        |
| 11    | dedupe_edges.py prompts                 | Source code   | HIGH        |
| 12-17 | Various Zep docs, comparisons, examples | Mixed         | MEDIUM      |

---

## Contradictions

1. **Community algorithm:** arXiv says "label propagation" — current code uses
   Leiden for batch, label propagation for incremental only.
2. **Confidence field:** Secondary sources claim it exists. Source code shows it
   doesn't. Secondary sources are wrong.
3. **RRF k constant:** Standard is k=60. Graphiti uses k=1. Intentional.

---

## Gaps

1. MAX_SEARCH_DEPTH, DEFAULT_MMR_LAMBDA exact defaults not publicly documented
2. Zep Cloud may have additional confidence fields — no Cloud API schema
   accessible
3. Community detection performance at thousands of nodes not benchmarked
4. SearchFilters.property_filters schema not fully extracted
5. SagaNode absent from official docs — only in source code

---

## Serendipity

1. **SagaNode** — undocumented narrative container. Could represent T28
   "document series" or "author corpus."
2. **Attributes differ by backend:** Neo4j/FalkorDB = native properties
   (queryable). Kuzu = JSON string. Critical for T28 backend selection.
3. **Pydantic docstrings drive LLM extraction** — descriptive class docstrings
   improve extraction precision.
4. **edge_type_map enforces domain constraints** — prevents LLM from inventing
   arbitrary edge types.
5. **Zep Community Edition deprecated** — self-hosted path is graphiti-core + DB
   directly.
