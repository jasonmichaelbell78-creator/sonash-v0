# Findings: Codebase-RAG Tools — Graph APIs, File Dependency Edges, Change-Impact Propagation

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-17 **Sub-Question IDs:** D2

---

## Summary

None of the mainstream codebase-RAG tools (Cursor, Continue, Aider, GitHub
Copilot Workspace, Zed) expose a graph API for file-to-file dependency queries,
and none support change-impact propagation as a programmable, portable feature.
The canonical architecture across almost all mainstream tools is: **embeddings +
vector similarity search** — retrieving relevant files by semantic closeness to
a query, not by traversing a dependency graph. Aider's repomap is the closest
thing to a true graph model in a widely-used tool, but it is internal,
session-ephemeral, not exported, and not queryable outside Aider itself.

Two non-mainstream candidates — **Greptile** and **Augment Code's Context
Engine** — come closest to what the use case requires: they build semantic
dependency graphs and can propagate change impact. However, both are SaaS-first,
not portable, not local-only, and not designed for JASON-OS cross-project
portability tracking.

**Bottom line:** No existing codebase-RAG tool completely replaces a custom
build for the JASON-OS file-registry use case. The graph/portability gap is real
and unaddressed by the current generation of IDE AI tools.

---

## Per-Candidate Evaluation

### 1. Cursor

**Architecture:** Embeddings (server-side, Turbopuffer vector DB) + Merkle tree
for incremental sync. Code is chunked semantically, embeddings computed
server-side, stored remotely. [C-D2-001]

**Graph API:** None. No file-to-file dependency edges are modeled or exposed.
The index is pure vector retrieval. [C-D2-002]

**File→file edges:** N. The system tracks "start/end line numbers and file
paths" as metadata alongside embedding vectors — not relationships between
files. [C-D2-002]

**Change-impact propagation:** N. Sync is incremental (Merkle tree detects
changed files and re-indexes them), but there is no "file X changed → here is
what depends on it" notification surface. [C-D2-003]

**Cross-project index:** N. The index is workspace-scoped and server-hosted. An
unanswered community forum request explicitly asked for "an API to access
vectors for repo A, branch origin/pr-1234" — indicating no such access exists.
[C-D2-004]

**Index exportable/portable:** N. Embeddings stored on Cursor's servers
(Turbopuffer). Code never persists server-side; embeddings are remote but scoped
to the signed-in account. No export API documented. [C-D2-004]

**Licensing for programmatic standalone use:** Not applicable — closed SaaS, no
local index.

**Windows compat:** Yes (Cursor runs on Windows).

**Verdict:** Pure RAG retrieval layer. Does not solve the graph/portability
question at all.

---

### 2. Continue (continuedev/continue)

**Architecture:** Multi-backend local indexing: LanceDB (embeddings, stored at
`~/.continue/index/lancedb`), SQLite (AST symbol extraction via Tree-sitter,
full-text search FTS5, chunking). Incremental sync via Rust-based library.
[C-D2-005]

**Graph API:** None. Continue explicitly models the codebase as parallel search
indexes (vector, FTS, symbol) — not as a graph. [C-D2-006]

**File→file edges:** N. LanceDB schema stores
`uuid, path, cachekey, vector, startLine, endLine, contents`. No edge table.
SQLite symbol index stores definitions and references per-file but does not join
them into a dependency graph model. [C-D2-006]

**Change-impact propagation:** N. Not a documented feature. Incremental indexing
detects changed files via `tag_catalog` comparison, but this is for re-indexing,
not impact propagation. [C-D2-007]

**Cross-project index:** N/limited. The index lives at `~/.continue` (global
install path). Technically, a single LanceDB instance could hold data from
multiple workspaces, but this is not a supported or documented use case.
[C-D2-007]

**Index exportable/portable:** Partially. The underlying Lance format is
open-source, and the LanceDB files at `~/.continue/index/lancedb` are local on
disk. An advanced user could read them programmatically using the LanceDB SDK.
However, there is no documented export path and no graph data to export
regardless. [C-D2-005]

**Licensing:** Apache 2.0 (Continue is open source). LanceDB is Apache 2.0.

**Windows compat:** Yes, documented. LanceDB native module requires
platform-specific compilation; there are recurring Windows-specific issues in
the issue tracker (native module load failures). [C-D2-008]

