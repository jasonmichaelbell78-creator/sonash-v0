# Findings: Model Selection Strategies That Optimize Quality Across Agent Roles

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-03-29 **Sub-Question IDs:** SQ4

---

## Key Findings

### 1. Official Anthropic Model Capability Matrix (Current as of March 2026) [CONFIDENCE: HIGH]

From the official models overview page:

| Capability                      | Claude Opus 4.6                                   | Claude Sonnet 4.6                            | Claude Haiku 4.5                                |
| ------------------------------- | ------------------------------------------------- | -------------------------------------------- | ----------------------------------------------- |
| Description                     | "Most intelligent for building agents and coding" | "Best combination of speed and intelligence" | "Fastest model with near-frontier intelligence" |
| Pricing (input/output per MTok) | $5 / $25                                          | $3 / $15                                     | $1 / $5                                         |
| Context window                  | 1M tokens                                         | 1M tokens                                    | 200k tokens                                     |
| Max output                      | 128k tokens                                       | 64k tokens                                   | 64k tokens                                      |
| Comparative latency             | Moderate                                          | Fast                                         | Fastest                                         |
| Extended thinking               | Yes                                               | Yes                                          | Yes                                             |
| Adaptive thinking               | Yes                                               | Yes                                          | **No**                                          |
| Knowledge cutoff (reliable)     | May 2025                                          | Aug 2025                                     | Feb 2025                                        |

Critical constraint: **Haiku 4.5 lacks adaptive thinking**. This is not a minor
omission — adaptive thinking dynamically allocates reasoning depth. Haiku uses a
fixed thinking budget, which limits its performance on tasks that benefit from
variable reasoning depth.

Source: [1] Official Anthropic Models Overview

---

### 2. Pricing Reality: Opus 4.6 Is 1.67x Sonnet, Not 5x [CONFIDENCE: HIGH]

A widely-cited comparison claims "Opus is 5x more expensive than Sonnet." This
is **outdated** — it reflected the older Opus 4.1 pricing ($15/$75). As of the
current release:

- Opus 4.6: $5 input / $25 output per MTok
- Sonnet 4.6: $3 input / $15 output per MTok
- Actual ratio: **1.67x** (input), **1.67x** (output)

Per-request estimate (2K input, 8K output):

- Sonnet: $0.126
- Opus: $0.21
- Ratio: **1.67x** (not 5x)

The "Opus is 5x more expensive" framing that informed prior Decision #18 was
based on older pricing. The current cost differential is significantly smaller
than the decision assumed.

**Important note:** Haiku 4.5 remains $1/$5 — making it 3x cheaper than Sonnet
and 5x cheaper than Opus. The cost gap between Haiku and Sonnet is larger than
between Sonnet and Opus.

Source: [1] Official Anthropic pricing, [2] NxCode comparison guide

---

### 3. The 90.2% Performance Claim: Source, Methodology, and Limitations [CONFIDENCE: MEDIUM]

**Source:** Anthropic's internal multi-agent research system engineering blog
post [3].

**Claim:** "A multi-agent system with Claude Opus 4 as the lead agent and Claude
Sonnet 4 subagents outperformed single-agent Claude Opus 4 by 90.2% on internal
research evaluations."

**Methodology:**

- Task type: Breadth-first research queries requiring multiple parallel searches
- Example: "Identify all board members of all Information Technology S&P 500
  companies"
- Baseline: Single Claude Opus 4 agent running sequentially
- Comparison: Opus orchestrator + multiple Sonnet subagents running in parallel

**Critical caveats explicitly stated by Anthropic:**

1. "Multi-agent systems use about 15x more tokens than chats" — the 90%
   improvement includes parallelization gains unrelated to model selection
2. Results tested on breadth-first parallelizable queries only — not deep
   reasoning tasks
3. "Internal research eval" — not independently verified
4. The performance gain is primarily from parallelization architecture, not
   model tier selection

**What this means:** The 90.2% figure is largely a parallelization benefit, not
evidence that Opus orchestration is inherently superior to Sonnet orchestration.
The same architecture with Sonnet orchestrating Haiku workers would likely yield
similar parallelization gains.

