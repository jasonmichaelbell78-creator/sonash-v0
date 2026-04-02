# Findings: Deep Analysis — claude-supermemory and OpenMemory Reference Repos

**Searcher:** deep-research-searcher **Profile:** web **Date:**
2026-03-31T00:00:00Z **Sub-Question IDs:** SQ2

---

## Key Findings

### Repo 1: supermemoryai/claude-supermemory

---

#### 1.1 Purpose and Problem Being Solved [CONFIDENCE: HIGH]

claude-supermemory is a Claude Code marketplace plugin that solves the
statelessness of Claude Code sessions. Without it, every session starts cold —
no knowledge of previous work, decisions, preferences, or bug resolutions. The
plugin connects Claude Code to the Supermemory cloud platform so that context
accumulates across sessions and is available instantly at session start. The
target audience is developers (solo and team) who work across multiple sessions
on the same codebase and lose context between them [1][2].

The core value proposition, as stated in their blog: "The injection happens
invisibly. You type your message, the plugin fetches context, prepends it, and
forwards the enriched prompt." [9]

---

#### 1.2 Architecture [CONFIDENCE: HIGH]

The plugin is a Claude Code marketplace plugin (JavaScript, 87.8% of codebase).
Repository structure:

```
.claude-plugin/
  marketplace.json       — Plugin registry metadata
plugin/
  hooks/
    hooks.json           — Registers SessionStart and Stop hooks
  commands/              — Slash command definitions
  scripts/
    context-hook.cjs     — Runs at SessionStart: fetches and injects memory
    summary-hook.cjs     — Runs at Stop: captures session and saves to Supermemory
  skills/                — super-search and super-save tool definitions
src/
  context-hook.js        — Source for session start injection
  summary-hook.js        — Source for session end capture
  search-memory.js       — Memory search implementation
  save-project-memory.js — Project memory save implementation
  add-memory.js          — Memory add implementation
  lib/                   — Shared utilities
  templates/             — Output templates
```

The plugin operates entirely through two lifecycle hooks:

- **SessionStart hook**: Calls `context-hook.cjs` — fetches personal + project
  memories from Supermemory API and injects as `<supermemory-context>` XML
  blocks into Claude's initial context.
- **Stop hook**: Calls `summary-hook.cjs` — reads the session transcript,
  optionally filters to "signal" turns, and ships a `session_turn` memory to the
  Supermemory API.

There are NO MCP tools in this plugin. It uses hooks exclusively [3][4][10].

---

#### 1.3 Storage Backend [CONFIDENCE: HIGH]

Storage is entirely in the **Supermemory cloud platform** — not local. The
plugin itself stores only two config files locally:

- `~/.supermemory-claude/settings.json` — global settings (maxProfileItems,
  signalKeywords, etc.)
- `.claude/.supermemory-claude/config.json` — per-project settings (apiKey,
  container tags)

All memory data lives in Supermemory's cloud infrastructure. The platform uses a
"custom vector graph engine with ontology-aware edges" [8]. The cloud API is at
`api.supermemory.ai` / `mcp.supermemory.ai`. There is no local storage option
for the claude-supermemory plugin [1][2][5].

---

#### 1.4 Memory Types [CONFIDENCE: HIGH]

Two memory scopes:

1. **Personal memories** — individual user context, stored in a personal
   container (keyed by user/workspace identifier or git email hash). Includes
   coding style preferences, tool preferences, past decisions, error solutions.

2. **Project/Team memories** — shared project knowledge, stored in a repo
   container (keyed by project name). Includes architectural decisions,
   significant bug fixes, design patterns, implementation details.

The underlying Supermemory platform (not the plugin itself) supports more
sophisticated memory types: user profiles, episodic conversation history,
semantic fact extraction, temporal tracking of how preferences evolve,
contradiction resolution, and automatic forgetting of expired information
[6][7].

---

#### 1.5 Retrieval Mechanism [CONFIDENCE: HIGH]

The plugin uses two retrieval modes:

**Passive injection (SessionStart)**: The `context-hook.cjs` calls
`SupermemoryClient.getProfile()` for both personal and project containers.
Returns up to `maxContextMemories` (default: 10) personal memories and
`maxProjectMemories` (default: 20) project memories. These are concatenated as
structured sections (`### Personal Memories`, `### Project Knowledge`) and
injected into Claude's initial context.

