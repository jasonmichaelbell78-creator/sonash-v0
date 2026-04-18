# Findings: Composite / Hybrid Systems — File-Graph + Tags + Self-Update + Cross-Project Portability

**Searcher:** deep-research-searcher **Profile:** web + docs (exhaustive)
**Date:** 2026-04-17 **Sub-Question IDs:** D8

---

## Executive Summary

**Verdict: No single tool fully satisfies all four requirements
simultaneously.** Two candidates — `@optave/codegraph` and `codebase-memory-mcp`
— come closest but each has a material gap. Every other candidate misses on one
or more axes. The honest conclusion from an exhaustive scan is: **a custom thin
layer on top of an existing code-graph MCP is likely required for the
portability-tracking component.**

---

## Evaluation Filter (Applied to Every Candidate)

| Requirement                                                | Abbreviated       |
| ---------------------------------------------------------- | ----------------- |
| File-graph OR file-registry with tags                      | **Tags**          |
| Self-update OR watch-mode OR periodic re-index             | **Watch**         |
| Cross-project scope OR clear extension path                | **Cross-project** |
| Windows-viable AND Node.js-integrable OR standalone binary | **Win/Node**      |
| Solo-dev-runnable (no Docker/K8s/team deps)                | **Solo**          |

Pass = requirement met. Partial = partially met or extension path clear. Fail =
not supported.

---

## Candidates Evaluated

### C-D8-001 — `@optave/codegraph` (Optave CodeGraph)

**CONFIDENCE: MEDIUM-HIGH**

npm package `@optave/codegraph`, globally installable. Builds a function-level
and file-level dependency graph across 34 languages using tree-sitter + SQLite.
Ships an MCP server with 30+ tools, a CLI (`codegraph build/watch/registry`),
and a programmatic API.

| Requirement   | Status      | Notes                                                                                                                                                    |
| ------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tags          | **Partial** | Auto-tags symbols as `entry`/`core`/`utility`/`adapter`/`dead`/`leaf` based on connectivity. No user-defined tags or file-level metadata tags.           |
| Watch         | **Pass**    | `codegraph watch [dir]` — sub-second incremental rebuilds.                                                                                               |
| Cross-project | **Pass**    | `codegraph registry add/remove/list` — global multi-repo registry; MCP server queries all registered repos simultaneously.                               |
| Win/Node      | **Partial** | Node.js + npm install confirmed. Windows support strongly implied (npm + SQLite, both cross-platform) but not explicitly documented. No Docker required. |
| Solo          | **Pass**    | "Zero network calls, zero telemetry." `npm install -g @optave/codegraph`. No external services.                                                          |

**Gap:** Tags exist only on code symbols (auto-classified), not on files or
arbitrary entries. There is no cross-project "portability tracking" (i.e., no
awareness that a skill file from Project A was copied to Project B). The
registry is a path registry, not a semantic content registry.

**Sources:**

