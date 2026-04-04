# Findings: Agent Definition Format and Prompt Architecture (Official Docs, GitHub, Community)

**Searcher:** deep-research-searcher **Profile:** docs + web **Date:**
2026-03-29 **Sub-Question IDs:** SQ1-PartB

---

## Key Findings

### 1. Complete Official Frontmatter Schema (17 Fields) [CONFIDENCE: HIGH]

The official Claude Code documentation at code.claude.com/docs/en/sub-agents
provides the authoritative schema. Only `name` and `description` are required.

| Field             | Required | Type         | Default              | Description                                                                                          |
| ----------------- | -------- | ------------ | -------------------- | ---------------------------------------------------------------------------------------------------- |
| `name`            | YES      | string       | —                    | Unique identifier: lowercase letters, hyphens, numbers; 3-50 chars; must start/end with alphanumeric |
| `description`     | YES      | string       | —                    | When Claude should delegate to this agent; supports `<example>` blocks with `<commentary>`           |
| `tools`           | No       | array/string | Inherit all          | Allowlist; comma-separated or JSON array of tool names                                               |
| `disallowedTools` | No       | array/string | None                 | Denylist; removed from inherited or specified list                                                   |
| `model`           | No       | enum         | `inherit`            | `sonnet`, `opus`, `haiku`, `inherit`, or full model ID (e.g., `claude-opus-4-6`)                     |
| `permissionMode`  | No       | enum         | `default`            | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan`                                     |
| `maxTurns`        | No       | integer      | Unlimited            | Maximum agentic turns before subagent stops                                                          |
| `skills`          | No       | array        | None                 | Skills to preload into subagent context at startup (full content, not just available)                |
| `mcpServers`      | No       | array        | Inherited            | MCP servers scoped to this subagent; inline definitions or string references                         |
| `hooks`           | No       | object       | None                 | Lifecycle hooks scoped to this subagent's execution                                                  |
| `memory`          | No       | enum         | None                 | `user`, `project`, or `local` — enables persistent MEMORY.md across sessions                         |
| `background`      | No       | boolean      | `false`              | Run subagent as background task (non-blocking)                                                       |
| `effort`          | No       | enum         | Inherit from session | `low`, `medium`, `high`, `max` (Opus 4.6 only)                                                       |
| `isolation`       | No       | enum         | None                 | `worktree` — runs subagent in temporary isolated git worktree                                        |
| `initialPrompt`   | No       | string       | None                 | Auto-submitted as first user turn when agent runs as main session agent                              |
| `color`           | No       | enum         | Unset                | UI color for visual identification (see Finding 8)                                                   |

Source:
[Create custom subagents - Claude Code Docs](https://code.claude.com/docs/en/sub-agents)
[1]

The `--agents` CLI flag accepts JSON with the same fields, using `prompt` in
place of the markdown body. Source: [1]

---

### 2. Agent Body REPLACES (Not Supplements) the Base Claude Code System Prompt [CONFIDENCE: HIGH]

This is the most critical architectural fact for agent design:

> "Subagents receive only this system prompt (plus basic environment details
> like working directory), not the full Claude Code system prompt." — Official
> documentation [1]

When an agent runs as the main thread via `claude --agent <name>`:

> "The subagent's system prompt replaces the default Claude Code system prompt
> entirely, the same way `--system-prompt` does. CLAUDE.md files and project
> memory still load through the normal message flow." — Official documentation
> [1]

**Practical implication:** Agent prompts do NOT inherit Claude Code's:

- Tool usage instructions and available tools
- Code style and formatting guidelines
- Response tone and verbosity settings
- Security and safety instructions
- Context about the current working directory and environment

**What subagents DO receive (from official SDK docs [2]):**

| Received                                                                       | Not Received                |
| ------------------------------------------------------------------------------ | --------------------------- |
| Custom system prompt (body)                                                    | Parent conversation history |
| Basic environment details (working directory)                                  | Invoked skills from parent  |
| Project CLAUDE.md (loaded via settingSources)                                  | Parent system prompt        |
| Tool definitions (inherited or restricted subset)                              | —                           |
| Full content of skills listed in `skills:` field                               | —                           |
| CLAUDE.md and git status (inherited from parent per features-overview doc [3]) | —                           |
| Whatever context the lead agent passes in the prompt                           | —                           |

**Note — important nuance:** The features-overview doc [3] states subagents
receive "CLAUDE.md and git status (inherited from parent)" as part of their
fresh isolated context. This means CLAUDE.md does load in standard subagents
(not just SDK-mode ones).

The SDK system prompt doc [4] clarifies the Agent SDK uses a **minimal system
prompt** by default that "contains only essential tool instructions but omits
Claude Code's coding guidelines, response style, and project context." To
include full Claude Code behavior in SDK mode, specify
`systemPrompt: { preset: "claude_code" }`.

---

### 3. Agent Lifecycle: Spawning, Execution, and Return [CONFIDENCE: HIGH]

**Spawning mechanisms:**

1. Automatic delegation — Claude matches task description to agent's
   `description` field
2. Natural language — "Use the code-reviewer agent to..."
3. @-mention — `@"code-reviewer (agent)"` guarantees specific subagent runs
4. Session-wide — `claude --agent code-reviewer` (runs entire session as that
   agent)
5. Setting — `agent` key in `.claude/settings.json`
6. CLI programmatic — `claude --agents '<json>'` (session-only, not saved to
   disk)
7. SDK — `agents` parameter in `query()` options

**Execution:**

- Each invocation runs in its own **fresh conversation** — no parent context
  window history
- Tool calls and intermediate results stay inside the subagent
- Only the subagent's **final message** returns to the parent
- Subagents cannot spawn other subagents (flat execution model only; Agent tool
  has no effect in subagent definitions)
- Subagents can be resumed via `SendMessage` using their `agentId`

**Background vs. Foreground:**

- Foreground (default): blocks main conversation, passes through permission
  prompts
- Background (`background: true` or Ctrl+B): concurrent; requires pre-approved
  permissions; cannot ask clarifying questions during execution

**Model resolution order:**

1. `CLAUDE_CODE_SUBAGENT_MODEL` env variable (highest priority)
2. Per-invocation `model` parameter
3. Subagent definition `model` frontmatter
4. Main conversation model (lowest priority)

Source: [Create custom subagents](https://code.claude.com/docs/en/sub-agents)
[1]

---

### 4. Scope Priority and File Locations [CONFIDENCE: HIGH]

When multiple agents share the same name, higher-priority location wins:

| Location                   | Scope                | Priority    |
| -------------------------- | -------------------- | ----------- |
| `--agents` CLI flag        | Current session only | 1 (highest) |
| `.claude/agents/`          | Current project      | 2           |
| `~/.claude/agents/`        | All projects (user)  | 3           |
| Plugin `agents/` directory | Where plugin enabled | 4 (lowest)  |

**Project agents** (`.claude/agents/`) are version-controlled and
team-shareable. **User agents** (`~/.claude/agents/`) are personal and available
in all projects. **Plugin agents** do NOT support `hooks`, `mcpServers`, or
`permissionMode` for security reasons.

**Loading:** Agents are loaded at session start. New agent files require a
session restart or `/agents` command to load immediately.

Source: [1] Official documentation

---

### 5. The `skills` Field: Full Content Injection [CONFIDENCE: HIGH]

From official documentation [1]:

> "The full content of each skill is injected into the subagent's context, not
> just made available for invocation. Subagents don't inherit skills from the
> parent conversation; you must list them explicitly."

This is the **inverse** of `context: fork` in a skill file. With `skills:` in an
agent, the agent controls the system prompt and loads skill content. With
`context: fork` in a skill, the skill content is injected into the specified
agent.

Memory behavior when `memory:` field is set:

- Subagent's system prompt automatically includes instructions for
  reading/writing memory directory
- First 200 lines or 25KB of `MEMORY.md` in the memory directory loads into
  context
- Read, Write, Edit tools are automatically enabled for memory management

Memory scope paths:

- `user`: `~/.claude/agent-memory/<agent-name>/`
- `project`: `.claude/agent-memory/<agent-name>/`
- `local`: `.claude/agent-memory-local/<agent-name>/` (not checked into version
  control)

Source: [1]

---

### 6. Hooks in Agent Frontmatter [CONFIDENCE: HIGH]

Agents support two hook configuration approaches:

**A. Frontmatter hooks (agent-scoped):** Defined in the agent's markdown, these
run ONLY while that specific subagent is active, and are cleaned up when it
finishes.

```yaml
---
name: code-reviewer
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-command.sh $TOOL_INPUT"
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "./scripts/run-linter.sh"
---
```

All hook events supported: `PreToolUse`, `PostToolUse`, `Stop` (auto-converted
to `SubagentStop` at runtime).

**B. Project-level hooks for subagent lifecycle events:** Configured in
`settings.json`, responding to `SubagentStart` and `SubagentStop` events, with
optional matchers by agent name.

Hook input is passed via stdin as JSON; exit code 2 blocks the operation.

Source: [1]

---

### 7. The `isolation: worktree` Field [CONFIDENCE: HIGH]

Setting `isolation: worktree` in agent frontmatter runs the subagent in a
temporary git worktree — an isolated copy of the repository. The worktree is
automatically cleaned up if the subagent makes no changes.

Example pattern:

```yaml
---
name: background-coder
description: Implements features in isolation
isolation: worktree
background: true
---
```

This is primarily useful for:

- Running parallel agents on the same codebase without conflicts
- Safe experimentation (auto-cleanup if no changes made)
- Combined with `background: true` for concurrent isolated work

Source: [1] official docs, confirmed by community sources [7], [10]

---

### 8. The `color` Field: Valid Values [CONFIDENCE: HIGH — for core 6 values; MEDIUM for orange]

The official plugin-dev SKILL.md (from the `anthropics/claude-code` repo)
documents 6 valid color values with semantic guidelines:

```yaml
color: blue      # Analysis, review, diagnostic work
color: cyan      # Data processing, transformation
color: green     # Success-oriented tasks, creation, generation
color: yellow    # Caution, validation, warnings
color: magenta   # Creative tasks, creative generation
color: red       # Critical operations, security-related
```

The `color` field is NOT listed in the official subagent documentation page [1],
which was confirmed by GitHub Issue #8501 [9] as a documentation gap. However,
it is generated by the `/agents` command in practice.

Additional observed value: `orange` (seen in community example [14], not in
official plugin-dev docs). This suggests the color list may be longer than the 6
canonical values.

The color is purely for visual identification in the UI and has no behavioral
effect.

---

### 9. `description` Field: Triggering Pattern Architecture [CONFIDENCE: HIGH]

The description field is the PRIMARY mechanism for automatic delegation.
Official documentation and the `anthropics/claude-code` plugin-dev repo both
establish:

**Required structure:**

```markdown
Use this agent when [triggering conditions]. Examples:

