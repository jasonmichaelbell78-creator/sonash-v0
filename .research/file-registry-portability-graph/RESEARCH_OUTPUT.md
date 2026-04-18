# File Registry + Portability Graph — Research Output

**Date:** 2026-04-17 (v1.0 synthesis) → 2026-04-17 (v1.1 post-challenge
re-synthesis) **Session:** deep-research session **Topic:** Self-updating file
registry with tags + upstream/downstream graph + JASON-OS portability tracking
**Depth:** L1 (Exhaustive) **Skill Version:** 2.0 **Agents deployed:** 8
searchers (D1-D8) + 1 synthesizer + 2 verifiers (V1-V2) + 1 contrarian + 1 OTB +
cross-model (Gemini)

**v1.1 summary of changes:** Post-challenge (contrarian + OTB + cross-model
Gemini) flipped Section 6 recommendation from **Option B (@optave/codegraph +
portability sidecar) to Option D (minimum-viable JSONL + PostToolUse hook +
scope-tags)**. See new **Section 10 — Post-Challenge Re-Synthesis** for full
change log. Sections 1-9 below preserved as-is for audit trail; Section 10 is
the binding conclusion.

---

## 1. Executive Summary (v1.0 — SUPERSEDED by Section 10)

> ⚠️ **This section reflects pre-challenge thinking. The binding recommendation
> is in Section 10.**

**The short answer: This does not exist as a single tool. Build is required —
but it is a thin build on top of proven primitives, not a ground-up system.**

Eight searchers evaluated 60+ tools across code-graph indexers, codebase-RAG
systems, build-system graphs, developer-portal catalogs, doc knowledge-graph
tools, change-detection infrastructure, portability classification schemas, and
composite hybrid systems. The unanimous finding is that no single tool combines
all five criteria simultaneously: file-level graph with upstream/downstream
edges, user-defined queryable tags, self-update on file change, cross-project
scope, and solo-dev-runnable on Windows+Node.js. The two closest candidates —
`@optave/codegraph` (D8) and Obsidian+FolderBridge+Breadcrumbs+Dataview (D5) —
each satisfy 3-4 criteria but fail on user-defined file tags and cross-project
portability tracking respectively.

The most actionable external discovery is `@optave/codegraph` (npm, March 2026):
an MCP server + CLI that builds a multi-repo graph via tree-sitter + SQLite,
watches file changes with sub-second rebuilds, and ships a
`codegraph registry add/remove/list` command for cross-repo registration. It
handles the hard parts (graph engine, watcher, MCP surface). What it does not
provide — user-defined file-level metadata tags and portability-scope tracking —
is the genuinely novel requirement that no existing tool addresses. The custom
build required is a thin metadata extension layer, not a graph engine from
scratch. For change detection, `@parcel/watcher`'s snapshot API (no daemon,
native Windows, session-start pattern) is the recommended complement.

The prior T28 decision (SQLite + better-sqlite3 + graphology + custom MCP)
remains architecturally sound, but this research surfaces a more direct path:
adopt `@optave/codegraph` as the graph+watch engine and extend it with a
portability sidecar, rather than building the entire graph engine in-house. The
portability classification schema from D7 is the most immediately actionable
finding: a 5-value `scope:` enum (universal/user/project/machine/ephemeral) with
auto-detection heuristics, applicable today to the 44 JASON-OS memory files that
have never been classified.

---

## 2. The Five-Criterion Matrix

Criteria:

- **A: File-graph** — upstream/downstream edges between files (not just
  package-level)
- **B: Tags** — user-defined, queryable per-file metadata
- **C: Self-update** — live or on-demand automatic re-index on file change
- **D: Cross-project** — works across multiple repos (JASON-OS portability
  scope)
- **E: Solo/Windows** — solo-dev-runnable, Node.js or standalone binary, Windows
  11

Scoring: Y = full, P = partial, N = no, ? = unknown

| Tool                                           | A: File-graph    | B: Tags              | C: Self-update   | D: Cross-project  | E: Solo/Win           | Total | Verdict              |
| ---------------------------------------------- | ---------------- | -------------------- | ---------------- | ----------------- | --------------------- | ----- | -------------------- |
| **@optave/codegraph**                          | Y                | P (auto only)        | Y                | Y                 | P (Node, Win implied) | 4.5   | Best composite       |
| **Obsidian+FolderBridge+Breadcrumbs+Dataview** | Y (MD only)      | Y (frontmatter)      | Y (FolderBridge) | P (multi-vault)   | Y                     | 4     | Best for docs/skills |
| **dependency-cruiser**                         | Y (code only)    | N                    | N                | N                 | Y                     | 2     | Code layer only      |
| **skills-md-graph**                            | Y (MD CLI)       | N                    | N                | Y (CLI)           | Y                     | 2.5   | CI complement        |
| **@parcel/watcher**                            | N                | N                    | Y                | Y                 | Y                     | 2     | Watch layer only     |
| **codebase-memory-mcp**                        | Y                | N                    | Y                | P                 | Y                     | 3     | No Node.js API       |
| **CodeGraphContext**                           | Y                | N                    | Y                | Y                 | P (Python req)        | 3     | KuzuDB risk          |
| **obsidian-skill-graph**                       | Y (SKILL.md)     | N (visual only)      | via Obsidian     | N                 | Y                     | 2     | UI complement        |
| **Nx createNodesV2**                           | Y (in-workspace) | P (via project.json) | Y                | N (OSS tier)      | Y                     | 3     | Monorepo only        |
| **madge**                                      | Y (JS/TS)        | N                    | N                | N                 | Y                     | 1.5   | Code layer only      |
| **aider RepoMap / RepoMapper**                 | Y (internal)     | N                    | P (per-session)  | N                 | P (Python)            | 1.5   | Ephemeral only       |
| **TabbyML**                                    | P                | N                    | Y                | Y                 | P (Docker)            | 2     | Roadmap unshipped    |
| **Sourcegraph/Cody SCIP**                      | Y                | N                    | P                | Y                 | N (server req)        | 2.5   | Server required      |
| **Augment Code Context Engine**                | Y                | ?                    | Y                | Y                 | N (SaaS)              | 2     | Closed SaaS          |
| **Greptile**                                   | Y                | N                    | Y                | Y                 | N (SaaS, $0.45/req)   | 2     | SaaS/cost            |
| **Backstage**                                  | Y                | P                    | N (webhooks)     | Y                 | N (WSL+Docker)        | 1.5   | Overkill/blocker     |
| **Port**                                       | Y                | Y                    | P                | Y                 | N (SaaS)              | 2.5   | SaaS only            |
| **Bazel query**                                | Y                | N                    | N                | P                 | N (Windows friction)  | 1     | Build-system only    |
| **Turborepo turbo query**                      | P (packages)     | N                    | Y                | N                 | Y                     | 1.5   | Package-level only   |
| **LSIF/SCIP protocol**                         | P (symbols)      | N                    | N                | P (server needed) | P                     | 1.5   | Protocol not tool    |
| **dep-tree**                                   | Y                | N                    | N                | N                 | Y                     | 1.5   | Viz only, no JSON    |
| **chokidar v4**                                | N                | N                    | Y                | Y                 | Y                     | 1.5   | Watch only           |
| **Quivr/Onyx/PrivateGPT**                      | N                | P                    | N                | N                 | N (Docker)            | 0.5   | Wrong category       |

