# Custom Agent Design Analysis for Deep Research

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-20
**Status:** RESEARCH
<!-- prettier-ignore-end -->

## Executive Summary

**Recommendation: Hybrid approach — skill-as-orchestrator with 3 custom agents
(minimum viable set), using prompt-driven roles for everything else.**

The codebase has a mature, well-tested pattern for custom agent definitions in
`.claude/agents/global/`. The GSD ecosystem demonstrates that custom agents pay
for themselves when they (a) participate in a pipeline with clear upstream/
downstream contracts, (b) are invoked repeatedly across sessions, and (c) encode
domain-specific tool strategies or verification protocols that would be
unreliable if left to ad-hoc prompting. However, the GSD ecosystem also shows
that agent proliferation has costs: 11 GSD agents consume ~8,800 lines of
definition, and the agent inventory audit already flagged redundancy issues in
non-GSD agents.

For deep-research, the recommendation is:

1. **3 custom agents** — decomposer, searcher-analyzer (combined), synthesizer
2. **Skill-as-orchestrator** — the `/deep-research` SKILL.md handles
   coordination, not a separate orchestrator agent
3. **Prompt-driven roles** for verification and critique — these are lightweight
   convergence-loop passes, not distinct agents

This minimizes maintenance burden while capturing the value of persistent,
auditable, versioned research behavior in the roles that matter most.

---

## Current Agent Pattern Analysis

### Agent Definition Format

Every agent in `.claude/agents/global/` follows a consistent structure:

**Frontmatter (YAML):**

```yaml
---
name: gsd-[role-name]
description: >-
  [1-3 sentence description of purpose and spawning context]
tools: [comma-separated tool list]
color: [cyan|green|purple|yellow|orange|blue]
---
```

**Body sections (XML tags):**

| Section                   | Purpose                                     | Prevalence                     |
| ------------------------- | ------------------------------------------- | ------------------------------ |
| `<role>`                  | Identity, spawner, core responsibilities    | All agents                     |
| `<philosophy>`            | Mindset, anti-patterns, guiding principles  | Most heavy agents              |
| `<upstream_input>`        | What the agent receives and how to parse it | Pipeline agents                |
| `<downstream_consumer>`   | Who reads the output and how they use it    | Pipeline agents                |
| `<tool_strategy>`         | When/how to use each tool, with examples    | Research agents                |
| `<source_hierarchy>`      | Confidence levels and source prioritization | Research agents                |
| `<verification_protocol>` | How to validate findings                    | Research + verification agents |
| `<output_format>`         | Exact template for output files             | All agents                     |
| `<execution_flow>`        | Step-by-step numbered process               | All agents                     |
| `<structured_returns>`    | Return format for orchestrator consumption  | All agents                     |
| `<success_criteria>`      | Checklist of completion conditions          | All agents                     |
| `<critical_rules>`        | Non-negotiable constraints                  | Verification agents            |

**Key conventions observed:**

1. **Pipeline awareness:** Every agent documents its upstream source and
   downstream consumer. The `gsd-phase-researcher` knows its RESEARCH.md feeds
   `gsd-planner`, which means it writes prescriptive findings ("Use X") not
   exploratory ones ("Consider X or Y").

2. **Tool declarations are explicit and minimal.** Agents only get the tools
   they need. The `gsd-research-synthesizer` gets `Read, Write, Bash` — no web
   tools because it synthesizes existing research, not conducts new research.
   The `gsd-verifier` gets `Read, Bash, Grep, Glob` — no Write because it
   reports findings without modifying code.

3. **Structured returns.** Every agent returns a specific markdown format to its
   orchestrator: `## RESEARCH COMPLETE`, `## VERIFICATION COMPLETE`,
   `## SYNTHESIS COMPLETE`, etc. This enables the orchestrator to parse status
   without reading the full output.

4. **No inter-agent communication.** Per `AGENT_ORCHESTRATION.md`: "Agents work
   independently (no inter-agent communication)." Coordination happens through
   shared file artifacts and the orchestrator.

### Agent Size Distribution

| Size Category | Line Count | Count | Examples                                                                                            |
| ------------- | ---------- | ----- | --------------------------------------------------------------------------------------------------- |
| Light         | 249-427    | 2     | research-synthesizer (249), integration-checker (427)                                               |
| Medium        | 648-821    | 5     | roadmapper (648), phase-researcher (667), executor (730), plan-checker (811), codebase-mapper (821) |
| Heavy         | 908-1476   | 4     | project-researcher (908), debugger (1300), planner (1476)                                           |