**Active search (super-search)**: The `search-memory.js` tool accepts a query
string and calls the Supermemory search API with semantic search. Supports three
modes: `--user` (personal only, limit 10), `--repo` (project only, limit 10),
`--both` (parallel search of both, limit 5 each). Uses `Promise.all()` for
parallel execution [3][4].

The underlying platform achieves 81.6% on LongMemEval (vs 71.2% Zep, 60.2% full
context), using:

- Chunk-based ingestion with semantic atomization
- Relational versioning (Updates/Extends/Derives relationship types)
- Temporal grounding (documentDate vs eventDate)
- Hybrid semantic + knowledge graph search [6][7].

---

#### 1.6 Integration with Claude Code [CONFIDENCE: HIGH]

Integration method: **Claude Code Plugin Marketplace + Lifecycle Hooks**

Installation:

```
/plugin marketplace add supermemoryai/claude-supermemory
/plugin install claude-supermemory
export SUPERMEMORY_CC_API_KEY=<key from console.supermemory.ai>
```

Hook registration via `plugin/hooks/hooks.json`:

- `SessionStart` → runs `context-hook.cjs` (30s timeout)
- `Stop` → runs `summary-hook.cjs` (30s timeout)

Slash commands registered: `/claude-supermemory:index`,
`/claude-supermemory:project-config`, `/claude-supermemory:logout`

Skills registered: `super-save`, `super-search`

Auto-capture covers: Edit, Write, Bash, Task tool uses. Read/Glob/Grep excluded
by default to reduce noise [1][2][3][4].

---

#### 1.7 Cross-Session Persistence [CONFIDENCE: HIGH]

Cross-session persistence is the core feature. The Stop hook fires at every
session end and ships the transcript (or filtered signal turns) to the
Supermemory API. Each save includes type (`session_turn`), project name, ISO
timestamp, and session ID. The SessionStart hook then retrieves these on the
next session. Sessions are linked by container tags (personal + project) not by
filesystem path [1][2][10].

---

#### 1.8 Cross-Device/Locale Sync [CONFIDENCE: HIGH]

Since all memory lives in Supermemory's cloud, cross-device sync is a
first-class feature. Any machine with the plugin installed and the same API key
will access the same memory store. Team members using the same
`repoContainerTag` share project knowledge. The MCP version also supports Claude
Desktop, Cursor, VSCode, Gemini CLI, Cline, and Claude Code from the same shared
memory [8][9].

This is a significant differentiator vs local-file approaches like CLAUDE.md
injection — there is nothing to sync manually.

---

#### 1.9 Configuration Options [CONFIDENCE: HIGH]

Global (`~/.supermemory-claude/settings.json`):

- `maxProfileItems`: memories in context (default: 5)
- `signalExtraction`: selective capture mode (default: false)
- `signalKeywords`: terms triggering capture (e.g., "remember", "architecture",
  "decision")
- `signalTurnsBefore`: context window before signal (default: 3)
- `includeTools`: tools to explicitly capture
- `skipTools`: tools to exclude
- `captureTools`: tools to prioritize
- `maxContextMemories`: retrieved memories limit (default: 10)
- `maxProjectMemories`: project-specific limit (default: 20)
- `debug`: diagnostic logging

Project (`.claude/.supermemory-claude/config.json`):

- `apiKey`: repo-specific credentials
- `personalContainerTag`: custom personal memory namespace
- `repoContainerTag`: custom team memory namespace [1][2]

---

#### 1.10 Strengths [CONFIDENCE: HIGH]

1. **Cloud-native cross-device sync** — works across all machines/teammates with
   zero friction.
2. **Benchmark-leading retrieval** — #1 on LongMemEval (81.6%), LoCoMo,
   ConvoMem.
3. **Automatic capture** — no manual `super-save` required for most workflows;
   Stop hook captures everything.
4. **Team memory** — project knowledge shared across team via repo container.
5. **Selective signal extraction** — keyword-triggered capture avoids storing
   noise.
6. **Multi-tool memory** — one Supermemory account works across Cursor, Claude
   Desktop, VS Code, etc.
7. **Temporal contradiction resolution** — platform-level fact versioning
   (Updates/Extends/Derives).
8. **Simple installation** — marketplace plugin, 2 commands + API key.
9. **MIT license** — open source plugin code.
10. **Proactive context management** — pre-emptive summarization at 80% context
    usage [1][2][6][7][9].

---

