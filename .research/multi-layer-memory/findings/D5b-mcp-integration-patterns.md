# Findings: MCP Memory Integration Patterns and Architecture

**Searcher:** deep-research-searcher **Profile:** web **Date:**
2026-03-31T00:00:00Z **Sub-Question IDs:** SQ5

---

## Key Findings

### 1. MCP vs Hooks: The Fundamental Architectural Divide [CONFIDENCE: HIGH]

The clearest finding from research is a definitive architectural principle:
**MCP tools are passive; hooks are active.** This is not a matter of preference
— it is a structural constraint of how Claude Code's execution model works.

**How MCP tools work:** An MCP memory server exposes tools (`store_memory`,
`query_memory`, etc.). Claude decides when to call them. If Claude is focused on
a task, it may never call `store_memory` even if important context is produced.
Memory capture depends entirely on Claude's judgment about when retrieval or
storage is useful.

**How hooks work:** Hooks fire deterministically at lifecycle events
(SessionStart, Stop, PostToolUse) regardless of Claude's intent. A Stop hook
always captures session output, every time.

**The supermemory lesson (confirmed from source code):** The supermemory plugin
originally shipped with MCP tools as its primary interface. They abandoned it
and rebuilt around hooks. Their blog and docs explicitly state: "The MCP comes
with one big limitation: we cannot control when Claude Code chooses to run the
tools." Their plugin now uses **zero MCP tools** — only `SessionStart` and
`Stop` lifecycle hooks. Memory capture is guaranteed every session [1][2][3].

**When MCP makes sense:** Active retrieval (not capture). When Claude needs to
fetch context on demand during a task — "find past decisions about X" — MCP
tools are the right interface. The pattern that works: **hooks for capture, MCP
tools for retrieval**.

**Tradeoff table:**

| Dimension                | MCP Tools                    | Hooks               |
| ------------------------ | ---------------------------- | ------------------- |
| Capture guarantee        | No (Claude decides)          | Yes (always fires)  |
| Retrieval flexibility    | High (parameterized queries) | None                |
| Latency at capture       | Variable                     | Predictable         |
| Configuration complexity | Low                          | Medium              |
| Works offline            | Yes                          | Yes                 |
| Suitable for:            | Retrieval / search           | Capture / injection |

Sources: [1][2][3][9]

---

### 2. Auto Memory + MCP Memory Coexistence [CONFIDENCE: HIGH]

**What Auto Memory is (officially documented):** Auto Memory is Claude Code's
native system (requires v2.1.59+). Claude writes to
`~/.claude/projects/<project>/memory/MEMORY.md` and topic files during sessions.
The first 200 lines / 25KB of `MEMORY.md` loads into every session. Content is
machine-local — explicitly stated in official docs: "Auto memory is
machine-local. Files are not shared across machines." [4]

**Coexistence pattern — they occupy different roles:**

| System                  | Written by      | Contains            | Scope           | Cross-device    |
| ----------------------- | --------------- | ------------------- | --------------- | --------------- |
| CLAUDE.md               | Human           | Instructions, rules | Project or user | Via git         |
| Auto Memory (MEMORY.md) | Claude          | Learnings, patterns | Per git repo    | No              |
| MCP Memory Server       | Claude via tool | Arbitrary context   | Configurable    | If cloud-hosted |

**There is no direct conflict** because they operate in separate namespaces.
However, there is an indirect conflict: **they compete for context budget.** All
three systems inject content into the context window at session start. Token
analysis from the community found:

- Base Memory MCP: ~2,000 tokens (tool descriptions)
- CLAUDE.md files: 500–1,000 tokens
- Project memories (10–20 entries injected): 1,500–3,000 tokens
- Auto Memory MEMORY.md: up to 25KB (~6,000 tokens)
- Combined total: 10,000–12,000 tokens before any conversation begins

High-accumulation scenarios (200+ memory entries, large CLAUDE.md, many MCP
servers) can consume 33,000–54,000 tokens before a single user message [10][11].