**Verdict:** Open, local, hackable — but still vector-only retrieval. Graph gap
remains.

---

### 3. Aider (Aider-AI/aider)

**Architecture:** RepoMap uses Tree-sitter to parse all repository files,
extracting `defines` (symbols defined per file) and `references` (symbols
referenced per file). A directed NetworkX graph is built where **nodes are files
and edges represent code references** (weight=1.0 for cross-file, 0.1
self-loop). PageRank with personalization weights ranks files by relevance to
current chat context. Cache stored at
`{repo_root}/.aider.tags.cache.v{version}/` using diskcache, keyed on file
modification time. [C-D2-009]

**Graph API:** None exposed to users. The NetworkX graph is an in-memory,
session-ephemeral data structure computed for LLM token-budget optimization. No
CLI or API exposes it. [C-D2-010]

**File→file edges:** YES — internally. The repomap graph explicitly models
file-to-file edges where a symbol defined in file A is referenced in file B.
However, this is never surfaced as a queryable artifact. [C-D2-009]

**Change-impact propagation:** N as a user-facing feature. In principle, the
graph could answer "what files reference X" by inverting the edge direction, but
Aider does not expose this. [C-D2-010]

**Cross-project index:** N. Repomap is scoped to a single git repository. No
cross-repo or multi-folder support.

**Index exportable/portable:** N (officially). The cache stores tag data per
file, not the graph itself. However, Aider is open source (Apache 2.0); the
`RepoMap` class is importable from Python and the NetworkX graph is accessible
programmatically if you instantiate `RepoMap` directly. The community tool
**RepoMapper** (MIT license) extracts this functionality as a standalone CLI +
MCP server. [C-D2-011]

**Licensing:** Apache 2.0. Fully open source.

**Windows compat:** Yes (Python-based, Tree-sitter has Windows wheels).

**Verdict:** Has the closest internal graph model to what JASON-OS needs, but it
is not exposed. The RepoMapper extraction (C-D2-011) is the most viable path to
repurposing this graph model — though it still lacks change-impact propagation
and cross-project support.

---

### 4. GitHub Copilot Workspace

**Status:** Technical preview ended May 30, 2025. Functionality absorbed into
main Copilot product. [C-D2-012]

**Architecture:** Workflow-oriented: generates a "specification" (current
state + desired state bullet lists) and a "plan" (files to
create/modify/delete). Powered by GPT-4o. Not an indexing system.

**Graph API:** None. No graph, no dependency model. [C-D2-012]

**File→file edges:** N. The planning step identifies which files will change,
but this is LLM inference, not a pre-built dependency graph.

**Change-impact propagation:** N documented.

**Cross-project index:** N.

**Index exportable/portable:** N/A — no local index.

**Licensing:** Closed SaaS (GitHub Copilot subscription required).

**Windows compat:** Yes (web-based + VS Code extension).

**Verdict:** Not relevant. Workflow tool, not a graph/index system.

---

### 5. Zed

**Architecture:** Intentionally minimalist context management. Does not
automatically index the entire codebase. Users add context explicitly via `@`
mentions. Agent has file search (glob) and diagnostics tools. [C-D2-013]

**Graph API:** None.

**File→file edges:** N. No automatic dependency modeling.

**Change-impact propagation:** N.

**Cross-project index:** N.

**Index exportable/portable:** N/A.

**Licensing:** GPL (editor) / Apache 2.0 (some components). Closed for some
features.

**Windows compat:** Yes (Zed released Windows support in 2024).

**Verdict:** Irrelevant to this use case. Explicitly avoids automated indexing.

---

### 6. Cody (Sourcegraph)

**Architecture:** Cody relies on Sourcegraph's underlying SCIP (Code
Intelligence Protocol) index — a language-agnostic, Protobuf-based format that
captures symbols, definitions, and references. SCIP is generated by
language-specific indexers (scip-typescript, scip-python, etc.) and uploaded to
a Sourcegraph instance. The Sourcegraph GraphQL API then exposes precise "Go to
Definition" and "Find References" queries across repository boundaries.
[C-D2-014]

**Graph API:** YES — via Sourcegraph GraphQL API. The API exposes cross-repo
symbol navigation (definition lookups, reference lookups). This is a real graph
query surface. [C-D2-014]

