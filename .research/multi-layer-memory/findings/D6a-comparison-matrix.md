# Findings: Comparison Matrix — All Discovered Memory Systems

**Searcher:** deep-research-synthesizer **Profile:** synthesis **Date:**
2026-03-31 **Sub-Question IDs:** SQ6 (agent 1 of 2) **Sources:** All 14 prior
findings files (D1 through D5b)

---

## How to Read This Document

**Solo dev suitability rating (1-5):** Evaluated against this specific context —
solo director-level user, Windows 11 (two locales: home/work), no admin access
at work locale, portable binary installs preferred, cross-locale sync needed,
Claude Code primary tool, 250+ sessions of established workflow.

**Confidence levels:** Drawn from the underlying findings files. Where source
files disagree or have gaps, this is noted.

**Token overhead categories:**

- LOW: <1,000 tokens per session from this system
- MEDIUM: 1,000–5,000 tokens per session
- HIGH: >5,000 tokens per session

---

## Part 1: Primary Comparison Matrix

### Table 1A: Storage and Memory Type Dimensions

| System                                     | Storage Backend                                                                                                  | Memory Types Supported                                                                              | Cross-Session Persistence                   | Notes                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Claude Code Auto Memory**                | Markdown files (`~/.claude/projects/*/memory/`)                                                                  | Semantic (facts), Procedural (patterns), limited Episodic                                           | Yes — files persist on disk                 | Machine-local only; first 200 lines / 25KB loaded per session                       |
| **Claude Code CLAUDE.md**                  | Markdown files (project root, git-tracked)                                                                       | Semantic (rules/facts), Procedural (workflows)                                                      | Yes — git-tracked                           | Loaded every session in full; 4-tier hierarchy                                      |
| **Claude Code MCP Memory (mcp\_\_memory)** | JSONL file (`memory.jsonl`, path configurable via `MEMORY_FILE_PATH`)                                            | Semantic (entities/relations), Knowledge graph                                                      | Yes — file persists                         | Keyword search only; no vector/semantic search; full graph loaded per request       |
| **Episodic Memory (superpowers plugin)**   | SQLite + sqlite-vec (`~/.claude/projects` JSONL indexed)                                                         | Episodic (conversation history)                                                                     | Yes — indexes existing session JSONL files  | 384-dim local embeddings; searches past conversations, not written notes            |
| **claude-mem (thedotmack)**                | SQLite (`~/.claude-mem/claude-mem.db`) + ChromaDB vector DB                                                      | Episodic (observations), Semantic (facts), Reflective (session summaries)                           | Yes — global user path, not project-scoped  | Dual write: SQLite = source of truth, ChromaDB = eventual consistency               |
| **cipher (campfirein)**                    | PostgreSQL or SQLite + Qdrant/Milvus/pgvector + optional Neo4j                                                   | Semantic (knowledge), Reflective (reasoning traces), Knowledge Graph                                | Yes (if configured with persistent backend) | Default in-memory vector store loses data on restart — major trap                   |
| **everything-claude-code (affaan-m, ECC)** | Markdown session files (`~/.claude/session-data/`) + YAML instincts (`~/.claude/homunculus/`) + SQLite (v1.9.0+) | Session (episodic), Procedural (instincts/skills), Semantic (rules)                                 | Yes — files persist                         | 5-layer memory system; knowledge graph proposed but not shipped                     |
| **claude-supermemory (supermemoryai)**     | Cloud only (Supermemory API — "custom vector graph engine with ontology-aware edges")                            | Personal preferences, Project/Team knowledge                                                        | Yes — cloud-hosted                          | No local storage option; all data at api.supermemory.ai                             |
| **OpenMemory/Mem0 (CaviraOSS)**            | SQLite (default) or PostgreSQL + sqlite-vec or Weaviate/pgvector                                                 | Episodic (decay 0.015), Semantic (0.005), Procedural (0.008), Emotional (0.020), Reflective (0.001) | Yes — file or server-backed                 | Five cognitive sectors with differential decay rates; active rewrite in progress    |
| **Engram (Gentleman-Programming)**         | SQLite + FTS5 (`~/.engram/engram.db`)                                                                            | Semantic (full-text search), Episodic (session records)                                             | Yes — persistent SQLite                     | Single Go binary; MIT license; explicit Claude Code support                         |
| **OMEGA Memory (mcp-research)**            | SQLite + sqlite-vec + bge-small-en-v1.5 ONNX embeddings (`~/.omega/omega.db`)                                    | Episodic, Semantic, Procedural, Error patterns, Checkpoints                                         | Yes — SQLite file                           | Claims 95.4% on LongMemEval; WSL2 required on Windows                               |
| **memoir (camgitt)**                       | Markdown/JSON files with platform-aware path remapping                                                           | Session state, AI memory configs, Workspace projects                                                | Yes — encrypted sync across machines        | E2E encrypted; 11 AI tools supported; cross-platform path remapping                 |
| **mcp-memory-keeper (mkreyman)**           | SQLite (git branch-derived topic channels)                                                                       | Semantic (file content cache), Session context, File change detection                               | Yes — SQLite persists                       | 38 MCP tools; Windows confirmed; single npx install                                 |
| **basic-memory (basicmachines-co)**        | Markdown files (source of truth) + SQLite index + FastEmbed vectors                                              | Semantic (notes/facts), Knowledge graph (wiki-style links)                                          | Yes — markdown files persist                | Human-readable; Obsidian-compatible; hybrid FTS + vector                            |
| **Hindsight (vectorize-io)**               | PostgreSQL (local Docker or cloud) — biomimetic "World/Experiences/Mental Models"                                | Episodic (experiences), Semantic (world model), Procedural (mental models)                          | Yes — PostgreSQL persists                   | 6,700 stars; MIT; best-in-class accuracy; Docker required                           |
| **cursor-memory-bank pattern**             | Markdown files (`memory-bank/` directory, project-scoped)                                                        | Episodic (active context), Semantic (project knowledge), Procedural (progress)                      | Yes — files tracked in git                  | 3,000+ stars; 4-file standard: activeContext, productContext, progress, decisionLog |
| **codebase-memory-mcp (DeusData)**         | SQLite + LZ4 compression (`~/.cache/codebase-memory-mcp/`) — tree-sitter AST                                     | Structural/Procedural (code intelligence: classes, functions, imports)                              | Yes — SQLite persists                       | NOT session memory — structural code index; 66 languages; Windows amd64 binary      |
| **homunculus (humanplane)**                | YAML instincts (`~/.claude/homunculus/instincts/`) + `observations.jsonl`                                        | Procedural (behavioral instincts with confidence scores)                                            | Yes — YAML files persist                    | 328 stars; behavioral learning, not factual memory                                  |
| **claude-diary (rlancemartin)**            | Markdown diary files (`~/.claude/memory/diary/`)                                                                 | Episodic (diary entries), Reflective (patterns → CLAUDE.md rules)                                   | Yes — files persist                         | Generative Agents-inspired; PreCompact hook; simple and reliable                    |
| **mem0 (mem0ai)**                          | Vector DB + Graph DB + Key-Value store (hybrid)                                                                  | Semantic, Episodic, Relational                                                                      | Yes — cloud or self-hosted                  | 51,600 stars; $24M Series A; requires OpenAI API key by default                     |
| **Memori (MemoriLabs)**                    | SQL-native (datastore-agnostic)                                                                                  | Entity, Process, Session levels                                                                     | Yes — SQL-backed                            | 12,900 stars; 81.95% LoCoMo; async memory augmentation                              |
| **context-sync (Intina47)**                | SQLite (`~/.context-sync/data.db`)                                                                               | Session, Project context                                                                            | Yes — SQLite                                | 11 AI platforms; Git hook integration; Claude Code explicit                         |
| **mcp-memory-service (doobidoo)**          | SQLite-vec + optional Cloudflare Workers                                                                         | Semantic (vector), Knowledge graph (causal edges)                                                   | Yes — SQLite                                | 1,600 stars; remote MCP (works in claude.ai browser); Windows documented            |
| **claude-cognitive (GMaN1911)**            | Files (`HOT/WARM/COLD` classification by keyword triggers)                                                       | Semantic (attention-routed, 3-tier), Multi-instance coordination                                    | Yes — files                                 | 445 stars; 64-95% token reduction claimed; multi-instance Pool Coordinator          |
| **Auto Dream (Anthropic, unreleased)**     | Native Auto Memory files (same backend as Claude Code Auto Memory)                                               | Reflective consolidation of all Auto Memory types                                                   | Yes — modifies existing files               | Feature-flagged (flag: `tengu_onyx_plover`); community `dream-skill` replicates it  |

