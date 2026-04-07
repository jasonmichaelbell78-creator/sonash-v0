# D3: MCP Memory Server Internals

**Searcher:** deep-research-searcher | **Profile:** web+docs+codebase |
**Date:** 2026-04-07 **Sources:** 9 | **Confidence:** HIGH:8, MEDIUM:2

---

## Verdict: INSUFFICIENT for T28

The official MCP memory server (`@modelcontextprotocol/server-memory`) is a
proof-of-concept, not a production knowledge graph.

### Storage Backend [HIGH]

- **JSONL flat file** (`memory.jsonl`)
- Every operation (including reads) deserializes the ENTIRE file into memory
- Every mutation REWRITES the entire file
- No indexes, no caching, no WAL

### Data Model [HIGH]

```typescript
Entity { name: string, entityType: string, observations: string[] }
Relation { from: string, to: string, relationType: string }
KnowledgeGraph { entities: Entity[], relations: Relation[] }
```

**Missing for T28:** No timestamps, no confidence scores, no IDs, no metadata on
relations, no typed properties, no provenance.

### Operations (9 tools) [HIGH]

`create_entities`, `create_relations`, `add_observations`, `delete_entities`,
`delete_observations`, `delete_relations`, `read_graph`, `search_nodes`,
`open_nodes`

**Missing:** No pagination, no graph traversal, no algorithms, no filtered
queries.

### Search [HIGH]

Case-insensitive `.includes()` substring scan across entity name, type, and
observations. **O(N × observations)** per query. No FTS, no vector, no fuzzy.

### Scale Limits [HIGH]

- GitHub Issue #2415 (July 2025, still open): degradation at ~80K tokens in file
- Go reimplementation warns JSONL "not recommended" for >50 entities
- At T28 scale (1000 entities, 5000 relations): multi-second latency, ~850MB
  RAM, full-file rewrites

### Drop-in Alternatives [MEDIUM]

| Alternative                      | Backend              | Speed                  | Same API?          |
| -------------------------------- | -------------------- | ---------------------- | ------------------ |
| `mcp-memory-enhanced`            | SQLite               | 15-250x faster         | Yes (same 9 tools) |
| `agent-memory-store`             | BM25+semantic hybrid | 100K chunk scale       | Different API      |
| `knowledgegraph-mcp`             | SQLite/PostgreSQL    | Up to 100K entities    | Similar API        |
| `ViralV00d00/claude-code-memory` | Neo4j                | Proper graph traversal | Different API      |

### Key Correction

The package is `@modelcontextprotocol/server-memory`, NOT
`@anthropic/mcp-memory`. And it may NOT be what's currently configured as
"memory" in this project's MCP setup — needs verification.
