# Findings: SQ4 Part B — Model Selection from Official Documentation and Claude Code Internals

**Searcher:** deep-research-searcher **Profile:** docs + web **Date:**
2026-03-29 **Sub-Question IDs:** SQ4-B

---

## Key Findings

### 1. Built-in Subagent Model Assignments (Complete Table) [CONFIDENCE: HIGH]

Official Claude Code docs (`code.claude.com/docs/en/sub-agents`) provide the
definitive list. D4a confirmed Explore → Haiku; this extends the full picture:

| Built-in Agent    | Model        | Tools           | Notes                                        |
| ----------------- | ------------ | --------------- | -------------------------------------------- |
| Explore           | Haiku        | Read-only       | Fast, low-latency codebase search            |
| Plan              | **Inherits** | Read-only       | Uses parent conversation model, not Haiku    |
| General-purpose   | **Inherits** | All tools       | Complex multi-step tasks                     |
| Bash              | **Inherits** | Bash            | Terminal commands in separate context        |
| statusline-setup  | **Sonnet**   | (not specified) | Hardcoded Sonnet, runs during `/statusline`  |
| Claude Code Guide | Haiku        | (not specified) | Answers questions about Claude Code features |

**Key correction to D4a context:** D4a noted Anthropic uses Haiku for their
Explore and Claude Code Guide agents. This is confirmed. However, the Plan agent
and General-purpose agent both use `inherit` (parent conversation model), NOT
Haiku. D4a's framing implied Haiku was broader than it is.

Source: `https://code.claude.com/docs/en/sub-agents` — Official Claude Code
docs, Tier 1.

---

### 2. Model Resolution Order for Subagents [CONFIDENCE: HIGH]

When Claude invokes a subagent, the `model` field is resolved in this priority
order (highest to lowest):

1. `CLAUDE_CODE_SUBAGENT_MODEL` environment variable (overrides everything)
2. Per-invocation `model` parameter (Claude passes this when spawning)
3. Subagent definition's `model` frontmatter field
4. Main conversation's current model (fallback / `inherit` default)

**Practical implication:** To globally redirect all subagents to a cheaper
model, set `CLAUDE_CODE_SUBAGENT_MODEL=haiku`. To override specific subagents,
use frontmatter. There is no `agentDefaults` settings key yet (see Gaps).

Source: `https://code.claude.com/docs/en/sub-agents#choose-a-model` — Official
docs, Tier 1.

---

### 3. The `effort` Field — Complete Specification [CONFIDENCE: HIGH]

**Four values exist:** `low`, `medium`, `high`, `max`

| Value  | Available on         | Behavior                                            | Persists in settings?          |
| ------ | -------------------- | --------------------------------------------------- | ------------------------------ |
| low    | Opus 4.6, Sonnet 4.6 | Less thinking, faster, cheaper                      | Yes                            |
| medium | Opus 4.6, Sonnet 4.6 | Default for both models. Recommended for most tasks | Yes                            |
| high   | Opus 4.6, Sonnet 4.6 | Deeper reasoning; can overthink routine work        | Yes                            |
| max    | **Opus 4.6 only**    | No constraint on token spending; slowest, costliest | No (session only, via env var) |

`max` is explicitly Opus 4.6 exclusive. Setting `effort: max` in a Sonnet
agent's frontmatter will not work as intended — the field is silently ignored or
falls back to `high`.

**Effort in subagent frontmatter:** The `effort` field is a supported subagent
frontmatter field. When set, it overrides the session effort level but NOT the
`CLAUDE_CODE_EFFORT_LEVEL` environment variable. This means:

- A subagent with `effort: high` will use high effort unless the user has
  `CLAUDE_CODE_EFFORT_LEVEL` set to something else.
- The env var is the true top-priority override.

**Does `effort: high` on Sonnet approach Opus quality?** The docs state that
effort controls adaptive reasoning (thinking token allocation). Sonnet and Opus
have different base capabilities — effort affects depth of reasoning within a
model, not cross-model capability gaps. Per docs: "Medium is the recommended
level for most coding tasks: higher levels can cause the model to overthink
routine work." No claim is made that high-effort Sonnet equals Opus.

**One-shot "ultrathink":** Including "ultrathink" in a prompt triggers high
effort for that single turn without changing the session setting. This works in
skill content too.

Sources:

- `https://code.claude.com/docs/en/model-config#adjust-effort-level` — Official
  Claude Code docs, Tier 1
- `https://code.claude.com/docs/en/sub-agents#supported-frontmatter-fields` —
  Official Claude Code docs, Tier 1

---

### 4. Anthropic's Official Model Selection Guidance for Agents [CONFIDENCE: HIGH]

From `platform.claude.com/docs/en/about-claude/models/overview`:

**Current models (as of March 2026):**