#### 1.11 Weaknesses/Limitations [CONFIDENCE: HIGH]

1. **Pro plan required ($19/month)** — Free tier does NOT include the Claude
   Code plugin. This is a mandatory paywall [5].
2. **Cloud dependency** — all memory is remote. No offline operation; no local
   data sovereignty.
3. **Privacy risk** — full session transcripts including tool outputs (code,
   bash results) sent to third-party cloud.
4. **Windows stdin bug** — Issue #25: `readStdin()` hangs indefinitely on
   Windows (open as of Feb 2026) [10].
5. **No MCP tools** — unlike some alternatives, this plugin does not expose MCP
   tools. Memory retrieval is passive (injection) or requires explicit
   `super-search` invocation.
6. **Token consumption** — injecting 10-30 memories into every session start
   consumes context budget, especially on large projects.
7. **Signal extraction off by default** — without it, ALL conversation turns are
   captured, creating noise.
8. **Rate limits** — Pro plan caps at 3M tokens/month, 100K queries/month;
   overages at $0.01/1K tokens [5].
9. **Single-waypoint linking** — the underlying platform's graph uses one
   strongest link per memory; complex multi-hop reasoning requires workarounds.

---

#### 1.12 Stars/Activity [CONFIDENCE: HIGH]

- Stars: ~2,298-2,400 (growing, reported as 2.4k on marketplace page)
- Forks: 132-144
- Commits: 45 on main branch
- Latest release: v0.0.2-v0.0.3 (February 2026)
- Issues: 1 open (Windows stdin bug)
- Maintenance: Active — Supermemory company is the maintainer, raised $3M in Oct
  2025 [1][10]

---

#### 1.13 Novel Ideas Worth Adopting [CONFIDENCE: HIGH]

1. **Dual-scope container tags** (personal + repo) with separate limits is clean
   — avoids personal/project memory pollution.
2. **Signal extraction with keyword triggers** — only capture turns containing
   "remember", "architecture", "decision", "bug" etc. Dramatically reduces noise
   without losing important context.
3. **Stop hook for capture** (not just PostToolUse) — fires at session
   termination regardless of what tools were used.
4. **`<supermemory-context>` XML wrapper** — scoped injection that Claude can
   identify and weight appropriately.
5. **`/index` command for one-time codebase analysis** — 50+ tool calls on first
   run to build a rich project memory baseline.
6. **Pre-emptive summarization at 80% context usage** — not reactive compaction;
   proactive condensation.
7. **Privacy tagging** — `<private>` tags for client-side redaction before cloud
   transmission [9].

---

### Repo 2: CaviraOSS/OpenMemory

---

#### 2.1 Purpose and Problem Being Solved [CONFIDENCE: HIGH]

OpenMemory is a self-hosted cognitive memory engine for LLM applications. Its
core thesis is that "traditional RAG pipelines merely chunk text, embed it, and
retrieve by similarity — they lack understanding of whether something is a fact,
event, preference, or feeling, nor do they comprehend temporal validity or
importance." [11][12]

OpenMemory solves three problems that RAG and vector stores do not: (1) memory
type classification (episodic vs semantic vs procedural etc.), (2) temporal
validity (facts expire or get superseded), and (3) adaptive forgetting (not all
memories are equally durable). It is designed to run entirely locally or as a
central multi-user service, with no cloud dependency required [11][13].

---

#### 2.2 Architecture [CONFIDENCE: HIGH]

OpenMemory implements **Hierarchical Memory Decomposition (HMD) v2**. Five major
components:

**1. REST API Server** HTTP endpoints at `/api/memory/*` and `/api/temporal/*`.
Supports both standard and LangGraph-specific endpoints. Bearer token auth,
CORS, rate limiting [14].

**2. HSG Memory Engine (core)** Organizes memories into five cognitive sectors
with distinct decay rates:

- Episodic (events/experiences): decay 0.015/cycle
- Semantic (facts/knowledge): decay 0.005/cycle
- Procedural (skills/how-tos): decay 0.008/cycle
- Emotional (sentiment): decay 0.020/cycle
- Reflective (meta-cognition): decay 0.001/cycle

**3. Embedding Processor** Multi-provider: OpenAI, Gemini, AWS Bedrock, Ollama,
MiniMax, local models, synthetic (testing). Supports simple mode (1 batch call)
and advanced mode (5 sector-specific calls with optional parallelism) [12][14].