**File→file edges:** YES (effectively). SCIP indexes model which files define
and which files reference each symbol. The Sourcegraph API can answer "what
files reference symbol X" across repos. [C-D2-015]

**Change-impact propagation:** Partially. Sourcegraph's SCIP supports
incremental indexing (only re-index changed files). The "Find References" API
can be used to manually query what is affected by a changed symbol, but there is
no automated "file changed → propagate impact" notification system. [C-D2-015]

**Cross-project index:** YES. Cross-repository navigation is a core Sourcegraph
Enterprise feature, documented and deployed at organizations with 2,000+
developers (Palo Alto Networks). [C-D2-014]

**Index exportable/portable:** SCIP `.scip` files are portable artifacts — they
are generated locally by indexers and uploaded. The SCIP format is open source
(Apache 2.0). However, querying requires a Sourcegraph server instance
(self-hosted or cloud). [C-D2-016]

**Licensing for programmatic standalone use:** SCIP protocol is Apache 2.0.
Sourcegraph server has a commercial license (free tier limited). Cody Free/Pro
discontinued July 2025; only Cody Enterprise remains. [C-D2-017]

**Windows compat:** SCIP indexers run on Windows. Sourcegraph server requires
Linux (Docker/Kubernetes). Web-based access from Windows.

**Verdict:** Most mature graph model of any tool evaluated. However: requires
Sourcegraph server (not embedded), enterprise pricing for cross-repo at scale,
and Cody consumer tiers discontinued. Not portable/standalone. Closer to a
dependency oracle than a JASON-OS portability tracker.

---

### 7. Augment Code Context Engine

**Architecture:** Builds a "living semantic dependency graph" processing
400,000+ files. Goes beyond import graphs by parsing runtime call strings,
message-queue topics, and config templates to surface HTTP calls and event
subscriptions. Exposed via MCP (February 2026). [C-D2-018]

**Graph API:** YES — exposed via MCP as of February 2026. External tools
(including Claude Code) query it. [C-D2-018]

**File→file edges:** YES. The Context Engine models service-to-service and
file-to-file semantic relationships, not just import graphs. [C-D2-018]

**Change-impact propagation:** YES. "Understanding system-wide impact before
deploying changes, preventing cascade failures." Explicitly marketed capability.
[C-D2-018]

**Cross-project index:** YES ("across repos, services, and history"). [C-D2-018]

**Index exportable/portable:** Unknown. The MCP interface suggests queryability,
but whether the underlying graph is exportable as a standalone artifact is not
documented in public sources.

**Licensing for programmatic standalone use:** Closed SaaS. Credit-based pricing
model (late 2025). No self-hosted option documented. [C-D2-019]

**Windows compat:** Supports VS Code and JetBrains IDEs; OS-agnostic via MCP.

**Verdict:** Functionally closest to the ideal spec — graph + change-impact +
cross-repo — but is a closed SaaS with no portability guarantees. The JASON-OS
portability goal (track skills/workflows across projects without a vendor
dependency) is fundamentally incompatible with Augment Code's architecture.

---

### 8. Greptile

**Architecture:** Indexes git repositories, builds a code graph (files,
functions, dependencies), uses multi-hop investigation to trace dependencies
across files. REST API ("Genius API") available at $0.45/request for
programmatic queries. Self-hosted deployment via Docker Compose on
AWS/GCP/Azure. [C-D2-020]

**Graph API:** YES — REST "Genius API" for programmatic codebase queries.
[C-D2-020]

**File→file edges:** YES. Finds "everywhere a function is called" and performs
impact analysis. [C-D2-020]

**Change-impact propagation:** YES — automated during PR review workflows. Shows
"which files will be affected by changes." [C-D2-020]

**Cross-project index:** YES — explicitly supports querying multiple
repositories with cross-repo insights. [C-D2-021]

**Index exportable/portable:** Not documented. The graph is internal to
Greptile's service; no export format described.

**Licensing for programmatic standalone use:** Commercial SaaS (per-request
pricing). Self-hosted enterprise option available. No free programmatic API tier
documented.

**Windows compat:** MCP server works on Windows (documented with `set`/`setx`
env var instructions). [C-D2-021]

**Verdict:** Best-in-class for change-impact propagation and cross-repo graph
queries as a service. The per-request API cost ($0.45/req) makes it unsuitable
for high-frequency automated tracking. Not portable — cloud dependency.

