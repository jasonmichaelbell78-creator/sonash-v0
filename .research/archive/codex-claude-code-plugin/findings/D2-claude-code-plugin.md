# D2: Claude Code Plugin for Codex

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-04-03
**Sub-Question IDs:** SQ-2

---

## Sub-questions Addressed

- SQ-2: What is the Claude Code plugin for Codex — what it does, how it works,
  who built it, when released?

---

## Findings

### 1. What the Plugin Is [CONFIDENCE: HIGH]

`codex-plugin-cc` is an open-source Claude Code plugin built and published by
OpenAI that allows developers to invoke OpenAI's Codex directly from inside
Anthropic's Claude Code CLI. It exposes a set of slash commands within Claude
Code that delegate work to the locally installed Codex CLI and Codex app server.
The plugin is the first official OpenAI integration designed to run inside a
competitor's coding environment [1][2][3].

It was released on March 30–31, 2026, under the Apache 2.0 license. The v1.0.2
patch followed on March 31, 2026 [1][2].

### 2. Who Built It [CONFIDENCE: HIGH]

OpenAI built and published the plugin. The repository is
`openai/codex-plugin-cc` on GitHub (owned and maintained by the OpenAI
organization). The official announcement was posted to the OpenAI Developer
Community forum by Vaibhav Srivastav (user `vb`) on March 30, 2026 [2][5].
Anthropic had no documented involvement in its creation. There is no indication
of any official Anthropic response or collaboration in any source found.

### 3. Commands Provided [CONFIDENCE: HIGH]

The plugin exposes six slash commands [1][2][3][6]:

| Command                     | Mode                     | Purpose                                                                                  |
| --------------------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `/codex:review`             | Foreground or background | Standard read-only code review                                                           |
| `/codex:adversarial-review` | Foreground or background | Challenges implementation decisions, tradeoffs, failure modes; accepts custom focus text |
| `/codex:rescue`             | Foreground or background | Delegates task fully to Codex as a subagent (bug investigation, fixes, continued work)   |
| `/codex:status`             | —                        | Shows running and recently completed background jobs                                     |
| `/codex:result`             | —                        | Retrieves completed output; includes Codex session ID for resumption                     |
| `/codex:cancel`             | —                        | Terminates a background job                                                              |
| `/codex:setup`              | —                        | Validates installation, checks Codex readiness, manages optional review gate             |

### 4. Technical Architecture [CONFIDENCE: HIGH]

The plugin is NOT a deep MCP-style integration. It uses Claude Code's native
plugin infrastructure (markdown command files + session hooks + subprocess
execution) to shell out to a Node.js companion script [6][7]:

**Key components:**

1. **Companion Script (`codex-companion.mjs`)**: Central CLI entry point. Parses
   arguments, determines Git repo context, manages both foreground execution and
   background jobs via `runTrackedJob`. Delegates to specialized library modules
   for reviews and rescues [7].

2. **Broker Architecture (`app-server-broker.mjs`)**: A multiplexer that creates
   a Unix socket (macOS/Linux) or named pipe (Windows) allowing multiple
   companion instances to connect to a single shared Codex process. Only one
   streaming request permitted at a time; the broker spawns the Codex binary
   with `detached: true` and `unref()` so it survives parent process termination
   [7].

3. **JSON-RPC 2.0 Protocol**: Communication with the `codex app-server` uses
   newline-delimited JSON following JSON-RPC 2.0 conventions. Key methods:
   `initialize`, `thread/start`, `review/start`, `turn/start`, `turn/interrupt`
   [7].

4. **Transport Modes**: Two modes — Direct Spawn (pipes to child process stdio
   when broker disabled) and Broker Client (connects via socket/pipe to
   long-running broker) [7].

5. **State Management**: State persists to workspace-specific directories
   (hashed canonical paths). Maintains `state.json` (global config, job summary
   capped at 50), `jobs/{id}.json` (full job definitions), and `jobs/{id}.log`
   (timestamped execution logs) [7].

6. **Session Hooks**: Three lifecycle hooks manage coordination — `SessionStart`
   (captures session ID), `SessionEnd` (shuts down broker, prunes jobs), and
   `Stop` (the review gate, described below) [7].

**Data flow summary:**

```
User Command (/codex:review, /codex:rescue, etc.)
    → codex-companion.mjs
    → resolveReviewTarget (git.mjs) / collectReviewContext
    → runTrackedJob → createJobProgressUpdater
    → upsertJob (state.mjs) → state.json
    → CodexAppServerClient → (direct|broker) → codex app-server
```