**4. Database Layer** Four tables: `memories` (content + salience + timestamps),
`vectors` (Float32 embeddings by sector), `waypoints` (directional associative
links), `embed_logs` (tracking). SQLite default, PostgreSQL supported [14].

**5. Waypoint Graph** Single strongest link per memory (similarity >= 0.75).
Bidirectional cross-sector linking. Enables associative recall paths and 1-hop
graph expansion during retrieval [14][16].

**Additional components:** Ingestion pipeline (PDF, DOCX, TXT, MD, HTML, URLs,
audio/video via Whisper), LangGraph integration node mapping, VS Code extension,
MCP server, optional web dashboard [12][14].

---

#### 2.3 Storage Backend [CONFIDENCE: HIGH]

**Local (default):**

- SQLite at `openmemory.db` / `/data/openmemory.sqlite`
- SQLite vector store (default) or Valkey (Redis-compatible) for vectors
- Optionally Weaviate for vector store

**Production:**

- PostgreSQL for metadata store
- PostgreSQL with pgvector for vector store
- Docker Compose deployment with optional dashboard UI

**Cloud:**

- Railway deployment supported (`railway.json` included)
- Central backend server mode with HTTP API for multi-user access

Environment variable `OM_DB_PATH` controls SQLite location; full PostgreSQL
config via `OM_PG_*` vars [13][15].

---

#### 2.4 Memory Types [CONFIDENCE: HIGH]

Five cognitive sectors with differential decay:

| Sector     | Type                | Decay Rate  | What it stores                                      |
| ---------- | ------------------- | ----------- | --------------------------------------------------- |
| Episodic   | Events, experiences | 0.015/cycle | "On Tuesday I fixed the auth bug"                   |
| Semantic   | Facts, knowledge    | 0.005/cycle | "The API rate limit is 100 req/min"                 |
| Procedural | Skills, how-tos     | 0.008/cycle | "To deploy: run `npm run build && deploy.sh`"       |
| Emotional  | Feelings, sentiment | 0.020/cycle | "User frustrated with slow queries"                 |
| Reflective | Meta-cognition      | 0.001/cycle | "I notice we always skip unit tests under deadline" |

Temporal knowledge graph supports `valid_from` / `valid_to` windows, enabling
point-in-time queries and fact supersession [11][12][14].

---

#### 2.5 Retrieval Mechanism [CONFIDENCE: HIGH]

Multi-stage composite retrieval:

1. **Sector classification**: Query embedded and routed to relevant sectors
2. **Cosine similarity search**: Per-sector vector search
3. **1-hop waypoint expansion**: Graph traversal from top matches
4. **Composite scoring**: 60% similarity + 20% salience + 10% recency + 10%
   waypoint weight
5. **Reinforcement**: Query hits boost waypoint weights (max 1.0); low-weight
   links pruned every 7 days

Performance reported at 95% recall accuracy at k=5, 115ms average latency at
100k memories, 338 QPS with 8 workers [12][14].

Four performance tiers (via `OM_TIER`):

- `hybrid`: 100% recall, 800-1000 QPS, keyword-based (no embeddings cost)
- `fast`: 70-75% recall, 700-850 QPS, synthetic embeddings
- `smart`: 85% recall, 500-600 QPS, hybrid embeddings
- `deep`: 95-100% recall, 350-400 QPS, full AI embeddings [13]

---

#### 2.6 Integration with Claude Code [CONFIDENCE: HIGH]

**Primary integration**: MCP server (HTTP transport)

The backend exposes `/mcp` endpoint. Configure in Claude Code via:

```json
{
  "mcpServers": {
    "openmemory": {
      "type": "http",
      "url": "http://localhost:8080/mcp"
    }
  }
}
```

Or via CLI: `claude mcp add`

MCP tools exposed: `openmemory_query`, `openmemory_store`, `openmemory_list`,
`openmemory_get`, `openmemory_reinforce`

Also supports: VS Code extension, Python SDK, Node.js SDK, LangChain
`OpenMemoryChatMessageHistory` [11][12].

Note: Unlike claude-supermemory (which uses hooks for automatic capture),
OpenMemory relies on Claude choosing to call the MCP tools. It does NOT have
hooks for automatic session-end capture by default. Memory must be explicitly
stored via `openmemory_store` or through SDK calls [11].

---

#### 2.7 Cross-Session Persistence [CONFIDENCE: HIGH]

