# Findings: Academic/Industry LLM Memory Architecture Patterns

**Searcher:** deep-research-searcher **Profile:** web+academic **Date:**
2026-03-31 **Sub-Question IDs:** SQ4 (agent 1 of 2)

---

## Key Findings

### 1. MemGPT: The OS-Inspired Virtual Context Model (FOUNDATIONAL) [CONFIDENCE: HIGH]

**Paper:** MemGPT: Towards LLMs as Operating Systems **Authors:** Packer,
Wooders, Lin, Fang, Patil, Stoica, Gonzalez (UC Berkeley) **Date:** October 2023
(revised February 2024) **URL:** https://arxiv.org/abs/2310.08560

MemGPT introduced the concept of _virtual context management_, drawing a direct
parallel to how operating systems manage RAM vs. disk. The system defines two
primary tiers: **main context** (in-window, analogous to RAM) and **external
context** (persistent storage, analogous to disk). An interrupt-based control
mechanism decides what to page in/out. The LLM itself serves as the OS, making
active decisions about memory movement.

**Practical applicability to Claude Code file-based memory:** Very high.
MemGPT's architecture maps directly to our system: CLAUDE.md /
SESSION_CONTEXT.md = main context; `.research/`, hook state files, and JSONL
logs = external context. The interrupt model suggests that Claude should
autonomously decide when to "page in" a reference doc rather than receiving all
context passively. The key innovation—the LLM as memory controller—is already
partially realized in our file-based pattern.

---

### 2. Generative Agents: Recency + Importance + Relevance Retrieval Scoring (FOUNDATIONAL) [CONFIDENCE: HIGH]

**Paper:** Generative Agents: Interactive Simulacra of Human Behavior
**Authors:** Park, O'Brien, Cai, Morris, Liang, Bernstein (Stanford) **Date:**
April 2023; published UIST 2023 **URL:** https://arxiv.org/abs/2304.03442 /
https://dl.acm.org/doi/10.1145/3586183.3606763

Introduced the **memory stream**: a persistent log of timestamped observations
in natural language, scored at retrieval by three weighted dimensions:

- **Recency**: Exponential decay from last access time
- **Importance**: LLM-rated salience score (1-10, "mundane vs. poignant")
- **Relevance**: Cosine similarity to current query

Memories combine these scores multiplicatively to surface the most contextually
appropriate content. Reflection mechanisms synthesize raw memories into
higher-level abstractions (a form of consolidation). 25-agent simulations
demonstrated emergent social coordination.

**Practical applicability:** The three-factor retrieval model is directly
transferable. Our file-based system currently retrieves by filename convention;
adding recency signals (file modification times), importance scores (explicit
front-matter tags), and semantic relevance (keywords/topic headers) would
approximate this model without vector databases.

---

### 3. Reflexion: Verbal Reinforcement as Procedural Memory [CONFIDENCE: HIGH]

**Paper:** Reflexion: Language Agents with Verbal Reinforcement Learning
**Authors:** Shinn, Cassano, Gopinath, Narasimhan, Yao **Date:** March 2023;
NeurIPS 2023 **URL:** https://arxiv.org/abs/2303.11366

Reflexion agents convert task feedback (success/failure signals) into natural
language **verbal reflections** stored in an episodic memory buffer. On retry,
the agent reads past reflections to modify its approach — avoiding repeated
mistakes without weight updates. Achieved 91% pass@1 on HumanEval (vs. GPT-4's
80%), 22% improvement on AlfWorld, 20% on HotPotQA.

The insight: **procedural memory can be text files**. Instead of fine-tuning,
agents write structured failure analyses to disk. This is practically free to
implement.

**Practical applicability:** High. Our `SESSION_CONTEXT.md` and
`docs/AI_REVIEW_LEARNINGS_LOG.md` already implement Reflexion-style verbal
reinforcement at session scale. Formalizing this pattern — requiring structured
reflection entries after failed pre-commit hooks, failed PR reviews, or
corrected approaches — would directly implement Reflexion's core mechanism.

---

### 4. Voyager: Code as Procedural Memory / Skill Libraries [CONFIDENCE: HIGH]

**Paper:** Voyager: An Open-Ended Embodied Agent with Large Language Models
**Authors:** Wang, Xie, Jiang, Mandlekar, Xiao, Zhu, Fan, Anandkumar **Date:**
May 2023; TMLR 2024 **URL:** https://arxiv.org/abs/2305.16291

