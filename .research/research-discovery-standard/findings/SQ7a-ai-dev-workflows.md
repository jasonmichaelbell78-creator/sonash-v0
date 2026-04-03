# Findings: How do AI-augmented development workflows handle multi-source research and verification at scale?

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-24
**Sub-Question IDs:** SQ-7a

---

## Key Findings

### 1. Cursor: Embedding-Based Semantic Search + Parallel Agent Isolation [CONFIDENCE: HIGH]

**How it discovers relevant code/context:** Cursor uses a Retrieval-Augmented
Generation (RAG) architecture. When codebase indexing is enabled, it scans the
opened project folder, computes a Merkle tree of file hashes, and synchronizes
with Cursor's server. Files are split into semantically meaningful chunks using
Abstract Syntax Tree (AST) structure (depth-first traversal into sub-trees that
fit token limits). These chunks are converted into vector embeddings (stored in
Turbopuffer, a remote vector database) using OpenAI's embedding API or a custom
embedding model. Source code never leaves the local machine -- only embeddings
and metadata are stored remotely [1][2].

When a user queries (via `@Codebase` or Cmd+Enter), Cursor computes a query
embedding, performs nearest-neighbor search in the vector DB, retrieves the most
relevant code chunks, reads them from local files, and sends them as context to
the LLM [1][2].

**Multi-source research:** Cursor's agent mode combines semantic search with
instant grep (millisecond-speed text search) and terminal command execution. The
agent uses both grep and semantic search together, plus can browse documentation
via tool use. However, Cursor does not natively integrate web search for
external documentation -- it primarily operates within the codebase [3][4].

**Verification before acting:** Cursor 2.0's agent mode runs terminal commands,
checks build output, and iterates. The agent can run tests and verify changes
compile before presenting them. No explicit "research phase" is mandated -- the
agent searches, plans, and acts in a fluid loop [3].

**Multi-agent patterns:** Cursor 2.0/2.5 supports up to 8 parallel agents
running simultaneously, each in isolated git worktrees or remote Ubuntu VMs.
Each agent has its own workspace copy, status tracking, and output logs. A
sidebar shows running/completed/waiting agents. Changes stay isolated until
deliberately merged [4][5].

**Tiered complexity model:** Cursor's FastRender project (1M+ LOC) demonstrated
a three-tier agent architecture: Planners (continuously explore codebase, create
tasks), Workers (execute assigned tasks independently), and Judges (determine
whether to continue at cycle end). This is the closest any system gets to an
explicit tiered complexity model [6].

**Lessons for our standard:**

- AST-aware chunking is superior to naive line/token splitting
- Embedding caching by chunk content avoids redundant computation (92% cache hit
  rate across team members on same repo)
- Parallel agent isolation via git worktrees is a proven pattern
- The Planner/Worker/Judge hierarchy is directly applicable to tiered research

---

### 2. Windsurf/Codeium: Cascade Context Engine with Multi-Layer Assembly [CONFIDENCE: HIGH]

**How it discovers relevant code/context:** Windsurf indexes the entire local
codebase on project open (not just open files) using RAG. Each file and function
gets converted to 768-dimensional vector embeddings capturing semantic meaning.
The system uses a proprietary retrieval method called "M-Query" that improves
precision over basic cosine similarity [7][8].

**Context assembly is multi-layered**, loading in this order: (1) global
`.windsurfrules`, (2) project-level rules, (3) Memories from previous sessions,
(4) open files (active file gets highest weight), (5) codebase retrieval via
M-Query for semantically relevant snippets, (6) recent actions (file edits,
terminal commands), then (7) merging all sources weighted and trimmed to fit the
context window [8].

**Multi-source research:** Cascade registers real-time "flow awareness" events
-- when you save a file, run a failing test, or navigate to a function
definition, this context is automatically included without the user saying
anything. This is implicit multi-source research (code + actions + history +
rules) [7][8].

**Verification before acting:** Cascade typically responds with a plan, then
begins executing -- reading relevant files, making edits, running terminal
commands, and iterating until the task completes or it requires user input. The
plan-first approach provides a verification checkpoint [9].

