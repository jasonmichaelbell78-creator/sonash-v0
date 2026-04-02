# User-Requested Research: Ruflo & Claude-Peers-MCP

**Research Date:** 2026-03-23 **Depth:** L1 (Targeted deep-dive, 2 tools)
**Sources Consulted:** GitHub repos, READMEs, issues, community reviews, npm,
web articles

---

## Executive Summary

Both tools address **multi-agent orchestration** for Claude Code but at very
different scales. **Ruflo** is a heavyweight enterprise platform (23k stars, 60+
agents, swarm intelligence, vector memory) that replaces your orchestration
layer entirely. **Claude-Peers-MCP** is a lightweight MCP server (815 stars, 5
commits) enabling ad-hoc messaging between Claude Code sessions. Both have
Windows compatibility issues today, though Ruflo has fixed most of its Windows
bugs and Claude-Peers has an open PR with Windows fixes awaiting merge.

**Bottom line for SoNash workflow:** Claude-Peers-MCP is the more natural fit --
it solves the specific problem of letting parallel Claude Code sessions
communicate without replacing the existing agent/skill infrastructure already
built into SoNash. Ruflo would require rethinking the entire orchestration
approach and carries significant complexity overhead plus unresolved Windows
reliability concerns.

---

## Tool 1: Ruflo (formerly Claude Flow)

### Identity