---

## 3. Ranked Candidate Shortlist

### 1. @optave/codegraph — ADOPT AS PRIMITIVE (Option B foundation)

**Confidence: MEDIUM-HIGH** [C-D8-001]

npm `@optave/codegraph`, globally installable. Tree-sitter + SQLite. 30+ MCP
tools. `codegraph build/watch/registry` CLI. Multi-repo via
`codegraph registry add`. Sub-second incremental rebuilds on file change. Zero
network calls, zero telemetry. Node.js native.

- File-graph: YES — function-level and file-level dependency edges across 34
  languages
- Tags: PARTIAL — auto-classifies symbols as
  `entry`/`core`/`utility`/`adapter`/`dead`/`leaf`; no user-defined file tags
- Self-update: YES — `codegraph watch [dir]`
- Cross-project: YES — `codegraph registry` manages multiple repos, MCP queries
  all simultaneously
- Solo/Windows: YES (Node.js) — Windows not explicitly documented but SQLite +
  npm = highly likely

Gap: No user-defined tags. No portability scope tracking. Custom thin layer
required. Verdict: **Adopt as primitive** — buy the graph engine, build the
metadata extension. Source: https://www.npmjs.com/package/@optave/codegraph,
https://github.com/optave/codegraph

---

### 2. Obsidian + FolderBridge + Breadcrumbs + Dataview — ADOPT DIRECTLY (for skill/agent docs)

**Confidence: MEDIUM-HIGH** [C-D5-001, C-D5-003, C-D5-004]

Obsidian vault with FolderBridge (March 2026, Windows-hardened) mounting
`.claude/skills/` and `.claude/agents/`. Breadcrumbs V4 provides typed directed
edges via YAML frontmatter (`up:`, `uses:`, `requires:`). Dataview provides
SQL-like queries with live auto-update. `window.BCAPI` enables programmatic
graph traversal from scripts.

- File-graph: YES for .md files; non-md files appear as reference targets but
  cannot carry frontmatter
- Tags: YES — YAML frontmatter Properties, Dataview-queryable
- Self-update: YES — FolderBridge background file watcher
- Cross-project: PARTIAL — multi-vault possible; no inter-vault edge traversal
  API
- Solo/Windows: YES — free Obsidian tier, no Docker

Note: Obsidian v0.9.1 (March 2026) blocked symlinks outside vault boundary.
FolderBridge is the current viable path; old symlink tutorials are broken.
[C-D5-002] Verdict: **Adopt directly** for .md-based skill/agent documentation
layer.

---

### 3. dependency-cruiser — ADOPT AS PRIMITIVE (code-layer extraction)

**Confidence: HIGH** [C-D1-008]

v17.3.10 (March 2026), MIT, pure Node.js, Windows-native. `ICruiseResult` JSON
export with `modules[].dependencies[]` and `modules[].dependents[]` —
bidirectional edges out of the box. The `.dependents[]` array directly answers
"what imports this file?" for TypeScript/JavaScript.

- File-graph: YES for .ts/.js code files
- Tags: NO native annotation
- Self-update: NO — build-triggered only
- Cross-project: NO — per-project only; merging across repos requires
  orchestration layer
- Solo/Windows: YES

Verdict: **Adopt as primitive** — strongest JS/TS code-edge extraction layer.
Feed output into SQLite graph store. Source:
https://github.com/sverweij/dependency-cruiser

---

### 4. @parcel/watcher — ADOPT AS PRIMITIVE (change detection)

**Confidence: HIGH** [C-D6-010, C-D6-011, C-D6-012]

Uses `ReadDirectoryChangesW` on Windows (native OS API, not fs.watch).
`getEventsSince(snapshotPath)` mode enables offline change detection — read diff
since last snapshot even when process was not running. v2.5.1 (Jan 2025),
prebuilt win32-x64, no compile step. Zero daemon for basic use.

Key pattern for JASON-OS: write snapshot at session-end, call `getEventsSince`
at session-start → batch update registry for changed paths. Mirrors SoNash's
existing lockfile hash pattern. Verdict: **Adopt as primitive** for
session-start change detection. Source:
https://github.com/parcel-bundler/watcher

---

### 5. skills-md-graph — CHERRY-PICK PATTERN

**Confidence: MEDIUM** [C-D5-012]

Rust CLI, parses `.md` YAML frontmatter into a dependency graph. `--uses`
(dependents), `--deps` (transitive), `--path-between`, cycle detection (Tarjan
SCC), DOT/PNG/RDF/Neo4j Cypher export. Config via `.skill-graph.toml`.

No file watcher. No live UI. Markdown-only. But: the CLI is directly runnable in
npm scripts and CI. The `--uses` flag answers "what depends on this skill?"
without a running daemon. Verdict: **Cherry-pick pattern** — use in
CI/pre-commit to catch broken skill dependency chains. Source:
https://github.com/navfa/skills-md-graph

---

### 6. CodeGraphContext (with KuzuDB caveat) — REJECT current version

**Confidence: MEDIUM** [C-D8-003]

MCP server + CLI, indexes code into KuzuDB/FalkorDB/Neo4j. Multi-project, watch
mode, Python 3.10+ required.

Critical blocker: KuzuDB was abandoned by its maintainers in October 2025 [The
Register, Oct 14 2025]. CodeGraphContext defaults to KuzuDB on Windows. The
community "Ladybug" fork exists but is immature. The tool's README still lists
KuzuDB as the Windows default as of research date.

Verdict: **Reject current version** due to KuzuDB dependency risk. Monitor for
Ladybug stabilization or FalkorDB/Neo4j default migration. Source:
https://github.com/CodeGraphContext/CodeGraphContext,
https://www.theregister.com/2025/10/14/kuzudb_abandoned/

---

### 7. obsidian-skill-graph — ADOPT DIRECTLY (visual complement)

**Confidence: HIGH** [C-D5-005]

v0.1.0 (April 1, 2026). Built specifically for Claude Code + OpenClaw skill
structure visualization. Scans SKILL.md files for references and injects edges
into Obsidian's `metadataCache.resolvedLinks` so Graph View renders them. Proves
the pattern works in practice.