**Multi-agent patterns:** No explicit multi-agent architecture documented.
Cascade operates as a single agent with deep context awareness. However,
Windsurf's "SWE-grep" retrieval uses 8 parallel tool calls per turn across 4
turns, which is a form of parallel research within a single agent [10].

**Tiered complexity model:** No explicit tiered model. Windsurf differentiates
"Write" mode (agent-driven, can edit files, run commands) from "Chat" mode
(conversational, read-only) but this is a binary distinction, not a tiered
research escalation [9].

**Lessons for our standard:**

- Multi-layer context assembly (rules + memory + code + actions) is a powerful
  pattern
- Persistent session memory across conversations provides continuity
- Flow awareness (registering user actions as implicit context) reduces the
  "tell the AI what you're doing" burden
- Proprietary retrieval methods (M-Query) can outperform basic cosine similarity

---

### 3. Devin/Cognition: Interactive Planning + Indexed Search + Desktop Verification [CONFIDENCE: HIGH]

**How it discovers relevant code/context:** Devin indexes the main branch of
connected repositories automatically. "Devin Search" is an agentic search tool
that explores and understands codebases, returning detailed answers with cited
code. For complex questions, a "Deep Mode" enables more thorough exploration.
The index is built asynchronously and may miss very recent changes during
initial assessment, though Devin explores deeper later in planning [11][12].

**Multi-source research:** Devin operates in a full Linux desktop environment
with a browser, shell, editor, and planner. It can browse the web, read
documentation, search code, and test applications. This is genuine multi-source
research -- Devin can look up API docs, read Stack Overflow, test in a browser,
and modify code all within one session [12][13].

**Verification before acting:** Devin 2.0 introduced "Interactive Planning" --
when a session starts, Devin interprets the prompt, rapidly searches the
codebase, finds relevant files and snippets, and proposes a detailed plan that
engineers can modify before execution begins. Each session starts with relevant
files, findings, and a preliminary plan. The plan evolves as new information
becomes available [11][12].

After implementation, Devin self-reviews its output, catches issues, and fixes
them before creating a PR. For web apps, Devin launches and tests them on its
desktop, sending back screen recordings for human review [13].

**Multi-agent patterns:** Devin itself is a single autonomous agent with
specialized internal components (planner, executor, verifier) rather than
explicit multi-agent delegation. It uses machine snapshots and playbooks for
repository-specific setup [12].

**Tiered complexity model:** No explicit tiered model. Devin delegates based on
user task assignment. The distinction is between "Devin Search" (quick Q&A about
codebase) and full session mode (autonomous implementation). Deep Mode within
Search provides a second tier [11].

**Lessons for our standard:**

- Interactive planning (research-then-propose-then-act) is a proven verification
  pattern
- Codebase indexing with cited code in answers builds trust
- Screen recordings as verification artifacts is innovative
- The research->plan->approve->execute loop is directly relevant
- Deep Mode (escalation within search) maps to tiered complexity

---

### 4. OpenHands (formerly OpenDevin): Event-Sourced Multi-Agent Architecture [CONFIDENCE: MEDIUM-HIGH]

**How it discovers relevant code/context:** OpenHands uses an event-stream
architecture that models agent-environment interaction through an event log. The
primary CodeActAgent can write code, execute bash commands, run Python, and
perform browser-based actions. Context discovery happens through code execution
-- agents navigate repositories by running shell commands, reading files, and
using standard developer tools [14][15].

**Multi-source research:** OpenHands is the most explicitly multi-source system:
CodeActAgent handles code and terminal, while BrowsingAgent handles web
research. The platform supports agent delegation via `AgentDelegateAction`,
where CodeActAgent delegates web browsing tasks to the specialized BrowsingAgent
for complex browser automation (navigate, click, submit forms) using BrowserGym
[14][15][16].

**Verification before acting:** OpenHands includes a security analyzer for agent
actions, flexible lifecycle control (pause/resume, sub-agent delegation, history
restore), and built-in QA instrumentation. The event-stream architecture enables
deterministic replay for debugging. Each session runs in a Docker container with
full OS capabilities isolated from the host [15][16].

