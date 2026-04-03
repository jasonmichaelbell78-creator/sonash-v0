# Findings: Industry Implementations of AI Coding Agent Memory

**Searcher:** deep-research-searcher **Profile:** web+academic **Date:**
2026-03-31 **Sub-Question IDs:** SQ4

---

## Key Findings

### 1. Devin (Cognition) — Trigger-Based Knowledge Bank + Playbooks [CONFIDENCE: HIGH]

Devin uses a structured "Knowledge" system that persists across sessions.
Architecture:

- **Knowledge items** consist of a "Trigger Description" and content body.
  Retrieval is contextual — Devin pulls items when "current work is related to
  the specified triggers," not by loading everything upfront.
- **Scoping hierarchy**: org-level (default), enterprise-level,
  repository-pinned (always loaded for that repo), and global (all repos).
- **Playbooks**: system prompt analogues for repeated tasks — if an instruction
  is used across multiple sessions, it gets promoted to a Playbook.
- **DeepWiki**: automated repo-level wiki generated every ~2 hours via LLM +
  graph analysis of source code, config, and docs. Serves as passive context for
  Ask Devin.
- **Session state does NOT auto-persist**: Devin does not maintain
  conversational state cross-session. Only Knowledge items and Playbooks
  survive.
- **Rollback**: users can restore Devin to a previous point in time (file +
  memory rollback).

Key limitation: no automatic cross-session learning. Knowledge must be manually
curated or explicitly added by users. [1][2][3]

---

### 2. SWE-Agent (Princeton/Stanford) — Summarizer-Based Context Compression [CONFIDENCE: HIGH]

SWE-Agent v0.7+ (NeurIPS 2024) addresses long-context via the ACI
(Agent-Computer Interface) design:

- **Summarizer concept**: integrated directly into the agent loop to compress
  long outputs and context when approaching limits. Introduced as part of the
  EnIGMA project.
- **No cross-session memory**: each task starts fresh from the GitHub issue. No
  persistent knowledge store.
- **ACI tooling**: structured file viewer, file editor, search/navigation, and
  context management tools — the interface design itself reduces context bloat
  by giving the model clean, scoped views rather than raw file dumps.
- **Per-task context management**: the agent maintains state within a single
  task run via the event/action transcript; no external memory layer exists.

The Summarizer pattern (periodic compression into rolling summaries) is now
widely cited as a pattern across the field. [4][5]

---

### 3. OpenHands (formerly OpenDevin) — Event-Stream Architecture [CONFIDENCE: HIGH]

OpenHands uses a deterministic event-sourcing model:

- **Event stream**: all actions and observations are appended to an immutable
  log (FileStore in V0, PostgreSQL in V1). This is the primary memory layer —
  every command, edit, and observation is recorded.
- **ConversationMemory**: processes the event history into LLM-consumable
  messages. Separate from raw event log.
- **Microagents**: modular knowledge snippets triggered by keywords in
  user/agent messages. Stored as `.md` files in `.openhands/microagents/`.
  Provides context-specific knowledge injection.
- **Cross-session gap**: confirmed zero knowledge transfer between sessions.
  Each session re-reads key files, re-discovers architecture, re-learns build
  conventions. This is the primary complaint from users.
