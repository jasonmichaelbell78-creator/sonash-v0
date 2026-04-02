# OTB Challenge: Alternative Approaches to the Research & Discovery Standard

<!-- prettier-ignore-start -->
**Type:** Outside-the-Box Challenge
**Date:** 2026-03-24
**Author:** Claude Opus 4.6 (1M context)
**Status:** CHALLENGE -- feeds architecture refinement
**Target:** W4c-standard-architecture.md (the proposed 4-tier, 6-document RDS)
<!-- prettier-ignore-end -->

---

## Premise

The W4c architecture proposes a 4-tier research model codified in 6 documents,
with hooks for detection, graduated verification, multi-agent teams, a unified
confidence scale, and CANON ecosystem registration. It is thorough,
well-sourced, and internally consistent.

This document challenges the **framing itself** -- not the details within the
frame. The question is not "are the tiers well-defined?" but "should there be
tiers at all?" Seven alternative framings follow. Each receives a verdict:
REPLACE, SUPPLEMENT, or INFORM.

---

## Challenge 1: Continuous Adaptation Instead of Discrete Tiers

### The Alternative

Abolish T0/T1/T2/T3. Instead, research is a **continuous dial** that the AI
turns up or down in real time based on what it discovers. There are no tier
boundaries to classify, no escalation/de-escalation decisions, no tier
declarations in frontmatter. The AI starts every research task at minimum effort
and ratchets up investment as complexity reveals itself.

Concretely: the AI begins with inline checks (what the current architecture
calls T0). If those are insufficient, it opens a web search -- no ceremony, no
tier jump. If sources contradict, it spawns a second agent to investigate the
contradiction -- no "escalation to T2" decision. The research effort is an
emergent property of the problem, not a pre-classified category.

### Strengths

- **Eliminates misclassification.** The architecture acknowledges escalation and
  de-escalation as necessary because initial tier selection is often wrong. A
  continuous model never has to be wrong because it never commits to a category.
- **Reduces cognitive overhead.** The AI does not need to evaluate 4 tier
  definitions, match triggers, and declare a tier before starting work. It just
  starts working and invests more as needed.
- **Matches how humans actually research.** No human thinks "this is a Tier 2
  investigation." They start looking, and the depth emerges from the problem.
  The proposed tiers are an artificial discretization of a fundamentally
  continuous process.
- **Simpler to implement.** No RDS-TIERS.md. No tier classification logic in
  hooks. No escalation/de-escalation protocol. Just a set of tools and the
  judgment to use more of them when needed.

### Weaknesses

- **Budget unpredictability.** Tiers give the user a contract: "T1 is 5-15
  minutes, T2 is 30-90 minutes." Without tiers, the AI could silently burn 2
  hours on what the user expected to be a 5-minute lookup. The user loses their
  ability to say "do a T1 on this, not a T3."
- **Verification gaps.** Graduated verification is one of the architecture's
  strongest ideas. In a continuous model, when does adversarial disconfirmation
  kick in? When does cross-model verification become required? Without
  thresholds, verification becomes ad hoc -- which is the current problem the
  standard is trying to solve.
- **No auditability.** The tier model lets you look at research artifacts and
  know what process was followed. A continuous model produces artifacts of
  unpredictable depth with no way to assess whether the process was appropriate
  for the question.
- **Relies on perfect AI judgment.** The entire model assumes the AI will
  correctly calibrate its effort in real time. The current architecture exists
  precisely because Claude's judgment about when to research is unreliable (SQ6
  Gap G1-G7).

### Verdict: INFORM

The continuous model correctly identifies that tier boundaries are somewhat
artificial and that misclassification is a real cost. But it trades known
problems (misclassification) for worse ones (budget unpredictability, no
verification contract, no auditability). The architecture should absorb the
insight by making tier boundaries **softer** -- treat them as default
checkpoints rather than rigid categories. Specifically: allow T1 to silently
deepen into T2 behavior without a formal escalation ceremony, as long as the
time budget is respected and the artifacts eventually get produced.

---

## Challenge 2: A Library of Research Primitives Instead of a Protocol