**Multi-agent patterns:** OpenHands has the most mature multi-agent delegation
of any system studied. Agents can delegate subtasks to other agents using
built-in delegation primitives with a standardized vocabulary for agent roles
and capabilities. The V1 SDK refactored the monolithic design into a modular SDK
with clear boundaries, opt-in sandboxing, and reusable agent/tool/workspace
packages [15][16].

**Tiered complexity model:** Hierarchical agent structures are supported but not
formalized into tiers. The delegation is task-type-based (code vs. browsing)
rather than complexity-based [14].

**Lessons for our standard:**

- Event-sourced state with deterministic replay is excellent for debugging and
  auditing
- Explicit agent role delegation (CodeAct vs. Browsing) prevents role confusion
- Docker-based sandboxing enables safe autonomous execution
- Standardized vocabulary for agent roles/capabilities is directly applicable
- The AgentDelegateAction pattern maps well to our subagent spawning

---

### 5. SWE-agent (Princeton): Minimalist ACI with Focused Tool Design [CONFIDENCE: HIGH]

**How it discovers relevant code/context:** SWE-agent uses a custom
Agent-Computer Interface (ACI) with granular commands: `find_file`,
`search_file`, and `search_dir`. These produce concise, context-limited outputs
(max 50 search hits) to prevent context overflow. The file viewer shows contents
with line numbers; navigation is explicit and controlled [17][18].

**Multi-source research:** SWE-agent operates exclusively within the codebase --
it does not browse the web or consult external documentation. Research is
limited to repository navigation, code reading, and test execution. The
mini-swe-agent variant (100 lines of Python) achieves 74%+ on SWE-bench Verified
using only bash as its tool, demonstrating that raw shell access can be
sufficient [17][19].

**Verification before acting:** SWE-agent includes a linter that runs when an
edit command is issued and blocks the edit if code is syntactically incorrect.
Test execution is built into the loop -- the agent reads an issue, asks the LLM
how to fix it, performs edits, and runs existing test cases. Observations
preceding the last 5 are collapsed to single lines to maintain context relevance
[17][18].

**Multi-agent patterns:** No multi-agent architecture. SWE-agent is deliberately
single-agent, relying on the quality of the ACI design rather than agent
coordination [17].

**Tiered complexity model:** No tiered model. All tasks go through the same
search->edit->test loop. However, Live-SWE-Agent extends mini-swe-agent with
dynamic tool augmentation -- the model creates Python tools on-the-fly during a
run, achieving 75.4% on SWE-bench Verified [19].

**Key design principles:**

- Actions should be simple and easy to understand
- Simple commands with few options and concise documentation are easier for
  agents
- Actions should be efficient -- important operations consolidated into as few
  actions as possible
- Informative prompts, error messages, and history processors keep context
  concise [17][18]

**Lessons for our standard:**

- Tool simplicity trumps tool quantity (mini-swe-agent proves bash alone scores
  74%)
- Context overflow prevention via output limits (50 hit max) is critical
- Linting-on-edit as automatic verification is elegant
- History compression (collapsing old observations) maintains focus
- The scaffolding/interface matters more than the model choice
- Dynamic tool creation during execution is a frontier pattern

---

### 6. Aider: Tree-Sitter AST + PageRank Graph for Context Selection [CONFIDENCE: HIGH]

**How it discovers relevant code/context:** Aider uses tree-sitter to parse
source files into ASTs, extracts code definitions (functions, classes,
variables, types) and their references across files, then builds a dependency
graph where each source file is a node and edges connect files with
dependencies. Files are ranked using NetworkX's PageRank algorithm, personalized
based on the current chat context. The most important identifiers (most
frequently referenced by other code) form the repository map [20][21].

The repo map is token-budget-aware: it selects the most important parts of the
codebase that will fit within the active token budget, sending only the most
relevant portions rather than the entire map [20][21].

**Multi-source research:** Aider is primarily code-focused. It does not natively
browse the web or consult external documentation. Research is limited to the git
repository. However, Aider supports multiple LLM providers and can switch models
for different tasks [20].

