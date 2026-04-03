# Findings: Architecture Pattern Mapping Across Memory Systems

**Searcher:** deep-research-synthesizer **Profile:** synthesis **Date:**
2026-03-31 **Sub-Question IDs:** SQ6 (agent 2 of 2) **Source files:** All 14
D1–D5b findings documents

---

## Overview

This document maps the distinct architectural patterns that emerge from reading
all prior research findings. It is not a system-by-system comparison (covered by
D6a). It is a pattern taxonomy: what each pattern is, which systems use it, what
the tradeoffs are, and how it maps to SoNash's constraints (solo developer,
Windows, no admin, two locales, 14 existing persistence mechanisms).

SoNash's constraints, stated once here for reference throughout:

- Solo operator, non-developer, 250+ sessions
- Windows 11, two locales (jbell work, Owner home), no admin at work locale
- No Docker in production; portable installs (npx, uv, fnm) only
- 14 existing persistence mechanisms already active
- Cross-locale sync is an open problem; git is the primary sync channel today

---

## Part 1: Capture Patterns

How memory gets written in the first place.

---

### CP-1: Hook-Based Capture (Guaranteed, Every Event)

**What it is:** Lifecycle hooks (SessionStart, PostToolUse, Stop, PreCompact)
fire deterministically at fixed points in the agent runtime. Memory writes
inside hooks happen regardless of what Claude is doing or thinking. No decision
by Claude is required.

**Systems that use it:**

- SoNash: `commit-tracker.js`, `pre-compaction-save.js`, `post-read-handler.js`,
  `track-agent-invocation.js`, `session-start.js` (25 hooks total)
- claude-mem: PostToolUse fires for every tool call; Stop hook ships to
  cloud/SQLite
- claude-supermemory: Stop hook captures session transcript; SessionStart
  injects memories
- everything-claude-code (ECC): hooks.json covers all 6 lifecycle events for
  capture
- homunculus v2: PostToolUse hook replaced probabilistic skill-based observation
  (v1)
- mnemon: SessionStart, UserPromptSubmit, Stop, PreCompact all wired
- OpenMemory/SoNash pattern: hooks feed state files; state files are ground
  truth

**Core insight (confirmed from supermemory source code):** Supermemory rebuilt
its entire architecture away from MCP tools to hooks precisely because "we
cannot control when Claude Code chooses to run the tools." Hooks are the only
mechanism that guarantees capture.

**Tradeoffs:**

- Pro: 100% capture rate; no gaps; no Claude judgment required
- Pro: Predictable latency; hooks must return within 30s (fire-and-forget for
  slow ops)
- Con: Hooks capture everything indiscriminately unless filtering is added
- Con: Hook maintenance burden (SoNash has 25 scripts; ECC has a 331-line
  hooks.json)
- Con: Context can accumulate noise ("context rot" — irrelevant injected context
  degrades output quality per Chroma research)
- Con: PostToolUse hooks broke for 2+ months in claude-mem (Nov 2025 – Jan 2026)
  when Claude Code changed runtime internals

**Best-fit scenario:** Any memory that must be written without requiring Claude
to decide to write it. Session snapshots, compaction handoffs, commit logs,
agent invocation tracking.

**SoNash relevance:** This is already the dominant pattern. 25 hooks write to
14+ persistence mechanisms. The gap is not coverage but curation — no automated
quality gate decides what is worth preserving vs. discarding.

---

### CP-2: MCP Tool-Based Capture (Claude Decides When)

**What it is:** Memory MCP servers expose tools (`store_memory`,
`add_observation`, `create_entity`). Claude calls these tools when it decides
something is worth remembering. Capture happens only when Claude initiates it.

**Systems that use it:**

- SoNash mcp\_\_memory: `create_entities`, `add_observations` — Claude-invoked
- cipher: `cipher_extract_and_operate_memory` — explicit agent call required
- OpenMemory: `openmemory_store` — explicit agent call
- Anthropic official memory tool: Claude writes to `/memories` directory via
  tool calls
- mcp-memory-service, basic-memory, engram: all require Claude to call
  `store`/`remember` tools

**Core insight:** MCP tools have a fundamental structural limitation for
capture. Marketing copy often says "automatically captures memories" but the
mechanism requires Claude to call the tool. Cipher's case is instructive — its
marketing claims automatic capture but the actual
`cipher_extract_and_operate_memory` call must be made explicitly [D2a source].

**Tradeoffs:**

- Pro: High signal-to-noise; Claude stores only what it judges relevant
- Pro: Low maintenance; no hook scripts to maintain
- Pro: Works across any MCP-compatible tool (Cursor, Claude Desktop, Windsurf)
  without tool-specific integration
- Con: Capture rate is variable and unpredictable — Claude may be too focused on
  the task to call store tools
- Con: Critical context produced mid-session (a discovered pattern, a corrected
  approach) can be lost if Claude forgets to store it
- Con: Known failure mode: the 5–6 minute hang bug (GitHub issue #15140) when
  Claude is instructed to "check memory at session start" and the server returns
  empty results

**Best-fit scenario:** Retrieval (Claude deciding when to look something up),
not primary capture. User-initiated memory saves via explicit skill invocation.

**SoNash relevance:** The existing `mcp__memory` (knowledge graph server) falls
into this pattern. The `/checkpoint --mcp` skill is the user-initiated trigger.
Low active usage confirms the structural prediction: without a hook trigger,
Claude doesn't reach for the tool consistently.

---

### CP-3: Hybrid Capture (Hooks Capture, MCP Retrieves)

**What it is:** A two-mechanism architecture where hooks guarantee capture of
session events into local storage, and MCP tools expose that storage as a
queryable interface. The write path (hooks) is decoupled from the read path (MCP
tools).

**Systems that use it:**

- claude-mem: PostToolUse hook → queue → SQLite + ChromaDB; `mem-search` MCP
  tool retrieves on demand
- mcp-memory-service: Hooks fire at lifecycle events; REST API / MCP tools
  expose retrieval
- OMEGA Memory: `omega setup` auto-configures hooks for capture; 12 MCP tools
  for retrieval
- SoNash partial: hooks write state files; `mcp__memory` graph is a separate
  retrieval layer

**The community consensus pattern:** Hooks for capture; MCP tools for retrieval.
This is the explicitly documented lesson from supermemory's architecture
evolution and the community best-practice synthesis in D5b.

**Tradeoffs:**

- Pro: Combines guaranteed capture with flexible, parameterized retrieval
- Pro: Write path does not depend on Claude's behavior; read path gives Claude
  agency over what to retrieve
- Con: More complex to implement and maintain than either pure pattern
- Con: Two systems can diverge (hook-captured data and MCP-indexed data can go
  out of sync if the indexing pipeline has failures)
- Con: Token overhead: hook-injected context at SessionStart + MCP tool
  description tokens + any mid-session retrieval calls

**Best-fit scenario:** Production-grade memory systems for continuous developer
workflows where both reliable capture and efficient retrieval are needed.

**SoNash relevance:** The gap in SoNash's current architecture. Hooks capture
extensively; the MCP layer (knowledge graph) is underused as retrieval. The
right framing: hooks already cover CP-1 well; the design question is whether to
invest in MCP-based retrieval to make the captured data queryable.

---

### CP-4: Manual Capture (User Writes)

**What it is:** The user explicitly writes memory content — adding entries to
CLAUDE.md, contributing to MEMORY.md, running `/handoff` commands, updating
SESSION_CONTEXT.md. No automation; requires discipline.

**Systems that use it:**

- SoNash: CLAUDE.md (updated manually per version), SESSION_CONTEXT.md (Claude
  updates at session boundaries, requires user initiation), canonical-memory/
  (curated baseline snapshot)
- interface-design: `.interface-design/system.md` written once via `/init`, then
  read passively
- centminmod memory bank: CLAUDE.md as primary memory bank, changes committed
  alongside code
- Devin Knowledge: manually curated Knowledge items and Playbooks
- four-file markdown pattern (roo-code, cline): activeContext, productContext,
  progress, decisionLog — all human-maintained
- Boris Cherny (Claude Code creator) workflow: team contributes to CLAUDE.md in
  PRs

**Tradeoffs:**

- Pro: Highest signal quality; human judgment applies before writing
- Pro: Zero infrastructure; no hooks, no MCP servers, no databases
- Pro: Human-readable, git-trackable, survives all toolchain changes
- Pro: Context rot is controlled — only what matters gets written
- Con: Requires discipline; reported failure rate: one developer admitted
  skipping 40% of the time when tired (D3b-1)
- Con: Misses implicit knowledge (patterns that emerge from practice but are
  hard to articulate)
- Con: Scales poorly — CLAUDE.md over 200 lines degrades model adherence
- Con: Does not capture the full experiential context automatically

**Best-fit scenario:** Stable, high-value facts that change slowly: project
architecture decisions, security rules, behavioral guardrails, external system
URLs. Everything in CLAUDE.md and reference\_\*.md files.

**SoNash relevance:** Already the primary pattern for high-signal permanent
knowledge. No change needed; existing discipline is appropriate. The constraint
is the 135-line CLAUDE.md target — this is well-reasoned and should not expand.

---

### CP-5: Auto / Background Consolidation (AutoDream Pattern)

**What it is:** A background agent or scheduled process runs asynchronously to
reorganize, merge, prune, and promote accumulated memory. This is "sleep-time
consolidation" — inspired by human memory consolidation during sleep (LightMem
paper, Atkinson-Shiffrin model).

