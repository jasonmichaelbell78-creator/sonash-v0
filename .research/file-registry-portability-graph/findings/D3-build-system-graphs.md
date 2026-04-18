# Findings: Build-System Dependency Graphs — Repurposability for File/Workflow/Skill Portability Tracking

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-17 **Sub-Question IDs:** D3

---

## Summary

Nine build-system and module-graph tools were evaluated for repurposability as a
file registry with tag-queryable nodes and upstream/downstream dependency edges
(the JASON-OS portability-tracking use case). The short answer: **none are
repurposable without significant infrastructure cost**. Most are monorepo-only,
all are code-first, and cross-repo support is either nonexistent or a paid cloud
feature. The two candidates worth seriously considering — Nx's plugin API and
madge's programmatic API — can be bent toward the goal but are not turnkey; they
would be foundations for a custom solution, not the solution itself.

---

## Per-Candidate Evaluation

### 1. Bazel `bazel query`

**Claim C-D3-001** [LOW confidence]: Bazel's query language exposes a full
build-graph API but cannot model non-build artifacts natively.

Bazel exposes four query surfaces: `bazel query` (target graph), `bazel cquery`
(configured targets), `bazel aquery` (action graph), and `bazel info`. Output
formats include protocol buffer (`streamed_jsonproto`), GraphViz DOT, XML, and
label-only text. There is no native JSON format; the closest is NDJSON via
`--output=streamed_jsonproto` [1][2].

The `filegroup` rule lets you group arbitrary files (docs, YAML, scripts) under
a label, and those groups can participate in the dependency graph. A skill file
could be a `filegroup` target. However, this requires every tracked file to be
explicitly declared in a `BUILD` file — a substantial up-front and ongoing
maintenance burden [3].

Cross-workspace: External repositories are queryable (results include
`@other-repo//label` syntax), but each workspace must be explicitly declared as
an `http_archive` or `local_repository` dependency. True cross-repo "automatic
discovery" doesn't exist [2].

**Repurposability verdict:** NO. The model is build-target-first. Expressing
skill/agent/workflow files as graph nodes requires wrapping every artifact in
`BUILD` declarations. Operational cost is extreme for a solo dev on Windows
(Bazel has significant setup friction on Windows; no daemon for free
cross-repo).

| Criterion                    | Result                                                      |
| ---------------------------- | ----------------------------------------------------------- |
| Graph exposed (API/CLI/JSON) | Y — proto/XML/DOT, not idiomatic JSON                       |
| Cross-workspace/cross-repo   | Y — via explicit external repo declarations                 |
| Non-code file support        | Technically Y via `filegroup`, but requires BUILD authoring |
| Change-propagation query     | Y — `bazel query 'rdeps(...)'`                              |
| Windows + Node.js            | Painful — Bazel on Windows is first-class but complex       |
| Solo-dev operational cost    | HIGH — BUILD files, Bazel binary, cache daemon              |

---

### 2. Buck2 (Facebook)

**Claim C-D3-002** [LOW confidence]: Buck2 offers a sophisticated programmable
query layer (BXL) but remains pre-release outside Meta and has a high adoption
ceiling.

Buck2 supports `uquery`, `cquery`, and `aquery` — the same three-layer model as
Bazel. The BXL scripting layer allows custom Starlark scripts to walk the graph
programmatically via `ctx.uquery()`, `ctx.cquery()`, and `ctx.aquery()` [4][5].
Windows is officially supported and tested in CI.

However, Buck2 has no stable release tag as of early 2026. The official
documentation warns: "outside consumers will encounter quite a lot of rough
edges" [6]. Adoption outside Meta is very limited (System Initiative being a
notable exception). The BUCK file authoring model is identical to Bazel's — all
nodes must be declared targets.

**Repurposability verdict:** NO. The graph is target/build-centric. BXL is
powerful but requires committing to Buck2's entire BUCK file ecosystem.
Pre-release status makes this high-risk for a solo dev workflow.

