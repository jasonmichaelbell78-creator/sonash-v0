# Industry Landscape: AI Deep Research Tools (March 2026)

**Document Version:** 1.0 **Last Updated:** 2026-03-20 **Status:** ACTIVE

---

## Executive Summary

1. **Deep research is now a core product category.** Google, OpenAI, Perplexity,
   and Anthropic all ship production deep research features, converging on a
   shared architectural pattern: decompose query into sub-questions, run
   parallel searches, synthesize with citations, iterate until satisfied. The
   differentiation lies in model quality, source access, and user experience
   design. [Confidence: HIGH]

2. **Open-source alternatives have reached parity.** Tongyi DeepResearch
   (Alibaba), DeerFlow (ByteDance), GPT-Researcher, and LangChain's Open Deep
   Research all demonstrate competitive performance on standardized benchmarks,
   with some outperforming commercial offerings on citation quality and coverage
   metrics. The gap between commercial and open-source is narrowing rapidly.
   [Confidence: HIGH]

3. **Multi-agent architecture is the dominant pattern.** Every serious deep
   research system uses some form of multi-agent orchestration -- a planner/
   coordinator agent that decomposes tasks, specialist agents that execute
   search and analysis, and a synthesizer that produces the final output.
   Single-agent monolithic approaches are being abandoned. [Confidence: HIGH]

4. **Protocol standardization (MCP + A2A) is accelerating.** The Model Context
   Protocol (97M+ monthly SDK downloads) and Agent-to-Agent protocol are now
   both under the Linux Foundation's AAIF, co-founded by all major AI providers.
   This creates a standard integration surface for research tools. [Confidence:
   HIGH]

5. **Citation reliability remains the unsolved hard problem.** Despite advances,
   all systems struggle with confidence calibration, conflicting source
   resolution, and distinguishing authoritative from unreliable sources.
   DeepTRACE and DeepResearchGym represent early formal evaluation frameworks,
   but the field lacks mature solutions. [Confidence: MEDIUM]

---

## Commercial Products

### Google Deep Research (Gemini)

- **How it works:** Powered by Gemini 3 Pro (upgraded to 3.1 Pro for API). Uses
  an agentic planning system that decomposes complex queries into sub-tasks,
  then determines which sub-tasks can run in parallel vs. sequentially. A novel
  asynchronous task manager maintains shared state between the planner and task
  execution models, enabling graceful error recovery without restarting. The
  system iteratively plans investigations -- formulates queries, reads results,
  identifies knowledge gaps, and searches again. Can browse up to hundreds of
  websites, plus Gmail, Drive, and Chat with user authorization.
- **API architecture:** Uses the Interactions API (not `generate_content`),
  which is asynchronous and polling-based (`background=true` required). Tasks
  take 2-15 minutes. Supports stateful multi-turn workflows with server-side
  conversation history. Interaction chaining via `previous_interaction_id`
  allows follow-up research without re-running the entire workflow. Paid tiers
  retain state for 55 days.