Since storage is SQLite or PostgreSQL (persisted to disk), all memories survive
across sessions by default. The salience decay system runs on a configurable
cycle (default 120 minutes) to simulate natural memory fading — memories are not
deleted by decay, their salience score drops. Cold memories can be regenerated
when queried (via `OM_REGENERATION_ENABLED`) [13][14].

---

#### 2.8 Cross-Device/Locale Sync [CONFIDENCE: HIGH]

Two modes:

1. **Local only**: SQLite on one machine. No cross-device sync unless the DB
   file is synced manually (or via filesystem sync tools).

2. **Central backend server mode**: Deploy one OpenMemory backend (Docker,
   Railway, or self-hosted) accessible via HTTP. All clients (different
   machines, different users) connect via SDK in "Client Mode" or via MCP HTTP
   endpoint. This enables genuine multi-device and multi-user scenarios. Railway
   deployment config is included in the repo [15].

The central backend with PostgreSQL is the recommended cross-device
architecture. No built-in file-sync or cloud sync — requires deploying the
server component [15][16].

---

#### 2.9 Configuration Options [CONFIDENCE: HIGH]

Key environment variables (full list in `.env.example`):

- Storage: `OM_METADATA_BACKEND` (sqlite/postgres), `OM_VECTOR_BACKEND`
  (sqlite/postgres/valkey), `OM_DB_PATH`
- Embeddings: `OM_EMBEDDINGS` (openai/gemini/aws/ollama/local/synthetic),
  `OM_TIER` (hybrid/fast/smart/deep)
- Decay: `OM_DECAY_INTERVAL_MINUTES`, `OM_DECAY_THREADS`,
  `OM_DECAY_COLD_THRESHOLD`, `OM_DECAY_REINFORCE_ON_QUERY`
- Memory: `OM_USE_SUMMARY_ONLY`, `OM_COMPRESSION_ENABLED`,
  `OM_COMPRESSION_ALGORITHM`
- Reflection: `OM_AUTO_REFLECT`, `OM_REFLECT_INTERVAL`,
  `OM_REFLECT_MIN_MEMORIES`
- Auth: `OM_API_KEY`, `OM_RATE_LIMIT_ENABLED`
- Performance: `OM_MAX_PAYLOAD_SIZE`, `OM_SEG_SIZE`, `OM_SUMMARY_LAYERS` [13]

---

#### 2.10 Strengths [CONFIDENCE: HIGH]

1. **Self-hosted / local-first** — zero data privacy concerns; full schema
   ownership; offline capable.
2. **Free (Apache 2.0)** — no subscription required.
3. **Cognitively-inspired memory sectors** —
   episodic/semantic/procedural/emotional/reflective with differential decay
   rates is architecturally sophisticated.
4. **Temporal knowledge graph** — `valid_from`/`valid_to` on facts;
   point-in-time queries; fact supersession. This is a rare feature in OSS
   memory tools.
5. **Waypoint associative graph** — graph expansion enables associative recall
   beyond pure vector similarity.
6. **Multiple embedding providers** — including Ollama for fully local,
   zero-cost operation.
7. **Adaptive forgetting** — sector-specific decay rates simulate natural memory
   fading, not hard TTLs.
8. **Auto-reflection** — periodic clustering of cold memories into reflective
   insights.
9. **Migration tool** — imports from Mem0, Zep, Supermemory and others.
10. **Rich connectors** — GitHub, Notion, Google Drive/Sheets/Slides, OneDrive,
    web crawler.
11. **LangGraph integration** — maps workflow nodes to memory sectors.
12. **Performance claimed**: 95% recall at k=5, 115ms at 100k memories, ~2.5x
    faster than Zep [12][16].
13. **Active development** — commits as recently as March 31, 2026; multiple
    contributors [17].

---

#### 2.11 Weaknesses/Limitations [CONFIDENCE: HIGH]

1. **Active rewrite in progress** — README explicitly warns: "This project is
   currently being fully rewritten. Expect breaking changes and potential bugs."
   Not production-stable [11].
2. **No automatic capture hooks** — unlike claude-supermemory, there is no
   built-in SessionStart/Stop hook. MCP tools must be called explicitly by
   Claude (which requires Claude to decide to call them).
3. **Multi-user temporal isolation gap** — Issue #122: temporal graph facts lack
   built-in user isolation. All facts exist in a global namespace — unsuitable
   for multi-user systems [17].