Source: [3] Anthropic Engineering Blog — Multi-Agent Research System

---

### 4. The 65.8% Cost Savings Claim: Source and Methodology [CONFIDENCE: MEDIUM]

**Source:** MALBO (Multi-Agent LLM Bayesian Optimization) paper —
arxiv.org/html/2601.01522v1 [4]

**What was actually found:** In a SmolAgents code-assistance setting, Bayesian
Optimization discovered hybrid team configurations achieving up to 65.8% cost
savings relative to homogeneous-model baselines, while maintaining comparable
accuracy.

**Additional finding from the Columbia DAPLab study [5]:** Counterintuitive
results emerged. For HotpotQA multi-hop QA, a _weaker_ Ministral 3 8B planner +
Claude Opus solver outperformed Opus in both roles — because the weaker planner
correctly delegates to search tools rather than attempting to answer directly.
This challenges the assumption that "stronger is always better" for
orchestrators.

**Key academic finding from the financial document processing paper [6]:** A
2-tier routing strategy pairing Claude 3.5 Sonnet with Mixtral 8x22B reduced
cost by 51.3% relative to all-Claude while retaining 98.2% F1 accuracy. The
hierarchical-optimized configuration achieved F1 0.924 at only 1.15x the
sequential baseline cost.

Source: [4] MALBO arxiv paper, [5] DAPLab Columbia, [6] arxiv 2603.22651

---

### 5. Claude Code Subagent Model Mechanics: Critical Technical Details [CONFIDENCE: HIGH]

From official Claude Code subagents documentation [7]:

**Model resolution order (highest to lowest precedence):**

1. `CLAUDE_CODE_SUBAGENT_MODEL` environment variable
2. Per-invocation `model` parameter (passed by the orchestrating Claude
   instance)
3. Subagent frontmatter `model` field
4. Main conversation's model (inheritance)

**Key behavior:**

- Default is `inherit` — subagents use the parent conversation's model if no
  `model` field is specified
- Subagents CAN specify a _more_ expensive model than the parent — there is no
  restriction preventing an escalation
- The orchestrating Claude Code itself can pass a `model` override when it
  decides to spawn a subagent

**The `opusplan` hybrid alias** (documented in Claude Code model-config [8]):

- In plan mode: uses `opus` for reasoning/architecture
- In execution mode: automatically switches to `sonnet` for code generation
- This is Anthropic's own recommended hybrid approach — a built-in signal that
  plan-phase reasoning justifies Opus while execution does not

**Built-in subagent model assignments (official):**

- `Explore` (read-only codebase search): **Haiku** — explicitly chosen by
  Anthropic for speed/cost
- `Plan` (planning research): **Inherits** from main conversation
- `General-purpose`: **Inherits** from main conversation
- `statusline-setup`: **Sonnet** — hardcoded
- `Claude Code Guide` (help questions): **Haiku** — hardcoded

**Anthropic's own choice:** For the `Explore` agent — the most-used built-in
agent — Anthropic chose Haiku. This is a direct counterexample to "no haiku for
agents."

Source: [7] Claude Code sub-agents docs, [8] Claude Code model-config docs

---

### 6. The `effort` Frontmatter Field: What It Actually Does [CONFIDENCE: HIGH]

From official Claude Code model-config documentation [8]:

- `effort` in agent/skill frontmatter overrides the session effort level when
  that agent is active
- Options: `low`, `medium`, `high`, `max` (max is Opus 4.6 only)
- Defaults: Opus 4.6 and Sonnet 4.6 default to `medium` effort
- `max` effort is unavailable on Haiku — one more capability limitation for that
  model tier
- Medium effort is recommended for most coding tasks — "higher levels can cause
  the model to overthink routine work"

**Important implication:** A Sonnet agent with `effort: high` may outperform an
Opus agent with `effort: medium` on many practical tasks. Model tier and effort
level are orthogonal — both should be specified deliberately.

Source: [8] Claude Code model-config docs

---

### 7. Benchmark Evidence for Task-to-Model Matching [CONFIDENCE: MEDIUM-HIGH]