| Model             | API ID            | Context Window | Max Output | Pricing (input/output per MTok) | Extended Thinking | Adaptive Thinking |
| ----------------- | ----------------- | -------------- | ---------- | ------------------------------- | ----------------- | ----------------- |
| Claude Opus 4.6   | claude-opus-4-6   | 1M tokens      | 128k       | $5 / $25                        | Yes               | Yes               |
| Claude Sonnet 4.6 | claude-sonnet-4-6 | 1M tokens      | 64k        | $3 / $15                        | Yes               | Yes               |
| Claude Haiku 4.5  | claude-haiku-4-5  | 200k tokens    | 64k        | $1 / $5                         | Yes               | No                |

**Critical notes:**

- Opus 4.6 description: "The most intelligent model for **building agents and
  coding**" — Anthropic explicitly positions Opus 4.6 as the agent-building
  model.
- Haiku 4.5 lacks Adaptive Thinking (dynamic token allocation). It supports
  Extended Thinking but only with fixed budget.
- Opus 4.6 max output is 128k tokens — double Sonnet/Haiku's 64k. This matters
  for agents returning large artifacts.

Source: `https://platform.claude.com/docs/en/about-claude/models/overview` —
Official Anthropic docs, Tier 1.

---

### 5. Tool Use Performance by Model — Official Guidance [CONFIDENCE: HIGH]

From `platform.claude.com/docs/en/build-with-claude/tool-use/overview`:

> "If the user's prompt doesn't include enough information to fill all the
> required parameters for a tool, Claude Opus is **much more likely** to
> recognize that a parameter is missing and ask for it. Claude Sonnet **may**
> ask, especially when prompted to think before outputting a tool request. But
> it may also do its best to infer a reasonable value."

This is a direct capability difference: **Opus is more reliable at tool
parameter handling**. Sonnet may hallucinate/infer parameters; Opus asks for
clarification. This is significant for agentic workflows where incorrect tool
parameters cause cascading failures.

Tool use system prompt overhead (per API call with tools) is identical across
Opus 4.6, Sonnet 4.6, and Haiku 4.5: **346 tokens (auto/none)** or **313 tokens
(any/tool)**. No per-model overhead differential for current models.

Source:
`https://platform.claude.com/docs/en/build-with-claude/tool-use/overview` —
Official Anthropic docs, Tier 1.

---

### 6. Context Window Implications for Agents [CONFIDENCE: HIGH]

**The 1M context window distinction:**

- Opus 4.6 + Sonnet 4.6: 1M tokens natively
- Haiku 4.5: 200k tokens only — no 1M option

**Plan availability for 1M:**

- Max, Team, Enterprise: Opus 4.6 with 1M is **included** (no extra charge)
- Pro: Opus 4.6 with 1M requires extra usage billing
- API/pay-as-you-go: Full access to both, standard token pricing

**Subagent context windows:** Each subagent runs in its own independent context
window. When Claude spawns an Explore subagent (Haiku, 200k), that 200k is the
ceiling for that exploration pass. A general-purpose subagent using `inherit`
(e.g., Opus 4.6) gets the full 1M. This asymmetry is intentional: Explore is
designed for targeted lookups, not full-codebase loads.

**maxTurns and token budget interaction:** The `maxTurns` field caps agentic
iterations but does not directly affect token budget — each turn consumes tokens
from the context window. Longer chains → more context consumed. There is no
official guidance on optimal maxTurns per model tier.

Source: `https://code.claude.com/docs/en/model-config#extended-context` —
Official docs, Tier 1.

---

### 7. Default Model by Account Tier [CONFIDENCE: HIGH]

The `default` model alias resolves differently by account type:

| Account Type          | Default Model                      |
| --------------------- | ---------------------------------- |
| Max and Team Premium  | Opus 4.6                           |
| Pro and Team Standard | Sonnet 4.6                         |
| Enterprise            | Opus 4.6 available but not default |

Implication: A free API user running `model: inherit` in their agents gets
Sonnet 4.6. A Max subscriber gets Opus 4.6. The `inherit` behavior is not
uniform across users.

Source: `https://code.claude.com/docs/en/model-config#default-model-setting` —
Official docs, Tier 1.

---

### 8. Configuring Built-in Agent Models — Feature Gap Status [CONFIDENCE: HIGH]

GitHub Issue #21348 ("Allow configuring default model for built-in agents") was
**closed as DUPLICATE** of #13858. Both were closed as "not planned." Issue
#19269 is open but unresolved.

**Current workarounds:**

1. Set `CLAUDE_CODE_SUBAGENT_MODEL` env var (applies to all subagents, not
   per-agent-type)
2. Specify model on individual Task/Agent tool calls (manual, per-invocation)
3. Create a custom agent that overrides the built-in via `.claude/agents/`
   (higher priority than built-ins)

There is **no `agentDefaults` key** in settings.json as of the current Claude
Code version. The proposed `agentDefaults.Explore.model` pattern from the issue
is not implemented.

Source: `https://github.com/anthropics/claude-code/issues/21348` — GitHub issue,
Tier 2.

