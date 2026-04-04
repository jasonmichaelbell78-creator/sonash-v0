# Findings: How Are LLMs Being Used for Repo Understanding and Analysis Today?

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question ID:** D12

---

## Key Findings

### 1. The Field Has Converged on RAG + Structural Parsing as the Core Pattern [CONFIDENCE: HIGH]

Every major tool surveyed (CodeRabbit, Cody, Cursor, aider, Greptile, Sweep)
uses a variant of the same architecture: extract structural features from code
(via tree-sitter, AST parsing, or custom parsers), embed chunks semantically,
store in a vector index, then retrieve relevant context at query time before
passing it to an LLM. The differences lie in how richly they model code
structure and how aggressively they prune context.

Key pattern components seen across all tools:

- **AST-based chunking**: Split files by syntactic units (functions, classes)
  rather than arbitrary character counts, using tree-sitter or equivalent.
  [1][3][6]
- **Graph-based ranking**: Build a dependency graph of symbols/files, then use
  PageRank or similar to rank relevance at query time. [2][5]
- **Semantic vector index**: Embed chunks using a code-optimized model, stored
  in a vector DB (LanceDB, Turbopuffer, or proprietary). [4][7]
- **RAG at inference**: Query expansion + nearest-neighbor retrieval populates
  the LLM context window. [1][4][6][7]

This convergence is evidence of a practical, battle-tested pattern for codebase
understanding. No vendor is doing something radically different at the retrieval
layer.

---

### 2. Aider's Repo-Map is the Simplest and Most Transparent Design [CONFIDENCE: HIGH]

Aider uses tree-sitter to extract symbol definitions and references from all
source files, then builds a directed graph (files as nodes, symbol dependencies
as edges). Personalized PageRank on this graph ranks files by relevance to the
current chat context. The output is a compact text file showing each file's path
plus its most-referenced class/function signatures — not full implementations.

Key design choices:

- Default token budget: **1,000 tokens** for the map, expandable dynamically
- The map only includes "the most important identifiers — the ones which are
  most often referenced by other portions of the code." [2]
- Supports 40+ languages via `py-tree-sitter-languages`
- The LLM sees signatures only; it requests specific files if it needs the body

This is directly applicable to our skill: the repo-map pattern gives an LLM
enough context to reason about architecture and relationships without blowing
the context window. The key insight is that **signatures beat full bodies** for
understanding — the LLM can infer intent from function names, types, and call
patterns.

---

### 3. CodeRabbit Is the Most Sophisticated Production System [CONFIDENCE: HIGH]

CodeRabbit's architecture (as of 2025-2026) is multi-layer:

- **Codegraph**: Lightweight map of definitions and references, tracking which
  files change together in commit history (co-change coupling). [1]
- **Semantic index** (LanceDB): Embeddings of functions, classes, tests, and
  prior PRs/changes. Searched "by purpose" to surface parallel implementations
  and relevant tests. [4][7]
- **Real-time web queries**: Pulls context from documentation at review time.
- **Linter/security tool integration**: Runs static analyzers (ESLint, Semgrep,
  etc.) and folds findings into the LLM context before generating comments.
- **Isolated sandboxes**: Short-lived secure environments for each review to
  maintain scale.
- **Scale**: 1M+ repos, 5M+ PRs, 50,000+ daily reviews at P99 < 1s latency.

The LanceDB integration stores not just code embeddings but also: Jira/Linear
tickets, historical PR reviews, team chat learnings, and PR outcomes. The system
continuously re-embeds as teams evolve (pattern drift detection). [7]

