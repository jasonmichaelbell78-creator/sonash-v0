# OpenAI Codex Plugin for Claude Code — Research Report

**Topic:** OpenAI's Codex plugin for Claude Code — product analysis, workflow
fit for SoNash project, and strategic implications **Depth:** L1 (Exhaustive)
**Date:** 2026-04-03 **Synthesizer:** deep-research-synthesizer v1.1

---

## Executive Summary

OpenAI released `codex-plugin-cc` on March 30, 2026 — an official, open-source
(Apache 2.0) plugin that lets developers invoke OpenAI's Codex agent directly
from inside Anthropic's Claude Code CLI. It is the first official cross-vendor
AI coding integration: OpenAI built a product that runs inside a direct
competitor's environment. The plugin reached 11,000+ GitHub stars within 3 days
of launch, suggesting strong developer interest despite an unusual premise.

The plugin exposes six slash commands (`/codex:review`,
`/codex:adversarial-review`, `/codex:rescue`, `/codex:status`, `/codex:result`,
`/codex:cancel`, plus `/codex:setup`). Its primary value proposition is
cross-provider code review: when Claude writes code and then reviews its own
work, structural agreement bias ("grading your own homework") can obscure real
bugs. Routing the review to a model from a different company breaks this
sycophancy loop. Structured benchmarks support this — multi-model adversarial
review detected 80% of known bugs vs. 53% for the best single model alone
[D5-F5].

