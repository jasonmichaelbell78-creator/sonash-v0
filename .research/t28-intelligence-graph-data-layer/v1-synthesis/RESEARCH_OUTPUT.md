# T28 Intelligence Graph Data Layer — Research Report

**Date:** 2026-04-07 **Session:** #267 **Topic:** What is the right data layer
backend for T28 (Unified Content Intelligence System)? **Depth:** L1 **Agents:**
12 **Sub-questions covered:** D1a, D1b, D2a, D2b, D3, D4, D5a, D5b, D6, D7, D9,
D10 **Sub-questions skipped:** D8 (architecture tradeoffs — well-covered by
D1+D2)

---

## Executive Summary

T28 needs a data layer that stores analyzed sources as nodes, relationships as
edges, and supports graph-based synthesis across 28 source types,
hundreds-to-thousands of nodes, and 5000+ edges. The research across 12 agents
and 200+ sources converges on a clear answer: **SQLite with the simple-graph
schema, extended with FTS5 and sqlite-vec, is the primary embedded store for
this scale, with LadybugDB (embedded graph-native Cypher) as a credible
alternative if Cypher query power is needed.** In both cases, the architectural
principle is identical — files are canonical, the graph is a derived,
regenerable index.

The brainstorm assumption "files canonical + graph indexes/augments" is
confirmed correct by every production system studied: BasicMemory, Palinode,
LightRAG, and Obsidian all converge on this same design. The graph backend
(whichever is chosen) is reconstructible from `.research/` file artifacts if
lost. This is not a preference — it is a hard requirement given Claude Code's
Windows compaction behavior and background-agent output file bugs documented in
the project. The graph accelerates and enriches; files survive.

The MCP memory server already configured in this project
(`@modelcontextprotocol/server-memory`) is definitively insufficient for T28: it
uses a JSONL flat file with full rewrites on every operation, no vector search,
no graph traversal, and degrades severely past 80K tokens. It must not be
extended or relied upon for T28. The right MCP integration path is either
BasicMemory (zero infrastructure, MCP-native, files-first, hybrid FTS+vector) or
AgentMemory (syncs with this project's existing `MEMORY.md` infrastructure).
Graphiti/Zep is the most architecturally sophisticated option but requires Neo4j
or a server-class graph backend and LLM API per ingestion.

---

## Key Findings by Theme

### Theme 1: Files Canonical, Graph Derived — Universal Industry Consensus

Every production system studied confirms the same architectural pattern: plain
files are the authoritative source of truth; the graph/database is a derived,
regenerable index [D9].

- BasicMemory: Markdown files on disk are the source of truth. SQLite is the
  indexing layer. Database loss is recoverable by re-scanning files. [D2b, D9]
- Palinode: "Plain files are the source of truth and everything else is a
  derived index." Every compaction is a git commit, not a database mutation.
  [D9]
- LightRAG: All derived state (graph, vectors, KV) lives in `WORKING_DIR`.
  Regeneration = clear working dir + re-ingest. [D9]
- Obsidian: `.obsidian/graph.json` is gitignored in developer vaults. The
  markdown files are tracked. Graph regenerates on startup. [D2a, D9]

This convergence is not coincidental — it emerges from engineering constraints:
compaction resilience, git-trackability, human readability, and graceful
degradation [D9].

**Confidence: HIGH** — 4 independent production systems all make the same
choice.

The specific requirement for T28: the graph must be reconstructible from
`.research/` file artifacts alone by running `t28 rebuild-graph`. If the graph
backend (SQLite DB, MCP server) is deleted or unavailable, the files survive
[D9]. This is non-negotiable given Windows compaction behavior and 0-byte
background agent output bugs documented in CLAUDE.md.

**Implication for the brainstorm assumption:** The "files canonical + graph
indexes/augments, using Graphiti architecture patterns" assumption is validated.
Graphiti's architectural patterns (bi-temporal edges, three-tier hierarchy,
hybrid retrieval) are worth adopting. Running the full Graphiti/Zep server is
not required.

---

### Theme 2: The Official MCP Memory Server Is Inadequate for T28

The `@modelcontextprotocol/server-memory` package (the memory server currently
configured in this project) is a proof-of-concept, not a production knowledge
graph [D3].

- Storage: JSONL flat file. Every operation (including reads) deserializes the
  ENTIRE file. Every mutation rewrites it entirely. No indexes, no caching, no
  WAL. [D3]
- Search: Case-insensitive `.includes()` substring scan. O(N × observations) per
  query. No FTS, no vector, no fuzzy matching. [D3]
