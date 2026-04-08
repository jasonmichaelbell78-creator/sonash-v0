# Findings: Heavyweight/Cloud-Backed Emerging Graph MCP Servers

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-07 **Sub-Question:** D5b-1

---

## Summary

6 heavyweight graph MCP servers evaluated. **Graphiti + Kuzu embedded** is the
best Windows path without Docker — `pip install graphiti-core[kuzu]` + file
path. mem0 has 52.2K stars but graph is optional add-on. Two unrelated
"AgentMemory" repos exist (rohitg00 Node.js 586 stars, JordanMcCann Python 7
stars). Ogham has highest retrieval (91.8% LongMemEval) but limited graph.
**kepano/obsidian-skills is NOT a graph server** — just Claude Code skills for
Obsidian file formats.

---

## Key Findings

### 1. Graphiti/Zep — Most Technically Capable [CONFIDENCE: HIGH]

24.6K stars. Temporal KG with bi-temporal tracking. MCP server v1.0 (labeled
"experimental"). 8 tools. Custom ontology via Pydantic (including custom
`confidence` field). **Backends: Neo4j, FalkorDB, Neptune, Kuzu (embedded).**

**Windows critical path:**

- **Kuzu embedded:** `pip install graphiti-core[kuzu]` + file path. Windows
  wheels exist. **Best non-Docker path.** Unconfirmed end-to-end but
  architecturally plausible.
- **Neo4j Desktop:** Native Windows installer. `bolt://localhost:7687`.
- **FalkorDB:** Docker only on Windows. FalkorDB Lite explicitly excludes
  Windows.
- **LLM required:** Anthropic/OpenAI API key for entity extraction.