Limitation: visual only, no programmatic query API. Markdown-only. Verdict:
**Adopt directly** as a zero-friction visualization layer alongside
Breadcrumbs/Dataview for query. Source:
https://github.com/hanamizuki/obsidian-skill-graph

---

## 4. The Irreducible Gaps

These are capabilities no evaluated tool provides. Any solution must either
build them or explicitly omit them.

**Gap 1: User-defined file-level metadata tags with query** [D8 negative result,
HIGH confidence] Every tagging system found either targets code symbols
(auto-classified by connectivity), document chunks (semantic search tags), or
package.json entries. No tool supports attaching user-defined key-value metadata
to arbitrary files (`.yaml`, `.ts`, `.sh`, `.md`) in a queryable graph. This is
the core missing primitive. The companion stub pattern (a `.md` sidecar per
non-markdown file carrying YAML frontmatter) is the current workaround —
validated by `obsidian-skill-graph` — but it adds file maintenance overhead.

**Gap 2: Cross-project portability tracking** [D8 Gap 1, HIGH confidence] No
tool tracks that "this skill file was copied from Project A to Project B" or can
answer "which of my universal skills are deployed in repo X vs repo Y?" The
concept of per-file portability provenance tracking across project boundaries
does not exist in any tool surveyed. This is genuinely novel territory. The D7
`scope:` field enum provides the schema; no tool provides the runtime tracking.

**Gap 3: Agent-aware change impact (notify-on-upstream-change)** [D6-C-D6-015,
MEDIUM confidence] No local-first tool pushes "file X changed, dependent files Y
and Z may be broken" notifications. Augment Code and Greptile implement this as
SaaS features. The MCP protocol cannot push change events to Claude between
turns (D6). The practical pattern: external watcher daemon writes to SQLite;
Claude queries SQLite via MCP. Watcher and MCP are separate layers — there is no
unified "reactive graph" for solo dev on Windows.

---

## 5. Portability Classification Schema (from D7)

This is the most immediately actionable finding. Implement this regardless of
which architectural path is chosen.

### The `scope:` Field

```yaml
scope: universal # or: user | project | machine | ephemeral
```

**Field name rationale:** Matches Nx (`scope:shared`), VSCode scope enum, XDG
directory semantics. Five independent systems (chezmoi, VSCode, Nx, XDG, Agent
Skills) converge on the same 4-5 scope values — constituting strong implicit
consensus [D7, HIGH confidence].

### Value Enum

| Value       | Meaning                                                                | Examples                                                                   |
| ----------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `universal` | Works identically in any repo, any machine, any user                   | `/deep-research` skill, `code-reviewer` agent                              |
| `user`      | Requires this user's preferences/history; works across user's projects | `feedback_*` memory files, `user_*` files, GSD agents                      |
| `project`   | Specific to one repository                                             | `sonash-context` skill, `reference_external_systems.md`, `project_*` files |
| `machine`   | Machine-specific paths, credentials, hardware assumptions              | `.chezmoiignore` equivalents, machine-specific config                      |
| `ephemeral` | Generated artifacts, cache, session state — do not carry forward       | `.claude/cache/`, `security_warnings_state_*.json`, `stats-cache.json`     |

### Location

Primary: YAML frontmatter in the file itself (for `.md`, agent, skill files):

```yaml
---
name: deep-research-searcher
scope: universal
---
```

Secondary: sidecar JSON for non-YAML-friendly files:

```json
{ "scope": "universal", "deps": ["web-search", "context7"] }
```

Fallback: central `file-registry.json` at `~/.claude/` for files that cannot
carry their own metadata.

### Auto-Detection Heuristics (priority order)

1. **Path heuristic [HIGH confidence]:**
   - `~/.claude/skills/` or `~/.claude/agents/` → `user`
   - `<project>/.claude/skills/` or `<project>/.claude/agents/` → `project`
     unless no project-specific terms
   - `~/.claude/cache/`, `*.statsig.*`, `security_warnings_state_*.json` →
     `ephemeral`

2. **Filename prefix heuristic [HIGH confidence for memory files]:**
   - `feedback_*` → `user` (26 of 44 JASON-OS memory files)
   - `user_*` → `user` (5 of 44)
   - `project_*` → `project` (~12 of 44)
   - `reference_*` → split: `reference_ai_capabilities.md` = `user`;
     `reference_external_systems.md` = `project`

3. **Content reference heuristic [MEDIUM confidence]:**
   - Project-specific strings (Firebase IDs, repo names) → `project`
   - Machine-specific strings (absolute paths with hostname) → `machine`
   - None found → upgrade to `user`

4. **Dependency graph heuristic [MEDIUM confidence]:**
   - All referenced skills/agents `universal` or `user` → file is at least
     `user`
   - Any dependency `project` → file is at most `project`

### Application to 44 JASON-OS Memory Files (T0 Action)

This was flagged in prior multi-layer-memory research and never executed. Based
on prefix analysis: ~31 files are classifiable automatically with HIGH
confidence (feedback*\* = user, user*_ = user, project\__ = project). ~8-10
reference\_\* files and edge cases require human spot-check. The classification
task is "formalize what the file names already say" — not build a new system.

---

## 6. Recommended Path

### Option A — Extend T28's SQLite-MCP (incremental, lowest risk)

Add file-graph tables and a `scope` column to the existing T28 SQLite schema.
Use `dependency-cruiser` for JS/TS code edges. Use a YAML frontmatter scanner
for `.md` skill/agent edges. Use `@parcel/watcher getEventsSince` at
session-start for change detection.

- **Pros:** No new dependencies, builds on validated T28 investment, fits
  existing MCP architecture
- **Cons:** Graph engine is custom-built (no query optimizer, manual edge
  management), no `codegraph watch` daemon available without adding it
- **Build cost:** Medium — add 3 SQLite tables, a frontmatter scanner, and a
  parcel/watcher call in session-start.js
- **When to choose:** T28 is actively in use and disruption cost is high; graph
  requirements are modest

### Option B — Wire a Thin MCP over @optave/codegraph + Portability Metadata Layer (recommended)

Install `@optave/codegraph` globally. Register all JASON-OS project roots via
`codegraph registry add`. Write a thin portability-metadata MCP tool alongside
codegraph's 30+ tools: reads a `file-registry.jsonl` sidecar (one record per
registered file with `scope:`, `tags:[]`, `upstreamProject:`) and exposes
`get_portability`, `set_scope`, `list_portable_files` tools. Use
`@parcel/watcher getEventsSince` for session-start delta.