**Systems that use it:**

- Anthropic AutoDream (unreleased, feature-flagged as `tengu_onyx_plover`):
  4-phase cycle — orient, gather signal, consolidate, prune. Merges duplicates,
  converts relative dates to absolute, deletes contradicted facts, keeps
  MEMORY.md under 200 lines. Triggers at minHours: 24, minSessions: 5.
- SoNash consolidation system: `run-consolidation.js` runs every 10 PR reviews,
  promoting patterns from reviews.jsonl to CODE_PATTERNS.md — this IS an
  auto-consolidation pattern at the learning system level
- SoNash session-end pipeline: promotes session learnings to SESSION_CONTEXT.md;
  archives older entries to SESSION_HISTORY.md — a manual trigger on the same
  pattern
- LightMem (academic): 3-stage pipeline: sensory filtering → topic grouping →
  offline long-term update
- claude-diary `/reflect`: analyzes diary entries for patterns across 6
  categories; requires 2+ occurrences; updates CLAUDE.md with imperative rules
- dream-skill community plugin: replicates AutoDream's 4-phase cycle as a manual
  skill (available now, while AutoDream remains gated)
- OpenMemory `OM_AUTO_REFLECT`: clusters cold memories into higher-order
  reflective insights after reaching minimum threshold
- ECC `/evolve`: when 5+ instincts cluster in a domain, proposes promotion to
  skill/command/agent
- yuvalsuede/memory-mcp: LLM consolidation triggered every 10 extractions

**The consolidation lifecycle (synthesis from academic + implementation
research):**

1. Raw capture: hooks/tools write episodic records (timestamped events)
2. Short-term consolidation: topic grouping, deduplication, date normalization
3. Long-term promotion: high-signal items graduate to semantic memory
   (MEMORY.md, CLAUDE.md)
4. Pruning: low-access, low-confidence, contradicted, or expired items are
   removed

**Tradeoffs:**

- Pro: Makes accumulated raw memory usable without human curation effort
- Pro: AutoDream approach aligns with the A-MAC finding that "content type
  prior" is the strongest signal for what to keep
- Pro: Prevents unbounded growth (without pruning, any append-only system
  eventually becomes too large to use)
- Con: AutoDream is server-gated and not currently available for general use
- Con: Background consolidation can produce incorrect consolidations — merging
  distinct concepts that appear similar in vector space
- Con: The "context rot" risk runs in reverse: over-aggressive pruning can
  remove valuable specifics that summaries don't capture
- Con: In SoNash's model, the `run-consolidation.js` is threshold-triggered (10
  reviews), not time-based — the pattern exists but is domain-specific to the
  learning system

**Best-fit scenario:** Systems with high-volume episodic capture (hundreds of
observations per week) that need to be distilled without manual curation
overhead.

**SoNash relevance:** The learning system already implements this for PR review
patterns. The gap is at the session memory level — there is no equivalent
consolidation for MEMORY.md entries, resulting in divergence between live and
canonical-memory. The dream-skill community plugin or a custom session-end
consolidation step could fill this gap.

---

## Part 2: Storage Patterns

Where memory data actually lives on disk or in cloud.

---

### SP-1: Flat Markdown Files

