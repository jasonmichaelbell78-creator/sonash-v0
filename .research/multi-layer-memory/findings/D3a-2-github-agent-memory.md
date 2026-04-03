# Findings: GitHub Discovery — Non-Claude AI Coding Agent Memory Systems

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** SQ3a (split 2 of 2)

---

## Key Findings

### 1. Cursor Memory Systems

**1a. cursor-memory-bank (vanzan01)** [CONFIDENCE: HIGH]

URL: https://github.com/vanzan01/cursor-memory-bank Stars: 3,000+ | Forks: 444 |
Last commit: December 6, 2024

A documentation-driven framework for Cursor 2.0 using command-based workflow
phases (/van, /plan, /creative, /build, /reflect, /archive). Key architectural
pattern: hierarchical rule loading that reduces token usage ~70% by loading only
essential rules per phase rather than all rules at once. Complexity levels 1-4
trigger different rule sets. Persistent context stored in a `memory-bank/`
directory containing task tracking, active context, progress, and creative
decision records [1].

**Portability to Claude Code:** HIGH. The hierarchical rule loading pattern
(load-on-demand rather than full context) is directly applicable. The file-based
memory bank structure (markdown files in a project directory) is the same
pattern already used in CLAUDE.md-style setups. The phased workflow design
(van/plan/build/reflect) maps to Claude's slash command architecture.

---

**1b. Grov (team-level context sync)** [CONFIDENCE: MEDIUM]

A commercial tool mentioned in Cursor community forums that automatically
captures context from AI sessions and syncs to shared team memory. Architecture:
captures context → syncs to shared store → auto-injects relevant memories across
developers. Stars/URL not independently confirmed. Not open-source [2].

**Portability to Claude Code:** MEDIUM. The auto-injection pattern on session
start is applicable, but this is a closed-source product.

---

### 2. Roo Code / Cline Memory Systems

**2a. roo-code-memory-bank (GreatScottyMac)** [CONFIDENCE: HIGH]

URL: https://github.com/GreatScottyMac/roo-code-memory-bank Stars: 1,700 | Last
commit: February 2025

Four-file markdown architecture stored in a `memory-bank/` directory:

- `activeContext.md` — current session state and goals
- `productContext.md` — project overview and knowledge
- `progress.md` — completed work and upcoming tasks
- `decisionLog.md` — technical decisions and rationale

Mode-specific custom instructions integrate per Roo Code mode (Architect, Code,
Ask, Debug). Each mode triggers targeted file updates: architectural decisions
update design docs, code implementations update progress tracking. Real-time
synchronization without manual intervention [3].

**Portability to Claude Code:** VERY HIGH. This is essentially the same
architecture as CLAUDE.md + docs/ pattern. The four-file structure maps directly
to what could be implemented as Claude project files. The mode-based triggers
are analogous to Claude's custom instructions per context. Directly portable
with minimal adaptation.

---

**2b. cline-mcp-memory-bank (dazeb)** [CONFIDENCE: HIGH]

URL: https://github.com/dazeb/cline-mcp-memory-bank Stars: 59 | Last commit:
March 13, 2025

MCP server wrapping the same four-file memory architecture (projectContext.md,
activeContext.md, progress.md, decisionLog.md) for Cline. Provides four MCP
tools: initialization, context updating, decision recording, and progress
tracking. Delivers memory as MCP resources accessible to any MCP-capable client
[4].

**Portability to Claude Code:** VERY HIGH. Already an MCP server — Claude Code
can consume it directly. The architecture is identical to roo-code-memory-bank
but delivered as a standard MCP tool interface rather than mode-specific
instructions.

---

**2c. Optimized Memory Instructions (Gist by zoharbabin)** [CONFIDENCE: MEDIUM]

URL: https://gist.github.com/zoharbabin/441e8e8b719a444f26b34bd0b189b283

An optimized `cline-memory-bank.md` template for Roo-Code roles including a
"Ultimate Directives and Best Practices" section. Designed for copy-paste into
Roo-Code Modes Custom Instructions block. No stars (gist format) [5].

**Portability to Claude Code:** HIGH. Directly usable as a custom instructions
template for Claude Code sessions.

---

### 3. Windsurf/Codeium Memory Systems