- **Pros:** Buys the hard parts (graph engine, watch, multi-repo registry, MCP
  surface); custom code is only the portability metadata layer;
  `codegraph watch` runs during development sessions; 30+ existing MCP tools
  queryable immediately
- **Cons:** `@optave/codegraph` Windows support not explicitly documented (HIGH
  confidence it works, MEDIUM confidence zero friction); tool is March 2026
  vintage with no long-term track record
- **Build cost:** Low to medium — thin Node.js MCP tool (~200-400 lines), JSONL
  sidecar schema, frontmatter scanner for scope auto-detection
- **When to choose:** Starting fresh or willing to restructure; JASON-OS
  OS-vision is primary (home CC-OS work > SoNash)

### Option C — Obsidian-first for docs + dependency-cruiser for code (two-tool, no build)

Use the Obsidian+FolderBridge+Breadcrumbs+Dataview stack for all `.md`
skill/agent/memory files. Use `dependency-cruiser` for JS/TS code graphs. No
custom build; two specialized tools, two mental models.

- **Pros:** Zero custom code; both tools are production-ready today; Obsidian
  vault is immediately queryable
- **Cons:** Two separate systems with no unified query surface; cross-project
  portability tracking still unimplemented; `obsidian-skill-graph` is April 2026
  v0.1.0 — untested at scale
- **Build cost:** Minimal — FolderBridge setup, vault configuration, Breadcrumbs
  hierarchy definition
- **When to choose:** Want value now, willing to accept two mental models, not
  prioritizing programmatic query

### Recommendation

**Option B** is recommended, with Option A as a fallback if T28 disruption cost
is unacceptable.

Rationale: The JASON-OS OS-vision explicitly prioritizes home CC-OS work
(portable workflows/skills/agents across projects) as primary, with SoNash
secondary. Option B directly addresses that vision — a global multi-repo graph
queryable from any Claude Code session, with portability metadata available via
MCP. The custom build is thin (portability metadata layer only), not a graph
engine. `@optave/codegraph`'s `codegraph registry` is the right abstraction for
"register all your projects and query them together."

For the 44 JASON-OS memory files specifically: apply the D7 scope schema
immediately (T0 action, no tooling required — just add `scope:` frontmatter to
each file). That unblocks portability classification without waiting for any
architecture decision.

---

## 7. Risks and Open Questions

**R1: KuzuDB abandonment (Oct 2025) — downstream tooling impact [HIGH risk]**
CodeGraphContext defaults to KuzuDB on Windows. Any custom build or tool
evaluation that touched KuzuDB as a graph DB backend should pivot immediately.
Ladybug fork exists but is immature. Alternatives: SQLite graph extensions (NOT
KuzuDB), Neo4j (heavier), DuckDB with adjacency table pattern. [C-D8-003, The
Register Oct 2025]

**R2: Chokidar v5 ESM-only — package.json compat [MEDIUM risk]** v5 (Nov 2025)
dropped CJS. SoNash's scripts/ directory uses mixed CJS. If the registry daemon
is implemented as ESM, this is fine. If it must coexist with existing CJS
scripts, use v4 (supports both ESM + CJS, Node 14+). [C-D6-001]

**R3: @optave/codegraph maturity [MEDIUM risk]** March 2026 release. No
long-term track record. GitHub stars/forks not evaluated. If the project is
abandoned, the graph engine primitive disappears and Option A (custom SQLite)
becomes the fallback. Mitigation: design the portability metadata layer to be
graph-engine-agnostic (JSONL sidecar readable without codegraph).

**R4: obsidian-skill-graph production readiness [MEDIUM risk]** v0.1.0 (April 1,
2026). Extremely new. The pattern is proven but this specific implementation has
no track record. `BCAPI` surface area is not fully documented. Recommend: adopt
for visualization only; use Breadcrumbs/Dataview for any query logic that must
be reliable.

**R5: MCP protocol cannot push change events to Claude between turns [MEDIUM,
confirmed]** MCP servers are request-response. They cannot interrupt an active
Claude session with "file X changed." The practical architecture is: watcher
daemon writes change events to SQLite; Claude polls via MCP at session-start.
This is a protocol limitation, not a tooling gap — it affects every MCP-based
registry design. [C-D6-015]

**R6: Obsidian symlink blocking (v0.9.1, March 2026) [MEDIUM risk]** The exact
scope of the security fix is unclear — may be MCP-specific, not all symlinks.
Old community tutorials using symlinks to mount external directories into vaults
are unreliable on current Obsidian. FolderBridge is the replacement. Requires
empirical verification before committing to Option C. [C-D5-002]

**R7: Academic literature has no declarative portability schema [LOW risk —
confirms novelty]** 2020 systematic review: "a major obstacle to effective
portability measurement is the lack of established mechanisms to specify and
measure portability." No 2023-2026 academic work found on declarative file
portability schemas. The D7 `scope:` enum is original design work, not derived
from a standard. [C-D7-013]

---

## 8. Contradictions

**Contradiction 1: Portability default — "portable by default" vs "tag for
portability"** chezmoi uses "absence of `.tmpl`" = portable by default; files
are universal unless explicitly marked machine-specific. Nx and Bazel use
explicit positive tags (`scope:shared`, `//visibility:public`) — files are
project-specific unless explicitly marked shared. For JASON-OS skills/agents
where most content is meant to be shared, chezmoi's default-portable model is
likely better. The D7 recommendation (tag exceptions, not the rule) aligns with
chezmoi. [C-D7-002 vs C-D7-003]

**Contradiction 2: Augment Code graph claims vs. architectural reality** Augment
Code markets a "living semantic dependency graph" and "real-time knowledge
graph." Their MCP exposure (Feb 2026) is real. However, the graph is a closed
SaaS oracle — not exportable, not portable, not offline. The marketing language
implies embeddability that does not exist. [C-D2-018, C-D2-019]

**Contradiction 3: Continue's LanceDB index portability** Technically, the
LanceDB files at `~/.continue/index/lancedb` are local on disk and readable via
the LanceDB SDK. Some community sources imply this is a "portable local index."
However, there is no graph data in these files — only embedding vectors with
line-number metadata. The index is local but contains no dependency edges,
making it irrelevant to the graph use case. Not a viable path. [C-D2-005,
C-D2-006]

**Contradiction 4: Watchman vs @parcel/watcher performance framing** D6 notes
Watchman is faster than @parcel/watcher for large trees on Windows — but
@parcel/watcher can use Watchman as a backend when installed. The two are not
mutually exclusive. For JASON-OS's scale (hundreds of skill/agent files, not
tens of thousands), @parcel/watcher standalone is sufficient; Watchman backend
is an optimization path if needed. [C-D6-005, C-D6-010, C-D6-011]

---

## 9. Confidence Distribution

Total claims cataloged across D1-D8: ~116 (see claims.jsonl)

