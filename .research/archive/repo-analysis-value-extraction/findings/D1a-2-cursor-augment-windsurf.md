# D1a-2: Cursor, Augment & Windsurf — Repo-Level Code Understanding

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** SQ-D1a-2-1, SQ-D1a-2-2, SQ-D1a-2-3, SQ-D1a-2-4 **Domain:**
technology

---

## Key Findings

1. **Cursor uses a 5-step semantic indexing pipeline with AST-aware chunking and
   Merkle-tree change detection** [CONFIDENCE: HIGH]

   Cursor's indexing pipeline: (1) AST-aware code splitting via tree-sitter at
   function/class boundaries, (2) Merkle tree construction for change detection,
   (3) embedding generation using OpenAI's API or a custom model, (4) remote
   storage in Turbopuffer (vector DB combining vector + full-text search), (5)
   incremental updates every 10 minutes using hash comparisons — only modified
   chunks are re-uploaded, resulting in 90% fewer uploads vs. full re-indexing.
   Chunk size is "a few hundred tokens each." At query time (@Codebase), the
   user's question is embedded, vector-searched against Turbopuffer, and
   matching chunks are decrypted locally and sent to the LLM. Importantly,
   plaintext code is never persisted — it is encrypted and discarded after
   embedding. [SOURCE: Engineer's Codex, Cursor shadow workspace blog, Morph
   indexing comparison]

2. **Cursor's "Shadow Workspace" provides LSP feedback loop for iterative AI
   code refinement** [CONFIDENCE: HIGH]

   Cursor runs a hidden Electron window in the background that applies
   AI-proposed code changes to an isolated environment, collects language server
   protocol (linter, type-checker) feedback, and returns it to the AI for
   iterative refinement — without touching the user's active files. This bridges
   the gap from "90% working code to 100%." A planned evolution uses FUSE
   (filesystem in userspace) for kernel-level virtualization to enable rapid
   environment resets between agent requests. The shadow workspace explains
   Cursor's higher code correctness vs. tools without this layer. [SOURCE:
   Cursor shadow-workspace blog]

3. **Cursor supports up to 8 parallel agents in isolated Ubuntu VMs with Git
   worktrees** [CONFIDENCE: HIGH]

   As of Cursor 2.5 (2025/2026), agents run in cloud-hosted Ubuntu VMs with
   internet access, using Git worktrees to isolate code changes. Most tasks
   complete in under 30 seconds. BugBot (launched Feb 2026) processes 2M+
   PRs/month with 70% resolution rate — it reviews PRs, spins up a cloud agent
   on finding issues, tests a fix, and proposes it directly on the PR. [SOURCE:
   Cursor changelog, adwaitx.com BugBot analysis]

4. **Augment Code's Context Engine uses quantized vector search over a semantic
   graph, handling 100M+ line codebases** [CONFIDENCE: HIGH]

   Augment's architecture goes beyond naive RAG: it builds a semantic graph that
   understands relationships, dependencies, and architectural patterns across up
   to 1M+ indexed files. The core retrieval uses quantized vector search (ANN
   with quantization): embeddings are reduced to bit-vector "neighborhoods" for
   fast candidate retrieval, then full similarity is computed on candidates —
   achieving 40% latency reduction (2s to <200ms), 8x memory reduction (2GB to
   250MB), and 99.9% accuracy parity. The engine indexes code, commit history,
   PR history, documentation, external wikis, and what Augment calls "tribal
   knowledge." [SOURCE: Augment quantized vector search blog, Augment
   context-engine page]

5. **Augment's Context Lineage indexes commit history via LLM-summarized diffs**
   [CONFIDENCE: HIGH]

   Augment's "Context Lineage" feature indexes git commits in real time: it
   scans commits on the current branch, uses Gemini 2.0 Flash to summarize each
   diff into a compact searchable document (objective, key functions modified,
   technical terms), then stores these summaries as embedded chunks alongside
   code. On agent queries, relevant historical commits are retrieved and
   injected into the prompt. This gives agents "evolution-aware" codebase
   intelligence — e.g., "find the earlier commit that introduced this feature
   flag" — at low token overhead. [SOURCE: Augment context-lineage blog]

