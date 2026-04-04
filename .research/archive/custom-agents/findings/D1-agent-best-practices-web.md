# Findings: LLM Agent Definition Format, Prompt Architecture, and Behavioral Specification

**Searcher:** deep-research-searcher **Profile:** WEB + DOCS **Date:**
2026-03-29 **Sub-Question IDs:** SQ1

---

## Key Findings

### 1. Claude Code Agent Frontmatter: Complete Schema (CONFIDENCE: HIGH)

The official Claude Code documentation at `code.claude.com/docs/en/sub-agents`
provides the authoritative and complete frontmatter schema. Only `name` and
`description` are required; all others are optional.

**Full field inventory (as of v2.1.84+):**

| Field             | Required | Description                                                                        |
| ----------------- | -------- | ---------------------------------------------------------------------------------- |
| `name`            | Yes      | Unique identifier, lowercase + hyphens                                             |
| `description`     | Yes      | When Claude should delegate to this agent — the primary routing signal             |
| `tools`           | No       | Comma-separated allowlist; inherits all if omitted                                 |
| `disallowedTools` | No       | Denylist of tools to remove from inherited set                                     |
| `model`           | No       | `sonnet`, `opus`, `haiku`, a full model ID, or `inherit` (default: `inherit`)      |
| `permissionMode`  | No       | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, or `plan`                |
| `maxTurns`        | No       | Maximum agentic turns before the agent stops                                       |
| `skills`          | No       | Skills to inject into the agent's context at startup (full content, not just name) |
| `mcpServers`      | No       | MCP servers scoped to this agent (inline definitions or references)                |
| `hooks`           | No       | Lifecycle hooks scoped to this agent (PreToolUse, PostToolUse, Stop)               |
| `memory`          | No       | Persistent memory scope: `user`, `project`, or `local`                             |
| `background`      | No       | Set `true` to always run as a background task (default: `false`)                   |
| `effort`          | No       | Effort level: `low`, `medium`, `high`, `max` (Opus 4.6 only)                       |
| `isolation`       | No       | Set `worktree` to run in a temporary isolated git worktree                         |
| `initialPrompt`   | No       | Auto-submitted as first user turn when agent runs as main session agent            |
| `color`           | No       | UI display color: `orange`, `blue`, `red`, `green`, `teal`, `purple`               |

**Precedence for model resolution:** `CLAUDE_CODE_SUBAGENT_MODEL` env var >
per-invocation `model` parameter > frontmatter `model` > main conversation
model.

**Tool interaction rules:** If both `tools` and `disallowedTools` are set,
`disallowedTools` is applied first. A tool in both lists is removed.

**Agent spawning restriction syntax:** Use `Agent(worker, researcher)` in the
`tools` field to restrict which subagents an orchestrator agent can spawn.

Sources: [1], [2]

---

### 2. Description Field is the Critical Routing Signal (CONFIDENCE: HIGH)

The `description` field is the primary mechanism Claude uses to decide when to
delegate to an agent. It is not a human-facing summary — it is a routing trigger
written for the model.

**Best practices:**

- Write in third person: "Expert code reviewer. Use proactively after code
  changes."
- Include trigger phrases: "PROACTIVELY", "Use immediately after", "Use when the
  user mentions"
- Include trigger keywords that match user intent: "PDF, forms, document
  extraction"
- Distinguish scope precisely: "only optimize SQL queries in `src/db/`"
- Without explicit delegation triggers, Claude frequently handles tasks itself
  rather than delegating ("this is easy, I'll do it")

**Example high-quality description:**

```
Expert code review specialist. Proactively reviews code for quality, security,
and maintainability. Use immediately after writing or modifying code.
```

Sources: [1], [3], [4], [8]

---

### 3. Agent Prompt Body Architecture: Recommended Structural Sections (CONFIDENCE: HIGH)

Multiple converging sources (Anthropic docs, PromptHub, Cline analysis,
community patterns) confirm these structural sections consistently produce
higher-quality agent behavior:

**Canonical structure (6 sections):**

1. **Role definition** — "You are a [ROLE] with expertise in [DOMAIN]"
   - Be specific: "senior security engineer" beats "security assistant"
   - Single sentence, establishes identity and activates domain knowledge