- Scale: At T28's 1,000 entities and 5,000 relations, projected multi-second
  latency and ~850MB RAM from full-file rewrites. GitHub Issue #2415 (July 2025,
  still open) documents degradation at ~80K tokens. [D3]
- Data model: `Entity { name, entityType, observations[] }` and
  `Relation { from, to, relationType }`. Missing timestamps, confidence scores,
  IDs, metadata on relations, typed properties, and provenance. [D3]

**Confidence: HIGH** — sourced from direct codebase analysis and GitHub issues.

Drop-in alternatives using the same 9-tool API exist: `mcp-memory-enhanced`
(SQLite backend, 15-250x faster) and `knowledgegraph-mcp` (SQLite/PostgreSQL, up
to 100K entities) [D3]. These are compatibility shims, not T28's target
architecture.

The package name is `@modelcontextprotocol/server-memory`, not
`@anthropic/mcp-memory`. The project's currently configured "memory" MCP server
identity needs verification before T28 build begins [D3].

---

### Theme 3: SQLite Is the Right Primary Storage for T28's Scale

SQLite + the simple-graph schema is the most battle-tested path for T28's scale
(hundreds to low thousands of nodes, 5000+ edges) [D1a, D5a, D7].

**The simple-graph schema** is directly appropriate [D1a]:

```sql
CREATE TABLE nodes (id TEXT PRIMARY KEY, body JSON NOT NULL);
CREATE TABLE edges (source TEXT, target TEXT, properties JSON,
  FOREIGN KEY(source) REFERENCES nodes(id),
  FOREIGN KEY(target) REFERENCES nodes(id));
```

Adequate for "several thousand nodes." Exactly T28's scale. Used by
simple-graph, code-review-graph, and codebase-memory-mcp.

Specific SQLite capabilities for T28:

- **FTS5** built-in, BM25-scored, handles ~500K docs. Combined with
  **sqlite-vec** for vector + keyword hybrid search [D1a].
- **Recursive CTEs** with `UNION` for cycle detection, depth limiting, indexed
  source/target columns for graph traversal [D1a].
- **JSON columns + virtual generated columns** allow indexing JSON fields
  without schema migration [D1a].
- **WAL mode** for concurrent reads. Windows AV caveat: exclude `.db` from
  scanning. [D1a]
- **MCP integration confirmed**: mcp-server-sqlite (PyPI), code-review-graph,
  codebase-memory-mcp all proven [D1a].

**Performance ceiling:** Comfortable to ~100K nodes/edges. Dense graphs degrade
quadratically with CTE re-visits beyond that. T28 at thousands of nodes is well
within safe range [D1a].

**Confidence: HIGH** — multiple independent sources confirm SQLite +
simple-graph for this scale.

**DuckDB** is analytically superior but categorically mismatched for T28 growth
patterns: DuckDB is OLAP (columnar), T28's growth is OLTP (incremental inserts)
— 10-500x write slowdown vs SQLite for point inserts [D1a]. Appropriate only as
a read-only analytical layer querying SQLite-populated data.

---

### Theme 4: LadybugDB Is the Graph-Native Alternative Worth Tracking

If Cypher query power is preferred over SQL CTEs, LadybugDB is the strongest
embedded graph-native option [D1b, D5b].

LadybugDB is the community fork of KuzuDB (which was archived October 2025 when
the team was acquired, likely by Apple). It has the most momentum of any fork:
894 stars, MIT license, v0.15.3 (April 2026), active Discord, cross-platform
Windows x64 support [D1b].

Key capabilities:

- Labeled Property Graph, strongly-typed node/edge tables
- openCypher query language with extensions for semantic spacetime and
  hypergraphs
- Columnar WAL, ACID, larger-than-memory support
- `@ladybugdb/core` npm package with Node.js/TypeScript bindings
- Native FTS extension + vector index
- 18x faster than Neo4j on ingestion (inherited from Kuzu benchmark)
- Interoperates with DuckDB and Parquet natively [D1b]

**MemoryGraph** (202 stars) is the only MCP server confirmed to support
LadybugDB, providing 7 relationship categories with semantic types and
cross-session recall [D5b].

**Risk:** LadybugDB is 6 months old as a community fork. SQLite has decades of
production hardening. For T28's scale, SQLite CTEs are sufficient without
Cypher. Monitor LadybugDB stability for 6 months before adopting for production
data [D1b].

**Confidence: HIGH for capabilities; MEDIUM for production stability** — the
fork is very new.

---

### Theme 5: Agent-Native Memory Frameworks vs PKM Tools