### The Alternative

Do not write RDS-PROTOCOL.md, RDS-TIERS.md, or RDS-VERIFICATION.md. Instead,
build a **library of composable research primitives** that any skill can import
and combine:

```
research-primitives/
  search/
    web-search.js      -- WebSearch with retry + CRAAP scoring
    code-search.js     -- Grep/Glob with context assembly
    memory-search.js   -- Episodic memory + research-index lookup
    doc-search.js      -- Context7 + WebFetch for library docs
  verify/
    craap-score.js     -- Score a single source
    sift-check.js      -- Lateral reading on a source
    cross-ref.js       -- Compare N sources for agreement
    adversarial.js     -- Neutralized query generation + disconfirmation
    cross-model.js     -- Gemini CLI verification
  synthesize/
    merge-findings.js  -- Combine findings from multiple agents
    contradiction.js   -- Detect and surface contradictions
    confidence.js      -- Assign unified confidence with basis tags
  orchestrate/
    parallel-search.js -- Fan-out to N agents, gather results
    convergence.js     -- Run passes until stable
```

Skills compose these primitives freely. `deep-research` uses most of them.
`code-reviewer` uses `code-search` + `craap-score`. A new skill uses whatever
combination it needs. Unix philosophy: each primitive does one thing well, and
they compose through a standard interface (findings objects with confidence
metadata).

### Strengths

- **Maximum reusability.** The 14+ non-core skills that do research (SQ2) could
  immediately use verified search and verification primitives without adopting
  the full tier model.
- **Innovation-friendly.** New research patterns can emerge by combining
  primitives in ways the standard authors did not anticipate. A protocol
  constrains; a library enables.
- **Testable in isolation.** Each primitive can be unit-tested. A protocol can
  only be tested end-to-end.
- **Incremental adoption.** A skill can adopt one primitive at a time. A
  protocol is all-or-nothing (or at least feels that way to skill authors).
- **Solves the duplication problem directly.** CL-PROTOCOL and convergence-loop
  are structurally isomorphic (SQ1 Section 5.3) because they both implemented
  verification from scratch. A shared `verify/` library would have prevented
  that.

### Weaknesses