6. **Augment's Context Engine MCP exposes a single `codebase-retrieval` tool to
   any MCP-compatible agent, with 30–80% quality improvements** [CONFIDENCE:
   HIGH]

   Released GA in February 2026, the Context Engine MCP works in two modes: (a)
   Local — runs Auggie CLI as an MCP server, indexing the working directory in
   real time; (b) Remote — connects to `https://api.augmentcode.com/mcp`,
   indexing GitHub/GitLab/Bitbucket repos via GitHub App integration. Each query
   costs 40–70 Augment credits. Benchmark on 300 Elasticsearch PRs: Claude
   Code + Opus 4.5 saw +80% improvement; Cursor + Claude Opus 4.5 saw +71%;
   Cursor + Composer-1 saw +30%. A key insight from their benchmarks: "A weaker
   model with great context (Sonnet + MCP) outperforms a stronger model with
   poor context (Opus without MCP)." [SOURCE: Augment MCP docs, Augment blog,
   Augment product page]

7. **Windsurf's Cascade uses a 4-layer context pipeline with the proprietary
   M-Query retrieval technique** [CONFIDENCE: HIGH]

   Cascade assembles context through four layers on every interaction: (1)
   project rules (.windsurfrules), (2) persistent Memories (evolved decisions
   across sessions), (3) open/active files, (4) M-Query codebase retrieval.
   M-Query is a proprietary retrieval technique that improves precision over
   basic cosine similarity and reduces hallucination rates. The 768-dimension
   vector embeddings are generated locally; enterprise tiers support remote
   multi-repo indexing. Cascade also tracks the full "activity timeline" — file
   edits, terminal commands, clipboard history, navigation — to infer developer
   intent without requiring explicit context specification. [SOURCE: Markaicode
   Windsurf Flow analysis, Windsurf docs context overview]

8. **Windsurf's SWE-grep/SWE-grep-mini is a specialized RL-trained retrieval
   subagent delivering 20x faster context gathering** [CONFIDENCE: HIGH]

   Cognition (Windsurf's parent as of Dec 2025) trained SWE-grep and
   SWE-grep-mini using reinforcement learning specifically for multi-turn
   context retrieval. They execute up to 8 parallel tool calls per turn over max
   4 turns, using a restricted cross-platform toolset: grep, read, glob.
   SWE-grep-mini serves at 2,800+ tokens/second. Key insight: "Agent
   trajectories were often spending >60% of their first turn just retrieving
   context" — Fast Context addresses this by delegating retrieval to this
   specialized subagent, preserving the main Cascade model's context budget for
   actual task execution. [SOURCE: Cognition SWE-grep blog, Windsurf Fast
   Context docs]

9. **Claude Code's creator confirmed a deliberate shift away from RAG toward
   agentic (tool-based) search** [CONFIDENCE: HIGH]

   Claude Code (Boris Cherny) explicitly noted that "early versions used RAG +
   local vector DB, but agentic search outperformed it" due to advantages around
   security, privacy, staleness, and reliability. Claude Code uses Grep, Glob,
   and Read tools as on-demand filesystem explorers — no pre-indexing. Each
   subagent gets its own isolated 200K-token context window; intermediate noise
   stays inside the subagent and never contaminates the parent's context.
   [SOURCE: Morph codebase indexing analysis, sebastianraschka.com Claude Code
   analysis]

10. **Augment Code outperforms Cursor on SWE-Bench Pro using the same underlying
    model** [CONFIDENCE: MEDIUM]

    Using identical Claude Opus 4.5, Augment's Auggie solved 15 more problems
    than Cursor on SWE-Bench Pro — proving the performance gap is
    retrieval-driven, not model-driven. This aligns with Augment's documented
    philosophy: "context architecture matters as much as model choice." [SOURCE:
    Morph augment-vs-cursor comparison]

---

## Detailed Analysis

### Cursor

**Architecture:** Cursor is a VS Code fork enhanced with AI capabilities. Its
core repo-level intelligence is built on a 5-step vector indexing pipeline.

**Chunking:** AST-aware via tree-sitter. Code is split at function/class/method
boundaries rather than arbitrary token counts. Sibling AST nodes are merged to
maximize chunk density without crossing token limits. Three strategies exist
(fixed token, semantic delimiter, AST-based) — Cursor uses AST-based as default
for code files.

**Embedding & Storage:** Either OpenAI's embedding API (text-embedding-3-small,
8192 token limit) or a custom Cursor embedding model. Stored in Turbopuffer, a
vector DB optimized for hybrid vector + full-text search. Filenames are
obfuscated; code chunks are encrypted. Plaintext never persists.