A distinct category boundary has emerged: PKM tools (Obsidian, Logseq, Tana) are
human-centric tools retrofitting MCP; agent-native frameworks (Graphiti/Zep,
BasicMemory, Mem0) are designed ground-up for agent knowledge operations [D2b].

**BasicMemory** is the lowest-friction agent-native option for T28 [D2b, D5a]:

- AI knowledge graph as Markdown files + SQLite indexing + FastEmbed semantic
  search
- Entity-Observation-Relation model. Wiki-links define graph edges.
- MCP is the primary interface: `write_note`, `read_note`, `build_context`
  (graph traversal via `memory://` URLs), `search`
- Zero infrastructure. Files at `~/basic-memory`. No DB server, no Docker.
- Hybrid search: full-text + vector (v0.19.0)
- **Caveat: AGPL v3 license** — creates adoption constraints. Adopt the
  architecture pattern without adopting the codebase.

**Graphiti/Zep** is the most architecturally sophisticated option [D2b, D4,
D5b]:

- Temporal context graph engine: bi-temporal tracking (valid_from/valid_to,
  t_created/t_expired)
- Three-tier node hierarchy: Episodes → Entities → Communities
- Hybrid retrieval trinity: semantic (cosine) + lexical (BM25) + graph traversal
  (BFS), fused via Reciprocal Rank Fusion (RRF)
- Non-destructive contradiction: old edges get `invalid_at` set, not deleted
- Entity deduplication pipeline: embed → cosine search → FTS → LLM resolver →
  canonical form
- Official MCP server
- **Caveat: Cannot run fully offline** — LLM API required for graph building.
  Requires Neo4j, FalkorDB, Kuzu, or Neptune as backend.

**Obsidian** as the closest model to T28's file-canonical ideal [D2a, D9]:

- Every `.md` file = graph node, every `[[wiki-link]]` = directed edge
- `obra/knowledge-graph` (March 2026): exports vault to SQLite + sqlite-vec +
  FTS5 + graphology, exposes PageRank, Louvain, betweenness centrality, BFS as
  MCP tools
- Three MCP server options: MCPVault (725 stars), obsidian-mcp (650 stars),
  cyanheads/obsidian-mcp-server (400+ stars TypeScript)
- **Harper Reed's pipeline (March 2026):** Claude Code parses sources → Obsidian
  nodes via wiki-links. Working T28 proof-of-concept exists externally.
- **Constraint:** Full API requires Obsidian desktop running. Filesystem-direct
  MCP servers work without it.

**Logseq** is not recommended: the DB version abandons plain-text markdown for
SQLite (violates T28's markdown-native preference), and the file-based version
is in maintenance mode [D2a].

**Confidence: HIGH** for capabilities as described; **MEDIUM** for operational
fit (requires direct testing at 1,000+ nodes).

---

### Theme 6: Schema Design — Three-Tier Node Hierarchy

The D6 research produced a concrete schema recommendation for T28, validated
against academic work in D4 (Graphiti patterns) [D6]:

**Three node types** (Goldilocks range: 3-7):

1. **SourceNode** — One per analyzed artifact. uuid, name, source_type (enum),
   url/path, ingested_at, status, summary, embedding, raw_content_hash,
   attributes{}.
2. **KnowledgeNode** — Extracted patterns, anti-patterns, capabilities,
   decisions, facts. uuid, name, labels
   (Pattern|AntiPattern|Decision|Capability|Fact), summary, embedding,
   confidence, frequency, attributes{}.
3. **ThemeNode** — Cross-source emergent clusters, derived periodically via
   community detection. uuid, name, summary, embedding, member_count.

**Six edge types** (Goldilocks range: 5-15):

1. `EXTRACTED_FROM` (KnowledgeNode → SourceNode): provenance
2. `ALSO_SEEN_IN` (KnowledgeNode → SourceNode): secondary source reference
3. `CONTRADICTS` (KnowledgeNode ↔ KnowledgeNode): conflicting knowledge
4. `REFINES` (KnowledgeNode → KnowledgeNode): updated/improved version
5. `RELATED_TO` (KnowledgeNode ↔ KnowledgeNode): generic semantic relationship
6. `MEMBER_OF` (KnowledgeNode → ThemeNode): cluster membership

**Key design laws from D6:**

- Open World Assumption: absence of fact ≠ false. New source types and edge
  types are valid immediately without migration.
- Typed Core + Free Extension: strongly-typed base properties + schema-free
  `attributes{}` dict.
- Soft Deprecation, Never Deletion: set `status: deprecated` or `invalid_at`
  timestamp. Enables time-travel queries.

This maps directly to Graphiti's Episodes → Entities → Communities three-tier
hierarchy and to A-MEM's multi-attribute node model (content + keywords + tags +
contextual description + embedding + links) [D4].