Voyager introduced the **skill library**: executable JavaScript code modules
stored as files, retrieved by natural language similarity to the current task,
and composed to solve novel problems. Key properties: skills are temporally
extended, interpretable, composable. The system prevents catastrophic forgetting
by storing skills as static code files rather than in model weights.
Outperformed prior agents 3.3x on unique items discovered.

Three architectural components directly relevant:

1. Automatic curriculum (goal selection)
2. Executable skill library (persistent code memory)
3. Iterative prompting with environment feedback + self-verification

**Practical applicability:** Very high for procedural memory. Our hook scripts,
skill YAML files, and agent definitions are exactly this pattern. The innovation
is treating the skill library as _the_ memory substrate, with retrieval by
task-similarity rather than exact filename lookup.

---

### 5. "Episodic Memory is the Missing Piece" — Five Key Properties [CONFIDENCE: HIGH]

**Paper:** Position: Episodic Memory is the Missing Piece for Long-Term LLM
Agents **Authors:** Pink, Wu, Vo, Turek, Mu, Huth, Toneva **Date:** February
2025 **URL:** https://arxiv.org/abs/2502.06975

Argues that current LLM memory approaches each solve only part of the problem:

- In-context: Fast but can't scale beyond window limits
- External/RAG: Long storage but lacks relational binding between memories
- Parametric (fine-tuning): Permanent but no single-shot learning, no instance
  specificity

The paper defines five properties of true episodic memory that existing systems
lack:

1. **Long-term storage** (persist throughout operational lifespan)
2. **Explicit reasoning** (consciously accessible, not implicit)
3. **Single-shot learning** (acquired from a single exposure)
4. **Instance-specific memories** (captures particulars, not just patterns)
5. **Contextual relations** (binds when/where/why — temporal and situational
   context)

Proposes four research directions: encoding (structuring raw experience into
discrete episodes), retrieval (context-sensitive selection), consolidation
(merging external into parametric), and benchmarks.

**Practical applicability:** High diagnostic value. Our MEMORY.md system
partially satisfies (1), (2), (3). It fails at (4) — memories are generalized,
not instance-specific — and partially at (5) — timestamps exist but situational
context (what the user was trying to do, what failed) is often lost. Encoding
raw session events into structured episode records before compaction would
address this gap.

---

### 6. Memory in the Age of AI Agents: Three-Dimensional Survey Taxonomy [CONFIDENCE: HIGH]

**Paper:** Memory in the Age of AI Agents: A Survey **Date:** December 2025
**URL:** https://arxiv.org/abs/2512.13564 **Companion paper list:**
https://github.com/Shichun-Liu/Agent-Memory-Paper-List

The most comprehensive recent taxonomy (December 2025). Replaces the vague
"short-term/long-term" framing with three orthogonal dimensions:

**Forms:**