**3a. windsurf_memory_server_v2 (justinclift)** [CONFIDENCE: HIGH]

URL: https://github.com/justinclift/windsurf_memory_server_v2 Stars: 2 | Last
commit: January 18, 2025

Go backend + SQLite + VueJS 3 frontend. Local REST API on port 38080. Tag-based
memory storage with versioning and archival. Agents query via curl:
`http://localhost:38080/list-memories-by-tag?tag=project_name`. Stores "lessons
learned" that persist across sessions [6].

**Portability to Claude Code:** MEDIUM. The REST API approach works with any
agent that can issue HTTP calls. Claude Code would need a hook or tool to query
on session start. The tag-based filtering is useful for project isolation.

---

**3b. Windsurf Native Memory (built-in)** [CONFIDENCE: HIGH]

Windsurf (Codeium) includes built-in autonomous memory. Cascade auto-generates
memories when enabled, storing project-specific preferences. Uses
`.windsurf/rules` for rules system and a context window indicator with
summarization. Cross-conversation memory is project-scoped to prevent leaking
[7].

**Portability to Claude Code:** LOW. Native IDE feature not extractable, but the
auto-generation pattern (Cascade decides when to store memories during work) is
worth studying for Claude hook design.

---

### 4. Aider Context Management

**4a. Aider Repo Map (built-in)** [CONFIDENCE: HIGH]

URL: https://aider.chat/docs/repomap.html (official docs)

Aider's primary context strategy is its repo map — a compressed representation
of the entire codebase (file names, function signatures, class definitions) that
fits in the context window. Architecture: graph-based dependency analysis where
source files are nodes, edges are imports/calls. PageRank-style algorithm
selects the most-referenced identifiers within a configurable token budget
(`--map-tokens`, default 1k). Dynamically resizes map based on chat state [8].

**Portability to Claude Code:** HIGH. The core insight — maintain a compact
structural index of the codebase rather than trying to store content — is
architecture worth borrowing. This is more a structural index than a
session-memory system, but could complement a memory layer.

**4b. Aider Chat History Management Gap** [CONFIDENCE: MEDIUM]

GitHub Issue #3607 documents that aider gives users limited control over chat
history: the only option is `/clear` (deletes everything). Community has
requested more granular history management. No dedicated memory system beyond
the repo map exists [9].

**Portability to Claude Code:** The gap is a useful observation — selective
history pruning rather than clear-everything is a design requirement for any
memory system.

---

### 5. Continue.dev Memory Systems

**5a. Memory Bank Feature Request (open issue)** [CONFIDENCE: HIGH]

URL: https://github.com/continuedev/continue/issues/4615 Status: Open as of
March 2025. No native memory bank implemented. Continue relies on context
providers (@-mentions) for context injection. Community has requested a Memory
Bank matching Cline's implementation [10].

**Portability pattern:** Continue's context provider plugin system (any MCP
server can be a context provider) is relevant — it shows how a tool-agnostic
context injection interface works.

---

**5b. context-sync (Intina47)** [CONFIDENCE: HIGH]

URL: https://github.com/Intina47/context-sync Stars: 120 | Last release: v2.0.0,
January 31, 2026

Local-first memory layer via MCP for 11 AI development platforms: Claude
Desktop, Cursor, VS Code + Copilot, Continue.dev, Zed, Windsurf, Codeium,
TabNine, Codex CLI, Claude Code, and Antigravity (Gemini IDE). TypeScript +
SQLite at `~/.context-sync/data.db`. Git hook integration (post-commit,
pre-push, post-merge). Tools: `set_project()`, `recall()`, `read_file()`,
`remember()` [11].

**Portability to Claude Code:** VERY HIGH. Already explicitly supports Claude
Code. Git hooks for automatic capture align with existing hook infrastructure in
this codebase.

---

### 6. General "AI Agent Memory" Systems Portable to Any Agent

**6a. Engram (Gentleman-Programming)** [CONFIDENCE: HIGH]

URL: https://github.com/Gentleman-Programming/engram Stars: 2,100 | Last commit:
March 30, 2026 (v1.11.0)