| Criterion                    | Result                                                           |
| ---------------------------- | ---------------------------------------------------------------- |
| Graph exposed (API/CLI/JSON) | Y — via BXL scripting and query commands                         |
| Cross-workspace/cross-repo   | N — no documented cross-repo capability                          |
| Non-code file support        | Technically Y via `filegroup` equivalent, but authoring overhead |
| Change-propagation query     | Y — via rdeps query                                              |
| Windows + Node.js            | Y on Windows, but pre-release rough edges                        |
| Solo-dev operational cost    | VERY HIGH — pre-release, BUCK file authoring                     |

---

### 3. Nx Project Graph

**Claim C-D3-003** [HIGH confidence]: Nx's `createNodesV2` plugin API can add
arbitrary file-typed nodes to the project graph, making it the strongest
candidate for repurposing.

The Nx project graph plugin API consists of two exports: `createNodesV2` (maps
glob patterns to project nodes) and `createDependencies` (injects dependency
edges between nodes). A plugin can match any file pattern — including `*.md`,
`*.yaml`, `**/*.skill.ts` — and return `ProjectGraphProjectNode` or
`ProjectGraphExternalNode` objects with the metadata field [7][8].

The `ProjectGraph` type is:
`{ nodes: Record<string, ProjectGraphProjectNode>, externalNodes?: Record<string, ProjectGraphExternalNode>, dependencies: Record<string, ProjectGraphDependency[]>, version?: string }`
[9].

`nx graph --file graph.json` exports the full graph as `GraphJson`, which wraps
`ProjectGraph`. This JSON is directly usable as a file registry. The graph
viewer is interactive in a browser.

Lerna v9 delegates its project graph entirely to Nx (stores cache in
`node_modules/.cache/nx-workspace-data/project-graph.json`) [10]. Lerna is
therefore just Nx under the hood for this purpose.

**Cross-workspace:** Cross-repo is on the 2026 roadmap as "Synthetic Monorepo"
but is currently only available as an enterprise cloud feature (Nx Cloud
Polygraph, enterprise-tier pricing) [11][12]. The open-source CLI is strictly
single-workspace.

**Repurposability verdict:** CONDITIONAL YES — within one workspace, the plugin
API is genuinely extensible to non-code files. For the JASON-OS multi-repo
scenario (skills in home `.claude/`, agents in project `.claude/`, scripts in
`scripts/`), you would need to either (a) treat one repo as the canonical
workspace and symlink/copy tracked paths in, or (b) wait for/pay for Nx Cloud
Polygraph.

| Criterion                    | Result                                                    |
| ---------------------------- | --------------------------------------------------------- |
| Graph exposed (API/CLI/JSON) | Y — `nx graph --file graph.json` is idiomatic JSON        |
| Cross-workspace/cross-repo   | N (OSS); Y (Nx Cloud Enterprise only)                     |
| Non-code file support        | Y — via `createNodesV2` glob plugins                      |
| Change-propagation query     | Y — `nx affected` and `nx show projects --affected`       |
| Windows + Node.js            | Y — Node.js native                                        |
| Solo-dev operational cost    | MEDIUM — nx.json setup, plugin authoring, daemon optional |

---

### 4. Turborepo

**Claim C-D3-004** [MEDIUM confidence]: Turborepo's `turbo query` GraphQL API
exposes package-level and task-level affected detection, but it is not
file-registry-capable and has no plugin extension point.

Turborepo 2.2+ includes `turbo query` — a GraphQL interface queryable against
the monorepo. Output is JSON. The GraphQL schema exposes `packages`, `tasks`,
`affectedPackages`, and `affectedTasks`. The `--output=json` flag returns
structured JSON including
`{ "data": { "affectedPackages": { "items": [{"name": "web", "path": "apps/web", "reason": {"__typename": "FileChanged"}}] } } }`
[13].

The task inputs system (`turbo.json` `inputs` field) means file changes can
propagate to package-level affected detection, but the graph nodes are always
packages — individual files cannot be modeled as first-class nodes [14].

The `turbo ls --affected` flag has reported false-positive issues with root
`package.json` changes triggering all packages [15]. Cross-repo: not supported.