**Confidence: HIGH** — schema validated against multiple independent academic
and production architectures.

**CRITICAL CORRECTION for brainstorm:** The term "Dual-Embedding Memory Bank"
does not appear in the MemSkill paper (arXiv:2602.02474). The mechanism is a
single shared embedding space. Brainstorm decision #9 should be updated.
MemSkill uses flat memory items, not an entity/relation schema. For T28's schema
design, Graphiti and MAGMA are the applicable references [D4].

---

### Theme 7: Synthesis Operations That Only Graphs Enable

D10 identifies 10 things flat files definitively cannot do, all relevant to
T28's synthesis mission [D10]:

1. Resolve entity co-reference across sources (same concept, different names)
2. Detect contradictions between sources
3. Compute structural importance (PageRank)
4. Identify bridge concepts (betweenness centrality)
5. Answer global/holistic queries ("main themes across ALL sources?")
6. Multi-hop chain traversal (A→B→C reasoning)
7. Track temporal validity (when facts were/ceased to be true)
8. Pre-compute community summaries (O(1) global queries)
9. Infer missing connections (link prediction)
10. Deduplicate across source boundaries

Key T28 queries requiring graph operations [D10]:

| Query                                             | Graph Operation             |
| ------------------------------------------------- | --------------------------- |
| "Most important concept across all sources?"      | PageRank on concept nodes   |
| "What repos contradict each other on X?"          | Edge conflict detection     |
| "What themes bridge repo and website analysis?"   | Cross-community betweenness |
| "What did these 3 sources collectively conclude?" | Community-scoped map-reduce |
| "Which concepts bridge the most disparate ideas?" | Betweenness/frequency ratio |

Empirical validation [D10]:

- GraphRAG: 72-83% win rate over vector RAG on comprehensiveness (EMNLP 2025) —
  **LOW confidence: percentage from single paper, unverified independently**
- Graphiti: 18.5% accuracy gain, 90% latency reduction on LongMemEval — **MEDIUM
  confidence: self-reported, single benchmark**
- LightRAG: 40% response time reduction at 10x fewer tokens — **LOW confidence:
  single source claim**

**Confidence: HIGH** that graphs enable these operations (the operations
themselves are well-defined). **LOW** on the specific performance numbers (all
self-reported by tool authors).

---

### Theme 8: Command Interface and Operation Design

D7 synthesized a 7-command interface for T28 from codebase prior art [D7]:

| Command         | Meaning                                              |
| --------------- | ---------------------------------------------------- |
| `ingest`        | Register new source (metadata only)                  |
| `absorb`        | Extract entities/relations into graph                |
| `query`         | Hybrid search: BM25 + vector + graph traversal       |
| `cleanup`       | Expire stale, resolve duplicates, merge canonicals   |
| `breakdown`     | Split over-dense nodes (anti-cramming)               |
| `rebuild-index` | Regenerate FTS/vector indexes after bulk mutations   |
| `reorganize`    | Run community detection, update context tree weights |

**Critical design insight:** `ingest` ≠ `absorb`. Ingestion is metadata
registration; absorption is semantic extraction. Decoupling is necessary for
rate limits, paywalls, async fetches [D7].

**Anti-cramming / anti-thinning thresholds** prevent graph quality degradation
[D7]:

- Split trigger (anti-cramming): >3 semantically distinct edge clusters pointing
  to node, OR >8 observations per node, OR contradictory incoming edges
- Enrich trigger (anti-thinning): <4 observations AND >3 incoming references
  (stub node), OR high cosine similarity to 2+ other nodes (merge candidate)
- 15-entry checkpoint cycle after every 15 `absorb` operations: dedup pipeline +
  cramming/thinning checks + index rebuild + quality log

**"Answers compound into wiki"** — synthesis nodes self-organize [D7]: Synthesis
nodes accumulate references from their source nodes and rank higher than raw
sources on repeated retrieval. The graph becomes a living wiki. Uses A-MEM's
bidirectional evolution: new node insertion triggers regeneration of linked
nodes' contextual attributes.

**Dual interface:** MCP for Claude Code integration, CLI `--json` for
agent-native scripting [D7].

**Confidence: HIGH** — derived from analysis of 3 concrete prior-art systems
(farzaa, qmd, Karpathy pipeline).

---

### Theme 9: Migration Path from Current Codebase Is Near-Zero Friction

The existing `.research/` artifacts map directly to T28's graph schema with no
data loss [D9, D7]:

Current inventory:

- 11+ `repo-analysis/<slug>/analysis.json` files (rich structured JSON, schema
  4.3) → SourceNodes
- 11+ `repo-analysis/<slug>/findings.jsonl` → KnowledgeNodes linked to
  SourceNodes
- 5+ `website-analysis/<slug>/analysis.json` + findings.jsonl → same pattern
- `extraction-journal.jsonl` (168 entries, schema 2.0) → candidate nodes +
  cross-source edges
- `EXTRACTIONS.md` — already a derived view of JSONL; the graph doesn't replace
  it

The `analysis.json` schema 4.3 structure is already graph-ready: slug, stars,
language, repoType, repoSubtype, analyzedAt map directly to SourceNode
properties with no transformation [D9].

**EXTRACTIONS.md is already a derived view** — it auto-generates from
`extraction-journal.jsonl`. The project already uses the
file-canonical/derived-view pattern instinctively. T28 formalizes and extends
what's already happening [D9].

Migration phases (all additive, files never rewritten):

1. Bootstrap: Read each `analysis.json` → create SourceNode. Read each
   `findings.jsonl` → create KnowledgeNodes linked to SourceNode.
2. Relationship extraction: Cross-reference `extraction-journal.jsonl` against
   source nodes, wire candidate nodes via `ALSO_SEEN_IN` edges.
3. Augmentation: Graph-only edges added incrementally as synthesis queries
   discover relationships.

**Confidence: HIGH** — based on direct codebase inspection of 168+ JSONL entries
and 11+ analysis.json files.

---

## Comparative Analysis of Backend Options

| Backend                   | Type                    | MCP                   | Graph Traversal          | FTS+Vector            | Windows       | Scale                | Infrastructure           | Status           |
| ------------------------- | ----------------------- | --------------------- | ------------------------ | --------------------- | ------------- | -------------------- | ------------------------ | ---------------- |
| **SQLite + simple-graph** | Relational + CTE        | Confirmed             | Recursive CTEs           | FTS5 + sqlite-vec     | Native        | ~100K nodes          | Zero                     | Stable           |
| **LadybugDB**             | Embedded graph (Cypher) | Via MemoryGraph       | Native Cypher            | Native extension      | x64           | Hundreds of millions | Zero                     | 6-month fork     |
| **BasicMemory**           | Markdown + SQLite       | Native (primary)      | `memory://` traversal    | FTS5 + FastEmbed      | Via Node      | Thousands            | Zero (AGPL)              | Active v0.19     |
| **Graphiti/Zep**          | Temporal graph engine   | Official              | Full + bi-temporal       | BM25 + vector + graph | Via container | Millions             | Neo4j/FalkorDB + LLM API | 24.6K stars      |
| **MCP memory server**     | JSONL flat file         | Existing (in project) | None                     | None (substring scan) | Native        | ~50 entities         | Zero                     | Proof-of-concept |
| **Obsidian vault**        | Markdown + wiki-links   | 3 servers             | Via obra/knowledge-graph | FTS5 + sqlite-vec     | Native        | 10K+ notes           | Obsidian app             | Production       |
| **Kuzu (original)**       | Embedded graph          | Via kuzu-memory       | Native Cypher            | Vector index          | Windows       | Hundreds of millions | Zero                     | DEAD (Oct 2025)  |
| **DuckDB**                | OLAP columnar           | 2 wrappers            | DuckPGQ (SQL/PGQ)        | Extension-based       | Native        | Billions of rows     | Zero                     | Stable           |
| **Neo4j**                 | Server graph            | mcp-neo4j (932 stars) | Full Cypher + GDS        | Native                | Via Docker    | Billions             | Server required          | Enterprise       |

**Eliminated:**

- KuzuDB (original): archived October 2025, not maintained
- DuckDB as primary store: 10-500x write penalty for OLTP inserts
- MCP memory server: degrades at ~50-80 entities for T28's use case
- FalkorDB Lite: spawns Redis process, requires WSL2 on Windows
- Logseq DB version: abandons markdown-native model
- Grafeo: creator recommends against it, AI-generated codebase concerns

---

## Contradictions and Open Questions

### Contradiction 1: KuzuDB Availability

D1a treated KuzuDB as an active tool and recommended it as a "strong unlisted
candidate." D1b found it was archived in October 2025 and its team was acquired.
**Resolution:** D1b is correct — KuzuDB (original) is dead. D1a's recommendation
applies to **LadybugDB**, the community fork. D1a should be read as a
recommendation for the Kuzu-derived ecosystem, not the specific original
package. **Confidence: HIGH** in D1b's finding.

