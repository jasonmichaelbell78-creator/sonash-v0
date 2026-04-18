# D1: Code-Graph Indexers — Findings

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-17 **Sub-Question ID:** D1

## Summary

No existing code-graph indexer satisfies all three JASON-OS requirements
(cross-repo, non-code files, self-update) out of the box. LSIF/SCIP is the most
capable protocol for cross-repo symbol linking but requires Sourcegraph as the
resolution server and is limited to source code. dependency-cruiser is the
strongest single-project candidate for a Node.js/TypeScript codebase with its
programmatic JSON API, but it does not cross repo boundaries and does not model
non-code files. aider's repomap builds a live file-dependency graph via
tree-sitter + PageRank and is now exposed as an MCP server, but it is per-repo
and code-only. Kythe and Sourcetrail are effectively out: Kythe has no Windows
support and requires Bazel, and Sourcetrail was archived in 2021. For JASON-OS's
cross-project portable artifact registry, the clearest path is NOT adopting any
of these tools as the graph itself, but rather using one (dependency-cruiser or
SCIP CLI) as a data-extraction layer feeding a custom SQLite + graphology store
(already validated in T28).

---

## Candidates Evaluated

---

### LSIF (Language Server Index Format)

- **URL/repo:** https://lsif.dev,
  https://microsoft.github.io/language-server-protocol/specifications/lsif/0.6.0/specification/
- **Last release:** LSIF is now a deprecated predecessor to SCIP. Microsoft's
  LSIF specification remains at v0.6.0 (circa 2021). Sourcegraph removed LSIF
  support in v4.6 (2023).
