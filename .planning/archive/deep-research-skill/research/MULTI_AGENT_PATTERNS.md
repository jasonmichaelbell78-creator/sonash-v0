# Multi-Agent Research Architecture Patterns

**Research Date:** 2026-03-20 **Scope:** Architecture patterns, coordination
mechanisms, failure modes, and production implementations for multi-agent
research systems **Confidence:** High (primary sources: peer-reviewed papers,
official framework docs, production system post-mortems)

---

## Executive Summary

Multi-agent research systems have matured rapidly since 2024. The research
converges on several key findings:

1. **Topology matters more than agent count.** The Google/MIT scaling paper
   (Dec 2025) proved that unstructured "bag of agents" architectures amplify
   errors 17.2x, while centralized coordination contains amplification to 4.4x.
   The optimal agent count plateaus at 3-5 agents for most tasks.

2. **Orchestrator-worker is the dominant production pattern.** Anthropic,
   Salesforce, Microsoft, and OpenAI all converge on a
   lead-agent-plus-specialist-subagents architecture. Anthropic's system
   achieved 90.2% improvement over single-agent baselines with Claude Opus 4 as
   orchestrator and Claude Sonnet 4 as subagents.

3. **Diversity beats quantity.** Heterogeneous agents (different models,
   different prompts, different roles) consistently outperform homogeneous
   scaling. Bayesian-optimized hybrid teams achieve 65.8% cost savings over
   homogeneous baselines.

4. **Coordination failures are the #1 failure mode.** The MAST study (UC
   Berkeley, March 2025) analyzed 1,642 execution traces and found coordination
   breakdowns account for 36.9% of all failures, with overall failure rates
   ranging 41-86.7% across 7 frameworks.

5. **Prompt engineering is the highest-leverage intervention.** Anthropic's
   engineering team found that prompt design was "the single most important way
   to guide how the agents behaved" -- more impactful than architecture changes.

---

## Architecture Taxonomy

### 1. Hub-and-Spoke (Orchestrator-Workers)

- **Structure:** A central orchestrator agent decomposes queries, spawns
  specialized worker agents, collects results, and synthesizes the final output.
  Workers operate independently and report back.
- **Best for:** Complex research queries requiring parallel exploration of
  multiple subtopics. Medium-to-high complexity tasks where subtasks are not
  fully predictable upfront.
- **Strengths:**
  - Centralized error containment (4.4x vs 17.2x amplification)
  - Natural parallelization (Anthropic achieved 90% latency reduction)
  - Clear accountability -- orchestrator owns quality
  - Easy to add/remove specialist agents
- **Weaknesses:**
  - Orchestrator becomes a bottleneck and single point of failure
  - Context window pressure on the orchestrator as it aggregates subagent
    results
  - Orchestrator quality caps system quality
- **Examples:**
  - **Anthropic's Multi-Agent Research System** -- LeadResearcher orchestrates
    Subagents with Claude Opus 4 as lead, Sonnet 4 as workers
  - **Microsoft Magentic-One** -- Orchestrator with dual-ledger (Task Ledger +
    Progress Ledger) directing WebSurfer, FileSurfer, Coder, ComputerTerminal
  - **OpenAI Deep Research** -- Triage, Clarification, Instruction, and Research
    agents in modular multi-agent design
  - **Salesforce Enterprise Deep Research (EDR)** -- Master Planning Agent
    coordinating 4 specialized search agents + Visualization Agent
  - **CrewAI Hierarchical Process** -- Manager agent delegates and tracks
    outcomes
- **Source confidence:** HIGH -- this is the dominant production pattern across
  all major vendors.

### 2. Pipeline (Sequential Chain)

- **Structure:** Agents execute in a fixed sequence, each transforming the
  output of the previous stage. Typical chain: Researcher -> Analyzer ->
  Verifier -> Synthesizer.
- **Best for:** Well-defined research tasks with predictable stages.
  Quality-critical outputs where each stage adds a specific type of value (e.g.,
  gather -> verify -> write).
- **Strengths:**
  - Simple to reason about and debug
  - Each stage has clear input/output contracts
  - Easy to add quality gates between stages
- **Weaknesses:**
  - Sequential bottleneck -- total latency is sum of all stages
  - Error propagation: "a single root-cause failure can cascade into successive
    errors, compounding degradation and leading to task failure" (arxiv
    2509.25370)
  - Google/MIT found multi-agent coordination degrades performance by 39-70% on
    sequential tasks
- **Examples:**
  - **LangGraph Reflection Pattern** -- SearchAgent -> AnalyserAgent ->
    ReflectionAgent -> Router (quality threshold check, loop or finalize)
  - **STORM Pre-writing/Writing Pipeline** -- Research stage (perspective
    discovery + simulated conversation) -> Outline generation -> Article writing
    -> Article polishing
  - **Anthropic's Prompt Chaining pattern** -- Sequential LLM calls where each
    step processes the output of the previous one