---

### Table 1B: Capture, Retrieval, and Integration Dimensions

| System                            | Capture Mechanism                                                        | Retrieval Mechanism                                                                                                                                             | Integration Method                                                | Admin Required                    |
| --------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------- |
| **Claude Code Auto Memory**       | Automatic (Claude writes during sessions)                                | Keyword/name-based file read; no semantic search                                                                                                                | Native — no install needed                                        | No                                |
| **Claude Code CLAUDE.md**         | Manual (human writes) + auto-update via `/session-end` skill             | Context injection (full file, every session)                                                                                                                    | Native — no install needed                                        | No                                |
| **Claude Code MCP Memory**        | Manual (Claude calls `create_entities`, `add_observations`)              | Keyword/string matching (`search_nodes`)                                                                                                                        | MCP server (npx, no admin)                                        | No                                |
| **Episodic Memory (superpowers)** | Auto — indexes existing `.jsonl` session files passively                 | Semantic vector search (384-dim, local ONNX)                                                                                                                    | Claude Code plugin marketplace                                    | No                                |
| **claude-mem**                    | Auto — PostToolUse hook (fire-and-forget, async AI processing)           | Progressive 3-layer: index (~50-100 tokens) → timeline → full details; hybrid SQL + semantic                                                                    | Claude Code plugin marketplace + lifecycle hooks                  | No                                |
| **cipher**                        | Semi-auto — Claude must call `cipher_extract_and_operate_memory`         | Semantic vector search; no progressive disclosure                                                                                                               | MCP server (`npm install -g @byterover/cipher`)                   | No                                |
| **everything-claude-code (ECC)**  | Auto (hooks, 100% reliable v2) + manual `/learn-eval` quality gate       | Per-layer: session files (filename), instincts (domain+confidence), skills (task similarity)                                                                    | Plugin marketplace + manual `install.sh --profile full` for rules | No                                |
| **claude-supermemory**            | Auto — Stop hook captures session; SessionStart hook injects             | Passive injection (10 personal + 20 project at start) + active `super-search`                                                                                   | Claude Code plugin marketplace + SUPERMEMORY_CC_API_KEY env var   | No                                |
| **OpenMemory/Mem0**               | Manual — Claude must call `openmemory_store` MCP tool                    | Multi-stage: sector classification → cosine similarity → 1-hop graph expansion → composite scoring (60% similarity + 20% salience + 10% recency + 10% waypoint) | MCP server (Docker recommended)                                   | No (Docker)                       |
| **Engram**                        | Manual (Claude calls MCP tools)                                          | Full-text search (FTS5) + SQLite                                                                                                                                | Plugin marketplace or manual MCP config                           | No                                |
| **OMEGA Memory**                  | Auto — hooks for Claude Code; manual for others                          | Semantic (ONNX embeddings) + graph traversal                                                                                                                    | `omega setup` auto-configures hooks + MCP                         | No (but WSL2 needed on Windows)   |
| **memoir**                        | Manual — `memoir push` / `memoir restore` CLI commands                   | No retrieval — sync only (restore from backup)                                                                                                                  | npm global install; MCP server                                    | No                                |
| **mcp-memory-keeper**             | Manual (Claude calls 38 MCP tools)                                       | Keyword + file content cache + topic channels by git branch                                                                                                     | `claude mcp add memory-keeper npx mcp-memory-keeper`              | No                                |
| **basic-memory**                  | Manual (Claude calls write tools)                                        | Hybrid: full-text (FTS) + semantic (FastEmbed) + wiki link traversal (`memory://` URLs)                                                                         | `uv tool install basic-memory` + MCP config                       | No                                |
| **Hindsight**                     | Manual (Claude or application calls API)                                 | Biomimetic composite scoring                                                                                                                                    | MCP server or HTTP API (Docker recommended)                       | No (Docker)                       |
| **cursor-memory-bank pattern**    | Manual — `/van`, `/plan`, `/build`, `/reflect` commands                  | File read (no semantic search); load-on-demand by phase (70% token reduction)                                                                                   | Markdown files + custom slash commands                            | No                                |
| **codebase-memory-mcp**           | Auto — pre-tool hooks index on file change                               | AST graph query (sub-ms)                                                                                                                                        | Auto-detect install (single binary, no dependencies)              | No                                |
| **homunculus**                    | Auto — hooks capture every prompt + tool interaction                     | Domain + confidence filter on YAML instincts                                                                                                                    | Claude Code plugin or ECC dependency                              | No                                |
| **claude-diary**                  | Semi-auto — `/diary` command + PreCompact auto-hook                      | File read; no semantic search                                                                                                                                   | Clone + copy hook file manually                                   | No                                |
| **mem0**                          | Manual or SDK-triggered                                                  | Hybrid vector + graph + key-value                                                                                                                               | Python/TypeScript SDK or MCP server                               | No (cloud) / Docker (self-hosted) |
| **Memori**                        | SDK/MCP tool call                                                        | SQL-native entity/process query                                                                                                                                 | MCP server (Claude Code, Cursor, Codex)                           | No                                |
| **context-sync**                  | Auto — Git hooks (post-commit, pre-push, post-merge)                     | `recall()` tool call                                                                                                                                            | MCP config + git hooks                                            | No                                |
| **mcp-memory-service**            | Manual (MCP tools) + optional hooks (Claude Code hooks guide provided)   | Hybrid BM25 + vector (ONNX); typed causal graph                                                                                                                 | pip install + MCP config or REST API                              | No                                |
| **claude-cognitive**              | Auto — keyword-triggered file classification                             | HOT/WARM/COLD tier routing; no semantic search                                                                                                                  | Script-based setup + env vars                                     | No                                |
| **Auto Dream**                    | Auto — background sub-agent (server-gated, fires after 24h / 5 sessions) | Consolidation/pruning of existing Auto Memory                                                                                                                   | Native — no install; flag `tengu_onyx_plover`                     | No                                |

