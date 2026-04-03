# SQ-002: AI-Powered CLI Tools Beyond Claude Code

**Research Date:** 2026-03-23 **Depth:** L1 (Exhaustive) **Search Rounds:** 8
**Sources Consulted:** 40+ (GitHub repos, official docs, comparison articles,
curated lists)

---

## Executive Summary

The AI CLI tool landscape in 2025-2026 has exploded. Beyond Claude Code, Gemini
CLI, and Codex CLI (which the user already has), there are **70+ terminal-native
AI coding agents**. This document catalogs the most relevant ones organized by
category, with emphasis on tools that could complement the user's existing
Claude Code workflow on Windows 11.

**Key finding:** The biggest gap in the user's current setup is not another
coding agent (Claude Code is best-in-class for that), but rather
**orchestration/parallelization tools**, **specialized review tools**, and
**infrastructure that makes Claude Code more powerful**.

---

## Category 1: Full AI Coding Agents (Competitors to Claude Code)

These are direct competitors. The user already has the top 3 (Claude Code,
Gemini CLI, Codex CLI). Listed for completeness and for cases where a different
model or approach is needed.

### Aider

- **What:** AI pair programming in your terminal with deep git integration
- **URL:** https://github.com/Aider-AI/aider
- **Install:** `python -m pip install aider-install && aider-install`
- **Stars/Activity:** 42.3k stars, actively maintained, 169 contributors
- **Windows:** Yes (Python-based, cross-platform)
- **Differentiator:** Every edit is a git commit. Maps entire codebase via
  repo-map. Supports 100+ LLMs including local models via Ollama. Auto-lints and
  auto-tests after every change. Voice input supported.
- **Complement vs Compete:** COMPLEMENT. Use Aider when you want
  git-commit-per-edit granularity, or need to use a different model (DeepSeek,
  local Ollama) for cost reasons. Can use Claude as its backend model.
- **Workflow fit:** Good for quick targeted edits where you want every change
  atomically committed. Also useful for experimenting with cheaper/local models
  on routine tasks.
- **Confidence:** HIGH (42k stars, 4.1M installs, extremely well-documented)

### OpenCode (archived) / Crush (successor)

- **What:** Terminal-native TUI with 75+ LLM providers, built in Go
- **URL:** https://github.com/opencode-ai/opencode (archived) /
  https://github.com/charmbracelet/crush (active successor)
- **Install:** OpenCode: `curl -fsSL ... | bash` or `go install`. Crush: via Go
  install or binary releases
- **Stars/Activity:** OpenCode had 122k stars (archived Sep 2025). Crush (by
  Charm team) has 21.6k stars, actively developed.
- **Windows:** Partial (no native Windows installer; Go binaries may work, WSL
  recommended)
- **Differentiator:** Beautiful TUI interface built with Bubble Tea.
  Multi-provider flexibility. LSP integration. Crush adds "glamorous" terminal
  UI and skills system.
- **Complement vs Compete:** COMPETE. Similar agentic CLI paradigm to Claude
  Code but model-agnostic.
- **Workflow fit:** Limited value when Claude Code is already primary. Could be
  useful if exploring non-Anthropic models. Note: Anthropic blocked OpenCode
  from using Claude consumer subscriptions in Jan 2026.
- **Confidence:** MEDIUM (OpenCode archived, Crush is new and evolving)

### Goose (Block/Square)

- **What:** Open-source extensible AI agent that goes beyond code suggestions --
  installs, executes, edits, tests with any LLM
- **URL:** https://github.com/block/goose
- **Install:** CLI install script, Desktop app, or Docker. PowerShell script
  (`download_cli.ps1`) available for Windows.
- **Stars/Activity:** 33.5k stars, 350+ contributors, v1.28.0 (Mar 2026), Apache
  2.0
- **Windows:** Yes (PowerShell install script available)
- **Differentiator:** Deep MCP integration, Apache 2.0 license, contributed to
  Linux Foundation's Agentic AI Foundation. Designed for on-device
  extensibility. Block deployed to all 12,000 employees.
- **Complement vs Compete:** COMPETE primarily, but MCP extensions could
  complement. Its MCP server ecosystem may have servers useful with Claude Code
  too.
- **Workflow fit:** Less relevant as primary agent (Claude Code is stronger),
  but its MCP server catalog could be mined for useful integrations.
- **Confidence:** HIGH (33k stars, major corporate backing, active development)

