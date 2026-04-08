# D7: Codebase Prior Art Synthesis for T28 Retrieval Design

**Searcher:** deep-research-searcher | **Profile:** codebase | **Date:**
2026-04-07 **Sources:** 8 | **Confidence:** HIGH:12, MEDIUM:4

---

## 1. T28 Command Interface (from farzaa 7-command architecture) [HIGH]

| Command         | T28 Meaning                                            |
| --------------- | ------------------------------------------------------ |
| `ingest`        | Register new source (URL, file, feed) — metadata only  |
| `absorb`        | Extract entities/relations into graph                  |
| `query`         | Search graph (hybrid: BM25 + vector + graph traversal) |
| `cleanup`       | Expire stale, resolve duplicates, merge canonicals     |
| `breakdown`     | Split over-dense nodes (anti-cramming)                 |
| `rebuild-index` | Regenerate FTS/vector indexes after bulk mutations     |
| `reorganize`    | Run community detection, update context tree weights   |

**Key insight:** `ingest` ≠ `absorb`. Ingestion is metadata registration,
absorption is semantic extraction. Must be decoupled (rate limits, paywalls,
async fetches).

## 2. Three-Tier Context Tree (from qmd) [HIGH]

- **Tier 1 — Domain:** `personal/`, `professional/`, `technical/`, `creative/`.
  Slowest-changing. Shapes retrieval bias.
- **Tier 2 — Source Type:** 28 types, each with context describing extraction
  quality, temporal decay rate, entity type priors, confidence floor. E.g.,
  "youtube-transcript: spoken language artifacts, timestamps canonical."
- **Tier 3 — Document:** Per-item. Ingestion timestamp, source URL, extraction
  version, bi-temporal markers (t_valid + t_created/t_expired from Graphiti).

**Retrieval impact:** When a match surfaces, parent context flows down. "This
came from video source, confidence in entity names is lower than text sources."

## 3. "Answers Compound into Wiki" (from Karpathy) [HIGH]

**Mechanism:**

1. Agent queries T28 → gets 5 source nodes
2. Agent synthesizes answer
3. Answer becomes new `synthesis` node with edges to all 5 sources
4. Next query: synthesis node ranks HIGHER than raw sources (it's been used +
   confirmed)
5. Wiki self-curates toward conclusions

**Key:** Synthesis nodes eventually eclipse source nodes in ranking. The graph
becomes a living wiki, not just an index.

Uses A-MEM's bidirectional evolution: new node insertion triggers regeneration
of linked nodes' contextual attributes.

## 4. Anti-Cramming / Anti-Thinning Thresholds (from farzaa) [HIGH]

**Split trigger (anti-cramming):**

- > 3 semantically distinct edge clusters pointing to node
- OR >8 observations on a single node
- OR contradictory incoming edges (create sibling nodes per Graphiti pattern)

**Enrich trigger (anti-thinning):**

- <4 observations AND >3 incoming references (stub)
- High cosine similarity to 2+ other nodes (merge candidate)

**15-entry checkpoint cycle:** After every 15 `absorb` operations:

1. Entity dedup pipeline (embed → cosine → FTS → LLM resolver)
2. Cramming violation check
3. Thinning violation check
4. Rebuild FTS + vector indexes
5. Log to `quality-log.jsonl`

## 5. Search-First Interface with Browse Anchor [HIGH]

```
query(text, options?)           # primary: hybrid search, returns nodes+context
browse(collection?, since?)     # secondary: collection or temporal slice
get(node_id)                    # direct: with full context chain
multi_get(node_ids[])           # batch: for graph neighborhood expansion
status()                        # health: node counts, index freshness, density
```

Search-first because 28 source types is too heterogeneous for browse. But browse
is mandatory for temporal navigation ("what did we learn last session?") and
collection views ("show all YouTube sources").

## Serendipity

qmd has dual interface: MCP for Claude Code + CLI `--json` for agent-native
consumption. T28 should consider the same — MCP for integration, CLI for
scripting.