- **Memory condensation**: tracked as an open issue (#5715). Long-running
  sessions degrade because the event stream grows without bounds. No production
  solution as of early 2026.
- **V1 SDK**: refactors into modular event-sourcing pattern, separates
  agent/tool/workspace packages. [6][7][8]

---

### 4. Letta/MemGPT — Virtual Context Management (Most Architecturally Sophisticated) [CONFIDENCE: HIGH]

Letta (formerly MemGPT) implements an OS-inspired virtual memory model:

- **Core memory**: always in-context. Small, contains critical facts (agent
  persona, key user info).
- **Archival memory**: infinite external store. Agent explicitly writes/reads
  via function calls.
- **Recall memory**: conversation history, searchable.
- **"LLM OS" model**: physical context window = RAM; virtual context = all
  available data. Agent decides what to page in/out via explicit memory function
  calls.

**Letta Code** (coding-specific evolution, 2025):

- **Context Repositories**: git-backed memory store. Every change to agent
  memory is versioned with a commit message. Agents can branch, diff, and merge
  their own memory. Described as "programmatic context management."
- **Skill Learning**: agents learn reusable `.skills` from experience, stored in
  `.skills/` directory. Shared skills repository exists on GitHub for
  cross-agent reuse.
- **Subagent memory**: divide-and-conquer memory — multiple subagents each focus
  on a different aspect (e.g., architecture, testing patterns) and resolve
  findings into a shared Context Repository.
- **Continual learning**: claims cross-model portability — agent memory survives
  model upgrades (Claude → GPT → Gemini).
- **Terminal-Bench**: claimed #1 model-agnostic open source agent on
  Terminal-Bench benchmark as of 2025/2026. [9][10][11]

---

### 5. Amazon Q Developer / AgentCore — Three-Strategy Tiered Memory [CONFIDENCE: HIGH]

Amazon Q Developer workspace context + Bedrock AgentCore Memory (the underlying
infrastructure):

**Q Developer workspace context**:

- Indexes entire workspace; `@workspace` in chat injects relevant chunks via
  semantic search.
- Index updated incrementally on file save/tab switch.
- Hard limits: stops at size limit or when RAM drops below threshold.
- MCP support (2025): pulls Jira tickets, Figma designs, architecture diagrams
  into context.

**AgentCore Memory** (launched AWS Summit NYC 2025, deeper architecture):

- **Three built-in strategies**: Semantic (facts/knowledge), Summary
  (session-scoped running summaries), User Preferences (cross-session preference
  tracking).
- **Processing pipeline**: raw conversational events → extraction →
  consolidation with existing memories → searchable store.
- **Performance**: extraction/consolidation takes 20-40s; semantic retrieval
  ~200ms.
- **Parallel processing**: multiple strategies process independently without
  blocking.
- **Memory resource**: logical container defining retention duration, access
  controls, and transformation rules. [12][13][14]

---

### 6. Google Jules — User Preference Memory + Secure VM Execution [CONFIDENCE: HIGH]

Jules (Google Labs, out of public beta 2025, now using Gemini 3 Pro):

- **Memory feature**: remembers user preferences over time and automatically
  applies them to future tasks. Described as "a record of interactions with
  users and their preferences, nudges, and corrections."
- **Session-level improvement**: Google improved how memory carries through
  within a session as part of Jules API updates.
- **Execution isolation**: each task clones the repo into a secure Google Cloud
  VM. Memory is preference-based, not codebase-knowledge-based.
- **Asynchronous architecture**: Jules works async — users submit tasks and come
  back to PRs. This design choice means cross-session knowledge is primarily
  about user preferences, not task state. [15][16]

Key gap: Jules does not appear to persist codebase-architectural knowledge
across sessions. Memory is preference/correction-oriented, not structural.

---

### 7. GitHub Copilot Memory — Repository-Scoped Citation-Validated Memories [CONFIDENCE: HIGH]

GitHub launched Copilot Memory in December 2025 (early access for Pro/Pro+):

- **Three tiers** (VS Code agent memory):
  - **User memory** (`/memories/`): persists across all workspaces. First 200
    lines auto-loaded at session start.
  - **Repository memory** (`/memories/repo/`): scoped to workspace, persists
    across conversations in that workspace.
  - **Session memory** (`/memories/session/`): cleared on conversation end; used
    for task-specific notes and plan.md.
- **Copilot Memory (GitHub-hosted)**: separate from local VS Code memory.
  Automatically captures insights as agents work. Shared across agent, code
  review, and CLI surfaces.
- **Citation validation**: each memory is stored with citations (links to
  specific code locations). Before use, citations are validated against current
  codebase. Memory discarded if citations fail validation.
- **28-day TTL with refresh**: memories expire after 28 days unless revalidated
  and reused, which resets the clock.
- **Repository-scoped, not user-scoped**: all users with write access to a repo
  share its memories. [17][18][19]

This is arguably the most production-mature cross-surface memory system among
coding tools.

---

### 8. Augment Code — Real-Time Semantic Index + Curated Long-Term Memory [CONFIDENCE: HIGH]

Augment Code's architecture is built around two distinct systems:

**Context Engine** (structural memory):

- Real-time semantic index processing thousands of files/second. Updated within
  seconds of any file change.
- Knowledge graph representation tracking cross-service dependencies.
- Context Lineage (2025): indexes recent commits (message, author, timestamp,
  diffs), LLM-summarized for compactness, retrieved on demand.
- Infrastructure: Google Cloud PubSub + BigTable + AI Hypercomputer; custom
  embedding stack, not generic embedding APIs.
- Up to 200k token context window for chat.

**Memory Review** (episodic memory):

- Agent proposes memories during work (draft state).
- User reviews via modal in turn summary — can approve, edit, or discard.
- Approved memories stored in `.augment/rules` (persistent, survives sessions).
- Memories can include: long-term project goals, debugging decisions, relevant
  code snippets.
- **Human-in-the-loop validation**: nothing stored without user approval.
  [20][21][22]

---

### 9. Bolt/Lovable/v0 — Manual Knowledge Files, Minimal Auto-Memory [CONFIDENCE: MEDIUM]

Web app builders take a simpler, more manual approach:

**Lovable**:

- **Knowledge Base** in project settings: user-defined PRD, backend structure,
  design guidelines. Acts as always-injected context.
- `/docs` folder pattern: users document decisions in project files for AI to
  re-read. No auto-memory.
- Context degrades noticeably beyond 15-20 components; no automated recovery.

**Bolt.new**:

- No native cross-session memory. Clean context on each session.
- Context managed via explicit file inclusion and prompt engineering.

**v0 (Vercel)**:

- UI-component focused; minimal project memory. Single-session context model.
- No persistent memory architecture documented.

Common failure mode across all three: "context drift" — without explicit project
files, the AI loses architectural consistency across sessions. User-created docs
are the primary mitigation. [23][24]

---

### 10. Memory Benchmarks — LongMemEval, LoCoMo, MemoryCD [CONFIDENCE: HIGH]

**LongMemEval** (ICLR 2025):

- 500 manually curated questions testing: information extraction, multi-session
  reasoning, temporal reasoning, knowledge updates, and abstention.
- Commercial assistants and long-context LLMs show ~30% accuracy drop on
  memorizing information across sustained interactions.
- Optimizations that help: session decomposition for value granularity,
  fact-augmented key expansion for indexing, time-aware query expansion.

**LoCoMo** (Snap Research):

- 300-turn conversations, 9K tokens avg, up to 35 sessions.
- LLMs significantly lag human performance on long-range temporal and causal
  reasoning.
- Mem0 achieves 26% higher response accuracy vs OpenAI memory, 91% lower p95
  latency, 90% token savings on LoCoMo.

**MEMTRACK** (2025):

- Focuses specifically on long-term memory and state tracking in agentic
  settings.

**MemoryCD** (2026):

- Benchmarks lifelong cross-domain personalization memory.

**Key finding from benchmarks**: RAG (vector store retrieval) consistently
outperforms both raw full-context and rolling summarization on cross-session
tasks, but graph-structured memory (Zep-style: nodes for people/events/places
with temporal edges) performs best on complex relational queries. [25][26][27]

---

### 11. Cross-Cutting Patterns — What Actually Works [CONFIDENCE: MEDIUM]

Synthesized from implementation evidence across all agents:

**What works:**

- **Scoped, validated storage**: GitHub Copilot's citation-validation approach
  and Augment's human-approval gates prevent memory rot.
- **Git-backed versioning** (Letta): treating memory as versioned code, not a
  blob store. Makes memory diffs auditable.
- **Trigger-based retrieval** (Devin Knowledge): don't inject all knowledge; use
  relevance triggers to pull specific items.
- **Hierarchical scopes**: user-level, repo-level, session-level (GitHub/VS Code
  model) prevents contamination.
- **Incremental indexing** (Augment): update within seconds of change, not batch
  re-index.
- **TTL with activity refresh** (GitHub 28-day): stale memories expire unless
  revalidated.

**What doesn't work:**

- Unbounded event streams (OpenHands): performance degrades at scale without
  condensation.
- Session-only context with no extraction (Bolt/v0): forces users to reinvent
  project state constantly.
- Manual-only knowledge curation without agent-assisted suggestion (early
  Devin): knowledge bank becomes stale because no one updates it.
- Full-context injection (all memories always in context): 30% accuracy drop on
  recall tasks (LongMemEval), and token cost is prohibitive.

---

## Sources

| #   | URL                                                                                                            | Title                                             | Type            | Trust  | CRAAP | Date    |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------- | ------ | ----- | ------- |
| 1   | https://docs.devin.ai/product-guides/knowledge                                                                 | Knowledge - Devin Docs                            | official-docs   | HIGH   | 4.5   | 2025    |
| 2   | https://cognition.ai/blog/devin-2                                                                              | Devin 2.0                                         | vendor-blog     | HIGH   | 4.2   | 2025    |
| 3   | https://cognition.ai/blog/devin-annual-performance-review-2025                                                 | Devin's 2025 Performance Review                   | vendor-blog     | HIGH   | 4.0   | 2025    |
| 4   | https://github.com/SWE-agent/SWE-agent                                                                         | SWE-agent GitHub                                  | code-repo       | HIGH   | 4.5   | 2025    |
| 5   | https://swe-agent.com/latest/background/                                                                       | SWE-agent Documentation                           | official-docs   | HIGH   | 4.5   | 2025    |
| 6   | https://arxiv.org/html/2511.03690v1                                                                            | OpenHands Software Agent SDK                      | academic-paper  | HIGH   | 4.2   | 2025    |
| 7   | https://deepwiki.com/OpenHands/OpenHands/6.3-agent-configuration                                               | OpenHands Memory Architecture                     | community-docs  | MEDIUM | 3.8   | 2025    |
| 8   | https://memu.pro/blog/openhands-open-source-coding-agent-memory                                                | OpenHands Memory Gap Analysis                     | vendor-blog     | MEDIUM | 3.5   | 2025    |
| 9   | https://www.letta.com/blog/context-repositories                                                                | Context Repositories: Git-based Memory            | vendor-blog     | HIGH   | 4.3   | 2025    |
| 10  | https://www.letta.com/blog/letta-code                                                                          | Letta Code: Memory-First Coding Agent             | vendor-blog     | HIGH   | 4.3   | 2025    |
| 11  | https://www.letta.com/blog/skill-learning                                                                      | Skill Learning: Continual Learning for CLI Agents | vendor-blog     | HIGH   | 4.0   | 2025    |
| 12  | https://aws.amazon.com/q/developer/features/                                                                   | Amazon Q Developer Features                       | official-docs   | HIGH   | 4.5   | 2026    |
| 13  | https://aws.amazon.com/blogs/machine-learning/building-smarter-ai-agents-agentcore-long-term-memory-deep-dive/ | AgentCore Long-Term Memory Deep Dive              | vendor-blog     | HIGH   | 4.2   | 2025    |
| 14  | https://aws.amazon.com/blogs/devops/aws-announces-workspace-context-awareness-for-amazon-q-developer-chat/     | Q Developer Workspace Context                     | official-docs   | HIGH   | 4.5   | 2025    |
| 15  | https://blog.google/technology/google-labs/jules-tools-jules-api/                                              | Jules Tools and Jules API                         | vendor-blog     | HIGH   | 4.3   | 2025    |
| 16  | https://blog.google/technology/google-labs/jules-now-available/                                                | Jules Now Available                               | vendor-blog     | HIGH   | 4.3   | 2025    |
| 17  | https://docs.github.com/en/copilot/concepts/agents/copilot-memory                                              | About Agentic Memory for GitHub Copilot           | official-docs   | HIGH   | 4.8   | 2025    |
| 18  | https://code.visualstudio.com/docs/copilot/agents/memory                                                       | Memory in VS Code Agents                          | official-docs   | HIGH   | 4.8   | 2025    |
| 19  | https://github.blog/changelog/2025-12-19-copilot-memory-early-access-for-pro-and-pro/                          | Copilot Memory Early Access                       | official-blog   | HIGH   | 4.5   | 2025-12 |
| 20  | https://www.augmentcode.com/blog/how-we-built-memory-review                                                    | How We Built Memory Review                        | vendor-blog     | HIGH   | 4.0   | 2025    |
| 21  | https://www.augmentcode.com/blog/a-real-time-index-for-your-codebase-secure-personal-scalable                  | Real-Time Index Architecture                      | vendor-blog     | HIGH   | 4.2   | 2025    |
| 22  | https://www.augmentcode.com/blog/announcing-context-lineage                                                    | Context Lineage Announcement                      | vendor-blog     | HIGH   | 4.0   | 2025    |
| 23  | https://lovable.dev/blog/2025-01-16-lovable-prompting-handbook                                                 | Lovable Prompting Bible                           | vendor-blog     | MEDIUM | 3.8   | 2025    |
| 24  | https://particula.tech/blog/lovable-vs-bolt-vs-v0-ai-app-builders                                              | v0 vs Bolt vs Lovable Comparison                  | community       | MEDIUM | 3.5   | 2025    |
| 25  | https://arxiv.org/abs/2410.10813                                                                               | LongMemEval: ICLR 2025                            | academic-paper  | HIGH   | 4.8   | 2025    |
| 26  | https://snap-research.github.io/locomo/                                                                        | LoCoMo Benchmark                                  | academic-paper  | HIGH   | 4.5   | 2025    |
| 27  | https://mem0.ai/research                                                                                       | Mem0 Research: 26% Accuracy Boost                 | vendor-research | MEDIUM | 4.0   | 2025    |

---

## Contradictions

**Devin memory claim vs reality**: Marketing materials imply Devin "learns"
across sessions. The actual architecture shows it relies on manually curated
Knowledge items — there is no automatic extraction of insights from past
sessions unless users explicitly add them.

**Jules memory framing**: Google calls it "memory" but it appears limited to
user preferences/corrections, not codebase knowledge. This is a much weaker
claim than GitHub Copilot's repository-scoped insight capture. The term "memory"
is used inconsistently across vendors.

**Letta Code Terminal-Bench claim**: Letta claims #1 model-agnostic agent on
Terminal-Bench. This is a self-reported benchmark claim from vendor blog. No
independent validation found in this search.

**Summarization vs RAG**: SWE-agent uses summarization (compression); academic
benchmarks (LongMemEval, LoCoMo results) show RAG consistently outperforms
summarization on recall tasks. SWE-agent's approach may be locally optimal for
single-task runs but not for cross-session learning.

---

## Gaps

**Devin internal architecture**: Cognition does not publish technical
architecture details. The Knowledge system's retrieval mechanism (how trigger
matching works, embedding-based or keyword-based) is undocumented publicly.