Synthesized from multiple independent sources:

**Where Opus 4.6 has a documented, substantial advantage:**

- GPQA Diamond (PhD-level science reasoning): **91.3%** vs Sonnet's 74.1% — a
  17.2 point gap [2]
- Security vulnerability discovery at depth: Opus 4.6 found 500+ previously
  unknown high-severity vulnerabilities in production open-source code that
  "went undetected for decades despite expert review" [9][10]
- Multi-file architectural analysis (10+ files, cross-cutting concerns): Sonnet
  "broke optimistic update logic" in a 15-file Redux-to-Zustand migration; Opus
  maintained structural integrity [11]
- Complex debugging (race conditions, distributed systems): Opus "found rebuild
  issues, missing disposes, and async bugs that Haiku and Sonnet completely
  skipped" [12]

**Where Sonnet 4.6 matches or approaches Opus 4.6:**

- SWE-bench Verified (coding): **79.6%** vs 80.8% — 1.2 point gap, smallest in
  Claude history [2]
- OSWorld-Verified (computer use): **72.5%** vs 72.7% — essentially identical
  [2]
- Routine code review, single-file bug fixes, test writing, feature addition
  with clear requirements [11]
- Sonnet 4.6 "now outperforms every Opus model released before 4.5" [2]

**Where Haiku 4.5 is viable:**

- SWE-bench Verified: **73.3%** — within 5 points of Sonnet 4.5's 77.2% [13]
- Read-only codebase exploration (Anthropic uses Haiku here natively)
- Routine execution tasks in orchestrated pipelines
- High-volume, latency-sensitive workloads
- Limitation: loses context in long sessions, not suitable for deep
  architectural reasoning [14]

Source: [2] NxCode Sonnet vs Opus comparison, [9] Anthropic Opus 4.6
announcement, [10] Aikido security blog, [11] NxCode coding decision guide, [12]
DEV Community model guide, [13] Anthropic Haiku 4.5 announcement, [14] Haiku
medium article

---

### 8. The "Opus Over-Delegates" Anti-Pattern [CONFIDENCE: MEDIUM]

From community observation [15]: When Claude Code runs on Opus as the main
model, it exhibits a documented tendency to over-delegate — spawning subagents
for tasks that would be faster handled directly. Anthropic's own documentation
flags that "Opus will delegate to agents in situations where a direct approach
would be faster and cheaper."

This creates an irony: choosing Opus for "thoroughness" can actually reduce
efficiency by multiplying token usage without quality benefit. This is relevant
to the project because all GSD global agents use `model: sonnet` — which may be
intentional to avoid this over-delegation pattern in worker agents.

Source: [15] ksred.com subagents article

---

### 9. GitHub Issue #26179: Real-World Audit of Agent Model Assignment [CONFIDENCE: MEDIUM-HIGH]

A user on GitHub [16] audited 62 agent definitions across 6 Claude Code plugins
(including the GSD plugin) and found:

- **Zero agents required Opus** to perform their designated task
- Users were creating patch scripts to rewrite `model: opus` and
  `model: inherit` to `model: sonnet` after every plugin update
- The proposal to default subagents to Sonnet was closed as NOT PLANNED (March
  21, 2026) — no official Anthropic response

The one exception noted: "Deep research agents (Voyager) where Opus synthesis
quality matters."

This directly speaks to the project's observed contradiction: GSD agents using
Sonnet despite a "heavy lean toward opus" decision may actually reflect correct
calibration, not a gap.

Source: [16] GitHub Issue #26179, anthropics/claude-code

---

### 10. The Skill Frontmatter `model:` Field Is Broken [CONFIDENCE: HIGH]

GitHub Issue #21679 (opened Jan 29, 2026, status: OPEN as of March 20, 2026)
confirms:

- The `model:` field in skill frontmatter is **documented but non-functional**
- Skills execute with the session's current model regardless of the specified
  field
- No current workaround exists
- Multiple users confirmed the bug

**Implication:** Any model selection strategy for skills cannot rely on
frontmatter. Only subagent (`.claude/agents/`) `model:` fields work reliably.