### Contradiction 2: Benchmark Claims

D5b notes that multiple MCP servers claim #1 on LongMemEval/LoCoMo benchmarks
with incompatible results. Specifically: Ogham claims 91.8% on LongMemEval;
Graphiti claims 18.5% accuracy gain; Memori claims 81.95% on LoCoMo. These are
different benchmarks with different methodologies and are self-reported by tool
authors. **Resolution:** Treat all performance claims as LOW confidence unless
independently replicated. Do not use them as differentiators in backend
selection.

### Contradiction 3: Obsidian CLI Headless Reliability

D2a reports filesystem-direct MCP servers (MCPVault, obsidian-mcp) work WITHOUT
Obsidian running, but also notes the `obsidian eval` CLI's reliability in
headless/CI environments is unconfirmed. **Resolution:** For T28's use case
(Claude Code integration, not CI pipeline), the filesystem-direct MCP path is
sufficient and confirmed working. The headless CLI gap only matters if T28 needs
to run in automated pipelines without a desktop environment.

### Contradiction 4: D1a's Kuzu MCP Wrappers vs D1b's Fork Status

D1a mentioned "kuzu-memory" and "kuzu-memory-graph-mcp" as existing MCP wrappers
for Kuzu. D5a found bobmatnyc/kuzu-memory uses a "ryugraph fork" rather than
LadybugDB. MemoryGraph (D5b) supports LadybugDB directly. **Resolution:** The
kuzu-memory MCP server ecosystem is fragmented across forks. MemoryGraph is the
cleaner LadybugDB-native MCP path.

### Open Questions

1. What is the exact MCP server currently configured as "memory" in this project
   — is it `@modelcontextprotocol/server-memory`, `mcp-memory-enhanced`, or
   something else? Needs direct verification before T28 build.
2. How long does graph reconstruction take from ~168 JSONL entries + 11
   analysis.json files? Sub-second is assumed for SQLite but not benchmarked.
3. What is the performance profile for incremental graph update (add 1 new
   source) vs full rebuild for T28's use pattern (1-5 sources per session)?
4. Is LadybugDB stable enough for production data 6 months after forking from
   KuzuDB? Needs tracking.
5. AgentMemory syncs with `~/.claude/projects/*/memory/MEMORY.md` — does this
   create write conflicts with the existing auto-memory system? Needs direct
   testing.

---

## Confidence Assessment

| Category                               | Confidence | Notes                                                |
| -------------------------------------- | ---------- | ---------------------------------------------------- |
| Files canonical, graph derived         | HIGH       | 4 independent systems confirm                        |
| MCP memory server inadequacy           | HIGH       | Direct codebase analysis                             |
| SQLite + simple-graph for T28 scale    | HIGH       | Multiple independent sources                         |
| Schema design (3-tier hierarchy)       | HIGH       | Cross-validated against Graphiti, MAGMA, A-MEM       |
| LadybugDB capabilities                 | HIGH       | Well-documented; **MEDIUM stability** (6-month fork) |
| Migration path near-zero friction      | HIGH       | Direct codebase inspection                           |
| Synthesis operations enabled by graphs | HIGH       | Operations well-defined; numbers LOW confidence      |
| BasicMemory architecture fit           | HIGH       | **MEDIUM adoption fit** due to AGPL v3               |
| Graphiti architecture patterns         | HIGH       | 24.6K stars, arXiv-backed                            |
| Performance benchmark numbers          | LOW        | All self-reported by tool authors                    |
| Brainstorm "dual-embedding" claim      | CORRECTED  | Term does not exist in MemSkill paper                |

---

## Recommendations

### Primary Recommendation: SQLite + simple-graph + FTS5 + sqlite-vec

Build T28's graph layer on SQLite using the simple-graph schema, extended with
FTS5 (keyword search), sqlite-vec (vector similarity), and recursive CTEs (graph
traversal). This is the lowest-risk path: proven at T28's scale, zero
infrastructure, cross-platform Windows native, multiple confirmed MCP wrappers,
and fully regenerable from `.research/` files [D1a, D7, D9].

Adopt Graphiti's architectural patterns (bi-temporal edges, three-tier
hierarchy, hybrid RRF retrieval, non-destructive contradiction) as the schema
design blueprint, implemented in SQLite rather than running the Graphiti server
[D4, D6].

The schema from D6 maps directly: SourceNode table, KnowledgeNode table,
ThemeNode table, six edge types. All base properties fit cleanly into JSON
columns. `attributes{}` dict handles schema-free extension without migration
[D6].

### Secondary Recommendation: Evaluate LadybugDB at 6-Month Stability Review