| Field              | Value                                                             |
| ------------------ | ----------------------------------------------------------------- |
| **Full repo name** | [ruvnet/ruflo](https://github.com/ruvnet/ruflo)                   |
| **npm package**    | `claude-flow` (also published as `ruflo`)                         |
| **Stars**          | 23,281                                                            |
| **Forks**          | 2,540                                                             |
| **Language**       | TypeScript (core) + Rust (WASM kernels)                           |
| **License**        | MIT                                                               |
| **Created**        | 2025-06-02                                                        |
| **Last push**      | 2026-03-23                                                        |
| **Last commit**    | `fix: resolve issues #1390, #1391, #1392 -- v3.5.42` (2026-03-20) |
| **Open issues**    | 390                                                               |
| **Commits**        | 5,992                                                             |

### Description & Purpose

Ruflo is a production-grade multi-agent AI orchestration framework for Claude
Code. It provides 60+ specialized agents (coder, tester, reviewer, architect,
security, DevOps) that coordinate via swarm topologies (hierarchical
queen/worker, mesh peer-to-peer, ring, star). It layers on top of Claude Code to
add persistent vector memory, self-learning routing, consensus algorithms, and
cost optimization.

Originally named "Claude Flow," it was renamed to Ruflo at v3.5.0 (released
2026-02-27).

### Install Method

```bash
# Quick start (npx, no global install)
npx ruflo@latest init --wizard

# Global install
npm install -g ruflo@latest
ruflo init

# One-line full install (Linux/macOS)
curl -fsSL https://cdn.jsdelivr.net/gh/ruvnet/claude-flow@main/scripts/install.sh | bash -s -- --full

# Add as MCP server to Claude Code
claude mcp add ruflo -- npx -y ruflo@latest mcp start
```

**Requirements:** Node.js 20+, npm 9+, Claude Code installed globally.

### Key Features

1. **60+ Specialized Agents** -- pre-built agents for coding, code review,
   testing, security audits, documentation, DevOps, each optimized for its role.

2. **Swarm Coordination** -- multiple topologies (hierarchical, mesh, ring,
   star) with 5 consensus algorithms (Raft, Byzantine Fault Tolerant, Gossip,
   CRDT, majority vote).

3. **Self-Learning (RuVector)** -- proprietary intelligence layer with SONA
   neural architecture (<0.05ms adaptation), HNSW vector search (sub-ms
   retrieval), ReasoningBank pattern storage, and 9 RL algorithms.

4. **Token Optimization** -- claims 30-50% token reduction through ReasoningBank
   retrieval (-32%), WASM Agent Booster for simple tasks (-15%), caching (-10%),
   and batch sizing (-20%). Effectively "extends Claude Code usage by 250%."

5. **Agent Booster (WASM)** -- Rust-compiled WASM kernels handle simple code
   transforms (var-to-const, add-types, async-await) in <1ms without LLM calls
   at zero cost.

6. **Multi-LLM Routing** -- supports Claude, GPT, Gemini, Cohere, Ollama with
   automatic failover and cost-based routing to the cheapest model meeting
   quality requirements.

7. **Persistent Memory** -- AgentDB (SQLite + WAL), knowledge graph with
   PageRank, vector database (PostgreSQL with 77+ SQL functions), 3-scope agent
   memory (project/local/user).

8. **17 Hooks + 12 Background Workers** -- pre/post-task hooks, file change
   detection, security audits, performance optimization, and learning
   consolidation run automatically.

9. **259 MCP Tools** -- native Claude Code integration through MCP server.

10. **Anti-Drift Configuration** -- hierarchical coordinator reviews all agent
    outputs, frequent checkpoints, shared memory namespace.

### Claude Code Workflow Integration

Ruflo is designed as a layer on top of Claude Code. Integration points:

- **MCP Server**: Register Ruflo as an MCP server in Claude Code for direct tool
  access.
- **CLI**: Run `ruflo` commands from terminal alongside Claude Code.
- **Agent Spawning**: `ruflo agent spawn -t coder` creates specialized
  sub-agents.
- **Swarm Init**: `ruflo swarm init` orchestrates multi-agent teams.
- **Memory**: Persistent vector memory survives sessions, enabling cross-session
  learning.

**Potential SoNash value:** The token optimization and multi-LLM routing could
reduce costs. The agent swarm coordination is more sophisticated than the
built-in Claude Code Task/Team agents. However, SoNash already has its own agent
orchestration, hooks, skills, and memory systems. Adopting Ruflo would mean
replacing or integrating with all of that.

### Windows Compatibility

**Status: Partially fixed, but historically problematic.**

- **Issue #1282** (CLOSED): On Windows 11, `init --start-all` silently failed --
  daemon didn't persist, memory DB wasn't initialized, config file detection
  used wrong filename. Root causes: Unix-style process forking
  (`detached: true`) behaves differently on Windows, wrong path handling,
  hardcoded config filename. **Fixed in v3.5.6** (PR #1301) with platform-aware
  daemon spawning (`shell: true`, `windowsHide: true`).

- **Issue #601**: MCP server failed to connect on Windows with "unsettled
  top-level await" warning.

- **Issue #1014**: Hooks used incorrect npm package name (`@claude-flow/cli`
  instead of `claude-flow`), with Windows workaround:
  `node ./node_modules/claude-flow/v3/@claude-flow/cli/bin/cli.js hooks pre-edit`.

- **Discussion #690**: Windows installation guide was a dead link.

- **Pre-command hook failures**: Unix commands like `cat` not recognized in
  Windows cmd. Bash shell (Git Bash) required.

- **Current state**: v3.5.42 has fixed the critical daemon/memory issues, but
  the 390 open issues suggest ongoing rough edges. Windows is treated as a
  secondary platform.

### Limitations & Concerns

1. **Complexity overhead**: 60+ agents, 5 consensus algorithms, 9 RL algorithms,
   vector databases, knowledge graphs -- this is an enterprise framework.
   Overkill for a solo developer unless the cost optimization genuinely
   delivers.

2. **390 open issues**: High bug count suggests rapid feature development
   outpacing stability. Many issues are feature requests and Dependabot bumps,
   but real bugs exist.

3. **"Leading platform" claims**: Self-described as "the leading agent
   orchestration platform for Claude." Community reviews exist but the marketing
   tone is aggressive for the maturity level.

4. **Overlap with existing SoNash infrastructure**: SoNash already has agent
   orchestration (AGENT_ORCHESTRATION.md), hooks (17+ hooks), skills, memory
   (MCP memory server), and session management. Ruflo would be redundant or
   require deep integration work.

5. **Token cost claims need validation**: "250% extension" and "85% API cost
   savings" are bold claims. WASM code transforms are genuinely free, but the
   compound savings from caching and routing depend on workload patterns.

6. **Lock-in risk**: Adopting Ruflo's orchestration means depending on a
   third-party framework for core workflow. If the project stalls or changes
   direction, migration would be painful.

---

## Tool 2: Claude-Peers-MCP

### Identity

| Field              | Value                                                                     |
| ------------------ | ------------------------------------------------------------------------- |
| **Full repo name** | [louislva/claude-peers-mcp](https://github.com/louislva/claude-peers-mcp) |
| **Stars**          | 815                                                                       |
| **Forks**          | 66                                                                        |
| **Language**       | TypeScript (100%)                                                         |
| **License**        | Not specified                                                             |
| **Created**        | 2026-03-21                                                                |
| **Last push**      | 2026-03-21                                                                |
| **Last commit**    | `nicer square` (2026-03-21)                                               |
| **Open issues**    | 5 (all open)                                                              |
| **Commits**        | 5                                                                         |

### Description & Purpose

Claude-Peers-MCP enables multiple Claude Code instances running on the same
machine to discover each other and exchange messages in real-time. A broker
daemon runs on localhost, and each Claude Code session registers as a peer via
an MCP server. Messages are delivered instantly through the claude/channel
protocol.

The use case: you have 3 Claude Code terminals open on different projects. One
session can ask another "what files are you editing?" or "what did you find
about X?" without the user manually copying context between windows.

### Install Method

```bash
# Clone and install
git clone https://github.com/louislva/claude-peers-mcp.git ~/claude-peers-mcp
cd ~/claude-peers-mcp
bun install

# Register as MCP server (user-scoped, available in all sessions)
claude mcp add --scope user --transport stdio claude-peers -- bun ~/claude-peers-mcp/server.ts

# Launch Claude with channel support
claude --dangerously-skip-permissions --dangerously-load-development-channels server:claude-peers

# Optional alias
alias claudepeers='claude --dangerously-load-development-channels server:claude-peers'
```

**Requirements:** Bun runtime, Claude Code v2.1.80+, claude.ai web
authentication (API key auth is insufficient).

### Key Features

1. **Peer Discovery** -- `list_peers` finds other Claude Code instances,
   filterable by machine, directory, or repository.

2. **Instant Messaging** -- `send_message` delivers messages to peers via
   channel push protocol. Messages arrive in real-time without polling.

3. **Auto-Summaries** -- with an OpenAI API key, each session auto-generates a
   context summary (directory structure, git branch, recent files) so peers know
   what each session is working on. Without the key, Claude sets summaries
   manually via `set_summary`.

4. **Broker Architecture** -- centralized daemon on localhost:7899 with SQLite
   database. Handles peer registration, heartbeats, message routing, and dead
   peer cleanup.

5. **CLI Inspection** -- `bun cli.ts status`, `bun cli.ts peers`,
   `bun cli.ts send <id> <msg>`, `bun cli.ts kill-broker` for management outside
   Claude sessions.

6. **Fallback Polling** -- `check_messages` tool for when channel push is
   unavailable.

### Configuration

| Variable            | Default            | Purpose                             |
| ------------------- | ------------------ | ----------------------------------- |
| `CLAUDE_PEERS_PORT` | 7899               | Broker listening port               |
| `CLAUDE_PEERS_DB`   | ~/.claude-peers.db | SQLite database path                |
| `OPENAI_API_KEY`    | (optional)         | Enables gpt-5.4-nano auto-summaries |

### Claude Code Workflow Integration

**This tool solves a real gap in Claude Code's current architecture**: parallel
sessions cannot communicate. When running development teams or multiple agents
from separate terminals, there is no built-in way for them to share findings or
coordinate.

**Potential SoNash value:**

- **Multi-window coordination**: When running `/session-end` in one terminal
  while another terminal is doing research, the sessions could share context.
- **Agent team enhancement**: SoNash's AGENT_ORCHESTRATION.md describes parallel
  agent patterns. Claude-Peers would let those agents (running in separate
  Claude Code instances) communicate natively.
- **Cross-project awareness**: If working on SoNash in one terminal and a
  related Firebase Functions project in another, peers could share relevant
  discoveries.
- **Lightweight**: Adds one MCP server and a small broker daemon. Does not
  replace any existing infrastructure.

### Windows Compatibility

**Status: Not yet supported, but fix is in progress.**

- **Issue #1** (OPEN): "Add Windows support" -- a PR addressing 5
  Windows-specific bugs:
  1. Missing `HOME` env var (Windows uses `USERPROFILE`) -- crashes broker.ts
  2. `URL.pathname` produces `/C:/...` instead of `C:/...` on Windows
  3. `bun` executable not found without full PATH -- fix uses `process.execPath`
  4. `ps` command doesn't exist on Windows -- platform check added
  5. MCP handshake timeout -- reversed initialization order

  A `start.cmd` launcher script was added for Windows MCP registration. Tested
  on Windows 11, Bun 1.3.11, Claude Code v2.1.81 -- all verified working.
  **Awaiting merge.**

- **Bun on Windows**: Bun has official Windows support. `bun install` and
  `bun run` work, though some edge cases remain in the Bun ecosystem.

- **Practical assessment**: Once PR #1 merges, Windows support should be
  functional. The fixes are platform-guarded (no Unix regressions). One tester
  confirmed success after manually setting `HOME`.

### Limitations & Concerns

1. **Very new project**: Created 2026-03-21 (2 days ago). Only 5 commits. No
   license specified. High risk of abandonment or breaking changes.

2. **Requires `--dangerously-skip-permissions`**: The channel protocol requires
   this flag, which disables Claude Code's permission safety checks. This is a
   significant security concern for production workflows.

3. **Issue #6 -- Tool name collision**: Claude sometimes uses the built-in
   `SendMessage` tool (from Claude Code's teams feature) instead of
   `mcp__claude-peers__send_message`. Messages silently go to the wrong
   destination. No fix merged yet.

4. **Issue #2 -- Fallback polling gaps**: `check_messages` returns empty when
   channel push is unavailable, meaning messages can be lost.

5. **Bun dependency**: Requires Bun runtime, not Node.js. Adds another runtime
   to manage. Though Bun works on Windows, it is less mature than Node.js on
   that platform.

6. **Localhost only**: No remote peer communication. All Claude Code instances
   must be on the same machine.

7. **No license**: No license file means default copyright applies. Technically
   you cannot legally modify or redistribute the code without explicit
   permission.

8. **claude.ai auth required**: API key authentication is insufficient. You must
   be logged in via claude.ai web auth, which ties usage to the consumer/Pro
   subscription.

---

## Comparative Assessment

| Dimension          | Ruflo                                           | Claude-Peers-MCP                             |
| ------------------ | ----------------------------------------------- | -------------------------------------------- |
| **Maturity**       | 10 months, 5,992 commits, v3.5.42               | 2 days, 5 commits, no version tag            |
| **Scope**          | Full orchestration platform (replaces workflow) | Single-purpose messaging (augments workflow) |
| **Stars**          | 23,281                                          | 815                                          |
| **Windows**        | Fixed (v3.5.6+), but secondary platform         | PR pending, tested working                   |
| **Complexity**     | Very high (60+ agents, vector DBs, RL routing)  | Very low (broker + MCP server)               |
| **SoNash overlap** | High (replaces hooks, agents, memory, skills)   | None (fills a gap, doesn't replace anything) |
| **Risk**           | Lock-in, complexity, ongoing Windows edge cases | Abandonment, no license, security flags      |
| **Install effort** | `npx ruflo@latest init` (then extensive config) | Clone + `bun install` + 1 MCP registration   |
| **Cost**           | Free (MIT), but complex to maintain             | Free, minimal maintenance                    |

## Recommendations for SoNash Workflow

### Claude-Peers-MCP: WATCH (adopt after Windows PR merges + license added)

The concept is valuable -- SoNash uses parallel agents and multiple terminal
sessions. Being able to have those sessions communicate would enhance the agent
orchestration already in place. However:

- Wait for Issue #1 (Windows support) to merge
- Wait for a license to be added (or fork and self-maintain)
- The `--dangerously-skip-permissions` requirement is a blocker for production
  use
- Monitor Issue #6 (tool name collision) -- this is a usability problem

If the project gains traction and addresses these concerns, it would be a
natural lightweight addition to the SoNash stack.

### Ruflo: NOT RECOMMENDED for SoNash

The overlap with existing SoNash infrastructure is too high. SoNash already has:

- Agent orchestration (AGENT_ORCHESTRATION.md, Task/Team agents)
- 17+ hooks with pre-commit, pre-push pipelines
- Skills system with 42+ skills
- Memory persistence (MCP memory server)
- Session management (/session-end, SESSION_CONTEXT.md)

Adopting Ruflo would mean either replacing all of that (massive migration, loss
of customization) or running both systems in parallel (complexity explosion).
The token optimization claims are interesting but unvalidated for SoNash's
workload patterns. The 390 open issues and Windows-as-secondary-platform status
add risk.

If token cost becomes a critical concern, investigate Ruflo's WASM Agent Booster
concept in isolation rather than adopting the full platform.

---

## Sources

- [ruvnet/ruflo](https://github.com/ruvnet/ruflo) -- GitHub repository
- [louislva/claude-peers-mcp](https://github.com/louislva/claude-peers-mcp) --
  GitHub repository
- [Ruflo Windows daemon fix (Issue #1282)](https://github.com/ruvnet/ruflo/issues/1282)
- [Claude-Peers Windows support (Issue #1)](https://github.com/louislva/claude-peers-mcp/issues/1)
- [Claude-Peers tool collision (Issue #6)](https://github.com/louislva/claude-peers-mcp/issues/6)
- [Ruflo MCP server Windows failure (Issue #601)](https://github.com/ruvnet/ruflo/issues/601)
- [Ruflo hook package name issue (Issue #1014)](https://github.com/ruvnet/ruflo/issues/1014)
- [Ruflo Windows installation discussion (#690)](https://github.com/ruvnet/ruflo/discussions/690)
- [Ruflo review -- Medium](https://medium.com/@ishank.iandroid/ruflo-the-orchestrator-that-changed-how-i-build-multi-agent-ai-for-claude-f9d210aca1aa)
- [Developer's Guide to Autonomous Coding Agents -- SitePoint](https://www.sitepoint.com/the-developers-guide-to-autonomous-coding-agents-orchestrating-claude-code-ruflo-and-deerflow/)
- [claude-flow -- npm](https://www.npmjs.com/package/claude-flow)