**Change Detection:** Merkle tree over all valid files, synced every 10 minutes.
Only modified chunks are re-uploaded. Cursor's team reports ~90% upload
reduction vs. naive full re-indexing.

**Privacy Model:** Privacy Mode disables all server-side code retention.
Enterprise: SOC 2 Type II, admin-enforced privacy mode, .cursorignore for file
exclusion.

**Large Repo Handling:** The Merkle tree approach makes incremental indexing
practical for large repos. However, the forum indicates indexing can fail under
heavy load, requiring retries. Practical context window for agent mode: varies
by model (128K–1M depending on model selected), but semantic search pre-filters
to keep relevant chunks within limits.

**Distinctive feature — Shadow Workspace:** Hidden LSP-feedback loop. AI
proposes code → applied to hidden workspace → linter/type-checker runs → errors
fed back to AI → refined code presented to user. Plans for FUSE-based kernel
virtualization to improve speed and isolation.

**Agent capabilities:** Up to 8 parallel agents in isolated Ubuntu VMs with Git
worktrees (Cursor 2.5). BugBot processes 2M+ PRs/month with 70% autonomous
resolution rate.

**@Codebase vs. other @ symbols:** @Codebase triggers full semantic search
across the indexed codebase. @file/@folder manually pins specific content. Agent
mode uses @Codebase automatically during planning.

---

### Augment Code

**Architecture:** Plugin model (VS Code extension + JetBrains plugin), not a
fork. This preserves IDE independence. The Context Engine is a standalone
infrastructure layer that can be exposed via MCP to any agent.

**Core engine:** Semantic graph-based indexing. Rather than treating code as
flat text chunks, Augment models relationships, dependencies, and architectural
patterns. Scale: 1M+ indexed files, demonstrated on 3.6M+ LoC monorepos
(Elasticsearch).

**Quantized Vector Search:** ANN quantization converts full embedding vectors to
bit-vector "neighborhoods." Two-stage retrieval: (1) search quantized index for
candidates, (2) run full similarity on candidates. Result: 40% latency reduction
(2s to <200ms), 8x memory reduction (2GB to 250MB), 99.9%+ accuracy. This makes
sub-200ms search feasible for 100M+ line codebases.

**Context Lineage:** Indexes git commit history in real time. Gemini 2.0 Flash
summarizes each diff into compact, searchable documents. Summaries are embedded
alongside code chunks and retrieved on demand. Enables "evolutionary" codebase
queries — not just "what does this code do" but "why did it become this."

**MCP Server:** Two modes:

- Local (Auggie CLI): indexes working directory, real-time sync, 2-minute setup
- Remote: hosted at `api.augmentcode.com/mcp`, indexes repos via GitHub App

Exposes one primary tool: `codebase-retrieval`. Credit cost: 40–70 per query.

**Tribal knowledge sources indexed:** Code files, commit history, PR history,
external documentation sites, internal wikis/runbooks, team knowledge bases.

**Enterprise credentials:** SOC 2, GitHub/GitLab/Bitbucket integration,
CODEOWNERS metadata, test coverage maps with historical flakiness data.

**Benchmark claim:** +80% Claude Code improvement, +71% Cursor improvement on
300 Elasticsearch PR benchmark. Sonnet + MCP context > Opus without context.

---

### Windsurf (Codeium → Cognition)

**Ownership change:** Windsurf was Codeium's product. Cognition AI acquired it
in December 2025 for ~$250M. As of 2026, it's "Windsurf by Cognition."

**Cascade architecture:** Cascade is Windsurf's agentic AI system. It operates
in two modes:

- Chat: conversational, manual approval
- Agent: autonomous multi-file edits, terminal commands, broader task context

**4-layer context pipeline (per interaction):**

1. Load .windsurfrules (project conventions, stack requirements, forbidden
   patterns)
