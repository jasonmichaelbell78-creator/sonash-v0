# D1a-1: Greptile & Sourcegraph Cody

<!-- Searcher: deep-research-searcher | Profile: web | Date: 2026-03-31 | SQs: 1-4 -->

## Key Findings

1. **Greptile builds a three-node graph (files, functions, external references)
   from the entire repo and uses it for every PR review** [CONFIDENCE: HIGH]

   Greptile's indexing pipeline parses every file to extract files, functions,
   classes, and variables, then maps their relationships (calls, imports,
   variable usage) into a stored graph. Three node types: blue (files), green
   (functions), yellow (external references/deps). Edges encode function calls,
   imports, and variable accesses. This graph is queried at review time — not
   the diff — to surface callers, impacted code paths, and pattern
   inconsistencies across the whole codebase. [SOURCE 1, SOURCE 2]

2. **Greptile's semantic search translates code to natural language before
   embedding, then chunks at function granularity** [CONFIDENCE: HIGH]

   The blog explains the core mismatch problem: raw code and natural language
   queries have low cosine similarity (~12% lower than description-to-query).
   Greptile's solution: translate code to NL first, then embed. Function-level
   chunking (not file-level) is critical — whole-file embedding scores 0.718 vs.
   function-level 0.768 cosine similarity. Noise in chunks "dramatically
   reduces" retrieval quality. Storage: code embeddings are stored in PostgreSQL
   via pgvector. [SOURCE 3]

3. **Greptile's system architecture: six specialized workers, pgvector storage,
   Hatchet orchestration, LLM proxy** [CONFIDENCE: HIGH]

   Services: `greptile-indexer-chunker` (partitions repos),
   `greptile-indexer-summarizer` (generates repo overviews), `greptile-reviews`
   (code review analysis), `greptile-jobs` (scheduled tasks),
   `greptile-llmproxy` (routes LLM calls). All application data — repo metadata,
   code embeddings, review history, user accounts — lives in PostgreSQL +
   pgvector. RabbitMQ queues work. Supports Docker Compose (single host, ~100
   devs) and Kubernetes (20 API replicas, 50 summarizer replicas) at production
   scale. [SOURCE 4]

4. **Greptile has a learning system that adapts per-team over 9-12 weeks,
   suppressing noise and preserving signal** [CONFIDENCE: HIGH]

   Three feedback channels: PR comment reactions (thumbs), developer replies,
   and automatic pattern extraction from team review history. The system tracks
   per-comment-type engagement (e.g.,
   `semicolonComments: { made: 10, addressed: 0, reactions: -3 }`) and
   suppresses high-ignore patterns. Claimed outcome: 80% reduction in ignored
   comments, 3x higher adoption rate after the learning curve. [SOURCE 5]

5. **Greptile pricing: $30/seat/month (cloud), Genius API at $0.45/request;
   enterprise is custom/self-hosted** [CONFIDENCE: HIGH]

   Cloud: $30/seat/month, 50 reviews included, $1/additional review, unlimited
   repos. Genius API (natural language codebase query): $0.45/request. Chat:
   $20/user/month. Enterprise: custom pricing, self-hosting available (Docker,
   Kubernetes, air-gapped). Discounts: 100% for OSS, 50% for startups, 20% for
   annual. $25M Series A at $180M valuation (September 2025). [SOURCE 6, SOURCE
   7]

6. **Sourcegraph SCIP (Code Intelligence Protocol) is a Protobuf-based indexing
   format that enables compiler-accurate cross-repo navigation** [CONFIDENCE:
   HIGH]

   SCIP replaced LSIF (JSON-based). Key improvements: Protobuf serialization
   (10-20% smaller indexes), human-readable string symbol IDs (easier indexer
   development), and semantic symbol resolution instead of range-based lookups.
   Language indexers exist for TypeScript/JS, Go, Java/Scala/Kotlin, Python,
   Rust, C/C++, Ruby, C#, Dart, PHP. SCIP indexes capture: symbol definitions,
   all references, package/version metadata. This enables "Find References"
   across ALL indexed repos — not text search, but semantic lookup by unique
   symbol ID. [SOURCE 8, SOURCE 9]