---

### 9. TabbyML (Tabby)

**Architecture:** Self-hosted, open source. Fetches repos from
Git/GitHub/GitLab, parses AST, stores in index. Supports multiple repos. Roadmap
item: "expose API to Tabby's index." [C-D2-022]

**Graph API:** Not yet. Planned on roadmap but not shipped as of April 2026.
[C-D2-022]

**File→file edges:** Partial — AST parsing captures structure, but dependency
graph edges not documented as queryable.

**Change-impact propagation:** N (not documented).

**Cross-project index:** YES — multi-repo configuration supported.

**Index exportable/portable:** Unknown — internal index format not documented
for external use.

**Licensing:** Apache 2.0. Fully open source.

**Windows compat:** Docker-based; runs on Windows via Docker Desktop.

**Verdict:** Promising for self-hosted multi-repo indexing, but graph API is not
yet shipped. Monitor roadmap.

---

## Evaluation Matrix

| Tool              | Graph API         | File→File Edges | Change-Impact | Cross-Project | Index Portable        | License       | Windows       |
| ----------------- | ----------------- | --------------- | ------------- | ------------- | --------------------- | ------------- | ------------- |
| Cursor            | N                 | N               | N             | N             | N                     | Closed SaaS   | Yes           |
| Continue          | N                 | N (vector only) | N             | N             | Partial (Lance files) | Apache 2.0    | Yes (issues)  |
| Aider             | N (internal only) | YES (internal)  | N             | N             | N (OSS extractable)   | Apache 2.0    | Yes           |
| Copilot Workspace | N                 | N               | N             | N             | N                     | Closed SaaS   | Yes           |
| Zed               | N                 | N               | N             | N             | N                     | GPL/Apache    | Yes           |
| Cody/Sourcegraph  | YES (GraphQL)     | YES             | Partial       | YES           | SCIP files            | Apache (SCIP) | Server: Linux |
| Augment Code      | YES (MCP)         | YES             | YES           | YES           | Unknown               | Closed SaaS   | Yes (MCP)     |
| Greptile          | YES (REST)        | YES             | YES           | YES           | N                     | Commercial    | Yes           |
| TabbyML           | Planned           | Partial         | N             | YES           | Unknown               | Apache 2.0    | Yes (Docker)  |

---

## Specific Feature Probes

**"Show all files downstream of X" (dependency-propagation queries):** None of
the reviewed tools expose this as a user-queryable API in a portable,
local-first format. Sourcegraph's "Find References" GraphQL query is the closest
implementation — but requires a Sourcegraph server. Aider builds this graph
internally but does not expose it. CodeGraphContext (MIT, open source) — an MCP
server discovered serendipitously — explicitly answers "What functions call X?"
and "If I change Y, what is affected?" using KùzuDB graph database. [C-D2-023]

**"File X changed → these Y files reference it, warn user" (change-impact
propagation):** Only Augment Code and Greptile implement this as an automated,
system-level feature. Sourcegraph can answer this query on-demand but does not
push notifications. No local-first, embedded, portable tool supports it
natively.

**Cross-project/cross-repo single index:** Sourcegraph (server required),
Augment Code (SaaS), Greptile (SaaS/self-hosted), TabbyML (local, roadmap) are
the only tools with multi-repo indexing. None of the IDE-native tools (Cursor,
Continue, Aider, Zed) support cross-project indexing.

---

## Claims

