# D1: OpenAI Codex Product Overview

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-04-03
**Sub-Question IDs:** SQ-1

---

## Sub-questions Addressed

- SQ-1: What is OpenAI Codex (April 2026 state) — product architecture,
  capabilities, pricing, how it differs from Copilot?

---

## Findings

### 1. What Codex Is: The Core Product Identity [CONFIDENCE: HIGH]

OpenAI Codex is a cloud-based autonomous software engineering agent, launched as
a research preview on May 16, 2025, and integrated directly into ChatGPT. It is
**not** the old Codex language model (the text-davinci-codex series from 2021).
The new Codex is a complete coding agent that operates on entire repositories
asynchronously in isolated cloud environments [1][2].

The defining characteristic is asynchronous delegation: a developer assigns
Codex a task (write a feature, fix a bug, add tests), Codex spins up an isolated
container with the repository pre-loaded, works independently, and returns a
draft pull request or diff for human review. Task completion ranges from 1 to 30
minutes depending on complexity [1][3].

By March 2026, Codex had over 2 million weekly active users — a fivefold
increase since early 2026 [2].

---

### 2. Underlying Model: codex-1 and its Successors [CONFIDENCE: HIGH]

Codex was initially powered by **codex-1**, which is a version of OpenAI's o3
model fine-tuned with reinforcement learning specifically for professional
software engineering tasks. The training went beyond competitive programming to
teach the model professional "taste": writing proper PR descriptions, matching
code style, generating comprehensive tests, and producing mergeable code [4][5].

codex-1 benchmarks (at launch):

- SWE-bench Verified: 72.1% in 1 try, 83.8% in 8 tries [4]
- Software-engineering patch generation: 75% accuracy vs. o3-high at 70% [4]

**Model lineage as of April 2026** (per official Codex Models docs) [6]:

- **gpt-5.4** — current flagship; combines coding strength of GPT-5.3-Codex with
  stronger reasoning, tool use, and agentic workflows; SWE-Bench Pro: 57.7%
- **gpt-5.4-mini** — lightweight, fast, cost-efficient for responsive tasks and
  sub-agents
- **gpt-5.3-codex** — still available; SWE-Bench Pro: 56.8%; 25% faster than
  predecessor
- **gpt-5.3-codex-spark** — research preview, near-instant iteration via
  Cerebras hardware; ChatGPT Pro subscribers only
- Legacy models (gpt-5.2-codex, gpt-5.1-codex, gpt-5-codex, gpt-5) remain
  accessible but marked as superseded

GPT-5.3-Codex achieved 77.3% on Terminal-Bench 2.0 (tied for top across all AI
coding tools) [7].

**Note:** OpenAI stopped reporting SWE-Bench Verified scores after confirming
training data contamination across all frontier models [7].

---

### 3. Architecture: App Server as the Unifying Layer [CONFIDENCE: HIGH]

As of February 2026, OpenAI published the "App Server" architecture that
underpins all Codex surfaces [8][9]:

**Single unified engine:** One App Server binary powers the CLI, VS Code
extension, web app, macOS desktop app, Windows desktop app (March 2026), and
third-party IDE integrations (JetBrains, Xcode).

**Communication protocol:** JSON-RPC streamed as JSONL over stdio. Three
conversation primitives:

1. **Item** — atomic unit (user message, agent message, tool execution, approval
   request, diff)
2. **Turn** — groups items from a single unit of agent work
3. **Thread** — durable session container supporting creation, resumption,
   forking, and archival

**Deployment patterns by surface:**

- Local clients (VS Code, desktop): Bundle platform binary, launch as child
  process, maintain bidirectional stdio channel
- Web runtime: Worker provisions container, launches App Server inside it,
  browser communicates via HTTP + Server-Sent Events
- Decoupled partners (Xcode): Stable client binary pointing to newer App Server
  releases