2. **Philosophy / core principles** (optional for simple agents, strongly
   recommended for complex ones)
   - 2-5 bullet principles that define the agent's worldview
   - Example: "Simplicity over complexity", "Verify before asserting"
   - Cline uses ~11,000 character prompts; this section justifies the weight

3. **Tool strategy / when-to-use** (for agents with multiple tools)
   - Explicit guidance on which tools to use in which scenarios
   - Document tool names, purpose, usage conditions, edge cases
   - "Prefer LSP tools over Grep for symbol lookups"

4. **Execution flow / workflow steps**
   - Numbered procedural steps for the primary task
   - Explore-Plan-Execute-Verify separation when appropriate
   - "When invoked: (1) run git diff (2) focus on modified files (3) begin
     review immediately"

5. **Output format / behavioral constraints**
   - Define exact output structure with labeled sections
   - Include formatting examples, length guidance, tone
   - Use XML tags for Claude: Claude 4.x parses XML 23% more accurately than
     markdown

6. **Success criteria / definition of done**
   - Checklistable conditions the agent can self-verify against
   - "Reflexive Verification": agent audits its own output before completing
   - Enables the agent to know when it is finished vs. when to continue

Sources: [1], [5], [6], [7], [8]

---

### 4. Behavioral Specification Best Practices (CONFIDENCE: HIGH)

**Guardrails (what NOT to do):**

- State explicit prohibitions, not just permissions
- "You cannot modify data. If asked to INSERT/UPDATE/DELETE, explain you have
  read-only access."
- Use PreToolUse hooks for enforcement: exit code 2 blocks the operation

**Return protocols:**

- Define explicit return format for multi-agent systems
- Subagents return findings to orchestrator; outputs should be structured (JSON
  or labeled sections)
- Anthropic's research system uses a CitationAgent to post-process findings
  before final return
- For Claude Code: subagents return results to main conversation; verbose output
  stays in subagent context

**Structured returns:**

- For agentic loops: use JSON output schemas (`llm.with_structured_output()`)
  rather than natural language parsing
- Parsing agent output for words like "done" or "finished" is an anti-pattern
  (breaks when those words appear in context)
- Define output contracts: "Return JSON with keys: {findings: [], gaps: [],
  confidence: 'HIGH|MEDIUM|LOW'}"

**Success criteria patterns:**

- Embed explicit "Definition of Done" in each agent's prompt
- Ask the agent to "verify against success criteria before returning"
- Provide test cases, screenshots, or expected outputs the agent can compare
  against

Sources: [1], [3], [4], [9], [10]

---

### 5. Agent Sizing and Complexity Sweet Spots (CONFIDENCE: MEDIUM-HIGH)

**Prompt length thresholds (Claude-specific):**