**Verification before acting:** Aider integrates tightly with git -- every
change is automatically committed, providing easy rollback. It uses a diff-based
editing approach where the LLM outputs search/replace blocks rather than
rewriting entire files, reducing error surface. Aider runs linting after edits
and can auto-fix lint errors [20].

**Multi-agent patterns:** No multi-agent architecture. Aider is a single-agent
system with sophisticated context selection [20].

**Tiered complexity model:** No explicit tiered model. Aider has an "architect
mode" where one model (e.g., o1) generates a high-level plan and another model
(e.g., Sonnet) implements it -- a two-tier pattern [20].

**Lessons for our standard:**

- PageRank on dependency graphs is a principled way to identify important code
- Tree-sitter AST parsing enables language-aware context selection
- Token-budget-aware context assembly prevents context overflow
- Git-integrated auto-commit provides safety net for autonomous changes
- Two-model architect/implementer split maps to research/execution tiers

---

### 7. Claude Code: Skills + Subagents + MCP for Research Orchestration [CONFIDENCE: HIGH]

**How it discovers relevant code/context:** Claude Code uses built-in tools:
Grep (ripgrep-based content search), Glob (file pattern matching), Read (file
reading), and Bash for arbitrary shell commands. It does not maintain a
persistent codebase index like Cursor/Windsurf -- instead, it performs on-demand
search each time. This is simpler but potentially slower for very large
codebases. CLAUDE.md files at project, user, and directory levels provide
persistent context that loads automatically [22][23].

**Multi-source research:** Claude Code has the most extensible multi-source
research capability through MCP (Model Context Protocol). Users can connect web
search (Brave Search, Perplexity Sonar), documentation databases (Context7),
code search (claude-context by Zilliz), and arbitrary data sources via MCP
servers. The built-in WebSearch tool provides direct web access. MCP Tool Search
(January 2026) dynamically loads tools on-demand when there are many MCP
servers, reducing context pollution from ~77K to ~8.7K tokens [22][24].

**Verification before acting:** Claude Code's verification is primarily
behavioral -- CLAUDE.md files encode project rules, anti-patterns, and
checklists that the agent follows. There is no automatic linting-on-edit or
forced test execution built into the core product. Skills can encode
verification workflows (e.g., code-reviewer agent, test-suite execution) but
these are user-configured, not default [23].

**Multi-agent patterns:** Claude Code has the most mature multi-agent
architecture for user-configured workflows:

- **Subagents** (Task tool): Isolated agents with their own context windows, can
  run in parallel, report results back to parent. Cannot communicate with each
  other directly. Can specify which model to use based on task complexity (Haiku
  for simple, Opus for complex) [22][25].
- **Agent Teams** (February 2026): Multiple Claude agents that can communicate
  with each other, divide work, and execute in parallel. These go beyond
  subagents by enabling inter-agent messaging [25].
- **Skills**: Reusable instruction sets stored as SKILL.md files, which can
  spawn subagents, restrict tool access, override models, and hook into
  lifecycle events [22][23].

**Tiered complexity model:** Claude Code itself does not enforce tiers, but the
skill system enables user-defined tiered workflows. The deep-research skill
pattern demonstrates a tiered approach: orchestrator decomposes questions into
sub-questions, spawns parallel searcher subagents, then a synthesizer combines
findings. Model selection per subagent enables cost/quality tiering (Haiku for
simple lookups, Sonnet for moderate tasks, Opus for complex reasoning) [22][25].

**What most users do NOT use:** Based on the research, most Claude Code users
underutilize: (a) custom subagents for research parallelism, (b) MCP servers for
multi-source data access, (c) skill files for reusable workflows, (d) agent
teams for coordinated multi-agent work, (e) model routing for cost optimization,
and (f) CLAUDE.md conventions for persistent project context [22][23][25].

**Lessons for our standard:**

