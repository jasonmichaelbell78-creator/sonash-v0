# Findings: TiddlyWiki, Zettlr, and Standalone Knowledge Tools

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-07 **Sub-Question:** D2b-2

---

## Summary

Six standalone tools investigated. Key architectural patterns for T28: Trilium's
`attributes` table is the cleanest typed property graph in PKM (6 tables,
label|relation types, inheritable). SiYuan's hybrid storage (JSON files + SQLite
refs index) is the most balanced portability/queryability pattern. TiddlyWiki's
filter pipeline is a proven live-reactive query system. Zettlr's ID-stable links
decouple identity from display title. Tana's supertag-as-type is the cleanest
UX-to-graph mapping. Untyped undirected graphs become hairballs at scale — typed
edges are mandatory.

---

## Key Findings

### 1. TiddlyWiki: Quine Architecture — Everything Is a Tiddler [CONFIDENCE: HIGH]

Single self-modifying HTML file. Data model: immutable tiddler objects with
`fields` map, title as primary key. Standard fields: `title`, `text`, `type`,
`tags`, `modified`, `created`, plus arbitrary custom fields.

**Relationships are NOT first-class.** Simulated through:

- Tags: `[tag[X]]` retrieves all tagged tiddlers
- Wiki links: `[[TiddlerName]]` parsed from text
- Custom fields: `parent:: SomeTiddler` — manual semantics
- Transclusion: `{{TiddlerName}}` embeds content live

**Filter language** is the key innovation: pipeline-based query system.
Operators: `tag[]`, `field[]`, `search[]`, `links[]`, `backlinks[]`, `has[]`,
`sort[]`, set operations (`+`, `-`). Live-reactive — recomputes on tiddler
change. Not declarative graph query but highly composable.

**TW5-Graph** (successor to abandoned TiddlyMap): adds explicit edge storage in
separate metadata tiddlers. Active as of 2025.

### 2. Zettlr: ID-Stable Links [CONFIDENCE: HIGH]

Markdown-first Zettelkasten editor, v4.3.x. No database — plain `.md` files.

- Links use **file ID** (timestamp `YYYYMMDDHHMMSS`), not filename — rename
  without breaking links
- Implicit links via `#hashtags` and YAML keywords
- Graph view: D3 force-directed, one vertex per file,
  untyped/undirected/unweighted edges
- V4.0 (Dec 2025): FSAL rewrite, citation parser improvements

**T28 lesson:** ID-stable links are critical. Zettlr's ceiling (untyped,
undirected, unweighted edges) shows limits of pure-Markdown approach.

### 3. Trilium Notes: SQLite-Backed Typed Property Graph [CONFIDENCE: HIGH]

TriliumNext uses SQLite as source of truth with in-memory cache (Becca server,
Froca client).

**Core schema (6 tables):**

- `notes`: `noteId`, `title`, `type`, `mime`, `blobId`
- `branches`: Parent-child DAG — one note can have **multiple parents** via
  multiple branch rows
- `attributes`: Both labels AND relations. `type` (label|relation), `name`,
  `value` (targetNoteId for relations), `isInheritable`
- `blobs`: Content (content-addressed)
- `entity_changes`: Sync

**Key patterns:**

- Multi-parent hierarchy = DAG, not tree
- Relations = typed directed edges with user-defined type names
- `isInheritable=true` cascades attributes to descendants
- Becca cache: load everything into memory at startup for fast traversal

**T28 lesson:** `attributes` table is the cleanest typed property graph in
personal PKM. Simple schema, rich semantics. Becca cache pattern viable for
personal scale.

### 4. SiYuan: JSON Files + SQLite Index + refs Table [CONFIDENCE: HIGH]

Content stored as `.sy` JSON files (block-level AST). SQLite index for queries.

**Core tables:**

- `blocks`: `id`, `parent_id`, `root_id`, `content`, `type`, `created`
- `refs`: `source_block_id → target_block_id` — built by indexer from
  `((target-id))` syntax

**SQL as query language:** Users write `SELECT * FROM blocks WHERE ...`
directly. No custom DSL.

**T28 lesson:** Human-readable files + SQLite index = portability +
queryability. SQL-as-query for agents is compelling — if schema is simple, agent
writes queries directly.

### 5. Tana: Typed Graph with Supertags [CONFIDENCE: MEDIUM]

Proprietary ($25M Feb 2025). Everything is a node in a graph database.