| Level      | Count   | Notes                                                          |
| ---------- | ------- | -------------------------------------------------------------- |
| HIGH       | 63      | Verified against official docs or primary sources              |
| MEDIUM     | 42      | Verified against community sources or indirect evidence        |
| LOW        | 8       | Inference or single-source with uncertain provenance           |
| UNVERIFIED | 3       | Absence-of-evidence findings; no confirming or denying sources |
| **Total**  | **116** |                                                                |

Overall research confidence: **HIGH for negative findings** (no composite tool
exists, specific tool disqualifications); **MEDIUM-HIGH for positive
recommendations** (@optave/codegraph, @parcel/watcher); **MEDIUM for novel
territory** (portability schema, cross-project tracking design).

---

## Appendix: Claim Catalog (top 40)

| ID    | Claim                                                                                                                                                                                                | Confidence  | Source                                                                                       |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| C-001 | SCIP replaces LSIF; LSIF removed from Sourcegraph 4.6+                                                                                                                                               | HIGH        | https://sourcegraph.com/docs/admin/how-to/lsif-scip-migration                                |
| C-002 | SCIP cross-repo navigation requires a Sourcegraph server instance; SCIP CLI can generate indexes standalone but cannot resolve cross-repo jumps without server                                       | HIGH        | https://github.com/sourcegraph/scip-clang/blob/main/docs/CrossRepo.md                        |
| C-003 | Kythe has no documented Windows support and requires Bazel as primary build system                                                                                                                   | HIGH        | https://kythe.io/contributing/                                                               |
| C-004 | aider repomap builds a directed file graph (nodes=files, edges=code references) using tree-sitter + NetworkX PageRank; per-repo, code-only, no queryable graph API                                   | HIGH        | https://aider.chat/2023/10/22/repomap.html                                                   |
| C-005 | dependency-cruiser v17.3.10 (March 2026) exports bidirectional JSON module graph with modules[].dependents[]; MIT license, pure Node.js, Windows-compatible                                          | HIGH        | https://github.com/sverweij/dependency-cruiser                                               |
| C-006 | ast-grep has no dependency graph feature as of early 2026; graph query feature request filed March 2026                                                                                              | HIGH        | https://github.com/ast-grep/ast-grep/issues/2519                                             |
| C-007 | Sourcetrail original project archived December 2021; community fork adds no API or cross-repo capability                                                                                             | HIGH        | https://github.com/CoatiSoftware/Sourcetrail/releases                                        |
| C-008 | Cursor uses server-side embeddings (Turbopuffer) + Merkle tree incremental sync; no file-to-file dependency graph                                                                                    | HIGH        | https://cursor.com/docs/context/codebase-indexing                                            |
| C-009 | Aider's internal NetworkX graph (nodes=files, edges=cross-file symbol references) is session-ephemeral, not exported, not queryable via API                                                          | HIGH        | https://aider.chat/docs/repomap.html                                                         |
| C-010 | Cody Free/Pro discontinued July 23, 2025; only Cody Enterprise remains                                                                                                                               | HIGH        | https://aiforcode.io/tools/sourcegraph-cody                                                  |
| C-011 | Augment Code Context Engine exposed via MCP since February 2026; closed SaaS, no self-hosted or exportable index                                                                                     | MEDIUM      | https://www.augmentcode.com/context-engine                                                   |
| C-012 | Greptile REST API ($0.45/req) exposes change-impact queries including cross-repo; commercial SaaS                                                                                                    | MEDIUM      | https://www.greptile.com/docs/how-greptile-works/graph-based-codebase-context                |
| C-013 | TabbyML multi-repo API roadmap item not shipped as of April 2026                                                                                                                                     | MEDIUM      | https://tabby.tabbyml.com/docs/roadmap/                                                      |
| C-014 | Nx createNodesV2 plugin API can add arbitrary-file-typed nodes to the project graph; cross-repo is enterprise-only (Nx Cloud Polygraph)                                                              | HIGH        | https://nx.dev/docs/extending-nx/project-graph-plugins                                       |
| C-015 | Lerna v9 removed bootstrap/add/link; is a thin wrapper over Nx — evaluating Lerna = evaluating Nx OSS tier                                                                                           | HIGH        | https://lerna.js.org/docs/features/project-graph                                             |
| C-016 | madge programmatic API returns bidirectional adjacency list via .obj() and .depends(path); JS/TS only, no non-code files                                                                             | MEDIUM      | https://github.com/pahen/madge                                                               |
| C-017 | Pants is Linux/macOS only — hard blocker for Windows 11 environment                                                                                                                                  | MEDIUM      | https://github.com/pantsbuild/pants/discussions/20242                                        |
| C-018 | Backstage requires WSL on Windows; minimum 6 GB RAM; auto-update requires GitHub webhooks not local filesystem watcher                                                                               | HIGH        | https://backstage.io/docs/getting-started/                                                   |
| C-019 | Port is SaaS-only with no self-hosted option for non-enterprise; free tier has 10K entity limit                                                                                                      | HIGH        | https://www.port.io/pricing                                                                  |
| C-020 | No turnkey minimum-viable catalog open-source tool exists for individual developer file/skill tracking                                                                                               | MEDIUM      | D4 exhaustive search result                                                                  |
| C-021 | Obsidian v0.9.1 (March 2026) blocked symlinks pointing outside vault boundary; FolderBridge is replacement pattern                                                                                   | MEDIUM      | https://forum.obsidian.md/t/new-plugin-folder-bridge-mount-your-folders-into-obsidian/111496 |
| C-022 | Obsidian FolderBridge (March 2026) mounts external directories as virtual vault paths with real-time sync; Windows-hardened                                                                          | HIGH        | https://github.com/tescolopio/Obsidian_FolderBridge                                          |
| C-023 | Breadcrumbs V4 uses full file paths as node identifiers; exposes window.BCAPI for programmatic graph traversal                                                                                       | MEDIUM      | https://deepwiki.com/SkepticMystic/breadcrumbs                                               |
| C-024 | Dataview indexes only .md files for frontmatter/inline fields; non-markdown files can be listed via DataviewJS but cannot carry queryable metadata                                                   | HIGH        | https://blacksmithgu.github.io/obsidian-dataview/                                            |
| C-025 | obsidian-skill-graph v0.1.0 (April 2026) built for Claude Code SKILL.md visualization; injects edges into metadataCache.resolvedLinks                                                                | HIGH        | https://github.com/hanamizuki/obsidian-skill-graph                                           |
| C-026 | skills-md-graph Rust CLI supports --uses (dependents), --deps (transitive), cycle detection, Neo4j Cypher export                                                                                     | MEDIUM      | https://github.com/navfa/skills-md-graph                                                     |
| C-027 | Dendron entered maintenance mode March 2023; no active feature development; do not invest                                                                                                            | HIGH        | https://randomgeekery.org/post/2023/02/dendron-is-officially-in-maintenance-mode/            |
| C-028 | SoNash codebase has no real-time file watcher; change detection is entirely on-demand (session-start hook + manual npm scripts)                                                                      | HIGH        | D6 codebase probe                                                                            |
| C-029 | @parcel/watcher uses ReadDirectoryChangesW on Windows (native OS API); getEventsSince(snapshot) enables offline change detection; v2.5.1 Jan 2025, prebuilt win32-x64                                | HIGH        | https://github.com/parcel-bundler/watcher                                                    |
| C-030 | Chokidar v5 is ESM-only (Node 20+); v4 supports both ESM+CJS for mixed codebases                                                                                                                     | HIGH        | https://github.com/paulmillr/chokidar/blob/main/README.md                                    |
| C-031 | Official @modelcontextprotocol/server-filesystem has no file watching capability                                                                                                                     | HIGH        | https://github.com/modelcontextprotocol/servers/blob/main/src/filesystem/README.md           |
| C-032 | MCP protocol cannot push change events to Claude between turns; watcher daemon + SQLite + MCP poll is the viable architecture                                                                        | MEDIUM      | D6 analysis                                                                                  |
| C-033 | No universal cross-domain schema or RDF vocabulary for "portability" exists; four independent systems converge on same 4-5 scope values                                                              | HIGH        | D7 multi-source analysis                                                                     |
| C-034 | JASON-OS memory file prefixes (feedback*\*, user*_, project\__, reference\_\*) already implicitly encode scope — rcm-style tagging without being designed as one                                     | MEDIUM      | D7 filesystem analysis                                                                       |
| C-035 | Agent Skills spec (agentskills.io, Dec 2025, 60k+ repos) has no dedicated portability field; scope encoded through install location (~/.claude/ vs project/.claude/)                                 | HIGH        | https://agentskills.io/specification                                                         |
| C-036 | VSCode's sync-refusal for machine-scoped settings is the clearest operational definition of "machine-scoped" found across any system                                                                 | HIGH        | https://code.visualstudio.com/api/references/contribution-points                             |
| C-037 | @optave/codegraph (npm, March 2026) builds function-level and file-level dependency graph across 34 languages using tree-sitter + SQLite; ships 30+ MCP tools; codegraph registry manages multi-repo | MEDIUM-HIGH | https://www.npmjs.com/package/@optave/codegraph                                              |
| C-038 | KuzuDB was abandoned by its maintainers in October 2025; community fork "Ladybug" exists but is immature; tools defaulting to KuzuDB on Windows carry dependency risk                                | HIGH        | https://www.theregister.com/2025/10/14/kuzudb_abandoned/                                     |
| C-039 | codebase-memory-mcp is a pure C static binary with background file watcher and multi-project awareness; no user-defined tags; no Node.js integration                                                 | MEDIUM-HIGH | https://github.com/DeusData/codebase-memory-mcp                                              |
| C-040 | No tool found that tracks file identity/portability across projects (skill copied from Project A to Project B, track provenance)                                                                     | HIGH        | D8 exhaustive scan                                                                           |