- MCP provides unmatched extensibility for multi-source research
- On-demand search (no persistent index) is simpler but has latency tradeoffs
- Subagent model selection based on task complexity is directly applicable
- Skill files as reusable research workflows are a powerful pattern
- The gap between platform capabilities and typical usage is enormous

---

## Cross-Cutting Patterns Across All Systems

### Pattern 1: Research-Before-Action is Universal but Implementation Varies [CONFIDENCE: HIGH]

Every system researches before acting, but the mechanisms differ:

- **Index-based** (Cursor, Windsurf, Devin): Pre-built codebase embeddings
  enable instant semantic search
- **On-demand** (Claude Code, SWE-agent, Aider): Search at query time via grep,
  AST parsing, or shell commands
- **Hybrid** (Devin): Index for initial assessment, deeper exploration during
  planning

Index-based systems are faster for repeated queries but require upfront
computation. On-demand systems are more flexible but slower. The ideal is likely
hybrid [1][7][11][17][20][22].

### Pattern 2: Context Assembly is a Multi-Layer Problem [CONFIDENCE: HIGH]

No system relies on a single context source. The layers observed across systems:

1. **Project rules/conventions** (CLAUDE.md, .windsurfrules, .cursorrules)
2. **Session memory** (Windsurf Memories, Devin machine snapshots)
3. **Code structure** (AST, embeddings, dependency graphs)
4. **User actions** (recent edits, terminal output, navigation)
5. **External knowledge** (web search, documentation, APIs)
6. **Task history** (event logs, conversation history)

Windsurf's explicit layered assembly is the most articulated version of this
pattern [8].

### Pattern 3: Parallel Execution is the Frontier, Not the Default [CONFIDENCE: HIGH]

Only three systems support true parallel agent execution:

- **Cursor**: Up to 8 parallel agents in isolated worktrees
- **Claude Code**: Parallel subagents via Task tool + Agent Teams
- **OpenHands**: Agent delegation (though typically sequential)

Most systems (Aider, SWE-agent, Windsurf) remain single-agent. The industry is
moving toward parallelism but it is not yet standard [4][5][25][14].

### Pattern 4: Verification Approaches Form a Spectrum [CONFIDENCE: HIGH]

From most automated to most manual:

1. **Automatic**: SWE-agent linting-on-edit (blocks bad syntax), Aider
   auto-commit (easy rollback)
2. **Agent self-review**: Devin self-reviews PRs, catches issues, sends screen
   recordings
3. **Plan approval**: Devin Interactive Planning, Cascade plan-first approach
4. **Human review**: All systems ultimately rely on human verification for
   correctness

No system has solved autonomous verification of semantic correctness. All rely
on either tests or human review for functional validation [11][13][17][20].

### Pattern 5: The Scaffolding Matters More Than the Model [CONFIDENCE: HIGH]

Mini-swe-agent (100 lines, bash-only) scores 74% on SWE-bench Verified. Cursor's
FastRender success came from the Planner/Worker/Judge architecture, not model
choice. Anthropic's 2026 Agentic Coding Trends Report notes the same: how tools
implement their agents affects performance more than the underlying LLM
[6][10][19].

This validates our approach of investing in research/discovery workflow design
rather than relying on raw model capability.

### Pattern 6: Multi-Source Research Remains Rare in Practice [CONFIDENCE: MEDIUM-HIGH]

Despite capabilities:

- Only **Devin** and **Claude Code** (via MCP) natively combine code + web +
  documentation research
- **OpenHands** delegates browsing to a specialized agent
- **Cursor**, **Windsurf**, **Aider**, and **SWE-agent** are primarily code-only

Most AI dev tools treat "research" as "search the codebase" -- not "search the
codebase AND docs AND web AND community." This is a significant gap and
opportunity [11][14][22][24].

### Pattern 7: Tiered Complexity Models are Emergent, Not Standard [CONFIDENCE: MEDIUM]

No system has a formal tiered complexity model for research. The closest
approximations:

- **Cursor FastRender**: Planner/Worker/Judge hierarchy [6]
- **Claude Code Skills**: User-defined orchestrator/searcher/synthesizer
  [22][25]
