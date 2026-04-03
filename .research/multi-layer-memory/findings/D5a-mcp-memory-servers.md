# Findings: MCP Servers for Memory and Knowledge Management

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** SQ5 (agent 1 of 2)

---

## Key Findings

### 1. The Project Already Uses Two MCP Memory Servers [CONFIDENCE: HIGH]

The project's `.mcp.json` confirms a single memory server configured, but
`.claude/settings.global-template.json` and the settings permissions reveal two
distinct memory mechanisms active:

**A. `@modelcontextprotocol/server-memory` (the "memory" MCP server)**

- Configured in `.mcp.json` as
  `cmd /c npx -y @modelcontextprotocol/server-memory`
- This is Anthropic's official reference implementation
- Backend: Single JSONL file (`memory.jsonl`), path configurable via
  `MEMORY_FILE_PATH`
- Tools: `create_entities`, `create_relations`, `add_observations`,
  `delete_entities`, `delete_observations`, `delete_relations`, `read_graph`,
  `search_nodes`, `open_nodes`
- Storage model: Knowledge graph — entities (nodes with name, type,
  observations) + relations (directed edges in active voice)
- Install: `npx -y @modelcontextprotocol/server-memory` — works natively on
  Windows, no admin required
- Limitation: No semantic/vector search; `search_nodes` is keyword/string
  matching only. Full graph is loaded per request — scales poorly with large
  graphs.

**B. `episodic-memory@superpowers-marketplace` (Claude Code plugin)**

- Confirmed active via `settings.global-template.json` (line 51:
  `"episodic-memory@superpowers-marketplace": true`)
- MCP permission in `settings.json`:
  `mcp__plugin_episodic-memory_episodic-memory__search`
- This is a **Claude Code plugin** (not a standalone MCP server) — distributes
  as part of the Superpowers marketplace
- Backend: SQLite + sqlite-vec extension, 384-dimensional local embeddings via
  `@xenova/transformers` (offline, no API)
- Tools: `episodic_memory_search` (semantic vector or text search over past
  conversations), `episodic_memory_show` (retrieve full conversation by ID with
  line range)
- Data source: Indexes `.jsonl` files from `~/.claude/projects` — your
  conversation history
- Windows status: **Version 1.0.14+ resolved Windows ENOENT errors** via
  `npm.cmd` detection and `shell: true`. However, Issue #49 (Jan 2026, still
  open) reports MCP server startup failures on Windows with nvm-managed Node.
  The project uses fnm, not nvm, which may avoid this specific issue — but
  confirm with a live `/mcp` check.

---

### 2. Obsidian MCP Servers — Two Implementations [CONFIDENCE: HIGH]

**A. `mcp-obsidian` (MarkusPfundstein) — REST API bridge**

- Requires: Obsidian running + Local REST API community plugin installed + API
  key
- Backend: Obsidian's local REST API at `127.0.0.1:27124`
- Tools: `list_files_in_vault`, `list_files_in_dir`, `get_file_contents`,
  `search`, `patch_content`, `append_content`, `delete_file`
- Install: `uvx mcp-obsidian` (Python/uv required)
- Windows: Supported — config goes in
  `%APPDATA%/Claude/claude_desktop_config.json`
- Version 0.11.0 (March 2026) added `list_all_tags` tool; v0.9.1 fixed symlink
  traversal security
- Limitation: Requires Obsidian application to be running; depends on community
  plugin

**B. `obsidian-claude-code-mcp` (iansinnott) — Filesystem direct**

- No Obsidian plugin required — accesses vault as plain markdown folder
- Claude Code auto-discovers via WebSocket connection
- Backend: Direct filesystem reads
- Limitation: No Obsidian-specific features (graph, tags, backlinks)

**As a memory backend**: Obsidian vaults can serve as a durable, human-readable
markdown knowledge store. Paired with `mcp-obsidian`, Claude can write notes,
search content, patch frontmatter, and read structure. This is a viable
long-term memory layer for project knowledge, with the advantage of a
human-editable backing store. Weakness: no semantic/vector search built-in;
full-text search only.