2. Retrieve stored Memories (persistent cross-session facts — "we switched to
   GraphQL for dashboard API")
3. Include open/active files (highest relevance)
4. Execute M-Query codebase retrieval (768-dim vectors, proprietary precision
   improvement over cosine similarity)

**Flow awareness:** Cascade's distinctive feature. It tracks the full developer
"activity timeline" — file edits, terminal commands, clipboard content,
navigation history — to infer task context automatically. Unlike Cursor's
largely manual @-symbol approach, Flow means relevant files are pulled
automatically based on what the developer has been doing.

**Memories vs. Rules:**

- Rules (.windsurfrules): stable conventions (naming, stack, patterns) — static,
  always-on
- Memories: evolving decisions — autonomously generated, cross-session
  persistent

**Fast Context / SWE-grep:**

- SWE-grep and SWE-grep-mini: RL-trained models specifically for multi-turn
  context retrieval
- 8 parallel tool calls per turn, max 4 turns
- Tools restricted to: grep, read, glob (cross-platform compatible)
- SWE-grep-mini: 2,800+ tokens/second
- Claimed 20x faster than frontier model context retrieval
- Context agents previously consumed >60% of first turn on retrieval alone; Fast
  Context solves this

**Multi-file coordination:** Cascade can make coordinated edits across multiple
files simultaneously (e.g., adding an API endpoint across route, controller,
model, and test files in one pass).

**MCP integration:** Supports external services (Figma, Slack, Stripe, GitHub,
Supabase) via MCP for expanded context beyond the IDE.

**Scale:** Local indexing by default; enterprise/teams plans unlock remote
multi-repo indexing.

---

## Comparison with Claude Code

| Dimension              | Cursor                                   | Augment Code                    | Windsurf                                  | Claude Code                                                |
| ---------------------- | ---------------------------------------- | ------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| **Indexing approach**  | Pre-built vector embeddings, Turbopuffer | Semantic graph + quantized ANN  | RAG + M-Query retrieval                   | None (on-demand tool search)                               |
| **Context trigger**    | Manual @Codebase or agent auto-triggers  | Automatic via Context Engine    | Automatic via Flow + M-Query              | Model-driven: Grep/Glob/Read as needed                     |
| **Staleness risk**     | 10-min sync gap                          | Millisecond sync (real-time)    | Real-time local indexing                  | None (live filesystem reads)                               |
| **Scale ceiling**      | Large repos, practical limits unclear    | 1M+ files, 100M+ LoC            | Local = per-repo; enterprise = multi-repo | Bounded by context window (~200K per agent)                |
| **Cross-repo**         | No (single project)                      | Yes (multi-repo semantic graph) | Enterprise tier only                      | Via subagent spawning                                      |
| **Commit history**     | No                                       | Yes (Context Lineage)           | No                                        | Via `git log` on demand                                    |
| **Token cost model**   | Lower (pre-filtered)                     | Lower (precise retrieval)       | Lower (Fast Context delegation)           | Higher (iterative search)                                  |
| **Security/privacy**   | Code sent to server (encrypted)          | Code sent to server (encrypted) | Local by default                          | Local only, no server indexing                             |
| **Parallel agents**    | Up to 8 in isolated VMs                  | Yes (multiple remote agents)    | Yes (added Dec 2025)                      | Yes (subagents with isolated 200K ctx)                     |
| **Subagent isolation** | Git worktrees + Ubuntu VMs               | Remote agent VMs                | Not fully documented                      | Per-subagent context window; parent gets only final output |

**Claude Code's architectural philosophy (confirmed by creator):** Claude Code
deliberately rejected RAG in favor of agentic tool-based search, citing
advantages in:

- Security (no code ever leaves the machine)
- Privacy (no external index)
- Staleness (live filesystem is always current)
- Reliability (no index sync failures)

The trade-off: iterative Grep/Read/Glob calls are more token-expensive and
slower for initial discovery than pre-indexed semantic search. For very large
repos (>50K files), embedding-based retrieval has measurable token cost
advantages. For repos where security/privacy is paramount, Claude Code's
approach is categorically superior.

**Where each approach wins:**

- Cursor: speed, parallelism, fast iteration on known codebases, mature
  ecosystem
- Augment: enterprise scale, cross-repo intelligence, commit history, tribal
  knowledge, model-agnostic via MCP
- Windsurf: automatic Flow-aware context (no manual @-symbols), developer UX,
  post-Cognition specialized retrieval models
- Claude Code: security-first, no staleness, full reasoning transparency, large
  context window for complex multi-file tasks

**The Augment MCP insight is particularly relevant to this codebase:** Augment's
Context Engine can be connected to Claude Code via MCP, delivering +80% quality
improvement on complex PRs — suggesting hybrid strategies (Claude Code
reasoning + Augment retrieval) outperform either alone on enterprise-scale
repos.

---

## Gaps Identified

1. **M-Query specifics:** Windsurf claims M-Query improves on cosine similarity,
   but no public technical paper or detailed explanation of the mechanism
   exists. "Proprietary technique" only.

2. **Cursor practical large-repo limits:** No official documentation on what
   repository size causes indexing degradation or failure. Forum reports suggest
   issues under heavy load, but no quantified upper bound.

3. **Augment semantic graph specifics:** Augment describes "semantic graph" but
   does not publish architecture papers. Whether it uses a traditional graph DB,
   a hybrid vector+graph approach, or an abstraction layer is unclear from
   public sources.

4. **Windsurf Memories quality:** No public benchmark on how well the
   autonomously-generated Memories system performs — whether it accurately
   captures architectural decisions or drifts over time.

5. **Cursor vs. Windsurf on actual large monorepos (>500K files):** Comparative
   benchmarks on monorepos of this scale do not appear to exist publicly.
   Augment has documented 1M+ file scale; neither Cursor nor Windsurf has
   published equivalent claims.

6. **Claude Code subagent spawning overhead vs. pre-indexed retrieval latency:**
   No head-to-head benchmark on first-query latency for a cold repo access.

---

## Sources

| #   | URL                                                                                                                    | Title                                                  | Type                  | Trust       | CRAAP (avg) | Date      |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------- | ----------- | ----------- | --------- |
| 1   | https://read.engineerscodex.com/p/how-cursor-indexes-codebases-fast                                                    | How Cursor Indexes Codebases Fast                      | Technical blog        | MEDIUM-HIGH | 4.0         | 2024      |
| 2   | https://cursor.com/blog/shadow-workspace                                                                               | Iterating with Shadow Workspaces                       | Official blog         | HIGH        | 4.6         | 2024      |
| 3   | https://www.augmentcode.com/blog/repo-scale-100M-line-codebase-quantized-vector-search                                 | How we made code search 40% faster                     | Official blog         | HIGH        | 4.8         | 2025      |
| 4   | https://www.augmentcode.com/blog/announcing-context-lineage                                                            | Context Engine: Now with full Commit History           | Official blog         | HIGH        | 4.8         | 2025      |
| 5   | https://www.augmentcode.com/product/context-engine-mcp                                                                 | Context Engine MCP                                     | Official product page | HIGH        | 4.5         | 2026      |
| 6   | https://docs.augmentcode.com/context-services/mcp/overview                                                             | Context Engine MCP Docs                                | Official docs         | HIGH        | 4.8         | 2026      |
| 7   | https://cognition.ai/blog/swe-grep                                                                                     | SWE-grep and SWE-grep-mini                             | Official blog         | HIGH        | 4.8         | 2025      |
| 8   | https://docs.windsurf.com/context-awareness/fast-context                                                               | Fast Context - Windsurf Docs                           | Official docs         | HIGH        | 4.8         | 2025-2026 |
| 9   | https://docs.windsurf.com/context-awareness/overview                                                                   | Context Awareness Overview - Windsurf                  | Official docs         | HIGH        | 4.8         | 2025-2026 |
| 10  | https://markaicode.com/windsurf-flow-context-engine/                                                                   | Understand Windsurf Flow: How the Context Engine Works | Community blog        | MEDIUM      | 3.5         | 2026      |
| 11  | https://www.morphllm.com/codebase-indexing                                                                             | Codebase Indexing: How AI Coding Tools Navigate        | Technical analysis    | MEDIUM-HIGH | 4.0         | 2025-2026 |
| 12  | https://www.morphllm.com/comparisons/augment-code-vs-cursor                                                            | Augment Code vs Cursor                                 | Technical comparison  | MEDIUM-HIGH | 4.0         | 2026      |
| 13  | https://sebastianraschka.com/blog/2026/claude-code-secret-sauce.html                                                   | Claude Code's Real Secret Sauce Isn't the Model        | Community blog        | MEDIUM      | 3.8         | 2026      |
| 14  | https://adityarohilla.com/2025/05/08/how-cursor-works-internally/                                                      | How Cursor Works Internally                            | Community blog        | MEDIUM      | 3.5         | 2025      |
| 15  | https://workos.com/blog/augment-code-context-is-the-new-compiler                                                       | Augment Code: Context Is the New Compiler              | Company blog          | MEDIUM-HIGH | 4.0         | 2025      |
| 16  | https://dev.to/pockit_tools/cursor-vs-windsurf-vs-claude-code-in-2026-the-honest-comparison-after-using-all-three-3gof | Cursor vs Windsurf vs Claude Code 2026                 | Community blog        | MEDIUM      | 3.5         | 2026      |
| 17  | https://windsurf.com/cascade                                                                                           | Cascade - Windsurf                                     | Official page         | HIGH        | 4.5         | 2025-2026 |
| 18  | https://www.augmentcode.com/context-engine                                                                             | Context Engine - Augment Code                          | Official product page | HIGH        | 4.5         | 2025-2026 |
| 19  | https://blog.codacy.com/ai-giants-how-augment-code-solved-the-large-codebase-problem                                   | How Augment Code Solved the Large Codebase Problem     | Company blog          | MEDIUM-HIGH | 3.8         | 2025      |

---

## Contradictions

1. **Cursor scale claims vs. user reports:** Cursor's architecture (Merkle
   tree + incremental sync) is documented as handling "large repos," but
   community forum posts report indexing failures under load. No official
   maximum repo size is stated. Morph states "practical context window for
   medium projects but shows limitations on larger codebases" — contradicting
   Cursor's implied unlimited scale.