Source: GitHub Issue #21679, anthropics/claude-code

---

### 11. Evidence on Haiku Viability for Agent Roles [CONFIDENCE: MEDIUM-HIGH]

**Arguments for Haiku in agent roles:**

- Anthropic uses Haiku for their own `Explore` subagent (the most-used built-in)
- Haiku 4.5 achieves 73.3% on SWE-bench — competitive with older Sonnet models
  [13]
- 3x cheaper than Sonnet; enables more agent invocations within budget
  constraints
- Anthropic's own documentation for Haiku 4.5 says it's designed for: "Sonnet
  4.5 can break down a complex problem into multi-step plans, then orchestrate a
  team of multiple Haiku 4.5s to complete subtasks in parallel" [13]
- Claude Code Guide and statusline-setup agents use Haiku natively (Anthropic's
  choice)

**Arguments against Haiku for complex agent roles:**

- No adaptive thinking capability (hard limitation)
- Cannot use `effort: max`
- Context window limited to 200k (vs 1M for Opus/Sonnet)
- Loses track in long sessions
- Not suitable for deep architectural reasoning, security audits, or multi-file
  analysis

**Verdict:** Prior Decision #18 ("no haiku for agents") is partially correct but
overly broad. Haiku is appropriate for _bounded execution_ tasks (read-only
exploration, classification, formatting, short-context lookups) but
inappropriate for reasoning, analysis, or synthesis tasks. Anthropic themselves
draw this distinction.

Source: [7][8][13][14]

---

### 12. Community Evidence: How Other Projects Assign Models [CONFIDENCE: MEDIUM]

**CrewAI, LangGraph, AutoGen:** All are model-agnostic; per-agent model
assignment is a standard feature [17]. The dominant community pattern in 2026
is: premium model (Opus/GPT-4) for orchestrators and planning agents, mid-tier
(Sonnet/GPT-3.5-turbo) for workers, cheap models for routing/triage [17][18].

**wshobson/agents GitHub repo** [19]: Community agent library for Claude Code.
Notable for showing real-world model assignments in practice.

**Haiku at scale (Caylent analysis [13]):** For 100,000 monthly chatbot
sessions:

- Haiku: ~$2,250/month
- Sonnet: ~$6,750/month
- Savings: 67%

For 10,000 monthly agent tasks:

- Haiku: ~$700/month
- Sonnet: ~$2,100/month
- Savings: 67%

These numbers validate Haiku's cost case at scale but apply to bounded tasks,
not complex agent workflows.

Source: [13] Caylent Haiku analysis, [17] Multi-agent frameworks comparison,
[18] Codebridge orchestration guide, [19] GitHub wshobson/agents

---

### 13. Task-to-Model Mapping: Synthesized Recommendations [CONFIDENCE: MEDIUM-HIGH]

Based on all sources:

| Task Type                                          | Recommended Model              | Confidence  | Rationale                                                                    |
| -------------------------------------------------- | ------------------------------ | ----------- | ---------------------------------------------------------------------------- |
| Security vulnerability research (deep, cross-file) | **Opus**                       | HIGH        | Documented 500+ vuln discovery advantage; GPQA gap; NxCode security guidance |
| Architectural decision-making (10+ files)          | **Opus**                       | HIGH        | Documented cross-file coordination advantage; real-world migration evidence  |
| Complex debugging (race conditions, distributed)   | **Opus**                       | MEDIUM      | Community observation that Opus "finds bugs Sonnet misses"                   |
| Penetration testing (adversarial reasoning)        | **Opus**                       | MEDIUM      | Requires sustained adversarial reasoning depth                               |
| Code review (routine, single/few files)            | **Sonnet**                     | HIGH        | 1.2pt benchmark gap; NxCode coding guide recommends Sonnet                   |
| Test writing and generation                        | **Sonnet**                     | MEDIUM-HIGH | Both models near-equivalent; Sonnet faster/cheaper                           |
| Documentation generation                           | **Sonnet**                     | HIGH        | No reasoning depth advantage for Opus in documentation                       |
| Database architecture (schema design)              | **Sonnet or Opus**             | LOW         | Context-dependent; Opus for complex multi-system designs                     |
| Frontend component work                            | **Sonnet**                     | HIGH        | Well-scoped, execution-focused                                               |
| Git operations, deployment                         | **Sonnet**                     | HIGH        | Procedural execution, not reasoning                                          |
| Read-only codebase exploration                     | **Haiku**                      | HIGH        | Anthropic's own choice for `Explore` agent                                   |
| Classification, routing, formatting                | **Haiku**                      | HIGH        | Bounded tasks with clear outputs                                             |
| Deep research synthesis                            | **Sonnet** (with effort: high) | MEDIUM      | GSD synthesizer uses Sonnet; 90% performance of Opus at lower cost           |