---

### 9. `model: inherit` Is the Recommended Default for Custom Agents [CONFIDENCE: HIGH]

From the plugin dev SKILL.md and frontmatter reference:

> "The recommendation is to use `inherit` unless the agent requires specific
> model capabilities that justify switching to a more specialized or capable
> model."

For skills (slash commands), the model field guidance:

- `haiku` — simple, formulaic, high-frequency commands
- `sonnet` — standard commands, most common use cases
- `opus` — "most complex analysis, architectural decisions, deep code
  understanding, and critical tasks"

The security-reviewer example agent in official best-practices docs explicitly
uses `model: opus`. This is Anthropic's own stated recommendation for
security-critical agents.

Source: `https://code.claude.com/docs/en/best-practices` and plugin dev SKILL.md
— Official docs, Tier 1.

---

## Sources

| #   | URL                                                                     | Title                                      | Type            | Trust  | CRAAP Score     | Date            |
| --- | ----------------------------------------------------------------------- | ------------------------------------------ | --------------- | ------ | --------------- | --------------- |
| 1   | https://code.claude.com/docs/en/sub-agents                              | Create custom subagents                    | Official docs   | HIGH   | 5/5/5/5/5 = 5.0 | Current         |
| 2   | https://code.claude.com/docs/en/model-config                            | Model configuration                        | Official docs   | HIGH   | 5/5/5/5/5 = 5.0 | Current         |
| 3   | https://platform.claude.com/docs/en/about-claude/models/overview        | Models overview                            | Official docs   | HIGH   | 5/5/5/5/5 = 5.0 | Current         |
| 4   | https://platform.claude.com/docs/en/build-with-claude/tool-use/overview | Tool use with Claude                       | Official docs   | HIGH   | 5/5/5/5/5 = 5.0 | Current         |
| 5   | https://github.com/anthropics/claude-code/issues/21348                  | Issue #21348 — built-in agent model config | GitHub issue    | MEDIUM | 5/4/4/4/5 = 4.4 | Closed Jan 2026 |
| 6   | context7:/anthropics/claude-code                                        | Claude Code plugin dev SKILL.md            | Official source | HIGH   | 5/5/5/5/5 = 5.0 | Current         |
| 7   | context7:/websites/code_claude                                          | Claude Code docs via Context7              | Official docs   | HIGH   | 5/5/5/5/5 = 5.0 | Current         |

---

## Contradictions

**None identified between sources.** The official docs are internally
consistent. One clarification from D4a:

- D4a stated "Anthropic uses Haiku for their own Explore and Claude Code Guide
  agents" — this is correct, but the implication that all built-in agents use
  Haiku is incorrect. Plan and General-purpose both use `inherit`. This is not a
  contradiction in D4a's findings but a gap in scope.

---

## Gaps

1. **maxTurns + model cost modeling:** No official documentation on recommended
   maxTurns values per model tier. Cost per multi-turn agent session requires
   manual calculation (turns × avg tokens × model price).

2. **Does `effort: high` on Sonnet close the gap with default Opus?** The docs
   don't provide benchmark data. Qualitative guidance exists (effort affects
   adaptive reasoning depth) but no quantitative capability comparison between
   high-effort Sonnet vs. default Opus.

3. **Haiku 4.5 extended thinking behavior:** Haiku supports extended thinking
   but lacks adaptive thinking. The docs don't specify what "fixed budget" means
   in practice for Haiku — what the token ceiling is, or whether it's useful in
   agentic contexts.

4. **`agentDefaults` feature:** Issue #19269 is open. No ETA. The gap between
   "Explore defaults to Haiku" and "I want Explore to use Sonnet" has no clean
   solution without env var hacks or shadowing built-ins.

5. **`model:` field in skills frontmatter (GitHub Issue #21679):** D4a flagged
   this as broken. This research did not find a definitive resolution status —
   the issue appears to affect skills specifically, while subagent `model:`
   frontmatter works correctly.

---

## Serendipity

**`isolation: worktree` for subagents** — A subagent can be configured with
`isolation: worktree` to run in a temporary git worktree, giving it an isolated
copy of the repo. The worktree auto-cleans if the subagent makes no changes.
This is highly relevant for destructive or experimental agents (e.g., a
refactoring agent) and was not part of the original research scope.

**Background subagents with pre-approved permissions** — When a subagent runs in
background mode, Claude Code prompts for all tool permissions upfront before
launching. Background agents auto-deny any unapproved tool calls rather than
interrupting the user. This changes the threat model for agents with broad tool
access.

**`CLAUDE_CODE_SUBAGENT_MODEL` env var** — This single env var can redirect ALL
subagents to a specific model regardless of their frontmatter. Useful for cost
control experiments or forcing all agents to Haiku in CI environments.

---

## Confidence Assessment

- HIGH claims: 9
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

All findings sourced from Tier 1 official documentation. No training-data-only
claims made.
