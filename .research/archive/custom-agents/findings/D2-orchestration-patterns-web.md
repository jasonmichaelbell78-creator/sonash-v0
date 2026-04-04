# Findings: What Multi-Agent Orchestration Patterns Produce Highest-Quality Outputs?

**Searcher:** deep-research-searcher **Profile:** web + academic **Date:**
2026-03-29T00:00:00Z **Sub-Question IDs:** SQ2

---

## Key Findings

### 1. Six Core Orchestration Topologies [CONFIDENCE: HIGH]

Research consistently describes six primary topologies. Their characteristics
are well-established across multiple authoritative sources [1][2][3][7].

| Topology                        | Structure                             | Overhead                  | Best For                                                             |
| ------------------------------- | ------------------------------------- | ------------------------- | -------------------------------------------------------------------- |
| **Single-Agent**                | One reasoning locus                   | O(k) — zero communication | Tool-heavy tasks, sequential reasoning                               |
| **Hub-and-Spoke (Centralized)** | Orchestrator controls all routing     | 285% overhead             | Parallelizable tasks requiring quality control                       |
| **Pipeline (Sequential)**       | A outputs to B outputs to C           | Linear                    | Ordered tasks, draft-review-polish cycles                            |
| **Swarm (Independent)**         | Parallel agents, aggregation only     | 58% overhead              | Embarrassingly parallel tasks                                        |
| **Mesh (Decentralized P2P)**    | Agents communicate laterally          | 263% overhead             | Web navigation, adaptive multi-domain tasks                          |
| **Hierarchical**                | Supervisors manage sub-teams          | Scales with depth         | Enterprise-scale, 50+ agents, multi-domain                           |
| **Debate (Iterative Critique)** | Agents challenge each other's outputs | High (multiple rounds)    | Factuality verification (limited evidence, see Contradictions)       |
| **Hybrid**                      | Orchestrator + peer coordination      | 515% overhead             | Tasks requiring both centralized oversight and lateral collaboration |

Source: arxiv 2512.08296 provides the most rigorous empirical comparison;
topology names aligned with Kore.ai, Codebridge, and Anthropic sources.

---

### 2. Task Type Determines Optimal Topology — Empirical Numbers [CONFIDENCE: HIGH]

The Google/MIT research paper (arxiv 2512.08296) tested 180 configurations
across 5 architectures and 3 LLM families. Key quantitative findings [1][4]:

- **Parallelizable tasks (Finance-Agent benchmark):** Centralized coordination
  improved performance by **+80.8%** over single-agent (0.631 vs. 0.349 success
  rate). Independent parallel also showed +81% gains.
- **Sequential/reasoning tasks (PlanCraft benchmark):** All multi-agent variants
  _degraded_ performance by **39-70%** compared to single-agent. No multi-agent
  topology helped here.
- **Web navigation tasks (BrowseComp-Plus):** Decentralized (P2P mesh) showed
  the best gains at **+9.2%** vs centralized (+0.2%).
- **45% Capability Threshold:** When single-agent baseline performance exceeds
  ~45% accuracy, coordination yields diminishing or _negative_ returns. The
  interaction coefficient β = -0.404 (p<0.001).
- **Tool-heavy tasks:** Suffer disproportionately from multi-agent overhead.
  Efficiency-tools trade-off coefficient β = -0.267 (p<0.001). Prefer
  single-agent or minimal coordination for tool-heavy workflows.
- **Predictive model accuracy:** A task-property-based model correctly
  identified optimal architecture for **87% of unseen configurations** (R² =
  0.513).

Decision rule: Choose multi-agent topology only when the task is decomposable,
parallelizable, and the single-agent baseline is below ~45%.

---

### 3. Optimal Team Size — Power-Law Scaling with Hard Limits Around 3-4 Agents [CONFIDENCE: HIGH]

Empirical finding from arxiv 2512.08296 (Google/MIT, Dec 2025) [1][4]:

- Turn count follows **power-law scaling: T = 2.72 × (n + 0.5)^1.724**
- Under fixed computational budgets, per-agent reasoning capacity becomes
  severely constrained **beyond 3-4 agents**
- At higher counts, communication overhead consumes reasoning capacity
- Optimal communication density: **~0.39 messages/turn** — beyond this, success
  rate follows diminishing returns (logarithmic relationship)
- Enterprise production guidance (Databricks, LangGraph docs): **"3-5 specialist
  sub-agents is enough for most complex workflows"** [9][11]
- For enterprise-scale (50+ agents): use **nested hierarchical supervisors** —
  top-level strategic coordinator managing domain-level supervisors, each
  managing 3-5 worker agents [9]

The 3-5 number cited in the query maps to practical production guidance rather
than a single paper threshold — the arxiv paper supports this range but frames
it as a computational budget constraint.

---

### 4. Error Amplification and Coordination Structure [CONFIDENCE: HIGH]

Error propagation scales dramatically with topology [1][12]:

- **Independent (bag-of-agents):** **17.2x error amplification** — mistakes
  cascade unchecked through aggregation
- **Centralized coordination:** Contains error amplification to **4.4x**
- **Coordination overhead scales exponentially:** 2 agents = 1 interaction
  point; 10 agents = 45 potential failure points

This is the strongest argument _for_ centralized coordination even when
performance gains are modest: error containment prevents catastrophic failures
in production workflows.

The "bag of agents" anti-pattern — deploying multiple agents without structural
coordination — is the primary cause of multi-agent system failures [12][13].

---

### 5. Framework-Specific Orchestration Approaches [CONFIDENCE: HIGH]

**CrewAI** [5]:

- Three process types: Sequential (linear, 15-20% more token-efficient),
  Hierarchical (manager validates before proceeding, ~6-9 extra manager LLM
  calls per 3-task crew), and Parallel (independent tasks)
- Role-based, inspired by human organization structures
- Best for: demos, prototypes; needs extra work for production observability
- Memory: task history in memory by default (~200-300 MB RAM per 3-agent crew)

**LangGraph** [6][9]:

- Graph-based: state flows through typed nodes (agents) via edges
- `langgraph-supervisor` library: out-of-box hierarchical multi-agent with
  streaming, short/long-term memory, human-in-the-loop
- Supports multi-level nesting: top-level supervisor → mid-level supervisors →
  workers
- Production standard since LangGraph 1.0 (Oct 2025)
- Best for: complex branching, explicit state management, production deployments

**AutoGen / AG2** [10]:

- Group Chat Manager as hub: broadcasts messages to all agents, selects next
  speaker via strategy (round-robin, random, LLM-based `auto`)
- SelectorGroupChat: LLM-based speaker selection from context
- Magentic-One pattern: Orchestrator with dual loops (outer: task ledger plan;
  inner: progress ledger per-turn assignment), 4 specialized workers (WebSurfer,
  FileSurfer, Coder, ComputerTerminal)
- Achieved SOTA on GAIA, AssistantBench, WebArena benchmarks
- Best for: open-ended tasks requiring dynamic collaboration, generalist
  workflows

**Claude Code Agent Teams** [14][15][16]:

- **Subagents**: Isolated context windows, report results back to orchestrator
  only (hub-and-spoke). Cannot spawn other subagents (prevents nesting).
  Built-in subagents: Explore (Haiku, read-only), Plan (read-only),
  General-purpose (all tools).
- **Agent Teams**: Full mesh — teammates can message each other directly, access
  shared task list, use async mailbox system. Each teammate is a separate Claude
  instance with its own context. Coordination through: shared file system
  writes, tool result passing, sequential checkpoints.
- **Worktree isolation** (released Feb 2026): Each agent gets an isolated git
  worktree, enabling parallel writes to same files without conflicts. Key for
  the `/batch` command pattern.
- **Model tiering**: Opus 4 as orchestrator/lead, Sonnet 4 as workers reported
  **+90.2% performance** over single-agent Opus 4 on internal research evals
  [14]