**Why not MCP?** OpenAI initially experimented with Model Context Protocol for
surface unification but rejected it because "maintaining MCP semantics in a way
that made sense for VS Code proved difficult" — the richer session semantics
(streaming diffs, approval flows, thread persistence) did not map cleanly onto
MCP's tool-oriented model [8].

**Local sandbox security:** The sandbox uses platform-specific backends:

- Linux: Landlock for filesystem restrictions
- macOS: Seatbelt (Security Framework)
- Windows: Restricted Tokens

Three access policies: `DangerFullAccess`, `ReadOnly`, `WorkspaceWrite` [9].

**Cloud task execution:** Isolated container with repository pre-loaded,
internet access disabled during execution, dependencies installed via
user-provided setup script [1].

---

### 4. Core Capabilities [CONFIDENCE: HIGH]

- Write new features across multiple files
- Fix bugs with iterative test-running until passing
- Answer questions about codebases
- Propose pull requests with diffs for human review
- Run tests, linters, and type checkers
- Return verifiable evidence (terminal logs, test outputs) for each step
- Multi-agent task coordination via ThreadManager (multiple CodexThread
  instances, each with independent context) [9]
- 192,000-token context window with Native Compaction; experimental 1M token
  window with GPT-5.4 [10]
- Multimodal input: can reason over UI mockups and diagrams [10]
- Dynamic reasoning effort toggle (Low to Extra High, up to 7-hour sessions)
  [10]

**March 2026 additions:**

- **Codex Security Agent:** Continuous background application-security agent —
  automated threat modeling, sandbox vulnerability validation, patch generation
  — operates without manual triggers [3]
- **Triggers:** Event-driven automation responding to GitHub actions (issues,
  PRs, CI failures, mentions); sub-second response times; creates PRs
  automatically on issue creation [3]
- **GitHub Action (`openai/codex-action@v1`):** Embeds Codex in CI/CD pipelines
  for automated code review and quality gates [11]

---

### 5. Plugin and Extension System [CONFIDENCE: HIGH]

OpenAI launched the Codex plugin marketplace on March 27, 2026, with 20+ partner
integrations at launch [12][13].

**Plugin architecture — three components per plugin:**

1. **Skills:** Reusable prompt-based workflow instructions (discoverable via
   `/skills` or `$` mention in CLI/IDE)
2. **Apps:** External service integrations (read data, take actions)
3. **MCP Servers:** Tool and information access from external systems

**Skills detail:** A skill is a directory containing a `SKILL.md` file plus
optional scripts and references. Skills use progressive disclosure — Codex loads
metadata first, full instructions only when deciding to use the skill.
Discovered from repository (`.agents/skills`), user (`$HOME/.agents/skills`),
admin (`/etc/codex/skills`), and system levels [14].

Codex reads **AGENTS.md** as its configuration standard — an open standard also
used by Cursor, Aider, and other tools [7].

**Launch plugins include:** Slack, Figma, Notion, Sentry, Gmail, Google Drive,
Linear, Datadog, Jira [3][12].

**Enterprise plugin governance (RBAC):**

- Admins manage plugins via Workspace settings → Apps
- JSON-based "marketplace" configs define installation policies per repo or
  developer environment
- Three policy states: `INSTALLED_BY_DEFAULT`, `AVAILABLE`, `NOT_AVAILABLE`
- Private marketplaces currently (self-serve publishing to official directory
  "coming soon") [13][15]

**Codex vs. Claude Code MCP support:** Claude Code has better MCP integrations
with one-click connectors and supports both stdio and HTTP MCP endpoints. Codex
added stdio-based MCP support but does not yet support HTTP MCP endpoints [7].

---

### 6. Pricing Model [CONFIDENCE: HIGH]

Codex has **no standalone subscription** — it is bundled with ChatGPT plans
[16][17]:

| Plan       | Monthly Cost | Codex Access                                             |
| ---------- | ------------ | -------------------------------------------------------- |
| Free       | $0           | Limited trial (temporary promo)                          |
| Go         | $8           | Basic tasks                                              |
| Plus       | $20          | Standard access (cloud tasks: 10-60/session)             |
| Pro        | $200         | 6x higher limits (cloud tasks: 50-400/session)           |
| Business   | $30/user     | Pay-as-you-go credits; token-based billing as of April 2 |
| Enterprise | Custom       | Custom pricing, enterprise security                      |

**Plus plan usage limits (5-hour rolling window):**

- Cloud tasks: 10-60 (GPT-5.3-Codex only)
- Local messages: 33-168 (GPT-5.4) or 110-560 (GPT-5.4-mini)
- Code reviews: 10/week

**Pro plan usage limits:**

- Cloud tasks: 50-400 (GPT-5.3-Codex)
- Local messages: 223-1120 (GPT-5.4) or 743-3733 (GPT-5.4-mini)
- Code reviews: 100-250/week

**Credits pricing (Business/Enterprise, token-based as of April 2, 2026):**

- GPT-5.4: 62.50 credits/1M input tokens; 375 credits/1M output tokens
- GPT-5.3-Codex: 43.75 credits/1M input; 350 credits/1M output
- Fast mode: 2x credit consumption

**API pricing (key-based, per-token):**

- codex-mini-latest: $1.50 input / $6.00 output per million tokens
- gpt-5: $1.25 input / $10.00 output per million tokens
- Batch API: 50% discount for non-instant tasks [10]

Plus/Pro users who exceed limits can purchase additional credits without plan
upgrade [16].

---

### 7. How Codex Differs from GitHub Copilot [CONFIDENCE: HIGH]

This is a fundamental architectural divergence, not just a feature gap:

| Dimension                 | OpenAI Codex                             | GitHub Copilot                                       |
| ------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| **Primary paradigm**      | Autonomous agent (async task delegation) | Real-time inline assistant                           |
| **Execution model**       | Asynchronous cloud sandbox OR local CLI  | Synchronous IDE suggestions                          |
| **Interface**             | CLI, desktop app, web, IDE extension     | IDE-native (VS Code, JetBrains, Neovim, Xcode)       |
| **Context**               | 192K–1M tokens, full repo in sandbox     | Standard context window                              |
| **Model access**          | OpenAI-exclusive (GPT-5.x Codex series)  | Multi-vendor (GPT-5, Claude, Gemini on higher tiers) |
| **Open source**           | Yes (Apache 2.0 for CLI)                 | Proprietary                                          |
| **Inline completion**     | No                                       | Yes (core differentiator for Copilot)                |
| **Enterprise compliance** | Growing (plugin governance, RBAC)        | Mature (IP indemnity, SSO, audit logs)               |
| **Pricing**               | Bundled in ChatGPT Plus ($20/mo)         | Separate product: Pro $10/mo, Pro+ $39/mo            |
| **GitHub integration**    | Via Triggers, GitHub Action              | Native (Microsoft/GitHub owned)                      |
| **Config standard**       | AGENTS.md (open standard)                | Copilot-specific config                              |

**Performance comparison:**

- Codex: 93% p99 accuracy in production; 77.3% Terminal-Bench [7]
- Copilot: ~90% p99 accuracy [from comparison articles - MEDIUM confidence]
- HumanEval: Codex 90.2%, Claude Code 92% [7]

**Key analyst framing:** These tools are increasingly positioned as
complementary. Many developers use Copilot for daily inline speed and Codex for
larger delegated tasks. Codex is "give it a task, walk away"; Copilot is a
real-time pair programmer [18].

GitHub (via Agent HQ) added Codex to its agent comparison system, letting
developers compare Codex output against Copilot and Claude outputs side-by-side
[2].

---

### 8. Access and Availability (April 2026 State) [CONFIDENCE: HIGH]

**Platforms:**

- ChatGPT web app
- CLI (open-source, Apache 2.0, available at github.com/openai/codex with 62K+
  stars)
- Desktop app: macOS and Windows (Windows launched March 4, 2026)
- VS Code extension
- JetBrains plugin
- Xcode integration
- iOS app