2. **Windsurf "automatic" vs. Cursor "manual" context:** Multiple comparison
   articles describe Windsurf as fully automatic and Cursor as requiring manual
   @-symbol context selection. However, Cursor's Agent mode does perform
   automated @Codebase retrieval without user intervention. The distinction is
   real but less absolute than marketing suggests.

3. **Augment "semantic graph" vs. "vector search":** Augment marketing describes
   a "semantic graph" while their technical blog describes quantized vector
   search (ANN). These are not mutually exclusive, but the public-facing
   descriptions use different framings. The actual architecture likely uses
   both, but this is not explicitly documented.

---

## Serendipity

1. **Hybrid strategies outperform pure approaches:** Augment's MCP finding that
   "Sonnet + MCP context > Opus without context" directly implies that Claude
   Code + Augment MCP is a viable and measurably superior combination for
   enterprise repo work. This has direct relevance to the parent research
   question about value extraction.

2. **Windsurf's SWE-grep reveals a universal problem:** The finding that agents
   spend >60% of their first turn on context retrieval validates a significant
   inefficiency in all current agentic systems — not just Windsurf. This
   suggests that context retrieval efficiency is a major frontier for
   improvement across all tools including Claude Code.

3. **Cognition acquisition of Windsurf (Dec 2025):** Windsurf is now "Windsurf
   by Cognition." Cognition brings SWE-bench #1 rankings and RL-specialized
   engineering. This is transforming Windsurf from a UI-polished IDE competitor
   into a systems-level AI engineering platform. The SWE-grep models are the
   first visible output of this merger.

4. **Boris Cherny's RAG rejection is a documented design decision:** The
   confirmation that Claude Code explicitly tested and rejected RAG in favor of
   agentic search (not just skipped it) is a significant data point. It means
   Claude Code's approach is a deliberate architectural bet, not an oversight —
   and that the bet was based on empirical testing.

---

## Confidence Assessment

- HIGH claims: 9
- MEDIUM claims: 1
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

Most claims are grounded in official documentation, official product blogs, or
confirmed technical analyses. The Augment SWE-Bench performance claim
(Finding 10) is MEDIUM because it comes from Augment's own comparison page —
independent replication not confirmed.