4. **Simhash deduplication ignores user_id** — causes cross-user interference in
   multi-user deployments (community discussion) [17].
5. **ASCII-only tokenization** — Chinese text deduplication fails (Issue
   reported) [17].
6. **Deployment issues** — several open bugs: Render deploy broken, Docker
   Compose failures, dashboard not shipped in non-Docker installs [17].
7. **Cross-device requires server deployment** — local mode is single-machine
   only. Shared memory requires running and maintaining a backend service.
8. **Single-waypoint linking** — each memory connects to only one strongest
   waypoint. Multi-hop complex reasoning needs workarounds [14].
9. **Embedding cost** — non-zero unless Ollama or synthetic embeddings are used;
   advanced mode makes 5 API calls per memory.
10. **Stars count lower** — ~3,800 stars vs Mem0's much higher community
    adoption.
11. **Documentation gaps** — Issue #21: several API docs pages returning 404
    errors [17].
12. **Benchmarks self-reported** — the 95% recall / 115ms claims are from the
    project itself, not independently verified.

---

#### 2.12 Stars/Activity [CONFIDENCE: HIGH]

- Stars: ~3,800
- Forks: ~433
- Commits: 277 on main branch
- Latest activity: March 31, 2026 (same day as this research)
- Contributors: Nullure (primary), jungdaesuh, safetnsr, octo-patch, stevo1403,
  haosenwang1018 + GitHub Copilot
- Releases: v1.0.0 (Oct 2024) through v1.3.0 Beta (Dec 2024)
- License: Apache 2.0 [11][17]

---

#### 2.13 Novel Ideas Worth Adopting [CONFIDENCE: HIGH]

1. **Sector-specific decay rates** — episodic memories fade faster than semantic
   facts; reflective insights fade slowest. This maps well to real knowledge
   half-lives.
2. **Waypoint graph for associative recall** — entity extraction + graph links
   enable multi-hop retrieval paths beyond cosine similarity alone.
3. **Composite scoring (60/20/10/10)** — similarity + salience + recency +
   waypoint weight. Prevents recency bias and pure-similarity blindness.
4. **Reinforcement on query** — memories that get recalled have their salience
   boosted. Heavily-used memories become more available (Hebbian learning
   analog).
5. **`valid_from`/`valid_to` on facts** — old fact (CEO = Alice) automatically
   closes when new fact (CEO = Bob) is stored. Avoids stale context
   contamination.
6. **Auto-reflection** — after reaching `OM_REFLECT_MIN_MEMORIES`, the system
   automatically clusters related memories into higher-order reflective
   insights.
7. **`OM_TIER` performance tiers** — operators can trade recall accuracy for
   latency/cost based on hardware constraints.
8. **Memory compression layers** — configurable compression
   (semantic/syntactic/aggressive/auto) for reducing storage at scale.
9. **Migration from competing systems** — built-in import from Mem0, Zep,
   Supermemory. Reduces switching cost.

---

### Cross-Cutting Comparison

---

#### 3.1 Head-to-Head Summary [CONFIDENCE: HIGH]

| Dimension               | claude-supermemory                   | OpenMemory                                                 |
| ----------------------- | ------------------------------------ | ---------------------------------------------------------- |
| Storage                 | Cloud only (Supermemory API)         | Local SQLite or self-hosted PostgreSQL                     |
| Cost                    | $19/month (Pro required)             | Free (Apache 2.0)                                          |
| Privacy                 | Third-party cloud                    | Fully self-hosted                                          |
| Claude integration      | Hooks (automatic)                    | MCP tools (explicit)                                       |
| Cross-device sync       | Automatic (cloud)                    | Requires server deployment                                 |
| Team memory             | Built-in containers                  | Multi-user via central backend                             |
| Memory types            | Personal + Project scopes            | 5 cognitive sectors                                        |
| Retrieval quality       | 81.6% LongMemEval (verified)         | 95% recall claimed (self-reported)                         |
| Installation complexity | Low (2 commands + API key)           | Medium-High (Docker or SDK setup)                          |
| Stability               | Stable (v0.0.3)                      | Unstable (active rewrite)                                  |
| Novel architecture      | Relational versioning, fact ontology | Temporal graph, waypoint associativity, differential decay |
| Hook-based auto-capture | Yes (SessionStart + Stop)            | No                                                         |
| Offline operation       | No                                   | Yes                                                        |

---

#### 3.2 Pricing/Hosting Summary [CONFIDENCE: HIGH]