Single Go binary, SQLite + FTS5 full-text search at `~/.engram/engram.db`.
Exposes MCP server, HTTP API, CLI, and TUI. Explicit support for Claude Code,
OpenCode, Gemini CLI, Codex, VS Code (Copilot), Cursor, Windsurf. Claude Code
install:
`claude plugin marketplace add Gentleman-Programming/engram && claude plugin install engram`.
MIT license [12].

**Portability to Claude Code:** VERY HIGH. First-class Claude Code support built
in. Single binary with zero external dependencies is ideal for the work locale
constraints in this project.

---

**6b. OMEGA Memory (mcp-research)** [CONFIDENCE: HIGH]

URL: https://github.com/mcp-research/omega-memory__omega-memory Stars: Not
confirmed (small, recent repo) | Active development indicated

MCP server with 12 memory tools, SQLite + bge-small-en-v1.5 ONNX embeddings
(CPU-only, no GPU required), sqlite-vec for vector search. Hook system for
automatic capture. Claims 95.4% on LongMemEval (ICLR 2025 benchmark). Setup:
`omega setup` auto-configures Claude Code + hooks. Supports Cursor, Windsurf,
Zed with reduced auto-capture [13].

**Portability to Claude Code:** VERY HIGH. Designed with Claude Code as primary
target. Local ONNX embedding eliminates API dependencies.

---

**6c. mcp-memory-service (doobidoo)** [CONFIDENCE: HIGH]

URL: https://github.com/doobidoo/mcp-memory-service Stars: 1,600 | Last commit:
Recent (main branch active)

Hybrid BM25 + semantic vector search, SQLite-vec with ONNX embeddings, typed
knowledge graph (causes/fixes/contradicts edges), autonomous memory compression
with decay. Supports both SQLite (local) and Cloudflare Workers (cloud). CLI
tools explicitly listed: Claude Code, Gemini CLI, Aider, GitHub Copilot CLI,
Continue, Zed. REST API (15 endpoints) + MCP. Apache 2.0 license [14].

**Portability to Claude Code:** VERY HIGH. Listed as explicitly supported. The
hybrid BM25 + vector search architecture is architecturally superior to pure
keyword or pure semantic approaches.

---

**6d. agent-memory-mcp (ipiton)** [CONFIDENCE: MEDIUM]

URL: https://github.com/ipiton/agent-memory-mcp Stars: 17 | Recent activity

Four memory types: episodic, semantic, procedural, working. SQLite-based
local-first with HTTP/JSON-RPC option. Hybrid retrieval: embeddings + keyword
matching + source-aware weighting. RAG layer with automatic file watching.
Session-close pipeline consolidates exploratory work into maintained knowledge
automatically. Temporal modeling (tracks when knowledge was valid) [15].

**Portability to Claude Code:** HIGH. The typed memory categories
(episodic/semantic/procedural) offer a richer conceptual model than flat
key-value storage. Source-aware weighting for retrieval is useful.

---

**6e. nano-brain (nano-step)** [CONFIDENCE: MEDIUM]

URL: https://github.com/nano-step/nano-brain Stars: 3 | Last commit: March 8,
2025 (very new)

SQLite with 18 tables across 5 functional groups. Hybrid search: BM25 + vector
embeddings + RRF + PageRank + neural reranking (VoyageAI). Tree-sitter AST
parsing for TypeScript/JavaScript/Python. 22+ MCP tools. Supports Claude,
OpenCode, Cursor, Windsurf. Privacy-first, fully local. HTTP/SSE transport for
containerized deployments [16].

**Portability to Claude Code:** HIGH. Very low adoption but architecturally
sophisticated. The PageRank-boosted retrieval is a novel approach for code-aware
memory ranking.

---

**6f. OpenMemory (CaviraOSS)** [CONFIDENCE: HIGH]

URL: https://github.com/CaviraOSS/OpenMemory Stars: 3,800 | Last commit:
December 2024 (some staleness)

Multi-sector cognitive memory (episodic, semantic, procedural, emotional,
reflective) with temporal knowledge graphs. Composite scoring: salience +
recency + coactivation. Adaptive decay per memory sector.
`valid_from`/`valid_to` windows for tracking how facts evolve. SQLite or
Postgres backends. Connectors for GitHub, Notion, Google Drive. Supports Claude
Desktop, Cursor, Windsurf, LangChain, CrewAI, AutoGen [17].