If Cypher query semantics prove significantly easier than recursive CTEs for
T28's synthesis operations, revisit LadybugDB at its 12-month mark (October
2026). At that point it will have 12 months of community fork history —
sufficient to assess production stability. MemoryGraph provides the MCP bridge
[D1b, D5b].

### MCP Integration Recommendation: BasicMemory Architecture (without its codebase)

Do not adopt BasicMemory's codebase due to AGPL v3 constraints. Adopt its
architecture: Markdown files + SQLite as index + FTS + vector. For immediate MCP
integration, evaluate AgentMemory (syncs with existing `MEMORY.md`
infrastructure) as the lowest-friction path [D5b]. For MCP tooling without
infrastructure, `obra/knowledge-graph` provides the strongest graph analytics
(PageRank, Louvain, betweenness centrality) in a serverless Claude Code plugin
format [D5a].

### Immediate Pre-Build Actions

1. Verify which MCP memory server is currently configured in the project
   (package name, version, backend). Do not assume it is
   `@modelcontextprotocol/server-memory` [D3].
2. Update brainstorm decision #9: remove "Dual-Embedding Memory Bank" framing —
   this term does not exist in MemSkill. Replace with "single shared embedding
   space" [D4].
3. Run a bootstrap test: read 10 `analysis.json` files → write to SQLite
   simple-graph schema → confirm the mapping and measure time.

---

## Unexpected Findings

- **KuzuDB was archived**: The brainstorm and D1a reference KuzuDB as an active
  embedded graph database. It was archived in October 2025 when the team was
  acquired (likely by Apple). The community fork LadybugDB has significant
  momentum but is 6 months old [D1b].
- **Agent-native memory frameworks are a distinct category**: The research
  expected to evaluate PKM tools vs databases. A third category emerged — tools
  designed ground-up for AI agent operations (Graphiti, BasicMemory, Mem0). This
  is a better architectural fit than retrofitted PKM tools [D2b].
- **The project already uses file-canonical/derived-view instinctively**:
  `EXTRACTIONS.md` is already a derived view of `extraction-journal.jsonl`. T28
  formalizes what the project is already doing [D9].
- **Harper Reed's pipeline is a working T28 proof-of-concept**: Claude Code →
  Obsidian nodes via wiki-links already exists as a March 2026 external
  proof-of-concept [D2a].
- **MemoryMesh's schema-driven tool generation**: Define entity types as YAML,
  get auto-generated CRUD MCP tools. Generalizable pattern worth adopting
  regardless of backend choice [D5b].
- **mind-mem's contradiction detection as first-class feature**: A brand-new MCP
  server (March 2026, 10 stars) implements contradiction detection (when stored
  knowledge conflicts) as a primary feature — this is directly relevant to T28's
  synthesis mission [D5b].
- **AgentMemory syncs with `~/.claude/projects/*/memory/MEMORY.md`**: Directly
  compatible with this project's existing auto-memory infrastructure [D5b].
- **GraphRAG 72-83% win rate over vector RAG**: Even though the specific number
  is low-confidence, the pattern is well-established — graph-augmented retrieval
  consistently outperforms vector-only retrieval on comprehensiveness [D10].

---

## Challenges Section

_(Phase 3 contrarian and out-of-the-box agents were not run for this session.
Challenges to the recommendation are noted inline above where contradictions
exist.)_

Key challenges that remain unresolved:

1. SQLite recursive CTEs for graph traversal at 5000+ edges — performance curve
   at density extremes needs direct measurement.
2. AGPL v3 on BasicMemory constrains the most architecturally aligned tool.
3. LadybugDB's fork stability is unverifiable at this stage.
4. Graphiti's LLM-API requirement for ingestion creates ongoing cost and
   offline-usage constraints.

---

## Sources (Tiered by Authority)

### Tier 1: Official Documentation and Academic Papers