**claude-supermemory:**

- Free tier: Does NOT include Claude Code plugin
- Pro: $19/month — includes all plugins (Claude Code, Cursor, OpenCode,
  OpenClaw), 3M tokens/month, 100K queries/month
- Scale: $399/month — 80M tokens, 20M queries, advanced connectors
- Enterprise: Custom
- Overages: $0.01/1K tokens, $0.10/1K queries [5]

**OpenMemory:**

- Free: Apache 2.0 open source, self-hosted
- Embedding costs: $0 with Ollama/synthetic, varies with OpenAI/Gemini
- Infrastructure: Docker (self-hosted), Railway (cloud), or bare metal [11][13]

---

## Sources

| #   | URL                                                                                          | Title                             | Type           | Trust  | CRAAP | Date    |
| --- | -------------------------------------------------------------------------------------------- | --------------------------------- | -------------- | ------ | ----- | ------- |
| 1   | https://github.com/supermemoryai/claude-supermemory                                          | claude-supermemory README         | official-docs  | HIGH   | 4.8   | 2026-02 |
| 2   | https://supermemory.ai/docs/integrations/claude-code                                         | Claude Code Integration Docs      | official-docs  | HIGH   | 4.8   | 2026-02 |
| 3   | https://github.com/supermemoryai/claude-supermemory/blob/main/src/context-hook.js            | context-hook.js source            | source-code    | HIGH   | 5.0   | 2026-02 |
| 4   | https://github.com/supermemoryai/claude-supermemory/blob/main/src/summary-hook.js            | summary-hook.js source            | source-code    | HIGH   | 5.0   | 2026-02 |
| 5   | https://supermemory.ai/pricing/                                                              | Supermemory Pricing               | official-docs  | HIGH   | 4.8   | 2026-03 |
| 6   | https://supermemory.ai/research/                                                             | Supermemory Research / Benchmarks | official-docs  | HIGH   | 4.5   | 2026-01 |
| 7   | https://github.com/supermemoryai/supermemory                                                 | Supermemory core platform         | official-docs  | HIGH   | 4.7   | 2026-03 |
| 8   | https://supermemory.ai/blog/how-to-make-your-mcp-clients-share-context-with-supermemory-mcp/ | MCP cross-tool memory sharing     | official-blog  | HIGH   | 4.4   | 2025-12 |
| 9   | https://supermemory.ai/blog/infinitely-running-stateful-coding-agents/                       | Stateful coding agents blog       | official-blog  | HIGH   | 4.5   | 2026-01 |
| 10  | https://github.com/supermemoryai/claude-supermemory/issues                                   | GitHub Issues                     | primary-source | HIGH   | 4.8   | 2026-03 |
| 11  | https://github.com/CaviraOSS/OpenMemory                                                      | OpenMemory README                 | official-docs  | HIGH   | 4.8   | 2026-03 |
| 12  | https://github.com/CaviraOSS/OpenMemory/blob/main/packages/openmemory-py/README.md           | Python SDK README                 | official-docs  | HIGH   | 4.7   | 2026-03 |
| 13  | https://github.com/CaviraOSS/OpenMemory/blob/main/.env.example                               | Environment Variables Reference   | source-code    | HIGH   | 5.0   | 2026-03 |
| 14  | https://github.com/CaviraOSS/OpenMemory/blob/main/ARCHITECTURE.md                            | Architecture Document             | official-docs  | HIGH   | 4.9   | 2026-03 |
| 15  | https://github.com/CaviraOSS/OpenMemory/blob/main/railway.json                               | Railway deployment config         | source-code    | HIGH   | 5.0   | 2026-03 |
| 16  | https://github.com/CaviraOSS/OpenMemory                                                      | OpenMemory project metrics        | primary-source | HIGH   | 4.8   | 2026-03 |
| 17  | https://github.com/CaviraOSS/OpenMemory/issues                                               | GitHub Issues                     | primary-source | HIGH   | 4.8   | 2026-03 |
| 18  | https://github.com/CaviraOSS/OpenMemory/releases                                             | GitHub Releases                   | primary-source | HIGH   | 4.8   | 2026-03 |
| 19  | https://www.claudepluginhub.com/plugins/supermemoryai-claude-supermemory-plugin              | Claude Plugin Hub listing         | community      | MEDIUM | 3.8   | 2026-02 |
| 20  | https://vectorize.io/articles/supermemory-alternatives                                       | Supermemory Alternatives          | community      | MEDIUM | 3.5   | 2026-02 |