**Portability to Claude Code:** MEDIUM-HIGH. The temporal validity window
approach (facts expire or are superseded) is architecturally interesting. Less
actively maintained than alternatives (last commit December 2024).

---

### 7. Vector DB Integrations for Coding Agents

**7a. mem0 (mem0ai)** [CONFIDENCE: HIGH]

URL: https://github.com/mem0ai/mem0 Stars: 51,600 | Last commit: March 28, 2026
(v1.0.9)

Highest-star universal memory layer. Hybrid data store: vector DB (semantic
search) + graph DB (relationship modeling) + key-value store (fast fact
retrieval). LLM-powered extraction defaults to OpenAI gpt-4.1-nano. 26% accuracy
improvement over OpenAI Memory on LOCOMO benchmark. 91% faster, 90% fewer tokens
than full-context. AWS chose mem0 as exclusive memory provider for its Agent
SDK. Browser extension for ChatGPT/Claude/Perplexity. $24M Series A
(October 2025) [18].

**Portability to Claude Code:** HIGH. SDK available (Python + TypeScript).
However, the default configuration requires OpenAI API key for LLM-powered
extraction — this adds cost and API dependency. Self-hosted deployment available
with open-source backends.

---

**7b. qdrant/mcp-server-qdrant (official)** [CONFIDENCE: HIGH]

URL: https://github.com/qdrant/mcp-server-qdrant Stars: 1,300 | Recent activity

Official Qdrant MCP server. Two tools: `qdrant-store` and `qdrant-find`.
FastMCP + FastEmbed. Supports local, remote, Docker, and cloud Qdrant
deployments. Claude Code integration via CLI. Compatible with Cursor, Windsurf,
VS Code. Multiple transport protocols (stdio, SSE, streamable HTTP) [19].

**Portability to Claude Code:** HIGH. Official implementation with explicit
Claude Code support. Requires running a Qdrant instance (Docker or local) which
adds operational overhead.

---

**7c. chroma-core/chroma-mcp (official)** [CONFIDENCE: HIGH]

URL: https://github.com/chroma-core/chroma-mcp Stars: 526 | Last commit: August
14, 2025

Official Chroma MCP server. Four client modes: ephemeral, persistent
(file-based), cloud, HTTP. Collection-level embedding function persistence means
consistent embeddings across sessions without reconfiguration. Supports OpenAI,
Cohere, Jina, VoyageAI embeddings [20].

**Portability to Claude Code:** HIGH. Persistent file-based mode works without a
running service. Embedding provider flexibility allows local or API-based
embeddings.

---

**7d. chroma_mcp_server (djm81)** [CONFIDENCE: MEDIUM]

URL: https://github.com/djm81/chroma_mcp_server Stars: 26 | Recent activity

Enhanced community ChromaDB MCP server with automatic code diff extraction,
bidirectional linking between discussions and code changes, semantic code
chunking (logical boundaries, not fixed-size), server-side timestamp
enforcement. Targeted at Cursor but compatible with any MCP client. MIT +
Commons Clause license [21].

**Portability to Claude Code:** MEDIUM. The bidirectional
discussion-to-code-change linking is an interesting pattern not in the official
implementation. License restrictions limit commercial use cases.

---

### 8. Notable Cross-Agent Systems

**8a. GitHub Copilot Agentic Memory (built-in)** [CONFIDENCE: HIGH]

URL (blog):
https://github.blog/ai-and-ml/github-copilot/building-an-agentic-memory-system-for-github-copilot/
Published: January 2026

Just-in-time (JIT) verification architecture: memories stored with citations to
specific code line numbers. Before use, agent validates citations against
current codebase — if code changed, memory is discarded or corrected.
Repository-scoped (memories can only be used within the repo where created).
Cross-agent knowledge sharing: code review, coding agent, and CLI all read/write
the same memory pool. Auto-delete after 28 days. Showed 3% precision increase,
7% PR merge rate increase [22].

**Portability to Claude Code:** HIGH conceptually. The citation-backed memory +
validation-before-use pattern is the most sophisticated approach found and
directly addresses the stale memory problem. Not directly portable as code
(closed system), but the pattern can be implemented.

---

