# Findings: Dendron, Foam, and VS Code-Based Knowledge Tools

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-07 **Sub-Question:** D2b-1

---

## Summary

Dendron is effectively dead (maintenance-only since Feb 2023, YC-backed PMF
failure). Foam is alive (17K stars) but alpha-grade with no public API for graph
data. Both offer valuable architectural lessons for T28. Key takeaways: flat
tags + dense links beat deep hierarchies at scale, graphology is the preferred
JS graph library, wikilink resolution by name (not path) prevents link rot,
typed edges (hierarchical vs associative) are critical for meaningful graphs.
Dendron's failure was business (power tool without enterprise PMF), not
technical.

---

## Key Findings

### 1. Dendron Is Dead — Learn From It, Don't Build On It [CONFIDENCE: HIGH]

Maintenance-only since February 2023. Creator Kevin Lin: active development
ceased, no new features planned. 7.4K stars, 6,380 commits. License changed from
GPLv3 to Apache 2.0 for community forks. Repo not formally archived but no
meaningful development since early 2023.

### 2. Dendron's Core Data Model [CONFIDENCE: HIGH]

Three interlocking primitives:

- **Hierarchies via dot notation:** Files named `project.tasks.backend.auth.md`
  — logical hierarchy without physical folders. O(1) retrieval regardless of
  corpus size.
- **Schemas (`.schema.yml`):** YAML-defined type systems validating child node
  structure, auto-applying templates. Optional but enforce structure.
- **Backlinks + Wikilinks:** Secondary graph layer on top of hierarchies. Graph
  view differentiates hierarchical edges (solid) and link edges (dotted).
- **Graph backend:** Used **graphology** (JS/TS graph library) internally.
- **Flexible hierarchy:** Notes refactored (renamed/moved) without breaking
  links — tracked by id, not filename.

### 3. Foam's Data Model [CONFIDENCE: HIGH]

- **Resource objects:**
  `{ uri, title, links[], tags[], sections[], aliases[], definitions[] }`
- **FoamGraph:** Tracks links (outgoing), backlinks (incoming), placeholders
  (unresolved refs)
- **Connections:** `{ source: URI, target: URI, link: ResourceLink }`
- **Wikilinks resolve by name, not path** — rename auto-updates incoming links
- **Graph backend:** Uses **graphlib** (dagrejs, older/less maintained than
  graphology)

### 4. Foam-Core: Designed for Standalone, Not Actually Accessible [CONFIDENCE: MEDIUM]

foam-core was designed for CLI/CI/extension use, bundled as CJS/UMD/ESM. BUT:

- Not published to npm as standalone package
- foam-cli (last published April 2022) has 3 commands only: help, janitor,
  migrate. No graph data export.
- Team "refrained from exposing graph data to avoid locking into unstable APIs"
- Cannot treat as library dependency without forking source

### 5. Emerging VS Code + Graph Tools (2025-2026) [CONFIDENCE: MEDIUM]

- **InfraNodus VS Code Extension:** Text-to-concept-network via Textexture
  algorithm. REST API + MCP server. Cloud-dependent (API key required).
- **Bevel LSP Interface:** Code-to-knowledge-graph via LSP.
- **Axon:** Graph-powered code intelligence with MCP tools. Very close to T28
  architecturally.

Ecosystem converging on MCP as standard programmatic interface.

### 6. Why Dendron Failed: Business, Not Technical [CONFIDENCE: HIGH]

Kevin Lin post-mortem: "power tool for power users" with excellent technical
execution. Spent 2 years building before user interviews — discovered users "had
no desire to use Dendron with their teams." Needed enterprise revenue for
venture returns. Architecture never repudiated — PMF mismatch.

**T28 lesson:** Build the graph as subsystem serving a clear user workflow
first, not a general-purpose intelligence layer.

### 7. Flat Tags + Dense Links Beat Deep Hierarchies at Scale [CONFIDENCE: MEDIUM]

