# Research Orchestration Patterns

<!-- prettier-ignore-start -->
| Field        | Value                              |
| ------------ | ---------------------------------- |
| Status       | COMPLETE                           |
| Last Updated | 2026-03-20                         |
| Dimension    | How the whole thing works end-to-end |
<!-- prettier-ignore-end -->

## Executive Summary

Research orchestration is the end-to-end discipline of decomposing a complex
question into manageable sub-questions, executing research across those
sub-questions (potentially in parallel), managing state throughout the process,
synthesizing findings into a coherent output, and knowing when to iterate versus
when to stop.

The dominant pattern across production systems (Google Deep Research, OpenAI
Deep Research, Anthropic's multi-agent research, STORM, Together AI Open Deep
Research) is a **plan-search-synthesize loop** with an orchestrator/worker
architecture. Key findings:

1. **Decomposition** is best done top-down with iterative refinement -- start
   with an outline, then let early findings reshape the plan.
2. **Execution** should be parallel-by-default at the sub-topic level, with
   depth-first drilling within each sub-topic.
3. **State** must track progress, findings, confidence, and open questions --
   persisted to survive interruption.
4. **Synthesis** should be progressive (synthesize as you go) rather than purely
   batch (gather everything then synthesize) -- this reduces redundancy and
   catches gaps early.
5. **Iteration** needs explicit stopping criteria: saturation detection, quality
   gates, and hard bounds to prevent infinite loops.
6. **Output** should be layered (summary -> details -> sources) for maximum
   utility across audiences.

---

## 1. Question Decomposition Strategies

### 1.1 Top-Down Decomposition

- **How it works:** Start with the main research question. Break it into 3-7
  logical sub-topics based on the question's natural structure. Each sub-topic
  becomes a research thread.
- **Best for:** Well-defined research questions where the structure is apparent
  upfront (e.g., "Compare X vs Y across dimensions A, B, C").
- **Example:** "How do AI systems orchestrate research?" decomposes into:
  decomposition strategies, execution patterns, state management, synthesis,
  iteration, output formats.
- **Used by:** Google Deep Research (creates a multi-step research plan for user
  approval before executing), OpenAI DeepResearcher (forms a report outline
  first, then runs concurrent IterativeResearcher instances per section).

### 1.2 Perspective-Guided Decomposition (STORM Model)

- **How it works:** Discover diverse perspectives on the topic by mining related
  sources. Simulate conversations between writers carrying different
  perspectives and a topic expert grounded in internet sources. Each perspective
  generates unique questions that collectively cover the topic's breadth.
- **Best for:** Open-ended topics where you don't know what the right
  sub-questions are (e.g., "Write a comprehensive article about X").
- **Example:** STORM (Stanford) discovers perspectives from Wikipedia articles
  related to the topic, then each perspective-holder asks questions that a
  single researcher might not think of. The result is a multi-level outline with
  sections, subsections, and sub-subsections.
- **Key insight:** Complex questions are broken into smaller, focused search
  queries. The pre-writing phase culminates in a structured outline that ensures
  logical flow and comprehensive coverage.