The GSD agents average ~804 lines each. The research-oriented agents
(`gsd-project-researcher` at 908 lines, `gsd-phase-researcher` at 667 lines) are
in the medium-heavy range, driven primarily by their tool strategy and
verification protocol sections.

---

## Custom vs. Prompt-Driven Tradeoffs

### When Custom Agents Add Value

Based on analysis of which GSD agents are most effective:

**1. Complex tool strategies that must be followed precisely.**

The `gsd-project-researcher` encodes a specific tool hierarchy: Context7 first,
then official docs via WebFetch, then WebSearch, with a mandatory verification
protocol that upgrades/downgrades confidence levels. This is ~120 lines of
instructions that, if left to an inline prompt, would be inconsistently applied.

**Applies to deep-research:** YES. Web research requires a disciplined approach
to source verification, search query formulation, and confidence assessment.
This is the strongest argument for custom agents.

**2. Pipeline contracts where output format matters.**

The `gsd-phase-researcher` produces a RESEARCH.md with specific sections
(`## Standard Stack`, `## Don't Hand-Roll`, `## Common Pitfalls`) that the
downstream `gsd-planner` relies on by name. If the researcher changes section
names or structure, the planner breaks.

**Applies to deep-research:** PARTIALLY. The synthesizer needs a defined input
contract, but the internal research stages can be more flexible since they feed
into a synthesizer the skill controls.

**3. Behaviors that must survive across sessions and compaction.**

Agent definitions persist in version control. A prompt-driven approach relies on
the orchestrator regenerating the prompt each time, which means the behavior
varies with the orchestrator's context window state.

**Applies to deep-research:** YES, for the core workflow. Research quality
should not depend on whether the orchestrating session has been compacted.

### When Prompt-Driven Agents Are Sufficient

**1. One-off or highly context-dependent tasks.**

The `gsd-integration-checker` (427 lines) checks cross-phase wiring that is
unique to each project. Much of its value comes from the verification
_methodology_ (export/import maps, wiring patterns), not project-specific
knowledge. A lighter agent could work here.

**Applies to deep-research:** For fact-checking and critique passes, the
specific checks are question-dependent. A generic "verify these claims against
these sources" prompt adapts better than a rigid agent.

**2. Roles that are essentially convergence-loop iterations.**

The codebase already has `/convergence-loop` as a skill. Verification and
critique of research findings are fundamentally convergence operations: "check
these claims, find gaps, iterate." Defining a full custom agent for what amounts
to a convergence pass adds maintenance without adding behavioral precision.

**3. Roles where the orchestrator has full context anyway.**

If the orchestrator has already loaded the research findings into its context
(because it needs to route and coordinate), spawning a separate "critic" agent
means duplicating that context into a subagent. A prompt-driven pass within the
orchestrator or a convergence-loop invocation is more token-efficient.

### Cost Analysis

| Factor                        | Custom Agent                                     | Prompt-Driven                             |
| ----------------------------- | ------------------------------------------------ | ----------------------------------------- |
| **Creation effort**           | 500-900 lines per agent                          | 0 (prompts written inline)                |
| **Maintenance**               | Must update when tool APIs or conventions change | N/A                                       |
| **Consistency**               | HIGH — same behavior every invocation            | MEDIUM — varies with orchestrator state   |
| **Auditability**              | HIGH — versioned, diffable, reviewable           | LOW — ephemeral, embedded in conversation |
| **Token cost per invocation** | Agent definition loaded into subagent context    | Prompt loaded into orchestrator context   |
| **Staleness risk**            | Medium — agents can drift from reality           | Low — prompts are always current          |
| **Reusability**               | Across sessions, invocations, users              | Single invocation only                    |

---

## Candidate Agent Roles

### 1. deep-research-decomposer

- **Purpose:** Break a research question into sub-queries, identify search
  strategies, determine source types needed, estimate scope.
- **Custom agent?** NO. This is a planning/reasoning step that benefits from the
  full context of the user's question, existing codebase knowledge, and the
  skill's orchestration logic. Making it a separate agent means losing the
  orchestrator's context about _why_ the research was requested. The deep-plan
  skill handles decomposition inline (Phase 0 context gathering, Phase 1
  discovery) without a separate agent.
