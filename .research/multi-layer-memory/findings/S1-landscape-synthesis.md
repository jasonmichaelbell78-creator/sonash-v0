# S1: Landscape Synthesis — Multi-Layer Memory Research

**Synthesizer:** deep-research-synthesizer **Date:** 2026-03-31 **Source
files:** D1, D2a, D2b, D2c, D3a-1, D3a-2, D3b-1, D3b-2a, D3b-2b, D3c, D4a, D4b,
D5a, D5b **Scope:** LANDSCAPE — what exists, what is known, current state

---

## 1. Current State — What SoNash Already Has

### 14 Memory Mechanisms, Categorized

SoNash (this project) already operates one of the most mature memory ecosystems
found in the research landscape. At Session #250, it has accumulated 14 distinct
memory mechanisms across multiple persistence tiers.

#### Tier 1 — Always-Loaded Context (Fires Every Session)

| Mechanism             | Location                                  | Content                                                                                    | Health                                         |
| --------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| CLAUDE.md             | `/CLAUDE.md` (git-tracked)                | Rules, stack versions, behavioral guardrails (14), anti-patterns (5), agent trigger tables | HEALTHY — v5.8, actively maintained, 258 lines |
| Auto-Memory MEMORY.md | `~/.claude/projects/.../memory/MEMORY.md` | Index of 39 memory files across 4 categories                                               | HEALTHY — 91 lines, live and auto-injected     |
| SESSION_CONTEXT.md    | `/SESSION_CONTEXT.md` (git-tracked)       | Session counter, recent 3 summaries, Quick Recovery, branch, goals                         | HEALTHY — v8.12, 300-line target               |

#### Tier 2 — On-Demand / Event-Driven Persistence

| Mechanism                      | Location                             | Content                                                                            | Health                                                       |
| ------------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Auto-Memory detail files       | `~/.claude/projects/.../memory/*.md` | 39 files: user preferences, feedback, project state, references                    | HEALTHY — 18 feedback entries, 12 project entries            |
| MCP knowledge graph            | `mcp__memory` (external, JSONL)      | Entity/relation graph (session_context, architectural_decision, bug_investigation) | LOW USE — permission configured, rarely invoked in practice  |
| Episodic memory search         | `mcp__plugin_episodic-memory`        | Semantic search over past session `.jsonl` files                                   | CONFIGURED — search-only permission; show permission missing |
| Hook state files (git-tracked) | `.claude/state/*.jsonl` / `*.json`   | 82 files: reviews, retros, metrics, agent invocations, alerts, patterns            | HEALTHY — 30+ git-tracked files actively updated             |
| SESSION_HISTORY.md             | `docs/SESSION_HISTORY.md`            | 1,225-line append-only archive of all sessions beyond last 3                       | HEALTHY — growing                                            |

#### Tier 3 — Domain-Specific Memory