### GitHub Copilot CLI

- **What:** GitHub's agentic CLI bringing Copilot coding agent to your terminal
- **URL:** https://github.com/github/copilot-cli
- **Install:** `winget install GitHub.Copilot` (Windows), npm, Homebrew, shell
  script
- **Stars/Activity:** 9.5k stars, v1.0.10 (Mar 2026), GA since Feb 2026
- **Windows:** Yes (native WinGet install, PowerShell v6+ required)
- **Differentiator:** Deep GitHub integration -- natural language access to
  repos, issues, PRs. Plan mode and autopilot mode. Included with all Copilot
  plans (including Free tier). MCP extensibility.
- **Complement vs Compete:** COMPLEMENT. Not for primary coding (Claude Code is
  better), but excellent for GitHub-specific workflows: querying issues, PR
  management, repo exploration.
- **Workflow fit:** Strong complement for GitHub operations. Use it for
  `copilot explain`, PR summaries, issue triage. Works alongside Claude Code
  without conflict.
- **Confidence:** HIGH (GA product, backed by GitHub/Microsoft, native Windows
  support)

### Kiro CLI (AWS)

- **What:** AWS's spec-driven AI coding agent with autonomous multi-day task
  capability
- **URL:** https://kiro.dev/ | Successor to Amazon Q Developer CLI
- **Install:** Available via Kiro IDE or CLI (successor to
  `amazon-q-developer-cli`)
- **Stars/Activity:** Amazon Q CLI had 1.9k stars (now in maintenance mode,
  redirects to Kiro). Kiro is actively developed.
- **Windows:** Unclear (Amazon Q CLI was macOS/Linux only; Kiro availability
  TBD)
- **Differentiator:** Spec-driven development -- generates requirements,
  designs, and test plans BEFORE coding. Autonomous agent can work for
  hours/days unattended. Built on Amazon Bedrock. IAM Identity Center support
  for teams.
- **Complement vs Compete:** COMPETE (different philosophy: spec-first vs
  interactive)
- **Workflow fit:** Potentially useful for large features where you want
  structured spec generation before implementation. Could generate specs that
  Claude Code then implements.
- **Confidence:** MEDIUM (relatively new GA, AWS backing is strong but CLI
  maturity is uncertain)

### Amp (Sourcegraph)

- **What:** Coding agent with deep codebase intelligence, built by Sourcegraph
- **URL:** https://sourcegraph.com/amp | https://ampcode.com/
- **Install:** VS Code extension or CLI (`amp` command)
- **Stars/Activity:** Closed-source, no public star count. Active development
  with JetBrains support added 2025-2026.
- **Windows:** Yes (via VS Code extension; CLI availability may vary)
- **Differentiator:** Unlimited token usage (no token constraints on paid
  plans). Subagent parallelization. Built on Sourcegraph's code graph for
  cross-repo intelligence. Thread sharing for teams.
- **Complement vs Compete:** COMPETE (similar agentic paradigm)
- **Workflow fit:** Limited additional value for a solo developer already using
  Claude Code. Its strength is enterprise multi-repo intelligence.
- **Confidence:** MEDIUM (closed-source, Sourcegraph backing)

### Cursor CLI

- **What:** Cursor's official command-line agent for terminal-based AI coding
- **URL:** https://cursor.com/cli
- **Install:** Available through Cursor application
- **Stars/Activity:** Closed-source. Cursor CLI shipped Jan 2026.
- **Windows:** Yes (Cursor supports Windows)
- **Differentiator:** Interactive and headless modes. Integrates with Cursor's
  broader IDE ecosystem. Multiple model access (Anthropic, OpenAI, Gemini).
- **Complement vs Compete:** COMPETE
- **Workflow fit:** Minimal additional value if already using Claude Code
  CLI-first. Cursor's strength is the IDE, not the CLI.
- **Confidence:** MEDIUM (new CLI product, Cursor is well-funded)

---

## Category 2: Agent Orchestrators & Session Managers (HIGHEST COMPLEMENT VALUE)

These tools make Claude Code itself more powerful by enabling parallel
execution, session management, and multi-agent coordination. **This is the
category with the most complementary value.**

### Claude Squad

- **What:** Terminal app for managing multiple Claude Code (and other agent)
  sessions simultaneously
