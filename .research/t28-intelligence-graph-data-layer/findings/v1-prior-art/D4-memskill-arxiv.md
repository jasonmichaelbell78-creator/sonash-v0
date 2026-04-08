# D4: MemSkill arXiv 2602.02474 + Related Agent Memory Architectures

**Searcher:** deep-research-searcher | **Profile:** academic+web | **Date:**
2026-04-07 **Sources:** 11 | **Confidence:** HIGH:8, MEDIUM:6, LOW:1,
UNVERIFIED:1

---

## MemSkill Core Thesis [HIGH]

Memory operations should be **learnable, evolvable skills** — not fixed
Insert/Update/Delete rules. The "meta-memory" paradigm: instructions about what
to extract, how to remember, what to forget.

**Two storage structures:**

- **Trace-Specific Memory Bank:** Flat retrievable items per conversation.
  INSERT/UPDATE/DELETE/SKIP.
- **Skill Bank:** Structured entries with title, purpose, when_to_use,
  how_to_apply, constraints, action_type. Evolves via Designer component's
  hard-case feedback loop.

**Retrieval:** Dense only (Contriever). Top-20 per span. No BM25, no graph
traversal.

## CRITICAL CORRECTION: "Dual-Embedding Memory Bank" [HIGH]

**This term does NOT appear in the paper.** The mechanism is a single shared
embedding space (one model, two input types). The "dual-embedding" framing in
the brainstorm was a mischaracterization. Brainstorm decision #9 should be
updated.

## MemSkill Is NOT a Graph Schema Reference [HIGH]

MemSkill uses flat memory items, NOT an entity/relation schema. For T28's
Intelligence Graph schema, **Zep/Graphiti and MAGMA are far more applicable.**

---

## Most Applicable Architecture: Zep/Graphiti (arXiv:2501.13956) [HIGH]

Production implementation. 24,600+ stars. Apache 2.0.

**Key patterns for T28:**

1. **Bi-temporal modeling:** Two timestamps per fact — `t_valid` (when true) and
   `t_created`/`t_expired` (when entered/left system). Essential for evolving
   knowledge.
2. **Three-tier node hierarchy:** Episodes (raw sources) → Entities (extracted
   concepts) → Communities (clustered domains). Maps to T28's information
   pyramid.
3. **Hybrid retrieval trinity:** Semantic (cosine) + Lexical (BM25) + Graph
   traversal (BFS from anchors), combined via Reciprocal Rank Fusion (RRF).
4. **Non-destructive contradiction:** Old edges get `t_invalid` set, not
   deleted. Audit trail preserved.
5. **Entity deduplication:** Embed names → cosine search → full-text search →
   LLM resolver → canonical form.
6. **Empirical results:** 18.5% accuracy gain over full-context on LongMemEval,
   90% latency reduction.

## MAGMA (arXiv:2601.03236) — Most Ambitious [HIGH]

**Orthogonal graph decomposition:** 4 separate graphs (temporal, causal,
semantic, entity) over the same node set. Intent-aware retrieval: "Why?" →
causal graph, "When?" → temporal graph.

**Unified event-node:** `n_i = <content, timestamp, embedding, metadata>` —
minimal but extensible.

**Results:** 45.5% reasoning accuracy gain, 95% token reduction. Research
prototype — no production implementation found.

## A-MEM (arXiv:2502.12110) — Bidirectional Evolution [HIGH]

**Multi-attribute node:** content + keywords + tags + contextual description +
embedding + links.

**Key pattern:** New node insertions trigger regeneration of semantically linked
existing nodes' contextual attributes. Memory self-organizes as information
arrives. Transferable to T28.

## Transferable Patterns Summary

| #   | Pattern                                       | Source   | T28 Application                 |
| --- | --------------------------------------------- | -------- | ------------------------------- |
| 1   | Skill-as-schema (learnable extraction rules)  | MemSkill | Extraction pattern evolution    |
| 2   | Bi-temporal modeling                          | Graphiti | Track when facts change         |
| 3   | Episodes → Entities → Communities             | Graphiti | T28 information hierarchy       |
| 4   | Hybrid retrieval (semantic+lexical+graph+RRF) | Graphiti | T28 search across graph         |
| 5   | Non-destructive contradiction                 | Graphiti | Source conflict handling        |
| 6   | Entity dedup pipeline                         | Graphiti | Prevent duplicate nodes         |
| 7   | Orthogonal graph decomposition                | MAGMA    | Intent-aware traversal          |
| 8   | Multi-attribute nodes                         | A-MEM    | Rich node metadata              |
| 9   | Bidirectional evolution                       | A-MEM    | Self-organizing graph           |
| 10  | Hard-case driven evolution                    | MemSkill | Quality feedback loop           |
| 11  | Span-level processing                         | MemSkill | Batch content before extracting |

## Papers to Read (Not Fetched)

- **ByteRover (2604.01599)** — April 2026, agent-native hierarchical context
- **REMI (2509.06269)** — Causal schema memory for personal agents