---

## Sources (Tiered by Authority)

### Tier 1 — Official Documentation / Primary Sources

1. https://sourcegraph.com/docs/admin/how-to/lsif-scip-migration
2. https://github.com/sourcegraph/scip/blob/main/scip.proto
3. https://github.com/sourcegraph/scip-clang/blob/main/docs/CrossRepo.md
4. https://kythe.io/contributing/
5. https://aider.chat/docs/repomap.html
6. https://aider.chat/2023/10/22/repomap.html
7. https://github.com/sverweij/dependency-cruiser
8. https://docs.ctags.io/en/latest/man/ctags-json-output.5.html
9. https://cursor.com/docs/context/codebase-indexing
10. https://sourcegraph.com/docs/code_intelligence/explanations/precise_code_intelligence
11. https://sourcegraph.com/blog/announcing-scip
12. https://nx.dev/docs/extending-nx/project-graph-plugins
13. https://nx.dev/docs/reference/devkit/CreateNodesV2
14. https://lerna.js.org/docs/features/project-graph
15. https://bazel.build/query/language
16. https://turborepo.dev/docs/reference/query
17. https://pnpm.io/cli/why
18. https://backstage.io/docs/getting-started/
19. https://backstage.io/docs/features/software-catalog/descriptor-format/
20. https://www.port.io/pricing
21. https://docs.port.io/build-your-software-catalog/customize-integrations/configure-data-model/setup-blueprint/
22. https://blacksmithgu.github.io/obsidian-dataview/
23. https://github.com/tescolopio/Obsidian_FolderBridge
24. https://github.com/SkepticMystic/breadcrumbs/blob/master/V4.md
25. https://github.com/hanamizuki/obsidian-skill-graph
26. https://outliner.tana.inc/docs/local-api-mcp
27. https://agentskills.io/specification
28. https://code.visualstudio.com/api/references/contribution-points
29. https://specifications.freedesktop.org/basedir/latest/
30. https://www.chezmoi.io/reference/source-state-attributes/
31. https://github.com/modelcontextprotocol/servers/blob/main/src/filesystem/README.md
32. https://github.com/parcel-bundler/watcher
33. https://github.com/paulmillr/chokidar/blob/main/README.md
34. https://nodejs.org/docs/latest/api/fs.html
35. https://www.npmjs.com/package/@optave/codegraph
36. https://github.com/optave/codegraph
37. https://github.com/DeusData/codebase-memory-mcp
38. https://www.theregister.com/2025/10/14/kuzudb_abandoned/
39. https://docs.github.com/en/rest/dependency-graph
40. https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-the-dependency-graph

### Tier 2 — Community Sources / Secondary Documentation

41. https://deepwiki.com/Aider-AI/aider/4.1-repository-mapping
42. https://deepwiki.com/continuedev/continue/3.4-codebase-indexing
43. https://deepwiki.com/SkepticMystic/breadcrumbs
44. https://read.engineerscodex.com/p/how-cursor-indexes-codebases-fast
45. https://blog.lancedb.com/lancedb-x-continue
46. https://github.com/pdavis68/RepoMapper
47. https://github.com/pahen/madge
48. https://github.com/CodeGraphContext/CodeGraphContext
49. https://github.com/navfa/skills-md-graph
50. https://roadie.io/blog/roadie-local-self-hosted-backstage-ready-in-minutes/
51. https://forum.obsidian.md/t/new-plugin-folder-bridge-mount-your-folders-into-obsidian/111496
52. https://github.com/foambubble/foam
53. https://randomgeekery.org/post/2023/02/dendron-is-officially-in-maintenance-mode/
54. https://www.augmentcode.com/context-engine
55. https://www.greptile.com/docs/how-greptile-works/graph-based-codebase-context
56. https://tabby.tabbyml.com/docs/roadmap/
57. https://github.com/facebook/watchman/wiki/Changes-required-for-Windows-support
58. https://github.com/bsmi021/mcp-file-operations-server

