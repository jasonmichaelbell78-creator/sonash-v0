# D6: Entity/Relation Schema Patterns for T28

**Searcher:** deep-research-searcher | **Profile:** web+academic | **Date:**
2026-04-07 **Sources:** 22 | **Confidence:** HIGH:8, MEDIUM:4, LOW:1

---

## Recommended T28 Schema

### 3 Node Types (Goldilocks: 3-7 optimal)

**1. SourceNode** — One per analyzed artifact

- Required: uuid, name, source_type (enum:
  repo|website|pdf|audio|social|api|...), url/path, ingested_at, status
  (active|deprecated)
- Optional: summary (post-analysis), embedding, raw_content_hash (dedup),
  attributes{}

**2. KnowledgeNode** — Extracted patterns, anti-patterns, capabilities,
decisions, facts

- Required: uuid, name, labels (Pattern|AntiPattern|Decision|Capability|Fact),
  summary, embedding
- Optional: confidence, frequency (how many sources cite this), attributes{}

**3. ThemeNode** — Cross-source emergent clusters (community detection output)

- Required: uuid, name, summary, embedding, member_count
- Derived periodically via label propagation, not manually created

### 6 Edge Types (Goldilocks: 5-15 optimal)

1. `EXTRACTED_FROM` (KnowledgeNode → SourceNode): provenance
2. `ALSO_SEEN_IN` (KnowledgeNode → SourceNode): secondary source reference
3. `CONTRADICTS` (KnowledgeNode ↔ KnowledgeNode): conflicting knowledge
4. `REFINES` (KnowledgeNode → KnowledgeNode): updated/improved version
5. `RELATED_TO` (KnowledgeNode ↔ KnowledgeNode): generic semantic relationship
6. `MEMBER_OF` (KnowledgeNode → ThemeNode): cluster membership

### Base Properties (all nodes)

| Property    | Type        | Required                                 |
| ----------- | ----------- | ---------------------------------------- |
| uuid        | string      | Yes                                      |
| name        | string      | Yes                                      |
| labels      | string[]    | Yes (min 1)                              |
| created_at  | datetime    | Yes                                      |
| source_type | enum string | Yes                                      |
| summary     | string      | KnowledgeNode: yes, SourceNode: optional |
| embedding   | float[1536] | Before retrieval                         |
| attributes  | dict        | Optional (schema-free extension)         |
| status      | enum        | Yes (active/deprecated)                  |

### Base Edge Properties

| Property         | Type             | Required                               |
| ---------------- | ---------------- | -------------------------------------- |
| uuid             | string           | Yes                                    |
| type             | string (ALLCAPS) | Yes                                    |
| source_node_uuid | string           | Yes                                    |
| target_node_uuid | string           | Yes                                    |
| created_at       | datetime         | Yes                                    |
| fact             | string           | Optional (natural language statement)  |
| fact_embedding   | float[]          | Optional                               |
| valid_at         | datetime         | Optional (event time)                  |
| invalid_at       | datetime         | Optional (when fact ceased being true) |
| confidence       | float 0.0-1.0    | Optional                               |
| attributes       | dict             | Optional                               |

## Key Design Laws

1. **Open World Assumption** — absence of a fact ≠ false. New source types, edge
   types, labels all valid immediately without migration.
2. **Typed Core + Free Extension** — strongly-typed base properties +
   schema-free `attributes` dict.
3. **Soft Deprecation, Never Deletion** — set `status: deprecated` or
   `invalid_at` timestamp. Enables time-travel queries.

## Three-Tier Node Hierarchy

```
Tier 1: SourceNode (raw, immutable)     ← "what was analyzed"
    ↓ EXTRACTED_FROM
Tier 2: KnowledgeNode (extracted, mutable) ← "what was learned"
    ↓ MEMBER_OF
Tier 3: ThemeNode (emergent, derived)   ← "what clusters emerged"
```

Maps to Graphiti's Episodes → Entities → Communities.

## Extension Rule

New edge types: valid immediately (OWA). New KnowledgeNode labels: valid via
`labels` array. New source_type values: extend enum. **No migration ever
required.**

## Anti-Pattern Lifecycle (from DIAL-KG)

When anti-pattern from source A is resolved in source B: deprecate original
`EXTRACTED_FROM` edge (don't delete), add `REFINES` edge from resolution to
original. Full evolution history preserved.
