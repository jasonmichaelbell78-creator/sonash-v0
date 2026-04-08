### C-013 -- UNVERIFIABLE (MEDIUM)

**Claim:** No single existing MCP server provides all three T28 required
capabilities: flat tag API, per-node confidence, and contradiction detection
simultaneously.

**Method:** Web search + source review

**Evidence:** Neuromcp (glama.ai) has trust levels (confidence proxy),
contradiction detection, and tag support. Not definitively clear whether its tag
system qualifies as a flat tag API as specified. The official
@modelcontextprotocol/server-memory lacks all three (per C-011). Neuromcp is a
meaningful counter-candidate not assessed in the source material.

**Verdict rationale:** Cannot VERIFY because Neuromcp may satisfy all three.
Cannot REFUTE without a deeper Neuromcp capability audit.

---

### C-014 -- VERIFIED (HIGH)

**Claim:** Building a thin custom MCP layer over direct SQLite with 5-8 tools is
the lowest-risk v1 path.

**Method:** Architectural consensus from multiple web sources

**Evidence:** BasicMemory, Graphiti, and other knowledge graph systems converge
on SQLite as the reliable local store. Custom MCP approach avoids dependency on
third-party MCP servers (C-011, C-012 both note serious issues). No conflicting
evidence found.

---

### C-015 -- VERIFIED (HIGH)

**Claim:** Files are canonical, the graph is a derived and disposable index.
Seven independent production systems confirm.

**Method:** BasicMemory official documentation

**Evidence:** BasicMemory docs state explicitly: Markdown files are the source
of truth. The database is an index for search and graph traversal. Full rebuild
via bm sync confirmed. The seven-system count is not independently verified, but
the core invariant is confirmed.

Source: https://deepwiki.com/basicmachines-co/basic-memory

---

### C-016 -- VERIFIED (MEDIUM)

**Claim:** The SQLite database can be deleted at any time and rebuilt from
.research/ files under one second at T28 scale.

**Method:** BasicMemory sync architecture plus scale reasoning

**Evidence:** BasicMemory confirms full rebuild from files via sync. At T28
projected scale (18 SourceNodes, 167 KnowledgeNodes per C-041), a
single-transaction SQLite insert runs well under one second on modern hardware.
Medium confidence because sub-second is scale-derived reasoning, not a measured
T28-specific benchmark.

---

### C-017 -- VERIFIED (MEDIUM)

**Claim:** Every graph node must have a provenance trace to a file artifact via
an EXTRACTED_FROM edge. No graph-only data permitted.

**Method:** Provenance graph literature (PROV-DM, Springer survey)

**Evidence:** Provenance tracking via typed edges is a well-established
knowledge graph pattern (PROV-DM standard). The EXTRACTED_FROM edge follows the
prov:wasDerivedFrom pattern in RDF. Medium confidence -- well-supported pattern,
but no-graph-only-data enforcement is T28 internal policy.

---

### C-018 -- UNVERIFIABLE (LOW)

**Claim:** The correct T28 schema uses two node types: SourceNode (28 source
types via discriminator) and KnowledgeNode.

**Method:** External validation not possible

**Evidence:** T28-specific schema design decision. The two-node-type pattern is
reasonable and consistent with provenance-aware KG designs, but specific names
and the 28-source-types sub-claim cannot be verified against external ground
truth. T28 is pre-implementation; no codebase file defines this schema.

---

### C-019 -- REFUTED (HIGH)

**Claim:** A-MEM 7-field node pattern (keywords, tags, contextual_description,
embedding, content, valid_at, invalid_at) is the correct schema inspiration for
T28 KnowledgeNodes.

**Method:** A-MEM paper (arxiv 2502.12110) + GitHub repo (agiresearch/A-mem)

**Evidence:**

The A-MEM paper (NeurIPS 2025) formally defines the 7-field memory note as m_i =
{c_i, t_i, K_i, G_i, X_i, e_i, L_i}:

- c_i = content
- t_i = timestamp (single creation timestamp, NOT a validity window)
- K_i = keywords
- G_i = tags
- X_i = contextual_description
- e_i = embedding
- L_i = linked_memories (set of semantic link references)

The claim lists 7 fields as: keywords, tags, contextual_description, embedding,
content, valid_at, invalid_at.

valid_at and invalid_at are NOT in A-MEM schema. The actual 7th field is L_i
(linked_memories). The actual 2nd field is t_i (timestamp) -- a single creation
timestamp, not a temporal validity pair.

The claim incorrectly substitutes valid_at and invalid_at (from Graphiti
bi-temporal edge model) into A-MEM node schema. A-MEM is still a valid
inspiration for 5 confirmed fields (content, keywords, tags,
contextual_description, embedding). The attribution of valid_at/invalid_at to
A-MEM is the specific error.

Sources:

- https://arxiv.org/html/2502.12110v1
- https://github.com/agiresearch/A-mem

---

### C-020 -- UNVERIFIABLE (LOW)

**Claim:** T28 should use four edge types: LINKS_TO, CITES, MENTIONS,
SUPERSEDES. All edges include valid_at and invalid_at.

**Method:** External validation not possible for T28-specific names; temporal
fields independently verified

**Evidence:** The four named edge types are T28-specific design decisions -- no
external system defines exactly this set. The temporal fields valid_at and
invalid_at on edges ARE confirmed by Graphiti docs. The edge-type design is
reasonable but not externally validated as the correct schema.

Verdict rationale: The temporal field sub-claim is independently VERIFIED. The
specific four-edge-type design cannot be confirmed or refuted. Overall:
UNVERIFIABLE.

---

### C-021 -- VERIFIED (HIGH)

**Claim:** M2M junction table benchmark at 100K rows: single tag 1.41ms, AND(2
tags) 2.26ms. JSON array alternative 40-55ms.

**Method:** Primary source -- simonwillison.net + GitHub simonw/research
(March 2026)

**Evidence:** Simon Willison SQLite tags benchmark at 100K rows confirms:

- M2M tables, single tag: 1.41ms -- exact match to claim
- M2M tables, AND(2 tags): 2.26ms -- exact match to claim
- JSON no-index, single tag: 54.98ms -- within claimed 40-55ms range
- JSON no-index, AND(2 tags): 54.63ms -- within claimed 40-55ms range

All four numbers confirmed from primary source. The 40-55ms range is a slight
understatement (actual approx 55ms) but within claimed bounds.

Sources:

- https://simonwillison.net/2026/Mar/20/sqlite-tags-benchmark/
- https://github.com/simonw/research/tree/main/sqlite-tags-benchmark

---
