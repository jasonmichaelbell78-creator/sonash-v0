# External Agent Research

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-17
**Status:** ACTIVE
**Source:** Session #225, Phase 1 Step 1.3 (external-scout)
<!-- prettier-ignore-end -->

## Executive Summary

Multiple high-quality open-source repositories provide 100-150+ agent
definitions each, with compatible frontmatter format. The official Anthropic
spec supports advanced features (persistent memory, hooks, skills injection,
isolation worktrees) that our 36-agent ecosystem could leverage.

---

## Source 1: Anthropic Official Documentation

### Frontmatter Specification (Authoritative)

| Field             | Required | Our Usage    |
| ----------------- | -------- | ------------ |
| `name`            | Yes      | Used         |
| `description`     | Yes      | Used         |
| `tools`           | No       | Used         |
| `disallowedTools` | No       | **NOT USED** |
| `model`           | No       | Used         |
| `permissionMode`  | No       | **NOT USED** |
| `maxTurns`        | No       | **NOT USED** |
| `skills`          | No       | **NOT USED** |
| `mcpServers`      | No       | **NOT USED** |
| `hooks`           | No       | **NOT USED** |
| `memory`          | No       | **NOT USED** |
| `background`      | No       | **NOT USED** |
| `isolation`       | No       | **NOT USED** |

**11 unused frontmatter fields** represent significant untapped capability.

### Built-in Subagents

- Explore (Haiku, read-only), Plan (inherit, read-only), General-purpose
  (inherit, all tools), Bash (inherit), statusline-setup (Sonnet), Claude Code
  Guide (Haiku)

---

## Source 2: GitHub Repositories

### Tier 1: Mega-Collections

| Repository                              | Stars | Agents                             | Quality                                                  |
| --------------------------------------- | ----- | ---------------------------------- | -------------------------------------------------------- |
| VoltAgent/awesome-claude-code-subagents | 14.1k | 127+                               | High — proper frontmatter, community contributions       |
| wshobson/agents                         | —     | 112 agents, 72 plugins, 146 skills | High — three-tier model strategy, workflow orchestrators |
| VoltAgent/awesome-agent-skills          | —     | 500+ skills                        | Cross-platform                                           |
| contains-studio/agents                  | —     | 40+                                | Medium — 6-day sprint context, auto-triggering           |
| lst97/claude-code-sub-agents            | —     | 33                                 | Clean, focused                                           |

### Tier 2: Meta-Directories

| Repository                       | Stars | Content                                               |
| -------------------------------- | ----- | ----------------------------------------------------- |
| hesreallyhim/awesome-claude-code | 28.7k | Meta-directory — skills, agents, hooks, orchestrators |

### Unique Agents NOT in Our Ecosystem

Penetration Tester, Chaos Engineer, Compliance Auditor, Legacy Modernizer, MCP
Developer, Knowledge Synthesizer, Multi-Agent Coordinator, Competitive Analyst,
Trend Analyst

---

## Source 3: Superpowers Ecosystem

**Stars:** 40.9k | **Status:** Official Anthropic plugin marketplace

### Importable Prompt Engineering Techniques

1. **Role framing as persona** — forces execution mode, not decision mode
2. **Rigid vs. Flexible skill types** — TDD/debugging follow exactly; patterns
   adapt
3. **Two-stage review** — spec compliance THEN code quality (prevents nitpicking
   while missing requirements)
4. **Task granularity** — 2-5 minute tasks with exact file paths and
   verification steps
5. **Structured workflow sequencing** — brainstorm → git setup → planning →
   execution → review

---

## Source 4: Community Patterns

### Key Techniques

1. **Identity-Rules-Output** three-part system prompt structure
2. **Context as finite resource** — minimal, focused agent prompts
3. **3-5 examples in XML tags** — distinguish examples from instructions
4. **"Use proactively" in description** — encourages auto-delegation
5. **Least-privilege tool scoping** — always explicitly list tools

### Notable Community Tools

- **Engram**: Persistent memory (Go binary, SQLite + FTS5, MCP server)
- **claude-mem**: Auto-captures session activity, compresses with AI
- **Claude Squad**: Multiple Claude instances in separate workspaces
- **cc-tools**: Go implementation of hooks with smart linting

---

## Source 5: CrewAI / AutoGen / MetaGPT Patterns

### Transferable Patterns

| Framework | Pattern                                | Applicable?                                     |
| --------- | -------------------------------------- | ----------------------------------------------- |
| CrewAI    | Role-based team organization           | Already using — teams follow this               |
| AutoGen   | Event-driven multi-agent conversations | Maps to SendMessage/TaskList                    |
| MetaGPT   | SOP-encoded prompt sequences           | Could adopt structured output formats           |
| LangGraph | Stateful graph orchestration           | Could benefit from explicit state checkpointing |

### Framework Selection Heuristic

- Flowchart with loops → graph-based orchestration
- Conversation thread → message-passing coordination
- Job description board → role-based team assignment

---

## Recommendations

### Immediate Wins (Low Effort, High Value)

1. Add `memory: project` to code-reviewer and debugger agents
2. Add `disallowedTools` to read-only agents (explicit least-privilege)
3. Add "Use proactively" to agents that should auto-trigger
4. Import two-stage review pattern into code-reviewer

### Medium-Term Improvements

5. Add `isolation: worktree` to agents that modify code
6. Create workflow orchestrator agents (modeled on wshobson's 16 prebuilt)
7. Import Trail of Bits security methodology into security-auditor
8. Add `hooks` to agents for validation (lint after edit, validate bash)

### Strategic Additions (New Agents)

9. Compliance auditor (privacy-first focus aligns with SoNash)
10. Legacy modernizer (Firebase/Next.js version upgrades)
11. Performance profiler (dedicated perf agent)

---

## T20 Convergence Tally

| Pass | Confirmed | Corrected | Extended | New |
| ---- | --------- | --------- | -------- | --- |
| 1    | 12        | 0         | 0        | 12  |
| 2    | 12        | 0         | 4        | 4   |
| 3    | 16        | 0         | 3        | 1   |
| 4    | 20        | 0         | 0        | 0   |
| 5    | 20        | 0         | 0        | 0   |

**Convergence: STRICT** (Pass 5 = 0 corrections, 0 new)