- **Source:**
  [Stanford STORM Project](https://storm-project.stanford.edu/research/storm/)

### 1.3 Iterative / Adaptive Decomposition

- **How it works:** Start researching with a loose plan. Let early findings
  suggest new questions. Refine the decomposition as understanding deepens.
  Perplexity Deep Research performs 3-5 sequential searches to refine queries as
  it learns what data is missing.
- **Best for:** Exploratory research where you don't know what you don't know.
- **Example:** A query about "emerging AI regulation" might start broad, then
  narrow to specific jurisdictions, specific regulatory frameworks, or specific
  enforcement mechanisms based on what the initial searches reveal.
- **Used by:** Perplexity Deep Research (iteratively searches, reads documents,
  and reasons about what to do next, refining its research plan as it learns
  more).

### 1.4 Tree-of-Reasoning Decomposition

- **How it works:** Construct a reasoning tree that represents the structure of
  the complex question. A Reasoning Tree Constructor predicts diverse
  sub-question structures. Multiple decomposition paths are explored in
  parallel, and the most promising branch is selected.
- **Best for:** Multi-hop questions requiring logical chain reasoning (e.g.,
  "What caused X, which led to Y, which resulted in Z?").
- **Example:** The DeAR (Decompose-Analyze-Rethink) framework introduces a cycle
  that gradually constructs a reasoning tree guided by sub-questions, following
  a top-to-bottom reasoning process.
- **Key insight:** Sub-question generation can use prompt-based or fine-tuned
  approaches. Chain-of-thought followed by coherent sub-questions improves
  performance on multi-hop questions.
- **Source:**
  [AAAI Tree-of-Reasoning Paper](https://ojs.aaai.org/index.php/AAAI/article/view/29928)

### 1.5 Bottom-Up / Clustering Decomposition

- **How it works:** Brainstorm all potentially relevant concepts, facts, and
  angles. Cluster them into coherent research threads. Identify the threads that
  best cover the question space.
- **Best for:** Highly interdisciplinary topics where the structure isn't
  obvious.
- **Example:** Researching "impact of remote work" might generate concepts like
  productivity, mental health, real estate, commuting, carbon emissions, digital
  tools, management practices -- which cluster into economic, social, and
  environmental threads.

### Granularity Guidance

The right granularity for sub-questions depends on the depth target:

| Depth Target     | Sub-questions | Granularity                    |
| ---------------- | ------------- | ------------------------------ |
| Quick briefing   | 3-5           | One paragraph answer each      |
| Standard report  | 5-8           | One section (200-500 words)    |
| Deep research    | 8-15          | Full analysis per sub-topic    |
| Exhaustive study | 15-30+        | Hierarchical sub-sub-questions |

---

## 2. Execution Strategies

### 2.1 Parallel Breadth-First (Survey, Then Deepen)

- **Pattern:** Launch parallel research across all sub-topics simultaneously.
  Each worker does a shallow pass. Orchestrator reviews coverage, then assigns
  deeper dives where needed.
- **Pros:** Fast wall-clock time; identifies gaps early; prevents over-investing
  in one area.
- **Cons:** Higher token cost from parallelism; may surface low-quality results
  that need filtering.
- **Used by:** Anthropic's multi-agent research (lead agent spawns subagents to
  explore different aspects simultaneously), OpenAI DeepResearcher (runs
  concurrent IterativeResearcher instances, ingesting 50-60 web pages at any
  given point).
- **Implementation note:** Anthropic found that token usage explains 80% of
  performance variance. Multi-agent systems work mainly because they spend
  enough tokens to solve the problem.

### 2.2 Sequential Depth-First

- **Pattern:** Fully research one sub-topic before moving to the next. Each
  sub-topic goes through plan -> search -> read -> synthesize before the next
  begins.
- **Pros:** Lower resource usage; findings from earlier topics can inform later
  ones; simpler state management.
- **Cons:** Slow; risk of over-investing in early topics; no cross-topic
  deduplication until late.
- **Used by:** OpenAI IterativeResearcher (runs a continuous loop of research on
  a single topic or sub-topic; preferred for shorter reports up to 5 pages).

### 2.3 Priority-Based / Uncertainty-Driven

- **Pattern:** Assess which sub-topics have the highest uncertainty or
  importance. Research those first. Re-prioritize after each round.
- **Pros:** Efficient allocation of research effort; focuses on what matters
  most.
- **Cons:** Requires a reliable uncertainty estimator; risk of neglecting
  "boring but important" sub-topics.
- **Best for:** Time-constrained research where you cannot cover everything.

### 2.4 Adaptive Hybrid (Recommended)

- **Pattern:** Start breadth-first with a shallow parallel survey. Score each
  sub-topic on coverage quality. Deepen the weakest areas. Repeat until
  convergence.
- **Implementation:**
  1. **Phase 1 (Breadth):** Parallel shallow research on all sub-topics
  2. **Phase 2 (Assessment):** Orchestrator evaluates coverage gaps and quality
  3. **Phase 3 (Depth):** Targeted deep dives on under-covered areas
  4. **Phase 4 (Synthesis):** Merge findings, identify remaining gaps
  5. **Phase 5 (Iteration):** If gaps remain and budget allows, loop back to
     Phase 3
- **Used by:** Google Deep Research (autonomous loop of planning, searching,
  reading, and reasoning), Together AI Open Deep Research (planning, search, and
  multiple self-reflection stages).

### Time-Boxing vs Quality-Gating

| Approach      | Mechanism                                          | Best For                  |
| ------------- | -------------------------------------------------- | ------------------------- |
| Time-boxed    | Fixed time per sub-topic; move on regardless       | Predictable delivery time |
| Quality-gated | Define minimum quality criteria; loop until met    | Maximum thoroughness      |
| Hybrid        | Quality gates with hard time caps as safety bounds | Production systems        |

The Karpathy Loop (autoresearch) exemplifies this hybrid: each experiment runs
for a fixed 5 minutes, measures a single metric (bits-per-byte), keeps or
discards the result, and repeats. This pattern -- time-boxed execution with
objective quality measurement -- is directly applicable to research workflows.

---

## 3. State Management

### 3.1 What State to Track

Based on production patterns from LangGraph, Google ADK, and OpenAI's Agents
SDK, research state should include:

```
ResearchState {
  // Planning state
  original_question: string
  decomposition: SubQuestion[]
  research_plan: Phase[]
  current_phase: PhaseId

  // Progress tracking
  sub_topics: {
    [id: string]: {
      question: string
      status: "pending" | "in_progress" | "complete" | "needs_deepening"
      findings: Finding[]
      sources: Source[]
      confidence: 0.0-1.0
      search_queries_used: string[]
      iteration_count: number
    }
  }

  // Synthesis state
  outline: Section[]
  draft_sections: { [sectionId: string]: string }
  cross_topic_themes: Theme[]
  identified_gaps: Gap[]

  // Meta-state
  total_iterations: number
  total_sources_consulted: number
  token_budget_remaining: number
  quality_scores: { [metric: string]: number }
}
```

### 3.2 State Persistence Patterns

| Pattern         | Description                                  | Trade-off                        |
| --------------- | -------------------------------------------- | -------------------------------- |
| In-memory only  | State lives in orchestrator context          | Fast; lost on interruption       |
| File-based      | State written to JSON/JSONL after each phase | Survives interruption; simple    |
| Session state   | Framework-managed (LangGraph, ADK)           | Automatic; framework-dependent   |
| Hybrid hot/cold | Working state in memory, checkpoints to disk | Best balance of speed and safety |

**LangGraph pattern:** Uses explicit, reducer-driven state schemas with Python's
TypedDict and Annotated types. Reducer functions prevent data loss in
multi-agent systems by defining how concurrent updates merge.

**Google ADK pattern:** SequentialAgent passes the same InvocationContext
sequentially; callbacks (before_agent_run, after_tool_run) manage session state
transitions. A stage variable in session state tracks the current workflow
phase.

**Recommended for Claude Code skill:** File-based state with JSONL append-only
logs for findings, plus a summary JSON file for current status. This survives
compaction, is human-readable, and works with the existing hook/state-file
patterns in the codebase.

### 3.3 Handling Partial Results

When research is interrupted (context overflow, user cancellation, timeout):

1. **Checkpoint before each phase transition** -- write current state to disk
2. **Mark incomplete sub-topics** with their last status and partial findings
3. **Resume capability** -- on restart, read state file and skip completed work
4. **Incremental output** -- produce partial reports from whatever is complete
   rather than requiring all sub-topics to finish

---

## 4. Synthesis Approaches

### 4.1 Progressive Synthesis (Recommended)

- **Pattern:** Synthesize findings incrementally as each sub-topic completes.
  Maintain a running draft that grows with each completed research thread.
- **Advantages:**
  - Catches cross-topic redundancy early
  - Identifies gaps before all research is complete
  - Produces useful partial output if interrupted
  - Reduces final synthesis burden
- **Implementation:** After each sub-topic completes, an incremental synthesis
  step integrates new findings into the existing draft, resolving overlaps and
  updating the outline.
- **Used by:** OpenAI's synthesis flow contains a synthesizer agent that takes
  all content from web agents and converts it into the final research report,
  organizing information into sections and resolving overlaps.

### 4.2 Final Batch Synthesis

- **Pattern:** Gather all findings from all sub-topics, then synthesize
  everything in one pass.
- **Advantages:** Full context available; can find patterns across all findings
  simultaneously.
- **Disadvantages:** Requires holding all findings in context at once (context
  window pressure); no early gap detection; wasted work if some sub-topics
  produced redundant information.
- **Best for:** Short reports where all findings fit in a single context window.

### 4.3 Outline-Guided Synthesis

- **Pattern:** Create an outline first, then fill each section from the
  corresponding research thread. The outline serves as the integration
  framework.
- **Used by:** STORM (multi-level outline with sections, subsections, and
  sub-subsections provides structured framework ensuring logical flow), OpenAI
  DeepResearcher (forms a report outline first, then runs concurrent research
  per section).
- **Key insight:** The outline is the integration contract. Sub-topics map to
  outline sections. Synthesis becomes: for each section, select and organize the
  relevant findings.

### 4.4 Multi-Agent Synthesis Pipeline

Based on production architectures:

1. **Research agents** produce raw findings with source citations
2. **Deduplication agent** identifies overlapping information across threads
3. **Theme extraction agent** finds patterns and connections across findings
4. **Synthesizer agent** drafts the integrated report from deduplicated, themed
   findings
5. **Citation agent** verifies all claims are properly attributed to sources

Anthropic uses a CitationAgent that processes documents and research report to
identify specific citation locations. Google ADK uses a PatternSynthesizerAgent
that identifies common threads and synthesizes them into evidence-based reports
citing sources for every pattern.

### 4.5 Deduplication Strategies

| Strategy            | Mechanism                                         | Quality |
| ------------------- | ------------------------------------------------- | ------- |
| Semantic similarity | Embed findings, cluster similar ones, keep best   | High    |
| Source-based        | Same source = likely duplicate; merge claims      | Medium  |
| Claim-level         | Extract atomic claims, deduplicate at claim level | Highest |
| Section-scoped      | Deduplicate within each outline section           | Fast    |

---

## 5. Iteration and Convergence

### 5.1 When to Loop Back

Loop back for more depth when:

- A sub-topic has **low confidence** (few sources, conflicting information)
- **Gap analysis** reveals missing aspects of the question
- A finding raises **new questions** not covered by the original decomposition
- Quality scores fall below **minimum thresholds**

### 5.2 Research Saturation Detection

Saturation is reached when new searches return information already captured in
findings. Detection approaches:

1. **Novelty scoring:** After each search, score what percentage of returned
   information is genuinely new vs already known. If novelty drops below a
   threshold (e.g., < 10% new information for 2 consecutive searches), declare
   saturation for that sub-topic.
2. **Code saturation analog:** Borrowed from qualitative research -- if two or
   three consecutive searches bring no new codes/themes, saturation is reached.
3. **Diminishing returns curve:** Track cumulative new findings vs search count.
   When the curve flattens, stop.
4. **Source diversity check:** If multiple independent sources converge on the
   same information, confidence is high and further searching has diminishing
   returns.

### 5.3 Quality Gates Between Iterations

```
QualityGate {
  min_sources_per_subtopic: 3
  min_confidence_score: 0.7
  max_conflicting_claims: 2
  required_coverage: ["all sub-questions addressed"]
  no_empty_sections: true
  citations_present: true
}
```

If any gate fails after Phase 4 (Synthesis), loop back to Phase 3 (Depth) for
the failing sub-topics only.

### 5.4 Iteration Bounds (Preventing Infinite Loops)

Hard bounds are essential. Without them, agents can loop indefinitely searching
for information that doesn't exist. Anthropic noted early agents would "scour
the web endlessly for nonexistent sources."

| Bound Type           | Recommended Value     | Rationale                   |
| -------------------- | --------------------- | --------------------------- |
| Max iterations       | 3 per sub-topic       | Diminishing returns after 3 |
| Max total iterations | 2-3 full cycles       | Prevents runaway research   |
| Max search queries   | 10-15 per sub-topic   | Cost and time control       |
| Max token budget     | Configurable per task | Hard economic constraint    |
| Max wall-clock time  | Configurable per task | User patience constraint    |

After hitting a hard bound, the system should:

1. Report what was found (even if incomplete)
2. Explicitly note what couldn't be resolved
3. Suggest follow-up questions for the user

---

## 6. Output Format Patterns

### 6.1 Layered Progressive Disclosure (Recommended)

The most versatile format provides multiple levels of detail:

```
Layer 1: Executive Summary (1-3 sentences)
Layer 2: Key Findings (bulleted, 5-10 items)
Layer 3: Detailed Sections (full analysis per sub-topic)
Layer 4: Source Appendix (all sources with confidence levels)
```

This serves multiple audiences: executives read Layer 1-2, analysts read Layer
3, fact-checkers use Layer 4.

### 6.2 Report-Style

- Structured document with sections, sub-sections, and citations
- Best for: comprehensive reference documents, policy briefs
- Used by: OpenAI Deep Research, Google Deep Research, STORM

### 6.3 Briefing-Style

- Executive summary with supporting evidence bullets
- Best for: decision-makers who need quick answers with confidence levels
- Structure: Question -> Answer -> Confidence -> Key Evidence -> Caveats

### 6.4 Q&A-Style

- Original sub-questions listed with their researched answers
- Best for: when the decomposition itself is the organizing principle
- Advantage: directly maps to the research structure; easy to see what was
  answered and what wasn't

### 6.5 Knowledge Graph Output

- Interconnected facts and relationships expressed as triples
- Best for: feeding into downstream reasoning systems or building cumulative
  knowledge bases
- Trade-off: harder to read for humans; excellent for machines

### Format Selection Matrix

| Audience         | Time Pressure | Best Format           |
| ---------------- | ------------- | --------------------- |
| Executive        | High          | Briefing              |
| Technical team   | Medium        | Layered report        |
| Decision-maker   | High          | Q&A with confidence   |
| Knowledge base   | None          | Knowledge graph       |
| General audience | Low           | Full report           |
| Planning system  | N/A           | Structured JSON + Q&A |

---

## 7. Real-World Orchestration Examples

### 7.1 Google Deep Research (Gemini 2.5 Pro)

**Architecture:** Gemini 2.5 Pro deputized as an agent in an autonomous
plan-search-read-reason loop.

**Workflow:**

1. User submits question
2. Agent creates a multi-step research plan (visible to user for revision)
3. User approves plan
4. Agent autonomously executes: planning search queries, reading pages,
   iterating on analysis
5. SynthesizerOrchestratorAgent consolidates validated data from parallel
   research pipelines
6. PatternSynthesizerAgent identifies common threads and produces evidence-based
   report with citations

**Key design choices:**

- User approval gate on research plan before execution
- Parallel research pipelines consolidated by a synthesizer orchestrator
- Tools: google_search and url_context (built-in by default)
- Can combine internet research with internal document analysis

**Sources:**
[Gemini Deep Research API Docs](https://ai.google.dev/gemini-api/docs/deep-research),
[Google ADK Blog](https://cloud.google.com/blog/products/ai-machine-learning/build-a-deep-research-agent-with-google-adk)

### 7.2 OpenAI Deep Research (o3/o4-mini)

**Architecture:** Two-tier agent system with IterativeResearcher (single-topic
loop) and DeepResearcher (multi-topic orchestrator).

**Workflow:**

1. **Planning:** Task decomposition and research strategy formulation
2. **Query Generation:** Designing queries for each research question
3. **Web Exploration:** Searching and retrieving relevant documents
4. **Synthesis:** Combining findings into comprehensive, cited reports

**Key design choices:**

- DeepResearcher forms outline first, then runs concurrent IterativeResearcher
  instances per section
- Parallel ingestion of 50-60 web pages simultaneously
- Separate synthesizer agent and citations agent in the synthesis flow
- Model selection: o3-mini for planning, gpt-4o-mini for tool use, gpt-4o for
  final writing
- Follows the Plan-Act-Observe (ReAct) loop

**Sources:**
[OpenAI Deep Research Introduction](https://openai.com/index/introducing-deep-research/),
[OpenAI Cookbook](https://cookbook.openai.com/examples/deep_research_api/introduction_to_deep_research_api_agents)

### 7.3 Anthropic Multi-Agent Research System

**Architecture:** Orchestrator-worker pattern with a Lead Researcher agent and
parallel subagents.

**Workflow:**

1. Lead agent analyzes query and develops strategy
2. Lead agent spawns subagents to explore different aspects simultaneously
3. Subagents act as intelligent filters, iteratively using search tools
4. Subagents return findings to lead agent
5. CitationAgent processes documents and report for proper attribution
6. Final report with citations returned to user

**Key design choices:**

- Claude Opus 4 as lead agent, Claude Sonnet 4 as subagents
- 90.2% improvement over single-agent Claude Opus 4
- Token usage explains 80% of performance variance
- Prompt engineering as the primary lever for behavior improvement
- Early failure mode: agents spawning 50 subagents for simple queries (solved
  via prompt tuning)

**Source:**
[Anthropic Engineering Blog](https://www.anthropic.com/engineering/multi-agent-research-system)

### 7.4 STORM (Stanford)

**Architecture:** Multi-perspective question asking with simulated expert
conversations.

**Workflow:**

1. Discover diverse perspectives by mining related articles
2. For each perspective, simulate a conversation between a writer (with that
   perspective) and a topic expert (grounded in internet sources)
3. Each conversation generates focused questions and answers
4. Curate collected information into a multi-level outline
5. Generate the full article following the outline

**Key design choices:**

- Perspective discovery as a decomposition mechanism
- Simulated conversations enable follow-up questions and understanding updates
- Multi-level outlines (sections, subsections, sub-subsections) as the
  integration framework
- Open-source implementation available

**Source:**
[Stanford STORM](https://storm-project.stanford.edu/research/storm/),
[GitHub](https://github.com/stanford-oval/storm)

### 7.5 Together AI Open Deep Research

**Architecture:** Mixture-of-agents (MoA) with specialized LLMs per role.

**Workflow:**

1. Planner (Qwen 72B) decomposes the question and creates research plan
2. Summarizer (Llama 70B) processes long-context web content
3. JSON Extractor (Llama 70B) structures information for workflow robustness
4. Report Writer (DeepSeek-V3) aggregates sources into final report
5. Multiple self-reflection stages for quality

**Key design choices:**

- Different models optimized for different roles (planning vs summarization vs
  writing)
- Self-reflection stages as quality gates
- Fully open-source with dataset, code, and architecture

**Source:** [Together AI Blog](https://www.together.ai/blog/open-deep-research)

### 7.6 LangGraph Open Deep Research

**Architecture:** Graph-based state machine with configurable nodes and edges.

**Key patterns:**

- **Nodes** represent research actions (plan, search, read, synthesize)
- **Edges** represent transitions with conditional logic
- **State** uses TypedDict with reducer functions for concurrent update merging
- **ParallelAgent** handles async complexity for concurrent sub-topic research
- **LoopAgent** manages iterative refinement cycles

**Source:** [LangGraph Framework](https://www.langchain.com/langgraph),
[GitHub](https://github.com/langchain-ai/open_deep_research)

### 7.7 Karpathy's AutoResearch Loop

**Architecture:** Minimal agent loop (630 lines) with single-metric
optimization.

**Pattern (applicable to research):**

1. Agent has access to a single modifiable artifact (the report/script)
2. A single, objectively measurable metric defines quality
3. Fixed time limit per iteration
4. Keep-or-discard decision after each iteration
5. Repeat until convergence or time exhaustion

Over 700 experiments in 2 days, discovering 20 optimizations. The pattern's
power is in its simplicity: tight feedback loop, objective measurement,
automatic keep/discard.

**Source:** [GitHub autoresearch](https://github.com/karpathy/autoresearch)

---

## 8. Planning Integration

### 8.1 Research-to-Planning Pipeline

Research outputs must be structured to feed directly into planning and
decision-making systems. The pipeline:

```
Research Question
  -> Decomposed Sub-Questions
    -> Researched Findings (with confidence)
      -> Synthesized Analysis (with gaps noted)
        -> Diagnosis (what the findings mean)
          -> Decision Points (what choices exist)
            -> Recommendations (what to do)
              -> Plan (how to do it)
```

### 8.2 Making Research Actionable

Research outputs become actionable when they include:

1. **Confidence levels** on each finding (enables risk-calibrated decisions)
2. **Explicit gaps** (tells the planner what is unknown)
3. **Decision-relevant framing** (not just "what is" but "what it means for our
   choices")
4. **Structured data** (JSON alongside prose, so planners can programmatically
   consume findings)
5. **Recommendations with rationale** (bridges the gap between "what we learned"
   and "what to do")

### 8.3 When to Stop Researching and Start Deciding

Research should transition to planning when:

- All critical sub-questions have been answered at sufficient confidence
- Remaining gaps are non-blocking (nice-to-know, not need-to-know)
- Saturation has been reached on the most important topics
- The research has surfaced enough information to differentiate between the
  available options
- Further research would delay the decision past a meaningful deadline

The key signal: **can we make a defensible decision with what we know?** If yes,
stop researching. If no, identify specifically what's missing and target only
that.

### 8.4 Integration Patterns for Claude Code Skills

For a Claude Code skill system, research feeds into planning via:

1. **Research skill** produces a structured findings file (JSONL + summary MD)
2. **Planning skill** reads findings file as input context
3. **Findings include:** answered questions, confidence levels, open questions,
   key decisions to make
4. **Planning skill** uses findings to generate the implementation plan,
   flagging areas where research gaps introduce risk

---

## 9. Design Recommendations for Our System

Based on the analysis above, here are specific recommendations for implementing
research orchestration in a Claude Code skill:

### R1: Use Adaptive Hybrid Execution

Start with parallel breadth-first survey across all sub-topics, then deepen
where coverage is weak. This matches Anthropic's own finding that token spend
explains 80% of quality variance -- the key is spending tokens where they matter
most.

### R2: Implement Progressive Synthesis

Don't wait until all research is complete. After each sub-topic completes,
integrate its findings into the running draft. This catches gaps early and
produces useful partial output on interruption.

### R3: Use File-Based State with JSONL Logs

State files survive compaction and context overflow. Use:

- `research-state.json` -- current status, plan, progress
- `findings.jsonl` -- append-only log of individual findings
- `sources.jsonl` -- append-only log of sources with confidence
- `draft.md` -- progressive synthesis output

### R4: Implement Explicit Stopping Criteria

- Max 3 iterations per sub-topic
- Max 2 full research cycles
- Novelty threshold: stop when < 10% new information for 2 consecutive searches
- Hard token budget cap
- All criteria checked after each phase transition

### R5: Use Outline-First Decomposition

Create the report outline before researching. Map sub-topics to outline
sections. This gives synthesis a clear integration contract and prevents the
"pile of facts" problem.

### R6: Layered Output Format

Produce Layer 1 (executive summary) + Layer 2 (key findings) + Layer 3 (detailed
sections) + Layer 4 (sources). The planning skill consumes Layers 1-2; the user
reads Layer 3; Layer 4 enables verification.

### R7: Track Confidence Explicitly

Every finding should carry a confidence level (high/medium/low or 0.0-1.0). This
enables the planning system to weight findings appropriately and identifies
where more research would have the highest marginal value.

### R8: Bound Agent Count

Anthropic's early failure was agents spawning 50 subagents for simple queries.
For a Claude Code skill (which uses subagent Task tools), bound to 3-5
concurrent research threads maximum. Scale based on question complexity, not a
fixed number.

### R9: Separate Research from Citation

Use a dedicated citation pass after synthesis (as both Anthropic and OpenAI do).
This keeps the research agents focused on finding information, and ensures
citation quality without burdening the research flow.

### R10: Support Resume-from-Checkpoint

Given that Claude Code sessions can hit context limits, the skill must be able
to resume from the last checkpoint. State files make this possible -- on
restart, read state, skip completed sub-topics, continue from where interrupted.

---

## Sources

### Primary (production system architectures)

- [Anthropic: How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
  -- High confidence
- [OpenAI: Introducing deep research](https://openai.com/index/introducing-deep-research/)
  -- High confidence
- [OpenAI Cookbook: Deep Research API](https://cookbook.openai.com/examples/deep_research_api/introduction_to_deep_research_api_agents)
  -- High confidence
- [Google: Gemini Deep Research API Docs](https://ai.google.dev/gemini-api/docs/deep-research)
  -- High confidence
- [Google Cloud: Build a deep research agent with ADK](https://cloud.google.com/blog/products/ai-machine-learning/build-a-deep-research-agent-with-google-adk)
  -- High confidence
- [Stanford STORM Project](https://storm-project.stanford.edu/research/storm/)
  -- High confidence
- [STORM Paper (arXiv 2402.14207)](https://arxiv.org/abs/2402.14207) -- High
  confidence

### Secondary (analysis and implementations)

- [ByteByteGo: How OpenAI, Gemini, and Claude Use Agents to Power Deep Research](https://blog.bytebytego.com/p/how-openai-gemini-and-claude-use)
  -- High confidence
- [Together AI: Open Deep Research](https://www.together.ai/blog/open-deep-research)
  -- High confidence
- [LangChain: Open Deep Research (GitHub)](https://github.com/langchain-ai/open_deep_research)
  -- High confidence
- [LangGraph Framework](https://www.langchain.com/langgraph) -- High confidence
- [Karpathy: autoresearch (GitHub)](https://github.com/karpathy/autoresearch) --
  High confidence
- [OpenAI Agents Deep Research (GitHub)](https://github.com/qx-labs/agents-deep-research)
  -- Medium confidence
- [Perplexity: Introducing Deep Research](https://www.perplexity.ai/hub/blog/introducing-perplexity-deep-research)
  -- High confidence

### Tertiary (academic and theoretical)

- [Multi-Agent Collaboration via Evolving Orchestration (NeurIPS 2025)](https://arxiv.org/abs/2505.19591)
  -- Medium confidence
- [Orchestration of Multi-Agent Systems (2026)](https://arxiv.org/html/2601.13671v1)
  -- Medium confidence
- [Tree-of-Reasoning Question Decomposition (AAAI)](https://ojs.aaai.org/index.php/AAAI/article/view/29928)
  -- High confidence
- [Depth-Breadth Synergy in RLVR](https://arxiv.org/abs/2508.13755) -- Medium
  confidence
- [Google ADK Multi-Agent Patterns](https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/)
  -- High confidence
- [LangGraph State Management Guide](https://sparkco.ai/blog/mastering-langgraph-state-management-in-2025)
  -- Medium confidence
- [LangGraph Multi-Agent Orchestration Analysis](https://latenode.com/blog/ai-frameworks-technical-infrastructure/langgraph-multi-agent-orchestration/langgraph-multi-agent-orchestration-complete-framework-guide-architecture-analysis-2025)
  -- Medium confidence