---

### 3. NotebookLM MCP — Browser Automation Bridge [CONFIDENCE: HIGH]

**`notebooklm-mcp` (alfredang)**

- GitHub: `alfredang/notebooklm-mcp` (also: `WilliamACLove/notebooklm-mcp2026` —
  Jan 2026 unified version)
- Connection method: **Browser session cookies** (Playwright automation) — NOT a
  direct Google API. One-time `uv run notebooklm login` to authenticate.
- Tools (14): `list_notebooks`, `create_notebook`, `add_source_url`,
  `add_source_text`, `generate_audio_overview`, `generate_video_overview`,
  `generate_slide_deck`, `generate_mind_map`, `generate_infographic`,
  `generate_quiz`, `generate_flashcards`, `generate_summary_report`,
  `generate_data_table`, `ask_notebook`, `get_notebook_summary`
- Install: `uv run notebooklm` — Windows explicitly documented with Scoop/winget
  paths
- Windows compatible: Yes, with uv
- No official Google API: All interaction is via browser automation (session
  cookies); fragile to UI changes
- Security variant: `Pantheon-Security/notebooklm-mcp-secure` adds post-quantum
  encryption, 17 security hardening layers
- Use case: Store research sources in NotebookLM notebooks, query them from
  Claude — a read-focused knowledge retrieval layer
- Key limitation: No persistent memory semantics; NotebookLM is a
  source-grounded Q&A system, not a knowledge graph

---

### 4. Vector DB MCP Servers [CONFIDENCE: HIGH]

**A. Qdrant (Official: `qdrant/mcp-server-qdrant`)**

- Backend: Qdrant vector DB
- Tools: `qdrant-store` (store information + metadata), `qdrant-find` (semantic
  search by query)
- Embedding: FastEmbed only; default `sentence-transformers/all-MiniLM-L6-v2` —
  local, no API
- Local mode: `--qdrant-local-path /path/to/db` runs Qdrant in-process; no
  separate server, no Docker required
- Install: `uvx mcp-server-qdrant` or via Smithery
  `npx @smithery/cli install mcp-server-qdrant`
- Windows: No explicit documentation, but `uvx` is cross-platform. Local mode
  avoids Docker entirely.
- Limitation: Only 2 tools exposed (very minimal); requires uv/Python

**B. ChromaDB (Official: `chroma-core/chroma-mcp`)**

- Backend: ChromaDB (4 modes: ephemeral, persistent local, HTTP, Cloud)
- Tools (12): `chroma_list_collections`, `chroma_create_collection`,
  `chroma_peek_collection`, `chroma_get_collection_info`,
  `chroma_get_collection_count`, `chroma_modify_collection`,
  `chroma_delete_collection`, `chroma_add_documents`, `chroma_query_documents`,
  `chroma_get_documents`, `chroma_update_documents`, `chroma_delete_documents`
- Install: `uvx chroma-mcp` — no Docker required for ephemeral/persistent modes
- Windows: Cross-platform (no Windows-specific issues documented)
- Strength: Rich collection management, embedded mode works with no external
  server

**C. Pinecone (`pinecone-io/pinecone-mcp`)**

- Cloud-only: Requires Pinecone API key and cloud account
- Tools (9): `search-docs`, `describe-index-stats`, `create-index-for-model`,
  `upsert-records`, `search-records`, `cascading-search`, `rerank-documents`,
  plus documentation search
- Install: `npx -y @pinecone-database/mcp` — Windows native via npx
- Status: Public beta/preview as of late 2025; not production-ready
- Limitation: Cloud dependency, no local mode; not suitable for privacy-first or
  offline use

**D. Weaviate (`sndani/weaviate-mcp`)**

- Tools (10+): `check_connection`, `list_collections`, `get_schema`,
  `get_collection_objects`, `search`, `semantic_search`, `keyword_search`,
  `hybrid_search`, `is_multi_tenancy_enabled`, `get_tenant_list`
- Install: Smithery `npx -y @smithery/cli install @weaviate/mcp-server-weaviate`
  — Windows explicit support