| Mechanism                | Location                                        | Content                                                     | Health                                                   |
| ------------------------ | ----------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| TDMS / MASTER_DEBT.jsonl | `docs/technical-debt/MASTER_DEBT.jsonl`         | 8,473 debt items (7,272 open, 1,127 resolved)               | HEALTHY — active intake pipeline, known overwrite hazard |
| Learning system          | `docs/AI_REVIEW_LEARNINGS_LOG.md` + state files | 500+ documented patterns, 88.5% effectiveness rate          | HEALTHY — 444 total patterns, 70 automated               |
| GSD planning artifacts   | `.planning/` directory (git-tracked)            | 93 SWS decisions, active plans, milestones, archive         | HEALTHY — 5+ active plans                                |
| CODE_PATTERNS.md         | `docs/agent_docs/CODE_PATTERNS.md`              | Promoted enforcement patterns (consolidation #23)           | HEALTHY — auto-promoted every 10 reviews                 |
| SESSION_DECISIONS.md     | `docs/SESSION_DECISIONS.md`                     | 324-line decision log for significant 3+ option choices     | HEALTHY — written by hook on AskUserQuestion events      |
| Compaction handoff       | `.claude/state/handoff.json`                    | Full snapshot: task states, commits, files, session counter | HEALTHY — 1,505 lines, PreCompact hook writes it         |

#### Known Health Issues

- **Canonical-memory divergence**: `.claude/canonical-memory/MEMORY.md`
  (git-tracked) has diverged from live
  `~/.claude/projects/.../memory/MEMORY.md`. The canonical copy is missing ~7 of
  18 feedback entries and describes user expertise incorrectly
  ("Node.js/scripting expert" vs. "non-developer director"). This is the most
  significant structural health issue in the current system.
- **STATE_SCHEMA.md stale**: Documents 10 state files; actual count is 82. Any
  architecture decisions based on this doc are stale.
- **MCP memory low utilization**: The `mcp__memory` knowledge graph is
  configured but shows low active use. The episodic-memory plugin lacks
  `episodic_memory_show` permission (only `search` is permitted).
- **Agent-token-usage.jsonl empty**: Token tracking capability exists but is not
  actively capturing data.

---

## 2. External Landscape — Categorized Inventory

### Category A — Claude Code-Native Plugins (Hook-Based)

These integrate via Claude Code's lifecycle hook system, providing guaranteed
capture.

| Tool                                 | Stars    | Mechanism                  | Storage                                   | Windows              | Key Differentiator                                                      |
| ------------------------------------ | -------- | -------------------------- | ----------------------------------------- | -------------------- | ----------------------------------------------------------------------- |
| **claude-mem** (thedotmack)          | ~38,400  | 5 lifecycle hooks          | SQLite + ChromaDB                         | Fragile (known bugs) | Progressive disclosure 3-layer retrieval; 10x token savings; v10.6.3    |
| **claude-supermemory**               | ~2,400   | SessionStart + Stop hooks  | Supermemory cloud                         | Open stdin bug       | Cross-device sync; team containers; $19/mo Pro required                 |
| **everything-claude-code** (ECC)     | ~124,000 | hooks.json (6 event types) | Session MD + instincts YAML + SQLite      | Cross-platform       | 5 memory layers; instinct evolution pathway; 136+ skills; 30 agents     |
| **homunculus** (humanplane)          | ~328     | Hooks (v2 = 100% capture)  | Instincts YAML at `~/.claude/homunculus/` | Unconfirmed          | Behavioral pattern learning → instinct → skill evolution                |
| **interface-design** (Dammyjay)      | ~4,300   | SKILL.md conditional load  | Single `.interface-design/system.md`      | Yes                  | Design token memory; frequency bootstrap from codebase; zero infra      |
| **claude-diary** (rlancemartin)      | ~351     | PreCompact hook            | Markdown diary files                      | WSL/Git Bash         | Generative Agents-inspired; observation → reflection → CLAUDE.md update |
| **claude-memory-engine** (HelloRuru) | ~107     | Manual hooks + commands    | Markdown files                            | Manual path fix      | 8-step Student Loop; cross-device via private GitHub repo               |

### Category B — MCP Server-Based Memory Systems

These integrate via MCP protocol; capture is not guaranteed (Claude must call
tools).

| Tool                                    | Stars       | Storage                          | Windows              | Key Differentiator                                                                         |
| --------------------------------------- | ----------- | -------------------------------- | -------------------- | ------------------------------------------------------------------------------------------ |
| **cipher** (campfirein)                 | ~3,600      | PostgreSQL/SQLite + vector store | Yes (npm)            | Dual cognitive model (System 1 facts + System 2 reasoning traces); MCP aggregator mode     |
| **mcp-memory-keeper**                   | ~110        | SQLite                           | CONFIRMED            | 38 tools; git-branch-keyed channels; single npx install                                    |
| **memory-mcp** (yuvalsuede)             | ~89         | CLAUDE.md + `.memory/state.json` | Likely               | Two-tier; confidence decay; Haiku extraction; ~$0.001/extraction                           |
| **Engram** (Gentleman-Programming)      | ~2,100      | SQLite + FTS5                    | First-class support  | Single Go binary; zero deps; Claude Code marketplace install                               |
| **basic-memory** (basicmachines)        | ~2,700      | Markdown + SQLite + FastEmbed    | Yes (uv)             | Human-readable Markdown source of truth; Obsidian-compatible; `memory://` URLs             |
| **mcp-memory-service** (doobidoo)       | ~1,600      | SQLite-vec + optional Cloudflare | Yes (documented)     | Hybrid BM25+vector; typed causal edges; autonomous consolidation; Remote MCP for claude.ai |
| **OMEGA Memory**                        | unconfirmed | SQLite + ONNX embeddings         | WSL 2 only           | Claims #1 LongMemEval (95.4%); 25 tools; `omega setup` auto-configures                     |
| **Memori** (MemoriLabs)                 | ~12,900     | SQL-native                       | Yes (MCP)            | 81.95% LoCoMo; asynchronous augmentation; LangChain/Pydantic support                       |
| **codebase-memory-mcp** (DeusData)      | ~1,100      | SQLite                           | YES (pre-built .exe) | Structural code intelligence; 66 languages; tree-sitter AST; not session memory            |
| **@modelcontextprotocol/server-memory** | official    | JSONL knowledge graph            | YES (npx)            | Anthropic's reference implementation; already configured in SoNash                         |
| **context-sync** (Intina47)             | ~120        | SQLite                           | Likely               | 11 platforms; git hook integration; Claude Code explicitly supported                       |
| **nano-brain**                          | ~3          | SQLite (18 tables)               | Yes                  | BM25 + vector + RRF + PageRank + neural reranking; tree-sitter AST                         |

### Category C — Cloud/Managed Memory Services

| Service                    | Pricing                       | Storage                                  | Key Differentiator                                                                     |
| -------------------------- | ----------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------- |
| **Supermemory** (platform) | Free (1M tokens) / $19/mo Pro | Cloud (vector graph + ontology)          | 81.6% LongMemEval; temporal contradiction resolution; 20.7k stars                      |
| **Mem0**                   | Free tier / paid              | Cloud or self-hosted (Qdrant + Neo4j)    | 51,600 stars; 26% accuracy boost (LoCoMo); AWS chose as exclusive memory provider      |
| **OpenMemory** (CaviraOSS) | Free (Apache 2.0)             | SQLite or PostgreSQL (local/self-hosted) | 5 cognitive sectors with differential decay; temporal validity windows; active rewrite |
| **Hindsight** (Vectorize)  | Free (MIT)                    | PostgreSQL                               | Biomimetic data structures; independently reproduced by Virginia Tech; Docker required |
| **Pieces for Developers**  | Free individual tier          | Desktop app (LTM-2.7)                    | 9-month retention; MCP + Windows; cmd wrapper required                                 |
| **ContextForge**           | Free (1 project) / $9-29/mo   | SaaS                                     | Semantic search + Git integration + task tracking                                      |

### Category D — Cross-Device Sync Tools

| Tool                              | Stars       | Sync Method                           | Windows                    | Notes                                                                                    |
| --------------------------------- | ----------- | ------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------- |
| **memoir** (camgitt)              | ~5          | npm + E2E encryption                  | CONFIRMED (path remapping) | 11 AI tools; 27 days old at research date; high risk                                     |
| **claude-brain** (toroleapinc)    | ~33         | Git (JSON merge + LLM semantic merge) | WSL 2 required             | Best sync concept; WSL blocker                                                           |
| **claude-mem-sync** (lopadova)    | ~1          | GitHub Actions hub                    | PowerShell explicit        | Extends claude-mem; intelligent eviction + LLM distillation                              |
| **autoMemoryDirectory** setting   | native      | Filesystem redirect                   | Yes                        | Official Claude Code v2.1.74+; not synced by design but can point to cloud-synced folder |
| **git-notes-memory** (clawhub.ai) | unconfirmed | Git notes                             | Yes                        | Memory travels with repo; solves locale path differences                                 |

### Category E — Non-Claude Agent Memory Patterns (Portable)

| Pattern                         | Origin                       | Portability    | Key Idea                                                                      |
| ------------------------------- | ---------------------------- | -------------- | ----------------------------------------------------------------------------- |
| Four-file markdown bank         | roo-code-memory-bank / Cline | VERY HIGH      | activeContext.md + productContext.md + progress.md + decisionLog.md           |
| Hierarchical rule loading       | cursor-memory-bank           | HIGH           | ~70% token reduction; load only relevant rules per phase                      |
| Citation-backed JIT validation  | GitHub Copilot (Jan 2026)    | HIGH (pattern) | Memory stores code line citations; validates before use; discards stale       |
| Repo map structural index       | Aider                        | HIGH           | PageRank-style codebase index within token budget; complements session memory |
| Instinct confidence scoring     | ECC / homunculus             | HIGH           | Atomic rules (0.3–0.9 confidence) accumulate and prune; graduate to skills    |
| Two-tier CLAUDE.md + deep store | yuvalsuede/memory-mcp        | HIGH           | Fast CLAUDE.md load + MCP deep store on demand                                |

### Category F — Vector DB Backends (Infrastructure)

| Backend                      | Stars   | Key Differentiator                        | Windows (local)    |
| ---------------------------- | ------- | ----------------------------------------- | ------------------ |
| Qdrant (`mcp-server-qdrant`) | ~1,300  | Local path mode (no Docker); official MCP | Yes (uvx)          |
| ChromaDB (`chroma-mcp`)      | ~526    | Embedded persistent mode; 12 tools        | Yes (uvx)          |
| Mem0 (hybrid)                | ~51,600 | Vector + graph + KV; cloud or self-hosted | Python             |
| Weaviate                     | —       | Hybrid BM25+vector; multi-tenancy         | Docker recommended |

### Category G — Anthropic Native Features

| Feature                           | Status                                | Notes                                                                      |
| --------------------------------- | ------------------------------------- | -------------------------------------------------------------------------- |
| Auto Memory (MEMORY.md)           | GA — v2.1.59+                         | Claude-written; 200 lines / 25KB cap; machine-local                        |
| autoMemoryDirectory               | GA — v2.1.74                          | Redirect storage path; security-restricted (project settings can't set it) |
| Auto Dream (`/dream`)             | Feature-flagged (`tengu_onyx_plover`) | 4-phase REM cycle; not manually invocable; background sub-agent            |
| AGENTS.md standard                | Community-driven                      | Cross-tool standard (Linux Foundation); Claude Code supports it            |
| Subagent auto memory              | GA (official docs)                    | Each subagent can maintain independent memory                              |
| Compaction + `instructions` param | GA — Jan 2026                         | Custom compaction guidance; works with memory_tool                         |

---

## 3. Academic/Industry Context

### Foundational Research

**MemGPT (UC Berkeley, 2023)** established the "virtual context management"
model: main context = RAM, external context = disk. The LLM acts as its own OS,
deciding what to page in/out. This paper provides the theoretical foundation for
why our file-based system is not a workaround — it is a recognized architectural
approach. [D4a]

**Generative Agents (Stanford, 2023)** introduced three-factor retrieval
scoring: recency + importance + relevance. Their memory stream with reflection
mechanisms is the direct ancestor of tools like claude-diary and Auto Dream.
[D4a]

**Reflexion (NeurIPS 2023)** showed that procedural memory can be text files.
Verbal reflections written after failures and re-read on retry yield 91% pass@1
on HumanEval. Our SESSION_CONTEXT.md and AI_REVIEW_LEARNINGS_LOG.md already
implement this pattern. [D4a]

**Voyager (TMLR 2024)** demonstrated skill libraries as memory: executable code
stored as files, retrieved by task-similarity. Our hook scripts and skill YAML
files are this pattern. The insight is treating the skill library as the primary
memory substrate. [D4a]

**Context Rot (Chroma Research, 2025)** provided empirical evidence that every
model tested degraded with increasing context length. Multiple distractors
compound degradation non-linearly. This is the scientific basis for aggressive
memory curation, not just token cost reduction. [D4a]

**Adaptive Memory Admission Control / A-MAC (March 2026)** found that "content
type prior" is the strongest predictor of whether something should be stored.
This suggests whitelisting content categories (user corrections, architectural
decisions, hook patterns) rather than generic accumulation. [D4a]

### Industry Implementations

**GitHub Copilot** (December 2025) is the most production-mature cross-surface
memory system found. Its citation-backed JIT validation approach — storing code
line citations alongside memories and validating them against current codebase
before use — is the most architecturally sophisticated approach in the field. It
prevents memory rot by design. [D4b]

**Letta/MemGPT** evolved into Letta Code with "Context Repositories" —
git-backed memory where every change is a versioned commit. Memory gets
branches, diffs, and merges. This is the most ambitious memory architecture
found, treating memory itself as a version-controlled artifact. [D4b]

**Augment Code** uses a two-system approach: a real-time semantic index
(structural) + Memory Review with human approval gates (episodic). Nothing
stored without user approval. This is the most rigorous approach to preventing
memory noise. [D4b]

**Devin** uses trigger-based Knowledge retrieval (contextual, not
inject-everything) plus manually curated Playbooks. Notably, there is no
automatic cross-session learning — knowledge must be manually curated. This is a
deliberate choice, not a limitation. [D4b]

**Amazon AgentCore** (AWS) uses three parallel memory strategies: Semantic,
Summary, and User Preferences. Real-world extraction/consolidation takes 20-40
seconds, confirming that memory operations should be async, not blocking. [D4b]

**Cursor removed its Memories feature** in mid-2025 after shipping it. The
community moved to Rules-based approaches. This is a data point that automatic
memory extraction without careful gating creates more problems than it solves.
[D4b, D3c]

**OpenHands** consciously chose no cross-session memory for simplicity and
auditability. This validates that building cross-session persistence is
genuinely non-trivial — a production agent platform deliberately avoided it.
[D4a, D4b]

### Key Benchmarks

| Benchmark               | What It Tests                                                     | Notable Scores                                                 |
| ----------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| LongMemEval (ICLR 2025) | 500 questions; info extraction, multi-session reasoning, temporal | Supermemory: 81.6%; OMEGA claims 95.4%; baseline ~30% accuracy |
| LoCoMo (Snap Research)  | 300-turn, 9K tokens, 35 sessions                                  | Mem0: 26% accuracy boost vs OpenAI; Memori: 81.95%             |
| MIRIX (2025)            | Multi-agent memory                                                | 85.4% accuracy; 99.9% storage reduction vs RAG baseline        |
| A-MAC (March 2026)      | Memory admission                                                  | F1 0.583; 31% latency reduction                                |

Note: Most benchmark claims are self-reported. OMEGA's 95.4% on LongMemEval
conflicts with Hindsight's "state-of-the-art" claim — both cannot be #1
simultaneously. Treat as directional rather than absolute.

---

## 4. Emerging Consensus

These are patterns that appear independently across multiple sources, suggesting
genuine convergence rather than copy-propagation.

### Pattern 1 — Three-Role Model for Memory Systems

This pattern emerged independently from: D5b (community synthesis), D3b-2a
(official docs), multiple GitHub repos, and industry implementations.

The three roles:

- **CLAUDE.md** = "how to work here" — human-authored instructions, rules,
  constraints. Committed to git. Rarely changes.
- **Auto Memory (MEMORY.md)** = "what I've learned" — Claude's working notes,
  session observations, patterns. Machine-local. Changes frequently.
- **MCP Memory** = "what we know" — structured knowledge base, cross-project
  context, team knowledge. Survives locale changes.

When each plays its designated role, they complement. When any system attempts
to do another's job, they conflict and create "context rot." This mental model
is the most consistently cited architectural principle across all sources.

### Pattern 2 — Hooks for Capture, MCP for Retrieval

Confirmed independently by: D5b (supermemory source code), D3c (marketplace
analysis), D2a (claude-mem architecture), D2c (supermemory docs), D3b-2b
(community blogs).

The supermemory team explicitly rebuilt from MCP-first to hooks-only for
capture, documenting their reasoning: "The MCP comes with one big limitation: we
cannot control when Claude Code chooses to run the tools." Hooks fire
deterministically; MCP tools fire only when Claude decides to call them.

The community consensus: **use hooks for guaranteed capture, MCP tools for
flexible retrieval**. This is not a preference — it is a structural constraint
of how Claude Code's execution model works.

### Pattern 3 — Markdown-First for Human-Readable Memory

The most consistently adopted pattern across the community (D3b-1, D3b-2b,
D3a-1, D3a-2) is simple markdown files, not databases. Found in:

- roo-code-memory-bank, cline-mcp-memory-bank, cursor-memory-bank (four-file
  pattern)
- interface-design (single system.md)
- claude-diary, claude-memory-engine
- Anthropic's own memory tool docs (file directory with .txt/.md files)
- Boris Cherny's (Claude Code creator) own workflow: team-contributed CLAUDE.md
  committed to git

The "delete-first bootstrap" pattern: run `/init`, then immediately trim because
auto-generated files waste token budget on obvious facts. Under 200 lines is the
consistent recommendation.

### Pattern 4 — Progressive / Tiered Context Loading

Appears in: D2a (claude-mem's 3-layer progressive disclosure), D3a-1
(cursor-memory-bank hierarchical rule loading), D4a (MemGPT virtual context),
D3b-2b (Yuval's two-tier budget allocation), D4b (GitHub Copilot 3-tier memory).

The core insight: do not inject all context upfront. Start with an index or
summary (~50-100 tokens), expand only what's needed. Claims range from 70% to
10x token reduction. The specific implementations vary, but the principle is
universal: **retrieve-then-expand rather than inject-everything**.

### Pattern 5 — Separation of Structural and Session Memory

Found in: D3a-2 (codebase-memory-mcp as complement), D4b (Augment's two-system
approach), D4a (Voyager skill libraries vs. session state).

Two types of memory serve fundamentally different purposes:

- **Structural / codebase memory**: "What does this codebase do?" — answered by
  repo maps, tree-sitter ASTs, code indices. This is static or slowly-changing.
- **Session / decision memory**: "What did we decide?" — answered by session
  notes, MEMORY.md, decision logs. This is dynamic.

Combining both in one system creates confusion. The field is converging toward
using complementary specialized tools rather than one universal memory system.

### Pattern 6 — Memory Write Frequency Matters More Than Architecture

From: D4a (compaction failure mode analysis), D3b-1 (community reports on
context loss), D4b (Augment human-approval gates).

The core failure mode is not wrong architecture — it is infrequent writes.
Valuable procedural knowledge generated mid-session lives in the context window,
gets compressed by compaction, and the nuance is lost. **Only what was
explicitly written to memory files before compaction fires is preserved.** The
practical implication is that memory writes should be proactive and frequent
("commit early, commit often" applied to memory), not just at session-end.

---

## 5. Key Claims

### SoNash Current State Claims

```
C-001: SoNash already operates 14 distinct memory mechanisms across 5 tiers, making it one of the most memory-mature Claude Code projects found in the research landscape. | Confidence: HIGH | Sources: [D1]

C-002: The primary cross-session memory (auto-memory) at ~/.claude/projects/.../memory/ has diverged from the canonical-memory copy in .claude/canonical-memory/. The canonical copy is missing ~7 of 18 feedback entries and describes user expertise incorrectly. | Confidence: HIGH | Sources: [D1]

C-003: The MCP knowledge graph server (mcp__memory) is configured and permitted but shows low active utilization in practice. The checkpoint skill documents it, but no frequent usage evidence was found. | Confidence: HIGH | Sources: [D1, D5a]

C-004: The episodic-memory plugin permission is scoped to search only (episodic_memory_search). The full retrieval tool (episodic_memory_show) is not permitted, limiting the plugin to finding but not reading past conversations. | Confidence: HIGH | Sources: [D5a]

C-005: SoNash has 8,473 technical debt items tracked in MASTER_DEBT.jsonl with a documented overwrite hazard — multiple ingestion scripts can regenerate the file from scratch, potentially losing deferred/resolved status. | Confidence: HIGH | Sources: [D1]

C-006: The learning system has 88.5% effectiveness rate (reviews 353-504), 444 documented patterns, and 70 automated — an unusually mature behavioral reinforcement system. | Confidence: HIGH | Sources: [D1]

C-007: The STATE_SCHEMA.md documents 10 state files; the actual .claude/state/ directory contains 82 files. The schema document is significantly stale and unreliable as an architectural reference. | Confidence: HIGH | Sources: [D1]
```

### External Landscape Claims

```
C-008: claude-mem (thedotmack) is the most widely-adopted Claude Code memory plugin with ~38,400 GitHub stars, v10.6.3, and a progressive 3-layer disclosure pattern claiming ~10x token savings over naive injection. | Confidence: HIGH | Sources: [D2a, D3c, D3b-2b]

C-009: everything-claude-code (ECC) is the highest-starred Claude Code plugin found (~124,000 stars), implementing 5 memory layers from session markdown through instincts YAML to a proposed SQLite knowledge graph. | Confidence: HIGH | Sources: [D2b]

C-010: cipher (campfirein) is the only reviewed memory tool implementing reasoning trace capture ("System 2 / Reflection Memory") — storing how the agent thought, not just what happened. Its quality threshold (≥0.4 score) gates what gets stored. | Confidence: HIGH | Sources: [D2a]

C-011: claude-supermemory requires a $19/month Pro plan for Claude Code plugin access. The free tier does not include it. A Windows stdin bug (Issue #25) was open as of February 2026. | Confidence: HIGH | Sources: [D2c, D3c]

C-012: Anthropic's Auto Memory system (GA since v2.1.59) automatically writes session learnings to ~/.claude/projects/<project>/memory/MEMORY.md, injecting the first 200 lines / 25KB at session start. It is machine-local by design and does not sync across devices. | Confidence: HIGH | Sources: [D3b-2a, D5b]

C-013: Auto Dream (background memory consolidation) exists in the Claude Code codebase as a server-side feature flag (tengu_onyx_plover, enabled:false). The /dream command returns "Unknown skill: dream" when invoked manually. A community implementation (dream-skill) replicates the 4-phase consolidation cycle. | Confidence: MEDIUM | Sources: [D3b-2a, D3c, D5b]

C-014: The AGENTS.md standard (Linux Foundation, Agentic AI Foundation) is supported by Claude Code, Cursor, GitHub Copilot, Gemini CLI, Windsurf, Aider, Zed, Warp, RooCode. It addresses the fragmentation problem where CLAUDE.md is ignored by Cursor and .cursorrules is ignored by Claude Code. | Confidence: HIGH | Sources: [D3b-1]

C-015: The MCP server ecosystem has 50+ memory-specific servers. PulseMCP lists 413 memory-related MCP entries. The market is extremely fragmented — the community identified "1,000+ similar projects with zero performance benchmarks." | Confidence: HIGH | Sources: [D3c, D3b-1]

C-016: Anthropic's official @modelcontextprotocol/server-memory (JSONL knowledge graph) is already configured in SoNash via .mcp.json (cmd /c npx -y @modelcontextprotocol/server-memory). It runs natively on Windows with no admin access required. | Confidence: HIGH | Sources: [D5a]

C-017: mem0 (51,600 stars) reports 26% higher accuracy, 91% faster responses, and 90% token savings on LoCoMo benchmark vs OpenAI Memory. AWS chose it as exclusive memory provider for its Agent SDK. These benchmarks are self-reported by Mem0. | Confidence: MEDIUM | Sources: [D3a-2, D3b-2b, D3c, D4b]

C-018: Cursor removed its Memories feature in mid-2025 (version 2.1.x). The community moved to .cursor/rules/ files (structurally identical to CLAUDE.md). No post-mortem explaining why it was removed has been published. | Confidence: HIGH | Sources: [D3c, D4b]
```

### Architecture and Pattern Claims

```
C-019: MCP tools are passive (Claude decides when to call them) while hooks are active (fire deterministically at lifecycle events). The supermemory team rebuilt from MCP-first to hooks-only for capture after discovering they could not guarantee memory capture through MCP alone. | Confidence: HIGH | Sources: [D5b, D2c, D3c]

C-020: A full memory stack (Auto Memory MEMORY.md + CLAUDE.md + MCP memory server) consumes 10,000-12,000 tokens before any user input. In high-accumulation scenarios this can reach 33,000-54,000 tokens, consuming 16-27% of a 200K context window on overhead alone. | Confidence: MEDIUM | Sources: [D5b]

C-021: The "check memory at session start" instruction in CLAUDE.md triggers a documented 5-6 minute hang when the MCP server returns empty results (GitHub issue #15140, closed NOT_PLANNED). The correct pattern is hook-based injection, not instructing Claude to call MCP tools at startup. | Confidence: HIGH | Sources: [D5b]

C-022: The three-role model (CLAUDE.md = instructions, Auto Memory = learnings, MCP = knowledge base) emerged independently across multiple research sources as the architectural consensus for organizing memory in Claude Code projects. | Confidence: HIGH | Sources: [D5b, D3b-2a, D3b-2b, D3c]

C-023: The four-file markdown pattern (activeContext.md, productContext.md, progress.md, decisionLog.md) has become a de facto community standard across Cline, Roo Code, and Claude Code memory systems — independently converged upon across multiple tools and authors. | Confidence: HIGH | Sources: [D3a-2, D3b-2b]

C-024: Context rot is empirically confirmed: every model tested (including Claude Opus 4, GPT-4.1, Gemini 2.5 Pro) degrades with increasing context length. Multiple distractors compound degradation non-linearly. This means irrelevant injected memory actively impairs performance, not just wastes tokens. | Confidence: HIGH | Sources: [D4a]

C-025: Auto Memory is explicitly machine-local per Anthropic's official documentation. There is no native cross-device sync. Setting autoMemoryDirectory to a cloud-synced folder (OneDrive, Dropbox) is not officially supported but is not blocked — a potential workaround for solo developers who never run both machines simultaneously. | Confidence: HIGH | Sources: [D3b-2a, D5b]

C-026: GitHub Copilot's citation-backed JIT validation (January 2026) is the most architecturally sophisticated memory approach found in the research. Memories store code line citations; before use, citations are validated against the current codebase; stale memories are discarded. It showed 3% precision increase and 7% PR merge rate increase. | Confidence: HIGH | Sources: [D3a-2, D4b]

C-027: Anthropic's own engineering blog recommends sub-agent summaries of 1,000-2,000 tokens maximum, file naming that signals purpose, and progressive context discovery over pre-loading. The recommended architecture ("smallest set of high-signal tokens") validates aggressive curation over accumulation. | Confidence: HIGH | Sources: [D4a]

C-028: The compaction loss problem is confirmed across three independent sources: valuable procedural knowledge generated mid-session gets compressed by compaction and the nuance is lost. Only what was explicitly written to memory files before compaction fires is preserved. | Confidence: HIGH | Sources: [D4a, D3b-1, D3b-2b]
```

### Academic / Research Claims

```
C-029: MemGPT (UC Berkeley, 2023) established that file-based memory is a recognized architectural pattern (virtual context management), not a workaround. Our file-based approach maps directly to MemGPT's main context / external context model with the LLM as its own memory controller. | Confidence: HIGH | Sources: [D4a, D4b]

C-030: The five properties of true episodic memory (long-term storage, explicit reasoning, single-shot learning, instance-specific memories, contextual relations) identify a gap in current systems: most capture facts and patterns but not the instance-specific "when/where/why" that makes memories actionable. Our MEMORY.md partially satisfies properties 1-3 but fails at 4 and partially at 5. | Confidence: HIGH | Sources: [D4a]

C-031: Reflexion (NeurIPS 2023) demonstrated that verbal reinforcement via text files achieves 91% pass@1 on HumanEval vs GPT-4's 80%. This validates our AI_REVIEW_LEARNINGS_LOG.md pattern as a research-backed approach. | Confidence: HIGH | Sources: [D4a]

C-032: A-MAC (March 2026) found that "content type prior" is the strongest single predictor of whether a memory entry should be stored — stronger than recency, semantic novelty, or utility. This suggests a whitelist of content categories (user corrections, architecture decisions, hook patterns) as the primary admission filter. | Confidence: HIGH | Sources: [D4a]

C-033: AWS AgentCore's production memory extraction takes 20-40 seconds per memory. This confirms that real-time memory extraction during active sessions is not feasible at commercial scale — memory must be built asynchronously, post-session. | Confidence: HIGH | Sources: [D4b]

C-034: Industry benchmarks (LongMemEval) show commercial assistants and long-context LLMs exhibit ~30% accuracy drop on memorizing information across sustained interactions. The problem SoNash is solving is validated as real and unsolved even in production systems. | Confidence: HIGH | Sources: [D4b]
```

### Windows / Cross-Locale Claims

```
C-035: Only two tools explicitly confirmed Windows compatibility with path remapping for multi-machine scenarios: memoir (camgitt, 27 days old at research date, 5 stars) and mcp-memory-keeper (mkreyman, 110 stars). memoir is high-risk due to age; mcp-memory-keeper is the only proven Windows option. | Confidence: HIGH | Sources: [D3a-1]

C-036: OMEGA Memory requires WSL 2 on Windows and does not run natively. Despite claiming #1 LongMemEval benchmark performance, this creates a barrier in no-admin-access environments. | Confidence: HIGH | Sources: [D5a, D3c]

C-037: Native Claude Code Auto Memory is explicitly machine-local. Cross-locale sync requires one of: (A) cloud MCP server (supermemory ~$19/mo, privacy risk), (B) self-hosted central backend (OpenMemory/mcp-memory-service via Railway), or (C) autoMemoryDirectory pointed at cloud-synced folder (unofficial, untested with concurrent access). | Confidence: HIGH | Sources: [D5b, D3b-2a]

C-038: git-notes-memory (clawhub.ai) stores memory in git notes, which travel with the repository regardless of machine. This could elegantly solve the cross-locale problem — memory is available on any clone. Research did not go deep on this approach; it remains a gap. | Confidence: LOW | Sources: [D3c]
```

---

## 6. Contradictions Surfaced

### Contradiction 1 — Auto Dream Shipped vs. Not Shipped

- D3b-2a (Anthropic official): Auto Dream has zero official documentation;
  `/dream` returns "Unknown skill"; server-side gate is `enabled: false`
- D3c (marketplace research): "Auto Dream is a native Anthropic memory
  consolidation feature nearing GA release"; franksworld.com calls it "Claude
  Code Memory 2.0"
- D5b (MCP patterns): Uncertain — "treat Auto-Dream claims as LOW confidence
  until independently confirmed"

Resolution: Auto Dream exists in the codebase with hardcoded thresholds
(minHours: 24, minSessions: 5) and is visible in the `/memory` UI, but is not
manually invocable and has no official documentation. The "Memory 2.0" framing
in community blogs is premature. Confidence in Auto Dream being "live" is LOW. A
community implementation (dream-skill) provides equivalent functionality now.

### Contradiction 2 — Markdown-First vs. Database-Backed

- D3b-1 (Reddit/HN): Community consensus favors markdown; "I just keep project
  context locally in markdown files"
- Multiple sources: Mem0 (729 Reddit upvotes), claude-mem (38,400 stars),
  vector-backed tools have massive community adoption

Resolution: Both are true for different use cases. Markdown works for
solo/personal projects; database-backed serves teams or high-frequency context
switching. The contradiction is use-case dependent, not architectural.

### Contradiction 3 — claude-mem Star Count

- D2a reports ~38,400; D3c reports 43.9k
- Research noted the 43.9k figure may be a hallucination from WebFetch; 38,400
  is better corroborated

Resolution: Use ~38,400 (March 2026 ClaudePluginHub data) as the more reliable
figure.

### Contradiction 4 — Benchmark Claims (OMEGA vs. Hindsight)

- OMEGA claims 95.4% on LongMemEval (#1)
- Hindsight claims "state-of-the-art independently reproduced by Virginia Tech
  and The Washington Post"

Resolution: Both cannot be #1 simultaneously. LongMemEval leaderboards shift.
Treat all self-reported benchmark claims as marketing until verifiable against a
dated public leaderboard.

### Contradiction 5 — Auto Memory + MCP: Complementary vs. Redundant

- Community camp A (DEV Community, claude-mem author): combine CLAUDE.md + auto
  memory + claude-mem for best results
- Community camp B (token budget analysis): stacking all three consumes
  10,000-12,000 tokens and creates redundancy

Resolution: Both are correct for different use cases. Complementary when each
system captures different content types; redundant when they capture the same
content. The three-role model (instructions / learnings / knowledge base)
resolves this if followed.

---

## 7. Gaps (What Research Did Not Find)

1. **git-notes-memory**: Identified as potentially significant for cross-locale
   but not deeply researched.
2. **Auto Dream official GA timeline**: No Anthropic roadmap found. Treat as
   unconfirmed.
3. **autoMemoryDirectory + cloud sync**: Untested with concurrent multi-machine
   use.
4. **SoNash MCP memory actual data**: Where the `mcp__memory` JSONL file
   actually lives on disk was not confirmed.
5. **Windows fnm vs. episodic-memory**: Issue #49 is for nvm users; project uses
   fnm. Live test would confirm compatibility.
6. **Devin internal retrieval mechanism**: Trigger matching is keyword-based vs.
   embedding-based — not documented publicly.
7. **Independent memory benchmarks**: No third-party comparison of Engram vs.
   mcp-memory-service vs. context-sync found.

---

## 8. Sources Index

| ID     | Source                                                                                                                          | Type                            | Trust       |
| ------ | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----------- |
| D1     | Codebase filesystem inventory (direct inspection)                                                                               | filesystem                      | HIGH        |
| D2a    | claude-mem (GitHub), cipher (GitHub), DeepWiki analyses                                                                         | GitHub repo                     | HIGH        |
| D2b    | everything-claude-code (GitHub), interface-design (GitHub)                                                                      | GitHub repo                     | HIGH        |
| D2c    | claude-supermemory (GitHub + docs), OpenMemory (GitHub)                                                                         | GitHub repo + official docs     | HIGH        |
| D3a-1  | homunculus, hermes-agent, ClawMem, TechNickAI, claude-cognitive, et al.                                                         | GitHub repos                    | MEDIUM-HIGH |
| D3a-2  | cursor-memory-bank, roo-code-memory-bank, context-sync, engram, mem0, GitHub Copilot blog, et al.                               | GitHub repos + official blog    | MEDIUM-HIGH |
| D3b-1  | HN threads (202 pts, 201 pts, 915 pts), Reddit aggregation                                                                      | Community discussion            | MEDIUM-HIGH |
| D3b-2a | code.claude.com/docs/en/memory, CHANGELOG.md, GitHub issues                                                                     | Official Anthropic docs         | HIGH        |
| D3b-2b | Dev blogs (substack, dev.to, DevelopersIO, letta.com, tessl.io)                                                                 | Community blogs                 | MEDIUM-HIGH |
| D3c    | Glama MCP registry, Smithery, Claude plugin marketplace, vendor docs                                                            | Registry + official docs        | HIGH        |
| D4a    | 20 academic papers: MemGPT, Generative Agents, Reflexion, Voyager, A-MAC, LightMem, MIRIX, A-MEM, Context Rot, Anthropic docs   | Academic + official             | HIGH        |
| D4b    | Devin docs, SWE-agent, OpenHands, Letta, Amazon Q, Google Jules, GitHub Copilot, Augment Code docs                              | Official vendor docs            | HIGH        |
| D5a    | modelcontextprotocol/server-memory, episodic-memory, Qdrant MCP, ChromaDB MCP, basic-memory, doobidoo/mcp-memory-service, OMEGA | GitHub repos + local filesystem | HIGH        |
| D5b    | supermemory source code, Claude Code official docs, GitHub issues (#15140, #23544), community blogs                             | Official docs + source code     | HIGH        |