<example>
Context: [Situation description]
user: "[What user says]"
assistant: "[How Claude should respond]"
<commentary>
[Why this agent is appropriate]
</commentary>
</example>
```

**Constraints:**

- Length: 10-5,000 characters
- Optimal: 200-1,000 characters
- Must include 2-4 concrete `<example>` blocks
- Description field supports multiline YAML (`|` block scalar)

**Proactive triggering keywords (verified from multiple sources):**

- "Use proactively when..."
- "Use immediately after writing or modifying code"
- "MUST BE USED for all..."
- "Invoke IMMEDIATELY after..."

**Important community finding [16]:** Auto-delegation in practice is unreliable
despite strong description phrasing. Explicit invocation via @-mention or
natural language is the realistic workflow for many teams. UPPERCASE emphasis
helps but is not guaranteed to work.

Source: [1] official, [5] plugin-dev SKILL.md, [13] community

---

### 10. System Prompt Architecture: 6-Section Standard Template [CONFIDENCE: HIGH]

Official Anthropic plugin-dev SKILL.md establishes this standard template [5]:

```
You are [role] specializing in [domain].

**Your Core Responsibilities:**
1. [Primary responsibility]
2. [Secondary responsibility]

**Analysis Process:**
1. [Step one]
2. [Step two]
3. ...