- **Source confidence:** HIGH -- well-documented in both academic and production
  contexts.

### 3. Swarm / Consensus

- **Structure:** Multiple agents independently research the same question.
  Results are aggregated through voting, ranking, or merging. No single
  orchestrator; agents operate in parallel without direct communication.
- **Best for:** Factual questions where correctness can be verified through
  agreement. Tasks benefiting from diverse perspectives. High-stakes decisions
  requiring confidence calibration.
- **Strengths:**
  - Resilient to individual agent failures
  - Diversity of approaches reduces blind spots
  - Natural confidence signal (agreement level)
- **Weaknesses:**
  - High compute cost (N agents \* full research cost)
  - Echo-chamber effects when models share misconceptions
  - "Majority herding" -- agents converge on popular-but-wrong answers
  - Diminishing returns are steep: quorum thresholds of beta=2 through beta=4
    all achieve ~98% accuracy, meaning 2-4 agents suffice
- **Examples:**
  - **Anthropic's Voting/Parallelization pattern** -- Run same task multiple
    times for diverse outputs
  - **FREE-MAD** -- Consensus-free multi-agent debate (arxiv 2509.11035)
  - **A-HMAD** -- Adaptive Heterogeneous Multi-Agent Debate with diverse
    specialized agents
- **Source confidence:** MEDIUM-HIGH -- strong academic backing, limited
  production deployment for research specifically.

### 4. Debate / Adversarial

- **Structure:** Agents argue different positions, critique each other's
  reasoning, and iterate toward convergence. May include a judge agent that
  evaluates arguments.
- **Best for:** Topics with high uncertainty or contested claims. Fact-checking
  and claim verification. Reducing hallucination through adversarial pressure.
- **Strengths:**
  - Multiagent debate significantly improves mathematical reasoning and reduces
    hallucination
  - Forces explicit justification -- agents must defend positions with evidence
  - Disagreements become "explicit signals for where further evidence is needed"
- **Weaknesses:**
  - "Naive agent swarms prone to degeneration of thought, majority herding, and
    overconfident consensus" (arxiv 2511.07784)
  - Echo-chamber effects when models share misconceptions
  - Higher latency due to multiple debate rounds
  - Harder to set termination criteria -- when has debate "converged"?
- **Examples:**
  - **Du et al. (2024, ICML)** -- "Improving factuality and reasoning in
    language models through multiagent debate"
  - **NeurIPS 2024 Multi-LLM Debate Framework** -- Principals and interventions
    for structured debate
  - **Orthogonal reviewer panels** -- Agents with different incentives (one
    penalizes overfitting, another penalizes unverifiable claims, third focuses
    on feasibility)
- **Source confidence:** MEDIUM -- strong academic results, but production
  adoption is limited. Most production systems prefer orchestrator-worker over
  debate.

### 5. Hierarchical (Meta-Agent Decomposition)

- **Structure:** A meta-agent decomposes the research problem into a tree of
  sub-problems. Each level of the tree has its own orchestrator managing agents
  at the next level. Results flow up through synthesis at each level.
- **Best for:** Very complex research requiring multi-level decomposition.
  Large-scale research projects with naturally hierarchical topic structures.
- **Strengths:**
  - Scales to arbitrary complexity through recursive decomposition
  - Each sub-orchestrator manages limited scope
  - Natural mapping to hierarchical topic structures
- **Weaknesses:**
  - Coordination overhead grows with depth
  - Context loss through multiple levels of summarization
  - Hard to debug -- failure at any level can propagate
  - The Google/MIT finding that coordination gains plateau beyond 4 agents
    applies per-level
- **Examples:**
  - **CrewAI Hierarchical Process** -- Senior agents override junior agent
    decisions, redistribute resources
  - **Co-STORM** -- Hierarchical knowledge base organizing collected information
    into a hierarchical concept structure
  - **MetaGPT's SOP Pipeline** -- Five-role hierarchy (Product Manager ->
    Architect -> Project Manager -> Engineer -> QA) with structured handoffs
- **Source confidence:** MEDIUM -- well-theorized but less common in pure
  research systems. More common in software engineering agent systems.

---

## Agent Role Catalog

