# Findings: GitHub Discovery — Claude Code Specific Memory Repos

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** SQ3a (split 1 of 2)

---

## Key Findings

### Tier 1: Confirmed Referenced Repos (Hermes, OpenClaw, homunculus/humanplane)

1. **humanplane/homunculus — Behavioral Pattern Learning via Hooks**
   [CONFIDENCE: HIGH]

   328 stars, 42 forks. Active (v2 current). A Claude Code plugin that learns
   user work patterns and evolves its capabilities over time. Distinct from
   passive memory: it captures every prompt and tool interaction via hooks (100%
   reliable vs. the 50-80% of skill-based observation), analyzes patterns
   asynchronously with a background Haiku agent, and crystallizes repeated
   behaviors into "instincts" (atomic learned rules). When 5+ instincts cluster
   in a domain, it can evolve those into full skills, commands, or agents.
   Instincts are shareable and importable across projects. Strong maturity
   signal (v2 architecture rewrite addressed core reliability flaw). URL:
   https://github.com/humanplane/homunculus Windows note: Not confirmed;
   shell-heavy install (bash), likely WSL-dependent. Relevance for solo
   developer: HIGH. Personality adaptation, exportable instincts, zero-config
   after init.

2. **NousResearch/hermes-agent — Self-Improving Agent with Procedural Memory**
   [CONFIDENCE: HIGH]

   19.8k stars, 2.4k forks. v0.6.0 released March 30, 2026 — very active.
   Described as "The agent that grows with you." Uses FTS5 full-text search
   across conversation history plus LLM summarization for procedural memory.
   Integrates Honcho for persistent user profiling. Supports Anthropic as a
   provider but is NOT Claude Code specific — it is a standalone terminal agent
   that competes with Claude Code rather than extending it. OpenClaw
   auto-imports settings, memories, skills from Hermes. URL:
   https://github.com/NousResearch/hermes-agent Windows note: Cross-platform via
   Node/Python; multi-platform messaging (Telegram, Discord, Slack). Deploy on
   $5 VPS. Likely Windows-compatible via WSL. Relevance for solo developer on
   Claude Code: MEDIUM — it is a parallel ecosystem, not a Claude Code plugin.

3. **yoloshii/ClawMem — On-Device Hybrid RAG for Claude Code + OpenClaw**
   [CONFIDENCE: HIGH]

   64 stars, 7 forks. Active (197 commits). The most technically sophisticated
   memory system found. Combines BM25 + vector search + reciprocal rank fusion +
   cross-encoder reranking. Uses three graph types (semantic, temporal, causal)
   with adaptive beam search traversal. Self-improving metadata enrichment.
   Deduplication via 30-minute content hash windows. Storage: SQLite + FTS5.
   Models: local GGUF (llama.cpp) with cloud fallback. Integrates via Claude
   Code lifecycle hooks OR MCP server (28 tools) OR native OpenClaw
   ContextEngine plugin. Shares a single SQLite vault across both Claude Code
   and OpenClaw runtimes. URL: https://github.com/yoloshii/ClawMem Windows note:
   TypeScript on Bun runtime; SQLite is cross-platform. No explicit Windows
   callout but no blockers identified. Relevance for solo developer: HIGH if
   local-inference is acceptable; HIGH complexity.

4. **win4r/openclaw-workspace — OpenClaw Workspace File Manager Skill**
   [CONFIDENCE: MEDIUM]

   A Claude Code skill for maintaining and optimizing OpenClaw workspace files
   (AGENTS.md, SOUL.md, TOOLS.md, MEMORY.md, checklists). Memory is one
   component of a broader workspace management skill. Stars/activity not
   confirmed at depth. URL: https://github.com/win4r/openclaw-workspace
   Relevance: LOW for pure memory; only relevant if adopting full OpenClaw
   ecosystem.

5. **TechNickAI/openclaw-config — Three-Tier Memory with Skill Integrations**
   [CONFIDENCE: HIGH]

   42 stars, 122 commits. Three-tier architecture: Tier 1 is a curated MEMORY.md
   (~100 lines, loaded every session); Tier 2 is daily context files; Tier 3 is
   structured knowledge directories retrieved via vector embeddings. A
   "librarian" skill promotes observations upward through tiers. Includes 15
   real-world integration skills (Asana, Fathom, Quo, Vapi). macOS/Linux only —
   no Windows support stated. URL: https://github.com/TechNickAI/openclaw-config
   Relevance for solo developer on Windows: LOW due to macOS/Linux limitation.