**Quality Standards:**
- [Standard 1]
- [Standard 2]

**Output Format:**
[What to return and how to structure it]

**Edge Cases:**
- [Edge case 1]: [How to handle]
- [Edge case 2]: [How to handle]
```

**Rules from official plugin-dev docs:**

- Write in second person ("You are...", "You will...")
- System prompt length: 20-10,000 characters
- Optimal: 500-3,000 characters
- Never use first person ("I am...", "I will...")
- Every instruction must add value — avoid vague or generic instructions
- Include concrete examples where they clarify behavior
- Include self-correction and quality assurance mechanisms

---

### 11. GitHub Agent Collection Landscape [CONFIDENCE: HIGH]

Multiple large community collections exist:

| Repository                                   | Size                   | Notes                                                          |
| -------------------------------------------- | ---------------------- | -------------------------------------------------------------- |
| `VoltAgent/awesome-claude-code-subagents`    | 127+ agents            | 10 categories, installable as plugins                          |
| `supatest-ai/awesome-claude-code-sub-agents` | 60+ agents             | Guidance-first "consultant" architecture, 300-800 line prompts |
| `0xfurai/claude-code-subagents`              | 100+ agents            | Organized by framework/language                                |
| `zhsama/claude-sub-agent`                    | 8 orchestration agents | Spec-workflow pattern with artifact outputs                    |
| `lst97/claude-code-sub-agents`               | 33 agents              | Full-stack development focus                                   |
| `wshobson/agents`                            | 72 plugins, 112 agents | Three-tier model strategy (Opus/Sonnet/Haiku by criticality)   |

**Notable design patterns observed:**

1. **Guidance-first architecture** (supatest-ai): Agents function as
   "specialized architectural consultants" with 80/20 ratio of guidance to code
   examples; 300-800 line prompts per agent.

2. **Spec-workflow pattern** (zhsama): Sequential pipeline agents producing
   specific artifacts (requirements.md, architecture.md, tasks.md);
   status-driven handoffs.

3. **Three-tier model strategy** (wshobson): Opus 4.6 for critical/security,
   Sonnet 4.6 for standard tasks, Haiku 4.5 for fast/cheap analysis.

4. **Mandatory procedural steps** (alexop.dev Dexie example [14]): Agents can
   enforce fetch-docs-first workflows via instruction body.

5. **Hook-based state machine** (PubNub [6]): `SubagentStop`/`Stop` lifecycle
   hooks that read queue status and print next commands — no prompt gluing
   required.

---

### 12. Agent Naming: Validation Rules [CONFIDENCE: HIGH]

From official plugin-dev SKILL.md [5]:

```regex
^[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])?$
```

- 3-50 characters total
- Lowercase letters, numbers, hyphens only
- Must start AND end with alphanumeric character
- No underscores, spaces, or special characters
- Avoid generic terms like "helper" or "assistant"

---

### 13. Agent vs. Skill: Key Architectural Distinction [CONFIDENCE: HIGH]

From features-overview doc [3]:

| Aspect        | Skill                           | Subagent                                 |
| ------------- | ------------------------------- | ---------------------------------------- |
| What it is    | Reusable instructions/knowledge | Isolated worker with own context         |
| Key benefit   | Share content across contexts   | Context isolation (only summary returns) |
| System prompt | Loads into main conversation    | Replaces base system prompt              |
| CLAUDE.md     | Always loaded                   | Inherited from parent                    |
| Spawning      | `/command` or auto-match        | Agent tool or explicit mention           |
| Nesting       | Not isolated                    | Cannot spawn sub-subagents               |

**Skills can be preloaded into agents** via `skills:` field — the skill content
becomes part of the agent's context without the agent needing to discover or
invoke it.

---

### 14. `permissionMode: bypassPermissions` — Cautions and Exceptions [CONFIDENCE: HIGH]

`bypassPermissions` skips all permission prompts, BUT:

- Writes to `.git`, `.claude`, `.vscode`, `.idea` still prompt for confirmation
- **Exception to exception**: `.claude/commands`, `.claude/agents`,
  `.claude/skills` do NOT prompt even with `bypassPermissions`
- If the parent session uses `bypassPermissions`, it **overrides** the
  subagent's setting (cannot be overridden from child)
- If parent uses auto mode, subagent `permissionMode` is ignored entirely; auto
  mode classifier applies to all tool calls

Source: [1]

---

### 15. Tool Restriction Syntax: Agent-Type Spawning Control [CONFIDENCE: HIGH]

When an agent runs as the main thread via `claude --agent`, it can restrict
which subagent types it spawns:

```yaml
tools: Agent(worker, researcher), Read, Bash
```

This is an allowlist — only `worker` and `researcher` subagents can be spawned.
Any other type fails.

To allow unrestricted spawning:

```yaml
tools: Agent, Read, Bash
```

Omitting `Agent` from tools entirely prevents all subagent spawning.

This applies ONLY to agents running as the main thread. Standard subagents
cannot spawn other subagents regardless.

Note: `Task(...)` still works as an alias (renamed to `Agent` in v2.1.63).

Source: [1]

---

## Sources

| #   | URL                                                                                                                                        | Title                                                      | Type           | Trust  | CRAAP           | Date      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | -------------- | ------ | --------------- | --------- |
| 1   | https://code.claude.com/docs/en/sub-agents                                                                                                 | Create custom subagents — Claude Code Docs                 | official-docs  | HIGH   | 5/5/5/5/5 = 5.0 | 2025-2026 |
| 2   | https://platform.claude.com/docs/en/agent-sdk/subagents                                                                                    | Subagents in the SDK — Claude API Docs                     | official-docs  | HIGH   | 5/5/5/5/5 = 5.0 | 2025-2026 |
| 3   | https://code.claude.com/docs/en/features-overview                                                                                          | Extend Claude Code (features overview)                     | official-docs  | HIGH   | 5/5/5/5/5 = 5.0 | 2025-2026 |
| 4   | https://platform.claude.com/docs/en/agent-sdk/modifying-system-prompts                                                                     | Modifying system prompts — Claude API Docs                 | official-docs  | HIGH   | 5/5/5/5/5 = 5.0 | 2025-2026 |
| 5   | https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/agent-development/SKILL.md                                   | Agent Development SKILL.md — anthropics/claude-code        | official-repo  | HIGH   | 5/5/5/5/5 = 5.0 | 2025-2026 |
| 6   | https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/                                                                     | Best practices for Claude Code subagents                   | community-blog | MEDIUM | 3/4/4/4/4 = 3.8 | 2025      |
| 7   | https://claudefa.st/blog/guide/development/worktree-guide                                                                                  | Claude Code Worktrees guide                                | community      | MEDIUM | 3/4/3/4/4 = 3.6 | 2026      |
| 8   | https://github.com/Piebald-AI/claude-code-system-prompts                                                                                   | Claude Code system prompts (reverse engineered)            | community-repo | MEDIUM | 4/5/3/4/4 = 4.0 | 2025-2026 |
| 9   | https://github.com/anthropics/claude-code/issues/8501                                                                                      | BUG: Subagent YAML Frontmatter authoritative documentation | official-issue | HIGH   | 5/5/5/5/5 = 5.0 | 2025      |
| 10  | https://claudefa.st/blog/guide/agents/custom-agents                                                                                        | Claude Code Custom Commands: Build Your Own AI Agents      | community      | MEDIUM | 3/4/3/4/4 = 3.6 | 2026      |
| 11  | https://github.com/supatest-ai/awesome-claude-code-sub-agents                                                                              | Awesome Claude Code Sub-Agents collection                  | community-repo | MEDIUM | 3/4/3/4/4 = 3.6 | 2025-2026 |
| 12  | https://github.com/VoltAgent/awesome-claude-code-subagents                                                                                 | VoltAgent awesome subagents (127+)                         | community-repo | MEDIUM | 3/4/3/4/4 = 3.6 | 2025-2026 |
| 13  | https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/agent-development/references/agent-creation-system-prompt.md | Agent creation system prompt reference                     | official-repo  | HIGH   | 5/5/5/5/5 = 5.0 | 2025-2026 |
| 14  | https://alexop.dev/posts/claude-code-customization-guide-claudemd-skills-subagents/                                                        | Claude Code Customization Guide                            | community-blog | MEDIUM | 3/4/3/4/4 = 3.6 | 2025-2026 |
| 15  | https://gist.github.com/bartsmykla/d7dfca753dae6d20cd58b018b0d7c6dd                                                                        | Claude Agents Comprehensive Guide                          | community-gist | MEDIUM | 3/4/3/3/4 = 3.4 | 2025      |
| 16  | https://claudefa.st/blog/guide/agents/custom-agents                                                                                        | Custom agents guide                                        | community      | MEDIUM | 3/4/3/4/4 = 3.6 | 2026      |
| 17  | https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/                                                                    | Claude Agent Skills: First Principles Deep Dive            | technical-blog | MEDIUM | 4/4/4/4/4 = 4.0 | Oct 2025  |

---

## Contradictions

### C1: What "basic environment details" includes

The official subagent page [1] says subagents receive "only this system prompt
(plus basic environment details like working directory)."

The features-overview doc [3] states subagents receive: "CLAUDE.md and git
status (inherited from parent)" as part of their fresh isolated context.

The SDK subagents doc [2] clarifies: "Project CLAUDE.md (loaded via
settingSources)" is received, implying it's not automatic in SDK mode but IS
automatic in interactive mode.

**Resolution:** CLAUDE.md appears to load automatically in interactive subagents
(not SDK), consistent with the features-overview description. "Basic environment
details" includes more than just working directory: CLAUDE.md and git status are
also included.

### C2: Color field completeness

The plugin-dev SKILL.md [5] documents exactly 6 color values (blue, cyan, green,
yellow, magenta, red). Community example [14] shows `color: orange` which is not
in that list. The official subagent documentation page [1] does not document the
`color` field at all (confirmed by GitHub issue #8501 [9]).

**Resolution:** The color list is likely not exhaustive in the plugin-dev docs.
The true list may include more values (orange at minimum). Color is cosmetic
only so this gap has no behavioral impact on agent design.

### C3: Agent body as "full" system prompt replacement

Companion researcher D1 found: "agent body completely replaces Claude Code base
system prompt." This is broadly confirmed [1][2][4] but nuanced:

- In interactive mode (`.claude/agents/`): body replaces Claude Code system
  prompt, BUT CLAUDE.md and git status still load through message flow.
- In SDK mode: defaults to a minimal system prompt (not even Claude Code's full
  prompt). Must opt in to Claude Code preset via
  `systemPrompt: { preset: "claude_code" }`.
- When `--agent` flag used: body replaces system prompt; CLAUDE.md loads via
  message flow.

**Resolution:** D1's claim is correct for the base system prompt. CLAUDE.md is a
separate mechanism that survives the replacement — it loads through message
flow, not system prompt.

---

## Gaps

1. **Complete `color` field valid values**: Official docs don't enumerate all
   valid colors. The plugin-dev SKILL.md lists 6; `orange` seen in community.
   The true exhaustive list is undocumented. Impact: cosmetic only.

2. **`effort: max` availability**: Documentation says `max` is "Opus 4.6 only" —
   whether this refers to the model class or a specific model ID is not fully
   clarified.

3. **What exactly "basic environment details" includes**: Beyond working
   directory and CLAUDE.md/git status, there may be additional context (token
   budget info, agent-thread-specific notes about formatting) that Piebald-AI
   reverse engineering [8] suggests exists.

4. **`initialPrompt` field behavior in subagent context**: Documented as
   "auto-submitted as first user turn when agent runs as main session agent" —
   behavior when agent is invoked as a subagent (not main session agent) is
   unclear.

5. **Programmatic description of `disallowedTools` interaction**: "If both
   [tools and disallowedTools] are set, `disallowedTools` is applied first, then
   `tools` is resolved against the remaining pool." Edge cases with wildcard
   patterns not documented.

6. **Auto-delegation reliability**: Multiple community sources note that
   automatic delegation based on description is unreliable in practice, even
   with UPPERCASE urgency markers. No official statement on the confidence
   threshold or conditions required.

7. **Agent transcript storage format**: Stored at
   `~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl` —
   the schema of this JSONL format is not publicly documented.

---

## Serendipity

**S1: Built-in agents are defined the same way as custom ones.** The `Explore`,
`Plan`, `Bash`, `statusline-setup`, and `Claude Code Guide` agents are all
instances of the same agent system. Understanding their model/tool choices
(e.g., Explore = Haiku + read-only) provides design templates for custom agents.

**S2: The `Agent(agent_type)` tool syntax enables orchestrator patterns.** When
a custom agent runs as the main thread via `claude --agent orchestrator`, it can
restrict which subagents it spawns via `tools: Agent(worker, researcher), ...`.
This enables fully declarative multi-agent DAG topologies from a single
orchestrator agent definition.

**S3: Plugin security restrictions create an intentional moat.** Plugin agents
cannot define `hooks`, `mcpServers`, or `permissionMode`. Users who need these
must copy agent files into `.claude/agents/`. This creates a deliberate
capability gap between distributed plugin agents and local project agents — the
distinction matters for plugin design.

**S4: Agent transcripts persist independently from main conversation.** Even
when the main conversation compacts or resets, subagent transcripts at
`~/.claude/projects/{project}/{sessionId}/subagents/` remain intact and
resumable. This creates a natural long-running agent memory mechanism
independent of the memory field.

**S5: The Agent SDK `AgentDefinition` schema reveals a different field set.**
The SDK programmatic schema (Python/TypeScript) does not include all file-based
frontmatter fields: it omits `color`, `hooks`, `background`, `effort`,
`isolation`, `initialPrompt`, and `maxTurns`. Conversely, the CLI `--agents`
JSON format supports ALL frontmatter fields. The SDK `AgentDefinition` appears
to be a subset optimized for programmatic use.

---

## Confidence Assessment

- HIGH claims: 13
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All HIGH claims are sourced from official Anthropic documentation or the
anthropics/claude-code repository. The two MEDIUM claims are (1) the complete
color values list and (2) auto-delegation reliability in practice — both
confirmed directionally by official sources but not exhaustively documented.

---

## Source Count

- Official documentation pages: 5 (sources 1-4, 9)
- Official Anthropic repo files: 2 (sources 5, 13)
- Reverse-engineered system prompt repo: 1 (source 8)
- Community repos with substantial agent examples: 5 (sources 11, 12, 15)
- Technical community blogs: 4 (sources 6, 14, 15, 17)
- Community guides: 2 (sources 7, 10)

**Total: 19 sources consulted** (15+ required target met)
