# Findings: Multi-Agent Orchestration Patterns — Academic, Framework, and Production Evidence

**Searcher:** deep-research-searcher **Profile:** academic + docs **Date:**
2026-03-29 **Sub-Question IDs:** SQ2 (Part B)

---

## Key Findings

### 1. MAST: The First Rigorous Failure Taxonomy for Multi-Agent Systems [CONFIDENCE: HIGH]

The UC Berkeley Sky Computing Lab published "Why Do Multi-Agent LLM Systems
Fail?" (arXiv:2503.13657, March 2025), presenting the Multi-Agent System Failure
Taxonomy (MAST) — the first systematic study of MAS failure modes.

**Methodology:** 1,600+ annotated traces from 7 MAS frameworks (GPT-4, Claude 3,
Qwen 2.5, CodeLlama). Grounded Theory analysis of 150 expert-annotated traces.
Inter-annotator agreement: Cohen's Kappa = 0.88 (high). LLM-as-judge validation:
kappa = 0.77–0.79.

**14 failure modes in 3 categories:**

| Category                           | % of Failures | Failure Modes                                                                                                                                                                          |
| ---------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FC1: Specification & System Design | 41.77%        | Task spec violation (10.98%), step repetition (17.14%), history loss (3.33%), stopping condition unawareness (9.82%), role spec violation (0.5%)                                       |
| FC2: Inter-Agent Misalignment      | 36.94%        | Fail to ask for clarification (11.65%), reasoning-action mismatch (13.98%), task derailment (7.15%), info withholding (1.66%), conversation reset (2.33%), ignored agent input (0.17%) |
| FC3: Task Verification             | 21.30%        | Premature termination (7.82%), no/incomplete verification (6.82%), incorrect verification (6.66%)                                                                                      |

**Key insight:** The largest single failure modes are step repetition (17.14%)
and reasoning-action mismatch (13.98%). Together with failure-to-clarify
(11.65%), these three account for ~43% of all failures — all treatable through
architectural design rather than model improvements.

**Implication for custom agents:** Inter-agent misalignment failures (36.94%)
are the second-largest category, confirming that verification/checker agents and
explicit clarification protocols are high-ROI mitigations. The MAST paper
explicitly states failures require "more sophisticated system designs" rather
than better individual models.