- **URL:** https://github.com/smtg-ai/claude-squad
- **Install:** `brew install claude-squad` or curl install script
- **Stars/Activity:** 6.5k stars, v1.0.17 (Mar 2026), actively maintained
- **Windows:** No (requires tmux, Unix-only). WSL may work.
- **Differentiator:** Run multiple Claude Code instances in isolated git
  worktrees. Background auto-accept mode. Review changes before merging. Session
  pause/resume.
- **Complement vs Compete:** STRONG COMPLEMENT. Multiplies Claude Code's
  effectiveness.
- **Workflow fit:** Run 3-5 Claude Code sessions in parallel on different
  features/tasks. Review and merge results. Requires WSL on Windows.
- **Confidence:** HIGH (6.5k stars, purpose-built for Claude Code)

### Agent Deck

- **What:** Terminal session manager -- one TUI for Claude, Gemini, OpenCode,
  Codex, and more
- **URL:** https://github.com/asheshgoplani/agent-deck
- **Install:** curl install script, Homebrew, or `go install`
- **Stars/Activity:** 1.7k stars, last commit Mar 23 2026, actively maintained
- **Windows:** Yes via WSL (documented: "macOS, Linux, Windows (WSL)")
- **Differentiator:** Multi-agent management with status detection, session
  forking with context inheritance, MCP manager, Docker sandboxing, cost
  tracking across 9 AI models, Conductor agents for orchestration with
  Telegram/Slack integration. Socket pooling reduces MCP memory by 85-90%.
- **Complement vs Compete:** STRONG COMPLEMENT. Agent-agnostic session manager.
- **Workflow fit:** Manage Claude Code + Gemini CLI + Codex CLI sessions from
  one interface. Fork conversations, track costs, monitor agent status.
  Conductors can automate oversight.
- **Confidence:** HIGH (actively developed, purpose-built for the multi-agent
  workflow)

### vibe-kanban

- **What:** Kanban interface for AI agent task administration
- **URL:** https://github.com/BloopAI/vibe-kanban
- **Stars/Activity:** 23.4k stars
- **Windows:** Unknown (likely WSL)
- **Differentiator:** Visual kanban board for managing agent work items
- **Complement vs Compete:** COMPLEMENT (orchestration layer)
- **Workflow fit:** Project management layer over multiple agent sessions.
- **Confidence:** MEDIUM (high stars but less documented for this use case)

### claude-flow

- **What:** Multi-agent swarm coordination for Claude Code
- **URL:** https://github.com/ruvnet/claude-flow
- **Stars/Activity:** 21.6k stars
- **Windows:** Unknown
- **Differentiator:** Swarm-style coordination of multiple Claude Code instances
  working on related tasks
- **Complement vs Compete:** STRONG COMPLEMENT
- **Workflow fit:** For large multi-file features, coordinate multiple Claude
  instances working in parallel.
- **Confidence:** MEDIUM (high stars, specific to Claude workflow)

### cmux

- **What:** Platform for parallel AI agent execution
- **URL:** https://github.com/manaflow-ai/cmux
- **Stars/Activity:** 8.1k stars
- **Windows:** Unknown
- **Differentiator:** Purpose-built for running multiple agents in parallel
- **Complement vs Compete:** COMPLEMENT
- **Workflow fit:** Parallelization infrastructure for multi-agent workflows.
- **Confidence:** MEDIUM

---

## Category 3: AI Code Review Tools (COMPLEMENT)

These review code that Claude Code writes, providing a second set of AI eyes.

### CodeRabbit CLI

- **What:** AI code review in your terminal with context-aware feedback and
  line-by-line suggestions
- **URL:** https://www.coderabbit.ai/cli
- **Install:** `curl -fsSL https://cli.coderabbit.ai/install.sh | sh`
- **Stars/Activity:** Commercial product with free CLI tier. MCP support added.
- **Windows:** Likely via WSL (installer is bash script)
- **Differentiator:** Integrates directly with Claude Code for autonomous dev
  loops: Claude writes code, CodeRabbit reviews, Claude fixes. Auto unit test
  generation. Pre-merge checks.
- **Complement vs Compete:** STRONG COMPLEMENT. Reviews code Claude Code
  produces.
- **Workflow fit:** Add as a review step after Claude Code makes changes. The
  MCP integration means Claude Code can trigger CodeRabbit reviews
  automatically.
- **Confidence:** HIGH (commercial product, documented Claude Code integration)

### PR-Agent (Qodo)