**Authentication:** ChatGPT login (Plus/Pro/Business/Enterprise) OR OpenAI API
key for CLI

**For Business/Enterprise:** Plugin access follows workspace app controls;
Enterprise/Edu admins control user access via RBAC [16].

**Temporary promotion (as of research date):** Free and Go plan users receiving
Codex access at 2x normal rate limits [16].

---

## Sources

| #   | URL                                                                                                                           | Title                                           | Type            | Trust  | CRAAP | Date     |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------- | ------ | ----- | -------- |
| 1   | https://openai.com/index/introducing-codex/                                                                                   | Introducing Codex - OpenAI                      | Official blog   | HIGH   | 4.4   | May 2025 |
| 2   | https://en.wikipedia.org/wiki/OpenAI_Codex_(AI_agent)                                                                         | OpenAI Codex (AI agent) - Wikipedia             | Encyclopedia    | MEDIUM | 3.8   | Ongoing  |
| 3   | https://help.apiyi.com/en/openai-codex-march-2026-updates-summary-plugins-triggers-security-en.html                           | OpenAI Codex March 2026 Update Summary          | Blog summary    | MEDIUM | 3.4   | Mar 2026 |
| 4   | https://openai.com/index/o3-o4-mini-codex-system-card-addendum/                                                               | Addendum to o3/o4-mini system card: Codex       | Official doc    | HIGH   | 4.6   | May 2025 |
| 5   | https://devops.com/openai-codex-transforming-software-development-with-ai-agents-2/                                           | OpenAI Codex: Transforming Software Development | Tech blog       | MEDIUM | 3.2   | 2025     |
| 6   | https://developers.openai.com/codex/models                                                                                    | Models - Codex OpenAI Developers                | Official docs   | HIGH   | 4.8   | 2026     |
| 7   | https://www.morphllm.com/comparisons/codex-vs-claude-code                                                                     | Codex vs Claude Code (2026)                     | Comparison blog | MEDIUM | 3.6   | 2026     |
| 8   | https://www.infoq.com/news/2026/02/opanai-codex-app-server/                                                                   | OpenAI Publishes Codex App Server Architecture  | Tech news       | HIGH   | 4.2   | Feb 2026 |
| 9   | https://deepwiki.com/openai/codex                                                                                             | openai/codex - DeepWiki                         | Code wiki       | MEDIUM | 3.8   | 2026     |
| 10  | https://www.zignuts.com/blog/openai-codex-vs-github-copilot-comparison                                                        | OpenAI Codex vs GitHub Copilot Comparison       | Blog            | MEDIUM | 3.4   | 2026     |
| 11  | https://developers.openai.com/codex/github-action                                                                             | GitHub Action - Codex OpenAI Developers         | Official docs   | HIGH   | 4.8   | 2026     |
| 12  | https://winbuzzer.com/2026/03/31/openai-launches-plugin-marketplace-codex-enterprise-controls-xcxwbn/                         | OpenAI Launches Plugin Marketplace for Codex    | Tech news       | MEDIUM | 3.6   | Mar 2026 |
| 13  | https://www.infoworld.com/article/4151214/openai-adds-plugin-system-to-codex-to-help-enterprises-govern-ai-coding-agents.html | OpenAI adds plugin system to Codex              | InfoWorld       | HIGH   | 4.0   | Mar 2026 |
| 14  | https://developers.openai.com/codex/skills                                                                                    | Agent Skills - Codex OpenAI Developers          | Official docs   | HIGH   | 4.8   | 2026     |
| 15  | https://developers.openai.com/codex/plugins                                                                                   | Plugins - Codex OpenAI Developers               | Official docs   | HIGH   | 4.8   | 2026     |
| 16  | https://developers.openai.com/codex/pricing                                                                                   | Pricing - Codex OpenAI Developers               | Official docs   | HIGH   | 4.8   | Apr 2026 |
| 17  | https://uibakery.io/blog/openai-codex-pricing                                                                                 | OpenAI Codex Pricing (2026)                     | Blog            | MEDIUM | 3.4   | 2026     |
| 18  | https://www.morphllm.com/comparisons/codex-vs-copilot                                                                         | OpenAI Codex vs GitHub Copilot                  | Comparison blog | MEDIUM | 3.6   | 2026     |

