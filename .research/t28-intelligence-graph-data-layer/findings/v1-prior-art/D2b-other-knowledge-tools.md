# D2b: Knowledge Management Tools Beyond Obsidian/Logseq

**Searcher:** deep-research-searcher | **Profile:** web+docs | **Date:**
2026-04-07 **Sources:** 41 | **Confidence:** HIGH:12, MEDIUM:18, LOW:4,
UNVERIFIED:2

---

## MAJOR SERENDIPITY: AI-Native Memory Frameworks

A distinct category exists that is MORE appropriate than PKM tools — tools
designed ground-up as AI agent knowledge stores, not retrofitted from
note-taking apps.

### Graphiti/Zep — Temporal Knowledge Graph for Agents [HIGH]

- **What:** Open-source TEMPORAL context graph engine. Tracks how facts change
  over time. Validity windows, provenance, historical context.
- **License:** Apache 2.0. 24,600+ stars. Very active.
- **Backend:** Requires graph DB (Neo4j, FalkorDB, Kuzu/LadybugDB, Neptune) +
  LLM API
- **MCP:** Official MCP server built in
- **Caveat:** Cannot run fully offline — LLM API required for graph building
- **For T28:** Strongest for temporal knowledge with complex relationships.
  Infrastructure overhead is real.

### BasicMemory — Markdown-Native, Zero Infrastructure [HIGH]

- **What:** AI knowledge graph as Markdown files + SQLite indexing + FastEmbed
  semantic search
- **License:** AGPL v3. 2,800+ stars. Active (v0.19.0).
- **Model:** Entity-Observation-Relation. Wiki-links define graph edges.
- **MCP:** NATIVE — primary interface IS MCP. `write_note`, `read_note`,
  `build_context` (graph traversal via `memory://` URLs), `search`
- **Infrastructure:** Zero. Files at `~/basic-memory`. No DB, no Docker, no
  server.
- **Hybrid search:** Full-text + vector (v0.19.0)
- **For T28:** LOWEST FRICTION option. Zero infra, MCP-native, local-first,
  files readable directly.

### Mem0 — Hybrid Vector+Graph Memory [HIGH]

- **What:** Memory layer with auto-entity extraction from conversations.
  Vector + directed knowledge graph.
- **Backend:** Vector store + optional graph (Neo4j or **Kuzu/LadybugDB** —
  embeddable, no server)
- **MCP:** Server shipped June 2025
- **For T28:** Strong if auto-extraction valued. Kuzu backend removes server
  dependency.

### Cognee — LLM Knowledge Graph Pipeline [MEDIUM]

- **What:** 6-stage pipeline: classify → permissions → chunk → LLM entity
  extraction → summary → embed+commit
- **Funding:** $7.5M seed (OpenAI/FAIR founders)
- **MCP:** Available for Claude Desktop
- **Caveat:** Docker+PostgreSQL required. LLM API cost per ingestion.

## PKM Tools Evaluated

| Tool              | Status               | MCP                                   | Local                      | For T28?                           |
| ----------------- | -------------------- | ------------------------------------- | -------------------------- | ---------------------------------- |
| **Tana**          | Active ($25M raised) | OFFICIAL, auto-configures Claude Code | Cloud (desktop proxy)      | Best MCP but cloud-locked          |
| **Anytype**       | Active               | OFFICIAL (v1.2.5) + headless CLI      | Local-first P2P            | Good but degrades at 1K-3K objects |
| **Capacities**    | Active               | Community only, beta API              | Cloud only                 | Usable but limited                 |
| **Roam Research** | Slow development     | Community MCP                         | Cloud only                 | Viable but declining               |
| **Heptabase**     | Active               | Official                              | Cloud only, backup removed | Not suited for programmatic use    |
| **Dendron**       | DEAD (Feb 2023)      | None                                  | N/A                        | Eliminate                          |
| **Foam**          | Maintenance          | None                                  | Local (filesystem only)    | No structured API                  |
| **AFFiNE**        | Alpha                | Community                             | Local-first                | Secondary option                   |

## Key Insight

**The PKM-vs-agent-memory split is now a real category boundary.** PKM tools
(Tana, Anytype) are retrofitting MCP onto human-centric tools. Agent-native
frameworks (Graphiti, BasicMemory, Mem0) design the data model around agent
operations. T28 should seriously evaluate the agent-native category — it's a
better architectural fit.

## Additional Serendipity

- **Tana auto-configures Claude Code** — writes to `~/.claude/.config.json` on
  launch
- **Anytype has headless CLI** — no UI dependency for automation
- **BasicMemory's `memory://` URL scheme** — graph traversal via URL-like
  references
- **Kuzu/LadybugDB as embedded backend for both Graphiti and Mem0** — removes
  server dependency