---

### Table 1C: Cross-Device Sync, Windows, and Token Dimensions

| System                            | Cross-Locale/Device Sync                                                | Windows Compatibility                                                                                       | Token Overhead                                                                 | Stars / Maturity                                                 |
| --------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| **Claude Code Auto Memory**       | No — explicitly machine-local                                           | Native (no issues)                                                                                          | MEDIUM (~6,000 tokens max per session, 200 lines / 25KB cap)                   | Official Anthropic feature                                       |
| **Claude Code CLAUDE.md**         | Yes — via git (project); manual (user-level)                            | Native                                                                                                      | LOW–MEDIUM (~500–1,000 tokens per file)                                        | Official Anthropic feature                                       |
| **Claude Code MCP Memory**        | No — JSONL file is local                                                | Excellent — already active via `cmd /c npx`                                                                 | LOW (~2,000 tokens tool descriptions + data)                                   | Official reference implementation                                |
| **Episodic Memory (superpowers)** | No — indexes local `~/.claude/projects`                                 | Good — v1.0.14+ fixes ENOENT; open nvm issue (#49); project uses fnm (likely OK)                            | LOW (search tool only; permission scoped)                                      | Superpowers marketplace plugin                                   |
| **claude-mem**                    | No (local SQLite + ChromaDB) — `~/.claude-mem/`                         | Fragile — documented AbortSignal crash, pipe mode breakage, PowerShell dependency; Windows issues prevalent | HIGH (worker daemon, Bun runtime, ChromaDB, port 37777)                        | ~38,400 stars; v10.6.3; very active                              |
| **cipher**                        | Yes (if Qdrant/Milvus configured + accessible from both machines)       | Unknown — no explicit Windows docs; npm-based (likely works)                                                | MEDIUM–HIGH (multiple API calls for extraction; PostgreSQL/SQLite + vector DB) | ~3,600 stars; beta                                               |
| **everything-claude-code (ECC)**  | Partial — instinct YAML export/import; session files are local          | Windows native (Node.js scripts) — cross-platform explicitly stated                                         | HIGH (large system: 30 agents, 60+ commands, 24 MCP servers)                   | ~124,000 stars; v1.9.0; very active                              |
| **claude-supermemory**            | Yes — cloud storage; same API key = same memory on any machine          | Poor — Windows stdin bug open (Issue #25, Feb 2026); hangs indefinitely                                     | MEDIUM (10 personal + 20 project injected at start)                            | ~2,400 stars; v0.0.3; Supermemory-backed                         |
| **OpenMemory/Mem0 (CaviraOSS)**   | Yes (central backend mode with PostgreSQL + HTTP API)                   | Docker required (Docker Desktop on Windows) — no native Windows binary                                      | MEDIUM (MCP tools ~2,000 tokens overhead)                                      | ~3,800 stars; active rewrite in progress; Apache 2.0             |
| **Engram**                        | No — local SQLite                                                       | Excellent — single Go binary; MIT; plugin marketplace install                                               | LOW (FTS5 SQLite; no embedding overhead)                                       | ~2,100 stars; v1.11.0; very active                               |
| **OMEGA Memory**                  | No — local SQLite                                                       | Poor — WSL2 required on Windows                                                                             | MEDIUM (ONNX embeddings, 25 MCP tools overhead)                                | Small (unconfirmed); Apache 2.0                                  |
| **memoir**                        | Yes — E2E encrypted sync across 11 AI tools with Windows path remapping | Confirmed Windows + path remapping                                                                          | Negligible (sync tool, not active memory injection)                            | 5 stars; 27 days old; very new                                   |
| **mcp-memory-keeper**             | Partial — git backup option                                             | Confirmed Windows (npx cross-platform)                                                                      | LOW–MEDIUM (38 tools listed but 3 profiles; use minimal)                       | ~110 stars; 117 commits; active                                  |
| **basic-memory**                  | Partial — cloud sync option (subscription); local-only by default       | Good — `uv tool install` cross-platform; uv works without admin                                             | LOW–MEDIUM (markdown files; hybrid FTS + FastEmbed)                            | ~2,700 stars; active                                             |
| **Hindsight**                     | Yes (Docker/cloud deployment)                                           | Docker required                                                                                             | MEDIUM (PostgreSQL-backed; biomimetic scoring)                                 | ~6,700 stars; MIT; Virginia Tech + WaPo independent verification |
| **cursor-memory-bank pattern**    | Yes — via git (files in project repo)                                   | Native (markdown files)                                                                                     | LOW (load-on-demand by phase; 70% token reduction)                             | ~3,000 stars; Dec 2024                                           |
| **codebase-memory-mcp**           | No — local SQLite cache                                                 | Excellent — pre-built Windows amd64 binary; zero dependencies                                               | LOW (structural queries only, not injected at session start)                   | ~1,100 stars; 2,586 tests; very active                           |
| **homunculus**                    | Partial — YAML export/import for instincts                              | Unconfirmed — shell-heavy install, likely needs Bash (Git Bash or WSL)                                      | LOW (YAML files; background Haiku agent)                                       | ~328 stars; v2; active                                           |
| **claude-diary**                  | Partial — via git if diary files committed                              | Needs Bash (Git Bash or WSL for PreCompact hook)                                                            | LOW (markdown diary files; no vector DB)                                       | ~351 stars; active                                               |
| **mem0**                          | Yes (cloud API or self-hosted server)                                   | Python-based (uvx) — works on Windows; self-hosted requires Docker                                          | MEDIUM–HIGH (cloud API calls for extraction)                                   | ~51,600 stars; $24M Series A; very active                        |
| **Memori**                        | Yes (cloud or self-hosted SQL)                                          | MCP-based; likely works                                                                                     | MEDIUM                                                                         | ~12,900 stars; active                                            |
| **context-sync**                  | Partial — npm; SQLite local; no built-in sync                           | Likely works (TypeScript + SQLite); no explicit Windows docs                                                | LOW                                                                            | ~120 stars; v2.0.0; active                                       |
| **mcp-memory-service**            | Partial — Cloudflare Workers sync option                                | Windows documented (`python scripts/install_windows.py`; DirectML option)                                   | MEDIUM (ONNX embeddings + BM25; REST API)                                      | ~1,600 stars; Apache 2.0; active                                 |
| **claude-cognitive**              | Partial — file-based; cross-device if files synced manually             | Likely works (Node-based) — no explicit Windows docs                                                        | LOW (3-tier file classification; no vector DB)                                 | ~445 stars; v1.1; active                                         |
| **Auto Dream**                    | No — operates on machine-local Auto Memory files                        | Native (no install)                                                                                         | None additional (consolidates existing memory)                                 | Official Anthropic (unreleased/gated)                            |

---

### Table 1D: License, Solo Dev Suitability Rating

| System                                     | License                                 | Solo Dev Suitability (1–5) | Rationale                                                                                                                                                                                                     |
| ------------------------------------------ | --------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Claude Code Auto Memory**                | Proprietary (Anthropic)                 | 5                          | Already active, zero friction, auto-capture, native; machine-local is the only real weakness for cross-locale                                                                                                 |
| **Claude Code CLAUDE.md**                  | Proprietary (Anthropic)                 | 5                          | Already active, git-synced, fully customizable; human-maintained is effort but is also control                                                                                                                |
| **Claude Code MCP Memory (mcp\_\_memory)** | MIT                                     | 4                          | Already configured; knowledge graph is powerful for relationships; keyword-only search is a limitation                                                                                                        |
| **Episodic Memory (superpowers)**          | Unknown (marketplace)                   | 3                          | Already permitted; useful for "what did I do last time?"; fnm compatibility likely OK but open Windows issue is risk                                                                                          |
| **claude-mem**                             | AGPL-3.0                                | 2                          | Most sophisticated architecture but Windows fragility (multiple documented crashes), Bun + ChromaDB + PowerShell dependency chain, CLAUDE.md subdirectory pollution (won't fix), high complexity for solo dev |
| **cipher**                                 | Elastic License 2.0                     | 2                          | IDE-agnostic is elegant but default in-memory vector store data loss is a critical trap; requires explicit tool calls (not auto); limited community traction; not OSI open source                             |
| **everything-claude-code (ECC)**           | MIT                                     | 2                          | Extraordinary breadth but enormous complexity (30 agents, 60+ commands) for a solo operator; active session injection bug (#1053) cross-contaminates projects; better as inspiration than adoption            |
| **claude-supermemory**                     | MIT (plugin code)                       | 2                          | Cloud-native sync is genuinely useful for cross-locale; but $19/month Pro required + Windows stdin bug open + privacy risk of full session transcripts to cloud                                               |
| **OpenMemory/Mem0 (CaviraOSS)**            | Apache 2.0                              | 2                          | Architecturally sophisticated (5 cognitive sectors, temporal validity); active rewrite warning; Docker dependency; no auto-capture hooks                                                                      |
| **Engram**                                 | MIT                                     | 4                          | Single Go binary, zero dependencies, Windows native, first-class Claude Code plugin marketplace support, SQLite + FTS5; weakness is FTS-only (no semantic search)                                             |
| **OMEGA Memory**                           | Apache 2.0                              | 1                          | WSL2 required on Windows = hard blocker for work locale without admin; high potential if this were resolved                                                                                                   |
| **memoir**                                 | Unknown                                 | 3                          | Only tool found with explicit Windows path remapping for cross-locale sync; E2E encrypted; very new (5 stars, 27 days old) = high adoption risk; sync-only, not active memory                                 |
| **mcp-memory-keeper**                      | MIT                                     | 4                          | Confirmed Windows compatible; single npx install; 38 tools (use minimal profile to reduce overhead); git branch topic isolation is clever; limited by no semantic search                                      |
| **basic-memory**                           | MIT (local) / subscription (cloud sync) | 4                          | Human-readable markdown + SQLite + hybrid search; Obsidian-compatible; uv install works without admin; cloud sync option for cross-locale                                                                     |
| **Hindsight**                              | MIT                                     | 2                          | Best benchmark accuracy but Docker required + PostgreSQL = heavy infrastructure for solo dev; overkill                                                                                                        |
| **cursor-memory-bank pattern**             | N/A (pattern)                           | 4                          | Directly portable; 4-file structure maps to existing SESSION_CONTEXT.md pattern; phase-based rule loading (70% token reduction) is directly adoptable; markdown = no dependencies                             |
| **codebase-memory-mcp**                    | MIT                                     | 5                          | Complements session memory (not a replacement); Windows amd64 binary; zero dependencies; 66 languages; auto-detects Claude Code; fills the structural index gap none of the session memory tools address      |
| **homunculus**                             | MIT                                     | 3                          | Behavioral instinct learning is unique value; Windows compatibility unconfirmed; ECC dependency risk; 328 stars suggests limited battle-testing                                                               |
| **claude-diary**                           | MIT                                     | 4                          | Dead simple, proven pattern, 351 stars, high trust; Windows requires Bash (Git Bash) for PreCompact hook; zero infrastructure                                                                                 |
| **mem0**                                   | Apache 2.0 (OSS)                        | 2                          | Highest stars in ecosystem (51,600) + AWS chose as exclusive provider; but requires OpenAI API key by default; Docker for self-hosted; heavyweight for solo dev                                               |
| **Memori**                                 | MIT                                     | 3                          | Strong benchmarks (81.95% LoCoMo); async non-blocking architecture; less documentation for Claude Code specifically                                                                                           |
| **context-sync**                           | MIT                                     | 3                          | 11 platforms; git hook integration aligns with existing workflow; SQLite local; limited community evidence                                                                                                    |
| **mcp-memory-service**                     | Apache 2.0                              | 3                          | Hybrid BM25 + vector + causal graph is sophisticated; remote MCP unique feature; Windows docs; Python dependency chain                                                                                        |
| **claude-cognitive**                       | MIT                                     | 3                          | Token efficiency focus is valuable; multi-instance coordination bonus; simpler than vector DB approaches; limited documentation                                                                               |
| **Auto Dream**                             | Proprietary (Anthropic)                 | 5                          | When it ships, zero friction consolidation of Auto Memory; community `dream-skill` provides it now; directly solves memory entropy without adding infrastructure                                              |

---

## Part 2: Systems by Category

### Category A: Already Active in This Project

These systems are currently configured and in use:

1. **Claude Code Auto Memory** — writes to `~/.claude/projects/*/memory/`; 39
   files across 4 categories in this project
2. **Claude Code CLAUDE.md** — 258 lines, version 5.8, git-tracked
3. **Claude Code MCP Memory (`mcp__memory`)** — configured in `.mcp.json`;
   knowledge graph with entities/relations
4. **Episodic Memory (superpowers plugin)** — permission granted for `search`
   tool; indexes session JSONL files
5. **Session state files** — 82 files in `.claude/state/`; hook-driven
   persistence system
6. **TDMS** — 8,473 debt items in `MASTER_DEBT.jsonl`; structured
   domain-specific memory
7. **GSD planning artifacts** — `.planning/` with 93 decisions, state files,
   skill/agent definitions

### Category B: High Fit for Adoption (solo Windows dev, cross-locale need)

Ranked by fit to the specific constraints of this project:

| Rank | System                         | Key Reason                                                                                         | Install Friction            |
| ---- | ------------------------------ | -------------------------------------------------------------------------------------------------- | --------------------------- |
| 1    | **codebase-memory-mcp**        | Fills structural index gap; Windows binary; zero deps; auto-detects Claude Code                    | Single binary, auto-install |
| 2    | **cursor-memory-bank pattern** | Directly portable 4-file pattern; phase-based rule loading; zero deps; proven 3,000 stars          | Markdown files only         |
| 3    | **Engram**                     | Single Go binary; MIT; confirmed Claude Code plugin marketplace; FTS5                              | One plugin command          |
| 4    | **basic-memory**               | Human-readable markdown + semantic search; cloud sync option for cross-locale; Obsidian-compatible | `uv tool install`           |
| 5    | **claude-diary**               | Simplest proven episodic pattern; PreCompact hook; zero infrastructure                             | Copy 2 files                |
| 6    | **mcp-memory-keeper**          | Confirmed Windows + npx; 38 tools; git branch topic channels                                       | Single npx command          |
| 7    | **memoir**                     | ONLY tool with Windows path remapping for cross-locale; 11 AI tools                                | npm global + config         |

### Category C: Architecturally Valuable but Not Recommended for Adoption

These systems have important patterns to learn from but are not recommended for
direct adoption given this project's constraints:

| System                           | Pattern Worth Adopting                                                                                               | Adoption Blocker                                                          |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **claude-mem**                   | Progressive 3-layer disclosure (index → timeline → full); fire-and-forget queue semantics; SHA-256 dedup             | Windows fragility; CLAUDE.md pollution; AGPL-3.0; high complexity         |
| **cipher**                       | Reasoning trace capture (System 2 / Reflection Memory); quality threshold gating (≥0.4 score)                        | Default data loss; Elastic License 2.0; not auto-capture                  |
| **ECC (everything-claude-code)** | Instinct confidence scoring (0.3–0.9); "What Did NOT Work" session section; session adapter contract                 | Complexity overhead; active session injection bug; 30 agents for solo dev |
| **claude-supermemory**           | Signal keyword extraction; dual-scope container tags; `/index` one-time codebase analysis                            | $19/month; Windows stdin bug; privacy risk                                |
| **OpenMemory/Mem0**              | Sector-specific decay rates; waypoint associative graph; temporal valid_from/valid_to; composite scoring 60/20/10/10 | Active rewrite; Docker dependency; no auto-capture                        |
| **OMEGA Memory**                 | ONNX local embeddings (no API key); checkpoint/resume; error pattern accumulation                                    | WSL2 required on Windows = hard blocker                                   |
| **Hindsight**                    | Best-in-class accuracy (independent verification); biomimetic World/Experiences/Mental Models                        | Docker + PostgreSQL = heavy infrastructure                                |
| **mem0**                         | Highest ecosystem adoption (AWS chose it); hybrid vector+graph+KV; temporal contradiction resolution                 | OpenAI API key default; Docker self-hosted; heavyweight                   |
| **homunculus**                   | Instinct confidence scoring; evolution pathway (instinct → skill → command → agent)                                  | Windows unconfirmed; shell-heavy install                                  |

### Category D: Not Recommended

| System                                            | Reason                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| **OMEGA Memory**                                  | WSL2 hard blocker at work locale (no admin)                               |
| **memory-store-plugin (julep-ai)**                | ARCHIVED December 27, 2025 — discontinued                                 |
| **OpenClaw ecosystem (openclaw-config, ClawMem)** | OpenClaw is a parallel ecosystem; not Claude Code-native                  |
| **Hermes agent (NousResearch)**                   | Standalone agent competing with Claude Code, not extending it             |
| **claude-code-memory (ViralV00d00)**              | Neo4j dependency; 9 stars; high setup friction                            |
| **Hindsight**                                     | Docker + PostgreSQL for solo dev is overkill                              |
| **SuperLocalMemory**                              | Community project created as Mem0 alternative; insufficient documentation |

---

## Part 3: Dimension Deep-Dives

### 3.1 Storage Backend Comparison

| Backend Type                       | Systems Using It                                                                                                      | Pros                                                                       | Cons                                                                        | Windows              |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------- |
| **Markdown files**                 | Claude Code Auto Memory, CLAUDE.md, cursor-memory-bank, claude-diary, basic-memory (source of truth)                  | Human-readable, git-trackable, zero deps, offline                          | No semantic search, manual curation, can accumulate noise ("context rot")   | Native               |
| **SQLite (with FTS5)**             | mcp\_\_memory (JSONL), Engram, mcp-memory-keeper, codebase-memory-mcp, context-sync                                   | Portable single file, no server, ACID, fast keyword search                 | No vector/semantic search                                                   | Native               |
| **SQLite + local ONNX embeddings** | Episodic Memory (sqlite-vec), OMEGA Memory (bge-small-en-v1.5), mcp-memory-service (MiniLM), basic-memory (FastEmbed) | Local semantic search with zero API cost, offline                          | ONNX runtime overhead, slower than cloud embeddings                         | Native (with uv/npm) |
| **SQLite + ChromaDB**              | claude-mem                                                                                                            | Hybrid: SQL ACID + vector semantic search; progressive disclosure possible | ChromaDB eventual consistency; Bun + uv dependency chain; Windows fragility | Fragile              |
| **PostgreSQL + pgvector**          | Hindsight, self-hosted OpenMemory/Mem0, self-hosted Supermemory                                                       | Production-grade, scalable, cross-device via central server                | Docker or server required; heavyweight for solo dev                         | Docker only          |
| **Cloud (Supermemory API)**        | claude-supermemory                                                                                                    | Zero local setup, cross-device native                                      | $19/month; privacy risk; Windows stdin bug                                  | Open bug             |
| **YAML / JSON files**              | ECC instincts (YAML), SWS decisions (JSONL), session state files                                                      | Human-readable config, portable, git-trackable                             | No search beyond grep; YAML schema enforcement optional                     | Native               |
| **Knowledge graph (JSONL)**        | mcp\_\_memory (official), Neo4j variants                                                                              | Relational memory; entity+relation model                                   | Keyword search only (official server); Neo4j = heavy infra                  | Native (official)    |

### 3.2 Memory Types Coverage

Academic taxonomy from D4a: Five cognitive memory types (episodic, semantic,
procedural, reflective, working). Mapping of systems:

| Memory Type           | Definition                                                     | Systems That Cover It                                                                                            |
| --------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Episodic**          | Timestamped specific events: "On Tuesday I fixed the auth bug" | Episodic Memory (superpowers), claude-mem, claude-diary, ECC session files, OpenMemory, context-sync             |
| **Semantic**          | Facts and knowledge: "API rate limit is 100 req/min"           | Claude Code Auto Memory, CLAUDE.md, mcp\_\_memory, basic-memory, mcp-memory-keeper, Engram, mem0                 |
| **Procedural**        | How-to skills: "To deploy: run npm run build"                  | CLAUDE.md (guardrails), homunculus (instincts), ECC (skills), codebase-memory-mcp (code structure)               |
| **Reflective / Meta** | Higher-order patterns: "I always skip tests under deadline"    | claude-diary (reflection), ECC (/reflect), OpenMemory (reflective sector), cipher (reasoning traces), Auto Dream |
| **Working**           | Active in-context reasoning buffer                             | All systems via context injection                                                                                |

**Gap in current project:** Episodic memory is the weakest layer. The
`mcp__memory` server stores semantic facts (entities/relations) but not
timestamped events. The Episodic Memory plugin searches past conversations but
doesn't write structured episode records. MEMORY.md mixes episodic and semantic
content in flat format, losing temporal binding.

### 3.3 Windows Compatibility Detail

| Tier                            | Systems                                                                                                                                                                                                               | Notes                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Excellent (Native)**          | Claude Code Auto Memory, CLAUDE.md, cursor-memory-bank pattern, mcp\_\_memory (already running via `cmd /c npx`), codebase-memory-mcp (pre-built amd64 binary), Engram (Go binary), mcp-memory-keeper (npx confirmed) | These work without WSL, without admin, without Docker              |
| **Good (no admin, no Docker)**  | Episodic Memory (superpowers, fnm-safe), basic-memory (uv install), mcp-memory-service (pip + install script), memoir (npm global), context-sync (npm)                                                                | Work on Windows natively with portable installs                    |
| **Fragile (documented issues)** | claude-mem (AbortSignal crash, pipe breakage, PowerShell dep), claude-supermemory (Windows stdin bug open)                                                                                                            | Known Windows-specific failures; use with caution                  |
| **Docker required**             | Hindsight, OpenMemory/Mem0 (recommended), Weaviate, Neo4j                                                                                                                                                             | Need Docker Desktop; no admin = blocker at work locale             |
| **WSL2 required**               | OMEGA Memory                                                                                                                                                                                                          | Hard blocker at work locale without admin                          |
| **Unknown**                     | cipher, Memori, mem0 (cloud), claude-cognitive, homunculus                                                                                                                                                            | npm/Python-based; likely work but no explicit Windows confirmation |

### 3.4 Cross-Locale Sync Options

The project has two Windows locales (home: Owner, work: jbell). They share
git-tracked files but have separate `~/.claude/` directories. Options for
bridging:

| Approach                                | System                                                       | How                                                                             | Cost                      | Risk                                                                 |
| --------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------- |
| **Already works (git)**                 | CLAUDE.md, .planning/, SESSION_CONTEXT.md, canonical-memory/ | git push/pull                                                                   | Free                      | Manual sync discipline required                                      |
| **autoMemoryDirectory → synced folder** | Claude Code Auto Memory                                      | Set `autoMemoryDirectory` to OneDrive/Dropbox path in `~/.claude/settings.json` | Free (uses existing sync) | Concurrent write risk (low for solo dev using one machine at a time) |
| **Cross-locale encrypted sync**         | memoir                                                       | `memoir push`/`memoir restore`; platform-aware path remapping                   | Free (MIT)                | Very new (5 stars); sync-only, not semantic search                   |
| **Cloud MCP**                           | claude-supermemory                                           | Same API key = same cloud memory                                                | $19/month                 | Windows stdin bug; privacy risk                                      |
| **Central self-hosted MCP**             | OpenMemory, mcp-memory-service                               | Deploy one backend; both machines point at HTTP endpoint                        | VPS cost                  | Requires server; setup overhead                                      |
| **basic-memory cloud sync**             | basic-memory                                                 | Cloud sync option                                                               | Subscription cost unknown | SSL cert error prevented docs verification                           |

**Best practical option for this project:** Set `autoMemoryDirectory` to a
synced OneDrive folder path in `~/.claude/settings.json` at both locales. This
leverages already-running OneDrive sync with zero new infrastructure. Combined
with `canonical-memory/` in git for fallback.

---

## Part 4: Pattern Extraction

### Patterns Worth Adopting (from any system, regardless of adoption recommendation)

These patterns are extractable into the existing architecture without adopting
the full system:

| Pattern                                         | Source                      | How to Adopt                                                                                                                               |
| ----------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Progressive disclosure (3-tier retrieval)**   | claude-mem                  | Structure MEMORY.md as: index (~50 lines) → detail sections (on-demand) → external reference files (linked)                                |
| **"What Did NOT Work" session section**         | ECC                         | Add explicit "Failed approaches this session" section to SESSION_CONTEXT.md updates                                                        |
| **Signal keyword extraction**                   | claude-supermemory          | Only write to MEMORY.md turns containing trigger words: "decision", "bug", "architecture", "correction", "never again"                     |
| **Sector-specific memory files**                | OpenMemory, MIRIX, academic | Split MEMORY.md into: `memory/episodic.md`, `memory/semantic.md`, `memory/procedural.md`                                                   |
| **valid_from / valid_to on facts**              | OpenMemory                  | Add date range to MEMORY.md entries: `[2026-01-01 to present] API rate limit is 100/min`                                                   |
| **Content type prior as admission gate**        | A-MAC (academic)            | Whitelist categories for MEMORY.md: user-corrections, architecture-decisions, hook-patterns, recurring-errors                              |
| **Phase-based rule loading**                    | cursor-memory-bank          | Create CLAUDE.md `@import` sections that load different rule files based on task phase                                                     |
| **Frequency analysis for memory bootstrapping** | interface-design `/extract` | Script to analyze session logs for repeated patterns (decisions, errors) → seed MEMORY.md                                                  |
| **Composite scoring (60/20/10/10)**             | OpenMemory                  | When Claude evaluates which memory entries to surface, weight: similarity 60%, salience 20%, recency 10%, access-count 10%                 |
| **Quality threshold gating**                    | cipher                      | Add quality gate to memory writes: only persist if entry meets minimum signal criteria (length > N words, contains decision/error/pattern) |
| **Citation-backed memory + JIT validation**     | GitHub Copilot              | Include file:line references in MEMORY.md entries; Claude validates before using                                                           |
| **Dual session IDs (stable + ephemeral)**       | claude-mem                  | Separate `content_session_id` (stable across restarts) from internal process ID                                                            |
| **Sleep-time consolidation**                    | LightMem, Auto Dream        | Run 3-phase consolidation at `/session-end`: raw observations → group by topic → merge into MEMORY.md                                      |

---

## Part 5: Benchmarks and Performance Claims

| System                          | Benchmark                   | Score                                                                                 | Notes                                                         |
| ------------------------------- | --------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **OpenMemory/Mem0 (CaviraOSS)** | LongMemEval (self-reported) | 95% recall at k=5                                                                     | Self-reported only; active rewrite in progress                |
| **OMEGA Memory**                | LongMemEval (self-reported) | 95.4%                                                                                 | Self-reported; WSL2 required on Windows                       |
| **Supermemory**                 | LongMemEval_s (official)    | 81.6%                                                                                 | Verified on LongMemEval_s with GPT-4o                         |
| **Hindsight**                   | LongMemEval                 | State-of-the-art                                                                      | Independent verification by Virginia Tech and Washington Post |
| **mem0**                        | LoCoMo benchmark            | 26% accuracy improvement over OpenAI Memory; 91% lower p95 latency; 90% token savings | Some independent corroboration                                |
| **Memori**                      | LoCoMo                      | 81.95% accuracy; 4.97% of full-context footprint                                      | Active as of March 2026                                       |
| **claude-mem**                  | Token efficiency            | ~10x token savings vs naive full-context injection (800 tokens index vs 25,000 raw)   | Self-reported                                                 |
| **claude-cognitive**            | Token reduction             | 64-95% reduction on 1M+ line codebases with 8 concurrent instances                    | Self-reported; validated on real workloads                    |

**Benchmark conflicts:** OMEGA (95.4%) and Hindsight both claim top LongMemEval
rankings simultaneously. These cannot both be current. LongMemEval leaderboards
shift; treat as indicative, not authoritative rankings.

---

## Gaps and Contradictions

### Gaps Identified in Research

1. **No direct benchmark comparison** between systems tested on
   coding-agent-specific scenarios (vs. general conversation/QA tasks).
   LongMemEval and LoCoMo test conversational memory, not code decision
   persistence.

2. **OMEGA Memory Windows status** unresolved: PyPI works without Docker but
   official docs require WSL2 for full functionality. Native Windows operation
   not confirmed.

3. **basic-memory cloud sync pricing** not verified (SSL error on
   basicmemory.com).

4. **memoir maturity** is a significant uncertainty: 5 stars, 27 days old as of
   research date. The cross-locale path remapping is uniquely valuable but the
   tool is untested at scale.

5. **autoMemoryDirectory + cloud folder sync** combination not officially
   documented or independently tested. May work for solo dev (one machine at a
   time) but concurrent use risk is real.

6. **Cipher capture mechanism** is marketed as "automatic" but implementation
   requires explicit tool calls — not hook-based auto-capture.

### Contradictions

1. **OMEGA vs Hindsight benchmark**: Both claim top LongMemEval performance.
   Cannot both be current leaders.

2. **claude-supermemory benchmark**: Official 81.6% (LongMemEval_s, GPT-4o) vs
   independent community estimate of ~70% (LoCoMo, different model). Different
   benchmarks, different base models — not directly comparable.

3. **claude-mem stars**: Multiple sources give different counts (24,000 → 38,400
   → 43,900). Best corroborated figure: ~38,400 (ClaudePluginHub, March 2026).

4. **Auto Dream release status**: Some community sources describe it as live
   (March 2026). Official Anthropic CHANGELOG has no entry. Feature flag
   `tengu_onyx_plover` is in codebase with `enabled: false`. Treat as: not yet
   GA, available via `dream-skill` community implementation.

5. **OpenMemory stability**: README warns "expect breaking changes" but 277
   commits and activity through March 31, 2026. Genuinely uncertain stability.

---

## Confidence Assessment

- HIGH claims: 38
- MEDIUM claims: 18
- LOW claims: 4 (memoir maturity, OMEGA Windows, Auto Dream GA status, some
  benchmark conflicts)
- UNVERIFIED claims: 0
- **Overall confidence: HIGH for the matrix structure; MEDIUM for specific
  benchmark figures and very new tools**

---

## Sources

All findings drawn from the following research files, each cited at HIGH
confidence based on their own assessments:

| File                            | Coverage                                              | Overall Confidence |
| ------------------------------- | ----------------------------------------------------- | ------------------ |
| D1-codebase-memory-inventory.md | Current project memory systems (14 findings)          | HIGH               |
| D2a-claude-mem-cipher.md        | claude-mem + cipher deep analysis                     | HIGH               |
| D2b-everything-cc-interface.md  | ECC + interface-design analysis                       | HIGH               |
| D2c-supermemory-openmemory.md   | claude-supermemory + OpenMemory analysis              | HIGH               |
| D3a-1-github-claude-memory.md   | 23 Claude Code memory repos                           | MEDIUM-HIGH        |
| D3a-2-github-agent-memory.md    | Cross-agent memory systems (Cursor, Roo, Cline, etc.) | MEDIUM-HIGH        |
| D3b-1-reddit-hn.md              | Community patterns and sentiment                      | MEDIUM-HIGH        |
| D3b-2a-anthropic-official.md    | Anthropic official docs (Auto Memory, Auto Dream)     | HIGH               |
| D3b-2b-dev-blogs.md             | Developer blog patterns and implementations           | MEDIUM-HIGH        |
| D3c-marketplace-plugins.md      | Plugin marketplace ecosystem                          | HIGH               |
| D4a-academic-memory-patterns.md | 20 academic papers on LLM memory                      | HIGH               |
| D4b-industry-implementations.md | Devin, Letta, OpenHands, Copilot, Augment             | HIGH               |
| D5a-mcp-memory-servers.md       | MCP server inventory and Windows compatibility        | HIGH               |
| D5b-mcp-integration-patterns.md | MCP architecture patterns and best practices          | MEDIUM-HIGH        |