7. **Sourcegraph Cody's context engine is a multi-layer RAG system: local file +
   local repo + remote repos, with SCIP, BM25, and RSG** [CONFIDENCE: HIGH]

   Three context layers: (1) local editor file, (2) local repo (BFG graph +
   keyword search), (3) remote repos via Sourcegraph Search API. The Repo-level
   Semantic Graph (RSG) encapsulates a repository's core elements and their
   dependencies as a knowledge structure. Ranking uses an "Expand and Refine"
   method with graph expansion and link prediction on the RSG. Cody transitioned
   away from embeddings at the Enterprise GA release — complexity of maintaining
   vector DBs at >100K repos scale was cited — now uses BM25F as the first-stage
   retrieval with a transformer reranker as second stage. BM25 showed ~20%
   improvement across all key metrics in version 6.2. [SOURCE 10, SOURCE 11,
   SOURCE 12]

8. **Sourcegraph's "Normsky" architecture is a deliberate hybrid of LLMs and
   formal code indexing (parsers/compilers)** [CONFIDENCE: HIGH]

   Beyang Liu coined "Normsky" (Norvig+Chomsky) to describe the approach: LLMs
   for generation/reasoning combined with formal code structures (SCIP indexes,
   parsers, call graphs) for precision context. Steve Yegge describes their
   advantage as a "data pre-processing moat" — semantically dissecting codebases
   at fine-grained levels faster than competitors. BFG (Big Friendly Graph)
   provides zero-build-system code graph context for completions, fixing type
   errors that AI tools typically make by injecting graph context about types
   and symbols. [SOURCE 13]

9. **Sourcegraph Cody cross-repo: Enterprise-only, uses @-mention for remote
   repo context and OpenCtx/MCP for external systems** [CONFIDENCE: HIGH]

   Cody Enterprise allows querying multiple repos from any interface. @-mention
   mechanism in VS Code pulls context from remote repos indexed by Sourcegraph.
   OpenCtx integrates with Jira, Linear, Notion, Google Docs. MCP Tools (not
   Resources or Prompts yet — only Tools are supported) let agents invoke
   external tools. Free/Pro plans discontinued July 2025 — Enterprise-only with
   custom pricing. [SOURCE 14, SOURCE 15]

10. **Both tools catch a class of issues static analysis fundamentally cannot:
    cross-file architectural drift, business logic consistency, intent-aware
    errors** [CONFIDENCE: HIGH]

    Static analyzers (SonarQube, ESLint) operate file-by-file and apply
    predefined rules. They cannot: correlate frontend state assumptions with
    backend config defaults, detect that removing an API mutation breaks auth
    flows elsewhere, surface naming inconsistencies that break cross-file
    lookups, or understand that a code pattern represents intentional
    retry/circuit-breaker logic. Both Greptile and Cody explicitly address this
    by maintaining holistic codebase context through indexing rather than
    analyzing files in isolation. [SOURCE 16, SOURCE 17]

---

## Detailed Analysis

### Greptile

**What it indexes:** Entire repository — directories, files, functions, classes,
variables — parsed into a dependency graph. Repositories must be explicitly
submitted for indexing. Small repos: 3-5 minutes. Large repos: 1+ hour. Supports
GitHub (Cloud + Enterprise Server) and GitLab (Cloud + Self-Managed).

**Graph structure:** Three node types:

- Files (blue nodes): source code files, hierarchically organized
- Functions (green nodes): methods/functions extracted from files
- External References (yellow nodes): imported dependencies, variable calls

Edges: function calls, imports, dependencies, variable usage patterns.

**Indexing pipeline stages:**

1. Repository Scanning: parse every file to extract elements
2. Relationship Mapping: connect all elements (calls, imports, dependencies,
   variable usage)
3. Graph Storage: persist complete graph for instant querying

**Query interface:**

- `POST /query` — natural language query, returns an AI answer + list of
  relevant files/functions/classes (the Genius API, $0.45/request)
- `POST /search` — natural language query, returns ONLY source references (no AI
  answer), useful for building tooling
- `POST /repositories` — index a repository
- `GET /repositories/:id` — check index status

