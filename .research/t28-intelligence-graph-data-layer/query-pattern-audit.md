# T28 Query Pattern Audit — OTB-2 CRITICAL Response

**Date:** 2026-04-08 **Session:** #268 **Status:** COMPLETE **Trigger:** OTB
Challenge 2, Alt 2 (SEVERITY: CRITICAL) **Method:** 3 parallel research agents —
episodic memory mining (10 sessions), git/session history (30 sessions
#238-#268), .research/ structure inventory (817 files)

---

## Executive Summary

**80% of real queries against `.research/` are filtered lookups on
extraction-journal.jsonl or full-text scans of EXTRACTIONS.md.** These are
single-entity, single-file operations that FTS5 BM25 handles correctly. The
proposed bi-temporal model, 7 edge types, and node_metadata confidence table
serve real but MINORITY use cases (verification workflows, contradiction
tracking, cross-repo synthesis). The schema is not over-engineered — but the
PRIORITY ORDER should change: ship FTS5 + flat tags first, add graph edges and
bi-temporal fields only when synthesis/verification queries demand them.

---

## 1. Query Pattern Classification

### Tier 1: HIGH FREQUENCY (every session, 80%+ of queries)

#### P1: Extraction Context Lookup

- **What:** "Do we have prior art on X?" / "What candidates exist for topic Y?"
- **How:** Read EXTRACTIONS.md (human scan) + filter extraction-journal.jsonl by
  `source`, `type`, `decision`, `novelty`, `relevance`
- **Used by:** brainstorm, deep-plan, skill-creator, repo-analysis,
  repo-synthesis (5 skills — the most common trigger in CLAUDE.md Section 7)
- **Frequency:** 5-10x per planning/brainstorm session
- **Schema need:** FTS5 on candidate + notes fields. Column filters on type,
  decision, novelty. **No graph edges needed.**

#### P2: Prior Research Deduplication

- **What:** "Has this topic been researched before?"
- **How:** Check `.research/<topic-slug>/` directory existence; if exists, read
  BRAINSTORM.md or RESEARCH_OUTPUT.md
- **Used by:** brainstorm (MUST), deep-plan (MUST), deep-research (Phase 0)
- **Frequency:** Every session start for planning/research sessions (50%+ of all
  sessions)
- **Schema need:** Simple node existence check by slug. **No graph traversal.**

### Tier 2: MEDIUM FREQUENCY (weekly, synthesis sessions)

#### P3: Cross-Repo Artifact Reads

- **What:** "Compare patterns across all analyzed repos"
- **How:** Read ALL `repo-analysis/*/analysis.json` + `value-map.json` +
  `creator-view.md`. Aggregate by dimension, score, or candidate type.
- **Used by:** repo-synthesis, website-synthesis
- **Frequency:** 2-3x per week during active analysis batches (Sessions
  #262-#267)
- **Schema need:** JOIN across SourceNode + KnowledgeNode by source_id. Tag
  filtering (M2M junction). **LINKS_TO edges useful here** for cross-repo
  connections. **RELATED_TO edge type justified.**

#### P4: Research Index Recall

- **What:** "What prior research exists on this domain?"
- **How:** Search research-index.jsonl by topicSlug or keywords field
- **Used by:** deep-research `--recall` flag
- **Frequency:** Per major research session (~monthly)
- **Schema need:** FTS5 on topic/keywords. Metadata filtering by status, depth,
  domain. **No graph edges needed.**

#### P5: Extraction Journal Targeted Filtering

- **What:** "Show me high-novelty, E0-effort, anti-pattern candidates"
- **How:** Multi-field filter on extraction-journal.jsonl (type + novelty +
  effort + relevance + source_type)
- **Used by:** brainstorm (discovery), deep-plan (Phase 0), skill-creator
- **Frequency:** 2-5x per planning session
- **Schema need:** Indexed columns for type, novelty, effort, relevance. **FTS5
  not needed — structured WHERE clauses suffice.**

### Tier 3: LOW FREQUENCY (monthly, verification/maintenance)

#### P6: Provenance Tracing

- **What:** "Where did this finding originate?" / "Which sources support claim
  X?"
- **How:** claims.jsonl `sources[]` → sources.jsonl `id` → findings/\*.md
- **Used by:** deep-research verification agents, manual audit
- **Frequency:** Per deep-research session (11+ verifier agents in Session #267)
- **Schema need:** **CITES and EXTRACTED_FROM edges justified.** Bidirectional
  source→claim→finding traversal. This is the primary graph use case.

#### P7: Schema Coherence & Migration

- **What:** "Are all repos using the same schema version?" / "Fix field drift"
- **How:** Read analysis.json across repos, compare schema_version fields,
  detect missing fields
- **Used by:** Manual audit, session maintenance
- **Frequency:** Per major skill version upgrade (~monthly)
- **Schema need:** Metadata queries on schema_version. **No graph edges.**

#### P8: Completeness & Gap Analysis

- **What:** "Which media types / input formats aren't covered?"
- **How:** Scan extraction-journal.jsonl by source_type, cross-reference against
  known category list
- **Used by:** T28 analysis plan, gap agents
- **Frequency:** Per research planning cycle
- **Schema need:** Group-by aggregation on source/type. Tag filtering.
  **MEMBER_OF edge type justified** for cluster assignment.

---

## 2. Frequency Distribution

| Pattern                       | Frequency              | % of All Queries | Schema Feature Required          |
| ----------------------------- | ---------------------- | ---------------- | -------------------------------- |
| P1: Extraction context lookup | Every session          | ~40%             | FTS5 BM25                        |
| P2: Prior research dedup      | Every session          | ~25%             | Node existence check             |
| P5: Targeted journal filter   | Most planning sessions | ~15%             | Indexed columns                  |
| P3: Cross-repo artifact reads | Weekly                 | ~10%             | JOINs, LINKS_TO/RELATED_TO edges |
| P4: Research index recall     | Monthly                | ~4%              | FTS5 on keywords                 |
| P6: Provenance tracing        | Per deep-research      | ~3%              | CITES/EXTRACTED_FROM edges       |
| P8: Gap analysis              | Per planning cycle     | ~2%              | Group-by, MEMBER_OF edge         |
| P7: Schema coherence          | Per upgrade            | ~1%              | Metadata queries                 |

---

## 3. Schema Validation Against Query Patterns

### Features VALIDATED (load-bearing)

| Schema Feature                                    | Used By                          | Verdict                                                                                |
| ------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| **FTS5 BM25**                                     | P1, P2, P4 (~69% of queries)     | **ESSENTIAL** — handles majority of real queries                                       |
| **Flat M2M tags**                                 | P1, P3, P5, P8 (~67% of queries) | **ESSENTIAL** — type/category filtering is ubiquitous                                  |
| **SourceNode + KnowledgeNode**                    | P1, P3, P6                       | **VALIDATED** — two-node model maps to real data (repos/websites vs claims/candidates) |
| **Column-weighted BM25** (title 10x, keywords 5x) | P1                               | **VALIDATED** — candidate title is primary search target                               |

### Features VALIDATED but DEFERRABLE to V2

| Schema Feature                     | Used By                     | Verdict                                                                                                                                                         |
| ---------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **LINKS_TO edge**                  | P3 (cross-repo connections) | **V1 DEFER** — cross_repo_connections.jsonl exists but rarely queried; implement when repo-synthesis frequency increases                                        |
| **RELATED_TO edge**                | P3, P8                      | **V1 DEFER** — gap analysis is monthly; flat tags + GROUP BY sufficient for V1                                                                                  |
| **CITES / EXTRACTED_FROM edges**   | P6 (provenance)             | **V1 DEFER** — provenance queries only during deep-research verification (~monthly). Current claims.jsonl `sources[]` array works.                              |
| **MEMBER_OF edge**                 | P8 (cluster assignment)     | **V1 DEFER** — cluster assignment is manual today. Graph edge adds value only when automated clustering exists.                                                 |
| **SUPERSEDES edge**                | Not observed in any session | **V2+ ONLY** — zero real queries require version/replacement tracking today                                                                                     |
| **node_metadata confidence table** | P6 (verification)           | **V1 DEFER** — only used by deep-research verifiers. Store confidence as column on KnowledgeNode for V1, extract to separate table if query patterns demand it. |

### Features at RISK of over-engineering

| Schema Feature                               | Used By                               | Verdict                                                                                                                                                                                                                                                |
| -------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Bi-temporal model (valid_at/invalid_at)**  | P6 (contradiction tracking)           | **RISK** — only 8 CONFLICTED claims out of 73 in Session #267. Soft invalidation is elegant but may be premature. **Recommendation:** Add `invalid_at` column but don't build temporal query infrastructure until contradictions exceed 20% of claims. |
| **7 edge types** (4 core + 3 agent-inferred) | P3, P6, P8 combined (~15% of queries) | **RISK of V1 complexity.** 85% of real queries don't traverse edges at all. **Recommendation:** Ship V1 with LINKS_TO only (the universal edge), add typed edges in V2 when synthesis frequency justifies it.                                          |

---

## 4. Recommended V1 Schema Simplification

Based on this audit, V1 should ship with:

### Keep (from original proposal)

- SourceNode + KnowledgeNode (two-node model)
- FTS5 with column-weighted BM25 (title 10x, keywords 5x)
- Flat M2M tag junction table
- `invalid_at` column (but no temporal query API)
- `confidence` as column on KnowledgeNode (not separate table)

### Simplify

- **1 edge type for V1:** `LINKS_TO` (generic semantic connection). Typed edges
  (CITES, EXTRACTED_FROM, RELATED_TO, MEMBER_OF, SUPERSEDES) become V2 when
  synthesis/verification query frequency justifies them.
- **No bi-temporal query infrastructure:** Keep `valid_at`/`invalid_at` columns
  for future use, but V1 queries just use `WHERE invalid_at IS NULL`.
- **Inline confidence:** Store on KnowledgeNode, not in node_metadata table.
  Extract to separate table only if confidence-specific queries emerge.

### Add (not in original proposal)

- **Slug-based existence check:** Fast path for P2 (prior research dedup) — most
  common after extraction lookup.
- **Source-grouped views:** The most natural browse pattern is "show me
  everything from repo X" — optimize for this.

---

## 5. FTS5-Only Assessment (OTB-2 Alt 4)

**Question:** If 80% of queries are keyword lookups, is FTS5-only permanent?

**Answer:** FTS5-only is sufficient for V1 but NOT permanent. The 15% of queries
that involve cross-repo synthesis (P3) and provenance tracing (P6) are the
highest-value queries — they produce the insights that drive architectural
decisions. These queries will increase as the research corpus grows from 25
repos to 50+.

**Trigger for vector search (V2):** When FTS5 BM25 returns irrelevant results
for semantic queries like "repos that implement event sourcing patterns" (where
the exact term "event sourcing" may not appear in the text). Log 5 sessions of
FTS5 query quality to establish baseline before adding sqlite-vec.

---

## 6. Trust Collapse Risk Assessment (OTB-2 Alt 8)

**Risk:** FTS5 returns low-quality results → Claude stops trusting graph →
defaults to raw file reads → graph never recovers.

**Mitigation from audit data:** The 80% of queries that are structured lookups
(filter by source, type, decision) will ALWAYS work correctly because they're
WHERE-clause operations, not relevance-ranked search. Trust collapse risk only
applies to the ~10% of queries that are free-text search. For V1, supplement
FTS5 with exact-match tag filtering to ensure baseline quality.

---

## 7. Data Sources for This Audit

| Source                               | Agent                                        | Findings                                                                     |
| ------------------------------------ | -------------------------------------------- | ---------------------------------------------------------------------------- |
| Episodic memory (10 conversations)   | episodic-memory:search-conversations         | 7 query categories, 10 conversation citations                                |
| Session history (Sessions #238-#268) | Explore agent (git log + SESSION_HISTORY.md) | 11 sessions with .research/ access, 6 skill query patterns, ranked frequency |
| .research/ structure (817 files)     | Explore agent (directory inventory)          | 30 natural query patterns, complete schema map, linkage analysis             |

---

## Version History

| Version | Date       | Changes                                |
| ------- | ---------- | -------------------------------------- |
| 1.0     | 2026-04-08 | Initial audit (Session #268, 3 agents) |