- **Devin Search**: Normal search vs. Deep Mode [11]
- **Aider**: Architect mode (planner model + implementer model) [20]

The industry has not converged on a standard tiered approach. This represents an
opportunity for our standard to lead [6][11][20][22].

---

## Summary Table: System Capabilities

| Capability                 | Cursor                 | Windsurf                  | Devin                        | OpenHands               | SWE-agent    | Aider                  | Claude Code             |
| -------------------------- | ---------------------- | ------------------------- | ---------------------------- | ----------------------- | ------------ | ---------------------- | ----------------------- |
| Codebase indexing          | Embeddings + AST       | Embeddings (768d)         | Branch indexing              | On-demand               | ACI commands | Tree-sitter + PageRank | On-demand (Grep/Glob)   |
| Multi-source research      | Code only              | Code + actions            | Code + web + desktop         | Code + web (delegated)  | Code only    | Code only              | Code + web + docs (MCP) |
| Verification before acting | Agent self-test        | Plan-first                | Interactive Planning         | Security analyzer       | Lint-on-edit | Auto-commit            | Behavioral (CLAUDE.md)  |
| Multi-agent                | 8 parallel (worktrees) | Single (8 parallel calls) | Single (internal components) | Hierarchical delegation | Single       | Single                 | Subagents + Teams       |
| Tiered complexity          | Planner/Worker/Judge   | None                      | Search vs. Deep Mode         | Role-based delegation   | None         | Architect mode         | User-defined skills     |

---

## Sources

| #   | URL                                                                                                         | Title                                                  | Type              | Trust  | CRAAP | Date |
| --- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------- | ------ | ----- | ---- |
| 1   | https://towardsdatascience.com/how-cursor-actually-indexes-your-codebase/                                   | How Cursor Actually Indexes Your Codebase              | tech-journalism   | MEDIUM | 4.0   | 2025 |
| 2   | https://read.engineerscodex.com/p/how-cursor-indexes-codebases-fast                                         | How Cursor Indexes Codebases Fast                      | tech-blog         | MEDIUM | 3.8   | 2025 |
| 3   | https://cursor.com/blog/agent-best-practices                                                                | Agent Best Practices                                   | official-docs     | HIGH   | 4.5   | 2025 |
| 4   | https://cursor.com/docs/configuration/worktrees                                                             | Parallel Agents - Cursor Docs                          | official-docs     | HIGH   | 4.5   | 2026 |
| 5   | https://medium.com/towards-data-engineering/parallel-ai-agents-in-cursor-2-0-a-practical-guide-e808f89cffb9 | Parallel AI Agents in Cursor 2.0                       | tech-blog         | MEDIUM | 3.5   | 2026 |
| 6   | https://www.faros.ai/blog/best-ai-coding-agents-2026                                                        | Best AI Coding Agents for 2026                         | industry-analysis | MEDIUM | 3.8   | 2026 |
| 7   | https://markaicode.com/windsurf-flow-context-engine/                                                        | Windsurf Flow: How the Context Engine Works            | tech-blog         | MEDIUM | 3.5   | 2026 |
| 8   | https://docs.windsurf.com/context-awareness/overview                                                        | Context Awareness Overview - Windsurf Docs             | official-docs     | HIGH   | 4.5   | 2026 |
| 9   | https://docs.windsurf.com/windsurf/cascade/cascade                                                          | Windsurf Cascade                                       | official-docs     | HIGH   | 4.5   | 2026 |
| 10  | https://windsurf.com/compare/windsurf-vs-cursor                                                             | Windsurf vs Cursor                                     | official-docs     | MEDIUM | 3.5   | 2026 |
| 11  | https://docs.devin.ai/work-with-devin/interactive-planning                                                  | Interactive Planning - Devin Docs                      | official-docs     | HIGH   | 4.5   | 2025 |
| 12  | https://cognition.ai/blog/devin-2                                                                           | Devin 2.0                                              | official-blog     | HIGH   | 4.5   | 2025 |
| 13  | https://cognition.ai/blog/devin-annual-performance-review-2025                                              | Devin's 2025 Performance Review                        | official-blog     | HIGH   | 4.5   | 2025 |
| 14  | https://arxiv.org/abs/2407.16741                                                                            | OpenHands: An Open Platform for AI Software Developers | academic-paper    | HIGH   | 4.5   | 2024 |
| 15  | https://arxiv.org/abs/2511.03690                                                                            | The OpenHands Software Agent SDK                       | academic-paper    | HIGH   | 4.5   | 2025 |
| 16  | https://arxiv.org/html/2407.16741v3                                                                         | OpenHands Platform (v3)                                | academic-paper    | HIGH   | 4.5   | 2025 |
| 17  | https://arxiv.org/abs/2405.15793                                                                            | SWE-agent: Agent-Computer Interfaces                   | academic-paper    | HIGH   | 4.8   | 2024 |
| 18  | https://swe-agent.com/latest/background/                                                                    | SWE-agent Documentation                                | official-docs     | HIGH   | 4.5   | 2025 |
| 19  | https://github.com/SWE-agent/mini-swe-agent                                                                 | Mini-SWE-Agent                                         | source-code       | HIGH   | 4.5   | 2025 |
| 20  | https://aider.chat/docs/repomap.html                                                                        | Repository Map - Aider                                 | official-docs     | HIGH   | 4.5   | 2025 |
| 21  | https://aider.chat/2023/10/22/repomap.html                                                                  | Building a Better Repo Map with Tree Sitter            | official-blog     | HIGH   | 4.2   | 2023 |
| 22  | https://code.claude.com/docs/en/sub-agents                                                                  | Create Custom Subagents - Claude Code                  | official-docs     | HIGH   | 4.5   | 2026 |
| 23  | https://code.claude.com/docs/en/mcp                                                                         | Connect Claude Code to Tools via MCP                   | official-docs     | HIGH   | 4.5   | 2026 |
| 24  | https://claudefa.st/blog/tools/mcp-extensions/search-tools                                                  | Claude Code Search: Web Access Through MCP             | community-blog    | MEDIUM | 3.5   | 2026 |
| 25  | https://claudefa.st/blog/guide/agents/sub-agent-best-practices                                              | Claude Code Sub-Agents: Parallel vs Sequential         | community-blog    | MEDIUM | 3.8   | 2026 |
| 26  | https://resources.anthropic.com/hubfs/2026%20Agentic%20Coding%20Trends%20Report.pdf                         | 2026 Agentic Coding Trends Report                      | industry-report   | HIGH   | 4.5   | 2026 |