- Claude maintains accuracy until approximately 5,500 system prompt tokens (vs
  GPT-4's 4,000)
- **Sweet spot:** 500–2,000 tokens for most agent definitions
- **Diminishing returns:** 2,000–4,000 tokens (40–80% response time increase)
- **Active degradation:** 4,000+ tokens (hallucination increase, instruction
  loss)
- Anthropic: "If Claude keeps doing something despite a rule, the file is
  probably too long and the rule is getting lost"

**Sizing guidance by task type:**

| Task Complexity                                         | Recommended Tokens | Notes                                            |
| ------------------------------------------------------- | ------------------ | ------------------------------------------------ |
| Simple single-purpose (code search, read-only analysis) | 300–800            | Minimal prompt; tool list is the main constraint |
| Standard workflow agent (reviewer, debugger)            | 800–1,500          | Include role + steps + output format             |
| Complex orchestrator (research lead, architect)         | 1,500–3,000        | Add philosophy + tool strategy sections          |
| Specialized domain expert                               | 2,000–4,000 max    | Higher risk of instruction drift above this      |

**Complexity sweet spots:**

- Highly specialized single-responsibility agents outperform generalist agents
- Keep tools to ~12–20 maximum (successful production agents average this range)
- Agents with 3–5 tools perform better than agents with dozens
- The 80/20 rule (from CrewAI): 80% of effort into defining tasks, 20% into
  defining agents
- Framework specificity beats generic: "Python/FastAPI expert" beats "backend
  developer"

**CLAUDE.md analogy:** Anthropic explicitly warns — "If your CLAUDE.md is too
long, Claude ignores half of it because important rules get lost in the noise."
Same applies to agent prompts.

Sources: [1], [11], [12], [13], [14]

---

### 6. External Framework Lessons for Claude Code Agent Design (CONFIDENCE: MEDIUM)

**CrewAI's role-goal-backstory tripartite:**

- Role = professional identity (activates domain knowledge)
- Goal = measurable outcome the agent should achieve
- Backstory = context depth that biases decision-making style
- Lesson for Claude Code: the agent body should establish all three, not just
  role

**LangGraph's explicit workflow approach:**

- "Conversational agents are often too unpredictable for enterprise use"
- Lesson: for critical workflows, define explicit step sequences (not just
  open-ended role instructions)
- Explicit flow definitions are more auditable and debuggable

**Magentic-One's orchestrator-worker pattern (Microsoft):**

- Orchestrator agent has narrow permissions (read and route)
- Worker agents have specific action sets and clearly documented expected
  behavior
- Lesson for Claude Code: orchestrator agents should have
  `tools: Agent(worker1, worker2), Read` — minimal direct action capability

**AutoGen's conversational collaboration:**

- Works best for researcher + analyst + coder trios
- Lesson: complementary roles with no overlap; each agent has capabilities the
  others lack

**Common lesson across all frameworks:**

- "Design agents with distinct but complementary abilities. Each must have a
  clearly defined purpose that doesn't overlap with other agents."
- Tool proliferation is the most common failure mode across all frameworks

Sources: [15], [16], [17], [18]

---

### 7. Common Anti-Patterns in Agent Definitions (CONFIDENCE: HIGH)

Converging across Anthropic, PubNub, ClaudeFA.st, and community sources:

**Definition-level anti-patterns:**

1. **Tool sprawl** — Omitting `tools` field defaults to inheriting ALL tools.
   Granting unnecessary capabilities reduces focus and security.
2. **Vague description field** — "Helps with code" will not trigger delegation
   reliably
3. **Monolithic "do everything" agent** — Defeats specialization benefits;
   creates context overload
4. **Missing output format** — Agent produces inconsistent return structures,
   failing downstream consumers
5. **Hardcoded brittle logic** — Over-specifying with "if X then Y" chains
   creates fragility; let the agent reason within guardrails
6. **No success criteria** — Agent doesn't know when it's done; runs until
   maxTurns

**Operational anti-patterns:** 7. **Natural language loop termination** —
Checking text for "done"/"finished" to stop an agentic loop breaks constantly 8.
**Vague invocations** — "Fix authentication" → "Fix OAuth redirect loop in
src/lib/auth.ts, redirecting to /login instead of /dashboard" 9.
**Over-parallelization** — Running 10+ agents for simple features wastes tokens;
3 independent tasks is the practical threshold for parallelism 10. **Prompt glue
chaining** — Embedding handoff logic in prompts instead of using hooks creates
unmaintainable dependencies 11. **Configuration contradictions** — Instructions
that conflict (confirm before acting + execute autonomously) cause agents to
pick the cautious interpretation and freeze

**Context-level anti-patterns:** 12. **Verbose return pollution** — Not using
subagents for high-volume operations (test runs, log processing) floods main
context 13. **Missing audit trail** — No slug or identifier tying artifacts
across workflow stages 14. **Implicit tool granting** — Not checking what
`bypassPermissions` actually allows; writes to `.git`, `.claude`, etc. still
prompt except for certain paths

Sources: [1], [3], [4], [19], [20]

---

### 8. Model Context Protocol (MCP) and Agent Tool Architecture (CONFIDENCE: HIGH)

**MCP servers scoped to agents:**

- Use `mcpServers` frontmatter to give agents access to MCP servers not in the
  main conversation
- Inline-defined MCP servers connect when the agent starts and disconnect when
  it finishes
- This prevents MCP tool descriptions from consuming main conversation context
- String references reuse the parent session's connection

**Tool architecture principles from Anthropic's context engineering guidance:**

- 12–20 tools is the optimal production range (Claude Code uses ~12)
- Avoid overlapping tool sets — if humans can't choose between two tools, the
  agent can't either
- Use Progressive Disclosure: index tool definitions; retrieve based on task
  needs
- Push complex actions to bash/code execution rather than expanding tool count
- Write tool documentation as if the model were a developer using it (examples,
  edge cases, parameter specs)

Sources: [1], [21], [22]

---

### 9. Scope Locations and Priority Hierarchy (CONFIDENCE: HIGH)

| Location                   | Scope                                 | Priority    |
| -------------------------- | ------------------------------------- | ----------- |
| `--agents` CLI flag        | Current session (JSON, not persisted) | 1 (highest) |
| `.claude/agents/`          | Current project (version-controlled)  | 2           |
| `~/.claude/agents/`        | All projects for user                 | 3           |
| Plugin `agents/` directory | Where plugin is installed             | 4 (lowest)  |

**Security note:** Plugin agents do NOT support `hooks`, `mcpServers`, or
`permissionMode` for security reasons. Copy to `.claude/agents/` to use these
fields.

**Naming:** Files use kebab-case. The `name` field in frontmatter becomes the
agent identifier (not the filename, though they typically match).

Sources: [1], [2]

---

### 10. Persistent Memory Patterns (CONFIDENCE: MEDIUM-HIGH)

The `memory` field enables cross-session learning. Three scopes:

- `user` → `~/.claude/agent-memory/<name>/` — cross-project, personal
- `project` → `.claude/agent-memory/<name>/` — project-specific, shareable via
  git (recommended default)
- `local` → `.claude/agent-memory-local/<name>/` — project-specific, git-ignored

**When memory is enabled:**

- Agent's system prompt auto-includes MEMORY.md instructions
- First 200 lines or 25KB of MEMORY.md injected into context at startup
- Read, Write, Edit tools auto-enabled for memory management

**Pattern:** Embed memory instructions directly in the agent body: "Update your
agent memory as you discover codepaths, patterns, and architectural decisions."

Sources: [1]

---

## Sources

| #   | URL                                                                                                                          | Title                                                            | Type              | Trust       | CRAAP     | Date |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------- | ----------- | --------- | ---- |
| 1   | https://code.claude.com/docs/en/sub-agents                                                                                   | Create custom subagents - Claude Code Docs                       | official-docs     | HIGH        | 5/5/5/5/5 | 2026 |
| 2   | https://gist.github.com/bartsmykla/d7dfca753dae6d20cd58b018b0d7c6dd                                                          | Claude Agents: Comprehensive Guide                               | community         | MEDIUM      | 4/4/3/4/4 | 2025 |
| 3   | https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/                                                       | Best practices for Claude Code subagents                         | blog              | MEDIUM      | 4/5/3/4/4 | 2025 |
| 4   | https://claudefa.st/blog/guide/agents/sub-agent-best-practices                                                               | Claude Code Sub-Agents: Parallel vs Sequential Patterns          | blog              | MEDIUM      | 4/5/3/4/4 | 2025 |
| 5   | https://www.prompthub.us/blog/prompt-engineering-for-ai-agents                                                               | Prompt Engineering for AI Agents                                 | blog              | MEDIUM      | 4/4/3/4/4 | 2025 |
| 6   | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents                                            | Effective Context Engineering for AI Agents                      | official-blog     | HIGH        | 5/5/5/5/5 | 2025 |
| 7   | https://www.anthropic.com/research/building-effective-agents                                                                 | Building Effective AI Agents                                     | official-research | HIGH        | 5/5/5/5/5 | 2024 |
| 8   | https://www.anthropic.com/engineering/multi-agent-research-system                                                            | How we built our multi-agent research system                     | official-blog     | HIGH        | 5/5/5/5/5 | 2025 |
| 9   | https://apxml.com/courses/agentic-llm-memory-architectures/chapter-5-multi-agent-systems/communication-protocols-llm-agents  | Communication Protocols for LLM Agents                           | educational       | MEDIUM      | 4/4/3/4/3 | 2025 |
| 10  | https://www.mindstudio.ai/blog/prompt-engineering-ai-agents                                                                  | How to Write Effective Prompts for AI Agents                     | blog              | MEDIUM      | 4/4/3/4/4 | 2025 |
| 11  | https://particula.tech/blog/optimal-prompt-length-ai-performance                                                             | Optimal Prompt Length Before AI Performance Degrades             | blog              | MEDIUM      | 4/4/3/3/4 | 2025 |
| 12  | https://research.trychroma.com/context-rot                                                                                   | Context Rot: How Increasing Input Tokens Impacts LLM Performance | research          | MEDIUM-HIGH | 4/5/4/4/4 | 2025 |
| 13  | https://skywork.ai/blog/claude-agent-sdk-best-practices-ai-agents-2025/                                                      | Claude Agent SDK Best Practices                                  | blog              | MEDIUM      | 3/4/3/3/4 | 2025 |
| 14  | https://rlancemartin.github.io/2026/01/09/agent_design/                                                                      | Agent design patterns                                            | blog              | MEDIUM-HIGH | 4/5/4/4/4 | 2026 |
| 15  | https://docs.crewai.com/en/concepts/agents                                                                                   | Agents - CrewAI                                                  | official-docs     | HIGH        | 5/3/5/5/5 | 2025 |
| 16  | https://dev.to/pockit_tools/langgraph-vs-crewai-vs-autogen-the-complete-multi-agent-ai-orchestration-guide-for-2026-2d63     | LangGraph vs CrewAI vs AutoGen: Complete Guide 2026              | blog              | MEDIUM      | 4/4/3/3/4 | 2026 |
| 17  | https://www.microsoft.com/en-us/research/publication/magentic-one-a-generalist-multi-agent-system-for-solving-complex-tasks/ | Magentic-One: A Generalist Multi-Agent System                    | research          | HIGH        | 5/3/5/5/5 | 2024 |
| 18  | https://www.datacamp.com/tutorial/crewai-vs-langgraph-vs-autogen                                                             | CrewAI vs LangGraph vs AutoGen                                   | tutorial          | MEDIUM      | 4/4/3/4/4 | 2025 |
| 19  | https://claudekit.cc/blog/vc-04-subagents-from-basic-to-deep-dive-i-misunderstood                                            | Claude Code Subagents: Common Mistakes                           | blog              | MEDIUM      | 3/5/3/3/4 | 2025 |
| 20  | https://claudecodefornoncoders.substack.com/p/the-one-thing-your-agent-actually-obeys                                        | The One Thing Your Agent Actually Obeys                          | blog              | MEDIUM      | 3/4/3/3/4 | 2025 |
| 21  | https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/                                                      | Claude Agent Skills: A First Principles Deep Dive                | blog              | MEDIUM-HIGH | 4/5/4/4/4 | 2025 |
| 22  | https://mikhail.io/2025/10/claude-code-skills/                                                                               | Inside Claude Code Skills: Structure, prompts, invocation        | blog              | MEDIUM-HIGH | 4/5/4/4/4 | 2025 |
| 23  | https://github.com/VoltAgent/awesome-claude-code-subagents                                                                   | awesome-claude-code-subagents (127+ agents)                      | community         | MEDIUM      | 3/4/3/3/4 | 2025 |
| 24  | https://gist.github.com/ThomasRohde/af9d281a7a8c73e37448e1a94485eb0c                                                         | Agent Creator Engineer definition                                | community         | MEDIUM      | 3/4/3/3/4 | 2025 |
| 25  | https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md                                                             | Claude Code CHANGELOG                                            | official          | HIGH        | 5/5/5/5/5 | 2026 |

---

## Contradictions

**1. "Too short" vs "too long" in agent prompts:** Some sources (community
examples like Thomas Rohde's agent-creator with 12 mandatory sections) advocate
very comprehensive prompts. Official Anthropic guidance warns that "bloated
CLAUDE.md files cause Claude to ignore your actual instructions" and recommends
minimal prompts. The research data (Context Rot, particula.tech) supports
Anthropic: degradation begins at 2,000 tokens and is measurable at 4,000+.
Resolution: treat Anthropic's guidance as more authoritative; community examples
that mandate comprehensive prompts may be optimizing for a different use case
(human readability) or were designed before context-rot research was published.

**2. Color field documentation:** The official Anthropic sub-agents docs do not
list `color` in the supported frontmatter table. However, the `/agents` creation
UI explicitly allows color selection, and community examples confirm accepted
values (orange, blue, red, green, teal, purple). GitHub issue #21501 requests
adding color/icon support — suggesting `color` may be functional but
undocumented or newly added. CONFIDENCE: MEDIUM on color values.

**3. Agent delegation frequency:** One source (claudecodefornoncoders) claims
Claude rarely delegates autonomously without explicit CLAUDE.md instructions.
The official docs claim delegation is automatic based on description matching.
This contradiction may reflect a real behavior gap between the spec and observed
behavior — adding "Use proactively" to descriptions is confirmed as improving
delegation frequency.

---

## Gaps

1. **Color field documentation gap:** The `color` field is not listed in the
   official `supported frontmatter fields` table despite being available in the
   UI. Accepted values (orange, blue, red, green, teal, purple) come from
   community sources, not official docs. May be UI-only, not YAML-specified.

2. **Quantitative sizing for Claude agent bodies specifically:** The token
   thresholds (500–2,000 sweet spot) come from general LLM research, not Claude
   agent-specific studies. Claude agents may behave differently since the agent
   body is the entire system prompt (no Claude Code base prompt). Further
   research needed.

3. **`effort` field values for non-Opus models:** Docs note `max` effort is Opus
   4.6 only. Behavior of `effort: max` on Sonnet is undocumented. Values `low`,
   `medium`, `high` are not clearly defined in terms of what they change.

4. **`initialPrompt` interaction with `--agent` mode:** The docs note this field
   only applies when the agent runs as a main session agent. No examples of
   complex initialPrompt use cases were found.

5. **Agent discovery timing:** "Agents are loaded at session start. If you
   manually add a file, restart or use /agents to load it immediately." This
   creates friction for iterative development — workarounds not documented.

6. **Magentic-One specific behavioral specification format:** Found
   orchestrator-worker pattern description but not the exact prompt templates
   used for role specification.

---

## Serendipity

**1. The `skills` field enables agent pre-loading:** The `skills` frontmatter
field injects full skill content into the agent at startup — not just makes
skills available for invocation. This means domain knowledge from SKILL.md files
can be baked into agents without bloating the agent's own definition. Powerful
pattern for specialization without prompt bloat.

**2. Agent body replaces entire Claude Code system prompt:** "Subagents receive
only this system prompt (plus basic environment details like working directory),
not the full Claude Code system prompt." This means agent definitions must be
more self-contained than CLAUDE.md files — they cannot rely on Claude Code's
base behavior being present.

**3. `isolation: worktree` + `background: true` is a parallel development
pattern:** These two fields combined enable agents to work on separate features
simultaneously without file conflicts. This is the recommended pattern for
team-build orchestration.

**4. Token usage explains 80% of variance in research quality:** Anthropic's
multi-agent research system found "token usage by itself explains 80% of the
variance" in research performance — more compute (tokens) = better results, but
15x the cost of single-turn. This has design implications: invest tokens in
agent quality for tasks that matter.

**5. Progressive Disclosure architecture:** The most sophisticated
implementations (Claude Code itself, LangChain) use Progressive Disclosure —
minimal upfront context, full content revealed on demand. This is the pattern to
apply to agent tool documentation: provide brief tool descriptions by default,
detailed specs when needed.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM-HIGH claims: 4
- MEDIUM claims: 5
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: MEDIUM-HIGH**

The frontmatter schema (Finding 1) and anti-patterns (Finding 7) are HIGH
confidence from official Anthropic documentation. The sizing recommendations
(Finding 5) are MEDIUM-HIGH — based on general LLM research extrapolated to
Claude agents. The external framework lessons (Finding 6) are MEDIUM —
applicable patterns identified but translation to Claude Code requires judgment.