- Token cost: 3-teammate team uses ~3-4x tokens of single session; justified for
  complex parallel work

---

### 6. Multi-Agent Debate (MAD) Pattern — Mixed Evidence [CONFIDENCE: MEDIUM]

Academic consensus on debate is nuanced and more pessimistic than early
enthusiasm suggested [17][18]:

- Most MAD frameworks **do not consistently outperform** single-agent
  Chain-of-Thought or Self-Consistency [17]
- Key failure: MAD methods are "overly aggressive" — they reverse correct
  responses more often than they fix wrong ones [17]
- Increasing rounds or agent count produced **inconsistent results** — MAD
  doesn't effectively use additional inference budget
- Multi-Persona pattern performed **worst** across nearly all datasets
- **Sole bright spot:** Combining _different foundation models_ (model
  diversity) improved performance in some GPT-4o-mini + Llama combinations —
  model diversity matters more than debate structure itself [17]
- Adaptive heterogeneous MAD (varying agreement levels) shows promise per
  Springer 2025 paper [18]
- Conclusion: Do not use debate as a default quality amplifier. Reserve for
  specific factuality verification tasks with heterogeneous models and
  controlled agreement levels.

---

### 7. Failure Handling Patterns [CONFIDENCE: HIGH]

Seven documented failure patterns with mitigations [12][13][19]:

1. **Agent Coordination Breakdowns** — Use explicit role-aware message schemas,
   responsibility matrices, coordination monitors
2. **Lost Context Across Handoffs** — Implement persistent storage, session
   tokens, real-time visibility dashboards
3. **Endless Loops** — Loop-detection via intent classification; set `maxTurns`
   limits on subagents (Claude Code supports this in frontmatter)
4. **Runtime Coordination Failures** — Distributed tracing, circuit breakers,
   token budget hard limits per agent
5. **Cascading Failures** — Sandboxed execution, structured output validation,
   graceful degradation fallbacks
6. **Role Confusion** — Explicit boundary definitions, role-validation
   checkpoints, formal handoff protocols
7. **Inadequate Observability** — Structured logging with correlation IDs,
   conversation replay

**Technical failure handling (Portkey research)** [19]:

- **Retry + exponential backoff:** For transient failures (network, TLS, rate
  limits). Add jitter to prevent synchronized retries across agents.
- **Fallback to alternative model/provider:** Reactive; incurs latency. Be aware
  of shared failure domains.
- **Circuit breakers:** Proactive — monitor failure rates on metrics (429, 502,
  503). Three states: Closed → Open → Half-Open. Prevents cascading failures.
- **Layered approach:** Retries handle transient issues + fallbacks provide
  alternatives + circuit breakers prevent systemic degradation.
- **Human escalation:** After N retries, escalate. Required for code
  modification, infrastructure changes, cost-heavy operations with low
  confidence.

---

### 8. Anthropic's Five-Level Composable Patterns [CONFIDENCE: HIGH]

Anthropic's official documentation describes agents as built from composable
patterns [14][15]:

1. **Tool-augmented single agent** — foundation, no coordination overhead
2. **Orchestrator-worker (hub-and-spoke)** — orchestrator decomposes, workers
   execute, orchestrator synthesizes
3. **Parallel subagent spawning** — orchestrator uses Task/Agent tool to launch
   parallel subagents
4. **Sequential chaining** — output of one subagent becomes input to next
5. **Evaluator-optimizer loop** — dedicated evaluator provides feedback to
   generator until quality threshold met

Claude Code specific: Subagents cannot spawn other subagents (prevents nesting;
use Agent Teams for that). Skills run in main conversation context; subagents
get isolated context. `isolation: worktree` frontmatter field creates git
worktree isolation per subagent run.

---

### 9. State and Memory Patterns [CONFIDENCE: MEDIUM]

Two primary state-sharing approaches with different tradeoffs [20][21]:

**Shared Memory:**