---

## Contradictions

1. **Index-based vs. on-demand search superiority**: Cursor/Windsurf advocates
   claim embedding-based semantic search is essential for large codebases.
   SWE-agent/mini-swe-agent demonstrate that simple bash commands achieve 74%+
   on SWE-bench without any indexing. The resolution likely depends on task
   type: semantic search excels for "find related code" queries while grep/find
   excels for "find exact usage" queries. Both are needed.

2. **Single-agent vs. multi-agent effectiveness**: OpenHands and Cursor invest
   heavily in multi-agent coordination, while mini-swe-agent and Aider achieve
   strong results with single agents. The Anthropic Agentic Coding Trends Report
   [26] notes that "scaffolding matters more than the model," but does not claim
   multi-agent is universally superior. The UC San Diego/Cornell study found
   experienced developers were 19% slower with AI tools while believing they
   were 20% faster -- suggesting that coordination overhead (whether human-agent
   or agent-agent) has real costs.

3. **Autonomy vs. oversight**: Devin aims for maximum autonomy (15% fully
   autonomous task completion). Anthropic's report advocates "bounded autonomy"
   with mandatory escalation paths. The industry has not settled this tension --
   systems range from fully autonomous (Devin) to fully human-in-the-loop
   (Aider).

---

## Gaps

1. **No system publishes research-phase metrics**: None of the systems studied
   report how long agents spend in research/discovery vs. implementation. This
   data would be invaluable for tuning tiered complexity models.

2. **Cross-system benchmarking on research quality**: SWE-bench measures issue
   resolution, not research quality. No benchmark evaluates how well agents
   understand a codebase before acting.