---

### Tier 2: High-Signal Independent Memory Systems

6. **GMaN1911/claude-cognitive — Token-Efficient Attention Routing +
   Multi-Instance Coordination** [CONFIDENCE: HIGH]

   445 stars, 39 forks. Production-ready (v1.1). The most mature standalone
   memory system found outside the 6 analyzed repos. Uses a two-system
   architecture: Context Router (attention dynamics, 3-tier HOT/WARM/COLD file
   classification with keyword-triggered activation and decay) and Pool
   Coordinator (multi-instance state sharing, auto-detection of blockers every 5
   minutes). Validated on 1M+ line codebases, 8 concurrent Claude Code
   instances. Claims 64-95% token reduction. v1.1 adds queryable attention logs.
   URL: https://github.com/GMaN1911/claude-cognitive Windows note: Requires
   CLAUDE_INSTANCE env var; keyword.json config. No Windows callout but
   Node-based should work. Relevance for solo developer: HIGH for token
   efficiency; multi-instance is bonus.

7. **HelloRuru/claude-memory-engine — Hooks + Markdown, Zero Dependencies**
   [CONFIDENCE: HIGH]

   107 stars. Active (March 2026). 8-step "Student Loop": auto-saves every 20
   messages, before compaction, and at session end. Smart Context loads project
   memory by working directory. Correction Cycle records mistakes via /analyze.
   Weekly /reflect reviews patterns and upgrades errors into permanent rules. 36
   bilingual commands (English + another language). Cross-device backup via
   private GitHub repo. Setup: copy hook files and commands to ~/.claude/
   manually; Node.js 18+ only dependency. URL:
   https://github.com/HelloRuru/claude-memory-engine Windows note: Uses Unix
   paths (~/.claude/). Manual path adjustment needed on Windows. Relevance for
   solo developer: MEDIUM-HIGH; excellent transparency via readable markdown
   files; cross-device backup is git-based.

8. **rlancemartin/claude-diary — Diary + Reflection Memory Pattern**
   [CONFIDENCE: HIGH]

   351 stars, 33 forks. Last active November 2025. Three-tier pattern inspired
   by Generative Agents paper: Observations (/diary command), Reflection
   (/reflect), Retrieval (CLAUDE.md update). PreCompact hook fires automatically
   before compression. Simple and trustworthy — no external services, pure
   markdown + hooks. URL: https://github.com/rlancemartin/claude-diary Windows
   note: Bash hook at ~/.claude/hooks/pre-compact.sh. Needs Bash (Git Bash or
   WSL) on Windows. Relevance for solo developer: HIGH for simplicity; lower
   maintenance burden than graph-based systems.

9. **mkreyman/mcp-memory-keeper — MCP Server with 38 Tools, Full Windows
   Support** [CONFIDENCE: HIGH]

   110 stars. Active (117 commits). SQLite-based, topic-organized via channels
   auto- derived from git branches. Token management with configurable safety
   buffers. File content caching with change detection. Single install:
   `claude mcp add memory-keeper npx mcp-memory-keeper`. Three tool profiles
   (minimal/standard/full). Explicitly confirmed Windows compatible. URL:
   https://github.com/mkreyman/mcp-memory-keeper Windows note: CONFIRMED
   COMPATIBLE via npx across macOS, Linux, and Windows. Relevance for solo
   developer on Windows: HIGH. Easiest confirmed Windows path.

10. **yuvalsuede/memory-mcp — Two-Tier CLAUDE.md + Deep Store** [CONFIDENCE:
    HIGH]

    89 stars. Active (very recent commits). Two tiers: fast CLAUDE.md for
    instant load, deep .memory/state.json searched mid-conversation via MCP.
    Uses Claude Haiku for extraction and Jaccard similarity for deduplication.
    Confidence decay for memory aging. Git snapshot integration. Cost:
    ~$0.001/extraction, $0.05-$0.10/day. URL:
    https://github.com/yuvalsuede/memory-mcp Windows note: npm/Node.js; no
    Windows blockers identified but not explicitly confirmed. Relevance for solo
    developer: HIGH. Low cost, two-tier design matches CLAUDE.md mental model
    already familiar.