- Enables "team mind" — knowledge immediately global across all agents
- Risk: noisy commons, privacy issues, role segregation violations
- Modern solutions (Collaborative Memory, 2025): two-tier approach — private
  fragments + selectively shared fragments with access control

**Message Passing:**

- Safer for distributed systems, cleaner isolation
- Limitation: inter-agent bandwidth constrained; KV cache sharing emerging as
  solution
- AutoGen broadcasts to all; Claude Code Teams use async mailbox for selective
  routing

**Framework comparison:**

- LangGraph: persistent checkpointed state (TypedDict), best for production —
  survives restarts, supports human-in-the-loop at state boundaries
- CrewAI: task handoff model — ephemeral, in-memory task history
- Claude Code: shared file system as coordination layer (explicit, inspectable,
  durable)

---

### 10. Claude Code Sub-Agent Configuration Details [CONFIDENCE: HIGH]

Official documentation confirms specific patterns [15]:

- **Frontmatter fields controlling quality:** `model`
  (haiku/sonnet/opus/inherit), `effort` (low/medium/high/max), `maxTurns`,
  `permissionMode`
- **Tool access control:** `tools` (allowlist) XOR `disallowedTools` (denylist)
  — if both set, denylist applied first
- **Spawning restrictions:** `tools: Agent(worker, researcher)` — allowlist
  restricts which sub-types orchestrator can spawn
- **MCP scoping:** `mcpServers` field scopes MCP servers to individual subagent
  only, avoiding context pollution in parent
- **Memory persistence:** `memory: user|project|local` — cross-session learning
  stored in `MEMORY.md` (first 200 lines injected at startup)
- **Worktree isolation:** `isolation: worktree` — agent runs in isolated git
  worktree, auto-cleaned if no changes made
- **Background execution:** `background: true` — runs concurrently; pre-approves
  permissions upfront; cannot ask clarifying questions during run
- **Skills preloading:** `skills: [skill-name]` — full skill content injected at
  startup (not inherited from parent)

Priority chain for model selection: `CLAUDE_CODE_SUBAGENT_MODEL` env var →
per-invocation model param → frontmatter model → main conversation model

---

## Sources