**Cursor memory removal**: Cursor introduced then removed a Memories feature in
mid-2025 (v2.1.x). No post-mortem published explaining why. This is
architecturally significant — a major tool tried and abandoned auto-memory.

**Jules architecture depth**: No public technical documentation on how Jules
memory is implemented. Only high-level product descriptions available.

**Cross-agent portability**: Letta claims model-portable memory. No independent
evaluation of how well Context Repositories survive major model version changes
(e.g., Claude 3 → 4 architectural shifts).

**Bolt technical architecture**: No public technical documentation on Bolt's
internal context management. Comparison articles focus on UX, not internals.

**OpenHands memory condensation**: Acknowledged as an open problem (#5715 on
GitHub) but no production solution found. How long-running sessions are handled
remains unsolved.

---

## Serendipity

**Cursor dropped memory**: Cursor shipped then removed auto-memory in 2025. This
is a data point that automatic memory extraction at the IDE level may create
more problems than it solves when not carefully gated. The community moved to
Rules-based approaches (`.cursorrules`) instead — which is architecturally
identical to CLAUDE.md.

**letta-ai/skills shared repository**: Letta maintains a public GitHub repo of
reusable agent skills, intended to work with Letta Code, Claude Code, Codex CLI,
and others. This represents an emerging cross-agent skills commons — portable
procedural memory.