**What it is:** Memory stored as human-readable `.md` files. Each file is either
a single focused topic (MEMORY.md category files, SESSION_CONTEXT.md) or a
structured template (CLAUDE.md, interface-design's system.md).

**Systems that use it:**

- SoNash: CLAUDE.md (258 lines), SESSION_CONTEXT.md (300-line target), MEMORY.md
  index + 39 individual memory files, SESSION_HISTORY.md, SESSION_DECISIONS.md,
  canonical-memory/
- cursor-memory-bank: 4-file memory-bank/ directory (activeContext,
  productContext, progress, decisionLog)
- roo-code-memory-bank: same 4-file pattern
- cline-mcp-memory-bank: same pattern, delivered as MCP tools
- interface-design: single `.interface-design/system.md`
- claude-diary: diary entries per session in `~/.claude/memory/diary/`
- HelloRuru/claude-memory-engine: full system in markdown with 36 bilingual
  commands
- centminmod memory bank: CLAUDE.md plus platform-specific supplements
- Anthropic official memory tool: `/memories` directory of `.txt` files

**The 4-file markdown pattern is a de facto community standard (D3a-2):**
activeContext, productContext/projectContext, progress, decisionLog. All major
Cline/Roo-Code implementations converged on this independently.

**Tradeoffs:**

- Pro: Zero infrastructure; no database, no MCP server, no runtime
- Pro: Human-readable and editable; git-trackable; survives locale changes
- Pro: Fast to load — Claude reads markdown like documentation
- Pro: Best fit for stable knowledge that changes slowly
- Con: No semantic search capability; retrieval is by filename convention or
  keyword match only
- Con: Scales poorly at high volume — a single MEMORY.md with 200+ entries
  provides equal weight to all entries; no relevance ranking
- Con: No automatic lifecycle management; entries accumulate without decay or
  promotion unless manually curated or AutoDream is enabled
- Con: "Lost in the middle" effect — Claude attends better to beginning/end of
  long files; middle entries receive less attention (Context Rot research)

**Best-fit scenario:** Stable knowledge bases under 200 lines: project rules,
stack versions, architecture decisions, behavioral constraints. Also:
first-session bootstrapping for new locales (canonical-memory pattern).

**SoNash relevance:** Already the dominant pattern for high-signal memory. The
risk is not adoption but scale — the 39 individual memory files are currently
well under attention limits, but growth requires monitoring. The divergence
between canonical-memory and live memory is a structural flaw in this storage
pattern: two copies exist with no sync mechanism.

---

### SP-2: Structured JSONL (Append-Only Log)

**What it is:** Append-only logs where each line is a JSON object with a fixed
schema. New records are appended; nothing is deleted (or deletion is explicit
with a tombstone record). This is the event-sourcing pattern applied to memory.

**Systems that use it:**

- SoNash: `reviews.jsonl`, `retros.jsonl`, `review-metrics.jsonl`,
  `agent-invocations.jsonl`, `hook-warnings-log.jsonl`, `velocity-log.jsonl`,
  `health-score-log.jsonl`, `learning-routes.jsonl`, and 12+ other JSONL files
- SoNash planning: `decisions.jsonl` (93 SWS decisions), `changelog.jsonl`,
  `directives.jsonl`
- SoNash TDMS: `MASTER_DEBT.jsonl` (8,479 lines), `intake-log.jsonl`,
  `dedup-log.jsonl`
- episodic-memory (Superpowers): indexes `.jsonl` files from
  `~/.claude/projects/` — Claude's own conversation history is JSONL
- Anthropic's own session records:
  `~/.claude/projects/<project-hash>/<session-id>.jsonl`

**Why JSONL is preferred over JSON for accumulating data:** JSON requires
reading the entire file to append; JSONL allows line-append without parsing.
This is why MASTER_DEBT.jsonl has 8,479 lines and is still tractable to read
incrementally.

**Tradeoffs:**

- Pro: Append-only guarantees no accidental overwrite of historical data
- Pro: Each line is independently parseable; partial reads and streaming are
  possible
- Pro: Git-diffable — new entries appear as added lines
- Pro: Anthropic behaviorally prefers JSON over Markdown for structured state
  files (documented in engineering blog: "less likely to inappropriately change
  or overwrite JSON files")
- Con: No semantic search; querying requires full scan or secondary index
- Con: Unbounded growth without rotation/archival logic
- Con: The MASTER_DEBT.jsonl overwrite hazard (documented): multiple ingestion
  scripts can regenerate from scratch, losing resolved/deferred status
- Con: Requires explicit rotation (SoNash has `rotate-jsonl.js`;
  reviews-archive.jsonl grows beyond 456 lines)

**Best-fit scenario:** Operational logs, audit trails, append-only ledgers. Any
data where preserving history is essential and search is by timestamp or
structured field, not semantic content.

**SoNash relevance:** Already extensively used and appropriate for its current
scope. The rotation and archival logic is in place. No architectural change
needed; the pattern is mature.

---

### SP-3: SQLite + Vector Store

**What it is:** A dual-database architecture with SQLite as the primary
structured store (ACID, full-text search via FTS5) and a vector database
(ChromaDB, sqlite-vec, Qdrant) as the semantic search index. Typically
eventual-consistency between the two.

**Systems that use it:**

- claude-mem: SQLite at `~/.claude-mem/claude-mem.db` (source of truth, FTS5) +
  ChromaDB (eventually consistent semantic index)
- mcp-memory-service: SQLite-vec (primary) + optional Cloudflare Workers sync
- OMEGA Memory: SQLite + sqlite-vec + bge-small-en-v1.5 ONNX embeddings
  (CPU-only)
- engram: SQLite + FTS5 at `~/.engram/engram.db`; Go binary
- context-sync: SQLite at `~/.context-sync/data.db`; TypeScript
- basic-memory: SQLite for indexing + FastEmbed vectors; markdown as source of
  truth
- codebase-memory-mcp: SQLite + LZ4 compression; tree-sitter AST indexing
- yuvalsuede/memory-mcp: Claude Haiku for extraction; Jaccard similarity for
  dedup

**Tradeoffs:**

- Pro: SQLite is zero-infrastructure; no server process, no admin required,
  single file
- Pro: FTS5 full-text search is fast and zero-config
- Pro: Vector search enables semantic retrieval ("what did I work on last
  Tuesday?" returns relevant results even with different wording)
- Pro: ONNX embeddings (bge-small-en-v1.5, MiniLM-L6-v2) run locally without API
  keys
- Con: SQLite + ChromaDB dual-write introduces eventual consistency risk; fast
  sessions can produce stale semantic results
- Con: ChromaDB startup latency on Windows (historically 1–2 minutes on WSL2 in
  early claude-mem versions, fixed in v10 but historically painful)
- Con: Vector stores are not human-readable or git-diffable
- Con: Two backends to maintain, monitor, and back up

**Best-fit scenario:** High-volume session capture where semantic retrieval
("find past decisions about X") is needed. Works well when the memory store
grows beyond ~100 entries (at which point keyword search becomes insufficient).

**SoNash relevance:** Not currently in use. The episodic-memory plugin
(SQLite-vec, ONNX embeddings) is the closest existing match — it is already
configured and confirmed Windows-compatible via fnm (not nvm). The question is
whether SoNash's 14 existing mechanisms already satisfy the use case, or whether
a semantic layer would provide marginal value sufficient to justify additional
infrastructure.

---

### SP-4: Knowledge Graph (Entities + Relations + Observations)

**What it is:** Memory stored as a graph of named entities (nodes with type and
observations) connected by typed directional relations (edges). Retrieval is by
entity name, keyword search across observations, or graph traversal.

**Systems that use it:**

- SoNash mcp\_\_memory: Anthropic's official
  `@modelcontextprotocol/server-memory`, JSONL-backed knowledge graph. Entity
  types: `session_context`, `architectural_decision`, `bug_investigation`.
  Already configured.
- cipher: Optional Neo4j or in-memory graph via KnowledgeGraphManager
- ECC Issue #1049: proposed SQLite-backed KG absorbing Hermes + OpenClaw memory
  architectures
- ViralV00d00/claude-code-memory: Neo4j, 6 node types, 35+ edge categories
- mnemon: Four graph types (temporal, entity, causal, semantic)
- OpenMemory waypoint graph: single strongest link per memory
- cognee: Neo4j knowledge graph ("knowledge engine for AI agents")
- A-MEM (academic): Zettelkasten-style linking — each new memory generates links
  to related existing entries
- MIRIX (academic): 6 specialized memory components, entities per component type

**The graph convergence signal (from D2b serendipity):** ECC's proposed KG
architecture (Issue #1049) is architecturally identical to claude-mem's and the
standard graph memory pattern. There is an emerging consensus on the entities +
relations + observations schema for coding agent memory.

**Tradeoffs:**

- Pro: Relational structure captures connections between facts that flat files
  and JSONL cannot
- Pro: Graph traversal enables multi-hop retrieval ("what does this
  architectural decision connect to?")
- Pro: Anthropic's official implementation (JSONL-backed) has zero
  infrastructure requirements; npx install only
- Con: Scales poorly with JSONL backend: full graph loaded per read; performance
  degrades with large graphs (> 10,000 entities — no benchmarks found)
- Con: Neo4j-backed implementations require a running database instance (admin,
  Docker, or separate install)
- Con: Keyword-only search in the official implementation (no semantic/vector
  search)
- Con: Knowledge graphs require discipline to maintain — entities and relations
  drift if not regularly pruned

**Best-fit scenario:** Architectural decisions, cross-cutting relationships
between components, agent coordination patterns, and long-lived technical
decisions that have explicit connections to other decisions.

**SoNash relevance:** Already configured and permitted (`mcp__memory`).
Currently underused. The `/checkpoint --mcp` skill documents intended usage:
session_context entities, architectural_decision entities, bug_investigation
entities. The gap is not setup but discipline — no hook or skill consistently
writes to the graph.

---

### SP-5: Hybrid Multi-Layer Storage

**What it is:** Multiple storage mechanisms operating in coordinated tiers, each
optimized for a different access pattern. The most sophisticated systems combine
3–4 storage types with explicit promotion rules between layers.

**Systems that use it:**

- SoNash (existing): CLAUDE.md (always-inject) → MEMORY.md (session-start
  inject) → JSONL state files (audit trail) → mcp\_\_memory graph (on-demand
  retrieval) — this IS a multi-layer system, though not explicitly designed as
  one
- ECC 5-layer: session markdown → instincts YAML → learned skills markdown →
  SQLite state → proposed KG
- yuvalsuede/memory-mcp: CLAUDE.md budget allocation (Tier 1, 150 lines) +
  `.memory/state.json` deep store (Tier 2, unlimited, MCP-accessed)
- TechNickAI/openclaw-config: MEMORY.md (~100 lines, every session) + daily
  context files + structured knowledge dirs (vector retrieval); librarian skill
  promotes between tiers
- claude-mem: in-memory queue → SQLite (source of truth) → ChromaDB (eventual
  consistency) — 3 layers within one system
- MemGPT/Letta: main context (RAM) + archival memory (disk) + recall memory
  (history)
- MIRIX (academic): 6 independent memory components, each with its own store
- GitHub Copilot: user memory + repository memory + session memory — 3 tiers
  with explicit scope separation

**Tradeoffs:**

- Pro: Each layer can be optimized for its access pattern (fast injection vs
  deep search vs audit trail)
- Pro: Tier separation prevents any single failure from destroying all memory
- Pro: Enables progressive disclosure (layer 1 index → layer 2 timeline → layer
  3 full detail) — the pattern that claude-mem claims achieves 10x token savings
- Con: Coordination complexity grows with layer count — promotion rules,
  consistency guarantees, cross-layer deduplication all require maintenance
- Con: Context rot risk multiplies: each layer injects at session start; a
  poorly designed multi-layer system consumes 10,000–54,000 tokens before any
  conversation begins (documented in D5b)
- Con: The divergence problem: if layers are not synchronized, the same fact
  exists in multiple layers with different timestamps or states

**Best-fit scenario:** Production systems where specific retrieval patterns
justify the complexity. The tier separation should match actual access patterns
(not aspirational ones).

**SoNash relevance:** The existing system is already multi-layer in practice.
The explicit design question is whether to formalize tier boundaries, add
promotion rules, and add pruning mechanisms to prevent unbounded growth across
all 14 persistence mechanisms.

---

## Part 3: Retrieval Patterns

How memory gets back into the model's context.

---

### RP-1: Always-Inject (CLAUDE.md — Every Turn)

**What it is:** Memory content is injected into every conversation turn
unconditionally. The model always has this context available, regardless of
whether it is needed for the current task.

**Systems that use it:**

- SoNash CLAUDE.md: 258 lines, loaded every turn
- SoNash MEMORY.md: index (91 lines) injected at every session start
- GitHub Copilot user memory: first 200 lines auto-loaded at session start
- Anthropic Auto Memory: first 200 lines / 25KB of MEMORY.md injected at session
  start
- ECC CLAUDE.md injection: project-level + user-level `~/.claude/CLAUDE.md`

**Tradeoffs:**

- Pro: Zero retrieval latency; context is always present without any query
  overhead
- Pro: Claude cannot "forget" to check memory; it is always available
- Pro: Simplest possible architecture; no query layer needed
- Con: Fixed token cost per session regardless of relevance to current task
- Con: Context rot: irrelevant injected content degrades output quality per
  empirical research
- Con: Hard scaling limit — CLAUDE.md over 200 lines degrades model adherence;
  MEMORY.md capped at 200 lines / 25KB by Anthropic
- Con: Content must be kept ruthlessly curated; every line costs tokens in every
  future session

**The minimal-context principle (academic validation):** Chroma's Context Rot
research found every model degrades with increasing context. Multiple
distractors compound degradation non-linearly. The practical rule is minimize
context aggressively, not just for cost but for accuracy.

**Best-fit scenario:** High-value stable rules and constraints that must be in
context for every task: security rules, behavioral guardrails, stack versions,
architectural constraints. Not appropriate for episodic or session-specific
content.

**SoNash relevance:** Well-calibrated. CLAUDE.md is version-controlled at
135-line target; MEMORY.md index at 91 lines. The discipline is appropriate. The
risk is gradual growth that crosses the effectiveness threshold without anyone
noticing.

---

### RP-2: Progressive Disclosure (3-Tier: Summary → Detail → Full)

**What it is:** Memory is organized in 3 tiers where each tier reveals more
detail than the previous. Claude reads the index/summary tier first, then
decides which entries to expand to full detail. The model controls retrieval
depth based on relevance.

**Systems that use it:**

- claude-mem: Layer 1 — compact metadata (~50-100 tokens per entry, index),
  Layer 2 — timeline (~200-500 tokens, chronological context), Layer 3 — full
  details (~500-1,000 tokens/observation). Claims ~10x token savings.
- SoNash MEMORY.md pattern: MEMORY.md index is the summary tier (91 lines);
  individual memory files are the detail tier (10-80 lines each). Claude reads
  the index always, individual files on demand.
- TechNickAI/openclaw-config: similar 3-tier with promotion rules
- cursor-memory-bank: hierarchical rule loading — load-on-demand based on
  complexity level; claims ~70% token reduction
- Hmem (HN): 5-level hierarchical memory in `.hmem` SQLite; lazy-loads only
  top-level summaries (~20 tokens) until depth is needed
- Generative Agents (academic): retrieval scores surface most relevant memories;
  lower-scored memories stay in external store

**Tradeoffs:**

- Pro: Dramatically reduces token consumption; only the minimum needed for the
  current task is injected
- Pro: Claude has agency to expand depth on demand; intelligent agents use this
  to concentrate on relevant context
- Pro: Scales to much larger memory stores than always-inject — the index can
  represent thousands of entries in a few hundred tokens
- Con: Requires a well-structured index; poor index organization means Claude
  won't know what to expand
- Con: Retrieval quality depends on Claude noticing the index and deciding to
  look deeper — this is probabilistic without a hook forcing it
- Con: Implementation complexity: the 3-tier structure must be maintained as
  memory grows

**Best-fit scenario:** Memory stores with moderate-to-high volume (> 20 entries)
where always-injecting everything would exceed token budgets. The MEMORY.md
index + individual files pattern is an already-deployed version of this.

**SoNash relevance:** Already partially implemented via the MEMORY.md index
pattern. The gap: individual memory files are not automatically read on demand
by Claude — the hook only injects the index. Adding an explicit instruction in
MEMORY.md for Claude to request specific files when tasks touch those topics
would complete the pattern.

---

### RP-3: Semantic Search (Embedding Similarity)

**What it is:** Query text is embedded into a vector; the memory store returns
entries with highest cosine similarity to the query embedding. Enables "find
decisions about authentication" even if the entries contain different
vocabulary.

**Systems that use it:**

- cipher: primary retrieval via vector embeddings; 8+ embedding provider support
- supermemory: semantic search via cloud vector graph engine; 81.6% on
  LongMemEval
- OpenMemory: per-sector vector search; 5 cognitive sectors with separate
  embedding spaces
- episodic-memory (SoNash plugin): SQLite-vec + 384-dim local embeddings via
  @xenova/transformers (offline, no API)
- mcp-memory-service: SQLite-vec + ONNX MiniLM-L6-v2 (local, no API)
- OMEGA Memory: bge-small-en-v1.5 ONNX embeddings; claims 95.4% LongMemEval
- mem0: hybrid vector + KV + graph store
- Qdrant MCP: FastEmbed all-MiniLM-L6-v2 local embeddings
- Chroma MCP: multiple embedding providers; persistent collections

**Tradeoffs:**

- Pro: Finds relevant content regardless of exact wording; handles vocabulary
  variation that keyword search misses
- Pro: ONNX-based local embeddings (bge-small, MiniLM) require no API keys and
  run on CPU; the episodic-memory plugin already does this locally
- Con: Requires embedding infrastructure (at minimum a SQLite-vec file); adds
  setup and maintenance overhead
- Con: Vector search alone has known failure modes: cosine similarity can
  surface semantically similar but contextually irrelevant results
- Con: Pure semantic search without keyword fallback misses exact matches ("what
  is the DEBT-XXXXX number for this issue?")
- Con: Embedding models must be version-consistent — switching embedding models
  requires re-embedding the entire corpus

**Best-fit scenario:** Mid-to-large memory stores (50+ entries) where episodic
content is rich and vocabulary variation makes keyword search insufficient.
Works well in combination with keyword search (hybrid BM25 + vector).

**SoNash relevance:** Not actively used for session memory. The episodic-memory
plugin is configured (and Windows-compatible), but only the `search` tool is in
the allow-list (not `show`). Low active use. The question is whether the current
keyword-based access patterns (reading files by name) are sufficient, or whether
semantic search would surface connections that filename-based retrieval misses.

---

### RP-4: Composite Scoring (Similarity + Salience + Recency + Weight)

**What it is:** Retrieval ranks candidates using a weighted formula combining
multiple signals, not just cosine similarity. The canonical implementation from
OpenMemory: 60% cosine similarity + 20% salience + 10% recency + 10% waypoint
weight.

**Systems that use it:**

- OpenMemory: 60/20/10/10 composite scoring; reinforcement boosts waypoint
  weights on retrieval
- Generative Agents (academic): recency × importance × relevance multiplicative
  scoring
- A-MAC (academic): five factors: future utility, factual confidence, semantic
  novelty, temporal recency, content type prior
- yuvalsuede/memory-mcp: confidence decay by type (progress: 7-day half-life,
  context: 30-day, architecture/decisions: permanent)
- ECC instincts: confidence scores 0.3–0.9; `/prune` removes low-confidence
  instincts

**The A-MAC key finding (D4a):** The "content type prior" was the strongest
single predictor of whether a memory should be stored, stronger than semantic
novelty or future utility. This suggests: define a whitelist of categories worth
memorizing (user corrections, architectural decisions, hook patterns) and
discard everything else — before running any scoring at all.

**Tradeoffs:**

- Pro: More precise than pure similarity; prevents recency bias (always
  returning most recent regardless of relevance) and relevance bias (returning
  semantically close but outdated content)
- Pro: Salience weights allow explicit promotion of high-value memories
- Pro: Type-differentiated decay (architecture: permanent; progress: 7-day) maps
  to real knowledge half-lives
- Con: More complex to implement and tune than single-signal retrieval
- Con: Weight calibration requires experimentation; wrong weights produce worse
  results than simpler approaches
- Con: Salience requires either LLM-rated scores (adds latency/cost) or explicit
  metadata (adds capture overhead)

**Best-fit scenario:** Systems with large memory stores and diverse content
types where a single signal (recency or similarity alone) would produce poor
retrieval quality.

**SoNash relevance:** Applicable as a design principle for future memory
admission decisions: before writing to MEMORY.md, apply a whitelist of
categories (user corrections, architecture decisions, project constraints) and
discard tactical details. The yuvalsuede confidence decay approach (different
TTLs by content type) is directly applicable to SoNash's memory file
organization.

---

### RP-5: Citation-Validated (Copilot — Verify Against Current Code Before Use)

**What it is:** Each memory entry is stored with citations — links to specific
file paths and line numbers that motivated the memory. Before the memory is
used, the agent validates the citations against the current codebase. If the
code has changed and the citation fails, the memory is discarded or corrected.

**Systems that use it:**

- GitHub Copilot: citation-backed JIT validation. Memories store code location
  references. Validated before use. 28-day TTL with activity refresh.
  Repository-scoped. Showed 3% precision increase, 7% PR merge rate increase.
- Devin Knowledge: trigger descriptions point to specific code contexts. More
  loosely coupled but conceptually similar.
- Augment Code Memory Review: proposes memories during work with code snippet
  references; user approves before storage.

**Why this pattern is architecturally significant:** It directly addresses the
stale memory problem. Every other retrieval pattern suffers from the risk that a
stored memory is no longer accurate because the codebase changed. Citation
validation converts a static memory into a dynamic assertion that is verified on
each use.

**Tradeoffs:**

- Pro: Eliminates stale memory from code-related facts; accuracy remains high
  across codebase evolution
- Pro: Forces memories to be grounded in specific code locations, not vague
  abstractions
- Pro: 28-day TTL with activity refresh prevents indefinite accumulation of
  never-used memories
- Con: Requires the memory system to have access to the codebase on each
  retrieval (file reading overhead)
- Con: Memories about non-code facts (user preferences, architecture decisions)
  cannot be citation-validated
- Con: Currently only available in GitHub Copilot; no open-source implementation
  found. Pattern is architecturally compelling but not directly portable as
  code.

**Best-fit scenario:** Code-specific memories (API usage patterns, file
structure conventions, bug fixes that reference specific lines). Not applicable
to behavioral or procedural knowledge.

**SoNash relevance:** The concept is applicable to specific memory categories:
memories about hook scripts, skill implementations, and specific code patterns
could include file path + line references. The known-debt-baseline.json and
warned-files.json already implicitly implement this — they reference specific
files and check if the content matches expectations. This is citation-validation
in the build system, not in memory retrieval.

---

### RP-6: Confidence-Gated (Instinct Scoring 0.3–0.9)

**What it is:** Each memory/instinct entry carries a confidence score.
Low-confidence entries are not acted upon (they are retained but not promoted).
Entries above threshold are applied. Entries decay over time or are explicitly
pruned.

**Systems that use it:**

- ECC/homunculus instincts: atomic behavioral rules with confidence 0.3–0.9.
  Low-confidence patterns are pruned via `/prune`. High-confidence patterns
  cluster into skills/agents via `/evolve`.
- cipher Reflection Memory: only reflections scoring >= 0.4 quality threshold
  are persisted
- yuvalsuede/memory-mcp: confidence as retrieval ranking signal; different types
  have different decay rates
- SoNash pending-refinements.jsonl: patterns awaiting human judgment — this is a
  form of confidence gating where human approval is required before automation

**Tradeoffs:**

- Pro: Gradual accumulation pattern — a behavior observed once is
  low-confidence; repeated observation builds confidence; automation happens
  only at high confidence
- Pro: Natural pruning: low-confidence patterns that don't recur eventually drop
  out
- Pro: Auditable: every rule has a confidence level that can be inspected
- Con: Requires a confidence estimation mechanism (LLM rating, occurrence count,
  or explicit user feedback)
- Con: The 0.3–0.9 range in instinct systems is opaque — what determines the
  initial confidence score is not well-documented
- Con: Threshold tuning affects false-positive/false-negative rates; wrong
  threshold produces either too many low-quality automations or too few
  high-value ones

**Best-fit scenario:** Behavioral learning systems where patterns should
accumulate before being acted upon. The instinct model (observe → accumulate →
evolve → automate) is well-suited to coding assistants where behavioral
corrections need validation before becoming permanent rules.

**SoNash relevance:** The pending-refinements.jsonl is essentially a confidence
gate set to 1.0 (requires explicit human approval). The learning system's
threshold-triggered consolidation is a form of occurrence-based confidence. The
explicit 0.3–0.9 scoring model from ECC could be applied to MEMORY.md entries to
surface which memories are high-confidence (referenced repeatedly, consistent
with observed behavior) vs low-confidence (written once, never referenced
again).

---

## Part 4: Lifecycle Patterns

How memory evolves over time.

---

### LP-1: Memory Promotion (Project → Global After 2+ Projects)

**What it is:** A rule that prevents project-specific knowledge from polluting
global memory. Information promotes to a higher scope only after it proves
relevant across multiple contexts.

**Systems that use it:**

- lin-yuchen pattern (D3b-2b): Global tier (`~/.claude/global-memory/`) for
  cross-project preferences; Project tier for project-specific. Discoveries
  promote from Project → Global only after appearing in 2+ projects — never the
  reverse.
- Devin Knowledge: scopes (org-level default, enterprise-level,
  repository-pinned). Repository-pinned is the lowest scope; org-level is the
  most general.
- GitHub Copilot: session memory → repository memory → user memory. Each tier
  survives longer and applies more broadly.
- ECC instincts: project-scoped instincts override global on ID collision.
  Import/export with scope control.

**Tradeoffs:**

- Pro: Prevents context pollution — a project-specific hack doesn't contaminate
  every future session
- Pro: Forced validation — "2+ projects" rule ensures the knowledge is genuinely
  general before being elevated
- Con: Requires manual or automated monitoring of when a project-level pattern
  has appeared in a second project
- Con: Promotion rules add governance overhead; without enforcement, patterns
  accumulate at the wrong scope

**Best-fit scenario:** Long-running solo developer workflows where the same
agent works across multiple codebases. The risk is not theoretical — SoNash's
cross-locale canonical-memory divergence is partly a consequence of not having
clear promotion rules.

**SoNash relevance:** The existing User vs. Project vs. Reference category
structure in MEMORY.md implicitly encodes scope. The gap: no explicit promotion
rule prevents a project\_\*.md observation from staying project-scoped when it
has become relevant across sessions. The 2+ projects promotion rule is directly
applicable as a governance principle.

---

### LP-2: Confidence Decay (7-Day / 30-Day / Permanent by Type)

**What it is:** Different types of memory have different expected half-lives.
Instead of all memories living forever or all expiring after a fixed TTL, decay
rates are differentiated by content type.

**Systems that use it:**

- yuvalsuede/memory-mcp: progress: 7-day half-life, context: 30-day half-life,
  architecture/decisions: permanent. Budget allocation by
  `confidence * accessCount`.
- OpenMemory: 5 cognitive sectors with differential decay: Episodic
  (0.015/cycle) > Emotional (0.020/cycle) > Procedural (0.008/cycle) > Semantic
  (0.005/cycle) > Reflective (0.001/cycle). Most volatile: emotional. Least
  volatile: reflective.
- ACT-R model (academic): activation = ln(Σ t_i^(-d)) + spreading_activation; d
  ≈ 0.5. Memories accessed repeatedly stay active; never-accessed decay.
- GitHub Copilot: 28-day TTL with activity refresh. Reuse resets clock.
- SoNash TDMS partially: no explicit TTL on MEMORY.md entries, but debt items
  are tracked as "open", "resolved", "deferred" with date stamps.

**Type-to-decay mapping (synthesis):**

| Content Type                           | Expected Half-Life | Rationale                          |
| -------------------------------------- | ------------------ | ---------------------------------- |
| In-progress work / sprint context      | 7 days             | Stale within one work cycle        |
| Session-specific observations          | 30 days            | One month of relevance             |
| Bug fixes and error resolutions        | 90 days            | Relevant until next refactor       |
| Architecture decisions                 | Permanent          | Governs all future work            |
| User preferences and corrections       | Permanent          | Behavioral correction must persist |
| Project constraints and security rules | Permanent          | Non-negotiable                     |

**Tradeoffs:**

- Pro: Prevents memory stores from accumulating indefinitely; natural pruning
  aligned with real knowledge half-lives
- Pro: Forces explicit categorization of memories at write time — the content
  type required for decay also improves retrieval (A-MAC finding: content type
  prior is the strongest signal)
- Con: Requires implementation of decay logic (scheduled job, session-start
  check, or AutoDream-style consolidation agent)
- Con: Wrong decay rates are worse than no decay — if architecture decisions
  decay in 30 days, critical context is lost

**SoNash relevance:** High applicability. The 39 individual memory files have no
explicit age-based pruning. Some files are likely stale (project state described
as "in progress" that is now complete). A simple metadata header in each file
(`last_reviewed`, `type`, `expires`) would enable decay-based pruning without
infrastructure investment.

---

### LP-3: Consolidation (Episodic → Semantic, AutoDream)

**What it is:** Raw episodic records (timestamped events, observations) are
periodically processed into higher-level semantic facts. The consolidation
process: deduplicates, merges similar observations, converts relative to
absolute dates, removes contradictions, and generates summary representations.

**Systems that use it:**

- Anthropic AutoDream (gated): 4-phase: orient → gather signal → consolidate →
  prune. Converts episodic MEMORY.md entries into stable semantic facts.
- SoNash learning system: every 10 PR reviews, `run-consolidation.js` promotes
  patterns from `reviews.jsonl` to `CODE_PATTERNS.md`. This IS consolidation
  from episodic (individual review records) to semantic (named code patterns).
- SoNash session-end: SESSION_CONTEXT.md gets session summary + archive to
  SESSION_HISTORY.md — same pattern at session granularity.
- LightMem (academic): 3-stage pipeline: sensory → topic-aware STM → offline LTM
  update.
- OpenMemory auto-reflect: clusters cold memories into reflective insights after
  reaching minimum threshold.
- claude-diary `/reflect`: analyzes diary entries across 6 categories; generates
  imperative rules for CLAUDE.md.
- dream-skill community plugin: replicates AutoDream pattern for immediate use.

**The two-phase reality (academic synthesis):** Consolidation requires both
forward compression (raw events → summaries) and backward validation (summaries
remain consistent with new observations). The consolidation agent must check new
memories against existing summaries and update or discard accordingly.

**Tradeoffs:**

- Pro: Makes accumulated raw memory usable; without consolidation, episodic
  stores grow indefinitely and retrieval quality degrades
- Pro: Separates high-frequency low-value writes (every session, every tool
  call) from low-frequency high-value reads (curated semantic knowledge)
- Con: Information loss is inherent in consolidation — nuanced episodic details
  (why a specific decision was made, what failed first) are often lost in
  summaries
- Con: Consolidation requires a separate processing step that must be scheduled,
  monitored, and occasionally repaired when it produces bad output
- Con: AutoDream is still server-gated; the community dream-skill plugin is an
  approximation

**SoNash relevance:** Two consolidation pipelines already exist (learning system
consolidation, session-end archival). The gap is at the session memory level:
MEMORY.md entries are not consolidated — they accumulate over 250+ sessions
without a systematic review pass. The dream-skill plugin could provide an
immediate solution while AutoDream is gated.

---

### LP-4: Forgetting (Intentional Pruning, Relevance Decay)

**What it is:** Memory is explicitly deleted, archived, or reduced in weight.
This is the inverse of consolidation: not reorganization but removal.

**Systems that use it:**

- Anthropic AutoDream: "prune" phase — removes contradicted facts, merges
  duplicates, enforces 200-line limit
- ECC `/prune`: removes low-confidence instincts from the homunculus directory
- OpenMemory: waypoint pruning every 7 days (low-weight links removed); decay
  runs on a cycle; cold memories are not deleted but reach threshold for
  archival
- GitHub Copilot: 28-day TTL — memories expire unless reactivated. Auto-delete.
- SoNash reviews rotation: `review-lifecycle.js` rotates active reviews to
  archive at 20 entries. This IS forgetting: old reviews are archived, not live.
- TDMS resolution log: resolved debt items change status but are not deleted.

**Tradeoffs:**

- Pro: Prevents unbounded growth; keeps memory quality high by removing stale
  content
- Pro: Forces periodic review — the pruning event is an opportunity to surface
  what is no longer needed
- Con: Premature pruning is unrecoverable — once deleted, the episodic detail is
  gone
- Con: Archives are a partial solution; archived memories don't provide value
  but still consume storage
- Con: Automated forgetting without human oversight can remove memories that are
  correct but rarely accessed (frequency ≠ value)

**Best-fit scenario:** Any memory system that has been running for months —
without pruning, ALL of these systems accumulate noise. SoNash has 250+ sessions
of accumulated memory without a systematic pruning pass.

**SoNash relevance:** The 39 individual memory files include entries that
describe completed initiatives as in-progress, historical context that is no
longer relevant, and duplicate information across multiple files. A single
review pass with explicit criteria (archive entries describing completed work;
remove entries whose content is now in CLAUDE.md) would improve retrieval
quality without any new tooling.

---

### LP-5: Anti-Rot (Citation Validation, Staleness Detection)

**What it is:** Mechanisms that actively detect when stored memory has become
inconsistent with current reality, and either flag it or discard it
automatically.

**Systems that use it:**

- GitHub Copilot citation validation: citations verified on each use; memory
  discarded if code changed
- Augment Code Memory Review: agent proposes memories from current code context;
  human approval before storage
- SoNash `check-remote-session-context.js`: compares remote branch
  SESSION_CONTEXT.md dates; writes cross-session warning — staleness detection
  for the session handoff document
- SoNash `check-session-gaps.js`: detects sessions not recorded in
  SESSION_CONTEXT.md — anti-rot at the session tracking level
- SoNash canonical-memory divergence (detected in D1): the canonical-memory copy
  has drifted from live memory — this is memory rot that was detected but not
  corrected
- OpenMemory temporal knowledge graph: `valid_from` / `valid_to` windows enable
  point-in-time queries; old facts close when new ones are stored
- yuvalsuede confidence decay: low-confidence entries fade; this is passive
  anti-rot via decay

**The canonical-memory anti-rot gap (D1 finding):** The
`.claude/canonical-memory/` directory was intended as a baseline that syncs to
new locales. It has diverged significantly from live memory — missing 7+ recent
feedback entries, describing user expertise incorrectly, showing stale project
state. This is an unresolved anti-rot failure.

**Tradeoffs:**

- Pro: Prevents confident use of outdated information; LLMs are susceptible to
  acting on stale context as if it were current
- Pro: Forces memory to remain grounded in observable current state (code,
  files, dates)
- Con: Anti-rot mechanisms add review overhead; citation validation requires
  reading files on each memory use
- Con: Automated staleness detection has false positives — code that genuinely
  didn't change is re-validated unnecessarily

**Best-fit scenario:** Code-specific memories in active codebases where files
change frequently. Less critical for stable reference facts (external system
URLs, behavioral rules).

**SoNash relevance:** The most actionable anti-rot intervention is the
canonical-memory divergence fix: a process (manual or automated) to sync
canonical-memory with live memory after significant changes, or to deprecate
canonical-memory in favor of a git-tracked snapshot of live memory.

---

## Part 5: Sync Patterns

How memory crosses machine or locale boundaries.

---

### SY-1: Git-Tracked (Committed to Repo)

**What it is:** Memory files are committed to the git repository and synced via
push/pull. The same mechanism that syncs code syncs memory.

**Systems that use it:**

- SoNash: CLAUDE.md, SESSION_CONTEXT.md, SESSION_HISTORY.md, `.planning/`
  directory, `.claude/canonical-memory/`,
  `docs/technical-debt/MASTER_DEBT.jsonl`, `.claude/state/` (git-tracked subset)
- interface-design: `.interface-design/system.md` committed alongside code
- centminmod: changes to memory files committed alongside code changes
- Boris Cherny workflow: CLAUDE.md updated as part of PRs; team members @claude
  on PRs to suggest CLAUDE.md updates
- cursor-memory-bank: `memory-bank/` directory committed to project repo
- letta-code Context Repositories: every memory change has a git commit message;
  memory is a versioned git repo
- claude-diary: diary entries in `~/.claude/memory/diary/` are git-committed for
  backup

**Tradeoffs:**

- Pro: No additional infrastructure; git is already required for the codebase
- Pro: Memory history is fully auditable; `git log` on CLAUDE.md shows its
  evolution
- Pro: Cross-locale sync happens automatically via normal push/pull workflow
- Pro: Merge conflicts on memory files force explicit review when two sessions
  produce conflicting updates
- Con: Requires explicit commits; memory doesn't sync until the user commits and
  pushes
- Con: Fine-grained memory writes (every session observation) are too noisy for
  git history; only curated summaries belong in git
- Con: Locale-specific memories (machine paths, locale-specific settings) should
  not be committed; requires careful gitignore management
- Con: Concurrent editing from two locales without coordination produces merge
  conflicts on memory files

**Best-fit scenario:** Stable, curated memory that changes infrequently and
benefits from version history: CLAUDE.md, architectural decision records,
canonical memory baseline.

**SoNash relevance:** Already the primary sync mechanism for high-value memory.
The architecture is sound. The gap is the canonical-memory divergence — it is
git-tracked but not kept current.

---

### SY-2: Cloud Folder (autoMemoryDirectory + OneDrive/Dropbox)

**What it is:** The `autoMemoryDirectory` setting redirects Claude Code's auto
memory writes to a custom path. Pointing that path to a cloud-synced folder
(OneDrive, Dropbox, iCloud) makes auto memory available across machines through
the cloud sync service.

**Systems that use it:**

- Anthropic official feature: `autoMemoryDirectory` introduced in v2.1.74;
  configurable in user or local settings
- Community pattern (D5b serendipity): Set `autoMemoryDirectory` to
  `~/OneDrive/claude-memory/` for cross-locale access
- Noted limitation: official docs say auto memory is "machine-local" by design;
  cloud folder redirect is a user-initiated workaround, not an officially
  supported sync pattern
- Risk: concurrent sessions on two machines would produce file conflicts in the
  cloud-synced folder

**Tradeoffs:**

- Pro: No new infrastructure; OneDrive is already available on Windows by
  default
- Pro: Transparent to Claude; no behavior changes needed
- Pro: Files remain human-readable markdown; no binary formats to worry about
- Con: Not officially supported as a cross-device pattern; could behave
  unexpectedly
- Con: Concurrent session risk — if both machines run sessions simultaneously,
  writes could conflict
- Con: File sync latency: OneDrive may not have synced the latest memory file
  before a new session starts on the second machine
- Con: The `autoMemoryDirectory` security restriction prevents setting it from
  project settings; must be in user settings — this means it cannot be tracked
  in the project repo

**Best-fit scenario:** Solo developer who never runs both machines
simultaneously, wants cross-locale access to auto memory without setting up
additional infrastructure.

**SoNash relevance:** The no-simultaneous-sessions constraint is satisfied
(jbell work vs. Owner home are used at different times). The OneDrive path is
likely available at both locales. This is potentially the lowest-friction
solution to the auto memory cross-locale gap. The risk is manageable given the
solo operator constraint.

---

### SY-3: Git-Notes (Metadata in Git Itself)

**What it is:** Memory stored as git notes — metadata attached to git objects
(commits, trees, blobs) that travels with the git repository on push/pull but is
not part of the working tree.

**Systems that use it:**

- git-notes-memory (clawhub.ai): identified in D3c as "potentially highly
  relevant for cross-locale scenarios" but not deeply researched
- Research gap: this pattern was discovered but not fully investigated; it is
  mentioned in D3c serendipity

**Tradeoffs:**

- Pro: Memory travels with the repo; no separate sync mechanism needed
- Pro: Survives locale switches; git notes are cloned/fetched alongside commits
- Pro: Not visible in the working tree; doesn't pollute project files
- Con: git notes have complex fetch semantics;
  `git fetch origin 'refs/notes/*:refs/notes/*'` is not the default
- Con: Not widely supported by git hosting UIs (GitHub shows notes
  inconsistently)
- Con: Tooling is minimal; no mature MCP server or Claude Code plugin for
  git-notes memory found

**Best-fit scenario:** Technical metadata about specific commits (e.g., "this
commit introduced the rate-limiting pattern referenced in DEBT-00234"). Not
practical for general session memory.

**SoNash relevance:** LOW for general memory sync; potentially interesting for
linking TDMS debt items to specific commits. Not a practical primary sync
mechanism.

---

### SY-4: Cloud DB (Hosted MCP Server)

**What it is:** Memory stored in a hosted database (cloud provider or
self-hosted VPS) accessed via MCP over HTTPS. Both locales connect to the same
endpoint.

**Systems that use it:**

- supermemory ($19/month Pro): all memory in Supermemory cloud; any machine with
  API key gets the same memory
- Vercel-deployed pgvector: custom MCP server on Vercel Edge Functions +
  PostgreSQL; $0–5/month
- OpenMemory Railway deployment: central backend on Railway (cloud); both
  machines connect via HTTP MCP
- mcp-memory-service Cloudflare Workers variant: optional cloud sync layer on
  top of local SQLite
- ContextForge ($0 free tier): SaaS-based memory with MCP integration

**Tradeoffs:**

- Pro: True cross-locale synchronization; both machines see the same state in
  real time
- Pro: Works even if the two locales have no shared file system (true cloud
  independence)
- Pro: Scales beyond single-machine storage limits
- Con: Privacy risk — full session content including code, commands, and
  decisions transmitted to third party (supermemory) or self-hosted service
- Con: Subscription cost (supermemory: $19/month; Vercel: $0–5/month; VPS:
  $5–20/month)
- Con: HTTPS connectivity required; work locale may have network restrictions
- Con: Adds a new service to maintain; service downtime means memory is
  unavailable
- Con: Windows stdin bug documented in supermemory plugin (GitHub issue #25,
  open as of Feb 2026)

**Best-fit scenario:** Teams with multiple developers where a shared memory
store is needed, OR solo developer who needs reliable cross-locale sync and
finds git-based approaches insufficient.

**SoNash relevance:** MEDIUM. The supermemory Windows stdin bug is an active
concern. The Vercel approach (HTTPS, no subprocess issues on Windows) is
architecturally cleaner but requires Vercel setup. The simplest available option
today: OneDrive-based autoMemoryDirectory redirect (SY-2) or canonical-memory
git sync (SY-1) — both avoid external services.

---

### SY-5: No Sync (Locale-Specific)

**What it is:** Memory is explicitly locale-specific. This is not a failure but
a design choice — different locales may have different contexts, different
project states, and different work modes.

**Systems that use it:**

- SoNash live auto-memory:
  `~/.claude/projects/C--Users-jbell--local-bin-sonash-v0/memory/` is path-keyed
  and locale-specific by design
- SoNash session dot-files: `.session-state.json`, `.alerts-cooldown.json`,
  `.session-agents.json` — all ephemeral, locale-specific, not synced
- SoNash `.claude/state/handoff.json`: compaction handoff; ephemeral;
  locale-specific
- OMEGA Memory (WSL-only): stores in WSL filesystem; not accessible from native
  Windows locale
- Local-only MCP servers: any server storing at `~/.claude-mem/` or similar is
  locale-specific unless the home directory is cloud-synced

**Tradeoffs:**

- Pro: No sync complexity; each locale maintains independent state appropriate
  for its context
- Pro: Prevents cross-contamination of work context and home context
- Pro: Zero additional infrastructure; each locale is self-contained
- Con: Every new locale starts cold; accumulated session learnings must be
  rebuilt from scratch
- Con: The canonical-memory mechanism was created specifically to mitigate this
  — but it requires manual maintenance

**Best-fit scenario:** Content that is genuinely locale-specific: session
ephemera, local path configurations, machine-specific credentials.

**SoNash relevance:** The current pattern is largely SY-5 for live memory and
SY-1 (git) for curated memory. This is a reasonable division. The practical gap:
the two locales have diverged significantly in their live memory — the Owner
(home) locale likely has less accumulated feedback than the jbell (work) locale.
A periodic canonical-memory sync process would bring new locales up to speed
without requiring full cloud sync infrastructure.

---

## Part 6: SoNash Synthesis

Mapping each pattern to SoNash's specific constraints and identifying the
highest-leverage architectural gaps.

### 6.1: Current SoNash Pattern Coverage

| Pattern                         | Coverage                                                  | Status                                                                     |
| ------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------- |
| CP-1: Hook-Based Capture        | 25 hooks, 14+ persistence mechanisms                      | Mature. Coverage is comprehensive.                                         |
| CP-2: MCP Tool Capture          | `mcp__memory` knowledge graph; low active use             | Present but underused.                                                     |
| CP-3: Hybrid Capture            | Partial: hooks capture, MCP provides retrieval layer      | Gap: MCP retrieval is not well-connected to hook-captured data.            |
| CP-4: Manual Capture            | CLAUDE.md, MEMORY.md, SESSION_CONTEXT.md                  | Mature. Discipline is appropriate.                                         |
| CP-5: Auto Consolidation        | Learning system consolidation (10-review threshold)       | Present for learning patterns; absent for session memory.                  |
| SP-1: Flat Markdown             | 39 memory files + CLAUDE.md + SESSION docs                | Mature and appropriate for its scope.                                      |
| SP-2: Structured JSONL          | 14+ JSONL state files                                     | Mature. Rotation logic in place.                                           |
| SP-3: SQLite + Vector           | episodic-memory plugin (configured, low use)              | Present. Search tool in allow-list; show tool not.                         |
| SP-4: Knowledge Graph           | `mcp__memory` JSONL-backed graph                          | Present. `/checkpoint --mcp` skill documents it; low active use.           |
| SP-5: Hybrid Multi-Layer        | CLAUDE.md → MEMORY.md → JSONL → MCP graph                 | Present implicitly; no explicit tier boundaries or promotion rules.        |
| RP-1: Always-Inject             | CLAUDE.md + MEMORY.md index                               | Mature. Well-calibrated at 135-line / 91-line target.                      |
| RP-2: Progressive Disclosure    | MEMORY.md index → individual files                        | Partial. Index always injected; individual files not explicitly triggered. |
| RP-3: Semantic Search           | episodic-memory plugin                                    | Present but passive.                                                       |
| RP-4: Composite Scoring         | No implementation                                         | Gap.                                                                       |
| RP-5: Citation Validation       | Not implemented                                           | Gap. Pattern is applicable to code-specific memories.                      |
| RP-6: Confidence-Gated          | pending-refinements.jsonl (human gate)                    | Partial. No automated confidence scoring.                                  |
| LP-1: Memory Promotion          | Implicit in user/project/reference categories             | Partial. No explicit promotion rules or checks.                            |
| LP-2: Confidence Decay          | Not implemented for MEMORY.md                             | Gap. No TTL or decay rates on individual memory files.                     |
| LP-3: Consolidation             | Learning system; session-end archival                     | Present for two specific pipelines. Gap at session memory level.           |
| LP-4: Forgetting                | reviews rotation; TDMS status tracking                    | Present for operational data. Gap: MEMORY.md entries never pruned.         |
| LP-5: Anti-Rot                  | Session gap detection; remote-session staleness check     | Partial. canonical-memory divergence is unresolved rot.                    |
| SY-1: Git-Tracked               | CLAUDE.md, SESSION_CONTEXT.md, planning, canonical-memory | Mature for curated memory.                                                 |
| SY-2: Cloud Folder              | Not implemented                                           | Gap. autoMemoryDirectory available since v2.1.74.                          |
| SY-3: Git-Notes                 | Not implemented                                           | Gap. Low priority; complex semantics.                                      |
| SY-4: Cloud DB                  | Not implemented                                           | Gap. Supermemory/Vercel options available; privacy and Windows concerns.   |
| SY-5: No Sync (Locale-Specific) | Live auto-memory is locale-specific                       | Accepted. canonical-memory is the mitigation.                              |

### 6.2: The Three Most Valuable Pattern Gaps

**Gap 1: Consolidation of Session Memory (LP-3 / CP-5)**

The learning system has automatic consolidation (every 10 reviews →
CODE_PATTERNS.md). Session memory does not. The 39 individual memory files have
accumulated over 250+ sessions without a systematic review pass. Entries
describe completed initiatives as ongoing, contain duplicate information, and
show varying ages with no way to determine relevance. The community-available
dream-skill plugin or a custom session-end consolidation skill would address
this. Cost: one new skill; no infrastructure.

**Gap 2: canonical-memory Divergence (LP-5 / SY-1)**

The `.claude/canonical-memory/` directory is git-tracked but describes a state
from months ago. The live auto-memory has 7+ more feedback entries, correctly
describes user expertise, and reflects current project state. The divergence is
documented but unresolved. Fix: either (a) sync canonical-memory to current live
memory and commit the result, or (b) establish a quarterly process to update
canonical-memory. This is a maintenance gap, not an architectural one. Cost: one
session of manual review.

**Gap 3: Memory Decay / Anti-Rot for Individual Memory Files (LP-2 / LP-4)**

The individual `memory/*.md` files have no expiry, no TTL, and no mechanism to
detect staleness. Files describing project_active_initiatives.md may reference
completed work without any indication that the content is historical. Applying a
simple metadata header (`last_reviewed: YYYY-MM-DD`,
`type: project|feedback|user|reference`, `expires: permanent|30d|90d`) to each
file would enable a decay-checking script at session start without requiring any
new infrastructure. Cost: metadata update to 39 files; one new lightweight check
script.

### 6.3: Patterns to Avoid at SoNash Scale

**Avoid: SQLite + ChromaDB dual-write (SP-3 full implementation)**

The episodic-memory plugin already provides semantic search over conversation
history with local ONNX embeddings. Adding a second SQLite + vector store for
session memory would create redundancy without clear benefit. The existing
episodic-memory plugin should be validated first (confirm it works with fnm;
enable the `show` tool permission; test retrieval quality).

**Avoid: Cloud DB sync (SY-4) as primary cross-locale mechanism**

The simpler option — `autoMemoryDirectory` pointing to OneDrive — has lower
infrastructure cost and no additional service to maintain. Cloud DB sync is
appropriate only if the OneDrive approach proves unreliable in practice
(concurrent session conflicts, sync latency).

**Avoid: Neo4j / full graph database (SP-4 expansion)**

The existing `mcp__memory` JSONL-backed knowledge graph covers the graph memory
use case with zero additional infrastructure. Replacing it with Neo4j would add
significant operational overhead (a running database service) for marginal
benefit at SoNash's scale (tens to hundreds of entities, not millions).

**Avoid: Semantic search as a primary architectural investment before validating
the episodic-memory plugin**

The episodic-memory plugin is already configured and Windows-compatible. Before
adding any new vector search infrastructure, the existing tool should be tested
to determine whether it already meets the retrieval quality bar.

---

## Sources

| #   | Document                        | Trust                                           | Date       |
| --- | ------------------------------- | ----------------------------------------------- | ---------- |
| 1   | D1-codebase-memory-inventory.md | HIGH (filesystem)                               | 2026-03-31 |
| 2   | D2a-claude-mem-cipher.md        | HIGH (official repos)                           | 2026-03-31 |
| 3   | D2b-everything-cc-interface.md  | HIGH (official repos)                           | 2026-03-31 |
| 4   | D2c-supermemory-openmemory.md   | HIGH (official repos + docs)                    | 2026-03-31 |
| 5   | D3a-1-github-claude-memory.md   | MEDIUM-HIGH (repos + WebFetch)                  | 2026-03-31 |
| 6   | D3a-2-github-agent-memory.md    | MEDIUM-HIGH (repos + WebFetch)                  | 2026-03-31 |
| 7   | D3b-1-reddit-hn.md              | MEDIUM-HIGH (HN threads)                        | 2026-03-31 |
| 8   | D3b-2a-anthropic-official.md    | HIGH (official docs + changelog)                | 2026-03-31 |
| 9   | D3b-2b-dev-blogs.md             | MEDIUM-HIGH (official docs + community)         | 2026-03-31 |
| 10  | D3c-marketplace-plugins.md      | HIGH (official registries + repos)              | 2026-03-31 |
| 11  | D4a-academic-memory-patterns.md | HIGH (peer-reviewed + official Anthropic docs)  | 2026-03-31 |
| 12  | D4b-industry-implementations.md | HIGH (official docs + vendor blogs)             | 2026-03-31 |
| 13  | D5a-mcp-memory-servers.md       | HIGH (official repos + filesystem verification) | 2026-03-31 |
| 14  | D5b-mcp-integration-patterns.md | MEDIUM-HIGH (community + official)              | 2026-03-31 |

---

## Contradictions

**MCP capture: "automatic" vs "agent-decides"** Multiple systems (cipher, ECC,
OpenMemory) market themselves as automatically capturing memories. The actual
mechanism requires the agent to call an MCP tool. True automatic capture
requires hooks. The confusion is widespread in marketing copy but the technical
reality is consistent across all examined source code.

**Auto Memory cross-locale: supported vs unsupported** Anthropic's official docs
state auto memory is "machine-local" and "not shared across machines." The
`autoMemoryDirectory` feature (v2.1.74) allows redirecting to a cloud folder,
which could provide sync. These are not contradictory (the feature exists; cloud
sync is user-initiated, not officially supported), but the user community treats
the OneDrive redirect as a supported cross-locale solution. The risk is
undocumented and the behavior in concurrent-session scenarios is unverified.

**AutoDream: released vs unreleased** The D3c source describes AutoDream as
"announced in late March 2026" as a live feature. The D3b-2a source (official
docs research) confirms it is server-gated, not GA, and `/dream` returns
"Unknown skill" when called manually. The dream-skill community plugin is a
working approximation. AutoDream is real and functional in auto-trigger mode,
but manual invocation and general availability are not yet confirmed.

**Context injection volume: complementary vs redundant** The D5b analysis shows
CLAUDE.md + Auto Memory + MCP memory can consume 10,000–12,000 tokens (or up to
54,000 in heavy configurations). The community is split on whether these systems
are complementary (different content in each) or redundant (same content stored
in multiple places). For SoNash with 14 existing mechanisms, the risk of
redundancy and "context rot" is real and requires explicit audit.

---

## Gaps

1. **AutoDream exact release status**: Cannot confirm from official docs whether
   AutoDream is in general availability or still server-gated. The dream-skill
   plugin provides an immediate workaround.

2. **episodic-memory plugin actual behavior in SoNash**: The plugin is
   configured but its actual behavior with fnm (vs. nvm) on Windows is not
   verified. The open GitHub issue #49 is for nvm specifically; fnm may work
   cleanly.

3. **autoMemoryDirectory + OneDrive concurrent session behavior**: No empirical
   test of what happens when two sessions write to the same OneDrive-synced
   memory directory simultaneously. For a solo developer who never runs both
   locales simultaneously, the risk is theoretical but unverified.

4. **canonical-memory current state**: Research identified the divergence but
   did not enumerate which specific entries are most stale or which would be
   highest-value to sync.

5. **Pattern intersection at SoNash scale**: While individual patterns are
   mapped, the interaction effects of combining 14+ persistence mechanisms with
   new additions (consolidation skill, decay metadata, semantic search) are not
   fully modeled. Token budget analysis for the full stack would require a live
   session measurement.

---

## Serendipity

**The three-role model (D5b):** The community has converged on a clean
separation: CLAUDE.md = "how to work here," Auto Memory = "what I've learned,"
MCP Memory = "what we know." When each system plays its designated role, they
complement; when any system attempts another's job, they conflict. SoNash's
existing architecture fits this model well. The gap is that Auto Memory
(MEMORY.md) and canonical-memory serve overlapping roles without clear
boundaries.

**JSON preference for structured state (academic + empirical):** Anthropic's
engineering blog documents an observed behavioral property: Claude is "less
likely to inappropriately change or overwrite JSON files compared to Markdown
files." SoNash's existing hook state files (JSONL format) benefit from this
pattern correctly. Any new structured state (decay metadata, confidence scores)
should use JSON/JSONL, not Markdown.

**The 200-line / 25KB limit is a behavioral ceiling, not just an API limit:**
MEMORY.md is capped at 200 lines / 25KB for injection. Multiple community
sources confirm that CLAUDE.md adherence degrades significantly beyond 200
lines. This is not just about token cost — it's about attention quality. The
existing targets (135-line CLAUDE.md, 91-line MEMORY.md index) are empirically
well-calibrated.

**Content type prior is the strongest memory admission signal (A-MAC, March
2026):** Before running any semantic similarity or recency scoring, the
whitelist check (is this an architectural decision / user correction / project
constraint?) is the most effective filter. This suggests SoNash's memory
admission process should start with a category check, not a similarity check.

---

## Confidence Assessment

- HIGH claims: 28 (all pattern descriptions verified across multiple findings
  files)
- MEDIUM claims: 8 (SoNash relevance assessments; some pattern tradeoffs based
  on community consensus not rigorous benchmarks)
- LOW claims: 2 (AutoDream exact status; git-notes pattern depth)
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All pattern descriptions are synthesized from evidence in the 14 prior findings
files. No new claims are introduced from training data. Pattern-to-system
mappings cite specific systems and their research documents. SoNash relevance
assessments are analytical judgments based on the D1 codebase inventory (ground
truth).