| #   | URL                                                                                                                       | Title                                                                      | Type                    | Trust  | CRAAP Avg | Date     |
| --- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------- | ------ | --------- | -------- |
| 1   | https://arxiv.org/abs/2512.08296                                                                                          | Towards a Science of Scaling Agent Systems                                 | Academic (Google/MIT)   | HIGH   | 4.6/5     | Dec 2025 |
| 2   | https://www.kore.ai/blog/choosing-the-right-orchestration-pattern-for-multi-agent-systems                                 | Choosing the Right Orchestration Pattern                                   | Industry blog           | MEDIUM | 3.8/5     | 2025     |
| 3   | https://www.codebridge.tech/articles/mastering-multi-agent-orchestration-coordination-is-the-new-scale-frontier           | Multi-Agent Systems & AI Orchestration Guide 2026                          | Industry                | MEDIUM | 3.6/5     | 2026     |
| 4   | https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/                  | Google Research: Scaling Agent Systems                                     | Official research blog  | HIGH   | 4.5/5     | Dec 2025 |
| 5   | https://help.crewai.com/ware-are-the-key-differences-between-hierarchical-and-sequential-processes-in-crewai              | CrewAI Process Types                                                       | Official docs           | HIGH   | 4.2/5     | 2025     |
| 6   | https://changelog.langchain.com/announcements/langgraph-supervisor-a-library-for-hierarchical-multi-agent-systems         | LangGraph Supervisor Library                                               | Official changelog      | HIGH   | 4.4/5     | 2025     |
| 7   | https://arxiv.org/html/2601.13671v1                                                                                       | Orchestration of Multi-Agent Systems: Architectures, Protocols, Enterprise | Academic                | HIGH   | 4.3/5     | Jan 2026 |
| 8   | https://www.microsoft.com/en-us/research/articles/magentic-one-a-generalist-multi-agent-system-for-solving-complex-tasks/ | Magentic-One: A Generalist Multi-Agent System                              | Official research       | HIGH   | 4.5/5     | Nov 2024 |
| 9   | https://www.databricks.com/blog/multi-agent-supervisor-architecture-orchestrating-enterprise-ai-scale                     | Multi-Agent Supervisor Architecture at Scale                               | Industry (Databricks)   | HIGH   | 4.2/5     | 2025     |
| 10  | https://microsoft.github.io/autogen/stable//user-guide/core-user-guide/design-patterns/group-chat.html                    | AutoGen Group Chat Pattern                                                 | Official docs           | HIGH   | 4.3/5     | 2025     |
| 11  | https://langchain-ai.github.io/langgraph/tutorials/multi_agent/hierarchical_agent_teams/                                  | LangGraph Hierarchical Agent Teams                                         | Official tutorial       | HIGH   | 4.4/5     | 2025     |
| 12  | https://galileo.ai/blog/multi-agent-llm-systems-fail                                                                      | Why Multi-Agent LLM Systems Fail                                           | Industry research       | MEDIUM | 3.9/5     | 2025     |
| 13  | https://towardsdatascience.com/why-your-multi-agent-system-is-failing-escaping-the-17x-error-trap-of-the-bag-of-agents/   | Escaping the 17x Error Trap                                                | Community (TDS)         | MEDIUM | 3.7/5     | 2025     |
| 14  | https://www.anthropic.com/engineering/multi-agent-research-system                                                         | Anthropic Multi-Agent Research System                                      | Official Anthropic      | HIGH   | 4.8/5     | 2025     |
| 15  | https://code.claude.com/docs/en/sub-agents                                                                                | Claude Code Sub-Agents Documentation                                       | Official Anthropic docs | HIGH   | 5.0/5     | 2026     |
| 16  | https://www.mindstudio.ai/blog/what-is-claude-code-agent-teams                                                            | Claude Code Agent Teams                                                    | Industry analysis       | MEDIUM | 3.8/5     | Feb 2026 |
| 17  | https://d2jud02ci9yv69.cloudfront.net/2025-04-28-mad-159/blog/mad/                                                        | MAD Performance, Efficiency, Scaling — ICLR 2025                           | Academic (ICLR)         | HIGH   | 4.5/5     | Apr 2025 |
| 18  | https://link.springer.com/article/10.1007/s44443-025-00353-3                                                              | Adaptive Heterogeneous Multi-Agent Debate                                  | Academic (Springer)     | HIGH   | 4.4/5     | 2025     |
| 19  | https://portkey.ai/blog/retries-fallbacks-and-circuit-breakers-in-llm-apps/                                               | Retries, Fallbacks, Circuit Breakers in LLM Apps                           | Industry (Portkey)      | MEDIUM | 3.9/5     | 2025     |
| 20  | https://arxiv.org/html/2603.10062                                                                                         | Multi-Agent Memory from Computer Architecture Perspective                  | Academic                | HIGH   | 4.3/5     | Mar 2026 |
| 21  | https://arxiv.org/html/2503.03800v1                                                                                       | Multi-Agent Systems: Applications in Swarm Intelligence                    | Academic                | HIGH   | 4.2/5     | Mar 2025 |
| 22  | https://www.anthropic.com/webinars/claude-code-advanced-patterns                                                          | Claude Code Advanced Patterns Webinar                                      | Official Anthropic      | HIGH   | 4.8/5     | 2026     |
| 23  | https://claude.com/blog/common-workflow-patterns-for-ai-agents-and-when-to-use-them                                       | Common Workflow Patterns for AI Agents                                     | Official Anthropic blog | HIGH   | 4.9/5     | 2025     |

---

## Contradictions

**Debate pattern effectiveness:**

- Early papers (arxiv 2305.14325 by Du et al., cited heavily) claimed debate
  significantly improves factuality and reasoning
- ICLR 2025 meta-analysis (source 17) found MAD frameworks _fail to consistently
  outperform_ even simple Self-Consistency baselines
