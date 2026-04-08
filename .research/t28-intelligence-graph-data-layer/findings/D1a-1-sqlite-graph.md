# Findings: SQLite as Graph Database Backend (T28 Intelligence Graph)

**Searcher:** deep-research-searcher **Profile:** docs + web **Date:**
2026-04-07 **Sub-Question:** D1a-1

---

## Summary

SQLite + simple-graph schema (nodes + edges tables with JSON columns) is
well-validated for T28's scale. Real-world evidence: code-review-graph handles
6,285 nodes / 27,117 edges at 128ms update latency; codebase-memory-mcp
demonstrates 2.1M nodes / 4.9M edges with sub-10ms queries. T28's target (~10K
nodes, 20K+ edges over years) is well within SQLite's demonstrated ceiling.
better-sqlite3 is the correct Node.js driver. WAL mode provides adequate
concurrency. Flat #tag search requires a junction table (not json_each()).
Recursive CTEs work for traversal but need depth caps on dense graphs.

---

## Key Findings

### 1. The simple-graph Schema Is Minimal, Battle-Tested, and Well-Indexed [CONFIDENCE: HIGH]

The canonical simple-graph schema (from `dpapathanasiou/simple-graph`) uses two
tables:

```sql
CREATE TABLE IF NOT EXISTS nodes (
    body TEXT,
    id   TEXT GENERATED ALWAYS AS (json_extract(body, '$.id')) VIRTUAL NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS edges (
    source     TEXT,
    target     TEXT,
    properties TEXT,
    UNIQUE(source, target, properties) ON CONFLICT REPLACE,
    FOREIGN KEY(source) REFERENCES nodes(id),
    FOREIGN KEY(target) REFERENCES nodes(id)
);

CREATE INDEX IF NOT EXISTS id_idx ON nodes(id);
CREATE INDEX IF NOT EXISTS source_idx ON edges(source);
CREATE INDEX IF NOT EXISTS target_idx ON edges(target);
```

Key design decisions:

- `id` is a **virtual generated column** extracted from the JSON body — no id
  duplication, full JSON schema flexibility
- The `UNIQUE(source, target, properties) ON CONFLICT REPLACE` enables
  idempotent upserts
- Indexes on `source` and `target` are essential for traversal performance
- The `properties` column on edges is TEXT (JSON), enabling typed/weighted
  relationships

### 2. Recursive CTE Traversal Works, But Has a Known Cycle-Handling Limitation [CONFIDENCE: HIGH]

SQLite's recursive CTEs support graph traversal via `WITH RECURSIVE`. The
`UNION` operator deduplicates visited nodes, preventing infinite cycles on DAGs.

**Critical limitation (Keith Medcalf, SQLite contributor):** When multiple paths
lead to the same node, UNION deduplication prevents revisiting but the CTE still
generates multiple intermediate paths before deduplication. For large graphs
with many redundant paths, this causes slowdowns.

**Performance data (1M-node tree):**

- Recursive CTE: 0.63s–7.7s (hardware-dependent)
- Manual unrolled joins: 0.24s–3.9s

**T28 recommendation:** Always include `LIMIT` or depth cap on CTE traversal
queries. For 2-3 hop queries at T28 scale, performance should be sub-second.
Open-ended traversals need depth limits.

### 3. T28 Scale Is Well Within SQLite's Demonstrated Ceiling [CONFIDENCE: HIGH]

Real-world production evidence from `code-review-graph` (SQLite-backed):

| Repository | Nodes | Edges  | Update Latency |
| ---------- | ----- | ------ | -------------- |
| FastAPI    | 6,285 | 27,117 | 128ms          |
| Flask      | 1,446 | 7,974  | 95ms           |
| Gin        | 1,286 | 16,762 | 111ms          |

`codebase-memory-mcp` pushes further — 49K nodes, 196K edges (Django), sub-1ms
Cypher queries, with the Linux kernel tested at **2.1M nodes / 4.9M edges** with
dead-code detection in ~150ms.

**SQLite at T28 scale (~10/day over 2-3 years ≈ 7,300–10,950 sources + edges):**
Write load negligible. Properly indexed queries return in single-digit ms for
point lookups, sub-second for shallow traversals.

### 4. Write Performance for Incremental OLTP Inserts Is Non-Issue [CONFIDENCE: HIGH]

better-sqlite3: 53,693 ops/s for insertUser benchmark. At ~10 inserts/day, T28
accumulates ~3,650 rows/year — orders of magnitude below SQLite's write ceiling.

**Best practice:** Batch each ingestion session in `BEGIN ... COMMIT`.
Auto-commit (one transaction per statement) is dramatically slower for
multi-insert operations.

### 5. WAL Mode Provides Adequate Concurrency [CONFIDENCE: HIGH]

SQLite WAL mode:

- **Writers don't block readers** — Claude can query during ingestion
- **Readers don't block writers** — ingestion completes without waiting
- **Single-process guarantee** — T28 runs in one Node.js process, WAL-index uses
  heap memory

**Critical note:** SQLite 3.51.0–3.51.2 had a WAL-reset database corruption bug.
Fixed in **3.51.3 (2026-03-13)**. better-sqlite3 v12.8.0 bundles 3.51.3. Verify
when installing.

### 6. better-sqlite3 Is the Correct Node.js Driver [CONFIDENCE: HIGH]