**MCP tools (v2):** Oriented around code review workflows, not direct codebase
queries. Tools: `list_pull_requests`, `get_merge_request`,
`list_merge_request_comments`, `list_code_reviews`, `get_code_review`,
`trigger_code_review`, `search_greptile_comments`,
`list/get/search/create_custom_context`. Note: the MCP v2 is review-management
focused, not a raw codebase query interface.

**Primary use case:** PR code review automation. Greptile positions itself as an
autonomous reviewer that posts comments within ~3 minutes of a PR opening.
Secondary: developer Q&A via Genius API ("How does auth flow work here?", "Where
is payment processing?").

**Learning system:** Team-specific adaptation over 9-12 weeks using
per-comment-type engagement tracking. Patterns auto-discovered from team
discussions, reactions, and replies. Custom rules can be defined with scope
(AND/OR logic, file patterns, etc.).

**Deployment:** Cloud (SOC2 Type II), self-hosted Docker Compose, Kubernetes
with Helm, air-gapped environments available.

---

### Sourcegraph Cody

**What it indexes:** Full source code via SCIP indexers, generating
compiler-accurate symbol graphs. Auto-indexing available for Go, TypeScript,
JavaScript, Python, Ruby, JVM languages. SCIP captures: all symbol definitions,
all references, package/version metadata.

**SCIP technical details:**

- Format: Protocol Buffers (not JSON like LSIF predecessor)
- Index size: 10-20% smaller than LSIF equivalents
- Symbol IDs: human-readable string identifiers (not byte-range offsets)
- Cross-repo: requires indexing dependencies as well as your own repos
- Auto-indexing: Sourcegraph clones repos into isolated executors, runs
  language-specific indexers, uploads SCIP indexes

**Code graph (BFG — Big Friendly Graph):**

- Early Access Program (not yet a supported product as of late 2024/early 2025)
- Zero build-system integration required
- Generates code graph context on-demand
- Specifically addresses type errors in AI completion by injecting type/symbol
  context

**RSG (Repo-level Semantic Graph):**

- Encapsulates core elements and dependencies of a repository
- Used in the ranking phase: "Expand and Refine" method applies graph
  expansion + link prediction
- Serves as stable knowledge source for accurate context retrieval

**Context retrieval layers:**

1. Local file (editor context)
2. Local repo (BFG graph + BM25 keyword search)
3. Remote repos (Sourcegraph Search API — Enterprise only)
4. External: OpenCtx providers (Jira, Linear, Notion, Google Docs), MCP Tools

**Retrieval evolution:**

- Original: vector embeddings (pgvector-style)
- Deprecated at Enterprise GA: too complex to maintain at >100K repos, hindered
  multi-repo feature development
- Current: BM25F first-stage retrieval (recall-optimized) + transformer reranker
  second-stage (precision-optimized). BM25 showed ~20% improvement across all
  key metrics in v6.2.

**Query capabilities via SCIP:**

- Go to Definition (cross-repo, compiler-accurate)
- Find References (semantic, not text-match, across ALL indexed repos)
- Find Implementations
- Hover documentation
- Cross-repo dependency navigation (version-aware)

**Pricing:** Enterprise-only as of July 2025 (Free/Pro discontinued). Custom
pricing. Trial available. Self-hosted or single-tenant. BYOK (bring your own LLM
key) supported.

---

## Cross-Cutting Patterns

| Pattern                  | Greptile                                                                                     | Sourcegraph Cody                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Indexing strategy**    | Whole-repo graph of functions/files/external refs + NL-translated embeddings in pgvector     | SCIP compiler-accurate symbol index + BM25F keyword retrieval                    |
| **Graph representation** | Explicit dependency graph (files, functions, external refs as nodes; calls/imports as edges) | RSG (Repo-level Semantic Graph) + BFG code graph for completions                 |
| **Query interface**      | Natural language → AI answer + file/function/class citations                                 | Code navigation (Go-to-def, Find-refs) + LLM chat with multi-layer context       |
| **Cross-repo support**   | Limited (can query multiple indexed repos via API)                                           | First-class (Sourcegraph Search API, SCIP cross-repo navigation)                 |
| **Retrieval approach**   | Semantic (NL-translated embeddings + pgvector)                                               | Hybrid: BM25F (recall) + transformer reranker (precision); embeddings deprecated |
| **Primary use case**     | PR review automation                                                                         | Developer coding assistant + code search                                         |
| **Learning/adaptation**  | Yes — team feedback loops, per-comment-type tracking                                         | No explicit adaptive learning mechanism described                                |
| **Deployment**           | Cloud + self-hosted                                                                          | Enterprise only (custom pricing, self-hosted option)                             |
| **Storage**              | PostgreSQL + pgvector + RabbitMQ                                                             | Sourcegraph instance (search backend + SCIP index store)                         |

**Three common architectural commitments both tools share:**

1. **Whole-repo indexing before query time.** Both reject the "analyze the diff"
   model. Context must be precomputed across the entire codebase to catch
   cross-file effects.

2. **Graph/structure as the core knowledge representation.** Pure embedding
   retrieval is insufficient. Both use graph structures (Greptile's explicit
   call/dependency graph; Sourcegraph's SCIP symbol graph + RSG) to represent
   code relationships that vectors alone cannot encode.

3. **Hybrid retrieval over pure semantic search.** Greptile: NL-translated
   embeddings. Sourcegraph: moved away from pure embeddings to BM25F + reranker.
   Both arrived at the conclusion that raw code and NL queries have a semantic
   mismatch that must be bridged structurally, not just through vector
   similarity.

---

## What These Tools Surface That Static Analysis Cannot

Static analysis (SonarQube, ESLint, Semgrep) operates on:

- Individual files or small file windows
- Predefined rule patterns
- Syntax and type structures

It is **blind** to:

| Problem Class                           | Why Static Analysis Fails                                    | What Greptile/Cody Can See                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **Cross-service default mismatches**    | Frontend and backend analyzed separately, no correlation     | Greptile: queries graph to find all code that reads a flag; spots frontend assuming `true` when backend defaults to `false` |
| **Removed API breaks**                  | No call graph across service boundaries                      | Greptile: traverses dependency graph to find callers of a removed function                                                  |
| **Architectural drift**                 | No "what the architecture is supposed to look like" model    | Greptile: compares implementation against similar patterns elsewhere in codebase                                            |
| **Naming inconsistencies across files** | Rules apply to one file at a time                            | Greptile: detects `isMultiworkspaceEnabled` vs `isMultiWorkspaceEnabled` across files that would break lookups              |
| **Cross-repo dependency navigation**    | No index of dependencies                                     | Sourcegraph SCIP: compiler-accurate Find References across all repos + dependency versions                                  |
| **Intentional pattern recognition**     | Cannot distinguish retry logic from "unnecessary" repetition | AI context: understands retry/circuit-breaker intent vs. accidental duplication                                             |
| **Intent alignment**                    | Cannot check if code matches the stated task                 | Cody: can compare code against ticket description, PR intent, and adjacent patterns                                         |

**The core distinction:** Static analysis applies rules to structure. Repo-level
AI tools apply context to meaning. The difference is whether the tool knows
_what the rest of the codebase expects_ from any given change.

---

## Gaps Identified

1. **Greptile's exact graph query language or traversal algorithm is not
   documented publicly.** The blog and docs describe WHAT is in the graph but
   not HOW it is traversed during a review (depth-first? ranked relevance? full
   traversal with pruning?).

2. **Greptile multi-repo query semantics are unclear.** The API accepts multiple
   repository IDs in a query, but how the cross-repo graph is unified (or
   whether it is) is not documented.

3. **Sourcegraph BFG status is ambiguous.** It was described as "Early Access
   Program" and "not yet a supported product" as of late 2024. Current
   production status in 2026 is unverified in this research.

4. **Sourcegraph RSG implementation details are thin.** The term "Repo-level
   Semantic Graph" appears in the arXiv paper but is not elaborated in public
   docs with enough specificity to understand its node/edge schema.

5. **Neither tool's false positive rate is independently verified.** Greptile
   claims "3x higher suggestion adoption" and "80% reduction in ignored
   comments" but these are self-reported metrics, not third-party benchmarks.

6. **Sourcegraph Cody's free/pro deprecation timeline impact.** As of July 2025
   only Enterprise plans are available, but the extent of feature gating (which
   capabilities require Enterprise vs. what remains in OSS Sourcegraph) was not
   fully resolved in this research.

7. **Greptile's treatment of monorepos** is not covered in the documentation
   reviewed. Whether the graph is built per-repo or can span monorepo
   sub-packages is unclear.

---

## Sources

| #   | URL                                                                                        | Title                                                            | Type                | Trust       | CRAAP | Date      |
| --- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------- | ----------- | ----- | --------- |
| 1   | https://www.greptile.com/docs/how-greptile-works/graph-based-codebase-context.md           | Graph-based Codebase Context                                     | Official docs       | HIGH        | 4.5/5 | 2025      |
| 2   | https://www.greptile.com/docs/code-review/key-features.md                                  | Key Features — Greptile                                          | Official docs       | HIGH        | 4.5/5 | 2025      |
| 3   | https://www.greptile.com/blog/semantic-codebase-search                                     | Codebases are uniquely hard to search semantically               | Official blog       | HIGH        | 4.2/5 | 2024      |
| 4   | https://www.greptile.com/docs/system-architecture.md                                       | System Architecture — Greptile                                   | Official docs       | HIGH        | 4.5/5 | 2025      |
| 5   | https://www.greptile.com/docs/how-greptile-works/memory-and-learning.md                    | Memory and Learning — Greptile                                   | Official docs       | HIGH        | 4.5/5 | 2025      |
| 6   | https://www.greptile.com/pricing                                                           | Pricing — Greptile                                               | Official            | HIGH        | 5/5   | 2026      |
| 7   | https://www.ycombinator.com/companies/greptile                                             | Greptile — Y Combinator                                          | Community           | MEDIUM      | 3.5/5 | 2025      |
| 8   | https://github.com/sourcegraph/scip                                                        | SCIP Code Intelligence Protocol — GitHub                         | Official source     | HIGH        | 4.8/5 | 2024-2025 |
| 9   | https://docs.sourcegraph.com/code_navigation/references/indexers                           | Indexers — Sourcegraph docs                                      | Official docs       | HIGH        | 4.5/5 | 2025      |
| 10  | https://arxiv.org/html/2408.05344v1                                                        | AI-assisted Coding with Cody: Context-Aware Code Recommendations | Academic paper      | HIGH        | 4.5/5 | Aug 2024  |
| 11  | https://sourcegraph.com/blog/keeping-it-boring-and-relevant-with-bm25f                     | Keeping it boring and relevant with BM25F                        | Official blog       | HIGH        | 4.3/5 | 2024      |
| 12  | https://www.latent.space/p/sourcegraph                                                     | The "Normsky" architecture — Latent Space                        | Community/interview | MEDIUM-HIGH | 4.0/5 | 2024      |
| 13  | https://www.latent.space/p/sourcegraph                                                     | The "Normsky" architecture — Latent Space (BFG details)          | Community/interview | MEDIUM-HIGH | 4.0/5 | 2024      |
| 14  | https://sourcegraph.com/changelog/mcp-context-gathering                                    | Cody agentic context gathering supports MCP tools                | Official changelog  | HIGH        | 4.5/5 | 2025      |
| 15  | https://sourcegraph.com/blog/how-cody-provides-remote-repository-context                   | How Cody provides remote repository context                      | Official blog       | HIGH        | 4.3/5 | 2024      |
| 16  | https://www.greptile.com/what-is-ai-code-review                                            | AI Code Reviews: The Ultimate Guide — Greptile                   | Official            | HIGH        | 4.0/5 | 2025      |
| 17  | https://www.augmentcode.com/tools/ai-code-review-tools-vs-static-analysis-enterprise-guide | AI Code Review Tools vs Static Analysis                          | Community           | MEDIUM      | 3.5/5 | 2025      |

---

## Confidence Assessment

- HIGH claims: 10
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

Most findings are supported by official documentation, official blogs, or
primary source repositories. The academic paper (arXiv 2408.05344) provides
independent third-party verification of Sourcegraph Cody's context retrieval
architecture. The main uncertainty areas are self-reported performance metrics
and the current production status of BFG.
