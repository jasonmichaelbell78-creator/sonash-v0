# S2: Design Patterns — T28 Intelligence Graph

**Synthesizer:** deep-research-synthesizer **Date:** 2026-04-07 **Sources:** 9
findings files (D4, D6-1, D6-2, D6-3, D11, D12, D14-1, D14-2, D14-3)
**Sub-questions covered:** D4, D6-1, D6-2, D6-3, D11, D12, D14-1, D14-2, D14-3

---

## 1. Executive Summary

All 9 research findings converge on a coherent architecture for T28's
intelligence graph layer. The dominant pattern across every production system
studied — BasicMemory, Palinode, Graphiti, LightRAG, the Obsidian hybrid
retriever, sqlite-memory, IWE — is the same invariant: **files are canonical,
indexes are derived and disposable**. This isn't a preference; it's the design
philosophy that makes every other decision stable. SQLite (not a graph database)
is the right storage tier for T28 v1: the obra/knowledge-graph project proves
this approach at 3,300 nodes, and the Willison benchmark gives exact performance
numbers for the specific tag and metadata queries T28 will run.

For schema, the research narrows T28 to a small, practical design: two node
types (SourceNode + KnowledgeNode), four edge types (LINKS_TO, CITES, MENTIONS,
SUPERSEDES), and a flat tag system using M2M junction tables (1.41ms single-tag
lookups). A-MEM's 7-field node is the right schema inspiration — keywords, tags,
contextual_description, and embedding are all necessary and distinct. Graphiti's
bi-temporal edge model solves out-of-order arrival and contradiction handling,
but T28 should adopt only the event-time half (valid_at/invalid_at) and skip the
system-time audit axis (T'). Per-node confidence belongs in a separate
node_metadata table using Pattern C propagation (base_confidence \* min(1.0,
source_count/3)).

For search and analytics, the research is unambiguous: three-layer hybrid search
(FTS5 + MiniLM 384d vectors + RRF k=60) should be wired from day one — it runs
sub-3ms even on a Raspberry Pi Zero and adds no meaningful overhead at T28's
scale. Graph analytics is complementary, not competing: traversal+search from
day one, Louvain community detection at 500-1,000 nodes (~3-6 months), then
PageRank and betweenness centrality. Graphology (TypeScript-native, handles
Louvain/betweenness/PageRank) over the same SQLite store is the confirmed
working pattern from obra.

---

## 2. Recommended T28 Schema

### Design Principles Driving This Schema

1. Single SourceNode type with `source_type` discriminator — no 28-way table
   explosion
2. A-MEM 7-field nodes as the inspiration template — keywords (retrieval
   signals) + tags (categories) + contextual_description (LLM summary) are all
   distinct and necessary
3. Graphiti bi-temporal edge model (event-time half only) — soft invalidation,
   never delete
4. Flat #tags via M2M junction tables — Willison benchmark proves this is the
   right tradeoff (1.41ms, relational integrity, cascading deletes)
5. Per-node confidence in a separate `node_metadata` table — keeps semantic body
   separate from tracking state

### Node Types (2)

#### SourceNode

All 28 source types via `source_type` discriminator. Shared fields promoted;
type-specific fields in `body` JSON with virtual generated columns for hot
properties.

```sql
CREATE TABLE source_nodes (
  id           TEXT PRIMARY KEY,              -- stable UUID (survives resets)
  source_type  TEXT NOT NULL,                 -- 'repo'|'pdf'|'arxiv'|'audio'|...
  url          TEXT,
  title        TEXT,
  author       TEXT,
  content      TEXT NOT NULL,                 -- raw content verbatim (A-MEM c_i)
  keywords     TEXT,                          -- JSON array, 3-7, ordered by importance
  summary      TEXT,                          -- LLM-generated one-sentence description
  embedding    BLOB,                          -- 384d MiniLM float array (sqlite-vec)
  fetched_at   INTEGER NOT NULL,              -- unix timestamp
  valid_at     INTEGER,                       -- when fact became true (event time)
  invalid_at   INTEGER,                       -- when superseded (soft delete, never remove)
  body         JSON NOT NULL DEFAULT '{}',    -- type-specific fields
  -- promoted hot fields as virtual generated columns:
  confidence   REAL GENERATED ALWAYS AS (
    CAST(json_extract(body, '$.confidence') AS REAL)
  ) VIRTUAL,
  source_tier  TEXT GENERATED ALWAYS AS (
    json_extract(body, '$.source_tier')
  ) VIRTUAL
);

CREATE INDEX idx_source_type    ON source_nodes(source_type);
CREATE INDEX idx_source_valid   ON source_nodes(valid_at)   WHERE invalid_at IS NULL;
CREATE INDEX idx_source_conf    ON source_nodes(source_type, confidence);
CREATE INDEX idx_source_title   ON source_nodes(title);
```

**source_type values (28):** repo, pdf, arxiv, audio, video, tweet,
github-issue, github-pr, hacker-news, reddit, blog-post, newsletter, book,
podcast-transcript, youtube-transcript, notion-page, confluence-page,
jira-ticket, slack-message, email, api-response, markdown-file, csv-dataset,
json-dataset, web-page, code-snippet, meeting-note, research-note

#### KnowledgeNode

Extracted claims, insights, facts, and questions derived from SourceNodes.
Follows A-MEM 7-field node pattern with Graphiti-inspired custom typing.

```sql
CREATE TABLE knowledge_nodes (
  id                    TEXT PRIMARY KEY,
  claim_type            TEXT NOT NULL DEFAULT 'insight',
                            -- 'insight'|'fact'|'opinion'|'question'|'contradiction'
  content               TEXT NOT NULL,           -- the assertion verbatim
  keywords              TEXT,                    -- JSON array (A-MEM K_i)
  tags_summary          TEXT,                    -- JSON array of tag names (display only)
  contextual_description TEXT,                   -- LLM-generated topic+argument+audience
  embedding             BLOB,                    -- 384d over concat(content,keywords,desc)
  created_at            INTEGER NOT NULL,
  valid_at              INTEGER,                 -- when this became true
  invalid_at            INTEGER,                 -- soft invalidation timestamp
  source_node_id        TEXT REFERENCES source_nodes(id),
  evolution_history     JSON DEFAULT '[]'        -- A-MEM neighbor evolution log
);

CREATE INDEX idx_knowledge_type    ON knowledge_nodes(claim_type);
CREATE INDEX idx_knowledge_valid   ON knowledge_nodes(valid_at) WHERE invalid_at IS NULL;
CREATE INDEX idx_knowledge_source  ON knowledge_nodes(source_node_id);
```

**Claim types explained:**

- `insight` — synthesized understanding not stated verbatim in source
- `fact` — verifiable assertion extracted from source
- `opinion` — attributed viewpoint or stance
- `question` — open question surfaced during extraction
- `contradiction` — claim that conflicts with an existing knowledge node

### Edge Types (4)

```sql
CREATE TABLE edges (
  id          TEXT PRIMARY KEY,
  from_id     TEXT NOT NULL,              -- source node id
  to_id       TEXT NOT NULL,              -- target node id
  edge_type   TEXT NOT NULL,
  weight      REAL DEFAULT 1.0,           -- 0.0-1.0 semantic similarity or strength
  reasoning   TEXT,                       -- LLM-generated justification
  valid_at    INTEGER,                    -- event time: when relationship became true
  invalid_at  INTEGER,                    -- soft invalidation (never delete)
  created_at  INTEGER NOT NULL,
  episodes    TEXT DEFAULT '[]'           -- JSON array: provenance chain of source UUIDs
);

CREATE INDEX idx_edges_from       ON edges(from_id) WHERE invalid_at IS NULL;
CREATE INDEX idx_edges_to         ON edges(to_id)   WHERE invalid_at IS NULL;
CREATE INDEX idx_edges_type       ON edges(edge_type);
```

**Edge type map (enforces domain constraints, Graphiti pattern):**

| edge_type  | Allowed (from_type → to_type) | Direction | Description                          |
| ---------- | ----------------------------- | --------- | ------------------------------------ |
| LINKS_TO   | any → any                     | Directed  | Semantic connection (A-MEM L_i)      |
| CITES      | knowledge_node → source_node  | Directed  | Provenance/attribution               |
| MENTIONS   | source_node → knowledge_node  | Directed  | Source contains claim                |
| SUPERSEDES | any → any                     | Directed  | Version/update replaces earlier node |

**Soft invalidation for contradictions (Graphiti pattern):** New KnowledgeNode
contradicts existing → set `invalid_at` on old edge to new node's `valid_at`.
Old edges preserved, never deleted. Query current state:
`WHERE invalid_at IS NULL`.

### Flat Tag System (M2M Junction — Willison Winner)

```sql
CREATE TABLE tags (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE     -- normalized: '#graph-db' not 'graph-db'
);

CREATE TABLE node_tags (
  node_id  TEXT NOT NULL,        -- references source_nodes.id OR knowledge_nodes.id
  tag_id   INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (node_id, tag_id)
);

CREATE INDEX idx_node_tags_tag   ON node_tags(tag_id);
CREATE INDEX idx_node_tags_node  ON node_tags(node_id);
```

**Keywords vs tags (A-MEM distinction — important):**

- Keywords (K_i): specific retrieval signals stored inline in the node —
  "photography", "Step 9", "FalkorDB". Used for FTS5 and embedding
  concatenation.
- Tags (G_i): broad categorical classifiers stored in the junction table —
  "#recovery", "#tools", "#2026-04". Used for filtering, browsing, and
  pre-search narrowing.

**Performance (Willison benchmark at 100K rows):**

- Single tag: 1.41ms
- AND (2 tags): 2.26ms
- OR (2-5 tags): 10.69ms
- JSON array alternative: 40-55ms — avoid entirely

### Per-Node Confidence (Separate Table — Pattern C)

```sql
CREATE TABLE node_metadata (
  node_id       TEXT PRIMARY KEY,     -- references source_nodes or knowledge_nodes
  confidence    REAL NOT NULL DEFAULT 0.5,   -- 0.0-1.0
  source_count  INTEGER NOT NULL DEFAULT 1,  -- independent corroborating sources
  conf_extract  REAL,                        -- extraction algorithm confidence
  conf_source   TEXT,                        -- source tier: S0|S1|S2|S3
  created_at    INTEGER,
  updated_at    INTEGER
);

CREATE INDEX idx_metadata_confidence ON node_metadata(confidence);
```

**Confidence propagation (Pattern C — recommended):**

```
synthesis_confidence = base_confidence * min(1.0, source_count / 3)
```

Hits full confidence at 3+ independent corroborating sources. Store
`source_count` alongside confidence. Formula is configurable — different
synthesis types may warrant different formulas (Pattern A=min, Pattern
B=weighted average, Pattern D=conflict-penalized).

**Why separate table:** confidence + source_count + timestamps need to be
queried together. JOIN cost is minimal at T28's node counts. Keeps semantic body
JSON separate from tracking metadata.

### FTS5 Virtual Table

```sql
CREATE VIRTUAL TABLE search_index USING fts5(
  title,
  content,
  keywords,
  summary,
  tokenize = 'porter unicode61 remove_diacritics 2',
  prefix = '2 3',
  detail = 'full',
  content = 'source_nodes',
  content_rowid = 'rowid'
);
```

Column-weighted BM25: title 10x, keywords 5x, content 1x. Rebuild trigger on
insert/update/delete to source_nodes.

### Stable Identity

Every node gets a UUID that survives database resets (BasicMemory external_id
pattern). A `t28://` URL scheme provides stable references decoupled from file
paths:

```
t28://source/[uuid]         → source_nodes row
t28://knowledge/[uuid]      → knowledge_nodes row
t28://tag/[name]            → tags row
```

---

## 3. Search Architecture Recommendation

### Three-Layer Hybrid From Day One

All 9 findings files independently arrive at the same conclusion: three-layer
hybrid search is justified from day one at T28's scale. The Obsidian retriever
runs it at 16,894 files in 23ms. obra runs it at 3,300 nodes. BasicMemory,
Palinode, sqlite-memory, and the Willison-benchmarked patterns all confirm it.
There is no threshold to wait for.

**Architecture:**

```
Query Input
    │
    ├─ [Tag Pre-filter] ──── junction table CTE ──→ candidate node_ids (1.41ms)
    │
    ├─ Layer 1: FTS5 ──────── BM25 + porter ──────→ ranked list + BM25 scores
    │
    ├─ Layer 2: sqlite-vec ── MiniLM 384d cosine ──→ ranked list + cosine scores
    │
    └─ Layer 3: RRF Fusion ── k=60 ──────────────→ unified ranked list
                │
                └─ Layer 4: Graph Expansion ──── BFS 1-2 hops ──→ context nodes
```

### Component Decisions

**FTS5 configuration:**

```sql
tokenize = 'porter unicode61 remove_diacritics 2'
prefix = '2 3'
detail = 'full'
```

0.3ms at 49,746 chunks (Obsidian retriever). Column-weighted BM25: title 10x,
keywords 5x. Catches exact term queries — "every mention of Step 9", "notes
referencing [meeting name]".

**Embedding model: MiniLM-L6-v2 via @xenova/transformers**

- 22MB ONNX, 384 dimensions, 512 token context
- ~14.7ms per 1K tokens on CPU (no GPU required)
- ~11ms per note at T28's typical note lengths
- No Python. Local. No API calls. Windows-confirmed.
- BGE-M3 (alternative): 25x larger, multilingual advantages are irrelevant for
  English technical notes

**Embedding formula (A-MEM pattern):**

```
embed(node) = MiniLM(concat(content, keywords, summary))
```

All enriched text fields concatenated before encoding. Extraction quality
directly affects retrieval quality.

**RRF fusion (k=60, standard):**

```
score(d) = SUM(1 / (60 + rank_i))  for each retrieval method i
```

k=60 is the validated standard across LightRAG, the Obsidian retriever, and
academic literature. No score normalization needed. Graphiti uses k=1
(intentionally aggressive top-position scoring) — this is a design choice for
their use case, not a universal recommendation. T28 should use k=60.

**Tag pre-filter:** Junction table CTE narrows candidate set before FTS5/vector.
Tag selectivity is typically higher than confidence (tags narrow ~1-5% of nodes;
confidence might match 50%+). Tag-first indexing is correct. The Obsidian
retriever pattern uses this exact approach.

**Graph expansion (land-and-expand):** After hybrid search returns top-K nodes,
BFS 1-2 hops through valid edges adds context nodes. Zep reports 18.5% accuracy
gain + 90% token reduction (115K → 1.6K tokens) from this pattern. Cap at 2 hops
with edge type filters. Return up to 500-token injection cap (Obsidian retriever
pattern — enables prompt caching).

**Dual interaction mode (same core):**

- Claude autonomous: structured JSON params → query construction → JSON output,
  higher latency tolerance
- User direct: natural language input → same retrieval algorithm →
  human-readable snippets

Both modes use identical retrieval. Different input parsing, identical search
execution.

### Full Compound Query Pattern

```sql
-- Tag pre-filter + FTS5 + confidence + recency
WITH tagged AS (
  SELECT DISTINCT nt.node_id
  FROM   node_tags nt
  JOIN   tags t ON nt.tag_id = t.id
  WHERE  t.name IN ('#recovery', '#2026')
)
SELECT
  n.id,
  n.title,
  n.summary,
  nm.confidence,
  nm.source_count,
  fts.rank AS bm25_score,
  bm25(search_index) AS bm25_detail
FROM   source_nodes n
JOIN   search_index fts ON fts.rowid = n.rowid
JOIN   node_metadata nm ON nm.node_id = n.id
WHERE  n.id IN (SELECT node_id FROM tagged)
  AND  fts MATCH 'sobriety meeting step'
  AND  nm.confidence > 0.6
  AND  n.invalid_at IS NULL
ORDER  BY bm25_score
LIMIT  20;
```

---

## 4. Graph Analytics Roadmap

Analytics and traversal are complementary, not competing. Traversal answers
"find related things to X" and requires a starting point. Analytics answers
"what patterns exist I didn't know about?" and works on the global graph. The
obra/knowledge-graph project (3,300 nodes, SQLite + graphology) is the confirmed
working proof of concept for T28's exact stack.

### Phase 1: Day One — Traversal + Search (v1.0)

SQLite recursive CTEs handle BFS up to ~5,000 nodes for 2-3 hops. No additional
library needed. Covers 90% of day-to-day patterns:

- "Everything connected to X within 2 hops" — recursive CTE on edges table
- "All nodes tagged [coping strategy] linking to [trigger]" — junction table +
  edge join
- "Notes from last week referencing [meeting]" — valid_at range + FTS5
- "Shortest path between A and B" — recursive CTE with path tracking
- Basic degree centrality — COUNT edges per node (usable early substitute for
  PageRank)

**Performance:** Recursive CTEs practical to ~5,000 nodes for 2-3 hops. Degrades
on 5+ hops or dense multi-path graphs.

### Phase 2: 500-1,000 Nodes (~3-6 months) — Community Detection

When graph has enough connected nodes to produce non-trivial communities, add
graphology + Louvain. This is the highest-value first analytics capability —
surfaces emergent clusters you can't find by traversal.

**Library:** graphology (TypeScript-native, covers Louvain, betweenness,
PageRank, BFS, connected components)

**Pattern (obra-proven):**

1. On analytics query: load full graph from SQLite into graphology in-memory
2. Run Louvain community detection
3. Return community assignments + summaries
4. Full graph reload required each run (not incremental — Leiden quality > LP
   quality for batch)

**Performance:** ~53ms at 1,000 nodes, ~938ms at 50,000 nodes.

**Use case unlocked:** "What theme clusters emerged across all notes without me
organizing them?" — cannot be found via traversal.

**Disconnected graph caveat:** Early-stage graphs are often disconnected.
Community detection degrades on disconnected components. Start with degree
centrality as PageRank fallback when components are disconnected.

### Phase 3: Post-Community — PageRank + Betweenness (v2.0+)

After Louvain is working and graph has hundreds of well-connected nodes:

**PageRank:**

- "Which concepts are most important, weighted by linker importance, not just
  count?"
- Needs hundreds+ of well-connected nodes to converge
- Implement degree-centrality fallback for disconnected components (obra
  pattern)

**Betweenness Centrality:**

- "Which concept is the only bridge between two disconnected areas?"
- Clinically identical to bridge centrality in addiction/mental health network
  research — T28's domain is structurally the same use case
- Expensive: O(E\*V). Run periodically as a background job, cache results. Do
  NOT compute per-query.

**Leiden (T28 v2+):**

- Higher quality community detection than Louvain (eliminates up to 25%
  poorly-assigned communities)
- Not in graphology — requires separate library
- Worthwhile when community quality becomes a real problem, not before

### Phase 4: Deferred to v3+ — Full MAGMA

MAGMA's 4-graph decomposition (temporal, causal, semantic, entity) + async
slow-path LLM consolidation is architecturally powerful but carries substantial
operational complexity (4 separate edge sets, vector DB, async consolidation
pipeline). Benchmark: LoCoMo 0.700 vs A-MEM 0.580. Revisit when T28 has
validated the simpler stack.

### Analytics Implementation Summary

| Phase        | Trigger          | Technology            | Algorithms                                 |
| ------------ | ---------------- | --------------------- | ------------------------------------------ |
| v1.0 Day One | Always           | SQLite recursive CTEs | BFS, traversal, degree centrality          |
| v1.x ~3-6mo  | 500-1K nodes     | graphology in-memory  | Louvain community detection                |
| v2.0         | Post-community   | graphology batch jobs | PageRank (+ fallback), betweenness         |
| v2.x+        | Quality pressure | Leiden library        | Higher-quality communities                 |
| v3+          | Validated demand | MAGMA-style           | 4-graph decomposition, async consolidation |

---

## 5. Production Architecture Patterns to Adopt

All 9 findings files independently converge on the same 10 universal principles.
These are not one system's preferences — they are the consensus from
BasicMemory, Palinode, LightRAG, IWE, sqlite-memory, the Obsidian retriever,
notebooklm-py, Graphiti, and A-MEM.

### The 10 Universal Principles (and T28 Adaptations)

**1. Files canonical, indexes derived** SQLite (and all embeddings, FTS5
indexes, community assignments) is disposable and rebuild-on-demand. `t28 reset`
should delete the database, rescan all files, rebuild everything without
touching source files. BasicMemory proves this is operationally viable. Never
put data in SQLite that doesn't derive from files.

**T28 adaptation:** Every node has a stable UUID that survives resets
(BasicMemory external_id pattern). Source files are the truth. Graph is the
index.

**2. Content-hash dedup before re-processing (~90% savings)** SHA-256 checksum
per file. On sync: compare checksum to last-scanned value. Skip unchanged. Only
process files where `checksum != stored_checksum`. sqlite-memory's two-phase
sync pattern: Phase 1 cleanup orphans → Phase 2 scan with hash comparison.

**T28 adaptation:** `last_scan_timestamp` watermark + per-file SHA-256.
`skip_initialization_sync` flag for when DB is known-good (BasicMemory pattern).

**3. Single write path: files first, then index** Every mutation goes through
the file system. Index is written second, always. Never write to SQLite without
writing to a file first. Prevents index/file divergence.

**T28 adaptation:** MCP `edit_note` operations → file mutation → chokidar
detection → SyncService → SQLite update. No direct SQL inserts from LLM output.

**4. Hybrid retrieval (BM25 + vector + RRF) over pure anything** Every
production system that measured this found hybrid outperforms single-mode. FTS5
catches exact terms, vector catches semantic relatives. RRF fusion requires no
score normalization. No threshold to wait for at T28's scale.

**T28 adaptation:** Wired from day one. See Section 3 for full architecture.

**5. Graceful degradation: embedding fails → FTS5 → filesystem → cat** If
sqlite-vec has issues, fall back to FTS5-only. If FTS5 index is stale, fall back
to filesystem scan. If filesystem scan fails, cat still works. Palinode's design
principle: "If every service crashes, cat still works." The Obsidian retriever
documents its honest failure modes.

**T28 adaptation:** Retrieval pipeline: try vector → catch → try FTS5 → catch →
try filesystem scan → catch → return error. Never fail silently.

**6. LLM proposes, deterministic executor applies** LLM produces a structured
proposal (KEEP/UPDATE/MERGE/SUPERSEDE/ARCHIVE in Palinode, edge classification
in Graphiti). A deterministic executor validates schema and applies the
mutation. Separates reasoning from mutation. Prevents LLM from directly
corrupting the graph.

**T28 adaptation:** Ingestion pipeline: LLM extracts → Zod schema validates →
executor writes. LLM never directly writes to SQLite or mutates files.

**7. Git-tracked files, gitignored indexes** Source files (.md, .pdf, etc.) are
git-tracked. SQLite databases (.db, .db-wal, .db-shm), embedding caches, and
FTS5 indexes are `.gitignore`d. Palinode takes this further: git commit per
compaction event, creating an audit trail.

**T28 adaptation:** T28 config + source files in git. All derived artifacts
(_.db, _.db-wal, embedding caches) in .gitignore. Consider
git-commit-per-compaction for audit trail in v2.

**8. Stateless MCP layer: no DB connections, no embedding logic in MCP tools**
MCP tools are thin proxies. They call a library or service — they do not own
connections, embed text, or run queries directly. Transport instability
(Graphiti's SSE → Streaming HTTP break) should not affect core data integrity.

**T28 adaptation:** MCP tools call `t28-core` library functions. `t28-core` owns
all SQLite connections, embedding calls, and query logic. MCP tools are
stateless HTTP wrappers.

**9. Chunk at semantic boundaries (headings, paragraphs), not byte count** The
Obsidian retriever found that byte-count chunking produces poor FTS5 matches for
structured content. Split at markdown headings, then paragraphs. 500-token
injection cap enables prompt caching (Obsidian retriever pattern).

**T28 adaptation:** Source file → markdown section parser → per-section
SourceNode. No mid-sentence splits. 500-token cap for context injection.

**10. Incremental via union/append; full rebuild is exception** LightRAG:
union-append for daily additions — no full re-indexing of history. A-MEM:
retrieve-then-judge before writing. Only trigger full rebuild on schema
migration or data corruption. Incremental processing must be idempotent
(sqlite-memory SAVEPOINT pattern: safe to run on every session start).

**T28 adaptation:** SyncService processes delta (changed files only). SAVEPOINT
wraps each file's ingest transaction. Full rebuild available via `t28 reset` but
is the exception, not routine.

### Additional Patterns Worth Adopting

**Soft invalidation, never delete (Graphiti bi-temporal, event-time only):**
When a SourceNode is updated or a KnowledgeNode contradicted, set `invalid_at`
to the current timestamp. Never delete. All queries filter
`WHERE invalid_at IS NULL` for current state. Historical queries filter on
`valid_at` range. This preserves audit history and makes `t28 reset` safe.

**LightRAG Recog-Prof-Dedupe extraction pipeline:** Three-step extraction is the
right ingestion architecture: (1) Recognize entities and relations in the chunk,
(2) Build a structured profile (KV pairs) for each, (3) Deduplicate across
chunks using canonical names. This allows daily additions without re-indexing
history — critical for T28's incremental growth model.

**A-MEM retrieve-then-judge before writing:** On ingest of a new KnowledgeNode:
retrieve top-k semantically similar existing nodes → LLM judges whether to link
and whether to update neighbors' contextual_description. This is the
"bidirectional evolution" pattern — note that "bidirectional" means any existing
node CAN be updated, not that updates are symmetric. New nodes trigger neighbor
evolution; the reverse doesn't happen automatically.

**Pydantic docstrings drive LLM extraction (Graphiti pattern):** Custom
node/edge type classes with descriptive docstrings. The docstring becomes the
LLM's type description context. Well-described types improve extraction
precision. Apply to KnowledgeClaim, SourceEvidence, etc.

**Edge type map enforces domain constraints (Graphiti pattern):**
`edge_type_map: dict[(from_label, to_label), list[allowed_types]]`. Prevents LLM
from inventing arbitrary edge types. Validated by Pydantic constructor before
write. T28's four edge types are narrow enough that this constraint is low
overhead.

**500-token injection cap (Obsidian retriever pattern):** When injecting
retrieved context into an LLM prompt, cap at 500 tokens. Mem0 benchmark: 26K
tokens + 17 seconds (full-context) vs 6% accuracy loss + 91% lower latency
(selective retrieval). Never inject the full graph. The cap also enables prompt
caching.

---

## 6. What to Defer to T28 v2/v3

### Defer to v2 (Validated demand, not premature)

**Full bi-temporal T' audit axis:** Graphiti's system-time tracking
(`created_at`, `expired_at` tracking ingestion history separately from event
time) adds complexity without clear T28 value in v1. Adopt only
`valid_at`/`invalid_at` (event time) for soft invalidation. Add T' if audit
trails become a real requirement.

**MAGMA 4-graph decomposition:** Four orthogonal edge sets (temporal, causal,
semantic, entity) + async slow-path LLM consolidation. LoCoMo benchmark 0.700 is
impressive, but the operational overhead (separate graph structures, vector DB,
async consolidation) is substantial for a first graph project. Revisit at v2.

**PageRank + betweenness centrality:** High value but requires hundreds of
well-connected nodes to produce useful signal. At early-stage, degree centrality
produces near-identical rankings. Add after Louvain is working and graph density
warrants it.

**Confidence propagation through graph edges:** Pattern C (source_count/3) is
the right formula for synthesized nodes. Edge-level confidence propagation
(tracking uncertainty through multi-hop paths) is uncharted in both academic
systems (neither A-MEM nor MAGMA implements it) and adds implementation
complexity without clear v1 benefit.

**SagaNode (Graphiti undocumented 4th tier):** Narrative container for episode
sequences. Could represent T28 "document series" or "author corpus."
Undocumented, API-unstable. Interesting for v2 if narrative tracking becomes
important.

**A-MEM edge decay policy (>90 days OR weight <0.3):** The A-MEM MCP
implementation adds edge pruning. T28 will want this eventually but the right
thresholds depend on actual usage patterns. Soft invalidation handles the
immediate need; decay policy is a v2 tuning decision.

**git-commit-per-compaction (Palinode pattern):** Audit trail via git commits at
each compaction event is elegant but adds operational overhead. Worthwhile once
compaction frequency and audit requirements are understood.

### Defer to v3+

**MemSkill RL infrastructure:** Controller-Executor-Designer RL loop for
evolving memory extraction procedures. Architecturally powerful for
self-improving systems. Requires RL training infrastructure. The span-level
processing insight (group history into spans, not turns) is transferable without
the RL layer.

**FluxMem Beta Mixture Model:** Probabilistic distribution-aware filtering
instead of hard cosine thresholds. Principled alternative to hard cutoffs for
retrieval quality. Worth revisiting when retrieval quality becomes a measured
bottleneck.

**EverMemOS (memory as OS primitive):** The direction the field is moving. T28
v3+ consideration once the simpler layers are validated.

**CRDT for multi-agent offline sync:** sqlite-memory implements this for
multi-agent scenarios. T28 is single-user initially; multi-agent sync is a
future concern.

**Leiden for community detection:** Higher quality than Louvain but not in
graphology. Worth adding if community quality becomes a real problem. Not needed
until Louvain is deployed and limitations are observed.

**Closeness centrality:** Less intuitive for PKM than betweenness. obra doesn't
implement it. Low priority.

**FalkorDB backend:** FalkorDB claims 496x lower latency than Neo4j and is now
Graphiti's default. But (a) SQLite is T28's v1 backend, (b) the 496x claim is
from a vendor blog and unverified independently, (c) Neo4j is still the
recommendation for production Graphiti deployments, and (d) Kuzu (embedded
no-server option) was archived October 2025. Re-evaluate if T28 ever migrates
off SQLite.

---

## 7. Open Questions Remaining

### Critical (Block v1 implementation decisions)

**Q1: sqlite-vec stability on Windows** sqlite-vec is pre-v1 (v0.1.9, March
2026). Node.js npm package Windows binding stability has not been benchmarked in
any findings file. The Obsidian retriever is macOS/Linux. The D12 findings note
this gap explicitly. Must be verified before committing to sqlite-vec as the v1
vector backend.

**Q2: Zep Fact Ratings — open-source vs managed service only** D4 and D6-1 both
flag this: whether Graphiti's confidence/fact_rating API is in open-source
graphiti-core or Zep managed service only is unconfirmed. The D6-1 deep dive
concludes no `confidence_score` field exists in open-source source code. T28's
confidence requirement needs a custom Pydantic attribute — this is confirmed as
the implementation path, but the question of whether Zep's managed service adds
meaningful confidence capabilities worth monitoring remains open.

**Q3: Per-file vs per-section SourceNode granularity** The findings do not
resolve whether SourceNode should map to a whole file or a semantic section
(heading/paragraph). BasicMemory uses per-file entities. The Obsidian retriever
uses per-chunk (500-token sections). LightRAG uses per-chunk with
Recog-Prof-Dedupe across chunks. The right granularity for T28's 28 source types
is undecided.

**Q4: Transformers.js ONNX Windows CPU latency** ~14.7ms/1K tokens is the
published figure but not Windows-specific. D12 notes this gap. Relevant for
deciding whether embedding happens inline (sync) or as a background job.

### Important (Affect design but not blockers)

**Q5: A-MEM neighbor evolution threshold — how many top-k neighbors?** Paper
says top-k (k=5-10) for link generation and neighbor evolution. The right value
for T28 depends on average node connectivity. Too low: misses connections. Too
high: expensive LLM calls per ingestion.

**Q6: Tag vocabulary management** The Willison benchmark assumes a controlled
vocabulary. T28's 28 source types will generate tags from very different
domains. Is T28's tag vocabulary user-controlled (autocomplete on existing
tags), LLM-suggested (from contextual_description), or both? No findings file
addresses this decision.

**Q7: Confidence floor for knowledge node creation** When should a KnowledgeNode
NOT be created? If conf_extract < threshold, should extraction be skipped or
should the node be created with low confidence? The threshold is undecided and
affects both data quality and storage growth.

**Q8: `add_fact_triple()` dedup behavior in Graphiti without pre-controlled
UUIDs** D14-2 flags: Graphiti's escape hatch for bypassing LLM-per-ingest
(`add_fact_triple()`) has unclear dedup behavior when UUIDs are not
pre-controlled. If T28 adopts this pattern to avoid LLM-per-ingest costs, the
dedup semantics need verification.

**Q9: Community detection trigger strategy** When exactly to trigger Louvain is
undecided. Options: (a) manual trigger, (b) periodic batch cron, (c) node-count
threshold event, (d) on-demand per query. The obra pattern uses manual trigger.
The right approach for T28's use case is TBD.

**Q10: Ingestion pipeline for non-text source types** The schema handles 28
source types in a single table. But audio, video, and image sources require
transcription/extraction before text ingestion. The pipeline for these types
(transcription service, chunking strategy, metadata extraction) is not addressed
in any findings file.

---

## Contradictions Identified Across Findings

**C1: RRF k constant — k=1 (Graphiti) vs k=60 (Obsidian retriever, academic
standard)** D6-1 finds Graphiti uses k=1 (intentionally aggressive top-position
scoring). D12 and D14-3 both recommend k=60 (the academic standard). These are
design choices for different use cases, not contradictions about what works —
but T28 must explicitly choose. Recommendation: k=60. Rationale: T28 wants
balanced fusion across three retrieval methods. k=1 is appropriate when Graphiti
wants to aggressively prefer the top-ranked result; T28's use case is more
balanced discovery.

**C2: Community detection algorithm — label propagation (Graphiti paper) vs
Leiden (Graphiti code)** D6-1 finds the arXiv paper describes label propagation,
but current code uses Leiden for batch rebuilds and label propagation only for
incremental. D14-2 finds the opposite framing: paper says LP is primary with
periodic refreshes, not a dual-algorithm approach. The practical resolution:
T28's analytics should use graphology's Louvain (the available implementation)
and revisit algorithm quality when community detection is in production.

**C3: Graphiti confidence field — secondary sources vs source code** Multiple
secondary sources claim Graphiti edges have confidence scores. D6-1's source
code inspection finds no `confidence_score` or `fact_rating` field in
open-source graphiti-core. Secondary sources are wrong. T28 must implement
confidence as a custom Pydantic attribute in the `attributes` dict. This is
fully resolved: custom attribute is the implementation path.

**C4: "Bidirectional" evolution in A-MEM — paper vs implementation** D4
describes bidirectional evolution. D6-2 clarifies: "bidirectional" means any
note CAN be updated, not that updates are symmetric. New notes trigger neighbor
updates; the reverse doesn't happen. The practical implication: the evolution is
asymmetric on ingest but any historical node is eligible for update. T28 should
implement the asymmetric version.

**C5: FTS5 vs M2M for tags — D6-3 finding** FTS5 wins AND queries and storage.
M2M junction table wins single-tag and OR queries. D6-3 recommends M2M. No other
findings file contradicts this. But the right choice depends on T28's primary
tag access pattern. Recommendation: M2M junction table (Section 2) with tags in
UNINDEXED FTS5 column for display. If multi-tag AND queries become the dominant
pattern at scale, revisit FTS5 for tags.

---

## Confidence Assessment

| Finding                                | Confidence | Basis                                                                       |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------- |
| Files-canonical architecture           | HIGH       | 7+ independent systems converge                                             |
| M2M junction table for tags            | HIGH       | Willison benchmark with exact numbers                                       |
| Three-layer hybrid search from day one | HIGH       | Obsidian retriever (16,894 files), obra (3,300 nodes)                       |
| MiniLM-L6-v2 as embedding model        | HIGH       | Transformers.js official docs, size/quality tradeoff clear                  |
| RRF k=60                               | HIGH       | Academic standard, multiple systems                                         |
| A-MEM 7-field node schema              | HIGH       | arXiv:2502.12110 + two implementations verified                             |
| Graphiti bi-temporal event-time model  | HIGH       | Source code verified, production-proven                                     |
| Louvain at 500-1,000 nodes             | MEDIUM     | obra proven, threshold is estimated from InfraNodus/obra scale              |
| Confidence Pattern C propagation       | MEDIUM     | No canonical formula exists; this is the most defensible heuristic          |
| Per-node confidence in separate table  | HIGH       | Willison + SQLite benchmarks support this pattern                           |
| sqlite-vec on Windows                  | MEDIUM     | Pre-v1, Windows binding unconfirmed (gap acknowledged)                      |
| MAGMA defer to v2                      | HIGH       | Operational complexity clear, benchmark benefit quantified                  |
| LLM-per-ingest: avoid                  | HIGH       | Graphiti issue #1299, structured source files make LLM extraction redundant |

---

## Sources Consulted

| #     | Title                                              | Sub-question    | Trust       |
| ----- | -------------------------------------------------- | --------------- | ----------- |
| S-001 | A-MEM arXiv:2502.12110                             | D4, D6-2        | HIGH        |
| S-002 | Graphiti/Zep arXiv:2501.13956                      | D4, D6-1, D14-2 | HIGH        |
| S-003 | MAGMA arXiv:2601.03236                             | D4, D6-2        | HIGH        |
| S-004 | MemSkill arXiv:2602.02474                          | D4              | HIGH        |
| S-005 | Graphiti source: nodes.py, edges.py                | D6-1            | HIGH        |
| S-006 | Graphiti source: search_utils.py, search_config.py | D6-1            | HIGH        |
| S-007 | Graphiti Custom Entity/Edge Types docs             | D6-1            | HIGH        |
| S-008 | Willison SQLite Tags Benchmark (blog + GitHub)     | D6-3            | HIGH        |
| S-009 | KG Uncertainty Survey arXiv:2405.16929             | D6-2            | HIGH        |
| S-010 | Agentic UQ arXiv:2601.15703                        | D6-2            | HIGH        |
| S-011 | SQLite FTS5 docs (official)                        | D12             | HIGH        |
| S-012 | sqlite-vec GitHub (v0.1.9)                         | D12             | HIGH        |
| S-013 | Transformers.js docs + MiniLM model                | D12             | HIGH        |
| S-014 | Zep arXiv:2501.13956 (search/retrieval claims)     | D12             | HIGH        |
| S-015 | Obsidian hybrid retriever (16,894 files, 23ms)     | D12, D14-3      | HIGH        |
| S-016 | obra/knowledge-graph (blog + GitHub, 3,300 nodes)  | D11             | MEDIUM-HIGH |
| S-017 | Graphology Louvain docs                            | D11             | HIGH        |
| S-018 | Bridge Centrality: Comorbidity (PubMed)            | D11             | HIGH        |
| S-019 | Louvain to Leiden (Nature)                         | D11             | HIGH        |
| S-020 | BasicMemory official docs (7 docs)                 | D14-1           | HIGH        |
| S-021 | BasicMemory DeepWiki Analysis                      | D14-1           | HIGH        |
| S-022 | LightRAG arXiv:2410.05779                          | D14-3           | HIGH        |
| S-023 | Palinode official repo + architecture docs         | D14-3           | HIGH        |
| S-024 | DoltHub Polymorphic Associations                   | D6-3            | HIGH        |
| S-025 | Neo4j Labels vs Properties (David Allen)           | D6-2            | MEDIUM-HIGH |
| S-026 | Graphiti GitHub issues #1299, #1111, #1086         | D14-2           | MEDIUM      |
| S-027 | IWE official repo                                  | D14-3           | HIGH        |
| S-028 | sqlite-memory repo + CRDT docs                     | D14-3           | HIGH        |
| S-029 | notebooklm-py repo                                 | D14-3           | HIGH        |
| S-030 | FalkorDB performance blog                          | D14-2           | MEDIUM      |