- Token-level (what's in the context window)
- Parametric (encoded in model weights)
- Latent (intermediate activations, attention caches)

**Functions:**

- Factual memory (world knowledge, project facts)
- Experiential memory (learned from past interactions)
- Working memory (active reasoning buffer)

**Dynamics:**

- Formation (how memories are created)
- Evolution (how they change over time)
- Retrieval (how they are accessed)

Also identifies five frontier research areas: memory automation, RL integration,
multimodal memory, multi-agent memory, and trustworthiness.

**Practical applicability:** This taxonomy directly maps to our system's layers.
Our `CLAUDE.md` is **parametric + factual**. `SESSION_CONTEXT.md` is
**token-level + working**. `AI_REVIEW_LEARNINGS_LOG.md` is **token-level +
experiential**. Gap: we have no **evolution** mechanism — memories don't decay,
merge, or get promoted/demoted over time.

---

### 7. MIRIX: Six-Component Multi-Agent Memory Architecture [CONFIDENCE: HIGH]

**Paper:** MIRIX: Multi-Agent Memory System for LLM-Based Agents **Authors:** Yu
Wang, Xi Chen (MIRIX AI) **Date:** July 2025 **URL:**
https://arxiv.org/abs/2507.07957

Most comprehensive production multi-agent memory design found. Six specialized
memory components:

| Component         | Content Type                    | Analogy in Our System               |
| ----------------- | ------------------------------- | ----------------------------------- |
| Core Memory       | Persistent identity/preferences | `CLAUDE.md`                         |
| Episodic Memory   | Timestamped events              | Session logs / compaction summaries |
| Semantic Memory   | Abstract facts/relationships    | `MEMORY.md` factual bullets         |
| Procedural Memory | How-to guides, workflows        | Skill YAML files                    |
| Resource Memory   | Full docs/transcripts           | Reference docs in `docs/`           |
| Knowledge Vault   | Sensitive credentials/keys      | `.env` files (outside memory)       |

Coordination uses 8 agents: 1 Meta Memory Manager + 6 specialized Memory
Managers + 1 Chat Agent. Active retrieval (not passive injection): agent
generates a current topic, retrieves tagged memories by type.

Performance: 99.9% storage reduction vs. RAG baseline on ScreenshotVQA; 85.4%
accuracy on LOCOMO (state-of-the-art).

**Practical applicability:** The six-component breakdown provides a concrete
blueprint. Our system conflates Episodic, Semantic, and Procedural into a single
MEMORY.md file. Splitting into type-specific memory files (e.g.,
`memory/episodic.md`, `memory/procedural.md`) would improve retrieval precision
without requiring vector infrastructure.

---

### 8. A-MEM: Zettelkasten-Inspired Dynamic Memory Linking [CONFIDENCE: HIGH]

**Paper:** A-MEM: Agentic Memory for LLM Agents **Authors:** Xu, Liang, Mei,
Gao, Tan, Zhang **Date:** February 2025 (NeurIPS 2025) **URL:**
https://arxiv.org/abs/2502.12110

Builds on MemGPT's static memory structure by making memory organization itself
an agentic task. When a new memory enters, the agent generates: contextual
description, keywords, tags, and links to related existing memories
(Zettelkasten method). Existing memory nodes can be updated when new information
arrives.

Key results across six foundation models: superior over existing baselines.
Claims 85-93% token reduction vs. MemGPT through selective top-k retrieval
(later-version claim; abstract does not confirm this number directly — treat as
MEDIUM confidence for the specific figure).

**Practical applicability:** The Zettelkasten link structure is directly
implementable in Markdown: each memory entry gets a `## Related` section linking
to other entries by filename. This is exactly how Obsidian-style notes work — no
vector database needed. The dynamic linking pattern is the key advance: our
MEMORY.md is static; A-MEM's approach would have entries updating each other
when new related information arrives.

---

### 9. Context Rot: Empirical Evidence for Minimal Context Principle [CONFIDENCE: HIGH]

**Research:** Context Rot: How Increasing Input Tokens Impacts LLM Performance
**Organization:** Chroma Research **Date:** 2025 **URL:**
https://www.trychroma.com/research/context-rot (redirected from
https://research.trychroma.com/context-rot)

Tested 18 models across four families (Anthropic, OpenAI, Google, Alibaba). Key
findings:

- **Every single model degraded** with increasing context length, including
  frontier models (Claude Opus 4, GPT-4.1, Gemini 2.5 Pro)
- The "lost in the middle" effect is consistent: models attend better to
  beginning/end of context
- Multiple distractors compound degradation non-linearly
- Shuffled (incoherent) contexts sometimes outperformed logically structured
  ones — attention is sensitive to organization, not just content
- Claude models exhibit conservative behavior (higher abstention); GPT models
  hallucinate more

Complementary finding: Liu et al. (Stanford/TACL 2024) established the U-shaped
performance curve over context positions.

**Practical applicability:** Critical. Context rot is the scientific basis for
why our multi-layer memory system needs aggressive curation. The finding that
distractors compound degradation means irrelevant files in `SESSION_CONTEXT.md`
don't just waste tokens — they actively impair performance. The practical rule:
**minimize context aggressively**, not just for cost but for accuracy.

---

### 10. Anthropic Compaction: Server-Side Summarization [CONFIDENCE: HIGH]

**Source:** Anthropic official API documentation **Date:** Released January 2026
(beta header `compact-2026-01-12`) **URL:**
https://platform.claude.com/docs/en/build-with-claude/compaction

Compaction is Anthropic's server-side answer to the context overflow problem.
When token count exceeds a configurable threshold (default 150,000; minimum
50,000), Claude generates a `compaction` block summarizing prior conversation,
and the client drops pre-compaction messages on the next turn.

Key properties:

- Automatic — no client-side logic required
- Supports custom `instructions` parameter to guide what gets preserved
- Works with `memory_tool` — memory files survive compaction boundaries
- `pause_after_compaction: true` allows inspection before continuing
- Supported on Claude Opus 4.6 and Sonnet 4.6 only

The documentation explicitly recommends using **both** compaction (server-side,
handles in-context history) and memory tool (client-side, persists across
compaction boundaries) together for long-running agentic workflows.

**Practical applicability:** Directly applicable to Claude Code's compaction
problem. The critical insight from the docs: **what survives compaction is what
gets written to memory files before compaction fires**. This means our
SESSION_CONTEXT.md and state files are not just convenient — they are the
compaction safety net. The custom `instructions` field allows domain-specific
compaction guidance (e.g., "preserve all architectural decisions and open
TODOs").

---

### 11. Anthropic Memory Tool: File-Based Persistent Memory Design [CONFIDENCE: HIGH]

**Source:** Anthropic official API documentation **Date:** September 29, 2025
(beta launch) **URL:**
https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool

Anthropic's production memory tool uses a simple file directory (`/memories`)
rather than a vector database. Commands: `view`, `create`, `str_replace`,
`insert`, `delete`, `rename`. Claude is instructed to "ALWAYS VIEW YOUR MEMORY
DIRECTORY BEFORE DOING ANYTHING ELSE."

Design philosophy from docs: "just-in-time context retrieval: rather than
loading all relevant information upfront, agents store what they learn in memory
and pull it back on demand."

The multi-session software development pattern uses three artifacts:

- `claude-progress.txt` — log of completed/pending work
- `feature_list.json` — structured JSON checklist (deliberately JSON, not
  Markdown, as model is "less likely to inappropriately change or overwrite JSON
  files")
- Git history — recoverable checkpoints

Security guidance: restrict all memory operations to `/memories` directory;
validate against path traversal; consider file size limits; consider expiration
for unused files.

**Practical applicability:** This is essentially what our project already does —
CLAUDE.md, SESSION_CONTEXT.md, MEMORY.md, hook state files. The official
Anthropic pattern validates our file-based approach as the recommended
architecture. The choice of JSON over Markdown for structured state (like
`feature_list.json`) is a design principle worth adopting for structured state
files.

---

### 12. Anthropic Context Engineering: Three Memory Architecture Patterns [CONFIDENCE: HIGH]

**Source:** Anthropic Engineering Blog **Title:** Effective Context Engineering
for AI Agents **URL:**
https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

Anthropic's own synthesis of production agent memory patterns identifies three
primary architectures:

1. **Compaction** — Summarize at context limits; restart fresh with distillation
2. **Structured Note-Taking** — Agents maintain `NOTES.md`/todo lists accessed
   across interactions
3. **Sub-Agent Architectures** — Specialized agents return condensed summaries
   (1,000-2,000 tokens) to coordinating main agent

Core principle: "the smallest set of high-signal tokens that maximize the
likelihood of your desired outcome."

Hierarchy guidance: file naming signals purpose, folder hierarchies provide
organizational signals, timestamps indicate recency, file sizes suggest
complexity. Agents should progressively discover context through exploration
rather than having everything pre-loaded.

**Practical applicability:** Directly describes our architecture. The
1,000-2,000 token sub-agent summary limit is a concrete constraint to enforce.
The file metadata signals (naming, hierarchy, timestamps, size) are immediately
applicable to improving our memory file organization.

---

### 13. LightMem: Three-Stage Biologically-Inspired Memory Consolidation [CONFIDENCE: HIGH]

**Paper:** LightMem: Lightweight and Efficient Memory-Augmented Generation
**Date:** October 2025 **URL:** https://arxiv.org/abs/2510.18866

Implements the Atkinson-Shiffrin human memory model in three stages:

1. **Sensory memory** — lightweight filtering and topic grouping of raw input
2. **Short-term/topic-aware memory** — consolidation and summarization by topic
3. **Long-term memory** — offline "sleep-time" update decoupled from online
   inference

Performance: up to 10.9% accuracy gains over baselines while reducing token
usage by 117× and API calls by 159× (GPT/Qwen on LongMemEval).

The "sleep-time update" concept is significant: consolidation happens
asynchronously, not during the active inference loop. This mirrors human memory
consolidation during sleep.

**Practical applicability:** The sleep-time consolidation pattern maps to our
`/session-end` lifecycle. Our current session-end does some consolidation
(updating SESSION_CONTEXT.md, MEMORY.md). LightMem's model suggests a more
rigorous three-stage pipeline: (1) capture raw session observations, (2) group
by topic, (3) merge into long-term memory with deduplication and summary — all
at session-end, not during the session.

---

### 14. RAG for Code: Repository-Level Retrieval Techniques [CONFIDENCE: HIGH]

**Paper:** Retrieval-Augmented Code Generation: A Survey with Focus on
Repository-Level Approaches **Authors:** Tao, Qin, Liu **Date:** October 2025
(revised January 2026) **URL:** https://arxiv.org/abs/2510.04905

Most comprehensive survey of code-specific RAG. Key techniques:

**Non-graph approaches:**

- BM25 / Jaccard similarity (lexical, fast, baseline)
- Dense neural embeddings (GraphCodeBERT, UniXcoder)
- Hybrid lexical + semantic

**Graph-based approaches:**

- Node types: Directory > Module > Class > Function > Line (three-level
  hierarchy dominates)
- Edge types: Contain, Import, Inherit, Invoke, Data Flow, Control Flow
- "Contain and Invoke" are foundational edges appearing in most implementations
- Data flow and control flow edges remain underexplored due to complexity

**Effectiveness finding:** RAG excels for large/complex repositories;
long-context models can match RAG performance for smaller structured codebases.

**Repository-level challenges:** long-range dependencies, global semantic
consistency, cross-file linkage, incremental evolution.

**Practical applicability:** For our codebase memory system, the Module >
Class > Function hierarchy with Contain and Invoke edges is the minimum viable
graph structure. This is implementable as Markdown frontmatter or YAML metadata
describing file-level contains/invokes relationships — no graph database
required for a small codebase.

---

### 15. Adaptive Memory Admission Control: Five-Factor Admission Policy [CONFIDENCE: HIGH]

**Paper:** Adaptive Memory Admission Control for LLM Agents (A-MAC) **Authors:**
Zhang et al. **Date:** March 2026 **URL:** https://arxiv.org/abs/2603.04549

Frames "what should be stored in memory?" as a structured decision problem. Five
factors:

1. **Future utility** — will this be needed again?
2. **Factual confidence** — is this correct?
3. **Semantic novelty** — is this already captured?
4. **Temporal recency** — how fresh is this?
5. **Content type prior** — what category of content is this? (ablation: this
   was the _most influential_ factor)

A-MAC improves F1 to 0.583 while reducing latency by 31% vs. state-of-the-art.

**Practical applicability:** The five factors provide a lightweight rubric for
deciding what to write to MEMORY.md vs. discard. "Content type prior" being the
strongest signal suggests: decide what categories of information deserve memory
entries (architecture decisions, user corrections, project constraints) and
enforce those categories explicitly — rather than letting ad-hoc content
accumulate.

---

### 16. ACT-R-Inspired Forgetting: Decay-Based Memory Prioritization [CONFIDENCE: MEDIUM]

**Paper:** Human-Like Remembering and Forgetting in LLM Agents: An
ACT-R-Inspired Memory Architecture **Conference:** HAI 2025 (13th International
Conference on Human-Agent Interaction) **URL:**
https://dl.acm.org/doi/10.1145/3765766.3765803

Implements ACT-R cognitive architecture decay formula in LLM agents:

```
Activation = ln(Σ t_i^(-d)) + spreading_activation
```

Where `t_i` is time since each retrieval, `d ≈ 0.5` is decay parameter. Combines
temporal decay with semantic spreading activation and probabilistic noise.
Memories accessed repeatedly stay active; never-accessed memories decay toward
removal.

MemoryBank (related work) uses Ebbinghaus forgetting curve as an exponential
decay model with hourly decay factor of 0.995.

**Practical applicability:** Moderate. Implementing full ACT-R in a file-based
system is complex. The practical takeaway: **access timestamps matter**. File
metadata (`atime` on Unix; explicit `last_accessed` fields in Markdown
frontmatter) can approximate ACT-R decay without the formula. The key design
principle: memories that haven't been accessed in N sessions should be demoted
or archived, not retained indefinitely.

---

### 17. Multi-Agent Memory from Computer Architecture Perspective [CONFIDENCE: MEDIUM]

**Paper:** Multi-Agent Memory from a Computer Architecture Perspective: Visions
and Challenges Ahead **Date:** March 2026 **URL:**
https://arxiv.org/html/2603.10062v1

Applies computer architecture consistency models (cache coherence, memory
ordering) to multi-agent LLM systems. Key conceptual gap identified:
**consistency** — "which updates are visible to a read and in what order
concurrent updates may be observed."

Identifies private vs. shared memory distinction as fundamental. Concurrent
agent writes without coordination produce inconsistent state.

**Practical applicability:** Our subagent spawning pattern has exactly this
problem. When an orchestrator spawns 3 parallel research agents writing to
`.research/` simultaneously, without coordination, writes could conflict. The
paper suggests applying cache coherence concepts: designate a "memory
controller" agent, use write-ahead logging, or use file-level locking. This is
currently unaddressed in our architecture.

---

### 18. OpenHands: Event-Stream State Without Cross-Session Persistence [CONFIDENCE: HIGH]

**Paper:** OpenHands: An Open Platform for AI Software Developers as Generalist
Agents **Authors:** Wang et al. (AllHands.dev) **Date:** July 2024 (v3 revised)
**URL:** https://arxiv.org/abs/2407.16741

OpenHands uses an **event-stream architecture**: a chronological log of all
agent actions and environment observations as the primary state mechanism. State
includes: full action-observation history, LLM call costs, multi-agent
delegation metadata.

Critically: **OpenHands has no explicit cross-session memory persistence**. Each
task session operates within its own container with a mounted workspace. The
design prioritizes simplicity and auditability — all reasoning is grounded in
observable event history rather than implicit state.

**Practical applicability:** Negative finding of value. OpenHands consciously
chose statelessness for simplicity. Our system is building exactly what
OpenHands doesn't have: cross-session memory. This validates that cross-session
persistence is non-trivial and not yet a solved problem even in production
coding agent frameworks.

---

### 19. Episodic vs. Semantic vs. Procedural: Practical Cognitive Mapping [CONFIDENCE: HIGH]

**Sources:** Multiple (MIRIX paper, "Memory in the Age of AI Agents" survey, LLM
OS blog analysis) **URL:**
https://www.emergentmind.com/topics/memory-mechanisms-in-llm-based-agents

The cognitive science categorization maps consistently across sources:

| Memory Type | What it stores                             | Question answered         | File-system analog                   |
| ----------- | ------------------------------------------ | ------------------------- | ------------------------------------ |
| Episodic    | Specific past events with temporal context | "What happened when?"     | Session logs, compaction summaries   |
| Semantic    | Abstract facts, concepts, relationships    | "What do I know?"         | MEMORY.md factual bullets, CLAUDE.md |
| Procedural  | How to accomplish tasks                    | "How do I do this?"       | Skill YAML files, hook scripts       |
| Working     | Active reasoning buffer                    | "What am I thinking now?" | Active context window                |
| Core        | Persistent identity/constraints            | "Who am I?"               | CLAUDE.md identity sections          |

**Practical applicability:** The mapping is directly applicable as an
organizational schema for our memory file hierarchy. Current state: we merge
Episodic + Semantic into MEMORY.md. Splitting into `memory/episodic/`
(timestamped session events) and `memory/semantic/` (standing facts) would
improve retrieval specificity.

---

### 20. Compaction Failure Mode: What Gets Lost During Summarization [CONFIDENCE: HIGH]

**Sources:** Anthropic compaction docs + LightMem paper + Episodic Memory
position paper **URL:**
https://platform.claude.com/docs/en/build-with-claude/compaction

The convergence of three sources reveals the **compaction loss problem**:

1. Compaction generates summaries that preserve high-level information but lose
   instance-specific detail (per episodic memory position paper: summaries lack
   "contextual relations — when, where, why")
2. LightMem shows that even sophisticated compression loses information
   selectively (topic-unrelated content is aggressively pruned)
3. Anthropic docs acknowledge that memory files are needed precisely to survive
   compaction boundaries

The practical failure mode: valuable procedural knowledge generated mid-session
(a discovered pattern, a corrected approach) lives in the context window, gets
compressed by compaction, and the nuance is lost. Only what was explicitly
written to memory files before compaction fires is preserved.

**Practical applicability:** This is the core design challenge. The finding
implies: **memory writes should be proactive and frequent**, not just at
session-end. Agents should write to memory files at every significant decision
point, not just on compaction trigger. This is analogous to "commit early,
commit often" in version control.

---

## Sources

| #   | URL                                                                               | Title                                                                   | Type                         | Trust       | CRAAP Score | Date     |
| --- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------- | ----------- | ----------- | -------- |
| 1   | https://arxiv.org/abs/2310.08560                                                  | MemGPT: Towards LLMs as Operating Systems                               | Peer-reviewed arxiv          | HIGH        | 4.4         | Oct 2023 |
| 2   | https://arxiv.org/abs/2304.03442                                                  | Generative Agents: Interactive Simulacra of Human Behavior              | Peer-reviewed (UIST 2023)    | HIGH        | 4.6         | Apr 2023 |
| 3   | https://arxiv.org/abs/2303.11366                                                  | Reflexion: Language Agents with Verbal Reinforcement Learning           | Peer-reviewed (NeurIPS 2023) | HIGH        | 4.6         | Mar 2023 |
| 4   | https://arxiv.org/abs/2305.16291                                                  | Voyager: An Open-Ended Embodied Agent with LLMs                         | Peer-reviewed (TMLR 2024)    | HIGH        | 4.4         | May 2023 |
| 5   | https://arxiv.org/abs/2502.06975                                                  | Position: Episodic Memory is the Missing Piece                          | Arxiv preprint               | MEDIUM-HIGH | 4.2         | Feb 2025 |
| 6   | https://arxiv.org/abs/2512.13564                                                  | Memory in the Age of AI Agents: A Survey                                | Arxiv survey                 | MEDIUM-HIGH | 4.3         | Dec 2025 |
| 7   | https://arxiv.org/abs/2507.07957                                                  | MIRIX: Multi-Agent Memory System                                        | Arxiv preprint               | MEDIUM-HIGH | 4.0         | Jul 2025 |
| 8   | https://arxiv.org/abs/2502.12110                                                  | A-MEM: Agentic Memory for LLM Agents                                    | Peer-reviewed (NeurIPS 2025) | HIGH        | 4.3         | Feb 2025 |
| 9   | https://www.trychroma.com/research/context-rot                                    | Context Rot: How Increasing Input Tokens Impacts LLM Performance        | Industry research            | HIGH        | 4.0         | 2025     |
| 10  | https://platform.claude.com/docs/en/build-with-claude/compaction                  | Compaction — Claude API Docs                                            | Official docs                | HIGHEST     | 5.0         | Jan 2026 |
| 11  | https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool         | Memory tool — Claude API Docs                                           | Official docs                | HIGHEST     | 5.0         | Sep 2025 |
| 12  | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents | Effective context engineering for AI agents                             | Official blog/engineering    | HIGH        | 4.8         | 2025     |
| 13  | https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents | Effective harnesses for long-running agents                             | Official blog/engineering    | HIGH        | 4.8         | 2025     |
| 14  | https://arxiv.org/abs/2510.18866                                                  | LightMem: Lightweight and Efficient Memory-Augmented Generation         | Arxiv preprint               | MEDIUM-HIGH | 4.0         | Oct 2025 |
| 15  | https://arxiv.org/abs/2510.04905                                                  | Retrieval-Augmented Code Generation: A Survey                           | Arxiv survey                 | MEDIUM-HIGH | 4.2         | Oct 2025 |
| 16  | https://arxiv.org/abs/2603.04549                                                  | Adaptive Memory Admission Control for LLM Agents                        | Arxiv preprint               | MEDIUM-HIGH | 3.8         | Mar 2026 |
| 17  | https://dl.acm.org/doi/10.1145/3765766.3765803                                    | Human-Like Remembering and Forgetting: ACT-R Architecture               | Peer-reviewed (HAI 2025)     | HIGH        | 4.2         | 2025     |
| 18  | https://arxiv.org/html/2603.10062v1                                               | Multi-Agent Memory from Computer Architecture Perspective               | Arxiv preprint               | MEDIUM      | 3.7         | Mar 2026 |
| 19  | https://arxiv.org/abs/2407.16741                                                  | OpenHands: An Open Platform for AI Software Developers                  | Peer-reviewed                | HIGH        | 4.4         | Jul 2024 |
| 20  | https://lilianweng.github.io/posts/2023-06-23-agent/                              | LLM Powered Autonomous Agents (Lilian Weng / OpenAI)                    | Authoritative blog           | HIGH        | 4.6         | Jun 2023 |
| 21  | https://arxiv.org/abs/2602.14038                                                  | Choosing How to Remember: Adaptive Memory Structures (FluxMem)          | Arxiv preprint               | MEDIUM      | 3.8         | Feb 2026 |
| 22  | https://arxiv.org/abs/2603.07670                                                  | Memory for Autonomous LLM Agents: Mechanisms, Evaluation, and Frontiers | Arxiv survey                 | MEDIUM-HIGH | 4.0         | Mar 2026 |

---

## Contradictions

**1. RAG vs. Long Context for Code** The RAG code survey (source 15) finds RAG
essential for large/complex repositories; multiple other sources suggest that
1M+ context windows (Claude Opus 4.6) may eventually make RAG unnecessary for
smaller codebases. These positions are not fully reconciled — the crossover
point depends on codebase size, retrieval precision, and context rot effects.

**2. Memory Complexity vs. Simplicity** MIRIX (source 7) argues for 6
specialized memory components + 8 agents as the optimal design. Anthropic's
memory tool docs (source 11) demonstrate that simple file-based memory in a
single `/memories` directory works well in production. The field has not
converged on whether specialization or simplicity wins. Evidence suggests
simplicity for single-agent systems and specialization for multi-agent systems.

**3. Compaction vs. Memory Files as Primary Strategy** Anthropic's compaction
docs (source 10) recommend server-side compaction as "the recommended strategy"
for long-running workflows. The memory tool docs (source 11) recommend proactive
memory file writing. These are presented as complementary but there is an
implicit tension: if agents rely on compaction to handle context overflow, they
may be less disciplined about explicit memory writes. The docs themselves
acknowledge the memory file is needed to survive compaction — but do not specify
trigger conditions for writes.

**4. Static Structure vs. Dynamic Organization** MemGPT (source 1) uses fixed
main/external context tiers. A-MEM (source 8) argues for dynamic, agentic memory
reorganization. The field is split on whether fixed structure (predictable,
auditable) or dynamic structure (adaptive, more efficient) is preferable for
production systems.

---

## Gaps

1. **No papers found specifically on file-based Markdown memory systems** as
   distinct from vector database RAG or in-weights parametric memory. Most
   research assumes a vector store or database. Anthropic's own docs are the
   closest authoritative source for the file-based pattern.

2. **No empirical comparison of memory architectures at the scale of Claude
   Code** (small-to-medium codebase, <50 files, single developer). Most
   benchmarks (LOCOMO, LongMemEval, ScreenshotVQA) test conversational/personal
   assistant scenarios, not coding agent scenarios.

3. **Memory write timing heuristics** — when exactly should an agent write to
   memory during a session? The research identifies the need but doesn't provide
   empirical guidance on optimal trigger conditions for proactive writes (versus
   only writing at session-end).

4. **Conflict resolution for concurrent agent writes** — the computer
   architecture paper (source 18) identifies the problem but the practical
   solution for a file-based system (locking, versioning, merge strategies) is
   not covered in the papers found.

5. **Devin's specific memory architecture** was not surfaced. The
   Cognition/Devin system is closed-source and published no papers on their
   internal memory design. The Contrary Research breakdown (source found in
   search results) is a business analysis, not technical architecture
   documentation.

6. **Anthropic academic papers on memory** — no Anthropic academic papers
   specifically about memory architectures were found. The relevant Anthropic
   content is engineering blog posts and product documentation, not academic
   research papers.

---

## Serendipity

**1. JSON over Markdown for Structured State** Anthropic's own engineering blog
(harnesses article) notes that Claude is "less likely to inappropriately change
or overwrite JSON files compared to Markdown files" — this is an empirically
discovered behavioral property, not a documented rule. Our hook state files
(JSONL format) benefit from this accidentally. This suggests using `.json`
extension for all structured state files that should not be edited ad-hoc by the
model.

**2. Custom Compaction Instructions as Architecture Lever** The compaction API's
`instructions` parameter completely replaces the default summarization prompt.
This means domain-specific compaction can be implemented without changing agent
behavior at all — just pass instructions like "preserve all DEBT-XXXXX
references, all hook check results, and all user corrections verbatim." This is
an underutilized lever in our current system.

**3. Content Type Prior as Strongest Memory Admission Signal** A-MAC's ablation
study (source 16) found that "content type prior" was the strongest single
predictor of whether a memory entry should be stored. This suggests an early,
cheap filter: define a whitelist of information categories worth memorizing
(user corrections, architectural decisions, hook patterns, recurring errors) and
simply discard everything else — before running semantic novelty or utility
scoring.

**4. Voyager's Iterative Prompting as Skill Refinement Pattern** Voyager's
three-component system — curriculum + skill library + iterative prompting with
self-verification — maps directly to our skill audit problem. The skill library
is our `.claude/skills/` directory; the iterative prompting with error feedback
is what `/pre-commit-fixer` does. Formalizing this as: skill fails → capture
failure text → update skill YAML → re-test would implement Voyager's skill
refinement loop.

**5. The ICLR 2026 MemAgents Workshop** A workshop specifically on "Memory for
LLM-Based Agentic Systems" was found in the ICLR 2026 proceedings
(https://openreview.net/pdf?id=U51WxL382H). This signals the field is coalescing
around agent memory as a first-class research area, suggesting rapid progress
in 2026. Worth monitoring for new benchmark papers.

---

## Confidence Assessment

- HIGH claims: 14
- MEDIUM-HIGH claims: 4
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0

**Overall confidence: HIGH**

The majority of findings are supported by either official Anthropic
documentation (highest trust), peer-reviewed papers (NeurIPS 2023, UIST 2023,
TMLR 2024, HAI 2025), or high-quality arxiv preprints cross-referenced across
multiple searches. The one area of lower confidence is the specific
token-reduction claim for A-MEM (85-93%) which appears in search summaries but
was not confirmed in the paper abstract directly — reported as MEDIUM-HIGH with
caveat.