**Repurposability verdict:** NO. The graph model is package-centric, not
file-centric. There's no plugin API to add custom node types. It's an excellent
change-detection tool within a monorepo, but it can't model a skill or agent
file as an addressable node.

| Criterion                    | Result                                        |
| ---------------------------- | --------------------------------------------- |
| Graph exposed (API/CLI/JSON) | Y — GraphQL + JSON via `turbo query`          |
| Cross-workspace/cross-repo   | N                                             |
| Non-code file support        | N — package-level nodes only                  |
| Change-propagation query     | Y — `turbo query affected` with typed reasons |
| Windows + Node.js            | Y                                             |
| Solo-dev operational cost    | LOW — `turbo.json` only, no daemon required   |

---

### 5. Pants Build System

**Claim C-D3-005** [MEDIUM confidence]: Pants supports fine-grained per-file
dependency inference but is Python/JVM-ecosystem-first and has no cross-project
capability.

Pants tracks every file as a potential node and infers dependencies via static
analysis. `pants dependencies --format=json` produces an adjacency list of the
dependency graph in JSON. `pants dependents` finds upstream dependents.
`pants peek` outputs per-target JSON [16][17]. The `filedeps` command shows all
source files in a target.

Critically, Pants performs inference automatically for supported language
ecosystems (Python, Java, Kotlin, Go) but requires explicit `dependencies`
fields for non-code targets like `resources()` and `files()` [17]. Markdown
files could be wrapped in a `files()` target, but dependency edges between them
would be manual.

Cross-project: no documented cross-repository support. Windows: Pants is
Linux/macOS only. This alone disqualifies it for the Windows 11 Node.js
environment.

**Repurposability verdict:** NO for this environment. Linux/macOS only
eliminates it. The model is compelling (per-file nodes with JSON export) but the
platform incompatibility is a hard blocker.

| Criterion                    | Result                                              |
| ---------------------------- | --------------------------------------------------- |
| Graph exposed (API/CLI/JSON) | Y — `--format=json` adjacency list                  |
| Cross-workspace/cross-repo   | N                                                   |
| Non-code file support        | Y (files()/resources() targets) but manual edges    |
| Change-propagation query     | Y — `pants dependents`                              |
| Windows + Node.js            | N — Linux/macOS only                                |
| Solo-dev operational cost    | MEDIUM — BUILD file authoring required for non-code |

---

### 6. Lerna

**Claim C-D3-006** [HIGH confidence]: Lerna v9 is a thin orchestration layer
over Nx and delegates all dependency graph functionality to Nx.

Since Lerna v5+, the project graph is computed and cached by Nx at
`node_modules/.cache/nx-workspace-data/project-graph.json` [10]. Lerna v9
(Sep 2025) removed `lerna bootstrap`, `lerna add`, and `lerna link` entirely.
The interactive graph viewer is `nx graph` [10].

Lerna adds no independent graph functionality. Evaluating Lerna for this use
case is equivalent to evaluating Nx's OSS tier. There is no reason to adopt
Lerna without Nx; Lerna itself has no additional graph API.

**Repurposability verdict:** SAME AS NX — conditional yes within one workspace,
no across repos.

---

### 7. pnpm Workspaces + `pnpm why`

**Claim C-D3-007** [HIGH confidence]: pnpm's graph is package.json-derived and
limited to npm package dependency relationships.

`pnpm why <pkg>` shows the dependency tree for a package and accepts `--json`
for JSON output. The `pnpm list --json` command outputs the full dependency
tree. The community `pnpm-workspace-graph` tool visualizes workspace package
relationships [18].

The graph model is purely `package.json` `dependencies` / `devDependencies`.
Non-package files (skills, agents, YAML configs) cannot be expressed as nodes.
There is no change-propagation query. Cross-repo: not supported — workspace
scope is `pnpm-workspace.yaml` boundaries.

**Repurposability verdict:** NO. Package-graph only; no extensibility for
non-package file nodes.

| Criterion                    | Result                 |
| ---------------------------- | ---------------------- |
| Graph exposed (API/CLI/JSON) | Y — `pnpm list --json` |
| Cross-workspace/cross-repo   | N                      |
| Non-code file support        | N                      |
| Change-propagation query     | N                      |
| Windows + Node.js            | Y                      |
| Solo-dev operational cost    | LOW — already in use   |