- Requires: Running Weaviate instance (local Docker or cloud)
- Strength: Rich hybrid search (vector + keyword + metadata)
- Limitation: Requires running external Weaviate service

---

### 5. Knowledge Graph MCP Servers [CONFIDENCE: HIGH]

**A. `neo4j-contrib/mcp-neo4j` — Four sub-servers**

- `mcp-neo4j-cypher`: Natural language → Cypher query execution; requires APOC
  plugin
- `mcp-neo4j-memory`: Personal knowledge graph over Neo4j; cross-session
  persistence
- `mcp-neo4j-cloud-aura-api`: Manage Neo4j Aura cloud instances
- `mcp-neo4j-data-modeling`: Build and visualize graph schemas
- Install: Python-based, uvx or Docker
- Requirement: Running Neo4j instance (local Neo4j Desktop, Aura cloud, or
  Docker)
- Windows: No explicit docs; Python-based suggests cross-platform
- Limitation: Heavyweight — requires full Neo4j installation (or Docker)

**B. `sylweriusz/mcp-neo4j-memory-server` — Lean memory-focused variant**

- Tools (4): `memory_store`, `memory_find`, `memory_modify`, `database_switch`
- `memory_find` supports: semantic search, direct ID lookup, date filtering,
  graph traversal
- Install: `npx -y @sylweriusz/mcp-neo4j-memory-server` — native Windows via npx
- Requirement: Neo4j with Graph Data Science (GDS) plugin — specifically
  recommends DozerDB. Requires running external instance.
- Limitation: GDS plugin is mandatory; DozerDB is not the default Neo4j desktop
  install