- **Does not solve the judgment problem.** The library gives skills better tools
  but does not tell them when to use which tools. The tier model's value is
  precisely in the decision rules ("if 2+ sources contradict, escalate to T2
  verification"). A library without decision rules is a toolkit without a
  manual.
- **Standards emerge anyway.** If every skill composes primitives differently,
  the user gets inconsistent research quality across skills. The pressure to
  standardize those compositions will recreate the tier model under a different
  name.
- **Implementation cost.** Building reliable JS primitives for CRAAP scoring,
  SIFT lateral reading, and adversarial disconfirmation is substantial
  engineering. The current architecture achieves the same outcomes through
  behavioral rules at near-zero implementation cost.
- **Claude Code agents run in separate processes.** The primitives would need to
  be importable by agents, which means they need to be tool-accessible or
  embedded in agent definitions, not just JS files. The "library" metaphor does
  not map cleanly to the agent execution model.

### Verdict: SUPPLEMENT

The library concept is the right long-term infrastructure. But it supplements
rather than replaces the protocol. The protocol defines **which primitives to
use when** (the decision rules). The library provides **the implementations**.
The architecture should add "research primitives library" as a Phase 4+ goal,
built as shared tool implementations that agents can invoke. Phase 1-3 proceed
with behavioral rules. Phase 4+ extracts common patterns into reusable
primitives. This avoids building infrastructure before knowing which patterns
are actually common.

---

## Challenge 3: Better Behavioral Instructions Instead of Hook Detection

### The Alternative

Delete all hook-based research detection (Section 4B of the architecture). Do
not modify `user-prompt-handler.js` or `post-read-handler.js`. Instead, write
better behavioral instructions in CLAUDE.md that make the AI naturally recognize
when to research.

The argument: hooks are a crude instrument for a nuanced problem. Keyword
detection ("research", "compare", "best practice") catches obvious cases but
misses the hard ones -- the cases where the AI does not realize it is in
unfamiliar territory (SQ6 Gap G1), or where the user's question implies research
without using research keywords. These hard cases require judgment, not pattern
matching.

If the real fix is better behavioral rules, then hooks are a distraction that
adds implementation cost, creates alert fatigue risk, and gives a false sense of
coverage ("we have hooks for that") when the actual coverage gap remains in the
judgment layer.

### Strengths

- **Zero implementation cost for hook changes.** Behavioral rules are just text
  in CLAUDE.md. No scripts to write, test, or maintain.
- **Addresses the hard cases.** The hardest research detection problems (SQ6
  Gaps G1, G2, G4, G7) are contextual judgment calls that hooks cannot make.
  Better behavioral training focuses investment where the gap is largest.
- **No alert fatigue risk.** Hooks produce alerts. Behavioral rules produce
  internal AI decisions. The user never sees a false-positive research
  suggestion.
- **Simpler architecture.** The 3-layer detection model (hooks -> behavioral ->
  skill-internal) becomes a 2-layer model. Fewer moving parts, fewer failure
  modes.

### Weaknesses

- **Behavioral rules are the weakest enforcement tier.** The architecture itself
  annotates behavioral rules as `[BEHAVIORAL: no automated enforcement]`. They
  work when the AI pays attention and fail when it does not. Hooks exist
  precisely as a safety net for when behavioral rules are forgotten or ignored.
- **No feedback loop.** Hooks can be tested ("did the hook fire on this
  input?"). Behavioral rules cannot be tested in isolation. You only discover
  they failed when the AI produces bad research or skips research entirely.
- **Compaction vulnerability.** Long conversations compact CLAUDE.md content.
  Behavioral rules can be lost to compaction. Hooks run as code outside the
  conversation and survive compaction.
- **Historical evidence is against this.** SQ6 documents 7 gaps where the AI
  currently fails to recognize research-worthy situations despite existing
  behavioral rules. The current behavioral instructions are already there and
  are not working. Adding more text to the same mechanism does not fix the
  mechanism.

### Verdict: INFORM

The challenge correctly identifies that hooks cannot solve the judgment problem
and that the hardest gaps require better behavioral training. But it incorrectly
concludes that better behavioral rules should replace hooks. The evidence (7
existing behavioral gaps per SQ6) shows that behavioral rules alone are
insufficient. The architecture's 3-layer model is correct: hooks catch what
behavior misses, behavior covers what hooks cannot, skill internals enforce what
both miss. The insight to absorb: invest proportionally more in behavioral rule
quality (guardrail #15 wording, examples, self-check triggers) and
proportionally less in hook sophistication (Phase 1 only, skip Phases 2-3 of
hook enhancement until Phase 1 proves valuable).

---

## Challenge 4: A Well-Equipped Solo Agent Instead of Multi-Agent Teams

### The Alternative

Do not define RDS-TEAMS.md. Do not create `development-team.md`. Do not invert
team spawn defaults. Instead, give a single agent access to all the tools it
needs and let it handle research end-to-end.

The coordination overhead of multi-agent research is substantial: task
decomposition, agent spawning, result gathering, deduplication, synthesis,
contradiction resolution between agents. SQ7b Finding 13 (DeepMind) shows that
coordination errors grow with agent count, capping useful parallelism at 4. But
coordination errors at 2-3 agents are still nonzero, and the synthesis step
(combining independently-discovered findings into a coherent whole) is where
most quality is lost.

A single agent with tool access to multiple MCP servers (WebSearch, WebFetch,
Context7, SonarCloud, episodic memory, sequential thinking) can do everything
2-4 searcher agents do -- sequentially, but with perfect internal coherence and
zero coordination overhead.

### Strengths

- **Zero coordination overhead.** No task decomposition errors, no synthesis
  step, no contradiction resolution between agents that were given slightly
  different sub-questions.
- **Perfect context continuity.** A single agent accumulates context throughout
  the research. Agent handoffs lose context. The synthesis step reconstructs
  context from agent outputs, which is a lossy process.
- **Simpler error recovery.** When a single agent hits a dead end, it
  backtracks. When one of four parallel agents hits a dead end, the orchestrator
  does not know until synthesis time, and by then it may be too late.
- **Cheaper.** Multi-agent research multiplies token cost by the number of
  agents. A solo agent uses tokens sequentially but avoids the overhead tokens
  of task decomposition, agent prompts, and synthesis.
- **Actually matches current behavior.** Most research today is done by a single
  agent (SQ4 Section 6: teams are never spawned). The standard would be
  codifying what already works rather than imposing what doesn't.

### Weaknesses

- **Speed.** Parallel agents complete faster than sequential investigation. For
  T3 research with 5+ sub-questions, sequential investigation could take 3-5x
  longer.
- **Confirmation bias.** A single agent develops a narrative and then
  confirmation-biases its remaining searches. Independent agents with different
  sub-questions surface more diverse findings. The contrarian/OTB agent roles
  exist specifically to counteract the primary agent's biases.
- **Context window limits.** A single agent doing T3 research accumulates
  enormous context. At some point it will hit context limits or compaction,
  losing earlier findings. Parallel agents each have their own context window.
- **The evidence says multi-agent wins.** SQ7b Finding 12 (Anthropic) documents
  90% improvement with multi-agent research. This is not a marginal gain. The
  solo-agent approach bets against strong empirical evidence.

### Verdict: INFORM

The solo-agent model is correct for T0 and T1 (the architecture already
specifies no agent spawning there). For T2, the case is genuinely mixed -- the
coordination overhead of 2-4 agents may not be worth it for every T2 task. For
T3, the empirical evidence strongly favors multi-agent, particularly for the
contrarian/OTB roles that structurally cannot be replicated by a single agent
(an agent cannot adversarially challenge its own conclusions with the same
effectiveness as an independent agent).

The insight to absorb: raise the threshold for multi-agent spawning. Instead of
"2-4 sub-questions -> parallel subagents," try "2-3 sub-questions -> solo agent
with sequential investigation; 4+ sub-questions -> parallel subagents." This
keeps solo-agent benefits for simpler T2 tasks while preserving multi-agent
benefits where they are empirically justified.

---

## Challenge 5: Minimal Viable Standard -- Over-Standardization Risk

### The Alternative

The proposed architecture is 6 documents, 4 tiers, a unified confidence scale
with basis tags, 3-layer detection, graduated verification with 17 checks at T3,
10 key design decisions, 6 implementation phases across 7 sessions, CANON
ecosystem registration, and inter-ecosystem contracts.

What if the minimum viable standard is:

1. **One document** (RDS-PROTOCOL.md, under 200 lines) containing:
   - The 4-tier definitions (one paragraph each)
   - The unified confidence scale (one table)
   - One behavioral guardrail for CLAUDE.md
2. **Nothing else.** No RDS-ENFORCEMENT.md, no RDS-TIERS.md, no RDS-TOOLS.md, no
   RDS-TEAMS.md, no RDS-VERIFICATION.md. No hook changes. No CANON registration.
   No schema validation.

The hypothesis: research quality is driven by 20% of the standard. The tier
model and confidence scale are that 20%. Everything else is process overhead
that constrains without proportional benefit.

Research is inherently creative and exploratory. Standardizing it is like
standardizing brainstorming -- the more structure you add, the more you
constrain the lateral thinking that makes research valuable. The best research
happens when a smart agent follows its curiosity with good tools. The worst
research happens when an agent is busy checking boxes on a verification
checklist instead of investigating the actual question.

### Strengths

- **Implementable in one session.** Phase 1 of the proposed architecture already
  describes this minimal version. Why plan Phases 2-6 before validating Phase 1?
- **Low token cost.** One 200-line document loaded on demand costs negligible
  tokens. Six documents with graduated verification checklists cost substantial
  tokens when loaded during research.
- **Preserves research creativity.** The AI retains full freedom to adapt its
  research approach to the unique characteristics of each question. No checklist
  constrains exploration.
- **Pareto-optimal.** If the tier model is the key insight (and the architecture
  treats it as Decision D1, the most fundamental), then delivering that insight
  with minimum overhead maximizes the value-to-cost ratio.

### Weaknesses

- **The current minimal standard already exists and is failing.** The current
  research process is already minimal (behavioral rules in CLAUDE.md, no formal
  tiers). SQ6 documents 7 gaps. The minimal approach has been tested and found
  insufficient -- that is why the standard is being proposed in the first place.
- **"Preserves creativity" is a euphemism for "no quality control."** The
  current state preserves creativity and produces inconsistent, unverified
  research. The verification protocol exists because unverified findings have
  led to wrong implementations (this is the project's historical experience, per
  SQ1).
- **Skipping verification is the highest-impact failure mode.** The architecture
  identifies "Standard is too complex, AI ignores it" as a MEDIUM likelihood,
  HIGH impact risk. But the alternative -- "Standard is too simple, AI follows
  it but research quality does not improve" -- is HIGHER likelihood and the same
  HIGH impact.
- **Phases 2-6 are the actual value.** The tier model is the framework; the
  confidence scale, verification protocol, and tool selection rules are the
  content. A framework without content is a classification system that does not
  change behavior.

### Verdict: INFORM (with a strong caution)

The over-standardization concern is legitimate but the proposed remedy is wrong.
The architecture already addresses this through phased implementation where each
phase is independently valuable. The correct response is not to strip the
standard down to one document permanently, but to validate Phase 1 rigorously
before committing to Phases 2-6. If Phase 1 alone produces measurable
improvement in research quality (fewer unverified claims, fewer missed research
opportunities), then proceed. If it does not, the problem is not in Phases 2-6
but in the fundamental model.

The insight to absorb: add an explicit validation gate between Phase 1 and
Phase 2. Define 3-5 concrete metrics that Phase 1 must improve before Phase 2
begins. Do not treat the 6-phase plan as a committed roadmap -- treat it as a
hypothesis with checkpoints.

---

## Challenge 6: The Real Problem Is Tool Quality, Not Process

### The Alternative

Stop building process. Fix the tools.

The architecture proposes behavioral rules, hooks, tiers, verification
protocols, agent teams, and 6 documents of process -- all to govern how the AI
uses tools that may be fundamentally inadequate. Consider the tool landscape:

- **WebSearch** returns results the AI cannot deeply evaluate for quality. It
  sees titles and snippets, not full articles.
- **WebFetch** retrieves pages but has no mechanism for extracting structured
  claims from unstructured text.
- **Context7** provides library documentation but its coverage is inconsistent
  and often misses bleeding-edge versions (exactly the versions SoNash uses).
- **Episodic memory** has limited semantic search. Finding "what did we decide
  about X?" requires the right keywords, not conceptual understanding.
- **SonarCloud MCP** provides code quality metrics but no research-relevant
  information about external technologies.

If these tools are insufficient, no amount of process standardization will
produce reliable research. The verification protocol (CRAAP scoring, SIFT
lateral reading, cross-model verification) assumes the tools can find and
retrieve high-quality sources. If they cannot, verification becomes a ritual
that generates false confidence.

The alternative: invest the 7 sessions budgeted for the standard into building
better research tools. Examples:

- A source quality MCP that pre-scores web results by domain authority
- A structured claim extractor that pulls testable assertions from web pages
- A research memory system with semantic (not keyword) search
- Better Context7 integration that auto-fetches docs for CLAUDE.md stack
  versions

### Strengths

- **Addresses root cause.** If tool quality is the bottleneck, process
  improvement yields diminishing returns. Better tools yield direct returns.
- **Measurable improvement.** Tool quality can be benchmarked: "can the tool
  retrieve the correct Zod 4 API documentation?" Process quality requires
  subjective evaluation.
- **Benefits all research, not just standardized research.** Better tools
  improve every AI interaction, not just the ones that trigger the research
  standard.
- **Aligns with Unix philosophy.** Sharp tools used by a skilled operator
  outperform dull tools governed by a detailed protocol.

### Weaknesses

- **False dichotomy.** Better tools and better process are not mutually
  exclusive. The 7-session budget is not the only resource available. Process
  work can happen in parallel with tool improvement.
- **Tool building is engineering, not configuration.** The research standard can
  be implemented by editing markdown files and adding behavioral rules. Building
  an MCP server for source quality scoring is a multi-session engineering
  project with its own risks and maintenance burden.
- **Tools without process produce inconsistent results.** Even with perfect
  tools, the AI needs to know when to use which tool, how much verification is
  appropriate, and when to stop researching. That is what the standard provides.
- **The tools are external dependencies.** WebSearch, Context7, and the MCP
  infrastructure are not under this project's control. Investing heavily in
  tool-level improvements may be wasted if upstream tools change their APIs or
  capabilities.
- **The architecture already addresses tool selection.** RDS-TOOLS.md and the
  per-tier tool assignments are precisely about using the right tool for each
  context. The standard does not ignore tool quality -- it works with the tools
  available.

### Verdict: SUPPLEMENT

The tool quality concern is valid but the proposed remedy (abandon process,
build tools) is a false trade-off. The architecture should add a "tool quality
baseline" assessment to Phase 4 (Tool & Agent Alignment) that honestly evaluates
each tool's reliability for research tasks and documents known limitations.
Where tools are unreliable (e.g., Context7 for bleeding-edge versions), the
verification protocol should compensate with additional checks rather than
assuming the tool works correctly.

Separately, a "research tool improvement" initiative should be proposed on the
ROADMAP as a parallel track. It is a valid investment that does not compete with
the standard.

---

## Challenge 7: A Research Agent Instead of a Research Standard

### The Alternative

Do not write 6 documents. Build one agent: `research-agent`.

This agent encapsulates all research knowledge internally. You invoke it with a
question. It internally:

1. Classifies complexity (the tier model, but as code, not documentation)
2. Selects tools (RDS-TOOLS, but as decision logic, not a reference guide)
3. Spawns sub-agents if needed (RDS-TEAMS, but as orchestration code)
4. Runs verification appropriate to complexity (RDS-VERIFICATION, but as checks)
5. Produces findings with unified confidence (the confidence scale, but
   computed)
6. Returns a structured output that any consuming skill can parse

The standard becomes executable code, not documentation. The 6 documents become
the agent's internal logic. Skills do not need to "follow the standard" -- they
call the agent and get standardized research output.

```
Skill A: "research-agent, what are the options for X?"
         -> receives: findings[], confidence[], sources[], contradictions[]

Skill B: "research-agent, verify this claim about Y."
         -> receives: confidence, basis_tag, supporting_sources[], counter_evidence[]
```

### Strengths

- **Standards compliance is automatic.** No skill can deviate from the research
  standard because no skill implements research directly. They all delegate to
  the research agent, which embodies the standard.
- **Single point of improvement.** Improving the research agent improves all
  research across all skills simultaneously. Improving a documentation standard
  requires every skill author to re-read and re-implement.
- **Testable end-to-end.** The agent can be tested with known-answer scenarios:
  "given this question, does the agent select the right tier, use the right
  tools, and produce the right confidence level?"
- **Natural invocation.** Instead of 3-layer detection (hooks -> behavioral ->
  skill-internal), skills just call the agent when they need research. The
  invocation problem disappears because it becomes an explicit function call,
  not an implicit judgment.
- **Encapsulates complexity.** The verification protocol, confidence scale, tier
  model, and tool selection are complex. An agent hides that complexity behind a
  clean interface. Documentation exposes it and expects every consumer to
  navigate it.

### Weaknesses

- **Tier 0 cannot be an agent call.** T0 is defined as research that happens
  without the AI consciously deciding to research. Calling a research agent is a
  conscious decision. The reflexive, zero-overhead quality of T0 is lost if
  every research-adjacent check requires spawning an agent.
- **Agent spawning overhead.** Every research request, even simple T1 lookups,
  would spawn a new agent with its own context window, system prompt, and
  startup cost. This adds latency and token cost to what should be a quick
  inline operation.
- **Loss of skill-specific context.** When `code-reviewer` does research, it has
  the full code context in its conversation. Delegating to `research-agent`
  means either passing enormous context to the agent (expensive) or losing
  context (lower quality). Research is not context-free; the quality of research
  depends on understanding what the research is for.
- **Single point of failure.** If the research agent has a bug in its tier
  classification logic, all research across all skills is affected.
  Documentation errors affect only the skills that happen to reference that
  section.
- **Agent definition complexity.** The agent's system prompt would need to
  contain everything in all 6 documents. That is a massive system prompt that
  may exceed practical limits or cause the agent to miss instructions due to
  prompt length.
- **Does not solve the detection problem.** Skills still need to know WHEN to
  call the research agent. The architecture's 7 detection gaps (SQ6) are about
  the AI not recognizing it needs research, not about the AI doing research
  poorly. A research agent helps with the latter but not the former.

### Verdict: SUPPLEMENT (long-term evolution)

The research agent is the correct long-term end state. The standard-as-
documentation is the necessary intermediate step. The path is:

1. **Now (Phases 1-3):** Behavioral standard. Documentation defines the model.
   AI follows it via behavioral rules.
2. **Medium-term (Phase 4-5):** Extract research primitives as shared tools (per
   Challenge 2). The standard partially becomes code.
3. **Long-term (post-Phase 6):** Build the research agent using the primitives
   and the validated tier model. The standard fully becomes code.

Attempting to build the research agent now would be premature -- the tier model,
verification protocols, and tool selection rules have not been validated in
practice yet. You need the documentation phase to discover which parts of the
model work and which need revision. Once the model is stable, encoding it as an
agent is the right move.

The insight to absorb: add "research agent" as the long-term north star in
Section 8 of the architecture. Make it explicit that the 6 documents are a
stepping stone toward an executable standard, not the permanent end state.

---

## Summary Matrix

| #   | Alternative                    | Core Idea                                          | Verdict    | Key Insight for Architecture                                                             |
| --- | ------------------------------ | -------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| 1   | Continuous adaptation          | No discrete tiers; effort emerges from the problem | INFORM     | Soften tier boundaries; allow silent T1->T2 deepening within time budgets                |
| 2   | Research primitives library    | Composable tools instead of a protocol             | SUPPLEMENT | Add primitives library as Phase 4+ goal; protocol defines which primitives to use when   |
| 3   | Better behavioral training     | No hooks; invest in AI judgment                    | INFORM     | Invest more in guardrail #15 quality; defer hook Phases 2-3 until Phase 1 proves value   |
| 4   | Well-equipped solo agent       | No teams; one agent with all tools                 | INFORM     | Raise multi-agent threshold (4+ sub-questions, not 2+); keep solo for simple T2          |
| 5   | Minimal viable standard        | One document, no process                           | INFORM     | Add validation gate between Phase 1 and Phase 2 with concrete success metrics            |
| 6   | Fix the tools, not the process | Tool quality is the bottleneck                     | SUPPLEMENT | Add tool quality baseline to Phase 4; propose tool improvement as parallel ROADMAP track |
| 7   | Research agent                 | Standard as executable code                        | SUPPLEMENT | Declare research agent as long-term north star; current docs are stepping stone          |

### Meta-Observation

No alternative warrants fully REPLACING the proposed architecture. The 4-tier
model with graduated verification is a sound framework. But the challenges
collectively reveal three themes the architecture should address:

1. **The architecture is front-loaded with process and back-loaded with
   validation.** Challenges 1, 3, and 5 all point to the same risk: the standard
   is so complete at proposal time that it may resist revision based on
   real-world evidence. Add explicit validation gates between phases.

2. **The architecture under-invests in the tools layer.** Challenges 2, 6, and 7
   all argue that the real leverage is in tools and code, not documentation. The
   architecture correctly starts with documentation (low cost, fast iteration)
   but should more explicitly plan the transition from docs to code.

3. **The architecture over-indexes on multi-agent coordination.** Challenges 4
   and 7 both question whether the coordination overhead of teams is justified
   for anything below T3 complexity. The empirical evidence supports multi-agent
   for T3 but the case for T2 multi-agent is weaker than the architecture
   suggests.