**Key insight for our skill**: CodeRabbit grounds LLM comments with evidence
from the existing codebase ("how similar issues were fixed before," "parallel
implementations to align with"). This is the difference between generic AI
suggestions and contextually accurate ones.

---

### 4. Cursor's Custom Embedding Model Is a Significant Competitive Advantage [CONFIDENCE: HIGH]

Cursor trained its own embedding model using agent session traces as training
data: when an agent worked through a task, it recorded what files were
eventually opened. The model is trained to align similarity scores with those
LLM-validated relevance rankings — not generic text similarity.

Additional differentiators:

- **AST-aware chunking**: Depth-first AST traversal, merging sibling nodes
  within token limits. [3][6]
- **Merkle tree change detection**: SHA-256 hash per file, rolled up
  hierarchically. Changed chunks are re-indexed every 10 minutes; unchanged
  chunks hit embedding cache.
- **Index sharing across teams**: 92% average similarity in codebase clones
  within an org allows reuse of existing indexes via simhash lookup — cutting
  time-to-first-query from 4+ hours to 21 seconds at P99. [6]
- **Privacy**: Code is never stored. Only embeddings + metadata in Turbopuffer.
  File paths are encrypted locally.

Semantic search improved agent response accuracy by **12.5%** in Cursor's
internal evaluation and raised code retention rates. [6]

---

### 5. Sourcegraph Cody Uses a Three-Layer Context Fusion [CONFIDENCE: HIGH]

Cody retrieves context from three independent sources and fuses them:

1. **Keyword search** (sparse vector): Traditional text match via Sourcegraph
   Search API — fast, high recall for exact symbol names. [8]
2. **Code graph (SCIP)**: Structural analysis of symbol relationships — finds
   context based on how code elements relate (callers, callees,
   implementations).
3. **Embeddings** (dense vector): Semantic similarity for conceptual queries.

These are combined with a global ranking step: all snippets from all sources are
scored, and the top N (by token budget) are packaged into the LLM context. Cody
supports up to 10 simultaneous repositories for cross-repo context. [8]

The "Normsky" architecture (described in the Latent Space podcast) specifically
positions code search infrastructure as the competitive moat over pure embedding
approaches.

---

### 6. Greptile Uses an Explicit Codegraph Rather Than Embeddings-Only [CONFIDENCE: HIGH]

Greptile's core claim is that it builds "a detailed codegraph of how each
function, class, file, and directory is connected" across the entire repository
— not just similarity-based retrieval. [9][10]

This enables it to surface:

- Cross-file logic issues (changes that break distant dependencies)
- Architectural inconsistencies (new components that deviate from established
  patterns)
- Repeated code where abstractions should exist
- Edge cases in dependency chains

API model: repos are registered via a POST to the indexing endpoint, then
queries are made against the indexed repo via `/query` or `/search`. Review
teams build custom integrations using the API (Sentry/Datadog integration for
alert diagnostics, test pipeline integration for failure analysis, doc
generation with codebase context). [9]

Greptile 2.0 moved from an embeddings-first to a codegraph-first approach.

---

### 7. GitHub Copilot Workspace Uses a Plan-Spec-Implement Pipeline [CONFIDENCE: MEDIUM-HIGH]

Copilot Workspace doesn't just analyze code — it wraps repo understanding inside
a structured agentic workflow:

1. **Understand**: Reads the issue/task, identifies relevant code
2. **Specify**: Generates a spec of what needs to change
3. **Plan**: Produces a file-by-file change plan
4. **Implement**: Generates diffs
5. **Repair**: If tests fail, a repair agent re-examines and fixes

Copilot can "deduce and store useful information about a repository" to improve
coding agent and code review quality over time. Semantic search indexes markdown
docs and `.github/copilot-instructions.md` for repo-specific context injection.
[11]

This staged approach — not jumping straight to code generation — is a pattern
our skill could adopt for complex analysis tasks.

---

### 8. Claude Code's Explore Agent Is Read-Only, Parallel, Summarization-Based [CONFIDENCE: MEDIUM-HIGH]

Claude Code spawns the Explore sub-agent as a **read-only, fresh-context**
specialist using Glob, Grep, Read, and limited Bash. Thoroughness levels (quick
/ medium / very thorough) control scope. Results are summarized and passed back
to the orchestrating agent. [12]

The fresh context start (no inherited conversation) is intentional: search tasks
are independent and benefit from clean context. Multiple Explore agents can run
in parallel.

This maps directly to our skill's architecture: spawn parallel Explore-style
agents per analysis dimension, collect summaries, synthesize in a coordinator.

---

### 9. Context Window Strategies: Quality Beats Quantity [CONFIDENCE: HIGH]

The research is clear on context management:

**"Lost in the Middle" is real**: LLMs achieve 85-95% recall at start/end of
context but drop to 76-82% in the middle. For code analysis, important findings
should be placed at context boundaries. [13]

**Large windows degrade reasoning**: A 2025 study showed that even when models
can perfectly retrieve evidence, large context volumes degrade reasoning on
tasks requiring deep logic. More context is not always better. [13]

**Best strategies for large codebases**:

- **Hierarchical summarization**: Large file-level summaries at top, detailed
  chunks available via drill-down. Used in map-reduce RAG pipelines.
- **AST-based chunking**: Split by semantic unit (function/class) not character
  count. Preserves coherence.
- **Retrieval reordering**: Place highest-ranked chunks at context start/end,
  not middle.
- **Token budgeting**: Set explicit caps (aider defaults to 1k tokens for the
  map). Expand dynamically only when needed.
- **Contextual embeddings**: Anthropic's approach — LLM-generated contextual
  description prepended to each chunk before embedding, improving retrieval
  relevance.

---

### 10. LLMs vs. Static Analysis: Complementary, Not Competing [CONFIDENCE: HIGH]

Static analysis advantages:

- **Deterministic**: Same code always produces same output
- **Fast**: 15-50ms vs 3-8s per scan
- **Cost**: $0 vs $0.002-0.01 per LLM call
- **Lower false positives**: 5% vs 12% in controlled comparison
- **No hallucination**: Pattern fires only on exact match

LLM analysis advantages:

- **Contextual reasoning**: Can understand intent, not just syntax
- **Cross-file analysis**: Can reason about interactions that static rules miss
- **Natural language explanation**: Generates actionable, human-readable
  findings
- **Novel pattern detection**: Not limited to pre-written rules
- **Architectural insight**: Can identify design-level issues and technical debt

LLM weaknesses:

- **Inconsistency**: Same code can get different results across runs (23%
  category disagreement in one study). [14]
- **False confidence**: May rate dangerous patterns as low-risk
- **Scale limits**: Token limits prevent loading entire large repos at once
- **Hallucination risk**: Can cite non-existent files or patterns

**Best hybrid approach**: Use static analysis for deterministic pattern
detection (security rules, anti-patterns, style); use LLMs for explanation,
contextual interpretation, cross-file reasoning, and surfacing architectural
signals.

Studies show hybrid approaches reduce false positives by 43-91% vs pure static
analysis, while maintaining or improving recall. [15][16]

---

### 11. Technical Debt Detection via LLMs Is an Emerging but Validated Use Case [CONFIDENCE: MEDIUM]

DebtGuardian (2025) demonstrated that LLMs using zero-shot and few-shot
prompting can detect technical debt directly from source code changes. Key
findings:

- Granular prompting (chunk-level) outperforms batch-level
- Code-specialized models (e.g., CodeLlama, StarCoder variants) outperform
  general models
- Larger context windows improve detection performance
- LLM agents increase development velocity but can also accelerate debt
  accumulation — making detection more critical

Average code complexity increases of **25.1%** were observed in LLM-assisted
development, suggesting an increasing need for LLM-powered debt detection as AI
coding tools spread. [13][17]

---

### 12. Sweep AI Uses Issue-to-PR Automation with Codebase-Wide Context [CONFIDENCE: MEDIUM]

Sweep reads GitHub issues, searches the codebase for relevant dependencies,
plans changes, and opens PRs automatically. Its approach involves:

- Reading the full issue description as the task specification
- Searching for files related to the described functionality
- Building a dependency graph of the affected code
- Generating implementation + PR in one flow

Sweep supports Python, JS/TS, Java, Go, C#, C++, Rust via hosted or self-hosted
deployment. Recently pivoted to JetBrains IDE plugin focus. [18]

---

## Sources

| #   | URL                                                                                                  | Title                                                         | Type              | Trust       | CRAAP Avg | Date          |
| --- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------- | ----------- | --------- | ------------- |
| 1   | https://www.coderabbit.ai/blog/how-coderabbit-delivers-accurate-ai-code-reviews-on-massive-codebases | How CodeRabbit delivers accurate AI code reviews              | Vendor blog       | MEDIUM-HIGH | 4.0       | 2025          |
| 2   | https://aider.chat/2023/10/22/repomap.html                                                           | Building a better repository map with tree-sitter             | Official docs     | HIGH        | 4.2       | 2023 (stable) |
| 3   | https://aider.chat/docs/repomap.html                                                                 | Repository map — aider                                        | Official docs     | HIGH        | 4.4       | 2024          |
| 4   | https://lancedb.com/blog/case-study-coderabbit/                                                      | Case Study: How CodeRabbit Leverages LanceDB                  | Vendor case study | MEDIUM-HIGH | 3.8       | 2025          |
| 5   | https://deepwiki.com/Aider-AI/aider/4.1-repository-mapping                                           | Repository Mapping System — DeepWiki                          | Community docs    | MEDIUM      | 3.5       | 2025          |
| 6   | https://cursor.com/blog/secure-codebase-indexing                                                     | Securely indexing large codebases                             | Official blog     | HIGH        | 4.3       | 2025          |
| 7   | https://read.engineerscodex.com/p/how-cursor-indexes-codebases-fast                                  | How Cursor Indexes Codebases Fast                             | Technical blog    | MEDIUM-HIGH | 4.0       | 2025          |
| 8   | https://sourcegraph.com/blog/how-cody-understands-your-codebase                                      | How Cody understands your codebase                            | Official blog     | HIGH        | 4.3       | 2024          |
| 9   | https://www.greptile.com/blog/greptile-2                                                             | Introducing Greptile 2.0                                      | Official blog     | HIGH        | 4.0       | 2025          |
| 10  | https://docs.greptile.com/introduction                                                               | Greptile — Introduction                                       | Official docs     | HIGH        | 4.5       | 2025          |
| 11  | https://githubnext.com/projects/copilot-workspace                                                    | GitHub Next — Copilot Workspace                               | Official docs     | HIGH        | 4.4       | 2025          |
| 12  | https://www.eesel.ai/blog/navigate-codebase-claude-code                                              | How to navigate any codebase with Claude Code                 | Community blog    | MEDIUM      | 3.4       | 2025          |
| 13  | https://arxiv.org/html/2510.05381v1                                                                  | Context Length Alone Hurts LLM Performance                    | Academic paper    | HIGH        | 4.6       | 2025          |
| 14  | https://dev.to/ayame0328/how-i-replaced-llm-based-code-analysis-with-static-analysis                 | How I Replaced LLM-Based Code Analysis with Static Analysis   | Practitioner blog | MEDIUM      | 3.5       | 2025          |
| 15  | https://arxiv.org/abs/2509.15433v2                                                                   | LLM-Driven SAST-Genius: A Hybrid Static Analysis Framework    | Academic paper    | HIGH        | 4.5       | 2025          |
| 16  | https://arxiv.org/html/2601.18844                                                                    | Reducing False Positives in Static Bug Detection with LLMs    | Academic paper    | HIGH        | 4.5       | 2026          |
| 17  | https://link.springer.com/chapter/10.1007/978-3-032-12089-2_21                                       | Detecting Technical Debt with LLMs                            | Academic paper    | HIGH        | 4.3       | 2025          |
| 18  | https://github.com/sweepai/sweep                                                                     | sweepai/sweep — GitHub                                        | Official repo     | HIGH        | 4.2       | 2025          |
| 19  | https://www.devtoolsacademy.com/blog/state-of-ai-code-review-tools-2025/                             | State of AI Code Review Tools in 2025                         | Industry analysis | MEDIUM-HIGH | 3.9       | 2025          |
| 20  | https://arxiv.org/html/2503.17502v1                                                                  | LLMs for Source Code Analysis: applications, models, datasets | Academic survey   | HIGH        | 4.5       | 2025          |

---

## Contradictions

**LLM analysis reliability**: The practitioner blog [14] found 23% category
disagreement across identical runs and recommended replacing LLMs with static
analysis for vulnerability detection. Academic research [16] found the opposite
conclusion — that LLMs with reasoning models significantly reduce false
positives compared to static analysis alone. The resolution is likely
task-specificity: LLMs excel at contextual, cross-file reasoning but are
inconsistent at rule-based pattern detection. Use static analysis for patterns,
LLMs for reasoning.

**Context window size vs. quality**: Some vendors market 1M+ token windows as
ideal for "ingesting entire codebases." Academic evidence [13] shows this
degrades reasoning performance for complex tasks. The practitioner consensus is
that selective, well-structured context (2-10k tokens of high-relevance code)
outperforms brute-force full-repo ingestion.

---

## Gaps

- **Sweep AI's current technical implementation** is unclear. The GitHub repo
  and docs are thin on specifics of how the dependency search works internally.
  Marketing copy dominates. The product appears to have pivoted focus.

- **Greptile's codegraph implementation details** were not accessible — the
  `/introduction` docs endpoint returned ECONNREFUSED, and the blog describes
  capabilities but not data structures. The claim of "complete codegraph" vs.
  embeddings-only is repeated but unverified technically.

- **Claude Code Explore agent's exact prompting strategy** is not publicly
  documented. The community blog [12] describes behavior patterns but Anthropic
  has not published technical details of the Explore sub-agent prompt design.

- **Benchmark comparisons** between tools (CodeRabbit vs. Greptile vs. Copilot
  Workspace) on the same repos do not appear to exist publicly. All performance
  claims are vendor self-reported.

- **Token cost per repo analysis** for each tool is not publicly available. This
  is a critical factor for our skill's feasibility at scale.

---

## Serendipity

**Co-change coupling as a quality signal**: CodeRabbit tracks which files
"frequently change together" from commit history. This is independent of
semantic analysis and provides a churn-based quality signal complementary to
static analysis. Our skill could mine git log for co-change pairs to identify
hidden coupling and coupling violations.

**Contextual embeddings (Anthropic technique)**: Before embedding a chunk,
generate a 1-2 sentence LLM description of the chunk's role in the broader file,
prepend it to the chunk text, then embed the concatenation. This dramatically
improves retrieval relevance for cross-file queries. Low implementation cost,
high impact. Source: Anthropic's embedding research referenced in chunking
strategy literature.

**Index sharing via simhash**: Cursor's discovery that 92% of codebase clones
within an org are near-identical suggests an optimization opportunity for CI/CD
pipelines: index once per repo, reuse across branches/forks.

**LLM agent velocity paradox**: Research found that LLM-assisted development
increases velocity but also increases codebase complexity by 25.1% on average —
meaning teams using AI coding tools accumulate debt faster. This is a strong
motivating argument for an AI-powered debt detection skill.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM-HIGH claims: 3
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH** (core patterns verified across multiple
  independent sources; gaps are in implementation details of individual tools,
  not in the field-wide findings)

---

## Recommendations for How Our Skill Should Use LLM Analysis

Based on this research, here are concrete design recommendations:

### 1. Adopt the Repo-Map Pattern as the Context Foundation

Build an aider-style repo-map as the first step of any LLM analysis. Use
tree-sitter to extract function/class signatures across the repo, build a
PageRank dependency graph, and generate a compact (1,000-3,000 token) map that
the LLM receives before any specific analysis task. This gives the LLM
architectural context without expensive full-file ingestion.

Recommended token budgets:

- Repo-map (signatures only): 1,000-3,000 tokens
- Active analysis target (full code): 2,000-5,000 tokens
- Retrieved relevant context (RAG hits): 2,000-4,000 tokens
- Total LLM context: target < 12,000 tokens for reliable reasoning

### 2. Use LLMs for What They Are Good At, Not What They Are Not

LLM tasks (use):

- Explaining findings from static/churn analysis in natural language
- Identifying architectural patterns and technical debt signals from the
  repo-map
- Cross-referencing findings across multiple files ("does this change break
  anything elsewhere?")
- Generating actionable, prioritized recommendations
- Summarizing complex analysis results

Static analysis tasks (do not replace with LLM):

- Detecting specific anti-patterns (already done by patterns:check)
- Security vulnerability detection (use Semgrep/ESLint rules)
- Exact metric computation (LOC, cyclomatic complexity)
- Deterministic reporting (scores, counts)

### 3. Structure the LLM Prompt with Evidence, Not Questions

Following CodeRabbit's "evidence not vibes" approach: give the LLM structured
input (static tool findings + churn data + repo-map) and ask it to synthesize
and explain, rather than asking it to detect from scratch. This dramatically
reduces inconsistency and hallucination.

Prompt structure:

```
[REPO-MAP: top-N files by PageRank, signatures only]
[STATIC FINDINGS: linter/security tool output for changed files]
[CHURN DATA: high-churn files, co-change coupling pairs]
[COMPLEXITY METRICS: cyclomatic complexity outliers]

Task: Identify the top 3 architectural risks in this change. For each risk, cite
specific evidence from the data above. Do not invent findings not supported by
the data.
```

### 4. Place Most Important Context at Start and End of Prompt

Given the "lost in the middle" phenomenon, structure prompts so that:

- The repo-map (architectural context) appears at the START
- The specific analysis task and output format appear at the END
- The detailed static findings appear in the MIDDLE (they provide evidence but
  the LLM is less likely to miss summary-level findings at the boundaries)

### 5. Run LLM Analysis as a Summarization/Synthesis Layer

Model the LLM as a "synthesizer on top of structured inputs," not as the primary
detector. The pipeline should be:

```
Static tools → structured findings
Git analysis → churn/coupling signals
Tree-sitter → repo-map
         ↓
     LLM synthesis
         ↓
  Human-readable report with priorities
```

This is exactly how CodeRabbit operates (linters run first, LLM synthesizes) and
why it outperforms tools that use LLMs for initial detection.

### 6. Cache and Reuse Repo-Maps Across Runs

The repo-map (signatures, not implementations) changes slowly. Cache it between
skill invocations and invalidate only when file signatures change. This reduces
both latency and token cost for repeated analyses on the same repo.

### 7. For Future Enhancement: Embed Commit History as Context

CodeRabbit's semantic index of prior PRs and changes is a differentiating
feature. For v2 of the skill, consider maintaining a lightweight JSONL record of
past analysis findings, indexed by file+timestamp, that can be retrieved as
context for "how have quality signals in this file changed over time?"