- **What:** Open-source AI-powered pull request review agent
- **URL:** https://github.com/qodo-ai/pr-agent
- **Install:** `pip install pr-agent` or Docker or GitHub Action
- **Stars/Activity:** 10.6k stars, v0.32 (Feb 2026), AGPL-3.0
- **Windows:** Yes (Python-based, pip install)
- **Differentiator:** Four core commands: `/describe`, `/review`, `/improve`,
  `/ask`. Multi-platform (GitHub, GitLab, Bitbucket). Handles small and large
  PRs with compression strategy. Open source.
- **Complement vs Compete:** STRONG COMPLEMENT. AI review layer for PRs.
- **Workflow fit:** Run `/review` and `/improve` on PRs created by Claude Code.
  Can be automated via GitHub Action. The user already has a review workflow --
  this could augment it.
- **Confidence:** HIGH (10.6k stars, actively maintained, multi-platform)

---

## Category 4: AI-Augmented Terminal & Developer Tools (COMPLEMENT)

### Warp Terminal

- **What:** Modern terminal with built-in AI agents, command completion, and
  agentic development environment
- **URL:** https://www.warp.dev/
- **Install:** Desktop application (macOS, Linux, Windows)
- **Stars/Activity:** 26.2k stars (open-source terminal component), commercial
  product
- **Windows:** Yes (native Windows support)
- **Differentiator:** AI is built INTO the terminal itself, not a separate CLI
  tool. Agents have "full terminal use" -- can run interactive commands and
  verify changes. Multiple agents run simultaneously. Integrated code review for
  agent-generated diffs.
- **Complement vs Compete:** COMPLEMENT (it's a terminal, not a coding agent).
  Could replace Windows Terminal/Git Bash as the terminal in which Claude Code
  runs.
- **Workflow fit:** Run Claude Code inside Warp to get AI-augmented terminal
  features (command suggestions, error explanation) on top of Claude Code's
  agentic capabilities. The agents layer adds additional automation.
- **Confidence:** HIGH (well-funded, native Windows, 3.2B lines edited in 2025)

### Zed Editor (with Agent Panel)

- **What:** High-performance open-source editor with built-in AI agent panel and
  CLI agent support
- **URL:** https://zed.dev/
- **Install:** Desktop application
- **Stars/Activity:** Major open-source project, active development
- **Windows:** Not yet (macOS and Linux only as of Mar 2026)
- **Differentiator:** Can run Claude Code, Gemini CLI, and Codex as external
  agents via ACP (Agent Client Protocol). WASM-based UI at 120fps.
  Multi-provider model flexibility. MCP workflow support.
- **Complement vs Compete:** COMPLEMENT (editor that hosts CLI agents)
- **Workflow fit:** NOT AVAILABLE on Windows. Monitor for future Windows
  release.
- **Confidence:** HIGH for quality, LOW for Windows availability

---

## Category 5: Specialized / Niche Tools

### SWE-agent

- **What:** Agent for autonomously resolving GitHub issues and creating PRs
- **URL:** https://github.com/SWE-agent/SWE-agent
- **Stars/Activity:** 18.8k stars
- **Windows:** Unknown (Python-based, likely WSL)
- **Differentiator:** Purpose-built for issue resolution. Give it a GitHub
  issue, it produces a PR. Research-grade agent from Princeton.
- **Complement vs Compete:** COMPLEMENT (specialized for issue-to-PR pipeline)
- **Workflow fit:** Could automate bug-fix PRs for well-specified issues.
- **Confidence:** MEDIUM (research-focused, may need tuning)

### Open Interpreter

- **What:** Terminal tool that lets LLMs run code and automate computer tasks
- **URL:** https://github.com/OpenInterpreter/open-interpreter
- **Stars/Activity:** 63k stars
- **Windows:** Yes (Python-based)
- **Differentiator:** Not coding-focused -- it's a general-purpose terminal AI
  that can execute arbitrary code, browse the web, manipulate files, automate OS
  tasks. Computer Use capabilities.
- **Complement vs Compete:** COMPLEMENT (different use case -- automation, not
  coding)
- **Workflow fit:** Useful for non-coding automation tasks: file management,
  data processing, system administration scripts. Different domain than Claude
  Code.
- **Confidence:** HIGH (63k stars, well-established)

### gptme

- **What:** Terminal assistant that runs code and browses the web
- **URL:** https://github.com/gptme/gptme
- **Stars/Activity:** 4.2k stars
- **Windows:** Likely (Python-based)
- **Differentiator:** Lightweight, minimal, focused on code execution and web
  browsing from terminal. Self-correcting code execution.
- **Complement vs Compete:** COMPETE (lighter weight, less capable)
- **Workflow fit:** Minimal value alongside Claude Code.
- **Confidence:** LOW

### Qwen Code

- **What:** Alibaba's official CLI for Qwen coder models
- **URL:** https://github.com/QwenLM/qwen-code
- **Stars/Activity:** 20k stars
- **Windows:** Unknown
- **Differentiator:** Access to Qwen's coding models (strong on benchmarks, free
  tier available)