### 5. Authentication and Configuration [CONFIDENCE: HIGH]

The plugin reuses existing local Codex CLI authentication — either ChatGPT
account credentials or an OpenAI API key. No separate credential setup is
required [1][2][3]. Configuration cascades from user-level
(`~/.codex/config.toml`) to project-level (`.codex/config.toml`). Configurable
options include default model (e.g., `gpt-5.4-mini`), reasoning effort, and
custom API endpoint [1].

**Installation requirements:**

- ChatGPT subscription (including free tier) or OpenAI API key
- Node.js 18.18 or later
- Codex CLI installed globally (`npm install -g @openai/codex`)

**Installation commands within Claude Code:**

```
/plugin marketplace add openai/codex-plugin-cc
/plugin install codex@openai-codex
```

Installation scope can be user, project, or repository-local [4].

### 6. Review Gate Feature [CONFIDENCE: HIGH]

An optional feature, enabled via `/codex:setup --enable-review-gate`, hooks into
Claude Code's `Stop` lifecycle event. When active, Codex automatically reviews
Claude's output before Claude Code exits a task. If the review detects issues,
it blocks the stop (returning a `BLOCK:` prefix) so Claude can address them
first. If clean, it returns `ALLOW:` [2][4][6].

**Important caveat** (noted by multiple sources): the review gate can create a
long-running Claude/Codex feedback loop and drain API usage limits rapidly.
Users are cautioned to only enable it during active monitoring sessions [4][6].

### 7. Problem It Solves [CONFIDENCE: HIGH]

The plugin addresses two problems simultaneously [3][5][6][8]:

1. **For developers**: Enables access to a second AI model's perspective
   (Codex's code review) without leaving the Claude Code environment. Reduces
   context-switching cost when wanting adversarial validation or a second pass
   on complex tasks.

2. **For OpenAI (strategic)**: Extends Codex's distribution reach to developers
   who have chosen Claude Code as their primary tool, rather than requiring them
   to switch. Multiple sources note Claude Code has strong developer market
   share, making this a distribution play — "bringing Codex to where developers
   already are."

### 8. Community Reception [CONFIDENCE: MEDIUM]

As of April 2026, the GitHub repository had 11.1k stars and 567 forks [1],
indicating strong initial community interest. The Medium article calling it
"viral" and "shouldn't exist but is exploding" [9] suggests unexpected positive
reception given the cross-competitor nature of the release. Multiple independent
technical deep-dives were published within 3 days of release.

---

## Sources

| #   | URL                                                                                                                                | Title                                                                   | Type                                                         | Trust       | CRAAP (avg) | Date       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------ | ----------- | ----------- | ---------- |
| 1   | https://github.com/openai/codex-plugin-cc                                                                                          | codex-plugin-cc GitHub Repository                                       | Official source (OpenAI)                                     | HIGH        | 4.8         | 2026-03-31 |
| 2   | https://community.openai.com/t/introducing-codex-plugin-for-claude-code/1378186                                                    | Introducing Codex Plugin for Claude Code — OpenAI Developer Community   | Official announcement                                        | HIGH        | 4.8         | 2026-03-30 |
| 3   | https://www.unite.ai/openai-releases-codex-plugin-that-runs-inside-anthropics-claude-code/                                         | OpenAI Releases Codex Plugin That Runs Inside Anthropic's Claude Code   | Tech news                                                    | MEDIUM-HIGH | 4.0         | 2026-03-31 |
| 4   | https://alphasignalai.substack.com/p/you-can-now-trigger-codex-from-claude                                                         | You can now trigger Codex from Claude Code! Here's how                  | Community/newsletter                                         | MEDIUM      | 3.6         | 2026-03-31 |
| 5   | https://the-decoder.com/openai-launches-a-codex-plugin-that-runs-inside-anthropics-claude-code/                                    | OpenAI launches a Codex plugin that runs inside Anthropic's Claude Code | Tech news (fetch failed, but corroborated by search summary) | MEDIUM      | 3.5         | 2026-03-31 |
| 6   | https://dev.to/oldeucryptoboi/openai-just-shipped-a-plugin-so-codex-runs-inside-claude-code-51oa                                   | OpenAI Just Shipped a Plugin So Codex Runs Inside Claude Code           | Developer community post                                     | MEDIUM      | 3.6         | 2026-03-31 |
| 7   | https://deepwiki.com/openai/codex-plugin-cc                                                                                        | openai/codex-plugin-cc — DeepWiki                                       | Technical deep-dive (secondary, repo-derived)                | MEDIUM-HIGH | 4.2         | 2026-04-01 |
| 8   | https://beam.ai/agentic-insights/openai-just-built-a-plugin-for-its-biggest-rival-heres-what-that-means-for-enterprise-ai-strategy | OpenAI Built a Plugin for Claude Code. Why It Matters.                  | Analysis/commentary                                          | MEDIUM      | 3.4         | 2026-03-31 |
| 9   | https://medium.com/@joe.njenga/i-tested-new-viral-codex-plugin-for-claude-code-shouldnt-exist-but-exploding-1c5702679929           | I Tested (New) Viral Codex Plugin for Claude Code                       | Community review                                             | LOW-MEDIUM  | 3.0         | 2026-03-31 |
| 10  | https://gigazine.net/gsc_news/en/20260331-claude-code-codex-plugin/                                                                | OpenAI has released a Codex plugin for Claude Code                      | Tech news                                                    | MEDIUM      | 3.5         | 2026-03-31 |

---

## Contradictions

**MCP vs. non-MCP characterization**: Some secondary sources describe the plugin
as an "MCP server integration" [WebSearch summary for query 2]. The
authoritative technical sources (GitHub repo, DeepWiki deep-dive, DEV Community
article) are consistent that the plugin is NOT a true MCP server — it is a
Claude Code plugin that uses slash command definitions, session hooks, and
subprocess execution shelling out to `codex-companion.mjs`, which then
communicates with the Codex app server via JSON-RPC over a Unix socket/named
pipe. The "MCP" characterization in some articles appears to be
informal/imprecise journalism using MCP as a generic term for plugin integration
rather than the Model Context Protocol standard specifically.

**No Anthropic involvement confirmed or denied**: No source found any official
Anthropic statement about the plugin — neither endorsement, collaboration claim,
nor objection. This absence is itself notable given the cross-competitor nature.

---

## Gaps

1. **Anthropic's official position**: No official statement from Anthropic about
   whether this plugin was coordinated with them, welcomed, or represents any
   formal partnership. Absence of comment noted.

2. **Plugin system origins**: The Claude Code plugin system
   (`/plugin marketplace add`, `/plugin install`) that this plugin leverages was
   not independently researched. The plugin presupposes this system exists and
   is functional — but its documentation, age, and full capabilities were not
   verified.

3. **Codex app-server documentation**: The `codex app-server` binary that the
   plugin communicates with via JSON-RPC is a distinct component of the Codex
   CLI. Its documentation, stability guarantees, and versioning were not
   separately researched.

4. **Actual model invoked**: The plugin references `gpt-5.4-mini` as a
   configurable default model. This model name is newer than August 2025
   training cutoff and was not verified independently. It appears to reflect an
   OpenAI model released after training cutoff.

5. **Windows compatibility of broker**: The broker uses Unix sockets on
   macOS/Linux and named pipes on Windows. The named pipe implementation was
   noted in the DeepWiki source but not separately tested or validated. Given
   the user's Windows environment, this is a relevant gap.

---

## Serendipity

1. **Community MCP wrappers for Codex**: Separate community projects
   (`codex-as-mcp`, `codex-mcp-server`, `tuannvm/codex-mcp-server`) appear to
   wrap the Codex CLI as a proper MCP server — different and predating the
   official plugin [search results]. These may be relevant if the user wants
   deeper MCP integration rather than the slash command approach.

2. **`fcakyon/claude-codex-settings`**: A developer published a personal
   configuration repo combining Claude Code and Codex settings, skills,
   commands, hooks, agents, and MCP servers [search results]. This may be a
   useful reference for power users wanting to maximize both tools.

3. **GitHub issue #8342 on openai/codex**: An issue exists titled "Expose MCP
   Server Prompts as Slash Commands Like Claude Code" — suggesting the Claude
   Code plugin architecture may have inspired feature requests back into the
   Codex CLI itself [search results].

4. **`36kr.com` article framing**: One source framed the plugin as OpenAI
   "seizing the opportunity with a sneaky plugin to steal the spotlight" when
   Claude Code pricing was criticized as unaffordable [search results]. This
   suggests the plugin may have been timed strategically around Claude Code
   pricing backlash, though this could not be confirmed.

---

## Confidence Distribution

- HIGH claims: 7
- MEDIUM claims: 1
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH** — Multiple independent sources including the
  official GitHub repository and OpenAI's own community forum confirm all
  primary claims. Technical architecture is detailed and internally consistent
  across the DeepWiki deep-dive, GitHub README, and independent developer
  analyses.