---

### Tier 3: Cross-Machine / Cross-Locale Sync Focused

11. **toroleapinc/claude-brain — Git-Based Brain Sync Across Machines**
    [CONFIDENCE: HIGH]

    33 stars, 10 forks. v0.1.0 released March 3, 2026. Git-based transport (no
    central server). Syncs memory, CLAUDE.md, skills, agents, rules, and
    settings. JSON deep- merge (free) for structured data; LLM-powered semantic
    merge (~$0.01-0.05/op) for unstructured content. Auto-sync via session
    start/end hooks. Install via plugin marketplace, `/brain-init` on first
    machine, `/brain-join` on others. CRITICAL NOTE: Windows native NOT
    supported. WSL2 required. URL: https://github.com/toroleapinc/claude-brain
    Relevance for cross-locale sync: HIGH concept, but WSL2 dependency is a
    blocker for Windows-native workflow.

12. **camgitt/memoir — Cross-Tool E2E Encrypted Sync (11 AI Tools)**
    [CONFIDENCE: HIGH]

    5 stars. Created March 4, 2026 — very new. MCP server syncing memory across
    11 AI tools: Claude Code, Cursor, Windsurf, Gemini CLI, Copilot, ChatGPT,
    Cline, Continue.dev, Aider, Zed, Codex. Three layers: AI memory configs,
    active session state, workspace projects. E2E encryption, secret scanning,
    platform-aware path remapping. Installed via npm globally. `memoir push` /
    `memoir restore` workflow. CONFIRMED: Works on macOS, Windows, and Linux
    with automatic path remapping. URL: https://github.com/camgitt/memoir
    Relevance for cross-locale/Windows: HIGH. Explicitly cross-platform with
    path remapping — directly addresses Windows locale path differences. Very
    early-stage.

13. **lopadova/claude-mem-sync — Team Memory Sync Extension for claude-mem**
    [CONFIDENCE: HIGH]

    1 star. Recent commits. Extends claude-mem with filtered export, intelligent
    eviction, deduplication, access tracking, and LLM-powered knowledge
    distillation. Uses GitHub repository as hub; GitHub Actions merges
    contributions. Supports developer profiles. CONFIRMED: Windows PowerShell
    install path documented. URL: https://github.com/lopadova/claude-mem-sync
    Relevance for cross-locale: MEDIUM-HIGH. Designed for team sync but works
    for solo multi-machine. Windows PowerShell explicit support is notable.

---

### Tier 4: Graph / Database Backend Systems

14. **ViralV00d00/claude-code-memory — Neo4j Graph Memory** [CONFIDENCE: MEDIUM]

    9 stars. 3 commits. Uses Neo4j with 6 node types (Task, CodePattern,
    Problem, Solution, Project, Technology) and 35+ typed relationship
    categories. 13 MCP tools. Requires Neo4j credentials and Python. High setup
    friction; small community signal. URL:
    https://github.com/ViralV00d00/claude-code-memory Relevance for solo
    developer: LOW due to Neo4j operational overhead.

15. **mnemon-dev/mnemon — Four-Graph Knowledge Store, Single Binary**
    [CONFIDENCE: MEDIUM]

    32 stars. v0.1.2, February 21, 2026. Four graph types (temporal, entity,
    causal, semantic). LLM as supervisor, binary handles deterministic ops.
    Auto-detects Claude Code and deploys via `mnemon setup`. Zero user-side
    operation after install. Single Go binary — no runtime deps. Hook-based:
    SessionStart, UserPromptSubmit, Stop, PreCompact. URL:
    https://github.com/mnemon-dev/mnemon Windows note: Go binary is
    cross-platform compile target; no explicit Windows confirmation but no
    blockers. Relevance for solo developer: MEDIUM. Single binary is appealing
    for Windows; four-graph architecture may be over-engineered for solo use.

16. **mcpware/claude-code-organizer — CLAUDE.md Scope/Security Management**
    [CONFIDENCE: MEDIUM]

    200 stars. Active (March 31, 2026). Not strictly a memory system — scans,
    finds, and fixes what Claude Code loads. Security scanning + scope
    management for CLAUDE.md and related files. Useful as a companion to memory
    systems to prevent context bloat. URL:
    https://github.com/mcpware/claude-code-organizer Relevance for solo
    developer: MEDIUM — diagnostic utility more than memory system.

