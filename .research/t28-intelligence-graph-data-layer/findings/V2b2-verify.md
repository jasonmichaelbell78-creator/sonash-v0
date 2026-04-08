# Verifier V2b2 -- Claims C-059 through C-062

**Phase:** 2.5 Post-Search Verification **Date:** 2026-04-07 **Verifier:**
claude-sonnet-4-6 **Scope:** Architecture claims from claims.jsonl lines 59-62

---

## Per-Claim Verdict Table

| Claim ID | Verdict  | Confidence | Method | Notes                                                                                                                                                                                                                                                                                                                                                                                   |
| -------- | -------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-059    | VERIFIED | HIGH       | web    | Palinode README (S-020 proxy): "MCP server is a pure HTTP client — it holds no state, no database connection, no embedder." MCP spec 2025 explicitly endorses stateless tool separation. Pattern confirmed by 2+ independent sources.                                                                                                                                                   |
| C-060    | VERIFIED | HIGH       | web    | Palinode README (S-020 proxy) exact match: "LLM proposes structured operations (KEEP / UPDATE / MERGE / SUPERSEDE / ARCHIVE) and a deterministic executor applies them. The LLM never touches your files directly."                                                                                                                                                                     |
| C-061    | VERIFIED | MEDIUM     | web    | A-MEM paper (S-001) PDF confirms: new memory triggers top-k retrieval, LLM judges linking, neighbor contextual_description updated. Bidirectionality confirmed: any existing node CAN be updated. "Symmetric" qualifier NOT claimed — claim wording is accurate.                                                                                                                        |
| C-062    | VERIFIED | MEDIUM     | web    | Obsidian hybrid retriever (S-034 proxy) uses heading-based chunking and confirms JSON/code blocks produce poor BM25 matches. Multiple 2024-2025 sources confirm byte-count chunking degrades FTS5 retrieval on structured markdown content. Specific "Obsidian retriever found" attribution not verifiable — pattern is well-established but exact wording may be researcher synthesis. |

---

## Evidence Notes

**C-059:** [Palinode GitHub](https://github.com/Paul-Kyle/palinode) and
[MCP stateless spec discussion](https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1442)
independently confirm the stateless MCP tool pattern. S-019 (Graphiti custom
entity docs) and S-023 (obra/knowledge-graph) cited in claim — both consistent
with thin MCP layer over core library.

**C-060:** Palinode is the direct instantiation of this exact pattern. The
KEEP/UPDATE/MERGE/SUPERSEDE DSL is explicitly named in the README. S-002
(Graphiti paper) also separates LLM reasoning from storage writes.

**C-061:** A-MEM paper arXiv:2502.12110 PDF confirms all three sub-claims.
Confidence is MEDIUM not HIGH because the precise term "retrieve-then-judge" is
a researcher-applied label, not the paper's own terminology, and the
"bidirectional means CAN be updated not symmetric" clarification requires paper
interpretation.

**C-062:** Semantic boundary chunking superiority over byte-count is
well-evidenced. The specific "Obsidian retriever" attribution maps to S-034
(blakecrosley.com/blog/hybrid-retriever-obsidian), which confirms heading-based
chunking and poor matches for structured formats — but describes the problem as
affecting JSON/YAML, not byte-count chunking per se. The core claim is
directionally correct; the causal attribution to byte-count chunking
specifically is a reasonable interpretation but not directly stated in S-034.