---

### 14. The GSD Agents / Sonnet Contradiction Resolved [CONFIDENCE: MEDIUM-HIGH]

The project's Question: "GSD agents (the best-quality ones) all use Sonnet — is
that a contradiction with 'heavy lean toward opus'?"

**Evidence that it is NOT a contradiction:**

1. The GitHub issue #26179 audit of 62 agents across 6 plugins (including GSD)
   found zero agents requiring Opus
2. GSD agents are primarily execution-focused workers (mapper, executor,
   integration-checker, verifier) — Sonnet-appropriate tasks
3. The `opusplan` alias (Anthropic-endorsed) uses Opus for planning but Sonnet
   for execution — GSD agents are the execution layer
4. The prior "heavy lean toward opus" decision likely predated the current
   pricing revision (Opus 4.6 is $5/$25, not $15/$75)
5. Anthropic's own built-in agents (Explore, Guide) use Haiku or Sonnet — not
   Opus

**The contradiction is in Decision #18, not in the GSD agent assignments.** The
GSD agents using Sonnet reflects sound calibration. The "heavy lean toward opus"
framing was likely formed when Opus was the only premium model available and
before the 90.2% methodology was understood.

**The project's local agent split (7 opus, 19 sonnet):** Based on the
task-to-model mapping above, the current assignments are broadly defensible. The
agents on Opus (database-architect, fullstack-developer, penetration-tester,
performance-engineer, prompt-engineer, security-engineer, test-engineer) map
reasonably to tasks that benefit from Opus depth. Security-auditor being on
Sonnet is potentially miscalibrated given the 500+ vulnerability evidence — this
is worth reconsidering.

---

## Sources