- Resolution: the early positive results may not have adequately compared
  against Self-Consistency as baseline; ICLR 2025 is the more rigorous
  evaluation. Current recommendation: treat debate as speculative, not reliable.

**Team size optima:**

- Some industry sources recommend "up to 10 agents" for complex enterprise tasks
- arxiv 2512.08296 empirical work shows hard efficiency limits around 3-4 agents
  under fixed compute budgets
- Resolution: 10-agent teams may be viable with large compute budgets; the 3-4
  limit applies specifically when compute is fixed. For most practical
  deployments (Claude Code, etc.), 3-5 agents is the validated sweet spot.

**Single-agent vs multi-agent as default:**

- Some industry sources promote multi-agent as universally better
- Google/MIT research (2512.08296) shows single-agent often outperforms once
  capability exceeds ~45%
- Resolution: multi-agent is not universally better; task decomposability and
  baseline capability determine whether coordination adds value.

---

## Gaps

1. **Claude Code Agent Teams vs Subagents performance comparison**: No
   independent benchmark comparing quality outcomes between these two
   coordination models (Teams mesh vs subagent hub-and-spoke) for equivalent
   tasks.
2. **Debate pattern with Claude specifically**: All MAD research used GPT-4o or
   open-source models. No data on whether Claude's RLHF training (constitutional
   AI) makes it more or less susceptible to debate anti-patterns.
3. **Cost-quality Pareto frontier**: No comprehensive study maps the token-cost
   vs quality tradeoff across all topologies for a fixed task class. The
   Anthropic 90.2% figure lacks token cost breakdown.
4. **Optimal inter-agent communication frequency**: The 0.39 messages/turn
   optimal density finding from arxiv 2512.08296 needs replication across more
   task domains.
5. **Failure rates in production**: Most performance data comes from benchmarks
   (GAIA, WebArena, etc.) — real-world production failure rate data for
   different topologies is sparse.
6. **Hierarchical team size at each level**: Research confirms "3-5 workers per
   supervisor" but lacks data on optimal supervisor-to-worker ratios in deeper
   hierarchies (3+ levels).

---

## Serendipity

**Worktree isolation as quality mechanism (not just speed):** Claude Code's
`isolation: worktree` pattern (released Feb 2026) enables parallel agents to
attempt _different approaches to the same files_ — not just different files.
This opens a "parallel hypothesis testing" pattern: spawn N agents on separate
worktrees with different implementation strategies, then select the best result.
This is essentially a mechanical MAD alternative that sidesteps the MAD
anti-patterns because agents don't influence each other's reasoning, only
results are compared.

**Model tiering as quality multiplier:** The Anthropic research result (Opus 4
orchestrator + Sonnet 4 workers = +90.2% over single Opus 4) suggests that
_hierarchical model tiering_ — not just task parallelism — is a primary quality
lever. The expensive model spends its capacity on coordination and synthesis;
cheaper models handle execution. This is architecturally equivalent to how human
expert teams work (senior expert directs, junior executes).

**MCP scoping to subagents:** Claude Code allows MCP servers to be scoped to
individual subagents (not available in parent). This enables a "specialized tool
access" pattern where each agent only sees the tools relevant to its role —
reducing prompt contamination from irrelevant tool descriptions, which could
improve per-agent quality.

**LangGraph 1.0 stability signal (Oct 2025):** The 1.0 release represents
framework maturity — persistent state surviving failures, human-in-the-loop
checkpoints at state boundaries. This makes LangGraph the reference
implementation for production multi-agent systems that need durability.

---

## Confidence Assessment

- HIGH claims: 8 (topologies, task-type matching, empirical numbers, error
  amplification, framework specifics, failure patterns, Anthropic patterns,
  Claude Code config)
- MEDIUM claims: 3 (debate pattern, state/memory tradeoffs, some team size
  industry guidance)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH** — all major findings backed by at least one
  official source or peer-reviewed paper, with multiple independent sources for
  core claims