---

### Tier 5: Lightweight / Template / Pattern Systems

17. **russbeye/claude-memory-bank — Structured Directory Memory Bank**
    [CONFIDENCE: MEDIUM]

    7 stars. 14 commits. Four directory categories: decisions/, patterns/,
    architecture/, troubleshooting/. Specialized agents for code search, sync,
    context retrieval. Manual /update-memory-bank command to initialize.
    Clone-and-copy install. URL: https://github.com/russbeye/claude-memory-bank
    Relevance: LOW-MEDIUM. Organizational template rather than automated system.

18. **a228410395/claude-trinity — Three-Layer Memory Toolkit** [CONFIDENCE: LOW]

    1 star. Written in PowerShell — notable for Windows-native approach.
    Described as "Three-layer memory system for Claude Code — essential toolkit
    for AI-assisted development." No depth available; very early-stage. URL:
    https://github.com/a228410395/claude-trinity Windows note: PowerShell
    implementation is explicitly Windows-friendly. Relevance: LOW maturity but
    NOTABLE as a Windows-native memory tool.

19. **centminmod/my-claude-code-setup — CLAUDE.md Memory Bank Starter Template**
    [CONFIDENCE: HIGH]

    2.1k stars. January 2025 (older but high star count). Shared starter
    template and CLAUDE.md memory bank system. "Update memory bank" pattern for
    session synthesis. Uses Git worktrees for parallel Claude Code instances.
    Multiple CLAUDE.md variants per platform context. Cross-machine via Git.
    URL: https://github.com/centminmod/my-claude-code-setup Relevance for solo
    developer: MEDIUM — high quality reference template but not automated;
    manual update-memory-bank discipline required.

20. **PCIRCLE-AI/claude-code-buddy (MeMesh) — Persistent Memory, 90-Day
    Retention** [CONFIDENCE: MEDIUM]

    Remembers architecture decisions, coding patterns, project context across
    sessions. 90-day retention for decisions, 30-day for session context. Local
    storage only. WARNING: "Windows native terminal may have display issues (use
    WSL2)." URL: https://github.com/PCIRCLE-AI/claude-code-buddy Relevance:
    MEDIUM for content; Windows display issues noted.

---

### Tier 6: Serendipitous / Edge Finds

21. **zilliztech/memsearch — Markdown-First Memory Library (OpenClaw-Inspired)**
    [CONFIDENCE: MEDIUM]

    Standalone library for any AI agent, inspired by OpenClaw. Markdown-first —
    all memory stored as markdown. Language-agnostic design. Backed by Zilliz
    (Milvus vector DB company) — suggests production-grade vector search
    backing. URL: https://github.com/zilliztech/memsearch Relevance: MEDIUM as a
    library for building custom memory, not a ready-made plugin.

22. **michaelv2/claude-cortex-core — Stripped-Down Fork of claude-cortex**
    [CONFIDENCE: MEDIUM]

    Minimal, production-ready MCP server. Fork removes non-essential subsystems
    while preserving the remember/recall/forget/consolidate pipeline.
    Windows-compatible via npm. No stars detail retrieved — early-stage fork.
    URL: https://github.com/michaelv2/claude-cortex-core Relevance: MEDIUM as a
    minimal production-ready option.

23. **FirmengruppeViola/claude-memory-mcp — Auto-Capture with Semantic Search +
    Decay** [CONFIDENCE: LOW]

    Auto-captures conversations, applies semantic search, importance scoring,
    and memory decay. "Just works" positioning. npm-based. Low community signal
    (stars not confirmed). URL:
    https://github.com/FirmengruppeViola/claude-memory-mcp Relevance: LOW —
    unverified maturity.

---

## Relevance Ranking for: Solo Developer + Claude Code + Windows + Cross-Locale Sync

