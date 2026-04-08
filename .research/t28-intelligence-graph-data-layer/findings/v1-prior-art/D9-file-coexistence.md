# Findings: T28 Intelligence Graph + .research/ File Artifact Coexistence

**Searcher:** deep-research-searcher  
**Profile:** web+codebase  
**Date:** 2026-04-07  
**Last Updated:** 2026-04-08  
**Sub-Question IDs:** D9

## Purpose

Investigates how the T28 intelligence graph coexists with existing `.research/`
file artifacts. Evaluates four architectural options (graph indexes files, graph
replaces files, graph augments files, graph mirrors files) against migration
path, data loss risk, human readability, Claude Code access, git-trackability,
and compaction resilience criteria.

---

## Key Findings

### 1. Industry Consensus: Files Are Canonical, Graph Is Derived Index [CONFIDENCE: HIGH]

Every production system studied (BasicMemory, Palinode, LightRAG, Obsidian)
converges on the same architectural decision: **plain files are the
authoritative source of truth; the graph/database is a derived, regenerable
index.** This is not coincidence — it emerges from concrete engineering
constraints:

- BasicMemory: "Markdown files on disk" are the source of truth.
  SQLite/PostgreSQL is the "indexing layer." The `SyncService` propagates files
  → database, not the reverse. Database loss is recoverable by re-scanning
  files. Config is source of truth for project reconciliation on startup.
- Palinode: "Plain files are the source of truth and everything else is a
  derived index." SQLite-vec is rebuilt from markdown + YAML frontmatter. Every
  compaction is a git commit, not a database mutation.
- LightRAG: All derived state (graph, vectors, KV) lives in `WORKING_DIR`. The
  upstream documents are canonical. Regeneration is: clear working dir,
  re-ingest.
- Obsidian: Markdown files ARE the vault. The graph view is a computed
  visualization of `[[wiki-links]]` extracted from files. Deleting the graph
  cache (`.obsidian/graph.json`) loses nothing; it regenerates on next open.

**Implication for T28:** Files are the floor. The graph is an acceleration
layer.

---

### 2. Option A (Graph Indexes Files) Is the Lowest-Risk, Highest-Fidelity Choice [CONFIDENCE: HIGH]

Evaluation across all six criteria:

| Criterion             | Option A: Graph Indexes Files                                                                       | Option B: Graph Replaces Files                                                        | Option C: Graph Augments Files                                          | Option D: Graph Mirrors Files                                           |
| --------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Migration path        | Zero: existing files untouched; graph bootstraps from them                                          | High: must convert all 168 JSONL entries + 11 analysis.json files + all .md artifacts | Low: files stay, graph writer adds a new layer on top of existing files | Medium: requires sync machinery + conflict resolution                   |
| Data loss risk        | Low: files survive graph loss; graph is regenerable                                                 | High: if graph backend fails, all richness is lost; no fallback                       | Low: files are the floor, but graph-only relationships are orphaned     | Medium: sync bugs create split-brain state                              |
| Human readability     | Full: `.research/` directory is browsable as-is; no change                                          | Zero: files become generated views, may not match mental model                        | Full: files unchanged, graph adds invisible metadata                    | Full: both exist, but two sources of truth confuses humans              |
| Claude Code access    | Read tool for files (no MCP needed); MCP tools for graph queries; graceful degradation to file-only | MCP tools required; Read tool useless except for generated views                      | Read tool for content; MCP tools for relationships; clean separation    | Both always needed; increased cognitive overhead                        |
| Git-trackability      | Files track normally; graph DB excluded from git (or exported as JSON snapshots)                    | Graph DB cannot be meaningfully tracked in git; generated files may have noisy diffs  | Files track normally; graph adds no tracked artifacts                   | Graph DB untrackable; files track normally                              |
| Compaction resilience | Full: files survive compaction; graph rebuilt on next session start                                 | None: graph state is lost on compaction if not persisted externally                   | Full: content survives; relationships must be re-derived                | Partial: file side survives; database side is lost unless backup exists |

**A is strictly better than B and D on data loss and compaction resilience. A
and C are close — the key difference is that A treats the graph as a
pointer/metadata store over existing file content, while C treats the graph as
an additive overlay that doesn't necessarily touch existing file paths.**

---

### 3. The Correct Framing: Option A/C Hybrid ("Files as Floor, Graph as Intelligence Layer") [CONFIDENCE: HIGH]

Options A and C are not cleanly separable in practice. The most functional
design from studied systems combines them:

- **Files hold content and raw findings** (analysis.json, findings.jsonl,
  creator-view.md, value-map.json, EXTRACTIONS.md, extraction-journal.jsonl) —
  these remain canonical and unchanged