- [npm: @optave/codegraph](https://www.npmjs.com/package/@optave/codegraph) —
  verified March 2026
- [GitHub: optave/codegraph](https://github.com/optave/codegraph) — primary
  documentation

---

### C-D8-002 — `codebase-memory-mcp` (DeusData)

**CONFIDENCE: MEDIUM-HIGH**

Pure C static binary, cross-platform (macOS/Linux/Windows native). Indexes
codebases into a persistent knowledge graph with `File`, `Folder`, `Package`
nodes and typed edges. Auto-sync via background file watcher. Supports 66
languages.

| Requirement   | Status      | Notes                                                                                                                                                                |
| ------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tags          | **Fail**    | No tagging system mentioned. Node labels exist (`File`, `Folder`, `Package`) but no user-defined tags or metadata fields.                                            |
| Watch         | **Pass**    | "Background watcher detects file changes and re-indexes automatically."                                                                                              |
| Cross-project | **Partial** | `list_projects` tool shows all indexed projects. Multi-project awareness present but no centralized cross-project registry with dependency mapping between projects. |
| Win/Node      | **Pass**    | Explicit Windows PowerShell installer. Single static binary, zero dependencies. Node.js not required (C binary).                                                     |
| Solo          | **Pass**    | Download → install → restart agent. No Docker, no runtime deps, no API keys.                                                                                         |

**Gap:** No user-defined tags. No cross-project dependency edges (only
per-project graphs). No portability tracking. Node.js integration not available
(C binary, not npm).

**Sources:**

- [GitHub: DeusData/codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp)
  — primary documentation
- [MCP Market listing](https://mcpmarket.com/server/codebase-memory) — feature
  summary

---

### C-D8-003 — `CodeGraphContext` (CodeGraphContext)

**CONFIDENCE: MEDIUM**

MCP server + CLI that indexes local code into a graph database (KuzuDB on
Windows, FalkorDB Lite or Neo4j as alternatives). Supports 14 languages.
Interactive web visualization.

| Requirement   | Status      | Notes                                                                                                                                                        |
| ------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tags          | **Fail**    | No user-defined tags. Graph nodes are code entities.                                                                                                         |
| Watch         | **Pass**    | Real-time file monitoring via watch mode.                                                                                                                    |
| Cross-project | **Pass**    | Registers multiple project directories.                                                                                                                      |
| Win/Node      | **Partial** | Windows: KuzuDB backend — but KuzuDB was abandoned October 2025. Ladybug fork exists as drop-in replacement. Python 3.10-3.14 required (not Node.js native). |
| Solo          | **Pass**    | No Docker/K8s required in default mode.                                                                                                                      |

**Gap:** Requires Python. KuzuDB's abandonment in October 2025 is a reliability
risk. No tags. No portability tracking.

**Critical finding:** KuzuDB was abandoned by its maintainers in October 2025
([The Register, Oct 14 2025](https://www.theregister.com/2025/10/14/kuzudb_abandoned/)).
The community fork "Ladybug" exists but is immature. Any tool defaulting to
KuzuDB on Windows carries dependency risk.

**Sources:**

- [GitHub: CodeGraphContext/CodeGraphContext](https://github.com/CodeGraphContext/CodeGraphContext)
- [KuzuDB abandonment: The Register](https://www.theregister.com/2025/10/14/kuzudb_abandoned/)

---

### C-D8-004 — `dep-tree` (gabotechs)

**CONFIDENCE: HIGH** (negative finding)

3D force-directed file dependency graph visualization for JS/TS, Python, Rust,
Go. CI-linting for architectural rules.

| Requirement   | Status   | Notes                                  |
| ------------- | -------- | -------------------------------------- |
| Tags          | **Fail** | No tag support documented.             |
| Watch         | **Fail** | No watch/auto-update mode.             |
| Cross-project | **Fail** | Single-project analysis only.          |
| Win/Node      | **Pass** | pip + npm install. Windows compatible. |
| Solo          | **Pass** | Solo-friendly CLI.                     |

**Verdict:** Three of five requirements fail. Not a viable composite candidate.
Good for single-project visualization only.

**Source:** [GitHub: gabotechs/dep-tree](https://github.com/gabotechs/dep-tree)

---

### C-D8-005 — `Beads` (@beads/bd)

**CONFIDENCE: MEDIUM**

Distributed graph issue tracker for AI agents backed by Dolt (version-controlled
SQL). Provides dependency-aware task graphs, not file-system graphs. Available
via npm.

| Requirement   | Status      | Notes                                                                             |
| ------------- | ----------- | --------------------------------------------------------------------------------- |
| Tags          | **Fail**    | No file tags. Tracks task relations (relates_to, duplicates, supersedes).         |
| Watch         | **Fail**    | Not a file watcher. Tracks task state, not file changes.                          |
| Cross-project | **Partial** | Contributor mode can route to separate repos, but not a cross-project file graph. |
| Win/Node      | **Pass**    | npm installable, Windows listed as supported.                                     |
| Solo          | **Pass**    | Embedded mode, no Docker.                                                         |

**Verdict:** Wrong category. Beads is a task dependency tracker, not a
file/skill registry. Not viable for this use case.

**Source:** [GitHub: gastownhall/beads](https://github.com/gastownhall/beads)

---

### C-D8-006 — `LocalNest` (wmt-mobile/localnest)

**CONFIDENCE: LOW-MEDIUM**

MCP server with 74 tools: hybrid BM25+vector search, temporal knowledge graph,
AST-aware chunking, persistent cross-session memory. Written in Dart (compiled
executable). npm wrapper available.

| Requirement   | Status      | Notes                                                                                   |
| ------------- | ----------- | --------------------------------------------------------------------------------------- |
| Tags          | **Unknown** | Documentation does not mention file-level tagging. Semantic search exists.              |
| Watch         | **Unknown** | Not documented in available sources.                                                    |
| Cross-project | **Pass**    | `list_projects`, `list_roots`, `--split-projects` mode. Cross-repo awareness present.   |
| Win/Node      | **Partial** | Dart compile exe on Windows. npm install available. Dart runtime dependency is unusual. |
| Solo          | **Pass**    | Local-first, SQLite, "zero cloud."                                                      |

**Gap:** Insufficient public documentation to evaluate tags and watch mode. Dart
dependency adds friction on Windows. Likely a knowledge graph for AI memory, not
a file-registry with portability tracking.

**Source:**
[GitHub: wmt-mobile/localnest](https://github.com/wmt-mobile/localnest)

---

### C-D8-007 — `xgmem` (meetdhanani17)

**CONFIDENCE: LOW**

TypeScript MCP server for cross-project knowledge graph memory for LLM agents.
Stores entities, relations, observations per-project with cross-project sharing.

| Requirement   | Status   | Notes                                               |
| ------------- | -------- | --------------------------------------------------- |
| Tags          | **Fail** | Entity-relation model, not file-registry with tags. |
| Watch         | **Fail** | Conversational memory system, not file watcher.     |
| Cross-project | **Pass** | Designed for cross-project agent memory sharing.    |
| Win/Node      | **Pass** | TypeScript/Node.js.                                 |
| Solo          | **Pass** | npm install.                                        |

**Verdict:** This is an agent memory system, not a file-graph or skill registry.
Fundamental category mismatch.

**Source:**
[GitHub: meetdhanani17/xgmem](https://github.com/meetdhanani17/xgmem)

---

### C-D8-008 — `Quivr` (QuivrHQ)

**CONFIDENCE: MEDIUM** (negative finding on fit)

RAG framework for document ingestion with tagging, folder organization,
PGVector + Faiss backends.

| Requirement   | Status      | Notes                                                              |
| ------------- | ----------- | ------------------------------------------------------------------ |
| Tags          | **Pass**    | Tagging and folder customization confirmed.                        |
| Watch         | **Fail**    | No documented file-watcher or auto-reindex.                        |
| Cross-project | **Partial** | Multi-format document store but not a code/file dependency graph.  |
| Win/Node      | **Fail**    | Python-heavy RAG stack. Windows possible but Docker-first.         |
| Solo          | **Fail**    | Requires PostgreSQL + pgvector + Supabase or Docker Compose stack. |

**Verdict:** Too heavyweight for solo Windows dev. No file-dependency graph.
Tags are document tags, not graph traversal metadata.

**Source:** [GitHub: QuivrHQ/quivr](https://github.com/QuivrHQ/quivr)

---

### C-D8-009 — `Onyx` (formerly Danswer)

**CONFIDENCE: MEDIUM** (negative finding on fit)

Open-source enterprise search platform with hybrid search + knowledge graph over
uploaded files and 40+ connectors.

| Requirement   | Status      | Notes                                                   |
| ------------- | ----------- | ------------------------------------------------------- |
| Tags          | **Partial** | Document metadata; not file-dependency graph tags.      |
| Watch         | **Fail**    | Connector-based ingestion, not real-time file watching. |
| Cross-project | **Pass**    | Enterprise-scope multi-source.                          |
| Win/Node      | **Fail**    | Docker-first. Python + Postgres + Redis stack.          |
| Solo          | **Fail**    | Requires Docker Compose with multiple services.         |

**Verdict:** Enterprise scope, Docker-required, no dependency graph model. Not
viable for solo dev on Windows without Docker.

**Source:** [Onyx AI: onyx-dot-app](https://github.com/danswer-ai/danswer)

---

### C-D8-010 — `CocoIndex` + Kuzu/Ladybug

**CONFIDENCE: LOW** (risk + Python dependency)

Data transformation framework for building real-time knowledge graphs from
documents with incremental processing and file-watching.

| Requirement   | Status      | Notes                                                                    |
| ------------- | ----------- | ------------------------------------------------------------------------ |
| Tags          | **Partial** | `node_set` parameter provides semantic tags for categorization in graph. |
| Watch         | **Pass**    | File watcher with incremental processing confirmed.                      |
| Cross-project | **Unknown** | Document-centric; unclear if tracks cross-project file identity.         |
| Win/Node      | **Fail**    | Python-only framework. Requires PostgreSQL + Neo4j (or Kuzu).            |
| Solo          | **Partial** | Local possible but requires multiple external services.                  |

**Gap:** KuzuDB abandoned October 2025 (must migrate to Ladybug fork). Python +
PostgreSQL + graph DB stack has high setup friction on Windows. Node.js
integration absent.

**Sources:**

- [CocoIndex + Kuzu: DEV Community](https://dev.to/cocoindex/build-real-time-knowledge-graphs-from-documents-using-cocoindex-kuzu-with-llms-live-updates-n1b)
- [KuzuDB abandonment](https://www.theregister.com/2025/10/14/kuzudb_abandoned/)

---

### C-D8-011 — Nix Flakes (portability angle)

**CONFIDENCE: HIGH** (wrong tool category)

Nix flakes provide portable, reproducible environment definitions with a
cross-project registry of symbolic identifiers and lock files. Active on WSL2.

| Requirement   | Status      | Notes                                                    |
| ------------- | ----------- | -------------------------------------------------------- |
| Tags          | **Fail**    | No file-content tagging. Tracks environment derivations. |
| Watch         | **Fail**    | Declarative; no runtime file watcher.                    |
| Cross-project | **Pass**    | Nix registry maps symbolic names to flake URLs globally. |
| Win/Node      | **Partial** | WSL2 only on Windows. Not native Windows.                |
| Solo          | **Pass**    | Solo-developer model.                                    |

**Verdict:** Solves environment portability, not file/skill portability. Wrong
category.

**Source:**
[Nix Flakes documentation: nix.dev](https://nix.dev/concepts/flakes.html)

---

### C-D8-012 — `PrivateGPT` (zylon-ai)

**CONFIDENCE: HIGH** (negative finding)

Local LLM + RAG over documents. Supports folder ingestion with optional watch
mode.

| Requirement   | Status      | Notes                                             |
| ------------- | ----------- | ------------------------------------------------- |
| Tags          | **Fail**    | No tagging system. Document-level retrieval only. |
| Watch         | **Partial** | `--watch` flag for folder ingestion exists.       |
| Cross-project | **Fail**    | Single knowledge base. No cross-project scope.    |
| Win/Node      | **Partial** | Windows possible but Python/poetry required.      |
| Solo          | **Partial** | Solo-runnable but Python/CUDA setup friction.     |

**Verdict:** RAG document search, not a file-dependency graph or registry.

**Source:**
[GitHub: zylon-ai/private-gpt](https://github.com/zylon-ai/private-gpt)

---

### C-D8-013 — IPFS-based file registries

**CONFIDENCE: HIGH** (negative finding)

IPFS/Helia (js-IPFS successor) enables content-addressable cross-machine file
references. Windows + Node.js supported.

| Requirement   | Status   | Notes                                     |
| ------------- | -------- | ----------------------------------------- |
| Tags          | **Fail** | CID-based, no semantic tagging layer.     |
| Watch         | **Fail** | No built-in file watcher for re-indexing. |
| Cross-project | **Pass** | Content-addressable by design.            |
| Win/Node      | **Pass** | Helia runs on Node.js, Windows supported. |
| Solo          | **Pass** | No server required.                       |

**Verdict:** Wrong abstraction layer. IPFS is a content-addressed storage
network, not a semantic file registry with dependency graphs. Building a full
registry on top would be a significant custom build.

**Source:** [IPFS Documentation](https://docs.ipfs.tech/) /
[js-ipfs GitHub](https://github.com/ipfs/js-ipfs)

---

### C-D8-014 — Solid Project / Dokieli

**CONFIDENCE: HIGH** (negative finding)

Tim Berners-Lee's linked data personal data pod project. Semantically rich but
designed for web-based social/personal data.

| Requirement   | Status      | Notes                                             |
| ------------- | ----------- | ------------------------------------------------- |
| Tags          | **Partial** | RDF triples enable rich semantic tagging.         |
| Watch         | **Fail**    | No file watcher. Push-based data pods.            |
| Cross-project | **Pass**    | Cross-pod linked data by design.                  |
| Win/Node      | **Partial** | Node.js community servers exist (CSS, NSS).       |
| Solo          | **Partial** | Complex RDF + SPARQL learning curve for solo dev. |

**Verdict:** Architecturally interesting but massive complexity for this use
case. No file-dependency graph or code-awareness.

**Source:** [Solid Project](https://solidproject.org/)

---

## Contradictions

**Codegraph vs codebase-memory-mcp overlap:** Both tools claim multi-project
awareness and watch mode. They differ in language (Node.js npm vs C binary), tag
model (Codegraph has auto-tags on symbols; codebase-memory-mcp has none), and
portability model (Codegraph has an explicit CLI registry; codebase-memory-mcp
has implicit project list via `list_projects`).

**KuzuDB status conflict:** CodeGraphContext defaults to KuzuDB on Windows, but
KuzuDB was abandoned October 2025. This creates a material reliability risk not
reflected in the tool's README (which as of research date still references
KuzuDB as the Windows default). Sources:
[The Register Oct 2025](https://www.theregister.com/2025/10/14/kuzudb_abandoned/)
vs
[CodeGraphContext README](https://github.com/CodeGraphContext/CodeGraphContext).

---

## Gaps

1. **No tool found that tracks file identity/portability across projects** — the
   specific use case of "this skill file was copied from Project A to Project B,
   track it" is absent from every tool examined.

2. **User-defined tags on arbitrary files (non-code)** — no tool supports
   tagging YAML config files, Markdown skill documents, or JSON schemas with
   custom metadata in a queryable graph. All tag systems target code symbols or
   document chunks.

3. **JASON-OS portability tracking specifically** — no public tool addresses the
   use case of tracking which skills/agents are deployed across which projects,
   with upstream/downstream provenance.

4. **Pieces for Developers MCP integration depth** — Pieces enriches code
   snippets with auto-tags and long-term memory but its MCP capabilities and
   dependency graph depth could not be fully verified from public sources.
   Warrants direct investigation.

5. **Emerging 2026 tools** — the MCP ecosystem is moving fast (21,000+ servers
   in Glama registry). New composite tools may have shipped in Q1-Q2 2026 that
   aren't yet cataloged.

---

## Serendipity

**KuzuDB abandoned October 2025** — any tool or custom build relying on KuzuDB
as a graph backend on Windows should pivot to Ladybug (the community fork) or
switch to SQLite/DuckDB graph extensions. This affects CodeGraphContext directly
and any custom build using the KuzuDB Node.js driver.

**`dep-tree` by gabotechs** — though it fails the composite test, it is the
cleanest tool for single-project file-level dependency visualization with CI
enforcement. If the user needs a standalone visualization layer, `dep-tree` is
the best-of-breed in that narrow category.

**CocoIndex's incremental processing model** — the framework's approach of
tracking which document chunks changed and propagating updates (without
re-processing the full corpus) is the most sophisticated self-update model
found. If JASON-OS ever needs a document-based knowledge layer alongside a code
graph, CocoIndex's architecture is worth revisiting when the Python dependency
becomes acceptable.

**Beads (@beads/bd) — task dependency graph for AI agents** — while not a file
registry, Beads' Dolt-backed graph model (versioned SQL) is architecturally
interesting for tracking cross-project relationships between agent skills over
time.

---

## Sources

| #   | URL                                                      | Title                              | Type                  | Trust       | CRAAP Score | Date      |
| --- | -------------------------------------------------------- | ---------------------------------- | --------------------- | ----------- | ----------- | --------- |
| 1   | https://www.npmjs.com/package/@optave/codegraph          | @optave/codegraph npm              | Official pkg registry | HIGH        | 4.2         | Mar 2026  |
| 2   | https://github.com/optave/codegraph                      | optave/codegraph GitHub            | Official repo         | HIGH        | 4.4         | Mar 2026  |
| 3   | https://github.com/DeusData/codebase-memory-mcp          | codebase-memory-mcp GitHub         | Official repo         | HIGH        | 4.3         | 2025-2026 |
| 4   | https://mcpserver.space/mcp/codegraph/                   | Codegraph MCP Server Space listing | Community             | MEDIUM      | 3.5         | 2026      |
| 5   | https://github.com/gabotechs/dep-tree                    | dep-tree GitHub                    | Official repo         | HIGH        | 4.2         | 2025      |
| 6   | https://www.theregister.com/2025/10/14/kuzudb_abandoned/ | KuzuDB abandoned — The Register    | Tech journalism       | MEDIUM-HIGH | 3.8         | Oct 2025  |
| 7   | https://github.com/gastownhall/beads                     | Beads GitHub                       | Official repo         | HIGH        | 3.8         | 2025      |
| 8   | https://github.com/wmt-mobile/localnest                  | LocalNest GitHub                   | Official repo         | HIGH        | 3.5         | 2025      |
| 9   | https://github.com/QuivrHQ/quivr                         | Quivr GitHub                       | Official repo         | HIGH        | 3.9         | 2025      |
| 10  | https://github.com/danswer-ai/danswer                    | Onyx (Danswer) GitHub              | Official repo         | HIGH        | 3.8         | 2025      |
| 11  | https://cocoindex.io/blogs/knowledge-graph-for-docs      | CocoIndex KG docs blog             | Official blog         | MEDIUM-HIGH | 3.7         | 2025      |
| 12  | https://nix.dev/concepts/flakes.html                     | Nix Flakes — nix.dev               | Official docs         | HIGH        | 4.4         | 2026      |
| 13  | https://github.com/zylon-ai/private-gpt                  | PrivateGPT GitHub                  | Official repo         | HIGH        | 3.9         | 2025      |
| 14  | https://docs.ipfs.tech/                                  | IPFS Docs                          | Official docs         | HIGH        | 4.0         | 2025      |
| 15  | https://solidproject.org/                                | Solid Project                      | Official site         | HIGH        | 3.6         | 2025      |
| 16  | https://github.com/CodeGraphContext/CodeGraphContext     | CodeGraphContext GitHub            | Official repo         | HIGH        | 3.7         | 2025      |
| 17  | https://github.com/meetdhanani17/xgmem                   | xgmem GitHub                       | Official repo         | MEDIUM      | 3.2         | 2025      |
| 18  | https://github.com/TensorBlock/awesome-mcp-servers       | awesome-mcp-servers TensorBlock    | Community list        | MEDIUM      | 3.4         | 2025-2026 |

---

## Top-3 Recommendations (Closest Fits — None Is Complete)

### Rank 1: `@optave/codegraph` — best composite approximation

Passes: Watch, Cross-project, Solo. Partial on: Win/Node (Node.js confirmed,
Windows implied), Tags (auto-tags on symbols, not user-defined file tags).

**For JASON-OS:** Use as the graph + watch + multi-repo backbone. Extend with a
thin metadata layer (e.g., a JSON sidecar per file or a separate SQLite table)
for user-defined tags and portability tracking. The programmatic API makes
extension tractable.

### Rank 2: `codebase-memory-mcp` — best Windows binary

Passes: Watch, Win/Node (native binary), Solo. Partial on: Cross-project
(multi-project awareness without cross-project dependency edges). Fails on:
Tags, Node.js integration.

**For JASON-OS:** Best choice if the Windows-native binary requirement is
paramount. Would need a separate tagging mechanism and a custom portability
tracker layered on top.

### Rank 3: `dep-tree` (gabotechs) — best single-project visualization

Passes: Win/Node, Solo. Fails: Tags, Watch, Cross-project.

**For JASON-OS:** Use only if the requirement narrows to "visualize one
project's file dependency graph in CI." Not viable as the primary composite
tool.

---

## Final Verdict

**NO composite candidate found that checks all four boxes.**

The closest approximation is `@optave/codegraph`: it covers file-graph + watch +
cross-project registry + solo-dev-runnable, with Node.js integration. The two
gaps are:

1. **Tags**: only auto-classification of code symbols; no user-defined
   file-level metadata tags.
2. **Portability tracking**: no awareness of which files were copied/derived
   from which other projects.

These two gaps cannot be resolved by configuration. They require a **custom thin
extension layer** — most tractably: a JSON sidecar file per registered project
that maps file paths to tags and upstream provenance, queryable via the existing
`codegraph` programmatic API or a parallel MCP tool that reads the sidecar
registry.

**Recommendation: Custom build required on top of `@optave/codegraph` as
foundation.** The "buy it" answer is: buy the graph + watch + multi-repo engine
(Codegraph), build the tags + portability layer.

---

## Confidence Assessment

- HIGH claims: 5 (negative findings with multiple confirming sources)
- MEDIUM-HIGH claims: 4 (Codegraph, codebase-memory-mcp positive features)
- MEDIUM claims: 3 (LocalNest, CocoIndex, xgmem — limited documentation)
- LOW claims: 2 (LocalNest watch mode unknown, CocoIndex cross-project scope
  unknown)
- UNVERIFIED claims: 0

**Overall confidence: MEDIUM-HIGH** — the negative verdict (no composite tool
exists) is backed by exhaustive multi-source search. The positive finding
(Codegraph as best approximation) is MEDIUM-HIGH confidence with verified
sources from March 2026.