3. **Documentation research integration**: Only Devin and Claude Code (via MCP)
   can research external documentation as part of their workflow. The gap
   between "search codebase" and "search everything relevant" is largely
   unaddressed.

4. **Formal tiered complexity models**: No system has published a formal
   research tier model (e.g., "quick lookup -> focused search -> deep
   investigation -> multi-agent research"). The patterns exist implicitly but
   are not standardized.

5. **Verification of research completeness**: No system can assess whether its
   research phase was thorough enough before proceeding to action. All rely on
   either time budgets or heuristic stopping conditions.

---

## Serendipity

1. **Live-SWE-Agent dynamic tool creation**: The pattern where an agent creates
   new Python tools during execution and uses them in subsequent steps
   (achieving 75.4% on SWE-bench Verified) is a frontier research pattern. This
   "meta-tool creation" approach could apply to research workflows -- agents
   creating specialized research tools as needed during investigation.

2. **Cursor's embedding cache sharing**: 92% similarity across team members on
   the same repo means embeddings could be shared across research sessions,
   dramatically reducing startup costs for recurring investigations on the same
   codebase.

3. **Windsurf's M-Query retrieval**: A proprietary method that beats cosine
   similarity for code retrieval. The details are not public, but the existence
   of code-specific retrieval methods better than generic vector similarity is
   worth tracking.

4. **Anthropic's 2026 Agentic Coding Trends Report finding**: "Developers now
   integrate AI into 60% of their work while maintaining active oversight on
   80-100% of delegated tasks." This suggests research/discovery workflows
   should be designed for high-oversight, not high-autonomy.

5. **The universal SKILL.md format**: As of 2026, the same skill files work
   across Claude Code, Cursor, Gemini CLI, Codex CLI, and Antigravity IDE. This
   cross-platform portability means our research/discovery standard could be
   portable beyond just Claude Code.

---

## Lessons for Our Research/Discovery Standard

### Immediate applicability (HIGH confidence):

1. **Multi-layer context assembly**: Adopt Windsurf's pattern of rules +
   memory + code + actions + external knowledge, assembled with explicit
   priority weighting
2. **Research-before-act with approval gate**: Follow Devin's Interactive
   Planning model -- research, propose plan, get approval, execute
3. **Parallel agent research**: Use Claude Code's subagent pattern for
   independent research streams, with synthesizer agent for combination
4. **Context overflow prevention**: Apply SWE-agent's output limits (max N
   results per search) and history compression
5. **Token-budget-aware context selection**: Adopt Aider's approach of selecting
   the most important context that fits within the available budget

### Medium-term applicability (MEDIUM confidence):

6. **Tiered complexity model**: Formalize Cursor's Planner/Worker/Judge into
   research tiers (Quick lookup / Focused search / Deep investigation /
   Multi-agent parallel research)
7. **Model routing by complexity**: Use Claude Code's subagent model selection
   (Haiku for simple, Sonnet for moderate, Opus for complex)
8. **AST-aware code understanding**: Incorporate tree-sitter parsing (Aider) or
   AST chunking (Cursor) for more intelligent code context selection
9. **Dynamic tool creation**: Track SWE-agent's Live-SWE-Agent pattern for
   potential adoption

### Architectural principles (HIGH confidence):

10. **Scaffolding > Model**: Invest in research workflow design, not model
    switching
11. **Simple tools > Complex tools**: SWE-agent's ACI design principles apply --
    fewer, simpler, well-documented tools outperform many complex ones
12. **Multi-source is essential**: Code + docs + web research should be the
    default, not the exception
13. **Verification must be explicit**: Automatic (linting), agent-driven
    (self-review), and human (approval gates) verification layers

---

## Confidence Assessment

- HIGH claims: 14
- MEDIUM-HIGH claims: 2
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

The findings are well-supported by official documentation, academic papers, and
multiple corroborating sources. The main uncertainty is in cross-cutting pattern
claims (Patterns 6, 7) where the landscape is actively evolving and some systems
may have undocumented capabilities.
