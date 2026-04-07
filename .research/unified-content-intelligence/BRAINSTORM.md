# T28 Unified Content Intelligence System — Brainstorm

**Date:** 2026-04-07 | **Session:** #267 | **Status:** Direction Chosen
**Skill:** brainstorm v1.0 | **Topic slug:** unified-content-intelligence

---

## Context

T28 replaces 4 separate skills (repo-analysis, website-analysis, repo-synthesis,
website-synthesis) with a unified system that can analyze any source type and
synthesize insights across sources.

### Research Foundation

- **13 repos analyzed** across 6 clusters (A: multi-format extraction, B:
  PDF/OCR, C: web crawling, D: audio — skipped as covered, E: wiki/KB, F:
  social/archival)
- **4 gap agents** producing 13 consolidated questions (4 resolved, 5 partially
  addressed, 4 fully open)
- **168 extraction journal entries** across 20+ sources
- **Multi-layer memory research** (41 agents, 128 claims) — storage
  architecture, token costs, automation requirements
- **MemSkill analysis** — Dual-Embedding Memory Bank, arXiv 2602.02474 (unread),
  meta-memory skills framework
- **Gist analyses** — Karpathy three-layer architecture, Index+Log dual
  navigation, anti-cramming/anti-thinning balance, 7-command skill architecture

### Resolved Facts (from 13-repo research)

1. Extraction is unifiable — same pipeline architecture works for all types
2. Markdown + metadata sidecar is the canonical interchange format
3. Extraction interface is simple (source in, markdown+metadata out)
4. Depth tiers control backend selection
5. Don't build parsers — delegate to existing tools (docling-mcp, firecrawl,
   crawl4ai)
6. Don't over-engineer intermediate representations (docling ontology V2 lesson)
7. Don't split packages prematurely or build plugin systems before having users

### Open Questions Entering Brainstorm

- O1: Cross-source synthesis primitives (zero prior art)
- O2: Extraction confidence schema
- O3: Hierarchy preservation threshold
- O4: Analysis layer design
- P1-P5: Metadata schema, URL classification, resumability, LLM placement, two
  extraction paradigms

---

## Anti-Goals

1. **Not a human analysis tool** — T28 is an AI intelligence tool where Claude
   does the analysis work. The human provides direction and guidance.
2. **Must not create data it can't later find and use** — every stored artifact
   must be retrievable and actionable at scale. Data that can't be found is
   noise.
3. **Not a replacement for specialized tools** — T28 orchestrates, it doesn't
   parse. Delegate parsing to docling, firecrawl, crawl4ai, etc.

## Constraints

1. Solo developer — builds and maintains through Claude Code orchestration
2. Skills are the execution unit (for now — may evolve to MCP service)
3. Existing data (168 extraction entries, 11 repo analyses, 5 website analyses)
   must survive migration
4. Full 28 source types — ships complete, not a subset
5. Rich schema — no lossy conversion. Empty values OK, but capture everything
   available. This data feeds JASON-OS.

---

## Directions Explored

### Direction A: Unified Orchestrator

Thin wrapper over existing skills. Lowest risk, highest immediate value. But
doesn't solve data scale — still flat files, still JSONL, still loads everything
into context. You'd outgrow it quickly.

**Verdict:** Safe but insufficient. Doesn't address core concern.

### Direction B: Intelligence Graph ← CHOSEN

Every analyzed source becomes a node, every relationship an edge. Graph is the
primary data structure. Analysis produces nodes with rich metadata. Synthesis is
graph traversal and pattern detection. Retrieval is graph query.

**Verdict:** Best long-term architecture. Data scale solved by graph structure.
Feasibility improved by existing MCP memory server and extensive prior research.

### Direction C: Layered Pipeline with Tiered Storage

Three explicit layers (extraction → analysis → synthesis) with hot/warm/cold
storage tiers. Most pragmatic, directly validated by research.

**Verdict:** Strong engineering but treats data scale as a caching problem
rather than solving it architecturally. Warm tier design is deceptively hard
(cache invalidation). C's good ideas (layer separation, incremental delivery)
fold into B's implementation strategy.

### Direction D: MCP-Native Intelligence Service

T28 as an MCP server with analyze/search/synthesize tools. Most forward-looking
for JASON-OS but highest upfront cost.