| ID    | Source                                                         | Type              | Trust | CRAAP |
| ----- | -------------------------------------------------------------- | ----------------- | ----- | ----- |
| S-001 | github.com/basicmachines-co/basic-memory/README.md             | Official docs     | HIGH  | 4.6   |
| S-002 | docs.basicmemory.com/concepts/knowledge-format                 | Official docs     | HIGH  | 4.5   |
| S-003 | lightrag.github.io                                             | Official docs     | HIGH  | 4.3   |
| S-004 | arXiv:2501.13956 (Zep/Graphiti paper)                          | Academic          | HIGH  | 4.8   |
| S-005 | arXiv:2602.02474 (MemSkill paper)                              | Academic          | HIGH  | 4.7   |
| S-006 | arXiv:2601.03236 (MAGMA paper)                                 | Academic          | HIGH  | 4.7   |
| S-007 | arXiv:2502.12110 (A-MEM paper)                                 | Academic          | HIGH  | 4.6   |
| S-008 | github.com/modelcontextprotocol/servers (memory server source) | Official codebase | HIGH  | 4.8   |
| S-009 | github.com/zep-ai/graphiti                                     | Official repo     | HIGH  | 4.6   |
| S-010 | github.com/Paul-Kyle/palinode                                  | Official repo     | HIGH  | 4.4   |
| S-011 | github.com/spiceai/duckdb (DuckPGQ)                            | Official repo     | HIGH  | 4.3   |
| S-012 | sqlite.org/fts5.html                                           | Official docs     | HIGH  | 5.0   |

### Tier 2: Community Projects with Verified Track Records

| ID    | Source                                                | Type               | Trust       | CRAAP |
| ----- | ----------------------------------------------------- | ------------------ | ----------- | ----- |
| S-013 | github.com/ladybugdb/ladybugdb                        | Community fork     | MEDIUM-HIGH | 3.8   |
| S-014 | github.com/bobmatnyc/kuzu-memory                      | Community project  | MEDIUM      | 3.6   |
| S-015 | github.com/simonw/sqlite-utils (simple-graph pattern) | Community project  | HIGH        | 4.2   |
| S-016 | github.com/obra/knowledge-graph                       | Claude Code plugin | MEDIUM-HIGH | 3.9   |
| S-017 | github.com/cyanheads/obsidian-mcp-server              | Community project  | MEDIUM-HIGH | 4.0   |
| S-018 | github.com/agentmemory/agent-memory (AgentMemory)     | Community project  | MEDIUM      | 3.8   |
| S-019 | github.com/mem0ai/mem0                                | Community project  | HIGH        | 4.2   |
| S-020 | github.com/njrapidinnovation/memento-mcp              | Community project  | MEDIUM      | 3.7   |
| S-021 | github.com/MemoryMesh project                         | Community project  | MEDIUM      | 3.5   |
| S-022 | deepwiki.com/basicmachines-co/basic-memory            | Community docs     | MEDIUM-HIGH | 4.2   |
| S-023 | dev.to/charles_li — Git-Native Memory Layer           | Community blog     | MEDIUM      | 3.8   |
| S-024 | github.com/memori-ai/memori                           | Community project  | MEDIUM      | 3.7   |

### Tier 3: Codebase Ground Truth

| ID    | Source                                                                        | Type              | Trust | CRAAP |
| ----- | ----------------------------------------------------------------------------- | ----------------- | ----- | ----- |
| S-025 | .research/extraction-journal.jsonl (168 entries, schema 2.0)                  | Internal codebase | HIGH  | 5.0   |
| S-026 | .research/repo-analysis/\*/analysis.json (schema 4.3)                         | Internal codebase | HIGH  | 5.0   |
| S-027 | .research/unified-content-intelligence/BRAINSTORM.md                          | Internal document | HIGH  | 5.0   |
| S-028 | github.com/modelcontextprotocol/servers — Issue #2415                         | Bug report        | HIGH  | 4.5   |
| S-029 | CLAUDE.md + MEMORY.md (project rules)                                         | Internal document | HIGH  | 5.0   |
| S-030 | .research/t28-intelligence-graph-data-layer/findings/D7-codebase-prior-art.md | Internal research | HIGH  | 5.0   |

---

## Methodology

**Agents dispatched:** 12 searcher agents covering 10 sub-questions (D1/D2/D5
split into a/b pairs; D8 skipped as covered by D1+D2)

**Coverage:** Embedded relational DBs (D1a), graph-native embedded DBs (D1b),
Obsidian/Logseq (D2a), PKM and agent-native tools (D2b), MCP memory server
internals (D3), academic memory research (D4), popular graph MCP servers (D5a),
emerging graph MCP servers (D5b), entity/relation schema design (D6), codebase
prior art (D7), file-graph coexistence (D9), synthesis operations (D10)

**Total sources evaluated across all agents:** 200+

**Synthesis approach:** Thematic organization (not agent-by-agent). Findings
deduplicated across agents. KuzuDB/LadybugDB contradiction resolved by
cross-referencing D1a, D1b, and D5a findings. Performance numbers flagged as LOW
confidence due to self-reporting bias across all tool authors.

**D8 skipped:** Architecture tradeoffs were fully covered by D1a + D1b
(relational vs graph-native) and D9 (file-graph coexistence). Running D8 would
have produced redundant findings.