| ID       | Claim                                                                                                                                               | Confidence | Source                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-D2-001 | Cursor uses server-side embeddings (Turbopuffer) + Merkle tree incremental sync                                                                     | HIGH       | [Engineer's Codex](https://read.engineerscodex.com/p/how-cursor-indexes-codebases-fast), [Cursor docs](https://cursor.com/docs/context/codebase-indexing)                                                                        |
| C-D2-002 | Cursor has no file-to-file dependency graph or edges in its index                                                                                   | HIGH       | [Cursor docs](https://cursor.com/docs/context/codebase-indexing), [Towards Data Science](https://towardsdatascience.com/how-cursor-actually-indexes-your-codebase/)                                                              |
| C-D2-003 | Cursor does not expose a graph API or programmatic index access                                                                                     | HIGH       | [Cursor forum post (unanswered)](https://forum.cursor.com/t/how-can-we-access-the-embeddings-for-the-codebase-indexing-if-already-done/121021)                                                                                   |
| C-D2-004 | Cursor index is remote (Turbopuffer), not portable or exportable                                                                                    | HIGH       | [Secure codebase indexing blog](https://cursor.com/blog/secure-codebase-indexing)                                                                                                                                                |
| C-D2-005 | Continue stores LanceDB index at `~/.continue/index/lancedb`; schema has no edge data                                                               | HIGH       | [LanceDB x Continue blog](https://blog.lancedb.com/lancedb-x-continue), [DeepWiki Continue indexing](https://deepwiki.com/continuedev/continue/3.4-codebase-indexing)                                                            |
| C-D2-006 | Continue uses vector + FTS + symbol indexes but no dependency graph model                                                                           | HIGH       | [DeepWiki Continue indexing](https://deepwiki.com/continuedev/continue/3.4-codebase-indexing)                                                                                                                                    |
| C-D2-007 | Continue incremental indexing detects changed files but does not propagate impact                                                                   | MEDIUM     | [DeepWiki Continue indexing](https://deepwiki.com/continuedev/continue/3.4-codebase-indexing)                                                                                                                                    |
| C-D2-008 | Continue has Windows-specific LanceDB native module load failures                                                                                   | MEDIUM     | [GitHub issue #1232](https://github.com/continuedev/continue/issues/1232), [GitHub issue #7192](https://github.com/continuedev/continue/issues/7192)                                                                             |
| C-D2-009 | Aider repomap builds a NetworkX directed graph: nodes = files, edges = cross-file symbol references, ranked by PageRank                             | HIGH       | [Aider repomap blog](https://aider.chat/2023/10/22/repomap.html), [DeepWiki Aider repomap](https://deepwiki.com/Aider-AI/aider/4.1-repository-mapping)                                                                           |
| C-D2-010 | Aider's graph is session-ephemeral, not exported, not queryable via API or CLI                                                                      | HIGH       | [Aider repomap docs](https://aider.chat/docs/repomap.html), [DeepWiki Aider repomap](https://deepwiki.com/Aider-AI/aider/4.1-repository-mapping)                                                                                 |
| C-D2-011 | RepoMapper (MIT) extracts Aider's repomap as standalone CLI + MCP server; no change-impact or cross-project support                                 | MEDIUM     | [GitHub pdavis68/RepoMapper](https://github.com/pdavis68/RepoMapper), [MCP servers listing](https://mcpservers.org/servers/pdavis68/RepoMapper)                                                                                  |
| C-D2-012 | GitHub Copilot Workspace technical preview ended May 2025; no graph/dependency model was ever exposed                                               | HIGH       | [GitHub Next Copilot Workspace](https://githubnext.com/projects/copilot-workspace/)                                                                                                                                              |
| C-D2-013 | Zed intentionally avoids automated full-codebase indexing; no graph model                                                                           | HIGH       | [Zed AI docs](https://zed.dev/docs/ai/tools), [GitHub discussion #10830](https://github.com/zed-industries/zed/discussions/10830)                                                                                                |
| C-D2-014 | Sourcegraph exposes a GraphQL API for precise cross-repo symbol navigation via SCIP                                                                 | HIGH       | [Sourcegraph precise code intelligence docs](https://sourcegraph.com/docs/code_intelligence/explanations/precise_code_intelligence), [Cross-repo navigation blog](https://sourcegraph.com/blog/cross-repository-code-navigation) |
| C-D2-015 | Sourcegraph SCIP models file→symbol→file dependencies; "Find References" is effectively a cross-file edge query                                     | HIGH       | [SCIP announcement](https://sourcegraph.com/blog/announcing-scip), [GitHub scip repo](https://github.com/sourcegraph/scip/)                                                                                                      |
| C-D2-016 | SCIP index files are portable artifacts generated by local indexers; querying requires a Sourcegraph server                                         | HIGH       | [SCIP announcement](https://sourcegraph.com/blog/announcing-scip)                                                                                                                                                                |
| C-D2-017 | Cody Free/Pro discontinued July 23, 2025; only Cody Enterprise remains                                                                              | HIGH       | [Sourcegraph Cody review 2026](https://aiforcode.io/tools/sourcegraph-cody)                                                                                                                                                      |
| C-D2-018 | Augment Code Context Engine builds a semantic dependency graph across repos; exposed via MCP since February 2026                                    | MEDIUM     | [Augment Code Context Engine](https://www.augmentcode.com/context-engine), [Codacy blog](https://blog.codacy.com/ai-giants-how-augment-code-solved-the-large-codebase-problem)                                                   |
| C-D2-019 | Augment Code is closed SaaS with credit-based pricing; no self-hosted or exportable index option documented                                         | MEDIUM     | [Augment Code review 2026](https://computertech.co/augment-code-review/)                                                                                                                                                         |
| C-D2-020 | Greptile REST "Genius API" ($0.45/req) exposes programmatic graph queries including change-impact                                                   | MEDIUM     | [Greptile graph context docs](https://www.greptile.com/docs/how-greptile-works/graph-based-codebase-context), [Greptile homepage](https://www.greptile.com)                                                                      |
| C-D2-021 | Greptile supports multiple repos, self-hosted, and Windows MCP                                                                                      | MEDIUM     | [Greptile self-host docs](https://www.greptile.com/docs/security/selfhost), [Greptile MCP](https://github.com/sosacrazy126/greptile-mcp)                                                                                         |
| C-D2-022 | TabbyML roadmap includes "expose API to Tabby's index" but not shipped as of April 2026                                                             | MEDIUM     | [TabbyML roadmap](https://tabby.tabbyml.com/docs/roadmap/)                                                                                                                                                                       |
| C-D2-023 | CodeGraphContext (MIT) is an MCP server + CLI that indexes code into KùzuDB/FalkorDB/Neo4j graph; exposes change-impact queries; Windows compatible | MEDIUM     | [GitHub CodeGraphContext](https://github.com/CodeGraphContext/CodeGraphContext)                                                                                                                                                  |

---

## Sources

| #   | URL                                                                                                          | Title                                        | Type              | Trust       | CRAAP (avg) | Date      |
| --- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ----------------- | ----------- | ----------- | --------- |
| 1   | https://read.engineerscodex.com/p/how-cursor-indexes-codebases-fast                                          | How Cursor Indexes Codebases Fast            | Technical blog    | Medium      | 3.8         | 2024      |
| 2   | https://cursor.com/docs/context/codebase-indexing                                                            | Cursor Codebase Indexing Docs                | Official docs     | High        | 4.5         | 2025-2026 |
| 3   | https://cursor.com/blog/secure-codebase-indexing                                                             | Securely Indexing Large Codebases            | Official blog     | High        | 4.2         | 2024      |
| 4   | https://forum.cursor.com/t/how-can-we-access-the-embeddings-for-the-codebase-indexing-if-already-done/121021 | Cursor Forum: Embeddings API Access          | Community         | Medium      | 3.0         | 2024      |
| 5   | https://deepwiki.com/continuedev/continue/3.4-codebase-indexing                                              | Continue Codebase Indexing (DeepWiki)        | Documentation     | High        | 4.2         | 2025      |
| 6   | https://blog.lancedb.com/lancedb-x-continue                                                                  | LanceDB x Continue                           | Technical blog    | Medium-High | 3.8         | 2024      |
| 7   | https://github.com/continuedev/continue/issues/1232                                                          | Continue Windows LanceDB Native Module Issue | GitHub issue      | Medium      | 3.5         | 2024      |
| 8   | https://aider.chat/2023/10/22/repomap.html                                                                   | Aider Repomap Blog                           | Official docs     | High        | 4.5         | 2023      |
| 9   | https://aider.chat/docs/repomap.html                                                                         | Aider Repomap Documentation                  | Official docs     | High        | 4.5         | 2024      |
| 10  | https://deepwiki.com/Aider-AI/aider/4.1-repository-mapping                                                   | Aider Repository Mapping (DeepWiki)          | Documentation     | High        | 4.2         | 2025      |
| 11  | https://github.com/pdavis68/RepoMapper                                                                       | RepoMapper GitHub                            | OSS repo          | Medium      | 3.5         | 2024-2025 |
| 12  | https://githubnext.com/projects/copilot-workspace/                                                           | GitHub Copilot Workspace                     | Official          | High        | 4.0         | 2025      |
| 13  | https://zed.dev/docs/ai/tools                                                                                | Zed AI Tools Docs                            | Official docs     | High        | 4.2         | 2025-2026 |
| 14  | https://sourcegraph.com/blog/announcing-scip                                                                 | SCIP Announcement                            | Official blog     | High        | 4.5         | 2022      |
| 15  | https://sourcegraph.com/docs/code_intelligence/explanations/precise_code_intelligence                        | Sourcegraph Precise Code Intelligence        | Official docs     | High        | 4.5         | 2024      |
| 16  | https://sourcegraph.com/blog/cross-repository-code-navigation                                                | Cross-Repository Code Navigation             | Official blog     | High        | 4.2         | 2023      |
| 17  | https://www.augmentcode.com/context-engine                                                                   | Augment Code Context Engine                  | Marketing/product | Medium      | 3.0         | 2025-2026 |
| 18  | https://blog.codacy.com/ai-giants-how-augment-code-solved-the-large-codebase-problem                         | Augment Code Context Engine Analysis         | Technical blog    | Medium      | 3.8         | 2025      |
| 19  | https://www.greptile.com/docs/how-greptile-works/graph-based-codebase-context                                | Greptile Graph Context Docs                  | Official docs     | High        | 4.0         | 2025      |
| 20  | https://www.greptile.com/docs/security/selfhost                                                              | Greptile Self-Host Docs                      | Official docs     | High        | 4.0         | 2025      |
| 21  | https://tabby.tabbyml.com/docs/roadmap/                                                                      | TabbyML Roadmap                              | Official docs     | High        | 4.2         | 2025-2026 |
| 22  | https://github.com/CodeGraphContext/CodeGraphContext                                                         | CodeGraphContext GitHub                      | OSS repo          | Medium      | 3.8         | 2025      |

---

## Contradictions

None of the primary sources contradict each other directly. One tension worth
noting:

- Augment Code marketing claims "real-time knowledge graph" and "living
  dependency graph" (C-D2-018), but their product page does not document an
  export format or offline mode. The MCP exposure as of February 2026 is real,
  but it is a query interface to a remote service — not a portable embedded
  graph. There is a gap between the marketing language ("graph") and the
  architectural reality (closed SaaS oracle).

---

## Gaps

1. **Aider's internal graph structure is not fully reverse-engineered here.**
   The NetworkX graph is importable programmatically from Python, but there is
   no definitive documentation on whether it tracks module imports, function
   call references, or both. The GitHub issue
   [#1385](https://github.com/Aider-AI/aider/issues/1385) ("use code entities as
   nodes instead of files") suggests the current model uses files as nodes,
   limiting granularity.

2. **Augment Code's index exportability is unknown.** Their MCP API may expose
   everything needed for the use case, but whether the graph can be operated
   offline or exported as a portable file is not documented publicly.

3. **Continue's symbol SQLite database** (the Tree-sitter-derived AST tables)
   may implicitly contain enough data to reconstruct a dependency graph — but
   this has not been explored. If `defines` and `references` tables exist
   (mirroring Aider's approach), a dependency graph could be derived.

4. **TabbyML graph API ETA is unknown.** The roadmap item exists but has no
   timeline; monitoring recommended.

5. **SuperMaven** uses a 1M-token context window approach rather than an index —
   there is no graph or dependency model. Not further investigated as it is
   completion-only.

---

## Serendipity

**CodeGraphContext** (https://github.com/CodeGraphContext/CodeGraphContext) was
discovered during research and may be the most directly relevant tool for the
JASON-OS use case that was NOT on the original candidate list. It:

- Is an MCP server + CLI
- Indexes code into a graph database (KùzuDB by default on Windows — relevant)
- Exposes change-impact queries ("if I change X, what is affected?")
- MIT license, open source
- Supports 14 languages
- Explicitly designed for cross-codebase AI agent use

This merits promotion to a first-class candidate in the final synthesis.

**RepoMapper** (https://github.com/pdavis68/RepoMapper) extracts Aider's
NetworkX/PageRank repomap into a standalone CLI + MCP server. MIT license.
Minimal, but it surfaces the closest thing to an open, portable file-graph model
available today in mainstream tooling.

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 11
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: MEDIUM-HIGH**

The core finding (no mainstream codebase-RAG tool exposes a portable graph API
with change-impact) is HIGH confidence — confirmed across multiple official
sources and unanswered community requests. The Augment Code and Greptile
capabilities are MEDIUM confidence due to reliance on marketing documentation
rather than technical specs.