**Verdict:** Graduation path for B, not starting point. Once the intelligence
graph works, wrapping it as an MCP server is natural evolution.

---

## Chosen Direction: B — Intelligence Graph

### Vision

T28 is a knowledge graph where every analyzed source becomes a node, every
insight becomes a connected finding, and every cross-source relationship is a
first-class edge. Claude interacts with the graph through structured tools (MCP
or equivalent), never needing to load bulk data into context. Analysis produces
graph nodes. Synthesis is graph traversal. Scale is handled by the graph itself
— you query what's relevant, not load everything.

### Why B Over the Others

- **Solves data scale architecturally** — graph queries are targeted, not
  bulk-load. Thousands of sources become navigable, not overwhelming.
- **Makes relationships first-class** — "this pattern from repo X contradicts
  this approach from website Y" is a native graph query, not a multi-file scan.
- **JASON-OS foundation** — a personal intelligence graph IS the "Claude Code
  OS" knowledge layer.
- **Feasibility improved by existing infrastructure** — MCP memory server is
  configured and running. MemSkill + multi-layer memory research inform schema
  design. Prior art exists (Karpathy's architecture, qmd's context tree).
- **Rich context preserved** — graph nodes carry full metadata, edges carry
  relationship types. Nothing lost.

### Key Assumptions

1. A graph storage backend exists or can be selected that handles the scale
   (hundreds to thousands of nodes with rich metadata)
2. Claude can effectively interact with a graph through MCP tools or similar
   structured interface
3. The entity/relation schema can be designed to cover 28 source types without
   becoming unwieldy
4. Graph-based synthesis produces meaningfully better insights than flat-file
   synthesis

### Architecture Sketch

```
SOURCE → EXTRACTOR → markdown + metadata
                          ↓
                    ANALYZER → findings, patterns, candidates
                          ↓
                    GRAPH WRITER → nodes + edges + observations
                          ↓
                    INTELLIGENCE GRAPH (storage backend TBD)
                          ↓
                    SYNTHESIZER → graph traversal, pattern detection
                          ↓
                    OUTPUT → insights, comparisons, recommendations
```

### What Still Needs Research

1. **Data layer tool selection** (HIGHEST PRIORITY) — MCP memory vs Obsidian vs
   SQLite vs Neo4j vs custom wiki vs hybrid. What's the right backend for a
   personal AI intelligence graph? Repos and tools exist that speak to this.
2. **Entity/relation schema** — informed by MemSkill arXiv 2602.02474 (MUST
   READ), Dual-Embedding Memory Bank, qmd context tree, extraction research
3. **Scale characteristics** — how does the chosen backend handle 1000+ nodes
   with 5000+ edges?
4. **Graph ↔ file artifact coexistence** — do .research/ files persist alongside
   the graph? Does the graph index files, replace them, or augment them?
5. **Cross-source synthesis primitives** — what graph operations produce
   insight? (link, deduplicate, conflict-resolve, chain, compare, cluster?)
6. **Extraction confidence propagation** — how does uncertainty from extraction
   flow through analysis to synthesis via graph properties?

### Implementation Strategy

**Phase 1: Research** — Deep-research on data layer tool selection, read
MemSkill arXiv paper, analyze relevant repos (knowledge graph tools, Obsidian
plugins, local-first graph databases).

**Phase 2: Schema Design** — Design entity/relation schema for 28 source types.
Prototype with existing MCP memory server or chosen tool.

**Phase 3: Extraction Layer** — Thin orchestrator that routes to existing tools
(repo-analysis, website-analysis, docling-mcp, firecrawl, crawl4ai) and writes
results to the graph.

**Phase 4: Analysis Layer** — Graph-native analysis that produces findings as
connected nodes, not isolated files.

**Phase 5: Synthesis Layer** — Cross-source graph traversal, pattern detection,
contradiction identification, relationship mapping.

**Phase 6: Graduation to MCP** — Wrap the intelligence graph as an MCP server
for JASON-OS portability.

### Evolution Path

B (Intelligence Graph) → D (MCP-Native Intelligence Service)

Once the graph works, exposing it as an MCP server is natural. The graph becomes
the storage backend, the MCP tools become the interface. Any agent (Claude Code,
Claude Desktop, JASON-OS) can query the intelligence graph.

---

## Decisions Made (36 total)