- **Strengths:** Multimodal reasoning (text, images, other media integrated via
  Gemini's native multimodality), access to Google's proprietary search
  infrastructure, deep integration with Google Workspace, mature async API.
- **Limitations:** Tied to Google's ecosystem. Asynchronous-only API adds
  complexity. Extended execution times (2-15 min) make it unsuitable for
  real-time applications. Free tier retains interaction data for only 1 day.
- **Key innovation:** The asynchronous Interactions API with stateful context
  management and interaction chaining, plus native multimodal source processing.
  [Confidence: HIGH]

### OpenAI Deep Research

- **How it works:** Built on o3-deep-research (and o4-mini-deep-research),
  models trained via end-to-end reinforcement learning in simulated research
  environments with tool access. The model learned to plan and execute
  multi-step search trajectories, backtrack when paths are unfruitful, and pivot
  strategies based on new information. Follows the ReAct (Plan-Act-Observe)
  paradigm. Employs a multi-agent pipeline: triage agent evaluates query
  complexity, clarifier agent requests missing context, instruction agent
  enriches the prompt, and research agent executes the investigation.
- **Clarification flow:** Unlike competitors, OpenAI defaults to an interactive
  clarification step -- the agent may ask the user follow-up questions to refine
  scope before beginning research. This improves output relevance but adds
  latency.
- **Strengths:** Strong reasoning chains (hundreds of steps without diverging),
  code interpreter integration for data analysis, MCP connector support for
  custom data sources, ability to process images and PDFs during research.
  Research sessions can run up to 30 minutes for complex topics.
- **Limitations:** Expensive (Pro tier required for full features). The
  clarification step adds friction for straightforward queries. May struggle to
  distinguish authoritative from speculative sources. Available to Pro, Plus,
  and Team users only.
- **Key innovation:** RL-trained browsing model that learned research strategies
  from scratch (backtracking, pivoting, paywall workarounds), plus the
  clarification-first interaction pattern. [Confidence: HIGH]

### Perplexity Pro Search / Deep Research

- **How it works:** Employs autonomous multi-step research with probabilistic
  reasoning models. The system interprets the query, formulates a detailed
  research plan, conducts dozens of parallel web searches, cross-references
  findings for accuracy, and synthesizes into comprehensive reports with
  executive summaries, key insights, timelines, and recommendations. Uses the
  Sonar architecture internally, with Deep Research integrated into Sonar's
  pipeline since April 2025.
- **Model Council (Max tier):** Three frontier models (including GPT-4 and
  Claude) work on queries simultaneously, providing multi-perspective analysis.
- **Strengths:** Speed and accessibility -- available even on free plan for
  basic Deep Research. Strong benchmarks on Google DeepMind Deep Search QA and
  Scale AI Research Rubric (outperforms competitors on accuracy and
  reliability). Multi-model approach reduces single-model blind spots.
- **Limitations:** Less depth on individual sources compared to OpenAI's
  approach. Source access limited to publicly available web content. Model
  Council only available on Max tier.
- **Key innovation:** Multi-model council approach where multiple frontier
  models independently analyze the same query, plus tight integration of deep
  research into their core Sonar search architecture. [Confidence: HIGH]

### Claude Research (Anthropic)

- **How it works:** Uses a clearly defined multi-agent architecture with an
  orchestrator/lead agent responsible for overall research strategy. The
  orchestrator receives the query, creates a plan, breaks it into smaller
  pieces, and delegates to multiple sub-agents. Research mode (beta) breaks
  complex questions into simpler concepts and spends 5-45 minutes collecting
  relevant data, producing comprehensive reports with citations. Integrates with
  Google Workspace (Gmail, Calendar, Docs) and 10+ third-party connectors (Jira,
  Confluence, Zapier, etc.).
- **Strengths:** Extended context window (1M tokens with Opus 4.6), strong
  planning and debugging capabilities, 14.5-hour task completion time horizon,
  broad integration surface via MCP and Integrations feature.
- **Limitations:** Research mode still in beta, limited to Max/Team/Enterprise
  plans. Available in US, Japan, and Brazil only. Newer entrant compared to
  Google and OpenAI.
- **Key innovation:** The MCP-based integration architecture allowing research
  across both web and user's own tools/services, plus the longest agentic time
  horizon (14.5 hours) of any commercial offering. [Confidence: HIGH]

### Elicit

- **How it works:** Specialized academic research assistant that searches 138M+
  academic papers and 545K+ clinical trials using semantic search. Users type a
  research question; Elicit searches, finds relevant papers, extracts data
  points, and generates structured reports with sentence-level citations.
  Achieves 94-99% accuracy in data extraction for biomedicine, ML, and social
  sciences.
- **Recent advances (2025-2026):** API for programmatic access (March 2026),
  Research Agents for competitive/research landscape exploration (December
  2025), Keyword Search for Systematic Reviews across Elicit + PubMed +
  ClinicalTrials.gov (October 2025), reports up to 80 papers (December 2025).
- **Strengths:** Domain specialization for academic research. All claims backed
  by sentence-level citations from source papers. Claims to reduce systematic
  review time by 80%. Can analyze up to 20,000 data points at once.
- **Limitations:** Limited to academic papers -- no general web research.
  Requires paid plan for serious use. Less useful for non-academic research
  questions.
- **Key innovation:** Sentence-level citation provenance from a curated academic
  corpus, plus systematic review automation. [Confidence: HIGH]

### Consensus

- **How it works:** AI search engine built exclusively on a corpus of 200M+
  academic papers and book chapters. Combines semantic AI embeddings with
  keyword search, blended with citation counts, recency, and journal reputation
  signals. The unique "Consensus Meter" analyzes whether papers support, oppose,
  or remain neutral on a query topic.
- **Strengths:** Zero hallucination risk for sources (AI is applied only after
  searching real academic literature). Direct clickable citations to original
  papers. Recently added Deep Research capabilities for multi-study synthesis.
  Pro Analysis synthesizes findings across multiple papers.
- **Limitations:** Strictly academic corpus -- no web, news, or non-scholarly
  sources. Less useful for emerging topics not yet in academic literature.
- **Key innovation:** The Consensus Meter providing quick visual assessment of
  scientific consensus on contested topics. [Confidence: HIGH]

### Semantic Scholar (AI2)

- **How it works:** Free academic search engine from the Allen Institute for AI,
  indexing 214M+ papers. Uses AI to generate automatic TLDR summaries, classify
  citations, and provide an "Ask This Paper" feature for interactive Q&A with
  individual papers. Semantic Reader provides augmented reading experiences.
  Research Feeds deliver personalized content recommendations.
- **Strengths:** Completely free (including API). Robust public REST API (1 RPS
  with key). Massive paper database. AI-powered citation classification goes
  beyond simple counts.
- **Limitations:** Focused on search and discovery rather than synthesis. No
  deep research report generation. Limited to academic papers.
- **Key innovation:** Citation classification (understanding how papers cite
  each other, not just that they do) and the free, robust API. [Confidence:
  HIGH]

---

## Open-Source Frameworks

### STORM (Stanford)

- **How it works:** Synthesis of Topic Outlines through Retrieval and
  Multi-perspective Question Asking. Uses a multi-agent system that simulates a
  team of experts. Two-stage pipeline: (1) Pre-writing stage discovers diverse
  perspectives, simulates conversations where writers with different viewpoints
  pose questions to a topic expert grounded on Internet sources, curates
  collected information into an outline. (2) Writing stage generates the
  full-length article from the outline and references, with citations.
- **Perspective-guided approach:** Discovers relevant perspectives by surveying
  existing articles on similar topics, then uses those perspectives to drive the
  question-asking process. Simulates a Wikipedia writer / topic expert
  conversation to iteratively deepen understanding.
- **Co-STORM extension:** Enables human collaboration with the LLM system for
  aligned information seeking and knowledge curation.
- **Evaluation:** Evaluated on FreshWiki (curated recent Wikipedia articles).
  25% improvement in organization and 10% in coverage over outline-driven RAG
  baselines.
- **Strengths:** Elegant multi-perspective architecture, strong academic
  grounding, open to the public for free.
- **Limitations:** Research prototype, not production-ready. Wikipedia-style
  output format may not suit all use cases. Quality depends heavily on
  underlying LLM.
- **Key innovation:** Perspective-guided question asking -- systematically
  exploring a topic from multiple viewpoints rather than a single linear path.
  [Confidence: HIGH]
- **Repository:** https://github.com/stanford-oval/storm

### GPT-Researcher

- **How it works:** Open-source autonomous research agent using a planner/
  execution architecture. The planner generates research questions from a user
  query, crawler agents gather information from 20+ web sources in parallel, and
  a publisher aggregates findings into a comprehensive report with source
  tracking. Deep Research mode uses a tree-like exploration pattern, diving
  deeper into subtopics while maintaining comprehensive coverage.
- **Performance:** Carnegie Mellon University's DeepResearchGym (May 2025)
  evaluated leading systems on 1,000 complex queries -- GPT-Researcher
  outperformed Perplexity, OpenAI, OpenDeepSearch, and HuggingFace on citation
  quality, report quality, and information coverage.
- **Strengths:** Model-agnostic (works with any LLM provider), researches both
  web and local documents, Apache-2.0 license, 25.7K GitHub stars, predates the
  deep research wave by nearly two years (created May 2023).
- **Limitations:** Quality varies significantly based on underlying LLM.
  Requires API keys for search providers. No built-in multimodal capabilities.
- **Key innovation:** Tree-like recursive exploration pattern for subtopic
  discovery, plus the earliest open-source implementation that influenced the
  entire category. [Confidence: HIGH]
- **Repository:** https://github.com/assafelovic/gpt-researcher

### DeerFlow (ByteDance)

- **How it works:** SuperAgent harness built on LangGraph and LangChain that
  orchestrates sub-agents, memory, and sandboxes. A lead agent acts as project
  manager, decomposing tasks and spawning sub-agents. Operates in an isolated
  Docker-based sandbox with a real filesystem, bash terminal, and code execution
  capabilities.
- **Persistent memory:** Builds a cross-session memory of user profile,
  preferences, and accumulated knowledge. Stored locally under user control.
- **DeerFlow 2.0 (Feb 2026):** Claimed #1 on GitHub Trending, approximately
  25,000 stars and 3,000 forks. Model-agnostic (any OpenAI-compatible API).
- **Strengths:** Production-quality sandboxed execution environment, persistent
  memory system, model-agnostic, extensive sub-agent orchestration. Has expanded
  beyond research into data pipelines, dashboards, content workflows.
- **Limitations:** Docker dependency adds operational complexity. Heavy resource
  requirements for sandboxed execution. Relatively new (v2.0 in Feb 2026).
- **Key innovation:** Full sandboxed execution environment (filesystem + bash +
  code execution) combined with persistent cross-session memory -- goes beyond
  pure research into general-purpose agentic work. [Confidence: HIGH]
- **Repository:** https://github.com/bytedance/deer-flow

### Tongyi DeepResearch (Alibaba)

- **How it works:** First fully open-source Web Agent to match OpenAI's
  DeepResearch performance. Uses a mixture-of-experts (MoE) model with 30.5B
  total parameters but only 3.3B active per token, enabling high throughput.
  128K token context length for long browsing sessions. Three-stage training
  pipeline: Agentic Continual Pre-training (CPT), Supervised Fine-Tuning (SFT),
  and Reinforcement Learning (RL).
- **Two inference modes:** ReAct Mode (Thought-Action-Observation loop for
  straightforward benchmarking) and Heavy Mode (IterResearch paradigm, breaks
  research into discrete rounds with reconstructed focused workspaces per
  round).
- **Benchmarks:** 75 on xbench-DeepSearch, 32.9 on Humanity's Last Exam, 43.4 on
  BrowseComp, 72.2 on WebWalkerQA, 70.9 on GAIA, 90.6 on FRAMES -- outperforming
  OpenAI o3 and Deepseek-V3.1 on several benchmarks.
- **Real-world applications:** Powers Gaode Mate (Map & Navigation Agent) and
  Tongyi FaRui (Legal Research Agent).
- **Strengths:** Fully open-source (model + framework + data pipeline), MoE
  efficiency (only 3.3B active params), benchmark-competitive with commercial
  systems. Highly scalable automatic data synthesis pipeline.
- **Limitations:** Relatively new, community ecosystem still developing. Heavy
  Mode adds latency. Chinese-language documentation/community as primary.
- **Key innovation:** MoE architecture achieving commercial-parity performance
  at a fraction of compute cost, plus the IterResearch paradigm with per-round
  workspace reconstruction. [Confidence: HIGH]
- **Repository:** https://github.com/Alibaba-NLP/DeepResearch

### LangChain Open Deep Research

- **How it works:** Built on LangGraph's StateGraph abstraction. Implements
  multi-agent architecture that isolates sub-topic research into dedicated
  context windows before synthesizing findings into coherent reports. Uses
  supervisor agent pattern with planner, independent research units, and
  observer for context maintenance.
- **Strengths:** Leverages the mature LangChain/LangGraph ecosystem. Strong
  integration with LangSmith for observability. Well-documented patterns.
  10,000+ GitHub stars.
- **Limitations:** Depends on LangChain ecosystem. Performance tied to
  underlying LLM choice. More of a reference implementation than production
  system.
- **Key innovation:** Clean separation of sub-topic research into isolated
  context windows, preventing cross-contamination between research threads.
  [Confidence: MEDIUM]

### CrewAI Research Patterns

- **How it works:** Framework for orchestrating role-playing autonomous AI
  agents. Research crews typically include Manager agents (task distribution),
  Researcher agents (information gathering), Writer agents (synthesis), and
  Editor agents (quality review). Supports YAML configuration for agent
  definitions. Execution models include sequential, parallel, and conditional
  processing. CrewAI Flows enable event-driven orchestration.
- **Strengths:** Clean role-based abstraction mirrors real research teams.
  Hierarchical coordination with authority levels. Memory functions for
  cross-session learning. Reported 70% reduction in content production time.
- **Limitations:** Higher-level abstraction means less fine-grained control than
  LangGraph. Best practices recommend starting with 2-3 agents before scaling.
  Still maturing for production use.
- **Key innovation:** Role-playing agent paradigm with hierarchical authority --
  senior agents can override juniors and redistribute resources based on quality
  metrics. [Confidence: MEDIUM]
- **Repository:** https://github.com/crewAIInc/crewAI

---

## Cross-Cutting Architectural Patterns

### Common Architecture: The Deep Research Pipeline

Every system studied follows a variation of this pipeline:

```
Query -> [Clarify/Decompose] -> [Plan] -> [Search (parallel)] -> [Read/Analyze]
   -> [Identify Gaps] -> [Iterate] -> [Synthesize] -> [Cite] -> [Output]
```

### Pattern Comparison Matrix

| Pattern                | Google Gemini   | OpenAI          | Perplexity      | Claude           | GPT-Researcher  | STORM              | DeerFlow        | Tongyi           |
| ---------------------- | --------------- | --------------- | --------------- | ---------------- | --------------- | ------------------ | --------------- | ---------------- |
| Query decomposition    | Automatic       | After clarify   | Automatic       | Automatic        | Planner agent   | Perspective-driven | SuperAgent      | IterResearch     |
| Parallel search        | Yes             | Yes             | Yes (dozens)    | Yes              | 20+ sources     | Multi-perspective  | Sub-agents      | Per-round        |
| Source verification    | Cross-reference | RL-learned      | Probabilistic   | Multi-agent      | Parallel crawl  | Expert grounding   | Sandboxed       | MoE reasoning    |
| Citation approach      | Inline + report | Inline + report | Inline + report | Inline + report  | Source tracking | Academic refs      | Source tracking | xbench scored    |
| Conflict resolution    | Implicit        | Noted in output | Multi-model     | Orchestrator     | Aggregation     | Multi-perspective  | Memory          | IterResearch     |
| Breadth vs depth       | Async manager   | 30-min sessions | Parallel burst  | 5-45 min         | Tree-like       | Perspective fan    | Task levels     | Discrete rounds  |
| Iterative refinement   | Gap-and-search  | Backtrack/pivot | Cross-ref       | Sub-agent loop   | Recursive tree  | Conversation sim   | Sub-agent       | Round-based      |
| Code execution         | Limited         | Python sandbox  | Limited         | Via tools        | No              | No                 | Docker sandbox  | Via tools        |
| Multimodal             | Native          | Images + PDFs   | Text-primary    | Via integrations | Text-primary    | Text-primary       | Via sandbox     | Text-primary     |
| Confidence/uncertainty | Implicit        | Implicit        | Implicit        | Implicit         | Implicit        | Not addressed      | Not addressed   | Benchmark-scored |

### How Systems Decompose Research Questions

**Automatic decomposition** (Google, Perplexity, Claude): The model analyzes the
query and generates sub-questions internally without user input. Fastest
time-to-first-result but may miss the user's actual intent.

**Interactive clarification** (OpenAI): Asks the user follow-up questions before
beginning research. Better alignment but adds latency and friction.

**Perspective-guided decomposition** (STORM): Discovers diverse perspectives
from existing literature on similar topics, then generates questions from each
perspective. Most thorough but most computationally expensive.

**Tree-like recursive decomposition** (GPT-Researcher): Generates initial
sub-questions, then recursively decomposes promising branches. Good balance of
depth and breadth.

### How Systems Handle Source Verification and Citation

All systems use some form of inline citation, but approaches differ:

- **Elicit and Consensus** lead on citation integrity by starting from curated
  academic corpora (hallucination risk effectively eliminated at the source
  level)
- **OpenAI's RL training** teaches the model to pivot when encountering paywalls
  or unreliable sources, but verification is implicit in the model's learned
  behavior rather than a separate step
- **Perplexity's multi-model council** provides cross-verification through
  independent model agreement
- **STORM's expert-grounded conversations** verify claims against Internet
  sources during the simulated conversation phase
- **DeepTRACE** (research tool) represents the state of the art in formal
  citation auditing: statement-level decomposition, confidence scoring, and
  citation + factual-support matrices

### How Systems Handle Conflicting Information

This remains a weakness across the industry. Most systems either:

1. Present the conflict and note it (OpenAI does this best)
2. Implicitly favor higher-authority sources without explaining
3. Average across sources, potentially losing important nuance

No system provides formal confidence intervals or probability distributions over
conflicting claims. This is a clear opportunity area. [Confidence: HIGH]

---

## Emerging Trends

### 1. Multi-Agent Architecture Is Now Standard

Gartner reports a 1,445% surge in multi-agent system inquiries from Q1 2024 to
Q2 2025. Every production deep research system uses multi-agent orchestration.
The pattern is converging on: Orchestrator + Specialist Workers + Synthesizer.
2026 is expected to be the year multi-agent systems move fully into production.
[Confidence: HIGH]

### 2. Protocol Standardization (MCP + A2A)

MCP (Anthropic, November 2024) has crossed 97M monthly SDK downloads and been
adopted by every major AI provider. A2A (Google, April 2025) standardizes
inter-agent communication. Both are now under the Linux Foundation's AAIF
(co-founded by OpenAI, Anthropic, Google, Microsoft, AWS, and Block in December
2025). This creates a universal integration surface for research tools to
connect to external data sources and to each other. [Confidence: HIGH]

### 3. Agentic Research Loops With Code Execution

The most capable systems now integrate code execution into research workflows.
OpenAI's Deep Research includes a Python code interpreter for data analysis.
DeerFlow provides full Docker-based sandboxed execution. This enables research
that goes beyond text retrieval into quantitative analysis, data visualization,
and computational verification of claims. [Confidence: HIGH]

### 4. Open-Source Catching Up Fast

Tongyi DeepResearch matches or exceeds commercial systems on multiple benchmarks
with only 3.3B active parameters (MoE). DeerFlow 2.0 trended #1 on GitHub.
GPT-Researcher outperformed commercial tools in CMU's DeepResearchGym. The
agentic AI market is projected to grow from $7.8B to $52B by 2030, and
open-source tools are capturing significant share. [Confidence: HIGH]

### 5. Formal Evaluation Frameworks Emerging

DeepResearchGym (CMU) and DeepResearch Bench (100 PhD-level tasks across 22
fields) represent the first serious attempts at standardized evaluation.
DeepTRACE provides formal citation auditing. These frameworks will drive quality
improvements across the industry. [Confidence: MEDIUM]

### 6. Multimodal Research Is Still Early

While Gemini natively processes images, video, and documents, and OpenAI can
handle images and PDFs, most open-source research agents remain text-primary.
This is a clear gap that will close in 2026-2027 as vision-language models
mature. [Confidence: MEDIUM]

### 7. Persistent Memory and Personalization

DeerFlow's cross-session memory and Perplexity's "AI that actually listens"
represent an emerging pattern where research agents learn user preferences,
domain expertise, and writing style over time. This enables increasingly
personalized and relevant research outputs. [Confidence: MEDIUM]

---

## Implications for Our Design

Based on this landscape analysis, the following principles should guide the
design of our deep-research skill for the Claude Code environment:

### Architecture Decisions

1. **Multi-agent decomposition is non-negotiable.** Every successful system uses
   it. Our skill should decompose queries into sub-questions and research them
   in parallel (or at least in isolated context windows).

2. **Adopt the plan-search-verify-synthesize-iterate loop.** This is the proven
   pattern. Build it as an explicit state machine rather than relying on a
   single LLM call to handle everything.

3. **Interactive clarification should be optional.** OpenAI's approach of asking
   before researching improves quality but adds friction. Make it configurable
   -- default to automatic decomposition for simple queries, offer clarification
   for ambiguous ones.

4. **Leverage MCP for data source integration.** The protocol is universal and
   mature. Use MCP connectors for web search, academic databases, and user tools
   rather than building custom integrations.

### Differentiation Opportunities

5. **Invest in conflict detection and confidence scoring.** This is the
   industry's biggest gap. Even basic "sources disagree on X" detection with
   explicit confidence levels (HIGH/MEDIUM/LOW) would surpass what most systems
   offer.

6. **STORM's perspective-guided questioning is underutilized.** Most systems
   decompose linearly. Exploring from multiple perspectives produces better
   coverage. Consider incorporating this pattern.

7. **Code execution for verification.** Following OpenAI and DeerFlow, allow the
   research agent to write and execute code to verify quantitative claims,
   perform calculations, or analyze data. Claude Code already has this
   capability -- leverage it.

8. **Citation provenance at the claim level.** Elicit's sentence-level citations
   and DeepTRACE's statement-level analysis represent the gold standard.
   Per-claim citation linking (not just per-paragraph) should be a design goal.

### Practical Constraints for Claude Code Context

9. **Token budget management is critical.** Deep research generates enormous
   amounts of intermediate text. STORM's isolated context windows and Tongyi's
   per-round workspace reconstruction both address this -- research sub-topics
   in separate agent contexts, then synthesize only the distilled findings.

10. **Output format should be structured and reusable.** Research reports should
    be markdown with structured metadata (confidence levels, source URLs, claim
    provenance) that downstream skills can consume programmatically.

11. **Progress streaming matters.** Both Google and OpenAI stream intermediate
    progress events. For tasks that take 5-45 minutes, visible progress prevents
    user abandonment and enables early course correction.

12. **Iterative depth control.** Let the user set research depth (quick scan vs.
    deep investigation) similar to how Perplexity differentiates between regular
    and Deep Research modes.

---

## Sources

### Commercial Products

- [Gemini Deep Research Overview](https://gemini.google/overview/deep-research/)
  [HIGH]
- [Gemini Deep Research API Docs](https://ai.google.dev/gemini-api/docs/deep-research)
  [HIGH]
- [Gemini Deep Research API in Production (Medium)](https://medium.com/google-cloud/how-to-use-the-gemini-deep-research-api-in-production-978055873a39)
  [HIGH]
- [Build with Gemini Deep Research (Google Blog)](https://blog.google/technology/developers/deep-research-agent-gemini-api/)
  [HIGH]
- [Introducing Deep Research (OpenAI)](https://openai.com/index/introducing-deep-research/)
  [HIGH]
- [OpenAI Deep Research API Guide](https://developers.openai.com/api/docs/guides/deep-research)
  [HIGH]
- [o3-deep-research Model Docs](https://developers.openai.com/api/docs/models/o3-deep-research)
  [HIGH]
- [How OpenAI's Deep Research Works (PromptLayer)](https://blog.promptlayer.com/how-deep-research-works/)
  [HIGH]
- [OpenAI Deep Research System Card (PDF)](https://cdn.openai.com/deep-research-system-card.pdf)
  [HIGH]
- [OpenAI Deep Research API Cookbook](https://cookbook.openai.com/examples/deep_research_api/introduction_to_deep_research_api)
  [HIGH]
- [How OpenAI, Gemini, and Claude Use Agents (ByteBytego)](https://blog.bytebytego.com/p/how-openai-gemini-and-claude-use)
  [HIGH]
- [Perplexity Deep Research vs OpenAI (ClickIT)](https://www.clickittech.com/ai/perplexity-deep-research-vs-openai-deep-research/)
  [MEDIUM]
- [Perplexity Deep Research (InfoQ)](https://www.infoq.com/news/2025/02/perplexity-deep-research/)
  [HIGH]
- [Perplexity Sonar Deep Research Docs](https://docs.perplexity.ai/getting-started/models/models/sonar-deep-research)
  [HIGH]
- [Perplexity March 2026 Updates](https://theagencyjournal.com/whats-new-in-perplexity-this-march-multi-model-magic-smarter-research-and-ai-that-actually-listens/)
  [MEDIUM]
- [Anthropic Research Search Capability (MLQ)](https://mlq.ai/news/anthropic-adds-advanced-research-search-capability-to-claude/)
  [HIGH]
- [Anthropic Integrations Update (SiliconANGLE)](https://siliconangle.com/2025/05/01/anthropic-updates-claude-new-integrations-feature-upgraded-research-tool/)
  [HIGH]
- [Anthropic's 2026 Launches (Medium)](https://fazal-sec.medium.com/anthropics-explosive-start-to-2026-everything-claude-has-launched-and-why-it-s-shaking-up-the-668788c2c9de)
  [MEDIUM]
- [How Scientists Use Claude for Research (Anthropic)](https://www.anthropic.com/news/accelerating-scientific-research)
  [HIGH]
- [Elicit: AI for Scientific Research](https://elicit.com/) [HIGH]
- [Elicit Review 2025 (SkyWork)](<https://skywork.ai/skypage/en/Elicit-AI-Review-(2025)-The-Ultimate-Guide-to-the-AI-Research-Assistant/1974387953557499904>)
  [MEDIUM]
- [Elicit vs Consensus 2026 (PaperGuide)](https://paperguide.ai/blog/elicit-vs-consensus/)
  [MEDIUM]
- [Consensus: AI for Research](https://consensus.app/) [HIGH]
- [Consensus AI Review 2025 (Effortless Academic)](https://effortlessacademic.com/consensus-ai-review-for-literature-reviews/)
  [MEDIUM]
- [Semantic Scholar](https://www.semanticscholar.org/) [HIGH]
- [Semantic Scholar Review 2026 (AgentAya)](https://agentaya.com/ai-review/semantic-scholar/)
  [MEDIUM]

### Open-Source Frameworks

- [STORM GitHub Repository](https://github.com/stanford-oval/storm) [HIGH]
- [STORM Research Project (Stanford)](https://storm-project.stanford.edu/research/storm/)
  [HIGH]
- [GPT-Researcher GitHub Repository](https://github.com/assafelovic/gpt-researcher)
  [HIGH]
- [GPT-Researcher Official Page](https://gptr.dev/) [HIGH]
- [DeerFlow GitHub Repository](https://github.com/bytedance/deer-flow) [HIGH]
- [DeerFlow 2.0 (MarkTechPost)](https://www.marktechpost.com/2026/03/09/bytedance-releases-deerflow-2-0-an-open-source-superagent-harness-that-orchestrates-sub-agents-memory-and-sandboxes-to-do-complex-tasks/)
  [HIGH]
- [Tongyi DeepResearch GitHub](https://github.com/Alibaba-NLP/DeepResearch)
  [HIGH]
- [Tongyi DeepResearch Introduction](https://tongyi-agent.github.io/blog/introducing-tongyi-deep-research/)
  [HIGH]
- [Tongyi DeepResearch (VentureBeat)](https://venturebeat.com/ai/the-deepseek-moment-for-ai-agents-is-here-meet-alibabas-open-source-tongyi)
  [HIGH]
- [Tongyi DeepResearch Technical Report (arXiv)](https://arxiv.org/html/2510.24701v1)
  [HIGH]
- [Open Deep Research (Together AI)](https://www.together.ai/blog/open-deep-research)
  [MEDIUM]
- [Top 5 Open-Source Alternatives (Simular AI)](https://www.simular.ai/blogs/top-5-open-source-alternatives-for-openais-deep-research)
  [MEDIUM]
- [LangGraph: Agent Orchestration Framework](https://www.langchain.com/langgraph)
  [HIGH]
- [LangGraph Deep Research Agent (Towards Data Science)](https://towardsdatascience.com/langgraph-101-lets-build-a-deep-research-agent/)
  [MEDIUM]
- [LangChain Deep Agents Overview](https://docs.langchain.com/oss/python/deepagents/overview)
  [MEDIUM]
- [Exa Multi-Agent System with LangGraph](https://blog.langchain.com/exa/)
  [HIGH]
- [CrewAI Framework](https://crewai.com/) [HIGH]
- [CrewAI GitHub Repository](https://github.com/crewAIInc/crewAI) [HIGH]
- [CrewAI Framework 2025 Review (Latenode)](https://latenode.com/blog/ai-frameworks-technical-infrastructure/crewai-framework/crewai-framework-2025-complete-review-of-the-open-source-multi-agent-ai-platform)
  [MEDIUM]

### Trends and Analysis

- [Agentic AI Trends 2026 (MachineLearningMastery)](https://machinelearningmastery.com/7-agentic-ai-trends-to-watch-in-2026/)
  [MEDIUM]
- [AI Research Landscape 2026 (Adaline Labs)](https://labs.adaline.ai/p/the-ai-research-landscape-in-2026)
  [MEDIUM]
- [Agentic AI Trends (AIMultiple)](https://research.aimultiple.com/agentic-ai-trends/)
  [MEDIUM]
- [AI Tech Trends 2026 (IBM)](https://www.ibm.com/think/news/ai-tech-trends-predictions-2026)
  [HIGH]
- [MCP vs A2A Guide 2026 (DEV Community)](https://dev.to/pockit_tools/mcp-vs-a2a-the-complete-guide-to-ai-agent-protocols-in-2026-30li)
  [MEDIUM]
- [Model Context Protocol (Wikipedia)](https://en.wikipedia.org/wiki/Model_Context_Protocol)
  [HIGH]

### Evaluation and Benchmarks

- [DeepResearchGym (arXiv)](https://arxiv.org/abs/2505.19253) [HIGH]
- [DeepResearch Bench](https://deepresearch-bench.github.io/) [HIGH]
- [DeepTRACE: Auditing Deep Research AI (arXiv)](https://arxiv.org/html/2509.04499v1)
  [HIGH]
- [Citation Verification with AI (arXiv)](https://arxiv.org/html/2511.16198v1)
  [MEDIUM]

---

## Version History

| Version | Date       | Changes               |
| ------- | ---------- | --------------------- |
| 1.0     | 2026-03-20 | Initial research pass |