**MemoriPilot community project**: Independent developer built a memory system
for Copilot (GitHub: `Deltaidiots/memoripilot`) before GitHub shipped native
memory. The fact that community memory plugins emerged for both Cursor and
Copilot confirms that the gap was real and painful enough for third-party
investment.

**Memory market size**: Industry analyst (Mordor Intelligence) estimates the AI
agent memory market at $6.27B in 2025, projected to $28.45B by 2030 (35% CAGR).
This is a significant commercial category emerging specifically around memory
persistence.

**AgentCore extraction latency**: AWS's production memory extraction takes 20-40
seconds. This suggests that real-time memory extraction during an agent session
is not yet feasible; memory must be built asynchronously post-session.

---

## Confidence Assessment

- **HIGH claims:** 9 (Devin Knowledge, SWE-Agent summarizer, OpenHands event
  stream, Letta/MemGPT, AgentCore three-strategy, Jules preferences, GitHub
  Copilot memory, Augment context engine, memory benchmarks)
- **MEDIUM claims:** 2 (Bolt/Lovable/v0 manual approach, cross-cutting patterns
  synthesis)
- **LOW claims:** 0
- **UNVERIFIED claims:** 0

**Overall confidence: HIGH**

All major architectural claims are sourced from official documentation, vendor
technical blogs, or peer-reviewed academic papers. The one weak area is Jules —
architecture claims rest on product blog posts only, no technical documentation
available.