Sources: [arXiv:2503.13657](https://arxiv.org/abs/2503.13657),
[HTML version](https://arxiv.org/html/2503.13657v2),
[Sky Lab project page](https://sky.cs.berkeley.edu/project/mast/)

---

### 2. Google/MIT Scaling Study: Task Type Determines Optimal Topology [CONFIDENCE: HIGH]

arXiv:2512.08296 (Google Research + MIT, December 2024). The companion D2 agent
identified this paper. This study quantified when multi-agent systems help vs.
hurt.

**Quantitative results:**

| Task Type                        | Best Architecture         | Performance Delta                 |
| -------------------------------- | ------------------------- | --------------------------------- |
| Finance-Agent (parallelizable)   | Centralized hub-and-spoke | +80.9% over single agent          |
| PlanCraft (sequential reasoning) | Single Agent              | Multi-agent degraded -39% to -70% |

**Topologies evaluated:** Independent, Centralized, Decentralized, Hierarchical,
Hybrid

**Error amplification finding:**

- Centralized topology contained error amplification to **4.4x**
- Independent ("bag of agents") amplified errors to **17.2x**

This is the source of the "17x error trap" referenced in practitioner
literature.

**Predictive model:** The research achieved 87% accuracy predicting optimal
architecture for unseen tasks using properties like tool count and task
decomposability (R² = 0.513).

**Key law:** "Coordination Tax" — accuracy gains saturate or fluctuate beyond 4
agents in most configurations. Adding agents buys parallel work OR communication
overhead, never both.

Sources:
[Google Research blog](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/),
[arXiv:2512.08296](https://arxiv.org/html/2512.08296v1)

---

### 3. Multi-Agent Debate (MAD): Effective Under Specific Conditions, Unreliable as Default [CONFIDENCE: HIGH]

Multiple 2024-2025 papers converge on this conclusion: MAD is not a reliable
general-purpose accuracy booster — it requires careful design to work.

**Original MAD (arXiv:2305.14325, Du et al., 2023):** Multiple agents propose
and debate over rounds. Showed improvements for mathematical and strategic
reasoning, and factuality. However, exact gains were not quantified in the
abstract; follow-up studies revealed limitations.

**"Can LLM Agents Really Debate?" (arXiv:2511.07784, November 2025):**
Controlled study using Knight-Knave-Spy logic puzzles with verifiable ground
truth. Key findings:

- **Sycophancy is the core failure mode:** Majority pressure suppresses
  independent correct reasoning
- **Group diversity and intrinsic reasoning strength are dominant success
  drivers** — structural parameters (debate order, confidence visibility)
  provide "limited gains"
- Teams can "overturn incorrect consensus" but only with sufficient diversity
- Standard debate prompts like "responses from other agents are as follows" bias
  toward majority conformity

**Free-MAD (arXiv:2509.11035, September 2025):** Addresses conformity directly
with anti-conformity prompting and score-based decision mechanism. Results:

- Average improvements of **13.0% and 16.5%** over baselines across 8 benchmarks
- Single-round operation achieves accuracy comparable to 2-round standard MAD
- Under communication attacks: standard MAD accuracy dropped up to 20%; Free-MAD
  maintained performance
- Token complexity advantage: O(NR²V) vs. standard approaches at 2-3x token cost

**iMAD (arXiv:2511.11306, November 2025):** Intelligent selective triggering —
use debate ONLY when single-agent shows uncertainty signals.

- Reduces token usage by up to **92%** versus always-on debate
- Improves accuracy by up to **13.5%** over single-agent baseline
- Uses 41 linguistic/semantic features from self-critique to detect when debate
  helps
- Avoids "overturn correct answer" failure mode that degrades standard MAD

**M3MAD-Bench (arXiv:2601.02854, January 2026):** Cross-domain, cross-modality
evaluation shows debate effectiveness varies by domain. "MAD could be harmful
rather than helpful" in certain conditions.

**Bottom line on adversarial/debate patterns for custom agents:**

- Free debate = unreliable (sycophancy degrades quality)
- Structured anti-conformity debate (Free-MAD approach) = 13-16% improvements
- Selective/intelligent debate triggering (iMAD approach) = best efficiency
- Agent diversity matters more than structural parameters
- Debate adds 3-5x token cost unless using selective triggering

Sources: [arXiv:2305.14325](https://arxiv.org/abs/2305.14325),
[arXiv:2511.07784](https://arxiv.org/abs/2511.07784),
[arXiv:2509.11035](https://arxiv.org/html/2509.11035v1),
[arXiv:2511.11306](https://arxiv.org/abs/2511.11306),
[arXiv:2601.02854](https://arxiv.org/html/2601.02854v1)

---

### 4. Verification-Driven Orchestration: VMAO Framework [CONFIDENCE: HIGH]

arXiv:2603.11445, "Verified Multi-Agent Orchestration: A
Plan-Execute-Verify-Replan Framework." Tests on 25 expert-curated market
research queries.

**Architecture:** QueryPlanner → DAGExecutor (parallel, dependency-aware) →
ResultVerifier → AdaptiveReplanner → Synthesizer

**Quantitative results vs. single-agent baseline:**

| Metric         | Single-Agent | VMAO  | Improvement |
| -------------- | ------------ | ----- | ----------- |
| Completeness   | 3.1/5        | 4.2/5 | +35%        |
| Source Quality | 2.6/5        | 4.1/5 | +58%        |
| Token usage    | 100K         | 850K  | 8.5x cost   |

**Stop conditions to manage cost:** 80% completeness threshold, diminishing
returns check (<5% improvement), token budget (1M tokens), max iterations (3).
Over 75% of queries terminate via resource constraints.

**Acknowledged limitation:** "LLM-based verification may miss subtle factual
errors or hallucinations, as it evaluates completeness rather than accuracy."
The verifier is a soundness check, not a correctness guarantee.

**Key insight for custom agents:** The verify-replan loop is the critical
differentiator. Verification without adaptive replanning is incomplete — gaps
must trigger fresh subtask generation, not just flagging.

Sources: [arXiv:2603.11445](https://arxiv.org/html/2603.11445)

---

### 5. Heterogeneous Agent Teams Outperform Homogeneous Teams [CONFIDENCE: HIGH]

**X-MAS (arXiv:2505.16997, May 2025):** Study of 27 LLMs across 5 domains and 5
MAS functions with 1.7 million evaluations. Key finding: mixing chatbot-style
and reasoning-style models produces dramatic gains.

**Quantitative results:**

| Configuration                  | Benchmark         | Result                        |
| ------------------------------ | ----------------- | ----------------------------- |
| Homogeneous chatbot            | AIME-2024 (DyLAN) | 40%                           |
| Heterogeneous chatbot+reasoner | AIME-2024 (DyLAN) | 63% (+23pp)                   |
| Heterogeneous X-MAS-Proto      | AIME-2024         | 70%                           |
| Chatbot-only baseline          | MATH dataset      | Baseline                      |
| Heterogeneous chatbot-only     | MATH dataset      | +8.4%                         |
| On AIME-2025 and new MATH-MAS  | Heterogeneous     | +33-34% over best homogeneous |

**Key finding:** No single LLM excels across all scenarios. Individual models
show large performance disparities within identical function-domain pairs.
Smaller models sometimes outperform larger ones in specialized tasks.

**Implication for custom agents:** Do not assume one model type for all roles.
Using a reasoning-optimized model for verification/critique tasks while a
chatbot-style model handles synthesis may yield 20-40% accuracy gains at similar
cost.

Sources: [arXiv:2505.16997](https://arxiv.org/abs/2505.16997),
[HTML version](https://arxiv.org/html/2505.16997v1)

---

### 6. AgentArch Benchmark: Single-Agent Often Wins on Simple Tasks, Multi-Agent on Complex Decisions [CONFIDENCE: HIGH]

**AgentArch (arXiv:2509.10769, ServiceNow, September 2025):** 18 architectural
configurations across 6 LLMs, tested on enterprise workflows (simple
8-tool/3-agent task vs. complex 31-tool/9-agent task).

**Peak performance:**

- Simple task (Time Off request): GPT-4.1, single-agent function calling with
  summarized memory + thinking tools = **70.8% success**
- Complex task (Customer Routing): Claude Sonnet 4, single-agent function
  calling = **35.3% success**

**Multi-agent paradox:**

- Single-agent achieved highest overall task completion scores
- Multi-agent produced **superior final decision accuracy**: GPT-4.1 reached
  97-99% correct decisions (multi-agent) vs. 79-86% (single-agent) on complex
  tasks
- Interpretation: use single-agent for throughput, multi-agent for outcome
  quality

**Critical findings:**

- **Function calling consistently beats ReAct** across all models and
  configurations
- **Multi-agent ReAct is worst combination** across all models
- **No universal best architecture** — must test against specific use case
- **Reliability gap:** Maximum pass@8 = only 6.34%, indicating production
  deployment remains fragile
- Thinking tools helped non-reasoning models on simple tasks, minimal benefit on
  complex

Sources: [arXiv:2509.10769](https://arxiv.org/abs/2509.10769),
[ServiceNow/AgentArch GitHub](https://github.com/ServiceNow/AgentArch)

---

### 7. Financial Document Processing Benchmark: Hierarchical Architecture at Pareto Frontier [CONFIDENCE: HIGH]

**arXiv:2603.22651, "Benchmarking Multi-Agent LLM Architectures for Financial
Document Processing."** 10,000 SEC filings, 25 field types, 4 architectures.

**Results:**

| Architecture                     | F1 Score               | Cost vs. Sequential |
| -------------------------------- | ---------------------- | ------------------- |
| Sequential pipeline              | Baseline               | 1x                  |
| Reflexive (self-correcting loop) | 0.943                  | 2.3x                |
| Hierarchical supervisor-worker   | 0.921                  | 1.4x                |
| Hybrid (strategic combo)         | 89% of reflexive gains | 1.15x               |

**Hierarchical is the Pareto-efficient choice:** 0.921 F1 at only 1.4x cost,
compared to reflexive at 0.943 but 2.3x cost.

**Hybrid recommendation:** Strategic combination of architectures recovers 89%
of the reflexive accuracy gains at only 1.15x baseline cost.

**Scaling finding:** At 1,000 to 100,000 documents/day, non-obvious
throughput-accuracy degradation curves appear — production scale reveals
different bottlenecks than lab benchmarks.

Sources: [arXiv:2603.22651](https://arxiv.org/html/2603.22651)

---

### 8. Anthropic's Multi-Agent Research System: Production Architecture and Lessons [CONFIDENCE: HIGH]

Anthropic engineering blog (March 2025): "How we built our multi-agent research
system." Describes production deployment of a LeadResearcher + parallel
Subagent + CitationAgent system.

**Architecture:**

- Lead Agent (Claude Opus 4): strategy, decomposition, synthesis, orchestration
- Subagents (Claude Sonnet 4): parallel information gathering with isolated
  context windows
- CitationAgent: source attribution and verification
- External memory for plan persistence (prevents context overflow truncation)

**Performance metrics:**

- **90.2% improvement** over single-agent Claude Opus 4 on breadth-first queries
- Agents use ~4x more tokens than chat; multi-agent uses ~15x more than standard
  chat
- **95% of variance** explained by token usage (80%), tool calls, and model
  choice
- Up to **90% reduction in research time** through parallelization

**Critical lessons from production:**

1. "Game of telephone" failure: subagents passing everything through
   orchestrator context = collapse. Fix: subagents write to external memory
   directly.
2. Simple scaling heuristics in prompts: 1-agent for fact-finding, 2-4 subagents
   for comparisons, 10+ for complex research
3. "Extended thinking improved instruction-following, reasoning, and efficiency"
4. Non-determinism complicates debugging — requires production tracing
   infrastructure
5. Rainbow deployments for zero-downtime version transitions

**Economic viability threshold:** Multi-agent systems require "valuable tasks
that involve heavy parallelization, information that exceeds single context
windows, and interfacing with numerous complex tools" to justify 15x token
overhead.

Sources:
[Anthropic Engineering Blog](https://www.anthropic.com/engineering/multi-agent-research-system)

---

### 9. Anthropic "Building Effective Agents": The 5-Pattern Taxonomy [CONFIDENCE: HIGH]

Anthropic's foundational guide (2024) remains the most-cited framework taxonomy
for practitioners.

**5 core workflow patterns:**

| Pattern              | Best For                                     | When to Use                                   |
| -------------------- | -------------------------------------------- | --------------------------------------------- |
| Prompt Chaining      | Sequential, predictable tasks                | Quality gates between steps                   |
| Routing              | Task classification and specialization       | Distinct input categories                     |
| Parallelization      | Independent subtasks                         | Sectioning (parallel) or Voting (confidence)  |
| Orchestrator-Workers | Complex tasks with unknown subtask structure | Coding multi-file, adaptive search            |
| Evaluator-Optimizer  | Iterative refinement                         | When feedback can demonstrably improve output |

**Explicit anti-recommendation:** "Finding the simplest solution possible, and
only increasing complexity when needed... optimizing single LLM calls with
retrieval and in-context examples is usually enough." This is the official
position against default multi-agent adoption.

**Failure modes to avoid:**

- Framework abstraction that obscures prompts/responses
- Premature complexity without measurable improvement
- Poor tool documentation as root cause of agent confusion

Sources:
[Anthropic Research](https://www.anthropic.com/research/building-effective-agents)

---

### 10. Production Deployment Post-Mortems: What Actually Fails [CONFIDENCE: HIGH]

**ZenML study of 1,200 production LLM deployments (2025):**

**GetOnStack cost explosion (real incident):** Agent A requested help from Agent
B, which asked Agent A for clarification — recursive loop. Ran undetected for
**11 days**. Cost escalated from **$127/week to $47,000/week**. Required 6 weeks
of infrastructure investment in message queues and circuit breakers afterward.

**Manus "context rot":** Context degradation begins between **50k-150k tokens**
regardless of theoretical maximum. Leaner contexts produce more reliable
outputs.

**Shopify tool complexity:** Scaling from 20 to 50+ overlapping tools created
severe problems. "Tool outputs consume 100x more tokens than user messages."

**Zalando Surface Attribution Error:** Agent blamed technology mentioned in text
rather than actual root cause. Demonstrates reasoning hallucination compounds at
the orchestration level, not just LLM inference level.

**Success patterns from 1,200 deployments:**

- **Durable execution infrastructure** (Temporal/durable functions for agent
  resume, not restart)
- **Architectural constraints over model intelligence** (Stripe DAG rails vs.
  general-purpose planning)
- **Circuit breakers** (Cox Automotive auto-halts at P95 cost threshold or
  conversation turn limit)
- **Just-in-time context injection** (Shopify collocates tool instructions with
  outputs, not upfront loading)

**Cost optimization data points:**

- Care Access: 86% cost reduction through prompt caching
- Riskspan: 90x cost reduction per deal ($50 target)
- PGA Tour: 95% cost reduction for article generation ($0.25/article)

Sources:
[ZenML 1200 Production Deployments](https://www.zenml.io/blog/what-1200-production-deployments-reveal-about-llmops-in-2025),
[ZenML 457 Case Studies](https://www.zenml.io/blog/llmops-in-production-457-case-studies-of-what-actually-works)

---

### 11. Enterprise Harness Pattern: Stripe, Shopify, Airbnb Production Architectures [CONFIDENCE: MEDIUM-HIGH]

From MindStudio analysis of public engineering disclosures (2025). These are
reconstructed from blog posts and talks, not direct case studies.

**Common harness architecture:**

1. Structured context management (relevant-only, never full codebase)
2. Tool calling infrastructure with permissions, rate limits, retry handling
3. Output validation: syntactic + semantic + domain-specific checks
4. Orchestration with specialized sub-agents for bounded tasks

**Stripe:** Documentation as authoritative context source. Validation criteria
established before generation. Narrowly scoped agents.

**Shopify:** Multi-agent orchestrator → specialized sub-agents (catalog, theme,
storefront). Automated eval pipelines scoring against ground truth. Regression
testing on prompt changes.

**Airbnb:** Classification → context extraction → transformation → validation →
review queue. Second failure triggers human escalation (not retry).

**Universal pattern:** "AI generates candidates and the system filters for valid
ones" — generation and validation are separate system responsibilities, not
combined in a single model call.

Sources:
[MindStudio enterprise analysis](https://www.mindstudio.ai/blog/ai-coding-agent-harness-stripe-shopify-airbnb)

---

### 12. CrewAI Framework: Hierarchical vs. Sequential Process Details [CONFIDENCE: HIGH]

From Context7 (official CrewAI documentation, high trust source).

**Sequential Process:** Tasks execute in order. No central coordinator. Agents
work autonomously without cross-agent visibility.

**Hierarchical Process:** Manager agent (auto-created from manager_llm, or
user-defined) dynamically allocates tasks based on agent capabilities. Tasks not
pre-assigned — manager reviews outputs and validates completion. Requires:
`process=Process.hierarchical` + `manager_llm` or `manager_agent`.

**Key design difference:** In hierarchical mode, the manager can reassign tasks
mid-execution and validate outputs before marking complete. Sequential mode has
no validation gate.

**When to use hierarchical:** Complex workflows requiring output validation,
dynamic task allocation, quality gates. Cost: additional LLM calls for manager
decisions.

Sources: [CrewAI Processes Docs](https://docs.crewai.com/en/concepts/processes),
[CrewAI Hierarchical Docs](https://docs.crewai.com/en/learn/hierarchical-process),
Context7 (/websites/crewai_en)

---

### 13. LangGraph: State Machine Architecture with Human-in-the-Loop as First-Class Feature [CONFIDENCE: HIGH]

LangGraph represents agents as state machines: nodes do work, edges define
transitions, state tracks everything, conditional edges route based on state.

**Human-in-the-loop (HITL) pattern:**

- `interrupt()` function pauses execution at any node
- State is checkpointed (PostgreSQL/SQLite) for resume capability
- Graph resumes from checkpoint, not from start
- Production pattern: interrupt before irreversible actions (DB deletions,
  financial transactions, deployments)

**Multi-agent capabilities:** Hierarchical, peer-to-peer, and hybrid multi-agent
workflows all expressible as state graphs. Subgraph composition allows packaging
entire workflows as single agent nodes.

**Production readiness signals:**

- Persistence as first-class feature (all implementations)
- Temporal-like resume semantics (agents survive restarts)
- Explicit interrupt/approve pattern matches enterprise governance requirements

Sources:
[LangGraph Human-in-the-Loop](https://www.baihezi.com/mirrors/langgraph/how-tos/human-in-the-loop/index.html),
[LangChain Blog on interrupt()](https://blog.langchain.com/making-it-easier-to-build-human-in-the-loop-agents-with-interrupt/)

---

### 14. Microsoft Magentic-One: Generalist Multi-Agent Architecture [CONFIDENCE: HIGH]

Published November 2024 by Microsoft Research. Architecture: Orchestrator + 4
specialized agents.

**Agents:**

- Orchestrator: plans, tracks progress, re-plans on errors
- WebSurfer: navigation, search, page interaction
- FileSurfer: local file browsing via markdown preview
- Coder: code writing and analysis
- ComputerTerminal: code execution and library installation

**Design principles:**

- Orchestrator does NOT perform tasks — only coordinates
- Specialized agents have no knowledge of each other's existence
- Re-planning on error is built into the Orchestrator loop
- Model-agnostic (default GPT-4o, but any model per agent)

**Performance:** Statistically competitive on GAIA, AssistantBench, and WebArena
benchmarks without architecture modifications.

**Architectural lesson:** Strict separation between planning (Orchestrator) and
execution (specialists) — the Orchestrator "remains responsible for tracking
progress, directing agents and determining when the task has been completed or
has failed."

Sources:
[Microsoft Research article](https://www.microsoft.com/en-us/research/articles/magentic-one-a-generalist-multi-agent-system-for-solving-complex-tasks/),
[AutoGen Magentic-One docs](https://microsoft.github.io/autogen/stable//user-guide/agentchat-user-guide/magentic-one.html)

---

### 15. AutoGen Conversation Patterns: 4 Core Patterns Including Nested Chat [CONFIDENCE: HIGH]

Microsoft AutoGen (original paper arXiv:2308.08155, ongoing framework).

**4 core conversation patterns:**

1. **Two-agent chat:** Simple turn-taking between two ConversableAgents
2. **Sequential chat:** Chain of agent pairs, each building on previous outputs
3. **Group chat:** 3+ agents sharing single conversation thread and context
4. **Nested chat:** Packages workflow as single agent node, enables hierarchical
   composition and "information silos"

**Nested chat mechanics:** Powered by ConversableAgent's `nested_chats_handler`
(pluggable component). Triggers sub-workflows on message receipt. Nested agents
operate independently with no access to outer conversation.

**Group chat dynamics:** All agents share context — good for collaborative
synthesis, problematic for tasks requiring agent independence (sycophancy risk).

Sources:
[AutoGen Conversation Patterns](https://microsoft.github.io/autogen/0.2/docs/tutorial/conversation-patterns/),
[AutoGen Multi-agent Framework](https://microsoft.github.io/autogen/0.2/docs/Use-Cases/agent_chat/)

---

### 16. AgentErrorTaxonomy: Cascading Failure Mechanism and Recovery [CONFIDENCE: HIGH]

arXiv:2509.25370 "Where LLM Agents Fail and How They Can Learn From Failures"
(September 2025).

**AgentErrorTaxonomy:** 5-dimension classification: memory, reflection,
planning, action, system-level operations.

**Cascading failure mechanism:** "A single root-cause error propagates through
subsequent decisions, leading to task failure." Root cause ≠ point of failure —
they are separated by cascading intermediary steps.

**AgentDebug recovery system:** Isolates root-cause failures, provides targeted
corrective feedback, enables iterative recovery.

**Quantitative improvements from targeted recovery:**

- 24% higher accuracy for complete task success
- 17% improvement in step-level accuracy
- Up to 26% relative improvement in task completion across ALFWorld, GAIA,
  WebShop

**Implication:** Checker/verifier agents need root-cause detection capability,
not just output validation. Validating the final output without understanding
which step failed misses the cascading source.

Sources: [arXiv:2509.25370](https://arxiv.org/abs/2509.25370)

---

### 17. Claude Agent SDK: Feedback Loop and Context Isolation Patterns [CONFIDENCE: HIGH]

From the Claude Agent SDK engineering blog (2025).

**Core agent loop:** Gather context → Take action → Verify work → Repeat.

**Context management for subagents:**

- Subagents use **isolated context windows**
- Only "relevant information" sent back to orchestrator (not full subagent
  context)
- Automatic compaction when approaching limits

**Verification strategy hierarchy:**

1. Rules-based feedback (highest value): "clearly defined rules for output, then
   explaining which rules failed and why"
2. Visual feedback: screenshots/renders for UI tasks
3. LLM-as-judge: higher latency, useful for fuzzy/subjective requirements

**Context gathering hierarchy:**

1. Agentic search (dynamic, relevant-only loading)
2. Semantic search (secondary: faster but less accurate)
3. Subagents for parallelization

**Production guidance:** Scaling rules embedded in system prompts (1 agent for
simple, 2-4 for comparisons, 10+ for complex research). This is the same
heuristic Anthropic uses in their own production research system.

Sources:
[Claude Agent SDK Blog](https://claude.com/blog/building-agents-with-the-claude-agent-sdk),
[Anthropic Research System Blog](https://www.anthropic.com/engineering/multi-agent-research-system)

---

## Sources

| #   | URL                                                                                                                       | Title                                                     | Type                      | Trust       | CRAAP | Date     |
| --- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------- | ----------- | ----- | -------- |
| 1   | https://arxiv.org/abs/2503.13657                                                                                          | Why Do Multi-Agent LLM Systems Fail? (MAST)               | Peer-reviewed preprint    | HIGH        | 4.8   | Mar 2025 |
| 2   | https://arxiv.org/html/2503.13657v2                                                                                       | MAST HTML with quantitative data                          | Peer-reviewed preprint    | HIGH        | 4.8   | Mar 2025 |
| 3   | https://arxiv.org/html/2512.08296v1                                                                                       | Towards a Science of Scaling Agent Systems                | Peer-reviewed preprint    | HIGH        | 4.8   | Dec 2024 |
| 4   | https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/                  | Google Research Blog: Scaling Agent Systems               | Official research         | HIGH        | 4.6   | Dec 2024 |
| 5   | https://arxiv.org/abs/2511.07784                                                                                          | Can LLM Agents Really Debate?                             | Peer-reviewed preprint    | HIGH        | 4.7   | Nov 2025 |
| 6   | https://arxiv.org/html/2509.11035v1                                                                                       | Free-MAD: Consensus-Free Multi-Agent Debate               | Peer-reviewed preprint    | HIGH        | 4.7   | Sep 2025 |
| 7   | https://arxiv.org/abs/2511.11306                                                                                          | iMAD: Intelligent Multi-Agent Debate                      | Peer-reviewed preprint    | HIGH        | 4.7   | Nov 2025 |
| 8   | https://arxiv.org/html/2601.02854v1                                                                                       | M3MAD-Bench: Multi-Agent Debate Effectiveness             | Peer-reviewed preprint    | HIGH        | 4.6   | Jan 2026 |
| 9   | https://arxiv.org/abs/2305.14325                                                                                          | Improving Factuality via Multiagent Debate (original MAD) | Peer-reviewed preprint    | HIGH        | 4.0   | May 2023 |
| 10  | https://arxiv.org/html/2603.11445                                                                                         | VMAO: Verified Multi-Agent Orchestration                  | Peer-reviewed preprint    | HIGH        | 4.8   | Mar 2026 |
| 11  | https://arxiv.org/abs/2505.16997                                                                                          | X-MAS: Heterogeneous LLM Multi-Agent Systems              | Peer-reviewed preprint    | HIGH        | 4.8   | May 2025 |
| 12  | https://arxiv.org/abs/2509.10769                                                                                          | AgentArch: Enterprise Agent Architecture Benchmark        | Peer-reviewed preprint    | HIGH        | 4.7   | Sep 2025 |
| 13  | https://arxiv.org/html/2603.22651                                                                                         | Benchmarking Multi-Agent for Financial Docs               | Peer-reviewed preprint    | HIGH        | 4.8   | Mar 2026 |
| 14  | https://www.anthropic.com/engineering/multi-agent-research-system                                                         | How We Built Our Multi-Agent Research System              | Official engineering blog | HIGH        | 4.8   | 2025     |
| 15  | https://www.anthropic.com/research/building-effective-agents                                                              | Building Effective Agents (Anthropic)                     | Official docs/guide       | HIGH        | 4.7   | 2024     |
| 16  | https://claude.com/blog/building-agents-with-the-claude-agent-sdk                                                         | Building Agents with Claude Agent SDK                     | Official engineering blog | HIGH        | 4.7   | 2025     |
| 17  | https://www.zenml.io/blog/what-1200-production-deployments-reveal-about-llmops-in-2025                                    | 1200 Production Deployments LLMOps Study                  | Industry research         | MEDIUM-HIGH | 4.2   | 2025     |
| 18  | https://www.zenml.io/blog/llmops-in-production-457-case-studies-of-what-actually-works                                    | 457 LLMOps Case Studies                                   | Industry research         | MEDIUM-HIGH | 4.2   | 2025     |
| 19  | https://arxiv.org/abs/2509.25370                                                                                          | Where LLM Agents Fail and How They Learn                  | Peer-reviewed preprint    | HIGH        | 4.7   | Sep 2025 |
| 20  | https://docs.crewai.com/en/concepts/processes                                                                             | CrewAI Processes Documentation                            | Official docs             | HIGH        | 4.9   | 2025     |
| 21  | https://docs.crewai.com/en/learn/hierarchical-process                                                                     | CrewAI Hierarchical Process                               | Official docs             | HIGH        | 4.9   | 2025     |
| 22  | https://www.microsoft.com/en-us/research/articles/magentic-one-a-generalist-multi-agent-system-for-solving-complex-tasks/ | Magentic-One: Generalist Multi-Agent System               | Official research         | HIGH        | 4.8   | Nov 2024 |
| 23  | https://microsoft.github.io/autogen/0.2/docs/tutorial/conversation-patterns/                                              | AutoGen Conversation Patterns                             | Official docs             | HIGH        | 4.8   | 2025     |
| 24  | https://www.mindstudio.ai/blog/ai-coding-agent-harness-stripe-shopify-airbnb                                              | Enterprise Agent Harness (Stripe/Shopify/Airbnb)          | Industry analysis         | MEDIUM      | 3.8   | 2025     |
| 25  | https://github.com/ServiceNow/AgentArch                                                                                   | AgentArch GitHub Code                                     | Open-source code          | HIGH        | 4.7   | 2025     |

---

## Contradictions

**Contradiction 1: Multi-agent vs. Single-agent superiority**

- AgentArch benchmark shows single-agent achieves highest overall task
  completion scores
- Google/MIT scaling study shows multi-agent delivers +81% for parallelizable
  tasks
- Resolution: These are both correct — the contradiction is apparent, not real.
  Single-agent wins on simple/sequential tasks; multi-agent wins on
  parallelizable tasks and final decision quality. Task type determines the
  right choice.

**Contradiction 2: MAD effectiveness**

- Original MAD paper (2023) claims improvements for mathematical and strategic
  reasoning
- "Can LLM Agents Really Debate?" (2025) finds that structural parameters
  provide "limited gains" and sycophancy is the dominant risk
- Free-MAD (2025) shows 13-16% improvements with anti-conformity mechanisms
- Resolution: Standard MAD as originally formulated is unreliable.
  Anti-conformity variants (Free-MAD) and selective triggering (iMAD) restore
  the benefits. The contradiction is about "vanilla MAD" vs. "improved MAD."

**Contradiction 3: Verification effectiveness**

- VMAO shows LLM-based verification improves completeness by 35%
- The paper acknowledges "LLM-based verification may miss subtle factual errors
  or hallucinations, as it evaluates completeness rather than accuracy"
- Resolution: Verification catches coordination/completeness failures well but
  is not a hallucination solution. These are complementary, not contradictory
  claims.

---

## Gaps

1. **Adversarial pre-mortem agent pattern**: No peer-reviewed paper specifically
   designs a "pre-mortem agent" for multi-agent systems. The closest are: MAST's
   failure taxonomy (post-hoc), and the "Evaluation-Driven Development" paper
   (arXiv:2411.13768), which embeds continuous evaluation. A formal pre-mortem
   agent that generates likely failure modes before task execution is an
   under-researched pattern.

2. **Adversarial red-team/blue-team for LLM agents (non-security domain)**: Most
   red-team agent research is cybersecurity-focused. Adversarial agents for
   quality improvement (e.g., "devil's advocate" agent for research quality) are
   mentioned in practitioner discussions but lack rigorous benchmarks.

3. **Agent team sizing law**: The 4-agent threshold finding (from the scaling
   study) needs replication. No paper has independently validated this specific
   threshold. The MAST study did not report team size analysis.

4. **Context rot measurement**: The 50k-150k token degradation finding from
   Manus (reported in ZenML) is a practitioner observation, not a peer-reviewed
   measurement. No controlled study quantifies context quality degradation
   curves.

5. **Longitudinal production data**: All production case studies are snapshots.
   No multi-year longitudinal study of multi-agent system performance
   degradation or improvement over time exists in the literature.

6. **Cost modeling frameworks**: Multiple papers report cost ratios (4x, 8.5x,
   15x) but no standardized cost modeling framework for multi-agent systems
   exists in the literature.

---

## Serendipity

**High-value unexpected discoveries:**

1. **iMAD's 92% token reduction is a design pattern, not a marginal
   optimization.** The ability to selectively trigger debate only when
   uncertainty signals are present (via self-critique linguistic features) is
   applicable to custom agents: don't run verification/debate agents on every
   output — run them when the primary agent shows hesitation markers.

2. **Reasoning-action mismatch (13.98% of all failures)** is the second-largest
   single failure mode. This is distinct from reasoning errors — the agent
   reasons correctly but takes the wrong action. This suggests a structural need
   for an action-validator agent that compares planned action to stated
   reasoning before execution.

3. **The "rainbow deployment" pattern** (Anthropic production blog) — gradually
   shifting traffic between agent versions while running both simultaneously —
   is a low-risk rollout strategy that prevents disrupting long-running agents.
   Highly relevant for any production multi-agent deployment.

4. **AgentArch's pass@8 ceiling of 6.34%** on complex enterprise tasks is a
   sobering production signal. "Best case" reliability across 8 attempts for
   complex enterprise workflows is still below 10%. This strongly argues for
   human-in-the-loop gates on high-stakes decisions.

5. **Heterogeneous model assignment** (X-MAS finding) suggests a cost
   optimization: use a cheaper reasoning model (e.g., Claude Haiku with
   thinking) as a critic/verifier while using a more capable model as the
   primary generator. The AIME-2024 result (40% → 70%) came from model mixing,
   not architecture changes.

---

## Confidence Assessment

- HIGH claims: 14
- MEDIUM-HIGH claims: 2
- MEDIUM claims: 1
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

**Strongest findings:** MAST failure taxonomy (kappa=0.88 inter-annotator,
1,600+ traces), Google/MIT scaling study (quantitative task-type-specific
results), iMAD (6-dataset evaluation), AgentArch (18 architectures, 6 models,
ServiceNow production data)

**Weakest findings:** Enterprise harness patterns from Stripe/Shopify/Airbnb
(reconstructed from public disclosures, not primary sources), context rot
threshold (practitioner observation, not controlled study)