- **vs. node:sqlite (Node 22 built-in):** Requires `--experimental-sqlite` flag,
  maintainers "recommend against production use"
- **vs. sql.js:** WASM-based, in-memory only, no file persistence without manual
  serialization
- **vs. sqlite3 (node-sqlite3):** Asynchronous API, lower performance

better-sqlite3 v12.8.0 supports Node.js v22 with prebuilt binaries for LTS
versions. Windows install may require Visual Studio Build Tools if prebuilt
unavailable.

### 7. Tag Search: Junction Table, Not json_each() [CONFIDENCE: HIGH]

Simon Willison's March 2026 benchmark (100K rows, 6.5 tags/row):

| Strategy                                              | Performance             |
| ----------------------------------------------------- | ----------------------- |
| Many-to-many join table                               | **Best** — sub-1.5ms    |
| Materialized lookup (JSON + generated virtual column) | Close second            |
| FTS5 virtual table                                    | Third                   |
| JSON array + `json_each()`                            | **Much slower** — avoid |

**T28 recommendation:** Add a `node_tags` junction table:

```sql
CREATE TABLE node_tags (
    node_id TEXT REFERENCES nodes(id),
    tag     TEXT NOT NULL
);
CREATE INDEX idx_node_tags_tag ON node_tags(tag);
CREATE INDEX idx_node_tags_node ON node_tags(node_id);
```

### 8. Existing MCP Wrappers Confirm the Pattern [CONFIDENCE: MEDIUM]

Multiple production MCP servers use SQLite as graph backend:

- **codebase-memory-mcp** (DeusData): 17 node types, 17 edge types, 2.1M nodes
  tested
- **code-review-graph** (tirth8205): Direct nodes/edges SQLite schema, up to
  6,285 nodes
- **knowledgegraph-mcp** (n-r-w): Entity + Relation schema with tags and
  exact-match search
- **LiteGraph**: SQLite-backed property graph with MCP integration and 145+
  tools

Pattern confirmed: SQLite + nodes/edges + JSON bodies is the de facto
lightweight graph backend for MCP-integrated knowledge systems.

---

## Sources

| #   | Title                                        | Type                | Trust  |
| --- | -------------------------------------------- | ------------------- | ------ |
| 1   | simple-graph schema.sql (dpapathanasiou)     | Official repo       | HIGH   |
| 2   | simple-graph traverse.template               | Official repo       | HIGH   |
| 3   | SQLite Recursive CTEs (sqlite.org)           | Official docs       | HIGH   |
| 4   | SQLite Write-Ahead Logging (sqlite.org)      | Official docs       | HIGH   |
| 5   | SQLite JSON Functions (sqlite.org)           | Official docs       | HIGH   |
| 6   | SQLite 3.51.3 Release Notes                  | Official docs       | HIGH   |
| 7   | better-sqlite3 Performance Guide             | Official docs       | HIGH   |
| 8   | better-sqlite3 GitHub                        | Official repo       | HIGH   |
| 9   | code-review-graph GitHub                     | Tier 2 repo         | MEDIUM |
| 10  | codebase-memory-mcp GitHub                   | Tier 2 repo         | MEDIUM |
| 11  | SQLite Tags Benchmark (Willison, March 2026) | Community           | HIGH   |
| 12  | SQLite Forum: BFS Graph Traversal            | Official community  | HIGH   |
| 13  | SQLite Forum: CTE vs Manual Joins            | Official community  | HIGH   |
| 14  | better-sqlite3 vs Node 22 sqlite discussion  | Official discussion | HIGH   |
| 15  | knowledgegraph-mcp GitHub                    | Tier 2 repo         | MEDIUM |
| 16  | LiteGraph GitHub                             | Tier 2 repo         | MEDIUM |

---

## Contradictions

1. **CTE performance characterization:** Some sources say "negligible for
   shallow traversals," SQLite forum shows 2x-10x slower for recursive CTEs vs
   manual joins. **Resolution:** Both true for different topologies. T28's
   sparse knowledge graph favors CTEs being adequate.

2. **json_each() for array search:** Tutorials suggest it as natural; Willison's
   2026 benchmark shows it's "much slower." **Resolution:** Junction table is
   correct for T28's primary tag search.

3. **Scale ceiling characterization:** Some say "degrades at a few thousand
   nodes;" codebase-memory-mcp demonstrates 2.1M nodes. **Resolution:**
   Degradation applies to unoptimized/unindexed schemas only.

---

## Gaps

1. No direct benchmark for recursive CTE at exactly 5K nodes / 20K edges in
   sparse knowledge graph topology
2. WAL-reset bug exact conditions not fully characterized for single-process
   scenarios
3. Node.js v22 + Windows 11 prebuilt binary — confirmed via general LTS
   guarantee but no explicit statement found
4. simple-graph is Python-centric — Node.js usage requires raw SQL, no npm SDK

---

## Serendipity

1. **SQLite 3.51.3 WAL-reset corruption fix** (2026-03-13) — critical safety
   note, verify in better-sqlite3 bundle
2. **Simon Willison's March 2026 tags benchmark** — directly applicable to T28's
   flat #tag requirement
3. **codebase-memory-mcp 2.1M node demonstration** — highest-scale SQLite graph
   evidence found, far above T28 needs
4. **LiteGraph** — emerging SQLite-backed property graph with 145+ MCP tools,
   potential drop-in if simple-graph DIY proves insufficient