- **Evidence:** Sourcegraph migration docs confirm LSIF is retired in favor of
  SCIP [https://sourcegraph.com/docs/admin/how-to/lsif-scip-migration]
- **Cross-repo:** No — LSIF had no stable cross-repo mechanism; this was its
  primary weakness vs. SCIP.
- **Non-code files:** No — symbol/definition focused; no mechanism for workflow,
  config, or doc files.
- **Self-update:** On-demand re-index only; no watch mode.
- **Tag overlay:** No native support.
- **Windows + Node.js:** Protocol is language-agnostic; tooling varies. No
  native watch daemon.
- **License:** Apache-2.0 (Microsoft spec); tooling varies.
- **JASON-OS fit:** No-fit — superseded by SCIP; retains all SCIP's limitations
  plus lacks cross-repo.
- **Confidence:** HIGH (deprecated status confirmed by official source)

---

### SCIP / scip-typescript (Sourcegraph Code Intelligence Protocol)

- **URL/repo:** https://github.com/sourcegraph/scip,
  https://github.com/sourcegraph/scip-typescript
- **Last release:** SCIP proto schema is actively maintained; scip-typescript is
  actively used within Sourcegraph infrastructure as of 2025–2026.
- **Evidence:**
  - SCIP design doc and proto schema
    [https://github.com/sourcegraph/scip/blob/main/scip.proto]
  - Cross-repo mechanism doc
    [https://github.com/sourcegraph/scip-clang/blob/main/docs/CrossRepo.md]
  - Announcement blog [https://sourcegraph.com/blog/announcing-scip],
    [https://sourcegraph.com/blog/cross-repository-code-navigation]
- **Cross-repo:** Partial — SCIP encodes package+version+symbol strings as
  unique IDs, enabling cross-repo reference encoding. However, cross-repo
  resolution at query time requires a Sourcegraph server instance; the SCIP CLI
  can generate and snapshot indexes standalone, but following a cross-repo jump
  without Sourcegraph requires custom tooling.
- **Non-code files:** No — the `Document` message in scip.proto accepts any
  `language` string so non-code files could be force-encoded, but the schema is
  designed entirely around symbol/definition semantics. No first-class support
  for YAML workflows, markdown docs, or skill configs.
- **Self-update:** On-demand re-index via CI or `src` CLI upload; auto-indexing
  requires Sourcegraph Enterprise. No filesystem watcher built in.
- **Tag overlay:** No — SCIP has no annotation/tag field on Document or Symbol
  nodes.
- **Windows + Node.js:** scip-typescript runs on Node.js (published to npm);
  SCIP CLI binaries are available for multiple platforms including Windows.
  Apache-2.0 means no licensing barrier.
- **License:** Apache-2.0
- **JASON-OS fit:** Low — strong cross-repo symbol encoding, but resolution
  layer requires Sourcegraph server (not self-contained), no non-code support,
  no tag overlay. Could serve as an extraction format for symbols if JASON-OS
  builds a custom resolution layer, but that is significant added complexity.
- **Confidence:** HIGH (schema and cross-repo mechanism verified against
  official proto + docs)

---

### Kythe

- **URL/repo:** https://kythe.io, https://github.com/kythe/kythe
- **Last release:** v0.0.75 — March 12, 2026 (active development, 5,551+
  commits)
- **Evidence:**
  - GitHub repo header and release tags [https://github.com/kythe/kythe]
  - Contributing docs [https://kythe.io/contributing/]
  - Overview [https://kythe.io/docs/kythe-overview.html]
- **Cross-repo:** Unclear — Kythe's graph model is language-agnostic and uses
  "KytheURIs" to identify nodes; in theory cross-repo references can be encoded.
  In practice, the build system integration (Bazel-first, rudimentary CMake) and
  lack of any documented cross-repo workflow outside Google's monorepo make this
  speculative for external users.
- **Non-code files:** No documented support — all indexers target source
  languages (C++, Go, Java, Rust). The graph schema could theoretically model
  arbitrary nodes, but no indexers exist for workflows, YAML configs, or docs.
- **Self-update:** Manual / build-triggered re-index only.
- **Tag overlay:** No native annotation layer on nodes.
- **Windows + Node.js:** Windows support is NOT documented anywhere in Kythe's
  official docs or contributing guide. Build system is Bazel-first; Windows
  Bazel builds are notoriously complex. No Node.js SDK or binding documented.
  This is a hard blocker.
- **License:** Apache-2.0
- **JASON-OS fit:** No-fit — Windows/Bazel barrier alone disqualifies this for a
  Windows 11 + Node.js environment. Designed for Google-scale monorepos, not
  portable cross-project solo-dev tooling.
- **Confidence:** HIGH for disqualification on Windows; MEDIUM for cross-repo
  theoretical capability (no independent confirmation outside Google)

---

### Universal Ctags

- **URL/repo:** https://github.com/universal-ctags/ctags, https://docs.ctags.io
- **Last release:** Actively maintained (regular releases; universal-ctags/ctags
  repo is current)
- **Evidence:**
  - JSON output format docs
    [https://docs.ctags.io/en/latest/man/ctags-json-output.5.html]
  - Output formats overview [https://docs.ctags.io/en/latest/output-format.html]
  - Interactive mode [https://docs.ctags.io/en/latest/interactive-mode.html]
- **Cross-repo:** No — ctags generates a per-invocation tag index. It collects
  symbol definitions and (with `--extras=+r`) references, but has no mechanism
  to model cross-repository symbol resolution or file-to-file dependency edges
  across projects.
- **Non-code files:** Partial — ctags supports custom parsers via regex-based
  `optlib` definitions. YAML, JSON, and markdown files can be partially parsed
  for symbol extraction with user-defined patterns, but there is no built-in
  semantic understanding of non-code artifact relationships.
- **Self-update:** Manual/triggered only. Interactive mode (`--_interactive`)
  allows programmatic use but no filesystem watcher.
- **Tag overlay:** No — ctags is a read-only symbol extractor; it has no
  node-annotation layer.
- **Windows + Node.js:** Windows is supported (docs/windows.rst); ctags can be
  spawned as a subprocess from Node.js. JSON Lines output is machine-readable.
  However, it has no native Node.js API.
- **License:** GPL-2.0 — note: this is a copyleft license. GPL-2.0 allows use in
  tools but may affect how ctags output is incorporated into a distributed
  product.
- **JASON-OS fit:** Low — symbol index only, not a graph. Good for jumpring to
  definitions but cannot model "file A is used by skill B" or workflow
  dependencies. No cross-project capability. Could be used as a data extraction
  primitive feeding a custom graph store.
- **Confidence:** HIGH (all properties verified against official ctags docs)

---

### aider repomap (tree-sitter + PageRank)

- **URL/repo:** https://aider.chat/docs/repomap.html,
  https://aider.chat/2023/10/22/repomap.html,
  https://github.com/pdavis68/RepoMapper (standalone MCP port)
- **Last release:** aider is actively maintained as of 2026; pdavis68/RepoMapper
  MCP had fixes in July 2025.
- **Evidence:**
  - Official repomap docs [https://aider.chat/docs/repomap.html]
  - Methodology blog [https://aider.chat/2023/10/22/repomap.html]
  - DeepWiki architecture doc
    [https://deepwiki.com/Aider-AI/aider/4.1-repository-mapping]
  - RepoMapper MCP [https://github.com/pdavis68/RepoMapper]
- **Cross-repo:** No — the graph is built per-repo from a git repository's
  contents. The MCP server version operates on a single root directory. No
  cross-project resolution.
- **Non-code files:** No — tree-sitter parsers extract code symbols. Non-code
  files (YAML, markdown, skill configs) are excluded from the graph. The repo
  map is "a list of the files in the repo, along with the key symbols which are
  defined in each file."
- **Self-update:** Live — aider regenerates the repo map dynamically before each
  LLM call. The MCP server operates on-demand. No persistent watcher, but cost
  is low per invocation.
- **Tag overlay:** No — nodes are files/symbols; no annotation layer.
- **Windows + Node.js:** aider is Python-based (CLI). The RepoMapper MCP server
  is Python-based, not Node.js native. Can be called over MCP from a Node.js
  host.
- **License:** Apache-2.0 (aider); RepoMapper MIT
- **JASON-OS fit:** Low — the graph is ephemeral (LLM context window sizing),
  not a persistent queryable store. The underlying methodology (tree-sitter +
  PageRank per-file graph) is valuable as inspiration, but aider's repomap is
  not designed as a reusable graph backend. Could be extracted and adapted
  (complex).
- **Confidence:** MEDIUM (methodology well-documented; MCP server is community
  port with limited docs)

---

### ast-grep

- **URL/repo:** https://ast-grep.github.io, https://github.com/ast-grep/ast-grep
- **Last release:** Actively maintained as of early 2026; Node.js NAPI bindings
  available.
- **Evidence:**
  - JavaScript API [https://ast-grep.github.io/guide/api-usage/js-api.html]
  - Feature request for graph query
    [https://github.com/ast-grep/ast-grep/issues/2519]
- **Cross-repo:** No — ast-grep is a structural search/rewrite tool. It operates
  on individual files or file sets; no graph model exists.
- **Non-code files:** Partial — any tree-sitter grammar is supported; custom
  grammars for YAML, JSON, etc. could be used for structural matching. However,
  ast-grep is a search/rewrite tool, not a dependency graph builder.
- **Self-update:** N/A — on-demand execution; no graph state to update.
- **Tag overlay:** No.
- **Windows + Node.js:** Yes — Node.js NAPI bindings with pre-compiled Windows
  binaries. First-class Node.js support.
- **License:** MIT
- **JASON-OS fit:** No-fit — powerful AST tool but not a graph indexer. A March
  2026 GitHub issue requests graph query support as a future feature, confirming
  it does not exist yet.
- **Confidence:** HIGH (Node.js integration confirmed; graph feature confirmed
  absent via official issue)

---

### CodeQL

- **URL/repo:** https://codeql.github.com, https://github.com/github/codeql
- **Last release:** Actively maintained; CodeQL CLI is a standalone tool; Action
  v4 runs on Node.js 24.
- **Evidence:**
  - About CodeQL CLI
    [https://docs.github.com/en/code-security/codeql-cli/getting-started-with-the-codeql-cli/about-the-codeql-cli]
  - JavaScript library
    [https://codeql.github.com/docs/codeql-language-guides/codeql-library-for-javascript/]
- **Cross-repo:** No — CodeQL databases are per-repo. Each database is a
  self-contained snapshot. Cross-repo querying requires running separate
  databases and correlating results manually.
- **Non-code files:** Partial — CodeQL models `File` and `Folder` as `Container`
  entities with path metadata. However, textual content and non-code semantic
  relationships are not included unless specifically extracted. The tool is a
  security analysis platform, not a general dependency graph.
- **Self-update:** On-demand re-analysis; no incremental file-watch mode for the
  database.
- **Tag overlay:** No — CodeQL databases are read-only query targets.
- **Windows + Node.js:** Yes — standalone CLI works on Windows;
  JavaScript/TypeScript analysis requires Node.js 14+. No licensing friction for
  solo-dev use (GitHub Advanced Security is paid, but CodeQL CLI itself is free
  for open-source).
- **License:** CodeQL CLI is free for open-source research; commercial use
  requires Advanced Security license. For solo JASON-OS portability tracking
  (non-GitHub, non-commercial), licensing is borderline — requires verification.
- **JASON-OS fit:** No-fit — security-analysis tool repurposed as a file graph
  would be significant overreach. No tag overlay, no cross-repo, heavy database
  format.
- **Confidence:** MEDIUM (well-documented for security use cases; suitability as
  general graph is my inference)

---

### dependency-cruiser

- **URL/repo:** https://github.com/sverweij/dependency-cruiser
- **Last release:** v17.3.10 — March 26, 2026 (actively maintained)
- **Evidence:**
  - GitHub repo README + API [https://github.com/sverweij/dependency-cruiser]
  - Options reference
    [https://github.com/sverweij/dependency-cruiser/blob/main/doc/options-reference.md]
  - npm package [https://www.npmjs.com/package/dependency-cruiser]
- **Cross-repo:** No — designed for single-project analysis. Can analyze
  directories that span monorepo packages, but not truly separate repos.
- **Non-code files:** No — explicitly targets JavaScript, TypeScript,
  CoffeeScript with ES6/CommonJS/AMD. YAML, markdown, and workflow files are not
  modeled.
- **Self-update:** Build-triggered only; no persistent watcher, though it can be
  scripted in package.json for on-change execution.
- **Tag overlay:** No native annotation layer on graph nodes.
- **Windows + Node.js:** Full support — pure Node.js npm package,
  Windows-compatible, MIT licensed.
- **License:** MIT
- **JASON-OS fit:** Medium — the strongest candidate for the code-layer of a
  JASON-OS file registry. It exports rich JSON (`ICruiseResult` with modules,
  dependencies, dependents, source paths) consumable by a custom graph store.
  Per-project only; would require an orchestration layer to merge graphs across
  JASON-OS repos. As a data-extraction primitive, it is better than ctags or
  SCIP CLI for Node.js/TS projects.
- **Confidence:** HIGH (all properties verified against official docs and repo)

---

### Sourcetrail

- **URL/repo:** https://github.com/CoatiSoftware/Sourcetrail
- **Last release:** v2021.4.19 — November 30, 2021 (original project archived
  December 14, 2021). Community fork by petermost/Sourcetrail is reportedly
  active with releases through December 2025.
- **Evidence:**
  - Original releases page
    [https://github.com/CoatiSoftware/Sourcetrail/releases]
  - Wikipedia article confirming discontinuation
    [https://en.wikipedia.org/wiki/Sourcetrail]
- **Cross-repo:** No — Sourcetrail is a single-project GUI explorer.
- **Non-code files:** No — source code languages only (C, C++, Java, Python).
- **Self-update:** Manual project re-index via GUI.
- **Tag overlay:** No API; GUI-only tool.
- **Windows + Node.js:** GUI application; no Node.js API.
- **License:** GPL-3.0 (original)
- **JASON-OS fit:** No-fit — GUI explorer, no API, archived project. Community
  fork activity does not change the fundamental architecture mismatch.
- **Confidence:** HIGH (archived status confirmed)

---

### GitHub Dependency Graph API

- **URL/repo:** https://docs.github.com/en/rest/dependency-graph
- **Last release:** Actively maintained; deduplication GA announced May 2025.
- **Evidence:**
  - API docs [https://docs.github.com/en/rest/dependency-graph]
  - Dependency submission API
    [https://docs.github.com/en/rest/dependency-graph/dependency-submission]
- **Cross-repo:** Yes — designed explicitly for cross-repo package dependency
  tracking. API supports per-repo dependency queries and cross-repo
  vulnerability alerts.
- **Non-code files:** No — package-level dependencies only (npm, Maven, pip,
  etc.). Does not model file-to-file references, skill configs, workflow
  relationships, or arbitrary artifact edges.
- **Self-update:** Live — graph updates automatically when pushes occur to
  dependency repositories.
- **Tag overlay:** No.
- **Windows + Node.js:** API is REST-based; any HTTP client works. Not
  applicable as a local store.
- **License:** GitHub API ToS — requires GitHub.com or GHES; data lives on
  GitHub servers, not portable.
- **JASON-OS fit:** No-fit — models package-level supply chain, not file-level
  or artifact-level relationships. Not portable/self-hosted.
- **Confidence:** HIGH (official API docs verified)

---

## Claims (Structured)

- C-D1-001 [HIGH]: SCIP replaces LSIF as Sourcegraph's code intelligence
  protocol; LSIF is fully removed in Sourcegraph 4.6+. (src:
  https://sourcegraph.com/docs/admin/how-to/lsif-scip-migration)
- C-D1-002 [HIGH]: SCIP cross-repo navigation requires a Sourcegraph server
  instance at query time; the SCIP CLI tool can generate and snapshot indexes
  standalone but cannot resolve cross-repo jumps without the server. (src:
  https://github.com/sourcegraph/scip-clang/blob/main/docs/CrossRepo.md)
- C-D1-003 [HIGH]: The SCIP `scip.proto` schema has no file-to-file dependency
  edge; cross-file relationships are implied indirectly via shared symbol IDs,
  not explicit edges. (src:
  https://github.com/sourcegraph/scip/blob/main/scip.proto)
- C-D1-004 [HIGH]: Kythe has no documented Windows support and requires Bazel as
  primary build system (CMake rudimentary only). (src:
  https://kythe.io/contributing/, https://github.com/kythe/kythe)
- C-D1-005 [HIGH]: Kythe v0.0.75 was released March 12, 2026 — project is alive
  but community adoption outside Google is minimal. (src:
  https://github.com/kythe/kythe)
- C-D1-006 [HIGH]: aider's repomap builds a directed file graph (nodes=files,
  edges=code references) using tree-sitter + NetworkX PageRank; it is per-repo
  and code-only with no queryable graph API. (src:
  https://deepwiki.com/Aider-AI/aider/4.1-repository-mapping)
- C-D1-007 [HIGH]: ast-grep has no dependency graph feature as of early 2026; a
  feature request for graph query support was filed March 2026. (src:
  https://github.com/ast-grep/ast-grep/issues/2519)
- C-D1-008 [HIGH]: dependency-cruiser v17.3.10 (March 2026) exports JSON with
  modules, dependencies, dependents — a machine-consumable graph for Node.js/TS
  projects. MIT license, pure Node.js, Windows-compatible. (src:
  https://github.com/sverweij/dependency-cruiser)
- C-D1-009 [HIGH]: Sourcetrail original project was archived December 14, 2021;
  community fork petermost/Sourcetrail adds C++/Qt updates but does not add API
  or cross-repo capabilities. (src:
  https://github.com/CoatiSoftware/Sourcetrail/releases,
  https://en.wikipedia.org/wiki/Sourcetrail)
- C-D1-010 [HIGH]: Universal ctags supports JSON Lines output and reference tags
  (`--extras=+r`) on Windows, but produces a symbol index only — no file-to-file
  graph edges and no cross-repo capability. License is GPL-2.0. (src:
  https://docs.ctags.io/en/latest/man/ctags-json-output.5.html)
- C-D1-011 [MEDIUM]: SCIP's `Document.language` field accepts any string,
  meaning non-code files could theoretically be force-encoded, but no tooling
  exists for this and the schema's semantics are code-specific. (src: schema
  analysis of https://github.com/sourcegraph/scip/blob/main/scip.proto)
- C-D1-012 [MEDIUM]: repomix (tool already in use) is a concatenation tool;
  repominify (community Python package) adds a `code_graph.txt` and
  `graph_statistics.yaml` export, but this is a Python dependency and not the
  same as a live queryable graph. (src:
  https://github.com/mikewcasale/repominify)
- C-D1-013 [LOW]: Kythe's graph schema could theoretically model non-code file
  relationships since its node format is arbitrary URI-based; no indexer exists
  for this use case and the Bazel/Windows barrier remains. (src:
  https://kythe.io/docs/kythe-overview.html — inference)

---

## Gaps Identified

1. **SCIP CLI standalone query capability** — Whether the `scip` CLI tool can
   answer "what files reference symbol X" locally without a server was not
   directly confirmed. The proto schema and CLI exist, but documentation of
   offline query workflows is sparse.
2. **scip-typescript non-code extension** — No evidence found for community
   experiments extending scip-typescript to index workflow YAML or JSON config
   files. May be possible via custom `language` fields but unverified.
3. **Kythe Windows community status** — No WSL2 workaround documentation or
   community Windows builds found. The official silence on Windows may mean
   "works under WSL2" but this was not confirmed.
4. **RepoMapper MCP server current maintenance status** — pdavis68/RepoMapper
   had fixes in July 2025 but no subsequent activity found. Stability for
   production use is unverified.
5. **dependency-cruiser cross-project orchestration pattern** — How to merge
   dependency-cruiser JSON output across multiple repos into a unified graph is
   not documented. This is the key gap if adopting it as the JASON-OS extraction
   layer.
6. **CodeQL licensing for non-GitHub use** — Whether CodeQL CLI can be used
   without GitHub Advanced Security for private offline JASON-OS tooling (not
   open-source) was not definitively confirmed. Requires checking the CodeQL
   license agreement directly.

---

## Serendipity

- **repominify** (https://github.com/mikewcasale/repominify): A Python package
  built on repomix output that exports `code_graph.txt` and
  `graph_statistics.yaml`. Not a live graph, but shows that repomix (already in
  use in this stack) can be post-processed into a graph representation. May be
  worth considering as a cheap extraction step if Python is acceptable.
- **dependency-cruiser's `--include-only` + JSON API**: The programmatic API
  returns `ICruiseResult.modules[].dependents[]` — meaning the graph is
  bidirectional (both upstream and downstream edges). This is directly relevant
  to the "upstream/downstream dependencies" requirement in the JASON-OS graph
  spec, and it works out-of-the-box without custom edge construction.
- **SCIP is used by GitLab too**: GitLab Code Intelligence uses LSIF/SCIP format
  (converted via CLI), making SCIP a de-facto industry standard beyond just
  Sourcegraph. This strengthens its viability as an exchange format, even if the
  Sourcegraph server is not used.

---

## Top 2 Recommendations for T28 / JASON-OS File Graph

**1. dependency-cruiser (code-layer extraction, per-repo)** For
TypeScript/JavaScript code files within each JASON-OS project,
dependency-cruiser provides a battle-tested, MIT-licensed, Node.js-native
programmatic API that exports a bidirectional module dependency graph in JSON.
Its `ICruiseResult` format (modules with dependents + dependencies) can be
ingested directly into the existing SQLite + graphology store validated in T28.
Cross-project merging requires an orchestration layer, but the per-repo
extraction is solved. Primary limitation: code files only, no
skill/config/workflow modeling.

**2. Custom YAML/JSON file-reference parser as a complement (for non-code
artifacts)** None of the evaluated tools model non-code artifacts (skill YAMLs,
workflow JSONs, CLAUDE.md files, `.claude/agents/` configs). For JASON-OS
portability tracking of these files, a lightweight custom parser using
tree-sitter grammars (or simple regex/JSON.parse) is necessary. This is not a
gap in the tooling landscape — it is a deliberate design space that no
general-purpose code-graph tool enters. The recommendation is to build a minimal
custom indexer for these file types alongside dependency-cruiser for code files,
feeding both into the SQLite + graphology graph.

---

## Confidence Assessment

- HIGH claims: 10
- MEDIUM claims: 2
- LOW claims: 1
- UNVERIFIED claims: 0
- Overall confidence: HIGH (the disqualifications are well-evidenced; the
  positive recommendations for dependency-cruiser are verified against official
  docs)

---

## Sources

| #   | URL                                                                   | Title                                | Type            | Trust  | CRAAP | Date |
| --- | --------------------------------------------------------------------- | ------------------------------------ | --------------- | ------ | ----- | ---- |
| 1   | https://sourcegraph.com/docs/admin/how-to/lsif-scip-migration         | LSIF to SCIP Migration               | official-docs   | HIGH   | 4.2   | 2023 |
| 2   | https://github.com/sourcegraph/scip/blob/main/scip.proto              | SCIP Protobuf Schema                 | official-source | HIGH   | 4.5   | 2025 |
| 3   | https://github.com/sourcegraph/scip-clang/blob/main/docs/CrossRepo.md | SCIP Cross-Repo Design               | official-docs   | HIGH   | 4.3   | 2025 |
| 4   | https://sourcegraph.com/blog/cross-repository-code-navigation         | Cross-Repo Navigation Blog           | official-blog   | HIGH   | 3.8   | 2024 |
| 5   | https://sourcegraph.com/blog/announcing-scip-typescript               | scip-typescript Announcement         | official-blog   | HIGH   | 3.9   | 2022 |
| 6   | https://kythe.io/contributing/                                        | Kythe Contributing Guide             | official-docs   | HIGH   | 4.0   | 2025 |
| 7   | https://github.com/kythe/kythe                                        | Kythe GitHub Repository              | official-source | HIGH   | 4.4   | 2026 |
| 8   | https://aider.chat/docs/repomap.html                                  | Aider Repomap Docs                   | official-docs   | HIGH   | 4.1   | 2025 |
| 9   | https://deepwiki.com/Aider-AI/aider/4.1-repository-mapping            | Aider Repomap DeepWiki               | community       | MEDIUM | 3.5   | 2025 |
| 10  | https://ast-grep.github.io/guide/api-usage/js-api.html                | ast-grep JS API                      | official-docs   | HIGH   | 4.3   | 2025 |
| 11  | https://github.com/ast-grep/ast-grep/issues/2519                      | ast-grep graph query feature request | community       | MEDIUM | 3.2   | 2026 |
| 12  | https://github.com/sverweij/dependency-cruiser                        | dependency-cruiser GitHub            | official-source | HIGH   | 4.5   | 2026 |
| 13  | https://docs.ctags.io/en/latest/man/ctags-json-output.5.html          | ctags JSON output docs               | official-docs   | HIGH   | 4.2   | 2025 |
| 14  | https://github.com/CoatiSoftware/Sourcetrail/releases                 | Sourcetrail Releases                 | official-source | HIGH   | 4.0   | 2021 |
| 15  | https://en.wikipedia.org/wiki/Sourcetrail                             | Sourcetrail Wikipedia                | tertiary        | MEDIUM | 3.0   | 2025 |
| 16  | https://docs.github.com/en/rest/dependency-graph                      | GitHub Dependency Graph API          | official-docs   | HIGH   | 4.4   | 2025 |
| 17  | https://github.com/mikewcasale/repominify                             | repominify GitHub                    | community       | LOW    | 2.8   | 2025 |