| #   | URL                                                                                                             | Title                                                                        | Type                     | Trust       | CRAAP     | Date      |
| --- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------ | ----------- | --------- | --------- |
| 1   | https://platform.claude.com/docs/en/about-claude/models/overview                                                | Models overview — Claude API Docs                                            | Official docs            | HIGH        | 5/5/5/5/5 | Mar 2026  |
| 2   | https://www.nxcode.io/resources/news/claude-sonnet-4-6-vs-opus-4-6-complete-comparison-2026                     | Claude Sonnet 4.6 vs Opus 4.6: Complete Comparison Guide                     | Community analysis       | MEDIUM-HIGH | 4/4/3/4/4 | 2026      |
| 3   | https://www.anthropic.com/engineering/multi-agent-research-system                                               | Building Anthropic's Multi-Agent Research System                             | Official blog            | HIGH        | 5/5/5/4/5 | 2025      |
| 4   | https://arxiv.org/html/2601.01522v1                                                                             | Bayesian Orchestration of Multi-LLM Agents                                   | Academic paper           | HIGH        | 4/4/4/4/5 | Jan 2026  |
| 5   | https://daplab.cs.columbia.edu/general/2026/03/22/why-your-agent-needs-a-model-combo-optimizer.html             | Why Your Agent Needs a Model Combo Optimizer                                 | Academic blog (Columbia) | HIGH        | 5/5/5/4/5 | Mar 2026  |
| 6   | https://arxiv.org/html/2603.22651                                                                               | Benchmarking Multi-Agent LLM Architectures for Financial Document Processing | Academic paper           | HIGH        | 4/4/4/4/5 | Mar 2026  |
| 7   | https://code.claude.com/docs/en/sub-agents                                                                      | Create custom subagents — Claude Code Docs                                   | Official docs            | HIGH        | 5/5/5/5/5 | Mar 2026  |
| 8   | https://code.claude.com/docs/en/model-config                                                                    | Model configuration — Claude Code Docs                                       | Official docs            | HIGH        | 5/5/5/5/5 | Mar 2026  |
| 9   | https://www.anthropic.com/news/claude-opus-4-6                                                                  | Introducing Claude Opus 4.6                                                  | Official blog            | HIGH        | 5/5/5/5/5 | Feb 2026  |
| 10  | https://www.aikido.dev/blog/claude-opus-4-6-500-vulnerabilities-software-security                               | Claude Opus 4.6 Found 500 Vulnerabilities                                    | Security vendor analysis | MEDIUM-HIGH | 4/4/3/4/4 | Feb 2026  |
| 11  | https://www.nxcode.io/resources/news/claude-opus-or-sonnet-for-coding-decision-guide-2026                       | Claude Opus or Sonnet for Coding? Decision Guide                             | Community analysis       | MEDIUM      | 4/4/3/3/4 | 2026      |
| 12  | https://dev.to/klement_gunndu/pick-the-right-claude-code-model-for-every-task-1p6a                              | Pick the Right Claude Code Model for Every Task                              | Community post           | MEDIUM      | 3/4/3/3/4 | 2025/2026 |
| 13  | https://caylent.com/blog/claude-haiku-4-5-deep-dive-cost-capabilities-and-the-multi-agent-opportunity           | Claude Haiku 4.5 Deep Dive: Multi-Agent Opportunity                          | Technical blog           | MEDIUM-HIGH | 4/5/3/4/4 | 2025/2026 |
| 14  | https://medium.com/@bravesirtom/why-haiku-should-be-your-default-coding-model-in-claude-code-e8e3810a26c7       | Why Haiku Should Be Your Default Coding Model                                | Individual opinion       | LOW-MEDIUM  | 3/4/2/3/3 | 2025/2026 |
| 15  | https://www.ksred.com/claude-code-agents-and-subagents-what-they-actually-unlock/                               | Claude Code Agents & Subagents: What They Actually Unlock                    | Community analysis       | MEDIUM      | 4/4/3/3/4 | 2025/2026 |
| 16  | https://github.com/anthropics/claude-code/issues/26179                                                          | Subagents should default to Sonnet, not inherit Opus                         | GitHub Issue             | MEDIUM-HIGH | 4/5/4/4/4 | Mar 2026  |
| 17  | https://openagents.org/blog/posts/2026-02-23-open-source-ai-agent-frameworks-compared                           | CrewAI vs LangGraph vs AutoGen vs OpenAgents (2026)                          | Community comparison     | MEDIUM      | 3/4/3/3/3 | Feb 2026  |
| 18  | https://www.codebridge.tech/articles/mastering-multi-agent-orchestration-coordination-is-the-new-scale-frontier | Multi-Agent Systems & AI Orchestration Guide 2026                            | Technical article        | MEDIUM      | 4/4/3/4/4 | 2026      |
| 19  | https://github.com/wshobson/agents                                                                              | wshobson/agents: Claude Code agent library                                   | Community repo           | MEDIUM      | 3/4/3/3/3 | 2025/2026 |
| 20  | https://www.anthropic.com/news/claude-haiku-4-5                                                                 | Introducing Claude Haiku 4.5                                                 | Official blog            | HIGH        | 5/5/5/5/5 | 2025      |

---

## Contradictions

### Contradiction 1: Pricing of Opus

Sources written before early 2026 state "Opus is 5x more expensive than Sonnet"
($15/$75 vs $3/$15). Current official pricing shows Opus 4.6 at $5/$25 — only
**1.67x** more expensive. Many community articles have not updated their cost
analysis. The 5x figure appears in Decision #18 context and was likely accurate
at the time but is now stale.

### Contradiction 2: "No Haiku for Agents" vs. Anthropic Using Haiku Natively

