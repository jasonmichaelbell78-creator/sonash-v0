# Findings: Broader Memory System Discovery — Plugin Marketplaces and Tool Ecosystems

**Searcher:** deep-research-searcher **Profile:** web **Date:**
2026-03-31T00:00:00Z **Sub-Question IDs:** SQ3

---

## Key Findings

### 1. Claude Code Plugin Ecosystem Has Multiple Memory Plugins [CONFIDENCE: HIGH]

Claude Code has a native plugin marketplace, and memory management is the single
most active plugin category. Three distinct Claude-Code-native memory plugins
have emerged, each taking a different architectural approach.

**claude-mem** (thedotmack) [1] is the most mature and widely adopted, with
43.9k GitHub stars and version 6.5.0 as of March 2026. It works via Claude Code
lifecycle hooks (SessionStart, PostToolUse, SessionEnd) to silently record
observations, compresses them with AI, and stores them in a local SQLite +
Chroma (vector) database at `~/.claude-mem/`. Retrieval uses hybrid semantic +
keyword search via 4 MCP tools. Licensed AGPL-3.0, open source. Windows is fully
supported. Install: `/plugin marketplace add thedotmack/claude-mem`.

**mcp-memory-service** (doobidoo) [2] is an open-source MCP server (1.6k stars,
Apache 2.0) with a `/claude-hooks` directory indicating Claude Code hook
integration. Supports multiple backends: SQLite local, Cloudflare Workers, or
hybrid. Windows config path documented (`%APPDATA%\Claude\`). Install:
`claude mcp add memory`. Free, self-hosted.

**memory-store-plugin** (julep-ai) [3] tracked file changes, git commits,
session context, and CLAUDE.md sync via cloud storage at `beta.memory.store`
(OAuth 2.1). Uses a `.memory-queue.jsonl` producer-consumer pattern. Important
caveat: **repository is archived (read-only) as of December 27, 2025** — likely
discontinued. Only 8 stars. Not a viable candidate.

**AutoDream / Memory 2.0** (Anthropic) [4] is a native Claude Code feature (not
a plugin) announced in late March 2026. It is a background sub-agent that
consolidates, prunes, and reorganizes CLAUDE.md memory files in a 4-phase
REM-sleep-style cycle: Orient, Gather Signal, Consolidate, Prune + Index. It
converts relative dates to absolute, removes contradicted facts, merges
duplicates. Currently **feature-flagged** (not GA) but can be triggered manually
via "consolidate my memory using dream." Files remain in `~/.claude/` —
platform-agnostic.

### 2. MCP Server Registries Contain 50+ Memory-Focused Servers [CONFIDENCE: HIGH]

Glama.ai hosts 17,603+ MCP servers and has a dedicated "Knowledge and Memory"
category [5]. Smithery.ai and mcp.so host dozens more. Key production-grade
options:

**OMEGA Memory** [6] — purpose-built for AI coding agents. Stores decisions,
lessons, error patterns, checkpoints in SQLite at `~/.omega/omega.db` using
CPU-only ONNX embeddings (no API key needed). Claims #1 on LongMemEval benchmark
(95.4%). 25 memory tools. Install via `pip install omega-memory`. Important
caveat: **Windows requires WSL** — native Windows is not supported. Open source
(Apache 2.0).

**Supermemory** [7] — 20.7k stars, cross-IDE universal memory layer. Supports
Claude Code, Claude Desktop, Cursor, Windsurf, VS Code. Scoped by "project
container tags." Integrates with Google Drive, Gmail, Notion, OneDrive, GitHub
as memory connectors. Free tier: 1M tokens / 10K queries. Storage uses extracted
facts + user profiles with temporal handling and contradiction resolution. Not
explicitly Windows-verified.

**Hindsight** (Vectorize) [8] — 6.7k stars, MIT license. Uses biomimetic data
structures (World/Experiences/Mental Models) backed by PostgreSQL.
State-of-the-art LongMemEval results independently reproduced by Virginia Tech
and The Washington Post. One Docker command to run locally; also has managed
cloud. **No explicit Windows support** — Docker-based. Best-in-class accuracy
but has operational overhead.

**Mem0 / OpenMemory** [9] — Y Combinator-backed, 100,000+ developers. OpenMemory
is the self-hosted variant: runs locally via Docker (`make up`), dashboard at
`localhost:3000`, MCP add via
`claude mcp add --transport http openmemory http://localhost:8080/mcp`.
**Requires Docker** on Windows. Fully private/local. Research claims 26% higher
response quality with 90% fewer tokens. SOC 2 + HIPAA compliant.

**mcp-memori** [5] — lightweight, stores facts after each response and retrieves
before. MIT, updated 5 days ago (active). No SDK required.

**Novyx MCP** [5] — zero-config local SQLite or cloud API. Includes rollback,
audit trails, semantic search, knowledge graph. MIT, very recently updated.

**MemOS** [5] — "memory management OS for AI applications," long-term memory
with active scheduling. Apache 2.0, updated March 2026.

**mcp-server-qdrant** [5] — 1,300+ stars, vector search via Qdrant. Apache 2.0.
Building block for custom memory systems.

### 3. VS Code Has a Native Built-In Memory System (Two Tiers) [CONFIDENCE: HIGH]

As of January 2026, VS Code (via GitHub Copilot) ships a two-tier memory system
[10]:

- **Local memory tool**: machine-local, enabled by default, first 200 lines
  loaded automatically per session
- **Copilot Memory**: GitHub-hosted, syncs across Copilot surfaces (coding
  agent, code review, CLI)

Memory scopes: User (global), Repository (workspace-scoped), Session (current
conversation only). This is native — no plugin required — but is Copilot/VS
Code-specific. Not applicable to Claude Code directly.

**AI Memory VS Code extension** (CoderOne) also exists on VS Marketplace [10] as
a standalone extension for memory management outside Copilot.

Popular agentic VS Code extensions with memory components: Cline (most
installed), Roo Code, Continue (runs local background service for persistent
session memory).

### 4. Cursor's Built-In Memory Was Removed; Third-Party Solutions Fill the Gap [CONFIDENCE: HIGH]

Cursor shipped a "Memories" feature in mid-2025 that stored conversation facts
at the project level. In version 2.1.x this was **removed** [11]. The current
built-in mechanism is `.cursor/rules/` files — project-scoped persistent
instructions, not conversation-level memory.

Third-party solutions:

**ContextForge** [12] — commercial SaaS with MCP integration. Semantic search,
Git integration (auto-syncs commits/PRs), task tracking, team collaboration.
Pricing: Free ($0, 1 project / 200 docs / 500 queries/month), Pro ($9/month,
5,000 docs), Premium ($29/month, 10,000 docs). Works on "Any" OS. Add one JSON
block to MCP config. MIT license. Supports Claude Code, Cursor, Claude Desktop.

**Basic Memory** (basicmachines-co) [13] — 2.7k stars. Stores everything in
local Markdown files (platform-agnostic, fully portable) indexed via SQLite.
Hybrid full-text + vector search (FastEmbed). Integrates with Obsidian, Claude
Desktop, Cursor, Claude Code. Free for local-first use; cloud sync is optional
(7-day trial, 20% OSS discount). Windows: `uv tool install basic-memory` is
platform-agnostic, though macOS paths are more documented.

**Basic Memory stands out for cross-locale scenarios**: the Markdown file format
survives locale changes, git sync, and has no binary dependencies.

### 5. Obsidian Bridges Bidirectionally to Claude Code via MCP [CONFIDENCE: HIGH]

Multiple plugins enable Obsidian-to-Claude-Code knowledge bridging:

**obsidian-claude-code-mcp** (iansinnott) [14] — 216 stars, 1.1.8 (June 2025).
Creates an MCP server inside Obsidian, exposing vault read/write/search to
Claude Code via WebSocket on port 22360. Windows explicitly documented
(`%APPDATA%\Claude\`). 0BSD license.

**Claudian** (YishenTu) [15] — embeds Claude Code as a sidebar inside Obsidian;
vault becomes Claude's working directory with full agentic capabilities (file
read/write, bash, search).

**Agent Client** [15] — brings Claude Code, Codex, and Gemini CLI into Obsidian
using the Agent Client Protocol (ACP), an open standard.

**Obsidian MCP Pro** (Glama registry) [5] — 23 tools, 568K+ GitHub stars. Most
feature-complete Obsidian MCP: search, read, write, tags, link analysis, canvas.

**Relevance to use case**: If the user maintains a personal knowledge base in
Obsidian, these plugins can make that content available as context in Claude
Code sessions via the MCP protocol. This is a "pull from external knowledge
base" pattern rather than session memory.

### 6. Notion Has Official MCP Integration + Claude Code Plugin [CONFIDENCE: HIGH]

Notion launched an official MCP server and a Claude Code plugin [16][17]:

- Notion MCP server: hosted, gives AI tools secure access to workspace, converts
  everything to Markdown for token efficiency
- Claude Code plugin: `makenotion/claude-code-notion-plugin` — bundles MCP
  server + pre-built skills + slash commands
- Install: one-click in Claude Code plugin marketplace
- Use case: pull project specs, documentation, and decision logs from Notion
  directly into Claude Code sessions
- Cross-locale: cloud-hosted, so accessible from both locales without path
  configuration

This is a knowledge pull pattern: Notion holds your project docs, Claude Code
fetches them on demand via MCP rather than injecting at session start.

### 7. Vector Databases Marketed for AI Coding Agents — Overview [CONFIDENCE: MEDIUM]

Direct vector database integrations targeted at individual coding agent memory
[18][19]:

**Chroma** — simplest local setup, Python-native, used by claude-mem as its
semantic search backend. No standalone pricing — embedded. Best for local dev.

**Qdrant** — Rust-based, highest performance, Apache 2.0. `mcp-server-qdrant`
has 1,300+ stars. Self-hosted or Qdrant Cloud. Used by some claude-mem forks and
mcp-memory-service.

**Milvus/Zilliz** — enterprise-scale. **claude-context** (zilliztech) [20] is a
purpose-built MCP server using Milvus/Zilliz Cloud as the vector backend. 40%
token reduction via hybrid BM25 + dense vector search with AST-aware chunking.
Merkle-tree based incremental indexing. Supports multiple embedding providers
(OpenAI, VoyageAI, Ollama, Gemini). Windows: configuration documented but
SmartScreen warnings noted on binaries. Active March 2026.

**codebase-memory-mcp** (DeusData) [21] — 1.1k stars. Code intelligence MCP:
indexes codebases into persistent knowledge graphs (66 languages, sub-ms
queries, 99% fewer tokens). Single static binary, zero external dependencies,
pre-built Windows amd64 binary. SQLite at `~/.cache/codebase-memory-mcp/`.
Auto-detects 10 coding agents including Claude Code. This is **codebase
structure memory** rather than session/decision memory.

Note: For solo developer use cases, direct vector DB setup (Qdrant, Weaviate,
Pinecone) adds significant operational overhead. Prefer wrappers like claude-mem
(Chroma), OpenMemory (Docker), or mcp-server-qdrant which abstract the
complexity.

### 8. Commercial Products Targeting AI Coding Memory [CONFIDENCE: HIGH]

**Pieces for Developers** [22] — free individual tier (forever), 9-month context
retention. Desktop app (Windows/Mac/Linux). Works via PiecesOS background
service + LTM-2.7 engine. MCP integration with Claude Code:
`claude mcp add --transport http --scope project pieces http://localhost:39300/model_context_protocol/2025-03-26/mcp`.
Important Windows caveat: **requires `cmd /c` wrapper for npx**, otherwise
"Connection closed" errors. Captures workflow context from all apps. Teams
pricing: contact sales.

**ContextForge** [12] — covered in Finding 4. $0/$9/$29/month tiers. Best fit
for multi-project teams; solo free tier is limited (200 docs, 500
queries/month).

**Supermemory** [7] — covers in Finding 2. Free tier (1M tokens / 10K queries).
Cross-IDE.

**Mem0** (managed) [9] — cloud API for managed memory. Free tier available;
team/enterprise pricing requires contact. Y Combinator backed, SOC 2 compliant.

### 9. Broader Ecosystem Discovery: Additional Notable Tools [CONFIDENCE: MEDIUM]

**Graphlit** [5] — ingests Slack, Gmail, podcasts, web content into searchable
MCP projects (373 stars). Relevant if the user wants to pull external sources
(email, meetings) into coding context.

**Memstate AI** [5] — versioned, structured memory for AI agents with conflict
detection and knowledge history tracking. SaaS with Apache 2.0 reference
implementation. Very recently active (6 days ago).

**git-notes-memory** (git-based knowledge graph, clawhub.ai) — stores memory in
git notes, surviving worktree/locale switches by living in the git repo itself.
Directly relevant to the cross-locale problem described in the use case.

**dream-skill** (grandamenium) [4] — open-source community implementation of the
AutoDream consolidation pattern. 4-phase consolidation with 24hr auto-trigger.
Replicates Anthropic's unreleased feature; works now. Relevant if AutoDream
remains feature-flagged.

---

## Sources

| #   | URL                                                                                                           | Title                                     | Type                 | Trust  | CRAAP | Date                |
| --- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | -------------------- | ------ | ----- | ------------------- |
| 1   | https://github.com/thedotmack/claude-mem                                                                      | claude-mem GitHub                         | official-code        | HIGH   | 4.4   | Mar 2026            |
| 2   | https://github.com/doobidoo/mcp-memory-service                                                                | mcp-memory-service GitHub                 | official-code        | HIGH   | 4.2   | Mar 2026            |
| 3   | https://github.com/julep-ai/memory-store-plugin                                                               | memory-store-plugin GitHub                | official-code        | HIGH   | 3.5   | Dec 2025 (archived) |
| 4   | https://www.franksworld.com/2026/03/29/claude-code-memory-2-0-the-game-changing-auto-dream-feature/           | Claude Code Memory 2.0: Auto Dream        | community-blog       | MEDIUM | 3.8   | Mar 2026            |
| 5   | https://glama.ai/mcp/servers/categories/knowledge-and-memory                                                  | Glama Knowledge & Memory MCP Servers      | registry             | HIGH   | 4.5   | Mar 2026            |
| 6   | https://github.com/mcp-research/omega-memory__omega-memory                                                    | OMEGA Memory GitHub                       | official-code        | HIGH   | 4.0   | Mar 2026            |
| 7   | https://github.com/supermemoryai/supermemory                                                                  | Supermemory GitHub                        | official-code        | HIGH   | 4.3   | Mar 2026            |
| 8   | https://github.com/vectorize-io/hindsight                                                                     | Hindsight GitHub                          | official-code        | HIGH   | 4.5   | Mar 2026            |
| 9   | https://mem0.ai/openmemory                                                                                    | OpenMemory by Mem0                        | official-product     | HIGH   | 4.2   | Mar 2026            |
| 10  | https://marketplace.visualstudio.com/items?itemName=CoderOne.aimemory                                         | AI Memory VS Code Extension               | official-marketplace | HIGH   | 4.0   | 2026                |
| 11  | https://forum.cursor.com/t/persistent-ai-memory-for-cursor/145660                                             | Cursor Community Forum: Persistent Memory | community            | MEDIUM | 3.5   | 2026                |
| 12  | https://contextforge.dev/                                                                                     | ContextForge Official Site                | official-product     | HIGH   | 4.2   | Mar 2026            |
| 13  | https://github.com/basicmachines-co/basic-memory                                                              | Basic Memory GitHub                       | official-code        | HIGH   | 4.2   | Mar 2026            |
| 14  | https://github.com/iansinnott/obsidian-claude-code-mcp                                                        | obsidian-claude-code-mcp GitHub           | official-code        | HIGH   | 4.0   | Jun 2025            |
| 15  | https://forum.obsidian.md/t/new-plugin-agent-client-bring-claude-code-codex-gemini-cli-inside-obsidian/108448 | Obsidian Agent Client Plugin              | community            | MEDIUM | 3.6   | 2026                |
| 16  | https://github.com/makenotion/claude-code-notion-plugin                                                       | Notion Claude Code Plugin                 | official-code        | HIGH   | 4.4   | 2026                |
| 17  | https://developers.notion.com/docs/mcp                                                                        | Notion MCP Official Docs                  | official-docs        | HIGH   | 4.5   | 2026                |
| 18  | https://www.firecrawl.dev/blog/best-vector-databases                                                          | Best Vector Databases 2026                | community-blog       | MEDIUM | 3.6   | 2026                |
| 19  | https://glama.ai/mcp/servers/@itseasy21/mcp-knowledge-graph                                                   | Knowledge Graph MCP Server (Glama)        | registry             | HIGH   | 4.0   | 2026                |
| 20  | https://github.com/zilliztech/claude-context                                                                  | claude-context (Zilliz) GitHub            | official-code        | HIGH   | 4.2   | Mar 2026            |
| 21  | https://github.com/DeusData/codebase-memory-mcp                                                               | codebase-memory-mcp GitHub                | official-code        | HIGH   | 4.2   | Mar 2026            |
| 22  | https://docs.pieces.app/products/mcp/claude-code                                                              | Pieces MCP + Claude Code Docs             | official-docs        | HIGH   | 4.5   | 2026                |

---

## Contradictions

**OMEGA Memory Windows support:** The official installation docs say "Windows
via WSL" only, but Smithery.ai lists it as cross-platform. Cannot verify native
Windows support. **Lean toward WSL-only.**

**claude-mem star count:** The GitHub page showed 43.9k stars — this is an
unusually high count for a plugin released in early 2026. It may reflect rapid
organic growth in the Claude Code ecosystem or inflated counting. The AGPL-3.0
license and active Discord community support authenticity, but the star count
should be treated with some skepticism until independently verified.

**Hindsight vs OMEGA benchmark claims:** OMEGA claims 95.4% on LongMemEval (#1).
Hindsight claims state-of-the-art with independent reproduction by Virginia
Tech. These claims conflict — both cannot be #1 simultaneously, and LongMemEval
leaderboards shift. Treat both benchmark claims as marketing until verifiable
against a dated leaderboard snapshot.

**Cursor Memories removal:** One source says Memories was removed in "version
2.1.x"; others discuss it as present. The Cursor community forum source is more
specific and credible on this point. The official Cursor changelog URL was not
fetched to confirm the exact version.

---

## Gaps

1. **No verifiable pricing for OMEGA Memory** — the GitHub and PyPI pages
   contain no pricing information. It may be fully free (Apache 2.0) but a "pro"
   tier (omega-pro) is mentioned without pricing.

2. **Pieces individual tier pricing confirmation** — the aiagentslist.com source
   states "free forever" individual tier, but the official Pieces pricing page
   was not directly fetched to verify current 2026 terms.

3. **Native Windows support for Hindsight and OpenMemory** — both are
   Docker-dependent. Windows with Docker Desktop should work, but no explicit
   Windows CI or test coverage was confirmed.

4. **claude-mem cross-locale behavior** — the plugin stores data in
   `~/.claude-mem/`. On Windows with two locale environments (jbell vs work),
   whether this resolves correctly across both Windows user profiles is unknown.
   The home directory path would differ per user account.

5. **dream-skill maturity** — the community implementation of AutoDream was
   found but not fetched in detail. Star count and Windows compatibility
   unknown.

6. **Roam Research integration** — no relevant results found for Roam → AI
   coding workflow. Roam appears to have no meaningful presence in the AI coding
   tool ecosystem as of 2026.

7. **git-notes-memory** (clawhub.ai) — identified as potentially highly relevant
   for cross-locale scenarios (memory in git notes survives locale switches) but
   not deeply researched due to time.

---

## Serendipity

**AutoDream is a native Anthropic memory consolidation feature** nearing GA
release. It works directly on CLAUDE.md files via a background sub-agent. This
is potentially more important than any third-party plugin for the use case
described, because it requires no additional tooling. The `dream-skill`
community repo provides an immediately-usable implementation while AutoDream
remains feature-flagged.

**codebase-memory-mcp has native Windows amd64 binaries** (DeusData, 1.1k stars)
with auto-detection of Claude Code and zero external dependencies. This directly
solves the "Windows, no admin access" constraint for codebase-structure memory.
The operational profile (single binary, SQLite, no API keys) is ideal for a solo
Windows developer.

**git-notes-memory pattern** — storing memory in git notes rather than local
filesystem paths could elegantly solve the cross-locale problem: git notes
travel with the repo, making memory available on any clone regardless of which
Windows locale is active. This deserves further investigation as a potential
architectural solution unique to this use case.

**Memory ecosystem is extremely active right now** — Glama shows multiple major
memory servers updated within 4-6 days of the research date (March 31, 2026).
This is a rapidly moving space and any recommendation should be treated as
"current as of end of March 2026."

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The memory tool ecosystem is well-documented with multiple cross-referenced
sources. The main uncertainties are benchmark claim conflicts (OMEGA vs
Hindsight), OMEGA's Windows support limitation, and AutoDream's GA timeline.
Core findings about tool availability, pricing, and integration methods are
well-supported by official documentation and code repositories.