---

## Contradictions

**SWE-bench scores:** Multiple sources report different scores with inconsistent
framing. Some cite "SWE-bench Verified" (72.1–83.8% for codex-1 at launch),
others cite "SWE-bench Pro" (56.8% for GPT-5.3-Codex, 57.7% for GPT-5.4). These
are different benchmarks. The morphllm benchmark article also notes that OpenAI
stopped reporting SWE-bench Verified scores due to confirmed training data
contamination. Treat all SWE-bench figures with caution as exact comparators.

**Token context window size:** Some sources cite 192,000 tokens with Native
Compaction as the standard window; others mention a 1M token experimental window
with GPT-5.4. These may represent different tiers (standard vs. experimental
feature) rather than a contradiction, but the exact availability is unclear.

**Pricing model changes:** As of April 2, 2026, Business and new Enterprise
plans switched to token-based billing. Older sources may describe per-message
pricing that is no longer accurate for those tiers.

**"Free" access for Codex:** Some sources indicate Codex requires Plus ($20/mo)
minimum; others note a temporary promotional offering of Codex to Free and Go
plan users at 2x limits. The official help article suggests this is time-limited
and not the permanent access model.

---

## Gaps

1. **Exact April 2026 changelog entries:** The Codex changelog was partially
   visible through March 2026 (version 0.118.0 on March 31). April 2026 entries
   were not accessible due to paywall/403 errors on openai.com.

2. **GPT-5.4 full rollout status:** GPT-5.4 was "rolling out gradually" as of
   its introduction. Whether it is fully available to all Codex users in April
   2026 is not confirmed.

3. **Self-serve plugin publishing:** The official Plugin Directory still does
   not allow self-serve publishing as of the research date — only OpenAI-curated
   plugins in the official directory.

4. **Exact credit-to-dollar conversion:** While credits/token rates are
   documented for Business/Enterprise, the USD-to-credit conversion rate was not
   definitively confirmed in a single authoritative source.

5. **Claude Code plugin system:** The relationship between Claude Code's
   skill/plugin system and Codex's AGENTS.md standard, and whether there is
   cross-tool compatibility, was not fully resolved.

---

## Serendipity

**Codex is Apache 2.0 open source (CLI):** The CLI has 62K+ GitHub stars and is
fully open source under Apache 2.0. This is a notable strategic choice
differentiating it from GitHub Copilot (proprietary) and has attracted a large
community of contributors and integrations.

**AGENTS.md as an emerging open standard:** Codex reads AGENTS.md, which is also
used by Cursor and Aider. This is an open standard that creates cross-tool
compatibility for developer configuration. Claude Code uses CLAUDE.md, which
only works within Anthropic's tools — teams using both must maintain two
separate config files.

**Codex Security as a standalone agent:** The March 2026 Codex Security agent
operates continuously in the background without manual triggers, building threat
models and proposing patches. This is substantively different from a
point-in-time security review command and represents a new architectural pattern
in AI security tooling.

**App Server rejected MCP:** The decision to build a proprietary JSON-RPC
protocol rather than use MCP for internal surface unification is strategically
significant. OpenAI found MCP's tool-oriented model insufficient for the richer
session semantics needed for IDE integration. This has implications for anyone
building on or integrating with Codex surfaces.

---

## Confidence Distribution

- HIGH claims: 8
- MEDIUM claims: 3
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The core product facts (architecture, model lineage, pricing tiers, plugin
system, Copilot comparison) are well-supported by multiple independent sources
including official OpenAI developer documentation. Performance benchmark figures
carry MEDIUM confidence due to the known contamination issues with SWE-bench and
the variability in how different sources frame the scores.
