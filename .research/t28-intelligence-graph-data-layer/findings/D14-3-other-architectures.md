# Findings: Palinode, LightRAG, and Other Production Architecture Patterns

**Searcher:** deep-research-searcher | **Date:** 2026-04-07 | **Sub-Question:**
D14-3

---

## Summary

6 production systems analyzed + 10 universal architectural principles extracted
from 7+ independent systems. LightRAG's Recog-Prof-Dedupe extraction pipeline
and union-append updates are directly adoptable. Palinode:
git-commit-per-compaction, stateless MCP, graceful degradation ("if every
service crashes, cat still works"). IWE: graph emerging from markdown structure
via inclusion-links. sqlite-memory: two-phase sync with SAVEPOINT atomicity.
Obsidian retriever: RRF k=60, 500-token cap, credential filtering, production at
16,894 files. notebooklm-py: autonomy rules, skill install, three-surface
architecture.

---

## 10 Universal Principles (All Systems Converge)

1. **Files canonical, indexes derived** — universal
2. **Content-hash dedup** before re-processing (~90% savings)
3. **Single write path** — files first, then index
4. **Hybrid retrieval** (BM25+vector+RRF) over pure anything
5. **Graceful degradation** — embedding fails → FTS5 → filesystem → cat
6. **LLM proposes, deterministic executor applies** — separate reasoning from
   mutation
7. **Git-tracked files, gitignored indexes** (.db, .db-wal, .db-shm)
8. **Stateless MCP layer** — no DB connections, no embedding logic in MCP
9. **Chunk at semantic boundaries** (headings, paragraphs), not byte count
10. **Incremental via union/append**, full rebuild is exception

---

## Key System Findings

### Palinode [CONFIDENCE: HIGH]

Files canonical, SQLite (sqlite-vec + FTS5) derived. Content-hash dedup (~90%
savings). LLM proposes KEEP/UPDATE/MERGE/SUPERSEDE/ARCHIVE → deterministic
executor → git commit per compaction. MCP is stateless HTTP proxy. "If every
service crashes, cat still works."

### LightRAG (EMNLP 2025) [CONFIDENCE: HIGH]

Three-step extraction: Recog (entities+relations) → Prof (KV profiles for each)
→ Dedupe (merge across chunks). Dual-level retrieval: low-level (entity keywords
→ exact nodes) + high-level (theme keywords → multi-hop relations). Incremental:
union append, no full rebuild. <100 tokens/query vs GraphRAG's 610K.

**Critical lesson:** Do NOT use community-based traversal (GraphRAG) for
synthesis. Use entity-level KV indexing + dual keyword matching. Allows daily
additions without re-indexing history.

### IWE [CONFIDENCE: HIGH]

Graph IS the markdown. Inclusion-link syntax (link alone on own line =
parent-child hierarchy). Polyhierarchy without file duplication. "All
modifications through direct Markdown editing." LSP integration
(go-to-definition, find-references, rename). No database, no index.

### sqlite-memory [CONFIDENCE: HIGH]

Two-phase sync: Phase 1 cleanup orphans → Phase 2 scan (new: ingest,
modified/hash-mismatch: atomic replace, unchanged: skip). SAVEPOINT transaction
wrapping. Idempotent — safe on every session start. CRDT for multi-agent offline
sync.

### Obsidian Hybrid Retriever (16,894 files) [CONFIDENCE: HIGH]

Three layers: Intake (scoring pipeline, auto-route ≥0.55) → Retrieval (FTS5 +
Model2Vec 256d + RRF k=60) → Integration (Claude Code hooks, 500-token cap).
83MB SQLite, 23ms end-to-end. Credential filtering (21 vendor + 11 generic
patterns). Honest failure modes: BM25 rewards term frequency, structured data
produces poor matches, no recency weighting.

### notebooklm-py [CONFIDENCE: HIGH]

Autonomy Rules pattern (22 auto-run + 7 ask-first per command). Skill install
mechanism (version stamping, drift detection). RPC health monitoring (daily
cron). Three-surface architecture: library → CLI → SKILL.md.

---

## Sources

24 sources: official repos (Palinode, LightRAG, IWE, sqlite-memory),
arXiv:2410.05779, blakecrosley.com, internal codebase analysis. HIGH confidence
throughout.

---

## Serendipity

1. **OpenClaw "flush before discard"** — force memory write before compaction
   removes context
2. **500-token injection cap** enables prompt caching — T28 should adopt
3. **Mem0 benchmark: 26K tokens + 17s (full-context) vs 6% accuracy loss + 91%
   lower latency (selective)** — never inject full graph
4. **"The memory system is really an ownership model + a rehydration API + a few
   invariants"** — T28's design philosophy in one sentence