- **Complement vs Compete:** COMPETE
- **Workflow fit:** Could be useful for tasks where Qwen models outperform
  Claude (some benchmarks show strength in specific languages). Free API tier.
- **Confidence:** MEDIUM

### Trae Agent (ByteDance)

- **What:** ByteDance's research-friendly coding agent with modular architecture
- **URL:** https://github.com/bytedance/trae-agent
- **Stars/Activity:** 11k stars
- **Windows:** Unknown
- **Differentiator:** Research-grade modular architecture, ByteDance backing
- **Complement vs Compete:** COMPETE
- **Workflow fit:** Limited additional value for production workflows.
- **Confidence:** LOW

---

## Category 6: Agent Infrastructure & Utilities

### claude-code-router

- **What:** Route Claude Code requests to alternative LLM providers
- **URL:** https://github.com/musistudio/claude-code-router
- **Stars/Activity:** 29.9k stars
- **Windows:** Unknown
- **Differentiator:** Use Claude Code's interface but route to cheaper/different
  models for routine tasks
- **Complement vs Compete:** COMPLEMENT (makes Claude Code more cost-flexible)
- **Workflow fit:** Route simple Claude Code tasks to cheaper models, reserve
  Opus/Sonnet for complex work.
- **Confidence:** MEDIUM (may conflict with Anthropic ToS; verify before using)

### awesome-cli-coding-agents (reference list)

- **What:** Curated directory of 80+ terminal-native AI coding agents and
  orchestrators
- **URL:** https://github.com/bradAGI/awesome-cli-coding-agents
- **Stars/Activity:** Actively maintained reference list
- **Windows:** N/A (reference document)
- **Differentiator:** The most comprehensive catalog of CLI coding agents
  available
- **Complement vs Compete:** REFERENCE
- **Workflow fit:** Bookmark for staying current on new tools.
- **Confidence:** HIGH

---

## Recommended Stack for the User

Based on the user's existing setup (Claude Code primary, Gemini CLI + Codex CLI
installed, Windows 11 bash, Next.js/Firebase app, solo developer):

### Tier 1: Install Now (Highest Value)

| Tool                   | Why                                                          | Install                                                 |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| **GitHub Copilot CLI** | GitHub-native operations, free tier, native Windows          | `winget install GitHub.Copilot`                         |
| **Aider**              | Git-per-edit workflow, local model support, cost flexibility | `pip install aider-install`                             |
| **CodeRabbit CLI**     | AI review of Claude Code output, autonomous review loops     | `curl -fsSL https://cli.coderabbit.ai/install.sh \| sh` |

### Tier 2: Install If Using WSL (Requires WSL for Full Functionality)

| Tool             | Why                                                    | Install                      |
| ---------------- | ------------------------------------------------------ | ---------------------------- |
| **Agent Deck**   | Multi-agent session management for Claude+Gemini+Codex | curl install or `go install` |
| **Claude Squad** | Parallel Claude Code sessions with worktree isolation  | `brew install claude-squad`  |
| **PR-Agent**     | Open-source PR review automation                       | `pip install pr-agent`       |

### Tier 3: Monitor / Evaluate Later

| Tool              | Why                                                                    |
| ----------------- | ---------------------------------------------------------------------- |
| **Warp Terminal** | AI-augmented terminal (native Windows), could replace current terminal |
| **Kiro CLI**      | Spec-driven development, autonomous long-running tasks                 |
| **Goose**         | MCP server ecosystem worth mining                                      |
| **Zed Editor**    | When Windows support arrives                                           |

### Not Recommended (Redundant)

| Tool               | Why Skip                                     |
| ------------------ | -------------------------------------------- |
| **OpenCode/Crush** | Archived/new, Claude Code is better          |
| **Cursor CLI**     | Claude Code does everything it does          |
| **Amp**            | Enterprise-focused, solo dev doesn't need it |
| **Plandex**        | Winding down, no new users                   |