| Rank | Repo                    | Stars | Windows     | Cross-Locale   | Integration        | Why                                                                        |
| ---- | ----------------------- | ----- | ----------- | -------------- | ------------------ | -------------------------------------------------------------------------- |
| 1    | mcp-memory-keeper       | 110   | CONFIRMED   | via git backup | MCP/npx            | Only fully confirmed Windows compatible; 38 tools; single install          |
| 2    | memoir                  | 5     | CONFIRMED   | CONFIRMED      | MCP/npm            | Only tool with explicit Windows path remapping + cross-tool sync; very new |
| 3    | claude-cognitive        | 445   | likely      | manual         | scripts/hooks      | Most mature token-efficiency system; multi-instance bonus                  |
| 4    | claude-diary            | 351   | WSL/GitBash | via CLAUDE.md  | hooks/commands     | Simple, proven, high stars; needs Bash                                     |
| 5    | memory-mcp (yuvalsuede) | 89    | likely      | via git        | MCP+npm            | Two-tier matches existing mental model; low cost                           |
| 6    | claude-mem-sync         | 1     | CONFIRMED   | CONFIRMED      | npm/GitHub Actions | Extends claude-mem for multi-machine; PowerShell explicit                  |
| 7    | ClawMem                 | 64    | likely      | shared SQLite  | hooks+MCP          | Most sophisticated retrieval; dual Claude+OpenClaw vault                   |
| 8    | homunculus              | 328   | unconfirmed | via export     | plugin             | Behavioral learning is unique; high maturity signal                        |
| 9    | claude-brain            | 33    | WSL only    | git-based      | plugin             | Best sync concept but WSL2 required                                        |
| 10   | claude-memory-engine    | 107   | manual      | via git backup | hooks/commands     | Good transparency; zero deps; Unix path adjustment needed                  |

---

## Sources

| #   | URL                                                | Title                            | Type         | Trust  | CRAAP | Date              |
| --- | -------------------------------------------------- | -------------------------------- | ------------ | ------ | ----- | ----------------- |
| 1   | https://github.com/humanplane/homunculus           | humanplane/homunculus            | GitHub repo  | HIGH   | 4.2   | Mar 2026          |
| 2   | https://github.com/NousResearch/hermes-agent       | NousResearch/hermes-agent        | GitHub repo  | HIGH   | 4.5   | Mar 2026          |
| 3   | https://github.com/yoloshii/ClawMem                | yoloshii/ClawMem                 | GitHub repo  | HIGH   | 4.3   | Mar 2026          |
| 4   | https://github.com/GMaN1911/claude-cognitive       | GMaN1911/claude-cognitive        | GitHub repo  | HIGH   | 4.4   | Mar 2026          |
| 5   | https://github.com/HelloRuru/claude-memory-engine  | HelloRuru/claude-memory-engine   | GitHub repo  | HIGH   | 4.0   | Mar 2026          |
| 6   | https://github.com/rlancemartin/claude-diary       | rlancemartin/claude-diary        | GitHub repo  | HIGH   | 4.1   | Nov 2025          |
| 7   | https://github.com/mkreyman/mcp-memory-keeper      | mcp-memory-keeper                | GitHub repo  | HIGH   | 4.3   | Mar 2026          |
| 8   | https://github.com/yuvalsuede/memory-mcp           | yuvalsuede/memory-mcp            | GitHub repo  | HIGH   | 4.0   | Mar 2026          |
| 9   | https://github.com/toroleapinc/claude-brain        | toroleapinc/claude-brain         | GitHub repo  | HIGH   | 4.0   | Mar 2026          |
| 10  | https://github.com/camgitt/memoir                  | camgitt/memoir                   | GitHub repo  | MEDIUM | 3.5   | Mar 2026          |
| 11  | https://github.com/lopadova/claude-mem-sync        | lopadova/claude-mem-sync         | GitHub repo  | MEDIUM | 3.4   | Mar 2026          |
| 12  | https://github.com/ViralV00d00/claude-code-memory  | ViralV00d00/claude-code-memory   | GitHub repo  | MEDIUM | 3.2   | Mar 2026          |
| 13  | https://github.com/mnemon-dev/mnemon               | mnemon-dev/mnemon                | GitHub repo  | MEDIUM | 3.8   | Feb 2026          |
| 14  | https://github.com/mcpware/claude-code-organizer   | mcpware/claude-code-organizer    | GitHub repo  | MEDIUM | 3.8   | Mar 2026          |
| 15  | https://github.com/russbeye/claude-memory-bank     | russbeye/claude-memory-bank      | GitHub repo  | MEDIUM | 3.2   | Mar 2026          |
| 16  | https://github.com/TechNickAI/openclaw-config      | TechNickAI/openclaw-config       | GitHub repo  | MEDIUM | 3.5   | Feb 2026          |
| 17  | https://github.com/centminmod/my-claude-code-setup | centminmod/my-claude-code-setup  | GitHub repo  | HIGH   | 4.0   | Jan 2025          |
| 18  | https://github.com/julep-ai/memory-store-plugin    | julep-ai/memory-store-plugin     | GitHub repo  | MEDIUM | 2.5   | ARCHIVED Dec 2025 |
| 19  | https://github.com/zilliztech/memsearch            | zilliztech/memsearch             | GitHub repo  | MEDIUM | 3.5   | Mar 2026          |
| 20  | https://github.com/topics/claude-memory            | GitHub topic: claude-memory      | GitHub topic | MEDIUM | 4.0   | Mar 2026          |
| 21  | https://github.com/topics/claude-code-memory       | GitHub topic: claude-code-memory | GitHub topic | MEDIUM | 4.0   | Mar 2026          |