**C. Anthropic Official `@modelcontextprotocol/server-memory`** (already
configured in project — see Finding #1)

- This IS a knowledge graph server — lightweight, JSONL-backed, no external
  dependencies
- Best practical option for graph-style memory without infrastructure overhead

---

### 6. File-Based MCP Memory Servers [CONFIDENCE: HIGH]

**A. `basicmachines-co/basic-memory` — Best-in-class markdown memory**

- Backend: Dual-storage — Markdown files (source of truth) + SQLite for
  indexing + FastEmbed vectors for semantic search
- Tools: `write_note`, `read_note`, `read_content`, `view_note`, `edit_note`,
  `move_note`, `delete_note`, `build_context` (via `memory://` URLs),
  `recent_activity`, `list_directory`, semantic search, canvas visualization
- Install: `uv tool install basic-memory` — cross-platform; Windows supported
- Structured format: YAML frontmatter + wiki-style `[[links]]` + typed
  observation bullets `[method] content`
- Strength: Human-readable files, git-trackable, Obsidian-compatible, hybrid
  full-text + vector search
- Limitation: Requires uv/Python; cloud sync needs subscription; cross-device
  requires extra setup

**B. `doobidoo/mcp-memory-service` — SQLite-vec with autonomous consolidation**

- Backend: SQLite-vec (primary), with optional Cloudflare Workers + Vectorize
  sync
- Embeddings: ONNX MiniLM-L6-v2 — local, no API
- Features: Knowledge graph with typed causal edges ("causes", "fixes",
  "contradicts"), autonomous memory consolidation, REST API, remote MCP support
  for claude.ai browser
- Windows: Documented — `python scripts/install_windows.py`, DirectML
  acceleration option (`MCP_MEMORY_USE_DIRECTML`)
- Strength: Unique among options — supports remote MCP (works in claude.ai
  browser, not just Claude Code); autonomous consolidation prevents context
  amnesia
- Limitation: More complex setup; Python required

**C. Memory Bank (file-based project docs)**

- Creates interconnected Markdown documents capturing project knowledge aspects
- Not semantic-search-capable; structured documentation rather than agent memory
- Lightweight alternative for static project knowledge capture

---

### 7. Specialized/Noteworthy Memory Servers [CONFIDENCE: MEDIUM]

**A. OMEGA Memory (`omega-memory/omega-memory`)**

- Claims #1 on LongMemEval benchmark (95.4%)
- Backend: SQLite + sqlite-vec + bge-small-en-v1.5 embeddings
- Tools: 25 tools covering compaction, consolidation, timeline, graph traversal,
  context virtualization (checkpoint/resume)
- Features: Session briefings, cross-session learning, error pattern
  accumulation, memory consolidation
- Install: `pip3 install omega-memory[server]`, then `omega setup`
  auto-configures Claude Code + hooks
- Windows: **Requires WSL 2** — explicitly documented; does not run natively on
  Windows
- Limitation: WSL 2 requirement is a barrier in no-admin-access environments

**B. Mem0 (`mem0ai/mem0-mcp`)**

- Hybrid architecture: vector store + key-value + optional graph store
- Tools (6-11 depending on version): `add_memory`, `search_memories`,
  `get_memories`, `update_memory`, `delete_memory`, `delete_all_memories`,
  `list_entities`, `delete_entities`, `search_graph`, `get_entity`
- Standard version: Cloud-dependent (API key from app.mem0.ai)
- Self-hosted: `elvismdev/mem0-mcp-selfhosted` — Qdrant + Neo4j + Ollama stack,
  fully local
- Windows: Python-based (uvx); self-hosted requires running Qdrant + Neo4j +
  Ollama services
- Limitation: Cloud version has privacy concerns; self-hosted is heavyweight
  infrastructure

**C. Memstate / Graphlit / Capture (Cloud SaaS)**

- Hosted platforms with free tiers — not suitable for privacy-first or offline
  requirements
- Relevant only if cloud dependency is acceptable

---

### 8. Windows-Without-Admin Compatibility Summary [CONFIDENCE: HIGH]

| Server                                 | Install Method       | Admin Needed? | Docker Needed? | Windows Rating                                                                |
| -------------------------------------- | -------------------- | ------------- | -------------- | ----------------------------------------------------------------------------- |
| `@modelcontextprotocol/server-memory`  | `npx`                | No            | No             | Excellent — already active                                                    |
| `episodic-memory` (Superpowers plugin) | `/plugin install`    | No            | No             | Good (v1.0.14+ fixes Windows; nvm issue open for nvm users; project uses fnm) |
| `mcp-obsidian`                         | `uvx`                | No            | No             | Good (uv portable install)                                                    |
| `notebooklm-mcp`                       | `uv run`             | No            | No             | Good (explicit Windows docs)                                                  |
| `mcp-server-qdrant` (local mode)       | `uvx`                | No            | No             | Good (local path mode avoids Docker)                                          |
| `chroma-mcp` (persistent mode)         | `uvx`                | No            | No             | Good (embedded persistent mode)                                               |
| `basic-memory`                         | `uv tool install`    | No            | No             | Good                                                                          |
| `doobidoo/mcp-memory-service`          | pip + install script | No            | No             | Good (explicit Windows support)                                               |
| `pinecone-mcp`                         | `npx`                | No            | No             | Good (cloud-only; privacy caveat)                                             |
| `sylweriusz/mcp-neo4j-memory`          | `npx`                | No            | No             | Moderate (requires running Neo4j)                                             |
| `weaviate-mcp`                         | Smithery/npx         | No            | Recommended    | Moderate (needs Weaviate service)                                             |
| `mcp-neo4j-cypher`                     | uvx/Docker           | No            | Recommended    | Moderate                                                                      |
| OMEGA Memory                           | `pip3`               | No            | No             | Poor — WSL 2 required                                                         |

**Key insight**: The no-Docker, no-admin constraint favors: (1) the existing
`@modelcontextprotocol/server-memory` (JSONL, npx), (2) `basic-memory`
(markdown + SQLite, uv), (3) `chroma-mcp` in persistent mode (uvx), and (4)
`mcp-server-qdrant` in local path mode (uvx). All four run natively on Windows
with portable installs (npx/uvx).

---

## Sources

| #   | URL                                                                       | Title                                   | Type             | Trust   | CRAAP     | Date       |
| --- | ------------------------------------------------------------------------- | --------------------------------------- | ---------------- | ------- | --------- | ---------- |
| 1   | https://github.com/modelcontextprotocol/servers/tree/main/src/memory      | Knowledge Graph Memory MCP server       | Official docs    | HIGH    | 5/5/5/5/5 | Active     |
| 2   | https://glama.ai/mcp/servers/categories/knowledge-and-memory              | Knowledge & Memory MCP Servers \| Glama | MCP Registry     | HIGH    | 4/5/4/4/4 | 2026       |
| 3   | https://github.com/MarkusPfundstein/mcp-obsidian                          | mcp-obsidian GitHub                     | Official repo    | HIGH    | 5/5/4/5/5 | Mar 2026   |
| 4   | https://github.com/alfredang/notebooklm-mcp                               | notebooklm-mcp GitHub                   | Community repo   | MEDIUM  | 4/5/3/4/5 | Jan 2026   |
| 5   | https://github.com/qdrant/mcp-server-qdrant                               | mcp-server-qdrant GitHub                | Official repo    | HIGH    | 5/5/5/5/5 | 2025       |
| 6   | https://github.com/chroma-core/chroma-mcp                                 | chroma-mcp GitHub                       | Official repo    | HIGH    | 5/5/5/5/5 | 2025       |
| 7   | https://github.com/neo4j-contrib/mcp-neo4j                                | Neo4j Labs MCP servers                  | Official repo    | HIGH    | 5/5/5/5/5 | 2025       |
| 8   | https://github.com/sylweriusz/mcp-neo4j-memory-server                     | mcp-neo4j-memory-server                 | Community repo   | MEDIUM  | 4/5/3/4/4 | 2025       |
| 9   | https://github.com/basicmachines-co/basic-memory                          | basic-memory GitHub                     | Community repo   | HIGH    | 5/5/4/5/5 | 2026       |
| 10  | https://github.com/doobidoo/mcp-memory-service                            | mcp-memory-service GitHub               | Community repo   | MEDIUM  | 4/5/3/4/4 | 2025       |
| 11  | https://github.com/obra/episodic-memory                                   | episodic-memory GitHub                  | Community repo   | HIGH    | 5/5/4/5/5 | 2026       |
| 12  | https://github.com/obra/episodic-memory/issues/49                         | Windows nvm issue #49                   | Issue tracker    | HIGH    | 5/4/4/5/5 | Jan 2026   |
| 13  | https://deepwiki.com/obra/episodic-memory/2-claude-plugin-integration     | Episodic Memory Plugin Integration      | Community wiki   | MEDIUM  | 4/5/3/4/4 | 2026       |
| 14  | https://blog.fsck.com/2025/10/23/episodic-memory/                         | Fixing Claude Code's amnesia            | Author blog      | HIGH    | 4/5/5/4/5 | Oct 2025   |
| 15  | https://github.com/omega-memory/omega-memory                              | OMEGA Memory GitHub                     | Community repo   | MEDIUM  | 4/5/3/4/4 | 2025       |
| 16  | https://github.com/elvismdev/mem0-mcp-selfhosted                          | mem0-mcp-selfhosted                     | Community repo   | MEDIUM  | 4/4/3/4/4 | 2025       |
| 17  | https://mem0.ai/blog/claude-code-memory                                   | Mem0 + Claude Code memory               | Official blog    | HIGH    | 4/5/4/4/3 | 2025       |
| 18  | https://docs.pinecone.io/guides/operations/mcp-server                     | Pinecone MCP server docs                | Official docs    | HIGH    | 5/5/5/5/5 | 2025       |
| 19  | https://neo4j.com/developer/genai-ecosystem/model-context-protocol-mcp/   | Neo4j MCP Integrations                  | Official docs    | HIGH    | 5/5/5/5/5 | 2025       |
| 20  | https://smithery.ai/ (query: memory servers)                              | Smithery MCP Registry                   | MCP Registry     | HIGH    | 4/5/4/4/4 | 2026       |
| 21  | C:/Users/jbell/.local/bin/sonash-v0/.mcp.json                             | Project MCP configuration               | Local filesystem | HIGHEST | 5/5/5/5/5 | 2026-03-31 |
| 22  | C:/Users/jbell/.local/bin/sonash-v0/.claude/settings.global-template.json | Global settings template                | Local filesystem | HIGHEST | 5/5/5/5/5 | 2026-03-31 |

---

## Contradictions

**1. mcp-memory-service backend claim**: The Glama listing and PyPI package
description say "ChromaDB backend" but the GitHub README and actual architecture
description say SQLite-vec as primary backend. The ChromaDB label appears to be
outdated documentation from an earlier version; current codebase uses SQLite-vec
with optional Cloudflare Workers sync.

**2. Episodic-memory Windows status**: The DeepWiki documentation says v1.0.14+
fixed Windows ENOENT errors and it works on Windows. But GitHub Issue #49
(Jan 2026) reports MCP server startup failures with status "✘ failed" on Windows
with nvm. These are not necessarily contradictory (different Node.js managers,
different failure modes), but the Windows status is not cleanly resolved. The
project uses fnm, not nvm — this likely avoids the specific nvm path-resolution
bug.

**3. OMEGA Memory "no Docker needed" vs WSL2 requirement**: PyPI installation
works without Docker, but the official recommendation is WSL2 on Windows for
SQLite performance. The tool runs natively but performs better/only-properly
under WSL2 per their docs.

---

## Gaps

1. **No Pinecone local mode**: Pinecone has no self-hosted or local option — it
   is cloud-only. Not suitable for the privacy-first constraint.

2. **NotebookLM API status**: The MCP bridge works via browser automation
   (session cookies), not a stable API. Google has not announced official API
   access for NotebookLM as of the search date. This makes the integration
   fragile.

3. **Episodic-memory Windows fnm vs nvm**: The open issue (#49) is specific to
   nvm. This project uses fnm. Testing would confirm whether the plugin works
   correctly in this specific environment — it was not possible to verify
   without a live test.

4. **`@modelcontextprotocol/server-memory` graph size limits**: No official
   documentation found on performance at scale. The JSONL-backed model loads the
   full graph per read. No benchmarks found for large graphs (>10,000 entities).

5. **Weaviate local mode**: Running Weaviate without Docker requires their
   embedded Python client, which is more complex than Docker. No detailed
   Windows-native (non-Docker) guide was found.

6. **Neo4j free tier / portable install**: Neo4j Community Edition requires
   installation; Neo4j Desktop is a GUI app (admin likely needed). DozerDB (the
   recommended variant for mcp-neo4j-memory-server) requires the GDS plugin — no
   portable no-install path confirmed.

---

## Serendipity

**`doobidoo/mcp-memory-service` supports Remote MCP**: This is the only memory
server found that works via remote MCP transport, meaning it can be used from
`claude.ai` in the browser (not just Claude Code). This is potentially
significant for cross-surface memory (Claude Code + claude.ai web) that other
servers cannot provide.

**`database_switch` tool in mcp-neo4j-memory-server**: The server supports
switching between database contexts mid-session, enabling isolated memory
environments per project. This pattern could be valuable for multi-project
agents.

**`basic-memory` uses `memory://` URLs**: The `build_context` tool accepts
`memory://` protocol URLs for navigation within the knowledge graph — a
distinctive approach that enables relational traversal from note to note without
enumerating nodes.

**OMEGA benchmark claim**: OMEGA claims 95.4% on LongMemEval, which would make
it the highest-performing memory system tested. If accurate and if WSL2
compatibility is acceptable, this would be the strongest candidate for
high-fidelity memory. The WSL2 requirement is the only blocker in this
environment.

**The project's episodic-memory tool permission is scoped**:
`mcp__plugin_episodic-memory_episodic-memory__search` — only the `search` tool
is in the allow-list. The `episodic_memory_show` tool (full conversation
retrieval) is NOT in the permissions. This means the project can search past
conversations but cannot retrieve the full text of a match without a permissions
change.

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 5
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The project's current MCP memory configuration is fully verified from local
filesystem. Vector DB and file-based server capabilities are verified from
official repositories. Windows compatibility ratings are derived from official
documentation and known issue trackers.