- **Supertags** = type categories (`#person`, `#project`)
- **Fields on supertags** = typed edge schemas ("responsible for: [node ref]")
- Creates typed property graph where edges have names and types
- Standard outliner UX hides graph complexity

**T28 lesson:** Supertag-as-type is cleanest UX-to-graph mapping. Users define
types and relationships without understanding graph theory.

### 6. Docmost, Outline, BookStack: No Graph Features [CONFIDENCE: MEDIUM]

Document-oriented tools with no link graph, typed relationships, or graph
visualization. Confirms wikis without graph model hit a structural ceiling.

### 7. Emerging Patterns: Temporal Graphs + AI Agent Memory [CONFIDENCE: MEDIUM]

- **Graphiti temporal edges:** `(t_valid, t_invalid)` records WHEN relationships
  were true
- **GraphRAG:** Dual-channel retrieval — vector search + graph traversal
- **Three-memory pattern:** Short-term (conversation), long-term (entity graph),
  reasoning (decision traces)
- **Athens Research:** Confirmed abandoned on GitHub

### 8. Architectural Anti-Patterns [CONFIDENCE: MEDIUM]

- **Untyped undirected edges** → hairball graphs at scale (confirmed by Zettlr's
  own docs)
- **Link parsing vs structural storage** → file moves break parsed links unless
  IDs used
- **Tags simulating relationships** → collapses semantically as vocabulary grows
- **Single-parent hierarchy** → can't represent DAG-nature of knowledge
- **Portability vs queryability** → SiYuan's hybrid (files + index) is most
  balanced

---

## Sources

| #     | Title                                                                | Type               | Trust       |
| ----- | -------------------------------------------------------------------- | ------------------ | ----------- |
| 1     | TiddlyWiki5 Architecture (DeepWiki)                                  | Technical docs     | MEDIUM-HIGH |
| 2     | TiddlyWiki Dev Datamodel                                             | Official docs      | HIGH        |
| 3     | TiddlyWiki Filters Reference                                         | Official docs      | HIGH        |
| 4-5   | TW5-Graph thread + TiddlyMap GitHub                                  | Community          | MEDIUM      |
| 6-8   | Zettlr Graph View, Zettelkasten, v4.0 release                        | Official docs      | HIGH        |
| 9-11  | Trilium Attribute System, Architecture, PKB Patterns (DeepWiki/Wiki) | Technical/Official | MEDIUM-HIGH |
| 12-13 | Logseq Architecture (DeepWiki), DB release log                       | Technical          | MEDIUM-HIGH |
| 14-15 | SiYuan Block Management (DeepWiki), Architecture overview            | Technical          | MEDIUM-HIGH |
| 16-17 | Tana Knowledge Graph, $25M funding (TechCrunch)                      | Official/News      | MEDIUM      |
| 18    | Open Source Knowledge Base Software comparison                       | Blog               | LOW         |
| 19-20 | Graphiti/Zep arXiv paper, GitHub                                     | Academic/Official  | HIGH        |

---

## Contradictions

1. **Portability vs queryability:** SiYuan (files + index) vs Logseq DB (SQLite
   only). No consensus. T28 must pick a side.

2. **Edges in content vs metadata:** TiddlyMap (separate metadata tiddlers) vs
   SiYuan/Logseq (parsed from content + index) vs Trilium (separate attributes
   table). Different failure modes, no convergent answer.

3. **Graph view utility at scale:** Zettlr warns "spatial positioning holds no
   meaningful significance." Tana argues typed graphs remain navigable.
   **Resolution:** Untyped = hairball; typed = meaningful.

---

## Gaps

1. TW5-Graph internal edge schema specifics not documented
2. Logseq DB SQLite schema not publicly documented
3. Zettlr backlink implementation details not in public docs
4. SiYuan Attribute View typed relations schema underdocumented
5. No verified graph traversal performance benchmarks at scale from any tool

---

## Serendipity

1. **Graphiti temporal edges** — recording WHEN relationships were true. Not in
   any PKM tool but directly applicable to T28 for evolving knowledge.
2. **Athens Research dead** — open-source graph PKM sustainability is a real
   concern. Only tools with commercial backing or active maintainer community
   survive.
3. **SiYuan SQL-as-query-language** — if graph schema is simple, agents can
   write SQL directly rather than needing custom query API.
4. **TiddlyWiki quine model** survived 20+ years — architectural purity as
   survival mechanism. If T28 needs maximally portable artifacts, quine pattern
   worth considering.