---

### 8. madge

**Claim C-D3-008** [MEDIUM confidence]: madge produces a clean programmable JSON
module-dependency graph for JS/TS/CSS files with a Node.js API, but is limited
to static import analysis and is not extensible to non-code files.

madge exposes a Node.js Promise-based API:
`madge(path, opts).then(res => res.obj())`. The `.obj()` call returns a plain
JavaScript object mapping module paths to arrays of dependent module paths — a
direct adjacency list. CLI `--json` flag emits the same structure. Additional
methods: `.circular()`, `.depends(path)`, `.orphans()`, `.leaves()` [19][20].

Supported file types: JavaScript (CJS, AMD, ESM), TypeScript, Sass/Less/Stylus.
No YAML or Markdown support. The `fileExtensions` config extends which file
types are scanned, but dependency extraction relies on Joel Kemp's
`dependency-tree` library which parses import/require statements. Non-code files
have no import syntax — there is no mechanism to inject custom edge logic.

The `dependencyFilter` config function allows filtering edges but not creating
them from scratch for unsupported file types. Windows: pip/npm installable,
works on Windows. Cross-repo: not supported.

**Repurposability verdict:** PARTIAL — the cleanest JSON adjacency-list API of
all candidates for JS/TS code graphs, usable for the "what JS utilities does
this skill depend on?" question. Cannot track a skill YAML or agent markdown as
a node. Could serve as one layer of a hybrid registry (code edges), not the full
registry.

| Criterion                    | Result                                      |
| ---------------------------- | ------------------------------------------- |
| Graph exposed (API/CLI/JSON) | Y — `.obj()` adjacency list, `--json` CLI   |
| Cross-workspace/cross-repo   | N                                           |
| Non-code file support        | N — import-parser-based only                |
| Change-propagation query     | Y — `.depends(path)` returns all dependents |
| Windows + Node.js            | Y                                           |
| Solo-dev operational cost    | VERY LOW — `npm install madge`, zero config |

---

### 9. dep-tree (gabotechs/dep-tree)

**Claim C-D3-009** [MEDIUM confidence]: dep-tree is a file-level dependency
visualization tool for Python, JavaScript/TypeScript, and Rust, without JSON API
or extensibility to non-code files.

dep-tree renders a 3D force-directed graph of file dependencies, an interactive
terminal tree view, and CI validation for dependency constraints [21]. Supported
languages: Python, JS/TS (ES imports), Rust (beta). Windows: installable via
npm/pip, documented Windows support.

There is no JSON output API and no documented extension mechanism for YAML or
markdown. The repository includes a guide for adding new language parsers, but
these must parse import statements — non-code files don't have importable
syntax. dep-tree solves the "visualize code complexity" problem, not the
"register arbitrary workflow files" problem.

**Repurposability verdict:** NO. Visualization-only, no JSON API, not extensible
to non-code assets.

| Criterion                    | Result                              |
| ---------------------------- | ----------------------------------- |
| Graph exposed (API/CLI/JSON) | N — no machine-readable JSON output |
| Cross-workspace/cross-repo   | N                                   |
| Non-code file support        | N                                   |
| Change-propagation query     | N                                   |
| Windows + Node.js            | Y                                   |
| Solo-dev operational cost    | LOW — CLI binary                    |

---

### 10. npm-check-updates / depcheck

**Claim C-D3-010** [HIGH confidence]: These tools are package version auditors,
not dependency graph tools. Not relevant.

`npm-check-updates` upgrades `package.json` versions. `depcheck` detects unused
dependencies. Both produce JSON output but neither models a dependency graph
with traversable edges. Neither supports non-code files as nodes or any
change-propagation query. Not repurposable.

**Repurposability verdict:** OUT OF SCOPE. No graph model at all.

---

## Top-2 Recommendations

### Recommendation 1: Nx Plugin API (within-workspace graph)

Nx's `createNodesV2` / `createDependencies` plugin API is the only tool
evaluated that supports:

- Custom glob patterns matching any file type (`.md`, `.yaml`, `.skill.ts`)
- Typed dependency edges injected between those nodes
- JSON graph export via `nx graph --file graph.json`
- Change-aware affected detection (`nx affected`)
- Node.js native, Windows native, zero Docker

The architectural cost is: you must adopt one workspace root as the canonical
graph host. For JASON-OS, this could be the home `.claude/` directory treated as
an Nx workspace root, with plugins that scan `.claude/skills/**/*.md` and
`.claude/agents/**/*.md`. All project repos could be registered as
`externalNodes`. This is not a turnkey solution — it requires writing 1-2 Nx
plugins and maintaining `nx.json` — but the plugin API is stable and documented.

Cross-repo is blocked (enterprise-only). This recommendation applies to the
single-workspace case.

### Recommendation 2: madge (JS/TS code-edge layer only)

For the specific sub-problem of "which JS/TS scripts does this skill or
automation depend on?", madge's `.obj()` adjacency list is the cleanest
programmable API available. Zero configuration, Node.js native, Windows native,
`npm install` only. It cannot track `.md` or `.yaml` files but can map import
chains within `scripts/` to surface transitive code dependencies.

madge is best used as **one layer** of a hybrid registry: custom JSON metadata
tracks skill/agent portability metadata, and madge traces code dependency edges
for the `.ts`/`.js` implementation files those skills delegate to.

---

## Sources

| #   | URL                                                                   | Title                                         | Type          | Trust  | CRAAP | Date    |
| --- | --------------------------------------------------------------------- | --------------------------------------------- | ------------- | ------ | ----- | ------- |
| 1   | https://bazel.build/query/language                                    | The Bazel Query Reference                     | official-docs | HIGH   | 4.2   | current |
| 2   | https://bazel.build/query/guide                                       | Query guide - Bazel                           | official-docs | HIGH   | 4.2   | current |
| 3   | https://bazel.build/reference/be/general                              | General Rules - Bazel                         | official-docs | HIGH   | 4.2   | current |
| 4   | https://buck2.build/docs/bxl/explanation/basics/                      | BXL Basics - Buck2                            | official-docs | HIGH   | 4.0   | current |
| 5   | https://buck2.build/docs/concepts/buck_query_language/                | Buck Query Language - Buck2                   | official-docs | HIGH   | 4.0   | current |
| 6   | https://github.com/facebook/buck2                                     | Buck2 GitHub repo                             | community     | MEDIUM | 3.8   | 2025    |
| 7   | https://nx.dev/docs/extending-nx/project-graph-plugins                | Extending the Project Graph - Nx              | official-docs | HIGH   | 4.5   | 2025    |
| 8   | https://nx.dev/docs/reference/devkit/CreateNodesV2                    | CreateNodesV2 - Nx                            | official-docs | HIGH   | 4.5   | 2025    |
| 9   | https://nx.dev/docs/reference/devkit/ProjectGraph                     | ProjectGraph - Nx                             | official-docs | HIGH   | 4.5   | 2025    |
| 10  | https://lerna.js.org/docs/features/project-graph                      | Explore the Project Graph - Lerna             | official-docs | HIGH   | 4.3   | 2025    |
| 11  | https://nx.dev/blog/nx-cloud-workspace-graph                          | Nx Cloud Workspace Graph                      | official-blog | HIGH   | 4.0   | 2025    |
| 12  | https://nx.dev/blog/nx-2026-roadmap                                   | Nx 2026 Roadmap                               | official-blog | HIGH   | 4.2   | 2026    |
| 13  | https://turborepo.dev/docs/reference/query                            | turbo query reference                         | official-docs | HIGH   | 4.3   | 2025    |
| 14  | https://turborepo.dev/docs/core-concepts/package-and-task-graph       | Package and Task Graphs - Turborepo           | official-docs | HIGH   | 4.3   | 2025    |
| 15  | https://github.com/vercel/turborepo/issues/11144                      | turbo ls --affected false positive issue      | community     | MEDIUM | 3.5   | 2025    |
| 16  | https://www.pantsbuild.org/dev/docs/using-pants/project-introspection | Project introspection - Pants                 | official-docs | HIGH   | 4.2   | 2025    |
| 17  | https://github.com/pantsbuild/pants/discussions/20242                 | Exporting dependency graph - Pants discussion | community     | MEDIUM | 3.5   | 2024    |
| 18  | https://pnpm.io/cli/why                                               | pnpm why - pnpm                               | official-docs | HIGH   | 4.4   | 2025    |
| 19  | https://github.com/pahen/madge                                        | madge GitHub repo                             | community     | MEDIUM | 4.0   | 2025    |
| 20  | https://www.npmjs.com/package/madge                                   | madge - npm                                   | registry      | MEDIUM | 4.0   | 2025    |
| 21  | https://github.com/gabotechs/dep-tree                                 | dep-tree GitHub repo                          | community     | MEDIUM | 3.5   | 2025    |