Case study: 8,000 notes, 64,000 links in Obsidian. Finding: "Tags > Links >
Hierarchy" for navigability at scale. ~8 internal links/note, 2,141 unique tags,
3.7 tags/note. Manual organization breaks down past ~1,000 notes.

PKM ecosystem validated this: Roam (flat + bi-directional links) and Logseq
(block-level, minimal hierarchy) gained traction over rigid folder hierarchies.

**T28 implication:** Flat tag-as-node plus typed edge relationships is
architecturally sound.

### 8. graphology Is the Preferred JS Graph Backend [CONFIDENCE: MEDIUM]

Both Dendron and broader ecosystem converge on **graphology**:

- Directed, undirected, mixed graphs with self-loops and parallel edges
- Standard library of graph theory algorithms
- Integrates with sigma.js for visualization
- Framework-agnostic (Node.js, browser, ESM)
- JSON-serializable

Foam chose **graphlib** (dagrejs) — older, less maintained.

### 9. Wikilink Resolution by Name, Not Path [CONFIDENCE: HIGH]

Both Foam and Obsidian resolve `[[note-name]]` by name regardless of directory
location. Rename/move auto-updates incoming links. Path-based resolution creates
brittle graphs.

**T28 implication:** Node identity should be stable ID or canonical name, not
file path.

### 10. Typed Edges Are Critical [CONFIDENCE: MEDIUM]

Dendron distinguished **hierarchical edges** (structural containment, solid
lines) vs **link edges** (associative, dotted lines). Most tools only model link
edges, losing structural information.

**T28 minimum edge types:** `CONTAINS` (hierarchy), `REFERENCES` (explicit
link), `INFERRED` (AI-generated). Starting untyped creates visually impressive
but hard-to-query graphs.

---

## Sources

| #   | Title                                           | Type               | Trust  |
| --- | ----------------------------------------------- | ------------------ | ------ |
| 1   | Dendron maintenance announcement (GitHub #3890) | Official           | HIGH   |
| 2   | Kevin Lin YC retrospective                      | Primary source     | HIGH   |
| 3-5 | Dendron wiki: Concepts, Graph Backend, Schemas  | Official docs      | HIGH   |
| 6-8 | DeepWiki Foam architecture, VS Code Extension   | Auto-docs          | MEDIUM |
| 9   | Foam GitHub repo                                | Official           | HIGH   |
| 10  | Foam Wikilinks docs                             | Official           | HIGH   |
| 11  | PKM at scale analysis (8,000 notes)             | Practitioner       | MEDIUM |
| 12  | Forte Labs tagging guide                        | Authoritative blog | MEDIUM |
| 13  | Graphology docs                                 | Official library   | HIGH   |
| 14  | InfraNodus VS Code extension                    | Vendor docs        | MEDIUM |
| 15  | Dendron Graph View docs                         | Official docs      | HIGH   |

---

## Contradictions

1. **foam-core standalone vs reality:** Architecture docs claim standalone
   design. No npm package exists. Team explicitly withheld graph API. Design
   intent ≠ delivery.

2. **Hierarchies vs flat links:** Dendron says hierarchy essential for scale.
   PKM analysis says tags > links > hierarchy. Both true for different access
   patterns (browsing vs semantic traversal).

---

## Gaps

1. foam-core exact TypeScript API surface (undocumented, unstable)
2. Dendron 2025-2026 activity level
3. Performance benchmarks for graphology vs graphlib at T28 scale
4. Windows-specific issues with VS Code knowledge tools

---

## Serendipity

1. **Axon (code-to-knowledge-graph MCP):** Very recent, architecturally close to
   T28 needs. Reference implementation pattern.
2. **Dendron failure as cautionary tale:** Build for clear user workflow first,
   not general-purpose intelligence layer.
3. **InfraNodus graph-aware prompts:** Pattern for "graph context → AI
   reasoning" directly analogous to T28's synthesis goal.