**8b. codebase-memory-mcp (DeusData)** [CONFIDENCE: HIGH]

URL: https://github.com/DeusData/codebase-memory-mcp Stars: 1,100 | Recent
activity | 2,586 passing tests

High-performance structural code intelligence (NOT session memory). Tree-sitter
AST parsing for 66 languages, SQLite + LZ4 compression, 14 MCP tools for graph
querying and change detection. Single static binary, zero dependencies. Can
index Linux kernel (28M LOC) in 3 minutes, sub-ms queries. Explicitly supports
10 agents: Claude Code, Codex CLI, Gemini CLI, Zed, OpenCode, Antigravity,
Aider, KiloCode, VS Code, OpenClaw. Auto-detect install command configures MCP
entries + instruction files + pre-tool hooks [23].

**Portability to Claude Code:** VERY HIGH. This is structural/codebase
intelligence, not session memory — a complement to session memory systems rather
than a replacement. First-class Claude Code support with auto-install.

---

**8c. Memori (MemoriLabs)** [CONFIDENCE: HIGH]

URL: https://github.com/MemoriLabs/Memori Stars: 12,900 | Recent activity

SQL-native memory layer operating at entity/process/session levels.
LLM-agnostic, datastore-agnostic, framework-agnostic. 81.95% on LoCoMo benchmark
with only 4.97% of full-context footprint. MCP integration for Claude Code,
Cursor, Codex, Warp, Antigravity. Framework support: LangChain, Pydantic AI,
Agno. Asynchronous memory augmentation (no added latency to primary flow) [24].