| #   | Decision                                                                              | Rationale                                                                               |
| --- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | Direction B (Intelligence Graph) over A, C, D                                         | Solves data scale architecturally, makes relationships first-class, JASON-OS foundation |
| 2   | Full 28 source types, not a subset                                                    | User requirement — ships complete                                                       |
| 3   | AI intelligence tool, not human analysis tool                                         | Claude does the work, user provides direction                                           |
| 4   | No lossy conversion — rich schema with empty values                                   | JASON-OS foundation requires full context                                               |
| 5   | Delegate parsing to existing tools                                                    | Don't build parsers (anti-pattern from research)                                        |
| 6   | Markdown + metadata as extraction interchange                                         | Resolved by 13-repo research — all tools converge on this                               |
| 7   | Depth tiers control backend selection                                                 | Resolved by research (Quick/Standard/Deep → different extractors)                       |
| 8   | Data layer tool selection goes to deep-research                                       | Highest priority open question — foundational choice                                    |
| 9   | MemSkill arXiv 2602.02474 must be read before execution                               | Core theory for graph/memory schema design                                              |
| 10  | Graph ↔ file coexistence strategy goes to deep-research                               | Can't resolve without knowing the backend                                               |
| 11  | Existing skills become extraction backends, not replaced                              | repo-analysis, website-analysis are battle-tested                                       |
| 12  | Synthesis is graph traversal, not file aggregation                                    | Core architectural decision of Direction B                                              |
| 13  | MCP service is graduation path, not starting point                                    | D is where B evolves, not where T28 starts                                              |
| 14  | Cross-source synthesis primitives go to deep-research                                 | Zero prior art — needs investigation                                                    |
| 15  | Must not create data it can't find and use                                            | Anti-goal — every artifact must be retrievable                                          |
| 16  | Solo developer constraint shapes all scope decisions                                  | No team, Claude Code orchestration only                                                 |
| 17  | Entity/relation schema must cover all source types                                    | Design challenge — goes to Phase 2 after research                                       |
| 18  | Warm tier concepts from C fold into graph query layer                                 | Graph queries replace tiered storage caching                                            |
| 19  | LLM placement is per-source-type, not universal                                       | From gap agent research — web=integral, docs=optional                                   |
| 20  | Two extraction paradigms (format-driven + goal-driven)                                | From firecrawl/crawl4ai — both needed                                                   |
| 21  | Resumability is per-source optional capability                                        | From crawl4ai research — not universal                                                  |
| 22  | Social media classified as adversarial/high-maintenance                               | From nitter research — design for extractor failure                                     |
| 23  | Extraction confidence must propagate through graph                                    | LLM augmentation introduces hallucination risk                                          |
| 24  | Prior multi-layer memory research informs data layer                                  | 41 agents, 128 claims — don't duplicate work                                            |
| 25  | Investigate Obsidian, Neo4j, SQLite, custom wiki options                              | Don't assume MCP memory is the answer                                                   |
| 26  | Analyze repos on knowledge graph/wiki/memory tools                                    | Prior art exists — research before building                                             |
| 27  | Implementation is phased: research → schema → extraction → analysis → synthesis → MCP | Incremental delivery, research-first                                                    |
| 28  | Context tree pattern (qmd) informs retrieval design                                   | Hierarchical context flowing to children during search                                  |
| 29  | Karpathy's Index+Log dual navigation informs interface                                | Hot index for context, cold detail for depth                                            |
| 30  | Anti-cramming/anti-thinning balance (farzaa) informs density                          | Knowledge storage must balance depth and breadth                                        |
| 31  | Automation mandatory — 29% abandonment rate for manual mechanisms                     | From multi-layer memory research                                                        |
| 32  | "Answers compound into wiki" principle applies                                        | Knowledge accumulates, doesn't just archive                                             |
| 33  | Don't over-engineer ontology (docling V2 lesson)                                      | Keep schema clean and evolvable                                                         |
| 34  | Backend+Pipeline separation (docling) applies to T28                                  | Extraction backends separate from orchestration                                         |
| 35  | Self-describing source type registry (unstructured) for routing                       | Each source type declares its extractor and requirements                                |
| 36  | Strategy fallback chain for depth/backend degradation                                 | AUTO → preferred → fallback, logged not failed                                          |