---

## Windows Compatibility Summary

| Tool               | Native Windows       | WSL   | Notes                   |
| ------------------ | -------------------- | ----- | ----------------------- |
| Claude Code        | Yes                  | Yes   | Already installed       |
| Gemini CLI         | Yes                  | Yes   | Already installed       |
| Codex CLI          | Yes                  | Yes   | Already installed       |
| GitHub Copilot CLI | **Yes (WinGet)**     | Yes   | Best Windows support    |
| Aider              | **Yes (pip)**        | Yes   | Python, cross-platform  |
| CodeRabbit CLI     | Likely WSL           | Yes   | Bash install script     |
| PR-Agent           | **Yes (pip)**        | Yes   | Python, cross-platform  |
| Agent Deck         | WSL only             | Yes   | Documented WSL support  |
| Claude Squad       | No                   | Maybe | Requires tmux           |
| Goose              | **Yes (PowerShell)** | Yes   | PS1 installer available |
| Warp               | **Yes**              | N/A   | Native Windows app      |
| Open Interpreter   | **Yes (pip)**        | Yes   | Python, cross-platform  |

---

## Source Quality Assessment

| Source Type                              | Count | Trust Level |
| ---------------------------------------- | ----- | ----------- |
| GitHub repos (official)                  | 25+   | HIGH        |
| Official product docs                    | 10+   | HIGH        |
| Curated awesome-lists                    | 3     | HIGH        |
| Comparison articles (Tembo, Faros, etc.) | 8+    | MEDIUM      |
| Dev.to / blog posts                      | 5+    | LOW-MEDIUM  |

**Cross-validation:** All tools with HIGH confidence were verified across 2+
independent sources (GitHub repo + official docs or independent review). Tools
with MEDIUM confidence had 1-2 sources. LOW confidence tools had limited
independent verification.

---

## Sources

- [awesome-cli-coding-agents](https://github.com/bradAGI/awesome-cli-coding-agents)
- [Aider GitHub](https://github.com/Aider-AI/aider)
- [Aider official site](https://aider.chat/)
- [OpenCode GitHub](https://github.com/opencode-ai/opencode)
- [Goose GitHub](https://github.com/block/goose)
- [GitHub Copilot CLI](https://github.com/github/copilot-cli)
- [GitHub Copilot CLI GA announcement](https://github.blog/changelog/2026-02-25-github-copilot-cli-is-now-generally-available/)
- [Amazon Q Developer CLI](https://github.com/aws/amazon-q-developer-cli)
- [Kiro official site](https://kiro.dev/)
- [Amp by Sourcegraph](https://sourcegraph.com/amp)
- [Cursor CLI](https://cursor.com/cli)
- [Claude Squad GitHub](https://github.com/smtg-ai/claude-squad)
- [Agent Deck GitHub](https://github.com/asheshgoplani/agent-deck)
- [CodeRabbit CLI](https://www.coderabbit.ai/cli)
- [CodeRabbit Claude Code integration guide](https://lgallardo.com/2026/02/10/coderabbit-claude-code-integration/)
- [PR-Agent GitHub](https://github.com/qodo-ai/pr-agent)
- [Warp Terminal](https://www.warp.dev/)
- [Zed Editor](https://zed.dev/)
- [SWE-agent GitHub](https://github.com/SWE-agent/SWE-agent)
- [Open Interpreter GitHub](https://github.com/OpenInterpreter/open-interpreter)
- [Tembo CLI tools comparison](https://www.tembo.io/blog/coding-cli-tools-comparison)
- [Faros AI coding agents review](https://www.faros.ai/blog/best-ai-coding-agents-2026)
- [KDnuggets top 5 agentic CLI tools](https://www.kdnuggets.com/top-5-agentic-coding-cli-tools)
- [DEV Community CLI agents roundup](https://dev.to/lightningdev123/top-5-cli-coding-agents-in-2026-3pia)
- [Plandex GitHub](https://github.com/plandex-ai/plandex)
- [Continue.dev GitHub](https://github.com/continuedev/continue)
- [claude-flow GitHub](https://github.com/ruvnet/claude-flow)
- [vibe-kanban GitHub](https://github.com/BloopAI/vibe-kanban)
- [claude-code-router GitHub](https://github.com/musistudio/claude-code-router)