- **Graph holds relationships, cross-source patterns, and metadata that files
  cannot express** (e.g., "repo X implements the same pattern as repo Y,"
  "website Z contradicts claim in repo W's findings.jsonl," "this candidate
  links to 3 other candidates across different sources")
- **Graph also holds pointer nodes**: each source's directory path, schema
  version, analyzed-at timestamp, and links to its file artifacts — enabling
  graph traversal to discover which files to load

This is BasicMemory's architecture precisely: entities (nodes) carry content;
relations (edges) carry connections; the file system is the ground truth for
both; SQLite indexes them for query efficiency.

The key distinction from pure A: the graph is not merely an index of file paths.
Graph nodes carry extracted observations (findings, patterns, candidates) that
ARE surfaced from the files — so the graph enriches the navigability without
replacing the files.

---

### 4. Migration Path from Current State: Near-Zero Friction [CONFIDENCE: HIGH]

Current file inventory:

- 11+ `repo-analysis/<slug>/analysis.json` files (rich structured JSON, schema
  4.3)
- 11+ `repo-analysis/<slug>/findings.jsonl` files (structured findings with IDs)
- 5+ `website-analysis/<slug>/analysis.json` + findings.jsonl
- `extraction-journal.jsonl` (168 entries, schema 2.0)
- `EXTRACTIONS.md` (auto-generated from JSONL — already a derived view)
- Human-readable .md files (creator-view.md, summary.md, deep-read.md,
  SITE-ANALYSIS.md, value-map.json)

Migration strategy for Option A/C hybrid:

1. **Bootstrap phase**: Read each `analysis.json` → create graph node (source
   node). Read each `findings.jsonl` → create observation nodes linked to source
   node.
2. **Relationship extraction phase**: Cross-reference extraction-journal.jsonl
   against source nodes, wire candidate nodes to source nodes via "found-in"
   edges.
3. **Augmentation phase**: Graph-only edges are added incrementally as synthesis
   queries discover relationships. Files are never rewritten.
4. **EXTRACTIONS.md stays as-is**: It is already a derived view of
   extraction-journal.jsonl. The graph does not replace it; it provides a richer
   navigation layer over the same data.

No data loss at any step. Files are never touched. Graph is additive.

---

### 5. Compaction Resilience Is Non-Negotiable for This Project [CONFIDENCE: HIGH]

From project context (CLAUDE.md, MEMORY.md): Claude Code sessions compact
regularly, background agent output files are 0 bytes on Windows (known bug). The
graph state CANNOT be the only place relationships live.

The Palinode pattern directly addresses this: every compaction is a git commit.
The graph state can be rebuilt from files on session start. This is the correct
design for T28.

**Concrete requirement**: The graph must be reconstructible from the
`.research/` file artifacts alone. If the graph backend (SQLite DB, MCP memory
server) is deleted or unavailable, running `t28 rebuild-graph` against the
existing `.research/` directory tree should produce an equivalent graph. This is
possible only if files remain canonical.

---

### 6. Git-Trackability: Files Track Cleanly, Graph DBs Do Not [CONFIDENCE: HIGH]

- SQLite `.db` files are binary and generate noisy, meaningless git diffs
- The correct pattern (used by BasicMemory, Palinode) is to gitignore the `.db`
  file and track only the markdown/JSON files
- For T28: gitignore the graph backend DB; track `.research/` files normally
- Optional: export graph as a human-readable snapshot (`graph-snapshot.json` or
  `.graphml`) at session-end for git tracking — but this is supplementary, not
  required

Obsidian uses a similar pattern: `.obsidian/graph.json` is gitignored in most
developer vaults; the markdown files are tracked. The graph is derived on
startup.

---

### 7. Obsidian's Architecture Is the Closest Model to T28's Ideal [CONFIDENCE: HIGH]

From D2a findings (already in this research set): Obsidian's core model is:

- Every `.md` file = graph node
- Every `[[wiki-link]]` = directed edge
- `app.metadataCache.resolvedLinks` = live in-memory graph, queryable from JS
- Graph view is a visualization of this derived structure

For T28, replace `[[wiki-links]]` with programmatically written YAML frontmatter
cross-references. The file IS the node. The graph IS derived from the files.
Human-browsable. Git-trackable. MCP-accessible (MCPVault, obsidian-mcp work
without Obsidian running). Compaction-resilient (rebuild from files on startup).

---

### 8. Logseq DB Version: Anti-Pattern to Avoid [CONFIDENCE: HIGH]

From D2a: Logseq's new DB version "abandons plain-text markdown for SQLite —
violates T28's markdown-native preference." This is the exact pitfall Option B
would create for T28: a system that is powerful when the database is healthy but
fragile when it is not.

---

## Sources

| #   | URL                                                                                                                  | Title                                                            | Type                         | Trust       | CRAAP | Date       |
| --- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------- | ----------- | ----- | ---------- |
| 1   | https://deepwiki.com/basicmachines-co/basic-memory                                                                   | BasicMemory Architecture Deep Dive                               | Community (verified)         | MEDIUM-HIGH | 4.2   | 2025       |
| 2   | https://github.com/basicmachines-co/basic-memory/blob/main/README.md                                                 | BasicMemory README                                               | Official docs                | HIGH        | 4.6   | 2025       |
| 3   | https://docs.basicmemory.com/concepts/knowledge-format                                                               | BasicMemory Knowledge Format                                     | Official docs                | HIGH        | 4.5   | 2025       |
| 4   | https://github.com/Paul-Kyle/palinode                                                                                | Palinode README                                                  | Official repo                | HIGH        | 4.4   | 2025       |
| 5   | https://dev.to/charles_li_9f5324f34d8a26/i-built-a-free-git-native-memory-layer-for-ai-agents-heres-why-and-how-14ch | Git-Native Memory Layer for AI Agents                            | Community blog               | MEDIUM      | 3.8   | 2025       |
| 6   | https://dev.to/imaginex/ai-agent-memory-management-when-markdown-files-are-all-you-need-5ekk                         | AI Agent Memory Management: When Markdown Files Are All You Need | Community blog               | MEDIUM      | 3.6   | 2025       |
| 7   | https://lightrag.github.io/                                                                                          | LightRAG Documentation                                           | Official docs                | HIGH        | 4.3   | 2025       |
| 8   | .research/t28-intelligence-graph-data-layer/findings/D2a-obsidian-logseq.md                                          | D2a: Obsidian/Logseq as Graph Backend (prior findings)           | Codebase (internal research) | HIGH        | 5.0   | 2026-04-07 |
| 9   | .research/t28-intelligence-graph-data-layer/findings/D3-mcp-memory-internals.md                                      | D3: MCP Memory Server Internals (prior findings)                 | Codebase (internal research) | HIGH        | 5.0   | 2026-04-07 |
| 10  | .research/t28-intelligence-graph-data-layer/findings/D5a-popular-graph-mcp.md                                        | D5a: Popular Graph MCP Servers (prior findings)                  | Codebase (internal research) | HIGH        | 5.0   | 2026-04-07 |
| 11  | .research/unified-content-intelligence/BRAINSTORM.md                                                                 | T28 Brainstorm (chosen direction: Intelligence Graph)            | Codebase (internal)          | HIGH        | 5.0   | 2026-04-07 |
| 12  | .research/extraction-journal.jsonl                                                                                   | Current extraction-journal (168 entries, schema 2.0)             | Codebase (ground truth)      | HIGH        | 5.0   | 2026-04-07 |
| 13  | .research/repo-analysis/docling/                                                                                     | Docling repo-analysis artifact set (9 files, schema 4.3)         | Codebase (ground truth)      | HIGH        | 5.0   | 2026-04-07 |

---

## Contradictions

None found. All four external systems studied (BasicMemory, Palinode, LightRAG,
Obsidian) agree on the file-canonical model. The only variation is HOW the
database is synced from files (watch-based vs startup scan vs explicit ingest),
not WHETHER files are canonical.

The one apparent tension: BasicMemory's AGPL license (surfaced in D5a) creates a
constraint on directly adopting BasicMemory as T28's backend, even though its
architecture is the best model. Resolution: adopt the architecture pattern
without adopting the codebase.

---

## Gaps

1. **Graph reconstruction benchmark**: No data found on how long it takes to
   rebuild a graph from ~168 JSONL entries + 11 analysis.json files at T28's
   scale. For SQLite backend, this is likely sub-second. For Obsidian vault
   sync, startup time at 1,000 notes is documented as fast but not quantified.
2. **Incremental graph update vs full rebuild**: None of the studied systems
   document performance of partial sync (add 1 new source) vs full rebuild. For
   T28's use pattern (adds 1-5 sources per session), this matters.
3. **Cross-session graph state persistence without MCP**: If T28 uses SQLite as
   the graph backend (not an always-running MCP server), what is the lifecycle —
   rebuild on session start from files, or assume the .db persists between
   sessions?

---

## Serendipity

- **EXTRACTIONS.md is already a derived view**: It auto-generates from
  `extraction-journal.jsonl`. This confirms the project already uses the
  file-canonical / derived-view pattern instinctively. The graph just formalizes
  and extends what's already happening.
- **Harper Reed's Claude Code → Obsidian pipeline (D2a)**: A working
  proof-of-concept of the A/C hybrid exists: Claude Code parses sources, writes
  to Obsidian nodes via wiki-links. This is the exact T28 write path. It was
  already validated externally before T28 was defined.
- **The `analysis.json` schema 4.3 structure is already graph-ready**: Each
  `analysis.json` has structured metadata (repo slug, stars, language, repoType,
  repoSubtype, analyzedAt) that maps directly to graph node properties. No data
  transformation needed — the graph bootstrap is a direct JSON read.

---

## Confidence Assessment

- HIGH claims: 8
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

The convergence across 4 independent external systems (BasicMemory, Palinode,
LightRAG, Obsidian) all making the same architectural choice (files canonical,
graph derived) provides strong evidence for the recommendation. The codebase
analysis confirms T28's existing artifacts are compatible with this pattern with
zero migration friction.

---

## Version History

| Version | Date       | Changes                                                    |
| ------- | ---------- | ---------------------------------------------------------- |
| 1.0     | 2026-04-07 | Initial findings from D9 search                            |
| 1.1     | 2026-04-08 | Add Purpose section, version history (PR #500 R1 doc lint) |