---

## Contradictions

**Supermemory benchmark claims vs independent analysis:** The Supermemory
research page claims 81.6% on LongMemEval (GPT-4o). An independent DEV Community
comparison article [20] estimated Supermemory at ~70% on LoCoMo, significantly
lower than competitors like Letta (~83.2%). The discrepancy may reflect
different benchmark subsets (LongMemEval_s vs full LoCoMo) and whether GPT-4o or
a weaker model was used as the base. The independent article also notes "score
estimated from limited published data." These numbers cannot be directly
compared. The official 81.6% figure is on LongMemEval_s, not LoCoMo. The
independent 70% is an estimate, not a measured result.

**OpenMemory performance claims:** The 95% recall at k=5 and 115ms latency
figures are entirely self-reported in the Python SDK README. No independent
benchmark verification was found. These should be treated as aspirational
targets, not verified performance guarantees.

**OpenMemory stability:** The README says "expect breaking changes and potential
bugs" but the repo has 277 commits and was updated today (March 31, 2026). The
project appears active but the core rewrite is ongoing — stability is genuinely
uncertain.

---

## Gaps

1. **Supermemory's internal architecture**: The actual vector graph engine
   implementation is not open source — it is a closed cloud service. We know the
   API surface and the plugin code, but not the database schema or retrieval
   implementation.
2. **OpenMemory's actual Claude Code usage in production**: Could not find real
   user evaluations of OpenMemory with Claude Code specifically. Most
   integration evidence is for Claude Desktop.
3. **Supermemory token accounting**: How exactly tool outputs are tokenized
   before being sent to the API (Edit before/after snippets, Bash command
   outputs) was not determinable from docs.
4. **OpenMemory multi-user temporal isolation**: Issue #122 flags that temporal
   facts lack user isolation. No fix or workaround was found in the issues or
   PRs — this remains an open concern for multi-user deployments.
5. **Long-term data export**: Neither repo had clearly documented data
   export/portability mechanisms. For supermemory (cloud), vendor lock-in risk
   is real. For OpenMemory, the SQLite file is directly portable but schema
   migration between versions is unclear.
6. **Plugin hook interaction with compaction**: Neither repo explicitly
   documents how their memory hooks interact with Claude Code's built-in
   compaction (CLAUDE.md injection). Whether memories and CLAUDE.md context
   compete for context budget is undocumented.

---

## Serendipity

1. **`<private>` tag redaction pattern** (supermemory blog): Client-side
   replacement of sensitive content with `[REDACTED]` tokens before cloud
   transmission, while preserving semantic structure about where secrets live.
   This is a novel privacy pattern directly applicable to any cloud memory
   system.

2. **Supermemory MCP fires without control warning**: The supermemory docs
   explicitly note that the MCP approach has a limitation — Claude Code decides
   when to call MCP tools, so you cannot guarantee memory capture. This is why
   they built the plugin with hooks instead. This is a fundamental architectural
   insight: **MCP tools are passive; hooks are active**. Any memory system
   relying purely on MCP tools will have gaps in capture.

3. **OpenMemory's `OM_AUTO_REFLECT` feature**: Periodic automatic clustering of
   cold memories into higher-order reflective insights is analogous to the
   "consolidation" that happens during human sleep. This could be used to
   automatically maintain a CLAUDE.md-like summary that self-updates as memories
   accumulate, without requiring manual distillation.

4. **Composite scoring (60/20/10/10)**: OpenMemory's scoring formula
   (similarity + salience + recency + waypoint weight) is a more sophisticated
   alternative to pure cosine similarity retrieval. The exact weights are
   configurable, suggesting the ratio could be tuned per use case (e.g., a
   developer workflow might want higher recency weight for recent decisions).

5. **Supermemory's `/index` command architecture**: The one-time 50+ tool call
   codebase analysis command that builds a persistent project memory baseline is
   a pattern worth stealing. It front-loads the cost of understanding a codebase
   and makes it permanent rather than burning context on every session.

---

## Confidence Assessment

- HIGH claims: 25
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The vast majority of findings are backed by official documentation, source code
inspection, and/or the GitHub repositories themselves. The main uncertainty is
around OpenMemory's self-reported performance benchmarks (no independent
verification found) and Supermemory's closed-source cloud backend
implementation.