- **Better approach:** Inline orchestrator logic within the SKILL.md, similar to
  how `/deep-plan` handles its Phase 0 and Phase 1 without spawning a decomposer
  agent.
- **Tools needed:** (if custom) Read, Grep, Glob, WebSearch
- **Input/Output contract:**
  - Input: Research question + context (topic, depth, constraints)
  - Output: Structured research plan with sub-queries, source strategy, scope
    estimate

### 2. deep-research-searcher (+ analyzer combined)

- **Purpose:** Execute web searches, fetch pages, analyze documents, extract
  findings with confidence levels, verify claims against sources.
- **Custom agent?** YES — strongest candidate. This role has:
  - Complex tool strategy (WebSearch query formulation, WebFetch for specific
    URLs, source verification protocol)
  - Behaviors that must be consistent (confidence levels, citation tracking,
    claim verification)
  - Direct parallel to `gsd-project-researcher` which is proven effective
  - Can be spawned in parallel (multiple searchers for different sub-queries)
- **Why combine searcher + analyzer:** In practice, analyzing a source is part
  of searching. You search, fetch a page, analyze it, and determine if you need
  to search again. Splitting these into separate agents creates unnecessary
  handoff overhead and loses the search-analyze-refine loop.
- **Tools needed:** Read, Write, Bash, WebSearch, WebFetch, mcp**context7**\*
- **Input/Output contract:**
  - Input: Sub-query + source strategy + output path + confidence requirements
  - Output: `{sub-query}-FINDINGS.md` with sections: Key Findings, Sources (with
    confidence levels), Contradictions, Gaps, Confidence Assessment

### 3. deep-research-verifier

- **Purpose:** Fact-check findings, cross-reference claims across sources,
  identify contradictions, assess overall evidence quality.
- **Custom agent?** MAYBE — leaning NO. Verification in this context is:
  - Cross-referencing findings files (which the synthesizer already does)
  - Checking claims against sources (which the searcher already does
    per-finding)
  - Identifying contradictions (pattern matching across findings files)

  This overlaps heavily with what the synthesizer does and with what a
  convergence-loop pass provides. The GSD ecosystem has `gsd-verifier` (789
  lines), but it verifies _codebase artifacts_ (files exist, are substantive,
  are wired) — a fundamentally different task than verifying _research claims_.
  Research claim verification is better handled as a pass within the synthesizer
  or as a convergence-loop invocation.

- **Better approach:** A verification pass within the synthesizer agent, or a
  `/convergence-loop` invocation from the orchestrator after synthesis.
- **Tools needed:** (if custom) Read, WebSearch, WebFetch
- **Input/Output contract:**
  - Input: Synthesized findings + original sources
  - Output: Verification report with confidence upgrades/downgrades

### 4. deep-research-synthesizer

- **Purpose:** Combine findings from multiple searcher agents into a coherent,
  structured output. Identify patterns, contradictions, and gaps across
  sub-queries. Produce the final research document.
- **Custom agent?** YES. This role has:
  - Clear parallel to `gsd-research-synthesizer` (proven pattern)
  - Specific output format requirements (the final deliverable)
  - Downstream consumer contract (the user, or a plan that consumes the
    research)
  - Must handle multi-source synthesis consistently (not just concatenation)
  - Includes verification pass (cross-reference findings, flag contradictions)
- **Tools needed:** Read, Write, Bash
- **Input/Output contract:**
  - Input: Multiple `{sub-query}-FINDINGS.md` files + original research
    question + output format specification
  - Output: `SYNTHESIS.md` (executive summary, key findings by theme,
    contradictions, confidence assessment, gaps, recommendations)

### 5. deep-research-critic

- **Purpose:** Identify gaps, biases, weak evidence, and missing perspectives in
  the synthesized output.
- **Custom agent?** NO. This is a convergence-loop pass. The codebase already
  has `/convergence-loop` which provides exactly this pattern: "check these
  claims, find issues, iterate." Defining a separate agent duplicates an
  existing capability.
- **Better approach:** `/convergence-loop` invocation on the synthesis output,
  with a research-specific preset that checks for: source diversity, recency,
  confidence level distribution, topic coverage, and bias indicators.
- **Tools needed:** (if custom) Read, WebSearch
- **Input/Output contract:**
  - Input: SYNTHESIS.md
  - Output: Critique with gaps, biases, and suggested additional research

### 6. deep-research-orchestrator

- **Purpose:** Coordinate the other agents — decompose the question, spawn
  searchers, collect findings, trigger synthesis, run verification.