However, the plugin is immature (v1.0.2 with 85+ open issues as of April 2026),
has **two active blocking bugs on Windows** (Issues #116 and #113), and ships
with a known broken feature: the review gate's configuration bug (Issue #59)
causes the Stop hook to silently never activate despite appearing enabled. The
plugin is architecturally a subprocess wrapper — not a deep integration —
meaning it lacks the interactive TUI, session resume, multimodal input, and
autonomous cloud sandbox capabilities of native Codex.

**Recommendation for this user:** The plugin is not yet ready for daily SoNash
workflows on Windows. The Windows spawn bugs (#116, #113) are open blockers.
Even on a fixed platform, the review gate (the most powerful feature) has a
silent configuration bug. The strongest near-term option is a Level 1 SKILL.md
approach — a single markdown file in `.claude/skills/` that creates a functional
Claude-Codex review loop without installing the plugin at all — as a
zero-friction proof of concept. If cross-provider review proves valuable,
install the plugin after the Windows blockers are patched. Never enable the
review gate in SoNash's environment; it conflicts with the existing
`loop-detector.js` hook and would trigger uncontrolled Codex API costs on every
Claude response.

The strategic context matters: this plugin is not an isolated product decision.
It reflects a broader industry shift to multi-model workflows. 70% of developers
now use 2-4 AI tools simultaneously [D10-F4]. The "best model for each task"
paradigm is becoming infrastructure. Whether or not the Codex plugin
specifically is adopted, SoNash's existing `/pr-review` skill is already
designed to be tool-agnostic, positioning the project well to absorb future AI
reviewer integrations.

---

## Table of Contents

1. [Product Overview: What Codex Is](#1-product-overview)
2. [The Plugin: What It Does and How It Works](#2-the-plugin)
3. [Technical Architecture](#3-technical-architecture)
4. [Capabilities and Limitations](#4-capabilities-and-limitations)
5. [Security and Privacy](#5-security-and-privacy)
6. [Cost Analysis](#6-cost-analysis)
7. [SoNash Workflow Fit](#7-sonash-workflow-fit)
8. [Strategic Context: The Multi-Model Trend](#8-strategic-context)
9. [Plugin Ecosystem Implications](#9-plugin-ecosystem)
10. [Contradictions and Open Questions](#10-contradictions-and-open-questions)
11. [Unexpected Findings](#11-unexpected-findings)
12. [Gaps in Evidence](#12-gaps-in-evidence)
13. [Sources](#13-sources)
14. [Methodology](#14-methodology)

---

## 1. Product Overview: What Codex Is

### OpenAI Codex (April 2026 State)

OpenAI Codex is a cloud-based autonomous software engineering agent, integrated
directly into ChatGPT. It is not the old Codex language model from 2021; the new
Codex is a complete coding agent that operates on entire repositories
asynchronously in isolated cloud environments [D1-F1]. The defining
characteristic is asynchronous delegation: a developer assigns Codex a task,
Codex spins up an isolated container with the repository pre-loaded, works
independently for 1-30 minutes, and returns a pull request or diff for human
review [D1-F1].

**Current model lineup (April 2026):** [D1-F2, D11-F3]

- `gpt-5.4` — flagship; combines strong coding, reasoning, and agentic
  workflows; SWE-Bench Pro: 57.7%
- `gpt-5.4-mini` — fast and cost-efficient; recommended default for plugin use
- `gpt-5.3-codex` — coding specialist; SWE-Bench Pro: 56.8%
- `gpt-5.3-codex-spark` — research preview; 1,000+ tokens/sec; ChatGPT Pro only

Note: OpenAI stopped reporting SWE-Bench Verified scores after confirming
training data contamination across all frontier models [D1-F2]. All benchmark
figures should be treated with caution.

**Scale as of early 2026:** Codex had over 2 million weekly active users — a
fivefold increase since early 2026 [D1-F1]. The CLI (github.com/openai/codex) is
Apache 2.0 open source with 62K+ GitHub stars.

**How Codex differs from GitHub Copilot:** This is an architectural divergence,
not just a feature difference. Copilot is a real-time inline assistant. Codex is
an autonomous async agent. Copilot works during coding; Codex accepts a
delegated task and returns finished work. Many developers use both as
complementary tools [D1-F7].

---

## 2. The Plugin: What It Does and How It Works

### Identity and Origin

`codex-plugin-cc` is an official plugin built and published by OpenAI
(repository: `openai/codex-plugin-cc`) that enables developers to invoke Codex
from inside Claude Code. It was released March 30-31, 2026, under Apache 2.0.
The v1.0.2 patch followed the same day [D2-F1]. OpenAI's developer relations
lead (Dkundel) authored it, making it a first-party integration, not a community
experiment [D3-serendipity].

Anthropic had no documented involvement. No official Anthropic statement —
endorsement or objection — has been found [D2-F2].

### Commands

The plugin exposes seven commands [D2-F3]:

| Command                     | Purpose                                                                          |
| --------------------------- | -------------------------------------------------------------------------------- |
| `/codex:review`             | Read-only code review of uncommitted changes                                     |
| `/codex:adversarial-review` | Challenges design decisions, tradeoffs, failure modes; accepts custom focus text |
| `/codex:rescue`             | Delegates task execution to Codex as a subagent (bug investigation, fixes)       |
| `/codex:status`             | Shows running and recently completed background jobs                             |
| `/codex:result`             | Retrieves completed output with session ID for resumption                        |
| `/codex:cancel`             | Terminates a background job                                                      |
| `/codex:setup`              | Validates installation, manages optional review gate                             |

### The Review Gate (Optional)

An optional feature enabled via `/codex:setup --enable-review-gate` hooks into
Claude Code's `Stop` lifecycle event. When active, Codex automatically reviews
Claude's output before Claude Code exits a task. If the review detects issues,
it blocks the stop (returning `BLOCK:`) so Claude can address them [D2-F6].
**Important:** This feature has a known silent configuration bug (Issue #59) —
it writes state to a temp directory but reads from a different persistent
directory, causing the gate to appear enabled while never actually activating
[D4-F9].

### Why OpenAI Built This

The plugin solves two problems simultaneously [D2-F7]:

1. **For developers:** Enables a second AI model's perspective without
   context-switching
2. **For OpenAI (strategic):** Every `/codex:rescue` call generates OpenAI API
   revenue without requiring the developer to switch primary tools. Claude Code
   has an estimated $2.5B annualized run rate and generates ~135,000 daily
   GitHub commits [D8-F8, D10-F2]

---

## 3. Technical Architecture

### How the Plugin Works Internally

The plugin is NOT a deep MCP-style integration. It uses Claude Code's native
plugin infrastructure (markdown command files + session hooks + subprocess
execution) to shell out to a Node.js companion script [D2-F4]:

**Data flow:**

```
User Command (/codex:review, etc.)
  → Claude Code slash command handler
  → codex-companion.mjs (Node.js subprocess)
  → app-server-broker.mjs (Unix socket / Windows named pipe)
  → Codex app-server (local binary, JSON-RPC 2.0)
  → OpenAI API (cloud)
```

**Key components:** [D2-F4]

- **`codex-companion.mjs`:** Central entry point. Parses arguments, manages Git
  repo context, handles both foreground and background jobs
- **`app-server-broker.mjs`:** Multiplexer allowing multiple companion instances
  to share a single Codex process. Spawns the Codex binary with `detached: true`
  so it survives parent process termination
- **JSON-RPC 2.0:** Communication protocol with the Codex app-server (methods:
  `initialize`, `thread/start`, `review/start`, `turn/start`, `turn/interrupt`)
- **State management:** Persists to workspace-specific directories —
  `state.json` (job summary, capped at 50), `jobs/{id}.json` (full job
  definitions), `jobs/{id}.log` (timestamped logs)

**Session hooks:** Three lifecycle hooks [D2-F4]:

- `SessionStart` — captures session ID
- `SessionEnd` — shuts down broker, prunes completed jobs
- `Stop` — the review gate (900-second timeout)

### The Claude Code Plugin System

The plugin leverages Claude Code's plugin infrastructure, which launched in
public beta October 9, 2025 [D9-F1, D12-F1]. A plugin is a directory containing:

- `.claude-plugin/plugin.json` — manifest (optional; auto-discovery works
  without it)
- `commands/` or `skills/` — slash commands and skills
- `agents/` — subagent definitions
- `hooks/hooks.json` — event handlers
- `bin/` — executables added to Bash tool PATH
- `.mcp.json` — optional MCP server definitions

Plugin agents explicitly cannot use `hooks`, `mcpServers`, or `permissionMode`
in their frontmatter — a deliberate sandboxing restriction [D9-F3, D12-F2].

**Plugin vs. MCP distinction:** Plugins are the distribution/packaging layer;
MCP is the protocol layer. A plugin can bundle MCP servers (enabling one-command
team setup), but the plugin itself communicates via Claude Code's slash command
infrastructure — not MCP [D9-F9, D12-F8].

### Codex App Server Architecture

OpenAI published its unified App Server architecture in February 2026 [D1-F3].
One binary powers all Codex surfaces (CLI, VS Code, desktop apps, web) via
JSON-RPC streamed as JSONL over stdio. The protocol has three primitives:

- **Item:** atomic unit (user message, agent message, tool execution, diff)
- **Turn:** groups items from a single unit of agent work
- **Thread:** durable session container supporting creation, resumption,
  forking, and archival

OpenAI explicitly rejected MCP for internal surface unification because
"maintaining MCP semantics in a way that made sense for VS Code proved
difficult" — the richer session semantics (streaming diffs, approval flows,
thread persistence) did not map cleanly onto MCP's tool-oriented model [D1-F3].

---

## 4. Capabilities and Limitations

### What the Plugin Uniquely Enables

Capabilities that pure Claude Code standalone cannot provide [D4-F2]:

- **Cross-provider sycophancy protection:** A different model from a different
  company reviewing Claude's code catches issues rooted in model-architecture
  biases
- **Background job multiplexing:** Persistent broker session allows multiple
  concurrent review jobs without startup overhead
- **Subagent delegation within a Claude conversation:** `/codex:rescue`
  delegates execution to Codex while remaining in the Claude Code thread
- **Review gate quality pattern:** Optional Stop hook that blocks Claude from
  finalizing output until Codex approves (when working correctly)

### What the Plugin Cannot Do (vs. Native Codex)

The plugin is a subset of native Codex capabilities [D4-F1]:

- No interactive TUI (approve/reject controls, arrow-key draft navigation)
- No native session resume (`codex resume`)
- No multimodal input (image attachments, clipboard paste)
- No fuzzy file search (`@`)
- No external editor integration (`Ctrl+G`)
- No access to Codex's autonomous cloud sandbox for PR generation

### Active Bugs and Limitations (April 2026)

**Windows blockers:** [D4-F6]

- **Issue #116 (open):** `spawn codex ENOENT` — Node.js `spawn()` cannot execute
  `.cmd` shim files without `shell: true`. Prevents adversarial-review from
  running
- **Issue #113 (open):** Plugin install errors with corrupted error messages on
  Windows
- **EISDIR error:** `formatUntrackedFile()` crashes when `.claude/` or `data/`
  directories exist in `git status --short` output

**Feature bugs:** [D4-F7, D4-F9]

- **Issue #58:** Azure OpenAI/LiteLLM users report "not authenticated" — auth
  validator only accepts OAuth tokens
- **Issue #59:** Review gate silently non-functional (state file written to temp
  dir, read from different persistent dir)
- **Issue #122:** `/codex:rescue` has a 5-minute hard timeout — drops results on
  large PRs (30+ files, 2,000+ lines)
- **Issue #115:** Rescue stuck in infinite loop

**Review commands limitations:** [D4-F3, D4-F10]

- `/codex:review` is read-only; never applies changes
- `/codex:review` is not steerable — accepts no focus text or custom
  instructions
- Only `/codex:adversarial-review` accepts custom focus text

**Current maturity:** v1.0.2 with 85+ open issues as of April 2026 [D8-F3].

### Cross-Provider Review: The Core Value Claim

A structured benchmark pitting Claude, Gemini, Codex, Qwen, and MiniMax against
a known-bug test suite found [D5-F5]:

- Best single model: 53% bug detection
- Multi-model adversarial debate (5 rounds): 80% bug detection
- Hardest system-level bugs: 100% detection in debate mode

One real-world practitioner report found 4 correctness issues (silent no-ops,
state race conditions, premature navigation, orphaned requests) in a Chrome
extension redesign that Claude had not surfaced [D5-F2]. These were
semantic/behavioral bugs, not syntactic anti-patterns.

**Important caveat on false positives:** Codex reviews generate false positives
alongside real bugs. The recommended mitigation is using Claude as a filter
between Codex review output and code changes — validating each comment before
actioning [D5-serendipity].

---

## 5. Security and Privacy

### Data Flow: Code Reaches OpenAI's Cloud

When using the plugin for review or rescue operations, the data path is [D6-F1]:

```
Claude Code → codex-plugin-cc → local Codex CLI → Codex app-server → OpenAI API (cloud)
```

For cloud tasks (the default mode for review and rescue), OpenAI's Codex clones
the connected GitHub repository and checks it out at the selected branch into an
OpenAI-managed container. **The full repository is uploaded to OpenAI's cloud,
not just a diff.** The 192K token context window allows ingestion of large
codebases [D6-F1].

The local broker (Unix socket on macOS/Linux, named pipe on Windows) is a
privacy boundary — plugin-to-broker communication stays on-machine. Only the
Codex CLI's outbound API calls leave the machine [D6-F1].

### Data Retention and Training

| Account Type          | Retention         | Training Default                          |
| --------------------- | ----------------- | ----------------------------------------- |
| API key users         | 30-day abuse logs | NOT used for training (opt-out default)   |
| ChatGPT Free/Plus/Pro | Standard policy   | May be used for training unless opted out |
| Business/Enterprise   | Configurable      | Training disabled; ZDR available          |

**Critical nuance:** Codex has a separate "full environments" training toggle
independent of ChatGPT's general privacy settings and the API org settings.
Adjusting the ChatGPT interface does NOT affect this Codex-specific control — it
must be managed separately in Codex Settings [D6-F2, D6-F3].

**Recommendation for plugin users:** Authenticate with an API key rather than a
ChatGPT subscription for stronger default training protections. API key users
are opted out of training by default.

### The Review Gate Creates Data Intermingling

When the review gate is enabled, Claude Code's session code changes are sent to
OpenAI for review on every session stop [D6-F4]. Codex's review findings (from
OpenAI) then enter Claude's context window and are sent to Anthropic in
subsequent turns. Both companies receive the same codebase content through
different pathways [D6-F7].

### Patched Vulnerability: GitHub Token Exfiltration (February 2026)

BeyondTrust Phantom Labs disclosed a critical command injection vulnerability in
Codex (December 2025, patched February 5, 2026). The attack vector was the
GitHub branch name parameter — not sanitized during repo cloning in the cloud
sandbox. Impact: theft of GitHub User Access Tokens, enabling lateral movement
to private repositories and CI/CD systems [D6-F6].

**The patch is confirmed applied across all platforms including the CLI.**
However, the pattern reveals that Codex's cloud infrastructure processes git
metadata (branch names, commit messages) as potential injection vectors —
warranting ongoing scrutiny of Codex security advisories [D6-F6].

### SoNash-Specific Privacy Considerations

SoNash is a sobriety tracking app handling sensitive personal health data. While
the plugin reviews code (not user data), the code itself contains schema
definitions for `journal`, `daily_logs`, and `inventoryEntries`, Cloud Functions
logic revealing data models, and security wrapper implementations revealing
security architecture. Sending this to OpenAI creates two risks:

1. **Competitive intelligence exposure:** Security architecture details sent to
   a competing AI provider
2. **Training data risk on free/plus tiers:** Unless using an API key with ZDR,
   code and architecture may be used for model training

**The architecture exposure risk is inherent to the model and cannot be fully
mitigated.** API key authentication mitigates the training concern.

### Dual-Agent Attack Surface

Running two AI coding agents with simultaneous repo access doubles the trust
boundary surface [D6-F10]:

- Two independent breach histories and security postures affect your codebase
- GitHub tokens/OAuth credentials needed by both services
- No unified audit log across both platforms
- Prompt injection cross-contamination: review gate creates a feedback loop
  where Codex output influences Claude's next actions

### Credential Storage

Codex supports three credential storage modes [D6-F5]:

- `keyring` — OS credential store (highest security, recommended)
- `file` — `~/.codex/auth.json` (lowest; treat like a password)
- `auto` (default) — keychain if available, else file

The plugin does not manage credentials directly — it delegates entirely to the
Codex CLI.

### Open-Source Auditability

The plugin (`codex-plugin-cc`) and the Codex CLI are fully open source. The
plugin's hooks, broker, task packaging, and communication protocol are
auditable. What happens on OpenAI's servers (cloud execution, data retention
implementation, model processing) is not auditable — OpenAI's commitment to "no
training on API data" is policy-based, not cryptographically verifiable
[D6-F11].

---

## 6. Cost Analysis

### Subscription Structure

Codex has no standalone subscription — it is bundled with ChatGPT plans
[D11-F1]:

| Plan     | Monthly Cost | Codex Access                   | Relevant for SoNash   |
| -------- | ------------ | ------------------------------ | --------------------- |
| Free     | $0           | Temporary promo (time-limited) | Not reliable          |
| Plus     | $20          | Standard access                | Entry-level option    |
| Pro      | $200         | 6x higher limits               | High-volume workflows |
| Business | $30/user     | Pay-as-you-go credits          | Team environments     |

**The Free tier promotion is time-limited and should not be relied upon for
sustained workflow integration [D11-F8].**

### Usage Limits (5-Hour Rolling Window)

Usage resets on a 5-hour rolling window — no monthly caps, no overage charges on
subscriptions [D11-F2]:

| Model         | Plus (per 5h)         | Pro (per 5h) |
| ------------- | --------------------- | ------------ |
| GPT-5.4       | 33-168 local messages | 223-1,120    |
| GPT-5.4-mini  | 110-560               | 743-3,733    |
| GPT-5.3-Codex | 45-225                | 300-1,500    |

Cloud tasks (autonomous sandbox): Plus: 10/week; Pro: 50/week.

### Plugin Billing Mechanics

All Codex API calls made by the plugin count against the user's OpenAI plan
limits — completely independently of Anthropic billing [D3-F6]. There is no
surcharge for using Codex through the plugin vs. directly.

**Dual-billing reality:** Using both services simultaneously accumulates costs
on both platforms independently. No cross-service credit system exists. The
plugin README warns usage "contributes to your Codex usage limits" [D11-F7].

### Cost Optimization Guidance

**Model selection matters significantly.** Using `gpt-5.4` unintentionally (the
expensive default) vs `gpt-5.4-mini` (the budget option) can dramatically affect
OpenAI cost accumulation. Best practices [D3-F6, D4-F4]:

- Explicitly specify `--model gpt-5.4-mini` for standard reviews
- Use `--effort low` for routine tasks, `high` only for security-critical
  analysis
- Use `--background` to prevent foreground blocking
- Never enable the review gate for automated/unmonitored sessions

### Combined Cost Scenarios

| Configuration                           | Monthly Cost    | Notes                                      |
| --------------------------------------- | --------------- | ------------------------------------------ |
| Claude Code Pro + ChatGPT Plus          | $40             | Community calls this optimal for daily use |
| Claude Code Max (5x, $100) alone        | $100            | No cross-model review benefit              |
| Claude Code Pro ($20) + API key billing | $20 + per-token | More control; ~$2/day heavy use on GPT-5.4 |
| Claude Code Max + ChatGPT Pro           | $300            | High limits both sides                     |

Community consensus: "$40/month combined ($20+$20) often outperforms a single
$100/month Claude Max subscription" for developers needing daily continuity
[D5-F4].

---

## 7. SoNash Workflow Fit

This is the most important section for the user's decision. The user is a
non-developer director who uses AI-directed development through 260+ Claude Code
sessions for SoNash (Next.js/Firebase sobriety tracking app on Windows 11).

### Current Review Infrastructure

SoNash already has four external review bots: CodeRabbit, Qodo, SonarCloud, and
Gemini, plus a custom `/pr-review` skill (v4.6) that processes multi-source
convergence signals. The existing skill is explicitly tool-agnostic —
`AI_REVIEW_PROCESS.md` v3.0 states "Future tools — Process applies to any
AI-based code review system" [D7-F1].

### Recommendation Summary

| Use Case                                         | Recommendation                                        | Rationale                                                      |
| ------------------------------------------------ | ----------------------------------------------------- | -------------------------------------------------------------- |
| Standard code reviews                            | NOT recommended as default                            | Fourth/fifth reviewer adds noise; existing pipeline sufficient |
| Complex PRs (concurrency, state transitions)     | `/codex:review --background` after Windows bugs fixed | Selective use justified; catches semantic bugs                 |
| Architectural challenge on risky implementations | `/codex:adversarial-review "security assumptions"`    | Best case for adversarial review                               |
| Bug investigation                                | `/codex:rescue --background --model gpt-5.4-mini`     | Parallel investigation; results fed to Claude                  |
| Review gate                                      | NEVER enable                                          | Conflicts with loop-detector.js; uncontrolled cost             |
| Daily workflow                                   | Wait for Windows bug fixes                            | Issues #116, #113 are active blockers                          |

### Windows Blocking Bugs — Current State

The user's environment is Windows 11. Two active bugs block the plugin on
Windows [D4-F6]:

- **Issue #116:** `spawn codex ENOENT` — adversarial-review fails completely
- **Issue #113:** Plugin install errors during installation on Windows

No built-in workaround exists. Users must wait for upstream fixes or use WSL.
These bugs make the plugin unreliable for the user's primary environment.

### Review Gate is Explicitly Contraindicated

The review gate would conflict with SoNash's existing infrastructure in three
ways [D7-F4]:

1. **Conflicts with `loop-detector.js`:** SoNash already has a hook specifically
   designed to detect and break infinite loops. The review gate explicitly warns
   it "can create a long-running Claude/Codex loop and may drain usage limits
   quickly"
2. **Uncontrolled latency and cost:** The stop hook fires on every Claude
   response — for SoNash's high-frequency session style (260+ sessions,
   multi-file changes), this adds Codex API round-trip costs to every single
   write operation
3. **SoNash-context false positives:** Codex would flag `httpsCallable` wrapper
   patterns, `sanitizeError` usage, and other SoNash-idiomatic patterns as
   non-standard

Additionally, Issue #59 means the review gate silently does nothing even when
enabled. It is both broken and inadvisable.

### `/codex:adversarial-review` vs. SoNash's Contrarian-Challenger Agent

SoNash has a custom `contrarian-challenger` agent for Phase 3 of
`/deep-research`. The two tools fill different niches [D7-F2]:

| Dimension         | `contrarian-challenger`      | `/codex:adversarial-review` |
| ----------------- | ---------------------------- | --------------------------- |
| Input             | Research findings (markdown) | Source code diffs           |
| Domain            | Research validity            | Implementation correctness  |
| Steerability      | Fully configurable           | Accepts custom focus text   |
| Integration point | Phase 3 of `/deep-research`  | Pre-commit or pre-PR        |

Where adversarial review adds unique value: when implementing complex features
(memory system, debt-runner expansion), running it before creating a PR could
surface design-level objections that the existing `code-reviewer` agent —
focused on SoNash-specific anti-patterns — may not challenge.

**Caveat:** The existing `code-reviewer` agent applies SoNash-specific domain
knowledge (App Check, httpsCallable patterns, sanitizeError rules) that Codex
would lack. `/codex:adversarial-review` would catch broader architectural issues
but miss SoNash-idiomatic violations.

### `/codex:rescue` for Task Delegation

`/codex:rescue` enables actual task execution — bug investigation, fix attempts,
test failure diagnosis [D7-F3]. Best use case for SoNash: delegating isolated
technical investigations where codebase-specific tooling is not required (e.g.,
"why is this TypeScript type error occurring?", "investigate this race
condition"). Not suitable for fix implementation, which must go through SoNash's
review and pattern-check pipeline.

**Key limitation:** Codex agents cannot use SoNash's custom tools (20+ hooks,
skill ecosystem, `npm run patterns:check`). Rescue produces findings but cannot
execute SoNash-compliant fixes.

### The Level 1 SKILL.md Alternative

Before installing the plugin, a lower-friction validation approach exists
[D5-F8, D5-serendipity]:

A single `.claude/skills/codex-review/SKILL.md` file creates a functional
Claude-Codex review loop without the plugin. One practitioner reported 14 issues
detected across 3 rounds with zero additional tooling. This approach:

- Has no Windows bugs (it's just a markdown file)
- Has no review gate risk
- Requires no additional authentication setup
- Can be abandoned without cleanup

This is the recommended starting point before committing to the full plugin
setup.

### Integration Path if Adopted

When the Windows blockers are resolved, the cleanest integration path for SoNash
[D7-F8]:

1. **Code review integration:** Use `/codex:review` output as a "Mixed" source
   in the existing `/pr-review` pipeline. No skill changes needed — treat Codex
   output the same as Qodo or Gemini output. The existing DAS scoring framework
   and "2+ sources = elevate severity" rule naturally accommodate a Codex
   source.

2. **Model selection:** Always specify `--model gpt-5.4-mini --effort medium`
   unless the review is for security-critical code (use `--effort high`)

3. **Never enable the review gate.** Use manual invocation only.

4. **Authentication:** Use an OpenAI API key (not ChatGPT subscription) for
   better training data protections, given SoNash's health-data-adjacent code
   schemas.

### Cost Impact on SoNash

SoNash's current cost profile is Anthropic-only. Adding OpenAI billing creates a
second cost vector. The existing `track-agent-invocation.js` hook tracks Claude
agent invocations but would not track Codex plugin invocations, creating a
monitoring blind spot [D7-F6]. Manual tracking via `/codex:status` would be
needed.

**Recommended pricing approach:** ChatGPT Plus ($20/month) if adopting. API key
billing if usage is irregular and sparse (reviews on complex PRs only).

---

## 8. Strategic Context: The Multi-Model Trend

### The Plugin Reflects an Industry Shift

The Codex plugin is not an isolated product event. It reflects a structural
shift in how developers use AI tools. Key data points [D10-F4, D10-F8]:

- 70% of developers now use 2-4 AI tools simultaneously
- 15% use 5 or more
- Gartner reported a 1,445% surge in multi-agent system inquiries from Q1 2024
  to Q2 2025
- Over 51% of all code committed to GitHub in early 2026 was AI-generated or
  AI-assisted
- Stripe is reportedly generating and merging 1,000+ AI-authored PRs per week

The industry has named this: the "polyglot agent" model — a primary tool
supplemented by cross-platform plugins. The "best model for each task"
philosophy is now mainstream practice.

### Why OpenAI Built This Specifically

Claude Code's market dominance forced OpenAI's hand [D8-F8, D10-F2]:

- Claude Code has an estimated $2.5B annualized run rate
- Generates ~135,000 GitHub commits daily (~4% of all public GitHub commits)
- Claude Code has 5.2M VS Code marketplace installs vs. Codex's 4.9M

OpenAI's CEO of Applications reportedly called Claude Code's success an internal
"wake-up call." The plugin is distribution math: every `/codex:rescue` inside
Claude Code is OpenAI API revenue without requiring tool switching.

**Anthropic's response:** Official silence. Anthropic has made no public
statement about the plugin. The implicit dynamic: Claude Code's market position
is strong enough that a response is not needed. MCP — the open standard that
makes the plugin's architecture possible — is Anthropic's own protocol. OpenAI
is building on Anthropic's infrastructure to reach Anthropic's users [D8-F9].

### GitHub's Agent HQ: Multi-Model as Institution

GitHub's "Agent HQ" (February 2026) enables developers to run Claude, Codex, and
Copilot simultaneously on the same task, with each reasoning independently
[D10-F3]. This institutionalizes multi-model as a feature, not a workaround —
with unified governance (audit logging, usage metrics, policy controls). Claude
and Codex are now available to all Copilot Business and Pro users.

### The Scope Escalation Pattern

The plugin may not stay a code review tool. Issue #72 (community PR, open)
implements bidirectional model-switching — allowing individual Claude Code
agents to run on OpenAI models via a "thin-forwarder" pattern. Issue #1
(submitted Day 1) adds Gemini CLI extension support. The pattern: what started
as a code review plugin is already evolving toward a full multi-provider runtime
bridge [D8-F6, D8-F7].

---

## 9. Plugin Ecosystem Implications

### SoNash's Plugin Readiness

SoNash's existing `.claude/` directory structure (60+ skills, 34 agents, 20+
hooks) is directly convertible to a shareable Claude Code plugin. The official
docs include explicit migration guidance [D12-F9]:

```
.claude/skills/ → plugin/skills/
.claude/agents/ → plugin/agents/
hooks in settings.json → plugin/hooks/hooks.json
```

The primary behavioral change is namespacing: `/deep-research` becomes
`/sonash:deep-research`. No functional changes required.

### Official Anthropic Ecosystem

The Anthropic demo marketplace has 13 plugins including several directly
relevant to SoNash [D12-F4]:

- `code-review` — multi-agent PR review with confidence scoring (similar to
  SoNash's `/pr-review`)
- `pr-review-toolkit` — specialized PR review agents
- `hookify` — behavioral rules via markdown (analogous to CLAUDE.md guardrails)
- `ralph-wiggum` — iterative self-referential dev loops (similar to
  `/convergence-loop`)
- `feature-dev` — codebase exploration and architecture agents (similar to
  SoNash's GSD workflow)
- `plugin-dev` — AI-assisted plugin creation toolkit

The `plugin-dev` plugin is immediately useful for formalizing SoNash skills as
distributable plugins.

### Enterprise Controls

Enterprise administrators can enforce plugin governance via [D9-F8, D12-F6]:

- `strictKnownMarketplaces` — restrict to allowlisted marketplaces or block all
  third-party plugins
- `allowedChannelPlugins` — messaging bridge controls
- `allowManagedHooksOnly` — blocks all user/project/plugin hooks; only
  admin-defined hooks execute

These controls make the plugin system viable for enterprise deployment, not just
individual use.

---

## 10. Contradictions and Open Questions

### Contradictions Across Findings

| Topic                        | Position A                                                   | Position B                                                                                                   | Resolution                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Review gate value            | Official docs recommend for autonomous sessions              | Same docs warn it "drains usage limits quickly" and Issue #59 shows it's silently broken                     | **Broken and inadvisable** — both warnings are accurate; the feature should not be used until Issue #59 is patched                 |
| "Free" Codex access          | Plugin README says works with ChatGPT Free tier              | Official pricing flags Free access as a time-limited promotion                                               | **Both accurate but conflicting in implication.** Free works today but is not a reliable long-term plan                            |
| Token efficiency             | Codex uses 3-4x fewer tokens than Claude on identical tasks  | Per-session API costs are nearly equal ($4.59 vs $4.50)                                                      | **Not a contradiction** — efficiency difference is real but absorbed by flat-rate subscriptions; matters only for API-billed users |
| "Local" plugin communication | Some sources describe plugin as "local-only"                 | Plugin routes code to OpenAI's cloud via local Codex CLI                                                     | **Misleading framing.** Plugin-to-broker is local; Codex CLI to OpenAI is cloud. Code reaches OpenAI regardless                    |
| MCP vs. non-MCP architecture | Some journalism describes plugin as "MCP integration"        | Technical sources confirm it uses subprocess execution via JSON-RPC over Unix socket/pipe — not MCP protocol | **Not MCP.** The journalism uses MCP as a generic term for "integration" rather than the Model Context Protocol specifically       |
| SWE-Bench scores             | Early sources cite 72.1-83.8% SWE-Bench Verified for codex-1 | Later sources cite 56.8-57.7% SWE-Bench Pro                                                                  | **Different benchmarks, not the same metric.** OpenAI also confirmed training data contamination in SWE-Bench Verified             |
| Codex training toggle        | API users are opted out of training by default               | Codex has a separate "full environments" toggle independent of API settings                                  | **Unresolved gap.** The Codex-specific toggle default state for API users is not clearly documented. Verify manually               |

### Open Questions

1. **When will Windows bugs be patched?** Issues #116 and #113 are open blockers
   with no confirmed timeline
2. **What is the default state of Codex's "full environments" training toggle
   for API-key users?** Official documentation does not clearly state this
3. **Will OpenAI maintain the Free tier Codex promotion?** Currently available
   but explicitly time-limited
4. **Will Issue #72 (agent model-switching) be merged?** If merged,
   significantly changes the plugin's capability profile — Claude Code agents
   could run on OpenAI models
5. **Will Anthropic build a reverse plugin?** Predicted by analysts but
   unconfirmed
6. **What is the exact data payload sent during a review?** Diffs only, or full
   working tree? Not fully confirmed
7. **Does the broker socket have authentication?** No security research has
   addressed local privilege escalation on multi-user systems via the broker
   socket

---

## 11. Unexpected Findings

**The "Claude as filter" pattern (D5-serendipity):** The most practically useful
practitioner finding is not that Codex catches more bugs — it is that Claude
serves as an intelligent filter between Codex output and code changes. A
validation prompt asks Claude to evaluate each Codex review comment for
validity, flag false positives, and recommend solutions with reasoning. This
transforms the workflow from "accept all review output" to "Claude-mediated
review acceptance." This pattern is not in the official plugin README and was
discovered in practitioner usage.

**OpenAI rejected MCP for internal surface unification (D1-serendipity):**
OpenAI experimented with MCP for unifying Codex surfaces (CLI, VS Code, web) but
rejected it because "maintaining MCP semantics in a way that made sense for VS
Code proved difficult." This is strategically significant given that Anthropic
created MCP and Claude Code is built on it — OpenAI found Anthropic's own
protocol insufficient for their use case and built a proprietary alternative.

**AGENTS.md vs. CLAUDE.md as competing config standards (D1-serendipity):**
Codex reads `AGENTS.md`, an open standard also used by Cursor and Aider. Claude
Code reads `CLAUDE.md`, which only works within Anthropic tools. Teams using
both tools must maintain two separate configuration files. No cross-tool
compatibility exists between the two standards.

**Codex Security Agent operates continuously without triggers
(D1-serendipity):** The March 2026 Codex Security Agent runs in the background
building threat models and proposing patches automatically — without any manual
trigger. This represents a new architectural pattern distinct from point-in-time
security reviews.

**The concurrent security disclosure timing (D8-serendipity):** The BeyondTrust
vulnerability disclosure (GitHub token theft via command injection) was
published the same day as the plugin launch (March 30, 2026). The security
researchers specifically noted that "AI coding agents are live execution
environments with access to sensitive credentials." This timing is relevant
context for any security evaluation of adding Codex as a trusted agent inside
Claude Code workflows.

**DNS-based covert channel in ChatGPT (D6-serendipity):** Concurrent with the
Codex vulnerability, Check Point researchers discovered a covert DNS-based data
exfiltration channel in ChatGPT's code execution runtime (patched March 2026).
Both vulnerabilities demonstrate that OpenAI's cloud execution environments have
had serious data leakage vectors — a pattern relevant to trusting cloud AI
execution environments generally.

**Level 1 SKILL.md is a lower-friction on-ramp (D5-serendipity):** A single
markdown file in `.claude/skills/` creates a functional Claude-Codex review loop
without installing the plugin. One practitioner reported 14 issues detected in 3
rounds with zero additional tooling. This is the recommended entry point before
committing to full plugin setup.

**SoNash skills are directly convertible to shareable plugins
(D12-serendipity):** The official Claude Code docs include an explicit migration
path for converting existing `.claude/` configurations to plugins. SoNash's 60+
skills, 34 agents, and 20+ hooks could be packaged as a distributable plugin
with minimal effort.

**`hookify` plugin formalizes CLAUDE.md guardrails (D12-serendipity):** The
official `hookify` plugin (by Anthropic's Daisy Hollman) allows defining
behavioral rules as verifiable hooks rather than prose instructions. This is
essentially what CLAUDE.md's behavioral guardrails section does — but with
automated enforcement rather than advisory text.

---

## 12. Gaps in Evidence

1. **Windows bug resolution timeline:** Issues #116 and #113 have no confirmed
   fix date
2. **Codex "full environments" training toggle default for API users:** Not
   clearly documented; critical for SoNash's health-data-adjacent code
3. **Exact data payload in review requests:** Diffs only vs. full working tree —
   not confirmed from primary source
4. **Codex review quality on SoNash-specific patterns:** No benchmark exists for
   whether Codex recognizes `httpsCallable`, `sanitizeError`, path traversal
   regex, or other SoNash-idiomatic patterns
5. **Cost per review call on a typical SoNash PR (30-50 files):** No concrete
   estimate without live testing
6. **Issue #72 PR merge status:** The agent model-switching PR was open as of
   research date; merge status unconfirmed
7. **Anthropic's official position:** No statement found; may be intentional
   strategic silence or may precede a future response
8. **Issue #59 fix timeline:** Review gate configuration bug has no confirmed
   patch date
9. **Broker socket authentication:** No security research on local privilege
   escalation vector via unauthenticated broker socket on multi-user systems
10. **Free tier exact limits:** "Severe usage restrictions" noted but no hard
    numbers documented

---

## 13. Sources

All citations in the format [Dx-Fy] reference the findings file (D1-D12) and
finding number within that file. Sources below are deduplicated across all
findings files and tiered by authority.

### Tier 1: Official Documentation and Primary Sources

| #     | Source                                                                | URL                                                                                                     | Date       |
| ----- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------- |
| S-001 | openai/codex-plugin-cc GitHub Repository (README)                     | https://github.com/openai/codex-plugin-cc                                                               | 2026-03-30 |
| S-002 | OpenAI Developer Community — Introducing Codex Plugin for Claude Code | https://community.openai.com/t/introducing-codex-plugin-for-claude-code/1378186                         | 2026-03-30 |
| S-003 | Codex Pricing — OpenAI Developers                                     | https://developers.openai.com/codex/pricing                                                             | Apr 2026   |
| S-004 | Codex Models — OpenAI Developers                                      | https://developers.openai.com/codex/models                                                              | 2026       |
| S-005 | Codex Agent Skills — OpenAI Developers                                | https://developers.openai.com/codex/skills                                                              | 2026       |
| S-006 | Codex Plugins — OpenAI Developers                                     | https://developers.openai.com/codex/plugins                                                             | 2026       |
| S-007 | Codex GitHub Action — OpenAI Developers                               | https://developers.openai.com/codex/github-action                                                       | 2026       |
| S-008 | Codex Agent Approvals & Security — OpenAI Developers                  | https://developers.openai.com/codex/agent-approvals-security                                            | 2026       |
| S-009 | Codex Authentication Docs — OpenAI Developers                         | https://developers.openai.com/codex/auth                                                                | 2026       |
| S-010 | Codex Cloud Environments — OpenAI Developers                          | https://developers.openai.com/codex/cloud/environments                                                  | 2026       |
| S-011 | Data Controls in OpenAI Platform                                      | https://developers.openai.com/api/docs/guides/your-data                                                 | 2026       |
| S-012 | Introducing Codex — OpenAI                                            | https://openai.com/index/introducing-codex/                                                             | May 2025   |
| S-013 | Addendum to o3/o4-mini system card: Codex                             | https://openai.com/index/o3-o4-mini-codex-system-card-addendum/                                         | May 2025   |
| S-014 | Claude Code Plugins Launch Announcement — Anthropic                   | https://claude.com/blog/claude-code-plugins                                                             | Oct 2025   |
| S-015 | Claude Code Plugins Reference                                         | https://code.claude.com/docs/en/plugins-reference                                                       | Current    |
| S-016 | Claude Code Plugin Marketplaces                                       | https://code.claude.com/docs/en/plugin-marketplaces                                                     | Current    |
| S-017 | Claude Code Security Docs                                             | https://code.claude.com/docs/en/security                                                                | 2026       |
| S-018 | Claude Code Hooks Reference                                           | https://code.claude.com/docs/en/hooks                                                                   | Current    |
| S-019 | Anthropic Demo Marketplace — marketplace.json                         | https://github.com/anthropics/claude-code/blob/main/.claude-plugin/marketplace.json                     | Current    |
| S-020 | GitHub Agent HQ — Pick your agent                                     | https://github.blog/news-insights/company-news/pick-your-agent-use-claude-and-codex-on-agent-hq/        | Feb 2026   |
| S-021 | GitHub Changelog: Claude and Codex for Copilot Business               | https://github.blog/changelog/2026-02-26-claude-and-codex-now-available-for-copilot-business-pro-users/ | Feb 2026   |
| S-022 | GitHub Issue #116: Windows spawn ENOENT                               | https://github.com/openai/codex-plugin-cc/issues/116                                                    | Apr 2026   |
| S-023 | GitHub Issue #59: Review gate writes to temp dir                      | https://github.com/openai/codex-plugin-cc/issues/59                                                     | Apr 2026   |
| S-024 | GitHub Issue #122: Rescue timeout on large diffs                      | https://github.com/openai/codex-plugin-cc/issues/122                                                    | Apr 2026   |
| S-025 | GitHub Issue #58: Azure OpenAI auth not recognized                    | https://github.com/openai/codex-plugin-cc/issues/58                                                     | Apr 2026   |
| S-026 | BeyondTrust: Codex Command Injection Vulnerability                    | https://www.beyondtrust.com/blog/entry/openai-codex-command-injection-vulnerability-github-token        | 2026-02    |
| S-027 | Codex Configuration — Mintlify docs mirror                            | https://www.mintlify.com/openai/codex-plugin-cc/configuration/codex-config                              | 2026-03    |
| S-028 | Introducing GPT-5.3-Codex-Spark                                       | https://openai.com/index/introducing-gpt-5-3-codex-spark/                                               | Feb 2026   |

### Tier 2: High-Quality Technical Analysis and Established Journalism

| #     | Source                                                                           | URL                                                                                                                           | Date       |
| ----- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------- |
| S-029 | OpenAI Publishes Codex App Server Architecture — InfoQ                           | https://www.infoq.com/news/2026/02/opanai-codex-app-server/                                                                   | Feb 2026   |
| S-030 | OpenAI adds plugin system to Codex — InfoWorld                                   | https://www.infoworld.com/article/4151214/openai-adds-plugin-system-to-codex-to-help-enterprises-govern-ai-coding-agents.html | Mar 2026   |
| S-031 | openai/codex-plugin-cc — DeepWiki                                                | https://deepwiki.com/openai/codex-plugin-cc                                                                                   | 2026-04-01 |
| S-032 | OpenAI Patches Codex GitHub Token Vulnerability — The Hacker News                | https://thehackernews.com/2026/03/openai-patches-chatgpt-data.html                                                            | 2026-03    |
| S-033 | The Register: Claude Code Source Leak Privacy Concerns                           | https://www.theregister.com/2026/04/01/claude_code_source_leak_privacy_nightmare/                                             | 2026-04-01 |
| S-034 | Codex vs Claude Code (2026) — Morph LLM                                          | https://www.morphllm.com/comparisons/codex-vs-claude-code                                                                     | 2026       |
| S-035 | The Pragmatic Engineer: AI Tooling Survey 2026                                   | https://newsletter.pragmaticengineer.com/p/ai-tooling-2026                                                                    | 2026       |
| S-036 | The Code Agent Orchestra — Addy Osmani                                           | https://addyosmani.com/blog/code-agent-orchestra/                                                                             | 2026       |
| S-037 | Cursor's Crossroads — Fortune                                                    | https://fortune.com/2026/03/21/cursor-ceo-michael-truell-ai-coding-claude-anthropic-venture-capital/                          | Mar 2026   |
| S-038 | Claude Code vs Codex — Northflank                                                | https://northflank.com/blog/claude-code-vs-openai-codex                                                                       | 2026       |
| S-039 | OpenAI Releases Codex Plugin That Runs Inside Anthropic's Claude Code — Unite.AI | https://www.unite.ai/openai-releases-codex-plugin-that-runs-inside-anthropics-claude-code/                                    | 2026-03-31 |
| S-040 | SiliconAngle: Codex vulnerability enabled GitHub token theft                     | https://siliconangle.com/2026/03/30/openai-codex-vulnerability-enabled-github-token-theft-via-command-injection-report-finds/ | 2026-03-30 |

### Tier 3: Community Analysis and Practitioner Reports

| #     | Source                                                                         | URL                                                                                                                                | Date       |
| ----- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| S-041 | The Claude Code Codex Plugin: Code Reviews Without Blind Spots — nathanonn.com | https://www.nathanonn.com/codex-plugin-claude-code-review/                                                                         | Apr 2026   |
| S-042 | Automating Claude Code x Codex Review Loop — SmartScope                        | https://smartscope.blog/en/blog/claude-code-codex-review-loop-automation-2026/                                                     | 2026       |
| S-043 | OpenAI Releases Official Claude Code Plugin — SmartScope                       | https://smartscope.blog/en/blog/codex-plugin-cc-openai-claude-code-2026/                                                           | Apr 2026   |
| S-044 | You can now trigger Codex from Claude Code — AlphaSignal                       | https://alphasignalai.substack.com/p/you-can-now-trigger-codex-from-claude                                                         | 2026-03-31 |
| S-045 | OpenAI Just Shipped a Plugin So Codex Runs Inside Claude Code — DEV.to         | https://dev.to/oldeucryptoboi/openai-just-shipped-a-plugin-so-codex-runs-inside-claude-code-51oa                                   | 2026-03-31 |
| S-046 | Claude Code vs Codex 2026 — 500 Reddit Developers — DEV.to                     | https://dev.to/_46ea277e677b888e0cd13/claude-code-vs-codex-2026-what-500-reddit-developers-really-think-31pb                       | 2026       |
| S-047 | Cross-Provider AI Review Explained — MindStudio                                | https://www.mindstudio.ai/blog/openai-codex-plugin-claude-code-cross-provider-review                                               | 2026       |
| S-048 | OpenAI Built a Plugin for Claude Code. Why It Matters. — Beam.AI               | https://beam.ai/agentic-insights/openai-just-built-a-plugin-for-its-biggest-rival-heres-what-that-means-for-enterprise-ai-strategy | 2026-03-31 |
| S-049 | Codex CLI vs Claude Code Architecture Deep Dive — blakecrosley.com             | https://blakecrosley.com/blog/codex-vs-claude-code-2026                                                                            | 2026       |
| S-050 | I Tested (New) Viral Codex Plugin for Claude Code — Medium                     | https://medium.com/@joe.njenga/i-tested-new-viral-codex-plugin-for-claude-code-shouldnt-exist-but-exploding-1c5702679929           | 2026-03-31 |
| S-051 | What I learned building a Gemini plugin — dev.to/abiswas                       | https://dev.to/abiswas/what-i-learned-building-a-gemini-plugin-for-claude-code                                                     | 2026       |
| S-052 | Codex Pricing 2026 — Flowith                                                   | https://flowith.io/blog/openai-codex-pricing-2026-api-costs-token-limits/                                                          | 2026       |
| S-053 | OpenAI Codex March 2026 Update Summary — apiyi.com                             | https://help.apiyi.com/en/openai-codex-march-2026-updates-summary-plugins-triggers-security-en.html                                | Mar 2026   |

### SoNash Codebase Sources (Highest Authority)

| #     | Source                             | Path                                      |
| ----- | ---------------------------------- | ----------------------------------------- |
| S-054 | SoNash contrarian-challenger agent | `.claude/agents/contrarian-challenger.md` |
| S-055 | SoNash code-reviewer agent         | `.claude/agents/code-reviewer.md`         |
| S-056 | SoNash pr-review skill (v4.6)      | `.claude/skills/pr-review/SKILL.md`       |
| S-057 | SoNash post-write hook             | `.claude/hooks/post-write-validator.js`   |
| S-058 | SoNash AI Review Process (v3.0)    | `docs/AI_REVIEW_PROCESS.md`               |

---

## 14. Methodology

**Phase:** Synthesis only (Phase 2 of deep-research pipeline) **Findings files
processed:** 12 (D1 through D12; all present) **Search profiles used:** web (D1,
D2, D5, D8, D10, D11), docs+web (D3, D9), codebase+web (D7), web+docs (D12)
**Research date:** 2026-04-03 **Depth:** L1 (Exhaustive) **Contrarian/OTB
challenges:** Not yet run (see `/research/<topic>/challenges/` directory)

**Deduplication applied:** Claims appearing across multiple findings files were
merged with evidence from all sources. Where confidence levels differed across
files for the same claim, the lower value was retained unless corroboration from
a second high-quality source justified an increase.

**Contradictions policy:** All identified contradictions are surfaced explicitly
in Section 10. No contradiction was silently resolved. Where resolution is
possible from the evidence, it is stated; where genuinely unresolved, it is
marked as such.

**Codebase sources:** D7 (SoNash workflow fit) accessed SoNash codebase files
directly, which are treated as highest-authority sources for claims about the
project's existing infrastructure.