---

## Contradictions

**homunculus v1 vs v2 reliability**: v1 was skill-based (50-80% observation
rate, described as "often seeming dead"). v2 uses hooks for 100% capture. This
is a significant architectural maturity jump — but the star count (328) does not
reveal which version users have actually deployed. Users still running v1 will
have very different experiences than v2 users.

**cross-locale sync availability**: Three approaches exist (claude-brain for
semantic merge, memoir for cross-tool, claude-mem-sync for team sync) but only
memoir claims Windows native path remapping without WSL. However, memoir is 27
days old with 5 stars — maturity risk is HIGH.

**Windows "compatibility" vs "confirmed"**: Many repos say nothing about
Windows; some use npm/Node which is cross-platform in principle. Only
mcp-memory-keeper and memoir explicitly confirm Windows. Others may work but
carry unverified status.

---

## Gaps

- **Anthropic official plugin directory not enumerable**:
  anthropics/claude-plugins-official directory listing was not accessible
  through WebFetch — could not confirm if any official memory plugins exist.
- **star counts for several repos not confirmed at fetch time**:
  claude-cortex-core, claude-trinity, claude-code-buddy — described from search
  snippets, not direct fetches.
- **julep-ai/memory-store-plugin is archived** (Dec 27, 2025) — not viable for
  new installations.
- **OpenClaw ecosystem scope**: OpenClaw appears to be a substantial parallel
  ecosystem to Claude Code. Its memory integrations (ClawMem, openclaw-config,
  openclaw-workspace) may not be relevant for pure Claude Code users.
- **Hermes agent**: Not a Claude Code plugin — it is a standalone agent that
  happens to support Anthropic as a provider. Only tangentially relevant.
- **Windows-native test data**: No repos provided actual Windows test evidence
  beyond documentation claims. WSL2 workarounds may be required for several
  "cross-platform" tools.

---

## Serendipitous Findings

- **memoir is the only tool found that explicitly addresses Windows path
  remapping between machines** — directly relevant to the two-locale (home/work)
  use case in this codebase. With only 5 stars at 27 days old, it is high-risk
  but uniquely targeted.

- **autoMemoryDirectory feature (Claude Code v2.1.74, March 12, 2026)**: A
  native Claude Code feature that lets you redirect memory storage to a custom
  path (e.g., Dropbox). This is an official partial solution for cross-device
  sync that does NOT require any third-party plugin. However it breaks when
  paths differ between machines (absolute path key issue). This is relevant for
  the orchestrator synthesis phase.

- **julep-ai/memory-store-plugin is ARCHIVED**: It appeared in multiple search
  results but was silently deprecated December 27, 2025. Any documentation
  referencing it as an active option is stale.

- **claude-cognitive is notably mature**: At 445 stars and validated on 1M+ line
  codebases with 8 concurrent instances, this repo may be underrepresented in
  community curation lists relative to its actual technical depth.

- **A Windows-native memory tool exists**: a228410395/claude-trinity is written
  in PowerShell — making it the only identified Windows-native (non-WSL) memory
  implementation. 1 star and early-stage, but architecturally notable.

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 8
- LOW claims: 3
- UNVERIFIED claims: 0
- Overall confidence: MEDIUM-HIGH

Most findings are drawn from direct WebFetch of repository pages (Tier 1/2
sources). Lower confidence items are from search snippet descriptions without
full page fetches. No claims rely on training data alone.