- **Custom agent?** NO — this should be the SKILL.md itself. The GSD pattern
  shows that orchestration lives in the `/gsd:*` skill/command definitions, not
  in a separate orchestrator agent. The skill IS the orchestrator. It:
  - Receives the user's research question
  - Decomposes it into sub-queries (inline logic)
  - Spawns searcher agents via Task tool (in parallel)
  - Collects findings
  - Spawns synthesizer agent
  - Runs convergence-loop verification
  - Presents results to user
- **Precedent:** `/deep-plan` SKILL.md handles all orchestration inline (phases
  0-4 + handoff). `/gsd:new-project` orchestrator spawns researchers,
  synthesizer, and roadmapper from the skill level.

---

## Orchestration Infrastructure

### What Exists

**1. Subagent pattern (Task tool):** The primary pattern for agent spawning.
Skills and orchestrators use the Task tool to spawn subagents with specific
agent definitions. Subagents work independently, write files, and return
structured results. Max 4 concurrent agents per `AGENT_ORCHESTRATION.md`.

**2. Agent Teams (experimental):** Enabled via
`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. Allows inter-agent communication. The
decision rule from `AGENT_ORCHESTRATION.md`: "If agents would benefit from
talking to each other during execution, use a team. Otherwise use subagents."
Deep-research searchers are independent (different sub-queries) — subagent
pattern is appropriate.

**3. Parallel execution:** `AGENT_ORCHESTRATION.md` specifies criteria for
parallel execution: 12+ items, 3+ distinct files, 2+ concern areas, no
dependencies. Research sub-queries naturally meet these criteria.

**4. Convergence loops:** The `/convergence-loop` skill provides iterative
verification. It can be invoked programmatically with presets. This is the right
tool for verification and critique passes rather than dedicated agents.

**5. Structured returns:** All agents use structured return formats
(`## RESEARCH COMPLETE`, `## SYNTHESIS COMPLETE`) that enable orchestrators to
parse status. The deep-research skill should follow this convention.

### What's Missing

**1. No research-specific agent definitions.** The GSD researchers
(`gsd-project-researcher`, `gsd-phase-researcher`) are domain-specific (software
project ecosystems). A deep-research skill needs general-purpose research agents
that work across any topic domain.

**2. No web-research verification preset for convergence-loop.** The
`/convergence-loop` skill would need a `research-claims` preset that checks:
source diversity, recency, confidence levels, topic coverage, bias.

**3. No standard "findings file" format.** GSD research agents write
RESEARCH.md, STACK.md, etc. — formats specific to software project research.
Deep-research needs a general findings format.

---

## Recommended Architecture

```
/deep-research SKILL.md (orchestrator)
  |
  |-- Phase 0: Decomposition (inline in skill)
  |     Parse question, identify sub-queries, determine source strategy
  |
  |-- Phase 1: Research (parallel subagents)
  |     Spawn 2-4 deep-research-searcher agents via Task tool
  |     Each gets: sub-query, source strategy, output path
  |     Each writes: .planning/<topic>/research/<sub-query>-FINDINGS.md
  |
  |-- Phase 2: Synthesis (subagent)
  |     Spawn deep-research-synthesizer agent
  |     Reads all FINDINGS.md files
  |     Writes: .planning/<topic>/research/SYNTHESIS.md
  |
  |-- Phase 3: Verification (convergence-loop, inline)
  |     Run /convergence-loop with research-claims preset on SYNTHESIS.md
  |     If gaps found: spawn additional searcher(s) for specific gaps
  |     Re-run synthesizer with augmented findings
  |
  |-- Phase 4: Presentation (inline in skill)
  |     Present SYNTHESIS.md to user
  |     Offer: accept, request deeper research on specific area, reframe
```

**Why this architecture:**

1. **Skill as orchestrator** follows the `/deep-plan` and `/gsd:*` precedent. No
   separate orchestrator agent needed.

2. **Searcher agents in parallel** is where the most value comes from
   parallelization. Different sub-queries are fully independent.

3. **Synthesizer as its own agent** because synthesis requires reading all
   findings files and producing a coherent output — a distinct capability from
   searching.

4. **Convergence-loop for verification** reuses existing infrastructure rather
   than creating a new agent.