LongMemEval: 63.8% (measures QA recall, not relational reasoning which is
Graphiti's strength).

### 2. mem0 — Dominant by Adoption, Graph Optional [CONFIDENCE: HIGH]

52.2K stars. Vector-first system. Graph via `enable_graph=True` (branded
"Mem0g"). 6 graph backends: Neo4j, Memgraph, Neptune, Kuzu, Apache AGE. Cloud
graph requires $249/mo Pro tier — open-source is free.

Self-hosted: `elvismdev/mem0-mcp-selfhosted` (62 stars) — Qdrant + Neo4j +
Ollama. 11 MCP tools. Graph adds 3 extra LLM calls per operation.

LongMemEval: 49% (independent eval). LOCOMO: 66.9% vector / 68.4%
graph-enhanced.

No per-node confidence. Edge threshold only.

### 3. Two "AgentMemory" Projects — Disambiguation [CONFIDENCE: HIGH]

**rohitg00/agentmemory (586 stars, Node.js):**

- Claims MEMORY.md sync with `~/.claude/projects/*/memory/MEMORY.md` —
  UNVERIFIED
- 43 MCP tools. Triple-stream: BM25 + vector + KG BFS
- 4-tier consolidation with supersession chains (Jaccard >0.7)
- Zero external DB dependencies (embedded)
- `npx @agentmemory/agentmemory`

**JordanMcCann/agentmemory (7 stars, Python):**

- Claims #1 LongMemEval at 96.2% (481/500), solo-built in 16 days — UNVERIFIED
- SQLite + PostgreSQL. Six-signal retrieval
- Explicit Windows support (PowerShell docs)
- `pip install agentmemory`

### 4. Ogham — Highest Retrieval, PostgreSQL [CONFIDENCE: MEDIUM-HIGH]

86 stars. PostgreSQL + pgvector. Single-query hybrid search (dense vectors +
tsvector + RRF in one SQL query). LongMemEval 91.8%. Limited graph (semantic
link traversal, not full KG). No custom types, tags, or confidence. Docker/uvx.
pgvector on Windows requires C++ build tools.

### 5. Hindsight — Production-Grade Hybrid [CONFIDENCE: MEDIUM-HIGH]

Vectorize.io. PostgreSQL + pgvector. 4 parallel retrieval paths. LongMemEval
91.4%. 3 primary tools (retain, recall, reflect). Docker or pip. Windows config
path documented. No custom ontology.

### 6. Neo4j Agent Memory (neo4j-labs) [CONFIDENCE: HIGH]

115 stars. POLE+O model (Person, Object, Location, Event + Organisation). 16
tools (extended profile). **`neo4j-mcp.exe` standalone Windows binary** — zero
dependencies. Three memory types: short-term, long-term (KG), reasoning.

### 7. Kuzu-Based MCP Servers [CONFIDENCE: MEDIUM-HIGH]

- `jkear/kuzu-memory-graph-mcp` (0 stars): 8 tools, **explicit `confidence`
  parameter on relationships**. Only MCP with native confidence scoring in tool
  signature.
- `bobmatnyc/kuzu-memory` (22 stars): 6 cognitive memory types. Importance
  scoring 0-1. <3ms recall. Offline-first.

### 8. kepano/obsidian-skills — NOT a Graph Server [CONFIDENCE: HIGH]

21.4K stars. Collection of Claude Code skills for working with Obsidian vault
files (.md, .base, .canvas). **No MCP. No graph database. No knowledge graph.**
Created by Obsidian's creator for agent-vault interop. Irrelevant to T28 data
layer.

---

## Comparison Matrix

| System                   | Graph Type     | Windows             | Custom Types | Tags         | Confidence       | LongMemEval | Stars |
| ------------------------ | -------------- | ------------------- | ------------ | ------------ | ---------------- | ----------- | ----- |
| Graphiti+Kuzu            | Temporal KG    | pip+file (embedded) | Pydantic     | Custom field | Add as field     | 63.8%       | 24.6K |
| Graphiti+Neo4j           | Temporal KG    | Neo4j Desktop       | Pydantic     | Custom field | Add as field     | 63.8%       | 24.6K |
| mem0g                    | Entity graph   | Neo4j Desktop       | Limited      | No           | Edge threshold   | 68.4%       | 52.2K |
| rohitg00/AgentMemory     | BFS KG         | npx (Node.js)       | Implicit     | No           | Unverified       | 64%\*       | 586   |
| JordanMcCann/AgentMemory | Entity+BFS     | Explicit Win        | No           | No           | No               | 96.2%\*\*   | 7     |
| Ogham                    | Semantic graph | Docker              | No           | No           | No               | 91.8%       | 86    |
| Hindsight                | Entity graph   | Docker/pip          | No           | No           | No               | 91.4%       | N/A   |
| Neo4j agent-memory       | POLE+O KG      | .exe binary         | POLE+O       | Via Cypher   | Via Cypher       | N/A         | 115   |
| kuzu-memory-graph-mcp    | Property graph | pip (Win wheel)     | Flexible     | Observations | **Yes (native)** | N/A         | 0     |

\*Self-reported, not LongMemEval \*\*Solo claim, unverified

---

## Sources

| #     | Title                                                                                            | Type               | Trust       |
| ----- | ------------------------------------------------------------------------------------------------ | ------------------ | ----------- |
| 1-7   | Graphiti GitHub, Zep docs, FalkorDB docs, blog, drivers guide, custom types, FalkorDB Lite issue | Official           | HIGH        |
| 8-12  | mem0 GitHub, graph docs, self-hosted MCP, State of Memory 2026, Mem0 vs Zep                      | Official/community | HIGH        |
| 13-14 | rohitg00/agentmemory, JordanMcCann/agentmemory                                                   | GitHub             | MEDIUM      |
| 15    | Ogham MCP GitHub + benchmark                                                                     | GitHub             | MEDIUM-HIGH |
| 16    | Hindsight blog/docs                                                                              | Vendor             | MEDIUM-HIGH |
| 17    | Neo4j agent-memory GitHub                                                                        | Official           | HIGH        |
| 18-19 | Kuzu MCP repos                                                                                   | Community          | MEDIUM      |
| 20    | kepano/obsidian-skills                                                                           | GitHub             | HIGH        |

---

## Contradictions

1. **Graphiti "experimental" vs "production":** MCP server wrapper is
   experimental; core Python library is production-grade.
2. **mem0 graph pricing:** $249/mo for cloud only. Open-source graph is free.
3. **Kuzu archived vs usable:** PyPI package still installs. Graphiti still
   lists as supported driver.
4. **LongMemEval divergence:** 91.8% (Ogham) vs 63.8% (Graphiti) — measures QA
   recall, not relational reasoning.
5. **rohitg00 MEMORY.md sync:** Prominent in README, no independent verification
   found.

---

## Gaps

1. Graphiti+Kuzu on Windows 11 end-to-end: needs hands-on validation
2. rohitg00/agentmemory MEMORY.md sync: unverified
3. JordanMcCann 96.2% LongMemEval: extraordinary, 7 stars, no replication
4. Cognee MCP: insufficient detail for comparison

---

## Serendipity

1. **Graphiti supports Kuzu natively** — best Windows path without Docker
2. **FalkorDB Lite explicitly excludes Windows** (Linux/macOS only)
3. **jkear/kuzu-memory-graph-mcp has native `confidence` parameter** — only MCP
   with this
4. **neo4j-mcp.exe** is a standalone Windows binary — zero dependencies
5. **Zep Community Edition deprecated** — self-hosting = raw Graphiti + your own
   DB
6. **Two "agentmemory" repos** — must specify which in any T28 planning