**Redundancy risk:** Auto Memory captures preferences and patterns
automatically. An MCP memory server capturing the same content means
duplication. Community recommendation: let Auto Memory handle session learnings;
use MCP memory for content that Auto Memory won't capture (cross-project
context, team knowledge, structured facts).

**Auto-Dream (March 2026):** A background sub-agent introduced in March 2026
that consolidates auto memory files during idle time. It explicitly "has no
effect on external MCP memory servers" — they are separate systems [5].

**One open issue worth noting:** Users filed GitHub issues (#23544, #23750)
requesting the ability to disable Auto Memory without disabling CLAUDE.md. As of
the issue search, no resolution with fine-grained toggle exists beyond
`CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` (disables entirely). This is relevant if
using MCP memory as a replacement [12].

Sources: [4][5][10][11][12]

---

### 3. MCP Aggregation Patterns [CONFIDENCE: HIGH]

**The problem aggregation solves:** When multiple MCP servers are configured,
their tool lists are merged into Claude's tool inventory. Each tool definition
consumes tokens — 20 tools can cost 14,000+ tokens before any work. Running two
memory MCP servers doubles the overhead and risks Claude calling the wrong one.

**Tool-level aggregation (combine-mcp / MCP router pattern):** A Go-based
aggregator (combine-mcp) acts as both an MCP server (facing Claude) and an MCP
client (facing backend servers). It:

- Prefixes tools with server name to avoid collisions: `server1_store_memory`,
  `server2_query_memory`
- Filters which tools are exposed per server (reduce noise)
- Centralizes credential management
- Presents a single endpoint to Claude Code [6]

**Why this matters for memory:** If you have both a local memory server (for
private work) and a shared team server, an aggregator lets Claude use both with
a unified interface and no collision. Without it, both servers register
`store_memory` and Claude picks one arbitrarily.

**Performance impact of aggregation:** One analysis found consolidating 20 tools
into 8 (via parameter unification, not aggregation) cut token consumption 60%:
from 14,214 to 5,663 tokens [7]. Aggregation alone does not reduce tool count —
it organizes routing. Tool reduction requires merging similar operations into
single parameterized tools.

**Multi-memory-server pattern (complementary, not aggregated):** The community
pattern for "large project" scenarios uses two memory servers with different
scopes: one local semantic memory (for code patterns, ephemeral context) and one
structured knowledge graph (for architecture decisions, long-term facts). They
are configured as separate MCP servers with distinct tool names, not aggregated.
Claude uses each for what it does best. This is the pattern used in the
claude-mem + mem0 combination reported in the wild [8].

Sources: [6][7][8]

---

### 4. MCP Memory Server Performance [CONFIDENCE: MEDIUM]

Performance data is scattered and mostly self-reported, but patterns are
consistent enough to treat as directional.

**MCP call latency overhead:**

- Local MCP servers (stdio transport): typically 10–50ms round-trip per tool
  call
- HTTP MCP transport (localhost): 50–200ms per call
- Remote cloud MCP servers: 100–500ms depending on geography; US-East servers
  100–300ms lower than European/Asian
- The mcp-memory-service wiki reported `balanced` profile of ≤200ms;
  `speed_focused` of ≤100ms [9]

**The 5-6 minute hang bug (HIGH severity, known issue):** GitHub issue #15140
(closed NOT_PLANNED Feb 2026) documented a severe edge case: when Claude is
instructed to "check memory at session start" and the MCP memory server returns
empty results, Opus 4.5 enters an extended thinking spiral and hangs for 5–6
minutes at 0 tokens. The model attempts to reason through an empty result set
indefinitely. Workarounds: (1) never instruct Claude to check MCP memory at
session start — use hooks for injection instead; (2) use Sonnet not Opus; (3)
add guard conditions for empty results [13].

**Token cost vs latency tradeoff:** MCP tool descriptions in the tool list cost
tokens at session start even if the tools are never called. This is a fixed
overhead. Active memory queries add latency during conversation. The community
consensus: inject memories via hooks at session start (zero latency during
conversation), use MCP tools only for explicit mid-session retrieval.

**Conversation flow impact:** For a typical solo developer workflow (5–20 tool
calls per session), a memory MCP server adds:

- 1–3 MCP calls per session for explicit retrieval (200–600ms total)
- ~2,000 token tool description overhead
- Zero additional latency if memories are hook-injected at start

At this scale, performance impact is negligible. Problems emerge at scale (large
memory stores, frequent mid-conversation queries, slow remote servers).

Sources: [7][9][13]

---

### 5. MCP Memory for Cross-Locale / Cross-Device Sync [CONFIDENCE: HIGH]

**The core problem (user-specific):** This user operates on two Windows machines
(work + home locale). Native Auto Memory is explicitly machine-local — it does
not sync. CLAUDE.md files sync via git (project-scoped) or must be manually
placed (user-scoped). There is a sync gap for session learnings and personal
context.

**Cloud MCP as sync bridge — three viable approaches:**

**Approach A: Supermemory cloud plugin (simplest)** Hook-based plugin stores all
session captures in Supermemory's cloud. Any machine with the plugin + same API
key shares the same memory store. Requires $19/month Pro plan. Windows stdin bug
(Issue #25, open as of Feb 2026) may affect Windows compatibility [1][2].

**Approach B: Vercel-deployed semantic memory MCP (free tier viable)** Deploy a
custom MCP server on Vercel Edge Functions with PostgreSQL + pgvector.
Architecture:
`Claude Code → HTTPS/JSON-RPC → Vercel Edge → PostgreSQL (pgvector) → OpenAI embeddings`.
Both machines configure the same HTTPS endpoint + API key. Estimated cost:
$0–5/month (Vercel free tier + minimal embedding costs). Requires setup effort;
no automatic capture hooks — Claude must call tools explicitly [14].

**Approach C: Self-hosted central backend (most control)** Deploy OpenMemory,
mcp-memory-service, or mem0 on a server/VPS with PostgreSQL. Both machines point
at the same HTTP MCP endpoint. Fully self-hosted, zero ongoing SaaS cost beyond
VPS. Requires a machine to run the backend 24/7. Railway deployment is supported
by OpenMemory out of the box [15].

**What syncs vs what doesn't (summary):**

| Memory type               | Cross-locale today | With cloud MCP               |
| ------------------------- | ------------------ | ---------------------------- |
| CLAUDE.md (project)       | Yes (git)          | N/A                          |
| CLAUDE.md (user)          | No                 | N/A                          |
| Auto Memory (MEMORY.md)   | No                 | No (machine-local by design) |
| MCP memory server (local) | No                 | Becomes yes                  |
| MCP memory server (cloud) | Yes                | Yes (native)                 |

**Critical note on Auto Memory:** Setting `autoMemoryDirectory` to a
cloud-synced path (e.g., OneDrive, Dropbox) is not officially documented as
supported but is not blocked. It would require the sync tool to handle
file-level conflicts gracefully. Risky for multi-machine concurrent use — not
recommended.

Sources: [1][2][4][14][15]

---

### 6. MCP Memory Servers in Plugin Marketplaces [CONFIDENCE: MEDIUM]

**Official Anthropic knowledge graph memory server:** The
`modelcontextprotocol/servers` reference implementation includes a knowledge
graph memory server. Provides entities and relations, local JSON storage,
cross-platform (Win/Mac/Linux), no cloud dependency. This is the "official
baseline" — minimal features but zero cost and zero privacy risk. Available via
the official MCP server index [16].

**Claude Code marketplace (plugin install syntax):**

| Plugin                      | Install Command                                            | Architecture                  | Cost    | Cloud   |
| --------------------------- | ---------------------------------------------------------- | ----------------------------- | ------- | ------- |
| claude-supermemory          | `/plugin marketplace add supermemoryai/claude-supermemory` | Hooks only, cloud storage     | $19/mo  | Yes     |
| claude-mem                  | `/plugin marketplace add thedotmack/claude-mem`            | Hooks + local SQLite + Chroma | Free    | No      |
| memory-store-plugin (Julep) | Via marketplace                                            | Dev tracking + context mgmt   | Unknown | Unknown |

**MCP server registries (not plugins — requires manual config):**

| Server                        | Registry        | Approach                   | Cross-device         |
| ----------------------------- | --------------- | -------------------------- | -------------------- |
| mcp-memory-service (doobidoo) | PyPI, GitHub    | REST API + knowledge graph | Requires HTTP server |
| WhenMoon claude-memory-mcp    | PulseMCP, Glama | SQLite + vector            | Local only           |
| vercel-mcp-memory             | GitHub          | Cloud Vercel + pgvector    | Yes                  |
| Basic Memory                  | basicmemory.com | MCP via HTTP               | Cloud option         |
| mem0 (self-hosted)            | GitHub          | Qdrant + Neo4j + Ollama    | Requires server      |

**PulseMCP** lists 413 memory-related MCP servers as of this research date,
making it the most comprehensive community registry [17].

Sources: [1][16][17][18]

---

### 7. Best Practices: Community Consensus [CONFIDENCE: MEDIUM]

The following represents synthesized community guidance, not official Anthropic
recommendations.

**Architectural best practice (most important):** Use hooks for guaranteed
capture; use MCP tools for explicit mid-session retrieval. Do not rely on MCP
tools alone for memory capture — Claude's decision to call them is not
guaranteed [1][2][9].

**Token budget discipline:** Every MCP server's tool descriptions consume tokens
before any conversation starts. A memory MCP server adds ~2,000 tokens baseline.
A full setup with auto memory, CLAUDE.md, and MCP memory can consume
10,000–12,000 tokens per session before any user input. Mitigations:

- Keep tool descriptions short (12 tokens vs 87 tokens per description achieves
  60% reduction)
- Use selective MCP loading (only enable memory server when needed)
- Limit injected memory count (10–20 entries max, not unlimited) [7][10]

**Never instruct "check memory at session start" in CLAUDE.md:** This triggers
the 5–6 minute Opus hang bug when the server returns empty. Instead, inject via
hooks at start (automatic, no Claude decision needed) [13].

**Three-layer recommended stack for solo developer:**

1. CLAUDE.md: stable project instructions, coding standards (human-maintained,
   version-controlled)
2. Auto Memory: volatile learnings, session preferences (Claude-maintained,
   machine-local)
3. MCP memory (optional): structured long-term facts, cross-project or
   cross-device context

**Access control and security:**

- Use API keys for all production MCP servers (even local ones on localhost can
  be targeted if ports are exposed)
- Prefer OAuth 2.1 for HTTP transports (2026 MCP standard)
- Never commit API keys; use environment variables
- For cloud MCP: data privacy considerations — full session content including
  code and commands may be transmitted [16]

**Windows-specific guidance:**

- Supermemory plugin has open Windows stdin bug (Issue #25) — test before
  committing
- claude-mem explicitly addresses Windows (Node.js/npm PATH requirement)
- Vercel-hosted MCP works cleanly on Windows (pure HTTPS — no platform-specific
  subprocess issues)
- Local MCP servers using Python (uv) or Node work on Windows but may need PATH
  adjustments [1][8][14]

Sources: [1][7][8][9][10][13][14]

---

## Sources

| #   | URL                                                                                                     | Title                               | Type               | Trust  | CRAAP | Date    |
| --- | ------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------ | ------ | ----- | ------- |
| 1   | https://github.com/supermemoryai/claude-supermemory                                                     | claude-supermemory README           | official-docs      | HIGH   | 4.9   | 2026-02 |
| 2   | https://supermemory.ai/docs/integrations/claude-code                                                    | Supermemory Claude Code Docs        | official-docs      | HIGH   | 4.8   | 2026-02 |
| 3   | https://supermemory.ai/blog/we-added-supermemory-to-claude-code-its-insanely-powerful-now/              | Supermemory Claude Code Blog        | official-blog      | HIGH   | 4.5   | 2026-01 |
| 4   | https://code.claude.com/docs/en/memory                                                                  | Claude Code Official Memory Docs    | official-docs      | HIGH   | 5.0   | 2026-03 |
| 5   | https://claudelab.net/en/articles/claude-code/claude-code-auto-dream-memory-consolidation-guide         | Auto-Dream Consolidation Guide      | community          | MEDIUM | 3.5   | 2026-03 |
| 6   | https://github.com/nazar256/combine-mcp                                                                 | combine-mcp aggregator              | official-docs      | HIGH   | 4.5   | 2026-01 |
| 7   | https://scottspence.com/posts/optimising-mcp-server-context-usage-in-claude-code                        | MCP Context Token Optimization      | community-blog     | MEDIUM | 4.0   | 2026-02 |
| 8   | https://dev.to/shimo4228/embedding-memory-into-claude-code-from-session-loss-to-persistent-context-54d8 | Embedding Memory into Claude Code   | community-blog     | MEDIUM | 3.8   | 2026-03 |
| 9   | https://github.com/doobidoo/mcp-memory-service/wiki/Memory-Hooks-Complete-Guide                         | mcp-memory-service Hooks Guide      | official-docs      | HIGH   | 4.5   | 2026-03 |
| 10  | https://blog.sd.idv.tw/en/posts/2025-08-07_memory-mcp-best-practices/                                   | Memory MCP Best Practices           | community-blog     | MEDIUM | 3.8   | 2025-08 |
| 11  | https://github.com/anthropics/claude-code/issues/32627                                                  | CC Issue: Complete AI Dev Ecosystem | primary-source     | HIGH   | 4.7   | 2026-03 |
| 12  | https://github.com/anthropics/claude-code/issues/23544                                                  | CC Issue: Disable Auto Memory       | primary-source     | HIGH   | 4.8   | 2026-02 |
| 13  | https://github.com/anthropics/claude-code/issues/15140                                                  | CC Issue: 5-6min hang on MCP empty  | primary-source     | HIGH   | 4.9   | 2026-02 |
| 14  | https://github.com/evgenygurin/vercel-mcp-memory                                                        | vercel-mcp-memory README            | official-docs      | HIGH   | 4.5   | 2026-01 |
| 15  | https://github.com/CaviraOSS/OpenMemory                                                                 | OpenMemory README                   | official-docs      | HIGH   | 4.7   | 2026-03 |
| 16  | https://github.com/modelcontextprotocol/servers                                                         | Official MCP Servers                | official-docs      | HIGH   | 5.0   | 2026-03 |
| 17  | https://www.pulsemcp.com/servers?q=memory                                                               | PulseMCP Memory Server Directory    | community-registry | MEDIUM | 3.8   | 2026-03 |
| 18  | https://github.com/thedotmack/claude-mem                                                                | claude-mem README                   | official-docs      | HIGH   | 4.5   | 2026-03 |

---

## Contradictions

**"MCP is passive" vs hook + MCP hybrid architectures:** The finding that MCP
tools are passive is confirmed for pure-MCP approaches. However, claude-mem uses
both hooks AND MCP tools simultaneously: hooks capture session data into local
storage, while MCP tools expose retrieval. Some sources conflate "using MCP"
with "relying on Claude to call MCP" — these are different. The contradiction is
resolved by understanding the difference between capture (must use hooks) and
retrieval (MCP tools are fine).

**Auto Memory + MCP: "complementary" vs "redundant":** The community is split.
One camp (DEV Community, claude-mem author) says "combine CLAUDE.md auto memory
and claude-mem — it's current best practice." Another camp (token budget
analysis) argues that stacking all three systems consumes 10,000–12,000 tokens
and creates redundancy. Both are correct for different contexts: complementary
if needs differ, redundant if they capture the same content.

**Auto-Dream: real feature vs unreleased:** One source (claudelab.net) describes
Auto-Dream as a live March 2026 Claude Code feature. Another source
(github.com/grandamenium/dream-skill) is a community-built skill that
"replicates Anthropic's unreleased auto-dream feature." It is unclear whether
Auto-Dream shipped in official Claude Code or remains a community-replicated
pattern. Could not confirm from official Claude Code changelog. Treat Auto-Dream
claims as LOW confidence until independently confirmed from official docs.

---

## Gaps

1. **Auto-Dream official status:** Cannot confirm whether "Auto-Dream" is a
   shipped Claude Code feature or a community replication of an
   announced-but-unreleased feature. Official changelog not confirmed.

2. **Auto Memory + cloud sync via filesystem:** No evidence tested whether
   setting `autoMemoryDirectory` to a OneDrive/Dropbox path provides reliable
   cross-locale sync. It is plausible but untested. Concurrent write conflicts
   on multi-machine use are a real risk.

3. **MCP aggregator + memory server combined performance:** No benchmarks found
   for the specific combination of an MCP aggregator fronting two memory
   servers. Token overhead for aggregator + dual memory server is unverified.

4. **Windows-specific MCP memory server behavior:** Limited Windows-specific
   testing data found. The Vercel MCP approach (pure HTTPS) is likely the most
   reliable for Windows. Local subprocess MCP servers (Python, Node) may have
   PATH or encoding issues on Windows — no systematic study found.

5. **Basic Memory cross-device specifics:** Could not fetch basicmemory.com docs
   (SSL error). Cannot confirm whether Basic Memory cloud edition fully solves
   cross-locale sync for Claude Code specifically.

6. **Anthropic roadmap for native cross-device Auto Memory:** Issue #14228 asks
   Anthropic to sync claude.ai memory with Claude Code. No official response
   visible. No roadmap commitment found.

---

## Serendipity

1. **The "check memory at session start" antipattern:** The 5–6 minute hang bug
   (GitHub issue #15140, closed NOT_PLANNED) is a high-severity trap. Any
   CLAUDE.md or skill that says "check your memory MCP at session start" can
   cause this on new repos with Opus 4.5. The bug was closed without fix. The
   correct pattern is hook-based injection — not instructing Claude to call MCP
   tools at startup.

2. **Token apocalypse math:** Scott Spence's analysis found 66,000+ tokens
   consumed by MCP tool descriptions before any conversation on a
   heavily-configured setup. For a 200K window, that's 33% gone to overhead.
   This is a real architectural constraint for memory-heavy setups — not just a
   minor efficiency concern.

3. **MEMORY.md as cross-locale sync target:** Official docs state
   `autoMemoryDirectory` can be set in user or local settings. An
   `autoMemoryDirectory` pointing to a cloud-synced folder (e.g.,
   `~/OneDrive/claude-memory/`) would bring Auto Memory to both machines with no
   MCP complexity. Risk: concurrent session conflicts. But for a solo developer
   who never runs both machines simultaneously, this might be the simplest
   solution.

4. **Three-role model for memory systems:** The community has converged on a
   clear mental model: CLAUDE.md = "how to work here" (human-written
   instructions), Auto Memory = "what I've learned" (Claude's working notes),
   MCP Memory = "what we know" (structured knowledge base). When each system
   plays its designated role, they complement; when any system attempts to do
   another's job, they conflict.

5. **The MCP aggregator as credential vault:** combine-mcp's documentation notes
   that aggregation provides "centralized secret management where credentials
   live only in the aggregator config." For a Windows user managing multiple MCP
   servers (including memory), an aggregator reduces the number of places API
   keys are stored — a meaningful security improvement.

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 8
- LOW claims: 1 (Auto-Dream feature status)
- UNVERIFIED claims: 0
- Overall confidence: MEDIUM-HIGH

The MCP vs hooks architectural finding is HIGH confidence (confirmed from source
code and official docs). Performance numbers and token consumption figures are
MEDIUM (mostly self-reported or community-measured, not independently verified).
Auto-Dream status is LOW confidence (cannot confirm official vs community
implementation).