5. **Decomposition inline** because it needs the orchestrator's full context
   (user's question, any codebase knowledge, conversation history).

---

## Minimum Viable Agent Set

### Phase 1: Two agents + one skill

| Artifact                       | Type  | Lines (est.) | Priority |
| ------------------------------ | ----- | ------------ | -------- |
| `deep-research` SKILL.md       | Skill | 200-300      | P0       |
| `deep-research-searcher.md`    | Agent | 500-700      | P0       |
| `deep-research-synthesizer.md` | Agent | 250-350      | P0       |

**Total estimated lines:** 950-1,350

**Rationale:** This is the smallest set that delivers the core value
proposition:

- The skill decomposes questions and coordinates agents
- The searcher does the actual web research with disciplined source handling
- The synthesizer combines findings into a coherent output

### Phase 2: Add verification and optional agents

| Artifact                                                             | Type         | Priority |
| -------------------------------------------------------------------- | ------------ | -------- |
| Convergence-loop `research-claims` preset                            | Skill update | P1       |
| `deep-research-searcher` tool strategy refinements                   | Agent update | P1       |
| `deep-research-codebase-searcher.md` (variant for codebase research) | Agent        | P2       |

### What to explicitly NOT build

| Role                             | Why Not                                      |
| -------------------------------- | -------------------------------------------- |
| deep-research-decomposer agent   | Inline in skill; needs orchestrator context  |
| deep-research-critic agent       | Convergence-loop handles this                |
| deep-research-verifier agent     | Synthesizer + convergence-loop handle this   |
| deep-research-orchestrator agent | Skill IS the orchestrator                    |
| deep-research-formatter agent    | Output formatting is part of the synthesizer |

### Design Principles for the Custom Agents

Based on what works in the GSD ecosystem:

1. **Fork from proven templates.** The `deep-research-searcher` should fork from
   `gsd-project-researcher` (tool strategy, source hierarchy, verification
   protocol, confidence levels). The `deep-research-synthesizer` should fork
   from `gsd-research-synthesizer` (synthesis methodology, structured returns).

2. **Keep agents under 800 lines.** The most effective GSD agents are in the
   600-800 line range. The 1,300+ line agents (`gsd-planner`, `gsd-debugger`)
   are complex because they handle multiple modes — research agents should not.

3. **Generalize away from software domains.** The GSD researchers are tuned for
   software ecosystem research (Context7, npm packages, framework versions). The
   deep-research agents need to work for any topic: technology, market analysis,
   academic research, competitive analysis, etc.

4. **Define clear file-based contracts.** Input via prompt context + file paths.
   Output via specific file format in `.planning/<topic>/research/`. Structured
   return to orchestrator with status and key findings summary.

5. **Encode the hard parts, not the obvious parts.** The value of a custom agent
   is encoding behaviors that an ad-hoc prompt gets wrong: source confidence
   assessment, search query reformulation, contradiction detection, "I don't
   know" honesty. Do not waste lines on generic instructions ("be thorough",
   "write clearly") that any prompt would include.

---

## Appendix: GSD Agent Pattern Reference

### Frontmatter Fields

| Field         | Required | Values                                                                                                                         |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `name`        | Yes      | kebab-case identifier                                                                                                          |
| `description` | Yes      | 1-3 sentence purpose, mentions spawner                                                                                         |
| `tools`       | Yes      | Comma-separated: Read, Write, Edit, Bash, Grep, Glob, WebSearch, WebFetch, mcp**context7**\*                                   |
| `color`       | Yes      | cyan (research), green (planning/verification), purple (synthesis), yellow (execution), orange (debugging), blue (integration) |

### Section Pattern

```
<role>           — WHO you are, WHO spawns you, WHAT you do
<philosophy>     — HOW you think, WHAT to avoid
<upstream_input> — WHAT you receive, HOW to parse it
<downstream_consumer> — WHO reads your output, HOW they use it
<tool_strategy>  — WHEN and HOW to use each tool
<output_format>  — EXACT template for files you write
<execution_flow> — STEP-BY-STEP numbered process
<structured_returns> — RETURN format for orchestrator
<success_criteria> — CHECKLIST of completion conditions
```

### Spawning Pattern

Agents are spawned via the Task tool by skills/orchestrators. The spawning
context provides:

- Agent name (matches `.claude/agents/global/{name}.md`)
- Prompt with specific inputs (phase number, file paths, constraints)
- The agent reads its own definition for behavior guidance

Agents do NOT spawn other agents. Only skills/orchestrators spawn agents. This
is a strict hierarchy: Skill -> Agent, never Agent -> Agent.