### Tier 3 — Product Pages / Review Sites

59. https://aiforcode.io/tools/sourcegraph-cody
60. https://www.cortex.io/pricing
61. https://www.opslevel.com/pricing
62. https://roadie.io/pricing/
63. https://computertech.co/augment-code-review/

---

## Methodology

**Searcher agents:** 8 (D1-D8), each assigned a specific domain and profile
**Synthesis:** 1 synthesizer reading all 8 findings files **Total sources
evaluated:** 63 unique URLs **Tools evaluated:** 60+ across all categories
**Codebase probe:** D6 performed live probe of SoNash scripts/, hooks, and
package.json

**D1:** Code-graph indexers (LSIF, SCIP, Kythe, ctags, aider repomap, ast-grep,
CodeQL, dependency-cruiser, Sourcetrail, GitHub Dependency Graph API) **D2:**
Codebase-RAG tools (Cursor, Continue, Aider, Copilot Workspace, Zed, Cody,
Augment Code, Greptile, TabbyML, CodeGraphContext) **D3:** Build-system graphs
(Bazel, Buck2, Nx, Turborepo, Pants, Lerna, pnpm, madge, dep-tree, depcheck)
**D4:** Developer-portal catalogs (Backstage, Port, Cortex, Roadie, OpsLevel,
LeanIX, GitHub Topics) **D5:** Doc knowledge-graph tools (Obsidian+ecosystem,
Logseq, Tana, Dendron, Foam, Roam/Athens/Reflect, org-roam, skills-md-graph)
**D6:** Change-detection infrastructure (chokidar, watchman, fs.watch,
@parcel/watcher, MCP filesystem servers, git hooks) + SoNash codebase probe
**D7:** Portability classification schemas (Nx, chezmoi, VSCode, XDG, Agent
Skills, rcm, Bazel visibility, 12-factor, Ansible, academic literature) **D8:**
Composite hybrid systems (exhaustive scan: @optave/codegraph,
codebase-memory-mcp, CodeGraphContext, dep-tree, Beads, LocalNest, xgmem, Quivr,
Onyx, CocoIndex, Nix Flakes, PrivateGPT, IPFS, Solid/Dokieli)

---

## Challenges (Phase 3.5 Placeholder)

_Awaiting contrarian and out-of-the-box agent challenge results._

Key claims to challenge:

- Option B recommendation assumes @optave/codegraph is production-stable on
  Windows — not verified
- D7 scope enum has no academic grounding — novel design claim
- "No composite tool exists" — exhaustive scan covered 14 composites but the MCP
  ecosystem has 21,000+ servers; coverage is incomplete

---

## 10. Post-Challenge Re-Synthesis (v1.1 — BINDING CONCLUSION)

_Added 2026-04-17 after Phase 2.5 verification (V1 codebase + V2 external),
Phase 3 challenges (contrarian + OTB), and cross-model verification (Gemini
CLI). Supersedes Section 1 exec summary and Section 6 recommendation._

### 10.1 What changed

**V1 (codebase) surfaced one critical correction + confirmed 13 codebase
claims:**

- Memory file count is **80+ (not 44)** — 89% growth in 18 days (2026-03-31 →
  2026-04-17). D7 and synthesis counts were stale.
- All other home-codebase claims verified (no chokidar, no fs.watch, CAS
  on-demand, session-start lockfile hashing, filename prefixes encode scope).
- T28 corpus has doubled since 2026-04-07 (36 analysis.json files, 370
  extraction journal entries).

**V2 (external) surfaced 6 corrections across 35 checked claims:**

- Kythe v0.0.75 released March 2025, not 2026 — last release over 1 year old
  (strengthens "low-maintenance" verdict).
- KuzuDB abandoned Oct 2025 — confirmed via The Register; CodeGraphContext
  carries this risk.
- @optave/codegraph real (v3.9.4) but README feature claims inconsistent —
  language count claim "34 languages" disputed; GitHub title says "11
  languages."
- Cody Free/Pro discontinued July 2025 — confirmed.
- AGENTS.md is emerging convention, not settled standard — Claude Code uses
  CLAUDE.md, Gemini uses GEMINI.md.

**Contrarian surfaced 10 challenges (2 CRITICAL, 7 MAJOR, 1 MINOR). Top three:**

- C1 (CRITICAL): @optave/codegraph likely does not index .md / .yaml as
  first-class nodes. If true, Option B solves the wrong problem for JASON-OS
  skill/agent files.
- C3 (CRITICAL): Wrong abstraction. User needs capability-graph (can I run this
  skill?), not file-graph (can I copy this file?). MCP server deps, permissions,
  env are invisible in a file graph.
- C8 (MAJOR): Option B has 5 manual mechanisms. The 29% abandonment constraint
  ("every new mechanism must be fully automated") is violated. The T0 action was
  deferred 18 days — abandonment-before-start.

**OTB surfaced 8 alternatives (3 strong replacements for Option B):**

- Alt 2: JSONL + jq using the pattern SoNash already runs at production scale
  (extraction-journal.jsonl, agent-invocations.jsonl, CAS).
- Alt 1: PostToolUse hook (post-write-validator.js already exists) as the
  self-update trigger — no watcher daemon needed.
- Alt 3: scope-tag-only (YAGNI on the graph) — ripgrep on frontmatter solves
  portability identification today.
- Plus: Alt 8 (git blob SHA equality for retroactive cross-project copy
  detection), Alt 6 (chezmoi for propagation), Alt 7 (extend T28 SQLite
  directly).

**Cross-model (Gemini) converged on the same conclusion independently:** "The
correct path is (D) Minimum-viable JSONL + PostToolUse hook + Scope-tags...
Start with (D) to solve portability and abandonment risks first. Only build the
graph engine once the data capture is autonomic."

### 10.2 Revised Recommendation (v1.1)

**Option D (new, binding): Minimum-viable JSONL + PostToolUse hook + scope-tags.
Defer the graph engine.**

**Components:**

1. **T0 action — immediately, today (30 min, zero tooling):** Apply `scope:`
   frontmatter to the 80+ JASON-OS memory files using D7 auto-detection
   heuristics:
   - `feedback_*` (46 files) → `scope: user`
   - `user_*` (5 files) → `scope: user`
   - `project_*` (22 files) → `scope: project`
   - `reference_*` (7 files) → split per content: `reference_ai_capabilities.md`
     = `user`; `reference_external_systems.md` = `project`