---

## Contradictions

None significant. Sources are consistent across tools. One nuance: Buck2
documentation states Windows is tested in CI, but community reports (Hacker
News, GitHub issues) describe "rough edges" for non-Meta users that the official
docs don't surface. Reported at LOW confidence for non-Meta production readiness
[6].

---

## Gaps

1. **Nx plugin with non-code node type — production example not found.** The
   `createNodesV2` API clearly supports arbitrary glob patterns, but no publicly
   available example of a Nx plugin that treats `.yaml` or `.md` files as
   project-graph nodes was found. This is theoretically sound per the API design
   but empirically unverified.

2. **Turborepo file-level query:** The `turbo query --schema` output was not
   fetched; the full GraphQL schema is unknown. It's possible there are
   undocumented file-level query types. LOW probability based on architecture.

3. **dep-tree JSON output:** The documentation reviewed was README-only. The
   full source was not inspected. If dep-tree has undocumented JSON emission
   flags, this evaluation could change.

4. **Pants on WSL2:** The Windows incompatibility for Pants could be resolved
   via WSL2. Not evaluated — that introduces a separate operational layer beyond
   the stated Windows 11 + Node.js constraint.

5. **madge custom `detectiveOptions`:** The depth of extensibility via
   `detectiveOptions` was not fully explored. It may be possible to inject
   custom file parsers via the underlying `dependency-tree` library for YAML
   frontmatter-declared dependencies.

---

## Serendipity

1. **Lerna v9 is essentially dead as an independent tool.** The removal of
   `bootstrap/add/link` in September 2025 leaves Lerna as a thin veneer over Nx.
   Any team on Lerna already has the Nx graph engine. This means the Nx
   recommendation applies to Lerna users at zero additional cost.

2. **Nx Synthetic Monorepo (2026 roadmap) is philosophically aligned with
   JASON-OS portability.** The language in the roadmap — "each repo brings its
   knowledge, together they coordinate" — mirrors exactly what JASON-OS needs.
   The enterprise barrier (Nx Cloud Polygraph) is real now, but the problem is
   recognized and likely to have OSS equivalents emerge.

3. **Turborepo's GraphQL query model (`turbo query`) is the most developer-
   friendly graph API of any tool reviewed.** For a monorepo context,
   `turbo query affected` with machine-readable JSON and typed change reasons
   (`FileChanged`, `DependencyChanged`) is clean enough to inspire the design of
   a custom file-registry query layer, even if Turborepo itself can't be adopted
   directly.

4. **madge's `.depends(path)` method** (which returns all modules that import a
   given module) is exactly the "change in X propagates to what?" query needed
   for portability tracking — but only for the JS/TS code graph. This is a
   usable building block today.

---

## Confidence Assessment

- HIGH claims: 4 (C-D3-003, C-D3-006, C-D3-007, C-D3-010)
- MEDIUM claims: 4 (C-D3-004, C-D3-005, C-D3-008, C-D3-009)
- LOW claims: 2 (C-D3-001, C-D3-002)
- UNVERIFIED claims: 0
- Overall confidence: MEDIUM

The MEDIUM overall rating reflects that Nx's plugin API repurposability is
theoretically well-supported by documentation but empirically unverified for
non-code file node use cases.