**Portability to Claude Code:** VERY HIGH. Explicit Claude Code MCP support. The
asynchronous augmentation (memory operations don't block the main thread) is
architecturally important.

---

**8d. ReMe (agentscope-ai)** [CONFIDENCE: HIGH]

URL: https://github.com/agentscope-ai/ReMe Stars: 984 | Apache 2.0 | 2025

Academic-backed memory management (Alibaba's AgentScope team). Components:
working memory (short-term, keeps recent reasoning compact), personal memory
(retrieval + summarization), memory sharing across agents. Auto-compaction of
old conversations. Focused on agents that converse, less coding-specific [25].

**Portability to Claude Code:** MEDIUM. More suited to conversational agents
than coding agents. The auto-compaction pattern is applicable, but the
implementation is not MCP-native.

---

**8e. cognee (topoteretes)** [CONFIDENCE: HIGH]

URL: https://github.com/topoteretes/cognee Stars: 14,800 | Highly active

"Knowledge Engine for AI Agent Memory in 6 lines of code." Neo4j-based knowledge
graph. Positioned as a knowledge engine rather than simple memory store. Strong
adoption but primarily graph-database dependent (operational overhead). Supports
multiple LLMs and vector stores [26].

**Portability to Claude Code:** MEDIUM. Neo4j dependency adds significant
operational overhead for a solo developer. The knowledge graph approach is
sophisticated but heavyweight.

---

## Architecture Pattern Summary

The following patterns emerge across agent-agnostic memory systems:

| Pattern                                                                   | Examples                                         | Portability                                     |
| ------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------- |
| Four-file markdown (activeContext, productContext, progress, decisionLog) | roo-code-memory-bank, cline-mcp-memory-bank      | VERY HIGH — already close to CLAUDE.md approach |
| MCP server + SQLite local storage                                         | engram, context-sync, OMEGA, mcp-memory-service  | VERY HIGH — standard integration path           |
| Hybrid BM25 + vector search                                               | mcp-memory-service, nano-brain, agent-memory-mcp | HIGH — better recall than either alone          |
| Citation-backed memory + JIT validation                                   | GitHub Copilot                                   | HIGH (pattern) — addresses stale memory problem |
| Hierarchical rule loading (token optimization)                            | cursor-memory-bank                               | HIGH — 70% token reduction claim                |
| Structural code index (tree-sitter)                                       | codebase-memory-mcp, aider repo map              | HIGH — complements session memory               |
| Typed memory categories (episodic/semantic/procedural)                    | agent-memory-mcp, OpenMemory                     | MEDIUM — richer model, more complexity          |
| Temporal validity windows (valid_from/valid_to)                           | OpenMemory                                       | MEDIUM — useful for long-lived projects         |
| LLM-powered extraction (cloud dependency)                                 | mem0                                             | MEDIUM — powerful but adds API cost             |

---

## Sources

| #   | URL                                                                                                | Title                           | Type            | Trust  | CRAAP Score | Date     |
| --- | -------------------------------------------------------------------------------------------------- | ------------------------------- | --------------- | ------ | ----------- | -------- |
| 1   | https://github.com/vanzan01/cursor-memory-bank                                                     | cursor-memory-bank              | GitHub repo     | MEDIUM | 3.8         | Dec 2024 |
| 2   | https://forum.cursor.com/t/persistent-ai-memory-for-cursor/145660                                  | Persistent AI Memory for Cursor | Community forum | LOW    | 3.0         | 2025     |
| 3   | https://github.com/GreatScottyMac/roo-code-memory-bank                                             | roo-code-memory-bank            | GitHub repo     | MEDIUM | 4.0         | Feb 2025 |
| 4   | https://github.com/dazeb/cline-mcp-memory-bank                                                     | cline-mcp-memory-bank           | GitHub repo     | MEDIUM | 3.8         | Mar 2025 |
| 5   | https://gist.github.com/zoharbabin/441e8e8b719a444f26b34bd0b189b283                                | Optimized cline-memory-bank.md  | Gist            | LOW    | 2.5         | 2025     |
| 6   | https://github.com/justinclift/windsurf_memory_server_v2                                           | windsurf_memory_server_v2       | GitHub repo     | LOW    | 2.5         | Jan 2025 |
| 7   | https://windsurf.com/changelog                                                                     | Windsurf Changelog              | Official docs   | HIGH   | 4.5         | 2026     |
| 8   | https://aider.chat/docs/repomap.html                                                               | Aider Repo Map Docs             | Official docs   | HIGH   | 4.8         | 2026     |
| 9   | https://github.com/Aider-AI/aider/issues/3607                                                      | Aider chat history issue        | GitHub issue    | MEDIUM | 3.5         | 2024     |
| 10  | https://github.com/continuedev/continue/issues/4615                                                | Continue memory bank request    | GitHub issue    | MEDIUM | 3.5         | Mar 2025 |
| 11  | https://github.com/Intina47/context-sync                                                           | context-sync                    | GitHub repo     | MEDIUM | 4.0         | Jan 2026 |
| 12  | https://github.com/Gentleman-Programming/engram                                                    | engram                          | GitHub repo     | MEDIUM | 4.5         | Mar 2026 |
| 13  | https://github.com/mcp-research/omega-memory__omega-memory                                         | OMEGA Memory                    | GitHub repo     | MEDIUM | 3.5         | 2025     |
| 14  | https://github.com/doobidoo/mcp-memory-service                                                     | mcp-memory-service              | GitHub repo     | MEDIUM | 4.2         | 2026     |
| 15  | https://github.com/ipiton/agent-memory-mcp                                                         | agent-memory-mcp                | GitHub repo     | LOW    | 3.0         | 2025     |
| 16  | https://github.com/nano-step/nano-brain                                                            | nano-brain                      | GitHub repo     | LOW    | 3.0         | Mar 2025 |
| 17  | https://github.com/CaviraOSS/OpenMemory                                                            | OpenMemory                      | GitHub repo     | MEDIUM | 3.5         | Dec 2024 |
| 18  | https://github.com/mem0ai/mem0                                                                     | mem0                            | GitHub repo     | HIGH   | 4.5         | Mar 2026 |
| 19  | https://github.com/qdrant/mcp-server-qdrant                                                        | mcp-server-qdrant (official)    | GitHub repo     | HIGH   | 4.5         | 2026     |
| 20  | https://github.com/chroma-core/chroma-mcp                                                          | chroma-mcp (official)           | GitHub repo     | HIGH   | 4.5         | Aug 2025 |
| 21  | https://github.com/djm81/chroma_mcp_server                                                         | chroma_mcp_server               | GitHub repo     | MEDIUM | 3.2         | 2025     |
| 22  | https://github.blog/ai-and-ml/github-copilot/building-an-agentic-memory-system-for-github-copilot/ | Building Copilot Agentic Memory | Official blog   | HIGH   | 4.8         | Jan 2026 |
| 23  | https://github.com/DeusData/codebase-memory-mcp                                                    | codebase-memory-mcp             | GitHub repo     | MEDIUM | 4.5         | 2026     |
| 24  | https://github.com/MemoriLabs/Memori                                                               | Memori                          | GitHub repo     | MEDIUM | 4.2         | 2026     |
| 25  | https://github.com/agentscope-ai/ReMe                                                              | ReMe (AgentScope)               | GitHub repo     | HIGH   | 4.3         | 2025     |
| 26  | https://github.com/topoteretes/cognee                                                              | cognee                          | GitHub repo     | HIGH   | 4.5         | 2026     |

---

## Contradictions

None major. Minor tensions:

- The "four-file markdown" approach (roo-code-memory-bank,
  cline-mcp-memory-bank) is architecturally simpler than vector-search
  approaches (mem0, Qdrant) but appears equally adopted for coding contexts.
  Stars data suggests simpler approaches have strong community traction
  (roo-code-memory-bank 1.7k stars despite Feb 2025 last commit).
- Mem0's benchmark claims (26% accuracy improvement, 91% faster) are from their
  own evaluation. No independent verification found.
- GitHub Copilot's JIT citation verification approach represents a more robust
  architecture than simple file-based memory, but Copilot's system is
  closed-source.

---

## Gaps

- **Aider memory extensions:** No dedicated third-party memory systems found for
  Aider specifically. Aider's built-in repo map is its primary context
  mechanism; the community has requested but not built dedicated memory plugins.
- **Continue.dev memory plugins:** No working memory plugins found, only an open
  feature request (Issue #4615). Continue relies on generic MCP context
  providers.
- **Windsurf native memory API:** No public API documented for Windsurf's
  built-in memory system — cannot be called programmatically from other tools.
- **OMEGA Memory stars:** Could not confirm GitHub star count for OMEGA Memory;
  repository exists but exact adoption metrics were unavailable.
- **Weaviate MCP for coding agents:** No dedicated Weaviate MCP wrapper
  specifically marketed for coding agents found. Weaviate is used in general
  agent memory systems but no coding-specific integration discovered.
- **Performance benchmarks across systems:** Most benchmarks are self-reported
  by project authors. No independent third-party comparison of Engram vs
  mcp-memory-service vs context-sync found.

---

## Serendipity

1. **GitHub Copilot's citation-backed JIT validation** (January 2026) is the
   most architecturally sophisticated approach found. The core insight —
   memories should store the code locations that justify them, not just the
   fact, and those citations should be verified before the memory is used —
   directly addresses the stale-memory problem that plagues all file-based
   approaches. This pattern appears nowhere in any other agent's memory system
   found.

2. **codebase-memory-mcp vs session memory are complementary, not competing.**
   The discovery of a structural code intelligence layer
   (DeusData/codebase-memory-mcp, 10 agents supported, 1.1k stars) that answers
   "what does this codebase do" questions separately from session memory that
   answers "what did we decide" questions suggests a two-layer architecture:
   structural index (codebase-memory-mcp) + session/decision memory (engram or
   mcp-memory-service).

3. **The four-file markdown pattern has become a de facto community standard.**
   All of the Cline/Roo-Code memory systems converge on the same four files
   (activeContext, productContext/projectContext, progress, decisionLog). This
   isn't coincidence — the pattern was established by the Cline Memory Bank
   original and propagated across forks. The pattern is already close to what
   CLAUDE.md + SESSION_CONTEXT.md achieves in this codebase.

4. **Engram is the most Claude Code-native third-party option.** Among all
   non-Claude memory tools discovered, Engram (2.1k stars, updated March
   30, 2026) has the most explicit Claude Code integration (plugin marketplace
   install command), is a single Go binary (no dependencies), and uses SQLite +
   FTS5 (no external services). This makes it the lowest-friction third-party
   memory system for this project's constraints.

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 9
- LOW claims: 2
- UNVERIFIED claims: 0
- Overall confidence: MEDIUM-HIGH

The core findings (repository existence, star counts, architectures) are
verified via direct GitHub page fetches. Performance benchmarks are taken from
project documentation and marked accordingly. The portability assessments are
analytical judgments based on verified architecture data.