2. **T1 action — 1-day build (no new dependencies):**
   - Create `~/.claude/file-registry.jsonl` with a schema such as:
     ```json
     {
       "path": ".claude/skills/deep-research.md",
       "scope": "universal",
       "tags": ["research", "orchestration"],
       "upstream": [],
       "downstream": ["searcher-agent"],
       "project": "jason-os",
       "sha": "abc123",
       "ts": "2026-04-17T18:00:00Z"
     }
     ```
   - Extend `post-write-validator.js` (PostToolUse hook) to append a registry
     record on every Claude `Write`/`Edit`/`MultiEdit`, extracting frontmatter
     `scope:`/`tags:` + file SHA-256.
   - Write query cheatsheet for jq: filter by scope, tag intersection, latest
     record per path.
   - Add `scripts/cas/rebuild-registry.js` for periodic dedup
     (last-record-per-path).

3. **T2 action — 1-day build (defensive):**
   - `scripts/cas/detect-portable-copies.js` (~50 lines, shells out to
     `git ls-files -s`): builds SHA → [project,path] inverted index across
     registered JASON-OS project roots. Detects cross-project copies +
     divergences retroactively. No new infrastructure.

4. **Deferred — only if demonstrated need arises:**
   - Graph traversal queries (multi-hop "what depends on this?") → at that
     point, either (a) extend T28 SQLite directly (OTB Alt 7), or (b) adopt
     `@optave/codegraph` AFTER empirically verifying it handles `.md`/`.yaml`
     files. Do NOT adopt until empirical test confirms non-code file support.
   - Capability-graph (Contrarian C3): environment/MCP-deps tracking for skills.
     Defer until a concrete query demonstrates need.
   - Change propagation across projects (chezmoi / OTB Alt 6): defer until "push
     universal skill updates to all projects" is an active operational need.

### 10.3 Why Option D beats Option B

| Dimension                 | Option B (@optave/codegraph + sidecar)                                | Option D (JSONL + hook + scope-tags)                                       |
| ------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Build cost                | 200-400 lines MCP + automation for 5 manual mechanisms                | ~50 lines hook extension + cheatsheet. T0 is 30 min                        |
| New dependencies          | @optave/codegraph (1 month old, MEDIUM confidence, disputed features) | Zero. Uses existing post-write-validator.js + jq                           |
| Abandonment risk          | HIGH — 5 manual mechanisms; @optave/codegraph could be abandoned      | LOW — builds on patterns SoNash already runs at scale (370-entry journal)  |
| .md/.yaml file support    | UNVERIFIED (Contrarian C1 — potentially fatal)                        | Native; these are the primary file types in use                            |
| Cross-project portability | Via `codegraph registry add` (manual per project)                     | Via `~/.claude/file-registry.jsonl` at user level — works from any session |
| Unblocks T0 action        | NO — blocked on architecture decision                                 | YES — T0 frontmatter works today regardless of registry build              |
| Reversibility             | Once committed, pivoting away loses the investment                    | JSONL is plain-text, readable without any tool, always transferable        |
| MCP query surface         | 30+ codegraph MCP tools                                               | None initially — query via jq. Add MCP wrapper only if needed.             |

### 10.4 What stays unchanged from Section 6

- **dependency-cruiser** remains the best code-edge extraction primitive if/when
  code-graph becomes needed (Node.js MIT, bidirectional JSON, Windows-native).
- **@parcel/watcher** remains the fallback for external-editor file changes
  missed by the PostToolUse hook. Adopt only if that coverage gap becomes
  operational.
- **D7 scope enum** (universal/user/project/machine/ephemeral) remains the
  recommended classification schema.
- **Gap 2** (cross-project copy detection) is now addressed by OTB Alt 8 (git
  blob SHA script), not deferred.

### 10.5 Confidence Distribution (v1.1)

Post-verification and post-challenge:

| Level      | v1.0    | v1.1    | Δ                                             |
| ---------- | ------- | ------- | --------------------------------------------- |
| HIGH       | 63      | 61      | -2 (Kythe date + CodeGraphContext downgraded) |
| MEDIUM     | 42      | 44      | +2                                            |
| LOW        | 8       | 8       | -                                             |
| UNVERIFIED | 3       | 7       | +4 (V2 UNVERIFIABLE additions)                |
| **Total**  | **116** | **120** | +4 (net new claims from challenges)           |

Overall research confidence: **HIGH** for the Option D recommendation (Gemini
cross-model concurs independently). **MEDIUM-HIGH** for the claim that
@optave/codegraph should NOT be adopted without empirical .md/.yaml verification
(C1 challenge is the strongest rec-impacting finding).

### 10.6 Risks and Open Questions (v1.1)

- **OQ-1 (deferred)**: does @optave/codegraph index .md/.yaml as first-class
  graph nodes? Answer determines whether Option B becomes viable as a later
  upgrade path.
- **OQ-2 (new)**: does the 80+ memory file count grow linearly or accelerate?
  Re-check in 30 days. If growth is more than 2× per 30-day window, frontmatter
  tagging becomes unsustainable without automation.
- **OQ-3 (new)**: how often do cross-project graph-traversal queries arise in
  actual workflow? Track for 30 days before building graph engine.
- **OQ-4 (new)**: do other home projects (non-SoNash) actually exist yet?
  Contrarian C6: JASON-OS constituent project list is not defined. Option D's
  `~/.claude/file-registry.jsonl` works regardless, but the cross-project
  utility depends on having multiple projects.
- **R1-R7** from Section 7 retained; add:
- **R8 (new, HIGH)**: @optave/codegraph .md/.yaml support is unverified. Do NOT
  adopt until empirical test.
- **R9 (new, MEDIUM)**: The PostToolUse hook approach adds logic to
  post-write-validator.js (already 800+ lines). Either factor into separate hook
  (per-write process spawn cost on Windows) or accept file growth.

### 10.7 Retrospective on the Research Process

- Synthesizer's initial recommendation (Option B) was a reasonable reading of
  the findings but failed to challenge the foundational "graph is needed"
  assumption.
- Contrarian C1 (language count) and C3 (abstraction) caught the highest-impact
  issues — both would have shipped incorrect recommendations to the user absent
  the challenge phase.
- Cross-model Gemini independently arrived at Option D without seeing the
  challenger outputs — strong validation.
- The T0 action being deferred 18 days was the biggest process signal: when a
  research-identified action never executes, the problem is likely upstream
  (wrong framing, no clear consumer), not downstream (lack of time).

---

_v1.1 is the binding conclusion. Future research sessions on this topic should
start from Section 10._