| Role                               | Responsibility                                                                                            | When Needed                                                        | Model Tier                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------- |
| **Orchestrator / Lead Researcher** | Query decomposition, strategy planning, subagent coordination, result synthesis, quality assessment       | Always -- core to every multi-agent research system                | High-capability (Claude Opus, GPT-4o, o3)      |
| **Query Decomposer**               | Breaks complex questions into parallelizable sub-questions, identifies dependencies between sub-questions | Complex multi-faceted queries; often merged with Orchestrator role | High-capability                                |
| **Web Searcher / Source Finder**   | Executes search queries, evaluates result relevance, follows links, gathers raw source material           | Any research requiring external information                        | Medium-capability (Claude Sonnet, GPT-4o-mini) |
| **Document Reader / Analyzer**     | Deep-reads specific documents, extracts relevant passages, summarizes long content, handles PDFs          | When specific documents need detailed analysis                     | Medium-capability                              |
| **Domain Expert (simulated)**      | Provides perspective-specific analysis, asks domain-informed follow-up questions                          | Multi-perspective research (STORM's key innovation)                | Medium-to-high capability                      |
| **Fact Checker / Verifier**        | Cross-references claims against sources, identifies unsupported assertions, flags contradictions          | High-stakes or factual research; post-synthesis quality gate       | Medium-capability                              |
| **Synthesizer / Writer**           | Combines findings into coherent narrative, resolves organizational structure, maintains consistent voice  | Always -- produces final output; often merged with Orchestrator    | High-capability                                |
| **Critic / Quality Assessor**      | Evaluates draft output against criteria, identifies gaps, requests improvements                           | Quality-critical research; part of evaluator-optimizer loop        | Medium-to-high capability                      |
| **Citation Manager**               | Tracks source provenance, formats citations, verifies URLs remain accessible                              | Academic or reference-heavy research                               | Low-capability (tool-heavy, minimal reasoning) |
| **Visualization Agent**            | Generates charts, diagrams, data visualizations from research findings                                    | Data-driven research (used by Salesforce EDR)                      | Specialized                                    |

### Optimal Agent Count

Research converges on clear diminishing returns thresholds:

- **2-5 agents** is the production-tested sweet spot (Anthropic docs: "2-5
  teammates with 5-6 tasks per teammate")
- **Saturation threshold at ~4 agents** -- "below that number, adding agents to
  a structured system helps, but above it, coordination overhead consumes the
  benefits" (Towards Data Science analysis of Google/MIT paper)
- **Scaling homogeneous agents exhibits strong diminishing returns** -- accuracy
  improves at small counts but "marginal gain per additional agent rapidly
  collapses toward zero"
- **Diversity matters more than count** -- "diverse systems can outperform
  homogeneous ones even with substantially fewer agent calls"
- **Task-dependent**: parallelizable tasks see massive gains (+81% on
  Finance-Agent), while sequential tasks degrade (-70% on PlanCraft)

### Single-Model vs Multi-Model

The industry is converging on **heterogeneous model assignment**:

- **Orchestrator:** High-capability model (Claude Opus 4, GPT-4o/o3) -- needs
  planning, synthesis, judgment
- **Workers:** Cost-efficient model (Claude Sonnet 4, GPT-4o-mini) -- needs tool
  use, search, extraction
- **Simple tasks:** Cheapest available (Claude Haiku, GPT-4o-mini) -- routing,
  classification, citation formatting
- **Bayesian-optimized hybrid teams achieved 45.6-65.8% cost savings** over
  homogeneous baselines without significant accuracy loss (SmolAgents study)
- "In 2026, the most resilient AI systems will not be the ones using the most
  advanced models, but the ones that use many models intelligently"

---

## Coordination Mechanisms

### Context Sharing Patterns

| Pattern                | How It Works                                                               | Pros                                          | Cons                                      | Used By                                           |
| ---------------------- | -------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------- | ------------------------------------------------- |
| **Shared State Graph** | Centralized state object; all agents read/write to shared state nodes      | Single source of truth; easy to inspect       | Concurrency conflicts; state bloat        | LangGraph                                         |
| **Message Passing**    | Agents send structured messages; orchestrator routes                       | Clean separation; async-friendly              | Message format overhead; lost context     | AutoGen v0.4                                      |
| **Artifact Files**     | Agents write findings to shared files/documents                            | Persistent; survives agent restarts           | I/O bottleneck; merge conflicts           | Claude Code Agent Teams                           |
| **Memory Service**     | Centralized memory store with read/write API; access-controlled            | Survives context window limits; sharable      | Latency; requires explicit save/load      | Anthropic's LeadResearcher (saves plan to Memory) |
| **Prompt Injection**   | Orchestrator injects relevant context into each subagent's prompt          | Simple; subagent gets exactly what it needs   | Context window waste; orchestrator burden | CrewAI (plan injected into tasks)                 |
| **Dual Ledger**        | Task Ledger (facts, guesses, plan) + Progress Ledger (status, assignments) | Structured progress tracking; self-reflection | Added complexity; ledger maintenance cost | Microsoft Magentic-One                            |

### Work Division Strategies

1. **By subtopic:** Orchestrator decomposes query into sub-questions, each
   assigned to a worker. Most common pattern. Used by Anthropic, OpenAI,
   Salesforce EDR.
2. **By source type:** Different agents specialize in different source types
   (web, academic papers, code repos, social/professional networks). Used by
   Salesforce EDR (General, Academic, GitHub, LinkedIn search agents).
3. **By depth level:** Breadth agents scan many sources quickly; depth agents do
   deep analysis of the most promising sources. Natural fit for iterative
   research.
4. **By function:** Functional specialization (search vs. analyze vs. verify vs.
   write). Pipeline pattern. Used by STORM, MetaGPT.

### Conflict Resolution When Agents Disagree

- **Mediation agent:** A dedicated agent intervenes when contradictions are
  detected, evaluating evidence quality from each side.
- **Orthogonal reviewer panels:** Multiple critics with different incentive
  structures. Disagreements become signals for where more evidence is needed.
- **Majority voting with threshold:** Require quorum (e.g., 3 of 4 agents
  agree). Research shows quorum of 2-4 achieves ~98% accuracy.
- **Evidence-weighted resolution:** Orchestrator evaluates source quality and
  recency, favoring claims with stronger provenance.
- **Escalation to human:** When automated resolution fails, flag for human
  decision. Salesforce EDR's "steerable context engineering" enables real-time
  human guidance.

### Convergence Criteria

Determining when research is "done" remains an open problem. Current approaches:

1. **Knowledge gap closure:** Research terminates when the system detects that
   knowledge gaps identified during planning are resolved. Used by Salesforce
   EDR.
2. **Quality threshold:** A reflection/evaluation agent scores output quality;
   if score exceeds threshold, finalize. If not, iterate. Used by LangGraph's
   Reflection Pattern.
3. **Maximum iteration limit:** Hard cap on research rounds to prevent infinite
   loops. Essential safety mechanism. "Robust termination logic is still an open
   problem in MAS research."
4. **Consensus quorum:** Monitor detects that at least alpha agents agree on the
   same answer. Tradeoff: premature termination at low thresholds vs unnecessary
   cost at high thresholds.
5. **Diminishing information gain:** Track new information discovered per
   iteration; terminate when marginal gain drops below threshold.
6. **Budget exhaustion:** Stop when token/cost budget is consumed. Pragmatic but
   risks incomplete research.

---

## Academic Findings (2024-2026)

### Key Papers

| Paper                                                                                  | Authors/Source             | Year      | Key Finding                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------- | -------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **"Towards a Science of Scaling Agent Systems"**                                       | Google Research + MIT      | Dec 2025  | First quantitative scaling principles: tool-coordination tradeoff, capability saturation at ~45% baseline, topology-dependent error amplification (17.2x independent vs 4.4x centralized). Predictive framework covers 87% of configurations. |
| **"Why Do Multi-Agent LLM Systems Fail?" (MAST)**                                      | UC Berkeley (Cemri et al.) | Mar 2025  | First failure taxonomy from 1,642 traces across 7 frameworks. 14 failure modes in 3 categories. Coordination breakdown = 36.9% of failures. Failure rates: 41-86.7%.                                                                          |
| **"Improving Factuality and Reasoning through Multiagent Debate"**                     | Du et al. (ICML)           | 2024      | Multi-agent debate significantly improves mathematical reasoning and reduces factual hallucinations.                                                                                                                                          |
| **"MetaGPT: Meta Programming for Multi-Agent Collaborative Framework"**                | Hong et al. (ICLR Oral)    | 2024      | SOPs encoded as prompt sequences reduce errors in multi-agent collaboration. Assembly-line paradigm with structured output handoffs between roles.                                                                                            |
| **STORM / Co-STORM**                                                                   | Stanford OVAL              | 2024-2025 | Perspective-guided question asking + simulated conversation produces Wikipedia-quality articles. Multi-perspective research through simulated expert panels.                                                                                  |
| **"LLM-based Agents Suffer from Hallucinations"**                                      | arxiv 2509.18970           | 2025      | Comprehensive taxonomy of agent hallucination including communication hallucinations from inconsistent inter-agent connections.                                                                                                               |
| **"Adaptive Heterogeneous Multi-Agent Debate" (A-HMAD)**                               | Springer                   | 2025      | Heterogeneous agents with dynamic debate mechanisms outperform homogeneous majority-voting approaches.                                                                                                                                        |
| **"A Survey on LLM-based Multi-Agent System"**                                         | arxiv 2412.17481           | 2024      | Comprehensive survey: 5 components (profile, perception, self-action, mutual interaction, evolution). Multi-stage pipelines vs collective decision-making.                                                                                    |
| **"Understanding Agent Scaling via Diversity"**                                        | arxiv 2602.03794           | Feb 2026  | Diversity yields sustained improvements; homogeneous scaling hits diminishing returns fast.                                                                                                                                                   |
| **"Efficient Agents: Building Effective Agents While Reducing Cost"**                  | arxiv 2508.02694           | 2025      | Bayesian-optimized hybrid teams reduce costs 45.6-65.8% without accuracy loss.                                                                                                                                                                |
| **"Controlling Performance and Budget of Centralized Multi-agent LLM System with RL"** | arxiv 2511.02755           | 2025      | RL-based budget allocation for multi-agent systems. AgentBalance imposes explicit token-cost and latency budgets.                                                                                                                             |
| **"Memory as a Service (MaaS)"**                                                       | arxiv 2506.22815           | 2025      | Service-oriented memory modules for collaborative agents. Sessions, memory, and artifacts as structured state.                                                                                                                                |

### Survey-Level Insights

From the IJCAI 2024 survey and subsequent 2025 surveys:

- Multi-agent systems organize into four fundamental categories:
  reasoning-enhanced, tool-augmented, multi-agent collaborative, and
  memory-augmented agents.
- Five key components define LLM-based multi-agent systems: **profile** (role
  definition), **perception** (input processing), **self-action** (individual
  reasoning), **mutual interaction** (inter-agent communication), **evolution**
  (learning/adaptation).
- Fully connected communication topologies lead to "combinatorial explosion and
  privacy disclosure." Internet-like communication architecture (IOA) improves
  scalability.
- CoMAS enables autonomous agent co-evolution through intrinsic rewards from
  inter-agent discussions, optimized via reinforcement learning.

---

## Production Patterns

### Anthropic's Multi-Agent Research System

**Architecture:** Orchestrator-workers **Models:** Claude Opus 4 (lead) + Claude
Sonnet 4 (subagents) **Key design decisions:**

- LeadResearcher saves its plan to Memory to survive context window truncation
  (>200K tokens)
- Subagents operate independently with specific search tasks
- Prompt engineering was the highest-leverage optimization
- Parallelization reduced research time by up to 90%
- Result: 90.2% improvement over single-agent Claude Opus 4

**Lessons learned:**

- "Each subagent needs an objective, an output format, guidance on the tools and
  sources to use, and clear task boundaries"
- "Simple, short instructions often result in vague guidance that subagents
  misinterpret or duplicate"
- Small prompt phrasing changes made the difference between efficient research
  and wasted effort

**Reference:** https://www.anthropic.com/engineering/multi-agent-research-system

### Anthropic's Composable Patterns (from "Building Effective Agents")

Five foundational patterns, in order of complexity:

1. **Prompt Chaining:** Sequential steps, each processing previous output. Gate
   between steps.
2. **Routing:** Classify input, route to specialized handler.
3. **Parallelization:** Sectioning (independent subtasks) or Voting (same task,
   diverse outputs).
4. **Orchestrator-Workers:** Dynamic task decomposition and delegation.
5. **Evaluator-Optimizer:** Iterative improvement through feedback loops.

Core philosophy: "The most successful implementations weren't using complex
frameworks -- they were building with simple, composable patterns."

**Reference:** https://www.anthropic.com/research/building-effective-agents

### OpenAI Deep Research

**Architecture:** Modular multi-agent pipeline **Models:** o3-deep-research
(optimized for browsing), GPT-4o/4.1 for triage and clarification **Workflow:**

1. Intent clarification and scoping (GPT-4o/4.1)
2. Web grounding via Bing Search
3. Research execution with o3-deep-research (5-30 minutes)
4. Structured report with citations and reasoning path

**Key innovation:** Asynchronous research -- user submits query and gets
notified when complete. **Performance:** Searches/analyzes "hundreds of online
sources" per query.

**Reference:** https://openai.com/index/introducing-deep-research/

### Microsoft Magentic-One

**Architecture:** Hub-and-spoke with dual-ledger **Models:** GPT-4o (default,
model-agnostic) **Agents:** Orchestrator + WebSurfer + FileSurfer + Coder +
ComputerTerminal **Key innovation:** Task Ledger (facts, guesses, plan) +
Progress Ledger (current progress, agent assignments). Self-reflection at each
step.

**Reference:**
https://www.microsoft.com/en-us/research/articles/magentic-one-a-generalist-multi-agent-system-for-solving-complex-tasks/

### Salesforce Enterprise Deep Research (EDR)

**Architecture:** Orchestrator with specialized search agents + reflection
**Agents:** Master Planning Agent + General Search + Academic Search + GitHub
Search + LinkedIn Search + Visualization Agent **Key innovation:** "Steerable
context engineering" -- human-in-the-loop guidance during execution. Reflection
mechanism detects knowledge gaps. **Performance:** 71.57% win rate vs OpenAI
Deep Research, 9% lose rate. **Open-source:** Released October 2025 with EDR-200
dataset.

**Reference:** https://github.com/SalesforceAIResearch/enterprise-deep-research

### Stanford STORM

**Architecture:** Pipeline with simulated multi-perspective conversations
**Agents:** Wikipedia Writer + multiple simulated Topic Experts + Moderator
(Co-STORM) **Key innovation:** Perspective-guided question asking -- discovers
perspectives by surveying existing articles on similar topics. Simulated
conversation between writer and expert grounded in internet sources.
**Modules:** Knowledge Curation -> Outline Generation -> Article Generation ->
Article Polishing

**Reference:** https://github.com/stanford-oval/storm

### Claude Agent SDK Patterns

**Subagents:** Focused workers reporting back. Each gets one job; orchestrator
coordinates. **Agent Teams:** Experimental feature for Claude Code. One session
acts as team lead, teammates work independently. Production sweet spot: 2-5
teammates, 5-6 tasks each. **Key principles:**

- Give each subagent one job
- Orchestrator owns global planning, delegation, and state
- Start from deny-all security; allowlist only needed capabilities
- Capture OpenTelemetry traces across subagents

**Reference:** https://code.claude.com/docs/en/agent-teams

### Framework Comparison

| Framework            | Architecture              | Coordination                                 | Strengths                                                        | Limitations                                     |
| -------------------- | ------------------------- | -------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------- |
| **CrewAI**           | Role-based crews          | Sequential, Hierarchical, Custom             | Easy role definition; planning injection; delegation             | Higher-level abstraction limits fine control    |
| **LangGraph**        | Graph-based state machine | Shared state graph; conditional edges        | Fine-grained control; subgraphs for modularity; reflection loops | Steeper learning curve; manual state management |
| **AutoGen v0.4**     | Event-driven multi-agent  | Async messages; multiple orchestration modes | Flexible patterns; Magentic orchestration; OpenTelemetry         | Complexity of async event model                 |
| **Claude Agent SDK** | Subagent/Team model       | Prompt-based delegation; artifact sharing    | Native Claude integration; simple mental model                   | Experimental Teams feature; Claude-only         |
| **MetaGPT**          | SOP Assembly Line         | Structured document handoffs between roles   | Reduced errors through SOP encoding; clear role boundaries       | Designed for software dev, not general research |

---

## Failure Modes and Mitigations

### 1. Hallucination Propagation

**Problem:** One agent hallucinates a fact; downstream agents treat it as ground
truth and build on it. "A single root-cause failure can cascade into successive
errors, compounding degradation."

**Mitigations:**

- **Interleaved verification:** Agents assess validity after each step before
  propagation
- **Source grounding:** Every claim must link to a retrieved source (STORM's
  approach)
- **SelfCheckGPT:** Validate reasoning steps before execution
- **Orthogonal critics:** Multiple reviewers with different incentive structures
  catch different failure modes
- **Confidence scoring:** Agents report confidence; low-confidence claims
  flagged for verification

### 2. Research Loops (Non-Convergence)

**Problem:** Agents keep searching without converging. "Poor stop conditions
cause agents to continue running far beyond their useful window." MAST found
this is a major failure category.

**Mitigations:**

- **Hard iteration limits:** Maximum rounds per research phase
- **Diminishing gain detection:** Track information novelty per round; terminate
  when marginal gain drops
- **Budget caps:** Token/cost ceiling forces convergence
- **Quality threshold gates:** Evaluation agent must score output above
  threshold to proceed
- **Explicit termination criteria in agent prompts:** "Define conversation
  patterns and set termination conditions" (ChatDev approach)

### 3. Contradiction Handling

**Problem:** Different sources provide conflicting information. Agents may
silently adopt one version or oscillate between contradictory claims.

**Mitigations:**

- **Mediation agent:** Dedicated role to evaluate evidence quality on each side
- **Source quality weighting:** Prefer primary sources, peer-reviewed papers,
  official docs
- **Explicit contradiction surfacing:** Present both positions with evidence
  rather than silently resolving
- **Temporal precedence:** More recent sources may supersede older ones (with
  caveats)
- **Human escalation:** Flag unresolvable contradictions for user decision
  (EDR's steerable approach)

### 4. Coordination Breakdown

**Problem:** 36.9% of all multi-agent failures (MAST). Includes: agents
duplicating work, agents leaving gaps, information withholding, inability to
request additional information.

**Mitigations:**

- **Centralized orchestration:** Reduces error amplification from 17.2x to 4.4x
- **Detailed task specifications:** "Each subagent needs an objective, an output
  format, guidance on tools, and clear task boundaries"
- **Progress tracking:** Magentic-One's Progress Ledger pattern for
  self-reflection at each step
- **Plan visibility:** CrewAI injects overall plan into each agent's context
- **Role clarity:** "Weak role definitions become amplified in multi-agent
  contexts" (MAST)

### 5. Token/Cost Explosion

**Problem:** Multi-agent systems multiply API costs. Inter-agent communication
creates additional LLM calls. Context window duplication across agents.

**Mitigations:**

- **Model routing:** Simple tasks to cheap models, complex to expensive (45.6%
  cost reduction)
- **Token budgets per agent:** AgentBalance imposes explicit per-agent budgets
- **Prompt/response caching:** Identical requests served from cache
- **Context compression:** Summarize rather than pass full context between
  agents
- **Smart batching:** Combine multiple small requests
- **Cost monitoring:** Per-agent token tracking with dashboards (Grafana,
  Datadog, LLMOps platforms)

### 6. Echo Chamber / Groupthink

**Problem:** "When models share misconceptions" -- multiple agents converge on
the same wrong answer because they share underlying biases from similar training
data.

**Mitigations:**

- **Model diversity:** Use different model families across agents
- **Diversity-pruning:** Remove redundant agents that add no new perspective
- **Misconception-refutation:** Actively challenge consensus with devil's
  advocate agent
- **Independent research phases:** Agents research before seeing each other's
  results
- **Human-in-the-loop checkpoints:** Allow human to challenge emerging consensus

### 7. Context Window Exhaustion

**Problem:** Research accumulates information that exceeds agent context
windows. Truncation causes loss of critical context.

**Mitigations:**

- **Memory persistence:** Anthropic's LeadResearcher saves plan to Memory to
  survive truncation
- **Progressive summarization:** Compress earlier findings as new information
  arrives
- **Artifact-based handoffs:** Write intermediate results to files rather than
  passing in context
- **Hierarchical aggregation:** Subagents summarize before returning to
  orchestrator
- **Selective context loading:** Only load relevant prior findings for each
  subtask

---

## Design Recommendations for Our System

Based on the research, here are specific recommendations for a deep-research
skill:

### Architecture: Orchestrator-Workers with Reflection Loop

1. **Use hub-and-spoke as the primary pattern.** It dominates production for
   good reason: centralized error containment, natural parallelism, clear
   accountability.
2. **Add a reflection/evaluation loop.** LangGraph's pattern of routing through
   a quality assessor that either approves or sends back for iteration is
   well-validated.
3. **Do NOT use pure pipeline** for the overall flow. Google/MIT proved
   sequential multi-agent coordination degrades performance. Use pipeline only
   within individual agent tasks.

### Agent Roles (Minimum Viable Set)

For a research skill, start with 3-4 agents maximum:

1. **Lead Researcher (Orchestrator):** Decomposes query, assigns subtasks,
   synthesizes results, evaluates quality. Use highest-capability model.
2. **Research Workers (2-3 parallel):** Execute searches, read sources, extract
   relevant information. Use cost-efficient model. Specialize by subtopic, not
   by function.
3. **Critic/Verifier (optional but recommended):** Reviews synthesized output
   for gaps, contradictions, unsupported claims. Runs as final quality gate.

Avoid over-specialization. "The most successful implementations weren't using
complex frameworks -- they were building with simple, composable patterns."

### Coordination Design

1. **Prompt-based task specification:** Each subagent gets a detailed prompt
   with objective, output format, tool guidance, and task boundaries. This is
   the highest-leverage investment.
2. **Memory persistence:** Save the research plan and key findings to persistent
   memory to survive context window limits.
3. **Parallel execution:** Spawn subagents in parallel for independent
   subtopics. Anthropic achieved 90% latency reduction.
4. **Structured handoffs:** Subagents return findings in a consistent format
   (e.g., JSON with source URLs, confidence, key claims). Orchestrator doesn't
   need to parse free-form text.

### Convergence Strategy

Implement multiple convergence signals (logical OR for termination):

1. **Quality threshold:** Critic scores output above configurable threshold
2. **Knowledge gap closure:** All identified sub-questions have been addressed
3. **Hard limits:** Maximum iterations (e.g., 3 research rounds) and token
   budget
4. **Diminishing returns detection:** New information per round drops below
   threshold

### Cost Management

1. **Route by complexity:** Orchestrator = high-capability model; workers =
   cost-efficient model
2. **Set per-agent token budgets** to prevent runaway costs
3. **Cache aggressively** -- same search queries may recur across agents
4. **Monitor per-agent costs** for optimization feedback

### Failure Prevention

1. **Source grounding:** Every claim must cite a retrieved source
2. **Explicit contradiction handling:** Surface disagreements rather than
   silently resolving
3. **Centralized coordination:** Never use "bag of agents" -- always have an
   orchestrator
4. **Clear termination criteria** in every agent prompt
5. **Human escalation path** for unresolvable conflicts or low-confidence
   results

---

## Sources

### Academic Papers

- [A Survey on LLM-based Multi-Agent System (arxiv 2412.17481)](https://arxiv.org/abs/2412.17481)
- [Towards a Science of Scaling Agent Systems (Google/MIT, arxiv 2512.08296)](https://arxiv.org/abs/2512.08296)
- [Why Do Multi-Agent LLM Systems Fail? MAST (UC Berkeley, arxiv 2503.13657)](https://arxiv.org/abs/2503.13657)
- [MetaGPT: Meta Programming for Multi-Agent Collaborative Framework (ICLR 2024)](https://arxiv.org/abs/2308.00352)
- [Improving Factuality and Reasoning through Multiagent Debate (ICML 2024)](https://composable-models.github.io/llm_debate/)
- [LLM-based Agents Suffer from Hallucinations (arxiv 2509.18970)](https://arxiv.org/html/2509.18970v1)
- [Where LLM Agents Fail and How They Can Learn (arxiv 2509.25370)](https://arxiv.org/pdf/2509.25370)
- [Adaptive Heterogeneous Multi-Agent Debate (Springer 2025)](https://link.springer.com/article/10.1007/s44443-025-00353-3)
- [Can LLM Agents Really Debate? (arxiv 2511.07784)](https://arxiv.org/pdf/2511.07784)
- [FREE-MAD: Consensus-Free Multi-Agent Debate (arxiv 2509.11035)](https://arxiv.org/pdf/2509.11035)
- [Understanding Agent Scaling via Diversity (arxiv 2602.03794)](https://arxiv.org/html/2602.03794v1)
- [Efficient Agents: Building Effective Agents While Reducing Cost (arxiv 2508.02694)](https://arxiv.org/html/2508.02694v1)
- [Controlling Performance and Budget of Centralized Multi-agent LLM System (arxiv 2511.02755)](https://arxiv.org/html/2511.02755v1)
- [Memory as a Service for Collaborative Agents (arxiv 2506.22815)](https://arxiv.org/html/2506.22815v1)
- [Collaborative Memory: Multi-User Sharing with Access Control (arxiv 2505.18279)](https://arxiv.org/abs/2505.18279)
- [Enterprise Deep Research (Salesforce, arxiv 2510.17797)](https://arxiv.org/abs/2510.17797)
- [Single-agent or Multi-agent Systems? Why Not Both? (arxiv 2505.18286)](https://arxiv.org/html/2505.18286v1)
- [Reaching Agreement Among Reasoning LLM Agents (arxiv 2512.20184)](https://arxiv.org/pdf/2512.20184)
- [Multi-Agent LLM Debate with Adaptive Stability Detection (arxiv 2510.12697)](https://arxiv.org/html/2510.12697v1)

### Production System References

- [Anthropic: How We Built Our Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Anthropic: Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
- [OpenAI: Introducing Deep Research](https://openai.com/index/introducing-deep-research/)
- [Microsoft Magentic-One](https://www.microsoft.com/en-us/research/articles/magentic-one-a-generalist-multi-agent-system-for-solving-complex-tasks/)
- [Salesforce Enterprise Deep Research (GitHub)](https://github.com/SalesforceAIResearch/enterprise-deep-research)
- [Stanford STORM (GitHub)](https://github.com/stanford-oval/storm)
- [Google: Towards a Science of Scaling Agent Systems (Blog)](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/)

### Framework Documentation

- [CrewAI Collaboration Docs](https://docs.crewai.com/en/concepts/collaboration)
- [LangGraph Multi-Agent Tutorial](https://langchain-ai.github.io/langgraph/tutorials/multi_agent/multi-agent-collaboration/)
- [AutoGen Multi-Agent Framework](https://microsoft.github.io/autogen/0.2/docs/Use-Cases/agent_chat/)
- [Claude Code Agent Teams Docs](https://code.claude.com/docs/en/agent-teams)
- [Claude Agent SDK Best Practices](https://skywork.ai/blog/claude-agent-sdk-best-practices-ai-agents-2025/)

### Analysis Articles

- [Why Your Multi-Agent System is Failing: The 17x Error Trap (Towards Data Science)](https://towardsdatascience.com/why-your-multi-agent-system-is-failing-escaping-the-17x-error-trap-of-the-bag-of-agents/)
- [The Multi-Agent Trap (Towards Data Science)](https://towardsdatascience.com/the-multi-agent-trap/)
- [Multi-Agent LLM Systems: 7 Failure Modes in Production (TechAhead)](https://www.techaheadcorp.com/blog/ways-multi-agent-ai-fails-in-production/)
- [Google Publishes Scaling Principles (InfoQ)](https://www.infoq.com/news/2026/03/google-multi-agent/)
- [How OpenAI, Gemini, and Claude Use Agents for Deep Research (ByteByteGo)](https://blog.bytebytego.com/p/how-openai-gemini-and-claude-use)
- [Shipyard: Multi-Agent Orchestration for Claude Code](https://shipyard.build/blog/claude-code-multi-agent/)