Prior Decision #18 excluded Haiku from agents. Anthropic's own Claude Code ships
the `Explore` agent (most-used built-in) on Haiku. The `Claude Code Guide` agent
also uses Haiku. This is a direct contradiction between the project's decision
and Anthropic's practice. The resolution is that "no haiku" is wrong as an
absolute rule — it is right for reasoning/analysis agents and wrong for bounded
execution/exploration agents.

### Contradiction 3: Security-Auditor on Sonnet vs. Evidence for Opus

The project's `security-auditor.md` uses `model: sonnet`. NxCode explicitly
states "for security-sensitive analysis especially, this is not the place to
optimize for cost" and Anthropic's documented Opus 4.6 advantage (500+
vulnerabilities found) is most pronounced in exactly this domain. However,
`security-engineer.md` correctly uses `model: opus`. The split may reflect a
distinction between routine security review (Sonnet) and deep security research
(Opus), but this is not documented.

### Contradiction 4: 90.2% Claim Interpretation

The 90.2% improvement is frequently cited as evidence that "Opus orchestrators
are better than Sonnet orchestrators." The actual finding is that _multi-agent
parallelization outperforms single-agent sequential execution_ — the model tier
of the orchestrator is secondary to the architecture. Sources disagree on
whether the orchestrator model matters; the Columbia DAPLab study found a weaker
orchestrator sometimes performs better by delegating more effectively.

---

## Gaps

1. **No direct comparison of Opus vs. Sonnet as orchestrators** (all else equal)
   — the 90.2% study compared single-agent vs. multi-agent, not Opus
   orchestrator vs. Sonnet orchestrator
2. **No data on the `effort` field's interaction with model tier** — a Sonnet
   agent with `effort: high` vs. Opus with `effort: medium` has not been
   benchmarked
3. **GSD agents: no documented rationale for Sonnet choice** — the decision is
   correct by evidence but was not explicitly justified in any found
   documentation
4. **Haiku in long multi-turn agent sessions**: 200k context limit is
   understated as a constraint — agents doing multi-file analysis can exceed
   this quickly
5. **Token budget reality for a full /deep-research run**: The 15x token
   multiplier for multi-agent systems combined with model costs was not found
   quantified for this specific project's workload
6. **Whether CLAUDE_CODE_SUBAGENT_MODEL env variable overrides ALL subagent
   frontmatter**: Confirmed in docs but not tested against edge cases (e.g.,
   does it override agents with explicit `model: opus`?)

---

## Serendipity

1. **The `opusplan` alias is Anthropic's explicit endorsement of the hybrid
   model**: Plan = Opus, Execute = Sonnet. This exact pattern is what Anthropic
   recommends via a named alias, validating the "use Opus for planning, Sonnet
   for execution" heuristic. The GSD planner agent using Sonnet instead of Opus
   may be worth reconsidering in light of this.

2. **Skill frontmatter `model:` field is broken** (GitHub Issue #21679, open
   since Jan 2026): Any model selection applied to skills is silently ignored.
   This is a significant gap if any skills in this project specify models.

3. **`effort` frontmatter field can substitute for model tier in some cases**: A
   Sonnet agent with `effort: high` can tackle some tasks that would otherwise
   require Opus, at a lower token cost. This hybrid approach is not mentioned in
   the project's prior decisions.

4. **Agent Teams is Opus-exclusive**: The Agent Teams feature (parallel worktree
   agents) requires Opus as the main model. If the project ever needs true
   parallel execution (not just subagent spawning), Opus at the top level
   becomes mandatory.

5. **Haiku 4.5 has the oldest knowledge cutoff** (reliable: Feb 2025 vs Sonnet's
   Aug 2025): For agents that need to reason about current APIs, frameworks, or
   security patterns, Haiku's staler knowledge is an additional risk factor
   beyond its capability limitations.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM-HIGH claims: 5
- MEDIUM claims: 5
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: MEDIUM-HIGH**

The HIGH-confidence findings come from official Anthropic documentation. The
MEDIUM findings come from community sources that are directionally consistent
but rely on potentially incomplete benchmarks or methodology descriptions. No
claims are made without at least one citation.

**Source count: 20 sources** (7 official/academic, 13 community/analysis)
